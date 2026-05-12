import "@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "@supabase/supabase-js";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type ReportReq = {
  profile_id: string;
  from: string;
  to: string;
  language?: "fr";
  debug?: boolean;
};

type SymptomEntry = {
  name?: string;
  intensity?: number;
};

type SymptomStats = {
  count?: number;
  avg_intensity?: number;
  max_intensity?: number;
};

type StoolEntry = {
  stool_date?: string;
  date?: string;
  stool_time?: string;
  time?: string;
  consistency?: number | string;
  blood_level?: string;
  blood?: string;
  mucus_level?: string;
  mucus?: string;
  evacuation_effort?: string;
  effort?: string;
  duration_minutes?: number;
  duration?: number;
  pain_level?: number;
  pain?: number;
  urgence?: number;
  urgency?: number;
  notes?: string;
  note?: string;
};

type ConsumptionEntry = {
  date?: string;
  consumption_date?: string;
  time?: string;
  consumption_time?: string;
  consumption?: string;
  name?: string;
  prep_mode?: string;
  preparation?: string;
  after_effects?: string;
};

type FeelingEntry = {
  date?: string;
  feeling_date?: string;
  time?: string;
  feeling_time?: string;
  global_feeling?: string;
  mood?: string;
  symptoms?: SymptomEntry[];
  notes?: string;
  note?: string;
};

type TreatmentEntry = {
  date?: string;
  taken_at?: string;
  treatment_date?: string;
  name?: string;
  treatment?: string;
  dose?: string;
  dosage?: string;
};

type DailyEntry = {
  stools?: {
    count?: number;
    pain_max?: number;
    consistency_avg?: number;
    blood_counts?: Record<string, number>;
    mucus_counts?: Record<string, number>;
    urgency_counts?: Record<string, number>;
  };
  feelings?: {
    global_feeling_mode?: string;
    notes_count?: number;
    symptoms_by_name?: Record<string, SymptomStats>;
  };
  consumptions?: {
    count?: number;
    by_type?: Record<string, number>;
  };
};

type Snapshot = {
  daily?: DailyEntry[];
  stools?: StoolEntry[];
  consumptions?: ConsumptionEntry[];
  feelings?: FeelingEntry[];
  treatments?: TreatmentEntry[];
  patient?: {
    name?: string;
    diagnosis?: string;
    last_calprotectin?: unknown;
    symptom_catalog?: unknown;
    rectocolite_signature?: unknown;
    [key: string]: unknown;
  };
  meta?: {
    range?: { from?: string; to?: string };
  };
  signature_questionnaire?: {
    calculated_signature?: unknown;
    confidence_score?: unknown;
    completed_at?: unknown;
  };
};

type AiSummary = {
  language: "fr";
  title: string;
  executive_summary: string;
  key_patterns: string[];
  red_flags: string[];
  suggestions_for_clinician: string[];
  disclaimer: string;
  confidence: number;
};

// ─── helpers ────────────────────────────────────────────────────────────────

