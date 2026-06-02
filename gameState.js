// gameState.js — Curve-based political simulation with an agent-based electorate,
// a political-capital economy, and a cabinet of ministers.
//
// • Indicators ease toward targets (policy pressure × minister effectiveness +
//   inter-indicator influence). Nothing snaps.
// • The public is 10,000 individuals (population.js) regenerated from a seed.
//   Approval is a pure projection of state → only the seed + scalars are saved.
// • Political capital is earned each round (more when beloved) + minister upkeep,
//   and by giving speeches; it is spent enacting policies and appointing ministers.

import { METRICS, POLICIES } from './policies.js';
import {
  INDICATOR_INERTIA, DEFAULT_INERTIA, INDICATOR_LINKS, EVENTS, GOALS, SIM,
  VOTER_PROFILES, TRAIT_PREVALENCE, PORTFOLIOS, MINISTERS, SPEECH_THEMES, POLICY_STAGES,
} from './gameData.js';
import * as Pop from './population.js';
import * as Store from './persistence.js';
import * as RenderFunctions from './renderFunctions.js';

const POLICY_BY_ID   = new Map(POLICIES.map(p => [p.id, p]));
const MINISTER_BY_ID = new Map(MINISTERS.map(m => [m.id, m]));
const TRAIT_IDS = Object.keys(TRAIT_PREVALENCE);
const HISTORY_CAP = 48;
export const TERM_LENGTH = SIM.TERM_LENGTH;
export const LEVEL_CHANGE_COST = SIM.LEVEL_CHANGE_COST;

// ── Helpers ───────────────────────────────────────────────────────────────────
export function clamp(value, min = 0, max = 200) {
  return Math.max(min, Math.min(max, value));
}
const clamp01 = v => Math.max(0, Math.min(1, v));
const indicatorMap = gs => new Map(gs.metrics.map(m => [m.id, m]));
const dist2D = (a, b) => Math.hypot(a.econ - b.econ, a.soc - b.soc);

// ── Staged policies ─────────────────────────────────────────────────────────────
export function stagesOf(policy) { return POLICY_STAGES[policy.id] || null; }
export function maxLevel(policy) { const s = stagesOf(policy); return s ? s.length : 1; }
export function levelOf(gs, id) { return (gs.enactedLevels && gs.enactedLevels[id]) || 1; }
function effectScale(policy, level) { const s = stagesOf(policy); return s ? s[Math.min(level, s.length) - 1].effect : 1; }
/** Per-round money flow (negative = spending, positive = revenue) for a policy at a level. */
export function policyFiscal(policy, level) {
  const s = stagesOf(policy);
  if (s) return s[Math.min(level, s.length) - 1].fiscal;
  const debt = (policy.metricEffects.find(e => e.id === "nationalDebt")?.change) || 0;
  return Math.round(-debt * SIM.FISCAL_PER_DEBT);
}
/** Capital cost to first enact a policy at a level (after minister discount). */
export function enactCapitalCost(gs, policy, level = 1) {
  const s = stagesOf(policy);
  const base = s ? s[Math.min(level, s.length) - 1].cost : policy.cost;
  return Math.round(base * (1 - costReductionFor(gs, policy.category)));
}

// ── Module-level derived data (never persisted) ─────────────────────────────────
let population = null;
let electorate = { overall: 50, groupApproval: {}, counts: {} };

function ensurePopulation(gs) {
  if (!population || population.seed !== gs.seed) population = Pop.generatePopulation(gs.seed);
  return population;
}
export function getPopulation(gs) { return ensurePopulation(gs); }
export function getElectorate(gs) { if (!electorate.counts || !Object.keys(electorate.counts).length) recomputeElectorate(gs); return electorate; }
export function overallApproval(gs) { return Math.round(getElectorate(gs).overall); }
export function groupApproval(gs, traitId) {
  const v = getElectorate(gs).groupApproval[traitId];
  return v == null ? 50 : v;
}

// ── Cabinet helpers ─────────────────────────────────────────────────────────────
export function ministerById(id) { return MINISTER_BY_ID.get(id) || null; }
export function portfolioOf(category) { return PORTFOLIOS.find(p => p.categories.includes(category)) || null; }

