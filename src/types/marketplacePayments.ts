import { ProductCategory, Role } from './index';

// ==========================================
// MODULE 1 & 2: DYNAMIC UPI QR & RAZORPAY
// ==========================================

export type PaymentLifecycleStatus =
  | 'payment_initiated'
  | 'awaiting_payment'
  | 'payment_submitted_for_review'
  | 'verification_pending'
  | 'payment_verified'
  | 'payment_failed'
  | 'payment_expired'
  | 'refund_pending'
  | 'refunded';

export type PaymentGatewayProvider = 'razorpay' | 'dynamic_upi_qr' | 'whatsapp_manual' | 'cod' | 'store_pickup';

export interface DynamicUpiQrSession {
  sessionId: string;
  orderId: string;
  amount: number;
  currency: 'INR';
  merchantVpa: string;
  merchantName: string;
  qrPayload: string;
  qrDataUrl?: string;
  expiresAt: string; // ISO timestamp
  status: PaymentLifecycleStatus;
  refId: string;
  priceChecksum: string; // hash of cart items + prices to detect in-flight price alterations
  createdAt: string;
}

export interface RazorpayOrderRecord {
  razorpayOrderId: string;
  appOrderId: string;
  amountInPaise: number;
  currency: 'INR';
  receipt: string;
  status: 'created' | 'attempted' | 'paid';
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  signatureVerified?: boolean;
  webhookEventsReceived: string[];
  createdAt: string;
  notes?: Record<string, string>;
}

export interface PaymentTransactionRecord {
  id: string;
  orderId: string;
  provider: PaymentGatewayProvider;
  transactionRef: string;
  amount: number;
  currency: 'INR';
  status: PaymentLifecycleStatus;
  payerName?: string;
  payerPhone?: string;
  payerVpa?: string;
  methodDetails?: string; // e.g. "GooglePay UPI", "HDFC Debit Card", "Paytm QR"
  gatewayResponse?: any;
  refundId?: string;
  refundAmount?: number;
  refundReason?: string;
  refundedAt?: string;
  createdAt: string;
  verifiedAt?: string;
  verifiedBy?: string;
}

// ==========================================
// MODULE 3: WHATSAPP PAYMENT REVIEW
// ==========================================

export type WhatsAppReviewStatus =
  | 'submitted'
  | 'under_verification'
  | 'verified'
  | 'rejected'
  | 'additional_info_required';

export interface WhatsAppPaymentSubmission {
  id: string;
  orderId: string;
  customerName: string;
  customerPhone: string;
  claimedAmount: number;
  expectedAmount: number;
  utrNumber: string;
  screenshotUrl?: string;
  reviewStatus: WhatsAppReviewStatus;
  reviewerId?: string;
  reviewerName?: string;
  reviewedAt?: string;
  decisionReason?: string;
  adminNotes?: string;
  whatsappMessageContent: string;
  createdAt: string;
}

// ==========================================
// MODULE 4: ADMIN BRANDING & THEME MANAGER
// ==========================================

export interface BrandingTheme {
  primaryColor: string; // Hex
  secondaryColor: string;
  accentColor: string;
  fontFamily: 'Plus Jakarta Sans' | 'Inter' | 'Roboto' | 'Poppins';
  borderRadius: 'rounded-md' | 'rounded-lg' | 'rounded-xl' | 'rounded-2xl';
  mode: 'light' | 'dark' | 'system';
}

export interface BrandingSettings {
  id: string;
  brandName: string;
  tagline: string;
  logoUrl: string;
  faviconUrl: string;
  supportPhone: string;
  supportWhatsApp: string;
  supportEmail: string;
  businessAddress: string;
  gstin: string;
  pan: string;
  theme: BrandingTheme;
  promotionalTicker: string;
  heroHeadline: string;
  heroSubheadline: string;
  footerAbout: string;
  socialLinks: {
    instagram?: string;
    facebook?: string;
    youtube?: string;
    twitter?: string;
  };
  businessHours: string;
  defaultCurrency: 'INR';
  defaultLanguage: 'en' | 'hi';
  version: number;
  updatedAt: string;
  updatedBy: string;
}

export interface BrandingHistoryEntry {
  id: string;
  version: number;
  settingsSnapshot: BrandingSettings;
  changedBy: string;
  changeSummary: string;
  timestamp: string;
}

// ==========================================
// MODULE 5: BUSINESS RULES & POLICY BUILDER
// ==========================================

export type RuleCategory =
  | 'orders'
  | 'delivery'
  | 'returns_cancellation'
  | 'payment_verification'
  | 'inventory_reservation'
  | 'commissions_payouts'
  | 'vendor_approval'
  | 'user_trust';

export interface BusinessRule {
  id: string;
  code: string;
  title: string;
  category: RuleCategory;
  description: string;
  parameters: Record<string, any>;
  priority: number;
  status: 'draft' | 'published' | 'archived';
  effectiveFrom: string;
  effectiveTo?: string;
  version: string;
  requiresElevatedPermission: boolean;
  lastUpdatedBy: string;
  lastUpdatedAt: string;
}

