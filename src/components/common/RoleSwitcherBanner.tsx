import React from 'react';
import { useStore } from '../../context/StoreContext';
import { Role } from '../../types';
import { ShieldCheck, Store, Bike, User, ArrowRightLeft, Scan } from 'lucide-react';

export const RoleSwitcherBanner: React.FC = () => {
  const { currentRole, setCurrentRole, isAuthenticated, currentUser, setActiveModal } = useStore();

  // Strictly show multi-role preview switcher only for Super Admin accounts.
  // Store Managers and Riders only see their own dedicated portals.
  if (!isAuthenticated || currentUser.role !== 'super_admin') {
    return null;
  }

  const roles: {
    role: Role;
    label: string;
    shortLabel: string;
    icon: React.ReactNode;
    desc: string;
    badgeColor: string;
  }[] = [
    {
      role: 'customer',
      label: 'Customer Storefront',
      shortLabel: 'Customer',
      icon: <User className="w-3.5 h-3.5 shrink-0" />,
      desc: 'Browse, Cart, Dynamic QR & WhatsApp Checkout',
      badgeColor: 'bg-blue-600 text-white',
    },
    {
      role: 'store_manager',
      label: 'Store Manager',
      shortLabel: 'Manager',
      icon: <Store className="w-3.5 h-3.5 shrink-0" />,
      desc: 'Process Orders, Packing, Stock Adjustments',
      badgeColor: 'bg-emerald-600 text-white',
    },
    {
      role: 'super_admin',
      label: 'Super Admin',
      shortLabel: 'Admin',
      icon: <ShieldCheck className="w-3.5 h-3.5 shrink-0" />,
      desc: 'Financials, Margins, Valuation, Settings',
      badgeColor: 'bg-purple-600 text-white',
    },
    {
      role: 'delivery_staff',
      label: 'Delivery Partner',
      shortLabel: 'Rider',
      icon: <Bike className="w-3.5 h-3.5 shrink-0" />,
      desc: 'Assigned Orders, COD Collection & Proof',
      badgeColor: 'bg-amber-600 text-white',
    },
  ];

  return (
    <aside aria-label="Role preview switcher" className="bg-slate-900 text-white text-xs border-b border-slate-800 no-print w-full max-w-full overflow-hidden box-border">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 w-full min-w-0 box-border">
        <div className="flex items-center gap-1.5 shrink-0 text-slate-300">
          <ArrowRightLeft className="w-3.5 h-3.5 text-blue-400 shrink-0" />
          <span className="font-semibold text-[11px] sm:text-xs">
            Active Role:
          </span>
          <span className="text-slate-400 text-[10px] sm:text-[11px]">
            (Tap to switch portal)
          </span>
        </div>

        {/* Responsive buttons: cleanly scrollable on small mobile, wraps naturally on larger screens */}
        <div className="w-full sm:w-auto flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-0.5 sm:pb-0 min-w-0 max-w-full">
          {roles.map((r) => {
            const isActive = currentRole === r.role;
            return (
              <button
                key={r.role}
                onClick={() => setCurrentRole(r.role)}
                title={r.desc}
                className={`shrink-0 flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-md text-[11px] font-semibold transition-all cursor-pointer min-h-[32px] ${
                  isActive
                    ? `${r.badgeColor} ring-1 ring-white/30 shadow-xs`
                    : 'bg-slate-800/90 text-slate-300 hover:bg-slate-700 hover:text-white'
                }`}
              >
                {r.icon}
                <span className="sm:hidden">{r.shortLabel}</span>
                <span className="hidden sm:inline">{r.label}</span>
              </button>
            );
          })}

          {/* Quick POS Terminal Launch */}
          {(currentRole === 'super_admin' || currentRole === 'store_manager') && (
            <button
              onClick={() => setActiveModal('pos_terminal')}
              className="shrink-0 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-all cursor-pointer min-h-[32px] ml-1 shadow-xs"
              title="Open Store POS Counter Terminal"
            >
              <Scan className="w-3.5 h-3.5" />
              <span>POS Terminal</span>
            </button>
          )}
        </div>
      </div>
    </aside>
  );
};
