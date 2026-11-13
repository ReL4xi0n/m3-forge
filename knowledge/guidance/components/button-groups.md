---
title: Button groups
kind: component
pages: [/components/button-groups/overview, /components/button-groups/specs, /components/button-groups/guidelines, /components/button-groups/accessibility]
tokenSets: [button-group.standard.xsmall, button-group.standard.small, button-group.standard.medium, button-group.standard.large, button-group.standard.xlarge, button-group.connected.xsmall, button-group.connected.small, button-group.connected.medium, button-group.connected.large, button-group.connected.xlarge]
expressive: true
fetched: 2026-11-13
---

## Summary

A button group is an invisible container that lines up buttons and icon buttons, sets the space
between them, and changes their shape and width as people interact. It is new in M3 Expressive
(May 2025) and has two variants. A standard group makes neighbouring buttons react to each other;
a connected group packs buttons tightly for selection and replaces the segmented button.

## Use it when

- Standard group: several related actions should sit together and feel lively. Mix button
  variants, widths and colors to show which action matters most.
- Connected group: people pick one or more options, switch views, or sort content, and every
  button in it is a toggle. Use it in place of the baseline segmented button.
- Both variants support single-select, multi-select and selection-required patterns.
- Avoid when:
  - None of the buttons in a connected group can be toggled; use a standard group or plain
    buttons.
  - Buttons would need to wrap onto a second line. Groups stay on one line; stack separate groups
    instead (stacked groups do not interact with each other).

## Anatomy

1. Container. It has no color, shape or focus stop of its own. It holds the buttons, adds the
   space between them and drives their shape and width changes. A group is empty by default.
