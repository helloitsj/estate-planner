/* Life-state timeline scrubber.
   Progressive enhancement: the page ships all six states as static cards
   (#staticStates) that work with no JS and with CSS disabled. When JS runs we
   hide those, reveal the scrubber (#interactive), and drive a single live
   readout. Keyboard, pointer, hash (#S2), and the spine rail all move it. */
(function () {
  "use strict";

  var A = "a", D = "d", T = "t";

  var STATES = [
    { code:"S0", title:"Both spouses alive &amp; competent",
      desc:"Everything is drafted but dormant; each spouse runs their own life.",
      med:"Each spouse decides for themselves.",
      mon:"Each decides. Both are co-trustees and can amend or revoke the trust at any time.",
      kid:"The parents parent." },
    { code:"S1", title:"One spouse incapacitated, the other well",
      desc:"Only the incapacitated spouse&rsquo;s documents wake up. It reads the same whichever spouse it is.",
      med:"The well spouse decides for the incapacitated one as primary health care agent.",
      mon:"The well spouse acts as primary POA agent and carries the trust as sole trustee.",
      kid:"The well spouse parents normally." },
    { code:"S2", title:"Both incapacitated at once",
      desc:"Alive, neither can decide. This is the state the backup chains exist for.",
      med:"Health agent 2 decides for each spouse, then health agent 3. One agent at a time — New York bars co-agents.",
      mon:"POA agent 2, then agent 3. For the trust, the successor trustee line takes over.",
      kid:"Only a standby guardian designation covers this. A will does not.",
      flagH:"The gap in this state",
      flagP:"A guardian named in a will takes effect at death — not while a parent is alive but incapacitated. New York requires a separate standby guardian designation (SCPA 1726) that operates on incapacity. Without one, nobody holds clean legal authority over the children until a court acts." },
    { code:"S3", title:"One spouse dies, the other survives",
      desc:"The deceased spouse&rsquo;s lifetime papers switch off and their will switches on.",
      med:"The surviving spouse decides for themselves.",
      mon:"The surviving spouse continues as sole trustee. The pour-over will sweeps stray assets into the trust.",
      kid:"The surviving spouse parents. No guardian is needed while a parent lives." },
    { code:"S4", title:"Both parents gone — children are minors",
      desc:"Money and custody are often split between two people on purpose.",
      med:"No agent exists. Authority ended at death.",
      mon:"Trustee 1, then 2, then 3 pays from the trust under the HEMS standard — health, education, maintenance, support.",
      kid:"Guardian 1, then 2, then 3 raises the children. The guardian does not control the money." },
    { code:"S5", title:"Both parents gone — children are adults",
      desc:"Custody is over. The trust is the only thing still running.",
      med:"No agent exists.",
      mon:"The trustee line continues. Distributions release on the schedule the trust sets.",
      kid:"Guardianship ended at the youngest child&rsquo;s eighteenth birthday." }
  ];

  var INSTRUMENTS = [
    { name:"Health Care Proxy", who:"per spouse", s:[D,A,A,T,T,T],
      m:["Drafted, not yet operative.","Operative for the incapacitated spouse only.","Operative for both.",
         "Ends for the spouse who died. An agent never outlives the person.","Ended.","Ended."] },
    { name:"Power of Attorney", who:"per spouse", s:[D,A,A,T,T,T],
      m:["Drafted, not yet operative.","Operative for the incapacitated spouse only.","Operative for both.",
         "Ends at death. It does not survive.","Ended.","Ended."] },
    { name:"Will / Executor", who:"per spouse", s:[D,D,D,A,A,T],
      m:["Dead weight until death.","Still dormant — incapacity is not death.","Still dormant. This is why POAs matter.",
         "Activates. Probate opens.","Both wills active. Executors pour into the trust.","Closed."] },
    { name:"Revocable Trust", who:"family", s:[A,A,A,A,A,A],
      m:["Live and revocable. Co-trustees can change it any time.","Live. Well spouse acts as sole trustee.",
         "Live. Successor trustee takes over.","Live. Surviving spouse continues.",
         "Now irrevocable. The successor trustee runs it.","Running until each share reaches its distribution age."] },
    { name:"Guardianship", who:"of the children", s:[D,D,D,D,A,T],
      m:["Dormant.","Dormant — one parent still parents.","Standby only, and only if a separate SCPA 1726 designation exists.",
         "Dormant — the surviving parent parents.","Active. The guardian raises the children.",
         "Ended at the youngest child&rsquo;s eighteenth birthday."] }
  ];

  var LABELS = [
    ["S0","Both<br>well"], ["S1","One loses<br>capacity"], ["S2","Both<br>incapacitated"],
    ["S3","First<br>death"], ["S4","Both gone<br>kids minor"], ["S5","Both gone<br>kids adult"]
  ];

  var PILL = { a:"Active", d:"Dormant", t:"Ended" };
  var MAX = STATES.length - 1;
  var idx = 0, dragging = false;

  var interactive = document.getElementById("interactive"),
      staticStates = document.getElementById("staticStates"),
      track  = document.getElementById("track"),
      fill   = document.getElementById("fill"),
      ticks  = document.getElementById("ticks"),
      rows   = document.getElementById("tRows"),
      flag   = document.getElementById("tFlag"),
      rails  = document.querySelectorAll(".railitem");

  if (!track) return;

  // enhance: swap static content for the interactive readout
  interactive.hidden = false;
  if (staticStates) staticStates.hidden = true;

  LABELS.forEach(function (l, i) {
    var pct = (i / MAX) * 100;
    var n = document.createElement("div");
    n.className = "track__notch";
    n.style.left = pct + "%";
    track.appendChild(n);

    var b = document.createElement("button");
    b.type = "button";
    b.className = "tick";
    b.innerHTML = '<span class="code">' + l[0] + "</span>" + l[1];
    b.addEventListener("click", function () { set(i); track.focus(); });
    ticks.appendChild(b);
  });

  INSTRUMENTS.forEach(function (inst) {
    var tr = document.createElement("tr");
    tr.innerHTML =
      '<td class="inst">' + inst.name + '<span class="who">' + inst.who + "</span></td>" +
      '<td><span class="pill"></span></td><td class="meaning"></td>';
    rows.appendChild(tr);
  });

  function set(i) {
    i = Math.max(0, Math.min(MAX, i));
    idx = i;
    var st = STATES[i], pct = (i / MAX) * 100;

    fill.style.width = pct + "%";
    document.getElementById("knob").style.left = pct + "%";
    track.setAttribute("aria-valuenow", i);
    track.setAttribute("aria-valuetext", st.title.replace(/&amp;/g, "and").replace(/&rsquo;/g, "'"));

    Array.prototype.forEach.call(track.querySelectorAll(".track__notch"), function (n, j) {
      n.classList.toggle("passed", j <= i);
    });
    Array.prototype.forEach.call(ticks.children, function (b, j) { b.classList.toggle("on", j === i); });
    Array.prototype.forEach.call(rails, function (r, j) { r.classList.toggle("on", j === i); });

    document.getElementById("tCode").textContent = st.code;
    document.getElementById("tTitle").innerHTML  = st.title;
    document.getElementById("tDesc").innerHTML   = st.desc;
    document.getElementById("dMed").innerHTML    = st.med;
    document.getElementById("dMon").innerHTML    = st.mon;
    document.getElementById("dKid").innerHTML    = st.kid;

    Array.prototype.forEach.call(rows.children, function (tr, r) {
      var inst = INSTRUMENTS[r], code = inst.s[i];
      var pill = tr.querySelector(".pill");
      pill.className = "pill " + code;
      pill.textContent = PILL[code];
      tr.querySelector(".meaning").innerHTML = inst.m[i];
    });

    if (st.flagH) {
      document.getElementById("tFlagH").textContent = st.flagH;
      document.getElementById("tFlagP").textContent = st.flagP;
      flag.hidden = false;
    } else { flag.hidden = true; }
  }

  function fromX(clientX) {
    var r = track.getBoundingClientRect();
    return Math.round(Math.max(0, Math.min(1, (clientX - r.left) / r.width)) * MAX);
  }

  track.addEventListener("pointerdown", function (e) {
    dragging = true; track.classList.add("dragging");
    track.setPointerCapture(e.pointerId); set(fromX(e.clientX)); track.focus();
  });
  track.addEventListener("pointermove", function (e) { if (dragging) set(fromX(e.clientX)); });
  function stop(e) {
    if (!dragging) return;
    dragging = false; track.classList.remove("dragging");
    if (e.pointerId != null && track.hasPointerCapture(e.pointerId)) track.releasePointerCapture(e.pointerId);
  }
  track.addEventListener("pointerup", stop);
  track.addEventListener("pointercancel", stop);
  track.addEventListener("keydown", function (e) {
    var k = e.key;
    if (k === "ArrowRight" || k === "ArrowUp")       { set(idx + 1); e.preventDefault(); }
    else if (k === "ArrowLeft" || k === "ArrowDown") { set(idx - 1); e.preventDefault(); }
    else if (k === "Home")                           { set(0);       e.preventDefault(); }
    else if (k === "End")                            { set(MAX);     e.preventDefault(); }
  });

  // spine rail drives the scrubber on this page (links are #Sx for no-JS)
  Array.prototype.forEach.call(rails, function (r, j) {
    r.addEventListener("click", function (e) { e.preventDefault(); set(j); track.focus(); });
  });

  function fromHash() {
    var m = /^#S([0-5])$/.exec(location.hash || "");
    return m ? parseInt(m[1], 10) : 0;
  }
  window.addEventListener("hashchange", function () { set(fromHash()); });

  set(fromHash());
})();
