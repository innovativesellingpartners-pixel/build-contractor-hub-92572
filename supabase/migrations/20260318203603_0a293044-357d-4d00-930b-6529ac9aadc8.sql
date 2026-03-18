
-- Add network visibility fields to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS network_visible boolean NOT NULL DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS network_bio text;

-- Network inquiries table
CREATE TABLE IF NOT EXISTS public.network_inquiries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL,
  recipient_id uuid NOT NULL,
  message text NOT NULL,
  sender_name text,
  sender_company text,
  sender_email text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.network_inquiries ENABLE ROW LEVEL SECURITY;

-- Sender can see their own sent inquiries
CREATE POLICY "Users can see own sent inquiries"
  ON public.network_inquiries
  FOR SELECT
  TO authenticated
  USING (sender_id = auth.uid() OR recipient_id = auth.uid());

-- Users can insert inquiries
CREATE POLICY "Users can send inquiries"
  ON public.network_inquiries
  FOR INSERT
  TO authenticated
  WITH CHECK (sender_id = auth.uid());
