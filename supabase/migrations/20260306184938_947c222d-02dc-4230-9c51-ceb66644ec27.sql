-- Create update timestamp function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- People table
CREATE TABLE public.people (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  company TEXT,
  location TEXT,
  interests TEXT[] DEFAULT '{}',
  life_events TEXT[] DEFAULT '{}',
  ai_summary TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_interaction TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.people ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own people" ON public.people FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own people" ON public.people FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own people" ON public.people FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own people" ON public.people FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_people_user_id ON public.people(user_id);
CREATE INDEX idx_people_name ON public.people(user_id, name);
CREATE INDEX idx_people_last_interaction ON public.people(user_id, last_interaction DESC);

CREATE TRIGGER update_people_updated_at BEFORE UPDATE ON public.people FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Voice notes table
CREATE TABLE public.voice_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  person_id UUID REFERENCES public.people(id) ON DELETE SET NULL,
  transcript TEXT,
  raw_transcript TEXT,
  audio_url TEXT,
  extracted_data JSONB DEFAULT '{}',
  meeting_context TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.voice_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own voice notes" ON public.voice_notes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own voice notes" ON public.voice_notes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own voice notes" ON public.voice_notes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own voice notes" ON public.voice_notes FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_voice_notes_user_id ON public.voice_notes(user_id);
CREATE INDEX idx_voice_notes_person_id ON public.voice_notes(person_id);
CREATE INDEX idx_voice_notes_created_at ON public.voice_notes(user_id, created_at DESC);

-- Storage bucket for audio files
INSERT INTO storage.buckets (id, name, public) VALUES ('voice-recordings', 'voice-recordings', false);

CREATE POLICY "Users can upload their own recordings" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'voice-recordings' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can view their own recordings" ON storage.objects FOR SELECT USING (bucket_id = 'voice-recordings' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can delete their own recordings" ON storage.objects FOR DELETE USING (bucket_id = 'voice-recordings' AND auth.uid()::text = (storage.foldername(name))[1]);