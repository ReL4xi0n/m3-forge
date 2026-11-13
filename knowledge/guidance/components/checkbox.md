---
title: Checkbox
kind: component
pages: [/components/checkbox/overview, /components/checkbox/specs, /components/checkbox/guidelines, /components/checkbox/accessibility, /components/switch/guidelines, /components/dialogs/guidelines]
tokenSets: [checkbox]
expressive: false
fetched: 2026-11-13
---

## Summary

A checkbox lets a person pick any number of items from a list, or switch a single item on or off.
It is one of the three selection controls, next to radio buttons (exactly one choice) and switches
(standalone settings). A checkbox can be unselected, selected or indeterminate, and each of these
has an error version.

## Use it when

- Several related options can be chosen at once from a list.
- A list contains sub-options that a parent checkbox can select or clear in one go.
- A single item is turned on or off on desktop, where checkboxes are the common idiom.
- Related options should read as one group. Checkboxes also take less room than a column of
  switches.
- A set of several related options that would otherwise be drawn as switches, especially when
  they apply only after a save. Switches are meant to act at once, so a group that waits for a
  save belongs in checkboxes.
- Avoid when:
  - Only one option may be chosen; use radio buttons.
  - The control is a standalone setting, such as a single row on a settings screen, especially on
    mobile; use a switch. On desktop a checkbox is also common (see above).

## Anatomy

1. Container: the small rounded square. Its outline shows when unselected; it fills when selected
   or indeterminate.
2. Icon: the check mark (selected) or the dash (indeterminate), drawn inside the container.

The text label next to the box is not part of the component, but every checkbox needs one.

## Variants

- Values: unselected, selected, indeterminate.
- Error: each value has an error version for validation problems.
- Parent and child: a parent checkbox controls a group of child checkboxes.
  - Checking the parent checks every child; clearing it clears every child.
  - When only some children are checked, the parent shows the indeterminate dash.
  - Activating an indeterminate parent checks all its children.

## Expressive

- Checkboxes did not receive an Expressive update; there are no new sizes, shapes or morphs.
- The M3 changes from M2 were new color mappings that work with dynamic color, plus the
  indeterminate value and error versions of all three values.

## States and behavior

- Interaction states: enabled, hovered, focused, pressed, disabled. Each applies to unselected,
  selected and indeterminate, with and without error.
- The selected state should be obvious at once and visually stronger than the unselected one.
- When a checkbox switches something on or off, the change takes effect immediately, with no
  separate Save step.
- Clicking or tapping the label toggles the checkbox, just like the box itself.
- Children can be checked or cleared independently of one another.
- On large screens, a group of related checkboxes can live in a contained region such as a side
  sheet, together with the actions that apply to it.

## Measurements

The values are material-web's (canonical). No token cited below differs on another platform; the
linter checks this, and a difference would need a `[differs:]` marker.

| Property | Value |
|---|---|
| Container size | 18dp [site:/components/checkbox/specs] [token:md.comp.checkbox.container.size] |
| Container corner radius | 2dp [site:/components/checkbox/specs] [token:md.comp.checkbox.container.shape] |
| Unselected outline width | 2dp [token:md.comp.checkbox.unselected.outline.width] |
| Selected outline width | 0dp [token:md.comp.checkbox.selected.outline.width] |
| Icon size | 18dp [site:/components/checkbox/specs] [token:md.comp.checkbox.icon.size] |
| State layer size | 40dp [site:/components/checkbox/specs] [token:md.comp.checkbox.state-layer.size] |
| State layer shape | circle [token:md.comp.checkbox.state-layer.shape] |
| Touch target | 48dp [site:/components/checkbox/specs] |
| Focus ring thickness | 3dp [token:md.comp.checkbox.focus.indicator.thickness] |
| Focus ring offset | 2dp [token:md.comp.checkbox.focus.indicator.outline.offset] |

- The icon is centered in the container.
- Compose defines no focus-ring tokens for the checkbox [NOT FOUND]; see `knowledge/not-found.md`.
- Flutter draws the box at 18dp [impl:material_ui/packages/material_ui/lib/src/checkbox.dart:438]
  (`Checkbox.width`).

## Typography

- The checkbox has no text of its own and no type token [NOT FOUND].
- The adjacent label is ordinary body text. The site does not name a type style for it
  [NOT FOUND]; only its color is specified (below).

## Color roles and state layers

