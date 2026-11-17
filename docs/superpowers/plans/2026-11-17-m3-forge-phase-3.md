# m3-forge Phase 3 (Skill, Assets and Verification) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development
> (recommended) or superpowers:executing-plans to implement this plan task by task. Steps use
> checkbox (`- [ ]`) syntax for tracking. Which method each sub-phase uses is set in
> "Execution method" below.

**Goal.** Build the `/material3` skill so that it closes the failures the Phase 2 baseline measured,
on web, Flutter and Jetpack Compose, and show it on a separate development request set, without
touching the eval requests or the hold-out.

**Architecture.**
- The skill is written test-first, the way superpowers:writing-skills describes. The RED evidence
  already exists: the baseline failure catalogue (verify v2 counts, judge v2 scores). Every skill
  rule, asset and check is traced to one failure ID (F1–F12, below). A mechanical failure is closed
  by an asset that makes the right thing the default, plus a verify check. Prose only carries the
  judgment calls.
- SKILL.md stays short: the flow, the hard rules and pointers. Values and APIs live in
  `references/core/` and `references/{web,flutter,compose}/`. Generated tokens, themes and
  components live in `assets/`, and the Node scripts in `scripts/`.
- Each sub-phase ends with a dev loop on `evals/dev/`: 4 small requests per platform, run headless
  with the skill installed, scored with the frozen v2 tools. The eval requests wait for Phase 4. The
  hold-out stays closed until the very end.

**Tech stack.** Node 22 (ESM, `node --test`); vendored `@material/material-color-utilities` 0.4.0;
Playwright 1.65.0 (already pinned); a pinned harfbuzz wasm subsetter and a pinned woff2 encoder;
Flutter stable and `material_ui` 1.11.0; Compose material3 1.5.0-rc01, AGP 9.5.1, Kotlin 2.4.21;
Robolectric and Roborazzi (harness only).

**Spec:** `docs/superpowers/specs/2026-11-12-m3-forge-design.md` (§3, §5, §7–§10, §15 Phase 3,
§16), the roadmap's carried items and standing rules
(`docs/superpowers/plans/2026-11-12-m3-forge-roadmap.md`), the Phase 2 ledger, and the baseline
evidence in `evals/runs/2026-11-17-baseline/` (summary.md, automated-v2.md, judge-v2.md).

## Global Constraints

- Speak Turkish with the owner; everything in the repo is English.
- Public commits: noreply author and committer; `node tools/guard/check-public-diff.mjs --staged`
  before every commit. The pre-push hook runs the guard and then the fast tests; it must pass and is
  never bypassed. Merge locally (fast-forward). Retarget stacked PRs to `main` before pushing main.
- Never read, list or search `evals/holdout/`.
- **Phase 3 never runs an eval request** (`evals/prompts/*`) with the skill. Dev runs use only
  `evals/dev/`. The eval set runs in Phase 4; the hold-out runs last.
- **The measurement tools stay frozen.** Rubric v2, judge v2 and automated items v2
  (`evals/frozen-v2.json`), harness v2 and the scored verify checks are not changed. New verify
  checks are allowed only when the baseline re-score is byte-identical (Task 9).
- **Numbers are never invented.** Every value in an asset comes from `knowledge/tokens/merged.json`
  through the resolution ladder (spec §3), or from library code marked as an implementation
  reference (`[impl:]`, never a token). Each ladder use is listed in `knowledge/not-found.md`.
- Precedence: `knowledge/README.md` (owner, 2026-11-13), including the exception for site values
  that both Flutter and Compose give.
- **Default color variant: tonal spot** for M3 and M3 Expressive alike. The MCU/Flutter variant
  named "expressive" is used only when a request names that variant. `references/core/color.md`
  and CHECKLIST.md say so.
- Motion values with no token, taken from library code, are "implementation reference" and are
  labeled so in references and assets.
- SKILL.md: under 200 lines (hard cap 500). It keeps the frontmatter fixed in spec §7. Scripts are
  called through their interpreter (`node "${CLAUDE_SKILL_DIR}/scripts/..."`), never by bare path.
- **Without Node or a platform SDK, the skill still writes the code.** It skips the steps that need
  the missing tool and names them in its report (spec §2, §7).
- **Offline:** fonts, icons and color work need no network. The only network use is an explicitly
  requested Rounded or Sharp icon style, which falls back to Outlined with the notice in spec §3.
- **Content in generated UIs is invented but credible:** product names, people, prices, dates and
  addresses fit the request. No lorem ipsum, `example.com/.org/.net`, "Acme", "John Doe",
  "Item 1", or stock-image URLs. No Google brand: no "Google", no Google product names, no Google
  logo, no copy of a Google product.
- Machine limits (15.5 GB RAM): one Gradle or Flutter build at a time. The Gradle limits in
  `tools/toolchain/gradle.properties` apply to dev runs too.
- Script paths with spaces (the repo lives in `Material Design 3`) are covered in every script test.

## Review Focus

1. **A rule that never reaches the output.** The skill loads, but its assets are not copied, or the
   model writes its own CSS or theme next to them. Task 16, 22 and 26 dev runs must show the assets
   in the generated project and zero F1–F7 counts. A check in `scripts/verify` that counts files
   copied from `assets/` but never imported is added in Task 9 (`asset-unused`, warning).
2. **No Node, or no SDK.** The skill must write the code, skip verify, icons subsetting and
   screenshots, and say which steps it skipped. A dev cell per platform runs with `node` removed
   from PATH (Tasks 16, 22, 26).
3. **Unknown icon names.** A ligature name that is not in the codepoints file renders as text on
   the web and fails silently on Flutter. `scripts/icons` refuses unknown names and suggests the
   closest ones (Task 8). Verify flags unknown ligatures in web markup (Task 9).
4. **The user's files.** An existing theme or a file with the same name is never overwritten.
   `install-assets` stops with exit 3 and lists the conflicts (Task 8). Dependency or Gradle changes
   happen only with consent. On Compose below 1.5, the skill offers the upgrade and otherwise uses
   classic APIs (Task 25).
5. **Overfitting to the eval set.** No eval request text, product name or screen layout leaks into
   the skill. A test fails when SKILL.md, CHECKLIST.md, references or assets contain a distinctive
   term from `evals/prompts/*.md` (Task 1).

## Failure map (writing-skills: every rule has a failing test behind it)

Baseline: 26 cells (web 9, Flutter 9, Compose 8), verify v2 counts and judge v2 means. F11 and F12
were counted for this plan with a grep of the private baseline code (cells with a hit).

