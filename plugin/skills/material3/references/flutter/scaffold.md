# Flutter scaffolding

For an empty folder or one without `pubspec.yaml` when the request is a Flutter app. `S` is the
skill folder, `<project>` the target folder. Read `detect` first: `tools.flutter.available`,
`flutterVersion`, `flutterLibrary`. An existing Flutter project is never scaffolded again.

## With the SDK (`tools.flutter.available: true`)

1. `flutter create --empty --project-name <name> --org <reverse.domain> --platforms android,ios --no-pub <project>`
   - Pinned options: `--empty` (no counter demo and no comments), `--platforms android,ios` (the
     phone targets the shots measure; add `web` or others only when the user asked), `--no-pub`
     (resolve once, after the dependency edit below). `<name>` is lowercase with underscores; the org
     is the user's, else ask or use `com.example`.
   - `--empty` writes a minimal `lib/main.dart`: replace it as in step 3. Write
     `test/widget_test.dart` from `S/assets/flutter/scaffold/test/widget_test.dart` (package name
     adjusted), or delete a generated test that no longer compiles.
2. `flutterVersion` 3.47 or newer: add `material_ui` (version in `S/versions.json`, `flutter.materialUi`)
   under `dependencies` in `pubspec.yaml`, keep `uses-material-design: true`, then
   `flutter pub get` (no network: say so and skip). Older: stay on `package:flutter/material.dart`
   and do not add the package.
3. Theme and screens: `setup.md` steps 1 to 4 (color script, install-assets, fonts in `pubspec.yaml`,
   `MaterialApp` wiring), then the screens. Import `package:material_ui/material_ui.dart` on
   `material_ui` projects, else `package:flutter/material.dart`; install-assets rewrites its files.
4. `flutter analyze` must be clean before the screenshot step.

## Without the SDK (`tools.flutter.available: false`)

Copy `S/assets/flutter/scaffold/` into `<project>` (`pubspec.yaml`, `lib/main.dart`,
`test/widget_test.dart`; rename the package in `pubspec.yaml` and in the test import if the user
named the app). It depends on `material_ui` and sets the Dart and Flutter constraints of the pinned
toolchain (Flutter 3.50.0, Dart 3.14.0); it has no platform folders. `lib/main.dart` imports
`m3/schemes.dart` and `m3/theme.dart`, which `setup.md` creates, so run its steps next.
Tell the user, in the report, to run once in `<project>`:

```
flutter create .
```

which adds the platform folders, followed by `flutter pub get`. State that the build, `flutter analyze` and the screenshots were skipped.
A project that must stay on `flutter/material.dart` (Flutter older than 3.47): replace the one
`material_ui` import in `lib/main.dart` and drop the dependency; install-assets does the same for
its files.

## Library choice

| Project | Do |
|---|---|
| New, Flutter 3.47 or newer | `material_ui` (above) |
| Existing, lists `material_ui` | Keep it; import `package:material_ui/material_ui.dart` |
| Existing, imports `package:flutter/material.dart`, Flutter older than 3.50 | Keep it; no message |
| Existing, imports `package:flutter/material.dart`, Flutter 3.50 or newer | Generate against that import and change nothing else. Say in the report that the user can migrate with `dart fix --apply --code=migrate_design_widgets`; the screenshot step prints the same in `warnings` |

Adding `material_ui` to an existing project is a dependency change: ask first (`coverage.md`:
`M3LoadingIndicator` needs it).

## Screenshot step

`node "S/scripts/screenshot/index.mjs" <project> --platform flutter` (needs the SDK on `PATH`).

- It copies the project to a temporary folder, runs `flutter pub get` and a generated test there,
  and deletes the copy. The project stays byte for byte as it was. Shots and `capture.json` go to a
  new folder under the OS temp directory (or `--out`, outside the project).
- Shots at 412x915 (device pixel ratio 2.625), light and dark, of the app's home (`lib/main.dart`
  `main()`; the dark run sets the platform brightness, so the app needs `themeMode: ThemeMode.system`).
  Named `<theme>-412x915-<nn>.png`: `01` is the top, `02` and on are the first vertical scrollable
  that can scroll, moved one viewport down each time, to its end. At most 4 frames per theme; when
  it is longer a warning says so.
- Plan check: every requested element must be visible in some frame; elements behind a tap (a
  menu, a dialog, another route) are not captured, so say which row was checked by reading the code.
- `runtime.contrast` and `runtime.targets` are flutter_test's text contrast guideline and a 48 x 48
  dp check of enabled tappable or focusable nodes, once per element; pass `capture.json` to verify.
- Fonts come from the skill (Roboto Flex, Roboto, Material Symbols Outlined) unless the app declares
  the family itself. Without the SDK the step reports `ran: false` and its reason.
