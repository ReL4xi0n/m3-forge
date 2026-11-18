# Compose dev loop (Phase 3d, Task 26)

Dev set `evals/dev/`, 4 Compose cells plus one no-Node cell, skill installed, model claude-opus-5-5, isolated
runs. Gate (owner, 2026-11-18; spec §15): every cell builds; zero automated findings (verify scored and
unscored, runtime checks); every requested element visible (main screen or reached by a recorded interaction);
no judge v2 score below 1. Costs are Claude Code client estimates.

The Compose screenshot step (Task 25) renders the project in a temporary copy with Robolectric and Roborazzi
through an init script of its own, so the project is never edited and Roborazzi need not be in it (ruling R28:
the spec said "only if the project already has Roborazzi"; owner decision needed). `--states` performs
click / enterText / scrollTo steps and shoots each state.

## Rounds

| round | cell | build | verify scored / unscored | capture contrast / targets | time | cost |
|---|---|---|---|---|---|---|
| r1 | podcast-player (default) | ok | 0 / 0 | 0 / 0 | 11.5 min | $2.41 |
| r1 | clinic-schedule (default) | ok | 0 / 0 | 0 / 0 | 18.9 min | $3.63 |
| r1 | expense-report (seed #2F6F5E) | **timeout 45 min** | 30 (4 contrast, 26 targets) / 0 | | 45 min | n/a |
| r1 | plant-shop (classic) | **timeout 45 min** | 20 (2 contrast, 18 targets) / 0 | | 45 min | $1.40 |
| r1 | plant-shop, no Node | ok | 20 targets / 0 | | 6.4 min | $1.72 |
| r2 | expense-report | ok | 0 / 0 | 0 / 0 | 30.4 min | $3.59 |
| r2 | plant-shop | ok | 0 / 0 | 0 / 0 | 23.3 min | $3.03 |
| r2 | plant-shop, no Node | ok | 22 targets / asset-unused 1 | | 6.9 min | $1.74 |
| r3 | plant-shop, no Node | ok | 8 targets / 0 | | 9.9 min | $2.85 |

Round 3 ran only the no-Node cell. The three allowed rounds are used up.

### What round 1 showed and what changed

- Two sessions hung 45 minutes inside `screenshot --platform compose`. Root cause (found by reproducing on the
  recorded plant-shop project): a `DropdownMenu` popup starts a Compose frame loop that re-posts at the same
  instant under Robolectric, so `idleFor`, Espresso idle and `ActivityScenario` never return; states ran before
  the main shots, so no PNG existed. Fix (e0f78c9): main shots and states are separate Gradle runs, bounded
  settle, popups removed before finishing, a 90 s watchdog per state, a state that leaves a frame loop restarts
  the JVM for the remaining states, and a hard 12-minute cap that kills Gradle and returns `ran: false` with the
  reason.
- Touch targets and contrast: the frozen Compose harness (and the skill's step) measure LAYOUT size, not the
  touch area `minimumInteractiveComponentSize()` adds, so official 40 dp buttons and 32 dp chips are reported.
  The Compose components reference now says every button, chip, icon button and clickable row gets a layout of
  at least 48 dp (`heightIn(min = 48.dp)`), at the top of the file. Round 2 skill cells then had 0 findings.
  The r1 contrast findings were texts of a disabled (sold-out) button, which spec §9 exempts; they did not
  occur in r2.
- No-Node cell: r1 22 targets, r2 22 plus 1 unused asset, r3 (rule moved to the top of the reference) 8
  targets. A session without Node cannot run capture or verify, so the rule only reaches it through the
  reference; it followed it for most but not all controls. Not clean after 3 rounds.

## Judge v2 (one pooled session, 5 outputs, `evals/runs/dev-compose-pooled/`)

| output | comp | hier | color | shape | spacing | states | dark | polish |
|---|---|---|---|---|---|---|---|---|
| podcast-player (r1) | 2 | 3 | 3 | 3 | 2 | 3 | 3 | 2 |
| clinic-schedule (r1) | 2 | 2 | 2 | 2 | 2 | 3 | 3 | 2 |
| expense-report (r2) | 2 | 2 | 3 | 2 | 2 | 3 | 3 | 2 |
| plant-shop (r2) | 2 | 2 | 2 | 2 | 2 | 2 | 3 | 2 |
| plant-shop, no Node (r2) | 2 | 2 | 2 | 3 | 2 | 2 | 2 | 2 |

No score below 2 (gate: none below 1). The r3 no-Node output was not judged.

## Requested elements visible (yes/no)

Read from the harness frame and the screenshot step's state shots of each cell's last run. Elements not listed
were present on the main screen in the other platforms' tables and were not re-read for Compose one by one.

| cell | element | visible | where |
|---|---|---|---|
| podcast | mini-player | yes | state `mini-player` (library view with the mini-player docked), read |
| podcast | speed, sleep timer, queue remove | yes | states `speed-sheet`, `sleep-sheet`, `sleep-set`, `queue-removed` ran ok; not all read |
| clinic | rescheduling, statuses, empty provider | yes | states `reschedule-dialog`, `moved-snackbar`, `cancel-dialog`, `empty-provider` ran ok; not all read |
| expense | confirmation summary | yes | state `confirm-dialog`, read |
| expense | optional note, validation, receipts, totals | yes | states `line-editor-missing-receipt`, `receipt-preview`, `submit-blocked`, `totals` ran ok; not all read |
| plant | grid, filter chips, sort, badges, out of stock | yes | main frame, read |
| plant | empty result state | **no** | state `empty-search` ran "ok" but its shot shows the full list: the typed text did not reach the search field (no error was raised) |
| plant | filters sheet, sort menu, basket | yes | states ran ok, not all read; `sorted-price-low` failed |

## Findings for the owner

1. The Compose screenshot step runs without Roborazzi in the project (R28; the spec §7 said it should only run
   when the project already has it). The first run needs network for Robolectric and Roborazzi.
2. The frozen Compose harness measures layout size: official 40 dp buttons and 32 dp chips are touch-target
   findings. The skill now builds 48 dp layouts to satisfy it, which makes classic buttons taller than the M3
   spec's 40 dp container. A harness change (a new measurement version, like Flutter's shadows) would let the
   skill keep the official sizes. Decision needed before Phase 4.
3. `enterText` does not report a miss when the text field is custom (plant search): the state is marked ok and
   shows the unchanged screen. A "text did not appear" check is a small follow-up.
4. The no-Node Compose cell still has 8 touch-target findings after 3 rounds.

## 3d owner decisions (2026-11-18) and the re-check without a new round

1. **R28 accepted.** Roborazzi and Robolectric run only in a temporary copy of the project (own Gradle init
   script); offline, the step is skipped and the report says so. Spec §7 now says this.
2. **Compose harness v3 (frozen in `evals/frozen-harness.json`).** The touch target now includes the padding
   `minimumInteractiveComponentSize()` adds, so official 40 dp buttons and 32 dp chips are not findings; a bare
   clickable under 48 dp still is (the sample app proves both). Measured with the modifier's own bounds, not
   `SemanticsNode.touchBoundsInRoot`: that includes Compose's pointer-input expansion to 48 dp, so every
   clickable, even a bare 32 dp box, reported 48 dp and the check could never fire (tried first, 0 findings
   everywhere). Harness v2 (layout size) stays selectable to reproduce the old numbers. The "layout at least
   48 dp" rule is gone from `references/compose/components.md` (official sizes stay: 40 dp button, 32 dp chip).
   Baseline Compose cells, recorded code captured again (`evals/runs/2026-11-17-baseline/compose-harness-v3.md`):
   touch-target findings 68 → 2 over 8 cells, automated contrast-targets mean 0.88 → 2.88. The pictures are
   byte-identical to the earlier ones (SHA-256, 8/8), so the judge v2 scores cannot change and the judge was
   not run again; the "blind re-score" is the frozen automated formula on the new capture.
3. **`enterText` fails a state whose text is not in a text field afterwards.** Tested with a fixture field that
   ignores its change callback (`ignored-text` state: `ok: false`, "did not appear in the text field"). On the
   real plant-shop search it exposed a cold-start bug: the first launch of a JVM dropped the typed text (light
   theme failed, dark worked). The step now makes one throwaway launch before the first state.
4. **Rule text.** SKILL.md step 5: anything always visible (mini-player, nav bar, cart badge) is `main`, sits on
   the first screen and never only in a state (budget 54,509 / 54,514). Known limitation, in
   `references/compose/screenshot.md`: a popup menu (`DropdownMenu`, sort menu) is not drawn by Robolectric, so
   the sort-menu popup cannot be proved visible there.
5. **Re-check of the existing outputs** (`recheck.md`; harness v3 capture and verify on the last run of each cell):
   the four skill cells still give 0 touch-target and 0 contrast findings (the rule was reverted, but their code was
   written while it applied: a fresh round would be the real test of the reverted rule; not run, as decided); the
   no-Node plant-shop cell went from 8 touch-target findings to 0; plant-shop `empty-search` now shoots the empty
   result state in both themes (recorded in `private/`). The gate item "every requested element visible" now holds
   for the plant empty result state; `sorted-price-low` is still a failed state of the r2 run (not re-shot).
