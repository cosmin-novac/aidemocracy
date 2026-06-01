import { METRICS, VOTER_GROUPS, POLICIES } from './policies.js';
import * as RenderFunctions from './renderFunctions.js';

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Clamp a value to [min, max]. */
export function clamp(value, min = 0, max = 200) {
  return Math.max(min, Math.min(max, value));
}

/** Compute the overall public-approval score (0-100). */
export function overallApproval(gs) {
  const voters = gs.voters;
  if (!voters.length) return 0;
  const sum = voters.reduce((acc, v) => acc + v.approval, 0);
  return Math.round(sum / voters.length);
}

// ── State initialization ──────────────────────────────────────────────────────

function buildInitialState() {
  return {
    credits: 100,
    currentRound: 1,
    metrics: METRICS.map(m => ({ ...m })),         // deep copy
    voters: VOTER_GROUPS.map(v => ({ ...v })),      // deep copy
    enactedPolicyIds: [],                           // ids of enacted policies
  };
}

export var gameState = buildInitialState();

// ── State mutations ───────────────────────────────────────────────────────────

/** Apply a policy's effects to the game state and record it as enacted. */
export function enactPolicy(gs, policy) {
  gs.credits -= policy.cost;

  // Apply metric effects
  for (const eff of policy.metricEffects) {
    const metric = gs.metrics.find(m => m.id === eff.id);
    if (metric) metric.value = clamp(metric.value + eff.change);
  }

  // Apply voter effects
  for (const eff of policy.voterEffects) {
    const voter = gs.voters.find(v => v.id === eff.id);
    if (voter) voter.approval = clamp(voter.approval + eff.change, 0, 100);
  }

  gs.enactedPolicyIds.push(policy.id);
}

/** Repeal an enacted policy and reverse its effects (costs a small fee). */
export function repealPolicy(gs, policy, repealCost = 20) {
  gs.credits -= repealCost;

  // Reverse metric effects
  for (const eff of policy.metricEffects) {
    const metric = gs.metrics.find(m => m.id === eff.id);
    if (metric) metric.value = clamp(metric.value - eff.change);
  }

  // Reverse voter effects
  for (const eff of policy.voterEffects) {
    const voter = gs.voters.find(v => v.id === eff.id);
    if (voter) voter.approval = clamp(voter.approval - eff.change, 0, 100);
  }

  gs.enactedPolicyIds = gs.enactedPolicyIds.filter(id => id !== policy.id);
}

/** End the current round: replenish credits and apply small random drift. */
export function endRound(gs) {
  gs.currentRound += 1;
  gs.credits += 75;       // replenish each round

  // Small passive drift on every metric (±1–3, biased toward 100 baseline)
  for (const m of gs.metrics) {
    const drift = (Math.random() - 0.5) * 4;           // -2 … +2
    const pullToBase = (100 - m.value) * 0.03;          // gentle pull to 100
    m.value = clamp(m.value + drift + pullToBase);
  }

  // Small passive drift on voter approval
  for (const v of gs.voters) {
    const drift = (Math.random() - 0.5) * 4;
    const pullToBase = (50 - v.approval) * 0.05;
    v.approval = clamp(v.approval + drift + pullToBase, 0, 100);
  }
}

/** Replace the live game state and re-render. */
export function updateGameState(newGs) {
  gameState = JSON.parse(JSON.stringify(newGs));
  RenderFunctions.renderGameState(gameState);
}

/** Reset to a fresh game. */
export function resetGameState() {
  gameState = buildInitialState();
  RenderFunctions.renderGameState(gameState);
}

// ── Save / Load ───────────────────────────────────────────────────────────────

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

// ── Policy lookup helpers ─────────────────────────────────────────────────────

export function getPolicyById(id) {
  return POLICIES.find(p => p.id === id) || null;
}

export function getEnactedPolicies(gs) {
  return gs.enactedPolicyIds.map(id => getPolicyById(id)).filter(Boolean);
}

export function isEnacted(gs, policyId) {
  return gs.enactedPolicyIds.includes(policyId);
}