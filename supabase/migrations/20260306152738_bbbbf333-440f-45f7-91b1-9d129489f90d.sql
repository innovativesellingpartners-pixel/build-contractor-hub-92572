
CREATE TABLE IF NOT EXISTS public.pocketbot_payment_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  clover_session_id text NOT NULL,
  amount integer NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  activated_at timestamptz
);

ALTER TABLE public.pocketbot_payment_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own pocketbot sessions"
  ON public.pocketbot_payment_sessions
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
