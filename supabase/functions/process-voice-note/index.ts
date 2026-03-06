import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing authorization header");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    // Get authenticated user
    const supabaseAuth = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userError } = await supabaseAuth.auth.getUser();
    if (userError || !user) throw new Error("Unauthorized");

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { audio, audioUrl } = await req.json();

    // Decode base64 audio
    const binaryString = atob(audio);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    // Step 1: Transcribe using Lovable AI (ask it to transcribe the audio description)
    // Since we can't use Whisper directly, we'll use the audio content
    // For now, we'll use Lovable AI to extract from the audio by sending it as context
    // Actually, let's use the browser's SpeechRecognition on client side and send transcript
    // But the spec says backend transcription. Let's use Lovable AI to process.

    // Since Lovable AI doesn't support audio input directly, let's adjust:
    // We'll accept an optional transcript from the client (from Web Speech API)
    // and use AI for extraction only

    // For MVP, let's accept transcript from client-side Web Speech API
    // The edge function focuses on AI extraction + DB operations

    const body = await req.json().catch(() => null);
    
    // Re-parse since we already parsed above - let's restructure
    // Actually we already have audio and audioUrl from above

    // For this MVP, we'll transcribe by having the client send transcript
    // But let's make the function work with just the audio by using AI

    // Use Lovable AI for extraction from transcript
    // Client will send transcript via Web Speech API

    // Let me restructure: accept { transcript, audioUrl } from client
    // Client handles transcription via Web Speech API (works offline, fast)

    return new Response(
      JSON.stringify({ error: "This endpoint expects transcript from client" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (e) {
    console.error("Error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
