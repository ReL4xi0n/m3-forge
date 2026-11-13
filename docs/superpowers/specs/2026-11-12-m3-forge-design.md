# m3-forge — Design

Date: 2026-11-12
Status: Approved by owner (2026-11-12)

## 1. Intent

An open-source Claude Code skill, invoked as `/material3 <UI request>`, that turns any UI request
(website, app screen, dashboard, form, …) into a working interface that follows Material Design 3,
with **M3 Expressive** as the default style. It targets three platforms in the first release: Web,
Flutter, and Jetpack Compose.

Why: no existing skill does this well (see §4, Prior art). Agents asked for "Material Design" today
produce output that is technically fine but reads as generic: approximate colors, arbitrary radii,
Tailwind/Bootstrap habits, emoji icons, gradients and shadows that M3 never uses.

**Success:** output looks as polished and M3-faithful as Google's own products.

## 2. Goals, non-goals, anti-goals

### Goals
- One command, `/material3`, user-invoked only (never auto-triggered). Everything after the command
  is the UI request.
- Three platforms in v1:
  - **Web.** Use the project's framework (React, Vue, Svelte, …) if one exists. In an empty folder,
    produce plain HTML/CSS/JS. Components are built from M3 tokens with our own CSS; `@material/web`
    is never used.
  - **Flutter.** Components come from the official Material library. Theme, color, typography,
    shape and motion come from our tokens.
  - **Jetpack Compose.** Components come from official `androidx.compose.material3`. Theme, color,
    typography, shape and motion come from our tokens.
- Platform detection from project files. An explicit platform in the request overrides detection.
  - `pubspec.yaml` → Flutter. If it depends on `material_ui`, the generated code uses that library;
    otherwise `package:flutter/material.dart`.
  - Gradle files with a Compose dependency → Compose.
  - `package.json` naming a framework → that framework.
  - None of these → plain HTML/CSS/JS.
- Default style is M3 Expressive. The user can ask for classic M3.
- Icons: Material Symbols only. Fonts: Roboto Flex or Roboto, loaded the way each platform supports.
- Graceful degradation. If the end user's machine lacks Node, Playwright, Flutter or an Android
  toolchain, the skill still generates the code. It skips the steps that need the missing tool and
  says so plainly in its final report.

### Non-goals (v1)
- SwiftUI or any platform other than the three above.
- A published component library for others to depend on. Our web CSS and Flutter gap components are
  assets the skill copies into the user's project.

### Anti-goals (failure even if it "works")
- Generic "Material-ish" output that smells of Tailwind or Bootstrap.
- Random gradients or shadows, emoji used as icons, approximated token values.
- Any Google logo, the "Google" brand, or a 1:1 copy of a real Google product. "Google" never appears
  in the repo name.
- Raw text from m3.material.io in the public repo.
- Any image or illustration from m3.material.io in the public repo.

## 3. Constraints

### Legal and attribution
- **License and notices.** The repo is Apache-2.0. A `NOTICE` file attributes:
  - the source repos (material-web, material-color-utilities, material-components-android, Flutter
    `material_ui`, androidx Compose material3, google/material-design-icons, googlefonts
    roboto-flex and roboto-classic);
  - the M3 guidance. m3.material.io states its content is available under "Apache 2.0 or CC BY 4.0".
    We attribute it per CC BY 4.0, link the license, and state that our notes are paraphrased and
    changed.
- **Disclaimer and naming.** The README and plugin description call the project "an unofficial skill
  for Material Design 3". The README states that it is not affiliated with or endorsed by Google.
  The repo and plugin are named `m3-forge` (owner decision, to avoid confusion with `hamen/material-3-skill`); the skill and its command stay `/material3`. The low
  trademark risk was accepted on 2026-11-12.
- **Private repository.**
  - Raw scraped text, rendered pages, captured site JSON, and the owner's reference screenshots live
    only in a separate private repository. It is cloned into `private/`, which is gitignored in the
    public repo.
  - The public repo contains no other reference to that repository: no submodule, no name, no URL.
  - The skill never depends on `private/`.
- **Site images.** Images and illustrations from m3.material.io never enter the public repo. Their
  licensing may differ from the text.
- **Fonts and icons are bundled in the skill**, so generation never depends on the network. They
  live in `plugin/skills/material3/assets/fonts/`, copied verbatim from the official repos at pinned
  commits, with SHA-256 recorded in `versions.json`. Sizes are as of 2026-11-12, about 18 MB in
  total.
  - **Roboto Flex** variable TTF: 1.70 MB, OFL-1.1, from google/fonts `ofl/robotoflex`.
  - **Roboto** `[wdth,wght]` plus Italic TTF: 0.98 MB, OFL-1.1.
  - **Material Symbols Outlined** variable TTF: 10.25 MB. Its woff2: 3.82 MB. Its `codepoints`
    file: 0.08 MB. All Apache-2.0, from google/material-design-icons `variablefont/`.
  - **Roboto Flex woff2** for the web: produced once at build time from the TTF by a pinned tool and
    committed. It is a format conversion only.
  - Each font folder carries its `OFL.txt` or Apache LICENSE, and NOTICE lists them.
  - Bumping a font is a deliberate one-commit change, because every bump grows git history. Git LFS
    is not used: plugin installs clone the repo and may not fetch LFS objects.
  - **Rounded and Sharp Symbols styles are not bundled.**
    - Outlined is the default.
    - If a user explicitly asks for Rounded or Sharp, the skill downloads that style at the pinned
      commit and verifies its hash.
    - If the download fails, it falls back to the bundled Outlined. The final report says so, in the
      form: "Rounded icons requested but could not be downloaded (offline?); used bundled Outlined.
      Re-run with network access to switch."

