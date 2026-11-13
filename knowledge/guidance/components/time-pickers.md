---
title: Time pickers
kind: component
pages: [/components/time-pickers/overview, /components/time-pickers/specs, /components/time-pickers/guidelines, /components/time-pickers/accessibility]
tokenSets: [time-picker, time-input]
expressive: false
fetched: 2026-11-13
---

## Summary

A time picker lets people set a time of day: hours, minutes, and AM or PM on a 12-hour clock. It
is modal: it opens in a dialog above a scrim and keeps focus until the person confirms or cancels.
M3 has two variants: the dial, which mimics a clock face, and the input, which takes typed hours
and minutes. People can switch between them at any time.

## Use it when

- A specific clock time is needed: setting an alarm, scheduling a meeting, choosing a reminder.
- Dial: touch screens, where tapping or dragging around a clock face is quick.
- Input: keyboard users, or any screen too small to show the dial without scrolling. It can be the
  default view when a dial adds nothing.
- Avoid when:
  - The value needs fine precision such as seconds or milliseconds (a stopwatch).
  - The time is part of a date and time range that a dedicated scheduling UI handles better.

## Anatomy

Dial variant:

1. Container (dialog surface).
2. Headline label ("Select time").
3. Time selectors: hour and minute boxes with a separator between them.
4. Period selector (AM/PM), only for 12-hour time; it has an outline, and the selected half is
   filled.
5. Clock dial: the round face with number labels.
6. Dial selector: a handle on the chosen number, a track from the center, and a center dot.
7. Icon button (keyboard) to switch to input.
8. Text buttons: Cancel and OK.

Input variant: the same container, headline, period selector, icon button (clock) and text
buttons. Hour and minute are text fields with a separator and a label underneath each.

## Variants

- Dial or input.
- 12-hour or 24-hour time. The format comes from system settings, outside the picker.
  - 12-hour: all numbers sit on the outer ring of the dial, and the AM/PM selector appears.
  - 24-hour: even hours on an inner ring and odd hours on the outer ring. No AM/PM selector; the
    hour box is wider.
- Layout: vertical (default on phones) or horizontal. In landscape the time selectors and the dial
  sit side by side.

## Expressive

- The site describes no Expressive update for time pickers.
- Compose 1.5.0-rc01 goes further than the site:
  - Its code adds "vibrant" versions, tagged as Expressive: `TimePicker` and `TimeInput`
    overloads that take `TimePickerShapes` and default to `TimePickerDefaults.vibrantColors()`.
  - A scrolling picker, `TimeScroll`, with two scroll fields for hours and minutes.
  - A matching `VibrantTimePickerDialog`.
  - The site has no guidance or tokens for these; treat them as a Compose option, not the
    documented default.
- The M3 change from M2 was new color mappings that work with dynamic color.

## States and behavior

- Interactive parts (time selectors, period selector, dial numbers, input fields) have enabled,
  hovered, focused and pressed states.
- Dial: tap a number or drag the selector around the dial. Picking the hour can move straight on
  to minutes.
- The dial and the time selectors stay in sync. People can type in the fields or adjust the dial,
  and each updates the other.
- The input selector differs from an ordinary text field:
  - The active field is highlighted.
  - Its shape, size and font are larger.
  - The label sits below the field.
- Switching: the keyboard icon opens the input view; the clock icon returns to the dial. The input
  view should be reachable from every mobile time picker.
- Opening and closing:
  - The picker uses the dialog enter and exit pattern.
  - OK confirms; Cancel or a tap outside dismisses.
  - It keeps focus until one of these happens.
- Fit: the picker must never be clipped or need scrolling, and it does not scroll with the page
  behind it.
  - When height is short, switch to the horizontal layout.
  - If even that would scroll, fall back to the input variant.
  - Do not shrink the dial with higher density; use the input variant instead.

## Measurements

The values are material-web's (canonical). No token cited below differs on another platform; the
linter checks this, and a difference would need a `[differs:]` marker.

