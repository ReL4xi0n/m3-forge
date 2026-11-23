# Compose dev outputs re-checked with the corrected tools (no new round)

| cell | build | touch targets before (layout size) | touch targets now (harness v3) | contrast | verify touch-target / contrast |
|---|---|---|---|---|---|
| podcast-player (skill, r1) | ok | 0 | 0 | 0 | 0 / 0 |
| clinic-schedule (skill, r1) | ok | 0 | 0 | 0 | 0 / 0 |
| expense-report (skill, r2) | ok | 0 | 0 | 0 | 0 / 0 |
| plant-shop (skill, r2) | ok | 0 | 0 | 0 | 0 / 0 |
| plant-shop (no Node, r3) | ok | 8 | 0 | 0 | 0 / 0 |

## plant-shop, state `empty-search` again (enterText now fails a state whose text is not in a field)

```json
[
  {
    "name": "empty-search",
    "ok": true,
    "shots": [
      "C:\\Users\\MUHAMM~1.ULA\\AppData\\Local\\Temp\\m3-screenshot-Z3PSem\\state-empty-search-light-412x915.png",
      "C:\\Users\\MUHAMM~1.ULA\\AppData\\Local\\Temp\\m3-screenshot-Z3PSem\\state-empty-search-dark-412x915.png"
    ]
  }
]
```

## plant-shop, state `sorted-price-low` again (2026-11-23)

Phase 3 open gap 3. The r2 session's state failed (`click: nothing matches text "Price: low to high"`). Re-run
on the recorded r2 project with the current screenshot step (skill at d055d7b, the session's own states
file, only this state): `ok: true` in both themes, build ok, runtime 0 contrast / 0 targets, 115 s of Gradle.
The light shot was read: the sort control reads "Sort: Price: low to high" and the grid starts at the lowest
prices (11.90, 12.50, 14.90, 15.60). The open popup menu itself is still not drawn under Robolectric (known
limitation); the sorted result is. Shots in `private/`.
