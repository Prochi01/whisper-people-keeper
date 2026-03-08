import { useState, useRef, useEffect } from 'react';
import { motion, PanInfo } from 'framer-motion';
import { Bell, X, Plus, Calendar } from 'lucide-react';
import { addWeeks, addMonths, addYears, setMonth, format } from 'date-fns';

interface Nudge {
  date: string;
  isoDate: string;
  note: string;
  auto?: boolean;
}

interface NudgeSchedulerProps {
  nudges: Nudge[];
  onSave: (nudge: Nudge) => void;
  onDelete: (index: number) => void;
  onClose: () => void;
}

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];

function parseNaturalDate(input: string): Date | null {
  const lower = input.toLowerCase().trim();
  const now = new Date();

  const weekMatch = lower.match(/in\s+(\d+)\s+week/);
  if (weekMatch) return addWeeks(now, parseInt(weekMatch[1]));

  const monthMatch = lower.match(/in\s+(\d+)\s+month/);
  if (monthMatch) return addMonths(now, parseInt(monthMatch[1]));

  const yearMatch = lower.match(/in\s+(\d+)\s+year/);
  if (yearMatch) return addYears(now, parseInt(yearMatch[1]));

  if (lower === 'next month') return addMonths(now, 1);
  if (lower === 'next year') return addYears(now, 1);
  if (lower === 'fortnight' || lower === 'in a fortnight') return addWeeks(now, 2);

  for (let i = 0; i < 12; i++) {
    if (lower.includes(MONTH_NAMES[i].toLowerCase()) || lower.includes(`in ${MONTH_NAMES[i].toLowerCase()}`)) {
      let target = setMonth(now, i);
      target.setDate(1);
      if (target <= now) target = addYears(target, 1);
      return target;
    }
  }

  return null;
}

const QUICK_CHIPS = [
  { label: 'In 2 weeks', value: 'in 2 weeks' },
  { label: 'Next month', value: 'next month' },
  { label: 'In 3 months', value: 'in 3 months' },
  { label: 'In September', value: 'in September' },
  { label: 'Next year', value: 'next year' },
];

const SwipeToDelete = ({ children, onDelete }: { children: React.ReactNode; onDelete: () => void }) => {
  const [dragX, setDragX] = useState(0);

  return (
    <div className="relative overflow-hidden rounded-xl">
      <div className="absolute inset-y-0 right-0 w-24 bg-destructive flex items-center justify-center">
        <span className="text-destructive-foreground text-sm font-medium">Delete</span>
      </div>
      <motion.div
        drag="x"
        dragConstraints={{ left: -100, right: 0 }}
        dragElastic={0.1}
        onDrag={(_, info: PanInfo) => setDragX(info.offset.x)}
        onDragEnd={(_, info: PanInfo) => {
          if (info.offset.x < -80) onDelete();
          setDragX(0);
        }}
        className="relative bg-card z-10"
      >
        {children}
      </motion.div>
    </div>
  );
};

const NudgeScheduler = ({ nudges, onSave, onDelete, onClose }: NudgeSchedulerProps) => {
  const [dateInput, setDateInput] = useState('');
  const [noteInput, setNoteInput] = useState('');
  const [resolvedDate, setResolvedDate] = useState<Date | null>(null);

  useEffect(() => {
    if (dateInput) {
      setResolvedDate(parseNaturalDate(dateInput));
    } else {
      setResolvedDate(null);
    }
  }, [dateInput]);

  const handleChip = (value: string) => {
    setDateInput(value);
  };

  const handleSave = () => {
    if (!resolvedDate) return;
    onSave({
      date: format(resolvedDate, 'd MMMM yyyy'),
      isoDate: resolvedDate.toISOString(),
      note: noteInput || 'Follow up',
    });
    setDateInput('');
    setNoteInput('');
    setResolvedDate(null);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-background flex flex-col"
    >
      <header className="px-5 pt-6 pb-4 flex items-center justify-between">
        <button onClick={onClose} className="text-sm text-muted-foreground">Cancel</button>
        <h1 className="text-lg font-display font-semibold text-foreground">Schedule Nudge</h1>
        <div className="w-12" />
      </header>

      <div className="flex-1 overflow-y-auto px-5">
        {/* Quick chips */}
        <div className="flex flex-wrap gap-2 mb-4">
          {QUICK_CHIPS.map(chip => (
            <button
              key={chip.value}
              onClick={() => handleChip(chip.value)}
              className={`text-sm rounded-full px-3 py-1.5 border transition-colors ${
                dateInput === chip.value
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-card border-border text-foreground'
              }`}
            >
              {chip.label}
            </button>
          ))}
        </div>

        {/* Date input */}
        <input
          type="text"
          value={dateInput}
          onChange={e => setDateInput(e.target.value)}
          placeholder='e.g. "in 3 months" or "next September"'
          className="w-full h-12 px-4 rounded-xl bg-card border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring mb-3"
        />

        {/* Live preview */}
        {resolvedDate && (
          <div className="flex items-center gap-2 mb-4 px-1">
            <Calendar className="w-4 h-4 text-primary" />
            <span className="text-sm text-primary font-medium">
              Nudge scheduled for {format(resolvedDate, 'd MMMM yyyy')}
            </span>
          </div>
        )}

        {/* Note */}
        <input
          type="text"
          value={noteInput}
          onChange={e => setNoteInput(e.target.value)}
          placeholder="Note (e.g. Ask about the new office)"
          className="w-full h-12 px-4 rounded-xl bg-card border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring mb-4"
        />

        {/* Save */}
        <button
          onClick={handleSave}
          disabled={!resolvedDate}
          className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-display font-semibold flex items-center justify-center gap-2 disabled:opacity-40 mb-6"
        >
          <Plus className="w-4 h-4" />
          Add Nudge
        </button>

        {/* Existing nudges */}
        {nudges.length > 0 && (
          <>
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">Scheduled Nudges</h3>
            <div className="space-y-2">
              {nudges.map((nudge, i) => (
                <SwipeToDelete key={i} onDelete={() => onDelete(i)}>
                  <div className="border border-border rounded-xl p-4">
                    <div className="flex items-center gap-2">
                      <Bell className="w-4 h-4 text-primary" />
                      <span className="text-sm font-medium text-foreground">{nudge.note}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{nudge.date}</p>
                  </div>
                </SwipeToDelete>
              ))}
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
};

export default NudgeScheduler;
