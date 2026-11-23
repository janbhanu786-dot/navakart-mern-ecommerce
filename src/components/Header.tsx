import { useState } from 'react';
import { Menu, ShoppingBag, X } from 'lucide-react';

export type ActiveView = 'storefront' | 'track' | 'admin';

interface HeaderProps {
  activeView: ActiveView;
  onNavigate: (view: ActiveView, sectionId?: string) => void;
  bagCount: number;
  onOpenBag: () => void;
}

export function Header({
  activeView,
  onNavigate,
  bagCount,
  onOpenBag,
}: HeaderProps) {
  const [promoVisible, setPromoVisible] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNav = (view: ActiveView, sectionId?: string) => {
    setMobileMenuOpen(false);
    onNavigate(view, sectionId);
  };

  return (
    <div className="sticky top-0 z-40 bg-[#FAFAFA]/95 backdrop-blur-sm border-b border-zinc-200">
      {promoVisible && (
        <div className="bg-[#9D174D] text-white text-xs h-9 px-4 flex items-center justify-center relative">
          <p className="truncate pr-6 font-medium tracking-wide">
            Free delivery above ₹499 · Cash on Delivery available · Code WELCOME10 for 10% off
          </p>
          <button
            type="button"
            onClick={() => setPromoVisible(false)}
            aria-label="Dismiss promotion banner"
            className="absolute right-3 p-1 text-white/80 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <header className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Single text element wordmark */}
        <button
          type="button"
          onClick={() => handleNav('storefront', 'top')}
          className="font-display text-xl font-bold tracking-tight text-zinc-900 whitespace-nowrap shrink-0 cursor-pointer"
        >
          NavaKart
        </button>

        {/* Zone 2: 4 clean single-line text nav links */}
        <nav
          aria-label="Primary navigation"
          className="hidden md:flex items-center gap-7 text-sm font-medium text-zinc-600"
        >
          <button
            type="button"
            onClick={() => handleNav('storefront', 'catalog')}
            className={`whitespace-nowrap shrink-0 py-1 border-b-2 transition-colors cursor-pointer ${
              activeView === 'storefront'
                ? 'text-zinc-900 border-fuchsia-700'
                : 'border-transparent hover:text-zinc-900 hover:border-zinc-300'
            }`}
          >
            Departments
          </button>
          <button
            type="button"
            onClick={() => handleNav('storefront', 'story')}
            className="whitespace-nowrap shrink-0 py-1 border-b-2 border-transparent hover:text-zinc-900 hover:border-zinc-300 transition-colors cursor-pointer"
          >
            Quality Promise
          </button>
          <button
            type="button"
            onClick={() => handleNav('track')}
            className={`whitespace-nowrap shrink-0 py-1 border-b-2 transition-colors cursor-pointer ${
              activeView === 'track'
                ? 'text-zinc-900 border-fuchsia-700'
                : 'border-transparent hover:text-zinc-900 hover:border-zinc-300'
            }`}
          >
            Orders &amp; Account
          </button>
          <button
            type="button"
            onClick={() => handleNav('admin')}
            className={`whitespace-nowrap shrink-0 py-1 border-b-2 transition-colors cursor-pointer ${
              activeView === 'admin'
                ? 'text-zinc-900 border-fuchsia-700'
                : 'border-transparent hover:text-zinc-900 hover:border-zinc-300'
            }`}
          >
            Seller Admin
          </button>
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onOpenBag}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-zinc-900 hover:bg-[#9D174D] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Bag ({bagCount})</span>
          </button>

          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-label="Toggle navigation menu"
            className="md:hidden p-2.5 text-zinc-700 hover:text-zinc-900 rounded-lg border border-zinc-200 bg-white"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {mobileMenuOpen && (
        <div className="md:hidden border-t border-zinc-200 bg-white px-4 py-3 flex flex-col gap-2">
          <button
            type="button"
            onClick={() => handleNav('storefront', 'catalog')}
            className="text-left px-3 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-100 rounded-md"
          >
            All Departments
          </button>
          <button
            type="button"
            onClick={() => handleNav('storefront', 'story')}
            className="text-left px-3 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-100 rounded-md"
          >
            Quality Promise
          </button>
          <button
            type="button"
            onClick={() => handleNav('track')}
            className="text-left px-3 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-100 rounded-md"
          >
            Orders &amp; Account
          </button>
          <button
            type="button"
            onClick={() => handleNav('admin')}
            className="text-left px-3 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-100 rounded-md"
          >
            Seller Admin
          </button>
        </div>
      )}
    </div>
  );
}
