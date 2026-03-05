ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS brand_footer_color text DEFAULT null,
ADD COLUMN IF NOT EXISTS brand_accent_bg_color text DEFAULT null,
ADD COLUMN IF NOT EXISTS watermark_logo_url text DEFAULT null;