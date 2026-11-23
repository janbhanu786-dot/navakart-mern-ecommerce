import crypto from 'crypto';
import { Router, type Response } from 'express';
import {
  optionalAuth,
  requireAdmin,
  requireAuth,
  type AuthenticatedRequest,
} from '../middleware/auth.ts';
import {
  createOrder,
  decrementVariantStock,
  findOrderByNumber,
  getNextOrderNumber,
  getProductById,
  listOrders,
  listOrdersByUser,
  updateOrderStatus,
} from '../services/repository.ts';
import type { OrderItemRecord, OrderStatus, PaymentMethod } from '../types.ts';

const router = Router();

const VALID_STATUSES: OrderStatus[] = [
  'Confirmed',
  'Preparing Shipment',
  'Shipped',
  'Delivered',
  'Cancelled',
];

const FREE_SHIPPING_THRESHOLD = 499;
const STANDARD_SHIPPING_FEE = 49;

router.post('/', optionalAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const body = req.body as Record<string, unknown>;
    const rawItems = Array.isArray(body.items) ? body.items : [];
    const shippingRaw = (body.shippingAddress ?? {}) as Record<string, unknown>;
    const paymentMethod: PaymentMethod = body.paymentMethod === 'COD' ? 'COD' : 'CARD';
    const promoCode = typeof body.promoCode === 'string' ? body.promoCode.trim().toUpperCase() : '';

    if (rawItems.length === 0) {
      res.status(400).json({ error: 'Your shopping bag is empty' });
      return;
    }

    const fullName = typeof shippingRaw.fullName === 'string' ? shippingRaw.fullName.trim() : '';
    const email = typeof shippingRaw.email === 'string' ? shippingRaw.email.trim().toLowerCase() : '';
    const phone = typeof shippingRaw.phone === 'string' ? shippingRaw.phone.trim() : '';
    const address = typeof shippingRaw.address === 'string' ? shippingRaw.address.trim() : '';
    const city = typeof shippingRaw.city === 'string' ? shippingRaw.city.trim() : '';
    const postalCode = typeof shippingRaw.postalCode === 'string' ? shippingRaw.postalCode.trim() : '';

    if (
      fullName.length < 2 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
      phone.length < 7 ||
      address.length < 5 ||
      city.length < 2 ||
      postalCode.length < 3
    ) {
      res.status(400).json({ error: 'Please complete all shipping address and contact fields' });
      return;
    }

    const verifiedItems: OrderItemRecord[] = [];
    const stockAdjustments: Array<{ productId: string; variantId: string; quantity: number }> = [];

    for (const entry of rawItems) {
      if (!entry || typeof entry !== 'object') {
        res.status(400).json({ error: 'Invalid bag item format' });
        return;
      }
      const itemObj = entry as Record<string, unknown>;
      const productId = typeof itemObj.productId === 'string' ? itemObj.productId : '';
      const variantId = typeof itemObj.variantId === 'string' ? itemObj.variantId : '';
      const quantity = Math.floor(Number(itemObj.quantity));

      if (!productId || !variantId || !Number.isFinite(quantity) || quantity < 1 || quantity > 20) {
        res.status(400).json({ error: 'Invalid product or quantity in bag' });
        return;
      }

      const product = await getProductById(productId);
      if (!product) {
        res.status(404).json({ error: 'One or more products are no longer available' });
        return;
      }

      const variant = product.variants.find((v) => v.id === variantId) ?? product.variants[0];
      if (!variant) {
        res.status(400).json({ error: `Variant unavailable for ${product.title}` });
        return;
      }
      if (variant.stock < quantity) {
        res.status(409).json({
          error: `Only ${variant.stock} left in stock for ${product.title} (${variant.name})`,
        });
        return;
      }

      verifiedItems.push({
        productId: product.id,
        variantId: variant.id,
        variantName: variant.name,
        title: product.title,
        image: product.image,
        unitPrice: product.price,
        quantity,
      });

      stockAdjustments.push({ productId: product.id, variantId: variant.id, quantity });
    }

    const subtotal =
      Math.round(
        verifiedItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0) * 100,
      ) / 100;

    let discountAmount = 0;
    let appliedCode: string | undefined;
    if (promoCode === 'WELCOME10') {
      discountAmount = Math.round(subtotal * 0.1 * 100) / 100;
      appliedCode = 'WELCOME10';
    } else if (promoCode === 'NAVA15' && subtotal >= 999) {
      discountAmount = Math.round(subtotal * 0.15 * 100) / 100;
      appliedCode = 'NAVA15';
    }

    const discountedSubtotal = Math.max(0, subtotal - discountAmount);
    const shippingFee = discountedSubtotal >= FREE_SHIPPING_THRESHOLD ? 0 : STANDARD_SHIPPING_FEE;
    const total = Math.round((discountedSubtotal + shippingFee) * 100) / 100;

    const orderNumber = await getNextOrderNumber();
    const now = new Date().toISOString();

    const created = await createOrder({
      id: `ord_${crypto.randomBytes(6).toString('hex')}`,
      orderNumber,
      userId: req.user?.sub,
      items: verifiedItems,
      subtotal,
      discountCode: appliedCode,
      discountAmount,
      shippingFee,
      total,
      paymentMethod,
      status: 'Confirmed',
      shippingAddress: {
        fullName,
        email,
        phone,
        address,
        city,
        postalCode,
      },
      createdAt: now,
      updatedAt: now,
    });

    await decrementVariantStock(stockAdjustments);

    res.status(201).json({ order: created });
  } catch (err) {
    res.status(500).json({ error: 'Unable to place order', details: (err as Error).message });
  }
});

router.get('/track/:orderNumber', async (req, res: Response) => {
  try {
    const orderNumber = String(req.params.orderNumber || '').trim();
    const contact = typeof req.query.contact === 'string' ? req.query.contact.trim().toLowerCase() : '';

    if (!orderNumber || !contact) {
      res.status(400).json({ error: 'Enter both your order number and email or phone number' });
      return;
    }

    const order = await findOrderByNumber(orderNumber);
    if (!order) {
      res.status(404).json({ error: 'No matching order found' });
      return;
    }

    const emailMatch = order.shippingAddress.email.toLowerCase() === contact;
    const cleanPhone = order.shippingAddress.phone.replace(/\D/g, '');
    const cleanContact = contact.replace(/\D/g, '');
    const phoneMatch = cleanContact.length >= 4 && cleanPhone.endsWith(cleanContact);

    if (!emailMatch && !phoneMatch) {
      res.status(403).json({ error: 'Order number and contact details do not match' });
      return;
    }

    res.json({ order });
  } catch (err) {
    res.status(500).json({ error: 'Order lookup failed', details: (err as Error).message });
  }
});

router.get('/my', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const orders = await listOrdersByUser(req.user!.sub);
    res.json({ orders });
  } catch (err) {
    res.status(500).json({ error: 'Unable to fetch your orders', details: (err as Error).message });
  }
});

router.get('/', requireAdmin, async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const orders = await listOrders();
    res.json({ orders });
  } catch (err) {
    res.status(500).json({ error: 'Unable to fetch orders', details: (err as Error).message });
  }
});

router.patch('/:id/status', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const body = req.body as Record<string, unknown>;
    const status = typeof body.status === 'string' ? (body.status as OrderStatus) : null;
    if (!status || !VALID_STATUSES.includes(status)) {
      res.status(400).json({ error: 'Invalid order status' });
      return;
    }
    const updated = await updateOrderStatus(String(req.params.id), status);
    if (!updated) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }
    res.json({ order: updated });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update order status', details: (err as Error).message });
  }
});

export default router;
