---
title: Color
kind: style
pages: [/styles, /styles/color/system/overview, /styles/color/system/how-the-system-works, /styles/color/roles, /styles/color/choosing-a-scheme, /styles/color/static/baseline, /styles/color/static/custom-brand, /styles/color/dynamic/choosing-a-source, /styles/color/dynamic/user-generated-source, /styles/color/dynamic/content-based-source, /styles/color/advanced/overview, /styles/color/advanced/apply-colors, /styles/color/advanced/define-new-colors, /styles/color/advanced/adjust-existing-colors, /styles/color/resources, /blog/science-of-color-design, /blog/google-material-custom-theme, /blog/material-theme-builder, /blog/start-building-with-material-you]
tokenSets: [sys.color, ref.palette]
expressive: true
fetched: 2026-11-13
---

## Summary

Material color works like a numbered colouring sheet. Every UI element points at a named color
role (primary, on surface, outline variant, ...), and a scheme decides which actual color each role
gets. Swap the scheme and the whole UI recolors while the mappings stay put.

- A scheme is either static (picked once, never changes at runtime) or dynamic (generated on the
  device from a source color taken from the wallpaper or from on-screen content).
- Both kinds come with a light and a dark theme, and every role exists at three contrast levels:
  standard, medium and high.
- Generation runs in the HCT color space (hue, chroma, tone). One source color yields five key
  colors (primary, secondary, tertiary, neutral, neutral variant). Each key color becomes a tonal
  palette, and roles take fixed tones from those palettes.
- The algorithm lives in Material Color Utilities (MCU). It ships several scheme variants (tonal
  spot, vibrant, expressive, fidelity, content and others); see "Default variant per style" below.

## Rules

### Color roles

- Always style with roles, never with raw hex values or palette tones. Hard-coded colors break
  dark theme, contrast settings and dynamic color.
- Name parts:
  - Surface: backgrounds and large quiet areas.
  - Primary, secondary, tertiary: accent groups, from most to least emphasis.
  - Container: a fill for foreground elements such as buttons; not for text or icons.
  - On ...: text and icons drawn on top of the matching role (on primary sits on primary).
  - Variant: a quieter alternative to the role without the suffix.
- Accent groups. Each has four roles: the color, on color, container, on container.
  - Primary: the most prominent controls and active states (FAB, high-emphasis buttons).
  - Secondary: things that need less emphasis, such as filter chips, tonal buttons and a selected
    navigation icon.
  - Tertiary: contrasting accents that balance the other two or pull attention to a small item
    (a badge, an input field). Use it at your discretion.
- Error: four roles for error states. They stay static even inside a dynamic scheme, but they still
  switch between light and dark.
- Surfaces:
  - Surface (default background), on surface (main text and icons), on surface variant (quieter
    text and icons on any surface).
  - Five container levels for nesting and hierarchy: lowest, low, default, high, highest.
  - A common pairing is surface for the body and surface container for navigation. Keep each
    layout region on the role it had at smaller breakpoints; extra container levels may be added on
    large windows if used consistently.
  - Components such as navigation bars, menus and dialogs default to specific container levels,
    and makers may remap them.
- Inverse roles (inverse surface, inverse on surface, inverse primary) build elements that stand
  out against the surrounding UI, such as a snackbar and its action.
- Outlines:
  - Outline: meaningful boundaries, such as a text field border.
  - Outline variant: dividers and decoration. It may border chips or buttons only when their own
    icons and text already give enough contrast.
- Add-on roles. Most products never need them.
  - Fixed and fixed dim (per accent group): fills whose tone does not flip between light and
    dark. On fixed and on fixed variant go on top of them.
  - Surface dim and surface bright: they keep their relative brightness in both themes, unlike
    plain surface, which inverts.
- Pair roles only as designed (color with on color, container with on container). Other pairings
  can lose contrast when the user raises the contrast level.

### Static and dynamic schemes

- Static schemes:
  - Baseline: Material's default static scheme, generated from a source color a designer chose.
    Use it when dynamic color is not ready yet, when migrating from M2, for enterprise products
    that gain nothing from personalization, and on iOS.
  - Custom brand: your team picks the source colors (primary, and optionally secondary, tertiary,
    error, neutral, neutral variant) in Material Theme Builder. Brand schemes cost more effort to
    build and to maintain.
  - Static schemes give no personalization and no user-controlled contrast.
