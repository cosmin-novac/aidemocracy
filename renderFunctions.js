import * as ImpactFunctions from './impactFunctions.js';
import * as PolicyFunctions from './policyFunctions.js';

// Render game state
export function renderGameState(gameState) {
  const creditsDisplay = `<p class="game-info">Political Credits: ${gameState.credits}</p>`;
  const roundDisplay = `<p class="game-info">Round # ${gameState.currentRound}</p>`;
  $('#policy-actions').html(`
    <div class="game-info-container">
      ${creditsDisplay}
      ${roundDisplay}
    </div>
    <div class="game-actions-container">
      <button id="add-policy">Add Policy</button>
      <button id="end-round">End Round</button>
    </div>
  `);

  renderSVGCirclesAndLines(gameState);
}

export function renderSVGCirclesAndLines(gameState) {
  const svgContainer = "#svg-container";
  const width = 1500;
  const height = 750;
  
  clearSVGContainer(svgContainer);
  const svg = createSVG(svgContainer, width, height);
  const drag = createDragBehavior(svg);

  calculateNodePositions(filterStateAndPolicyNodes(gameState));
  calculateVoterNodePositions(filterVoterNodes(gameState));

  drawImpactLines(svg, gameState, groupImpacts(gameState.impacts));

  drawVoterNodesAndLabels(svg, filterVoterNodes(gameState), gameState);
  drawNodesAndLabels(svg, filterStateAndPolicyNodes(gameState), gameState, drag);

}

export function drawCategoryBackground(svg, startAngle, endAngle, radius, category) {

  const centerX = 700; // Center X coordinate of the canvas
  const centerY = 320; // Center Y coordinate of the canvas

  // Create an arc generator for the text path
  const textPathArcGenerator = d3.arc()
    .innerRadius(radius - 20) // Adjust as needed
    .outerRadius(radius)
    .startAngle(startAngle)
    .endAngle(endAngle);

  // Create an arc generator for the background path
  const bgArcGenerator = d3.arc()
    .innerRadius(0)
    .outerRadius(radius)
    .startAngle(startAngle)
    .endAngle(endAngle);

  // Define the text path in the SVG's defs
  const defs = svg.append('defs');

  const textPathId = `text-path-${category}`;

  defs.append("path")
    .attr("id", textPathId)
    .attr("d", textPathArcGenerator())
    .attr("transform", `translate(${centerX}, ${centerY})`);

  // Draw the arc
  const arcPath = svg.insert("path", ":first-child") // Insert the path as the first child of the SVG
    .attr("d", bgArcGenerator())
    .attr("transform", `translate(${centerX}, ${centerY})`)
    .style("fill", 'white')
    .style("stroke", "gray")
    .style("stroke-width", 1);

  // Add the category name to the arc
  svg.append("text")
    .append("textPath") //append a textPath to the text element
    .attr("xlink:href", `#${textPathId}`) //place the ID of the path here
    .style("text-anchor","middle") //place the text halfway on the arc
    .attr("startOffset", "20%")  
    .text(category !== undefined ? category.toUpperCase() : "");
}

export function drawNodesAndLabels(svg, stateAndPolicyNodes, gameState, drag) {
  // Draw category backgrounds
  let uniqueCategories = Array.from(new Set(stateAndPolicyNodes.map(node => node.category)));
  const centerX = 700; // Center X coordinate of the canvas
  const centerY = 320; // Center Y coordinate of the canvas
  const radius = 300;
  const segmentCount = 10; // Adjust as needed, determines the number of segments within each category

  let categoryArcs = {};

  uniqueCategories.forEach((category, index) => {
    const anglePerCategory = 2 * Math.PI / uniqueCategories.length;
    const startAngle = index * anglePerCategory;
    const endAngle = (index + 1) * anglePerCategory;
    const arc = d3.arc()
      .innerRadius(radius - 20) // Adjust as needed
      .outerRadius(radius)
      .startAngle(startAngle)
      .endAngle(endAngle);
    categoryArcs[category] = arc;

    drawCategoryBackground(svg, startAngle, endAngle, radius, category);
  });

  stateAndPolicyNodes.forEach((node) => {
    const x = node.pos.x;
    const y = node.pos.y;

    // Draw circle
    svg.append("circle")
      .datum(node)
      .attr("cx", x)
      .attr("cy", y)
      .attr("r", node.radius)
      .style("fill", node.type === 'state' ? "blue" : "green")
      .classed("node-circle", true)
      .classed("node-circle-state", node.type === "state")
      .classed("node-circle-policy", node.type === "policy")
      .on("click", () => {
        showDetails(gameState, node);
      })
      .on("mouseover", () => {
        ImpactFunctions.showImpactStrength(node);
        // Adjust opacity of lines
        svg.selectAll(`.flowing-line`).attr('stroke-opacity', 0.2);
        svg.selectAll(`.line-${node.id}`).attr('stroke-opacity', 1);
      })
      .on("mouseout", () => {
        ImpactFunctions.hideImpactStrength();
        // Reset opacity of lines
        svg.selectAll(`.flowing-line`).attr('stroke-opacity', function () {
          return d3.select(this).attr("data-default-opacity");
        });
      })
      .call(drag);

    // Draw text label
    svg.append("text")
      .datum(node)
      .attr("x", x)
      .attr("y", y + 30)
      .attr("text-anchor", "middle")
      .text(node.name)
      .classed("node-label", true)
      .classed("node-label-state", node.type === "state")
      .classed("node-label-policy", node.type === "policy")
      .classed("node-label-voter", node.type === "voter");
  });
}


