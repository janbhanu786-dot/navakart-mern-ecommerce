import { SafeImage } from './SafeImage';

export function StorySection() {
  return (
    <section
      id="story"
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 border-t border-zinc-200"
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        <div className="lg:col-span-7 rounded-2xl overflow-hidden border border-zinc-200 bg-zinc-100 min-h-[300px]">
          <SafeImage
            src="/src/assets/images/veg_farm_basket_1795424698659.jpg"
            alt="Farm-fresh red tomatoes, crisp green bell peppers, tender okra, and spinach ready for packing"
            className="w-full h-full lg:h-full object-cover"
            accentHex="#059669"
            title="Freshness & Quality Sourcing"
          />
        </div>

        <div className="lg:col-span-5 bg-white border border-zinc-200 rounded-2xl p-8 sm:p-10 flex flex-col justify-between gap-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-emerald-700">
              Direct Sourcing &amp; Quality Check
            </p>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-zinc-900 mt-2 text-balance">
              Fresh morning harvests, honest prices, and doorstep convenience.
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-zinc-600">
              Whether you are ordering hand-block-printed kurtis, daily kitchen vegetables, aged
              Basmati staples, sneakers, or skincare, every seller batch passes our 3-point quality
              and packaging check before dispatch.
            </p>
          </div>

          <div className="space-y-4 pt-6 border-t border-zinc-200">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="font-mono-num text-xl font-bold text-zinc-900">6</p>
                <p className="text-xs text-zinc-500 mt-0.5">Departments</p>
              </div>
              <div>
                <p className="font-mono-num text-xl font-bold text-zinc-900">24h</p>
                <p className="text-xs text-zinc-500 mt-0.5">Produce dispatch</p>
              </div>
              <div>
                <p className="font-mono-num text-xl font-bold text-zinc-900">4.9/5</p>
                <p className="text-xs text-zinc-500 mt-0.5">Buyer rating</p>
              </div>
            </div>

            <blockquote className="bg-zinc-50 border border-zinc-200 rounded-xl p-4">
              <p className="text-xs leading-relaxed text-zinc-700">
                “I order our weekly vegetables and groceries alongside kurtis and skincare in a
                single checkout—Cash on Delivery works smoothly and the mangoes arrive ripe.”
              </p>
              <footer className="mt-2.5 text-xs font-semibold text-zinc-900">
                Sravani Rao · Home Chef &amp; Regular Customer, Hyderabad
              </footer>
            </blockquote>
          </div>
        </div>
      </div>
    </section>
  );
}
