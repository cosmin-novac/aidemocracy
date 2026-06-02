// renderFunctions.js — Category-wheel renderer with cross-screen impact links,
// indicator curves, a goal banner, and round/election storytelling.
import { POLICIES, POLICY_CATEGORIES, METRICS } from './policies.js';
import * as GameState from './gameState.js';
import * as PolicyFunctions from './policyFunctions.js';

// ── Category colour map ───────────────────────────────────────────────────────
const CAT_COLORS = {
  "Economy":"#3b82f6","Taxation":"#6366f1","Labor":"#f59e0b","Welfare":"#10b981",
  "Healthcare":"#ef4444","Education":"#8b5cf6","Housing":"#f97316","Transport":"#0ea5e9",
  "Energy":"#eab308","Environment":"#22c55e","Immigration":"#a855f7","Justice":"#dc2626",
  "Civil Liberties":"#14b8a6","Technology":"#6b7280","Foreign Policy":"#64748b","Civic":"#0891b2",
};
const catColor = cat => CAT_COLORS[cat] || "#94a3b8";

// ── Lookups ───────────────────────────────────────────────────────────────────
const POLICY_BY_ID = new Map(POLICIES.map(p => [p.id, p]));
const METRIC_META  = new Map(METRICS.map(m => [m.id, m]));
const POLICY_LABEL_MAX_LENGTH = 18;
const SECTOR_WEIGHT_PER_POLICY = 0.55;   // how much each enacted policy widens its sector

let eventsBound = false;
let overlayFrame = null;

// ── Main render entry point ───────────────────────────────────────────────────
export function renderGameState(gs) {
  renderHeader(gs);
  renderGoalBanner(gs);
  renderMetrics(gs);
  renderPolicyWheel(gs);
  renderVoterPanel(gs);
  renderImpactOverlay(gs);
}

// ── Header ────────────────────────────────────────────────────────────────────
function renderHeader(gs) {
  const approval = GameState.overallApproval(gs);
  const approvalClass = approval >= 60 ? "approval-good" : approval >= 40 ? "approval-ok" : "approval-bad";
  document.getElementById("stat-round").textContent    = `Round ${gs.currentRound}`;
  document.getElementById("stat-credits").textContent  = `${gs.credits} Credits`;
  document.getElementById("stat-approval").textContent = `${approval}% Approval`;
  document.getElementById("stat-approval").className    = `stat-chip ${approvalClass}`;
  document.getElementById("stat-enacted").textContent  = `${gs.enactedPolicyIds.length} Policies`;
}

// ── Goal banner ─────────────────────────────────────────────────────────────────
function renderGoalBanner(gs) {
  const el = document.getElementById("goal-banner");
  if (!el) return;
  const { goal, progress } = GameState.evalGoal(gs);
  if (!goal) { el.innerHTML = ""; return; }
  const pct = Math.round(progress * 100);
  const termLen = 16;
  const inTerm = ((gs.currentRound - 1) % termLen) + 1;
  el.innerHTML = `
    <div class="goal-left">
      <span class="goal-flag">MANDATE</span>
      <span class="goal-title">${goal.title}</span>
      ${gs.goalAchieved ? `<span class="goal-done">✓ ACHIEVED</span>` : ""}
      <span class="goal-desc">${goal.description}</span>
    </div>
    <div class="goal-right">
      <div class="goal-progress-wrap" title="Mandate progress">
        <div class="goal-progress-bar"><div class="goal-progress-fill" style="width:${pct}%"></div></div>
        <span class="goal-progress-pct">${pct}%</span>
      </div>
      <span class="goal-term">Term ${gs.term} · Year ${inTerm}/${termLen}</span>
    </div>`;
}