export interface BusinessRuleHistory {
  id: string;
  ruleId: string;
  version: string;
  parametersSnapshot: Record<string, any>;
  changeReason: string;
  changedBy: string;
  timestamp: string;
}

// ==========================================
// MODULE 6: DOCUMENT CENTRE
// ==========================================

export type DocumentCategory =
  | 'gst_certificate'
  | 'pan_card'
  | 'business_registration'
  | 'identity_proof'
  | 'bank_mandate'
  | 'shop_address_proof'
  | 'vendor_agreement'
  | 'franchise_agreement'
  | 'rider_onboarding'
  | 'product_compliance'
  | 'tax_invoice'
  | 'payment_proof';

export type DocumentVerificationStatus = 'pending' | 'verified' | 'rejected' | 'resubmission_requested' | 'expired';

export interface PlatformDocument {
  id: string;
  documentNumber: string;
  title: string;
  category: DocumentCategory;
  ownerType: 'shop' | 'outlet' | 'vendor' | 'supplier' | 'rider' | 'customer';
  ownerId: string;
  ownerName: string;
  linkedOrderId?: string;
  fileUrl: string;
  fileName: string;
  fileSizeBytes: number;
  mimeType: string;
  isPrivate: boolean;
  issueDate?: string;
  expiryDate?: string;
  status: DocumentVerificationStatus;
  reviewedBy?: string;
  reviewedAt?: string;
  rejectionReason?: string;
  uploadedAt: string;
}

// ==========================================
// MODULE 7: PRODUCT ORDER COUNT & SOCIAL PROOF
// ==========================================

export interface ProductOrderMetrics {
  productId: string;
  totalCompletedOrders: number;
  recentOrdersLast7Days: number;
  totalVerifiedRatings: number;
  averageRating: number;
  popularityRank: number; // 1 = #1 Best Seller
  isDisplayEnabled: boolean;
  lastRefreshedAt: string;
}

// ==========================================
// MODULE 8: VERIFIED REVIEWS & RATINGS
// ==========================================

export type ReviewModerationStatus = 'pending' | 'approved' | 'rejected' | 'flagged';

export interface ProductReview {
  id: string;
  productId: string;
  orderId: string;
  customerName: string;
  customerId: string;
  customerCity?: string;
  rating: number; // 1 to 5
  title?: string;
  comment: string;
  images: string[];
  isVerifiedPurchase: boolean;
  moderationStatus: ReviewModerationStatus;
  moderatedBy?: string;
  moderatedAt?: string;
  moderationNotes?: string;
  helpfulVotes: number;
  shopReply?: {
    text: string;
    repliedBy: string;
    repliedAt: string;
  };
  createdAt: string;
}

// ==========================================
// MODULE 9: A–D USER TRUST SEGMENTATION
// ==========================================

export type TrustSegment = 'A' | 'B' | 'C' | 'D';

export type FraudInvestigationStatus =
  | 'no_known_issue'
  | 'review_required'
  | 'under_investigation'
  | 'substantiated_violation'
  | 'cleared'
  | 'appealed';

export interface TrustScoreBreakdown {
  fulfillmentReliability: number; // 0 - 100
  disputeRateScore: number; // 0 - 100
  cancellationPatternScore: number; // 0 - 100
  documentVerificationScore: number; // 0 - 100
  accountLongevityScore: number; // 0 - 100
  overallScore: number; // Weighted composite 0 - 100
}

export interface TrustProfile {
  id: string;
  userId: string;
  userName: string;
  userRole: Role;
  linkedShopId?: string;
  segment: TrustSegment;
  fraudStatus: FraudInvestigationStatus;
  scoreBreakdown: TrustScoreBreakdown;
  segmentReason: string;
  autoRestrictionsApplied: string[];
  activeAppealsCount: number;
  lastReviewedAt: string;
  lastReviewedBy: string;
  nextAuditDate: string;
}

export interface TrustAppeal {
  id: string;
  trustProfileId: string;
  userId: string;
  userName: string;
  userRole: Role;
  fromSegment: TrustSegment;
  appealReason: string;
  evidenceNotes: string;
  evidenceDocUrls?: string[];
  status: 'pending' | 'under_review' | 'approved_reinstated' | 'rejected';
  reviewedBy?: string;
  reviewedAt?: string;
  resolutionNote?: string;
  createdAt: string;
}

// ==========================================
// MODULE 10: SHOP & OUTLET PERFORMANCE
// ==========================================

export interface ShopOutletPerformanceMetric {
  outletId: string;
  outletName: string;
  outletCode: string;
  ownershipModel: string;
  activeListingCount: number;
  totalCompletedOrders: number;
  averageRating: number;
  totalReviewsCount: number;
  fulfillmentRatePercent: number; // e.g. 98.4%
  cancellationRatePercent: number; // e.g. 1.2%
  returnRatePercent: number; // e.g. 0.8%
  trustSegment: TrustSegment;
  verificationStatus: 'verified' | 'provisional' | 'under_audit';
  grossSalesMonthToDate: number;
  platformCommissionEarned: number;
  pendingSettlementBalance: number;
  lastSettledAt: string;
}
