import { useState } from 'react';
import { ArrowRight, Check, Heart, Plus, Search, Star } from 'lucide-react';
import { formatCurrency } from '../lib/api';
import { SafeImage } from './SafeImage';
import type { Product, ProductCategory, ProductVariant } from '../types';

interface ProductCatalogProps {
  products: Product[];
  loading: boolean;
  error: string | null;
  selectedCategory: ProductCategory | 'All';
  onSelectCategory: (cat: ProductCategory | 'All') => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  sortBy: string;
  onSortChange: (sort: string) => void;
  wishlistIds: string[];
  onToggleWishlist: (productId: string) => void;
  onAddToCart: (product: Product, variant: ProductVariant, quantity: number) => void;
  onSelectProduct: (product: Product) => void;
}

const CATEGORIES: Array<ProductCategory | 'All'> = [
  'All',
  'Dresses',
  'Fruits',
  'Vegetables',
  'Groceries',
  'Shoes',
  'Cosmetics',
];

const DEPARTMENT_META: Record<
  ProductCategory,
  { subtitle: string; accent: string; bgTint: string }
> = {
  Dresses: {
    subtitle: 'Festive cotton-silk kurtis, block prints & summer wrap dresses',
    accent: '#BE185D',
    bgTint: 'from-rose-50 to-white',
  },
  Fruits: {
    subtitle: 'Tree-ripened Alphonso mangoes, ruby pomegranates & fresh berries',
    accent: '#EA580C',
    bgTint: 'from-orange-50 to-white',
  },
  Vegetables: {
    subtitle: 'Dawn-harvested kitchen greens, tomatoes, roots & organic veggies',
    accent: '#059669',
    bgTint: 'from-emerald-50 to-white',
  },
  Groceries: {
    subtitle: 'Aged Basmati rice, unpolished lentils, pure spices & breakfast kits',
    accent: '#B45309',
    bgTint: 'from-amber-50 to-white',
  },
  Shoes: {
    subtitle: 'Cushioned suede runners, everyday sneakers & leather penny loafers',
    accent: '#1D4ED8',
    bgTint: 'from-blue-50 to-white',
  },
  Cosmetics: {
    subtitle: 'Velvet matte lipsticks, Vitamin C serums, blush & botanical skincare',
    accent: '#E11D48',
    bgTint: 'from-pink-50 to-white',
  },
};

