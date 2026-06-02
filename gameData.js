// gameData.js — The simulation's connection graph: how indicators influence each
// other, what each voter group cares about, the events that can strike, and the
// goals a government can be elected to pursue.
//
// All indicators live on a 0–200 scale where 100 is the neutral baseline.
// Effects from policies/events are *pressures* — they move an indicator's
// TARGET, and the live value eases toward that target over several rounds
// (see gameState.js). Nothing snaps instantly; everything rides a curve.

// ── Indicator dynamics ─────────────────────────────────────────────────────────
// inertia = fraction of the remaining gap an indicator closes each round.
// Low inertia = slow, ponderous things (biodiversity, education); high = nimble
// things that react fast (national debt, civil liberties, digital rollout).
export const INDICATOR_INERTIA = {
  gdpGrowth: 0.10, unemployment: 0.16, inequality: 0.09, nationalDebt: 0.22,
  carbonEmissions: 0.12, renewableEnergy: 0.10, airQuality: 0.15, biodiversity: 0.07,
  healthcareAccess: 0.16, publicHealth: 0.10, mentalHealth: 0.12,
  educationQuality: 0.07, literacy: 0.08, crimeRate: 0.14, civilLiberties: 0.22,
  corruption: 0.12, socialCohesion: 0.09, housingAfford: 0.10, infrastructure: 0.10,
  publicTransport: 0.12, digitalInclusion: 0.17, innovation: 0.10,
};
export const DEFAULT_INERTIA = 0.12;

// ── Indicator → indicator influence graph ───────────────────────────────────────
// Each link adds `weight * (sourceValue - 100)` to the TARGET of `to`.
// This is what makes the world feel like a coupled system: growth pulls
// unemployment down, pollution drags public health, education feeds innovation…
// Signs already account for each indicator's orientation in raw 0–200 terms.
export const INDICATOR_LINKS = [
  // Growth & jobs
  { from: "gdpGrowth",      to: "unemployment",   weight: -0.40 },
  { from: "gdpGrowth",      to: "nationalDebt",   weight: -0.20 },
  { from: "gdpGrowth",      to: "inequality",     weight:  0.15 },
  { from: "gdpGrowth",      to: "housingAfford",  weight: -0.10 },
  { from: "unemployment",   to: "gdpGrowth",      weight: -0.25 },
  { from: "unemployment",   to: "crimeRate",      weight:  0.25 },
  { from: "unemployment",   to: "socialCohesion", weight: -0.20 },
  { from: "unemployment",   to: "mentalHealth",   weight: -0.15 },
  { from: "nationalDebt",   to: "gdpGrowth",      weight: -0.15 },
  { from: "inequality",     to: "socialCohesion", weight: -0.30 },
  { from: "inequality",     to: "crimeRate",      weight:  0.20 },
  { from: "inequality",     to: "publicHealth",   weight: -0.15 },
  { from: "inequality",     to: "mentalHealth",   weight: -0.12 },
  // Environment & health
  { from: "carbonEmissions",to: "airQuality",     weight: -0.40 },
  { from: "carbonEmissions",to: "publicHealth",   weight: -0.20 },
  { from: "carbonEmissions",to: "biodiversity",   weight: -0.25 },
  { from: "renewableEnergy",to: "carbonEmissions",weight: -0.30 },
  { from: "renewableEnergy",to: "innovation",     weight:  0.15 },
  { from: "airQuality",     to: "publicHealth",   weight:  0.30 },
  { from: "biodiversity",   to: "publicHealth",   weight:  0.10 },
  { from: "healthcareAccess",to:"publicHealth",   weight:  0.30 },
  { from: "publicHealth",   to: "gdpGrowth",      weight:  0.15 },
  { from: "mentalHealth",   to: "publicHealth",   weight:  0.20 },
  { from: "mentalHealth",   to: "crimeRate",      weight: -0.10 },
  // Knowledge economy
  { from: "educationQuality",to:"innovation",     weight:  0.30 },
  { from: "educationQuality",to:"gdpGrowth",      weight:  0.20 },
  { from: "educationQuality",to:"literacy",       weight:  0.30 },
  { from: "literacy",       to: "educationQuality",weight: 0.15 },
  { from: "innovation",     to: "gdpGrowth",      weight:  0.30 },
  { from: "innovation",     to: "renewableEnergy",weight:  0.10 },
  { from: "digitalInclusion",to:"innovation",     weight:  0.15 },
  { from: "digitalInclusion",to:"gdpGrowth",      weight:  0.10 },
  // Society & order
  { from: "crimeRate",      to: "socialCohesion", weight: -0.25 },
  { from: "crimeRate",      to: "gdpGrowth",      weight: -0.10 },
  { from: "civilLiberties", to: "socialCohesion", weight:  0.15 },
  { from: "corruption",     to: "gdpGrowth",      weight: -0.20 },
  { from: "corruption",     to: "socialCohesion", weight: -0.20 },
  { from: "corruption",     to: "inequality",     weight:  0.15 },
  { from: "socialCohesion", to: "crimeRate",      weight: -0.20 },
  // Built environment
  { from: "housingAfford",  to: "socialCohesion", weight:  0.15 },
  { from: "housingAfford",  to: "inequality",     weight: -0.15 },
  { from: "infrastructure", to: "gdpGrowth",      weight:  0.20 },
  { from: "infrastructure", to: "publicTransport",weight:  0.15 },
  { from: "publicTransport",to: "carbonEmissions",weight: -0.10 },
  { from: "publicTransport",to: "airQuality",     weight:  0.10 },
];

