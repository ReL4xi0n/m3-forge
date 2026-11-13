---
title: Elevation
kind: style
pages: [/styles/elevation/overview, /styles/elevation/applying-elevation, /styles/elevation/tokens]
tokenSets: [sys.elevation, scrim]
expressive: false
fetched: 2026-11-13
---

## Summary

Elevation is how far one surface sits above another along the z-axis, measured in dp. M3 keeps
it to six named levels (0 to 5) and shows it mainly through color: surfaces that need to read as
separate get different surface or surface-container roles. Shadows and scrims are extra tools, used
only when tone alone does not separate things well enough. An elevation token is just a distance;
it carries no shadow and no color, and each platform decides how to draw a given level.

## Rules

- Use few levels. A small number of distinct heights keeps the remaining ones meaningful.
- Resting positions use levels 0 to 3. Levels 4 and 5 are for interaction (hover, drag), never for
  a component at rest.
- Keep each component at its default resting level. Changing a Material component's default
  elevation is discouraged.
- Change elevation in response to the user or the system, and do it consistently for all similar
  elements. Hover normally raises a component by one level; for example a FAB goes from level 3
  to level 4. Every Material button lifts one level on hover.
- A raised element can also drop back down when something higher appears, and elements may lift
  briefly on focus, selection or a swipe.
- To read as separate, a surface needs visible edges, overlap with another surface (at rest or in
  motion), and some distance from it.
- Default separation is tonal: give overlapping containers different surface / surface container
  roles. Those roles are not tied to particular levels; choose them for containment.
- Add a visible shadow only when it earns its place:
  - to protect elements (cards, chips, buttons) on a patterned or busy background where a
    hairline is not enough;
  - to invite interaction, as a temporary lift.
- Shadow size and softness signal distance: small, crisp shadows mean close; large, diffuse ones
  mean far.
- Use a scrim behind modal surfaces (dialogs, modal sheets, expanded navigation) to pull focus.
- Surface tint is deprecated. Use the level tokens and the surface container roles instead of
  tinting a surface by its height.
- What changed from M2: M2 put shadows on every level; M3 uses color first, describes elevation
  in levels, and remaps colors to work with dynamic color.

## Measurements

The values are material-web's (canonical). No cited level token differs between platforms.

| Level | Height | Typical resting components (site table, abridged) |
|---|---|---|
| 0 | 0dp [token:md.sys.elevation.level0] | Filled, tonal and outlined buttons; icon buttons; button groups; split button; segmented button; filled and outlined cards; carousel; lists; tabs; slider; navigation rail (and a FAB placed in it); docked side sheet; full-screen dialog; app bar before scrolling |
| 1 | 1dp [token:md.sys.elevation.level1] | Elevated button, card and chip; banner; modal bottom sheet, modal side sheet and modal navigation drawer |
| 2 | 3dp [token:md.sys.elevation.level2] | Scrolled app bar; menu; navigation bar; rich tooltip; toolbar |
| 3 | 6dp [token:md.sys.elevation.level3] | FAB and extended FAB; FAB menu close button; modal dialogs; date and time pickers; search |
| 4 | 8dp [token:md.sys.elevation.level4] | No resting use; hover and drag only |
| 5 | 12dp [token:md.sys.elevation.level5] | No resting use |

- Example of a hover lift (primary-container FAB):
  - at rest: 6dp [token:md.comp.fab.primary-container.container.elevation];
  - hovered: 8dp [token:md.comp.fab.primary-container.hovered.container.elevation].
- App bar, before and after content scrolls under it:
  - flat: 0dp [token:md.comp.app-bar.container.elevation];
  - scrolled: 3dp [token:md.comp.app-bar.on-scroll.container.elevation].
- Distance between surfaces is the difference of their heights.
  A surface at 1dp and one at 8dp are 7dp apart [site:/styles/elevation/overview].
- Scrim: the scrim color role at 32% opacity [site:/styles/elevation/applying-elevation] [token:md.comp.scrim.container.opacity].
  Flutter's token data has no scrim opacity token [NOT FOUND].
- material-web also carries an older navigation-drawer scrim opacity of 40% [token:md.comp.navigation-drawer.scrim.opacity].
  The general scrim guidance is the value in the previous item.
- Shadow geometry (blur, offset, opacity per level): no token [NOT FOUND]. Each platform draws its
  own shadow for a level.

## Accessibility

- Edges between interactive surfaces must have enough contrast to be seen as separate, meeting
  accessible contrast ratios. A floating element must stand out from the surface below it.
- Do not rely on low-contrast tone differences alone to show that something floats.
- Scrims raise contrast behind modal content, which helps people find what needs attention.

## Platform mapping

- Jetpack Compose (material3 1.5.0-rc01):
  - `Surface` takes `tonalElevation` and `shadowElevation` separately. Tonal elevation only
    recolors the surface (through `ColorScheme.surfaceColorAtElevation`) when its color is the
    `surface` role and `LocalTonalElevationEnabled` is true; shadow elevation draws the shadow.
  - `Scrim` and `ScrimDefaults.color` draw the modal scrim from the scrim tokens.
- Flutter (`material_ui` 1.11.0): `Material` has `elevation`, `shadowColor` and
  `surfaceTintColor`; `ElevationOverlay.applySurfaceTint` applies the tint. Since the site
  deprecates surface tint, prefer surface container colors over tint.
- Web: no maintained official component. Our CSS uses the material-web level values above; the
  shadow drawing per level is our own choice in Phase 3.

## Pitfalls

- Shadows on everything. M3 separates with tone first; shadows are for busy backgrounds and
  interaction.
- Using level 4 or 5 as a resting position.
- Raising one component on hover but not its siblings.
- Treating elevation tokens as shadow specs. They hold distance only.
- Relying on surface tint to show height; it is deprecated in favor of surface container roles.
- Placing two overlapping containers on the same color role, so their boundary disappears.
