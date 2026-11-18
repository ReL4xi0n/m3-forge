# Compose setup

`S` is the skill folder; `<project>` is the Gradle project (the folder with `settings.gradle.kts`);
`<module>` is `app` when that folder exists, else the project root; `<pkg>` is the app package
(`namespace` in the module's `build.gradle.kts`). The detect script reports `composeMaterial3`
(resolved version or null), `belowExpressive` (true, false or null when the version could not be
resolved) and `composeBom`.

New project (no `settings.gradle.kts`): copy the template first (next section), then the steps.
Which composable to use: the core references; the theme wiring: `theme.md`; icons: `icons.md`.

## New project: the template

`S/assets/compose/template/` is a single-module Android project: version catalog (agp, Kotlin,
material3 from `S/versions.json`), the Gradle wrapper at the pinned Gradle version, and `app/` with a
manifest and a `MainActivity` that wraps a sample screen in `M3Theme`.

1. Copy the whole folder to `<project>`. Keep `gradlew` executable. The template is for empty folders
   only: never copy it over an existing project.
2. Rename the package `m3.app` to the user's: `namespace` and `applicationId` in
   `app/build.gradle.kts`, the folder `app/src/main/kotlin/m3/app/`, the `package` line and the
   `m3.app.theme.*` imports of `MainActivity.kt`. Replace the sample screen with the requested one and
   set `android:label` in the manifest.
3. The template has no theme files: run the steps below with `--package <pkg>`.
4. Pins that stay together: `agp`, `kotlin`, `material3` and `compileSdk` come from `S/versions.json`;
   the wrapper's `distributionUrl` names the pinned Gradle version. Never change one without the others.

## Steps

1. Color schemes (written to `<module>/src/main/kotlin/<pkg path>/theme/Color.kt`):
   `node "S/scripts/color/index.mjs" --seed "<hex>" --platform compose --style expressive --package <pkg> --out "<module>/src/main/kotlin/<pkg path>/theme/Color.kt"`.
   Classic M3: `--style classic`. Exit 3: the file exists and is not generated; pick another name.
2. Assets: `node "S/scripts/install-assets/index.mjs" <project> --platform compose --parts theme --package <pkg>`
   - `theme` copies `Motion.kt`, `Shape.kt`, `Space.kt`, `Theme.kt`, `Tokens.kt` and `Type.kt` into the
     theme folder and rewrites the `package` line. `Theme.kt` needs the other files and `Color.kt`.
   - material3 below 1.5 (`belowExpressive: true`): use `--parts theme-below-1.5` instead (never both).
     Its `Theme.kt` uses `MaterialTheme`, and its first lines name what the old library lacks.
   - Never edit an installed file: verify exempts the shipped files only while they are unchanged.
3. Dependencies: material3 at 1.5 or newer is required for the Expressive components and shapes. When
   `belowExpressive` is true, say so in the report: the theme still works, the Expressive components
   do not exist. Do not raise the version without the user's consent. `belowExpressive: null`: read the
   resolved version from the Gradle files or ask.
4. Wire the theme (`theme.md`).
5. Icons: `icons.md`.
6. Build: `./gradlew :app:assembleDebug` (`gradlew.bat` on Windows) when the Android SDK and a JDK are
   present (see `tools` in detect). Fix every compile error before the screenshot step.

## Files

| File | Written by | Notes |
|---|---|---|
| `theme/Color.kt` | color script | `M3LightColorScheme`, `M3DarkColorScheme`, `M3LightMediumContrastColorScheme`, ... |
| `theme/{Motion,Shape,Space,Theme,Tokens,Type}.kt` | install-assets | `M3Motion`, `M3Shapes`, `M3Space`, `M3Theme`, `M3Elevation`, `M3Typography` |

## Without Node

- Copy `S/assets/compose/theme/{Motion,Shape,Space,Theme,Tokens,Type}.kt` (below 1.5:
  `S/assets/compose/theme/below-1.5/Theme.kt` instead of `Theme.kt`) to the theme folder. Change only
  the line `package m3.theme` to `package <pkg>.theme`. Never retype the other lines.
- Colors: pick the seed by `nearest` in `S/tokens/precomputed-schemes.json` (`references/core/color.md`;
  classic M3: the `classic` entry for the `classicVariants`). Write `theme/Color.kt` with the same
  package line, the imports `androidx.compose.material3.lightColorScheme`,
  `androidx.compose.material3.darkColorScheme` and `androidx.compose.ui.graphics.Color`, and one
  value per scheme: `val M3LightColorScheme = lightColorScheme(primary = Color(0xFF<hex>), ...)`
  (`M3DarkColorScheme` with `darkColorScheme`; the contrast variants `M3LightMediumContrastColorScheme`,
  `M3LightHighContrastColorScheme`, `M3DarkMediumContrastColorScheme`, `M3DarkHighContrastColorScheme`).
  The scheme string holds the `roles` in order, 6 hex digits each; leave out `shadow`. Copy the digits;
  never retype or round them. The file name `Color.kt` marks it as the theme file for verify.
- Gradle: with no JDK or Android SDK nothing can be built. Write the code, skip the build and the
  screenshot step, and name both in the report.
- Icons: `icons.md` (No Node).

Re-running `install-assets` later: a differing installed file is a conflict (exit 3), never overwritten.
