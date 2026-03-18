
-- Add new values to change_order_status enum
ALTER TYPE public.change_order_status ADD VALUE IF NOT EXISTS 'draft';
ALTER TYPE public.change_order_status ADD VALUE IF NOT EXISTS 'pending_approval';
ALTER TYPE public.change_order_status ADD VALUE IF NOT EXISTS 'revision_requested';
ALTER TYPE public.change_order_status ADD VALUE IF NOT EXISTS 'sent';
ALTER TYPE public.change_order_status ADD VALUE IF NOT EXISTS 'viewed';
ALTER TYPE public.change_order_status ADD VALUE IF NOT EXISTS 'signed';

-- Add revision_notes column to change_orders
ALTER TABLE public.change_orders ADD COLUMN IF NOT EXISTS revision_notes text;

-- Create change_order_history table
CREATE TABLE IF NOT EXISTS public.change_order_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  change_order_id uuid REFERENCES public.change_orders(id) ON DELETE CASCADE NOT NULL,
  action text NOT NULL,
  performed_by text,
  notes text,
  from_status text,
  to_status text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.change_order_history ENABLE ROW LEVEL SECURITY;

-- Public read for history via change order ownership
CREATE POLICY "Users can view history for their change orders"
  ON public.change_order_history
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.change_orders co
      WHERE co.id = change_order_id
      AND public.is_contractor_member(co.user_id)
    )
  );

-- Allow inserts from service role (edge functions) - no authenticated insert policy needed
-- Public/anon can also insert via edge functions using service role

-- Allow public read for the history table when accessed via edge functions
CREATE POLICY "Public can view history via edge function"
  ON public.change_order_history
  FOR SELECT
  TO anon
  USING (true);