- Dynamic schemes:
  - Give personal colors, user-controlled contrast and automatic dark theme, at the cost of the
    UI not looking identical on every device.
  - Design against the baseline scheme first so the role mapping is right, then preview many
    source colors in Material Theme Builder.
  - Mixed schemes are allowed: you can add static colors to a dynamic scheme later.

### Dynamic color sources

- User-generated: the source color is extracted from the Android user's wallpaper. Quantization
  reduces the image to a few colors, a scoring step ranks them (colorful and widely used colors
  win, near-grey ones are dropped), and the winner or the user's pick becomes the source. Choose it
  when personalization matters most.
- Content-based: the source comes from in-app imagery such as album art, a logo or a video
  preview. Tones are tuned so the scheme resembles the image while keeping contrast. Choose it when
  content is the centre of the product, for example a media player.
  - Keep the source image on screen near the elements it colors.
  - Use it for contained areas: a media control, one card per item in a list, a purchase flow.
- Multiple sources on one screen: start from a baseline or user-generated scheme for the whole app
  and layer one content-based scheme on contained areas. Do not mix more than two source types on
  one screen.
- Never let content color replace semantic colors (a red error, a green success).

### Custom and brand colors

- Define new colors (once called "custom colors", now "static colors"): give one reference color
  and get four roles back (color, on color, container, on container) that behave like an accent
  group. Use them for brand or semantic meaning, such as a "success" green. Error red already
  exists, so do not define another.
- Custom color roles: only when nothing else works. For each role you must name a palette and a
  reference tone for light and dark, the pairs it must contrast with, and the minimum contrast;
  MCU then resolves it per theme and contrast level.
- Your own baseline scheme: enter primary, secondary, tertiary, neutral and neutral variant colors.
  Conventionally primary and tertiary carry the most color (tertiary shifts hue); secondary,
  neutral variant and neutral keep primary's hue with less and less chroma.
- Your own dynamic scheme: supply hue and chroma rules per palette and define your own scheme
  variant, for example a more vibrant wallpaper scheme.
- Color fidelity ("match color" in Theme Builder) moves tones toward the input color so a dark or
  light brand color still looks like itself. Theme Builder turns it on by default for custom
  baselines and static colors.
- Harmonization rotates a static color's hue toward the scheme's primary color, by a limited
  amount, so it sits better in a dynamic scheme while keeping its meaning (a red stays red). Do not
  harmonize brand colors or colors tied to real-world signage. In code this is MCU's
  `Blend.harmonize`.
- Remapping: you may change a component's default roles or map roles onto custom components.
  Prefer pairs whose "on" partner guarantees contrast, and test light, dark and several source hues.

### Contrast levels

- Standard (default): mixes high- and low-contrast elements to show hierarchy and reduce load.
- Medium: for people who need more contrast but are bothered by very strong contrast (for example
  halation); at least 3:1.
- High: 7:1 on essential content (for example the content of a card, not the card container).
- Levels apply to light and dark alike. Custom components support them automatically when they use
  role pairs such as primary container with on primary container.

### What changed, including M3 Expressive

- Feb 2023: tone-based surface roles (surface dim, surface bright and the five container levels)
  replaced the old elevation tints (surface +1 to +5). The default light surface moved from tone 99
  to tone 98, neutral chroma rose from 4 to 6, and dark surfaces got slightly darker. Fixed accent
  roles were added.
- Oct 2023: the guidelines were reorganized; the system itself did not change.
- Aug 2024: in light theme, on primary container, on secondary container, on tertiary container
  and on error container became more colorful (tone 30 instead of tone 10). Badges, buttons, FABs,
  icon buttons, segmented buttons, chips, lists, menus, navigation components, switches and
  toolbars are affected.
- May 2025 (the M3 Expressive release): three contrast levels, each with its own tokens.
- No color page names a new scheme variant for M3 Expressive; see the next section.

## Default variant per style

The scheme variant used when a dynamic scheme is generated from a source color, without the app
choosing one.

