import React, { useState, useMemo, useEffect } from 'react';
import { useStore } from '../../context/StoreContext';
import { formatINR } from '../../utils/currency';
import { Order, OrderStatus, Product, ProductCategory, StockMovement } from '../../types';
import {
  BarChart3,
  Package,
  Layers,
  Sparkles,
  Truck,
  Settings,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Printer,
  Edit3,
  TrendingUp,
  AlertTriangle,
  ArrowUpRight,
  Download,
  DollarSign,
  Tag,
  ShieldCheck,
  Check,
  X,
  MapPin,
  Building2,
  Briefcase,
  FolderTree,
  CreditCard,
  Scan,
  ArrowLeftRight,
  FileText,
  Palette,
  KeyRound,
  Receipt,
  Percent,
  PackageX,
  LayoutTemplate,
  Store,
  Phone,
  Mail,
  QrCode,
  Activity,
  ExternalLink,
  Banknote,
} from 'lucide-react';
import { AdminAuthenticatorQrModal } from './AdminAuthenticatorQrModal';
import { AIProductAssistantModal } from './AIProductAssistantModal';
import { ProductApprovalsQueueModal } from './ProductApprovalsQueueModal';
import { MultiSellerPriceModal } from './MultiSellerPriceModal';
import { UserAccount } from '../../types';
import { OutletsManager } from './OutletsManager';
import { OwnershipModelsManager } from './OwnershipModelsManager';
import { CategoryApprovalManager } from './CategoryApprovalManager';
import { PayoutsLedgerManager } from './PayoutsLedgerManager';
import { BarcodeCatalogManager } from './BarcodeCatalogManager';
import { StockTransfersManager } from './StockTransfersManager';
import { FranchiseAgreementsManager } from './FranchiseAgreementsManager';
import { AdminBrandingManager } from './AdminBrandingManager';
import { StoreStaffAuthManager } from './StoreStaffAuthManager';
import { DeliveryZoneManager } from './DeliveryZoneManager';
import { GstTaxationManager } from './GstTaxationManager';
import { BulkDiscountManager } from './BulkDiscountManager';
import { StoreOrderCancellationModal } from './StoreOrderCancellationModal';
import { HomepageLayoutManager } from './HomepageLayoutManager';
import { FestivalCampaignManager } from './campaigns/FestivalCampaignManager';
import { PaymentGatewaysManager } from './PaymentGatewaysManager';
import { POSTerminal } from './pos/POSTerminal';
import { SopSlaMatrixSection } from './SopSlaMatrixSection';
import { OrderDispatchModal } from './OrderDispatchModal';
import { CodCollectionModal } from './CodCollectionModal';
import { DeliveryPartnerManager } from './DeliveryPartnerManager';
import { ProductVariantsAndDimensionsModal } from './ProductVariantsAndDimensionsModal';
import { VolumetricWeightCalculatorModal } from '../common/VolumetricWeightCalculatorModal';