// ── Metrics panel (left) ───────────────────────────────────────────────────────
function renderMetrics(gs) {
  const container = document.getElementById("metrics-list");
  if (!container) return;
  const byCat = {};
  for (const m of gs.metrics) (byCat[m.category] = byCat[m.category] || []).push(m);

  let html = "";
  for (const [cat, metrics] of Object.entries(byCat)) {
    const color = catColor(cat);
    html += `<div class="metric-group">
      <h3 class="metric-group-title" style="border-left:3px solid ${color};padding-left:8px">${cat}</h3>`;
    for (const m of metrics) {
      const bar   = Math.min(100, m.value / 2);
      const delta = Math.round(m.value - 100);
      const good  = m.lowerIsBetter ? delta <= 0 : delta >= 0;
      const sign  = delta >= 0 ? "+" : "";
      const barCls= good ? "bar-fill-good" : "bar-fill-bad";
      html += `
        <div class="metric-card" data-metric-id="${m.id}" title="${m.description} — click for trend">
          <div class="metric-name">${m.name}</div>
          <div class="metric-bar-wrap">
            <div class="metric-bar"><div class="${barCls}" style="width:${bar}%"></div></div>
            <span class="metric-value ${good ? "good" : "bad"}">${sign}${delta}</span>
          </div>
        </div>`;
    }
    html += `</div>`;
  }
  container.innerHTML = html;
}

// ── Voter panel (right) ─────────────────────────────────────────────────────────
function renderVoterPanel(gs) {
  const container = document.getElementById("voter-list");
  if (!container) return;
  // Sort by approval so the most volatile groups are easy to scan
  const voters = [...gs.voters];
  container.innerHTML = voters.map(v => {
    const pct = Math.round(v.approval);
    const cls = pct >= 60 ? "voter-good" : pct >= 40 ? "voter-ok" : "voter-bad";
    return `<div class="voter-row" data-voter-id="${v.id}" title="${v.description}">
      <span class="voter-name">${v.name}</span>
      <div class="voter-bar-wrap">
        <div class="voter-bar"><div class="voter-fill ${cls}" style="width:${pct}%"></div></div>
        <span class="voter-pct ${cls}">${pct}%</span>
      </div>
    </div>`;
  }).join("");
}

// ── The policy wheel (centre) ───────────────────────────────────────────────────
function polar(cx, cy, r, a) { return { x: cx + Math.sin(a) * r, y: cy - Math.cos(a) * r }; }

function arcPathD(cx, cy, r, a0, a1, sweep) {
  const p0 = polar(cx, cy, r, a0), p1 = polar(cx, cy, r, a1);
  const large = Math.abs(a1 - a0) > Math.PI ? 1 : 0;
  return `M${p0.x},${p0.y} A${r},${r} 0 ${large} ${sweep} ${p1.x},${p1.y}`;
}

function policyIsPositive(policy) {
  let score = 0;
  for (const e of policy.metricEffects) {
    const meta = METRIC_META.get(e.id);
    score += meta && meta.lowerIsBetter ? -e.change : e.change;
  }
  return score >= 0;
}

function layoutWedgeNodes(list, a0, a1, rInner, rOuter) {
  const n = list.length;
  if (!n) return [];
  const pad = (a1 - a0) * 0.14;
  const aLo = a0 + pad, aHi = a1 - pad;
  const cols = n <= 3 ? 1 : 2;
  const rows = Math.ceil(n / cols);
  return list.map((policy, j) => {
    const col = j % cols, row = Math.floor(j / cols);
    const rFrac = cols === 1 ? 0.52 : 0.40 + col * 0.34;
    const r = rInner + (rOuter - rInner) * rFrac;
    const aFrac = rows === 1 ? 0.5 : (row + 0.5) / rows;
    const a = aLo + aFrac * (aHi - aLo);
    return { policy, a, r, rows };
  });
}

const truncate = name => name.length > POLICY_LABEL_MAX_LENGTH
  ? `${name.slice(0, POLICY_LABEL_MAX_LENGTH - 1)}…` : name;

