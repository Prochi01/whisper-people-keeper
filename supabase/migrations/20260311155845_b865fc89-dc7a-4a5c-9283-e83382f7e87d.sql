ALTER TABLE public.people ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE public.people ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE public.people ADD COLUMN IF NOT EXISTS contact_linked boolean DEFAULT false;