| Element | Property | Value |
|---|---|---|
| Container | Padding, all sides | 24dp [site:/components/time-pickers/specs] |
| Container | Corner radius | 28dp [token:md.comp.time-picker.container.shape] |
| Container | Elevation | 6dp [token:md.comp.time-picker.container.elevation] |
| Time selector (dial) | Width × height | 96dp [site:/components/time-pickers/specs] [token:md.comp.time-picker.time-selector.container.width] × 80dp [site:/components/time-pickers/specs] [token:md.comp.time-picker.time-selector.container.height] |
| Time selector (dial) | Width, 24-hour vertical | 114dp [site:/components/time-pickers/specs] [token:md.comp.time-picker.time-selector.24h-vertical.container.width] |
| Time selector (dial) | Corner radius | 8dp [token:md.comp.time-picker.time-selector.container.shape] |
| Period selector (dial) | Vertical layout | 52dp [site:/components/time-pickers/specs] [token:md.comp.time-picker.period-selector.vertical.container.width] × 80dp [site:/components/time-pickers/specs] [token:md.comp.time-picker.period-selector.vertical.container.height] |
| Period selector (dial) | Horizontal layout | 216dp [site:/components/time-pickers/specs] [token:md.comp.time-picker.period-selector.horizontal.container.width] × 38dp [site:/components/time-pickers/specs] [token:md.comp.time-picker.period-selector.horizontal.container.height] |
| Period selector | Outline width / corner radius | 1dp [token:md.comp.time-picker.period-selector.outline.width] / 8dp [token:md.comp.time-picker.period-selector.container.shape] |
| Clock dial | Diameter | 256dp [site:/components/time-pickers/specs] [token:md.comp.time-picker.clock-dial.container.size] |
| Dial selector handle | Diameter | 48dp [site:/components/time-pickers/specs] [token:md.comp.time-picker.clock-dial.selector.handle.container.size] |
| Dial selector center | Diameter | 8dp [site:/components/time-pickers/specs] [token:md.comp.time-picker.clock-dial.selector.center.container.size] |
| Dial selector track | Width | 2dp [site:/components/time-pickers/specs] [token:md.comp.time-picker.clock-dial.selector.track.container.width] |
| Input field | Width × height | 96dp [site:/components/time-pickers/specs] [token:md.comp.time-input.time-input-field.container.width] × 72dp [site:/components/time-pickers/specs] [token:md.comp.time-input.time-input-field.container.height] |
| Input field | Corner radius / focused outline | 8dp [token:md.comp.time-input.time-input-field.container.shape] / 2dp [token:md.comp.time-input.time-input-field.focus.outline.width] |
| Period selector (input) | Width × height | 52dp [site:/components/time-pickers/specs] [token:md.comp.time-input.period-selector.container.width] × 72dp [site:/components/time-pickers/specs] [token:md.comp.time-input.period-selector.container.height] |

- The container's width and height are dynamic; the headline is start-aligned.
- Compose stores the input-field values under its own names (`time-field-container-width`,
  `time-field-container-height`, `time-field-focus-outline-width`), for example
  96dp [token:md.comp.time-input.time-field-container-width].

## Typography

| Element | Type style |
|---|---|
| Headline | label medium [token:md.comp.time-picker.headline.font], 12sp [token:md.sys.typescale.label-medium.size] |
| Time selector digits (dial) | display large [token:md.comp.time-picker.time-selector.label-text.font], 57sp [token:md.sys.typescale.display-large.size] |
| Separator | display large [token:md.comp.time-picker.time-selector.separator.font] |
| Input field digits | display medium [token:md.comp.time-input.time-input-field.label-text.font], 45sp [token:md.sys.typescale.display-medium.size] |
| Input field label (below) | body small [token:md.comp.time-input.time-input-field.supporting-text.font] |
| Period selector | title medium [token:md.comp.time-picker.period-selector.label-text.font], 16sp [token:md.sys.typescale.title-medium.size] |
| Dial numbers | body large [token:md.comp.time-picker.clock-dial.label-text.font] |

## Color roles and state layers

| Element | Unselected | Selected |
|---|---|---|
| Time selector | surface container highest [token:md.comp.time-picker.time-selector.unselected.container.color], on surface digits [token:md.comp.time-picker.time-selector.unselected.label-text.color] | primary container [token:md.comp.time-picker.time-selector.selected.container.color], on primary container digits [token:md.comp.time-picker.time-selector.selected.label-text.color] |
| Period selector | no fill, on surface variant text [token:md.comp.time-picker.period-selector.unselected.label-text.color], outline border [token:md.comp.time-picker.period-selector.outline.color] | tertiary container [token:md.comp.time-picker.period-selector.selected.container.color], on tertiary container text [token:md.comp.time-picker.period-selector.selected.label-text.color] |
| Dial numbers | on surface [token:md.comp.time-picker.clock-dial.unselected.label-text.color] | on primary [token:md.comp.time-picker.clock-dial.selected.label-text.color] |

- Container: surface container high [token:md.comp.time-picker.container.color]; headline on
  surface variant [token:md.comp.time-picker.headline.color].
