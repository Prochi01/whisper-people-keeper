import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useVoiceRecorder } from '@/hooks/useVoiceRecorder';
import { useProcessVoiceNote } from '@/hooks/useProcessVoiceNote';
import { Tables } from '@/integrations/supabase/types';
import { motion } from 'framer-motion';
import { Mic, Users, Clock, LogOut, Sparkles } from 'lucide-react';
import PersonCard from '@/components/PersonCard';
import RecordingOverlay from '@/components/RecordingOverlay';
import ProcessingOverlay from '@/components/ProcessingOverlay';
import FloatingRecordButton from '@/components/FloatingRecordButton';
import { useNavigate } from 'react-router-dom';

const HomePage = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [people, setPeople] = useState<Tables<'people'>[]>([]);
  const [loading, setLoading] = useState(true);

  const { isRecording, duration, audioBlob, startRecording, stopRecording, cancelRecording, analyserNode } = useVoiceRecorder();
  const { processVoiceNote, processing } = useProcessVoiceNote();

  const fetchPeople = async () => {
    const { data } = await supabase
      .from('people')
      .select('*')
      .order('last_interaction', { ascending: false })
      .limit(10);
    if (data) setPeople(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchPeople();
  }, []);

  useEffect(() => {
    if (audioBlob) {
      processVoiceNote(audioBlob).then((result) => {
        if (result) fetchPeople();
      });
    }
  }, [audioBlob]);

  const handleRecord = async () => {
    try {
      await startRecording();
    } catch {
      // Permission denied handled by browser
    }
  };

  return (
    <div className="min-h-screen bg-background safe-bottom">
      <RecordingOverlay
        isRecording={isRecording}
        duration={duration}
        analyserNode={analyserNode}
        onStop={stopRecording}
        onCancel={cancelRecording}
      />
      <ProcessingOverlay processing={processing} />

      {/* Header */}
      <header className="px-5 pt-6 pb-4 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <h1 className="text-2xl font-display font-bold text-foreground">Nudgy</h1>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">Your people memory</p>
        </div>
        <button onClick={signOut} className="p-2 rounded-lg text-muted-foreground hover:text-foreground transition-colors">
          <LogOut className="w-5 h-5" />
        </button>
      </header>

      {/* Main Record Button */}
      <div className="px-5 py-6">
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={handleRecord}
          className="w-full bg-primary text-primary-foreground rounded-2xl p-6 flex items-center gap-4 shadow-lg"
        >
          <div className="w-14 h-14 rounded-full bg-primary-foreground/20 flex items-center justify-center">
            <Mic className="w-7 h-7" />
          </div>
          <div className="text-left">
            <span className="text-lg font-display font-semibold block">Record Memory</span>
            <span className="text-sm opacity-80">Tap to capture a memory about someone</span>
          </div>
        </motion.button>
      </div>

      {/* Nav */}
      <div className="px-5 flex gap-3 mb-4">
        <button
          onClick={() => navigate('/people')}
          className="flex-1 bg-card border border-border rounded-xl p-3 flex items-center gap-3 active:scale-[0.98] transition-transform"
        >
          <Users className="w-5 h-5 text-primary" />
          <span className="text-sm font-medium text-foreground">All People</span>
        </button>
        <button
          onClick={() => navigate('/timeline')}
          className="flex-1 bg-card border border-border rounded-xl p-3 flex items-center gap-3 active:scale-[0.98] transition-transform"
        >
          <Clock className="w-5 h-5 text-primary" />
          <span className="text-sm font-medium text-foreground">Timeline</span>
        </button>
      </div>

      {/* Recent People */}
      <div className="px-5 pb-24">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">Recent People</h2>
        {loading ? (
          <div className="space-y-3">
            {[0, 1, 2].map(i => (
              <div key={i} className="h-20 bg-muted rounded-xl animate-pulse" />
            ))}
          </div>
        ) : people.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <div className="w-16 h-16 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
              <Mic className="w-7 h-7 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground">No memories yet</p>
            <p className="text-sm text-muted-foreground mt-1">Record your first memory to get started</p>
          </motion.div>
        ) : (
          <div className="space-y-3">
            {people.map((person, i) => (
              <PersonCard key={person.id} person={person} index={i} />
            ))}
          </div>
        )}
      </div>

      {!isRecording && !processing && <FloatingRecordButton onClick={handleRecord} />}
    </div>
  );
};

export default HomePage;
