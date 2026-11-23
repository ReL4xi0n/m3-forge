# m3-forge Phase 4 (Improve and Release) Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development for the
> release-prep tasks; the eval runs are driven by the controller with `evals/tools/pipeline.mjs`.

**Goal.** Measure the `/material3` skill on the eval set and the hold-out, improve it in at most 3
rounds on weak cells, check it against the release bar (spec §12) with pooled blind scores, and
release v0.1.0, or stop with a gap report.

**Spec:** `docs/superpowers/specs/2026-11-12-m3-forge-design.md` §12 (run matrix, hold-out, release
bar), §13, §14, §15 Phase 4; roadmap carried items and standing rules; Phase 3 ledger
(`.superpowers/sdd/2026-11-17-m3-forge-phase-3/progress.md`) and evidence
(`evals/runs/phase-3-evidence.md`); baseline records in `evals/runs/2026-11-17-baseline/`
(automated-v2, judge-v2, flutter-harness-v3, compose-harness-v3).

## Fixed before any Phase 4 run

These are fixed now, with this plan's approval, and not changed after results are seen.

- **Measurement tools:** rubric v2, judge v2, automated items v2 (`evals/frozen-v2.json`), Flutter
  harness v3 and Compose harness v3 (`evals/frozen-harness.json`). The baseline numbers of record are
  the v2/v3 re-scores (`automated-v2.md`, `judge-v2.md`, `flutter-harness-v3.md`,
  `compose-harness-v3.md`) and are scored again in the final pooled session (step 4).
- **Release bar:** spec §12, word for word, plus the scoring rule below for the double pass. It is
  not edited after results are seen. If it is not met, the outcome is a gap report and an owner
  decision (see "If the bar is not met").
- **Model:** claude-opus-5-5 for all eval cells; Sonnet check with claude-sonnet-5-5.
- **Isolation:** as in Phases 2 and 3 (temporary `CLAUDE_CONFIG_DIR`, fresh fixture copy, only this
  skill installed, canary before every batch of 6, init/audit/preflight checks).
- **Hold-out:** `evals/holdout/` stays unopened until step 3. Repo-wide searches keep excluding it.

## Measured cell costs (input to the budget)

Client estimates (Claude Code `costUsd`, API list price for a subscription session; not a bill).
With-skill numbers are the dev cells run with the latest skill versions (web r4, webplan, webstates;
Flutter r1, flutterstates; Compose r1, r2). Dev requests are a separate set; eval requests may cost
somewhat more or less, which is why the first 2 eval cells are reported before the rest (spec §15).

| platform | baseline eval cells (n) | with-skill dev cells (n) | with-skill mean | range | model minutes |
|---|---|---|---|---|---|
| Web | $1.86 (9) | 10 | **$2.48** | $1.84–$3.47 | 9–23 |
| Flutter | $1.42 (9) | 7 | **$2.68** | $2.19–$3.10 | 9–12 |
| Compose | $1.45 (8) | 4 | **$3.17** | $2.41–$3.63 | 11.5–30.4 (+ Gradle) |

- Mean of the 26-cell eval mix (9 web, 9 Flutter, 8 Compose): $2.76 per cell.
- Judge v2: about $0.12 per output per pass (pooled web r4 session: 11 outputs, $1.28). PC-1: $0.81.
- Unit used below: one Phase 2 baseline = 26 cells, $41.05, 199 model minutes.

## Budget options

Every option keeps the 26 final eval cells and the 6 hold-out cells: the release bar is defined over
all final with-skill outputs, so cutting cells would change the bar.

| item | Full (spec option B) | Medium | Small |
|---|---|---|---|
| Final eval run, 26 cells | $71.8 | $71.8 | $71.8 |
| Improvement rounds | 3 × ~10 cells: $82.8 | 2 × 8 cells: $44.2 | 1 × 6 cells: $16.6 |
| Hold-out, 6 cells (2 per platform) | $16.7 | $16.7 | $16.7 |
| Second repeats on ambiguous cells | 10–15 cells: ~$33 | at most 6 cells: $16.6 | none |
| Sonnet check, 3 cells (upper bound at Opus cost) | $8.3 | $8.3 | $8.3 |
| Judging (rounds, final pooled, repeats, PC-1) | 2 passes everywhere: $31 | 2 passes final/repeats, 1 pass rounds: $23.5 | 1 pass + second pass on with-skill outputs only: $13.3 |
| Canaries, probes | ~$3 | ~$2 | ~$1.5 |
| **Total (client estimate)** | **≈ $247** (≈ $205–295) | **≈ $183** | **≈ $128** |
| **In baseline units** | **≈ 6.0 baselines** | **≈ 4.5** | **≈ 3.1** |
| Cells / model hours / wall time | 77 / ~19 h / ~15 h | 57 / ~14 h / ~11 h | 41 / ~10 h / ~8 h |

