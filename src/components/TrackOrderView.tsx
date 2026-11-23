import { useEffect, useState, type FormEvent } from 'react';
import { LogOut, PackageCheck, Search, User } from 'lucide-react';
import { apiRequest, formatCurrency } from '../lib/api';
import type { AuthUser, Order, OrderStatus } from '../types';

interface TrackOrderViewProps {
  initialOrderNumber?: string;
  initialContact?: string;
  authToken: string | null;
  authUser: AuthUser | null;
  onAuthSuccess: (token: string, user: AuthUser) => void;
  onSignOut: () => void;
}

const PROGRESS_STEPS: OrderStatus[] = [
  'Confirmed',
  'Preparing Shipment',
  'Shipped',
  'Delivered',
];

export function TrackOrderView({
  initialOrderNumber = '',
  initialContact = '',
  authToken,
  authUser,
  onAuthSuccess,
  onSignOut,
}: TrackOrderViewProps) {
  const [orderNumber, setOrderNumber] = useState(initialOrderNumber);
  const [contact, setContact] = useState(initialContact);
  const [trackedOrder, setTrackedOrder] = useState<Order | null>(null);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [lookupLoading, setLookupLoading] = useState(false);

  const [myOrders, setMyOrders] = useState<Order[]>([]);
  const [myOrdersLoading, setMyOrdersLoading] = useState(false);

  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);

  useEffect(() => {
    if (initialOrderNumber && initialContact) {
      void lookupOrder(initialOrderNumber, initialContact);
    }
  }, [initialOrderNumber, initialContact]);

  useEffect(() => {
    if (!authToken) {
      setMyOrders([]);
      return;
    }
    setMyOrdersLoading(true);
    apiRequest<{ orders: Order[] }>('/api/orders/my', { token: authToken })
      .then((res) => setMyOrders(res.orders))
      .catch(() => setMyOrders([]))
      .finally(() => setMyOrdersLoading(false));
  }, [authToken]);

  const lookupOrder = async (num: string, contactVal: string) => {
    setLookupError(null);
    setLookupLoading(true);
    try {
      const encodedNum = encodeURIComponent(num.trim());
      const encodedContact = encodeURIComponent(contactVal.trim());
      const res = await apiRequest<{ order: Order }>(
        `/api/orders/track/${encodedNum}?contact=${encodedContact}`,
      );
      setTrackedOrder(res.order);
    } catch (err) {
      setTrackedOrder(null);
      setLookupError((err as Error).message);
    } finally {
      setLookupLoading(false);
    }
  };

  const handleTrackSubmit = (e: FormEvent) => {
    e.preventDefault();
    void lookupOrder(orderNumber, contact);
  };

  const handleCustomerAuth = async (e: FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthLoading(true);
    try {
      const endpoint =
        authMode === 'register' ? '/api/auth/register' : '/api/auth/login';
      const body =
        authMode === 'register'
          ? { name, email, password }
          : { email, password };
      const res = await apiRequest<{ token: string; user: AuthUser }>(endpoint, {
        method: 'POST',
        body,
      });
      onAuthSuccess(res.token, res.user);
      setPassword('');
    } catch (err) {
      setAuthError((err as Error).message);
    } finally {
      setAuthLoading(false);
    }
  };

  const stepIndex = trackedOrder
    ? PROGRESS_STEPS.indexOf(trackedOrder.status)
    : -1;

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold text-zinc-900">
          Order Tracking &amp; Customer Account
        </h1>
        <p className="text-sm text-zinc-600 mt-1">
          Check live fulfillment progress for any order or sign in to view your full purchase history.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Public Order Lookup */}
        <div className="lg:col-span-7 bg-white border border-zinc-200 rounded-2xl p-6 sm:p-8 space-y-6">
          <div className="flex items-center gap-2.5">
            <PackageCheck className="w-5 h-5 text-blue-700" />
            <h2 className="font-display text-lg font-bold text-zinc-900">
              Lookup by Order Number
            </h2>
          </div>

          <form onSubmit={handleTrackSubmit} className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            <div className="sm:col-span-5">
              <label className="block text-xs font-medium text-zinc-600 mb-1">
                Order Number
              </label>
              <input
                type="text"
                required
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
                placeholder="NK-1042"
                className="w-full px-3 py-2 text-sm font-mono-num uppercase border border-zinc-300 rounded-lg focus:outline-none focus:border-fuchsia-700"
              />
            </div>
            <div className="sm:col-span-5">
              <label className="block text-xs font-medium text-zinc-600 mb-1">
                Email or Last 4 Phone Digits
              </label>
              <input
                type="text"
                required
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                placeholder="you@example.com or 5678"
                className="w-full px-3 py-2 text-sm border border-zinc-300 rounded-lg focus:outline-none focus:border-blue-600"
              />
            </div>
            <div className="sm:col-span-2 flex items-end">
              <button
                type="submit"
                disabled={lookupLoading}
                className="w-full py-2 px-4 text-sm font-semibold text-white bg-zinc-900 hover:bg-blue-700 rounded-lg inline-flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Search className="w-4 h-4" />
                <span>Find</span>
              </button>
            </div>
          </form>

          {lookupError && (
            <p className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg p-3">
              {lookupError}
            </p>
          )}

          {trackedOrder && (
            <div className="pt-4 border-t border-zinc-200 space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-mono-num text-sm font-bold text-zinc-900">
                    Order #{trackedOrder.orderNumber}
                  </p>
                  <p className="text-xs text-zinc-500">
                    Placed {new Date(trackedOrder.createdAt).toLocaleDateString()} ·{' '}
                    {trackedOrder.paymentMethod === 'COD' ? 'Cash on Delivery' : 'Paid by Card'}
                  </p>
                </div>
                <span className="text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-md">
                  {trackedOrder.status}
                </span>
              </div>

              {trackedOrder.status !== 'Cancelled' && (
                <div className="grid grid-cols-4 gap-2">
                  {PROGRESS_STEPS.map((label, idx) => {
                    const completed = idx <= stepIndex;
                    return (
                      <div key={label} className="space-y-1.5">
                        <div
                          className={`h-1.5 rounded-full ${
                            completed ? 'bg-blue-700' : 'bg-zinc-200'
                          }`}
                        />
                        <p
                          className={`text-[11px] font-medium ${
                            completed ? 'text-zinc-900' : 'text-zinc-400'
                          }`}
                        >
                          {label}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-4 space-y-2 text-xs">
                {trackedOrder.items.map((item) => (
                  <div key={`${item.productId}-${item.variantId}`} className="flex justify-between">
                    <span className="text-zinc-700">
                      {item.quantity}× {item.title} ({item.variantName})
                    </span>
                    <span className="font-mono-num font-semibold text-zinc-900">
                      {formatCurrency(item.unitPrice * item.quantity)}
                    </span>
                  </div>
                ))}
                <div className="pt-2 border-t border-zinc-200 flex justify-between font-bold text-zinc-900 text-sm">
                  <span>Order Total</span>
                  <span className="font-mono-num">{formatCurrency(trackedOrder.total)}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right: Customer Account & Past Orders */}
        <div className="lg:col-span-5 bg-white border border-zinc-200 rounded-2xl p-6 sm:p-8 space-y-5">
          {authUser ? (
            <>
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <User className="w-5 h-5 text-zinc-700" />
                  <div>
                    <h2 className="font-display text-base font-bold text-zinc-900">
                      {authUser.name}
                    </h2>
                    <p className="text-xs text-zinc-500">{authUser.email}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onSignOut}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:text-zinc-900 border border-zinc-200 rounded-lg cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>

              <div className="pt-4 border-t border-zinc-200 space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Your Orders
                </h3>
                {myOrdersLoading ? (
                  <p className="text-xs text-zinc-500">Loading your order history...</p>
                ) : myOrders.length === 0 ? (
                  <p className="text-xs text-zinc-500">
                    No orders linked to this account yet.
                  </p>
                ) : (
                  <div className="space-y-2.5">
                    {myOrders.map((ord) => (
                      <button
                        key={ord.id}
                        type="button"
                        onClick={() => setTrackedOrder(ord)}
                        className="w-full text-left p-3.5 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 rounded-xl flex items-center justify-between transition-colors cursor-pointer"
                      >
                        <div>
                          <p className="font-mono-num text-xs font-bold text-zinc-900">
                            {ord.orderNumber}
                          </p>
                          <p className="text-[11px] text-zinc-500 mt-0.5">
                            {ord.items.length} {ord.items.length === 1 ? 'item' : 'items'} ·{' '}
                            {ord.status}
                          </p>
                        </div>
                        <span className="font-mono-num text-xs font-semibold text-zinc-900">
                          {formatCurrency(ord.total)}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <form onSubmit={handleCustomerAuth} className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-lg font-bold text-zinc-900">
                  {authMode === 'login' ? 'Customer Sign In' : 'Create Customer Account'}
                </h2>
                <button
                  type="button"
                  onClick={() =>
                    setAuthMode((m) => (m === 'login' ? 'register' : 'login'))
                  }
                  className="text-xs font-semibold text-blue-700 hover:underline cursor-pointer"
                >
                  {authMode === 'login' ? 'Register' : 'Sign In'}
                </button>
              </div>

              {authMode === 'register' && (
                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    minLength={2}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-zinc-300 rounded-lg"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-zinc-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1">Password</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-zinc-300 rounded-lg"
                />
              </div>

              {authError && <p className="text-xs text-rose-600">{authError}</p>}

              <button
                type="submit"
                disabled={authLoading}
                className="w-full py-2.5 text-sm font-semibold text-white bg-zinc-900 hover:bg-blue-700 rounded-lg cursor-pointer"
              >
                {authLoading
                  ? 'Please wait...'
                  : authMode === 'login'
                    ? 'Sign In'
                    : 'Create Account'}
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
