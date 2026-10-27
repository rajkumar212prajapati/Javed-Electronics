import React, { useState, useEffect } from 'react';
import { FestivalCampaignRecord } from '../../../types/festivalCampaign';
import { useStore } from '../../../context/StoreContext';
import { Sparkles, Clock, Copy, Check, Gift, ArrowRight, ShoppingBag } from 'lucide-react';

interface Props {
  campaign: FestivalCampaignRecord;
}

export const FestivalHeroBanner: React.FC<Props> = ({ campaign }) => {
  const { applyCoupon, setActiveModal } = useStore();
  const [copied, setCopied] = useState(false);
  const [giftPackRequested, setGiftPackRequested] = useState(true);

  // Live countdown timer state
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  }>({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    if (!campaign.end_at) return;

    const updateTimer = () => {
      const diff = new Date(campaign.end_at).getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeLeft({ days, hours, minutes, seconds });
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [campaign.end_at]);

  const handleCopyCoupon = () => {
    if (!campaign.coupon_code) return;
    navigator.clipboard?.writeText(campaign.coupon_code);
    applyCoupon(campaign.coupon_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const getStyleClasses = () => {
    switch (campaign.theme_colors.style) {
      case 'diwali':
        return 'from-amber-700 via-rose-900 to-slate-950 border-amber-500/40';
      case 'eid':
        return 'from-emerald-800 via-teal-950 to-slate-950 border-emerald-400/40';
      case 'holi':
        return 'from-pink-600 via-purple-700 to-amber-600 border-pink-400/40';
      case 'navratri':
        return 'from-red-700 via-orange-800 to-slate-950 border-orange-500/40';
      case 'new_year':
        return 'from-sky-700 via-blue-900 to-slate-950 border-sky-400/40';
      default:
        return 'from-slate-900 via-indigo-950 to-slate-950 border-indigo-500/40';
    }
  };

  const scrollToDestination = () => {
    const dest = campaign.cta_destination || '#products-section';
    if (dest.startsWith('#')) {
      const el = document.querySelector(dest);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
        return;
      }
    }
    const defaultEl = document.getElementById('products-section');
    if (defaultEl) {
      defaultEl.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-2.5 sm:px-4 mt-3 sm:mt-4 box-border">
      <div
        className={`relative w-full overflow-hidden text-white rounded-2xl shadow-2xl border ${getStyleClasses()} bg-gradient-to-br transition-all`}
      >
        {/* Decorative background image overlay if provided */}
        {campaign.desktop_banner_url && (
          <div className="absolute inset-0 z-0 opacity-20 mix-blend-overlay pointer-events-none">
            <picture>
              {campaign.mobile_banner_url && (
                <source media="(max-width: 640px)" srcSet={campaign.mobile_banner_url} />
              )}
              <img
                src={campaign.desktop_banner_url}
                alt={campaign.name}
                className="w-full h-full object-cover"
              />
            </picture>
          </div>
        )}

        {/* Ambient Glow Orbs */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-400/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-rose-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 px-4 py-6 sm:px-8 sm:py-10 flex flex-col lg:flex-row items-center justify-between gap-6 md:gap-8">
          {/* Left: Headlines & Festival Pitch */}
          <div className="space-y-3 max-w-2xl text-center lg:text-left w-full">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-400/20 border border-amber-400/40 rounded-full text-amber-200 text-[11px] sm:text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
              <span>{campaign.badge_text || 'FESTIVE CELEBRATION'}</span>
              <span className="text-white/60">•</span>
              <span className="text-white font-medium">{campaign.festival_name}</span>
            </div>

            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black tracking-tight text-white leading-tight">
              {campaign.hero_headline}
            </h1>

            {campaign.hero_subtitle && (
              <p className="text-xs sm:text-sm md:text-base text-slate-100/90 leading-relaxed font-normal">
                {campaign.hero_subtitle}
              </p>
            )}

            {/* Action buttons & Coupon */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 flex-wrap">
              <button
                onClick={scrollToDestination}
                className="w-full sm:w-auto px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs sm:text-sm rounded-xl shadow-lg transition-transform hover:scale-[1.02] cursor-pointer flex items-center justify-center gap-2"
              >
                <span>{campaign.cta_text || 'Explore Festival Deals'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              {campaign.coupon_code && (
                <div className="flex items-center bg-slate-950/80 border border-amber-400/40 rounded-xl px-3 py-1.5 gap-2">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Code:</span>
                  <span className="font-mono font-black text-amber-300 text-xs sm:text-sm tracking-wider">
                    {campaign.coupon_code}
                  </span>
                  <button
                    onClick={handleCopyCoupon}
                    className="ml-1 text-[11px] px-2 py-0.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded cursor-pointer transition-colors flex items-center gap-1"
                  >
                    {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    <span>{copied ? 'Applied' : 'Copy'}</span>
                  </button>
                </div>
              )}
            </div>

            {/* Gift packaging badge */}
            {campaign.gift_packaging_enabled && (
              <div className="pt-1 flex items-center justify-center lg:justify-start gap-2 text-xs text-amber-200">
                <Gift className="w-4 h-4 text-amber-300 shrink-0" />
                <span className="text-[11px] text-slate-200">
                  {campaign.gift_packaging_note || 'Complimentary festive gift packaging included!'}
                </span>
              </div>
            )}
          </div>

          {/* Right: Live Festival Countdown Card */}
          <div className="bg-slate-950/85 backdrop-blur-md rounded-2xl p-5 border border-amber-400/30 text-center w-full max-w-sm shrink-0 shadow-2xl">
            <div className="flex items-center justify-center gap-1.5 text-amber-300 text-xs font-bold uppercase tracking-wider mb-2">
              <Clock className="w-4 h-4 animate-spin text-amber-400" />
              <span>FESTIVAL SALE ENDS IN</span>
            </div>

            <div className="grid grid-cols-4 gap-2 my-3">
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-2">
                <div className="text-xl sm:text-2xl font-black text-white font-mono">
                  {String(timeLeft.days).padStart(2, '0')}
                </div>
                <div className="text-[10px] text-slate-400 font-bold uppercase">Days</div>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-2">
                <div className="text-xl sm:text-2xl font-black text-white font-mono">
                  {String(timeLeft.hours).padStart(2, '0')}
                </div>
                <div className="text-[10px] text-slate-400 font-bold uppercase">Hours</div>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-2">
                <div className="text-xl sm:text-2xl font-black text-white font-mono">
                  {String(timeLeft.minutes).padStart(2, '0')}
                </div>
                <div className="text-[10px] text-slate-400 font-bold uppercase">Mins</div>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-2">
                <div className="text-xl sm:text-2xl font-black text-amber-400 font-mono">
                  {String(timeLeft.seconds).padStart(2, '0')}
                </div>
                <div className="text-[10px] text-slate-400 font-bold uppercase">Secs</div>
              </div>
            </div>

            {campaign.discount_percentage ? (
              <div className="text-xs text-amber-200 bg-amber-500/10 border border-amber-400/20 rounded-lg p-2 font-medium">
                Flat <strong>{campaign.discount_percentage}% OFF</strong> on orders above ₹{campaign.min_cart_value || 999}
              </div>
            ) : (
              <div className="text-xs text-slate-300">
                Official warranty & 4-Hour Express delivery in Lucknow
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
