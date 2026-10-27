import React, { useState } from 'react';
import { useStore } from '../../../context/StoreContext';
import { Sparkles, Gift, Copy, Check, ArrowRight, ShoppingBag, Eye, Heart } from 'lucide-react';
import { formatINR } from '../../../utils/currency';

export const FestiveBaseSection: React.FC = () => {
  const {
    homepageSettings,
    products,
    applyCoupon,
    setSelectedProductForDetail,
    addToCart,
    productLikes,
    userLikedProducts,
    toggleProductLike,
    setSelectedCategory,
  } = useStore();

  const [copied, setCopied] = useState(false);
  const [giftPackChecked, setGiftPackChecked] = useState(true);

  const section = homepageSettings.sections.find((s) => s.id === 'festive_base');
  const config = homepageSettings.festiveConfig;

  if (!section || !section.isEnabled) return null;

  const handleCopyCode = () => {
    if (!config.couponCode) return;
    navigator.clipboard?.writeText(config.couponCode);
    applyCoupon(config.couponCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // Find festive products
  const festiveProducts = (config.featuredProductIds || [])
    .map((id) => products.find((p) => p.id === id))
    .filter((p): p is typeof products[0] => !!p);

  const displayProducts = festiveProducts.length > 0 ? festiveProducts : products.slice(0, 4);

  // Theme styling selector
  const getThemeGradient = () => {
    switch (config.themeStyle) {
      case 'diwali':
        return 'from-amber-600 via-rose-700 to-indigo-950 border-amber-400/40';
      case 'eid':
        return 'from-emerald-700 via-teal-800 to-slate-950 border-emerald-400/40';
      case 'holi':
        return 'from-fuchsia-600 via-pink-600 to-amber-600 border-pink-400/40';
      case 'navratri':
        return 'from-red-600 via-orange-600 to-amber-700 border-orange-400/40';
      case 'new_year':
        return 'from-sky-700 via-blue-800 to-slate-950 border-sky-400/40';
      default:
        return 'from-yellow-600 via-amber-700 to-slate-950 border-amber-300/40';
    }
  };

  return (
    <section className="w-full max-w-7xl mx-auto px-2.5 sm:px-4 mt-6 sm:mt-10 box-border">
      {/* Decorative Container */}
      <div
        className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${getThemeGradient()} text-white p-4 sm:p-6 md:p-8 shadow-xl border box-border`}
      >
        {/* Glow Spheres */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-amber-400/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-rose-400/20 rounded-full blur-3xl pointer-events-none" />

        {/* Header Bar */}
        <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
          <div className="space-y-2 max-w-2xl min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-400/20 border border-amber-300/40 text-amber-200 text-xs font-bold rounded-full uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
                {config.badge || section.badge || 'FESTIVE SPECIAL'}
              </span>
              <span className="text-xs text-amber-200/90 font-medium hidden sm:inline">
                {config.greeting}
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight text-white leading-tight">
              {config.bannerHeadline || section.title}
            </h2>

            <p className="text-xs sm:text-sm text-slate-100/90 leading-relaxed">
              {config.bannerSubtext || section.subtitle}
            </p>
          </div>

          {/* Festive Coupon Box */}
          {config.couponCode && (
            <div className="bg-slate-950/80 backdrop-blur-md border border-amber-400/30 rounded-xl p-3 sm:p-4 text-center sm:text-right shrink-0">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300 block mb-1">
                FESTIVE COUPON DISCOUNT
              </span>
              <div className="flex items-center justify-center sm:justify-end gap-2">
                <span className="font-mono text-base sm:text-lg font-black text-white bg-slate-900 px-3 py-1 rounded-md border border-slate-700">
                  {config.couponCode}
                </span>
                <button
                  onClick={handleCopyCode}
                  className="flex items-center gap-1 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-md transition-colors cursor-pointer"
                  title="Click to apply"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-950" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Applied!' : 'Copy & Apply'}</span>
                </button>
              </div>
              <span className="text-[10px] text-slate-300 block mt-1">
                Flat {config.discountPercentage}% OFF on orders ₹{config.minSpend}+
              </span>
            </div>
          )}
        </div>

        {/* Complimentary Gift Packaging Pill */}
        {config.giftPackagingAvailable && (
          <div className="relative z-10 mb-6 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-400 text-slate-950 flex items-center justify-center shrink-0 font-bold shadow-xs">
                <Gift className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold text-amber-200 block sm:inline mr-2">
                  Complimentary Gift Packaging:
                </span>
                <span className="text-slate-100">{config.giftPackNote}</span>
              </div>
            </div>
            <label className="flex items-center gap-2 cursor-pointer select-none shrink-0 bg-slate-900/60 px-2.5 py-1.5 rounded-lg border border-white/10 hover:bg-slate-900/80 transition-colors">
              <input
                type="checkbox"
                checked={giftPackChecked}
                onChange={(e) => setGiftPackChecked(e.target.checked)}
                className="w-4 h-4 text-amber-500 rounded focus:ring-amber-400"
              />
              <span className="text-white font-medium text-xs">Include Free Gift Box & Ribbon</span>
            </label>
          </div>
        )}

        {/* Curated Festive Tech Showcase Grid */}
        <div className="relative z-10 grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {displayProducts.map((prod) => {
            const price = prod.dealPrice || prod.regularPrice;
            const discountPct = prod.mrp > price ? Math.round(((prod.mrp - price) / prod.mrp) * 100) : 0;
            const isLiked = userLikedProducts.includes(prod.id);
            const likesCount = productLikes[prod.id] || 0;

            return (
              <div
                key={prod.id}
                className="bg-white rounded-xl p-3 sm:p-4 text-slate-900 flex flex-col justify-between shadow-md hover:shadow-xl transition-all duration-200 border border-slate-100 group relative"
              >
                {/* Top badges */}
                <div className="flex items-center justify-between gap-1 mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-rose-600 text-white px-1.5 py-0.5 rounded">
                    {discountPct > 0 ? `${discountPct}% OFF` : 'FESTIVE DEAL'}
                  </span>
                  <button
                    onClick={() => toggleProductLike(prod.id)}
                    className="flex items-center gap-1 text-[11px] text-slate-500 hover:text-rose-600 transition-colors cursor-pointer"
                    title="Like this product"
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
                  className="w-full h-32 sm:h-40 rounded-lg overflow-hidden bg-slate-50 flex items-center justify-center cursor-pointer mb-2 relative group-hover:scale-[1.02] transition-transform"
                >
                  <img
                    src={prod.images[0]}
                    alt={prod.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-slate-900/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="bg-white/95 text-slate-800 text-[10px] font-bold px-2 py-1 rounded-md shadow flex items-center gap-1">
                      <Eye className="w-3 h-3" /> Quick View
                    </span>
                  </div>
                </div>

                {/* Product Info */}
                <div className="flex-1 min-w-0">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block truncate">
                    {prod.brand} • {prod.categoryId.replace('_', ' ')}
                  </span>
                  <h3
                    onClick={() => setSelectedProductForDetail(prod)}
                    className="text-xs sm:text-sm font-bold text-slate-900 line-clamp-2 mt-0.5 hover:text-blue-600 transition-colors cursor-pointer"
                    title={prod.name}
                  >
                    {prod.name}
                  </h3>

                  {/* Price Row */}
                  <div className="mt-2 flex items-baseline gap-1.5 flex-wrap">
                    <span className="text-sm sm:text-base font-extrabold text-slate-900 font-mono">
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
                  className="mt-3 w-full flex items-center justify-center gap-1.5 py-1.5 sm:py-2 px-3 bg-slate-900 hover:bg-blue-600 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer min-h-[34px]"
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>Add to Cart</span>
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
