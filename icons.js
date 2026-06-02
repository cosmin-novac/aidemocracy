// icons.js — Inline SVG icon library + a per-policy icon mapping.
// Icons are simple 24×24 line glyphs that inherit `currentColor`, so they can be
// tinted by category. Every policy is assigned a themed icon (iconFor); icons are
// shared only between policies that are genuinely the same concept.

const ICONS = {
  // ── Money & economy ──
  coins:      `<ellipse cx="12" cy="7" rx="7" ry="3"/><path d="M5 7v10c0 1.7 3.1 3 7 3s7-1.3 7-3V7"/><path d="M5 12c0 1.7 3.1 3 7 3s7-1.3 7-3"/>`,
  dollar:     `<line x1="12" y1="3" x2="12" y2="21"/><path d="M16 7a4 3 0 0 0-4-2c-3 0-4 1.6-4 3s1.5 2.6 4 2.6 4 1.4 4 3-1.4 3-4 3a4 3 0 0 1-4-2"/>`,
  percent:    `<line x1="19" y1="5" x2="5" y2="19"/><circle cx="7.5" cy="7.5" r="2"/><circle cx="16.5" cy="16.5" r="2"/>`,
  trendUp:    `<polyline points="3 16 9 10 13 14 21 6"/><polyline points="16 6 21 6 21 11"/>`,
  trendDown:  `<polyline points="3 8 9 14 13 10 21 18"/><polyline points="16 18 21 18 21 13"/>`,
  scales:     `<line x1="12" y1="4" x2="12" y2="20"/><line x1="6" y1="7" x2="18" y2="7"/><path d="M6 7l-3 5a3 3 0 0 0 6 0z"/><path d="M18 7l-3 5a3 3 0 0 0 6 0z"/><line x1="8" y1="20" x2="16" y2="20"/>`,
  store:      `<path d="M4 9l1.2-4h13.6L20 9"/><path d="M4 9v10h16V9"/><path d="M4 9a2 2 0 0 0 4 0 2 2 0 0 0 4 0 2 2 0 0 0 4 0 2 2 0 0 0 4 0"/><rect x="9.5" y="13" width="5" height="6"/>`,
  ship:       `<path d="M3 14h18l-2.2 5H5.2z"/><path d="M5 14V8h7l4 6"/><line x1="9" y1="8" x2="9" y2="4"/>`,
  bank:       `<path d="M3 9l9-5 9 5z"/><line x1="6" y1="9" x2="6" y2="18"/><line x1="10" y1="9" x2="10" y2="18"/><line x1="14" y1="9" x2="14" y2="18"/><line x1="18" y1="9" x2="18" y2="18"/><line x1="3" y1="20" x2="21" y2="20"/>`,
  wallet:     `<rect x="3" y="6" width="18" height="13" rx="2"/><path d="M16 12.5h5V9h-5a1.75 1.75 0 0 0 0 3.5z"/>`,
  swap:       `<polyline points="7 4 3 8 7 12"/><line x1="3" y1="8" x2="15" y2="8"/><polyline points="17 12 21 16 17 20"/><line x1="21" y1="16" x2="9" y2="16"/>`,
  searchGlass:`<circle cx="10" cy="10" r="6"/><line x1="14.5" y1="14.5" x2="21" y2="21"/>`,
  briefcase:  `<rect x="3" y="7" width="18" height="12" rx="2"/><path d="M8 7V5.5A1.5 1.5 0 0 1 9.5 4h5A1.5 1.5 0 0 1 16 5.5V7"/><line x1="3" y1="13" x2="21" y2="13"/>`,
  factory:    `<path d="M3 21V11l5 3V11l5 3V8l6-3v16z"/><path d="M7 21v-3M12 21v-3M17 21v-3"/>`,
  hardHat:    `<path d="M4 16a8 8 0 0 1 16 0z"/><path d="M9 9a3 3 0 0 1 6 0v3"/><line x1="2" y1="16" x2="22" y2="16"/>`,
  clock:      `<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>`,
  rocket:     `<path d="M14 4c4 0 6 2 6 6 0 5-6 9-10 11l-3-3C9 14 8 8 14 4z"/><circle cx="14" cy="10" r="1.6"/><path d="M5 19c.7-2 2-3 2-3"/>`,
  // ── People & care ──
  peopleGroup:`<circle cx="8" cy="8" r="2.5"/><circle cx="16" cy="8" r="2.5"/><path d="M3 19v-2a4 4 0 0 1 8 0v2M13 19v-2a4 4 0 0 1 8 0v2"/>`,
  family:     `<circle cx="8" cy="7" r="2"/><circle cx="16" cy="7" r="2"/><path d="M5 19v-4a3 3 0 0 1 6 0v4M13 19v-4a3 3 0 0 1 6 0v4"/>`,
  person:     `<circle cx="12" cy="7" r="3"/><path d="M6 21v-2a6 6 0 0 1 12 0v2"/>`,
  handsHeart: `<path d="M12 9.5a3 3 0 0 0-5 2.2c0 2.3 5 5.3 5 5.3s5-3 5-5.3a3 3 0 0 0-5-2.2z"/><path d="M5 14l2.5 6M19 14l-2.5 6"/>`,
  umbrella:   `<path d="M12 4a8 8 0 0 1 8 8H4a8 8 0 0 1 8-8z"/><line x1="12" y1="12" x2="12" y2="19"/><path d="M12 19a2 2 0 0 0 4 0"/>`,
  foodBowl:   `<path d="M3 12h18a9 9 0 0 1-18 0z"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M9 8c0-2 1-3 1-3M13 8c0-2 1-3 1-3"/>`,
  dove:       `<path d="M3 14c4 .3 6-2 7-5 1.6 3.6 4.5 4.8 9 3-1.7 4-5 6.5-9 6.5-3 0-6-1.5-7-4.5z"/><path d="M10 9l3-4"/>`,
  // ── Health ──
  heart:        `<path d="M12 20S4 15 4 9.5A4 4 0 0 1 12 7a4 4 0 0 1 8 2.5C20 15 12 20 12 20z"/>`,
  medicalCross: `<rect x="4" y="4" width="16" height="16" rx="3"/><path d="M12 8v8M8 12h8"/>`,
  brain:        `<path d="M10 5a3 3 0 0 0-3 3 3 3 0 0 0-1 5 3 3 0 0 0 4 3M10 5a2.5 2.5 0 0 1 4 0M14 5a3 3 0 0 1 3 3 3 3 0 0 1 1 5 3 3 0 0 1-4 3"/><path d="M12 5v14"/>`,
  pill:         `<rect x="3.5" y="9" width="17" height="6" rx="3"/><line x1="12" y1="9" x2="12" y2="15"/>`,
  hospital:     `<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M12 7v6M9 10h6"/><path d="M9 21v-3h6v3"/>`,
  stethoscope:  `<path d="M5 4v5a4 4 0 0 0 8 0V4"/><path d="M9 13v1a4 4 0 0 0 8 0v-1"/><circle cx="18" cy="11" r="2"/>`,
  syringe:      `<path d="M15 4l5 5M17 6l-9 9-4 1 1-4 9-9"/><line x1="9" y1="11" x2="13" y2="15"/>`,
  wheelchair:   `<circle cx="11" cy="17" r="4.5"/><circle cx="9" cy="5" r="1.6"/><path d="M9 7v5h4l2.5 4.5"/>`,
  // ── Knowledge & tech ──
  book:    `<path d="M4 4h7a2 2 0 0 1 2 2v13a2 2 0 0 0-2-2H4z"/><path d="M20 4h-7a2 2 0 0 0-2 2v13a2 2 0 0 1 2-2h7z"/>`,
  gradCap: `<path d="M2 9l10-4 10 4-10 4z"/><path d="M6 11v4c0 1.4 12 1.4 12 0v-4"/><line x1="22" y1="9" x2="22" y2="14"/>`,
  laptop:  `<rect x="4" y="5" width="16" height="11" rx="1.5"/><line x1="2" y1="20" x2="22" y2="20"/>`,
  atom:    `<circle cx="12" cy="12" r="1.8"/><ellipse cx="12" cy="12" rx="10" ry="4"/><ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(60 12 12)"/><ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(120 12 12)"/>`,
  wifi:    `<path d="M5 10a10 10 0 0 1 14 0M8 13a6 6 0 0 1 8 0"/><circle cx="12" cy="17" r="1"/>`,
  code:    `<polyline points="8 7 3 12 8 17"/><polyline points="16 7 21 12 16 17"/>`,
  chip:    `<rect x="7" y="7" width="10" height="10" rx="1"/><path d="M10 3v2M14 3v2M10 19v2M14 19v2M3 10h2M3 14h2M19 10h2M19 14h2"/>`,
  idCard:  `<rect x="3" y="6" width="18" height="12" rx="2"/><circle cx="8" cy="11" r="2"/><path d="M5 16c0-2 6-2 6 0"/><line x1="14" y1="10" x2="18" y2="10"/><line x1="14" y1="13.5" x2="18" y2="13.5"/>`,
  network: `<circle cx="6" cy="6" r="2"/><circle cx="18" cy="6" r="2"/><circle cx="12" cy="18" r="2"/><path d="M7.2 7.5l4 9M16.8 7.5l-4 9"/>`,
  // ── Home ──
  house:    `<path d="M4 11l8-7 8 7"/><path d="M6 10v9h12v-9"/><rect x="10.5" y="14" width="3" height="5"/>`,
  building: `<rect x="5" y="3" width="14" height="18"/><path d="M9 7h2M13 7h2M9 11h2M13 11h2M9 15h2M13 15h2"/>`,
  key:      `<circle cx="8" cy="12" r="4"/><path d="M11.5 12H21M18 12v3M21 12v2.5"/>`,
  // ── Transport ──
  bus:        `<rect x="4" y="5" width="16" height="12" rx="2"/><line x1="4" y1="12" x2="20" y2="12"/><circle cx="8" cy="19" r="1.5"/><circle cx="16" cy="19" r="1.5"/>`,
  train:      `<rect x="6" y="4" width="12" height="13" rx="3"/><line x1="6" y1="11" x2="18" y2="11"/><circle cx="9" cy="14" r="1"/><circle cx="15" cy="14" r="1"/><path d="M8 20l-2 2M16 20l2 2"/>`,
  bicycle:    `<circle cx="6" cy="17" r="3"/><circle cx="18" cy="17" r="3"/><path d="M6 17l4-7h5l-2 7M10 10l-1-3h3"/>`,
  car:        `<path d="M3 14l2-5a2 2 0 0 1 2-1.3h10A2 2 0 0 1 19 9l2 5"/><path d="M3 14h18v3H3z"/><circle cx="7" cy="18" r="1.5"/><circle cx="17" cy="18" r="1.5"/>`,
  road:       `<path d="M8 3L4 21M16 3l4 18"/><line x1="12" y1="4" x2="12" y2="8"/><line x1="12" y1="11" x2="12" y2="14"/><line x1="12" y1="17" x2="12" y2="21"/>`,
  // ── Energy & environment ──
  leaf:        `<path d="M5 19c0-8 6-14 14-14 0 8-6 14-14 14z"/><path d="M5 19C9 15 13 11 17 9"/>`,
  tree:        `<path d="M12 3l5 7h-3l4 6H6l4-6H7z"/><line x1="12" y1="16" x2="12" y2="21"/>`,
  recycle:     `<path d="M7.5 8a6 6 0 0 1 9.5-1"/><polyline points="17 3 17 7.5 12.5 7.5"/><path d="M16.5 16a6 6 0 0 1-9.5 1"/><polyline points="7 21 7 16.5 11.5 16.5"/>`,
  waterDrop:   `<path d="M12 3c4 5 6 8 6 11a6 6 0 0 1-12 0c0-3 2-6 6-11z"/>`,
  windTurbine: `<line x1="12" y1="12" x2="12" y2="21"/><path d="M12 12V5M12 12l6 3.5M12 12l-6 3.5"/><circle cx="12" cy="12" r="1.2"/>`,
  sun:         `<circle cx="12" cy="12" r="4"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2"/>`,
  bolt:        `<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>`,
  battery:     `<rect x="3" y="8" width="16" height="8" rx="2"/><line x1="21" y1="11" x2="21" y2="13"/><line x1="7" y1="12" x2="11" y2="12"/>`,
  flame:       `<path d="M12 3c1.2 4 5 5 5 9a5 5 0 0 1-10 0c0-2 1-3 2-4 1 2 2 1 3-5z"/>`,
  plug:        `<path d="M9 3v5M15 3v5M6 8h12v3a6 6 0 0 1-12 0z"/><line x1="12" y1="17" x2="12" y2="21"/>`,
  // ── State, world & rights ──
  plane:    `<path d="M2 13l20-7-7.5 16-2.5-6.5z"/>`,
  globe:    `<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3.5 3 14.5 0 18M12 3c-3 3.5-3 14.5 0 18"/>`,
  shield:   `<path d="M12 3l8 3v6c0 5-4 8-8 10-4-2-8-5-8-10V6z"/>`,
  passport: `<rect x="5" y="3" width="14" height="18" rx="2"/><circle cx="12" cy="10" r="3"/><line x1="9" y1="16" x2="15" y2="16"/>`,
  fence:    `<path d="M5 9l2-3 2 3M15 9l2-3 2 3"/><line x1="5" y1="9" x2="5" y2="20"/><line x1="9" y1="9" x2="9" y2="20"/><line x1="15" y1="9" x2="15" y2="20"/><line x1="19" y1="9" x2="19" y2="20"/><line x1="3" y1="13" x2="21" y2="13"/><line x1="3" y1="17" x2="21" y2="17"/>`,
  gavel:    `<path d="M14 4l6 6-3 3-6-6z"/><line x1="9.5" y1="9.5" x2="15" y2="15"/><line x1="4" y1="14" x2="10" y2="20"/><line x1="4" y1="20" x2="11" y2="20"/>`,
  lock:     `<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>`,
  eye:      `<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/>`,
  ballotBox:`<path d="M4 9l8-3 8 3v10H4z"/><rect x="9" y="3.5" width="6" height="4.5"/><line x1="11" y1="5.5" x2="13" y2="5.5"/>`,
  ballotCheck:`<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 9l2 2 4-4"/><line x1="8" y1="15" x2="16" y2="15"/>`,
  megaphone:`<path d="M4 10v4l11 4V6z"/><path d="M15 8.5a3 3 0 0 1 0 7"/><line x1="6" y1="14.5" x2="7" y2="20"/>`,
  broadcast:`<circle cx="12" cy="12" r="2"/><path d="M8 8a6 6 0 0 0 0 8M16 8a6 6 0 0 1 0 8M5 5a10 10 0 0 0 0 14M19 5a10 10 0 0 1 0 14"/>`,
  // ── UI / actions ──
  plus:     `<circle cx="12" cy="12" r="9"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>`,
  columns:  `<path d="M3 21h18M4 9l8-5 8 5"/><line x1="6" y1="9" x2="6" y2="21"/><line x1="10" y1="9" x2="10" y2="21"/><line x1="14" y1="9" x2="14" y2="21"/><line x1="18" y1="9" x2="18" y2="21"/>`,
  compass:  `<circle cx="12" cy="12" r="9"/><path d="M15.6 8.4l-2.1 5.1-5.1 2.1 2.1-5.1z"/>`,
  barChart: `<line x1="4" y1="20" x2="20" y2="20"/><rect x="6" y="11" width="3" height="8"/><rect x="11" y="6" width="3" height="13"/><rect x="16" y="14" width="3" height="5"/>`,
  refresh:  `<path d="M21 12a9 9 0 1 1-2.6-6.4"/><polyline points="21 4 21 9 16 9"/>`,
  // ── Events ──
  alert:    `<path d="M12 3l9.5 16.5H2.5z"/><line x1="12" y1="9.5" x2="12" y2="14.5"/><circle cx="12" cy="17.6" r="0.6" fill="currentColor" stroke="none"/>`,
  sparkles: `<path d="M12 3l1.8 4.2L18 9l-4.2 1.8L12 15l-1.8-4.2L6 9l4.2-1.8z"/><path d="M18.5 14.5l.9 2.1 2.1.9-2.1.9-.9 2.1-.9-2.1-2.1-.9 2.1-.9z"/>`,
};

