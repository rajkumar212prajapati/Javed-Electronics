import { ProductCategory } from './index';

export type CampaignStatus = 'draft' | 'published' | 'archived';
export type ComputedCampaignStatus = 'draft' | 'scheduled' | 'live' | 'expired' | 'archived';

export interface CampaignThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  style: 'diwali' | 'eid' | 'holi' | 'navratri' | 'new_year' | 'royal_gold' | 'custom';
}

export interface CampaignPromoSection {
  id: string;
  title: string;
  subtitle?: string;
  badge?: string;
  product_ids: string[];
}

export interface FestivalCampaignRecord {
  id: string;
  name: string;
  festival_name: string;
  slug: string;
  description?: string;
  status: CampaignStatus;
  priority: number;
  start_at: string; // ISO 8601 string
  end_at: string; // ISO 8601 string
  timezone: string; // Default: 'Asia/Kolkata'

  // Creative & Visual Assets
  theme_colors: CampaignThemeColors;
  desktop_banner_url: string;
  mobile_banner_url?: string;
  hero_headline: string;
  hero_subtitle?: string;
  badge_text: string;
  cta_text: string;
  cta_destination: string;

  // Coupons & Pricing Deals
  coupon_code?: string;
  discount_percentage?: number;
  min_cart_value?: number;

  // Gift Packaging Perk
  gift_packaging_enabled: boolean;
  gift_packaging_note?: string;

  // Targeted Existing Catalog references (no product duplication)
  featured_category_ids: (ProductCategory | string)[];
  featured_product_ids: string[];
  promotional_sections?: CampaignPromoSection[];

  // Auditing
  created_at: string;
  updated_at: string;
  created_by?: string;

  // Runtime helper (calculated dynamically against Asia/Kolkata current time)
  computed_status?: ComputedCampaignStatus;
}

export interface CampaignValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
  warnings: string[];
}