| Value | Container | Outline | Icon |
|---|---|---|---|
| Unselected | none | on surface variant [token:md.comp.checkbox.unselected.outline.color] | none |
| Selected or indeterminate | primary [token:md.comp.checkbox.selected.container.color] | none | on primary [token:md.comp.checkbox.selected.icon.color] |
| Unselected, error | none | error [token:md.comp.checkbox.unselected.error.outline.color] | none |
| Selected, error | error [token:md.comp.checkbox.selected.error.container.color] | none | on error [token:md.comp.checkbox.selected.error.icon.color] |
| Disabled, unselected | none | on surface at 38% [token:md.comp.checkbox.unselected.disabled.container.opacity] | none |
| Disabled, selected | on surface at 38% [token:md.comp.checkbox.selected.disabled.container.opacity] | none | surface [token:md.comp.checkbox.selected.disabled.icon.color] |

- Hovering, focusing or pressing an unselected box darkens its outline to on surface
  [token:md.comp.checkbox.unselected.hover.outline.color].
- The adjacent label uses on surface and keeps that color in every state, checked or not.

State layers (a circle behind the box):

- Unselected: on surface for hover and focus [token:md.comp.checkbox.unselected.hover.state-layer.color],
  primary while pressed [token:md.comp.checkbox.unselected.pressed.state-layer.color].
- Selected: primary for hover and focus [token:md.comp.checkbox.selected.hover.state-layer.color],
  on surface while pressed [token:md.comp.checkbox.selected.pressed.state-layer.color]. The press
  color is the color of the value being moved to.
- Error: error for hover, focus and press [token:md.comp.checkbox.error.hover.state-layer.color].
- Opacities: hover 8% [token:md.comp.checkbox.unselected.hover.state-layer.opacity], focus
  10% [token:md.comp.checkbox.unselected.focus.state-layer.opacity], press
  10% [token:md.comp.checkbox.unselected.pressed.state-layer.opacity].
- Focus ring: secondary [token:md.comp.checkbox.focus.indicator.color].

## Motion

- No checkbox duration, easing or spring token exists in the three sources [NOT FOUND]. The
  checkbox has no Expressive shape morph. Code chooses the motion:
- Compose:
  - The check mark is drawn in with the default spatial spring
    [impl:compose-material3/commonMain/androidx/compose/material3/Checkbox.kt:596].
  - Box colors animate with the default effects spring when filling and the fast effects spring
    when emptying [impl:compose-material3/commonMain/androidx/compose/material3/Checkbox.kt:1044]
    [impl:compose-material3/commonMain/androidx/compose/material3/Checkbox.kt:1047].
  - A disabled checkbox snaps to its new look without animating.
- Flutter runs the press reaction for 100ms [impl:material_ui/packages/material_ui/lib/src/constants.dart:45]
  (`kRadialReactionDuration`, used by the checkbox at checkbox.dart:481).

## Accessibility

- People using assistive technology must be able to reach the checkbox, toggle it, and get
  feedback that fits their input method.
- The label and the box are one target: activating either toggles the value.
- Accessible name: normally the visible label. When the label is correctly linked to the input,
  screen readers announce the label and then the role.
- A parent checkbox must expose its mixed (indeterminate) value.
- Keyboard: Tab moves to the checkbox and Space toggles it. (The site's keyboard table on the
  checkbox page lists chip actions and appears to be copied from the chips page, so it is not
  repeated here.)
- Target: 48 × 48dp [site:/components/checkbox/specs] around the 18dp [token:md.comp.checkbox.container.size]
  box. Do not apply density by default, since it shrinks targets below that size. Offer a denser
  layout as an opt-in, and keep the controls that undo it at full size.

## Platform mapping

- Jetpack Compose (material3 1.5.0-rc01):
  - `Checkbox` (checked / unchecked) and `TriStateCheckbox` (with `ToggleableState.Indeterminate`
    for a parent).
  - Colors come from `CheckboxDefaults.colors()`.
  - Compose's checkbox has no error parameter: the error tokens exist in its token file, but
    `Checkbox.kt` never reads them. Error styling needs custom colors.
- Flutter (`material_ui` 1.11.0):
  - `Checkbox` with `tristate: true` for the indeterminate value, `isError` for the error look,
    and `Checkbox.adaptive` for a platform-styled checkbox.
  - `CheckboxListTile` pairs a checkbox with a list-item label.
- Web: no maintained official component. Our CSS checkbox is built in Phase 3 from the
  material-web token values above.

## Pitfalls

- Using checkboxes for a single choice (use radio buttons), or for a standalone setting on mobile
  (use a switch).
- A column of switches for several related options, especially ones that only apply after a save;
  a list of checkboxes is clearer and smaller.
- Making only the box clickable, not its label.
- A parent checkbox that never shows the indeterminate value when its children are mixed.
- An error state with no message beside it. Checkboxes have no built-in error text, so add an
  error message next to them.
- Default density that shrinks the 48dp [site:/components/checkbox/specs] target.
