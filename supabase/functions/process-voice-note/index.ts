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

    const supabaseAuth = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userError } = await supabaseAuth.auth.getUser();
    if (userError || !user) throw new Error("Unauthorized");

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { transcript, audioUrl } = await req.json();

    if (!transcript) throw new Error("No transcript provided");

    // Use Lovable AI for structured extraction
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `You are a personal relationship memory assistant. Extract structured information about people from voice note transcripts. The transcript may be in any language - extract information regardless of language. Proper nouns (names, places, companies) should be preserved as-is, not translated.`
          },
          {
            role: "user",
            content: `Extract structured information from this voice note transcript:\n\n"${transcript}"\n\nExtract the person's details as JSON.`
          }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "extract_person_data",
              description: "Extract structured person data from a voice note transcript",
              parameters: {
                type: "object",
                properties: {
                  name: { type: "string", description: "Person's name" },
                  company: { type: "string", description: "Company or organization" },
                  location: { type: "string", description: "City, country, or location" },
                  interests: { type: "array", items: { type: "string" }, description: "Hobbies, interests, passions" },
                  life_events: { type: "array", items: { type: "string" }, description: "Notable life events mentioned" },
                  meeting_context: { type: "string", description: "Where/how they met" },
                  notes: { type: "string", description: "Any other notable details" },
                  summary: { type: "string", description: "A 1-2 sentence summary for quick recall" }
                },
                required: ["name"],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "extract_person_data" } }
      }),
    });

    if (!aiResponse.ok) {
      const status = aiResponse.status;
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited, please try again shortly" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted" }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await aiResponse.text();
      console.error("AI error:", status, errText);
      throw new Error("AI extraction failed");
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("AI did not return extracted data");

    const extracted = JSON.parse(toolCall.function.arguments);
    const personName = extracted.name || "Unknown";

    // Check if person already exists (fuzzy match by name)
    const { data: existingPeople } = await supabase
      .from("people")
      .select("*")
      .eq("user_id", user.id)
      .ilike("name", `%${personName}%`);

    let personId: string;

    if (existingPeople && existingPeople.length > 0) {
      // Update existing person
      const existing = existingPeople[0];
      const mergedInterests = [...new Set([...(existing.interests || []), ...(extracted.interests || [])])];
      const mergedLifeEvents = [...new Set([...(existing.life_events || []), ...(extracted.life_events || [])])];

      const { error: updateError } = await supabase
        .from("people")
        .update({
          company: extracted.company || existing.company,
          location: extracted.location || existing.location,
          interests: mergedInterests,
          life_events: mergedLifeEvents,
          ai_summary: extracted.summary || existing.ai_summary,
          last_interaction: new Date().toISOString(),
        })
        .eq("id", existing.id);

      if (updateError) throw updateError;
      personId = existing.id;
    } else {
      // Create new person
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
      });

    if (noteError) throw noteError;

    return new Response(
      JSON.stringify({ success: true, person_id: personId, person_name: personName, extracted }),
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