function effectivenessByCategory(gs) {
  const map = {};
  for (const port of PORTFOLIOS) {
    const min = gs.cabinet[port.id] ? MINISTER_BY_ID.get(gs.cabinet[port.id]) : null;
    for (const c of port.categories) map[c] = min ? min.effectiveness : 1;
  }
  return map;
}
function costReductionByCategory(gs) {
  const map = {};
  for (const port of PORTFOLIOS) {
    const min = gs.cabinet[port.id] ? MINISTER_BY_ID.get(gs.cabinet[port.id]) : null;
    for (const c of port.categories) map[c] = min ? min.costReduction : 0;
  }
  return map;
}
export function costReductionFor(gs, category) { return costReductionByCategory(gs)[category] || 0; }
export function effectiveCost(gs, policy) {
  return Math.round(policy.cost * (1 - costReductionFor(gs, policy.category)));
}
function ministerBias(gs) {
  const bias = {};
  for (const port of PORTFOLIOS) {
    const min = gs.cabinet[port.id] ? MINISTER_BY_ID.get(gs.cabinet[port.id]) : null;
    if (!min) continue;
    for (const [t, d] of min.approvalBias) bias[t] = (bias[t] || 0) + d;
  }
  return bias;
}

// ── Electorate projection ────────────────────────────────────────────────────────
function traitScores(gs) {
  const byId = indicatorMap(gs);
  const bias = ministerBias(gs);
  const outcome = {}, policy = {};
  for (const t of TRAIT_IDS) {
    let o = 0;
    for (const [indId, weight] of (VOTER_PROFILES[t] || [])) {
      const m = byId.get(indId);
      if (!m) continue;
      const good = m.lowerIsBetter ? (100 - m.value) : (m.value - 100);
      o += weight * good * SIM.VOTER_INDICATOR_SCALE;
    }
    outcome[t] = o; policy[t] = 0;
  }
  for (const pid of gs.enactedPolicyIds) {
    const p = POLICY_BY_ID.get(pid);
    if (!p) continue;
    const scale = effectScale(p, levelOf(gs, pid));
    for (const eff of p.voterEffects) {
      if (policy[eff.id] !== undefined) policy[eff.id] += eff.change * SIM.POLICY_SENTIMENT_SCALE * scale;
    }
  }
  const score = {};
  for (const t of TRAIT_IDS) score[t] = outcome[t] + policy[t] + (bias[t] || 0);
  return score;
}

export function recomputeElectorate(gs) {
  ensurePopulation(gs);
  electorate = Pop.computeApproval(population, {
    traitScore: traitScores(gs), gov: gs.gov, mood: gs.mood,
  });
  return electorate;
}

/** Decompose a group's approval drivers into reasons for/against. */
export function groupReasons(gs, traitId) {
  const byId = indicatorMap(gs);
  const pos = [], neg = [];
  for (const [indId, weight] of (VOTER_PROFILES[traitId] || [])) {
    const m = byId.get(indId);
    if (!m) continue;
    const good = m.lowerIsBetter ? (100 - m.value) : (m.value - 100);
    const contribution = weight * good;
    if (Math.abs(contribution) < 2) continue;
    (contribution > 0 ? pos : neg).push({ kind: "indicator", name: m.name, value: Math.round(contribution) });
  }
  for (const pid of gs.enactedPolicyIds) {
    const p = POLICY_BY_ID.get(pid);
    if (!p) continue;
    for (const eff of p.voterEffects) {
      if (eff.id !== traitId || Math.abs(eff.change) < 4) continue;
      (eff.change > 0 ? pos : neg).push({ kind: "policy", name: p.name, value: eff.change });
    }
  }
  for (const port of PORTFOLIOS) {
    const min = gs.cabinet[port.id] ? MINISTER_BY_ID.get(gs.cabinet[port.id]) : null;
    if (!min) continue;
    for (const [t, d] of min.approvalBias) {
      if (t !== traitId) continue;
      (d > 0 ? pos : neg).push({ kind: "minister", name: `Minister ${min.name}`, value: d });
    }
  }
  pos.sort((a, b) => b.value - a.value);
  neg.sort((a, b) => a.value - b.value);
  return { pos: pos.slice(0, 5), neg: neg.slice(0, 5) };
}

