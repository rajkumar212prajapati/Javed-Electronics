import {
  MahaSaleParticipation,
  MahaSaleSlot,
  PromotionType,
  PromotionSlot,
  StoreSlotProductBanner,
  JeAssuredSopConfig,
  JeAssuredHealthMetrics,
  JeAssuredEligibilityTier,
  StorePromotionRequest,
  Product,
} from '../types';

export const INITIAL_MAHA_SALE_SLOTS: MahaSaleSlot[] = [
  {
    id: 'SLOT-2026-001',
    title: 'Festive Dhamaka Mega Slot',
    tagline: 'Exclusive Deals on Audio, Smartphones & Chargers',
    badgeText: 'FESTIVE RUSH',
    bannerGradient: 'from-rose-600 via-rose-700 to-amber-600',
    startTime: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
    endTime: new Date(Date.now() + 20 * 3600 * 1000).toISOString(), // 20 hours remaining
    durationHours: 24,
    status: 'active',
    minDiscountPct: 10,
    discountTypeAllowed: 'both',
    participatingStoreCount: 1,
    participatingProductCount: 2,
    createdAt: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
    createdBy: 'Super Admin',
  },
  {
    id: 'SLOT-2026-002',
    title: 'Midnight Flash Blitz Slot',
    tagline: 'Lightning Fast Price Drops for High-Demand Gadgets',
    badgeText: 'FLASH BLITZ',
    bannerGradient: 'from-purple-700 via-indigo-700 to-rose-600',
    startTime: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    endTime: new Date(Date.now() + 10 * 3600 * 1000).toISOString(), // 10 hours remaining
    durationHours: 12,
    status: 'active',
    minDiscountPct: 15,
    discountTypeAllowed: 'both',
    participatingStoreCount: 1,
    participatingProductCount: 1,
    createdAt: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
    createdBy: 'Super Admin',
  },
  {
    id: 'SLOT-2026-003',
    title: 'Weekend Super Electronics Bonanza',
    tagline: 'Grand Storewide Discounts Across All Outlets',
    badgeText: 'UPCOMING',
    bannerGradient: 'from-blue-700 via-cyan-600 to-indigo-700',
    startTime: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
    endTime: new Date(Date.now() + 72 * 3600 * 1000).toISOString(),
    durationHours: 48,
    status: 'upcoming',
    minDiscountPct: 10,
    discountTypeAllowed: 'both',
    participatingStoreCount: 0,
    participatingProductCount: 0,
    createdAt: new Date(Date.now() - 1 * 3600 * 1000).toISOString(),
    createdBy: 'Super Admin',
  },
];

export const INITIAL_JE_ASSURED_SOP_CONFIG: JeAssuredSopConfig = {
  minEligibleScore: 4, // 4 & 5 = Congratulations! Eligible to go live with JE Assured Badge
  onTrackScore: 3, // 3 = On Track to 4
  notEligibleMaxScore: 2, // 1 & 2 = Not Eligible
  allowStoreBannerUpload: false, // Store can't submit banner image 1 to 3 by default (Admin curates Banner 1-3, toggleable)
  requireAllPillarsAboveTwo: true,
  allowJeAssuredInMahaSale: true,
  allowJeAssuredInNormalCatalogue: true,
  pillarWeights: {
    catalogueHealthWeight: 25,
    inventoryHealthWeight: 25,
    orderHealthWeight: 25,
    feedbackReviewHealthWeight: 25,
  },
  sopGuidelines: {
    catalogueRule: 'Complete title, HSN/GST rate, 2+ high-res images, 4+ technical specs & brand warranty.',
    inventoryRule: 'Available stock above minimum buffer level with zero stockout breaches.',
    orderRule: '<4 hour SLA dispatch compliance, >95% order fulfillment & <3% cancellation/RTO.',
    feedbackReviewRule: '4.0+ average customer rating, verified buyer reviews & low defect return rate.',
  },
};

export function getEligibilityTierFromScore(
  roundedScore: number,
  sopConfig: JeAssuredSopConfig = INITIAL_JE_ASSURED_SOP_CONFIG
): JeAssuredEligibilityTier {
  if (roundedScore >= sopConfig.minEligibleScore) {
    return 'eligible_congratulations'; // 4 and 5
  }
  if (roundedScore === sopConfig.onTrackScore) {
    return 'on_track'; // 3
  }
  return 'not_eligible'; // 1 and 2
}