// ── Voter groups ────────────────────────────────────────────────────────────────
// These are added on top of the 15 ideological groups in policies.js
// (VOTER_GROUPS). Together they form the full electorate.
export const EXTRA_VOTERS = [
  { id: "students",            name: "Students",              description: "Learners in school, college, and university." },
  { id: "gigWorkers",          name: "Gig Workers",           description: "Freelancers and platform-economy workers." },
  { id: "smallBusinessOwners", name: "Small Business Owners", description: "Owners of small and family enterprises." },
  { id: "techWorkers",         name: "Tech Workers",          description: "Software, data, and digital-industry professionals." },
  { id: "scientists",          name: "Scientists & Academics",description: "Researchers and university staff." },
  { id: "artists",             name: "Artists & Creatives",   description: "Cultural workers and the creative industries." },
  { id: "religiousGroups",     name: "Religious Communities", description: "Faith-based and traditional-values voters." },
  { id: "immigrants",          name: "Immigrant Communities", description: "Recent and first-generation migrants." },
  { id: "lgbtqCommunity",      name: "LGBTQ+ Community",       description: "Lesbian, gay, bisexual, transgender, and queer citizens." },
  { id: "disabledCommunity",   name: "Disabled Citizens",     description: "People living with disabilities and their carers." },
  { id: "renters",             name: "Renters",               description: "Tenants in private and social housing." },
  { id: "homeowners",          name: "Homeowners",            description: "Property owners with a stake in house prices." },
  { id: "motorists",           name: "Motorists",             description: "Drivers reliant on cars and road networks." },
  { id: "cyclists",            name: "Cyclists & Pedestrians",description: "Active-travel and car-free city dwellers." },
  { id: "indigenousCommunities",name:"Indigenous Communities",description: "First-nations and indigenous peoples." },
  { id: "civilServants",       name: "Civil Servants",        description: "Public-sector and government employees." },
  { id: "taxpayers",           name: "Taxpayers' Alliance",   description: "Fiscally-minded voters wary of public spending." },
];

