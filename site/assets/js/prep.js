/* Prep agenda controller.
   - State lives in localStorage ONLY. Nothing is transmitted; nothing goes in
     the URL. A single key holds the fiduciary/asset fields plus the most recent
     completed walkthrough (facts + the questions it raised).
   - Any element with [data-prep="key"] is auto-persisted (text inputs, textarea,
     checkboxes). The walkthrough hands its result over via the "ep:terminal"
     CustomEvent dispatched by tree.js — decoupled, so each works without the other.
   - Print / Save as PDF uses the browser's own print (A4 print stylesheet).
   - Clear my answers genuinely wipes the key and resets the UI. */
(function () {
  "use strict";

  var KEY = "epny.prep.v1";
  var agenda = document.getElementById("agenda");
  if (!agenda) return;

  var walkEl = document.getElementById("agendaWalk");
  var dateEl = document.getElementById("agendaDate");
  var fields = [].slice.call(document.querySelectorAll("[data-prep]"));

  function load() { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } }
  function save() { state.updated = new Date().toISOString(); try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {} }
  var state = load();

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }
  function block(title, listNode) {
    var wrap = el("div", "agenda__block");
    wrap.appendChild(el("h3", "agenda__h", title));
    wrap.appendChild(listNode);
    return wrap;
  }
  function makeList(tag, items) {
    var l = el(tag, "agenda__list");
    items.forEach(function (t) { l.appendChild(el("li", null, t)); });
    return l;
  }

  if (dateEl) dateEl.textContent = new Date().toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });

  // restore persisted fields
  var f = state.fields || {};
  fields.forEach(function (node) {
    var k = node.getAttribute("data-prep");
    if (node.type === "checkbox") node.checked = !!f[k];
    else if (f[k] != null) node.value = f[k];
  });
  function persistFields() {
    var out = {};
    fields.forEach(function (node) {
      var k = node.getAttribute("data-prep");
      out[k] = node.type === "checkbox" ? node.checked : node.value;
    });
    state.fields = out;
    save();
  }
  fields.forEach(function (node) {
    node.addEventListener(node.type === "checkbox" ? "change" : "input", persistFields);
  });

  function renderWalk() {
    walkEl.innerHTML = "";
    var w = state.walk;
    if (!w) {
      walkEl.appendChild(el("p", "agenda-empty",
        "Complete the walkthrough above and your answers — and the questions it raises — will appear here, ready to print."));
      return;
    }
    if (w.facts && w.facts.length) {
      walkEl.appendChild(block("Your answers",
        makeList("ul", w.facts.map(function (a) { return a.label + ": " + a.fact; }))));
    }
    var t = w.terminal || {};
    if (t.attorneyQuestions && t.attorneyQuestions.length) {
      walkEl.appendChild(block("Questions to ask your attorney", makeList("ol", t.attorneyQuestions)));
    }
    if (t.worthConfirming && t.worthConfirming.length) {
      walkEl.appendChild(block("Worth confirming", makeList("ul", t.worthConfirming)));
    }
  }

  // walkthrough completion -> agenda (replace the walk section with this walk)
  document.addEventListener("ep:terminal", function (e) {
    state.walk = { facts: e.detail.facts, terminal: e.detail.terminal };
    save();
    renderWalk();
    agenda.scrollIntoView({ block: "start" });
  });

  var printBtn = document.getElementById("printAgenda");
  if (printBtn) printBtn.addEventListener("click", function () { window.print(); });

  var clearBtn = document.getElementById("clearAnswers");
  if (clearBtn) clearBtn.addEventListener("click", function () {
    if (!window.confirm("Clear everything you've entered on this page? This wipes it from this browser and can't be undone.")) return;
    try { localStorage.removeItem(KEY); } catch (e) {}
    state = {};
    fields.forEach(function (node) {
      if (node.type === "checkbox") node.checked = false; else node.value = "";
    });
    renderWalk();
  });

  renderWalk();
})();
