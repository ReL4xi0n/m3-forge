# m3-forge Roadmap

**Spec:** `docs/superpowers/specs/2026-11-12-m3-forge-design.md` (approved 2026-11-12)

The spec has five phases. Later phases depend on what earlier ones find. For example, Phase 3 skill
content is written against the Phase 2 baseline failure catalogue, and Phase 3 assets depend on the
Phase 1 NOT FOUND list. Because of that, only the next phase gets a detailed task-level plan. Each
following phase's plan is written when the previous phase is approved, and is reviewed together with
that phase's evidence.

Every phase ends with the same steps: stop, write an evidence summary, then wait for owner approval.

| Phase | Detailed plan | Deliverables (spec §) | Exit gate / evidence |
|---|---|---|---|
| 0 Skeleton | `2026-11-12-m3-forge-phase-0.md` | Repo renamed to `m3-forge`; private repo cloned in `private/`; LICENSE, NOTICE, README stub; public-diff guard + pre-commit hook; plugin skeleton; minimal CI; local toolchain (§3, §6, §13, §14) | Remote URLs; guard catching a planted `private/` file; green CI run link; toolchain versions; system Java/PATH unchanged |
| 1 Knowledge | `2026-11-13-m3-forge-phase-1.md` | Terms report (`docs/sources-and-licensing.md`) **first**; scraper → `private/raw/<date>/` (dated private commit); token extractors with `sources.lock.json`; `knowledge/` (guidance in own words, tokens with provenance, `conflicts.md`, `not-found.md`); confirmation of the default color variant per style (§8, §11) | Page counts, token counts, conflict list, NOT FOUND list, guard pass on all public diffs |
| 2 Tests & baseline | written at Phase 1 approval | `evals/prompts/`, frozen `evals/rubric.md`, `evals/judge.md`, anonymizer; hold-out written by a fresh subagent into `evals/holdout/` (never read by the implementer); fixtures; harnesses (web/Flutter/Compose); verify scripts v1; **2-cell pilot → stop for approval**; 26-cell baseline with blind scoring (§9, §10, §12) | Pilot time/usage numbers, then baseline screenshots, scores, failure catalogue |
| 3 Skill & assets | written at Phase 2 approval | 3a core (SKILL.md, references/core, tokens build, color script, precomputed schemes, detect, verify v2) → 3b web (tokens.css, components CSS, behaviors.js, icons subset) → 3c Flutter (theme, gap components + goldens, icons constants, scaffolding) → 3d Compose (theme templates, M3Icon + constants, scaffolding, Roborazzi) (§5, §7–§10) | One checkpoint per sub-phase, each with its own screenshots/goldens and test results |
| 4 Improve & release | written at Phase 3 approval | First 2 with-skill runs' cost reported; at most 3 improvement rounds; hold-out opened; second repeats on ambiguous cells; pooled blind re-score; examples/, README, full CI, `regenerate-references.yml`; install paths verified (§12, §13, §14) | Release bar (§12) met or gap report; green CI; both install paths shown working |

Carried into the Phase 3 plan (owner, 2026-11-13):
- Flutter is missing several components in `material_ui` (see `knowledge/not-found.md` and the
  Phase 1 evidence). Phase 3 needs a priority list for the gap components before building them.
- Motion values with no token that are taken from official library code are marked as
  "implementation reference", never as tokens. Phase 1 notes use the `[impl:]` marker for this.
- Token conflicts are resolved by the policy the owner chooses from the Phase 1 report.

Standing rules for all phases:
- Speak Turkish with the owner; everything in the repo is English.
- Before every public commit, run `node tools/guard/check-public-diff.mjs --staged` and confirm it
  passes. (Windows PowerShell 5.1 drops the `--` in `npm run guard -- --staged`.)
- Never read `evals/holdout/` before the final measurement.
- Never auto-accept Android SDK licenses.
- `--no-verify` (and any hook bypass) is forbidden. Guard false positives go into
  `tools/guard/allowlist.txt` with a reason, after review.
- Public commits use the repo-local GitHub noreply email (checked 2026-11-12:
  `…+ReL4xi0n@users.noreply.github.com`) as both author and committer.
- Merge locally (fast-forward or rebase), never with GitHub's merge or squash buttons or
  `gh pr merge`: GitHub authors those commits with the account email. Before every push, run
  `node tools/guard/check-public-diff.mjs --commits origin/main..HEAD`. The pre-push hook and CI
  (`--commits`) enforce noreply emails on every new commit.
- `backup/*` branches are local only; the pre-push hook refuses to push them.
