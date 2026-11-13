---
title: Date pickers
kind: component
pages: [/components/date-pickers/overview, /components/date-pickers/specs, /components/date-pickers/guidelines, /components/date-pickers/accessibility]
tokenSets: [date-picker.docked, date-picker.modal, date-input.modal]
expressive: false
fetched: 2026-11-13
---

## Summary

A date picker lets people choose one date or a range of dates. M3 has three variants: the docked
date picker (a text field with a calendar that drops down under it), the modal date picker (a
calendar in a dialog), and the modal date input (typed entry in a dialog). Important dates, such
as today and the current selection, stand out, and the layout follows the familiar month grid.

## Use it when

- People must pick a specific date or a span of dates: booking a flight, reserving a hotel,
  scheduling an event.
- Choose the variant by window size and by how far away the date is likely to be:
  - Docked: medium and expanded windows (tablet, desktop). Good for dates both near and far,
    since people can type the date or browse the calendar.
  - Modal date picker: compact windows such as phones, where a dialog (or a full-screen dialog)
    gives bigger targets. Good for nearby dates.
  - Modal date input: when no calendar view is needed. It can be the default view.
- Avoid when:
  - The date is far in the past or future (a date of birth); the modal calendar needs a lot of
    scrolling. Use the modal input or the docked picker.
  - A plain text field with a clear format hint is enough, as in many forms.

## Anatomy

Docked date picker:

1. Outlined text field with a calendar icon button.
2. Menu buttons for month and year, with previous/next icon buttons beside them.
3. Weekday labels and the date grid (today's date, unselected dates, the selected date, dates
   outside the current month).
4. Text buttons (for example Cancel and OK).
5. Container.
6. Month or year menu: a list that replaces the grid, with the current item marked.

Modal date picker:

1. Headline (the selected date) and supporting text (for example "Select date").
2. Icon button to switch to text input.
3. Month and year control, previous/next month buttons.
4. Weekday labels and date grid, or the year grid when choosing a year.
5. Divider and text buttons.
6. Container.
7. For ranges: a full-screen layout with a close button, a Save button, month labels as
   subheads, and the in-range band joining the start and end dates.

Modal date input: headline, supporting text, an icon button back to the calendar, the date field
(or start and end fields), a divider, text buttons and the container.

## Variants

- Docked date picker: single date; day, month and year selection views.
- Modal date picker: single date or date range; full screen is recommended on compact windows.
- Modal date input: single date or date range.
- People can switch between the modal picker and the modal input with the edit (pencil) and
  calendar icons.

## Expressive

- Date pickers did not receive an Expressive update.
- The M3 changes from M2:
  - The variants were renamed so they do not imply a device: desktop became docked; mobile
    picker and date input became modal picker and modal input.
  - Larger titles and labels with more spacing, sized for 48dp [site:/components/date-pickers/overview]
    targets.
  - No drop shadow.
  - New color mappings that work with dynamic color.

## States and behavior

- Date and year cells have enabled, hovered, focused, pressed and disabled states, each for
  selected and unselected.
- Selection is shown with color: the chosen date is filled, today's date has an outline. In a
  range, the start and end dates are filled and the days between share a lighter band.
- Docked picker:
  - Opens directly below its field when the field is tapped.
  - Typing and the calendar work side by side; either can be used.
  - Month and year can be stepped with arrows or picked from a menu that replaces the grid.
  - Its size adjusts to the content.
- Modal picker navigation:
  - Single date: swipe sideways for months, tap the year to open a scrolling year list.
  - Range: scroll vertically through months, tap the start date and then the end date.
- Leaving:
  - Modal pickers enter and exit with the dialog transition pattern.
  - They close with OK (confirm), Cancel (dismiss), or a tap outside the dialog; until then they
    keep focus.
  - Full-screen pickers add a close (X) button and a Save action.
- Layout: date pickers keep a fixed size. Do not scale them up for larger windows.

## Measurements

The values are material-web's (canonical). Every token that differs on another platform is listed
under "Platform differences" with a `[differs:]` marker.

| Property | Docked | Modal picker | Modal input |
|---|---|---|---|
| Container width | 360dp [token:md.comp.date-picker.docked.container.width] | 360dp [token:md.comp.date-picker.modal.container.width] | 328dp [token:md.comp.date-input.modal.container.width] |
| Container height | 456dp [token:md.comp.date-picker.docked.container.height] | 524dp [token:md.comp.date-picker.modal.container.height] | 512dp [token:md.comp.date-input.modal.container.height] |
| Corner radius | 16dp [token:md.comp.date-picker.docked.container.shape] | 28dp [token:md.comp.date-picker.modal.container.shape] | 28dp [token:md.comp.date-input.modal.container.shape] |
| Elevation | 6dp [token:md.comp.date-picker.docked.container.elevation] | 6dp [token:md.comp.date-picker.modal.container.elevation] | 6dp [token:md.comp.date-input.modal.container.elevation] |
| Header height | 64dp [token:md.comp.date-picker.docked.header.height] | 120dp [token:md.comp.date-picker.modal.header.container.height] | 120dp [token:md.comp.date-input.modal.header.container.height] |
| Date cell | 48dp [token:md.comp.date-picker.docked.date.container.width] | 40dp [token:md.comp.date-picker.modal.date.container.width] | not applicable |
| Date state layer | 40dp [token:md.comp.date-picker.docked.date.state-layer.width] | 40dp [token:md.comp.date-picker.modal.date.state-layer.width] | not applicable |
| Today's outline | 1dp [token:md.comp.date-picker.docked.date.today.container.outline.width] | 1dp [token:md.comp.date-picker.modal.date.today.container.outline.width] | not applicable |

