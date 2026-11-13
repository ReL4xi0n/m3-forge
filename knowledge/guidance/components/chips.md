---
title: Chips
kind: component
pages: [/components/chips/overview, /components/chips/specs, /components/chips/guidelines, /components/chips/accessibility]
tokenSets: [assist-chip, filter-chip, input-chip, suggestion-chip, chips]
expressive: false
fetched: 2026-11-13
---

## Summary

Chips are small, compact controls that appear in sets and change with the task at hand. They let
people enter information, narrow content, make a selection or trigger a contextual action. M3 has
four kinds: assist, filter, input and suggestion. All share a 32dp [token:md.comp.assist-chip.container.height]
rounded-rectangle container.

## Use it when

- Pick the kind by purpose and by who authored the content:
  - Assist: a smart or automated action, often reaching into another app (add to calendar,
    get directions). Start the label with a verb.
  - Filter: a tag that narrows a collection (results, products, listings). Use nouns for the
    category being included.
  - Input: a discrete piece of information the person typed, turned into a chip (a recipient
    in a To field).
  - Suggestion: a dynamically generated option that narrows intent (a quick reply, a search
    refinement).
- Chips support the current task; buttons move people through it. Chips offer forking options
  that change with context, while buttons are fixed parts of a layout and take linear steps.
- Avoid when:
  - The action finishes or advances a flow (Next, Submit, Back); use a button.
  - There would be a single chip on its own; chips belong in a set.
  - The action is a major, persistent one; buttons appear consistently, chips appear contextually.

## Anatomy

1. Container.
2. Label text.
3. Leading icon or image (optional): a system icon, a logo, or a circular image such as an
   avatar. Images are drawn larger than icons to keep their detail.
4. Trailing icon: required on input chips (remove), optional on filter chips (remove or open a
   menu). Assist and suggestion chips have none. It sits at the end edge, so it moves to the left
   in right-to-left layouts.

## Variants

- Assist chip: flat (outlined) or elevated.
- Filter chip: flat or elevated; selected or unselected. Selecting one adds a check mark at the
  start of the label. A set can be multi-select or single-select (an alternative to segmented
  buttons, radio buttons or a single-select menu). Do not mix the two behaviours on one page.
- Input chip: unselected or selected; optional leading icon or avatar; trailing remove icon.
- Suggestion chip: flat or elevated.
- Elevation: chips rest flat (no shadow) by default. Use the elevated style only when a chip sits
  on an image or another busy background; on a plain page, use the outline instead.

## Expressive

- The site describes no Expressive update for chips. Its only recent change (Aug 2024) softened
  the default stroke from outline to outline variant, to separate chips from outlined buttons
  more clearly.
- Code goes further than the site:
  - Compose 1.5.0-rc01 has `FilterChip`, `ElevatedFilterChip` and `InputChip` overloads that take
    `ChipShapes` and morph the corners by state. These overloads are tagged as Expressive in the
    code.
  - The shapes come from a newer `md.comp.chips` token set, present in Compose and Flutter data
    but not in material-web:
    - Unselected 12dp [token:md.comp.chips.unselected.shape].
    - Selected fully round [token:md.comp.chips.selected.shape].
    - Pressed 8dp [token:md.comp.chips.pressed.shape].
  - The site gives no guidance on these shapes; treat them as an implementation option, not as
    the documented default.

## States and behavior

- Interaction states: enabled, disabled, hovered, focused, pressed, dragged; filter and input chips
  add selected and unselected.
- Show a press with the ripple and state layer, not by raising the chip.
- Assist chips may update their label after acting (Save becomes Saved), show progress, or expand
  into a dialog, a full view or more results.
- Filter chips:
  - The available filters may change as people select some.
  - On medium and expanded windows, a trailing icon can remove the chip or open a menu.
  - On compact windows, make the whole chip open the menu; the icon alone is too small a target.
