import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { Pencil, Check, X } from 'lucide-react';

interface InlineEditProps {
  value: string;
  onSave: (value: string) => void;
  className?: string;
  placeholder?: string;
  multiline?: boolean;
}

const InlineEdit = ({ value, onSave, className = '', placeholder = '', multiline = false }: InlineEditProps) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  const handleSave = () => {
    onSave(draft);
    setEditing(false);
  };

  const handleCancel = () => {
    setDraft(value);
    setEditing(false);
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    }
    if (e.key === 'Escape') handleCancel();
  };

  if (editing) {
    return (
      <div className="flex items-center gap-1.5">
        {multiline ? (
          <textarea
            ref={inputRef as any}
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            className={`flex-1 px-2 py-1 rounded-lg border border-primary bg-card text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary resize-none ${className}`}
            rows={2}
          />
        ) : (
          <input
            ref={inputRef as any}
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            className={`flex-1 px-2 py-1 rounded-lg border border-primary bg-card text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary ${className}`}
          />
        )}
        <button onClick={handleSave} className="p-1 text-primary hover:bg-accent rounded">
          <Check className="w-4 h-4" />
        </button>
        <button onClick={handleCancel} className="p-1 text-muted-foreground hover:bg-muted rounded">
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setEditing(true)}
      className={`group flex items-center gap-2 text-left w-full hover:bg-accent/50 rounded-lg px-2 py-1 -mx-2 transition-colors ${className}`}
    >
      <span className={`flex-1 ${!value ? 'text-muted-foreground italic' : ''}`}>
        {value || placeholder}
      </span>
      <Pencil className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
    </button>
  );
};

export default InlineEdit;
