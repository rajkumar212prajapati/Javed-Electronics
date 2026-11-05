import React, { useState, useEffect } from 'react';
import { FestivalCampaignRecord } from '../../../types/festivalCampaign';
import { useStore } from '../../../context/StoreContext';
import { Clock, Copy, Check, Gift, ArrowRight } from 'lucide-react';

interface Props {
  campaign: FestivalCampaignRecord;
}

export const FestivalHeroBanner: React.FC<Props> = ({ campaign }) => {
  const { applyCoupon } = useStore();
  const [copied, setCopied] = useState(false);

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
        className={`relative w-full overflow-hidden text-white rounded-2xl shadow-lg border ${getStyleClasses()} bg-gradient-to-br`}
      >
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

        <div className="relative z-10 px-4 py-6 sm:px-8 sm:py-8 flex flex-col lg:flex-row items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl text-center lg:text-left w-full">
            {campaign.badge_text && (
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-white/15 rounded-md text-white text-[11px] font-bold uppercase tracking-wider">
                <span>{campaign.badge_text}</span>
              </div>
            )}

            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-white leading-tight">
              {campaign.hero_headline}
            </h1>

            {campaign.hero_subtitle && (
              <p className="text-xs sm:text-sm text-slate-100/90 leading-relaxed">
                {campaign.hero_subtitle}
              </p>
            )}

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 flex-wrap">
              <button
                onClick={scrollToDestination}
                className="w-full sm:w-auto px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs sm:text-sm rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                <span>{campaign.cta_text || 'Shop Deals'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              {campaign.coupon_code && (
                <div className="flex items-center bg-slate-950/80 border border-white/20 rounded-xl px-3 py-1.5 gap-2">
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

            {campaign.gift_packaging_enabled && (
              <div className="pt-1 flex items-center justify-center lg:justify-start gap-1.5 text-xs text-slate-200">
                <Gift className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                <span className="text-[11px]">
                  {campaign.gift_packaging_note || 'Complimentary gift packaging included'}
                </span>
              </div>
            )}
          </div>

          {/* Countdown Card */}
          <div className="bg-slate-950/80 backdrop-blur-md rounded-xl p-4 border border-white/15 text-center w-full max-w-xs shrink-0">
            <div className="flex items-center justify-center gap-1.5 text-slate-300 text-[11px] font-bold uppercase tracking-wider mb-2">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>Ends In</span>
            </div>

            <div className="grid grid-cols-4 gap-2">
              <div className="bg-slate-900 border border-slate-800 rounded-lg p-2">
                <div className="text-lg sm:text-xl font-black text-white font-mono">
                  {String(timeLeft.days).padStart(2, '0')}
                </div>
                <div className="text-[10px] text-slate-400 font-bold uppercase">Days</div>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-lg p-2">
                <div className="text-lg sm:text-xl font-black text-white font-mono">
                  {String(timeLeft.hours).padStart(2, '0')}
                </div>
                <div className="text-[10px] text-slate-400 font-bold uppercase">Hours</div>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-lg p-2">
                <div className="text-lg sm:text-xl font-black text-white font-mono">
                  {String(timeLeft.minutes).padStart(2, '0')}
                </div>
                <div className="text-[10px] text-slate-400 font-bold uppercase">Mins</div>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-lg p-2">
                <div className="text-lg sm:text-xl font-black text-amber-400 font-mono">
                  {String(timeLeft.seconds).padStart(2, '0')}
                </div>
                <div className="text-[10px] text-slate-400 font-bold uppercase">Secs</div>
              </div>
            </div>

            {campaign.discount_percentage ? (
              <div className="mt-2.5 text-xs text-slate-200 font-medium">
                {campaign.discount_percentage}% OFF on orders above ₹{campaign.min_cart_value || 999}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};
