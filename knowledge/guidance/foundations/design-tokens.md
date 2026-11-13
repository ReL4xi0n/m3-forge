---
title: Design tokens
kind: foundation
pages: [/foundations/design-tokens/overview, /foundations/design-tokens/how-to-use-tokens]
tokenSets: [ref.palette, ref.typeface, sys.color, sys.typescale, sys.shape, sys.state, sys.motion]
expressive: false
fetched: 2026-11-13
---

## Summary

A design token is a named design decision: a dotted name stands in for a raw value (a color, a
font, a size, or another token). Designs, tools and code all refer to the name, so when the value
behind it changes, every place that uses the name follows. M3 sorts its tokens into three classes,
reference (`ref`), system (`sys`) and component (`comp`), and a component value is normally a short
chain through all three.

This note explains the tiers as `knowledge/tokens/` stores them, because every other note cites ids
from that data with a `token:` marker.

## Rules

### Reading a token name

- Names read from general to specific, separated by dots: system prefix (`md` for Material
  Design), then the class (`ref`, `sys`, `comp`), then words that say what the token is for.
- The name describes purpose or place, never the value. `md.sys.color.secondary-container` stays
  the same name whether it resolves to a light or a dark tone.
- Example chain (light scheme, baseline):
  - `md.comp.button.tonal.container.color` (component) points to
  - `md.sys.color.secondary-container` (system, the role), which points to
  - `md.ref.palette.secondary90` (reference) = #E8DEF8 [token:md.ref.palette.secondary90].
  - The tonal button's container in the token data: [token:md.comp.button.tonal.container.color].

### The three tiers

| Tier | Prefix in our ids | What it holds | Examples in `knowledge/tokens/merged.json` |
|---|---|---|---|
| Reference | `md.ref.` | The full menu of raw options. Values are literals (hex, font family). They never change with context. | `md.ref.palette.*` tonal palette steps, `md.ref.typeface.brand`, `md.ref.typeface.plain` |
| System | `md.sys.` | The decisions that give a theme its character: color roles, type scale, shape scale, elevation levels, state-layer opacities, motion. This is where theming and context switching happen. | `md.sys.color.*`, `md.sys.typescale.*`, `md.sys.shape.*`, `md.sys.elevation.*`, `md.sys.state.*`, `md.sys.motion.*`, `md.sys.measurement.*` |
| Component | `md.comp.` | The properties of one component's parts (container, label text, icon, outline) per state: color, size, shape, elevation, type. | `md.comp.button.small.container.height`, `md.comp.fab.primary-container.container.color` |

- Point downwards whenever possible: a system token should reference a reference token, and a
  component token should reference a system (or reference) token, not hold a hard-coded hex.
- A theme change (dark scheme, high contrast, a brand palette) is done by re-pointing system
  tokens. Component tokens keep pointing to the same roles and need no edits.
- Change one component by overriding its component token; change the whole product by
  changing a system token.
- Not every styling choice in a component can be a token. When the same choice recurs across
  components with a similar intent, tokenize it.

### Contexts and modes

- The site calls the conditions under which a token resolves differently "contexts" (dark theme,
  form factor, density, right-to-left). A value tagged with a context overrides the default
  inside that context.
- Our data stores a context as the `mode` field of an entry. Only two families carry modes:
  - System colors: `light`, `dark`, `light-medium-contrast`, `light-high-contrast`,
    `dark-medium-contrast`, `dark-high-contrast`.
    - For example, `md.sys.color.background` resolves to `md.ref.palette.neutral98` in the light
      mode, #FEF7FF [token:md.ref.palette.neutral98].
    - In the dark mode it resolves to `md.ref.palette.neutral6`, #141218 [token:md.ref.palette.neutral6].
  - Motion springs: `standard` and `expressive` (the two motion schemes).
- Every other entry has no mode; density and right-to-left are not modelled as modes in our
  data.

### How our token data is shaped

Each line of `knowledge/tokens/merged.json` is one entry per id (and mode):

- `canonical`: material-web's value, used in the notes' tables.
- `perPlatform.web`, `perPlatform.flutter`, `perPlatform.compose`: each platform's own value,
  taken from its own repository. A platform that lacks the id shows `NOT FOUND`.
- `crossCheck.android-views`: the MDC-Android value, used only as a check.
- `provenance`: file and line for every value.
- `derived: true`: the id was built by us from a Compose name that matched no official id; such
  ids are listed in `knowledge/not-found.md` as unmapped.
