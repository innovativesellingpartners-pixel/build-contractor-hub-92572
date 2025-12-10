-- Create trades table for organizing assumptions/exclusions by trade type
CREATE TABLE public.trades (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create assumption_templates table (reusable library)
CREATE TABLE public.assumption_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  trade_id UUID NOT NULL REFERENCES public.trades(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'General',
  priority INTEGER NOT NULL DEFAULT 0,
  default_selected BOOLEAN NOT NULL DEFAULT true,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create exclusion_templates table (reusable library)
CREATE TABLE public.exclusion_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  trade_id UUID NOT NULL REFERENCES public.trades(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'General',
  priority INTEGER NOT NULL DEFAULT 0,
  default_selected BOOLEAN NOT NULL DEFAULT true,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create estimate_assumptions table (frozen snapshot for each estimate)
CREATE TABLE public.estimate_assumptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  estimate_id UUID NOT NULL REFERENCES public.estimates(id) ON DELETE CASCADE,
  template_id UUID REFERENCES public.assumption_templates(id) ON DELETE SET NULL,
  text TEXT NOT NULL,
  category TEXT,
  priority INTEGER DEFAULT 0,
  is_custom BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create estimate_exclusions table (frozen snapshot for each estimate)
CREATE TABLE public.estimate_exclusions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  estimate_id UUID NOT NULL REFERENCES public.estimates(id) ON DELETE CASCADE,
  template_id UUID REFERENCES public.exclusion_templates(id) ON DELETE SET NULL,
  text TEXT NOT NULL,
  category TEXT,
  priority INTEGER DEFAULT 0,
  is_custom BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create estimate_trades join table for multiple trades per estimate
CREATE TABLE public.estimate_trades (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  estimate_id UUID NOT NULL REFERENCES public.estimates(id) ON DELETE CASCADE,
  trade_id UUID NOT NULL REFERENCES public.trades(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(estimate_id, trade_id)
);

-- Enable RLS on all tables
ALTER TABLE public.trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assumption_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exclusion_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.estimate_assumptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.estimate_exclusions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.estimate_trades ENABLE ROW LEVEL SECURITY;

-- RLS for trades (anyone can read, admins can write)
CREATE POLICY "Anyone can view trades" ON public.trades FOR SELECT USING (true);
CREATE POLICY "Admins can manage trades" ON public.trades FOR ALL 
  USING (has_role(auth.uid(), 'admin'::text) OR has_role(auth.uid(), 'super_admin'::text));

-- RLS for assumption_templates (anyone can read, admins can write)
CREATE POLICY "Anyone can view assumption templates" ON public.assumption_templates FOR SELECT USING (true);
CREATE POLICY "Admins can manage assumption templates" ON public.assumption_templates FOR ALL 
  USING (has_role(auth.uid(), 'admin'::text) OR has_role(auth.uid(), 'super_admin'::text));

-- RLS for exclusion_templates (anyone can read, admins can write)
CREATE POLICY "Anyone can view exclusion templates" ON public.exclusion_templates FOR SELECT USING (true);
CREATE POLICY "Admins can manage exclusion templates" ON public.exclusion_templates FOR ALL 
  USING (has_role(auth.uid(), 'admin'::text) OR has_role(auth.uid(), 'super_admin'::text));

-- RLS for estimate_assumptions (user can manage their own via estimate ownership)
CREATE POLICY "Users can view estimate assumptions for own estimates" ON public.estimate_assumptions FOR SELECT 
  USING (EXISTS (SELECT 1 FROM estimates WHERE estimates.id = estimate_assumptions.estimate_id AND estimates.user_id = auth.uid()) 
    OR has_role(auth.uid(), 'admin'::text) OR has_role(auth.uid(), 'super_admin'::text));
CREATE POLICY "Users can insert estimate assumptions for own estimates" ON public.estimate_assumptions FOR INSERT 
  WITH CHECK (EXISTS (SELECT 1 FROM estimates WHERE estimates.id = estimate_assumptions.estimate_id AND estimates.user_id = auth.uid()));
CREATE POLICY "Users can update estimate assumptions for own estimates" ON public.estimate_assumptions FOR UPDATE 
  USING (EXISTS (SELECT 1 FROM estimates WHERE estimates.id = estimate_assumptions.estimate_id AND estimates.user_id = auth.uid()));
CREATE POLICY "Users can delete estimate assumptions for own estimates" ON public.estimate_assumptions FOR DELETE 
  USING (EXISTS (SELECT 1 FROM estimates WHERE estimates.id = estimate_assumptions.estimate_id AND estimates.user_id = auth.uid()));

-- RLS for estimate_exclusions (user can manage their own via estimate ownership)
CREATE POLICY "Users can view estimate exclusions for own estimates" ON public.estimate_exclusions FOR SELECT 
  USING (EXISTS (SELECT 1 FROM estimates WHERE estimates.id = estimate_exclusions.estimate_id AND estimates.user_id = auth.uid()) 
    OR has_role(auth.uid(), 'admin'::text) OR has_role(auth.uid(), 'super_admin'::text));
CREATE POLICY "Users can insert estimate exclusions for own estimates" ON public.estimate_exclusions FOR INSERT 
  WITH CHECK (EXISTS (SELECT 1 FROM estimates WHERE estimates.id = estimate_exclusions.estimate_id AND estimates.user_id = auth.uid()));
CREATE POLICY "Users can update estimate exclusions for own estimates" ON public.estimate_exclusions FOR UPDATE 
  USING (EXISTS (SELECT 1 FROM estimates WHERE estimates.id = estimate_exclusions.estimate_id AND estimates.user_id = auth.uid()));
CREATE POLICY "Users can delete estimate exclusions for own estimates" ON public.estimate_exclusions FOR DELETE 
  USING (EXISTS (SELECT 1 FROM estimates WHERE estimates.id = estimate_exclusions.estimate_id AND estimates.user_id = auth.uid()));

-- RLS for estimate_trades
CREATE POLICY "Users can view estimate trades for own estimates" ON public.estimate_trades FOR SELECT 
  USING (EXISTS (SELECT 1 FROM estimates WHERE estimates.id = estimate_trades.estimate_id AND estimates.user_id = auth.uid()) 
    OR has_role(auth.uid(), 'admin'::text) OR has_role(auth.uid(), 'super_admin'::text));
CREATE POLICY "Users can manage estimate trades for own estimates" ON public.estimate_trades FOR ALL 
  USING (EXISTS (SELECT 1 FROM estimates WHERE estimates.id = estimate_trades.estimate_id AND estimates.user_id = auth.uid()));

-- Create indexes
CREATE INDEX idx_assumption_templates_trade ON public.assumption_templates(trade_id);
CREATE INDEX idx_exclusion_templates_trade ON public.exclusion_templates(trade_id);
CREATE INDEX idx_estimate_assumptions_estimate ON public.estimate_assumptions(estimate_id);
CREATE INDEX idx_estimate_exclusions_estimate ON public.estimate_exclusions(estimate_id);
CREATE INDEX idx_estimate_trades_estimate ON public.estimate_trades(estimate_id);
CREATE INDEX idx_estimate_trades_trade ON public.estimate_trades(trade_id);

-- Seed initial trades
INSERT INTO public.trades (name, code, description) VALUES
  ('General Construction', 'GC', 'General contracting and construction services'),
  ('Electrical', 'ELEC', 'Electrical installation and repair services'),
  ('Plumbing', 'PLUMB', 'Plumbing installation and repair services'),
  ('HVAC / Mechanical', 'HVAC', 'Heating, ventilation, and air conditioning services'),
  ('Roofing', 'ROOF', 'Roofing installation and repair services');

-- Seed assumption templates for General Construction
INSERT INTO public.assumption_templates (trade_id, title, body, category, priority, default_selected) VALUES
  ((SELECT id FROM trades WHERE code = 'GC'), 'Standard working hours', 'Work occurs Monday through Friday during normal daytime hours. No night work, holiday work, or weekend work assumed.', 'Labor', 1, true),
  ((SELECT id FROM trades WHERE code = 'GC'), 'Clear work area', 'Owner provides clear and accessible work areas free of personal property, loose debris, and obstructions before work begins.', 'Site conditions', 2, true),
  ((SELECT id FROM trades WHERE code = 'GC'), 'Owner supplied utilities', 'Owner supplies temporary power, water, and restroom access for the duration of the project unless a different arrangement appears in the Estimate.', 'Owner responsibilities', 3, true),
  ((SELECT id FROM trades WHERE code = 'GC'), 'Change order process', 'Any work outside the written scope in this Estimate requires a written and approved change order with separate pricing before execution.', 'Change orders', 4, true);

-- Seed exclusion templates for General Construction
INSERT INTO public.exclusion_templates (trade_id, title, body, category, priority, default_selected) VALUES
  ((SELECT id FROM trades WHERE code = 'GC'), 'Permit and impact fees', 'Permit, impact, and tap fees remain excluded unless listed as a separate line item in this Estimate.', 'Permits and fees', 1, true),
  ((SELECT id FROM trades WHERE code = 'GC'), 'Design and engineering services', 'Architectural, structural, and engineering design services remain excluded unless specifically described in the scope.', 'Design', 2, true),
  ((SELECT id FROM trades WHERE code = 'GC'), 'Hazardous materials', 'Testing, handling, removal, or abatement of asbestos, lead paint, mold, or any hazardous material remain excluded.', 'Hazardous materials', 3, true),
  ((SELECT id FROM trades WHERE code = 'GC'), 'Concealed structural defects', 'Repair or replacement of concealed framing, structural members, or other hidden defects discovered during work remains excluded from this Estimate.', 'Existing conditions', 4, true);

-- Seed for Electrical
INSERT INTO public.assumption_templates (trade_id, title, body, category, priority, default_selected) VALUES
  ((SELECT id FROM trades WHERE code = 'ELEC'), 'Devices and fixtures as listed', 'Work covers only devices and fixtures listed in the Estimate.', 'Scope', 1, true),
  ((SELECT id FROM trades WHERE code = 'ELEC'), 'Existing panels compliant', 'Existing panels and wiring are assumed to be safe and code compliant.', 'Existing conditions', 2, true),
  ((SELECT id FROM trades WHERE code = 'ELEC'), 'Standard device finish', 'Standard white devices and trim when finish is not specified.', 'Materials', 3, true);

INSERT INTO public.exclusion_templates (trade_id, title, body, category, priority, default_selected) VALUES
  ((SELECT id FROM trades WHERE code = 'ELEC'), 'Service or panel upgrades', 'Service or panel upgrades not listed in the scope are excluded.', 'Electrical', 1, true),
  ((SELECT id FROM trades WHERE code = 'ELEC'), 'Low voltage and data', 'Data, low voltage, and fire alarm systems are excluded unless listed.', 'Low voltage', 2, true),
  ((SELECT id FROM trades WHERE code = 'ELEC'), 'Patching and painting', 'Patching and painting after electrical work is excluded.', 'Finish work', 3, true);

-- Seed for Plumbing
INSERT INTO public.assumption_templates (trade_id, title, body, category, priority, default_selected) VALUES
  ((SELECT id FROM trades WHERE code = 'PLUMB'), 'Existing lines serviceable', 'Existing supply and waste lines are serviceable and adequate for new fixtures.', 'Existing conditions', 1, true),
  ((SELECT id FROM trades WHERE code = 'PLUMB'), 'Standard tie-in locations', 'Tie-in locations match the plan within normal distances.', 'Installation', 2, true);

INSERT INTO public.exclusion_templates (trade_id, title, body, category, priority, default_selected) VALUES
  ((SELECT id FROM trades WHERE code = 'PLUMB'), 'Camera inspection', 'Camera inspection of sewer lines is excluded.', 'Inspection', 1, true),
  ((SELECT id FROM trades WHERE code = 'PLUMB'), 'Major excavation', 'Major excavation beyond quantities suggested by the drawings is excluded.', 'Excavation', 2, true),
  ((SELECT id FROM trades WHERE code = 'PLUMB'), 'Water treatment systems', 'Water treatment systems are excluded unless described in the scope.', 'Systems', 3, true);

-- Seed for HVAC
INSERT INTO public.assumption_templates (trade_id, title, body, category, priority, default_selected) VALUES
  ((SELECT id FROM trades WHERE code = 'HVAC'), 'Ductwork per plans', 'Ductwork layout follows provided plans with only minor field adjustments.', 'Installation', 1, true),
  ((SELECT id FROM trades WHERE code = 'HVAC'), 'Electrical service adequate', 'Electrical service supports the mechanical equipment listed.', 'Electrical', 2, true);

INSERT INTO public.exclusion_templates (trade_id, title, body, category, priority, default_selected) VALUES
  ((SELECT id FROM trades WHERE code = 'HVAC'), 'Structural engineering', 'Structural engineering for roof openings or supports is excluded.', 'Engineering', 1, true),
  ((SELECT id FROM trades WHERE code = 'HVAC'), 'Roof patching', 'Roof patching and flashing are excluded unless described in the scope.', 'Roofing', 2, true),
  ((SELECT id FROM trades WHERE code = 'HVAC'), 'Building automation', 'Integration with building automation beyond standard thermostat control is excluded.', 'Controls', 3, true);

-- Seed for Roofing
INSERT INTO public.assumption_templates (trade_id, title, body, category, priority, default_selected) VALUES
  ((SELECT id FROM trades WHERE code = 'ROOF'), 'Deck structurally sound', 'Roof deck remains structurally sound and ready for new roofing material.', 'Existing conditions', 1, true),
  ((SELECT id FROM trades WHERE code = 'ROOF'), 'One existing layer', 'One existing roof layer unless the scope states another quantity.', 'Demolition', 2, true);

INSERT INTO public.exclusion_templates (trade_id, title, body, category, priority, default_selected) VALUES
  ((SELECT id FROM trades WHERE code = 'ROOF'), 'Decking replacement', 'Extensive replacement of rotten decking is excluded.', 'Structural', 1, true),
  ((SELECT id FROM trades WHERE code = 'ROOF'), 'Interior leak repairs', 'Interior repairs from leaks that existed before this roofing project are excluded.', 'Interior', 2, true),
  ((SELECT id FROM trades WHERE code = 'ROOF'), 'Snow and ice removal', 'Snow, ice removal, and de-icing services are excluded.', 'Maintenance', 3, true);