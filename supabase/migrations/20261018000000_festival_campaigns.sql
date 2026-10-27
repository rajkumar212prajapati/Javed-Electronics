-- ==============================================================================
-- Migration: 20261018000000_festival_campaigns.sql
-- Description: Festival Homepage Automation & Campaign Management for Javed Electronics
-- Target: Supabase (PostgreSQL 15+)
-- ==============================================================================

-- 1. Create festival_campaigns table
CREATE TABLE IF NOT EXISTS public.festival_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(150) NOT NULL,
  festival_name VARCHAR(100) NOT NULL,
  slug VARCHAR(150) UNIQUE,
  description TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  priority INTEGER NOT NULL DEFAULT 1 CHECK (priority >= 0),
  start_at TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ NOT NULL,
  timezone VARCHAR(50) NOT NULL DEFAULT 'Asia/Kolkata',
  
  -- Visual Theme & Identity
  theme_colors JSONB NOT NULL DEFAULT '{"primary": "#1e3a8a", "secondary": "#020617", "accent": "#f59e0b", "style": "diwali"}'::jsonb,
  
  -- Hero Banner & Creative Assets
  desktop_banner_url TEXT NOT NULL,
  mobile_banner_url TEXT,
  hero_headline VARCHAR(200) NOT NULL,
  hero_subtitle TEXT,
  badge_text VARCHAR(50) DEFAULT 'FESTIVE SPECIAL',
  cta_text VARCHAR(60) DEFAULT 'Explore Festive Deals',
  cta_destination VARCHAR(255) DEFAULT '#products-section',
  
  -- Offers & Coupons
  coupon_code VARCHAR(30),
  discount_percentage NUMERIC(5, 2) DEFAULT 0 CHECK (discount_percentage >= 0 AND discount_percentage <= 100),
  min_cart_value NUMERIC(10, 2) DEFAULT 0 CHECK (min_cart_value >= 0),
  
  -- Gift Packaging Perk
  gift_packaging_enabled BOOLEAN NOT NULL DEFAULT false,
  gift_packaging_note TEXT,
  
  -- Relationships (Referencing existing catalog items without duplication)
  featured_category_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  featured_product_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  promotional_sections JSONB NOT NULL DEFAULT '[]'::jsonb,
  
  -- Metadata & Auditing
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Constraint: end_at must be strictly greater than start_at
  CONSTRAINT chk_festival_campaign_dates CHECK (end_at > start_at)
);

-- 2. Indexes for high-performance campaign evaluation
CREATE INDEX IF NOT EXISTS idx_festival_campaigns_status_dates 
  ON public.festival_campaigns(status, start_at, end_at, priority DESC);

CREATE INDEX IF NOT EXISTS idx_festival_campaigns_slug 
  ON public.festival_campaigns(slug);

-- 3. Automatic updated_at trigger function
CREATE OR REPLACE FUNCTION public.handle_festival_campaign_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_festival_campaign_updated_at ON public.festival_campaigns;
CREATE TRIGGER trigger_festival_campaign_updated_at
  BEFORE UPDATE ON public.festival_campaigns
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_festival_campaign_updated_at();

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.festival_campaigns ENABLE ROW LEVEL SECURITY;

-- 5. Row Level Security Policies
-- Policy A: Public / Anonymous read access ONLY to published campaigns that are currently active
DROP POLICY IF EXISTS "Public can view active published festival campaigns" ON public.festival_campaigns;
CREATE POLICY "Public can view active published festival campaigns"
  ON public.festival_campaigns
  FOR SELECT
  TO public, anon, authenticated
  USING (
    status = 'published' AND
    start_at <= timezone('utc'::text, now()) AND
    timezone('utc'::text, now()) < end_at
  );

