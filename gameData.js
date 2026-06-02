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
// `kind:"ongoing"` events are SITUATIONS: they switch on when an indicator
// crosses a threshold (cond) and stay active — applying `pressure` to indicator
// targets and `moodDrip` to the public mood each round — until the indicator
// recovers past the threshold (with hysteresis). `kind:"shock"` events are
// one-off jolts (`indicators` value nudges + `mood`/`credits`), shown briefly.
// Every event has a `category` so it can be pinned to the right wheel sector,
// and a `tone` ("bad"/"good"). `onset`/`clear` feed the round narrator.
export const EVENTS = [
  // ── Ongoing crises (threshold-triggered) ──
  { id:"brainDrain", title:"Brain Drain", kind:"ongoing", tone:"bad", category:"Education",
    cond:{ id:"educationQuality", dir:"low", value:86 }, pressure:[{id:"innovation",delta:-3},{id:"gdpGrowth",delta:-2}], moodDrip:-0.5,
    desc:"Talented graduates emigrate for brighter prospects abroad, hollowing out the workforce.",
    onset:"A worsening brain drain takes hold as the brightest graduates leave for opportunities abroad.",
    clear:"The brain drain eases as opportunity returns and talented people stay home." },
  { id:"illiteracyRise", title:"Falling Literacy", kind:"ongoing", tone:"bad", category:"Education",
    cond:{ id:"literacy", dir:"low", value:86 }, pressure:[{id:"educationQuality",delta:-2},{id:"socialCohesion",delta:-1}], moodDrip:-0.3,
    desc:"Slipping literacy rates undermine schooling, employment, and civic life.",
    onset:"Literacy is sliding, and with it the foundations of schools and the workforce.",
    clear:"Literacy recovers, steadying schools and civic life." },
  { id:"alcoholism", title:"Substance Abuse Epidemic", kind:"ongoing", tone:"bad", category:"Healthcare",
    cond:{ id:"mentalHealth", dir:"low", value:84 }, pressure:[{id:"publicHealth",delta:-2},{id:"crimeRate",delta:2},{id:"gdpGrowth",delta:-1}], moodDrip:-0.5,
    desc:"A wave of alcohol and substance abuse strains families, clinics, and police.",
    onset:"Despair fuels a rising tide of alcoholism and substance abuse across the country.",
    clear:"The substance-abuse epidemic recedes as mental-health support takes hold." },
  { id:"epidemicSpread", title:"Recurring Epidemics", kind:"ongoing", tone:"bad", category:"Healthcare",
    cond:{ id:"publicHealth", dir:"low", value:82 }, pressure:[{id:"healthcareAccess",delta:-2},{id:"gdpGrowth",delta:-1}], moodDrip:-0.5,
    desc:"A fragile health system buckles under recurring outbreaks.",
    onset:"Recurring epidemics overwhelm clinics as public health deteriorates.",
    clear:"Outbreaks are brought under control as public health stabilises." },
  { id:"smogIllness", title:"Toxic Smog", kind:"ongoing", tone:"bad", category:"Environment",
    cond:{ id:"airQuality", dir:"low", value:84 }, pressure:[{id:"publicHealth",delta:-3}], moodDrip:-0.4,
    desc:"Choking air pollution fills hospitals with respiratory cases.",
    onset:"A toxic smog settles over the cities, and respiratory illness surges.",
    clear:"The skies clear and respiratory cases fall as air quality improves." },
  { id:"ecosystemCollapse", title:"Ecosystem Collapse", kind:"ongoing", tone:"bad", category:"Environment",
    cond:{ id:"biodiversity", dir:"low", value:80 }, pressure:[{id:"publicHealth",delta:-1},{id:"airQuality",delta:-1}], moodDrip:-0.3,
    desc:"Collapsing ecosystems ripple through food, water, and wellbeing.",
    onset:"Ecosystems are collapsing, threatening food and water security.",
    clear:"Ecosystems begin to recover as conservation efforts take effect." },
  { id:"housingCrisis", title:"Housing Crisis", kind:"ongoing", tone:"bad", category:"Housing",
    cond:{ id:"housingAfford", dir:"low", value:82 }, pressure:[{id:"socialCohesion",delta:-2},{id:"inequality",delta:1}], moodDrip:-0.6,
    desc:"Spiralling housing costs lock a generation out and enrage renters.",
    onset:"A full-blown housing crisis erupts as rents and prices spiral out of reach.",
    clear:"The housing crisis eases as homes become affordable again." },
  { id:"capitalFlight", title:"Capital Flight", kind:"ongoing", tone:"bad", category:"Economy",
    cond:{ id:"nationalDebt", dir:"high", value:148 }, pressure:[{id:"gdpGrowth",delta:-2},{id:"nationalDebt",delta:1}], moodDrip:-0.4,
    desc:"Spooked investors pull money out, draining capital from the economy.",
    onset:"Investors take fright at the debt and capital begins fleeing the country.",
    clear:"Confidence returns and capital flows back into the economy." },
  { id:"stagnation", title:"Economic Stagnation", kind:"ongoing", tone:"bad", category:"Economy",
    cond:{ id:"gdpGrowth", dir:"low", value:86 }, pressure:[{id:"unemployment",delta:2}], moodDrip:-0.5,
    desc:"A stagnant economy saps confidence, investment, and jobs.",
    onset:"The economy slides into stagnation; growth stalls and confidence drains away.",
    clear:"Growth returns and the economy shakes off its stagnation." },
  { id:"inequalityUnrest", title:"Inequality Unrest", kind:"ongoing", tone:"bad", category:"Economy",
    cond:{ id:"inequality", dir:"high", value:130 }, pressure:[{id:"socialCohesion",delta:-2},{id:"crimeRate",delta:1}], moodDrip:-0.5,
    desc:"A glaring wealth gap fuels resentment, protest, and division.",
    onset:"Yawning inequality boils over into resentment and street protest.",
    clear:"Tensions ease as the wealth gap narrows." },
  { id:"massUnemployment", title:"Mass Unemployment", kind:"ongoing", tone:"bad", category:"Labor",
    cond:{ id:"unemployment", dir:"high", value:124 }, pressure:[{id:"gdpGrowth",delta:-2},{id:"crimeRate",delta:1},{id:"socialCohesion",delta:-1}], moodDrip:-0.6,
    desc:"Mass joblessness breeds hardship, crime, and unrest.",
    onset:"Unemployment reaches crisis levels, leaving millions without work.",
    clear:"Jobs return and mass unemployment subsides." },
  { id:"blackMarket", title:"Black Markets", kind:"ongoing", tone:"bad", category:"Justice",
    cond:{ id:"crimeRate", dir:"high", value:128 }, pressure:[{id:"gdpGrowth",delta:-1},{id:"corruption",delta:2}], moodDrip:-0.4,
    desc:"Organised crime and black markets flourish in the shadows.",
    onset:"Rampant crime gives rise to thriving black markets and organised gangs.",
    clear:"Black markets wither as law and order is restored." },
  { id:"corruptionEntrenched", title:"Entrenched Corruption", kind:"ongoing", tone:"bad", category:"Justice",
    cond:{ id:"corruption", dir:"high", value:128 }, pressure:[{id:"gdpGrowth",delta:-2},{id:"socialCohesion",delta:-1}], moodDrip:-0.6,
    desc:"Endemic graft rots institutions and scares off investment.",
    onset:"Corruption becomes entrenched, hollowing out trust in every institution.",
    clear:"A cleaner government takes shape as corruption is rooted out." },
  { id:"extremismRise", title:"Rise of Extremism", kind:"ongoing", tone:"bad", category:"Civic",
    cond:{ id:"socialCohesion", dir:"low", value:82 }, pressure:[{id:"crimeRate",delta:2},{id:"civilLiberties",delta:-1}], moodDrip:-0.5,
    desc:"A fractured society breeds polarisation and extremism.",
    onset:"As communities fracture, extremist movements gain alarming ground.",
    clear:"Social healing drains the appeal of extremism." },
  { id:"digitalDivide", title:"Digital Divide", kind:"ongoing", tone:"bad", category:"Technology",
    cond:{ id:"digitalInclusion", dir:"low", value:84 }, pressure:[{id:"innovation",delta:-2},{id:"inequality",delta:1}], moodDrip:-0.3,
    desc:"A widening digital divide leaves whole communities behind.",
    onset:"A digital divide opens up, cutting off communities from the modern economy.",
    clear:"The digital divide closes as connectivity spreads." },
  { id:"infrastructureDecay", title:"Crumbling Infrastructure", kind:"ongoing", tone:"bad", category:"Civic",
    cond:{ id:"infrastructure", dir:"low", value:84 }, pressure:[{id:"gdpGrowth",delta:-1},{id:"publicTransport",delta:-2}], moodDrip:-0.4,
    desc:"Crumbling roads, bridges, and utilities hamper daily life and trade.",
    onset:"Decades of neglect catch up: infrastructure is visibly crumbling.",
    clear:"Rebuilt infrastructure gets the country moving again." },
  { id:"energyShortage", title:"Energy Shortage", kind:"ongoing", tone:"bad", category:"Energy",
    cond:{ id:"renewableEnergy", dir:"low", value:80 }, pressure:[{id:"gdpGrowth",delta:-1},{id:"carbonEmissions",delta:1}], moodDrip:-0.5,
    desc:"Power shortages and blackouts disrupt industry and homes.",
    onset:"Energy shortages bite: rolling blackouts hit industry and households.",
    clear:"The lights stay on as energy supply stabilises." },
  { id:"transportGridlock", title:"Transport Gridlock", kind:"ongoing", tone:"bad", category:"Transport",
    cond:{ id:"publicTransport", dir:"low", value:84 }, pressure:[{id:"airQuality",delta:-1},{id:"gdpGrowth",delta:-1}], moodDrip:-0.3,
    desc:"Gridlocked, unreliable transport chokes cities and commerce.",
    onset:"Transport seizes up; gridlock and breakdowns paralyse the cities.",
    clear:"Traffic flows freely again as transport investment pays off." },
  // ── Ongoing booms (good) ──
  { id:"greenBoom", title:"Green Energy Boom", kind:"ongoing", tone:"good", category:"Energy",
    cond:{ id:"renewableEnergy", dir:"high", value:145 }, pressure:[{id:"carbonEmissions",delta:-2},{id:"innovation",delta:1}], moodDrip:0.4,
    desc:"A booming clean-energy sector becomes the envy of the world.",
    onset:"A green-energy boom takes off, exporting clean power and know-how.",
    clear:"The green boom cools as renewable growth levels off." },
  { id:"innovationCluster", title:"Innovation Cluster", kind:"ongoing", tone:"good", category:"Technology",
    cond:{ id:"innovation", dir:"high", value:140 }, pressure:[{id:"gdpGrowth",delta:2}], moodDrip:0.4,
    desc:"A thriving tech cluster pulls in talent and investment.",
    onset:"A world-class innovation cluster blossoms, drawing talent and capital.",
    clear:"The innovation boom settles back to a steady hum." },
  { id:"socialHarmony", title:"Social Harmony", kind:"ongoing", tone:"good", category:"Civic",
    cond:{ id:"socialCohesion", dir:"high", value:138 }, pressure:[{id:"crimeRate",delta:-1}], moodDrip:0.5,
    desc:"A cohesive, high-trust society lifts the national mood.",
    onset:"A rare social harmony settles over the nation; trust and goodwill abound.",
    clear:"The glow of social harmony fades as old divisions resurface." },
  { id:"educationRenaissance", title:"Education Renaissance", kind:"ongoing", tone:"good", category:"Education",
    cond:{ id:"educationQuality", dir:"high", value:138 }, pressure:[{id:"innovation",delta:2},{id:"literacy",delta:1}], moodDrip:0.4,
    desc:"World-class schooling powers a knowledge renaissance.",
    onset:"An education renaissance takes hold, the envy of nations.",
    clear:"The education boom plateaus as standards normalise." },
  // ── Conditional shocks ──
  { id:"debtCrisis", title:"Debt Crisis", kind:"shock", tone:"bad", category:"Economy",
    cond:{ id:"nationalDebt", dir:"high", value:160 }, weight:3, indicators:[{id:"gdpGrowth",delta:-6}], mood:-6, credits:-25,
    desc:"Bond markets panic; borrowing costs spike and austerity looms.",
    seed:"Bond markets panic over the ballooning debt; a sovereign debt crisis erupts." },
  { id:"riot", title:"Riots", kind:"shock", tone:"bad", category:"Justice",
    cond:{ id:"crimeRate", dir:"high", value:142 }, weight:2, indicators:[{id:"socialCohesion",delta:-6},{id:"infrastructure",delta:-3}], mood:-6, credits:-10,
    desc:"Violent riots erupt in major cities.",
    seed:"Violent riots break out across major cities, leaving damage and fear in their wake." },
  { id:"corruptionExpose", title:"Corruption Exposé", kind:"shock", tone:"bad", category:"Justice",
    cond:{ id:"corruption", dir:"high", value:140 }, weight:2, indicators:[{id:"civilLiberties",delta:-2}], mood:-7,
    desc:"A blockbuster exposé reveals graft at the top.",
    seed:"A blockbuster exposé lays bare corruption at the heart of government." },
  // ── Conditional triumph shocks ──
  { id:"boom", title:"Economic Boom", kind:"shock", tone:"good", category:"Economy",
    cond:{ id:"gdpGrowth", dir:"high", value:138 }, weight:2, indicators:[{id:"unemployment",delta:-4}], mood:6, credits:20,
    desc:"The economy roars; record investment and a flush treasury.",
    seed:"The economy roars to life: record investment, falling joblessness, and a flush treasury." },
  { id:"greenMilestone", title:"Climate Leadership", kind:"shock", tone:"good", category:"Environment",
    cond:{ id:"carbonEmissions", dir:"low", value:78 }, weight:2, indicators:[{id:"biodiversity",delta:4}], mood:5,
    desc:"The nation is hailed as a global climate leader.",
    seed:"With emissions plunging, the nation is hailed as a global climate leader." },
  // ── Random shocks ──
  { id:"naturalDisaster", title:"Natural Disaster", kind:"shock", tone:"bad", category:"Civic", weight:1,
    indicators:[{id:"infrastructure",delta:-9},{id:"publicHealth",delta:-3}], mood:-3, credits:-20,
    desc:"A severe storm wrecks infrastructure and strains services.",
    seed:"A severe storm batters the country, wrecking infrastructure and straining emergency services." },
  { id:"breakthrough", title:"Scientific Breakthrough", kind:"shock", tone:"good", category:"Technology", weight:1,
    indicators:[{id:"innovation",delta:8},{id:"gdpGrowth",delta:3}], mood:3,
    desc:"A celebrated research breakthrough captures the world's imagination.",
    seed:"Researchers announce a celebrated breakthrough that captures the world's imagination." },
  { id:"marketSwing", title:"Global Market Swing", kind:"shock", tone:"bad", category:"Economy", weight:1,
    indicators:[{id:"gdpGrowth",delta:-5}], credits:-5,
    desc:"Turbulence on world markets chills the economy.",
    seed:"Turbulence on world markets sends a chill through the domestic economy." },
  { id:"pandemicScare", title:"Pandemic Scare", kind:"shock", tone:"bad", category:"Healthcare", weight:1,
    indicators:[{id:"publicHealth",delta:-8},{id:"healthcareAccess",delta:-4}], mood:-3, credits:-10,
    desc:"A new outbreak puts the health system on alert.",
    seed:"A new outbreak puts the health system on alert and rattles a nervous public." },
  { id:"diplomaticWin", title:"Diplomatic Triumph", kind:"shock", tone:"good", category:"Foreign Policy", weight:1,
    indicators:[{id:"gdpGrowth",delta:3}], mood:4,
    desc:"A landmark deal burnishes the nation's standing abroad.",
    seed:"A landmark international deal burnishes the government's standing on the world stage." },
  { id:"mediaScandal", title:"Media Scandal", kind:"shock", tone:"bad", category:"Civic", weight:1, mood:-5,
    desc:"An unflattering exposé dominates the news cycle.",
    seed:"An unflattering exposé dominates the news cycle and dents the government's image." },
  { id:"culturalMoment", title:"Cultural Moment", kind:"shock", tone:"good", category:"Civic", weight:1, mood:4,
    desc:"A beloved public figure rallies behind the government.",
    seed:"A beloved public figure rallies behind the government, lifting the national mood." },
  { id:"laborStrike", title:"General Strike", kind:"shock", tone:"bad", category:"Labor", weight:1,
    indicators:[{id:"gdpGrowth",delta:-4}], mood:-3,
    desc:"A sweeping strike grinds parts of the country to a halt.",
    seed:"Unions down tools in a sweeping strike that grinds parts of the country to a halt." },
  { id:"techExport", title:"Export Windfall", kind:"shock", tone:"good", category:"Economy", weight:1,
    indicators:[{id:"gdpGrowth",delta:4}], credits:15,
    desc:"A surge in exports delivers a treasury windfall.",
    seed:"A surge in high-value exports delivers an unexpected windfall to the treasury." },
];

