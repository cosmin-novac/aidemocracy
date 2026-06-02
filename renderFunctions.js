// renderFunctions.js — Wheel, panels, political compass, cabinet, speeches, and
// the round/election storytelling. Voters are an agent-based electorate (see
// gameState/population); groups are just trait slices of the 10k individuals.
import { POLICIES, POLICY_CATEGORIES, METRICS, VOTER_GROUPS } from './policies.js';
import { EXTRA_VOTERS, SPEECH_THEMES, PORTFOLIOS, MINISTERS, SIM } from './gameData.js';
import { iconBody, iconNameFor, iconDataUri, iconSvg } from './icons.js';
import * as Pop from './population.js';
import * as GameState from './gameState.js';
import * as PolicyFunctions from './policyFunctions.js';

// ── Category colours & group metadata ───────────────────────────────────────────
const CAT_COLORS = {
  "Economy":"#3b82f6","Taxation":"#6366f1","Labor":"#f59e0b","Welfare":"#10b981",
  "Healthcare":"#ef4444","Education":"#8b5cf6","Housing":"#f97316","Transport":"#0ea5e9",
  "Energy":"#eab308","Environment":"#22c55e","Immigration":"#a855f7","Justice":"#dc2626",
  "Civil Liberties":"#14b8a6","Technology":"#6b7280","Foreign Policy":"#64748b","Civic":"#0891b2",
};
const catColor = cat => CAT_COLORS[cat] || "#94a3b8";

const GROUP_META = new Map(
  [...VOTER_GROUPS, ...EXTRA_VOTERS].map(g => [g.id, { name: g.name, description: g.description }])
);
const groupName = id => GROUP_META.get(id)?.name || id;

const POLICY_BY_ID = new Map(POLICIES.map(p => [p.id, p]));
const METRIC_META  = new Map(METRICS.map(m => [m.id, m]));
const POLICY_LABEL_MAX_LENGTH = 18;
const SECTOR_WEIGHT_PER_POLICY = 0.55;

let eventsBound = false;
let overlayFrame = null;

// ── Main render ──────────────────────────────────────────────────────────────────
export function renderGameState(gs) {
  renderHeader(gs);
  renderGoalBanner(gs);
  renderMetrics(gs);
  renderPolicyWheel(gs);
  renderVoterPanel(gs);
  renderImpactOverlay(gs);
}

// ── Header ──────────────────────────────────────────────────────────────────────
function renderHeader(gs) {
  const approval = GameState.overallApproval(gs);
  const approvalClass = approval >= 60 ? "approval-good" : approval >= 40 ? "approval-ok" : "approval-bad";
  document.getElementById("stat-round").textContent    = `Round ${gs.currentRound}`;
  document.getElementById("stat-capital").textContent  = `${gs.capital} Political Capital`;
  document.getElementById("stat-approval").textContent = `${approval}% Approval`;
  document.getElementById("stat-approval").className    = `stat-chip ${approvalClass}`;
  document.getElementById("stat-enacted").textContent  = `${gs.enactedPolicyIds.length} Policies`;
}

