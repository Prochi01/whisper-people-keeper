import { useState } from 'react';
import { ArrowRight, X, Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import InlineEdit from './InlineEdit';

interface AskThemCardProps {
  personId: string;
  aiQuestions: string[];
  customQuestions: string[];
  dismissedQuestions: string[];
  onUpdate: (custom: string[], dismissed: string[]) => void;
}

const AskThemCard = ({
  personId,
  aiQuestions,
  customQuestions,
  dismissedQuestions,
  onUpdate,
}: AskThemCardProps) => {
  const [newQuestion, setNewQuestion] = useState('');
  const [adding, setAdding] = useState(false);

  const visibleAiQuestions = aiQuestions.filter(q => !dismissedQuestions.includes(q));
  const allEmpty = visibleAiQuestions.length === 0 && customQuestions.length === 0 && !adding;

  const persist = async (custom: string[], dismissed: string[]) => {
    await supabase
      .from('people')
      .update({ custom_questions: custom, dismissed_questions: dismissed } as any)
      .eq('id', personId);
    onUpdate(custom, dismissed);
  };

  const dismissAiQuestion = async (q: string) => {
    const updated = [...dismissedQuestions, q];
    await persist(customQuestions, updated);
  };

  const deleteCustomQuestion = async (index: number) => {
    const updated = customQuestions.filter((_, i) => i !== index);
    await persist(updated, dismissedQuestions);
  };

  const editCustomQuestion = async (index: number, value: string) => {
    const updated = [...customQuestions];
    updated[index] = value;
    await persist(updated, dismissedQuestions);
  };

  const addQuestion = async () => {
    const trimmed = newQuestion.trim();
    if (!trimmed) return;
    const updated = [...customQuestions, trimmed];
    await persist(updated, dismissedQuestions);
    setNewQuestion('');
    setAdding(false);
    toast.success('Question added');
  };

  if (allEmpty && !adding) {
    return (
      <div className="rounded-xl p-4 bg-accent border border-primary/10">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-accent-foreground uppercase tracking-wider">Ask them</h3>
          <button
            onClick={() => setAdding(true)}
            className="p-1 text-primary hover:text-primary/80 rounded"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
        {adding && renderAddInput()}
        <p className="text-sm text-muted-foreground">No questions yet</p>
      </div>
    );
  }

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

  return (
    <div className="rounded-xl p-4 bg-accent border border-primary/10">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-accent-foreground uppercase tracking-wider">Ask them</h3>
        <button
          onClick={() => setAdding(true)}
          className="p-1 text-primary hover:text-primary/80 rounded"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-2">
        {/* AI-generated questions */}
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

        {/* Custom questions */}
        {customQuestions.map((q, i) => (
          <div key={`custom-${i}`} className="flex items-start gap-2 group">
            <ArrowRight className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <InlineEdit
                value={q}
                onSave={(v) => editCustomQuestion(i, v)}
                className="text-sm text-foreground"
              />
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