// ── Goals ─────────────────────────────────────────────────────────────────────
// At the start of a game the player is elected on a mandate. Meeting every
// target (dir "high" = value >= target, "low" = value <= target) AND holding
// approval at/above requireApproval achieves the goal.
// Each goal also defines the SITUATION the player inherits: starting indicator
// levels and a set of already-enacted policies. So no game begins from a blank
// slate — you take office mid-crisis with a real gap to close.
export const GOALS = [
  { id: "greenFuture", title: "The Green Mandate",
    description: "Lead the world on climate: scale up clean energy and slash emissions without losing the public.",
    requireApproval: 50,
    targets: [["renewableEnergy","high",150],["carbonEmissions","low",75],["airQuality","high",125]],
    start: {
      capital: 120,
      narrative: "You inherit a fossil-fuelled economy: smog over the cities, gridlocked roads, emissions rising, and only a token green programme.",
      indicators: { carbonEmissions:136, airQuality:78, renewableEnergy:84, publicTransport:80, gdpGrowth:112, nationalDebt:118, publicHealth:90 },
      events: ["smogIllness","transportGridlock"],
      policies: ["roadExpansion","economicStimulus","renewableSubsidy","corporateTaxCut","freeTradeAgreement","publicWorksProgram","hospitalFunding","schoolFundingIncrease","pensionReform","borderSecurity","vatReduction","smartTraffic","nuclearPower","childBenefits","communityPolicing","internetForAll","apprenticeshipProgram"] } },
  { id: "economicPowerhouse", title: "Economic Powerhouse",
    description: "Build a roaring, broadly-shared economy with low joblessness and disciplined public finances.",
    requireApproval: 50,
    targets: [["gdpGrowth","high",140],["unemployment","low",80],["nationalDebt","low",110]],
    start: {
      capital: 110,
      narrative: "You take power amid a deep recession: factories idle, joblessness high, and a treasury buried under debt after years of spending.",
      indicators: { gdpGrowth:80, unemployment:128, nationalDebt:150, inequality:118, socialCohesion:90 },
      events: ["stagnation","massUnemployment","capitalFlight"],
      policies: ["minimumWageIncrease","housingBenefitExpansion","pensionReform","universalHealthcare","childBenefits","disabilitySupport","socialCareReform","freePublicTransport","schoolFundingIncrease","rentControl","fourDayWorkWeek","workersRights","foodBankFunding","basicServicesGuarantee","publicWorksProgram","welfareToWork"] } },
  { id: "equalSociety", title: "A Fairer Society",
    description: "Close the gap: tackle inequality, knit communities together, and guarantee healthcare for all.",
    requireApproval: 50,
    targets: [["inequality","low",70],["socialCohesion","high",135],["healthcareAccess","high",130]],
    start: {
      capital: 120,
      narrative: "Years of pro-business rule have left a yawning wealth gap, frayed communities, unaffordable housing, and patchy healthcare. The country is restless.",
      indicators: { inequality:138, socialCohesion:80, healthcareAccess:84, housingAfford:80, crimeRate:118, gdpGrowth:120 },
      events: ["inequalityUnrest","extremismRise","housingCrisis"],
      policies: ["corporateTaxCut","freeTradeAgreement","smallBusinessGrants","sovereignWealthFund","vatReduction","economicStimulus","roadExpansion","militaryModernisation","borderSecurity","pointsBasedImmigration","rdTaxCredits","techStartupFund","nuclearPower","smartGrid","highSpeedRail","cybersecurity"] } },
  { id: "safeNation", title: "Safe & Accountable",
    description: "Cut crime and corruption to the bone while expanding, not shrinking, civil liberties.",
    requireApproval: 50,
    targets: [["crimeRate","low",70],["corruption","low",75],["civilLiberties","high",130]],
    start: {
      capital: 120,
      narrative: "You inherit a hardline, scandal-ridden state: rampant crime, entrenched corruption, and civil liberties trampled in the name of order.",
      indicators: { crimeRate:134, corruption:132, civilLiberties:80, socialCohesion:80 },
      events: ["corruptionEntrenched","blackMarket","extremismRise"],
      policies: ["borderSecurity","militaryModernisation","communityPolicing","cybersecurity","digitalIDSystem","pointsBasedImmigration","roadExpansion","corporateTaxCut","publicWorksProgram","nuclearPower","economicStimulus","skilledWorkerVisa","smartTraffic","hospitalFunding","schoolFundingIncrease","vatReduction"] } },
  { id: "innovationHub", title: "Innovation Nation",
    description: "Become a global hub of research and technology, with world-class schools and full digital access.",
    requireApproval: 50,
    targets: [["innovation","high",150],["educationQuality","high",135],["digitalInclusion","high",140]],
    start: {
      capital: 120,
      narrative: "The country is falling behind: underfunded schools, a digital divide, sliding literacy, and a brain-drain of talent leaving for brighter shores.",
      indicators: { innovation:82, educationQuality:82, digitalInclusion:80, literacy:84, gdpGrowth:104 },
      events: ["brainDrain","digitalDivide","illiteracyRise"],
      policies: ["adultLiteracy","internetForAll","schoolMealProgram","corporateTaxCut","freeTradeAgreement","economicStimulus","roadExpansion","publicWorksProgram","hospitalFunding","pensionReform","borderSecurity","vatReduction","communityPolicing","childBenefits","smartTraffic","militaryModernisation"] } },
  { id: "wellbeingState", title: "The Wellbeing State",
    description: "Put quality of life first: healthy minds and bodies, and homes people can actually afford.",
    requireApproval: 50,
    targets: [["publicHealth","high",140],["mentalHealth","high",135],["housingAfford","high",130]],
    start: {
      capital: 120,
      narrative: "A burnt-out public: failing health outcomes, a mental-health crisis, and house prices that lock a generation out of a home.",
      indicators: { publicHealth:80, mentalHealth:78, housingAfford:76, inequality:116 },
      events: ["alcoholism","housingCrisis","epidemicSpread"],
      policies: ["corporateTaxCut","rentControl","freeTradeAgreement","economicStimulus","roadExpansion","publicWorksProgram","militaryModernisation","borderSecurity","vatReduction","smartTraffic","nuclearPower","pointsBasedImmigration","cybersecurity","sovereignWealthFund","freeUniversityTuition","highSpeedRail"] } },
];

