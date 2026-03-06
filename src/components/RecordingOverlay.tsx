import { motion } from 'framer-motion';
import { Mic, Square, X } from 'lucide-react';
import WaveformVisualizer from './WaveformVisualizer';

interface RecordingOverlayProps {
  isRecording: boolean;
  duration: number;
  analyserNode: AnalyserNode | null;
  onStop: () => void;
  onCancel: () => void;
}

const formatDuration = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
};

const RecordingOverlay = ({ isRecording, duration, analyserNode, onStop, onCancel }: RecordingOverlayProps) => {
  if (!isRecording) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex flex-col items-center justify-center px-6"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="flex flex-col items-center gap-8 w-full max-w-sm"
      >
        <div className="flex items-center gap-3">
          <motion.div
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
            className="w-3 h-3 rounded-full bg-destructive"
          />
          <span className="text-lg font-display font-medium text-foreground">Recording</span>
        </div>

        <span className="text-4xl font-display font-bold text-foreground tabular-nums">
          {formatDuration(duration)}
        </span>

        <WaveformVisualizer analyserNode={analyserNode} isRecording={isRecording} />

        <div className="flex items-center gap-6 mt-8">
          <button
            onClick={onCancel}
            className="w-16 h-16 rounded-full bg-muted flex items-center justify-center active:scale-95 transition-transform"
          >
            <X className="w-6 h-6 text-muted-foreground" />
          </button>

          <button
            onClick={onStop}
            className="w-20 h-20 rounded-full bg-primary flex items-center justify-center active:scale-95 transition-transform shadow-lg"
          >
            <Square className="w-7 h-7 text-primary-foreground fill-current" />
          </button>
        </div>

        <p className="text-sm text-muted-foreground mt-4">Speak your memory about a person</p>
      </motion.div>
    </motion.div>
  );
};

export default RecordingOverlay;
