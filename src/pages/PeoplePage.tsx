import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';
import { motion } from 'framer-motion';
import { ArrowLeft, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import PersonCard from '@/components/PersonCard';
import FloatingRecordButton from '@/components/FloatingRecordButton';
import RecordingOverlay from '@/components/RecordingOverlay';
import ProcessingOverlay from '@/components/ProcessingOverlay';
import { useVoiceRecorder } from '@/hooks/useVoiceRecorder';
import { useProcessVoiceNote } from '@/hooks/useProcessVoiceNote';

const PeoplePage = () => {
  const navigate = useNavigate();
  const [people, setPeople] = useState<Tables<'people'>[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const { isRecording, duration, result, startRecording, stopRecording, cancelRecording, analyserNode } = useVoiceRecorder();
  const { processVoiceNote, processing } = useProcessVoiceNote();

  const fetchPeople = async () => {
    const { data } = await supabase
      .from('people')
      .select('*')
      .order('last_interaction', { ascending: false });
    if (data) setPeople(data);
    setLoading(false);
  };

  useEffect(() => { fetchPeople(); }, []);

  useEffect(() => {
    if (result) {
      processVoiceNote(result.audioBlob, result.transcript).then((data) => {
        if (data) fetchPeople();
      });
    }
  }, [result]);

  const handleRecord = async () => {
    try { await startRecording(); } catch {}
  };

  const filtered = people.filter(p => {
    const q = search.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      (p.company?.toLowerCase().includes(q)) ||
      (p.location?.toLowerCase().includes(q)) ||
      (p.interests?.some(i => i.toLowerCase().includes(q)))
    );
  });

  return (
    <div className="min-h-screen bg-background safe-bottom">
      <RecordingOverlay isRecording={isRecording} duration={duration} analyserNode={analyserNode} onStop={stopRecording} onCancel={cancelRecording} />
      <ProcessingOverlay processing={processing} />

      <header className="px-5 pt-6 pb-4">
        <button onClick={() => navigate('/')} className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm">Home</span>
        </button>
        <h1 className="text-2xl font-display font-bold text-foreground">People</h1>
      </header>

      {/* Search */}
      <div className="px-5 mb-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search people, companies, interests..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full h-12 pl-11 pr-4 rounded-xl bg-card border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>

      <div className="px-5 pb-24">
        {loading ? (
          <div className="space-y-3">
            {[0, 1, 2, 3].map(i => <div key={i} className="h-20 bg-muted rounded-xl animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-center text-muted-foreground py-12">
            {search ? 'No results found' : 'No people saved yet'}
          </p>
        ) : (
          <div className="space-y-3">
            {filtered.map((person, i) => (
              <PersonCard key={person.id} person={person} index={i} />
            ))}
          </div>
        )}
      </div>

      {!isRecording && !processing && <FloatingRecordButton onClick={handleRecord} />}
    </div>
  );
};

export default PeoplePage;