// ── Voter preference profiles ─────────────────────────────────────────────────
// For every voter group: which indicators move their approval, and how strongly.
// `weight` is multiplied by how far the indicator sits, in its GOOD direction,
// from the 100 baseline (so a negative weight = this group dislikes that
// indicator improving — e.g. homeowners and housing affordability).
// Approval also reacts to the direct voterEffects on enacted policies (see
// gameState.js), so the 15 ideological groups feel policy choices immediately
// while the broader electorate responds to real-world outcomes.
export const VOTER_PROFILES = {
  // ── Ideological core (also have direct policy voterEffects) ──
  environmentalists:  [["carbonEmissions",0.30],["renewableEnergy",0.30],["airQuality",0.25],["biodiversity",0.25]],
  conservatives:      [["nationalDebt",0.30],["crimeRate",0.25],["gdpGrowth",0.20],["corruption",0.20]],
  progressives:       [["inequality",0.30],["socialCohesion",0.22],["civilLiberties",0.25],["healthcareAccess",0.18]],
  youth:              [["housingAfford",0.25],["educationQuality",0.20],["digitalInclusion",0.18],["mentalHealth",0.15],["unemployment",0.15]],
  seniors:            [["healthcareAccess",0.30],["publicHealth",0.25],["crimeRate",0.20],["nationalDebt",0.12]],
  businessCommunity:  [["gdpGrowth",0.35],["innovation",0.22],["nationalDebt",0.15],["unemployment",0.12]],
  workers:            [["unemployment",0.30],["inequality",0.25],["housingAfford",0.18],["gdpGrowth",0.12]],
  urbanResidents:     [["publicTransport",0.25],["housingAfford",0.22],["crimeRate",0.20],["airQuality",0.15]],
  ruralResidents:     [["infrastructure",0.25],["digitalInclusion",0.20],["publicTransport",0.15],["gdpGrowth",0.15]],
  minorities:         [["inequality",0.30],["civilLiberties",0.25],["socialCohesion",0.20],["crimeRate",0.15]],
  healthcareWorkers:  [["healthcareAccess",0.35],["publicHealth",0.25],["mentalHealth",0.20]],
  educators:          [["educationQuality",0.40],["literacy",0.25],["socialCohesion",0.10]],
  farmers:            [["infrastructure",0.20],["gdpGrowth",0.20],["biodiversity",0.15],["housingAfford",0.05]],
  veterans:           [["crimeRate",0.25],["socialCohesion",0.20],["civilLiberties",0.15],["nationalDebt",0.15]],
  parents:            [["educationQuality",0.30],["publicHealth",0.20],["housingAfford",0.20],["crimeRate",0.15]],
  // ── Broader electorate (outcome-driven) ──
  students:           [["educationQuality",0.35],["digitalInclusion",0.20],["housingAfford",0.15],["mentalHealth",0.15]],
  gigWorkers:         [["unemployment",0.25],["inequality",0.25],["housingAfford",0.20],["digitalInclusion",0.15]],
  smallBusinessOwners:[["gdpGrowth",0.30],["nationalDebt",0.20],["innovation",0.15],["unemployment",0.15]],
  techWorkers:        [["innovation",0.35],["digitalInclusion",0.25],["educationQuality",0.15],["gdpGrowth",0.10]],
  scientists:         [["innovation",0.30],["educationQuality",0.25],["renewableEnergy",0.15],["airQuality",0.10]],
  artists:            [["civilLiberties",0.30],["socialCohesion",0.20],["mentalHealth",0.15],["educationQuality",0.10]],
  religiousGroups:    [["socialCohesion",0.30],["crimeRate",0.22],["corruption",0.15],["civilLiberties",-0.08]],
  immigrants:         [["inequality",0.25],["civilLiberties",0.25],["socialCohesion",0.20],["unemployment",0.15]],
  lgbtqCommunity:     [["civilLiberties",0.40],["socialCohesion",0.20],["mentalHealth",0.15]],
  disabledCommunity:  [["healthcareAccess",0.30],["inequality",0.25],["socialCohesion",0.18],["publicTransport",0.12]],
  renters:            [["housingAfford",0.45],["inequality",0.20],["socialCohesion",0.10]],
  homeowners:         [["housingAfford",-0.18],["infrastructure",0.20],["crimeRate",0.20],["gdpGrowth",0.15],["nationalDebt",0.12]],
  motorists:          [["infrastructure",0.32],["gdpGrowth",0.15],["publicTransport",-0.08],["airQuality",0.08]],
  cyclists:           [["airQuality",0.30],["publicTransport",0.22],["carbonEmissions",0.25],["publicHealth",0.15]],
  indigenousCommunities:[["biodiversity",0.30],["civilLiberties",0.25],["socialCohesion",0.20],["inequality",0.15]],
  civilServants:      [["corruption",0.30],["nationalDebt",0.15],["socialCohesion",0.15],["publicHealth",0.12]],
  taxpayers:          [["nationalDebt",0.40],["corruption",0.25],["gdpGrowth",0.15]],
};

