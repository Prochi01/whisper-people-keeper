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

    const supabaseAuth = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userError } = await supabaseAuth.auth.getUser();
    if (userError || !user) throw new Error("Unauthorized");

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { extracted, transcript, audioUrl, auto_nudges } = await req.json();

    const personName = extracted.name || "Unknown";

    // Check if person already exists
    const { data: existingPeople } = await supabase
      .from("people")
      .select("*")
      .eq("user_id", user.id)
      .ilike("name", `%${personName}%`);

    let personId: string;

    if (existingPeople && existingPeople.length > 0) {
      const existing = existingPeople[0];
      const mergedInterests = [...new Set([...(existing.interests || []), ...(extracted.interests || [])])];
      const mergedLifeEvents = [...new Set([...(existing.life_events || []), ...(extracted.life_events || [])])];
      const existingNudges = existing.nudges || [];
      const mergedNudges = [...existingNudges, ...(auto_nudges || [])];

      const { error: updateError } = await supabase
        .from("people")
        .update({
          company: extracted.company || existing.company,
          location: extracted.location || existing.location,
          interests: mergedInterests,
          life_events: mergedLifeEvents,
          ai_summary: extracted.summary || existing.ai_summary,
          last_interaction: new Date().toISOString(),
          nudges: mergedNudges,
        })
        .eq("id", existing.id);

      if (updateError) throw updateError;
      personId = existing.id;
    } else {
      const { data: newPerson, error: insertError } = await supabase
        .from("people")
        .insert({
          user_id: user.id,
          name: personName,
          company: extracted.company || null,
          location: extracted.location || null,
          interests: extracted.interests || [],
          life_events: extracted.life_events || [],
          ai_summary: extracted.summary || null,
          nudges: auto_nudges || [],
        })
        .select()
        .single();

      if (insertError) throw insertError;
      personId = newPerson.id;
    }

    // Create voice note
    const { error: noteError } = await supabase
      .from("voice_notes")
      .insert({
        user_id: user.id,
        person_id: personId,
        transcript: transcript,
        audio_url: audioUrl || null,
        extracted_data: extracted,
        meeting_context: extracted.meeting_context || null,
        auto_nudges: auto_nudges || [],
      });

    if (noteError) throw noteError;

    const hasNudges = auto_nudges && auto_nudges.length > 0;

    return new Response(
      JSON.stringify({ success: true, person_id: personId, person_name: personName, has_nudges: hasNudges }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (e) {
    console.error("Error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
