# Judge v2 (draft until frozen)

Owner decision of 2026-11-17 (protocol change PC-2, option a). Judge v1 (`evals/judge.md`) stays
frozen as it was. v2 is judge v1 with the rubric v2 text and a side-by-side step.

- **Model:** `claude-opus-5-5`. It is recorded in every judge run's log.
- **Session:** each batch is a fresh, isolated, read-only `claude -p` session, as in v1.
- **Batch:** at most 12 IDs, in shuffled order.
- **Inputs:** the judge never sees anything else. It does not see the mapping, any skill text, the
  conditions, or other batches. Its inputs are:
  - the prompt below, with the rubric v2 text inserted where marked;
  - `views.json`, `requests.json` and the screenshots `<id>_<k>.png`;
  - the score-3 example images `anchors/<n>.png`, with `anchors/anchors.json` (the frozen anchor set,
    as in v1);
  - `pairs.json`: for each ID, the one or two anchors it is compared with side by side. They are
    chosen by `evals/tools/pairing.mjs` from the same platform family (Android or web): the closest
    screen type and form factor first, then one in the other theme.
- **Validation:** one JSON array that covers every ID × every item exactly once, with integer scores
  0–3, a non-empty `gap` and a non-empty `reason`. An invalid batch is re-run with a fresh session, at
  most twice, then marked failed. Scores are never filled in by hand.

## Prompt

````text
You are an expert reviewer of Material Design 3 user interfaces. You are scoring screenshots of
user interfaces against a fixed rubric. You do not know who or what produced them.

Files in the current folder:
- requests.json: for each ID, the request the screen was built for.
- views.json: for each ID, its screenshots, with the theme (light/dark) and viewport of each.
- <id>_<k>.png: the screenshots.
- anchors/: screenshots of real first-party products. anchors/anchors.json describes each one. Every
  anchor shows what score 3 ("indistinguishable from first-party quality") looks like. Do not score
  them.
- pairs.json: for each ID, the anchors to compare it with side by side.

Do this:
1. Read anchors/anchors.json and look at every anchor image.
2. For each ID in this batch:
   a. Read its request and look at every one of its screenshots.
   b. Look again at the anchors pairs.json lists for it, and compare the ID with them side by side.
   c. For each judged item, write the "gap": the most visible design difference between the ID and
      its paired anchors on that item, or "none". Brand and product names, logos, the data and copy
      shown, the interface language, phone status and navigation bars, browser parts and image
      scaling are not design: never count them as a gap.
   d. Score the item with the rubric below: its anchors, its fixed rules, and the gap you wrote. Give
      3 only when the gap is "none".
   Be strict and consistent. Compare each ID with the anchors, not with the other IDs in the batch.
3. Reply with only the JSON array described in the rubric's "Output format", and nothing else.

IDs in this batch: {{IDS}}

Rubric:
{{RUBRIC}}
````
