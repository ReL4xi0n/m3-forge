# Flutter harness v3: baseline Flutter cells, old and new capture (run `baseline-2026-11-17`)

Harness v2 drew every elevation shadow as a solid black outline (flutter_test keeps `debugDisableShadows` on). Harness v3 (`harness/flutter/capture_test.dart`) paints real shadows; v2 stays in `capture_test.v2.dart` to reproduce the old numbers. The recorded code of the 9 baseline Flutter cells was captured again with v3 (no cell was run again). The 9 v2 and 9 v3 screenshot sets were anonymized together and scored in ONE fresh judge v2 session (frozen rubric v2, anchors, prompt), so both face the same judge. Items: component-choice, hierarchy-typography, color-roles, shape-expressive, spacing-layout, interaction-states, dark-mode, overall-polish.

## Means (9 Flutter cells)

| capture | component-choice | hierarchy-typography | color-roles | shape-expressive | spacing-layout | interaction-states | dark-mode | overall-polish |
|---|---|---|---|---|---|---|---|---|
| harness v2 | 2.78 | 2.78 | 2.33 | 2.78 | 2.56 | 2.89 | 2.89 | 2.00 |
| harness v3 | 2.56 | 2.33 | 2.33 | 2.67 | 2.44 | 2.89 | 2.89 | 2.00 |

## Per cell (v2 → v3)

| cell | component-choice | hierarchy-typography | color-roles | shape-expressive | spacing-layout | interaction-states | dark-mode | overall-polish |
|---|---|---|---|---|---|---|---|---|
| landing.flutter.flutter-material_ui.default | 3 → 2 | 3 → 2 | 2 → 2 | 3 → 2 | 3 → 2 | 3 → 3 | 3 → 3 | 2 → 2 |
| settings.flutter.flutter-material_ui.default | 3 → 3 | 3 → 3 | 3 → 3 | 3 → 3 | 3 → 3 | 3 → 3 | 3 → 3 | 3 → 3 |
| dashboard.flutter.flutter-material_ui.default | 3 → 2 | 3 → 2 | 2 → 2 | 3 → 3 | 2 → 2 | 3 → 3 | 3 → 3 | 2 → 2 |
| product-detail.flutter.flutter-material_ui.default | 3 → 2 | 3 → 2 | 2 → 2 | 3 → 2 | 2 → 2 | 3 → 3 | 3 → 2 | 1 → 1 |
| onboarding.flutter.flutter-material_ui.default | 2 → 2 | 3 → 2 | 3 → 2 | 2 → 2 | 2 → 2 | 3 → 2 | 3 → 3 | 2 → 2 |
| empty-error.flutter.flutter-material_ui.default | 2 → 3 | 2 → 2 | 2 → 3 | 2 → 3 | 2 → 2 | 2 → 3 | 2 → 3 | 1 → 1 |
| settings.flutter.flutter-legacy.default | 3 → 3 | 2 → 2 | 2 → 2 | 3 → 3 | 3 → 3 | 3 → 3 | 3 → 3 | 2 → 2 |
| settings.flutter.flutter-material_ui.classic | 3 → 3 | 3 → 3 | 3 → 3 | 3 → 3 | 3 → 3 | 3 → 3 | 3 → 3 | 3 → 3 |
| dashboard.flutter.flutter-material_ui.seed-B5651D | 3 → 3 | 3 → 3 | 2 → 2 | 3 → 3 | 3 → 3 | 3 → 3 | 3 → 3 | 2 → 2 |

## Automated items v2 (same code, v2 → v3 capture)

| cell | token-fidelity | contrast-targets | anti-patterns | icon-source |
|---|---|---|---|---|
| landing.flutter.flutter-material_ui.default | 2 → 2 | 3 → 3 | 1 → 1 | 0 → 0 |
| settings.flutter.flutter-material_ui.default | 2 → 2 | 3 → 3 | 3 → 3 | 0 → 0 |
| dashboard.flutter.flutter-material_ui.default | 2 → 2 | 3 → 3 | 2 → 2 | 0 → 0 |
| product-detail.flutter.flutter-material_ui.default | 2 → 2 | 2 → 2 | 2 → 2 | 0 → 0 |
| onboarding.flutter.flutter-material_ui.default | 3 → 3 | 2 → 2 | 3 → 3 | 0 → 0 |
| empty-error.flutter.flutter-material_ui.default | 2 → 2 | 3 → 3 | 3 → 3 | 0 → 0 |
| settings.flutter.flutter-legacy.default | 2 → 2 | 3 → 3 | 3 → 3 | 0 → 0 |
| settings.flutter.flutter-material_ui.classic | 2 → 2 | 3 → 3 | 3 → 3 | 0 → 0 |
| dashboard.flutter.flutter-material_ui.seed-B5651D | 2 → 2 | 3 → 3 | 2 → 2 | 0 → 0 |
