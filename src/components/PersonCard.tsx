import { Tables } from '@/integrations/supabase/types';
import { formatDistanceToNow } from 'date-fns';
import { motion } from 'framer-motion';
import { Building2, MapPin, ChevronRight, HelpCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AVATAR_COLORS } from './BottomTabBar';

interface PersonCardProps {
  person: Tables<'people'>;
  index: number;
}

const PersonCard = ({ person, index }: PersonCardProps) => {
  const navigate = useNavigate();
  const detail = person.company || person.location || (person.interests && person.interests.length > 0 ? person.interests[0] : null);
  const color = AVATAR_COLORS[index % AVATAR_COLORS.length];
  const hasCustomQuestions = ((person as any).custom_questions?.length ?? 0) > 0;

  return (
    <motion.button
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      onClick={() => navigate(`/person/${person.id}`)}
      className="w-full text-left bg-card rounded-xl p-4 flex items-center gap-4 border border-border active:scale-[0.98] transition-transform"
    >
      <div
        className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 text-white"
        style={{ backgroundColor: color }}
      >
        <span className="text-lg font-display font-semibold">
          {person.name.charAt(0).toUpperCase()}
        </span>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <h3 className="font-display font-semibold text-foreground truncate">{person.name}</h3>
          {hasCustomQuestions && (
            <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center" title="Has saved questions">
              <HelpCircle className="w-3 h-3 text-primary" />
            </span>
          )}
        </div>
        {detail && (
          <p className="text-sm text-muted-foreground truncate flex items-center gap-1 mt-0.5">
            {person.company && <Building2 className="w-3 h-3 flex-shrink-0" />}
            {!person.company && person.location && <MapPin className="w-3 h-3 flex-shrink-0" />}
            {detail}
          </p>
        )}
        <p className="text-xs text-muted-foreground mt-1">
          {formatDistanceToNow(new Date(person.last_interaction), { addSuffix: true })}
        </p>
      </div>

      <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
    </motion.button>
  );
};

export default PersonCard;