| Style | Default variant | Code evidence | Site evidence |
|---|---|---|---|
| M3 | Tonal spot (`DynamicSchemeVariant.tonalSpot`, MCU `Variant.TONAL_SPOT`) | `ColorScheme.fromSeed` default [impl:material_ui/packages/material_ui/lib/src/color_scheme.dart:283]; `ColorScheme.fromImageProvider` default [impl:material_ui/packages/material_ui/lib/src/color_scheme.dart:1758]; enum doc "Default for Material theme colors" [impl:material_ui/packages/material_ui/lib/src/color_scheme.dart:31]; MCU doc calls tonal spot the default Material You theme on Android 12 and 13 [impl:material-color-utilities/package/scheme/scheme_tonal_spot.js:23] | No color page names a variant [NOT FOUND] |
| M3 Expressive | [NOT FOUND] | No source sets a variant for the Expressive style (details below) | No color page names a variant [NOT FOUND] |

How each source was read:

- `knowledge/tokens/color-system.json` (`defaultVariantEvidence`): it lists only the line where each
  MCU scheme class declares its own variant, for example
  [impl:material-color-utilities/package/scheme/scheme_tonal_spot.js:29] and
  [impl:material-color-utilities/package/scheme/scheme_expressive.js:26]. None of them picks a
  default for a style.
- Flutter (`material_ui` 1.11.0):
  - The tonal spot default is explicit for seed and image schemes (M3 row).
  - `StyleVariant.material3Expressive` [impl:material_ui/packages/material_ui/lib/src/theme_data.dart:213]
    is read only by the elevated-button and icon-button themes
    [impl:material_ui/packages/material_ui/lib/src/elevated_button_theme.dart:189]
    [impl:material_ui/packages/material_ui/lib/src/icon_button_theme.dart:180]. It never reaches
    `ColorScheme`.
  - `ThemeData(colorSchemeSeed: ...)` calls `ColorScheme.fromSeed` without a variant
    [impl:material_ui/packages/material_ui/lib/src/theme_data.dart:533], so an Expressive-styled
    Flutter app still gets tonal spot. That is a side effect of the code, not a stated Expressive
    default, so the row stays NOT FOUND.
- Jetpack Compose (material3 1.5.0-rc01):
  - It has no scheme-variant or seed API. `dynamicLightColorScheme` and `dynamicDarkColorScheme`
    read the colors the Android system already generated
    [impl:compose-material3/androidMain/androidx/compose/material3/DynamicTonalPalette.android.kt:192],
    so the operating system, not the library, chooses the variant.
  - `MaterialExpressiveTheme` falls back to `expressiveLightColorScheme()`
    [impl:compose-material3/commonMain/androidx/compose/material3/MaterialTheme.kt:261], documented
    as its default scheme [impl:compose-material3/commonMain/androidx/compose/material3/ColorScheme.kt:1166].
    That is a static scheme: the baseline with the on-container roles moved to tone 30
    [impl:compose-material3/commonMain/androidx/compose/material3/ColorScheme.kt:1175]. It is not a
    generated variant.
  - Plain `MaterialTheme` falls back to the static `lightColorScheme()`
    [impl:compose-material3/commonMain/androidx/compose/material3/MaterialTheme.kt:178].
- MCU 0.4.0: the variant called EXPRESSIVE is described as deliberately detached from the source
  color [impl:material-color-utilities/package/scheme/scheme_expressive.js:20]. Nothing in MCU ties
  it to the M3 Expressive style. Do not infer the default from the name.
- Do the sources disagree? Not on a stated default, because only the M3 row has one. They do differ
  in what an app gets with no choice: Flutter generates tonal spot from a seed, while Compose's
  Expressive theme uses a static scheme and leaves dynamic generation to the system.
- Spec version is a separate setting from the variant. MCU defaults to the 2021 spec
  [impl:material-color-utilities/package/dynamiccolor/dynamic_scheme.js:347] and honours the 2025
  spec only for the expressive, vibrant, tonal spot and neutral variants; all others fall back to
  2021 [impl:material-color-utilities/package/dynamiccolor/dynamic_scheme.js:31]. No source says
  which spec version goes with the M3 Expressive style [NOT FOUND].

## Measurements

Baseline static scheme, standard contrast. Values are material-web's (canonical).