- Input chips:
  - Can be edited (the chip turns back into plain text), reordered, or moved to another field.
  - Pressing Backspace with the cursor just after a chip selects it; a second Backspace deletes
    it.
  - Can expand to show more detail through a container transform transition.
  - When they overflow a text field, they behave like text: an unfocused field shows the start,
    and focusing it jumps to the end with the cursor.
- Layout of a set:
  - Arrange chips in a row, never stacked vertically.
  - They may wrap to more lines; beyond two rows, consider horizontal scrolling.
  - A one-row field can scroll sideways instead.
  - Labels truncate when a wrapped chip would be wider than the window.
- Labels: keep them to 20 characters or fewer. Drop articles and other filler words.

## Measurements

The values are material-web's (canonical) unless a line says otherwise. No token cited below
differs on another platform; the linter checks this, and a difference would need a `[differs:]`
marker.

| Property | Value |
|---|---|
| Container height (all four kinds) | 32dp [site:/components/chips/specs] [token:md.comp.assist-chip.container.height] |
| Corner radius | 8dp [site:/components/chips/specs] [token:md.comp.assist-chip.container.shape] |
| Outline width, flat chips | 1dp [token:md.comp.assist-chip.flat.outline.width] |
| Outline width, selected filter or input chip | 0dp [token:md.comp.filter-chip.flat.selected.outline.width] |
| Icon size (leading or trailing) | 18dp [site:/components/chips/specs] [token:md.comp.assist-chip.with-icon.icon.size] |
| Avatar size (input chip) | 24dp [site:/components/chips/specs] [token:md.comp.input-chip.with-avatar.avatar.size] |
| Avatar shape (input chip) | 12dp [site:/components/chips/specs] [token:md.comp.input-chip.with-avatar.avatar.shape] |
| Side padding, no icon | 16dp [site:/components/chips/specs] |
| Side padding on an icon side | 8dp [site:/components/chips/specs] |
| Leading padding before an avatar | 4dp [site:/components/chips/specs] |
| Gap between icon, label and trailing icon | 8dp [site:/components/chips/specs] |
| Space between chips in a set | at least 8dp [site:/components/chips/guidelines] |
| Touch target | at least 48dp [site:/components/chips/guidelines] |

- The label is start-aligned and vertically centered.
- Avatar shape: the site's table gives a corner radius (row above), but the token is a full
  circle [token:md.comp.input-chip.with-avatar.avatar.shape]. The repository wins, so the avatar
  is circular.
- Room for a trailing action: a remove icon needs its own 48 × 48dp [site:/components/chips/guidelines]
  target that does not overlap the chip's main action. Reach it with a minimum chip width of
  88dp [site:/components/chips/guidelines] or a minimum label width of 42dp [site:/components/chips/guidelines].
- Elevation: elevated chips rest at 1dp [token:md.comp.assist-chip.elevated.container.elevation],
  rise to 3dp [token:md.comp.assist-chip.elevated.hover.container.elevation] on hover, and drop to
  0dp [token:md.comp.assist-chip.elevated.disabled.container.elevation] when disabled. A dragged
  chip of any kind rises to 8dp [token:md.comp.assist-chip.dragged.container.elevation].
- Implementation values (not material-web tokens):
  - Compose places 8dp between a chip's elements [impl:compose-material3/commonMain/androidx/compose/material3/Chip.kt:4304].
  - Flutter's default chip padding is 8dp on every side [impl:material_ui/packages/material_ui/lib/src/generated/chip_defaults_m3.g.dart:53].
  - The newer `md.comp.chips` set in Flutter's data gives a filter chip
    16dp [token:md.comp.chips.filter.padding.leading] of side padding and an input chip
    12dp [token:md.comp.chips.input.padding.leading].

## Typography

