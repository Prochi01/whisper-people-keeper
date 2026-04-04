import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { AnimatePresence } from "framer-motion";
import AuthPage from "./pages/AuthPage";
import HomePage from "./pages/HomePage";
import PersonPage from "./pages/PersonPage";
import PeoplePage from "./pages/PeoplePage";
import TimelinePage from "./pages/TimelinePage";
import SettingsPage from "./pages/SettingsPage";
import NotFound from "./pages/NotFound";
import BottomTabBar from "./components/BottomTabBar";
import RecordingOverlay from "./components/RecordingOverlay";
import ProcessingOverlay from "./components/ProcessingOverlay";
import ReviewScreen from "./components/ReviewScreen";
import ContactLinker from "./components/ContactLinker";
import FuzzyMatchConfirm from "./components/FuzzyMatchConfirm";
import { useVoiceRecorder } from "./hooks/useVoiceRecorder";
import { useProcessVoiceNote, SaveResult } from "./hooks/useProcessVoiceNote";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

const queryClient = new QueryClient();

type OnboardingScreen = 'mic' | 'consent' | 'trial' | null;

const AppContent = () => {
  const { session, user, loading } = useAuth();
  const { isRecording, duration, audioBlob, startRecording, stopRecording, cancelRecording, analyserNode } = useVoiceRecorder();
  const { transcribeAndExtract, saveMemory, confirmFuzzyMatch, discardReview, processing, reviewData, pendingFuzzyMatch } = useProcessVoiceNote();
  const [refreshKey, setRefreshKey] = useState(0);
  const [contactLinkData, setContactLinkData] = useState<{ personId: string; personName: string } | null>(null);
  const [onboardingDone, setOnboardingDone] = useState<boolean | null>(null);
  const [resumeScreen, setResumeScreen] = useState<OnboardingScreen>(null);
  const [checkingOnboarding, setCheckingOnboarding] = useState(false);

  const isOverlayActive = isRecording || processing || !!reviewData || !!pendingFuzzyMatch;

  // Check onboarding status when user logs in
  useEffect(() => {
    if (!user) {
      setOnboardingDone(null);
      setResumeScreen(null);
      return;
    }

    const checkOnboarding = async () => {
      setCheckingOnboarding(true);
      try {
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('onboarding_complete, consent_given')
          .eq('user_id', user.id)
          .maybeSingle();

        if (profile?.onboarding_complete) {
          setOnboardingDone(true);
        } else if (profile?.consent_given) {
          setOnboardingDone(false);
          setResumeScreen('trial');
        } else if (profile) {
          setOnboardingDone(false);
          setResumeScreen('consent');
        } else {
          // No profile at all — new user, show mic screen first
          setOnboardingDone(false);
          setResumeScreen('mic');
        }
      } catch {
        // If check fails, assume onboarding done to not block
        setOnboardingDone(true);
      } finally {
        setCheckingOnboarding(false);
      }
    };

    checkOnboarding();
  }, [user]);

  useEffect(() => {
    if (audioBlob && !isRecording) {
      transcribeAndExtract(audioBlob);
    }
  }, [audioBlob, isRecording]);

  const handleRecord = async () => {
    try { await startRecording(); } catch {}
  };

  const handleSave = async (draft: import('@/hooks/useProcessVoiceNote').ExtractedData, nudges: import('@/hooks/useProcessVoiceNote').AutoNudge[]) => {
    if (reviewData) {
      const updatedReview = { ...reviewData, extracted: draft, auto_nudges: nudges };
      const result = await saveMemory(updatedReview);
      if (result && result.success && result.person_id) {
        setRefreshKey(k => k + 1);
        const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
        if (isMobile) {
          setContactLinkData({ personId: result.person_id, personName: result.person_name || draft.name });
        }
      }
    }
  };

  const handleFuzzyConfirm = async () => {
    const result = await confirmFuzzyMatch(true);
    if (result && result.success && result.person_id) {
      setRefreshKey(k => k + 1);
      const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
      if (isMobile) {
        setContactLinkData({ personId: result.person_id, personName: result.person_name || '' });
      }
    }
  };

  const handleFuzzyCreateNew = async () => {
    const result = await confirmFuzzyMatch(false);
    if (result && result.success && result.person_id) {
      setRefreshKey(k => k + 1);
      const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
      if (isMobile) {
        setContactLinkData({ personId: result.person_id, personName: result.person_name || '' });
      }
    }
  };

  if (loading || checkingOnboarding) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Not logged in — show welcome/auth screens
  if (!session) {
    return <AuthPage />;
  }

  // Logged in but onboarding not complete — show remaining onboarding screens
  if (onboardingDone === false && resumeScreen) {
    return (
      <AuthPage
        initialUser={user}
        resumeScreen={resumeScreen}
        onOnboardingComplete={() => {
          setOnboardingDone(true);
          setResumeScreen(null);
        }}
      />
    );
  }

  return (
    <>
      <RecordingOverlay isRecording={isRecording} duration={duration} analyserNode={analyserNode} onStop={stopRecording} onCancel={cancelRecording} />
      <ProcessingOverlay processing={processing} />
      <AnimatePresence>
        {reviewData && (
          <ReviewScreen reviewData={reviewData} onSave={handleSave} onDiscard={discardReview} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {pendingFuzzyMatch && (
          <FuzzyMatchConfirm
            existingName={pendingFuzzyMatch.fuzzyMatch.existing_name}
            spokenName={pendingFuzzyMatch.fuzzyMatch.spoken_name}
            onConfirm={handleFuzzyConfirm}
            onCreateNew={handleFuzzyCreateNew}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {contactLinkData && (
          <ContactLinker
            personId={contactLinkData.personId}
            personName={contactLinkData.personName}
            onLinked={() => {}}
            onClose={() => setContactLinkData(null)}
          />
        )}
      </AnimatePresence>

      <Routes>
        <Route path="/" element={<HomePage refreshKey={refreshKey} />} />
        <Route path="/person/:id" element={<PersonPage />} />
        <Route path="/people" element={<PeoplePage refreshKey={refreshKey} />} />
        <Route path="/timeline" element={<TimelinePage refreshKey={refreshKey} />} />
        <Route path="*" element={<NotFound />} />
      </Routes>

      {!isOverlayActive && !contactLinkData && <BottomTabBar onRecord={handleRecord} />}
    </>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
