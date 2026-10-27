import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import {
  Address,
  CartItem,
  CategoryItem,
  Coupon,
  DeliveryType,
  FestiveCampaign,
  Order,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  Product,
  ProductCategory,
  Role,
  StockMovement,
  StoreSettings,
  UserProfile,
  UserAccount,
  Outlet,
  OutletOwnershipRules,
  BusinessCategory,
  CategoryApprovalStatus,
  Participant,
  PayoutItem,
  PayoutStatus,
  FinancialLedgerEntry,
  ProductBarcodeRecord,
  StockTransfer,
  StockTransferStatus,
  FranchiseAgreement,
  BrandingSettings,
  BrandingHistoryEntry,
  BusinessRule,
  PlatformDocument,
  DocumentVerificationStatus,
  ProductReview,
  ReviewModerationStatus,
  TrustProfile,
  TrustAppeal,
  TrustSegment,
  ShopOutletPerformanceMetric,
  WhatsAppPaymentSubmission,
  WhatsAppReviewStatus,
  PaymentTransactionRecord,
  DynamicUpiQrSession,
  PaymentGatewayProvider,
  DeliveryPincodeZone,
  BulkDiscountRule,
  CancelItemRequest,
  ItemCancellationReason,
  StockMovementType,
  HomepageMasterSettings,
  HomepageSection,
  HomepageSectionType,
  ComboBundleItem,
  FestivalCampaignRecord,
  PaymentGatewayConfig,
  PaymentGatewayAuditLog,
  SellerListing,
  SopSlaMasterConfig,
  OrderLifecycleSlaConfig,
  SlaThresholdRange,
  StressMetricDefinition,
  CustomerTagSlaRule,
  SellerTagSlaRule,
  OutletSlaCompliance,
  ExpressShipmentDetails,
  DeliveryPartnerAccount,
  ExpressCarrierName,
  DispatchFulfillmentType,
  OrderStatusHistoryItem,
  RiderRemittanceSubmission,
  CarrierCodSettlement,
  ShiprocketSyncResult,
} from '../types';
import { syncShipmentStatus } from '../services/shiprocketService';
import { formatINR } from '../utils/currency';
import { verifyAdminOtp } from '../utils/authenticator';
import {
  calculateHaversineDistanceKm,
  estimateDeliveryMinutes,
  generateSuggestedRouteSteps,
  getGoogleMapsNavigationUrl,
  DEFAULT_STORE_COORDINATES,
} from '../utils/geoUtils';
import {
  INITIAL_PAYMENT_GATEWAYS,
  INITIAL_GATEWAY_AUDIT_LOGS,
} from '../data/paymentGatewaysData';
import {
  INITIAL_SOP_SLA_CONFIG,
  INITIAL_OUTLET_COMPLIANCE_DATA,
  PRESET_CONFIGURATIONS,
} from '../data/mockSopSlaData';
import {
  INITIAL_DELIVERY_PARTNERS,
  INITIAL_RIDERS,
  InHouseRider,
  INITIAL_RIDER_REMITTANCES,
  INITIAL_CARRIER_SETTLEMENTS,
} from '../data/mockDeliveryPartners';
import {
  INITIAL_HOMEPAGE_SETTINGS,
  loadStoredHomepageSettings,
  saveStoredHomepageSettings,
  HOMEPAGE_LIKES_STORAGE_KEY,
} from '../data/homepageData';
import {
  fetchFestivalCampaigns,
  selectActiveFestivalCampaign,
  INITIAL_FESTIVAL_CAMPAIGNS,
} from '../services/festivalCampaignService';
import {
  INITIAL_CATEGORIES,
  INITIAL_COUPONS,
  INITIAL_CAMPAIGNS,
  INITIAL_ORDERS,
  INITIAL_PRODUCTS,
  INITIAL_SETTINGS,
  INITIAL_STOCK_MOVEMENTS,
  INITIAL_USER,
  INITIAL_ACCOUNTS,
  INITIAL_DELIVERY_ZONES,
  INITIAL_BULK_DISCOUNT_RULES,
} from '../data/mockData';
import { evaluateCartBulkDiscount, EvaluatedBulkDiscount } from '../utils/bulkDiscountEngine';
import {
  INITIAL_OWNERSHIP_MODELS,
  INITIAL_OUTLETS,
  INITIAL_BUSINESS_CATEGORIES,
  INITIAL_PARTICIPANTS,
  INITIAL_PAYOUT_ITEMS,
  INITIAL_LEDGER_ENTRIES,
  INITIAL_BARCODE_RECORDS,
  INITIAL_STOCK_TRANSFERS,
  INITIAL_FRANCHISE_AGREEMENTS,
} from '../data/multiOutletData';
import {
  INITIAL_BRANDING_SETTINGS,
  INITIAL_BRANDING_HISTORY,
  INITIAL_BUSINESS_RULES,
  INITIAL_DOCUMENTS,
  INITIAL_VERIFIED_REVIEWS,
  INITIAL_TRUST_PROFILES,
  INITIAL_SHOP_PERFORMANCES,
  INITIAL_WHATSAPP_SUBMISSIONS,
} from '../data/marketplacePaymentsData';
import { buildOrderTrackingUrl, buildUpiPaymentUri, generateQrDataUrl } from '../utils/qrcode';
import { createDynamicUpiQrSession, RazorpayService, computeCartPriceChecksum } from '../services/paymentService';
import { calculateOrderGstBreakdown, getHsnForProduct, DetailedTaxCalculation } from '../utils/gstTaxEngine';

interface StoreContextType {
  // Master data
  products: Product[];
  categories: CategoryItem[];
  cart: CartItem[];
  orders: Order[];
  stockMovements: StockMovement[];
  campaigns: FestiveCampaign[];
  coupons: Coupon[];
  settings: StoreSettings;
  currentUser: UserProfile;
  currentRole: Role;
  setCurrentRole: (role: Role) => void;
  wishlist: string[];

  // Authentication & Staff Credential Management
  accounts: UserAccount[];
  isAuthenticated: boolean;
  loginUser: (
    identifier: string,
    password: string,
    otpCode?: string
  ) => {
    success: boolean;
    message: string;
    requires2FA?: boolean;
    account?: UserAccount;
    user?: UserProfile;
  };
  verifyAdminOtpAndLogin: (
    accountId: string,
    otpCode: string,
    activeSessionOtp?: string
  ) => { success: boolean; message: string; user?: UserProfile };
  registerCustomer: (data: { name: string; email: string; phone: string; password: string; city?: string; pincode?: string; addressLine?: string }) => { success: boolean; message: string; user?: UserProfile };
  createStoreStaffAccount: (data: { name: string; email: string; phone: string; password: string; role: Role; outletId?: string }) => { success: boolean; message: string };
  updateStoreStaffAccount: (id: string, updates: Partial<UserAccount>) => { success: boolean; message: string };
  deleteStoreStaffAccount: (id: string) => { success: boolean; message: string };
  logoutUser: () => void;

  // Multi-Outlet Management
  outlets: Outlet[];
  activeOutletId: string;
  setActiveOutletId: (id: string) => void;
  activeOutlet: Outlet | undefined;
  createOutlet: (outlet: Omit<Outlet, 'id' | 'createdAt'>) => void;
  updateOutlet: (outlet: Outlet) => void;
  deleteOutlet: (id: string) => void;

  // Ownership Models
  ownershipModels: OutletOwnershipRules[];
  updateOwnershipModel: (model: OutletOwnershipRules) => void;

  // Business Category Management & Approval
  businessCategories: BusinessCategory[];
  createBusinessCategory: (cat: Omit<BusinessCategory, 'id' | 'itemCount'>) => void;
  updateCategoryApprovalStatus: (id: string, status: CategoryApprovalStatus, note?: string) => void;

  // Payout Management & Financial Subledger
  participants: Participant[];
  payoutItems: PayoutItem[];
  financialLedger: FinancialLedgerEntry[];
  createPayoutItem: (item: Omit<PayoutItem, 'id' | 'createdAt'>) => void;
  updatePayoutStatus: (payoutId: string, status: PayoutStatus, ref?: string, approvedBy?: string) => void;
  addLedgerEntry: (entry: Omit<FinancialLedgerEntry, 'id' | 'entryDate'>) => void;

  // Barcode / EAN / GTIN Management
  barcodeRecords: ProductBarcodeRecord[];
  registerBarcodeRecord: (record: Omit<ProductBarcodeRecord, 'id'>) => { success: boolean; message: string };
  verifyBarcodeLookup: (barcodeValue: string) => ProductBarcodeRecord | undefined;

  // Inter-Outlet Stock Transfers
  stockTransfers: StockTransfer[];
  requestStockTransfer: (payload: {
    sourceOutletId: string;
    destinationOutletId: string;
    productId: string;
    quantity: number;
    requestedBy: string;
    notes?: string;
  }) => void;
  processStockTransfer: (transferId: string, newStatus: StockTransferStatus, staffNote?: string) => void;

  // Franchise Agreements
  franchiseAgreements: FranchiseAgreement[];
  createAgreement: (agreement: Omit<FranchiseAgreement, 'id'>) => void;
  updateAgreement: (agreement: FranchiseAgreement) => void;

  // Filter/Search states
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  selectedCategory: ProductCategory | 'all';
  setSelectedCategory: (cat: ProductCategory | 'all') => void;
  selectedBrand: string | 'all';
  setSelectedBrand: (brand: string | 'all') => void;
  sortBy: 'featured' | 'price_low' | 'price_high' | 'rating' | 'discount';
  setSortBy: (sort: 'featured' | 'price_low' | 'price_high' | 'rating' | 'discount') => void;

  // Cart operations
  addToCart: (product: Product, quantity?: number, variant?: string) => { success: boolean; message: string };
  removeFromCart: (productId: string) => void;
  updateCartQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  appliedCoupon: Coupon | null;
  applyCoupon: (code: string) => { success: boolean; message: string };
  removeCoupon: () => void;

  // Cart financial calculations
  cartSubtotal: number;
  cartCouponDiscount: number;
  cartBulkDiscount: EvaluatedBulkDiscount;
  cartTotalDiscount: number;
  cartDeliveryFee: number;
  cartTaxAmount: number;
  cartGstCalculation: DetailedTaxCalculation;
  cartFinalTotal: number;
  isFreeDeliveryEligible: boolean;
  amountNeededForFreeDelivery: number;

  // Order lifecycle
  createOrder: (orderPayload: {
    customer: Order['customer'];
    deliveryType: DeliveryType;
    deliverySlot?: string;
    paymentMethod: PaymentMethod;
    isWhatsAppCheckout?: boolean;
  }) => Promise<Order>;
  updateOrderStatus: (orderId: string, status: OrderStatus, note?: string, updatedBy?: string) => void;
  verifyOrderPayment: (orderId: string, transactionId?: string) => void;
  assignDeliveryStaff: (orderId: string, staffId: string, staffName: string) => void;
  completeDelivery: (orderId: string, proof: { collectedAmount?: number; note?: string; receiverName?: string }) => void;
  reportDeliveryFailure: (orderId: string, reason: string) => void;
  requestOrderCancellation: (orderId: string, reason: string) => void;
  requestOrderReturn: (orderId: string, reason: string) => void;
  cancelOrderOrItems: (
    orderId: string,
    cancellations: CancelItemRequest[],
    options?: {
      cancelledBy?: string;
      generalNotes?: string;
      primaryReason?: ItemCancellationReason;
    }
  ) => { success: boolean; message: string; order?: Order };

  // Product & Inventory actions
  addProduct: (product: Omit<Product, 'id'>) => void;
  updateProduct: (product: Product) => void;
  deleteProduct: (productId: string) => void;
  adjustStock: (productId: string, newOnHand: number, reason: string, staffName?: string) => void;
  submitProductForApproval: (
    productData: Omit<Product, 'id'>,
    submitterInfo?: { userId: string; userName: string; role: string; storeName?: string; submittedAt?: string }
  ) => { success: boolean; message: string; productId: string };
  approveProduct: (productId: string, feedback?: string) => { success: boolean; message: string };
  rejectProduct: (productId: string, feedback: string) => { success: boolean; message: string };
  mapSellerToExistingProduct: (
    productId: string,
    listing: Omit<SellerListing, 'id' | 'lastUpdated'>
  ) => { success: boolean; message: string };
  updateSellerListingPrice: (
    productId: string,
    sellerId: string,
    newPrice: number,
    newStock?: number
  ) => { success: boolean; message: string };
  findMatchingCatalogueProducts: (query: {
    title?: string;
    brand?: string;
    category?: string;
    barcode?: string;
  }) => Product[];

  // Campaigns & Promotions
  addCampaign: (campaign: Omit<FestiveCampaign, 'id'>) => void;
  toggleCampaignStatus: (campaignId: string) => void;
  addCoupon: (coupon: Omit<Coupon, 'id' | 'timesUsed'>) => void;
  toggleCouponStatus: (couponId: string) => void;

  // Settings
  updateSettings: (newSettings: Partial<StoreSettings>) => void;

  // User actions
  toggleWishlist: (productId: string) => void;
  addSavedAddress: (address: Omit<Address, 'id'>) => void;

  // Active UI modal controls
  activeModal: string | null;
  setActiveModal: (modal: string | null) => void;
  selectedProductForDetail: Product | null;
  setSelectedProductForDetail: (p: Product | null) => void;
  selectedOrderForModal: Order | null;
  setSelectedOrderForModal: (o: Order | null) => void;
  qrModalData: { title: string; qrValue: string; subtitle?: string; qrImage?: string } | null;
  openQrModal: (data: { title: string; qrValue: string; subtitle?: string }) => void;
  closeQrModal: () => void;
  selectedPolicyType: string | null;
  openPolicyModal: (policyType: string) => void;

  // Serviceable PIN code & Delivery Zone Management
  deliveryZones: DeliveryPincodeZone[];
  addDeliveryZone: (zone: Omit<DeliveryPincodeZone, 'id' | 'createdAt' | 'updatedAt'>) => { success: boolean; message: string };
  updateDeliveryZone: (idOrZone: string | DeliveryPincodeZone, updates?: Partial<DeliveryPincodeZone>) => { success: boolean; message: string };
  deleteDeliveryZone: (id: string) => { success: boolean; message: string };
  toggleDeliveryZoneStatus: (id: string) => void;
  checkPincodeServiceable: (pincode: string, outletId?: string) => boolean;
  getZoneForPincode: (pincode: string, outletId?: string) => DeliveryPincodeZone | undefined;
  getDeliveryZoneForPincode: (pincode: string, outletId?: string) => DeliveryPincodeZone | undefined;

  // MODULE 1 & 2: Dynamic UPI QR & Payments
  activeUpiSession: DynamicUpiQrSession | null;
  setActiveUpiSession: (session: DynamicUpiQrSession | null) => void;
  createUpiCheckoutSession: (orderId: string, amount: number) => Promise<DynamicUpiQrSession>;
  paymentTransactions: PaymentTransactionRecord[];
  verifyPaymentTransaction: (orderId: string, provider: PaymentGatewayProvider, txnRef: string, payerDetails?: any) => void;
  initiateOrderRefund: (orderId: string, reason: string) => void;

  // MODULE 3: WhatsApp Manual Payment Review
  whatsAppPaymentSubmissions: WhatsAppPaymentSubmission[];
  submitWhatsAppPayment: (payload: Omit<WhatsAppPaymentSubmission, 'id' | 'createdAt' | 'reviewStatus'>) => void;
  reviewWhatsAppPayment: (submissionId: string, status: WhatsAppReviewStatus, reason?: string) => void;

  // MODULE 4: Branding Settings
  brandingSettings: BrandingSettings;
  brandingHistory: BrandingHistoryEntry[];
  updateBrandingSettings: (settings: Partial<BrandingSettings>, reason?: string) => void;
  rollbackBrandingSettings: (version: number) => void;

  // MODULE 5: Business Rules & Policies
  businessRules: BusinessRule[];
  updateBusinessRule: (rule: BusinessRule, reason: string) => void;
  createBusinessRule: (rule: Omit<BusinessRule, 'id' | 'lastUpdatedAt'>) => void;

  // MODULE 6: Document Centre
  platformDocuments: PlatformDocument[];
  uploadDocument: (doc: Omit<PlatformDocument, 'id' | 'uploadedAt' | 'status'>) => void;
  updateDocumentStatus: (docId: string, status: DocumentVerificationStatus, reason?: string) => void;

  // MODULE 7 & 8: Social Proof & Verified Reviews
  productReviews: ProductReview[];
  submitProductReview: (review: Omit<ProductReview, 'id' | 'createdAt' | 'moderationStatus' | 'helpfulVotes'>) => { success: boolean; message: string };
  moderateProductReview: (reviewId: string, status: ReviewModerationStatus, notes?: string) => void;
  voteReviewHelpful: (reviewId: string) => void;
  replyToReview: (reviewId: string, replyText: string) => void;
  getProductMetrics: (productId: string) => { totalCompletedOrders: number; averageRating: number; totalReviewsCount: number; popularityRank: number };

  // MODULE 9: User Trust Segmentation & Appeals
  trustProfiles: TrustProfile[];
  trustAppeals: TrustAppeal[];
  updateTrustProfile: (profile: TrustProfile, reason: string) => void;
  submitTrustAppeal: (appeal: Omit<TrustAppeal, 'id' | 'status' | 'createdAt'>) => void;
  resolveTrustAppeal: (appealId: string, resolution: 'approved_reinstated' | 'rejected', note: string, newSegment?: TrustSegment) => void;

  // MODULE 10: Shop & Outlet Performance
  shopPerformances: ShopOutletPerformanceMetric[];

  // Bulk Order Volume Discounts & Rules Engine
  bulkDiscountRules: BulkDiscountRule[];
  addBulkDiscountRule: (rule: Omit<BulkDiscountRule, 'id' | 'createdAt' | 'updatedAt' | 'timesApplied' | 'totalSavingsGranted'>) => { success: boolean; message: string };
  updateBulkDiscountRule: (rule: BulkDiscountRule) => { success: boolean; message: string };
  deleteBulkDiscountRule: (id: string) => { success: boolean; message: string };
  toggleBulkDiscountRuleStatus: (id: string) => void;
  resetBulkDiscountRules: () => void;

  // 100% Configurable Homepage Sections (Brand, Sale, Category, Price, Combo, Offer, Activity, Like, Festive)
  homepageSettings: HomepageMasterSettings;
  updateHomepageSettings: (updates: Partial<HomepageMasterSettings>) => void;
  updateHomepageSection: (sectionId: HomepageSectionType, updates: Partial<HomepageSection>) => void;
  reorderHomepageSection: (sectionId: HomepageSectionType, direction: 'up' | 'down') => void;
  resetHomepageSettings: () => void;
  productLikes: Record<string, number>;
  userLikedProducts: string[];
  toggleProductLike: (productId: string) => void;
  addComboToCart: (combo: ComboBundleItem) => { success: boolean; message: string };
  activeBudgetFilter: number | null;
  setActiveBudgetFilter: (price: number | null) => void;
  activeActivityFilter: string | null;
  setActiveActivityFilter: (activityId: string | null) => void;

  // Automated Festival Homepage Campaigns (Supabase with resilient local cache fallback)
  festivalCampaigns: FestivalCampaignRecord[];
  activeFestivalCampaign: FestivalCampaignRecord | null;
  previewFestivalCampaign: FestivalCampaignRecord | null;
  setPreviewFestivalCampaign: (camp: FestivalCampaignRecord | null) => void;
  refreshFestivalCampaigns: () => Promise<void>;

