import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import FloatingRecordButton from '@/components/FloatingRecordButton';
import RecordingOverlay from '@/components/RecordingOverlay';
import ProcessingOverlay from '@/components/ProcessingOverlay';
import { useVoiceRecorder } from '@/hooks/useVoiceRecorder';
import { useProcessVoiceNote } from '@/hooks/useProcessVoiceNote';

type NoteWithPerson = Tables<'voice_notes'> & { people: Tables<'people'> | null };

const TimelinePage = () => {
  const navigate = useNavigate();
  const [notes, setNotes] = useState<NoteWithPerson[]>([]);
  const [loading, setLoading] = useState(true);

  const { isRecording, duration, result, startRecording, stopRecording, cancelRecording, analyserNode } = useVoiceRecorder();
  const { processVoiceNote, processing } = useProcessVoiceNote();

  const fetchNotes = async () => {
    const { data } = await supabase
      .from('voice_notes')
      .select('*, people(*)')
      .order('created_at', { ascending: false });
    if (data) setNotes(data as NoteWithPerson[]);
    setLoading(false);
  };

  useEffect(() => { fetchNotes(); }, []);

  useEffect(() => {
    if (result) {
      processVoiceNote(result.audioBlob, result.transcript).then((data) => {
        if (data) fetchNotes();
      });
    }
  }, [result]);

  const handleRecord = async () => {
    try { await startRecording(); } catch {}
  };

  // Group by date
  const grouped = notes.reduce<Record<string, NoteWithPerson[]>>((acc, note) => {
    const day = format(new Date(note.created_at), 'yyyy-MM-dd');
    if (!acc[day]) acc[day] = [];
    acc[day].push(note);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-background safe-bottom">
      <RecordingOverlay isRecording={isRecording} duration={duration} analyserNode={analyserNode} onStop={stopRecording} onCancel={cancelRecording} />
      <ProcessingOverlay processing={processing} />

      <header className="px-5 pt-6 pb-4">
        <button onClick={() => navigate('/')} className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm">Home</span>
        </button>
        <h1 className="text-2xl font-display font-bold text-foreground">Timeline</h1>
      </header>

      <div className="px-5 pb-24">
        {loading ? (
          <div className="space-y-3">
            {[0, 1, 2].map(i => <div key={i} className="h-16 bg-muted rounded-xl animate-pulse" />)}
          </div>
        ) : Object.keys(grouped).length === 0 ? (
          <p className="text-center text-muted-foreground py-12">No memories recorded yet</p>
        ) : (
          Object.entries(grouped).map(([day, dayNotes]) => (
            <div key={day} className="mb-6">
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
                {format(new Date(day), 'EEEE, MMMM d')}
              </h3>
              <div className="space-y-3">
                {dayNotes.map((note, i) => (
                  <motion.button
                    key={note.id}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    onClick={() => note.person_id && navigate(`/person/${note.person_id}`)}
                    className="w-full text-left bg-card border border-border rounded-xl p-4 active:scale-[0.98] transition-transform"
                  >
                    {note.people && (
                      <span className="text-sm font-display font-semibold text-primary">{note.people.name}</span>
                    )}
                    <p className="text-sm text-foreground mt-1 line-clamp-2">{note.transcript}</p>
                    {note.meeting_context && (
                      <span className="inline-block mt-2 text-xs bg-secondary text-secondary-foreground rounded-full px-2 py-0.5">
                        {note.meeting_context}
                      </span>
                    )}
                  </motion.button>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {!isRecording && !processing && <FloatingRecordButton onClick={handleRecord} />}
    </div>
  );
};

export default TimelinePage;