- `deprecated: true`: material-web marks the id as deprecated. Older per-variant sets (for
  example `md.comp.filled-button.*`) are kept for reference; newer notes cite the current sets
  (for example `md.comp.button.filled.*`).
- A value is a literal (`hex`, `dp`, `sp`, `number`, `string`, `shape`), a reference (`ref` to
  another id), something the extractor could not parse (`unparsed`, such as `1rem` or a Compose
  expression), or `NOT FOUND`.
- References are followed inside one platform before values are compared. Flutter's data often
  stores the resolved literal where material-web stores a reference; that is not a difference.
- When platforms really do resolve an id differently, `knowledge/conflicts.md` lists it and notes
  must mark it with `[differs:<id>]`. Example: the light `md.sys.color.on-secondary-container`
  [differs:md.sys.color.on-secondary-container]:
  - material-web points it to `md.ref.palette.secondary30`, #4A4458 [token:md.ref.palette.secondary30];
    Flutter stores that hex directly.
  - Compose points it to `md.ref.palette.secondary10`, #1D192B [token:md.ref.palette.secondary10].
  - Text on a tonal container is therefore darker in Compose apps.

### Reading token tables on the site

- Component spec pages show tokens grouped first by state (enabled, hovered, pressed, disabled …)
  and then by element (container, label text, icon).
- Each row gives the property, the token id, an optional description, and the value per context.
  Copy the id into code or compare it with the role used in the design file.
- Token modules on the site show the role, its system token, its reference token and the stored
  value side by side.

### When tokens pay off

- Worth it: a new product or a redesign, a system shared across several products or platforms,
  styles you expect to change, or features that need roles, such as dynamic color.
- Little gain: an existing app full of hard-coded values that will not change for a year or two,
  or a product without a design system.

## Measurements

The tiers carry the measurements; this note quotes a few only as examples.

- Body large size: 16sp in Compose [token:md.sys.typescale.body-large.size]. material-web stores
  it as `1rem`, which our extractor keeps as an unparsed string, so the web size follows the
  browser's root font size.
- Medium corner: 12dp [token:md.sys.shape.corner.medium].
- Hover state layer: 8% [token:md.sys.state.hover.state-layer-opacity].
- Token counts per class and per source are in `knowledge/tokens/summary.json`.

## Accessibility

- Tokens are how a high-contrast scheme is delivered: the medium- and high-contrast modes re-point
  the system color roles, and every component that uses roles picks up the new contrast without
  edits.
- The same lever adapts type for distant or large screens: change the system type scale, not each
  component.
- Hard-coded colors bypass both. A component painted with a literal hex keeps its contrast in
  light mode only, and ignores dynamic color.

## Platform mapping

- Web: material-web keeps tokens as Sass files, one per set (`_md-ref-palette.scss`,
  `_md-sys-color.scss`, `_md-comp-button-filled.scss` …). There is no maintained official web
  component; our CSS is built in Phase 3 from these values.
- Jetpack Compose (material3 1.5.0-rc01): tokens are internal Kotlin objects under
  `androidx/compose/material3/tokens/` (`PaletteTokens`, `ColorLightTokens`, `ColorDarkTokens`,
  per-component `*Tokens`). Apps reach the system tier through `MaterialTheme.colorScheme`,
  `MaterialTheme.typography`, `MaterialTheme.shapes` and `MaterialTheme.motionScheme`; component
  tiers are exposed through each component's `*Defaults` object.
- Flutter (`material_ui` 1.11.0): token data lives in `tool/gen_defaults/data/` (`palette.dart`,
  `color_light.dart`, `button_filled.dart` …) and generates each widget's defaults. Apps reach the
  system tier through `ThemeData` (`colorScheme`, `textTheme`) and component tiers through each
  widget's theme data.
- Design: the Material Theme Builder Figma plugin generates color and type tokens as Figma styles
  and exports them (including for Android Views and Jetpack Compose). Use the styles in mock-ups
  instead of picking colors by eye, so the handoff carries token names. See
  `customization.md` for the builder.

## Pitfalls

- Copying a hex value from a spec instead of the token or role: it breaks dark mode, contrast
  modes and dynamic color.
- Pointing a component token straight at a reference token (`md.ref.palette.primary40`) when a
  role exists: the component then ignores theming.
- Reading the token's value as part of its meaning. `secondary-container` is a role; its tone
  changes with mode and scheme.
- Treating Flutter's inlined hex values as a platform difference. Resolve references first.
- Citing a `deprecated` or `derived` id as if it were current; prefer the current, official set.
- Assuming every platform defines every id. Check `knowledge/not-found.md` before relying on one.