| ID | Failure (baseline evidence) | Closed by: rule (where) | Closed by: asset or script | Checked by | Dev target |
|---|---|---|---|---|---|
| F1 | Off-grid spacing: 187 in 23 cells (web 84, Flutter 66, Compose 37) | `references/core/layout.md`: padding, gap and margin come only from the spacing scale; SKILL.md hard rule | Spacing scale from `md.sys.measurement` tokens: `--md-sys-space-*` in tokens.css, `M3Space` (Dart), `M3Space` (Kotlin) | verify `off-grid-spacing`; the skill treats this warning as must-fix | 0 |
| F2 | Hardcoded color: 60 in 20 cells (web 23, Flutter 17, Compose 20) | `references/core/color.md`: roles only; a brand color becomes the seed; status and chart colors come from roles or from harmonized custom colors | `scripts/color` writes the scheme (and `--custom` harmonized colors) into the platform theme file, which verify allowlists | verify `hardcoded-color` | 0 |
| F3 | Off-token type: 370 in 13 cells (web 362) | `references/core/typography.md`: text only through type-scale roles, emphasized roles for Expressive | tokens.css typescale variables and `.m3-type-*` classes; Flutter `TextTheme` and `M3EmphasizedType` extension; Compose `Typography` and emphasized styles | verify `off-token-type` | 0 |
| F4 | Off-token radius: 40 in 18 cells | `references/core/shape.md`: shape scale steps only, Expressive steps included | Shape variables and classes; Flutter shape constants; Compose `Shapes` (with `largeIncreased`, `extraLargeIncreased`, `extraExtraLarge`) | verify `off-token-radius` | 0 |
| F5 | Shadow or gradient: 48 in 16 cells (web 38) | `references/core/elevation.md`: hierarchy through surface-container roles and elevation levels; no gradients | Elevation level variables from tokens; component CSS uses them | verify `shadow-gradient` | 0 |
| F6 | Touch target under 48 dp: 139 in 16 cells (web 71, Compose 68) | `references/core/accessibility.md`; Compose reference: official components, `minimumInteractiveComponentSize()` on custom clickables | Web component CSS reserves a 48 px target on every interactive part | runtime `touch-target` (skill screenshot step; harness in dev runs) | 0 |
| F7 | Icon source: 493 in 26 cells (web 150 hand-drawn SVG, Flutter 231 legacy `Icons.*`, Compose 112 hand-drawn vectors); 0 of 277 vectors official | SKILL.md hard rule: icons only through `scripts/icons` output; platform icon references | Per-platform icon pipeline (see "Icon strategy") | verify `icon-source`, plus `unknown-icon` (Task 9) | 0 |
| F8 | Contrast: 3 in 3 cells | `references/core/color.md`: on-role pairs only; disabled excluded | Generated schemes carry the role pairs at standard, medium and high contrast | runtime `contrast`; role-pair check in `scripts/color` tests | 0 |
| F9 | Spacing-layout and overall polish judged low (v2 means: spacing web 2.11, Flutter 2.22, Compose 2.25; overall polish web 1.89, Flutter 2.00, Compose 2.13) | CHECKLIST.md recipes: one hero per screen, a fixed spacing rhythm per region, list and card density, no stub destinations | Component CSS and theme defaults with M3 padding and gaps | judge v2 on dev cells | each item ≥ 2.5, no score < 2 |
| F10 | Hierarchy-typography judged low (v2: web 2.44, Flutter 2.33) | CHECKLIST.md: the role per text level (display, headline, title, body, label) and when to use emphasized | Type-scale classes and theme styles | judge v2; verify F3 | ≥ 2.5 |
| F11 | Placeholder content: `example.com` addresses in 12 of 26 cells; drawn placeholder boxes for imagery | `references/core/content.md` (recipe: invent a product, its people, numbers and addresses; images as tokened shape containers) | — | verify `placeholder-content` (Task 9) | 0 |
| F12 | Google brand: "Google Pay" in 2 of 26 cells | SKILL.md hard rule; content reference lists the banned names | — | verify `brand` (Task 9) | 0 |

How each row is worked through (Tasks 10, 16, 22, 26):
- **RED** is the row's baseline evidence. A row with no evidence gets no rule.
- **GREEN:** the minimal rule, asset or check that closes it. The form follows the failure, as
  writing-skills says. Mechanical rows get an asset plus a check, and only a single line of prose. A
  row about the shape of the output (F9, F10, F11) gets a positive recipe, not a list of
  prohibitions.
- **Wording micro-tests** for F7, F11 and F12, the rows that shape behavior: 5 single-shot runs per
  wording, plus a no-guidance control, on one small component request in an isolated session.
  Every flagged hit is read by hand.
- **REFACTOR:** a dev run that still shows the failure gets its rationalization recorded in the
  ledger, then the rule is tightened. Each dev loop has at most 3 rounds.
- `tools/ci/skill-trace.mjs` (Task 10) checks the table mechanically. Every bullet in SKILL.md and
  CHECKLIST.md cites an ID (`F1`–`F12`, or `W` for workflow steps from spec §7). Every F row has at
  least one rule, and an asset or a check.

## Icon strategy

Common rules:
- The only icon sources are the official Material Symbols files at
  google/material-design-icons@10ecc14 (already pinned as `material-symbols-paths`). That is the
  variable font plus `codepoints`, and, on Compose, the official Android vector files. Nothing is
  drawn, converted or edited.
- **Default axes everywhere:** FILL 0 (FILL 1 for selected or active states), wght 400, GRAD 0,
  opsz 24. The verify index knows only this instance. On Compose, where icons are vectors, no other
  instance exists. Web and Flutter use the font and could set other axes. The skill does so only
  when the request asks, and says that Compose cannot follow.
- Icon names are checked against the `codepoints` file before use.

