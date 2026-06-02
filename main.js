// main.js — Application bootstrap and event handlers
import * as GameState from './gameState.js';
import * as RenderFunctions from './renderFunctions.js';
import * as Narrator from './narrator.js';

document.addEventListener("DOMContentLoaded", async () => {
  // SweetAlert2's default heightAuto collapses our 100vh flex layout when a modal
  // opens, shifting the wheel. Disable it globally.
  if (window.Swal) window.Swal = window.Swal.mixin({ heightAuto: false, scrollbarPadding: false });

  const endRoundBtn = document.getElementById("end-round");

  // ── Boot: resume autosave, else start a fresh government ────────────────────
  const loaded = await GameState.initFromSaveOrNew();
  RenderFunctions.renderGameState(GameState.gameState);
  RenderFunctions.setupPolicyEvents();
  endRoundBtn.disabled = !!GameState.gameState.gameOver;

  if (loaded) {
    Swal.fire({ icon: "info", title: "Game resumed", text: "Your saved government has been restored.", timer: 1400, showConfirmButton: false });
  } else {
    RenderFunctions.showMandateBriefing(GameState.gameState);
  }

  // ── Footer actions ───────────────────────────────────────────────────────────
  document.getElementById("add-policy-btn").addEventListener("click", () => RenderFunctions.openPolicyCatalog(GameState.gameState));
  document.getElementById("give-speech").addEventListener("click", () => RenderFunctions.showSpeechMenu(GameState.gameState));
  document.getElementById("open-cabinet").addEventListener("click", () => RenderFunctions.showCabinet(GameState.gameState));
  document.getElementById("open-budget").addEventListener("click", () => RenderFunctions.openBudget(GameState.gameState));
  document.getElementById("open-overton").addEventListener("click", () => RenderFunctions.showOverton(GameState.gameState));

  function confirmRestart() {
    Swal.fire({
      title: "Restart the game?", text: "Your current government and autosave will be wiped.", icon: "warning",
      showCancelButton: true, confirmButtonText: "Yes, restart", confirmButtonColor: "#dc2626",
    }).then(async r => {
      if (!r.isConfirmed) return;
      await GameState.restartGame();
      endRoundBtn.disabled = false;
      RenderFunctions.showMandateBriefing(GameState.gameState);
    });
  }

  // ── End Round ─────────────────────────────────────────────────────────────────
  endRoundBtn.addEventListener("click", async () => {
    const gs = GameState.gameState;
    if (gs.gameOver) return;
    endRoundBtn.disabled = true;

    const report = GameState.endRound(gs);
    RenderFunctions.renderGameState(gs);

    // Only show a "tallying" spinner if an LLM call is actually going to happen;
    // the deterministic fallback is instant, so skip it otherwise.
    if (GameState.getApiKey()) {
      Swal.fire({ title: "Tallying the round…", html: "The press is filing its reports.", allowOutsideClick: false, didOpen: () => Swal.showLoading() });
    }
    let text;
    try { ({ text } = await Narrator.narrateRound(report)); }
    catch { text = ""; }
    await RenderFunctions.showRoundReport(report, text || "The round passed.");

    if (report.election) await RenderFunctions.showElectionResult(report.election, GameState.getGoal(gs)?.title);
    endRoundBtn.disabled = !!GameState.gameState.gameOver;
  });

  // ── Settings ─────────────────────────────────────────────────────────────────
  document.getElementById("settings-btn").addEventListener("click", async () => {
    const saves = await GameState.listSaves();
    const saveOptions = saves.length ? saves.map(n => `<option value="${n}">${n}</option>`).join("") : `<option disabled>No saves found</option>`;
    Swal.fire({
      title: "Settings",
      html: `
        <div style="text-align:left">
          <div style="margin-bottom:16px">
            <label style="font-weight:600;display:block;margin-bottom:6px">OpenAI API Key
              <span style="font-weight:400;color:#94a3b8">(optional — enables gpt-4.1-nano round stories)</span></label>
            <input id="api-key-input" class="swal2-input" style="margin:0;width:100%" type="password" placeholder="sk-…" value="${GameState.getApiKey()}">
          </div>
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
            <label style="font-weight:600;display:block;margin-bottom:6px">New Game</label>
            <button id="do-restart" class="swal2-cancel swal2-styled" style="margin:0;width:100%">Restart with a fresh mandate</button>
          </div>
        </div>`,
      showConfirmButton: true, confirmButtonText: "Done",
      preConfirm: () => GameState.saveApiKey(document.getElementById("api-key-input").value.trim()),
      didOpen: () => {
        document.getElementById("do-save").addEventListener("click", async () => {
          const name = document.getElementById("save-name-input").value.trim();
          if (!name) return;
          GameState.saveApiKey(document.getElementById("api-key-input").value.trim());
          await GameState.saveGame(name);
          Swal.fire({ icon: "success", title: "Saved", text: `Game saved as "${name}".`, timer: 1500, showConfirmButton: false });
        });
        document.getElementById("do-load").addEventListener("click", async () => {
          const name = document.getElementById("save-select").value;
          if (!name) return;
          await GameState.loadGame(name);
          endRoundBtn.disabled = !!GameState.gameState.gameOver;
          Swal.fire({ icon: "success", title: "Loaded", text: `"${name}" loaded.`, timer: 1400, showConfirmButton: false });
        });
        document.getElementById("do-restart").addEventListener("click", () => { Swal.close(); confirmRestart(); });
      },
    });
  });

  // ── Info ─────────────────────────────────────────────────────────────────────
  document.getElementById("info-btn").addEventListener("click", () => {
    Swal.fire({
      title: "How to play AI Democracy",
      html: `<div style="text-align:left">
        <p>You govern a democracy of <strong>10,000 simulated citizens</strong>, each with their own politics. Win by achieving your mandate before the electorate throws you out.</p>
        <ul style="padding-left:20px">
          <li><strong>The wheel</strong>: click a sector to enact policies. Enacted policies live inside their sector; busier areas grow larger.</li>
          <li><strong>Effects build gradually</strong> along a curve — click an indicator (left) to see its trajectory.</li>
          <li><strong>Approval</strong> (right) is the average of the citizens in each group; click a group to see why they back or oppose you, and where they sit on the political compass.</li>
          <li><strong>Political capital</strong> funds policies. Earn it by being beloved, giving <em>speeches</em>, and appointing good <em>ministers</em>.</li>
          <li><strong>Elections</strong> come every ${GameState.TERM_LENGTH} rounds: hold ≥50% approval to stay in power.</li>
        </ul></div>`,
      confirmButtonText: "Got it",
    });
  });
});
