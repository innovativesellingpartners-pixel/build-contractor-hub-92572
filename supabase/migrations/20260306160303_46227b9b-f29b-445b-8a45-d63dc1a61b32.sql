
-- Drop and recreate billing_cycle check to include 'monthly'
ALTER TABLE public.subscriptions DROP CONSTRAINT subscriptions_billing_cycle_check;
ALTER TABLE public.subscriptions ADD CONSTRAINT subscriptions_billing_cycle_check 
  CHECK (billing_cycle = ANY (ARRAY['monthly'::text, 'quarterly'::text, 'yearly'::text]));

-- Drop and recreate tier_id check to include addon tier ids
ALTER TABLE public.subscriptions DROP CONSTRAINT subscriptions_tier_id_check;
ALTER TABLE public.subscriptions ADD CONSTRAINT subscriptions_tier_id_check 
  CHECK (tier_id = ANY (ARRAY['launch'::text, 'growth'::text, 'accel'::text, 'chat_agent'::text, 'forge_ai'::text]));