### Numeric integrity
Numeric token values are never rounded or guessed. A value that cannot be found in a source is
recorded as `"NOT FOUND"`. When the site and a repo disagree, the repo value wins and the difference
is logged.

**Resolution ladder.** When an asset needs a component token that is NOT FOUND for its platform, try
these in order:
1. The same token from another official repo. Record it with provenance `cross-source:<repo>`.
2. The sys token the component spec maps it to, for example a container color role or a shape-scale
   step. Record it as `derived:<sys-token>`, with the reasoning in `not-found.md`.
3. Leave the property at the official library default (Flutter or Compose), or omit it (web).

A new number is never invented. Every rung-1 or rung-2 use is listed in `not-found.md`. A component
that cannot be built credibly this way is left out of v1 and listed.

### Local toolchain (maintainer machine)
Everything lives in one folder, `%USERPROFILE%\.m3-toolchain`, so it can be deleted in one step. It
holds:
- JDK 21 x64. JDK 21 rather than 17, because Robolectric 4.16+ needs it for SDK 36.
- The Flutter SDK (stable).
- Android SDK command-line tools plus the platform needed for `compileSdk`. No emulator.
- `GRADLE_USER_HOME`, `PUB_CACHE`, `ANDROID_USER_HOME` and `PLAYWRIGHT_BROWSERS_PATH`, all
  redirected into the same folder.

Project scripts set `JAVA_HOME`, `ANDROID_HOME` and the Flutter path for their own process only.
They never touch the system Java 1.8 or the user/system PATH.

Setup stops at `sdkmanager --licenses`. The owner accepts the licenses by hand, and the script never
pipes "yes".

### Screenshot references
- Reference images (goldens and baselines) are generated on Linux in CI and are the only
  authoritative ones.
- A manually triggered workflow (`workflow_dispatch`) regenerates them and commits them through a PR.
- Local runs only produce images and never compare them.

### Compose version pin
- Expressive APIs need `androidx.compose.material3` **1.5.0+**. As of 2026-11-12 the latest is
  1.5.0-rc01; stable 1.4.0 has no Expressive APIs.
- The version is defined in exactly one place (`plugin/skills/material3/versions.json`, mirrored into
  harness `libs.versions.toml` by script). It can be bumped with one line when 1.5.0 goes stable.
- On an existing project below 1.5.0, the skill does not silently upgrade dependencies. It tells the
  user that Expressive needs 1.5 and offers the upgrade. If declined, it falls back to classic M3 for
  the APIs that are missing.

## 4. Prior art

Survey of 2026-11-12 (skills.sh, plugin listings, GitHub). Stars, installs, dates and licenses are
as of that day.

