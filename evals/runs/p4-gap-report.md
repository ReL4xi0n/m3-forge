# Phase 4 release bar and gap report

Status: **the release bar (spec §12) is not met.** After the 3 allowed improvement rounds (all reverted by the keep rule), the final skill is the Phase 4 start skill (`phase4-final-0`). This report is written before the owner decides how to continue (another round, ship with the gaps documented, or stop). The bar and the scores were not changed after the results were seen.

Sources: pooled blind judging `evals/runs/p4-step4/` (61 outputs: 26 baseline, 26 final, 6 hold-out, 3 Sonnet; three judge v2 sessions, score of record = median per output and item), automated verification on the recorded code, Compose amendment `evals/runs/p4-compose-amend/`.

## 1. Bar, line by line

| # | Bar line (spec §12) | Web | Flutter | Compose |
|---|---|---|---|---|
| 1 | Zero automated violations in the final with-skill outputs, hold-out included | **met** (0) | **met** (0) | **met** (0) |
| 2 | Every judged item: platform mean ≥ 2.5, no single score below 2 (hold-out too) | not met | not met | not met |
| 3 | Every item's mean improves over baseline (or is 3) | not met | not met | not met |
| 4 | Owner visual sign-off (light and dark, next to references) | pending | pending | pending |
| 5 | At most 3 improvement rounds | met (3, all reverted) | met | met |

### Line 2 and 3 detail (means of the medians; B = baseline, F = final 26 eval cells, F+H = final with hold-out; min = lowest single median in F or H)

| platform | item | B | F | F+H | hold-out | min | line 2 | line 3 |
|---|---|---|---|---|---|---|---|---|
| web | component-choice | 2.56 | 2.78 | 2.73 | 2 / 3 | 2 | met | met |
| web | hierarchy-typography | 2.22 | 2.00 | 2.00 | 2 / 2 | 2 | **no** | **no** |
| web | color-roles | 2.67 | 2.56 | 2.64 | 3 / 3 | 2 | met | **no** |
| web | shape-expressive | 2.67 | 2.44 | 2.36 | 2 / 2 | 2 | **no** | **no** |
| web | spacing-layout | 2.11 | 2.00 | 1.82 | 1 / 1 | **1** | **no** | **no** |
| web | interaction-states | 2.56 | 2.78 | 2.82 | 3 / 3 | 2 | met | met |
| web | dark-mode | 2.89 | 3.00 | 3.00 | 3 / 3 | 3 | met | met |
| web | overall-polish | 2.00 | 2.00 | 2.00 | 2 / 2 | 2 | **no** | **no** |
| flutter | component-choice | 2.33 | 2.44 | 2.36 | 2 / 2 | **1** | **no** | met |
| flutter | hierarchy-typography | 2.44 | 2.78 | 2.64 | 2 / 2 | 2 | met | met |
| flutter | color-roles | 2.78 | 2.89 | 2.82 | 2 / 3 | 2 | met | met |
| flutter | shape-expressive | 2.89 | 2.56 | 2.45 | 2 / 2 | 2 | **no** | **no** |
| flutter | spacing-layout | 2.22 | 2.44 | 2.36 | 2 / 2 | 2 | **no** | met |
| flutter | interaction-states | 2.89 | 2.89 | 2.91 | 3 / 3 | 2 | met | **no** (equal) |
| flutter | dark-mode | 2.78 | 3.00 | 2.82 | 2 / 2 | 2 | met | met |
| flutter | overall-polish | 1.89 | 2.00 | 2.00 | 2 / 2 | 2 | **no** | met |
| compose | component-choice | 2.75 | 2.38 | 2.30 | 2 / 2 | 2 | **no** | **no** |
| compose | hierarchy-typography | 2.63 | 3.00 | 3.00 | 3 / 3 | 3 | met | met |
| compose | color-roles | 2.50 | 2.88 | 2.90 | 3 / 3 | 2 | met | met |
| compose | shape-expressive | 2.38 | 2.50 | 2.50 | 3 / 2 | 2 | met | met |
| compose | spacing-layout | 2.38 | 2.38 | 2.30 | 2 / 2 | 2 | **no** | **no** (equal) |
| compose | interaction-states | 2.63 | 2.88 | 2.90 | 3 / 3 | 2 | met | met |
| compose | dark-mode | 2.88 | 3.00 | 3.00 | 3 / 3 | 3 | met | met |
| compose | overall-polish | 2.00 | 2.00 | 2.00 | 2 / 2 | 2 | **no** | **no** (equal) |

