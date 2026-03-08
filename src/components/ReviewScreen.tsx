import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Bell } from 'lucide-react';
import { ReviewData, AutoNudge } from '@/hooks/useProcessVoiceNote';

interface ReviewScreenProps {
  reviewData: ReviewData;
  onSave: () => void;
  onDiscard: () => void;
}

const ReviewScreen = ({ reviewData, onSave, onDiscard }: ReviewScreenProps) => {
  const { extracted, auto_nudges } = reviewData;

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
          <h2 className="text-xl font-display font-bold text-foreground">{extracted.name || 'Unknown'}</h2>
          {extracted.company && <p className="text-sm text-muted-foreground mt-1">{extracted.company}</p>}
          {extracted.location && <p className="text-sm text-muted-foreground">{extracted.location}</p>}
        </div>

        {/* Extracted Details */}
        <div className="bg-card border border-border rounded-xl p-4 mb-4 space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Extracted Details</h3>
          
          {extracted.interests && extracted.interests.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Interests</p>
              <div className="flex flex-wrap gap-1.5">
                {extracted.interests.map((i, idx) => (
                  <span key={idx} className="text-xs bg-accent text-accent-foreground rounded-full px-2.5 py-1">{i}</span>
                ))}
              </div>
            </div>
          )}

          {extracted.life_events && extracted.life_events.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Life Events</p>
              <div className="flex flex-wrap gap-1.5">
                {extracted.life_events.map((e, idx) => (
                  <span key={idx} className="text-xs bg-secondary text-secondary-foreground rounded-full px-2.5 py-1">{e}</span>
                ))}
              </div>
            </div>
          )}

          {extracted.meeting_context && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Context</p>
              <p className="text-sm text-foreground">{extracted.meeting_context}</p>
            </div>
          )}

          {extracted.summary && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Summary</p>
              <p className="text-sm text-foreground">{extracted.summary}</p>
            </div>
          )}
        </div>

        {/* Auto Nudges */}
        {auto_nudges.length > 0 && (
          <div className="rounded-xl p-4 mb-4 border" style={{ backgroundColor: 'hsl(38 92% 95%)', borderColor: 'hsl(38 92% 80%)' }}>
            <div className="flex items-center gap-2 mb-2">
              <Bell className="w-4 h-4" style={{ color: 'hsl(38 92% 40%)' }} />
              <span className="text-sm font-medium font-display" style={{ color: 'hsl(38 92% 30%)' }}>Nudgy detected</span>
            </div>
            {auto_nudges.map((nudge, idx) => (
              <div key={idx} className="mt-1">
                <p className="text-sm font-medium" style={{ color: 'hsl(38 92% 20%)' }}>{nudge.note}</p>
                <p className="text-xs" style={{ color: 'hsl(38 92% 40%)' }}>Reminder set for {nudge.date}</p>
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
          onClick={onSave}
          className="w-full h-14 rounded-xl bg-primary text-primary-foreground font-display font-semibold text-lg flex items-center justify-center gap-2"
        >
          <Check className="w-5 h-5" />
          Save Memory
        </button>
      </div>
    </motion.div>
  );
};

export default ReviewScreen;
