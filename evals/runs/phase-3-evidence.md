# Phase 3 evidence (Task 27)

Skill `plugin/skills/material3`, dev request set `evals/dev/` only (no eval request, no hold-out was run or
read). Model for all dev cells: claude-opus-5-5. Measurement tools frozen: rubric v2, judge v2, automated items v2
(`evals/frozen-v2.json`), harness v3 for Flutter and Compose (`evals/frozen-harness.json`). Owner gate for 3b to
3d (2026-11-18): every cell builds, zero automated findings, every requested element visible, no judge v2
score below 1. The mean-based release bar moves to Phase 4.

## Failure map: dev result per row and platform

Final run of each cell. "0" = zero findings in verify (scored and unscored) and in the runtime capture.

| ID | Baseline | Web (4 cells + no-Node) | Flutter (4 + no-Node) | Compose (4 + no-Node) |
|---|---|---|---|---|
| F1 off-grid spacing | 187 | 0 | 0 | 0 |
| F2 hardcoded color | 60 | 0 | 0 | 0 |
| F3 off-token type | 370 | 0 | 0 | 0 |
| F4 off-token radius | 40 | 0 | 0 | 0 |
| F5 shadow / gradient | 48 | 0 | 0 | 0 |
| F6 touch target < 48 dp | 139 | 0 | 0 | 0 skill cells; 0 no-Node under harness v3 (8 under the old layout-size measure) |
| F7 icon source | 493 | 0 | 0 | 0 (micro-test: skill 0/5 runs with a hit, control 5/5) |
| F8 contrast | 3 | 0 | 0 | 0 (the round-1 hits were a disabled button, exempt) |
| F9 spacing-layout, overall polish | web 2.11 / 1.89, Flutter 2.22 / 2.00, Compose 2.25 / 2.13 | 2.00 / 2.00 | 2.67 / 2.00 | 2.00 / 2.00 |
| F10 hierarchy-typography | web 2.44, Flutter 2.33 | 2.00 | 2.67 | 2.20 |
| F11 placeholder content | 12 of 26 cells | 0 (micro-test 0 hits in both arms) | 0 | 0 |
| F12 Google brand | 2 of 26 cells | 0 (micro-test 0 in both arms) | 0 | 0 |

Judge v2 numbers are the last pooled sessions (`dev-states-pooled`, `dev-compose-pooled`): no score below 2
anywhere. Spacing-layout and overall polish stay at 2.0 on web and Compose (F9 target 2.5: not met, open gap,
the bar is Phase 4). Rows F1 to F8, F11, F12 meet their dev target of 0 on all three platforms.

No-Node cells: every platform's no-Node cell writes the code, skips the missing steps and ends at 0 findings
(web needed the run to hide Bun and Deno from PATH; Flutter needed a recipe in `references/flutter/setup.md`;
Compose reaches 0 under harness v3, the layout-size rule was removed).

## Dev rounds and costs

| Platform | Rounds | Dev cells run | Cost (client estimate) |
|---|---|---|---|
| Web | 4 (+ plan-check and states re-runs) | 26 recorded runs | $66.5 |
| Flutter | 2 (+ states re-run) | 9 | $24.3 |
| Compose | 3 (the third no-Node only) | 8 | $20.4 |
| Wording micro-tests (F7, F11, F12) | 1 | 30 runs | $18.6 |

Dev cells plus micro-tests about $130, plus judging sessions (about $0.3 to $1 each). Baseline for reference: 26
cells, $41.0. Within the plan estimate ($60 to $130 for the paid runs, judging separate).

## Skill size and always-read budget

- Skill folder 25,008,528 bytes in 330 files (cap 26,214,400; Compose icons shipped gzipped, ruling R29).
- Always-read text 54,509 of 54,514 characters (`tools/ci/skill-budget.mjs`); SKILL.md 7.7 KB, CHECKLIST.md 5.1 KB.

## Resolution ladder uses (`knowledge/not-found.md`, "Ladder uses")

7,055 token values came from the ladder rather than the platform's own repository: web 1,030 (227 from Compose,
52 from Flutter, 751 derived by reference), Flutter 2,225 (207 / 424 / 1,594), Compose 3,800 (920 from
material-web, 701 from Flutter, 2,179 derived). Rung 3 (library default) is not listed. No value was computed or
guessed.

## Overfit and skill-trace outputs

- `node tools/ci/overfit.mjs`: "no eval terms in the skill" (12-word and distinctive-term check against
  `evals/prompts/*`, SKILL.md, CHECKLIST.md, references, assets).
- `node tools/ci/skill-trace.mjs`: ok (every SKILL.md and CHECKLIST.md bullet cites an F or W id; every F row has a
  rule and an asset or a check).
- Fast tests: 595 pass, 0 fail, 53 skipped (toolchain-gated). Toolchain-gated Compose tests pass locally:
  harness 7/7, screenshot step real-Gradle test 1/1.

## Owner decisions applied in 3d

- R28: Compose screenshots run in a temporary copy with our own Gradle init script (spec §7 updated).
- Compose harness v3 (touch target includes `minimumInteractiveComponentSize`), frozen; baseline Compose cells
  re-measured from the recorded code: touch-target findings 68 → 2, automated contrast-targets 0.88 → 2.88,
  pictures byte-identical so judge scores unchanged. "Layout at least 48 dp" rule removed from the Compose
  components reference.
- `enterText` fails a state when the text is not in a field; it also exposed and fixed a cold-first-launch bug.
- Always-visible elements are `main` in the plan check; popup menus are a known Robolectric limitation.
- 3d gate re-check without a new round: `evals/runs/dev-compose/recheck.md`.

## Open gaps

1. F9 / F10 means (2.0 to 2.7) are below the 2.5 target on web and Compose; judged at the Phase 4 bar.
2. The reverted Compose rule is untested on a fresh skill round: the skill cells' code was written while the
   48 dp rule applied and still measures 0; only a new round would show what the model does without it.
3. Compose `sorted-price-low` state of plant-shop r2 failed and was not re-shot; the sort menu popup itself cannot
   be shown under Robolectric.
4. Phase 4: eval set with the skill, then the hold-out; the Sonnet check next to the final measurement.
