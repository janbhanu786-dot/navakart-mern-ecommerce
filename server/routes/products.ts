import crypto from 'crypto';
import { Router, type Response } from 'express';
import {
  requireAdmin,
  requireAuth,
  type AuthenticatedRequest,
} from '../middleware/auth.ts';
import {
  addProductReview,
  createProduct,
  deleteProduct,
  getProductById,
  listProducts,
  updateProduct,
  VALID_CATEGORIES,
} from '../services/repository.ts';
import type { ProductCategory, ProductRecord, ProductVariant } from '../types.ts';

const router = Router();

function isSafeImagePath(url: string): boolean {
  const trimmed = url.trim();
  if (trimmed.startsWith('/src/assets/')) return true;
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

router.get('/', async (req, res: Response) => {
  try {
    const category = typeof req.query.category === 'string' ? req.query.category : undefined;
    const search = typeof req.query.search === 'string' ? req.query.search : undefined;
    const sort = typeof req.query.sort === 'string' ? req.query.sort : undefined;
    const products = await listProducts({ category, search, sort });
    res.json({ products });
  } catch (err) {
    res.status(500).json({ error: 'Unable to load catalog', details: (err as Error).message });
  }
});

router.get('/:id', async (req, res: Response) => {
  try {
    const product = await getProductById(String(req.params.id));
    if (!product) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }
    res.json({ product });
  } catch (err) {
    res.status(500).json({ error: 'Unable to load product', details: (err as Error).message });
  }
});

router.post('/', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const body = req.body as Record<string, unknown>;
    const title = typeof body.title === 'string' ? body.title.trim() : '';
    const category = typeof body.category === 'string' ? body.category.trim() : '';
    const price = Number(body.price);
    const description = typeof body.description === 'string' ? body.description.trim() : '';
    const materials = typeof body.materials === 'string' ? body.materials.trim() : 'Handcrafted Studio Material';
    const dimensions = typeof body.dimensions === 'string' ? body.dimensions.trim() : 'Standard Studio Size';
    const image = typeof body.image === 'string' ? body.image.trim() : '/src/assets/images/dress_festive_kurti_1795424696363.jpg';
    const accentHex = typeof body.accentHex === 'string' && /^#[0-9a-fA-F]{6}$/.test(body.accentHex.trim())
      ? body.accentHex.trim()
      : '#BE185D';
    const tag = typeof body.tag === 'string' && body.tag.trim() ? body.tag.trim().slice(0, 24) : undefined;
    const stock = Math.max(0, Math.floor(Number(body.stock ?? 10)));
    const variantName = typeof body.variantName === 'string' && body.variantName.trim()
      ? body.variantName.trim()
      : 'Standard Edition';

    if (!title || title.length < 3 || title.length > 100) {
      res.status(400).json({ error: 'Product title must be between 3 and 100 characters' });
      return;
    }
    if (!VALID_CATEGORIES.includes(category as ProductCategory)) {
      res.status(400).json({ error: 'Invalid product category' });
      return;
    }
    if (!Number.isFinite(price) || price <= 0 || price > 250000) {
      res.status(400).json({ error: 'Price must be a valid positive number' });
      return;
    }
    if (!description || description.length < 10) {
      res.status(400).json({ error: 'Description must be at least 10 characters' });
      return;
    }
    if (!isSafeImagePath(image)) {
      res.status(400).json({ error: 'Invalid image path or URL' });
      return;
    }

    const id = `prod_${crypto.randomBytes(5).toString('hex')}`;
    const slug = `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}-${id.slice(-4)}`;
    const sku = `NK-${category.slice(0, 3).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;

    const variants: ProductVariant[] = [
      {
        id: `v_${crypto.randomBytes(4).toString('hex')}`,
        name: variantName,
        hex: accentHex,
        stock,
      },
    ];

    const record: ProductRecord = {
      id,
      sku,
      slug,
      title,
      category: category as ProductCategory,
      price: Math.round(price * 100) / 100,
      description,
      materials,
      dimensions,
      image,
      accentHex,
      tag,
      featured: true,
      rating: 5.0,
      reviewCount: 0,
      variants,
      reviews: [],
      createdAt: new Date().toISOString(),
    };

    const created = await createProduct(record);
    res.status(201).json({ product: created });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create product', details: (err as Error).message });
  }
});

router.put('/:id', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = String(req.params.id);
    const existing = await getProductById(id);
    if (!existing) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }

    const body = req.body as Record<string, unknown>;
    const patch: Partial<ProductRecord> = {};

    if (typeof body.title === 'string' && body.title.trim().length >= 3) {
      patch.title = body.title.trim();
    }
    if (typeof body.price !== 'undefined') {
      const price = Number(body.price);
      if (!Number.isFinite(price) || price <= 0) {
        res.status(400).json({ error: 'Price must be positive' });
        return;
      }
      patch.price = Math.round(price * 100) / 100;
    }
    if (typeof body.stock !== 'undefined') {
      const stock = Math.floor(Number(body.stock));
      if (!Number.isFinite(stock) || stock < 0) {
        res.status(400).json({ error: 'Stock cannot be negative' });
        return;
      }
      patch.variants = existing.variants.map((v, index) =>
        index === 0 ? { ...v, stock } : v,
      );
    }
    if (typeof body.description === 'string' && body.description.trim().length >= 10) {
      patch.description = body.description.trim();
    }

    const updated = await updateProduct(id, patch);
    res.json({ product: updated });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update product', details: (err as Error).message });
  }
});

router.delete('/:id', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const deleted = await deleteProduct(String(req.params.id));
    if (!deleted) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete product', details: (err as Error).message });
  }
});

router.post('/:id/reviews', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const body = req.body as Record<string, unknown>;
    const rating = Number(body.rating);
    const comment = typeof body.comment === 'string' ? body.comment.trim() : '';

    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      res.status(400).json({ error: 'Rating must be an integer between 1 and 5' });
      return;
    }
    if (comment.length < 4 || comment.length > 600) {
      res.status(400).json({ error: 'Review comment must be between 4 and 600 characters' });
      return;
    }

    const updated = await addProductReview(String(req.params.id), {
      id: `rev_${crypto.randomBytes(5).toString('hex')}`,
      authorName: req.user?.name || 'Verified Customer',
      rating,
      comment,
      createdAt: new Date().toISOString(),
    });

    if (!updated) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }
    res.status(201).json({ product: updated });
  } catch (err) {
    res.status(500).json({ error: 'Failed to submit review', details: (err as Error).message });
  }
});

export default router;
