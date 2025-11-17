-- Add pocketbot full access field to profiles
ALTER TABLE public.profiles 
ADD COLUMN pocketbot_full_access BOOLEAN DEFAULT false NOT NULL;

-- Add comment to explain the column
COMMENT ON COLUMN public.profiles.pocketbot_full_access IS 'When true, user has unlimited pocketbot access without subscription';

-- Create index for faster lookups
CREATE INDEX idx_profiles_pocketbot_full_access ON public.profiles(pocketbot_full_access) WHERE pocketbot_full_access = true;