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
  Sparkles,
} from 'lucide-react';

export const Footer: React.FC = () => {
  const { settings, openPolicyModal, brandingSettings, isAuthenticated, currentRole, setActiveModal } = useStore();

  if (isAuthenticated && currentRole !== 'customer') {
    return null;
  }

  const whatsappDirectUrl = getWhatsAppClickToChatUrl(
    brandingSettings.supportWhatsApp || settings.whatsappNumber,
    `Hello ${brandingSettings.brandName}, I need assistance with an order or product inquiry.`
  );

  const brandInitials =
    brandingSettings.brandName
      .split(' ')
      .filter(Boolean)
      .map((w) => w[0])
      .slice(0, 2)
      .join('')
      .toUpperCase() || 'JE';

  return (
    <footer
      className="text-white text-sm mt-10 sm:mt-14 border-t border-pink-300/40 no-print w-full max-w-full overflow-hidden"
      style={{
        background: 'linear-gradient(180deg, #ff2d55 0%, #e11d48 55%, #be123c 100%)',
      }}
    >
      {/* Value Proposition Highlights */}
      <div className="border-b border-white/20 bg-white/10 backdrop-blur-xs">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:py-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <div className="flex items-start gap-3">
            <div className="p-2 sm:p-2.5 rounded-xl bg-white/20 text-white shrink-0 border border-white/25 shadow-2xs">
              <Truck className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h4 className="text-white font-bold text-xs sm:text-sm">4-Hour Local Delivery</h4>
              <p className="text-[11px] sm:text-xs text-pink-100 mt-0.5">
                Express same-day dispatch across Lucknow city
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="p-2 sm:p-2.5 rounded-xl bg-white/20 text-[#fde047] shrink-0 border border-white/25 shadow-2xs">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h4 className="text-white font-bold text-xs sm:text-sm">100% Genuine Brand Stock</h4>
              <p className="text-[11px] sm:text-xs text-pink-100 mt-0.5">
                Authorized retail dealer with manufacturer warranty
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="p-2 sm:p-2.5 rounded-xl bg-white/20 text-white shrink-0 border border-white/25 shadow-2xs">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h4 className="text-white font-bold text-xs sm:text-sm">7-Day Local Replacement</h4>
              <p className="text-[11px] sm:text-xs text-pink-100 mt-0.5">
                Easy returns and in-store replacements
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="p-2 sm:p-2.5 rounded-xl bg-white/20 text-[#fde047] shrink-0 border border-white/25 shadow-2xs">
              <CreditCard className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h4 className="text-white font-bold text-xs sm:text-sm">COD & Instant UPI QR</h4>
              <p className="text-[11px] sm:text-xs text-pink-100 mt-0.5">
                Cash on delivery, WhatsApp order, or UPI QR
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links & Info */}
      <div className="max-w-7xl mx-auto px-4 py-8 sm:py-12 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
        {/* Brand Column */}
        <div className="space-y-3">
          <div className="flex items-center gap-2.5">
            {brandingSettings.logoUrl ? (
              <img
                src={brandingSettings.logoUrl}
                alt={brandingSettings.brandName}
                className="w-8 h-8 object-contain rounded-xl shrink-0 bg-white p-0.5 border border-white/40"
              />
            ) : (
              <div className="w-8 h-8 rounded-xl bg-[#fde047] text-slate-950 flex items-center justify-center font-black text-sm sm:text-base shrink-0 shadow-xs">
                {brandInitials}
              </div>
            )}
            <span className="text-white font-extrabold text-sm sm:text-base tracking-tight truncate">
              {brandingSettings.brandName.toUpperCase()}
            </span>
          </div>
          <p className="text-xs text-pink-50/95 leading-relaxed">
            {brandingSettings.footerAbout ||
              'Serving our local community in Lucknow with genuine smartphones, premium audio, fast chargers, smart TVs, and home appliances.'}
          </p>
          <div className="pt-1 text-xs text-pink-100">
            <span className="font-bold text-white">GSTIN:</span>{' '}
            <span className="font-mono bg-black/15 px-2 py-0.5 rounded border border-white/20 text-white">
              {brandingSettings.gstin || settings.gstin}
            </span>
          </div>
        </div>

        {/* Visit & Contact Details */}
        <div className="space-y-2.5 sm:space-y-3">
          <h4 className="text-white font-extrabold text-xs sm:text-sm tracking-wide">
            Store Address & Hours
          </h4>
          <ul className="space-y-2.5 text-xs text-pink-50">
            <li className="flex items-start gap-2.5">
              <MapPin className="w-4 h-4 text-[#fde047] shrink-0 mt-0.5" />
              <span className="leading-snug">
                {brandingSettings.businessAddress ||
                  `${settings.address}, ${settings.city}, ${settings.state} - ${settings.pincode}`}
              </span>
            </li>
            <li className="flex items-center gap-2.5">
              <Phone className="w-4 h-4 text-[#fde047] shrink-0" />
              <a
                href={`tel:${brandingSettings.supportPhone || settings.phone}`}
                className="hover:text-[#fde047] transition-colors font-medium"
              >
                {brandingSettings.supportPhone || settings.phone}
              </a>
            </li>
            <li className="flex items-center gap-2.5">
              <Mail className="w-4 h-4 text-[#fde047] shrink-0" />
              <a
                href={`mailto:${brandingSettings.supportEmail || settings.email}`}
                className="hover:text-[#fde047] transition-colors truncate font-medium"
              >
                {brandingSettings.supportEmail || settings.email}
              </a>
            </li>
            <li className="flex items-center gap-2.5 text-white font-medium">
              <Clock className="w-4 h-4 text-[#fde047] shrink-0" />
              <span>{brandingSettings.businessHours || 'Mon - Sun: 10:00 AM - 09:30 PM'}</span>
            </li>
          </ul>
        </div>

        {/* Quick Policy Links */}
        <div className="space-y-2.5 sm:space-y-3">
          <h4 className="text-white font-extrabold text-xs sm:text-sm tracking-wide">
            Customer Care & Policies
          </h4>
          <ul className="space-y-2 text-xs text-pink-50">
            <li>
              <button
                onClick={() => window.dispatchEvent(new CustomEvent('open-customer-support-chat'))}
                className="text-[#fde047] hover:text-amber-200 font-extrabold transition-colors cursor-pointer text-left flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Chat with 24/7 AI Support</span>
              </button>
            </li>
            <li>
              <button
                onClick={() => openPolicyModal('about')}
                className="hover:text-white hover:underline transition-colors cursor-pointer text-left"
              >
                About Javed Electronics
              </button>
            </li>
            <li>
              <button
                onClick={() => openPolicyModal('shipping')}
                className="hover:text-white hover:underline transition-colors cursor-pointer text-left"
              >
                Shipping & Local Delivery Policy
              </button>
            </li>
            <li>
              <button
                onClick={() => openPolicyModal('returns')}
                className="hover:text-white hover:underline transition-colors cursor-pointer text-left"
              >
                Returns & Replacement Policy
              </button>
            </li>
            <li>
              <button
                onClick={() => openPolicyModal('warranty')}
                className="hover:text-white hover:underline transition-colors cursor-pointer text-left"
              >
                Brand Warranty & Repair Service
              </button>
            </li>
            <li>
              <button
                onClick={() => openPolicyModal('privacy')}
                className="hover:text-white hover:underline transition-colors cursor-pointer text-left"
              >
                Privacy Policy & Data Security
              </button>
            </li>
            <li>
              <button
                onClick={() => openPolicyModal('terms')}
                className="hover:text-white hover:underline transition-colors cursor-pointer text-left"
              >
                Terms & Conditions
              </button>
            </li>
          </ul>
        </div>

        {/* Serviceable PIN codes info */}
        <div className="space-y-2.5 sm:space-y-3">
          <h4 className="text-white font-extrabold text-xs sm:text-sm tracking-wide">
            Delivery Coverage (Lucknow)
          </h4>
          <p className="text-xs text-pink-50">Same-day courier delivery across major areas:</p>
          <div className="flex flex-wrap gap-1.5 text-[11px]">
            {settings.serviceablePincodes.slice(0, 8).map((pin) => (
              <span
                key={pin}
                className="px-2.5 py-1 bg-white/15 border border-white/30 text-white font-bold rounded-lg font-mono shadow-2xs"
              >
                {pin}
              </span>
            ))}
            <span className="text-pink-100 text-xs self-center font-semibold">+ more</span>
          </div>
          <p className="text-[11px] text-pink-100 mt-2">
            Orders placed before 5:00 PM are dispatched same-day.
          </p>
        </div>
      </div>

      {/* Footer Workspace & Outlet Switcher - Strictly for Authenticated Staff/Admin */}
      {isAuthenticated && (currentRole === 'super_admin' || currentRole === 'store_manager') && (
        <div className="border-t border-white/20 bg-black/15 py-3.5 px-4">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-pink-50">
              <span className="font-bold text-white">Active Management Session:</span>
              <span className="text-[11px] text-pink-100">
                Logged in as {currentRole === 'super_admin' ? 'Super Admin' : 'Store Manager'}
              </span>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <button
                onClick={() => {
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                  openPolicyModal('about');
                }}
                className="px-2.5 py-1 rounded-lg bg-white/15 hover:bg-white/25 text-white text-[11px] font-medium transition-colors cursor-pointer"
              >
                Storefront Info
              </button>
              <button
                onClick={() => {
                  setActiveModal('auth');
                }}
                className="px-2.5 py-1 rounded-lg bg-[#fde047] text-slate-950 hover:bg-amber-300 text-[11px] font-bold transition-colors cursor-pointer"
              >
                Switch Account / Credentials ↗
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Copyright & Disclaimer */}
      <div className="border-t border-white/20 bg-black/15 py-5 sm:py-6 px-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2.5 text-xs text-pink-50 text-center sm:text-left">
          <div className="font-medium">
            © 2008-{new Date().getFullYear()} Javed Electronics. All rights reserved.
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 text-[11px] sm:text-xs">
            <span>Prices inclusive of GST</span>
            <span>·</span>
            <a
              href={whatsappDirectUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#fde047] hover:text-white font-bold flex items-center gap-1 transition-colors"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>WhatsApp: +{settings.whatsappNumber}</span>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};
