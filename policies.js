// policies.js — Curated policy catalog for AI Democracy

// ── Metric definitions ────────────────────────────────────────────────────────
export const METRICS = [
  // Economy
  { id: "gdpGrowth",         name: "GDP Growth",           category: "Economy",       description: "Rate of economic growth and output.",                    value: 100, lowerIsBetter: false },
  { id: "unemployment",      name: "Unemployment",         category: "Economy",       description: "Share of the workforce without jobs.",                   value: 100, lowerIsBetter: true  },
  { id: "inequality",        name: "Income Inequality",    category: "Economy",       description: "Gap between the highest and lowest earners.",            value: 100, lowerIsBetter: true  },
  { id: "nationalDebt",      name: "National Debt",        category: "Economy",       description: "Government debt as a share of GDP.",                     value: 100, lowerIsBetter: true  },
  // Environment
  { id: "carbonEmissions",   name: "Carbon Emissions",     category: "Environment",   description: "Greenhouse gas emissions driving climate change.",        value: 100, lowerIsBetter: true  },
  { id: "renewableEnergy",   name: "Renewable Energy",     category: "Environment",   description: "Share of energy from renewable sources.",                value: 100, lowerIsBetter: false },
  { id: "airQuality",        name: "Air Quality",          category: "Environment",   description: "Cleanliness of the air in cities and countryside.",       value: 100, lowerIsBetter: false },
  { id: "biodiversity",      name: "Biodiversity",         category: "Environment",   description: "Richness and health of ecosystems and wildlife.",         value: 100, lowerIsBetter: false },
  // Healthcare
  { id: "healthcareAccess",  name: "Healthcare Access",    category: "Healthcare",    description: "Ease of access to medical services for all citizens.",    value: 100, lowerIsBetter: false },
  { id: "publicHealth",      name: "Public Health",        category: "Healthcare",    description: "Overall health and wellbeing of the population.",         value: 100, lowerIsBetter: false },
  { id: "mentalHealth",      name: "Mental Health",        category: "Healthcare",    description: "Population mental health and wellbeing outcomes.",        value: 100, lowerIsBetter: false },
  // Education
  { id: "educationQuality",  name: "Education Quality",    category: "Education",     description: "Standard of public schooling and higher education.",      value: 100, lowerIsBetter: false },
  { id: "literacy",          name: "Literacy Rate",        category: "Education",     description: "Share of adults who can read and write proficiently.",    value: 100, lowerIsBetter: false },
  // Justice & Society
  { id: "crimeRate",         name: "Crime Rate",           category: "Justice",       description: "Level of criminal activity across the nation.",           value: 100, lowerIsBetter: true  },
  { id: "civilLiberties",    name: "Civil Liberties",      category: "Governance",    description: "Freedoms and rights guaranteed to citizens.",             value: 100, lowerIsBetter: false },
  { id: "corruption",        name: "Corruption Level",     category: "Governance",    description: "Extent of public-sector corruption and misuse of power.", value: 100, lowerIsBetter: true  },
  { id: "socialCohesion",    name: "Social Cohesion",      category: "Society",       description: "Unity, trust, and sense of community among citizens.",    value: 100, lowerIsBetter: false },
  // Housing & Infrastructure
  { id: "housingAfford",     name: "Housing Affordability",category: "Housing",       description: "How affordable housing is relative to wages.",            value: 100, lowerIsBetter: false },
  { id: "infrastructure",    name: "Infrastructure",       category: "Infrastructure",description: "Quality of roads, bridges, utilities, and public works.",  value: 100, lowerIsBetter: false },
  { id: "publicTransport",   name: "Public Transport",     category: "Infrastructure",description: "Quality and coverage of buses, trains, and transit.",     value: 100, lowerIsBetter: false },
  // Technology
  { id: "digitalInclusion",  name: "Digital Inclusion",    category: "Technology",    description: "Access to the internet and digital tools for all.",       value: 100, lowerIsBetter: false },
  { id: "innovation",        name: "Innovation Index",     category: "Technology",    description: "Level of technological and scientific progress.",         value: 100, lowerIsBetter: false },
];

// ── Voter group definitions ───────────────────────────────────────────────────
export const VOTER_GROUPS = [
  { id: "environmentalists", name: "Environmentalists",  description: "Citizens who prioritise environmental protection.",      approval: 50 },
  { id: "conservatives",     name: "Conservatives",      description: "Citizens with traditional and fiscal-conservative values.", approval: 50 },
  { id: "progressives",      name: "Progressives",       description: "Citizens with progressive social and economic values.",  approval: 50 },
  { id: "youth",             name: "Youth",              description: "Voters aged 18–35 with diverse concerns.",               approval: 50 },
  { id: "seniors",           name: "Seniors",            description: "Voters aged 65 + with specific needs and priorities.",   approval: 50 },
  { id: "businessCommunity", name: "Business Community", description: "Entrepreneurs and business owners.",                    approval: 50 },
  { id: "workers",           name: "Workers",            description: "Working-class employees and union members.",             approval: 50 },
  { id: "urbanResidents",    name: "Urban Residents",    description: "Citizens living in cities and metropolitan areas.",      approval: 50 },
  { id: "ruralResidents",    name: "Rural Residents",    description: "Citizens living in rural and regional communities.",     approval: 50 },
  { id: "minorities",        name: "Minority Communities", description: "Ethnic, cultural, and other minority groups.",        approval: 50 },
  { id: "healthcareWorkers", name: "Healthcare Workers", description: "Medical professionals and healthcare staff.",           approval: 50 },
  { id: "educators",         name: "Educators",          description: "Teachers, lecturers, and educational staff.",           approval: 50 },
  { id: "farmers",           name: "Farmers",            description: "Agricultural workers and rural landowners.",            approval: 50 },
  { id: "veterans",          name: "Veterans",           description: "Citizens with military service backgrounds.",           approval: 50 },
  { id: "parents",           name: "Parents",            description: "Citizens raising children or young families.",          approval: 50 },
];

// ── Helper ────────────────────────────────────────────────────────────────────
function p(id, name, category, description, cost, metricEffects, voterEffects) {
  return { id, name, category, description, cost, metricEffects, voterEffects };
}
// metricEffects: [{ id: metricId, change: number }, ...]
// voterEffects:  [{ id: voterId,  change: number }, ...]