// ── Indicator dynamics ────────────────────────────────────────────────────────────
function computeIndicatorTargets(gs) {
  const byId = indicatorMap(gs);
  const eff = effectivenessByCategory(gs);
  const targets = {};
  for (const m of gs.metrics) targets[m.id] = 100;

  for (const pid of gs.enactedPolicyIds) {
    const p = POLICY_BY_ID.get(pid);
    if (!p) continue;
    const mult = (eff[p.category] ?? 1) * effectScale(p, levelOf(gs, pid));
    for (const e of p.metricEffects) {
      if (targets[e.id] !== undefined) targets[e.id] += e.change * mult;
    }
  }
  // Budget feedback: sustained deficits push national debt up; surpluses pull it down.
  if (targets.nationalDebt !== undefined && gs.treasury != null) {
    const adj = Math.max(-32, Math.min(32, -gs.treasury * SIM.DEBT_FROM_TREASURY));
    targets.nationalDebt = clamp(targets.nationalDebt + adj);
  }
  for (const link of INDICATOR_LINKS) {
    const src = byId.get(link.from);
    if (!src || targets[link.to] === undefined) continue;
    targets[link.to] += link.weight * (src.value - 100);
  }
  // Ongoing events drag (or lift) their indicators while active.
  for (const a of (gs.activeEvents || [])) {
    const e = EVENT_BY_ID.get(a.id);
    if (!e || e.kind !== "ongoing" || !e.pressure) continue;
    for (const p of e.pressure) if (targets[p.id] !== undefined) targets[p.id] += p.delta;
  }
  for (const id in targets) targets[id] = clamp(targets[id]);
  return targets;
}

function applyIndicatorStep(gs, { frac = 1, drift = false } = {}) {
  const targets = computeIndicatorTargets(gs);
  for (const m of gs.metrics) {
    let target = targets[m.id];
    if (drift) target = clamp(target + (Math.random() - 0.5) * 2 * SIM.DRIFT);
    m.target = target;
    const k = (INDICATOR_INERTIA[m.id] ?? DEFAULT_INERTIA) * frac;
    m.value = clamp(m.value + (target - m.value) * k);
  }
}

function applyGovStep(gs, frac = 1) {
  const target = Pop.governmentCompass(getEnactedPolicies(gs));
  gs.gov.econ += (target.econ - gs.gov.econ) * SIM.GOV_INERTIA * frac;
  gs.gov.soc  += (target.soc  - gs.gov.soc)  * SIM.GOV_INERTIA * frac;
}

// ── Events ───────────────────────────────────────────────────────────────────────
const EVENT_BY_ID = new Map(EVENTS.map(e => [e.id, e]));
const HYST = 6;  // hysteresis so ongoing events don't flicker at the threshold

export function eventDef(id) { return EVENT_BY_ID.get(id) || null; }
/** Active events enriched with their definitions (for the wheel + detail modal). */
export function getActiveEvents(gs) {
  return (gs.activeEvents || []).map(a => ({ ...a, def: EVENT_BY_ID.get(a.id) })).filter(a => a.def);
}

function condMet(gs, cond) {
  const m = indicatorMap(gs).get(cond.id);
  if (!m) return false;
  return cond.dir === "low" ? m.value <= cond.value : m.value >= cond.value;
}
function condCleared(gs, cond) {
  const m = indicatorMap(gs).get(cond.id);
  if (!m) return true;
  return cond.dir === "low" ? m.value > cond.value + HYST : m.value < cond.value - HYST;
}
function hasActive(gs, id) { return gs.activeEvents.some(a => a.id === id); }
function weightedPick(list) {
  const total = list.reduce((s, e) => s + (e.weight || 1), 0);
  let r = Math.random() * total;
  for (const e of list) { r -= (e.weight || 1); if (r <= 0) return e; }
  return list[list.length - 1];
}
function fireShock(gs, e) {
  const byId = indicatorMap(gs);
  for (const ind of e.indicators || []) { const m = byId.get(ind.id); if (m) m.value = clamp(m.value + ind.delta); }
  if (e.mood) gs.mood += e.mood;
  if (e.credits) gs.capital = Math.max(0, gs.capital + e.credits);
  gs.activeEvents.push({ id: e.id, until: gs.currentRound + 1 });  // visible for one round
}

