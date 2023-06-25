
// Function to render the impact matrix as an HTML table
export function renderImpactMatrix(matrix) {
  let html = '<table class="impact-matrix futuristic-table">';

  // Render table header
	html += '<thead><tr><th class="header-cell">Policy/Node</th><th class="header-cell">Influenced By</th><th class="header-cell">Influences</th></tr></thead>';


  // Render table rows
  html += '<tbody>';
  matrix.forEach(row => {
    html += '<tr>';
    html += `<td>${row.name}</td>`;
    html += renderImpactCell(row.influencedBy); // Render influencedBy impact cell
    html += renderImpactCell(row.influences); // Render influences impact cell
    html += '</tr>';
  });
  html += '</tbody>';

  html += '</table>';

  return html;
}

// Function to render an impact cell with color
export function renderImpactCell(impact) {
  const color = getImpactColor(impact);
  return `<td style="background-color: ${color};">${impact !== null ? impact : '-'}</td>`;
}


// Function to create the impact matrix
export function createImpactMatrix(gameState, policyId) {
  const matrix = [];
  const relevantImpacts = gameState.impacts.filter(impact => impact.from === policyId || impact.to === policyId);

  relevantImpacts.forEach(impact => {
    let otherNodeId = impact.from === policyId ? impact.to : impact.from;
    let existingRow = matrix.find(row => row.name === otherNodeId);

    if (!existingRow) {
      existingRow = {
        name: otherNodeId,
        influencedBy: null,
        influences: null
      };
      matrix.push(existingRow);
    }

    if (impact.from === policyId) {
      existingRow.influences = impact.impact;
    } else {
      existingRow.influencedBy = impact.impact;
    }
  });

  return matrix;
}

// Function to calculate the color based on impact value
export function getImpactColor(impact) {
  const colorScale = d3.scaleLinear()
    .domain([-100, 0, 100])
    .range(['red', 'white', 'green']);

  return colorScale(impact);
}

// Function to show the strength of the impact
export function showImpactStrength(impact, x, y) {
  let strength = Math.abs(impact.impact);
  let tooltip = d3.select("#tooltip")
    .style("left", `${x}px`)
    .style("top", `${y}px`)
    .style("opacity", 0);

  tooltip.html(`${strength}`);
  //tooltip.html(`Impact Strength: ${strength}`);
}

// Function to hide the impact strength
export function hideImpactStrength() {
  let tooltip = d3.select("#tooltip")
    .style("opacity", 0);
}