Single medians below 2 (with skill): landing.flutter component-choice 1, empty-error.web spacing-layout 1, booking.web (hold-out) spacing-layout 1, chat.web (hold-out) spacing-layout 1.

Line 2 fails on every platform on overall-polish alone: every final and hold-out output has a median of exactly 2 ("correct M3, minor flaws"); none reaches 3.

### Single-cell drops (baseline → final, ≥ 1 point): 28

| cell | item | B → F |
|---|---|---|
| landing.web.web-empty.default | spacing-layout | 3 → 2 |
| settings.web.web-react.default | hierarchy-typography, spacing-layout, overall-polish | 3 → 2 each |
| dashboard.web.web-react.default | shape-expressive | 3 → 2 |
| onboarding.web.web-react.default | hierarchy-typography, shape-expressive | 3 → 2 each |
| empty-error.web.web-empty.default | shape-expressive 3 → 2; spacing-layout | 2 → 1 |
| onboarding.web.web-vue.default | component-choice | 3 → 2 |
| dashboard.web.web-empty.seed-B5651D | color-roles, shape-expressive | 3 → 2 each |
| landing.flutter.flutter-material_ui.default | component-choice 3 → 1; spacing-layout | 3 → 2 |
| dashboard.flutter.flutter-material_ui.default | color-roles, shape-expressive | 3 → 2 each |
| product-detail.flutter.flutter-material_ui.default | shape-expressive | 3 → 2 |
| empty-error.flutter.flutter-material_ui.default | shape-expressive | 3 → 2 |
| settings.flutter.flutter-legacy.default | component-choice, spacing-layout, overall-polish | 3 → 2 each |
| dashboard.flutter.flutter-material_ui.seed-B5651D | hierarchy-typography | 3 → 2 |
| landing.compose.compose-1.5.default | spacing-layout | 3 → 2 |
| dashboard.compose.compose-1.5.default | component-choice, spacing-layout | 3 → 2 each |
| onboarding.compose.compose-1.5.default | component-choice, shape-expressive | 3 → 2 each |
| dashboard.compose.compose-1.5.seed-B5651D | component-choice | 3 → 2 |

### Second repeats (protocol, ruling P26, owner-narrowed P25)

A second run changes a cell's with-skill score to the mean of its two medians, so the best case for a line is a 3 in every repeated cell. Repeats run only where they could flip a bar line:

| platform | line 2 can flip? | line 3 can flip? | repeated cells |
|---|---|---|---|
| web | no: hold-out overall-polish is 2 and is not repeated (pooled best case (9·2.5 + 2·2)/11 = 2.41 < 2.5) | yes, only in the best case on all five failing items at once (hierarchy best 2.50 > 2.22, color 2.78 > 2.67, shape 2.72 > 2.67, spacing 2.50 > 2.11, overall 2.50 > 2.00) | all 9 web eval cells (the same runs as the web diagnostic below) |
| flutter | no (same hold-out reason) | no: shape best case 2.78 < baseline 2.89 | none |
| compose | no (same hold-out reason) | no: component-choice best case 2.69 < baseline 2.75 | none |

## 2. Web diagnostic: real regression or generation noise?

The 9 web baseline and 9 web final cells were run once more (same isolation, harness and skill; $15.2 and $21.3) and scored pooled with their first outputs in three new blind sessions (`evals/runs/p4-webdiag/`, 36 outputs). This does not change the bar.