Recommended add-on in any option: a **regression sample** of 3 cells (1 per platform, chosen at
random among cells not re-run in the rounds) with the final skill, $8.3. Rounds re-run only weak
cells, so the other final outputs come from an earlier skill version; this sample shows whether the
round changes hurt them.

What each option gives up:
- **Medium:** no third round (if the bar is missed after round 2, it stays missed unless the owner
  approves more); at most 6 second repeats, so further ambiguous cells are reported as "ambiguous,
  not repeated"; single-pass judging in rounds, so a round's gain under 0.5 cannot be told from noise.
- **Small:** one round only, aimed at F9/F10; no second repeats; the baseline and the bar check
  rest on one judge pass for baseline outputs, so an item mean near 2.5 can flip by judge noise
  alone (±0.5 per item between sessions). The bar result is then the least certain of the three.

Subscription: the totals are API list-price equivalents; real limits are the subscription's usage
windows. Runs go in batches of up to 6 cells; the pipeline's quota stop ends a batch cleanly when a
limit is hit and never works around it (owner rule). Phase 3 dev work for comparison: about $130 plus
judging (≈ 3.2 baselines).

## Order of work

### Step 0: preflight
1. Memory check before every batch (rule below). Stop and tell the owner when it fails.
2. `npm test` fast subset green; `tools/ci/overfit.mjs` and `tools/ci/skill-trace.mjs` ok; skill at a
   tagged commit `phase4-final-0`.
3. Pick and record now (seeded, before any result): the Sonnet cells, the spot-check sample, the
   regression-sample pool rule.

### Step 1: final measurement on the eval set
- 26 cells, eval requests `evals/prompts/*`, skill installed, harness v3 capture, verify v2.
- **Cost checkpoint (spec §15):** after the first 2 cells (one web, one Compose), report time and cost.
  Proposal: continue without a stop when both are within the measured range plus 30%; otherwise stop.
- Concurrency: web and Flutter cells two at a time; **Compose cells one at a time, with nothing else
  running**.
- First pooled judging of the 26 outputs (2 passes) to find weak cells. This is a working score only;
  the scores of record come from step 4.

### Step 2: improvement rounds (at most 3; only weak cells)
- **Weak cell** (fixed rule): any automated finding (scored or unscored), any item below 2, or
  spacing-layout, hierarchy-typography or overall-polish at or below 2 (F9/F10). Ranked by the number
  of such items; at most 10 cells per round (Medium 8, Small 6).
- **Focus F9/F10: hierarchy, spacing, composition.** Changes go into the shared core
  (`references/core/composition.md`, `layout.md`, `typography.md`, CHECKLIST) and platform references,
  never request-specific text: `overfit.mjs` must stay at "no eval terms" after each round. The
  always-read budget (54,514 chars) still holds; new text is paid for by cuts.
- Each round: re-run the weak cells; judge the new outputs pooled with the previous versions of the
  same cells (2 passes in Full). A round's skill change is kept only if the targeted item means do
  not drop and automated findings stay at 0; otherwise it is reverted and the previous outputs stay.
- Compose's reverted 48 dp layout rule gets its first fresh test here (Phase 3 open gap 2).
- After the last round: the regression sample (add-on) with the final skill.

### Step 3: hold-out, once, at the end
- Only now is `evals/holdout/` opened. 2 requests × 3 platforms = 6 cells with the final skill. No
  skill change after this point. A hold-out failure is reported, not fixed.

### Step 4: pooled blind re-score of baseline and final
- One fresh judge v2 session over all of: 26 baseline outputs, 26 final with-skill outputs, 6 hold-out
  outputs, 3 Sonnet outputs. Anonymized together, shuffled, mapping opened only after scoring.
- These scores alone are used for the before/after comparison and the bar.

### Step 5: second repeat on ambiguous cells
- Ambiguous cell (spec §12): pooled before/after difference ≤ 0.5 on any judged item mean of that cell.
- Each one runs once more with the final skill. Then a second pooled session scores, together, the
  baseline output, the first final output and the repeat of every ambiguous cell, so each comparison
  is inside one session. A cell's with-skill score = mean of its two runs.

### Judge noise (±0.5): double pass
Proposal (Full and Medium): every output in the pooled sessions is scored **twice**, in two fresh
judge sessions with independent shuffles and new IDs. Per output and item, the score of record is the
mean of the two passes. Where the passes differ by 2 or more, a third pass scores that output only,
and the median is used. The bar's "no single score below 2" applies to that per-output score (so 2+2,
3+1 pass; 2+1 = 1.5 fails).
- Cost: one pass over the step 4 pool (61 outputs) ≈ $7.3, so the second pass adds ≈ $7.3; the step 5
  session (≈ 36 outputs) adds ≈ $4.3 per pass. Together ≈ $12, about 4–5 eval cells' worth.