function renderPolicyWheel(gs) {
  const container = document.getElementById("svg-container");
  if (!container || typeof d3 === "undefined") return;

  const width  = container.clientWidth  || 700;
  const height = container.clientHeight || 600;
  const cx = width / 2, cy = height / 2;
  const radius = Math.max(120, Math.min(width, height) / 2 - 16);
  const hubR = radius * 0.17;

  const svg = d3.select(container).html("").append("svg")
    .attr("width", width).attr("height", height)
    .attr("viewBox", `0 0 ${width} ${height}`);
  const defs = svg.append("defs");

  const cats = POLICY_CATEGORIES;
  const enacted = new Set(gs.enactedPolicyIds);
  const byCat = {};
  for (const cat of cats) byCat[cat] = POLICIES.filter(p => enacted.has(p.id) && p.category === cat);

  // Variable sector sizes: more enacted policies → a wider slice
  const weights = cats.map(c => 1 + byCat[c].length * SECTOR_WEIGHT_PER_POLICY);
  const totalW = weights.reduce((s, w) => s + w, 0);
  let acc = 0;
  const spans = cats.map((c, i) => {
    const a0 = (acc / totalW) * 2 * Math.PI;
    acc += weights[i];
    const a1 = (acc / totalW) * 2 * Math.PI;
    return { cat: c, a0, a1 };
  });

  const sectorLayer = svg.append("g");
  const nodeLayer   = svg.append("g");
  const labelLayer  = svg.append("g");

  spans.forEach(({ cat, a0, a1 }, i) => {
    const color = catColor(cat);
    const arcGen = d3.arc().innerRadius(hubR).outerRadius(radius)
      .startAngle(a0).endAngle(a1).padAngle(0.01).cornerRadius(3);
    sectorLayer.append("path")
      .attr("d", arcGen()).attr("transform", `translate(${cx},${cy})`)
      .attr("class", "wheel-sector")
      .style("fill", color).style("fill-opacity", byCat[cat].length ? 0.16 : 0.09)
      .style("stroke", color).style("stroke-opacity", 0.45)
      .on("mouseover", function () { d3.select(this).style("fill-opacity", 0.26); })
      .on("mouseout",  function () { d3.select(this).style("fill-opacity", byCat[cat].length ? 0.16 : 0.09); })
      .on("click", () => openCategoryBrowser(GameState.gameState, cat))
      .append("title").text(`${cat} — ${byCat[cat].length} enacted · click to browse`);

    // curved, auto-flipped label
    const mid = (a0 + a1) / 2;
    const topHalf = Math.cos(mid) >= 0;
    const lr = radius * 0.9;
    const pathId = `wheel-label-${i}`;
    const d = topHalf ? arcPathD(cx, cy, lr, a0 + 0.04, a1 - 0.04, 1)
                      : arcPathD(cx, cy, lr, a1 - 0.04, a0 + 0.04, 0);
    defs.append("path").attr("id", pathId).attr("d", d);
    labelLayer.append("text").attr("class", "wheel-sector-label")
      .attr("dy", topHalf ? "0.9em" : "-0.35em").style("fill", color)
      .append("textPath").attr("href", `#${pathId}`).attr("startOffset", "50%")
      .style("text-anchor", "middle").text(cat.toUpperCase());
  });

  // Hub
  sectorLayer.append("circle").attr("cx", cx).attr("cy", cy).attr("r", hubR).attr("class", "wheel-hub");
  sectorLayer.append("text").attr("x", cx).attr("y", cy - 2).attr("text-anchor", "middle")
    .attr("class", "wheel-hub-count").text(gs.enactedPolicyIds.length);
  sectorLayer.append("text").attr("x", cx).attr("y", cy + 14).attr("text-anchor", "middle")
    .attr("class", "wheel-hub-label").text(gs.enactedPolicyIds.length === 1 ? "policy" : "policies");

  // Enacted policy nodes
  spans.forEach(({ cat, a0, a1 }) => {
    const nodes = layoutWedgeNodes(byCat[cat], a0, a1, hubR, radius);
    nodes.forEach(({ policy, a, r, rows }) => {
      const pos = polar(cx, cy, r, a);
      const nodeR = Math.max(7, Math.min(15, (radius - hubR) / (rows * 2.6)));
      nodeLayer.append("circle")
        .datum(policy)
        .attr("cx", pos.x).attr("cy", pos.y).attr("r", nodeR)
        .attr("class", "wheel-policy-node")
        .attr("data-policy-id", policy.id)
        .style("fill", catColor(cat))
        .on("mouseover", function () {
          d3.select(this).attr("r", nodeR + 3);
          highlightEffects(policy, true);
          focusPolicyLinks(policy.id);
        })
        .on("mouseout", function () {
          d3.select(this).attr("r", nodeR);
          highlightEffects(policy, false);
          clearLinkFocus();
        })
        .on("click", () => showPolicyDetails(GameState.gameState, policy));
      labelLayer.append("text").attr("class", "wheel-policy-label")
        .attr("x", pos.x).attr("y", pos.y + nodeR + 11).attr("text-anchor", "middle")
        .text(truncate(policy.name));
    });
  });
}

// ── Cross-screen impact links (the red/green animated connectors) ────────────────
function ensureOverlay() {
  let overlay = document.getElementById("impact-overlay");
  if (!overlay) {
    overlay = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    overlay.id = "impact-overlay";
    document.body.appendChild(overlay);
  }
  return overlay;
}

