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

## Layout

`/site` is the deployable root (drag it to Cloudflare Pages). JSON lives inside
it so `fetch('/data/…')` resolves.

    site/
      index.html                     /            Landing
      timeline/index.html            /timeline    Life-state timeline (the spine)
      prepare/index.html             /prepare     Decision tree -> printable agenda (shape 1)
      explainers/
        poa-and-proxy-end-at-death/  explainer 1
        guardianship-and-incapacity/ explainer 2 (SCPA 1726)
      sources/index.html             /sources
      about/index.html               /about
      assets/css/base.css            the ONE shared stylesheet — no duplication
      assets/js/                     landing.js, timeline.js, tree.js, prep.js
      data/figures.json              all numbers, with as-of dates
      data/tree.json                 decision tree as pure data

**Local preview needs a static server** (not `file://`) because browsers block
`fetch` of local files. Every interactive view also ships a static, no-JS
fallback that works with CSS disabled.

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