export function computeProductJeAssuredHealth(
  product: Product,
  sopConfig: JeAssuredSopConfig = INITIAL_JE_ASSURED_SOP_CONFIG
): JeAssuredHealthMetrics {
  // If product already has custom/reviewed jeAssuredHealth, recalculate tier from its 4 pillar scores
  if (product.jeAssuredHealth) {
    const existing = product.jeAssuredHealth;
    const avg =
      (existing.catalogueHealth +
        existing.inventoryHealth +
        existing.orderHealth +
        existing.feedbackReviewHealth) /
      4;
    const clampedRound = Math.min(5, Math.max(1, Math.round(avg))) as 1 | 2 | 3 | 4 | 5;
    const tier = getEligibilityTierFromScore(clampedRound, sopConfig);
    const isEligible = tier === 'eligible_congratulations';
    return {
      ...existing,
      overallScore: Number(avg.toFixed(1)),
      roundedScore: clampedRound,
      eligibilityTier: tier,
      isLiveWithBadge: isEligible && existing.isLiveWithBadge,
      eligibleForNormalCatalogue: isEligible && sopConfig.allowJeAssuredInNormalCatalogue,
      eligibleForMahaSale: isEligible && sopConfig.allowJeAssuredInMahaSale,
    };
  }

  // Deterministic 1-5 pillar calculation from product data (with realistic demo distribution for prod-001..prod-006)
  let catScore = 4;
  let invScore = 4;
  let ordScore = 4;
  let revScore = 4;

  const specCount = Object.keys(product.specifications || {}).length;
  const imgCount = (product.images || []).length;
  const availStock = (product.stock?.onHand || 0) - (product.stock?.reserved || 0);
  const minStock = product.stock?.minStockLevel || 3;

  if (product.id === 'prod-001') {
    // Score 5/5 -> Eligible Congratulations!
    catScore = 5;
    invScore = 5;
    ordScore = 5;
    revScore = 5;
  } else if (product.id === 'prod-002') {
    // Score 4.5 -> 5/5 or 4/5 -> Eligible Congratulations!
    catScore = 5;
    invScore = 4;
    ordScore = 4;
    revScore = 5;
  } else if (product.id === 'prod-003') {
    // Score 4/5 -> Eligible Congratulations!
    catScore = 4;
    invScore = 4;
    ordScore = 4;
    revScore = 5;
  } else if (product.id === 'prod-004') {
    // Score 3/5 -> On Track to 4!
    catScore = 3;
    invScore = 3;
    ordScore = 3;
    revScore = 3;
  } else if (product.id === 'prod-005') {
    // Score 1/5 -> Not Eligible!
    catScore = 1;
    invScore = 1;
    ordScore = 2;
    revScore = 1;
  } else {
    catScore = specCount >= 4 && imgCount >= 2 ? 5 : specCount >= 2 ? 3 : 1;
    invScore = availStock >= minStock * 2 ? 5 : availStock > minStock ? 4 : availStock > 0 ? 3 : 1;
    ordScore = product.isBestSeller || product.isFeatured ? 5 : product.isTrending ? 4 : 3;
    revScore = product.rating >= 4.7 ? 5 : product.rating >= 4.3 ? 4 : product.rating >= 3.8 ? 3 : 1;
  }

  const avg = (catScore + invScore + ordScore + revScore) / 4;
  const roundedScore = Math.min(5, Math.max(1, Math.round(avg))) as 1 | 2 | 3 | 4 | 5;
  const tier = getEligibilityTierFromScore(roundedScore, sopConfig);
  const isEligible = tier === 'eligible_congratulations';

  return {
    catalogueHealth: catScore,
    inventoryHealth: invScore,
    orderHealth: ordScore,
    feedbackReviewHealth: revScore,
    overallScore: Number(avg.toFixed(1)),
    roundedScore,
    eligibilityTier: tier,
    reviewStatus: isEligible ? 'approved_live' : product.id === 'prod-004' ? 'pending_review' : 'not_requested',
    isLiveWithBadge: isEligible,
    eligibleForNormalCatalogue: isEligible && sopConfig.allowJeAssuredInNormalCatalogue,
    eligibleForMahaSale: isEligible && sopConfig.allowJeAssuredInMahaSale,
    requestedByStoreId: 'out_nalasopara_01',
    requestedByStoreName: 'Javed Electronics — Nalasopara East Flagship',
    requestedAt: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
    reviewedAt: isEligible ? new Date(Date.now() - 1 * 3600 * 1000).toISOString() : undefined,
    reviewedBy: isEligible ? 'Super Admin (SOP Auto-Verified)' : undefined,
    adminNotes: isEligible
      ? 'Congratulations! Catalogue achieved 4+ SOP Health across Catalogue, Inventory, Order & Review metrics. Approved for JE Assured Badge in Normal Catalogue & Maha Sale.'
      : roundedScore === 3
      ? 'Score 3/5: On track to reach 4! Improve specification depth and stock buffer to unlock JE Assured Badge.'
      : 'Score 1/5: Not Eligible. Catalogue and inventory health below minimum SOP threshold.',
  };
}

