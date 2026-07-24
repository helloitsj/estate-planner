# Estate Planning — New York — project guide for future sessions

A static, educational site about New York estate planning. It explains how
instruments work and helps people prepare for a meeting with a licensed
attorney. **The author is not a lawyer. The site never gives legal advice.**

---

## The thesis (the reason this site exists)

Every estate-planning resource online is indexed by *instrument* — "what is a
power of attorney." That is the wrong index. Nobody wonders what a POA is.
They wonder **who signs for the apartment while they're unconscious, and
whether that changes the moment they die.**

This site is indexed by **LIFE STATE**. The spine is six states:

    S0  Both alive & competent
    S1  One incapacitated, one well
    S2  Both incapacitated (alive, neither can decide)
    S3  First death
    S4  Both gone — children minors
    S5  Both gone — children adults

**If a page can't trace back to "who decides what, and when," it probably
doesn't belong.** Prefer mechanisms over thresholds: "a POA terminates at
death" is true forever; New York's exclusion amount changes every January.
Write the durable thing wherever you have the choice.

---

## THE RULE THAT GOVERNS EVERYTHING

The site describes how the law works. **It never evaluates anyone's situation
or tells anyone what to do.**

Every decision-tree terminal ends in a QUESTION FOR THEIR ATTORNEY, never a
conclusion.

- WRONG: "You need a standby guardian designation under SCPA 1726."
- RIGHT: "Your answers touch on guardianship during incapacity. In New York a
  will's guardian nomination operates at death only. ASK YOUR ATTORNEY: does
  my plan cover who parents my children if we're both alive but incapacitated?"

**Banned everywhere:** "you should," "you need," "we recommend," "in your
case," "your plan is missing." No node grades a plan as adequate or
inadequate.

Every guidance terminal emits exactly three things, enforced structurally by
`data/tree.json` + the renderer's validator:
1. Links to relevant explainer pages
2. Questions to ask an attorney, phrased as questions
3. Facts worth confirming, phrased as "worth confirming," never "you need"

Every page carries a non-dismissable line: *educational information, not legal
advice, no attorney-client relationship, law varies by state, consult a
licensed New York attorney.*

### Scope exits are a feature
Any path reaching a **taxable estate, a business interest, a special-needs
beneficiary, a non-citizen spouse, or out-of-state property** terminates
immediately in a scope exit. Design it to feel like the tool respecting the
user, not failing them.

---

## ACCURACY — the biggest risk in this project

**Never write a dollar figure, threshold, statutory citation, percentage, or
deadline from memory.** Training data is stale and this subject punishes that
harder than most.

- Every number: fetch the primary source (irs.gov, tax.ny.gov,
  nysenate.gov for consolidated laws). Record the URL and the date checked.
- Cannot verify it? Write `TODO(verify)`. Never guess, approximate, or round
  from memory.
- All figures live in `site/data/figures.json`:
  `{ "ny_basic_exclusion": { "value": ..., "tax_year": ..., "as_of":
  "YYYY-MM-DD", "source": "...", "source_url": "..." } }`
- Pages read figures from that file. **Numbers are never inlined in markup.**
  Each renders with a visible "as of" date.
- `/sources` lists every primary source with its last-verified date.

---

## Scope boundaries

- **Static HTML + CSS + vanilla JS.** No framework, no build step, no npm, no
  backend, no database, no analytics. Deploys by dragging `/site` to
  Cloudflare Pages.
- **New York only**, stated in the first screenful of every page.
- **Never build:** document generation, attorney directory or matching, email
  capture, accounts, payments, any server-side anything.
- State lives in **localStorage only**. Nothing transmitted, nothing in the
  URL. Visible "your answers never leave this browser" + a real
  clear-my-answers button.

---

## Layout — state is the first path segment

`/site` is the deployable root (drag it to Cloudflare Pages). Every
jurisdiction-specific page and its data live under `/{state}/`; global pages
(the state hub, About) and shared assets live at the root.

    site/
      index.html                       /              State hub — "choose your state"
      about/index.html                 /about         Global (about the project)
      assets/css/base.css              the ONE shared stylesheet — no duplication
      assets/js/                       landing.js, timeline.js, tree.js, prep.js (shared)
      data/
        ny/figures.json                /data/ny/…     numbers, per state, with as-of dates
        ny/tree.json                                  decision tree as pure data, per state
      ny/
        index.html                     /ny/           NY landing
        timeline/index.html            /ny/timeline/  Life-state timeline (the spine)
        prepare/index.html             /ny/prepare/   Decision tree -> printable agenda (shape 1)
        explainers/index.html          /ny/explainers/  Guides index
        explainers/poa-and-proxy-end-at-death/   guide 1
        explainers/guardianship-and-incapacity/  guide 2 (SCPA 1726)
        sources/index.html             /ny/sources/

