# Judge calibration (v2)

Scores only; images and the ID mapping stay private.

## Round 1: FAIL

Anchors shown as score-3 examples: 9. Check references: 8. Defect pages: 8. Middle-band pages: 3.

| item | check-reference mean |
|---|---|
| component-choice | 3.00 |
| hierarchy-typography | 3.00 |
| color-roles | 3.00 |
| shape-expressive | 3.00 |
| spacing-layout | 3.00 |
| interaction-states | 3.00 |
| dark-mode | 3.00 |
| overall-polish | 3.00 |

| defect page | targeted item | score | caught |
|---|---|---|---|
| cramped | spacing-layout | 1 | yes |
| random-shapes | shape-expressive | 1 | yes |
| no-dark | dark-mode | 0 | yes |
| no-states | interaction-states | 1 | yes |
| flat-type | hierarchy-typography | 1 | yes |
| wrong-components | component-choice | 1 | yes |
| raw-colors | color-roles | 0 | yes |
| generic-look | overall-polish | 1 | yes |

| middle-band page | item scores (expected 1-2) | in range |
|---|---|---|
| template-m3 | overall-polish 1, shape-expressive 1 | yes |
| m2-era | overall-polish 1, shape-expressive 0, color-roles 0 | no |
| bootstrap-m3 | overall-polish 1, component-choice 0 | no |

Failures:

- middle m2-era: shape-expressive scored 0 (outside 1-2)
- middle m2-era: color-roles scored 0 (outside 1-2)
- middle bootstrap-m3: component-choice scored 0 (outside 1-2)
