import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { formatINR } from '../../utils/currency';
import {
  Search,
  ShoppingCart,
  Heart,
  User,
  MapPin,
  Package,
  Menu,
  X,
  QrCode,
  LogIn,
  LogOut,
  KeyRound,
  Scan,
  Zap,
} from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';
import { PredictiveSearchDropdown, saveRecentSearch } from './PredictiveSearchDropdown';

export const Header: React.FC = () => {
  const {
    cart,
    wishlist,
    cartSubtotal,
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    setSelectedBrand,
    activeBudgetFilter,
    setActiveBudgetFilter,
    setActiveModal,
    openQrModal,
    activeOutlet,
    brandingSettings,
    currentUser,
    currentRole,
    isAuthenticated,
    logoutUser,
  } = useStore();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchContainerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setIsSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (searchQuery.trim()) {
      saveRecentSearch(searchQuery.trim());
    }
    setIsSearchFocused(false);
    const prodSection = document.getElementById('products-section');
    if (prodSection) {
      prodSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleSelectSuggestion = (text: string) => {
    setSearchQuery(text);
    saveRecentSearch(text);
    setIsSearchFocused(false);
    const prodSection = document.getElementById('products-section');
    if (prodSection) {
      prodSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleSelectCategory = (categoryId: string) => {
    setSelectedCategory(categoryId);
    setSearchQuery('');
    setIsSearchFocused(false);
    const prodSection = document.getElementById('products-section');
    if (prodSection) {
      prodSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleSelectBrand = (brand: string) => {
    setSelectedBrand(brand);
    setSearchQuery(brand);
    saveRecentSearch(brand);
    setIsSearchFocused(false);
    const prodSection = document.getElementById('products-section');
    if (prodSection) {
      prodSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const cartItemCount = cart.reduce((total, item) => total + item.quantity, 0);

  const handleStoreQr = () => {
    openQrModal({
      title: `Scan to Open ${brandingSettings.brandName} Store`,
      qrValue: typeof window !== 'undefined' ? window.location.origin : 'https://javed-electronics.in',
      subtitle: 'Share this QR code with customers or scan on your smartphone camera',
    });
  };

  const brandInitials =
    brandingSettings.brandName
      .split(' ')
      .filter(Boolean)
      .map((w) => w[0])
      .slice(0, 2)
      .join('')
      .toUpperCase() || 'JE';

  const isDashboardView = isAuthenticated && currentRole !== 'customer';

  const defaultPincode =
    currentUser?.savedAddresses?.find((a) => a.isDefault)?.pincode ||
    currentUser?.savedAddresses?.[0]?.pincode ||
    activeOutlet?.pincode ||
    '401209';

  const defaultArea =
    currentUser?.savedAddresses?.find((a) => a.isDefault)?.area ||
    currentUser?.savedAddresses?.[0]?.area ||
    activeOutlet?.name.split(' ')[0] ||
    'Nalasopara East';

  // ============================================================================
  // 1. DASHBOARD HEADER (Strictly for Admin, Store Manager & Rider Portals)
  // ============================================================================
  if (isDashboardView) {
    return (
      <header className="sticky top-0 z-40 bg-linear-to-r from-slate-50/95 via-white to-indigo-50/30 backdrop-blur-md border-b border-slate-200/80 shadow-2xs no-print w-full max-w-full overflow-hidden box-border">
        <div className="max-w-7xl mx-auto px-2.5 sm:px-4 py-2 sm:py-2.5 flex items-center justify-between gap-2 w-full min-w-0 box-border">
          <div className="flex items-center gap-2 min-w-0">
            <div
              className="w-8 h-8 rounded-lg text-white flex items-center justify-center font-extrabold text-sm shadow-xs shrink-0"
              style={{ backgroundColor: brandingSettings.theme.primaryColor || '#1d4ed8' }}
            >
              {brandInitials}
            </div>
            <div className="min-w-0">
              <span className="text-xs sm:text-base font-bold tracking-tight text-slate-900 block truncate">
                {brandingSettings.brandName.toUpperCase()}
              </span>
              <span className="text-[10px] text-slate-500 font-semibold tracking-wide uppercase block truncate">
                {currentRole.replace('_', ' ').toUpperCase()} PORTAL • {activeOutlet?.name || 'All Outlets'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="flex items-center gap-1.5 bg-white/90 p-1 pl-2.5 rounded-xl border border-slate-200/90 shadow-2xs text-xs">
              <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-black">
                {currentUser.name.charAt(0)}
              </div>
              <span className="hidden sm:inline font-bold text-slate-800 truncate max-w-[120px]">
                {currentUser.name.split(' ')[0]}
              </span>
              <button
                onClick={() => setActiveModal('auth')}
                title="Switch Account"
                className="p-1 text-slate-500 hover:text-blue-700 rounded cursor-pointer"
              >
                <KeyRound className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => logoutUser()}
                title="Sign Out"
                className="p-1 text-slate-500 hover:text-rose-600 rounded cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </header>
    );
  }

  // ============================================================================
  // 2. CUSTOMER STOREFRONT HEADER (Lightweight Premium Background + Category-Wise Tabs)
  // ============================================================================
  return (
    <header className="relative z-30 bg-linear-to-b from-slate-50/95 via-white to-indigo-50/35 border-b border-slate-200/80 text-slate-900 shadow-2xs no-print w-full max-w-full overflow-hidden box-border">
      <div className="relative max-w-7xl mx-auto px-3 sm:px-4 pt-2.5 sm:pt-3.5 pb-2.5 space-y-2.5 w-full box-border">
        {/* ROW 1: Compact Brand Identity + Location Bar + Right Utilities */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => {
                setActiveBudgetFilter(null);
                setSelectedCategory('all');
                setSelectedBrand('all');
              }}
              className="flex items-center gap-2 text-left cursor-pointer group min-w-0"
            >
              <span
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl text-white flex items-center justify-center font-black text-xs shadow-xs shrink-0"
                style={{ backgroundColor: brandingSettings.theme.primaryColor || '#1d4ed8' }}
              >
                {brandInitials}
              </span>
              <div className="min-w-0">
                <span className="font-extrabold text-sm sm:text-base tracking-tight text-slate-900 block truncate">
                  {brandingSettings.brandName}
                </span>
                <span className="text-[10px] text-slate-500 font-medium block truncate">
                  Authorized Multi-Branch Electronics Store
                </span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setActiveModal('pincode_check')}
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white border border-slate-200/90 text-xs text-slate-700 hover:border-blue-300 shadow-2xs transition-colors cursor-pointer"
            >
              <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span className="font-bold text-slate-900">{defaultPincode}</span>
              <span className="text-slate-300">·</span>
              <span className="text-slate-600 truncate max-w-[140px]">
                {defaultArea === 'Add address' ? 'Check Delivery' : defaultArea}
              </span>
            </button>
          </div>

          {/* Desktop Right Utilities */}
          <div className="hidden md:flex items-center gap-2 shrink-0">
            <PWAInstallButton variant="header" />

            <button
              onClick={() => setActiveModal('customer_account')}
              title="Wishlist"
              className="relative p-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200/90 text-slate-700 shadow-2xs transition-colors cursor-pointer"
            >
              <Heart className="w-4 h-4" />
              {wishlist.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-[9px] font-extrabold w-4 h-4 rounded-full flex items-center justify-center">
                  {wishlist.length}
                </span>
              )}
            </button>

            {isAuthenticated ? (
              <div className="flex items-center gap-1 bg-white text-slate-900 px-2.5 py-1.5 rounded-xl border border-slate-200/90 text-xs font-bold shadow-2xs">
                <button
                  onClick={() => setActiveModal('customer_account')}
                  className="flex items-center gap-1.5 cursor-pointer"
                >
                  <User className="w-3.5 h-3.5 text-blue-600" />
                  <span>{currentUser.name.split(' ')[0]}</span>
                </button>
                <button
                  onClick={() => setActiveModal('auth')}
                  title="Switch Account"
                  className="p-1 text-slate-400 hover:text-blue-600 cursor-pointer"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => logoutUser()}
                  title="Logout"
                  className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setActiveModal('auth')}
                className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-800 border border-slate-200/90 text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5 text-blue-600" />
                <span>Sign In</span>
              </button>
            )}

            <button
              onClick={() => setActiveModal('cart')}
              className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            >
              <div className="relative">
                <ShoppingCart className="w-4 h-4" />
                {cartItemCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-blue-500 text-white text-[9px] font-bold w-3.5 h-3.5 rounded-full flex items-center justify-center">
                    {cartItemCount}
                  </span>
                )}
              </div>
              <span>{cartSubtotal > 0 ? formatINR(cartSubtotal) : 'Cart'}</span>
            </button>
          </div>

          {/* Mobile Compact Location & Menu Controls */}
          <div className="flex items-center gap-1.5 shrink-0 md:hidden">
            <button
              type="button"
              onClick={() => setActiveModal('pincode_check')}
              className="px-2 py-1 rounded-lg bg-white border border-slate-200/90 text-[11px] font-semibold text-slate-700 flex items-center gap-1 cursor-pointer"
            >
              <MapPin className="w-3 h-3 text-blue-600" />
              <span>{defaultPincode}</span>
            </button>
            {isAuthenticated ? (
              <button
                type="button"
                onClick={() => setActiveModal('customer_account')}
                className="px-2 py-1 rounded-lg bg-white border border-slate-200/90 text-[11px] font-bold text-slate-800 cursor-pointer"
              >
                {currentUser.name.split(' ')[0]}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setActiveModal('auth')}
                className="px-2 py-1 rounded-lg bg-blue-600 text-[11px] font-bold text-white cursor-pointer"
              >
                Sign In
              </button>
            )}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Menu"
              className="p-1.5 rounded-lg bg-white border border-slate-200/90 text-slate-700 hover:text-slate-900 cursor-pointer"
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* ROW 2: Crisp Search Bar with Predictive Dropdown + Store QR Button */}
        <div className="flex items-center gap-2">
          <div ref={searchContainerRef} className="relative flex-1 min-w-0">
            <form onSubmit={handleSearchSubmit} className="relative w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onFocus={() => setIsSearchFocused(true)}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setIsSearchFocused(true);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    setIsSearchFocused(false);
                  }
                }}
                placeholder="Search mobiles, chargers, earbuds, smartwatches, TVs..."
                className="w-full h-10 sm:h-11 pl-10 pr-9 bg-white text-slate-900 placeholder:text-slate-400 text-xs sm:text-sm rounded-xl border border-slate-200/90 shadow-2xs focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-400 box-border"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setIsSearchFocused(true);
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </form>

            {/* Interactive Predictive Search & Similar Words Dropdown */}
            <PredictiveSearchDropdown
              query={searchQuery}
              isOpen={isSearchFocused}
              onClose={() => setIsSearchFocused(false)}
              onSelectSuggestion={handleSelectSuggestion}
              onSelectCategory={handleSelectCategory}
              onSelectBrand={handleSelectBrand}
            />
          </div>

          <button
            type="button"
            onClick={handleStoreQr}
            title="Scan or Share Store QR"
            className="h-10 sm:h-11 px-3 rounded-xl bg-white hover:bg-slate-50 border border-slate-200/90 text-slate-700 flex items-center justify-center gap-1.5 shrink-0 cursor-pointer shadow-2xs transition-colors text-xs font-semibold"
          >
            <QrCode className="w-4 h-4 text-blue-600" />
            <span className="hidden sm:inline">Store QR</span>
          </button>
        </div>
      </div>

      {/* Mobile Utility Drawer (When Menu Icon Tapped) */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white text-slate-900 border-t border-slate-200 px-3 py-3 space-y-2 shadow-xl">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => {
                setActiveModal('order_tracking');
                setMobileMenuOpen(false);
              }}
              className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-800 flex items-center gap-2 cursor-pointer"
            >
              <Package className="w-4 h-4 text-blue-600" />
              <span>Track Order</span>
            </button>
            <button
              onClick={() => {
                setActiveModal('auth');
                setMobileMenuOpen(false);
              }}
              className="p-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-xs font-bold text-blue-700 flex items-center gap-2 cursor-pointer"
            >
              <KeyRound className="w-4 h-4 text-blue-600" />
              <span>Staff / Portal Login</span>
            </button>
          </div>
          <PWAInstallButton variant="card" />
        </div>
      )}
    </header>
  );
};