// ── Events ──────────────────────────────────────────────────────────────────────
// `kind: "conditional"` events fire when the world drifts into a danger/triumph
// zone (cond.dir "low" = value <= cond.value, "high" = value >= cond.value).
// `kind: "random"` events can strike at any time. Effects are one-off shocks to
// indicator VALUES (which then ripple through the influence graph), optional
// approval swings, and a treasury delta. `seed` feeds the round narrator.
export const EVENTS = [
  // ── Conditional: crises ──
  { id: "recession", title: "Recession Deepens", kind: "conditional",
    cond: { id: "gdpGrowth", dir: "low", value: 85 }, weight: 3,
    indicators: [{ id: "unemployment", delta: 8 }, { id: "gdpGrowth", delta: -4 }],
    approvalDelta: -5, credits: -15,
    seed: "A worsening recession bites: factories idle, unemployment lines grow, and the treasury takes a hit." },
  { id: "debtCrisis", title: "Sovereign Debt Crisis", kind: "conditional",
    cond: { id: "nationalDebt", dir: "high", value: 150 }, weight: 3,
    indicators: [{ id: "gdpGrowth", delta: -6 }], approvalDelta: -6, credits: -25,
    seed: "Bond markets panic over the ballooning national debt; borrowing costs spike and austerity looms." },
  { id: "pollutionCrisis", title: "Air Pollution Emergency", kind: "conditional",
    cond: { id: "airQuality", dir: "low", value: 80 }, weight: 2,
    indicators: [{ id: "publicHealth", delta: -6 }], approvalDelta: -4,
    voters: [{ id: "environmentalists", delta: -8 }, { id: "cyclists", delta: -6 }],
    seed: "A choking smog blankets the cities; hospitals fill with respiratory cases and citizens demand action." },
  { id: "crimeWave", title: "Crime Wave", kind: "conditional",
    cond: { id: "crimeRate", dir: "high", value: 132 }, weight: 2,
    indicators: [{ id: "socialCohesion", delta: -6 }], approvalDelta: -5,
    seed: "A surge in crime dominates the headlines; communities feel unsafe and trust in government erodes." },
  { id: "healthCrisis", title: "Public Health Breakdown", kind: "conditional",
    cond: { id: "publicHealth", dir: "low", value: 80 }, weight: 2,
    indicators: [{ id: "healthcareAccess", delta: -5 }], approvalDelta: -5, credits: -10,
    seed: "Overwhelmed clinics and falling life expectancy turn public health into a national scandal." },
  { id: "housingProtest", title: "Housing Protests", kind: "conditional",
    cond: { id: "housingAfford", dir: "low", value: 75 }, weight: 2,
    indicators: [{ id: "socialCohesion", delta: -5 }], approvalDelta: -3,
    voters: [{ id: "renters", delta: -10 }, { id: "youth", delta: -6 }, { id: "urbanResidents", delta: -5 }],
    seed: "Tens of thousands march against soaring rents and impossible house prices." },
  { id: "corruptionScandal", title: "Corruption Scandal", kind: "conditional",
    cond: { id: "corruption", dir: "high", value: 132 }, weight: 2,
    indicators: [{ id: "civilLiberties", delta: -3 }], approvalDelta: -7,
    voters: [{ id: "civilServants", delta: -8 }, { id: "taxpayers", delta: -8 }],
    seed: "Leaked documents expose graft at the heart of government; the opposition smells blood." },
  { id: "unrest", title: "Civil Unrest", kind: "conditional",
    cond: { id: "socialCohesion", dir: "low", value: 75 }, weight: 2,
    indicators: [{ id: "crimeRate", delta: 6 }], approvalDelta: -6,
    seed: "Frustration boils over into street protests and clashes as society frays at the seams." },
  // ── Conditional: triumphs ──
  { id: "boom", title: "Economic Boom", kind: "conditional",
    cond: { id: "gdpGrowth", dir: "high", value: 132 }, weight: 2,
    indicators: [{ id: "unemployment", delta: -4 }], approvalDelta: 5, credits: 20,
    seed: "The economy roars: record investment, falling joblessness, and a flush treasury." },
  { id: "greenMilestone", title: "Green Energy Milestone", kind: "conditional",
    cond: { id: "renewableEnergy", dir: "high", value: 150 }, weight: 2,
    indicators: [{ id: "carbonEmissions", delta: -5 }], approvalDelta: 4,
    voters: [{ id: "environmentalists", delta: 10 }, { id: "youth", delta: 5 }],
    seed: "The nation hits a landmark in clean energy, drawing international praise." },
  { id: "techBoom", title: "Technology Boom", kind: "conditional",
    cond: { id: "innovation", dir: "high", value: 140 }, weight: 2,
    indicators: [{ id: "gdpGrowth", delta: 4 }], approvalDelta: 3, credits: 15,
    voters: [{ id: "techWorkers", delta: 8 }],
    seed: "A wave of homegrown innovation makes the country a magnet for talent and capital." },
  // ── Random shocks ──
  { id: "naturalDisaster", title: "Natural Disaster", kind: "random", weight: 1,
    indicators: [{ id: "infrastructure", delta: -8 }, { id: "publicHealth", delta: -3 }],
    approvalDelta: -2, credits: -20,
    seed: "A severe storm batters the country, wrecking infrastructure and straining emergency services." },
  { id: "breakthrough", title: "Scientific Breakthrough", kind: "random", weight: 1,
    indicators: [{ id: "innovation", delta: 7 }, { id: "gdpGrowth", delta: 3 }],
    approvalDelta: 2, voters: [{ id: "scientists", delta: 8 }],
    seed: "Researchers announce a celebrated breakthrough that captures the world's imagination." },
  { id: "marketSwing", title: "Global Market Swing", kind: "random", weight: 1,
    indicators: [{ id: "gdpGrowth", delta: -5 }], credits: -5,
    seed: "Turbulence on world markets sends a chill through the domestic economy." },
  { id: "pandemicScare", title: "Pandemic Scare", kind: "random", weight: 1,
    indicators: [{ id: "publicHealth", delta: -7 }, { id: "healthcareAccess", delta: -4 }],
    approvalDelta: -3, credits: -10,
    seed: "A new outbreak puts the health system on alert and rattles a nervous public." },
  { id: "diplomaticWin", title: "Diplomatic Triumph", kind: "random", weight: 1,
    indicators: [{ id: "gdpGrowth", delta: 3 }], approvalDelta: 4,
    seed: "A landmark international deal burnishes the government's standing on the world stage." },
  { id: "mediaScandal", title: "Media Scandal", kind: "random", weight: 1,
    approvalDelta: -5,
    seed: "An unflattering exposé dominates the news cycle and dents the government's image." },
  { id: "celebrityEndorsement", title: "Cultural Moment", kind: "random", weight: 1,
    approvalDelta: 3, voters: [{ id: "artists", delta: 6 }, { id: "youth", delta: 4 }],
    seed: "A beloved public figure rallies behind the government, lifting the national mood." },
  { id: "laborStrike", title: "General Strike", kind: "random", weight: 1,
    indicators: [{ id: "gdpGrowth", delta: -4 }], approvalDelta: -2,
    voters: [{ id: "workers", delta: -5 }, { id: "businessCommunity", delta: -4 }],
    seed: "Unions down tools in a sweeping strike that grinds parts of the country to a halt." },
];

