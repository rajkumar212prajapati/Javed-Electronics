import { ProductCategory } from './index';

export type HomepageSectionType =
  | 'festive_base'
  | 'sale_base'
  | 'category_based'
  | 'price_sale_base'
  | 'brand_base'
  | 'combo_base'
  | 'offer_base'
  | 'activity_based'
  | 'like_based';

export interface HomepageSection {
  id: HomepageSectionType;
  title: string;
  subtitle: string;
  badge?: string;
  isEnabled: boolean;
  order: number;
}

// Brand Base config
export interface BrandBaseItem {
  id: string;
  name: string;
  tagline: string;
  badge?: string;
  logoUrl?: string;
  discountTag?: string;
  productCount?: number;
  featuredCategory?: ProductCategory | 'all';
  isActive: boolean;
}

// Sale Base config
export interface SaleBaseConfig {
  headline: string;
  subtext: string;
  badge: string;
  endTime: string; // ISO date
  discountBadgeText: string;
  urgencyBannerText: string;
  featuredProductIds?: string[];
}

// Category Base config
export interface CategoryBaseItem {
  categoryId: ProductCategory;
  displayName: string;
  startingPrice: number;
  badge?: string;
  tagline?: string;
  imageUrl?: string;
  popularSubcategories: string[];
  isActive: boolean;
}

// Price Sale Base config
export interface PriceSlabItem {
  id: string;
  label: string;
  maxPrice: number;
  minPrice?: number;
  badge?: string;
  tagline: string;
  isActive: boolean;
}

// Combo Base config
export interface ComboBundleItem {
  id: string;
  title: string;
  badge: string;
  productIds: string[];
  productNames: string[];
  regularTotal: number;
  comboPrice: number;
  savings: number;
  tagline: string;
  description: string;
  imageUrl?: string;
  isPopular?: boolean;
  isActive: boolean;
}

// Offer Base config
export interface BankOfferItem {
  id: string;
  bankName: string;
  cardType: string; // 'Credit Cards' | 'Debit Cards' | 'UPI' | 'All Payment Modes'
  discountText: string;
  code?: string;
  minSpend: number;
  badge: string;
  terms: string;
  bgColorClass: string;
  isActive: boolean;
}

// Activity Base config
export interface ActivityItem {
  id: string;
  name: string;
  tagline: string;
  badge?: string;
  iconName: string;
  categoryFilter?: ProductCategory | 'all';
  keywords: string[];
  bgGradient: string;
  isActive: boolean;
}

// Like Base config
export interface LikeBaseConfig {
  headline: string;
  subtext: string;
  badge: string;
  minRating: number;
  showLikeCounter: boolean;
  featuredQuotes: Array<{
    productId: string;
    quote: string;
    customerName: string;
    verifiedLocation: string;
  }>;
}

// Festive Base config
export interface FestiveBaseConfig {
  festivalName: string;
  greeting: string;
  bannerHeadline: string;
  bannerSubtext: string;
  badge: string;
  themeStyle: 'diwali' | 'eid' | 'holi' | 'navratri' | 'new_year' | 'royal_gold';
  couponCode?: string;
  discountPercentage: number;
  minSpend: number;
  giftPackagingAvailable: boolean;
  giftPackNote: string;
  featuredProductIds?: string[];
}

export interface HomepageMasterSettings {
  sections: HomepageSection[];
  brands: BrandBaseItem[];
  saleConfig: SaleBaseConfig;
  categoryItems: CategoryBaseItem[];
  priceSlabs: PriceSlabItem[];
  comboBundles: ComboBundleItem[];
  bankOffers: BankOfferItem[];
  activities: ActivityItem[];
  likeConfig: LikeBaseConfig;
  festiveConfig: FestiveBaseConfig;
}
