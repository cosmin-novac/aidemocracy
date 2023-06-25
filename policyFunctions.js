import * as RenderFunctions from './renderFunctions.js';
import * as GameState from './gameState.js';

// Function to call GPT-3.5 Chat API and generate impacts
export function callOpenAI(apiKey, messages, successCallback, errorCallback) {
  $.ajax({
    url: 'https://api.openai.com/v1/chat/completions',
    type: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    data: JSON.stringify({
      messages,
      max_tokens: 300,
      temperature: 0.7,
      model: 'gpt-3.5-turbo'
    }),
    success: successCallback,
    error: errorCallback
  });
}

export function generateFivePolicies(gameState, apiKey, successCallback, errorCallback) {
  // Prepare the prompt for policy generation
  const messages = [
    {role: 'system', 
      content: 'You are a JSON generator AI for a javascript game called AI Democracy. In the game, users have the freedom to enact ANY policy decision they want, from economic to security to social measures, no matter how creatively weird, helpful, damaging, authoritarian or unrealistic it might be. \nThis is the state of the game you have to work with: \n\n' + JSON.stringify(gameState)},
    {role: 'assistant',
      content: 'Generate a JSON list of five different policy proposals to improve the game state along with a brief description and cost assessment of each. Please return ONLY the JSON file contents containing a list of potential impacts, and NOTHING else, neither descriptions nor details, so it can be added to the state of the game programatically later. \nHere is an example of a valid result: \n"[{name: "Policy1", description: "Description1",cost:20}, {name: "Policy2", description: "Description2",cost:15}, {name: "Policy3", description: "Description3",cost:25}, {name: "Policy4", description: "Description4",cost:10}, {name: "Policy5", description: "Description5",cost:30}]"'}
  ];

  // Show the loading overlay
  $('#loading-text').text('Proposing New Policies...');
  $('#loading-overlay').show();

  // Use the helper function to call the OpenAI API
  callOpenAI(apiKey, messages, function(response) {
    // On success, parse the generated response
    let policies;
    const generatedContent = response.choices[0].message.content;
    try {
    	console.log(generatedContent)
      policies = JSON.parse(generatedContent);
    } catch (error) {
    		$('#loading-overlay').hide();
      console.error(`Error parsing JSON response from AI: ${error}`);
      errorCallback('Invalid policy data received from AI. Please try again.');
      return;
    }
    // Check that we received an array of 5 policies
    if (!Array.isArray(policies) || policies.length !== 5) {
    		$('#loading-overlay').hide();
      errorCallback('Invalid number of policies received from AI. Please try again.');
      return;
    }
    // Check that each policy has a name and a description
    for (const policy of policies) {
      if (!policy.name || !policy.description) {
    		$('#loading-overlay').hide();
        errorCallback('Invalid policy data received from AI. Please try again.');
        return;
      }
    }
    $('#loading-overlay').hide();
    successCallback(policies);
  }, function(xhr, textStatus, errorThrown) {
    		$('#loading-overlay').hide();
    // On error, log the error and execute error callback
    console.error(`Error calling GPT-3 API: ${xhr.responseText}`);
    errorCallback(`Error calling GPT-3 API: ${xhr.responseText}`);
  });
}