// ── Goal banner ───────────────────────────────────────────────────────────────────
function renderGoalBanner(gs) {
  const el = document.getElementById("goal-banner");
  if (!el) return;
  const { goal, progress } = GameState.evalGoal(gs);
  if (!goal) { el.innerHTML = ""; return; }
  const pct = Math.round(progress * 100);
  const termLen = GameState.TERM_LENGTH;
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

// ── Metrics (left) ─────────────────────────────────────────────────────────────────
function renderMetrics(gs) {
  const container = document.getElementById("metrics-list");
  if (!container) return;
  const byCat = {};
  for (const m of gs.metrics) (byCat[m.category] = byCat[m.category] || []).push(m);
  let html = "";
  for (const [cat, metrics] of Object.entries(byCat)) {
    const color = catColor(cat);
    html += `<div class="metric-group"><h3 class="metric-group-title" style="border-left:3px solid ${color};padding-left:8px">${cat}</h3>`;
    for (const m of metrics) {
      const bar = Math.min(100, m.value / 2);
      const delta = Math.round(m.value - 100);
      const good = m.lowerIsBetter ? delta <= 0 : delta >= 0;
      const sign = delta >= 0 ? "+" : "";
      html += `<div class="metric-card" data-metric-id="${m.id}" title="${m.description} — click for trend">
        <div class="metric-name">${m.name}</div>
        <div class="metric-bar-wrap">
          <div class="metric-bar"><div class="${good ? "bar-fill-good" : "bar-fill-bad"}" style="width:${bar}%"></div></div>
          <span class="metric-value ${good ? "good" : "bad"}">${sign}${delta}</span>
        </div></div>`;
    }
    html += `</div>`;
  }
  container.innerHTML = html;
}

// ── Public approval (right) — agent-based groups ────────────────────────────────────
function renderVoterPanel(gs) {
  const container = document.getElementById("voter-list");
  if (!container) return;
  const el = GameState.getElectorate(gs);
  const groups = [...GROUP_META.keys()]
    .filter(id => (el.counts[id] || 0) > 0)
    .sort((a, b) => (el.counts[b] || 0) - (el.counts[a] || 0));

  const popSize = GameState.getPopulation(gs).size;
  container.innerHTML = groups.map(id => {
    const pct = Math.round(el.groupApproval[id] ?? 50);
    const cls = pct >= 60 ? "voter-good" : pct >= 40 ? "voter-ok" : "voter-bad";
    const sharePct = ((el.counts[id] / popSize) * 100).toFixed(0);
    return `<div class="voter-row" data-voter-id="${id}" title="${GROUP_META.get(id)?.description || ""} — click for detail (${sharePct}% of voters)">
      <span class="voter-name">${groupName(id)}</span>
      <div class="voter-bar-wrap">
        <div class="voter-bar"><div class="voter-fill ${cls}" style="width:${pct}%"></div></div>
        <span class="voter-pct ${cls}">${pct}%</span>
      </div>
    </div>`;
  }).join("");
}

// ── Policy wheel (centre) ───────────────────────────────────────────────────────────
function polar(cx, cy, r, a) { return { x: cx + Math.sin(a) * r, y: cy - Math.cos(a) * r }; }
function arcPathD(cx, cy, r, a0, a1, sweep) {
  const p0 = polar(cx, cy, r, a0), p1 = polar(cx, cy, r, a1);
  const large = Math.abs(a1 - a0) > Math.PI ? 1 : 0;
  return `M${p0.x},${p0.y} A${r},${r} 0 ${large} ${sweep} ${p1.x},${p1.y}`;
}
function layoutWedgeNodes(list, a0, a1, rInner, rOuter) {
  const n = list.length;
  if (!n) return [];
  const pad = (a1 - a0) * 0.14, aLo = a0 + pad, aHi = a1 - pad;
  const cols = n <= 3 ? 1 : 2, rows = Math.ceil(n / cols);
  return list.map((policy, j) => {
    const col = j % cols, row = Math.floor(j / cols);
    const r = rInner + (rOuter - rInner) * (cols === 1 ? 0.52 : 0.40 + col * 0.34);
    const a = aLo + (rows === 1 ? 0.5 : (row + 0.5) / rows) * (aHi - aLo);
    return { policy, a, r, rows };
  });
}
const truncate = name => name.length > POLICY_LABEL_MAX_LENGTH ? `${name.slice(0, POLICY_LABEL_MAX_LENGTH - 1)}…` : name;

function renderPolicyWheel(gs) {
  const container = document.getElementById("svg-container");
  if (!container || typeof d3 === "undefined") return;
  const width = container.clientWidth || 700, height = container.clientHeight || 600;
  const cx = width / 2, cy = height / 2;
  const radius = Math.max(120, Math.min(width, height) / 2 - 16), hubR = radius * 0.17;

  const svg = d3.select(container).html("").append("svg")
    .attr("width", width).attr("height", height).attr("viewBox", `0 0 ${width} ${height}`);
  const defs = svg.append("defs");
  const cats = POLICY_CATEGORIES;
  const enacted = new Set(gs.enactedPolicyIds);
  const byCat = {};
  for (const cat of cats) byCat[cat] = POLICIES.filter(p => enacted.has(p.id) && p.category === cat);

  const weights = cats.map(c => 1 + byCat[c].length * SECTOR_WEIGHT_PER_POLICY);
  const totalW = weights.reduce((s, w) => s + w, 0);
  let acc = 0;
  const spans = cats.map((c, i) => {
    const a0 = (acc / totalW) * 2 * Math.PI; acc += weights[i];
    return { cat: c, a0, a1: (acc / totalW) * 2 * Math.PI };
  });

  const sectorLayer = svg.append("g"), nodeLayer = svg.append("g"), labelLayer = svg.append("g");

  spans.forEach(({ cat, a0, a1 }, i) => {
    const color = catColor(cat);
    const arcGen = d3.arc().innerRadius(hubR).outerRadius(radius).startAngle(a0).endAngle(a1).padAngle(0.01).cornerRadius(3);
    sectorLayer.append("path").attr("d", arcGen()).attr("transform", `translate(${cx},${cy})`)
      .attr("class", "wheel-sector").style("fill", color).style("fill-opacity", byCat[cat].length ? 0.16 : 0.09)
      .style("stroke", color).style("stroke-opacity", 0.45)
      .on("mouseover", function () { d3.select(this).style("fill-opacity", 0.26); })
      .on("mouseout", function () { d3.select(this).style("fill-opacity", byCat[cat].length ? 0.16 : 0.09); })
      .on("click", () => openCategoryBrowser(GameState.gameState, cat))
      .append("title").text(`${cat} — ${byCat[cat].length} enacted · click to browse`);

    const mid = (a0 + a1) / 2, topHalf = Math.cos(mid) >= 0, lr = radius * 0.9, pathId = `wheel-label-${i}`;
    defs.append("path").attr("id", pathId)
      .attr("d", topHalf ? arcPathD(cx, cy, lr, a0 + 0.04, a1 - 0.04, 1) : arcPathD(cx, cy, lr, a1 - 0.04, a0 + 0.04, 0));
    labelLayer.append("text").attr("class", "wheel-sector-label").attr("dy", topHalf ? "0.9em" : "-0.35em").style("fill", color)
      .append("textPath").attr("href", `#${pathId}`).attr("startOffset", "50%").style("text-anchor", "middle").text(cat.toUpperCase());
  });

  // Hub
  sectorLayer.append("circle").attr("cx", cx).attr("cy", cy).attr("r", hubR).attr("class", "wheel-hub");
  sectorLayer.append("text").attr("x", cx).attr("y", cy - 2).attr("text-anchor", "middle").attr("class", "wheel-hub-count").text(gs.enactedPolicyIds.length);
  sectorLayer.append("text").attr("x", cx).attr("y", cy + 14).attr("text-anchor", "middle").attr("class", "wheel-hub-label").text(gs.enactedPolicyIds.length === 1 ? "policy" : "policies");

  // Nodes with per-policy icons
  spans.forEach(({ cat, a0, a1 }) => {
    layoutWedgeNodes(byCat[cat], a0, a1, hubR, radius).forEach(({ policy, a, r, rows }) => {
      const pos = polar(cx, cy, r, a);
      const nodeR = Math.max(8, Math.min(16, (radius - hubR) / (rows * 2.6)));
      const g = nodeLayer.append("g").attr("transform", `translate(${pos.x},${pos.y})`).style("cursor", "pointer");
      g.append("circle").datum(policy).attr("r", nodeR).attr("class", "wheel-policy-node").attr("data-policy-id", policy.id).style("fill", catColor(cat));
      const s = nodeR * 1.7;
      g.append("image").attr("href", iconDataUri(iconNameFor(policy), { stroke: "#ffffff" }))
        .attr("x", -s / 2).attr("y", -s / 2).attr("width", s).attr("height", s).style("pointer-events", "none");
      g.on("mouseover", function () { d3.select(this).attr("transform", `translate(${pos.x},${pos.y}) scale(1.18)`); highlightEffects(policy, true); focusPolicyLinks(policy.id); })
       .on("mouseout", function () { d3.select(this).attr("transform", `translate(${pos.x},${pos.y})`); highlightEffects(policy, false); clearLinkFocus(); })
       .on("click", () => showPolicyDetails(GameState.gameState, policy));
      labelLayer.append("text").attr("class", "wheel-policy-label").attr("x", pos.x).attr("y", pos.y + nodeR + 11).attr("text-anchor", "middle").text(truncate(policy.name));
    });
  });
}

// ── Cross-screen impact links (overlay) ─────────────────────────────────────────────
function ensureOverlay() {
  let o = document.getElementById("impact-overlay");
  if (!o) { o = document.createElementNS("http://www.w3.org/2000/svg", "svg"); o.id = "impact-overlay"; document.body.appendChild(o); }
  return o;
}
function rowAnchor(rowEl, bodyEl, side) {
  if (!rowEl || !bodyEl) return null;
  const r = rowEl.getBoundingClientRect(), b = bodyEl.getBoundingClientRect();
  const cyRow = r.top + r.height / 2;
  if (cyRow < b.top + 2 || cyRow > b.bottom - 2) return null;
  return { x: side === "right" ? r.right - 4 : r.left + 4, y: cyRow };
}
function renderImpactOverlay(gs) {
  const overlay = ensureOverlay();
  while (overlay.firstChild) overlay.removeChild(overlay.firstChild);
  overlay.setAttribute("width", window.innerWidth); overlay.setAttribute("height", window.innerHeight);
  overlay.setAttribute("viewBox", `0 0 ${window.innerWidth} ${window.innerHeight}`);
  const container = document.getElementById("svg-container");
  const metricsBody = document.getElementById("metrics-list"), voterBody = document.getElementById("voter-list");
  if (!container) return;
  const svgNS = "http://www.w3.org/2000/svg";
  const addLine = (x1, y1, x2, y2, positive, pid) => {
    const line = document.createElementNS(svgNS, "line");
    line.setAttribute("x1", x1); line.setAttribute("y1", y1); line.setAttribute("x2", x2); line.setAttribute("y2", y2);
    line.setAttribute("class", `impact-link ${positive ? "pos" : "neg"}`); line.dataset.policyId = pid;
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
      const a = rowAnchor(document.querySelector(`#metrics-list .metric-card[data-metric-id="${eff.id}"]`), metricsBody, "right");
      if (a) addLine(a.x, a.y, nx, ny, eff.change >= 0, pid);
    }
    for (const eff of policy.voterEffects) {
      const a = rowAnchor(document.querySelector(`#voter-list .voter-row[data-voter-id="${eff.id}"]`), voterBody, "left");
      if (a) addLine(nx, ny, a.x, a.y, eff.change >= 0, pid);
    }
  }
}
function focusPolicyLinks(pid) {
  const o = document.getElementById("impact-overlay"); if (!o) return;
  o.classList.add("focusing");
  o.querySelectorAll("line").forEach(l => l.classList.toggle("focused", l.dataset.policyId === pid));
}
function clearLinkFocus() {
  const o = document.getElementById("impact-overlay"); if (!o) return;
  o.classList.remove("focusing"); o.querySelectorAll("line.focused").forEach(l => l.classList.remove("focused"));
}
function scheduleOverlay() {
  if (overlayFrame !== null) return;
  overlayFrame = requestAnimationFrame(() => { overlayFrame = null; renderImpactOverlay(GameState.gameState); });
}
function highlightEffects(policy, on) {
  for (const e of policy.metricEffects) {
    const el = document.querySelector(`.metric-card[data-metric-id="${e.id}"]`); if (!el) continue;
    el.classList.remove("flash-pos", "flash-neg"); if (on) el.classList.add(e.change >= 0 ? "flash-pos" : "flash-neg");
  }
  for (const e of policy.voterEffects) {
    const el = document.querySelector(`.voter-row[data-voter-id="${e.id}"]`); if (!el) continue;
    el.classList.remove("flash-pos", "flash-neg"); if (on) el.classList.add(e.change >= 0 ? "flash-pos" : "flash-neg");
  }
}

