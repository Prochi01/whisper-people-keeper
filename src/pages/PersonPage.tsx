import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { ArrowLeft, MapPin, Building2, Heart, Calendar, Bell, GitMerge, ArrowRight } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import InlineEdit from '@/components/InlineEdit';
import AudioPlayer from '@/components/AudioPlayer';
import NudgeScheduler from '@/components/NudgeScheduler';
import MergeScreen from '@/components/MergeScreen';
import { AVATAR_COLORS } from '@/components/BottomTabBar';
import { toast } from 'sonner';

interface Nudge {
  date: string;
  isoDate: string;
  note: string;
  auto?: boolean;
}

const QUESTION_RULES: { pattern: RegExp; question: string | ((loc?: string | null) => string) }[] = [
  { pattern: /kids|children|child|baby/i, question: "How are the kids doing?" },
  { pattern: /pregnant|expecting/i, question: "How's the new baby?" },
  { pattern: /daughter|son|birthday/i, question: "How's your daughter doing — wasn't her birthday coming up?" },
  { pattern: /moved offices|new office/i, question: "How's the new office settling in?" },
  { pattern: /launch|launching/i, question: "How did the launch go?" },
  { pattern: /fundrais|funding|raise/i, question: "Any updates on the fundraise?" },
  { pattern: /hiring|recruit/i, question: "How's the hiring going?" },
  { pattern: /surf/i, question: "Been surfing lately?" },
  { pattern: /moved to|moving to|relocat/i, question: (loc) => `Settling in well in ${loc || 'the new place'}?` },
  { pattern: /marathon|running/i, question: "Still keeping up with the running?" },
  { pattern: /travel|trip/i, question: "How was the trip?" },
];

function generateQuestions(notes: Tables<'voice_notes'>[], person: Tables<'people'>): string[] {
  const allText = notes.map(n => n.transcript || '').join(' ');
  const questions: string[] = [];

  for (const rule of QUESTION_RULES) {
    if (questions.length >= 3) break;
    if (rule.pattern.test(allText)) {
      const q = typeof rule.question === 'function' ? rule.question(person.location) : rule.question;
      questions.push(q);
    }
  }

  if (questions.length === 0 && person.company) {
    questions.push(`How are things going at ${person.company}?`);
  }

  return questions.slice(0, 3);
}

const SwipeToDeleteBanner = ({ children, onDelete }: { children: React.ReactNode; onDelete: () => void }) => (
  <div className="relative overflow-hidden rounded-xl">
    <div className="absolute inset-y-0 right-0 w-24 bg-destructive flex items-center justify-center rounded-r-xl">
      <span className="text-destructive-foreground text-sm font-medium">Delete</span>
    </div>
    <motion.div
      drag="x"
      dragConstraints={{ left: -100, right: 0 }}
      dragElastic={0.1}
      onDragEnd={(_, info: PanInfo) => { if (info.offset.x < -80) onDelete(); }}
      className="relative z-10"
    >
      {children}
    </motion.div>
  </div>
);

const PersonPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [person, setPerson] = useState<(Tables<'people'> & { nudges?: Nudge[] }) | null>(null);
  const [notes, setNotes] = useState<Tables<'voice_notes'>[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNudgeScheduler, setShowNudgeScheduler] = useState(false);
  const [showMerge, setShowMerge] = useState(false);

  const fetchData = async () => {
    if (!id) return;
    const [personRes, notesRes] = await Promise.all([
      supabase.from('people').select('*').eq('id', id).single(),
      supabase.from('voice_notes').select('*').eq('person_id', id).order('created_at', { ascending: false }),
    ]);
    if (personRes.data) setPerson(personRes.data as any);
    if (notesRes.data) setNotes(notesRes.data);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [id]);

  const updateField = async (field: string, value: any) => {
    if (!person) return;
    await supabase.from('people').update({ [field]: value }).eq('id', person.id);
    setPerson(prev => prev ? { ...prev, [field]: value } : null);
  };

  const updateNoteTranscript = async (noteId: string, transcript: string) => {
    await supabase.from('voice_notes').update({ transcript }).eq('id', noteId);
    setNotes(prev => prev.map(n => n.id === noteId ? { ...n, transcript } : n));
  };

  const nudges: Nudge[] = (person as any)?.nudges || [];

  const handleSaveNudge = async (nudge: Nudge) => {
    const updated = [...nudges, nudge];
    await updateField('nudges', updated);
  };

  const handleDeleteNudge = async (index: number) => {
    const updated = nudges.filter((_, i) => i !== index);
    await updateField('nudges', updated);
  };

  const questions = person ? generateQuestions(notes, person) : [];
  const latestNote = notes[0];

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
    <div className="min-h-screen bg-background pb-24">
      <AnimatePresence>
        {showNudgeScheduler && (
          <NudgeScheduler nudges={nudges} onSave={handleSaveNudge} onDelete={handleDeleteNudge} onClose={() => setShowNudgeScheduler(false)} />
        )}
        {showMerge && (
          <MergeScreen person={person} onClose={() => setShowMerge(false)} onMerged={() => { setShowMerge(false); fetchData(); }} />
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="px-5 pt-6 pb-4">
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm">Back</span>
          </button>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowNudgeScheduler(true)} className="p-2 rounded-lg text-muted-foreground hover:text-foreground">
              <Bell className="w-5 h-5" />
            </button>
            <button onClick={() => setShowMerge(true)} className="p-2 rounded-lg text-muted-foreground hover:text-foreground">
              <GitMerge className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center text-white flex-shrink-0"
            style={{ backgroundColor: AVATAR_COLORS[0] }}
          >
            <span className="text-2xl font-display font-bold">{person.name.charAt(0)}</span>
          </div>
          <div className="flex-1 min-w-0">
            <InlineEdit
              value={person.name}
              onSave={v => updateField('name', v)}
              className="text-2xl font-display font-bold text-foreground"
            />
            <p className="text-sm text-muted-foreground">
              Last seen {formatDistanceToNow(new Date(person.last_interaction), { addSuffix: true })}
            </p>
          </div>
        </div>
      </header>

      <div className="px-5 space-y-4">
        {/* Nudge banners */}
        {nudges.map((nudge, i) => (
          <SwipeToDeleteBanner key={i} onDelete={() => handleDeleteNudge(i)}>
            <button
              onClick={() => setShowNudgeScheduler(true)}
              className="w-full text-left rounded-xl p-4 border"
              style={{ backgroundColor: 'hsl(38 92% 95%)', borderColor: 'hsl(38 92% 80%)' }}
            >
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4" style={{ color: 'hsl(38 92% 40%)' }} />
                <span className="text-sm font-medium" style={{ color: 'hsl(38 92% 30%)' }}>Nudge scheduled</span>
              </div>
              <p className="text-xs mt-1" style={{ color: 'hsl(38 92% 40%)' }}>{nudge.date} · {nudge.note}</p>
            </button>
          </SwipeToDeleteBanner>
        ))}

        {/* Before you meet */}
        {latestNote && (
          <div className="bg-card border border-border rounded-xl p-4">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-2">Before you meet</h3>
            <p className="text-sm text-foreground leading-relaxed">
              <span className="text-muted-foreground">Last memory from {format(new Date(latestNote.created_at), 'MMM d')}: </span>
              {latestNote.transcript}
            </p>
          </div>
        )}

        {/* Ask them */}
        {questions.length > 0 && (
          <div className="rounded-xl p-4 bg-accent border border-primary/10">
            <h3 className="text-sm font-medium text-accent-foreground uppercase tracking-wider mb-2">Ask them</h3>
            <div className="space-y-2">
              {questions.map((q, i) => (
                <div key={i} className="flex items-start gap-2">
                  <ArrowRight className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-foreground">{q}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Details */}
        <div className="space-y-2">
          <div className="flex items-center gap-3 text-sm">
            <Building2 className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            <InlineEdit value={person.company || ''} onSave={v => updateField('company', v || null)} placeholder="Add company" />
          </div>
          <div className="flex items-center gap-3 text-sm">
            <MapPin className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            <InlineEdit value={person.location || ''} onSave={v => updateField('location', v || null)} placeholder="Add location" />
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Heart className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            <InlineEdit
              value={(person.interests || []).join(', ')}
              onSave={v => updateField('interests', v.split(',').map(s => s.trim()).filter(Boolean))}
              placeholder="Add interests"
            />
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Calendar className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            <InlineEdit
              value={(person.life_events || []).join(', ')}
              onSave={v => updateField('life_events', v.split(',').map(s => s.trim()).filter(Boolean))}
              placeholder="Add life events"
            />
          </div>
        </div>

        {/* Summary */}
        {person.ai_summary !== undefined && (
          <div>
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-1">Summary</h3>
            <InlineEdit
              value={person.ai_summary || ''}
              onSave={v => updateField('ai_summary', v || null)}
              placeholder="Add summary"
              multiline
            />
          </div>
        )}

        {/* Memory Timeline */}
        <div>
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
                  <InlineEdit
                    value={note.transcript || ''}
                    onSave={v => updateNoteTranscript(note.id, v)}
                    className="text-sm text-foreground leading-relaxed"
                    multiline
                  />
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
      </div>
    </div>
  );
};

export default PersonPage;
