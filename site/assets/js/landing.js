/* Landing demo scrubber — progressive enhancement.
   No JS: the rail items are plain links to /timeline/, the demo shows S0.
   With JS: dragging the scrubber drives the four pills and the spine rail,
   and a one-time autoplay demonstrates the thesis before any copy is read. */
(function () {
  "use strict";

  var STATES = [
    ["Both alive & competent",          ["d", "d", "d", "d"]],
    ["One incapacitated, one well",     ["a", "a", "d", "d"]],
    ["Both incapacitated at once",      ["a", "a", "d", "d"]],
    ["First death",                     ["t", "t", "a", "d"]],
    ["Both gone — children minor",  ["t", "t", "a", "a"]],
    ["Both gone — children adult",  ["t", "t", "t", "t"]]
  ];
  var TXT = { a: "Active", d: "Dormant", t: "Ended" };
  var MAX = STATES.length - 1;
  var idx = 0, dragging = false, autoplaying = false;

  var track = document.getElementById("demoTrack");
  if (!track) return;
  var fill  = document.getElementById("demoFill"),
      knob  = document.getElementById("demoKnob"),
      pills = document.querySelectorAll(".demo .pill"),
      rails = document.querySelectorAll(".railitem");

  function set(i) {
    i = Math.max(0, Math.min(MAX, i));
    idx = i;
    var st = STATES[i], pct = (i / MAX) * 100;
    fill.style.width = pct + "%";
    knob.style.left = pct + "%";
    document.getElementById("demoState").textContent = st[0];
    document.getElementById("demoTick").textContent = "S" + i;
    track.setAttribute("aria-valuenow", i);
    track.setAttribute("aria-valuetext", st[0].replace(/&/g, "and"));
    Array.prototype.forEach.call(pills, function (p, j) {
      var c = st[1][j];
      p.className = "pill " + c;
      p.textContent = TXT[c];
    });
    Array.prototype.forEach.call(rails, function (r, j) {
      r.classList.toggle("on", j === i);
    });
  }

  function pos(x) {
    var r = track.getBoundingClientRect();
    return Math.round(Math.max(0, Math.min(1, (x - r.left) / r.width)) * MAX);
  }
  function halt() { autoplaying = false; }

  track.addEventListener("pointerdown", function (e) {
    halt(); dragging = true; track.classList.add("dragging");
    track.setPointerCapture(e.pointerId); set(pos(e.clientX)); track.focus();
  });
  track.addEventListener("pointermove", function (e) { if (dragging) set(pos(e.clientX)); });
  function stop(e) {
    if (!dragging) return;
    dragging = false; track.classList.remove("dragging");
    if (e.pointerId != null && track.hasPointerCapture(e.pointerId)) track.releasePointerCapture(e.pointerId);
  }
  track.addEventListener("pointerup", stop);
  track.addEventListener("pointercancel", stop);
  track.addEventListener("keydown", function (e) {
    halt();
    if (e.key === "ArrowRight" || e.key === "ArrowUp")        { set(idx + 1); e.preventDefault(); }
    else if (e.key === "ArrowLeft" || e.key === "ArrowDown")  { set(idx - 1); e.preventDefault(); }
    else if (e.key === "Home")                                { set(0);       e.preventDefault(); }
    else if (e.key === "End")                                 { set(MAX);     e.preventDefault(); }
  });

  // Rail items are real links to /timeline/#Sx; on the landing we intercept
  // to drive the demo instead. No JS -> they navigate. Enhanced -> they scrub.
  Array.prototype.forEach.call(rails, function (r, j) {
    r.addEventListener("click", function (e) { e.preventDefault(); halt(); set(j); track.focus(); });
  });

  set(0);

  // One-time autoplay: diegetic, not decorative — the motion IS the content.
  // Stops on any input, and never runs under reduced-motion.
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!reduce) {
    autoplaying = true;
    var step = 0;
    var timer = setInterval(function () {
      if (!autoplaying || step >= MAX) { clearInterval(timer); return; }
      step++; set(step);
    }, 900);
  }
})();
