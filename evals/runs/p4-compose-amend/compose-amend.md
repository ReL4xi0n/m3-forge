# Compose harness v3 amendment: disabled-ancestor contrast filter

Ruling P24 (owner-accepted 2026-11-26). ATF reports the unmerged `Text` child of a disabled `Button` as an enabled `TextView`; the harness now counts an ATF result as enabled only when the node and every ancestor are enabled, so the label of a disabled button is no longer a contrast finding (spec §9: contrast excludes disabled elements). Every Compose capture of record was captured again from its recorded code (no cell ran again). Pictures are compared byte for byte with the capture of record; identical pictures keep their judge v2 scores, so the judge did not run again.

Pictures identical: 19/19.

| run | cell | contrast before → after | touch-target before → after | all findings before → after | pictures identical |
|---|---|---|---|---|---|
| baseline-2026-11-17 | landing.compose.compose-1.5.default | 0 → 0 | 0 → 0 | 36 → 36 | yes |
| baseline-2026-11-17 | settings.compose.compose-1.5.default | 0 → 0 | 0 → 0 | 21 → 21 | yes |
| baseline-2026-11-17 | dashboard.compose.compose-1.5.default | 0 → 0 | 0 → 0 | 20 → 20 | yes |
| baseline-2026-11-17 | product-detail.compose.compose-1.5.default | 0 → 0 | 2 → 2 | 34 → 34 | yes |
| baseline-2026-11-17 | onboarding.compose.compose-1.5.default | 0 → 0 | 0 → 0 | 20 → 20 | yes |
| baseline-2026-11-17 | empty-error.compose.compose-1.5.default | 0 → 0 | 0 → 0 | 16 → 16 | yes |
| baseline-2026-11-17 | settings.compose.compose-1.5.classic | 0 → 0 | 0 → 0 | 21 → 21 | yes |
| baseline-2026-11-17 | dashboard.compose.compose-1.5.seed-B5651D | 0 → 0 | 0 → 0 | 24 → 24 | yes |
| p4-final | landing.compose.compose-1.5.default | 0 → 0 | 0 → 0 | 0 → 0 | yes |
| p4-final | settings.compose.compose-1.5.default | 0 → 0 | 0 → 0 | 0 → 0 | yes |
| p4-final | dashboard.compose.compose-1.5.default | 0 → 0 | 0 → 0 | 0 → 0 | yes |
| p4-final | product-detail.compose.compose-1.5.default | 0 → 0 | 0 → 0 | 0 → 0 | yes |
| p4-final | onboarding.compose.compose-1.5.default | 0 → 0 | 0 → 0 | 0 → 0 | yes |
| p4-final | empty-error.compose.compose-1.5.default | 0 → 0 | 0 → 0 | 0 → 0 | yes |
| p4-final | settings.compose.compose-1.5.classic | 0 → 0 | 0 → 0 | 0 → 0 | yes |
| p4-final | dashboard.compose.compose-1.5.seed-B5651D | 0 → 0 | 0 → 0 | 0 → 0 | yes |
| p4-h1 | booking.compose.compose-1.5.default | 2 → 0 | 0 → 0 | 2 → 0 (pre-fix capture of 2026-11-26 (P23)) | yes |
| p4-h1 | chat.compose.compose-1.5.default | 0 → 0 | 0 → 0 | 0 → 0 | yes |
| p4-sonnet | product-detail.compose.compose-1.5.default | 0 → 0 | 0 → 0 | 0 → 0 | yes |

- baseline-2026-11-17: 8 cells, findings 192 → 192
- p4-final: 8 cells, findings 0 → 0
- p4-h1: 2 cells, findings 2 → 0
- p4-sonnet: 1 cells, findings 0 → 0
