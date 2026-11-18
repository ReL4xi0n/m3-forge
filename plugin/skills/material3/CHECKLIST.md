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
- Each text level follows the hierarchy recipe for the screen type (`references/core/typography.md`):
  neighboring levels differ in two of size, weight and color, so a price or total never looks like
  the name beside it. Numbers people compare share a role and align. (F10)

## Spacing and layout

- One spacing rhythm per region: the same gap between siblings, the same padding inside sibling
  containers. Larger gaps separate groups; smaller gaps join items that belong together. (F9)
- Screen margins and list insets follow the layout reference for the window size class; content
  never touches the screen edge unless it is a full-bleed image or app bar. (F9)
- Lists and cards have a consistent density: one list-item style per list, one card style per
  collection. (F9)
- Large screens reflow (navigation rail or drawer, panes, wider grids) instead of stretching the
  phone layout. (F9)
- The layout is the canonical one for what the screen does (`references/core/layout.md`: feed,
  list-detail, supporting pane or single pane), chosen before building. Panes run to the bottom of
  the window and grids fill their pane: no blank column and no pane ending halfway beside a long
  one. (F9)
- Placement, grouping, spacing rhythm and emphasis follow `references/core/composition.md`: groups
  sit in containers, three spacing distances, one filled element per view. (F9)
- On compact widths, secondary controls (filters, sort, options) sit in a chip row or open in a
  bottom sheet; they do not push the main content below the first screen. (F9)
- Fields and labels are wide enough for their realistic content: no clipped values. (F9)
- Fixed and floating elements (app bars, bottom bars, FABs, sticky totals) reserve their own
  space: the scrolling content has matching padding, so nothing is covered at any width. (F9)
- Text never collides: titles, avatars and trailing actions sit in separate slots; metadata fits
  on one line at its role or moves to its own line. (F9, F10)

## Components and character

- Each need uses the M3 component made for it (`references/core/components.md`): a segmented
  button or button group for a few exclusive options, chips for filters, a FAB for the one primary
  action, navigation bar or rail for top-level destinations. (F9)
- Exactly one primary action per screen region carries the strongest emphasis (filled button or
  FAB); others step down (tonal, outlined, text). (F9)
- Each action appears once per view: no second toolbar or summary panel repeating the same
  buttons. (F9)
- Everything the request names is visible in the delivered UI without interaction: a requested
  panel, player, picker, badge, empty or error state is rendered (inline, docked, or as its own
  clearly labelled screen or section), not only reachable behind a tap. (F9)
- Selection is always shown: filters, chips, tabs, segmented buttons and list items display
  their selected state when one is active. (F9)
- M3 Expressive cards, sheets and hero containers use the large to extra-extra-large corner
  steps; small corners are for small controls. (F4)
- M3 Expressive shows in shape (larger and contrasting corners, shape morphs on selection),
  emphasized type and spring motion, used where they guide attention. Classic M3 uses none of
  them. (F4, F9)
- The requested screen is complete; every other visible destination (tab, nav item, menu entry)
  opens a simple but credible screen with real content, never a blank or "coming soon" page.
  (F9, F11)

## Color and dark mode

- Surfaces use the surface-container roles to show depth; primary, secondary and tertiary
  containers mark emphasis, not decoration. (F2, F5)
- Alerts, warnings and late or overdue states use `error-container` with `on-error-container`; a
  full `error` fill is only for small badges. (F2, F9)
- Tertiary is one contrasting accent per view; avatars, chips, placeholders and status badges use
  primary, secondary, error or surface-container roles. (F2)
- Picture placeholders and decorative shapes in one collection all use the same container role,
  and only theme-changing roles (never `*-fixed`), so they darken with the dark scheme. (F2, F8)
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
- Every icon-only button has an accessible label. (W)
- Screenshots in light and dark show nothing clipped, no overflow, no text on a color without
  its on-role, and every touch target at least 48 dp. (F6, F8, F9)
