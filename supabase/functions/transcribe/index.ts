import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY) throw new Error("OPENAI_API_KEY not configured");

    const formData = await req.formData();
    const audio = formData.get("audio") as File;
    if (!audio) throw new Error("No audio file provided");

    // Read the raw bytes and reconstruct as a proper Blob to preserve binary integrity
    const arrayBuffer = await audio.arrayBuffer();
    const blob = new Blob([arrayBuffer], { type: audio.type || "audio/webm" });

    const whisperForm = new FormData();
    whisperForm.append("file", blob, "audio.webm");
    whisperForm.append("model", "whisper-1");

    const res = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${OPENAI_API_KEY}` },
      body: whisperForm,
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("Whisper error:", res.status, errText);
      throw new Error("Transcription failed");
    }

    const { text } = await res.json();
    return new Response(JSON.stringify({ transcript: text }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
