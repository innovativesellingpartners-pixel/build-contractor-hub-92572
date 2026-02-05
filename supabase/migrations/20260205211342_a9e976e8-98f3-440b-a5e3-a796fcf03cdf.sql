-- Add gc_contact_id field to estimates table for linking to GC contacts
ALTER TABLE public.estimates 
ADD COLUMN gc_contact_id UUID REFERENCES public.gc_contacts(id) ON DELETE SET NULL;

-- Create index for better query performance
CREATE INDEX idx_estimates_gc_contact_id ON public.estimates(gc_contact_id);