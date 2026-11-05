import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import {
  Address,
  CartItem,
  CategoryItem,
  SubCategoryItem,
  CategoryCommissionStructure,
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
  AccountStatus,
  AccountSanctionDuration,
  AccountSanction,
  Outlet,
  OutletStatus,
  StoreOrderAcceptanceConfig,
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
  OrderRtoDetails,
  ReferralProgramConfig,
  ReferralRecord,
  PromotionalPage,
  ChatbotAiSettings,
  ChatbotKnowledgeItem,
  CategoryReturnPolicy,
  ReturnExchangeRequest,
  ReturnPolicyType,
  ReturnRequestStatus,
  ReturnReasonCode,
  MahaSaleParticipation,
  MahaSaleStatus,
  MahaSaleSlot,
  PromotionType,
  PromotionSlot,
  StoreSlotProductBanner,
  JeAssuredSopConfig,
  JeAssuredHealthMetrics,
  StorePromotionRequest,
  CategoryListingFormat,
  JeCashTransaction,
} from '../types';
import {
  INITIAL_CATEGORY_LISTING_FORMATS,
  resolveFormatForCategory,
} from '../data/categoryFormatsData';
import {
  INITIAL_CATEGORY_RETURN_POLICIES,
  INITIAL_RETURN_EXCHANGE_REQUESTS,
} from '../data/returnPoliciesData';
import {
  INITIAL_MAHA_SALE_SLOTS,
  INITIAL_MAHA_SALE_PARTICIPATIONS,
  INITIAL_PROMOTION_TYPES,
  INITIAL_PROMOTION_SLOTS,
  INITIAL_STORE_SLOT_BANNERS,
  INITIAL_JE_ASSURED_SOP_CONFIG,
  INITIAL_STORE_PROMOTION_REQUESTS,
  computeProductJeAssuredHealth,
  getEligibilityTierFromScore,
} from '../data/mahaSaleData';
import { INITIAL_PROMOTIONAL_PAGES, isPromotionalPageCurrentlyActive } from '../utils/promotionalEngine';
import { INITIAL_CHATBOT_AI_SETTINGS, INITIAL_CHATBOT_KNOWLEDGE_BASE } from '../data/chatbotKnowledgeData';
import { syncShipmentStatus } from '../services/shiprocketService';
import { formatINR } from '../utils/currency';
import {
  safeLocalStorageSetItem,
  safeLocalStorageGetItem,
  safeLocalStorageRemoveItem,
  serializeCartSafely,
  rehydrateCartSafely,
} from '../utils/storage';
import { verifyAdminOtp } from '../utils/authenticator';
import {
  calculateHaversineDistanceKm,
  estimateDeliveryMinutes,
  generateSuggestedRouteSteps,
  getGoogleMapsNavigationUrl,
  DEFAULT_STORE_COORDINATES,
  isLegacyOrInvalidCoord,
  sanitizeStoreCoordinates,
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
  RiderEarningStructure,
  RiderDeliverySlot,
  RiderPayoutRecord,
  INITIAL_RIDER_EARNING_STRUCTURE,
  INITIAL_RIDER_SLOTS,
  INITIAL_RIDER_PAYOUTS,
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
  INITIAL_REFERRAL_PROGRAM_CONFIG,
  INITIAL_REFERRAL_RECORDS,
  INITIAL_JE_CASH_TRANSACTIONS,
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
import { getDefaultOrderAcceptanceConfig } from '../data/storeTypesData';
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
import { cleanCustomerName } from '../utils/cleaners';

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
  initiateCustomerSignupOtp: (data: { name: string; email: string; phone: string; password: string; city?: string; pincode?: string; addressLine?: string }) => { success: boolean; message: string; otpCode?: string; resendSeconds?: number };
  resendCustomerSignupOtp: (email: string) => { success: boolean; message: string; otpCode?: string; resendSeconds?: number };
  verifyCustomerSignupOtp: (email: string, enteredOtp: string) => { success: boolean; message: string; user?: UserProfile };
  createStoreStaffAccount: (data: { name: string; email: string; phone: string; password: string; role: Role; outletId?: string }) => { success: boolean; message: string };
  updateStoreStaffAccount: (id: string, updates: Partial<UserAccount>) => { success: boolean; message: string };
  deleteStoreStaffAccount: (id: string) => { success: boolean; message: string };
  applyAccountSanction: (
    accountId: string,
    payload: {
      status: AccountStatus;
      reason: string;
      duration: AccountSanctionDuration;
      expiresAt?: string;
      reVerificationRequirements?: string[];
      notes?: string;
      appliedBy?: string;
    }
  ) => { success: boolean; message: string; account?: UserAccount };
  liftAccountSanction: (
    accountId: string,
    resolutionNote?: string
  ) => { success: boolean; message: string; account?: UserAccount };
  logoutUser: () => void;

  // Multi-Outlet Management
  outlets: Outlet[];
  activeOutletId: string;
  setActiveOutletId: (id: string) => void;
  activeOutlet: Outlet | undefined;
  createOutlet: (outlet: Omit<Outlet, 'id' | 'createdAt'>) => void;
  updateOutlet: (outlet: Outlet) => void;
  deleteOutlet: (id: string) => void;
  toggleOutletStatus: (id: string, newStatus?: OutletStatus) => void;
  updateOutletOrderAcceptanceConfig: (id: string, config: StoreOrderAcceptanceConfig) => void;

  // Ownership Models
  ownershipModels: OutletOwnershipRules[];
  updateOwnershipModel: (model: OutletOwnershipRules) => void;

  // Business Category Management & Approval
  businessCategories: BusinessCategory[];
  createBusinessCategory: (cat: Omit<BusinessCategory, 'id' | 'itemCount'>) => void;
  updateCategoryApprovalStatus: (id: string, status: CategoryApprovalStatus, note?: string) => void;
  addCategory: (data: {
    name: string;
    description?: string;
    iconName?: string;
    imageUrl?: string;
    defaultGstRate?: number;
    commissionStructure?: CategoryCommissionStructure;
    subCategories?: SubCategoryItem[];
  }) => { success: boolean; message: string; category?: CategoryItem };
  updateCategory: (
    categoryId: ProductCategory,
    updates: Partial<CategoryItem>
  ) => { success: boolean; message: string };
  deleteCategory: (categoryId: ProductCategory) => { success: boolean; message: string };
  addSubCategory: (
    parentCategoryId: ProductCategory,
    subCat: {
      name: string;
      description?: string;
      imageUrl?: string;
      iconName?: string;
      commissionPercent?: number;
    }
  ) => { success: boolean; message: string; subCategory?: SubCategoryItem };
  updateSubCategory: (
    parentCategoryId: ProductCategory,
    subCatId: string,
    updates: Partial<SubCategoryItem>
  ) => { success: boolean; message: string };
  deleteSubCategory: (
    parentCategoryId: ProductCategory,
    subCatId: string
  ) => { success: boolean; message: string };
  fullScreenCategory: ProductCategory | 'all' | null;
  setFullScreenCategory: (cat: ProductCategory | 'all' | null) => void;

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
  selectedSubCategory: string | 'all';
  setSelectedSubCategory: (subCat: string | 'all') => void;
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
    informHubForDispatch?: boolean;
    isPartialPrepaidCod?: boolean;
    partialPrepaidAmount?: number;
    codBalanceOnDelivery?: number;
    partialPrepaidMethod?: string;
    prepaidDiscount?: number;
    codExtraCharge?: number;
    paymentProof?: {
      screenshotUrl?: string;
      utrNumber?: string;
    };
  }) => Promise<Order>;
  updateOrderStatus: (orderId: string, status: OrderStatus, note?: string, updatedBy?: string) => void;
  verifyOrderPayment: (orderId: string, transactionId?: string) => void;
  assignDeliveryStaff: (orderId: string, staffId: string, staffName: string) => void;
  completeDelivery: (
    orderId: string,
    proof: {
      collectedAmount?: number;
      paymentMethodCollected?: 'cash' | 'doorstep_upi_qr';
      note?: string;
      receiverName?: string;
      podImageUrl?: string;
      deliveryPinEntered?: string;
      verifiedOtp?: boolean;
      customerFeedback?: {
        rating: number;
        tags: string[];
        comment?: string;
        submittedAt: string;
      };
    }
  ) => void;
  submitDeliveryCustomerFeedback: (
    orderId: string,
    feedback: {
      rating: number;
      tags: string[];
      comment?: string;
      submittedAt?: string;
    }
  ) => void;
  reportDeliveryFailure: (orderId: string, reason: string) => void;
  requestOrderCancellation: (orderId: string, reason: string) => void;
  requestOrderReturn: (
    orderId: string,
    reason: string,
    details?: {
      issueType?: string;
      productId?: string;
      productName?: string;
      sku?: string;
      serialNumber?: string;
      unboxingVideoUrl?: string;
      unboxingVideoName?: string;
      proofImages?: string[];
      requestType?: 'refund' | 'replacement' | 'exchange';
    }
  ) => void;
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
  updateCoupon: (couponId: string, updates: Partial<Coupon>) => { success: boolean; message: string };
  deleteCoupon: (couponId: string) => { success: boolean; message: string };

  // Referral Program Structure & Operations
  referralProgramConfig: ReferralProgramConfig;
  updateReferralProgramConfig: (updates: Partial<ReferralProgramConfig>, updatedBy?: string) => { success: boolean; message: string };
  referralRecords: ReferralRecord[];
  awardReferralBonus: (recordId: string, notes?: string) => { success: boolean; message: string };
  cancelReferralRecord: (recordId: string, reason?: string) => { success: boolean; message: string };
  adjustCustomerWalletBalance: (targetPhoneOrId: string, amountDiff: number, reason: string) => { success: boolean; message: string };

  // JE Cash (Store Wallet & Instant Payment)
  jeCashTransactions: JeCashTransaction[];
  refillJeCashBalance: (amount: number, paymentMethodName?: string, transactionNote?: string) => { success: boolean; message: string; transactionId: string; newBalance: number };
  deductJeCashBalance: (amount: number, orderId?: string, reason?: string) => { success: boolean; message: string; newBalance: number };

  // Promotional Landing Pages & Marketing Spaces
  promotionalPages: PromotionalPage[];
  activePromotionalPage: PromotionalPage | null;
  setActivePromotionalPage: (page: PromotionalPage | null) => void;
  addPromotionalPage: (page: Omit<PromotionalPage, 'id' | 'createdAt' | 'updatedAt'>) => { success: boolean; message: string; page?: PromotionalPage };
  updatePromotionalPage: (pageId: string, updates: Partial<PromotionalPage>) => { success: boolean; message: string };
  deletePromotionalPage: (pageId: string) => { success: boolean; message: string };
  togglePromotionalPageStatus: (pageId: string) => { success: boolean; message: string };
  openPromotionalPageBySlug: (slug: string) => boolean;

  // Chatbot AI & Knowledge Base Training
  chatbotAiSettings: ChatbotAiSettings;
  updateChatbotAiSettings: (updates: Partial<ChatbotAiSettings>) => { success: boolean; message: string };
  addKnowledgeItem: (item: Omit<ChatbotKnowledgeItem, 'id' | 'lastUpdated'>) => { success: boolean; message: string; item?: ChatbotKnowledgeItem };
  updateKnowledgeItem: (itemId: string, updates: Partial<ChatbotKnowledgeItem>) => { success: boolean; message: string };
  deleteKnowledgeItem: (itemId: string) => { success: boolean; message: string };
  toggleKnowledgeItemStatus: (itemId: string) => { success: boolean; message: string };
  resetKnowledgeBaseToDefaults: () => { success: boolean; message: string };

  // Settings
  updateSettings: (newSettings: Partial<StoreSettings>) => void;

  // User actions
  toggleWishlist: (productId: string) => void;
  addSavedAddress: (address: Omit<Address, 'id'>) => void;
  updateUserProfile: (updates: Partial<Pick<UserProfile, 'name' | 'phone' | 'email'>>) => { success: boolean; message: string };
  deleteSavedAddress: (addressId: string) => void;
  setDefaultAddress: (addressId: string) => void;
  redeemReferralCode: (code: string) => { success: boolean; message: string; bonusAdded?: number };

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
  approveUpiPayment: (orderId: string, notes?: string, adminName?: string) => { success: boolean; message: string };
  rejectUpiPayment: (orderId: string, reason: string, adminName?: string) => { success: boolean; message: string };
  updateUpiSettings: (upiId: string, upiName?: string) => { success: boolean; message: string };
  updatePaymentChargeSettings: (config: {
    codExtraChargeEnabled: boolean;
    codExtraChargeType: 'fixed' | 'percentage';
    codExtraChargeValue: number;
    prepaidDiscountEnabled: boolean;
    prepaidDiscountType: 'percentage' | 'fixed';
    prepaidDiscountValue: number;
    prepaidMaxDiscountAmount?: number;
  }) => { success: boolean; message: string };
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
  onboardNewRider: (riderData: {
    name: string;
    phone: string;
    email?: string;
    password?: string;
    vehicleNo: string;
    outletId: string;
    outletName: string;
    aadharNumber: string;
    panNumber: string;
    bankAccountNo: string;
    ifscCode: string;
    selfieUrl?: string;
  }) => { success: boolean; message: string; rider?: InHouseRider };
  transferRiderStore: (riderId: string, targetOutletId: string, targetOutletName: string) => { success: boolean; message: string };
  requestRiderStoreTransfer: (riderId: string, targetOutletId: string, targetOutletName: string, reason: string) => { success: boolean; message: string };
  approveRiderStoreTransfer: (riderId: string) => { success: boolean; message: string };
  rejectRiderStoreTransfer: (riderId: string, reviewNotes?: string) => { success: boolean; message: string };
  toggleRiderOnlineStatus: (riderId: string, isOnline: boolean) => void;
  autoAssignOrdersToRiders: () => { success: boolean; message: string; count: number };
  requestOrderRto: (orderId: string, rtoPayload: OrderRtoDetails) => { success: boolean; message: string };
  reviewOrderRto: (orderId: string, decision: 'approved' | 'rejected', reviewNotes?: string) => { success: boolean; message: string };

  // Rider Earning Structure, Slot Management & Payout Module
  riderEarningStructure: RiderEarningStructure;
  updateRiderEarningStructure: (updates: Partial<RiderEarningStructure>, updatedBy?: string) => { success: boolean; message: string };
  recalculateAllRidersEarningsFromStructure: () => { success: boolean; message: string };
  updateIndividualRiderEarnings: (
    riderId: string,
    earningsUpdate: {
      slotEarnings: number;
      orderEarnings: number;
      distanceEarnings: number;
      incentiveEarnings: number;
      surgeEarnings: number;
      milestoneEarnings: number;
    }
  ) => { success: boolean; message: string };

  riderSlots: RiderDeliverySlot[];
  createRiderSlot: (slotData: Omit<RiderDeliverySlot, 'id' | 'createdAt' | 'enrolledRiderIds'> & { enrolledRiderIds?: string[] }) => { success: boolean; message: string; slot?: RiderDeliverySlot };
  updateRiderSlot: (slotId: string, updates: Partial<RiderDeliverySlot>) => { success: boolean; message: string };
  deleteRiderSlot: (slotId: string) => { success: boolean; message: string };
  toggleRiderSlotEnrollment: (slotId: string, riderId: string) => { success: boolean; message: string; enrolled: boolean };

  riderPayouts: RiderPayoutRecord[];
  createRiderPayout: (payload: {
    riderId: string;
    periodLabel: string;
    paymentMethod: 'IMPS' | 'NEFT' | 'UPI_INSTANT';
    codDeductionsOrPenalties?: number;
    notes?: string;
    utrReference?: string;
    markPaidImmediately?: boolean;
  }) => { success: boolean; message: string; payout?: RiderPayoutRecord };
  createBatchRiderPayouts: (periodLabel: string, paymentMethod: 'IMPS' | 'NEFT' | 'UPI_INSTANT') => { success: boolean; message: string; count: number };
  processRiderPayoutStatus: (
    payoutId: string,
    status: 'pending_approval' | 'processing' | 'paid' | 'on_hold',
    utrReference?: string,
    approvedBy?: string,
    notes?: string
  ) => { success: boolean; message: string };

  // Return, Refund & Replacement Structure as per Category
  categoryReturnPolicies: CategoryReturnPolicy[];
  returnExchangeRequests: ReturnExchangeRequest[];
  updateCategoryReturnPolicy: (categoryId: ProductCategory, updates: Partial<CategoryReturnPolicy>) => { success: boolean; message: string };
  resetCategoryReturnPolicies: () => { success: boolean; message: string };
  getCategoryReturnPolicy: (categoryId: ProductCategory) => CategoryReturnPolicy;
  submitReturnExchangeRequest: (reqData: {
    orderId: string;
    invoiceNumber: string;
    outletId?: string;
    outletName?: string;
    customerId?: string;
    customerName: string;
    customerPhone: string;
    customerEmail?: string;
    productId: string;
    productName: string;
    productSku: string;
    productImage: string;
    categoryId: ProductCategory;
    categoryName: string;
    quantity: number;
    itemUnitPrice: number;
    itemTotal: number;
    requestType: 'refund' | 'replacement' | 'exchange';
    reason: ReturnReasonCode;
    reasonDescription: string;
    conditionChecklistConfirmed: boolean;
    customerConditionNotes?: string;
    serialNumber?: string;
    unboxingVideoUrl?: string;
    unboxingVideoName?: string;
    evidenceImages?: string[];
    exchangeOptions?: {
      requestedSize?: string;
      requestedColor?: string;
      notes?: string;
    };
    refundMethod: 'original_payment' | 'wallet_credits' | 'bank_transfer_upi';
    refundAmount: number;
    walletBonusAmount?: number;
    bankUpiDetails?: {
      upiId?: string;
      accountNumber?: string;
      ifscCode?: string;
      accountHolderName?: string;
    };
    deliveredAt: string;
    pickupAddress: string;
    pickupSlot?: string;
  }) => { success: boolean; message: string; request?: ReturnExchangeRequest };
  updateReturnRequestStatus: (
    requestId: string,
    status: ReturnRequestStatus,
    note?: string,
    staffName?: string,
    assignedRider?: { id: string; name: string }
  ) => { success: boolean; message: string };
  processReturnRefund: (
    requestId: string,
    refundMethod: 'original_payment' | 'wallet_credits' | 'bank_transfer_upi',
    transactionId?: string,
    approverName?: string
  ) => { success: boolean; message: string };
  dispatchReturnReplacement: (
    requestId: string,
    replacementOrderId?: string,
    approverName?: string
  ) => { success: boolean; message: string };

  // Maha Sale Slots & Restructured Participation Module
  mahaSaleSlots: MahaSaleSlot[];
  createMahaSaleSlot: (
    slotData: Omit<MahaSaleSlot, 'id' | 'createdAt' | 'createdBy' | 'participatingStoreCount' | 'participatingProductCount'>
  ) => { success: boolean; message: string; slot?: MahaSaleSlot };
  updateMahaSaleSlot: (slotId: string, updates: Partial<MahaSaleSlot>) => { success: boolean; message: string };
  deleteMahaSaleSlot: (slotId: string) => { success: boolean; message: string };
  participateInMahaSaleSlot: (data: {
    slotId: string;
    storeId?: string;
    storeName?: string;
    items: Array<{
      productId: string;
      discountType: 'percentage' | 'fixed_value';
      discountValue: number;
    }>;
    storeNotes?: string;
  }) => { success: boolean; message: string; count: number };

  // Promotion Types & Slots Architecture (Admin manages types & slots; Store participates with product + banner)
  promotionTypes: PromotionType[];
  createPromotionType: (data: Omit<PromotionType, 'id' | 'createdAt'>) => { success: boolean; message: string; type?: PromotionType };
  updatePromotionType: (id: string, updates: Partial<PromotionType>) => { success: boolean; message: string };
  deletePromotionType: (id: string) => { success: boolean; message: string };

  promotionSlots: PromotionSlot[];
  createPromotionSlot: (data: Omit<PromotionSlot, 'id' | 'createdAt' | 'createdBy' | 'participatingProductsCount'>) => { success: boolean; message: string; slot?: PromotionSlot };
  updatePromotionSlot: (id: string, updates: Partial<PromotionSlot>) => { success: boolean; message: string };
  deletePromotionSlot: (id: string) => { success: boolean; message: string };

  storeSlotProductBanners: StoreSlotProductBanner[];
  addStoreSlotBanner: (data: Omit<StoreSlotProductBanner, 'id' | 'createdAt' | 'updatedAt' | 'isActive'>) => { success: boolean; message: string; banner?: StoreSlotProductBanner };
  updateStoreSlotBanner: (id: string, updates: Partial<StoreSlotProductBanner>) => { success: boolean; message: string };
  deleteStoreSlotBanner: (id: string) => { success: boolean; message: string };

  // Maha Sale Participation & Live Flash Deals Module
  mahaSaleParticipations: MahaSaleParticipation[];
  requestMahaSaleParticipation: (data: {
    productId: string;
    requestedDiscountPct: number;
    requestedDurationHours: number;
    storeNotes?: string;
    storeId?: string;
  }) => { success: boolean; message: string; participation?: MahaSaleParticipation };
  adminSuggestMahaSaleDiscount: (
    participationId: string,
    suggestion: {
      adminSuggestedDiscountPct: number;
      adminSuggestedDurationHours: number;
      adminNotes?: string;
      reviewedBy?: string;
    }
  ) => { success: boolean; message: string };
  adminApproveMahaSaleDirectly: (
    participationId: string,
    adminNotes?: string
  ) => { success: boolean; message: string };
  adminRejectMahaSale: (participationId: string, reason: string) => { success: boolean; message: string };
  storeAcceptMahaSaleAndGoLive: (participationId: string) => { success: boolean; message: string };
  storeDeclineAdminSuggestion: (participationId: string, reason?: string) => { success: boolean; message: string };
  endMahaSaleEarly: (participationId: string) => { success: boolean; message: string };
  checkAndExpireMahaSales: () => { expiredCount: number };

  // JE Assured Badge 4-Pillar SOP Health & Store Promotion Landing Page Requests
  jeAssuredSopConfig: JeAssuredSopConfig;
  updateJeAssuredSopConfig: (updates: Partial<JeAssuredSopConfig>) => { success: boolean; message: string };
  getProductJeAssuredHealth: (product: Product) => JeAssuredHealthMetrics;
  requestJeAssuredReviewForProduct: (
    productId: string,
    storeNotes?: string
  ) => { success: boolean; message: string };
  adminReviewJeAssuredProduct: (
    productId: string,
    payload: {
      catalogueHealth: number;
      inventoryHealth: number;
      orderHealth: number;
      feedbackReviewHealth: number;
      goLiveWithBadge?: boolean;
      adminNotes?: string;
    }
  ) => { success: boolean; message: string };
  toggleProductJeAssuredLive: (
    productId: string,
    makeLive: boolean
  ) => { success: boolean; message: string };
  storePromotionRequests: StorePromotionRequest[];
  submitStorePromotionRequest: (payload: {
    productId: string;
    salePrice: number;
    startTime: string;
    endTime: string;
    bannerImages?: string[];
    campaignHeadline?: string;
    targetPlacement?: 'top' | 'middle' | 'bottom';
    requestJeAssuredBadge?: boolean;
    storeNotes?: string;
  }) => { success: boolean; message: string; request?: StorePromotionRequest };
  reviewStorePromotionRequest: (
    requestId: string,
    payload: {
      decision: 'approved_live' | 'rejected';
      bannerImages?: string[];
      salePrice?: number;
      startTime?: string;
      endTime?: string;
      approveJeAssuredBadge?: boolean;
      adminNotes?: string;
    }
  ) => { success: boolean; message: string };

  // Category-Based Product Listing Formats (Admin Create / Edit / Delete + Store Use)
  categoryFormats: CategoryListingFormat[];
  getFormatForCategory: (categoryId: ProductCategory, subCategoryId?: string) => CategoryListingFormat;
  createCategoryFormat: (
    formatData: Omit<CategoryListingFormat, 'id' | 'updatedAt'>
  ) => { success: boolean; message: string; format?: CategoryListingFormat };
  updateCategoryFormat: (
    formatId: string,
    updates: Partial<CategoryListingFormat>
  ) => { success: boolean; message: string };
  deleteCategoryFormat: (formatId: string) => { success: boolean; message: string };
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

