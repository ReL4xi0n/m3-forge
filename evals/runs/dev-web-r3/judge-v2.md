# Judged items: judge v1 and judge v2 (run `dev-2026-11-18-web-r3`)

judge v1 / rubric v1 is the judging of record published in summary.md. judge v2 / rubric v2 (`evals/rubric-v2.md`, `evals/judge-v2.md`, frozen in `evals/frozen-v2.json` after its own calibration) judged the same recorded outputs blind, side by side with paired first-party references. Flutter and Compose outputs were shown with their harness v2 screenshots; web outputs with the recorded ones. No cell was run again.

## Means by platform

| item | web v1 | web v2 | all v1 | all v2 |
|---|---|---|---|---|
| component-choice | 2.00 | 2.25 | 2.00 | 2.25 |
| hierarchy-typography | 2.50 | 2.00 | 2.50 | 2.00 |
| color-roles | 2.50 | 2.25 | 2.50 | 2.25 |
| shape-expressive | 2.50 | 2.25 | 2.50 | 2.25 |
| spacing-layout | 2.00 | 2.00 | 2.00 | 2.00 |
| interaction-states | 3.00 | 2.50 | 3.00 | 2.50 |
| dark-mode | 3.00 | 2.50 | 3.00 | 2.50 |
| overall-polish | 2.00 | 2.00 | 2.00 | 2.00 |

Scores of 3: v1 14 of 32, v2 7 of 32.

## Per cell (v1 → v2)

| cell | component-choice | hierarchy-typography | color-roles | shape-expressive | spacing-layout | interaction-states | dark-mode | overall-polish |
|---|---|---|---|---|---|---|---|---|
| podcast-player.web.web-empty.default | 2 → 2 | 3 → 2 | 3 → 3 | 3 → 3 | 2 → 2 | 3 → 3 | 3 → 3 | 2 → 2 |
| expense-report.web.web-react.seed-2F6F5E | 2 → 2 | 2 → 2 | 2 → 2 | 2 → 2 | 2 → 2 | 3 → 2 | 3 → 2 | 2 → 2 |
| plant-shop.web.web-vue.classic | 2 → 2 | 2 → 2 | 3 → 2 | 3 → 2 | 2 → 2 | 3 → 2 | 3 → 2 | 2 → 2 |
| clinic-schedule.web.web-empty.default | 2 → 3 | 3 → 2 | 2 → 2 | 2 → 2 | 2 → 2 | 3 → 3 | 3 → 3 | 2 → 2 |
