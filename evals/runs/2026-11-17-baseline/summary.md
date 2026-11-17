# Baseline 2026-11-17 (no skill)

Run `baseline-2026-11-17`: 26 cells, 199.4 model minutes, 53.8 capture minutes, about $41.05 (costUsd is the Claude Code client estimate at API list price for a subscription OAuth session, not a bill.)

- Model claude-opus-5-5, Claude Code 2.1.322, no skill installed; rubric v1 and judge v1 frozen at adf8854 (2026-11-16T23:19:00+03:00).
- Concurrency set by the owner: web and Flutter cells two at a time, Compose cells one at a time.
- Judging of record: one --judge-only pass after a harness fix. landing.flutter and dashboard.flutter (default) were recaptured: the Flutter harness ran both themes in one process, and an endless animation failed the dark test. The pipeline's own end-of-run judging is superseded and not used.

## Scores by item and platform

Mean score per item (0–3). Automated items come from verify v1; the others from judge v1. A cell with no screenshots scores 0 on judged items.

| item | web | flutter | compose | all |
|---|---|---|---|---|
| token-fidelity | 0.78 | 2.11 | 2.00 | 1.62 |
| contrast-targets | 0.78 | 2.78 | 0.88 | 1.50 |
| anti-patterns | 1.00 | 0.00 | 2.38 | 1.08 |
| component-choice | 2.78 | 2.00 | 2.63 | 2.46 |
| hierarchy-typography | 2.78 | 2.44 | 3.00 | 2.73 |
| color-roles | 3.00 | 2.56 | 2.50 | 2.69 |
| shape-expressive | 3.00 | 2.56 | 2.50 | 2.69 |
| spacing-layout | 2.44 | 2.22 | 2.38 | 2.35 |
| interaction-states | 2.56 | 2.11 | 2.75 | 2.46 |
| dark-mode | 3.00 | 2.22 | 2.88 | 2.69 |
| overall-polish | 2.33 | 1.00 | 2.38 | 1.88 |

### Per cell

| cell | token-fidelity | contrast-targets | anti-patterns | component-choice | hierarchy-typography | color-roles | shape-expressive | spacing-layout | interaction-states | dark-mode | overall-polish | build | notes |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| landing.web.web-empty.default | 0 | 1 | 0 | 3 | 3 | 3 | 3 | 3 | 2 | 3 | 3 | ok |  |
| landing.flutter.flutter-material_ui.default | 2 | 3 | 0 | 2 | 3 | 2 | 3 | 2 | 2 | 2 | 1 | ok | recaptured |
| landing.compose.compose-1.5.default | 2 | 2 | 1 | 2 | 3 | 2 | 3 | 2 | 2 | 2 | 2 | ok |  |
| settings.web.web-react.default | 1 | 1 | 1 | 3 | 3 | 3 | 3 | 3 | 3 | 3 | 3 | ok |  |
| settings.flutter.flutter-material_ui.default | 2 | 3 | 0 | 2 | 3 | 3 | 3 | 3 | 2 | 3 | 1 | ok |  |
| settings.compose.compose-1.5.default | 2 | 0 | 3 | 3 | 3 | 2 | 2 | 2 | 3 | 3 | 2 | ok |  |
| dashboard.web.web-react.default | 1 | 0 | 2 | 3 | 3 | 3 | 3 | 2 | 3 | 3 | 2 | ok |  |
| dashboard.flutter.flutter-material_ui.default | 2 | 3 | 0 | 1 | 2 | 2 | 3 | 1 | 3 | 3 | 1 | ok | recaptured |
| dashboard.compose.compose-1.5.default | 2 | 0 | 2 | 2 | 3 | 3 | 3 | 2 | 3 | 3 | 2 | ok |  |
| product-detail.web.web-empty.default | 0 | 0 | 0 | 3 | 3 | 3 | 3 | 2 | 3 | 3 | 3 | ok |  |
| product-detail.flutter.flutter-material_ui.default | 2 | 2 | 0 | 2 | 1 | 2 | 2 | 2 | 2 | 2 | 1 | ok |  |
| product-detail.compose.compose-1.5.default | 2 | 0 | 3 | 3 | 3 | 2 | 3 | 3 | 3 | 3 | 3 | ok |  |
| onboarding.web.web-react.default | 1 | 1 | 0 | 2 | 3 | 3 | 3 | 3 | 3 | 3 | 3 | ok |  |
| onboarding.flutter.flutter-material_ui.default | 3 | 2 | 0 | 2 | 2 | 3 | 2 | 2 | 2 | 2 | 1 | ok |  |
| onboarding.compose.compose-1.5.default | 2 | 1 | 3 | 2 | 3 | 3 | 2 | 2 | 3 | 3 | 2 | ok |  |
| empty-error.web.web-empty.default | 1 | 0 | 1 | 3 | 3 | 3 | 3 | 2 | 2 | 3 | 2 | ok |  |
| empty-error.flutter.flutter-material_ui.default | 2 | 3 | 0 | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 1 | ok |  |
| empty-error.compose.compose-1.5.default | 2 | 0 | 2 | 3 | 3 | 2 | 2 | 2 | 2 | 3 | 2 | ok |  |
| onboarding.web.web-vue.default | 1 | 1 | 1 | 2 | 3 | 3 | 3 | 3 | 2 | 3 | 2 | ok |  |
| settings.flutter.flutter-legacy.default | 2 | 3 | 0 | 3 | 3 | 3 | 3 | 3 | 2 | 2 | 1 | ok |  |
| settings.web.web-react.classic | 1 | 3 | 3 | 3 | 2 | 3 | 3 | 2 | 3 | 3 | 2 | ok |  |
| settings.flutter.flutter-material_ui.classic | 2 | 3 | 0 | 2 | 3 | 3 | 2 | 2 | 2 | 2 | 1 | ok |  |
| settings.compose.compose-1.5.classic | 2 | 2 | 3 | 3 | 3 | 3 | 3 | 3 | 3 | 3 | 3 | ok |  |
| dashboard.web.web-empty.seed-B5651D | 1 | 0 | 1 | 3 | 2 | 3 | 3 | 2 | 2 | 3 | 1 | ok |  |
| dashboard.flutter.flutter-material_ui.seed-B5651D | 2 | 3 | 0 | 2 | 3 | 3 | 3 | 3 | 2 | 2 | 1 | ok |  |
| dashboard.compose.compose-1.5.seed-B5651D | 2 | 2 | 2 | 3 | 3 | 3 | 2 | 3 | 3 | 3 | 3 | ok |  |

