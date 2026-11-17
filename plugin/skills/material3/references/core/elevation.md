# Elevation

Elevation is a level, not a shadow. M3 separates surfaces by color role first; a shadow is the
exception.

## Levels

| Level | Web | Flutter | Compose | Resting use |
|---|---|---|---|---|
| 0 | `--md-sys-elevation-level0` | `M3Elevation.level0` | `M3Elevation.level0` | most buttons, filled and outlined cards, lists, tabs, rail, app bar before scroll |
| 1 | `--md-sys-elevation-level1` | `M3Elevation.level1` | `M3Elevation.level1` | elevated button, card and chip; modal sheets and modal drawer |
| 2 | `--md-sys-elevation-level2` | `M3Elevation.level2` | `M3Elevation.level2` | scrolled app bar, menu, navigation bar, rich tooltip, toolbar |
| 3 | `--md-sys-elevation-level3` | `M3Elevation.level3` | `M3Elevation.level3` | FAB, extended FAB, modal dialog, pickers, search |
| 4 | `--md-sys-elevation-level4` | `M3Elevation.level4` | `M3Elevation.level4` | never at rest; hover and drag only |
| 5 | `--md-sys-elevation-level5` | `M3Elevation.level5` | `M3Elevation.level5` | never at rest |

Sources: `assets/web/tokens.css`, `assets/flutter/lib/m3/tokens.dart`, `assets/compose/theme/Tokens.kt`.

## Rules

- Keep each Material component at its default level. Do not raise one to make it "pop".
- Separate overlapping surfaces with different surface roles (`surface` vs
  `surfaceContainerLow` ... `surfaceContainerHighest`), not with shadows. The container roles are
  chosen for nesting, not tied to a level.
- A shadow is allowed only on a component whose spec has one (elevated button, elevated card, FAB,
  menu, dialog) or when an element must stand off a busy image or pattern.
- Hover may raise an interactive element one level (a FAB from level 3 to level 4); do it for every
  sibling alike.
- Modal surfaces (dialog, modal sheet, modal rail) sit over a scrim: the `scrim` role at the scrim
  opacity, 32% [site:/styles/elevation/applying-elevation] [token:md.comp.scrim.container.opacity].
- Use few distinct levels on one screen.

## Per platform

- Compose: separate with `Surface(color = MaterialTheme.colorScheme.surfaceContainerLow)` and its
  siblings; add `shadowElevation = M3Elevation.levelN` only where the rules above allow a shadow.
  Material components set their own elevation. No `Modifier.shadow()`.
- Flutter: give containers a container role as `color:`; Material widgets that need a level take
  `elevation:` (pass an `M3Elevation` level) and draw their own shadow. No hand-made `BoxShadow`.
- Web: color separation via `background: var(--md-sys-color-surface-container-*)`. Do not write
  `box-shadow`; a component that needs one gets it from the shipped component CSS for that
  component (see `references/web/components.md`).

## Do not

- Shadows on every card, or a shadow as the only cue that something floats.
- `box-shadow`, `BoxShadow(...)`, `Modifier.shadow(...)` or drop-shadow filters written by hand.
- Level 4 or 5 as a resting position.
- Surface tint or `surfaceColorAtElevation` to show height; use container roles.
- Two overlapping containers on the same role, so their edge disappears.
