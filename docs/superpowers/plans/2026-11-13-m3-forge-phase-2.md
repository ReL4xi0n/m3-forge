# m3-forge Phase 2 (Tests and Baseline) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development
> (recommended) or superpowers:executing-plans to implement this plan task by task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal.** Measure how well Claude builds Material 3 UIs with no skill at all, using blind, calibrated
scores and automated checks. The result is a failure catalogue that Phase 3's skill content will
target.

**Architecture.**
- Each baseline run is a headless `claude -p` session. It runs in a fresh copy of a fixture, in an
  empty folder outside both the repository and the user profile, with a throwaway config that has
  no skills, plugins, MCP servers or memory.
- A Node runner proves the isolation three times for every run: before it starts, from the
  session's own init event, and from a full audit of its transcript afterwards.
- After each run:
  - harnesses take screenshots of the result (Playwright, Flutter goldens, Roborazzi);
  - verify v1 runs the automated checks;
  - the anonymizer hides which run each screenshot came from;
  - a fresh, isolated judge scores the screenshots against a rubric. The rubric is calibrated on the
    owner's real product screenshots and frozen before any request is run.

**Tech stack.**
- Node 20+ (ESM) and `node --test`.
- Claude Code CLI 2.1.322: `claude -p --output-format stream-json --verbose`.
- Playwright 1.65.0 with Chromium from the toolchain, and axe-core (pinned).
- Flutter stable from the toolchain, with `flutter_test` goldens.
- Gradle, Robolectric and Roborazzi, with JDK 21 from the toolchain.

**Spec:** `docs/superpowers/specs/2026-11-12-m3-forge-design.md`. The relevant sections are §9, §10,
§12 and §15 Phase 2, plus the owner decisions logged in §16 on 2026-11-13.

## Global Constraints

- Speak Turkish with the owner; everything in the repo is English.
- Public commits:
  - Use only the noreply author and committer email.
  - Run `node tools/guard/check-public-diff.mjs --staged` before each commit, and
    `--commits origin/main..HEAD` before each push.
  - Merge with a local fast-forward only; never `gh pr merge`. Never push `backup/*`, and never use
    `--no-verify`.
- Run outputs:
  - Raw outputs (generated code, screenshots, transcripts) go to the private repo, under
    `private/evals/runs/`.
  - Only summaries and scores go public, under `evals/runs/`.
  - Real product screenshots stay in `private/reference-screenshots/` and are never copied to the
    public repo. The guard's `private-copy` and `foreign-image` rules enforce this.
- Never read, list or search `evals/holdout/`.
  - Task 3 adds the path to `.ignore` and `.rgignore`, so the Grep and Glob tools skip it.
  - Shell searches pass `--exclude-dir=holdout`.
- No request prompt, including the pilot, runs before the rubric and the judge prompt are frozen
  (Task 11).
  - Before the freeze, harnesses and verify scripts are tested only on sample apps we write by hand.
  - They are never tested on model outputs.
- Toolchain:
  - Toolchain files stay in `%USERPROFILE%\.m3-toolchain`, and environment changes stay
    process-only.
  - The eval work root is `C:\m3-eval\`, outside the user profile for the reason given in Task 4.
  - It is created by the runner and removed with `node evals/tools/clean.mjs`.
  - The snapshot check gains this one expected path.
- Numbers are never guessed. A missing measurement is recorded as `NOT FOUND`, or as `failed` with
  its reason.
- Models are recorded in `evals/runs.json`.
  - Baseline runs use `claude-opus-5-5`, the model later with-skill runs will also use.
  - The judge uses `claude-opus-5-5`.
  - The owner may change either before the freeze.

## Review Focus

1. **Isolation leaks through a path that is not checked.** Examples:
   - an ancestor `CLAUDE.md`;
   - remote or managed settings attached to the account;
   - an inherited `CLAUDE_*` or `ANTHROPIC_*` environment variable;
   - a plugin enabled through `extraKnownMarketplaces`.

   The negative canary in Task 4 must show that the check catches a leaky configuration.
2. **The anonymizer leaks the source.** Examples: PNG text, time or EXIF chunks; file order or
   mtimes; folder names; or the words "skill" or "baseline" in any file. Task 10 tests this byte by
   byte.
3. **A run that fails silently.** The build fails, the session asks a question and ends, or a
   screenshot is missing. Such a run must still produce a scored record with a reason, never a
   dropped cell (Tasks 4 and 13).
4. **Malformed or partial judge output.** The output is checked against a schema. A failed batch is
   re-run with a fresh judge, and scores are never filled in by hand (Task 10).
5. **The frozen rubric's hash changes with line endings.** Fixed with `.gitattributes` `eol=lf` for
   `evals/**/*.md`, and hashes computed on LF-normalized bytes (Task 11).

---

### Task 1: Phase 1 follow-up: list site, Flutter and Compose against material-web

**Files.**
- Modify: `tools/extract/tokens/merge.mjs` and `tools/extract/tokens/report.mjs`.
- Test: `tools/extract/tokens/test/merge.test.mjs`.

**Interfaces.**
- Produces: `merge(...).siteBackedOverrides`, an array of
  `{id, mode, site: {page, value, note, line}, web, flutter, compose}`.
- `conflicts.md` gains a section titled
  `## Site, Flutter and Compose agree against material-web (owner decision) (N)`.

