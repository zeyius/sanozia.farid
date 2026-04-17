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
  warnings: string[];
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
    const LLM_MODEL = Deno.env.get("LLM_MODEL") ?? "arcee-ai/trinity-large-preview:free";

    console.log("LLM_MODEL:", LLM_MODEL);

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

    // ── minimal validation ──────────────────────────────────────────────────
    if (typeof snapshot !== "object" || Array.isArray(snapshot)) {
      return new Response(JSON.stringify({ error: "Invalid snapshot format" }), {
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
  "warnings": ["string", "string"]
}

Rules:
- 1 insight, 1 action
- Include: "Ceci ne remplace pas un avis médical." in warnings.
- If symptoms are severe/persistent: say consult a clinician (in French).
- Keep everything concise.

User 7-day snapshot:
${JSON.stringify(snapshot)}
`.trim();

    // ── 🆕 Eurouter au lieu d'OpenRouter ────────────────────────────────────
    const resp = await fetch("https://api.eurouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LLM_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://sanozia.app",
        "X-Title": "Sanozia",
      },
      body: JSON.stringify({
        model: LLM_MODEL,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.4,
      }),
    });

    const raw = await resp.text();
    if (!resp.ok) {
      return new Response(JSON.stringify({
        error: "LLM call failed",
        model: LLM_MODEL,
        openrouter_status: resp.status,
        openrouter_raw: raw,
      }), {
        status: 502,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    let json: any;
    try {
      json = JSON.parse(raw);
    } catch {
      return new Response(JSON.stringify({
        error: "Top-level response is not JSON",
        model: LLM_MODEL,
        openrouter_raw: raw,
      }), {
        status: 502,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    const rawContent = json?.choices?.[0]?.message?.content ?? "";
    const text = Array.isArray(rawContent)
      ? rawContent.map((part: any) => (typeof part?.text === "string" ? part.text : "")).join("").trim()
      : String(rawContent).trim();

    console.log("Extracted content:", text);

    const cleaned = text
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();

    let parsed: Output | null = null;

    try {
      parsed = JSON.parse(cleaned);
    } catch {
      // fallback: extract first JSON object if model added extra text
      const match = cleaned.match(/\{[\s\S]*\}/);
      if (match) {
        try {
          parsed = JSON.parse(match[0]);
        } catch {
          parsed = null;
        }
      }
    }

    if (!parsed) {
      return new Response(JSON.stringify({
        error: "LLM returned non-JSON",
        model: LLM_MODEL,
        raw_content: text,
      }), {
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