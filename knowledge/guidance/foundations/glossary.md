---
title: Glossary
kind: foundation
pages: [/foundations/glossary, /styles/color/system/how-the-system-works, /foundations/design-tokens/overview, /styles/color/advanced/apply-colors]
tokenSets: []
expressive: false
fetched: 2026-11-13
---

## Summary

The terms other notes rely on, defined in our words. Component names are not repeated here; each
component has its own note. Where our token data uses a word differently from the site, the
difference is stated.

## Rules

### Material generations

- **M1, M2, M3**: Material's first generation (2014), the second (2018, which added Material
  Theming and the Material Components code libraries), and the third (2021).
- **Material You**: the personal, expressive feature set introduced with M3, dynamic color above
  all.
- **Material Theming**: customizing Material systematically (color, type, shape) so a product
  carries its own brand.

### Color

- **Source color**: the one color a scheme grows from (taken from a wallpaper, an image or a brand
  input). It is defined by hue, chroma and tone.
- **Key color**: one of the five colors (primary, secondary, tertiary, neutral, neutral variant)
  derived from the source color by shifting hue and chroma. Each key color seeds a tonal palette.
  It is a concept for explaining dynamic color; code rarely names it.
- **Tone**: lightness, from 0 (black) to 100 (white). Colors with the same hue and chroma but a
  different tone belong to one palette.
- **Tonal palette**: a range of tones of one key color. The site describes 13 tones; our reference
  tokens hold 13 or 14 steps for most palettes and 24 for neutral, which supplies the extra
  surface tones (`md.ref.palette.*`).
- **HCT**: hue, chroma, tone, the color space behind dynamic color. Hue and chroma come from CAM16;
  tone is CIELAB L*.
- **Color role**: a named purpose for a color (`primary`, `on-primary`, `surface-container` …).
  Components use roles, never palette steps. Also called a slot.
- **Scheme**: one assignment of tones to all roles. A dark scheme is the dark assignment; it is
  not the same thing as a dark theme.
- **Baseline scheme**: Material's default light and dark tone assignments (the purple baseline).
- **Dynamic color**: an app accepts a user-generated scheme into its roles, so its colors change
  with the person's settings. It is the changeable role, not merely a generated palette.
- **User-generated scheme**: a scheme derived from the person's wallpaper or a preset on the
  device.
- **Extended color**: an extra color beyond the key colors, for brand use or conventional meaning
  (for example a "success" green).
- **Contrast (tone difference)**: two tones 40 apart give at least 3:1 WCAG contrast; 50 apart
  give at least 4.5:1. M3 role pairs are built on this.

### Theming and style

- **Style**: a customizable set of properties for one aspect of appearance (color, type, shape).
- **Theme**: several styles applied together across an app. A dark theme changes more than color
  (elevation and state treatments too), which is why it differs from a dark scheme.
- **Customization**: any change that reflects a brand, an OEM or a person, either on one element
  or globally as a theme.
- **Mode (site sense)**: a binary system setting such as focus mode, airplane mode or battery saver.
  In our token data, `mode` means something else: the context an entry belongs to (see below).

### Tokens

- **Design token**: a named, reusable design decision that replaces a literal value. See
  `design-tokens.md`.
- **Reference / system / component token**: the three tiers (`ref`, `sys`, `comp`): raw options,
  themed roles and decisions, and per-component properties.
- **Context**: a condition under which a token resolves to a different value (dark theme, density,
  right-to-left). Our data records it as the `mode` field (`light`, `dark`, the contrast levels,
  `standard` / `expressive` springs).
- **Role (token sense)**: the short human name of a system token, such as "secondary container".
- **Element**: the part of a component a token applies to (container, label text, icon).
- **Design attribute**: the aspect a value controls (color, font, size).
- **Value**: what a token stores, or a hard-coded literal.
- **DSP (Design System Package)**: an open folder format, created by Adobe, for passing design
  system data between tools. Material Theme Builder can export it.

### Layout and adaptation

- **Adaptive design**: the interface changes layout or components in response to known conditions
  of the person, device or environment.
- **Condition**: the signal that triggers an adaptation (for example a window size class).
- **Pane**: a layout building block that groups content and actions and adapts to the space.
- **XR, spatial, orbiter**: extended reality; placement of UI in space; floating controls attached
  to a spatial panel.

### Documentation

- **Guidelines**: long-form, example-led guidance on usage and behavior.
- **Specs**: annotated designs giving the exact values and parameters a component implements.

## Measurements

Not covered by the sources. The glossary defines terms, not sizes.

## Accessibility

- The tone-difference rule above is the basis for M3's contrast guarantees: the color algorithm
  assigns a role and its "on" role tones far enough apart to reach 3:1 or 4.5:1.
- Medium- and high-contrast schemes push those tones further apart. Tokens carry them as contexts,
  so a system token resolves to a higher-contrast value when that context is active.

## Platform mapping

- The glossary is platform-neutral. Note one naming trap: the site says the M3 libraries are
  Android Views and Jetpack Compose, with Flutter and web support in progress. That statement is
  dated. This project targets Compose material3 1.5.0-rc01 and Flutter `material_ui` 1.11.0; there
  is no maintained official web component library, and our CSS is built in Phase 3.

## Pitfalls

- Confusing scheme and theme, or "light scheme" and "light theme".
- Calling any generated palette "dynamic color". Without roles that change at run time it is just
  a custom scheme.
- Reading `mode` in `knowledge/tokens/` as the site's system modes (airplane mode and so on).
- Using palette steps (`primary40`) in components instead of roles.