function rowAnchor(rowEl, bodyEl, side) {
  if (!rowEl || !bodyEl) return null;
  const r = rowEl.getBoundingClientRect();
  const b = bodyEl.getBoundingClientRect();
  const cyRow = r.top + r.height / 2;
  if (cyRow < b.top + 2 || cyRow > b.bottom - 2) return null;  // scrolled out of view
  return { x: side === "right" ? r.right - 4 : r.left + 4, y: cyRow };
}

function renderImpactOverlay(gs) {
  const overlay = ensureOverlay();
  while (overlay.firstChild) overlay.removeChild(overlay.firstChild);
  overlay.setAttribute("width", window.innerWidth);
  overlay.setAttribute("height", window.innerHeight);
  overlay.setAttribute("viewBox", `0 0 ${window.innerWidth} ${window.innerHeight}`);

  const container = document.getElementById("svg-container");
  const metricsBody = document.getElementById("metrics-list");
  const voterBody = document.getElementById("voter-list");
  if (!container) return;

  const svgNS = "http://www.w3.org/2000/svg";
  const addLine = (x1, y1, x2, y2, positive, pid) => {
    const line = document.createElementNS(svgNS, "line");
    line.setAttribute("x1", x1); line.setAttribute("y1", y1);
    line.setAttribute("x2", x2); line.setAttribute("y2", y2);
    line.setAttribute("class", `impact-link ${positive ? "pos" : "neg"}`);
    line.dataset.policyId = pid;
    overlay.appendChild(line);
  };

  for (const pid of gs.enactedPolicyIds) {
    const policy = POLICY_BY_ID.get(pid);
    if (!policy) continue;
    const node = container.querySelector(`circle.wheel-policy-node[data-policy-id="${pid}"]`);
    if (!node) continue;
    const nb = node.getBoundingClientRect();
    const nx = nb.left + nb.width / 2, ny = nb.top + nb.height / 2;

    for (const eff of policy.metricEffects) {
      const row = document.querySelector(`#metrics-list .metric-card[data-metric-id="${eff.id}"]`);
      const a = rowAnchor(row, metricsBody, "right");
      if (a) addLine(a.x, a.y, nx, ny, eff.change >= 0, pid);
    }
    for (const eff of policy.voterEffects) {
      const row = document.querySelector(`#voter-list .voter-row[data-voter-id="${eff.id}"]`);
      const a = rowAnchor(row, voterBody, "left");
      if (a) addLine(nx, ny, a.x, a.y, eff.change >= 0, pid);
    }
  }
}

function focusPolicyLinks(pid) {
  const overlay = document.getElementById("impact-overlay");
  if (!overlay) return;
  overlay.classList.add("focusing");
  overlay.querySelectorAll("line").forEach(l => {
    l.classList.toggle("focused", l.dataset.policyId === pid);
  });
}
function clearLinkFocus() {
  const overlay = document.getElementById("impact-overlay");
  if (!overlay) return;
  overlay.classList.remove("focusing");
  overlay.querySelectorAll("line.focused").forEach(l => l.classList.remove("focused"));
}

function scheduleOverlay() {
  if (overlayFrame !== null) return;
  overlayFrame = requestAnimationFrame(() => {
    overlayFrame = null;
    renderImpactOverlay(GameState.gameState);
  });
}

/** Flash the side-panel rows a policy affects. */
function highlightEffects(policy, on) {
  for (const e of policy.metricEffects) {
    const el = document.querySelector(`.metric-card[data-metric-id="${e.id}"]`);
    if (!el) continue;
    el.classList.remove("flash-pos", "flash-neg");
    if (on) el.classList.add(e.change >= 0 ? "flash-pos" : "flash-neg");
  }
  for (const e of policy.voterEffects) {
    const el = document.querySelector(`.voter-row[data-voter-id="${e.id}"]`);
    if (!el) continue;
    el.classList.remove("flash-pos", "flash-neg");
    if (on) el.classList.add(e.change >= 0 ? "flash-pos" : "flash-neg");
  }
}

