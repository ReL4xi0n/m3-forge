# Interaction states re-run (web 3 cells, Flutter 3 cells)

Owner decision 2026-11-18: labelled "specimen" sections are gone (R22 reverted). The screenshot step takes a
states file (`--states`): the session writes the interaction that reaches a state (tap, type, click) and the
step performs it and shoots the state (web: Playwright or CDP clicks and typing; Flutter: a generated widget
test taps and enters text). The plan check counts a row as visible when it is on the main screen or reached
by a recorded interaction and shot. Skill at 185fba8 (+ states file in the OS temp dir). Runs
`dev-2026-11-18-webstates-r1` and `dev-2026-11-18-flutterstates-r1`; Flutter shots use harness v3 (real shadows).
All 6 cells built; verify 0 scored and 0 unscored findings; capture 0 contrast / 0 touch-target findings.

| cell | time | cost |
|---|---|---|
| podcast-player, web | 14.3 min | $2.29 |
| expense-report, web | 22.9 min | $3.47 |
| plant-shop, web | 9.2 min | $2.46 |
| podcast-player, Flutter | 9.1 min | $2.57 |
| expense-report, Flutter | 12.3 min | $3.10 |
| plant-shop, Flutter | 9.3 min | $2.46 |

Pooled judge v2 (one session, 6 outputs, main frames only): web comp 2.00, hier 2.00, color 2.33, shape 2.67,
spacing 2.00, states 2.33, dark 2.67, polish 2.00; Flutter 2.00, 2.67, 3.00, 3.00, 2.67, 2.67, 3.00, 2.00.
No score below 2. (`evals/runs/dev-states-pooled/`.)

## Requested elements that were missing before (yes/no)

| cell | element | visible | where |
|---|---|---|---|
| web podcast | mini-player | yes | state `mini-player` (library view with the mini-player docked); not on the Now-playing main screen |
| web plant | empty result state | yes | state `empty-search` ("No plants match", clear action) |
| web plant | filters (size, price) | yes | main (desktop inline); state `filters-sheet` at 412. One desktop state step failed (`#open-filters` not shown on desktop) and was reported as a warning |
| web expense | confirmation summary | yes | state `submit-confirm` (dialog: report, project, period, lines, total) |
| web expense | validation | yes | state `amount-and-date-errors` (all three rules) |
| Flutter podcast | mini-player | yes | state `mini-player` (library view, mini-player docked) |
| Flutter podcast | speed, sleep timer, queue edits | yes | main and states `speed-sheet`, `sleep-sheet`, `queue-moved-up`, `queue-removed` |
| Flutter plant | empty result state | yes | state `empty-search` |
| Flutter plant | filters, clear all | yes | chips plus "Clear all" on main; state `filter-sheet` |
| Flutter expense | confirmation summary | yes | state `submit-summary` |
| Flutter expense | optional note | yes | "Note (optional)" field now on each line, with sample notes (R27 no longer needed) |

Rest of the request elements: unchanged from the earlier tables (`dev-web/summary.md`, `dev-flutter/summary.md`);
the main screens were not changed.

Finding: the web podcast and the Flutter podcast both made the mini-player a `reached` row (a library view)
although SKILL.md says anything that stays on screen is `main`. The mini-player appears only on the library
view, which is how a mini-player works when the full player is closed, so it is shown, but the rule is only
partly followed. No change made.

Update 2026-11-18 (owner): an element that stays on screen (mini-player, nav bar, cart badge) counts as `main` in
the plan check and must be on the first screen; SKILL.md step 5 now says so. The two podcast cells above that
marked the mini-player `reached` are the case this rule closes.
