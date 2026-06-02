// gameState.js — Curve-based political simulation.
//
// Indicators don't snap to policy effects; policies/events set a TARGET and the
// live value eases toward it each round (gradual curves). Voter approval is
// grounded in the indicators each group cares about plus the policies they like
// or loathe. Events shock the system. Terms end in elections.

import { METRICS, VOTER_GROUPS, POLICIES } from './policies.js';
import {
  INDICATOR_INERTIA, DEFAULT_INERTIA, INDICATOR_LINKS,
  EXTRA_VOTERS, VOTER_PROFILES, EVENTS, GOALS, SIM,
} from './gameData.js';
import * as RenderFunctions from './renderFunctions.js';

const POLICY_BY_ID = new Map(POLICIES.map(p => [p.id, p]));
const HISTORY_CAP = 48;

// ── Helpers ───────────────────────────────────────────────────────────────────
export function clamp(value, min = 0, max = 200) {
  return Math.max(min, Math.min(max, value));
}
const clamp01 = v => Math.max(0, Math.min(1, v));

function indicatorMap(gs) {
  return new Map(gs.metrics.map(m => [m.id, m]));
}

/** Overall public-approval score (0-100). */
export function overallApproval(gs) {
  if (!gs.voters.length) return 0;
  const sum = gs.voters.reduce((acc, v) => acc + v.approval, 0);
  return Math.round(sum / gs.voters.length);
}

// ── State initialization ──────────────────────────────────────────────────────
function buildInitialState() {
  const goal = GOALS[Math.floor(Math.random() * GOALS.length)];
  return {
    credits: 100,
    currentRound: 1,
    term: 1,
    metrics: METRICS.map(m => ({ ...m, target: m.value, history: [m.value] })),
    voters: [...VOTER_GROUPS, ...EXTRA_VOTERS.map(v => ({ ...v, approval: 50 }))]
      .map(v => ({ ...v, approval: v.approval ?? 50, target: v.approval ?? 50 })),
    enactedPolicyIds: [],
    pendingEnacted: [],     // policies enacted since the last round (for the narrator)
    goalId: goal.id,
    goalAchieved: false,
    gameOver: false,
    lastEventId: null,
    lastReport: null,
  };
}

export let gameState = buildInitialState();

