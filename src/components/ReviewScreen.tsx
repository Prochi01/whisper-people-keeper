import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Bell } from 'lucide-react';
import { ReviewData, ExtractedData, AutoNudge } from '@/hooks/useProcessVoiceNote';
import InlineEdit from '@/components/InlineEdit';

interface ReviewScreenProps {
  reviewData: ReviewData;
  onSave: (draft: ExtractedData, nudges: AutoNudge[]) => void;
  onDiscard: () => void;
}

const ReviewScreen = ({ reviewData, onSave, onDiscard }: ReviewScreenProps) => {
  const { extracted, auto_nudges } = reviewData;

  const [draft, setDraft] = useState<ExtractedData>({
    ...extracted,
    interests: extracted.interests || [],
    life_events: extracted.life_events || [],
    nudges: extracted.nudges || [],
  });
  const [draftNudges, setDraftNudges] = useState<AutoNudge[]>(auto_nudges || []);

  const patch = (field: keyof ExtractedData, value: any) => {
    setDraft(prev => ({ ...prev, [field]: value }));
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-background flex flex-col"
    >
      <header className="px-5 pt-6 pb-4 flex items-center justify-between">
        <button onClick={onDiscard} className="p-2 text-muted-foreground hover:text-foreground">
          <X className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-display font-semibold text-foreground">Review Memory</h1>
        <div className="w-9" />
      </header>

      <div className="flex-1 overflow-y-auto px-5 pb-32">
        {/* Person Name */}
        <div className="bg-card border border-border rounded-xl p-4 mb-4">
          <InlineEdit
            value={draft.name || ''}
            onSave={v => patch('name', v)}
            className="text-xl font-display font-bold"
            placeholder="Name (required)"
          />
          <div className="mt-1">
            <InlineEdit
              value={draft.company || ''}
              onSave={v => patch('company', v || null)}
              className="text-sm text-muted-foreground"
              placeholder="Company — none detected"
            />
          </div>
          <InlineEdit
            value={draft.location || ''}
            onSave={v => patch('location', v || null)}
            className="text-sm text-muted-foreground"
            placeholder="Location — none detected"
          />
        </div>

        {/* Extracted Details */}
        <div className="bg-card border border-border rounded-xl p-4 mb-4 space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Extracted Details</h3>

          <div>
            <p className="text-xs text-muted-foreground mb-1">Interests</p>
            <InlineEdit
              value={(draft.interests || []).join(', ')}
              onSave={v => patch('interests', v ? v.split(',').map(s => s.trim()).filter(Boolean) : [])}
              placeholder="None detected — tap to add"
            />
          </div>

          <div>
            <p className="text-xs text-muted-foreground mb-1">Life Events</p>
            <InlineEdit
              value={(draft.life_events || []).join(', ')}
              onSave={v => patch('life_events', v ? v.split(',').map(s => s.trim()).filter(Boolean) : [])}
              placeholder="None detected — tap to add"
            />
          </div>

          <div>
            <p className="text-xs text-muted-foreground mb-1">Context</p>
            <InlineEdit
              value={draft.meeting_context || ''}
              onSave={v => patch('meeting_context', v || null)}
              placeholder="None detected — tap to add"
            />
          </div>

          <div>
            <p className="text-xs text-muted-foreground mb-1">Summary</p>
            <InlineEdit
              value={draft.summary || ''}
              onSave={v => patch('summary', v || undefined)}
              placeholder="None detected — tap to add"
            />
          </div>

          <div>
            <p className="text-xs text-muted-foreground mb-1">Notes</p>
            <InlineEdit
              value={draft.notes || ''}
              onSave={v => patch('notes', v)}
              placeholder="None detected — tap to add"
              multiline
            />
          </div>
        </div>

        {/* Auto Nudges */}
        {draftNudges.length > 0 && (
          <div className="rounded-xl p-4 mb-4 border" style={{ backgroundColor: 'hsl(38 92% 95%)', borderColor: 'hsl(38 92% 80%)' }}>
            <div className="flex items-center gap-2 mb-2">
              <Bell className="w-4 h-4" style={{ color: 'hsl(38 92% 40%)' }} />
              <span className="text-sm font-medium font-display" style={{ color: 'hsl(38 92% 30%)' }}>Prochi detected</span>
            </div>
            {draftNudges.map((nudge, idx) => (
              <div key={idx} className="mt-1 flex items-start justify-between gap-2">
                <div className="flex-1">
                  <p className="text-sm font-medium" style={{ color: 'hsl(38 92% 20%)' }}>{nudge.note}</p>
                  <p className="text-xs" style={{ color: 'hsl(38 92% 40%)' }}>Reminder set for {nudge.date}</p>
                </div>
                <button
                  onClick={() => setDraftNudges(prev => prev.filter((_, j) => j !== idx))}
                  className="p-1 rounded hover:bg-black/5"
                >
                  <X className="w-3.5 h-3.5" style={{ color: 'hsl(38 92% 40%)' }} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Transcript */}
        <div className="bg-card border border-border rounded-xl p-4">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-2">Transcript</h3>
          <p className="text-sm text-foreground leading-relaxed">{reviewData.transcript}</p>
        </div>
      </div>

      {/* Save Button */}
      <div className="fixed bottom-0 left-0 right-0 p-5 bg-background border-t border-border safe-bottom">
        <button
          onClick={() => onSave(draft, draftNudges)}
          disabled={!draft.name?.trim()}
          className="w-full h-14 rounded-xl bg-primary text-primary-foreground font-display font-semibold text-lg flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <Check className="w-5 h-5" />
          Save Memory
        </button>
      </div>
    </motion.div>
  );
};

export default ReviewScreen;
