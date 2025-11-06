-- Create enum types for the job management system
CREATE TYPE public.job_status AS ENUM (
  'scheduled',
  'in_progress',
  'on_hold',
  'inspection_pending',
  'completed',
  'closed'
);

CREATE TYPE public.task_status AS ENUM (
  'not_started',
  'in_progress',
  'completed',
  'blocked'
);

CREATE TYPE public.change_order_status AS ENUM (
  'requested',
  'approved',
  'rejected'
);

CREATE TYPE public.invoice_status AS ENUM (
  'draft',
  'sent',
  'partial',
  'paid',
  'overdue'
);

CREATE TYPE public.crew_role AS ENUM (
  'office',
  'dispatcher',
  'field_crew_member',
  'customer'
);

-- Crew Members table
CREATE TABLE public.crew_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  role crew_role NOT NULL DEFAULT 'field_crew_member',
  contact_info JSONB,
  skills_trades TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Update jobs table with new fields
ALTER TABLE public.jobs
  ADD COLUMN IF NOT EXISTS trade_type TEXT,
  ADD COLUMN IF NOT EXISTS sub_trade TEXT,
  ADD COLUMN IF NOT EXISTS scheduled_start_date DATE,
  ADD COLUMN IF NOT EXISTS scheduled_end_date DATE,
  ADD COLUMN IF NOT EXISTS actual_start_date DATE,
  ADD COLUMN IF NOT EXISTS actual_end_date DATE,
  ADD COLUMN IF NOT EXISTS budget_amount NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS adjusted_budget_amount NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS actual_cost NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS job_status job_status DEFAULT 'scheduled',
  ADD COLUMN IF NOT EXISTS custom_fields JSONB;

-- Tasks table
CREATE TABLE public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES public.jobs(id) ON DELETE CASCADE NOT NULL,
  parent_task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  assigned_crew_member_id UUID REFERENCES public.crew_members(id),
  scheduled_start TIMESTAMP WITH TIME ZONE,
  scheduled_end TIMESTAMP WITH TIME ZONE,
  actual_start TIMESTAMP WITH TIME ZONE,
  actual_end TIMESTAMP WITH TIME ZONE,
  status task_status NOT NULL DEFAULT 'not_started',
  notes TEXT,
  order_index INTEGER DEFAULT 0,
  is_blocking BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Task photos
CREATE TABLE public.task_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE NOT NULL,
  photo_url TEXT NOT NULL,
  caption TEXT,
  gps_latitude NUMERIC,
  gps_longitude NUMERIC,
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Materials table (extending job_costs concept)
CREATE TABLE public.materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES public.jobs(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  description TEXT NOT NULL,
  quantity_ordered NUMERIC DEFAULT 0,
  quantity_used NUMERIC DEFAULT 0,
  unit_type TEXT,
  cost_per_unit NUMERIC DEFAULT 0,
  total_cost NUMERIC GENERATED ALWAYS AS (quantity_used * cost_per_unit) STORED,
  supplier_name TEXT,
  date_ordered DATE,
  date_used DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Change Orders table
CREATE TABLE public.change_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES public.jobs(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  description TEXT NOT NULL,
  reason TEXT,
  additional_cost NUMERIC NOT NULL DEFAULT 0,
  status change_order_status NOT NULL DEFAULT 'requested',
  requested_by UUID REFERENCES auth.users(id),
  approved_by UUID REFERENCES auth.users(id),
  date_requested TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  date_approved TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Invoices table
CREATE TABLE public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number TEXT UNIQUE,
  job_id UUID REFERENCES public.jobs(id) ON DELETE CASCADE NOT NULL,
  customer_id UUID REFERENCES public.customers(id),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE,
  amount_due NUMERIC NOT NULL DEFAULT 0,
  amount_paid NUMERIC NOT NULL DEFAULT 0,
  line_items JSONB,
  status invoice_status NOT NULL DEFAULT 'draft',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Crew assignments (many-to-many)
CREATE TABLE public.crew_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES public.jobs(id) ON DELETE CASCADE NOT NULL,
  crew_member_id UUID REFERENCES public.crew_members(id) ON DELETE CASCADE NOT NULL,
  assigned_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  assigned_by UUID REFERENCES auth.users(id),
  UNIQUE(job_id, crew_member_id)
);

-- Job status history (audit log)
CREATE TABLE public.job_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES public.jobs(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  old_status TEXT,
  new_status TEXT NOT NULL,
  reason TEXT,
  changed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Time tracking for crew members
CREATE TABLE public.time_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE,
  job_id UUID REFERENCES public.jobs(id) ON DELETE CASCADE NOT NULL,
  crew_member_id UUID REFERENCES public.crew_members(id) NOT NULL,
  clock_in TIMESTAMP WITH TIME ZONE NOT NULL,
  clock_out TIMESTAMP WITH TIME ZONE,
  hours_worked NUMERIC GENERATED ALWAYS AS (
    EXTRACT(EPOCH FROM (clock_out - clock_in)) / 3600
  ) STORED,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.crew_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.change_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crew_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.time_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for crew_members
CREATE POLICY "Users can view crew members in their company"
  ON public.crew_members FOR SELECT
  USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Admins can manage crew members"
  ON public.crew_members FOR ALL
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'super_admin'));

