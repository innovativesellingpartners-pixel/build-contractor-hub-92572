ALTER TABLE public.estimates ALTER COLUMN public_token SET DEFAULT gen_random_uuid();

ALTER TABLE public.change_orders ALTER COLUMN public_token SET DEFAULT gen_random_uuid();

ALTER TABLE public.invoices ALTER COLUMN public_token SET DEFAULT gen_random_uuid();

UPDATE public.estimates SET public_token = gen_random_uuid() WHERE public_token IS NULL;

UPDATE public.change_orders SET public_token = gen_random_uuid() WHERE public_token IS NULL;

UPDATE public.invoices SET public_token = gen_random_uuid() WHERE public_token IS NULL;