import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { productName, productBrand, userProducts } = await req.json();
    if (!productName) {
      return new Response(JSON.stringify({ error: "productName is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const userProductsSummary = (userProducts || [])
      .map((p: any) => `- ${p.name} (${p.brand}, ${p.category}, R$${p.price})`)
      .join("\n");

    const systemPrompt = `You are a beauty and cosmetics product expert reviewer. You have extensive knowledge about makeup and skincare products, including public reviews, beauty influencer opinions, and product comparisons.

Given a product name and brand, provide a comprehensive review based on your knowledge of public opinions, beauty community feedback, and product characteristics.

Also, the user already owns certain products. Compare the queried product against what they already have to determine if the purchase is worthwhile or redundant.

User's current products:
${userProductsSummary || "No products yet."}

Respond in Brazilian Portuguese using the review_product tool.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: `Faça uma review completa do produto: "${productName}"${productBrand ? ` da marca "${productBrand}"` : ""}. Analise as opiniões públicas, prós e contras, e compare com os produtos que eu já tenho para me dizer se vale a pena comprar.`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "review_product",
              description: "Return a structured product review with public opinion and purchase recommendation.",
              parameters: {
                type: "object",
                properties: {
                  summary: {
                    type: "string",
                    description: "Brief product summary: what it is, what it does, key features (2-3 sentences in Portuguese)",
                  },
                  public_opinion: {
                    type: "string",
                    description: "What people generally say about this product online, beauty community consensus (2-3 sentences in Portuguese)",
                  },
                  pros: {
                    type: "array",
                    items: { type: "string" },
                    description: "List of 3-5 pros/advantages in Portuguese",
                  },
                  cons: {
                    type: "array",
                    items: { type: "string" },
                    description: "List of 2-4 cons/disadvantages in Portuguese",
                  },
                  rating: {
                    type: "number",
                    description: "Overall rating from 1 to 5 (can use decimals like 4.2)",
                  },
                  comparison_verdict: {
                    type: "string",
                    description: "How this product compares to what the user already owns. Mention if they have similar products and whether this adds value (2-3 sentences in Portuguese)",
                  },
                  recommendation: {
                    type: "string",
                    enum: ["vale_a_pena", "ja_tem_similar", "considere_alternativas"],
                    description: "Final purchase recommendation",
                  },
                  recommendation_text: {
                    type: "string",
                    description: "Short explanation of the recommendation (1-2 sentences in Portuguese)",
                  },
                },
                required: ["summary", "public_opinion", "pros", "cons", "rating", "comparison_verdict", "recommendation", "recommendation_text"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "review_product" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Muitas requisições. Tente novamente em alguns segundos." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos de IA esgotados." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "Erro ao gerar review do produto" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall?.function?.arguments) {
      return new Response(JSON.stringify({ error: "Não foi possível gerar a review do produto" }), {
        status: 422,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const review = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(review), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("review-product error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