export function groupImpacts(impacts) {
  let groupedImpacts = {};
  impacts.forEach((impact) => {
    let key = [impact.from, impact.to].sort().join('-');
    if (!groupedImpacts[key]) {
      groupedImpacts[key] = [];
    }
    groupedImpacts[key].push(impact);
  });
  return groupedImpacts;
}

export function clearSVGContainer(svgContainer) {
  d3.select(svgContainer).html("");
}

export function createSVG(svgContainer, width, height) {
  return d3.select(svgContainer)
    .append("svg")
    .attr("width", width)
    .attr("height", height);
}


// Function to show details
export function showDetails(gameState, item) {
  const impactMatrix = ImpactFunctions.createImpactMatrix(gameState, item.id);
  var deletionCost = 20;
  Swal.fire({
    title: item.name,
    html: `
        <p>Description: ${item.description}</p>
        ${ImpactFunctions.renderImpactMatrix(impactMatrix)}
    `,
    confirmButtonText: 'Close',
    showCancelButton: item.type === 'policy',
    cancelButtonText: 'Delete Policy ('+deletionCost+')'
  }).then((result) => {
    if (item.type === 'policy' && result.isDismissed && result.dismiss === Swal.DismissReason.cancel) {
      PolicyFunctions.deletePolicy(gameState, item, deletionCost);
    }
  });
}

export function createDragBehavior(svg) {
  let drag = d3.drag()
    .on("start", function(event, d) {
      d3.select(this).attr("stroke", "black").classed("node-dragging", true);;
    })
    .on("drag", function(event, d) {
    	d.pos.x = d.x = event.x;
      d.pos.y = d.y = event.y;
    	d3.select(this)
      	.attr("cx", d.x)
        .attr("cy", d.y);
        
      updateLines(svg, d);
      updateLabels(svg, d);
    })
    .on("end", function(event, d) {
      d3.select(this).attr("stroke", null).classed("node-dragging", false);;
    });
  return drag;
}

