import { ArrowRight, RotateCcw, ShieldCheck, Truck, Wallet } from 'lucide-react';
import { SafeImage } from './SafeImage';
import type { ProductCategory } from '../types';

interface HeroSectionProps {
  onExploreCatalog: (category?: ProductCategory | 'All') => void;
  onJumpToStory: () => void;
}

const DEPARTMENT_TILES: Array<{
  category: ProductCategory;
  label: string;
  subtitle: string;
  swatch: string;
}> = [
  { category: 'Dresses', label: 'Dresses', subtitle: 'Kurtis & Wraps', swatch: '#BE185D' },
  { category: 'Fruits', label: 'Fruits', subtitle: 'Mangoes & Berries', swatch: '#EA580C' },
  { category: 'Vegetables', label: 'Vegetables', subtitle: 'Farm Fresh Daily', swatch: '#059669' },
  { category: 'Groceries', label: 'Groceries', subtitle: 'Rice, Dal & Spices', swatch: '#B45309' },
  { category: 'Shoes', label: 'Shoes', subtitle: 'Sneakers & Loafers', swatch: '#1D4ED8' },
  { category: 'Cosmetics', label: 'Cosmetics', subtitle: 'Lips & Skincare', swatch: '#E11D48' },
];

export function HeroSection({ onExploreCatalog, onJumpToStory }: HeroSectionProps) {
  return (
    <section id="top" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch bg-white border border-zinc-200 rounded-2xl overflow-hidden">
        {/* Left editorial column */}
        <div className="lg:col-span-5 p-7 sm:p-10 flex flex-col justify-between bg-gradient-to-br from-[#FFF1F2] via-white to-[#FFFBEB]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-fuchsia-800 mb-3">
              Six Departments · One Storefront
            </p>
            <h1 className="font-display text-[clamp(2.1rem,3.6vw,3.15rem)] font-bold leading-[1.08] tracking-tight text-zinc-900 text-balance">
              Dresses, fresh produce, pantry, shoes &amp; beauty.
            </h1>
            <p className="mt-4 text-sm sm:text-base leading-relaxed text-zinc-600 max-w-md">
              Browse six dedicated departments with everyday fair prices, morning-picked produce,
              and Cash on Delivery across every category.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={() => onExploreCatalog('All')}
                className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-[#9D174D] hover:bg-fuchsia-900 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <span>Shop All Departments</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={onJumpToStory}
                className="px-3 py-3 text-sm font-semibold text-zinc-700 hover:text-zinc-950 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                Quality Promise
              </button>
            </div>
          </div>

          {/* 6 Colorful Department Quick-Jump Cards */}
          <div className="mt-8 pt-6 border-t border-zinc-200/80">
            <p className="text-xs font-medium text-zinc-500 mb-3">Jump to Department</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {DEPARTMENT_TILES.map((item) => (
                <button
                  key={item.category}
                  type="button"
                  onClick={() => onExploreCatalog(item.category)}
                  className="flex items-start gap-2.5 p-2.5 text-left bg-white border border-zinc-200 hover:border-zinc-400 rounded-lg transition-colors cursor-pointer"
                >
                  <span
                    className="w-2.5 h-2.5 rounded-sm mt-1 shrink-0"
                    style={{ backgroundColor: item.swatch }}
                    aria-hidden="true"
                  />
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-zinc-900 truncate">{item.label}</p>
                    <p className="text-[11px] text-zinc-500 truncate">{item.subtitle}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right full-height multi-department showcase */}
        <div className="lg:col-span-7 relative min-h-[300px] lg:min-h-[500px] bg-zinc-100">
          <SafeImage
            src="/src/assets/images/hero_bazaar_showcase_1795424698066.jpg"
            alt="Colorful silk dresses, basket of mangoes and pomegranates, cobalt and white sneakers, spice jars, and matte lipsticks on display"
            className="w-full h-full lg:h-full object-cover"
            accentHex="#BE185D"
            title="NavaKart Marketplace"
          />
          <div className="absolute inset-x-0 bottom-0 p-6 bg-gradient-to-t from-black/80 via-black/35 to-transparent text-white flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-medium text-white/80">Everything Under One Roof</p>
              <p className="text-sm font-semibold">
                Fashion · Farm Produce · Pantry · Footwear · Beauty
              </p>
            </div>
            <span className="font-mono-num text-xs font-medium text-white/95 shrink-0">
              Starting ₹159
            </span>
          </div>
        </div>
      </div>

      {/* 4-column studio guarantee strip */}
      <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="flex items-center gap-3 bg-white border border-zinc-200 rounded-xl px-4 py-3.5">
          <Truck className="w-5 h-5 text-fuchsia-700 shrink-0" />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-zinc-900 truncate">Free Delivery ₹499+</p>
            <p className="text-xs text-zinc-500 truncate">Same-day produce dispatch</p>
          </div>
        </div>
        <div className="flex items-center gap-3 bg-white border border-zinc-200 rounded-xl px-4 py-3.5">
          <Wallet className="w-5 h-5 text-amber-600 shrink-0" />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-zinc-900 truncate">Cash on Delivery</p>
            <p className="text-xs text-zinc-500 truncate">Pay at your doorstep or online</p>
          </div>
        </div>
        <div className="flex items-center gap-3 bg-white border border-zinc-200 rounded-xl px-4 py-3.5">
          <RotateCcw className="w-5 h-5 text-emerald-700 shrink-0" />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-zinc-900 truncate">7-Day Easy Returns</p>
            <p className="text-xs text-zinc-500 truncate">Instant pickup on apparel &amp; shoes</p>
          </div>
        </div>
        <div className="flex items-center gap-3 bg-white border border-zinc-200 rounded-xl px-4 py-3.5">
          <ShieldCheck className="w-5 h-5 text-blue-700 shrink-0" />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-zinc-900 truncate">Verified Quality</p>
            <p className="text-xs text-zinc-500 truncate">Direct from farms &amp; workshops</p>
          </div>
        </div>
      </div>
    </section>
  );
}
