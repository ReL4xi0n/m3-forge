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
- **Release bar:** spec §12, word for word, plus the scoring rule of owner decision 2 (median of three sessions). It is
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

## Owner decisions (2026-11-23)

These update the proposals above and below; where they differ, these win.

1. **Budget:** Full (spec option B) plus the regression sample. No cost limit; the aim is the best M3
   result. The regression sample runs **after every round** (not only after the last), because the
   keep rule below needs it.
2. **Scoring: three blind sessions, median of record.** Every output is scored in three independent
   blind judge v2 sessions (fresh anonymization, new IDs, own shuffle each). Per output and item the
   score of record is the **median of the three**. "No single score below 2" applies to that median.
   Baseline and final outputs are scored in the same three sessions, pooled. This replaces the
   double-pass proposal. The rule holds for every judging in this phase (step 1 working scores,
   rounds, step 4, step 5).
3. **First 2 cells:** no stop. Stop and report only when a cell costs more than **twice** the upper
   end of its platform's measured range (web $6.94, Flutter $6.20, Compose $7.26), or on a systematic
   fault (timeouts, isolation failures, build failures). The first 2 cells' cost goes in the report.
4. **Sonnet check:** `product-detail`, one cell per platform, approved.
5. **Rounds:**
   - **Weak cell:** in the medians, any item below 2; or any of hierarchy-typography,
     spacing-layout, component-choice, overall-polish (F9/F10) below 2.5; or a requested element not
     visible; or any automated finding (scored or unscored, verify or runtime).
   - **Keep rule:** a round's skill change is kept only when (a) the targeted items of the targeted
     weak cells improve in the medians (new outputs scored pooled with the previous outputs of the
     same cells in the same three sessions), and (b) in the regression sample no item's median drops
     by 1 or more and automated findings stay at 0. Otherwise the change is reverted and the revert is
     written to the ledger; the previous outputs stay the outputs of record.
   - Changes go into the shared core (CHECKLIST, `references/core`) and stay general; wording taken
     from an eval request is forbidden (`overfit.mjs`).
   - The always-read budget (54,514 characters) is not exceeded.
6. **Memory:** thresholds accepted (Compose >= 3.5 GB available, web/Flutter pair >= 2.5 GB). The
   owner's applications are never closed and `wsl --shutdown` is not run. Only this session's own
   processes are cleaned: `gradlew --stop`, Kotlin daemons, leftover Chromium/Java/Dart processes.
   When a threshold is not met: no stop; check every 10 minutes, run the web/Flutter cells whose
   threshold holds, leave Compose to the end. If the Compose threshold never holds for 3 hours,
   stop and report instead of skipping Compose cells.
7. **Parallelism:** measurements run in one tree, in order. Release preparation that needs no build
   or measurement (README draft, CHANGELOG, plugin icon, examples/ skeleton, install docs) may go to
   one parallel agent in a separate worktree, under the standing rules (noreply email, guard and
   hooks, `evals/holdout/` never read, nothing from `private/` in public files, no Google marks).
   `examples/` is filled only with final skill outputs, after the measurements end.
8. **Order:** final measurement -> at most 3 rounds -> hold-out (once) -> pooled three-session
   scoring of baseline + final + hold-out + Sonnet -> second repeat on ambiguous cells -> PC-1 ->
   spot-check page -> release preparation -> both install paths tried in a clean environment.
9. **Stop point:** when the spot-check page and the release preparation are ready. The report gives
   the bar result item by item (met / not met) and the gap report. The `v0.1.0` tag, the final merge
   into main and publishing the README happen only after the owner's visual sign-off. The bar does
   not change after results are seen.

## Order of work

### Step 0: preflight
1. Memory check before every batch (decision 6).
2. `npm test` fast subset green; `tools/ci/overfit.mjs` and `tools/ci/skill-trace.mjs` ok; skill at a
   tagged commit `phase4-final-0`.
