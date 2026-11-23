import { useState, type FormEvent } from 'react';
import { Minus, Plus, Star, Truck, X } from 'lucide-react';
import { apiRequest, formatCurrency } from '../lib/api';
import { SafeImage } from './SafeImage';
import type { AuthUser, Product, ProductVariant } from '../types';

interface ProductDetailModalProps {
  product: Product;
  onClose: () => void;
  onAddToCart: (product: Product, variant: ProductVariant, quantity: number) => void;
  authToken: string | null;
  authUser: AuthUser | null;
  onAuthSuccess: (token: string, user: AuthUser) => void;
  onProductUpdated: (updated: Product) => void;
}

export function ProductDetailModal({
  product,
  onClose,
  onAddToCart,
  authToken,
  authUser,
  onAuthSuccess,
  onProductUpdated,
}: ProductDetailModalProps) {
  const [selectedVariantId, setSelectedVariantId] = useState<string>(
    product.variants[0]?.id ?? '',
  );
  const [quantity, setQuantity] = useState(1);

  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);

  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authName, setAuthName] = useState('');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);

  const selectedVariant =
    product.variants.find((v) => v.id === selectedVariantId) ?? product.variants[0];
  const maxStock = selectedVariant?.stock ?? 0;

  const handleAdd = () => {
    if (!selectedVariant || maxStock <= 0) return;
    onAddToCart(product, selectedVariant, quantity);
    onClose();
  };

  const handleInlineAuth = async (e: FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthLoading(true);
    try {
      const endpoint =
        authMode === 'register' ? '/api/auth/register' : '/api/auth/login';
      const payload =
        authMode === 'register'
          ? { name: authName, email: authEmail, password: authPassword }
          : { email: authEmail, password: authPassword };
      const res = await apiRequest<{ token: string; user: AuthUser }>(endpoint, {
        method: 'POST',
        body: payload,
      });
      onAuthSuccess(res.token, res.user);
      setAuthPassword('');
    } catch (err) {
      setAuthError((err as Error).message);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSubmitReview = async (e: FormEvent) => {
    e.preventDefault();
    if (!authToken) return;
    setReviewError(null);
    setSubmittingReview(true);
    try {
      const res = await apiRequest<{ product: Product }>(
        `/api/products/${product.id}/reviews`,
        {
          method: 'POST',
          token: authToken,
          body: { rating: reviewRating, comment: reviewComment },
        },
      );
      onProductUpdated(res.product);
      setReviewComment('');
      setReviewRating(5);
    } catch (err) {
      setReviewError((err as Error).message);
    } finally {
      setSubmittingReview(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-zinc-950/50 backdrop-blur-xs flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={product.title}
    >
      <div className="bg-white border border-zinc-200 rounded-2xl max-w-5xl w-full max-h-[92vh] overflow-y-auto shadow-xl">
        <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-xs border-b border-zinc-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-zinc-500 uppercase tracking-wider">
            <span>{product.category}</span>
            <span aria-hidden="true">/</span>
            <span className="font-mono-num">{product.sku}</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close product details"
            className="p-2 text-zinc-500 hover:text-zinc-900 rounded-lg hover:bg-zinc-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Sticky Gallery + Spec */}
          <div className="lg:col-span-6 space-y-6">
            <div className="aspect-[4/3] rounded-xl overflow-hidden bg-zinc-100 border border-zinc-200">
              <SafeImage
                src={product.image}
                alt={product.title}
                accentHex={product.accentHex}
                title={product.title}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-zinc-50 border border-zinc-200 rounded-xl p-4 text-sm">
              <div>
                <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                  Materials
                </p>
                <p className="mt-1 text-zinc-800">{product.materials}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                  Dimensions
                </p>
                <p className="mt-1 text-zinc-800 font-mono-num text-xs">
                  {product.dimensions}
                </p>
              </div>
            </div>
          </div>

          {/* Right Contiguous Purchase Module */}
          <div className="lg:col-span-6 space-y-6">
            <div>
              <div className="flex items-center gap-2 text-xs text-zinc-500">
                <span className="flex items-center gap-1 font-mono-num text-zinc-800 font-medium">
                  <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                  {product.rating.toFixed(1)}
                </span>
                <span aria-hidden="true">·</span>
                <span>
                  {product.reviewCount}{' '}
                  {product.reviewCount === 1 ? 'review' : 'reviews'}
                </span>
                {product.tag && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span className="font-semibold" style={{ color: product.accentHex }}>
                      {product.tag}
                    </span>
                  </>
                )}
              </div>

              <h2 className="font-display text-2xl sm:text-3xl font-bold text-zinc-900 mt-2">
                {product.title}
              </h2>

              <div className="mt-3 flex items-baseline gap-3">
                <span className="font-mono-num text-2xl font-semibold text-zinc-900">
                  {formatCurrency(product.price)}
                </span>
                {product.compareAtPrice && (
                  <span className="font-mono-num text-sm text-zinc-400 line-through">
                    {formatCurrency(product.compareAtPrice)}
                  </span>
                )}
              </div>

              <p className="mt-4 text-sm leading-relaxed text-zinc-600">
                {product.description}
              </p>
            </div>

            {/* Finish / Color Variant Selector */}
            <div className="pt-4 border-t border-zinc-200">
              <div className="flex items-center justify-between text-xs mb-2.5">
                <span className="font-semibold text-zinc-900">
                  Finish: {selectedVariant?.name}
                </span>
                <span className="font-mono-num text-zinc-600">
                  {maxStock > 0 ? `${maxStock} in stock` : 'Out of stock'}
                </span>
              </div>
              <div className="flex flex-wrap gap-2.5">
                {product.variants.map((variant) => {
                  const active = variant.id === selectedVariant?.id;
                  return (
                    <button
                      key={variant.id}
                      type="button"
                      onClick={() => {
                        setSelectedVariantId(variant.id);
                        setQuantity(1);
                      }}
                      className={`inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium rounded-lg border transition-colors cursor-pointer ${
                        active
                          ? 'border-zinc-900 bg-zinc-900 text-white'
                          : 'border-zinc-200 bg-white text-zinc-800 hover:border-zinc-400'
                      }`}
                    >
                      <span
                        className="w-3 h-3 rounded-full border border-white/40"
                        style={{ backgroundColor: variant.hex }}
                        aria-hidden="true"
                      />
                      <span>{variant.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quantity & Primary Buy CTA */}
            <div className="flex items-center gap-3 pt-2">
              <div className="inline-flex items-center border border-zinc-300 rounded-lg bg-white">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  aria-label="Decrease quantity"
                  className="p-2.5 text-zinc-700 hover:text-zinc-950 cursor-pointer"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-10 text-center font-mono-num text-sm font-semibold">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.min(Math.max(1, maxStock), q + 1))}
                  aria-label="Increase quantity"
                  className="p-2.5 text-zinc-700 hover:text-zinc-950 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <button
                type="button"
                disabled={maxStock <= 0}
                onClick={handleAdd}
                className="flex-1 py-3 px-6 text-sm font-semibold text-white bg-[#1D4ED8] hover:bg-blue-800 disabled:bg-zinc-200 disabled:text-zinc-400 rounded-lg transition-colors cursor-pointer"
              >
                {maxStock > 0
                  ? `Add to Bag · ${formatCurrency(product.price * quantity)}`
                  : 'Currently Out of Stock'}
              </button>
            </div>

            <div className="flex items-center gap-2 text-xs text-zinc-600 bg-zinc-50 border border-zinc-200 rounded-lg px-3.5 py-2.5">
              <Truck className="w-4 h-4 text-fuchsia-700 shrink-0" />
              <span>
                Free delivery over ₹499 · Available with Card or Cash on Delivery (COD)
              </span>
            </div>

            {/* Verified Reviews */}
            <div className="pt-6 border-t border-zinc-200 space-y-4">
              <h3 className="font-display text-base font-semibold text-zinc-900">
                Customer Reviews ({product.reviews.length})
              </h3>

              <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
                {product.reviews.length === 0 ? (
                  <p className="text-xs text-zinc-500">No reviews yet. Be the first to review this piece.</p>
                ) : (
                  product.reviews.map((rev) => (
                    <div key={rev.id} className="bg-zinc-50 border border-zinc-200/80 rounded-lg p-3.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-zinc-900">{rev.authorName}</span>
                        <span className="font-mono-num text-amber-600 font-medium">
                          {'★'.repeat(rev.rating)}
                        </span>
                      </div>
                      <p className="mt-1.5 text-xs leading-relaxed text-zinc-700">
                        {rev.comment}
                      </p>
                    </div>
                  ))
                )}
              </div>

              {authUser ? (
                <form onSubmit={handleSubmitReview} className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-zinc-800">
                      Write a review as {authUser.name}
                    </label>
                    <select
                      value={reviewRating}
                      onChange={(e) => setReviewRating(Number(e.target.value))}
                      className="text-xs border border-zinc-300 rounded-md px-2 py-1 bg-white"
                    >
                      <option value={5}>5 Stars</option>
                      <option value={4}>4 Stars</option>
                      <option value={3}>3 Stars</option>
                      <option value={2}>2 Stars</option>
                      <option value={1}>1 Star</option>
                    </select>
                  </div>
                  <textarea
                    required
                    minLength={4}
                    maxLength={600}
                    rows={2}
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder="Share how this object looks and performs in your space..."
                    className="w-full px-3 py-2 text-xs border border-zinc-300 rounded-lg focus:outline-none focus:border-blue-600"
                  />
                  {reviewError && <p className="text-xs text-rose-600">{reviewError}</p>}
                  <button
                    type="submit"
                    disabled={submittingReview}
                    className="px-4 py-2 text-xs font-semibold text-white bg-zinc-900 hover:bg-blue-700 rounded-lg transition-colors cursor-pointer"
                  >
                    {submittingReview ? 'Submitting...' : 'Post Review'}
                  </button>
                </form>
              ) : (
                <form
                  onSubmit={handleInlineAuth}
                  className="bg-zinc-50 border border-zinc-200 rounded-xl p-4 space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-zinc-800">
                      {authMode === 'login' ? 'Sign in to post a review' : 'Create customer account'}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setAuthMode((m) => (m === 'login' ? 'register' : 'login'))
                      }
                      className="text-xs font-medium text-blue-700 hover:underline cursor-pointer"
                    >
                      {authMode === 'login' ? 'Create account' : 'Have an account?'}
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {authMode === 'register' && (
                      <input
                        type="text"
                        required
                        placeholder="Full name"
                        value={authName}
                        onChange={(e) => setAuthName(e.target.value)}
                        className="px-3 py-1.5 text-xs bg-white border border-zinc-300 rounded-md"
                      />
                    )}
                    <input
                      type="email"
                      required
                      placeholder="Email address"
                      value={authEmail}
                      onChange={(e) => setAuthEmail(e.target.value)}
                      className="px-3 py-1.5 text-xs bg-white border border-zinc-300 rounded-md"
                    />
                    <input
                      type="password"
                      required
                      minLength={6}
                      placeholder="Password"
                      value={authPassword}
                      onChange={(e) => setAuthPassword(e.target.value)}
                      className="px-3 py-1.5 text-xs bg-white border border-zinc-300 rounded-md"
                    />
                  </div>
                  {authError && <p className="text-xs text-rose-600">{authError}</p>}
                  <button
                    type="submit"
                    disabled={authLoading}
                    className="px-3.5 py-1.5 text-xs font-semibold text-white bg-zinc-900 hover:bg-blue-700 rounded-md cursor-pointer"
                  >
                    {authLoading
                      ? 'Please wait...'
                      : authMode === 'login'
                        ? 'Sign In'
                        : 'Register & Continue'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
