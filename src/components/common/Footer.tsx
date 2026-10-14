import React from 'react';
import { useStore } from '../../context/StoreContext';
import { getWhatsAppClickToChatUrl } from '../../utils/whatsapp';
import {
  MapPin,
  Phone,
  Mail,
  Clock,
  ShieldCheck,
  Truck,
  RotateCcw,
  CreditCard,
  MessageCircle,
} from 'lucide-react';

export const Footer: React.FC = () => {
  const { settings, openPolicyModal, brandingSettings } = useStore();

  const whatsappDirectUrl = getWhatsAppClickToChatUrl(
    brandingSettings.supportWhatsApp || settings.whatsappNumber,
    `Hello ${brandingSettings.brandName}, I need assistance with an order or product inquiry.`
  );

  const brandInitials = brandingSettings.brandName
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'JE';

  return (
    <>
      <footer className="bg-slate-950 text-slate-400 text-sm mt-12 sm:mt-16 border-t border-slate-800 no-print w-full max-w-full overflow-hidden">
        {/* Value Proposition Highlights */}
        <div className="border-b border-slate-900 bg-slate-900/40">
          <div className="max-w-7xl mx-auto px-4 py-6 sm:py-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <div className="flex items-start gap-3">
              <div
                className="p-2 sm:p-2.5 rounded-lg text-white shrink-0"
                style={{ backgroundColor: brandingSettings.theme.primaryColor ? `${brandingSettings.theme.primaryColor}25` : undefined, color: brandingSettings.theme.primaryColor || '#60a5fa' }}
              >
                <Truck className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h4 className="text-white font-semibold text-xs sm:text-sm">4-Hour Local Delivery</h4>
                <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5">Express same-day dispatch across Lucknow city</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-2 sm:p-2.5 rounded-lg bg-emerald-600/10 text-emerald-400 shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h4 className="text-white font-semibold text-xs sm:text-sm">100% Genuine Brand Stock</h4>
                <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5">Authorized retail dealer with manufacturer warranty</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-2 sm:p-2.5 rounded-lg bg-amber-600/10 text-amber-400 shrink-0">
                <RotateCcw className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h4 className="text-white font-semibold text-xs sm:text-sm">7-Day Local Replacement</h4>
                <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5">Easy returns and in-store replacements</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-2 sm:p-2.5 rounded-lg bg-purple-600/10 text-purple-400 shrink-0">
                <CreditCard className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h4 className="text-white font-semibold text-xs sm:text-sm">COD & Instant UPI QR</h4>
                <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5">Cash on delivery, WhatsApp order, or UPI QR</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Footer Links & Info */}
        <div className="max-w-7xl mx-auto px-4 py-8 sm:py-12 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
          {/* Brand Column */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              {brandingSettings.logoUrl ? (
                <img
                  src={brandingSettings.logoUrl}
                  alt={brandingSettings.brandName}
                  className="w-7 h-7 sm:w-8 sm:h-8 object-contain rounded-lg shrink-0 border border-slate-700"
                />
              ) : (
                <div
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg text-white flex items-center justify-center font-bold text-sm sm:text-base shrink-0"
                  style={{ backgroundColor: brandingSettings.theme.primaryColor || '#2563eb' }}
                >
                  {brandInitials}
                </div>
              )}
              <span className="text-white font-bold text-sm sm:text-base tracking-tight truncate">
                {brandingSettings.brandName.toUpperCase()}
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              {brandingSettings.footerAbout || 'Serving our local community in Lucknow with genuine smartphones, premium audio, fast chargers, smart TVs, and home appliances.'}
            </p>
            <div className="pt-1 text-xs text-slate-300">
              <span className="font-semibold text-white">GSTIN:</span> <span className="font-mono">{brandingSettings.gstin || settings.gstin}</span>
            </div>
          </div>

          {/* Visit & Contact Details */}
          <div className="space-y-2.5 sm:space-y-3">
            <h4 className="text-white font-semibold text-xs sm:text-sm">Store Address & Hours</h4>
            <ul className="space-y-2 text-xs">
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                <span className="leading-snug">{brandingSettings.businessAddress || `${settings.address}, ${settings.city}, ${settings.state} - ${settings.pincode}`}</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                <a href={`tel:${brandingSettings.supportPhone || settings.phone}`} className="hover:text-white transition-colors">
                  {brandingSettings.supportPhone || settings.phone}
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                <a href={`mailto:${brandingSettings.supportEmail || settings.email}`} className="hover:text-white transition-colors truncate">
                  {brandingSettings.supportEmail || settings.email}
                </a>
              </li>
              <li className="flex items-center gap-2 text-slate-300">
                <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                <span>{brandingSettings.businessHours || 'Mon - Sun: 10:00 AM - 09:30 PM'}</span>
              </li>
            </ul>
          </div>

          {/* Quick Policy Links */}
          <div className="space-y-2.5 sm:space-y-3">
            <h4 className="text-white font-semibold text-xs sm:text-sm">Customer Care & Policies</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button
                  onClick={() => openPolicyModal('about')}
                  className="hover:text-white transition-colors cursor-pointer text-left"
                >
                  About Javed Electronics
                </button>
              </li>
              <li>
                <button
                  onClick={() => openPolicyModal('shipping')}
                  className="hover:text-white transition-colors cursor-pointer text-left"
                >
                  Shipping & Local Delivery Policy
                </button>
              </li>
              <li>
                <button
                  onClick={() => openPolicyModal('returns')}
                  className="hover:text-white transition-colors cursor-pointer text-left"
                >
                  Returns & Replacement Policy
                </button>
              </li>
              <li>
                <button
                  onClick={() => openPolicyModal('warranty')}
                  className="hover:text-white transition-colors cursor-pointer text-left"
                >
                  Brand Warranty & Repair Service
                </button>
              </li>
              <li>
                <button
                  onClick={() => openPolicyModal('privacy')}
                  className="hover:text-white transition-colors cursor-pointer text-left"
                >
                  Privacy Policy & Data Security
                </button>
              </li>
              <li>
                <button
                  onClick={() => openPolicyModal('terms')}
                  className="hover:text-white transition-colors cursor-pointer text-left"
                >
                  Terms & Conditions
                </button>
              </li>
            </ul>
          </div>

          {/* Serviceable PIN codes info */}
          <div className="space-y-2.5 sm:space-y-3">
            <h4 className="text-white font-semibold text-xs sm:text-sm">Delivery Coverage (Lucknow)</h4>
            <p className="text-xs text-slate-400">
              Same-day courier delivery across major areas:
            </p>
            <div className="flex flex-wrap gap-1.5 text-[11px] text-slate-300">
              {settings.serviceablePincodes.slice(0, 8).map((pin) => (
                <span key={pin} className="px-2 py-0.5 bg-slate-900 border border-slate-800 rounded font-mono">
                  {pin}
                </span>
              ))}
              <span className="text-slate-500 text-xs self-center">+ more</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-2">
              Orders placed before 5:00 PM are dispatched same-day.
            </p>
          </div>
        </div>

        {/* Footer Workspace & Outlet Switcher */}
        <div className="border-t border-slate-900 bg-slate-900/60 py-3.5 px-4">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-slate-300">
              <span className="font-semibold text-white">Switch Workspace / Role:</span>
              <span className="text-[11px] text-slate-400">Authorized sessions only</span>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <button
                onClick={() => {
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                  openPolicyModal('about');
                }}
                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] transition-colors cursor-pointer"
              >
                Storefront Info
              </button>
              <button
                onClick={() => {
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                  document.querySelector('aside[aria-label="Role preview switcher"]')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="px-2.5 py-1 rounded bg-blue-900/40 text-blue-300 border border-blue-700/50 hover:bg-blue-800/60 text-[11px] font-medium transition-colors cursor-pointer"
              >
                Switch Role / Portal ↗
              </button>
            </div>
          </div>
        </div>

        {/* Copyright & Disclaimer */}
        <div className="border-t border-slate-900 py-5 sm:py-6 px-4">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2.5 text-xs text-slate-400 text-center sm:text-left">
            <div>
              © 2008-{new Date().getFullYear()} Javed Electronics. All rights reserved.
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 text-[11px] sm:text-xs">
              <span>Prices inclusive of GST</span>
              <span>·</span>
              <span>WhatsApp: +{settings.whatsappNumber}</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Responsive Floating WhatsApp CTA Button (compact circular on mobile with safe-area spacing, full label on sm+) */}
      <aside
        aria-label="Customer support"
        className="fixed z-30 no-print pointer-events-auto"
        style={{
          bottom: 'max(1rem, calc(env(safe-area-inset-bottom, 0px) + 0.75rem))',
          right: 'max(0.75rem, calc(env(safe-area-inset-right, 0px) + 0.75rem))',
        }}
      >
        <a
          href={whatsappDirectUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Chat and Order on WhatsApp with Javed Electronics"
          className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white w-12 h-12 sm:w-auto sm:h-auto sm:px-4 sm:py-2.5 rounded-full shadow-2xl transition-transform hover:scale-105 active:scale-95 group font-medium text-xs sm:text-sm border-2 border-white/30 cursor-pointer"
        >
          <MessageCircle className="w-5 h-5 fill-white text-emerald-600 shrink-0" />
          <span className="font-semibold tracking-wide hidden sm:inline whitespace-nowrap">
            Order on WhatsApp
          </span>
        </a>
      </aside>
    </>
  );
};
