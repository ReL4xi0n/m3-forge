# Automated items: v1 and v2 (run `baseline-2026-11-17`)

v1 is rubric v1's automated table with harness v1, as published in summary.md. v2 is `evals/automated-v2.md` with harness v2: icon source is its own item, Flutter touch targets have the web and Compose scope, the Flutter harness loads the app's fonts, and the Compose harness captures with reduced motion. The recorded code was scored again (Flutter and Compose captured again from it); no cell was run again.

## Means by platform

| item | web v1 | web v2 | flutter v1 | flutter v2 | compose v1 | compose v2 | all v1 | all v2 |
|---|---|---|---|---|---|---|---|---|
| token-fidelity | 0.78 | 0.78 | 2.11 | 2.11 | 2.00 | 2.00 | 1.62 | 1.62 |
| contrast-targets | 0.78 | 0.78 | 2.78 | 2.78 | 0.88 | 0.88 | 1.50 | 1.50 |
| anti-patterns | 1.00 | 1.00 | 0.00 | 2.44 | 2.38 | 2.38 | 1.08 | 1.92 |
| icon-source | — | 0.22 | — | 0.00 | — | 0.00 | — | 0.08 |

## Per cell

| cell | token-fidelity v1 | token-fidelity v2 | contrast-targets v1 | contrast-targets v2 | anti-patterns v1 | anti-patterns v2 | icon-source v1 | icon-source v2 | touch targets v1 | touch targets v2 |
|---|---|---|---|---|---|---|---|---|---|---|
| landing.web.web-empty.default | 0 | 0 | 1 | 1 | 0 | 0 | — | 1 | 3 | 3 |
| landing.flutter.flutter-material_ui.default | 2 | 2 | 3 | 3 | 0 | 1 | — | 0 | 0 | 0 |
| landing.compose.compose-1.5.default | 2 | 2 | 2 | 2 | 1 | 1 | — | 0 | 2 | 2 |
| settings.web.web-react.default | 1 | 1 | 1 | 1 | 1 | 1 | — | 0 | 5 | 5 |
| settings.flutter.flutter-material_ui.default | 2 | 2 | 3 | 3 | 0 | 3 | — | 0 | 0 | 0 |
| settings.compose.compose-1.5.default | 2 | 2 | 0 | 0 | 3 | 3 | — | 0 | 10 | 10 |
| dashboard.web.web-react.default | 1 | 1 | 0 | 0 | 2 | 2 | — | 0 | 18 | 18 |
| dashboard.flutter.flutter-material_ui.default | 2 | 2 | 3 | 3 | 0 | 2 | — | 0 | 0 | 0 |
| dashboard.compose.compose-1.5.default | 2 | 2 | 0 | 0 | 2 | 2 | — | 0 | 12 | 12 |
| product-detail.web.web-empty.default | 0 | 0 | 0 | 0 | 0 | 0 | — | 0 | 21 | 21 |
| product-detail.flutter.flutter-material_ui.default | 2 | 2 | 2 | 2 | 0 | 2 | — | 0 | 0 | 0 |
| product-detail.compose.compose-1.5.default | 2 | 2 | 0 | 0 | 3 | 3 | — | 0 | 24 | 24 |
| onboarding.web.web-react.default | 1 | 1 | 1 | 1 | 0 | 0 | — | 0 | 4 | 4 |
| onboarding.flutter.flutter-material_ui.default | 3 | 3 | 2 | 2 | 0 | 3 | — | 0 | 0 | 0 |
| onboarding.compose.compose-1.5.default | 2 | 2 | 1 | 1 | 3 | 3 | — | 0 | 4 | 4 |
| empty-error.web.web-empty.default | 1 | 1 | 0 | 0 | 1 | 1 | — | 0 | 9 | 9 |
| empty-error.flutter.flutter-material_ui.default | 2 | 2 | 3 | 3 | 0 | 3 | — | 0 | 0 | 0 |
| empty-error.compose.compose-1.5.default | 2 | 2 | 0 | 0 | 2 | 2 | — | 0 | 12 | 12 |
| onboarding.web.web-vue.default | 1 | 1 | 1 | 1 | 1 | 1 | — | 1 | 3 | 3 |
| settings.flutter.flutter-legacy.default | 2 | 2 | 3 | 3 | 0 | 3 | — | 0 | 0 | 0 |
| settings.web.web-react.classic | 1 | 1 | 3 | 3 | 3 | 3 | — | 0 | 0 | 0 |
| settings.flutter.flutter-material_ui.classic | 2 | 2 | 3 | 3 | 0 | 3 | — | 0 | 0 | 0 |
| settings.compose.compose-1.5.classic | 2 | 2 | 2 | 2 | 3 | 3 | — | 0 | 2 | 2 |
| dashboard.web.web-empty.seed-B5651D | 1 | 1 | 0 | 0 | 1 | 1 | — | 0 | 8 | 8 |
| dashboard.flutter.flutter-material_ui.seed-B5651D | 2 | 2 | 3 | 3 | 0 | 2 | — | 0 | 0 | 0 |
| dashboard.compose.compose-1.5.seed-B5651D | 2 | 2 | 2 | 2 | 2 | 2 | — | 0 | 2 | 2 |
