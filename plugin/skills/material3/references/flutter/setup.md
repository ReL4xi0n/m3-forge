# Flutter setup

`S` is the skill folder; `<project>` is the Flutter project (the folder with `pubspec.yaml`). The
detect script reports `flutterLibrary`: `material_ui` when `pubspec.yaml` lists the package, else
`material`.

## Steps

1. Color schemes (class `M3ColorSchemes`, written to `lib/m3/schemes.dart`):
   `node "S/scripts/color/index.mjs" --seed "<hex>" --platform flutter --style expressive --out "<project>/lib/m3/schemes.dart" [--flutter-library material_ui]`.
   Pass `--flutter-library material_ui` when the project uses it (it sets the import line). Classic
   M3: `--style classic`. Exit 3: the file exists and is not generated; pick another name.
2. Assets: `node "S/scripts/install-assets/index.mjs" <project> --platform flutter --parts tokens,fonts`.
   - `tokens` copies `lib/m3/{tokens,type,shape,space,motion,theme}.dart`. `theme.dart` is part of
     `tokens`: it needs the other five.
   - `fonts` copies Roboto, Roboto Flex and Material Symbols Outlined (TTF) and the licenses into
     `assets/fonts/`, and prints the `pubspec.yaml` snippet to add.
   - The library import is rewritten for you (`material` or `material_ui`, read from `pubspec.yaml`;
     `--flutter-library` overrides). Never edit an installed file: verify exempts the shipped files only
     while they are unchanged.
3. `pubspec.yaml`: add the printed `flutter:` `fonts:` entries (families `Roboto Flex`, `Roboto`,
   `MaterialSymbolsOutlined`) and keep `uses-material-design: true`. Run `flutter pub get` when a
   dependency changed (no network: say so, skip it).
4. Wire the theme into `MaterialApp` (`theme.md`).
5. Icons: `node "S/scripts/icons/index.mjs" <project> --platform flutter --names a,b,c`. Exit 5 means
   no Flutter icon back end in this version: use `IconData(<codepoint>, fontFamily: 'MaterialSymbolsOutlined')`
   with codepoints from `S/assets/fonts/MaterialSymbolsOutlined.codepoints`, never `Icons.*`.

## Both libraries

One source tree builds under both imports: `package:flutter/material.dart` (the shipped form) and
`package:material_ui/material_ui.dart`. App code imports the same Material symbols from whichever
the project already uses; do not add the other package to a project.

- `material_ui`: `M3Theme` also sets the style variant (`StyleVariant.material3Expressive` for
  Expressive, `StyleVariant.material3` for Classic) on `ElevatedButtonThemeData` and
  `IconButtonThemeData`. `install-assets` turns the `// [material_ui] <code>` lines of `theme.dart`
  into code for this library only.
- `flutter/material`: no style variant exists; those lines stay comments. The Flutter SDK that
  deprecates this import reports an info on the import line: leave it, do not switch libraries.

## Files

| File | Written by | Notes |
|---|---|---|
| `lib/m3/schemes.dart` | color script | `M3ColorSchemes.light`, `.dark`, `.lightMediumContrast`, ... |
| `lib/m3/{tokens,type,shape,space,motion,theme}.dart` | install-assets | `tokens.dart` exports type, shape, space, motion |
| `assets/fonts/*` | install-assets (`fonts`) | licenses ship next to the fonts |

Re-running `install-assets` later: leave out `fonts` once the icons script has replaced the font
subset (a differing file is a conflict, exit 3).
