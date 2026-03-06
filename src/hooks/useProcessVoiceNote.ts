import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export const useProcessVoiceNote = () => {
  const [processing, setProcessing] = useState(false);
  const { user } = useAuth();

  const processVoiceNote = useCallback(async (audioBlob: Blob, transcript: string) => {
    if (!user) {
      toast.error('You must be logged in');
      return null;
    }

    if (!transcript) {
      toast.error('No speech detected. Please try again.');
      return null;
    }

    setProcessing(true);

    try {
      // Upload audio
      const fileName = `${user.id}/${Date.now()}.webm`;
      const { error: uploadError } = await supabase.storage
        .from('voice-recordings')
        .upload(fileName, audioBlob);

      if (uploadError) {
        console.error('Upload error:', uploadError);
        // Continue even if upload fails - transcript is more important
      }

      // Send transcript to edge function for AI extraction
      const { data, error } = await supabase.functions.invoke('process-voice-note', {
        body: { transcript, audioUrl: fileName },
      });

      if (error) throw error;

      toast.success(`Memory saved for ${data.person_name || 'someone'}!`);
      return data;
    } catch (error: any) {
      console.error('Error processing voice note:', error);
      toast.error('Failed to process recording. Please try again.');
      return null;
    } finally {
      setProcessing(false);
    }
  }, [user]);

  return { processVoiceNote, processing };
};