| Role | Light | Dark |
|---|---|---|
| Primary | #6750A4 [token:md.sys.color.primary] | #D0BCFF [token:md.sys.color.primary] |
| On primary | #FFFFFF [token:md.sys.color.on-primary] | #381E72 [token:md.sys.color.on-primary] |
| Primary container | #EADDFF [token:md.sys.color.primary-container] | #4F378B [token:md.sys.color.primary-container] |
| On primary container | #4F378B [token:md.sys.color.on-primary-container] | #EADDFF [token:md.sys.color.on-primary-container] |
| Secondary | #625B71 [token:md.sys.color.secondary] | #CCC2DC [token:md.sys.color.secondary] |
| On secondary | #FFFFFF [token:md.sys.color.on-secondary] | #332D41 [token:md.sys.color.on-secondary] |
| Secondary container | #E8DEF8 [token:md.sys.color.secondary-container] | #4A4458 [token:md.sys.color.secondary-container] |
| On secondary container | #4A4458 [token:md.sys.color.on-secondary-container] | #E8DEF8 [token:md.sys.color.on-secondary-container] |
| Tertiary | #7D5260 [token:md.sys.color.tertiary] | #EFB8C8 [token:md.sys.color.tertiary] |
| On tertiary | #FFFFFF [token:md.sys.color.on-tertiary] | #492532 [token:md.sys.color.on-tertiary] |
| Tertiary container | #FFD8E4 [token:md.sys.color.tertiary-container] | #633B48 [token:md.sys.color.tertiary-container] |
| On tertiary container | #633B48 [token:md.sys.color.on-tertiary-container] | #FFD8E4 [token:md.sys.color.on-tertiary-container] |
| Error | #B3261E [token:md.sys.color.error] | #F2B8B5 [token:md.sys.color.error] |
| On error | #FFFFFF [token:md.sys.color.on-error] | #601410 [token:md.sys.color.on-error] |
| Error container | #F9DEDC [token:md.sys.color.error-container] | #8C1D18 [token:md.sys.color.error-container] |
| On error container | #8C1D18 [token:md.sys.color.on-error-container] | #F9DEDC [token:md.sys.color.on-error-container] |
| Surface | #FEF7FF [token:md.sys.color.surface] | #141218 [token:md.sys.color.surface] |
| On surface | #1D1B20 [token:md.sys.color.on-surface] | #E6E0E9 [token:md.sys.color.on-surface] |
| On surface variant | #49454F [token:md.sys.color.on-surface-variant] | #CAC4D0 [token:md.sys.color.on-surface-variant] |
| Surface container lowest | #FFFFFF [token:md.sys.color.surface-container-lowest] | #0F0D13 [token:md.sys.color.surface-container-lowest] |
| Surface container low | #F7F2FA [token:md.sys.color.surface-container-low] | #1D1B20 [token:md.sys.color.surface-container-low] |
| Surface container | #F3EDF7 [token:md.sys.color.surface-container] | #211F26 [token:md.sys.color.surface-container] |
| Surface container high | #ECE6F0 [token:md.sys.color.surface-container-high] | #2B2930 [token:md.sys.color.surface-container-high] |
| Surface container highest | #E6E0E9 [token:md.sys.color.surface-container-highest] | #36343B [token:md.sys.color.surface-container-highest] |
| Surface dim | #DED8E1 [token:md.sys.color.surface-dim] | #141218 [token:md.sys.color.surface-dim] |
| Surface bright | #FEF7FF [token:md.sys.color.surface-bright] | #3B383E [token:md.sys.color.surface-bright] |
| Outline | #79747E [token:md.sys.color.outline] | #938F99 [token:md.sys.color.outline] |
| Outline variant | #CAC4D0 [token:md.sys.color.outline-variant] | #49454F [token:md.sys.color.outline-variant] |
| Inverse surface | #322F35 [token:md.sys.color.inverse-surface] | #E6E0E9 [token:md.sys.color.inverse-surface] |
| Inverse on surface | #F5EFF7 [token:md.sys.color.inverse-on-surface] | #322F35 [token:md.sys.color.inverse-on-surface] |
| Inverse primary | #D0BCFF [token:md.sys.color.inverse-primary] | #6750A4 [token:md.sys.color.inverse-primary] |
| Scrim | #000000 [token:md.sys.color.scrim] | #000000 [token:md.sys.color.scrim] |

Fixed roles keep one value in both themes:

