# Compose harness v3: baseline Compose cells, old and new touch-target measurement (run `baseline-2026-11-17`)

Harness v2 measured the layout size of every clickable, so each official 40 dp button and 32 dp chip was a touch-target finding. Harness v3 (`harness/compose/`, `-Pm3.targets=touch`) measures the touch target with the padding `minimumInteractiveComponentSize()` adds around it; a bare clickable below 48 dp is still reported. v2 stays selectable (`version: "v2"`) to reproduce the old numbers. The recorded code of the 8 baseline Compose cells was captured again with v3 (no cell was run again) and scored again with the frozen automated items v2.

The v3 screenshots are byte-identical to the earlier ones in 8/8 cells (SHA-256 per picture). The measurement does not touch the picture, so the judge v2 scores (all visual items) of an identical picture cannot change; the judge was not run again. Only the automated item contrast-targets depends on the measurement.

## Means (8 Compose cells)

| harness | contrast-targets | token-fidelity | anti-patterns | icon-source | touch-target findings |
|---|---|---|---|---|---|
| compose v2 | 0.88 | 2.00 | 2.38 | 0.00 | 68 |
| compose v3 | 2.88 | 2.00 | 2.38 | 0.00 | 2 |

## Per cell (v2 → v3)

| cell | contrast-targets | touch-target findings | contrast findings | pictures identical |
|---|---|---|---|---|
| landing.compose.compose-1.5.default | 2 → 3 | 2 → 0 | 0 → 0 | yes |
| settings.compose.compose-1.5.default | 0 → 3 | 10 → 0 | 0 → 0 | yes |
| dashboard.compose.compose-1.5.default | 0 → 3 | 12 → 0 | 0 → 0 | yes |
| product-detail.compose.compose-1.5.default | 0 → 2 | 24 → 2 | 0 → 0 | yes |
| onboarding.compose.compose-1.5.default | 1 → 3 | 4 → 0 | 0 → 0 | yes |
| empty-error.compose.compose-1.5.default | 0 → 3 | 12 → 0 | 0 → 0 | yes |
| settings.compose.compose-1.5.classic | 2 → 3 | 2 → 0 | 0 → 0 | yes |
| dashboard.compose.compose-1.5.seed-B5651D | 2 → 3 | 2 → 0 | 0 → 0 | yes |
