import {
  FestivalCampaignRecord,
  ComputedCampaignStatus,
  CampaignValidationResult,
} from '../types/festivalCampaign';
import { getSupabaseClient } from './supabaseClient';

export const CAMPAIGNS_STORAGE_KEY = 'je_festival_campaigns_v2';
export const DEFAULT_TIMEZONE = 'Asia/Kolkata';

/**
 * Initial authoritative seed campaigns for Javed Electronics
 */
export const INITIAL_FESTIVAL_CAMPAIGNS: FestivalCampaignRecord[] = [
  {
    id: 'camp-diwali-2026',
    name: 'Diwali Tech Utsav & Mega Electronics Dhamaka',
    festival_name: 'Diwali',
    slug: 'diwali-tech-utsav-2026',
    description:
      'Grand festive electronics celebration with flat 15% extra savings, complimentary gift packaging & instant 4-hour Lucknow delivery.',
    status: 'published',
    priority: 10,
    // Active now (started yesterday, ends in 14 days)
    start_at: new Date(Date.now() - 86400000).toISOString(),
    end_at: new Date(Date.now() + 86400000 * 14).toISOString(),
    timezone: DEFAULT_TIMEZONE,
    theme_colors: {
      primary: '#b45309', // Warm amber-700
      secondary: '#451a03', // Deep rich amber-950
      accent: '#fbbf24', // Gold amber-400
      style: 'diwali',
    },
    desktop_banner_url:
      'https://images.unsplash.com/photo-1543807535-eceef0bc6599?auto=format&fit=crop&w=1920&q=80',
    mobile_banner_url:
      'https://images.unsplash.com/photo-1543807535-eceef0bc6599?auto=format&fit=crop&w=800&q=80',
    hero_headline: 'Diwali Tech Utsav: Flat 15% Savings & Complimentary Festive Hampers',
    hero_subtitle:
      'Celebrate the festival of lights with genuine smartphones, Dolby soundbars, smartwatches and instant 4-hour doorstep delivery in Lucknow.',
    badge_text: 'DIWALI DHAMAKA',
    cta_text: 'Shop Diwali Deals',
    cta_destination: '#products-section',
    coupon_code: 'DIWALI2026',
    discount_percentage: 15,
    min_cart_value: 1999,
    gift_packaging_enabled: true,
    gift_packaging_note:
      'Complimentary festive gold-embossed gift wrapping and greeting card included on request!',
    featured_category_ids: ['smartphones', 'audio', 'smartwatches', 'chargers_cables'],
    featured_product_ids: ['prod-001', 'prod-002', 'prod-004', 'prod-006', 'prod-009'],
    promotional_sections: [
      {
        id: 'sec-diwali-flagships',
        title: 'Diwali Flagship Smartphone Steals',
        subtitle: 'Official brand warranty with free tempered glass & fast adapter',
        badge: 'TOP SELLER',
        product_ids: ['prod-001', 'prod-006', 'prod-008'],
      },
      {
        id: 'sec-diwali-audio',
        title: 'Party Sound & Wireless Earbuds',
        subtitle: 'Up to 50% Off boAt & Sony audio systems',
        badge: 'BASS BOOST',
        product_ids: ['prod-002', 'prod-007', 'prod-009'],
      },
    ],
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'camp-eid-2026',
    name: 'Eid Mubarak Grand Electronics Deals',
    festival_name: 'Eid',
    slug: 'eid-mubarak-2026',
    description: 'Celebrate Eid with special family bundles, audio deals, and gifts.',
    status: 'draft',
    priority: 8,
    start_at: new Date(Date.now() + 86400000 * 30).toISOString(),
    end_at: new Date(Date.now() + 86400000 * 37).toISOString(),
    timezone: DEFAULT_TIMEZONE,
    theme_colors: {
      primary: '#047857', // Emerald-700
      secondary: '#022c22', // Emerald-950
      accent: '#34d399', // Emerald-400
      style: 'eid',
    },
    desktop_banner_url:
      'https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=1920&q=80',
    mobile_banner_url:
      'https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=800&q=80',
    hero_headline: 'Eid Mubarak: Grand Savings on Premium Electronics & Gadgets',
    hero_subtitle: 'Share the joy with gifts that bring people closer.',
    badge_text: 'EID SPECIAL',
    cta_text: 'Explore Eid Offers',
    cta_destination: '#products-section',
    coupon_code: 'EIDMUBARAK',
    discount_percentage: 12,
    min_cart_value: 1499,
    gift_packaging_enabled: true,
    gift_packaging_note: 'Custom Eid Mubarak gift wrapping with greeting card.',
    featured_category_ids: ['smartphones', 'audio', 'tvs_accessories'],
    featured_product_ids: ['prod-001', 'prod-005', 'prod-009'],
    created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
    updated_at: new Date().toISOString(),
  },
];

