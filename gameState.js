import * as RenderFunctions from './renderFunctions.js';

// Function to retrieve the saved API key
export function getSavedAPIKey() {
  return localStorage.getItem('api_key');
}

// Function to save the API key
export function saveAPIKey(apiKey) {
  localStorage.setItem('api_key', apiKey);
}

export function calculateFinalScore(gameState) {
  gameState.nodes.forEach(node => {
    if (node.type === "voter") {
      node.finalApproval = node.approval;  // start with initial approval value
      gameState.impacts.forEach(impact => {
        if (impact.to === node.id) {
          node.finalApproval += impact.impact;
        }
      });
    } else if (node.type === "state") {
      node.finalStateValue = node.value;  // start with initial state value
      gameState.impacts.forEach(impact => {
        if (impact.to === node.id) {
          node.finalStateValue += impact.impact;
        }
      });
    }
  });
}

export function createVoterNode(id, name, type, description, approval) {
  return { id, name, type: "voter", description, approval };
}

export function createStateNode(id, name, description, value, category) {
  return { id, name, type: "state", description, value, category };
}

export function createPolicyNode(id, name, description, category) {
  return { id, name, type: "policy", description, category };
}

export function createImpact(from, to, impact) {
  return { from, to, impact };
}

export function updateGameState(newGameState) {
  // Deep copy the state
  gameState = JSON.parse(JSON.stringify(newGameState));

  // Clear SVG container
  RenderFunctions.clearSVGContainer();

  // Render new state
  calculateFinalScore(newGameState); 
  RenderFunctions.renderGameState(newGameState);
}

