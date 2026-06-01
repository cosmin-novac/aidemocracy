// main.js — Application bootstrap and event handlers
import * as GameState from './gameState.js';
import * as RenderFunctions from './renderFunctions.js';

document.addEventListener("DOMContentLoaded", () => {

  // ── Initial render ────────────────────────────────────────────────────────
  RenderFunctions.renderGameState(GameState.gameState);
  RenderFunctions.setupPolicyEvents();

  // ── End Round ─────────────────────────────────────────────────────────────
  document.getElementById("end-round").addEventListener("click", () => {
    const gs = GameState.gameState;
    GameState.endRound(gs);
    RenderFunctions.renderGameState(gs);

    const approval = GameState.overallApproval(gs);
    const icon = approval >= 60 ? "success" : approval >= 40 ? "info" : "warning";
    Swal.fire({
      icon,
      title: `Round ${gs.currentRound - 1} Complete`,
      html: `<p>A new round begins. You received <strong>75 credits</strong>.</p>
             <p>Overall approval: <strong>${approval}%</strong></p>`,
      confirmButtonText: "Continue",
      timer: 3500,
      timerProgressBar: true,
    });
  });

  // ── Settings ──────────────────────────────────────────────────────────────
  document.getElementById("settings-btn").addEventListener("click", () => {
    const saves = GameState.listSaves();
    const saveOptions = saves.length
      ? saves.map(n => `<option value="${n}">${n}</option>`).join("")
      : `<option disabled>No saves found</option>`;

    Swal.fire({
      title: "Settings",
      html: `
        <div style="text-align:left">
          <div style="margin-bottom:16px">
            <label style="font-weight:600;display:block;margin-bottom:6px">Save Game</label>
            <div style="display:flex;gap:8px">
              <input id="save-name-input" class="swal2-input" style="margin:0;flex:1" placeholder="Save name…">
              <button id="do-save" class="swal2-confirm swal2-styled" style="margin:0;min-width:80px">Save</button>
            </div>
          </div>
          <div style="margin-bottom:16px">
            <label style="font-weight:600;display:block;margin-bottom:6px">Load Game</label>
            <div style="display:flex;gap:8px">
              <select id="save-select" class="swal2-input" style="margin:0;flex:1">${saveOptions}</select>
              <button id="do-load" class="swal2-confirm swal2-styled" style="margin:0;min-width:80px" ${!saves.length ? "disabled" : ""}>Load</button>
            </div>
          </div>
          <div>
            <button id="do-new-game" class="swal2-cancel swal2-styled" style="width:100%;margin:0">New Game</button>
          </div>
        </div>`,
      showConfirmButton: false,
      didOpen: () => {
        document.getElementById("do-save").addEventListener("click", () => {
          const name = document.getElementById("save-name-input").value.trim();
          if (!name) return;
          GameState.saveGame(name);
          Swal.fire({ icon: "success", title: "Saved", text: `Game saved as "${name}".`, timer: 1500, showConfirmButton: false });
        });

        document.getElementById("do-load").addEventListener("click", () => {
          const name = document.getElementById("save-select").value;
          if (!name) return;
          GameState.loadGame(name);
          Swal.close();
          Swal.fire({ icon: "success", title: "Loaded", text: `"${name}" loaded.`, timer: 1500, showConfirmButton: false });
        });

        document.getElementById("do-new-game").addEventListener("click", () => {
          Swal.fire({
            title: "New Game?",
            text: "All unsaved progress will be lost.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Yes, start over",
            confirmButtonColor: "#dc2626",
          }).then(r => {
            if (r.isConfirmed) {
              GameState.resetGameState();
              Swal.fire({ icon: "success", title: "New Game Started", timer: 1200, showConfirmButton: false });
            }
          });
        });
      },
    });
  });

  // ── Info button ───────────────────────────────────────────────────────────
  document.getElementById("info-btn").addEventListener("click", () => {
    Swal.fire({
      title: "About AI Democracy",
      html: `<p style="text-align:left">
        <strong>AI Democracy</strong> is a policy simulation game where you govern a modern democracy.
        Each round you receive <strong>Political Credits</strong> to spend on policies drawn from
        a curated catalogue spanning the economy, environment, healthcare, education, and much more.
      </p>
      <ul style="text-align:left;padding-left:20px">
        <li>Browse policies by category using the tabs in the Policy Browser.</li>
        <li>Click <em>Enact</em> to pass a policy and see its effects on national indicators and voter approval.</li>
        <li>Click <em>Repeal</em> (20 cr) to reverse a policy if it isn't working.</li>
        <li>End the round to receive 75 new credits and let the world drift slightly.</li>
        <li>Save and load your game from the Settings menu.</li>
      </ul>`,
      confirmButtonText: "Got it",
    });
  });
});