| item | baseline, 2 runs | final, 2 runs | cells lower in both final runs / higher in both | run-to-run spread (baseline / final) | reading |
|---|---|---|---|---|---|
| shape-expressive | 2.89 | 2.39 | 4 / 0 | 0.22 / 0.11 | **real regression** |
| hierarchy-typography | 2.67 | 2.17 | 2 / 0 | 0.44 / 0.33 | **real regression**, noisier |
| color-roles | 2.67 | 2.56 | 0 / 0 | 0.44 / 0.00 | within noise |
| spacing-layout | 2.11 | 2.11 | 0 / 0 | 0.44 / 0.22 | no regression |
| component-choice | 2.67 | 2.44 | 1 / 0 | 0.22 / 0.44 | noise (it was +0.22 in the step 4 pool) |
| interaction-states | 2.78 | 2.72 | 1 / 0 | 0.22 / 0.11 | within noise |
| dark-mode | 2.78 | 2.89 | 0 / 1 | 0.22 / 0.22 | within noise |
| overall-polish | 1.94 | 2.00 | 0 / 0 | 0.11 / 0.00 | equal |

The same first outputs also moved between the step 4 pool and this one (for example web baseline hierarchy 2.22 there, 2.56 here). Judge sessions therefore shift a 9-cell mean by up to about 0.3 even when the outputs are identical.

Conclusion: two of the four web drops are real. With the skill, web outputs are less Expressive in shape (uniform card radii, one Expressive accent at most) and set page titles and supporting text smaller. The spacing and color drops in the step 4 pool are noise. Automated findings on the repeats: baseline 838, final 0.

Second repeat (ruling P26): the web with-skill score as the mean of the two runs' medians leaves web line 3 not met (hierarchy 2.17 < baseline 2.67, shape 2.39 < 2.89).

## 3. What the judges said is missing for a 3

Gap texts of the with-skill outputs (final + hold-out) with a median below 3, grouped by keyword rules (one text can fall in several themes; counts are judge entries over three sessions, cells are distinct cells). Full clustering in the private run folder.

### overall-polish (91 entries, all platforms)
1. Requested content or states not visible in the captured frame: 17 entries, 10 cells (dashboard.compose seed: "only the KPI and chart portion ... is visible"; booking.flutter: "the time slots, notes field and closed Sundays are not visible").
2. Generic, plain look with little character: 18 entries, 13 cells (empty-error.web: "the screen looks generic").
3. Empty top band or missing top app bar / back action: 12 + 17 entries (empty-error.compose, settings.flutter legacy: "the missing app bar and the empty top band").
4. Bars, FABs or summary sheets covering content: 12 entries, 6 cells (chat.compose: "the floating button covers message content").
5. Loud badges or off-scheme status colors: 12 entries, 8 cells (dashboard.flutter: "the loud red badge").
6. Mismatched or wrapped elements, clipped edges: 19 entries, 9 cells (booking.flutter: "date chips are clipped under the summary, the header doubles up").
7. Heavy nesting (card inside card) and heavy placeholder blocks (landing.flutter, product-detail.compose).

### spacing-layout (68 entries, all platforms)
1. Large empty vertical gap or band: 25 entries, 16 cells (product-detail.compose: "large empty gap between the color and size rows").
2. Mobile navigation bar, FAB or summary bar over content: 20 entries, 10 cells.
3. Content clipped by a bottom bar, banner or indicator: 17 entries, 8 cells (booking.flutter: "date chips are cut in half by the bottom summary sheet").
4. Desktop column offset, wide gutters, header at the window edge: 13 entries, 6 cells (settings.web: "a wide empty left gutter").
5. Insets that do not line up with the page margins: 12 entries, 9 cells.