// ── Political compass anchors ───────────────────────────────────────────────────
// Each voter trait sits somewhere on the 2D compass:
//   econ: −100 (left) … +100 (right)   ·   soc: −100 (libertarian/progressive) … +100 (authoritarian/traditional)
// An individual's traits pull their personal position toward these anchors, and a
// policy's compass lean is derived from the anchors of the groups it pleases.
export const COMPASS_ANCHORS = {
  environmentalists:{econ:-40,soc:-50}, conservatives:{econ:45,soc:55}, progressives:{econ:-55,soc:-55},
  youth:{econ:-25,soc:-40}, seniors:{econ:20,soc:35}, businessCommunity:{econ:65,soc:5},
  workers:{econ:-45,soc:0}, urbanResidents:{econ:-20,soc:-30}, ruralResidents:{econ:25,soc:35},
  minorities:{econ:-35,soc:-35}, healthcareWorkers:{econ:-25,soc:-15}, educators:{econ:-35,soc:-30},
  farmers:{econ:20,soc:30}, veterans:{econ:25,soc:45}, parents:{econ:0,soc:10},
  students:{econ:-40,soc:-45}, gigWorkers:{econ:-15,soc:-20}, smallBusinessOwners:{econ:45,soc:10},
  techWorkers:{econ:10,soc:-30}, scientists:{econ:-20,soc:-35}, artists:{econ:-35,soc:-55},
  religiousGroups:{econ:20,soc:65}, immigrants:{econ:-25,soc:-25}, lgbtqCommunity:{econ:-35,soc:-60},
  disabledCommunity:{econ:-30,soc:-10}, renters:{econ:-35,soc:-20}, homeowners:{econ:35,soc:20},
  motorists:{econ:20,soc:20}, cyclists:{econ:-25,soc:-35}, indigenousCommunities:{econ:-30,soc:-25},
  civilServants:{econ:-10,soc:5}, taxpayers:{econ:55,soc:20},
};

