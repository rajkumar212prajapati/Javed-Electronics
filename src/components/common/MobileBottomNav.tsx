import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { Home, PlaySquare, LayoutGrid, User, ShoppingCart } from 'lucide-react';

export const MobileBottomNav: React.FC = () => {
  const {
    cart,
    isAuthenticated,
    currentRole,
    setSelectedCategory,
    setSelectedBrand,
    setSearchQuery,
    setActiveModal,
  } = useStore();

  const [activeNav, setActiveNav] = useState<'home' | 'deals' | 'categories' | 'account' | 'cart'>('home');

  const isDashboardView = isAuthenticated && currentRole !== 'customer';
  if (isDashboardView) return null;

  const cartItemCount = cart.reduce((total, item) => total + item.quantity, 0);

  return (
    <nav
      aria-label="Mobile bottom navigation"
      className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-slate-200 px-2 py-1.5 flex items-center justify-around shadow-[0_-2px_10px_rgba(0,0,0,0.05)] no-print"
    >
      <button
        type="button"
        onClick={() => {
          setActiveNav('home');
          setSelectedCategory('all');
          setSelectedBrand('all');
          setSearchQuery('');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        className={`flex flex-col items-center justify-center gap-0.5 py-1 px-3 rounded-lg transition-colors cursor-pointer ${
          activeNav === 'home' ? 'text-blue-600 font-bold' : 'text-slate-600 hover:text-slate-900 font-medium'
        }`}
      >
        <Home className={`w-5 h-5 ${activeNav === 'home' ? 'fill-blue-600 text-blue-600' : ''}`} />
        <span className="text-[11px] leading-tight">Home</span>
      </button>

      <button
        type="button"
        onClick={() => {
          setActiveNav('deals');
          const el = document.getElementById('on-everybodys-list');
          if (el) {
            el.scrollIntoView({ behavior: 'smooth' });
          } else {
            window.scrollTo({ top: 320, behavior: 'smooth' });
          }
        }}
        className={`flex flex-col items-center justify-center gap-0.5 py-1 px-3 rounded-lg transition-colors cursor-pointer ${
          activeNav === 'deals' ? 'text-blue-600 font-bold' : 'text-slate-600 hover:text-slate-900 font-medium'
        }`}
      >
        <PlaySquare className="w-5 h-5" />
        <span className="text-[11px] leading-tight">Play</span>
      </button>

      <button
        type="button"
        onClick={() => {
          setActiveNav('categories');
          const el = document.getElementById('products-section');
          if (el) {
            el.scrollIntoView({ behavior: 'smooth' });
          }
        }}
        className={`flex flex-col items-center justify-center gap-0.5 py-1 px-3 rounded-lg transition-colors cursor-pointer ${
          activeNav === 'categories' ? 'text-blue-600 font-bold' : 'text-slate-600 hover:text-slate-900 font-medium'
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
          activeNav === 'account' ? 'text-blue-600 font-bold' : 'text-slate-600 hover:text-slate-900 font-medium'
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
          activeNav === 'cart' ? 'text-blue-600 font-bold' : 'text-slate-600 hover:text-slate-900 font-medium'
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