/** Turn ongoing situations on/off by threshold, fire shocks, drip mood, expire shocks. */
function processEvents(gs) {
  const fired = [];
  // 1) Ongoing situations: activate when a threshold is crossed, clear when it recovers.
  for (const e of EVENTS) {
    if (e.kind !== "ongoing") continue;
    const active = hasActive(gs, e.id);
    if (!active && condMet(gs, e.cond)) {
      gs.activeEvents.push({ id: e.id });
      if (e.credits) gs.capital = Math.max(0, gs.capital + e.credits);
      fired.push({ id: e.id, title: e.title, seed: e.onset || e.seed });
    } else if (active && condCleared(gs, e.cond)) {
      gs.activeEvents = gs.activeEvents.filter(a => a.id !== e.id);
      if (e.clear) fired.push({ id: e.id, title: `${e.title} eases`, seed: e.clear });
    }
  }
  // 2) Conditional shock
  const condShocks = EVENTS.filter(e => e.kind === "shock" && e.cond && condMet(gs, e.cond) && e.id !== gs.lastEventId && !hasActive(gs, e.id));
  if (condShocks.length) { const e = weightedPick(condShocks); fireShock(gs, e); fired.push({ id: e.id, title: e.title, seed: e.seed }); gs.lastEventId = e.id; }
  // 3) Random shock
  if (Math.random() < SIM.EVENT_RANDOM_CHANCE) {
    const rnd = EVENTS.filter(e => e.kind === "shock" && !e.cond && !e.unrest && e.id !== gs.lastEventId && !hasActive(gs, e.id));
    if (rnd.length) { const e = weightedPick(rnd); fireShock(gs, e); fired.push({ id: e.id, title: e.title, seed: e.seed }); gs.lastEventId = e.id; }
  }
  // 3b) Discontent: prolonged unhappiness breeds unrest (protests, riots, terror, kidnappings)
  const appr = overallApproval(gs);
  gs.discontent = appr < 42 ? (gs.discontent || 0) + 1 : Math.max(0, (gs.discontent || 0) - 1);
  if (gs.discontent >= 3 && Math.random() < Math.min(0.6, 0.1 * gs.discontent)) {
    const pool = EVENTS.filter(e => e.unrest && e.id !== gs.lastEventId && !hasActive(gs, e.id));
    if (pool.length) {
      const e = weightedPick(pool);
      fireShock(gs, e);
      if (e.kidnap) {
        const seated = PORTFOLIOS.filter(p => gs.cabinet[p.id]);
        if (seated.length) { const port = seated[Math.floor(Math.random() * seated.length)]; gs.loyalty[port.id] = (gs.loyalty[port.id] ?? SIM.LOYALTY_BASE) - 30; }
      }
      gs.discontent = Math.max(0, gs.discontent - 2);
      gs.lastEventId = e.id;
      fired.push({ id: e.id, title: e.title, seed: e.seed });
    }
  }
  // 4) Ongoing mood drip
  for (const a of gs.activeEvents) { const e = EVENT_BY_ID.get(a.id); if (e && e.kind === "ongoing" && e.moodDrip) gs.mood += e.moodDrip; }
  // 5) Expire spent shock markers
  gs.activeEvents = gs.activeEvents.filter(a => !(a.until != null && a.until <= gs.currentRound));
  return fired;
}

// ── Ministers: loyalty, resignations, scandals ─────────────────────────────────────
function updateCabinet(gs, approval) {
  const byId = indicatorMap(gs);
  const corruption = byId.get("corruption")?.value ?? 100;
  const events = [];

  for (const port of PORTFOLIOS) {
    const mid = gs.cabinet[port.id];
    if (!mid) continue;
    const min = MINISTER_BY_ID.get(mid);
    if (!min) continue;
    // Loyalty eases toward a pressure set by approval, government alignment, and corruption.
    const align = dist2D(min, gs.gov);
    const pressure = 45 + (approval - 50) * 0.7 - align * 0.06 - Math.max(0, corruption - 100) * 0.3;
    gs.loyalty[port.id] += (pressure - gs.loyalty[port.id]) * SIM.LOYALTY_DRIFT;
    if (gs.loyalty[port.id] < SIM.LOYALTY_RESIGN) {
      gs.cabinet[port.id] = null;
      delete gs.loyalty[port.id];
      gs.mood -= 2;
      events.push({ id: "resign", title: "Minister Resigns",
        seed: `${min.name}, the ${port.name} minister, has resigned amid mounting pressure, leaving the post vacant.` });
    }
  }
  // Scandal when corruption is high
  const seated = PORTFOLIOS.filter(p => gs.cabinet[p.id]);
  if (corruption > 120 && seated.length && Math.random() < SIM.SCANDAL_CHANCE) {
    const port = seated[Math.floor(Math.random() * seated.length)];
    const min = MINISTER_BY_ID.get(gs.cabinet[port.id]);
    gs.loyalty[port.id] = (gs.loyalty[port.id] ?? SIM.LOYALTY_BASE) - 25;
    gs.mood -= 3;
    events.push({ id: "scandal", title: "Minister Scandal",
      seed: `${min.name} (${port.name}) is engulfed in a corruption scandal, embarrassing the government.` });
  }
  return events;
}