// How common each trait is, and how strongly compass position gates membership.
// `base` = baseline share of the population; `bias` (0–1) = how much an individual's
// ideological distance from the trait anchor raises/lowers their chance of holding it.
// High bias → ideological traits (progressives, religiousGroups…); low bias →
// broad demographics (parents, motorists…). Traits overlap freely, so one person
// can be e.g. an educator + farmer + progressive at once.
export const TRAIT_PREVALENCE = {
  workers:{base:0.45,bias:0.2}, parents:{base:0.35,bias:0.1}, taxpayers:{base:0.40,bias:0.6},
  motorists:{base:0.45,bias:0.15}, homeowners:{base:0.35,bias:0.3}, renters:{base:0.30,bias:0.25},
  urbanResidents:{base:0.40,bias:0.3}, ruralResidents:{base:0.28,bias:0.3}, seniors:{base:0.22,bias:0.2},
  youth:{base:0.22,bias:0.3}, students:{base:0.13,bias:0.3}, conservatives:{base:0.30,bias:1.0},
  progressives:{base:0.30,bias:1.0}, environmentalists:{base:0.24,bias:0.8}, businessCommunity:{base:0.12,bias:0.6},
  smallBusinessOwners:{base:0.12,bias:0.4}, religiousGroups:{base:0.28,bias:0.9}, minorities:{base:0.20,bias:0.4},
  immigrants:{base:0.12,bias:0.4}, educators:{base:0.08,bias:0.3}, healthcareWorkers:{base:0.08,bias:0.2},
  techWorkers:{base:0.08,bias:0.3}, scientists:{base:0.05,bias:0.4}, artists:{base:0.06,bias:0.6},
  civilServants:{base:0.08,bias:0.3}, farmers:{base:0.06,bias:0.3}, veterans:{base:0.08,bias:0.4},
  gigWorkers:{base:0.10,bias:0.3}, disabledCommunity:{base:0.12,bias:0.1}, lgbtqCommunity:{base:0.08,bias:0.7},
  cyclists:{base:0.12,bias:0.5}, indigenousCommunities:{base:0.04,bias:0.5},
};

