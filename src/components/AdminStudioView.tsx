import { useEffect, useState, type FormEvent } from 'react';
import { Lock, LogOut, Plus, Trash2 } from 'lucide-react';
import { apiRequest, formatCurrency } from '../lib/api';
import type { Order, OrderStatus, Product, ProductCategory } from '../types';

interface AdminStudioViewProps {
  products: Product[];
  onRefreshProducts: () => Promise<void>;
  adminToken: string | null;
  onAdminTokenChange: (token: string | null) => void;
}

const IMAGE_PRESETS = [
  { label: 'Dresses — Cotton Kurti', url: '/src/assets/images/dress_festive_kurti_1795424696363.jpg' },
  { label: 'Dresses — Floral Wrap', url: '/src/assets/images/dress_floral_maxi_1795424698413.jpg' },
  { label: 'Fruits — Mango & Pomegranate', url: '/src/assets/images/fruit_mango_pomegranate_1795424697981.jpg' },
  { label: 'Fruits — Citrus & Berries', url: '/src/assets/images/fruit_citrus_berries_1795424744326.jpg' },
  { label: 'Vegetables — Farm Basket', url: '/src/assets/images/veg_farm_basket_1795424698659.jpg' },
  { label: 'Vegetables — Roots & Greens', url: '/src/assets/images/veg_potato_carrot_roots_1795424742048.jpg' },
  { label: 'Groceries — Spices & Rice', url: '/src/assets/images/grocery_spices_pantry_1795424698000.jpg' },
  { label: 'Groceries — Honey & Oats', url: '/src/assets/images/grocery_honey_nuts_oats_1795424741201.jpg' },
  { label: 'Shoes — Urban Sneakers', url: '/src/assets/images/shoes_urban_sneakers_1795424698866.jpg' },
  { label: 'Shoes — Leather Loafers', url: '/src/assets/images/shoes_leather_loafers_1795424698124.jpg' },
  { label: 'Cosmetics — Lip & Serum', url: '/src/assets/images/cosmetics_lip_serum_1795424698614.jpg' },
  { label: 'Cosmetics — Skincare Trio', url: '/src/assets/images/cosmetics_skincare_cleanser_1795424742770.jpg' },
];

const ORDER_STATUSES: OrderStatus[] = [
  'Confirmed',
  'Preparing Shipment',
  'Shipped',
  'Delivered',
  'Cancelled',
];

