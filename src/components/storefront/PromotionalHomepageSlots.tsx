import React, { useMemo } from 'react';
import { useStore } from '../../context/StoreContext';
import { PromoHomepagePlacement, PromotionalPage } from '../../types';
import { isPromotionalPageCurrentlyActive } from '../../utils/promotionalEngine';
import {
  Sparkles,
  Zap,
  Flame,
  Tag,
  Clock,
  Gift,
  ArrowRight,
  ShieldCheck,
  Percent,
} from 'lucide-react';

interface PromotionalHomepageSlotProps {
  position: PromoHomepagePlacement;
}

export const PromotionalHomepageSlot: React.FC<PromotionalHomepageSlotProps> = ({ position }) => {
  const {
    promotionalPages,
    setActivePromotionalPage,
    setActiveModal,
    storeSlotProductBanners,
    promotionSlots,
    products,
    setSelectedProductForDetail,
  } = useStore();

  // Find all currently active promotional pages assigned to this homepage position
  const activePromos = useMemo(() => {
    return promotionalPages
      .filter((p) => p.homepagePlacements.includes(position) && isPromotionalPageCurrentlyActive(p))
      .sort((a, b) => (a.priority || 0) - (b.priority || 0));
  }, [promotionalPages, position]);

  // Find store product banners linked to slots at this position
  const activeSlotProductBanners = useMemo(() => {
    const slotIdsAtPosition = new Set(
      promotionSlots
        .filter((s) => s.placement === position && s.status === 'active')
        .map((s) => s.id)
    );
    return storeSlotProductBanners.filter((b) => slotIdsAtPosition.has(b.slotId));
  }, [promotionSlots, storeSlotProductBanners, position]);

  if (activePromos.length === 0 && activeSlotProductBanners.length === 0) return null;

  const handleOpenPromo = (promo: PromotionalPage) => {
    setActivePromotionalPage(promo);
    setActiveModal('promotional_page');
  };

  const handleOpenLinkedProduct = (productId: string) => {
    const prod = products.find((p) => p.id === productId);
    if (prod) {
      setSelectedProductForDetail(prod);
      setActiveModal('product_detail');
    }
  };

  const renderIcon = (iconName?: string) => {
    switch (iconName) {
      case 'Zap':
        return <Zap className="w-4 h-4 text-amber-300" />;
      case 'Flame':
        return <Flame className="w-4 h-4 text-rose-400" />;
      case 'Gift':
        return <Gift className="w-4 h-4 text-pink-300" />;
      case 'Clock':
        return <Clock className="w-4 h-4 text-blue-300" />;
      case 'Percent':
        return <Percent className="w-4 h-4 text-emerald-300" />;
      case 'Tag':
        return <Tag className="w-4 h-4 text-indigo-300" />;
      default:
        return <Sparkles className="w-4 h-4 text-amber-300" />;
    }
  };

  // ==========================================
  // TOP POSITION (Announcements / Top Marquee Banner)
  // ==========================================
  if (position === 'top') {
    const primaryBanner = activeSlotProductBanners[0];
    const primaryPromo = activePromos[0];

    if (primaryBanner) {
      return (
        <div className="w-full bg-slate-900 text-white border-b border-slate-800 shadow-xs relative z-20">
          <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2 flex items-center justify-between gap-3 text-xs">
            <div
              onClick={() => handleOpenLinkedProduct(primaryBanner.productId)}
              className="flex items-center gap-2.5 truncate cursor-pointer group flex-1"
            >
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-600 text-white shrink-0 animate-pulse">
                {primaryBanner.discountPct}% OFF
              </span>
              <div className="flex items-center gap-1.5 truncate">
                <Flame className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="font-bold text-slate-100 group-hover:text-amber-300 transition-colors truncate">
                  {primaryBanner.headline} — {primaryBanner.productName}
                </span>
                <span className="text-[11px] font-mono text-emerald-400 font-bold shrink-0">
                  ₹{primaryBanner.salePrice.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleOpenLinkedProduct(primaryBanner.productId)}
              className="hidden sm:inline-flex items-center gap-1.5 text-[11px] font-black text-amber-400 hover:text-amber-300 hover:underline shrink-0 cursor-pointer"
            >
              <span>{primaryBanner.ctaText || 'Claim Deal'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      );
    }

    if (primaryPromo) {
      return (
        <div className="w-full bg-slate-900 text-white border-b border-slate-800 shadow-xs relative z-20">
          <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2 flex items-center justify-between gap-3 text-xs">
            <div
              onClick={() => handleOpenPromo(primaryPromo)}
              className="flex items-center gap-2.5 truncate cursor-pointer group flex-1"
            >
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-500 text-white shrink-0 animate-pulse">
                {primaryPromo.badgeText || 'LIVE PROMO'}
              </span>
              <div className="flex items-center gap-1.5 truncate">
                {renderIcon(primaryPromo.placementIcon)}
                <span className="font-bold text-slate-100 group-hover:text-amber-300 transition-colors truncate">
                  {primaryPromo.placementText || primaryPromo.bannerHeadline}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleOpenPromo(primaryPromo)}
              className="hidden sm:inline-flex items-center gap-1.5 text-[11px] font-black text-amber-400 hover:text-amber-300 hover:underline shrink-0 cursor-pointer"
            >
              <span>Explore Deals</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      );
    }
    return null;
  }

  // ==========================================
  // MIDDLE POSITION (Featured Card / Banner between sections)
  // ==========================================
  if (position === 'middle') {
    return (
      <div className="w-full max-w-7xl mx-auto px-2.5 sm:px-4 my-6 sm:my-8 box-border">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Store-linked Product Banners in Middle Slot */}
          {activeSlotProductBanners.slice(0, 2).map((banner) => (
            <div
              key={banner.id}
              onClick={() => handleOpenLinkedProduct(banner.productId)}
              className="group relative rounded-2xl overflow-hidden cursor-pointer shadow-md hover:shadow-xl transition-all border border-slate-700/60 flex flex-col justify-between min-h-[170px] sm:min-h-[200px] bg-slate-950"
            >
              {/* Custom Store Banner Image */}
              <div
                className="absolute inset-0 z-0 opacity-40 group-hover:opacity-50 group-hover:scale-105 transition-all duration-500 bg-cover bg-center"
                style={{ backgroundImage: `url(${banner.bannerImageUrl})` }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent z-1" />

              <div className="relative z-10 p-5 sm:p-6 text-white flex flex-col justify-between h-full space-y-3">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] font-black uppercase tracking-wider bg-rose-600 px-2.5 py-0.5 rounded-full text-white shadow-xs">
                      {banner.discountPct}% OFF
                    </span>
                    <span className="text-[10px] text-amber-300 font-mono font-medium">
                      {banner.slotName}
                    </span>
                  </div>

                  <h3 className="text-base sm:text-xl font-black tracking-tight leading-snug group-hover:text-amber-200 transition-colors">
                    {banner.headline}
                  </h3>
                  {banner.subheadline && (
                    <p className="text-xs text-slate-200/90 line-clamp-2 mt-1">
                      {banner.subheadline}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-white/15">
                  <div className="flex items-center gap-2">
                    <span className="text-base sm:text-lg font-black font-mono text-emerald-400">
                      ₹{banner.salePrice.toLocaleString('en-IN')}
                    </span>
                    <span className="text-xs text-slate-400 line-through font-mono">
                      ₹{banner.regularPrice.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <span className="inline-flex items-center gap-1 text-xs font-black text-amber-300 group-hover:translate-x-1 transition-transform">
                    <span>{banner.ctaText || 'Shop Deal'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            </div>
          ))}

          {/* Fallback to Active Promos if banners < 2 */}
          {activeSlotProductBanners.length < 2 &&
            activePromos.slice(0, 2 - activeSlotProductBanners.length).map((promo) => {
              const hasCustomTheme = !!promo.bannerTheme;
              return (
                <div
                  key={promo.id}
                  onClick={() => handleOpenPromo(promo)}
                  className="group relative rounded-2xl overflow-hidden cursor-pointer shadow-md hover:shadow-xl transition-all border border-slate-200/80 flex flex-col justify-between min-h-[160px] sm:min-h-[190px]"
                  style={{
                    background: hasCustomTheme
                      ? promo.bannerTheme
                      : 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%)',
                  }}
                >
                  {promo.bannerImageUrl && (
                    <div
                      className="absolute inset-0 z-0 opacity-20 group-hover:opacity-30 group-hover:scale-105 transition-all duration-500 bg-cover bg-center"
                      style={{ backgroundImage: `url(${promo.bannerImageUrl})` }}
                    />
                  )}

                  <div className="relative z-10 p-5 sm:p-6 text-white flex flex-col justify-between h-full space-y-3">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[10px] font-black uppercase tracking-wider bg-white/20 backdrop-blur-xs px-2.5 py-0.5 rounded-full text-amber-300 border border-white/20 flex items-center gap-1">
                          {renderIcon(promo.placementIcon)}
                          <span>{promo.badgeText || 'SPECIAL EVENT'}</span>
                        </span>
                        <span className="text-[10px] text-slate-300 font-mono font-medium">
                          {promo.basisType.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>

                      <h3 className="text-base sm:text-xl font-black tracking-tight leading-snug group-hover:text-amber-200 transition-colors">
                        {promo.bannerHeadline}
                      </h3>
                      <p className="text-xs text-slate-200/90 line-clamp-2 mt-1">
                        {promo.bannerSubtext}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-white/15">
                      <span className="text-[11px] text-amber-300 font-bold flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                        <span>JE Assured Quality</span>
                      </span>
                      <span className="inline-flex items-center gap-1 text-xs font-black text-white group-hover:translate-x-1 transition-transform">
                        <span>View Products</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    );
  }

  // ==========================================
  // BOTTOM POSITION (Bottom Showcase Bar before Footer)
  // ==========================================
  if (position === 'bottom') {
    const bottomBanner = activeSlotProductBanners[0];
    const bottomPromo = activePromos[0];

    if (bottomBanner) {
      return (
        <div className="w-full max-w-7xl mx-auto px-2.5 sm:px-4 my-8 box-border">
          <div
            onClick={() => handleOpenLinkedProduct(bottomBanner.productId)}
            className="relative rounded-2xl overflow-hidden cursor-pointer shadow-lg group border border-slate-700 transition-all p-5 sm:p-7 text-white flex flex-col md:flex-row md:items-center justify-between gap-4 bg-linear-to-r from-slate-900 via-indigo-950 to-slate-900"
          >
            <div
              className="absolute inset-0 z-0 opacity-25 group-hover:opacity-35 transition-opacity bg-cover bg-center"
              style={{ backgroundImage: `url(${bottomBanner.bannerImageUrl})` }}
            />

            <div className="relative z-10 space-y-1.5 max-w-2xl">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-600 text-white font-mono">
                  {bottomBanner.discountPct}% OFF
                </span>
                <span className="text-xs text-amber-300 font-mono font-bold">
                  {bottomBanner.slotName}
                </span>
              </div>
              <h3 className="text-lg sm:text-2xl font-black tracking-tight leading-tight group-hover:text-amber-300 transition-colors">
                {bottomBanner.headline}
              </h3>
              <p className="text-xs text-slate-300 line-clamp-2">
                {bottomBanner.subheadline || `Special store deal on ${bottomBanner.productName}. Fast delivery across Lucknow.`}
              </p>
            </div>

            <div className="relative z-10 shrink-0 flex items-center gap-3">
              <div className="text-right">
                <span className="text-xl sm:text-2xl font-black font-mono text-emerald-400 block">
                  ₹{bottomBanner.salePrice.toLocaleString('en-IN')}
                </span>
                <span className="text-xs text-slate-400 line-through font-mono">
                  ₹{bottomBanner.regularPrice.toLocaleString('en-IN')}
                </span>
              </div>
              <button
                type="button"
                className="w-full sm:w-auto px-5 py-3 bg-white hover:bg-slate-100 text-slate-950 font-black text-xs rounded-xl flex items-center justify-center gap-2 shadow-md group-hover:scale-105 transition-all cursor-pointer"
              >
                <span>{bottomBanner.ctaText || 'Shop Deal'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      );
    }

    if (bottomPromo) {
      return (
        <div className="w-full max-w-7xl mx-auto px-2.5 sm:px-4 my-8 box-border">
          <div
            onClick={() => handleOpenPromo(bottomPromo)}
            className="relative rounded-2xl overflow-hidden cursor-pointer shadow-lg group border border-slate-700 transition-all p-5 sm:p-7 text-white flex flex-col md:flex-row md:items-center justify-between gap-4"
            style={{
              background: bottomPromo.bannerTheme || 'linear-gradient(135deg, #09090b 0%, #18181b 60%, #27272a 100%)',
            }}
          >
            {bottomPromo.bannerImageUrl && (
              <div
                className="absolute inset-0 z-0 opacity-15 group-hover:opacity-25 transition-opacity bg-cover bg-center"
                style={{ backgroundImage: `url(${bottomPromo.bannerImageUrl})` }}
              />
            )}

            <div className="relative z-10 space-y-1.5 max-w-2xl">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-400 text-slate-950">
                  {bottomPromo.badgeText || 'RECOMMENDED PROMOTION'}
                </span>
                <span className="text-xs text-slate-300 font-mono">
                  {bottomPromo.basisType.toUpperCase()}
                </span>
              </div>
              <h3 className="text-lg sm:text-2xl font-black tracking-tight leading-tight group-hover:text-amber-300 transition-colors">
                {bottomPromo.bannerHeadline}
              </h3>
              <p className="text-xs text-slate-300 line-clamp-2">
                {bottomPromo.bannerSubtext}
              </p>
            </div>

            <div className="relative z-10 shrink-0">
              <button
                type="button"
                className="w-full sm:w-auto px-5 py-3 bg-white hover:bg-slate-100 text-slate-950 font-black text-xs rounded-xl flex items-center justify-center gap-2 shadow-md group-hover:scale-105 transition-all cursor-pointer"
              >
                <span>{bottomPromo.placementText || 'Shop This Promotion'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      );
    }
    return null;
  }

  return null;
};