// ── Browser modals ──────────────────────────────────────────────────────────────
function effectTags(policy) {
  return policy.metricEffects.slice(0, 3).map(e => {
    const sign = e.change >= 0 ? "+" : "";
    return `<span class="eff-tag ${e.change >= 0 ? "pos" : "neg"}">${sign}${e.change} ${e.id}</span>`;
  }).join(" ");
}

function policyRowHtml(gs, policy) {
  const isEnacted = gs.enactedPolicyIds.includes(policy.id);
  const canAfford = gs.credits >= policy.cost;
  const c = catColor(policy.category);
  const search = `${policy.name} ${policy.description} ${policy.category}`.toLowerCase();
  return `<div class="cat-policy-row ${isEnacted ? "enacted" : ""}" data-search="${search}">
    <div class="cat-policy-main">
      <div class="cat-policy-name">
        <span class="policy-cat-badge" style="background:${c}">${policy.category}</span>
        ${policy.name}${isEnacted ? ` <span class="enacted-badge">✓ enacted</span>` : ""}
      </div>
      <div class="cat-policy-desc">${policy.description}</div>
      <div class="policy-effects">${effectTags(policy)}</div>
    </div>
    <div class="cat-policy-side">
      <span class="policy-cost ${!canAfford && !isEnacted ? "cost-high" : ""}">${policy.cost} cr</span>
      ${isEnacted
        ? `<button class="btn-repeal" data-act="repeal" data-id="${policy.id}">Repeal</button>`
        : `<button class="btn-enact" data-act="enact" data-id="${policy.id}" ${!canAfford ? "disabled" : ""}>Enact</button>`}
      <button class="btn-details" data-act="details" data-id="${policy.id}">Details</button>
    </div>
  </div>`;
}

function openBrowser(gs, title, policies, withSearch) {
  const searchHtml = withSearch
    ? `<input id="cat-search" class="cat-search" type="search" placeholder="Search all policies…" aria-label="Search policies">`
    : "";
  const rows = policies.map(p => policyRowHtml(gs, p)).join("")
    || `<div class="empty-state">No policies in this category.</div>`;
  Swal.fire({
    title, width: 680, html: `${searchHtml}<div class="cat-browser">${rows}</div>`,
    confirmButtonText: "Close", confirmButtonColor: "#64748b",
    didOpen: () => {
      const root = Swal.getHtmlContainer();
      const search = root.querySelector("#cat-search");
      if (search) search.addEventListener("input", e => {
        const q = e.target.value.trim().toLowerCase();
        root.querySelectorAll(".cat-policy-row").forEach(row => {
          row.style.display = !q || row.dataset.search.includes(q) ? "" : "none";
        });
      });
      root.addEventListener("click", e => {
        const btn = e.target.closest("button[data-act]");
        if (!btn) return;
        const policy = POLICY_BY_ID.get(btn.dataset.id);
        if (!policy) return;
        const act = btn.dataset.act;
        Swal.close();
        if (act === "enact") showEnactConfirm(GameState.gameState, policy);
        else if (act === "repeal") showRepealConfirm(GameState.gameState, policy);
        else showPolicyDetails(GameState.gameState, policy);
      });
    },
  });
}

function openCategoryBrowser(gs, category) {
  openBrowser(gs, `${category} Policies`, POLICIES.filter(p => p.category === category), false);
}
export function openPolicyCatalog(gs) {
  openBrowser(gs, "Policy Catalogue", POLICIES, true);
}

// ── Indicator trend (bezier curve) modal ─────────────────────────────────────────
export function showIndicatorCurve(gs, metricId) {
  const m = gs.metrics.find(x => x.id === metricId);
  if (!m || typeof d3 === "undefined") return;
  const { history, future, target } = GameState.projectIndicator(gs, metricId, 12);
  const good = m.lowerIsBetter ? m.value <= 100 : m.value >= 100;

  Swal.fire({
    title: m.name,
    width: 560,
    html: `<p style="color:#64748b;margin:0 0 8px">${m.description}</p>
           <p style="margin:0 0 10px;font-size:13px">
             Current <strong>${Math.round(m.value)}</strong> ·
             Heading toward <strong>${Math.round(target)}</strong>
             <span style="color:#94a3b8">(${m.lowerIsBetter ? "lower is better" : "higher is better"})</span>
           </p>
           <div id="curve-chart"></div>
           <p style="font-size:12px;color:#94a3b8;margin:8px 0 0">
             Solid = recent history · dashed = projected trajectory if nothing changes.</p>`,
    confirmButtonText: "Close", confirmButtonColor: good ? "#10b981" : "#ef4444",
    didOpen: () => drawCurve(history, future, target),
  });
}

