
-- Create audio storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('audio', 'audio', false);

-- Allow authenticated users to upload their own audio files
CREATE POLICY "Users can upload audio" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'audio' AND (storage.foldername(name))[1] = 'voice-notes');

-- Allow authenticated users to read their own audio files
CREATE POLICY "Users can read own audio" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'audio' AND auth.uid()::text = (storage.foldername(name))[2]);

-- Allow authenticated users to delete their own audio files
CREATE POLICY "Users can delete own audio" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'audio' AND auth.uid()::text = (storage.foldername(name))[2]);
