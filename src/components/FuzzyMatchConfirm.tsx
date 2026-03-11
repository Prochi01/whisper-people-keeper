import { motion } from 'framer-motion';
import { X } from 'lucide-react';

interface FuzzyMatchConfirmProps {
  existingName: string;
  spokenName: string;
  onConfirm: () => void;
  onCreateNew: () => void;
}

const FuzzyMatchConfirm = ({ existingName, spokenName, onConfirm, onCreateNew }: FuzzyMatchConfirmProps) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/30 backdrop-blur-sm"
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="w-full max-w-lg bg-card rounded-t-2xl border border-border p-5 pb-8 safe-bottom"
      >
        <h2 className="text-lg font-display font-semibold text-foreground mb-2">
          Did you mean {existingName}?
        </h2>
        <p className="text-sm text-muted-foreground mb-5">
          You said "{spokenName}" — we found a similar contact.
        </p>
        <div className="space-y-3">
          <button
            onClick={onConfirm}
            className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-display font-semibold"
          >
            Yes, add to {existingName}'s profile
          </button>
          <button
            onClick={onCreateNew}
            className="w-full h-12 rounded-xl bg-secondary text-secondary-foreground font-display font-medium"
          >
            No, create new person
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default FuzzyMatchConfirm;
