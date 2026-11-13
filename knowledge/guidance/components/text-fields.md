---
title: Text fields
kind: component
pages: [/components/text-fields/overview, /components/text-fields/specs, /components/text-fields/guidelines, /components/text-fields/accessibility]
tokenSets: [filled-text-field, outlined-text-field]
expressive: false
fetched: 2026-11-13
---

## Summary

A text field is where a person types: names, addresses, passwords, search terms, numbers. M3 has
two styles, filled and outlined. They behave alike and differ only in how strongly the container
stands out, so the choice is a matter of visual style. Every field has a label, and its state
(empty, filled in, focused, in error, disabled) should be readable at a glance. M3 Expressive did
not change text fields.

## Use it when

- The person has to enter free text or a value that is not a short, fixed list: contact details,
  payment data, a message, a quantity.
- Filled: more emphasis. The tinted box makes each field easy to spot.
- Outlined: less emphasis. Suits long forms, where many tinted boxes would look heavy.
- Choose the style that fits the product, serves the screen's goal, and is easiest to tell apart
  from nearby components such as buttons.
- Both styles may appear in one product, but keep each region consistent: one style per form or
  section, never side by side.
- Avoid when:
  - The answer is one of a few known options; use radio buttons, chips, or a menu.
  - The value is a date or a time that benefits from a calendar or dial; pair the field with a
    date or time picker (see `date-pickers.md` and `time-pickers.md`).

## Anatomy

Filled field:

1. Container: a tinted box with rounded top corners and square bottom corners.
2. Leading icon (optional).
3. Label text, resting in the middle when the field is empty.
4. Label text, moved to the top once the field is focused or has content.
5. Trailing icon (optional).
6. Active indicator: the line along the bottom edge; it thickens and takes the primary color on
   focus.
7. Caret.
8. Input text.
9. Supporting text (optional), below the container.

Outlined field: the same parts, except there is no fill and no bottom line. Instead, a stroke runs
all the way around a container with four rounded corners, and it gets thicker and colored on
focus. When the label moves up it sits in a gap cut into the top stroke.

Optional extras on both: prefix and suffix text, a character counter, an error icon, a required
asterisk.

## Variants

- Style: filled or outlined.
- Line behaviour (a property of the field, not a separate component):
  - Single line: long input scrolls sideways inside the field. Not for long answers.
  - Multi-line: starts one line tall and grows downward as text wraps, pushing content below it.
  - Text area: a fixed, taller box that scrolls vertically once full. Its size invites a longer
    answer. On the web, prefer a text area to a growing multi-line field, and keep its height
    within a phone screen.
- Read-only: shows prefilled text that cannot be edited. It keeps the normal styling and says
  plainly that it is read-only.
- Label placement: inside the field (default), or outside it as an adjacent label aligned to the
  container's leading edge. With an adjacent label the field needs no label of its own.

## Expressive

- Text fields did not receive an Expressive update. The guidance and tokens describe the classic
  M3 component only, with no extra sizes, shapes or shape morphs.
- The M3 change from M2 was color only: new color mappings that work with dynamic color.

## States and behavior

- States: enabled, hovered, focused, disabled, and error, each shown empty and populated.
- Label: always visible. On focus or once filled in, it moves from the center of the field to the
  top edge and shrinks. Keep it to one line; never truncate it and never let it wrap.
- Required fields: add an asterisk after the label and explain the convention once, either in
  supporting text or in a note at the top of the form. Mark every required field. If required
  text has its own color, give the asterisk that color too.
- Supporting text: one line ideally (it may wrap). It can be shown always or only on focus.
- Character or word counter: show it whenever there is a limit, as "used / maximum".
- Errors:
  - Replace the supporting text with the error message rather than adding a second line, so the
    layout does not jump.
  - With one possible error, say how to avoid it. With several, describe the most likely one.
  - Long messages may wrap; leave enough space between fields so a two-line error does not push
    other content.
  - Add an error icon. It gives a second cue that does not depend on color.
- Icons are optional. Typical jobs: show an input method (microphone for voice), offer an action
  (clear the field; the clear icon only appears once there is text), flag valid or invalid input,
  open a nested picker (a calendar icon opens a date picker, a dropdown arrow opens a selection
  list), or show an image such as a card brand. Leading and trailing icons swap sides in
  right-to-left layouts.
- Prefix and suffix: short fixed text before or after the input, such as a currency symbol, a unit
  or an email domain.
- Responsive layout: on compact windows a field may span the full width. On medium and expanded
  windows, bound it with flexible margins or a container; a field stretched across a large screen
  is hard to read.
- Density: do not make fields dense by default. Offer a denser layout as a setting, and keep the
  controls that switch it back at full size.

## Measurements

The values are material-web's (canonical) unless a line says otherwise. Every token that differs on
another platform is listed under "Platform differences" with a `[differs:]` marker.

