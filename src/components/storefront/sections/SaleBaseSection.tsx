import React, { useState, useEffect } from 'react';
import { useStore } from '../../../context/StoreContext';
import { Flame, Clock, ShoppingBag, Eye, Zap, ArrowRight, ShieldCheck } from 'lucide-react';
import { formatINR } from '../../../utils/currency';

export const SaleBaseSection: React.FC = () => {
  const {
    homepageSettings,
    products,
    setSelectedProductForDetail,
    addToCart,
  } = useStore();

  const section = homepageSettings.sections.find((s) => s.id === 'sale_base');
  const config = homepageSettings.saleConfig;

  // Countdown timer state
  const [timeLeft, setTimeLeft] = useState<{
    hours: number;
    minutes: number;
    seconds: number;
  }>({ hours: 14, minutes: 32, seconds: 18 });

  useEffect(() => {
    if (!config?.endTime) return;

    const calcTime = () => {
      const diff = new Date(config.endTime).getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0 });
        return;
      }
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeLeft({ hours, minutes, seconds });
    };

    calcTime();
    const interval = setInterval(calcTime, 1000);
    return () => clearInterval(interval);
  }, [config?.endTime]);

  if (!section || !section.isEnabled) return null;

  // Products with deal price or from config
  const saleProducts = products
    .filter((p) => {
      if (config.featuredProductIds && config.featuredProductIds.length > 0) {
        return config.featuredProductIds.includes(p.id);
      }
      return p.dealPrice && p.dealPrice < p.regularPrice;
    })
    .slice(0, 4);

  const displayProducts = saleProducts.length > 0 ? saleProducts : products.slice(0, 4);

  return (
    <section className="w-full max-w-7xl mx-auto px-2.5 sm:px-4 mt-6 sm:mt-10 box-border">
      <div className="bg-gradient-to-r from-red-600 via-rose-600 to-orange-600 rounded-2xl p-4 sm:p-6 text-white shadow-lg border border-red-500/30">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5 border-b border-white/20 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1 bg-white text-red-700 px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider shadow-xs">
                <Flame className="w-3.5 h-3.5 fill-red-600 text-red-600 animate-bounce" />
                {config.badge || section.badge || 'FLASH SALE'}
              </span>
              <span className="text-xs bg-red-950/60 text-amber-300 font-bold px-2 py-0.5 rounded border border-amber-400/30">
                {config.discountBadgeText || 'UP TO 55% OFF'}
              </span>
            </div>
            <h2 className="text-lg sm:text-2xl font-black text-white tracking-tight">
              {config.headline || section.title}
            </h2>
            <p className="text-xs text-red-100">
              {config.subtext || section.subtitle}
            </p>
          </div>

          {/* Countdown Clock */}
          <div className="flex items-center gap-2 bg-slate-950/70 backdrop-blur-sm px-3.5 py-2 rounded-xl border border-red-400/40 shrink-0">
            <Clock className="w-4 h-4 text-amber-400 animate-pulse" />
            <div className="text-right">
              <span className="text-[10px] text-slate-300 uppercase tracking-wider block font-semibold">
                Ends In
              </span>
              <div className="flex items-center gap-1 font-mono font-black text-sm sm:text-base text-white">
                <span className="bg-red-900/80 px-1.5 py-0.5 rounded text-amber-300">
                  {String(timeLeft.hours).padStart(2, '0')}h
                </span>
                <span>:</span>
                <span className="bg-red-900/80 px-1.5 py-0.5 rounded text-amber-300">
                  {String(timeLeft.minutes).padStart(2, '0')}m
                </span>
                <span>:</span>
                <span className="bg-red-900/80 px-1.5 py-0.5 rounded text-amber-300">
                  {String(timeLeft.seconds).padStart(2, '0')}s
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Urgency ticker */}
        {config.urgencyBannerText && (
          <div className="mb-4 bg-red-950/40 border border-red-400/20 rounded-lg px-3 py-1.5 text-xs text-amber-200 flex items-center gap-2">
            <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="font-medium">{config.urgencyBannerText}</span>
          </div>
        )}

        {/* Flash Sale Product Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {displayProducts.map((prod, idx) => {
            const price = prod.dealPrice || prod.regularPrice;
            const savings = prod.mrp - price;
            const discountPct = prod.mrp > price ? Math.round((savings / prod.mrp) * 100) : 0;
            // Simulated deal stock progress (80% claimed)
            const claimedPct = 65 + (idx * 8);

            return (
              <div
                key={prod.id}
                className="bg-white rounded-xl p-3 sm:p-4 text-slate-900 flex flex-col justify-between shadow-md hover:shadow-xl transition-all border border-slate-100 group relative"
              >
                {/* Sale Badge */}
                <div className="flex items-center justify-between gap-1 mb-2">
                  <span className="text-[10px] font-black uppercase tracking-wider bg-red-600 text-white px-2 py-0.5 rounded shadow-xs">
                    {discountPct}% OFF
                  </span>
                  <span className="text-[10px] font-bold text-amber-600 flex items-center gap-0.5">
                    <Zap className="w-3 h-3 fill-amber-500 text-amber-500" />
                    Deal
                  </span>
                </div>

                {/* Product Image */}
                <div
                  onClick={() => setSelectedProductForDetail(prod)}
                  className="w-full h-32 sm:h-36 rounded-lg overflow-hidden bg-slate-50 flex items-center justify-center cursor-pointer mb-2 relative group-hover:scale-[1.02] transition-transform"
                >
                  <img
                    src={prod.images[0]}
                    alt={prod.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-slate-900/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="bg-white text-slate-900 text-[10px] font-bold px-2 py-1 rounded shadow flex items-center gap-1">
                      <Eye className="w-3 h-3" /> View
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
                    className="text-xs sm:text-sm font-bold text-slate-900 line-clamp-2 mt-0.5 hover:text-red-600 transition-colors cursor-pointer"
                    title={prod.name}
                  >
                    {prod.name}
                  </h3>

                  {/* Pricing */}
                  <div className="mt-2 flex items-baseline gap-1.5 flex-wrap">
                    <span className="text-base sm:text-lg font-black text-red-600 font-mono">
                      {formatINR(price)}
                    </span>
                    {prod.mrp > price && (
                      <span className="text-xs text-slate-400 line-through font-mono">
                        {formatINR(prod.mrp)}
                      </span>
                    )}
                  </div>

                  {/* Stock Bar */}
                  <div className="mt-2 space-y-1">
                    <div className="flex items-center justify-between text-[10px] font-medium text-slate-500">
                      <span>Claimed: {claimedPct}%</span>
                      <span className="text-red-600 font-bold">Only few left!</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-amber-500 to-red-600 h-1.5 rounded-full"
                        style={{ width: `${claimedPct}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Action button */}
                <button
                  onClick={() => addToCart(prod, 1)}
                  className="mt-3 w-full flex items-center justify-center gap-1.5 py-1.5 sm:py-2 px-3 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors cursor-pointer min-h-[34px]"
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>Claim Deal</span>
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
