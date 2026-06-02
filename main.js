// main.js — Application bootstrap and event handlers
import * as GameState from './gameState.js';
import * as RenderFunctions from './renderFunctions.js';
import * as Narrator from './narrator.js';

document.addEventListener("DOMContentLoaded", () => {
  // SweetAlert2's default heightAuto sets <html> height:auto when a modal opens,
  // which collapses our 100vh flex layout and visibly shifts the wheel. Disable it
  // globally so dialogs never reflow the page behind them.
  if (window.Swal) window.Swal = window.Swal.mixin({ heightAuto: false, scrollbarPadding: false });

  const endRoundBtn = document.getElementById("end-round");

  // ── Initial render + mandate briefing ──────────────────────────────────────
  RenderFunctions.renderGameState(GameState.gameState);
  RenderFunctions.setupPolicyEvents();
  RenderFunctions.showMandateBriefing(GameState.gameState);

  // ── End Round ───────────────────────────────────────────────────────────────
  endRoundBtn.addEventListener("click", async () => {
    const gs = GameState.gameState;
    if (gs.gameOver) return;

    endRoundBtn.disabled = true;
    const report = GameState.endRound(gs);
    RenderFunctions.renderGameState(gs);

    // Narrate (LLM if a key is set, otherwise a deterministic story)
    Swal.fire({ title: "Tallying the round…", html: "The press is filing its reports.",
      allowOutsideClick: false, didOpen: () => Swal.showLoading() });
    const { text } = await Narrator.narrateRound(report);

    await RenderFunctions.showRoundReport(report, text);

    if (report.election) {
      await RenderFunctions.showElectionResult(report.election, GameState.getGoal(gs)?.title);
    }

    endRoundBtn.disabled = !!GameState.gameState.gameOver;
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
            <label style="font-weight:600;display:block;margin-bottom:6px">OpenAI API Key
              <span style="font-weight:400;color:#94a3b8">(optional — enables gpt-4.1-nano round stories)</span></label>
            <input id="api-key-input" class="swal2-input" style="margin:0;width:100%" type="password"
                   placeholder="sk-…" value="${GameState.getApiKey()}">
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
          <div><button id="do-new-game" class="swal2-cancel swal2-styled" style="width:100%;margin:0">New Game</button></div>
        </div>`,
      showConfirmButton: true,
      confirmButtonText: "Done",
      preConfirm: () => GameState.saveApiKey(document.getElementById("api-key-input").value.trim()),
      didOpen: () => {
        document.getElementById("do-save").addEventListener("click", () => {
          const name = document.getElementById("save-name-input").value.trim();
          if (!name) return;
          GameState.saveApiKey(document.getElementById("api-key-input").value.trim());
          GameState.saveGame(name);
          Swal.fire({ icon: "success", title: "Saved", text: `Game saved as "${name}".`, timer: 1500, showConfirmButton: false });
        });
        document.getElementById("do-load").addEventListener("click", () => {
          const name = document.getElementById("save-select").value;
          if (!name) return;
          try {
            GameState.loadGame(name);
            Swal.fire({ icon: "success", title: "Loaded", text: `"${name}" loaded.`, timer: 1500, showConfirmButton: false })
              .then(() => { endRoundBtn.disabled = !!GameState.gameState.gameOver; });
          } catch {
            Swal.fire({ icon: "error", title: "Load Failed", text: "Save data appears corrupted." });
          }
        });
        document.getElementById("do-new-game").addEventListener("click", () => {
          Swal.fire({
            title: "New Game?", text: "All unsaved progress will be lost.", icon: "warning",
            showCancelButton: true, confirmButtonText: "Yes, start over", confirmButtonColor: "#dc2626",
          }).then(r => {
            if (!r.isConfirmed) return;
            GameState.resetGameState();
            endRoundBtn.disabled = false;
            RenderFunctions.showMandateBriefing(GameState.gameState);
          });
        });
      },
    });
  });

  // ── Info button ───────────────────────────────────────────────────────────
  document.getElementById("info-btn").addEventListener("click", () => {
    Swal.fire({
      title: "How to play AI Democracy",
      html: `<div style="text-align:left">
        <p>You govern a modern democracy on a fixed mandate. Win by achieving your goal before the electorate throws you out.</p>
        <ul style="padding-left:20px">
          <li><strong>The wheel</strong> shows every policy area; click a sector to browse and enact policies. Enacted policies live inside their sector — busier areas grow larger.</li>
          <li><strong>Effects build gradually.</strong> Policies push the national indicators (left) along a curve over several rounds. Click any indicator to see its trajectory.</li>
          <li><strong>Approval</strong> (right) reflects how each voter group feels about the indicators they care about and the policies you pass. Hover a policy to see what it touches.</li>
          <li><strong>End the round</strong> to let the world evolve — events strike, and the press files a report on what happened.</li>
          <li><strong>Elections</strong> come every 16 rounds: hold ≥50% approval to stay in power.</li>
        </ul></div>`,
      confirmButtonText: "Got it",
    });
  });
});
