-- Update existing users with active subscriptions to have full pocketbot access
UPDATE profiles
SET pocketbot_full_access = true
WHERE user_id IN (
  SELECT user_id 
  FROM subscriptions 
  WHERE status = 'active'
);

-- Create function to grant pocketbot access when subscription is created or updated to active
CREATE OR REPLACE FUNCTION public.grant_pocketbot_access_on_subscription()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- If subscription is active, grant full pocketbot access
  IF NEW.status = 'active' THEN
    UPDATE public.profiles
    SET pocketbot_full_access = true
    WHERE user_id = NEW.user_id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for new subscriptions
CREATE TRIGGER on_subscription_created
  AFTER INSERT ON public.subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.grant_pocketbot_access_on_subscription();

-- Create trigger for subscription updates
CREATE TRIGGER on_subscription_updated
  AFTER UPDATE ON public.subscriptions
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION public.grant_pocketbot_access_on_subscription();