| Property | Filled | Outlined |
|---|---|---|
| Container height | 56dp [site:/components/text-fields/specs] [token:md.comp.filled-text-field.container.height] | 56dp [site:/components/text-fields/specs] [token:md.comp.outlined-text-field.container.height] |
| Corner radius | 4dp, top corners only [token:md.sys.shape.corner.extra-small] [token:md.comp.filled-text-field.container.shape] | 4dp, all corners [token:md.comp.outlined-text-field.container.shape] |
| Bottom line or stroke, resting | 1dp [token:md.comp.filled-text-field.active-indicator.height] | 1dp [token:md.comp.outlined-text-field.outline.width] |
| Bottom line or stroke, hovered | 1dp [token:md.comp.filled-text-field.hover.active-indicator.height] | 1dp [token:md.comp.outlined-text-field.hover.outline.width] |
| Bottom line or stroke, focused | 2dp [token:md.comp.filled-text-field.focus.active-indicator.height] | 3dp [token:md.comp.outlined-text-field.focus.outline.width] |
| Bottom line or stroke, disabled | 1dp [token:md.comp.filled-text-field.disabled.active-indicator.height] | 1dp [token:md.comp.outlined-text-field.disabled.outline.width] |
| Leading and trailing icon | 24dp [token:md.comp.filled-text-field.leading-icon.size] | 24dp [token:md.comp.outlined-text-field.leading-icon.size] |
| Side padding, no icons | 16dp [site:/components/text-fields/specs] | 16dp [site:/components/text-fields/specs] |
| Side padding, with icons | 12dp [site:/components/text-fields/specs] | 12dp [site:/components/text-fields/specs] |
| Gap between icon and text | 16dp [site:/components/text-fields/specs] | 16dp [site:/components/text-fields/specs] |
| Top and bottom padding | 8dp [site:/components/text-fields/specs] | [NOT FOUND] |
| Space above supporting text and counter | 4dp [site:/components/text-fields/specs] | 4dp [site:/components/text-fields/specs] |
| Gap between supporting text and counter | 16dp [site:/components/text-fields/specs] | 16dp [site:/components/text-fields/specs] |
| Side padding of the raised label (in the stroke gap) | not applicable | 4dp [site:/components/text-fields/specs] |
| Touch target | 56dp [site:/components/text-fields/specs] | 56dp [site:/components/text-fields/specs] |

- The container-height tokens are marked deprecated in material-web. They are cited because the
  site's table gives the same height. Treat the height as a minimum: multi-line fields and text
  areas grow taller.
- An image inside a field (for example a card logo) should be 24dp tall [site:/components/text-fields/guidelines],
  the icon size.
- The site gives no top and bottom padding for the outlined field, and no token defines either
  style's paddings, so padding values come only from the site's tables.
- Compose implementation values (not tokens):
  - Horizontal content padding 16dp [impl:compose-material3/commonMain/androidx/compose/material3/internal/TextFieldImpl.kt:2236].
  - Space above supporting text 4dp [impl:compose-material3/commonMain/androidx/compose/material3/internal/TextFieldImpl.kt:2242].
  - Gap between prefix or suffix and the input 2dp [impl:compose-material3/commonMain/androidx/compose/material3/internal/TextFieldImpl.kt:2244].
  - Padding around the label in the outlined stroke gap 4dp [impl:compose-material3/commonMain/androidx/compose/material3/OutlinedTextField.kt:594].
  - Minimum size 56dp tall [impl:compose-material3/commonMain/androidx/compose/material3/TextFieldDefaults.kt:83]
    and 280dp wide [impl:compose-material3/commonMain/androidx/compose/material3/TextFieldDefaults.kt:89].

Platform differences (see `knowledge/conflicts.md`):

- Outlined stroke width when focused [differs:md.comp.outlined-text-field.focus.outline.width]:
  - material-web and Flutter: 3dp [token:md.comp.outlined-text-field.focus.outline.width].
  - Compose: 2dp [token:md.comp.outlined-text-field.focus.outline.width]. Its code defaults are
    2dp as well, for the filled bottom line [impl:compose-material3/commonMain/androidx/compose/material3/TextFieldDefaults.kt:95]
    and the outlined stroke [impl:compose-material3/commonMain/androidx/compose/material3/TextFieldDefaults.kt:1012].
  - The site's specs do not print a focused stroke width, so it does not settle the difference.

## Typography