// ── Goals ─────────────────────────────────────────────────────────────────────────
export function getGoal(gs) { return GOALS.find(g => g.id === gs.goalId) || null; }
export function evalGoal(gs) {
  const goal = getGoal(gs);
  if (!goal) return { progress: 0, met: false, goal: null, parts: [] };
  const byId = indicatorMap(gs);
  let sum = 0, n = 0, allMet = true;
  const parts = [];
  for (const [id, dir, target] of goal.targets) {
    const m = byId.get(id);
    if (!m) continue;
    n++;
    let frac, met;
    if (dir === "high") { frac = (m.value - 100) / (target - 100); met = m.value >= target; }
    else { frac = (100 - m.value) / (100 - target); met = m.value <= target; }
    if (!met) allMet = false;
    sum += clamp01(frac);
    parts.push({ id, name: m.name, dir, target, value: Math.round(m.value), met, frac: clamp01(frac) });
  }
  const approval = overallApproval(gs);
  if (approval < goal.requireApproval) allMet = false;
  const progress = clamp01((n ? sum / n : 0) * 0.8 + clamp01(approval / goal.requireApproval) * 0.2);
  return { progress, met: allMet, goal, parts, approval, requireApproval: goal.requireApproval };
}

// ── Forward projection (indicator curve modal) ──────────────────────────────────
export function projectIndicator(gs, id, rounds = 12) {
  const m = indicatorMap(gs).get(id);
  if (!m) return { history: [], future: [], target: 100, current: 100 };
  const target = computeIndicatorTargets(gs)[id];
  const k = INDICATOR_INERTIA[id] ?? DEFAULT_INERTIA;
  let v = m.value; const future = [];
  for (let i = 1; i <= rounds; i++) { v = clamp(v + (target - v) * k); future.push(v); }
  return { history: m.history.slice(-HISTORY_CAP), future, target, current: m.value };
}

// ── Budget / deficit ──────────────────────────────────────────────────────────────
/** Itemised per-round budget: baseline tax revenue + each policy's money flow. */
export function budgetReport(gs) {
  const gdp = indicatorMap(gs).get("gdpGrowth")?.value ?? 100;
  const baseRevenue = Math.round(SIM.BASE_REVENUE + (gdp - 100) * SIM.GDP_TAX_FACTOR);
  const items = [];
  for (const pid of gs.enactedPolicyIds) {
    const p = POLICY_BY_ID.get(pid); if (!p) continue;
    const amount = policyFiscal(p, levelOf(gs, pid));
    if (amount) items.push({ id: pid, name: p.name, category: p.category, amount });
  }
  const policyNet = items.reduce((s, i) => s + i.amount, 0);
  const net = baseRevenue + policyNet;
  return { baseRevenue, items, policyNet, net, treasury: gs.treasury };
}
function applyBudget(gs) {
  const { net } = budgetReport(gs);
  gs.treasury = Math.round(gs.treasury + net);
  gs.treasuryHistory.push(gs.treasury);
  if (gs.treasuryHistory.length > HISTORY_CAP) gs.treasuryHistory.shift();
  return net;
}

