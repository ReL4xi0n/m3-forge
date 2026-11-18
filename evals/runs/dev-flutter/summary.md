# Flutter dev loop (Phase 3c, Task 22)

Dev set `evals/dev/` (not the eval set), 4 Flutter cells plus one no-Node cell, skill installed
(`/material3`), model claude-opus-5-5, isolated runs. Costs are Claude Code client estimates at list
price.

Gate (owner, 2026-11-18; spec §15): every cell builds; zero automated findings (verify scored and
unscored, runtime checks); every requested element visible in the screenshots (yes/no table); no
judge v2 score below 1. The mean-based bar moves to Phase 4.

Screenshots: the frozen harness captures one 412×915 viewport of `main.dart`. The skill's own
screenshot step (Task 21) adds frames scrolled one viewport at a time; they persist in the run's
TEMP folder. The visibility table reads both (ruling R25). Scrolling counts as visible; a tap,
dialog, route or URL does not.

## Round 1 (`dev-2026-11-18-flutter-r1`, skill b04ad5e)

| cell | build | verify scored / unscored | capture contrast / targets | judge v2 (pooled) | time | cost |
|---|---|---|---|---|---|---|
| podcast-player (material_ui, default) | ok | 0 / 0 | 0 / 0 | 2,3,3,3,2,3,3,2 | 11.1 min | $2.89 |
| expense-report (flutter-legacy, classic) | ok | 0 / 0 | 0 / 0 | 1,3,3,3,2,3,3,1 | 10.7 min | $2.80 |
| plant-shop (material_ui, seed #2F6F5E) | ok | 0 / 0 | 0 / 0 | 2,2,3,2,2,2,3,2 | 9.8 min | $2.19 |
| clinic-schedule (material_ui, default) | ok | 0 / 0 | 0 / 0 | 2,2,2,2,2,2,2,2 | 11.2 min | $2.78 |
| plant-shop, no Node | ok | **276** hardcoded-color / 0 | 0 / 0 | 2,2,2,2,2,2,2,2 | 8.5 min | $2.63 |

Judge items in order: component-choice, hierarchy-typography, color-roles, shape-expressive,
spacing-layout, interaction-states, dark-mode, overall-polish. Pooled judge v2 session $0.63;
pipeline judge v1 $0.51 + $0.32 (informational).

No-Node failure: the session wrote the precomputed scheme by hand into `lib/m3/schemes.dart`. That
file is neither the color script's exact output nor named as a theme file, so verify scanned its
276 color literals as UI code. `references/flutter/` had no "Without Node" section.

## Round 2 (no-Node cell only, `dev-2026-11-18-flutternonode-r2`, skill 7fd82e7)

Change: a Flutter no-Node recipe in `references/flutter/setup.md` (copy the assets, apply the
library rewrite by hand, write `lib/m3/color_schemes.dart` from the precomputed scheme). The four
skill cells met every gate item in round 1, so only the failing cell ran again (ruling R26).

| cell | build | verify scored / unscored | judge v2 | time | cost |
|---|---|---|---|---|---|
| plant-shop, no Node | ok | 0 / 0 | 2,2,2,2,2,2,2,2 | 10.7 min | $2.88 |

The session found no runtime, used the nearest precomputed seed `#537F74` for `#2F6F5E` and said
so, copied the assets by hand and skipped verify, icons subsetting and screenshots. The run's
screenshot frames were made afterwards by the controller with the skill's step on a copy of the
project (the recorded snapshot omits the shipped font and token files, which were restored from
the skill's assets). Pooled judge v2 $0.34; pipeline judge v1 $0.32.

## Requested elements visible (yes/no)

| cell | element | visible | where |
|---|---|---|---|
| podcast | cover placeholder, show name, episode title | yes | top (library shape cover) |
| podcast | seek bar, elapsed and remaining time | yes | under the title |
| podcast | play/pause, back 15 s, forward 30 s | yes | controls row |
| podcast | playback speed 0.8x-2x | yes | Playback panel: presets and slider |
| podcast | sleep timer 15/30/60, end of episode | yes | frame 2 |
| podcast | Up next: six episodes, title, show, length, download state | yes | frames 2-3, all three states |
| podcast | remove, move up | yes | per row |
| podcast | mini-player | yes | labelled specimen, frame 3 |
| expense | title, project code list, date range | yes | Report details |
| expense | line items: date, category, merchant, amount, currency | yes | rows; line 7 expanded |
| expense | optional note | **partly** | "Add note" button per line; the field opens on tap (ruling R27) |
| expense | add, duplicate, delete | yes | Add line; line 7 actions |
| expense | receipt preview, replace, remove | yes | line 7 |
| expense | subtotals per category, EUR total, conversion | yes | Totals; rate on the GBP line |
| expense | validation (dates, amounts, receipts over 25 EUR) | yes | inline errors and "Before you submit" |
| expense | save draft, submit for approval | yes | bottom bar |
| expense | confirmation summary | yes | labelled specimen, frames 3-4 |
| plant | search, cart with badge | yes | top |
| plant | filters: light, pet safety, size, price to 80 EUR | yes | chip row (Light, Pet-safe, Size, Up to €80) |
| plant | clear all, matching count | yes | "Clear all", "14 plants match" |
| plant | sort | yes | "Popular" |
| plant | grid of 12+ with placeholder, name, price, light, add | yes | 14 plants |
| plant | out of stock, only 2 left | yes | badges |
| plant | empty result state | yes | labelled specimen, frame 4 |
| clinic | the day's appointments, who is coming, statuses | yes | stats row, Morning/Afternoon lists, status chips |
| clinic | moving people around | yes | move sheet and undo snackbar specimens, frames 3-4 |
| plant, no Node (r2) | search, cart badge, count, sort, grid, stock badges | yes | frames 1-3 |
| plant, no Node (r2) | filters | **partly** | Pet-safe and light chips; size and price inside "All filters" (sheet) |
| plant, no Node (r2) | clear all | **partly** | "Clear filters" in the empty specimen; "Clear all" in the sheet |
| plant, no Node (r2) | empty result state | yes | labelled specimen, frame 4 |

## Gate

- Builds: all. Automated findings: zero in every cell's final run (round 1 skill cells, round 2
  no-Node). No judge v2 score below 1 (lowest: 1 on expense component-choice and polish; the judge
  sees only the harness viewport, where most of the requested items are below the fold).
- Visibility: every element visible except three partial rows (expense optional note; no-Node
  size/price filters and clear-all inside the filters sheet on a phone, as the checklist's compact
  rule puts them). The gate is met only if the owner accepts those rows.

## Findings for the owner

- The frozen Flutter harness renders elevation as solid black outlines (`flutter_test` keeps
  `debugDisableShadows` on); FABs and search bars show a thick black ring in judged shots, and the
  judge marked it down on four items in clinic and plant. The skill's own screenshot step now turns
  it off; the harness needs an owner decision (a new measurement version) before Phase 4.
- MCU 2025 tonal-spot `tertiaryContainer` uses the same vivid tone in light and dark (as
  `errorContainer` does in light); placeholders and avatars already avoid tertiary.
