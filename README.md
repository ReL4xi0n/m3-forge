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

**Status:** version 0.1.0, not yet released.

## Install

Use only one of the two installs. See [docs/install.md](docs/install.md) for updating, uninstalling,
paths on each system and troubleshooting.

### As a Claude Code plugin

```
/plugin marketplace add ReL4xi0n/m3-forge
/plugin install m3-forge@m3-forge
```

Command: `/m3-forge:material3`.

A bare `/material3` after a plugin install: <!-- PENDING: install-path verification -->

### As a personal skill

Copy `plugin/skills/material3/` to `~/.claude/skills/material3/` (on Windows
`%USERPROFILE%\.claude\skills\material3\`). Command: `/material3`.

Result of the manual install: <!-- PENDING: install-path verification -->

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

<!-- PENDING: gallery -->

Finished outputs of the skill will be collected in [examples/](examples/): code plus light and dark
screenshots for each platform.

## Results

<!-- PENDING: Phase 4 results -->

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
