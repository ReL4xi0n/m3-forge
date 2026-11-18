# Flutter theme

`lib/m3/theme.dart` holds `M3Theme` and `M3MotionTheme`. Import `m3/tokens.dart` for the tokens and
`m3/theme.dart` for the theme (the theme file imports the tokens itself).

## Wiring

```dart
import 'm3/schemes.dart';
import 'm3/theme.dart';

MaterialApp(
  theme: M3Theme.light(M3ColorSchemes.light),
  darkTheme: M3Theme.dark(M3ColorSchemes.dark),
  themeMode: ThemeMode.system,
  home: const HomeScreen(),
);
```

`M3Theme.light(scheme)` and `M3Theme.dark(scheme)` return a `ThemeData`. The scheme decides the
brightness; pass a contrast variant (`M3ColorSchemes.lightMediumContrast`, ...) when the app offers
one. Keep one `M3Theme` call per brightness; do not build `ThemeData` by hand next to it.

## What the theme sets

- `colorScheme`: the scheme argument (every role used in UI code comes from `Theme.of(context).colorScheme`).
- `textTheme`: `M3Type.textTheme`. Read styles with `Theme.of(context).textTheme.<role>`.
- Shapes: `cardTheme` (`M3Shapes.medium`), `dialogTheme` (`M3Shapes.extraLarge`),
  `bottomSheetTheme` (`M3Shapes.extraLargeTop`). Other shapes: `M3Shapes.*` or `M3Corners.*`.
- Extensions: `M3MotionTheme` (always) and `M3EmphasizedType` (Expressive only).
- `material_ui` only: the style variant on elevated and icon buttons (`setup.md`).

## Reading the extensions

- Emphasized type: `M3EmphasizedType.of(context).titleLarge` for the headline of a card, a screen
  title or a selected state. It falls back to the baseline emphasized scale when the theme has none,
  so call sites need no Classic branch. In a Classic app, use the plain `textTheme` roles instead.
- Motion: `M3MotionTheme.of(context)` returns the `M3MotionScheme` of the theme (expressive by default,
  standard for Classic): `M3MotionTheme.of(context).defaultSpatial` for movement,
  `.defaultEffects` for color and opacity. Durations and easings stay on `M3Motion`.

## Classic Material 3

`M3Theme.light(scheme, expressive: false)` and `M3Theme.dark(scheme, expressive: false)`: standard motion
scheme, no `M3EmphasizedType`, no Expressive style variant. Pair it with a scheme written by the
color script with `--style classic`; an Expressive scheme in a Classic theme (or the reverse) mixes
two color specs. Use Classic only when the user asks for it or the project already is Classic.

## Rules for UI code

- Spacing: `M3Space.*` only. Corners: `M3Corners.*` and `M3Shapes.*`. Elevation: `M3Elevation.*`.
- Colors: `Theme.of(context).colorScheme.<role>`; no `Color(0x...)` in UI files (the generated
  `schemes.dart` is the only place with literals).
- Do not copy values out of the assets into screens; reference the names.
- Use the official widgets (`FilledButton`, `Card`, `NavigationBar`, ...): the theme styles them.
