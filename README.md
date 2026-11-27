# m3-forge: an unofficial skill for Material Design 3

`/material3` is a Claude Code skill that builds Material Design 3 interfaces, M3 Expressive by
default, for the web, Flutter and Jetpack Compose. Describe the screen you want; the skill picks a
color scheme, installs theme and component assets, writes the UI from a screen plan, checks it with
a verifier, takes light and dark screenshots, looks at them and fixes what it finds.

> **Disclaimer.** Not affiliated with or endorsed by Google. Material Design is a design system by
> Google.
>
> Not to be confused with hamen/material-3-skill; this is a separate project.

<img src="docs/images/icon.png" alt="m3-forge icon: an anvil with a spark" width="96">

**Status:** experimental, version 0.1.0 (pre-release). The measured results are below: the
automated checks pass everywhere, but blind judges rate the screens as "correct M3 with minor
flaws", not first-party quality, and the project's own release bar is not met.

## Install

Use only one of the two installs. See [docs/install.md](docs/install.md) for updating, uninstalling,
paths on each system and troubleshooting.

### As a Claude Code plugin

```
/plugin marketplace add ReL4xi0n/m3-forge
/plugin install m3-forge@m3-forge
```

Command: `/m3-forge:material3`. You can also ask in plain words ("use the material3 skill to build …");
Claude then starts the skill itself.

A bare `/material3` also worked after a plugin install. In a clean configuration with no other
skills, Claude Code ran the plugin's skill for it, although the session's command list only shows
`m3-forge:material3`. If another installed command is also called `material3`, use the full name.

### As a personal skill

