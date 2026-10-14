import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { formatINR } from '../../utils/currency';
import { getWhatsAppClickToChatUrl } from '../../utils/whatsapp';
import {
  Search,
  ShoppingCart,
  Heart,
  User,
  Phone,
  MessageSquare,
  MapPin,
  Package,
  Menu,
  X,
  Sparkles,
  QrCode,
} from 'lucide-react';

export const Header: React.FC = () => {
  const {
    cart,
    wishlist,
    cartSubtotal,
    settings,
    searchQuery,
    setSearchQuery,
    setActiveModal,
    openQrModal,
    outlets,
    activeOutlet,
    brandingSettings,
  } = useStore();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const cartItemCount = cart.reduce((total, item) => total + item.quantity, 0);

  const handleStoreQr = () => {
    openQrModal({
      title: `Scan to Open ${brandingSettings.brandName} Store`,
      qrValue: typeof window !== 'undefined' ? window.location.origin : 'https://javed-electronics.in',
      subtitle: 'Share this QR code with customers or scan on your smartphone camera',
    });
  };

  const whatsappDirectUrl = getWhatsAppClickToChatUrl(
    brandingSettings.supportWhatsApp || settings.whatsappNumber,
    `Hello ${brandingSettings.brandName}, I would like to inquire about products availability and today’s offers.`
  );

  // Compute brand initials for monogram logo if no image URL
  const brandInitials = brandingSettings.brandName
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'JE';

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs no-print w-full max-w-full overflow-hidden box-border">
      {/* Top Utility Announcement Bar */}
      <div
        className="text-slate-300 text-[11px] py-1.5 px-3 sm:px-4 w-full box-border transition-colors"
        style={{ backgroundColor: brandingSettings.theme.secondaryColor || '#0f172a' }}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 min-w-0 w-full">
          {/* Announcement Ticker */}
          <div className="flex items-center gap-1.5 min-w-0 flex-1 overflow-hidden">
            <Sparkles className="w-3.5 h-3.5 shrink-0" style={{ color: brandingSettings.theme.accentColor || '#f59e0b' }} />
            <span
              className="truncate font-medium text-[10px] sm:text-[11px]"
              style={{ color: brandingSettings.theme.accentColor || '#fcd34d' }}
            >
              {brandingSettings.promotionalTicker || 'Festive Tech Dhamaka: Up to 60% OFF + 4-Hr Delivery in Lucknow'}
            </span>
          </div>

          {/* Quick utility shortcuts - hidden on extra small screens, accessible via mobile menu */}
          <div className="hidden sm:flex items-center gap-2.5 shrink-0 text-xs">
            {/* Active Outlet Indicator */}
            <button
              onClick={() => setActiveModal('pincode_check')}
              className="flex items-center gap-1 bg-slate-800/80 hover:bg-slate-700 px-2 py-0.5 rounded text-slate-200 hover:text-white transition-colors cursor-pointer border border-slate-700/60"
              title="Click to view or switch branch outlet"
            >
              <MapPin className="w-3 h-3 text-emerald-400" />
              <span>Branch: <strong className="text-emerald-300">{activeOutlet ? activeOutlet.name.split(' ')[0] : 'Lucknow'}</strong></span>
            </button>
            <span className="text-slate-700">|</span>
            <button
              onClick={() => setActiveModal('order_tracking')}
              className="flex items-center gap-1 text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              <Package className="w-3 h-3 text-blue-400" />
              <span>Track Order</span>
            </button>
            <span className="text-slate-700 hidden md:inline">|</span>
            <a
              href={`tel:${brandingSettings.supportPhone || settings.phone}`}
              className="hidden md:flex items-center gap-1 text-slate-300 hover:text-white transition-colors"
            >
              <Phone className="w-3 h-3 text-blue-400" />
              <span>{brandingSettings.supportPhone || settings.phone}</span>
            </a>
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-2.5 sm:px-4 py-2 sm:py-3 flex items-center justify-between gap-1.5 sm:gap-4 w-full min-w-0 box-border">
        {/* Brand Logo */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink min-w-0">
          <button
            onClick={() => {
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="text-left cursor-pointer group flex items-center gap-1.5 sm:gap-2 min-w-0"
          >
            {brandingSettings.logoUrl ? (
              <img
                src={brandingSettings.logoUrl}
                alt={brandingSettings.brandName}
                className="w-7 h-7 sm:w-9 sm:h-9 object-contain rounded-lg shrink-0 border border-slate-200"
              />
            ) : (
              <div
                className="w-7 h-7 sm:w-9 sm:h-9 rounded-lg text-white flex items-center justify-center font-extrabold text-xs sm:text-base md:text-lg shadow-sm transition-transform group-hover:scale-105 shrink-0"
                style={{ backgroundColor: brandingSettings.theme.primaryColor || '#1d4ed8' }}
              >
                {brandInitials}
              </div>
            )}
            <div className="min-w-0">
              <span className="text-xs sm:text-base md:text-lg font-bold tracking-tight text-slate-900 group-hover:opacity-90 transition-opacity flex items-center gap-1 truncate">
                {brandingSettings.brandName.toUpperCase()}
              </span>
              <span className="hidden sm:block text-[10px] text-slate-500 font-medium tracking-wide uppercase truncate">
                {brandingSettings.tagline || 'Local Retail & Digital Store'}
              </span>
            </div>
          </button>
        </div>

        {/* Global Search Bar (Desktop / Tablet) */}
        <div className="flex-1 max-w-xl hidden md:block min-w-0">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search smartphones, chargers, JBL speakers, smartwatches..."
              className="w-full pl-10 pr-9 py-2 text-xs sm:text-sm bg-slate-100 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all text-slate-900 placeholder:text-slate-400"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {/* Quick QR button to share storefront (Desktop) */}
          <button
            onClick={handleStoreQr}
            title="Scan or share store QR code"
            className="p-2 text-slate-600 hover:text-blue-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer hidden lg:flex items-center gap-1 text-xs font-medium"
          >
            <QrCode className="w-4 h-4 text-slate-700" />
            <span>Store QR</span>
          </button>

          {/* Wishlist */}
          <button
            onClick={() => setActiveModal('customer_account')}
            title="Wishlist"
            className="relative p-1.5 sm:p-2 text-slate-600 hover:text-rose-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            <Heart className="w-4 h-4 sm:w-5 sm:h-5" />
            {wishlist.length > 0 && (
              <span className="absolute top-0 right-0 sm:top-0.5 sm:right-0.5 bg-rose-500 text-white text-[9px] font-bold w-3.5 h-3.5 rounded-full flex items-center justify-center">
                {wishlist.length}
              </span>
            )}
          </button>

          {/* User Account (Desktop / Tablet) */}
          <button
            onClick={() => setActiveModal('customer_account')}
            className="hidden sm:flex items-center gap-1.5 p-2 text-slate-700 hover:text-blue-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer text-xs font-medium"
          >
            <User className="w-4 h-4 sm:w-5 sm:h-5 text-slate-600" />
            <span className="hidden xl:inline">Account</span>
          </button>

          {/* Cart Trigger */}
          <button
            onClick={() => setActiveModal('cart')}
            aria-label="Shopping Cart"
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white p-2 sm:px-3 sm:py-2 rounded-lg font-medium text-xs sm:text-sm shadow-xs transition-colors cursor-pointer min-h-[34px] sm:min-h-[36px] shrink-0"
          >
            <div className="relative">
              <ShoppingCart className="w-4 h-4" />
              {cartItemCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-amber-400 text-slate-900 text-[9px] font-extrabold w-3.5 h-3.5 rounded-full flex items-center justify-center">
                  {cartItemCount}
                </span>
              )}
            </div>
            <span className="font-semibold hidden sm:inline">
              {cartSubtotal > 0 ? formatINR(cartSubtotal) : 'Cart'}
            </span>
          </button>

          {/* Mobile Menu Toggle Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
            className="md:hidden p-1.5 sm:p-2 text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer shrink-0"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Search Bar (Full width, contained) */}
      <div className="px-2.5 sm:px-3 pb-2 md:hidden w-full max-w-full box-border">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search phones, soundbars, chargers..."
            className="w-full pl-9 pr-8 py-2 text-xs bg-slate-100 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all text-slate-900 placeholder:text-slate-400 box-border"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Mobile Navigation Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-3 py-3 space-y-1 animate-in slide-in-from-top-2 duration-150">
          <button
            onClick={() => {
              setActiveModal('order_tracking');
              setMobileMenuOpen(false);
            }}
            className="w-full text-left py-2.5 px-3 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-md flex items-center gap-2 cursor-pointer"
          >
            <Package className="w-4 h-4 text-blue-600 shrink-0" />
            <span>Track My Order (ID / Phone)</span>
          </button>

          <button
            onClick={() => {
              setActiveModal('pincode_check');
              setMobileMenuOpen(false);
            }}
            className="w-full text-left py-2.5 px-3 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-md flex items-center gap-2 cursor-pointer"
          >
            <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Check Lucknow Delivery PIN Codes</span>
          </button>

          <button
            onClick={() => {
              setActiveModal('customer_account');
              setMobileMenuOpen(false);
            }}
            className="w-full text-left py-2.5 px-3 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-md flex items-center gap-2 cursor-pointer"
          >
            <User className="w-4 h-4 text-slate-600 shrink-0" />
            <span>My Account, Wishlist & Referrals</span>
          </button>

          <button
            onClick={() => {
              handleStoreQr();
              setMobileMenuOpen(false);
            }}
            className="w-full text-left py-2.5 px-3 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-md flex items-center gap-2 cursor-pointer"
          >
            <QrCode className="w-4 h-4 text-purple-600 shrink-0" />
            <span>Show Storefront QR Code</span>
          </button>

          <a
            href={whatsappDirectUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setMobileMenuOpen(false)}
            className="w-full text-left py-2.5 px-3 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-md flex items-center gap-2"
          >
            <MessageSquare className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Chat with Store on WhatsApp</span>
          </a>

          <a
            href={`tel:${settings.phone}`}
            className="w-full text-left py-2.5 px-3 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-md flex items-center gap-2"
          >
            <Phone className="w-4 h-4 text-blue-600 shrink-0" />
            <span>Call Store Helpline: {settings.phone}</span>
          </a>
        </div>
      )}
    </header>
  );
};
