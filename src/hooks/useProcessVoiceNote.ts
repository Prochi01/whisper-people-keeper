import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface ExtractedData {
  name: string;
  company?: string;
  location?: string;
  interests?: string[];
  life_events?: string[];
  meeting_context?: string;
  notes?: string;
}

export const useProcessVoiceNote = () => {
  const [processing, setProcessing] = useState(false);
  const { user } = useAuth();

  const processVoiceNote = useCallback(async (audioBlob: Blob) => {
    if (!user) {
      toast.error('You must be logged in');
      return null;
    }

    setProcessing(true);

    try {
      // Upload audio
      const fileName = `${user.id}/${Date.now()}.webm`;
      const { error: uploadError } = await supabase.storage
        .from('voice-recordings')
        .upload(fileName, audioBlob);

      if (uploadError) throw uploadError;

      // Convert blob to base64
      const arrayBuffer = await audioBlob.arrayBuffer();
      const base64Audio = btoa(
        new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
      );

      // Send to edge function for transcription + extraction
      const { data, error } = await supabase.functions.invoke('process-voice-note', {
        body: { audio: base64Audio, audioUrl: fileName },
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