function drawCurve(history, future, target) {
  const el = document.getElementById("curve-chart");
  if (!el) return;

  const W = 480, H = 210, padL = 30, padR = 70, padT = 18, padB = 26;
  const past = history && history.length ? history.slice() : [100];
  const fut = future && future.length ? future.slice() : [];
  const series = [...past, ...fut];                 // one continuous timeline
  const splitIdx = past.length - 1;                 // index of "now"
  const nowVal = series[splitIdx];

  const x = d3.scaleLinear().domain([0, Math.max(1, series.length - 1)]).range([padL, W - padR]);
  const y = d3.scaleLinear().domain([0, 200]).range([H - padB, padT]);

  const svg = d3.select(el).html("").append("svg").attr("width", W).attr("height", H);

  // y reference ticks (0 / 100 / 200)
  for (const v of [0, 100, 200]) {
    svg.append("text").attr("x", padL - 6).attr("y", y(v) + 3).attr("text-anchor", "end")
      .attr("font-size", 9).attr("fill", "#cbd5e1").text(v);
  }

  // baseline 100 (grey) — label on the LEFT so it never collides with the target
  svg.append("line").attr("x1", padL).attr("x2", W - padR).attr("y1", y(100)).attr("y2", y(100))
    .attr("stroke", "#cbd5e1").attr("stroke-dasharray", "3 3");
  svg.append("text").attr("x", padL + 2).attr("y", y(100) - 5).attr("text-anchor", "start")
    .attr("font-size", 10).attr("fill", "#94a3b8").text("baseline");

  // target line + label on the RIGHT, only when it differs from the baseline
  if (Math.abs(target - 100) >= 1) {
    svg.append("line").attr("x1", padL).attr("x2", W - padR).attr("y1", y(target)).attr("y2", y(target))
      .attr("stroke", "#f59e0b").attr("stroke-opacity", 0.75).attr("stroke-dasharray", "5 4");
    svg.append("text").attr("x", W - padR + 6).attr("y", y(target) + 3).attr("text-anchor", "start")
      .attr("font-size", 10).attr("fill", "#b45309").text(`target ${Math.round(target)}`);
  }

  const mk = (idxOffset) => d3.line().x((_, i) => x(i + idxOffset)).y(d => y(d)).curve(d3.curveMonotoneX);

  // Solid = history up to now
  if (past.length >= 2) {
    svg.append("path").datum(past).attr("fill", "none").attr("stroke", "#3b82f6")
      .attr("stroke-width", 2.5).attr("d", mk(0));
  }
  // Dashed = projected future, joined to "now"
  if (fut.length) {
    const futSeg = series.slice(splitIdx);          // includes the "now" point so the line connects
    svg.append("path").datum(futSeg).attr("fill", "none").attr("stroke", "#3b82f6")
      .attr("stroke-width", 2.5).attr("stroke-dasharray", "6 5").attr("stroke-opacity", 0.55)
      .attr("d", mk(splitIdx));
  }

  // "Now" marker
  svg.append("circle").attr("cx", x(splitIdx)).attr("cy", y(nowVal)).attr("r", 4).attr("fill", "#1d4ed8");
  svg.append("text").attr("x", x(splitIdx)).attr("y", y(nowVal) - 8).attr("text-anchor", "middle")
    .attr("font-size", 10).attr("font-weight", 700).attr("fill", "#1d4ed8").text(Math.round(nowVal));
}

// ── Policy detail / confirm modals ───────────────────────────────────────────────
function effectsHtml(policy) {
  const mRows = policy.metricEffects.map(e => {
    const sign = e.change >= 0 ? "+" : ""; const cls = e.change >= 0 ? "good" : "bad";
    return `<tr><td>${e.id}</td><td class="${cls}">${sign}${e.change}</td></tr>`;
  }).join("");
  const vRows = policy.voterEffects.map(e => {
    const sign = e.change >= 0 ? "+" : ""; const cls = e.change >= 0 ? "good" : "bad";
    return `<tr><td>${e.id}</td><td class="${cls}">${sign}${e.change}</td></tr>`;
  }).join("");
  return `<p style="color:#64748b;margin:0 0 12px">${policy.description}</p>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;text-align:left">
      <div><strong>Indicator pressure</strong><table class="effect-table"><tbody>${mRows}</tbody></table></div>
      <div><strong>Voter sentiment</strong><table class="effect-table"><tbody>${vRows}</tbody></table></div>
    </div>
    <p style="font-size:12px;color:#94a3b8;margin:10px 0 0">Effects build up gradually over several rounds.</p>`;
}

