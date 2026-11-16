# Judge calibration

Scores only; images and the ID mapping stay private.

## Round 1: FAIL

Anchors shown as score-3 examples: 9. Check references: 8. Defect pages: 8.

| item | check-reference mean |
|---|---|
| component-choice | 3.00 |
| hierarchy-typography | 3.00 |
| color-roles | 3.00 |
| shape-expressive | 3.00 |
| spacing-layout | 2.88 |
| interaction-states | 2.63 |
| dark-mode | 3.00 |
| overall-polish | 2.75 |

| defect page | targeted item | score | caught |
|---|---|---|---|
| raw-colors | color-roles | 1 | yes |
| flat-type | hierarchy-typography | 1 | yes |
| wrong-components | component-choice | 1 | yes |
| no-dark | dark-mode | 0 | yes |
| generic-look | overall-polish | 1 | yes |
| no-states | interaction-states | 1 | yes |
| cramped | spacing-layout | 1 | yes |
| random-shapes | shape-expressive | 1 | yes |

Failures:

- reference mean for interaction-states is 2.63 (< 2.75)
## Round 2: PASS

Anchors shown as score-3 examples: 9. Check references: 8. Defect pages: 8.

| item | check-reference mean |
|---|---|
| component-choice | 3.00 |
| hierarchy-typography | 3.00 |
| color-roles | 2.75 |
| shape-expressive | 3.00 |
| spacing-layout | 2.88 |
| interaction-states | 3.00 |
| dark-mode | 2.75 |
| overall-polish | 2.88 |

| defect page | targeted item | score | caught |
|---|---|---|---|
| generic-look | overall-polish | 0 | yes |
| wrong-components | component-choice | 1 | yes |
| flat-type | hierarchy-typography | 1 | yes |
| raw-colors | color-roles | 0 | yes |
| random-shapes | shape-expressive | 1 | yes |
| no-states | interaction-states | 0 | yes |
| no-dark | dark-mode | 0 | yes |
| cramped | spacing-layout | 1 | yes |