export const INITIAL_STORE_PROMOTION_REQUESTS: StorePromotionRequest[] = [
  {
    id: 'SPROMO-2026-001',
    storeId: 'out_nalasopara_01',
    storeName: 'Javed Electronics — Nalasopara East Flagship',
    productId: 'prod-001',
    productName: 'Redmi Note 13 Pro 5G (8GB RAM, 256GB)',
    productSku: 'JE-MB-RN13P',
    productImage: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=800&q=80',
    category: 'smartphones',
    regularPrice: 24999,
    mrp: 28999,
    salePrice: 21999,
    discountPct: 12,
    startTime: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    endTime: new Date(Date.now() + 48 * 3600 * 1000).toISOString(),
    bannerImages: [
      'https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1200&q=80',
    ],
    campaignHeadline: 'Nalasopara Flagship 5G Smartphone Promo — Redmi Note 13 Pro',
    targetPlacement: 'middle',
    requestJeAssuredBadge: true,
    jeAssuredScoreAtRequest: 5,
    storeNotes: 'Store requested promotion landing page with ₹21,999 sale price & JE Assured badge. Admin curates Banner 1 to 3.',
    adminNotes: 'Approved! Score 5/5 JE Assured verified. Landing page banner 1-3 configured by Admin.',
    status: 'approved_live',
    reviewedAt: new Date(Date.now() - 1 * 3600 * 1000).toISOString(),
    reviewedBy: 'Super Admin',
    createdAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 3600 * 1000).toISOString(),
  },
  {
    id: 'SPROMO-2026-002',
    storeId: 'out_nalasopara_01',
    storeName: 'Javed Electronics — Nalasopara East Flagship',
    productId: 'prod-004',
    productName: 'Noise ColorFit Pulse 3 AMOLED Smartwatch',
    productSku: 'JE-SW-NOISE-P3',
    productImage: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80',
    category: 'smartwatches',
    regularPrice: 1799,
    mrp: 4999,
    salePrice: 1449,
    discountPct: 19,
    startTime: new Date(Date.now() + 1 * 3600 * 1000).toISOString(),
    endTime: new Date(Date.now() + 72 * 3600 * 1000).toISOString(),
    bannerImages: [],
    campaignHeadline: 'Weekend Fitness Smartwatch Special — Noise Pulse 3',
    targetPlacement: 'top',
    requestJeAssuredBadge: true,
    jeAssuredScoreAtRequest: 3,
    storeNotes: 'Requesting weekend promotional landing page and JE Assured badge review for Smartwatch catalogue.',
    status: 'pending_admin_review',
    createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
  },
];