| Group | Fixed | Fixed dim | On fixed | On fixed variant |
|---|---|---|---|---|
| Primary | #EADDFF [token:md.sys.color.primary-fixed] | #D0BCFF [token:md.sys.color.primary-fixed-dim] | #21005D [token:md.sys.color.on-primary-fixed] | #4F378B [token:md.sys.color.on-primary-fixed-variant] |
| Secondary | #E8DEF8 [token:md.sys.color.secondary-fixed] | #CCC2DC [token:md.sys.color.secondary-fixed-dim] | #1D192B [token:md.sys.color.on-secondary-fixed] | #4A4458 [token:md.sys.color.on-secondary-fixed-variant] |
| Tertiary | #FFD8E4 [token:md.sys.color.tertiary-fixed] | #EFB8C8 [token:md.sys.color.tertiary-fixed-dim] | #31111D [token:md.sys.color.on-tertiary-fixed] | #633B48 [token:md.sys.color.on-tertiary-fixed-variant] |

Platform differences (see `knowledge/conflicts.md`). In light theme, Compose's default
`lightColorScheme()` still uses tone 10 for the on-container roles, while material-web and Flutter
use tone 30 (the Aug 2024 change). Compose's `expressiveLightColorScheme()` applies tone 30.

- On primary container [differs:md.sys.color.on-primary-container]: Compose
  #21005D [token:md.sys.color.on-primary-container]; material-web and Flutter
  #4F378B [token:md.sys.color.on-primary-container].
- On secondary container [differs:md.sys.color.on-secondary-container]: Compose
  #1D192B [token:md.sys.color.on-secondary-container]; material-web and Flutter
  #4A4458 [token:md.sys.color.on-secondary-container].
- On tertiary container [differs:md.sys.color.on-tertiary-container]: Compose
  #31111D [token:md.sys.color.on-tertiary-container]; material-web and Flutter
  #633B48 [token:md.sys.color.on-tertiary-container].
- On error container [differs:md.sys.color.on-error-container]: Compose
  #410E0B [token:md.sys.color.on-error-container]; material-web and Flutter
  #8C1D18 [token:md.sys.color.on-error-container].

Contrast levels, primary group of the baseline scheme. material-web and Flutter carry these tokens;
Compose has no medium or high contrast tokens [NOT FOUND].

| Role | Light standard | Light medium | Light high | Dark standard | Dark medium | Dark high |
|---|---|---|---|---|---|---|
| Primary | #6750A4 [token:md.sys.color.primary] | #4F378B [token:md.sys.color.primary] | #381E72 [token:md.sys.color.primary] | #D0BCFF [token:md.sys.color.primary] | #EADDFF [token:md.sys.color.primary] | #F6EDFF [token:md.sys.color.primary] |
| On primary | #FFFFFF [token:md.sys.color.on-primary] | #FFFFFF [token:md.sys.color.on-primary] | #FFFFFF [token:md.sys.color.on-primary] | #381E72 [token:md.sys.color.on-primary] | #21005D [token:md.sys.color.on-primary] | #000000 [token:md.sys.color.on-primary] |
| Primary container | #EADDFF [token:md.sys.color.primary-container] | #6750A4 [token:md.sys.color.primary-container] | #4F378B [token:md.sys.color.primary-container] | #4F378B [token:md.sys.color.primary-container] | #9A82DB [token:md.sys.color.primary-container] | #D0BCFF [token:md.sys.color.primary-container] |
| On primary container | #4F378B [token:md.sys.color.on-primary-container] | #FFFFFF [token:md.sys.color.on-primary-container] | #FFFFFF [token:md.sys.color.on-primary-container] | #EADDFF [token:md.sys.color.on-primary-container] | #000000 [token:md.sys.color.on-primary-container] | #000000 [token:md.sys.color.on-primary-container] |

Numbers without units:

- Tones run from 0 (black) to 100 (white). Palettes always include steps of 10 plus 95, 98 and 99;
  some include more. Baseline light theme puts primary at tone 40 and on primary at tone 100.
- Hue runs 0 to 360 (a circle); chroma starts at 0 (grey) and tops out near 120 in practice; tone
  equals L* lightness from CIELAB, while hue and chroma come from CAM16.
- Contrast targets: role pairs at least 3:1; medium contrast at least 3:1; high contrast 7:1; text
  at least 4.5:1 (small) or 3:1 (large).
- Tone distance as a contrast shortcut (2022 color science post):
  - Elements under 40dp need a tone gap of 50 from their background [site:/blog/science-of-color-design].
  - Larger elements need a tone gap of 40.