| | Web | Flutter | Compose |
|---|---|---|---|
| Form | Ligature font: `<span class="m3-icon">settings</span>` with `font-variation-settings` | `IconData` constants in a generated `m3_symbols.dart` over the bundled TTF; `Icon(fill:, weight:, grade:, opticalSize:)` | Official Android vector drawables, copied unchanged: `res/drawable/m3s_<name>.xml` and `m3s_<name>_fill1.xml`, used with `Icon(painterResource(...), contentDescription)` |
| Source in the skill | `assets/fonts/MaterialSymbolsOutlined.woff2` (3.82 MB) and `codepoints` (79,421 B) | `assets/fonts/MaterialSymbolsOutlined.ttf` (10,744,832 B) and `codepoints` | `assets/icons/symbols-outlined-24.tsv`: every Outlined icon (4,157) at default axes, FILL 0 and FILL 1, path data only (measured: 5.39 MB as JSON; 0.96 MB gzip, which is about its size in git history) |
| What goes into the user's project | A subset woff2 with only the used icons and all axes (`scripts/icons`, pinned harfbuzz wasm). Without Node, the full woff2, and the report says so | The full TTF. Flutter's icon tree-shaking subsets it in release builds; Task 18 checks that the variable axes survive. If they don't, the report says to build with `--no-tree-shake-icons` and names the size | Only the used icons, about 1 KB each; no font in the APK |
| Offline | Yes | Yes | Yes |
| Without Node | Full woff2; names checked by grep in `codepoints` | Constants written by hand from `codepoints` (short hex values) | Path lines pulled from the TSV with a documented `awk` or PowerShell `Select-String` one-liner into the XML template. Path data is never retyped by the model |
| Rounded or Sharp on request | Download of that style's woff2 at the pinned commit, checked against the SHA-256 in `versions.json`; fallback to Outlined with the spec §3 notice | Same, with the TTF | Download of the used icons' XML at the pinned commit; each path must hash into `symbols-paths.json` (it holds Rounded and Sharp too); fallback to Outlined with the notice |

**Why Compose uses vectors, from a bundled full set** (owner decision needed: this changes spec §10,
which picked a font-based `M3Icon` for Compose):
- `Icon(painter)` is the platform idiom that every M3 component slot expects. It tints from
  `LocalContentColor` and carries `contentDescription`. It needs no `FontVariation` code and no
  10.7 MB font in the APK.
- Robolectric renders vector drawables reliably. Variable-font axes in Compose screenshots have not
  been shown.
- The baseline already drew vectors on Compose (112 hand-drawn icons in 8 cells). The skill turns
  that habit to the official data, which verify v2 accepts.
- **A bundled full set, not a subset:** the spec requires offline generation. A subset cannot know
  which icons a request needs, and a miss would need the network or a wrong icon.
- **Not a download either:** the full Outlined set costs about 1 MB in git history and 5.4 MB on
  disk. Plain TSV, rather than a compressed file, keeps the no-Node path to a one-line shell
  extraction.

**Skill size** (on disk; all bundled files are listed with SHA-256 in `versions.json`):

| File | Bytes |
|---|---|
| RobotoFlex TTF | 1,787,292 |
| Roboto `[wdth,wght]` TTF | 488,584 |
| Roboto Flex woff2 | measured in Task 11 |
| Symbols TTF | 10,744,832 |
| Symbols woff2 | about 3.82 MB |
| codepoints | 79,421 |
| Compose TSV | about 5.4 MB |
| Verify index | 347,226 |
| harfbuzz wasm, woff2 encoder, MCU | measured in their tasks |

`tools/ci/skill-size.mjs` (Task 3) prints the total and fails above 25 MB.

## Development request set (`evals/dev/`)

The dev set is written in Task 1. It has 4 requests, each a screen type the eval set does not use:
- a podcast player (now playing plus queue);
- an expense report form (line items, receipts, dates, totals);
- a plant-shop catalog (search, filters, product grid, cart badge);
- a clinic day schedule. This one gives almost no content, so the content rule (F11) is tested.

Cells, 4 per platform:

| Request | Web | Flutter | Compose |
|---|---|---|---|
| podcast-player | web-empty, default | flutter-material_ui, default | compose-1.5, default |
| expense-report | web-react, seed `#2F6F5E` | flutter-legacy, classic | compose-1.5, seed `#2F6F5E` |
| plant-shop | web-vue, classic | flutter-material_ui, seed `#2F6F5E` | compose-1.5, classic |
| clinic-schedule | web-empty, default | flutter-material_ui, default | compose-1.5, default |

- The fixtures are reused from `evals/fixtures/`. They are project skeletons, not requests.
- Dev runs are scored like Phase 4 but never pooled with it. Records go to
  `private/evals/runs/dev-*`, and summaries to `evals/runs/dev-*/summary.md`.
- Dev gate per platform:
  - every cell `buildOk`;
  - zero F1–F8, F11 and F12 findings;
  - judge v2 mean ≥ 2.5 on each judged item, and no single score below 2.
- If the gate is not met after 3 dev rounds, stop and report the remaining gaps.

---

## 3a: Shared core

### Task 1: Dev request set and overfitting guard

**Files:**
- Create: `evals/dev/{podcast-player,expense-report,plant-shop,clinic-schedule}.md`,
  `evals/dev/cells.json`, `evals/dev/README.md`