- Date cells are square and fully round; the table gives the width, and the height is equal
  [token:md.comp.date-picker.docked.date.container.height] [token:md.comp.date-picker.modal.date.container.height].
- Docked menus: menu buttons 40dp [token:md.comp.date-picker.docked.menu-button.container.height]
  tall with an 18dp [token:md.comp.date-picker.docked.menu-button.icon.size] icon. Menu list items
  are 48dp [token:md.comp.date-picker.docked.menu.list-item.container.height] tall; the selected
  item has a 24dp [token:md.comp.date-picker.docked.menu.list-item.selected.leading-icon.size]
  check icon.
- Modal year grid: each year cell is 72dp [token:md.comp.date-picker.modal.year-selection.year.container.width]
  by 36dp [token:md.comp.date-picker.modal.year-selection.year.container.height].
- Range selection:
  - Header 128dp [token:md.comp.date-picker.modal.range-selection.header.container.height] tall.
  - Band behind in-range days 40dp [token:md.comp.date-picker.modal.range-selection.active-indicator.container.height]
    tall.
  - The full-screen container has square corners [token:md.comp.date-picker.modal.range-selection.container.shape]
    and no elevation [token:md.comp.date-picker.modal.range-selection.container.elevation].
- Touch targets: every interactive element is at least 48 × 48dp [site:/components/date-pickers/accessibility].
- The specs page shows its paddings only inside images, without printed labels, so paddings are
  [NOT FOUND].

Platform differences (see `knowledge/conflicts.md`):

- Modal picker height [differs:md.comp.date-picker.modal.container.height]:
  - material-web and Flutter: 524dp [token:md.comp.date-picker.modal.container.height].
  - Compose: 568dp [token:md.comp.date-picker.modal.container.height].
- Modal input container color [differs:md.comp.date-input.modal.container.color]: surface
  container high on material-web and Flutter, surface on Compose.
- Compose has no docked tokens; the `md.comp.date-picker.docked.*` ids show as NOT FOUND for it
  (`knowledge/not-found.md`).

## Typography

| Element | Type style |
|---|---|
| Modal headline (selected date) | headline large [token:md.comp.date-picker.modal.header.headline.font], 32sp [token:md.sys.typescale.headline-large.size] |
| Range headline | title large [token:md.comp.date-picker.modal.range-selection.header.headline.font], 22sp [token:md.sys.typescale.title-large.size] |
| Header supporting text | label large [token:md.comp.date-picker.modal.header.supporting-text.font] |
| Weekday labels | body large [token:md.comp.date-picker.modal.weekdays.label-text.font] |
| Dates | body large [token:md.comp.date-picker.modal.date.label-text.font], 16sp [token:md.sys.typescale.body-large.size] |
| Month subhead (range) | title small [token:md.comp.date-picker.modal.range-selection.month.subhead.font] |
| Years | body large [token:md.comp.date-picker.modal.year-selection.year.label-text.font] |
| Docked menu buttons | label large [token:md.comp.date-picker.docked.menu-button.label-text.font] |
| Docked menu items | body large [token:md.comp.date-picker.docked.menu.list-item.label-text.font] |
| Modal input headline | headline large [token:md.comp.date-input.modal.header.headline.font] |

## Color roles and state layers

- Container: surface container high [token:md.comp.date-picker.modal.container.color]
  [token:md.comp.date-picker.docked.container.color].
- Headline and supporting text: on surface variant [token:md.comp.date-picker.modal.header.headline.color].
- Weekday labels and unselected dates: on surface [token:md.comp.date-picker.modal.weekdays.label-text.color]
  [token:md.comp.date-picker.modal.date.unselected.label-text.color].
- Selected date: primary [token:md.comp.date-picker.modal.date.selected.container.color] with on
  primary text [token:md.comp.date-picker.modal.date.selected.label-text.color].
- Today: primary outline [token:md.comp.date-picker.modal.date.today.container.outline.color] and
  primary text [token:md.comp.date-picker.modal.date.today.label-text.color].
- Docked: dates from other months are on surface at 38% [token:md.comp.date-picker.docked.date.unselected.outside-month.label-text.opacity].
  The selected menu item sits on surface variant [token:md.comp.date-picker.docked.menu.list-item.selected.container.color].
- Range: the in-range band is secondary container [token:md.comp.date-picker.modal.range-selection.active-indicator.container.color]
  and in-range dates use on secondary container [token:md.comp.date-picker.modal.range-selection.date.in-range.label-text.color].
  The month subhead is on surface variant [token:md.comp.date-picker.modal.range-selection.month.subhead.color].
