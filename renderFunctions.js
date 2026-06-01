// renderFunctions.js — Card-based dashboard renderer
import { POLICIES, POLICY_CATEGORIES } from './policies.js';
import * as GameState from './gameState.js';
import * as PolicyFunctions from './policyFunctions.js';

// ── Category colour map ───────────────────────────────────────────────────────
const CAT_COLORS = {
  "Economy":        "#3b82f6",
  "Taxation":       "#6366f1",
  "Labor":          "#f59e0b",
  "Welfare":        "#10b981",
  "Healthcare":     "#ef4444",
  "Education":      "#8b5cf6",
  "Housing":        "#f97316",
  "Transport":      "#0ea5e9",
  "Energy":         "#eab308",
  "Environment":    "#22c55e",
  "Immigration":    "#a855f7",
  "Justice":        "#dc2626",
  "Civil Liberties":"#14b8a6",
  "Technology":     "#6b7280",
  "Foreign Policy": "#64748b",
  "Civic":          "#0891b2",
};

function catColor(cat) {
  return CAT_COLORS[cat] || "#94a3b8";
}

// ── Current filter state ──────────────────────────────────────────────────────
let activeCategory = "All";
let searchQuery = "";
let hoveredPolicyId = null;

// ── Main render entry point ───────────────────────────────────────────────────
export function renderGameState(gs) {
  renderHeader(gs);
  renderMetrics(gs);
  renderPolicyBrowser(gs);
  renderImpactMap(gs);
  renderVoterPanel(gs);
  renderEnactedPanel(gs);
}

// ── Header ────────────────────────────────────────────────────────────────────
function renderHeader(gs) {
  const approval = GameState.overallApproval(gs);
  const approvalClass = approval >= 60 ? "approval-good"
                      : approval >= 40 ? "approval-ok"
                      : "approval-bad";
  document.getElementById("stat-round").textContent   = `Round ${gs.currentRound}`;
  document.getElementById("stat-credits").textContent = `${gs.credits} Credits`;
  document.getElementById("stat-approval").textContent = `${approval}% Approval`;
  document.getElementById("stat-approval").className   = `stat-chip ${approvalClass}`;
  document.getElementById("stat-enacted").textContent  =
    `${gs.enactedPolicyIds.length} Policies`;
}

// ── Metrics panel ─────────────────────────────────────────────────────────────
function renderMetrics(gs) {
  const container = document.getElementById("metrics-list");
  if (!container) return;

  // Group metrics by category
  const byCat = {};
  for (const m of gs.metrics) {
    (byCat[m.category] = byCat[m.category] || []).push(m);
  }

  let html = "";
  for (const [cat, metrics] of Object.entries(byCat)) {
    const color = catColor(cat);
    html += `<div class="metric-group">
      <h3 class="metric-group-title" style="border-left:3px solid ${color};padding-left:8px">${cat}</h3>`;
    for (const m of metrics) {
      const pct   = Math.round(m.value);           // 0-200
      const bar   = Math.min(100, m.value / 2);    // 0-100 for bar width
      const delta = m.value - 100;
      const good  = m.lowerIsBetter ? delta <= 0 : delta >= 0;
      const sign  = delta >= 0 ? "+" : "";
      const barCls= good ? "bar-fill-good" : "bar-fill-bad";
      html += `
        <div class="metric-card" title="${m.description}">
          <div class="metric-name">${m.name}</div>
          <div class="metric-bar-wrap">
            <div class="metric-bar">
              <div class="${barCls}" style="width:${bar}%"></div>
            </div>
            <span class="metric-value ${good ? "good" : "bad"}">${sign}${delta}</span>
          </div>
        </div>`;
    }
    html += `</div>`;
  }
  container.innerHTML = html;
}

// ── Policy browser ────────────────────────────────────────────────────────────
export function renderPolicyBrowser(gs) {
  renderCategoryTabs();
  renderPolicyCards(gs);
}