// ── State init ──────────────────────────────────────────────────────────────────
function buildInitialState(seed = Pop.randomSeed()) {
  const goal = GOALS[Math.floor(Math.random() * GOALS.length)];
  const start = goal.start || {};
  const cabinet = {};
  for (const p of PORTFOLIOS) cabinet[p.id] = null;

  const metrics = METRICS.map(m => {
    const v = (start.indicators && start.indicators[m.id] != null) ? start.indicators[m.id] : m.value;
    return { ...m, value: v, target: v, history: [v] };
  });
  // start.policies entries may be "id" (level 1) or ["id", level]
  const enactedPolicyIds = [];
  const enactedLevels = {};
  for (const entry of (start.policies || [])) {
    const [id, lvl] = Array.isArray(entry) ? entry : [entry, 1];
    enactedPolicyIds.push(id); enactedLevels[id] = lvl;
  }

  const gs = {
    capital: start.capital ?? 100,
    treasury: SIM.TREASURY_START, treasuryHistory: [SIM.TREASURY_START],
    currentRound: 1, term: 1, seed, metrics, enactedPolicyIds, enactedLevels,
    pendingEnacted: [], pendingSpeeches: [],
    gov: { econ: 0, soc: 0 }, mood: 0, cabinet, loyalty: {}, hasSpoken: false, discontent: 0,
    activeEvents: (start.events || []).map(id => ({ id })),  // inherited ongoing situations
    goalId: goal.id, goalAchieved: false, gameOver: false, lastEventId: null, lastReport: null,
  };
  // Position the government's compass to match the policies it inherits.
  gs.gov = Pop.governmentCompass(enactedPolicyIds.map(id => POLICY_BY_ID.get(id)).filter(Boolean));
  return gs;
}

export let gameState = buildInitialState();
recomputeElectorate(gameState);

// ── Round report ─────────────────────────────────────────────────────────────────
function buildReport(gs, before, events, goalNewlyAchieved) {
  const movers = gs.metrics
    .map(m => ({ id: m.id, name: m.name, lowerIsBetter: m.lowerIsBetter, delta: m.value - before.metrics[m.id] }))
    .filter(x => Math.abs(x.delta) >= 0.8)
    .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
    .slice(0, 5);
  return {
    round: gs.currentRound, term: gs.term,
    events,
    enacted: gs.pendingEnacted.map(id => POLICY_BY_ID.get(id)).filter(Boolean).map(p => p.name),
    speeches: gs.pendingSpeeches.slice(),
    approvalBefore: before.approval, approvalAfter: overallApproval(gs),
    movers, capital: gs.capital,
    goal: getGoal(gs)?.title, goalProgress: Math.round(evalGoal(gs).progress * 100), goalNewlyAchieved,
  };
}

// ── Capital actions ────────────────────────────────────────────────────────────────
export function speechAlignment(gs, theme) {
  ensurePopulation(gs);
  const d = dist2D(theme.dir, population.centroid);
  return clamp01(1 - d / 140);            // 1 = bang in the mainstream
}
export function giveSpeech(gs, themeId) {
  if (gs.hasSpoken) return { ok: false, reason: "already" };
  const theme = SPEECH_THEMES.find(t => t.id === themeId);
  if (!theme) return { ok: false, reason: "unknown" };
  const approval = overallApproval(gs);
  const align = speechAlignment(gs, theme);
  const gain = Math.round(SIM.SPEECH_BASE_GAIN + approval * SIM.SPEECH_APPROVAL_FACTOR + align * SIM.SPEECH_ALIGN_BONUS);
  gs.capital += gain;
  gs.mood += SIM.SPEECH_MOOD * (0.4 + align);
  // A speech nudges the government's perceived stance slightly toward the theme.
  gs.gov.econ += (theme.dir.econ - gs.gov.econ) * 0.06;
  gs.gov.soc  += (theme.dir.soc  - gs.gov.soc)  * 0.06;
  gs.hasSpoken = true;
  gs.pendingSpeeches.push(theme.title);
  recomputeElectorate(gs);
  persist(gs);
  return { ok: true, gain, align, theme };
}

export function appointMinister(gs, portfolioId, ministerId) {
  const min = MINISTER_BY_ID.get(ministerId);
  if (!min || min.portfolio !== portfolioId) return { ok: false, reason: "invalid" };
  if (gs.capital < SIM.APPOINT_COST) return { ok: false, reason: "capital" };
  gs.capital -= SIM.APPOINT_COST;
  gs.cabinet[portfolioId] = ministerId;
  gs.loyalty[portfolioId] = SIM.LOYALTY_BASE;
  recomputeElectorate(gs);
  persist(gs);
  return { ok: true };
}
export function dismissMinister(gs, portfolioId) {
  gs.cabinet[portfolioId] = null;
  delete gs.loyalty[portfolioId];
  recomputeElectorate(gs);
  persist(gs);
}