// Initialize game state here
export var gameState = {
  credits: 100,
  currentRound: 1,
  nodes: [
    createStateNode("GDP", "GDP", "Gross Domestic Product.", 100, "Economy"),
    createStateNode("carbonEmissions", "Carbon Emissions", "Greenhouse gas emissions.", 100, "Environment"),
    createStateNode("violentCrime", "Violent Crime", "Level of violent crimes.", 100, "Law and Order"),
    createStateNode("literacyRate", "Literacy Rate", "Literacy rate among adults.", 100, "Education"),
    createStateNode("universalHealthcare", "Universal Healthcare", "Access to healthcare services for all citizens.", 100, "Healthcare"),
    createStateNode("publicTransport", "Public Transportation", "Quality and availability of public transportation.", 100, "Infrastructure"),
    createStateNode("unemploymentRate", "Unemployment Rate", "Percentage of the workforce that is jobless.", 100, "Employment"),
    createStateNode("housingAffordability", "Housing Affordability", "Affordability of housing.", 100, "Housing"),
    createStateNode("internetAccess", "Internet Access", "Availability and quality of internet access.", 100, "Technology"),
    createStateNode("immigrationPolicy", "Immigration Policy", "Policies and approach towards immigration.", 100, "Immigration"),
    createStateNode("publicHealth", "Public Health", "General health and well-being of the population.", 100, "Health and Safety"),
    createVoterNode("environmentalists", "Environmentalists", "voter", "Voters concerned about the environment.", 50),
    createVoterNode("motorists", "Motorists", "voter", "Voters concerned about transportation and road issues.", 50),
    createVoterNode("liberals", "Liberals", "voter", "Voters with liberal political leanings.", 50),
    createVoterNode("conservatives", "Conservatives", "voter", "Voters with conservative political leanings.", 50),
    createVoterNode("youth", "Youth", "voter", "Young voters with diverse interests and concerns.", 50),
    createVoterNode("seniors", "Seniors", "voter", "Elderly voters with specific needs and priorities.", 50),
    createVoterNode("entrepreneurs", "Entrepreneurs", "voter", "Voters who prioritize business and economic growth.", 50),
    createVoterNode("humanitarians", "Humanitarians", "voter", "Voters dedicated to social causes and humanitarian efforts.", 50),
    createVoterNode("veterans", "Veterans", "voter", "Voters with military service background.", 50),
    createVoterNode("suburbanResidents", "Suburban Residents", "voter", "Voters residing in suburban areas.", 50),
    createVoterNode("urbanResidents", "Urban Residents", "voter", "Voters residing in urban areas.", 50),
    createVoterNode("ruralResidents", "Rural Residents", "voter", "Voters residing in rural areas.", 50),
    createVoterNode("teachers", "Teachers", "voter", "Voters who are teachers or connected to education.", 50),
    createVoterNode("students", "Students", "voter", "Voters who are currently students.", 50),
    createVoterNode("unionWorkers", "Union Workers", "voter", "Voters who are part of labor unions.", 50),
    createVoterNode("farmers", "Farmers", "voter", "Voters who are engaged in farming.", 50),
    createVoterNode("singleParents", "Single Parents", "voter", "Voters who are single parents.", 50),
    createVoterNode("minorities", "Minorities", "voter", "Voters from minority communities.", 50),
    createPolicyNode("carbonTax", "Carbon Tax", "Taxing carbon dioxide emissions.", "Environment"),
    createPolicyNode("universalBasicIncome", "Universal Basic Income", "Providing a basic income for all citizens.", "Economy"),
    createPolicyNode("gunControl", "Gun Control Legislation", "Tighter controls on the sale and possession of firearms.", "Law and Order"),
    createPolicyNode("schoolFunding", "Increase School Funding", "Increasing the budget for public schools.", "Education"),
    createPolicyNode("medicareForAll", "Medicare for All", "Providing healthcare to all citizens through a single-payer system.", "Healthcare"),
    createPolicyNode("internetForAll", "Internet for All", "Ensuring all citizens have access to the internet.", "Technology"),
    createPolicyNode("immigrationAmnesty", "Immigration Amnesty", "Providing legal status to undocumented immigrants.", "Immigration"),
    createPolicyNode("publicHealthInitiative", "Public Health Initiative", "Implementing programs to improve public health.", "Health and Safety")
  ],
  impacts: [
    createImpact("GDP", "universalBasicIncome", 10),
    createImpact("carbonEmissions", "carbonTax", -20),
    createImpact("literacyRate", "schoolFunding", 20),
    createImpact("universalHealthcare", "medicareForAll", 15),
    createImpact("publicTransport", "carbonTax", 5),
    createImpact("unemploymentRate", "universalBasicIncome", -10),
    createImpact("housingAffordability", "universalBasicIncome", 5),
    createImpact("internetAccess", "internetForAll", 10),
    createImpact("immigrationPolicy", "immigrationAmnesty", 10),
    createImpact("publicHealth", "publicHealthInitiative", 10),
    createImpact("carbonTax", "environmentalists", 10),
    createImpact("medicareForAll", "seniors", 10),
    createImpact("internetForAll", "technologyWorkers", 5),
    createImpact("immigrationAmnesty", "immigrants", 15),
    createImpact("publicHealthInitiative", "healthcareWorkers", 10),
    createImpact("universalBasicIncome", "entrepreneurs", -15),
    createImpact("gunControl", "conservatives", -10),
    createImpact("gunControl", "liberals", 10),
    createImpact("schoolFunding", "education", 15),
    createImpact("internetForAll", "youth", 10),
    createImpact("publicHealthInitiative", "seniors", 10),
    createImpact("GDP", "humanitarians", 5),
    createImpact("carbonEmissions", "suburbanResidents", -10),
    createImpact("violentCrime", "urbanResidents", -5),
    createImpact("literacyRate", "ruralResidents", 10),
    createImpact("universalHealthcare", "teachers", 15),
    createImpact("publicTransport", "students", 5),
    createImpact("unemploymentRate", "unionWorkers", 10),
    createImpact("housingAffordability", "farmers", 5),
    createImpact("internetAccess", "minorities", 10),
    createImpact("immigrationPolicy", "veterans", 5),
    createImpact("AffordableHousingProgram", "housing", 20),
    createImpact("AffordableHousingProgram", "singleParents", 10),
    createImpact("AffordableHousingProgram", "poverty", -15),
    createImpact("InfrastructureDevelopment", "infrastructure", 20),
    createImpact("InfrastructureDevelopment", "ruralResidents", 15),
    createImpact("InfrastructureDevelopment", "entrepreneurs", 10),
    createImpact("carbonTax", "motorists", -10),
    createImpact("universalBasicIncome", "poverty", -20),
    createImpact("schoolFunding", "parents", 10),
    createImpact("medicareForAll", "healthcareWorkers", -10),
    createImpact("internetForAll", "technology", 15),
    createImpact("internetForAll", "ruralResidents", 20),
    createImpact("immigrationAmnesty", "conservatives", -10),
    createImpact("publicHealthInitiative", "healthSafety", 15),
    createImpact("publicHealthInitiative", "seniors", 10),
    createImpact("AffordableHousingProgram", "singleParents", 10),
    createImpact("AffordableHousingProgram", "poverty", -15),
    createImpact("InfrastructureDevelopment", "ruralResidents", 15),
    createImpact("InfrastructureDevelopment", "entrepreneurs", 10),
    createImpact("GDP", "humanitarians", 5),
    createImpact("carbonEmissions", "suburbanResidents", -10),
    createImpact("violentCrime", "urbanResidents", -5),
    createImpact("literacyRate", "ruralResidents", 10),
    createImpact("universalHealthcare", "teachers", 15),
    createImpact("publicTransport", "students", 5),
    createImpact("unemploymentRate", "unionWorkers", 10),
    createImpact("housingAffordability", "farmers", 5),
    createImpact("internetAccess", "minorities", 10),
    createImpact("immigrationPolicy", "veterans", 5)
  ]
};