export function AdminStudioView({
  products,
  onRefreshProducts,
  adminToken,
  onAdminTokenChange,
}: AdminStudioViewProps) {
  const [bootstrapAvailable, setBootstrapAvailable] = useState<boolean | null>(null);
  const [passcode, setPasscode] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);

  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<ProductCategory>('Dresses');
  const [price, setPrice] = useState('799');
  const [stock, setStock] = useState('15');
  const [variantName, setVariantName] = useState('Standard · M');
  const [accentHex, setAccentHex] = useState('#BE185D');
  const [image, setImage] = useState(IMAGE_PRESETS[0].url);
  const [description, setDescription] = useState('');
  const [formMessage, setFormMessage] = useState<string | null>(null);
  const [savingProduct, setSavingProduct] = useState(false);

  useEffect(() => {
    apiRequest<{ configured: boolean; bootstrapAvailable: boolean }>('/api/auth/admin-status')
      .then((res) => setBootstrapAvailable(res.bootstrapAvailable))
      .catch(() => setBootstrapAvailable(false));
  }, []);

  useEffect(() => {
    if (!adminToken) return;
    setOrdersLoading(true);
    apiRequest<{ orders: Order[] }>('/api/orders', { token: adminToken })
      .then((res) => setOrders(res.orders))
      .catch(() => setOrders([]))
      .finally(() => setOrdersLoading(false));
  }, [adminToken]);

  const handleAdminAuth = async (e: FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthLoading(true);
    try {
      const endpoint = bootstrapAvailable ? '/api/auth/admin-setup' : '/api/auth/admin-login';
      const res = await apiRequest<{ token: string }>(endpoint, {
        method: 'POST',
        body: { passcode },
      });
      onAdminTokenChange(res.token);
      setBootstrapAvailable(false);
      setPasscode('');
    } catch (err) {
      setAuthError((err as Error).message);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleCreateProduct = async (e: FormEvent) => {
    e.preventDefault();
    if (!adminToken) return;
    setFormMessage(null);
    setSavingProduct(true);
    try {
      await apiRequest('/api/products', {
        method: 'POST',
        token: adminToken,
        body: {
          title,
          category,
          price: Number(price),
          stock: Number(stock),
          variantName,
          accentHex,
          image,
          description,
          tag: 'New Release',
        },
      });
      setTitle('');
      setDescription('');
      setFormMessage('Product published to department.');
      await onRefreshProducts();
    } catch (err) {
      setFormMessage((err as Error).message);
    } finally {
      setSavingProduct(false);
    }
  };

  const handleQuickStockAdjust = async (product: Product, nextStock: number) => {
    if (!adminToken) return;
    try {
      await apiRequest(`/api/products/${product.id}`, {
        method: 'PUT',
        token: adminToken,
        body: { stock: Math.max(0, nextStock) },
      });
      await onRefreshProducts();
    } catch {
      // keep state
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!adminToken) return;
    try {
      await apiRequest(`/api/products/${id}`, {
        method: 'DELETE',
        token: adminToken,
      });
      await onRefreshProducts();
    } catch {
      // keep state
    }
  };

  const handleOrderStatusChange = async (orderId: string, status: OrderStatus) => {
    if (!adminToken) return;
    try {
      const res = await apiRequest<{ order: Order }>(`/api/orders/${orderId}/status`, {
        method: 'PATCH',
        token: adminToken,
        body: { status },
      });
      setOrders((prev) => prev.map((o) => (o.id === orderId ? res.order : o)));
    } catch {
      // keep state
    }
  };

  if (!adminToken) {
    return (
      <section className="max-w-lg mx-auto px-4 py-16">
        <div className="bg-white border border-zinc-200 rounded-2xl p-8 space-y-5">
          <div className="flex items-center gap-2.5 text-zinc-900">
            <Lock className="w-5 h-5 text-fuchsia-800" />
            <h1 className="font-display text-xl font-bold">
              {bootstrapAvailable ? 'Claim Seller Admin Access' : 'Seller Admin Sign In'}
            </h1>
          </div>

          <p className="text-sm text-zinc-600">
            {bootstrapAvailable
              ? 'No admin passcode is set yet. Choose a passcode (6+ characters) to unlock department inventory and order fulfillment.'
              : 'Enter your Seller Admin passcode to manage catalog stock and fulfill customer orders.'}
          </p>

          <form onSubmit={handleAdminAuth} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">
                {bootstrapAvailable ? 'New Seller Passcode' : 'Seller Passcode'}
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                placeholder="Minimum 6 characters"
                className="w-full px-3.5 py-2.5 text-sm border border-zinc-300 rounded-lg focus:outline-none focus:border-fuchsia-700"
              />
            </div>

            {authError && (
              <p className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg p-2.5">
                {authError}
              </p>
            )}

            <button
              type="submit"
              disabled={authLoading || bootstrapAvailable === null}
              className="w-full py-2.5 px-4 text-sm font-semibold text-white bg-zinc-900 hover:bg-[#9D174D] rounded-lg transition-colors cursor-pointer"
            >
              {authLoading
                ? 'Verifying...'
                : bootstrapAvailable
                  ? 'Initialize & Open Seller Admin'
                  : 'Unlock Seller Admin'}
            </button>
          </form>
        </div>
      </section>
    );
  }

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-zinc-900">
            Seller Admin Console
          </h1>
          <p className="text-sm text-zinc-600 mt-1">
            Manage products across all 6 departments, update stock, and dispatch orders.
          </p>
        </div>
        <button
          type="button"
          onClick={() => onAdminTokenChange(null)}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-zinc-700 bg-white border border-zinc-300 hover:border-zinc-500 rounded-lg cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>Lock Admin</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <form
          onSubmit={handleCreateProduct}
          className="lg:col-span-4 bg-white border border-zinc-200 rounded-2xl p-6 space-y-4"
        >
          <h2 className="font-display text-lg font-bold text-zinc-900 flex items-center gap-2">
            <Plus className="w-4 h-4 text-fuchsia-800" />
            <span>Add Department Item</span>
          </h2>

          <div>
            <label className="block text-xs font-medium text-zinc-700 mb-1">Product Title</label>
            <input
              type="text"
              required
              minLength={3}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Silk Embroidered Anarkali Kurti"
              className="w-full px-3 py-2 text-sm border border-zinc-300 rounded-lg"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">Department</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ProductCategory)}
                className="w-full px-3 py-2 text-sm border border-zinc-300 rounded-lg bg-white"
              >
                <option value="Dresses">Dresses</option>
                <option value="Fruits">Fruits</option>
                <option value="Vegetables">Vegetables</option>
                <option value="Groceries">Groceries</option>
                <option value="Shoes">Shoes</option>
                <option value="Cosmetics">Cosmetics</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">Price (₹)</label>
              <input
                type="number"
                required
                min={1}
                step="1"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full px-3 py-2 text-sm font-mono-num border border-zinc-300 rounded-lg"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">Stock</label>
              <input
                type="number"
                required
                min={0}
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                className="w-full px-3 py-2 text-sm font-mono-num border border-zinc-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">Pack / Size</label>
              <input
                type="text"
                required
                value={variantName}
                onChange={(e) => setVariantName(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-zinc-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">Accent</label>
              <input
                type="color"
                value={accentHex}
                onChange={(e) => setAccentHex(e.target.value)}
                className="w-full h-9 p-1 border border-zinc-300 rounded-lg bg-white cursor-pointer"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-700 mb-1">Product Photo</label>
            <select
              value={image}
              onChange={(e) => setImage(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-zinc-300 rounded-lg bg-white"
            >
              {IMAGE_PRESETS.map((preset) => (
                <option key={preset.url} value={preset.url}>
                  {preset.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-700 mb-1">Description</label>
            <textarea
              required
              minLength={10}
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Fabric/grade, pack weight, and care instructions..."
              className="w-full px-3 py-2 text-sm border border-zinc-300 rounded-lg"
            />
          </div>

          {formMessage && (
            <p className="text-xs font-medium text-fuchsia-800">{formMessage}</p>
          )}

          <button
            type="submit"
            disabled={savingProduct}
            className="w-full py-2.5 px-4 text-sm font-semibold text-white bg-[#9D174D] hover:bg-fuchsia-900 rounded-lg cursor-pointer"
          >
            {savingProduct ? 'Publishing...' : 'Publish Item'}
          </button>
        </form>

        <div className="lg:col-span-8 bg-white border border-zinc-200 rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-zinc-200 flex items-center justify-between">
            <h2 className="font-display text-lg font-bold text-zinc-900">
              Catalog Inventory ({products.length})
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-zinc-50 border-b border-zinc-200 text-xs text-zinc-500 uppercase">
                <tr>
                  <th className="py-3 px-4 font-semibold">Item</th>
                  <th className="py-3 px-4 font-semibold">Department</th>
                  <th className="py-3 px-4 font-semibold">Price</th>
                  <th className="py-3 px-4 font-semibold">Stock</th>
                  <th className="py-3 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200">
                {products.map((p) => {
                  const primaryStock = p.variants[0]?.stock ?? 0;
                  return (
                    <tr key={p.id} className="hover:bg-zinc-50/70">
                      <td className="py-3 px-4">
                        <p className="font-semibold text-zinc-900">{p.title}</p>
                        <p className="font-mono-num text-xs text-zinc-500">{p.sku}</p>
                      </td>
                      <td className="py-3 px-4 text-xs text-zinc-600">{p.category}</td>
                      <td className="py-3 px-4 font-mono-num font-semibold text-zinc-900">
                        {formatCurrency(p.price)}
                      </td>
                      <td className="py-3 px-4">
                        <div className="inline-flex items-center gap-2 font-mono-num text-xs">
                          <button
                            type="button"
                            onClick={() => handleQuickStockAdjust(p, primaryStock - 1)}
                            className="px-2 py-0.5 border border-zinc-300 rounded hover:bg-zinc-100 cursor-pointer"
                          >
                            -
                          </button>
                          <span className="w-6 text-center font-semibold">{primaryStock}</span>
                          <button
                            type="button"
                            onClick={() => handleQuickStockAdjust(p, primaryStock + 1)}
                            className="px-2 py-0.5 border border-zinc-300 rounded hover:bg-zinc-100 cursor-pointer"
                          >
                            +
                          </button>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleDeleteProduct(p.id)}
                          aria-label={`Delete ${p.title}`}
                          className="p-1.5 text-zinc-400 hover:text-rose-600 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="bg-white border border-zinc-200 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-zinc-200 flex items-center justify-between">
          <h2 className="font-display text-lg font-bold text-zinc-900">
            Customer Orders ({orders.length})
          </h2>
        </div>
        {ordersLoading ? (
          <p className="p-6 text-sm text-zinc-500">Loading customer orders...</p>
        ) : orders.length === 0 ? (
          <p className="p-6 text-sm text-zinc-500">
            No customer orders placed yet. Complete a test checkout from the Bag drawer to manage fulfillment here.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-zinc-50 border-b border-zinc-200 text-xs text-zinc-500 uppercase">
                <tr>
                  <th className="py-3 px-4 font-semibold">Order</th>
                  <th className="py-3 px-4 font-semibold">Customer</th>
                  <th className="py-3 px-4 font-semibold">Method</th>
                  <th className="py-3 px-4 font-semibold">Total</th>
                  <th className="py-3 px-4 font-semibold">Fulfillment Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200">
                {orders.map((ord) => (
                  <tr key={ord.id}>
                    <td className="py-3 px-4">
                      <p className="font-mono-num font-bold text-zinc-900">{ord.orderNumber}</p>
                      <p className="text-xs text-zinc-500">
                        {new Date(ord.createdAt).toLocaleDateString()}
                      </p>
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-medium text-zinc-900">{ord.shippingAddress.fullName}</p>
                      <p className="text-xs text-zinc-500">{ord.shippingAddress.city}</p>
                    </td>
                    <td className="py-3 px-4 text-xs text-zinc-700">{ord.paymentMethod}</td>
                    <td className="py-3 px-4 font-mono-num font-semibold text-zinc-900">
                      {formatCurrency(ord.total)}
                    </td>
                    <td className="py-3 px-4">
                      <select
                        value={ord.status}
                        onChange={(e) =>
                          handleOrderStatusChange(ord.id, e.target.value as OrderStatus)
                        }
                        className="px-2.5 py-1.5 text-xs font-medium border border-zinc-300 rounded-lg bg-white cursor-pointer"
                      >
                        {ORDER_STATUSES.map((st) => (
                          <option key={st} value={st}>
                            {st}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