Copy `plugin/skills/material3/` to `~/.claude/skills/material3/` (on Windows
`%USERPROFILE%\.claude\skills\material3\`). Command: `/material3`.

Both installs were tried in a clean configuration (Claude Code 2.1.332, Windows), each with a
small web request. Both built the screen with `verify` reporting no errors, and took screenshots.

## Supported platforms and requirements

| Platform | What it builds | Screenshots need |
|---|---|---|
| Web | HTML, CSS and JavaScript with the shipped M3 component styles | Node and a Playwright browser |
| Flutter | Widgets with the M3 Expressive theme and components | Flutter SDK |
| Jetpack Compose | Composables with Material 3 (Expressive needs version 1.5 or newer) | JDK and Android SDK |

Everything except Claude Code is optional:

- **Node.js 22 or newer** gives exact color schemes, icon subsetting, the `verify` checks and the
  screenshot step.
- **The platform SDK** gives screenshots and the build checks of that platform.
- **Without them** the code is still written. The skill uses a precomputed color scheme, checks the
  code against its checklist by reading it, skips the screenshot step and lists every skipped step
  with its reason in the final report, with the command to run later.

The skill never edits Gradle or dependency files without asking, and never overwrites a file of
yours when installing assets.

## How to use

Call the command with a request in plain language. The platform is detected from the project
folder, or named in the request.

```
/material3 a recipe-sharing app home screen in Flutter: search, categories, a featured recipe and a bottom navigation bar
/material3 a preferences page for a music player, web, dark mode first, seed color teal
/material3 Compose: a fitness-tracker home with weekly progress, a workout list and a floating action button
/material3 classic Material 3 (not Expressive) first-run walkthrough for a library app, three screens, web
/material3 a login screen for a bike-rental service, Rounded icons
```

Useful things to put in a request: the platform, "classic M3" if you do not want Expressive, a brand
or seed color, dark-mode or density wishes, an icon style (Rounded or Sharp), and the language of the
UI text.

The skill ends with a report: what was built and where, platform and style, the color source, the
checks that ran and those skipped, each requested item with its screenshot, the problems it found
in the images, and anything you must run later.

## Examples

<!-- PENDING: gallery (outputs picked by the owner from the spot-check) -->

Finished outputs of the skill will be collected in [examples/](examples/): code plus light and dark
screenshots for each platform.

## Results

Measured on 26 eval requests (6 screen types, 3 platforms, default, classic and seed-color styles),
run once without the skill (baseline) and once with it, plus 6 unseen hold-out requests. Every output
was scored by blind judges in three independent sessions; the score of record is the median, on a
0–3 scale (2 = correct M3 with minor flaws, 3 = indistinguishable from first-party quality). Full
numbers: [evals/runs/p4-gap-report.md](evals/runs/p4-gap-report.md).

**Automated checks** (same verifier on every output): without the skill, every one of the 26 outputs
had findings, 1,290 in total (370 off-scale type sizes, 493 icons not from the official Material
Symbols source, 187 off-grid spacings, 73 touch targets below 48 dp, 60 hardcoded colors and more).
With the skill: **0 findings** in all 35 outputs (eval, hold-out and a Sonnet check), and all of them
build.

**Judged design quality** (means of the medians, without → with the skill):

| item | Web | Flutter | Compose |
|---|---|---|---|
| component choice | 2.56 → 2.78 | 2.33 → 2.44 | 2.75 → 2.38 |
| hierarchy and typography | 2.22 → 2.00 | 2.44 → 2.78 | 2.63 → 3.00 |
| color roles | 2.67 → 2.56 | 2.78 → 2.89 | 2.50 → 2.88 |
| shape (Expressive) | 2.67 → 2.44 | 2.89 → 2.56 | 2.38 → 2.50 |
| spacing and layout | 2.11 → 2.00 | 2.22 → 2.44 | 2.38 → 2.38 |
| interaction states | 2.56 → 2.78 | 2.89 → 2.89 | 2.63 → 2.88 |
| dark mode | 2.89 → 3.00 | 2.78 → 3.00 | 2.88 → 3.00 |
| overall polish | 2.00 → 2.00 | 1.89 → 2.00 | 2.00 → 2.00 |

What this means: the skill reliably produces token-correct, accessible M3 code with correct dark
themes, and improves several judged items, especially on Compose and Flutter. It does **not** reach
first-party polish: overall polish is 2 on every platform. On the web, a second run of every cell
confirmed that the skill's screens are less Expressive in shape and use smaller titles than
screens built without it. The project's own release bar
(every judged item ≥ 2.5 on every platform and better than baseline) is **not met**; the gap report
lists the reasons and the options being considered.

**Owner's visual check:** the owner looked at a sample of 12 outputs (4 per platform, 3 of them
hold-out) in light and dark next to reference screens and passed all 12. This is one person's
pass/fail check that the screens are usable and look like M3; it does not replace the judged
scores above (overall polish 2.00 on every platform, 4 single scores below 2). Both are reported
as measured. See also [Known limitations](#known-limitations).

## Known limitations

- **Popup menus on Compose.** Screenshots on Compose run under Robolectric, which cannot render
  popup windows such as dropdown menus. Elements that are always visible are checked in the main
  screenshots; a menu that opens on a tap cannot be shown.
- **Without Node** the skill cannot run `verify`, subset icons or take screenshots. It writes the
  code anyway, picks the nearest precomputed color scheme (so the seed may differ from the one you
  asked for, and the report says which was used) and reviews the code by reading it.
- **Rounded and Sharp icons** need a download. Offline, or when the download fails, the skill uses
  the bundled Outlined icons and tells you.
- **Compose icons** use the default weight and size only; other variable-font axes do not exist as
  official vectors.
- **Hierarchy and composition** (spacing, grouping, component choice) are judgment calls that
  `verify` cannot check. The skill reviews its own screenshots against a checklist, which is not a
  guarantee of a good layout.
- **Compose Expressive** needs Material 3 version 1.5 or newer. On older projects the skill asks
  before upgrading, and uses classic APIs if you decline.
- **Screenshots are for review**, not pixel-exact references: fonts and rendering differ between
  systems.

## Contributing

```
npm test                                # unit tests
git config core.hooksPath .githooks     # maintainers: enable the pre-commit and pre-push guards
```

- Nothing under `private/` is ever committed.
- The guards must never be bypassed (`--no-verify` is forbidden). A reviewed false positive goes
  into `tools/guard/allowlist.txt` with a reason.
- The hooks need the maintainers' private term list and fail closed without it. Other
  contributors can leave them off. CI repeats the checks; the term list is a repository secret,
  so it applies to branches in this repository and to every push to `main`.
- Commits must use a GitHub noreply email as author and committer; CI rejects any other address.

## License

Apache-2.0. See [LICENSE](LICENSE) and [NOTICE](NOTICE).
