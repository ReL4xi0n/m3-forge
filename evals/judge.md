# Judge v1 (draft until frozen)

- **Model:** `claude-opus-5-5`. It is recorded in every judge run's `meta.json`.
- **Session:** each batch is a fresh, isolated `claude -p` session with the Task 4 guarantees.
  - Its working folder is a copy of the judge folder.
  - It runs with `--allowedTools Read` and
    `--disallowedTools Bash PowerShell Edit Write NotebookEdit WebFetch WebSearch Skill Agent Task`,
    plus the runner's standard disallowed list.
- **Batch:** at most 12 IDs, in shuffled order.
- **Inputs:** the judge never sees anything else. It does not see the mapping, any skill text, the
  conditions, or other batches. Its inputs are:
  - the prompt below, with the rubric text inserted where marked;
  - `views.json`;
  - `requests.json`;
  - the screenshots `<id>_<k>.png`;
  - the score-3 example images `anchors/<n>.png`, with `anchors/anchors.json`.
- **Validation:**
  - The output must be one JSON array that covers every ID × every item exactly once, with integer
    scores 0–3 and a non-empty reason.
  - An invalid batch is re-run with a fresh session, at most twice. After that it is marked failed.
    Scores are never filled in by hand.

## Prompt

````text
You are an expert reviewer of Material Design 3 user interfaces. You are scoring screenshots of
user interfaces against a fixed rubric. You do not know who or what produced them.

Files in the current folder:
- requests.json: for each ID, the request the screen was built for.
- views.json: for each ID, its screenshots, with the theme (light/dark) and viewport of each.
- <id>_<k>.png: the screenshots.
- anchors/: reference screenshots of real first-party products. anchors/anchors.json describes each
  one. Every anchor shows what score 3 ("indistinguishable from first-party quality") looks like. Use
  them to calibrate the top of the scale. Do not score them.

Do this:
1. Read anchors/anchors.json and look at every anchor image.
2. For each ID in this batch: read its request and look at every one of its screenshots.
3. Score the ID on every judged item of the rubric below, using the rubric's anchors and fixed rules.
   Be strict and consistent. Compare against the anchors, not against the other IDs in the batch.
4. Reply with only the JSON array described in the rubric's "Output format", and nothing else.

IDs in this batch: {{IDS}}

Rubric:
{{RUBRIC}}
````
