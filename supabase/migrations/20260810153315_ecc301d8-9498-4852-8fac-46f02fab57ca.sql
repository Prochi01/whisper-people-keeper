DROP POLICY IF EXISTS "Users can upload audio" ON storage.objects;
CREATE POLICY "Users can upload audio"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'audio'
  AND (storage.foldername(name))[1] = 'voice-notes'
  AND (auth.uid())::text = (storage.foldername(name))[2]
);