-- Drop existing opportunities table to recreate with full schema
DROP TABLE IF EXISTS public.opportunities CASCADE;

-- Create enum for opportunity stages
CREATE TYPE public.opportunity_stage AS ENUM (
  'qualification',
  'lwe_discovery',
  'demo',
  'proposal',
  'negotiation',
  'close',
  'psfu'
);

-- Create enum for lead sources
CREATE TYPE public.lead_source AS ENUM (
  'referral',
  'website',
  'ad',
  'repeat_customer',
  'other'
);

-- Create opportunities table with all required fields
CREATE TABLE public.opportunities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
  
  -- Customer info
  customer_name TEXT NOT NULL,
  customer_phone TEXT,
  customer_email TEXT,
  job_address TEXT,
  
  -- Opportunity details
  title TEXT NOT NULL,
  trade_type TEXT NOT NULL,
  need_description TEXT,
  competing_options_description TEXT,
  notes TEXT,
  
  -- Sales stage tracking
  stage opportunity_stage NOT NULL DEFAULT 'qualification',
  stage_entered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  previous_stage opportunity_stage,
  
  -- Financial info
  estimated_value NUMERIC CHECK (estimated_value > 0),
  probability_percent INTEGER DEFAULT 10 CHECK (probability_percent >= 0 AND probability_percent <= 100),
  probability_override BOOLEAN DEFAULT false,
  
  -- Timeline
  estimated_close_date DATE CHECK (estimated_close_date >= CURRENT_DATE),
  job_start_target_date DATE,
  
  -- Qualification fields
  decision_maker_name TEXT,
  budget_confirmed BOOLEAN DEFAULT false,
  lead_source lead_source DEFAULT 'other',
  
  -- Action tracking
  next_action_description TEXT,
  next_action_date DATE,
  last_activity_at TIMESTAMPTZ DEFAULT now(),
  
  -- Documents
  proposal_document_url TEXT,
  contract_document_url TEXT,
  
  -- Assignment
  assigned_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create stage_history table
CREATE TABLE public.stage_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  opportunity_id UUID NOT NULL REFERENCES public.opportunities(id) ON DELETE CASCADE,
  from_stage opportunity_stage,
  to_stage opportunity_stage NOT NULL,
  changed_by_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  changed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  note TEXT,
  reason TEXT
);

-- Enable RLS
ALTER TABLE public.opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stage_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for opportunities
CREATE POLICY "Users can view own opportunities"
  ON public.opportunities FOR SELECT
  USING (auth.uid() = user_id OR auth.uid() = assigned_user_id);

CREATE POLICY "Admins can view all opportunities"
  ON public.opportunities FOR SELECT
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Users can create own opportunities"
  ON public.opportunities FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own opportunities"
  ON public.opportunities FOR UPDATE
  USING (auth.uid() = user_id OR auth.uid() = assigned_user_id);

CREATE POLICY "Users can delete own opportunities"
  ON public.opportunities FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for stage_history
CREATE POLICY "Users can view stage history for their opportunities"
  ON public.stage_history FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.opportunities
      WHERE opportunities.id = stage_history.opportunity_id
        AND (opportunities.user_id = auth.uid() OR opportunities.assigned_user_id = auth.uid())
    ) OR has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'super_admin')
  );

CREATE POLICY "Users can insert stage history"
  ON public.stage_history FOR INSERT
  WITH CHECK (auth.uid() = changed_by_user_id);

-- Create indexes for performance
CREATE INDEX idx_opportunities_user_id ON public.opportunities(user_id);
CREATE INDEX idx_opportunities_assigned_user_id ON public.opportunities(assigned_user_id);
CREATE INDEX idx_opportunities_stage ON public.opportunities(stage);
CREATE INDEX idx_opportunities_estimated_close_date ON public.opportunities(estimated_close_date);
CREATE INDEX idx_opportunities_next_action_date ON public.opportunities(next_action_date);
CREATE INDEX idx_stage_history_opportunity_id ON public.stage_history(opportunity_id);

-- Create trigger to update updated_at timestamp
CREATE TRIGGER update_opportunities_updated_at
  BEFORE UPDATE ON public.opportunities
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- Create function to log stage changes
CREATE OR REPLACE FUNCTION public.log_stage_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (TG_OP = 'UPDATE' AND OLD.stage IS DISTINCT FROM NEW.stage) THEN
    INSERT INTO public.stage_history (
      opportunity_id,
      from_stage,
      to_stage,
      changed_by_user_id
    ) VALUES (
      NEW.id,
      OLD.stage,
      NEW.stage,
      auth.uid()
    );
    
    -- Update stage_entered_at
    NEW.stage_entered_at := now();
    NEW.previous_stage := OLD.stage;
    NEW.last_activity_at := now();
    
    -- Update probability if not manually overridden
    IF NEW.probability_override = false THEN
      NEW.probability_percent := CASE NEW.stage
        WHEN 'qualification' THEN 10
        WHEN 'lwe_discovery' THEN 25
        WHEN 'demo' THEN 40
        WHEN 'proposal' THEN 60
        WHEN 'negotiation' THEN 80
        WHEN 'close' THEN 100
        WHEN 'psfu' THEN 100
        ELSE NEW.probability_percent
      END;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for stage changes
CREATE TRIGGER log_opportunity_stage_change
  BEFORE UPDATE ON public.opportunities
  FOR EACH ROW
  EXECUTE FUNCTION public.log_stage_change();