# Judged items: judge v1 and judge v2 (run `baseline-2026-11-17`)

judge v1 / rubric v1 is the judging of record published in summary.md. judge v2 / rubric v2 (`evals/rubric-v2.md`, `evals/judge-v2.md`, frozen in `evals/frozen-v2.json` after its own calibration) judged the same recorded outputs blind, side by side with paired first-party references. Flutter and Compose outputs were shown with their harness v2 screenshots; web outputs with the recorded ones. No cell was run again.

## Means by platform

| item | web v1 | web v2 | flutter v1 | flutter v2 | compose v1 | compose v2 | all v1 | all v2 |
|---|---|---|---|---|---|---|---|---|
| component-choice | 2.78 | 2.67 | 2.00 | 2.44 | 2.63 | 2.63 | 2.46 | 2.58 |
| hierarchy-typography | 2.78 | 2.44 | 2.44 | 2.33 | 3.00 | 2.75 | 2.73 | 2.50 |
| color-roles | 3.00 | 2.67 | 2.56 | 2.67 | 2.50 | 2.63 | 2.69 | 2.65 |
| shape-expressive | 3.00 | 2.67 | 2.56 | 2.56 | 2.50 | 2.63 | 2.69 | 2.62 |
| spacing-layout | 2.44 | 2.11 | 2.22 | 2.22 | 2.38 | 2.25 | 2.35 | 2.19 |
| interaction-states | 2.56 | 2.78 | 2.11 | 2.78 | 2.75 | 3.00 | 2.46 | 2.85 |
| dark-mode | 3.00 | 2.78 | 2.22 | 3.00 | 2.88 | 2.88 | 2.69 | 2.88 |
| overall-polish | 2.33 | 1.89 | 1.00 | 2.00 | 2.38 | 2.13 | 1.88 | 2.00 |

Scores of 3: v1 116 of 208, v2 117 of 208.

## Per cell (v1 → v2)

| cell | component-choice | hierarchy-typography | color-roles | shape-expressive | spacing-layout | interaction-states | dark-mode | overall-polish |
|---|---|---|---|---|---|---|---|---|
| landing.web.web-empty.default | 3 → 3 | 3 → 2 | 3 → 2 | 3 → 3 | 3 → 3 | 2 → 3 | 3 → 2 | 3 → 2 |
| landing.flutter.flutter-material_ui.default | 2 → 3 | 3 → 3 | 2 → 2 | 3 → 2 | 2 → 3 | 2 → 3 | 2 → 3 | 1 → 2 |
| landing.compose.compose-1.5.default | 2 → 3 | 3 → 3 | 2 → 2 | 3 → 3 | 2 → 2 | 2 → 3 | 2 → 2 | 2 → 2 |
| settings.web.web-react.default | 3 → 3 | 3 → 3 | 3 → 2 | 3 → 3 | 3 → 3 | 3 → 3 | 3 → 3 | 3 → 2 |
| settings.flutter.flutter-material_ui.default | 2 → 3 | 3 → 3 | 3 → 3 | 3 → 3 | 3 → 3 | 2 → 3 | 3 → 3 | 1 → 3 |
| settings.compose.compose-1.5.default | 3 → 2 | 3 → 3 | 2 → 2 | 2 → 2 | 2 → 2 | 3 → 3 | 3 → 3 | 2 → 2 |
| dashboard.web.web-react.default | 3 → 3 | 3 → 2 | 3 → 3 | 3 → 3 | 2 → 2 | 3 → 3 | 3 → 3 | 2 → 2 |
| dashboard.flutter.flutter-material_ui.default | 1 → 2 | 2 → 2 | 2 → 3 | 3 → 3 | 1 → 2 | 3 → 3 | 3 → 3 | 1 → 2 |
| dashboard.compose.compose-1.5.default | 2 → 2 | 3 → 2 | 3 → 3 | 3 → 3 | 2 → 2 | 3 → 3 | 3 → 3 | 2 → 2 |
| product-detail.web.web-empty.default | 3 → 3 | 3 → 3 | 3 → 2 | 3 → 2 | 2 → 2 | 3 → 3 | 3 → 3 | 3 → 2 |
| product-detail.flutter.flutter-material_ui.default | 2 → 2 | 1 → 2 | 2 → 2 | 2 → 2 | 2 → 2 | 2 → 3 | 2 → 3 | 1 → 2 |
| product-detail.compose.compose-1.5.default | 3 → 2 | 3 → 3 | 2 → 3 | 3 → 3 | 3 → 3 | 3 → 3 | 3 → 3 | 3 → 2 |
| onboarding.web.web-react.default | 2 → 2 | 3 → 3 | 3 → 3 | 3 → 2 | 3 → 2 | 3 → 3 | 3 → 3 | 3 → 2 |
| onboarding.flutter.flutter-material_ui.default | 2 → 2 | 2 → 2 | 3 → 2 | 2 → 2 | 2 → 2 | 2 → 2 | 2 → 3 | 1 → 2 |
| onboarding.compose.compose-1.5.default | 2 → 3 | 3 → 2 | 3 → 3 | 2 → 2 | 2 → 2 | 3 → 3 | 3 → 3 | 2 → 2 |
| empty-error.web.web-empty.default | 3 → 2 | 3 → 2 | 3 → 3 | 3 → 3 | 2 → 1 | 2 → 3 | 3 → 2 | 2 → 2 |
| empty-error.flutter.flutter-material_ui.default | 2 → 2 | 2 → 1 | 2 → 3 | 2 → 2 | 2 → 1 | 2 → 2 | 2 → 3 | 1 → 1 |
| empty-error.compose.compose-1.5.default | 3 → 3 | 3 → 3 | 2 → 2 | 2 → 3 | 2 → 2 | 2 → 3 | 3 → 3 | 2 → 2 |
| onboarding.web.web-vue.default | 2 → 3 | 3 → 3 | 3 → 3 | 3 → 2 | 3 → 2 | 2 → 3 | 3 → 3 | 2 → 2 |
| settings.flutter.flutter-legacy.default | 3 → 3 | 3 → 2 | 3 → 3 | 3 → 3 | 3 → 3 | 2 → 3 | 2 → 3 | 1 → 2 |
| settings.web.web-react.classic | 3 → 3 | 2 → 2 | 3 → 3 | 3 → 3 | 2 → 2 | 3 → 3 | 3 → 3 | 2 → 2 |
| settings.flutter.flutter-material_ui.classic | 2 → 3 | 3 → 3 | 3 → 3 | 2 → 3 | 2 → 2 | 2 → 3 | 2 → 3 | 1 → 2 |
| settings.compose.compose-1.5.classic | 3 → 3 | 3 → 3 | 3 → 3 | 3 → 3 | 3 → 2 | 3 → 3 | 3 → 3 | 3 → 2 |
| dashboard.web.web-empty.seed-B5651D | 3 → 2 | 2 → 2 | 3 → 3 | 3 → 3 | 2 → 2 | 2 → 1 | 3 → 3 | 1 → 1 |
| dashboard.flutter.flutter-material_ui.seed-B5651D | 2 → 2 | 3 → 3 | 3 → 3 | 3 → 3 | 3 → 2 | 2 → 3 | 2 → 3 | 1 → 2 |
| dashboard.compose.compose-1.5.seed-B5651D | 3 → 3 | 3 → 3 | 3 → 3 | 2 → 2 | 3 → 3 | 3 → 3 | 3 → 3 | 3 → 3 |