// ── Cabinet ───────────────────────────────────────────────────────────────────────
// Portfolios group policy categories; a seated minister boosts the effect of and
// cuts the cost of policies in their portfolio.
export const PORTFOLIOS = [
  { id:"treasury",          name:"Treasury",            categories:["Economy","Taxation"] },
  { id:"healthWelfare",     name:"Health & Welfare",    categories:["Healthcare","Welfare","Housing"] },
  { id:"educationTech",     name:"Education & Tech",    categories:["Education","Technology"] },
  { id:"environmentEnergy", name:"Environment & Energy",categories:["Environment","Energy","Transport"] },
  { id:"justiceInterior",   name:"Justice & Interior",  categories:["Justice","Civil Liberties","Immigration"] },
  { id:"foreignCivic",      name:"Foreign & Civic",     categories:["Foreign Policy","Civic","Labor"] },
];

// Candidate ministers. effectiveness multiplies their portfolio's policy pressure;
// costReduction discounts those policies; capitalPerRound is passive income;
// approvalBias nudges specific groups while they serve.
function m(id, name, portfolio, econ, soc, capitalPerRound, costReduction, effectiveness, approvalBias) {
  return { id, name, portfolio, econ, soc, capitalPerRound, costReduction, effectiveness, approvalBias };
}
export const MINISTERS = [
  // Treasury
  m("t_whitlock","Diane Whitlock","treasury", 50, 10, 5,0.15,1.20,[["businessCommunity",6],["taxpayers",5],["workers",-3]]),
  m("t_bell","Marcus Bell","treasury", -40,-20, 3,0.10,1.25,[["workers",6],["progressives",5],["businessCommunity",-4]]),
  m("t_anand","Priya Anand","treasury", 5, -5, 6,0.06,1.10,[["smallBusinessOwners",6],["techWorkers",3]]),
  // Health & Welfare
  m("h_ford","Dr. Lena Ford","healthWelfare", -30,-15, 4,0.15,1.25,[["healthcareWorkers",8],["seniors",5],["conservatives",-3]]),
  m("h_reeves","Tom Reeves","healthWelfare", 20, 10, 6,0.18,1.05,[["taxpayers",5],["conservatives",4],["progressives",-3]]),
  m("h_marin","Sofia Marin","healthWelfare", -20,-25, 3,0.10,1.22,[["disabledCommunity",8],["parents",5]]),
  // Education & Tech
  m("e_khan","Aisha Khan","educationTech", -25,-30, 4,0.15,1.25,[["educators",8],["students",6],["youth",4]]),
  m("e_lang","Victor Lang","educationTech", 25,-10, 6,0.10,1.15,[["techWorkers",7],["businessCommunity",4]]),
  m("e_pierce","Nora Pierce","educationTech", -5,-20, 4,0.12,1.18,[["scientists",7],["educators",4]]),
  // Environment & Energy
  m("v_solberg","Greta Solberg","environmentEnergy", -35,-40, 3,0.20,1.30,[["environmentalists",9],["cyclists",5],["motorists",-4]]),
  m("v_boyd","Hank Boyd","environmentEnergy", 35, 15, 6,0.10,1.10,[["motorists",6],["ruralResidents",5],["environmentalists",-5]]),
  m("v_lin","Mei Lin","environmentEnergy", -10,-20, 5,0.12,1.20,[["scientists",5],["youth",4]]),
  // Justice & Interior
  m("j_mendez","Carla Méndez","justiceInterior", -30,-35, 3,0.15,1.25,[["minorities",8],["progressives",5],["conservatives",-4]]),
  m("j_sutton","Roy Sutton","justiceInterior", 30, 55, 5,0.12,1.15,[["conservatives",8],["veterans",6],["minorities",-6],["immigrants",-5]]),
  m("j_cho","Elaine Cho","justiceInterior", 0,-10, 5,0.10,1.18,[["civilServants",5],["urbanResidents",4]]),
  // Foreign & Civic
  m("f_bahari","Idris Bahari","foreignCivic", -15,-20, 4,0.12,1.20,[["immigrants",6],["progressives",4]]),
  m("f_hale","Margaret Hale","foreignCivic", 30, 35, 6,0.10,1.10,[["veterans",7],["conservatives",5]]),
  m("f_okoro","Sam Okoro","foreignCivic", 0, 0, 7,0.08,1.05,[["workers",4],["ruralResidents",4]]),
];