// ── State mutations ───────────────────────────────────────────────────────────────
function afterPolicyChange(gs) {
  applyIndicatorStep(gs, { frac: 0.5 });
  applyGovStep(gs, 0.5);
  recomputeElectorate(gs);
  persist(gs);
}
export function enactPolicy(gs, policy, level = 1) {
  gs.capital -= enactCapitalCost(gs, policy, level);
  gs.enactedPolicyIds.push(policy.id);
  gs.enactedLevels[policy.id] = level;
  gs.pendingEnacted.push(policy.id);
  afterPolicyChange(gs);
}
/** Adjust an already-enacted policy's level (cheaper than enacting). */
export function setPolicyLevel(gs, policy, level) {
  if (!gs.enactedPolicyIds.includes(policy.id)) return enactPolicy(gs, policy, level);
  gs.capital -= SIM.LEVEL_CHANGE_COST;
  gs.enactedLevels[policy.id] = level;
  afterPolicyChange(gs);
}
export function repealPolicy(gs, policy, repealCost = 20) {
  gs.capital -= repealCost;
  gs.enactedPolicyIds = gs.enactedPolicyIds.filter(id => id !== policy.id);
  delete gs.enactedLevels[policy.id];
  afterPolicyChange(gs);
}

export function endRound(gs) {
  const before = {
    approval: overallApproval(gs),
    metrics: Object.fromEntries(gs.metrics.map(m => [m.id, m.value])),
  };

  gs.currentRound += 1;
  gs.hasSpoken = false;

  // Income: base + beloved bonus + minister upkeep
  let income = SIM.CAPITAL_BASE_INCOME + Math.max(0, before.approval - 50) * SIM.CAPITAL_BELOVED_FACTOR;
  for (const port of PORTFOLIOS) {
    const min = gs.cabinet[port.id] ? MINISTER_BY_ID.get(gs.cabinet[port.id]) : null;
    if (min) income += min.capitalPerRound;
  }
  gs.capital += Math.round(income);

  const nationalEvents = processEvents(gs);
  const cabinetEvents = updateCabinet(gs, before.approval);

  applyIndicatorStep(gs, { frac: 1, drift: true });
  applyGovStep(gs, 1);
  gs.mood *= SIM.MOOD_DECAY;

  const budgetNet = applyBudget(gs);   // treasury += revenue − spending

  for (const m of gs.metrics) { m.history.push(m.value); if (m.history.length > HISTORY_CAP) m.history.shift(); }
  recomputeElectorate(gs);

  const { met } = evalGoal(gs);
  const goalNewlyAchieved = met && !gs.goalAchieved ? (gs.goalAchieved = true, true) : false;

  const report = buildReport(gs, before, [...nationalEvents, ...cabinetEvents], goalNewlyAchieved);
  report.treasury = gs.treasury;
  report.budgetNet = budgetNet;

  let election = null;
  if (gs.currentRound % SIM.TERM_LENGTH === 0 && !gs.gameOver) {
    const approval = overallApproval(gs);
    const reElected = approval >= SIM.ELECTION_THRESHOLD;
    election = { term: gs.term, approval, reElected, goalAchieved: gs.goalAchieved, threshold: SIM.ELECTION_THRESHOLD };
    if (reElected) gs.term += 1; else gs.gameOver = true;
  }
  report.election = election;

  gs.pendingEnacted = [];
  gs.pendingSpeeches = [];
  gs.lastReport = report;
  persist(gs);
  return report;
}

