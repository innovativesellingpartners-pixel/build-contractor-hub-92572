-- Create estimate line item macro groups table
CREATE TABLE IF NOT EXISTS public.estimate_line_item_macro_groups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contractor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create estimate line item macros table
CREATE TABLE IF NOT EXISTS public.estimate_line_item_macros (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  macro_group_id UUID NOT NULL REFERENCES public.estimate_line_item_macro_groups(id) ON DELETE CASCADE,
  item_code_template TEXT,
  description_template TEXT NOT NULL,
  default_quantity NUMERIC(12,2) NOT NULL DEFAULT 1,
  default_unit TEXT NOT NULL DEFAULT 'Each',
  default_unit_price NUMERIC(12,2) NOT NULL DEFAULT 0,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create estimate text macros table
CREATE TABLE IF NOT EXISTS public.estimate_text_macros (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contractor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('scope_objective', 'scope_deliverables', 'scope_exclusions', 'terms_payment', 'terms_change_order', 'terms_insurance', 'terms_warranty', 'scope_timeline')),
  body_text TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add indexes
CREATE INDEX idx_macro_groups_contractor ON public.estimate_line_item_macro_groups(contractor_id);
CREATE INDEX idx_macro_groups_active ON public.estimate_line_item_macro_groups(contractor_id, is_active);
CREATE INDEX idx_line_macros_group ON public.estimate_line_item_macros(macro_group_id);
CREATE INDEX idx_text_macros_contractor ON public.estimate_text_macros(contractor_id);
CREATE INDEX idx_text_macros_category ON public.estimate_text_macros(contractor_id, category, is_active);

-- Enable RLS
ALTER TABLE public.estimate_line_item_macro_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.estimate_line_item_macros ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.estimate_text_macros ENABLE ROW LEVEL SECURITY;

-- RLS policies for macro groups
CREATE POLICY "Users can view own macro groups"
  ON public.estimate_line_item_macro_groups FOR SELECT
  USING (auth.uid() = contractor_id);

CREATE POLICY "Users can create own macro groups"
  ON public.estimate_line_item_macro_groups FOR INSERT
  WITH CHECK (auth.uid() = contractor_id);

CREATE POLICY "Users can update own macro groups"
  ON public.estimate_line_item_macro_groups FOR UPDATE
  USING (auth.uid() = contractor_id);

CREATE POLICY "Users can delete own macro groups"
  ON public.estimate_line_item_macro_groups FOR DELETE
  USING (auth.uid() = contractor_id);

-- RLS policies for line macros (via group ownership)
CREATE POLICY "Users can view macros in own groups"
  ON public.estimate_line_item_macros FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.estimate_line_item_macro_groups g
    WHERE g.id = macro_group_id AND g.contractor_id = auth.uid()
  ));

CREATE POLICY "Users can create macros in own groups"
  ON public.estimate_line_item_macros FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.estimate_line_item_macro_groups g
    WHERE g.id = macro_group_id AND g.contractor_id = auth.uid()
  ));

CREATE POLICY "Users can update macros in own groups"
  ON public.estimate_line_item_macros FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.estimate_line_item_macro_groups g
    WHERE g.id = macro_group_id AND g.contractor_id = auth.uid()
  ));

CREATE POLICY "Users can delete macros in own groups"
  ON public.estimate_line_item_macros FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.estimate_line_item_macro_groups g
    WHERE g.id = macro_group_id AND g.contractor_id = auth.uid()
  ));

-- RLS policies for text macros
CREATE POLICY "Users can view own text macros"
  ON public.estimate_text_macros FOR SELECT
  USING (auth.uid() = contractor_id);

CREATE POLICY "Users can create own text macros"
  ON public.estimate_text_macros FOR INSERT
  WITH CHECK (auth.uid() = contractor_id);

CREATE POLICY "Users can update own text macros"
  ON public.estimate_text_macros FOR UPDATE
  USING (auth.uid() = contractor_id);

CREATE POLICY "Users can delete own text macros"
  ON public.estimate_text_macros FOR DELETE
  USING (auth.uid() = contractor_id);