export function generateImpacts(policy, gameState, apiKey) {
  const messages = [
      { role: 'system', content: 'You are a JSON generator AI for a javascript game called AI Democracy. In the game, users have the freedom to enact ANY policy decision they want, from economic to security to social measures, no matter how creatively weird, helpful, damaging, authoritarian or unrealistic it might be. \nThis is the state of the game you have to work with:\n\n' + JSON.stringify(gameState) },
      { role: 'assistant', content: `If the user input is even remotely related to a world simulation, then the AI will simulate the impacts of this added policy on the other (only where relevant) policies and states in the game and on the voter groups (as the "to" attribute), as well as the impact of the other policies and states on this new policy (as the "from" attribute). \n\n\nFor the policy titled: "${policy.name}" (optionally described as: "${policy.description}"), what would be the impacts given and received? Please return ONLY the JSON file contents containing a list of potential impacts, and NOTHING else, neither descriptions nor details, so it can be added to the state of the game programatically later. \nHere is an example of a valid result for a weird policy titled "add guns in cakes", which is an entirely acceptable idea in this game: \n\n[{"from":"addgunsincakes","to":"education","impact":-30},{"from":"addgunsincakes","to":"crime","impact":30},{"from":"addgunsincakes","to":"seniors","impact":-10}]\n\nPlease try to avoid the following as much as possible, potentially never using it, but if the user input is completely, UTTERLY unrelated to any kind of activity, return "Please enter a valid policy measure." and an explanation.` }
  ];

  console.log(messages);

  // Show the loading overlay
  $('#loading-text').text('Analyzing the impact of your new Policy...');
  $('#loading-overlay').show();

  callOpenAI(apiKey, messages, function(response) {
    var impacts;
    var response = response.choices[0].message.content; // Extract the generated response
    console.log(response);
		  try {
		    impacts = JSON.parse(response); // Try parsing the JSON
		  } catch (error) {
		  	if (response.startsWith("Please")) {
		  		alert(response);
		      return;
		  	} else {
			    console.log("Error parsing JSON response. Attempting to fix malformed JSON.");
			    console.log(error);

			    // If there's an error parsing the JSON, let's try removing trailing characters and parse again
			    response = response.replace(/\s+[^}\]]*$/, '');

			    try {
			      impacts = JSON.parse(response); // Try parsing the JSON again
			    } catch (secondError) {
			      console.log(secondError);
			      alert('Invalid policy impact data received. Please try again.');
			      return;
			    }
			  }
		  }

			// Prepare the confirmation dialog
		  let html = '<p>Here are the potential impacts of your policy:</p><ul style="text-align:left">';
		  impacts.forEach(impact => {
		    html += `<li>${impact.to}: ${impact.impact}</li>`;
		  });
		  html += '</ul>';
		  html += `<p>This policy will cost you ${policy.cost} credits. Do you want to proceed?</p>`;

		  // Show the confirmation dialog
		  Swal.fire({
		    title: 'Confirm Policy',
		    html: html,
		    showCancelButton: true,
		    confirmButtonText: 'Yes, add it!',
		    cancelButtonText: 'No, cancel',
		    reverseButtons: true
		  }).then((result) => {
		    if (result.isConfirmed) {
		    	console.log("Policy confirmed")
		      // User confirmed, update the game state with the new policy and impacts
			    gameState.nodes.push(policy);
		      gameState.impacts.push(...impacts);

		      // Render the updated game state
    			GameState.calculateFinalScore(gameState); 
		      RenderFunctions.renderGameState(gameState);

		      $('#loading-overlay').hide();

		      Swal.fire(
		        'Added!',
		        'Your policy has been implemented.',
		        'success'
		      );
		    } else if (
		      /* Read more about handling dismissals below */
		      result.dismiss === Swal.DismissReason.cancel
		    ) {
		      $('#loading-overlay').hide();

		      Swal.fire(
		        'Cancelled',
		        'Your policy was not implemented.',
		        'error'
		      );
		    }
		  }).catch((error) => {
			  console.error('An error occurred: ', error);
			});

    $('#loading-overlay').hide();
    }, function(xhr, textStatus, errorThrown) {
	    let errorMessage;
	    if (xhr.status === 401) {
	      errorMessage = 'API key is missing or invalid. Please check your settings.';
	    } else {
	      errorMessage = `Error calling GPT-3 API: ${xhr.responseText}`;
	    }
	    alert(errorMessage);

    	$('#loading-overlay').hide();
	  });
}

// Function to generate an event using GPT-3
export function generateEvent(gameState, apiKey) {
  const messages = [
    {
      role: 'system', 
      content: 'You are a JSON generator AI for a javascript game called AI Democracy. Given the current game state, generate a random event. \n\n' + JSON.stringify(gameState)
    },
  ];

  // Show the loading overlay
  $('#loading-text').text('Ending the round...');
  $('#loading-overlay').show();

  callOpenAI(apiKey, messages, function(response) {
    var response = response.choices[0].message.content;
    let event;
    try {
      event = JSON.parse(response);
    } catch (error) {
      alert(response);
      return;
    }

    // Add the generated event to the game state
    console.log(event);
    gameState.events.push(event);

    // Render the updated game state
    GameState.calculateFinalScore(gameState); 
    RenderFunctions.renderGameState(gameState);

    Swal.fire({
      title: 'A New Event!',
      text: `An event has occurred: ${event.description}`
    });

    $('#loading-overlay').hide();

  }, function(xhr, textStatus, errorThrown) {
    let errorMessage;
    if (xhr.status === 401) {
      errorMessage = 'API key is missing or invalid. Please check your settings.';
    } else {
      errorMessage = `Error calling GPT-3 API: ${xhr.responseText}`;
    }
    alert(errorMessage);

    $('#loading-overlay').hide();
  });
}

// Function to add a policy and generate impacts
export function addPolicyAndGenerateImpacts(gameState, apiKey, newPolicy) {
  if (gameState.credits >= newPolicy.cost) {
    // Deduct the policy cost from available credits
    gameState.credits -= newPolicy.cost;

    // Call GPT-3 to generate impacts for the new policy
    generateImpacts(newPolicy, gameState, apiKey);

    GameState.calculateFinalScore(gameState); 
    RenderFunctions.renderGameState(gameState);
  } else {
    // Display a message or handle insufficient credits scenario
    alert("Insufficient credits to add the policy.");
  }
}

// Function to delete a policy and its connections, and trigger updates
export function deletePolicy(gameState, policy, deletionCost) {
  // Calculate the cost of deleting a policy

  // Deduct the deletion cost from available credits
  if (gameState.credits >= deletionCost) {
    gameState.credits -= deletionCost;

    // Delete the policy and its connections
    const index = gameState.nodes.findIndex(node => node.id === policy.id);
    if (index !== -1) {
      gameState.nodes.splice(index, 1);

      gameState.impacts = gameState.impacts.filter(impact => impact.from !== policy.id && impact.to !== policy.id);
    	GameState.calculateFinalScore(gameState); 
      RenderFunctions.renderGameState(gameState);// Update the D3 bubbles
    }
  } else {
    // Display a message or handle insufficient credits scenario
    alert("Insufficient credits to delete the policy.");
  }
}
