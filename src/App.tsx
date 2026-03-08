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
import { useVoiceRecorder } from "./hooks/useVoiceRecorder";
import { useProcessVoiceNote } from "./hooks/useProcessVoiceNote";
import { useState, useEffect } from "react";

const queryClient = new QueryClient();

const AppContent = () => {
  const { session, loading } = useAuth();
  const { isRecording, duration, audioBlob, startRecording, stopRecording, cancelRecording, analyserNode } = useVoiceRecorder();
  const { transcribeAndExtract, saveMemory, discardReview, processing, reviewData } = useProcessVoiceNote();
  const [refreshKey, setRefreshKey] = useState(0);

  const isOverlayActive = isRecording || processing || !!reviewData;

  // When recording stops and we have a blob, transcribe & extract
  useEffect(() => {
    if (audioBlob && !isRecording) {
      transcribeAndExtract(audioBlob);
    }
  }, [audioBlob, isRecording]);

  const handleRecord = async () => {
    try { await startRecording(); } catch {}
  };

  const handleSave = async () => {
    if (reviewData) {
      const result = await saveMemory(reviewData);
      if (result) setRefreshKey(k => k + 1);
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

      <Routes>
        <Route path="/" element={<HomePage refreshKey={refreshKey} />} />
        <Route path="/person/:id" element={<PersonPage onRecord={handleRecord} />} />
        <Route path="/people" element={<PeoplePage refreshKey={refreshKey} />} />
        <Route path="/timeline" element={<TimelinePage refreshKey={refreshKey} />} />
        <Route path="*" element={<NotFound />} />
      </Routes>

      {!isOverlayActive && <BottomTabBar onRecord={handleRecord} />}
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
