import "jsr:@supabase/functions-js/edge-runtime.d.ts";

Deno.serve(async (_req) => {
  try {
    const LLM_API_KEY = Deno.env.get("LLM_API_KEY");

    if (!LLM_API_KEY) {
      return new Response(JSON.stringify({ error: "Missing LLM_API_KEY" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ message: "LLM key loaded successfully" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: "Unexpected error", details: String(error) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});