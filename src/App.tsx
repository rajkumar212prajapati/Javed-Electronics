import React from 'react';
import { StoreProvider, useStore } from './context/StoreContext';
import { RoleSwitcherBanner } from './components/common/RoleSwitcherBanner';
import { Header } from './components/common/Header';
import { Footer } from './components/common/Footer';
import { HeroBanner } from './components/storefront/HeroBanner';
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
import { AuthModal } from './components/common/AuthModal';
import { CustomerSupportChatbot } from './components/common/CustomerSupportChatbot';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { DeliveryStaffPortal } from './components/delivery/DeliveryStaffPortal';
import { FestivalHomepage } from './components/storefront/festival/FestivalHomepage';
import { PWAInstallBanner } from './components/common/PWAInstallBanner';
import { OfflineIndicator } from './components/common/OfflineIndicator';
import { MobileBottomNav } from './components/common/MobileBottomNav';
import { POSTerminal } from './components/admin/pos/POSTerminal';
import { GoogleMapsWrapper } from './components/common/GoogleMapsWrapper';
import { PromotionalHomepageSlot } from './components/storefront/PromotionalHomepageSlots';
import { PromotionalLandingPageModal } from './components/storefront/PromotionalLandingPageModal';
import { MahaSaleModal } from './components/storefront/MahaSaleModal';
import { CategoryPills } from './components/storefront/CategoryPills';
import { FullScreenCategoryModal } from './components/storefront/FullScreenCategoryModal';

const AppContent: React.FC = () => {
  const {
    currentRole,
    currentUser,
    isAuthenticated,
    previewFestivalCampaign,
    setPreviewFestivalCampaign,
    activeModal,
    setActiveModal,
    searchQuery,
    selectedCategory,
    activeBudgetFilter,
  } = useStore();

  const isDashboardView = isAuthenticated && currentRole !== 'customer';
  const showHeroBanner =
    !searchQuery.trim() && selectedCategory === 'all' && activeBudgetFilter === null;

  return (
    <div className={`min-h-screen flex flex-col bg-white text-slate-900 font-sans w-full max-w-full overflow-x-hidden ${isDashboardView ? 'pb-0' : 'pb-16'}`}>
      {/* Role Preview Switcher Banner - Strictly for Super Admin accounts */}
      {isAuthenticated && currentUser.role === 'super_admin' && <RoleSwitcherBanner />}

      {/* Main Global Header */}
      <Header />

      {/* Main View Router based on Active User Role */}
      <main className="flex-1 pb-8 w-full max-w-full min-w-0">
        {isDashboardView ? (
          currentRole === 'delivery_staff' ? (
            <DeliveryStaffPortal />
          ) : (
            <AdminDashboard />
          )
        ) : (
          <>
            {/* TOP HOMEPAGE PROMOTIONAL SPACE (Announcement Bar / Banner / Badge) */}
            <PromotionalHomepageSlot position="top" />

            {previewFestivalCampaign ? (
              <FestivalHomepage
                activeCampaign={previewFestivalCampaign}
                previewCampaign={previewFestivalCampaign}
                onExitPreview={() => setPreviewFestivalCampaign(null)}
              />
            ) : (
              showHeroBanner && <HeroBanner />
            )}

            {/* STOREFRONT ALL CATEGORIES SECTION (Click any category to view all items in full screen) */}
            <CategoryPills />

            {/* MIDDLE HOMEPAGE PROMOTIONAL SPACE (Interactive Cards / Deals / Sale Grids) */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-2 mb-4">
              <PromotionalHomepageSlot position="middle" />
            </div>

            {/* Clean Product Catalog Grid */}
            <div id="products-section" className="scroll-mt-4">
              <ProductGrid />
            </div>

            {/* BOTTOM HOMEPAGE PROMOTIONAL SPACE (Showcase / Mega Banner / Festival Teaser) */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
              <PromotionalHomepageSlot position="bottom" />
            </div>
          </>
        )}
      </main>

      {/* Customer Storefront Footer - Hidden on Admin, Store, Rider & Management Dashboards */}
      {!isDashboardView && <Footer />}

      {/* Mobile Fixed 5-Tab Bottom Navigation Bar (Home, Maha Sale, Categories, Account, Cart) */}
      {!isDashboardView && <MobileBottomNav />}

      {/* Modals & Dialogs */}
      <FullScreenCategoryModal />
      <ProductDetailModal />
      <MahaSaleModal />
      <CartDrawer />
      <CheckoutModal />
      <OrderConfirmationModal />
      <OrderTrackingModal />
      <PrintableInvoice />
      <CustomerAccountModal />
      <PincodeCheckModal />
      <QuickQRModal />
      <PolicyModal />
      <AuthModal />
      <PromotionalLandingPageModal />
      {!isDashboardView && <CustomerSupportChatbot />}
      <OfflineIndicator />
      {activeModal === 'pos_terminal' && (
        <POSTerminal onClose={() => setActiveModal(null)} isFullScreenMode={true} />
      )}
    </div>
  );
};

export default function App() {
  return (
    <StoreProvider>
      <GoogleMapsWrapper>
        <AppContent />
      </GoogleMapsWrapper>
    </StoreProvider>
  );
}