// ── Persistence ────────────────────────────────────────────────────────────────────
function toRecord(gs) {
  return {
    version: 3, seed: gs.seed, capital: gs.capital, treasury: gs.treasury, treasuryHistory: gs.treasuryHistory,
    currentRound: gs.currentRound, term: gs.term,
    metrics: gs.metrics.map(m => ({ id: m.id, value: m.value, target: m.target, history: m.history })),
    enactedPolicyIds: gs.enactedPolicyIds, enactedLevels: gs.enactedLevels, gov: gs.gov, mood: gs.mood,
    cabinet: gs.cabinet, loyalty: gs.loyalty, hasSpoken: gs.hasSpoken, discontent: gs.discontent,
    activeEvents: gs.activeEvents,
    goalId: gs.goalId, goalAchieved: gs.goalAchieved, gameOver: gs.gameOver, lastEventId: gs.lastEventId,
  };
}
function fromRecord(rec) {
  const gs = buildInitialState(rec.seed);
  gs.capital = rec.capital; gs.currentRound = rec.currentRound; gs.term = rec.term;
  const savedById = new Map((rec.metrics || []).map(m => [m.id, m]));
  gs.metrics = METRICS.map(m => {
    const s = savedById.get(m.id);
    return s ? { ...m, value: s.value, target: s.target ?? s.value, history: s.history || [s.value] }
             : { ...m, target: m.value, history: [m.value] };
  });
  gs.enactedPolicyIds = rec.enactedPolicyIds || [];
  gs.enactedLevels = rec.enactedLevels || {};
  for (const id of gs.enactedPolicyIds) if (!gs.enactedLevels[id]) gs.enactedLevels[id] = 1;
  gs.treasury = rec.treasury != null ? rec.treasury : SIM.TREASURY_START;
  gs.treasuryHistory = rec.treasuryHistory || [gs.treasury];
  gs.gov = rec.gov || { econ: 0, soc: 0 };
  gs.mood = rec.mood || 0;
  for (const p of PORTFOLIOS) gs.cabinet[p.id] = (rec.cabinet && rec.cabinet[p.id]) || null;
  gs.loyalty = rec.loyalty || {};
  gs.activeEvents = rec.activeEvents || [];
  gs.discontent = rec.discontent || 0;
  gs.hasSpoken = !!rec.hasSpoken;
  gs.goalId = rec.goalId || gs.goalId;
  gs.goalAchieved = !!rec.goalAchieved;
  gs.gameOver = !!rec.gameOver;
  gs.lastEventId = rec.lastEventId || null;
  return gs;
}
function persist(gs) { Store.autosave(toRecord(gs)); }

/** Load an autosave if present; otherwise leave a fresh game. Returns true if loaded. */
export async function initFromSaveOrNew() {
  try {
    const rec = await Store.loadState();
    if (rec && rec.seed != null) {
      gameState = fromRecord(rec);
      population = null;
      recomputeElectorate(gameState);
      return true;
    }
  } catch { /* ignore */ }
  recomputeElectorate(gameState);
  return false;
}

export function updateGameState(newGs) {
  gameState = JSON.parse(JSON.stringify(newGs));
  population = null;
  recomputeElectorate(gameState);
  RenderFunctions.renderGameState(gameState);
}
export function resetGameState() {
  gameState = buildInitialState();
  population = null;
  recomputeElectorate(gameState);
  Store.saveState(toRecord(gameState)).catch(() => {});
  RenderFunctions.renderGameState(gameState);
}
export async function restartGame() {
  await Store.clearState();
  resetGameState();
}

// Named (manual) saves, backed by the same store.
export async function saveGame(name) { await Store.saveState(toRecord(gameState), `slot:${name}`); }
export async function loadGame(name) {
  const rec = await Store.loadState(`slot:${name}`);
  if (rec) { gameState = fromRecord(rec); population = null; recomputeElectorate(gameState); persist(gameState); RenderFunctions.renderGameState(gameState); }
}
export async function listSaves() {
  const slots = await Store.listSlots();
  return slots.filter(s => s.startsWith("slot:")).map(s => s.slice(5));
}

// ── Lookups ────────────────────────────────────────────────────────────────────────
export function getPolicyById(id) { return POLICY_BY_ID.get(id) || null; }
export function getEnactedPolicies(gs) { return gs.enactedPolicyIds.map(id => POLICY_BY_ID.get(id)).filter(Boolean); }
export function isEnacted(gs, policyId) { return gs.enactedPolicyIds.includes(policyId); }

// ── API key (LLM narrator) ───────────────────────────────────────────────────────
export function getApiKey() { return localStorage.getItem('openai_api_key') || ''; }
export function saveApiKey(key) { localStorage.setItem('openai_api_key', key || ''); }
