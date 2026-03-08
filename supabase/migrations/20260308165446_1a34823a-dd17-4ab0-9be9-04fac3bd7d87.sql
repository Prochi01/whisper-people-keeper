
ALTER TABLE public.people ADD COLUMN IF NOT EXISTS nudges jsonb DEFAULT '[]'::jsonb;
ALTER TABLE public.voice_notes ADD COLUMN IF NOT EXISTS auto_nudges jsonb DEFAULT '[]'::jsonb;