// Each policy's icon (themed; shared only between same-concept policies).
const POLICY_ICONS = {
  // Economy
  corporateTaxCut:"trendDown", minimumWageIncrease:"dollar", universalBasicIncome:"handsHeart",
  smallBusinessGrants:"store", publicWorksProgram:"hardHat", antitrustEnforcement:"scales",
  freeTradeAgreement:"ship", economicStimulus:"trendUp", progressiveTaxReform:"percent", sovereignWealthFund:"bank",
  // Taxation
  carbonTax:"factory", wealthTax:"coins", vatReduction:"wallet", taxEvasionCrackdown:"searchGlass",
  firstHomeTaxCredit:"house", rdTaxCredits:"atom", financialTransactionTax:"swap", internationalTaxCooperation:"globe",
  // Labor
  paidParentalLeave:"family", fourDayWorkWeek:"clock", workersRights:"peopleGroup", apprenticeshipProgram:"briefcase",
  jobRetraining:"gradCap", remoteWorkSupport:"laptop", livingWage:"dollar", workplaceSafety:"hardHat",
  // Welfare
  housingBenefitExpansion:"umbrella", childBenefits:"person", disabilitySupport:"wheelchair", foodBankFunding:"foodBowl",
  pensionReform:"handsHeart", socialCareReform:"heart", welfareToWork:"briefcase", basicServicesGuarantee:"plug",
  // Healthcare
  universalHealthcare:"medicalCross", mentalHealthInitiative:"brain", preventiveCare:"stethoscope", hospitalFunding:"hospital",
  drugPricingReform:"pill", telehealthExpansion:"wifi", publicHealthCampaign:"megaphone", medicalResearchFunding:"syringe",
  // Education
  freeUniversityTuition:"gradCap", schoolFundingIncrease:"book", teacherPayRise:"dollar", digitalLearning:"laptop",
  earlyChildhoodEd:"person", stemInvestment:"atom", adultLiteracy:"book", schoolMealProgram:"foodBowl",
  // Housing
  affordableHousing:"building", rentControl:"house", zoningReform:"building", homelessnessReduction:"house",
  socialHousing:"building", firstHomeGrant:"key", emptyPropertyTax:"house", renovationSubsidies:"hardHat",
  // Transport
  highSpeedRail:"train", freePublicTransport:"bus", evIncentives:"car", cyclingInfrastructure:"bicycle",
  roadExpansion:"road", smartTraffic:"chip",
  // Energy
  renewableSubsidy:"sun", nuclearPower:"atom", smartGrid:"network", homeInsulation:"house",
  offshoreWind:"windTurbine", energyPoverty:"bolt", fossilFuelPhaseout:"flame", energyStorage:"battery",
  // Environment
  rewilding:"tree", plasticBan:"recycle", oceanCleanup:"waterDrop", urbanGreenSpaces:"leaf",
  emissionsTrading:"factory", environmentalProtection:"shield", reforestation:"tree", waterConservation:"waterDrop",
  // Immigration
  pointsBasedImmigration:"idCard", refugeeResettlement:"handsHeart", skilledWorkerVisa:"passport",
  borderSecurity:"fence", integrationSupport:"peopleGroup", immigrationAmnesty:"dove",
  // Justice
  policeReform:"shield", prisonReform:"building", drugDecrim:"pill", communityPolicing:"peopleGroup",
  antiCorruption:"searchGlass", restorativeJustice:"scales",
  // Civil Liberties
  privacyProtection:"lock", votingRights:"ballotCheck", lgbtqRights:"heart", freedomOfInfo:"eye",
  antiDiscrimination:"scales", campaignFinanceReform:"coins",
  // Technology
  internetForAll:"wifi", aiRegulation:"chip", openSourceGov:"code", cybersecurity:"shield",
  techStartupFund:"rocket", digitalIDSystem:"idCard",
  // Foreign Policy
  internationalAid:"handsHeart", militaryModernisation:"shield", tradeDiversification:"ship",
  climateAccord:"globe", peacekeeping:"dove", diplomaticExpansion:"plane",
  // Civic
  localGovGrants:"building", citizenAssemblies:"peopleGroup", participatoryBudgeting:"ballotBox",
  volunteerIncentives:"handsHeart", publicBroadcasting:"broadcast",
};