## Automated violation counts

| cell | ui lines | hardcoded-color | off-token-type | off-token-radius | off-grid-spacing | shadow-gradient | icon-source | foreign-styling | contrast | touch-target |
|---|---|---|---|---|---|---|---|---|---|---|
| landing.web.web-empty.default | 1347 | 5 | 63 | 2 | 12 | 5 | 0 | 0 | 0 | 3 |
| landing.flutter.flutter-material_ui.default | 1786 | 0 | 0 | 2 | 9 | 2 | 17 | 0 | 0 | 0 |
| landing.compose.compose-1.5.default | 1649 | 2 | 5 | 3 | 12 | 2 | 0 | 0 | 0 | 2 |
| settings.web.web-react.default | 1226 | 2 | 25 | 1 | 3 | 3 | 0 | 0 | 0 | 5 |
| settings.flutter.flutter-material_ui.default | 691 | 1 | 0 | 2 | 3 | 0 | 26 | 0 | 0 | 0 |
| settings.compose.compose-1.5.default | 772 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 10 |
| dashboard.web.web-react.default | 2037 | 0 | 60 | 3 | 11 | 1 | 0 | 0 | 0 | 18 |
| dashboard.flutter.flutter-material_ui.default | 1464 | 4 | 0 | 2 | 6 | 1 | 24 | 0 | 0 | 0 |
| dashboard.compose.compose-1.5.default | 1214 | 2 | 0 | 1 | 4 | 1 | 0 | 0 | 0 | 12 |
| product-detail.web.web-empty.default | 1708 | 13 | 72 | 2 | 11 | 11 | 0 | 0 | 0 | 21 |
| product-detail.flutter.flutter-material_ui.default | 2093 | 9 | 1 | 5 | 19 | 1 | 36 | 0 | 1 | 0 |
| product-detail.compose.compose-1.5.default | 1123 | 10 | 0 | 0 | 8 | 0 | 0 | 0 | 0 | 24 |
| onboarding.web.web-react.default | 2619 | 1 | 46 | 5 | 12 | 8 | 0 | 0 | 0 | 4 |
| onboarding.flutter.flutter-material_ui.default | 1205 | 0 | 0 | 0 | 6 | 0 | 26 | 0 | 1 | 0 |
| onboarding.compose.compose-1.5.default | 1510 | 1 | 0 | 0 | 4 | 0 | 0 | 0 | 0 | 4 |
| empty-error.web.web-empty.default | 889 | 1 | 24 | 2 | 14 | 3 | 1 | 0 | 0 | 9 |
| empty-error.flutter.flutter-material_ui.default | 1232 | 1 | 1 | 0 | 9 | 0 | 25 | 0 | 0 | 0 |
| empty-error.compose.compose-1.5.default | 830 | 1 | 0 | 1 | 2 | 1 | 0 | 0 | 0 | 12 |
| onboarding.web.web-vue.default | 2714 | 0 | 36 | 2 | 9 | 4 | 0 | 0 | 0 | 3 |
| settings.flutter.flutter-legacy.default | 718 | 0 | 1 | 1 | 6 | 0 | 28 | 0 | 0 | 0 |
| settings.web.web-react.classic | 1358 | 1 | 22 | 0 | 2 | 0 | 0 | 0 | 0 | 0 |
| settings.flutter.flutter-material_ui.classic | 420 | 1 | 0 | 0 | 0 | 0 | 24 | 0 | 0 | 0 |
| settings.compose.compose-1.5.classic | 600 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 2 |
| dashboard.web.web-empty.seed-B5651D | 1536 | 0 | 14 | 3 | 10 | 3 | 0 | 0 | 1 | 8 |
| dashboard.flutter.flutter-material_ui.seed-B5651D | 1485 | 1 | 0 | 2 | 8 | 1 | 25 | 0 | 0 | 0 |
| dashboard.compose.compose-1.5.seed-B5651D | 1062 | 2 | 0 | 1 | 7 | 1 | 0 | 0 | 0 | 2 |

