---
title: Writing and text
kind: foundation
pages: [/foundations/writing/best-practices, /foundations/writing/text-resizing, /foundations/writing/text-truncation]
tokenSets: []
expressive: false
fetched: 2026-11-13
---

## Summary

Text in an M3 interface has to survive change: larger font settings, translation into longer
languages, narrow windows, and being read aloud by a screen reader. This note covers text that
assistive technology reads, how components behave when text is enlarged, and how to handle text
that does not fit. Wording and tone are in `content-design.md`.

## Rules

### Text for screen readers

- Screen readers (TalkBack on Android, VoiceOver on iOS, JAWS on desktop) speak visible text and
  hidden text such as alt text and labels for icons.
- Captions sit under an image and say how it relates to the content. Sighted readers and screen
  reader users both rely on them.
- A screen reader cannot read text drawn inside an image. If the image contains essential words,
  put them in the alt text too, or better, in real text next to it.
- Alt text is a short, code-level label for an image. Do not start it with "image of"; the screen
  reader already announces an image. Alt text also appears when the image fails to load. Details
  (and the length limit) are in `content-design.md`.
- Split an informative illustration into essential parts (text, the drawing that carries the
  instruction) and decorative parts. Essential parts must meet contrast: at least 3:1 for large
  text and 4.5:1 for small text. Decoration is exempt.

### Text resizing

- Support enlarging text to at least 200% [site:/foundations/writing/text-resizing]. People
  usually set this in the operating system, sometimes in the app.
- When text grows, most components scale only their text: font size and line height multiply by
  the scale factor, while padding and the gaps between elements stay at their 1x values.
- In the site's example a button keeps 8dp padding above and below the label [site:/foundations/writing/text-resizing]
  at 1x, 1.3x and 2x.
- The example's side padding is 24dp [site:/foundations/writing/text-resizing], the older classic
  value.
- Current small buttons use 16dp [token:md.comp.button.small.leading-space]; the rule (padding does
  not scale) is what matters.
- Components without text (progress indicators, checkboxes, radio buttons) do not change size.
- If the OS does not handle scaling, offer multipliers such as 1.5x and 2x. The enlarged size is
  the 1x size times the factor; decimals are acceptable.
- People enlarge text to read more easily, to focus on one task, and to reduce sensory overload.
  Larger text with less on screen helps them decide one thing at a time.

### When enlarged text does not fit

Typical failures: a fixed container clips the text, text ignores the setting, elements overlap,
or labels truncate without a way to read them. Fix them in this order of preference:

1. Let the container grow (height first) so text wraps instead of clipping. Keep line breaks
   readable.
2. Reflow the layout: stack side-by-side items, for example two buttons, when the width runs out.
3. Let the content scroll, vertically only. Never make people scroll in two directions.
4. Where space is fixed by design (top app bar, navigation bar, navigation rail, tabs pinned to the
   top), keep the label at 1x and show the enlarged label in a tooltip on touch and hold.

### Truncation and wrapping

- Nothing may be lost when type settings change: content, meaning and function all stay
  available. Non-Latin scripts can be exceptions.
- Wrap text when it is critical or when the component has room; let containers grow in height or
  width to fit their content, and use all the space available.
- Do not cap text length below what the component could show.
- Truncating with an ellipsis is acceptable only when the full text is reachable, through a
  tooltip or a link that reveals it (for example a card that opens an expanded view).
- An ellipsis with no way to see the rest is inaccessible. Even with a way, it adds effort, so
  prefer wrapping.

## Measurements

| What | Value |
|---|---|
| Minimum text enlargement to support | 200% [site:/foundations/writing/text-resizing] |
| Padding and spacing when text scales | stays at 1x (only text and line height scale) |
| Example button vertical padding, any scale | 8dp [site:/foundations/writing/text-resizing] |
| Alt text length limit on this page | 125 characters [site:/foundations/writing/best-practices] |
| Contrast for essential text in images | 3:1 large, 4.5:1 small [site:/foundations/writing/best-practices] |

- The alt-text limit differs between pages: the content-design alt text page recommends 140
  characters [site:/foundations/content-design/alt-text]. See `content-design.md`.

## Accessibility

This whole note is accessibility guidance. The checks to run on any design:

- View every screen at 2x text size: no clipping, overlap or silent truncation.
- Every truncated string has a tooltip or link to the full text.
- Images with meaning have alt text; text inside images is repeated in real text.
- Essential text and drawings in illustrations meet 3:1 or 4.5:1 contrast.

## Platform mapping

- Jetpack Compose (material3 1.5.0-rc01): type tokens are in `sp`, which follow the system font
  scale. `Icon` takes a `contentDescription` (pass `null` for decorative icons). For labels that
  must stay at 1x, `TooltipBox` with `PlainTooltip` shows the full label on long press.
- Flutter (`material_ui` 1.11.0): widgets read the scale through `MediaQuery.textScalerOf`;
  `IconButton.tooltip` gives both a tooltip and a semantic label; `Tooltip` wraps any widget.
- Web: no maintained official component; our CSS is built in Phase 3. material-web's typescale
  tokens are in `rem`, so type sized from them follows the browser's font-size setting while
  padding in fixed units stays put, which is the behavior this page asks for.

## Pitfalls

- Scaling the whole component (padding included) with the text, or resizing components that hold
  no text, such as progress indicators, checkboxes and radio buttons.
- Fixed-height containers that clip enlarged or translated text.
- Ellipses with no tooltip or link to the rest of the text.
- Two-way scrolling to reach enlarged content.
- Essential information only inside an image.
- Alt text that starts with "image of" or "picture of".
