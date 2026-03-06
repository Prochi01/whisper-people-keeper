import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

const ProcessingOverlay = ({ processing }: { processing: boolean }) => {
  if (!processing) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex flex-col items-center justify-center px-6"
    >
      <motion.div
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        className="flex flex-col items-center gap-6"
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
        >
          <Loader2 className="w-10 h-10 text-primary" />
        </motion.div>
        <div className="text-center">
          <h2 className="text-xl font-display font-semibold text-foreground">Processing memory...</h2>
          <p className="text-sm text-muted-foreground mt-2">Transcribing and extracting details</p>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ProcessingOverlay;