// ── Policy catalog ────────────────────────────────────────────────────────────
export const POLICIES = [

  // ── Economy ──────────────────────────────────────────────────────────────
  p("corporateTaxCut", "Corporate Tax Cut", "Economy",
    "Lower the corporate tax rate to stimulate investment and GDP growth.",
    30,
    [{ id:"gdpGrowth", change:10 }, { id:"unemployment", change:-5 }, { id:"inequality", change:15 }, { id:"nationalDebt", change:5 }],
    [{ id:"businessCommunity", change:20 }, { id:"conservatives", change:15 }, { id:"workers", change:-10 }, { id:"progressives", change:-15 }]
  ),
  p("minimumWageIncrease", "Minimum Wage Increase", "Economy",
    "Raise the legal minimum wage to lift low-income workers.",
    20,
    [{ id:"unemployment", change:5 }, { id:"inequality", change:-10 }, { id:"gdpGrowth", change:-3 }],
    [{ id:"workers", change:20 }, { id:"progressives", change:15 }, { id:"businessCommunity", change:-15 }, { id:"conservatives", change:-5 }]
  ),
  p("universalBasicIncome", "Universal Basic Income", "Economy",
    "Provide every citizen with a regular unconditional cash payment.",
    50,
    [{ id:"inequality", change:-20 }, { id:"unemployment", change:-5 }, { id:"nationalDebt", change:20 }, { id:"gdpGrowth", change:5 }],
    [{ id:"progressives", change:20 }, { id:"workers", change:15 }, { id:"youth", change:10 }, { id:"businessCommunity", change:-15 }, { id:"conservatives", change:-20 }]
  ),
  p("smallBusinessGrants", "Small Business Grants", "Economy",
    "Direct grants to help small and medium enterprises grow.",
    25,
    [{ id:"unemployment", change:-10 }, { id:"gdpGrowth", change:8 }, { id:"innovation", change:5 }],
    [{ id:"businessCommunity", change:15 }, { id:"conservatives", change:10 }, { id:"workers", change:10 }]
  ),
  p("publicWorksProgram", "Public Works Program", "Economy",
    "Government-funded construction and infrastructure projects to create jobs.",
    35,
    [{ id:"unemployment", change:-15 }, { id:"infrastructure", change:10 }, { id:"nationalDebt", change:10 }],
    [{ id:"workers", change:20 }, { id:"urbanResidents", change:10 }, { id:"ruralResidents", change:10 }, { id:"progressives", change:10 }, { id:"businessCommunity", change:-5 }]
  ),
  p("antitrustEnforcement", "Antitrust Enforcement", "Economy",
    "Break up monopolies and enforce market competition laws.",
    20,
    [{ id:"inequality", change:-15 }, { id:"innovation", change:5 }, { id:"gdpGrowth", change:-5 }],
    [{ id:"progressives", change:15 }, { id:"workers", change:10 }, { id:"businessCommunity", change:-20 }, { id:"conservatives", change:-5 }]
  ),
  p("freeTradeAgreement", "Free Trade Agreement", "Economy",
    "Open new international trade routes and reduce tariffs.",
    15,
    [{ id:"gdpGrowth", change:15 }, { id:"unemployment", change:5 }, { id:"inequality", change:5 }],
    [{ id:"businessCommunity", change:20 }, { id:"conservatives", change:10 }, { id:"workers", change:-15 }, { id:"farmers", change:-10 }]
  ),
  p("economicStimulus", "Economic Stimulus Package", "Economy",
    "Inject government spending to jumpstart the economy in a downturn.",
    40,
    [{ id:"gdpGrowth", change:20 }, { id:"unemployment", change:-10 }, { id:"nationalDebt", change:25 }],
    [{ id:"workers", change:15 }, { id:"progressives", change:10 }, { id:"businessCommunity", change:10 }, { id:"conservatives", change:-15 }]
  ),
  p("progressiveTaxReform", "Progressive Tax Reform", "Economy",
    "Restructure income taxes so higher earners pay proportionally more.",
    25,
    [{ id:"inequality", change:-20 }, { id:"nationalDebt", change:-15 }, { id:"gdpGrowth", change:-5 }],
    [{ id:"progressives", change:20 }, { id:"workers", change:15 }, { id:"businessCommunity", change:-20 }, { id:"conservatives", change:-15 }]
  ),
  p("sovereignWealthFund", "Sovereign Wealth Fund", "Economy",
    "Invest national surplus revenues in a state-run investment fund.",
    30,
    [{ id:"nationalDebt", change:-10 }, { id:"gdpGrowth", change:5 }],
    [{ id:"conservatives", change:10 }, { id:"businessCommunity", change:10 }, { id:"progressives", change:5 }]
  ),

  // ── Taxation ──────────────────────────────────────────────────────────────
  p("carbonTax", "Carbon Tax", "Taxation",
    "Tax on carbon dioxide emissions to reduce pollution and raise revenue.",
    20,
    [{ id:"carbonEmissions", change:-15 }, { id:"gdpGrowth", change:-3 }, { id:"nationalDebt", change:-10 }],
    [{ id:"environmentalists", change:20 }, { id:"progressives", change:10 }, { id:"businessCommunity", change:-10 }, { id:"conservatives", change:-10 }, { id:"farmers", change:-5 }]
  ),
  p("wealthTax", "Wealth Tax", "Taxation",
    "Annual levy on high net-worth individuals' total assets.",
    20,
    [{ id:"inequality", change:-20 }, { id:"nationalDebt", change:-15 }, { id:"gdpGrowth", change:-5 }],
    [{ id:"progressives", change:25 }, { id:"workers", change:15 }, { id:"businessCommunity", change:-25 }, { id:"conservatives", change:-20 }]
  ),
  p("vatReduction", "VAT Reduction", "Taxation",
    "Lower the value-added tax to boost consumer spending.",
    25,
    [{ id:"gdpGrowth", change:10 }, { id:"nationalDebt", change:15 }],
    [{ id:"workers", change:15 }, { id:"conservatives", change:10 }, { id:"urbanResidents", change:10 }]
  ),
  p("taxEvasionCrackdown", "Tax Evasion Crackdown", "Taxation",
    "New enforcement powers and international cooperation to close tax gaps.",
    15,
    [{ id:"inequality", change:-10 }, { id:"nationalDebt", change:-20 }, { id:"corruption", change:-15 }],
    [{ id:"progressives", change:20 }, { id:"workers", change:15 }, { id:"businessCommunity", change:-15 }]
  ),
  p("firstHomeTaxCredit", "First Home Buyer Tax Credit", "Taxation",
    "Tax relief for citizens purchasing their first home.",
    20,
    [{ id:"housingAfford", change:10 }, { id:"nationalDebt", change:10 }],
    [{ id:"youth", change:15 }, { id:"parents", change:10 }, { id:"urbanResidents", change:10 }, { id:"ruralResidents", change:10 }]
  ),
  p("rdTaxCredits", "R&D Tax Credits", "Taxation",
    "Tax incentives for businesses that invest in research and development.",
    20,
    [{ id:"innovation", change:15 }, { id:"gdpGrowth", change:5 }, { id:"nationalDebt", change:5 }],
    [{ id:"businessCommunity", change:15 }, { id:"youth", change:10 }, { id:"progressives", change:5 }]
  ),
  p("financialTransactionTax", "Financial Transaction Tax", "Taxation",
    "Small levy on every financial trade to curb speculation and raise revenue.",
    15,
    [{ id:"inequality", change:-10 }, { id:"nationalDebt", change:-10 }, { id:"gdpGrowth", change:-3 }],
    [{ id:"progressives", change:15 }, { id:"businessCommunity", change:-20 }, { id:"conservatives", change:-10 }]
  ),
  p("internationalTaxCooperation", "International Tax Cooperation", "Taxation",
    "Join global agreements to set corporate minimum tax floors.",
    20,
    [{ id:"nationalDebt", change:-15 }, { id:"inequality", change:-10 }, { id:"corruption", change:-10 }],
    [{ id:"progressives", change:15 }, { id:"conservatives", change:5 }, { id:"businessCommunity", change:-5 }]
  ),

  // ── Labor ─────────────────────────────────────────────────────────────────
  p("paidParentalLeave", "Paid Parental Leave", "Labor",
    "Guarantee paid leave for all new parents regardless of employer.",
    25,
    [{ id:"socialCohesion", change:10 }, { id:"inequality", change:-5 }],
    [{ id:"workers", change:15 }, { id:"progressives", change:20 }, { id:"parents", change:25 }, { id:"businessCommunity", change:-10 }]
  ),
  p("fourDayWorkWeek", "Four-Day Work Week Pilot", "Labor",
    "Pilot a four-day working week with no reduction in pay.",
    20,
    [{ id:"socialCohesion", change:10 }, { id:"publicHealth", change:5 }, { id:"mentalHealth", change:10 }, { id:"gdpGrowth", change:-3 }],
    [{ id:"workers", change:20 }, { id:"youth", change:15 }, { id:"progressives", change:15 }, { id:"businessCommunity", change:-15 }]
  ),
  p("workersRights", "Workers' Rights Legislation", "Labor",
    "Strengthen collective bargaining, rights to organise, and safe conditions.",
    20,
    [{ id:"socialCohesion", change:10 }, { id:"inequality", change:-10 }, { id:"gdpGrowth", change:-3 }],
    [{ id:"workers", change:25 }, { id:"progressives", change:15 }, { id:"businessCommunity", change:-20 }, { id:"conservatives", change:-10 }]
  ),
  p("apprenticeshipProgram", "Apprenticeship Program", "Labor",
    "Subsidise employer apprenticeships to train young workers.",
    20,
    [{ id:"unemployment", change:-10 }, { id:"educationQuality", change:5 }],
    [{ id:"workers", change:15 }, { id:"youth", change:15 }, { id:"businessCommunity", change:10 }]
  ),
  p("jobRetraining", "Job Retraining Scheme", "Labor",
    "Fund retraining programs for workers displaced by automation or industry change.",
    25,
    [{ id:"unemployment", change:-15 }, { id:"educationQuality", change:5 }],
    [{ id:"workers", change:15 }, { id:"progressives", change:10 }, { id:"conservatives", change:5 }]
  ),
  p("remoteWorkSupport", "Remote Work Support", "Labor",
    "Invest in infrastructure and incentives to enable widespread remote working.",
    15,
    [{ id:"digitalInclusion", change:5 }, { id:"socialCohesion", change:5 }],
    [{ id:"youth", change:15 }, { id:"progressives", change:10 }, { id:"ruralResidents", change:10 }, { id:"urbanResidents", change:-5 }]
  ),
  p("livingWage", "Living Wage Legislation", "Labor",
    "Set wages by actual cost of living, above the statutory minimum.",
    20,
    [{ id:"inequality", change:-15 }, { id:"gdpGrowth", change:-3 }],
    [{ id:"workers", change:20 }, { id:"progressives", change:20 }, { id:"businessCommunity", change:-15 }]
  ),
  p("workplaceSafety", "Workplace Safety Reform", "Labor",
    "Update and enforce rigorous workplace health and safety regulations.",
    15,
    [{ id:"publicHealth", change:5 }, { id:"inequality", change:-5 }],
    [{ id:"workers", change:15 }, { id:"progressives", change:10 }, { id:"businessCommunity", change:-5 }]
  ),

  // ── Welfare ───────────────────────────────────────────────────────────────
  p("housingBenefitExpansion", "Housing Benefit Expansion", "Welfare",
    "Increase government rent support for low-income households.",
    30,
    [{ id:"housingAfford", change:15 }, { id:"inequality", change:-10 }, { id:"nationalDebt", change:15 }],
    [{ id:"workers", change:15 }, { id:"progressives", change:20 }, { id:"seniors", change:10 }, { id:"parents", change:10 }, { id:"conservatives", change:-10 }]
  ),
  p("childBenefits", "Child Benefit Reform", "Welfare",
    "Expand universal child benefits to support families with young children.",
    25,
    [{ id:"socialCohesion", change:10 }, { id:"inequality", change:-15 }, { id:"nationalDebt", change:15 }],
    [{ id:"parents", change:25 }, { id:"progressives", change:15 }, { id:"workers", change:10 }, { id:"conservatives", change:-5 }]
  ),
  p("disabilitySupport", "Enhanced Disability Support", "Welfare",
    "Improve financial and care support for citizens with disabilities.",
    20,
    [{ id:"socialCohesion", change:10 }, { id:"inequality", change:-10 }, { id:"nationalDebt", change:10 }],
    [{ id:"progressives", change:20 }, { id:"workers", change:10 }, { id:"minorities", change:10 }, { id:"conservatives", change:-5 }]
  ),
  p("foodBankFunding", "Food Security Program", "Welfare",
    "Fund food banks and direct nutrition support for families in need.",
    15,
    [{ id:"socialCohesion", change:5 }, { id:"inequality", change:-10 }, { id:"publicHealth", change:5 }],
    [{ id:"progressives", change:15 }, { id:"workers", change:10 }, { id:"minorities", change:10 }]
  ),
  p("pensionReform", "Pension Reform", "Welfare",
    "Improve state pension adequacy and sustainability for retirees.",
    30,
    [{ id:"socialCohesion", change:10 }, { id:"nationalDebt", change:20 }],
    [{ id:"seniors", change:30 }, { id:"conservatives", change:10 }, { id:"progressives", change:10 }, { id:"youth", change:-5 }]
  ),
  p("socialCareReform", "Social Care Reform", "Welfare",
    "Overhaul care services for the elderly and vulnerable.",
    25,
    [{ id:"publicHealth", change:10 }, { id:"socialCohesion", change:10 }, { id:"nationalDebt", change:15 }],
    [{ id:"seniors", change:25 }, { id:"healthcareWorkers", change:15 }, { id:"progressives", change:15 }]
  ),
  p("welfareToWork", "Welfare-to-Work Program", "Welfare",
    "Targeted support to help welfare recipients find and keep employment.",
    20,
    [{ id:"unemployment", change:-10 }, { id:"socialCohesion", change:5 }],
    [{ id:"conservatives", change:20 }, { id:"workers", change:5 }, { id:"progressives", change:-5 }]
  ),
  p("basicServicesGuarantee", "Basic Services Guarantee", "Welfare",
    "Guarantee minimum standards of water, electricity, and internet for all.",
    35,
    [{ id:"inequality", change:-15 }, { id:"socialCohesion", change:15 }, { id:"nationalDebt", change:20 }],
    [{ id:"progressives", change:20 }, { id:"workers", change:15 }, { id:"minorities", change:15 }, { id:"conservatives", change:-15 }]
  ),

  // ── Healthcare ────────────────────────────────────────────────────────────
  p("universalHealthcare", "Universal Healthcare", "Healthcare",
    "Provide comprehensive healthcare to every citizen through a public system.",
    50,
    [{ id:"healthcareAccess", change:25 }, { id:"publicHealth", change:15 }, { id:"nationalDebt", change:25 }],
    [{ id:"progressives", change:25 }, { id:"workers", change:20 }, { id:"seniors", change:20 }, { id:"healthcareWorkers", change:10 }, { id:"conservatives", change:-20 }, { id:"businessCommunity", change:-15 }]
  ),
  p("mentalHealthInitiative", "Mental Health Initiative", "Healthcare",
    "Fund mental health services, crisis support, and workplace wellbeing.",
    20,
    [{ id:"mentalHealth", change:20 }, { id:"publicHealth", change:10 }, { id:"crimeRate", change:-5 }],
    [{ id:"progressives", change:15 }, { id:"youth", change:20 }, { id:"workers", change:10 }]
  ),
  p("preventiveCare", "Preventive Care Program", "Healthcare",
    "Invest in screenings, vaccinations, and lifestyle disease prevention.",
    20,
    [{ id:"publicHealth", change:15 }, { id:"healthcareAccess", change:5 }],
    [{ id:"seniors", change:15 }, { id:"healthcareWorkers", change:15 }, { id:"progressives", change:10 }]
  ),
  p("hospitalFunding", "Hospital Funding Boost", "Healthcare",
    "Increase capital and staffing budgets for public hospitals.",
    30,
    [{ id:"healthcareAccess", change:15 }, { id:"publicHealth", change:10 }, { id:"nationalDebt", change:15 }],
    [{ id:"healthcareWorkers", change:20 }, { id:"seniors", change:15 }, { id:"progressives", change:15 }]
  ),
  p("drugPricingReform", "Drug Pricing Reform", "Healthcare",
    "Regulate pharmaceutical prices and bulk-purchase medicines for the public.",
    20,
    [{ id:"healthcareAccess", change:15 }, { id:"gdpGrowth", change:-5 }],
    [{ id:"seniors", change:20 }, { id:"progressives", change:20 }, { id:"workers", change:15 }, { id:"businessCommunity", change:-15 }]
  ),
  p("telehealthExpansion", "Telehealth Expansion", "Healthcare",
    "Fund digital healthcare platforms so patients can consult doctors remotely.",
    15,
    [{ id:"healthcareAccess", change:10 }, { id:"digitalInclusion", change:5 }],
    [{ id:"ruralResidents", change:20 }, { id:"seniors", change:10 }, { id:"progressives", change:10 }, { id:"healthcareWorkers", change:5 }]
  ),
  p("publicHealthCampaign", "Public Health Campaign", "Healthcare",
    "National campaigns promoting healthy lifestyles, nutrition, and exercise.",
    15,
    [{ id:"publicHealth", change:10 }, { id:"mentalHealth", change:5 }],
    [{ id:"progressives", change:10 }, { id:"seniors", change:10 }, { id:"healthcareWorkers", change:10 }]
  ),
  p("medicalResearchFunding", "Medical Research Funding", "Healthcare",
    "Boost public investment in medical and pharmaceutical research.",
    25,
    [{ id:"innovation", change:10 }, { id:"publicHealth", change:5 }, { id:"mentalHealth", change:5 }],
    [{ id:"healthcareWorkers", change:20 }, { id:"progressives", change:10 }, { id:"businessCommunity", change:10 }, { id:"youth", change:10 }]
  ),

  // ── Education ────────────────────────────────────────────────────────────
  p("freeUniversityTuition", "Free University Tuition", "Education",
    "Eliminate tuition fees at public universities and colleges.",
    40,
    [{ id:"educationQuality", change:15 }, { id:"inequality", change:-10 }, { id:"nationalDebt", change:20 }],
    [{ id:"youth", change:30 }, { id:"progressives", change:20 }, { id:"educators", change:15 }, { id:"conservatives", change:-15 }]
  ),
  p("schoolFundingIncrease", "School Funding Increase", "Education",
    "Significantly raise per-pupil spending in public schools.",
    30,
    [{ id:"educationQuality", change:20 }, { id:"literacy", change:10 }, { id:"nationalDebt", change:15 }],
    [{ id:"educators", change:25 }, { id:"parents", change:20 }, { id:"progressives", change:15 }, { id:"conservatives", change:-5 }]
  ),
  p("teacherPayRise", "Teacher Pay Rise", "Education",
    "Substantially increase salaries to attract and retain quality teachers.",
    25,
    [{ id:"educationQuality", change:15 }],
    [{ id:"educators", change:30 }, { id:"parents", change:15 }, { id:"progressives", change:15 }, { id:"conservatives", change:-5 }]
  ),
  p("digitalLearning", "Digital Learning Program", "Education",
    "Equip all schools with modern devices, broadband, and e-learning tools.",
    20,
    [{ id:"digitalInclusion", change:10 }, { id:"educationQuality", change:10 }, { id:"innovation", change:5 }],
    [{ id:"youth", change:20 }, { id:"educators", change:10 }, { id:"progressives", change:10 }, { id:"businessCommunity", change:5 }]
  ),
  p("earlyChildhoodEd", "Early Childhood Education", "Education",
    "Universal funded preschool and childcare from age two.",
    30,
    [{ id:"educationQuality", change:15 }, { id:"socialCohesion", change:10 }, { id:"inequality", change:-10 }],
    [{ id:"parents", change:25 }, { id:"progressives", change:20 }, { id:"educators", change:15 }, { id:"conservatives", change:5 }]
  ),
  p("stemInvestment", "STEM Investment", "Education",
    "Extra funding and curriculum focus on science, technology, engineering, and maths.",
    20,
    [{ id:"innovation", change:15 }, { id:"educationQuality", change:10 }],
    [{ id:"businessCommunity", change:15 }, { id:"youth", change:15 }, { id:"conservatives", change:10 }, { id:"educators", change:10 }]
  ),
  p("adultLiteracy", "Adult Literacy Program", "Education",
    "Free literacy and numeracy classes for adults who missed quality schooling.",
    15,
    [{ id:"literacy", change:20 }, { id:"socialCohesion", change:5 }],
    [{ id:"workers", change:10 }, { id:"minorities", change:15 }, { id:"progressives", change:10 }]
  ),
  p("schoolMealProgram", "School Meal Program", "Education",
    "Provide free nutritious meals to all students in public schools.",
    15,
    [{ id:"educationQuality", change:5 }, { id:"publicHealth", change:5 }, { id:"socialCohesion", change:10 }],
    [{ id:"parents", change:20 }, { id:"progressives", change:15 }, { id:"educators", change:10 }]
  ),

  // ── Housing ───────────────────────────────────────────────────────────────
  p("affordableHousing", "Affordable Housing Construction", "Housing",
    "Directly fund construction of affordable homes in high-demand areas.",
    40,
    [{ id:"housingAfford", change:20 }, { id:"unemployment", change:-5 }, { id:"nationalDebt", change:20 }],
    [{ id:"workers", change:20 }, { id:"progressives", change:20 }, { id:"urbanResidents", change:15 }, { id:"businessCommunity", change:5 }]
  ),
  p("rentControl", "Rent Control", "Housing",
    "Cap annual rent increases to protect tenants from exploitation.",
    15,
    [{ id:"housingAfford", change:15 }, { id:"gdpGrowth", change:-5 }],
    [{ id:"workers", change:20 }, { id:"urbanResidents", change:25 }, { id:"progressives", change:20 }, { id:"businessCommunity", change:-25 }, { id:"conservatives", change:-15 }]
  ),
  p("zoningReform", "Zoning Reform", "Housing",
    "Allow higher density development and mixed-use zoning near transport hubs.",
    15,
    [{ id:"housingAfford", change:10 }, { id:"gdpGrowth", change:5 }],
    [{ id:"urbanResidents", change:10 }, { id:"progressives", change:10 }, { id:"businessCommunity", change:10 }, { id:"conservatives", change:-5 }]
  ),
  p("homelessnessReduction", "Homelessness Reduction Program", "Housing",
    "Housing-first approach combined with support services to end rough sleeping.",
    25,
    [{ id:"socialCohesion", change:15 }, { id:"crimeRate", change:-5 }, { id:"housingAfford", change:5 }],
    [{ id:"progressives", change:20 }, { id:"urbanResidents", change:10 }, { id:"minorities", change:10 }, { id:"conservatives", change:-5 }]
  ),
  p("socialHousing", "Social Housing Expansion", "Housing",
    "Build and manage a large new stock of council and social housing.",
    35,
    [{ id:"housingAfford", change:20 }, { id:"nationalDebt", change:15 }],
    [{ id:"progressives", change:20 }, { id:"workers", change:15 }, { id:"urbanResidents", change:15 }, { id:"conservatives", change:-15 }]
  ),
  p("firstHomeGrant", "First Home Buyer Grant", "Housing",
    "Cash grant to first-time buyers to help cover a deposit.",
    20,
    [{ id:"housingAfford", change:10 }, { id:"nationalDebt", change:10 }],
    [{ id:"youth", change:20 }, { id:"parents", change:15 }, { id:"urbanResidents", change:10 }]
  ),
  p("emptyPropertyTax", "Empty Property Tax", "Housing",
    "Levy on long-term vacant homes to deter speculative land-banking.",
    10,
    [{ id:"housingAfford", change:10 }, { id:"nationalDebt", change:-5 }],
    [{ id:"progressives", change:15 }, { id:"urbanResidents", change:15 }, { id:"businessCommunity", change:-10 }, { id:"conservatives", change:-10 }]
  ),
  p("renovationSubsidies", "Home Renovation Subsidies", "Housing",
    "Grants and low-interest loans to upgrade ageing housing stock.",
    20,
    [{ id:"infrastructure", change:5 }, { id:"housingAfford", change:5 }],
    [{ id:"ruralResidents", change:15 }, { id:"conservatives", change:10 }, { id:"businessCommunity", change:5 }]
  ),

  // ── Transport ─────────────────────────────────────────────────────────────
  p("highSpeedRail", "High-Speed Rail Network", "Transport",
    "Build a national high-speed rail network to connect major cities.",
    50,
    [{ id:"infrastructure", change:15 }, { id:"carbonEmissions", change:-10 }, { id:"publicTransport", change:20 }],
    [{ id:"urbanResidents", change:20 }, { id:"progressives", change:20 }, { id:"environmentalists", change:15 }, { id:"ruralResidents", change:10 }, { id:"conservatives", change:-10 }]
  ),
  p("freePublicTransport", "Free Public Transport", "Transport",
    "Abolish fares on buses, trams, and metro systems.",
    35,
    [{ id:"publicTransport", change:20 }, { id:"carbonEmissions", change:-10 }, { id:"airQuality", change:5 }],
    [{ id:"urbanResidents", change:25 }, { id:"youth", change:20 }, { id:"workers", change:15 }, { id:"progressives", change:20 }, { id:"conservatives", change:-10 }]
  ),
  p("evIncentives", "Electric Vehicle Incentives", "Transport",
    "Subsidies and tax breaks to accelerate adoption of electric vehicles.",
    25,
    [{ id:"carbonEmissions", change:-10 }, { id:"airQuality", change:5 }, { id:"innovation", change:5 }],
    [{ id:"environmentalists", change:20 }, { id:"youth", change:10 }, { id:"conservatives", change:5 }, { id:"businessCommunity", change:10 }]
  ),
  p("cyclingInfrastructure", "Cycling Infrastructure", "Transport",
    "Safe, connected cycle lanes and bike-sharing schemes in every city.",
    15,
    [{ id:"carbonEmissions", change:-5 }, { id:"publicHealth", change:5 }, { id:"airQuality", change:5 }],
    [{ id:"environmentalists", change:15 }, { id:"youth", change:15 }, { id:"urbanResidents", change:10 }, { id:"progressives", change:15 }]
  ),
  p("roadExpansion", "Major Road Expansion", "Transport",
    "Widen motorways and build new roads to ease congestion.",
    35,
    [{ id:"gdpGrowth", change:5 }, { id:"carbonEmissions", change:10 }, { id:"infrastructure", change:5 }],
    [{ id:"ruralResidents", change:20 }, { id:"conservatives", change:15 }, { id:"businessCommunity", change:10 }, { id:"environmentalists", change:-20 }]
  ),
  p("smartTraffic", "Smart Traffic Management", "Transport",
    "AI-driven traffic signals and congestion pricing to reduce gridlock.",
    20,
    [{ id:"carbonEmissions", change:-5 }, { id:"infrastructure", change:5 }, { id:"innovation", change:5 }],
    [{ id:"urbanResidents", change:10 }, { id:"conservatives", change:5 }, { id:"businessCommunity", change:10 }]
  ),

  // ── Energy ────────────────────────────────────────────────────────────────
  p("renewableSubsidy", "Renewable Energy Subsidies", "Energy",
    "Direct subsidies and feed-in tariffs to scale up solar and wind.",
    30,
    [{ id:"renewableEnergy", change:20 }, { id:"carbonEmissions", change:-10 }, { id:"innovation", change:5 }],
    [{ id:"environmentalists", change:25 }, { id:"progressives", change:20 }, { id:"youth", change:10 }, { id:"businessCommunity", change:5 }, { id:"conservatives", change:-5 }]
  ),
  p("nuclearPower", "Nuclear Power Investment", "Energy",
    "Build new generation nuclear power plants for reliable low-carbon energy.",
    40,
    [{ id:"renewableEnergy", change:15 }, { id:"carbonEmissions", change:-15 }, { id:"innovation", change:10 }],
    [{ id:"conservatives", change:15 }, { id:"businessCommunity", change:10 }, { id:"environmentalists", change:-5 }, { id:"progressives", change:-5 }]
  ),
  p("smartGrid", "Smart Grid Development", "Energy",
    "Modernise the electricity grid with digital monitoring and automation.",
    25,
    [{ id:"renewableEnergy", change:10 }, { id:"innovation", change:10 }, { id:"infrastructure", change:5 }],
    [{ id:"businessCommunity", change:10 }, { id:"progressives", change:10 }, { id:"youth", change:5 }]
  ),
  p("homeInsulation", "Home Insulation Scheme", "Energy",
    "Subsidise insulation and double-glazing for low-income households.",
    20,
    [{ id:"carbonEmissions", change:-10 }, { id:"housingAfford", change:5 }],
    [{ id:"workers", change:15 }, { id:"progressives", change:10 }, { id:"conservatives", change:10 }, { id:"environmentalists", change:10 }]
  ),
  p("offshoreWind", "Offshore Wind Farm Development", "Energy",
    "Construct large offshore wind arrays to generate clean electricity.",
    35,
    [{ id:"renewableEnergy", change:20 }, { id:"carbonEmissions", change:-15 }, { id:"unemployment", change:-5 }],
    [{ id:"environmentalists", change:25 }, { id:"progressives", change:15 }, { id:"workers", change:10 }, { id:"conservatives", change:-5 }]
  ),
  p("energyPoverty", "Energy Poverty Reduction", "Energy",
    "Cap energy bills for vulnerable households and fund efficiency upgrades.",
    20,
    [{ id:"socialCohesion", change:10 }, { id:"inequality", change:-5 }, { id:"renewableEnergy", change:5 }],
    [{ id:"workers", change:15 }, { id:"progressives", change:15 }, { id:"seniors", change:10 }, { id:"minorities", change:10 }]
  ),
  p("fossilFuelPhaseout", "Fossil Fuel Phase-Out", "Energy",
    "Set a binding end date for coal, oil, and gas in the energy mix.",
    30,
    [{ id:"carbonEmissions", change:-25 }, { id:"renewableEnergy", change:10 }, { id:"gdpGrowth", change:-10 }, { id:"unemployment", change:10 }],
    [{ id:"environmentalists", change:30 }, { id:"progressives", change:15 }, { id:"conservatives", change:-20 }, { id:"workers", change:-10 }, { id:"businessCommunity", change:-15 }]
  ),
  p("energyStorage", "Energy Storage Investment", "Energy",
    "Fund grid-scale battery and hydrogen storage to firm up renewables.",
    25,
    [{ id:"renewableEnergy", change:15 }, { id:"innovation", change:10 }, { id:"carbonEmissions", change:-5 }],
    [{ id:"environmentalists", change:15 }, { id:"businessCommunity", change:10 }, { id:"progressives", change:10 }]
  ),

  // ── Environment ───────────────────────────────────────────────────────────
  p("rewilding", "Rewilding Initiative", "Environment",
    "Restore native habitats and reintroduce keystone species.",
    20,
    [{ id:"biodiversity", change:25 }, { id:"airQuality", change:5 }, { id:"carbonEmissions", change:-5 }],
    [{ id:"environmentalists", change:25 }, { id:"progressives", change:15 }, { id:"farmers", change:-10 }, { id:"conservatives", change:-5 }]
  ),
  p("plasticBan", "Single-Use Plastic Ban", "Environment",
    "Prohibit single-use plastics across retail, packaging, and hospitality.",
    10,
    [{ id:"airQuality", change:5 }, { id:"biodiversity", change:10 }, { id:"carbonEmissions", change:-5 }],
    [{ id:"environmentalists", change:20 }, { id:"progressives", change:15 }, { id:"youth", change:10 }, { id:"businessCommunity", change:-5 }]
  ),
  p("oceanCleanup", "Ocean Cleanup Program", "Environment",
    "Fund technology and fleets to remove plastic and pollution from oceans.",
    20,
    [{ id:"biodiversity", change:15 }, { id:"airQuality", change:5 }],
    [{ id:"environmentalists", change:25 }, { id:"progressives", change:10 }, { id:"youth", change:10 }]
  ),
  p("urbanGreenSpaces", "Urban Green Space Expansion", "Environment",
    "Create parks, community gardens, and tree-planting initiatives in cities.",
    15,
    [{ id:"airQuality", change:10 }, { id:"publicHealth", change:5 }, { id:"socialCohesion", change:5 }],
    [{ id:"urbanResidents", change:20 }, { id:"environmentalists", change:15 }, { id:"progressives", change:10 }, { id:"youth", change:10 }]
  ),
  p("emissionsTrading", "Emissions Trading Scheme", "Environment",
    "Cap and trade system that lets companies buy and sell pollution permits.",
    20,
    [{ id:"carbonEmissions", change:-20 }, { id:"gdpGrowth", change:-5 }],
    [{ id:"environmentalists", change:20 }, { id:"progressives", change:15 }, { id:"businessCommunity", change:-10 }]
  ),
  p("environmentalProtection", "Environmental Protection Laws", "Environment",
    "Strict standards on emissions, water quality, and land use.",
    15,
    [{ id:"biodiversity", change:10 }, { id:"airQuality", change:10 }, { id:"carbonEmissions", change:-10 }],
    [{ id:"environmentalists", change:25 }, { id:"progressives", change:20 }, { id:"businessCommunity", change:-10 }, { id:"conservatives", change:-5 }, { id:"farmers", change:-5 }]
  ),
  p("reforestation", "National Reforestation Program", "Environment",
    "Plant billions of trees to absorb carbon and restore forest cover.",
    20,
    [{ id:"carbonEmissions", change:-15 }, { id:"biodiversity", change:15 }, { id:"airQuality", change:10 }],
    [{ id:"environmentalists", change:30 }, { id:"progressives", change:15 }, { id:"ruralResidents", change:5 }, { id:"farmers", change:-5 }]
  ),
  p("waterConservation", "Water Conservation Program", "Environment",
    "Invest in water recycling, efficient irrigation, and reservoir management.",
    15,
    [{ id:"biodiversity", change:10 }, { id:"airQuality", change:5 }],
    [{ id:"environmentalists", change:15 }, { id:"ruralResidents", change:10 }, { id:"farmers", change:10 }, { id:"progressives", change:10 }]
  ),

  // ── Immigration ───────────────────────────────────────────────────────────
  p("pointsBasedImmigration", "Points-Based Immigration System", "Immigration",
    "Prioritise skilled migrants based on economic need and contribution.",
    15,
    [{ id:"gdpGrowth", change:5 }, { id:"inequality", change:5 }],
    [{ id:"conservatives", change:20 }, { id:"businessCommunity", change:15 }, { id:"workers", change:-5 }, { id:"minorities", change:-10 }]
  ),
  p("refugeeResettlement", "Refugee Resettlement Program", "Immigration",
    "Accept and support a significant number of refugees annually.",
    20,
    [{ id:"socialCohesion", change:5 }, { id:"inequality", change:-5 }],
    [{ id:"progressives", change:20 }, { id:"minorities", change:15 }, { id:"conservatives", change:-20 }, { id:"veterans", change:-5 }]
  ),
  p("skilledWorkerVisa", "Skilled Worker Visa Program", "Immigration",
    "Fast-track visas for professionals filling key labour market gaps.",
    15,
    [{ id:"gdpGrowth", change:10 }, { id:"innovation", change:5 }, { id:"unemployment", change:5 }],
    [{ id:"businessCommunity", change:20 }, { id:"conservatives", change:10 }, { id:"workers", change:-10 }]
  ),
  p("borderSecurity", "Border Security Enhancement", "Immigration",
    "Invest in border infrastructure, surveillance, and patrol capacity.",
    25,
    [{ id:"crimeRate", change:-5 }],
    [{ id:"conservatives", change:25 }, { id:"veterans", change:15 }, { id:"workers", change:5 }, { id:"progressives", change:-15 }, { id:"minorities", change:-15 }]
  ),
  p("integrationSupport", "Immigrant Integration Program", "Immigration",
    "Language classes, community support, and pathway-to-citizenship assistance.",
    20,
    [{ id:"socialCohesion", change:15 }, { id:"inequality", change:-5 }],
    [{ id:"progressives", change:20 }, { id:"minorities", change:20 }, { id:"conservatives", change:-10 }]
  ),
  p("immigrationAmnesty", "Immigration Amnesty", "Immigration",
    "Offer a legal pathway to citizenship for long-term undocumented residents.",
    20,
    [{ id:"socialCohesion", change:10 }, { id:"inequality", change:-5 }, { id:"gdpGrowth", change:5 }],
    [{ id:"progressives", change:25 }, { id:"minorities", change:25 }, { id:"conservatives", change:-25 }, { id:"veterans", change:-10 }]
  ),

  // ── Justice & Policing ────────────────────────────────────────────────────
  p("policeReform", "Police Reform", "Justice",
    "Demilitarise police, improve training, and strengthen accountability.",
    20,
    [{ id:"crimeRate", change:-10 }, { id:"civilLiberties", change:10 }],
    [{ id:"progressives", change:20 }, { id:"minorities", change:25 }, { id:"urbanResidents", change:15 }, { id:"conservatives", change:-15 }]
  ),
  p("prisonReform", "Prison Reform", "Justice",
    "Focus on rehabilitation over punishment; reduce recidivism.",
    20,
    [{ id:"crimeRate", change:-10 }, { id:"civilLiberties", change:10 }, { id:"socialCohesion", change:5 }],
    [{ id:"progressives", change:20 }, { id:"minorities", change:15 }, { id:"conservatives", change:-10 }]
  ),
  p("drugDecrim", "Drug Decriminalisation", "Justice",
    "Treat drug possession as a health issue, not a criminal matter.",
    10,
    [{ id:"crimeRate", change:-15 }, { id:"publicHealth", change:5 }, { id:"civilLiberties", change:10 }],
    [{ id:"progressives", change:20 }, { id:"youth", change:20 }, { id:"minorities", change:15 }, { id:"conservatives", change:-25 }, { id:"veterans", change:-10 }]
  ),
  p("communityPolicing", "Community Policing Initiative", "Justice",
    "Assign officers to neighbourhoods to build trust and prevent crime.",
    15,
    [{ id:"crimeRate", change:-10 }, { id:"socialCohesion", change:5 }],
    [{ id:"urbanResidents", change:15 }, { id:"progressives", change:10 }, { id:"conservatives", change:5 }]
  ),
  p("antiCorruption", "Anti-Corruption Agency", "Justice",
    "Establish an independent watchdog with real enforcement powers.",
    15,
    [{ id:"corruption", change:-20 }, { id:"civilLiberties", change:5 }, { id:"gdpGrowth", change:5 }],
    [{ id:"progressives", change:20 }, { id:"conservatives", change:15 }, { id:"businessCommunity", change:5 }]
  ),
  p("restorativeJustice", "Restorative Justice Program", "Justice",
    "Bring offenders, victims, and communities together to repair harm.",
    15,
    [{ id:"crimeRate", change:-10 }, { id:"socialCohesion", change:10 }, { id:"civilLiberties", change:5 }],
    [{ id:"progressives", change:15 }, { id:"minorities", change:10 }, { id:"urbanResidents", change:10 }]
  ),

  // ── Civil Liberties ───────────────────────────────────────────────────────
  p("privacyProtection", "Privacy Protection Laws", "Civil Liberties",
    "Strict limits on data collection, surveillance, and retention.",
    10,
    [{ id:"civilLiberties", change:15 }],
    [{ id:"progressives", change:20 }, { id:"youth", change:15 }, { id:"conservatives", change:5 }, { id:"businessCommunity", change:-5 }]
  ),
  p("votingRights", "Voting Rights Expansion", "Civil Liberties",
    "Automatic registration, extended early voting, and voter ID reform.",
    10,
    [{ id:"civilLiberties", change:10 }, { id:"socialCohesion", change:5 }],
    [{ id:"progressives", change:25 }, { id:"minorities", change:20 }, { id:"youth", change:15 }, { id:"conservatives", change:-15 }]
  ),
  p("lgbtqRights", "LGBTQ+ Rights Legislation", "Civil Liberties",
    "Full legal equality and anti-discrimination protections for LGBTQ+ citizens.",
    10,
    [{ id:"civilLiberties", change:15 }, { id:"socialCohesion", change:10 }],
    [{ id:"progressives", change:25 }, { id:"youth", change:20 }, { id:"minorities", change:10 }, { id:"conservatives", change:-25 }, { id:"veterans", change:-10 }]
  ),
  p("freedomOfInfo", "Freedom of Information Act", "Civil Liberties",
    "Legally require government transparency and public access to official records.",
    10,
    [{ id:"civilLiberties", change:10 }, { id:"corruption", change:-10 }],
    [{ id:"progressives", change:20 }, { id:"conservatives", change:5 }, { id:"businessCommunity", change:-5 }]
  ),
  p("antiDiscrimination", "Anti-Discrimination Laws", "Civil Liberties",
    "Comprehensive legislation covering race, gender, disability, religion, and more.",
    10,
    [{ id:"civilLiberties", change:10 }, { id:"socialCohesion", change:15 }, { id:"inequality", change:-5 }],
    [{ id:"progressives", change:25 }, { id:"minorities", change:25 }, { id:"youth", change:15 }, { id:"conservatives", change:-10 }]
  ),
  p("campaignFinanceReform", "Campaign Finance Reform", "Civil Liberties",
    "Limit political donations and dark money to protect democratic integrity.",
    10,
    [{ id:"civilLiberties", change:10 }, { id:"corruption", change:-15 }],
    [{ id:"progressives", change:20 }, { id:"conservatives", change:-5 }, { id:"businessCommunity", change:-20 }]
  ),

  // ── Technology & Digital Governance ──────────────────────────────────────
  p("internetForAll", "Internet for All", "Technology",
    "Universal broadband for every household, with a focus on rural areas.",
    25,
    [{ id:"digitalInclusion", change:20 }, { id:"gdpGrowth", change:5 }, { id:"inequality", change:-10 }],
    [{ id:"ruralResidents", change:25 }, { id:"minorities", change:15 }, { id:"youth", change:15 }, { id:"progressives", change:15 }]
  ),
  p("aiRegulation", "AI Regulation Framework", "Technology",
    "Ethical rules and oversight bodies for artificial intelligence use.",
    15,
    [{ id:"innovation", change:5 }, { id:"civilLiberties", change:10 }],
    [{ id:"progressives", change:15 }, { id:"businessCommunity", change:-10 }, { id:"youth", change:10 }]
  ),
  p("openSourceGov", "Open Source Government Software", "Technology",
    "Mandate transparent, open-source software for all public digital services.",
    15,
    [{ id:"digitalInclusion", change:10 }, { id:"corruption", change:-5 }, { id:"innovation", change:5 }],
    [{ id:"progressives", change:15 }, { id:"youth", change:10 }, { id:"businessCommunity", change:-5 }]
  ),
  p("cybersecurity", "Cybersecurity Investment", "Technology",
    "Fund national cyber-defences and protect critical infrastructure.",
    20,
    [{ id:"innovation", change:10 }, { id:"civilLiberties", change:5 }],
    [{ id:"conservatives", change:15 }, { id:"businessCommunity", change:15 }, { id:"veterans", change:10 }]
  ),
  p("techStartupFund", "Tech Startup Fund", "Technology",
    "Government venture fund and accelerators to seed new technology companies.",
    25,
    [{ id:"innovation", change:20 }, { id:"gdpGrowth", change:10 }, { id:"unemployment", change:-5 }],
    [{ id:"businessCommunity", change:20 }, { id:"youth", change:20 }, { id:"conservatives", change:10 }]
  ),
  p("digitalIDSystem", "Digital Identity System", "Technology",
    "Secure voluntary digital ID to simplify access to government services.",
    20,
    [{ id:"digitalInclusion", change:10 }, { id:"corruption", change:-5 }],
    [{ id:"conservatives", change:10 }, { id:"businessCommunity", change:10 }, { id:"progressives", change:-10 }]
  ),

  // ── Foreign Policy & Defence ──────────────────────────────────────────────
  p("internationalAid", "International Aid Program", "Foreign Policy",
    "Commit 0.7% of GDP to overseas development and humanitarian aid.",
    20,
    [{ id:"socialCohesion", change:10 }, { id:"gdpGrowth", change:-3 }],
    [{ id:"progressives", change:20 }, { id:"conservatives", change:-10 }]
  ),
  p("militaryModernisation", "Military Modernisation", "Foreign Policy",
    "Upgrade equipment and capabilities of the armed forces.",
    40,
    [{ id:"nationalDebt", change:20 }, { id:"civilLiberties", change:-5 }],
    [{ id:"veterans", change:25 }, { id:"conservatives", change:20 }, { id:"progressives", change:-15 }, { id:"youth", change:-5 }]
  ),
  p("tradeDiversification", "Trade Diversification", "Foreign Policy",
    "Pursue new bilateral trade agreements to reduce dependence on single markets.",
    15,
    [{ id:"gdpGrowth", change:10 }, { id:"unemployment", change:-5 }],
    [{ id:"businessCommunity", change:15 }, { id:"conservatives", change:10 }, { id:"workers", change:5 }]
  ),
  p("climateAccord", "Climate Accord Membership", "Foreign Policy",
    "Join or renew commitment to international climate agreements.",
    10,
    [{ id:"carbonEmissions", change:-15 }, { id:"socialCohesion", change:5 }, { id:"gdpGrowth", change:-3 }],
    [{ id:"environmentalists", change:25 }, { id:"progressives", change:20 }, { id:"conservatives", change:-15 }, { id:"businessCommunity", change:-10 }]
  ),
  p("peacekeeping", "Peacekeeping Contributions", "Foreign Policy",
    "Commit troops and resources to UN peacekeeping missions worldwide.",
    20,
    [{ id:"socialCohesion", change:5 }, { id:"nationalDebt", change:10 }],
    [{ id:"progressives", change:15 }, { id:"veterans", change:10 }, { id:"conservatives", change:-5 }]
  ),
  p("diplomaticExpansion", "Diplomatic Expansion", "Foreign Policy",
    "Open new embassies and strengthen diplomatic corps globally.",
    15,
    [{ id:"gdpGrowth", change:5 }, { id:"socialCohesion", change:5 }],
    [{ id:"businessCommunity", change:10 }, { id:"conservatives", change:5 }, { id:"progressives", change:10 }]
  ),

  // ── Local Government & Civic Participation ────────────────────────────────
  p("localGovGrants", "Local Government Grants", "Civic",
    "Boost funding for municipal councils to improve local services.",
    20,
    [{ id:"infrastructure", change:10 }, { id:"socialCohesion", change:10 }, { id:"nationalDebt", change:10 }],
    [{ id:"ruralResidents", change:20 }, { id:"urbanResidents", change:10 }]
  ),
  p("citizenAssemblies", "Citizen Assemblies", "Civic",
    "Randomly selected citizen panels to deliberate on major policy questions.",
    10,
    [{ id:"socialCohesion", change:10 }, { id:"civilLiberties", change:5 }],
    [{ id:"progressives", change:15 }, { id:"youth", change:10 }]
  ),
  p("participatoryBudgeting", "Participatory Budgeting", "Civic",
    "Let citizens vote directly on how part of the local budget is spent.",
    10,
    [{ id:"socialCohesion", change:10 }, { id:"corruption", change:-5 }],
    [{ id:"progressives", change:20 }, { id:"youth", change:15 }, { id:"urbanResidents", change:10 }]
  ),
  p("volunteerIncentives", "Volunteer Incentives", "Civic",
    "Tax credits and recognition schemes to encourage community volunteering.",
    10,
    [{ id:"socialCohesion", change:15 }],
    [{ id:"conservatives", change:15 }, { id:"progressives", change:10 }, { id:"seniors", change:10 }]
  ),
  p("publicBroadcasting", "Public Broadcasting Investment", "Civic",
    "Fund independent public media to support a well-informed citizenry.",
    15,
    [{ id:"socialCohesion", change:5 }, { id:"civilLiberties", change:5 }],
    [{ id:"progressives", change:15 }, { id:"educators", change:10 }, { id:"conservatives", change:-5 }]
  ),
];

// ── Utility ───────────────────────────────────────────────────────────────────
export const POLICY_CATEGORIES = [...new Set(POLICIES.map(p => p.category))];
