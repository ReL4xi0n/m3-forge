# Material 3 review checklist

Use it twice: while building (as a recipe) and on the screenshots or the code (as a review). Each
line says what a first-party screen has. Fix anything that does not match before reporting.

## Hierarchy and type

- Each screen has one clear focal point: the headline role or a hero component. Everything else
  steps down. (F10)
- Each text level has a fixed type role: display only for short hero text, headline for screen or
  section titles, title for card and list headers, body for reading text, label for buttons,
  chips, tabs and metadata. One role per level across the whole UI. (F10)
- In M3 Expressive, emphasized roles mark the one or two things that matter most on the screen
  (a key number, the primary headline), not every heading. (F10)
- Numbers people compare (prices, totals, times) share a role and align. (F10)

## Spacing and layout

- One spacing rhythm per region: the same gap between siblings, the same padding inside sibling
  containers. Larger gaps separate groups; smaller gaps join items that belong together. (F9)
- Screen margins and list insets follow the layout reference for the window size class; content
  never touches the screen edge unless it is a full-bleed image or app bar. (F9)
- Lists and cards have a consistent density: one list-item style per list, one card style per
  collection. (F9)
- Large screens reflow (navigation rail or drawer, panes, wider grids) instead of stretching the
  phone layout. (F9)

## Components and character

- Each need uses the M3 component made for it (`references/core/components.md`): a segmented
  button or button group for a few exclusive options, chips for filters, a FAB for the one primary
  action, navigation bar or rail for top-level destinations. (F9)
- Exactly one primary action per screen region carries the strongest emphasis (filled button or
  FAB); others step down (tonal, outlined, text). (F9)
- M3 Expressive shows in shape (larger and contrasting corners, shape morphs on selection),
  emphasized type and spring motion, used where they guide attention. Classic M3 uses none of
  them. (F4, F9)
- Every visible destination (tab, nav item, menu entry) leads to real content, not a stub
  screen. (F9, F11)

## Color and dark mode

- Surfaces use the surface-container roles to show depth; primary, secondary and tertiary
  containers mark emphasis, not decoration. (F2, F5)
- Dark mode comes from the dark scheme alone: no inverted images, no hard-coded overrides, the
  same hierarchy in both themes. (F2, F8)
- Disabled, selected, hovered, focused and pressed states use the state-layer opacities and the
  roles from `references/core/states.md`. (F8, F9)

## Content

- Every string reads like a real product: names, prices, dates, counts and messages are
  plausible together and fit the request's subject and locale. (F11)
- Empty, loading and error states say what happened and what to do next, with one action. (F11)

## Final pass

- Verify reports nothing (errors and the two must-fix warnings). (F1, F2, F3, F4, F5, F6, F7, F8, F11, F12)
- Screenshots in light and dark show nothing clipped, no overflow, no text on a color without
  its on-role, and every touch target at least 48 dp. (F6, F8, F9)