function clamp01(n: number) {
  if (Number.isNaN(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

function safeText(s: unknown) {
  return typeof s === "string" ? s : "";
}

// ─── 🆕 tables de codes pour le format dense ────────────────────────────────

const BLOOD_CODES: Record<string, number> = {
  none: 0, traces: 1, light: 1, moderate: 2, heavy: 3, importante: 3,
};
const MUCUS_CODES: Record<string, number> = {
  none: 0, light: 1, moderate: 2, heavy: 3,
};
const EFFORT_CODES: Record<string, number> = {
  easy: 0, normal: 1, hard: 2,
};

// ─── 🆕 légende envoyée une seule fois dans le prompt ───────────────────────

const TIMELINE_LEGEND = `
# LÉGENDE TIMELINE
# Format : datetime|TYPE|champs...
# Types : S=Selle, C=Consommation, F=Feeling, T=Traitement
# Selle   : datetime|S|c{bristol}|b{sang}|m{mucus}|e{effort}|d{durée_min}|p{douleur}|u{urgence}[|note]
#   sang/mucus : 0=aucun 1=traces/léger 2=modéré 3=important
#   effort     : 0=facile 1=normal 2=difficile
#   urgence    : 0=non 1=oui 2=très urgent
# Consommation: datetime|C|{aliment}|{mode_prep}[|effets]
# Feeling     : datetime|F|{humeur}[|{symptômes}][|note]
# Traitement  : datetime|T|{nom}|{dose}
`.trim();

// ─── 🆕 encodeurs par type d'événement ──────────────────────────────────────

function encodeStoolEvent(s: StoolEntry): string {
  const dt = safeText(s?.stool_date ?? s?.date);
  const time = safeText(s?.stool_time ?? s?.time ?? "").slice(0, 5);
  const datetime = time ? `${dt}T${time}` : dt;
  const c = Number(s?.consistency ?? 0) || 0;
  const b = BLOOD_CODES[safeText(s?.blood_level ?? s?.blood).toLowerCase()] ?? 0;
  const m = MUCUS_CODES[safeText(s?.mucus_level ?? s?.mucus).toLowerCase()] ?? 0;
  const e = EFFORT_CODES[safeText(s?.evacuation_effort ?? s?.effort).toLowerCase()] ?? 1;
  const d = Number(s?.duration_minutes ?? s?.duration ?? 0) || 0;
  const p = Number(s?.pain_level ?? s?.pain ?? 0) || 0;
  const u = Number(s?.urgence ?? s?.urgency ?? 0) || 0;
  const note = safeText(s?.notes ?? s?.note);
  return `${datetime}|S|c${c}|b${b}|m${m}|e${e}|d${d}|p${p}|u${u}${note ? `|${note}` : ""}`;
}

function encodeConsumptionEvent(c: ConsumptionEntry): string {
  const dt = safeText(c?.date ?? c?.consumption_date);
  const time = safeText(c?.time ?? c?.consumption_time ?? "").slice(0, 5);
  const datetime = time ? `${dt}T${time}` : dt;
  const food = safeText(c?.consumption ?? c?.name ?? "?");
  const prep = safeText(c?.prep_mode ?? c?.preparation ?? "");
  const effects = safeText(c?.after_effects ?? "");
  return `${datetime}|C|${food}${prep ? `|${prep}` : ""}${effects ? `|effets:${effects}` : ""}`;
}

function encodeFeelingEvent(f: FeelingEntry): string {
  const dt = safeText(f?.date ?? f?.feeling_date);
  const time = safeText(f?.time ?? f?.feeling_time ?? "").slice(0, 5);
  const datetime = time ? `${dt}T${time}` : dt;
  const mood = safeText(f?.global_feeling ?? f?.mood ?? "?");
  const syms: SymptomEntry[] = Array.isArray(f?.symptoms) ? f.symptoms : [];
  const symStr = syms.map((s: SymptomEntry) => {
    const name = safeText(s?.name ?? s);
    const intensity = Number(s?.intensity ?? 0) || 0;
    return intensity > 0 ? `${name}(${intensity})` : name;
  }).join("+");
  const note = safeText(f?.notes ?? f?.note ?? "");
  return `${datetime}|F|${mood}${symStr ? `|${symStr}` : ""}${note ? `|${note}` : ""}`;
}

function encodeTreatmentEvent(t: TreatmentEntry): string {
  const dt = safeText(t?.date ?? t?.taken_at ?? t?.treatment_date ?? "");
  const name = safeText(t?.name ?? t?.treatment ?? "?");
  const dose = safeText(t?.dose ?? t?.dosage ?? "");
  return `${dt}|T|${name}${dose ? `|${dose}` : ""}`;
}

// ─── 🆕 buildDenseTimeline ───────────────────────────────────────────────────

function buildDenseTimeline(snapshot: Snapshot): string {
  const events: { datetime: string; line: string }[] = [];

  // Selles brutes
  const stools: StoolEntry[] = Array.isArray(snapshot?.stools) ? snapshot.stools : [];
  for (const s of stools) {
    const dt = safeText(s?.stool_date ?? s?.date);
    const time = safeText(s?.stool_time ?? s?.time ?? "").slice(0, 5);
    events.push({ datetime: `${dt}T${time || "00:00"}`, line: encodeStoolEvent(s) });
  }

  // Consommations brutes
  const consumptions: ConsumptionEntry[] = Array.isArray(snapshot?.consumptions) ? snapshot.consumptions : [];
  for (const c of consumptions) {
    const dt = safeText(c?.date ?? c?.consumption_date);
    const time = safeText(c?.time ?? c?.consumption_time ?? "").slice(0, 5);
    events.push({ datetime: `${dt}T${time || "00:00"}`, line: encodeConsumptionEvent(c) });
  }

  // Feelings brutes
  const feelings: FeelingEntry[] = Array.isArray(snapshot?.feelings) ? snapshot.feelings : [];
  for (const f of feelings) {
    const dt = safeText(f?.date ?? f?.feeling_date);
    const time = safeText(f?.time ?? f?.feeling_time ?? "").slice(0, 5);
    events.push({ datetime: `${dt}T${time || "00:00"}`, line: encodeFeelingEvent(f) });
  }

  // Traitements
  const treatments: TreatmentEntry[] = Array.isArray(snapshot?.treatments) ? snapshot.treatments : [];
  for (const t of treatments) {
    const dt = safeText(t?.date ?? t?.taken_at ?? t?.treatment_date ?? "");
    events.push({ datetime: `${dt}T00:00`, line: encodeTreatmentEvent(t) });
  }

  // Tri chronologique
  events.sort((a, b) => a.datetime.localeCompare(b.datetime));

  return events.map(e => e.line).join("\n");
}

// ─── snapshot compaction ────────────────────────────────────────────────────

function compactSnapshot(snapshot: Snapshot) {
  const daily: DailyEntry[] = Array.isArray(snapshot?.daily) ? snapshot.daily : [];
  const stools: StoolEntry[] = Array.isArray(snapshot?.stools) ? snapshot.stools : [];
  const consumptions: ConsumptionEntry[] = Array.isArray(snapshot?.consumptions) ? snapshot.consumptions : [];
  const feelings: FeelingEntry[] = Array.isArray(snapshot?.feelings) ? snapshot.feelings : [];

  // ─── agrégation globale (inchangée) ────────────────────────────────────────
  let stoolsTotal = 0;
  let painMax = 0;
  let consistencySum = 0;
  let consistencyCount = 0;
  let bloodDays = 0;
  let mucusDays = 0;
  let urgencyHighDays = 0;
  const globalFeelingCounts: Record<string, number> = {};
  let notesTotal = 0;
  let consumptionsTotal = 0;
  const consumptionByType: Record<string, number> = {};
  const symptomsAgg: Record<string, { count: number; sum: number; max: number }> = {};

  for (const d of daily) {
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
    const hasBlood = bloodCounts && typeof bloodCounts === "object"
      ? Object.entries(bloodCounts).some(([level, count]) => level !== "none" && Number(count) > 0)
      : false;
    if (hasBlood) bloodDays += 1;

    const mucusCounts = d?.stools?.mucus_counts ?? {};
    const hasMucus = mucusCounts && typeof mucusCounts === "object"
      ? Object.entries(mucusCounts).some(([level, count]) => level !== "none" && Number(count) > 0)
      : false;
    if (hasMucus) mucusDays += 1;

    const urgencyCounts = d?.stools?.urgency_counts ?? {};
    const u2 = Number((urgencyCounts && urgencyCounts["2"]) ?? 0) || 0;
    if (u2 > 0) urgencyHighDays += 1;

    const gf = safeText(d?.feelings?.global_feeling_mode);
    if (gf) globalFeelingCounts[gf] = (globalFeelingCounts[gf] ?? 0) + 1;

    notesTotal += Number(d?.feelings?.notes_count ?? 0) || 0;
    consumptionsTotal += Number(d?.consumptions?.count ?? 0) || 0;

    const byType = d?.consumptions?.by_type ?? {};
    if (byType && typeof byType === "object") {
      for (const [t, v] of Object.entries(byType)) {
        const n = Number(v) || 0;
        if (!t) continue;
        consumptionByType[t] = (consumptionByType[t] ?? 0) + n;
      }
    }

    const sym = d?.feelings?.symptoms_by_name ?? {};
    if (sym && typeof sym === "object") {
      for (const [name, stats] of Object.entries(sym)) {
        const c = Number(stats?.count ?? 0) || 0;
        const avg = Number(stats?.avg_intensity ?? 0) || 0;
        const mx = Number(stats?.max_intensity ?? 0) || 0;
        if (!symptomsAgg[name]) symptomsAgg[name] = { count: 0, sum: 0, max: 0 };
        symptomsAgg[name].count += c;
        symptomsAgg[name].sum += avg * (c || 1);
        if (mx > symptomsAgg[name].max) symptomsAgg[name].max = mx;
      }
    }
  }

  const consistencyAvgOverall = consistencyCount > 0 ? consistencySum / consistencyCount : null;

  const topSymptoms = Object.entries(symptomsAgg)
    .map(([name, v]) => ({
      name,
      count: v.count,
      avg_intensity: v.count > 0 ? v.sum / v.count : 0,
      max_intensity: v.max,
    }))
    .sort((a, b) => b.avg_intensity - a.avg_intensity)
    .slice(0, 15);

  const feelingMode =
    Object.entries(globalFeelingCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

  // ─── agrégation hebdomadaire (inchangée) ───────────────────────────────────
  const weeklyMap: Record<string, {
    week: string;
    stool_count: number;
    pain_max: number;
    consistency_sum: number;
    consistency_count: number;
    blood_days: number;
    mucus_days: number;
    urgency_high_days: number;
    feeling_counts: Record<string, number>;
    symptom_days: Record<string, number>;
    after_effects: string[];
    days: number;
  }> = {};

  const getWeekKey = (dateStr: string) => {
    const d = new Date(dateStr);
    const day = d.getUTCDay();
    const monday = new Date(d);
    monday.setUTCDate(d.getUTCDate() - ((day + 6) % 7));
    return monday.toISOString().slice(0, 10);
  };

  for (const s of stools) {
    const date = safeText(s?.date);
    if (!date) continue;
    const wk = getWeekKey(date);
    if (!weeklyMap[wk]) weeklyMap[wk] = {
      week: wk, stool_count: 0, pain_max: 0,
      consistency_sum: 0, consistency_count: 0,
      blood_days: 0, mucus_days: 0, urgency_high_days: 0,
      feeling_counts: {}, symptom_days: {}, after_effects: [], days: 0,
    };
    const w = weeklyMap[wk];
    w.stool_count += 1;
    const pain = Number(s?.pain ?? 0) || 0;
    if (pain > w.pain_max) w.pain_max = pain;
    const cons = Number(s?.consistency ?? 0);
    if (cons > 0) { w.consistency_sum += cons; w.consistency_count += 1; }
    if (s?.blood && s.blood !== "none") w.blood_days += 1;
    if (s?.mucus && s.mucus !== "none") w.mucus_days += 1;
    if (Number(s?.urgency ?? 0) >= 2) w.urgency_high_days += 1;
  }

  for (const f of feelings) {
    const date = safeText(f?.date);
    if (!date) continue;
    const wk = getWeekKey(date);
    if (!weeklyMap[wk]) continue;
    const w = weeklyMap[wk];
    const gf = safeText(f?.global_feeling);
    if (gf) w.feeling_counts[gf] = (w.feeling_counts[gf] ?? 0) + 1;
    const syms: SymptomEntry[] = Array.isArray(f?.symptoms) ? f.symptoms : [];
    for (const sym of syms) {
      const name = safeText(sym?.name);
      if (name) w.symptom_days[name] = (w.symptom_days[name] ?? 0) + 1;
    }
  }

  for (const c of consumptions) {
    const date = safeText(c?.date);
    if (!date) continue;
    const wk = getWeekKey(date);
    if (!weeklyMap[wk]) continue;
    const ae = safeText(c?.after_effects);
    if (ae) weeklyMap[wk].after_effects.push(`${c.consumption ?? "?"}→${ae}`);
  }

  const weekly_breakdown = Object.values(weeklyMap)
    .sort((a, b) => a.week.localeCompare(b.week))
    .map(w => ({
      week_start: w.week,
      stool_count: w.stool_count,
      stool_per_day_avg: +(w.stool_count / 7).toFixed(1),
      consistency_avg: w.consistency_count > 0
        ? +(w.consistency_sum / w.consistency_count).toFixed(1)
        : null,
      pain_max: w.pain_max,
      blood_days: w.blood_days,
      mucus_days: w.mucus_days,
      urgency_high_days: w.urgency_high_days,
      dominant_feeling: Object.entries(w.feeling_counts)
        .sort((a, b) => b[1] - a[1])[0]?.[0] ?? null,
      top_symptoms: Object.entries(w.symptom_days)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([name, days]) => ({ name, days })),
      notable_after_effects: w.after_effects.slice(0, 5),
    }));

  const patientExtra = {
    last_calprotectin: snapshot?.patient?.last_calprotectin ?? null,
    symptom_catalog: snapshot?.patient?.symptom_catalog ?? null,
    rectocolite_signature: snapshot?.patient?.rectocolite_signature ?? null,
  };

  const signatureQuestionnaire = snapshot?.signature_questionnaire
    ? {
        calculated_signature: snapshot.signature_questionnaire.calculated_signature,
        confidence_score: snapshot.signature_questionnaire.confidence_score,
        completed_at: snapshot.signature_questionnaire.completed_at,
      }
    : null;

  // 🆕 timeline dense (remplace detailed.daily)
  const timeline = buildDenseTimeline(snapshot);

  return {
    meta: snapshot?.meta ?? null,
    patient: {
      ...(snapshot?.patient ?? {}),
      ...patientExtra,
    },
    signature_questionnaire: signatureQuestionnaire,
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

    weekly_breakdown,

    // 🆕 timeline dense à la place de detailed.daily
    timeline,

    symptoms_full: symptomsAgg,
  };
}

// ─── AI ─────────────────────────────────────────────────────────────────────

function buildAiPrompt(compact: ReturnType<typeof compactSnapshot>) {
  // 🆕 on sépare la timeline du reste pour injecter la légende proprement
  const { timeline, ...compactWithoutTimeline } = compact;

  return `
You are generating a clinician-ready PDF report summary for an IBD/MICI tracking app.

Return ONLY valid JSON (no markdown, no extra text).

Schema:
{
  "language": "fr",
  "title": "string (clear and informative)"
  "executive_summary": "string (detailed paragraph, 5-8 lines, structured and insightful)",
  "key_patterns": ["string", "string", "string", "..."],
  "red_flags": ["string", "string", "..."],
  "suggestions_for_clinician": ["string", "string", "string", "..."],
  "disclaimer": "string (must include: Ceci ne remplace pas un avis médical.)",
  "confidence": number (0.0 to 1.0)
}

Rules:
- Write in clear, professional, clinician-friendly French.
- Be slightly more detailed than a typical short summary.
- Highlight evolution over time (not just averages).
- Use the timeline to identify temporal patterns, correlations, and variations.
- Mention notable fluctuations, peaks, or recurring symptoms.
- Do NOT diagnose. Do NOT prescribe. Use cautious and observational language.
- If blood appears repeatedly or symptoms worsen: suggest consulting a clinician.
- Mention the selected date range.
- Avoid redundancy, but provide meaningful insight.

Guidelines for content richness:
- executive_summary should be a well-structured paragraph (not too short).
- key_patterns can include up to 5–6 items if relevant.
- red_flags can include up to 3–4 items.
- suggestions_for_clinician can include up to 4–5 actionable observations.

## Résumé et contexte patient
${JSON.stringify(compactWithoutTimeline)}

## Timeline chronologique complète (format dense)
${TIMELINE_LEGEND}

${timeline ?? "(aucune donnée)"}
`.trim();
}

async function callLLM(prompt: string): Promise<AiSummary> {
  const LLM_API_KEY = Deno.env.get("LLM_API_KEY");
  const LLM_MODEL = Deno.env.get("LLM_MODEL") ?? "meta-llama/llama-3.2-3b-instruct:free";
  if (!LLM_API_KEY) throw new Error("Missing LLM_API_KEY");

  const resp = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${LLM_API_KEY}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://sanozia.app",
      "X-OpenRouter-Title": "Sanozia",
    },
    body: JSON.stringify({
      model: LLM_MODEL,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
    }),
  });

  if (!resp.ok) {
    const details = await resp.text();
    throw new Error(`Eurouter failed (${resp.status}): ${details}`);
  }

  const json = await resp.json();
  const text = json?.choices?.[0]?.message?.content ?? "";
  const cleaned = String(text).trim().replace(/^```(?:json)?\s*/i, "").replace(/```$/i, "").trim();
  const parsed = JSON.parse(cleaned) as AiSummary;
  parsed.confidence = clamp01(Number(parsed.confidence ?? 0));

  return parsed;
}

