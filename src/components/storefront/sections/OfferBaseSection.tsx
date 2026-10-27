import React, { useState } from 'react';
import { useStore } from '../../../context/StoreContext';
import { CreditCard, Copy, Check, Percent, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';
import { formatINR } from '../../../utils/currency';

export const OfferBaseSection: React.FC = () => {
  const {
    homepageSettings,
    applyCoupon,
  } = useStore();

  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const section = homepageSettings.sections.find((s) => s.id === 'offer_base');
  const offers = homepageSettings.bankOffers.filter((o) => o.isActive);

  if (!section || !section.isEnabled) return null;

  const handleApplyOffer = (code?: string) => {
    if (!code) return;
    navigator.clipboard?.writeText(code);
    applyCoupon(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  return (
    <section className="w-full max-w-7xl mx-auto px-2.5 sm:px-4 mt-6 sm:mt-10 box-border">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 mb-4">
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 px-2 py-0.5 rounded">
              {section.badge || 'BANK OFFERS'}
            </span>
          </div>
          <h2 className="text-lg sm:text-2xl font-black text-slate-900 tracking-tight">
            {section.title}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            {section.subtitle}
          </p>
        </div>
      </div>

      {/* Offers Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {offers.map((offer) => {
          const isCopied = copiedCode === offer.code;

          return (
            <div
              key={offer.id}
              className={`rounded-2xl p-4 sm:p-5 bg-gradient-to-br ${offer.bgColorClass} shadow-md flex flex-col justify-between relative overflow-hidden`}
            >
              <div>
                <div className="flex items-center justify-between gap-1 mb-2">
                  <span className="text-[10px] font-black uppercase tracking-wider bg-white/20 text-white px-2 py-0.5 rounded-full backdrop-blur-xs">
                    {offer.badge}
                  </span>
                  <span className="text-[10px] text-white/80 font-medium">
                    Min. {formatINR(offer.minSpend)}
                  </span>
                </div>

                <div className="my-2">
                  <div className="text-sm font-extrabold text-white">
                    {offer.bankName}
                  </div>
                  <div className="text-xs text-white/80 mt-0.5">
                    {offer.cardType}
                  </div>
                  <div className="text-sm sm:text-base font-black text-amber-300 mt-2 leading-snug">
                    {offer.discountText}
                  </div>
                </div>

                <p className="text-[10px] text-white/70 line-clamp-2 mt-2">
                  {offer.terms}
                </p>
              </div>

              {/* Action / Code */}
              {offer.code && (
                <div className="mt-4 pt-3 border-t border-white/15 flex items-center justify-between gap-2">
                  <div className="font-mono text-xs font-bold text-white bg-black/30 px-2.5 py-1 rounded border border-white/20">
                    {offer.code}
                  </div>
                  <button
                    onClick={() => handleApplyOffer(offer.code)}
                    className="flex items-center gap-1 px-3 py-1 bg-white hover:bg-amber-100 text-slate-900 font-bold text-xs rounded transition-colors cursor-pointer"
                  >
                    {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-700" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{isCopied ? 'Applied!' : 'Apply'}</span>
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
};