## Failure catalogue

Failure types by the number of cells they occur in. Instances count violations for verify types and cells otherwise.

| failure type | cells | instances | example cells |
|---|---|---|---|
| verify: off-grid-spacing | 23 | 187 | landing.web.web-empty.default, landing.flutter.flutter-material_ui.default, landing.compose.compose-1.5.default |
| verify: hardcoded-color | 20 | 60 | landing.web.web-empty.default, landing.compose.compose-1.5.default, settings.web.web-react.default |
| verify: off-token-radius | 18 | 40 | landing.web.web-empty.default, landing.flutter.flutter-material_ui.default, landing.compose.compose-1.5.default |
| verify: shadow-gradient | 16 | 48 | landing.web.web-empty.default, landing.flutter.flutter-material_ui.default, landing.compose.compose-1.5.default |
| verify: touch-target | 16 | 139 | landing.web.web-empty.default, landing.compose.compose-1.5.default, settings.web.web-react.default |
| verify: off-token-type | 13 | 370 | landing.web.web-empty.default, landing.compose.compose-1.5.default, settings.web.web-react.default |
| judged ≤1: overall-polish | 10 | 10 | landing.flutter.flutter-material_ui.default, settings.flutter.flutter-material_ui.default, dashboard.flutter.flutter-material_ui.default |
| verify: icon-source | 10 | 232 | landing.flutter.flutter-material_ui.default, settings.flutter.flutter-material_ui.default, dashboard.flutter.flutter-material_ui.default |
| verify: contrast | 3 | 3 | product-detail.flutter.flutter-material_ui.default, onboarding.flutter.flutter-material_ui.default, dashboard.web.web-empty.seed-B5651D |
| judged ≤1: component-choice | 1 | 1 | dashboard.flutter.flutter-material_ui.default |
| judged ≤1: hierarchy-typography | 1 | 1 | product-detail.flutter.flutter-material_ui.default |
| judged ≤1: spacing-layout | 1 | 1 | dashboard.flutter.flutter-material_ui.default |

## Isolation

Canaries: 5 of 5 passed. Cell runs: init check 26/26, transcript audit 26/26, preflight 26/26. Warnings are paths outside the work folder (listed privately).

| cell | init | audit | preflight | warnings |
|---|---|---|---|---|
| landing.web.web-empty.default | true | true | true | 24 |
| landing.flutter.flutter-material_ui.default | true | true | true | 43 |
| landing.compose.compose-1.5.default | true | true | true | 30 |
| settings.web.web-react.default | true | true | true | 38 |
| settings.flutter.flutter-material_ui.default | true | true | true | 26 |
| settings.compose.compose-1.5.default | true | true | true | 11 |
| dashboard.web.web-react.default | true | true | true | 48 |
| dashboard.flutter.flutter-material_ui.default | true | true | true | 40 |
| dashboard.compose.compose-1.5.default | true | true | true | 4 |
| product-detail.web.web-empty.default | true | true | true | 26 |
| product-detail.flutter.flutter-material_ui.default | true | true | true | 32 |
| product-detail.compose.compose-1.5.default | true | true | true | 6 |
| onboarding.web.web-react.default | true | true | true | 90 |
| onboarding.flutter.flutter-material_ui.default | true | true | true | 53 |
| onboarding.compose.compose-1.5.default | true | true | true | 11 |
| empty-error.web.web-empty.default | true | true | true | 26 |
| empty-error.flutter.flutter-material_ui.default | true | true | true | 37 |
| empty-error.compose.compose-1.5.default | true | true | true | 8 |
| onboarding.web.web-vue.default | true | true | true | 58 |
| settings.flutter.flutter-legacy.default | true | true | true | 41 |
| settings.web.web-react.classic | true | true | true | 37 |
| settings.flutter.flutter-material_ui.classic | true | true | true | 25 |
| settings.compose.compose-1.5.classic | true | true | true | 5 |
| dashboard.web.web-empty.seed-B5651D | true | true | true | 20 |
| dashboard.flutter.flutter-material_ui.seed-B5651D | true | true | true | 38 |
| dashboard.compose.compose-1.5.seed-B5651D | true | true | true | 11 |
