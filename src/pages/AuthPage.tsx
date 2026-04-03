import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ArrowLeft, Mail, Lock, ArrowRight, Mic, Shield, PartyPopper } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { User } from '@supabase/supabase-js';

type Screen = 'welcome' | 'auth' | 'mic' | 'consent' | 'trial';

interface AuthPageProps {
  onOnboardingComplete?: () => void;
  initialUser?: User | null;
  resumeScreen?: Screen | null;
}

const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 300 : -300, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -300 : 300, opacity: 0 }),
};

const AuthPage = ({ onOnboardingComplete, initialUser, resumeScreen }: AuthPageProps) => {
  const [screen, setScreen] = useState<Screen>(resumeScreen || 'welcome');
  const [direction, setDirection] = useState(1);
  const [authMode, setAuthMode] = useState<'signup' | 'login'>('signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const goTo = (s: Screen, dir = 1) => {
    setDirection(dir);
    setScreen(s);
  };

  const validateEmail = (v: string) => {
    if (!v) return 'Email is required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return 'Please enter a valid email';
    return '';
  };

  const validatePassword = (v: string) => {
    if (!v) return 'Password is required';
    if (v.length < 8) return 'Password must be at least 8 characters';
    return '';
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    const eErr = validateEmail(email);
    const pErr = validatePassword(password);
    setEmailError(eErr);
    setPasswordError(pErr);
    if (eErr || pErr) return;

    setLoading(true);
    try {
      if (authMode === 'signup') {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        toast.success('Check your email to confirm your account!');
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        // Login flow — check onboarding status
        if (data.user) {
          const { data: profile } = await supabase
            .from('user_profiles')
            .select('onboarding_complete, consent_given')
            .eq('user_id', data.user.id)
            .maybeSingle();

          if (profile?.onboarding_complete) {
            onOnboardingComplete?.();
          } else if (profile?.consent_given) {
            goTo('trial');
          } else {
            goTo('consent');
          }
        }
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  // After signup confirmation, the auth state change in App.tsx will pass the user here via resumeScreen
  // For new signups that auto-confirm or after email verification, proceed to mic screen
  useEffect(() => {
    if (initialUser && screen === 'auth' && authMode === 'signup') {
      goTo('mic');
    }
  }, [initialUser]);

  const handleMicPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(t => t.stop());
      toast.success('Microphone access granted!');
    } catch {
      // User denied — that's fine
    }
    goTo('consent');
  };

  const handleConsent = async () => {
    setLoading(true);
    try {
      const userId = initialUser?.id;
      if (!userId) throw new Error('Not authenticated');

      await supabase.from('user_profiles').upsert({
        user_id: userId,
        consent_given: true,
        consent_date: new Date().toISOString(),
      }, { onConflict: 'user_id' });

      goTo('trial');
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleTrialComplete = async () => {
    setLoading(true);
    try {
      const userId = initialUser?.id;
      if (!userId) throw new Error('Not authenticated');

      await supabase.from('user_profiles').upsert({
        user_id: userId,
        onboarding_complete: true,
        trial_started_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });

      onOnboardingComplete?.();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-background overflow-hidden">
      <AnimatePresence mode="wait" custom={direction}>
        {screen === 'welcome' && (
          <motion.div
            key="welcome"
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3 }}
            className="w-full max-w-sm text-center"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
              className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-primary mb-6"
            >
              <Sparkles className="w-10 h-10 text-primary-foreground" />
            </motion.div>

            <h1 className="text-4xl font-display font-bold text-foreground mb-3">Prochi</h1>
            <p className="text-muted-foreground text-lg leading-relaxed mb-2">Remember everyone you meet.</p>
            <p className="text-muted-foreground text-sm mb-10">AI-powered relationship memory.</p>

            <Button
              onClick={() => { setAuthMode('signup'); goTo('auth'); }}
              className="w-full h-14 rounded-xl text-base font-medium"
            >
              Get started
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>

            <button
              onClick={() => { setAuthMode('login'); goTo('auth'); }}
              className="mt-4 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              I already have an account
            </button>
          </motion.div>
        )}

        {screen === 'auth' && (
          <motion.div
            key="auth"
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3 }}
            className="w-full max-w-sm"
          >
            <button
              onClick={() => goTo('welcome', -1)}
              className="mb-6 flex items-center text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-5 h-5 mr-1" />
              Back
            </button>

            <h1 className="text-2xl font-display font-bold text-foreground mb-8">
              {authMode === 'signup' ? 'Create your account' : 'Welcome back'}
            </h1>

            <form onSubmit={handleAuth} className="space-y-4">
              <div>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setEmailError(''); }}
                    className={`pl-11 h-13 rounded-xl bg-card border-border text-base ${emailError ? 'border-destructive' : ''}`}
                  />
                </div>
                {emailError && <p className="mt-1 text-sm text-destructive">{emailError}</p>}
              </div>

              <div>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="password"
                    placeholder="Password (min 8 characters)"
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setPasswordError(''); }}
                    className={`pl-11 h-13 rounded-xl bg-card border-border text-base ${passwordError ? 'border-destructive' : ''}`}
                  />
                </div>
                {passwordError && <p className="mt-1 text-sm text-destructive">{passwordError}</p>}
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-13 rounded-xl text-base font-medium"
              >
                {loading ? (
                  <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full" />
                ) : (
                  <>Continue<ArrowRight className="w-4 h-4 ml-2" /></>
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <button
                onClick={() => setAuthMode(authMode === 'signup' ? 'login' : 'signup')}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                {authMode === 'signup' ? (
                  <>Already have an account? <span className="text-primary">Sign in</span></>
                ) : (
                  <>Don't have an account? <span className="text-primary">Sign up</span></>
                )}
              </button>
            </div>

            <p className="mt-6 text-center text-xs text-muted-foreground leading-relaxed">
              By continuing you agree to our{' '}
              <a href="https://www.prochi.app/terms" target="_blank" rel="noopener noreferrer" className="text-primary underline">
                Terms of Service
              </a>{' '}
              and{' '}
              <a href="https://www.prochi.app/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-primary underline">
                Privacy Policy
              </a>
            </p>
          </motion.div>
        )}

        {screen === 'mic' && (
          <motion.div
            key="mic"
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3 }}
            className="w-full max-w-sm text-center"
          >
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-accent mb-6">
              <Mic className="w-10 h-10 text-primary" />
            </div>

            <h2 className="text-2xl font-display font-bold text-foreground mb-3">
              Prochi works best with your voice
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-8">
              Record a quick note after meeting someone and AI does the rest — no typing needed.
            </p>

            <Button onClick={handleMicPermission} className="w-full h-14 rounded-xl text-base font-medium mb-3">
              Allow microphone access
            </Button>
            <button
              onClick={() => goTo('consent')}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Skip for now
            </button>
          </motion.div>
        )}

        {screen === 'consent' && (
          <motion.div
            key="consent"
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3 }}
            className="w-full max-w-sm"
          >
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-accent mb-6">
                <Shield className="w-10 h-10 text-primary" />
              </div>
              <h2 className="text-2xl font-display font-bold text-foreground mb-2">Before you start</h2>
              <p className="text-muted-foreground text-sm">
                Prochi stores memories about people you meet.<br />Here's what that means:
              </p>
            </div>

            <div className="space-y-4 mb-8">
              {[
                { icon: '🎙', text: 'Your voice notes are transcribed by AI' },
                { icon: '🧠', text: 'Names, companies and details are extracted automatically' },
                { icon: '🔔', text: 'Reminders are created from what you say' },
                { icon: '🔒', text: 'Only you can see your data' },
              ].map((item) => (
                <div key={item.icon} className="flex items-start gap-3">
                  <span className="text-xl">{item.icon}</span>
                  <p className="text-foreground text-sm leading-relaxed">{item.text}</p>
                </div>
              ))}
            </div>

            <p className="text-xs text-muted-foreground text-center mb-6">
              Your data is never sold or used for advertising.
            </p>

            <Button
              onClick={handleConsent}
              disabled={loading}
              className="w-full h-14 rounded-xl text-base font-medium"
            >
              {loading ? (
                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full" />
              ) : (
                "I understand, let's go"
              )}
            </Button>
          </motion.div>
        )}

        {screen === 'trial' && (
          <motion.div
            key="trial"
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3 }}
            className="w-full max-w-sm text-center"
          >
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-accent mb-6">
              <PartyPopper className="w-10 h-10 text-primary" />
            </div>

            <h2 className="text-2xl font-display font-bold text-foreground mb-3">
              Your free trial has started
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-2">
              You have 7 days of unlimited access.
            </p>
            <p className="text-muted-foreground text-sm mb-2">
              After that, up to 5 people are always free.
            </p>
            <p className="text-muted-foreground text-sm mb-8">
              Unlock unlimited with Prochi Pro — £3.99/month.
            </p>

            <Button
              onClick={handleTrialComplete}
              disabled={loading}
              className="w-full h-14 rounded-xl text-base font-medium"
            >
              {loading ? (
                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full" />
              ) : (
                'Start using Prochi'
              )}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AuthPage;