**Paths are relative** (not root-absolute), so the site works both at a subpath
(GitHub Pages project site) and at a root domain (Cloudflare). Prefix depth:
root pages none, `/{state}/` one `../`, `/{state}/x/` two, `/{state}/x/y/` three.
The masthead carries a wordmark (→ hub), a state chip "New York ▾" (→ hub, to
switch), and the primary nav; the state chip is omitted on global pages.

**Local preview needs a static server** (not `file://`) because browsers block
`fetch` of local files. There is no Python here — use the Node static server in
the scratchpad. Every interactive view also ships a static, no-JS fallback that
works with CSS disabled.

## Multi-state content model (agnostic-first, nuances → the attorney)

Guiding principle from the author: **provide as much state-agnostic information
as possible, and let nuances branch off to "consult a lawyer."** Content sits in
three layers by how state-dependent it is:

- **Layer A — durable mechanisms (state-agnostic).** "A POA terminates at
  death." "A will's guardian operates at death, not incapacity." The S0–S5
  framework itself. Most of the differentiated content; author it once.
- **Layer B — state overlays.** Citations (NY SCPA 1726 vs. other states'
  statutes or none), estate-tax figures/cliffs, terminology ("health care
  proxy" vs "advance directive"; "executor" vs "personal representative"). Some
  states change the *shape* (no estate tax → drop the tax guide; community
  property → add a spousal-property section), so the model must allow per-state
  inclusion/exclusion of whole blocks, not just value substitution.
- **Layer C — per-state data.** `data/{state}/figures.json`, `tree.json`, and
  (planned) `terms.json` mapping canonical concept → that state's word.

**Build-step trigger:** hand-authored static HTML is fine for NY + 1–2 states.
At the ~3rd state, adopt a tiny static-site generator (e.g. Eleventy) that
stamps shared layout + per-state data into plain static HTML — still a static
folder dragged to Cloudflare, still no backend, still no-JS-friendly. That
relaxes "no build step" but keeps "static site, no server," which is the goal
that mattered. Until then, keep state-specific strings tokenizable so the switch
stays mechanical.

### tree.json shape
One flat `nodes` map. A `question` node has `options[]`; each option carries
either `next` (id of another question) or `terminal` (id of an ending node).
Endings are `guidance` (requires `explainers[]`, `attorneyQuestions[]`,
`worthConfirming[]`) or `scopeExit`. Adding a branch = editing JSON only; the
renderer never changes. `meta.maxDepth` = 5, asserted across all paths.

---

## Design system (FIXED — extend, never restyle)

Spectral headings, IBM Plex Sans body, IBM Plex Mono for labels/data/codes.
Paper/ink palette. Semantic triad: **green active, grey dormant, red
terminated.** Brass accent (`--accent`) is the only "look here" color — used
for eyebrows, mono labels, section numbers, scrubber fill, flag borders. Never
decoration.

- **No** new palette, gradients, glassmorphism, or stock photography.
- Color carries meaning, not mood. Mono = fact/label, Serif = idea, Sans =
  explanation. White cards on paper, hairline `--line` borders, one shadow.
- All motion respects `prefers-reduced-motion`. Motion is diegetic (it
  demonstrates the thesis), never decorative.

Tokens live once, at the top of `assets/css/base.css`. Every page links that
one stylesheet.

---

## Quality floor (not optional)

Semantic HTML, real heading hierarchy, WCAG AA contrast, full keyboard nav,
visible focus states, works with CSS disabled, every interactive view has a
static equivalent that works with JS disabled, all motion respects
`prefers-reduced-motion`, responsive to 360px.

---

## Gates (stop at each; do not run ahead)

- **G1** Sitemap, design-language reading, tree.json schema. *(approved)*
- **G2** Phase 1: landing + timeline live.
- **G3** Tree engine + shape 1, three terminals written out for voice review.
- **G4** Prep document, printed to PDF for print-layout review.

Twelve pages in the wrong voice is worse than zero pages.
