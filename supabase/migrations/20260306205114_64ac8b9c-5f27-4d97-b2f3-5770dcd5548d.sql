
CREATE TABLE public.retailer_products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  retailer TEXT NOT NULL DEFAULT 'lowes',
  source_product_id TEXT,
  sku TEXT,
  brand TEXT,
  model TEXT,
  title TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'furnaces',
  subcategory TEXT,
  price NUMERIC(10,2),
  currency TEXT DEFAULT 'USD',
  efficiency_afue NUMERIC(5,1),
  btu_input INTEGER,
  fuel_type TEXT,
  inventory_status TEXT,
  zip_code TEXT,
  store_id TEXT,
  product_url TEXT,
  image_url TEXT,
  raw_json JSONB,
  last_synced_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  last_price_check_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(retailer, source_product_id)
);

ALTER TABLE public.retailer_products ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read products
CREATE POLICY "Authenticated users can read products"
  ON public.retailer_products
  FOR SELECT
  TO authenticated
  USING (true);

-- Only admins/super_admins can insert/update/delete
CREATE POLICY "Admins can manage products"
  ON public.retailer_products
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

-- Allow service role (edge functions) full access via anon policy
CREATE POLICY "Service role can manage products"
  ON public.retailer_products
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Update trigger
CREATE TRIGGER update_retailer_products_updated_at
  BEFORE UPDATE ON public.retailer_products
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