// ── Speeches ───────────────────────────────────────────────────────────────────────
// Each speech leans in a compass direction and rallies certain groups. Reward scales
// with approval and how mainstream the message is; targeted groups get a mood bump.
export const SPEECH_THEMES = [
  { id:"prosperity", title:"Prosperity & Jobs",   dir:{econ:30,soc:0},    groups:["businessCommunity","workers","smallBusinessOwners"] },
  { id:"fairness",   title:"Fairness & Equality", dir:{econ:-40,soc:-20}, groups:["progressives","workers","minorities"] },
  { id:"order",      title:"Law & Order",         dir:{econ:10,soc:50},   groups:["conservatives","veterans","seniors"] },
  { id:"green",      title:"A Green Future",       dir:{econ:-20,soc:-30}, groups:["environmentalists","youth","cyclists"] },
  { id:"family",     title:"Family & Community",   dir:{econ:0,soc:20},    groups:["parents","religiousGroups","seniors"] },
  { id:"freedom",    title:"Freedom & Rights",     dir:{econ:-10,soc:-50}, groups:["progressives","lgbtqCommunity","artists","youth"] },
];

// ── Staged policies ─────────────────────────────────────────────────────────────
// Many policies aren't all-or-nothing — you choose how far to go. Each stage has a
// flavourful name + description, a capital `cost` to enact at that level, a per-round
// fiscal flow (`fiscal`: negative = spending, positive = revenue), and an `effect`
// multiplier applied to the policy's base metric/voter effects. Policies not listed
// here are simple on/off (one level). Money/round drives the deficit mechanic.
export const POLICY_STAGES = {
  // ── Energy & environment ──
  renewableSubsidy: [
    { name:"Wallbox grants",          desc:"Subsidise home EV chargers — a modest first step.",                 cost:12, fiscal:-5,  effect:0.40 },
    { name:"+ Rooftop solar",         desc:"Add generous feed-in tariffs for household solar panels.",           cost:24, fiscal:-11, effect:0.75 },
    { name:"+ EV & heat-pump rebates",desc:"Throw in rebates for electric cars and home heat pumps.",            cost:34, fiscal:-18, effect:1.05 },
    { name:"+ Grid & storage overhaul",desc:"Rewire the nation with smart grids and grid-scale batteries.",      cost:48, fiscal:-27, effect:1.40 },
  ],
  evIncentives: [
    { name:"Charging network",        desc:"Roll out public fast-charging points nationwide.",                   cost:14, fiscal:-8,  effect:0.50 },
    { name:"+ Purchase rebates",      desc:"Add cash rebates for buying electric vehicles.",                     cost:26, fiscal:-16, effect:1.00 },
  ],
  homeInsulation: [
    { name:"Low-income retrofit",     desc:"Insulate the draughtiest homes of the poorest households.",          cost:12, fiscal:-7,  effect:0.50 },
    { name:"+ National retrofit",     desc:"A nationwide drive to insulate every ageing home.",                  cost:22, fiscal:-15, effect:1.00 },
  ],
  // ── Taxation (revenue) ──
  carbonTax: [
    { name:"Token levy",              desc:"A symbolic price on carbon to test the political waters.",           cost:10, fiscal:8,   effect:0.40 },
    { name:"Moderate price",          desc:"A real carbon price that heavy industry starts to feel.",            cost:18, fiscal:16,  effect:0.75 },
    { name:"Steep price + dividend",  desc:"A steep, rising carbon price, rebated to households as a dividend.",  cost:28, fiscal:26,  effect:1.15 },
  ],
  wealthTax: [
    { name:"Top-1% levy",             desc:"A modest annual levy on the very richest.",                          cost:12, fiscal:10,  effect:0.45 },
    { name:"Broader wealth tax",      desc:"Tax large fortunes more comprehensively.",                           cost:20, fiscal:20,  effect:0.85 },
    { name:"Aggressive wealth tax",   desc:"A steep annual tax on great accumulated wealth.",                    cost:28, fiscal:32,  effect:1.20 },
  ],
  progressiveTaxReform: [
    { name:"Tweak the top band",      desc:"Nudge up the highest income-tax bracket.",                           cost:12, fiscal:12,  effect:0.45 },
    { name:"Steeper brackets",        desc:"Add steeper brackets for the highest earners.",                      cost:20, fiscal:24,  effect:0.85 },
    { name:"Sweeping reform",         desc:"A thoroughly progressive overhaul of income tax.",                   cost:28, fiscal:38,  effect:1.20 },
  ],
  vatReduction: [
    { name:"Scrap VAT on essentials", desc:"Zero-rate food, medicine, and energy bills.",                        cost:14, fiscal:-12, effect:0.50 },
    { name:"+ Cut the standard rate", desc:"Lower the headline VAT rate across the board.",                      cost:24, fiscal:-24, effect:0.90 },
  ],
  // ── Economy & labour ──
  universalBasicIncome: [
    { name:"Regional pilot",          desc:"A small unconditional-income trial in a few regions.",               cost:20, fiscal:-12, effect:0.35 },
    { name:"Partial income floor",    desc:"A modest monthly payment to every adult.",                           cost:38, fiscal:-30, effect:0.70 },
    { name:"Full basic income",       desc:"A liveable, unconditional income for every citizen.",                cost:55, fiscal:-55, effect:1.10 },
  ],
  minimumWageIncrease: [
    { name:"Cautious bump",           desc:"A careful rise just above inflation.",                               cost:10, fiscal:-1,  effect:0.40 },
    { name:"Solid raise",             desc:"A meaningful raise toward a decent standard of living.",             cost:18, fiscal:-2,  effect:0.80 },
    { name:"Bold hike",               desc:"A bold hike that reshapes the entire low-wage economy.",             cost:26, fiscal:-3,  effect:1.15 },
  ],
  livingWage: [
    { name:"Public sector first",     desc:"Pay every public employee a real living wage.",                      cost:12, fiscal:-3,  effect:0.50 },
    { name:"Economy-wide mandate",    desc:"Mandate a living wage across the whole economy.",                    cost:22, fiscal:-5,  effect:1.05 },
  ],
  // ── Welfare & housing ──
  childBenefits: [
    { name:"Targeted top-up",         desc:"Extra support for the lowest-income families.",                      cost:12, fiscal:-8,  effect:0.45 },
    { name:"Universal allowance",     desc:"A monthly allowance for every child.",                               cost:24, fiscal:-18, effect:0.85 },
    { name:"Generous family package", desc:"Generous payments plus free childcare for all.",                     cost:34, fiscal:-30, effect:1.20 },
  ],
  pensionReform: [
    { name:"Protect the floor",       desc:"Guarantee a dignified minimum pension.",                             cost:18, fiscal:-12, effect:0.45 },
    { name:"Triple-lock pensions",    desc:"Index pensions generously to wages and prices.",                     cost:32, fiscal:-26, effect:0.90 },
  ],
  housingBenefitExpansion: [
    { name:"Raise the cap",           desc:"Lift the rent-support ceiling for tenants.",                         cost:14, fiscal:-10, effect:0.50 },
    { name:"+ Broaden eligibility",   desc:"Extend rent support to many more households.",                       cost:26, fiscal:-20, effect:1.00 },
  ],
  affordableHousing: [
    { name:"Pilot developments",      desc:"Fund a handful of flagship affordable estates.",                     cost:18, fiscal:-10, effect:0.40 },
    { name:"National programme",      desc:"A sustained nationwide affordable-building drive.",                  cost:34, fiscal:-22, effect:0.80 },
    { name:"Mass construction",       desc:"Hundreds of thousands of new homes a year.",                         cost:50, fiscal:-36, effect:1.25 },
  ],
  // ── Healthcare ──
  universalHealthcare: [
    { name:"Safety-net cover",        desc:"Public cover for the poorest citizens and all children.",            cost:24, fiscal:-14, effect:0.40 },
    { name:"Broad public option",     desc:"A public insurer competing alongside private cover.",                cost:40, fiscal:-30, effect:0.75 },
    { name:"Single-payer for all",    desc:"Comprehensive cradle-to-grave care for everyone.",                   cost:55, fiscal:-50, effect:1.15 },
  ],
  hospitalFunding: [
    { name:"Stabilise budgets",       desc:"Plug the worst gaps and stop the bleeding.",                         cost:16, fiscal:-12, effect:0.45 },
    { name:"+ Expand capacity",       desc:"More beds, staff, and equipment across the system.",                 cost:30, fiscal:-24, effect:0.90 },
  ],
  // ── Education ──
  freeUniversityTuition: [
    { name:"Means-tested grants",     desc:"Free tuition for low-income students.",                              cost:18, fiscal:-9,  effect:0.45 },
    { name:"Tuition caps",            desc:"Cap and subsidise fees at every public university.",                 cost:30, fiscal:-18, effect:0.80 },
    { name:"Universal free tuition",  desc:"Abolish tuition fees entirely.",                                     cost:42, fiscal:-28, effect:1.10 },
  ],
  schoolFundingIncrease: [
    { name:"Target deprived areas",   desc:"Pour extra funds where they're needed most.",                        cost:16, fiscal:-12, effect:0.45 },
    { name:"+ Across-the-board raise",desc:"Lift per-pupil funding in every school.",                            cost:30, fiscal:-24, effect:0.90 },
  ],
  // ── Transport ──
  highSpeedRail: [
    { name:"One flagship line",       desc:"Connect the two biggest cities with fast rail.",                     cost:24, fiscal:-12, effect:0.40 },
    { name:"Core network",            desc:"Link all major cities by high-speed rail.",                          cost:42, fiscal:-24, effect:0.80 },
    { name:"Nationwide network",      desc:"Fast rail reaching every region.",                                   cost:60, fiscal:-38, effect:1.30 },
  ],
  freePublicTransport: [
    { name:"Free for young & old",    desc:"Free travel for students, youth, and pensioners.",                   cost:16, fiscal:-10, effect:0.45 },
    { name:"Off-peak free travel",    desc:"Abolish fares outside the rush hour.",                               cost:26, fiscal:-20, effect:0.80 },
    { name:"Fully free transit",      desc:"Scrap all fares on buses, trams, and metro.",                        cost:36, fiscal:-32, effect:1.15 },
  ],
  // ── Justice & foreign ──
  militaryModernisation: [
    { name:"Maintenance",             desc:"Keep existing forces equipped and ready.",                           cost:18, fiscal:-12, effect:0.40 },
    { name:"Modernisation",           desc:"Procure new equipment and capabilities.",                            cost:34, fiscal:-26, effect:0.80 },
    { name:"Full rearmament",         desc:"A sweeping military build-up.",                                       cost:50, fiscal:-44, effect:1.30 },
  ],
  internationalAid: [
    { name:"0.3% of GDP",             desc:"A modest overseas-aid commitment.",                                  cost:10, fiscal:-8,  effect:0.50 },
    { name:"0.7% of GDP",             desc:"Meet the international aid target in full.",                          cost:20, fiscal:-16, effect:1.00 },
  ],
};

