---
title: Segmented buttons
kind: component
pages: [/components/segmented-buttons/overview, /components/segmented-buttons/specs, /components/segmented-buttons/guidelines, /components/segmented-buttons/accessibility]
tokenSets: [outlined-segmented-button]
expressive: false
fetched: 2026-11-13
---

## Summary

A segmented button is a single outlined row of two to five segments for choosing options,
switching views or sorting. It comes as single-select or multi-select. It is a baseline M3
component: the M3 Expressive update no longer recommends it and points to the connected button
group instead, which does nearly the same job with the newer visuals (see
button-groups.md#summary). Keep this note for existing products that have not moved yet.

## Use it when

- People choose among two to five closely scoped options:
  - Single-select: exactly one option, such as a drink size, or switching between two views.
  - Multi-select: any number from none to all, such as price-range filters.
- It can sit on other surfaces, such as a bottom sheet or a full-screen dialog.
- Avoid when:
  - There are more than five options; use chips or another component.
  - Labels are long enough to wrap; shorten them or use icons.
  - Starting new Expressive work; use a connected button group.

## Anatomy

1. Segment, inside the shared container. Each segment is clearly divided from its neighbours.
2. Icon (optional; shown on unselected segments).
3. Label text (optional when an icon is present).
4. Selected icon: a checkmark.

## Variants

- Single-select and multi-select.
- Segment content: label only, icon only, or icon and label. Pick one kind and use it for every
  segment; do not mix icon-only segments with labelled ones.
- Shape: fully rounded ends, like common buttons.

## Expressive

- Not part of M3 Expressive. The May 2025 update marks the segmented button as no longer
  recommended; the connected button group replaces it. See button-groups.md#variants.
- Compared with M2 (where the component was called toggle buttons): taller container, fully round
  ends instead of a small radius, sentence-case labels instead of all caps, new color roles that
  support dynamic color, and an optional checkmark for the selected state.

## States and behavior

- Unselected states: enabled, disabled, hovered, focused, pressed. Selected states: enabled,
  hovered, focused, pressed.
- When a segment holds both an icon and a label, selecting it swaps the icon for the checkmark.
- Multi-select does not require any selection.
- Width:
  - The container width depends on the labels; each segment gets an equal share of it (one
    third each with three segments).
  - Leave margins so the container never touches the edge of the viewport.
  - On larger screens cap the padding inside segments; do not let the row span a whole large
    pane.
- Labels are short, of similar length, centered, and never wrap onto a second line.
- Density lowers only the height.

## Measurements

The values are material-web's (canonical). No token cited in this note differs on another
platform; the linter checks this, and a difference would need a `[differs:]` marker.

| Element | Value |
|---|---|
| Height | 40dp [site:/components/segmented-buttons/specs] [token:md.comp.outlined-segmented-button.container.height] |
| Outline width | 1dp [site:/components/segmented-buttons/specs] [token:md.comp.outlined-segmented-button.outline.width] |
| Shape | full [token:md.comp.outlined-segmented-button.shape] |
| Icon | 18dp [token:md.comp.outlined-segmented-button.with-icon.icon.size] |
| Side padding (minimum) | 12dp [site:/components/segmented-buttons/specs] |
| Gap between icon and label | 8dp [site:/components/segmented-buttons/specs] |
| Target size | 48dp [site:/components/segmented-buttons/specs] |
| Density step | minus 4dp [site:/components/segmented-buttons/specs] per step, height only |

- Segment width: the container width divided by the number of segments.
- Compose's code sets the side padding to 12dp [impl:compose-material3/commonMain/androidx/compose/material3/SegmentedButton.kt:619]
  and the icon–label gap to 8dp [impl:compose-material3/commonMain/androidx/compose/material3/SegmentedButton.kt:854].
- Compose reads the icon size from a compose-only id (`md.comp.outlined-segmented-button.icon-size`,
  18dp [token:md.comp.outlined-segmented-button.icon-size]).

## Typography

- Label: label large [token:md.comp.outlined-segmented-button.label-text.font], in sentence case.

## Color roles and state layers

- Container: transparent when unselected; secondary container when selected
  [token:md.comp.outlined-segmented-button.selected.container.color].
- Outline: outline [token:md.comp.outlined-segmented-button.outline.color].
- Label and icon: on surface when unselected
  [token:md.comp.outlined-segmented-button.unselected.label-text.color]; on secondary container
  when selected [token:md.comp.outlined-segmented-button.selected.label-text.color].
- Disabled:
  - Label and icon: on surface at 38% [token:md.comp.outlined-segmented-button.disabled.label-text.opacity].
  - Outline: on surface at 12% [token:md.comp.outlined-segmented-button.disabled.outline.opacity].

State layers (in the label color of the current selection state):

- Hovered: 8% [token:md.comp.outlined-segmented-button.hover.state-layer.opacity].
- Focused: 10% [token:md.comp.outlined-segmented-button.focus.state-layer.opacity].
- Pressed: 10% [token:md.comp.outlined-segmented-button.pressed.state-layer.opacity]. The pressed
  token reuses the focus opacity.

## Motion

- The site shows the icon turning into a checkmark on selection but gives no duration, easing or
  spring [NOT FOUND]. No segmented-button motion token exists [NOT FOUND].
- Compose:
  - Without a custom inactive icon, the checkmark fades in with the default effects spring and
    scales up from zero with the fast spatial spring
    [impl:compose-material3/commonMain/androidx/compose/material3/SegmentedButton.kt:655]
    [impl:compose-material3/commonMain/androidx/compose/material3/SegmentedButton.kt:659].
  - With a custom inactive icon, the two icons crossfade with the default effects spring
    [impl:compose-material3/commonMain/androidx/compose/material3/SegmentedButton.kt:668].
  - Content shifts inside the segment animate with the fast spatial spring
    [impl:compose-material3/commonMain/androidx/compose/material3/SegmentedButton.kt:391].
  - Default effects: damping 1, stiffness 1600 [token:md.sys.motion.spring.default.effects.damping]
    [token:md.sys.motion.spring.default.effects.stiffness]. Fast spatial, standard scheme:
    damping 0.9, stiffness 1400 [token:md.sys.motion.spring.fast.spatial.damping]
    [token:md.sys.motion.spring.fast.spatial.stiffness].

## Accessibility

- People must be able to reach and operate every segment with assistive technology and know what
  each selection does.
- Keyboard: Tab reaches the segmented button; arrow keys move between segments.
  - Single-select: Space or Enter selects the focused segment.
  - Multi-select: Space or Enter toggles the focused segment on or off.
- Initial focus goes to the first segment (leftmost in left-to-right languages, rightmost in
  right-to-left ones), whatever is selected.
- The outline needs at least 3:1 contrast with the surface, so each segment reads as a button.
- Selection is shown by both the checkmark and a color change; never by color alone.
- The accessible name is the visible label ("Relevance", "Distance"). Icon-only segments describe
  what the icon stands for ("Inexpensive" for a single currency sign).
- Roles: single-select behaves like a radio group; multi-select behaves like a set of checkboxes.
- Target size: 48dp [site:/components/segmented-buttons/specs].

## Platform mapping

- Jetpack Compose (material3 1.5.0-rc01): `SingleChoiceSegmentedButtonRow` and
  `MultiChoiceSegmentedButtonRow`, each holding `SegmentedButton` items.
  `SegmentedButtonDefaults` gives `itemShape(index, count)`, `baseShape`, `BorderWidth`,
  `IconSize`, `ContentPadding`, `ActiveIcon()`, `Icon(...)` and `colors(...)`.
- Flutter (`material_ui` 1.11.0): `SegmentedButton<T>` with a list of `ButtonSegment<T>`, a
  `selected` set and `onSelectionChanged`. Multi-select is `multiSelectionEnabled`; allowing no
  selection is `emptySelectionAllowed`; `showSelectedIcon` controls the checkmark.
- Web: no maintained official component. New work should use our connected button group (Phase
  3); a CSS segmented button can be built from the material-web token values above if a product
  still needs one.

## Pitfalls

- Starting new Expressive designs with it instead of a connected button group.
- More than five segments, or a single segment.
- Mixing icon-only segments with labelled ones.
- Long labels that wrap or get cut.
- Stretching the row across a whole large screen.
- Showing selection only by color (dropping the checkmark without another cue).
- An outline with less than 3:1 contrast.