const CATEGORY_ICONS = {
  "Economy":"coins", "Taxation":"percent", "Labor":"briefcase", "Welfare":"handsHeart",
  "Healthcare":"medicalCross", "Education":"book", "Housing":"house", "Transport":"bus",
  "Energy":"bolt", "Environment":"leaf", "Immigration":"passport", "Justice":"scales",
  "Civil Liberties":"ballotCheck", "Technology":"chip", "Foreign Policy":"globe", "Civic":"peopleGroup",
};

/** Raw inner SVG markup for a named glyph (or empty string). */
export function iconBody(name) { return ICONS[name] || ""; }

/** Wrap a named glyph in an <svg> element. `stroke` defaults to currentColor. */
export function iconSvg(name, { size = 20, cls = "", stroke = "currentColor", sw = 1.9 } = {}) {
  const body = ICONS[name] || ICONS.coins;
  return `<svg xmlns="http://www.w3.org/2000/svg" class="${cls}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none"
    stroke="${stroke}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round"
    aria-hidden="true">${body}</svg>`;
}

/** A data-URI version (for SVG <image>/CSS backgrounds, where currentColor won't resolve). */
export function iconDataUri(name, { size = 24, stroke = "#ffffff", sw = 2.1 } = {}) {
  return "data:image/svg+xml," + encodeURIComponent(iconSvg(name, { size, stroke, sw }));
}

/** The icon name for a policy (falls back to its category, then coins). */
export function iconNameFor(policy) {
  return POLICY_ICONS[policy.id] || CATEGORY_ICONS[policy.category] || "coins";
}

/** Full <svg> markup for a policy. */
export function iconFor(policy, opts) {
  return iconSvg(iconNameFor(policy), opts);
}