// ── Goals ─────────────────────────────────────────────────────────────────────
// At the start of a game the player is elected on a mandate. Meeting every
// target (dir "high" = value >= target, "low" = value <= target) AND holding
// approval at/above requireApproval achieves the goal.
export const GOALS = [
  { id: "greenFuture", title: "The Green Mandate",
    description: "Lead the world on climate: scale up clean energy and slash emissions without losing the public.",
    requireApproval: 50,
    targets: [["renewableEnergy","high",150],["carbonEmissions","low",75],["airQuality","high",125]] },
  { id: "economicPowerhouse", title: "Economic Powerhouse",
    description: "Build a roaring, broadly-shared economy with low joblessness and disciplined public finances.",
    requireApproval: 50,
    targets: [["gdpGrowth","high",140],["unemployment","low",80],["nationalDebt","low",110]] },
  { id: "equalSociety", title: "A Fairer Society",
    description: "Close the gap: tackle inequality, knit communities together, and guarantee healthcare for all.",
    requireApproval: 50,
    targets: [["inequality","low",70],["socialCohesion","high",135],["healthcareAccess","high",130]] },
  { id: "safeNation", title: "Safe & Accountable",
    description: "Cut crime and corruption to the bone while expanding, not shrinking, civil liberties.",
    requireApproval: 50,
    targets: [["crimeRate","low",70],["corruption","low",75],["civilLiberties","high",130]] },
  { id: "innovationHub", title: "Innovation Nation",
    description: "Become a global hub of research and technology, with world-class schools and full digital access.",
    requireApproval: 50,
    targets: [["innovation","high",150],["educationQuality","high",135],["digitalInclusion","high",140]] },
  { id: "wellbeingState", title: "The Wellbeing State",
    description: "Put quality of life first: healthy minds and bodies, and homes people can actually afford.",
    requireApproval: 50,
    targets: [["publicHealth","high",140],["mentalHealth","high",135],["housingAfford","high",130]] },
];

// ── Tunable constants ───────────────────────────────────────────────────────────
export const SIM = {
  TERM_LENGTH: 16,            // rounds per electoral term
  ELECTION_THRESHOLD: 50,     // min approval to be re-elected
  ROUND_INCOME: 75,           // credits granted each round
  VOTER_INERTIA: 0.25,        // how fast approval eases toward its target
  VOTER_INDICATOR_SCALE: 0.5, // weight multiplier for indicator-driven approval
  POLICY_SENTIMENT_SCALE: 0.40,// weight of a policy's direct voterEffects while enacted
  EVENT_RANDOM_CHANCE: 0.55,  // chance per round of an extra random event
  DRIFT: 1.5,                 // ± random noise applied to indicator targets each round
};