### The four web items that fell below baseline (with skill vs baseline, same cells)
| item | theme | with skill | baseline |
|---|---|---|---|
| hierarchy-typography | page title / headline too small or weak | 17 (8 cells) | 4 (2 cells) |
| hierarchy-typography | small helper, trailing and metadata text | 22 (9) | 14 (7) |
| shape-expressive | plain standard M3, no Expressive character | 12 (5) | 2 (2) |
| shape-expressive | only one Expressive accent (avatar, logo) | 6 (4) | 1 (1) |
| spacing-layout | large empty band | 10 (6) | 3 (3) |
| spacing-layout | desktop column offset / wide gutters | 9 (4) | 3 (3) |
| spacing-layout | mobile bar over content | 8 (3) | 11 (4) |
| color-roles | container tint spread, low separation | 3 (2) | 0 |
| color-roles | saturated status fills | 6 (3) | 6 (4) |

Reading (confirmed for shape and hierarchy by the web diagnostic, section 2): with the skill, web outputs use the M3 type scale literally, with smaller page titles and body text than the reference screens' display-style headers, and they rarely go beyond uniform card radii for shape. The spacing themes, more empty space on desktop and fewer overlaps, did not hold up as a regression in the second run. The mobile-overlap complaint comes partly from the full-page capture of fixed bars, a Phase 4 finding.

### Other items
- component-choice (44): requested sections not visible in the captured frame 20; custom chips or radio cards in place of a standard picker 8; no top app bar or back affordance 6.
- interaction-states (21): empty password-strength meter 7; fields without a visible validation or focus state 6.
- dark-mode (6): placeholder or selected fill that stays bright in dark 4.

About a fifth of all gap texts name something not visible in the judged frame. Flutter and Compose are judged on one 412×915 viewport per theme; whatever is below the first screen is invisible to the judge even when it is built correctly.

## 4. What the skill measurably delivers

| measure | baseline | with skill (final + hold-out + Sonnet) |
|---|---|---|
| automated findings, web (9 cells) | 755 in 9/9 cells | 0 (12 cells) |
| automated findings, Flutter (9 cells) | 343 in 9/9 cells | 0 (12 cells) |
| automated findings, Compose (8 cells) | 192 in 8/8 cells | 0 (11 cells) |
| of which off-token type sizes | 370 | 0 |
| of which icons not from the official Material Symbols source | 493 | 0 |
| of which off-grid spacing | 187 | 0 |
| of which hardcoded colors | 60 | 0 |
| of which touch targets below 48 dp | 73 | 0 |
| builds | 26/26 | 35/35 |

Automated findings were counted with the same verifier on the recorded code of every output (the Compose runtime results after the disabled-ancestor amendment; it removed 2 false positives in one hold-out cell and changed nothing else).

Judged gains with the skill (means of medians, baseline → final): dark-mode reaches 3.00 on every platform; Compose hierarchy 2.63 → 3.00, color 2.50 → 2.88, interaction 2.63 → 2.88; Flutter hierarchy 2.44 → 2.78, spacing 2.22 → 2.44; web component-choice 2.56 → 2.78, interaction 2.56 → 2.78.

Requested-element visibility (with skill): every requested element was visible in the web and Flutter final cells (two partials counted visible: a settings row showing its current value, a clipped carousel); in Compose four cells had a defect on screen (a clipped label, a missing quantity stepper, a third list item never reached, an incomplete order table). Hold-out (6 cells): booking.web, booking.flutter and chat.compose show every requested element. Three cells don't: booking.compose cuts the date strip off at Saturday, so the closed Sunday never shows. chat.web shows only the "Today" divider, not "Yesterday". chat.flutter has no frame of the long-press message actions; the web and Compose chat outputs do have one. The judges also note rows clipped under the summary sheet on the Flutter and Compose booking screens.

## 5. Why the three rounds were reverted

