-- Create table to store QuickBooks OAuth tokens
CREATE TABLE public.quickbooks_connections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  realm_id TEXT NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.quickbooks_connections ENABLE ROW LEVEL SECURITY;

-- Users can view their own QuickBooks connection
CREATE POLICY "Users can view own QuickBooks connection"
ON public.quickbooks_connections
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own QuickBooks connection
CREATE POLICY "Users can insert own QuickBooks connection"
ON public.quickbooks_connections
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own QuickBooks connection
CREATE POLICY "Users can update own QuickBooks connection"
ON public.quickbooks_connections
FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own QuickBooks connection
CREATE POLICY "Users can delete own QuickBooks connection"
ON public.quickbooks_connections
FOR DELETE
USING (auth.uid() = user_id);

-- Trigger to update updated_at
CREATE TRIGGER update_quickbooks_connections_updated_at
BEFORE UPDATE ON public.quickbooks_connections
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();