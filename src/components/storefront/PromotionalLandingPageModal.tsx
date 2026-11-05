import React, { useState, useMemo } from 'react';
import { useStore } from '../../context/StoreContext';
import { ProductCard } from './ProductCard';
import { getPromotionalPageProducts, isPromotionalPageCurrentlyActive } from '../../utils/promotionalEngine';
import { formatINR } from '../../utils/currency';
import {
  ArrowLeft,
  Sparkles,
  ShieldCheck,
  Clock,
  Tag,
  Filter,
  CheckCircle2,
  Share2,
  ShoppingBag,
  Zap,
  Flame,
  Gift,
  Building2,
  Calendar,
} from 'lucide-react';

export const PromotionalLandingPageModal: React.FC = () => {
  const {
    activePromotionalPage,
    setActivePromotionalPage,
    activeModal,
    setActiveModal,
    products,
    settings,
    addToCart,
    cart,
  } = useStore();

  const [sortOption, setSortOption] = useState<'featured' | 'price_low' | 'price_high' | 'discount'>('featured');
  const [selectedBrandFilter, setSelectedBrandFilter] = useState<string>('all');
  const [copiedLink, setCopiedLink] = useState(false);
  const [cartFeedbackMsg, setCartFeedbackMsg] = useState<string | null>(null);

  const promo = activePromotionalPage;
  const isOpen = activeModal === 'promotional_page' && !!promo;

  const isLive = promo ? isPromotionalPageCurrentlyActive(promo) : false;

  // Compute products for this promotional page unconditionally
  const matchingProducts = useMemo(() => {
    if (!promo) return [];
    let list = getPromotionalPageProducts(promo, products);

    if (selectedBrandFilter !== 'all') {
      list = list.filter((p) => p.brand.toLowerCase() === selectedBrandFilter.toLowerCase());
    }

    if (sortOption === 'price_low') {
      return [...list].sort((a, b) => (a.dealPrice || a.regularPrice) - (b.dealPrice || b.regularPrice));
    }
    if (sortOption === 'price_high') {
      return [...list].sort((a, b) => (b.dealPrice || b.regularPrice) - (a.dealPrice || a.regularPrice));
    }
    if (sortOption === 'discount') {
      return [...list].sort((a, b) => {
        const discA = a.mrp - (a.dealPrice || a.regularPrice);
        const discB = b.mrp - (b.dealPrice || b.regularPrice);
        return discB - discA;
      });
    }

    return list;
  }, [promo, products, selectedBrandFilter, sortOption]);

  const distinctBrands = useMemo(() => {
    if (!promo) return [];
    const list = getPromotionalPageProducts(promo, products);
    const set = new Set<string>();
    list.forEach((p) => set.add(p.brand));
    return Array.from(set).sort();
  }, [promo, products]);

  const handleClose = () => {
    setActiveModal(null);
    setActivePromotionalPage(null);
  };

  const handleSharePromo = () => {
    if (!promo) return;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.origin + `?promo=${promo.slug}`);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const handleAddAllToCart = () => {
    let count = 0;
    matchingProducts.slice(0, 5).forEach((p) => {
      const res = addToCart(p, 1);
      if (res.success) count++;
    });
    if (count > 0) {
      setCartFeedbackMsg(`Added ${count} promotion items to your cart!`);
      setTimeout(() => setCartFeedbackMsg(null), 3000);
    }
  };

  // Guard: Do not render modal markup if not active or no promotional page
  if (!isOpen || !promo) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex flex-col w-screen h-screen overflow-y-auto bg-slate-50 animate-in fade-in duration-200">
      {/* Sticky Top Header */}
      <div className="bg-white border-b border-slate-200 px-3 sm:px-6 py-3 flex items-center justify-between shrink-0 shadow-2xs sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleClose}
            className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-colors cursor-pointer shrink-0"
            title="Return to Main Store"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-black text-slate-900 truncate">
                {promo.title}
              </h2>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                  isLive
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : 'bg-amber-100 text-amber-800 border border-amber-300'
                }`}
              >
                {isLive ? 'Live Event' : 'Scheduled Preview'}
              </span>
            </div>
            <span className="text-[11px] text-slate-500 font-mono">
              Basis: {promo.basisType.replace('_', ' ').toUpperCase()} {promo.basisValue ? `• ${promo.basisValue}` : ''}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleSharePromo}
            className="p-2 sm:px-3 sm:py-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            title="Share promo link"
          >
            <Share2 className="w-4 h-4 text-slate-500" />
            <span className="hidden sm:inline">{copiedLink ? 'Link Copied!' : 'Share Page'}</span>
          </button>

          {cart.length > 0 && (
            <button
              type="button"
              onClick={() => setActiveModal('cart')}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Cart ({cart.reduce((s, i) => s + i.quantity, 0)})</span>
            </button>
          )}
        </div>
      </div>

      {/* Quick feedback message banner */}
      {cartFeedbackMsg && (
        <div className="bg-emerald-600 text-white px-4 py-2 text-center text-xs font-bold shadow-md sticky top-[57px] z-20 flex items-center justify-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4" />
          <span>{cartFeedbackMsg}</span>
        </div>
      )}

      {/* Main Content Container */}
      <div className="flex-1 w-full max-w-7xl mx-auto px-3 sm:px-6 py-5 sm:py-6 space-y-6">
        {/* Hero Promotional Banner */}
        <div
          className="relative rounded-2xl overflow-hidden shadow-xl p-6 sm:p-10 text-white flex flex-col justify-between min-h-[220px] sm:min-h-[280px]"
          style={{
            background: promo.bannerTheme || 'linear-gradient(135deg, #1e1b4b 0%, #4338ca 60%, #ec4899 100%)',
          }}
        >
          {/* Background image overlay */}
          {promo.bannerImageUrl && (
            <div
              className="absolute inset-0 z-0 opacity-25 bg-cover bg-center"
              style={{ backgroundImage: `url(${promo.bannerImageUrl})` }}
            />
          )}

          <div className="relative z-10 space-y-3 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-white/20 backdrop-blur-md text-amber-300 border border-white/20">
                {promo.badgeText || 'SPECIAL PROMOTION'}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-black/30 backdrop-blur-md text-slate-200">
                ⚡ {settings.assuredBadgeName || 'JE Assured'} Verified Deals
              </span>
            </div>

            <h1 className="text-xl sm:text-3xl lg:text-4xl font-black tracking-tight leading-tight">
              {promo.bannerHeadline}
            </h1>

            <p className="text-xs sm:text-sm text-slate-100 max-w-2xl leading-relaxed">
              {promo.bannerSubtext}
            </p>
          </div>

          {/* Timing & Schedule Status Pill */}
          <div className="relative z-10 pt-4 flex flex-wrap items-center justify-between gap-3 border-t border-white/20 text-xs">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-300" />
              <span className="font-semibold text-slate-100">
                {promo.scheduleType === 'always_active'
                  ? 'Always Available • Instant Delivery'
                  : promo.scheduleType === 'recurring_slot'
                  ? `Recurring Slot: ${promo.slotStartTime || '12:00'} to ${promo.slotEndTime || '23:00'}`
                  : promo.scheduleType === 'month_end'
                  ? 'Month-End Payday Clearance Window'
                  : 'Limited Period Promotion'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span className="font-bold text-amber-300">
                {settings.assuredTagline || '100% Genuine • Tested Quality & Brand Warranty'}
              </span>
            </div>
          </div>
        </div>

        {/* Running Ticker / Promotional Text Banner */}
        {promo.promotionalTickerText && (
          <div className="p-3 bg-linear-to-r from-amber-500/10 via-pink-500/10 to-indigo-500/10 border border-amber-300/40 rounded-xl flex items-center gap-2.5 text-xs text-slate-900 font-bold">
            <Zap className="w-4 h-4 text-amber-600 shrink-0" />
            <span className="truncate">{promo.promotionalTickerText}</span>
          </div>
        )}

        {/* Filter & Sort Bar */}
        <div className="bg-white rounded-xl border border-slate-200 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-slate-600 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" />
              <span>Brand:</span>
            </span>
            <div className="flex items-center gap-1 overflow-x-auto">
              <button
                type="button"
                onClick={() => setSelectedBrandFilter('all')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  selectedBrandFilter === 'all'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                All Brands ({matchingProducts.length})
              </button>
              {distinctBrands.map((brand) => (
                <button
                  key={brand}
                  type="button"
                  onClick={() => setSelectedBrandFilter(brand)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
                    selectedBrandFilter.toLowerCase() === brand.toLowerCase()
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {brand}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            <span className="text-xs text-slate-500 font-medium">Sort by:</span>
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value as any)}
              className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800"
            >
              <option value="featured">Featured Promotion</option>
              <option value="price_low">Price: Low to High</option>
              <option value="price_high">Price: High to Low</option>
              <option value="discount">Highest Savings</option>
            </select>
          </div>
        </div>

        {/* Products Grid */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-black text-slate-900">
              Eligible Deals ({matchingProducts.length} Items)
            </h3>
            {matchingProducts.length > 1 && (
              <button
                type="button"
                onClick={handleAddAllToCart}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer"
              >
                + Quick Add First 5 Items
              </button>
            )}
          </div>

          {matchingProducts.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 text-slate-500">
              <ShoppingBag className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="font-bold text-sm text-slate-800">No products found</p>
              <p className="text-xs text-slate-400 mt-1">Try changing your brand filter or inspect page product settings in admin.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
              {matchingProducts.map((p, idx) => (
                <ProductCard key={p.id} product={p} index={idx} />
              ))}
            </div>
          )}
        </div>

        {/* JE Assured Guarantee Banner Footer */}
        <div className="p-5 rounded-2xl bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-pink-600/30 border border-pink-500/40 text-pink-400 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-sm text-white tracking-tight">
                  {settings.assuredBadgeName || 'JE Assured'} Promise
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  100% Authentic
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Every promotional device sold through Javed Electronics is quality-tested, backed by brand warranty, and eligible for 7-day doorstep replacement.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-950 font-black text-xs rounded-xl self-start sm:self-center cursor-pointer transition-colors shadow-xs"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    </div>
  );
};
