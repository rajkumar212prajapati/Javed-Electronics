import React, { useState, useEffect } from 'react';
import { useStore } from '../../context/StoreContext';
import { Product } from '../../types';
import { formatINR } from '../../utils/currency';
import {
  Flame,
  Clock,
  Sparkles,
  ShoppingBag,
  Star,
  ShieldCheck,
  ChevronRight,
  Plus,
  Check,
} from 'lucide-react';

export const MahaSaleSection: React.FC = () => {
  const {
    products,
    addToCart,
    setSelectedProductForDetail,
    setActiveModal,
  } = useStore();

  const [nowMs, setNowMs] = useState<number>(Date.now());
  const [addedProductId, setAddedProductId] = useState<string | null>(null);

  useEffect(() => {
    const timer = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const liveMahaSaleProducts = products.filter((p) => {
    // 1. Explicitly active in Maha Sale countdown
    const isMahaSaleFlash =
      p.isMahaSaleActive &&
      p.mahaSaleEndTime &&
      new Date(p.mahaSaleEndTime).getTime() > nowMs;

    // 2. JE Assured products ALWAYS list in Maha Sale
    const isJeAssured =
      p.isJeAssured === true ||
      p.badge === 'JE Assured' ||
      p.jeAssuredHealth?.isLiveWithBadge === true ||
      p.jeAssuredHealth?.eligibleForMahaSale === true;

    return isMahaSaleFlash || isJeAssured;
  });

  if (liveMahaSaleProducts.length === 0) return null;

  const formatCountdown = (endTimeStr?: string) => {
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
    <section id="maha-sale-section" className="py-6 sm:py-8 max-w-7xl mx-auto px-4 sm:px-6">
      <div className="bg-linear-to-r from-rose-900 via-rose-800 to-amber-900 rounded-3xl p-5 sm:p-7 text-white shadow-xl relative overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-60 h-60 bg-amber-400/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-60 h-60 bg-rose-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6 pb-4 border-b border-rose-700/60">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/30 border border-amber-400/30 text-amber-300 text-xs font-black uppercase tracking-wider mb-2">
              <Flame className="w-4 h-4 fill-amber-300 animate-pulse text-amber-300" />
              <span>Limited-Time Maha Flash Rush</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2.5">
              <span>⚡ Maha Sale Live Countdown Deals</span>
            </h2>
            <p className="text-xs sm:text-sm text-rose-100/90 max-w-2xl mt-1">
              Store flash deals active with real-time countdown timers. Upon countdown completion, items automatically revert to standard pricing and exit the Maha Sale shelf.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setActiveModal('maha_sale')}
            className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold border border-white/20 backdrop-blur-xs flex items-center gap-1.5 cursor-pointer self-start md:self-end transition-colors"
          >
            <span>View All ({liveMahaSaleProducts.length})</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Live Flash Deal Cards Grid */}
        <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {liveMahaSaleProducts.map((p) => {
            const dealPrice = p.dealPrice || p.regularPrice;
            const savings = p.regularPrice - dealPrice;
            const discountPct =
              p.mahaSaleDiscountPct || Math.round((savings / p.regularPrice) * 100);

            return (
              <div
                key={p.id}
                onClick={() => handleOpenProduct(p)}
                className="group bg-white rounded-2xl p-4 text-slate-900 border-2 border-rose-400 hover:border-amber-400 shadow-md hover:shadow-xl transition-all cursor-pointer flex flex-col justify-between"
              >
                <div>
                  {/* Image Stage */}
                  <div className="relative aspect-[4/3] rounded-xl bg-slate-50 border border-slate-200 overflow-hidden p-3 flex items-center justify-center mb-3">
                    <img
                      src={p.images[0]}
                      alt={p.name}
                      className="w-full h-full object-contain group-hover:scale-105 transition-transform"
                    />

                    {/* Discount Badge */}
                    <div className="absolute top-2 left-2 px-2.5 py-0.5 rounded-full bg-rose-600 text-white text-[10px] font-black uppercase tracking-wider shadow-sm flex items-center gap-1">
                      <Flame className="w-3 h-3 fill-white" />
                      <span>{discountPct}% OFF</span>
                    </div>

                    {/* Countdown Overlay */}
                    <div className="absolute bottom-2 inset-x-2 bg-slate-950/95 text-amber-300 py-1 px-2 rounded-lg flex items-center justify-between text-[11px] font-mono font-black shadow-md border border-rose-500/40">
                      <span className="flex items-center gap-1 text-white text-[10px] uppercase font-sans">
                        <Clock className="w-3 h-3 text-rose-400 animate-spin" />
                        <span>Ends in:</span>
                      </span>
                      <span>{formatCountdown(p.mahaSaleEndTime)}</span>
                    </div>
                  </div>

                  {/* Brand & Name */}
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-rose-600 bg-rose-50 px-2 py-0.5 rounded">
                    {p.brand}
                  </span>
                  <h3 className="text-xs sm:text-sm font-bold text-slate-900 line-clamp-2 mt-1">
                    {p.name}
                  </h3>

                  {/* Star Rating */}
                  <div className="flex items-center gap-1.5 mt-1.5 text-xs">
                    <span className="flex items-center text-amber-500">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    </span>
                    <span className="font-bold text-slate-800">{p.rating}</span>
                    <span className="text-[11px] text-slate-400">({p.reviewsCount})</span>
                  </div>
                </div>

                {/* Pricing & Add to Cart */}
                <div className="pt-3 border-t border-slate-100 mt-3 space-y-2">
                  <div className="flex items-baseline justify-between">
                    <div>
                      <div className="text-lg font-black font-mono text-rose-600">
                        {formatINR(dealPrice)}
                      </div>
                      <div className="text-[11px] text-slate-400 line-through font-mono">
                        {formatINR(p.regularPrice)}
                      </div>
                    </div>
                    <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      Save {formatINR(savings)}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => handleAddToCart(e, p)}
                    className={`w-full py-2 px-3 rounded-xl font-black text-xs shadow-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                      addedProductId === p.id
                        ? 'bg-emerald-600 text-white'
                        : 'bg-rose-600 hover:bg-rose-700 text-white hover:scale-[1.02]'
                    }`}
                  >
                    {addedProductId === p.id ? (
                      <>
                        <Check className="w-4 h-4 stroke-[3]" />
                        <span>Added to Cart!</span>
                      </>
                    ) : (
                      <>
                        <ShoppingBag className="w-3.5 h-3.5" />
                        <span>Claim Deal</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