export function showEnactConfirm(gs, policy) {
  const c = catColor(policy.category);
  Swal.fire({
    title: policy.name,
    html: `${effectsHtml(policy)}
      <p style="margin-top:14px;font-weight:600">Cost: <span style="color:${c}">${policy.cost} credits</span>
        &nbsp;·&nbsp; You have: ${gs.credits} credits</p>`,
    showCancelButton: true, confirmButtonText: "Enact Policy", cancelButtonText: "Cancel", confirmButtonColor: c,
  }).then(result => {
    if (!result.isConfirmed) return;
    const ok = PolicyFunctions.enactPolicy(policy);
    if (ok) Swal.fire({ icon: "success", title: "Policy Enacted", text: `${policy.name} is now in effect.`, timer: 1600, showConfirmButton: false });
    else Swal.fire({ icon: "error", title: "Insufficient Credits", text: `You need ${policy.cost} credits but only have ${gs.credits}.` });
  });
}

export function showRepealConfirm(gs, policy) {
  const repealCost = 20;
  Swal.fire({
    title: `Repeal: ${policy.name}`,
    html: `<p>Repealing lifts this policy's pressure on the nation and costs <strong>${repealCost} credits</strong>.</p>
           <p>You currently have <strong>${gs.credits} credits</strong>.</p>`,
    showCancelButton: true, confirmButtonText: "Repeal", cancelButtonText: "Keep It", confirmButtonColor: "#dc2626",
  }).then(result => {
    if (!result.isConfirmed) return;
    const ok = PolicyFunctions.repealPolicy(policy, repealCost);
    if (ok) Swal.fire({ icon: "success", title: "Policy Repealed", text: `${policy.name} has been repealed.`, timer: 1600, showConfirmButton: false });
    else Swal.fire({ icon: "error", title: "Insufficient Credits", text: `You need ${repealCost} credits to repeal a policy.` });
  });
}

export function showPolicyDetails(gs, policy) {
  const isEnacted = GameState.isEnacted(gs, policy.id);
  const c = catColor(policy.category);
  Swal.fire({
    title: policy.name,
    html: `<div style="display:inline-block;padding:2px 10px;border-radius:12px;background:${c};color:#fff;font-size:13px;margin-bottom:12px">${policy.category}</div>
      ${effectsHtml(policy)}
      ${isEnacted ? `<p style="margin-top:12px;color:#10b981;font-weight:600">✓ Currently enacted</p>` : ""}`,
    showCancelButton: true,
    confirmButtonText: isEnacted ? "Repeal (20 cr)" : "Enact",
    confirmButtonColor: isEnacted ? "#dc2626" : c, cancelButtonText: "Close",
  }).then(result => {
    if (!result.isConfirmed) return;
    if (isEnacted) showRepealConfirm(gs, policy); else showEnactConfirm(gs, policy);
  });
}

// ── Round / election / game-over storytelling ─────────────────────────────────────
function moverLine(m) {
  const improved = m.lowerIsBetter ? m.delta < 0 : m.delta > 0;
  const sign = m.delta >= 0 ? "+" : "";
  return `<li><span>${m.name}</span><span class="${improved ? "good" : "bad"}">${sign}${Math.round(m.delta)}</span></li>`;
}

export function showMandateBriefing(gs) {
  const { goal, parts, requireApproval } = GameState.evalGoal(gs);
  if (!goal) return Promise.resolve();
  const targetList = parts.map(p =>
    `<li>${p.name}: ${p.dir === "high" ? "reach" : "bring down to"} <strong>${p.target}</strong></li>`).join("");
  return Swal.fire({
    title: `Your Mandate: ${goal.title}`,
    html: `<p style="color:#475569">${goal.description}</p>
      <div style="text-align:left;margin:12px auto;max-width:380px">
        <strong>Targets to hit:</strong>
        <ul class="mandate-targets">${targetList}</ul>
        <p style="font-size:13px;color:#64748b">You govern in <strong>16-round terms</strong>. At each election you must hold
        <strong>≥ ${requireApproval}% approval</strong> to stay in power. Achieve your mandate before you are voted out.</p>
      </div>`,
    confirmButtonText: "Take office",
    confirmButtonColor: "#3b82f6",
  });
}