2. Buttons and icon buttons inside it, using their own anatomy (see buttons.md#anatomy and
   icon-buttons.md#anatomy).

## Variants

- Standard: buttons keep a gap between them, so a pressed button can grow and push its neighbours
  without moving anything outside the group. The group hugs the width of its buttons.
- Connected: buttons sit 2dp apart [site:/components/button-groups/specs]
  [token:md.comp.button-group.connected.small.between-space]. The outer ends follow the group's
  shape and the inner corners stay small. The group stretches to the width of the surface it is
  on, widening each button; on large windows give it a maximum width.
- Size: extra small to extra large, matching the button sizes.
- Default shape for the buttons: round or square.
- Rules for mixing inside a standard group:
  - By default every button shares one size and one shape.
  - Different sizes only for a hero moment, not as a habit.
  - A different shape only for the selected button, or to add meaning or contrast.
- Colors: use the contained button styles (filled, tonal, outlined, elevated). Avoid standard icon
  buttons and text buttons, which have no container for the group to shape. Do not mix color
  styles within a connected group; selection becomes hard to read.

## Expressive

- The whole component is Expressive-only. Its baseline counterpart is the segmented button,
  which is no longer recommended (see segmented-buttons.md#summary).
- Shape morph:
  - Pressing a button changes its shape and its width.
  - A selected toggle changes shape (round to square, or square to round) and also its color.
- In a standard group a pressed or selected button briefly widens and its direct neighbours
  narrow. In a connected group only the pressed or selected button changes shape; neighbours stay
  put.

## States and behavior

- The group itself has no states. Each button shows its own enabled, disabled, hovered, focused,
  pressed and (for toggles) selected states.
- Selection patterns: single-select (one at a time), multi-select (any number), and
  selection-required (at least one stays selected).
- Resizing across window sizes:
  - Fixed: set width (narrow to wide), size (extra small to extra large) or padding per
    breakpoint by hand.
  - Flexible: the buttons and the group grow or shrink automatically, until every flexible button
    reaches its widest setting.
  - When widening icon buttons by hand, stop at the wide setting.
  - Compact windows: smaller, narrower buttons so everything fits. Large windows: larger, wider
    buttons to fill the space.
  - Keep the hierarchy at every breakpoint: the primary action stays the largest, widest or most
    colorful.
- Overflow: buttons at the trailing end may collapse into an overflow menu at small widths and
  reappear at larger ones. The overflow menu goes at the trailing end. Buttons outside the group
  are not affected.
- Density: the group follows the height of the buttons inside, including when density is applied.

## Measurements

The values are material-web's (canonical). No token cited in this note differs on another
platform; the linter checks this, and a difference would need a `[differs:]` marker.

| | XS | S | M | L | XL |
|---|---|---|---|---|---|
| Height | 32dp [token:md.comp.button-group.standard.xsmall.container.height] | 40dp [token:md.comp.button-group.standard.small.container.height] | 56dp [token:md.comp.button-group.standard.medium.container.height] | 96dp [token:md.comp.button-group.standard.large.container.height] | 136dp [token:md.comp.button-group.standard.xlarge.container.height] |
| Standard: space between buttons | 18dp [site:/components/button-groups/specs] [token:md.comp.button-group.standard.xsmall.between-space] | 12dp [site:/components/button-groups/specs] [token:md.comp.button-group.standard.small.between-space] | 8dp [site:/components/button-groups/specs] [token:md.comp.button-group.standard.medium.between-space] | 8dp [site:/components/button-groups/specs] [token:md.comp.button-group.standard.large.between-space] | 8dp [site:/components/button-groups/specs] [token:md.comp.button-group.standard.xlarge.between-space] |
| Connected: space between buttons | 2dp [token:md.comp.button-group.connected.xsmall.between-space] | 2dp [token:md.comp.button-group.connected.small.between-space] | 2dp [token:md.comp.button-group.connected.medium.between-space] | 2dp [token:md.comp.button-group.connected.large.between-space] | 2dp [token:md.comp.button-group.connected.xlarge.between-space] |
| Connected: inner corner, resting | 4dp [site:/components/button-groups/specs] [token:md.comp.button-group.connected.xsmall.inner-corner.corner-size] | 8dp [site:/components/button-groups/specs] [token:md.comp.button-group.connected.small.inner-corner.corner-size] | 8dp [site:/components/button-groups/specs] [token:md.comp.button-group.connected.medium.inner-corner.corner-size] | 16dp [site:/components/button-groups/specs] [token:md.comp.button-group.connected.large.inner-corner.corner-size] | 20dp [site:/components/button-groups/specs] [token:md.comp.button-group.connected.xlarge.inner-corner.corner-size] |
| Connected: inner corner, pressed | 4dp [token:md.comp.button-group.connected.xsmall.pressed.inner-corner.corner-size] | 4dp [token:md.comp.button-group.connected.small.pressed.inner-corner.corner-size] | 4dp [token:md.comp.button-group.connected.medium.pressed.inner-corner.corner-size] | 12dp [token:md.comp.button-group.connected.large.pressed.inner-corner.corner-size] | 16dp [token:md.comp.button-group.connected.xlarge.pressed.inner-corner.corner-size] |

- Extra small inner corner: the site prints 4dp [site:/components/button-groups/specs], but the
  token gives 8dp [token:md.comp.button-group.connected.xsmall.inner-corner.corner-size]. The
  repository value wins (README precedence); the difference is a site-vs-repo conflict.
- The standard gaps are larger at extra small and small so that each button keeps its
  minimum target of 48dp [site:/components/button-groups/specs].
- Connected outer corners are fully round for round groups
  [token:md.comp.button-group.connected.small.container.shape]. A selected button in a connected
  group turns fully round on its inner side as well (token
  `md.comp.button-group.connected.small.selected.inner-corner.corner-size`, half the height).
- Square connected groups, outer corners as the site gives them (no token covers them):
  - XS 4dp, S 8dp, M 8dp [site:/components/button-groups/specs].
  - L 16dp, XL 20dp [site:/components/button-groups/specs].
- Standard group press: the pressed button grows by a fraction of its own width and its
  neighbours give up the same amount. The token for that fraction is
  `md.comp.button-group.standard.small.pressed.item.width.multiplier`; Compose's default ratio is
  0.15 (`ButtonGroupDefaults.ExpandedRatio`, ButtonGroup.kt:186).
- Connected groups at extra small and small have a 48dp [site:/components/button-groups/specs]
  target area and buttons at least 48dp [site:/components/button-groups/specs] wide.

## Typography

- The group has no type token of its own [NOT FOUND]. Labels follow the button sizes; see
  buttons.md#typography.

## Color roles and state layers

- The group has no color properties. Buttons inside keep their own roles and state layers; see
  buttons.md#color-roles-and-state-layers and icon-buttons.md#color-roles-and-state-layers.
- A selected toggle in either variant changes color according to its toggle colors.

## Motion

- Standard group width change on press: material-web and Flutter tie it to the fast spatial
  spring [token:md.comp.button-group.standard.small.pressed.item.width.motion.spring.dampening]
  [token:md.comp.button-group.standard.small.pressed.item.width.motion.spring.stiffness].
  - Standard scheme: damping 0.9, stiffness 1400 [token:md.sys.motion.spring.fast.spatial.damping]
    [token:md.sys.motion.spring.fast.spatial.stiffness].
  - Expressive scheme: damping 0.6, stiffness 800 [token:md.sys.motion.spring.fast.spatial.damping]
    [token:md.sys.motion.spring.fast.spatial.stiffness].
- Compose has no group motion token [NOT FOUND]; `ButtonGroup` animates widths with the fast
  spatial spring of the active motion scheme
  [impl:compose-material3/commonMain/androidx/compose/material3/ButtonGroup.kt:138].
- Shape morphs of the buttons themselves (press and selection) follow buttons.md#motion and
  icon-buttons.md#motion.
- Connected-group inner-corner morph: no group-level duration, easing or spring token
  [NOT FOUND].

## Accessibility

- People must be able to reach and use every button in the group and tell which ones are
  selected.
- Every button needs a target of at least 48 × 48dp [site:/components/button-groups/accessibility].
  The wider gaps in extra small and small standard groups exist for this; do not shrink them.
- The container never takes focus. Initial focus lands on the first button.
- Keyboard: Tab reaches the group, arrow keys move between its buttons, Space or Enter activates
  (or selects) the focused button.
- The container needs no accessible label. Label each button by the button and icon button rules
  (buttons.md#accessibility, icon-buttons.md#accessibility).
- Selected toggles must expose their selected state.

## Platform mapping

- Jetpack Compose (material3 1.5.0-rc01): `ButtonGroup`, which takes an `overflowIndicator` and a
  `ButtonGroupScope` content block (`clickableItem`, `toggleableItem`, `customItem`,
  `Modifier.animateWidth`). `ButtonGroupDefaults` gives `ExpandedRatio`, `HorizontalArrangement`,
  `ConnectedSpaceBetween` and the connected shapes (`connectedLeadingButtonShapes()`,
  `connectedMiddleButtonShapes()`, `connectedTrailingButtonShapes()`).
  - A connected group is a row of toggle buttons using those shapes and `ConnectedSpaceBetween`;
    there is no separate connected composable.
  - Compose only carries small-size group tokens (`ButtonGroupSmallTokens`,
    `ConnectedButtonGroupSmallTokens`), so the per-size `md.comp.button-group.*` ids show NOT FOUND
    for Compose.
- Flutter (`material_ui` 1.11.0): no button group. `ToggleButtons` is an older, unrelated widget
  and `SegmentedButton` is the baseline predecessor. The button group is one of our Phase 3 gap
  components, built from official buttons and our tokens and protected by golden tests.
- Web: no maintained official component. Our CSS button group is built in Phase 3 from the
  material-web token values above.

## Pitfalls

- Letting a group wrap to two lines instead of collapsing trailing buttons into an overflow menu.
- Mixing sizes or shapes in a standard group without a reason.
- Mixing color styles in a connected group.
- Using standard icon buttons or text buttons in a group; they have no container to morph.
- A connected group whose buttons are not toggles.
- Making the container focusable or giving it a label.
- Reducing the extra small and small gaps, which breaks the target of 48dp [site:/components/button-groups/accessibility].
- Stretching a connected group across a very wide window without a maximum width.
