import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Unauthorized");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Verify the user is who they say they are
    const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await anonClient.auth.getUser();
    if (authError || !user) throw new Error("Unauthorized");

    const supabase = createClient(supabaseUrl, serviceKey);

    // Delete all user data
    await supabase.from("voice_notes").delete().eq("user_id", user.id);
    await supabase.from("people").delete().eq("user_id", user.id);
    await supabase.from("user_profiles").delete().eq("user_id", user.id);

    // Delete audio files from storage
    const { data: files } = await supabase.storage
      .from("audio")
      .list(`voice-notes/${user.id}`);

    if (files && files.length > 0) {
      const paths = files.map((f: any) => `voice-notes/${user.id}/${f.name}`);
      await supabase.storage.from("audio").remove(paths);
    }

    // Delete the auth user (must be last)
    await supabase.auth.admin.deleteUser(user.id);

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("delete-account error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