// ── Target computation ──────────────────────────────────────────────────────────
function computeIndicatorTargets(gs) {
  const byId = indicatorMap(gs);
  const targets = {};
  for (const m of gs.metrics) targets[m.id] = 100;          // neutral baseline

  // Pressure from every enacted policy
  for (const pid of gs.enactedPolicyIds) {
    const policy = POLICY_BY_ID.get(pid);
    if (!policy) continue;
    for (const eff of policy.metricEffects) {
      if (targets[eff.id] !== undefined) targets[eff.id] += eff.change;
    }
  }

  // Coupling: each indicator's current level nudges the targets of others
  for (const link of INDICATOR_LINKS) {
    const src = byId.get(link.from);
    if (!src || targets[link.to] === undefined) continue;
    targets[link.to] += link.weight * (src.value - 100);
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

function computeVoterTargets(gs) {
  const byId = indicatorMap(gs);
  const targets = {};
  for (const v of gs.voters) {
    let t = 50;
    const profile = VOTER_PROFILES[v.id] || [];
    for (const [indId, weight] of profile) {
      const m = byId.get(indId);
      if (!m) continue;
      const good = m.lowerIsBetter ? (100 - m.value) : (m.value - 100); // +ve = better than baseline
      t += weight * good * SIM.VOTER_INDICATOR_SCALE;
    }
    targets[v.id] = t;
  }
  // Direct ideological reaction to the policies they like / dislike
  for (const pid of gs.enactedPolicyIds) {
    const policy = POLICY_BY_ID.get(pid);
    if (!policy) continue;
    for (const eff of policy.voterEffects) {
      if (targets[eff.id] !== undefined) targets[eff.id] += eff.change * SIM.POLICY_SENTIMENT_SCALE;
    }
  }
  for (const id in targets) targets[id] = clamp(targets[id], 0, 100);
  return targets;
}

function applyVoterStep(gs, frac = 1) {
  const targets = computeVoterTargets(gs);
  for (const v of gs.voters) {
    v.target = targets[v.id];
    v.approval = clamp(v.approval + (v.target - v.approval) * SIM.VOTER_INERTIA * frac, 0, 100);
  }
}

// ── Events ───────────────────────────────────────────────────────────────────────
function condMet(gs, cond) {
  const m = indicatorMap(gs).get(cond.id);
  if (!m) return false;
  return cond.dir === "low" ? m.value <= cond.value : m.value >= cond.value;
}

function weightedPick(list) {
  const total = list.reduce((s, e) => s + (e.weight || 1), 0);
  let r = Math.random() * total;
  for (const e of list) { r -= (e.weight || 1); if (r <= 0) return e; }
  return list[list.length - 1];
}

function fireEvent(gs, e) {
  const byId = indicatorMap(gs);
  for (const ind of e.indicators || []) {
    const m = byId.get(ind.id);
    if (m) m.value = clamp(m.value + ind.delta);
  }
  if (e.approvalDelta) for (const v of gs.voters) v.approval = clamp(v.approval + e.approvalDelta, 0, 100);
  for (const vd of e.voters || []) {
    const v = gs.voters.find(x => x.id === vd.id);
    if (v) v.approval = clamp(v.approval + vd.delta, 0, 100);
  }
  if (e.credits) gs.credits = Math.max(0, gs.credits + e.credits);
}

function applyEvents(gs) {
  const fired = [];
  const eligible = EVENTS.filter(e => e.kind === "conditional" && condMet(gs, e.cond) && e.id !== gs.lastEventId);
  if (eligible.length) { const e = weightedPick(eligible); fireEvent(gs, e); fired.push(e); }

  if (Math.random() < SIM.EVENT_RANDOM_CHANCE) {
    const randoms = EVENTS.filter(e => e.kind === "random" && e.id !== gs.lastEventId && !fired.includes(e));
    if (randoms.length) { const e = weightedPick(randoms); fireEvent(gs, e); fired.push(e); }
  }
  if (fired.length) gs.lastEventId = fired[fired.length - 1].id;
  return fired;
}

// ── Goals ─────────────────────────────────────────────────────────────────────────
export function getGoal(gs) {
  return GOALS.find(g => g.id === gs.goalId) || null;
}

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
    parts.push({ id, name: m.name, dir, target, value: Math.round(m.value), met });
  }
  const approval = overallApproval(gs);
  if (approval < goal.requireApproval) allMet = false;
  const targetFrac = n ? sum / n : 0;
  const apprFrac = clamp01(approval / goal.requireApproval);
  const progress = clamp01(targetFrac * 0.8 + apprFrac * 0.2);
  return { progress, met: allMet, goal, parts, approval, requireApproval: goal.requireApproval };
}

// ── Forward projection (for the indicator curve modal) ──────────────────────────
export function projectIndicator(gs, id, rounds = 12) {
  const m = indicatorMap(gs).get(id);
  if (!m) return { history: [], future: [], target: 100 };
  const targets = computeIndicatorTargets(gs);
  const target = targets[id];
  const k = INDICATOR_INERTIA[id] ?? DEFAULT_INERTIA;
  let v = m.value;
  const future = [];
  for (let i = 1; i <= rounds; i++) { v = clamp(v + (target - v) * k); future.push(v); }
  return { history: m.history.slice(-HISTORY_CAP), future, target, current: m.value };
}

// ── Round report ─────────────────────────────────────────────────────────────────
function buildReport(gs, before, events, goalNewlyAchieved) {
  const movers = gs.metrics
    .map(m => ({ id: m.id, name: m.name, lowerIsBetter: m.lowerIsBetter, delta: m.value - before.metrics[m.id] }))
    .filter(x => Math.abs(x.delta) >= 0.8)
    .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
    .slice(0, 5);

  const enactedNames = gs.pendingEnacted
    .map(id => POLICY_BY_ID.get(id))
    .filter(Boolean)
    .map(p => p.name);

  return {
    round: gs.currentRound,
    term: gs.term,
    events: events.map(e => ({ id: e.id, title: e.title, seed: e.seed })),
    enacted: enactedNames,
    approvalBefore: before.approval,
    approvalAfter: overallApproval(gs),
    movers,
    credits: gs.credits,
    goal: getGoal(gs)?.title,
    goalProgress: Math.round(evalGoal(gs).progress * 100),
    goalNewlyAchieved,
  };
}

