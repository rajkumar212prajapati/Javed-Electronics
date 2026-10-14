import React from 'react';
import { StoreProvider, useStore } from './context/StoreContext';
import { RoleSwitcherBanner } from './components/common/RoleSwitcherBanner';
import { Header } from './components/common/Header';
import { Footer } from './components/common/Footer';
import { HeroBanner } from './components/storefront/HeroBanner';
import { CategoryPills } from './components/storefront/CategoryPills';
import { ProductGrid } from './components/storefront/ProductGrid';
import { ProductDetailModal } from './components/storefront/ProductDetailModal';
import { CartDrawer } from './components/cart/CartDrawer';
import { CheckoutModal } from './components/checkout/CheckoutModal';
import { OrderConfirmationModal } from './components/orders/OrderConfirmationModal';
import { OrderTrackingModal } from './components/orders/OrderTrackingModal';
import { PrintableInvoice } from './components/orders/PrintableInvoice';
import { CustomerAccountModal } from './components/customer/CustomerAccountModal';
import { PincodeCheckModal } from './components/common/PincodeCheckModal';
import { QuickQRModal } from './components/common/QuickQRModal';
import { PolicyModal } from './components/common/PolicyModal';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { DeliveryStaffPortal } from './components/delivery/DeliveryStaffPortal';

const AppContent: React.FC = () => {
  const { currentRole } = useStore();

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans w-full max-w-full overflow-x-hidden">
      {/* Role Preview Switcher Banner */}
      <RoleSwitcherBanner />

      {/* Main Global Header */}
      <Header />

      {/* Main View Router based on Active User Role */}
      <main className="flex-1 pb-20 sm:pb-8 w-full max-w-full min-w-0">
        {currentRole === 'super_admin' || currentRole === 'store_manager' ? (
          <AdminDashboard />
        ) : currentRole === 'delivery_staff' ? (
          <DeliveryStaffPortal />
        ) : (
          <>
            {/* Customer Facing Storefront */}
            <HeroBanner />
            <CategoryPills />
            <ProductGrid />
          </>
        )}
      </main>

      {/* Footer */}
      <Footer />

      {/* Modals & Dialogs */}
      <ProductDetailModal />
      <CartDrawer />
      <CheckoutModal />
      <OrderConfirmationModal />
      <OrderTrackingModal />
      <PrintableInvoice />
      <CustomerAccountModal />
      <PincodeCheckModal />
      <QuickQRModal />
      <PolicyModal />
    </div>
  );
};

export default function App() {
  return (
    <StoreProvider>
      <AppContent />
    </StoreProvider>
  );
}