// ── Tunable constants ───────────────────────────────────────────────────────────
export const SIM = {
  TERM_LENGTH: 16,             // rounds per electoral term
  ELECTION_THRESHOLD: 50,      // min approval to be re-elected
  POP_SIZE: 10000,             // simulated individual voters

  CAPITAL_BASE_INCOME: 55,     // political capital granted each round
  CAPITAL_BELOVED_FACTOR: 1.4, // extra capital per approval point above 50
  APPOINT_COST: 35,            // cost to appoint a minister
  LEVEL_CHANGE_COST: 8,        // capital to adjust an enacted policy's level

  TREASURY_START: 160,         // starting cash reserve (money, not capital)
  BASE_REVENUE: 62,            // baseline tax take per round
  GDP_TAX_FACTOR: 0.9,         // extra revenue per point of GDP above 100
  FISCAL_PER_DEBT: 0.7,        // money/round derived from a policy's nationalDebt effect (non-staged)
  DEBT_FROM_TREASURY: 0.03,    // how strongly a treasury surplus/deficit moves the debt indicator

  SPEECH_BASE_GAIN: 8,         // base capital from a speech
  SPEECH_APPROVAL_FACTOR: 0.30,// + capital per approval point
  SPEECH_ALIGN_BONUS: 14,      // + capital when the message lands in the mainstream
  SPEECH_MOOD: 4,              // national mood bump from a well-pitched speech

  K_IDEO: 0.14,                // approval penalty per unit of compass distance
  VOTER_INDICATOR_SCALE: 0.5,  // weight multiplier for indicator-driven approval
  POLICY_SENTIMENT_SCALE: 0.35,// weight of a policy's direct voterEffects while enacted
  GOV_INERTIA: 0.30,           // how fast the government's compass position eases
  MOOD_DECAY: 0.5,             // fraction of national mood retained each round

  LOYALTY_BASE: 72,            // a fresh minister's loyalty
  LOYALTY_RESIGN: 28,          // resign below this
  LOYALTY_DRIFT: 0.18,         // how fast loyalty eases toward its pressure each round
  SCANDAL_CHANCE: 0.25,        // per-round chance of a minister scandal when corruption is high

  EVENT_RANDOM_CHANCE: 0.55,   // chance per round of an extra random event
  DRIFT: 1.5,                  // ± random noise applied to indicator targets each round
};
