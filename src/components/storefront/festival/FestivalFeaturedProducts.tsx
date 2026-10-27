import React from 'react';
import { useStore } from '../../../context/StoreContext';
import { FestivalCampaignRecord } from '../../../types/festivalCampaign';
import { ShoppingBag, Eye, Heart, Sparkles, Star } from 'lucide-react';
import { formatINR } from '../../../utils/currency';

interface Props {
  campaign: FestivalCampaignRecord;
}

export const FestivalFeaturedProducts: React.FC<Props> = ({ campaign }) => {
  const {
    products,
    addToCart,
    setSelectedProductForDetail,
    productLikes,
    userLikedProducts,
    toggleProductLike,
  } = useStore();

  const featuredIds = campaign.featured_product_ids || [];
  const campaignProducts = products.filter((p) =>
    featuredIds.length > 0 ? featuredIds.includes(p.id) : p.isFestiveDeal
  );

  const displayProducts = campaignProducts.length > 0 ? campaignProducts : products.slice(0, 4);

  return (
    <section className="w-full max-w-7xl mx-auto px-2.5 sm:px-4 mt-6 sm:mt-10 box-border">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 mb-4">
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider bg-rose-100 text-rose-800 px-2 py-0.5 rounded flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-rose-600" />
              EXCLUSIVE FESTIVAL CATALOG
            </span>
          </div>
          <h2 className="text-lg sm:text-2xl font-black text-slate-900 tracking-tight">
            Curated {campaign.festival_name} Deals & Bestsellers
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Selected tech products eligible for instant festival coupons and same-day Lucknow delivery
          </p>
        </div>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {displayProducts.map((prod) => {
          const price = prod.dealPrice || prod.regularPrice;
          const discountPct =
            prod.mrp > price ? Math.round(((prod.mrp - price) / prod.mrp) * 100) : 0;
          const isLiked = userLikedProducts.includes(prod.id);
          const likesCount = productLikes[prod.id] || 0;

          return (
            <div
              key={prod.id}
              className="bg-white rounded-2xl p-3 sm:p-4 text-slate-900 flex flex-col justify-between shadow-sm hover:shadow-xl transition-all border border-slate-200 group relative"
            >
              {/* Badges */}
              <div className="flex items-center justify-between gap-1 mb-2">
                <span className="text-[10px] font-black uppercase tracking-wider bg-rose-600 text-white px-2 py-0.5 rounded shadow-xs">
                  {discountPct > 0 ? `${discountPct}% OFF` : 'FESTIVE SPECIAL'}
                </span>
                <button
                  onClick={() => toggleProductLike(prod.id)}
                  className="flex items-center gap-1 text-[11px] text-slate-500 hover:text-rose-600 transition-colors cursor-pointer"
                  title="Favorite"
                >
                  <Heart
                    className={`w-3.5 h-3.5 ${isLiked ? 'fill-rose-500 text-rose-500' : 'text-slate-400'}`}
                  />
                  <span className="font-semibold text-[10px]">{likesCount}</span>
                </button>
              </div>

              {/* Product Image */}
              <div
                onClick={() => setSelectedProductForDetail(prod)}
                className="w-full h-32 sm:h-40 rounded-xl overflow-hidden bg-slate-50 flex items-center justify-center cursor-pointer mb-2 relative group-hover:scale-[1.02] transition-transform"
              >
                <img
                  src={prod.images[0]}
                  alt={prod.name}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-slate-900/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="bg-white/95 text-slate-900 text-[10px] font-bold px-2 py-1 rounded shadow flex items-center gap-1">
                    <Eye className="w-3 h-3" /> Quick View
                  </span>
                </div>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <span className="text-[10px] font-bold uppercase text-slate-400 block truncate">
                  {prod.brand} • {prod.categoryId.replace('_', ' ')}
                </span>
                <h3
                  onClick={() => setSelectedProductForDetail(prod)}
                  className="text-xs sm:text-sm font-bold text-slate-900 line-clamp-2 mt-0.5 hover:text-rose-600 transition-colors cursor-pointer"
                  title={prod.name}
                >
                  {prod.name}
                </h3>

                <div className="mt-1 flex items-center gap-1 text-[11px] text-amber-600">
                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                  <span className="font-bold">{prod.rating.toFixed(1)}</span>
                  <span className="text-slate-400">({prod.reviewsCount})</span>
                </div>

                {/* Price Row */}
                <div className="mt-2 flex items-baseline gap-1.5 flex-wrap">
                  <span className="text-base sm:text-lg font-black text-slate-900 font-mono">
                    {formatINR(price)}
                  </span>
                  {prod.mrp > price && (
                    <span className="text-xs text-slate-400 line-through font-mono">
                      {formatINR(prod.mrp)}
                    </span>
                  )}
                </div>
              </div>

              {/* Action button */}
              <button
                onClick={() => addToCart(prod, 1)}
                className="mt-3 w-full flex items-center justify-center gap-1.5 py-1.5 sm:py-2 px-3 bg-slate-900 hover:bg-rose-600 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer min-h-[34px]"
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>Add to Cart</span>
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
};
