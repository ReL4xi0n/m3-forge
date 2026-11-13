---
title: Spacing
kind: style
pages: [/styles/spacing/overview, /styles/spacing/applying-spacing, /styles/spacing/tokens, /foundations/layout/grids-spacing/density]
tokenSets: [sys.measurement]
expressive: false
fetched: 2026-11-13
---

## Summary

Spacing is the room around and between elements, in components and in page layouts. M3 defines it
as a simple linear scale built on an 8dp unit [site:/styles/spacing/overview] called `space100`; every other step is a multiple of
it (`space50` is half, `space200` is double). Material names only the steps it recommends. Unlike
color, there is no global spacing logic: each component carries its own padding and gap
attributes, which point at the system steps and can be remapped per product, form factor or
density.

## Rules

Three kinds of spacing:

- Padding: inside an element, between its edge and its content. It can be vertical, horizontal,
  or set per edge (top, bottom, leading, trailing).
- Gap: between elements in a row, column or grid. Simple components use one horizontal and one
  vertical gap; complex ones name each gap by its neighbors (for example an icon–label gap).
- Margin: outside an element, between it and its parent or the screen edge.
- Leading and trailing flip sides in right-to-left languages.

How to apply them:

- Prefer padding and gaps on the parent container. Material components rarely use margins;
  reserve margins for spacing beyond the parent's padding and for page layout.
- Page layouts use panes, spacers and margins for structure, then padding and gaps inside panes.
- Use the system steps in custom components and layouts instead of hard-coded numbers.
- When text is scaled up (to 200% [site:/styles/spacing/applying-spacing]), keep the spacing as it was by default.
- Spacing should still adapt to component size, layout, form factor and density.

Customizing:

- Remap a component attribute to another step to change it everywhere in the product, e.g. move a
  button's top padding from `space125` to `space200` for taller buttons.
- Add a step when Material's set lacks one, following the multiplier naming (`space225` is 2.25 ×
  the base unit).
- Turn a spacing pattern your product repeats (for example the horizontal content padding that
  cards and sheets share) into its own token.
- For adaptive layouts, map an attribute to different steps per device class; for density, change
  vertical padding per density setting.

Naming of component attributes:

- New component tokens use padding, gap and margin with position words: horizontal, vertical,
  leading, trailing, top, bottom (for example "medium button: leading padding").
- Older component tokens call everything "space": `leading-space`, `trailing-space`,
  `top-space`, `bottom-space`, `between-space`.

## Measurements

The spacing scale. The values are printed on the site; the matching tokens exist only in the
`material_ui` token data (see Platform mapping), so the token marker is Flutter's value.

| Step | Value | Step | Value |
|---|---|---|---|
| `space0` | 0dp [site:/styles/spacing/tokens] [token:md.sys.measurement.space0] | `space250` | 20dp [site:/styles/spacing/tokens] [token:md.sys.measurement.space250] |
| `space25` | 2dp [site:/styles/spacing/tokens] [token:md.sys.measurement.space25] | `space300` | 24dp [site:/styles/spacing/tokens] [token:md.sys.measurement.space300] |
| `space50` | 4dp [site:/styles/spacing/tokens] [token:md.sys.measurement.space50] | `space400` | 32dp [site:/styles/spacing/tokens] [token:md.sys.measurement.space400] |
| `space75` | 6dp [site:/styles/spacing/tokens] [token:md.sys.measurement.space75] | `space450` | 36dp [site:/styles/spacing/tokens] [token:md.sys.measurement.space450] |
| `space100` | 8dp [site:/styles/spacing/tokens] [token:md.sys.measurement.space100] | `space500` | 40dp [site:/styles/spacing/tokens] [token:md.sys.measurement.space500] |
| `space125` | 10dp [site:/styles/spacing/tokens] [token:md.sys.measurement.space125] | `space600` | 48dp [site:/styles/spacing/tokens] [token:md.sys.measurement.space600] |
| `space150` | 12dp [site:/styles/spacing/tokens] [token:md.sys.measurement.space150] | `space700` | 56dp [site:/styles/spacing/tokens] [token:md.sys.measurement.space700] |
| `space175` | 14dp [site:/styles/spacing/tokens] [token:md.sys.measurement.space175] | `space800` | 64dp [site:/styles/spacing/tokens] [token:md.sys.measurement.space800] |
| `space200` | 16dp [site:/styles/spacing/tokens] [token:md.sys.measurement.space200] | `space900` | 72dp [site:/styles/spacing/tokens] [token:md.sys.measurement.space900] |

- Base unit: `space100` is 8dp [site:/styles/spacing/overview] [token:md.sys.measurement.space100].
- The main steps are multiples of 8dp [site:/styles/spacing/tokens]. Smaller "nested" steps
  such as 2dp, 4dp, 6dp and 10dp [site:/styles/spacing/tokens] exist because layouts and
  components use them.
- A new step follows the multiplier: `space225` would be 18dp [site:/styles/spacing/applying-spacing].
- Worked example, the search bar:
  - vertical padding 8dp [site:/styles/spacing/overview];
  - horizontal gaps 8dp [site:/styles/spacing/overview];
  - horizontal margins 24dp [site:/styles/spacing/overview] [token:md.comp.search-bar.contained.leading-margin];
  - margins when focused 12dp [site:/styles/spacing/overview] [token:md.comp.search-view.contained.leading-margin].

## Accessibility

- Keep spacing unchanged when text is scaled up, so larger text does not crowd its neighbors.
- Leading and trailing spacing must mirror correctly in right-to-left layouts.
- Spacing that adapts to density should not, by default, shrink touch targets below
  48 × 48dp [site:/foundations/layout/grids-spacing/density].

## Platform mapping

- Jetpack Compose (material3 1.5.0-rc01): the site says the spacing tokens are used only on
  Compose, but the pinned material3 sources define no spacing token or API [NOT FOUND].
  Components carry their own padding defaults, for example `ButtonDefaults.contentPaddingFor`.
- Flutter (`material_ui` 1.11.0): the `md.sys.measurement.space*` values exist only in the
  code-generator data (`tool/gen_defaults/data/measurement.dart`, class `TokenMeasurement`). They
  are not exported as public API.
- Web: no maintained official component, and material-web has no spacing tokens [NOT FOUND]. Our
  CSS takes the values from the table above.

## Pitfalls

- Hard-coded spacing values in custom components instead of scale steps.
- Margins on every child instead of padding and gaps on the parent.
- Shrinking padding when text grows.
- Inventing off-scale names; extend with the multiplier pattern instead.
- Physical left/right spacing where leading/trailing is meant, which breaks right-to-left layouts.
- Changing spacing through the system step when only one component should change; remap that
  component's attribute instead.
