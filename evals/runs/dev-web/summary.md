# Web dev loop (Phase 3b, Task 16)

Dev set `evals/dev/` (not the eval set), 4 web cells, skill installed (`/material3`), model
claude-opus-5-5, isolated runs. Scores: verify v2 (scored + unscored checks) and judge v2 (blind,
frozen `evals/frozen-v2.json`). Costs are Claude Code client estimates at list price.

Gate per platform: every cell builds; zero scored and unscored verify findings; judge v2 mean
>= 2.5 per item and no score below 2. At most 3 rounds.

## Judge v2 per cell and round

Items: component-choice, hierarchy-typography, color-roles, shape-expressive, spacing-layout,
interaction-states, dark-mode, overall-polish.

| cell | round 1 | round 2 | round 3 |
|---|---|---|---|
| podcast-player (web-empty, default) | 1,3,2,3,2,2,2,1 | 1,2,2,2,2,3,3,1 | 2,2,3,3,2,3,3,2 |
| expense-report (web-react, seed #2F6F5E) | 1,1,2,2,1,2,2,1 | 2,3,2,2,2,3,2,2 | 2,2,2,2,2,2,2,2 |
| plant-shop (web-vue, classic) | 2,2,2,2,2,2,2,2 | 2,2,2,2,2,2,3,2 | 2,2,2,2,2,2,2,2 |
| clinic-schedule (web-empty, default) | 2,2,2,2,2,3,2,2 | 2,2,2,2,2,3,3,2 | 3,2,2,2,2,3,3,2 |

Round 3 means: component-choice 2.25, hierarchy-typography 2.00, color-roles 2.25,
shape-expressive 2.25, spacing-layout 2.00, interaction-states 2.50, dark-mode 2.50,
overall-polish 2.00. No score below 2. Gate not met (means below 2.5 on six items).

No-Node cell (podcast-player, round 3 skill): 2,2,2,3,2,2,3,2. The session found Bun on the PATH
and ran the skill's scripts with it, so the no-Node fallback path itself was not exercised.

## Verify

All cells in all rounds: 0 scored findings (hardcoded color, off-token type and radius, off-grid
spacing, shadow/gradient, icon source, foreign styling, contrast, touch targets) and 0 unscored
findings (placeholder content, brand, unknown icon, unused asset, icon-button label). Every cell
built and was captured (4 screenshots each).

## Time and cost per cell

| cell | round 1 | round 2 | round 3 |
|---|---|---|---|
| podcast-player | 8.1 min, $2.50 | 9.4 min, $2.24 | 8.5 min, $2.44 |
| expense-report | 9.7 min, $2.63 | 14.5 min, $3.30 | 18.8 min, $2.73 |
| plant-shop | 5.6 min, $1.63 | 7.9 min, $1.97 | 8.5 min, $2.41 |
| clinic-schedule | 13.4 min, $3.58 | 8.4 min, $2.34 | 8.1 min, $2.55 |

## What changed between rounds

- After round 1: the subset icon font ended off a 4-byte boundary and Chromium rejected it (icons
  showed as their names); the screenshot step skipped without Playwright, so the model never saw
  its render (now falls back to an installed Chrome or Edge); checklist recipes for visible
  requested parts, no overlaps, one action per view, theme-aware placeholders.
- After round 2: the report must list every requested item and where it is visible, and every
  problem found in the screenshots with its fix; layout and accent recipes; native controls follow
  the theme (`color-scheme`); classic M3 scoping for Expressive-only component styles.
