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
    const { imageBase64 } = await req.json();
    if (!imageBase64) {
      return new Response(JSON.stringify({ error: "imageBase64 is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content:
              "You are a cosmetics/makeup product identifier. Given an image of a makeup product, extract the product name, brand, category, and any color codes visible. Be precise and use the exact text you see on the packaging. For category, map to exactly one of: Base, Batom, Sombra, Blush, Máscara, Corretivo, Iluminador, Contorno, Primer, Fixador, Outro. Respond using the identify_product tool.",
          },
          {
            role: "user",
            content: [
              {
                type: "image_url",
                image_url: { url: `data:image/jpeg;base64,${imageBase64}` },
              },
              {
                type: "text",
                text: "Identify this makeup product. Extract the product name, brand, category, and any color/shade names or codes visible on the packaging.",
              },
            ],
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "identify_product",
              description: "Return structured product information extracted from the image.",
              parameters: {
                type: "object",
                properties: {
                  name: {
                    type: "string",
                    description: "Product name as shown on packaging",
                  },
                  brand: {
                    type: "string",
                    description: "Brand name",
                  },
                  category: {
                    type: "string",
                    enum: [
                      "Base", "Batom", "Sombra", "Blush", "Máscara",
                      "Corretivo", "Iluminador", "Contorno", "Primer", "Fixador", "Outro",
                    ],
                    description: "Product category",
                  },
                  color_codes: {
                    type: "array",
                    items: { type: "string" },
                    description: "Color/shade names or codes visible on packaging",
                  },
                },
                required: ["name", "brand", "category"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "identify_product" } },
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
      return new Response(JSON.stringify({ error: "Erro ao identificar produto" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall?.function?.arguments) {
      return new Response(JSON.stringify({ error: "Não foi possível identificar o produto na imagem" }), {
        status: 422,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const product = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(product), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("identify-product error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
