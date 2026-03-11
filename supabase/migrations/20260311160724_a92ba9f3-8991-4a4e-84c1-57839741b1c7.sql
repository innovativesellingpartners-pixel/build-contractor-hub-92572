
-- ============================================
-- PHASE 2.5: Security fixes + Child table team RLS
-- ============================================

-- PART 1: Fix critical portal token exposure
-- Drop the dangerous public SELECT policy on customer_portal_tokens
DROP POLICY IF EXISTS "Public read portal tokens by token value" ON public.customer_portal_tokens;

-- Drop public profile exposure via portal token
DROP POLICY IF EXISTS "Public read profiles via portal token" ON public.profiles;

-- Drop public customer PII exposure via portal token
DROP POLICY IF EXISTS "Public read customers via portal token" ON public.customers;

-- Fix portal_participants: remove the is_active OR branch that allows anon access
DROP POLICY IF EXISTS "Portal participants viewable by token holder or contractor" ON public.portal_participants;
CREATE POLICY "Portal participants viewable by contractor owner"
ON public.portal_participants FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM customer_portal_tokens cpt
  WHERE cpt.id = portal_participants.portal_token_id
  AND cpt.contractor_id = auth.uid()
));

-- Fix invoice_payment_sessions: require invoice ownership or team membership
DROP POLICY IF EXISTS "Payment sessions viewable by invoice owner or participant" ON public.invoice_payment_sessions;
DROP POLICY IF EXISTS "Anyone can create payment sessions for valid invoices" ON public.invoice_payment_sessions;
DROP POLICY IF EXISTS "Users can update their own payment sessions" ON public.invoice_payment_sessions;

CREATE POLICY "Invoice owner can view payment sessions"
ON public.invoice_payment_sessions FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM invoices
  WHERE invoices.id = invoice_payment_sessions.invoice_id
  AND public.is_contractor_member(invoices.user_id)
));

CREATE POLICY "Invoice owner can create payment sessions"
ON public.invoice_payment_sessions FOR INSERT TO authenticated
WITH CHECK (EXISTS (
  SELECT 1 FROM invoices
  WHERE invoices.id = invoice_payment_sessions.invoice_id
  AND public.is_contractor_member(invoices.user_id)
));

CREATE POLICY "Invoice owner can update payment sessions"
ON public.invoice_payment_sessions FOR UPDATE TO authenticated
USING (EXISTS (
  SELECT 1 FROM invoices
  WHERE invoices.id = invoice_payment_sessions.invoice_id
  AND public.is_contractor_member(invoices.user_id)
))
WITH CHECK (EXISTS (
  SELECT 1 FROM invoices
  WHERE invoices.id = invoice_payment_sessions.invoice_id
  AND public.is_contractor_member(invoices.user_id)
));

-- Allow anon payment session creation/view for public invoice payment links (via Edge Function validated token)
-- These are now handled by Edge Functions, not direct DB access

-- PART 2: Add team-aware RLS to child tables

-- estimate_assumptions: team SELECT
CREATE POLICY "Team members can view contractor estimate assumptions"
ON public.estimate_assumptions FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM estimates
  WHERE estimates.id = estimate_assumptions.estimate_id
  AND public.is_contractor_member(estimates.user_id)
));

-- estimate_exclusions: team SELECT
CREATE POLICY "Team members can view contractor estimate exclusions"
ON public.estimate_exclusions FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM estimates
  WHERE estimates.id = estimate_exclusions.estimate_id
  AND public.is_contractor_member(estimates.user_id)
));

-- estimate_photos: team SELECT
CREATE POLICY "Team members can view contractor estimate photos"
ON public.estimate_photos FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM estimates
  WHERE estimates.id = estimate_photos.estimate_id
  AND public.is_contractor_member(estimates.user_id)
));

-- estimate_document_attachments: team SELECT
CREATE POLICY "Team members can view contractor estimate doc attachments"
ON public.estimate_document_attachments FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM estimates
  WHERE estimates.id = estimate_document_attachments.estimate_id
  AND public.is_contractor_member(estimates.user_id)
));

-- estimate_drafts: team SELECT
CREATE POLICY "Team members can view contractor estimate drafts"
ON public.estimate_drafts FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM estimates e
  JOIN estimate_drafts ed ON ed.estimate_id = e.id
  WHERE ed.id = estimate_drafts.id
  AND public.is_contractor_member(e.user_id)
));

-- estimate_trades: team SELECT
CREATE POLICY "Team members can view contractor estimate trades"
ON public.estimate_trades FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM estimates
  WHERE estimates.id = estimate_trades.estimate_id
  AND public.is_contractor_member(estimates.user_id)
));

-- materials: team SELECT
CREATE POLICY "Team members can view contractor materials"
ON public.materials FOR SELECT TO authenticated
USING (public.is_contractor_member(user_id));

-- job_status_history: team SELECT
CREATE POLICY "Team members can view contractor job status history"
ON public.job_status_history FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM jobs
  WHERE jobs.id = job_status_history.job_id
  AND public.is_contractor_member(jobs.user_id)
));

-- crew_assignments: team SELECT
CREATE POLICY "Team members can view contractor crew assignments"
ON public.crew_assignments FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM jobs
  WHERE jobs.id = crew_assignments.job_id
  AND public.is_contractor_member(jobs.user_id)
));

-- crew_memberships: team SELECT
CREATE POLICY "Team members can view contractor crew memberships"
ON public.crew_memberships FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM crews
  WHERE crews.id = crew_memberships.crew_id
  AND public.is_contractor_member(crews.user_id)
));

-- contractor_documents: team SELECT
CREATE POLICY "Team members can view contractor documents"
ON public.contractor_documents FOR SELECT TO authenticated
USING (public.is_contractor_member(user_id));