| Element | Type style | Size / line height |
|---|---|---|
| Input text | body large [token:md.comp.filled-text-field.input-text.font] | 16sp [token:md.sys.typescale.body-large.size] / 24sp [token:md.sys.typescale.body-large.line-height] |
| Label, resting in the field | body large [token:md.comp.filled-text-field.label-text.font] | 16sp [token:md.sys.typescale.body-large.size] |
| Label, raised (focused or populated) | body small size [token:md.comp.filled-text-field.label-text.populated.size] | 12sp [token:md.sys.typescale.body-small.size] / 16sp [token:md.sys.typescale.body-small.line-height] |
| Supporting text, error text, counter | body small [token:md.comp.filled-text-field.supporting-text.font] | 12sp [token:md.sys.typescale.body-small.size] |
| Prefix and suffix | follow the input text style [token:md.comp.filled-text-field.input-text.prefix.color] | [NOT FOUND] |

- The outlined style uses the same type styles (its tokens are the `md.comp.outlined-text-field.*`
  counterparts, for example `md.comp.outlined-text-field.label-text.populated.size`).
- The raised label only changes size and line height; font, weight and tracking stay those of
  body large.
- No token gives prefix or suffix their own type style; material-web defines only their color.

## Color roles and state layers

Filled field, by element and state (material-web tokens):

| Element | Enabled | Hovered | Focused | Error | Disabled |
|---|---|---|---|---|---|
| Container | surface container highest [token:md.comp.filled-text-field.container.color] | plus on surface state layer | surface container highest | surface container highest | on surface at 4% [token:md.comp.filled-text-field.disabled.container.opacity] |
| Bottom line | on surface variant [token:md.comp.filled-text-field.active-indicator.color] | on surface [token:md.comp.filled-text-field.hover.active-indicator.color] | primary [token:md.comp.filled-text-field.focus.active-indicator.color] | error [token:md.comp.filled-text-field.error.active-indicator.color] | on surface at 38% [token:md.comp.filled-text-field.disabled.active-indicator.opacity] |
| Label | on surface variant [token:md.comp.filled-text-field.label-text.color] | on surface variant [token:md.comp.filled-text-field.hover.label-text.color] | primary [token:md.comp.filled-text-field.focus.label-text.color] | error [token:md.comp.filled-text-field.error.label-text.color] | on surface at 38% [token:md.comp.filled-text-field.disabled.label-text.opacity] |
| Input text | on surface [token:md.comp.filled-text-field.input-text.color] | on surface | on surface | on surface [token:md.comp.filled-text-field.error.input-text.color] | on surface at 38% [token:md.comp.filled-text-field.disabled.input-text.opacity] |
| Supporting text | on surface variant [token:md.comp.filled-text-field.supporting-text.color] | on surface variant | on surface variant | error [token:md.comp.filled-text-field.error.supporting-text.color] | on surface at 38% [token:md.comp.filled-text-field.disabled.supporting-text.opacity] |
| Leading icon | on surface variant [token:md.comp.filled-text-field.leading-icon.color] | on surface variant | on surface variant | on surface variant [token:md.comp.filled-text-field.error.leading-icon.color] | on surface at 38% [token:md.comp.filled-text-field.disabled.leading-icon.opacity] |
| Trailing icon | on surface variant [token:md.comp.filled-text-field.trailing-icon.color] | on surface variant | on surface variant | error [token:md.comp.filled-text-field.error.trailing-icon.color] | on surface at 38% [token:md.comp.filled-text-field.disabled.trailing-icon.opacity] |
| Caret | primary [token:md.comp.filled-text-field.caret.color] | primary | primary | error [token:md.comp.filled-text-field.error.focus.caret.color] | none |

Error state, hovered: the bottom line, label and trailing icon turn on error container
[token:md.comp.filled-text-field.error.hover.active-indicator.color]
[token:md.comp.filled-text-field.error.hover.label-text.color]. Focused error keeps error for the
line, label, caret and supporting text [token:md.comp.filled-text-field.error.focus.active-indicator.color].

Outlined field, where it differs from the filled one:

- No container fill. The stroke takes the bottom line's role:
  - Enabled: outline [token:md.comp.outlined-text-field.outline.color].
  - Hovered: on surface [token:md.comp.outlined-text-field.hover.outline.color].
  - Focused: primary [token:md.comp.outlined-text-field.focus.outline.color].
  - Error: error [token:md.comp.outlined-text-field.error.outline.color]; hovered error: on error
    container [token:md.comp.outlined-text-field.error.hover.outline.color].
  - Disabled: on surface at 12% [token:md.comp.outlined-text-field.disabled.outline.opacity].
- The hovered label turns on surface [token:md.comp.outlined-text-field.hover.label-text.color]
  (the filled label stays on surface variant).
- Text, icon and caret roles otherwise follow the filled table, using the
  `md.comp.outlined-text-field.*` tokens.

State layer: only the filled style has one. Hovering lays on surface over the container at
8% [token:md.comp.filled-text-field.hover.state-layer.opacity], also in the error state
[token:md.comp.filled-text-field.error.hover.state-layer.opacity]. Focus and press are shown by the
bottom line, label and caret colors, not by a state layer.