-- RLS Policies for tasks
CREATE POLICY "Users can view tasks for their jobs"
  ON public.tasks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.jobs
      WHERE jobs.id = tasks.job_id
      AND jobs.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.crew_assignments ca
      JOIN public.crew_members cm ON ca.crew_member_id = cm.id
      WHERE ca.job_id = tasks.job_id
      AND cm.user_id = auth.uid()
    )
    OR has_role(auth.uid(), 'admin')
    OR has_role(auth.uid(), 'super_admin')
  );

CREATE POLICY "Users can create tasks for their jobs"
  ON public.tasks FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.jobs
      WHERE jobs.id = tasks.job_id
      AND jobs.user_id = auth.uid()
    )
    OR has_role(auth.uid(), 'admin')
    OR has_role(auth.uid(), 'super_admin')
  );

CREATE POLICY "Users can update tasks for their jobs"
  ON public.tasks FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.jobs
      WHERE jobs.id = tasks.job_id
      AND jobs.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.crew_assignments ca
      JOIN public.crew_members cm ON ca.crew_member_id = cm.id
      WHERE ca.job_id = tasks.job_id
      AND cm.user_id = auth.uid()
    )
    OR has_role(auth.uid(), 'admin')
    OR has_role(auth.uid(), 'super_admin')
  );

CREATE POLICY "Users can delete tasks for their jobs"
  ON public.tasks FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.jobs
      WHERE jobs.id = tasks.job_id
      AND jobs.user_id = auth.uid()
    )
    OR has_role(auth.uid(), 'admin')
    OR has_role(auth.uid(), 'super_admin')
  );

-- RLS Policies for task_photos
CREATE POLICY "Users can view task photos"
  ON public.task_photos FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.tasks t
      JOIN public.jobs j ON t.job_id = j.id
      WHERE t.id = task_photos.task_id
      AND j.user_id = auth.uid()
    )
    OR has_role(auth.uid(), 'admin')
    OR has_role(auth.uid(), 'super_admin')
  );

CREATE POLICY "Users can upload task photos"
  ON public.task_photos FOR INSERT
  WITH CHECK (auth.uid() = uploaded_by);

CREATE POLICY "Users can delete their task photos"
  ON public.task_photos FOR DELETE
  USING (auth.uid() = uploaded_by);

-- RLS Policies for materials
CREATE POLICY "Users can view materials for their jobs"
  ON public.materials FOR SELECT
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.jobs
      WHERE jobs.id = materials.job_id
      AND jobs.user_id = auth.uid()
    )
    OR has_role(auth.uid(), 'admin')
    OR has_role(auth.uid(), 'super_admin')
  );

CREATE POLICY "Users can create materials"
  ON public.materials FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their materials"
  ON public.materials FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their materials"
  ON public.materials FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for change_orders
CREATE POLICY "Users can view change orders for their jobs"
  ON public.change_orders FOR SELECT
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.jobs
      WHERE jobs.id = change_orders.job_id
      AND jobs.user_id = auth.uid()
    )
    OR has_role(auth.uid(), 'admin')
    OR has_role(auth.uid(), 'super_admin')
  );

CREATE POLICY "Users can create change orders"
  ON public.change_orders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update change orders for their jobs"
  ON public.change_orders FOR UPDATE
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.jobs
      WHERE jobs.id = change_orders.job_id
      AND jobs.user_id = auth.uid()
    )
    OR has_role(auth.uid(), 'admin')
    OR has_role(auth.uid(), 'super_admin')
  );

CREATE POLICY "Admins can delete change orders"
  ON public.change_orders FOR DELETE
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'super_admin'));

-- RLS Policies for invoices
CREATE POLICY "Users can view invoices for their jobs"
  ON public.invoices FOR SELECT
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.jobs
      WHERE jobs.id = invoices.job_id
      AND jobs.user_id = auth.uid()
    )
    OR has_role(auth.uid(), 'admin')
    OR has_role(auth.uid(), 'super_admin')
  );

CREATE POLICY "Users can create invoices"
  ON public.invoices FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their invoices"
  ON public.invoices FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their invoices"
  ON public.invoices FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for crew_assignments
CREATE POLICY "Users can view crew assignments"
  ON public.crew_assignments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.jobs
      WHERE jobs.id = crew_assignments.job_id
      AND jobs.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.crew_members
      WHERE crew_members.id = crew_assignments.crew_member_id
      AND crew_members.user_id = auth.uid()
    )
    OR has_role(auth.uid(), 'admin')
    OR has_role(auth.uid(), 'super_admin')
  );