// ── Political compass renderer (shared) ──────────────────────────────────────────────
function renderCompass(el, gs, { groupId = null } = {}) {
  if (!el || typeof d3 === "undefined") return;
  const pop = GameState.getPopulation(gs);
  const gov = gs.gov;
  const W = 360, H = 360, pad = 26;
  const x = d3.scaleLinear().domain([-100, 100]).range([pad, W - pad]);
  const y = d3.scaleLinear().domain([-100, 100]).range([H - pad, pad]); // soc +100 (authoritarian) at top
  const svg = d3.select(el).html("").append("svg").attr("width", W).attr("height", H).attr("class", "compass-svg");

  // density heatmap
  const d = pop.density, cw = (W - 2 * pad) / d.bins, ch = (H - 2 * pad) / d.bins;
  for (let bx = 0; bx < d.bins; bx++) for (let by = 0; by < d.bins; by++) {
    const c = d.grid[bx][by]; if (!c) continue;
    svg.append("rect").attr("x", pad + bx * cw).attr("y", pad + (d.bins - 1 - by) * ch).attr("width", cw + 0.5).attr("height", ch + 0.5)
      .attr("fill", "#3b82f6").attr("fill-opacity", 0.05 + 0.6 * (c / d.max));
  }
  // axes
  svg.append("line").attr("x1", x(0)).attr("x2", x(0)).attr("y1", pad).attr("y2", H - pad).attr("stroke", "#cbd5e1");
  svg.append("line").attr("x1", pad).attr("x2", W - pad).attr("y1", y(0)).attr("y2", y(0)).attr("stroke", "#cbd5e1");
  const axText = (tx, ty, anchor, t) => svg.append("text").attr("x", tx).attr("y", ty).attr("text-anchor", anchor).attr("font-size", 10).attr("fill", "#94a3b8").text(t);
  axText(pad, y(0) - 4, "start", "← Left"); axText(W - pad, y(0) - 4, "end", "Right →");
  axText(x(0) + 4, pad + 8, "start", "Authoritarian"); axText(x(0) + 4, H - pad - 2, "start", "Libertarian");

  // Overton window (mainstream ~ centred on population, ±45)
  const c = pop.centroid;
  svg.append("ellipse").attr("cx", x(c.econ)).attr("cy", y(c.soc))
    .attr("rx", Math.abs(x(45) - x(0))).attr("ry", Math.abs(y(0) - y(45)))
    .attr("class", "compass-window");

  // group scatter + centroid
  if (groupId) {
    const sample = Pop.sampleTrait(pop, groupId, 350);
    svg.append("g").selectAll("circle.gp").data(sample).enter().append("circle")
      .attr("cx", p => x(p.econ)).attr("cy", p => y(p.soc)).attr("r", 1.6).attr("fill", "#f97316").attr("fill-opacity", 0.5);
    const gc = pop.traitCentroid[groupId];
    svg.append("circle").attr("cx", x(gc.econ)).attr("cy", y(gc.soc)).attr("r", 6).attr("fill", "#f97316").attr("stroke", "#fff").attr("stroke-width", 2);
    svg.append("text").attr("x", x(gc.econ)).attr("y", y(gc.soc) - 9).attr("text-anchor", "middle").attr("font-size", 10).attr("font-weight", 700).attr("fill", "#c2410c").text("group");
  }
  // population centroid
  svg.append("circle").attr("cx", x(c.econ)).attr("cy", y(c.soc)).attr("r", 4).attr("fill", "#64748b");
  // government marker
  svg.append("circle").attr("cx", x(gov.econ)).attr("cy", y(gov.soc)).attr("r", 7).attr("fill", "#1d4ed8").attr("stroke", "#fff").attr("stroke-width", 2);
  svg.append("text").attr("x", x(gov.econ)).attr("y", y(gov.soc) - 10).attr("text-anchor", "middle").attr("font-size", 10).attr("font-weight", 800).attr("fill", "#1d4ed8").text("YOU");
}

