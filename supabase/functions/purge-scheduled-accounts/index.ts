// Edge function: purge-scheduled-accounts
// Roda diariamente via pg_cron. Apaga em definitivo todas as contas cujo
// `profiles.deletion_scheduled_at` já venceu (>= 90 dias atrás).
// Não exige JWT do usuário — é protegido por um header `x-cron-secret`
// que só o pg_cron conhece (configurado via SUPABASE_SERVICE_ROLE_KEY).

import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  // Autenticação: aceita Bearer service-role OU header x-cron-secret = service-role.
  const authHeader = req.headers.get("Authorization") ?? "";
  const cronSecret = req.headers.get("x-cron-secret") ?? "";
  const expected = `Bearer ${SERVICE_KEY}`;
  if (authHeader !== expected && cronSecret !== SERVICE_KEY) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const admin = createClient(SUPABASE_URL, SERVICE_KEY);
  const nowIso = new Date().toISOString();

  // Busca contas com prazo vencido
  const { data: due, error: dueErr } = await admin
    .from("profiles")
    .select("user_id")
    .lte("deletion_scheduled_at", nowIso)
    .not("deletion_scheduled_at", "is", null);

  if (dueErr) {
    console.error("query due profiles failed:", dueErr);
    return new Response(JSON.stringify({ error: dueErr.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const purged: string[] = [];
  const failed: { user_id: string; error: string }[] = [];

  for (const row of due ?? []) {
    const userId = (row as any).user_id as string;
    try {
      // 1. Storage
      try {
        const { data: files } = await admin.storage.from("product-photos").list(userId);
        if (files && files.length > 0) {
          await admin.storage.from("product-photos").remove(files.map((f) => `${userId}/${f.name}`));
        }
      } catch (_) { /* ignore */ }
      try {
        await admin.storage.from("product-photos").remove([
          `avatars/${userId}/avatar.jpg`,
          `avatars/${userId}/avatar.jpeg`,
          `avatars/${userId}/avatar.png`,
          `avatars/${userId}/avatar.webp`,
        ]);
      } catch (_) { /* ignore */ }
      try {
        await admin.storage.from("avatars").remove([
          `${userId}.jpg`, `${userId}.jpeg`, `${userId}.png`, `${userId}.webp`,
        ]);
      } catch (_) { /* ignore */ }

      // 2. Tabelas (filhos antes dos pais)
      const { data: userSets } = await admin.from("sets").select("id").eq("user_id", userId);
      const setIds = (userSets ?? []).map((s: any) => s.id);
      if (setIds.length > 0) {
        await admin.from("set_layers").delete().in("set_id", setIds);
        await admin.from("set_products").delete().in("set_id", setIds);
        await admin.from("set_likes").delete().in("set_id", setIds);
      }
      await admin.from("set_likes").delete().eq("user_id", userId);
      await admin.from("user_follows").delete().eq("follower_id", userId);
      await admin.from("user_follows").delete().eq("following_id", userId);

      const { data: userProducts } = await admin.from("products").select("id").eq("user_id", userId);
      const productIds = (userProducts ?? []).map((p: any) => p.id);
      if (productIds.length > 0) {
        await admin.from("product_color_codes").delete().in("product_id", productIds);
        await admin.from("purchase_history").delete().in("product_id", productIds);
        await admin.from("set_products").delete().in("product_id", productIds);
      }

      await admin.from("sets").delete().eq("user_id", userId);
      await admin.from("products").delete().eq("user_id", userId);
      await admin.from("profiles").delete().eq("user_id", userId);

      // 3. Conta no Auth
      const { error: delErr } = await admin.auth.admin.deleteUser(userId);
      if (delErr) throw delErr;

      purged.push(userId);
    } catch (e) {
      console.error("purge failed for", userId, e);
      failed.push({ user_id: userId, error: (e as Error).message });
    }
  }

  return new Response(
    JSON.stringify({ checked: due?.length ?? 0, purged: purged.length, failed }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
});