function renderCategoryTabs() {
  const tabsEl = document.getElementById("category-tabs");
  if (!tabsEl) return;
  const cats = ["All", ...POLICY_CATEGORIES];
  tabsEl.innerHTML = cats.map(cat =>
    `<button class="cat-tab ${cat === activeCategory ? "active" : ""}"
             style="${cat !== "All" ? `--cat-color:${catColor(cat)}` : ""}"
             data-cat="${cat}">${cat}</button>`
  ).join("");
}

function renderPolicyCards(gs) {
  const grid = document.getElementById("policy-grid");
  if (!grid) return;

  const enacted = new Set(gs.enactedPolicyIds);
  let filtered = POLICIES;
  if (activeCategory !== "All") {
    filtered = filtered.filter(p => p.category === activeCategory);
  }

  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    filtered = filtered.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q)
    );
  }

  if (filtered.length === 0) {
    grid.innerHTML = `<div class="empty-state">No policies match your search.</div>`;
    return;
  }

  const color = catColor(activeCategory);
  grid.innerHTML = filtered.map(policy => {
    const isEnacted = enacted.has(policy.id);
    const canAfford = gs.credits >= policy.cost;
    const c = catColor(policy.category);

    // Summary of key effects for tooltip/preview
    const topEffects = policy.metricEffects.slice(0, 3)
      .map(e => {
        const sign = e.change >= 0 ? "+" : "";
        return `<span class="eff-tag ${e.change >= 0 ? "pos" : "neg"}">${sign}${e.change} ${e.id}</span>`;
      }).join(" ");

    return `<div class="policy-card ${isEnacted ? "enacted" : ""} ${!canAfford && !isEnacted ? "unaffordable" : ""}"
                 style="--cat-color:${c}" data-policy-id="${policy.id}">
      <div class="policy-card-header">
        <span class="policy-cat-badge" style="background:${c}">${policy.category}</span>
        <span class="policy-cost ${!canAfford && !isEnacted ? "cost-high" : ""}">${policy.cost} cr</span>
      </div>
      <div class="policy-name">${policy.name}</div>
      <div class="policy-desc">${policy.description}</div>
      <div class="policy-effects">${topEffects}</div>
      <div class="policy-card-footer">
        ${isEnacted
          ? `<button class="btn-repeal" data-policy-id="${policy.id}">Repeal (20 cr)</button>`
          : `<button class="btn-enact" data-policy-id="${policy.id}" ${!canAfford ? "disabled" : ""}>Enact</button>`
        }
        <button class="btn-details" data-policy-id="${policy.id}">Details</button>
      </div>
    </div>`;
  }).join("");
}

