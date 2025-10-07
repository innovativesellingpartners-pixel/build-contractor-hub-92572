-- Update the audit trigger to handle bootstrap super admin creation
-- Allow NULL admin_user_id for the first super admin assignment
DROP TRIGGER IF EXISTS on_user_role_change ON public.user_roles;

CREATE OR REPLACE FUNCTION public.log_admin_action()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Only log if there's an authenticated admin user
  -- This allows bootstrap creation of the first super admin
  IF auth.uid() IS NOT NULL THEN
    INSERT INTO public.admin_audit_log (admin_user_id, action, target_user_id, details)
    VALUES (
      auth.uid(),
      TG_OP,
      NEW.user_id,
      jsonb_build_object(
        'table', TG_TABLE_NAME,
        'old_role', OLD.role,
        'new_role', NEW.role,
        'timestamp', now()
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Recreate the trigger
CREATE TRIGGER on_user_role_change
  AFTER INSERT OR UPDATE ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.log_admin_action();