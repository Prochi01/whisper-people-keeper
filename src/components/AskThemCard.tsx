import { useState, useEffect } from 'react';
import { ArrowRight, X, Plus, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import InlineEdit from './InlineEdit';

interface AskThemCardProps {
  personId: string;
  notes: any[];
  name: string;
  company: string | null;
  customQuestions: string[];
  dismissedQuestions: string[];
  onUpdateCustomQuestions: (q: string[]) => void;
  onUpdateDismissedQuestions: (q: string[]) => void;
}

const AskThemCard = ({
  personId,
  notes,
  name,
  company,
  customQuestions,
  dismissedQuestions,
  onUpdateCustomQuestions,
  onUpdateDismissedQuestions,
}: AskThemCardProps) => {
  const [aiQuestions, setAiQuestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [newQuestion, setNewQuestion] = useState('');
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    if (notes.length === 0) return;
    setLoading(true);
    supabase.functions
      .invoke('generate-followups', { body: { notes, name, company } })
      .then(({ data, error }) => {
        if (!error && data?.questions) {
          setAiQuestions(data.questions);
        }
      })
      .finally(() => setLoading(false));
  }, [personId]);

  const visibleAiQuestions = aiQuestions.filter(q => !dismissedQuestions.includes(q));
  const allEmpty = visibleAiQuestions.length === 0 && customQuestions.length === 0 && !adding && !loading;

  const dismissAiQuestion = async (q: string) => {
    const updated = [...dismissedQuestions, q];
    await supabase.from('people').update({ dismissed_questions: updated } as any).eq('id', personId);
    onUpdateDismissedQuestions(updated);
  };

  const deleteCustomQuestion = async (index: number) => {
    const updated = customQuestions.filter((_, i) => i !== index);
    await supabase.from('people').update({ custom_questions: updated } as any).eq('id', personId);
    onUpdateCustomQuestions(updated);
  };

  const editCustomQuestion = async (index: number, value: string) => {
    const updated = [...customQuestions];
    updated[index] = value;
    await supabase.from('people').update({ custom_questions: updated } as any).eq('id', personId);
    onUpdateCustomQuestions(updated);
  };

  const addQuestion = async () => {
    const trimmed = newQuestion.trim();
    if (!trimmed) return;
    const updated = [...customQuestions, trimmed];
    await supabase.from('people').update({ custom_questions: updated } as any).eq('id', personId);
    onUpdateCustomQuestions(updated);
    setNewQuestion('');
    setAdding(false);
    toast.success('Question added');
  };

  function renderAddInput() {
    return (
      <div className="flex items-center gap-2 mt-2">
        <input
          type="text"
          value={newQuestion}
          onChange={(e) => setNewQuestion(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') addQuestion(); if (e.key === 'Escape') { setAdding(false); setNewQuestion(''); } }}
          placeholder="Type a question…"
          autoFocus
          className="flex-1 h-9 rounded-lg border border-input bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <button
          onClick={addQuestion}
          disabled={!newQuestion.trim()}
          className="h-9 px-3 rounded-lg bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50"
        >
          Save
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="rounded-xl p-4 bg-accent border border-primary/10">
        <h3 className="text-sm font-medium text-accent-foreground uppercase tracking-wider mb-2">Ask them</h3>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Thinking…</span>
        </div>
      </div>
    );
  }

  if (allEmpty) return null;

  return (
    <div className="rounded-xl p-4 bg-accent border border-primary/10">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-accent-foreground uppercase tracking-wider">Ask them</h3>
        <button onClick={() => setAdding(true)} className="p-1 text-primary hover:text-primary/80 rounded">
          <Plus className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-2">
        {visibleAiQuestions.map((q, i) => (
          <div key={`ai-${i}`} className="flex items-start gap-2 group">
            <ArrowRight className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
            <p className="text-sm text-foreground flex-1">{q}</p>
            <button
              onClick={() => dismissAiQuestion(q)}
              className="p-0.5 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
              title="Dismiss"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}

        {visibleAiQuestions.length > 0 && customQuestions.length > 0 && (
          <div className="h-2" />
        )}

        {customQuestions.map((q, i) => (
          <div key={`custom-${i}`} className="flex items-start gap-2 group">
            <ArrowRight className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <InlineEdit value={q} onSave={(v) => editCustomQuestion(i, v)} className="text-sm text-foreground" />
            </div>
            <button
              onClick={() => deleteCustomQuestion(i)}
              className="p-0.5 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
              title="Delete"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>

      {adding && renderAddInput()}
    </div>
  );
};

export default AskThemCard;
