-- Add trial tier support and trial end date tracking
ALTER TABLE public.subscriptions 
ADD COLUMN IF NOT EXISTS trial_end_date timestamp with time zone;

-- Add comment to explain trial tier
COMMENT ON COLUMN public.subscriptions.trial_end_date IS 'Date when the free trial expires (30 days from signup)';

-- Create index for trial expiration queries
CREATE INDEX IF NOT EXISTS idx_subscriptions_trial_end_date 
ON public.subscriptions(trial_end_date) 
WHERE trial_end_date IS NOT NULL;