CREATE POLICY "Office users can manage crew assignments"
  ON public.crew_assignments FOR ALL
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'super_admin'));

-- RLS Policies for job_status_history
CREATE POLICY "Users can view job status history"
  ON public.job_status_history FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.jobs
      WHERE jobs.id = job_status_history.job_id
      AND jobs.user_id = auth.uid()
    )
    OR has_role(auth.uid(), 'admin')
    OR has_role(auth.uid(), 'super_admin')
  );

CREATE POLICY "System can insert job status history"
  ON public.job_status_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for time_logs
CREATE POLICY "Users can view their time logs"
  ON public.time_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.crew_members
      WHERE crew_members.id = time_logs.crew_member_id
      AND crew_members.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.jobs
      WHERE jobs.id = time_logs.job_id
      AND jobs.user_id = auth.uid()
    )
    OR has_role(auth.uid(), 'admin')
    OR has_role(auth.uid(), 'super_admin')
  );

CREATE POLICY "Crew members can create time logs"
  ON public.time_logs FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.crew_members
      WHERE crew_members.id = time_logs.crew_member_id
      AND crew_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Crew members can update their time logs"
  ON public.time_logs FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.crew_members
      WHERE crew_members.id = time_logs.crew_member_id
      AND crew_members.user_id = auth.uid()
    )
  );

-- Triggers for updated_at
CREATE TRIGGER update_crew_members_updated_at
  BEFORE UPDATE ON public.crew_members
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_materials_updated_at
  BEFORE UPDATE ON public.materials
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_change_orders_updated_at
  BEFORE UPDATE ON public.change_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_invoices_updated_at
  BEFORE UPDATE ON public.invoices
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- Function to generate invoice numbers
CREATE OR REPLACE FUNCTION public.generate_invoice_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  next_num INTEGER;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(invoice_number FROM 5) AS INTEGER)), 0) + 1
  INTO next_num
  FROM public.invoices
  WHERE invoice_number ~ '^INV-[0-9]+$';
  
  RETURN 'INV-' || LPAD(next_num::TEXT, 5, '0');
END;
$$;

-- Function to update job actual_cost
CREATE OR REPLACE FUNCTION public.update_job_actual_cost()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.jobs
  SET actual_cost = (
    SELECT COALESCE(SUM(total_cost), 0)
    FROM public.materials
    WHERE job_id = NEW.job_id
  ) + (
    SELECT COALESCE(SUM(additional_cost), 0)
    FROM public.change_orders
    WHERE job_id = NEW.job_id
    AND status = 'approved'
  )
  WHERE id = NEW.job_id;
  
  RETURN NEW;
END;
$$;

-- Triggers to update job actual_cost
CREATE TRIGGER update_job_cost_on_material_change
  AFTER INSERT OR UPDATE OR DELETE ON public.materials
  FOR EACH ROW
  EXECUTE FUNCTION public.update_job_actual_cost();

CREATE TRIGGER update_job_cost_on_change_order
  AFTER INSERT OR UPDATE ON public.change_orders
  FOR EACH ROW
  WHEN (NEW.status = 'approved')
  EXECUTE FUNCTION public.update_job_actual_cost();

-- Function to log job status changes
CREATE OR REPLACE FUNCTION public.log_job_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (TG_OP = 'UPDATE' AND OLD.job_status IS DISTINCT FROM NEW.job_status) THEN
    INSERT INTO public.job_status_history (job_id, user_id, old_status, new_status)
    VALUES (NEW.id, auth.uid(), OLD.job_status::TEXT, NEW.job_status::TEXT);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER log_job_status_changes
  AFTER UPDATE ON public.jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.log_job_status_change();

-- Create indexes for performance
CREATE INDEX idx_tasks_job_id ON public.tasks(job_id);
CREATE INDEX idx_tasks_assigned_crew ON public.tasks(assigned_crew_member_id);
CREATE INDEX idx_tasks_status ON public.tasks(status);
CREATE INDEX idx_materials_job_id ON public.materials(job_id);
CREATE INDEX idx_change_orders_job_id ON public.change_orders(job_id);
CREATE INDEX idx_change_orders_status ON public.change_orders(status);
CREATE INDEX idx_invoices_job_id ON public.invoices(job_id);
CREATE INDEX idx_invoices_status ON public.invoices(status);
CREATE INDEX idx_crew_assignments_job_id ON public.crew_assignments(job_id);
CREATE INDEX idx_crew_assignments_crew_id ON public.crew_assignments(crew_member_id);
CREATE INDEX idx_time_logs_job_id ON public.time_logs(job_id);
CREATE INDEX idx_time_logs_crew_id ON public.time_logs(crew_member_id);
CREATE INDEX idx_jobs_status ON public.jobs(job_status);
CREATE INDEX idx_jobs_trade_type ON public.jobs(trade_type);