// ── Group detail modal ───────────────────────────────────────────────────────────────
export function showGroupDetail(gs, groupId) {
  const el = GameState.getElectorate(gs);
  const pop = GameState.getPopulation(gs);
  const meta = GROUP_META.get(groupId) || { name: groupId, description: "" };
  const pct = Math.round(el.groupApproval[groupId] ?? 50);
  const size = el.counts[groupId] || 0;
  const sharePct = ((size / pop.size) * 100).toFixed(1);
  const cls = pct >= 60 ? "good" : pct >= 40 ? "" : "bad";
  const { pos, neg } = GameState.groupReasons(gs, groupId);
  const reasonLi = r => `<li><span>${r.kind === "indicator" ? "📊" : r.kind === "policy" ? "📜" : "🏛️"} ${r.name}</span><span>${r.value > 0 ? "+" : ""}${r.value}</span></li>`;
  const posHtml = pos.length ? `<ul class="reason-list">${pos.map(reasonLi).join("")}</ul>` : `<p class="reason-empty">Nothing in particular.</p>`;
  const negHtml = neg.length ? `<ul class="reason-list">${neg.map(reasonLi).join("")}</ul>` : `<p class="reason-empty">No major grievances.</p>`;

  Swal.fire({
    title: meta.name, width: 760,
    html: `<p style="color:#64748b;margin:0 0 8px">${meta.description}</p>
      <p style="margin:0 0 12px;font-size:13px"><strong>${sharePct}%</strong> of the electorate ·
        Approval <strong class="${cls}">${pct}%</strong></p>
      <div class="group-grid">
        <div class="group-reasons">
          <h4 class="good">Why they back you</h4>${posHtml}
          <h4 class="bad" style="margin-top:12px">Why they're wary</h4>${negHtml}
        </div>
        <div><div id="group-compass"></div>
          <p class="compass-legend"><span class="dot you"></span>You &nbsp; <span class="dot pop"></span>Public &nbsp; <span class="dot grp"></span>${meta.name}</p>
        </div>
      </div>`,
    confirmButtonText: "Close", confirmButtonColor: "#64748b",
    didOpen: () => renderCompass(document.getElementById("group-compass"), gs, { groupId }),
  });
}

