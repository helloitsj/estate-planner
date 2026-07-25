/* Decision-tree renderer. One walker for any tree.json — adding branches is a
   data edit, never a code edit. Progressive enhancement: the page ships a
   static fallback (#treeStatic); this reveals the interactive walkthrough
   (#tree) only if JS runs and the data validates.

   A load-time validator enforces THE RULE structurally: a guidance terminal
   cannot render without explainers[], attorneyQuestions[] and worthConfirming[];
   a scope exit cannot render without a body and attorneyQuestions[]. Bad data
   fails loudly here instead of shipping a terminal that forgets its questions.

   Answer state is kept in memory for now; localStorage + the printable agenda
   arrive with the prep document (G4). */
(function () {
  "use strict";

  var DATA_DIR = "../../data/ny/";
  var SHAPES_URL = DATA_DIR + "shapes.json";
  var mount = document.getElementById("tree");
  var staticEl = document.getElementById("treeStatic");
  if (!mount) return;
  var shapes = [], currentShape = null;

  function el(tag, cls, html) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  }
  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }

  function validate(tree) {
    var errs = [];
    var nodes = tree.nodes || {};
    var start = tree.meta && tree.meta.start;
    var maxDepth = (tree.meta && tree.meta.maxDepth) || 99;
    if (!nodes[start]) errs.push("meta.start '" + start + "' is not a node.");

    Object.keys(nodes).forEach(function (id) {
      var n = nodes[id];
      if (n.type === "question") {
        if (!n.options || !n.options.length) errs.push(id + ": question has no options.");
        (n.options || []).forEach(function (o, i) {
          var target = o.next || o.terminal;
          if (!target) errs.push(id + " option " + i + ": missing next/terminal.");
          else if (!nodes[target]) errs.push(id + " option " + i + ": target '" + target + "' does not exist.");
        });
      } else if (n.type === "guidance") {
        ["explainers", "attorneyQuestions", "worthConfirming"].forEach(function (k) {
          if (!n[k] || !n[k].length) errs.push(id + " (guidance): missing " + k + ".");
        });
      } else if (n.type === "scopeExit") {
        if (!n.body) errs.push(id + " (scopeExit): missing body.");
        if (!n.attorneyQuestions || !n.attorneyQuestions.length) errs.push(id + " (scopeExit): missing attorneyQuestions.");
      } else {
        errs.push(id + ": unknown type '" + n.type + "'.");
      }
    });

    // assert no path exceeds maxDepth (questions deep), and no cycles
    var deepest = 0;
    (function walk(id, depth, seen) {
      var n = nodes[id];
      if (!n) return;
      if (n.type === "question") {
        if (depth > deepest) deepest = depth;
        if (seen.indexOf(id) !== -1) { errs.push("cycle through " + id); return; }
        (n.options || []).forEach(function (o) {
          walk(o.next || o.terminal, depth + (o.next ? 1 : 0), seen.concat(id));
        });
      }
    })(start, 1, []);
    if (deepest > maxDepth) errs.push("a path has " + deepest + " questions, exceeding meta.maxDepth " + maxDepth + ".");

    return errs;
  }

  var TREE, answers = [], history = [];

  function start() {
    answers = [];
    history = [];
    render(TREE.meta.start);
  }

  function record(node, opt) {
    if (node.agendaLabel) answers.push({ label: node.agendaLabel, choice: opt.label, fact: opt.fact || opt.label });
  }

  function renderShapebar() {
    var bar = el("div", "shapebar");
    bar.appendChild(el("span", "shapebar__lab",
      "Household: <strong>" + esc(currentShape.label) + "</strong>"));
    var change = el("button", "linkbtn", "Change household");
    change.type = "button";
    change.addEventListener("click", renderChooser);
    bar.appendChild(change);
    mount.appendChild(bar);
  }

  function renderChooser() {
    mount.innerHTML = "";
    if (staticEl) staticEl.hidden = true;
    mount.hidden = false;
    var card = el("div", "qcard");
    var h = el("h2", "qtext", "Which describes your household?");
    h.setAttribute("tabindex", "-1"); h.setAttribute("data-focus", "1");
    card.appendChild(h);
    card.appendChild(el("p", "qnote", "The walkthrough is tailored to each. You can switch at any time."));
    var grid = el("div", "shapes");
    shapes.forEach(function (s) {
      var b = el("button", "shape");
      b.type = "button";
      b.innerHTML = "<h3>" + esc(s.label) + "</h3><p>" + esc(s.blurb || "") + "</p>";
      b.addEventListener("click", function () { chooseShape(s); });
      grid.appendChild(b);
    });
    card.appendChild(grid);
    mount.appendChild(card);
    var f = mount.querySelector("[data-focus]"); if (f) f.focus();
  }

  function chooseShape(shape) { currentShape = shape; loadTree(shape.tree); }

  function render(id) {
    var n = TREE.nodes[id];
    mount.innerHTML = "";
    if (shapes.length > 1 && currentShape) renderShapebar();
    if (n.type === "question") renderQuestion(id, n);
    else renderTerminal(n);
    // move focus to the new card heading for keyboard/screen-reader users
    var h = mount.querySelector("[data-focus]");
    if (h) h.focus();
    mount.scrollIntoView({ block: "nearest" });
  }

  function questionNumber() { return history.length + 1; }

  function renderQuestion(id, n) {
    var card = el("div", "qcard");
    card.appendChild(el("p", "qprogress", "Question " + questionNumber()));
    var h = el("h2", "qtext", esc(n.question));
    h.setAttribute("tabindex", "-1");
    h.setAttribute("data-focus", "1");
    card.appendChild(h);
    if (n.note) card.appendChild(el("p", "qnote", esc(n.note)));

    var opts = el("div", "options");
    n.options.forEach(function (o) {
      var b = el("button", "option", esc(o.label));
      b.type = "button";
      b.addEventListener("click", function () {
        record(n, o);
        history.push(id);
        render(o.next || o.terminal);
      });
      opts.appendChild(b);
    });
    card.appendChild(opts);

    if (history.length) {
      var ctrl = el("div", "qcontrols");
      var back = el("button", "linkbtn", "← Back");
      back.type = "button";
      back.addEventListener("click", function () {
        var prev = history.pop();
        if (answers.length && TREE.nodes[prev].agendaLabel) answers.pop();
        render(prev);
      });
      ctrl.appendChild(back);
      card.appendChild(ctrl);
    }
    mount.appendChild(card);
  }

  function list(title, items) {
    var wrap = el("div", "tsection");
    wrap.appendChild(el("h3", "tlabel", esc(title)));
    var ul = el("ul", "tlist");
    items.forEach(function (t) { ul.appendChild(el("li", null, esc(t))); });
    wrap.appendChild(ul);
    return wrap;
  }

  function linkList(title, items) {
    var wrap = el("div", "tsection");
    wrap.appendChild(el("h3", "tlabel", esc(title)));
    var ul = el("ul", "tlist tlinks");
    items.forEach(function (it) {
      var li = el("li");
      var a = el("a", null, esc(it.label));
      a.href = it.href;
      li.appendChild(a);
      ul.appendChild(li);
    });
    wrap.appendChild(ul);
    return wrap;
  }

  function renderTerminal(n) {
    var scope = n.type === "scopeExit";
    var card = el("div", "terminal" + (scope ? " terminal--scope" : ""));
    card.appendChild(el("p", "qprogress", scope ? "A question for your attorney" : "What your answers touch on"));
    var h = el("h2", "ttitle", esc(n.title));
    h.setAttribute("tabindex", "-1");
    h.setAttribute("data-focus", "1");
    card.appendChild(h);
    card.appendChild(el("p", "tbody", esc(n.mechanism || n.body)));

    if (n.explainers && n.explainers.length) card.appendChild(linkList("Read more", n.explainers));
    if (n.attorneyQuestions && n.attorneyQuestions.length) card.appendChild(list("Questions to ask your attorney", n.attorneyQuestions));
    if (n.worthConfirming && n.worthConfirming.length) card.appendChild(list("Worth confirming", n.worthConfirming));

    var ctrl = el("div", "qcontrols");
    if (history.length) {
      var back = el("button", "linkbtn", "← Back");
      back.type = "button";
      back.addEventListener("click", function () {
        var prev = history.pop();
        if (answers.length && TREE.nodes[prev].agendaLabel) answers.pop();
        render(prev);
      });
      ctrl.appendChild(back);
    }
    var restart = el("button", "linkbtn", "Start over");
    restart.type = "button";
    restart.addEventListener("click", start);
    ctrl.appendChild(restart);
    card.appendChild(ctrl);

    var note = el("p", "tnote", "This walkthrough describes how the law works. It doesn't evaluate your situation — the items above are questions to raise with a licensed New York attorney, not conclusions.");
    card.appendChild(note);
    mount.appendChild(card);

    // Hand the completed walk to the prep agenda (if present). Decoupled: the
    // walkthrough works standalone; no listener means this is a no-op.
    document.dispatchEvent(new CustomEvent("ep:terminal", { detail: {
      facts: answers.slice(),
      terminal: {
        title: n.title,
        kind: n.type,
        attorneyQuestions: (n.attorneyQuestions || []).slice(),
        worthConfirming: (n.worthConfirming || []).slice()
      }
    }}));
  }

  function loadTree(file) {
    fetch(DATA_DIR + file)
      .then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); })
      .then(function (tree) {
        var errs = validate(tree);
        if (errs.length) {
          // Fail loudly for the author; leave the static fallback in place for users.
          mount.hidden = false;
          mount.innerHTML = "";
          mount.appendChild(el("div", "terminal terminal--scope",
            "<h2 class='ttitle'>Walkthrough data needs a fix</h2><p class='tbody'>The decision tree didn't pass validation, so the interactive version is turned off and the summary below is shown instead.</p>"));
          mount.appendChild(list("Validation errors", errs));
          console.error(file + " validation failed:\n" + errs.join("\n"));
          return;
        }
        TREE = tree;
        if (staticEl) staticEl.hidden = true;
        mount.hidden = false;
        start();
      })
      .catch(function (e) {
        // fetch blocked (e.g. file://) or network error: keep the static fallback.
        console.warn("Decision tree not loaded (" + e.message + "); static fallback shown.");
      });
  }

  // Load the shape manifest, then offer a chooser (multiple shapes) or load the
  // single shape directly. If the manifest is missing, fall back to the original
  // single tree so the page still works.
  fetch(SHAPES_URL)
    .then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); })
    .then(function (data) {
      shapes = (data && data.shapes) || [];
      if (shapes.length > 1) {
        renderChooser();
      } else if (shapes.length === 1) {
        currentShape = shapes[0];
        if (staticEl) staticEl.hidden = true;
        mount.hidden = false;
        loadTree(shapes[0].tree);
      } else {
        throw new Error("empty manifest");
      }
    })
    .catch(function () {
      if (staticEl) staticEl.hidden = true;
      mount.hidden = false;
      loadTree("tree.json");
    });
})();
