import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { Home, Flame, LayoutGrid, User, ShoppingCart } from 'lucide-react';

export const MobileBottomNav: React.FC = () => {
  const {
    cart,
    isAuthenticated,
    currentRole,
    setSelectedCategory,
    setSelectedBrand,
    setSearchQuery,
    activeModal,
    setActiveModal,
    setSelectedProductForDetail,
    setActivePromotionalPage,
    fullScreenCategory,
    setFullScreenCategory,
  } = useStore();

  const [activeNav, setActiveNav] = useState<'home' | 'maha_sale' | 'categories' | 'account' | 'cart'>('home');

  const isDashboardView = isAuthenticated && currentRole !== 'customer';
  if (isDashboardView) return null;

  const cartItemCount = cart.reduce((total, item) => total + item.quantity, 0);

  // Determine highlighted tab based on currently open modal or active navigation state
  const currentActiveTab: 'home' | 'maha_sale' | 'categories' | 'account' | 'cart' =
    activeModal === 'maha_sale'
      ? 'maha_sale'
      : activeModal === 'customer_account' || activeModal === 'auth'
      ? 'account'
      : activeModal === 'cart' || activeModal === 'checkout'
      ? 'cart'
      : fullScreenCategory
      ? 'categories'
      : activeNav;

  return (
    <nav
      aria-label="Customer portal bottom navigation"
      className="fixed bottom-0 inset-x-0 z-[100] bg-white/95 backdrop-blur-md border-t border-slate-200 px-2 py-1.5 flex items-center justify-around shadow-[0_-4px_16px_rgba(0,0,0,0.08)] no-print"
    >
      <button
        type="button"
        onClick={() => {
          setActiveNav('home');
          setActiveModal(null);
          setFullScreenCategory(null);
          setSelectedProductForDetail(null);
          setActivePromotionalPage(null);
          setSelectedCategory('all');
          setSelectedBrand('all');
          setSearchQuery('');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        className={`flex flex-col items-center justify-center gap-0.5 py-1 px-3 rounded-lg transition-colors cursor-pointer ${
          currentActiveTab === 'home' ? 'text-indigo-600 font-extrabold' : 'text-slate-600 hover:text-slate-900 font-medium'
        }`}
      >
        <Home className={`w-5 h-5 ${currentActiveTab === 'home' ? 'fill-indigo-600 text-indigo-600' : ''}`} />
        <span className="text-[11px] leading-tight">Home</span>
      </button>

      <button
        type="button"
        onClick={() => {
          setActiveNav('maha_sale');
          setFullScreenCategory(null);
          setSelectedProductForDetail(null);
          setActivePromotionalPage(null);
          setActiveModal('maha_sale');
        }}
        className={`flex flex-col items-center justify-center gap-0.5 py-1 px-3 rounded-lg transition-colors cursor-pointer ${
          currentActiveTab === 'maha_sale' ? 'text-rose-600 font-extrabold' : 'text-slate-600 hover:text-slate-900 font-medium'
        }`}
      >
        <span className="relative">
          <Flame className={`w-5 h-5 ${currentActiveTab === 'maha_sale' ? 'fill-rose-600 text-rose-600 animate-pulse' : 'text-rose-500'}`} />
          <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-rose-500 animate-ping" />
        </span>
        <span className="text-[11px] leading-tight font-bold">Maha Sale</span>
      </button>

      <button
        type="button"
        onClick={() => {
          setActiveNav('categories');
          setActiveModal(null);
          setSelectedProductForDetail(null);
          setActivePromotionalPage(null);
          setFullScreenCategory('all');
        }}
        className={`flex flex-col items-center justify-center gap-0.5 py-1 px-3 rounded-lg transition-colors cursor-pointer ${
          currentActiveTab === 'categories' ? 'text-indigo-600 font-extrabold' : 'text-slate-600 hover:text-slate-900 font-medium'
        }`}
      >
        <LayoutGrid className="w-5 h-5" />
        <span className="text-[11px] leading-tight">Categories</span>
      </button>

      <button
        type="button"
        onClick={() => {
          setActiveNav('account');
          if (isAuthenticated) {
            setActiveModal('customer_account');
          } else {
            setActiveModal('auth');
          }
        }}
        className={`flex flex-col items-center justify-center gap-0.5 py-1 px-3 rounded-lg transition-colors cursor-pointer ${
          currentActiveTab === 'account' ? 'text-indigo-600 font-extrabold' : 'text-slate-600 hover:text-slate-900 font-medium'
        }`}
      >
        <User className="w-5 h-5" />
        <span className="text-[11px] leading-tight">Account</span>
      </button>

      <button
        type="button"
        onClick={() => {
          setActiveNav('cart');
          setActiveModal('cart');
        }}
        className={`relative flex flex-col items-center justify-center gap-0.5 py-1 px-3 rounded-lg transition-colors cursor-pointer ${
          currentActiveTab === 'cart' ? 'text-indigo-600 font-extrabold' : 'text-slate-600 hover:text-slate-900 font-medium'
        }`}
      >
        <div className="relative">
          <ShoppingCart className="w-5 h-5" />
          {cartItemCount > 0 && (
            <span className="absolute -top-1.5 -right-2 bg-rose-600 text-white text-[9px] font-extrabold min-w-[16px] h-4 px-1 rounded-full flex items-center justify-center">
              {cartItemCount}
            </span>
          )}
        </div>
        <span className="text-[11px] leading-tight">Cart</span>
      </button>
    </nav>
  );
};
