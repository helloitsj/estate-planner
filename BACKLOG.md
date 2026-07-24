# Backlog — candidate pages & household shapes

Ranked roughly by **differentiation × reach ÷ competition**. The whole site is
a bet against the instrument-indexed incumbents (Nolo, LegalZoom, law-firm blog
SEO). We win on the questions those pages don't answer: *who decides, and when.*
Mechanisms beat thresholds — they rank forever and they're what's missing.

Legend: **comp** = how crowded the search space is (lower is better for us).

---

## Household shapes (the "start where you are" axis)

Shape 1 (married/partnered, minor children) is the vertical slice built first.
Others are scaffolded as "soon" on the landing.

| # | Shape | Why it earns a page | comp |
|---|-------|--------------------|------|
| 1 | **Married/partnered, minor children** | Built. Guardianship, joint-incapacity gap, pour-over, HEMS. The canonical case. | high |
| 2 | **Single parent** | No surviving-parent default — guardianship is the whole ballgame. Underserved. | med |
| 3 | **Unmarried partners** | No intestate rights, no default decision authority. The incumbents barely cover it; highest differentiation. | **low** |
| 4 | **Blended family** | Stepchildren, the NY elective share, stale beneficiary forms from a first marriage. High anxiety, thin content. | low |
| 5 | **No children, married** | Who decides if you're both gone? Siblings/parents/charity. Simpler tree. | med |
| 6 | **Adult with aging parents** | Reverse role — you as agent/fiduciary. Different spine, big audience. | med |

---

## Explainers (the "things people get wrong" axis — one idea each)

Built this session marked ✓.

| # | Title | The one idea | comp |
|---|-------|-------------|------|
| 1 | ✓ **A POA and a health care proxy both end at death** | Agent authority never outlives the person. | med |
| 2 | ✓ **A will's guardian doesn't operate during incapacity** | Will = death only; SCPA 1726 standby = incapacity. | **low** |
| 3 | **An unfunded trust does nothing** | Signing isn't the work; retitling is. | med |
| 4 | **Your beneficiary forms outrank your will** | The 401(k)/life-insurance form controls, will or not. | med |
| 5 | **What NY probate actually is** | And the assets that skip it (beneficiary, joint, trust). | high |
| 6 | **NY has its own estate tax, with a cliff** | Reads from figures.json; mechanism = the cliff, not the number. | low |
| 7 | **Co-agents: why NY health proxies bar them** | One agent at a time; the backup chain instead. | low |
| 8 | **The step-up vs. protection trade-off** | From distribution_structures.html. Lifetime trust ≠ tax play. | low |

---

## Reference / worksheet pages (port from ./source)

| Source file | Becomes | Notes |
|-------------|---------|-------|
| `decision_states.html` | Timeline's deep static reference (`/timeline` "full table") | Already the no-JS fallback content. |
| `distribution_structures.html` | Children's-trust explainer (six structures) | Tax strip must read from figures.json. |
| `eol_preferences.html` | Health-care-proxy worksheet | The feeding-tube/ANH row is the NY-specific hook. |

---

## Infrastructure / cross-cutting

- `/sources` — every figure + primary source + last-verified date. Build with figures.json.
- `/about` — real byline, "not a lawyer," how the site is verified.
- figures.json entries needed before any tax content ships: NY basic exclusion
  amount + cliff mechanics, federal estate/gift exclusion, gift annual
  exclusion. All `TODO(verify)` until fetched from tax.ny.gov / irs.gov.
- Print stylesheet hardening for the prep agenda (A4).
- Consider a per-page "which life states this touches" chip strip (S0–S5).
