import React from 'react';
import { useStore } from '../../../context/StoreContext';
import { FestivalCampaignRecord } from '../../../types/festivalCampaign';
import { Sparkles, ShoppingBag, Eye } from 'lucide-react';
import { formatINR } from '../../../utils/currency';

interface Props {
  campaign: FestivalCampaignRecord;
}

export const FestivalPromoSection: React.FC<Props> = ({ campaign }) => {
  const { products, addToCart, setSelectedProductForDetail } = useStore();

  const sections = campaign.promotional_sections || [];
  if (sections.length === 0) return null;

  return (
    <div className="w-full max-w-7xl mx-auto px-2.5 sm:px-4 mt-6 sm:mt-8 space-y-6 box-border">
      {sections.map((sec) => {
        const matchingProducts = products.filter((p) =>
          sec.product_ids?.includes(p.id)
        );

        if (matchingProducts.length === 0) return null;

        return (
          <div
            key={sec.id}
            className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-200 shadow-sm"
          >
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 mb-4 border-b border-slate-100 pb-3">
              <div>
                {sec.badge && (
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-900 px-2 py-0.5 rounded inline-block mb-1">
                    {sec.badge}
                  </span>
                )}
                <h3 className="text-base sm:text-xl font-black text-slate-900 tracking-tight">
                  {sec.title}
                </h3>
                {sec.subtitle && (
                  <p className="text-xs text-slate-500 mt-0.5">{sec.subtitle}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-3 sm:gap-4">
              {matchingProducts.map((prod) => {
                const price = prod.dealPrice || prod.regularPrice;
                const discountPct =
                  prod.mrp > price
                    ? Math.round(((prod.mrp - price) / prod.mrp) * 100)
                    : 0;

                return (
                  <div
                    key={prod.id}
                    className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:shadow-md transition-all flex flex-col justify-between"
                  >
                    <div className="flex items-center justify-between gap-1 mb-2">
                      <span className="text-[10px] font-bold text-slate-500 uppercase truncate">
                        {prod.brand}
                      </span>
                      {discountPct > 0 && (
                        <span className="text-[10px] font-black text-rose-600 bg-rose-50 px-1.5 py-0.2 rounded">
                          {discountPct}% OFF
                        </span>
                      )}
                    </div>

                    <div
                      onClick={() => setSelectedProductForDetail(prod)}
                      className="w-full h-28 sm:h-36 rounded-lg overflow-hidden bg-white mb-2 cursor-pointer flex items-center justify-center"
                    >
                      <img
                        src={prod.images[0]}
                        alt={prod.name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <h4
                        onClick={() => setSelectedProductForDetail(prod)}
                        className="text-xs font-bold text-slate-900 line-clamp-2 hover:text-blue-600 cursor-pointer"
                      >
                        {prod.name}
                      </h4>
                      <div className="mt-1 flex items-baseline gap-1.5 font-mono">
                        <span className="text-sm font-black text-slate-900">
                          {formatINR(price)}
                        </span>
                        {prod.mrp > price && (
                          <span className="text-xs text-slate-400 line-through">
                            {formatINR(prod.mrp)}
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => addToCart(prod, 1)}
                      className="mt-2.5 w-full flex items-center justify-center gap-1 py-1.5 px-2 bg-slate-900 hover:bg-amber-600 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                    >
                      <ShoppingBag className="w-3 h-3" />
                      <span>Add to Cart</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};
