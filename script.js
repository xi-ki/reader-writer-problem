// English comments only, as requested.

/**
 * Agent Marketplace — Discovery Page
 * - Data-driven rendering
 * - Search + multi-dimensional filters (type, rating slider, tag cloud)
 * - "Add to Workflow" interaction feedback + toast + state change
 */

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

const formatUses = (n) => {
  if (typeof n === "string") return n;
  if (n >= 1_000_000) return `${Math.round(n / 100_000) / 10}M+ uses`;
  if (n >= 10_000) return `${Math.round(n / 100) / 10}K+ uses`;
  return `${n}+ uses`;
};

const clamp = (n, a, b) => Math.max(a, Math.min(b, n));

const icons = {
  research: () => `
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z" class="svg-stroke" stroke-width="1.8"/>
      <path d="M16.6 16.6 21 21" class="svg-stroke" stroke-width="1.8" stroke-linecap="round"/>
      <path d="M8.2 8.5h4.6" class="svg-stroke" stroke-width="1.6" stroke-linecap="round"/>
      <path d="M8.2 11.2h3.2" class="svg-stroke" stroke-width="1.6" stroke-linecap="round"/>
    </svg>
  `,
  writing: () => `
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M7 20h10" class="svg-stroke" stroke-width="1.7" stroke-linecap="round"/>
      <path d="M8.3 16.7 17.9 7.1a2 2 0 0 1 2.8 2.8l-9.6 9.6-4.1 1.3 1.3-4.1Z" class="svg-stroke" stroke-width="1.7" stroke-linejoin="round"/>
    </svg>
  `,
  design: () => `
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M12 2.8c4.9 0 8.9 4 8.9 8.9S16.9 20.6 12 20.6c-3 0-5.3-1.2-6.8-3.2" class="svg-stroke" stroke-width="1.7" stroke-linecap="round"/>
      <path d="M7.8 14.8c.9-1.7 2.7-2.8 4.8-2.8h6.3" class="svg-stroke" stroke-width="1.7" stroke-linecap="round"/>
      <path d="M7.4 9.1h.01M9.9 6.6h.01" class="svg-stroke" stroke-width="3.0" stroke-linecap="round"/>
    </svg>
  `,
  review: () => `
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M20.5 12a8.5 8.5 0 1 1-17 0 8.5 8.5 0 0 1 17 0Z" class="svg-stroke" stroke-width="1.7"/>
      <path d="m8.2 12.4 2.2 2.2 5.6-5.6" class="svg-stroke" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  `,
  data: () => `
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M6 18V9" class="svg-stroke" stroke-width="1.8" stroke-linecap="round"/>
      <path d="M12 18V6" class="svg-stroke" stroke-width="1.8" stroke-linecap="round"/>
      <path d="M18 18v-7" class="svg-stroke" stroke-width="1.8" stroke-linecap="round"/>
      <path d="M5 18h14" class="svg-stroke" stroke-width="1.6" stroke-linecap="round"/>
    </svg>
  `,
  product: () => `
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M8.5 8.4h7" class="svg-stroke" stroke-width="1.8" stroke-linecap="round"/>
      <path d="M7.2 12h9.6" class="svg-stroke" stroke-width="1.8" stroke-linecap="round"/>
      <path d="M9.4 15.6h5.2" class="svg-stroke" stroke-width="1.8" stroke-linecap="round"/>
      <path d="M6.2 3.8h11.6a2 2 0 0 1 2 2v12.4a2 2 0 0 1-2 2H6.2a2 2 0 0 1-2-2V5.8a2 2 0 0 1 2-2Z" class="svg-stroke" stroke-width="1.6"/>
    </svg>
  `,
  plus: () => `
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M12 5v14" class="svg-stroke" stroke-width="2" stroke-linecap="round"/>
      <path d="M5 12h14" class="svg-stroke" stroke-width="2" stroke-linecap="round"/>
    </svg>
  `,
  check: () => `
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="m6.8 12.6 3 3 7.4-7.4" class="svg-stroke" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  `,
  star: (on) => `
    <svg class="star ${on ? "" : "star--off"}" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M12 17.3 6.65 20.4l1.45-6.1L3.3 10.3l6.3-.55L12 4l2.4 5.75 6.3.55-4.8 4 1.45 6.1L12 17.3Z"/>
    </svg>
  `,
};

