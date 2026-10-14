import React, { useState, useEffect } from 'react';
import { useStore } from '../../context/StoreContext';
import { getWhatsAppClickToChatUrl } from '../../utils/whatsapp';
import { Sparkles, Clock, Copy, Check, ShieldCheck, Truck, ArrowRight } from 'lucide-react';

export const HeroBanner: React.FC = () => {
  const { campaigns, settings, applyCoupon, setActiveModal, brandingSettings } = useStore();
  const [copiedCoupon, setCopiedCoupon] = useState(false);

  // Pick first active campaign
  const activeCampaign = campaigns.find((c) => c.isActive) || campaigns[0];

  // Live countdown timer state
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  }>({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    if (!activeCampaign?.endDate) return;

    const calculateTime = () => {
      const difference = new Date(activeCampaign.endDate).getTime() - new Date().getTime();

      if (difference <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds });
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [activeCampaign?.endDate]);

  const handleCopyCoupon = (code: string) => {
    navigator.clipboard?.writeText(code);
    applyCoupon(code);
    setCopiedCoupon(true);
    setTimeout(() => setCopiedCoupon(false), 2500);
  };

  const whatsappInquiryUrl = getWhatsAppClickToChatUrl(
    brandingSettings.supportWhatsApp || settings.whatsappNumber,
    `Hello ${brandingSettings.brandName || 'Javed Electronics'}! I saw the "${activeCampaign?.name || 'Festive Sale'}" on your website and would like to know the best price on smartphones and audio gadgets.`
  );

  return (
    <div className="w-full max-w-7xl mx-auto px-2.5 sm:px-4 mt-3 sm:mt-4 box-border">
      <div
        className="relative w-full max-w-full overflow-hidden text-white rounded-xl sm:rounded-2xl shadow-xl border border-blue-900/40 box-border transition-all"
        style={{
          background: `linear-gradient(135deg, ${brandingSettings.theme.secondaryColor || '#020617'} 0%, ${brandingSettings.theme.primaryColor || '#1e3a8a'} 65%, #020617 100%)`,
        }}
      >
        {/* Decorative Glow Background - contained without negative margin spill */}
        <div
          className="absolute top-0 right-0 w-48 h-48 sm:w-80 sm:h-80 rounded-full blur-3xl pointer-events-none opacity-40"
          style={{ backgroundColor: brandingSettings.theme.primaryColor || '#2563eb' }}
        />
        <div
          className="absolute bottom-0 left-1/4 w-44 h-44 sm:w-72 sm:h-72 rounded-full blur-3xl pointer-events-none opacity-30"
          style={{ backgroundColor: brandingSettings.theme.accentColor || '#f59e0b' }}
        />

        <div className="relative w-full max-w-full px-3.5 py-5 sm:px-6 sm:py-8 md:py-10 flex flex-col lg:flex-row items-center justify-between gap-5 sm:gap-6 md:gap-8 min-w-0 box-border">
          {/* Left Column: Headlines & Offer */}
          <div className="space-y-3 sm:space-y-3.5 max-w-2xl text-center lg:text-left w-full min-w-0">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/15 border border-amber-400/30 rounded-full text-amber-300 text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 shrink-0" style={{ color: brandingSettings.theme.accentColor || '#f59e0b' }} />
              <span>{activeCampaign?.badge || 'LIMITED TIME SALE'}</span>
            </div>

            <h1 className="text-[clamp(1.35rem,4vw+0.5rem,2.75rem)] font-extrabold tracking-tight text-white leading-tight break-words max-w-full">
              {brandingSettings.heroHeadline || activeCampaign?.bannerHeadline || 'Diwali Tech Utsav & Mega Electronics Dhamaka'}
            </h1>

            <p className="text-slate-200 text-xs sm:text-sm md:text-base leading-relaxed break-words max-w-full opacity-90">
              {brandingSettings.heroSubheadline || activeCampaign?.bannerSubtext || 'Shop 100% genuine smartphones, audio gear & home appliances with 4-hour local delivery in Lucknow.'}
            </p>

            {/* Coupon Code Section - wraps vertically on narrow mobile */}
            {activeCampaign?.couponCode && (
              <div className="pt-1 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-2 sm:gap-3 w-full max-w-full">
                <div className="flex items-center justify-between bg-slate-900/90 border border-slate-700 rounded-lg p-1.5 pl-3 w-full sm:w-auto max-w-full min-w-0 box-border">
                  <div className="flex items-center gap-1.5 min-w-0 mr-2">
                    <span className="text-[11px] text-slate-400 shrink-0">Code:</span>
                    <span className="font-mono font-bold text-amber-400 text-xs sm:text-sm tracking-wider truncate">
                      {activeCampaign.couponCode}
                    </span>
                  </div>
                  <button
                    onClick={() => handleCopyCoupon(activeCampaign.couponCode!)}
                    className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white text-[11px] px-2.5 py-1 rounded font-medium transition-colors cursor-pointer shrink-0"
                  >
                    {copiedCoupon ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-300" />
                        <span>Applied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>

                <span className="text-[11px] text-slate-400 text-center sm:text-left">
                  (Flat ₹500 off above ₹2,999)
                </span>
              </div>
            )}

            {/* CTAs */}
            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-center lg:justify-start gap-2.5 sm:gap-3 w-full max-w-full">
              <a
                href="#products-section"
                className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs sm:text-sm px-4 sm:px-5 py-2.5 sm:py-3 rounded-lg shadow-md transition-all cursor-pointer min-h-[42px] w-full sm:w-auto text-center"
              >
                <span>Explore Deals</span>
                <ArrowRight className="w-4 h-4 shrink-0" />
              </a>

              <a
                href={whatsappInquiryUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs sm:text-sm px-4 py-2.5 sm:py-3 rounded-lg shadow-md transition-all min-h-[42px] w-full sm:w-auto text-center"
              >
                <span>WhatsApp Offer Inquiry</span>
              </a>
            </div>

            {/* Trust Highlights */}
            <div className="pt-1.5 flex flex-wrap items-center justify-center lg:justify-start gap-3 sm:gap-4 text-[10px] sm:text-[11px] text-slate-300">
              <div className="flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>4-Hr Lucknow Delivery</span>
              </div>
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                <span>100% Genuine Brand Warranty</span>
              </div>
            </div>
          </div>

          {/* Right Column: Dynamic Live Countdown Timer Box */}
          <div className="w-full lg:max-w-sm shrink-0 min-w-0 bg-slate-900/85 backdrop-blur-md border border-slate-700/60 rounded-xl p-3 sm:p-5 text-center shadow-2xl box-border">
            <div className="flex items-center justify-center gap-1.5 text-amber-400 text-[11px] sm:text-xs font-semibold tracking-wide uppercase mb-2.5">
              <Clock className="w-3.5 h-3.5 animate-pulse shrink-0" />
              <span>OFFER ENDS IN</span>
            </div>

            <div className="grid grid-cols-4 gap-1.5 sm:gap-2 w-full max-w-full">
              <div className="bg-slate-800/90 border border-slate-700 rounded-lg p-1.5 sm:p-2.5 text-center min-w-0">
                <div className="text-sm sm:text-lg md:text-xl font-extrabold text-white font-mono truncate">
                  {String(timeLeft.days).padStart(2, '0')}
                </div>
                <div className="text-[9px] uppercase font-semibold text-slate-400 mt-0.5">Days</div>
              </div>

              <div className="bg-slate-800/90 border border-slate-700 rounded-lg p-1.5 sm:p-2.5 text-center min-w-0">
                <div className="text-sm sm:text-lg md:text-xl font-extrabold text-white font-mono truncate">
                  {String(timeLeft.hours).padStart(2, '0')}
                </div>
                <div className="text-[9px] uppercase font-semibold text-slate-400 mt-0.5">Hours</div>
              </div>

              <div className="bg-slate-800/90 border border-slate-700 rounded-lg p-1.5 sm:p-2.5 text-center min-w-0">
                <div className="text-sm sm:text-lg md:text-xl font-extrabold text-white font-mono truncate">
                  {String(timeLeft.minutes).padStart(2, '0')}
                </div>
                <div className="text-[9px] uppercase font-semibold text-slate-400 mt-0.5">Mins</div>
              </div>

              <div className="bg-slate-800/90 border border-slate-700 rounded-lg p-1.5 sm:p-2.5 text-center min-w-0">
                <div className="text-sm sm:text-lg md:text-xl font-extrabold text-amber-400 font-mono truncate">
                  {String(timeLeft.seconds).padStart(2, '0')}
                </div>
                <div className="text-[9px] uppercase font-semibold text-slate-400 mt-0.5">Secs</div>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 mt-2.5 leading-relaxed">
              Limited stock allocated for festive price discount. Free store pickup available at Hazratganj store.
            </p>

            <button
              onClick={() => setActiveModal('pincode_check')}
              className="mt-2 text-[11px] text-blue-400 hover:text-blue-300 underline font-medium cursor-pointer"
            >
              Check delivery eligibility in your PIN code
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
