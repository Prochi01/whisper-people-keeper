import { motion } from 'framer-motion';
import { Mic } from 'lucide-react';

interface FloatingRecordButtonProps {
  onClick: () => void;
}

const FloatingRecordButton = ({ onClick }: FloatingRecordButtonProps) => {
  return (
    <motion.button
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.2 }}
      whileTap={{ scale: 0.9 }}
      onClick={onClick}
      className="fixed bottom-6 right-6 z-40 w-16 h-16 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center animate-pulse-record safe-bottom"
      aria-label="Record memory"
    >
      <Mic className="w-7 h-7" />
    </motion.button>
  );
};

export default FloatingRecordButton;
