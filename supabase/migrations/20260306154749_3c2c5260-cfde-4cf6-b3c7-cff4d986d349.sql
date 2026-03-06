
-- Add price_cents and is_addon columns to subscriptions for better tracking
ALTER TABLE public.subscriptions 
ADD COLUMN IF NOT EXISTS price_cents integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_free boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS addon_type text DEFAULT null,
ADD COLUMN IF NOT EXISTS clover_subscription_id text DEFAULT null,
ADD COLUMN IF NOT EXISTS clover_plan_id text DEFAULT null,
ADD COLUMN IF NOT EXISTS clover_customer_id text DEFAULT null,
ADD COLUMN IF NOT EXISTS cancelled_at timestamptz DEFAULT null;

-- Add comment explaining tier_id values
COMMENT ON COLUMN public.subscriptions.tier_id IS 'launch ($250/mo), chat_agent ($10/mo addon), forge_ai ($20/mo addon), free, bot_user, growth, accel';
COMMENT ON COLUMN public.subscriptions.is_free IS 'true when admin grants free access, false when paid through Clover';
COMMENT ON COLUMN public.subscriptions.addon_type IS 'null for platform subscriptions, chat_agent or forge_ai for add-ons';