- Flutter contrast levels: standard 0.0, medium 0.5, high 1.0
  [impl:material_ui/packages/material_ui/lib/src/theme_data.dart:236]; any value from -1.0 to 1.0
  is allowed with a seed.
- Harmonization rotates hue by at most 15 degrees
  [impl:material-color-utilities/package/blend/blend.js:46].
- MCU's `customColor` helper returns tones 40, 100, 90, 10 (color, on color, container, on
  container) in light [impl:material-color-utilities/package/utils/theme_utils.js:81] and 80, 20,
  30, 90 in dark [impl:material-color-utilities/package/utils/theme_utils.js:87].

## Accessibility

- Roles are built in contrast pairs. Using a role with its own "on" partner keeps contrast at every
  contrast level; mixing unrelated roles (primary with primary container, say) can become
  unreadable when contrast changes.
- Offer user-controlled contrast through dynamic color or the medium and high contrast tokens;
  static baseline apps do not get it for free.
- Outline must give 3:1 against the surface when it marks a target boundary. Outline variant is
  only for decoration or for borders around content that already reaches 4.5:1.
- Fixed roles do not change between themes, so they can fail contrast in one of them. Avoid them
  where contrast matters.
- Inspect colors in HCT, not HSL. Two colors with equal HSL lightness can differ widely in
  perceived lightness, which is what contrast depends on.
- Use semantic colors (error, success) consistently and do not let content-based color override
  them.

## Platform mapping

- Jetpack Compose (material3 1.5.0-rc01):
  - `ColorScheme`, `lightColorScheme()`, `darkColorScheme()`, `expressiveLightColorScheme()`
    (light only; pair it with `darkColorScheme()` in dark theme).
  - `dynamicLightColorScheme(context)` and `dynamicDarkColorScheme(context)`, Android 12 (API 31)
    and later; from API 34 they read every role from the system theme, below that they rebuild
    roles from the system tonal palettes.
  - `MaterialTheme(colorScheme = ...)` and `MaterialExpressiveTheme(colorScheme = ...)`.
  - `ColorScheme.surfaceColorAtElevation` still exists for the old elevation tint.
  - No seed-to-scheme generator, no variant choice and no contrast-level parameter.
- Flutter (`material_ui` 1.11.0):
  - `ColorScheme.fromSeed(seedColor:, brightness:, dynamicSchemeVariant:, contrastLevel:)` and
    `ColorScheme.fromImageProvider(provider: ...)`, both defaulting to `DynamicSchemeVariant.tonalSpot`.
  - `DynamicSchemeVariant` has nine values: tonalSpot, fidelity, monochrome, neutral, vibrant,
    expressive, content, rainbow, fruitSalad.
  - `ThemeData(colorSchemeSeed: ..., contrastLevel: ...)`. Without a seed, `ContrastLevel.standard`,
    `.medium` or `.high` selects a built-in baseline scheme.
  - `StyleVariant.material3Expressive` affects component styling only (buttons and icon buttons in
    this version), not color generation.
  - No harmonize API in `material_ui`.
- Web: no maintained official component. Our CSS takes the material-web token values above; schemes
  for other seeds come from MCU (TypeScript, 0.4.0) in Phase 3.
- Material Theme Builder (Figma plugin and web): previews dynamic color, builds custom and brand
  schemes, toggles fidelity and harmonization, and exports for Jetpack Compose, Android Views,
  Flutter, web, or as JSON.
- Android Views (MDC-Android): not covered here.

## Pitfalls

- Hard-coding hex values or palette tones instead of roles.
- Pairing roles that were not designed together, then losing contrast at medium or high contrast.
- Using outline for dividers or card borders (use outline variant), or outline variant for the
  boundary of a target.
- Using fixed roles where contrast is needed.
- Applying content-based color far from its source image, mixing more than two source types on one
  screen, or letting it recolor errors and success states.
- Harmonizing brand colors, which should stay exact.
- Defining an extra red when the error roles already exist.
- Assuming that the "expressive" scheme variant is the default of the M3 Expressive style. No
  source says so.
- On Compose, expecting the more colorful on-container text from plain `lightColorScheme()`; only
  `expressiveLightColorScheme()` applies it.
- Expecting `surfaceColorAtElevation` tints in new designs; tone-based surface containers replaced
  them.