- Why: the bar compares means against 2.5 and baseline means; a single pass moves them by up to 0.5.
  Averaging two independent passes halves the variance of each score for about 5% of the budget.

### Sonnet check and PC-1 (not in the release bar)
- **Sonnet:** the final with-skill run of one cell per platform, run again with claude-sonnet-5-5:
  proposed `product-detail` on web-empty, flutter-material_ui and compose-1.5 (default style),
  scored in the step 4 session. Reported next to the Opus numbers; not counted toward the bar.
- **PC-1 diagnostic:** the real-vs-generated discrimination test (`evals/tools/discriminate.mjs`) once
  over the final with-skill outputs and the references. Reports accuracy, AUC and the cues the judge
  named. Not in the bar.

## Owner visual sign-off (bar item 4)

- One local spot-check page, `private/evals/runs/<final run>/spotcheck.html` (private: it shows the
  owner's reference screenshots; never published, never in the public repo).
- Sample, drawn with a recorded seed in step 0: per platform 3 eval cells (one default, the classic
  cell, the seed cell) plus 1 hold-out cell, each in light and dark, side by side with the paired
  references.
- Per sample the owner marks pass / fail with a note; the page saves the verdicts to a JSON file next
  to it. Where the owner and the judge disagree, the owner's score wins and the disagreement is noted
  for rubric calibration (spec §12). The bar needs a pass on every platform.

## If the bar is not met

After the allowed rounds (3, 2 or 1 by option), stop with a gap report: each failing bar item per
platform with the numbers, the failing outputs and their pictures, the single-cell drops, the likely
causes, and options with their cost. The owner decides (another round, ship with documented gaps, or
stop). The bar and the scores are not changed after results are seen.

## Release preparation (parallel subagents; no eval runs involved)

1. **README:** disclaimer (unofficial, not affiliated with Google); both install paths; the full
   command names (`/m3-forge:material3`, and bare `/material3` with the verified result); supported
   platforms and requirements (Node optional, SDKs optional); example gallery; known limitations
   from Phase 3 (popup menus under Robolectric, no-Node behaviour).
2. **examples/:** only skill outputs from the final runs (code plus screenshots), picked by the owner
   from the spot-check page; brand check (`brand` verify check, no Google marks, no Google names in
   content); guard pass. No baseline outputs, no references.
3. **Plugin icon:** our own icon; added to the manifest if the plugin schema accepts one
   (`claude plugin validate`), otherwise used in the README only.
4. **CHANGELOG.md** (v0.1.0), version 0.1.0 in `plugin.json` and the marketplace entry.
5. **Full CI** (spec §13 PR workflow) and `regenerate-references.yml` (manual dispatch).
6. **Install paths, tried in a clean environment:** a fresh `CLAUDE_CONFIG_DIR` with no other skills
   or plugins: (a) `/plugin marketplace add ReL4xi0n/m3-forge` then `/plugin install m3-forge@m3-forge`,
   run `/m3-forge:material3` and bare `/material3` on a small request; (b) manual copy to
   `<config>/skills/material3/`, run `/material3`. Transcripts recorded as evidence; the README states
   what was observed. Path (a) needs the release commit on GitHub; it is tried from the pushed branch
   before the tag.
7. **Tag `v0.1.0`** only after the bar is met (or the owner decides to ship) and both install paths
   worked. Merge locally, noreply author, guard before every push.

## Memory rule

Measured in Phases 2–3 on this machine (15.5 GB): runs started with 1.6–2.9 GB free and peaked at
the limit; a Compose cell's Java processes peaked at 2.2–3.7 GB, a web or Flutter pair at about
1.2–1.9 GB above the start.
- Before each Compose cell: at least **3.5 GB free**; before a web/Flutter pair: at least **2.5 GB**.
- Below that: do not start; stop and tell the owner (closing other apps, `wsl --shutdown` frees about
  0.9 GB).
- Compose cells run one at a time with nothing else; Gradle daemons are stopped after each cell.
- **Now (2026-11-23): 2.3 GB free**, below both thresholds.

## Evidence at the end (spec §15)

Pooled before/after scores per platform (double pass), the single-cell drop list, hold-out results,
Sonnet and PC-1 results (marked outside the bar), the spot-check verdicts, costs per step, green CI,
both install paths shown working; or the gap report.

## Decisions for the owner (with this plan)

1. Budget option: Full, Medium or Small; regression-sample add-on yes/no.
2. Double-pass judging and its scoring rule (mean of two passes, third pass on a gap of 2 or more).
3. Cost checkpoint after the first 2 cells: stop always, or continue within range + 30%.
4. Sonnet cells: `product-detail` × 3 platforms.
5. Weak-cell rule and the per-round keep/revert rule.
6. Memory thresholds (3.5 GB Compose, 2.5 GB pair).