| round | change | targeted items | reason for the revert |
|---|---|---|---|
| 1 | screen-title, price and settings hierarchy recipes; flow steps as linear progress; swatches; first screen reaches the main content; compact web app shell | 2.425 → 2.475 (up) | regression sample dropped by 1: product-detail.web color and shape (a tertiary picture placeholder), settings.flutter classic polish (no app bar) |
| 2 | round 1 plus selected filter state, filled group containers, error role only for errors, top app bar rule, no tertiary placeholders | 2.30 → 2.275 (no gain) | regression drops in onboarding.web.vue (3 items) and onboarding.flutter (4 items) plus a contrast finding (helper text 3.41:1) |
| 3 | minimal: no tertiary placeholders, selected All chip, error role only for errors, title/price/settings hierarchy, helper text on onSurfaceVariant | 2.275 → 2.375 (up) | regression onboarding.compose shape 3 → 2 and spacing 3 → 2 |

Common pattern: the targeted items moved up in two rounds of three, but each round's regression sample tripped on a 1-point drop. The same output scores 2 in one pooled session and 3 in another, and a cell run twice with the same skill differs more than the rounds' changes did, so a 24-item "no drop of 1" check over three cells fails on noise about as often as on a real regression. Rule-based additions (each targeting a judged defect) did not move overall-polish: it stayed at 2 everywhere.

## 6. Options to close the composition gap

All three below are changes for a future phase; none is applied here.

**A. Layout templates per screen type (example compositions, not rules).** Ship one compact reference composition per common screen type (list, detail, form/flow, dashboard, settings, empty/error, chat) per platform as code skeletons the skill reads on demand: top app bar, title scale, content column and gutters, where the primary action sits, what the first phone screen must show, how bottom bars reserve space. Rationale: the gaps are geometric (empty bands, column offsets, clipped rows under sheets, weak page titles), and the rules that describe them in words did not change outputs; a concrete skeleton gives the model the geometry to copy. Cost: about 7 screen types × 3 platforms of skeleton code and screenshots, loaded on demand (outside the always-read budget); one dev round plus a measurement. Risk: sameness across outputs and overfitting to the eval screen types (templates must be generic categories, checked on the dev set and a new hold-out); keeping three platforms' skeletons in sync.

**B. A reference-comparison critique step ("art director").** After the first screenshot, the skill runs one critique pass: it compares its own screen with a first-party screen of the same type on a short fixed list (title scale, first-screen content, empty bands, overlaps, Expressive accents, status color loudness) and makes one fix pass. Rationale: the judge's top complaints are visible in a screenshot and are the kind a reviewer catches at once; the skill already takes screenshots. Cost: about +30–50% time and tokens per run; reference images cannot ship in the public plugin (brand and licensing), so the comparison needs own-made reference renders or a textual description. Risk: self-critique without a real reference tends to approve its own output; a second pass can introduce new defects (the regression samples showed how easily one item drops).

**C. Fix the measurement where it hides built content, then re-measure.** Judge Flutter and Compose on scrolled frames as well as the first viewport, and capture web compact pages with fixed bars in place (one viewport plus scroll frames instead of a full-page image). Rationale: about a fifth of the gap texts name content that was built but not in the judged frame, and the mobile-overlap complaints come partly from the full-page capture. Cost: a new harness version, re-capture of baseline and final outputs (no new runs), three new pooled sessions (~$15). Risk: it changes the measurement after results were seen, so it can only be used for the next phase's bar, never to re-grade this one; it does not by itself fix overall-polish.

## 7. Not in the bar

- Sonnet check (claude-sonnet-5-5, product-detail, final skill): all three built with 0 findings; medians web 2/2/3/2/2/2/3/2, Flutter 3/3/2/2/3/2/2/2, Compose 2/2/2/2/2/2/3/2 (items in table order); Opus final on the same cells is equal or higher on most items.
- PC-1 discrimination (rubric-free judge, real reference screens mixed with final with-skill outputs, seed 20261127): 34 items, accuracy 1.00, AUC 1.00, the same as the baseline PC-1 (1.00). The judge named design as the cue only twice. Its other cues: brand 14, system UI 9, language 6, content 3. It tells real screens from generated ones mostly by brand marks, the system status bar and content, not by M3 design quality. So PC-1 cannot measure how close the design comes to first-party screens.
