# Flutter icons (Material Symbols)

Flutter icons are `IconData` constants into the bundled `MaterialSymbolsOutlined` variable font
(axes FILL, wght, GRAD, opsz). Never `Icons.*` (legacy Material Icons: verify flags `icon-source`),
`CupertinoIcons`, other icon packages or emoji.

## Generate the constants

`S` is the skill folder (`${CLAUDE_SKILL_DIR}`).

```
node "S/scripts/icons/index.mjs" <project> --platform flutter --names settings,home,arrow_back
```

- Names are checked against `S/assets/fonts/MaterialSymbolsOutlined.codepoints`; an unknown name
  exits 4 with the three closest names. Offline: Outlined never uses the network.
- Writes `lib/m3/m3_symbols.dart` (`abstract final class M3Symbols`, one
  `static const IconData settings = IconData(0xe8b8, fontFamily: 'MaterialSymbolsOutlined')` each) and
  copies `assets/fonts/MaterialSymbolsOutlined.ttf` if it is not there (the `fonts` part of
  install-assets puts the same file there). A second run adds names; it keeps the earlier ones.
- Constant name = lowerCamelCase of the icon name (`arrow_back` -> `arrowBack`). A name that is not a
  Dart identifier gets `$`: `$10k`, `$class`, `$switch`, `$try`. A few keep snake_case (`$2d_2`).
- The file starts with `// material3 skill asset: generated/m3_symbols.dart`. Do not edit it: re-run
  the script. verify scans it like UI code; a hand edit with `Icons.*` is flagged.
- Exit 3: `lib/m3/m3_symbols.dart` exists and is not generated; the skill never overwrites it.
- Rounded or Sharp asked for: the report says "Rounded icons requested but could not be downloaded
  (offline?); used bundled Outlined. Re-run with network access to switch."

## pubspec.yaml

The script prints `pubspecEdit`. Show it to the user, then add it under `flutter:` > `fonts:`
(never edit `pubspec.yaml` silently; install-assets prints the same family with the others):

```yaml
    - family: MaterialSymbolsOutlined
      fonts:
        - asset: assets/fonts/MaterialSymbolsOutlined.ttf
```

## Use

```dart
import 'm3/m3_symbols.dart';

const Icon(M3Symbols.settings)                                   // FILL 0, wght 400, GRAD 0, opsz 24
const Icon(M3Symbols.favorite, fill: 1)                           // selected / active state
const Icon(M3Symbols.home, fill: 1, weight: 700, grade: 0, opticalSize: 24)
```

Defaults: FILL 0, wght 400, GRAD 0, opsz 24. Use FILL 1 for the selected state of nav items, toggles
and chips; keep opsz at the icon's size in dp (20 to 48). Icon buttons need a `tooltip` or
`semanticLabel`. Use the constants as `const`: that is what lets the build drop unused glyphs.

## Tree shaking (measured)

`flutter build web --release` on a `flutter create` project with four constants and fill, weight,
grade and opsz set: "MaterialSymbolsOutlined.ttf was tree-shaken, reducing it from 10744832 to
12776 bytes". The subset font keeps all four axes (`fvar`: FILL 0-1, GRAD -50-200, opsz 20-48,
wght 100-700), so the axes arguments still work in release builds: axes kept, no
`--no-tree-shake-icons` needed. Without tree shaking the full 10.7 MB font ships.

## No Node

Write `lib/m3/m3_symbols.dart` by hand in the same form. The code point is the hex value on the
icon's line in `S/assets/fonts/MaterialSymbolsOutlined.codepoints`; check every name first:

```
grep -E "^(settings|home) " "S/assets/fonts/MaterialSymbolsOutlined.codepoints"
```

No line for a name means it is not an icon: pick another, never invent a code point. Copy the TTF
to `assets/fonts/` and add the pubspec entry above. Keep the marker line out of a hand-written
file (verify then checks it as ordinary code).
