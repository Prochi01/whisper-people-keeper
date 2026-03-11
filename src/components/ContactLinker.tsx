import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, UserPlus, Search } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ContactLinkerProps {
  personId: string;
  personName: string;
  onLinked: (phone: string | null, email: string | null) => void;
  onClose: () => void;
}

const isContactsSupported = () =>
  'contacts' in navigator && 'ContactsManager' in window;

const ContactLinker = ({ personId, personName, onLinked, onClose }: ContactLinkerProps) => {
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [saving, setSaving] = useState(false);

  const handleNativePicker = async () => {
    try {
      const contacts = await (navigator as any).contacts.select(
        ['name', 'tel', 'email'],
        { multiple: false }
      );
      if (contacts && contacts.length > 0) {
        const contact = contacts[0];
        const contactPhone = contact.tel?.[0] ?? null;
        const contactEmail = contact.email?.[0] ?? null;
        await saveContact(contactPhone, contactEmail);
      }
    } catch (err: any) {
      if (err.name !== 'InvalidStateError' && err.name !== 'AbortError') {
        toast.error('Could not access contacts');
      }
    }
  };

  const saveContact = async (contactPhone: string | null, contactEmail: string | null) => {
    if (!contactPhone && !contactEmail) {
      toast.error('No phone or email found for this contact');
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase
        .from('people')
        .update({
          phone: contactPhone || null,
          email: contactEmail || null,
          contact_linked: true,
        } as any)
        .eq('id', personId);
      if (error) throw error;
      toast.success(`Linked ${personName} to contact`);
      onLinked(contactPhone, contactEmail);
      onClose();
    } catch {
      toast.error('Failed to save contact info');
    } finally {
      setSaving(false);
    }
  };

  const handleManualSave = async () => {
    const trimPhone = phone.trim() || null;
    const trimEmail = email.trim() || null;
    if (!trimPhone && !trimEmail) {
      toast.error('Enter a phone number or email');
      return;
    }
    await saveContact(trimPhone, trimEmail);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/30 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="w-full max-w-lg bg-card rounded-t-2xl border border-border p-5 pb-8 safe-bottom"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-display font-semibold text-foreground">
              Link {personName} to your contacts?
            </h2>
          </div>
          <button onClick={onClose} className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {isContactsSupported() ? (
          <div className="space-y-3">
            <button
              onClick={handleNativePicker}
              disabled={saving}
              className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-display font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Search className="w-4 h-4" />
              Search contacts
            </button>
            <button
              onClick={onClose}
              className="w-full h-12 rounded-xl bg-secondary text-secondary-foreground font-display font-medium"
            >
              Skip
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Contact picker isn't available on this device. Enter details manually:
            </p>
            <input
              type="tel"
              placeholder="Phone number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full h-11 rounded-xl border border-input bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full h-11 rounded-xl border border-input bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <button
              onClick={handleManualSave}
              disabled={saving || (!phone.trim() && !email.trim())}
              className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-display font-semibold disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
            <button
              onClick={onClose}
              className="w-full h-12 rounded-xl bg-secondary text-secondary-foreground font-display font-medium"
            >
              Skip
            </button>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

export default ContactLinker;
