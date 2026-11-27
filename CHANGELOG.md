# Changelog

## 0.1.1 (2026-11-27)

- The skill can be started by Claude when asked in plain words (for example "use the material3
  skill to …"), not only through the slash command. `disable-model-invocation` is removed.

## 0.1.0 (2026-11-27, experimental pre-release)

First release of m3-forge, an unofficial skill for Material Design 3. Experimental: the project's
release bar (spec section 12) is not met; see the Results section of the README and
[evals/runs/p4-gap-report.md](evals/runs/p4-gap-report.md).

### Skill

- `/material3 <UI request>` (`/m3-forge:material3` when installed as a plugin): builds a Material
  Design 3 UI, M3 Expressive by default and classic M3 on request, for the web, Flutter and Jetpack
  Compose.
- An eight-step workflow: read the request, detect the project, load references, theme and icons,
  build from a screen plan, verify, look at screenshots, report.
- Graceful degradation: without Node, an SDK or a network the code is still written, and the report
  names each skipped step.

### References

- Shared core notes: color, typography, shape, layout, composition, icons, content, components,
  elevation, motion, states, accessibility, expressive, anti-patterns.
- Per-platform notes for web, Flutter and Compose, and a build checklist with rule IDs.
- Design tokens in JSON and precomputed color schemes for use without Node.

### Assets

- Web: token style sheet, font styles, component style sheets and a behavior script.
- Flutter: theme, tokens and Expressive component widgets, with scaffolding for a new project.
- Compose: theme files and a project template pinned to the Material 3 version that has Expressive.
- Bundled fonts and a subset icon source, so no network is needed.

### Scripts

- `detect` (platform, framework, Material 3 version, tool availability), `color` (scheme
  generation), `icons` (icon lookup and subsetting), `install-assets` (never overwrites a user
  file), `verify` (static checks plus runtime results) and `screenshot` (light and dark captures,
  plan check).

### Harnesses

- Capture harnesses for web (Playwright with contrast and target-size checks), Flutter (widget
  tests) and Compose (Robolectric and Roborazzi), pinned and versioned.

### Evals

- A blind, rubric-based evaluation set with a no-skill baseline, automated checks, a judge
  protocol, pooled scoring and a repository guard against eval content leaking into the skill.

### Repository

- Privacy guard for public commits, CI checks, plugin and marketplace validation, install
  documentation and a plugin icon.