// At least four different types of agent cards.
const agents = [
  {
    id: "research-expert",
    name: "Research Expert",
    type: "research",
    variant: "research",
    rating: 4.8,
    uses: "10,000+ uses",
    desc:
      "Turns ambiguous questions into a crisp research plan. Synthesizes sources, flags gaps, and delivers decision-ready summaries.",
    tags: ["literature", "synthesis", "citations", "briefs"],
    badge: "Best for strategy",
  },
  {
    id: "copywriting-assistant",
    name: "Copywriting Assistant",
    type: "writing",
    variant: "writing",
    rating: 4.6,
    uses: 245_000,
    desc:
      "Writes high-converting copy with brand consistency. Generates variants, headlines, and CTAs tailored to your audience.",
    tags: ["marketing", "tone", "landing pages", "ads"],
    badge: "Conversion-ready",
  },
  {
    id: "design-assistant",
    name: "Design Assistant",
    type: "design",
    variant: "design",
    rating: 4.7,
    uses: 120_000,
    desc:
      "Transforms requirements into polished UI directions. Provides component specs, layout options, and accessibility notes.",
    tags: ["UI", "components", "accessibility", "layout"],
    badge: "Awwwards vibe",
  },
  {
    id: "review-specialist",
    name: "Review Specialist",
    type: "review",
    variant: "review",
    rating: 4.9,
    uses: 68_000,
    desc:
      "Reviews docs and deliverables with ruthless clarity. Finds inconsistencies, risks, and missing assumptions—fast.",
    tags: ["QA", "risk", "consistency", "proofread"],
    badge: "High signal",
  },
  {
    id: "data-analyst",
    name: "Data Analyst",
    type: "data",
    variant: "data",
    rating: 4.5,
    uses: 93_000,
    desc:
      "Explains metrics like a teammate. Creates dashboards outlines, KPI definitions, and quick anomaly diagnostics.",
    tags: ["metrics", "dashboards", "SQL", "insights"],
    badge: "Metrics-first",
  },
  {
    id: "product-pm",
    name: "Product PM",
    type: "product",
    variant: "product",
    rating: 4.4,
    uses: 54_000,
    desc:
      "Turns ideas into PRDs and execution plans. Maps user stories, acceptance criteria, and tradeoffs.",
    tags: ["PRD", "roadmap", "stories", "scope"],
    badge: "Shippable",
  },
];

const state = {
  query: "",
  type: "all",
  minRating: 4.0,
  selectedTags: new Set(),
  added: new Set(),
  toastTimer: null,
};

const el = {
  q: $("#q"),
  type: $("#type"),
  rating: $("#rating"),
  tags: $("[data-tags]"),
  grid: $("[data-grid]"),
  empty: $("[data-empty]"),
  summary: $("[data-summary]"),
  ratingLabel: $("[data-rating-label]"),
  ratingStars: $("[data-rating-stars]"),
  toast: $("[data-toast]"),
  toastTitle: $("[data-toast-title]"),
  toastDesc: $("[data-toast-desc]"),
};

const escapeHtml = (s) =>
  String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

const renderStars = (rating, { size = 5 } = {}) => {
  // Use rounded full stars for a clean minimalist look.
  const onCount = Math.round(clamp(rating, 0, 5));
  return Array.from({ length: size }, (_, i) => icons.star(i < onCount)).join("");
};

const typeLabel = (t) =>
  (
    {
      research: "Research",
      writing: "Writing",
      design: "Design",
      review: "Review",
      data: "Data",
      product: "Product",
    }[t] || "Agent"
  );

const allTags = () => {
  const set = new Set();
  for (const a of agents) for (const t of a.tags) set.add(t);
  return Array.from(set).sort((a, b) => a.localeCompare(b));
};

const matchesQuery = (agent, q) => {
  if (!q) return true;
  const hay = `${agent.name} ${agent.desc} ${agent.type} ${agent.tags.join(" ")}`.toLowerCase();
  return hay.includes(q.toLowerCase());
};

const matchesType = (agent, type) => (type === "all" ? true : agent.type === type);

const matchesRating = (agent, minRating) => agent.rating >= minRating;

const matchesTags = (agent, selectedTags) => {
  if (!selectedTags.size) return true;
  // Require all selected tags (AND) for a precise experience.
  return Array.from(selectedTags).every((t) => agent.tags.includes(t));
};