export function showOverton(gs) {
  Swal.fire({
    title: "The Overton Window", width: 520,
    html: `<p style="color:#64748b;margin:0 0 6px">Where the electorate sits on the political compass, and where your government stands. The shaded zone is the mainstream "window" of acceptable politics.</p>
      <div id="overton-compass"></div>
      <p class="compass-legend"><span class="dot you"></span>Your government &nbsp; <span class="dot pop"></span>Public centre</p>`,
    confirmButtonText: "Close", confirmButtonColor: "#64748b",
    didOpen: () => renderCompass(document.getElementById("overton-compass"), gs, {}),
  });
}

// ── Cabinet modal ────────────────────────────────────────────────────────────────────
export function showCabinet(gs) {
  const portsHtml = PORTFOLIOS.map(port => {
    const seatedId = gs.cabinet[port.id];
    const cands = MINISTERS.filter(m => m.portfolio === port.id);
    const loyalty = Math.round(gs.loyalty[port.id] ?? 0);
    const candHtml = cands.map(m => {
      const seated = seatedId === m.id;
      const biasTxt = m.approvalBias.map(([t, d]) => `${d > 0 ? "+" : ""}${d} ${groupName(t)}`).join(", ");
      return `<div class="minister-card ${seated ? "seated" : ""}">
        <div class="minister-main">
          <div class="minister-name">${m.name}${seated ? ` <span class="seated-badge">in office · loyalty ${loyalty}%</span>` : ""}</div>
          <div class="minister-perks">+${m.capitalPerRound} capital/round · −${Math.round(m.costReduction * 100)}% ${port.name} cost · ×${m.effectiveness.toFixed(2)} effect</div>
          <div class="minister-bias">${biasTxt}</div>
        </div>
        <div class="minister-act">
          ${seated ? `<button class="btn-repeal" data-act="dismiss" data-port="${port.id}">Dismiss</button>`
                   : `<button class="btn-enact" data-act="appoint" data-port="${port.id}" data-min="${m.id}" ${gs.capital < SIM.APPOINT_COST ? "disabled" : ""}>Appoint (${SIM.APPOINT_COST})</button>`}
        </div>
      </div>`;
    }).join("");
    return `<div class="portfolio-block"><h4 class="portfolio-title">${port.name} <span>${port.categories.join(" · ")}</span></h4>${candHtml}</div>`;
  }).join("");

  Swal.fire({
    title: "Cabinet", width: 720,
    html: `<p style="color:#64748b;margin:0 0 10px">Ministers generate political capital, boost and discount their portfolio's policies, and sway the groups they champion — but a minister whose loyalty collapses will resign. You have <strong>${gs.capital}</strong> capital.</p>
      <div class="cabinet-list">${portsHtml}</div>`,
    confirmButtonText: "Close", confirmButtonColor: "#64748b",
    didOpen: () => {
      Swal.getHtmlContainer().addEventListener("click", e => {
        const btn = e.target.closest("button[data-act]"); if (!btn) return;
        const port = btn.dataset.port;
        if (btn.dataset.act === "appoint") GameState.appointMinister(GameState.gameState, port, btn.dataset.min);
        else GameState.dismissMinister(GameState.gameState, port);
        renderGameState(GameState.gameState);
        Swal.close(); showCabinet(GameState.gameState);
      });
    },
  });
}

// ── Speech modal ─────────────────────────────────────────────────────────────────────
export function showSpeechMenu(gs) {
  if (gs.hasSpoken) {
    Swal.fire({ icon: "info", title: "Already spoke", text: "You can give one speech per round. End the round to speak again.", confirmButtonColor: "#64748b" });
    return;
  }
  const approval = GameState.overallApproval(gs);
  const rows = SPEECH_THEMES.map(t => {
    const align = GameState.speechAlignment(gs, t);
    const gain = Math.round(SIM.SPEECH_BASE_GAIN + approval * SIM.SPEECH_APPROVAL_FACTOR + align * SIM.SPEECH_ALIGN_BONUS);
    const landing = align > 0.66 ? "mainstream" : align > 0.33 ? "divisive" : "fringe";
    return `<button class="speech-option" data-theme="${t.id}">
      <span class="speech-title">${t.title}</span>
      <span class="speech-meta">~+${gain} capital · <em>${landing}</em></span>
      <span class="speech-groups">rallies ${t.groups.map(groupName).join(", ")}</span>
    </button>`;
  }).join("");
  Swal.fire({
    title: "Give a Speech", width: 560,
    html: `<p style="color:#64748b;margin:0 0 10px">Rally the nation. A message that lands in the mainstream earns more political capital and lifts the public mood.</p>
      <div class="speech-list">${rows}</div>`,
    showConfirmButton: false, showCloseButton: true,
    didOpen: () => {
      Swal.getHtmlContainer().addEventListener("click", e => {
        const btn = e.target.closest(".speech-option"); if (!btn) return;
        const res = GameState.giveSpeech(GameState.gameState, btn.dataset.theme);
        Swal.close();
        renderGameState(GameState.gameState);
        if (res.ok) Swal.fire({ icon: "success", title: `+${res.gain} Political Capital`, text: `Your speech on "${res.theme.title}" ${res.align > 0.6 ? "struck a chord with the public." : res.align > 0.33 ? "divided opinion." : "fell rather flat."}`, timer: 2200, showConfirmButton: false });
      });
    },
  });
}