// ─── PDF builder ─────────────────────────────────────────────────────────────

async function buildPdf(snapshot: Snapshot, ai: AiSummary) {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold);

  const A4W = 595.28;
  const A4H = 841.89;

  const page1 = pdf.addPage([A4W, A4H]);
  const { width, height } = page1.getSize();
  let y = height - 48;

  const patientName = safeText(snapshot?.patient?.name) || "Patient";
  const diagnosis = safeText(snapshot?.patient?.diagnosis);
  const rangeFrom = safeText(snapshot?.meta?.range?.from);
  const rangeTo = safeText(snapshot?.meta?.range?.to);

  page1.drawRectangle({ x: 0, y: height - 56, width, height: 56, color: rgb(0.09, 0.46, 0.82) });
  page1.drawText("Sanozia — Rapport Clinicien", { x: 40, y: height - 36, size: 18, font: fontBold, color: rgb(1, 1, 1) });

  y = height - 72;
  page1.drawText(`Patient: ${patientName}`, { x: 40, y, size: 11, font });
  y -= 16;
  if (diagnosis) {
    page1.drawText(`Diagnostic: ${diagnosis}`, { x: 40, y, size: 11, font });
    y -= 16;
  }
  page1.drawText(`Periode: ${rangeFrom} - ${rangeTo}`, { x: 40, y, size: 11, font });
  y -= 28;

  page1.drawText(ai.title || "Résumé", { x: 40, y, size: 14, font: fontBold, color: rgb(0.09, 0.46, 0.82) });
  y -= 20;

  const wrap = (text: string, maxWidth: number, size: number) => {
    const words = text.split(/\s+/);
    const lines: string[] = [];
    let line = "";
    for (const w of words) {
      const test = line ? `${line} ${w}` : w;
      if (font.widthOfTextAtSize(test, size) > maxWidth) {
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

  for (const ln of wrap(ai.executive_summary || "", maxTextWidth, 11)) {
    page1.drawText(ln, { x: 40, y, size: 11, font });
    y -= 14;
    if (y < 110) break;
  }
  y -= 10;

  const drawSection = (title: string, items: string[], color = rgb(0.1, 0.1, 0.1)) => {
    if (y < 110) return;
    page1.drawText(title, { x: 40, y, size: 12, font: fontBold });
    y -= 16;
    for (const item of items?.slice(0, 6) ?? []) {
      for (const ln of wrap(`- ${item}`, maxTextWidth, 10)) {
        page1.drawText(ln, { x: 50, y, size: 10, font, color });
        y -= 13;
        if (y < 110) break;
      }
      if (y < 110) break;
    }
    y -= 8;
  };

  drawSection("Points clés", ai.key_patterns);
  drawSection("Signaux à surveiller", ai.red_flags, rgb(0.6, 0, 0));
  drawSection("Suggestions pour la consultation", ai.suggestions_for_clinician);

  const discLines = wrap(ai.disclaimer || "Ceci ne remplace pas un avis médical.", maxTextWidth, 8);
  let dy = 55;
  for (const ln of discLines.slice(0, 3)) {
    page1.drawText(ln, { x: 40, y: dy, size: 8, font, color: rgb(0.4, 0.4, 0.4) });
    dy -= 11;
  }

  return await pdf.save();

}
// ─── Handler ─────────────────────────────────────────────────────────────────

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
    if (!supabaseUrl || !supabaseAnon) throw new Error("Missing SUPABASE_URL or SUPABASE_ANON_KEY");

    const supabase = createClient(supabaseUrl, supabaseAnon, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: snapshot, error: snapErr } = await supabase.rpc("snapshot_builder", {
      p_profile_id: body.profile_id,
      p_d_from: body.from,
      p_d_to: body.to,
    });

    if (snapErr) {
      return new Response(
        JSON.stringify({ error: "Snapshot RPC failed", details: snapErr.message }),
        { status: 502, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } },
      );
    }

    if (body.debug === true) {
      const compact = compactSnapshot(snapshot);
      return new Response(
        JSON.stringify({
          _debug: true,
          snapshot_keys: Object.keys(snapshot ?? {}),
          daily_length: Array.isArray(snapshot?.daily) ? snapshot.daily.length : "NOT AN ARRAY - actual type: " + typeof snapshot?.daily,
          first_daily_entry: snapshot?.daily?.[0] ?? null,
          timeline_preview: compact.timeline?.split("\n").slice(0, 10).join("\n"),
          timeline_total_lines: compact.timeline?.split("\n").length ?? 0,
        }, null, 2),
        { status: 200, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } },
      );
    }

    const compact = compactSnapshot(snapshot);
    const prompt = buildAiPrompt(compact);
    const ai = await callLLM(prompt);
    const pdfBytes = await buildPdf(snapshot, ai);

    return new Response(pdfBytes.buffer as ArrayBuffer, {
      status: 200,
      headers: {
        ...CORS_HEADERS,
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="Sanozia_Report_${body.from}_to_${body.to}.pdf"`,
      },
    });
  } catch (e) {
    const err = e instanceof Error ? e : new Error(String(e));
    return new Response(
      JSON.stringify({
        error: "Unexpected error",
        details: err.message,
      }),
      { status: 500, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } },
    );
  }
});