function renderImpactMap(gs) {
  const container = document.getElementById("svg-container");
  if (!container || typeof d3 === "undefined") return;

  const width = Math.max(container.clientWidth || 820, 820);
  const height = container.clientHeight || 340;
  const centerX = width * 0.45;
  const centerY = height * 0.53;
  const stateRadius = Math.min(width, height) * 0.3;

  const svg = d3.select(container).html("")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

  const enactedById = new Set(gs.enactedPolicyIds);
  const activePolicies = POLICIES.filter(p => enactedById.has(p.id));
  const hovered = hoveredPolicyId && !enactedById.has(hoveredPolicyId)
    ? POLICIES.find(p => p.id === hoveredPolicyId)
    : null;
  const previewPolicies = hovered ? [hovered] : [];
  const visiblePolicies = [...activePolicies, ...previewPolicies];

  const metricNodes = gs.metrics.map((m, i, arr) => {
    const angle = (i / arr.length) * (Math.PI * 2) - (Math.PI / 2);
    return {
      id: m.id,
      name: m.name,
      x: centerX + Math.cos(angle) * stateRadius,
      y: centerY + Math.sin(angle) * stateRadius,
      category: m.category,
      value: m.value
    };
  });

  const voterStartX = width * 0.75;
  const voterStartY = 24;
  const voterStep = (height - 40) / Math.max(gs.voters.length, 1);
  const voterNodes = gs.voters.map((v, i) => ({
    id: v.id,
    name: v.name,
    x: voterStartX,
    y: voterStartY + i * voterStep + (voterStep * 0.3),
    approval: v.approval
  }));

  const policyNodes = visiblePolicies.map((p, i, arr) => {
    const angle = (i / Math.max(arr.length, 1)) * (Math.PI * 2);
    const r = Math.max(38, stateRadius * 0.42);
    return {
      id: p.id,
      name: p.name,
      x: centerX + Math.cos(angle) * r,
      y: centerY + Math.sin(angle) * r,
      category: p.category,
      isPreview: !!hovered && p.id === hovered.id
    };
  });

  const metricById = new Map(metricNodes.map(n => [n.id, n]));
  const voterById = new Map(voterNodes.map(n => [n.id, n]));
  const policyById = new Map(policyNodes.map(n => [n.id, n]));

  const links = [];
  for (const policy of visiblePolicies) {
    const source = policyById.get(policy.id);
    if (!source) continue;
    for (const effect of policy.metricEffects) {
      const target = metricById.get(effect.id);
      if (!target) continue;
      links.push({
        source,
        target,
        change: effect.change,
        isPreview: source.isPreview,
      });
    }
    for (const effect of policy.voterEffects) {
      const target = voterById.get(effect.id);
      if (!target) continue;
      links.push({
        source,
        target,
        change: effect.change,
        isPreview: source.isPreview,
      });
    }
  }

  svg.append("circle")
    .attr("cx", centerX)
    .attr("cy", centerY)
    .attr("r", stateRadius + 18)
    .attr("fill", "#f8fafc")
    .attr("stroke", "#cbd5e1")
    .attr("stroke-width", 1.2);

  svg.selectAll(".impact-line")
    .data(links)
    .enter()
    .append("line")
    .attr("class", d => `impact-line ${d.isPreview ? "preview" : "enacted"}`)
    .attr("x1", d => d.source.x)
    .attr("y1", d => d.source.y)
    .attr("x2", d => d.target.x)
    .attr("y2", d => d.target.y)
    .attr("stroke", d => d.change >= 0 ? "#22c55e" : "#ef4444")
    .attr("stroke-opacity", d => d.isPreview ? 0.5 : 0.75)
    .attr("stroke-width", d => Math.max(1.5, Math.min(6, Math.abs(d.change) / 4)))
    .append("title")
    .text(d => `${d.source.name} → ${d.target.name}: ${d.change >= 0 ? "+" : ""}${d.change}`);

  svg.selectAll(".metric-node")
    .data(metricNodes)
    .enter()
    .append("circle")
    .attr("class", "impact-node metric-node")
    .attr("cx", d => d.x)
    .attr("cy", d => d.y)
    .attr("r", 10)
    .attr("fill", "#3b82f6")
    .attr("stroke", "#1d4ed8");

  svg.selectAll(".metric-label")
    .data(metricNodes)
    .enter()
    .append("text")
    .attr("class", "impact-label metric-label")
    .attr("x", d => d.x)
    .attr("y", d => d.y + 20)
    .attr("text-anchor", "middle")
    .text(d => d.name);

  svg.selectAll(".policy-node")
    .data(policyNodes)
    .enter()
    .append("circle")
    .attr("class", "impact-node policy-node")
    .attr("cx", d => d.x)
    .attr("cy", d => d.y)
    .attr("r", 9)
    .attr("fill", d => d.isPreview ? "#f59e0b" : "#22c55e")
    .attr("stroke", d => d.isPreview ? "#b45309" : "#15803d");

  svg.selectAll(".policy-label")
    .data(policyNodes)
    .enter()
    .append("text")
    .attr("class", "impact-label policy-label")
    .attr("x", d => d.x)
    .attr("y", d => d.y - 13)
    .attr("text-anchor", "middle")
    .text(d => d.name.length > 22 ? `${d.name.slice(0, 21)}…` : d.name);

  svg.selectAll(".voter-node")
    .data(voterNodes)
    .enter()
    .append("rect")
    .attr("class", "impact-node impact-voter-node")
    .attr("x", d => d.x - 5)
    .attr("y", d => d.y - 8)
    .attr("width", d => Math.max(40, d.approval * 0.95))
    .attr("height", 14)
    .attr("rx", 6);

  svg.selectAll(".voter-label")
    .data(voterNodes)
    .enter()
    .append("text")
    .attr("class", "impact-label voter-label")
    .attr("x", d => d.x + 2)
    .attr("y", d => d.y + 5)
    .text(d => `${d.name} (${Math.round(d.approval)}%)`);
}