export function ProductCatalog({
  products,
  loading,
  error,
  selectedCategory,
  onSelectCategory,
  searchQuery,
  onSearchChange,
  sortBy,
  onSortChange,
  wishlistIds,
  onToggleWishlist,
  onAddToCart,
  onSelectProduct,
}: ProductCatalogProps) {
  const [selectedVariantMap, setSelectedVariantMap] = useState<Record<string, string>>({});
  const [addedProductId, setAddedProductId] = useState<string | null>(null);
  const [showSavedOnly, setShowSavedOnly] = useState(false);

  const visibleProducts = showSavedOnly
    ? products.filter((p) => wishlistIds.includes(p.id))
    : products;

  const handleQuickAdd = (product: Product, variant: ProductVariant) => {
    onAddToCart(product, variant, 1);
    setAddedProductId(product.id);
    window.setTimeout(() => {
      setAddedProductId((current) => (current === product.id ? null : current));
    }, 1100);
  };

  const renderProductCard = (product: Product) => {
    const activeVariantId =
      selectedVariantMap[product.id] ?? product.variants[0]?.id;
    const activeVariant =
      product.variants.find((v) => v.id === activeVariantId) ?? product.variants[0];
    const isSaved = wishlistIds.includes(product.id);
    const justAdded = addedProductId === product.id;
    const outOfStock = !activeVariant || activeVariant.stock <= 0;
    const discountPct =
      product.compareAtPrice && product.compareAtPrice > product.price
        ? Math.round(
            ((product.compareAtPrice - product.price) / product.compareAtPrice) * 100,
          )
        : null;

    return (
      <article
        key={product.id}
        className="group bg-white border border-zinc-200 rounded-2xl overflow-hidden flex flex-col transition-transform duration-150 hover:-translate-y-0.5 hover:shadow-md"
      >
        <div className="relative aspect-[4/3] bg-zinc-100 overflow-hidden">
          <button
            type="button"
            onClick={() => onSelectProduct(product)}
            className="w-full h-full block text-left cursor-pointer"
            aria-label={`View details for ${product.title}`}
          >
            <SafeImage
              src={product.image}
              alt={product.title}
              accentHex={product.accentHex}
              title={product.title}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            />
          </button>

          <button
            type="button"
            onClick={() => onToggleWishlist(product.id)}
            aria-label={
              isSaved ? `Remove ${product.title} from saved` : `Save ${product.title}`
            }
            className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/95 border border-zinc-200 flex items-center justify-center text-zinc-700 hover:text-rose-600 transition-colors cursor-pointer"
          >
            <Heart
              className={`w-4 h-4 ${isSaved ? 'fill-rose-600 text-rose-600' : ''}`}
            />
          </button>
        </div>

        <div className="p-5 flex-1 flex flex-col justify-between gap-4">
          <div>
            <div className="flex items-center justify-between gap-2 text-xs text-zinc-500">
              <div className="flex items-center gap-1.5 uppercase tracking-wider font-medium truncate">
                <span>{product.category}</span>
                {product.tag && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span style={{ color: product.accentHex }}>{product.tag}</span>
                  </>
                )}
              </div>
              <div className="flex items-center gap-1 shrink-0 font-mono-num text-zinc-700">
                <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                <span>{product.rating.toFixed(1)}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onSelectProduct(product)}
              className="mt-2 block text-left font-display text-base font-semibold text-zinc-900 hover:text-[#9D174D] transition-colors cursor-pointer"
            >
              {product.title}
            </button>

            <div className="mt-3 flex items-center gap-2">
              {product.variants.map((variant) => {
                const selected = variant.id === activeVariant?.id;
                return (
                  <button
                    key={variant.id}
                    type="button"
                    onClick={() =>
                      setSelectedVariantMap((prev) => ({
                        ...prev,
                        [product.id]: variant.id,
                      }))
                    }
                    title={`${variant.name} (${variant.stock} in stock)`}
                    aria-label={`Select option ${variant.name}`}
                    className={`w-5 h-5 rounded-full transition-transform cursor-pointer ${
                      selected
                        ? 'ring-2 ring-offset-2 ring-zinc-900 scale-105'
                        : 'ring-1 ring-zinc-300 hover:scale-105'
                    }`}
                    style={{ backgroundColor: variant.hex }}
                  />
                );
              })}
              <span className="text-xs text-zinc-500 ml-1 truncate">
                {activeVariant?.name}
              </span>
            </div>
          </div>

          <div className="pt-3 border-t border-zinc-100 flex items-center justify-between gap-3">
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className="font-mono-num text-[15px] font-bold text-zinc-900">
                {formatCurrency(product.price)}
              </span>
              {product.compareAtPrice && (
                <span className="font-mono-num text-xs text-zinc-400 line-through">
                  {formatCurrency(product.compareAtPrice)}
                </span>
              )}
              {discountPct && (
                <span className="font-mono-num text-[11px] font-semibold text-emerald-700">
                  {discountPct}% off
                </span>
              )}
            </div>

            <button
              type="button"
              disabled={outOfStock}
              onClick={() => activeVariant && handleQuickAdd(product, activeVariant)}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                outOfStock
                  ? 'bg-zinc-100 text-zinc-400 cursor-not-allowed'
                  : justAdded
                    ? 'bg-emerald-700 text-white'
                    : 'bg-zinc-900 hover:bg-[#9D174D] text-white'
              }`}
            >
              {justAdded ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Added</span>
                </>
              ) : outOfStock ? (
                <span>Sold Out</span>
              ) : (
                <>
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add to Bag</span>
                </>
              )}
            </button>
          </div>
        </div>
      </article>
    );
  };

  const shouldShowGroupedSections =
    selectedCategory === 'All' && !searchQuery.trim() && !showSavedOnly && sortBy === 'featured';

  const departmentOrder: ProductCategory[] = [
    'Dresses',
    'Fruits',
    'Vegetables',
    'Groceries',
    'Shoes',
    'Cosmetics',
  ];

  return (
    <section id="catalog" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
        <div>
          <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900">
            {selectedCategory === 'All'
              ? 'Shop by Department'
              : `${selectedCategory} Department`}
          </h2>
          <p className="text-sm text-zinc-600 mt-1">
            {selectedCategory === 'All'
              ? `${visibleProducts.length} items across 6 dedicated departments`
              : DEPARTMENT_META[selectedCategory].subtitle}
          </p>
        </div>

        {/* Search & Sort controls */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 sm:flex-initial sm:w-64">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search kurtis, mangoes, shoes..."
              aria-label="Search products"
              className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-fuchsia-700/20 focus:border-fuchsia-700"
            />
          </div>

          <button
            type="button"
            onClick={() => setShowSavedOnly((prev) => !prev)}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium rounded-lg border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              showSavedOnly
                ? 'bg-rose-50 border-rose-300 text-rose-700'
                : 'bg-white border-zinc-200 text-zinc-700 hover:border-zinc-300'
            }`}
          >
            <Heart className={`w-4 h-4 ${showSavedOnly ? 'fill-rose-600 text-rose-600' : ''}`} />
            <span>Saved ({wishlistIds.length})</span>
          </button>

          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value)}
            aria-label="Sort products"
            className="px-3 py-2 text-sm font-medium bg-white border border-zinc-200 rounded-lg text-zinc-700 focus:outline-none focus:ring-2 focus:ring-fuchsia-700/20 focus:border-fuchsia-700 cursor-pointer"
          >
            <option value="featured">By Department</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="rating">Top Rated</option>
          </select>
        </div>
      </div>

      {/* Interactive Department Filter Tabs */}
      <div className="flex items-center gap-1.5 p-1 bg-zinc-100 rounded-xl overflow-x-auto mb-8 w-full lg:w-fit">
        {CATEGORIES.map((category) => {
          const isActive = selectedCategory === category;
          return (
            <button
              key={category}
              type="button"
              onClick={() => onSelectCategory(category)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                isActive
                  ? 'bg-white text-zinc-900 shadow-sm'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              {category === 'All' ? 'All Departments' : category}
            </button>
          );
        })}
      </div>

      {/* Focused Department Banner when viewing a single department */}
      {selectedCategory !== 'All' && (
        <div
          className={`mb-8 rounded-2xl border border-zinc-200 bg-gradient-to-r ${DEPARTMENT_META[selectedCategory].bgTint} p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4`}
        >
          <div className="flex items-center gap-3.5">
            <span
              className="w-3.5 h-10 rounded-sm shrink-0"
              style={{ backgroundColor: DEPARTMENT_META[selectedCategory].accent }}
              aria-hidden="true"
            />
            <div>
              <h3 className="font-display text-xl font-bold text-zinc-900">
                {selectedCategory} Storefront
              </h3>
              <p className="text-sm text-zinc-600">
                {DEPARTMENT_META[selectedCategory].subtitle}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onSelectCategory('All')}
            className="text-xs font-semibold text-zinc-800 hover:text-zinc-950 px-3.5 py-2 bg-white border border-zinc-200 rounded-lg self-start sm:self-center whitespace-nowrap shrink-0 cursor-pointer"
          >
            ← View All 6 Departments
          </button>
        </div>
      )}

      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="bg-white border border-zinc-200 rounded-2xl overflow-hidden animate-pulse">
              <div className="aspect-[4/3] bg-zinc-200/70" />
              <div className="p-5 space-y-3">
                <div className="h-3 w-24 bg-zinc-200 rounded" />
                <div className="h-5 w-48 bg-zinc-200 rounded" />
                <div className="h-4 w-20 bg-zinc-200 rounded" />
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-xl p-6 text-sm">
          {error}
        </div>
      )}

      {!loading && !error && visibleProducts.length === 0 && (
        <div className="bg-white border border-zinc-200 rounded-2xl p-12 text-center">
          <p className="font-display text-lg font-semibold text-zinc-900">
            No matching items found
          </p>
          <p className="text-sm text-zinc-500 mt-1">
            Try clearing your search or switching back to all 6 departments.
          </p>
          <button
            type="button"
            onClick={() => {
              onSelectCategory('All');
              onSearchChange('');
              setShowSavedOnly(false);
            }}
            className="mt-4 px-4 py-2 text-sm font-semibold text-white bg-zinc-900 hover:bg-[#9D174D] rounded-lg transition-colors cursor-pointer"
          >
            Show All Departments
          </button>
        </div>
      )}

      {/* Separate Department Sections (Meesho-style grouped view) */}
      {!loading && !error && visibleProducts.length > 0 && shouldShowGroupedSections && (
        <div className="space-y-12">
          {departmentOrder.map((dept) => {
            const deptProducts = visibleProducts.filter((p) => p.category === dept);
            if (deptProducts.length === 0) return null;
            const meta = DEPARTMENT_META[dept];

            return (
              <div key={dept} className="space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-200">
                  <div className="flex items-center gap-3">
                    <span
                      className="w-3 h-7 rounded-sm shrink-0"
                      style={{ backgroundColor: meta.accent }}
                      aria-hidden="true"
                    />
                    <div>
                      <h3 className="font-display text-xl font-bold text-zinc-900">
                        {dept}
                      </h3>
                      <p className="text-xs text-zinc-600">{meta.subtitle}</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onSelectCategory(dept)}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold hover:underline self-start sm:self-center whitespace-nowrap shrink-0 cursor-pointer"
                    style={{ color: meta.accent }}
                  >
                    <span>Explore {dept}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
                  {deptProducts.map(renderProductCard)}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Flat Grid when filtering, searching, or sorting */}
      {!loading && !error && visibleProducts.length > 0 && !shouldShowGroupedSections && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
          {visibleProducts.map(renderProductCard)}
        </div>
      )}
    </section>
  );
}
