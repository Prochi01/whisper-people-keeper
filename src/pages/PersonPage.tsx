import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';
import { motion } from 'framer-motion';
import { ArrowLeft, MapPin, Building2, Heart, Sparkles, Calendar } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import FloatingRecordButton from '@/components/FloatingRecordButton';
import RecordingOverlay from '@/components/RecordingOverlay';
import ProcessingOverlay from '@/components/ProcessingOverlay';
import { useVoiceRecorder } from '@/hooks/useVoiceRecorder';
import { useProcessVoiceNote } from '@/hooks/useProcessVoiceNote';

const PersonPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [person, setPerson] = useState<Tables<'people'> | null>(null);
  const [notes, setNotes] = useState<Tables<'voice_notes'>[]>([]);
  const [loading, setLoading] = useState(true);

  const { isRecording, duration, audioBlob, startRecording, stopRecording, cancelRecording, analyserNode } = useVoiceRecorder();
  const { processVoiceNote, processing } = useProcessVoiceNote();

  const fetchData = async () => {
    if (!id) return;
    const [personRes, notesRes] = await Promise.all([
      supabase.from('people').select('*').eq('id', id).single(),
      supabase.from('voice_notes').select('*').eq('person_id', id).order('created_at', { ascending: false }),
    ]);
    if (personRes.data) setPerson(personRes.data);
    if (notesRes.data) setNotes(notesRes.data);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [id]);

  useEffect(() => {
    if (audioBlob) {
      processVoiceNote(audioBlob).then((result) => {
        if (result) fetchData();
      });
    }
  }, [audioBlob]);

  const handleRecord = async () => {
    try { await startRecording(); } catch {}
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!person) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Person not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background safe-bottom">
      <RecordingOverlay isRecording={isRecording} duration={duration} analyserNode={analyserNode} onStop={stopRecording} onCancel={cancelRecording} />
      <ProcessingOverlay processing={processing} />

      {/* Header */}
      <header className="px-5 pt-6 pb-4">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm">Back</span>
        </button>

        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-2xl font-display font-bold text-primary">{person.name.charAt(0)}</span>
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">{person.name}</h1>
            <p className="text-sm text-muted-foreground">
              Last seen {formatDistanceToNow(new Date(person.last_interaction), { addSuffix: true })}
            </p>
          </div>
        </div>
      </header>

      {/* Quick Memory */}
      {person.ai_summary && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mx-5 mb-4">
          <div className="bg-primary/5 border border-primary/10 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary font-display">Quick Memory</span>
            </div>
            <p className="text-sm text-foreground leading-relaxed">{person.ai_summary}</p>
          </div>
        </motion.div>
      )}

      {/* Details */}
      <div className="px-5 mb-6 space-y-2">
        {person.company && (
          <div className="flex items-center gap-3 text-sm">
            <Building2 className="w-4 h-4 text-muted-foreground" />
            <span className="text-foreground">{person.company}</span>
          </div>
        )}
        {person.location && (
          <div className="flex items-center gap-3 text-sm">
            <MapPin className="w-4 h-4 text-muted-foreground" />
            <span className="text-foreground">{person.location}</span>
          </div>
        )}
        {person.interests && person.interests.length > 0 && (
          <div className="flex items-center gap-3 text-sm">
            <Heart className="w-4 h-4 text-muted-foreground" />
            <span className="text-foreground">{person.interests.join(', ')}</span>
          </div>
        )}
        {person.life_events && person.life_events.length > 0 && (
          <div className="flex items-center gap-3 text-sm">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <span className="text-foreground">{person.life_events.join(', ')}</span>
          </div>
        )}
      </div>

      {/* Memory Timeline */}
      <div className="px-5 pb-24">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">Memory Timeline</h2>
        {notes.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4">No memories recorded yet</p>
        ) : (
          <div className="space-y-4">
            {notes.map((note, i) => (
              <motion.div
                key={note.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="relative pl-6 border-l-2 border-border"
              >
                <div className="absolute left-[-5px] top-1 w-2 h-2 rounded-full bg-primary" />
                <p className="text-xs text-muted-foreground mb-1">
                  {format(new Date(note.created_at), 'MMM d, yyyy')}
                </p>
                <p className="text-sm text-foreground leading-relaxed">{note.transcript}</p>
                {note.meeting_context && (
                  <span className="inline-block mt-1 text-xs bg-secondary text-secondary-foreground rounded-full px-2 py-0.5">
                    {note.meeting_context}
                  </span>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {!isRecording && !processing && <FloatingRecordButton onClick={handleRecord} />}
    </div>
  );
};

export default PersonPage;
