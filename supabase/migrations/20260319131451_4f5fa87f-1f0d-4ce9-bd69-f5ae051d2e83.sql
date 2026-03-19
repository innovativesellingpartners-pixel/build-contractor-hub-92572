ALTER TABLE public.estimates ADD COLUMN IF NOT EXISTS customer_language text DEFAULT 'en';
ALTER TABLE public.estimates ADD COLUMN IF NOT EXISTS translated_content jsonb;
ALTER TABLE public.estimates ADD COLUMN IF NOT EXISTS original_language text;
ALTER TABLE public.estimates ADD COLUMN IF NOT EXISTS translated_language text;
ALTER TABLE public.estimates ADD COLUMN IF NOT EXISTS translated_at timestamptz;