- [ ] **Step 1: Write the failing tests.**
  - The site gives 12dp, Flutter 12, Compose 12dp and web 16dp. Expect one `siteBackedOverrides`
    entry.
  - Only Flutter matches the site. Expect none.
  - Compose has NOT FOUND. Expect none.
- [ ] **Step 2: Run the tests.** Command: `node --test tools/extract/tokens/test/merge.test.mjs`.
  Expected: FAIL.
- [ ] **Step 3: Implement.** Compare after following refs within each source, with the same rules
  as `compare()`. Render the new section in `conflictsMd`, and add `siteBackedOverrides` to
  `summary.json` `totals`.
- [ ] **Step 4: Regenerate and check.**
  - Run `node tools/extract/tokens/report.mjs`, then `--check`, then `npm test`. Expected: PASS.
  - Record N in the ledger.
- [ ] **Step 5: Commit.** Message: `feat(knowledge): list site-backed disagreements with material-web
  for owner decision`.

### Task 2: Test requests and the run matrix

**Files.**
- Create: `evals/prompts/{landing,settings,dashboard,product-detail,onboarding,empty-error}.md`.
- Create: `evals/prompts/variants.md` and `evals/cells.json`.
- Test: `evals/tools/test/cells.test.mjs`.

**Interfaces.**
- Produces: `cells.json`, an array of `{cell, request, platform, fixture, variant}`. `variant` is
  `default`, `classic` or `seed:<hex>`.

- [ ] **Step 1: Write the failing test.**
  - There are exactly 26 cells: 18 core and 8 coverage.
  - Each of the 6 requests appears once per platform.
  - The web core cells are split between `web-empty` and `web-react`, 3 each.
  - There is 1 `web-vue` cell and 1 `flutter-legacy` cell.
  - `classic` appears once per platform, and so does `seed:`.
  - Cell ids are unique.
- [ ] **Step 2: Run it.** Expected: FAIL (no file).
- [ ] **Step 3: Write the six requests.**
  - Write them as a real user would. Each states the product and its content, and never mentions
    Material components by name.
  - Each request is platform-neutral text. The runner appends one line naming the platform and the
    project folder.
  - `variants.md` holds two lines:
    - classic: "Use the classic Material 3 style, not M3 Expressive."
    - seed: "Use #<hex> as the brand color."
  - The seed hex is one fixed value that is not in the precomputed grid.
- [ ] **Step 4: Run the test.** Expected: PASS.
- [ ] **Step 5: Commit.** Message: `feat(evals): test requests and 26-cell run matrix`.

### Task 3: Hold-out requests (fresh subagent; never read)

**Files.**
- Create: `.ignore` and `.rgignore`, each containing `evals/holdout/`.
- The subagent creates `evals/holdout/*`.

- [ ] **Step 1: Commit the ignore files first.** Message: `chore(evals): exclude holdout from
  searches`.
