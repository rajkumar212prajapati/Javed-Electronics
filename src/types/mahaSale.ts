export type MahaSaleStatus =
  | 'pending_admin_review'
  | 'admin_suggested'
  | 'store_accepted_live'
  | 'rejected'
  | 'expired_completed';

export type MahaSaleSlotStatus = 'active' | 'upcoming' | 'completed';

export interface MahaSaleSlot {
  id: string; // e.g. SLOT-2026-001
  title: string;
  tagline: string;
  badgeText?: string;
  bannerGradient: string;
  bannerImageUrl?: string;
  startTime: string; // ISO
  endTime: string; // ISO
  durationHours: number;
  status: MahaSaleSlotStatus;
  minDiscountPct?: number;
  discountTypeAllowed: 'both' | 'percentage' | 'fixed_value';
  participatingStoreCount?: number;
  participatingProductCount?: number;
  createdAt: string;
  createdBy: string;
}

export interface MahaSaleParticipation {
  id: string; // e.g. MSALE-2026-001
  slotId?: string;
  slotTitle?: string;
  storeId: string;
  storeName: string;
  productId: string;
  productName: string;
  productImage: string;
  category: string;
  regularPrice: number;
  mrp: number;

  // Discount configuration: Percentage or Fixed Value (₹)
  discountType?: 'percentage' | 'fixed_value';
  discountValue?: number;
  requestedDiscountPct: number;
  proposedDealPrice: number;
  requestedDurationHours: number;
  storeNotes?: string;
  requestedAt: string;

  // Auto-approved flag
  isAutoApproved?: boolean;

  // Admin's suggestion / counter (optional legacy support)
  adminSuggestedDiscountPct?: number;
  adminSuggestedPrice?: number;
  adminSuggestedDurationHours?: number;
  adminNotes?: string;
  reviewedAt?: string;
  reviewedBy?: string;

  // State machine
  status: MahaSaleStatus;

  // Live Countdown & Expiry
  liveStartTime?: string;
  liveEndTime?: string;
  durationHours: number;
  finalDealPrice?: number;
  finalDiscountPct?: number;

  revertedToNormal?: boolean;
  isJeAssuredEligible?: boolean;
  createdAt: string;
  updatedAt: string;
}

export type JeAssuredEligibilityTier =
  | 'not_eligible' // Score 1 - 2 ("1 is not eligible")
  | 'on_track' // Score 3 ("3 is on track to 4")
  | 'eligible_congratulations'; // Score 4 & 5 ("4 and 5 is congratulations catalogue is eligible to go live with JE Assured badge")

export type JeAssuredReviewStatus =
  | 'not_requested'
  | 'pending_review'
  | 'approved_live'
  | 'rejected';

export interface JeAssuredHealthMetrics {
  catalogueHealth: number; // 1 to 5
  inventoryHealth: number; // 1 to 5
  orderHealth: number; // 1 to 5
  feedbackReviewHealth: number; // 1 to 5
  overallScore: number; // 1 to 5 (rounded or 1 decimal)
  roundedScore: 1 | 2 | 3 | 4 | 5;
  eligibilityTier: JeAssuredEligibilityTier;
  reviewStatus: JeAssuredReviewStatus;
  isLiveWithBadge: boolean;
  eligibleForNormalCatalogue: boolean;
  eligibleForMahaSale: boolean;
  requestedByStoreId?: string;
  requestedByStoreName?: string;
  requestedAt?: string;
  reviewedAt?: string;
  reviewedBy?: string;
  adminNotes?: string;
}

export interface JeAssuredSopConfig {
  minEligibleScore: number; // Default 4 (4 and 5 = Eligible Congratulations)
  onTrackScore: number; // Default 3 (3 = On Track to 4)
  notEligibleMaxScore: number; // Default 2 (1 & 2 = Not Eligible)
  allowStoreBannerUpload: boolean; // Toggle whether Store can upload 1-3 banners or if restricted to Admin
  requireAllPillarsAboveTwo: boolean;
  allowJeAssuredInMahaSale: boolean;
  allowJeAssuredInNormalCatalogue: boolean;
  pillarWeights: {
    catalogueHealthWeight: number;
    inventoryHealthWeight: number;
    orderHealthWeight: number;
    feedbackReviewHealthWeight: number;
  };
  sopGuidelines: {
    catalogueRule: string;
    inventoryRule: string;
    orderRule: string;
    feedbackReviewRule: string;
  };
}

export type StorePromoRequestStatus =
  | 'pending_admin_review'
  | 'approved_live'
  | 'rejected'
  | 'expired';

export interface StorePromotionRequest {
  id: string; // e.g. SPROMO-2026-001
  storeId: string;
  storeName: string;
  productId: string;
  productName: string;
  productSku: string;
  productImage: string;
  category: string;
  regularPrice: number;
  mrp: number;
  salePrice: number;
  discountPct: number;
  startTime: string; // ISO
  endTime: string; // ISO
  bannerImages: string[]; // 1 to 3 banner images for requested product
  campaignHeadline: string;
  targetPlacement: 'top' | 'middle' | 'bottom';
  requestJeAssuredBadge: boolean;
  jeAssuredScoreAtRequest: number;
  storeNotes?: string;
  adminNotes?: string;
  status: StorePromoRequestStatus;
  publishedPromoPageId?: string;
  reviewedAt?: string;
  reviewedBy?: string;
  createdAt: string;
  updatedAt: string;
}

// ==========================================
// PROMOTION TYPES & SLOTS ARCHITECTURE
// ==========================================

export interface PromotionType {
  id: string; // e.g. PROMO-TYPE-001
  name: string; // e.g. "Festival Special", "Brand Spotlight", "Category Blitz", "Homepage Hero"
  description: string;
  iconName?: string;
  colorScheme: 'rose' | 'amber' | 'purple' | 'blue' | 'emerald' | 'indigo';
  createdAt: string;
}

export interface PromotionSlot {
  id: string; // e.g. PSLOT-2026-001
  slotName: string;
  promotionTypeId: string;
  promotionTypeName: string;
  placement: 'top' | 'middle' | 'bottom';
  bannerDimensions?: string;
  startTime: string; // ISO
  endTime: string; // ISO
  status: 'active' | 'upcoming' | 'completed';
  maxBannersAllowed: number;
  participatingProductsCount?: number;
  createdAt: string;
  createdBy: string;
}

export interface StoreSlotProductBanner {
  id: string; // e.g. PITEM-2026-001
  slotId: string;
  slotName: string;
  storeId: string;
  storeName: string;
  productId: string;
  productName: string;
  productSku: string;
  productImage: string;
  category: string;
  regularPrice: number;
  mrp: number;
  salePrice: number;
  discountPct: number;
  bannerImageUrl: string;
  additionalBanners?: string[];
  headline: string;
  subheadline?: string;
  ctaText?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
