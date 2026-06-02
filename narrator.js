// narrator.js — Turns a structured round report into a short story.
// Uses OpenAI gpt-4.1-nano when an API key is set; otherwise composes a
// deterministic narrative so the game always works offline.

import * as GameState from './gameState.js';

const MODEL = "gpt-4.1-nano";
const ENDPOINT = "https://api.openai.com/v1/chat/completions";

function moverPhrase(m) {
  const improved = m.lowerIsBetter ? m.delta < 0 : m.delta > 0;
  const dir = m.delta > 0 ? "rose" : "fell";
  const word = improved ? "improving" : "worsening";
  return `${m.name} ${dir} ${Math.abs(Math.round(m.delta))} points (${word})`;
}

/** Compact, model-friendly summary of the round. */
function reportToFacts(report) {
  const lines = [];
  lines.push(`Round ${report.round} (term ${report.term}).`);
  if (report.enacted.length) lines.push(`Newly enacted: ${report.enacted.join(", ")}.`);
  else lines.push(`No new policies were enacted this round.`);
  if (report.speeches && report.speeches.length) lines.push(`The leader gave speeches on: ${report.speeches.join(", ")}.`);
  if (report.events.length) lines.push(`Events: ${report.events.map(e => `${e.title} — ${e.seed}`).join(" ")}`);
  else lines.push(`No major events occurred.`);
  if (report.movers.length) lines.push(`Notable indicator shifts: ${report.movers.map(moverPhrase).join("; ")}.`);
  lines.push(`Public approval moved from ${report.approvalBefore}% to ${report.approvalAfter}%.`);
  lines.push(`Government mandate: "${report.goal}" (progress ${report.goalProgress}%).`);
  if (report.goalNewlyAchieved) lines.push(`The government's mandate has just been ACHIEVED.`);
  if (report.election) {
    lines.push(report.election.reElected
      ? `An election was held: the government was RE-ELECTED with ${report.election.approval}% approval.`
      : `An election was held: the government LOST power with only ${report.election.approval}% approval.`);
  }
  return lines.join("\n");
}

async function narrateWithLLM(report, apiKey) {
  const facts = reportToFacts(report);
  // Never let a slow/blocked request hang the round — abort after 9s and fall back.
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 9000);
  let res;
  try {
    res = await fetch(ENDPOINT, {
    method: "POST",
    signal: controller.signal,
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: MODEL,
      temperature: 0.9,
      max_tokens: 220,
      messages: [
        { role: "system", content:
          "You are the in-game political chronicler for 'AI Democracy', a satirical nation-governing strategy game. " +
          "Given the facts of a round, write a vivid 2–4 sentence news-bulletin-style story of what happened this round " +
          "in the nation. Be concrete, reference the actual events and indicator shifts, and keep a wry, journalistic tone. " +
          "Do not use bullet points or headers — just flowing prose." },
        { role: "user", content: facts },
      ],
    }),
    });
  } finally {
    clearTimeout(timer);
  }
  if (!res.ok) throw new Error(`OpenAI ${res.status}`);
  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content?.trim();
  if (!text) throw new Error("Empty completion");
  return text;
}

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

/** Deterministic fallback story — no API needed. */
export function composeFallbackNarrative(report) {
  const parts = [];

  if (report.events.length) {
    parts.push(report.events.map(e => e.seed).join(" "));
  } else {
    parts.push(pick([
      "The nation enjoyed a quiet round with no great upheavals.",
      "It was an uneventful stretch — the machinery of state ground on without drama.",
      "No crises, no miracles: just the steady hum of governance.",
    ]));
  }

  if (report.enacted.length) {
    parts.push(`In the chamber, the government pushed through ${report.enacted.join(", ")}, and the country began to feel the effects.`);
  }

  if (report.movers.length) {
    const top = report.movers[0];
    const improved = top.lowerIsBetter ? top.delta < 0 : top.delta > 0;
    parts.push(`${top.name} ${top.delta > 0 ? "climbed" : "slid"}, ${improved ? "to the government's relief" : "to the opposition's delight"}.`);
  }

  const swing = report.approvalAfter - report.approvalBefore;
  if (swing > 1) parts.push(`Public approval ticked up to ${report.approvalAfter}%.`);
  else if (swing < -1) parts.push(`Public approval slipped to ${report.approvalAfter}%.`);
  else parts.push(`Public approval held steady around ${report.approvalAfter}%.`);

  if (report.goalNewlyAchieved) parts.push(`Remarkably, the government's mandate — ${report.goal} — has now been fulfilled.`);

  if (report.election) {
    parts.push(report.election.reElected
      ? `At the ballot box, voters returned the government to power with ${report.election.approval}% approval.`
      : `At the ballot box, the government was swept from power, managing only ${report.election.approval}% approval.`);
  }

  return parts.join(" ");
}

/** Narrate a round, preferring the LLM but always returning prose. */
export async function narrateRound(report) {
  const apiKey = GameState.getApiKey();
  if (apiKey) {
    try { return { text: await narrateWithLLM(report, apiKey), source: "llm" }; }
    catch (err) { return { text: composeFallbackNarrative(report), source: "fallback", error: String(err) }; }
  }
  return { text: composeFallbackNarrative(report), source: "fallback" };
}
