-- Allow contractors to insert their own phone numbers
CREATE POLICY "Contractors can insert own phone numbers"
ON public.phone_numbers
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = contractor_id);