const computeResults = () => {
  const q = state.query.trim();
  const list = agents
    .filter((a) => matchesQuery(a, q))
    .filter((a) => matchesType(a, state.type))
    .filter((a) => matchesRating(a, state.minRating))
    .filter((a) => matchesTags(a, state.selectedTags))
    // Sort: added last? Keep curated feel with rating + uses.
    .sort((a, b) => (b.rating - a.rating) || (parseUses(b.uses) - parseUses(a.uses)));
  return list;
};

const parseUses = (uses) => {
  if (typeof uses === "number") return uses;
  const s = String(uses).toLowerCase().replaceAll(",", "");
  const m = s.match(/([0-9.]+)\s*(k|m)?\+?/);
  if (!m) return 0;
  const n = Number(m[1]);
  const unit = m[2];
  if (unit === "m") return Math.round(n * 1_000_000);
  if (unit === "k") return Math.round(n * 1_000);
  return Math.round(n);
};

const showToast = ({ title, desc }) => {
  el.toastTitle.textContent = title;
  el.toastDesc.textContent = desc;

  el.toast.classList.add("toast--show");
  if (state.toastTimer) window.clearTimeout(state.toastTimer);
  state.toastTimer = window.setTimeout(() => {
    el.toast.classList.remove("toast--show");
  }, 2400);
};

const dismissToast = () => {
  if (state.toastTimer) window.clearTimeout(state.toastTimer);
  el.toast.classList.remove("toast--show");
};

const buttonMarkup = (isAdded, isLoading) => {
  const cls = isAdded ? "btn btn--added" : "btn btn--primary";
  const icon = isLoading ? `<span class="spinner" aria-hidden="true"></span>` : `<span class="btn__icon">${isAdded ? icons.check() : icons.plus()}</span>`;
  const text = isAdded ? "Added" : "Add to Workflow";

  return `
    <button class="${cls}" type="button" data-action="add" ${isAdded ? "aria-pressed=\"true\"" : "aria-pressed=\"false\""} ${isLoading ? "disabled" : ""}>
      ${icon}
      <span>${text}</span>
    </button>
  `;
};

const cardMarkup = (agent) => {
  const uses = formatUses(agent.uses);
  const isAdded = state.added.has(agent.id);

  return `
    <article class="card card--${escapeHtml(agent.variant)}" data-id="${escapeHtml(agent.id)}">
      <div class="card__top">
        <div class="agent">
          <div class="agent__icon" aria-hidden="true">${icons[agent.type]?.() ?? icons.research()}</div>
          <div class="agent__text">
            <div class="agent__name">${escapeHtml(agent.name)}</div>
            <div class="agent__type">${escapeHtml(typeLabel(agent.type))}</div>
          </div>
        </div>
        <div class="badge" title="Curated highlight">
          <span class="badge__spark" aria-hidden="true"></span>
          ${escapeHtml(agent.badge)}
        </div>
      </div>

      <p class="card__desc">${escapeHtml(agent.desc)}</p>

      <div class="card__meta">
        <div class="rating" aria-label="Rating">
          <span class="rating__stars" aria-hidden="true">${renderStars(agent.rating)}</span>
          <span class="rating__score">${agent.rating.toFixed(1)}</span>
        </div>
        <div class="uses">${escapeHtml(uses)}</div>
      </div>

      <div class="card__bottom">
        <div class="card__tags" aria-label="Tags">
          ${agent.tags
            .slice(0, 3)
            .map((t) => `<span class="chip">${escapeHtml(t)}</span>`)
            .join("")}
        </div>
        <div class="card__cta" data-cta>
          ${buttonMarkup(isAdded, false)}
        </div>
      </div>
    </article>
  `;
};

const renderRatingIndicator = () => {
  const v = Number(state.minRating);
  el.ratingLabel.textContent = `${v.toFixed(1)}+`;

  const starCount = Math.round(v);
  el.ratingStars.innerHTML = Array.from({ length: 5 }, (_, i) => icons.star(i < starCount)).join("");
};

