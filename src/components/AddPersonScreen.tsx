import { useState } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface AddPersonScreenProps {
  onClose: () => void;
  onSaved: () => void;
}

const AddPersonScreen = ({ onClose, onSaved }: AddPersonScreenProps) => {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [location, setLocation] = useState('');
  const [interests, setInterests] = useState('');
  const [lifeEvents, setLifeEvents] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim() || !user) return;
    setSaving(true);

    const { error } = await supabase.from('people').insert({
      user_id: user.id,
      name: name.trim(),
      company: company.trim() || null,
      location: location.trim() || null,
      interests: interests ? interests.split(',').map(s => s.trim()).filter(Boolean) : [],
      life_events: lifeEvents ? lifeEvents.split(',').map(s => s.trim()).filter(Boolean) : [],
    });

    setSaving(false);

    if (error) {
      toast.error('Failed to add person');
    } else {
      toast.success(`${name.trim()} added!`);
      onSaved();
    }
  };

  const fields = [
    { label: 'Name', value: name, onChange: setName, required: true, autoFocus: true, placeholder: 'Name' },
    { label: 'Company', value: company, onChange: setCompany, placeholder: 'Company' },
    { label: 'Location', value: location, onChange: setLocation, placeholder: 'Location' },
    { label: 'Interests', value: interests, onChange: setInterests, placeholder: 'Surfing, photography, chess' },
    { label: 'Life events', value: lifeEvents, onChange: setLifeEvents, placeholder: 'Two kids, moved to London' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-background flex flex-col"
    >
      <header className="px-5 pt-6 pb-4 flex items-center justify-between">
        <button onClick={onClose} className="text-sm text-muted-foreground">Cancel</button>
        <h1 className="text-lg font-display font-semibold text-foreground">Add Person</h1>
        <button
          onClick={handleSave}
          disabled={!name.trim() || saving}
          className="text-sm font-medium text-primary disabled:opacity-40"
        >
          {saving ? 'Saving...' : 'Save'}
        </button>
      </header>

      <div className="flex-1 overflow-y-auto px-5 space-y-4 mt-2">
        {fields.map(field => (
          <div key={field.label}>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1 block">
              {field.label}{field.required && ' *'}
            </label>
            <input
              type="text"
              value={field.value}
              onChange={e => field.onChange(e.target.value)}
              placeholder={field.placeholder}
              autoFocus={field.autoFocus}
              className="w-full h-12 px-4 rounded-xl bg-card border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        ))}
      </div>
    </motion.div>
  );
};

export default AddPersonScreen;
