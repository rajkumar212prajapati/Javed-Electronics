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
} from '../types';
import {
  INITIAL_CATEGORIES,
  INITIAL_COUPONS,
  INITIAL_CAMPAIGNS,
  INITIAL_ORDERS,
  INITIAL_PRODUCTS,
  INITIAL_SETTINGS,
  INITIAL_STOCK_MOVEMENTS,
  INITIAL_USER,
} from '../data/mockData';
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
  cartDeliveryFee: number;
  cartTaxAmount: number;
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

  // Product & Inventory actions
  addProduct: (product: Omit<Product, 'id'>) => void;
  updateProduct: (product: Product) => void;
  deleteProduct: (productId: string) => void;
  adjustStock: (productId: string, newOnHand: number, reason: string, staffName?: string) => void;

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

  // Serviceable PIN code check
  checkPincodeServiceable: (pincode: string) => boolean;

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

  const [currentRole, setCurrentRole] = useState<Role>('customer');
  const [wishlist, setWishlist] = useState<string[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}wishlist`);
    return saved ? JSON.parse(saved) : ['prod-001', 'prod-006'];
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
    localStorage.setItem(`${STORAGE_KEY_PREFIX}wishlist`, JSON.stringify(wishlist));
  }, [wishlist]);

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

  const cartFinalTotal = useMemo(() => {
    if (cart.length === 0) return 0;
    const base = cartSubtotal - cartCouponDiscount + cartDeliveryFee;
    return Math.max(0, Math.round(base));
  }, [cart.length, cartSubtotal, cartCouponDiscount, cartDeliveryFee]);

  // Estimated Tax Amount embedded in total (standard Indian 18% retail GST)
  const cartTaxAmount = useMemo(() => {
    if (cartFinalTotal <= 0) return 0;
    const base = cartFinalTotal / 1.18;
    return Math.round((cartFinalTotal - base) * 100) / 100;
  }, [cartFinalTotal]);

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
      });

      const unitPrice = prod.dealPrice || prod.regularPrice;
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

    const newOrder: Order = {
      id: orderId,
      invoiceNumber,
      createdAt: nowIso,
      customer: payload.customer,
      items: orderItems,
      subtotal: cartSubtotal,
      discountTotal: cartCouponDiscount,
      couponCode: appliedCoupon?.code,
      couponDiscount: cartCouponDiscount,
      deliveryFee: payload.deliveryType === 'store_pickup' ? 0 : cartDeliveryFee,
      taxAmount: cartTaxAmount,
      finalTotal: payload.deliveryType === 'store_pickup' ? cartSubtotal - cartCouponDiscount : cartFinalTotal,
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
      qrCodeDataUrl,
      whatsappMessageSent: !!payload.isWhatsAppCheckout,
    };

    // Update state
    setProducts(newProducts);
    setStockMovements((prev) => [...newStockMovements, ...prev]);
    setOrders((prev) => [newOrder, ...prev]);

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
    const orderToUpdate = orders.find((o) => o.id === orderId);
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

  const checkPincodeServiceable = (pincode: string) => {
    const clean = pincode.trim();
    return settings.serviceablePincodes.includes(clean);
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
        cartDeliveryFee,
        cartTaxAmount,
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

        addProduct,
        updateProduct,
        deleteProduct,
        adjustStock,

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