// ── Voter panel ───────────────────────────────────────────────────────────────
function renderVoterPanel(gs) {
  const container = document.getElementById("voter-list");
  if (!container) return;

  container.innerHTML = gs.voters.map(v => {
    const pct = Math.round(v.approval);
    const cls = pct >= 60 ? "voter-good" : pct >= 40 ? "voter-ok" : "voter-bad";
    return `<div class="voter-row" title="${v.description}">
      <span class="voter-name">${v.name}</span>
      <div class="voter-bar-wrap">
        <div class="voter-bar">
          <div class="voter-fill ${cls}" style="width:${pct}%"></div>
        </div>
        <span class="voter-pct ${cls}">${pct}%</span>
      </div>
    </div>`;
  }).join("");
}

// ── Enacted panel ─────────────────────────────────────────────────────────────
function renderEnactedPanel(gs) {
  const container = document.getElementById("enacted-list");
  if (!container) return;

  const enacted = GameState.getEnactedPolicies(gs);
  if (enacted.length === 0) {
    container.innerHTML = `<div class="empty-state">No policies enacted yet.</div>`;
    return;
  }

  container.innerHTML = enacted.map(p => {
    const c = catColor(p.category);
    return `<div class="enacted-item" style="border-left:3px solid ${c}">
      <span class="enacted-name">${p.name}</span>
      <span class="enacted-cat" style="color:${c}">${p.category}</span>
    </div>`;
  }).join("");
}

// ── Event delegation (called once from main.js after DOM ready) ───────────────
// Always reads from GameState.gameState so load/reset is reflected automatically.
export function setupPolicyEvents() {
  const grid = document.getElementById("policy-grid");
  const tabs = document.getElementById("category-tabs");
  const searchInput = document.getElementById("policy-search");

  // Category tab clicks
  tabs && tabs.addEventListener("click", e => {
    const btn = e.target.closest(".cat-tab");
    if (!btn) return;
    activeCategory = btn.dataset.cat;
    renderCategoryTabs();
    renderPolicyCards(GameState.gameState);
  });

  // Policy grid clicks (enact / repeal / details)
  grid && grid.addEventListener("click", e => {
    const enactBtn   = e.target.closest(".btn-enact");
    const repealBtn  = e.target.closest(".btn-repeal");
    const detailsBtn = e.target.closest(".btn-details");

    if (enactBtn) {
      const policy = POLICIES.find(p => p.id === enactBtn.dataset.policyId);
      if (policy) showEnactConfirm(GameState.gameState, policy);
    }
    if (repealBtn) {
      const policy = POLICIES.find(p => p.id === repealBtn.dataset.policyId);
      if (policy) showRepealConfirm(GameState.gameState, policy);
    }
    if (detailsBtn) {
      const policy = POLICIES.find(p => p.id === detailsBtn.dataset.policyId);
      if (policy) showPolicyDetails(GameState.gameState, policy);
    }
  });

  grid && grid.addEventListener("mouseover", e => {
    const card = e.target.closest(".policy-card");
    if (!card?.dataset.policyId) return;
    hoveredPolicyId = card.dataset.policyId;
    renderImpactMap(GameState.gameState);
  });

  grid && grid.addEventListener("mouseout", e => {
    const card = e.target.closest(".policy-card");
    if (!card) return;
    const to = e.relatedTarget;
    if (to && card.contains(to)) return;
    hoveredPolicyId = null;
    renderImpactMap(GameState.gameState);
  });

  // Search
  searchInput && searchInput.addEventListener("input", e => {
    searchQuery = e.target.value.trim();
    renderPolicyCards(GameState.gameState);
  });
}

