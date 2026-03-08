import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Search } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';
import { AVATAR_COLORS } from './BottomTabBar';
import { toast } from 'sonner';

interface MergeScreenProps {
  person: Tables<'people'>;
  onClose: () => void;
  onMerged: () => void;
}

const MergeScreen = ({ person, onClose, onMerged }: MergeScreenProps) => {
  const [people, setPeople] = useState<Tables<'people'>[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [merging, setMerging] = useState(false);

  useEffect(() => {
    const fetchPeople = async () => {
      const { data } = await supabase
        .from('people')
        .select('*')
        .neq('id', person.id)
        .order('name');
      if (data) setPeople(data);
    };
    fetchPeople();
  }, [person.id]);

  const getFirstName = (name: string) => name.split(' ')[0].toLowerCase();

  const isLikely = (other: Tables<'people'>) => {
    return (
      getFirstName(other.name) === getFirstName(person.name) ||
      (other.company && person.company && other.company.toLowerCase() === person.company.toLowerCase())
    );
  };

  const handleMerge = async () => {
    if (!selected) return;
    setMerging(true);

    const target = people.find(p => p.id === selected);
    if (!target) return;

    try {
      const mergedInterests = [...new Set([...(person.interests || []), ...(target.interests || [])])];
      const mergedLifeEvents = [...new Set([...(person.life_events || []), ...(target.life_events || [])])];
      const mergedNudges = [...((person as any).nudges || []), ...((target as any).nudges || [])];

      await supabase.from('people').update({
        company: person.company || target.company,
        location: person.location || target.location,
        interests: mergedInterests,
        life_events: mergedLifeEvents,
        ai_summary: person.ai_summary || target.ai_summary,
        nudges: mergedNudges,
      }).eq('id', person.id);

      // Move notes
      await supabase.from('voice_notes').update({ person_id: person.id }).eq('person_id', target.id);

      // Delete duplicate
      await supabase.from('people').delete().eq('id', target.id);

      toast.success(`Merged ${target.name} into ${person.name}`);
      onMerged();
    } catch (e) {
      toast.error('Failed to merge profiles');
    } finally {
      setMerging(false);
    }
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
        <h1 className="text-lg font-display font-semibold text-foreground">Merge Profile</h1>
        <button
          onClick={handleMerge}
          disabled={!selected || merging}
          className="text-sm font-medium text-primary disabled:opacity-40"
        >
          {merging ? 'Merging...' : 'Confirm'}
        </button>
      </header>

      <div className="px-5 mb-4">
        <p className="text-sm text-muted-foreground">
          Select a contact to merge into <strong>{person.name}</strong>
        </p>
      </div>

      <div className="flex-1 overflow-y-auto px-5 space-y-2">
        {people.map((p, i) => {
          const likely = isLikely(p);
          return (
            <button
              key={p.id}
              onClick={() => setSelected(p.id === selected ? null : p.id)}
              className={`w-full text-left rounded-xl p-4 border transition-colors flex items-center gap-3 ${
                p.id === selected
                  ? 'border-primary bg-accent'
                  : 'border-border bg-card'
              }`}
            >
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-white font-display font-semibold text-sm flex-shrink-0"
                style={{ backgroundColor: AVATAR_COLORS[i % AVATAR_COLORS.length] }}
              >
                {p.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-foreground truncate">{p.name}</span>
                  {likely && (
                    <span className="text-[10px] font-medium bg-primary/10 text-primary rounded-full px-2 py-0.5">Likely</span>
                  )}
                </div>
                {p.company && <p className="text-xs text-muted-foreground truncate">{p.company}</p>}
              </div>
              {p.id === selected && <Check className="w-5 h-5 text-primary flex-shrink-0" />}
            </button>
          );
        })}
      </div>
    </motion.div>
  );
};

export default MergeScreen;
