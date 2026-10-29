/* ==========================================================================
   EVALUATION CLINIC — app (/DDH/)
   One page for students: name/email/group/tool, a share card with this
   page's link and QR code, and tabs for Exercises 1–5. Every answer is
   written to localStorage as it's typed, so a refresh or closed tab loses
   nothing; PDF export covers one activity or all of them.
   ========================================================================== */
(function () {
  "use strict";

  const C = window.CLINIC;
  const PAGE_URL = location.origin + "/DDH/";
  const KEYS = {
    student: "ddhClinic.student.v1",
    tab: "ddhClinic.tab.student",
  };
  const NUMS = [1, 2, 3, 4, 5];

  /* ----- small helpers ------------------------------------------------- */
  const esc = (v) => String(v == null ? "" : v)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  const uid = (p) => p + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  // Lower-case the first letter for use mid-sentence, unless the word is an
  // acronym ("TB score", "OPD slip").
  const lcFirst = (s) => { s = String(s || "").trim(); return s && !/^[A-Z][A-Z0-9]/.test(s) ? s.charAt(0).toLowerCase() + s.slice(1) : s; };
  const endDot = (s) => { s = String(s || "").trim(); return s && !/[.!?]$/.test(s) ? s + "." : s; };
  const store = {
    get(k, fallback) { try { const v = localStorage.getItem(k); return v == null ? fallback : JSON.parse(v); } catch (e) { return fallback; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } },
    del(k) { try { localStorage.removeItem(k); } catch (e) {} },
  };
  const stageOf = (id) => C.STAGES.find((s) => s.id === id);
  const testOf = (id) => C.TESTS.find((t) => t.id === id);
  const challengeOf = (name) => C.CHALLENGES.find((c) => c.name === name);

  /* ----- answers (state) ------------------------------------------------ */
  function blank() {
    return {
      profile: { name: "", email: "", group: "", tool: "" },
      ex1: { order: [], rows: {} },
      ex2: { byRow: {} },
      ex3: { byRow: {}, order: [], items: {} },
      ex4: { byItem: {} },
      ex5: { item: "", who: "", where: "", how: "", canClaim: "", cannotClaim: "", rethink: "" },
      savedAt: 0,
    };
  }
  function normalise(s) {
    const b = blank();
    if (!s || typeof s !== "object") return b;
    const out = Object.assign(b, s);
    ["profile", "ex1", "ex2", "ex3", "ex4", "ex5"].forEach((k) => { out[k] = Object.assign(blank()[k], s[k] || {}); });
    return out;
  }
  const spaces = { student: normalise(store.get(KEYS.student)) };
  const saveTimers = {};
  let saveFailed = false;
  function save(space, now) {
    clearTimeout(saveTimers[space]);
    const write = () => {
      spaces[space].savedAt = Date.now();
      saveFailed = !store.set(KEYS[space], spaces[space]);
      updateSaveStatus();
    };
    if (now) write(); else saveTimers[space] = setTimeout(write, 250);
  }
  window.addEventListener("beforeunload", () => save("student", true));
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") save("student", true);
  });

  function setPath(obj, path, value) {
    const parts = path.split(".");
    let o = obj;
    for (let i = 0; i < parts.length - 1; i++) {
      if (o[parts[i]] == null || typeof o[parts[i]] !== "object") o[parts[i]] = {};
      o = o[parts[i]];
    }
    o[parts[parts.length - 1]] = value;
  }

  /* Derived lists the later exercises build on. */
  function followedRows(S) {
    return S.ex1.order.map((id) => Object.assign({ id: id }, S.ex1.rows[id] || {}))
      .filter((r) => r.follow !== false && ((r.individual || "").trim() || (r.task || "").trim()));
  }
  function relLabel(S, rid, withFeature) {
    const r = S.ex1.rows[rid] || {};
    const f = ((S.ex2.byRow[rid] || {}).feature || "").trim();
    const parts = [(r.individual || "").trim() || "Someone", (r.task || "").trim() || "a task"];
    if (withFeature !== false) parts.push(f || "tool feature?");
    return parts.join(" · ");
  }
  function ex3Items(S) {
    const live = new Set(followedRows(S).map((r) => r.id));
    return S.ex3.order.map((cid) => Object.assign({ cid: cid }, S.ex3.items[cid] || {}))
      .filter((it) => it.rid && live.has(it.rid) && (S.ex3.byRow[it.rid] || {}).stage);
  }

  /* ----- UI state ----------------------------------------------------------- */
  let activeTab = store.get(KEYS.tab, "1");
  let qrBig = false;                             // QR enlarged for projecting
  let picked = null;                             // tap-to-move selection {type, id, space}

  /* ----- rendering: shared pieces ------------------------------------------ */
  function refTable(key) {
    const r = C.REF[key];
    return '<details class="ref"><summary>' + esc(r.title) + "</summary>" +
      (r.note ? '<p class="ref__note">' + esc(r.note) + "</p>" : "") +
      table(r.head, r.rows) +
      (r.cite ? '<p class="ref__cite">' + esc(r.cite) + "</p>" : "") + "</details>";
  }
  function table(head, rows) {
    return '<div class="table-wrap"><table class="tbl"><thead><tr>' + head.map((h) => "<th>" + esc(h) + "</th>").join("") +
      "</tr></thead><tbody>" + rows.map((row) => "<tr>" + row.map((c, i) => "<td" + (i === 0 ? ' class="tbl__key"' : "") + ">" + esc(c) + "</td>").join("") + "</tr>").join("") +
      "</tbody></table></div>";
  }
  function exampleBlock(n) {
    const ex = C.EXAMPLES[n];
    if (!ex) return "";
    return '<details class="ref ref--example"><summary>See the TB-Screen example</summary>' + table(ex.head, ex.rows) +
      (ex.note ? '<p class="ref__note">' + esc(ex.note) + "</p>" : "") + "</details>";
  }
  function intro(ex) {
    return '<div class="intro">' +
      '<p class="eyebrow">' + esc(ex.eyebrow) + "</p>" +
      '<h2 class="ex-title"><span class="text-highlight">Exercise ' + ex.n + " · " + esc(ex.title) + "</span></h2>" +
      '<div class="po">' +
        '<div class="card"><p class="label">Purpose</p><p>' + esc(ex.purpose) + "</p></div>" +
        '<div class="card card--tint"><p class="label">Outcome</p><p>' + esc(ex.outcome) + "</p></div>" +
      "</div>" +
      '<ol class="steps">' + ex.steps.map((s, i) => "<li><b>" + (i + 1) + "</b> " + esc(s) + "</li>").join("") + "</ol>" +
      "</div>";
  }
  const field = (label, space, path, value, opts) => {
    opts = opts || {};
    const id = "f-" + space + "-" + path.replace(/\./g, "-");
    const ctl = opts.area
      ? '<textarea id="' + id + '" rows="' + (opts.rows || 2) + '" data-space="' + space + '" data-path="' + esc(path) + '" placeholder="' + esc(opts.ph || "") + '">' + esc(value) + "</textarea>"
      : '<input id="' + id + '" type="' + (opts.type || "text") + '" data-space="' + space + '" data-path="' + esc(path) + '" value="' + esc(value) + '" placeholder="' + esc(opts.ph || "") + '"' + (opts.auto ? ' autocomplete="' + opts.auto + '"' : "") + ">";
    return '<label class="field' + (opts.cls ? " " + opts.cls : "") + '" for="' + id + '"><span>' + esc(label) + "</span>" + ctl + "</label>";
  };
  const empty = (text) => '<div class="empty">' + esc(text) + "</div>";

  /* ----- activities ------------------------------------------------------------ */
  function act1(S, sp) {
    if (!S.ex1.order.length) {
      const id = uid("r");
      S.ex1.order.push(id);
      S.ex1.rows[id] = { individual: "", conditions: "", task: "", follow: true };
    }
    const rows = S.ex1.order.map((id, i) => {
      const r = S.ex1.rows[id] || {};
      return '<div class="row-card' + (r.follow === false ? " is-set-aside" : "") + '">' +
        '<div class="row-card__head"><span class="row-num">' + (i + 1) + "</span>" +
          '<label class="check"><input type="checkbox" data-space="' + sp + '" data-path="ex1.rows.' + id + '.follow"' + (r.follow === false ? "" : " checked") + "> Follow this pair into Exercise 2</label>" +
          '<button type="button" class="icon-btn" data-action="del-row" data-space="' + sp + '" data-id="' + id + '" aria-label="Remove row ' + (i + 1) + '">✕</button>' +
        "</div>" +
        '<div class="grid-3">' +
          field("Individual", sp, "ex1.rows." + id + ".individual", r.individual, { ph: "e.g. Radiographer" }) +
          field("Characteristics and working conditions", sp, "ex1.rows." + id + ".conditions", r.conditions, { area: true, ph: "Role, skills, language, workload, time available" }) +
          field("Task", sp, "ex1.rows." + id + ".task", r.task, { ph: "e.g. Capture and upload the X-ray" }) +
        "</div></div>";
    }).join("");
    return '<p class="hint">One row per individual–task pair. The same person can appear twice with two different tasks; untick a pair to set it aside.</p>' +
      rows + '<button type="button" class="btn btn--ghost" data-action="add-row" data-space="' + sp + '">+ Add an individual–task pair</button>';
  }

  function act2(S, sp) {
    const rows = followedRows(S);
    if (!rows.length) return empty("Add individuals and tasks in Exercise 1 first — each pair you follow appears here.");
    return '<p class="hint">For each pair from Exercise 1, name the tool feature they meet, then describe both technology relationships.</p>' +
      rows.map((r) => {
        const d = S.ex2.byRow[r.id] || {};
        return '<div class="row-card"><div class="row-card__head"><span class="pair">' + esc(relLabel(S, r.id, false)) + "</span></div>" +
          '<div class="grid-3">' +
            field("Tool feature they meet", sp, "ex2.byRow." + r.id + ".feature", d.feature, { ph: "e.g. upload screen, TB score 0–100" }) +
            field("Individual–technology", sp, "ex2.byRow." + r.id + ".indTech", d.indTech, { area: true, ph: "Does the tool suit this person: skills, language, device, expectations?" }) +
            field("Task–technology", sp, "ex2.byRow." + r.id + ".taskTech", d.taskTech, { area: true, ph: "Does the tool support this task: its steps, timing, what it requires?" }) +
          "</div></div>";
      }).join("") +
      '<div class="card card--list"><p class="label">Step 3 · Your relationships in full</p><ul class="rel-list">' +
        rows.map((r) => "<li>" + esc(relLabel(S, r.id)) + "</li>").join("") + "</ul></div>";
  }

  function relCard(S, sp, rid) {
    const sel = picked && picked.type === "rel" && picked.id === rid && picked.space === sp;
    return '<div class="chip chip--rel' + (sel ? " is-picked" : "") + '" data-drag="rel" data-id="' + rid + '" data-space="' + sp + '" tabindex="0" role="button" aria-pressed="' + sel + '">' +
      '<span class="grip" aria-hidden="true">⠇</span>' + esc(relLabel(S, rid)) + "</div>";
  }
  function act3(S, sp) {
    const rows = followedRows(S);
    if (!rows.length) return empty("This builds on your relationships from Exercises 1 and 2 — add them there first.");
    const at = (stage) => rows.filter((r) => ((S.ex3.byRow[r.id] || {}).stage || "") === stage);
    const zone = (id, title, desc, list) =>
      '<div class="zone' + (id === "" ? " zone--pool" : "") + '" data-drop="rel" data-zone="' + id + '" data-space="' + sp + '">' +
        '<p class="zone__title">' + esc(title) + "</p>" + (desc ? '<p class="zone__desc">' + esc(desc) + "</p>" : "") +
        '<div class="zone__items">' + (list.length ? list.map((r) => relCard(S, sp, r.id)).join("") : '<span class="zone__empty">Drop here</span>') + "</div></div>";
    const board = '<p class="hint">Drag each relationship onto the stage of the care pathway where it applies. (Or tap a relationship, then tap a stage.)</p>' +
      zone("", "Not placed yet", "", at("")) +
      '<div class="board">' + C.STAGES.map((s) => zone(s.id, s.label, s.desc, at(s.id))).join("") + "</div>";

    const placed = rows.filter((r) => (S.ex3.byRow[r.id] || {}).stage);
    const picks = placed.map((r) => {
      const stage = stageOf(S.ex3.byRow[r.id].stage);
      const mine = S.ex3.order.filter((cid) => (S.ex3.items[cid] || {}).rid === r.id);
      const chosen = new Set(mine.map((cid) => S.ex3.items[cid].challenge));
      const options = C.CHALLENGES.filter((c) => c.stage === stage.id || c.stage === "across" || chosen.has(c.name));
      return '<div class="row-card"><div class="row-card__head"><span class="pair">' + esc(relLabel(S, r.id)) + '</span><span class="tag tag--' + stage.id + '">' + esc(stage.label) + "</span></div>" +
        '<p class="mini">Challenges at this stage, plus those across stages — tap to add:</p><div class="chips">' +
        options.map((c) => '<button type="button" class="chip chip--challenge' + (chosen.has(c.name) ? " is-on" : "") + (c.stage !== stage.id && c.stage !== "across" ? " is-off-stage" : "") + '" data-action="toggle-challenge" data-space="' + sp + '" data-id="' + r.id + '" data-name="' + esc(c.name) + '" title="' + esc(c.def) + '" aria-pressed="' + chosen.has(c.name) + '">' +
          esc(c.name) + (c.stage === "across" ? ' <small>across</small>' : "") + "</button>").join("") + "</div>" +
        mine.map((cid) => {
          const it = S.ex3.items[cid];
          const ch = challengeOf(it.challenge);
          return '<div class="sub">' + '<p class="sub__title">' + esc(it.challenge) + (ch ? ' <span class="sub__def">— ' + esc(ch.def) + "</span>" : "") + "</p>" +
            field("What it means for your tool", sp, "ex3.items." + cid + ".meaning", it.meaning, { area: true, ph: "e.g. Old machine and power cuts: unreadable images, failed uploads" }) + "</div>";
        }).join("") + "</div>";
    }).join("");
    return board + (placed.length ? '<h3 class="sec-title">Challenges for each placed relationship</h3>' + picks : "");
  }

  function act4(S, sp) {
    const items = ex3Items(S);
    if (!items.length) return empty("This builds on Exercise 3 — place your relationships on the pathway and pick their challenges there first.");
    const palette = '<div class="palette" aria-label="Tests from Lecture 6"><p class="label">Tests from Lecture 6 — drag one onto a relationship (or tap, then tap its test slot)</p><div class="chips">' +
      C.TESTS.map((t) => {
        const sel = picked && picked.type === "test" && picked.id === t.id && picked.space === sp;
        return '<div class="chip chip--test' + (sel ? " is-picked" : "") + '" data-drag="test" data-id="' + t.id + '" data-space="' + sp + '" tabindex="0" role="button" aria-pressed="' + sel + '" title="' + esc(t.checks) + '"><span class="grip" aria-hidden="true">⠇</span>' + esc(t.name) + ' <span class="tag tag--' + t.stage + '">' + esc(stageOf(t.stage).label) + "</span></div>";
      }).join("") + "</div></div>";
    const cards = items.map((it) => {
      const d = S.ex4.byItem[it.cid] || {};
      const stage = stageOf(S.ex3.byRow[it.rid].stage);
      const t = testOf(d.test);
      const suggested = C.TESTS.filter((x) => x.stage === stage.id).map((x) => x.name).join(" or ");
      const p = "ex4.byItem." + it.cid + ".";
      return '<div class="row-card">' +
        '<div class="row-card__head"><span class="pair">' + esc(relLabel(S, it.rid)) + '</span><span class="tag tag--' + stage.id + '">' + esc(stage.label) + "</span></div>" +
        '<p class="mini"><b>Challenge:</b> ' + esc(it.challenge) + (it.meaning ? " — " + esc(it.meaning) : "") + "</p>" +
        '<div class="step"><p class="step__label"><b>1</b> Check · Is it already handled by your design?</p><div class="seg" role="group">' +
          ["Yes", "Partly", "No"].map((v) => '<button type="button" class="seg__btn' + (d.handled === v ? " is-on" : "") + '" data-action="handled" data-space="' + sp + '" data-id="' + it.cid + '" data-val="' + v + '" aria-pressed="' + (d.handled === v) + '">' + v + "</button>").join("") +
        "</div></div>" +
        '<div class="step"><p class="step__label"><b>2</b> Change · What changes (or which conditions you scope)?</p><div class="grid-change">' +
          '<label class="field"><span>Part that changes</span><select data-space="' + sp + '" data-path="' + p + 'changeKind">' + ['<option value="">Choose…</option>'].concat(C.CHANGE_KINDS.map((k) => '<option' + (d.changeKind === k ? " selected" : "") + ">" + k + "</option>")).join("") + "</select></label>" +
          field("What changes", sp, p + "change", d.change, { ph: d.handled === "Yes" ? "Already handled — note how, or leave blank" : "e.g. score printed on the OPD token slip" }) +
        "</div></div>" +
        '<div class="step"><p class="step__label"><b>3</b> Pick the test' + (suggested ? ' <span class="muted">(fits this stage: ' + esc(suggested) + ")</span>" : "") + '</p>' +
          '<div class="slot' + (t ? " is-filled" : "") + '" data-drop="test" data-zone="' + it.cid + '" data-space="' + sp + '">' +
            (t ? '<span class="slot__val">' + esc(t.name) + '</span><button type="button" class="icon-btn" data-action="clear-test" data-space="' + sp + '" data-id="' + it.cid + '" aria-label="Clear test">✕</button>' : '<span class="slot__ph">Drop a test here</span>') +
          "</div></div>" +
        '<div class="step"><p class="step__label"><b>4</b> Set the gate</p><div class="grid-3">' +
          field("Measure", sp, p + "measure", d.measure, { ph: "e.g. % of decisions with the score ready beforehand" }) +
          field("Compared with", sp, p + "compared", d.compared, { ph: "e.g. time of the MO's decision, observed" }) +
          field("Go on only if", sp, p + "gate", d.gate, { ph: "e.g. score ready before at least 80% of decisions" }) +
        "</div></div></div>";
    }).join("");
    return palette + cards;
  }

  function ex5Preview(S) {
    const e = S.ex5;
    const claim = (e.canClaim || e.cannotClaim)
      ? "This will let us claim " + esc(e.canClaim || "…") + ". It will not show <em>" + esc(e.cannotClaim || "…") + "</em>."
      : "…";
    const line = (k, v, raw) => '<div class="stmt__row"><span class="stmt__k">' + k + '</span><span class="stmt__v">' + (raw ? v : esc(v)) + "</span></div>";
    return '<div class="stmt">' +
      line("Ex. 1–2", e.who || "…") + line("Ex. 3", e.where || "…") + line("Ex. 4", e.how || "…") +
      line("Claim", claim, true) +
      "</div>" + '<div class="stmt stmt--rethink">' + line("Rethink", e.rethink || "…") + "</div>";
  }
  function act5(S, sp) {
    const items = ex3Items(S);
    const e = S.ex5;
    const opts = ['<option value="">Choose one…</option>'].concat(items.map((it) =>
      '<option value="' + it.cid + '"' + (e.item === it.cid ? " selected" : "") + ">" + esc(relLabel(S, it.rid) + " — " + it.challenge) + "</option>")).join("");
    return '<div class="card card--list">' +
      '<label class="field"><span>Which relationship and challenge is your statement about?</span><select data-space="' + sp + '" data-path="ex5.item">' + opts + "</select></label>" +
      '<button type="button" class="btn" data-action="draft5" data-space="' + sp + '"' + (items.length ? "" : " disabled") + ">Draft lines 1–3 from my Exercises 1–4</button>" +
      (items.length ? "" : '<p class="mini">Complete Exercises 1–3 to draft from them, or write the statement yourself below.</p>') +
      "</div>" +
      '<div class="grid-2">' +
        "<div>" +
          field("Who and what (Ex. 1–2)", sp, "ex5.who", e.who, { area: true, ph: "For the medical officer deciding who needs a sputum test using the TB score," }) +
          field("Where it can fail (Ex. 3)", sp, "ex5.where", e.where, { area: true, ph: "at the interpreting-outputs stage, decision-point disconnect means…" }) +
          field("How you'll know (Ex. 4)", sp, "ex5.how", e.how, { area: true, ph: "We will … and run a …, going on only if …" }) +
          field("This will let us claim…", sp, "ex5.canClaim", e.canClaim, { ph: "the score reaches the decision in a busy OPD" }) +
          field("It will not show…", sp, "ex5.cannotClaim", e.cannotClaim, { ph: "whether more TB is treated" }) +
          field("Rethink: what your plan missed, and what you'll change", sp, "ex5.rethink", e.rethink, { area: true, rows: 3 }) +
        "</div>" +
        '<div><p class="label">Your evidence statement</p><div class="ex5-preview" data-preview="' + sp + '">' + ex5Preview(S) + "</div></div>" +
      "</div>";
  }
  const ACTS = { 1: act1, 2: act2, 3: act3, 4: act4, 5: act5 };

  function activity(n, sp) {
    const ex = C.EXERCISES[n - 1];
    const S = spaces[sp];
    const tools = '<div class="toolbar"><button type="button" class="btn" data-action="export" data-space="student" data-n="' + n + '">Export this activity (PDF)</button></div>';
    return '<div class="activity" data-ex="' + n + '" data-space="' + sp + '">' +
      tools +
      '<div class="refs">' + ex.refs.map(refTable).join("") + exampleBlock(n) + "</div>" +
      '<div class="work">' + ACTS[n](S, sp) + "</div></div>";
  }

  /* ----- page shells ------------------------------------------------------------ */
  function header(sub) {
    return '<header class="top"><div class="wrap">' +
      '<p class="eyebrow">' + esc(sub) + "</p>" +
      '<h1 class="title">Evaluation Clinic</h1>' +
      '<p class="byline">Ayesha Mirza &amp; Ameemah Humayun · Awaaz-e-Sehat Researchers</p>' +
      "</div></header>";
  }
  function tabs(list) {
    return '<nav class="tabs" role="tablist"><div class="wrap tabs__row">' + list.map((t) =>
      '<button type="button" role="tab" class="tab' + (activeTab === t.id ? " is-active" : "") + '" aria-selected="' + (activeTab === t.id) + '" data-action="tab" data-id="' + t.id + '">' +
        esc(t.label) + "</button>").join("") +
      "</div></nav>";
  }
  function qrSvg() {
    try {
      const q = window.qrcode(0, "M");
      q.addData(PAGE_URL);
      q.make();
      return q.createSvgTag({ cellSize: 8, margin: 2, scalable: true, alt: "QR code for " + PAGE_URL });
    } catch (e) { return '<p class="mini">QR code unavailable.</p>'; }
  }
  // Same layout the old lecturer "Student site" tab had: a link card with
  // Copy and Open, next to a large QR card (tap it to go full-screen).
  function shareCard() {
    return '<div class="share">' +
      '<div class="card share__link"><p class="label">Link to this page</p>' +
        '<div class="link-row"><input id="page-link" type="text" readonly value="' + esc(PAGE_URL) + '" aria-label="Link to this page">' +
        '<button type="button" class="btn" data-action="copy-link">Copy</button>' +
        '<a class="btn btn--ghost" href="' + esc(PAGE_URL) + '" target="_blank" rel="noopener">Open</a></div>' +
        '<p class="mini">Share this link or the QR code. Answers save on each person\u2019s own device as they type, and each person exports a PDF when done.</p>' +
      "</div>" +
      '<div class="card share__qr"><button type="button" class="qr" data-action="qr-zoom" aria-label="Show QR code full-screen">' + qrSvg() + "</button>" +
        '<p class="mini">Scan to open this page \u00B7 tap to show full-screen</p></div>' +
      "</div>";
  }
  function qrOverlay() {
    return qrBig ? '<div class="qr-overlay" data-action="qr-zoom" role="dialog" aria-label="QR code, full screen">' +
      '<div class="qr qr--big">' + qrSvg() + '</div><p class="qr-overlay__url">' + esc(PAGE_URL) + '</p><p class="mini">Tap anywhere to close</p></div>' : "";
  }

  function studentHead() {
    const S = spaces.student;
    const sp = "student";
    return '<section class="wrap head-stack"><div class="you card">' +
      '<p class="label">Your details</p><div class="grid-4">' +
        field("Name", sp, "profile.name", S.profile.name, { auto: "name" }) +
        field("Email", sp, "profile.email", S.profile.email, { type: "email", auto: "email" }) +
        field("Group number", sp, "profile.group", S.profile.group, { ph: "e.g. 3" }) +
        field("Your tool", sp, "profile.tool", S.profile.tool, { ph: "The tool your group is evaluating" }) +
      "</div>" +
      '<div class="you__foot"><span class="save-status" id="save-status"></span>' +
        '<button type="button" class="btn" data-action="export" data-space="student" data-n="all">Export all activities (PDF)</button></div>' +
      "</div>" + shareCard() + "</section>";
  }
  function studentExercise(n) {
    const ex = C.EXERCISES[n - 1];
    return '<section class="panel wrap">' + intro(ex) + activity(n, "student") + "</section>";
  }

  const app = document.getElementById("app");
  function render() {
    // Keep whatever the user was typing in focused across a re-render.
    const a = document.activeElement;
    const keep = a && a.dataset && a.dataset.path ? { space: a.dataset.space, path: a.dataset.path, s: a.selectionStart, e: a.selectionEnd } : null;
    const y = window.scrollY;
    if (!NUMS.includes(Number(activeTab))) activeTab = "1";
    app.innerHTML = header("DDH") + studentHead() +
      tabs(NUMS.map((n) => ({ id: String(n), label: "Exercise " + n }))) +
      '<main id="main">' + studentExercise(Number(activeTab)) + "</main>" + qrOverlay();
    if (keep) {
      const el = app.querySelector('[data-space="' + keep.space + '"][data-path="' + CSS.escape(keep.path) + '"]');
      if (el) { el.focus({ preventScroll: true }); try { el.setSelectionRange(keep.s, keep.e); } catch (e) {} }
    }
    window.scrollTo(0, y);
    if (picked) app.querySelectorAll('[data-drop="' + picked.type + '"][data-space="' + picked.space + '"]').forEach((z) => z.classList.add("is-armed"));
    updateSaveStatus();
  }
  function updateSaveStatus() {
    const el = document.getElementById("save-status");
    if (!el) return;
    const t = spaces.student.savedAt;
    el.textContent = saveFailed ? "Couldn’t save on this device (private browsing?) — export a PDF before leaving."
      : t ? "Saved on this device · " + new Date(t).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Answers save on this device as you type.";
    el.classList.toggle("is-warn", saveFailed);
  }
  function rerenderActivity(sp) {
    // Structural change inside an activity: re-render the whole view, which
    // keeps scroll and focus (see render()).
    render();
  }

  /* ----- input + actions ------------------------------------------------------------ */
  app.addEventListener("input", (e) => {
    const el = e.target;
    if (!el.dataset || !el.dataset.path) return;
    const sp = el.dataset.space;
    const S = spaces[sp];
    setPath(S, el.dataset.path, el.type === "checkbox" ? el.checked : el.value);
    save(sp);
    if (el.dataset.path.indexOf("ex5.") === 0) {
      const pv = app.querySelector('[data-preview="' + sp + '"]');
      if (pv) pv.innerHTML = ex5Preview(S);
    }
  });
  app.addEventListener("change", (e) => {
    const el = e.target;
    if (!el.dataset || !el.dataset.path) return;
    // Checkboxes and selects change structure (e.g. which pairs follow on).
    if (el.type === "checkbox" || el.tagName === "SELECT") rerenderActivity(el.dataset.space);
  });

  app.addEventListener("click", (e) => {
    const zoneEl = e.target.closest("[data-drop]");
    if (zoneEl && picked && !e.target.closest("[data-drag]") && !e.target.closest("[data-action]")) {
      if (picked.type === zoneEl.dataset.drop && picked.space === zoneEl.dataset.space) {
        drop(picked.type, picked.id, zoneEl.dataset.zone, picked.space);
        return;
      }
    }
    const b = e.target.closest("[data-action]");
    if (!b || b.disabled) return;
    const sp = b.dataset.space;
    const S = sp ? spaces[sp] : null;
    const id = b.dataset.id;
    switch (b.dataset.action) {
      case "tab":
        activeTab = b.dataset.id; store.set(KEYS.tab, activeTab); picked = null; render();
        window.scrollTo(0, 0);
        break;
      case "add-row": {
        const nid = uid("r");
        S.ex1.order.push(nid); S.ex1.rows[nid] = { individual: "", conditions: "", task: "", follow: true };
        save(sp); render();
        const f = app.querySelector('[data-path="ex1.rows.' + nid + '.individual"]'); if (f) f.focus();
        break;
      }
      case "del-row": {
        const r = S.ex1.rows[id] || {};
        const used = (r.individual || r.task || r.conditions);
        if (used && !confirm("Remove this row? Anything you wrote for it in later exercises will no longer show.")) return;
        S.ex1.order = S.ex1.order.filter((x) => x !== id);
        save(sp); render();
        break;
      }
      case "toggle-challenge": {
        const name = b.dataset.name;
        const cid = S.ex3.order.find((c) => (S.ex3.items[c] || {}).rid === id && S.ex3.items[c].challenge === name);
        if (cid) {
          if ((S.ex3.items[cid].meaning || "").trim() && !confirm("Remove “" + name + "” and what you wrote about it?")) return;
          S.ex3.order = S.ex3.order.filter((c) => c !== cid);
          delete S.ex3.items[cid];
        } else {
          const nid = uid("c");
          S.ex3.items[nid] = { rid: id, challenge: name, meaning: "" };
          S.ex3.order.push(nid);
        }
        save(sp); render();
        break;
      }
      case "handled":
        setPath(S, "ex4.byItem." + id + ".handled", b.dataset.val); save(sp); render(); break;
      case "clear-test":
        setPath(S, "ex4.byItem." + id + ".test", ""); save(sp); render(); break;
      case "draft5": draft5(S); save(sp); render(); break;
      case "export": exportPdf(sp, b.dataset.n); break;
      case "qr-zoom":
        qrBig = !qrBig; render(); break;
      case "copy-link": {
        const inp = document.getElementById("page-link");
        const done = () => { b.textContent = "Copied"; setTimeout(() => { b.textContent = "Copy"; }, 1500); };
        if (navigator.clipboard) navigator.clipboard.writeText(PAGE_URL).then(done, () => { inp.select(); document.execCommand("copy"); done(); });
        else { inp.select(); document.execCommand("copy"); done(); }
        break;
      }
    }
  });
  app.addEventListener("keydown", (e) => {
    const d = e.target.closest && e.target.closest("[data-drag]");
    if (d && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); pick(d); }
  });
  // On the document, not #app: after opening the QR, focus sits on <body>.
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && qrBig) { qrBig = false; render(); }
  });

  function draft5(S) {
    const it = ex3Items(S).find((x) => x.cid === S.ex5.item) || ex3Items(S)[0];
    if (!it) return;
    S.ex5.item = it.cid;
    const r = S.ex1.rows[it.rid] || {};
    const f = (S.ex2.byRow[it.rid] || {}).feature;
    const stage = stageOf(S.ex3.byRow[it.rid].stage);
    const d = S.ex4.byItem[it.cid] || {};
    const t = testOf(d.test);
    S.ex5.who = "For the " + lcFirst(r.individual || "user") + (r.task ? " (" + lcFirst(r.task) + ")" : "") + (f ? ", using the " + lcFirst(f) : "") + ",";
    S.ex5.where = "at the " + stage.label.toLowerCase() + " stage, " + lcFirst(it.challenge) + (it.meaning ? " means " + lcFirst(endDot(it.meaning)) : ".");
    let how = d.handled === "Yes" ? "Our design already handles this" : d.change ? "We will " + (d.changeKind ? "change the " + d.changeKind.toLowerCase() + ": " : "") + lcFirst(d.change) : "We will …";
    how += t ? " and run a " + lcFirst(t.name) : " and run …";
    how += d.gate ? ", going on only if " + lcFirst(endDot(d.gate)) : ", going on only if …";
    S.ex5.how = how;
  }

  /* ----- drag and drop (mouse, pen and touch) -------------------------------------------- */
  let drag = null;
  app.addEventListener("pointerdown", (e) => {
    const el = e.target.closest("[data-drag]");
    if (!el || e.button > 0) return;
    drag = { el: el, x: e.clientX, y: e.clientY, started: false, ghost: null, over: null, id: e.pointerId };
  });
  window.addEventListener("pointermove", (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    if (!drag.started) {
      if (Math.hypot(e.clientX - drag.x, e.clientY - drag.y) < 6) return;
      drag.started = true;
      const r = drag.el.getBoundingClientRect();
      drag.dx = drag.x - r.left; drag.dy = drag.y - r.top;
      drag.ghost = drag.el.cloneNode(true);
      drag.ghost.classList.add("ghost");
      drag.ghost.style.width = r.width + "px";
      document.body.appendChild(drag.ghost);
      drag.el.classList.add("is-dragging");
      document.body.classList.add("is-dnd");
      app.querySelectorAll('[data-drop="' + drag.el.dataset.drag + '"][data-space="' + drag.el.dataset.space + '"]').forEach((z) => z.classList.add("is-armed"));
    }
    e.preventDefault();
    drag.ghost.style.transform = "translate(" + (e.clientX - drag.dx) + "px," + (e.clientY - drag.dy) + "px)";
    const under = document.elementFromPoint(e.clientX, e.clientY);
    const z = under && under.closest('[data-drop="' + drag.el.dataset.drag + '"][data-space="' + drag.el.dataset.space + '"]');
    if (z !== drag.over) {
      if (drag.over) drag.over.classList.remove("is-over");
      if (z) z.classList.add("is-over");
      drag.over = z;
    }
    // Scroll the page when dragging near its top or bottom edge.
    const edge = 60;
    if (e.clientY < edge) window.scrollBy(0, -12);
    else if (e.clientY > window.innerHeight - edge) window.scrollBy(0, 12);
  }, { passive: false });
  const endDrag = (e) => {
    if (!drag || (e && e.pointerId !== drag.id)) return;
    const d = drag;
    drag = null;
    if (!d.started) { if (e && e.type === "pointerup") pick(d.el); return; }
    d.ghost.remove();
    d.el.classList.remove("is-dragging");
    document.body.classList.remove("is-dnd");
    app.querySelectorAll(".is-armed, .is-over").forEach((z) => z.classList.remove("is-armed", "is-over"));
    if (d.over) drop(d.el.dataset.drag, d.el.dataset.id, d.over.dataset.zone, d.el.dataset.space);
  };
  window.addEventListener("pointerup", endDrag);
  window.addEventListener("pointercancel", endDrag);

  function pick(el) {
    const p = { type: el.dataset.drag, id: el.dataset.id, space: el.dataset.space };
    picked = picked && picked.type === p.type && picked.id === p.id && picked.space === p.space ? null : p;
    render();
  }
  function drop(type, id, zone, sp) {
    const S = spaces[sp];
    if (type === "rel") setPath(S, "ex3.byRow." + id + ".stage", zone || "");
    if (type === "test") setPath(S, "ex4.byItem." + zone + ".test", id);
    picked = null;
    save(sp);
    render();
  }

  /* ----- PDF export ------------------------------------------------------------------ */
  function exportRows(S, n) {
    if (n === 1) return { head: [["Individual", "Characteristics and working conditions", "Task", "Followed?"]],
      body: S.ex1.order.map((id) => S.ex1.rows[id] || {}).filter((r) => r.individual || r.task || r.conditions).map((r) => [r.individual || "", r.conditions || "", r.task || "", r.follow === false ? "Set aside" : "Yes"]) };
    if (n === 2) return { head: [["Individual · task · technology", "Individual–technology", "Task–technology"]],
      body: followedRows(S).map((r) => { const d = S.ex2.byRow[r.id] || {}; return [relLabel(S, r.id), d.indTech || "", d.taskTech || ""]; }) };
    if (n === 3) return { head: [["Individual · task · technology", "Stage", "Challenge", "What it means for your tool"]],
      body: followedRows(S).flatMap((r) => {
        const st = (S.ex3.byRow[r.id] || {}).stage;
        const its = ex3Items(S).filter((it) => it.rid === r.id);
        if (!st) return [[relLabel(S, r.id), "Not placed", "", ""]];
        if (!its.length) return [[relLabel(S, r.id), stageOf(st).label, "", ""]];
        return its.map((it) => [relLabel(S, r.id), stageOf(st).label, it.challenge, it.meaning || ""]);
      }) };
    if (n === 4) return { head: [["Relationship", "Challenge", "Handled?", "What changes", "Test", "Measure", "Compared with", "Go on only if"]],
      body: ex3Items(S).map((it) => { const d = S.ex4.byItem[it.cid] || {}; const t = testOf(d.test);
        return [relLabel(S, it.rid), it.challenge, d.handled || "", (d.changeKind ? d.changeKind + ": " : "") + (d.change || ""), t ? t.name : "", d.measure || "", d.compared || "", d.gate || ""]; }) };
    const e = S.ex5;
    return { head: [["", "Evidence statement"]], body: [
      ["Ex. 1–2", e.who || ""], ["Ex. 3", e.where || ""], ["Ex. 4", e.how || ""],
      ["Claim", (e.canClaim || e.cannotClaim) ? "This will let us claim " + (e.canClaim || "…") + ". It will not show " + (e.cannotClaim || "…") + "." : ""],
      ["Rethink", e.rethink || ""],
    ] };
  }
  function exportPdf(sp, which) {
    const S = spaces[sp];
    const nums = which === "all" ? NUMS : [Number(which)];
    if (!(S.profile.name || "").trim()) {
      alert("Please add your name (and email and group number) under “Your details” first, so your PDF is labelled.");
      const f = app.querySelector('[data-path="profile.name"]'); if (f) f.focus();
      return;
    }
    if (!window.jspdf || !window.jspdf.jsPDF) { alert("The PDF tool didn’t load. Check your connection and refresh — your answers are saved."); return; }
    const doc = new window.jspdf.jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
    const W = doc.internal.pageSize.getWidth();
    const M = 40;
    const accent = [140, 31, 43];
    let y = M;
    doc.setFont("helvetica", "bold"); doc.setFontSize(20); doc.setTextColor(30, 30, 30);
    doc.text("Evaluation Clinic", M, y + 6); y += 28;
    doc.setFont("helvetica", "normal"); doc.setFontSize(10); doc.setTextColor(90, 90, 90);
    const p = S.profile;
    const who = [["Name", p.name], ["Email", p.email], ["Group", p.group], ["Tool", p.tool]].filter((x) => (x[1] || "").trim()).map((x) => x[0] + ": " + x[1]).join("    ");
    if (who) { doc.text(doc.splitTextToSize(who, W - 2 * M), M, y); y += 16; }
    doc.text("Exported " + new Date().toLocaleString(), M, y); y += 18;
    nums.forEach((n, i) => {
      const ex = C.EXERCISES[n - 1];
      if (i > 0) { doc.addPage(); y = M; }
      doc.setFont("helvetica", "bold"); doc.setFontSize(9); doc.setTextColor(accent[0], accent[1], accent[2]);
      doc.text(ex.eyebrow.toUpperCase(), M, y + 4); y += 18;
      doc.setFontSize(15); doc.setTextColor(30, 30, 30);
      doc.text("Exercise " + n + " · " + ex.title, M, y + 4); y += 18;
      doc.setFont("helvetica", "normal"); doc.setFontSize(9.5); doc.setTextColor(90, 90, 90);
      const pl = doc.splitTextToSize("Purpose: " + ex.purpose, W - 2 * M);
      doc.text(pl, M, y + 4); y += pl.length * 12 + 6;
      const t = exportRows(S, n);
      const body = t.body.length ? t.body : [[{ content: "Nothing written yet.", colSpan: t.head[0].length }]];
      doc.autoTable({
        startY: y, head: t.head, body: body, margin: { left: M, right: M },
        styles: { font: "helvetica", fontSize: 9, cellPadding: 5, overflow: "linebreak", textColor: [35, 35, 35], lineColor: [220, 210, 213], lineWidth: 0.5 },
        headStyles: { fillColor: [246, 227, 232], textColor: [30, 30, 30], fontStyle: "bold" },
        columnStyles: n === 5 ? { 0: { cellWidth: 70, fontStyle: "bold", textColor: accent } } : {},
        theme: "grid",
      });
      y = doc.lastAutoTable.finalY + 20;
    });
    const safe = (s) => String(s || "").trim().replace(/[^\w\-]+/g, "-").replace(/^-+|-+$/g, "");
    const name = ["Evaluation-Clinic", which === "all" ? "" : "Exercise-" + which, p.group ? "Group-" + safe(p.group) : "", safe(p.name)].filter(Boolean).join("_");
    doc.save(name + ".pdf");
  }

  /* ----- start ------------------------------------------------------------------------ */
  render();
  // Another tab of this page saved answers: pick them up instead of
  // overwriting them later with stale data.
  window.addEventListener("storage", (e) => {
    if (e.key !== KEYS.student) return;
    if (document.activeElement && document.activeElement.dataset && document.activeElement.dataset.space === "student") return;
    spaces.student = normalise(store.get(e.key));
    render();
  });
})();