export function calculateNodePositions(nodes) {
  let uniqueCategories = Array.from(new Set(nodes.map(node => node.category)));
  const centerX = 700; // Center X coordinate of the canvas
  const centerY = 320; // Center Y coordinate of the canvas
  const radius = Math.min(1500, 500) / 3; // Adjust the radius based on the canvas size

  let categoryArcs = {};

  uniqueCategories.forEach((category, index) => {
    const anglePerCategory = 2 * Math.PI / uniqueCategories.length;
    const startAngle = index * anglePerCategory;
    const endAngle = (index + 1) * anglePerCategory;
    const arc = d3.arc()
      .innerRadius(radius - 20) // Adjust as needed
      .outerRadius(radius)
      .startAngle(startAngle)
      .endAngle(endAngle);
    categoryArcs[category] = arc;
  });

  nodes.forEach((node) => {
    const category = node.category;
    const arc = categoryArcs[category];
    const angle = Math.random() * (arc.endAngle() - arc.startAngle()) + arc.startAngle();
    const position = arc.centroid(angle);

    const x = centerX + position[0] + Math.random() * 20; // Add random offset to X coordinate
    const y = centerY + position[1] + Math.random() * 20; // Add random offset to Y coordinate

    node.pos = {
      x: x,
      y: y,
      fx: x, // Set initial position for dragging
      fy: y
    }; // Save the node's position

    node.radius = node.type === 'state' ? node.value / 5 : 20; // Save the node's radius
  });

// Check for collisions and adjust positions
  nodes.forEach((node, index) => {
    const x = node.pos.x;
    const y = node.pos.y;
    const radius = node.radius;
    const collision = checkCollision(nodes, node, x, y, radius);
    if (collision) {
      // Collision detected: Adjust position by moving the node towards or away from the center by at least the radius length
      const category = node.category;
      const arc = categoryArcs[category];
      const angle = Math.random() * (arc.endAngle() - arc.startAngle()) + arc.startAngle();
      const position = arc.centroid(angle);

      const nodeX = centerX + position[0]; // X coordinate without random offset
      const nodeY = centerY + position[1]; // Y coordinate without random offset

      const dx = nodeX - centerX;
      const dy = nodeY - centerY;
      const distance = Math.sqrt(dx * dx + dy * dy);

      const offsetX = (dx / distance) * 5 * radius; // Offset towards or away from the center in the X direction
      const offsetY = (dy / distance) * 5 * radius; // Offset towards or away from the center in the Y direction

      const newX = centerX + offsetX; // Adjusted X coordinate
      const newY = centerY + offsetY; // Adjusted Y coordinate

      node.pos.x = newX;
      node.pos.y = newY;
    }
  });
}

function checkCollision(nodes, currentNode, x, y, radius) {
  for (let i = 0; i < nodes.length; i++) {
    const otherNode = nodes[i];
    if (otherNode !== currentNode) {
      const otherX = otherNode.pos.x;
      const otherY = otherNode.pos.y;
      const otherRadius = otherNode.radius;
      const dx = otherX - x;
      const dy = otherY - y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance < otherRadius + radius) {
        return true; // Collision detected
      }
    }
  }
  return false; // No collision detected
}


export function updateLines(svg, d) {
  svg.selectAll('.flowing-line')
      .filter(function(lineData) {
        return lineData.from === d.id;
      })
      .attr("x1", a => d.x)
      .attr("y1", a => d.y);
            
  svg.selectAll('.flowing-line')
      .filter(function(lineData) {
        return lineData.to === d.id;
      })
      .attr("x2", a => d.x)
      .attr("y2", a => d.y);
}

export function updateLabels(svg, d) {
  svg.selectAll('.node-label') 
      .filter(function(nodeData) {
      	return nodeData && nodeData.id === d.id;
      })
      .attr("x", a => d.x)
      .attr("y", a => d.y+30);
}

export function filterVoterNodes(gameState) {
  return gameState.nodes.filter(node => node.type === "voter");
}

export function filterStateAndPolicyNodes(gameState) {
  return gameState.nodes.filter(node => node.type !== "voter");
}

export function calculateVoterNodePositions(voterNodes) {
  voterNodes.forEach((node, index) => {
    const x = 50;
    const y = 10 + index * 35;
    const width = 140;
    const height = 30;

    node.pos = {
      x: x+width-20,
      y: y+height/2-2
    };
  });
}

