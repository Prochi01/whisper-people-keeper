import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Tables } from '@/integrations/supabase/types';
import { motion } from 'framer-motion';
import { Mic, Sparkles } from 'lucide-react';
import PersonCard from '@/components/PersonCard';
import { useNavigate } from 'react-router-dom';

interface HomePageProps {
  refreshKey?: number;
}

const HomePage = ({ refreshKey }: HomePageProps) => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [people, setPeople] = useState<Tables<'people'>[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPeople = async () => {
    const { data } = await supabase
      .from('people')
      .select('*')
      .order('last_interaction', { ascending: false })
      .limit(10);
    if (data) setPeople(data);
    setLoading(false);
  };

  useEffect(() => { fetchPeople(); }, [refreshKey]);

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="px-5 pt-6 pb-4 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <h1 className="text-2xl font-display font-bold text-foreground">Prochi</h1>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">Your people memory</p>
        </div>
        <button onClick={signOut} className="p-2 rounded-lg text-muted-foreground hover:text-foreground transition-colors">
          <LogOut className="w-5 h-5" />
        </button>
      </header>

      {/* Main Record Button */}
      <div className="px-5 py-6">
        <motion.div
          className="w-full bg-primary text-primary-foreground rounded-2xl p-6 flex items-center gap-4 shadow-lg cursor-default"
        >
          <div className="w-14 h-14 rounded-full bg-primary-foreground/20 flex items-center justify-center">
            <Mic className="w-7 h-7" />
          </div>
          <div className="text-left">
            <span className="text-lg font-display font-semibold block">Record Memory</span>
            <span className="text-sm opacity-80">Tap the mic button below to capture</span>
          </div>
        </motion.div>
      </div>

      {/* Recent People */}
      <div className="px-5">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">Recent People</h2>
        {loading ? (
          <div className="space-y-3">
            {[0, 1, 2].map(i => <div key={i} className="h-20 bg-muted rounded-xl animate-pulse" />)}
          </div>
        ) : people.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12">
            <div className="w-16 h-16 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
              <Mic className="w-7 h-7 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground">No memories yet</p>
            <p className="text-sm text-muted-foreground mt-1">Record your first memory to get started</p>
          </motion.div>
        ) : (
          <div className="space-y-3">
            {people.map((person, i) => <PersonCard key={person.id} person={person} index={i} />)}
          </div>
        )}
      </div>
    </div>
  );
};

export default HomePage;