// ── Policy browser ─────────────────────────────────────────────────────────────────────
function effectTags(policy) {
  return policy.metricEffects.slice(0, 3).map(e => {
    const sign = e.change >= 0 ? "+" : "";
    return `<span class="eff-tag ${e.change >= 0 ? "pos" : "neg"}">${sign}${e.change} ${e.id}</span>`;
  }).join(" ");
}
function policyRowHtml(gs, policy) {
  const isEnacted = gs.enactedPolicyIds.includes(policy.id);
  const cost = GameState.effectiveCost(gs, policy);
  const canAfford = gs.capital >= cost;
  const c = catColor(policy.category);
  const discounted = cost < policy.cost;
  const search = `${policy.name} ${policy.description} ${policy.category}`.toLowerCase();
  return `<div class="cat-policy-row ${isEnacted ? "enacted" : ""}" data-search="${search}">
    <div class="cat-policy-icon" style="color:${c}">${iconSvg(iconNameFor(policy), { size: 26 })}</div>
    <div class="cat-policy-main">
      <div class="cat-policy-name"><span class="policy-cat-badge" style="background:${c}">${policy.category}</span> ${policy.name}${isEnacted ? ` <span class="enacted-badge">✓ enacted</span>` : ""}</div>
      <div class="cat-policy-desc">${policy.description}</div>
      <div class="policy-effects">${effectTags(policy)}</div>
    </div>
    <div class="cat-policy-side">
      <span class="policy-cost ${!canAfford && !isEnacted ? "cost-high" : ""}">${cost} cap${discounted ? ` <s>${policy.cost}</s>` : ""}</span>
      ${isEnacted ? `<button class="btn-repeal" data-act="repeal" data-id="${policy.id}">Repeal</button>`
                  : `<button class="btn-enact" data-act="enact" data-id="${policy.id}" ${!canAfford ? "disabled" : ""}>Enact</button>`}
      <button class="btn-details" data-act="details" data-id="${policy.id}">Details</button>
    </div>
  </div>`;
}
function openBrowser(gs, title, policies, withSearch) {
  const searchHtml = withSearch ? `<input id="cat-search" class="cat-search" type="search" placeholder="Search all policies…" aria-label="Search policies">` : "";
  const rows = policies.map(p => policyRowHtml(gs, p)).join("") || `<div class="empty-state">No policies in this category.</div>`;
  Swal.fire({
    title, width: 720, html: `${searchHtml}<div class="cat-browser">${rows}</div>`,
    confirmButtonText: "Close", confirmButtonColor: "#64748b",
    didOpen: () => {
      const root = Swal.getHtmlContainer();
      const search = root.querySelector("#cat-search");
      if (search) search.addEventListener("input", e => {
        const q = e.target.value.trim().toLowerCase();
        root.querySelectorAll(".cat-policy-row").forEach(row => { row.style.display = !q || row.dataset.search.includes(q) ? "" : "none"; });
      });
      root.addEventListener("click", e => {
        const btn = e.target.closest("button[data-act]"); if (!btn) return;
        const policy = POLICY_BY_ID.get(btn.dataset.id); if (!policy) return;
        const act = btn.dataset.act; Swal.close();
        if (act === "enact") showEnactConfirm(GameState.gameState, policy);
        else if (act === "repeal") showRepealConfirm(GameState.gameState, policy);
        else showPolicyDetails(GameState.gameState, policy);
      });
    },
  });
}
function openCategoryBrowser(gs, category) { openBrowser(gs, `${category} Policies`, POLICIES.filter(p => p.category === category), false); }
export function openPolicyCatalog(gs) { openBrowser(gs, "Policy Catalogue", POLICIES, true); }

// ── Indicator curve modal ────────────────────────────────────────────────────────────
export function showIndicatorCurve(gs, metricId) {
  const m = gs.metrics.find(x => x.id === metricId);
  if (!m || typeof d3 === "undefined") return;
  const { history, future, target } = GameState.projectIndicator(gs, metricId, 12);
  const good = m.lowerIsBetter ? m.value <= 100 : m.value >= 100;
  Swal.fire({
    title: m.name, width: 560,
    html: `<p style="color:#64748b;margin:0 0 8px">${m.description}</p>
      <p style="margin:0 0 10px;font-size:13px">Current <strong>${Math.round(m.value)}</strong> · Heading toward <strong>${Math.round(target)}</strong>
        <span style="color:#94a3b8">(${m.lowerIsBetter ? "lower is better" : "higher is better"})</span></p>
      <div id="curve-chart"></div>
      <p style="font-size:12px;color:#94a3b8;margin:8px 0 0">Solid = recent history · dashed = projected trajectory if nothing changes.</p>`,
    confirmButtonText: "Close", confirmButtonColor: good ? "#10b981" : "#ef4444",
    didOpen: () => drawCurve(history, future, target),
  });
}
function drawCurve(history, future, target) {
  const el = document.getElementById("curve-chart"); if (!el) return;
  const W = 480, H = 210, padL = 30, padR = 70, padT = 18, padB = 26;
  const past = history && history.length ? history.slice() : [100];
  const fut = future && future.length ? future.slice() : [];
  const series = [...past, ...fut];
  const splitIdx = past.length - 1, nowVal = series[splitIdx];

  // Data-fit y domain: smallest−20 … largest+20, clamped to [0,200]
  const vals = [...series, target];
  const lo = Math.max(0, Math.min(...vals) - 20), hi = Math.min(200, Math.max(...vals) + 20);
  const x = d3.scaleLinear().domain([0, Math.max(1, series.length - 1)]).range([padL, W - padR]);
  const y = d3.scaleLinear().domain([lo, hi]).range([H - padB, padT]);
  const svg = d3.select(el).html("").append("svg").attr("width", W).attr("height", H);

  for (const v of [lo, Math.round((lo + hi) / 2), hi]) svg.append("text").attr("x", padL - 6).attr("y", y(v) + 3).attr("text-anchor", "end").attr("font-size", 9).attr("fill", "#cbd5e1").text(Math.round(v));
  if (lo <= 100 && hi >= 100) {
    svg.append("line").attr("x1", padL).attr("x2", W - padR).attr("y1", y(100)).attr("y2", y(100)).attr("stroke", "#cbd5e1").attr("stroke-dasharray", "3 3");
    svg.append("text").attr("x", padL + 2).attr("y", y(100) - 5).attr("text-anchor", "start").attr("font-size", 10).attr("fill", "#94a3b8").text("baseline");
  }
  if (target >= lo && target <= hi) {
    svg.append("line").attr("x1", padL).attr("x2", W - padR).attr("y1", y(target)).attr("y2", y(target)).attr("stroke", "#f59e0b").attr("stroke-opacity", 0.75).attr("stroke-dasharray", "5 4");
    svg.append("text").attr("x", W - padR + 6).attr("y", y(target) + 3).attr("text-anchor", "start").attr("font-size", 10).attr("fill", "#b45309").text(`target ${Math.round(target)}`);
  }
  const mk = off => d3.line().x((_, i) => x(i + off)).y(d => y(d)).curve(d3.curveMonotoneX);
  if (past.length >= 2) svg.append("path").datum(past).attr("fill", "none").attr("stroke", "#3b82f6").attr("stroke-width", 2.5).attr("d", mk(0));
  if (fut.length) svg.append("path").datum(series.slice(splitIdx)).attr("fill", "none").attr("stroke", "#3b82f6").attr("stroke-width", 2.5).attr("stroke-dasharray", "6 5").attr("stroke-opacity", 0.55).attr("d", mk(splitIdx));
  svg.append("circle").attr("cx", x(splitIdx)).attr("cy", y(nowVal)).attr("r", 4).attr("fill", "#1d4ed8");
  svg.append("text").attr("x", x(splitIdx)).attr("y", y(nowVal) - 8).attr("text-anchor", "middle").attr("font-size", 10).attr("font-weight", 700).attr("fill", "#1d4ed8").text(Math.round(nowVal));
}

