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

const queryClient = new QueryClient();

const AppContent = () => {
  const { session, loading } = useAuth();
  const { isRecording, duration, audioBlob, startRecording, stopRecording, cancelRecording, analyserNode } = useVoiceRecorder();
  const { transcribeAndExtract, saveMemory, confirmFuzzyMatch, discardReview, processing, reviewData, pendingFuzzyMatch } = useProcessVoiceNote();
  const [refreshKey, setRefreshKey] = useState(0);
  const [contactLinkData, setContactLinkData] = useState<{ personId: string; personName: string } | null>(null);

  const isOverlayActive = isRecording || processing || !!reviewData || !!pendingFuzzyMatch;

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
        // Prompt contact linking if no contact linked yet
        setContactLinkData({ personId: result.person_id, personName: result.person_name || draft.name });
      }
    }
  };

  const handleFuzzyConfirm = async () => {
    const result = await confirmFuzzyMatch(true);
    if (result && result.success && result.person_id) {
      setRefreshKey(k => k + 1);
      setContactLinkData({ personId: result.person_id, personName: result.person_name || '' });
    }
  };

  const handleFuzzyCreateNew = async () => {
    const result = await confirmFuzzyMatch(false);
    if (result && result.success && result.person_id) {
      setRefreshKey(k => k + 1);
      setContactLinkData({ personId: result.person_id, personName: result.person_name || '' });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!session) {
    return <AuthPage />;
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
