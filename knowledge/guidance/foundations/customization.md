---
title: Customizing Material
kind: foundation
pages: [/foundations/customization, /styles/color/roles]
tokenSets: [sys.color, ref.palette]
expressive: false
fetched: 2026-11-13
---

## Summary

M3 customization is mostly color customization done through the color system, so that a brand's
colors and a person's own color choice (dynamic color) can both feed one app. You build a custom
color scheme from one or more source colors; the system derives tonal palettes, fills every color
role, and keeps contrast, state colors and component structure working. The same roles then accept
a user-generated scheme when dynamic color is on.

## Rules

### Brand color and dynamic color together

- Define a custom theme built on M3 color roles. It does three jobs:
  - it expresses the brand;
  - it gives user-generated (wallpaper-based) schemes a set of roles to map into;
  - it is the fallback scheme for people who have dynamic color off, or devices without it.
- Dynamic color is both a person's setting and a product decision. You may apply it to the whole
  app or only to chosen areas; a profile or account screen is a natural place to reflect the
  person's own palette while the rest keeps brand colors.
- Dynamic color works for custom (non-Material) components too, as long as they read color roles
  instead of fixed values.

### Building a custom scheme

- Start from either an existing brand system (map its colors onto M3 roles) or from scratch.
- Input one source color, typically the primary brand color. The system derives complementary
  palettes for the rest of the scheme. Adding a second and third color is optional; each one
  steers the result.
- A brand can supply a single color or a complete palette with its own tonal range; both feed the
  same role logic.
- Five key color groups carry the roles: primary, secondary, tertiary, neutral and neutral
  variant. Each key color produces a tonal palette, and tones from it fill roles such as
  `primary`, `on-primary` and `primary-container`.
- Map your app's own colors onto the source colors of the custom scheme. That lines them up
  with the roles and the logic dynamic color applies.
- Color roles are used the same way with the static baseline scheme and with dynamic color, and
  custom components must be mapped to them as well. Apply roles only in their intended pairs and
  layering orders; other combinations can lose contrast once dynamic color or a user's contrast
  setting moves the tones.

### Tools

- Material Theme Builder (Figma plugin):
  - visualizes a scheme from your source colors and migrates designs to M3 color;
  - writes color and type tokens as Figma styles that can connect to existing mock-ups and brand
    guides;
  - exports theme code in several formats, including a Design System Package (DSP), a
    cross-platform format for design-system data.
- The dynamic color codelab walks through how brand colors behave under dynamic color.
- See `design-tokens.md` for how the exported tokens are structured.

## Measurements

Not covered by the sources. The page sets no sizes; the baseline tone values for each role are in
`knowledge/tokens/merged.json` under `md.sys.color.*` (one entry per mode) and `md.ref.palette.*`.
For example, the light baseline primary resolves to `md.ref.palette.primary40`:
#6750A4 [token:md.ref.palette.primary40].

## Accessibility

- The color system handles accessible contrast for you: its role pairs, such as `primary` /
  `on-primary`, are designed to keep at least 3:1 contrast. Keep that guarantee by pairing a
  role only with its intended partner, for example its `on-` role.
- **Our practice:** pick brand inputs freely and let the system choose the tones. Forcing an
  exact brand hex onto a container role can break the contrast the scheme was built to keep.
- **Our practice:** give a custom theme medium and high contrast versions as well (the variants
  are listed in `design-tokens.md#rules`), so people who need more contrast are not left with
  the standard scheme.

## Platform mapping

- Jetpack Compose (material3 1.5.0-rc01):
  - `MaterialTheme(colorScheme, motionScheme, shapes, typography)` applies a theme; `lightColorScheme()` and
    `darkColorScheme()` build a custom scheme from role colors.
  - Dynamic color: `dynamicLightColorScheme(context)` and `dynamicDarkColorScheme(context)` (in
    the Android source set, annotated `@RequiresApi(Build.VERSION_CODES.S)`). Use them when
    available and fall back to the custom scheme otherwise.
  - Expressive: `MaterialExpressiveTheme` and `expressiveLightColorScheme()`.
- Flutter (`material_ui` 1.11.0):
  - `ThemeData(colorSchemeSeed: …)` or `ColorScheme.fromSeed(seedColor: …)` builds a scheme from
    one source color. `dynamicSchemeVariant` defaults to `DynamicSchemeVariant.tonalSpot`;
    `contrastLevel` selects standard, medium or high contrast (`ContrastLevel`).
  - `ColorScheme.fromImageProvider` derives a scheme from an image (content-based color).
  - The pinned `material_ui` sources have no API that reads the device wallpaper scheme.
  - `StyleVariant.material3Expressive` switches the component style.
- Web: no maintained official component. Our Phase 3 CSS takes the role values from material-web
  tokens; a custom scheme is applied by re-pointing the `md.sys.color.*` values.
- The scheme variants available in material-color-utilities (tonal spot, neutral, vibrant,
  expressive, fidelity, content, monochrome, rainbow, fruit salad) are listed in
  `knowledge/tokens/color-system.json`.

## Pitfalls

- Hard-coding brand hex values in components. They will not follow dark mode, contrast levels or
  dynamic color.
- Shipping dynamic color without a custom fallback scheme.
- **Our practice:** do not treat dynamic color as "whatever Theme Builder outputs". It means a
  role that can change in response to the person's settings at run time.
- Turning dynamic color on everywhere when the brand relies on recognizable color in key places;
  apply it selectively instead.
- **Our practice:** avoid adding many input colors to chase a brand guide. One source color
  usually gives a more coherent scheme; keep extra inputs for real brand needs.
