import React, { useState, useEffect } from 'react';
import { useStore } from '../../context/StoreContext';
import { Product } from '../../types';
import { formatINR } from '../../utils/currency';
import {
  Flame,
  X,
  ArrowLeft,
  Clock,
  ShoppingBag,
  Check,
  Star,
  ShieldCheck,
  ArrowRight,
  Zap,
} from 'lucide-react';

export const MahaSaleModal: React.FC = () => {
  const {
    activeModal,
    setActiveModal,
    products,
    addToCart,
    setSelectedProductForDetail,
    getProductJeAssuredHealth,
    settings,
  } = useStore();

  const [nowMs, setNowMs] = useState<number>(Date.now());
  const [addedProductId, setAddedProductId] = useState<string | null>(null);

  useEffect(() => {
    if (activeModal !== 'maha_sale') return;
    const timer = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [activeModal]);

  if (activeModal !== 'maha_sale') return null;

  // Active Live Maha Sale products (including all JE Assured products)
  const liveMahaSaleProducts = products.filter((p) => {
    const isMahaSaleFlash =
      p.isMahaSaleActive &&
      p.mahaSaleEndTime &&
      new Date(p.mahaSaleEndTime).getTime() > nowMs;

    const isJeAssured =
      p.isJeAssured === true ||
      p.badge === 'JE Assured' ||
      p.jeAssuredHealth?.isLiveWithBadge === true ||
      p.jeAssuredHealth?.eligibleForMahaSale === true;

    return isMahaSaleFlash || isJeAssured;
  });

  const formatTimeLeft = (endTimeStr?: string) => {
    const end = endTimeStr ? new Date(endTimeStr).getTime() : nowMs + 18 * 3600 * 1000;
    const diff = end - nowMs;
    if (diff <= 0) return '00h 00m 00s';

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const secs = Math.floor((diff % (1000 * 60)) / 1000);

    return `${String(hours).padStart(2, '0')}h ${String(mins).padStart(2, '0')}m ${String(secs).padStart(2, '0')}s`;
  };

  const handleAddToCart = (e: React.MouseEvent, p: Product) => {
    e.stopPropagation();
    const res = addToCart(p, 1);
    if (res.success) {
      setAddedProductId(p.id);
      setTimeout(() => setAddedProductId(null), 1500);
    }
  };

  const handleOpenProduct = (p: Product) => {
    setSelectedProductForDetail(p);
    setActiveModal('product_detail');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-50 flex flex-col w-screen h-screen pb-14 overflow-hidden animate-in fade-in duration-200">
      {/* Full-Screen Sticky Top Bar */}
      <div className="bg-linear-to-r from-rose-700 via-rose-600 to-amber-600 text-white px-4 sm:px-6 py-3.5 sm:py-4 shrink-0 relative overflow-hidden shadow-md">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="max-w-7xl mx-auto relative z-10 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setActiveModal(null)}
              className="w-9 h-9 rounded-full bg-black/20 hover:bg-black/35 text-white flex items-center justify-center transition-colors cursor-pointer shrink-0"
              aria-label="Back to Home"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="min-w-0">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-black/25 text-amber-300 text-[10px] font-black uppercase tracking-wider mb-0.5">
                <Flame className="w-3 h-3 fill-amber-300 animate-pulse" />
                <span>Live Maha Flash Rush • {liveMahaSaleProducts.length} Active Deals</span>
              </div>
              <h1 className="text-lg sm:text-2xl font-black tracking-tight truncate">
                🔥 Maha Sale Explosive Discounts
              </h1>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setActiveModal(null)}
            className="p-2 text-white/90 hover:text-white bg-black/20 hover:bg-black/35 rounded-full cursor-pointer transition-colors shrink-0"
            aria-label="Close Maha Sale"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Full-Screen Scrollable Body */}
      <div className="flex-1 overflow-y-auto">
        {/* Sub-banner notice */}
        <div className="bg-rose-950 text-rose-100 px-4 py-2 text-xs border-b border-rose-800/60">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 flex-wrap">
            <span className="flex items-center gap-1.5 font-medium">
              <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400 shrink-0" />
              <span>
                Store-accepted flash deals with live countdowns. When timer reaches 00:00:00, price automatically reverts to regular!
              </span>
            </span>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 pb-8">
          {liveMahaSaleProducts.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-10 sm:p-16 text-center space-y-3 my-6 shadow-xs">
              <div className="w-16 h-16 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center mx-auto">
                <Flame className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-black text-slate-900">Next Flash Rush Starting Soon</h3>
              <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
                All previous flash deals have completed their countdown and returned to normal catalogue pricing. Stay tuned for store nominations!
              </p>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer inline-flex items-center gap-2"
              >
                <span>Browse All Products</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {liveMahaSaleProducts.map((p) => {
                const dealPrice = p.dealPrice || p.regularPrice;
                const savings = p.regularPrice - dealPrice;
                const discountPct =
                  p.mahaSaleDiscountPct || Math.round((savings / p.regularPrice) * 100);

                return (
                  <div
                    key={p.id}
                    onClick={() => handleOpenProduct(p)}
                    className="group bg-white rounded-2xl border-2 border-rose-200 hover:border-rose-500 p-4 transition-all shadow-xs hover:shadow-md cursor-pointer flex flex-col justify-between"
                  >
                    <div>
                      {/* Image Stage + Countdown Pill */}
                      <div className="relative aspect-square rounded-xl bg-slate-50 border border-slate-100 overflow-hidden mb-3 p-3 flex items-center justify-center">
                        <img
                          src={p.images[0]}
                          alt={p.name}
                          className="w-full h-full object-contain group-hover:scale-105 transition-transform"
                        />

                        {/* Top Left: Flash Discount Pill + Optional JE Assured Badge */}
                        <div className="absolute top-2 left-2 flex flex-col items-start gap-1">
                          <div className="px-2.5 py-0.5 rounded-full bg-rose-600 text-white text-[10px] font-black uppercase tracking-wider shadow-sm flex items-center gap-1">
                            <Flame className="w-3 h-3 fill-white" />
                            <span>{discountPct}% OFF</span>
                          </div>
                          {(() => {
                            const jeHealth = getProductJeAssuredHealth(p);
                            if (
                              settings.assuredBadgeEnabled !== false &&
                              jeHealth.isLiveWithBadge &&
                              jeHealth.roundedScore >= 4
                            ) {
                              return (
                                <div
                                  className="px-2 py-0.5 rounded-md text-white text-[10px] font-bold shadow-xs flex items-center gap-1"
                                  style={{
                                    background:
                                      settings.assuredBadgeColor ||
                                      'linear-gradient(90deg, #c2185b 0%, #e53935 100%)',
                                  }}
                                >
                                  <ShieldCheck className="w-3 h-3 text-white" />
                                  <span>{settings.assuredBadgeName || 'JE Assured'}</span>
                                </div>
                              );
                            }
                            return null;
                          })()}
                        </div>

                        {/* Top Right: Verified Genuine */}
                        <div className="absolute top-2 right-2 p-1 rounded-full bg-white/90 text-emerald-600 shadow-2xs">
                          <ShieldCheck className="w-3.5 h-3.5" />
                        </div>

                        {/* Bottom Bar: Live Countdown */}
                        <div className="absolute bottom-2 inset-x-2 bg-slate-950/90 text-amber-300 backdrop-blur-xs py-1.5 px-2.5 rounded-lg flex items-center justify-between text-[11px] font-mono font-black shadow-md border border-rose-500/30">
                          <span className="flex items-center gap-1 text-white text-[10px] uppercase font-sans">
                            <Clock className="w-3 h-3 text-rose-400 animate-spin" />
                            <span>Ends in:</span>
                          </span>
                          <span className="tracking-wider">
                            {formatTimeLeft(p.mahaSaleEndTime)}
                          </span>
                        </div>
                      </div>

                      {/* Brand & Title */}
                      <div className="space-y-1">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-rose-600 bg-rose-50 px-2 py-0.5 rounded">
                          {p.brand}
                        </span>
                        <h4 className="text-sm font-bold text-slate-900 line-clamp-2">
                          {p.name}
                        </h4>
                      </div>

                      {/* Rating */}
                      <div className="flex items-center gap-1.5 mt-1.5 text-xs">
                        <span className="flex items-center text-amber-500">
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        </span>
                        <span className="font-bold text-slate-800">{p.rating}</span>
                        <span className="text-[11px] text-slate-400">({p.reviewsCount})</span>
                      </div>
                    </div>

                    {/* Pricing & Add to Cart */}
                    <div className="pt-3 border-t border-slate-100 mt-3 space-y-2.5">
                      <div className="flex items-baseline justify-between">
                        <div>
                          <div className="text-lg font-black font-mono text-rose-600">
                            {formatINR(dealPrice)}
                          </div>
                          <div className="text-[11px] text-slate-400 line-through font-mono">
                            Regular: {formatINR(p.regularPrice)}
                          </div>
                        </div>
                        <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-200">
                          Save {formatINR(savings)}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => handleAddToCart(e, p)}
                        className={`w-full py-2.5 px-3 rounded-xl font-black text-xs shadow-sm flex items-center justify-center gap-2 cursor-pointer transition-all ${
                          addedProductId === p.id
                            ? 'bg-emerald-600 text-white'
                            : 'bg-rose-600 hover:bg-rose-700 text-white hover:scale-[1.01]'
                        }`}
                      >
                        {addedProductId === p.id ? (
                          <>
                            <Check className="w-4 h-4 stroke-[3]" />
                            <span>Added to Cart!</span>
                          </>
                        ) : (
                          <>
                            <ShoppingBag className="w-4 h-4" />
                            <span>Claim Flash Deal</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
