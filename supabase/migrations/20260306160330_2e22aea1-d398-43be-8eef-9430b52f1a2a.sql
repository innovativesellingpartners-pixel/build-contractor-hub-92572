
-- Drop the single-user constraint
ALTER TABLE public.subscriptions DROP CONSTRAINT subscriptions_user_id_key;

-- Add composite unique: one active subscription per user per addon_type
-- Using a unique index with COALESCE to handle NULL addon_type
CREATE UNIQUE INDEX subscriptions_user_addon_unique 
  ON public.subscriptions (user_id, COALESCE(addon_type, '__platform__')) 
  WHERE status = 'active';
