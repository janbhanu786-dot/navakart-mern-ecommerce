import { useCallback, useEffect, useState } from 'react';
import { AdminStudioView } from './components/AdminStudioView';
import { AuthGate } from './components/AuthGate';
import { CartDrawer } from './components/CartDrawer';
import { Footer } from './components/Footer';
import { Header, type ActiveView } from './components/Header';
import { HeroSection } from './components/HeroSection';
import { ProductCatalog } from './components/ProductCatalog';
import { ProductDetailModal } from './components/ProductDetailModal';
import { StorySection } from './components/StorySection';
import { TrackOrderView } from './components/TrackOrderView';
import { apiRequest } from './lib/api';
import type {
  AuthUser,
  CartItem,
  Product,
  ProductCategory,
  ProductVariant,
} from './types';

export default function App() {
  const [activeView, setActiveView] = useState<ActiveView>('storefront');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | 'All'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('featured');

  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [bagOpen, setBagOpen] = useState(false);
  const [wishlistIds, setWishlistIds] = useState<string[]>([]);
  const [activeProduct, setActiveProduct] = useState<Product | null>(null);

  // Tokens are stored strictly in React memory for session security
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [adminToken, setAdminToken] = useState<string | null>(null);

  const [trackInitOrder, setTrackInitOrder] = useState('');
  const [trackInitContact, setTrackInitContact] = useState('');

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (selectedCategory !== 'All') params.set('category', selectedCategory);
      if (searchQuery.trim()) params.set('search', searchQuery.trim());
      if (sortBy !== 'featured') params.set('sort', sortBy);

      const queryString = params.toString();
      const url = queryString ? `/api/products?${queryString}` : '/api/products';
      const data = await apiRequest<{ products: Product[] }>(url);
      setProducts(data.products);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, searchQuery, sortBy]);

  useEffect(() => {
    if (!authToken) return;
    void fetchProducts();
  }, [authToken, fetchProducts]);

  const handleNavigate = (view: ActiveView, sectionId?: string) => {
    setActiveView(view);
    if (view === 'storefront' && sectionId) {
      window.setTimeout(() => {
        if (sectionId === 'top') {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
          document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
        }
      }, 40);
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleExploreCategory = (category: ProductCategory | 'All' = 'All') => {
    setSelectedCategory(category);
    setActiveView('storefront');
    window.setTimeout(() => {
      document.getElementById('catalog')?.scrollIntoView({ behavior: 'smooth' });
    }, 40);
  };

  const handleAddToCart = (
    product: Product,
    variant: ProductVariant,
    quantity: number,
  ) => {
    setCartItems((prev) => {
      const idx = prev.findIndex(
        (item) => item.productId === product.id && item.variantId === variant.id,
      );
      if (idx > -1) {
        const next = [...prev];
        const existing = next[idx];
        next[idx] = {
          ...existing,
          quantity: Math.min(variant.stock, existing.quantity + quantity),
        };
        return next;
      }
      return [
        ...prev,
        {
          productId: product.id,
          variantId: variant.id,
          variantName: variant.name,
          variantHex: variant.hex,
          title: product.title,
          image: product.image,
          unitPrice: product.price,
          quantity: Math.min(variant.stock, quantity),
          maxStock: variant.stock,
        },
      ];
    });
  };

  const handleUpdateQty = (productId: string, variantId: string, qty: number) => {
    if (qty <= 0) {
      handleRemoveItem(productId, variantId);
      return;
    }
    setCartItems((prev) =>
      prev.map((item) =>
        item.productId === productId && item.variantId === variantId
          ? { ...item, quantity: qty }
          : item,
      ),
    );
  };

  const handleRemoveItem = (productId: string, variantId: string) => {
    setCartItems((prev) =>
      prev.filter(
        (item) => !(item.productId === productId && item.variantId === variantId),
      ),
    );
  };

  const handleToggleWishlist = (productId: string) => {
    setWishlistIds((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId],
    );
  };

  const handleProductUpdated = (updated: Product) => {
    setProducts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    setActiveProduct(updated);
  };

  if (!authToken || !authUser) {
    return (
      <AuthGate
        onAuthSuccess={(token, user) => {
          setAuthToken(token);
          setAuthUser(user);
          setActiveView('storefront');
          window.scrollTo({ top: 0 });
        }}
      />
    );
  }

  const totalBagCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAFA] text-[#18181B]">
      <Header
        activeView={activeView}
        onNavigate={handleNavigate}
        bagCount={totalBagCount}
        onOpenBag={() => setBagOpen(true)}
      />

      <main className="flex-1">
        {activeView === 'storefront' && (
          <>
            <HeroSection
              onExploreCatalog={handleExploreCategory}
              onJumpToStory={() => handleNavigate('storefront', 'story')}
            />
            <ProductCatalog
              products={products}
              loading={loading}
              error={error}
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              sortBy={sortBy}
              onSortChange={setSortBy}
              wishlistIds={wishlistIds}
              onToggleWishlist={handleToggleWishlist}
              onAddToCart={handleAddToCart}
              onSelectProduct={setActiveProduct}
            />
            <StorySection />
          </>
        )}

        {activeView === 'track' && (
          <TrackOrderView
            initialOrderNumber={trackInitOrder}
            initialContact={trackInitContact}
            authToken={authToken}
            authUser={authUser}
            onAuthSuccess={(token, user) => {
              setAuthToken(token);
              setAuthUser(user);
            }}
            onSignOut={() => {
              setAuthToken(null);
              setAuthUser(null);
              setAdminToken(null);
              setCartItems([]);
              setBagOpen(false);
            }}
          />
        )}

        {activeView === 'admin' && (
          <AdminStudioView
            products={products}
            onRefreshProducts={fetchProducts}
            adminToken={adminToken}
            onAdminTokenChange={setAdminToken}
          />
        )}
      </main>

      <Footer onNavigate={handleNavigate} />

      {activeProduct && (
        <ProductDetailModal
          product={activeProduct}
          onClose={() => setActiveProduct(null)}
          onAddToCart={handleAddToCart}
          authToken={authToken}
          authUser={authUser}
          onAuthSuccess={(token, user) => {
            setAuthToken(token);
            setAuthUser(user);
          }}
          onProductUpdated={handleProductUpdated}
        />
      )}

      <CartDrawer
        open={bagOpen}
        onClose={() => setBagOpen(false)}
        items={cartItems}
        onUpdateQty={handleUpdateQty}
        onRemoveItem={handleRemoveItem}
        onClearCart={() => setCartItems([])}
        authToken={authToken}
        authUser={authUser}
        onOrderPlaced={() => {
          void fetchProducts();
        }}
        onViewOrderTracking={(orderNumber, contact) => {
          setTrackInitOrder(orderNumber);
          setTrackInitContact(contact);
          setActiveView('track');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />
    </div>
  );
}