| Skill | Reach | Platforms | Strengths | Weaknesses |
|---|---|---|---|---|
| hamen/material-3-skill (MIT) | ~1.6K★, ~3.6K installs | Compose first; brief Flutter; web via `@material/web` | Good progressive disclosure; accurate baseline type scale and Expressive shape steps; current Expressive platform matrix; an `audit` mode | Web is limited and has no Expressive (admits it); emphasized type has no values; the audit is self-scored with a few greps; auto-triggers on broad terms like "Jetpack Compose"; large SKILL.md with a hardcoded baseline palette |
| albermonte/android-skills `material-3-expressive` (no license) | 11★, ~540 installs | Android/Compose | Most token-faithful: ~65 component token reference files, regenerated by a Playwright scraper; tiered reference loading | Design/review only, explicitly not implementation; no web or Flutter; checklist-only verification; no license |
| ahmed3elshaer/everything-claude-code-mobile `m3-expressive` (MIT) | small | Compose | Broad Expressive API coverage with code | Single 62 KB SKILL.md; wrong values (e.g. `largeIncreased` 24dp instead of 20dp; shape steps that aren't in the scale; effects springs described as bouncy); invented spring presets |
| shelbeely/shelbeely-agent-skills (Apache-2.0) | 4★ | Many web frameworks, Flutter, Android | Closest web approach to ours: dependency-free token CSS; real scheme generation via material-color-utilities | Rounded values (e.g. 3.562rem); no Expressive shape steps in vanilla tokens; 19 overlapping skills; no verification |
| wshobson/agents `mobile-android-design` (MIT) | repo ~42K★ | Compose | Wide distribution: the de-facto default | Generic M3 on the baseline purple; no Expressive at all; no verification |
| bergside/awesome-design-skills `material` (MIT) | repo ~3.6K★ | Generic | — | Material in name only: non-M3 fonts, palette, radii and type scale |
| sysv86/material3ai (no license) | 1★ | Compose (+TV/Wear) | The only executable checker: a Compose code checker for opt-ins, shapes created in composition, and tween-vs-spring | Line-based checks with false positives; Android only |

No official Google/Android or Flutter skill covers phone M3 or Expressive (android/skills has only
Wear; flutter/agent-plugins has only general theming).

### Gaps nobody covers, and where we differ
1. **Hand-written web CSS with full Expressive** (shape steps, emphasized type, springs) at exact
   values. Others route to `@material/web` or ship rounded or partial CSS.
2. **One provenance-tracked token source** generating CSS, Dart and Kotlin. Others hand-type values
   and drift.
3. **Executable verification** for hardcoded color, off-token type and radius, computed contrast and
   48dp targets, on all three platforms.
4. **Rendered-output checks:** Playwright, Flutter goldens and Roborazzi, in light and dark.
5. **Exact emphasized-type and spring values** outside Compose.
6. **Invoke-only scope.** We never auto-trigger, so we never hijack unrelated Compose or Flutter
   work.

We borrow good ideas, in our own implementation (no code copied; several of these repos have no
license):
- hamen's lean SKILL.md with topic references and an explicit "Expressive per platform" matrix;
- albermonte's tiered reference loading;
- shelbeely's script-generated schemes.

**Naming.** To avoid confusion with `hamen/material-3-skill`, the repo and plugin are named `m3-forge` (owner decision, 2026-11-12). The README still says plainly that this is a separate project.

## 5. Platform landscape (researched 2026-11-12)

### Compose
- material3 1.5.0-rc01 has most of Expressive as non-experimental:
  - `MaterialExpressiveTheme`, `MotionScheme.expressive()`;
  - ButtonGroup, SplitButton, FloatingToolbar, FAB menu, flexible app bars, wavy progress;
  - the `*Emphasized` type styles;
  - the `largeIncreased`, `extraLargeIncreased` and `extraExtraLarge` shapes.
- `MaterialShapes` and `LoadingIndicator` are still `@ExperimentalMaterial3ExpressiveApi`. The skill
  uses them with explicit opt-in and says so in a code comment.
- `expressiveLightColorScheme()` has no dark twin. We generate both schemes ourselves (§8), so this
  does not matter.
- Gap strategy: almost none needed. Use official components and supply only theme and tokens.

### Flutter
- `package:flutter/material.dart` is deprecated as of Flutter 3.50. The official M3 library is now
  the `material_ui` package (publisher flutter.dev, 1.11.0).
- Library choice:
  - Use `material_ui` when the project depends on it, or when creating a new project with
    Flutter ≥ 3.47.
  - Otherwise use `flutter/material.dart`.
  - `material_ui` is an exact replica, so our sources differ only in their import line.
- `material_ui` Expressive so far:
  - `StyleVariant.material3Expressive`;
  - `MaterialShapes`, `RoundedPolygon` and a morphing `MaterialShapeBorder`;
  - `Springs` (standard and expressive);
  - Expressive `IconButton` and `ElevatedButton`.
- **Gaps:** ButtonGroup, SplitButton, LoadingIndicator, FloatingToolbar, FAB menu, wavy progress,
  emphasized type scale, and an expressive motion/theme switch.
- **Gap strategy (decided):**
  - No community packages, because the brief says "official libraries".
  - We write reference implementations of the missing pieces as Dart source in
    `assets/flutter/expressive/`. They are composed from official widgets and `material_ui`
    primitives (`MaterialShapes`, `Springs`) plus our tokens.
  - The skill copies only the pieces a request needs into the user's project.
  - Each reference implementation is protected by golden tests (§10).
  - The emphasized type scale ships as a `ThemeExtension`.
  - `references/flutter/coverage.md` keeps an "official vs ours" table with version thresholds, so
    the skill prefers the official widget once `material_ui` ships it.

### Web
- Our own CSS from tokens, per the brief. `material-web` is in maintenance mode, but its
  `tokens/versions/latest` Sass is the most complete machine-readable sys/comp token set, including
  Expressive.
- The skill ships `assets/web/`:
  - `tokens.css`: generated custom properties for color roles, typescale, shape, elevation, motion
    and state layers.
  - `components/*.css`: one file per M3 component, written by us from comp tokens.
  - A tiny dependency-free `behaviors.js`: state-layer ripple, menu/dialog focus handling, and
    spring-like motion via the Web Animations API or CSS `linear()` easing generated from the spring
    tokens.
- **Self-contained output (owner decision).**
  - The CSS library, `behaviors.js` and the fonts (Roboto Flex woff2, Material Symbols Outlined
    woff2) are always copied into the user's project and referenced by relative paths, for example
    `src/styles/m3/` or `assets/m3/` following project conventions.
  - Nothing is linked from a CDN or Google Fonts, so the generated UI works offline and standalone.
- In a framework project, the skill writes idiomatic framework components that use the copied CSS.
  In an empty folder, the HTML uses them directly.
- **Material Symbols web subset.** When Node is available, `scripts/icons` subsets the bundled
  Symbols woff2 to the icons used, keeping all variable axes. It uses a pinned harfbuzz-based subset
  tool that ships with the skill's scripts. Without Node, the full 3.82 MB woff2 is copied, and the
  report says so.
- Visual tests in CI protect the component CSS (§10).

## 6. Repository layout

```
m3-forge/
├─ .claude-plugin/marketplace.json     # marketplace "m3-forge", plugin source "./plugin"
├─ plugin/
│  ├─ .claude-plugin/plugin.json       # name "m3-forge"; description "an unofficial skill for Material Design 3"
│  └─ skills/material3/                # self-contained; this folder is what manual install copies
│     ├─ SKILL.md                      # short, directive; < 200 lines target, 500 hard cap
│     ├─ CHECKLIST.md                  # judgment rules (composition, spacing, hierarchy, polish)
│     ├─ versions.json                 # single source for pinned lib/font/icon versions + hashes
│     ├─ references/
│     │  ├─ core/                      # color, type, shape, motion, elevation, layout, states,
│     │  │                             # accessibility, expressive, anti-patterns, components/*.md
│     │  ├─ web/  ├─ flutter/  └─ compose/
│     ├─ tokens/                       # generated JSON (sys + comp), with provenance per value
│     ├─ assets/{web,flutter,compose}/ # CSS library, Dart gap components, Kotlin theme templates
│     └─ scripts/                      # detect, color, install-assets, icons, verify, screenshot
├─ knowledge/                          # distilled knowledge base in our own words (build-side)
│  ├─ guidance/…                       # per-topic notes paraphrased from the site
│  ├─ tokens/                          # extracted values + provenance
│  ├─ sources.lock.json                # repo → commit hash, path, fetch date
│  ├─ conflicts.md                     # site vs repo, repo vs repo differences
│  └─ not-found.md                     # every NOT FOUND value
├─ tools/
│  ├─ extract/                         # scraper (writes only to private/), token extractors
│  ├─ build/                           # knowledge/tokens → plugin tokens/, tokens.css, theme templates
│  ├─ guard/                           # public-diff guard (private paths, raw-text overlap)
│  └─ toolchain/                       # setup.ps1, env.ps1 (process-scoped), CI equivalents
├─ harness/{web,flutter,compose}/      # screenshot/golden projects that exercise assets & examples
├─ evals/                              # test prompts, fixtures, rubric, run summaries & scores
├─ examples/                           # showcase outputs per platform
├─ docs/                               # this design, sources-and-licensing.md, plans
├─ .github/workflows/
├─ LICENSE  NOTICE  README.md  .gitignore (private/)
```

Why a `plugin/` subfolder rather than the repo root: a plugin install then pulls only the skill, not
the extraction tools, harnesses and evals. Manual install copies `plugin/skills/material3/` into
`~/.claude/skills/material3/`.

`knowledge/` and `references/` are different things:
- `knowledge/` is the complete distilled base, with provenance, conflicts and NOT FOUND lists.
- `references/` is the concise, curated runtime subset the skill actually reads. It is written from
  `knowledge/`.

## 7. Skill behavior at runtime

### Frontmatter
```yaml
---
name: material3
description: Build a Material Design 3 (Expressive by default) UI for web, Flutter or Jetpack Compose from a request. An unofficial skill for Material Design 3.
argument-hint: "<UI request>"
disable-model-invocation: true
---
```
The body contains `$ARGUMENTS`. Bundled files are referenced as `${CLAUDE_SKILL_DIR}/...`, which
works in both install methods.

### Flow
1. **Read the request.** Note an explicit platform, a classic-M3 request, a seed color or brand
   color, and dark-mode or density wishes.
2. **Detect.** `scripts/detect` prints JSON with:
   - platform and framework;
   - the Flutter Material library (`material_ui` or `flutter/material.dart`) and the Compose
     material3 version;
   - any existing theme files;
   - tool availability: node, playwright, flutter, java/android.
3. **Load references.** Read `core/` plus the platform folder, and only the component notes that the
   request needs.
4. **Theme.**
   - Generate the color scheme (§8).
   - Copy the platform assets (web CSS, Flutter gap components, Compose theme files) into the
     project following its conventions.
   - If the project already has an M3 role-based theme, extend it instead of replacing it.
   - Never overwrite user files or change build/dependency files without saying so. Changing
     dependency versions needs the user's consent.
   - Copy the bundled fonts and icon font into the project (no network needed).
5. **Build the UI.**
6. **Verify (automated).** Run `scripts/verify` on the generated files and fix every violation (§9).
   Repeat until clean.
7. **Look (screenshots).** If the platform's toolchain is available, render the screens and read the
   images (§10):
   - web: mobile + desktop × light + dark;
   - Flutter and Compose: phone light + dark.

   Critique them against `CHECKLIST.md`, fix, and re-render. No comparison against references
   happens here.
8. **Report.** Cover:
   - what was built and where;
   - platform and style;
   - the color source: exact seed, or the nearest precomputed scheme;
   - which checks ran and which were skipped, and why ("Flutter SDK not found, screenshot
     verification skipped").

### Scaffolding
This rule covers an explicit platform in an empty or non-matching folder.
- **Flutter with the SDK present:** run `flutter create` with the pinned template options, then
  apply our theme. Use `material_ui` when Flutter ≥ 3.47.
- **Flutter without the SDK:** write a minimal project with `pubspec.yaml`, `lib/` and `test/`,
  depending on `material_ui`, plus a one-line instruction to run `flutter create .` later to add the
  platform folders. Say so in the report.
- **Compose:** write a minimal single-module Gradle project from `assets/compose/template/`. AGP,
  Kotlin, the Gradle wrapper and material3 are pinned in `versions.json`.
- **Existing Flutter project on ≥ 3.50 that still uses `flutter/material.dart`:** generate against
  the import the project already uses. Mention that `dart fix --apply --code=migrate_design_widgets`
  would migrate it. Never migrate without consent.

### Edge rules
- No Node: skip the automated verifiers and Playwright screenshots, do the CHECKLIST review by
  reading the code, and say so.
- Offline: nothing breaks, because fonts and icons are bundled (§3).
  - The only network-dependent features are a requested non-Outlined Symbols style, which falls back
    to Outlined with a notice, and a project's own package installs (`npm install`, `flutter pub get`,
    Gradle sync).
  - If package installs fail, the code is still written and the report gives the exact command to
    run later.
- End-user Compose screenshots run only if the project already has Roborazzi or Compose screenshot
  testing set up. Otherwise the skill offers to add it and does not touch Gradle files uninvited.
- Generated preview tests and images go to a temporary location. They do not stay in the user's
  project unless the user asks.

## 8. Color

- `scripts/color` uses a vendored, bundled `@material/material-color-utilities` (TS 0.4.0,
  Apache-2.0) with the 2025 spec.
  - Input: seed and variant.
  - Output: light and dark schemes at standard, medium and high contrast, written as explicit values
    into each platform's theme. This avoids the Dart port, which lacks the 2025 spec.
- **Default seed.**
  - With no seed in the request, the skill picks one that fits the request's subject and states it.
  - The baseline seed is used only for neutral, generic requests.
  - The default variant for each style comes from the knowledge base. The builder must confirm it in
    Phase 1 and must not assume it.
- **No Node.**
  - `tokens/precomputed-schemes.json` holds a fixed set of seeds (baseline plus an even spread of hues
    and chroma levels) × variants × light/dark × contrast levels, each with its seed hue/chroma.
  - With a custom seed, the skill picks the nearest precomputed scheme by hue, then chroma. It states
    this explicitly: which seed was requested, which was used, and that installing Node gives an
    exact scheme.

## 9. Automated verification (`scripts/verify`, Node)

Each check is per platform, with an allowlist for the theme/token files themselves. It emits JSON
plus a human summary, and its exit code drives the fix loop.

| Check | Web | Flutter | Compose |
|---|---|---|---|
| Hardcoded color | hex/rgb/hsl/named colors outside tokens.css | `Color(0x…)`, `Colors.*` outside theme | `Color(0x…)`, `Color.Red` etc. outside theme |
| Off-token font size / weight | `font-size`/`font` not via typescale vars | `TextStyle(fontSize:)` literals | `.sp` literals outside Type.kt |
| Off-token corner radius | `border-radius` not in shape scale | `BorderRadius.circular(n)` n ∉ scale | `RoundedCornerShape(n.dp)` n ∉ scale |
| Off-grid spacing (warning) | px not on the 4dp grid | `EdgeInsets` literals off-grid | `.dp` paddings off-grid |
| Shadows / gradients | `box-shadow` not elevation tokens; any gradient | `BoxShadow`, `LinearGradient` | `shadow()`, `Brush.*Gradient` |
| Icon source | non-Material-Symbols icon libs, emoji in UI strings | `Icons.*` (legacy Material Icons), emoji | `Icons.*` (material-icons), emoji |
| Foreign styling | Tailwind/Bootstrap classes when the project doesn't use them | — | — |
| Contrast (disabled elements excluded, as WCAG exempts them and M3 draws them at low opacity on purpose) | role pairs from the generated scheme ≥ WCAG thresholds; rendered text via axe-core in Playwright, with `:disabled` / `aria-disabled="true"` excluded | role pairs + `textContrastGuideline` in harness; widgets with null callbacks or `enabled: false` excluded | role pairs + ATF check in Roborazzi; nodes with `SemanticsProperties.Disabled` excluded |
| Touch target ≥ 48dp | axe `target-size` + computed box check | `androidTapTargetGuideline` | ATF touch-target check |

Judgment rules stay in `CHECKLIST.md`: composition, hierarchy, spacing rhythm, component choice,
expressive character, motion appropriateness, and the overall "Google-polish" bar.

## 10. Screenshots and golden tests

### Web: `harness/web`
- Playwright (Node).
- Viewports: 412×915 and 1440×900.
- `colorScheme` emulation: light and dark.
- CI compares the asset component gallery and the examples against references.

### Flutter: `harness/flutter`
- Plain `matchesGoldenFile`, with fonts loaded in `test/flutter_test_config.dart` via `FontLoader`
  from the real Roboto Flex, Roboto and Material Symbols files.
- Alchemist was evaluated and rejected: its CI mode always renders text as Ahem blocks, which defeats
  the real-font requirement, and its platform mode adds little over a pinned Linux runner.
- The first golden is a smoke test proving that variable-font axes (Roboto Flex `wght`/`opsz`;
  Symbols `FILL`/`wght`) render under flutter_tester. If they don't, stop and report.
- Covers every Expressive gap component in both libraries (`material_ui` and `flutter/material.dart`
  imports).

### Compose: `harness/compose`
- Roborazzi with Robolectric native graphics, running on the JVM with no emulator.
- Fonts are bundled `res/font` variable files, because downloadable fonts don't support variable
  axes.

### Icons (narrow scope; owner decision)
The only icon sources are the official Material Symbols variable font and its official `codepoints`
file, both bundled (§3). No icon set is drawn, converted to vectors, or taken from a community
package.

- **Web:** the copied woff2 with ligatures (`<span class="m3-icon">settings</span>`), styled via
  `font-variation-settings` for FILL, wght, GRAD and opsz.
- **Flutter:**
  - The TTF is declared as a font family in `pubspec.yaml`.
  - `scripts/icons` generates `m3_symbols.dart`, holding `const IconData` name → codepoint constants
    for the icons the UI uses, for example `M3Symbols.settings`.
  - Each constant uses the Symbols font family. Fill and weight come from `Icon`'s
    `fill`/`weight`/`grade`/`opticalSize`.
- **Compose:**
  - The TTF goes to `res/font`.
  - `scripts/icons` generates `M3Symbols.kt`, holding name → codepoint `String` constants for the
    icons used.
  - A ~20-line `M3Icon(symbol, fill, weight, …)` composable renders the codepoint as `Text` with the
    Symbols `FontFamily` and `FontVariation.Settings`. It sets the content description through
    semantics.
- **Size.** Flutter's `--tree-shake-icons` should subset the font for const `IconData`. Whether
  that keeps the variable axes intact is unverified and is checked in Phase 3. If it doesn't, the
  full font ships and the report says so. Compose ships the full TTF in v1, and the report notes the
  APK size cost.

A golden or screenshot covers icon rendering on each platform: filled and unfilled, two weights.

### Policy
- References are produced only by `regenerate-references.yml` (`workflow_dispatch`) on Linux.
- PR CI verifies against them.
- Local runs write images to a gitignored `out/` folder and never compare.

## 11. Knowledge extraction (Phase 1)

### Order
The terms report (below) is written first. Research on 2026-11-12 found:
- robots.txt permits the guidance paths;
- the site declares its content available under Apache 2.0 or CC BY 4.0;
- the Google ToS ties its automated-access ban to robots.txt.

So scraping proceeds after the report, unless the report finds a new blocker. If it does, stop and
ask the owner. The fallback is repo-only knowledge plus manual reading.

### Site scraping
- Node + Playwright, sitemap-driven.
- Scope: all of Styles, Foundations and Components, plus every page about M3 Expressive.
- Robots: obeys robots.txt (`/archive`, `/search.html`, `?q=`, `?utm_source=` are disallowed). One
  page at a time with at least a 3 s delay. Honest generic user-agent; no personal data.
- Saves per page, into `private/raw/<YYYY-MM-DD>/`:
  - the rendered text;
  - the page's `_dsm` content JSON, captured from the SPA's own network traffic;
  - image URLs and alt text only. Image files are not downloaded.
- Each run is one dated commit in the private repo.

### Token extraction
Pinned commits, each recorded in `sources.lock.json`:
- **material-web** `tokens/versions/latest` (Sass): primary sys and comp tokens.
- **androidx Compose material3 `tokens/*.kt`**: the source for Compose, and for expressive springs.
  material-web has the standard springs only.
- **MDC-Android `res/values/tokens.xml`**: a cross-check.
- **Flutter `material_ui`** defaults and Springs.
- **material-color-utilities**: the algorithm.

### Precedence
- Platform-specific values come from that platform's own repo.
- Cross-platform canonical values come from material-web.
- Any disagreement goes into `conflicts.md`.
- When the site and a repo disagree, the repo wins and the difference is logged.

### Distillation
Notes in `knowledge/guidance/` are written in our own words, with no copied sentences. A guard
(§13) checks for verbatim overlap.

### Terms report
`docs/sources-and-licensing.md` summarizes robots.txt, the content license statement, the Google ToS
clauses on automated access, the trademark guidance, and our compliance choices.

## 12. Evaluation (test first, then the skill)

### Test requests
In `evals/prompts/`, written before any skill content. Each one runs per platform:
1. marketing landing page
2. mobile settings screen
3. admin dashboard
4. product detail page
5. onboarding form
6. empty and error states

Plus two variants: classic M3 on request, and a custom seed color.

### Fixtures
In `evals/fixtures/`:
- web-empty
- web-react (Vite)
- web-vue
- flutter-material_ui
- flutter-legacy (`flutter/material.dart`)
- compose-1.5

### Baseline
- Run each request without the skill, headless (`claude -p`, same model, recorded), in a fresh copy
  of the fixture.
- Capture screenshots with the harness, run the verifiers, and score with the rubric.
- Log the failure types in `evals/runs/<date>-baseline/summary.md`.
- The skill content is then written to target the observed failures.

### Rubric (0–3 each)
- Automated: token fidelity, contrast/targets, and the anti-pattern hit count.
- Judged: component choice, hierarchy and typography, color-role use, shape and Expressive character,
  spacing and layout, interaction states, dark mode, and overall polish.

`evals/rubric.md` is written and frozen in Phase 2, before the baseline runs, with concrete anchors
for 0, 1, 2 and 3 on each item. It is separate from the skill's `CHECKLIST.md`, which is written
later. The rubric is not edited after the baseline. Any change gets a new version, and both the
baseline and the final runs are re-scored with it.

### Judging (blind)

**Anonymizing outputs.**
- `evals/tools/anonymize` copies each run's screenshots into a judge folder under random opaque IDs,
  for example `k7f2q9.png`. It strips anything that reveals the source: paths, run folders, file
  metadata, and any "skill"/"baseline" strings.
- The ID → (cell, condition, repeat) mapping is written to a separate `mapping.json` outside the
  judge folder. It is opened only after the scores are in.

**The judge.**
- Each scoring round uses a fresh Claude subagent that has never seen the skill, its references,
  `CHECKLIST.md`, the improvement process or the mapping.
- Its only inputs are the judge folder, the frozen `evals/rubric.md` and the request text for each
  ID.
- The judge model and the exact prompt are recorded in `evals/judge.md`.

**Phase 2 scores.** The baseline is scored in Phase 2 only to build the failure catalogue.

**Final comparison.**
- At the end of Phase 4, all baseline and with-skill outputs are pooled, shuffled and re-scored
  together by a new fresh judge. That way both conditions are scored blind, in one session, against
  the same rubric version.
- The before/after comparison uses only these pooled scores.

**Owner check.**
- The owner spot-checks a sample against private reference screenshots at the phase stop.
- Where the owner and the judge disagree, the owner's score wins, and the disagreement is noted to
  calibrate the rubric.

### Run isolation
Every eval run uses `claude -p` with a temporary `CLAUDE_CONFIG_DIR` and a fresh fixture copy. No
user-level skills, plugins or CLAUDE.md are loaded, so the owner's other design skills cannot
contaminate either the baseline or the with-skill runs. The with-skill runs install only this skill
into that config.

### Run matrix and budget (owner choice: option B)

**Cells.**
- 18 core cells: 6 requests × 3 platforms. Web requests are split between web-empty and web-react.
- 8 coverage cells:
  - web-vue (1);
  - flutter-legacy (1);
  - classic M3 (1 per platform, 3 in total);
  - custom seed (1 per platform, 3 in total).
- **26 cells in total.**

**Runs.**
- Baseline: 26 runs (1 repeat each). With-skill final: 26 runs. That is 52.
- A second repeat runs only for cells where the pooled before/after difference is ≤ 0.5. That is
  roughly 10–15 more.
- Improvement rounds re-run only the weak cells: about 10 per round, at most 3 rounds.
- Hold-out: 6 runs.

**Pilot first.**
- Before the baseline, 2 cells run once each without the skill: one web cell and one Flutter cell.
- Their measured wall time and token usage go to the owner, with an extrapolated total.
- The full baseline starts only after the owner approves.
- With-skill cost can't be piloted before the skill exists. It is re-measured on the first 2
  with-skill runs in Phase 4 and reported before the remaining runs.

Rough pre-pilot estimate:
- 5–12 min per baseline run;
- 10–25 min per with-skill run;
- about 0.5–1.5M input tokens (mostly cache reads) and 20–50k output tokens per run.

### Hold-out requests
- A fresh subagent writes 2 hold-out requests. Before it runs, I (the implementing agent) never see
  their content. Its brief gives it only the list of the 6 main request types, and tells it to write
  2 different ones of comparable difficulty.
- It saves them to `evals/holdout/`.
- Until the improvement rounds are over, the implementing agent never opens, reads or searches that
  folder. Repo-wide searches exclude it, and no skill or reference text is written with it in view.
- Eval fixtures and with-skill runs never include it.
- It is opened only for the final measurement: 2 requests × 3 platforms = 6 runs, scored in the same
  pooled blind session.

### Re-measure
Same requests and fixtures with the skill. Report the per-item delta.

### Release bar (end of Phase 4)
All of the following must hold:
1. **Zero automated violations** in the final with-skill outputs, including hold-out.
   - Covered: hardcoded color, off-token type size or radius, gradients, non-token shadows, emoji
     icons, non-Material-Symbols icons, contrast, and 48dp targets.
   - Contrast excludes disabled elements (§9).
2. **Judged item scores.** Per platform, every judged item has a mean ≥ 2.5/3, and no single score
   is below 2. This applies to hold-out outputs too.
3. **Improvement over baseline.** Per platform, every item's mean improves over the baseline mean
   or is already 3, using the pooled blind scores. Single-cell drops do not fail the bar, but every
   one is listed in the release report.
4. **Owner visual sign-off** on a sample per platform, light and dark, next to the owner's
   reference screenshots.
5. **At most 3 improvement rounds.** If the bar is still unmet after them, stop and report the
   remaining gaps. The owner decides whether to continue.

The 0–3 anchors:
- 0: not M3, or wrong;
- 1: recognizably M3, with clear errors;
- 2: correct M3, minor flaws;
- 3: indistinguishable from first-party quality.

The detailed anchors are fixed in `evals/rubric.md` in Phase 2.

### Storage
- Public: summaries and scores in `evals/runs/`.
- Private repo, under `evals/`: full screenshots and generated code. This keeps the public repo light
  and avoids publishing anything brand-adjacent by accident.

## 13. Privacy guard and CI

### `tools/guard/check-public-diff`
Run before every public commit, by pre-commit hook and by me. It fails on:
- any staged path under `private/`;
- binary images that are not ours (only harness/eval outputs and references are allowed);
- the private repo name;
- any 12-word sequence that also appears in the local raw corpus. This check only works when
  `private/raw` exists locally.

### PR workflow
- verify-scripts unit tests;
- `scripts/verify` on the examples;
- the guard's path and name checks (CI has no raw corpus);
- web visual tests;
- Flutter goldens;
- Compose Roborazzi verify;
- `claude plugin validate`.

### Other workflows
- `regenerate-references.yml`: manual dispatch.
- The private-path check runs from Phase 0 onward.

## 14. Distribution

### Plugin
```
/plugin marketplace add ReL4xi0n/m3-forge
/plugin install m3-forge@m3-forge
```
Command: `/m3-forge:material3`. Bare `/material3` should also work when no other command uses the
name; this is verified in Phase 4 and documented with the result.

### Manual
Copy `plugin/skills/material3/` to `~/.claude/skills/material3/`. Command: `/material3`.

The README warns against having both installs active at once.

## 15. Phases (each ends with a stop, an evidence summary, and owner approval)

### Phase 0: skeleton
- `gh repo rename m3-forge` (from `material-design-3`), then verify the local remote URL.
- Create the private repo and its clone in `private/`, and set up `.gitignore`.
- Add LICENSE, NOTICE, README stub, the guard, and the minimal CI (private-path check and plugin
  validate).
- Set up the toolchain, stopping at the license prompt.

**Evidence:** remote URLs, the guard catching a planted `private/` file, the CI run link, and the
toolchain versions.

### Phase 1: extraction and knowledge base
- Scraper run and dated private commit.
- Token extraction with `sources.lock.json`, `conflicts.md` and `not-found.md`.
- Distilled `knowledge/`.
- Terms report.

**Evidence:** page counts, token counts, conflicts, NOT FOUND list, and the guard pass.

### Phase 2: tests and baseline
- Prompts, frozen rubric, judge prompt and anonymizer.
- A fresh subagent writes the hold-out requests to `evals/holdout/`. They stay unread.
- Fixtures, harnesses (web, Flutter, Compose), and the verify scripts' first version.
- **Pilot:** 2 cells. Stop, report measured time and usage, and wait for owner approval.
- Baseline run (26 cells) and blind scoring.

**Evidence:** pilot numbers, screenshots, and the failure catalogue.

The verify scripts are pulled forward from Phase 3 so the baseline gets automated scores.

### Phase 3: skill, assets and verification
Proposed checkpoints within the phase: **3a** shared core, **3b** web, **3c** Flutter, **3d**
Compose, each with its own evidence.
- SKILL.md and references.
- tokens.css and the web components.
- Flutter gap components with goldens.
- Compose theme templates.
- Color script and precomputed schemes.
- Detect, install, screenshot and verify.

### Phase 4: improvement round and release
- Re-measure with the skill. Report the first 2 runs' cost before the rest.
- Run at most 3 improvement rounds on the weak cells.
- Final: open the hold-out requests; run the hold-out and the second repeats on ambiguous cells;
  pooled blind re-score; check against the release bar (§12).
- examples/, README, full CI and the reference-regeneration workflow.
- Install-path verification.

**Evidence:** pooled before/after scores per platform, the list of single-cell drops, hold-out
results, screenshots, green CI, and both install paths shown working.

## 16. Decisions log

### Owner decisions
- Rename the existing repo to `m3-forge`; plugin and marketplace also named `m3-forge`; skill and command stay `/material3`. Low trademark risk accepted.
- Local toolchain plus CI, in a single folder, with no license auto-accept.
- References only from Linux CI via manual dispatch; local runs never compare.
- Real fonts in Flutter goldens.
- Generate code without SDKs and skip verification with a clear message.
- Compose version in one place.
- Flutter detection looks for `material_ui`.
- Goldens protect the Flutter gap components.
- With no Node and a custom seed, use the nearest scheme and say so.
- No site images in the public repo; raw text private only.
- A Prior-art section.
- The private repo's name was decided by the owner and is recorded outside this repo. It never
  appears in the public repo.
- Eval budget: option B (~52 runs plus second repeats only on ambiguous cells), after a 2-cell pilot
  and owner approval.
- Release bar as written in §12, with four owner amendments:
  - fully blind judging (random IDs, separate mapping, a fresh judge that has never seen the skill);
  - improvement measured per platform mean, with single-cell drops listed;
  - disabled elements excluded from contrast;
  - hold-out requests written by a fresh subagent and unread until the final measurement.
- Design approved on 2026-11-12, with three clarifications:
  - fonts and icons are bundled, so the skill works offline; only Outlined Symbols is bundled, and
    other styles are fetched on request with a stated fallback (§3);
  - web CSS, `behaviors.js` and fonts are copied into the user's project, never linked from a CDN
    (§5);
  - icons come only from the official Symbols variable font and codepoints, with name → icon
    constants for Flutter and Compose and no drawing or vector conversion (§10).

- Phase 1 approved on 2026-11-13, with three decisions:
  - **Conflict policy.** This is the precedence in `knowledge/README.md`, with one exception. When
    the site disagrees with material-web and both Flutter and Compose give the site's value,
    material-web does not win automatically. Those cases are listed for an owner decision.
  - **Default color variant.** Tonal spot for both styles. The MCU "expressive" scheme variant is
    not the M3 Expressive style, and the skill must not confuse the two.
  - **Re-verification.** A fresh agent re-checks 6 randomly chosen corrected notes before Phase 1
    closes.

### Builder decisions, already accepted by the owner
- JDK 21 instead of 17.
- No silent Compose dependency bumps.
- `material_ui` preferred on Flutter ≥ 3.47.
- No community Flutter packages; we write the gap components ourselves.
- Plain `matchesGoldenFile` over Alchemist.
- Color generated by the TS utilities and emitted as explicit values.
- Capture the site's own `_dsm` JSON during Playwright rendering.

### Builder decisions in this document, open to owner correction
- The `plugin/` subfolder layout.
- Fonts bundled in the skill (revised from "fetched" per owner clarification; see §3).
- Web assets shipped as a CSS library plus a tiny behaviors.js.
- Verify scripts in Node.
- Eval screenshots stored privately.
- End-user Compose screenshots only when already set up.
- Phase 3 checkpoints, with verify scripts pulled into Phase 2.
- Scaffolding new Flutter/Compose projects when the platform is explicit and the folder is empty
  (§7).
- The NOT FOUND resolution ladder (§3).
- Our own Material Symbols pipeline on Flutter and Compose (§10).
- Terms report before scraping (§11).
- Eval run isolation via a temporary `CLAUDE_CONFIG_DIR` (§12).

## 17. Left to the builder
- Exact file split inside `references/` and `assets/`, and the precomputed seed grid density.
- How the web components map to each framework's idioms (one shared CSS, thin wrappers).
- The spring-to-CSS conversion method, as long as it is derived from the token values and not
  hand-tuned.
- Exact CI runner images and caching.
