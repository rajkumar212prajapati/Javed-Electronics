import React, { useState } from 'react';
import { useStore } from '../../../context/StoreContext';
import { Tag, ArrowRight, ShoppingBag, Eye, CheckCircle2 } from 'lucide-react';
import { formatINR } from '../../../utils/currency';

export const PriceSaleBaseSection: React.FC = () => {
  const {
    homepageSettings,
    products,
    setSelectedProductForDetail,
    addToCart,
    activeBudgetFilter,
    setActiveBudgetFilter,
  } = useStore();

  const section = homepageSettings.sections.find((s) => s.id === 'price_sale_base');
  const slabs = homepageSettings.priceSlabs.filter((s) => s.isActive);

  // Local active slab state (defaults to first slab if not set in store)
  const [selectedSlabId, setSelectedSlabId] = useState<string>(slabs[0]?.id || 'slab-499');

  if (!section || !section.isEnabled) return null;

  const currentSlab = slabs.find((s) => s.id === selectedSlabId) || slabs[0];

  // Products matching the active price slab
  const slabProducts = products.filter((p) => {
    const price = p.dealPrice || p.regularPrice;
    if (currentSlab.minPrice !== undefined && price < currentSlab.minPrice) return false;
    if (currentSlab.maxPrice !== undefined && price > currentSlab.maxPrice) return false;
    return true;
  });

  const handleSelectSlab = (slabId: string, maxPrice: number) => {
    setSelectedSlabId(slabId);
    setActiveBudgetFilter(maxPrice);
  };

  return (
    <section className="w-full max-w-7xl mx-auto px-2.5 sm:px-4 mt-6 sm:mt-10 box-border">
      <div className="bg-gradient-to-br from-slate-900 to-slate-950 rounded-2xl p-4 sm:p-6 text-white shadow-lg border border-slate-800">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 mb-5 border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded">
                {section.badge || 'BUDGET CORNER'}
              </span>
            </div>
            <h2 className="text-lg sm:text-2xl font-black text-white tracking-tight">
              {section.title}
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              {section.subtitle}
            </p>
          </div>

          <div className="text-xs text-slate-400">
            Showing <strong className="text-emerald-400">{slabProducts.length}</strong> items in budget
          </div>
        </div>

        {/* Price Slabs Horizontal Selectors */}
        <div className="flex items-center gap-2 overflow-x-auto pb-3 scrollbar-none mb-5">
          {slabs.map((slab) => {
            const isSelected = selectedSlabId === slab.id;
            const count = products.filter((p) => {
              const price = p.dealPrice || p.regularPrice;
              if (slab.minPrice !== undefined && price < slab.minPrice) return false;
              if (slab.maxPrice !== undefined && price > slab.maxPrice) return false;
              return true;
            }).length;

            return (
              <button
                key={slab.id}
                onClick={() => handleSelectSlab(slab.id, slab.maxPrice)}
                className={`shrink-0 flex flex-col items-start px-3.5 py-2.5 rounded-xl border text-left transition-all cursor-pointer min-w-[130px] ${
                  isSelected
                    ? 'bg-emerald-600 text-white border-emerald-400 shadow-md ring-2 ring-emerald-400/30'
                    : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-800 hover:border-slate-600'
                }`}
              >
                <div className="flex items-center justify-between w-full gap-1 mb-0.5">
                  <span className="text-xs sm:text-sm font-extrabold tracking-tight">
                    {slab.label}
                  </span>
                  {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                </div>
                <span className="text-[10px] opacity-80 font-medium">
                  {count} products • {slab.badge || 'Curated'}
                </span>
              </button>
            );
          })}
        </div>

        {/* Current Slab Tagline */}
        {currentSlab?.tagline && (
          <div className="text-xs text-emerald-300/90 mb-4 bg-emerald-950/40 border border-emerald-800/40 rounded-lg p-2.5 flex items-center gap-2">
            <Tag className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>{currentSlab.tagline}</span>
          </div>
        )}

        {/* Matching Products Shelf */}
        {slabProducts.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-xs">
            No products found matching this price range. Adjust your filters or browse other budgets.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {slabProducts.slice(0, 4).map((prod) => {
              const price = prod.dealPrice || prod.regularPrice;
              const discountPct = prod.mrp > price ? Math.round(((prod.mrp - price) / prod.mrp) * 100) : 0;

              return (
                <div
                  key={prod.id}
                  className="bg-white rounded-xl p-3 sm:p-4 text-slate-900 flex flex-col justify-between shadow-md hover:shadow-xl transition-all border border-slate-200 group"
                >
                  <div className="flex items-center justify-between gap-1 mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded">
                      {currentSlab.label}
                    </span>
                    {discountPct > 0 && (
                      <span className="text-[10px] font-bold text-rose-600">
                        {discountPct}% OFF
                      </span>
                    )}
                  </div>

                  <div
                    onClick={() => setSelectedProductForDetail(prod)}
                    className="w-full h-28 sm:h-36 rounded-lg overflow-hidden bg-slate-50 flex items-center justify-center cursor-pointer mb-2 relative group-hover:scale-[1.02] transition-transform"
                  >
                    <img
                      src={prod.images[0]}
                      alt={prod.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-slate-900/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="bg-white text-slate-900 text-[10px] font-bold px-2 py-1 rounded shadow flex items-center gap-1">
                        <Eye className="w-3 h-3" /> Quick View
                      </span>
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] font-bold uppercase text-slate-400 block truncate">
                      {prod.brand}
                    </span>
                    <h3
                      onClick={() => setSelectedProductForDetail(prod)}
                      className="text-xs sm:text-sm font-bold text-slate-900 line-clamp-2 mt-0.5 hover:text-emerald-600 transition-colors cursor-pointer"
                      title={prod.name}
                    >
                      {prod.name}
                    </h3>

                    <div className="mt-2 flex items-baseline gap-1.5 flex-wrap">
                      <span className="text-base font-extrabold text-slate-900 font-mono">
                        {formatINR(price)}
                      </span>
                      {prod.mrp > price && (
                        <span className="text-xs text-slate-400 line-through font-mono">
                          {formatINR(prod.mrp)}
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => addToCart(prod, 1)}
                    className="mt-3 w-full flex items-center justify-center gap-1.5 py-1.5 sm:py-2 px-3 bg-slate-900 hover:bg-emerald-600 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer min-h-[34px]"
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span>Add to Cart</span>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};
