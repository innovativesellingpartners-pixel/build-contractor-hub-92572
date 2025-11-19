-- Drop existing trigger if it exists for contractor_ai_profiles
DROP TRIGGER IF EXISTS update_contractor_ai_profiles_updated_at ON public.contractor_ai_profiles;

-- Create trigger to update updated_at for contractor_ai_profiles
CREATE TRIGGER update_contractor_ai_profiles_updated_at
BEFORE UPDATE ON public.contractor_ai_profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();

-- Create call_sessions table
CREATE TABLE IF NOT EXISTS public.call_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  call_sid TEXT NOT NULL UNIQUE,
  contractor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  tenant_id UUID,
  from_number TEXT NOT NULL,
  to_number TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  conversation_history JSONB DEFAULT '[]'::jsonb,
  ai_summary TEXT,
  outcome TEXT,
  action_taken TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.call_sessions ENABLE ROW LEVEL SECURITY;

-- Allow contractors to view their own call sessions
CREATE POLICY "Contractors can view own call sessions"
ON public.call_sessions
FOR SELECT
TO authenticated
USING (auth.uid() = contractor_id);

-- Allow admins/super_admins to view all call sessions
CREATE POLICY "Admins can view all call sessions"
ON public.call_sessions
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'super_admin')
);

-- Service role can manage all call sessions (for edge function)
CREATE POLICY "Service role can manage call sessions"
ON public.call_sessions
FOR ALL
TO service_role
USING (true);

-- Trigger to update updated_at
CREATE TRIGGER update_call_sessions_updated_at
BEFORE UPDATE ON public.call_sessions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();

-- Add outcome and summary columns to calls table if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='calls' AND column_name='outcome') THEN
    ALTER TABLE public.calls ADD COLUMN outcome TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='calls' AND column_name='ai_summary') THEN
    ALTER TABLE public.calls ADD COLUMN ai_summary TEXT;
  END IF;
END $$;