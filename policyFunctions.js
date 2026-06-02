// policyFunctions.js — Deterministic policy actions (no external API)
import * as GameState from './gameState.js';
import * as RenderFunctions from './renderFunctions.js';

/**
 * Enact a policy at a given stage/level. Deducts political capital, applies
 * effects, and re-renders. Returns true on success, false if too poor.
 */
export function enactPolicy(policy, level = 1) {
  const gs = GameState.gameState;
  if (gs.capital < GameState.enactCapitalCost(gs, policy, level)) return false;
  GameState.enactPolicy(gs, policy, level);
  RenderFunctions.renderGameState(gs);
  return true;
}

/** Adjust an enacted policy's level (cheaper than enacting). */
export function setPolicyLevel(policy, level) {
  const gs = GameState.gameState;
  const enacted = gs.enactedPolicyIds.includes(policy.id);
  const cost = enacted ? GameState.LEVEL_CHANGE_COST : GameState.enactCapitalCost(gs, policy, level);
  if (gs.capital < cost) return false;
  GameState.setPolicyLevel(gs, policy, level);
  RenderFunctions.renderGameState(gs);
  return true;
}

/**
 * Repeal an enacted policy: deduct repeal fee, reverse effects, and re-render.
 * Returns true on success, false if insufficient capital.
 */
export function repealPolicy(policy, repealCost = 20) {
  const gs = GameState.gameState;
  if (gs.capital < repealCost) return false;
  GameState.repealPolicy(gs, policy, repealCost);
  RenderFunctions.renderGameState(gs);
  return true;
}
