import React, { useState, useMemo } from 'react';
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
} from 'lucide-react';
import { OutletsManager } from './OutletsManager';
import { OwnershipModelsManager } from './OwnershipModelsManager';
import { CategoryApprovalManager } from './CategoryApprovalManager';
import { PayoutsLedgerManager } from './PayoutsLedgerManager';
import { BarcodeCatalogManager } from './BarcodeCatalogManager';
import { StockTransfersManager } from './StockTransfersManager';
import { FranchiseAgreementsManager } from './FranchiseAgreementsManager';
import { AdminBrandingManager } from './AdminBrandingManager';

export const AdminDashboard: React.FC = () => {
  const {
    products,
    orders,
    stockMovements,
    campaigns,
    coupons,
    settings,
    currentRole,
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
  } = useStore();

  const isSuperAdmin = currentRole === 'super_admin';

  // Navigation tab
  const [activeTab, setActiveTab] = useState<
    | 'overview'
    | 'outlets'
    | 'orders'
    | 'inventory'
    | 'stock_transfers'
    | 'barcodes'
    | 'products'
    | 'categories_mgmt'
    | 'payouts'
    | 'franchise'
    | 'ownership_models'
    | 'delivery'
    | 'campaigns'
    | 'branding'
    | 'settings'
  >('overview');

  // Orders tab filters
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('all');

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

  // High-level Financial KPIs
  const metrics = useMemo(() => {
    let totalRevenue = 0;
    let cashCollected = 0;
    let cogs = 0;
    let totalOrdersCount = orders.length;
    let pendingConfirmationsCount = 0;
    let packingQueueCount = 0;
    let outForDeliveryCount = 0;

    orders.forEach((o) => {
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
  }, [orders, products]);

  // Filtered Orders
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
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
  }, [orders, orderStatusFilter, orderSearch]);

  // Export Orders to CSV
  const handleExportOrdersCsv = () => {
    const headers = ['Order ID', 'Date', 'Customer Name', 'Phone', 'Area', 'Payment Method', 'Payment Status', 'Order Status', 'Final Total (INR)'];
    const rows = orders.map((o) => [
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
      gstRate: 18,
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

  return (
    <div className="max-w-7xl mx-auto px-2.5 sm:px-4 py-4 sm:py-6 no-print w-full max-w-full min-w-0 box-border">
      {/* Top Banner / Role Identity */}
      <div className="bg-slate-900 rounded-xl sm:rounded-2xl p-4 sm:p-6 text-white mb-4 sm:mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-lg border border-slate-800 w-full max-w-full min-w-0 box-border">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold uppercase tracking-wider bg-blue-600 text-white px-2 py-0.5 rounded">
              {isSuperAdmin ? 'SUPER ADMIN CONSOLE' : 'STORE MANAGER PORTAL'}
            </span>
            <button
              onClick={() => setActiveTab('outlets')}
              className="text-[11px] sm:text-xs text-blue-200 hover:text-white flex items-center gap-1 bg-slate-800 hover:bg-slate-700 px-2 py-0.5 rounded transition-colors cursor-pointer border border-slate-700"
            >
              <Building2 className="w-3 h-3 text-emerald-400" />
              <span>Branch: <strong>{activeOutlet?.name || 'All Outlets'}</strong></span>
              <span className="text-[10px] text-slate-400 font-mono">({outlets.length} total)</span>
            </button>
          </div>
          <h1 className="text-lg sm:text-xl md:text-2xl font-black mt-1 tracking-tight text-white break-words">
            {isSuperAdmin ? 'Multi-Outlet Business & Marketplace Operations' : `${activeOutlet?.name || 'Store'} Operations & Dispatch`}
          </h1>
          <p className="text-[11px] sm:text-xs text-slate-400 mt-1 break-words">
            Real-time atomic inventory reservations, branch transfers, rider payouts, GS1 barcodes & franchise compliance.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            onClick={handleExportOrdersCsv}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition-colors cursor-pointer min-h-[36px]"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => setShowAddProductModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors cursor-pointer min-h-[36px]"
          >
            <Plus className="w-4 h-4" />
            <span>Add Product</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 border-b border-slate-200 scrollbar-none mb-4 sm:mb-6 w-full max-w-full min-w-0">
        {[
          { id: 'overview', label: 'Overview & Analytics', icon: <BarChart3 className="w-3.5 h-3.5 shrink-0" /> },
          { id: 'outlets', label: `Outlets & Branches (${outlets.length})`, icon: <Building2 className="w-3.5 h-3.5 shrink-0" /> },
          { id: 'orders', label: `Orders (${orders.length})`, icon: <Package className="w-3.5 h-3.5 shrink-0" /> },
          { id: 'inventory', label: 'Inventory & Movements', icon: <Layers className="w-3.5 h-3.5 shrink-0" /> },
          { id: 'stock_transfers', label: `Stock Transfers (${stockTransfers.length})`, icon: <ArrowLeftRight className="w-3.5 h-3.5 shrink-0" /> },
          { id: 'barcodes', label: `Barcodes & GTIN (${barcodeRecords.length})`, icon: <Scan className="w-3.5 h-3.5 shrink-0" /> },
          { id: 'products', label: 'Products & Margins', icon: <DollarSign className="w-3.5 h-3.5 shrink-0" /> },
          ...(isSuperAdmin
            ? [
                { id: 'categories_mgmt', label: `Category Approvals (${businessCategories.length})`, icon: <FolderTree className="w-3.5 h-3.5 shrink-0" /> },
                { id: 'payouts', label: 'Payouts & Ledger', icon: <CreditCard className="w-3.5 h-3.5 shrink-0" /> },
                { id: 'franchise', label: `Franchise Contracts (${franchiseAgreements.length})`, icon: <FileText className="w-3.5 h-3.5 shrink-0" /> },
                { id: 'ownership_models', label: 'Ownership Models', icon: <Briefcase className="w-3.5 h-3.5 shrink-0" /> },
              ]
            : []),
          { id: 'delivery', label: 'Local Delivery & Coverage', icon: <Truck className="w-3.5 h-3.5 shrink-0" /> },
          { id: 'campaigns', label: 'Festive Campaigns', icon: <Sparkles className="w-3.5 h-3.5 shrink-0" /> },
          ...(isSuperAdmin
            ? [
                { id: 'branding', label: 'Branding & Theme', icon: <Palette className="w-3.5 h-3.5 shrink-0" /> },
                { id: 'settings', label: 'Store Settings', icon: <Settings className="w-3.5 h-3.5 shrink-0" /> },
              ]
            : []),
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer min-h-[36px] ${
              activeTab === tab.id
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* TAB 1: OVERVIEW & ANALYTICS */}
      {activeTab === 'overview' && (
        <div className="space-y-4 sm:space-y-6">
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

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">Status:</span>
              <select
                value={orderStatusFilter}
                onChange={(e) => setOrderStatusFilter(e.target.value)}
                className="text-xs px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-600 cursor-pointer"
              >
                <option value="all">All Statuses ({orders.length})</option>
                <option value="awaiting_whatsapp_confirmation">Awaiting WhatsApp</option>
                <option value="confirmed">Confirmed</option>
                <option value="packed">Packed</option>
                <option value="assigned_to_delivery">Assigned to Rider</option>
                <option value="out_for_delivery">Out for Delivery</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
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
                  <th className="py-3 px-3">Items</th>
                  <th className="py-3 px-3">Total</th>
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
                    <td className="py-3 px-3">
                      <span className="font-medium text-slate-800">
                        {order.items.map((i) => `${i.productName} (x${i.quantity})`).join(', ')}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-slate-900">
                      {formatINR(order.finalTotal)}
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
                            : order.orderStatus === 'awaiting_whatsapp_confirmation'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {order.orderStatus.replace(/_/g, ' ')}
                      </span>
                      {order.deliveryStaffName && (
                        <span className="text-[10px] text-slate-500 block mt-0.5">
                          Rider: {order.deliveryStaffName}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
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

                        {order.orderStatus === 'packed' && (
                          <button
                            onClick={() =>
                              assignDeliveryStaff(order.id, 'rider-1', 'Ramesh Kumar (Lucknow Rider)')
                            }
                            className="px-2 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded font-bold text-[11px] cursor-pointer"
                          >
                            Assign Rider
                          </button>
                        )}

                        {order.paymentStatus !== 'verified_paid' && (
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
                  {stockMovements.map((sm) => (
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
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Product Catalogue & Margin Protection
              </h3>
              <p className="text-xs text-slate-500">
                Purchase cost and gross margins are strictly internal and never exposed to customers.
              </p>
            </div>
            <button
              onClick={() => setShowAddProductModal(true)}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold cursor-pointer"
            >
              Add New Product
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-600 font-bold uppercase text-[10px] border-b border-slate-200">
                  <th className="py-2.5 px-3">Product</th>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3 font-mono">MRP</th>
                  <th className="py-2.5 px-3 font-mono">Selling Price</th>
                  {isSuperAdmin && <th className="py-2.5 px-3 font-mono">Purchase Cost</th>}
                  {isSuperAdmin && <th className="py-2.5 px-3 font-mono">Gross Margin</th>}
                  <th className="py-2.5 px-3 text-center">Available Stock</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {products.map((p) => {
                  const currentPrice = p.dealPrice || p.regularPrice;
                  const margin = currentPrice - p.purchaseCost;
                  const marginPct = Math.round((margin / currentPrice) * 100);

                  return (
                    <tr key={p.id} className="hover:bg-slate-50">
                      <td className="py-3 px-3">
                        <span className="font-semibold text-slate-900 block">{p.name}</span>
                        <span className="text-[10px] text-slate-400 font-mono">SKU: {p.sku}</span>
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-600" />
              Serviceable Lucknow PIN Codes
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Customers ordering outside these PIN codes will be notified to select Store Pickup at Hazratganj shop.
            </p>

            <div className="flex flex-wrap gap-2">
              {settings.serviceablePincodes.map((pin) => (
                <span
                  key={pin}
                  className="px-2.5 py-1 bg-slate-100 border border-slate-300 rounded font-mono text-xs font-bold text-slate-800"
                >
                  {pin}
                </span>
              ))}
            </div>

            <div className="pt-4 border-t border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-600">Free Delivery Threshold:</span>
                <span className="font-bold font-mono">{formatINR(settings.freeDeliveryThreshold)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Standard Delivery Fee:</span>
                <span className="font-bold font-mono">{formatINR(settings.deliveryFee)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Same-Day Cutoff Time:</span>
                <span className="font-bold font-mono">{settings.sameDayCutoffTime} (5:00 PM)</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Truck className="w-4 h-4 text-blue-600" />
              Assigned Delivery Fleet
            </h3>
            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-900 block">Ramesh Kumar (Hazratganj Zone)</span>
                  <span className="text-slate-500">Phone: +91 94150 99881 | Vehicle: Hero Electric</span>
                </div>
                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded">
                  Active
                </span>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-900 block">Manoj Sharma (Gomti Nagar Zone)</span>
                  <span className="text-slate-500">Phone: +91 98391 22334 | Vehicle: Honda Activa</span>
                </div>
                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded">
                  Active
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: FESTIVE CAMPAIGNS */}
      {activeTab === 'campaigns' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Active Festive Campaigns</h3>
                <p className="text-xs text-slate-500">
                  Drive sales during Diwali, Eid, and holidays with custom countdown timers and promo codes.
                </p>
              </div>
              <button
                onClick={() => setShowAddCampaign(true)}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold cursor-pointer"
              >
                Create Campaign
              </button>
            </div>

            <div className="space-y-3">
              {campaigns.map((camp) => (
                <div
                  key={camp.id}
                  className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm">{camp.name}</span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                          camp.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        {camp.isActive ? 'ACTIVE ON HOMEPAGE' : 'PAUSED'}
                      </span>
                    </div>
                    <p className="text-slate-600 mt-1">{camp.bannerHeadline}</p>
                    <span className="text-[11px] text-slate-400 font-mono mt-1 block">
                      Coupon: {camp.couponCode || 'None'} | Ends:{' '}
                      {new Date(camp.endDate).toLocaleDateString()}
                    </span>
                  </div>

                  <button
                    onClick={() => toggleCampaignStatus(camp.id)}
                    className={`px-3 py-1.5 rounded-lg font-semibold text-xs transition-colors cursor-pointer ${
                      camp.isActive
                        ? 'bg-amber-100 hover:bg-amber-200 text-amber-900'
                        : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    }`}
                  >
                    {camp.isActive ? 'Deactivate' : 'Activate Campaign'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

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
        </div>
      )}

      {/* TAB: OUTLETS & MULTI-BRANCH MANAGEMENT */}
      {activeTab === 'outlets' && <OutletsManager />}

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

      {/* TAB: BRANDING, THEME & IDENTITY MANAGER (SUPER ADMIN) */}
      {activeTab === 'branding' && isSuperAdmin && <AdminBrandingManager />}

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

              <div className="grid grid-cols-3 gap-3">
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
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Purchase Cost (₹)</label>
                  <input
                    type="number"
                    value={newProdCost}
                    onChange={(e) => setNewProdCost(Number(e.target.value))}
                    className="w-full p-2 border rounded font-mono"
                  />
                </div>
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
    </div>
  );
};