export function showRoundReport(report, narrative) {
  const swing = report.approvalAfter - report.approvalBefore;
  const swingTxt = swing === 0 ? "no change" : `${swing > 0 ? "+" : ""}${swing}%`;
  const eventsHtml = report.events.length
    ? `<div class="report-events">${report.events.map(e => `<div class="report-event"><strong>${e.title}</strong></div>`).join("")}</div>`
    : "";
  const moversHtml = report.movers.length
    ? `<ul class="report-movers">${report.movers.map(moverLine).join("")}</ul>`
    : `<p style="color:#94a3b8;font-size:13px">The indicators barely budged.</p>`;

  return Swal.fire({
    title: `Round ${report.round - 1} → ${report.round}`,
    width: 620,
    html: `
      <div class="report-narrative">${narrative}</div>
      ${eventsHtml}
      <div class="report-grid">
        <div><h4>Notable shifts</h4>${moversHtml}</div>
        <div><h4>State of the nation</h4>
          <p class="report-stat">Approval: <strong>${report.approvalAfter}%</strong> <span class="${swing >= 0 ? "good" : "bad"}">(${swingTxt})</span></p>
          <p class="report-stat">Treasury: <strong>${report.credits} cr</strong></p>
          <p class="report-stat">Mandate progress: <strong>${report.goalProgress}%</strong></p>
        </div>
      </div>
      ${report.goalNewlyAchieved ? `<div class="report-goal-done">🏆 Mandate achieved: ${report.goal}!</div>` : ""}`,
    confirmButtonText: "Carry on governing",
    confirmButtonColor: "#3b82f6",
  });
}

export function showElectionResult(election, goalTitle) {
  if (election.reElected) {
    return Swal.fire({
      icon: "success",
      title: `Re-elected! (Term ${election.term + 1})`,
      html: `<p>The nation has returned your government to power with <strong>${election.approval}% approval</strong>.</p>
        ${election.goalAchieved ? `<p style="color:#10b981;font-weight:600">Your mandate "${goalTitle}" is fulfilled — a historic government.</p>`
          : `<p>Your mandate "${goalTitle}" remains unfinished. The work continues.</p>`}`,
      confirmButtonText: "Begin the new term",
      confirmButtonColor: "#10b981",
    });
  }
  return showGameOver(election, goalTitle);
}

export function showGameOver(election, goalTitle) {
  const won = election.goalAchieved;
  return Swal.fire({
    icon: won ? "success" : "error",
    title: won ? "A Legacy Secured" : "Voted Out of Office",
    html: won
      ? `<p>Your government lost the election with ${election.approval}% approval — but you had already achieved your mandate, <strong>${goalTitle}</strong>.</p>
         <p style="font-weight:600;color:#10b981">History will remember this government kindly.</p>`
      : `<p>With only <strong>${election.approval}%</strong> approval, the electorate has thrown your government out.</p>
         <p>Your mandate — <strong>${goalTitle}</strong> — went unfulfilled.</p>`,
    confirmButtonText: "Start a new government",
    confirmButtonColor: won ? "#10b981" : "#dc2626",
    allowOutsideClick: false,
  }).then(() => {
    GameState.resetGameState();
    showMandateBriefing(GameState.gameState);
  });
}

// ── Event wiring (called once from main.js) ──────────────────────────────────────
export function setupPolicyEvents() {
  if (eventsBound) return;
  eventsBound = true;

  document.getElementById("browse-all")
    ?.addEventListener("click", () => openPolicyCatalog(GameState.gameState));

  document.getElementById("metrics-list")
    ?.addEventListener("click", e => {
      const card = e.target.closest(".metric-card");
      if (card?.dataset.metricId) showIndicatorCurve(GameState.gameState, card.dataset.metricId);
    });

  // Keep the impact overlay aligned as panels scroll or the window resizes
  document.getElementById("metrics-list")?.addEventListener("scroll", scheduleOverlay, { passive: true });
  document.getElementById("voter-list")?.addEventListener("scroll", scheduleOverlay, { passive: true });
  window.addEventListener("resize", scheduleOverlay, { passive: true });
}