const renderTags = () => {
  const tags = allTags();
  el.tags.innerHTML = tags
    .map((t) => {
      const pressed = state.selectedTags.has(t);
      return `<button class="tag" type="button" role="listitem" aria-pressed="${pressed ? "true" : "false"}" data-tag="${escapeHtml(
        t
      )}">${escapeHtml(t)}</button>`;
    })
    .join("");
};

const renderSummary = (count) => {
  const parts = [];
  if (state.query.trim()) parts.push(`“${state.query.trim()}”`);
  if (state.type !== "all") parts.push(typeLabel(state.type));
  if (state.selectedTags.size) parts.push(`${state.selectedTags.size} tag${state.selectedTags.size > 1 ? "s" : ""}`);
  parts.push(`${state.minRating.toFixed(1)}+ rating`);

  el.summary.textContent = `Showing ${count} agent${count === 1 ? "" : "s"} • ${parts.join(" • ")}`;
};

const renderGrid = () => {
  const results = computeResults();

  // Small transition for filter switching.
  el.grid.style.opacity = "0";
  window.setTimeout(() => {
    el.grid.innerHTML = results.map(cardMarkup).join("");
    el.grid.style.opacity = "1";
  }, 90);

  el.empty.hidden = results.length !== 0;
  renderSummary(results.length);
};

const setSearch = (value) => {
  state.query = value;
  renderGrid();
};

const setType = (value) => {
  state.type = value;
  renderGrid();
};

const setMinRating = (value) => {
  state.minRating = Number(value);
  renderRatingIndicator();
  renderGrid();
};

const toggleTag = (tag) => {
  if (state.selectedTags.has(tag)) state.selectedTags.delete(tag);
  else state.selectedTags.add(tag);
  renderTags();
  renderGrid();
};

const clearTags = () => {
  state.selectedTags.clear();
  renderTags();
  renderGrid();
};

const resetFilters = () => {
  state.query = "";
  state.type = "all";
  state.minRating = 4.0;
  state.selectedTags.clear();

  el.q.value = "";
  el.type.value = "all";
  el.rating.value = "4.0";

  renderRatingIndicator();
  renderTags();
  renderGrid();
};

const addToWorkflow = async (agentId, agentName, ctaEl) => {
  if (state.added.has(agentId)) return;

  // Click feedback: briefly shrink and show loading spinner.
  const btnWrap = ctaEl;
  const btn = $("button[data-action='add']", btnWrap);
  if (!btn) return;

  btn.style.transform = "scale(0.98)";
  window.setTimeout(() => {
    btn.style.transform = "";
  }, 160);

  btnWrap.innerHTML = buttonMarkup(false, true);

  // Simulated async add.
  await new Promise((r) => window.setTimeout(r, 680));

  state.added.add(agentId);
  btnWrap.innerHTML = buttonMarkup(true, false);

  showToast({
    title: "Added to workflow",
    desc: `${agentName} is ready to use.`,
  });
};

const bindEvents = () => {
  el.q.addEventListener("input", (e) => setSearch(e.target.value));
  el.type.addEventListener("change", (e) => setType(e.target.value));
  el.rating.addEventListener("input", (e) => setMinRating(e.target.value));

  document.addEventListener("click", (e) => {
    const action = e.target?.closest?.("[data-action]")?.getAttribute("data-action");

    if (action === "clear-search") {
      el.q.value = "";
      setSearch("");
      el.q.focus();
      return;
    }

    if (action === "clear-tags") {
      clearTags();
      return;
    }

    if (action === "reset-filters") {
      resetFilters();
      return;
    }

    if (action === "dismiss-toast") {
      dismissToast();
      return;
    }

    const tagBtn = e.target?.closest?.("[data-tag]");
    if (tagBtn) {
      toggleTag(tagBtn.getAttribute("data-tag"));
      return;
    }

    const addBtn = e.target?.closest?.("button[data-action='add']");
    if (addBtn) {
      const card = e.target.closest(".card");
      const id = card?.getAttribute("data-id");
      const agent = agents.find((a) => a.id === id);
      const cta = $("[data-cta]", card);
      if (agent && cta) addToWorkflow(agent.id, agent.name, cta);
    }
  });

  window.addEventListener("keydown", (e) => {
    // Escape dismisses toast for a polished feel.
    if (e.key === "Escape") dismissToast();
  });
};

const init = () => {
  renderRatingIndicator();
  renderTags();
  renderGrid();
  bindEvents();
};

init();