-- Policy B: Authenticated Admins have full access (select, insert, update, delete)
DROP POLICY IF EXISTS "Admins have full access to festival campaigns" ON public.festival_campaigns;
CREATE POLICY "Admins have full access to festival campaigns"
  ON public.festival_campaigns
  FOR ALL
  TO authenticated
  USING (
    -- Checks if user has admin role in app metadata or profile
    (auth.jwt() -> 'app_metadata' ->> 'role') IN ('super_admin', 'store_manager') OR
    (auth.jwt() ->> 'role') = 'service_role' OR
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND (auth.users.raw_user_meta_data->>'role') IN ('super_admin', 'store_manager')
    )
  )
  WITH CHECK (
    (auth.jwt() -> 'app_metadata' ->> 'role') IN ('super_admin', 'store_manager') OR
    (auth.jwt() ->> 'role') = 'service_role' OR
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND (auth.users.raw_user_meta_data->>'role') IN ('super_admin', 'store_manager')
    )
  );

-- 6. Supabase Storage: Setup festival-banners bucket (Optional / recommended)
INSERT INTO storage.buckets (id, name, public)
VALUES ('festival-banners', 'festival-banners', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policy: Public read for banners
DROP POLICY IF EXISTS "Public banner read access" ON storage.objects;
CREATE POLICY "Public banner read access"
  ON storage.objects
  FOR SELECT
  TO public, anon, authenticated
  USING (bucket_id = 'festival-banners');

-- Storage Policy: Admin write for banners
DROP POLICY IF EXISTS "Admin banner write access" ON storage.objects;
CREATE POLICY "Admin banner write access"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'festival-banners' AND (
      (auth.jwt() -> 'app_metadata' ->> 'role') IN ('super_admin', 'store_manager') OR
      (auth.jwt() ->> 'role') = 'service_role'
    )
  );

-- 7. Initial Seed Campaign: Diwali Tech Utsav (Authoritative seed)
INSERT INTO public.festival_campaigns (
  name,
  festival_name,
  slug,
  description,
  status,
  priority,
  start_at,
  end_at,
  timezone,
  theme_colors,
  desktop_banner_url,
  mobile_banner_url,
  hero_headline,
  hero_subtitle,
  badge_text,
  cta_text,
  cta_destination,
  coupon_code,
  discount_percentage,
  min_cart_value,
  gift_packaging_enabled,
  gift_packaging_note,
  featured_category_ids,
  featured_product_ids
) VALUES (
  'Diwali Tech Utsav & Mega Electronics Dhamaka',
  'Diwali',
  'diwali-tech-utsav-2026',
  'Grand festive electronics festival with flat 15% discount, complimentary gift packaging & 4-hour Lucknow doorstep delivery.',
  'published',
  10,
  timezone('utc'::text, now() - INTERVAL '1 day'),
  timezone('utc'::text, now() + INTERVAL '14 days'),
  'Asia/Kolkata',
  '{"primary": "#b45309", "secondary": "#451a03", "accent": "#fbbf24", "style": "diwali"}'::jsonb,
  'https://images.unsplash.com/photo-1543807535-eceef0bc6599?auto=format&fit=crop&w=1920&q=80',
  'https://images.unsplash.com/photo-1543807535-eceef0bc6599?auto=format&fit=crop&w=800&q=80',
  'Diwali Tech Utsav: Flat 15% Savings & Complimentary Festive Hampers',
  'Celebrate the festival of lights with 100% genuine smartphones, soundbars, earbuds & smartwatches in Lucknow.',
  'DIWALI DHAMAKA',
  'Shop Diwali Deals',
  '#products-section',
  'DIWALI2026',
  15.00,
  1999.00,
  true,
  'Complimentary festive gold-embossed gift wrapping and greeting card included on request!',
  '["smartphones", "audio", "smartwatches", "chargers_cables"]'::jsonb,
  '["prod-001", "prod-002", "prod-004", "prod-006", "prod-009"]'::jsonb
) ON CONFLICT (slug) DO NOTHING;