- Create: `tools/ci/overfit.mjs`, `tools/ci/test/overfit.test.mjs`
- Modify: `evals/tools/run-cell.mjs` (`buildPrompt` reads the request from the cell's set)

**Interfaces:**
- Produces: `devCells(): Cell[]` (`evals/dev/cells.json`; same shape as `evals/cells.json`, plus
  `set: 'dev'`); `distinctTerms(markdown: string): string[]` (capitalized product names,
  quoted UI strings and numbers with units); `overfitHits(skillDir, promptsDir): {file, term}[]`.

- [ ] Write `overfit.test.mjs`:
  - `distinctTerms` on `evals/prompts/settings.md` contains `Pocketbook` and `3 linked`;
  - `overfitHits` is empty for the current `plugin/skills/material3`;
  - a temporary skill copy with a references file mentioning `Pocketbook` gives one hit;
  - no dev request shares a distinct term with an eval request;
  - `evals/dev/cells.json` has 12 cells, 4 per platform, with classic and seed `#2F6F5E` on each
    platform;
  - `#2F6F5E` differs from `#B5651D`.
- [ ] Run it: FAIL (no module).
- [ ] Write the four requests: English, 6–12 lines each, in the style of `evals/prompts/`. Each
  names an invented product except clinic-schedule, which gives a screen purpose and one sentence of
  context only.
- [ ] Write `cells.json` and `README.md`. The README says what the set is for, that the eval and
  hold-out sets are not used before Phase 4, and how to add a request without overlap.
- [ ] Implement `overfit.mjs` with a CLI: `node tools/ci/overfit.mjs` exits 1 and lists the hits.
  Add it to CI (`.github/workflows/ci.yml`, after `npm test`).
- [ ] Run the tests: PASS. Commit: `feat(evals): dev request set and overfitting guard`.

### Task 2: With-skill run mode and dev pipeline

**Files:**
- Modify: `evals/tools/run-cell.mjs`, `evals/tools/isolation.mjs`, `evals/tools/pipeline.mjs`,
  `evals/tools/canary.mjs`
- Test: `evals/tools/test/run-cell.test.mjs`, `evals/tools/test/isolation.test.mjs`

**Interfaces:**
- Consumes: `devCells()` (Task 1).
- Produces:
  - `runCell({ ..., skillDir?: string, noNode?: boolean })`. With `skillDir`, the skill is copied
    to `<cfgDir>/skills/material3/`. The prompt becomes
    `/material3 <request>\n\n<style>\n\n<where>`.
  - `checkInit` gets `allowedSkills: ['material3']`.
  - `SUSPECT_NAME` stops matching `material3` only when `allowedSkills` names it.
  - Reads under the installed skill folder are allowed in `settingsFor` and in the audit's
    `allowRoots`.
  - `pipeline.mjs --set dev --skill plugin/skills/material3 --run-id dev-<date>-<platform>-r<n>
    --cells ...`; `--no-node` passes `noNode: true` to every cell.

- [ ] Tests, written first:
  - the settings for a skill run allow reads under `<cfgDir>/skills/material3` and nothing else
    new;
  - an init event that lists only `material3` passes, and one that also lists another skill fails;
  - `buildPrompt` for a skill run starts with `/material3 `;
  - with `noNode`, the child PATH has no directory that contains `node(.exe)`, and the toolchain's
    Flutter and Java stay;
  - `preflight` accepts a cfgDir that holds `settings.json` and `skills/material3/` only.
- [ ] Implement. Check whether `/material3` in `-p` mode needs the `Skill` tool. If it does,
  remove `Skill` from `DISALLOWED_TOOLS` only in skill runs. Record the finding in the ledger.
- [ ] Canary: a skill-run canary with a stub skill whose SKILL.md says "reply OK". Pass means:
  - init lists exactly `material3`;
  - 3 of 3 reads outside the work folder and the skill folder are denied;
  - the reply is `OK`.
- [ ] Commit: `feat(evals): with-skill run mode for dev runs`.

### Task 3: versions.json, bundled fonts and licenses

**Files:**
- Create: `plugin/skills/material3/versions.json`, `plugin/skills/material3/assets/fonts/**`
  (RobotoFlex, Roboto, MaterialSymbolsOutlined TTF and woff2, `codepoints`, OFL and Apache
  license texts)
- Create: `tools/build/sync-versions.mjs`, `tools/ci/skill-size.mjs`, and their tests
- Modify: `NOTICE`, `tools/guard/allowlist.txt` (font binaries, with a reason),
  `.github/workflows/ci.yml`

**Interfaces:**
- Produces:
  - `versions.json`: `{ compose: { material3, agp, kotlin, gradle, compileSdk }, flutter: {
    materialUi }, mcu, symbols: { commit }, fonts: [{ file, sha256, bytes, source }], tools: [{
    name, version, sha256 }] }`;
  - `syncVersions({ check: boolean }): string[]`, which lists the files that differ from
    `versions.json`: `evals/fixtures/compose-1.5/gradle/libs.versions.toml`, the harness sample
    catalog, and `assets/compose/template/` after Task 23;
  - `skillSize(dir): { bytes, files }`.

- [ ] Tests:
  - every font file's SHA-256 matches `versions.json` and `tools/toolchain/fonts.json`;
  - `syncVersions({ check: true })` is empty on the repo, and non-empty after a temporary catalog
    edit;
  - `skillSize` of the skill is at most 25 MB.
- [ ] Copy the fonts from `%USERPROFILE%\.m3-toolchain\fonts`, the TTFs already verified there.
  Download the Symbols woff2 at the pinned commit and verify it.
- [ ] NOTICE lists each font and its license file.
- [ ] CI runs `sync-versions --check` and `skill-size`.
- [ ] Commit: `feat(skill): versions.json and bundled fonts`.

### Task 4: Token build for the skill

**Files:**
- Create: `tools/build/tokens.mjs`, `tools/build/ladder.mjs`, `tools/build/test/tokens.test.mjs`
- Create (generated): `plugin/skills/material3/tokens/{sys,comp}.json`
- Modify: `tools/extract/tokens/report.mjs` (ladder uses go into `not-found.md`)

**Interfaces:**
- Consumes: `knowledge/tokens/merged.json`.
- Produces:
  - `resolveToken(id: string, platform: 'web'|'flutter'|'compose'): { value, provenance:
    'own'|'cross-source:<repo>'|'derived:<sys-token>'|'library-default' } | null`;
  - `buildSkillTokens(): { sys, comp }` with per-value provenance;
  - `node tools/build/tokens.mjs [--check]`.

- [ ] Tests:
  - `md.sys.shape.corner.large-increased` resolves to 20 on all three platforms;
  - a token that is NOT FOUND on Flutter but present in Compose resolves with
    `cross-source:compose-material3`;
  - a component color token missing everywhere resolves `derived:` to its mapped role;
  - nothing returns a number that is not in `merged.json`;
  - `--check` fails on a stale file;
  - every ladder use appears in `not-found.md`;
  - `tokens/*.json` total at most 1.5 MB.
- [ ] Implement it, then commit the generated files.
- [ ] CI: `node tools/build/tokens.mjs --check`.
- [ ] Commit: `feat(build): skill tokens with the resolution ladder`.

### Task 5: Token emitters per platform

**Files:**
- Create: `tools/build/emit/{web,flutter,compose}.mjs`, `tools/build/test/emit.test.mjs`
- Create (generated): `assets/web/tokens.css`; `assets/flutter/lib/m3/{tokens,type,shape,space,
  motion}.dart`; `assets/compose/theme/{Type,Shape,Space,Motion}.kt`

**Interfaces:**
- Consumes: `buildSkillTokens()`.
- Produces:
  - CSS custom properties `--md-sys-{color,typescale,shape,elevation,motion,state,space}-*`;
  - Dart `M3Space`, `M3Shapes`, `M3EmphasizedType` (`ThemeExtension`) and `M3Motion` (springs);
  - Kotlin `M3Space` and the emphasized `TextStyle`s.
  - Classic M3 on request: tokens.css scopes the Expressive-only values (shape steps, emphasized type,
    expressive springs) so that `[data-m3-style="classic"]` on the root falls back to the standard
    set; Dart and Kotlin emit both motion schemes.
  - Color is not emitted here: `scripts/color` writes it (Task 6).

- [ ] Tests:
  - every value in each emitted file traces to a `tokens/*.json` entry (parse the file back and
    compare);
  - the spacing steps are exactly the `md.sys.measurement` steps;
  - the shape steps equal `scripts/verify/shape-scale.json`;
  - verify run on a sample that uses only the emitted names reports zero F1/F3/F4/F5 findings, and
    the emitted files are recognized as theme files (allowlisted);
  - `--check` fails when stale.
- [ ] Implement it, then commit the generated files.
- [ ] Commit: `feat(build): token emitters for web, Flutter and Compose`.

### Task 6: Color script and precomputed schemes

**Files:**
- Create: `plugin/skills/material3/scripts/color/{index.mjs,vendor/mcu/**}`, `scripts/color/test/`
- Create (generated): `plugin/skills/material3/tokens/precomputed-schemes.json`
- Create: `tools/build/precompute-schemes.mjs`

**Interfaces:**
- Produces:
  - `scheme({ seed, variant = 'tonalSpot', contrast: 0|0.5|1, dark }): Record<role, '#RRGGBB'>`;
  - `writeTheme({ platform, seed, variant, out, custom?: Record<name, '#RRGGBB'> }): { seedRequested,
    seedUsed, exact: true }`;
  - `nearest(seedHex): { seed, hue, chroma }` (by hue, then chroma).
  - CLI: `node scripts/color/index.mjs --seed #hex [--variant v] --platform p --out file [--custom
    name=#hex]`.
- The precomputed grid: the baseline seed, plus 24 hues × chroma 24, 48 and 72. Variants: tonal
  spot plus every MCU variant the color reference names. Light and dark, at three contrast levels.

- [ ] Tests:
  - the vendored MCU files match the pinned 0.4.0 archive (SHA-256);
  - `scheme` for the baseline seed equals the values in `knowledge/tokens/color-system.json`;
  - every on-role pair at standard contrast reaches ≥ 4.5:1 (text roles);
  - `#B5651D` and `#2F6F5E` are not grid seeds;
  - `nearest('#B5651D')` is deterministic;
  - `--custom` output is harmonized (hue moved toward the seed);
  - the emitted Flutter and Compose theme files compile in the harness sample apps
    (`M3_TOOLCHAIN_TESTS=1`);
  - the precomputed file is at most 1.5 MB.
- [ ] Implement it, then commit the generated file.
- [ ] Commit: `feat(skill): color script and precomputed schemes`.

### Task 7: Detect script

**Files:** Create `plugin/skills/material3/scripts/detect/index.mjs` and its tests (samples in
`test/samples/`).

**Interfaces:**
- Produces `detect(dir): { platform: 'web'|'flutter'|'compose', framework: 'react'|'vue'|'svelte'|
  'plain'|null, flutterLibrary: 'material_ui'|'material'|null, flutterVersion, composeMaterial3,
  belowExpressive: boolean, themeFiles: string[], empty: boolean, tools: { node, playwright,
  flutter, java, androidSdk } }`.

- [ ] Tests run against copies of all six fixtures:
  - web-empty → plain, empty;
  - web-react → react;
  - web-vue → vue;
  - flutter-material_ui → material_ui;
  - flutter-legacy → material;
  - compose-1.5 → material3 1.5.0-rc01, `belowExpressive` false;
  - a temporary copy pinned to 1.4.0 → `belowExpressive` true;
  - an explicit platform argument overrides detection;
  - `tools` reflects a PATH without node or flutter;
  - a fixture path containing spaces works.
- [ ] Implement it. Commit: `feat(skill): detect script`.

### Task 8: install-assets and icons core

**Files:**
- Create: `plugin/skills/material3/scripts/install-assets/index.mjs`,
  `plugin/skills/material3/scripts/icons/{index.mjs,names.mjs}` and their tests

**Interfaces:**
- Produces:
  - `installAssets({ projectDir, platform, parts: string[], dest }): { copied: string[], identical:
    string[], conflicts: string[] }`. Exit 3 on conflicts; nothing is copied when any conflict
    exists.
  - `checkNames(names): { known: string[], unknown: [{ name, suggestions: string[] }] }`, using the
    `codepoints` file and edit distance.
  - `icons({ projectDir, platform, names, style = 'outlined', fill: [0,1] })`. Its platform back
    ends come in Tasks 14, 18 and 24. Exit 4 on unknown names.

- [ ] Tests:
  - a second run reports only `identical`;
  - an edited destination file is a conflict and is left unchanged;
  - `checkNames(['settings', 'setings'])` gives one unknown, with `settings` as the first
    suggestion;
  - paths with spaces work;
  - no network access is attempted for Outlined (the test runs with `HTTPS_PROXY` pointing to a
    closed port).
- [ ] Implement it. Commit: `feat(skill): install-assets and icon name checks`.

### Task 9: Verify additions (skill-side; scored checks unchanged)

**Files:**
- Modify: `plugin/skills/material3/scripts/verify/{common,web,flutter,compose}.mjs` and their tests
- Test: `evals/tools/test/rescore-unchanged.test.mjs`

**Interfaces:**
- Produces new checks, all left out of `automatedScores`:
  - `placeholder-content` (error): `example.(com|org|net)`, lorem ipsum, `Acme`, `John Doe` or
    `Jane Doe`, `foo`/`bar` in UI strings, `Item \d+` labels, and stock-image hosts;
  - `brand` (error): `Google` and the Google product names listed in `references/core/content.md`,
    in UI strings and asset names;
  - `unknown-icon` (error): a web ligature or a Flutter `M3Symbols.x` name that is not in
    `codepoints`;
  - `asset-unused` (warning): a file copied from the skill's assets that no source imports.
- The theme-file allowlist gains the generated theme files from Tasks 5 and 6.

- [ ] For each check, write a hit sample and a clean sample, then watch the hit samples fail.
  The clean samples include an email hint at an invented product domain and a "Pay" button with no
  brand.
- [ ] Implement the checks.
- [ ] `rescore-unchanged.test.mjs`: re-running `rescore-automated.mjs` on the recorded baseline
  data (or on the committed counts, when the private repo is absent) gives `automated-v2.json`
  byte for byte. This proves the scored instrument did not move.
- [ ] Commit: `feat(verify): content, brand, unknown-icon and unused-asset checks (not scored)`.

### Task 10: SKILL.md, CHECKLIST.md and references/core

**Files:**
- Modify: `plugin/skills/material3/SKILL.md`
- Create: `plugin/skills/material3/CHECKLIST.md`
- Create: `plugin/skills/material3/references/core/{color,typography,shape,elevation,layout,motion,
  states,accessibility,expressive,content,anti-patterns}.md` and `references/core/components/*.md`
  (only the components the assets cover)
- Create: `tools/ci/skill-trace.mjs` and its test; `evals/tools/microtest.mjs`
- Modify: `tools/ci/validate-plugin.mjs` (line limits)

**Interfaces:**
- SKILL.md sections, in order:
  1. request reading;
  2. detect;
  3. which references to load;
  4. theme (color script, install-assets, fonts, icons); an existing role-based theme
     (`detect().themeFiles`) is extended, not replaced;
  5. build, with the hard rules (F1–F8, F11, F12, one line each);
  6. the verify loop;
  7. screenshots;
  8. the report template, which names the color source, the checks that ran and the checks that
     were skipped, with the reason for each skip;
  9. the "No Node / no SDK / offline" table.
- `skillTrace(skillDir): { untagged: string[], uncovered: string[] }`.

- [ ] Write `skill-trace.test.mjs`:
  - the real skill has no untagged rule bullets and no uncovered F row;
  - a temporary copy with an untagged bullet fails;
  - a temporary copy where F11 has a rule but no check fails;
  - SKILL.md is under 200 lines;
  - no reference repeats a value from `tokens/` by hand (values are named, not copied: the test
    looks for hex colors and dp numbers outside fenced token tables generated by Task 5).
- [ ] Write references/core from `knowledge/guidance/` in our own words. Each value line keeps its
  `[token:]` or `[impl:]` marker. The guard's 12-word check must pass.
  - `color.md` states the tonal-spot default and the "expressive variant is not the Expressive
    style" rule.
  - `content.md` is a recipe: invent the product, the people (names from several cultures), the
    numbers (plausible ranges, currency and date formats for the request's locale), and emails at
    the invented product's own domain. Imagery uses tokened shape containers with a Symbols icon,
    never a URL. It lists the banned brand names.
- [ ] Wording micro-tests, as `evals/tools/microtest.mjs`. Each one is a `runCell` with
  `promptOverride` on a single-file fixture, 5 runs per wording plus a no-guidance control:
  - F7: "add a settings row with a bell icon";
  - F11: "add a sign-up form for a newsletter";
  - F12: "add payment method choices".
  - Record the counts and the hits read by hand in `evals/runs/dev-microtests/summary.md`.
  - Keep a wording only if it beats the control with no regression.
- [ ] Commit: `feat(skill): SKILL.md, CHECKLIST.md and core references`.

**3a checkpoint (STOP for owner review).** Evidence:
- the test suite;
- the skill-trace output;
- the micro-test table;
- the canary;
- the skill size;
- the ladder uses added to `not-found.md`;
- the cost of each paid run.

---

## 3b: Web

### Task 11: tokens.css completion, motion and fonts

**Files:** `tools/build/emit/web.mjs`, `tools/build/spring-linear.mjs`,
`assets/web/{tokens.css,fonts.css,fonts/RobotoFlex.woff2}`, plus tests.

**Interfaces:**
- `springToLinear({ damping, stiffness }, { samples = 64, epsilon = 0.001 }):
  { easing: string /* linear(...) */, durationMs: number }`. It uses the analytic damped-spring
  solution and ends when the motion stays within `epsilon` of the target.
- `fonts.css` declares `@font-face` for Roboto Flex (woff2, all axes) and Material Symbols, with
  relative URLs.

- [ ] Tests:
  - every spring token becomes a `linear()` that starts at 0 and ends at 1;
  - its overshoot matches the analytic maximum within 0.001;
  - durations are derived, never typed in;
  - the Roboto Flex woff2 has the same `fvar` axes as the TTF (read the table directory);
  - its encoder is pinned in `versions.json` with a SHA-256.
- [ ] Implement it. Commit: `feat(web): motion easing from spring tokens, fonts`.

### Task 12: Component CSS (three groups, each with a gallery page)

**Files:**
- `assets/web/components/*.css`
- `harness/web/gallery/{actions,containment,navigation}.html` (repo-side only)
- `tools/build/test/web-components.test.mjs`

Groups:
- **12a, actions:** button (5 kinds × 5 sizes, toggle), icon button, FAB, extended FAB, button
  group (standard and connected), split button, segmented button.
- **12b, containment and inputs:** card (3), list, chips (4), text field (2), checkbox, radio,
  switch, slider, divider, badge.
- **12c, navigation and overlays:** top app bar (small, medium and large flexible), navigation
  bar, navigation rail, navigation drawer, tabs, dialog, bottom sheet, menu, snackbar, tooltip,
  search, progress (linear and circular, wavy), loading indicator.

**Interfaces:**
- Class names `m3-<component>` and `m3-<component>--<variant>`.
- States via `:hover`, `:focus-visible`, `:active`, `[aria-pressed]`, `[aria-selected]` and
  `:disabled`.
- Every property value is a `var(--md-…)` or `0`.

- [ ] For each group:
  - write the gallery page;
  - write the test: verify on the CSS and the gallery shows zero F2–F5 findings; the runtime
    capture of the gallery (harness v2, light and dark, both viewports) shows zero touch-target and
    contrast findings, with disabled parts excluded; every comp token used exists in `tokens.css`;
  - implement;
  - read the screenshots;
  - commit (`feat(web): <group> components`).
- [ ] Components missing from material-web tokens follow the ladder. Each use is listed.

### Task 13: behaviors.js

**Files:** `assets/web/behaviors.js` (dependency-free, under 8 KB unminified target) and its tests
(Playwright, `M3_TOOLCHAIN_TESTS=1`).

**Interfaces:**
- `M3.ripple(root)`, `M3.dialog(el).open()/close()` (focus trap and restore), `M3.menu(button,
  menu)`, `M3.motion(el, keyframes, 'spatial-fast'|...)` (WAAPI with the Task 11 easing). It
  honors `prefers-reduced-motion`.

- [ ] Tests:
  - focus moves into an open dialog and returns on close;
  - Escape closes a menu;
  - the ripple does nothing under reduced motion;
  - no global name other than `M3`.
- [ ] Implement it. Commit: `feat(web): behaviors.js`.

### Task 14: Web icons

**Files:** `scripts/icons/web.mjs`, `scripts/icons/vendor/hb-subset.wasm` (pinned, SHA-256 in
`versions.json`), and tests.

**Interfaces:**
- `webIcons({ projectDir, names, dest }): { woff2: string, bytes: number, subset: boolean }`.
  Without the wasm or without Node, the skill copies the full woff2 (`subset: false`).

- [ ] Tests:
  - the subset keeps the FILL, wght, GRAD and opsz axes;
  - it has a glyph for each requested ligature, and no glyph for a ligature that was not asked
    for;
  - a page using the subset renders `settings` with FILL 0 and 1 (Playwright, toolchain);
  - the subset of 20 icons is at most 10% of the full woff2.
- [ ] Implement it. Commit: `feat(web): Material Symbols subsetting`.

### Task 15: references/web and the screenshot step

**Files:**
- `references/web/{setup,components,frameworks,icons}.md`
- `scripts/screenshot/{index,web}.mjs` and tests

**Interfaces:**
- `screenshot({ projectDir, platform, out }): { ran: boolean, skippedReason?: string, shots:
  string[], runtime: { contrast: [], targets: [] } }`. On the web, it uses the project's or the
  global Playwright when it resolves. Otherwise it skips with a reason. Output goes to a temporary
  folder, never into the project.
- `frameworks.md`: thin wrappers in React, Vue and Svelte over the shared CSS classes. One
  example per framework.

- [ ] Tests:
  - without Playwright, `ran: false` with the reason;
  - with it, 4 shots (2 viewports × 2 themes) and a runtime object in the shape verify reads;
  - nothing is written into `projectDir`.
- [ ] Implement it. Commit: `feat(web): web references and screenshot step`.

### Task 16: Web dev loop (RED → GREEN → REFACTOR), then the 3b checkpoint

- [ ] Run the 4 web dev cells (`pipeline.mjs --set dev --skill ...`). Report the first cell's
  time and cost before running the rest.
- [ ] Run one more cell (podcast-player, web-empty) with `noNode`.
- [ ] Score with verify v2 plus the Task 9 checks and judge v2 (blind, fresh judge).
- [ ] For each finding: name its F row, the rationalization or missing asset, and the change.
  Change only the skill, never the dev requests.
- [ ] At most 3 rounds. Ledger every change with its F row.
- [ ] Write `evals/runs/dev-web/summary.md` (per round: counts, judged means, cost).
- **3b checkpoint (STOP):**
  - dev summary;
  - gallery screenshots (private, with a public list);
  - icon subset sizes;
  - no-Node report excerpt;
  - suite and CI status.

---

## 3c: Flutter

### Task 17: Flutter theme and library switch

**Files:**
- `assets/flutter/lib/m3/{theme.dart,schemes.dart (written by scripts/color)}`
- `references/flutter/{setup,theme}.md`
- Golden tests in `harness/flutter/test/m3_theme_test.dart`

**Interfaces:**
- `M3Theme.light(scheme)` and `M3Theme.dark(scheme)` return a `ThemeData` with the color scheme,
  the text theme, the shapes, `M3EmphasizedType` and the expressive style flag
  (`StyleVariant.material3Expressive` on `material_ui`).
- One source tree. `install-assets` rewrites only the import line
  (`package:material_ui/material_ui.dart` or `package:flutter/material.dart`).

- [ ] Tests:
  - the theme compiles and renders under both imports (toolchain);
  - verify on the assets reports zero findings (they count as theme files);
  - a golden of a sample screen in light and dark (local images only; references come in Phase 4
    CI).
- [ ] Implement it. Commit: `feat(flutter): theme and library switch`.

### Task 18: Flutter icons

**Files:** `scripts/icons/flutter.mjs`, `references/flutter/icons.md`, and tests.

**Interfaces:**
- `flutterIcons({ projectDir, names }): { dartFile: 'lib/m3/m3_symbols.dart', pubspecEdit: string
  /* fonts entry, shown to the user before it is applied */ }`. Constants are `static const
  IconData settings = IconData(0x…, fontFamily: 'MaterialSymbolsOutlined')`.

- [ ] Tests:
  - the codepoints in the generated constants match the `codepoints` file;
  - a golden shows `settings` with fill 0 and 1 at weights 400 and 700 (toolchain);
  - verify reports zero `icon-source` findings on the sample.
- [ ] **Tree-shake check:** `flutter build web --release` on the sample (`flutter create
  --platforms web` in a temporary folder). Read the `fvar` axes of the subset font. Record in the
  ledger and `references/flutter/icons.md` either "axes kept" or "axes lost: build with
  `--no-tree-shake-icons`" with the measured sizes.
- [ ] Commit: `feat(flutter): Material Symbols constants`.

### Task 19: Gap components, priority 1

**Files:** `assets/flutter/lib/m3/expressive/*.dart`, `references/flutter/coverage.md`, and
goldens for both imports.

The priority list, ranked by how often the dev and eval screen types need each piece:
1. Emphasized type (done in Task 5) and the expressive motion switch (`M3Motion`, Springs).
2. LoadingIndicator, for loading and empty states.
3. ButtonGroup, standard and connected.
4. FAB menu.
5. SplitButton.
6. Floating and docked toolbar.
7. Wavy progress.
8. Flexible app bar with a subtitle.

Priority 1 is items 1–3; priority 2 is items 4–6 (Task 20); priority 3 (items 7–8) is listed in
`coverage.md` as not built in v1 unless a dev run needs it.

**Interfaces:** each widget mirrors the Compose API names where Flutter idiom allows
(`M3ButtonGroup(children:, connected:)`, `M3LoadingIndicator(contained:)`). It uses only official
widgets, `material_ui` primitives (`MaterialShapes`, `Springs`) and our tokens.

- [ ] For each widget:
  - write a golden test (light, dark, each state);
  - write a verify-clean test;
  - write a semantics test (48 dp targets);
  - implement;
  - read the goldens;
  - commit.
- [ ] `coverage.md` has a table of official vs ours, with the `material_ui` version at which the
  official widget should replace ours.

### Task 20: Gap components, priority 2

Same steps as Task 19 for FAB menu, SplitButton and the toolbars. One commit per widget.

### Task 21: Scaffolding and references/flutter

**Files:**
- `references/flutter/{components,scaffold}.md`
- `scripts/screenshot/flutter.mjs`
- `assets/flutter/scaffold/` (the minimal project for when no SDK is present)

**Interfaces:**
- With the SDK: `flutter create` with pinned template options, then theme. Use `material_ui` on
  Flutter ≥ 3.47.
- Without the SDK: write the minimal project, plus the one-line `flutter create .` instruction.
- `screenshot` for Flutter writes a temporary golden test outside the project and runs it. It
  reports `ran: false` without the SDK.

- [ ] Tests:
  - the scaffold without the SDK passes `flutter analyze` later (toolchain);
  - screenshot leaves the project unchanged;
  - on a project on Flutter ≥ 3.50 that uses `flutter/material.dart`, the report mentions
    `dart fix --apply --code=migrate_design_widgets` and changes nothing.
- [ ] Commit: `feat(flutter): scaffolding and screenshot step`.

### Task 22: Flutter dev loop, then the 3c checkpoint

- [ ] Same as Task 16, with the 4 Flutter dev cells and one no-Node run (plant-shop,
  flutter-material_ui).
- [ ] Builds run one at a time.
- **3c checkpoint (STOP):**
  - dev summary;
  - gap-component goldens;
  - the tree-shake finding;
  - coverage table.

---

## 3d: Compose

### Task 23: Compose theme templates and project template

**Files:**
- `assets/compose/theme/{Color.kt (scripts/color), Theme.kt, Type.kt, Shape.kt, Space.kt,
  Motion.kt}`
- `assets/compose/template/` (single module; versions from `versions.json` via
  `sync-versions`)
- `references/compose/{setup,theme}.md`

**Interfaces:**
- `M3Theme(darkTheme, content)` uses `MaterialExpressiveTheme` with `MotionScheme.expressive()` on
  material3 ≥ 1.5. Below 1.5 it uses `MaterialTheme`, with a comment that names the missing APIs.
- `MaterialShapes` and `LoadingIndicator` uses carry `@OptIn(ExperimentalMaterial3ExpressiveApi::
  class)` with a one-line comment.

- [ ] Tests:
  - the template builds (`assembleDebug`, toolchain, Gradle limits);
  - a Roborazzi capture of a sample screen in light and dark;
  - verify reports zero findings on the theme (theme files);
  - `sync-versions --check` covers the template.
- [ ] Commit: `feat(compose): theme templates and project template`.

### Task 24: Compose icons (vectors)

**Files:**
- `tools/build/symbols-tsv.mjs` (maintainer tool; reads the pinned sparse checkout)
- `assets/icons/symbols-outlined-24.tsv`
- `scripts/icons/compose.mjs`
- `references/compose/icons.md` (the no-Node one-liners)
- Tests.

**Interfaces:**
- TSV line: `<name>\t<fill0 paths joined by |>\t<fill1 paths joined by |, or = when identical>`.
- `composeIcons({ projectDir, names, style }): { files: string[] }` writes
  `res/drawable/m3s_<name>.xml` and `_fill1.xml` from the official XML template: viewport 960,
  24 dp, `?attr/colorControlNormal` tint.

- [ ] Tests:
  - the TSV has 4,157 lines;
  - every path in it hashes into `symbols-paths.json`;
  - a generated drawable passes verify `icon-source`, and the same drawable with one coordinate
    edited fails;
  - the `awk` and PowerShell one-liners produce byte-identical XML to the Node output (sh in CI,
    PowerShell locally);
  - a Rounded download is rejected when a path does not hash (stubbed fetch);
  - offline Rounded falls back to Outlined with the notice;
  - a Roborazzi capture shows the `settings` icon filled and unfilled (toolchain).
- [ ] Commit: `feat(compose): official Material Symbols vector icons`.
- [ ] Record the owner decision on the spec §10 change in the spec's decision log. This needs the
  owner's approval of this plan.

### Task 25: references/compose, version handling and screenshots

**Files:** `references/compose/{components,expressive,versions}.md`,
`scripts/screenshot/compose.mjs`, and tests.

**Interfaces:**
- `screenshot` for Compose runs only when the project already applies Roborazzi or Compose
  screenshot testing. Otherwise `ran: false` with "offer to add it".
- On `belowExpressive`, the skill reports "Expressive needs material3 1.5, offer the upgrade" and
  never edits Gradle without consent.

- [ ] Tests:
  - the 1.4.0 fixture copy is unchanged after a dry run of the install step;
  - screenshot leaves no files in the project.
- [ ] Commit: `feat(compose): references, version handling, screenshot step`.

### Task 26: Compose dev loop, then the 3d checkpoint

- [ ] Same as Task 16, with the 4 Compose dev cells (one at a time) and one no-Node run.
- **3d checkpoint (STOP):**
  - dev summary;
  - Roborazzi shots;
  - icon sizes;
  - memory peaks.

### Task 27: Phase 3 evidence, then STOP

- [ ] Write the Turkish evidence report for the owner:
  - the failure-map table with the dev result per row and platform;
  - dev costs;
  - skill size;
  - ladder uses;
  - open gaps;
  - the overfit and skill-trace outputs.
- [ ] Push the branch, CI green, PR to `main`.
- [ ] STOP. Phase 4 (eval set with the skill, then the hold-out) waits for approval.

---

## Execution method

| Sub-phase | Method | Why |
|---|---|---|
| 3a, Tasks 1–9 | Subagent-driven | Separate scripts with fixed interfaces and their own tests; a fresh reviewer per task catches interface drift before 3b–3d build on them. |
| 3a, Task 10 (SKILL.md, references, micro-tests) | Native | The text must be written against the whole failure map and `knowledge/` in one context. The 12-word guard and the trace test review it mechanically. |
| 3b, Tasks 11–15 | Subagent-driven, one task at a time | Many independent CSS groups and scripts. Each comes with a gallery and tests that a reviewer can reject on its own. |
| 3c, Tasks 17–21 | Subagent-driven, sequential | One widget per task with goldens. Builds share 15.5 GB RAM, so there are no parallel agents. |
| 3d, Tasks 23–25 | Native | Few tasks, each one dominated by Gradle runs and memory limits, where continuity matters more than a fresh view. |
| Dev loops (Tasks 16, 22, 26) and Task 27 | Native | Each round depends on the last round's findings and on the overfitting rules; the ledger is the memory. A final fresh reviewer checks the whole branch before each checkpoint. |

Estimated cost of paid runs (estimates; the first dev cell of each platform is measured and
reported before the rest):
- baseline average: $1.58 per cell;
- with-skill runs: spec estimate 10–25 min per run;
- a 4-cell dev round: about $6–12;
- judging: about $0.3–1 per batch;
- at most 3 rounds per platform, plus micro-tests (about 60 small runs).
- **Total: about $60–130.**

## Decisions for the owner (with the approval of this plan)

1. **Compose icons as official vector drawables** from a bundled full Outlined TSV, instead of the
   font-based `M3Icon` in spec §10 (rationale in "Icon strategy").
2. **The dev request set and gates** as written: 4 requests, 12 cells, gate = release-bar shape on
   dev, at most 3 rounds per platform.
3. **New verify checks that are not scored** (`placeholder-content`, `brand`, `unknown-icon`,
   `asset-unused`), guarded by the byte-identical baseline re-score.
4. **Sub-phase checkpoints as stops.** The owner may waive the 3a stop.