- All four kinds use label large [token:md.comp.assist-chip.label-text.font]
  [token:md.comp.filter-chip.label-text.font] [token:md.comp.input-chip.label-text.font]
  [token:md.comp.suggestion-chip.label-text.font], the button label style:
  14sp [token:md.sys.typescale.label-large.size].
- Labels stay short and in sentence case; they do not wrap.

## Color roles and state layers

Flat chips (material-web tokens):

| Kind | Container | Outline | Label | Leading icon |
|---|---|---|---|---|
| Assist | none | outline variant [token:md.comp.assist-chip.flat.outline.color] | on surface [token:md.comp.assist-chip.label-text.color] | primary [token:md.comp.assist-chip.with-icon.icon.color] |
| Suggestion | none | outline variant [token:md.comp.suggestion-chip.flat.outline.color] | on surface variant [token:md.comp.suggestion-chip.label-text.color] | primary [token:md.comp.suggestion-chip.with-leading-icon.leading-icon.color] |
| Filter, unselected | none | outline variant [token:md.comp.filter-chip.flat.unselected.outline.color] | on surface variant [token:md.comp.filter-chip.unselected.label-text.color] | primary [token:md.comp.filter-chip.with-leading-icon.unselected.leading-icon.color] |
| Filter, selected | secondary container [token:md.comp.filter-chip.flat.selected.container.color] | none | on secondary container [token:md.comp.filter-chip.selected.label-text.color] | on secondary container [token:md.comp.filter-chip.with-leading-icon.selected.leading-icon.color] |
| Input, unselected | none | outline variant [token:md.comp.input-chip.unselected.outline.color] | on surface variant [token:md.comp.input-chip.unselected.label-text.color] | on surface variant [token:md.comp.input-chip.with-leading-icon.unselected.leading-icon.color] |
| Input, selected | secondary container [token:md.comp.input-chip.selected.container.color] | none | on secondary container [token:md.comp.input-chip.selected.label-text.color] | primary [token:md.comp.input-chip.with-leading-icon.selected.leading-icon.color] |

- Trailing icons: on surface variant when unselected
  [token:md.comp.filter-chip.with-trailing-icon.unselected.trailing-icon.color], on secondary
  container when selected [token:md.comp.filter-chip.with-trailing-icon.selected.trailing-icon.color].
- Elevated chips fill with surface container low [token:md.comp.assist-chip.elevated.container.color];
  a selected elevated filter chip uses secondary container
  [token:md.comp.filter-chip.elevated.selected.container.color].
- The leading icon of an unselected chip may be themed to on surface variant instead of primary
  when a quieter look is wanted.
- Disabled: label and icons on surface at 38% [token:md.comp.assist-chip.disabled.label-text.opacity];
  outline on surface at 12% [token:md.comp.assist-chip.flat.disabled.outline.opacity]; elevated
  or selected containers on surface at 12% [token:md.comp.filter-chip.flat.disabled.selected.container.opacity].

State layers: drawn in the label color over the container, using the standard opacities: hover
8% [token:md.sys.state.hover.state-layer-opacity], focus 10% [token:md.sys.state.focus.state-layer-opacity],
press 10% [token:md.sys.state.pressed.state-layer-opacity], drag 16% [token:md.sys.state.dragged.state-layer-opacity].
The focus ring is 3dp [token:md.comp.assist-chip.focus.indicator.thickness] thick at a
2dp [token:md.comp.assist-chip.focus.indicator.outline.offset] offset.

## Motion

- No chip duration, easing or spring token exists in material-web's data [NOT FOUND]. Code chooses
  the motion:
- Compose:
  - Selectable chips morph between their `ChipShapes` with the fast spatial spring
    [impl:compose-material3/commonMain/androidx/compose/material3/Chip.kt:3312].
  - A leading or trailing icon that appears fades in with the slow effects spring and grows with
    the fast spatial spring [impl:compose-material3/commonMain/androidx/compose/material3/Chip.kt:3280]
    [impl:compose-material3/commonMain/androidx/compose/material3/Chip.kt:3282].
  - One that disappears fades out with the fast effects spring and shrinks with the default
    effects spring [impl:compose-material3/commonMain/androidx/compose/material3/Chip.kt:3281]
    [impl:compose-material3/commonMain/androidx/compose/material3/Chip.kt:3283].
