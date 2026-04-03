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
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY) throw new Error("OPENAI_API_KEY not configured");

    const supabaseAuth = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userError } = await supabaseAuth.auth.getUser();
    if (userError || !user) throw new Error("Unauthorized");

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { transcript, audioUrl } = await req.json();

    if (!transcript) throw new Error("No transcript provided");

    const today = new Date().toISOString().split("T")[0];

    // Use Lovable AI for structured extraction with nudge detection
    const aiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are a personal relationship memory assistant. Extract structured information about people from voice note transcripts. The transcript may be in any language - extract information regardless of language. Proper nouns (names, places, companies) should be preserved as-is, not translated.
Today's date is ${today}.`
          },
          {
            role: "user",
            content: `Extract structured information from this voice note transcript:\n\n"${transcript}"\n\nExtract the person's details including any follow-up nudges.`
          }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "extract_person_data",
              description: "Extract structured person data and follow-up nudges from a voice note transcript",
              parameters: {
                type: "object",
                properties: {
                  name: { type: "string", description: "Person's name" },
                  company: { type: "string", description: "Company or organization" },
                  location: { type: "string", description: "City, country, or location" },
                  interests: { type: "array", items: { type: "string" }, description: "Hobbies, interests, passions" },
                  life_events: { type: "array", items: { type: "string" }, description: "Notable life events mentioned" },
                  meeting_context: { type: "string", description: "Where/how they met" },
                  notes: { type: "string", description: "The full original transcript preserved in original language" },
                  summary: { type: "string", description: "A 1-2 sentence summary for quick recall" },
                  nudges: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        date: { type: "string", description: "Human readable date like '1 January 2026'" },
                        isoDate: { type: "string", description: "ISO 8601 date string" },
                        note: { type: "string", description: "Short reminder label e.g. 'Follow up on the hiring'" },
                        auto: { type: "boolean", description: "Always true for auto-detected nudges" }
                      },
                      required: ["date", "isoDate", "note", "auto"],
                      additionalProperties: false
                    },
                    description: "Follow-up nudges. Only add if transcript contains BOTH a future time reference AND a context signal (hiring, fundraise, launch, move, pregnancy, wedding, deal, health, birthday, event). Calculate exact date from today."
                  }
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
    const autoNudges = extracted.nudges || [];

    // Return extracted data for review (don't save yet)
    return new Response(
      JSON.stringify({ 
        success: true, 
        extracted,
        person_name: personName,
        auto_nudges: autoNudges,
        transcript,
        audioUrl 
      }),
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