/**
 * Format timestamp in Asia/Kolkata timezone
 */
export function formatKolkataDateTime(isoString: string): string {
  try {
    const date = new Date(isoString);
    return new Intl.DateTimeFormat('en-IN', {
      timeZone: DEFAULT_TIMEZONE,
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(date);
  } catch {
    return isoString;
  }
}

/**
 * Compute real-time lifecycle status of a campaign
 */
export function computeCampaignStatus(
  campaign: FestivalCampaignRecord,
  referenceTime: Date = new Date()
): ComputedCampaignStatus {
  if (campaign.status === 'archived') {
    return 'archived';
  }
  if (campaign.status === 'draft') {
    return 'draft';
  }

  const startMs = new Date(campaign.start_at).getTime();
  const endMs = new Date(campaign.end_at).getTime();
  const nowMs = referenceTime.getTime();

  if (nowMs < startMs) {
    return 'scheduled';
  }
  if (nowMs >= startMs && nowMs < endMs) {
    return 'live';
  }
  return 'expired';
}

/**
 * Select the single active festival campaign for the customer-facing homepage
 * Follows strict rules:
 * 1. Must be status === 'published'
 * 2. start_at <= current_time AND current_time < end_at
 * 3. Priority tie-breaker: priority DESC, start_at DESC, id ASC
 * 4. Returns null if no campaign is active (triggers fallback to default homepage)
 */
export function selectActiveFestivalCampaign(
  campaigns: FestivalCampaignRecord[],
  referenceTime: Date = new Date()
): FestivalCampaignRecord | null {
  const nowMs = referenceTime.getTime();

  const eligibleCampaigns = campaigns.filter((camp) => {
    if (camp.status !== 'published') return false;

    const startMs = new Date(camp.start_at).getTime();
    const endMs = new Date(camp.end_at).getTime();

    // Valid dates check
    if (isNaN(startMs) || isNaN(endMs) || endMs <= startMs) return false;

    // Strict boundary condition: start_at <= now < end_at
    return startMs <= nowMs && nowMs < endMs;
  });

  if (eligibleCampaigns.length === 0) {
    return null;
  }

  // Deterministic sorting: Highest priority first, newest start date second, alphabetical ID third
  eligibleCampaigns.sort((a, b) => {
    if (b.priority !== a.priority) {
      return b.priority - a.priority;
    }
    const aStart = new Date(a.start_at).getTime();
    const bStart = new Date(b.start_at).getTime();
    if (bStart !== aStart) {
      return bStart - aStart;
    }
    return a.id.localeCompare(b.id);
  });

  return eligibleCampaigns[0];
}

/**
 * Validate campaign data before creating or saving
 */
export function validateCampaign(
  campaign: Partial<FestivalCampaignRecord>,
  existingCampaigns: FestivalCampaignRecord[] = []
): CampaignValidationResult {
  const errors: Record<string, string> = {};
  const warnings: string[] = [];

  if (!campaign.name || !campaign.name.trim()) {
    errors.name = 'Campaign internal name is required.';
  }
  if (!campaign.festival_name || !campaign.festival_name.trim()) {
    errors.festival_name = 'Festival name (e.g. Diwali, Eid, Holi) is required.';
  }
  if (!campaign.hero_headline || !campaign.hero_headline.trim()) {
    errors.hero_headline = 'Hero banner headline is required.';
  }
  if (!campaign.desktop_banner_url || !campaign.desktop_banner_url.trim()) {
    errors.desktop_banner_url = 'Desktop banner image URL is required.';
  } else if (!campaign.desktop_banner_url.startsWith('http://') && !campaign.desktop_banner_url.startsWith('https://')) {
    errors.desktop_banner_url = 'Desktop banner must be a valid HTTP/HTTPS URL.';
  }

  if (campaign.mobile_banner_url && !campaign.mobile_banner_url.startsWith('http://') && !campaign.mobile_banner_url.startsWith('https://')) {
    errors.mobile_banner_url = 'Mobile banner must be a valid HTTP/HTTPS URL.';
  }

  if (!campaign.start_at) {
    errors.start_at = 'Campaign start date and time are required.';
  }
  if (!campaign.end_at) {
    errors.end_at = 'Campaign end date and time are required.';
  }

  if (campaign.start_at && campaign.end_at) {
    const startMs = new Date(campaign.start_at).getTime();
    const endMs = new Date(campaign.end_at).getTime();

    if (isNaN(startMs) || isNaN(endMs)) {
      errors.dates = 'Invalid date format provided.';
    } else if (endMs <= startMs) {
      errors.end_at = 'Campaign end time must be strictly after the start time.';
    }

    // Schedule collision warning
    if (campaign.status === 'published' && !isNaN(startMs) && !isNaN(endMs)) {
      const conflicting = existingCampaigns.filter((other) => {
        if (other.id === campaign.id || other.status !== 'published') return false;
        const otherStart = new Date(other.start_at).getTime();
        const otherEnd = new Date(other.end_at).getTime();
        // Overlap: max(start1, start2) < min(end1, end2)
        return Math.max(startMs, otherStart) < Math.min(endMs, otherEnd);
      });

      if (conflicting.length > 0) {
        const conflictNames = conflicting.map((c) => `"${c.name}" (Priority ${c.priority})`).join(', ');
        warnings.push(
          `Schedule overlaps with ${conflicting.length} published campaign(s): ${conflictNames}. The campaign with higher priority will take precedence.`
        );
      }
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    warnings,
  };
}

/**
 * Fetch all festival campaigns (Supabase with resilient local sync fallback)
 */
export async function fetchFestivalCampaigns(): Promise<FestivalCampaignRecord[]> {
  const client = getSupabaseClient();
  if (client) {
    try {
      const { data, error } = await client
        .from('festival_campaigns')
        .select('*')
        .order('priority', { ascending: false });

      if (!error && data && data.length > 0) {
        // Cache to localStorage for offline resilience
        try {
          localStorage.setItem(CAMPAIGNS_STORAGE_KEY, JSON.stringify(data));
        } catch {}
        return data as FestivalCampaignRecord[];
      }
    } catch (err) {
      console.warn('Supabase fetch failed, falling back to cached campaigns:', err);
    }
  }

  // Fallback to local storage or initial seeds
  try {
    const saved = localStorage.getItem(CAMPAIGNS_STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch {}

  return INITIAL_FESTIVAL_CAMPAIGNS;
}

/**
 * Persist campaign (Supabase + Local fallback)
 */
export async function persistFestivalCampaign(
  campaign: FestivalCampaignRecord
): Promise<{ success: boolean; message: string; campaign: FestivalCampaignRecord }> {
  // Update timestamp
  const updatedCampaign: FestivalCampaignRecord = {
    ...campaign,
    updated_at: new Date().toISOString(),
  };

  // 1. Try Supabase if configured
  const client = getSupabaseClient();
  if (client) {
    try {
      const { error } = await client
        .from('festival_campaigns')
        .upsert(updatedCampaign, { onConflict: 'id' });

      if (error) {
        console.warn('Supabase upsert warning, syncing locally:', error.message);
      }
    } catch (err: any) {
      console.warn('Supabase upsert failed:', err.message);
    }
  }

  // 2. Sync to local storage
  try {
    const existing = await fetchFestivalCampaigns();
    const index = existing.findIndex((c) => c.id === updatedCampaign.id);
    let updatedList: FestivalCampaignRecord[];
    if (index >= 0) {
      updatedList = existing.map((c) => (c.id === updatedCampaign.id ? updatedCampaign : c));
    } else {
      updatedList = [updatedCampaign, ...existing];
    }
    localStorage.setItem(CAMPAIGNS_STORAGE_KEY, JSON.stringify(updatedList));
  } catch {}

  return {
    success: true,
    message: 'Campaign saved successfully.',
    campaign: updatedCampaign,
  };
}

/**
 * Duplicate an existing campaign into a new draft
 */
export function duplicateCampaignRecord(
  source: FestivalCampaignRecord
): FestivalCampaignRecord {
  const newId = `camp-${Date.now()}`;
  return {
    ...source,
    id: newId,
    name: `${source.name} (Copy)`,
    slug: `${source.slug || 'copy'}-${Date.now().toString().slice(-4)}`,
    status: 'draft',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}
