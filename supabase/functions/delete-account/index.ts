// Edge function: delete-account
// Remove todos os dados do usuário autenticado e apaga a conta no auth.

import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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

    // Validate JWT and get user id
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

    // 1. Apagar fotos do storage
    //    - avatars/{userId}.jpg
    //    - product-photos/{userId}/...
    try {
      await admin.storage.from("product-photos").list(userId).then(async ({ data }) => {
        if (data && data.length > 0) {
          const paths = data.map((f) => `${userId}/${f.name}`);
          await admin.storage.from("product-photos").remove(paths);
        }
      });
    } catch (_) { /* bucket ou pasta inexistente — segue */ }

    try {
      // tenta possíveis extensões do avatar
      await admin.storage.from("avatars").remove([
        `${userId}.jpg`, `${userId}.jpeg`, `${userId}.png`, `${userId}.webp`,
      ]);
    } catch (_) { /* bucket inexistente — segue */ }

    // 2. Apagar dados em ordem segura (filhos antes dos pais)
    // Pega ids dos sets do usuário para limpar layers/products
    const { data: userSets } = await admin.from("sets").select("id").eq("user_id", userId);
    const setIds = (userSets ?? []).map((s: any) => s.id);

    if (setIds.length > 0) {
      await admin.from("set_layers").delete().in("set_id", setIds);
      await admin.from("set_products").delete().in("set_id", setIds);
    }

    // Likes que o usuário deu
    await admin.from("set_likes").delete().eq("user_id", userId);
    // Likes em sets do usuário também serão removidos via delete dos sets se houver FK,
    // mas garantimos:
    if (setIds.length > 0) {
      await admin.from("set_likes").delete().in("set_id", setIds);
    }

    // Follows
    await admin.from("user_follows").delete().eq("follower_id", userId);
    await admin.from("user_follows").delete().eq("following_id", userId);

    // Pega ids dos produtos para limpar dependentes
    const { data: userProducts } = await admin.from("products").select("id").eq("user_id", userId);
    const productIds = (userProducts ?? []).map((p: any) => p.id);

    if (productIds.length > 0) {
      await admin.from("product_color_codes").delete().in("product_id", productIds);
      await admin.from("purchase_history").delete().in("product_id", productIds);
      await admin.from("set_products").delete().in("product_id", productIds);
    }

    // Pais
    await admin.from("sets").delete().eq("user_id", userId);
    await admin.from("products").delete().eq("user_id", userId);
    await admin.from("profiles").delete().eq("user_id", userId);

    // 3. Apagar a conta no Auth
    const { error: delErr } = await admin.auth.admin.deleteUser(userId);
    if (delErr) {
      console.error("deleteUser failed:", delErr);
      return new Response(JSON.stringify({ error: "Falha ao apagar a conta. Tente novamente." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("delete-account error:", err);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