export function drawVoterNodesAndLabels(svg, voterNodes, gameState) {
  voterNodes.forEach((node, index) => {
    const x = 50;
    const y = 10 + index * 35;
    const width = 140;
    const height = 30;

    svg.append("rect")
      .attr("x", x)
      .attr("y", y)
      .attr("width", width)
      .attr("height", height)
      .style("fill", "lightgray")
      .classed("node-rectangle", true)
      .on("click", function() {
        showDetails(gameState, node);
      })
      .on("mouseover", () => {
        ImpactFunctions.showImpactStrength(node);
		    // Adjust opacity of lines
		    svg.selectAll(`.flowing-line`).attr('stroke-opacity', 0.2);
		    svg.selectAll(`.line-${node.id}`).attr('stroke-opacity', 1);
      })
      .on("mouseout", () => {
        ImpactFunctions.hideImpactStrength();
		    // Reset opacity of lines
		    svg.selectAll(`.flowing-line`).attr('stroke-opacity', function() {
			    return d3.select(this).attr("data-default-opacity");
			  });
      })

			// Draw the approval rating rectangle
			let approvalColor;
			if (node.finalApproval > 70) {
			  approvalColor = "green";
			} else if (node.finalApproval >= 30) {
			  approvalColor = "orange";
			} else {
			  approvalColor = "red";
			}

			svg.append("rect")
			  .attr("x", x)
			  .attr("y", y)
			  .attr("width", width * node.finalApproval / 100) // approval attribute is a percentage
			  .attr("height", height)
			  .style("fill", approvalColor)
			  .style("opacity", 0.5) // make the rectangle semi-transparent
			  .classed("approval-rating-rectangle", true)
	      .on("click", function() {
	        showDetails(gameState, node);
	      })
	      .on("mouseover", () => {
	        ImpactFunctions.showImpactStrength(node);
			    // Adjust opacity of lines
			    svg.selectAll(`.flowing-line`).attr('stroke-opacity', 0.2);
			    svg.selectAll(`.line-${node.id}`).attr('stroke-opacity', 1);
	      })
	      .on("mouseout", () => {
	        ImpactFunctions.hideImpactStrength();
			    // Reset opacity of lines
			    svg.selectAll(`.flowing-line`).attr('stroke-opacity', function() {
				    return d3.select(this).attr("data-default-opacity");
				  });
	      })

	    // Draw the label
	    svg.append("text")
	      .attr("x", x + width / 2)
	      .attr("y", y + height / 2)
	      .attr("text-anchor", "middle")
	      .attr("alignment-baseline", "middle")
	      .text(node.name)
	      .classed("node-label", true)
	      .classed("node-label-voter", true);
	  });
}

export function drawImpactLines(svg, gameState, groupedImpacts) {
  for (let key in groupedImpacts) {
    let impacts = groupedImpacts[key];
    let node1 = gameState.nodes.find(node => node.id === impacts[0].from);
    let node2 = gameState.nodes.find(node => node.id === impacts[0].to);

		// Check if the nodes have positions
    if (node1 && node2 && node1.pos && node2.pos) {
	    // Calculate offset for parallel lines
	    let dx = node2.pos.x - node1.pos.x;
	    let dy = node2.pos.y - node1.pos.y;
	    let len = Math.max(Math.sqrt(dx * dx + dy * dy), 0.0000001);
	    let offset = 5;

	    // Calculate offset vector
	    let ox = (dy / len) * offset;
	    let oy = -(dx / len) * offset;

	    impacts.forEach((impact, index) => {
	      // Calculate position of the line
	      let posX = index === 0 ? 1 : -1;

	      // Draw line
	      let opacity = Math.abs(impact.impact) / 100; 
	      let line = svg.append("line")
	      	.datum(impact) // Bind the data to the line
	        .attr("x1", node1.pos.x + posX * ox)
	        .attr("y1", node1.pos.y + posX * oy)
	        .attr("x2", node2.pos.x + posX * ox)
	        .attr("y2", node2.pos.y + posX * oy)
	        .attr("stroke", impact.impact > 0 ? "green" : "red")
	        .attr("stroke-opacity", opacity+0.1) // make the line transparent
	        .attr("data-default-opacity", opacity+0.1)
	        .attr("stroke-width", 15)
	        .attr("marker-end", "url(#triangle)")
	        .attr("class", `line-${node1.id} line-${node2.id}`)
	        .classed("flowing-line", true)

	      // Calculate the number of gaps
	      const lineLength = line.node().getTotalLength();
	      const totalGaps = Math.floor(lineLength / 10); // Adjust the gap width as needed
	      const gapLength = lineLength / totalGaps;
	      const gapArray = Array.from({
	        length: totalGaps
	      }, (_, i) => `${gapLength} ${gapLength}`).join(" ");

	      // Calculate the animation duration based on the impact value
	      const animationDuration = Math.max(100 - Math.abs(impact.impact), 0); // Adjust the scaling factor as needed

	      // Determine the direction of the line
	      const isForward = impact.from === node1.id && impact.to === node2.id;


	      // Set the animation properties
	      line.style("animation-duration", `${animationDuration}s`)
	        .style("animation-timing-function", "linear")
	        .style("animation-iteration-count", "infinite")
	        .style("animation-name", isForward ? "flowAnimationForwards" : "flowAnimationBackwards")
	        .style("animation-fill-mode", "forwards");

	      // Animate the gaps
	      line.attr("stroke-dasharray", gapArray);

	    });
	  }
  }
}