const STORAGE_KEY_PREFIX = 'je_retail_store_';

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load state from localStorage or use initial seeds
  const [products, setProducts] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}products`);
      if (saved) {
        const parsed: Product[] = JSON.parse(saved);
        const existingIds = new Set(parsed.map((p) => p.id));
        const missing = INITIAL_PRODUCTS.filter((p) => !existingIds.has(p.id));
        return missing.length > 0 ? [...parsed, ...missing] : parsed;
      }
      return INITIAL_PRODUCTS;
    } catch {
      return INITIAL_PRODUCTS;
    }
  });

  const [categories, setCategories] = useState<CategoryItem[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}categories`);
      if (saved) {
        const parsed: CategoryItem[] = JSON.parse(saved);
        const hydrated = parsed.map((cat) => {
          const seed = INITIAL_CATEGORIES.find((s) => s.id === cat.id);
          if (!seed) return cat;
          const mergedSubs =
            cat.subCategories && cat.subCategories.length > 0
              ? cat.subCategories.map((sub) => {
                  const seedSub = seed.subCategories?.find((ss) => ss.id === sub.id);
                  return {
                    ...seedSub,
                    ...sub,
                    imageUrl: sub.imageUrl || seedSub?.imageUrl,
                    iconName: sub.iconName || seedSub?.iconName,
                  };
                })
              : seed.subCategories;
          return {
            ...seed,
            ...cat,
            imageUrl: cat.imageUrl || seed.imageUrl,
            commissionStructure: cat.commissionStructure || seed.commissionStructure,
            subCategories: mergedSubs,
          };
        });
        const existingIds = new Set(hydrated.map((c) => c.id));
        const missing = INITIAL_CATEGORIES.filter((c) => !existingIds.has(c.id));
        return missing.length > 0 ? [...hydrated, ...missing] : hydrated;
      }
      return INITIAL_CATEGORIES;
    } catch {
      return INITIAL_CATEGORIES;
    }
  });

  const [categoryFormats, setCategoryFormats] = useState<CategoryListingFormat[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}category_formats_v1`);
      if (saved) {
        const parsed: CategoryListingFormat[] = JSON.parse(saved);
        return Array.isArray(parsed) ? parsed : INITIAL_CATEGORY_LISTING_FORMATS;
      }
      return INITIAL_CATEGORY_LISTING_FORMATS;
    } catch {
      return INITIAL_CATEGORY_LISTING_FORMATS;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(`${STORAGE_KEY_PREFIX}category_formats_v1`, JSON.stringify(categoryFormats));
    } catch {
      // ignore storage errors
    }
  }, [categoryFormats]);

  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}cart`);
      if (saved) {
        const parsed = JSON.parse(saved);
        return rehydrateCartSafely(parsed, INITIAL_PRODUCTS);
      }
    } catch (e) {
      console.warn('Failed to parse cart from storage, falling back to empty cart', e);
    }
    return [];
  });

  const [orders, setOrders] = useState<Order[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}orders`);
    if (saved) {
      try {
        const parsed: Order[] = JSON.parse(saved);
        return parsed.map((ord) => {
          const cleanOutletCoords = sanitizeStoreCoordinates(ord.outletCoordinates, DEFAULT_STORE_COORDINATES);
          const cleanCustCoords = sanitizeStoreCoordinates(
            ord.deliveryCoordinates || ord.customer?.coordinates,
            { lat: 19.4210, lng: 72.8235 }
          );
          const cleanArea =
            ord.customer?.area && /hazratganj|gomti|mahanagar|aliganj|lucknow/i.test(ord.customer.area)
              ? 'Nalasopara East'
              : ord.customer?.area || 'Nalasopara East';
          const cleanCity =
            ord.customer?.city && /lucknow/i.test(ord.customer.city)
              ? 'Nalasopara'
              : ord.customer?.city || 'Nalasopara';
          const cleanPincode =
            ord.customer?.pincode && ord.customer.pincode.startsWith('226')
              ? '401209'
              : ord.customer?.pincode || '401209';

          return {
            ...ord,
            outletCoordinates: cleanOutletCoords,
            deliveryCoordinates: cleanCustCoords,
            customer: {
              ...ord.customer,
              name: cleanCustomerName(ord.customer?.name),
              area: cleanArea,
              city: cleanCity,
              pincode: cleanPincode,
              coordinates: cleanCustCoords,
            },
          };
        });
      } catch {
        return INITIAL_ORDERS;
      }
    }
    return INITIAL_ORDERS;
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

  const [referralProgramConfig, setReferralProgramConfig] = useState<ReferralProgramConfig>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}referral_config`);
      return saved ? JSON.parse(saved) : INITIAL_REFERRAL_PROGRAM_CONFIG;
    } catch {
      return INITIAL_REFERRAL_PROGRAM_CONFIG;
    }
  });

  const [referralRecords, setReferralRecords] = useState<ReferralRecord[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}referral_records`);
      return saved ? JSON.parse(saved) : INITIAL_REFERRAL_RECORDS;
    } catch {
      return INITIAL_REFERRAL_RECORDS;
    }
  });

  const [promotionalPages, setPromotionalPages] = useState<PromotionalPage[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}promotional_pages`);
      return saved ? JSON.parse(saved) : INITIAL_PROMOTIONAL_PAGES;
    } catch {
      return INITIAL_PROMOTIONAL_PAGES;
    }
  });

  const [activePromotionalPage, setActivePromotionalPage] = useState<PromotionalPage | null>(null);

  // Return, Refund, Replacement & Exchange Structure as per Category
  const [categoryReturnPolicies, setCategoryReturnPolicies] = useState<CategoryReturnPolicy[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}category_return_policies`);
      if (saved) {
        const parsed: CategoryReturnPolicy[] = JSON.parse(saved);
        const existingCatIds = new Set(parsed.map((p) => p.categoryId));
        const missing = INITIAL_CATEGORY_RETURN_POLICIES.filter((p) => !existingCatIds.has(p.categoryId));
        return missing.length > 0 ? [...parsed, ...missing] : parsed;
      }
      return INITIAL_CATEGORY_RETURN_POLICIES;
    } catch {
      return INITIAL_CATEGORY_RETURN_POLICIES;
    }
  });

  const [returnExchangeRequests, setReturnExchangeRequests] = useState<ReturnExchangeRequest[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}return_exchange_requests`);
      return saved ? JSON.parse(saved) : INITIAL_RETURN_EXCHANGE_REQUESTS;
    } catch {
      return INITIAL_RETURN_EXCHANGE_REQUESTS;
    }
  });

  useEffect(() => {
    safeLocalStorageSetItem(`${STORAGE_KEY_PREFIX}category_return_policies`, JSON.stringify(categoryReturnPolicies));
  }, [categoryReturnPolicies]);

  useEffect(() => {
    safeLocalStorageSetItem(`${STORAGE_KEY_PREFIX}return_exchange_requests`, JSON.stringify(returnExchangeRequests));
  }, [returnExchangeRequests]);

  const [chatbotAiSettings, setChatbotAiSettings] = useState<ChatbotAiSettings>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}chatbot_ai_settings`);
      if (saved) {
        const parsed: ChatbotAiSettings = JSON.parse(saved);
        return {
          ...INITIAL_CHATBOT_AI_SETTINGS,
          ...parsed,
          knowledgeBase: Array.isArray(parsed.knowledgeBase) && parsed.knowledgeBase.length > 0
            ? parsed.knowledgeBase
            : INITIAL_CHATBOT_KNOWLEDGE_BASE,
        };
      }
      return INITIAL_CHATBOT_AI_SETTINGS;
    } catch {
      return INITIAL_CHATBOT_AI_SETTINGS;
    }
  });

  const [settings, setSettings] = useState<StoreSettings>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}settings`);
    if (saved) {
      try {
        const parsed: StoreSettings = JSON.parse(saved);
        const hydrated: StoreSettings = {
          ...INITIAL_SETTINGS,
          ...parsed,
          codExtraChargeEnabled:
            parsed.codExtraChargeEnabled !== undefined
              ? parsed.codExtraChargeEnabled
              : INITIAL_SETTINGS.codExtraChargeEnabled,
          codExtraChargeType: parsed.codExtraChargeType || INITIAL_SETTINGS.codExtraChargeType,
          codExtraChargeValue:
            parsed.codExtraChargeValue !== undefined
              ? parsed.codExtraChargeValue
              : INITIAL_SETTINGS.codExtraChargeValue,
          prepaidDiscountEnabled:
            parsed.prepaidDiscountEnabled !== undefined
              ? parsed.prepaidDiscountEnabled
              : INITIAL_SETTINGS.prepaidDiscountEnabled,
          prepaidDiscountType: parsed.prepaidDiscountType || INITIAL_SETTINGS.prepaidDiscountType,
          prepaidDiscountValue:
            parsed.prepaidDiscountValue !== undefined
              ? parsed.prepaidDiscountValue
              : INITIAL_SETTINGS.prepaidDiscountValue,
          prepaidMaxDiscountAmount:
            parsed.prepaidMaxDiscountAmount !== undefined
              ? parsed.prepaidMaxDiscountAmount
              : INITIAL_SETTINGS.prepaidMaxDiscountAmount,
        };
        if (hydrated.city?.toLowerCase().includes('lucknow') || hydrated.pincode?.startsWith('226')) {
          return {
            ...hydrated,
            address: INITIAL_SETTINGS.address,
            city: INITIAL_SETTINGS.city,
            state: INITIAL_SETTINGS.state,
            pincode: INITIAL_SETTINGS.pincode,
            serviceablePincodes: Array.from(
              new Set([...INITIAL_SETTINGS.serviceablePincodes, ...(hydrated.serviceablePincodes || [])])
            ),
          };
        }
        return hydrated;
      } catch {
        return INITIAL_SETTINGS;
      }
    }
    return INITIAL_SETTINGS;
  });

  const [currentUser, setCurrentUser] = useState<UserProfile>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}user`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const rawAddresses: Address[] = Array.isArray(parsed.savedAddresses) ? parsed.savedAddresses : INITIAL_USER.savedAddresses;
        const sanitizedAddresses: Address[] = rawAddresses.map((addr, idx) => {
          const isLegacyLucknow =
            isLegacyOrInvalidCoord(addr.coordinates) ||
            /hazratganj|gomti|lucknow|alambagh|indira|mahanagar/i.test(
              `${addr.area || ''} ${addr.city || ''} ${addr.addressLine || ''}`
            ) ||
            addr.pincode?.startsWith('226');

          if (isLegacyLucknow) {
            return idx === 0
              ? {
                  ...INITIAL_USER.savedAddresses[0],
                  fullName: cleanCustomerName(parsed.name) || INITIAL_USER.name,
                  phone: parsed.phone || INITIAL_USER.phone,
                }
              : {
                  ...(INITIAL_USER.savedAddresses[1] || INITIAL_USER.savedAddresses[0]),
                  fullName: cleanCustomerName(parsed.name) || INITIAL_USER.name,
                  phone: parsed.phone || INITIAL_USER.phone,
                };
          }
          return addr;
        });

        return {
          ...parsed,
          name: cleanCustomerName(parsed.name),
          savedAddresses: sanitizedAddresses.length > 0 ? sanitizedAddresses : INITIAL_USER.savedAddresses,
        };
      } catch {
        return INITIAL_USER;
      }
    }
    return INITIAL_USER;
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
    if (saved) {
      try {
        const parsed: UserAccount[] = JSON.parse(saved);
        const mapped = parsed.map((acc) => {
          const matchedInitial = INITIAL_ACCOUNTS.find((ia) => ia.id === acc.id);
          const baseStatus: AccountStatus =
            acc.accountStatus ||
            matchedInitial?.accountStatus ||
            (acc.isActive === false ? 'suspended' : 'active');
          return {
            ...matchedInitial,
            ...acc,
            accountStatus: baseStatus,
            sanction: acc.sanction || matchedInitial?.sanction,
            sanctionHistory:
              acc.sanctionHistory ||
              matchedInitial?.sanctionHistory ||
              (acc.sanction ? [acc.sanction] : matchedInitial?.sanction ? [matchedInitial.sanction] : []),
          };
        });

        const existingIds = new Set(mapped.map((a) => a.id));
        const missingInitials = INITIAL_ACCOUNTS.filter((ia) => !existingIds.has(ia.id));
        return [...mapped, ...missingInitials];
      } catch {
        return INITIAL_ACCOUNTS;
      }
    }
    return INITIAL_ACCOUNTS;
  });

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}isAuthenticated`);
    return saved !== null ? JSON.parse(saved) : false;
  });

  // Multi-Outlet Management States
  const [outlets, setOutlets] = useState<Outlet[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}outlets`);
    if (saved) {
      try {
        const parsed: Outlet[] = JSON.parse(saved);
        const mapped = parsed.map((out, idx) => {
          const seedOutlet = INITIAL_OUTLETS.find((s) => s.id === out.id) || INITIAL_OUTLETS[idx] || INITIAL_OUTLETS[0];
          const hasLegacyCoords = isLegacyOrInvalidCoord(out.coordinates);
          const hasLegacyCity = /lucknow|hazratganj|gomti|alambagh|indira|chowk/i.test(`${out.city || ''} ${out.name || ''}`);
          const validRadius =
            typeof out.deliveryRadiusKm === 'number' && out.deliveryRadiusKm > 1.5
              ? out.deliveryRadiusKm
              : seedOutlet.deliveryRadiusKm || 15;

          const baseStoreType = out.storeType || seedOutlet?.storeType || 'electronics_superstore';
          const baseOrderAcceptanceConfig =
            out.orderAcceptanceConfig || seedOutlet?.orderAcceptanceConfig || getDefaultOrderAcceptanceConfig(baseStoreType);
          const baseDeliveryPromise =
            out.deliveryTimePromise || seedOutlet?.deliveryTimePromise || baseOrderAcceptanceConfig.deliveryTimePromise;

          if (hasLegacyCoords || hasLegacyCity) {
            return {
              ...seedOutlet,
              ...out,
              storeType: baseStoreType,
              deliveryTimePromise: baseDeliveryPromise,
              orderAcceptanceConfig: baseOrderAcceptanceConfig,
              name: hasLegacyCity ? seedOutlet.name : out.name,
              code: out.code?.includes('LKO') ? seedOutlet.code : out.code,
              address: hasLegacyCity ? seedOutlet.address : out.address,
              city: seedOutlet.city,
              state: seedOutlet.state,
              pincode: out.pincode?.startsWith('226') ? seedOutlet.pincode : out.pincode,
              coordinates: seedOutlet.coordinates,
              serviceablePincodes: Array.from(
                new Set([
                  ...seedOutlet.serviceablePincodes,
                  ...(out.serviceablePincodes || []).filter((p) => !p.startsWith('226')),
                ])
              ),
              deliveryRadiusKm: validRadius,
            };
          }

          return {
            ...seedOutlet,
            ...out,
            storeType: baseStoreType,
            deliveryTimePromise: baseDeliveryPromise,
            orderAcceptanceConfig: baseOrderAcceptanceConfig,
            coordinates: out.coordinates || seedOutlet.coordinates,
            deliveryRadiusKm: validRadius,
          };
        });

        // Ensure all 6 distinct store verticals from INITIAL_OUTLETS are present
        const existingIds = new Set(mapped.map((o) => o.id));
        const missingSeeds = INITIAL_OUTLETS.filter((s) => !existingIds.has(s.id));
        return [...mapped, ...missingSeeds];
      } catch {
        return INITIAL_OUTLETS;
      }
    }
    return INITIAL_OUTLETS;
  });

  const [activeOutletId, setActiveOutletId] = useState<string>(() => {
    return localStorage.getItem(`${STORAGE_KEY_PREFIX}activeOutletId`) || 'out_hazratganj';
  });

  const [ownershipModels, setOwnershipModels] = useState<OutletOwnershipRules[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}ownershipModels`);
    return saved ? JSON.parse(saved) : INITIAL_OWNERSHIP_MODELS;
  });

  const [businessCategories, setBusinessCategories] = useState<BusinessCategory[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}businessCategories`);
      if (saved) {
        const parsed: BusinessCategory[] = JSON.parse(saved);
        const existingIds = new Set(parsed.map((c) => c.id));
        const missing = INITIAL_BUSINESS_CATEGORIES.filter((c) => !existingIds.has(c.id));
        return missing.length > 0 ? [...parsed, ...missing] : parsed;
      }
      return INITIAL_BUSINESS_CATEGORIES;
    } catch {
      return INITIAL_BUSINESS_CATEGORIES;
    }
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
      if (saved) {
        const parsed: PaymentGatewayConfig[] = JSON.parse(saved);
        if (!parsed.some((g) => g.provider === 'je_cash' || g.id === 'gw_je_cash')) {
          const jeCashGw = INITIAL_PAYMENT_GATEWAYS.find((g) => g.provider === 'je_cash');
          if (jeCashGw) return [jeCashGw, ...parsed];
        }
        return parsed;
      }
      return INITIAL_PAYMENT_GATEWAYS;
    } catch {
      return INITIAL_PAYMENT_GATEWAYS;
    }
  });

  // JE Cash (Store Wallet) Transactions Ledger & Passbook
  const [jeCashTransactions, setJeCashTransactions] = useState<JeCashTransaction[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}jeCashTransactions_v1`);
      return saved ? JSON.parse(saved) : INITIAL_JE_CASH_TRANSACTIONS;
    } catch {
      return INITIAL_JE_CASH_TRANSACTIONS;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(`${STORAGE_KEY_PREFIX}jeCashTransactions_v1`, JSON.stringify(jeCashTransactions));
    } catch {}
  }, [jeCashTransactions]);

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

  // Maha Sale Participation & Live Flash Deals
  const [mahaSaleParticipations, setMahaSaleParticipations] = useState<MahaSaleParticipation[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}maha_sales_v2`);
      if (saved) {
        const parsed: MahaSaleParticipation[] = JSON.parse(saved);
        const existingIds = new Set(parsed.map((p) => p.id));
        const missing = INITIAL_MAHA_SALE_PARTICIPATIONS.filter((p) => !existingIds.has(p.id));
        return missing.length > 0 ? [...parsed, ...missing] : parsed;
      }
      return INITIAL_MAHA_SALE_PARTICIPATIONS;
    } catch {
      return INITIAL_MAHA_SALE_PARTICIPATIONS;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(`${STORAGE_KEY_PREFIX}maha_sales_v2`, JSON.stringify(mahaSaleParticipations));
    } catch {}
  }, [mahaSaleParticipations]);

  // Maha Sale Slots State (Created by Super Admin, participated by Stores)
  const [mahaSaleSlots, setMahaSaleSlots] = useState<MahaSaleSlot[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}maha_sale_slots_v1`);
      if (saved) {
        const parsed: MahaSaleSlot[] = JSON.parse(saved);
        const existingIds = new Set(parsed.map((s) => s.id));
        const missing = INITIAL_MAHA_SALE_SLOTS.filter((s) => !existingIds.has(s.id));
        return missing.length > 0 ? [...parsed, ...missing] : parsed;
      }
      return INITIAL_MAHA_SALE_SLOTS;
    } catch {
      return INITIAL_MAHA_SALE_SLOTS;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(`${STORAGE_KEY_PREFIX}maha_sale_slots_v1`, JSON.stringify(mahaSaleSlots));
    } catch {}
  }, [mahaSaleSlots]);

  // Promotion Types (Admin only create/edit/delete)
  const [promotionTypes, setPromotionTypes] = useState<PromotionType[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}promo_types_v1`);
      if (saved) {
        const parsed: PromotionType[] = JSON.parse(saved);
        const existingIds = new Set(parsed.map((t) => t.id));
        const missing = INITIAL_PROMOTION_TYPES.filter((t) => !existingIds.has(t.id));
        return missing.length > 0 ? [...parsed, ...missing] : parsed;
      }
      return INITIAL_PROMOTION_TYPES;
    } catch {
      return INITIAL_PROMOTION_TYPES;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(`${STORAGE_KEY_PREFIX}promo_types_v1`, JSON.stringify(promotionTypes));
    } catch {}
  }, [promotionTypes]);

  // Promotion Slots (Admin only create/edit/delete)
  const [promotionSlots, setPromotionSlots] = useState<PromotionSlot[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}promo_slots_v1`);
      if (saved) {
        const parsed: PromotionSlot[] = JSON.parse(saved);
        const existingIds = new Set(parsed.map((s) => s.id));
        const missing = INITIAL_PROMOTION_SLOTS.filter((s) => !existingIds.has(s.id));
        return missing.length > 0 ? [...parsed, ...missing] : parsed;
      }
      return INITIAL_PROMOTION_SLOTS;
    } catch {
      return INITIAL_PROMOTION_SLOTS;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(`${STORAGE_KEY_PREFIX}promo_slots_v1`, JSON.stringify(promotionSlots));
    } catch {}
  }, [promotionSlots]);

  // Store Slot Product Banners (Store participates with one-by-one product + banner with add/edit/delete)
  const [storeSlotProductBanners, setStoreSlotProductBanners] = useState<StoreSlotProductBanner[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}store_slot_banners_v1`);
      if (saved) {
        const parsed: StoreSlotProductBanner[] = JSON.parse(saved);
        const existingIds = new Set(parsed.map((b) => b.id));
        const missing = INITIAL_STORE_SLOT_BANNERS.filter((b) => !existingIds.has(b.id));
        return missing.length > 0 ? [...parsed, ...missing] : parsed;
      }
      return INITIAL_STORE_SLOT_BANNERS;
    } catch {
      return INITIAL_STORE_SLOT_BANNERS;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(`${STORAGE_KEY_PREFIX}store_slot_banners_v1`, JSON.stringify(storeSlotProductBanners));
    } catch {}
  }, [storeSlotProductBanners]);

  // JE Assured 4-Pillar SOP Eligibility Configuration & Store Promotion Requests
  const [jeAssuredSopConfig, setJeAssuredSopConfig] = useState<JeAssuredSopConfig>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}je_assured_sop_v1`);
      return saved ? { ...INITIAL_JE_ASSURED_SOP_CONFIG, ...JSON.parse(saved) } : INITIAL_JE_ASSURED_SOP_CONFIG;
    } catch {
      return INITIAL_JE_ASSURED_SOP_CONFIG;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(`${STORAGE_KEY_PREFIX}je_assured_sop_v1`, JSON.stringify(jeAssuredSopConfig));
    } catch {}
  }, [jeAssuredSopConfig]);

  const [storePromotionRequests, setStorePromotionRequests] = useState<StorePromotionRequest[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}store_promo_requests_v1`);
      if (saved) {
        const parsed: StorePromotionRequest[] = JSON.parse(saved);
        const existingIds = new Set(parsed.map((r) => r.id));
        const missing = INITIAL_STORE_PROMOTION_REQUESTS.filter((r) => !existingIds.has(r.id));
        return missing.length > 0 ? [...parsed, ...missing] : parsed;
      }
      return INITIAL_STORE_PROMOTION_REQUESTS;
    } catch {
      return INITIAL_STORE_PROMOTION_REQUESTS;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(`${STORAGE_KEY_PREFIX}store_promo_requests_v1`, JSON.stringify(storePromotionRequests));
    } catch {}
  }, [storePromotionRequests]);

  const activePaymentGateways = useMemo(() => {
    return paymentGateways
      .filter((gw) => gw.isActive)
      .sort((a, b) => a.displayPriority - b.displayPriority);
  }, [paymentGateways]);

  // UI / Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategoryRaw] = useState<ProductCategory | 'all'>('all');
  const [selectedSubCategory, setSelectedSubCategory] = useState<string | 'all'>('all');
  const [fullScreenCategory, setFullScreenCategory] = useState<ProductCategory | 'all' | null>(null);

  const setSelectedCategory = (cat: ProductCategory | 'all') => {
    setSelectedCategoryRaw(cat);
    setSelectedSubCategory('all');
  };

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
    safeLocalStorageSetItem(`${STORAGE_KEY_PREFIX}products`, JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    safeLocalStorageSetItem(`${STORAGE_KEY_PREFIX}categories`, JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    safeLocalStorageSetItem(`${STORAGE_KEY_PREFIX}outlets`, JSON.stringify(outlets));
  }, [outlets]);

  useEffect(() => {
    safeLocalStorageSetItem(`${STORAGE_KEY_PREFIX}activeOutletId`, activeOutletId);
  }, [activeOutletId]);

  useEffect(() => {
    safeLocalStorageSetItem(`${STORAGE_KEY_PREFIX}ownershipModels`, JSON.stringify(ownershipModels));
  }, [ownershipModels]);

  useEffect(() => {
    safeLocalStorageSetItem(`${STORAGE_KEY_PREFIX}businessCategories`, JSON.stringify(businessCategories));
  }, [businessCategories]);

  useEffect(() => {
    safeLocalStorageSetItem(`${STORAGE_KEY_PREFIX}participants`, JSON.stringify(participants));
  }, [participants]);

  useEffect(() => {
    safeLocalStorageSetItem(`${STORAGE_KEY_PREFIX}payoutItems`, JSON.stringify(payoutItems));
  }, [payoutItems]);

  useEffect(() => {
    safeLocalStorageSetItem(`${STORAGE_KEY_PREFIX}financialLedger`, JSON.stringify(financialLedger));
  }, [financialLedger]);

  useEffect(() => {
    safeLocalStorageSetItem(`${STORAGE_KEY_PREFIX}barcodeRecords`, JSON.stringify(barcodeRecords));
  }, [barcodeRecords]);

  useEffect(() => {
    safeLocalStorageSetItem(`${STORAGE_KEY_PREFIX}stockTransfers`, JSON.stringify(stockTransfers));
  }, [stockTransfers]);

  useEffect(() => {
    safeLocalStorageSetItem(`${STORAGE_KEY_PREFIX}franchiseAgreements`, JSON.stringify(franchiseAgreements));
  }, [franchiseAgreements]);

  useEffect(() => {
    safeLocalStorageSetItem(`${STORAGE_KEY_PREFIX}cart`, serializeCartSafely(cart));
  }, [cart]);

  useEffect(() => {
    safeLocalStorageSetItem(`${STORAGE_KEY_PREFIX}orders`, JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    safeLocalStorageSetItem(`${STORAGE_KEY_PREFIX}stockMovements`, JSON.stringify(stockMovements));
  }, [stockMovements]);

  useEffect(() => {
    safeLocalStorageSetItem(`${STORAGE_KEY_PREFIX}campaigns`, JSON.stringify(campaigns));
  }, [campaigns]);

  useEffect(() => {
    safeLocalStorageSetItem(`${STORAGE_KEY_PREFIX}coupons`, JSON.stringify(coupons));
  }, [coupons]);

  useEffect(() => {
    try {
      localStorage.setItem(`${STORAGE_KEY_PREFIX}referral_config`, JSON.stringify(referralProgramConfig));
    } catch {}
  }, [referralProgramConfig]);

  useEffect(() => {
    try {
      localStorage.setItem(`${STORAGE_KEY_PREFIX}referral_records`, JSON.stringify(referralRecords));
    } catch {}
  }, [referralRecords]);

  useEffect(() => {
    try {
      localStorage.setItem(`${STORAGE_KEY_PREFIX}promotional_pages`, JSON.stringify(promotionalPages));
    } catch {}
  }, [promotionalPages]);

  useEffect(() => {
    try {
      localStorage.setItem(`${STORAGE_KEY_PREFIX}chatbot_ai_settings`, JSON.stringify(chatbotAiSettings));
    } catch {}
  }, [chatbotAiSettings]);

  useEffect(() => {
    safeLocalStorageSetItem(`${STORAGE_KEY_PREFIX}settings`, JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    safeLocalStorageSetItem(`${STORAGE_KEY_PREFIX}user`, JSON.stringify(currentUser));
  }, [currentUser]);

  useEffect(() => {
    safeLocalStorageSetItem(`${STORAGE_KEY_PREFIX}currentRole`, currentRole);
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
    safeLocalStorageSetItem(`${STORAGE_KEY_PREFIX}accounts`, JSON.stringify(accounts));
  }, [accounts]);

  useEffect(() => {
    safeLocalStorageSetItem(`${STORAGE_KEY_PREFIX}isAuthenticated`, JSON.stringify(isAuthenticated));
  }, [isAuthenticated]);

  useEffect(() => {
    safeLocalStorageSetItem(`${STORAGE_KEY_PREFIX}wishlist`, JSON.stringify(wishlist));
  }, [wishlist]);

  useEffect(() => {
    safeLocalStorageSetItem(`${STORAGE_KEY_PREFIX}deliveryZones`, JSON.stringify(deliveryZones));
  }, [deliveryZones]);

  useEffect(() => {
    safeLocalStorageSetItem(`${STORAGE_KEY_PREFIX}bulkDiscountRules`, JSON.stringify(bulkDiscountRules));
  }, [bulkDiscountRules]);

  useEffect(() => {
    safeLocalStorageSetItem(`${STORAGE_KEY_PREFIX}brandingSettings`, JSON.stringify(brandingSettings));
    if (typeof document !== 'undefined') {
      const root = document.documentElement;
      root.style.setProperty('--brand-primary', brandingSettings.theme.primaryColor);
      root.style.setProperty('--brand-secondary', brandingSettings.theme.secondaryColor);
      root.style.setProperty('--brand-accent', brandingSettings.theme.accentColor);
      root.style.setProperty('--brand-font', brandingSettings.theme.fontFamily);
    }
  }, [brandingSettings]);

  useEffect(() => {
    safeLocalStorageSetItem(`${STORAGE_KEY_PREFIX}brandingHistory`, JSON.stringify(brandingHistory));
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

  // JE Cash (Store Wallet) Balance Refill & Debit Engine
  const refillJeCashBalance = (
    amount: number,
    paymentMethodName = 'Instant UPI (PhonePe / GPay)',
    transactionNote = 'JE Cash Balance Refill'
  ) => {
    if (amount <= 0) {
      return {
        success: false,
        message: 'Please enter a valid amount (minimum ₹10).',
        transactionId: '',
        newBalance: currentUser.rewardBalance || currentUser.jeCashBalance || 0,
      };
    }

    // Refill incentive: ₹1,000+ receives 2% instant cashback bonus into JE Cash
    const bonus = amount >= 1000 ? Math.round(amount * 0.02) : 0;
    const totalCredit = amount + bonus;
    const currentBal = currentUser.rewardBalance || currentUser.jeCashBalance || 0;
    const updatedBal = currentBal + totalCredit;
    const nowIso = new Date().toISOString();
    const txnId = `JECASH-REF-${Date.now().toString().slice(-6)}`;

    setCurrentUser((prev) => ({
      ...prev,
      rewardBalance: updatedBal,
      jeCashBalance: updatedBal,
    }));

    const newTxn: JeCashTransaction = {
      id: txnId,
      type: 'credit',
      amount: totalCredit,
      balanceAfter: updatedBal,
      description: bonus > 0
        ? `${transactionNote} (Includes ₹${bonus} 2% extra bonus)`
        : transactionNote,
      category: 'refill',
      timestamp: nowIso,
      referenceId: `REF-TXN-${Date.now().toString().slice(-8)}`,
      paymentMethodUsed: paymentMethodName,
    };

    setJeCashTransactions((prev) => [newTxn, ...prev]);

    return {
      success: true,
      message: bonus > 0
        ? `₹${amount.toLocaleString('en-IN')} + ₹${bonus} bonus added to JE Cash! Available: ₹${updatedBal.toLocaleString('en-IN')}`
        : `₹${amount.toLocaleString('en-IN')} successfully added to JE Cash! Available: ₹${updatedBal.toLocaleString('en-IN')}`,
      transactionId: txnId,
      newBalance: updatedBal,
    };
  };

  const deductJeCashBalance = (amount: number, orderId?: string, reason = 'Order Payment') => {
    const currentBal = currentUser.rewardBalance || currentUser.jeCashBalance || 0;
    if (currentBal < amount) {
      return {
        success: false,
        message: `Insufficient JE Cash balance. Available: ₹${currentBal.toLocaleString('en-IN')}, required: ₹${amount.toLocaleString('en-IN')}.`,
        newBalance: currentBal,
      };
    }

    const updatedBal = currentBal - amount;
    const nowIso = new Date().toISOString();
    const txnId = `JECASH-PAY-${Date.now().toString().slice(-6)}`;

    setCurrentUser((prev) => ({
      ...prev,
      rewardBalance: updatedBal,
      jeCashBalance: updatedBal,
    }));

    const newTxn: JeCashTransaction = {
      id: txnId,
      type: 'debit',
      amount,
      balanceAfter: updatedBal,
      description: orderId ? `Paid for Order #${orderId}` : reason,
      category: 'order_payment',
      timestamp: nowIso,
      orderId,
      referenceId: txnId,
      paymentMethodUsed: 'JE Cash Balance',
    };

    setJeCashTransactions((prev) => [newTxn, ...prev]);

    return {
      success: true,
      message: `₹${amount.toLocaleString('en-IN')} debited from JE Cash. Remaining: ₹${updatedBal.toLocaleString('en-IN')}`,
      newBalance: updatedBal,
    };
  };

  // Order creation with atomic stock reservation
  const createOrder = async (payload: {
    customer: Order['customer'];
    deliveryType: DeliveryType;
    deliverySlot?: string;
    paymentMethod: PaymentMethod;
    isWhatsAppCheckout?: boolean;
    informHubForDispatch?: boolean;
    isPartialPrepaidCod?: boolean;
    partialPrepaidAmount?: number;
    codBalanceOnDelivery?: number;
    partialPrepaidMethod?: string;
    prepaidDiscount?: number;
    codExtraCharge?: number;
    paymentProof?: {
      screenshotUrl?: string;
      utrNumber?: string;
    };
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
    const baseFinalAmount = payload.deliveryType === 'store_pickup'
      ? Math.max(0, cartSubtotal - cartCouponDiscount - cartBulkDiscount.discountAmount)
      : cartFinalTotal;
    const appliedPrepaidDiscount = Math.max(0, payload.prepaidDiscount || 0);
    const appliedCodExtraCharge = Math.max(0, payload.codExtraCharge || 0);
    const finalAmount = Math.max(0, baseFinalAmount - appliedPrepaidDiscount + appliedCodExtraCharge);

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
    const isJeCash = payload.paymentMethod === 'je_cash';
    const isPartialCod = Boolean(
      payload.isPartialPrepaidCod &&
        payload.partialPrepaidAmount &&
        payload.partialPrepaidAmount > 0
    );
    const isPartialJeCash = isPartialCod && payload.partialPrepaidMethod === 'je_cash';

    if (isJeCash) {
      const currentBal = currentUser.rewardBalance || currentUser.jeCashBalance || 0;
      if (currentBal < finalAmount) {
        throw new Error(
          `Insufficient JE Cash balance (Available: ₹${currentBal.toLocaleString('en-IN')}, Required: ₹${finalAmount.toLocaleString('en-IN')}). JE Cash is non-refillable — please choose another payment method.`
        );
      }
    } else if (isPartialJeCash) {
      const currentBal = currentUser.rewardBalance || currentUser.jeCashBalance || 0;
      const reqAmt = payload.partialPrepaidAmount || 0;
      if (currentBal < reqAmt) {
        throw new Error(
          `Insufficient JE Cash balance for Partial Prepaid (Available: ₹${currentBal.toLocaleString('en-IN')}, Required: ₹${reqAmt.toLocaleString('en-IN')}). Please choose UPI / Online for Partial Prepaid.`
        );
      }
    }

    const isUpiPayment = payload.paymentMethod === 'upi_qr' || Boolean(payload.paymentProof?.screenshotUrl);
    const isOnlinePrepaid =
      isJeCash ||
      ['razorpay', 'online_razorpay', 'phonepe', 'paytm', 'cashfree', 'stripe'].includes(
        payload.paymentMethod
      );

    const initialStatus: OrderStatus = isUpiPayment ? 'payment_verifying' : 'confirmed';

    const paymentStatus: PaymentStatus = isUpiPayment
      ? 'verifying'
      : isOnlinePrepaid
      ? 'verified_paid'
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
    const outletCoords = sanitizeStoreCoordinates(activeOutlet?.coordinates, DEFAULT_STORE_COORDINATES);
    const customerCoords = sanitizeStoreCoordinates(payload.customer.coordinates, {
      lat: 19.4210,
      lng: 72.8235,
    });
    const distanceKm = payload.deliveryType === 'delivery'
      ? calculateHaversineDistanceKm(outletCoords, customerCoords)
      : 0;
    const eta = estimateDeliveryMinutes(distanceKm);
    const suggestedSteps = payload.deliveryType === 'delivery'
      ? generateSuggestedRouteSteps(activeOutlet?.name || 'Shop 09 Sai Dham Apt Flagship', payload.customer.area || 'Nalasopara East', distanceKm)
      : [];
    const navigationUrl = payload.deliveryType === 'delivery'
      ? getGoogleMapsNavigationUrl(outletCoords, customerCoords, payload.customer.name)
      : undefined;

    const generatedDeliveryCode = Math.floor(1000 + Math.random() * 9000).toString();
    const generatedTxnId = isJeCash
      ? `JECASH-TXN-${Date.now().toString().slice(-6)}`
      : isPartialCod
      ? `PARTIAL-COD-${Date.now().toString().slice(-6)}`
      : isOnlinePrepaid
      ? `PAY-TXN-${Date.now().toString().slice(-6)}`
      : undefined;

    const newOrder: Order = {
      id: orderId,
      userId: currentUser?.id,
      invoiceNumber,
      createdAt: nowIso,
      outletId: activeOutlet?.id,
      outletName: activeOutlet?.name,
      deliveryCode: generatedDeliveryCode,
      customer: {
        ...payload.customer,
        id: currentUser?.id || payload.customer.id,
        name: cleanCustomerName(payload.customer.name),
        isB2B,
        placeOfSupply: gstCalc.placeOfSupply,
        stateCode: gstCalc.customerGstCode,
      },
      items: orderItems,
      subtotal: cartSubtotal,
      discountTotal: cartCouponDiscount + cartBulkDiscount.discountAmount + appliedPrepaidDiscount,
      couponCode: appliedCoupon?.code,
      couponDiscount: cartCouponDiscount,
      bulkDiscountAmount: cartBulkDiscount.discountAmount,
      appliedBulkRuleId: cartBulkDiscount.ruleId,
      appliedBulkRuleName: cartBulkDiscount.ruleName,
      prepaidDiscount: appliedPrepaidDiscount > 0 ? appliedPrepaidDiscount : undefined,
      codExtraCharge: appliedCodExtraCharge > 0 ? appliedCodExtraCharge : undefined,
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
      isPartialPrepaidCod: isPartialCod,
      partialPrepaidAmount: isPartialCod ? payload.partialPrepaidAmount : undefined,
      codBalanceOnDelivery: isPartialCod ? payload.codBalanceOnDelivery : undefined,
      partialPrepaidMethod: isPartialCod ? payload.partialPrepaidMethod || 'upi_qr' : undefined,
      hubNotifiedForDispatch: Boolean(payload.informHubForDispatch || payload.isWhatsAppCheckout),
      paymentDetails: (isUpiPayment || generatedTxnId)
        ? {
            transactionId: payload.paymentProof?.utrNumber || generatedTxnId,
            utrNumber: payload.paymentProof?.utrNumber,
            screenshotUrl: payload.paymentProof?.screenshotUrl,
            paidAt: nowIso,
            submittedAt: nowIso,
            verifiedBy: isUpiPayment
              ? undefined
              : isJeCash
              ? 'JE Cash Store Credit'
              : isPartialCod
              ? `Partial Prepaid (${(payload.partialPrepaidMethod || 'UPI').toUpperCase()}) + COD Balance`
              : `${payload.paymentMethod.toUpperCase()} Gateway`,
          }
        : undefined,
      orderStatus: initialStatus,
      statusHistory: [
        {
          status: initialStatus,
          timestamp: nowIso,
          note: isUpiPayment
            ? `Dynamic UPI QR payment proof submitted by customer (UTR/Ref: ${payload.paymentProof?.utrNumber || 'Attached'}). Awaiting Admin verification.`
            : isPartialCod
            ? `Partial Prepaid (₹${(payload.partialPrepaidAmount || 0).toLocaleString('en-IN')}) processed; upper/balance ₹${(payload.codBalanceOnDelivery || 0).toLocaleString('en-IN')} payable on delivery (COD).${payload.informHubForDispatch ? ' Hub notified for faster dispatch.' : ''}`
            : isJeCash
            ? `Order confirmed & paid using JE Cash (₹${finalAmount.toLocaleString('en-IN')}).${payload.informHubForDispatch ? ' Hub notified for faster dispatch.' : ''}`
            : payload.paymentMethod === 'cod'
            ? `Order confirmed with Cash on Delivery.${payload.informHubForDispatch ? ' Hub notified for faster dispatch.' : ''}`
            : `Payment processed & order confirmed.${payload.informHubForDispatch ? ' Hub notified for faster dispatch.' : ''}`,
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
      whatsappMessageSent: !!(payload.informHubForDispatch || payload.isWhatsAppCheckout),
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

    // Deduct JE Cash balance if paid via JE Cash or Partial Prepaid via JE Cash
    if (isJeCash) {
      deductJeCashBalance(finalAmount, orderId, `Paid for Order #${orderId}`);
    } else if (isPartialJeCash && payload.partialPrepaidAmount) {
      deductJeCashBalance(
        payload.partialPrepaidAmount,
        orderId,
        `Partial Prepaid for COD Order #${orderId}`
      );
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

  const approveUpiPayment = (orderId: string, notes?: string, adminName?: string) => {
    const nowIso = new Date().toISOString();
    let found = false;

    setOrders((prev) =>
      prev.map((order) => {
        if (order.id !== orderId) return order;
        found = true;
        const updatedDetails = {
          ...order.paymentDetails,
          transactionId: order.paymentDetails?.transactionId || `UPI-APPROVED-${Date.now().toString().slice(-6)}`,
          paidAt: order.paymentDetails?.paidAt || nowIso,
          verifiedAt: nowIso,
          verifiedBy: adminName || currentUser.name || 'Store Admin',
          verificationNote: notes || 'UPI payment proof verified and approved by Store Admin',
        };

        return {
          ...order,
          paymentStatus: 'verified_paid',
          orderStatus: 'in_progress',
          paymentDetails: updatedDetails,
          statusHistory: [
            ...order.statusHistory,
            {
              status: 'in_progress',
              timestamp: nowIso,
              note: notes
                ? `Payment approved: ${notes}. Order moved to In Progress.`
                : `Payment approved by ${adminName || currentUser.name || 'Admin'}. Order moved to In Progress.`,
              updatedBy: adminName || currentUser.name || 'Admin',
            },
          ],
        };
      })
    );

    if (found) {
      return { success: true, message: `Payment for Order ${orderId} approved. Order status changed to In Progress.` };
    }
    return { success: false, message: `Order ${orderId} not found.` };
  };

  const rejectUpiPayment = (orderId: string, reason: string, adminName?: string) => {
    const nowIso = new Date().toISOString();
    let found = false;

    setOrders((prev) =>
      prev.map((order) => {
        if (order.id !== orderId) return order;
        found = true;
        return {
          ...order,
          paymentStatus: 'failed',
          paymentDetails: {
            ...order.paymentDetails,
            rejectionReason: reason,
          },
          statusHistory: [
            ...order.statusHistory,
            {
              status: 'payment_pending',
              timestamp: nowIso,
              note: `Payment proof rejected: ${reason}`,
              updatedBy: adminName || currentUser.name || 'Admin',
            },
          ],
        };
      })
    );

    if (found) {
      return { success: true, message: `Payment for Order ${orderId} rejected.` };
    }
    return { success: false, message: `Order ${orderId} not found.` };
  };

  const updateUpiSettings = (upiId: string, upiName?: string) => {
    if (currentRole !== 'super_admin') {
      return { success: false, message: 'Access denied: Only Super Admin can update UPI settings.' };
    }
    const cleanUpi = upiId.trim();
    if (!cleanUpi) {
      return { success: false, message: 'Please provide a valid UPI ID / VPA.' };
    }
    const cleanName = (upiName || settings.upiName || 'Javed Electronics').trim();

    setSettings((prev) => ({
      ...prev,
      upiId: cleanUpi,
      upiName: cleanName,
    }));

    // Sync with upi_qr payment gateway
    setPaymentGateways((prev) =>
      prev.map((gw) => {
        if (gw.provider === 'upi_qr') {
          return {
            ...gw,
            upiVpa: cleanUpi,
            title: `Dynamic UPI QR (${cleanUpi})`,
          };
        }
        return gw;
      })
    );

    return { success: true, message: `UPI ID updated to ${cleanUpi} successfully.` };
  };

  const updatePaymentChargeSettings = (config: {
    codExtraChargeEnabled: boolean;
    codExtraChargeType: 'fixed' | 'percentage';
    codExtraChargeValue: number;
    prepaidDiscountEnabled: boolean;
    prepaidDiscountType: 'percentage' | 'fixed';
    prepaidDiscountValue: number;
    prepaidMaxDiscountAmount?: number;
  }) => {
    if (currentRole !== 'super_admin') {
      return { success: false, message: 'Access denied: Only Super Admin can update COD & Prepaid rules.' };
    }
    setSettings((prev) => ({
      ...prev,
      codExtraChargeEnabled: config.codExtraChargeEnabled,
      codExtraChargeType: config.codExtraChargeType,
      codExtraChargeValue: Math.max(0, Number(config.codExtraChargeValue) || 0),
      prepaidDiscountEnabled: config.prepaidDiscountEnabled,
      prepaidDiscountType: config.prepaidDiscountType,
      prepaidDiscountValue: Math.max(0, Number(config.prepaidDiscountValue) || 0),
      prepaidMaxDiscountAmount:
        config.prepaidMaxDiscountAmount !== undefined
          ? Math.max(0, Number(config.prepaidMaxDiscountAmount) || 0)
          : prev.prepaidMaxDiscountAmount,
    }));

    // Sync payment gateways with the new COD surcharge & Prepaid discount rules
    setPaymentGateways((prev) =>
      prev.map((gw) => {
        if (gw.provider === 'cod') {
          return {
            ...gw,
            feeOrDiscountType: config.codExtraChargeEnabled
              ? config.codExtraChargeType === 'percentage'
                ? 'percentage_surcharge'
                : 'surcharge'
              : 'none',
            feeOrDiscountValue: config.codExtraChargeEnabled ? config.codExtraChargeValue : 0,
          };
        }
        if (
          ['upi_qr', 'razorpay', 'phonepe', 'paytm', 'cashfree', 'stripe', 'je_cash'].includes(
            gw.provider
          )
        ) {
          return {
            ...gw,
            feeOrDiscountType: config.prepaidDiscountEnabled
              ? config.prepaidDiscountType === 'fixed'
                ? 'fixed_discount'
                : 'percentage_discount'
              : 'none',
            feeOrDiscountValue: config.prepaidDiscountEnabled ? config.prepaidDiscountValue : 0,
          };
        }
        return gw;
      })
    );

    return {
      success: true,
      message: 'COD Extra Charge & Prepaid Order Discount settings updated.',
    };
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
    proof: {
      collectedAmount?: number;
      paymentMethodCollected?: 'cash' | 'doorstep_upi_qr';
      note?: string;
      receiverName?: string;
      podImageUrl?: string;
      deliveryPinEntered?: string;
      verifiedOtp?: boolean;
      customerFeedback?: {
        rating: number;
        tags: string[];
        comment?: string;
        submittedAt: string;
      };
    }
  ) => {
    const nowIso = new Date().toISOString();
    const orderToUpdate = orders.find((o) => o.id === orderId);

    // Increment rider's COD cash in hand if COD cash was collected (not if doorstep UPI)
    if (proof.collectedAmount && proof.collectedAmount > 0 && proof.paymentMethodCollected !== 'doorstep_upi_qr') {
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
            ...order.deliveryProof,
            ...proof,
            timestamp: nowIso,
          },
          dispatchDetails: order.dispatchDetails
            ? {
                ...order.dispatchDetails,
                codCollectedStatus: 'collected',
                codCollectedAt: nowIso,
                codCollectedMethod: proof.paymentMethodCollected || 'cash',
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

      // Auto-credit referral bonus if enabled
      if (referralProgramConfig.autoCreditWalletOnDelivery) {
        setReferralRecords((prev) =>
          prev.map((rec) => {
            if (rec.status === 'pending_order') {
              const custPhone10 = orderToUpdate.customer.phone.replace(/\D/g, '').slice(-10);
              const recPhone10 = (rec.refereePhone || '').replace(/\D/g, '').slice(-10);
              const matchesPhone = custPhone10 && recPhone10 && custPhone10 === recPhone10;
              const matchesCoupon = orderToUpdate.couponCode && rec.bonusCouponCode && rec.bonusCouponCode.toUpperCase() === orderToUpdate.couponCode.toUpperCase();
              if (matchesPhone || matchesCoupon) {
                return {
                  ...rec,
                  status: 'awarded' as const,
                  qualifyingOrderId: orderId,
                  awardedAt: nowIso,
                  notes: `Auto-credited upon successful delivery of Order #${orderId}`,
                };
              }
            }
            return rec;
          })
        );
      }
    }
  };

  const submitDeliveryCustomerFeedback = (
    orderId: string,
    feedback: {
      rating: number;
      tags: string[];
      comment?: string;
      submittedAt?: string;
    }
  ) => {
    const nowIso = feedback.submittedAt || new Date().toISOString();
    setOrders((prev) =>
      prev.map((order) => {
        if (order.id !== orderId) return order;
        return {
          ...order,
          deliveryProof: {
            ...order.deliveryProof,
            customerFeedback: {
              ...feedback,
              submittedAt: nowIso,
            },
          },
        };
      })
    );
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

  const requestOrderReturn = (
    orderId: string,
    reason: string,
    details?: {
      issueType?: string;
      productId?: string;
      productName?: string;
      sku?: string;
      serialNumber?: string;
      unboxingVideoUrl?: string;
      unboxingVideoName?: string;
      proofImages?: string[];
      requestType?: 'refund' | 'replacement' | 'exchange';
    }
  ) => {
    const nowIso = new Date().toISOString();
    const targetOrder = orders.find((o) => o.id === orderId);

    const summaryParts: string[] = [reason];
    if (details?.sku || details?.serialNumber) {
      summaryParts.push(
        `SKU/SN: ${[details.sku, details.serialNumber].filter(Boolean).join(' / ')}`
      );
    }
    if (details?.unboxingVideoName || details?.unboxingVideoUrl) {
      summaryParts.push(`Unboxing Video: ${details.unboxingVideoName || 'Attached'}`);
    }
    if (details?.proofImages && details.proofImages.length > 0) {
      summaryParts.push(`Proof Photos: ${details.proofImages.length} attached`);
    }
    const noteText = `Return / Replacement requested — ${summaryParts.join(' • ')}`;

    setOrders((prev) =>
      prev.map((order) => {
        if (order.id !== orderId) return order;
        const updated: Order = {
          ...order,
          orderStatus: 'return_requested',
          returnReason: reason,
          returnDetails: {
            reason,
            issueType: details?.issueType,
            productId: details?.productId,
            productName: details?.productName,
            sku: details?.sku,
            serialNumber: details?.serialNumber,
            unboxingVideoUrl: details?.unboxingVideoUrl,
            unboxingVideoName: details?.unboxingVideoName,
            proofImages: details?.proofImages,
            requestedAt: nowIso,
          },
          statusHistory: [
            ...order.statusHistory,
            {
              status: 'return_requested',
              timestamp: nowIso,
              note: noteText,
              updatedBy: 'Customer',
            },
          ],
        };
        if (selectedOrderForModal?.id === orderId) {
          setSelectedOrderForModal(updated);
        }
        return updated;
      })
    );

    if (targetOrder && targetOrder.items.length > 0) {
      const targetItem =
        targetOrder.items.find((i) => i.productId === details?.productId) || targetOrder.items[0];
      const matchedProd = products.find((p) => p.id === targetItem.productId);
      const catId = matchedProd?.categoryId || 'smartphones';
      const pol = getCategoryReturnPolicy(catId);
      const itemQty = targetItem.activeQuantity ?? targetItem.quantity;
      const itemTotal = targetItem.unitPrice * itemQty;
      const newReqId = `RET-${Date.now().toString().slice(-6)}`;
      const newReq: ReturnExchangeRequest = {
        id: newReqId,
        orderId: targetOrder.id,
        invoiceNumber: targetOrder.invoiceNumber,
        outletId: targetOrder.outletId,
        outletName: targetOrder.outletName,
        customerId: targetOrder.customer.id || currentUser.id || 'cust_guest',
        customerName: targetOrder.customer.name,
        customerPhone: targetOrder.customer.phone,
        customerEmail: targetOrder.customer.email,
        productId: targetItem.productId,
        productName: targetItem.productName,
        productSku: details?.sku || targetItem.sku,
        productImage: targetItem.image,
        categoryId: catId,
        categoryName: pol.categoryName,
        quantity: itemQty,
        itemUnitPrice: targetItem.unitPrice,
        itemTotal,
        requestType: details?.requestType || 'replacement',
        reason: (details?.issueType as ReturnReasonCode) || 'damaged_in_transit',
        reasonDescription: reason,
        conditionChecklistConfirmed: true,
        serialNumber: details?.serialNumber,
        unboxingVideoUrl: details?.unboxingVideoUrl,
        unboxingVideoName: details?.unboxingVideoName,
        evidenceImages: details?.proofImages,
        refundMethod: 'original_payment',
        refundAmount: itemTotal,
        deliveredAt: targetOrder.deliveryProof?.timestamp || targetOrder.createdAt,
        requestedAt: nowIso,
        windowClosingAt: new Date(Date.now() + 7 * 86400000).toISOString(),
        isWithinWindow: true,
        daysRemaining: 7,
        status: 'requested',
        statusHistory: [
          {
            status: 'requested',
            timestamp: nowIso,
            note: noteText,
            updatedBy: `${targetOrder.customer.name} (Customer)`,
          },
        ],
        pickupAddress: `${targetOrder.customer.address}, ${targetOrder.customer.area}, ${targetOrder.customer.city} - ${targetOrder.customer.pincode}`,
        pickupSlot: 'Tomorrow 10:00 AM - 01:00 PM',
      };
      setReturnExchangeRequests((prev) => [newReq, ...prev]);
    }
  };

  // ============================================================================
  // RETURN, REFUND, REPLACEMENT & EXCHANGE STRUCTURE AS PER CATEGORY
  // ============================================================================
  const updateCategoryReturnPolicy = (
    categoryId: ProductCategory,
    updates: Partial<CategoryReturnPolicy>
  ): { success: boolean; message: string } => {
    setCategoryReturnPolicies((prev) =>
      prev.map((pol) => (pol.categoryId === categoryId ? { ...pol, ...updates } : pol))
    );
    return { success: true, message: `Return policy for category ${String(categoryId)} updated successfully.` };
  };

  const resetCategoryReturnPolicies = (): { success: boolean; message: string } => {
    setCategoryReturnPolicies(INITIAL_CATEGORY_RETURN_POLICIES);
    return { success: true, message: 'All category return & replacement policies reset to default specifications.' };
  };

  const getCategoryReturnPolicy = (categoryId: ProductCategory): CategoryReturnPolicy => {
    const found = categoryReturnPolicies.find((p) => p.categoryId === categoryId);
    if (found) return found;
    const defaultOther = categoryReturnPolicies.find((p) => p.categoryId === 'other');
    if (defaultOther) return defaultOther;
    return {
      categoryId,
      categoryName: String(categoryId),
      policyType: 'refund_and_replacement',
      windowDays: 7,
      allowRefund: true,
      allowReplacement: true,
      allowExchange: true,
      requiresOriginalPackaging: true,
      requiresTagsIntact: false,
      requiresUnusedUnworn: true,
      requiresTechnicianInspection: false,
      requiresPhotoProof: false,
      pickupFee: 0,
      walletBonusPercentage: 5,
      termsAndConditions: [
        '7-Day Doorstep Replacement or Return for valid quality/defect issues.',
        'Must retain original packaging and accessories.',
      ],
      isActive: true,
    };
  };

  const submitReturnExchangeRequest = (reqData: {
    orderId: string;
    invoiceNumber: string;
    outletId?: string;
    outletName?: string;
    customerId?: string;
    customerName: string;
    customerPhone: string;
    customerEmail?: string;
    productId: string;
    productName: string;
    productSku: string;
    productImage: string;
    categoryId: ProductCategory;
    categoryName: string;
    quantity: number;
    itemUnitPrice: number;
    itemTotal: number;
    requestType: 'refund' | 'replacement' | 'exchange';
    reason: ReturnReasonCode;
    reasonDescription: string;
    conditionChecklistConfirmed: boolean;
    customerConditionNotes?: string;
    serialNumber?: string;
    unboxingVideoUrl?: string;
    unboxingVideoName?: string;
    evidenceImages?: string[];
    exchangeOptions?: {
      requestedSize?: string;
      requestedColor?: string;
      notes?: string;
    };
    refundMethod: 'original_payment' | 'wallet_credits' | 'bank_transfer_upi';
    refundAmount: number;
    walletBonusAmount?: number;
    bankUpiDetails?: {
      upiId?: string;
      accountNumber?: string;
      ifscCode?: string;
      accountHolderName?: string;
    };
    deliveredAt: string;
    pickupAddress: string;
    pickupSlot?: string;
  }): { success: boolean; message: string; request?: ReturnExchangeRequest } => {
    const policy = getCategoryReturnPolicy(reqData.categoryId);
    const delivTime = new Date(reqData.deliveredAt).getTime();
    const now = Date.now();
    const windowMs = policy.windowDays > 0 ? policy.windowDays * 86400000 : (policy.windowHours || 48) * 3600000;
    const windowClosingAt = new Date(delivTime + windowMs).toISOString();
    const isWithinWindow = now <= (delivTime + windowMs);
    const diffMs = (delivTime + windowMs) - now;
    const daysRemaining = Math.max(0, Math.ceil(diffMs / 86400000));

    if (!isWithinWindow && policy.windowDays > 0) {
      return {
        success: false,
        message: `The return/replacement window of ${policy.windowDays} days for this ${policy.categoryName} product closed on ${new Date(windowClosingAt).toLocaleDateString('en-IN')}.`,
      };
    }

    const newId = `RET-${Date.now().toString().slice(-6)}`;
    const newRequest: ReturnExchangeRequest = {
      ...reqData,
      id: newId,
      customerId: reqData.customerId || currentUser.id || 'cust_guest',
      requestedAt: new Date().toISOString(),
      windowClosingAt,
      isWithinWindow: true,
      daysRemaining,
      status: 'requested',
      statusHistory: [
        {
          status: 'requested',
          timestamp: new Date().toISOString(),
          note: `Customer submitted ${reqData.requestType.toUpperCase()} request. Reason: ${reqData.reason.replace(/_/g, ' ')}`,
          updatedBy: `${reqData.customerName} (Customer)`,
        },
      ],
    };

    setReturnExchangeRequests((prev) => [newRequest, ...prev]);

    // Also update order status
    setOrders((prev) =>
      prev.map((ord) => {
        if (ord.id === reqData.orderId) {
          return {
            ...ord,
            orderStatus: 'return_requested',
            returnReason: `${reqData.requestType.toUpperCase()}: ${reqData.reasonDescription}`,
            statusHistory: [
              ...ord.statusHistory,
              {
                status: 'return_requested',
                timestamp: new Date().toISOString(),
                note: `Return/Exchange request #${newId} logged for ${reqData.productName}`,
                updatedBy: `${reqData.customerName} (Customer)`,
              },
            ],
          };
        }
        return ord;
      })
    );

    return {
      success: true,
      message: `Your ${reqData.requestType} request #${newId} has been submitted successfully! Reverse pickup is being scheduled.`,
      request: newRequest,
    };
  };

  const updateReturnRequestStatus = (
    requestId: string,
    status: ReturnRequestStatus,
    note?: string,
    staffName?: string,
    assignedRider?: { id: string; name: string }
  ): { success: boolean; message: string } => {
    const updater = staffName || currentUser.name || 'Store Staff';
    const nowIso = new Date().toISOString();

    setReturnExchangeRequests((prev) =>
      prev.map((req) => {
        if (req.id !== requestId) return req;
        const updatedStatusHistory = [
          ...req.statusHistory,
          {
            status,
            timestamp: nowIso,
            note: note || `Status updated to ${status.replace(/_/g, ' ')}`,
            updatedBy: updater,
          },
        ];

        return {
          ...req,
          status,
          statusHistory: updatedStatusHistory,
          assignedPickupRiderId: assignedRider ? assignedRider.id : req.assignedPickupRiderId,
          assignedPickupRiderName: assignedRider ? assignedRider.name : req.assignedPickupRiderName,
          processedAt: nowIso,
          processedBy: updater,
        };
      })
    );

    return { success: true, message: `Request #${requestId} status updated to ${status.replace(/_/g, ' ')}.` };
  };

  const processReturnRefund = (
    requestId: string,
    refundMethod: 'original_payment' | 'wallet_credits' | 'bank_transfer_upi',
    transactionId?: string,
    approverName?: string
  ): { success: boolean; message: string } => {
    const target = returnExchangeRequests.find((r) => r.id === requestId);
    if (!target) return { success: false, message: 'Return request not found.' };

    const approver = approverName || currentUser.name || 'Finance Manager';
    const nowIso = new Date().toISOString();
    const finalRefundTotal = target.refundAmount + (target.walletBonusAmount || 0);
    const txnId = transactionId || `RFD-TXN-${Date.now().toString().slice(-6)}`;

    // If JE Cash credits, add directly to user balance & ledger
    if (refundMethod === 'wallet_credits') {
      const updatedBal = (currentUser.rewardBalance || currentUser.jeCashBalance || 0) + finalRefundTotal;
      setCurrentUser((prev) => ({
        ...prev,
        rewardBalance: updatedBal,
        jeCashBalance: updatedBal,
      }));
      setJeCashTransactions((prev) => [
        {
          id: `JECASH-RFD-${Date.now().toString().slice(-6)}`,
          type: 'credit',
          amount: finalRefundTotal,
          balanceAfter: updatedBal,
          description: `JE Cash Refund Credit (+5% shopping bonus) for Return #${target.id}`,
          category: 'order_refund',
          timestamp: nowIso,
          orderId: target.orderId,
          referenceId: txnId,
          paymentMethodUsed: 'JE Cash Refund System',
        },
        ...prev,
      ]);
    }

    // Update return request
    setReturnExchangeRequests((prev) =>
      prev.map((req) => {
        if (req.id !== requestId) return req;
        return {
          ...req,
          status: 'refund_processed',
          refundTransactionId: txnId,
          processedAt: nowIso,
          processedBy: approver,
          statusHistory: [
            ...req.statusHistory,
            {
              status: 'refund_processed',
              timestamp: nowIso,
              note: `Refund of ₹${finalRefundTotal.toLocaleString('en-IN')} successfully settled via ${refundMethod.replace(/_/g, ' ')} (Txn: ${txnId})`,
              updatedBy: approver,
            },
          ],
        };
      })
    );

    // Update order status
    setOrders((prev) =>
      prev.map((ord) => {
        if (ord.id !== target.orderId) return ord;
        return {
          ...ord,
          orderStatus: 'refunded',
          refundStatus: 'processed',
          refundedAmount: (ord.refundedAmount || 0) + target.refundAmount,
          statusHistory: [
            ...ord.statusHistory,
            {
              status: 'refunded',
              timestamp: nowIso,
              note: `Refund of ₹${finalRefundTotal.toLocaleString('en-IN')} approved for item ${target.productName} by ${approver}`,
              updatedBy: approver,
            },
          ],
        };
      })
    );

    return {
      success: true,
      message: `Refund of ₹${finalRefundTotal.toLocaleString('en-IN')} successfully processed via ${refundMethod.replace(/_/g, ' ')}.`,
    };
  };

  const dispatchReturnReplacement = (
    requestId: string,
    replacementOrderId?: string,
    approverName?: string
  ): { success: boolean; message: string } => {
    const target = returnExchangeRequests.find((r) => r.id === requestId);
    if (!target) return { success: false, message: 'Return request not found.' };

    const approver = approverName || currentUser.name || 'Store Manager';
    const repId = replacementOrderId || `REP-${Date.now().toString().slice(-6)}`;
    const nowIso = new Date().toISOString();

    setReturnExchangeRequests((prev) =>
      prev.map((req) => {
        if (req.id !== requestId) return req;
        return {
          ...req,
          status: 'replacement_dispatched',
          replacementOrderId: repId,
          processedAt: nowIso,
          processedBy: approver,
          statusHistory: [
            ...req.statusHistory,
            {
              status: 'replacement_dispatched',
              timestamp: nowIso,
              note: `Replacement/Exchange unit dispatched under Order #${repId}`,
              updatedBy: approver,
            },
          ],
        };
      })
    );

    return {
      success: true,
      message: `Replacement order #${repId} has been created and dispatched to the customer.`,
    };
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
      createdAt: coup.createdAt || new Date().toISOString(),
    };
    setCoupons((prev) => [newCoupon, ...prev]);
  };

  const toggleCouponStatus = (id: string) => {
    setCoupons((prev) =>
      prev.map((c) => (c.id === id ? { ...c, isActive: !c.isActive } : c))
    );
  };

  const updateCoupon = (couponId: string, updates: Partial<Coupon>) => {
    let found = false;
    setCoupons((prev) =>
      prev.map((c) => {
        if (c.id === couponId) {
          found = true;
          return { ...c, ...updates };
        }
        return c;
      })
    );
    if (found) {
      return { success: true, message: 'Coupon details updated successfully.' };
    }
    return { success: false, message: 'Coupon not found.' };
  };

  const deleteCoupon = (couponId: string) => {
    setCoupons((prev) => prev.filter((c) => c.id !== couponId));
    if (appliedCoupon?.id === couponId) {
      setAppliedCoupon(null);
    }
    return { success: true, message: 'Coupon removed successfully.' };
  };

  // Referral Program Structure & Operations
  const updateReferralProgramConfig = (updates: Partial<ReferralProgramConfig>, updatedBy: string = 'Super Admin') => {
    setReferralProgramConfig((prev) => ({
      ...prev,
      ...updates,
      updatedAt: new Date().toISOString(),
      updatedBy,
    }));
    return { success: true, message: 'Referral program configuration updated successfully.' };
  };

  const awardReferralBonus = (recordId: string, notes?: string) => {
    let targetRecord: ReferralRecord | undefined;
    setReferralRecords((prev) =>
      prev.map((r) => {
        if (r.id === recordId) {
          targetRecord = {
            ...r,
            status: 'awarded',
            awardedAt: new Date().toISOString(),
            notes: notes || r.notes || 'Manually approved & awarded by admin',
          };
          return targetRecord;
        }
        return r;
      })
    );
    if (!targetRecord) {
      return { success: false, message: 'Referral record not found.' };
    }
    // If the referrer matches the currentUser, credit their reward wallet
    if (
      (targetRecord as ReferralRecord).referrerPhone === currentUser.phone ||
      (targetRecord as ReferralRecord).referrerCode === currentUser.referralCode
    ) {
      setCurrentUser((prev) => ({
        ...prev,
        rewardBalance: (prev.rewardBalance || 0) + ((targetRecord as ReferralRecord).rewardAmount || 100),
      }));
    }
    return {
      success: true,
      message: `Referral bonus of ₹${(targetRecord as ReferralRecord).rewardAmount} awarded to ${(targetRecord as ReferralRecord).referrerName}!`,
    };
  };

  const cancelReferralRecord = (recordId: string, reason?: string) => {
    let targetFound = false;
    setReferralRecords((prev) =>
      prev.map((r) => {
        if (r.id === recordId) {
          targetFound = true;
          return {
            ...r,
            status: 'cancelled',
            notes: reason ? `${r.notes ? r.notes + ' | ' : ''}Cancelled: ${reason}` : r.notes,
          };
        }
        return r;
      })
    );
    if (targetFound) {
      return { success: true, message: 'Referral record marked as cancelled.' };
    }
    return { success: false, message: 'Referral record not found.' };
  };

  const adjustCustomerWalletBalance = (targetPhoneOrId: string, amountDiff: number, reason: string) => {
    const isCurrent =
      targetPhoneOrId === currentUser.id ||
      targetPhoneOrId === currentUser.phone ||
      currentUser.phone.includes(targetPhoneOrId);

    if (isCurrent) {
      setCurrentUser((prev) => ({
        ...prev,
        rewardBalance: Math.max(0, (prev.rewardBalance || 0) + amountDiff),
      }));
    }

    setAccounts((prev) =>
      prev.map((acc) => {
        if (acc.id === targetPhoneOrId || acc.phone === targetPhoneOrId) {
          return {
            ...acc,
            rewardBalance: Math.max(0, (acc.rewardBalance || 0) + amountDiff),
          };
        }
        return acc;
      })
    );

    return {
      success: true,
      message: `Wallet balance adjusted by ${amountDiff >= 0 ? '+' : ''}₹${amountDiff} (${reason}).`,
    };
  };

  // Promotional Landing Pages & Marketing Spaces Engine
  const addPromotionalPage = (pageData: Omit<PromotionalPage, 'id' | 'createdAt' | 'updatedAt'>) => {
    const slug = pageData.slug?.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-') || `promo-${Date.now()}`;
    const newPage: PromotionalPage = {
      ...pageData,
      id: `promo-${Date.now()}`,
      slug,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      updatedBy: currentUser.name || 'Super Admin',
    };
    setPromotionalPages((prev) => [newPage, ...prev]);
    return { success: true, message: `Promotional page "${newPage.title}" created successfully!`, page: newPage };
  };

  const updatePromotionalPage = (pageId: string, updates: Partial<PromotionalPage>) => {
    let found = false;
    setPromotionalPages((prev) =>
      prev.map((p) => {
        if (p.id === pageId) {
          found = true;
          return {
            ...p,
            ...updates,
            updatedAt: new Date().toISOString(),
            updatedBy: currentUser.name || 'Super Admin',
          };
        }
        return p;
      })
    );
    if (activePromotionalPage?.id === pageId) {
      setActivePromotionalPage((prev) => (prev ? { ...prev, ...updates } : null));
    }
    if (found) {
      return { success: true, message: 'Promotional landing page updated successfully.' };
    }
    return { success: false, message: 'Promotional page not found.' };
  };

  const deletePromotionalPage = (pageId: string) => {
    setPromotionalPages((prev) => prev.filter((p) => p.id !== pageId));
    if (activePromotionalPage?.id === pageId) {
      setActivePromotionalPage(null);
      if (activeModal === 'promotional_page') {
        setActiveModal(null);
      }
    }
    return { success: true, message: 'Promotional landing page deleted.' };
  };

  const togglePromotionalPageStatus = (pageId: string) => {
    let newStatus = false;
    setPromotionalPages((prev) =>
      prev.map((p) => {
        if (p.id === pageId) {
          newStatus = !p.isActive;
          return { ...p, isActive: newStatus, updatedAt: new Date().toISOString() };
        }
        return p;
      })
    );
    return {
      success: true,
      message: `Promotional page status updated to ${newStatus ? 'ACTIVE' : 'INACTIVE'}.`,
    };
  };

  const openPromotionalPageBySlug = (slug: string): boolean => {
    const cleanSlug = slug.trim().toLowerCase();
    const page = promotionalPages.find(
      (p) => p.slug.toLowerCase() === cleanSlug || p.id === cleanSlug
    );
    if (page) {
      setActivePromotionalPage(page);
      setActiveModal('promotional_page');
      return true;
    }
    return false;
  };

  // Chatbot AI & Knowledge Base Training Methods
  const updateChatbotAiSettings = (updates: Partial<ChatbotAiSettings>) => {
    setChatbotAiSettings((prev) => ({
      ...prev,
      ...updates,
    }));
    return { success: true, message: 'Chatbot AI configuration updated successfully!' };
  };

  const addKnowledgeItem = (item: Omit<ChatbotKnowledgeItem, 'id' | 'lastUpdated'>) => {
    const newItem: ChatbotKnowledgeItem = {
      ...item,
      id: `kb-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timesAnswered: 0,
      lastUpdated: new Date().toISOString(),
    };
    setChatbotAiSettings((prev) => ({
      ...prev,
      knowledgeBase: [newItem, ...prev.knowledgeBase],
    }));
    return { success: true, message: 'Q&A training pair added successfully to AI Knowledge Base!', item: newItem };
  };

  const updateKnowledgeItem = (itemId: string, updates: Partial<ChatbotKnowledgeItem>) => {
    setChatbotAiSettings((prev) => ({
      ...prev,
      knowledgeBase: prev.knowledgeBase.map((k) =>
        k.id === itemId
          ? { ...k, ...updates, lastUpdated: new Date().toISOString() }
          : k
      ),
    }));
    return { success: true, message: 'Q&A training pair updated successfully!' };
  };

  const deleteKnowledgeItem = (itemId: string) => {
    setChatbotAiSettings((prev) => ({
      ...prev,
      knowledgeBase: prev.knowledgeBase.filter((k) => k.id !== itemId),
    }));
    return { success: true, message: 'Q&A training item removed from AI Knowledge Base.' };
  };

  const toggleKnowledgeItemStatus = (itemId: string) => {
    let newStatus = false;
    setChatbotAiSettings((prev) => ({
      ...prev,
      knowledgeBase: prev.knowledgeBase.map((k) => {
        if (k.id === itemId) {
          newStatus = !k.isActive;
          return { ...k, isActive: newStatus, lastUpdated: new Date().toISOString() };
        }
        return k;
      }),
    }));
    return { success: true, message: `Training item status set to ${newStatus ? 'ACTIVE' : 'INACTIVE'}.` };
  };

  const resetKnowledgeBaseToDefaults = () => {
    setChatbotAiSettings((prev) => ({
      ...prev,
      knowledgeBase: INITIAL_CHATBOT_KNOWLEDGE_BASE,
    }));
    return { success: true, message: 'Knowledge base reset to recommended retail training defaults.' };
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
    setCurrentUser((prev) => {
      const updatedList = addr.isDefault
        ? prev.savedAddresses.map((a) => ({ ...a, isDefault: false }))
        : prev.savedAddresses;
      return {
        ...prev,
        savedAddresses: [...updatedList, newAddr],
      };
    });
  };

  const updateUserProfile = (updates: Partial<Pick<UserProfile, 'name' | 'phone' | 'email'>>) => {
    setCurrentUser((prev) => ({
      ...prev,
      ...updates,
    }));
    return {
      success: true,
      message: 'Your profile details have been updated!',
    };
  };

  const deleteSavedAddress = (addressId: string) => {
    setCurrentUser((prev) => ({
      ...prev,
      savedAddresses: prev.savedAddresses.filter((a) => a.id !== addressId),
    }));
  };

  const setDefaultAddress = (addressId: string) => {
    setCurrentUser((prev) => ({
      ...prev,
      savedAddresses: prev.savedAddresses.map((a) => ({
        ...a,
        isDefault: a.id === addressId,
      })),
    }));
  };

  const redeemReferralCode = (code: string) => {
    const clean = code.trim().toUpperCase();
    if (!clean || clean.length < 4) {
      return { success: false, message: 'Please enter a valid referral code.' };
    }
    if (clean === currentUser.referralCode.toUpperCase()) {
      return { success: false, message: 'You cannot redeem your own referral code.' };
    }
    if (!referralProgramConfig.isEnabled) {
      return { success: false, message: 'The Refer & Earn program is currently paused.' };
    }

    const bonus = referralProgramConfig.refereeRewardAmount || 100;
    setCurrentUser((prev) => ({
      ...prev,
      rewardBalance: (prev.rewardBalance || 0) + bonus,
    }));

    // Create a usable referral discount coupon if not already present
    const refCouponCode = `${referralProgramConfig.referralCouponCodePrefix || 'REF'}${bonus}`;
    const exists = coupons.some((c) => c.code.toUpperCase() === refCouponCode.toUpperCase());
    if (!exists) {
      const newRefCoupon: Coupon = {
        id: `coup-ref-${Date.now()}`,
        code: refCouponCode,
        discountType: 'fixed',
        value: bonus,
        minOrderValue: referralProgramConfig.minOrderValueToQualify || 499,
        validUntil: new Date(Date.now() + 86400000 * (referralProgramConfig.referralCouponValidityDays || 30)).toISOString(),
        usageLimit: 100,
        timesUsed: 0,
        description: `₹${bonus} Referral Bonus Discount (Claimed via code ${clean})`,
        isActive: true,
        createdAt: new Date().toISOString(),
      };
      setCoupons((prev) => [newRefCoupon, ...prev]);
    }

    // Add entry into referral audit trail records for admin visibility
    const newRecord: ReferralRecord = {
      id: `ref-rec-${Date.now()}`,
      referrerCode: clean,
      referrerName: `Member (${clean})`,
      referrerPhone: clean,
      refereeName: currentUser.name || 'App Customer',
      refereePhone: currentUser.phone,
      refereeEmail: currentUser.email,
      refereeCodeUsed: clean,
      rewardAmount: bonus,
      status: 'pending_order',
      bonusCouponCode: refCouponCode,
      redeemedAt: new Date().toISOString(),
      notes: `Claimed via customer account with referral code ${clean}`,
    };
    setReferralRecords((prev) => [newRecord, ...prev]);

    return {
      success: true,
      bonusAdded: bonus,
      message: `Referral code ${clean} applied! ₹${bonus} credited to your Reward Wallet + promo code ${refCouponCode} unlocked!`,
    };
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

    const nowMs = Date.now();
    let effectiveStatus: AccountStatus = account.accountStatus || (account.isActive === false ? 'suspended' : 'active');
    const activeSanction = account.sanction;

    // Auto-lift expired temporary sanctions (except terminated)
    if (activeSanction?.expiresAt && new Date(activeSanction.expiresAt).getTime() <= nowMs && effectiveStatus !== 'terminated') {
      effectiveStatus = 'active';
      setAccounts((prev) =>
        prev.map((a) =>
          a.id === account.id
            ? {
                ...a,
                accountStatus: 'active',
                isActive: true,
                sanction: undefined,
                sanctionHistory: a.sanction
                  ? [
                      ...(a.sanctionHistory || []),
                      {
                        ...a.sanction,
                        resolvedAt: new Date().toISOString(),
                        resolvedBy: 'System Auto-Expiry',
                        resolutionNote: 'Sanction duration expired automatically.',
                      },
                    ]
                  : a.sanctionHistory,
              }
            : a
        )
      );
    }

    if (effectiveStatus === 'terminated') {
      return {
        success: false,
        message: `Account Terminated: ${account.sanction?.reason || 'Access has been permanently revoked by administrator for policy violations.'}`,
      };
    }

    if (effectiveStatus === 'suspended') {
      const expiryText = account.sanction?.expiresAt
        ? ` until ${new Date(account.sanction.expiresAt).toLocaleString('en-IN')}`
        : '';
      return {
        success: false,
        message: `Account Suspended${expiryText}. Reason: ${account.sanction?.reason || 'Administrative hold'}. Please contact support if you believe this is in error.`,
      };
    }

    if (effectiveStatus === 'on_hold') {
      const expiryText = account.sanction?.expiresAt
        ? ` until ${new Date(account.sanction.expiresAt).toLocaleString('en-IN')}`
        : '';
      return {
        success: false,
        message: `Account On Hold${expiryText}. Reason: ${account.sanction?.reason || 'Security/audit investigation in progress'}.`,
      };
    }

    if (!account.isActive && effectiveStatus !== 're_verification') {
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

  // Pending Customer Signup OTP store (in-memory for secure verification session)
  const [pendingCustomerSignups, setPendingCustomerSignups] = useState<
    Record<
      string,
      {
        name: string;
        email: string;
        phone: string;
        password: string;
        city?: string;
        pincode?: string;
        addressLine?: string;
        otpCode: string;
        expiresAt: number;
        resendAvailableAt: number;
      }
    >
  >({});

  const initiateCustomerSignupOtp = (data: {
    name: string;
    email: string;
    phone: string;
    password: string;
    city?: string;
    pincode?: string;
    addressLine?: string;
  }): { success: boolean; message: string; otpCode?: string; resendSeconds?: number } => {
    const cleanEmail = data.email.trim().toLowerCase();
    const cleanPhone = data.phone.trim();

    if (!data.name.trim() || !cleanEmail || !cleanPhone || !data.password.trim()) {
      return { success: false, message: 'All required registration fields must be filled.' };
    }

    if (data.password.trim().length < 6) {
      return { success: false, message: 'Password must be at least 6 characters long.' };
    }

    // Check if account already exists
    if (accounts.some((a) => a.email.toLowerCase() === cleanEmail)) {
      return {
        success: false,
        message: 'An account with this email address already exists. Please sign in instead.',
      };
    }

    // Generate random 6-digit numeric OTP code
    const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const now = Date.now();

    setPendingCustomerSignups((prev) => ({
      ...prev,
      [cleanEmail]: {
        name: data.name.trim(),
        email: cleanEmail,
        phone: cleanPhone,
        password: data.password.trim(),
        city: data.city,
        pincode: data.pincode,
        addressLine: data.addressLine,
        otpCode: generatedOtp,
        expiresAt: now + 10 * 60 * 1000, // 10 minutes
        resendAvailableAt: now + 60 * 1000, // 60s cooldown
      },
    }));

    return {
      success: true,
      message: `Verification code sent to ${cleanEmail}.`,
      otpCode: generatedOtp,
      resendSeconds: 60,
    };
  };

  const resendCustomerSignupOtp = (
    email: string
  ): { success: boolean; message: string; otpCode?: string; resendSeconds?: number } => {
    const cleanEmail = email.trim().toLowerCase();
    const pending = pendingCustomerSignups[cleanEmail];

    if (!pending) {
      return {
        success: false,
        message: 'No pending signup session found for this email. Please re-enter your details.',
      };
    }

    const now = Date.now();
    if (now < pending.resendAvailableAt) {
      const remainingSecs = Math.ceil((pending.resendAvailableAt - now) / 1000);
      return {
        success: false,
        message: `Please wait ${remainingSecs} seconds before requesting a new code.`,
      };
    }

    const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();

    setPendingCustomerSignups((prev) => ({
      ...prev,
      [cleanEmail]: {
        ...pending,
        otpCode: generatedOtp,
        expiresAt: now + 10 * 60 * 1000,
        resendAvailableAt: now + 60 * 1000,
      },
    }));

    return {
      success: true,
      message: `A new 6-digit code has been sent to ${cleanEmail}.`,
      otpCode: generatedOtp,
      resendSeconds: 60,
    };
  };

  const verifyCustomerSignupOtp = (
    email: string,
    enteredOtp: string
  ): { success: boolean; message: string; user?: UserProfile } => {
    const cleanEmail = email.trim().toLowerCase();
    const pending = pendingCustomerSignups[cleanEmail];

    if (!pending) {
      return {
        success: false,
        message: 'Signup session expired or not found. Please start registration again.',
      };
    }

    if (Date.now() > pending.expiresAt) {
      return {
        success: false,
        message: 'Verification code has expired. Please request a new code.',
      };
    }

    const cleanOtp = enteredOtp.trim().replace(/\D/g, '');
    if (cleanOtp !== pending.otpCode) {
      return {
        success: false,
        message: 'Invalid verification code. Please check and try again.',
      };
    }

    // Complete registration
    const res = registerCustomer({
      name: pending.name,
      email: pending.email,
      phone: pending.phone,
      password: pending.password,
      city: pending.city,
      pincode: pending.pincode,
      addressLine: pending.addressLine,
    });

    if (res.success) {
      // Clear pending signup session
      setPendingCustomerSignups((prev) => {
        const next = { ...prev };
        delete next[cleanEmail];
        return next;
      });
    }

    return res;
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
          area: data.city || 'Nalasopara East',
          city: data.city || 'Nalasopara',
          state: 'Maharashtra',
          pincode: data.pincode || '401209',
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
      createdBy: currentUser.name || 'Store Admin',
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

  const applyAccountSanction = (
    accountId: string,
    payload: {
      status: AccountStatus;
      reason: string;
      duration: AccountSanctionDuration;
      expiresAt?: string;
      reVerificationRequirements?: string[];
      notes?: string;
      appliedBy?: string;
    }
  ) => {
    const target = accounts.find((a) => a.id === accountId);
    if (!target) {
      return { success: false, message: 'Account not found.' };
    }

    if (target.role === 'super_admin' && currentUser.id !== target.id && payload.status === 'terminated') {
      return { success: false, message: 'Super Admin account cannot be terminated.' };
    }

    const nowIso = new Date().toISOString();
    const newSanction: AccountSanction = {
      id: `sanc-${Date.now()}`,
      status: payload.status,
      reason: payload.reason,
      appliedAt: nowIso,
      appliedBy: payload.appliedBy || `${currentUser.name} (${currentRole.replace('_', ' ')})`,
      duration: payload.duration,
      expiresAt: payload.expiresAt,
      reVerificationRequirements: payload.reVerificationRequirements,
      notes: payload.notes,
    };

    const isDeactivated = payload.status === 'suspended' || payload.status === 'terminated' || payload.status === 'on_hold';

    let updatedAccount: UserAccount | undefined;
    setAccounts((prev) =>
      prev.map((acc) => {
        if (acc.id !== accountId) return acc;
        updatedAccount = {
          ...acc,
          accountStatus: payload.status,
          isActive: !isDeactivated,
          sanction: newSanction,
          sanctionHistory: [newSanction, ...(acc.sanctionHistory || [])],
        };
        return updatedAccount;
      })
    );

    const actionWord =
      payload.status === 'suspended'
        ? 'Suspended'
        : payload.status === 'terminated'
        ? 'Terminated'
        : payload.status === 'on_hold'
        ? 'Placed On Hold'
        : payload.status === 're_verification'
        ? 'Marked for Re-Verification'
        : 'Updated';

    return {
      success: true,
      message: `Account "${target.name}" (${target.email}) has been ${actionWord}. Reason: "${payload.reason}"`,
      account: updatedAccount,
    };
  };

  const liftAccountSanction = (accountId: string, resolutionNote?: string) => {
    const target = accounts.find((a) => a.id === accountId);
    if (!target) {
      return { success: false, message: 'Account not found.' };
    }

    const nowIso = new Date().toISOString();
    let updatedAccount: UserAccount | undefined;
    setAccounts((prev) =>
      prev.map((acc) => {
        if (acc.id !== accountId) return acc;
        const previousSanction = acc.sanction;
        const resolvedHistory = previousSanction
          ? [
              {
                ...previousSanction,
                resolvedAt: nowIso,
                resolvedBy: `${currentUser.name} (${currentRole.replace('_', ' ')})`,
                resolutionNote: resolutionNote || 'Sanction lifted by administrator. Account restored to active standing.',
              },
              ...(acc.sanctionHistory || []).filter((s) => s.id !== previousSanction.id),
            ]
          : acc.sanctionHistory || [];

        updatedAccount = {
          ...acc,
          accountStatus: 'active',
          isActive: true,
          sanction: undefined,
          sanctionHistory: resolvedHistory,
        };
        return updatedAccount;
      })
    );

    return {
      success: true,
      message: `Sanctions lifted for ${target.name}. Account is now Active and in good standing.`,
      account: updatedAccount,
    };
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
      city: data.city?.trim() || 'Nalasopara',
      state: data.state?.trim() || 'Maharashtra',
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
    if (settings.serviceablePincodes.includes(clean)) return true;
    if (outlets.some((o) => o.serviceablePincodes?.includes(clean))) return true;
    // Allow Palghar / Vasai-Virar / Nalasopara / Mumbai MMR 401xxx & 400xxx pincodes when pinned on map
    if (/^40[01]\d{3}$/.test(clean)) return true;
    return false;
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
    const sType = outletData.storeType || 'grocery';
    const acceptance = outletData.orderAcceptanceConfig || getDefaultOrderAcceptanceConfig(sType);
    const newOutlet: Outlet = {
      ...outletData,
      storeType: sType,
      orderAcceptanceConfig: acceptance,
      deliveryTimePromise: outletData.deliveryTimePromise || acceptance.deliveryTimePromise,
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

  const toggleOutletStatus = (id: string, newStatus?: OutletStatus) => {
    setOutlets((prev) =>
      prev.map((o) => {
        if (o.id !== id) return o;
        const targetStatus: OutletStatus =
          newStatus || (o.status === 'active' ? 'inactive' : 'active');
        return {
          ...o,
          status: targetStatus,
          updatedAt: new Date().toISOString(),
        };
      })
    );
  };

  const updateOutletOrderAcceptanceConfig = (id: string, config: StoreOrderAcceptanceConfig) => {
    setOutlets((prev) =>
      prev.map((o) => {
        if (o.id !== id) return o;
        return {
          ...o,
          deliveryTimePromise: config.deliveryTimePromise || o.deliveryTimePromise,
          orderAcceptanceConfig: config,
          updatedAt: new Date().toISOString(),
        };
      })
    );
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

    const slugId = (cat.slug || cat.name)
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');
    if (slugId) {
      setCategories((prev) => {
        if (prev.some((c) => c.id === slugId || c.name.toLowerCase() === cat.name.trim().toLowerCase())) {
          return prev;
        }
        return [
          ...prev,
          {
            id: slugId,
            name: cat.name.trim(),
            iconName: cat.iconName || 'Package',
            description: cat.description || `${cat.name.trim()} products and accessories`,
            itemCount: 0,
          },
        ];
      });
    }
  };

  const addCategory = (data: {
    name: string;
    description?: string;
    iconName?: string;
    imageUrl?: string;
    defaultGstRate?: number;
    commissionStructure?: CategoryCommissionStructure;
    subCategories?: SubCategoryItem[];
  }): { success: boolean; message: string; category?: CategoryItem } => {
    const cleanName = data.name.trim();
    if (!cleanName) {
      return { success: false, message: 'Please enter a valid category name.' };
    }

    const slugId = cleanName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '') || `cat_${Date.now()}`;

    const existing = categories.find(
      (c) => c.id === slugId || c.name.toLowerCase() === cleanName.toLowerCase()
    );
    if (existing) {
      return {
        success: true,
        message: `Category "${existing.name}" already exists.`,
        category: existing,
      };
    }

    const lowerName = cleanName.toLowerCase();
    let determinedIcon = data.iconName;
    if (!determinedIcon) {
      if (/cloth|shirt|pant|apparel|wear|jean|trouser|kurti|kurta|suit|dress|fashion/i.test(lowerName)) {
        determinedIcon = 'Shirt';
      } else if (/cosmetic|beauty|makeup|serum|skincare|lipstick|lotion|cream|perfume/i.test(lowerName)) {
        determinedIcon = 'Sparkles';
      } else if (/men|man|gent/i.test(lowerName)) {
        determinedIcon = 'UserCheck';
      } else if (/women|woman|lady|ladies|saree/i.test(lowerName)) {
        determinedIcon = 'Heart';
      } else if (/kid|child|baby|infant|boy|girl|toy/i.test(lowerName)) {
        determinedIcon = 'Smile';
      } else if (/shoe|footwear|sandal|sneaker/i.test(lowerName)) {
        determinedIcon = 'ShoppingBag';
      } else if (/phone|mobile|cell/i.test(lowerName)) {
        determinedIcon = 'Smartphone';
      } else if (/audio|headphone|earbud|speaker/i.test(lowerName)) {
        determinedIcon = 'Headphones';
      } else if (/watch/i.test(lowerName)) {
        determinedIcon = 'Watch';
      } else if (/food|kitchen|grocery|cafe|snack/i.test(lowerName)) {
        determinedIcon = 'ShoppingBag';
      } else {
        determinedIcon = 'Layers';
      }
    }

    const defaultGst =
      data.commissionStructure?.gstRate ??
      data.defaultGstRate ??
      (/cloth|apparel|wear|shirt|kurta|saree|garment/i.test(lowerName) ? 5 : 18);

    const commStruct: CategoryCommissionStructure = data.commissionStructure || {
      type: 'percentage',
      commissionPercent: 8.0,
      fixedFee: 15,
      gstRate: defaultGst,
    };

    const newCategoryItem: CategoryItem = {
      id: slugId,
      name: cleanName,
      iconName: determinedIcon,
      imageUrl: data.imageUrl?.trim() || undefined,
      description: data.description?.trim() || `${cleanName} catalog and products`,
      itemCount: 0,
      commissionStructure: commStruct,
      subCategories: (data.subCategories || []).map((sc) => ({
        ...sc,
        parentCategoryId: slugId,
      })),
    };

    setCategories((prev) => [...prev, newCategoryItem]);

    // Also keep businessCategories in sync
    const code = `CAT-${cleanName.replace(/[^a-zA-Z0-9]/g, '').slice(0, 4).toUpperCase() || 'NEW'}-${Math.floor(10 + Math.random() * 90)}`;
    const newBusCat: BusinessCategory = {
      id: `cat_${Date.now()}`,
      name: cleanName,
      code,
      slug: slugId.replace(/_/g, '-'),
      iconName: determinedIcon || 'Package',
      description: newCategoryItem.description,
      customAttributes: [
        { id: 'attr_1', name: 'Brand Warranty Period', type: 'select', required: true, options: ['6 Months', '1 Year', '2 Years'] },
      ],
      requiresBatchNumber: false,
      requiresExpiryDate: false,
      requiresPrescription: false,
      requiresEanBarcode: true,
      defaultGstRate: commStruct.gstRate,
      returnWindowDays: 7,
      defaultCommissionPercent: commStruct.commissionPercent,
      approvalStatus: 'published',
      proposedBy: currentUser.name || 'Admin',
      approvedBy: 'Super Admin',
      isActive: true,
      itemCount: 0,
    };
    setBusinessCategories((prev) => [newBusCat, ...prev]);

    return {
      success: true,
      message: `Category "${cleanName}" created successfully!`,
      category: newCategoryItem,
    };
  };

  const updateCategory = (
    categoryId: ProductCategory,
    updates: Partial<CategoryItem>
  ): { success: boolean; message: string } => {
    setCategories((prev) =>
      prev.map((c) => {
        if (c.id !== categoryId) return c;
        return {
          ...c,
          ...updates,
          id: c.id,
        };
      })
    );
    if (updates.name || updates.commissionStructure || updates.description || updates.iconName) {
      setBusinessCategories((prev) =>
        prev.map((bc) => {
          const bcSlug = bc.slug.replace(/-/g, '_');
          if (bcSlug === categoryId || bc.name.toLowerCase() === updates.name?.toLowerCase()) {
            return {
              ...bc,
              name: updates.name || bc.name,
              description: updates.description || bc.description,
              iconName: updates.iconName || bc.iconName,
              defaultCommissionPercent:
                updates.commissionStructure?.commissionPercent ?? bc.defaultCommissionPercent,
              defaultGstRate: updates.commissionStructure?.gstRate ?? bc.defaultGstRate,
            };
          }
          return bc;
        })
      );
    }
    return { success: true, message: 'Category updated successfully.' };
  };

  const deleteCategory = (categoryId: ProductCategory): { success: boolean; message: string } => {
    const target = categories.find((c) => c.id === categoryId);
    setCategories((prev) => prev.filter((c) => c.id !== categoryId));
    if (selectedCategory === categoryId) {
      setSelectedCategory('all');
    }
    if (fullScreenCategory === categoryId) {
      setFullScreenCategory(null);
    }
    return {
      success: true,
      message: target ? `Category "${target.name}" deleted.` : 'Category deleted.',
    };
  };

  const addSubCategory = (
    parentCategoryId: ProductCategory,
    subCat: {
      name: string;
      description?: string;
      imageUrl?: string;
      iconName?: string;
      commissionPercent?: number;
    }
  ): { success: boolean; message: string; subCategory?: SubCategoryItem } => {
    const cleanName = subCat.name.trim();
    if (!cleanName) {
      return { success: false, message: 'Please enter a subcategory name.' };
    }
    const subId = `${parentCategoryId}_${cleanName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')}`;

    const newSub: SubCategoryItem = {
      id: subId,
      name: cleanName,
      parentCategoryId,
      description: subCat.description?.trim(),
      imageUrl: subCat.imageUrl?.trim() || undefined,
      iconName: subCat.iconName || 'Tag',
      commissionPercent: subCat.commissionPercent,
      itemCount: 0,
    };

    setCategories((prev) =>
      prev.map((c) => {
        if (c.id !== parentCategoryId) return c;
        const existingSubs = c.subCategories || [];
        if (existingSubs.some((s) => s.id === subId || s.name.toLowerCase() === cleanName.toLowerCase())) {
          return c;
        }
        return {
          ...c,
          subCategories: [...existingSubs, newSub],
        };
      })
    );

    return {
      success: true,
      message: `Subcategory "${cleanName}" linked successfully!`,
      subCategory: newSub,
    };
  };

  const updateSubCategory = (
    parentCategoryId: ProductCategory,
    subCatId: string,
    updates: Partial<SubCategoryItem>
  ): { success: boolean; message: string } => {
    setCategories((prev) =>
      prev.map((c) => {
        if (c.id !== parentCategoryId) return c;
        return {
          ...c,
          subCategories: (c.subCategories || []).map((s) =>
            s.id === subCatId ? { ...s, ...updates, id: s.id, parentCategoryId } : s
          ),
        };
      })
    );
    return { success: true, message: 'Subcategory updated.' };
  };

  const deleteSubCategory = (
    parentCategoryId: ProductCategory,
    subCatId: string
  ): { success: boolean; message: string } => {
    setCategories((prev) =>
      prev.map((c) => {
        if (c.id !== parentCategoryId) return c;
        return {
          ...c,
          subCategories: (c.subCategories || []).filter((s) => s.id !== subCatId),
        };
      })
    );
    if (selectedSubCategory === subCatId) {
      setSelectedSubCategory('all');
    }
    return { success: true, message: 'Subcategory removed.' };
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
        if (p.id !== payoutId && p.payoutId !== payoutId) return p;
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
    // 1. Strict validation: Must have a confirmed delivered order containing this product
    const eligibleDeliveredOrder = orders.find(
      (o) =>
        o.orderStatus === 'delivered' &&
        o.items.some((i) => i.productId === review.productId) &&
        (o.id === review.orderId ||
          (currentUser.phone && o.customer.phone === currentUser.phone) ||
          (currentUser.email && o.customer.email === currentUser.email) ||
          (currentUser.name && o.customer.name.trim().toLowerCase() === currentUser.name.trim().toLowerCase()) ||
          o.customer.id === review.customerId ||
          o.customer.id === currentUser.id)
    );

    if (!eligibleDeliveredOrder) {
      return {
        success: false,
        message: 'Review blocked: Only customers with a confirmed delivered order can submit feedback for this product.',
      };
    }

    // 2. Check for duplicate review by same customer on same delivered order
    const existing = productReviews.find(
      (r) =>
        r.productId === review.productId &&
        (r.orderId === eligibleDeliveredOrder.id ||
          (r.customerId === review.customerId && r.orderId === eligibleDeliveredOrder.id))
    );
    if (existing) {
      return { success: false, message: 'You have already submitted a review for this delivered order.' };
    }

    const newReview: ProductReview = {
      ...review,
      id: `rev_${Date.now()}`,
      orderId: eligibleDeliveredOrder.id,
      customerName: cleanCustomerName(review.customerName || currentUser.name),
      isVerifiedPurchase: true,
      moderationStatus: 'approved', // auto-approve verified customer reviews by default
      helpfulVotes: 0,
      createdAt: new Date().toISOString(),
    };

    setProductReviews((prev) => [newReview, ...prev]);
    return {
      success: true,
      message: `Thank you! Your verified review for Delivered Order #${eligibleDeliveredOrder.id} has been published.`,
    };
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

  // Rider Earning Structure, Shift Slots & Rider Payouts State
  const [riderEarningStructure, setRiderEarningStructure] = useState<RiderEarningStructure>(() => {
    try {
      const saved = localStorage.getItem('electro_rider_earning_structure_v1');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return INITIAL_RIDER_EARNING_STRUCTURE;
  });

  const [riderSlots, setRiderSlots] = useState<RiderDeliverySlot[]>(() => {
    try {
      const saved = localStorage.getItem('electro_rider_slots_v1');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return INITIAL_RIDER_SLOTS;
  });

  const [riderPayouts, setRiderPayouts] = useState<RiderPayoutRecord[]>(() => {
    try {
      const saved = localStorage.getItem('electro_rider_payouts_v1');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return INITIAL_RIDER_PAYOUTS;
  });

  useEffect(() => {
    try {
      localStorage.setItem('electro_rider_earning_structure_v1', JSON.stringify(riderEarningStructure));
    } catch (e) {}
  }, [riderEarningStructure]);

  useEffect(() => {
    try {
      localStorage.setItem('electro_rider_slots_v1', JSON.stringify(riderSlots));
    } catch (e) {}
  }, [riderSlots]);

  useEffect(() => {
    try {
      localStorage.setItem('electro_rider_payouts_v1', JSON.stringify(riderPayouts));
    } catch (e) {}
  }, [riderPayouts]);

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

    const depositedAmount = Number(payload.amount);
    const newSubmission: RiderRemittanceSubmission = {
      id: remittanceId,
      riderId: rider.id,
      riderName: rider.name,
      riderPhone: rider.phone,
      amount: depositedAmount,
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

    // Immediately deduct deposited amount from rider's cash-in-hand so remaining outstanding balance is updated in real-time
    const currentCash = rider.codCashInHand || 0;
    const remainingCash = Math.max(0, currentCash - depositedAmount);
    setRidersList((prev) =>
      prev.map((r) =>
        r.id === rider.id
          ? { ...r, codCashInHand: remainingCash }
          : r
      )
    );

    setRiderRemittances((prev) => [newSubmission, ...prev]);
    return {
      success: true,
      message: `8-Digit Cash Deposit Code (${remittanceCode}) generated for ${formatINR(depositedAmount)}. Remaining Outstanding Cash in Hand: ${formatINR(remainingCash)}. Share code with Store or Admin to verify!`,
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

    // Remittance approved and verified by store counter / cashier
    const remittedAmount = targetSubmission.amount;
    const targetRiderId = targetSubmission.riderId;

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

  const onboardNewRider = (riderData: {
    name: string;
    phone: string;
    email?: string;
    password?: string;
    vehicleNo: string;
    outletId: string;
    outletName: string;
    aadharNumber: string;
    panNumber: string;
    bankAccountNo: string;
    ifscCode: string;
    selfieUrl?: string;
  }) => {
    const newId = `rider-${Date.now().toString().slice(-4)}`;
    const newRider: InHouseRider = {
      id: newId,
      name: riderData.name,
      phone: riderData.phone,
      email: riderData.email || `${riderData.name.toLowerCase().replace(/\s+/g, '.')}@javed-electronics.in`,
      password: riderData.password || 'rider123',
      vehicleNo: riderData.vehicleNo,
      outletId: riderData.outletId,
      outletName: riderData.outletName,
      status: 'available',
      isOnline: true,
      activeDeliveriesCount: 0,
      codCashInHand: 0,
      aadharNumber: riderData.aadharNumber,
      panNumber: riderData.panNumber,
      bankAccountNo: riderData.bankAccountNo,
      ifscCode: riderData.ifscCode,
      selfieUrl: riderData.selfieUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
      earnings: {
        orderEarnings: 0,
        distanceEarnings: 0,
        slotEarnings: 0,
        incentiveEarnings: 0,
        surgeEarnings: 0,
        milestoneEarnings: 0,
        totalEarnings: 0,
      },
    };

    setRidersList((prev) => [newRider, ...prev]);

    if (riderData.email && riderData.password) {
      setAccounts((prev) => {
        const exists = prev.some((a) => a.email.toLowerCase() === riderData.email!.toLowerCase());
        if (exists) return prev;
        return [
          ...prev,
          {
            id: `acc_${Date.now()}`,
            name: riderData.name,
            email: riderData.email!,
            phone: riderData.phone,
            password: riderData.password!,
            role: 'delivery_staff' as Role,
            outletId: riderData.outletId,
            outletName: riderData.outletName,
            createdAt: new Date().toISOString(),
            isActive: true,
            twoFactorSecret: 'JVEDRIDERAUTHKEY2026',
            twoFactorEnabled: false,
          },
        ];
      });
    }

    return {
      success: true,
      message: `Rider ${riderData.name} onboarded successfully with Aadhar, PAN, bank account & live selfie!`,
      rider: newRider,
    };
  };

  const transferRiderStore = (riderId: string, targetOutletId: string, targetOutletName: string) => {
    setRidersList((prev) =>
      prev.map((r) => {
        if (r.id !== riderId) return r;
        return {
          ...r,
          outletId: targetOutletId,
          outletName: targetOutletName,
          pendingStoreTransfer: undefined,
        };
      })
    );
    return {
      success: true,
      message: `Rider transferred to ${targetOutletName}.`,
    };
  };

  const requestRiderStoreTransfer = (riderId: string, targetOutletId: string, targetOutletName: string, reason: string) => {
    setRidersList((prev) =>
      prev.map((r) => {
        if (r.id !== riderId) return r;
        return {
          ...r,
          pendingStoreTransfer: {
            targetOutletId,
            targetOutletName,
            reason,
            requestedAt: new Date().toISOString(),
            status: 'pending',
          },
        };
      })
    );
    return {
      success: true,
      message: `Transfer request to ${targetOutletName} submitted for store admin approval.`,
    };
  };

  const approveRiderStoreTransfer = (riderId: string) => {
    let targetName = '';
    setRidersList((prev) =>
      prev.map((r) => {
        if (r.id !== riderId || !r.pendingStoreTransfer) return r;
        targetName = r.pendingStoreTransfer.targetOutletName;
        return {
          ...r,
          outletId: r.pendingStoreTransfer.targetOutletId,
          outletName: r.pendingStoreTransfer.targetOutletName,
          pendingStoreTransfer: {
            ...r.pendingStoreTransfer,
            status: 'approved',
            reviewNotes: 'Store transfer approved by Store Admin.',
          },
        };
      })
    );
    return {
      success: true,
      message: `Store transfer approved! Rider is now assigned to ${targetName}.`,
    };
  };

  const rejectRiderStoreTransfer = (riderId: string, reviewNotes?: string) => {
    setRidersList((prev) =>
      prev.map((r) => {
        if (r.id !== riderId || !r.pendingStoreTransfer) return r;
        return {
          ...r,
          pendingStoreTransfer: {
            ...r.pendingStoreTransfer,
            status: 'rejected',
            reviewNotes: reviewNotes || 'Transfer request declined due to store coverage needs.',
          },
        };
      })
    );
    return {
      success: true,
      message: `Store transfer request declined.`,
    };
  };

  const toggleRiderOnlineStatus = (riderId: string, isOnline: boolean) => {
    setRidersList((prev) =>
      prev.map((r) => {
        if (r.id !== riderId) return r;
        return {
          ...r,
          isOnline,
          status: isOnline ? (r.activeDeliveriesCount > 0 ? 'on_delivery' : 'available') : 'off_duty',
        };
      })
    );
  };

  const autoAssignOrdersToRiders = () => {
    const unassignedOrders = orders.filter(
      (o) =>
        (o.orderStatus === 'confirmed' || o.orderStatus === 'processing') &&
        (!o.dispatchDetails?.riderId || o.dispatchDetails.serviceType === 'same_day_hyperlocal')
    );

    const onlineRiders = ridersList.filter((r) => r.isOnline && r.status !== 'off_duty');

    if (onlineRiders.length === 0) {
      return {
        success: false,
        message: 'No riders are currently ONLINE. Riders must switch their ID to Online to receive auto-assigned orders.',
        count: 0,
      };
    }

    if (unassignedOrders.length === 0) {
      return {
        success: true,
        message: 'All confirmed orders are currently assigned or already out for delivery.',
        count: 0,
      };
    }

    let assignedCount = 0;
    const nowIso = new Date().toISOString();

    setOrders((prevOrders) => {
      let riderIdx = 0;
      return prevOrders.map((ord) => {
        if (
          (ord.orderStatus === 'confirmed' || ord.orderStatus === 'processing') &&
          (!ord.dispatchDetails?.riderId || ord.dispatchDetails.serviceType === 'same_day_hyperlocal')
        ) {
          const selectedRider = onlineRiders[riderIdx % onlineRiders.length];
          riderIdx++;
          assignedCount++;

          const updatedDispatch: ExpressShipmentDetails = {
            fulfillmentType: 'rider',
            carrier: 'Other',
            awbNumber: `JE-LOCAL-${Date.now().toString().slice(-6)}-${assignedCount}`,
            trackingUrl: `/delivery`,
            assignedAt: nowIso,
            dispatchedAt: nowIso,
            serviceType: 'same_day_hyperlocal',
            riderId: selectedRider.id,
            riderName: selectedRider.name,
            riderPhone: selectedRider.phone,
            riderVehicleNo: selectedRider.vehicleNo,
            riderOtp: Math.floor(1000 + Math.random() * 9000).toString(),
            isCod: ord.paymentMethod === 'cod',
            codAmountToCollect: ord.paymentMethod === 'cod' ? ord.finalTotal : 0,
            codCollectedStatus: 'pending',
          };

          return {
            ...ord,
            orderStatus: 'out_for_delivery' as OrderStatus,
            dispatchDetails: updatedDispatch,
            statusHistory: [
              ...(ord.statusHistory || []),
              {
                status: 'out_for_delivery' as OrderStatus,
                timestamp: nowIso,
                note: `Order auto-assigned to rider ${selectedRider.name} (${selectedRider.vehicleNo}).`,
                updatedBy: 'Auto-Assignment Dispatch Engine',
              },
            ],
          };
        }
        return ord;
      });
    });

    setRidersList((prev) =>
      prev.map((r) => {
        if (!r.isOnline) return r;
        return {
          ...r,
          activeDeliveriesCount: r.activeDeliveriesCount + 1,
          status: 'on_delivery',
        };
      })
    );

    return {
      success: true,
      message: `Auto-assigned ${assignedCount} order(s) one-by-one to online riders!`,
      count: assignedCount,
    };
  };

  const requestOrderRto = (orderId: string, rtoPayload: OrderRtoDetails) => {
    const targetIdClean = orderId.trim().toLowerCase();
    const order = orders.find((o) => o.id === orderId || o.id.trim().toLowerCase() === targetIdClean);
    if (!order) return { success: false, message: `Order #${orderId} not found.` };

    const nowIso = new Date().toISOString();
    const reasonText =
      rtoPayload.reasonText ||
      (rtoPayload.reason === 'customer_not_answering'
        ? 'Customer Not Answering Call (Multiple Attempts Made)'
        : rtoPayload.reason === 'address_not_found'
        ? 'Customer Address Not Found / Unreachable Location'
        : rtoPayload.reason === 'wrong_address'
        ? 'Wrong Delivery Address Provided by Customer'
        : rtoPayload.reason === 'wrong_order_placed'
        ? 'Wrong Order Placed / Customer Ordered by Mistake'
        : rtoPayload.reason === 'customer_not_accepting' || rtoPayload.reason === 'customer_refused'
        ? 'Customer Refused at Doorstep / Not Accepting'
        : rtoPayload.reason === 'customer_rescheduled_cancel'
        ? 'Customer Requested Rescheduling / Cancellation'
        : String(rtoPayload.reason).replace(/_/g, ' '));

    const riderName =
      rtoPayload.requestedByRiderName ||
      rtoPayload.riderName ||
      order.deliveryStaffName ||
      'Rider';

    const cleanRtoPayload: OrderRtoDetails = {
      ...rtoPayload,
      reasonText,
      requestedAt: nowIso,
      status: 'pending_store_approval',
      riderName,
      requestedByRiderName: riderName,
      riderNotes: rtoPayload.riderNotes || rtoPayload.notes || '',
    };

    setOrders((prev) =>
      prev.map((o) => {
        if (o.id !== orderId && o.id.trim().toLowerCase() !== targetIdClean) return o;
        return {
          ...o,
          orderStatus: 'return_requested' as OrderStatus,
          rtoRequest: cleanRtoPayload,
          statusHistory: [
            ...(o.statusHistory || []),
            {
              status: 'return_requested' as OrderStatus,
              timestamp: nowIso,
              note: `Rider ${riderName} requested RTO: ${reasonText}. Notes: ${cleanRtoPayload.riderNotes || 'Customer unreachable'}. Awaiting Store Manager / Admin approval.`,
              updatedBy: riderName,
            },
          ],
        };
      })
    );

    return {
      success: true,
      message: `RTO Request submitted for #${orderId} to Store Admin. Please wait for store approval.`,
    };
  };

  const reviewOrderRto = (orderId: string, decision: 'approved' | 'rejected', reviewNotes?: string) => {
    const targetIdClean = orderId.trim().toLowerCase();
    const order = orders.find((o) => o.id === orderId || o.id.trim().toLowerCase() === targetIdClean);
    if (!order || !order.rtoRequest) return { success: false, message: 'Order or RTO request not found.' };

    const nowIso = new Date().toISOString();
    const isApproved = decision === 'approved';

    setOrders((prev) =>
      prev.map((o) => {
        if (o.id !== orderId && o.id.trim().toLowerCase() !== targetIdClean) return o;
        return {
          ...o,
          orderStatus: isApproved ? ('returned' as OrderStatus) : ('out_for_delivery' as OrderStatus),
          rtoRequest: {
            ...o.rtoRequest!,
            status: decision,
            reviewedBy: 'Store Admin',
            reviewNotes:
              reviewNotes ||
              (isApproved
                ? 'RTO Approved by Store. Item returned to store shelf inventory.'
                : 'RTO Declined by Store. Customer contacted by support, re-attempt delivery!'),
            adminNotes:
              reviewNotes ||
              (isApproved
                ? 'Package verified & accepted back into store inventory.'
                : 'Customer contacted and available at address. Re-attempt delivery immediately.'),
            reviewedAt: nowIso,
          },
          statusHistory: [
            ...(o.statusHistory || []),
            {
              status: isApproved ? ('returned' as OrderStatus) : ('out_for_delivery' as OrderStatus),
              timestamp: nowIso,
              note: isApproved
                ? `RTO Approved by Store Admin. Reason: ${o.rtoRequest?.reasonText || o.rtoRequest?.reason}. Notes: ${reviewNotes || 'Package restocked to store'}.`
                : `RTO Request REJECTED by Store Admin. Re-attempt delivery: ${reviewNotes || 'Customer available at home.'}`,
              updatedBy: 'Store Admin',
            },
          ],
        };
      })
    );

    if (isApproved) {
      // Restock items into store onHand inventory
      setProducts((prev) =>
        prev.map((p) => {
          const item = order.items.find((i) => i.productId === p.id);
          if (!item) return p;
          const qty = item.activeQuantity !== undefined ? item.activeQuantity : item.quantity;
          return {
            ...p,
            stock: {
              ...p.stock,
              onHand: p.stock.onHand + qty,
              reserved: Math.max(0, p.stock.reserved - qty),
            },
          };
        })
      );

      setStockMovements((prev) => [
        ...order.items.map((item) => {
          const qty = item.activeQuantity !== undefined ? item.activeQuantity : item.quantity;
          return {
            id: `sm-rto-${Date.now()}-${item.productId}`,
            productId: item.productId,
            productName: item.productName,
            type: 'returned' as const,
            quantity: qty,
            previousStock: 0,
            newStock: qty,
            referenceId: order.id,
            note: `RTO Restock: Returned package received back at store shelf (${reviewNotes || 'RTO Approved'})`,
            timestamp: nowIso,
            staffName: 'Store Admin',
            outletId: order.outletId,
          };
        }),
        ...prev,
      ]);
    }

    return {
      success: true,
      message: isApproved
        ? `RTO approved! Order marked as Returned and items restocked to store inventory.`
        : `RTO rejected. Rider notified via delivery popup to re-attempt doorstep handover.`,
    };
  };

  // ============================================================================
  // RIDER EARNING STRUCTURE, SLOT MANAGEMENT (CREATE/EDIT/DELETE) & PAYOUT MODULE
  // ============================================================================

  const updateRiderEarningStructure = (updates: Partial<RiderEarningStructure>, updatedBy?: string) => {
    setRiderEarningStructure((prev) => ({
      ...prev,
      ...updates,
      updatedAt: new Date().toISOString(),
      updatedBy: updatedBy || `${currentUser.name} (${currentRole.replace('_', ' ')})`,
    }));
    return {
      success: true,
      message: 'Rider Earning Structure & Rate Card updated successfully!',
    };
  };

  const recalculateAllRidersEarningsFromStructure = () => {
    const struct = riderEarningStructure;
    setRidersList((prev) =>
      prev.map((r) => {
        const ordersDone = r.completedOrdersCount || Math.max(10, Math.round((r.earnings?.orderEarnings || 600) / 50));
        const extraKm = r.totalDistanceKm || Math.max(12, Math.round((r.earnings?.distanceEarnings || 160) / 8));
        const bookedIds = r.bookedSlotIds || [];
        const enrolledSlots = riderSlots.filter(
          (s) => s.enrolledRiderIds.includes(r.id) || bookedIds.includes(s.id)
        );

        const orderPay = Math.round(ordersDone * struct.baseOrderFee);
        const distPay = Math.round(extraKm * struct.perKmRate);

        const slotPay =
          enrolledSlots.length > 0
            ? enrolledSlots.reduce((sum, s) => sum + s.slotBasePay, 0)
            : (r.completedSlotsCount || 1) * struct.defaultSlotBaseGuarantee;

        // Evaluate highest daily incentive tier achieved
        const sortedTiers = [...struct.dailyIncentiveTiers].sort((a, b) => b.minOrders - a.minOrders);
        const matchedTier = sortedTiers.find((t) => ordersDone >= t.minOrders);
        const incentivePay = matchedTier ? matchedTier.bonusAmount : 0;

        // Evaluate surge pay
        let surgeRate = 0;
        if (struct.surgeConfig.isSurgeActive) {
          if (struct.surgeConfig.activeSurgeType === 'rain_monsoon') {
            surgeRate = struct.surgeConfig.rainSurgePerOrder;
          } else if (struct.surgeConfig.activeSurgeType === 'festival_mega') {
            surgeRate = struct.surgeConfig.festivalSurgePerOrder;
          } else {
            surgeRate = struct.surgeConfig.peakHourSurgePerOrder;
          }
        }
        const surgeOrdersCount = Math.max(3, Math.round(ordersDone * 0.4));
        const surgePay = Math.round(surgeOrdersCount * surgeRate);

        // Evaluate milestone pay
        const sortedMilestones = [...struct.milestoneTiers].sort((a, b) => b.targetOrders - a.targetOrders);
        // Scale weekly orders estimate
        const weeklyOrdersEst = ordersDone * 2;
        const matchedMilestone = sortedMilestones.find((m) => weeklyOrdersEst >= m.targetOrders);
        const milestonePay = matchedMilestone ? matchedMilestone.rewardAmount : 0;

        const totalPay = orderPay + distPay + slotPay + incentivePay + surgePay + milestonePay;

        return {
          ...r,
          completedOrdersCount: ordersDone,
          totalDistanceKm: extraKm,
          earnings: {
            orderEarnings: orderPay,
            distanceEarnings: distPay,
            slotEarnings: slotPay,
            incentiveEarnings: incentivePay,
            surgeEarnings: surgePay,
            milestoneEarnings: milestonePay,
            totalEarnings: totalPay,
            orderBased: orderPay,
            distanceBased: distPay,
            slotBased: slotPay,
            incentiveBased: incentivePay,
            surgeBased: surgePay,
            milestoneBased: milestonePay,
            total: totalPay,
          },
        };
      })
    );

    return {
      success: true,
      message: `Recalculated all ${ridersList.length} riders' earnings using the active Earning Structure Rate Card!`,
    };
  };

  const updateIndividualRiderEarnings = (
    riderId: string,
    earningsUpdate: {
      slotEarnings: number;
      orderEarnings: number;
      distanceEarnings: number;
      incentiveEarnings: number;
      surgeEarnings: number;
      milestoneEarnings: number;
    }
  ) => {
    const total =
      Number(earningsUpdate.slotEarnings || 0) +
      Number(earningsUpdate.orderEarnings || 0) +
      Number(earningsUpdate.distanceEarnings || 0) +
      Number(earningsUpdate.incentiveEarnings || 0) +
      Number(earningsUpdate.surgeEarnings || 0) +
      Number(earningsUpdate.milestoneEarnings || 0);

    let riderName = 'Rider';
    setRidersList((prev) =>
      prev.map((r) => {
        if (r.id !== riderId) return r;
        riderName = r.name;
        return {
          ...r,
          earnings: {
            slotEarnings: Number(earningsUpdate.slotEarnings || 0),
            orderEarnings: Number(earningsUpdate.orderEarnings || 0),
            distanceEarnings: Number(earningsUpdate.distanceEarnings || 0),
            incentiveEarnings: Number(earningsUpdate.incentiveEarnings || 0),
            surgeEarnings: Number(earningsUpdate.surgeEarnings || 0),
            milestoneEarnings: Number(earningsUpdate.milestoneEarnings || 0),
            totalEarnings: total,
            slotBased: Number(earningsUpdate.slotEarnings || 0),
            orderBased: Number(earningsUpdate.orderEarnings || 0),
            distanceBased: Number(earningsUpdate.distanceEarnings || 0),
            incentiveBased: Number(earningsUpdate.incentiveEarnings || 0),
            surgeBased: Number(earningsUpdate.surgeEarnings || 0),
            milestoneBased: Number(earningsUpdate.milestoneEarnings || 0),
            total,
          },
        };
      })
    );

    return {
      success: true,
      message: `Updated earning breakdown for ${riderName} (New Total: ${formatINR(total)}).`,
    };
  };

  const createRiderSlot = (
    slotData: Omit<RiderDeliverySlot, 'id' | 'createdAt' | 'enrolledRiderIds'> & { enrolledRiderIds?: string[] }
  ) => {
    const newSlot: RiderDeliverySlot = {
      ...slotData,
      id: `slot-${Date.now().toString().slice(-5)}`,
      enrolledRiderIds: slotData.enrolledRiderIds || [],
      createdAt: new Date().toISOString(),
    };

    setRiderSlots((prev) => [newSlot, ...prev]);
    return {
      success: true,
      message: `Delivery Slot "${newSlot.title}" (${newSlot.startTime} - ${newSlot.endTime}) created!`,
      slot: newSlot,
    };
  };

  const updateRiderSlot = (slotId: string, updates: Partial<RiderDeliverySlot>) => {
    let slotTitle = '';
    setRiderSlots((prev) =>
      prev.map((s) => {
        if (s.id !== slotId) return s;
        slotTitle = updates.title || s.title;
        return { ...s, ...updates };
      })
    );
    return {
      success: true,
      message: `Slot "${slotTitle || slotId}" updated successfully.`,
    };
  };

  const deleteRiderSlot = (slotId: string) => {
    const target = riderSlots.find((s) => s.id === slotId);
    setRiderSlots((prev) => prev.filter((s) => s.id !== slotId));
    // Also remove from riders' bookedSlotIds
    setRidersList((prev) =>
      prev.map((r) => ({
        ...r,
        bookedSlotIds: (r.bookedSlotIds || []).filter((id) => id !== slotId),
      }))
    );
    return {
      success: true,
      message: `Slot "${target?.title || slotId}" deleted from schedule.`,
    };
  };

  const toggleRiderSlotEnrollment = (slotId: string, riderId: string) => {
    const targetSlot = riderSlots.find((s) => s.id === slotId);
    const targetRider = ridersList.find((r) => r.id === riderId);
    if (!targetSlot || !targetRider) {
      return { success: false, message: 'Slot or Rider not found.', enrolled: false };
    }

    const isCurrentlyEnrolled = targetSlot.enrolledRiderIds.includes(riderId);
    if (!isCurrentlyEnrolled && targetSlot.enrolledRiderIds.length >= targetSlot.maxRiders) {
      return {
        success: false,
        message: `Slot "${targetSlot.title}" is already at full capacity (${targetSlot.maxRiders} riders).`,
        enrolled: false,
      };
    }

    const updatedRiderIds = isCurrentlyEnrolled
      ? targetSlot.enrolledRiderIds.filter((id) => id !== riderId)
      : [...targetSlot.enrolledRiderIds, riderId];

    setRiderSlots((prev) =>
      prev.map((s) => (s.id === slotId ? { ...s, enrolledRiderIds: updatedRiderIds } : s))
    );

    // Update rider's bookedSlotIds and adjust slotEarnings live!
    setRidersList((prev) =>
      prev.map((r) => {
        if (r.id !== riderId) return r;
        const currentBooked = r.bookedSlotIds || [];
        const nextBooked = isCurrentlyEnrolled
          ? currentBooked.filter((id) => id !== slotId)
          : Array.from(new Set([...currentBooked, slotId]));

        const deltaSlotPay = isCurrentlyEnrolled ? -targetSlot.slotBasePay : targetSlot.slotBasePay;
        const newSlotEarnings = Math.max(0, (r.earnings?.slotEarnings || r.earnings?.slotBased || 0) + deltaSlotPay);
        const orderEarnings = r.earnings?.orderEarnings || r.earnings?.orderBased || 0;
        const distanceEarnings = r.earnings?.distanceEarnings || r.earnings?.distanceBased || 0;
        const incentiveEarnings = r.earnings?.incentiveEarnings || r.earnings?.incentiveBased || 0;
        const surgeEarnings = r.earnings?.surgeEarnings || r.earnings?.surgeBased || 0;
        const milestoneEarnings = r.earnings?.milestoneEarnings || r.earnings?.milestoneBased || 0;
        const newTotal =
          newSlotEarnings +
          orderEarnings +
          distanceEarnings +
          incentiveEarnings +
          surgeEarnings +
          milestoneEarnings;

        return {
          ...r,
          bookedSlotIds: nextBooked,
          earnings: {
            ...r.earnings,
            slotEarnings: newSlotEarnings,
            slotBased: newSlotEarnings,
            totalEarnings: newTotal,
            total: newTotal,
          },
        };
      })
    );

    return {
      success: true,
      message: isCurrentlyEnrolled
        ? `${targetRider.name} removed from "${targetSlot.title}".`
        : `${targetRider.name} enrolled in "${targetSlot.title}" (+${formatINR(targetSlot.slotBasePay)} slot guarantee)!`,
      enrolled: !isCurrentlyEnrolled,
    };
  };

  const createRiderPayout = (payload: {
    riderId: string;
    periodLabel: string;
    paymentMethod: 'IMPS' | 'NEFT' | 'UPI_INSTANT';
    codDeductionsOrPenalties?: number;
    notes?: string;
    utrReference?: string;
    markPaidImmediately?: boolean;
  }) => {
    const rider = ridersList.find((r) => r.id === payload.riderId);
    if (!rider) {
      return { success: false, message: 'Rider not found.' };
    }

    const slotEarnings = rider.earnings?.slotEarnings ?? rider.earnings?.slotBased ?? 0;
    const orderEarnings = rider.earnings?.orderEarnings ?? rider.earnings?.orderBased ?? 0;
    const distanceEarnings = rider.earnings?.distanceEarnings ?? rider.earnings?.distanceBased ?? 0;
    const incentiveEarnings = rider.earnings?.incentiveEarnings ?? rider.earnings?.incentiveBased ?? 0;
    const surgeEarnings = rider.earnings?.surgeEarnings ?? rider.earnings?.surgeBased ?? 0;
    const milestoneEarnings = rider.earnings?.milestoneEarnings ?? rider.earnings?.milestoneBased ?? 0;

    const grossEarnings =
      slotEarnings + orderEarnings + distanceEarnings + incentiveEarnings + surgeEarnings + milestoneEarnings;

    if (grossEarnings <= 0) {
      return {
        success: false,
        message: `${rider.name} currently has ₹0 gross earnings to disburse.`,
      };
    }

    const codDeductions = Number(payload.codDeductionsOrPenalties || 0);
    const tdsDeduction = Math.round((grossEarnings * (riderEarningStructure.tdsRatePct || 1)) / 100);
    const netPayableAmount = Math.max(0, grossEarnings - codDeductions - tdsDeduction);

    const nowIso = new Date().toISOString();
    const isPaidNow = Boolean(payload.markPaidImmediately);
    const utr =
      payload.utrReference?.trim() ||
      (isPaidNow ? `${payload.paymentMethod.slice(0, 4)}${Date.now().toString().slice(-8)}` : '');

    const newPayout: RiderPayoutRecord = {
      id: `RPAY-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      riderId: rider.id,
      riderName: rider.name,
      riderPhone: rider.phone,
      outletId: rider.outletId,
      outletName: rider.outletName,
      bankAccountNo: rider.bankAccountNo || '50100452391024',
      ifscCode: rider.ifscCode || 'HDFC0000241',
      panNumber: rider.panNumber || 'ABCDE1234F',
      periodLabel: payload.periodLabel || 'Current Settlement Cycle',
      breakdown: {
        slotEarnings,
        orderEarnings,
        distanceEarnings,
        incentiveEarnings,
        surgeEarnings,
        milestoneEarnings,
        grossEarnings,
        codDeductionsOrPenalties: codDeductions,
        tdsDeduction,
        netPayableAmount,
      },
      paymentMethod: payload.paymentMethod,
      status: isPaidNow ? 'paid' : 'pending_approval',
      utrReference: utr,
      createdAt: nowIso,
      paidAt: isPaidNow ? nowIso : undefined,
      approvedBy: isPaidNow ? `${currentUser.name} (${currentRole.replace('_', ' ')})` : undefined,
      notes:
        payload.notes ||
        (isPaidNow
          ? `Disbursed via ${payload.paymentMethod} to A/C ${rider.bankAccountNo || '50100452391024'} (UTR: ${utr})`
          : `Generated payout statement for ${rider.name}`),
    };

    setRiderPayouts((prev) => [newPayout, ...prev]);

    if (isPaidNow) {
      addLedgerEntry({
        outletId: rider.outletId || 'out_nalasopara_01',
        outletName: rider.outletName,
        participantId: rider.id,
        participantName: rider.name,
        accountDebit: 'Delivery Rider Payout Expense',
        accountCredit: 'HDFC Corporate Bank A/c',
        amount: netPayableAmount,
        referenceId: newPayout.id,
        category: 'rider_payout',
        description: `Rider Payout Disbursed to ${rider.name} (${payload.paymentMethod} UTR: ${utr})`,
      });
    }

    return {
      success: true,
      message: isPaidNow
        ? `Payout of ${formatINR(netPayableAmount)} disbursed to ${rider.name} (UTR: ${utr})!`
        : `Payout voucher ${newPayout.id} (${formatINR(netPayableAmount)}) generated for ${rider.name}.`,
      payout: newPayout,
    };
  };

  const createBatchRiderPayouts = (
    periodLabel: string,
    paymentMethod: 'IMPS' | 'NEFT' | 'UPI_INSTANT'
  ) => {
    let createdCount = 0;
    const nowIso = new Date().toISOString();
    const newRecords: RiderPayoutRecord[] = [];

    ridersList.forEach((rider) => {
      const slotEarnings = rider.earnings?.slotEarnings ?? rider.earnings?.slotBased ?? 0;
      const orderEarnings = rider.earnings?.orderEarnings ?? rider.earnings?.orderBased ?? 0;
      const distanceEarnings = rider.earnings?.distanceEarnings ?? rider.earnings?.distanceBased ?? 0;
      const incentiveEarnings = rider.earnings?.incentiveEarnings ?? rider.earnings?.incentiveBased ?? 0;
      const surgeEarnings = rider.earnings?.surgeEarnings ?? rider.earnings?.surgeBased ?? 0;
      const milestoneEarnings = rider.earnings?.milestoneEarnings ?? rider.earnings?.milestoneBased ?? 0;
      const grossEarnings =
        slotEarnings + orderEarnings + distanceEarnings + incentiveEarnings + surgeEarnings + milestoneEarnings;

      if (grossEarnings > 0) {
        createdCount++;
        const tdsDeduction = Math.round((grossEarnings * (riderEarningStructure.tdsRatePct || 1)) / 100);
        const netPayableAmount = Math.max(0, grossEarnings - tdsDeduction);

        newRecords.push({
          id: `RPAY-2026-${Math.floor(1000 + Math.random() * 9000)}-${createdCount}`,
          riderId: rider.id,
          riderName: rider.name,
          riderPhone: rider.phone,
          outletId: rider.outletId,
          outletName: rider.outletName,
          bankAccountNo: rider.bankAccountNo || '50100452391024',
          ifscCode: rider.ifscCode || 'HDFC0000241',
          panNumber: rider.panNumber || 'ABCDE1234F',
          periodLabel: periodLabel || 'Weekly Fleet Settlement Batch',
          breakdown: {
            slotEarnings,
            orderEarnings,
            distanceEarnings,
            incentiveEarnings,
            surgeEarnings,
            milestoneEarnings,
            grossEarnings,
            codDeductionsOrPenalties: 0,
            tdsDeduction,
            netPayableAmount,
          },
          paymentMethod,
          status: 'pending_approval',
          utrReference: '',
          createdAt: nowIso,
          notes: `Batch payout generated for ${periodLabel}`,
        });
      }
    });

    if (newRecords.length > 0) {
      setRiderPayouts((prev) => [...newRecords, ...prev]);
    }

    return {
      success: newRecords.length > 0,
      message:
        newRecords.length > 0
          ? `Generated ${newRecords.length} rider payout vouchers for ${periodLabel}!`
          : 'No riders had positive earnings for batch generation.',
      count: newRecords.length,
    };
  };

  const processRiderPayoutStatus = (
    payoutId: string,
    status: 'pending_approval' | 'processing' | 'paid' | 'on_hold',
    utrReference?: string,
    approvedBy?: string,
    notes?: string
  ) => {
    const target = riderPayouts.find((p) => p.id === payoutId);
    if (!target) {
      return { success: false, message: 'Payout record not found.' };
    }

    const nowIso = new Date().toISOString();
    const approverName = approvedBy || `${currentUser.name} (${currentRole.replace('_', ' ')})`;
    const finalUtr =
      utrReference?.trim() ||
      target.utrReference ||
      (status === 'paid' ? `UTR${Date.now().toString().slice(-9)}` : '');

    setRiderPayouts((prev) =>
      prev.map((p) => {
        if (p.id !== payoutId) return p;
        return {
          ...p,
          status,
          utrReference: finalUtr,
          paidAt: status === 'paid' ? nowIso : p.paidAt,
          approvedBy: status === 'paid' ? approverName : p.approvedBy,
          notes: notes || p.notes,
        };
      })
    );

    if (status === 'paid' && target.status !== 'paid') {
      addLedgerEntry({
        outletId: target.outletId || 'out_nalasopara_01',
        outletName: target.outletName,
        participantId: target.riderId,
        participantName: target.riderName,
        accountDebit: 'Delivery Rider Payout Expense',
        accountCredit: 'HDFC Corporate Bank A/c',
        amount: target.breakdown.netPayableAmount,
        referenceId: target.id,
        category: 'rider_payout',
        description: `Rider Payout Disbursed to ${target.riderName} (A/C ${target.bankAccountNo}, UTR: ${finalUtr})`,
      });
    }

    return {
      success: true,
      message:
        status === 'paid'
          ? `Payout ${payoutId} (${formatINR(target.breakdown.netPayableAmount)}) marked as PAID! Bank UTR: ${finalUtr}`
          : `Payout ${payoutId} status updated to ${status.replace('_', ' ').toUpperCase()}.`,
    };
  };

  // ============================================================================
  // MAHA SALE SLOTS, STORE PARTICIPATION & AUTO-APPROVAL ENGINE
  // ============================================================================

  const createMahaSaleSlot = (
    slotData: Omit<MahaSaleSlot, 'id' | 'createdAt' | 'createdBy' | 'participatingStoreCount' | 'participatingProductCount'>
  ) => {
    const newSlot: MahaSaleSlot = {
      ...slotData,
      id: `SLOT-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      createdAt: new Date().toISOString(),
      createdBy: currentUser.name || 'Store Admin',
      participatingStoreCount: 0,
      participatingProductCount: 0,
    };
    setMahaSaleSlots((prev) => [newSlot, ...prev]);
    return {
      success: true,
      message: `Maha Sale Slot "${newSlot.title}" created successfully! Stores can now participate.`,
      slot: newSlot,
    };
  };

  const updateMahaSaleSlot = (slotId: string, updates: Partial<MahaSaleSlot>) => {
    setMahaSaleSlots((prev) =>
      prev.map((s) => (s.id === slotId ? { ...s, ...updates } : s))
    );
    return { success: true, message: 'Maha Sale Slot updated successfully.' };
  };

  const deleteMahaSaleSlot = (slotId: string) => {
    setMahaSaleSlots((prev) => prev.filter((s) => s.id !== slotId));
    return { success: true, message: 'Maha Sale Slot deleted.' };
  };

  const participateInMahaSaleSlot = (data: {
    slotId: string;
    storeId?: string;
    storeName?: string;
    items: Array<{
      productId: string;
      discountType: 'percentage' | 'fixed_value';
      discountValue: number;
    }>;
    storeNotes?: string;
  }) => {
    const slot = mahaSaleSlots.find((s) => s.id === data.slotId) || mahaSaleSlots[0];
    if (!slot) {
      return { success: false, message: 'Maha Sale slot not found.', count: 0 };
    }

    const currentOutlet = outlets.find((o) => o.id === (data.storeId || activeOutletId)) || outlets[0];
    const liveEndTime = slot.endTime || new Date(Date.now() + 24 * 3600 * 1000).toISOString();

    const createdParticipations: MahaSaleParticipation[] = [];
    const productPriceUpdates: Record<string, { dealPrice: number; discountPct: number; participationId: string; discountType: 'percentage' | 'fixed_value'; discountValue: number }> = {};

    data.items.forEach((item) => {
      const prod = products.find((p) => p.id === item.productId);
      if (!prod) return;

      let dealPrice = prod.regularPrice;
      let discountPct = 0;

      if (item.discountType === 'percentage') {
        const pct = Math.min(90, Math.max(1, Number(item.discountValue) || 10));
        discountPct = pct;
        dealPrice = Math.max(1, Math.round(prod.regularPrice * (1 - pct / 100)));
      } else {
        const val = Math.max(1, Number(item.discountValue) || 100);
        dealPrice = Math.max(1, prod.regularPrice - val);
        discountPct = Math.min(90, Math.max(1, Math.round(((prod.regularPrice - dealPrice) / prod.regularPrice) * 100)));
      }

      const pId = `MSALE-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;
      const participation: MahaSaleParticipation = {
        id: pId,
        slotId: slot.id,
        slotTitle: slot.title,
        storeId: currentOutlet.id,
        storeName: currentOutlet.name,
        productId: prod.id,
        productName: prod.name,
        productImage: prod.images[0] || 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=800&q=80',
        category: prod.categoryId,
        regularPrice: prod.regularPrice,
        mrp: prod.mrp,
        discountType: item.discountType,
        discountValue: item.discountValue,
        requestedDiscountPct: discountPct,
        proposedDealPrice: dealPrice,
        requestedDurationHours: slot.durationHours || 24,
        storeNotes: data.storeNotes || `Participated in ${slot.title}`,
        requestedAt: new Date().toISOString(),
        isAutoApproved: true,
        status: 'store_accepted_live', // AUTO APPROVED AS REQUESTED!
        liveStartTime: new Date().toISOString(),
        liveEndTime,
        durationHours: slot.durationHours || 24,
        finalDealPrice: dealPrice,
        finalDiscountPct: discountPct,
        isJeAssuredEligible: Boolean(prod.isJeAssured),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      createdParticipations.push(participation);
      productPriceUpdates[prod.id] = {
        dealPrice,
        discountPct,
        participationId: pId,
        discountType: item.discountType,
        discountValue: item.discountValue,
      };
    });

    if (createdParticipations.length === 0) {
      return { success: false, message: 'No valid products selected.', count: 0 };
    }

    // Add participations to state
    setMahaSaleParticipations((prev) => [...createdParticipations, ...prev]);

    // Auto-approve and make products LIVE immediately!
    setProducts((prev) =>
      prev.map((prod) => {
        const update = productPriceUpdates[prod.id];
        if (!update) return prod;
        return {
          ...prod,
          dealPrice: update.dealPrice,
          isMahaSaleActive: true,
          mahaSaleEndTime: liveEndTime,
          mahaSaleDiscountPct: update.discountPct,
          mahaSaleParticipationId: update.participationId,
          mahaSaleSlotId: slot.id,
          mahaSaleDiscountType: update.discountType,
          mahaSaleDiscountValue: update.discountValue,
        };
      })
    );

    // Update slot counts
    setMahaSaleSlots((prev) =>
      prev.map((s) => {
        if (s.id !== slot.id) return s;
        return {
          ...s,
          participatingStoreCount: (s.participatingStoreCount || 0) + 1,
          participatingProductCount: (s.participatingProductCount || 0) + createdParticipations.length,
        };
      })
    );

    return {
      success: true,
      message: `🎉 ${createdParticipations.length} product(s) auto-approved and now LIVE in "${slot.title}"!`,
      count: createdParticipations.length,
    };
  };

  // ============================================================================
  // PROMOTION TYPES & SLOTS ARCHITECTURE (ADMIN & STORE WORKFLOW)
  // ============================================================================

  // Admin: Promotion Types CRUD
  const createPromotionType = (data: Omit<PromotionType, 'id' | 'createdAt'>) => {
    const newType: PromotionType = {
      ...data,
      id: `PTYPE-${Math.floor(100 + Math.random() * 900)}`,
      createdAt: new Date().toISOString(),
    };
    setPromotionTypes((prev) => [newType, ...prev]);
    return { success: true, message: `Promotion Type "${newType.name}" created!`, type: newType };
  };

  const updatePromotionType = (id: string, updates: Partial<PromotionType>) => {
    setPromotionTypes((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...updates } : t))
    );
    return { success: true, message: 'Promotion Type updated.' };
  };

  const deletePromotionType = (id: string) => {
    setPromotionTypes((prev) => prev.filter((t) => t.id !== id));
    return { success: true, message: 'Promotion Type deleted.' };
  };

  // Admin: Promotion Slots CRUD (Admin creates/edits/deletes slots)
  const createPromotionSlot = (
    data: Omit<PromotionSlot, 'id' | 'createdAt' | 'createdBy' | 'participatingProductsCount'>
  ) => {
    const newSlot: PromotionSlot = {
      ...data,
      id: `PSLOT-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      createdAt: new Date().toISOString(),
      createdBy: currentUser.name || 'Super Admin',
      participatingProductsCount: 0,
    };
    setPromotionSlots((prev) => [newSlot, ...prev]);
    return { success: true, message: `Promotion Slot "${newSlot.slotName}" created!`, slot: newSlot };
  };

  const updatePromotionSlot = (id: string, updates: Partial<PromotionSlot>) => {
    setPromotionSlots((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...updates } : s))
    );
    return { success: true, message: 'Promotion Slot updated.' };
  };

  const deletePromotionSlot = (id: string) => {
    setPromotionSlots((prev) => prev.filter((s) => s.id !== id));
    setStoreSlotProductBanners((prev) => prev.filter((b) => b.slotId !== id));
    return { success: true, message: 'Promotion Slot deleted.' };
  };

  // Store: Participation with One-by-One Product Selection & Banner Upload (Add, Edit, Delete access)
  const addStoreSlotBanner = (
    data: Omit<StoreSlotProductBanner, 'id' | 'createdAt' | 'updatedAt' | 'isActive'>
  ) => {
    const newBanner: StoreSlotProductBanner = {
      ...data,
      id: `PITEM-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setStoreSlotProductBanners((prev) => [newBanner, ...prev]);

    setPromotionSlots((prev) =>
      prev.map((s) =>
        s.id === data.slotId
          ? { ...s, participatingProductsCount: (s.participatingProductsCount || 0) + 1 }
          : s
      )
    );

    if (data.salePrice && data.salePrice > 0) {
      setProducts((prev) =>
        prev.map((p) =>
          p.id === data.productId ? { ...p, dealPrice: data.salePrice } : p
        )
      );
    }

    return {
      success: true,
      message: `🎉 Banner for "${data.productName}" added to "${data.slotName}"!`,
      banner: newBanner,
    };
  };

  const updateStoreSlotBanner = (id: string, updates: Partial<StoreSlotProductBanner>) => {
    setStoreSlotProductBanners((prev) =>
      prev.map((b) => (b.id === id ? { ...b, ...updates, updatedAt: new Date().toISOString() } : b))
    );
    return { success: true, message: 'Product banner updated successfully.' };
  };

  const deleteStoreSlotBanner = (id: string) => {
    const target = storeSlotProductBanners.find((b) => b.id === id);
    if (target) {
      setPromotionSlots((prev) =>
        prev.map((s) =>
          s.id === target.slotId
            ? { ...s, participatingProductsCount: Math.max(0, (s.participatingProductsCount || 1) - 1) }
            : s
        )
      );
    }
    setStoreSlotProductBanners((prev) => prev.filter((b) => b.id !== id));
    return { success: true, message: 'Product banner removed from slot.' };
  };

  const requestMahaSaleParticipation = (data: {
    productId: string;
    requestedDiscountPct: number;
    requestedDurationHours: number;
    storeNotes?: string;
    storeId?: string;
  }) => {
    const targetProduct = products.find((p) => p.id === data.productId);
    if (!targetProduct) {
      return { success: false, message: 'Target product not found in catalogue.' };
    }

    const currentOutlet = outlets.find((o) => o.id === (data.storeId || activeOutletId)) || outlets[0];
    const discountPct = Math.min(60, Math.max(5, Number(data.requestedDiscountPct) || 15));
    const durationHours = Math.max(1, Number(data.requestedDurationHours) || 6);
    const proposedDealPrice = Math.round(targetProduct.regularPrice * (1 - discountPct / 100));

    const newParticipation: MahaSaleParticipation = {
      id: `MSALE-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      storeId: currentOutlet.id,
      storeName: currentOutlet.name,
      productId: targetProduct.id,
      productName: targetProduct.name,
      productImage: targetProduct.images[0] || 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=800&q=80',
      category: targetProduct.categoryId,
      regularPrice: targetProduct.regularPrice,
      mrp: targetProduct.mrp,
      requestedDiscountPct: discountPct,
      proposedDealPrice,
      requestedDurationHours: durationHours,
      storeNotes: data.storeNotes?.trim() || 'Store requests Maha Sale spot to boost volume.',
      requestedAt: new Date().toISOString(),
      status: 'pending_admin_review',
      durationHours,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setMahaSaleParticipations((prev) => [newParticipation, ...prev]);

    return {
      success: true,
      message: `Maha Sale nomination for "${targetProduct.name}" submitted! Super Admin will review & suggest deal terms.`,
      participation: newParticipation,
    };
  };

  const adminSuggestMahaSaleDiscount = (
    participationId: string,
    suggestion: {
      adminSuggestedDiscountPct: number;
      adminSuggestedDurationHours: number;
      adminNotes?: string;
      reviewedBy?: string;
    }
  ) => {
    const target = mahaSaleParticipations.find((p) => p.id === participationId);
    if (!target) return { success: false, message: 'Maha sale request not found.' };

    const discountPct = Math.min(75, Math.max(5, Number(suggestion.adminSuggestedDiscountPct)));
    const durationHours = Math.max(1, Number(suggestion.adminSuggestedDurationHours));
    const adminSuggestedPrice = Math.round(target.regularPrice * (1 - discountPct / 100));
    const nowIso = new Date().toISOString();

    setMahaSaleParticipations((prev) =>
      prev.map((item) => {
        if (item.id !== participationId) return item;
        return {
          ...item,
          status: 'admin_suggested',
          adminSuggestedDiscountPct: discountPct,
          adminSuggestedPrice,
          adminSuggestedDurationHours: durationHours,
          adminNotes: suggestion.adminNotes || `Admin recommended ${discountPct}% OFF for high customer conversion.`,
          reviewedAt: nowIso,
          reviewedBy: suggestion.reviewedBy || `${currentUser.name} (Super Admin)`,
          updatedAt: nowIso,
        };
      })
    );

    return {
      success: true,
      message: `Discount suggestion of ${discountPct}% OFF (₹${adminSuggestedPrice}) sent to ${target.storeName}! Waiting for Store to Accept & Go Live.`,
    };
  };

  const adminApproveMahaSaleDirectly = (participationId: string, adminNotes?: string) => {
    const target = mahaSaleParticipations.find((p) => p.id === participationId);
    if (!target) return { success: false, message: 'Maha sale request not found.' };

    const nowIso = new Date().toISOString();
    setMahaSaleParticipations((prev) =>
      prev.map((item) => {
        if (item.id !== participationId) return item;
        return {
          ...item,
          status: 'admin_suggested',
          adminSuggestedDiscountPct: item.requestedDiscountPct,
          adminSuggestedPrice: item.proposedDealPrice,
          adminSuggestedDurationHours: item.requestedDurationHours,
          adminNotes: adminNotes || 'Approved store requested terms. Store can now Accept & Go Live.',
          reviewedAt: nowIso,
          reviewedBy: `${currentUser.name} (Super Admin)`,
          updatedAt: nowIso,
        };
      })
    );

    return {
      success: true,
      message: `Approved terms sent to ${target.storeName}! Store can now click "Accept & Go LIVE".`,
    };
  };

  const adminRejectMahaSale = (participationId: string, reason: string) => {
    const target = mahaSaleParticipations.find((p) => p.id === participationId);
    if (!target) return { success: false, message: 'Maha sale request not found.' };

    const nowIso = new Date().toISOString();
    setMahaSaleParticipations((prev) =>
      prev.map((item) => {
        if (item.id !== participationId) return item;
        return {
          ...item,
          status: 'rejected',
          adminNotes: reason || 'Not eligible for current Maha Sale flash rush.',
          reviewedAt: nowIso,
          reviewedBy: `${currentUser.name} (Super Admin)`,
          updatedAt: nowIso,
        };
      })
    );

    return {
      success: true,
      message: `Maha Sale request ${participationId} marked as Rejected.`,
    };
  };

  const storeAcceptMahaSaleAndGoLive = (participationId: string) => {
    const target = mahaSaleParticipations.find((p) => p.id === participationId);
    if (!target) return { success: false, message: 'Maha sale request not found.' };

    const finalDiscountPct = target.adminSuggestedDiscountPct ?? target.requestedDiscountPct;
    const finalDurationHours = target.adminSuggestedDurationHours ?? target.requestedDurationHours;
    const finalDealPrice = target.adminSuggestedPrice ?? target.proposedDealPrice;

    const now = Date.now();
    const liveStartTime = new Date(now).toISOString();
    const liveEndTime = new Date(now + finalDurationHours * 3600 * 1000).toISOString();

    // 1. Update participation state machine
    setMahaSaleParticipations((prev) =>
      prev.map((item) => {
        if (item.id !== participationId) return item;
        return {
          ...item,
          status: 'store_accepted_live',
          liveStartTime,
          liveEndTime,
          durationHours: finalDurationHours,
          finalDealPrice,
          finalDiscountPct,
          updatedAt: liveStartTime,
        };
      })
    );

    // 2. Update product in catalogue to go LIVE with deal price and countdown
    setProducts((prev) =>
      prev.map((prod) => {
        if (prod.id !== target.productId) return prod;
        return {
          ...prod,
          dealPrice: finalDealPrice,
          isMahaSaleActive: true,
          mahaSaleEndTime: liveEndTime,
          mahaSaleDiscountPct: finalDiscountPct,
          mahaSaleParticipationId: target.id,
        };
      })
    );

    return {
      success: true,
      message: `🚀 "${target.productName}" is NOW LIVE in Maha Sale at ₹${finalDealPrice} (${finalDiscountPct}% OFF) for ${finalDurationHours} hours! Countdown started.`,
    };
  };

  const storeDeclineAdminSuggestion = (participationId: string, reason?: string) => {
    setMahaSaleParticipations((prev) =>
      prev.map((item) => {
        if (item.id !== participationId) return item;
        return {
          ...item,
          status: 'rejected',
          storeNotes: `${item.storeNotes || ''} [Store Declined Suggestion: ${reason || 'Margin too narrow'}]`,
          updatedAt: new Date().toISOString(),
        };
      })
    );

    return {
      success: true,
      message: 'Admin discount suggestion declined. Campaign closed.',
    };
  };

  const endMahaSaleEarly = (participationId: string) => {
    const target = mahaSaleParticipations.find((p) => p.id === participationId);
    if (!target) return { success: false, message: 'Campaign not found.' };

    const nowIso = new Date().toISOString();
    setMahaSaleParticipations((prev) =>
      prev.map((item) => {
        if (item.id !== participationId) return item;
        return {
          ...item,
          status: 'expired_completed',
          liveEndTime: nowIso,
          revertedToNormal: true,
          updatedAt: nowIso,
        };
      })
    );

    // Revert product back to normal regular price
    setProducts((prev) =>
      prev.map((prod) => {
        if (prod.id !== target.productId) return prod;
        return {
          ...prod,
          dealPrice: undefined,
          isMahaSaleActive: false,
          mahaSaleEndTime: undefined,
          mahaSaleDiscountPct: undefined,
          mahaSaleParticipationId: undefined,
        };
      })
    );

    return {
      success: true,
      message: `Maha Sale ended for "${target.productName}". Product reverted to normal regular price ₹${target.regularPrice}.`,
    };
  };

  const checkAndExpireMahaSales = () => {
    const now = Date.now();

    setMahaSaleParticipations((prev) => {
      let hasExpired = false;
      const next = prev.map((item) => {
        if (item.status === 'store_accepted_live' && item.liveEndTime) {
          const endMs = new Date(item.liveEndTime).getTime();
          if (endMs <= now) {
            hasExpired = true;
            return {
              ...item,
              status: 'expired_completed' as const,
              revertedToNormal: true,
              updatedAt: new Date(now).toISOString(),
            };
          }
        }
        return item;
      });
      return hasExpired ? next : prev;
    });

    setProducts((prev) => {
      let changed = false;
      const next = prev.map((prod) => {
        if (prod.isMahaSaleActive && prod.mahaSaleEndTime) {
          const endMs = new Date(prod.mahaSaleEndTime).getTime();
          if (endMs <= now) {
            changed = true;
            return {
              ...prod,
              dealPrice: undefined,
              isMahaSaleActive: false,
              mahaSaleEndTime: undefined,
              mahaSaleDiscountPct: undefined,
              mahaSaleParticipationId: undefined,
            };
          }
        }
        return prod;
      });
      return changed ? next : prev;
    });

    return { expiredCount: 0 };
  };

  // Heartbeat interval to auto-expire completed Maha Sales every 5 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      checkAndExpireMahaSales();
    }, 5000);

    return () => clearInterval(timer);
  }, []);

  // Synchronize initial active live sales on startup with products catalogue
  useEffect(() => {
    const liveItems = mahaSaleParticipations.filter(
      (p) => p.status === 'store_accepted_live' && p.liveEndTime && new Date(p.liveEndTime).getTime() > Date.now()
    );

    if (liveItems.length > 0) {
      setProducts((prev) => {
        let changed = false;
        const next = prev.map((prod) => {
          const match = liveItems.find((li) => li.productId === prod.id);
          const expectedPrice = match
            ? match.finalDealPrice || match.adminSuggestedPrice || match.proposedDealPrice
            : undefined;
          if (match && (!prod.isMahaSaleActive || prod.dealPrice !== expectedPrice)) {
            changed = true;
            return {
              ...prod,
              dealPrice: expectedPrice,
              isMahaSaleActive: true,
              mahaSaleEndTime: match.liveEndTime,
              mahaSaleDiscountPct: match.finalDiscountPct || match.adminSuggestedDiscountPct || match.requestedDiscountPct,
              mahaSaleParticipationId: match.id,
            };
          }
          return prod;
        });
        return changed ? next : prev;
      });
    }
  }, []);

  // ============================================================================
  // JE ASSURED 4-PILLAR SOP HEALTH & STORE PROMOTION LANDING PAGE REQUESTS
  // ============================================================================
  const getProductJeAssuredHealth = (product: Product): JeAssuredHealthMetrics => {
    return computeProductJeAssuredHealth(product, jeAssuredSopConfig);
  };

  const updateJeAssuredSopConfig = (updates: Partial<JeAssuredSopConfig>) => {
    setJeAssuredSopConfig((prev) => ({
      ...prev,
      ...updates,
      pillarWeights: updates.pillarWeights
        ? { ...prev.pillarWeights, ...updates.pillarWeights }
        : prev.pillarWeights,
      sopGuidelines: updates.sopGuidelines
        ? { ...prev.sopGuidelines, ...updates.sopGuidelines }
        : prev.sopGuidelines,
    }));
    return {
      success: true,
      message: 'JE Assured SOP Eligibility rules & health score thresholds updated!',
    };
  };

  const requestJeAssuredReviewForProduct = (productId: string, storeNotes?: string) => {
    const targetProduct = products.find((p) => p.id === productId);
    if (!targetProduct) {
      return { success: false, message: 'Product not found in catalogue.' };
    }

    const currentOutlet = outlets.find((o) => o.id === activeOutletId) || outlets[0];
    const currentHealth = computeProductJeAssuredHealth(targetProduct, jeAssuredSopConfig);
    const nowIso = new Date().toISOString();

    setProducts((prev) =>
      prev.map((prod) => {
        if (prod.id !== productId) return prod;
        const updatedHealth: JeAssuredHealthMetrics = {
          ...currentHealth,
          reviewStatus: 'pending_review',
          requestedByStoreId: currentOutlet.id,
          requestedByStoreName: currentOutlet.name,
          requestedAt: nowIso,
          adminNotes:
            storeNotes?.trim() ||
            `Store requested JE Assured Badge review (Current SOP Score: ${currentHealth.roundedScore}/5).`,
        };
        return {
          ...prod,
          jeAssuredHealth: updatedHealth,
        };
      })
    );

    const statusHint =
      currentHealth.roundedScore >= 4
        ? `🎉 Congratulations! Score is ${currentHealth.roundedScore}/5 — Eligible to go live with JE Assured Badge!`
        : currentHealth.roundedScore === 3
        ? `Score is 3/5 (On Track to 4). Sent to Super Admin for JE Assured SOP review.`
        : `Score is ${currentHealth.roundedScore}/5 (Below 4 threshold). Sent to Super Admin for review & improvement guidance.`;

    return {
      success: true,
      message: `JE Assured review requested for "${targetProduct.name}". ${statusHint}`,
    };
  };

  const adminReviewJeAssuredProduct = (
    productId: string,
    payload: {
      catalogueHealth: number;
      inventoryHealth: number;
      orderHealth: number;
      feedbackReviewHealth: number;
      goLiveWithBadge?: boolean;
      adminNotes?: string;
    }
  ) => {
    const targetProduct = products.find((p) => p.id === productId);
    if (!targetProduct) {
      return { success: false, message: 'Product not found.' };
    }

    const cH = Math.min(5, Math.max(1, Math.round(payload.catalogueHealth)));
    const iH = Math.min(5, Math.max(1, Math.round(payload.inventoryHealth)));
    const oH = Math.min(5, Math.max(1, Math.round(payload.orderHealth)));
    const rH = Math.min(5, Math.max(1, Math.round(payload.feedbackReviewHealth)));

    const avg = (cH + iH + oH + rH) / 4;
    const roundedScore = Math.min(5, Math.max(1, Math.round(avg))) as 1 | 2 | 3 | 4 | 5;
    const tier = getEligibilityTierFromScore(roundedScore, jeAssuredSopConfig);
    const isEligible = tier === 'eligible_congratulations'; // 4 or 5
    const makeLive = isEligible && (payload.goLiveWithBadge ?? true);
    const nowIso = new Date().toISOString();

    setProducts((prev) =>
      prev.map((prod) => {
        if (prod.id !== productId) return prod;
        const nextHealth: JeAssuredHealthMetrics = {
          catalogueHealth: cH,
          inventoryHealth: iH,
          orderHealth: oH,
          feedbackReviewHealth: rH,
          overallScore: Number(avg.toFixed(1)),
          roundedScore,
          eligibilityTier: tier,
          reviewStatus: isEligible ? 'approved_live' : roundedScore === 3 ? 'pending_review' : 'rejected',
          isLiveWithBadge: makeLive,
          eligibleForNormalCatalogue: isEligible && jeAssuredSopConfig.allowJeAssuredInNormalCatalogue,
          eligibleForMahaSale: isEligible && jeAssuredSopConfig.allowJeAssuredInMahaSale,
          requestedByStoreId: prod.jeAssuredHealth?.requestedByStoreId || activeOutletId,
          requestedByStoreName: prod.jeAssuredHealth?.requestedByStoreName || 'Store Catalogue',
          requestedAt: prod.jeAssuredHealth?.requestedAt || nowIso,
          reviewedAt: nowIso,
          reviewedBy: `${currentUser.name} (Super Admin)`,
          adminNotes:
            payload.adminNotes?.trim() ||
            (isEligible
              ? `Congratulations! Catalogue scored ${roundedScore}/5 and is LIVE with JE Assured Badge (Normal & Maha Sale).`
              : roundedScore === 3
              ? 'Score 3/5: On Track to 4! Improve health metrics to reach 4+ and unlock JE Assured Badge.'
              : `Score ${roundedScore}/5: Not Eligible for JE Assured Badge under SOP rules.`),
        };
        return {
          ...prod,
          isJeAssured: makeLive,
          jeAssuredHealth: nextHealth,
        };
      })
    );

    if (isEligible) {
      return {
        success: true,
        message: `🎉 Congratulations! "${targetProduct.name}" achieved Score ${roundedScore}/5 (${avg.toFixed(1)}) and is now LIVE with the JE Assured Badge in Normal Catalogue & Maha Sale!`,
      };
    } else if (roundedScore === 3) {
      return {
        success: true,
        message: `"${targetProduct.name}" updated to Score 3/5 (On Track to 4). Store notified of progress toward JE Assured eligibility.`,
      };
    } else {
      return {
        success: true,
        message: `"${targetProduct.name}" scored ${roundedScore}/5 — Marked as Not Eligible for JE Assured Badge.`,
      };
    }
  };

  const toggleProductJeAssuredLive = (productId: string, makeLive: boolean) => {
    const targetProduct = products.find((p) => p.id === productId);
    if (!targetProduct) {
      return { success: false, message: 'Product not found.' };
    }

    const health = computeProductJeAssuredHealth(targetProduct, jeAssuredSopConfig);
    if (makeLive && health.roundedScore < jeAssuredSopConfig.minEligibleScore) {
      return {
        success: false,
        message: `Cannot go live with JE Assured Badge: Catalogue SOP Score is ${health.roundedScore}/5 (Requires Score 4 or 5).`,
      };
    }

    setProducts((prev) =>
      prev.map((prod) => {
        if (prod.id !== productId) return prod;
        return {
          ...prod,
          isJeAssured: makeLive,
          jeAssuredHealth: {
            ...health,
            isLiveWithBadge: makeLive,
            reviewStatus: makeLive ? 'approved_live' : health.reviewStatus,
          },
        };
      })
    );

    return {
      success: true,
      message: makeLive
        ? `🎉 "${targetProduct.name}" is now LIVE with the JE Assured Badge across Normal Catalogue & Maha Sale!`
        : `JE Assured Badge paused for "${targetProduct.name}".`,
    };
  };

  const submitStorePromotionRequest = (payload: {
    productId: string;
    salePrice: number;
    startTime: string;
    endTime: string;
    bannerImages?: string[];
    campaignHeadline?: string;
    targetPlacement?: 'top' | 'middle' | 'bottom';
    requestJeAssuredBadge?: boolean;
    storeNotes?: string;
  }) => {
    const targetProduct = products.find((p) => p.id === payload.productId);
    if (!targetProduct) {
      return { success: false, message: 'Selected product not found in catalogue.' };
    }

    const salePrice = Math.max(1, Number(payload.salePrice) || targetProduct.regularPrice);
    if (salePrice >= targetProduct.regularPrice) {
      return {
        success: false,
        message: `Sale price (₹${salePrice}) must be lower than regular price (₹${targetProduct.regularPrice}).`,
      };
    }

    const currentOutlet = outlets.find((o) => o.id === activeOutletId) || outlets[0];
    const discountPct = Math.max(
      1,
      Math.round(((targetProduct.regularPrice - salePrice) / targetProduct.regularPrice) * 100)
    );
    const health = computeProductJeAssuredHealth(targetProduct, jeAssuredSopConfig);

    // Enforce Store Banner Policy: if allowStoreBannerUpload is false, store cannot submit custom banner images 1-3 (Admin curates them)
    const sanitizedBanners = jeAssuredSopConfig.allowStoreBannerUpload
      ? (payload.bannerImages || []).map((u) => u.trim()).filter(Boolean).slice(0, 3)
      : [];

    const nowIso = new Date().toISOString();
    const newReq: StorePromotionRequest = {
      id: `SPROMO-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      storeId: currentOutlet.id,
      storeName: currentOutlet.name,
      productId: targetProduct.id,
      productName: targetProduct.name,
      productSku: targetProduct.sku,
      productImage: targetProduct.images[0] || '',
      category: targetProduct.categoryId,
      regularPrice: targetProduct.regularPrice,
      mrp: targetProduct.mrp,
      salePrice,
      discountPct,
      startTime: payload.startTime || nowIso,
      endTime: payload.endTime || new Date(Date.now() + 48 * 3600 * 1000).toISOString(),
      bannerImages: sanitizedBanners,
      campaignHeadline:
        payload.campaignHeadline?.trim() ||
        `${currentOutlet.name} Special: ${discountPct}% OFF on ${targetProduct.name}`,
      targetPlacement: payload.targetPlacement || 'middle',
      requestJeAssuredBadge: Boolean(payload.requestJeAssuredBadge),
      jeAssuredScoreAtRequest: health.roundedScore,
      storeNotes: payload.storeNotes?.trim(),
      status: 'pending_admin_review',
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    setStorePromotionRequests((prev) => [newReq, ...prev]);

    if (payload.requestJeAssuredBadge) {
      requestJeAssuredReviewForProduct(
        targetProduct.id,
        `Requested alongside Promotion & Landing Page request (${newReq.id}).`
      );
    }

    return {
      success: true,
      message: `Promotion & Landing Page request (${newReq.id}) submitted for "${targetProduct.name}" at ₹${salePrice} (${discountPct}% OFF)!`,
      request: newReq,
    };
  };

  const reviewStorePromotionRequest = (
    requestId: string,
    payload: {
      decision: 'approved_live' | 'rejected';
      bannerImages?: string[];
      salePrice?: number;
      startTime?: string;
      endTime?: string;
      approveJeAssuredBadge?: boolean;
      adminNotes?: string;
    }
  ) => {
    const req = storePromotionRequests.find((r) => r.id === requestId);
    if (!req) {
      return { success: false, message: 'Promotion request not found.' };
    }

    const nowIso = new Date().toISOString();
    const finalSalePrice = payload.salePrice || req.salePrice;
    const finalDiscountPct = Math.max(
      1,
      Math.round(((req.regularPrice - finalSalePrice) / req.regularPrice) * 100)
    );
    const finalBanners = (payload.bannerImages ?? req.bannerImages)
      .map((u) => u.trim())
      .filter(Boolean)
      .slice(0, 3);
    const finalStart = payload.startTime || req.startTime;
    const finalEnd = payload.endTime || req.endTime;

    let publishedPageId: string | undefined;

    if (payload.decision === 'approved_live') {
      // Create or update a live Promotional Landing Page for this store request
      const slug = `store-promo-${req.productId}-${req.id.toLowerCase()}`;
      const primaryBanner =
        finalBanners[0] ||
        req.productImage ||
        'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1200&q=80';

      const newPromoRes = addPromotionalPage({
        title: req.campaignHeadline,
        slug,
        basisType: 'sale',
        basisValue: req.storeId,
        description: `Exclusive store promotional deal from ${req.storeName}. Sale Price: ₹${finalSalePrice} (${finalDiscountPct}% OFF). Valid from ${new Date(finalStart).toLocaleString('en-IN')} to ${new Date(finalEnd).toLocaleString('en-IN')}.`,
        isActive: true,
        scheduleType: 'date_range',
        startDate: finalStart,
        endDate: finalEnd,
        bannerImageUrl: primaryBanner,
        bannerHeadline: req.campaignHeadline,
        bannerSubtext: `Special Deal Price ₹${finalSalePrice} (Regular ₹${req.regularPrice}) • ${req.storeName}`,
        bannerTheme: 'linear-gradient(135deg, #be123c 0%, #e11d48 50%, #f59e0b 100%)',
        badgeText: `${finalDiscountPct}% OFF PROMO`,
        promotionalTickerText: `🔥 ${req.campaignHeadline} — Live at ₹${finalSalePrice}!`,
        homepagePlacements: [req.targetPlacement],
        placementDisplayType: 'image_banner',
        placementIcon: 'Flame',
        placementText: `${req.campaignHeadline} — Claim at ₹${finalSalePrice}`,
        priority: 1,
        productSelectionMode: 'manual',
        selectedProductIds: [req.productId],
      });

      publishedPageId = newPromoRes.page?.id;

      // Update product dealPrice & JE Assured status if approved
      setProducts((prev) =>
        prev.map((prod) => {
          if (prod.id !== req.productId) return prod;
          const health = computeProductJeAssuredHealth(prod, jeAssuredSopConfig);
          const canGoAssured =
            Boolean(payload.approveJeAssuredBadge) &&
            health.roundedScore >= jeAssuredSopConfig.minEligibleScore;
          return {
            ...prod,
            dealPrice: finalSalePrice,
            dealEndsAt: finalEnd,
            isJeAssured: canGoAssured ? true : prod.isJeAssured,
            jeAssuredHealth: canGoAssured
              ? {
                  ...health,
                  isLiveWithBadge: true,
                  reviewStatus: 'approved_live',
                  reviewedAt: nowIso,
                  reviewedBy: `${currentUser.name} (Super Admin)`,
                }
              : prod.jeAssuredHealth,
          };
        })
      );
    }

    setStorePromotionRequests((prev) =>
      prev.map((item) => {
        if (item.id !== requestId) return item;
        return {
          ...item,
          salePrice: finalSalePrice,
          discountPct: finalDiscountPct,
          startTime: finalStart,
          endTime: finalEnd,
          bannerImages: finalBanners,
          status: payload.decision,
          publishedPromoPageId: publishedPageId || item.publishedPromoPageId,
          adminNotes:
            payload.adminNotes?.trim() ||
            (payload.decision === 'approved_live'
              ? 'Approved and published to Promotional Landing Pages.'
              : 'Rejected by Super Admin.'),
          reviewedAt: nowIso,
          reviewedBy: `${currentUser.name} (Super Admin)`,
          updatedAt: nowIso,
        };
      })
    );

    return {
      success: true,
      message:
        payload.decision === 'approved_live'
          ? `🚀 Store Promotion Request (${requestId}) APPROVED & published to Promotional Landing Pages at ₹${finalSalePrice}!`
          : `Store Promotion Request (${requestId}) marked as Rejected.`,
    };
  };

  // ============================================================================
  // CATEGORY-BASED PRODUCT LISTING FORMATS (ADMIN CREATE / EDIT / DELETE)
  // ============================================================================
  const getFormatForCategory = (categoryId: ProductCategory, subCategoryId?: string): CategoryListingFormat => {
    const catObj = categories.find((c) => c.id === categoryId);
    const catName = catObj?.name || String(categoryId).replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
    const subCatObj = catObj?.subCategories?.find((sc) => sc.id === subCategoryId);
    return resolveFormatForCategory(categoryId, catName, categoryFormats, subCategoryId, subCatObj?.name);
  };

  const createCategoryFormat = (
    formatData: Omit<CategoryListingFormat, 'id' | 'updatedAt'>
  ) => {
    if (!formatData.formatTitle.trim()) {
      return { success: false, message: 'Format title is required.' };
    }
    const nowIso = new Date().toISOString();
    const newFormat: CategoryListingFormat = {
      ...formatData,
      id: formatData.subCategoryId
        ? `fmt_${formatData.categoryId}_${formatData.subCategoryId}_${Date.now().toString().slice(-4)}`
        : `fmt_${formatData.categoryId}_${Date.now().toString().slice(-4)}`,
      updatedAt: nowIso,
    };

    // Ensure the category also exists in categories list if custom
    if (!categories.some((c) => c.id === formatData.categoryId)) {
      setCategories((prev) => [
        ...prev,
        {
          id: formatData.categoryId,
          name: formatData.categoryName,
          iconName: 'Package',
          description: formatData.description || `${formatData.categoryName} products`,
          itemCount: 0,
        },
      ]);
    }

    setCategoryFormats((prev) => {
      const filtered = prev.filter((f) => {
        if (formatData.subCategoryId) {
          return !(f.categoryId === formatData.categoryId && f.subCategoryId === formatData.subCategoryId);
        }
        return !(f.categoryId === formatData.categoryId && !f.subCategoryId);
      });
      return [newFormat, ...filtered];
    });

    return {
      success: true,
      message: `Category listing format "${newFormat.formatTitle}" created for ${newFormat.categoryName}${newFormat.subCategoryName ? ` (${newFormat.subCategoryName})` : ''}.`,
      format: newFormat,
    };
  };

  const updateCategoryFormat = (
    formatId: string,
    updates: Partial<CategoryListingFormat>
  ) => {
    const nowIso = new Date().toISOString();
    const existsInState = categoryFormats.some((f) => f.id === formatId || f.categoryId === updates.categoryId);

    if (existsInState) {
      setCategoryFormats((prev) =>
        prev.map((f) => {
          if (f.id === formatId || (updates.categoryId && f.categoryId === updates.categoryId)) {
            return {
              ...f,
              ...updates,
              updatedAt: nowIso,
            };
          }
          return f;
        })
      );
    } else if (updates.categoryId) {
      const base = getFormatForCategory(updates.categoryId);
      const created: CategoryListingFormat = {
        ...base,
        ...updates,
        id: formatId || `fmt_${updates.categoryId}`,
        updatedAt: nowIso,
      };
      setCategoryFormats((prev) => [created, ...prev]);
    }

    return {
      success: true,
      message: `Category listing format updated successfully.`,
    };
  };

  const deleteCategoryFormat = (formatId: string) => {
    const target = categoryFormats.find((f) => f.id === formatId || f.categoryId === formatId);
    setCategoryFormats((prev) => prev.filter((f) => f.id !== formatId && f.categoryId !== formatId));
    return {
      success: true,
      message: target
        ? `${target.categoryName} format deleted.`
        : 'Format deleted.',
    };
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
        initiateCustomerSignupOtp,
        resendCustomerSignupOtp,
        verifyCustomerSignupOtp,
        createStoreStaffAccount,
        updateStoreStaffAccount,
        deleteStoreStaffAccount,
        applyAccountSanction,
        liftAccountSanction,
        logoutUser,

        // Multi-Outlet & Marketplace
        outlets,
        activeOutletId,
        setActiveOutletId,
        activeOutlet,
        createOutlet,
        updateOutlet,
        deleteOutlet,
        toggleOutletStatus,
        updateOutletOrderAcceptanceConfig,

        ownershipModels,
        updateOwnershipModel,

        businessCategories,
        createBusinessCategory,
        updateCategoryApprovalStatus,
        addCategory,
        updateCategory,
        deleteCategory,
        addSubCategory,
        updateSubCategory,
        deleteSubCategory,
        fullScreenCategory,
        setFullScreenCategory,

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
        selectedSubCategory,
        setSelectedSubCategory,
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
        submitDeliveryCustomerFeedback,
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
        updateCoupon,
        deleteCoupon,

        // Referral Program Structure & Operations
        referralProgramConfig,
        updateReferralProgramConfig,
        referralRecords,
        awardReferralBonus,
        cancelReferralRecord,
        adjustCustomerWalletBalance,

        // JE Cash (Store Wallet)
        jeCashTransactions,
        refillJeCashBalance,
        deductJeCashBalance,

        // Promotional Landing Pages & Marketing Spaces
        promotionalPages,
        activePromotionalPage,
        setActivePromotionalPage,
        addPromotionalPage,
        updatePromotionalPage,
        deletePromotionalPage,
        togglePromotionalPageStatus,
        openPromotionalPageBySlug,

        // Chatbot AI & Knowledge Base Training
        chatbotAiSettings,
        updateChatbotAiSettings,
        addKnowledgeItem,
        updateKnowledgeItem,
        deleteKnowledgeItem,
        toggleKnowledgeItemStatus,
        resetKnowledgeBaseToDefaults,

        updateSettings,
        toggleWishlist,
        addSavedAddress,
        updateUserProfile,
        deleteSavedAddress,
        setDefaultAddress,
        redeemReferralCode,

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
        approveUpiPayment,
        rejectUpiPayment,
        updateUpiSettings,
        updatePaymentChargeSettings,
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
        onboardNewRider,
        transferRiderStore,
        requestRiderStoreTransfer,
        approveRiderStoreTransfer,
        rejectRiderStoreTransfer,
        toggleRiderOnlineStatus,
        autoAssignOrdersToRiders,
        requestOrderRto,
        reviewOrderRto,

        // Rider Earning Structure, Slot Management & Payout Module
        riderEarningStructure,
        updateRiderEarningStructure,
        recalculateAllRidersEarningsFromStructure,
        updateIndividualRiderEarnings,
        riderSlots,
        createRiderSlot,
        updateRiderSlot,
        deleteRiderSlot,
        toggleRiderSlotEnrollment,
        riderPayouts,
        createRiderPayout,
        createBatchRiderPayouts,
        processRiderPayoutStatus,

        // Category-Specific Return, Refund, Replacement & Exchange Module
        categoryReturnPolicies,
        returnExchangeRequests,
        updateCategoryReturnPolicy,
        resetCategoryReturnPolicies,
        getCategoryReturnPolicy,
        submitReturnExchangeRequest,
        updateReturnRequestStatus,
        processReturnRefund,
        dispatchReturnReplacement,

        // Maha Sale Slots & Restructured Participation Module
        mahaSaleSlots,
        createMahaSaleSlot,
        updateMahaSaleSlot,
        deleteMahaSaleSlot,
        participateInMahaSaleSlot,

        // Promotion Types, Slots & Store Banners Architecture
        promotionTypes,
        createPromotionType,
        updatePromotionType,
        deletePromotionType,
        promotionSlots,
        createPromotionSlot,
        updatePromotionSlot,
        deletePromotionSlot,
        storeSlotProductBanners,
        addStoreSlotBanner,
        updateStoreSlotBanner,
        deleteStoreSlotBanner,

        // Maha Sale Campaigns, Store Participation & Live Flash Deals
        mahaSaleParticipations,
        requestMahaSaleParticipation,
        adminSuggestMahaSaleDiscount,
        adminApproveMahaSaleDirectly,
        adminRejectMahaSale,
        storeAcceptMahaSaleAndGoLive,
        storeDeclineAdminSuggestion,
        endMahaSaleEarly,
        checkAndExpireMahaSales,

        // JE Assured Badge 4-Pillar SOP Health & Store Promotion Landing Page Requests
        jeAssuredSopConfig,
        updateJeAssuredSopConfig,
        getProductJeAssuredHealth,
        requestJeAssuredReviewForProduct,
        adminReviewJeAssuredProduct,
        toggleProductJeAssuredLive,
        storePromotionRequests,
        submitStorePromotionRequest,
        reviewStorePromotionRequest,

        // Category-Based Product Listing Formats
        categoryFormats,
        getFormatForCategory,
        createCategoryFormat,
        updateCategoryFormat,
        deleteCategoryFormat,
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
