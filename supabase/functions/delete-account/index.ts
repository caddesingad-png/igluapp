// Edge function: delete-account
// Soft-delete: marca a conta para exclusão definitiva em 90 dias.
// Os dados continuam no banco, mas o usuário é deslogado imediatamente e
// é impedido de logar de novo enquanto a exclusão estiver agendada.
// A limpeza efetiva é feita pelo job `purge-scheduled-accounts`.

import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const RETENTION_DAYS = 90;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsErr } = await userClient.auth.getClaims(token);
    if (claimsErr || !claimsData?.claims?.sub) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = claimsData.claims.sub as string;

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);

    const scheduledFor = new Date(Date.now() + RETENTION_DAYS * 24 * 60 * 60 * 1000).toISOString();

    const { error: updErr } = await admin
      .from("profiles")
      .update({ deletion_scheduled_at: scheduledFor } as any)
      .eq("user_id", userId);

    if (updErr) {
      console.error("schedule deletion failed:", updErr);
      return new Response(JSON.stringify({ error: "Falha ao agendar exclusão. Tente novamente." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Invalida sessões ativas — força logout imediato em todos os dispositivos.
    try {
      await admin.auth.admin.signOut(userId, "global");
    } catch (e) {
      console.error("signOut failed (non-fatal):", e);
    }

    return new Response(
      JSON.stringify({ success: true, scheduled_for: scheduledFor, retention_days: RETENTION_DAYS }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("delete-account error:", err);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
