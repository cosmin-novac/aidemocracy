import * as RenderFunctions from './renderFunctions.js';
import * as ImpactFunctions from './impactFunctions.js';
import * as PolicyFunctions from './policyFunctions.js';
import * as GameState from './gameState.js';

$(document).ready(function() {
  window.alert = function (message) {
    Swal.fire({
      // title: 'Alert',
      text: message,
      icon: 'warning'
    });
  };

$(document).on('click', '#add-policy', function() {
  PolicyFunctions.generateFivePolicies(GameState.gameState, GameState.getSavedAPIKey(), function(policies) {
    let policyOptionsHtml = '';
    for (let i = 0; i < policies.length; i++) {
      policyOptionsHtml += `
        <input type="radio" id="policy-option-${i}" name="policy-option" value="${policies[i].name}">
        <label for="policy-option-${i}">${policies[i].name} (${policies[i].description})</label><br>
      `;
    }
    Swal.fire({
      title: 'Enter Policy Details',
      html: `
        ${policyOptionsHtml}
        <label for="custom-policy">Or enter your own policy:</label><br>
        <input id="swal-input1" class="swal2-input" placeholder="Policy Name">
        <input id="swal-input2" class="swal2-input" placeholder="Policy Description (Optional)">
      `,
      focusConfirm: false,
      preConfirm: () => {
        const selectedPolicyOption = $('input[name=policy-option]:checked').val();
        if (selectedPolicyOption) {
          return [selectedPolicyOption, ''];
        } else {
          return [
            document.getElementById('swal-input1').value,
            document.getElementById('swal-input2').value
          ];
        }
      },
      didOpen: () => {
        const input1 = document.getElementById('swal-input1');
        const input2 = document.getElementById('swal-input2');

        input1.addEventListener('keydown', handleSwalInputKeyDown);
        input2.addEventListener('keydown', handleSwalInputKeyDown);
      }
    }).then((result) => {
      if (result.value) {
        const newPolicy = {
          id: result.value[0].toLowerCase().replace(/\s/g, ""),
          name: result.value[0],
          description: result.value[1],
          type: "policy",
          cost: 30
        };

        PolicyFunctions.addPolicyAndGenerateImpacts(GameState.gameState, GameState.getSavedAPIKey(), newPolicy)
      }
    });
  }, function(xhr, textStatus, errorThrown) {
    let errorMessage;
    if (xhr.status === 401) {
      errorMessage = 'API key is missing or invalid. Please check your settings.';
    } else {
      errorMessage = `Error calling GPT-3 API: ${xhr.responseText}`;
    }
    alert(errorMessage);
  });
});


  // Function to handle Enter key press in Swal input fields
  function handleSwalInputKeyDown(event) {
    if (event.key === 'Enter') {
      event.preventDefault();
      Swal.clickConfirm();
    }
  }

  // Event listener for settings button
  $(document).on('click', '#settings-button', function() {
    Swal.fire({
      title: 'Settings',
      html: `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
          <label for="api-key-input" style="margin-right: 10px;">OpenAI API Key</label>
          <input id="api-key-input" class="swal2-input" placeholder="Enter your OpenAI API key" value="${GameState.getSavedAPIKey()}" style="flex-grow: 1;margin: 10px;">
        </div>
        <div style="display: flex; flex-direction: column;">
          <button id="save-game" class="swal2-button" style="width: 100%; margin-top: 10px;">Save Game</button>
          <button id="load-game" class="swal2-button" style="width: 100%; margin-top: 10px;">Load Game</button>
        </div>
      `,
      focusConfirm: false,
      preConfirm: () => {
        const apiKey = document.getElementById('api-key-input').value;
        GameState.saveAPIKey(apiKey);
      }
    });
  });

  // Save game state to localStorage
  $(document).on('click', '#save-game', function(){
    Swal.fire({
      title: 'Enter a name for your save',
      input: 'text',
      inputAttributes: {
        autocapitalize: 'off'
      },
      showCancelButton: true,
      confirmButtonText: 'Save',
      showLoaderOnConfirm: true,
      preConfirm: (saveName) => {
        let savedGameStates = JSON.parse(localStorage.getItem('savedGameStates')) || {};
        savedGameStates[saveName] = GameState.gameState;

        // Update the node positions
        for (let node of savedGameStates[saveName].nodes) {
          node.pos.x = node.x;
          node.pos.y = node.y;
        }

        localStorage.setItem('savedGameStates', JSON.stringify(savedGameStates));
      },
      allowOutsideClick: () => !Swal.isLoading()
    });
  });

  // Load game state from localStorage
  $(document).on('click', '#load-game', function(){
    let savedGameStates = JSON.parse(localStorage.getItem('savedGameStates')) || {};
    let saveNames = Object.keys(savedGameStates);

    if(saveNames.length > 0){
      let selectHTML = '<select id="load-game-select" class="modal-select" style="width: 100%; padding: 10px; font-size: 16px;">';
      saveNames.forEach((saveName) => {
        selectHTML += `<option value="${saveName}">${saveName}</option>`;
      });
      selectHTML += '</select>';

      Swal.fire({
        title: 'Load Game',
        html: `
          <p>Select a game to load.</p>
          ${selectHTML}
          <button id="delete-game" class="modal-button delete-button" style="width: 100%; margin-top: 10px;">Delete Selected Save</button>
        `,
        showCancelButton: true,
        confirmButtonText: 'Load',
        cancelButtonText: 'Cancel',
        preConfirm: () => {
          let selectedSaveName = document.getElementById('load-game-select').value;
          $("#loaded-game-name").text(selectedSaveName);
          GameState.updateGameState(savedGameStates[selectedSaveName]);
        }
      });
    } else {
      Swal.fire({
        title: 'No Saved Games',
        text: 'You have no saved games. To save a game, click "Save Game" in the settings menu.',
        icon: 'info'
      });
    }
  });

  $(document).on('click', '#delete-game', function(e){
    e.preventDefault(); // Prevent form submission
    let savedGameStates = JSON.parse(localStorage.getItem('savedGameStates')) || {};
    let selectedSaveName = document.getElementById('load-game-select').value;

    // Remove selected game from localStorage
    delete savedGameStates[selectedSaveName];
    localStorage.setItem('savedGameStates', JSON.stringify(savedGameStates));

    // Refresh the select options
    let selectHTML = '<select id="load-game-select">';
    Object.keys(savedGameStates).forEach((saveName) => {
      selectHTML += `<option value="${saveName}">${saveName}</option>`;
    });
    selectHTML += '</select>';

    // Update the modal content
    Swal.update({
      html: selectHTML + '<button id="delete-game" class="modal-button delete-button">Delete Selected Save</button>'
    });
  });


  // Event listener for ending round
  $(document).on('click', '#end-round', function() {
    const refillAmount = 100; // Define the amount of credits to refill at the end of a round
    GameState.gameState.credits += refillAmount;
    GameState.gameState.currentRound += 1; // Increment the round value

    // Call the generateEvent function when a round ends
    PolicyFunctions.generateEvent(GameState.gameState, GameState.getSavedAPIKey());
    
    GameState.calculateFinalScore(GameState.gameState); 
    RenderFunctions.renderGameState(GameState.gameState);
  });

  //info
  const infoButton = document.getElementById('info-button');
  const gameDescription = document.getElementById('game-description');
  infoButton.addEventListener('mouseenter', function() {gameDescription.classList.add('visible')});
  infoButton.addEventListener('mouseleave', function() {gameDescription.classList.remove('visible')});

  // Initial render
  GameState.calculateFinalScore(GameState.gameState); 
  RenderFunctions.renderGameState(GameState.gameState);
  $('#loading-overlay').hide()
});
