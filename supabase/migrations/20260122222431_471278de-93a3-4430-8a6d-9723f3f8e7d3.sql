-- Add brand color fields to profiles table for contractor branding
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS brand_primary_color text DEFAULT '#D50A22',
ADD COLUMN IF NOT EXISTS brand_secondary_color text DEFAULT '#1e3a5f',
ADD COLUMN IF NOT EXISTS brand_accent_color text DEFAULT '#c9a227';

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.brand_primary_color IS 'Primary brand color (hex) used in estimates and documents';
COMMENT ON COLUMN public.profiles.brand_secondary_color IS 'Secondary brand color (hex) for headers/backgrounds';
COMMENT ON COLUMN public.profiles.brand_accent_color IS 'Accent color (hex) for highlights and CTAs';