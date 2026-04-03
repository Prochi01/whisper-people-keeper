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

    const { notes, name, company } = await req.json();

    const notesText = (notes as any[])
      .map((n: any) => `${n.created_at?.split("T")[0] || ""}: ${n.transcript || ""}`)
      .filter((t: string) => t.trim().length > 2)
      .join("\n");

    if (!notesText.trim()) {
      return new Response(JSON.stringify({ questions: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const prompt = `You are helping someone prepare to meet ${name}${company ? ` from ${company}` : ""}.

Based on these memory notes, generate 1-3 genuine, specific follow-up questions to ask them next time. Only generate questions that are directly supported by something mentioned in the notes. Do not invent details that are not there. Do not ask about things that were not mentioned.

Notes:
${notesText}

Return ONLY a valid JSON object in this exact format:
{"questions": ["question 1", "question 2"]}

If there is nothing specific to ask about, return:
{"questions": []}`;

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        temperature: 0.3,
        max_tokens: 300,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("OpenAI error:", res.status, errText);
      throw new Error("OpenAI request failed");
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content || '{"questions":[]}';
    const parsed = JSON.parse(content);
    const questions = Array.isArray(parsed.questions) ? parsed.questions.slice(0, 3) : [];

    return new Response(JSON.stringify({ questions }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-followups error:", e);
    return new Response(JSON.stringify({ questions: [] }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