- Years: selected is primary with on primary text [token:md.comp.date-picker.modal.year-selection.year.selected.container.color];
  unselected text is on surface variant [token:md.comp.date-picker.modal.year-selection.year.unselected.label-text.color].
- Dates must keep at least 4.5:1 contrast with their background.
- State layers: date and year cells use the standard opacities, drawn in the cell's content color:
  hover 8% [token:md.sys.state.hover.state-layer-opacity], focus 10% [token:md.sys.state.focus.state-layer-opacity],
  press 10% [token:md.sys.state.pressed.state-layer-opacity].
- The text field, buttons and menu inside the picker follow their own notes; see
  text-fields.md#color-roles-and-state-layers and buttons.md#color-roles-and-state-layers.

## Motion

- No date-picker duration, easing or spring token exists in the three sources [NOT FOUND]. Modal
  pickers use the dialog enter and exit pattern. Code chooses the rest:
- Compose:
  - Switching between calendar and text input cross-fades. The incoming view fades in with the
    default effects spring and the outgoing one fades out with the fast effects spring
    [impl:compose-material3/commonMain/androidx/compose/material3/DatePicker.kt:1490]
    [impl:compose-material3/commonMain/androidx/compose/material3/DatePicker.kt:1492].
  - The views slide and resize with the default spatial spring
    [impl:compose-material3/commonMain/androidx/compose/material3/DatePicker.kt:1494].
  - Date colors change with the default effects spring
    [impl:compose-material3/commonMain/androidx/compose/material3/DatePicker.kt:983].
- Flutter:
  - Month paging takes 200ms [impl:material_ui/packages/material_ui/lib/src/calendar_date_picker.dart:29]
    with an ease curve [impl:material_ui/packages/material_ui/lib/src/calendar_date_picker.dart:831].
  - The dialog resizes over 200ms [impl:material_ui/packages/material_ui/lib/src/date_picker.dart:52]
    when switching between calendar and input.

## Accessibility

- Always allow typing the date. Assistive technology users must not be forced through the
  calendar.
  - Docked: the text field accepts input directly.
  - Modal: the edit icon switches to input.
- Docked date entry:
  - The calendar icon is the only way to open the calendar, so keyboard and screen reader users
    can skip it entirely.
  - Field and icon are separate tab stops.
- Formatting:
  - Format the date after the person presses Enter or leaves the field. Do not insert slashes
    while they type, since screen reader users then hear something other than what they typed.
  - Accept many formats: dashes, spaces, slashes, dots, with or without leading zeros.
- Remove the Clear button if the use case does not need it, to save a tab stop.
- Tooltips:
  - Interactive controls (previous year, next month) show a tooltip on focus that names the
    action and its keyboard shortcut. Include the shortcut in the accessible hint.
  - Weekday abbreviations are not focusable; their tooltip appears on hover only.
- Keyboard:
  - Enter confirms and closes the calendar.
  - Page Up / Page Down: same day in the previous / next month.
  - Shift + Page Up / Page Down: same day in the previous / next year.
  - Home / End: first or last day of the month.
  - Shift+M opens the month list; Shift+Y opens the year list.
- Labels and roles:
  - The field's accessible name says what the date is for (event date, check-in date) and fits
    the placeholder.
  - Helper text gives the expected format (MM/DD/YYYY by default) and acts as the field's
    description.
  - Previous/next and month/year controls are buttons named by their label.
  - Weekday labels are column headers; the month is a grid.
  - Each date announces the full date ("Monday, August 17"), not only the day number.
- Targets: 48 × 48dp [site:/components/date-pickers/accessibility] for every interactive element.
  Do not increase density.

## Platform mapping

- Jetpack Compose (material3 1.5.0-rc01):
  - `DatePicker` with `rememberDatePickerState`; `DisplayMode.Picker` and `DisplayMode.Input`
    switch between calendar and typed entry.
  - `DateRangePicker` with `rememberDateRangePickerState`.
  - `DatePickerDialog` hosts either picker in a dialog. `DatePickerDefaults` and
    `DateRangePickerDefaults` hold colors and formatting.
  - There is no docked date picker composable. Build a docked layout from a text field and a
    `DatePicker` shown in a popup.
- Flutter (`material_ui` 1.11.0):
  - `showDatePicker` and `DatePickerDialog` with `DatePickerEntryMode` (calendar, input, or
    either only).
  - `showDateRangePicker` and `DateRangePickerDialog`.
  - `CalendarDatePicker` is an inline calendar and the base for a docked layout;
    `InputDatePickerFormField` is a typed date field.
- Web: no maintained official component, and the site lists web as unavailable. The material-web
  token values above are the reference for any web build.

## Pitfalls

- A modal calendar for a date of birth or another distant date.
- No way to type the date.
- Input masks that rewrite text while the person types.
- Scaling the picker up on large screens instead of keeping its fixed size.
- Relying on color alone for today versus the selected date; today also gets an outline.
- Extra actions (Clear) that add tab stops without being needed.
- Increasing density so targets drop below 48dp [site:/components/date-pickers/accessibility].
