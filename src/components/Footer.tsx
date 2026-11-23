import type { ActiveView } from './Header';

interface FooterProps {
  onNavigate: (view: ActiveView, sectionId?: string) => void;
}

export function Footer({ onNavigate }: FooterProps) {
  return (
    <footer className="border-t border-zinc-200 bg-white mt-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 grid grid-cols-1 md:grid-cols-12 gap-8">
        <div className="md:col-span-5">
          <p className="font-display text-lg font-bold text-zinc-900">NavaKart</p>
          <p className="mt-2 text-sm text-zinc-600 max-w-sm leading-relaxed">
            Everyday multi-department shopping across Dresses, Fresh Fruits, Farm Vegetables,
            Groceries, Shoes, and Cosmetics with Cash on Delivery.
          </p>
        </div>

        <div className="md:col-span-3 space-y-2 text-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
            Departments
          </p>
          <ul className="space-y-1.5 text-zinc-700">
            <li>
              <button
                type="button"
                onClick={() => onNavigate('storefront', 'catalog')}
                className="hover:text-zinc-950 cursor-pointer"
              >
                Dresses &amp; Shoes
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() => onNavigate('storefront', 'catalog')}
                className="hover:text-zinc-950 cursor-pointer"
              >
                Fruits, Vegetables &amp; Groceries
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() => onNavigate('track')}
                className="hover:text-zinc-950 cursor-pointer"
              >
                Track Your Order
              </button>
            </li>
          </ul>
        </div>

        <div className="md:col-span-4 space-y-2 text-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
            Customer Care
          </p>
          <p className="text-zinc-600">
            Free delivery on orders above ₹499 · 7-day easy returns · Support Monday to Saturday,
            9am–7pm IST.
          </p>
          <p className="text-xs text-zinc-500 pt-2">
            © {new Date().getFullYear()} NavaKart Retail Pvt. Ltd. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
