// policyFunctions.js — Deterministic policy actions (no external API)
import * as GameState from './gameState.js';
import * as RenderFunctions from './renderFunctions.js';

/**
 * Enact a policy: deduct credits, apply effects, and re-render.
 * Returns true on success, false if insufficient credits.
 */
export function enactPolicy(policy) {
  const gs = GameState.gameState;
  if (gs.capital < GameState.effectiveCost(gs, policy)) {
    return false;
  }
  GameState.enactPolicy(gs, policy);
  RenderFunctions.renderGameState(gs);
  return true;
}

/**
 * Repeal an enacted policy: deduct repeal fee, reverse effects, and re-render.
 * Returns true on success, false if insufficient credits.
 */
export function repealPolicy(policy, repealCost = 20) {
  const gs = GameState.gameState;
  if (gs.capital < repealCost) {
    return false;
  }
  GameState.repealPolicy(gs, policy, repealCost);
  RenderFunctions.renderGameState(gs);
  return true;
}