  // Multiple Payment Gateways Management (Activate / Deactivate / Configure)
  paymentGateways: PaymentGatewayConfig[];
  activePaymentGateways: PaymentGatewayConfig[];
  paymentGatewayAuditLogs: PaymentGatewayAuditLog[];
  togglePaymentGatewayStatus: (id: string) => { success: boolean; message: string; gateway?: PaymentGatewayConfig };
  updatePaymentGateway: (id: string, updates: Partial<PaymentGatewayConfig>) => { success: boolean; message: string };
  resetPaymentGateways: () => void;

  // SOP & SLA Operational Metrics & Operations Matrix
  sopSlaConfig: SopSlaMasterConfig;
  outletCompliance: OutletSlaCompliance[];
  updateLifecycleSla: (metricKey: keyof OrderLifecycleSlaConfig, updates: Partial<SlaThresholdRange>) => { success: boolean; message: string };
  updateStressMetricThreshold: (metricId: string, updates: Partial<StressMetricDefinition>) => { success: boolean; message: string };
  applySlaPreset: (presetKey: string) => { success: boolean; message: string };
  addOrUpdateCustomerTag: (tag: CustomerTagSlaRule) => { success: boolean; message: string };
  deleteCustomerTag: (tagId: string) => { success: boolean; message: string };
  addOrUpdateSellerTag: (tag: SellerTagSlaRule) => { success: boolean; message: string };
  deleteSellerTag: (tagId: string) => { success: boolean; message: string };
  resetSopSlaToDefault: () => { success: boolean; message: string };

