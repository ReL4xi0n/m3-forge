# Development request set

Four requests used to develop and tune the `/material3` skill: podcast-player, expense-report,
plant-shop and clinic-schedule, 12 cells in `cells.json` (4 per platform, with the classic style and
the seed color `#2F6F5E` on each platform). `clinic-schedule` gives almost no content, so the model
has to invent it.

The eval requests (`evals/prompts/`) and the hold-out set are not used before Phase 4. Running the
skill against them during development would let the skill learn their answers.

`node tools/ci/overfit.mjs` (also run in CI) fails when a distinct term of any eval request, such as a
product name, a quoted UI string or a number with a unit, appears in a text file of the skill.

Adding a request without overlap:
1. Invent a plausible product name that is not a real brand and not used in `evals/prompts/`.
2. Do not reuse quoted UI strings, names or figures of an eval request.
3. Add the request as `evals/dev/<name>.md` and its cells to `evals/dev/cells.json` with `"set": "dev"`.
4. Run `npm test`; the overlap test fails if a term is shared.