// ── Policy detail / confirm modals ───────────────────────────────────────────────────
function effectsHtml(policy) {
  const row = e => { const sign = e.change >= 0 ? "+" : ""; return `<tr><td>${e.id}</td><td class="${e.change >= 0 ? "good" : "bad"}">${sign}${e.change}</td></tr>`; };
  return `<p style="color:#64748b;margin:0 0 12px">${policy.description}</p>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;text-align:left">
      <div><strong>Indicator pressure</strong><table class="effect-table"><tbody>${policy.metricEffects.map(row).join("")}</tbody></table></div>
      <div><strong>Voter sentiment</strong><table class="effect-table"><tbody>${policy.voterEffects.map(row).join("")}</tbody></table></div>
    </div>
    <p style="font-size:12px;color:#94a3b8;margin:10px 0 0">Effects build up gradually over several rounds.</p>`;
}
export function showEnactConfirm(gs, policy) {
  const c = catColor(policy.category), cost = GameState.effectiveCost(gs, policy);
  Swal.fire({
    title: `${iconSvg(iconNameFor(policy), { size: 22, stroke: c })} ${policy.name}`,
    html: `${effectsHtml(policy)}<p style="margin-top:14px;font-weight:600">Cost: <span style="color:${c}">${cost} political capital</span> &nbsp;·&nbsp; You have: ${gs.capital}</p>`,
    showCancelButton: true, confirmButtonText: "Enact Policy", cancelButtonText: "Cancel", confirmButtonColor: c,
  }).then(result => {
    if (!result.isConfirmed) return;
    const ok = PolicyFunctions.enactPolicy(policy);
    if (ok) Swal.fire({ icon: "success", title: "Policy Enacted", text: `${policy.name} is now in effect.`, timer: 1600, showConfirmButton: false });
    else Swal.fire({ icon: "error", title: "Insufficient Capital", text: `You need ${cost} capital but only have ${gs.capital}.` });
  });
}
export function showRepealConfirm(gs, policy) {
  const repealCost = 20;
  Swal.fire({
    title: `Repeal: ${policy.name}`,
    html: `<p>Repealing lifts this policy's pressure on the nation and costs <strong>${repealCost} political capital</strong>.</p><p>You currently have <strong>${gs.capital}</strong>.</p>`,
    showCancelButton: true, confirmButtonText: "Repeal", cancelButtonText: "Keep It", confirmButtonColor: "#dc2626",
  }).then(result => {
    if (!result.isConfirmed) return;
    const ok = PolicyFunctions.repealPolicy(policy, repealCost);
    if (ok) Swal.fire({ icon: "success", title: "Policy Repealed", text: `${policy.name} has been repealed.`, timer: 1600, showConfirmButton: false });
    else Swal.fire({ icon: "error", title: "Insufficient Capital", text: `You need ${repealCost} capital to repeal a policy.` });
  });
}
export function showPolicyDetails(gs, policy) {
  const isEnacted = GameState.isEnacted(gs, policy.id), c = catColor(policy.category);
  Swal.fire({
    title: `${iconSvg(iconNameFor(policy), { size: 22, stroke: c })} ${policy.name}`,
    html: `<div style="display:inline-block;padding:2px 10px;border-radius:12px;background:${c};color:#fff;font-size:13px;margin-bottom:12px">${policy.category}</div>${effectsHtml(policy)}${isEnacted ? `<p style="margin-top:12px;color:#10b981;font-weight:600">✓ Currently enacted</p>` : ""}`,
    showCancelButton: true, confirmButtonText: isEnacted ? "Repeal (20)" : "Enact", confirmButtonColor: isEnacted ? "#dc2626" : c, cancelButtonText: "Close",
  }).then(result => { if (!result.isConfirmed) return; isEnacted ? showRepealConfirm(gs, policy) : showEnactConfirm(gs, policy); });
}

