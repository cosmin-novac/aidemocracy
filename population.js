// population.js — Agent-based electorate.
//
// Instead of homogeneous groups, the public is 10,000 individuals, each with a
// personal political-compass position (econ, soc) and a *mix* of traits (someone
// can be an educator + farmer + progressive at once). A "group" is just everyone
// who holds a given trait; its approval is the mean approval of those members.
//
// Individuals are STATIC — fully determined by a seed — so they never need to be
// persisted; we regenerate them on load. Approval is a pure function of the
// current game state, so the only thing that evolves over time is the indicators
// (which are eased elsewhere) plus the government's compass position and mood.

import { COMPASS_ANCHORS, TRAIT_PREVALENCE, SIM } from './gameData.js';

const clamp = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v);

// Small, fast, seedable PRNG.
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function randomSeed() {
  return (Math.random() * 2 ** 32) >>> 0;
}

const TRAIT_IDS = Object.keys(TRAIT_PREVALENCE);
const SIGMA = 70;  // compass "reach" of a trait's ideological pull

/** Build the (static) electorate from a seed. */
export function generatePopulation(seed) {
  const rng = mulberry32(seed);
  // Approx-normal in [-1,1] from three uniforms.
  const gauss = () => (rng() + rng() + rng() - 1.5) / 1.5;

  const size = SIM.POP_SIZE;
  const individuals = new Array(size);
  const traitMembers = {};
  const traitSum = {};       // for centroids
  for (const t of TRAIT_IDS) { traitMembers[t] = []; traitSum[t] = { e: 0, s: 0 }; }
  let cE = 0, cS = 0;

  for (let i = 0; i < size; i++) {
    // Latent leaning (broad-ish), used to decide which traits this person holds.
    const le = clamp(gauss() * 50, -100, 100);
    const ls = clamp(gauss() * 50, -100, 100);
    const traits = [];
    let we = 0, ws = 0, wsum = 0;
    for (const t of TRAIT_IDS) {
      const { base, bias } = TRAIT_PREVALENCE[t];
      const a = COMPASS_ANCHORS[t];
      const dx = le - a.econ, dy = ls - a.soc;
      const closeness = Math.exp(-(dx * dx + dy * dy) / (2 * SIGMA * SIGMA)); // 0..1
      // Lower floor than before so ideological traits really concentrate near their bloc.
      const prob = clamp(base * ((1 - bias) * 0.55 + bias * closeness * 2), 0, 0.97);
      if (rng() < prob) { traits.push(t); we += a.econ * bias; ws += a.soc * bias; wsum += bias; }
    }
    // Final compass position is pulled toward the blocs this person belongs to,
    // weighted by how ideological those traits are — so e.g. the LGBTQ+ cluster
    // actually sits left-libertarian rather than smeared across the centre.
    let econ = le, soc = ls;
    if (wsum > 0) {
      const pull = Math.min(0.7, wsum * 0.45);
      econ = clamp(le * (1 - pull) + (we / wsum) * pull + (rng() - 0.5) * 14, -100, 100);
      soc  = clamp(ls * (1 - pull) + (ws / wsum) * pull + (rng() - 0.5) * 14, -100, 100);
    }
    individuals[i] = { econ, soc, traits };
    for (const t of traits) { traitMembers[t].push(i); traitSum[t].e += econ; traitSum[t].s += soc; }
    cE += econ; cS += soc;
  }

  const traitCount = {}, traitCentroid = {};
  for (const t of TRAIT_IDS) {
    const n = traitMembers[t].length;
    traitCount[t] = n;
    traitCentroid[t] = n ? { econ: traitSum[t].e / n, soc: traitSum[t].s / n } : { econ: 0, soc: 0 };
  }

  return {
    seed, size, individuals, traitMembers, traitCount, traitCentroid,
    centroid: { econ: cE / size, soc: cS / size },
    density: buildDensity(individuals),
  };
}

/** The government's compass position = mean lean of its enacted policies. */
export function policyCompass(policy) {
  let e = 0, s = 0, w = 0;
  for (const eff of policy.voterEffects) {
    const a = COMPASS_ANCHORS[eff.id];
    if (!a) continue;
    e += a.econ * eff.change; s += a.soc * eff.change; w += Math.abs(eff.change);
  }
  return w === 0 ? { econ: 0, soc: 0 } : { econ: e / w, soc: s / w };
}

export function governmentCompass(enactedPolicies) {
  if (!enactedPolicies.length) return { econ: 0, soc: 0 };
  let e = 0, s = 0;
  for (const p of enactedPolicies) { const c = policyCompass(p); e += c.econ; s += c.soc; }
  return { econ: e / enactedPolicies.length, soc: s / enactedPolicies.length };
}

/**
 * Pure projection of approval from current state.
 * @param traitScore  map traitId → additive approval contribution (indicator
 *                    satisfaction + policy sentiment + minister bias)
 * @param gov         government compass position {econ,soc}
 * @param mood        transient national mood (+/-)
 * Returns { overall, groupApproval{trait→avg}, counts{trait→n} }.
 */
export function computeApproval(pop, { traitScore, gov, mood = 0 }) {
  const K = SIM.K_IDEO;
  const sums = {}, counts = {};
  let total = 0;
  for (let i = 0; i < pop.size; i++) {
    const ind = pop.individuals[i];
    const dx = ind.econ - gov.econ, dy = ind.soc - gov.soc;
    const ideo = -K * Math.sqrt(dx * dx + dy * dy);
    let blend = 0;
    const tn = ind.traits.length;
    if (tn) { for (const t of ind.traits) blend += (traitScore[t] || 0); blend /= tn; }
    let a = 50 + ideo + blend + mood;
    a = a < 0 ? 0 : a > 100 ? 100 : a;
    total += a;
    for (const t of ind.traits) { sums[t] = (sums[t] || 0) + a; counts[t] = (counts[t] || 0) + 1; }
  }
  const groupApproval = {};
  for (const t in counts) groupApproval[t] = sums[t] / counts[t];
  return { overall: total / pop.size, groupApproval, counts };
}

/** A small random scatter of a group's members for the compass plot. */
export function sampleTrait(pop, traitId, n = 400) {
  const members = pop.traitMembers[traitId] || [];
  if (members.length <= n) return members.map(i => pop.individuals[i]);
  const out = [];
  const step = members.length / n;
  for (let k = 0; k < n; k++) out.push(pop.individuals[members[Math.floor(k * step)]]);
  return out;
}

/** Bin compass positions into a grid for heatmap rendering. */
export function buildDensity(individuals, bins = 22) {
  const grid = Array.from({ length: bins }, () => new Array(bins).fill(0));
  let max = 0;
  for (const ind of individuals) {
    const bx = clamp(Math.floor(((ind.econ + 100) / 200) * bins), 0, bins - 1);
    const by = clamp(Math.floor(((ind.soc + 100) / 200) * bins), 0, bins - 1);
    grid[bx][by]++;
    if (grid[bx][by] > max) max = grid[bx][by];
  }
  return { bins, grid, max };
}

/** Centroid of an arbitrary list of individuals (for a group's compass marker). */
export function centroidOf(list) {
  if (!list.length) return { econ: 0, soc: 0 };
  let e = 0, s = 0;
  for (const p of list) { e += p.econ; s += p.soc; }
  return { econ: e / list.length, soc: s / list.length };
}
