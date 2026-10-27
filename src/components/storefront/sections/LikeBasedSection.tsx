import React from 'react';
import { useStore } from '../../../context/StoreContext';
import { Heart, Star, ShoppingBag, Eye, Quote, ShieldCheck } from 'lucide-react';
import { formatINR } from '../../../utils/currency';

export const LikeBasedSection: React.FC = () => {
  const {
    homepageSettings,
    products,
    productLikes,
    userLikedProducts,
    toggleProductLike,
    setSelectedProductForDetail,
    addToCart,
  } = useStore();

  const section = homepageSettings.sections.find((s) => s.id === 'like_based');
  const config = homepageSettings.likeConfig;

  if (!section || !section.isEnabled) return null;

  // Filter 4.5+ star rating or top liked products
  const likedProducts = products
    .filter((p) => p.rating >= (config.minRating || 4.5))
    .sort((a, b) => (productLikes[b.id] || 0) - (productLikes[a.id] || 0))
    .slice(0, 4);

  const displayProducts = likedProducts.length > 0 ? likedProducts : products.slice(0, 4);

  return (
    <section className="w-full max-w-7xl mx-auto px-2.5 sm:px-4 mt-6 sm:mt-10 box-border">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 mb-4">
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider bg-rose-100 text-rose-800 px-2 py-0.5 rounded">
              {config.badge || section.badge || 'CUSTOMER FAVORITES'}
            </span>
            <span className="text-xs text-amber-600 font-bold flex items-center gap-1">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              Rated 4.8+ by 2,400+ Lucknow Buyers
            </span>
          </div>
          <h2 className="text-lg sm:text-2xl font-black text-slate-900 tracking-tight">
            {config.headline || section.title}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            {config.subtext || section.subtitle}
          </p>
        </div>
      </div>

      {/* Customer Favorites Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {displayProducts.map((prod) => {
          const price = prod.dealPrice || prod.regularPrice;
          const isLiked = userLikedProducts.includes(prod.id);
          const likesCount = productLikes[prod.id] || 120;

          // Matching quote if available
          const quoteObj = config.featuredQuotes?.find((q) => q.productId === prod.id);

          return (
            <div
              key={prod.id}
              className="bg-white rounded-2xl p-3 sm:p-4 text-slate-900 flex flex-col justify-between shadow-md hover:shadow-xl transition-all border border-slate-200 group relative"
            >
              {/* Top rating & like heart */}
              <div className="flex items-center justify-between gap-1 mb-2">
                <div className="flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded text-xs font-bold text-amber-800 border border-amber-200">
                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                  <span>{prod.rating.toFixed(1)}</span>
                  <span className="text-[10px] text-amber-600 font-normal">({prod.reviewsCount})</span>
                </div>

                <button
                  onClick={() => toggleProductLike(prod.id)}
                  className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full transition-colors cursor-pointer select-none ${
                    isLiked
                      ? 'bg-rose-50 text-rose-600 font-bold border border-rose-200'
                      : 'bg-slate-100 text-slate-600 hover:text-rose-600'
                  }`}
                  title={isLiked ? 'Unlike' : 'Like this item'}
                >
                  <Heart
                    className={`w-3.5 h-3.5 ${isLiked ? 'fill-rose-500 text-rose-500 animate-pulse' : 'text-slate-400'}`}
                  />
                  <span className="text-[10px]">{likesCount}</span>
                </button>
              </div>

              {/* Product Image */}
              <div
                onClick={() => setSelectedProductForDetail(prod)}
                className="w-full h-32 sm:h-38 rounded-lg overflow-hidden bg-slate-50 flex items-center justify-center cursor-pointer mb-2 relative group-hover:scale-[1.02] transition-transform"
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

              {/* Info */}
              <div className="flex-1 min-w-0">
                <span className="text-[10px] font-bold uppercase text-slate-400 block truncate">
                  {prod.brand}
                </span>
                <h3
                  onClick={() => setSelectedProductForDetail(prod)}
                  className="text-xs sm:text-sm font-bold text-slate-900 line-clamp-2 mt-0.5 hover:text-rose-600 transition-colors cursor-pointer"
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

                {/* Customer Quote Snippet if present */}
                {quoteObj && (
                  <div className="mt-2.5 bg-slate-50 border border-slate-100 rounded-lg p-2 text-[10px] text-slate-600 italic flex items-start gap-1">
                    <Quote className="w-3 h-3 text-rose-400 shrink-0 mt-0.5" />
                    <div>
                      <span>"{quoteObj.quote}"</span>
                      <span className="block not-italic font-bold text-slate-700 text-[9px] mt-0.5">
                        — {quoteObj.customerName} ({quoteObj.verifiedLocation})
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Button */}
              <button
                onClick={() => addToCart(prod, 1)}
                className="mt-3 w-full flex items-center justify-center gap-1.5 py-1.5 sm:py-2 px-3 bg-slate-900 hover:bg-rose-600 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer min-h-[34px]"
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