// ── Policy modals ─────────────────────────────────────────────────────────────
function effectsHtml(policy) {
  const mRows = policy.metricEffects.map(e => {
    const sign = e.change >= 0 ? "+" : "";
    const cls  = e.change >= 0 ? "good" : "bad";
    return `<tr><td>${e.id}</td><td class="${cls}">${sign}${e.change}</td></tr>`;
  }).join("");
  const vRows = policy.voterEffects.map(e => {
    const sign = e.change >= 0 ? "+" : "";
    const cls  = e.change >= 0 ? "good" : "bad";
    return `<tr><td>${e.id}</td><td class="${cls}">${sign}${e.change}%</td></tr>`;
  }).join("");

  return `
    <p style="color:#64748b;margin:0 0 12px">${policy.description}</p>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;text-align:left">
      <div>
        <strong>Metric Effects</strong>
        <table class="effect-table"><tbody>${mRows}</tbody></table>
      </div>
      <div>
        <strong>Voter Approval</strong>
        <table class="effect-table"><tbody>${vRows}</tbody></table>
      </div>
    </div>`;
}

export function showEnactConfirm(gs, policy) {
  const c = catColor(policy.category);
  Swal.fire({
    title: policy.name,
    html: `${effectsHtml(policy)}
      <p style="margin-top:16px;font-weight:600">
        Cost: <span style="color:${c}">${policy.cost} credits</span>
        &nbsp;·&nbsp; You have: ${gs.credits} credits
      </p>`,
    showCancelButton: true,
    confirmButtonText: "Enact Policy",
    cancelButtonText: "Cancel",
    confirmButtonColor: c,
  }).then(result => {
    if (!result.isConfirmed) return;
    const ok = PolicyFunctions.enactPolicy(policy);
    if (ok) {
      Swal.fire({ icon: "success", title: "Policy Enacted", text: `${policy.name} is now in effect.`, timer: 1800, showConfirmButton: false });
    } else {
      Swal.fire({ icon: "error", title: "Insufficient Credits", text: `You need ${policy.cost} credits but only have ${gs.credits}.` });
    }
  });
}

export function showRepealConfirm(gs, policy) {
  const repealCost = 20;
  Swal.fire({
    title: `Repeal: ${policy.name}`,
    html: `<p>Repealing this policy will <strong>reverse its effects</strong> and cost <strong>${repealCost} credits</strong>.</p>
           <p>You currently have <strong>${gs.credits} credits</strong>.</p>`,
    showCancelButton: true,
    confirmButtonText: "Repeal",
    cancelButtonText: "Keep It",
    confirmButtonColor: "#dc2626",
  }).then(result => {
    if (!result.isConfirmed) return;
    const ok = PolicyFunctions.repealPolicy(policy, repealCost);
    if (ok) {
      Swal.fire({ icon: "success", title: "Policy Repealed", text: `${policy.name} has been repealed.`, timer: 1800, showConfirmButton: false });
    } else {
      Swal.fire({ icon: "error", title: "Insufficient Credits", text: `You need ${repealCost} credits to repeal a policy.` });
    }
  });
}

export function showPolicyDetails(gs, policy) {
  const isEnacted = GameState.isEnacted(gs, policy.id);
  const c = catColor(policy.category);
  Swal.fire({
    title: policy.name,
    html: `
      <div style="display:inline-block;padding:2px 10px;border-radius:12px;background:${c};color:#fff;font-size:13px;margin-bottom:12px">${policy.category}</div>
      ${effectsHtml(policy)}
      ${isEnacted ? `<p style="margin-top:12px;color:#10b981;font-weight:600">✓ Currently enacted</p>` : ""}`,
    confirmButtonText: "Close",
    confirmButtonColor: "#64748b",
  });
}
