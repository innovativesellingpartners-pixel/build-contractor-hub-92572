
-- Create subcontractors table
CREATE TABLE public.subcontractors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  company_name TEXT NOT NULL,
  contact_name TEXT,
  email TEXT,
  phone TEXT,
  trade TEXT,
  license_number TEXT,
  insurance_expiry DATE,
  rating NUMERIC DEFAULT 0,
  notes TEXT,
  status TEXT DEFAULT 'active',
  documents JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_subcontractors_user_id ON public.subcontractors(user_id);
CREATE INDEX idx_subcontractors_trade ON public.subcontractors(trade);
CREATE INDEX idx_subcontractors_status ON public.subcontractors(status);

ALTER TABLE public.subcontractors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subs"
  ON public.subcontractors FOR SELECT TO authenticated
  USING (public.is_contractor_member(user_id));

CREATE POLICY "Users can insert own subs"
  ON public.subcontractors FOR INSERT TO authenticated
  WITH CHECK (public.is_contractor_member(user_id));

CREATE POLICY "Users can update own subs"
  ON public.subcontractors FOR UPDATE TO authenticated
  USING (public.is_contractor_member(user_id));

CREATE POLICY "Users can delete own subs"
  ON public.subcontractors FOR DELETE TO authenticated
  USING (public.is_contractor_member(user_id));

-- Create sub_assignments table
CREATE TABLE public.sub_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  subcontractor_id UUID REFERENCES public.subcontractors(id) ON DELETE CASCADE NOT NULL,
  job_id UUID REFERENCES public.jobs(id) ON DELETE CASCADE NOT NULL,
  scope_of_work TEXT,
  agreed_amount NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'invited',
  start_date DATE,
  end_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_sub_assignments_user_id ON public.sub_assignments(user_id);
CREATE INDEX idx_sub_assignments_sub_id ON public.sub_assignments(subcontractor_id);
CREATE INDEX idx_sub_assignments_job_id ON public.sub_assignments(job_id);

ALTER TABLE public.sub_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own assignments"
  ON public.sub_assignments FOR SELECT TO authenticated
  USING (public.is_contractor_member(user_id));

CREATE POLICY "Users can insert own assignments"
  ON public.sub_assignments FOR INSERT TO authenticated
  WITH CHECK (public.is_contractor_member(user_id));

CREATE POLICY "Users can update own assignments"
  ON public.sub_assignments FOR UPDATE TO authenticated
  USING (public.is_contractor_member(user_id));

CREATE POLICY "Users can delete own assignments"
  ON public.sub_assignments FOR DELETE TO authenticated
  USING (public.is_contractor_member(user_id));

-- Trigger for updated_at
CREATE TRIGGER update_subcontractors_updated_at
  BEFORE UPDATE ON public.subcontractors
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_sub_assignments_updated_at
  BEFORE UPDATE ON public.sub_assignments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