Text and labels placed outside the field (an adjacent label, a form title) use their normal text
roles; the field tokens do not cover them [NOT FOUND].

## Motion

- No text-field duration, easing or spring token exists in any of the three sources [NOT FOUND].
  Text fields have no Expressive shape morph. The movements below are chosen by implementation
  code.
- Compose animates:
  - The label rising and shrinking with the fast spatial spring
    [impl:compose-material3/commonMain/androidx/compose/material3/internal/TextFieldImpl.kt:2037].
  - The bottom line or stroke color with the fast effects spring
    [impl:compose-material3/commonMain/androidx/compose/material3/internal/TextFieldImpl.kt:2125].
  - Its thickness with the fast spatial spring
    [impl:compose-material3/commonMain/androidx/compose/material3/internal/TextFieldImpl.kt:2133].
  - Fast spatial spring values: standard scheme damping 0.9, stiffness 1400; expressive scheme
    damping 0.6, stiffness 800 [token:md.sys.motion.spring.fast.spatial.damping]
    [token:md.sys.motion.spring.fast.spatial.stiffness].
- Flutter moves the label with the fast-out-slow-in curve
  [impl:material_ui/packages/material_ui/lib/src/input_decorator.dart:43] over
  167ms [impl:material_ui/packages/material_ui/lib/src/input_decorator.dart:42]. It fades the
  hover color in over 15ms [impl:material_ui/packages/material_ui/lib/src/input_decorator.dart:207].

## Accessibility

- Assistive technology users must be able to reach the field, type into it, hear its supporting
  and error text, and reach any interactive icon.
- Contrast: the container (filled) or the stroke (outlined) is what shows that a field is there.
  For the outlined style, keep the stroke at 3:1 or more against the background; avoid custom
  colors that drop below it.
- Keyboard: Tab moves focus to the next field that is not disabled.
- Accessible name:
  - It is the visible label. Link the label to the field so screen readers announce the label
    and then the role.
  - For a required field, the asterisk is part of the name.
- Interactive trailing icons get their own name that says what they do, and the name changes with
  the state: a password toggle reads "Show password" while hidden and "Hide password" while
  visible. A purely informative error icon is named "Error".
- Prefix and suffix need their own accessible text with a unique id (for example the currency
  name for a currency symbol).
- Supporting text is announced as the field's description. When an error appears, give the error
  message an alert role so it is spoken immediately. If both supporting and error text exist,
  announce the supporting text first, then the error.
- The counter's accessible text explains what it counts (for example "character count").
- Keep targets at 48 × 48 CSS px or larger [site:/components/text-fields/guidelines]; this is
  why density must stay opt-in.

## Platform mapping

- Jetpack Compose (material3 1.5.0-rc01):
  - `TextField` (filled) and `OutlinedTextField`. Each comes in two forms: a state-based overload
    (`TextFieldState`, `lineLimits`, `inputTransformation`, `outputTransformation`) and the older
    value/`onValueChange` overloads.
  - `SecureTextField` and `OutlinedSecureTextField` for passwords.
  - Slots and parameters: `label`, `placeholder`, `leadingIcon`, `trailingIcon`, `prefix`,
    `suffix`, `supportingText`, `isError`, `readOnly`.
  - The state-based overloads take `labelPosition`: `TextFieldLabelPosition.Inside` (filled
    default), `Cutout` (outlined default) or `Above`, which places the label above the container
    like an adjacent label.
  - `TextFieldDefaults` and `OutlinedTextFieldDefaults` hold colors, `MinHeight`, `MinWidth` and
    the indicator thicknesses.
- Flutter (`material_ui` 1.11.0):
  - `TextField` and `TextFormField`, styled through `InputDecoration`.
  - Filled vs outlined: set `filled` and use an `OutlineInputBorder` for the outlined look.
  - `helperText`, `errorText`, `prefixText`, `suffixText`, `counterText`; `maxLength` adds a
    counter.
  - There are no separate filled and outlined widgets.
- Web: no maintained official component. Our CSS text fields are built in Phase 3 from the
  material-web token values above.

## Pitfalls

- A field without a label, or with the placeholder doing the label's job. A placeholder vanishes
  as soon as the person starts typing.
- Labels that are cut off or run onto two lines.
- Filled and outlined fields mixed inside one form.
- Showing error text under the supporting text instead of replacing it, so the form jumps.
- Signalling an error by color alone, without an error icon or message.
- Adding slashes or other formatting while the person types (input masks). Format after they
  leave the field.
- Fields stretched across a wide screen with fixed margins.
- Dense fields by default, which push targets below the 48 × 48 CSS px [site:/components/text-fields/guidelines]
  minimum.
- Using a single-line field for long answers; use a multi-line field or a text area.
