-- Add status tracking and payment fields to estimates table
ALTER TABLE estimates 
ADD COLUMN IF NOT EXISTS sent_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS viewed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS signed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS paid_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS payment_amount DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS payment_method TEXT,
ADD COLUMN IF NOT EXISTS public_token UUID DEFAULT gen_random_uuid() UNIQUE;

-- Create index for public token lookups
CREATE INDEX IF NOT EXISTS idx_estimates_public_token ON estimates(public_token);

-- Create estimate_views table to track when customers view estimates
CREATE TABLE IF NOT EXISTS estimate_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  estimate_id UUID REFERENCES estimates(id) ON DELETE CASCADE,
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  ip_address TEXT,
  user_agent TEXT
);

-- Enable RLS on estimate_views
ALTER TABLE estimate_views ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert view records (for tracking)
CREATE POLICY "Anyone can log estimate views" ON estimate_views
  FOR INSERT WITH CHECK (true);

-- Allow estimate owners to view their estimate views
CREATE POLICY "Users can view their estimate views" ON estimate_views
  FOR SELECT USING (
    estimate_id IN (
      SELECT id FROM estimates WHERE user_id = auth.uid()
    )
  );