  // Express Delivery, Shiprocket & Rider Management
  deliveryPartners: DeliveryPartnerAccount[];
  ridersList: InHouseRider[];
  riderRemittances: RiderRemittanceSubmission[];
  carrierSettlements: CarrierCodSettlement[];
  assignOrderDelivery: (orderId: string, dispatchDetails: ExpressShipmentDetails) => { success: boolean; message: string };
  syncShiprocketOrderStatus: (orderId: string, customAwb?: string) => Promise<{ success: boolean; message: string; syncResult?: ShiprocketSyncResult }>;
  recordCodCollection: (
    orderId: string,
    collectedAmount: number,
    method: 'cash' | 'doorstep_upi_qr',
    collectorName: string,
    notes?: string
  ) => { success: boolean; message: string };
  submitRiderCashRemittance: (payload: {
    riderId: string;
    amount: number;
    submissionMethod: 'cash_deposit' | 'upi_qr';
    outletId: string;
    orderIds?: string[];
    qrDataUrl?: string;
    customCode?: string;
    notes?: string;
  }) => { success: boolean; message: string; remittance?: RiderRemittanceSubmission };
  approveRiderCashRemittance: (
    remittanceIdOrCode: string,
    approvedBy: string,
    notes?: string
  ) => { success: boolean; message: string; remittance?: RiderRemittanceSubmission };
  rejectRiderCashRemittance: (
    remittanceId: string,
    reason: string,
    rejectedBy: string
  ) => { success: boolean; message: string };
  recordCarrierCodSettlement: (payload: {
    carrier: ExpressCarrierName;
    bankUtrNumber: string;
    settlementDate: string;
    grossCodCollected: number;
    carrierDeductions: number;
    netAmountCredited: number;
    orderIds: string[];
    awbNumbers: string[];
    settledBy: string;
    reconciliationNotes?: string;
  }) => { success: boolean; message: string };
  updateDeliveryPartnerConfig: (partnerId: string, updates: Partial<DeliveryPartnerAccount>) => { success: boolean; message: string };
  addInHouseRider: (rider: InHouseRider) => { success: boolean; message: string };
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

const STORAGE_KEY_PREFIX = 'je_retail_store_';

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load state from localStorage or use initial seeds
  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}products`);
    return saved ? JSON.parse(saved) : INITIAL_PRODUCTS;
  });

  const [categories] = useState<CategoryItem[]>(INITIAL_CATEGORIES);

  const [cart, setCart] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}cart`);
    return saved ? JSON.parse(saved) : [];
  });

  const [orders, setOrders] = useState<Order[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}orders`);
    return saved ? JSON.parse(saved) : INITIAL_ORDERS;
  });

  const [stockMovements, setStockMovements] = useState<StockMovement[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}stockMovements`);
    return saved ? JSON.parse(saved) : INITIAL_STOCK_MOVEMENTS;
  });

  const [campaigns, setCampaigns] = useState<FestiveCampaign[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}campaigns`);
    return saved ? JSON.parse(saved) : INITIAL_CAMPAIGNS;
  });

  const [coupons, setCoupons] = useState<Coupon[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}coupons`);
    return saved ? JSON.parse(saved) : INITIAL_COUPONS;
  });

  const [settings, setSettings] = useState<StoreSettings>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}settings`);
    return saved ? JSON.parse(saved) : INITIAL_SETTINGS;
  });

  const [currentUser, setCurrentUser] = useState<UserProfile>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}user`);
    return saved ? JSON.parse(saved) : INITIAL_USER;
  });

  const [currentRole, setCurrentRoleState] = useState<Role>(() => {
    const savedAuth = localStorage.getItem(`${STORAGE_KEY_PREFIX}isAuthenticated`);
    const isAuth = savedAuth !== null ? JSON.parse(savedAuth) : false;
    if (!isAuth) return 'customer';
    const savedUser = localStorage.getItem(`${STORAGE_KEY_PREFIX}user`);
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        if (parsed?.role && parsed.role !== 'super_admin') {
          return parsed.role;
        }
      } catch {}
    }
    const savedRole = localStorage.getItem(`${STORAGE_KEY_PREFIX}currentRole`) as Role | null;
    return savedRole || 'customer';
  });

  // Strict role guard: only super_admin accounts can switch to super_admin or preview other roles
  const setCurrentRole = (nextRole: Role) => {
    if (currentUser.role !== 'super_admin' && nextRole !== currentUser.role && nextRole !== 'customer') {
      return;
    }
    setCurrentRoleState(nextRole);
  };
  const [wishlist, setWishlist] = useState<string[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}wishlist`);
    return saved ? JSON.parse(saved) : ['prod-001', 'prod-006'];
  });

  // User Accounts & Authentication State
  const [accounts, setAccounts] = useState<UserAccount[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}accounts`);
    return saved ? JSON.parse(saved) : INITIAL_ACCOUNTS;
  });

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}isAuthenticated`);
    return saved !== null ? JSON.parse(saved) : false;
  });

  // Multi-Outlet Management States
  const [outlets, setOutlets] = useState<Outlet[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}outlets`);
    return saved ? JSON.parse(saved) : INITIAL_OUTLETS;
  });

  const [activeOutletId, setActiveOutletId] = useState<string>(() => {
    return localStorage.getItem(`${STORAGE_KEY_PREFIX}activeOutletId`) || 'out_hazratganj';
  });

  const [ownershipModels, setOwnershipModels] = useState<OutletOwnershipRules[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}ownershipModels`);
    return saved ? JSON.parse(saved) : INITIAL_OWNERSHIP_MODELS;
  });

  const [businessCategories, setBusinessCategories] = useState<BusinessCategory[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}businessCategories`);
    return saved ? JSON.parse(saved) : INITIAL_BUSINESS_CATEGORIES;
  });

  const [participants, setParticipants] = useState<Participant[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}participants`);
    return saved ? JSON.parse(saved) : INITIAL_PARTICIPANTS;
  });

  const [payoutItems, setPayoutItems] = useState<PayoutItem[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}payoutItems`);
    return saved ? JSON.parse(saved) : INITIAL_PAYOUT_ITEMS;
  });

  const [financialLedger, setFinancialLedger] = useState<FinancialLedgerEntry[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}financialLedger`);
    return saved ? JSON.parse(saved) : INITIAL_LEDGER_ENTRIES;
  });

  const [barcodeRecords, setBarcodeRecords] = useState<ProductBarcodeRecord[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}barcodeRecords`);
    return saved ? JSON.parse(saved) : INITIAL_BARCODE_RECORDS;
  });

  const [stockTransfers, setStockTransfers] = useState<StockTransfer[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}stockTransfers`);
    return saved ? JSON.parse(saved) : INITIAL_STOCK_TRANSFERS;
  });

  const [franchiseAgreements, setFranchiseAgreements] = useState<FranchiseAgreement[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}franchiseAgreements`);
    return saved ? JSON.parse(saved) : INITIAL_FRANCHISE_AGREEMENTS;
  });

  // MODULE 4: Admin Branding & Theme Manager
  const [brandingSettings, setBrandingSettings] = useState<BrandingSettings>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}brandingSettings`);
    return saved ? JSON.parse(saved) : INITIAL_BRANDING_SETTINGS;
  });

  const [brandingHistory, setBrandingHistory] = useState<BrandingHistoryEntry[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}brandingHistory`);
    return saved ? JSON.parse(saved) : INITIAL_BRANDING_HISTORY;
  });

  // MODULE 5: Business Rules & Policy Builder
  const [businessRules, setBusinessRules] = useState<BusinessRule[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}businessRules`);
    return saved ? JSON.parse(saved) : INITIAL_BUSINESS_RULES;
  });

  // MODULE 6: Document Centre
  const [platformDocuments, setPlatformDocuments] = useState<PlatformDocument[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}platformDocuments`);
    return saved ? JSON.parse(saved) : INITIAL_DOCUMENTS;
  });

  // MODULE 7 & 8: Verified Product Reviews
  const [productReviews, setProductReviews] = useState<ProductReview[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}productReviews`);
    return saved ? JSON.parse(saved) : INITIAL_VERIFIED_REVIEWS;
  });

  // MODULE 9: User Trust Segmentation & Appeals
  const [trustProfiles, setTrustProfiles] = useState<TrustProfile[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}trustProfiles`);
    return saved ? JSON.parse(saved) : INITIAL_TRUST_PROFILES;
  });

  const [trustAppeals, setTrustAppeals] = useState<TrustAppeal[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}trustAppeals`);
    return saved ? JSON.parse(saved) : [];
  });

  // MODULE 10: Shop & Outlet Performance
  const [shopPerformances, setShopPerformances] = useState<ShopOutletPerformanceMetric[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}shopPerformances`);
    return saved ? JSON.parse(saved) : INITIAL_SHOP_PERFORMANCES;
  });

  // MODULE 1, 2 & 3: Payments & WhatsApp Review
  const [paymentTransactions, setPaymentTransactions] = useState<PaymentTransactionRecord[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}paymentTransactions`);
    return saved ? JSON.parse(saved) : [];
  });

  const [whatsAppPaymentSubmissions, setWhatsAppPaymentSubmissions] = useState<WhatsAppPaymentSubmission[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}whatsAppSubmissions`);
    return saved ? JSON.parse(saved) : INITIAL_WHATSAPP_SUBMISSIONS;
  });

  const [activeUpiSession, setActiveUpiSession] = useState<DynamicUpiQrSession | null>(null);

  // Delivery Pincodes & Coverage Zones (Any or specific store)
  const [deliveryZones, setDeliveryZones] = useState<DeliveryPincodeZone[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}deliveryZones`);
    return saved ? JSON.parse(saved) : INITIAL_DELIVERY_ZONES;
  });

  // Bulk Order Volume Discounts & Rules Engine
  const [bulkDiscountRules, setBulkDiscountRules] = useState<BulkDiscountRule[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}bulkDiscountRules`);
    return saved ? JSON.parse(saved) : INITIAL_BULK_DISCOUNT_RULES;
  });

  // 100% Configurable Homepage Layout (9 sections: brand, sale, category, price, combo, offer, activity, like, festive)
  const [homepageSettings, setHomepageSettings] = useState<HomepageMasterSettings>(() => {
    return loadStoredHomepageSettings();
  });

  const [activeBudgetFilter, setActiveBudgetFilter] = useState<number | null>(null);
  const [activeActivityFilter, setActiveActivityFilter] = useState<string | null>(null);

  const [productLikes, setProductLikes] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem(HOMEPAGE_LIKES_STORAGE_KEY);
      return saved
        ? JSON.parse(saved)
        : {
            'prod-001': 342,
            'prod-002': 518,
            'prod-003': 289,
            'prod-004': 415,
            'prod-005': 198,
            'prod-006': 672,
            'prod-007': 310,
            'prod-008': 245,
            'prod-009': 380,
          };
    } catch {
      return { 'prod-001': 342, 'prod-002': 518, 'prod-003': 289 };
    }
  });

  const [userLikedProducts, setUserLikedProducts] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('je_user_liked_products');
      return saved ? JSON.parse(saved) : ['prod-002', 'prod-006'];
    } catch {
      return ['prod-002', 'prod-006'];
    }
  });

  // Automated Festival Homepage Campaigns (Supabase with resilient local cache fallback)
  const [festivalCampaigns, setFestivalCampaigns] = useState<FestivalCampaignRecord[]>(() => {
    try {
      const saved = localStorage.getItem('je_festival_campaigns_v2');
      return saved ? JSON.parse(saved) : INITIAL_FESTIVAL_CAMPAIGNS;
    } catch {
      return INITIAL_FESTIVAL_CAMPAIGNS;
    }
  });

  const [activeFestivalCampaign, setActiveFestivalCampaign] = useState<FestivalCampaignRecord | null>(() => {
    return selectActiveFestivalCampaign(INITIAL_FESTIVAL_CAMPAIGNS, new Date());
  });

  const [previewFestivalCampaign, setPreviewFestivalCampaign] = useState<FestivalCampaignRecord | null>(null);

  const refreshFestivalCampaigns = async () => {
    try {
      const data = await fetchFestivalCampaigns();
      setFestivalCampaigns(data);
      const active = selectActiveFestivalCampaign(data, new Date());
      setActiveFestivalCampaign(active);
    } catch (err) {
      console.warn('Failed to refresh festival campaigns:', err);
    }
  };

  useEffect(() => {
    refreshFestivalCampaigns();

    const interval = setInterval(() => {
      setActiveFestivalCampaign(selectActiveFestivalCampaign(festivalCampaigns, new Date()));
    }, 60000);

    const onFocus = () => {
      refreshFestivalCampaigns();
    };
    window.addEventListener('focus', onFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', onFocus);
    };
  }, []);

  // Multiple Payment Gateways Management (Activate / Deactivate / Configure)
  const [paymentGateways, setPaymentGateways] = useState<PaymentGatewayConfig[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}paymentGateways_v2`);
      return saved ? JSON.parse(saved) : INITIAL_PAYMENT_GATEWAYS;
    } catch {
      return INITIAL_PAYMENT_GATEWAYS;
    }
  });

  const [paymentGatewayAuditLogs, setPaymentGatewayAuditLogs] = useState<PaymentGatewayAuditLog[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}gatewayAuditLogs`);
      return saved ? JSON.parse(saved) : INITIAL_GATEWAY_AUDIT_LOGS;
    } catch {
      return INITIAL_GATEWAY_AUDIT_LOGS;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(`${STORAGE_KEY_PREFIX}paymentGateways_v2`, JSON.stringify(paymentGateways));
    } catch {}
  }, [paymentGateways]);

  useEffect(() => {
    try {
      localStorage.setItem(`${STORAGE_KEY_PREFIX}gatewayAuditLogs`, JSON.stringify(paymentGatewayAuditLogs));
    } catch {}
  }, [paymentGatewayAuditLogs]);

  const activePaymentGateways = useMemo(() => {
    return paymentGateways
      .filter((gw) => gw.isActive)
      .sort((a, b) => a.displayPriority - b.displayPriority);
  }, [paymentGateways]);

  // UI / Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | 'all'>('all');
  const [selectedBrand, setSelectedBrand] = useState<string | 'all'>('all');
  const [sortBy, setSortBy] = useState<'featured' | 'price_low' | 'price_high' | 'rating' | 'discount'>('featured');
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);

  // Modals state
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [selectedProductForDetail, setSelectedProductForDetail] = useState<Product | null>(null);
  const [selectedOrderForModal, setSelectedOrderForModal] = useState<Order | null>(null);
  const [qrModalData, setQrModalData] = useState<{ title: string; qrValue: string; subtitle?: string; qrImage?: string } | null>(null);
  const [selectedPolicyType, setSelectedPolicyType] = useState<string | null>(null);

  // Sync state to local storage on changes
  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}products`, JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}outlets`, JSON.stringify(outlets));
  }, [outlets]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}activeOutletId`, activeOutletId);
  }, [activeOutletId]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}ownershipModels`, JSON.stringify(ownershipModels));
  }, [ownershipModels]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}businessCategories`, JSON.stringify(businessCategories));
  }, [businessCategories]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}participants`, JSON.stringify(participants));
  }, [participants]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}payoutItems`, JSON.stringify(payoutItems));
  }, [payoutItems]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}financialLedger`, JSON.stringify(financialLedger));
  }, [financialLedger]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}barcodeRecords`, JSON.stringify(barcodeRecords));
  }, [barcodeRecords]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}stockTransfers`, JSON.stringify(stockTransfers));
  }, [stockTransfers]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}franchiseAgreements`, JSON.stringify(franchiseAgreements));
  }, [franchiseAgreements]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}cart`, JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}orders`, JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}stockMovements`, JSON.stringify(stockMovements));
  }, [stockMovements]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}campaigns`, JSON.stringify(campaigns));
  }, [campaigns]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}coupons`, JSON.stringify(coupons));
  }, [coupons]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}settings`, JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}user`, JSON.stringify(currentUser));
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}currentRole`, currentRole);
  }, [currentRole]);

  // Enforce strict store isolation for non-super-admin store accounts
  useEffect(() => {
    if (isAuthenticated && currentUser.role === 'store_manager') {
      if (currentRole !== 'store_manager') {
        setCurrentRoleState('store_manager');
      }
      if (currentUser.storeId && activeOutletId !== currentUser.storeId) {
        setActiveOutletId(currentUser.storeId);
      }
    } else if (isAuthenticated && currentUser.role === 'delivery_staff') {
      if (currentRole !== 'delivery_staff') {
        setCurrentRoleState('delivery_staff');
      }
    }
  }, [isAuthenticated, currentUser, currentRole, activeOutletId]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}accounts`, JSON.stringify(accounts));
  }, [accounts]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}isAuthenticated`, JSON.stringify(isAuthenticated));
  }, [isAuthenticated]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}wishlist`, JSON.stringify(wishlist));
  }, [wishlist]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}deliveryZones`, JSON.stringify(deliveryZones));
  }, [deliveryZones]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}bulkDiscountRules`, JSON.stringify(bulkDiscountRules));
  }, [bulkDiscountRules]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}brandingSettings`, JSON.stringify(brandingSettings));
    if (typeof document !== 'undefined') {
      const root = document.documentElement;
      root.style.setProperty('--brand-primary', brandingSettings.theme.primaryColor);
      root.style.setProperty('--brand-secondary', brandingSettings.theme.secondaryColor);
      root.style.setProperty('--brand-accent', brandingSettings.theme.accentColor);
      root.style.setProperty('--brand-font', brandingSettings.theme.fontFamily);
    }
  }, [brandingSettings]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}brandingHistory`, JSON.stringify(brandingHistory));
  }, [brandingHistory]);

  // Check URL query parameters for deep linking (e.g. ?trackOrder=JE-2026-000101)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const trackId = params.get('trackOrder');
      if (trackId) {
        const found = orders.find((o) => o.id === trackId);
        if (found) {
          setSelectedOrderForModal(found);
          setActiveModal('order_tracking');
        }
      }
    }
  }, [orders]);

  // Cart financial calculations
  const cartSubtotal = useMemo(() => {
    return cart.reduce((sum, item) => {
      const unitPrice = item.product.dealPrice || item.product.regularPrice;
      return sum + unitPrice * item.quantity;
    }, 0);
  }, [cart]);

  const isFreeDeliveryEligible = cartSubtotal >= settings.freeDeliveryThreshold;
  const amountNeededForFreeDelivery = Math.max(0, settings.freeDeliveryThreshold - cartSubtotal);

  const cartCouponDiscount = useMemo(() => {
    if (!appliedCoupon) return 0;
    if (cartSubtotal < appliedCoupon.minOrderValue) return 0;

    if (appliedCoupon.discountType === 'fixed') {
      return Math.min(appliedCoupon.value, cartSubtotal);
    } else if (appliedCoupon.discountType === 'percentage') {
      const calculated = (cartSubtotal * appliedCoupon.value) / 100;
      return appliedCoupon.maxDiscount ? Math.min(calculated, appliedCoupon.maxDiscount) : calculated;
    } else if (appliedCoupon.discountType === 'free_delivery') {
      return settings.deliveryFee;
    }
    return 0;
  }, [appliedCoupon, cartSubtotal, settings.deliveryFee]);

  const cartDeliveryFee = useMemo(() => {
    if (cart.length === 0) return 0;
    if (isFreeDeliveryEligible || appliedCoupon?.discountType === 'free_delivery') {
      return 0;
    }
    return settings.deliveryFee;
  }, [cart.length, isFreeDeliveryEligible, appliedCoupon, settings.deliveryFee]);

  // Dynamic Bulk Volume Discount Evaluation
  const cartBulkDiscount = useMemo(() => {
    return evaluateCartBulkDiscount({
      cart,
      rules: bulkDiscountRules,
      isB2B: currentUser.role !== 'customer',
      activeOutletId,
      cartSubtotal,
    });
  }, [cart, bulkDiscountRules, currentUser.role, activeOutletId, cartSubtotal]);

  const cartTotalDiscount = cartCouponDiscount + cartBulkDiscount.discountAmount;

  const cartFinalTotal = useMemo(() => {
    if (cart.length === 0) return 0;
    const base = cartSubtotal - cartCouponDiscount - cartBulkDiscount.discountAmount + cartDeliveryFee;
    return Math.max(0, Math.round(base));
  }, [cart.length, cartSubtotal, cartCouponDiscount, cartBulkDiscount.discountAmount, cartDeliveryFee]);

  // Comprehensive Indian GST Calculation on Cart
  const cartGstCalculation = useMemo(() => {
    return calculateOrderGstBreakdown({
      items: cart.map((it) => ({
        product: it.product,
        quantity: it.quantity,
        unitPrice: it.product.dealPrice || it.product.regularPrice,
        variant: it.selectedVariant,
      })),
      couponDiscount: cartCouponDiscount + cartBulkDiscount.discountAmount,
      deliveryFee: cartDeliveryFee,
      customerState: currentUser.savedAddresses[0]?.state || 'Uttar Pradesh',
      supplierStateCode: settings.gstStateCode || '09',
    });
  }, [cart, cartCouponDiscount, cartBulkDiscount.discountAmount, cartDeliveryFee, currentUser.savedAddresses, settings.gstStateCode]);

  const cartTaxAmount = cartGstCalculation.totalTax;

  // Cart operations
  const addToCart = (product: Product, quantity = 1, variant?: string) => {
    const availableStock = product.stock.onHand - product.stock.reserved;
    const existingItem = cart.find(
      (item) => item.productId === product.id && item.selectedVariant === variant
    );
    const currentInCart = existingItem ? existingItem.quantity : 0;

    if (currentInCart + quantity > availableStock) {
      return {
        success: false,
        message: `Only ${availableStock} units available in stock.`,
      };
    }

    if (existingItem) {
      setCart((prev) =>
        prev.map((item) =>
          item.productId === product.id && item.selectedVariant === variant
            ? { ...item, quantity: item.quantity + quantity }
            : item
        )
      );
    } else {
      setCart((prev) => [...prev, { productId: product.id, quantity, selectedVariant: variant, product }]);
    }

    return {
      success: true,
      message: `Added ${product.name} to cart.`,
    };
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.productId !== productId));
  };

  const updateCartQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    const item = cart.find((i) => i.productId === productId);
    if (!item) return;

    const availableStock = item.product.stock.onHand - item.product.stock.reserved;
    if (quantity > availableStock) {
      return;
    }

    setCart((prev) =>
      prev.map((i) => (i.productId === productId ? { ...i, quantity } : i))
    );
  };

  const clearCart = () => {
    setCart([]);
    setAppliedCoupon(null);
  };

  const applyCoupon = (code: string) => {
    const normalized = code.trim().toUpperCase();
    const coupon = coupons.find((c) => c.code.toUpperCase() === normalized && c.isActive);

    if (!coupon) {
      return { success: false, message: 'Invalid or expired coupon code.' };
    }

    if (new Date(coupon.validUntil) < new Date()) {
      return { success: false, message: 'This coupon has expired.' };
    }

    if (cartSubtotal < coupon.minOrderValue) {
      return {
        success: false,
        message: `Requires a minimum cart value of ₹${coupon.minOrderValue}.`,
      };
    }

    setAppliedCoupon(coupon);
    return { success: true, message: `Coupon ${coupon.code} applied successfully!` };
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
  };

  // Order creation with atomic stock reservation
  const createOrder = async (payload: {
    customer: Order['customer'];
    deliveryType: DeliveryType;
    deliverySlot?: string;
    paymentMethod: PaymentMethod;
    isWhatsAppCheckout?: boolean;
  }): Promise<Order> => {
    // 1. Generate collision-safe unique ID
    const count = orders.length + 104;
    const orderId = `JE-2026-${count.toString().padStart(6, '0')}`;
    const invoiceNumber = `INV-2026-${count.toString().padStart(6, '0')}`;
    const nowIso = new Date().toISOString();

    // 2. Validate & reserve stock atomically
    const newProducts = [...products];
    const newStockMovements: StockMovement[] = [];

    const deliveryFeeActual = payload.deliveryType === 'store_pickup' ? 0 : cartDeliveryFee;
    const finalAmount = payload.deliveryType === 'store_pickup'
      ? Math.max(0, cartSubtotal - cartCouponDiscount - cartBulkDiscount.discountAmount)
      : cartFinalTotal;

    // Calculate comprehensive GST breakdown for the order
    const gstCalc = calculateOrderGstBreakdown({
      items: cart.map((cartItem) => {
        const prod = products.find((p) => p.id === cartItem.productId) || cartItem.product;
        return {
          product: prod,
          quantity: cartItem.quantity,
          unitPrice: prod.dealPrice || prod.regularPrice,
          variant: cartItem.selectedVariant,
        };
      }),
      couponDiscount: cartCouponDiscount + cartBulkDiscount.discountAmount,
      deliveryFee: deliveryFeeActual,
      customerState: payload.customer.state || 'Uttar Pradesh',
      supplierStateCode: settings.gstStateCode || '09',
    });

    const isB2B = !!payload.customer.isB2B || !!payload.customer.gstin;
    const eWayBillNumber = finalAmount >= (settings.eWayBillThreshold || 50000)
      ? `EWB-09-${Date.now().toString().slice(-8)}`
      : undefined;

    const orderItems = cart.map((cartItem) => {
      const prodIndex = newProducts.findIndex((p) => p.id === cartItem.productId);
      const prod = newProducts[prodIndex];
      const available = prod.stock.onHand - prod.stock.reserved;

      if (available < cartItem.quantity) {
        throw new Error(`Insufficient stock for ${prod.name}. Available: ${available}`);
      }

      // Atomically increment reserved stock
      const prevReserved = prod.stock.reserved;
      newProducts[prodIndex] = {
        ...prod,
        stock: {
          ...prod.stock,
          reserved: prevReserved + cartItem.quantity,
        },
      };

      // Record stock movement
      newStockMovements.push({
        id: `sm-${Date.now()}-${cartItem.productId}`,
        productId: prod.id,
        productName: prod.name,
        type: 'reserved',
        quantity: cartItem.quantity,
        previousStock: prod.stock.onHand - prevReserved,
        newStock: prod.stock.onHand - (prevReserved + cartItem.quantity),
        referenceId: orderId,
        note: payload.isWhatsAppCheckout
          ? `Stock reserved via WhatsApp Order ${orderId}`
          : `Stock reserved for Order ${orderId}`,
        timestamp: nowIso,
        staffName: 'Online Store Engine',
        outletId: activeOutlet?.id,
        outletName: activeOutlet?.name,
      });

      const unitPrice = prod.dealPrice || prod.regularPrice;
      const hsnCode = getHsnForProduct(prod);
      const itemGst = gstCalc.itemsBreakdown.find((ib) => ib.productId === prod.id);

      return {
        productId: prod.id,
        productName: prod.name,
        sku: prod.sku,
        brand: prod.brand,
        image: prod.images[0] || '',
        variant: cartItem.selectedVariant,
        quantity: cartItem.quantity,
        mrp: prod.mrp,
        unitPrice,
        purchaseCost: prod.purchaseCost,
        gstRate: prod.gstRate,
        hsnCode,
        taxableValue: itemGst?.taxableValue,
        cgstAmount: itemGst?.cgstAmount,
        sgstAmount: itemGst?.sgstAmount,
        igstAmount: itemGst?.igstAmount,
        total: unitPrice * cartItem.quantity,
      };
    });

    // 3. Determine initial order status
    const initialStatus: OrderStatus = payload.isWhatsAppCheckout
      ? 'awaiting_whatsapp_confirmation'
      : payload.paymentMethod === 'cod' || payload.paymentMethod === 'store_pickup_pay'
      ? 'confirmed'
      : 'payment_pending';

    const paymentStatus: PaymentStatus =
      payload.paymentMethod === 'cod' || payload.paymentMethod === 'store_pickup_pay'
        ? 'pending'
        : 'pending';

    // 4. Generate dynamic QR code for order
    const trackingUrl = buildOrderTrackingUrl(orderId);
    let qrCodeDataUrl = '';
    try {
      qrCodeDataUrl = await generateQrDataUrl(trackingUrl, { width: 300 });
    } catch (e) {
      console.warn('QR code generation fallback', e);
    }

    // Calculate geospatial distance, ETA, and suggested route
    const outletCoords = activeOutlet?.coordinates || DEFAULT_STORE_COORDINATES;
    const customerCoords = payload.customer.coordinates || { lat: 26.8482, lng: 80.9412 };
    const distanceKm = payload.deliveryType === 'delivery'
      ? calculateHaversineDistanceKm(outletCoords, customerCoords)
      : 0;
    const eta = estimateDeliveryMinutes(distanceKm);
    const suggestedSteps = payload.deliveryType === 'delivery'
      ? generateSuggestedRouteSteps(activeOutlet?.name || 'Store Hub', payload.customer.area || 'Customer Address', distanceKm)
      : [];
    const navigationUrl = payload.deliveryType === 'delivery'
      ? getGoogleMapsNavigationUrl(outletCoords, customerCoords, payload.customer.name)
      : undefined;

    const newOrder: Order = {
      id: orderId,
      invoiceNumber,
      createdAt: nowIso,
      outletId: activeOutlet?.id,
      outletName: activeOutlet?.name,
      customer: {
        ...payload.customer,
        isB2B,
        placeOfSupply: gstCalc.placeOfSupply,
        stateCode: gstCalc.customerGstCode,
      },
      items: orderItems,
      subtotal: cartSubtotal,
      discountTotal: cartCouponDiscount + cartBulkDiscount.discountAmount,
      couponCode: appliedCoupon?.code,
      couponDiscount: cartCouponDiscount,
      bulkDiscountAmount: cartBulkDiscount.discountAmount,
      appliedBulkRuleId: cartBulkDiscount.ruleId,
      appliedBulkRuleName: cartBulkDiscount.ruleName,
      deliveryFee: deliveryFeeActual,
      taxAmount: gstCalc.totalTax,
      taxableAmount: gstCalc.taxableAmount,
      cgstAmount: gstCalc.cgstAmount,
      sgstAmount: gstCalc.sgstAmount,
      igstAmount: gstCalc.igstAmount,
      placeOfSupply: gstCalc.placeOfSupply,
      isB2BOrder: isB2B,
      b2bGstin: payload.customer.gstin,
      b2bBusinessName: payload.customer.businessName,
      eWayBillNumber,
      hsnSummary: gstCalc.hsnSummary,
      finalTotal: finalAmount,
      deliveryType: payload.deliveryType,
      deliverySlot: payload.deliverySlot,
      paymentMethod: payload.paymentMethod,
      paymentStatus,
      orderStatus: initialStatus,
      statusHistory: [
        {
          status: initialStatus,
          timestamp: nowIso,
          note: payload.isWhatsAppCheckout
            ? 'Order initiated via WhatsApp Checkout; awaiting verification'
            : payload.paymentMethod === 'cod'
            ? 'Order placed with Cash on Delivery'
            : 'Order placed; waiting for payment confirmation',
          updatedBy: payload.customer.name,
        },
      ],
      deliveryCoordinates: payload.deliveryType === 'delivery' ? customerCoords : undefined,
      outletCoordinates: outletCoords,
      distanceKm,
      estimatedDeliveryMinutes: eta.min,
      suggestedRoute: {
        distanceText: `${distanceKm} km`,
        durationText: eta.label,
        steps: suggestedSteps,
        navigationUrl,
      },
      qrCodeDataUrl,
      whatsappMessageSent: !!payload.isWhatsAppCheckout,
    };

    // Save pinned location into customer's saved addresses for next orders
    if (payload.customer.coordinates && payload.deliveryType === 'delivery') {
      setCurrentUser((prev) => {
        const existingIdx = prev.savedAddresses.findIndex(
          (a) => a.addressLine.toLowerCase().trim() === payload.customer.address.toLowerCase().trim()
        );
        if (existingIdx >= 0) {
          const updated = [...prev.savedAddresses];
          updated[existingIdx] = {
            ...updated[existingIdx],
            coordinates: payload.customer.coordinates,
            tag: payload.customer.tag || updated[existingIdx].tag || 'Home',
          };
          return { ...prev, savedAddresses: updated };
        } else {
          const newAddress: Address = {
            id: `addr-${Date.now()}`,
            fullName: payload.customer.name,
            phone: payload.customer.phone,
            addressLine: payload.customer.address,
            area: payload.customer.area,
            city: payload.customer.city,
            state: payload.customer.state,
            pincode: payload.customer.pincode,
            landmark: payload.customer.landmark,
            coordinates: payload.customer.coordinates,
            tag: payload.customer.tag || 'Home',
          };
          return { ...prev, savedAddresses: [newAddress, ...prev.savedAddresses] };
        }
      });
    }

    // Update state
    setProducts(newProducts);
    setStockMovements((prev) => [...newStockMovements, ...prev]);
    setOrders((prev) => [newOrder, ...prev]);

    // If bulk discount rule was applied, record analytics
    if (cartBulkDiscount.ruleId && cartBulkDiscount.discountAmount > 0) {
      setBulkDiscountRules((prev) =>
        prev.map((r) =>
          r.id === cartBulkDiscount.ruleId
            ? {
                ...r,
                timesApplied: (r.timesApplied || 0) + 1,
                totalSavingsGranted: (r.totalSavingsGranted || 0) + cartBulkDiscount.discountAmount,
                updatedAt: nowIso,
              }
            : r
        )
      );
    }

    // If coupon was used, increment usage count
    if (appliedCoupon) {
      setCoupons((prev) =>
        prev.map((c) => (c.id === appliedCoupon.id ? { ...c, timesUsed: c.timesUsed + 1 } : c))
      );
    }

    // Clear cart
    clearCart();

    return newOrder;
  };

  // Status transitions & inventory reconciliation
  const updateOrderStatus = (
    orderId: string,
    newStatus: OrderStatus,
    note?: string,
    updatedBy: string = 'Authorized Staff'
  ) => {
    setOrders((prev) =>
      prev.map((order) => {
        if (order.id !== orderId) return order;

        const previousStatus = order.orderStatus;
        const nowIso = new Date().toISOString();

        // 1. If transitioning to CANCELLED: release reserved stock back
        if (newStatus === 'cancelled' && previousStatus !== 'cancelled') {
          setProducts((currProducts) =>
            currProducts.map((p) => {
              const orderedItem = order.items.find((item) => item.productId === p.id);
              if (!orderedItem) return p;

              const releasedQty = orderedItem.quantity;
              const newReserved = Math.max(0, p.stock.reserved - releasedQty);

              setStockMovements((sm) => [
                {
                  id: `sm-rel-${Date.now()}-${p.id}`,
                  productId: p.id,
                  productName: p.name,
                  type: 'reservation_released',
                  quantity: releasedQty,
                  previousStock: p.stock.onHand - p.stock.reserved,
                  newStock: p.stock.onHand - newReserved,
                  referenceId: orderId,
                  note: `Released reservation upon order cancellation (${note || 'Customer / Staff action'})`,
                  timestamp: nowIso,
                  staffName: updatedBy,
                },
                ...sm,
              ]);

              return {
                ...p,
                stock: {
                  ...p.stock,
                  reserved: newReserved,
                },
              };
            })
          );
        }

        // 2. If transitioning to DELIVERED or CONFIRMED from pending: deduct permanently from onHand
        if (
          (newStatus === 'delivered' && previousStatus !== 'delivered') ||
          (newStatus === 'confirmed' && previousStatus === 'awaiting_whatsapp_confirmation')
        ) {
          if (newStatus === 'delivered') {
            setProducts((currProducts) =>
              currProducts.map((p) => {
                const orderedItem = order.items.find((item) => item.productId === p.id);
                if (!orderedItem) return p;

                const qty = orderedItem.quantity;
                const newOnHand = Math.max(0, p.stock.onHand - qty);
                const newReserved = Math.max(0, p.stock.reserved - qty);

                setStockMovements((sm) => [
                  {
                    id: `sm-sold-${Date.now()}-${p.id}`,
                    productId: p.id,
                    productName: p.name,
                    type: 'sold',
                    quantity: qty,
                    previousStock: p.stock.onHand,
                    newStock: newOnHand,
                    referenceId: orderId,
                    note: `Stock permanently committed upon order delivery`,
                    timestamp: nowIso,
                    staffName: updatedBy,
                  },
                  ...sm,
                ]);

                return {
                  ...p,
                  stock: {
                    ...p.stock,
                    onHand: newOnHand,
                    reserved: newReserved,
                  },
                };
              })
            );
          }
        }

        const newPaymentStatus: PaymentStatus =
          newStatus === 'delivered' && order.paymentMethod === 'cod'
            ? 'verified_paid'
            : order.paymentStatus;

        return {
          ...order,
          orderStatus: newStatus,
          paymentStatus: newPaymentStatus,
          statusHistory: [
            ...order.statusHistory,
            {
              status: newStatus,
              timestamp: nowIso,
              note: note || `Order status updated to ${newStatus}`,
              updatedBy,
            },
          ],
        };
      })
    );
  };

  const verifyOrderPayment = (orderId: string, transactionId?: string) => {
    const txId = transactionId || `TXN-UPI-${Math.floor(1000000000 + Math.random() * 9000000000)}`;
    const nowIso = new Date().toISOString();

    setOrders((prev) =>
      prev.map((order) => {
        if (order.id !== orderId) return order;
        return {
          ...order,
          paymentStatus: 'verified_paid',
          orderStatus: order.orderStatus === 'payment_pending' || order.orderStatus === 'awaiting_whatsapp_confirmation' ? 'confirmed' : order.orderStatus,
          paymentDetails: {
            transactionId: txId,
            paidAt: nowIso,
            verifiedBy: 'Secure Payment Gateway Webhook',
          },
          statusHistory: [
            ...order.statusHistory,
            {
              status: 'paid',
              timestamp: nowIso,
              note: `Payment verified successfully (Ref: ${txId})`,
              updatedBy: 'Razorpay / UPI Gateway',
            },
          ],
        };
      })
    );
  };

  const assignDeliveryStaff = (orderId: string, staffId: string, staffName: string) => {
    const nowIso = new Date().toISOString();
    setOrders((prev) =>
      prev.map((order) => {
        if (order.id !== orderId) return order;
        return {
          ...order,
          assignedDeliveryStaffId: staffId,
          deliveryStaffName: staffName,
          orderStatus: 'assigned_to_delivery',
          statusHistory: [
            ...order.statusHistory,
            {
              status: 'assigned_to_delivery',
              timestamp: nowIso,
              note: `Assigned to delivery agent ${staffName}`,
              updatedBy: 'Store Dispatcher',
            },
          ],
        };
      })
    );
  };

  const completeDelivery = (
    orderId: string,
    proof: { collectedAmount?: number; note?: string; receiverName?: string }
  ) => {
    const nowIso = new Date().toISOString();
    const orderToUpdate = orders.find((o) => o.id === orderId);

    // Increment rider's COD cash in hand if COD cash was collected
    if (proof.collectedAmount && proof.collectedAmount > 0) {
      const targetRiderId =
        orderToUpdate?.dispatchDetails?.riderId ||
        orderToUpdate?.assignedDeliveryStaffId ||
        'rider-1';
      setRidersList((prev) =>
        prev.map((r) =>
          r.id === targetRiderId
            ? { ...r, codCashInHand: (r.codCashInHand || 0) + Number(proof.collectedAmount) }
            : r
        )
      );
    }

    setOrders((prev) =>
      prev.map((order) => {
        if (order.id !== orderId) return order;
        return {
          ...order,
          orderStatus: 'delivered',
          paymentStatus: 'verified_paid',
          deliveryProof: {
            ...proof,
            timestamp: nowIso,
          },
          dispatchDetails: order.dispatchDetails
            ? {
                ...order.dispatchDetails,
                codCollectedStatus: 'collected',
                codCollectedAt: nowIso,
                codCollectedMethod: 'cash',
              }
            : undefined,
          statusHistory: [
            ...order.statusHistory,
            {
              status: 'delivered',
              timestamp: nowIso,
              note: proof.note || `Delivered successfully to ${proof.receiverName || order.customer.name}`,
              updatedBy: order.deliveryStaffName || 'Delivery Partner',
            },
          ],
        };
      })
    );

    // Also deduct stock permanently
    if (orderToUpdate) {
      updateOrderStatus(orderId, 'delivered', 'Delivery completed and confirmed by rider', orderToUpdate.deliveryStaffName || 'Rider');
    }
  };

  const reportDeliveryFailure = (orderId: string, reason: string) => {
    const nowIso = new Date().toISOString();
    setOrders((prev) =>
      prev.map((order) => {
        if (order.id !== orderId) return order;
        return {
          ...order,
          orderStatus: 'delivery_failed',
          failureReason: reason,
          statusHistory: [
            ...order.statusHistory,
            {
              status: 'delivery_failed',
              timestamp: nowIso,
              note: `Delivery attempt failed: ${reason}`,
              updatedBy: order.deliveryStaffName || 'Delivery Partner',
            },
          ],
        };
      })
    );
  };

  const requestOrderCancellation = (orderId: string, reason: string) => {
    updateOrderStatus(orderId, 'cancelled', reason, 'Customer Request');
  };

  const cancelOrderOrItems = (
    orderId: string,
    cancellations: CancelItemRequest[],
    options?: {
      cancelledBy?: string;
      generalNotes?: string;
      primaryReason?: ItemCancellationReason;
    }
  ): { success: boolean; message: string; order?: Order } => {
    const targetOrder = orders.find((o) => o.id === orderId);
    if (!targetOrder) {
      return { success: false, message: `Order #${orderId} not found.` };
    }

    if (targetOrder.orderStatus === 'cancelled') {
      return { success: false, message: `Order #${orderId} is already fully cancelled.` };
    }

    if (targetOrder.orderStatus === 'delivered') {
      return {
        success: false,
        message: 'Delivered orders cannot be cancelled from store fulfillment. Please initiate a 7-day return instead.',
      };
    }

    const nowIso = new Date().toISOString();
    const cancelledBy = options?.cancelledBy || currentUser.name || 'Store Manager';
    const primaryReason = options?.primaryReason || cancellations[0]?.reason || 'short_stock';

    // 1. Process items and validate quantities
    let totalItemsCancelledCount = 0;
    const newItems = targetOrder.items.map((item) => {
      const match = cancellations.find((c) => c.productId === item.productId);
      if (!match || match.cancelQuantity <= 0) {
        return item;
      }

      const currentActive = item.activeQuantity !== undefined ? item.activeQuantity : item.quantity;
      const qtyToCancel = Math.min(match.cancelQuantity, currentActive);
      if (qtyToCancel <= 0) {
        return item;
      }

      totalItemsCancelledCount += qtyToCancel;
      const newCancelledQty = (item.cancelledQuantity || 0) + qtyToCancel;
      const newActiveQty = Math.max(0, item.quantity - newCancelledQty);
      const newTotal = newActiveQty * item.unitPrice;

      return {
        ...item,
        cancelledQuantity: newCancelledQty,
        activeQuantity: newActiveQty,
        cancellationReason: match.reason,
        cancellationNote: match.note || options?.generalNotes,
        cancelledAt: nowIso,
        cancelledBy,
        disposition: match.disposition,
        total: newTotal,
      };
    });

    if (totalItemsCancelledCount === 0) {
      return { success: false, message: 'No valid item quantities were selected for cancellation.' };
    }

    // 2. Adjust physical inventory & reserved stock
    const newMovements: StockMovement[] = [];
    setProducts((currProducts) =>
      currProducts.map((p) => {
        const match = cancellations.find((c) => c.productId === p.id);
        if (!match || match.cancelQuantity <= 0) return p;

        const orderedItem = targetOrder.items.find((it) => it.productId === p.id);
        if (!orderedItem) return p;

        const currentActive = orderedItem.activeQuantity !== undefined ? orderedItem.activeQuantity : orderedItem.quantity;
        const qtyToCancel = Math.min(match.cancelQuantity, currentActive);
        if (qtyToCancel <= 0) return p;

        // Release reservation
        const newReserved = Math.max(0, p.stock.reserved - qtyToCancel);
        let newOnHand = p.stock.onHand;
        let movementType: StockMovementType = 'reservation_released';
        let movementNote = `Released ${qtyToCancel}x reservation for order #${orderId}`;

        if (match.disposition === 'scrap_damaged') {
          newOnHand = Math.max(0, p.stock.onHand - qtyToCancel);
          movementType = 'damaged';
          movementNote = `Written off ${qtyToCancel}x damaged unit(s) found during order #${orderId} fulfillment (${match.note || 'Defective/Damaged in store'})`;
        } else if (match.disposition === 'write_off_expired') {
          newOnHand = Math.max(0, p.stock.onHand - qtyToCancel);
          movementType = 'adjustment';
          movementNote = `Written off ${qtyToCancel}x expired/obsolete unit(s) during order #${orderId} picking (${match.note || 'Past expiry / shelf-life'})`;
        } else if (match.disposition === 'stock_discrepancy') {
          newOnHand = Math.max(0, p.stock.onHand - qtyToCancel);
          movementType = 'adjustment';
          movementNote = `Adjusted stock shortage: ${qtyToCancel}x missing/short unit(s) during order #${orderId} picking (${match.note || 'Inventory discrepancy'})`;
        } else {
          movementType = 'reservation_released';
          movementNote = `Released reservation: ${qtyToCancel}x unit(s) returned to available stock for order #${orderId}`;
        }

        newMovements.push({
          id: `sm-cancel-${Date.now()}-${p.id}`,
          productId: p.id,
          productName: p.name,
          type: movementType,
          quantity: qtyToCancel,
          previousStock: p.stock.onHand,
          newStock: newOnHand,
          referenceId: orderId,
          note: movementNote,
          timestamp: nowIso,
          staffName: cancelledBy,
        });

        return {
          ...p,
          stock: {
            ...p.stock,
            onHand: newOnHand,
            reserved: newReserved,
          },
        };
      })
    );

    if (newMovements.length > 0) {
      setStockMovements((prev) => [...newMovements, ...prev]);
    }

    // 3. Recalculate order financials
    const activeItems = newItems.filter((i) => (i.activeQuantity ?? i.quantity) > 0);
    const isFullCancellation = activeItems.length === 0;

    const originalSubtotal = targetOrder.originalSubtotal ?? targetOrder.subtotal;
    const originalTotal = targetOrder.originalTotal ?? targetOrder.finalTotal;

    let newStatus: OrderStatus = 'partially_cancelled';
    let newSubtotal = 0;
    let newTaxAmount = 0;
    let newTaxableAmount = 0;
    let newCgstAmount = 0;
    let newSgstAmount = 0;
    let newIgstAmount = 0;
    let newDeliveryFee = targetOrder.deliveryFee;
    let newCouponDiscount = targetOrder.couponDiscount;
    let newBulkDiscount = targetOrder.bulkDiscountAmount || 0;
    let newFinalTotal = 0;
    let netRefundAmount = 0;

    if (isFullCancellation) {
      newStatus = 'cancelled';
      newSubtotal = 0;
      newTaxAmount = 0;
      newTaxableAmount = 0;
      newCgstAmount = 0;
      newSgstAmount = 0;
      newIgstAmount = 0;
      newDeliveryFee = 0;
      newCouponDiscount = 0;
      newBulkDiscount = 0;
      newFinalTotal = 0;
      netRefundAmount = originalTotal;
    } else {
      newSubtotal = activeItems.reduce((acc, it) => acc + (it.unitPrice * (it.activeQuantity ?? it.quantity)), 0);

      // Re-evaluate bulk discount on remaining items
      const recalculatedBulk = evaluateCartBulkDiscount({
        cart: activeItems.map((it) => {
          const prod = products.find((p) => p.id === it.productId) || ({
            ...(products[0] || {}),
            id: it.productId,
            name: it.productName,
            sku: it.sku,
            brand: it.brand,
            dealPrice: it.unitPrice,
            regularPrice: it.mrp,
            mrp: it.mrp,
            purchaseCost: it.purchaseCost,
            gstRate: it.gstRate,
            hsnCode: it.hsnCode,
          } as Product);

          return {
            productId: it.productId,
            quantity: it.activeQuantity ?? it.quantity,
            selectedVariant: it.variant,
            product: prod,
          };
        }),
        rules: bulkDiscountRules,
        isB2B: !!targetOrder.isB2BOrder,
        activeOutletId,
        cartSubtotal: newSubtotal,
      });

      newBulkDiscount = recalculatedBulk.discountAmount;

      // Adjust coupon discount proportionally if applicable
      if (newCouponDiscount > 0 && originalSubtotal > 0) {
        newCouponDiscount = Math.round((newCouponDiscount * (newSubtotal / originalSubtotal)) * 100) / 100;
      }

      // Check free delivery threshold
      if (targetOrder.deliveryType === 'store_pickup') {
        newDeliveryFee = 0;
      } else if (newSubtotal >= settings.freeDeliveryThreshold) {
        newDeliveryFee = 0;
      }

      // Recalculate GST breakdown on active items
      const gstCalc = calculateOrderGstBreakdown({
        items: activeItems.map((it) => {
          const prod = products.find((p) => p.id === it.productId) || ({
            ...(products[0] || {}),
            id: it.productId,
            name: it.productName,
            sku: it.sku,
            brand: it.brand,
            dealPrice: it.unitPrice,
            regularPrice: it.mrp,
            mrp: it.mrp,
            purchaseCost: it.purchaseCost,
            gstRate: it.gstRate,
            hsnCode: it.hsnCode,
          } as Product);

          return {
            product: prod,
            quantity: it.activeQuantity ?? it.quantity,
            unitPrice: it.unitPrice,
            variant: it.variant,
          };
        }),
        couponDiscount: newCouponDiscount + newBulkDiscount,
        deliveryFee: newDeliveryFee,
        customerState: targetOrder.customer.state || 'Uttar Pradesh',
        supplierStateCode: settings.gstStateCode || '09',
      });

      newTaxAmount = gstCalc.totalTax;
      newTaxableAmount = gstCalc.taxableAmount;
      newCgstAmount = gstCalc.cgstAmount;
      newSgstAmount = gstCalc.sgstAmount;
      newIgstAmount = gstCalc.igstAmount;

      newFinalTotal = Math.max(0, newSubtotal - newCouponDiscount - newBulkDiscount + newDeliveryFee);
      netRefundAmount = Math.max(0, originalTotal - newFinalTotal);
    }

    // Determine refund status and note
    let refundStatus: 'none' | 'pending' | 'processed' | 'cod_adjusted' = 'none';
    let refundNote = '';

    if (netRefundAmount > 0) {
      if (targetOrder.paymentMethod === 'cod') {
        refundStatus = 'cod_adjusted';
        refundNote = `Doorstep COD collection amount reduced from ₹${originalTotal.toLocaleString('en-IN')} to ₹${newFinalTotal.toLocaleString('en-IN')}`;
      } else {
        refundStatus = 'processed';
        refundNote = `Auto-refund of ₹${netRefundAmount.toLocaleString('en-IN')} initiated to customer's source account (UPI/Card)`;
      }
    }

    const cancellationReasonLabels: Record<ItemCancellationReason, string> = {
      short_stock: 'Store Stock Shortage',
      damaged: 'Defective / Damaged in Store',
      expired: 'Expired / Past Shelf Life',
      customer_request: 'Customer Request',
      pricing_discrepancy: 'Pricing / Barcode Discrepancy',
      other: 'Store Fulfillment Discrepancy',
    };

    const reasonSummary = cancellationReasonLabels[primaryReason] || primaryReason;
    const logNote = isFullCancellation
      ? `Full order cancellation executed by store due to: ${reasonSummary}. ${options?.generalNotes || ''}. ${refundNote}`
      : `Partial cancellation: ${totalItemsCancelledCount} item unit(s) cancelled due to: ${reasonSummary}. ${options?.generalNotes || ''}. ${refundNote}`;

    const updatedOrder: Order = {
      ...targetOrder,
      items: newItems,
      orderStatus: newStatus,
      originalSubtotal,
      originalTotal,
      subtotal: newSubtotal,
      finalTotal: newFinalTotal,
      taxAmount: newTaxAmount,
      taxableAmount: newTaxableAmount,
      cgstAmount: newCgstAmount,
      sgstAmount: newSgstAmount,
      igstAmount: newIgstAmount,
      deliveryFee: newDeliveryFee,
      couponDiscount: newCouponDiscount,
      bulkDiscountAmount: newBulkDiscount,
      refundedAmount: (targetOrder.refundedAmount || 0) + netRefundAmount,
      refundStatus,
      cancellationDetails: {
        type: isFullCancellation ? 'full' : 'partial',
        cancelledAt: nowIso,
        cancelledBy,
        primaryReason,
        generalNotes: options?.generalNotes,
        itemsCancelledCount: totalItemsCancelledCount,
        totalRefundAmount: netRefundAmount,
        refundStatus,
        refundMethod: targetOrder.paymentMethod === 'cod' ? 'COD Bill Reduction' : 'Original Payment Source',
        refundReference: targetOrder.paymentMethod === 'cod' ? undefined : `RFD-JE-${Date.now().toString().slice(-6)}`,
      },
      statusHistory: [
        ...targetOrder.statusHistory,
        {
          status: newStatus,
          timestamp: nowIso,
          note: logNote,
          updatedBy: cancelledBy,
        },
      ],
    };

    setOrders((prev) => prev.map((o) => (o.id === orderId ? updatedOrder : o)));
    if (selectedOrderForModal && selectedOrderForModal.id === orderId) {
      setSelectedOrderForModal(updatedOrder);
    }

    return {
      success: true,
      message: isFullCancellation
        ? `Order #${orderId} fully cancelled. ${refundNote}`
        : `Order #${orderId} partially cancelled (${totalItemsCancelledCount} item units removed). ${refundNote}`,
      order: updatedOrder,
    };
  };

  const requestOrderReturn = (orderId: string, reason: string) => {
    const nowIso = new Date().toISOString();
    setOrders((prev) =>
      prev.map((order) => {
        if (order.id !== orderId) return order;
        return {
          ...order,
          orderStatus: 'return_requested',
          returnReason: reason,
          statusHistory: [
            ...order.statusHistory,
            {
              status: 'return_requested',
              timestamp: nowIso,
              note: `Return requested: ${reason}`,
              updatedBy: 'Customer',
            },
          ],
        };
      })
    );
  };

  // Product & Inventory actions
  const addProduct = (newProd: Omit<Product, 'id'>) => {
    const newId = `prod-${Date.now()}`;
    const product: Product = {
      ...newProd,
      id: newId,
    };
    setProducts((prev) => [product, ...prev]);

    // Initial stock movement
    if (product.stock.onHand > 0) {
      setStockMovements((prev) => [
        {
          id: `sm-${Date.now()}`,
          productId: newId,
          productName: product.name,
          type: 'received',
          quantity: product.stock.onHand,
          previousStock: 0,
          newStock: product.stock.onHand,
          referenceId: 'PO-NEW-ITEM',
          note: 'Opening stock entry',
          timestamp: new Date().toISOString(),
          staffName: 'Store Manager',
        },
        ...prev,
      ]);
    }
  };

  const updateProduct = (updated: Product) => {
    setProducts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
  };

  const deleteProduct = (productId: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== productId));
  };

  const adjustStock = (productId: string, newOnHand: number, reason: string, staffName: string = 'Store Manager') => {
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id !== productId) return p;
        const diff = newOnHand - p.stock.onHand;
        const type: StockMovement['type'] = diff >= 0 ? 'received' : 'adjustment';

        setStockMovements((sm) => [
          {
            id: `sm-adj-${Date.now()}`,
            productId: p.id,
            productName: p.name,
            type,
            quantity: Math.abs(diff),
            previousStock: p.stock.onHand,
            newStock: newOnHand,
            referenceId: 'MANUAL-ADJUSTMENT',
            note: reason,
            timestamp: new Date().toISOString(),
            staffName,
            outletId: activeOutlet?.id,
            outletName: activeOutlet?.name,
          },
          ...sm,
        ]);

        return {
          ...p,
          stock: {
            ...p.stock,
            onHand: newOnHand,
          },
        };
      })
    );
  };

  const submitProductForApproval = (
    productData: Omit<Product, 'id'>,
    submitterInfo?: { userId: string; userName: string; role: string; storeName?: string; submittedAt?: string }
  ) => {
    const newId = `prod-${Date.now()}`;
    const isSuperAdminRole = currentRole === 'super_admin';
    const product: Product = {
      ...productData,
      id: newId,
      approvalStatus: isSuperAdminRole ? 'approved' : 'pending',
      status: isSuperAdminRole ? 'published' : 'draft',
      submittedBy: submitterInfo
        ? {
            userId: submitterInfo.userId,
            userName: submitterInfo.userName,
            role: submitterInfo.role,
            storeName: submitterInfo.storeName,
            submittedAt: submitterInfo.submittedAt || new Date().toISOString(),
          }
        : {
            userId: currentUser.id || 'usr_staff',
            userName: currentUser.name || 'Store Staff',
            role: currentRole,
            storeName: activeOutlet?.name,
            submittedAt: new Date().toISOString(),
          },
    };

    setProducts((prev) => [product, ...prev]);

    return {
      success: true,
      message: isSuperAdminRole
        ? 'Product created and published directly to catalogue by Admin.'
        : 'Product submitted for Admin approval successfully. You will be notified once reviewed.',
      productId: newId,
    };
  };

  const approveProduct = (productId: string, feedback?: string) => {
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id !== productId) return p;
        return {
          ...p,
          approvalStatus: 'approved',
          status: 'published',
          approvalFeedback: feedback || 'Approved for marketplace catalogue by Admin.',
        };
      })
    );
    return { success: true, message: 'Product approved and published to the marketplace catalogue.' };
  };

  const rejectProduct = (productId: string, feedback: string) => {
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id !== productId) return p;
        return {
          ...p,
          approvalStatus: 'rejected',
          status: 'draft',
          approvalFeedback: feedback || 'Rejected by Admin. Please update details and resubmit.',
        };
      })
    );
    return { success: true, message: 'Product rejected with feedback sent to store.' };
  };

  const mapSellerToExistingProduct = (
    productId: string,
    listing: Omit<SellerListing, 'id' | 'lastUpdated'>
  ) => {
    const target = products.find((p) => p.id === productId);
    if (!target) return { success: false, message: 'Target catalogue product not found.' };

    const newListing: SellerListing = {
      ...listing,
      id: `sl-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      lastUpdated: new Date().toISOString(),
    };

    setProducts((prev) =>
      prev.map((p) => {
        if (p.id !== productId) return p;
        const currentListings = p.sellerListings || [];
        const exists = currentListings.some((l) => l.sellerId === listing.sellerId);
        const updatedListings = exists
          ? currentListings.map((l) => (l.sellerId === listing.sellerId ? newListing : l))
          : [...currentListings, newListing];

        const prices = updatedListings.filter((l) => l.isAvailable && l.stock > 0).map((l) => l.sellingPrice);
        const minPrice = prices.length > 0 ? Math.min(...prices) : p.regularPrice;

        return {
          ...p,
          sellerListings: updatedListings,
          regularPrice: Math.min(p.regularPrice, minPrice),
          dealPrice: minPrice < p.regularPrice ? minPrice : p.dealPrice,
        };
      })
    );

    return {
      success: true,
      message: `Your store offer was successfully mapped to "${target.name}". No duplicate catalogue listing created!`,
    };
  };

  const updateSellerListingPrice = (
    productId: string,
    sellerId: string,
    newPrice: number,
    newStock?: number
  ) => {
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id !== productId) return p;
        const updated = (p.sellerListings || []).map((l) => {
          if (l.sellerId !== sellerId) return l;
          return {
            ...l,
            sellingPrice: newPrice,
            stock: typeof newStock === 'number' ? newStock : l.stock,
            lastUpdated: new Date().toISOString(),
          };
        });
        return {
          ...p,
          sellerListings: updated,
        };
      })
    );
    return { success: true, message: 'Seller listing price updated successfully.' };
  };

  const findMatchingCatalogueProducts = (query: {
    title?: string;
    brand?: string;
    category?: string;
    barcode?: string;
  }): Product[] => {
    const qTitle = (query.title || '').trim().toLowerCase();
    const qBrand = (query.brand || '').trim().toLowerCase();
    const qBarcode = (query.barcode || '').trim();

    if (!qTitle && !qBrand && !qBarcode) return [];

    return products.filter((p) => {
      if (qBarcode && p.barcode && p.barcode.includes(qBarcode)) return true;

      const pName = p.name.toLowerCase();
      const pBrand = p.brand.toLowerCase();

      if (qBrand && pBrand === qBrand) {
        const queryWords = qTitle.split(/\s+/).filter((w) => w.length > 2 && w !== qBrand);
        const matchCount = queryWords.filter((w) => pName.includes(w)).length;
        if (matchCount >= 2 || (queryWords.length === 1 && matchCount === 1)) return true;
      }

      if (qTitle.length > 5 && pName.includes(qTitle)) return true;
      if (pName.length > 5 && qTitle.includes(pName)) return true;

      return false;
    });
  };

  // Campaigns & Promotions
  const addCampaign = (camp: Omit<FestiveCampaign, 'id'>) => {
    const newCampaign: FestiveCampaign = {
      ...camp,
      id: `camp-${Date.now()}`,
    };
    setCampaigns((prev) => [newCampaign, ...prev]);
  };

  const toggleCampaignStatus = (id: string) => {
    setCampaigns((prev) =>
      prev.map((c) => (c.id === id ? { ...c, isActive: !c.isActive } : c))
    );
  };

  const addCoupon = (coup: Omit<Coupon, 'id' | 'timesUsed'>) => {
    const newCoupon: Coupon = {
      ...coup,
      id: `coup-${Date.now()}`,
      timesUsed: 0,
    };
    setCoupons((prev) => [newCoupon, ...prev]);
  };

  const toggleCouponStatus = (id: string) => {
    setCoupons((prev) =>
      prev.map((c) => (c.id === id ? { ...c, isActive: !c.isActive } : c))
    );
  };

  const updateSettings = (newSettings: Partial<StoreSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  };

  // User Actions
  const toggleWishlist = (productId: string) => {
    setWishlist((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]
    );
  };

  const addSavedAddress = (addr: Omit<Address, 'id'>) => {
    const newAddr: Address = {
      ...addr,
      id: `addr-${Date.now()}`,
    };
    setCurrentUser((prev) => ({
      ...prev,
      savedAddresses: [...prev.savedAddresses, newAddr],
    }));
  };

  // Authentication & Staff Credential Management Methods with 2FA Authenticator OTP
  const loginUser = (
    identifier: string,
    password: string,
    otpCode?: string
  ): {
    success: boolean;
    message: string;
    requires2FA?: boolean;
    account?: UserAccount;
    user?: UserProfile;
  } => {
    const cleanId = identifier.trim().toLowerCase();
    const cleanPass = password.trim();

    // Find account by email, phone, id, or username prefix
    const account = accounts.find((acc) => {
      const emailMatch = acc.email.toLowerCase() === cleanId;
      const phoneMatch = acc.phone.replace(/[^0-9]/g, '') === cleanId.replace(/[^0-9]/g, '');
      const idMatch = acc.id.toLowerCase() === cleanId;
      const prefixMatch = acc.email.toLowerCase().split('@')[0] === cleanId;
      return emailMatch || phoneMatch || idMatch || prefixMatch;
    });

    if (!account) {
      return {
        success: false,
        message: 'No account registered with this email, phone, or username.',
      };
    }

    if (!account.isActive) {
      return {
        success: false,
        message: 'This account has been deactivated. Please contact the platform administrator.',
      };
    }

    if (account.password && account.password !== cleanPass) {
      return {
        success: false,
        message: 'Incorrect password. Please verify and try again.',
      };
    }

    // Check if account enforces 2FA Authenticator OTP (Required for Super Admin and Store Managers)
    const isAdminRole = account.role === 'super_admin' || account.role === 'store_manager';
    const is2FAEnforced = account.twoFactorEnabled !== false && (isAdminRole || account.twoFactorEnabled);

    if (is2FAEnforced) {
      if (!otpCode) {
        return {
          success: false,
          requires2FA: true,
          account,
          message: 'Authenticator OTP verification required for Admin access.',
        };
      }

      const otpResult = verifyAdminOtp(
        otpCode,
        account.twoFactorSecret || 'JE-ADMIN-SECRET-KEY'
      );

      if (!otpResult.valid) {
        return {
          success: false,
          requires2FA: true,
          account,
          message: otpResult.message,
        };
      }
    }

    const nowIso = new Date().toISOString();
    setAccounts((prev) =>
      prev.map((a) => (a.id === account.id ? { ...a, lastLoginAt: nowIso } : a))
    );

    const profile: UserProfile = {
      id: account.id,
      name: account.name,
      email: account.email,
      phone: account.phone,
      role: account.role,
      storeId: account.outletId,
      referralCode: account.referralCode || `JAVED-${account.name.slice(0, 3).toUpperCase()}${Math.floor(100 + Math.random() * 900)}`,
      savedAddresses: currentUser.savedAddresses || [],
      rewardBalance: currentUser.rewardBalance || 350,
    };

    setCurrentUser(profile);
    setCurrentRoleState(account.role);
    if (account.outletId) {
      setActiveOutletId(account.outletId);
    }
    setIsAuthenticated(true);

    return {
      success: true,
      message: `Welcome back, ${account.name}! Successfully signed in as ${account.role.replace('_', ' ').toUpperCase()}.`,
      user: profile,
    };
  };

  const verifyAdminOtpAndLogin = (
    accountId: string,
    otpCode: string,
    activeSessionOtp?: string
  ): { success: boolean; message: string; user?: UserProfile } => {
    const account = accounts.find((a) => a.id === accountId);
    if (!account) {
      return { success: false, message: 'Account not found.' };
    }

    const otpResult = verifyAdminOtp(
      otpCode,
      account.twoFactorSecret || 'JE-ADMIN-SECRET-KEY',
      activeSessionOtp
    );

    if (!otpResult.valid) {
      return { success: false, message: otpResult.message };
    }

    const nowIso = new Date().toISOString();
    setAccounts((prev) =>
      prev.map((a) => (a.id === account.id ? { ...a, lastLoginAt: nowIso } : a))
    );

    const profile: UserProfile = {
      id: account.id,
      name: account.name,
      email: account.email,
      phone: account.phone,
      role: account.role,
      storeId: account.outletId,
      referralCode:
        account.referralCode ||
        `JAVED-${account.name.slice(0, 3).toUpperCase()}${Math.floor(100 + Math.random() * 900)}`,
      savedAddresses: currentUser.savedAddresses || [],
      rewardBalance: currentUser.rewardBalance || 350,
    };

    setCurrentUser(profile);
    setCurrentRoleState(account.role);
    if (account.outletId) {
      setActiveOutletId(account.outletId);
    }
    setIsAuthenticated(true);

    return {
      success: true,
      message: `2FA Authenticator verified! Welcome to the Admin Console, ${account.name}.`,
      user: profile,
    };
  };

  const registerCustomer = (data: {
    name: string;
    email: string;
    phone: string;
    password: string;
    city?: string;
    pincode?: string;
    addressLine?: string;
  }): { success: boolean; message: string; user?: UserProfile } => {
    const cleanEmail = data.email.trim().toLowerCase();
    const cleanPhone = data.phone.trim();

    if (accounts.some((a) => a.email.toLowerCase() === cleanEmail)) {
      return {
        success: false,
        message: 'An account with this email address already exists. Please log in instead.',
      };
    }

    const newAccId = `acc_cust_${Date.now()}`;
    const refCode = `JAVED-${data.name.replace(/[^a-zA-Z]/g, '').slice(0, 4).toUpperCase() || 'USER'}${Math.floor(100 + Math.random() * 900)}`;

    const newAccount: UserAccount = {
      id: newAccId,
      name: data.name.trim(),
      email: cleanEmail,
      phone: cleanPhone,
      password: data.password.trim(),
      role: 'customer',
      referralCode: refCode,
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
      isActive: true,
      createdBy: 'self_registration',
    };

    setAccounts((prev) => [newAccount, ...prev]);

    const newAddress: Address | undefined = data.addressLine
      ? {
          id: `addr-${Date.now()}`,
          fullName: data.name.trim(),
          phone: cleanPhone,
          addressLine: data.addressLine.trim(),
          area: data.city || 'Central Area',
          city: data.city || 'Lucknow',
          state: 'Uttar Pradesh',
          pincode: data.pincode || '226001',
          isDefault: true,
        }
      : undefined;

    const profile: UserProfile = {
      id: newAccId,
      name: data.name.trim(),
      email: cleanEmail,
      phone: cleanPhone,
      role: 'customer',
      referralCode: refCode,
      savedAddresses: newAddress ? [newAddress] : [],
      rewardBalance: 150, // Welcome signup bonus
    };

    setCurrentUser(profile);
    setCurrentRoleState('customer');
    setIsAuthenticated(true);

    return {
      success: true,
      message: `Account registered successfully! Welcome to Javed Electronics, ${data.name}. 150 welcome bonus points credited.`,
      user: profile,
    };
  };

  const createStoreStaffAccount = (data: {
    name: string;
    email: string;
    phone: string;
    password: string;
    role: Role;
    outletId?: string;
  }): { success: boolean; message: string } => {
    const cleanEmail = data.email.trim().toLowerCase();
    if (accounts.some((a) => a.email.toLowerCase() === cleanEmail)) {
      return {
        success: false,
        message: 'An account with this email or username already exists. Please use another email.',
      };
    }

    const targetOutlet = outlets.find((o) => o.id === data.outletId);

    const newStaffAcc: UserAccount = {
      id: `acc_staff_${Date.now()}`,
      name: data.name.trim(),
      email: cleanEmail,
      phone: data.phone.trim(),
      password: data.password.trim(),
      role: data.role,
      outletId: data.outletId,
      outletName: targetOutlet?.name || 'All Outlets',
      createdAt: new Date().toISOString(),
      isActive: true,
      createdBy: currentUser.name || 'Platform Administrator',
    };

    setAccounts((prev) => [newStaffAcc, ...prev]);
    return {
      success: true,
      message: `Store login credentials created successfully for ${data.name} (${targetOutlet ? targetOutlet.name : 'Store'}) with role ${data.role.replace('_', ' ').toUpperCase()}.`,
    };
  };

  const updateStoreStaffAccount = (id: string, updates: Partial<UserAccount>) => {
    setAccounts((prev) =>
      prev.map((acc) => (acc.id === id ? { ...acc, ...updates } : acc))
    );
    return { success: true, message: 'Account credentials updated successfully.' };
  };

  const deleteStoreStaffAccount = (id: string) => {
    setAccounts((prev) => prev.filter((acc) => acc.id !== id));
    return { success: true, message: 'Account removed.' };
  };

  const logoutUser = () => {
    setIsAuthenticated(false);
    setCurrentRoleState('customer');
    setCurrentUser(INITIAL_USER);
  };

  // Delivery Pincode & Area Coverage Management
  const addDeliveryZone = (data: Omit<DeliveryPincodeZone, 'id' | 'createdAt' | 'updatedAt'>) => {
    const cleanPin = data.pincode.trim();
    if (!/^\d{6}$/.test(cleanPin)) {
      return { success: false, message: 'PIN code must be exactly 6 numeric digits (e.g. 226010).' };
    }
    if (!data.areaName.trim()) {
      return { success: false, message: 'Please specify coverage area or neighborhoods.' };
    }

    const nowIso = new Date().toISOString();
    const outletObj = outlets.find((o) => o.id === data.outletId);
    const resolvedOutletName = data.outletId === 'all' ? 'Any Store (Global Platform)' : outletObj?.name || 'Assigned Store';

    const newZone: DeliveryPincodeZone = {
      ...data,
      id: `zone-${Date.now()}`,
      pincode: cleanPin,
      areaName: data.areaName.trim(),
      city: data.city?.trim() || 'Lucknow',
      state: data.state?.trim() || 'Uttar Pradesh',
      outletName: resolvedOutletName,
      createdAt: nowIso,
      updatedAt: nowIso,
      updatedBy: currentUser.role === 'super_admin' ? 'Super Admin' : currentUser.name,
    };

    setDeliveryZones((prev) => [newZone, ...prev]);

    // Also sync to settings.serviceablePincodes
    if (!settings.serviceablePincodes.includes(cleanPin)) {
      setSettings((prev) => ({
        ...prev,
        serviceablePincodes: [...prev.serviceablePincodes, cleanPin],
      }));
    }

    return {
      success: true,
      message: `PIN Code ${cleanPin} (${newZone.areaName}) successfully added for ${resolvedOutletName}!`,
    };
  };

  const updateDeliveryZone = (
    idOrZone: string | DeliveryPincodeZone,
    updates?: Partial<DeliveryPincodeZone>
  ) => {
    const targetId = typeof idOrZone === 'string' ? idOrZone : idOrZone.id;
    const patch = typeof idOrZone === 'object' ? idOrZone : updates || {};

    const existing = deliveryZones.find((z) => z.id === targetId);
    if (!existing) {
      return { success: false, message: 'Delivery zone not found.' };
    }

    const merged: DeliveryPincodeZone = {
      ...existing,
      ...patch,
    };

    const cleanPin = merged.pincode.trim();
    if (!/^\d{6}$/.test(cleanPin)) {
      return { success: false, message: 'PIN code must be exactly 6 numeric digits.' };
    }
    if (!merged.areaName.trim()) {
      return { success: false, message: 'Please specify area or locality name.' };
    }

    const outletObj = outlets.find((o) => o.id === merged.outletId);
    const resolvedOutletName =
      merged.outletId === 'all'
        ? 'Any Store (Global Platform)'
        : outletObj?.name || merged.outletName || 'Assigned Store';

    const nowIso = new Date().toISOString();
    const zoneToSave: DeliveryPincodeZone = {
      ...merged,
      pincode: cleanPin,
      areaName: merged.areaName.trim(),
      outletName: resolvedOutletName,
      updatedAt: nowIso,
      updatedBy: currentUser.role === 'super_admin' ? 'Super Admin' : currentUser.name,
    };

    setDeliveryZones((prev) => prev.map((z) => (z.id === targetId ? zoneToSave : z)));

    return {
      success: true,
      message: `Delivery zone for PIN ${cleanPin} successfully updated.`,
    };
  };

  const deleteDeliveryZone = (zoneId: string) => {
    const target = deliveryZones.find((z) => z.id === zoneId);
    setDeliveryZones((prev) => prev.filter((z) => z.id !== zoneId));
    return {
      success: true,
      message: target ? `Removed PIN ${target.pincode} (${target.areaName}) from delivery coverage.` : 'Zone removed.',
    };
  };

  const toggleDeliveryZoneStatus = (zoneId: string) => {
    setDeliveryZones((prev) =>
      prev.map((z) =>
        z.id === zoneId
          ? { ...z, isActive: !z.isActive, updatedAt: new Date().toISOString() }
          : z
      )
    );
  };

  const getDeliveryZoneForPincode = (pincode: string, outletId?: string): DeliveryPincodeZone | undefined => {
    const clean = pincode.trim();
    if (!clean) return undefined;
    return deliveryZones.find((z) => {
      if (!z.isActive) return false;
      if (z.pincode !== clean) return false;
      if (!outletId || outletId === 'all') return true;
      return z.outletId === 'all' || z.outletId === outletId;
    });
  };

  const checkPincodeServiceable = (pincode: string, outletId?: string): boolean => {
    const clean = pincode.trim();
    if (!clean) return false;
    const zone = getDeliveryZoneForPincode(clean, outletId);
    if (zone && zone.isActive) return true;
    return settings.serviceablePincodes.includes(clean);
  };

  // Bulk Order Volume Discount Rules Management
  const addBulkDiscountRule = (
    ruleData: Omit<BulkDiscountRule, 'id' | 'createdAt' | 'updatedAt' | 'timesApplied' | 'totalSavingsGranted'>
  ) => {
    if (!ruleData.name.trim()) {
      return { success: false, message: 'Please enter a valid rule title.' };
    }
    if (ruleData.minQuantity <= 0 && (!ruleData.minOrderValue || ruleData.minOrderValue <= 0)) {
      return { success: false, message: 'Please specify minimum units (>=1) or a minimum cart amount.' };
    }
    if (ruleData.discountValue <= 0 && (!ruleData.tiers || ruleData.tiers.length === 0)) {
      return { success: false, message: 'Please specify a discount percentage or fixed discount amount.' };
    }

    const nowIso = new Date().toISOString();
    const newRule: BulkDiscountRule = {
      ...ruleData,
      id: `bulk_rule_${Date.now()}`,
      timesApplied: 0,
      totalSavingsGranted: 0,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    setBulkDiscountRules((prev) => [newRule, ...prev]);
    return { success: true, message: `Bulk discount rule "${newRule.name}" created successfully!` };
  };

  const updateBulkDiscountRule = (rule: BulkDiscountRule) => {
    const nowIso = new Date().toISOString();
    setBulkDiscountRules((prev) =>
      prev.map((r) => (r.id === rule.id ? { ...rule, updatedAt: nowIso } : r))
    );
    return { success: true, message: `Rule "${rule.name}" updated successfully.` };
  };

  const deleteBulkDiscountRule = (id: string) => {
    setBulkDiscountRules((prev) => prev.filter((r) => r.id !== id));
    return { success: true, message: 'Bulk discount rule removed.' };
  };

  const toggleBulkDiscountRuleStatus = (id: string) => {
    setBulkDiscountRules((prev) =>
      prev.map((r) => (r.id === id ? { ...r, isActive: !r.isActive, updatedAt: new Date().toISOString() } : r))
    );
  };

  const resetBulkDiscountRules = () => {
    setBulkDiscountRules(INITIAL_BULK_DISCOUNT_RULES);
  };

  // QR Modal Helper
  const openQrModal = async (data: { title: string; qrValue: string; subtitle?: string }) => {
    try {
      const qrImage = await generateQrDataUrl(data.qrValue, { width: 320 });
      setQrModalData({
        ...data,
        qrImage,
      });
      setActiveModal('quick_qr');
    } catch (e) {
      console.error(e);
    }
  };

  const closeQrModal = () => {
    setQrModalData(null);
    if (activeModal === 'quick_qr') setActiveModal(null);
  };

  const openPolicyModal = (policyType: string) => {
    setSelectedPolicyType(policyType);
    setActiveModal('policy');
  };

  // Multi-Outlet Management Methods
  const activeOutlet = useMemo(() => {
    return outlets.find((o) => o.id === activeOutletId) || outlets[0];
  }, [outlets, activeOutletId]);

  const createOutlet = (outletData: Omit<Outlet, 'id' | 'createdAt'>) => {
    const newOutlet: Outlet = {
      ...outletData,
      id: `out_${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setOutlets((prev) => [newOutlet, ...prev]);
  };

  const updateOutlet = (updated: Outlet) => {
    setOutlets((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
  };

  const deleteOutlet = (id: string) => {
    setOutlets((prev) => prev.filter((o) => o.id !== id));
  };

  const updateOwnershipModel = (updated: OutletOwnershipRules) => {
    setOwnershipModels((prev) => prev.map((m) => (m.modelType === updated.modelType ? updated : m)));
  };

  const createBusinessCategory = (cat: Omit<BusinessCategory, 'id' | 'itemCount'>) => {
    const newCat: BusinessCategory = {
      ...cat,
      id: `cat_${Date.now()}`,
      itemCount: 0,
    };
    setBusinessCategories((prev) => [newCat, ...prev]);
  };

  const updateCategoryApprovalStatus = (id: string, status: CategoryApprovalStatus, note?: string) => {
    setBusinessCategories((prev) =>
      prev.map((c) =>
        c.id === id
          ? {
              ...c,
              approvalStatus: status,
              approvalNote: note || c.approvalNote,
              approvedBy: status === 'approved' || status === 'published' ? 'Super Admin' : c.approvedBy,
            }
          : c
      )
    );
  };

  const createPayoutItem = (item: Omit<PayoutItem, 'id' | 'createdAt'>) => {
    const newItem: PayoutItem = {
      ...item,
      id: `pay_${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setPayoutItems((prev) => [newItem, ...prev]);
  };

  const addLedgerEntry = (entry: Omit<FinancialLedgerEntry, 'id' | 'entryDate'>) => {
    const newEntry: FinancialLedgerEntry = {
      ...entry,
      id: `led_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      entryDate: new Date().toISOString(),
    };
    setFinancialLedger((prev) => [newEntry, ...prev]);
  };

  const updatePayoutStatus = (payoutId: string, status: PayoutStatus, ref?: string, approvedBy?: string) => {
    const nowIso = new Date().toISOString();
    setPayoutItems((prev) =>
      prev.map((p) => {
        if (p.id !== payoutId) return p;
        const updated: PayoutItem = {
          ...p,
          status,
          transactionReference: ref || p.transactionReference,
          approvedBy: approvedBy || (status === 'approved' ? 'Super Admin' : p.approvedBy),
          approvedAt: status === 'approved' ? nowIso : p.approvedAt,
          paidAt: status === 'paid' ? nowIso : p.paidAt,
        };

        if (status === 'paid' && p.status !== 'paid') {
          const ledgerCategoryMap: Record<string, FinancialLedgerEntry['category']> = {
            rider: 'rider_payout',
            vendor: 'vendor_settlement',
            supplier: 'supplier_payment',
            franchise_partner: 'franchise_royalty',
            outlet_owner: 'franchise_royalty',
            category_creator: 'order_commission',
          };
          addLedgerEntry({
            referenceId: p.payoutId || p.id,
            outletId: p.outletId,
            outletName: p.outletName,
            participantId: p.participantId,
            participantName: p.participantName,
            accountDebit: `${p.participantType.toUpperCase()} Settlement Payable`,
            accountCredit: `Commercial Escrow Bank Account`,
            amount: p.netPayable,
            description: `Settled ${p.payoutId} for ${p.participantName} via ${p.paymentMethod}`,
            category: ledgerCategoryMap[p.participantType] || 'vendor_settlement',
          });
        }
        return updated;
      })
    );
  };

  const registerBarcodeRecord = (record: Omit<ProductBarcodeRecord, 'id'>) => {
    const exists = barcodeRecords.some((b) => b.barcodeValue === record.barcodeValue);
    if (exists) {
      return { success: false, message: `Barcode ${record.barcodeValue} is already registered.` };
    }
    const newRecord: ProductBarcodeRecord = {
      ...record,
      id: `bc_${Date.now()}`,
    };
    setBarcodeRecords((prev) => [newRecord, ...prev]);
    return { success: true, message: `Registered barcode ${record.barcodeValue} for ${record.productName}.` };
  };

  const verifyBarcodeLookup = (barcodeValue: string) => {
    const clean = barcodeValue.trim();
    return barcodeRecords.find((b) => b.barcodeValue === clean);
  };

  const requestStockTransfer = (payload: {
    sourceOutletId: string;
    destinationOutletId: string;
    productId: string;
    quantity: number;
    requestedBy: string;
    notes?: string;
  }) => {
    const srcOutlet = outlets.find((o) => o.id === payload.sourceOutletId);
    const destOutlet = outlets.find((o) => o.id === payload.destinationOutletId);
    const prod = products.find((p) => p.id === payload.productId);

    const newTransfer: StockTransfer = {
      id: `TRF-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      sourceOutletId: payload.sourceOutletId,
      sourceOutletName: srcOutlet?.name || 'Central Warehouse',
      destinationOutletId: payload.destinationOutletId,
      destinationOutletName: destOutlet?.name || 'Destination Outlet',
      productId: payload.productId,
      productName: prod?.name || 'Electronics Unit',
      sku: prod?.sku || 'SKU-GEN',
      requestedQuantity: payload.quantity,
      status: 'requested',
      requestedBy: payload.requestedBy,
      driverOrCourierNote: payload.notes,
      requestedAt: new Date().toISOString(),
    };
    setStockTransfers((prev) => [newTransfer, ...prev]);
  };

  const processStockTransfer = (transferId: string, newStatus: StockTransferStatus, staffNote?: string) => {
    const nowIso = new Date().toISOString();
    setStockTransfers((prev) =>
      prev.map((t) => {
        if (t.id !== transferId) return t;
        return {
          ...t,
          status: newStatus,
          dispatchedAt: newStatus === 'dispatched' ? nowIso : t.dispatchedAt,
          receivedAt: newStatus === 'received' ? nowIso : t.receivedAt,
          driverOrCourierNote: staffNote || t.driverOrCourierNote,
          dispatchedQuantity: newStatus === 'dispatched' && !t.dispatchedQuantity ? t.requestedQuantity : t.dispatchedQuantity,
          receivedQuantity: newStatus === 'received' && !t.receivedQuantity ? t.dispatchedQuantity || t.requestedQuantity : t.receivedQuantity,
        };
      })
    );
  };

  const createAgreement = (agr: Omit<FranchiseAgreement, 'id'>) => {
    const newAgr: FranchiseAgreement = {
      ...agr,
      id: `AGR-${Date.now()}`,
    };
    setFranchiseAgreements((prev) => [newAgr, ...prev]);
  };

  const updateAgreement = (updated: FranchiseAgreement) => {
    setFranchiseAgreements((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
  };

  // MODULE 4: Branding Settings Methods
  const updateBrandingSettings = (newPartial: Partial<BrandingSettings>, reason: string = 'Configuration update') => {
    setBrandingSettings((prev) => {
      const nextVersion = prev.version + 1;
      const updated: BrandingSettings = {
        ...prev,
        ...newPartial,
        version: nextVersion,
        updatedAt: new Date().toISOString(),
        updatedBy: currentRole === 'super_admin' ? 'Super Admin' : 'Admin',
      };

      setBrandingHistory((h) => [
        {
          id: `bh_${Date.now()}`,
          version: nextVersion,
          settingsSnapshot: updated,
          changedBy: updated.updatedBy,
          changeSummary: reason,
          timestamp: updated.updatedAt,
        },
        ...h,
      ]);

      return updated;
    });
  };

  const rollbackBrandingSettings = (version: number) => {
    const entry = brandingHistory.find((h) => h.version === version);
    if (!entry) return;

    setBrandingSettings({
      ...entry.settingsSnapshot,
      version: brandingSettings.version + 1,
      updatedAt: new Date().toISOString(),
      updatedBy: 'Super Admin (Rollback)',
    });
  };

  // MODULE 5: Business Rules Methods
  const updateBusinessRule = (updatedRule: BusinessRule, reason: string) => {
    setBusinessRules((prev) =>
      prev.map((r) =>
        r.id === updatedRule.id
          ? {
              ...updatedRule,
              lastUpdatedAt: new Date().toISOString(),
              lastUpdatedBy: currentRole === 'super_admin' ? 'Super Admin' : 'Admin',
            }
          : r
      )
    );
  };

  const createBusinessRule = (rule: Omit<BusinessRule, 'id' | 'lastUpdatedAt'>) => {
    const newRule: BusinessRule = {
      ...rule,
      id: `rule_${Date.now()}`,
      lastUpdatedAt: new Date().toISOString(),
    };
    setBusinessRules((prev) => [newRule, ...prev]);
  };

  // MODULE 6: Document Centre Methods
  const uploadDocument = (doc: Omit<PlatformDocument, 'id' | 'uploadedAt' | 'status'>) => {
    const newDoc: PlatformDocument = {
      ...doc,
      id: `doc_${Date.now()}`,
      status: 'pending',
      uploadedAt: new Date().toISOString(),
    };
    setPlatformDocuments((prev) => [newDoc, ...prev]);
  };

  const updateDocumentStatus = (docId: string, status: DocumentVerificationStatus, reason?: string) => {
    const nowIso = new Date().toISOString();
    const reviewer = currentRole === 'super_admin' ? 'Super Admin' : 'Compliance Officer';
    setPlatformDocuments((prev) =>
      prev.map((d) =>
        d.id === docId
          ? {
              ...d,
              status,
              rejectionReason: reason || d.rejectionReason,
              reviewedBy: reviewer,
              reviewedAt: nowIso,
            }
          : d
      )
    );
  };

  // MODULE 7 & 8: Verified Reviews & Social Proof Methods
  const submitProductReview = (
    review: Omit<ProductReview, 'id' | 'createdAt' | 'moderationStatus' | 'helpfulVotes'>
  ): { success: boolean; message: string } => {
    // 1. Check for duplicate review by same customer on same product
    const existing = productReviews.find(
      (r) => r.productId === review.productId && r.customerId === review.customerId
    );
    if (existing) {
      return { success: false, message: 'You have already submitted a review for this purchase.' };
    }

    // 2. Validate delivered purchase eligibility
    const eligibleDeliveredOrder = orders.find(
      (o) =>
        (o.id === review.orderId || o.customer.id === review.customerId) &&
        o.orderStatus === 'delivered' &&
        o.items.some((i) => i.productId === review.productId)
    );

    const newReview: ProductReview = {
      ...review,
      id: `rev_${Date.now()}`,
      isVerifiedPurchase: !!eligibleDeliveredOrder || review.isVerifiedPurchase,
      moderationStatus: 'approved', // auto-approve verified customer reviews by default
      helpfulVotes: 0,
      createdAt: new Date().toISOString(),
    };

    setProductReviews((prev) => [newReview, ...prev]);
    return { success: true, message: 'Thank you! Your verified product review has been published.' };
  };

  const moderateProductReview = (reviewId: string, status: ReviewModerationStatus, notes?: string) => {
    setProductReviews((prev) =>
      prev.map((r) =>
        r.id === reviewId
          ? {
              ...r,
              moderationStatus: status,
              moderatedBy: 'Super Admin',
              moderatedAt: new Date().toISOString(),
              moderationNotes: notes || r.moderationNotes,
            }
          : r
      )
    );
  };

  const voteReviewHelpful = (reviewId: string) => {
    setProductReviews((prev) =>
      prev.map((r) => (r.id === reviewId ? { ...r, helpfulVotes: r.helpfulVotes + 1 } : r))
    );
  };

  const replyToReview = (reviewId: string, replyText: string) => {
    setProductReviews((prev) =>
      prev.map((r) =>
        r.id === reviewId
          ? {
              ...r,
              shopReply: {
                text: replyText,
                repliedBy: 'Javed Electronics Hazratganj',
                repliedAt: new Date().toISOString(),
              },
            }
          : r
      )
    );
  };

  const getProductMetrics = (productId: string) => {
    // Count real qualifying completed delivered/confirmed orders
    let completedCount = 0;
    orders.forEach((o) => {
      if (o.orderStatus !== 'cancelled' && o.orderStatus !== 'delivery_failed') {
        const item = o.items.find((i) => i.productId === productId);
        if (item) completedCount += item.quantity;
      }
    });

    const baseMap: Record<string, number> = {
      'prod-001': 148,
      'prod-002': 94,
      'prod-003': 76,
      'prod-004': 52,
      'prod-005': 118,
      'prod-006': 64,
    };
    const totalCompletedOrders = (baseMap[productId] || 15) + completedCount;

    const approvedReviews = productReviews.filter(
      (r) => r.productId === productId && r.moderationStatus === 'approved'
    );
    const avgRating =
      approvedReviews.length > 0
        ? approvedReviews.reduce((sum, r) => sum + r.rating, 0) / approvedReviews.length
        : 4.8;

    return {
      totalCompletedOrders,
      averageRating: Math.round(avgRating * 10) / 10,
      totalReviewsCount: approvedReviews.length,
      popularityRank: totalCompletedOrders > 100 ? 1 : totalCompletedOrders > 50 ? 2 : 3,
    };
  };

  // MODULE 9: User Trust Segmentation & Appeals Methods
  const updateTrustProfile = (updatedProfile: TrustProfile, reason: string) => {
    setTrustProfiles((prev) =>
      prev.map((tp) =>
        tp.id === updatedProfile.id
          ? {
              ...updatedProfile,
              lastReviewedAt: new Date().toISOString(),
              lastReviewedBy: currentRole === 'super_admin' ? 'Super Admin' : 'Trust Officer',
              segmentReason: reason || updatedProfile.segmentReason,
            }
          : tp
      )
    );
  };

  const submitTrustAppeal = (appeal: Omit<TrustAppeal, 'id' | 'status' | 'createdAt'>) => {
    const newAppeal: TrustAppeal = {
      ...appeal,
      id: `app_${Date.now()}`,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    setTrustAppeals((prev) => [newAppeal, ...prev]);

    // Update appeal count in trust profile
    setTrustProfiles((prev) =>
      prev.map((tp) =>
        tp.id === appeal.trustProfileId
          ? { ...tp, activeAppealsCount: tp.activeAppealsCount + 1, fraudStatus: 'appealed' }
          : tp
      )
    );
  };

  const resolveTrustAppeal = (
    appealId: string,
    resolution: 'approved_reinstated' | 'rejected',
    note: string,
    newSegment?: TrustSegment
  ) => {
    const nowIso = new Date().toISOString();
    setTrustAppeals((prev) =>
      prev.map((a) => {
        if (a.id !== appealId) return a;
        return {
          ...a,
          status: resolution,
          resolutionNote: note,
          reviewedBy: 'Super Admin',
          reviewedAt: nowIso,
        };
      })
    );

    if (resolution === 'approved_reinstated' && newSegment) {
      const appeal = trustAppeals.find((a) => a.id === appealId);
      if (appeal) {
        setTrustProfiles((profiles) =>
          profiles.map((p) =>
            p.id === appeal.trustProfileId
              ? {
                  ...p,
                  segment: newSegment,
                  fraudStatus: 'cleared',
                  segmentReason: `Reinstated to Segment ${newSegment} upon appeal review: ${note}`,
                  activeAppealsCount: Math.max(0, p.activeAppealsCount - 1),
                  lastReviewedAt: nowIso,
                  lastReviewedBy: 'Super Admin',
                }
              : p
          )
        );
      }
    }
  };

  // MODULE 1, 2 & 3: Payments & WhatsApp Review Methods
  const createUpiCheckoutSession = async (orderId: string, amount: number): Promise<DynamicUpiQrSession> => {
    const session = await createDynamicUpiQrSession({
      orderId,
      amount,
      merchantVpa: settings.upiId,
      merchantName: settings.upiName,
      items: cart.map((i) => ({
        productId: i.productId,
        unitPrice: i.product.dealPrice || i.product.regularPrice,
        quantity: i.quantity,
      })),
      deliveryFee: cartDeliveryFee,
      couponDiscount: cartCouponDiscount,
    });
    setActiveUpiSession(session);
    return session;
  };

  const submitWhatsAppPayment = (
    payload: Omit<WhatsAppPaymentSubmission, 'id' | 'createdAt' | 'reviewStatus'>
  ) => {
    // Check for duplicate UTR
    const duplicate = whatsAppPaymentSubmissions.some(
      (s) => s.utrNumber.trim().toLowerCase() === payload.utrNumber.trim().toLowerCase()
    );
    if (duplicate) {
      throw new Error(`UTR / Reference ${payload.utrNumber} has already been submitted. Duplicate submissions are strictly prevented.`);
    }

    const newSub: WhatsAppPaymentSubmission = {
      ...payload,
      id: `wps_${Date.now()}`,
      reviewStatus: 'under_verification',
      createdAt: new Date().toISOString(),
    };

    setWhatsAppPaymentSubmissions((prev) => [newSub, ...prev]);

    // Transition order state to awaiting_whatsapp_confirmation with status history
    updateOrderStatus(
      payload.orderId,
      'awaiting_whatsapp_confirmation',
      `Payment proof submitted via WhatsApp flow (UTR: ${payload.utrNumber})`,
      payload.customerName
    );
  };

  const reviewWhatsAppPayment = (
    submissionId: string,
    status: WhatsAppReviewStatus,
    reason?: string
  ) => {
    const nowIso = new Date().toISOString();
    const reviewer = currentRole === 'super_admin' ? 'Super Admin' : 'Finance Manager';

    setWhatsAppPaymentSubmissions((prev) =>
      prev.map((s) => {
        if (s.id !== submissionId) return s;
        const updated: WhatsAppPaymentSubmission = {
          ...s,
          reviewStatus: status,
          reviewerId: 'emp_fin_01',
          reviewerName: reviewer,
          reviewedAt: nowIso,
          decisionReason: reason || (status === 'verified' ? 'Bank credit verified against UTR' : 'Information requested'),
        };

        if (status === 'verified') {
          verifyOrderPayment(s.orderId, s.utrNumber);
        } else if (status === 'rejected') {
          updateOrderStatus(
            s.orderId,
            'payment_pending',
            `Manual payment rejected: ${reason || 'Bank statement did not match submitted UTR'}`,
            reviewer
          );
        }

        return updated;
      })
    );
  };

  const verifyPaymentTransaction = (
    orderId: string,
    provider: PaymentGatewayProvider,
    txnRef: string,
    payerDetails?: any
  ) => {
    verifyOrderPayment(orderId, txnRef);

    const order = orders.find((o) => o.id === orderId);
    const newTxn: PaymentTransactionRecord = {
      id: `txn_${Date.now()}`,
      orderId,
      provider,
      transactionRef: txnRef,
      amount: order ? order.finalTotal : 0,
      currency: 'INR',
      status: 'payment_verified',
      payerName: payerDetails?.name || order?.customer.name,
      payerPhone: payerDetails?.phone || order?.customer.phone,
      methodDetails: payerDetails?.method || provider,
      createdAt: new Date().toISOString(),
      verifiedAt: new Date().toISOString(),
      verifiedBy: provider === 'razorpay' ? 'Razorpay Webhook & Signature Verification' : 'UPI Instant Verification',
    };

    setPaymentTransactions((prev) => [newTxn, ...prev]);
  };

  const initiateOrderRefund = (orderId: string, reason: string) => {
    const order = orders.find((o) => o.id === orderId);
    if (!order) return;

    const refundRes = RazorpayService.initiateRefund({
      paymentId: order.paymentDetails?.transactionId || `PAY-${orderId}`,
      amountInRupees: order.finalTotal,
      reason,
    });

    updateOrderStatus(
      orderId,
      'refunded',
      `Refund of ₹${order.finalTotal} processed via gateway (Refund ID: ${refundRes.refundId})`,
      'Finance Admin'
    );

    addLedgerEntry({
      referenceId: refundRes.refundId,
      accountDebit: 'Customer Refund Clearing Account',
      accountCredit: 'Gateway Settlement Bank Account',
      amount: order.finalTotal,
      description: `Refund for Order ${orderId}: ${reason}`,
      category: 'vendor_settlement',
    });
  };

  // 100% Configurable Homepage Sections Handlers
  const updateHomepageSettings = (updates: Partial<HomepageMasterSettings>) => {
    setHomepageSettings((prev) => {
      const next = { ...prev, ...updates };
      saveStoredHomepageSettings(next);
      return next;
    });
  };

  const updateHomepageSection = (sectionId: HomepageSectionType, updates: Partial<HomepageSection>) => {
    setHomepageSettings((prev) => {
      const nextSections = prev.sections.map((sec) =>
        sec.id === sectionId ? { ...sec, ...updates } : sec
      );
      const next = { ...prev, sections: nextSections };
      saveStoredHomepageSettings(next);
      return next;
    });
  };

  const reorderHomepageSection = (sectionId: HomepageSectionType, direction: 'up' | 'down') => {
    setHomepageSettings((prev) => {
      const sorted = [...prev.sections].sort((a, b) => a.order - b.order);
      const index = sorted.findIndex((s) => s.id === sectionId);
      if (index === -1) return prev;
      if (direction === 'up' && index === 0) return prev;
      if (direction === 'down' && index === sorted.length - 1) return prev;

      const swapIndex = direction === 'up' ? index - 1 : index + 1;
      const current = sorted[index];
      const target = sorted[swapIndex];

      const currentOrder = current.order;
      current.order = target.order;
      target.order = currentOrder;

      sorted.sort((a, b) => a.order - b.order);
      const normalized = sorted.map((sec, idx) => ({ ...sec, order: idx + 1 }));
      const next = { ...prev, sections: normalized };
      saveStoredHomepageSettings(next);
      return next;
    });
  };

  const resetHomepageSettings = () => {
    setHomepageSettings(INITIAL_HOMEPAGE_SETTINGS);
    saveStoredHomepageSettings(INITIAL_HOMEPAGE_SETTINGS);
  };

  const toggleProductLike = (productId: string) => {
    const isLiked = userLikedProducts.includes(productId);
    if (isLiked) {
      setUserLikedProducts((prev) => prev.filter((id) => id !== productId));
      setProductLikes((prev) => ({
        ...prev,
        [productId]: Math.max(0, (prev[productId] || 1) - 1),
      }));
    } else {
      setUserLikedProducts((prev) => [...prev, productId]);
      setProductLikes((prev) => ({
        ...prev,
        [productId]: (prev[productId] || 0) + 1,
      }));
    }
  };

  const addComboToCart = (combo: ComboBundleItem) => {
    const itemsToAdd = combo.productIds
      .map((pid) => products.find((p) => p.id === pid))
      .filter((p): p is Product => !!p);

    if (itemsToAdd.length === 0) {
      return { success: false, message: 'Products in this combo are currently unavailable.' };
    }

    setCart((prev) => {
      let updatedCart = [...prev];
      for (const prod of itemsToAdd) {
        const existingIdx = updatedCart.findIndex((ci) => ci.productId === prod.id);
        if (existingIdx >= 0) {
          updatedCart[existingIdx] = {
            ...updatedCart[existingIdx],
            quantity: updatedCart[existingIdx].quantity + 1,
          };
        } else {
          updatedCart.push({
            productId: prod.id,
            quantity: 1,
            product: prod,
          });
        }
      }
      return updatedCart;
    });

    return {
      success: true,
      message: `Combo "${combo.title}" added to cart! You save ₹${combo.savings.toLocaleString('en-IN')}.`,
    };
  };

  // Multiple Payment Gateways Handlers (Activate / Deactivate / Configure)
  const togglePaymentGatewayStatus = (id: string) => {
    let updatedGateway: PaymentGatewayConfig | undefined;
    let newStatus = false;

    setPaymentGateways((prev) =>
      prev.map((gw) => {
        if (gw.id === id) {
          newStatus = !gw.isActive;
          updatedGateway = {
            ...gw,
            isActive: newStatus,
            updatedAt: new Date().toISOString(),
            updatedBy: currentUser.name || 'Store Admin',
          };
          return updatedGateway;
        }
        return gw;
      })
    );

    if (updatedGateway) {
      const logEntry: PaymentGatewayAuditLog = {
        id: `log-gw-${Date.now()}`,
        gatewayId: updatedGateway.id,
        gatewayName: updatedGateway.name,
        action: newStatus ? 'activated' : 'deactivated',
        timestamp: new Date().toISOString(),
        performedBy: `${currentUser.name} (${currentRole})`,
        details: `Gateway ${newStatus ? 'activated and enabled for customer checkout' : 'deactivated and hidden from customer checkout'}.`,
      };
      setPaymentGatewayAuditLogs((prev) => [logEntry, ...prev]);

      return {
        success: true,
        message: `${updatedGateway.shortName} gateway ${newStatus ? 'ACTIVATED' : 'DEACTIVATED'} successfully!`,
        gateway: updatedGateway,
      };
    }

    return {
      success: false,
      message: 'Gateway not found.',
    };
  };

  const updatePaymentGateway = (id: string, updates: Partial<PaymentGatewayConfig>) => {
    let found = false;
    let updatedName = '';

    setPaymentGateways((prev) =>
      prev.map((gw) => {
        if (gw.id === id) {
          found = true;
          updatedName = updates.name || gw.name;
          return {
            ...gw,
            ...updates,
            updatedAt: new Date().toISOString(),
            updatedBy: currentUser.name || 'Store Admin',
          };
        }
        return gw;
      })
    );

    if (found) {
      const logEntry: PaymentGatewayAuditLog = {
        id: `log-gw-${Date.now()}`,
        gatewayId: id,
        gatewayName: updatedName,
        action: 'configured',
        timestamp: new Date().toISOString(),
        performedBy: `${currentUser.name} (${currentRole})`,
        details: 'Payment gateway configuration updated.',
      };
      setPaymentGatewayAuditLogs((prev) => [logEntry, ...prev]);

      return {
        success: true,
        message: 'Payment gateway configuration saved successfully.',
      };
    }

    return {
      success: false,
      message: 'Gateway not found.',
    };
  };

  const resetPaymentGateways = () => {
    setPaymentGateways(INITIAL_PAYMENT_GATEWAYS);
    const logEntry: PaymentGatewayAuditLog = {
      id: `log-gw-${Date.now()}`,
      gatewayId: 'all',
      gatewayName: 'All Payment Gateways',
      action: 'reset',
      timestamp: new Date().toISOString(),
      performedBy: `${currentUser.name} (${currentRole})`,
      details: 'All payment gateways restored to initial defaults.',
    };
    setPaymentGatewayAuditLogs((prev) => [logEntry, ...prev]);
  };

  // SOP & SLA Operational Matrix State
  const [sopSlaConfig, setSopSlaConfig] = useState<SopSlaMasterConfig>(() => {
    try {
      const saved = localStorage.getItem('electro_sop_sla_config_v1');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Failed to parse SOP SLA config from localStorage', e);
    }
    return INITIAL_SOP_SLA_CONFIG;
  });

  const [outletCompliance, setOutletCompliance] = useState<OutletSlaCompliance[]>(() => {
    try {
      const saved = localStorage.getItem('electro_outlet_compliance_v1');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Failed to parse outlet compliance from localStorage', e);
    }
    return INITIAL_OUTLET_COMPLIANCE_DATA;
  });

  useEffect(() => {
    try {
      localStorage.setItem('electro_sop_sla_config_v1', JSON.stringify(sopSlaConfig));
    } catch (e) {}
  }, [sopSlaConfig]);

  useEffect(() => {
    try {
      localStorage.setItem('electro_outlet_compliance_v1', JSON.stringify(outletCompliance));
    } catch (e) {}
  }, [outletCompliance]);

  const updateLifecycleSla = (metricKey: keyof OrderLifecycleSlaConfig, updates: Partial<SlaThresholdRange>) => {
    setSopSlaConfig((prev) => ({
      ...prev,
      lastUpdated: new Date().toISOString(),
      updatedBy: currentUser.name || 'Super Admin',
      orderLifecycle: {
        ...prev.orderLifecycle,
        [metricKey]: {
          ...prev.orderLifecycle[metricKey],
          ...updates,
        },
      },
    }));
    return { success: true, message: `Updated SOP SLA for ${metricKey.replace(/([A-Z])/g, ' $1').toLowerCase()}` };
  };

  const updateStressMetricThreshold = (metricId: string, updates: Partial<StressMetricDefinition>) => {
    setSopSlaConfig((prev) => ({
      ...prev,
      lastUpdated: new Date().toISOString(),
      updatedBy: currentUser.name || 'Super Admin',
      metrics: prev.metrics.map((m) => {
        if (m.id !== metricId) return m;
        const updated = { ...m, ...updates };
        let newStatus: 'green' | 'yellow' | 'red' = 'green';
        if (updated.higherIsBetter) {
          if (updated.currentLiveValue < updated.criticalRed) newStatus = 'red';
          else if (updated.currentLiveValue < updated.idealGreen) newStatus = 'yellow';
          else newStatus = 'green';
        } else {
          if (updated.currentLiveValue > updated.criticalRed) newStatus = 'red';
          else if (updated.currentLiveValue > updated.idealGreen) newStatus = 'yellow';
          else newStatus = 'green';
        }
        return { ...updated, currentStatus: newStatus };
      }),
    }));
    return { success: true, message: 'Metric threshold updated successfully.' };
  };

  const applySlaPreset = (presetKey: string) => {
    const preset = PRESET_CONFIGURATIONS[presetKey];
    if (!preset) return { success: false, message: 'Preset not found.' };

    setSopSlaConfig((prev) => ({
      ...prev,
      presetName: presetKey as any,
      presetLabel: preset.label,
      lastUpdated: new Date().toISOString(),
      updatedBy: currentUser.name || 'Super Admin',
      orderLifecycle: preset.lifecycle,
    }));
    return { success: true, message: `Applied SOP SLA Preset: ${preset.label}` };
  };

  const addOrUpdateCustomerTag = (tag: CustomerTagSlaRule) => {
    setSopSlaConfig((prev) => {
      const exists = prev.customerTags.some((t) => t.id === tag.id);
      return {
        ...prev,
        lastUpdated: new Date().toISOString(),
        customerTags: exists
          ? prev.customerTags.map((t) => (t.id === tag.id ? tag : t))
          : [...prev.customerTags, tag],
      };
    });
    return { success: true, message: `Customer tag "${tag.tagName}" saved successfully.` };
  };

  const deleteCustomerTag = (tagId: string) => {
    setSopSlaConfig((prev) => ({
      ...prev,
      lastUpdated: new Date().toISOString(),
      customerTags: prev.customerTags.filter((t) => t.id !== tagId),
    }));
    return { success: true, message: 'Customer tag removed.' };
  };

  const addOrUpdateSellerTag = (tag: SellerTagSlaRule) => {
    setSopSlaConfig((prev) => {
      const exists = prev.sellerTags.some((t) => t.id === tag.id);
      return {
        ...prev,
        lastUpdated: new Date().toISOString(),
        sellerTags: exists
          ? prev.sellerTags.map((t) => (t.id === tag.id ? tag : t))
          : [...prev.sellerTags, tag],
      };
    });
    return { success: true, message: `Seller tag "${tag.tagName}" saved successfully.` };
  };

  const deleteSellerTag = (tagId: string) => {
    setSopSlaConfig((prev) => ({
      ...prev,
      lastUpdated: new Date().toISOString(),
      sellerTags: prev.sellerTags.filter((t) => t.id !== tagId),
    }));
    return { success: true, message: 'Seller tag removed.' };
  };

  const resetSopSlaToDefault = () => {
    setSopSlaConfig(INITIAL_SOP_SLA_CONFIG);
    setOutletCompliance(INITIAL_OUTLET_COMPLIANCE_DATA);
    try {
      localStorage.removeItem('electro_sop_sla_config_v1');
      localStorage.removeItem('electro_outlet_compliance_v1');
    } catch (e) {}
    return { success: true, message: 'Reset all SOP & SLA thresholds to standard industry defaults.' };
  };

  // Delivery Partners & In-House Rider Management
  const [deliveryPartners, setDeliveryPartners] = useState<DeliveryPartnerAccount[]>(() => {
    try {
      const saved = localStorage.getItem('electro_delivery_partners_v1');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Failed to parse delivery partners from localStorage', e);
    }
    return INITIAL_DELIVERY_PARTNERS;
  });

  const [ridersList, setRidersList] = useState<InHouseRider[]>(() => {
    try {
      const saved = localStorage.getItem('electro_inhouse_riders_v1');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Failed to parse in-house riders from localStorage', e);
    }
    return INITIAL_RIDERS;
  });

  useEffect(() => {
    try {
      localStorage.setItem('electro_delivery_partners_v1', JSON.stringify(deliveryPartners));
    } catch (e) {}
  }, [deliveryPartners]);

  useEffect(() => {
    try {
      localStorage.setItem('electro_inhouse_riders_v1', JSON.stringify(ridersList));
    } catch (e) {}
  }, [ridersList]);

  // Rider Cash Remittance Submissions & Approval Queue (8-Digit Code System)
  const [riderRemittances, setRiderRemittances] = useState<RiderRemittanceSubmission[]>(() => {
    try {
      const saved = localStorage.getItem('electro_rider_remittances_v1');
      if (saved) {
        const parsed: RiderRemittanceSubmission[] = JSON.parse(saved);
        return parsed.map((item) => ({
          ...item,
          remittanceCode:
            item.remittanceCode && item.remittanceCode.length === 6
              ? `${item.remittanceCode}56`
              : item.remittanceCode,
        }));
      }
    } catch (e) {
      console.warn('Failed to parse rider remittances from localStorage', e);
    }
    return INITIAL_RIDER_REMITTANCES;
  });

  useEffect(() => {
    try {
      localStorage.setItem('electro_rider_remittances_v1', JSON.stringify(riderRemittances));
    } catch (e) {}
  }, [riderRemittances]);

  // Express Partner COD Settlements (Shiprocket, Delhivery, etc.)
  const [carrierSettlements, setCarrierSettlements] = useState<CarrierCodSettlement[]>(() => {
    try {
      const saved = localStorage.getItem('electro_carrier_settlements_v1');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Failed to parse carrier settlements from localStorage', e);
    }
    return INITIAL_CARRIER_SETTLEMENTS;
  });

  useEffect(() => {
    try {
      localStorage.setItem('electro_carrier_settlements_v1', JSON.stringify(carrierSettlements));
    } catch (e) {}
  }, [carrierSettlements]);

  const assignOrderDelivery = (orderId: string, dispatchDetails: ExpressShipmentDetails) => {
    let orderFound = false;

    setOrders((prev) =>
      prev.map((o) => {
        if (o.id !== orderId) return o;
        orderFound = true;
        const isCodOrder = o.paymentMethod === 'cod';

        const newStatus: OrderStatus = 'out_for_delivery';
        const note = dispatchDetails.fulfillmentType === 'express_partner'
          ? `Dispatched via ${dispatchDetails.carrier} Express. AWB: ${dispatchDetails.awbNumber || 'Pending'}. Tracking: ${dispatchDetails.trackingUrl || 'N/A'}`
          : `Assigned to In-House Rider: ${dispatchDetails.riderName || 'Store Courier'} (${dispatchDetails.riderPhone || ''}). Vehicle: ${dispatchDetails.riderVehicleNo || 'N/A'}`;

        const newHistoryItem: OrderStatusHistoryItem = {
          status: newStatus,
          timestamp: new Date().toISOString(),
          note,
          updatedBy: `${currentUser.name} (${currentRole})`,
        };

        const enrichedDispatch: ExpressShipmentDetails = {
          ...dispatchDetails,
          isCod: isCodOrder,
          codAmountToCollect: isCodOrder ? o.finalTotal : 0,
          codCollectedStatus: isCodOrder ? (o.paymentStatus === 'verified_paid' ? 'collected' : 'pending') : 'collected',
          assignedAt: dispatchDetails.assignedAt || new Date().toISOString(),
          dispatchedAt: new Date().toISOString(),
        };

        return {
          ...o,
          orderStatus: newStatus,
          assignedDeliveryStaffId: dispatchDetails.riderId || (dispatchDetails.fulfillmentType === 'express_partner' ? 'carrier-partner' : undefined),
          deliveryStaffName: dispatchDetails.fulfillmentType === 'express_partner'
            ? `${dispatchDetails.carrier} (${dispatchDetails.awbNumber || 'Express'})`
            : dispatchDetails.riderName,
          dispatchDetails: enrichedDispatch,
          statusHistory: [...o.statusHistory, newHistoryItem],
        };
      })
    );

    // If assigned to a partner, increment shipment count
    if (dispatchDetails.fulfillmentType === 'express_partner') {
      setDeliveryPartners((prev) =>
        prev.map((dp) =>
          dp.partnerName === dispatchDetails.carrier
            ? { ...dp, totalShipmentsDispatched: dp.totalShipmentsDispatched + 1 }
            : dp
        )
      );
    }

    if (!orderFound) return { success: false, message: 'Order not found.' };

    return {
      success: true,
      message: dispatchDetails.fulfillmentType === 'express_partner'
        ? `Order ${orderId} dispatched with ${dispatchDetails.carrier}! AWB: ${dispatchDetails.awbNumber || 'Assigned'}. Customer can now track it.`
        : `Order ${orderId} assigned to local rider ${dispatchDetails.riderName || 'Courier'} for doorstep delivery!`,
    };
  };

  const syncShiprocketOrderStatus = async (
    orderId: string,
    customAwb?: string
  ): Promise<{ success: boolean; message: string; syncResult?: ShiprocketSyncResult }> => {
    const targetOrder = orders.find((o) => o.id === orderId);
    if (!targetOrder) {
      return { success: false, message: `Order ${orderId} not found.` };
    }

    const awb = customAwb || targetOrder.dispatchDetails?.awbNumber;
    if (!awb) {
      return {
        success: false,
        message: `No AWB number assigned to order ${orderId}. Please assign an AWB before syncing status.`,
      };
    }

    try {
      const syncResult = await syncShipmentStatus(targetOrder, awb);

      setOrders((prev) =>
        prev.map((o) => {
          if (o.id !== orderId) return o;

          const newStatus = (syncResult.mappedOrderStatus as OrderStatus) || o.orderStatus;
          const isDelivered = newStatus === 'delivered';

          const note = `Shiprocket Status Synced: ${syncResult.carrierStatus} (${syncResult.statusLabel}). Latest: ${syncResult.latestActivity} at ${syncResult.latestLocation}`;

          const newHistoryItem: OrderStatusHistoryItem = {
            status: newStatus,
            timestamp: new Date().toISOString(),
            note,
            updatedBy: 'Shiprocket API Sync',
          };

          const isCod = o.paymentMethod === 'cod';
          const updatedDispatch: ExpressShipmentDetails = {
            ...(o.dispatchDetails || {
              fulfillmentType: 'express_partner',
              carrier: 'Shiprocket',
              isCod,
              codAmountToCollect: isCod ? o.finalTotal : 0,
              codCollectedStatus: isCod ? 'pending' : 'collected',
            }),
            awbNumber: syncResult.awbCode,
            carrier: (syncResult.carrier as ExpressCarrierName) || o.dispatchDetails?.carrier || 'Shiprocket',
            trackingUrl: syncResult.trackingUrl,
            estimatedDeliveryDate: syncResult.estimatedDeliveryDate,
            codCollectedStatus: isCod
              ? isDelivered
                ? 'collected'
                : syncResult.mappedCodStatus || o.dispatchDetails?.codCollectedStatus || 'pending'
              : 'collected',
          };

          return {
            ...o,
            orderStatus: newStatus,
            paymentStatus: isDelivered && isCod ? 'verified_paid' : o.paymentStatus,
            dispatchDetails: updatedDispatch,
            statusHistory: [...o.statusHistory, newHistoryItem],
          };
        })
      );

      return {
        success: true,
        message: `Order ${orderId} synced with Shiprocket! Current status: ${syncResult.carrierStatus} (${syncResult.statusLabel}).`,
        syncResult,
      };
    } catch (err: any) {
      return {
        success: false,
        message: err.message || 'Failed to synchronize with Shiprocket API.',
      };
    }
  };

  const recordCodCollection = (
    orderId: string,
    collectedAmount: number,
    method: 'cash' | 'doorstep_upi_qr',
    collectorName: string,
    notes?: string
  ) => {
    let orderFound = false;

    setOrders((prev) =>
      prev.map((o) => {
        if (o.id !== orderId) return o;
        orderFound = true;

        const timestamp = new Date().toISOString();
        const updatedDispatch: ExpressShipmentDetails | undefined = o.dispatchDetails
          ? {
              ...o.dispatchDetails,
              codCollectedStatus: 'collected',
              codCollectedAt: timestamp,
              codCollectedMethod: method,
              codCollectorName: collectorName,
              codReferenceNotes: notes,
            }
          : undefined;

        // If collected by an in-house rider in physical cash, increment rider's cash-in-hand
        if (method === 'cash' && o.dispatchDetails?.riderId) {
          const riderId = o.dispatchDetails.riderId;
          setRidersList((prevRiders) =>
            prevRiders.map((r) =>
              r.id === riderId ? { ...r, codCashInHand: r.codCashInHand + collectedAmount } : r
            )
          );
        }

        const newHistoryItem: OrderStatusHistoryItem = {
          status: 'delivered',
          timestamp,
          note: `COD Payment of ${formatINR(collectedAmount)} collected via ${method === 'cash' ? 'Cash' : 'Doorstep UPI QR'} by ${collectorName}. Order delivered.`,
          updatedBy: collectorName,
        };

        return {
          ...o,
          orderStatus: 'delivered',
          paymentStatus: 'verified_paid',
          paymentDetails: {
            transactionId: `COD-${Date.now()}-${method.toUpperCase()}`,
            paidAt: timestamp,
            verifiedBy: `${collectorName} (Doorstep Verification)`,
          },
          deliveryProof: {
            note: notes || 'Delivered with COD collection confirmed',
            collectedAmount,
            receiverName: o.customer.name,
            timestamp,
          },
          dispatchDetails: updatedDispatch,
          statusHistory: [...o.statusHistory, newHistoryItem],
        };
      })
    );

    if (!orderFound) return { success: false, message: 'Order not found.' };
    return { success: true, message: `COD collection of ${formatINR(collectedAmount)} recorded! Order marked as Delivered.` };
  };

  const submitRiderCashRemittance = (payload: {
    riderId: string;
    amount: number;
    submissionMethod: 'cash_deposit' | 'upi_qr';
    outletId: string;
    orderIds?: string[];
    qrDataUrl?: string;
    customCode?: string;
    notes?: string;
  }) => {
    const rider = ridersList.find((r) => r.id === payload.riderId) || ridersList[0];
    if (!rider) return { success: false, message: 'Rider not found.' };

    const targetOutlet = outlets.find((o) => o.id === payload.outletId) || outlets[0];
    const remittanceId = `REMIT-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;
    const cleanCustomCode = payload.customCode?.replace(/\D/g, '');
    const remittanceCode =
      cleanCustomCode && cleanCustomCode.length === 8
        ? cleanCustomCode
        : Math.floor(10000000 + Math.random() * 90000000).toString(); // 8-digit cash deposit code

    const newSubmission: RiderRemittanceSubmission = {
      id: remittanceId,
      riderId: rider.id,
      riderName: rider.name,
      riderPhone: rider.phone,
      amount: Number(payload.amount),
      submissionMethod: payload.submissionMethod,
      status: 'pending_approval',
      remittanceCode,
      notes: payload.notes,
      qrDataUrl: payload.qrDataUrl,
      qrPayload: `je://remit?id=${remittanceId}&rider=${encodeURIComponent(rider.name)}&amount=${payload.amount}&code=${remittanceCode}`,
      orderIds: payload.orderIds || [],
      outletId: targetOutlet?.id || 'out_hazratganj',
      outletName: targetOutlet?.name || 'Hazratganj Flagship Outlet',
      submittedAt: new Date().toISOString(),
      receiptNumber: `RCPT-${remittanceCode.slice(-6)}`,
    };

    setRiderRemittances((prev) => [newSubmission, ...prev]);
    return {
      success: true,
      message: `8-Digit Cash Deposit Code (${remittanceCode}) generated for ${formatINR(payload.amount)} by ${rider.name}. Share this code with Store or Admin to approve cash collection!`,
      remittance: newSubmission,
    };
  };

  const approveRiderCashRemittance = (
    remittanceIdOrCode: string,
    approvedBy: string,
    notes?: string
  ) => {
    const cleanLookup = remittanceIdOrCode.trim().replace(/\s+/g, '').toLowerCase();
    const targetSubmission = riderRemittances.find(
      (r) =>
        r.id.toLowerCase() === cleanLookup ||
        r.remittanceCode.replace(/\s+/g, '').toLowerCase() === cleanLookup
    );

    if (!targetSubmission) {
      return {
        success: false,
        message: `No cash deposit request found matching 8-digit code or ID "${remittanceIdOrCode}". Please check the 8-digit code and try again.`,
      };
    }

    if (targetSubmission.status === 'approved') {
      return {
        success: false,
        message: `Code ${targetSubmission.remittanceCode} (${formatINR(targetSubmission.amount)}) has already been approved by ${targetSubmission.approvedBy || 'Store'}.`,
      };
    }

    const approvedTimestamp = new Date().toISOString();
    const updatedRemittance: RiderRemittanceSubmission = {
      ...targetSubmission,
      status: 'approved',
      approvedAt: approvedTimestamp,
      approvedBy,
      approvalNotes:
        notes ||
        `8-digit code (${targetSubmission.remittanceCode}) verified & cash deposit approved by ${approvedBy}. Credited to store counter drawer.`,
    };

    setRiderRemittances((prev) =>
      prev.map((r) => (r.id === targetSubmission.id ? updatedRemittance : r))
    );

    // Deduct cashInHand from rider
    const remittedAmount = targetSubmission.amount;
    const targetRiderId = targetSubmission.riderId;
    setRidersList((prev) =>
      prev.map((r) =>
        r.id === targetRiderId
          ? { ...r, codCashInHand: Math.max(0, (r.codCashInHand || 0) - remittedAmount) }
          : r
      )
    );

    // Update covered orders to 'remitted'
    const coveredOrderIds = targetSubmission.orderIds || [];
    setOrders((prev) =>
      prev.map((o) => {
        if (
          coveredOrderIds.includes(o.id) ||
          (o.dispatchDetails?.riderId === targetRiderId && o.dispatchDetails.codCollectedStatus === 'collected')
        ) {
          if (o.dispatchDetails) {
            return {
              ...o,
              dispatchDetails: {
                ...o.dispatchDetails,
                codCollectedStatus: 'remitted',
                riderRemittanceId: targetSubmission.id,
                riderRemittedAt: approvedTimestamp,
              },
            };
          }
        }
        return o;
      })
    );

    return {
      success: true,
      message: `8-Digit Code ${targetSubmission.remittanceCode} verified! Cash deposit of ${formatINR(remittedAmount)} from ${targetSubmission.riderName} APPROVED and added to store cash drawer.`,
      remittance: updatedRemittance,
    };
  };

  const rejectRiderCashRemittance = (remittanceId: string, reason: string, rejectedBy: string) => {
    setRiderRemittances((prev) =>
      prev.map((r) =>
        r.id === remittanceId
          ? {
              ...r,
              status: 'rejected',
              approvalNotes: `Rejected by ${rejectedBy}: ${reason}`,
            }
          : r
      )
    );
    return { success: true, message: `Remittance request ${remittanceId} rejected.` };
  };

  const recordCarrierCodSettlement = (payload: {
    carrier: ExpressCarrierName;
    bankUtrNumber: string;
    settlementDate: string;
    grossCodCollected: number;
    carrierDeductions: number;
    netAmountCredited: number;
    orderIds: string[];
    awbNumbers: string[];
    settledBy: string;
    reconciliationNotes?: string;
  }) => {
    const settlementId = `SETTLE-${payload.carrier.toUpperCase().slice(0, 3)}-${Date.now().toString().slice(-4)}`;

    const newSettlement: CarrierCodSettlement = {
      id: settlementId,
      carrier: payload.carrier,
      bankUtrNumber: payload.bankUtrNumber,
      settlementDate: payload.settlementDate,
      grossCodCollected: payload.grossCodCollected,
      carrierDeductions: payload.carrierDeductions,
      netAmountCredited: payload.netAmountCredited,
      orderIds: payload.orderIds,
      awbNumbers: payload.awbNumbers,
      status: 'verified_settled',
      settledBy: payload.settledBy,
      reconciliationNotes: payload.reconciliationNotes,
      createdAt: new Date().toISOString(),
    };

    setCarrierSettlements((prev) => [newSettlement, ...prev]);

    // Update all matching orders to 'settled_to_admin'
    const targetOrderIds = payload.orderIds;
    setOrders((prev) =>
      prev.map((o) => {
        if (targetOrderIds.includes(o.id)) {
          const timestamp = new Date().toISOString();
          const updatedDispatch: ExpressShipmentDetails | undefined = o.dispatchDetails
            ? {
                ...o.dispatchDetails,
                codCollectedStatus: 'settled_to_admin',
                carrierSettlementId: settlementId,
                carrierSettlementUtr: payload.bankUtrNumber,
                carrierSettledAt: timestamp,
              }
            : undefined;

          const newHistoryItem: OrderStatusHistoryItem = {
            status: o.orderStatus,
            timestamp,
            note: `COD of ${formatINR(o.finalTotal)} settled by ${payload.carrier} to Admin Bank A/c (UTR: ${payload.bankUtrNumber}). Verified by ${payload.settledBy}.`,
            updatedBy: payload.settledBy,
          };

          return {
            ...o,
            dispatchDetails: updatedDispatch,
            statusHistory: [...o.statusHistory, newHistoryItem],
          };
        }
        return o;
      })
    );

    return {
      success: true,
      message: `Carrier COD Settlement of ${formatINR(payload.netAmountCredited)} from ${payload.carrier} recorded (UTR: ${payload.bankUtrNumber})! ${payload.orderIds.length} orders marked as Settled.`,
    };
  };

  const updateDeliveryPartnerConfig = (partnerId: string, updates: Partial<DeliveryPartnerAccount>) => {
    setDeliveryPartners((prev) =>
      prev.map((dp) => (dp.id === partnerId ? { ...dp, ...updates } : dp))
    );
    return { success: true, message: 'Delivery partner configuration updated successfully.' };
  };

  const addInHouseRider = (rider: InHouseRider) => {
    setRidersList((prev) => [...prev, rider]);
    return { success: true, message: `Rider ${rider.name} added to local fleet.` };
  };

  return (
    <StoreContext.Provider
      value={{
        products,
        categories,
        cart,
        orders,
        stockMovements,
        campaigns,
        coupons,
        settings,
        currentUser,
        currentRole,
        setCurrentRole,
        wishlist,

        // Authentication & Staff Credentials
        accounts,
        isAuthenticated,
        loginUser,
        verifyAdminOtpAndLogin,
        registerCustomer,
        createStoreStaffAccount,
        updateStoreStaffAccount,
        deleteStoreStaffAccount,
        logoutUser,

        // Multi-Outlet & Marketplace
        outlets,
        activeOutletId,
        setActiveOutletId,
        activeOutlet,
        createOutlet,
        updateOutlet,
        deleteOutlet,

        ownershipModels,
        updateOwnershipModel,

        businessCategories,
        createBusinessCategory,
        updateCategoryApprovalStatus,

        participants,
        payoutItems,
        financialLedger,
        createPayoutItem,
        updatePayoutStatus,
        addLedgerEntry,

        barcodeRecords,
        registerBarcodeRecord,
        verifyBarcodeLookup,

        stockTransfers,
        requestStockTransfer,
        processStockTransfer,

        franchiseAgreements,
        createAgreement,
        updateAgreement,

        searchQuery,
        setSearchQuery,
        selectedCategory,
        setSelectedCategory,
        selectedBrand,
        setSelectedBrand,
        sortBy,
        setSortBy,

        addToCart,
        removeFromCart,
        updateCartQuantity,
        clearCart,
        appliedCoupon,
        applyCoupon,
        removeCoupon,

        cartSubtotal,
        cartCouponDiscount,
        cartBulkDiscount,
        cartTotalDiscount,
        cartDeliveryFee,
        cartTaxAmount,
        cartGstCalculation,
        cartFinalTotal,
        isFreeDeliveryEligible,
        amountNeededForFreeDelivery,

        createOrder,
        updateOrderStatus,
        verifyOrderPayment,
        assignDeliveryStaff,
        completeDelivery,
        reportDeliveryFailure,
        requestOrderCancellation,
        requestOrderReturn,
        cancelOrderOrItems,

        addProduct,
        updateProduct,
        deleteProduct,
        adjustStock,
        submitProductForApproval,
        approveProduct,
        rejectProduct,
        mapSellerToExistingProduct,
        updateSellerListingPrice,
        findMatchingCatalogueProducts,

        addCampaign,
        toggleCampaignStatus,
        addCoupon,
        toggleCouponStatus,

        updateSettings,
        toggleWishlist,
        addSavedAddress,

        activeModal,
        setActiveModal,
        selectedProductForDetail,
        setSelectedProductForDetail,
        selectedOrderForModal,
        setSelectedOrderForModal,
        qrModalData,
        openQrModal,
        closeQrModal,
        selectedPolicyType,
        openPolicyModal,
        checkPincodeServiceable,

        // MODULE 1, 2 & 3: Payments & WhatsApp Review
        activeUpiSession,
        setActiveUpiSession,
        createUpiCheckoutSession,
        paymentTransactions,
        verifyPaymentTransaction,
        initiateOrderRefund,
        whatsAppPaymentSubmissions,
        submitWhatsAppPayment,
        reviewWhatsAppPayment,

        // MODULE 4: Branding Settings
        brandingSettings,
        brandingHistory,
        updateBrandingSettings,
        rollbackBrandingSettings,

        // MODULE 5: Business Rules & Policies
        businessRules,
        updateBusinessRule,
        createBusinessRule,

        // MODULE 6: Document Centre
        platformDocuments,
        uploadDocument,
        updateDocumentStatus,

        // MODULE 7 & 8: Social Proof & Reviews
        productReviews,
        submitProductReview,
        moderateProductReview,
        voteReviewHelpful,
        replyToReview,
        getProductMetrics,

        // MODULE 9: User Trust Segmentation & Appeals
        trustProfiles,
        trustAppeals,
        updateTrustProfile,
        submitTrustAppeal,
        resolveTrustAppeal,

        // MODULE 10: Shop & Outlet Performance
        shopPerformances,

        // Delivery Pincode & Area Coverage (Any or Specific Store)
        deliveryZones,
        addDeliveryZone,
        updateDeliveryZone,
        deleteDeliveryZone,
        toggleDeliveryZoneStatus,
        getDeliveryZoneForPincode,
        getZoneForPincode: getDeliveryZoneForPincode,

        // Bulk Order Volume Discounts & Rules Engine
        bulkDiscountRules,
        addBulkDiscountRule,
        updateBulkDiscountRule,
        deleteBulkDiscountRule,
        toggleBulkDiscountRuleStatus,
        resetBulkDiscountRules,

        // 100% Configurable Homepage Sections (Brand, Sale, Category, Price, Combo, Offer, Activity, Like, Festive)
        homepageSettings,
        updateHomepageSettings,
        updateHomepageSection,
        reorderHomepageSection,
        resetHomepageSettings,
        productLikes,
        userLikedProducts,
        toggleProductLike,
        addComboToCart,
        activeBudgetFilter,
        setActiveBudgetFilter,
        activeActivityFilter,
        setActiveActivityFilter,

        // Automated Festival Homepage Campaigns
        festivalCampaigns,
        activeFestivalCampaign,
        previewFestivalCampaign,
        setPreviewFestivalCampaign,
        refreshFestivalCampaigns,

        // Multiple Payment Gateways
        paymentGateways,
        activePaymentGateways,
        paymentGatewayAuditLogs,
        togglePaymentGatewayStatus,
        updatePaymentGateway,
        resetPaymentGateways,

        // SOP & SLA Operational Metrics & Operations Matrix
        sopSlaConfig,
        outletCompliance,
        updateLifecycleSla,
        updateStressMetricThreshold,
        applySlaPreset,
        addOrUpdateCustomerTag,
        deleteCustomerTag,
        addOrUpdateSellerTag,
        deleteSellerTag,
        resetSopSlaToDefault,

        // Express Delivery, Shiprocket & In-House Rider Management
        deliveryPartners,
        ridersList,
        riderRemittances,
        carrierSettlements,
        assignOrderDelivery,
        syncShiprocketOrderStatus,
        recordCodCollection,
        submitRiderCashRemittance,
        approveRiderCashRemittance,
        rejectRiderCashRemittance,
        recordCarrierCodSettlement,
        updateDeliveryPartnerConfig,
        addInHouseRider,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};

export function useStore() {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
}