- Flutter:
  - Selection animates over 195ms [impl:material_ui/packages/material_ui/lib/src/chip.dart:44].
  - The check mark draws in over 150ms [impl:material_ui/packages/material_ui/lib/src/chip.dart:45]
    and out over 50ms [impl:material_ui/packages/material_ui/lib/src/chip.dart:46].
- Expanding input chips use the container transform pattern; no chip-level token defines it
  [NOT FOUND].

## Accessibility

- People must be able to reach a chip, activate it, and use it to perform its action with
  assistive technology.
- Contrast: the label needs at least 3:1 against the background. To show that chips are
  interactive, use at least one extra cue:
  - A label before the group (for example "Select type").
  - Page context that implies filtering ("Filter results").
  - The outline role instead of outline variant, for 3:1 edge contrast.
  - An action-style label ("Turn on lights") or a leading icon.
- Semantics: a chip that performs an action exposes button semantics.
  - Names and roles:

    | Chip | Accessible name | Role |
    |---|---|---|
    | One action | the label | button (web: gridcell) |
    | Selectable | the label | checkbox in Compose, radio button in MDC-Android (web: gridcell) |
    | Remove only | "Remove" plus the label | button |
    | Two actions | the label, then "Remove" plus the label | button or checkbox |

  - Images and icons inside a chip are hidden from assistive technology.
- Focus:
  - Every chip is a focus stop.
  - A chip with only a remove action is a single stop.
  - A chip with a main action plus remove has two stops: content, then the remove icon.
- Keyboard:
  - Tab moves to a chip or chip group; arrow keys move between chips.
  - Space or Enter activates, selects or deselects the focused chip. In a multi-select set,
    several chips can be selected this way, but only one has focus.
  - Backspace or Delete removes the focused input chip. On mobile, if removal is the only action,
    the remove icon may be left out because a hardware Delete removes the chip.
- Overflow: when chips do not fit in one row, avoid making people scroll. Either reflow the list
  with a "Show all" filter chip at the start (pushes content down), or open all options in a menu
  from a leading button (keeps the layout still). Do not use the menu approach for chips that have
  a second action.
- Targets: at least 48 × 48dp [site:/components/chips/guidelines]. Do not apply density by
  default; make it opt-in, and keep the controls that undo it at full size.

## Platform mapping

- Jetpack Compose (material3 1.5.0-rc01):
  - `AssistChip`, `ElevatedAssistChip`, `FilterChip`, `ElevatedFilterChip`, `InputChip`,
    `SuggestionChip`, `ElevatedSuggestionChip`.
  - Defaults: `AssistChipDefaults`, `FilterChipDefaults`, `InputChipDefaults`,
    `SuggestionChipDefaults`.
  - Shape-morphing overloads take `ChipShapes` (see Expressive).
- Flutter (`material_ui` 1.11.0):
  - `ActionChip` serves both assist and suggestion chips.
  - `FilterChip`, `ChoiceChip` (single-select filter) and `InputChip`.
  - Each has an `.elevated` constructor except `InputChip`.
- Web: no maintained official component. Our CSS chips are built in Phase 3 from the material-web
  token values above.

## Pitfalls

- Chips used for primary or flow-advancing actions that should be buttons.
- A lone chip, or chips stacked vertically.
- Mixing single-select and multi-select chip sets on one page.
- Elevation used on a plain background, or to show the pressed state.
- Labels over 20 characters, or chips placed next to outlined buttons with no way to tell them
  apart.
- Trailing icons with targets smaller than 48dp [site:/components/chips/guidelines], especially
  on compact windows.
