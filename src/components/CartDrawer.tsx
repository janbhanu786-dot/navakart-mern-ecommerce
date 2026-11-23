import { useEffect, useState, type FormEvent } from 'react';
import {
  CheckCircle2,
  CreditCard,
  Minus,
  Plus,
  ShoppingBag,
  Trash2,
  Truck,
  Wallet,
  X,
} from 'lucide-react';
import { apiRequest, formatCurrency } from '../lib/api';
import { SafeImage } from './SafeImage';
import type { AuthUser, CartItem, Order, PaymentMethod } from '../types';

interface CartDrawerProps {
  open: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQty: (productId: string, variantId: string, qty: number) => void;
  onRemoveItem: (productId: string, variantId: string) => void;
  onClearCart: () => void;
  authToken: string | null;
  authUser: AuthUser | null;
  onOrderPlaced: (order: Order) => void;
  onViewOrderTracking: (orderNumber: string, contact: string) => void;
}

const FREE_SHIPPING_THRESHOLD = 499;
const STANDARD_SHIPPING_FEE = 49;

export function CartDrawer({
  open,
  onClose,
  items,
  onUpdateQty,
  onRemoveItem,
  onClearCart,
  authToken,
  authUser,
  onOrderPlaced,
  onViewOrderTracking,
}: CartDrawerProps) {
  const [step, setStep] = useState<'bag' | 'checkout' | 'receipt'>('bag');
  const [promoInput, setPromoInput] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<string>('');
  const [promoMessage, setPromoMessage] = useState<string | null>(null);

  const [fullName, setFullName] = useState(authUser?.name ?? '');
  const [email, setEmail] = useState(authUser?.email ?? '');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('COD');

  const [submitting, setSubmitting] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [confirmedOrder, setConfirmedOrder] = useState<Order | null>(null);

  useEffect(() => {
    if (authUser) {
      setFullName((prev) => prev || authUser.name);
      setEmail((prev) => prev || authUser.email);
    }
  }, [authUser]);

  if (!open) return null;

  const subtotal = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);

  let discount = 0;
  if (appliedPromo === 'WELCOME10') {
    discount = Math.round(subtotal * 0.1 * 100) / 100;
  } else if (appliedPromo === 'NAVA15' && subtotal >= 999) {
    discount = Math.round(subtotal * 0.15 * 100) / 100;
  }

  const discountedSubtotal = Math.max(0, subtotal - discount);
  const shippingFee =
    discountedSubtotal === 0 || discountedSubtotal >= FREE_SHIPPING_THRESHOLD
      ? 0
      : STANDARD_SHIPPING_FEE;
  const total = Math.round((discountedSubtotal + shippingFee) * 100) / 100;
  const remainingForFreeShipping = Math.max(0, FREE_SHIPPING_THRESHOLD - discountedSubtotal);
  const freeShippingProgress = Math.min(100, (discountedSubtotal / FREE_SHIPPING_THRESHOLD) * 100);

  const handleApplyPromo = (e: FormEvent) => {
    e.preventDefault();
    const code = promoInput.trim().toUpperCase();
    if (code === 'WELCOME10') {
      setAppliedPromo('WELCOME10');
      setPromoMessage('WELCOME10 applied: 10% off subtotal.');
    } else if (code === 'NAVA15') {
      if (subtotal >= 999) {
        setAppliedPromo('NAVA15');
        setPromoMessage('NAVA15 applied: 15% off orders ₹999+.');
      } else {
        setPromoMessage('NAVA15 requires a subtotal of at least ₹999.');
      }
    } else {
      setAppliedPromo('');
      setPromoMessage('Unknown code. Try WELCOME10 or NAVA15.');
    }
  };

  const handlePlaceOrder = async (e: FormEvent) => {
    e.preventDefault();
    setCheckoutError(null);
    setSubmitting(true);

    try {
      const res = await apiRequest<{ order: Order }>('/api/orders', {
        method: 'POST',
        token: authToken,
        body: {
          items: items.map((item) => ({
            productId: item.productId,
            variantId: item.variantId,
            quantity: item.quantity,
          })),
          promoCode: appliedPromo || undefined,
          paymentMethod,
          shippingAddress: {
            fullName,
            email,
            phone,
            address,
            city,
            postalCode,
          },
        },
      });

      setConfirmedOrder(res.order);
      onOrderPlaced(res.order);
      onClearCart();
      setStep('receipt');
    } catch (err) {
      setCheckoutError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCloseDrawer = () => {
    if (step === 'receipt') {
      setStep('bag');
      setConfirmedOrder(null);
    }
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-zinc-950/45 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-label="Shopping Bag and Checkout"
    >
      <div className="bg-white w-full max-w-md h-full flex flex-col border-l border-zinc-200 shadow-2xl">
        <div className="px-6 py-4 border-b border-zinc-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-zinc-900" />
            <h2 className="font-display text-lg font-bold text-zinc-900">
              {step === 'bag'
                ? `Your Bag (${items.reduce((s, i) => s + i.quantity, 0)})`
                : step === 'checkout'
                  ? 'Delivery & Payment'
                  : 'Order Confirmed'}
            </h2>
          </div>
          <button
            type="button"
            onClick={handleCloseDrawer}
            aria-label="Close shopping bag"
            className="p-2 text-zinc-500 hover:text-zinc-900 rounded-lg hover:bg-zinc-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {step === 'bag' && (
            <>
              {items.length === 0 ? (
                <div className="py-16 text-center">
                  <ShoppingBag className="w-10 h-10 text-zinc-300 mx-auto mb-3" />
                  <p className="font-display text-base font-semibold text-zinc-900">
                    Your bag is currently empty
                  </p>
                  <p className="text-sm text-zinc-500 mt-1">
                    Add dresses, fruits, vegetables, groceries, shoes, or cosmetics to checkout.
                  </p>
                  <button
                    type="button"
                    onClick={handleCloseDrawer}
                    className="mt-6 px-5 py-2.5 text-sm font-semibold text-white bg-zinc-900 hover:bg-[#9D174D] rounded-lg cursor-pointer"
                  >
                    Continue Shopping
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-3.5">
                    <div className="flex items-center justify-between text-xs font-medium text-zinc-700 mb-2">
                      <span className="flex items-center gap-1.5">
                        <Truck className="w-3.5 h-3.5 text-fuchsia-700" />
                        {remainingForFreeShipping === 0
                          ? 'Unlocked Free Express Delivery'
                          : `Add ${formatCurrency(remainingForFreeShipping)} more for Free Delivery`}
                      </span>
                      <span className="font-mono-num">{Math.round(freeShippingProgress)}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-zinc-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#9D174D] transition-all duration-300"
                        style={{ width: `${freeShippingProgress}%` }}
                      />
                    </div>
                  </div>

                  <ul className="divide-y divide-zinc-200">
                    {items.map((item) => (
                      <li key={`${item.productId}-${item.variantId}`} className="py-4 flex gap-4">
                        <div className="w-20 h-20 rounded-lg overflow-hidden bg-zinc-100 border border-zinc-200 shrink-0">
                          <SafeImage
                            src={item.image}
                            alt={item.title}
                            accentHex={item.variantHex}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0 flex flex-col justify-between">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-zinc-900 truncate">
                                {item.title}
                              </p>
                              <p className="text-xs text-zinc-500 mt-0.5">{item.variantName}</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => onRemoveItem(item.productId, item.variantId)}
                              aria-label={`Remove ${item.title}`}
                              className="text-zinc-400 hover:text-rose-600 p-1 cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>

                          <div className="flex items-center justify-between mt-3">
                            <div className="inline-flex items-center border border-zinc-200 rounded-md">
                              <button
                                type="button"
                                onClick={() =>
                                  onUpdateQty(item.productId, item.variantId, item.quantity - 1)
                                }
                                aria-label="Decrease item quantity"
                                className="p-1.5 text-zinc-600 hover:text-zinc-900 cursor-pointer"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="w-7 text-center font-mono-num text-xs font-semibold">
                                {item.quantity}
                              </span>
                              <button
                                type="button"
                                onClick={() =>
                                  onUpdateQty(
                                    item.productId,
                                    item.variantId,
                                    Math.min(item.maxStock, item.quantity + 1),
                                  )
                                }
                                aria-label="Increase item quantity"
                                className="p-1.5 text-zinc-600 hover:text-zinc-900 cursor-pointer"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>

                            <span className="font-mono-num text-sm font-semibold text-zinc-900">
                              {formatCurrency(item.unitPrice * item.quantity)}
                            </span>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>

                  <form onSubmit={handleApplyPromo} className="pt-2">
                    <label className="block text-xs font-medium text-zinc-600 mb-1.5">
                      Promo Code (WELCOME10 or NAVA15)
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={promoInput}
                        onChange={(e) => setPromoInput(e.target.value)}
                        placeholder="WELCOME10"
                        className="flex-1 px-3 py-2 text-xs uppercase font-mono-num bg-white border border-zinc-300 rounded-lg focus:outline-none focus:border-fuchsia-700"
                      />
                      <button
                        type="submit"
                        className="px-4 py-2 text-xs font-semibold text-zinc-900 bg-zinc-100 hover:bg-zinc-200 border border-zinc-300 rounded-lg cursor-pointer"
                      >
                        Apply
                      </button>
                    </div>
                    {promoMessage && (
                      <p className="text-xs text-fuchsia-800 mt-1.5 font-medium">{promoMessage}</p>
                    )}
                  </form>
                </div>
              )}
            </>
          )}

          {step === 'checkout' && (
            <form id="checkout-form" onSubmit={handlePlaceOrder} className="space-y-4">
              <button
                type="button"
                onClick={() => setStep('bag')}
                className="text-xs font-semibold text-fuchsia-800 hover:underline cursor-pointer"
              >
                ← Back to Bag
              </button>

              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Delivery Verification Details
                </p>

                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    minLength={2}
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Ananya Sharma"
                    className="w-full px-3 py-2 text-sm border border-zinc-300 rounded-lg focus:outline-none focus:border-fuchsia-700"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-zinc-700 mb-1">Email</label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full px-3 py-2 text-sm border border-zinc-300 rounded-lg focus:outline-none focus:border-fuchsia-700"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-700 mb-1">Phone</label>
                    <input
                      type="tel"
                      required
                      minLength={7}
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 98480 12345"
                      className="w-full px-3 py-2 text-sm border border-zinc-300 rounded-lg focus:outline-none focus:border-fuchsia-700"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1">
                    Street Address &amp; Landmark
                  </label>
                  <input
                    type="text"
                    required
                    minLength={5}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Flat 302, Jubilee Hills Road No. 10"
                    className="w-full px-3 py-2 text-sm border border-zinc-300 rounded-lg focus:outline-none focus:border-fuchsia-700"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-zinc-700 mb-1">City</label>
                    <input
                      type="text"
                      required
                      minLength={2}
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="Hyderabad"
                      className="w-full px-3 py-2 text-sm border border-zinc-300 rounded-lg focus:outline-none focus:border-fuchsia-700"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-700 mb-1">
                      PIN / Postal Code
                    </label>
                    <input
                      type="text"
                      required
                      minLength={3}
                      value={postalCode}
                      onChange={(e) => setPostalCode(e.target.value)}
                      placeholder="500033"
                      className="w-full px-3 py-2 text-sm font-mono-num border border-zinc-300 rounded-lg focus:outline-none focus:border-fuchsia-700"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-zinc-200 space-y-2.5">
                <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Payment Method
                </p>

                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('COD')}
                    className={`flex items-center gap-2 p-3 text-left rounded-lg border text-xs font-semibold cursor-pointer ${
                      paymentMethod === 'COD'
                        ? 'border-amber-600 bg-amber-50 text-amber-900'
                        : 'border-zinc-200 bg-white text-zinc-700'
                    }`}
                  >
                    <Wallet className="w-4 h-4 shrink-0" />
                    <span>Cash on Delivery</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('CARD')}
                    className={`flex items-center gap-2 p-3 text-left rounded-lg border text-xs font-semibold cursor-pointer ${
                      paymentMethod === 'CARD'
                        ? 'border-fuchsia-700 bg-fuchsia-50 text-fuchsia-950'
                        : 'border-zinc-200 bg-white text-zinc-700'
                    }`}
                  >
                    <CreditCard className="w-4 h-4 shrink-0" />
                    <span>UPI / Card Pay</span>
                  </button>
                </div>

                {paymentMethod === 'COD' && (
                  <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-2.5">
                    Pay <span className="font-mono-num font-semibold">{formatCurrency(total)}</span>{' '}
                    by cash or UPI scan when your order arrives at your door.
                  </p>
                )}
              </div>

              {checkoutError && (
                <p className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg p-3">
                  {checkoutError}
                </p>
              )}
            </form>
          )}

          {step === 'receipt' && confirmedOrder && (
            <div className="space-y-5">
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5">
                <div className="flex items-center gap-2 text-emerald-800 font-semibold text-sm">
                  <CheckCircle2 className="w-5 h-5" />
                  <span>
                    Order #{confirmedOrder.orderNumber} {confirmedOrder.status}
                  </span>
                </div>
                <p className="text-xs text-emerald-700 mt-1.5">
                  Confirmation recorded for {confirmedOrder.shippingAddress.fullName} (
                  {confirmedOrder.shippingAddress.email}).
                </p>
              </div>

              <div className="border border-zinc-200 rounded-xl p-4 space-y-3 text-xs">
                <div className="flex justify-between text-zinc-600">
                  <span>Payment Method</span>
                  <span className="font-semibold text-zinc-900">
                    {confirmedOrder.paymentMethod === 'COD'
                      ? 'Cash on Delivery'
                      : 'UPI / Card Pay'}
                  </span>
                </div>
                <div className="flex justify-between text-zinc-600">
                  <span>Shipping To</span>
                  <span className="font-medium text-zinc-900 text-right">
                    {confirmedOrder.shippingAddress.address}, {confirmedOrder.shippingAddress.city}
                  </span>
                </div>
                <div className="pt-2 border-t border-zinc-200 space-y-1.5">
                  {confirmedOrder.items.map((item) => (
                    <div key={`${item.productId}-${item.variantId}`} className="flex justify-between">
                      <span className="text-zinc-700">
                        {item.quantity}× {item.title} ({item.variantName})
                      </span>
                      <span className="font-mono-num font-semibold text-zinc-900">
                        {formatCurrency(item.unitPrice * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="pt-2 border-t border-zinc-200 flex justify-between text-sm font-bold text-zinc-900">
                  <span>Total {confirmedOrder.paymentMethod === 'COD' ? 'Due' : 'Paid'}</span>
                  <span className="font-mono-num">{formatCurrency(confirmedOrder.total)}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  const num = confirmedOrder.orderNumber;
                  const contact = confirmedOrder.shippingAddress.email;
                  handleCloseDrawer();
                  onViewOrderTracking(num, contact);
                }}
                className="w-full py-3 text-sm font-semibold text-white bg-zinc-900 hover:bg-[#9D174D] rounded-lg cursor-pointer"
              >
                Track Delivery Status
              </button>
            </div>
          )}
        </div>

        {items.length > 0 && step !== 'receipt' && (
          <div className="p-6 border-t border-zinc-200 bg-zinc-50 space-y-3">
            <div className="space-y-1.5 text-xs text-zinc-600">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-mono-num font-medium text-zinc-900">
                  {formatCurrency(subtotal)}
                </span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <span>Discount ({appliedPromo})</span>
                  <span className="font-mono-num font-medium">-{formatCurrency(discount)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Delivery</span>
                <span className="font-mono-num font-medium text-zinc-900">
                  {shippingFee === 0 ? 'Free' : formatCurrency(shippingFee)}
                </span>
              </div>
              <div className="flex justify-between text-sm font-bold text-zinc-900 pt-2 border-t border-zinc-200">
                <span>Total</span>
                <span className="font-mono-num">{formatCurrency(total)}</span>
              </div>
            </div>

            {step === 'bag' ? (
              <button
                type="button"
                onClick={() => setStep('checkout')}
                className="w-full py-3 px-4 text-sm font-semibold text-white bg-[#9D174D] hover:bg-fuchsia-900 rounded-lg transition-colors cursor-pointer"
              >
                Proceed to Checkout
              </button>
            ) : (
              <button
                type="submit"
                form="checkout-form"
                disabled={submitting}
                className="w-full py-3 px-4 text-sm font-semibold text-white bg-[#9D174D] hover:bg-fuchsia-900 disabled:bg-zinc-400 rounded-lg transition-colors cursor-pointer"
              >
                {submitting
                  ? 'Placing Order...'
                  : paymentMethod === 'COD'
                    ? `Confirm COD Order · ${formatCurrency(total)}`
                    : `Place Order · ${formatCurrency(total)}`}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