- Clock dial face: surface container highest [token:md.comp.time-picker.clock-dial.color].
- Dial selector handle, track and center dot: primary [token:md.comp.time-picker.clock-dial.selector.handle.container.color]
  [token:md.comp.time-picker.clock-dial.selector.track.container.color]
  [token:md.comp.time-picker.clock-dial.selector.center.container.color].
- Input fields:
  - Resting: surface container highest [token:md.comp.time-input.time-input-field.container.color]
    with on surface digits [token:md.comp.time-input.time-input-field.label-text.color].
  - Focused: primary container [token:md.comp.time-input.time-input-field.focus.container.color],
    on primary container digits, and a primary outline [token:md.comp.time-input.time-input-field.focus.outline.color].
  - Labels below the fields: on surface variant [token:md.comp.time-input.time-input-field.supporting-text.color].
- State layers use the content color of the element: hover
  8% [token:md.comp.time-picker.time-selector.hover.state-layer.opacity], focus
  10% [token:md.comp.time-picker.time-selector.focus.state-layer.opacity], press
  10% [token:md.comp.time-picker.time-selector.pressed.state-layer.opacity]. The selected period
  selector's layer is on tertiary container [token:md.comp.time-picker.period-selector.selected.hover.state-layer.color].
- Text and icon buttons follow buttons.md#color-roles-and-state-layers.

## Motion

- No time-picker duration, easing or spring token exists in the three sources [NOT FOUND]. The
  picker opens and closes with the dialog pattern. Code chooses the rest:
- Compose:
  - The dial selector moves with the default spatial spring
    [impl:compose-material3/commonMain/androidx/compose/material3/TimePicker.kt:3293].
  - The dial cross-fades between hour and minute numbers with the default effects spring
    [impl:compose-material3/commonMain/androidx/compose/material3/TimePicker.kt:3299].
- Flutter:
  - The dial hand animates over 200ms [impl:material_ui/packages/material_ui/lib/src/time_picker.dart:46].
  - The dialog resizes over 200ms [impl:material_ui/packages/material_ui/lib/src/time_picker.dart:45]
    when switching between dial and input.

## Accessibility

- People must be able to pick or type hours and minutes (and seconds where relevant), use either
  12-hour or 24-hour time, and enter the time without the dial.
- Always offer typed input. It helps keyboard users, and on small screens the input variant can be
  shown alone. (MDC-Android always shows the dial.)
- Keyboard: Tab moves to the next time element that is not disabled; Space or Enter activates it.
- Screen readers: the hour and minute fields have the text-input role and are announced role
  first, then the label. Dial positions are announced in context, such as "7 hours of 12".
- Names and roles:

  | Element | Accessible name | Role (web and Compose) | Role (MDC-Android) |
  |---|---|---|---|
  | Hour field | Hour | text input | – |
  | Minute field | Minute | text input | – |
  | AM/PM | AM or PM | radio button in a list | checkbox in a list |
  | Keyboard icon | Toggle input picker | button | button |
  | Clock icon | Toggle dial picker | button | button |
  | Cancel, OK | Cancel, OK | button | button |
  | Dial number | "{value} hours (or minutes) of {total}" | button | – |

- Targets: dial targets are 48 × 48dp [site:/components/time-pickers/accessibility].

## Platform mapping

- Jetpack Compose (material3 1.5.0-rc01):
  - `TimePicker` (dial) and `TimeInput`, both driven by `rememberTimePickerState`.
  - `TimePickerLayoutType` chooses vertical or horizontal; `TimePickerDefaults.layoutType()`
    picks one from the window.
  - `TimePickerDialog` with `TimePickerDialogDefaults` hosts them.
  - Expressive extras: `TimeScroll`, `VibrantTimePickerDialog`, and the `shapes` overloads (see
    Expressive).
- Flutter (`material_ui` 1.11.0): `showTimePicker` and `TimePickerDialog`, with
  `TimePickerEntryMode` (dial, input, or either one only) setting the initial and allowed views.
- Web: no maintained official component, and the site lists web as unavailable. The material-web
  token values above are the reference for any web build.

## Pitfalls

- A dial-only picker with no typed entry.
- A dial squeezed with higher density, or a picker that scrolls or is clipped; switch layout or
  fall back to the input variant.
- Showing the AM/PM selector for 24-hour users.
- Using a time picker for sub-second precision.
- Mixing up the selected colors: time selectors use primary container, the period selector uses
  tertiary container.
