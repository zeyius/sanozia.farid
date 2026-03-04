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

async function makeQuickChartPngUrl(config: any) {
  // No key needed for QuickChart basic usage
  const resp = await fetch("https://quickchart.io/chart", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      width: 900,
      height: 360,
      backgroundColor: "white",
      format: "png",
      chart: config,
    }),
  });

  // QuickChart can return the image directly for GET, but for POST we can just use their "chart" endpoint
  // If this fails, we fallback later.
  if (!resp.ok) throw new Error("QuickChart failed");
  const blob = await resp.blob();
  const bytes = new Uint8Array(await blob.arrayBuffer());

  // Convert to data URL to embed easily
  const base64 = btoa(String.fromCharCode(...bytes));
  return `data:image/png;base64,${base64}`;
}

async function dataUrlToBytes(dataUrl: string) {
  const base64 = dataUrl.split(",")[1] ?? "";
  const bin = atob(base64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

function buildChartsFromSnapshot(snapshot: any) {
  const daily = Array.isArray(snapshot?.daily) ? snapshot.daily : [];

  const labels: string[] = [];
  const stoolsPerDay: number[] = [];
  const bloodDays: number[] = [];
  const avgConsistency: (number | null)[] = [];
  const feelingScore: (number | null)[] = [];

  const feelingMap: Record<string, number> = {
    bad: 1,
    ok: 2,
    good: 3,
    excellent: 4,
  };

  for (const d of daily) {
    const date = safeText(d?.date);
    labels.push(date);

    const stoolsCount = Number(d?.stools?.count ?? 0) || 0;
    stoolsPerDay.push(stoolsCount);

    const bloodCounts = d?.stools?.blood_counts ?? {};
    const hasBlood = Object.entries(bloodCounts).some(
      ([level, count]) => level !== "none" && Number(count) > 0,
    );
    bloodDays.push(hasBlood ? 1 : 0);

    const cavg = d?.stools?.consistency_avg;
    avgConsistency.push(
      typeof cavg === "number" && Number.isFinite(cavg) ? cavg : null,
    );

    const gf = d?.feelings?.global_feeling_mode;
    feelingScore.push(gf && feelingMap[gf] ? feelingMap[gf] : null);
  }

  return { labels, stoolsPerDay, bloodDays, avgConsistency, feelingScore };
}

function buildAiPrompt(snapshot: any, charts: any) {
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

Inputs:
- Patient/profile meta + daily aggregates snapshot:
${JSON.stringify(snapshot)}

- Precomputed chart series:
${JSON.stringify(charts)}
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

async function buildPdf(snapshot: any, ai: AiSummary, chartImages: Uint8Array[]) {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold);

  // Page 1: Header + AI summary
  let page = pdf.addPage([595.28, 841.89]); // A4
  const { width, height } = page.getSize();
  let y = height - 48;

  const patientName = safeText(snapshot?.patient?.name) || "Patient";
  const diagnosis = safeText(snapshot?.patient?.diagnosis);
  const rangeFrom = safeText(snapshot?.meta?.range?.from);
  const rangeTo = safeText(snapshot?.meta?.range?.to);

  page.drawText("Sanozia — Rapport Clinicien", { x: 40, y, size: 18, font: fontBold });
  y -= 26;

  page.drawText(`Patient: ${patientName}`, { x: 40, y, size: 11, font });
  y -= 16;

  if (diagnosis) {
    page.drawText(`Diagnostic: ${diagnosis}`, { x: 40, y, size: 11, font });
    y -= 16;
  }

  page.drawText(`Période: ${rangeFrom} → ${rangeTo}`, { x: 40, y, size: 11, font });
  y -= 24;

  page.drawText(ai.title || "Résumé", { x: 40, y, size: 14, font: fontBold });
  y -= 18;

  // Wrap text helper
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
    if (y < 80) break;
  }
  y -= 8;

  page.drawText("Points clés", { x: 40, y, size: 12, font: fontBold });
  y -= 16;
  for (const k of ai.key_patterns?.slice(0, 6) ?? []) {
    const lines = wrap(`• ${k}`, maxTextWidth, 11);
    for (const ln of lines) {
      page.drawText(ln, { x: 50, y, size: 11, font });
      y -= 14;
    }
  }
  y -= 8;

  page.drawText("Signaux / à surveiller", { x: 40, y, size: 12, font: fontBold });
  y -= 16;
  for (const r of ai.red_flags?.slice(0, 6) ?? []) {
    const lines = wrap(`• ${r}`, maxTextWidth, 11);
    for (const ln of lines) {
      page.drawText(ln, { x: 50, y, size: 11, font, color: rgb(0.6, 0, 0) });
      y -= 14;
    }
  }

  y -= 8;
  page.drawText("Questions pour la consultation", { x: 40, y, size: 12, font: fontBold });
  y -= 16;
  for (const q of ai.questions_for_clinician?.slice(0, 6) ?? []) {
    const lines = wrap(`• ${q}`, maxTextWidth, 11);
    for (const ln of lines) {
      page.drawText(ln, { x: 50, y, size: 11, font });
      y -= 14;
    }
  }

  const disclaimer = ai.disclaimer || "Ceci ne remplace pas un avis médical.";
  const discLines = wrap(disclaimer, maxTextWidth, 9);
  y = 60;
  for (const ln of discLines.slice(0, 3)) {
    page.drawText(ln, { x: 40, y, size: 9, font, color: rgb(0.3, 0.3, 0.3) });
    y -= 12;
  }

  // Pages for charts
  for (let i = 0; i < chartImages.length; i++) {
    const imgBytes = chartImages[i];
    const img = await pdf.embedPng(imgBytes);

    const p = pdf.addPage([595.28, 841.89]);
    const pw = p.getWidth();
    const ph = p.getHeight();

    p.drawText("Graphiques (données agrégées)", { x: 40, y: ph - 48, size: 14, font: fontBold });

    const imgWidth = pw - 80;
    const imgHeight = (img.height / img.width) * imgWidth;
    const x = 40;
    const yImg = ph - 90 - imgHeight;

    p.drawImage(img, { x, y: yImg, width: imgWidth, height: imgHeight });
  }

  const bytes = await pdf.save();
  return bytes;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS_HEADERS });

  try {
    const authHeader = req.headers.get("authorization") ?? req.headers.get("Authorization") ?? "";
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
    if (!supabaseUrl || !supabaseAnon) throw new Error("Missing SUPABASE_URL or SUPABASE_ANON_KEY");

    // Use the user's JWT so RLS applies.
    const supabase = createClient(supabaseUrl, supabaseAnon, {
      global: { headers: { Authorization: authHeader } },
    });

    // 1) Fetch snapshot via RPC (you’ll create this DB function next step)
    const { data: snapshot, error: snapErr } = await supabase.rpc("build_report_snapshot", {
      profile_id: body.profile_id,
      d_from: body.from,
      d_to: body.to,
    });

    if (snapErr) {
      return new Response(JSON.stringify({ error: "Snapshot RPC failed", details: snapErr.message }), {
        status: 502,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    // 2) Build chart series
    const charts = buildChartsFromSnapshot(snapshot);

    // 3) AI summary
    const prompt = buildAiPrompt(snapshot, charts);
    const ai = await callLLM(prompt);

    // 4) Create chart images (QuickChart) — 2 charts to start
    const chart1Cfg = {
      type: "line",
      data: {
        labels: charts.labels,
        datasets: [{ label: "Selles / jour", data: charts.stoolsPerDay }],
      },
      options: { plugins: { legend: { display: true } } },
    };

    const chart2Cfg = {
      type: "line",
      data: {
        labels: charts.labels,
        datasets: [{ label: "Consistance moyenne", data: charts.avgConsistency }],
      },
      options: { plugins: { legend: { display: true } } },
    };

    const dataUrl1 = await makeQuickChartPngUrl(chart1Cfg);
    const dataUrl2 = await makeQuickChartPngUrl(chart2Cfg);

    const img1 = await dataUrlToBytes(dataUrl1);
    const img2 = await dataUrlToBytes(dataUrl2);

    // 5) Build PDF
    const pdfBytes = await buildPdf(snapshot, ai, [img1, img2]);

    return new Response(pdfBytes, {
      status: 200,
      headers: {
        ...CORS_HEADERS,
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="Sanozia_Report_${body.from}_to_${body.to}.pdf"`,
      },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: "Unexpected error", details: String(e) }), {
      status: 500,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }
});