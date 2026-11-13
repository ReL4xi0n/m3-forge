---
title: Radio button
kind: component
pages: [/components/radio-button/overview, /components/radio-button/specs, /components/radio-button/guidelines, /components/radio-button/accessibility]
tokenSets: [radio-button]
expressive: false
fetched: 2026-11-13
---

## Summary

A radio button lets a person choose exactly one option from a set. Choosing one clears whichever
was chosen before. It is the single-choice member of the selection controls; checkboxes allow
several choices and switches handle standalone settings.

## Use it when

- Exactly one option must be picked, and all options should be visible at once.
- The set is small: five options or fewer.
- Avoid when:
  - Several options may be picked; use checkboxes.
  - The control turns one setting on or off; use a switch.
  - Space is tight; a drop-down menu takes less room, at the cost of more taps and more thought.
  - The options would need nesting; radio buttons do not nest.

## Anatomy

1. Unselected icon: an empty ring.
2. Selected icon: the ring with a filled dot in the middle.
3. Adjacent label text: required for every radio button, since each option needs its own name.

## Variants

- One configuration only: a radio button is selected or unselected. There are no sizes or
  styles.
- Groups are usually stacked vertically. Avoid horizontal rows of radio buttons.

## Expressive

- Radio buttons did not receive an Expressive update; there are no new sizes, shapes or morphs.
- The M3 change from M2 was new color mappings that work with dynamic color.

## States and behavior

- Interaction states: enabled, hovered, focused, pressed, disabled; each for selected and
  unselected.
- A group may start with one option preselected or with none. The guidelines recommend
  preselecting one.
- Once something is selected, the group cannot return to "nothing selected" by itself. If people
  must be able to opt out, add an explicit option such as "None" or "Not applicable", or a
  separate "Clear selection" action.
- Clicking or tapping the label selects the option, as the ring does.
- A new choice applies immediately, unless the group sits in a dialog or page that has its own
  Save step.

## Measurements

The values are material-web's (canonical). No token cited below differs on another platform; the
linter checks this, and a difference would need a `[differs:]` marker.

| Property | Value |
|---|---|
| Icon size | 20dp [site:/components/radio-button/specs] [token:md.comp.radio-button.icon.size] |
| State layer size | 40dp [site:/components/radio-button/specs] [token:md.comp.radio-button.state-layer.size] |
| Touch target | 48dp [site:/components/radio-button/specs] |
| Ring stroke width | [NOT FOUND] (no token) |
| Selected dot size | [NOT FOUND] (no token) |

- Compose implementation values (not tokens):
  - Selected dot 12dp [impl:compose-material3/commonMain/androidx/compose/material3/RadioButton.kt:321].
  - Ring stroke 2dp [impl:compose-material3/commonMain/androidx/compose/material3/RadioButton.kt:323].

## Typography

- The radio button has no text of its own and no type token [NOT FOUND].
- The adjacent label's type style is not specified by the site [NOT FOUND]; only its color is
  (below).

## Color roles and state layers

| State | Selected icon | Unselected icon |
|---|---|---|
| Enabled, hovered, focused, pressed | primary [token:md.comp.radio-button.selected.icon.color] | on surface variant [token:md.comp.radio-button.unselected.icon.color] |
| Disabled | on surface at 38% [token:md.comp.radio-button.disabled.selected.icon.opacity] | on surface at 38% [token:md.comp.radio-button.disabled.unselected.icon.opacity] |

- The adjacent label uses on surface and keeps it in every state, selected or not.

State layers (a circle behind the icon):

- Selected: primary for hover and focus [token:md.comp.radio-button.selected.hover.state-layer.color],
  on surface while pressed [token:md.comp.radio-button.selected.pressed.state-layer.color].
- Unselected: on surface for hover and focus [token:md.comp.radio-button.unselected.hover.state-layer.color],
  primary while pressed [token:md.comp.radio-button.unselected.pressed.state-layer.color].
- Opacities: hover 8% [token:md.comp.radio-button.selected.hover.state-layer.opacity], focus
  10% [token:md.comp.radio-button.selected.focus.state-layer.opacity], press
  10% [token:md.comp.radio-button.selected.pressed.state-layer.opacity].

## Motion

- No radio-button duration, easing or spring token exists in the three sources [NOT FOUND]. There
  is no Expressive shape morph. Code chooses the motion:
- Compose grows the inner dot with the fast spatial spring
  [impl:compose-material3/commonMain/androidx/compose/material3/RadioButton.kt:141] and fades the
  color with the default effects spring
  [impl:compose-material3/commonMain/androidx/compose/material3/RadioButton.kt:147].
- Flutter: [NOT FOUND] in `material_ui`; the radio's toggle animation comes from the Flutter
  framework's toggleable mixin, outside the pinned sources.

## Accessibility

- People using assistive technology must be able to reach the group, pick an option, and get
  feedback that fits their input method.
- Keyboard:
  - Tab enters the group on the selected option, or on the first option if none is selected.
  - Shift+Tab enters on the selected option, or on the last option if none is selected.
  - Arrow keys move focus and selection together to the previous or next option, wrapping from
    last to first.
  - Space selects the focused option; it does nothing if that option is already selected.
- Names and roles:
  - The group is named after its title and has the radio-group role.
  - Each button is named by its adjacent label. When the label is correctly linked, screen
    readers announce the label and then the role.
- Target: at least 48 × 48dp [site:/components/radio-button/specs]. Do not apply density by
  default; make a denser layout opt-in, and keep the controls that undo it at full size.

## Platform mapping

- Jetpack Compose (material3 1.5.0-rc01): `RadioButton(selected, onClick)`, colors from
  `RadioButtonDefaults.colors()`. Grouping and single selection are up to the caller (for example
  `Modifier.selectableGroup()` on the container, from Compose foundation).
- Flutter (`material_ui` 1.11.0): `Radio<T>` and `RadioListTile<T>`. The `groupValue` and
  `onChanged` parameters of `Radio` are deprecated in favour of a `RadioGroup` ancestor, which
  lives in the Flutter framework rather than in `material_ui`. `Radio.adaptive` gives a
  platform-styled control.
- Web: no maintained official component. Our CSS radio button is built in Phase 3 from the
  material-web token values above.

## Pitfalls

- Using radio buttons where several choices are allowed, or nesting them.
- A horizontal row of radio buttons, which is harder to scan.
- More than about five options; consider a menu.
- A group with no way to undo a choice when "none" is a valid answer.
- Radio buttons without labels, or labels that are not clickable.
- Default density that shrinks the 48dp [site:/components/radio-button/specs] target.
