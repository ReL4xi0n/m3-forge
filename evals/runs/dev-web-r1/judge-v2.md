# Judged items: judge v1 and judge v2 (run `dev-2026-11-18-web-r1`)

judge v1 / rubric v1 is the judging of record published in summary.md. judge v2 / rubric v2 (`evals/rubric-v2.md`, `evals/judge-v2.md`, frozen in `evals/frozen-v2.json` after its own calibration) judged the same recorded outputs blind, side by side with paired first-party references. Flutter and Compose outputs were shown with their harness v2 screenshots; web outputs with the recorded ones. No cell was run again.

## Means by platform

| item | web v1 | web v2 | all v1 | all v2 |
|---|---|---|---|---|
| component-choice | 2.00 | 1.50 | 2.00 | 1.50 |
| hierarchy-typography | 1.75 | 2.00 | 1.75 | 2.00 |
| color-roles | 2.00 | 2.00 | 2.00 | 2.00 |
| shape-expressive | 2.50 | 2.25 | 2.50 | 2.25 |
| spacing-layout | 1.50 | 1.75 | 1.50 | 1.75 |
| interaction-states | 2.00 | 2.25 | 2.00 | 2.25 |
| dark-mode | 2.00 | 2.00 | 2.00 | 2.00 |
| overall-polish | 1.25 | 1.50 | 1.25 | 1.50 |

Scores of 3: v1 2 of 32, v2 3 of 32.

## Per cell (v1 → v2)

| cell | component-choice | hierarchy-typography | color-roles | shape-expressive | spacing-layout | interaction-states | dark-mode | overall-polish |
|---|---|---|---|---|---|---|---|---|
| podcast-player.web.web-empty.default | 2 → 1 | 2 → 3 | 2 → 2 | 3 → 3 | 2 → 2 | 2 → 2 | 2 → 2 | 1 → 1 |
| expense-report.web.web-react.seed-2F6F5E | 2 → 1 | 1 → 1 | 2 → 2 | 2 → 2 | 1 → 1 | 2 → 2 | 2 → 2 | 0 → 1 |
| plant-shop.web.web-vue.classic | 2 → 2 | 2 → 2 | 2 → 2 | 3 → 2 | 2 → 2 | 2 → 2 | 2 → 2 | 2 → 2 |
| clinic-schedule.web.web-empty.default | 2 → 2 | 2 → 2 | 2 → 2 | 2 → 2 | 1 → 2 | 2 → 3 | 2 → 2 | 2 → 2 |