export const AdminDashboard: React.FC = () => {
  const {
    products,
    orders,
    stockMovements,
    campaigns,
    coupons,
    settings,
    currentUser,
    currentRole,
    accounts,
    outlets,
    activeOutlet,
    businessCategories,
    stockTransfers,
    barcodeRecords,
    franchiseAgreements,
    payoutItems,
    updateOrderStatus,
    verifyOrderPayment,
    assignDeliveryStaff,
    adjustStock,
    addProduct,
    updateProduct,
    addCampaign,
    toggleCampaignStatus,
    addCoupon,
    toggleCouponStatus,
    updateSettings,
    setSelectedOrderForModal,
    setActiveModal,
    updateStoreStaffAccount,
    riderRemittances,
    approveRiderCashRemittance,
  } = useStore();

  // Quick 8-Digit Rider Cash Deposit Code state in Admin/Store Overview
  const [riderDepositCodeInput, setRiderDepositCodeInput] = useState('');
  const [riderDepositFeedback, setRiderDepositFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const pendingRiderDeposits = useMemo(() => {
    return riderRemittances.filter((r) => r.status === 'pending_approval');
  }, [riderRemittances]);

  const handleApproveRiderDepositByCode = (e: React.FormEvent, codeOverride?: string) => {
    e.preventDefault();
    const cleanCode = (codeOverride ?? riderDepositCodeInput).trim().replace(/\s+/g, '');
    if (!cleanCode) {
      setRiderDepositFeedback({
        type: 'error',
        message: 'Please enter the 8-digit code created by the rider.',
      });
      return;
    }
    const approver = `${currentUser.name} (${currentRole.replace('_', ' ')})`;
    const res = approveRiderCashRemittance(
      cleanCode,
      approver,
      `8-digit code ${cleanCode} verified and cash approved by ${approver}`
    );
    setRiderDepositFeedback({
      type: res.success ? 'success' : 'error',
      message: res.message,
    });
    if (res.success) {
      setRiderDepositCodeInput('');
    }
    setTimeout(() => setRiderDepositFeedback(null), 5000);
  };

  const isSuperAdmin = currentRole === 'super_admin';

  // Google Authenticator QR Registration Modal State
  const [showAuthenticatorQrModal, setShowAuthenticatorQrModal] = useState(false);
  const [authenticatorTargetAccount, setAuthenticatorTargetAccount] = useState<UserAccount | null>(null);

  const currentAdminAccount = useMemo(() => {
    return (
      accounts.find((a) => a.email === currentUser.email) ||
      accounts.find((a) => a.role === 'super_admin') ||
      accounts[0]
    );
  }, [accounts, currentUser.email]);

  // AI Product Assistant, Approvals & Multi-Seller States
  const [showAiProductModal, setShowAiProductModal] = useState(false);
  const [productForAiEdit, setProductForAiEdit] = useState<Product | null>(null);
  const [showApprovalsModal, setShowApprovalsModal] = useState(false);
  const [multiSellerModalProduct, setMultiSellerModalProduct] = useState<Product | null>(null);

  // Product Variants, Dimensions & Volumetric Calculator States
  const [showVariantsModal, setShowVariantsModal] = useState(false);
  const [productForVariantsEdit, setProductForVariantsEdit] = useState<Product | null>(null);
  const [showStandaloneVolumetricModal, setShowStandaloneVolumetricModal] = useState(false);

  const pendingApprovalsCount = useMemo(() => {
    return products.filter((p) => p.approvalStatus === 'pending').length;
  }, [products]);

  // Store-level outlet resolution for Store Manager (strictly bound to their own store)
  const myStoreId = isSuperAdmin
    ? activeOutlet?.id || 'out_hazratganj'
    : currentUser.storeId || activeOutlet?.id || 'out_hazratganj';
  const myStoreOutlet = outlets.find((o) => o.id === myStoreId) || activeOutlet || outlets[0];

  // Navigation tab
  const [activeTab, setActiveTab] = useState<
    | 'overview'
    | 'pos'
    | 'sop_sla'
    | 'express_delivery'
    | 'my_store'
    | 'outlets'
    | 'orders'
    | 'inventory'
    | 'stock_transfers'
    | 'barcodes'
    | 'products'
    | 'ai_assistant'
    | 'approvals_queue'
    | 'volumetric_calc'
    | 'authenticator_qr'
    | 'categories_mgmt'
    | 'payouts'
    | 'franchise'
    | 'ownership_models'
    | 'gst_taxation'
    | 'bulk_discounts'
    | 'delivery'
    | 'payment_gateways'
    | 'campaigns'
    | 'homepage_builder'
    | 'store_logins'
    | 'branding'
    | 'settings'
  >('overview');

  // Unified Admin & Store Search Bar + Tab Menu Group Filter
  const [dashboardSearch, setDashboardSearch] = useState('');
  const [menuGroupFilter, setMenuGroupFilter] = useState<
    'all' | 'operations' | 'catalog' | 'logistics' | 'finance' | 'settings'
  >('operations');

  // Ensure Store Manager is never stranded on a Super Admin tab
  useEffect(() => {
    if (!isSuperAdmin) {
      const storeAllowedTabs = [
        'overview',
        'pos',
        'sop_sla',
        'express_delivery',
        'orders',
        'inventory',
        'products',
        'ai_assistant',
        'volumetric_calc',
        'authenticator_qr',
        'stock_transfers',
        'barcodes',
        'delivery',
        'my_store',
      ];
      if (!storeAllowedTabs.includes(activeTab)) {
        setActiveTab('overview');
      }
    }
  }, [isSuperAdmin, activeTab]);

  // Orders tab filters
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('all');
  const [cancellingOrder, setCancellingOrder] = useState<Order | null>(null);

  // Dispatch & COD Collection modal states
  const [dispatchingOrder, setDispatchingOrder] = useState<Order | null>(null);
  const [collectingCodOrder, setCollectingCodOrder] = useState<Order | null>(null);

  // Stock adjustment modal state
  const [adjustingProduct, setAdjustingProduct] = useState<Product | null>(null);
  const [adjustmentValue, setAdjustmentValue] = useState<number>(0);
  const [adjustmentReason, setAdjustmentReason] = useState<string>('');

  // Add Product modal state
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [newProdName, setNewProdName] = useState('');
  const [newProdBrand, setNewProdBrand] = useState('');
  const [newProdCategory, setNewProdCategory] = useState<ProductCategory>('smartphones');
  const [newProdSku, setNewProdSku] = useState('');
  const [newProdMrp, setNewProdMrp] = useState(0);
  const [newProdPrice, setNewProdPrice] = useState(0);
  const [newProdCost, setNewProdCost] = useState(0);
  const [newProdGstRate, setNewProdGstRate] = useState<number>(18);
  const [newProdHsnCode, setNewProdHsnCode] = useState<string>('8517');
  const [newProdStock, setNewProdStock] = useState(10);
  const [newProdImage, setNewProdImage] = useState('');
  const [newProdDesc, setNewProdDesc] = useState('');

  // Add Campaign modal state
  const [showAddCampaign, setShowAddCampaign] = useState(false);
  const [campName, setCampName] = useState('');
  const [campHeadline, setCampHeadline] = useState('');
  const [campSubtext, setCampSubtext] = useState('');
  const [campCoupon, setCampCoupon] = useState('');
  const [campDays, setCampDays] = useState(7);

  // Settings form
  const [whatsappEdit, setWhatsappEdit] = useState(settings.whatsappNumber);
  const [phoneEdit, setPhoneEdit] = useState(settings.phone);
  const [upiEdit, setUpiEdit] = useState(settings.upiId);
  const [freeShipEdit, setFreeShipEdit] = useState(settings.freeDeliveryThreshold);
  const [settingsSavedMsg, setSettingsSavedMsg] = useState(false);

  // Store-scoped Orders, Stock Movements, Stock Transfers & Barcodes
  const scopedOrders = useMemo(() => {
    if (isSuperAdmin) return orders;
    return orders.filter((o) => {
      if (o.outletId) return o.outletId === myStoreId;
      if (myStoreOutlet?.serviceablePincodes?.includes(o.customer.pincode)) return true;
      return myStoreId === 'out_hazratganj';
    });
  }, [orders, isSuperAdmin, myStoreId, myStoreOutlet]);

  const scopedStockMovements = useMemo(() => {
    if (isSuperAdmin) return stockMovements;
    return stockMovements.filter((sm) => {
      if (sm.outletId) return sm.outletId === myStoreId;
      if (sm.staffName.toLowerCase().includes('super admin')) return false;
      return true;
    });
  }, [stockMovements, isSuperAdmin, myStoreId]);

  const scopedStockTransfers = useMemo(() => {
    if (isSuperAdmin) return stockTransfers;
    return stockTransfers.filter(
      (t) => t.sourceOutletId === myStoreId || t.destinationOutletId === myStoreId
    );
  }, [stockTransfers, isSuperAdmin, myStoreId]);

  const scopedBarcodes = useMemo(() => {
    if (isSuperAdmin) return barcodeRecords;
    return barcodeRecords.filter((b) => b.outletAvailability.includes(myStoreId));
  }, [barcodeRecords, isSuperAdmin, myStoreId]);

  // High-level Financial KPIs (Scoped to Store for Store Managers)
  const metrics = useMemo(() => {
    let totalRevenue = 0;
    let cashCollected = 0;
    let cogs = 0;
    let totalOrdersCount = scopedOrders.length;
    let pendingConfirmationsCount = 0;
    let packingQueueCount = 0;
    let outForDeliveryCount = 0;

    scopedOrders.forEach((o) => {
      if (o.orderStatus !== 'cancelled') {
        totalRevenue += o.finalTotal;
        if (o.paymentStatus === 'verified_paid') {
          cashCollected += o.finalTotal;
        }

        // Calculate Cost of Goods Sold for non-cancelled orders
        o.items.forEach((item) => {
          cogs += item.purchaseCost * item.quantity;
        });
      }

      if (o.orderStatus === 'awaiting_whatsapp_confirmation' || o.orderStatus === 'pending') {
        pendingConfirmationsCount++;
      }
      if (o.orderStatus === 'confirmed' || o.orderStatus === 'processing') {
        packingQueueCount++;
      }
      if (o.orderStatus === 'out_for_delivery') {
        outForDeliveryCount++;
      }
    });

    const grossProfit = totalRevenue - cogs;

    // Inventory Valuation
    let valuationAtCost = 0;
    let valuationAtSelling = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;

    products.forEach((p) => {
      const avail = p.stock.onHand;
      valuationAtCost += avail * p.purchaseCost;
      valuationAtSelling += avail * (p.dealPrice || p.regularPrice);

      const netAvail = p.stock.onHand - p.stock.reserved;
      if (netAvail <= 0) outOfStockCount++;
      else if (netAvail <= p.stock.minStockLevel) lowStockCount++;
    });

    return {
      totalRevenue,
      cashCollected,
      cogs,
      grossProfit,
      totalOrdersCount,
      pendingConfirmationsCount,
      packingQueueCount,
      outForDeliveryCount,
      valuationAtCost,
      valuationAtSelling,
      lowStockCount,
      outOfStockCount,
    };
  }, [scopedOrders, products]);

  // Filtered Orders
  const filteredOrders = useMemo(() => {
    return scopedOrders.filter((o) => {
      if (orderStatusFilter !== 'all' && o.orderStatus !== orderStatusFilter) {
        return false;
      }
      if (orderSearch.trim()) {
        const q = orderSearch.toLowerCase().trim();
        const matchId = o.id.toLowerCase().includes(q);
        const matchName = o.customer.name.toLowerCase().includes(q);
        const matchPhone = o.customer.phone.includes(q);
        return matchId || matchName || matchPhone;
      }
      return true;
    });
  }, [scopedOrders, orderStatusFilter, orderSearch]);

  // Export Orders to CSV
  const handleExportOrdersCsv = () => {
    const headers = ['Order ID', 'Date', 'Customer Name', 'Phone', 'Area', 'Payment Method', 'Payment Status', 'Order Status', 'Final Total (INR)'];
    const rows = scopedOrders.map((o) => [
      o.id,
      new Date(o.createdAt).toLocaleDateString(),
      `"${o.customer.name}"`,
      o.customer.phone,
      `"${o.customer.area}"`,
      o.paymentMethod,
      o.paymentStatus,
      o.orderStatus,
      o.finalTotal,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `javed_electronics_orders_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleOpenAdjustStock = (prod: Product) => {
    setAdjustingProduct(prod);
    setAdjustmentValue(prod.stock.onHand);
    setAdjustmentReason('Physical stock count update');
  };

  const handleSaveStockAdjustment = () => {
    if (!adjustingProduct) return;
    adjustStock(
      adjustingProduct.id,
      Number(adjustmentValue),
      adjustmentReason || 'Manual adjustment',
      isSuperAdmin ? 'Javed Akhtar (Super Admin)' : 'Store Manager'
    );
    setAdjustingProduct(null);
  };

  const handleCreateProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProdName || !newProdPrice) return;

    addProduct({
      sku: newProdSku || `JE-${Date.now().toString().slice(-6)}`,
      barcode: `890${Math.floor(1000000000 + Math.random() * 9000000000)}`,
      name: newProdName,
      brand: newProdBrand || 'Generic Brand',
      categoryId: newProdCategory,
      images: [
        newProdImage || 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=800&q=80',
      ],
      description: newProdDesc || 'Genuine electronics with brand warranty.',
      specifications: { 'Category': newProdCategory, 'Origin': 'Authorized Distribution' },
      mrp: Number(newProdMrp) || Number(newProdPrice) * 1.2,
      regularPrice: Number(newProdPrice),
      purchaseCost: Number(newProdCost) || Math.round(Number(newProdPrice) * 0.8),
      gstRate: Number(newProdGstRate) || 18,
      hsnCode: newProdHsnCode.trim() || undefined,
      isTaxInclusive: true,
      stock: {
        onHand: Number(newProdStock),
        reserved: 0,
        minStockLevel: 3,
      },
      warrantyMonths: 12,
      returnEligibleDays: 7,
      weightKg: 0.5,
      dimensions: '150 x 100 x 50 mm',
      status: 'published',
      rating: 4.8,
      reviewsCount: 1,
    });

    setShowAddProductModal(false);
    // Reset
    setNewProdName('');
    setNewProdPrice(0);
    setNewProdMrp(0);
  };

  const handleCreateCampaignSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!campName || !campHeadline) return;

    addCampaign({
      name: campName,
      slug: campName.toLowerCase().replace(/\s+/g, '-'),
      badge: 'FESTIVE SPECIAL',
      theme: 'custom',
      bannerHeadline: campHeadline,
      bannerSubtext: campSubtext || 'Limited time festive offers at Javed Electronics',
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + campDays * 86400000).toISOString(),
      couponCode: campCoupon || undefined,
      discountPercentage: 10,
      minCartValue: 1999,
      isActive: true,
    });

    setShowAddCampaign(false);
    setCampName('');
    setCampHeadline('');
    setCampSubtext('');
  };

  const handleSaveSettings = () => {
    updateSettings({
      whatsappNumber: whatsappEdit,
      phone: phoneEdit,
      upiId: upiEdit,
      freeDeliveryThreshold: Number(freeShipEdit),
    });
    setSettingsSavedMsg(true);
    setTimeout(() => setSettingsSavedMsg(false), 2000);
  };

  const allMenuTabs = isSuperAdmin
    ? [
        { id: 'overview', label: 'Overview & Analytics', group: 'operations', icon: <BarChart3 className="w-3.5 h-3.5 shrink-0" /> },
        { id: 'pos', label: 'POS Register', group: 'operations', icon: <Scan className="w-3.5 h-3.5 shrink-0 text-emerald-500" /> },
        { id: 'orders', label: `Orders (${orders.length})`, group: 'operations', icon: <Package className="w-3.5 h-3.5 shrink-0" /> },
        { id: 'sop_sla', label: 'SOP & SLA Matrix', group: 'operations', icon: <Activity className="w-3.5 h-3.5 shrink-0 text-amber-500" /> },
        { id: 'products', label: `Products (${products.length})`, group: 'catalog', icon: <DollarSign className="w-3.5 h-3.5 shrink-0" /> },
        { id: 'ai_assistant', label: 'AI Product Assistant & Add', group: 'catalog', icon: <Sparkles className="w-3.5 h-3.5 shrink-0 text-purple-500" /> },
        { id: 'approvals_queue', label: `Approvals Queue (${pendingApprovalsCount})`, group: 'catalog', icon: <ShieldCheck className="w-3.5 h-3.5 shrink-0 text-amber-500" /> },
        { id: 'volumetric_calc', label: 'Volumetric Calculator', group: 'catalog', icon: <Layers className="w-3.5 h-3.5 shrink-0 text-blue-500" /> },
        { id: 'categories_mgmt', label: `Categories (${businessCategories.length})`, group: 'catalog', icon: <FolderTree className="w-3.5 h-3.5 shrink-0" /> },
        { id: 'inventory', label: 'Inventory & Stock', group: 'logistics', icon: <Layers className="w-3.5 h-3.5 shrink-0" /> },
        { id: 'stock_transfers', label: `Stock Transfers (${stockTransfers.length})`, group: 'logistics', icon: <ArrowLeftRight className="w-3.5 h-3.5 shrink-0" /> },
        { id: 'barcodes', label: `Barcodes & GTIN (${barcodeRecords.length})`, group: 'logistics', icon: <Scan className="w-3.5 h-3.5 shrink-0" /> },
        { id: 'express_delivery', label: 'Express Delivery (Shiprocket)', group: 'logistics', icon: <Truck className="w-3.5 h-3.5 shrink-0 text-indigo-500" /> },
        { id: 'delivery', label: 'Local Delivery Pincodes', group: 'logistics', icon: <MapPin className="w-3.5 h-3.5 shrink-0" /> },
        { id: 'outlets', label: `Outlets & Branches (${outlets.length})`, group: 'logistics', icon: <Building2 className="w-3.5 h-3.5 shrink-0" /> },
        { id: 'payouts', label: 'Payouts & Ledger', group: 'finance', icon: <CreditCard className="w-3.5 h-3.5 shrink-0" /> },
        { id: 'gst_taxation', label: 'GST & Taxations', group: 'finance', icon: <Receipt className="w-3.5 h-3.5 shrink-0" /> },
        { id: 'bulk_discounts', label: 'Bulk Discounts', group: 'finance', icon: <Percent className="w-3.5 h-3.5 shrink-0" /> },
        { id: 'payment_gateways', label: 'Payment Gateways', group: 'finance', icon: <CreditCard className="w-3.5 h-3.5 shrink-0" /> },
        { id: 'franchise', label: `Franchise Contracts (${franchiseAgreements.length})`, group: 'finance', icon: <FileText className="w-3.5 h-3.5 shrink-0" /> },
        { id: 'ownership_models', label: 'Ownership Models', group: 'finance', icon: <Briefcase className="w-3.5 h-3.5 shrink-0" /> },
        { id: 'campaigns', label: 'Festive Campaigns', group: 'settings', icon: <Sparkles className="w-3.5 h-3.5 shrink-0" /> },
        { id: 'homepage_builder', label: 'Homepage Builder', group: 'settings', icon: <LayoutTemplate className="w-3.5 h-3.5 shrink-0" /> },
        { id: 'store_logins', label: `Staff Logins (${accounts.length})`, group: 'settings', icon: <KeyRound className="w-3.5 h-3.5 shrink-0" /> },
        { id: 'authenticator_qr', label: 'Google Authenticator QR', group: 'settings', icon: <QrCode className="w-3.5 h-3.5 shrink-0 text-emerald-500" /> },
        { id: 'branding', label: 'Branding & Theme', group: 'settings', icon: <Palette className="w-3.5 h-3.5 shrink-0" /> },
        { id: 'settings', label: 'Store Settings', group: 'settings', icon: <Settings className="w-3.5 h-3.5 shrink-0" /> },
      ]
    : [
        { id: 'overview', label: 'Store Overview', group: 'operations', icon: <BarChart3 className="w-3.5 h-3.5 shrink-0" /> },
        { id: 'pos', label: 'POS Register', group: 'operations', icon: <Scan className="w-3.5 h-3.5 shrink-0 text-emerald-500" /> },
        { id: 'orders', label: `Store Orders (${scopedOrders.length})`, group: 'operations', icon: <Package className="w-3.5 h-3.5 shrink-0" /> },
        { id: 'sop_sla', label: 'Store SOP & SLA', group: 'operations', icon: <Activity className="w-3.5 h-3.5 shrink-0 text-amber-500" /> },
        { id: 'products', label: `Store Catalogue (${products.length})`, group: 'catalog', icon: <Tag className="w-3.5 h-3.5 shrink-0" /> },
        { id: 'ai_assistant', label: 'AI Product Assistant & Add', group: 'catalog', icon: <Sparkles className="w-3.5 h-3.5 shrink-0 text-purple-500" /> },
        { id: 'volumetric_calc', label: 'Volumetric Calculator', group: 'catalog', icon: <Layers className="w-3.5 h-3.5 shrink-0 text-blue-500" /> },
        { id: 'inventory', label: 'Store Inventory & Stock', group: 'logistics', icon: <Layers className="w-3.5 h-3.5 shrink-0" /> },
        { id: 'stock_transfers', label: `Stock Transfers (${scopedStockTransfers.length})`, group: 'logistics', icon: <ArrowLeftRight className="w-3.5 h-3.5 shrink-0" /> },
        { id: 'barcodes', label: `Store Barcodes (${scopedBarcodes.length})`, group: 'logistics', icon: <Scan className="w-3.5 h-3.5 shrink-0" /> },
        { id: 'express_delivery', label: 'Express Delivery (Shiprocket)', group: 'logistics', icon: <Truck className="w-3.5 h-3.5 shrink-0 text-indigo-500" /> },
        { id: 'delivery', label: 'Store Delivery Pincodes', group: 'logistics', icon: <MapPin className="w-3.5 h-3.5 shrink-0" /> },
        { id: 'my_store', label: 'My Store Details', group: 'settings', icon: <Store className="w-3.5 h-3.5 shrink-0" /> },
        { id: 'authenticator_qr', label: 'Google Authenticator QR', group: 'settings', icon: <QrCode className="w-3.5 h-3.5 shrink-0 text-emerald-500" /> },
      ];

  const searchNormalized = dashboardSearch.trim().toLowerCase();

  const visibleMenuTabs = allMenuTabs.filter((tab) => {
    if (menuGroupFilter !== 'all' && tab.group !== menuGroupFilter) return false;
    if (searchNormalized) {
      return tab.label.toLowerCase().includes(searchNormalized) || tab.id.toLowerCase().includes(searchNormalized);
    }
    return true;
  });

  // If user typed a product or order query that doesn't match a tab name, still show all tabs in current group
  const displayedMenuTabs = visibleMenuTabs.length > 0 ? visibleMenuTabs : allMenuTabs.filter((tab) => menuGroupFilter === 'all' || tab.group === menuGroupFilter);

  const quickSearchMatchingProducts = searchNormalized
    ? products
        .filter(
          (p) =>
            p.name.toLowerCase().includes(searchNormalized) ||
            p.sku.toLowerCase().includes(searchNormalized) ||
            p.brand.toLowerCase().includes(searchNormalized) ||
            (p.modelNumber && p.modelNumber.toLowerCase().includes(searchNormalized))
        )
        .slice(0, 4)
    : [];

  const quickSearchMatchingOrders = searchNormalized
    ? scopedOrders
        .filter(
          (o) =>
            o.id.toLowerCase().includes(searchNormalized) ||
            o.customer.name.toLowerCase().includes(searchNormalized) ||
            o.customer.phone.includes(searchNormalized)
        )
        .slice(0, 4)
    : [];

  const categorySummaries = useMemo(
    () => [
      {
        id: 'operations' as const,
        label: 'Operations & POS',
        summary: 'Overview · POS · Orders · SLA',
        icon: <Scan className="w-4 h-4 text-emerald-600 shrink-0" />,
        activeBg: 'bg-linear-to-br from-emerald-50/90 via-white to-teal-50/60 border-emerald-300 ring-1 ring-emerald-200/70',
        badgeColor: 'text-emerald-700',
      },
      {
        id: 'catalog' as const,
        label: 'Products & AI Studio',
        summary: isSuperAdmin
          ? 'Catalogue · AI Assist · Approvals · Volumetric'
          : 'Catalogue · AI Assist · Volumetric Calc',
        icon: <Sparkles className="w-4 h-4 text-indigo-600 shrink-0" />,
        activeBg: 'bg-linear-to-br from-indigo-50/90 via-white to-violet-50/60 border-indigo-300 ring-1 ring-indigo-200/70',
        badgeColor: 'text-indigo-700',
      },
      {
        id: 'logistics' as const,
        label: 'Stock & Logistics',
        summary: 'Inventory · Transfers · Barcodes · Shiprocket',
        icon: <Truck className="w-4 h-4 text-sky-600 shrink-0" />,
        activeBg: 'bg-linear-to-br from-sky-50/90 via-white to-blue-50/60 border-sky-300 ring-1 ring-sky-200/70',
        badgeColor: 'text-sky-700',
      },
      ...(isSuperAdmin
        ? [
            {
              id: 'finance' as const,
              label: 'Finance & Tax',
              summary: 'Payouts · GST · Discounts · Gateways',
              icon: <Receipt className="w-4 h-4 text-amber-600 shrink-0" />,
              activeBg: 'bg-linear-to-br from-amber-50/90 via-white to-orange-50/60 border-amber-300 ring-1 ring-amber-200/70',
              badgeColor: 'text-amber-700',
            },
          ]
        : []),
      {
        id: 'settings' as const,
        label: isSuperAdmin ? 'Storefront & Security' : 'Store & Security',
        summary: isSuperAdmin
          ? 'Campaigns · CMS · Logins · 2FA QR · Settings'
          : 'My Store Details · 2FA Authenticator QR',
        icon: <Settings className="w-4 h-4 text-slate-700 shrink-0" />,
        activeBg: 'bg-linear-to-br from-slate-100/90 via-white to-blue-50/50 border-slate-300 ring-1 ring-slate-200/80',
        badgeColor: 'text-slate-700',
      },
    ],
    [isSuperAdmin]
  );

  // Sync active category group when activeTab changes programmatically
  useEffect(() => {
    const found = allMenuTabs.find((t) => t.id === activeTab);
    if (found && menuGroupFilter !== 'all' && found.group !== menuGroupFilter) {
      setMenuGroupFilter(found.group as any);
    }
  }, [activeTab]);

  return (
    <div className="max-w-7xl mx-auto px-2.5 sm:px-4 py-3 sm:py-5 no-print w-full max-w-full min-w-0 box-border">
      {/* Lightweight Premium Category-Wise Tab Navigation & Search Panel */}
      <div className="bg-linear-to-br from-slate-50/90 via-white to-indigo-50/35 backdrop-blur-md rounded-2xl border border-slate-200/80 shadow-xs p-3.5 sm:p-5 mb-4 sm:mb-6 space-y-3.5 w-full max-w-full min-w-0 box-border">
        {/* Row 1: Search Bar + Active Branch + Category Overview Toggle */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          <div className="relative flex-1 min-w-0">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={dashboardSearch}
              onChange={(e) => {
                setDashboardSearch(e.target.value);
                if (activeTab === 'orders') {
                  setOrderSearch(e.target.value);
                }
              }}
              placeholder={
                isSuperAdmin
                  ? 'Search any menu tab, product, SKU, order ID, customer, or barcode...'
                  : `Search ${myStoreOutlet?.name || 'store'} menus, products, SKUs, or orders...`
              }
              className="w-full pl-9 pr-9 py-2 bg-white/95 border border-slate-200/90 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 shadow-2xs focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all"
            />
            {dashboardSearch && (
              <button
                type="button"
                onClick={() => {
                  setDashboardSearch('');
                  if (activeTab === 'orders') setOrderSearch('');
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {isSuperAdmin ? (
              <button
                type="button"
                onClick={() => {
                  setMenuGroupFilter('logistics');
                  setActiveTab('outlets');
                }}
                className="px-3 py-2 rounded-xl bg-white/90 hover:bg-white text-slate-700 text-xs font-semibold flex items-center gap-1.5 border border-slate-200/90 shadow-2xs transition-all cursor-pointer"
              >
                <Building2 className="w-3.5 h-3.5 text-blue-600" />
                <span>{activeOutlet?.name || 'All Outlets'}</span>
                <span className="text-slate-400">·</span>
                <span className="font-mono text-[11px] text-slate-500">{outlets.length}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setMenuGroupFilter('settings');
                  setActiveTab('my_store');
                }}
                className="px-3 py-2 rounded-xl bg-white/90 hover:bg-white text-slate-700 text-xs font-semibold flex items-center gap-1.5 border border-slate-200/90 shadow-2xs transition-all cursor-pointer"
              >
                <Store className="w-3.5 h-3.5 text-emerald-600" />
                <span>{myStoreOutlet?.name}</span>
                <span className="text-slate-400">·</span>
                <span className="font-mono text-[11px] text-slate-500">{myStoreOutlet?.code}</span>
              </button>
            )}

            <button
              type="button"
              onClick={() =>
                setMenuGroupFilter(menuGroupFilter === 'all' ? 'operations' : 'all')
              }
              className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer shadow-2xs ${
                menuGroupFilter === 'all'
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white/90 hover:bg-white text-slate-700 border-slate-200/90'
              }`}
            >
              {menuGroupFilter === 'all' ? 'Compact View' : `All Categories (${allMenuTabs.length})`}
            </button>
          </div>
        </div>

        {/* Instant Search Results Strip (when typing in Search Bar) */}
        {searchNormalized && (quickSearchMatchingProducts.length > 0 || quickSearchMatchingOrders.length > 0) && (
          <div className="p-2.5 bg-white/90 rounded-xl border border-slate-200/80 space-y-2 text-xs shadow-2xs">
            {quickSearchMatchingProducts.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="font-semibold text-slate-500 text-[11px] mr-1">
                  Matching Products:
                </span>
                {quickSearchMatchingProducts.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      setMenuGroupFilter('catalog');
                      setActiveTab('products');
                    }}
                    className="px-2.5 py-1 bg-slate-50/90 hover:bg-blue-50/80 text-slate-800 border border-slate-200/80 rounded-lg font-medium flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <span className="truncate max-w-[180px]">{p.name}</span>
                    <span className="text-slate-300">·</span>
                    <span className="font-mono text-blue-600 font-semibold">{formatINR(p.dealPrice || p.regularPrice)}</span>
                  </button>
                ))}
              </div>
            )}
            {quickSearchMatchingOrders.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="font-semibold text-slate-500 text-[11px] mr-1">
                  Matching Orders:
                </span>
                {quickSearchMatchingOrders.map((o) => (
                  <button
                    key={o.id}
                    type="button"
                    onClick={() => {
                      setOrderSearch(o.id);
                      setMenuGroupFilter('operations');
                      setActiveTab('orders');
                    }}
                    className="px-2.5 py-1 bg-slate-50/90 hover:bg-emerald-50/80 text-slate-800 border border-slate-200/80 rounded-lg font-medium flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <span className="font-mono font-semibold text-slate-900">{o.id}</span>
                    <span className="text-slate-300">·</span>
                    <span className="text-slate-500">{o.customer.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Row 2: Category-Wise Summary Buttons (Lightweight Premium Cards) */}
        <div
          className={`grid grid-cols-2 sm:grid-cols-3 ${
            isSuperAdmin ? 'lg:grid-cols-5' : 'lg:grid-cols-4'
          } gap-2`}
        >
          {categorySummaries.map((cat) => {
            const catTabs = allMenuTabs.filter((t) => t.group === cat.id);
            const isCatSelected = menuGroupFilter === cat.id;
            const hasActiveTabInside = catTabs.some((t) => t.id === activeTab);

            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  setMenuGroupFilter(cat.id);
                  if (!catTabs.some((t) => t.id === activeTab) && catTabs[0]) {
                    setActiveTab(catTabs[0].id as any);
                  }
                }}
                className={`group text-left p-2.5 sm:p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between gap-1.5 ${
                  isCatSelected
                    ? `${cat.activeBg} shadow-xs`
                    : hasActiveTabInside
                    ? 'bg-white/95 border-blue-200/90 shadow-2xs hover:bg-white'
                    : 'bg-white/75 hover:bg-white border-slate-200/75 shadow-2xs'
                }`}
              >
                <div className="flex items-center justify-between gap-1.5 w-full">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-7 h-7 rounded-lg bg-white border border-slate-200/80 shadow-2xs flex items-center justify-center shrink-0">
                      {cat.icon}
                    </span>
                    <span className="text-xs font-bold text-slate-900 truncate">
                      {cat.label}
                    </span>
                  </div>
                  <span className={`text-[10px] font-mono font-semibold shrink-0 ${cat.badgeColor}`}>
                    {catTabs.length}
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 truncate w-full pl-0.5">
                  {cat.summary}
                </p>
              </button>
            );
          })}
        </div>

        {/* Row 3: Category-Scoped Sub-Tabs (or Grouped Category Cards when 'all' or searching) */}
        {menuGroupFilter === 'all' || searchNormalized ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-1">
            {categorySummaries.map((cat) => {
              const catTabs = allMenuTabs.filter(
                (t) =>
                  t.group === cat.id &&
                  (!searchNormalized ||
                    t.label.toLowerCase().includes(searchNormalized) ||
                    t.id.toLowerCase().includes(searchNormalized))
              );
              if (catTabs.length === 0) return null;

              return (
                <div
                  key={cat.id}
                  className="p-3 rounded-xl bg-white/85 border border-slate-200/80 shadow-2xs space-y-2"
                >
                  <div className="flex items-center justify-between text-xs border-b border-slate-100 pb-1.5">
                    <span className="font-bold text-slate-800 flex items-center gap-1.5">
                      {cat.icon}
                      <span>{cat.label}</span>
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {catTabs.length} tabs
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {catTabs.map((tab) => {
                      const isTabActive = activeTab === tab.id;
                      return (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => {
                            setActiveTab(tab.id as any);
                            setMenuGroupFilter(cat.id);
                          }}
                          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer border ${
                            isTabActive
                              ? 'bg-linear-to-r from-blue-600 to-indigo-600 text-white border-blue-600 shadow-xs font-semibold'
                              : 'bg-slate-50/70 hover:bg-white text-slate-700 hover:text-slate-900 border-slate-200/75 shadow-2xs'
                          }`}
                        >
                          {tab.icon}
                          <span>{tab.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-slate-100/70 p-1.5 rounded-xl border border-slate-200/70 flex flex-wrap items-center gap-1.5">
            {displayedMenuTabs.map((tab) => {
              const isTabActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs transition-all cursor-pointer min-h-[36px] border ${
                    isTabActive
                      ? 'bg-white text-blue-700 border-blue-200/90 shadow-xs font-bold ring-1 ring-blue-500/10'
                      : 'bg-white/60 hover:bg-white text-slate-600 hover:text-slate-900 border-transparent hover:border-slate-200/80 font-medium'
                  }`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* TAB 1: OVERVIEW & ANALYTICS */}
      {activeTab === 'overview' && (
        <div className="space-y-4 sm:space-y-6">
          {/* Rider Cash Deposit (8-Digit Code) Verification & Approval Card for Store & Admin */}
          <div className="bg-linear-to-r from-emerald-50/90 via-white to-indigo-50/50 rounded-2xl border border-emerald-200/90 p-4 sm:p-5 shadow-2xs space-y-3">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              <div className="flex items-start sm:items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 font-mono font-black text-xs shadow-xs">
                  8#
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-black text-slate-900">
                      Rider Cash Deposit — Enter 8-Digit Code &amp; Approve Cash Collected
                    </h3>
                    {pendingRiderDeposits.length > 0 && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-900 border border-amber-300">
                        {pendingRiderDeposits.length} Pending Code{pendingRiderDeposits.length > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Riders generate an 8-digit code for any specific amount in the Rider Portal. Enter the 8-digit code below to verify and approve cash collected.
                  </p>
                </div>
              </div>

              <form
                onSubmit={(e) => handleApproveRiderDepositByCode(e)}
                className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0"
              >
                <input
                  type="text"
                  value={riderDepositCodeInput}
                  onChange={(e) => setRiderDepositCodeInput(e.target.value)}
                  placeholder="Enter 8-digit code (e.g. 83921056)"
                  className="w-full sm:w-56 px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono font-black text-slate-900 tracking-wider focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold rounded-xl shadow-xs flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Approve Cash Collected</span>
                </button>
              </form>
            </div>

            {riderDepositFeedback && (
              <div
                className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-between ${
                  riderDepositFeedback.type === 'success'
                    ? 'bg-emerald-100/90 border-emerald-300 text-emerald-950'
                    : 'bg-rose-50 border-rose-200 text-rose-900'
                }`}
              >
                <span>{riderDepositFeedback.message}</span>
                <button
                  type="button"
                  onClick={() => setRiderDepositFeedback(null)}
                  className="text-slate-500 hover:text-slate-900 ml-2 cursor-pointer"
                >
                  ✕
                </button>
              </div>
            )}

            {/* Quick Pending 8-Digit Codes Pills */}
            {pendingRiderDeposits.length > 0 && (
              <div className="pt-2 border-t border-emerald-200/60 flex items-center gap-2 flex-wrap text-xs">
                <span className="text-[11px] font-bold text-slate-500">
                  Active Pending Rider Codes:
                </span>
                {pendingRiderDeposits.map((sub) => (
                  <div
                    key={sub.id}
                    className="inline-flex items-center gap-2 bg-white px-2.5 py-1 rounded-xl border border-slate-200/90 shadow-2xs"
                  >
                    <span className="font-bold text-slate-800">{sub.riderName}:</span>
                    <span className="font-mono font-black text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200">
                      {sub.remittanceCode}
                    </span>
                    <span className="font-mono font-extrabold text-emerald-700">
                      {formatINR(sub.amount)}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        setRiderDepositCodeInput(sub.remittanceCode);
                        handleApproveRiderDepositByCode(e, sub.remittanceCode);
                      }}
                      className="px-2 py-0.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[10px] font-bold cursor-pointer"
                    >
                      Approve
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Top KPI Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Gross Sales (All Orders)
              </span>
              <div className="text-xl md:text-2xl font-extrabold text-slate-900 font-mono mt-1">
                {formatINR(metrics.totalRevenue)}
              </div>
              <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-0.5 mt-1">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>{metrics.totalOrdersCount} orders placed</span>
              </span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Collected Payments
              </span>
              <div className="text-xl md:text-2xl font-extrabold text-emerald-700 font-mono mt-1">
                {formatINR(metrics.cashCollected)}
              </div>
              <span className="text-[11px] text-slate-500 mt-1 block">
                Pending: {formatINR(metrics.totalRevenue - metrics.cashCollected)}
              </span>
            </div>

            {/* Super Admin Financial Visibility */}
            {isSuperAdmin && (
              <>
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Estimated Gross Profit
                  </span>
                  <div className="text-xl md:text-2xl font-extrabold text-purple-700 font-mono mt-1">
                    {formatINR(metrics.grossProfit)}
                  </div>
                  <span className="text-[11px] text-slate-500 mt-1 block font-mono">
                    COGS: {formatINR(metrics.cogs)}
                  </span>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Stock Valuation
                  </span>
                  <div className="text-xl md:text-2xl font-extrabold text-blue-700 font-mono mt-1">
                    {formatINR(metrics.valuationAtSelling)}
                  </div>
                  <span className="text-[11px] text-slate-500 mt-1 block font-mono">
                    Cost Basis: {formatINR(metrics.valuationAtCost)}
                  </span>
                </div>
              </>
            )}
          </div>

          {/* Operational Queue Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-amber-900 uppercase">
                  Awaiting Confirmation
                </span>
                <div className="text-2xl font-black text-amber-900 mt-1 font-mono">
                  {metrics.pendingConfirmationsCount}
                </div>
                <span className="text-[11px] text-amber-700">WhatsApp and pending checks</span>
              </div>
              <Clock className="w-8 h-8 text-amber-600" />
            </div>

            <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-blue-900 uppercase">
                  Packing & Staging Queue
                </span>
                <div className="text-2xl font-black text-blue-900 mt-1 font-mono">
                  {metrics.packingQueueCount}
                </div>
                <span className="text-[11px] text-blue-700">Ready to pack & dispatch</span>
              </div>
              <Package className="w-8 h-8 text-blue-600" />
            </div>

            <div className="p-4 bg-purple-50 border border-purple-200 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-purple-900 uppercase">
                  Active Courier Dispatches
                </span>
                <div className="text-2xl font-black text-purple-900 mt-1 font-mono">
                  {metrics.outForDeliveryCount}
                </div>
                <span className="text-[11px] text-purple-700">Out for delivery in Lucknow</span>
              </div>
              <Truck className="w-8 h-8 text-purple-600" />
            </div>
          </div>

          {/* Low Stock Alerts Box */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  Critical Inventory & Low-Stock Alerts
                </h3>
              </div>
              <span className="text-xs text-slate-500">
                {metrics.lowStockCount} items low • {metrics.outOfStockCount} out of stock
              </span>
            </div>

            <div className="divide-y divide-slate-100 text-xs">
              {products
                .filter((p) => p.stock.onHand - p.stock.reserved <= p.stock.minStockLevel)
                .map((p) => {
                  const net = p.stock.onHand - p.stock.reserved;
                  return (
                    <div key={p.id} className="py-2.5 flex items-center justify-between">
                      <div>
                        <span className="font-semibold text-slate-900">{p.name}</span>
                        <span className="text-[11px] text-slate-400 block font-mono">
                          SKU: {p.sku} | Brand: {p.brand}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span
                          className={`font-mono font-bold px-2 py-0.5 rounded text-[11px] ${
                            net <= 0
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {net <= 0 ? 'OUT OF STOCK' : `Only ${net} Left`}
                        </span>
                        <button
                          onClick={() => handleOpenAdjustStock(p)}
                          className="px-2.5 py-1 text-xs bg-slate-100 hover:bg-slate-200 rounded font-semibold text-slate-800 cursor-pointer"
                        >
                          Restock
                        </button>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ORDERS MANAGEMENT */}
      {activeTab === 'orders' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
          {/* Filter Bar */}
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={orderSearch}
                onChange={(e) => setOrderSearch(e.target.value)}
                placeholder="Search orders by ID, customer name, mobile..."
                className="w-full text-xs px-3 py-1.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-600"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-slate-500">Status:</span>
              <select
                value={orderStatusFilter}
                onChange={(e) => setOrderStatusFilter(e.target.value)}
                className="text-xs px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-600 cursor-pointer"
              >
                <option value="all">All Statuses ({scopedOrders.length})</option>
                <option value="awaiting_whatsapp_confirmation">Awaiting WhatsApp</option>
                <option value="confirmed">Confirmed</option>
                <option value="packed">Packed</option>
                <option value="assigned_to_delivery">Assigned to Rider</option>
                <option value="out_for_delivery">Out for Delivery</option>
                <option value="delivered">Delivered</option>
                <option value="partially_cancelled">Partially Cancelled (Shortage/Damage)</option>
                <option value="cancelled">Cancelled</option>
              </select>

              <button
                type="button"
                onClick={handleExportOrdersCsv}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export CSV</span>
              </button>
            </div>
          </div>

          {/* Orders Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-600 font-bold uppercase text-[10px] border-b border-slate-200">
                  <th className="py-3 px-3">Order ID</th>
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3">Customer</th>
                  <th className="py-3 px-3">Items & Fulfillment</th>
                  <th className="py-3 px-3">Total & Refund</th>
                  <th className="py-3 px-3">Payment</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-3 font-mono font-bold text-slate-900">{order.id}</td>
                    <td className="py-3 px-3 text-slate-500">
                      {new Date(order.createdAt).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-semibold text-slate-900 block">{order.customer.name}</span>
                      <span className="text-[11px] text-slate-500">{order.customer.phone}</span>
                      <span className="text-[10px] text-slate-400 block">{order.customer.area}</span>
                    </td>
                    <td className="py-3 px-3 max-w-xs">
                      <div className="space-y-1">
                        {order.items.map((i, idx) => {
                          const active = i.activeQuantity !== undefined ? i.activeQuantity : i.quantity;
                          const hasCancelled = (i.cancelledQuantity || 0) > 0;
                          return (
                            <div key={idx} className="flex items-center gap-1.5 flex-wrap text-xs">
                              <span
                                className={`font-medium ${
                                  active === 0 ? 'line-through text-slate-400' : 'text-slate-800'
                                }`}
                              >
                                {i.productName} ({active > 0 ? `x${active}` : '0 active'})
                              </span>
                              {hasCancelled && (
                                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-rose-100 text-rose-800 border border-rose-200">
                                  -{i.cancelledQuantity} {i.cancellationReason ? `(${i.cancellationReason.replace('_', ' ')})` : 'cancelled'}
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-mono font-bold text-slate-900 block">
                        {formatINR(order.finalTotal)}
                      </span>
                      {order.originalTotal && order.originalTotal !== order.finalTotal && (
                        <span className="text-[10px] text-slate-400 line-through font-mono block">
                          Orig: {formatINR(order.originalTotal)}
                        </span>
                      )}
                      {order.refundedAmount && order.refundedAmount > 0 && (
                        <span className="text-[10px] text-rose-700 font-bold bg-rose-50 px-1.5 py-0.2 rounded border border-rose-200 inline-block mt-0.5">
                          Refund: {formatINR(order.refundedAmount)}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      <span className="uppercase text-[10px] font-semibold block text-slate-700">
                        {order.paymentMethod.replace(/_/g, ' ')}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.2 rounded inline-block ${
                          order.paymentStatus === 'verified_paid'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {order.paymentStatus === 'verified_paid' ? 'PAID' : 'PENDING'}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`text-[11px] font-bold px-2 py-0.5 rounded uppercase ${
                          order.orderStatus === 'delivered'
                            ? 'bg-emerald-100 text-emerald-800'
                            : order.orderStatus === 'cancelled'
                            ? 'bg-rose-100 text-rose-800'
                            : order.orderStatus === 'partially_cancelled'
                            ? 'bg-amber-100 text-amber-900 border border-amber-300'
                            : order.orderStatus === 'awaiting_whatsapp_confirmation'
                            ? 'bg-amber-100 text-amber-800'
                            : order.orderStatus === 'out_for_delivery'
                            ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {order.orderStatus.replace(/_/g, ' ')}
                      </span>

                      {/* Express Courier / Shiprocket or In-House Rider Badge & AWB */}
                      {order.dispatchDetails ? (
                        <div className="mt-1 space-y-1 text-[10px]">
                          {order.dispatchDetails.fulfillmentType === 'express_partner' ? (
                            <div className="bg-indigo-50/80 border border-indigo-200 text-indigo-900 rounded-md p-1.5 shadow-2xs">
                              <div className="font-bold flex items-center justify-between text-[10px]">
                                <span className="flex items-center gap-1">
                                  <Truck className="w-3 h-3 text-indigo-600" />
                                  {order.dispatchDetails.carrier} Express
                                </span>
                                {order.dispatchDetails.trackingUrl && (
                                  <a
                                    href={order.dispatchDetails.trackingUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-indigo-600 hover:text-indigo-800 flex items-center gap-0.5 font-semibold text-[9px]"
                                    title="Open Live Courier Tracking"
                                  >
                                    Track <ExternalLink className="w-2.5 h-2.5" />
                                  </a>
                                )}
                              </div>
                              <div className="font-mono text-[9px] text-slate-700 mt-0.5">
                                AWB: <span className="font-bold text-slate-900">{order.dispatchDetails.awbNumber}</span>
                              </div>
                            </div>
                          ) : (
                            <div className="bg-emerald-50/80 border border-emerald-200 text-emerald-900 rounded-md p-1.5 shadow-2xs">
                              <div className="font-bold flex items-center justify-between text-[10px]">
                                <span className="flex items-center gap-1">
                                  <Truck className="w-3 h-3 text-emerald-600" />
                                  Rider: {order.dispatchDetails.riderName}
                                </span>
                                {order.dispatchDetails.riderOtp && (
                                  <span className="font-mono font-bold text-amber-800 bg-amber-100 px-1 py-0.2 rounded text-[9px]">
                                    OTP: {order.dispatchDetails.riderOtp}
                                  </span>
                                )}
                              </div>
                              <div className="text-[9px] text-slate-600 mt-0.5">
                                Phone: {order.dispatchDetails.riderPhone}
                              </div>
                            </div>
                          )}

                          {order.dispatchDetails.isCod && (
                            <div className={`text-[9px] font-bold px-1.5 py-0.5 rounded flex items-center justify-between ${
                              order.dispatchDetails.codCollectedStatus === 'settled_to_admin'
                                ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                                : order.dispatchDetails.codCollectedStatus === 'remitted'
                                ? 'bg-blue-100 text-blue-900 border border-blue-300'
                                : order.dispatchDetails.codCollectedStatus === 'collected'
                                ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                : 'bg-slate-100 text-slate-700 border border-slate-300'
                            }`}>
                              <span>COD: {formatINR(order.dispatchDetails.codAmountToCollect || order.finalTotal)}</span>
                              <span>
                                {order.dispatchDetails.codCollectedStatus === 'settled_to_admin'
                                  ? '✓ Bank Settled'
                                  : order.dispatchDetails.codCollectedStatus === 'remitted'
                                  ? '✓ Remitted to Store'
                                  : order.dispatchDetails.codCollectedStatus === 'collected'
                                  ? '✓ In Rider Hand'
                                  : '⏳ Pending Doorstep'}
                              </span>
                            </div>
                          )}
                        </div>
                      ) : order.deliveryStaffName ? (
                        <span className="text-[10px] text-slate-500 block mt-0.5">
                          Rider: {order.deliveryStaffName}
                        </span>
                      ) : null}

                      {order.cancellationDetails && (
                        <span className="text-[10px] text-rose-700 font-semibold block mt-0.5">
                          {order.cancellationDetails.primaryReason.replace('_', ' ')}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5 flex-wrap">
                        {/* Quick state transitions */}
                        {order.orderStatus === 'awaiting_whatsapp_confirmation' && (
                          <button
                            onClick={() =>
                              updateOrderStatus(
                                order.id,
                                'confirmed',
                                'WhatsApp inquiry confirmed by store manager',
                                'Store Manager'
                              )
                            }
                            className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-bold text-[11px] cursor-pointer"
                          >
                            Confirm Order
                          </button>
                        )}

                        {order.orderStatus === 'confirmed' && (
                          <button
                            onClick={() =>
                              updateOrderStatus(
                                order.id,
                                'packed',
                                'Invoice printed & item packed in warehouse',
                                'Store Manager'
                              )
                            }
                            className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded font-bold text-[11px] cursor-pointer"
                          >
                            Mark Packed
                          </button>
                        )}

                        {/* Dispatch Button: Rider vs Shiprocket Express Partner */}
                        {(order.orderStatus === 'packed' || order.orderStatus === 'confirmed') && (
                          <button
                            onClick={() => setDispatchingOrder(order)}
                            className="px-2.5 py-1 bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded font-bold text-[11px] cursor-pointer flex items-center gap-1 shadow-xs"
                            title="Choose Option 1 (In-House Rider) or Option 2 (Express Shiprocket Delivery with AWB)"
                          >
                            <Truck className="w-3.5 h-3.5" />
                            <span>Dispatch (Rider / Shiprocket)</span>
                          </button>
                        )}

                        {/* Out for delivery actions */}
                        {order.orderStatus === 'out_for_delivery' && (
                          <>
                            {/* Courier/AWB details button */}
                            <button
                              onClick={() => setDispatchingOrder(order)}
                              className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded font-semibold text-[10px] cursor-pointer flex items-center gap-1"
                              title="Update Courier / AWB tracking info"
                            >
                              <Truck className="w-3 h-3 text-blue-600" />
                              <span>AWB / Rider</span>
                            </button>

                            {/* Collect COD Button for Doorstep Cash/UPI */}
                            {(order.paymentMethod === 'cod' || order.dispatchDetails?.isCod) &&
                              order.paymentStatus !== 'verified_paid' && (
                                <button
                                  onClick={() => setCollectingCodOrder(order)}
                                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-bold text-[11px] cursor-pointer flex items-center gap-1 shadow-xs"
                                  title="Record Cash on Delivery collection by rider or courier partner"
                                >
                                  <Banknote className="w-3.5 h-3.5" />
                                  <span>Collect COD</span>
                                </button>
                              )}

                            {/* Mark Delivered if not COD or COD already received */}
                            {order.paymentStatus === 'verified_paid' && (
                              <button
                                onClick={() =>
                                  updateOrderStatus(
                                    order.id,
                                    'delivered',
                                    'Order successfully handed over and completed',
                                    'Delivery System'
                                  )
                                }
                                className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-bold text-[10px] cursor-pointer"
                              >
                                Mark Delivered
                              </button>
                            )}
                          </>
                        )}

                        {/* Store Full / Partial Item & Quantity Cancellation (Shortage/Damage/Expiry) */}
                        {order.orderStatus !== 'cancelled' && order.orderStatus !== 'delivered' && (
                          <button
                            onClick={() => setCancellingOrder(order)}
                            className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded font-bold text-[10px] cursor-pointer flex items-center gap-1 shadow-2xs transition-colors"
                            title="Cancel whole order or specific SKU/quantity (Shortage, Damage, or Expiry)"
                          >
                            <PackageX className="w-3.5 h-3.5 text-rose-600" />
                            <span>Cancel / Short</span>
                          </button>
                        )}

                        {order.paymentStatus !== 'verified_paid' &&
                          order.paymentMethod !== 'cod' &&
                          !order.dispatchDetails?.isCod && (
                            <button
                              onClick={() => verifyOrderPayment(order.id)}
                              className="px-2 py-1 bg-slate-800 hover:bg-slate-900 text-white rounded font-bold text-[10px] cursor-pointer"
                              title="Verify Payment"
                            >
                              Mark Paid
                            </button>
                          )}

                        {/* Print Invoice */}
                        <button
                          onClick={() => {
                            setSelectedOrderForModal(order);
                            setActiveModal('invoice');
                          }}
                          className="p-1 text-slate-500 hover:text-slate-900 rounded cursor-pointer"
                          title="Print Invoice"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: INVENTORY & STOCK MOVEMENTS */}
      {activeTab === 'inventory' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Real-Time Inventory & Reservation Matrix
                </h3>
                <p className="text-xs text-slate-500">
                  Available Stock = On-Hand Stock − Reserved Stock (Oversell Protection)
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-600 font-bold uppercase text-[10px] border-b border-slate-200">
                    <th className="py-2.5 px-3">Product Name</th>
                    <th className="py-2.5 px-3">SKU</th>
                    <th className="py-2.5 px-3 text-center">On-Hand</th>
                    <th className="py-2.5 px-3 text-center">Reserved</th>
                    <th className="py-2.5 px-3 text-center">Available</th>
                    <th className="py-2.5 px-3 text-center">Min Level</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {products.map((p) => {
                    const available = p.stock.onHand - p.stock.reserved;
                    const isLow = available <= p.stock.minStockLevel;

                    return (
                      <tr key={p.id} className="hover:bg-slate-50">
                        <td className="py-3 px-3">
                          <span className="font-semibold text-slate-900">{p.name}</span>
                          <span className="text-[10px] text-slate-400 block">{p.brand}</span>
                        </td>
                        <td className="py-3 px-3 font-mono text-slate-600">{p.sku}</td>
                        <td className="py-3 px-3 text-center font-mono font-semibold">{p.stock.onHand}</td>
                        <td className="py-3 px-3 text-center font-mono text-amber-600 font-semibold">
                          {p.stock.reserved}
                        </td>
                        <td className="py-3 px-3 text-center font-mono">
                          <span
                            className={`px-2 py-0.5 rounded font-bold ${
                              available <= 0
                                ? 'bg-rose-100 text-rose-800'
                                : isLow
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {available}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center font-mono text-slate-500">
                          {p.stock.minStockLevel}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <button
                            onClick={() => handleOpenAdjustStock(p)}
                            className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded text-[11px] font-semibold cursor-pointer"
                          >
                            Adjust Stock
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Stock Movements Audit Trail */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="p-4 border-b border-slate-200 bg-slate-50">
              <h3 className="text-sm font-bold text-slate-900">
                Stock Movements Audit Log (Atomic Ledger)
              </h3>
              <p className="text-xs text-slate-500">
                Tracks every stock receipt, reservation, sale, and adjustment with author details.
              </p>
            </div>

            <div className="max-h-80 overflow-y-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-600 font-bold uppercase text-[10px] border-b border-slate-200 sticky top-0">
                    <th className="py-2.5 px-3">Timestamp</th>
                    <th className="py-2.5 px-3">Product</th>
                    <th className="py-2.5 px-3">Type</th>
                    <th className="py-2.5 px-3 text-center">Qty</th>
                    <th className="py-2.5 px-3 text-center">Before → After</th>
                    <th className="py-2.5 px-3">Reference / Note</th>
                    <th className="py-2.5 px-3">Staff</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {scopedStockMovements.map((sm) => (
                    <tr key={sm.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 text-slate-500 text-[11px] font-mono">
                        {new Date(sm.timestamp).toLocaleTimeString('en-IN', {
                          hour: '2-digit',
                          minute: '2-digit',
                          day: '2-digit',
                          month: 'short',
                        })}
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-slate-900">{sm.productName}</td>
                      <td className="py-2.5 px-3">
                        <span className="uppercase text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-200 text-slate-800">
                          {sm.type.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono font-bold">{sm.quantity}</td>
                      <td className="py-2.5 px-3 text-center font-mono text-slate-600">
                        {sm.previousStock} → {sm.newStock}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 text-[11px]">
                        {sm.note} {sm.referenceId && `(${sm.referenceId})`}
                      </td>
                      <td className="py-2.5 px-3 text-slate-500 text-[11px]">{sm.staffName}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: PRODUCTS & MARGINS */}
      {activeTab === 'products' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900">
                  {isSuperAdmin
                    ? 'Product Catalogue & Multi-Seller Price Comparison'
                    : `${myStoreOutlet?.name || 'Store'} — Product Catalogue & Stock`}
                </h3>
                {pendingApprovalsCount > 0 && isSuperAdmin && (
                  <span className="text-[10px] font-bold bg-amber-500 text-slate-950 px-2 py-0.5 rounded-full">
                    {pendingApprovalsCount} Pending Review
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">
                {isSuperAdmin
                  ? 'Each catalogue item tracks how many stores/sellers offer it, along with their individual selling prices, stock, and margins.'
                  : 'View selling prices, GST slabs, HSN codes, and available stock for your store.'}
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {isSuperAdmin && (
                <button
                  type="button"
                  onClick={() => setShowApprovalsModal(true)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
                    pendingApprovalsCount > 0
                      ? 'bg-amber-100 hover:bg-amber-200 text-amber-900 border-amber-300'
                      : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                  <span>Approvals Queue ({pendingApprovalsCount})</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setShowStandaloneVolumetricModal(true)}
                className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs transition-colors"
                title="Open Volumetric (Dimensional) Weight Calculator for couriers"
              >
                <span>📐 Volumetric Calculator</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setProductForAiEdit(null);
                  setShowAiProductModal(true);
                }}
                className="px-3.5 py-1.5 bg-linear-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>✨ AI Assist Upload</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-600 font-bold uppercase text-[10px] border-b border-slate-200">
                  <th className="py-2.5 px-3">Product</th>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3 font-mono">MRP</th>
                  <th className="py-2.5 px-3 font-mono">Store Selling Price</th>
                  <th className="py-2.5 px-3">Sellers & Store Offers</th>
                  <th className="py-2.5 px-3">Status</th>
                  {isSuperAdmin && <th className="py-2.5 px-3 font-mono">Purchase Cost</th>}
                  {isSuperAdmin && <th className="py-2.5 px-3 font-mono">Gross Margin</th>}
                  <th className="py-2.5 px-3 text-center">Available Stock</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {products.map((p) => {
                  const currentPrice = p.dealPrice || p.regularPrice;
                  const margin = currentPrice - p.purchaseCost;
                  const marginPct = Math.round((margin / currentPrice) * 100);

                  const sellers = p.sellerListings && p.sellerListings.length > 0
                    ? p.sellerListings
                    : [
                        {
                          id: 'sl-default',
                          sellerId: 'out_hazratganj',
                          sellerName: 'Hazratganj Flagship Store',
                          sellingPrice: currentPrice,
                          mrp: p.mrp,
                          purchaseCost: p.purchaseCost,
                          stock: p.stock.onHand,
                          isAvailable: true,
                          deliveryPromiseHours: 4,
                          lastUpdated: '',
                        },
                      ];

                  const sellerPrices = sellers.map((s) => s.sellingPrice);
                  const minSellerPrice = Math.min(...sellerPrices);
                  const maxSellerPrice = Math.max(...sellerPrices);

                  return (
                    <tr key={p.id} className="hover:bg-slate-50">
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <img
                            src={p.images[0] || 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=400&q=80'}
                            alt={p.name}
                            className="w-9 h-9 object-contain rounded-lg bg-slate-100 p-0.5 border border-slate-200 shrink-0"
                          />
                          <div>
                            <span className="font-semibold text-slate-900 block line-clamp-1">{p.name}</span>
                            <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
                              <span>SKU: {p.sku}</span>
                              {p.brand && <span className="font-sans font-bold text-slate-600">({p.brand})</span>}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-slate-600 capitalize">
                        {p.categoryId.replace(/_/g, ' ')}
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-400 line-through">
                        {formatINR(p.mrp)}
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-slate-900">
                        {formatINR(currentPrice)}
                      </td>

                      {/* Multi-Seller Breakdown Cell */}
                      <td className="py-3 px-3">
                        <button
                          type="button"
                          onClick={() => setMultiSellerModalProduct(p)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 font-bold rounded-lg text-[11px] border border-indigo-200/80 cursor-pointer transition-colors shadow-2xs group mb-1.5"
                          title="Click to view all sellers, their individual selling prices and stock"
                        >
                          <Store className="w-3.5 h-3.5 text-indigo-600 group-hover:scale-110 transition-transform" />
                          <span>
                            {sellers.length} {sellers.length === 1 ? 'Seller' : 'Sellers'}
                          </span>
                          <span className="font-mono text-[10px] text-indigo-600 font-semibold">
                            ({sellers.length > 1 ? `${formatINR(minSellerPrice)} - ${formatINR(maxSellerPrice)}` : formatINR(minSellerPrice)})
                          </span>
                        </button>

                        {/* Inline list of each seller name and price */}
                        <div className="space-y-1">
                          {sellers.slice(0, 3).map((s) => (
                            <div key={s.id} className="text-[10px] text-slate-600 flex items-center justify-between gap-1.5 max-w-[210px] bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200/60">
                              <span className="truncate font-medium text-slate-700" title={s.sellerName}>
                                {s.sellerName}
                              </span>
                              <span className="font-mono font-bold text-slate-900 shrink-0">
                                {formatINR(s.sellingPrice)}
                              </span>
                            </div>
                          ))}
                          {sellers.length > 3 && (
                            <button
                              type="button"
                              onClick={() => setMultiSellerModalProduct(p)}
                              className="text-[9px] text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer block text-left"
                            >
                              +{sellers.length - 3} more sellers...
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Approval Status Cell */}
                      <td className="py-3 px-3">
                        {p.approvalStatus === 'pending' ? (
                          <button
                            type="button"
                            onClick={() => setShowApprovalsModal(true)}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300 hover:bg-amber-200 cursor-pointer"
                          >
                            <Clock className="w-3 h-3 text-amber-600" />
                            <span>Pending Review</span>
                          </button>
                        ) : p.approvalStatus === 'rejected' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
                            <span>Rejected</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Approved & Live</span>
                          </span>
                        )}
                      </td>

                      {isSuperAdmin && (
                        <td className="py-3 px-3 font-mono text-slate-600">
                          {formatINR(p.purchaseCost)}
                        </td>
                      )}
                      {isSuperAdmin && (
                        <td className="py-3 px-3 font-mono">
                          <span className="font-bold text-purple-700">
                            {formatINR(margin)}
                          </span>{' '}
                          <span className="text-[10px] text-slate-500">({marginPct}%)</span>
                        </td>
                      )}
                      <td className="py-3 px-3 text-center font-mono font-bold">
                        {p.stock.onHand - p.stock.reserved}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-3 text-right">
                        <div className="inline-flex items-center gap-1.5 justify-end">
                          <button
                            type="button"
                            onClick={() => {
                              setProductForVariantsEdit(p);
                              setShowVariantsModal(true);
                            }}
                            className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-[11px] font-semibold cursor-pointer transition-colors inline-flex items-center gap-1"
                            title="Edit physical dimensions, volumetric weight, color swatches, sizes and hardware modules"
                          >
                            <span>📐 Variants & Dimensions</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setProductForAiEdit(p);
                              setShowAiProductModal(true);
                            }}
                            className="px-2.5 py-1 bg-white hover:bg-slate-100 text-indigo-700 border border-indigo-200 rounded-lg text-[11px] font-semibold cursor-pointer transition-colors inline-flex items-center gap-1"
                            title="Modify and edit this product with AI assistant"
                          >
                            <Sparkles className="w-3 h-3 text-indigo-600" />
                            <span>AI Edit</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: LOCAL DELIVERY & COVERAGE */}
      {activeTab === 'delivery' && (
        <DeliveryZoneManager />
      )}

      {/* TAB 6: FESTIVE CAMPAIGNS (SUPER ADMIN ONLY) */}
      {activeTab === 'campaigns' && isSuperAdmin && <FestivalCampaignManager />}

      {/* TAB 7: SETTINGS (SUPER ADMIN ONLY) */}
      {activeTab === 'settings' && isSuperAdmin && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs max-w-2xl">
          <h3 className="text-base font-bold text-slate-900 mb-1">Store Operational Settings</h3>
          <p className="text-xs text-slate-500 mb-4">
            Configure WhatsApp click-to-chat contact, official GSTIN, and UPI ID for dynamic QR codes.
          </p>

          <div className="space-y-4 text-xs">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                WhatsApp Phone Number (International format without +):
              </label>
              <input
                type="text"
                value={whatsappEdit}
                onChange={(e) => setWhatsappEdit(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
              />
              <span className="text-[11px] text-slate-400">Example: 919839012345</span>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Store Helpline Phone:</label>
              <input
                type="text"
                value={phoneEdit}
                onChange={(e) => setPhoneEdit(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Store UPI ID (for Dynamic Payment QR):
              </label>
              <input
                type="text"
                value={upiEdit}
                onChange={(e) => setUpiEdit(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Free Delivery Cart Threshold (₹):
              </label>
              <input
                type="number"
                value={freeShipEdit}
                onChange={(e) => setFreeShipEdit(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
              />
            </div>

            <div className="pt-2">
              <button
                onClick={handleSaveSettings}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs cursor-pointer flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Save Store Settings</span>
              </button>
              {settingsSavedMsg && (
                <span className="text-emerald-600 text-xs font-semibold ml-3">
                  Settings saved successfully!
                </span>
              )}
            </div>
          </div>

          {/* Admin Google Authenticator (2FA) Security & Registration Card */}
          <div className="mt-8 pt-6 border-t border-slate-200">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-slate-900">Admin Google Authenticator (2FA) Security</h4>
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-emerald-600" />
                    <span>Active & Enforced</span>
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Connect your smartphone with Google Authenticator or Microsoft Authenticator to generate time-based 6-digit verification codes for login.
                </p>
              </div>
              <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-100">
                <QrCode className="w-5 h-5" />
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Target Account:</span>
                <span className="font-mono font-bold text-slate-900">{currentAdminAccount?.email || 'admin@javed-electronics.in'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">OTP Protocol Standard:</span>
                <span className="font-mono text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200">RFC 6238 TOTP (30s Step)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">App Compatibility:</span>
                <span className="text-slate-800 font-medium">Google Authenticator, MS Authenticator, 1Password, Authy</span>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setAuthenticatorTargetAccount(currentAdminAccount);
                  setShowAuthenticatorQrModal(true);
                }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs cursor-pointer flex items-center gap-2 shadow-xs transition-colors"
              >
                <QrCode className="w-4 h-4 text-emerald-300" />
                <span>Open Google Authenticator QR Code</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('store_logins')}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold text-xs cursor-pointer flex items-center gap-1.5 transition-colors border border-slate-200"
              >
                <KeyRound className="w-3.5 h-3.5 text-slate-500" />
                <span>Manage All Staff 2FA Logins</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB: MY STORE PROFILE (STORE MANAGER ONLY - STRICTLY OWN STORE) */}
      {activeTab === 'my_store' && !isSuperAdmin && myStoreOutlet && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <Store className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                    {myStoreOutlet.code}
                  </span>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 uppercase">
                    {myStoreOutlet.status}
                  </span>
                </div>
                <h2 className="text-lg font-extrabold text-slate-900 mt-1">{myStoreOutlet.name}</h2>
                <p className="text-xs text-slate-500">{myStoreOutlet.address}, {myStoreOutlet.city} - {myStoreOutlet.pincode}</p>
              </div>
            </div>
            <button
              onClick={() => setActiveTab('pos')}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer self-start sm:self-center"
            >
              <Scan className="w-4 h-4" />
              <span>Open Counter POS</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="font-bold text-slate-900 uppercase text-[11px] tracking-wider">Store Manager & Contact</div>
              <div className="text-slate-700"><strong>Manager:</strong> {myStoreOutlet.managerName}</div>
              <div className="text-slate-700 flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-blue-600" /> {myStoreOutlet.managerPhone}</div>
              <div className="text-slate-700 flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-blue-600" /> {myStoreOutlet.ownerEmail}</div>
              <div className="text-slate-700"><strong>Active Staff:</strong> {myStoreOutlet.staffCount} members</div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="font-bold text-slate-900 uppercase text-[11px] tracking-wider">Store Timings & Tax Registration</div>
              <div className="text-slate-700"><strong>Hours:</strong> {myStoreOutlet.operatingHours.open} – {myStoreOutlet.operatingHours.close}</div>
              <div className="text-slate-700"><strong>Days Open:</strong> {myStoreOutlet.operatingHours.daysOpen}</div>
              <div className="text-slate-700 font-mono"><strong>GSTIN:</strong> {myStoreOutlet.gstin}</div>
              <div className="text-slate-700"><strong>Delivery Radius:</strong> {myStoreOutlet.deliveryRadiusKm} km</div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="font-bold text-slate-900 uppercase text-[11px] tracking-wider">Serviceable Pincodes ({myStoreOutlet.serviceablePincodes.length})</div>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {myStoreOutlet.serviceablePincodes.map((pin) => (
                  <span key={pin} className="px-2 py-1 rounded bg-white border border-slate-200 font-mono font-bold text-slate-800 text-[11px]">
                    {pin}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB: OUTLETS & MULTI-BRANCH MANAGEMENT (SUPER ADMIN ONLY) */}
      {activeTab === 'outlets' && isSuperAdmin && <OutletsManager />}

      {/* TAB: INTER-OUTLET STOCK TRANSFERS */}
      {activeTab === 'stock_transfers' && <StockTransfersManager />}

      {/* TAB: BARCODES & GTIN LOOKUP */}
      {activeTab === 'barcodes' && <BarcodeCatalogManager />}

      {/* TAB: BUSINESS CATEGORY APPROVALS (SUPER ADMIN) */}
      {activeTab === 'categories_mgmt' && isSuperAdmin && <CategoryApprovalManager />}

      {/* TAB: PAYOUTS & FINANCIAL SUBLEDGER (SUPER ADMIN) */}
      {activeTab === 'payouts' && isSuperAdmin && <PayoutsLedgerManager />}

      {/* TAB: FRANCHISE CONTRACTS & COMPLIANCE (SUPER ADMIN) */}
      {activeTab === 'franchise' && isSuperAdmin && <FranchiseAgreementsManager />}

      {/* TAB: OWNERSHIP MODELS (SUPER ADMIN) */}
      {activeTab === 'ownership_models' && isSuperAdmin && <OwnershipModelsManager />}

      {/* TAB: GST & TAXATION COMPLIANCE (SUPER ADMIN) */}
      {activeTab === 'gst_taxation' && isSuperAdmin && <GstTaxationManager />}

      {/* TAB: BULK ORDER DISCOUNTS & RULES ENGINE (SUPER ADMIN) */}
      {activeTab === 'bulk_discounts' && isSuperAdmin && <BulkDiscountManager />}

      {/* TAB: STORE & STAFF LOGINS MANAGER (SUPER ADMIN) */}
      {activeTab === 'store_logins' && isSuperAdmin && <StoreStaffAuthManager />}

      {/* TAB: BRANDING, THEME & IDENTITY MANAGER (SUPER ADMIN) */}
      {activeTab === 'branding' && isSuperAdmin && <AdminBrandingManager />}

      {/* TAB: HOMEPAGE BUILDER & 9 SECTIONS CMS (SUPER ADMIN) */}
      {activeTab === 'homepage_builder' && isSuperAdmin && <HomepageLayoutManager />}

      {/* TAB: MULTIPLE PAYMENT GATEWAYS ORCHESTRATION & ACTIVATION (SUPER ADMIN) */}
      {activeTab === 'payment_gateways' && isSuperAdmin && <PaymentGatewaysManager />}

      {/* TAB: STORE POS COUNTER TERMINAL */}
      {activeTab === 'pos' && <POSTerminal />}

      {/* TAB: SOP & SLA OPERATIONS MATRIX */}
      {activeTab === 'sop_sla' && <SopSlaMatrixSection />}

      {/* TAB: EXPRESS DELIVERY & SHIPROCKET PARTNER MANAGER */}
      {activeTab === 'express_delivery' && <DeliveryPartnerManager />}

      {/* TAB: AI PRODUCT ASSISTANT & ADD PRODUCT */}
      {activeTab === 'ai_assistant' && (
        <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-6 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-600" />
                <span>AI Product Assistant &amp; Product Onboarding</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Auto-segregate product titles, generate SEO meta tags, configure physical dimensions, volumetric weight, and multi-variations.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setProductForAiEdit(null);
                  setShowAiProductModal(true);
                }}
                className="px-4 py-2 bg-linear-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>Launch AI Product Studio</span>
              </button>
              <button
                type="button"
                onClick={() => setShowAddProductModal(true)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Quick Manual Add</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {products
              .filter(
                (p) =>
                  !searchNormalized ||
                  p.name.toLowerCase().includes(searchNormalized) ||
                  p.sku.toLowerCase().includes(searchNormalized) ||
                  p.brand.toLowerCase().includes(searchNormalized)
              )
              .map((p) => (
                <div
                  key={p.id}
                  className="p-3.5 rounded-xl border border-slate-200 hover:border-blue-300 bg-slate-50/60 flex flex-col justify-between gap-3"
                >
                  <div className="flex items-start gap-3">
                    <img
                      src={p.images[0]}
                      alt={p.name}
                      className="w-12 h-12 rounded-lg object-cover border border-slate-200 bg-white shrink-0"
                    />
                    <div className="min-w-0">
                      <span className="text-[10px] font-mono text-slate-500 block">{p.sku}</span>
                      <h4 className="text-xs font-bold text-slate-900 line-clamp-2">{p.name}</h4>
                      <span className="text-xs font-mono font-bold text-blue-600 mt-0.5 block">
                        {formatINR(p.dealPrice || p.regularPrice)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 pt-2 border-t border-slate-200/80">
                    <button
                      type="button"
                      onClick={() => {
                        setProductForAiEdit(p);
                        setShowAiProductModal(true);
                      }}
                      className="flex-1 py-1.5 px-2.5 bg-white hover:bg-purple-50 text-purple-700 border border-purple-200 rounded-lg text-[11px] font-bold cursor-pointer"
                    >
                      ✨ AI Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setProductForVariantsEdit(p);
                        setShowVariantsModal(true);
                      }}
                      className="flex-1 py-1.5 px-2.5 bg-white hover:bg-blue-50 text-blue-700 border border-blue-200 rounded-lg text-[11px] font-bold cursor-pointer"
                    >
                      📐 Variants &amp; Dim
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* TAB: PRODUCT APPROVALS QUEUE (SUPER ADMIN) */}
      {activeTab === 'approvals_queue' && isSuperAdmin && (
        <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-amber-600" />
                <span>Store Product Submissions &amp; Approvals Queue</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Verify margins, HSN codes, GST rates, and SEO compliance for products uploaded by branch managers.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowApprovalsModal(true)}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-extrabold flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Open Full Approvals Reviewer ({pendingApprovalsCount} Pending)</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-600 font-bold uppercase text-[10px] border-b border-slate-200">
                  <th className="py-2.5 px-3">Product</th>
                  <th className="py-2.5 px-3">Brand &amp; Category</th>
                  <th className="py-2.5 px-3 font-mono">Price / MRP</th>
                  <th className="py-2.5 px-3">Approval Status</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {products.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="py-3 px-3 font-bold text-slate-900">
                      {p.name}
                      <span className="block text-[10px] font-mono text-slate-400">{p.sku}</span>
                    </td>
                    <td className="py-3 px-3 text-slate-600">
                      {p.brand} • <span className="capitalize">{p.categoryId.replace('_', ' ')}</span>
                    </td>
                    <td className="py-3 px-3 font-mono">
                      <span className="font-bold text-slate-900">{formatINR(p.dealPrice || p.regularPrice)}</span>
                      <span className="text-slate-400 line-through ml-1.5">{formatINR(p.mrp)}</span>
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          p.approvalStatus === 'pending'
                            ? 'bg-amber-100 text-amber-800'
                            : p.approvalStatus === 'rejected'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {p.approvalStatus || 'approved'}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        type="button"
                        onClick={() => {
                          setProductForAiEdit(p);
                          setShowAiProductModal(true);
                        }}
                        className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-[11px] font-semibold cursor-pointer"
                      >
                        Inspect / Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB: VOLUMETRIC WEIGHT CALCULATOR & PRODUCT DIMENSIONS */}
      {activeTab === 'volumetric_calc' && (
        <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-600" />
                <span>Volumetric Weight Calculator &amp; Package Dimensions Matrix</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Courier dimensional weight formula (L × W × H / 5000) vs Dead Weight for accurate Shiprocket &amp; express freight billing.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowStandaloneVolumetricModal(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <span>📐 Open Interactive 3D Volumetric Calculator</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-600 font-bold uppercase text-[10px] border-b border-slate-200">
                  <th className="py-2.5 px-3">Product &amp; Model</th>
                  <th className="py-2.5 px-3 font-mono">Dimensions (L × W × H)</th>
                  <th className="py-2.5 px-3 font-mono">Dead Weight</th>
                  <th className="py-2.5 px-3 font-mono">Volumetric (÷5000)</th>
                  <th className="py-2.5 px-3 font-mono">Billable Weight</th>
                  <th className="py-2.5 px-3">Variants</th>
                  <th className="py-2.5 px-3 text-right">Manage</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {products.map((p) => {
                  const l = p.lengthCm || 18;
                  const w = p.widthCm || 12;
                  const h = p.heightCm || 6;
                  const dead = p.deadWeightKg || p.weightKg || 0.35;
                  const vol = Number(((l * w * h) / 5000).toFixed(3));
                  const billable = Math.max(dead, vol);
                  return (
                    <tr key={p.id} className="hover:bg-slate-50">
                      <td className="py-3 px-3">
                        <span className="font-bold text-slate-900 block">{p.name}</span>
                        <span className="text-[10px] font-mono text-slate-500">
                          SKU: {p.sku} {p.modelNumber ? `• Model: ${p.modelNumber}` : ''}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-700">
                        {l} × {w} × {h} cm
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-700">{dead} kg</td>
                      <td className="py-3 px-3 font-mono text-blue-700 font-semibold">{vol} kg</td>
                      <td className="py-3 px-3 font-mono">
                        <span
                          className={`px-2 py-0.5 rounded font-bold ${
                            vol > dead
                              ? 'bg-amber-100 text-amber-900 border border-amber-300'
                              : 'bg-emerald-100 text-emerald-900'
                          }`}
                        >
                          {billable} kg {vol > dead ? '(Volumetric)' : '(Dead Wt)'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-[11px] text-slate-600">
                        {p.colorVariants?.length || 0} Colors • {p.sizeVariants?.length || 0} Sizes
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => {
                            setProductForVariantsEdit(p);
                            setShowVariantsModal(true);
                          }}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-[11px] font-bold cursor-pointer"
                        >
                          📐 Edit Dim &amp; Variants
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB: GOOGLE AUTHENTICATOR 2FA QR */}
      {activeTab === 'authenticator_qr' && (
        <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <QrCode className="w-4 h-4 text-emerald-600" />
                <span>Google Authenticator 2FA QR Security Setup</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Scan the TOTP QR code in Google Authenticator or Microsoft Authenticator to enable 6-digit two-factor verification.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setAuthenticatorTargetAccount(currentAdminAccount);
                setShowAuthenticatorQrModal(true);
              }}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <QrCode className="w-4 h-4" />
              <span>Open My 2FA Authenticator QR</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {(isSuperAdmin ? accounts : [currentAdminAccount]).filter(Boolean).map((acc) => (
              <div
                key={acc.id}
                className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <span className="text-xs font-bold text-slate-900 block truncate">{acc.name}</span>
                  <span className="text-[11px] text-slate-500 block truncate">{acc.email}</span>
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-blue-100 text-blue-800 inline-block mt-1">
                    {acc.role.replace('_', ' ')}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setAuthenticatorTargetAccount(acc);
                    setShowAuthenticatorQrModal(true);
                  }}
                  className="px-3 py-1.5 bg-white hover:bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-bold shrink-0 cursor-pointer"
                >
                  Show QR
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stock Adjustment Modal */}
      {adjustingProduct && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full space-y-4 shadow-xl">
            <h3 className="text-sm font-bold text-slate-900">
              Adjust Physical Stock: {adjustingProduct.name}
            </h3>
            <div className="text-xs space-y-2">
              <div>
                <label className="text-slate-600 block mb-1">Current On-Hand Stock:</label>
                <input
                  type="number"
                  value={adjustmentValue}
                  onChange={(e) => setAdjustmentValue(Number(e.target.value))}
                  className="w-full p-2 border border-slate-300 rounded font-mono font-bold"
                />
              </div>
              <div>
                <label className="text-slate-600 block mb-1">Reason for Adjustment:</label>
                <input
                  type="text"
                  value={adjustmentReason}
                  onChange={(e) => setAdjustmentReason(e.target.value)}
                  placeholder="e.g. Physical inventory count reconciliation"
                  className="w-full p-2 border border-slate-300 rounded"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setAdjustingProduct(null)}
                className="px-3 py-1.5 text-xs text-slate-600 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveStockAdjustment}
                className="px-4 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded cursor-pointer"
              >
                Commit Adjustment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Product Modal */}
      {showAddProductModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 max-w-lg w-full max-h-[85vh] overflow-y-auto space-y-4 shadow-xl">
            <div className="flex justify-between items-center border-b pb-2">
              <h3 className="text-sm font-bold text-slate-900">Add New Product to Store</h3>
              <button onClick={() => setShowAddProductModal(false)} className="text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateProductSubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Product Title *</label>
                <input
                  type="text"
                  value={newProdName}
                  onChange={(e) => setNewProdName(e.target.value)}
                  placeholder="e.g. Realme Buds Air 5 Pro"
                  className="w-full p-2 border rounded"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Brand *</label>
                  <input
                    type="text"
                    value={newProdBrand}
                    onChange={(e) => setNewProdBrand(e.target.value)}
                    placeholder="e.g. Realme"
                    className="w-full p-2 border rounded"
                    required
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Category</label>
                  <select
                    value={newProdCategory}
                    onChange={(e) => setNewProdCategory(e.target.value as any)}
                    className="w-full p-2 border rounded bg-white"
                  >
                    <option value="smartphones">Smartphones</option>
                    <option value="audio">Audio & Headphones</option>
                    <option value="chargers_cables">Chargers & Cables</option>
                    <option value="smartwatches">Smartwatches</option>
                    <option value="tvs_accessories">Smart TVs</option>
                    <option value="computer_accessories">Computer Accessories</option>
                    <option value="home_electronics">Home Electronics</option>
                    <option value="small_appliances">Small Appliances</option>
                  </select>
                </div>
              </div>

              <div className={`grid ${isSuperAdmin ? 'grid-cols-3' : 'grid-cols-2'} gap-3`}>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">MRP (₹) *</label>
                  <input
                    type="number"
                    value={newProdMrp}
                    onChange={(e) => setNewProdMrp(Number(e.target.value))}
                    className="w-full p-2 border rounded font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Selling Price (₹) *</label>
                  <input
                    type="number"
                    value={newProdPrice}
                    onChange={(e) => setNewProdPrice(Number(e.target.value))}
                    className="w-full p-2 border rounded font-mono"
                    required
                  />
                </div>
                {isSuperAdmin && (
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Purchase Cost (₹)</label>
                    <input
                      type="number"
                      value={newProdCost}
                      onChange={(e) => setNewProdCost(Number(e.target.value))}
                      className="w-full p-2 border rounded font-mono"
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Opening Stock *</label>
                  <input
                    type="number"
                    value={newProdStock}
                    onChange={(e) => setNewProdStock(Number(e.target.value))}
                    className="w-full p-2 border rounded font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">SKU</label>
                  <input
                    type="text"
                    value={newProdSku}
                    onChange={(e) => setNewProdSku(e.target.value)}
                    placeholder="e.g. JE-AU-BUDS-01"
                    className="w-full p-2 border rounded font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">GST Tax Rate *</label>
                  <select
                    value={newProdGstRate}
                    onChange={(e) => setNewProdGstRate(Number(e.target.value))}
                    className="w-full p-2 border rounded bg-white font-mono"
                  >
                    <option value={0}>0% (Exempt / Nil)</option>
                    <option value={5}>5% GST</option>
                    <option value={12}>12% GST</option>
                    <option value={18}>18% GST (Standard)</option>
                    <option value={28}>28% GST (Luxury)</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">HSN / SAC Code</label>
                  <input
                    type="text"
                    value={newProdHsnCode}
                    onChange={(e) => setNewProdHsnCode(e.target.value)}
                    placeholder="e.g. 8517, 8518, 8504"
                    className="w-full p-2 border rounded font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Image URL</label>
                <input
                  type="url"
                  value={newProdImage}
                  onChange={(e) => setNewProdImage(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full p-2 border rounded"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddProductModal(false)}
                  className="px-3 py-1.5 text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 text-white rounded font-bold"
                >
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Campaign Modal */}
      {showAddCampaign && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full space-y-4 shadow-xl text-xs">
            <h3 className="text-sm font-bold text-slate-900">Create Festive Campaign</h3>
            <form onSubmit={handleCreateCampaignSubmit} className="space-y-3">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Campaign Name *</label>
                <input
                  type="text"
                  value={campName}
                  onChange={(e) => setCampName(e.target.value)}
                  placeholder="e.g. Holi Electronics Mela"
                  className="w-full p-2 border rounded"
                  required
                />
              </div>
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Banner Headline *</label>
                <input
                  type="text"
                  value={campHeadline}
                  onChange={(e) => setCampHeadline(e.target.value)}
                  placeholder="e.g. Celebrate with up to 50% Off on Smart TVs"
                  className="w-full p-2 border rounded"
                  required
                />
              </div>
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Coupon Code</label>
                <input
                  type="text"
                  value={campCoupon}
                  onChange={(e) => setCampCoupon(e.target.value.toUpperCase())}
                  placeholder="e.g. HOLI300"
                  className="w-full p-2 border rounded font-mono"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Duration (Days)</label>
                <input
                  type="number"
                  value={campDays}
                  onChange={(e) => setCampDays(Number(e.target.value))}
                  className="w-full p-2 border rounded font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddCampaign(false)}
                  className="px-3 py-1.5 text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 text-white rounded font-bold"
                >
                  Publish Campaign
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Store Full / Partial Order Cancellation Modal */}
      {cancellingOrder && (
        <StoreOrderCancellationModal
          order={cancellingOrder}
          onClose={() => setCancellingOrder(null)}
          onSuccess={() => setCancellingOrder(null)}
        />
      )}

      {/* Google Authenticator Registration QR Modal */}
      {showAuthenticatorQrModal && authenticatorTargetAccount && (
        <AdminAuthenticatorQrModal
          account={authenticatorTargetAccount}
          isOpen={showAuthenticatorQrModal}
          onClose={() => setShowAuthenticatorQrModal(false)}
          onUpdateAccount={(accId, updates) => {
            updateStoreStaffAccount(accId, updates);
          }}
        />
      )}

      {/* AI Product Assistant Studio Modal (Upload / Modify / Segregate) */}
      {showAiProductModal && (
        <AIProductAssistantModal
          isOpen={showAiProductModal}
          productToEdit={productForAiEdit}
          onClose={() => {
            setShowAiProductModal(false);
            setProductForAiEdit(null);
          }}
          onSuccess={() => {
            setShowAiProductModal(false);
            setProductForAiEdit(null);
          }}
        />
      )}

      {/* Product Approvals Queue Modal (Super Admin Review) */}
      {showApprovalsModal && (
        <ProductApprovalsQueueModal
          isOpen={showApprovalsModal}
          onClose={() => setShowApprovalsModal(false)}
          onEditProduct={(p) => {
            setProductForAiEdit(p);
            setShowAiProductModal(true);
          }}
        />
      )}

      {/* Multi-Seller Price & Offers Modal */}
      {multiSellerModalProduct && (
        <MultiSellerPriceModal
          product={multiSellerModalProduct}
          isOpen={Boolean(multiSellerModalProduct)}
          onClose={() => setMultiSellerModalProduct(null)}
        />
      )}

      {/* Order Dispatch Modal: Option 1 (In-House Rider) vs Option 2 (Express Shiprocket Carrier) */}
      {dispatchingOrder && (
        <OrderDispatchModal
          order={dispatchingOrder}
          isOpen={Boolean(dispatchingOrder)}
          onClose={() => setDispatchingOrder(null)}
          onSuccess={() => setDispatchingOrder(null)}
        />
      )}

      {/* Doorstep COD Cash / UPI QR Collection Modal */}
      {collectingCodOrder && (
        <CodCollectionModal
          order={collectingCodOrder}
          isOpen={Boolean(collectingCodOrder)}
          onClose={() => setCollectingCodOrder(null)}
          onSuccess={() => setCollectingCodOrder(null)}
        />
      )}

      {/* Product Dimensions, Volumetric Weight & Variations Modal */}
      {showVariantsModal && productForVariantsEdit && (
        <ProductVariantsAndDimensionsModal
          product={productForVariantsEdit}
          isOpen={showVariantsModal}
          onClose={() => {
            setShowVariantsModal(false);
            setProductForVariantsEdit(null);
          }}
          onSuccess={() => {
            setShowVariantsModal(false);
            setProductForVariantsEdit(null);
          }}
        />
      )}

      {/* Standalone Volumetric Weight Calculator Tool */}
      {showStandaloneVolumetricModal && (
        <VolumetricWeightCalculatorModal
          isOpen={showStandaloneVolumetricModal}
          onClose={() => setShowStandaloneVolumetricModal(false)}
        />
      )}
    </div>
  );
};