// ── Round / election storytelling ─────────────────────────────────────────────────────
function moverLine(m) {
  const improved = m.lowerIsBetter ? m.delta < 0 : m.delta > 0;
  const sign = m.delta >= 0 ? "+" : "";
  return `<li><span>${m.name}</span><span class="${improved ? "good" : "bad"}">${sign}${Math.round(m.delta)}</span></li>`;
}
export function showMandateBriefing(gs) {
  const { goal, parts, requireApproval } = GameState.evalGoal(gs);
  if (!goal) return Promise.resolve();
  const targetList = parts.map(p => `<li>${p.name}: ${p.dir === "high" ? "reach" : "bring down to"} <strong>${p.target}</strong></li>`).join("");
  return Swal.fire({
    title: `Your Mandate: ${goal.title}`,
    html: `<p style="color:#475569">${goal.description}</p>
      <div style="text-align:left;margin:12px auto;max-width:400px"><strong>Targets to hit:</strong>
      <ul class="mandate-targets">${targetList}</ul>
      <p style="font-size:13px;color:#64748b">You govern in <strong>${GameState.TERM_LENGTH}-round terms</strong>. At each election you must hold <strong>≥ ${requireApproval}% approval</strong> to stay in power. Achieve your mandate before you are voted out.</p></div>`,
    confirmButtonText: "Take office", confirmButtonColor: "#3b82f6",
  });
}
export function showRoundReport(report, narrative) {
  const swing = report.approvalAfter - report.approvalBefore;
  const swingTxt = swing === 0 ? "no change" : `${swing > 0 ? "+" : ""}${swing}%`;
  const eventsHtml = report.events.length ? `<div class="report-events">${report.events.map(e => `<div class="report-event"><strong>${e.title}</strong></div>`).join("")}</div>` : "";
  const speechHtml = report.speeches && report.speeches.length ? `<p class="report-stat" style="text-align:center">🎤 Speeches: ${report.speeches.join(", ")}</p>` : "";
  const moversHtml = report.movers.length ? `<ul class="report-movers">${report.movers.map(moverLine).join("")}</ul>` : `<p style="color:#94a3b8;font-size:13px">The indicators barely budged.</p>`;
  return Swal.fire({
    title: `Round ${report.round - 1} → ${report.round}`, width: 620,
    html: `<div class="report-narrative">${narrative}</div>${eventsHtml}${speechHtml}
      <div class="report-grid">
        <div><h4>Notable shifts</h4>${moversHtml}</div>
        <div><h4>State of the nation</h4>
          <p class="report-stat">Approval: <strong>${report.approvalAfter}%</strong> <span class="${swing >= 0 ? "good" : "bad"}">(${swingTxt})</span></p>
          <p class="report-stat">Capital: <strong>${report.capital}</strong></p>
          <p class="report-stat">Mandate progress: <strong>${report.goalProgress}%</strong></p>
        </div>
      </div>${report.goalNewlyAchieved ? `<div class="report-goal-done">🏆 Mandate achieved: ${report.goal}!</div>` : ""}`,
    confirmButtonText: "Carry on governing", confirmButtonColor: "#3b82f6",
  });
}
export function showElectionResult(election, goalTitle) {
  if (election.reElected) {
    return Swal.fire({
      icon: "success", title: `Re-elected! (Term ${election.term + 1})`,
      html: `<p>The nation has returned your government to power with <strong>${election.approval}% approval</strong>.</p>${election.goalAchieved ? `<p style="color:#10b981;font-weight:600">Your mandate "${goalTitle}" is fulfilled — a historic government.</p>` : `<p>Your mandate "${goalTitle}" remains unfinished. The work continues.</p>`}`,
      confirmButtonText: "Begin the new term", confirmButtonColor: "#10b981",
    });
  }
  return showGameOver(election, goalTitle);
}
export function showGameOver(election, goalTitle) {
  const won = election.goalAchieved;
  return Swal.fire({
    icon: won ? "success" : "error", title: won ? "A Legacy Secured" : "Voted Out of Office",
    html: won ? `<p>Your government lost the election with ${election.approval}% approval — but you had already achieved your mandate, <strong>${goalTitle}</strong>.</p><p style="font-weight:600;color:#10b981">History will remember this government kindly.</p>`
              : `<p>With only <strong>${election.approval}%</strong> approval, the electorate has thrown your government out.</p><p>Your mandate — <strong>${goalTitle}</strong> — went unfulfilled.</p>`,
    confirmButtonText: "Start a new government", confirmButtonColor: won ? "#10b981" : "#dc2626", allowOutsideClick: false,
  }).then(() => { GameState.resetGameState(); showMandateBriefing(GameState.gameState); });
}

// ── Event wiring (once) ────────────────────────────────────────────────────────────────
export function setupPolicyEvents() {
  if (eventsBound) return;
  eventsBound = true;
  document.getElementById("browse-all")?.addEventListener("click", () => openPolicyCatalog(GameState.gameState));
  document.getElementById("metrics-list")?.addEventListener("click", e => {
    const card = e.target.closest(".metric-card");
    if (card?.dataset.metricId) showIndicatorCurve(GameState.gameState, card.dataset.metricId);
  });
  document.getElementById("voter-list")?.addEventListener("click", e => {
    const row = e.target.closest(".voter-row");
    if (row?.dataset.voterId) showGroupDetail(GameState.gameState, row.dataset.voterId);
  });
  document.getElementById("metrics-list")?.addEventListener("scroll", scheduleOverlay, { passive: true });
  document.getElementById("voter-list")?.addEventListener("scroll", scheduleOverlay, { passive: true });
  window.addEventListener("resize", scheduleOverlay, { passive: true });
}