3. Phase 4 tooling, with tests, before any paid run: the eval set runs with the skill only under an
   explicit final-measurement flag; model override for the Sonnet cells; three-session pooled
   judging with medians; shots of record per harness version.
4. Pick and record now (seeded, before any result): the spot-check sample and the regression-sample
   draw.

### Step 1: final measurement on the eval set
- 26 cells, eval requests `evals/prompts/*`, skill installed, harness v3 capture, verify v2.
- First 2 cells (one web, one Compose): cost and time recorded for the report; stop only under
  decision 3.
- Concurrency: web and Flutter cells two at a time; **Compose cells one at a time, with nothing else
  running**, moved to the end when memory forces it (decision 6).
- Working scores: the 26 outputs in three blind sessions (medians) to find weak cells. The scores of
  record come from step 4.

### Step 2: improvement rounds (at most 3; only weak cells)
- Weak cells by decision 5, ranked by the number of failing items; at most 10 per round.
- Focus F9/F10 (hierarchy, spacing, composition, component choice). Changes in the shared core and
  platform references, never request-specific text: `overfit.mjs` stays at "no eval terms" after
  each round; the always-read budget holds (new text paid for by cuts).
- Each round: re-run the weak cells and the regression sample (3 cells, 1 per platform, drawn with
  the recorded seed among cells not re-run in that round); score the new outputs pooled with the
  previous outputs of the same cells in three sessions; keep or revert by decision 5.
- Compose's reverted 48 dp layout rule gets its first fresh test here (Phase 3 open gap 2).

### Step 3: hold-out, once
- Only now is `evals/holdout/` opened. 2 requests x 3 platforms = 6 cells with the final skill. No
  skill change after this point. A hold-out failure is reported, not fixed.
- The Sonnet cells (decision 4) run with the final skill after the hold-out.

### Step 4: pooled blind re-score of baseline and final (three sessions)
- Three fresh judge v2 sessions, each over all of: 26 baseline outputs, 26 final with-skill outputs,
  6 hold-out outputs, 3 Sonnet outputs, anonymized together and shuffled independently; the mapping
  is read only after the three sessions. Baseline Flutter outputs use their harness v3 captures,
  baseline Compose outputs their compose-v3 captures (the harness versions of record).
- The medians alone are used for the before/after comparison and the bar.

### Step 5: second repeat on ambiguous cells
- Ambiguous cell (spec §12): pooled before/after difference <= 0.5 on any judged item of that cell.
- Each one runs once more with the final skill. Then three more pooled sessions score, together, the
  baseline output, the first final output and the repeat of every ambiguous cell. A cell's
  with-skill score = mean of its two runs' medians.

### Sonnet check and PC-1 (not in the release bar)
- **Sonnet:** `product-detail` on web-empty, flutter-material_ui and compose-1.5 (default style), run
  with claude-sonnet-5-5 and the final skill, scored in the step 4 sessions. Reported next to the
  Opus numbers; not counted toward the bar.
- **PC-1 diagnostic:** `evals/tools/discriminate.mjs` once over the final with-skill outputs and the
  references. Reports accuracy, AUC and the cues the judge named. Not in the bar.

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

After the allowed rounds (3), stop with a gap report: each failing bar item per
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
- Below that: do not start that cell; re-check every 10 minutes (decision 6). Stop and report only
  when the Compose threshold has not held for 3 hours.
- Compose cells run one at a time with nothing else; Gradle daemons are stopped after each cell.
- **Now (2026-11-23): 2.3 GB free**, below both thresholds.

## Evidence at the end (spec §15)

Pooled before/after scores per platform (median of three sessions), the single-cell drop list, hold-out results,
Sonnet and PC-1 results (marked outside the bar), the spot-check verdicts, costs per step, green CI,
both install paths shown working; or the gap report.

## Decisions for the owner (with this plan)

Answered on 2026-11-23; see "Owner decisions (2026-11-23)".
