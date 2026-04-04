import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ExternalLink, Download, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

const APP_VERSION = '0.0.0';

const SettingsPage = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleExport = async () => {
    toast('Preparing your data…');
    try {
      const [peopleRes, notesRes, profileRes] = await Promise.all([
        supabase.from('people').select('*').eq('user_id', user!.id),
        supabase.from('voice_notes').select('*').eq('user_id', user!.id),
        supabase.from('user_profiles').select('*').eq('user_id', user!.id).maybeSingle(),
      ]);

      const exportData = {
        exported_at: new Date().toISOString(),
        account: {
          email: user!.email,
          created_at: user!.created_at,
        },
        people: peopleRes.data || [],
        voice_notes: notesRes.data || [],
        profile: profileRes.data || null,
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `prochi-export-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Data exported successfully');
    } catch {
      toast.error('Failed to export data');
    }
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      const { error } = await supabase.functions.invoke('delete-account', {
        body: { userId: user!.id },
      });
      if (error) throw error;
      await signOut();
      navigate('/');
    } catch {
      toast.error('Failed to delete account. Please try again.');
    } finally {
      setDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="px-5 pt-6 pb-4 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-1 text-muted-foreground hover:text-foreground">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-display font-bold text-foreground">Settings</h1>
      </header>

      <div className="px-5 space-y-6">
        {/* Account */}
        <section>
          <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Account</h2>
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <div className="px-4 py-3 border-b border-border">
              <span className="text-sm text-muted-foreground">{user?.email}</span>
            </div>
            <button
              onClick={signOut}
              className="w-full px-4 py-3 text-left text-sm font-medium text-primary hover:bg-muted/50 transition-colors"
            >
              Sign out
            </button>
          </div>
        </section>

        {/* Support */}
        <section>
          <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Support</h2>
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <a
              href="https://www.prochi.app/privacy-policy"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between px-4 py-3 border-b border-border text-sm font-medium text-foreground hover:bg-muted/50 transition-colors"
            >
              Privacy Policy
              <ExternalLink className="w-4 h-4 text-muted-foreground" />
            </a>
            <a
              href="https://www.prochi.app/terms"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between px-4 py-3 text-sm font-medium text-foreground hover:bg-muted/50 transition-colors"
            >
              Terms of Service
              <ExternalLink className="w-4 h-4 text-muted-foreground" />
            </a>
          </div>
        </section>

        {/* Data */}
        <section>
          <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Your data</h2>
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <button
              onClick={handleExport}
              className="w-full flex items-center justify-between px-4 py-3 border-b border-border text-sm font-medium text-foreground hover:bg-muted/50 transition-colors"
            >
              <span className="flex items-center gap-2">
                <Download className="w-4 h-4" />
                Export my data
              </span>
            </button>
            <button
              onClick={() => setShowDeleteDialog(true)}
              className="w-full flex items-center gap-2 px-4 py-3 text-sm font-medium text-destructive hover:bg-muted/50 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Delete account
            </button>
          </div>
        </section>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground pt-4">
          Prochi · Version {APP_VERSION}
        </p>
      </div>

      {/* Delete confirmation */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete your account?</DialogTitle>
            <DialogDescription className="space-y-2 pt-2">
              <span className="block">This will permanently delete:</span>
              <ul className="list-disc pl-5 space-y-1">
                <li>All your memories and notes</li>
                <li>All your people and profiles</li>
                <li>All your nudges and reminders</li>
                <li>Your audio recordings</li>
              </ul>
              <span className="block font-medium text-destructive">This cannot be undone.</span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)} disabled={deleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteAccount} disabled={deleting}>
              {deleting ? 'Deleting…' : 'Delete my account'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SettingsPage;
