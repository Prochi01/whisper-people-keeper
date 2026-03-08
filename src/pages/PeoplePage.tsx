import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Plus } from 'lucide-react';
import PersonCard from '@/components/PersonCard';
import AddPersonScreen from '@/components/AddPersonScreen';

interface PeoplePageProps {
  refreshKey?: number;
}

const PeoplePage = ({ refreshKey }: PeoplePageProps) => {
  const [people, setPeople] = useState<Tables<'people'>[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);

  const fetchPeople = async () => {
    const { data } = await supabase
      .from('people')
      .select('*')
      .order('last_interaction', { ascending: false });
    if (data) setPeople(data);
    setLoading(false);
  };

  useEffect(() => { fetchPeople(); }, [refreshKey]);

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
    <div className="min-h-screen bg-background pb-24">
      <AnimatePresence>
        {showAdd && (
          <AddPersonScreen onClose={() => setShowAdd(false)} onSaved={() => { setShowAdd(false); fetchPeople(); }} />
        )}
      </AnimatePresence>

      <header className="px-5 pt-6 pb-4 flex items-center justify-between">
        <h1 className="text-2xl font-display font-bold text-foreground">People</h1>
        <button
          onClick={() => setShowAdd(true)}
          className="w-9 h-9 rounded-lg bg-primary text-primary-foreground flex items-center justify-center"
        >
          <Plus className="w-5 h-5" />
        </button>
      </header>

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

      <div className="px-5">
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
            {filtered.map((person, i) => <PersonCard key={person.id} person={person} index={i} />)}
          </div>
        )}
      </div>
    </div>
  );
};

export default PeoplePage;
