import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export interface ExtractedData {
  name: string;
  company?: string | null;
  location?: string | null;
  interests?: string[];
  life_events?: string[];
  meeting_context?: string | null;
  notes?: string;
  summary?: string;
  nudges?: AutoNudge[];
}

export interface AutoNudge {
  date: string;
  isoDate: string;
  note: string;
  auto: boolean;
}

export interface ReviewData {
  extracted: ExtractedData;
  person_name: string;
  auto_nudges: AutoNudge[];
  transcript: string;
  audioUrl: string | null;
  audioBlob: Blob | null;
}

export const useProcessVoiceNote = () => {
  const [processing, setProcessing] = useState(false);
  const [reviewData, setReviewData] = useState<ReviewData | null>(null);
  const { user } = useAuth();

  const transcribeAndExtract = useCallback(async (audioBlob: Blob) => {
    if (!user) {
      toast.error('You must be logged in');
      return null;
    }

    setProcessing(true);

    try {
      // Upload audio to storage for backup
      const fileName = `${user.id}/${Date.now()}.webm`;

      // Transcribe with Whisper
      const formData = new FormData();
      formData.append('audio', audioBlob, 'audio.webm');

      const transcribeUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/transcribe`;
      const transcribeRes = await fetch(transcribeUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: formData,
      });

      if (!transcribeRes.ok) throw new Error('Transcription failed');
      const { transcript } = await transcribeRes.json();

      if (!transcript) {
        toast.error('No speech detected. Please try again.');
        return null;
      }

      // Extract with Lovable AI
      const { data, error } = await supabase.functions.invoke('process-voice-note', {
        body: { transcript, audioUrl: fileName },
      });

      if (error) throw error;

      const review: ReviewData = {
        extracted: data.extracted,
        person_name: data.person_name,
        auto_nudges: data.auto_nudges || [],
        transcript,
        audioUrl: fileName,
        audioBlob,
      };

      setReviewData(review);
      return review;
    } catch (error: any) {
      console.error('Error processing voice note:', error);
      toast.error('Failed to process recording. Please try again.');
      return null;
    } finally {
      setProcessing(false);
    }
  }, [user]);

  const saveMemory = useCallback(async (review: ReviewData) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase.functions.invoke('save-memory', {
        body: {
          extracted: review.extracted,
          transcript: review.transcript,
          audioUrl: review.audioUrl,
          auto_nudges: review.auto_nudges,
        },
      });

      if (error) throw error;

      const nudgeText = data.has_nudges ? ' · 🔔 Nudge set' : '';
      toast.success(`Memory added to ${data.person_name}${nudgeText}`);
      setReviewData(null);
      return data;
    } catch (error: any) {
      console.error('Error saving memory:', error);
      toast.error('Failed to save memory. Please try again.');
      return null;
    }
  }, [user]);

  const discardReview = useCallback(() => {
    setReviewData(null);
  }, []);

  return { transcribeAndExtract, saveMemory, discardReview, processing, reviewData };
};