- [ ] **Step 2: Dispatch a fresh subagent.**
  - Its brief contains only:
    - the 6 request type names;
    - "write 2 different requests of comparable difficulty, platform-neutral, in the same voice as
      a real user";
    - the target folder;
    - the commit and guard commands.
  - It writes, stages, runs the guard and commits.
  - It reports only the commit SHA and the file count.
- [ ] **Step 3: Verify without reading.**
  - Run `git show --stat <sha>` and confirm the paths are under `evals/holdout/` only. Do not open
    the files.
  - Record the SHA in the ledger.

### Task 4: Isolated runner, with proof of isolation

**Files.**
- Create: `evals/tools/isolation.mjs`, `evals/tools/run-cell.mjs` and `evals/tools/clean.mjs`.
- Test: `evals/tools/test/isolation.test.mjs`, using recorded stream-json fixtures under
  `evals/tools/test/fixtures/`.

**Why `C:\m3-eval\` and not a folder under the user profile.** Claude Code reads `CLAUDE.md` and
`.claude/CLAUDE.md` in every ancestor of the working directory. Under `%USERPROFILE%`, that walk
reaches the owner's personal `~/.claude/CLAUDE.md`. A root outside the profile has no such ancestor.
The preflight check below proves it for every run.

**How isolation is guaranteed.** Every run gets all of the following:

| # | Guarantee | Mechanism |
|---|---|---|
| G1 | Empty folder outside the repo and the profile | `C:\m3-eval\work\<run-id>\<cell>\`, a fresh fixture copy with no `.git` |
| G2 | No user configuration | A new `CLAUDE_CONFIG_DIR=C:\m3-eval\cfg\<run-id>\` holding only the runner's `settings.json` and the auth file. The auth file is copied in and deleted after the run. There are no `plugins/`, `skills/`, `agents/`, `commands/`, `CLAUDE.md` or `projects/` |
| G3 | Only that config is loaded | `--setting-sources user` (the throwaway user config only), and `--strict-mcp-config` with no `--mcp-config`, so there are no MCP servers |
| G4 | No skill can load, including Claude Code's bundled skills | `--disallowedTools Skill` |
| G5 | No repo access | `settings.json` `permissions.deny` holds `Read`, `Edit` and `Write` rules for `<repo>/**` and `%USERPROFILE%/.claude/**`. The run is never given the repo path |
| G6 | Clean environment | The child gets the system environment with every `CLAUDE_*`, `ANTHROPIC_*`, `MCP_*` and `npm_config_*` variable removed, then the runner's own `CLAUDE_CONFIG_DIR` and the toolchain paths (process-only) added |

**How isolation is verified.** Each of these must pass, or the run is invalid, listed in the report
and re-run:

| # | Check | When | Pass condition |
|---|---|---|---|
| V1 | Preflight | Before start | No ancestor up to `C:\` contains `CLAUDE.md`, `CLAUDE.local.md`, `AGENTS.md`, `.claude/`, `.mcp.json` or `.git`; `git rev-parse` fails in the work folder; the config folder holds exactly the two expected files; the environment has no forbidden keys |
| V2 | Init event | First `system`/`init` line of the run | `mcp_servers` is empty; `plugins` is empty; `tools` has no `Skill` and no `mcp__*`; `skills`/`slash_commands` hold no name from the owner's installed skills or plugins (a name list built at runtime and kept private) and nothing with `:`, `superpowers`, `claude-mem` or `graphify`; `cwd` is the work folder |
| V3 | Transcript audit | After the run | No tool input or result contains the repo path, `knowledge`, `private`, `m3-forge`, `reference-screenshots`, `holdout` or a path under `%USERPROFILE%\.claude`; every absolute path is under the work folder or on an allowlist (toolchain, system temp, npm, pub and gradle caches) |
| V4 | Canary | In this task, and before every batch | A tiny isolated session lists its skills, commands, MCP servers and any memory or CLAUDE.md instructions, then tries to read `<repo>/knowledge/README.md` and `<repo>/private/README.md`. Pass: V2 is clean, it reports none, and both reads end in a permission denial |
| V5 | Negative canary | In this task, once | The same canary with `CLAUDE_CONFIG_DIR` pointing at the real `~/.claude` must **fail** V2. This proves the check detects a leak |

**Interfaces.**
- `preflight({workDir, cfgDir, env}) → {ok, problems[]}`.
- `checkInit(initEvent, {workDir, forbiddenNames}) → {ok, problems[]}`.
- `auditTranscript(lines, {workDir, repoRoot, allow}) → {ok, hits[]}`.
- `runCell({cell, runId, model, prompt, fixture}) → {status, durationMs, usage, costUsd, checks, outDir}`.
  - `status` is one of `ok`, `invalid-isolation`, `session-error`, `asked-question` or `timeout`.
  - Failures still return a record.

- [ ] **Step 1: Write the failing unit tests.** They run on recorded stream-json fixtures.
  - A clean init passes.
  - Each of these fails: an MCP server in init; a `superpowers:*` skill; `Skill` in tools; a `cwd`
    mismatch; a planted ancestor `CLAUDE.md` (made in a temp dir); a forbidden env key; a transcript
    that reads `…/knowledge/README.md`; a session whose last assistant turn is a question with no
    file changes (`asked-question`).
- [ ] **Step 2: Run the tests.** Command: `node --test evals/tools/test/isolation.test.mjs`.
  Expected: FAIL.
- [ ] **Step 3: Implement.**
  - The runner writes `C:\m3-eval\work\<run-id>\<cell>\run.jsonl`, `meta.json` and `checks.json`.
  - It copies all three, plus the result code (excluding `node_modules`, `build`, `.dart_tool` and
    `.gradle`), to `private/evals/runs/<run-id>/<cell>/`.
- [ ] **Step 4: Run the tests.** Expected: PASS.
- [ ] **Step 5: Check auth.**
  - Try one canary with the copied auth file.
  - If authentication fails, **stop and ask the owner** for an alternative: an API key in the
    process environment, or a token from `claude setup-token`. Never copy any other file from
    `~/.claude`.
- [ ] **Step 6: Run the canaries.**
  - Run the V4 canary and the V5 negative canary.
  - Save their check outputs to `private/evals/runs/canary-<date>/`, and record PASS/FAIL in the
    ledger.
  - Expected: V4 passes and V5 fails V2.
- [ ] **Step 7: Commit.** Message: `feat(evals): isolated claude -p runner with preflight, init and
  transcript checks`.

### Task 5: Fixtures

**Files.**
- Create: `evals/fixtures/{web-empty,web-react,web-vue,flutter-material_ui,flutter-legacy,compose-1.5}/`.
- Create: `evals/tools/prepare-fixture.mjs`.
- Test: `evals/tools/test/fixtures.test.mjs`.

**Fixture contents.**
- `web-empty`: an empty folder (only `.gitkeep`, which the copy drops).
- `web-react` and `web-vue`: Vite templates, with versions pinned in `package.json` and
  `package-lock.json`.
- `flutter-material_ui`: `flutter create` output with `material_ui: 1.11.0`.
- `flutter-legacy`: the `flutter create` default (`flutter/material.dart`).
- `compose-1.5`: a minimal single-activity app with `androidx.compose.material3:material3:1.5.0-rc01`,
  the Gradle wrapper, and the version in one place.

**Interfaces.** `prepareFixture(name, dest)` copies the fixture and installs its dependencies
(`npm ci`, `flutter pub get` or a Gradle dependency resolve) through the toolchain environment,
before the session starts. The session starts on a project that already builds.

- [ ] **Step 1: Write the failing test.** Every fixture copies, installs and builds with no source
  edits:
  - web: `npm run build`;
  - Flutter: `flutter test` on the template test;
  - Compose: `gradlew assembleDebug` (offline after the first resolve).
- [ ] **Step 2: Run it.** Expected: FAIL.
- [ ] **Step 3: Create the fixtures.**
- [ ] **Step 4: Run the test.** Expected: PASS.
- [ ] **Step 5: Run the snapshot check.** Only `.m3-toolchain` and `C:\m3-eval` may be new.
- [ ] **Step 6: Commit.** Message: `feat(evals): six pinned fixtures`.

### Task 6: Fonts and the web harness

**Files.**
- Create: `harness/web/capture.mjs`.
- Create: `tools/toolchain/fonts.json`, holding Roboto Flex, Roboto and Material Symbols Outlined
  from the official repos, each with its URL and sha256.
- Test: `harness/web/test/capture.test.mjs`, run on a hand-written sample page.

**Interfaces.** `captureWeb({projectDir, kind}) → {shots: [{file, theme, viewport}], axe: {...}, buildOk, reason?}`.
- `web-empty` is served statically from `index.html`. React and Vue run `npm run build`, then
  `vite preview`.
- Viewports: 412×915 and 1440×900. Themes: light and dark, through `colorScheme` emulation.
  Screenshots are full-page.
- axe-core checks color contrast and target size, excluding `:disabled` and `[aria-disabled="true"]`.

- [ ] **Step 1: Write the failing test.**
  - Sample page with one low-contrast label and one 24px button. Expect 4 shots, one contrast hit
    and one target-size hit.
  - A broken build. Expect `buildOk: false` with a reason.
- [ ] **Step 2: Run it.** Expected: FAIL.
- [ ] **Step 3: Implement.** Download the fonts into `.m3-toolchain\fonts\` and verify their
  hashes.
- [ ] **Step 4: Run the test.** Expected: PASS.
- [ ] **Step 5: Commit.** Message: `feat(harness): web capture with axe checks`.

### Task 7: Flutter harness

**Files.**
- Create: `harness/flutter/capture_test.dart`, `harness/flutter/flutter_test_config.dart` and
  `harness/flutter/capture.mjs`.
- Test: `harness/flutter/test/capture.test.mjs`, run on a hand-written sample app.

**Interfaces.**
- `captureFlutter({projectDir}) → {shots, guidelines: {textContrast, tapTarget}, buildOk, reason?}`.
- After the run, the runner copies the two Dart files into the result's `test/`. The session never
  sees them.
- The test calls the app's `main()`, then `pumpAndSettle`, at 412×915 logical pixels with a device
  pixel ratio of 2.625, in light and dark (`platformBrightnessTestValue`).
- `FontLoader` loads Roboto Flex, Roboto and Symbols from the toolchain fonts.

- [ ] **Step 1: Smoke golden first.**
  - Render text in Roboto Flex at `wght` 300 and 800 and `opsz` 8 and 144, and a Symbols icon at
    `FILL` 0/1 and `wght` 200/700.
  - Compute pixel differences between each pair.
  - **If any pair is identical, the axes do not render. Stop and report to the owner (spec §10).**
- [ ] **Step 2: Write the failing capture test.** The sample app with one 32dp tap target expects
  2 shots and one tap-target hit.
- [ ] **Step 3: Implement and pass.** Command: `node --test harness/flutter/test`. Expected: PASS.
- [ ] **Step 4: Commit.** Message: `feat(harness): Flutter capture with real fonts and guidelines`.

### Task 8: Compose harness

**Files.**
- Create: `harness/compose/roborazzi.init.gradle.kts`, `harness/compose/CaptureTest.kt` and
  `harness/compose/capture.mjs`.
- Test: `harness/compose/test/capture.test.mjs`, run on a hand-written sample app.

**Interfaces.**
- `captureCompose({projectDir}) → {shots, atf: [...], buildOk, reason?}`.
- A Gradle init script adds Robolectric, Roborazzi and the ATF accessibility check to the result
  project's `testDebug` without editing its build files.
- The test launches the manifest's launcher activity with `ActivityScenario`, using native graphics
  at 412×915dp and 420dpi, light and `+night`.

- [ ] **Step 1: Write the failing test.** The sample app with a 32dp clickable and a low-contrast
  text expects 2 shots, one touch-target hit and one contrast hit.
- [ ] **Step 2: Implement and pass.**
  - If an init script cannot add the plugin, record a ledgered Ruling and switch to a harness
    module that depends on the app module. Same interface.
- [ ] **Step 3: Commit.** Message: `feat(harness): Compose capture with Roborazzi and ATF`.

### Task 9: Verify scripts v1 (pulled forward from Phase 3)

**Files.**
- Create: `plugin/skills/material3/scripts/verify/{index.mjs,web.mjs,flutter.mjs,compose.mjs}`.
- Test: `plugin/skills/material3/scripts/verify/test/*.test.mjs`, with planted samples.

**Interfaces.**
- `verify({projectDir, platform, runtime}) → {violations: [{check, file, line, detail, severity}], counts, exitCode}`.
- Also writes `verify.json` and a text summary.
- Checks follow the spec §9 table, per platform:
  - hardcoded color;
  - off-token font size or weight;
  - off-token radius;
  - off-grid spacing (a warning);
  - shadows and gradients;
  - icon source (legacy icon sets, emoji);
  - foreign styling (web);
  - contrast and touch targets, taken from the harness `runtime` results.
- Theme files are allowed to hold literal values:
  - web: custom properties declared at `:root` or a theme selector;
  - Flutter: files whose top-level declarations are only `ColorScheme`, `ThemeData` or
    `TextTheme` values;
  - Compose: `ui/theme/*.kt`.

- [ ] **Step 1: Write failing tests, one per check per platform.** Each check gets a hit sample and
  a clean sample, plus one allowlisted theme file per platform.
- [ ] **Step 2: Implement and pass.** Command: `node --test plugin/skills/material3/scripts/verify/test`.
- [ ] **Step 3: Validate.** Run `node tools/ci/validate-plugin.mjs`. Expected: ok.
- [ ] **Step 4: Commit.** Message: `feat(skill): verify v1 static and runtime checks`.

### Task 10: Rubric, judge prompt and anonymizer (drafts)

**Files.**
- Create: `evals/rubric.md`, `evals/judge.md`, `evals/tools/anonymize.mjs` and
  `evals/tools/judge.mjs`.
- Create: `.gitattributes` (`evals/**/*.md text eol=lf`).
- Test: `evals/tools/test/anonymize.test.mjs` and `evals/tools/test/judge.test.mjs`.

**Rubric** (spec §12; each item scored 0–3, with concrete anchors for 0, 1, 2 and 3):
- Automated items:
  - token fidelity, from verify counts per 100 lines of UI code;
  - contrast and targets, from runtime hits;
  - anti-patterns, from the hit count.
  - Each anchor is a numeric band.
- Judged items:
  - component choice;
  - hierarchy and typography;
  - color-role use;
  - shape and Expressive character;
  - spacing and layout;
  - interaction states;
  - dark mode;
  - overall polish.
- Fixed rules:
  - A failed build, a missing screenshot or an `asked-question` run scores 0 on every judged item,
    with the reason recorded.
  - Classic cells judge "Expressive character" as M3 correctness.
  - Score 3 means "indistinguishable from first-party quality"; the anchor images (Task 11) are its
    reference.

**Judge.**
- `judge.md` records the model, the exact prompt and the input list: the judge folder, the rubric,
  the request text per ID and the anchor set.
- `judge.mjs` runs each batch as an isolated `claude -p` session with the Task 4 guarantees.
  - Its working folder is the judge folder.
  - It is started with `--allowedTools Read` and
    `--disallowedTools Bash Edit Write WebFetch WebSearch Skill Agent`.
  - A batch holds at most 12 IDs, in shuffled order.
- Output: JSON `{id, item, score, reason}[]`, validated against a schema. An invalid batch is
  re-run with a fresh session, at most twice, then marked failed.

**Anonymizer.**
- `anonymize({shots, outDir, seed}) → {judgeDir, mappingPath}`.
- Each output (cell × condition × repeat) gets a random 6-character ID. Its images are named
  `<id>_<k>.png`, in a random order. `views.json` maps each file to `{theme, viewport}` only.
- PNGs are re-encoded with only the IHDR, PLTE, IDAT and IEND chunks, and file mtimes are set to one
  fixed date.
- `mapping.json` goes to `private/evals/runs/<run-id>/mapping.json`, never inside the judge folder.

- [ ] **Step 1: Write the failing tests.**
  - Anonymizer:
    - no PNG in the judge folder has tEXt, iTXt, zTXt, tIME or eXIf chunks;
    - no file in the judge folder contains `skill`, `baseline`, a cell id or a run id;
    - the mapping round-trips;
    - IDs are unique across 1,000 outputs.
  - Judge: a malformed JSON batch is rejected; a batch missing an item is rejected.
- [ ] **Step 2: Implement and pass.**
- [ ] **Step 3: Commit the drafts.** Message: `feat(evals): rubric and judge drafts, anonymizer`.
  This is not the freeze; Task 11 freezes.

### Task 11: Judge calibration on the owner's reference screenshots, then the freeze

**Inputs.**
- `private/reference-screenshots/`, filled by the owner. Its list is in the Appendix.
- `evals/calibration/defects/`, a set of hand-written web pages, written by us and not by a model
  run. Each has one planted defect aimed at one judged item. For example:
  - raw hex colors instead of roles;
  - no dark mode;
  - a checkbox used for a mobile settings toggle;
  - cramped, off-grid spacing;
  - no hover, focus or pressed states;
  - a generic framework default look.

**Preparing the calibration set.**
- **If the folder holds fewer than 12 usable images, stop and ask the owner.**
- Split the references in two, so that each platform and screen type falls on both sides:
  - an **anchor set**, shown to the judge as labeled examples of score 3;
  - a **check set**, mixed unlabeled with the defect pages.

**Calibration rounds.**
- Each round runs the anonymizer and a fresh judge.
- Pass when both hold:
  - Check-set references: the mean of each applicable judged item is at least 2.75, and no score
    is below 2.
  - Defect pages: the targeted item scores 1 or less.
- Between rounds, only the rubric anchor wording and the judge prompt may change.
- At most 3 rounds. If round 3 still fails, **stop and report to the owner**.

**Freeze.**
- `evals/frozen.json` holds `{rubric: sha256, judge: sha256, anchorSet: [sha256...], calibrationRounds}`,
  hashed over LF-normalized bytes.
- `run-cell.mjs` and `judge.mjs` refuse to start when any hash differs.
- A CI test checks the hashes.
- After the freeze, any change means writing `rubric-v2.md` and re-scoring both the baseline and the
  final runs (spec §12).

**Proof the freeze came before any output.**
- At freeze time, `private/evals/runs/` holds only `canary-*` folders, and `C:\m3-eval\work\` holds
  no cell folders.
- Every run's `meta.json` records `startedAt` and the freeze commit SHA. The Phase 2 report shows
  that the freeze commit time is earlier than the first `startedAt`.

- [ ] **Step 1: Write the defect pages** and their expected-score table,
  `evals/calibration/expected.json`.
- [ ] **Step 2: Run calibration rounds** until they pass, or stop.
  - Write `evals/calibration/report.md`, public, with scores and IDs only.
  - Images and the mapping go to `private/evals/calibration/`.
- [ ] **Step 3: Write the freeze test.** It fails while `frozen.json` is absent. Then add
  `frozen.json` and see it pass.
- [ ] **Step 4: Commit the freeze.** Message: `feat(evals): freeze rubric v1 and judge after
  calibration`.
  - Record the SHA in the ledger.
  - Run the guard: no reference image or private path may appear in the diff.

### Task 12: Pilot (2 cells), then STOP

- [ ] **Step 1: Run the canary (V4)**, then two pilot cells: `landing × web-empty` and
  `settings × flutter-material_ui`, one run each.
- [ ] **Step 2: Capture, verify, anonymize and judge** both cells through the full pipeline.
- [ ] **Step 3: Report.**
  - For each cell: wall time, input, output and cache tokens, and cost, all from the stream-json
    `result` event.
  - Each cell's V1–V3 results.
  - An extrapolated total for the 26-cell baseline, and for the Phase 4 run counts in spec §12.
- [ ] **Step 4: STOP.** Wait for the owner's approval before Task 13.

### Task 13: Baseline (26 cells) and blind scoring

- [ ] **Step 1: Run the cells.**
  - Run all 26 cells, one at a time by default; the owner may approve a concurrency of 2 at the
    pilot stop.
  - Run the canary before every batch of 6.
  - Re-run invalid-isolation runs after fixing the cause, and list them.
- [ ] **Step 2: Capture, verify, anonymize and judge.**
  - Run the harness and verify v1 for every cell.
  - Anonymize all outputs together, then judge them in batches with fresh sessions.
- [ ] **Step 3: Un-blind and summarize.**
  - Open the mapping only after every batch is scored.
  - Write `evals/runs/<date>-baseline/{scores.json,summary.md}`.
  - `summary.md` holds:
    - scores by item and by platform;
    - automated violation counts;
    - the failure catalogue, as failure types with their frequency and example cell ids;
    - isolation results for every run.
- [ ] **Step 4: Commit.** Message: `docs(evals): baseline scores and failure catalogue`. The guard
  passes, and only summaries are public.

### Task 14: Phase 2 evidence, then STOP

The evidence summary for the owner, in Turkish, covers:
- **Isolation proof:**
  - V1–V3 counts over all runs;
  - the canary and negative-canary outputs;
  - the list of any invalid runs.
- **Freeze proof:** the commit SHA and time, compared with the first `startedAt`.
- **Calibration:** rounds, scores, and what changed between rounds.
- **Pilot and baseline:** time and usage.
- **Scores:** per platform and per item.
- **Failure catalogue:** with screenshots to view privately.
- **Verify v1:** results.
- **Owner spot-check:** a sample shown next to the reference screenshots (spec §12).
- **Owner decisions needed:**
  - the Task 1 list (site, Flutter and Compose against material-web);
  - any open Ruling.
- **CI links.**
- **Rulings.**

Then STOP until the owner approves.

---

## Appendix: reference screenshots the owner provides (`private/reference-screenshots/`)

Recommended: 24 images. Minimum: 12. With 12, use only the rows marked ★.

**Format.**
- Real Google first-party product screens.
- PNG, at native resolution, unedited.
- Phones in portrait. Full screen, with the status bar allowed and no device frame.
- Web as the full browser viewport content, without the browser UI.
- No personal data: use a demo account, or blur personal data before saving.

**File names.** `<platform>-<style>-<screen>-<theme>-<n>.png`, for example
`android-expressive-settings-light-1.png`.

| # | Platform | Style | Screen type (maps to a request) | Theme | ★ |
|---|---|---|---|---|---|
| 1 | Android phone | M3 Expressive (Android 16 era) | Settings list | light | ★ |
| 2 | Android phone | M3 Expressive | Settings list | dark | ★ |
| 3 | Android phone | M3 Expressive | Dashboard or summary (stats, cards) | light | ★ |
| 4 | Android phone | M3 Expressive | Product or app detail page | light | ★ |
| 5 | Android phone | M3 Expressive | Product or app detail page | dark | |
| 6 | Android phone | M3 Expressive | Form or onboarding step with text fields | light | ★ |
| 7 | Android phone | M3 Expressive | Empty state | light | ★ |
| 8 | Android phone | M3 Expressive | Error or offline state | light or dark | |
| 9 | Android phone | M3 Expressive | A screen showing button groups, split button or FAB menu | light | |
| 10 | Android phone | M3 Expressive | A screen showing a toolbar, loading indicator or wavy progress | any | |
| 11 | Android phone | M3 Expressive | Any list screen | dark | |
| 12 | Android phone | Classic M3 (Android 13–15 era) | Settings or list | light | |
| 13 | Android phone | Classic M3 | Detail or form | dark | |
| 14 | Web desktop (about 1440 px wide) | Current Google web style | Landing or marketing page | light | ★ |
| 15 | Web desktop | Current Google web style | Settings page | light | ★ |
| 16 | Web desktop | Current Google web style | Admin or analytics dashboard | light | ★ |
| 17 | Web desktop | Current Google web style | Product detail page | light | |
| 18 | Web desktop | Current Google web style | Sign-up or form page | light | ★ |
| 19 | Web desktop | Current Google web style | Empty state (empty folder, no results) | light | ★ |
| 20 | Web desktop | Current Google web style | Error page | light | |
| 21 | Web desktop | Current Google web style | Main app view | dark | ★ |
| 22 | Web desktop | Current Google web style | List or dashboard view | dark | |
| 23 | Web mobile (about 412 px wide) | Current Google web style | Landing page | light | |
| 24 | Web mobile | Current Google web style | Settings or form | light | |

Flutter and Compose outputs are both judged against the Android references; there is no
Flutter-specific first-party look. The owner may substitute screens, as long as these three conditions
still hold:
- every request type keeps at least one image;
- both platforms have a dark image;
- the ★ set covers six Android screens and six web screens.