// ── State mutations ───────────────────────────────────────────────────────────────
export function enactPolicy(gs, policy) {
  gs.credits -= policy.cost;
  gs.enactedPolicyIds.push(policy.id);
  gs.pendingEnacted.push(policy.id);
  applyIndicatorStep(gs, { frac: 0.5 });   // a little immediate movement for feedback
  applyVoterStep(gs, 0.5);
}

export function repealPolicy(gs, policy, repealCost = 20) {
  gs.credits -= repealCost;
  gs.enactedPolicyIds = gs.enactedPolicyIds.filter(id => id !== policy.id);
  applyIndicatorStep(gs, { frac: 0.5 });
  applyVoterStep(gs, 0.5);
}

/** Advance one round: income, events, eased simulation step, goal & election checks. */
export function endRound(gs) {
  const before = {
    approval: overallApproval(gs),
    metrics: Object.fromEntries(gs.metrics.map(m => [m.id, m.value])),
  };

  gs.currentRound += 1;
  gs.credits += SIM.ROUND_INCOME;

  const events = applyEvents(gs);
  applyIndicatorStep(gs, { frac: 1, drift: true });
  applyVoterStep(gs, 1);

  for (const m of gs.metrics) {
    m.history.push(m.value);
    if (m.history.length > HISTORY_CAP) m.history.shift();
  }

  const goalNewlyAchieved = (() => {
    const { met } = evalGoal(gs);
    if (met && !gs.goalAchieved) { gs.goalAchieved = true; return true; }
    return false;
  })();

  const report = buildReport(gs, before, events, goalNewlyAchieved);

  // Election at the end of each term
  let election = null;
  if (gs.currentRound % SIM.TERM_LENGTH === 0 && !gs.gameOver) {
    const approval = overallApproval(gs);
    const reElected = approval >= SIM.ELECTION_THRESHOLD;
    election = { term: gs.term, approval, reElected, goalAchieved: gs.goalAchieved, threshold: SIM.ELECTION_THRESHOLD };
    if (reElected) gs.term += 1; else gs.gameOver = true;
  }
  report.election = election;

  gs.pendingEnacted = [];
  gs.lastReport = report;
  return report;
}

// ── Replace / reset / persistence ───────────────────────────────────────────────
export function updateGameState(newGs) {
  gameState = JSON.parse(JSON.stringify(newGs));
  RenderFunctions.renderGameState(gameState);
}

export function resetGameState() {
  gameState = buildInitialState();
  RenderFunctions.renderGameState(gameState);
}

export function saveGame(name) {
  const saves = JSON.parse(localStorage.getItem('aidSaves') || '{}');
  saves[name] = gameState;
  localStorage.setItem('aidSaves', JSON.stringify(saves));
}

export function loadGame(name) {
  const saves = JSON.parse(localStorage.getItem('aidSaves') || '{}');
  if (saves[name]) updateGameState(saves[name]);
}

export function deleteSave(name) {
  const saves = JSON.parse(localStorage.getItem('aidSaves') || '{}');
  delete saves[name];
  localStorage.setItem('aidSaves', JSON.stringify(saves));
}

export function listSaves() {
  return Object.keys(JSON.parse(localStorage.getItem('aidSaves') || '{}'));
}

// ── Policy lookup helpers ─────────────────────────────────────────────────────────
export function getPolicyById(id) { return POLICY_BY_ID.get(id) || null; }
export function getEnactedPolicies(gs) {
  return gs.enactedPolicyIds.map(id => POLICY_BY_ID.get(id)).filter(Boolean);
}
export function isEnacted(gs, policyId) { return gs.enactedPolicyIds.includes(policyId); }

// ── API key (for the LLM narrator) ─────────────────────────────────────────────────
export function getApiKey() { return localStorage.getItem('openai_api_key') || ''; }
export function saveApiKey(key) { localStorage.setItem('openai_api_key', key || ''); }
