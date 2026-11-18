# Compose theme

`theme/Theme.kt` holds `M3Theme(darkTheme, content)`. It combines the color scheme of `Color.kt`
(color script), `M3Typography`, `M3ShapeScheme` and, on material3 1.5 or newer, the expressive motion
scheme. The tokens come from the same package: `M3Space`, `M3Shapes`, `M3Elevation`, `M3Motion`.

## Wiring

```kotlin
setContent {
    M3Theme {
        HomeScreen()
    }
}
```

- `darkTheme` defaults to `isSystemInDarkTheme()`. Pass it only for an in-app switch.
- Wrap every screen and every preview in `M3Theme`; do not nest a `MaterialTheme` inside it.
- One `M3Theme` call at the root; no second theme beside it.

## What the theme sets

- 1.5 or newer: `MaterialExpressiveTheme` with `MotionScheme.expressive()`. `Theme.kt` opts in to
  `ExperimentalMaterial3ExpressiveApi` with a one-line comment. The Expressive components
  (`LoadingIndicator`, `ButtonGroup`, `MaterialShapes`, ...) are experimental: each file that uses one
  carries `@OptIn(ExperimentalMaterial3ExpressiveApi::class)` and a one-line comment saying why.
- Below 1.5 (`theme-below-1.5`): `MaterialTheme`, no motion scheme. Missing there: `MaterialExpressiveTheme`,
  `MotionScheme`, `MaterialShapes`, `LoadingIndicator`, `ButtonGroup` and the other Expressive APIs.
  Use the closest stable component (`CircularProgressIndicator`) and say so in the report.
- `colorScheme`: `M3LightColorScheme` or `M3DarkColorScheme`. Read roles with `MaterialTheme.colorScheme.<role>`.
- `typography`: `M3Typography`; styles with `MaterialTheme.typography.<role>`.
- `shapes`: `M3ShapeScheme`; the Expressive steps and the full scale are on `M3Shapes.*`.

## Classic Material 3

Pair a scheme written with `--style classic` with `MotionScheme.standard()` in `Theme.kt` (the file name
keeps it a theme file) and the plain type roles. Use Classic only when the user asks or the project is
already Classic; an Expressive scheme in a Classic theme mixes two color specs.

## Contrast variants

`M3LightMediumContrastColorScheme` and the other variants replace the scheme argument in `Theme.kt`
only when the app offers a contrast setting. Screens never pick them.

## Rules for UI code

- Spacing: `M3Space.*` only, in `padding`, `spacedBy` and `Spacer`. Corners: `M3Shapes.*`. Elevation: `M3Elevation.*`.
- Colors: `MaterialTheme.colorScheme.<role>`; no `Color(0x...)` outside `Color.kt`.
- Text: `MaterialTheme.typography.<role>`; no `.sp` literals in screens.
- Motion: `M3Motion.expressive.defaultSpatial.spec()` for movement, `.defaultEffects` for color and
  opacity (`M3Motion.standard` in Classic). Do not copy the asset values into screens; use the names.
- Use the official components (`Button`, `Card`, `NavigationBar`, ...): the theme styles them.
