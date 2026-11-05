import React, { useState, useEffect } from 'react';
import { useStore } from '../../context/StoreContext';
import { formatINR } from '../../utils/currency';
import { ProductCategory } from '../../types';
import { ArrowRight, Check, Copy } from 'lucide-react';

export const HeroBanner: React.FC = () => {
  const {
    products,
    campaigns,
    applyCoupon,
    setSelectedCategory,
    setSelectedProductForDetail,
    setActiveModal,
    addToCart,
  } = useStore();

  const [copiedCoupon, setCopiedCoupon] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);

  const activeCampaign = campaigns.find((c) => c.isActive) || campaigns[0];

  // Live countdown timer state (Hrs : Min : Sec)
  const [timeLeft, setTimeLeft] = useState<{
    hours: number;
    minutes: number;
    seconds: number;
  }>({ hours: 8, minutes: 21, seconds: 37 });

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        let { hours, minutes, seconds } = prev;
        if (seconds > 0) {
          seconds -= 1;
        } else {
          seconds = 59;
          if (minutes > 0) {
            minutes -= 1;
          } else {
            minutes = 59;
            hours = hours > 0 ? hours - 1 : 11;
          }
        }
        return { hours, minutes, seconds };
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Spotlight carousel items from store products
  const spotlightSlides = React.useMemo(() => {
    const featured = products.slice(0, 5);
    return featured.map((p, index) => {
      const price = p.dealPrice || p.regularPrice;
      const subtitles = [
        "Segment's best flagship performance",
        'Crystal clear signature soundstage',
        'Ultra-fast GaN charging protection',
        'Bright AMOLED display & Bluetooth calling',
        '4K Ultra HD smart entertainment',
      ];
      return {
        product: p,
        brand: p.brand.toUpperCase(),
        headline: p.name,
        priceText: `Just ${formatINR(price)}*`,
        subtitle: subtitles[index % subtitles.length],
        image:
          p.images[0] ||
          'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=800&q=80',
      };
    });
  }, [products]);

  useEffect(() => {
    if (spotlightSlides.length <= 1) return;
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % spotlightSlides.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [spotlightSlides.length]);

  const handleCopyCoupon = (code: string) => {
    navigator.clipboard?.writeText(code);
    applyCoupon(code);
    setCopiedCoupon(true);
    setTimeout(() => setCopiedCoupon(false), 2500);
  };

  // 3-Column Featured Offer Cards (matching the 3 cards in the screenshots)
  const threeColumnDeals: {
    id: string;
    brand: string;
    offer: string;
    subtitle: string;
    category: ProductCategory;
    image: string;
  }[] = [
    {
      id: 'deal-audio',
      brand: 'boAt',
      offer: 'Up To 60% Off',
      subtitle: 'True wireless audio',
      category: 'audio',
      image:
        products.find((p) => p.categoryId === 'audio')?.images[0] ||
        'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=600&q=80',
    },
    {
      id: 'deal-watch',
      brand: 'NOISE',
      offer: 'Min. 40% Off',
      subtitle: 'Fine timekeeping',
      category: 'smartwatches',
      image:
        products.find((p) => p.categoryId === 'smartwatches')?.images[0] ||
        'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80',
    },
    {
      id: 'deal-chargers',
      brand: 'ANKER',
      offer: 'Min. 35% Off',
      subtitle: 'Power every step',
      category: 'chargers_cables',
      image:
        products.find((p) => p.categoryId === 'chargers_cables')?.images[0] ||
        'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=600&q=80',
    },
  ];

  const currentSlide = spotlightSlides[activeSlide] || spotlightSlides[0];

  return (
    <div className="w-full max-w-full overflow-hidden">
      {/* 1. FESTIVE SALE COUNTDOWN STRIP (Warm Red-Orange Gradient) */}
      <div
        className="w-full text-white pb-6 pt-2 px-3 sm:px-4 relative"
        style={{
          background: 'linear-gradient(180deg, #f4511e 0%, #ea580c 100%)',
        }}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 sm:gap-4">
          {/* Left Festive Emblem */}
          <div className="bg-blue-900 border-2 border-amber-300 rounded-2xl px-2.5 py-1.5 sm:px-4 sm:py-2 shadow-md shrink-0 text-center">
            <span className="block text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-amber-300 leading-none">
              BIG SHOPPING
            </span>
            <span className="block text-xs sm:text-base font-black uppercase tracking-tight text-[#fde047] leading-tight">
              TECH UTSAV
            </span>
          </div>

          {/* Center Countdown Boxes (Hrs : Min : Sec) */}
          <div className="flex flex-col items-center">
            <span className="text-[11px] sm:text-xs font-bold text-white/95 mb-1">
              Sale ends in
            </span>
            <div className="flex items-center gap-1 sm:gap-1.5">
              <div className="bg-[#be123c] border border-amber-300/80 rounded-xl px-2 py-1 sm:px-3 sm:py-1.5 text-center min-w-[42px] sm:min-w-[52px] shadow-xs">
                <span className="block text-xs sm:text-base font-extrabold font-mono text-white leading-none">
                  {String(timeLeft.hours).padStart(2, '0')}
                </span>
                <span className="block text-[9px] sm:text-[10px] text-amber-200 font-semibold mt-0.5">
                  Hrs
                </span>
              </div>
              <span className="font-bold text-amber-200 text-xs">:</span>
              <div className="bg-[#be123c] border border-amber-300/80 rounded-xl px-2 py-1 sm:px-3 sm:py-1.5 text-center min-w-[42px] sm:min-w-[52px] shadow-xs">
                <span className="block text-xs sm:text-base font-extrabold font-mono text-white leading-none">
                  {String(timeLeft.minutes).padStart(2, '0')}
                </span>
                <span className="block text-[9px] sm:text-[10px] text-amber-200 font-semibold mt-0.5">
                  Min
                </span>
              </div>
              <span className="font-bold text-amber-200 text-xs">:</span>
              <div className="bg-[#be123c] border border-amber-300/80 rounded-xl px-2 py-1 sm:px-3 sm:py-1.5 text-center min-w-[42px] sm:min-w-[52px] shadow-xs">
                <span className="block text-xs sm:text-base font-extrabold font-mono text-white leading-none">
                  {String(timeLeft.seconds).padStart(2, '0')}
                </span>
                <span className="block text-[9px] sm:text-[10px] text-amber-200 font-semibold mt-0.5">
                  Sec
                </span>
              </div>
            </div>
          </div>

          {/* Right Golden Coupon / Action Button */}
          {activeCampaign?.couponCode ? (
            <button
              type="button"
              onClick={() => handleCopyCoupon(activeCampaign.couponCode!)}
              className="bg-gradient-to-b from-amber-300 to-amber-500 hover:from-amber-200 hover:to-amber-400 text-slate-950 font-extrabold text-[11px] sm:text-xs px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl shadow-md flex items-center gap-1.5 cursor-pointer shrink-0 border border-amber-200"
            >
              {copiedCoupon ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-900" />
                  <span>Applied!</span>
                </>
              ) : (
                <>
                  <span className="hidden sm:inline">Use</span>
                  <span className="font-mono">{activeCampaign.couponCode}</span>
                  <span className="bg-white text-blue-700 rounded-md p-0.5">
                    <ArrowRight className="w-3 h-3" />
                  </span>
                </>
              )}
            </button>
          ) : (
            <a
              href="#products-section"
              className="bg-gradient-to-b from-amber-300 to-amber-500 text-slate-950 font-extrabold text-xs px-3.5 py-2 rounded-xl shadow-md flex items-center gap-1"
            >
              <span>Deals</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      </div>

      {/* 2. CURVED WHITE SHEET CONTAINER */}
      <div className="bg-white rounded-t-[24px] -mt-3 pt-2.5 pb-4 px-3 sm:px-4 relative z-10 shadow-[0_-4px_16px_rgba(0,0,0,0.06)]">
        <div className="max-w-7xl mx-auto">
          {/* Top Drag Handle Pill */}
          <div className="w-10 h-1 bg-slate-300 rounded-full mx-auto mb-3" />

          {/* A. SPOTLIGHT DEAL BANNER CAROUSEL (Pastel Mint Green Card) */}
          {currentSlide && (
            <div>
              <div
                onClick={() => {
                  setSelectedProductForDetail(currentSlide.product);
                  setActiveModal('product_detail');
                }}
                className="relative rounded-2xl overflow-hidden border border-lime-200/80 p-4 sm:p-6 md:p-7 cursor-pointer transition-all hover:shadow-md flex items-center justify-between gap-3 sm:gap-6"
                style={{
                  background: 'linear-gradient(125deg, #f7fee7 0%, #dcfce7 55%, #bbf7d0 100%)',
                }}
              >
                {/* Left Text Content */}
                <div className="space-y-1.5 sm:space-y-2 max-w-[60%] sm:max-w-md z-10">
                  <div className="flex items-center gap-2">
                    <span className="text-sm sm:text-lg font-black tracking-wider text-slate-900 uppercase">
                      {currentSlide.brand}
                    </span>
                    <span className="text-slate-300">|</span>
                    <span className="text-[10px] sm:text-xs font-semibold text-slate-600 bg-white/90 border border-slate-200 px-2 py-0.5 rounded-full">
                      Store Verified
                    </span>
                  </div>

                  <h2 className="text-sm sm:text-xl md:text-2xl font-extrabold text-slate-900 leading-snug line-clamp-2">
                    {currentSlide.headline}
                  </h2>

                  <div className="text-base sm:text-2xl font-black text-slate-950 font-mono">
                    {currentSlide.priceText}
                  </div>

                  <p className="text-[11px] sm:text-xs text-slate-700 font-medium line-clamp-1">
                    {currentSlide.subtitle}
                  </p>
                </div>

                {/* Right Product Image */}
                <div className="w-28 h-28 sm:w-40 sm:h-40 md:w-44 md:h-44 shrink-0 rounded-xl overflow-hidden bg-white/80 p-1.5 shadow-sm border border-emerald-200/60 flex items-center justify-center">
                  <img
                    src={currentSlide.image}
                    alt={currentSlide.headline}
                    className="w-full h-full object-cover rounded-lg"
                  />
                </div>

                <span className="absolute bottom-2 right-3 text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-emerald-800/15 text-emerald-900">
                  Featured
                </span>
              </div>

              {/* Carousel Pagination Dots */}
              <div className="flex items-center justify-center gap-1.5 mt-2.5">
                {spotlightSlides.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    aria-label={`Slide ${idx + 1}`}
                    onClick={() => setActiveSlide(idx)}
                    className={`h-1.5 rounded-full transition-all cursor-pointer ${
                      activeSlide === idx ? 'w-7 bg-slate-900' : 'w-2 bg-slate-300 hover:bg-slate-400'
                    }`}
                  />
                ))}
              </div>
            </div>
          )}

          {/* B. 3-COLUMN FEATURED OFFER CARDS ROW */}
          <div className="grid grid-cols-3 gap-2.5 sm:gap-4 mt-4">
            {threeColumnDeals.map((card) => (
              <div
                key={card.id}
                onClick={() => {
                  setSelectedCategory(card.category);
                  const el = document.getElementById('products-section');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                className="group cursor-pointer text-center flex flex-col items-center"
              >
                <div className="relative w-full aspect-square rounded-2xl overflow-hidden bg-slate-100 border border-slate-200/80 shadow-2xs">
                  <img
                    src={card.image}
                    alt={card.brand}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                  {/* Overlapping Brand Box at Bottom of Image */}
                  <div className="absolute bottom-0 inset-x-3 sm:inset-x-6 bg-white rounded-t-lg py-1 px-2 shadow-xs border-t border-x border-slate-100">
                    <span className="text-[10px] sm:text-xs font-black tracking-wider uppercase text-slate-900 block truncate">
                      {card.brand}
                    </span>
                  </div>
                </div>

                <div className="mt-1.5">
                  <div className="text-xs sm:text-sm font-extrabold text-slate-900 leading-tight">
                    {card.offer}
                  </div>
                  <div className="text-[10px] sm:text-xs text-slate-600 truncate max-w-[110px] sm:max-w-none">
                    {card.subtitle}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* C. "ON EVERYBODY'S LIST" PASTEL MINT CURATED SECTION */}
          <div
            id="on-everybodys-list"
            className="mt-5 rounded-3xl bg-[#dcfce7]/75 border border-emerald-200/70 p-3.5 sm:p-5"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">
                On everybody&apos;s list
              </h3>
              <a
                href="#products-section"
                className="text-xs font-bold text-emerald-800 hover:underline flex items-center gap-1"
              >
                <span>View All</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
              {products.slice(0, 4).map((prod) => {
                const price = prod.dealPrice || prod.regularPrice;
                const discountPct =
                  prod.mrp > price ? Math.round(((prod.mrp - price) / prod.mrp) * 100) : 0;
                return (
                  <div
                    key={prod.id}
                    onClick={() => {
                      setSelectedProductForDetail(prod);
                      setActiveModal('product_detail');
                    }}
                    className="bg-white rounded-2xl p-2.5 sm:p-3 border border-emerald-100 shadow-2xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
                  >
                    <div>
                      <div className="aspect-[4/3] rounded-xl overflow-hidden bg-slate-50 mb-2 relative">
                        <img
                          src={prod.images[0]}
                          alt={prod.name}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                        {discountPct > 0 && (
                          <span className="absolute top-1.5 left-1.5 bg-rose-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                            Min. {discountPct}% Off
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] font-bold text-slate-500 uppercase truncate">
                        {prod.brand}
                      </div>
                      <div className="text-xs sm:text-sm font-bold text-slate-900 line-clamp-1">
                        {prod.name}
                      </div>
                    </div>

                    <div className="mt-2 pt-1.5 border-t border-slate-100 flex items-center justify-between gap-1">
                      <span className="text-xs sm:text-sm font-extrabold font-mono text-slate-900">
                        {formatINR(price)}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          addToCart(prod, 1);
                        }}
                        className="px-2 py-1 rounded-lg bg-slate-900 hover:bg-blue-600 text-white text-[10px] font-bold transition-colors cursor-pointer"
                      >
                        + Add
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
