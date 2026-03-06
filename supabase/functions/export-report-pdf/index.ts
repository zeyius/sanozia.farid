// <reference types="https://esm.sh/@supabase/functions-js@2.4.4/edge-runtime.d.ts" />
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { PDFDocument, StandardFonts, rgb } from "https://esm.sh/pdf-lib@1.17.1";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type ReportReq = {
  profile_id: string;
  from: string; // YYYY-MM-DD
  to: string; // YYYY-MM-DD
  language?: "fr";
};

type AiSummary = {
  language: "fr";
  title: string;
  executive_summary: string;
  key_patterns: string[];
  red_flags: string[];
  questions_for_clinician: string[];
  disclaimer: string;
  confidence: number; // 0..1
};

function clamp01(n: number) {
  if (Number.isNaN(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

function safeText(s: unknown) {
  return typeof s === "string" ? s : "";
}

/**
 * Keep prompt payload small:
 * - patient + meta
 * - treatments
 * - a compact summary of daily signals (counts/averages + top symptoms)
 */
function compactSnapshot(snapshot: any) {
  const daily = Array.isArray(snapshot?.daily) ? snapshot.daily : [];

  // Aggregate stools
  let stoolsTotal = 0;
  let painMax = 0;
  let consistencySum = 0;
  let consistencyCount = 0;
  let bloodDays = 0;
  let mucusDays = 0;
  let urgencyHighDays = 0; // urgency==2 occurrences (days with at least one)

  // Aggregate feelings
  const globalFeelingCounts: Record<string, number> = {};
  let notesTotal = 0;

  // Aggregate consumptions
  let consumptionsTotal = 0;
  const consumptionByType: Record<string, number> = {};

  // Aggregate symptoms across all days
  // symptomName -> { count, sumIntensity, max }
  const symptomsAgg: Record<
    string,
    { count: number; sum: number; max: number }
  > = {};

  for (const d of daily) {
    // stools
    const sc = Number(d?.stools?.count ?? 0) || 0;
    stoolsTotal += sc;

    const pmax = Number(d?.stools?.pain_max ?? 0) || 0;
    if (pmax > painMax) painMax = pmax;

    const cavg = d?.stools?.consistency_avg;
    if (typeof cavg === "number" && Number.isFinite(cavg)) {
      consistencySum += cavg;
      consistencyCount += 1;
    }

    const bloodCounts = d?.stools?.blood_counts ?? {};
    const hasBlood =
      bloodCounts && typeof bloodCounts === "object"
        ? Object.entries(bloodCounts).some(
            ([level, count]) => level !== "none" && Number(count) > 0,
          )
        : false;
    if (hasBlood) bloodDays += 1;

    const mucusCounts = d?.stools?.mucus_counts ?? {};
    const hasMucus =
      mucusCounts && typeof mucusCounts === "object"
        ? Object.entries(mucusCounts).some(
            ([level, count]) => level !== "none" && Number(count) > 0,
          )
        : false;
    if (hasMucus) mucusDays += 1;

    const urgencyCounts = d?.stools?.urgency_counts ?? {};
    const u2 = Number((urgencyCounts && urgencyCounts["2"]) ?? 0) || 0;
    if (u2 > 0) urgencyHighDays += 1;

    // feelings
    const gf = safeText(d?.feelings?.global_feeling_mode);
    if (gf) globalFeelingCounts[gf] = (globalFeelingCounts[gf] ?? 0) + 1;

    notesTotal += Number(d?.feelings?.notes_count ?? 0) || 0;

    // consumptions
    consumptionsTotal += Number(d?.consumptions?.count ?? 0) || 0;
    const byType = d?.consumptions?.by_type ?? {};
    if (byType && typeof byType === "object") {
      for (const [t, v] of Object.entries(byType)) {
        const n = Number(v) || 0;
        if (!t) continue;
        consumptionByType[t] = (consumptionByType[t] ?? 0) + n;
      }
    }

    // symptoms (already aggregated by day in your snapshot)
    const sym = d?.feelings?.symptoms_by_name ?? {};
    if (sym && typeof sym === "object") {
      for (const [name, statsAny] of Object.entries(sym)) {
        const stats = statsAny as any;
        const c = Number(stats?.count ?? 0) || 0;
        const avg = Number(stats?.avg_intensity ?? 0) || 0;
        const mx = Number(stats?.max_intensity ?? 0) || 0;

        if (!symptomsAgg[name]) {
          symptomsAgg[name] = { count: 0, sum: 0, max: 0 };
        }
        symptomsAgg[name].count += c;
        symptomsAgg[name].sum += avg * (c || 1); // weighted-ish
        if (mx > symptomsAgg[name].max) symptomsAgg[name].max = mx;
      }
    }
  }

  const consistencyAvgOverall =
    consistencyCount > 0 ? consistencySum / consistencyCount : null;

  // Top symptoms by average intensity (computed from sum/count)
  const topSymptoms = Object.entries(symptomsAgg)
    .map(([name, v]) => ({
      name,
      count: v.count,
      avg_intensity: v.count > 0 ? v.sum / v.count : 0,
      max_intensity: v.max,
    }))
    .sort((a, b) => b.avg_intensity - a.avg_intensity)
    .slice(0, 6);

  // Most common feeling
  const feelingMode = Object.entries(globalFeelingCounts).sort(
    (a, b) => b[1] - a[1],
  )[0]?.[0] ?? null;

  // Keep only what we need
  return {
    meta: snapshot?.meta ?? null,
    patient: snapshot?.patient ?? null,
    treatments: snapshot?.treatments ?? [],
    summary: {
      days_in_range: daily.length,
      stools_total: stoolsTotal,
      stools_per_day_avg: daily.length ? stoolsTotal / daily.length : 0,
      consistency_avg_overall: consistencyAvgOverall,
      pain_max: painMax,
      blood_days: bloodDays,
      mucus_days: mucusDays,
      urgency_high_days: urgencyHighDays,
      global_feeling_mode: feelingMode,
      notes_total: notesTotal,
      consumptions_total: consumptionsTotal,
      consumptions_by_type: consumptionByType,
      top_symptoms: topSymptoms,
    },
  };
}

function buildAiPrompt(compact: any) {
  return `
You are generating a clinician-ready PDF report summary for an IBD/MICI tracking app.
Return ONLY valid JSON (no markdown, no extra text).

Schema:
{
  "language": "fr",
  "title": "string (short)",
  "executive_summary": "string (short paragraph)",
  "key_patterns": ["string", "string", "string"],
  "red_flags": ["string", "string"],
  "questions_for_clinician": ["string", "string", "string"],
  "disclaimer": "string (must include: Ceci ne remplace pas un avis médical.)",
  "confidence": number (0.0 to 1.0)
}

Rules:
- Keep it concise, clinician-friendly French.
- Do NOT diagnose. Do NOT prescribe. Use cautious language.
- If blood appears repeatedly or symptoms worsen: recommend consulting a clinician.
- Mention the selected date range.

Inputs (compact snapshot):
${JSON.stringify(compact)}
`.trim();
}

async function callLLM(prompt: string) {
  const LLM_API_KEY = Deno.env.get("LLM_API_KEY");
  const LLM_MODEL = Deno.env.get("LLM_MODEL") ?? "google/gemma-3-4b-it:free";

  if (!LLM_API_KEY) throw new Error("Missing LLM_API_KEY");

  const resp = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LLM_API_KEY}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://sanozia.app",
      "X-Title": "Sanozia",
    },
    body: JSON.stringify({
      model: LLM_MODEL,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
    }),
  });

  if (!resp.ok) {
    const details = await resp.text();
    throw new Error(`LLM call failed: ${details}`);
  }

  const json = await resp.json();
  const text = json?.choices?.[0]?.message?.content ?? "";

  const cleaned = String(text)
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```$/i, "")
    .trim();

  const parsed = JSON.parse(cleaned) as AiSummary;
  parsed.confidence = clamp01(Number(parsed.confidence ?? 0));
  return parsed;
}

async function buildPdf(snapshot: any, ai: AiSummary) {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold);

  // Page 1 only: Header + AI summary (no charts)
  const page = pdf.addPage([595.28, 841.89]); // A4
  const { width, height } = page.getSize();
  let y = height - 48;

  const patientName = safeText(snapshot?.patient?.name) || "Patient";
  const diagnosis = safeText(snapshot?.patient?.diagnosis);
  const rangeFrom = safeText(snapshot?.meta?.range?.from);
  const rangeTo = safeText(snapshot?.meta?.range?.to);

  page.drawText("Sanozia — Rapport Clinicien", {
    x: 40,
    y,
    size: 18,
    font: fontBold,
  });
  y -= 26;

  page.drawText(`Patient: ${patientName}`, { x: 40, y, size: 11, font });
  y -= 16;

  if (diagnosis) {
    page.drawText(`Diagnostic: ${diagnosis}`, { x: 40, y, size: 11, font });
    y -= 16;
  }

  page.drawText(`Periode: ${rangeFrom} - ${rangeTo}`, { x: 40, y, size: 11, font });
  y -= 24;

  page.drawText(ai.title || "Résumé", { x: 40, y, size: 14, font: fontBold });
  y -= 18;

  const wrap = (text: string, maxWidth: number, size: number) => {
    const words = text.split(/\s+/);
    const lines: string[] = [];
    let line = "";
    for (const w of words) {
      const test = line ? `${line} ${w}` : w;
      const testWidth = font.widthOfTextAtSize(test, size);
      if (testWidth > maxWidth) {
        if (line) lines.push(line);
        line = w;
      } else {
        line = test;
      }
    }
    if (line) lines.push(line);
    return lines;
  };

  const maxTextWidth = width - 80;

  const summaryLines = wrap(ai.executive_summary || "", maxTextWidth, 11);
  for (const ln of summaryLines) {
    page.drawText(ln, { x: 40, y, size: 11, font });
    y -= 14;
    if (y < 110) break;
  }
  y -= 8;

  page.drawText("Points clés", { x: 40, y, size: 12, font: fontBold });
  y -= 16;
  for (const k of ai.key_patterns?.slice(0, 6) ?? []) {
    const lines = wrap(`• ${k}`, maxTextWidth, 11);
    for (const ln of lines) {
      page.drawText(ln, { x: 50, y, size: 11, font });
      y -= 14;
      if (y < 110) break;
    }
    if (y < 110) break;
  }
  y -= 8;

  page.drawText("Signaux / à surveiller", { x: 40, y, size: 12, font: fontBold });
  y -= 16;
  for (const r of ai.red_flags?.slice(0, 6) ?? []) {
    const lines = wrap(`• ${r}`, maxTextWidth, 11);
    for (const ln of lines) {
      page.drawText(ln, { x: 50, y, size: 11, font, color: rgb(0.6, 0, 0) });
      y -= 14;
      if (y < 110) break;
    }
    if (y < 110) break;
  }

  y -= 8;
  page.drawText("Questions pour la consultation", { x: 40, y, size: 12, font: fontBold });
  y -= 16;
  for (const q of ai.questions_for_clinician?.slice(0, 6) ?? []) {
    const lines = wrap(`• ${q}`, maxTextWidth, 11);
    for (const ln of lines) {
      page.drawText(ln, { x: 50, y, size: 11, font });
      y -= 14;
      if (y < 110) break;
    }
    if (y < 110) break;
  }

  const disclaimer = ai.disclaimer || "Ceci ne remplace pas un avis médical.";
  const discLines = wrap(disclaimer, maxTextWidth, 9);
  y = 60;
  for (const ln of discLines.slice(0, 3)) {
    page.drawText(ln, { x: 40, y, size: 9, font, color: rgb(0.3, 0.3, 0.3) });
    y -= 12;
  }

  return await pdf.save();
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  try {
    const authHeader =
      req.headers.get("authorization") ??
      req.headers.get("Authorization") ??
      "";

    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing Authorization header" }), {
        status: 401,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    const body = (await req.json().catch(() => null)) as ReportReq | null;
    if (!body?.profile_id || !body?.from || !body?.to) {
      return new Response(JSON.stringify({ error: "Missing profile_id/from/to" }), {
        status: 400,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnon = Deno.env.get("SUPABASE_ANON_KEY");
    if (!supabaseUrl || !supabaseAnon) {
      throw new Error("Missing SUPABASE_URL or SUPABASE_ANON_KEY");
    }

    // Use the user's JWT so RLS applies (even if you deployed with --no-verify-jwt,
    // your DB still uses RLS via this Authorization header).
    const supabase = createClient(supabaseUrl, supabaseAnon, {
      global: { headers: { Authorization: authHeader } },
    });

    // 1) Fetch snapshot via RPC
    const { data: snapshot, error: snapErr } = await supabase.rpc(
      "build_report_snapshot",
      {
        profile_id: body.profile_id,
        d_from: body.from,
        d_to: body.to,
      },
    );

    if (snapErr) {
      return new Response(
        JSON.stringify({ error: "Snapshot RPC failed", details: snapErr.message }),
        {
          status: 502,
          headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
        },
      );
    }

    // 2) Compact snapshot for LLM (smaller prompt)
    const compact = compactSnapshot(snapshot);

    // 3) AI summary
    const prompt = buildAiPrompt(compact);
    const ai = await callLLM(prompt);

    // 4) Build PDF (no charts)
    const pdfBytes = await buildPdf(snapshot, ai);

    return new Response(pdfBytes, {
      status: 200,
      headers: {
        ...CORS_HEADERS,
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="Sanozia_Report_${body.from}_to_${body.to}.pdf"`,
      },
    });
  } catch (e) {
    const err = e as any;
    return new Response(
      JSON.stringify({
        error: "Unexpected error",
        details: String(err?.message ?? err),
        stack: String(err?.stack ?? "").split("\n").slice(0, 12),
      }),
      {
        status: 500,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      },
    );
  }
});