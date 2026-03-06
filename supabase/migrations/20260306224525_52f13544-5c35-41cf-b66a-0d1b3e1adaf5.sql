
-- Drop old furnace-only table
DROP TABLE IF EXISTS public.retailer_products;

-- Create universal contractor materials catalog
CREATE TABLE public.retailer_catalog (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  retailer TEXT NOT NULL DEFAULT 'lowes',
  source_product_id TEXT,
  sku TEXT,
  upc TEXT,
  brand TEXT,
  model TEXT,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'general',
  subcategory TEXT,
  material_type TEXT,
  trade TEXT,
  unit_of_measure TEXT,
  package_size TEXT,
  dimensions TEXT,
  thickness TEXT,
  length_value NUMERIC,
  width_value NUMERIC,
  height_value NUMERIC,
  size_text TEXT,
  color TEXT,
  finish TEXT,
  material TEXT,
  spec_attributes JSONB,
  price NUMERIC,
  currency TEXT DEFAULT 'USD',
  inventory_status TEXT,
  zip_code TEXT,
  store_id TEXT,
  product_url TEXT,
  image_url TEXT,
  raw_json JSONB,
  source_type TEXT DEFAULT 'manual',
  source_name TEXT,
  last_synced_at TIMESTAMPTZ DEFAULT now(),
  last_price_check_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(retailer, source_product_id)
);

-- Indexes for common queries
CREATE INDEX idx_retailer_catalog_retailer ON public.retailer_catalog(retailer);
CREATE INDEX idx_retailer_catalog_category ON public.retailer_catalog(category);
CREATE INDEX idx_retailer_catalog_trade ON public.retailer_catalog(trade);
CREATE INDEX idx_retailer_catalog_brand ON public.retailer_catalog(brand);
CREATE INDEX idx_retailer_catalog_price ON public.retailer_catalog(price);
CREATE INDEX idx_retailer_catalog_search ON public.retailer_catalog(retailer, category, trade);

-- RLS
ALTER TABLE public.retailer_catalog ENABLE ROW LEVEL SECURITY;

-- Everyone can read catalog (public product data)
CREATE POLICY "Anyone can read retailer catalog" ON public.retailer_catalog
  FOR SELECT USING (true);

-- Only admins can manage
CREATE POLICY "Admins can manage retailer catalog" ON public.retailer_catalog
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin') OR public.has_full_access(auth.uid()))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin') OR public.has_full_access(auth.uid()));

-- Updated at trigger
CREATE TRIGGER update_retailer_catalog_updated_at
  BEFORE UPDATE ON public.retailer_catalog
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
