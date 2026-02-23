import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type Output = {
  language: "fr";
  insight: string;
  action: string;
  question: string;
  warnings: string[];
  confidence: number;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  const auth =
    req.headers.get("authorization") ?? req.headers.get("Authorization");

  console.log("method:", req.method);
  console.log("Authorization header present:", !!auth);

  try {
    const LLM_API_KEY = Deno.env.get("LLM_API_KEY");
    const LLM_MODEL = Deno.env.get("LLM_MODEL") ?? "deepseek/deepseek-r1-0528:free";

    if (!LLM_API_KEY) {
      return new Response(JSON.stringify({ error: "Missing LLM_API_KEY" }), {
        status: 500,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    const snapshot = await req.json().catch(() => null);
    if (!snapshot) {
      return new Response(JSON.stringify({ error: "Missing JSON body" }), {
        status: 400,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    const prompt = `
You are generating a "Digestive Health Insight" card.
Return ONLY valid JSON (no markdown, no extra text).

Schema:
{
  "language": "fr",
  "insight": "string (short)",
  "action": "string (short)",
  "warnings": ["string", "string"],
}

Rules:
- 1 insight, 1 action
- Include: "Ceci ne remplace pas un avis médical." in warnings.
- If symptoms are severe/persistent: say consult a clinician (in French).
- Keep everything concise.

User 7-day snapshot:
${JSON.stringify(snapshot)}
`.trim();

    const resp = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LLM_API_KEY}`,
        "Content-Type": "application/json",
        // Optional but recommended by OpenRouter
        "HTTP-Referer": "https://sanozia.app",
        "X-Title": "Sanozia",
      },
      body: JSON.stringify({
        model: LLM_MODEL,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.4,
      }),
    });

    if (!resp.ok) {
      const details = await resp.text();
      return new Response(JSON.stringify({ error: "LLM call failed", details }), {
        status: 502,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    const json = await resp.json();
    const text = json?.choices?.[0]?.message?.content ?? "";

    // ✅ Strip ```json ... ``` fences if the model adds them
    const cleaned = text
      .trim()
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/```$/i, "")
      .trim();

    let parsed: Output;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      return new Response(JSON.stringify({ error: "LLM returned non-JSON", raw: text }), {
        status: 502,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(parsed), {
      status: 200,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: "Unexpected error", details: String(e) }), {
      status: 500,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }
});