export const INITIAL_MAHA_SALE_PARTICIPATIONS: MahaSaleParticipation[] = [
  {
    id: 'MSALE-2026-001',
    storeId: 'out_nalasopara_01',
    storeName: 'Javed Electronics — Nalasopara East Flagship',
    productId: 'prod-002',
    productName: 'boAt Airdopes 141 ANC True Wireless Earbuds',
    productImage: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=800&q=80',
    category: 'audio',
    regularPrice: 1499,
    mrp: 3990,
    requestedDiscountPct: 20,
    proposedDealPrice: 1199,
    requestedDurationHours: 6,
    storeNotes: 'High inventory in store. Ready for flash volume rush.',
    requestedAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    adminSuggestedDiscountPct: 27,
    adminSuggestedPrice: 1099,
    adminSuggestedDurationHours: 6,
    adminNotes: 'Approved with competitive ₹1,099 flash deal price. Recommended for Maha Sale front banner.',
    reviewedAt: new Date(Date.now() - 1.5 * 3600 * 1000).toISOString(),
    reviewedBy: 'Super Admin',
    status: 'store_accepted_live',
    liveStartTime: new Date(Date.now() - 1.5 * 3600 * 1000).toISOString(),
    liveEndTime: new Date(Date.now() + 4.5 * 3600 * 1000).toISOString(), // 4.5 hours remaining!
    durationHours: 6,
    finalDealPrice: 1099,
    finalDiscountPct: 27,
    isJeAssuredEligible: true,
    createdAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1.5 * 3600 * 1000).toISOString(),
  },
  {
    id: 'MSALE-2026-002',
    storeId: 'out_nalasopara_01',
    storeName: 'Javed Electronics — Nalasopara East Flagship',
    productId: 'prod-003',
    productName: 'Anker PowerPort III 65W GaN Fast Wall Charger',
    productImage: 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=800&q=80',
    category: 'chargers_cables',
    regularPrice: 2499,
    mrp: 3499,
    requestedDiscountPct: 20,
    proposedDealPrice: 1999,
    requestedDurationHours: 8,
    storeNotes: 'Fast-moving GaN charger in Nalasopara East Flagship. Ready for flash rush.',
    requestedAt: new Date(Date.now() - 1.8 * 3600 * 1000).toISOString(),
    adminSuggestedDiscountPct: 28,
    adminSuggestedPrice: 1799,
    adminSuggestedDurationHours: 8,
    adminNotes: 'Approved at ₹1,799 (28% OFF) for 8-hour Maha Sale spotlight.',
    reviewedAt: new Date(Date.now() - 1 * 3600 * 1000).toISOString(),
    reviewedBy: 'Super Admin',
    status: 'store_accepted_live',
    liveStartTime: new Date(Date.now() - 1 * 3600 * 1000).toISOString(),
    liveEndTime: new Date(Date.now() + 7 * 3600 * 1000).toISOString(), // 7 hours remaining!
    durationHours: 8,
    finalDealPrice: 1799,
    finalDiscountPct: 28,
    isJeAssuredEligible: true,
    createdAt: new Date(Date.now() - 1.8 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 3600 * 1000).toISOString(),
  },
  {
    id: 'MSALE-2026-003',
    storeId: 'out_nalasopara_01',
    storeName: 'Javed Electronics — Nalasopara East Flagship',
    productId: 'prod-001',
    productName: 'Redmi Note 13 Pro 5G (8GB RAM, 256GB)',
    productImage: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=800&q=80',
    category: 'smartphones',
    regularPrice: 24999,
    mrp: 28999,
    requestedDiscountPct: 10,
    proposedDealPrice: 22499,
    requestedDurationHours: 12,
    storeNotes: 'Store has 14 units in stock. Customer footfall expected this evening.',
    requestedAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    adminSuggestedDiscountPct: 16,
    adminSuggestedPrice: 20999,
    adminSuggestedDurationHours: 8,
    adminNotes: 'Super Admin suggestion: Cut to ₹20,999 (16% OFF) for an 8-hour explosive evening flash sale.',
    reviewedAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    reviewedBy: 'Super Admin',
    status: 'admin_suggested',
    durationHours: 8,
    isJeAssuredEligible: true,
    createdAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
  },
  {
    id: 'MSALE-2026-004',
    storeId: 'out_nalasopara_01',
    storeName: 'Javed Electronics — Nalasopara East Flagship',
    productId: 'prod-004',
    productName: 'Noise ColorFit Pulse 3 AMOLED Smartwatch',
    productImage: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80',
    category: 'smartwatches',
    regularPrice: 1799,
    mrp: 4999,
    requestedDiscountPct: 22,
    proposedDealPrice: 1399,
    requestedDurationHours: 24,
    storeNotes: 'Requesting weekend Maha Sale slot for smart fitness tracker.',
    requestedAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    status: 'pending_admin_review',
    durationHours: 24,
    isJeAssuredEligible: false,
    createdAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
  },
];

export const INITIAL_PROMOTION_TYPES: PromotionType[] = [
  {
    id: 'PTYPE-001',
    name: 'Festival Special Sale',
    description: 'Diwali, Eid, New Year & festive mega sales with special celebration discounts',
    iconName: 'Flame',
    colorScheme: 'rose',
    createdAt: new Date(Date.now() - 7 * 86400 * 1000).toISOString(),
  },
  {
    id: 'PTYPE-002',
    name: 'Brand Spotlight Blitz',
    description: 'Official brand partnership showcase featuring boAt, Apple, Redmi, Samsung',
    iconName: 'Sparkles',
    colorScheme: 'amber',
    createdAt: new Date(Date.now() - 7 * 86400 * 1000).toISOString(),
  },
  {
    id: 'PTYPE-003',
    name: 'Category Blitz',
    description: 'Targeted focus on Audio, Smartphones, Chargers & Wearables',
    iconName: 'Layers',
    colorScheme: 'purple',
    createdAt: new Date(Date.now() - 7 * 86400 * 1000).toISOString(),
  },
  {
    id: 'PTYPE-004',
    name: 'Homepage Hero Banner',
    description: 'High-impact carousel placement at the very top of the storefront',
    iconName: 'Zap',
    colorScheme: 'blue',
    createdAt: new Date(Date.now() - 7 * 86400 * 1000).toISOString(),
  },
  {
    id: 'PTYPE-005',
    name: 'Weekend Super Rush',
    description: 'Lightning 24-48 hr weekend price drop slot across Lucknow branches',
    iconName: 'Clock',
    colorScheme: 'emerald',
    createdAt: new Date(Date.now() - 7 * 86400 * 1000).toISOString(),
  },
];

