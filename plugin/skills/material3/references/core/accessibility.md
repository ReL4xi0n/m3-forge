# Accessibility

Ship nothing that fails these. `scripts/verify` checks contrast and touch targets at runtime; the
rest is on you.

## Contrast

- Small text: 4.5:1 against its background. Large text and meaningful graphics (icons, field
  outlines, selected indicators): 3:1. Large means 14 pt bold or 18 pt regular and up [site:/foundations/designing/color-contrast].
- Get contrast from role pairs: text and icons use the on role of the fill under them (color.md).
  Role pairs keep contrast in light, dark, medium and high contrast; ad-hoc pairs do not.
- `outline` marks boundaries people must see (text fields); `outlineVariant` is decoration only.
- A row of controls (button group, chips) needs each container to reach 3:1 against the
  background, or a 3:1 outline.
- Disabled controls are exempt. Never lower opacity to style enabled secondary text.
- Text over images: put it on a role-colored container or under a `scrim` layer, never directly on
  a photo.

## Targets and size

- Every interactive element has a target of at least 48 × 48dp [site:/foundations/layout/grids-spacing/density]
  (CSS px on the web), even when the visible part is smaller: small icon buttons, extra-small
  buttons, chips, checkboxes. Grow the target with padding or a minimum size, not the visible
  shape.
- Keep targets apart so neighbors do not overlap.
- Text grows to 200% [site:/foundations/writing/text-resizing] without clipping, overlap or lost
  content (typography.md).

## Labels and semantics

- Every icon-only control has an accessible name that says what it does ("Search", not
  "magnifying glass"): web `aria-label`, Flutter `tooltip:` or `Semantics(label:)`, Compose
  `contentDescription`.
- Decorative icons and images are hidden: web `aria-hidden="true"` / `alt=""`, Flutter
  `ExcludeSemantics`, Compose `contentDescription = null`.
- Never put the role in the name ("Save button") or start alt text with "image of".
- Use native elements and Material components: `<button>`, `<a href>`, `<input>`, `<label>`,
  `<dialog>`; Flutter and Compose Material widgets. A clickable `<div>` is a bug.
- Web landmarks: one `header` (banner), `nav` per navigation set (labelled when there are several),
  one `main`, `footer`. One `h1`, heading levels without gaps.
- Form fields have a visible label, not only a placeholder. Errors say what went wrong and how to
  fix it, in text, next to the field, linked with `aria-describedby` on the web.
- Status that changes on its own (snackbar, counters, loading done) is announced: web
  `role="status"` / `aria-live="polite"`, Flutter `SemanticsService.announce` or live regions,
  Compose `liveRegion` semantics.

## Color is never the only cue

- Selection, errors, status and chart series also differ by icon, text, shape or pattern.
- Selected toggles change icon fill and shape as well as color.

## Keyboard and focus

- Every journey works with Tab, Shift+Tab, arrows, Enter, Space and Escape.
- Focus is always visible: state layer plus, on the web, the focus ring (states.md).
- Opening a dialog or modal sheet moves focus into it and makes the rest inert; closing returns
  focus to the trigger.
- A dense group (tabs, segmented choices, menu items) is one tab stop with arrow-key movement
  inside.
- Disabled controls are not focusable.

## Motion

- Respect reduced motion on every platform (motion.md).
- Nothing flashes or auto-advances without a pause control.

## Right to left and language

- Use start/end, not left/right. Mirror directional icons (back, forward, send); never mirror
  clocks, refresh arrows or media controls.
- Set the document or app locale so screen readers pronounce text correctly (`<html lang>`,
  `Localizations`, Android resources).

## Before you finish

Check light and dark, compact and expanded widths, text at 200% [site:/foundations/writing/text-resizing],
keyboard-only use, and a screen-reader pass over every icon-only control. Then run
`scripts/verify`.