export const INITIAL_PROMOTION_SLOTS: PromotionSlot[] = [
  {
    id: 'PSLOT-2026-001',
    slotName: 'Homepage Prime Top Hero Slot',
    promotionTypeId: 'PTYPE-004',
    promotionTypeName: 'Homepage Hero Banner',
    placement: 'top',
    bannerDimensions: '1920x600 (Desktop) / 800x450 (Mobile)',
    startTime: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
    endTime: new Date(Date.now() + 6 * 86400 * 1000).toISOString(),
    status: 'active',
    maxBannersAllowed: 5,
    participatingProductsCount: 1,
    createdAt: new Date(Date.now() - 2 * 86400 * 1000).toISOString(),
    createdBy: 'Super Admin',
  },
  {
    id: 'PSLOT-2026-002',
    slotName: 'Mid-Page Festive Audio & Gadget Spotlight',
    promotionTypeId: 'PTYPE-001',
    promotionTypeName: 'Festival Special Sale',
    placement: 'middle',
    bannerDimensions: '1200x500 (Desktop) / 600x350 (Mobile)',
    startTime: new Date(Date.now() - 12 * 3600 * 1000).toISOString(),
    endTime: new Date(Date.now() + 4 * 86400 * 1000).toISOString(),
    status: 'active',
    maxBannersAllowed: 4,
    participatingProductsCount: 1,
    createdAt: new Date(Date.now() - 2 * 86400 * 1000).toISOString(),
    createdBy: 'Super Admin',
  },
  {
    id: 'PSLOT-2026-003',
    slotName: 'Bottom Brand Showcase Slot',
    promotionTypeId: 'PTYPE-002',
    promotionTypeName: 'Brand Spotlight Blitz',
    placement: 'bottom',
    bannerDimensions: '1200x400 (Desktop) / 600x300 (Mobile)',
    startTime: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
    endTime: new Date(Date.now() + 8 * 86400 * 1000).toISOString(),
    status: 'upcoming',
    maxBannersAllowed: 3,
    participatingProductsCount: 0,
    createdAt: new Date(Date.now() - 1 * 86400 * 1000).toISOString(),
    createdBy: 'Super Admin',
  },
];

export const INITIAL_STORE_SLOT_BANNERS: StoreSlotProductBanner[] = [
  {
    id: 'PITEM-2026-001',
    slotId: 'PSLOT-2026-001',
    slotName: 'Homepage Prime Top Hero Slot',
    storeId: 'out_nalasopara_01',
    storeName: 'Javed Electronics — Nalasopara East Flagship',
    productId: 'prod-002',
    productName: 'boAt Airdopes 141 ANC True Wireless Earbuds',
    productSku: 'SKU-BOAT-141',
    productImage: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=800&q=80',
    category: 'audio',
    regularPrice: 1499,
    mrp: 3990,
    salePrice: 1099,
    discountPct: 27,
    bannerImageUrl: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=1200&q=80',
    headline: 'Mega Festive Audio Drop — boAt Airdopes 141 ANC at ₹1,099',
    subheadline: '32dB Active Noise Cancellation & 42 Hours Beast Playtime',
    ctaText: 'Claim Festive Deal',
    isActive: true,
    createdAt: new Date(Date.now() - 20 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 20 * 3600 * 1000).toISOString(),
  },
  {
    id: 'PITEM-2026-002',
    slotId: 'PSLOT-2026-002',
    slotName: 'Mid-Page Festive Audio & Gadget Spotlight',
    storeId: 'out_nalasopara_01',
    storeName: 'Javed Electronics — Nalasopara East Flagship',
    productId: 'prod-001',
    productName: 'Redmi Note 13 Pro 5G (8GB RAM, 256GB)',
    productSku: 'SKU-RDM-13P',
    productImage: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=800&q=80',
    category: 'smartphones',
    regularPrice: 24999,
    mrp: 28999,
    salePrice: 21999,
    discountPct: 12,
    bannerImageUrl: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=1200&q=80',
    headline: 'Festive Smartphone Blowout — 200MP Camera Flagship',
    subheadline: 'Instant Doorstep Delivery in Lucknow with 1-Year Brand Warranty',
    ctaText: 'Shop Smartphone Deal',
    isActive: true,
    createdAt: new Date(Date.now() - 10 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 10 * 3600 * 1000).toISOString(),
  },
];
