# Typography

All text uses a type-scale role. Never set a font size, weight, line height or letter spacing by
hand in UI code.

## The roles

Five roles in three sizes each (large, medium, small), plus an emphasized twin of each style that
keeps the size and line height and is heavier.

| Role | Use it for |
|---|---|
| Display | Short hero text or a big number; mostly wide screens |
| Headline | Page and section headings, short high-emphasis text |
| Title | App bar titles, card and dialog titles, list section headers |
| Body | Reading text, descriptions, list supporting text |
| Label | Text inside components: buttons (label large), chips, tabs, badges, captions |

- A product needs only a few of the fifteen styles. Pick a small subset and reuse it.
- Body text never uses a display or decorative face; label and body stay legible at small sizes.
- Heading level (h1, h2 ...) follows the content outline, not the visual size.

## Emphasized styles (M3 Expressive)

- Use an emphasized twin where weight carries meaning: selected or unread items, the primary
  action's label, an extended FAB label, a hero headline, a badge.
- Use them by contrast with baseline text. A screen that is all emphasized has no emphasis.
- Components never switch to emphasized on their own; swap the style where you want it.
- Classic M3 request: emphasized styles are off (web: `data-m3-style="classic"` on the root maps
  them back to the baseline style).

## Where the styles come from

| Platform | Asset | In UI code |
|---|---|---|
| Web | `assets/web/tokens.css` | classes `.m3-type-<role>-<size>` and `.m3-type-emphasized-<role>-<size>`, or `var(--md-sys-typescale-<role>-<size>-font\|size\|line-height\|weight\|tracking)` |
| Flutter | `assets/flutter/lib/m3/type.dart` | `ThemeData(textTheme: M3Type.textTheme, extensions: [M3EmphasizedType.baseline])`; read `Theme.of(context).textTheme.titleLarge`, `M3EmphasizedType.of(context).labelLarge` |
| Compose | `assets/compose/theme/Type.kt` | `MaterialTheme(typography = M3Typography)`; read `MaterialTheme.typography.titleLarge`, `M3EmphasizedType.labelLarge` |

Install the asset with `scripts/install-assets` before using it. Do not copy the numbers out of it.

## Typefaces

- Two slots: brand (display, headline) and plain (body, label). Both default to Roboto, shipped in
  `assets/fonts/` with its license; Roboto Flex is also shipped for variable-axis use.
- Changing the brand face for expression is allowed; change the typeface variable, not the sizes.
  After a face change, adjust line height and tracking only.
- Fallback chain when Roboto Flex is used: Roboto Flex, then Roboto, then a system sans covering the
  user's scripts.
- Numbers that line up or update (tables, prices, timers): turn on tabular figures
  (`font-variant-numeric: tabular-nums`, `FontFeature.tabularFigures()`,
  `fontFeatureSettings = "tnum"`).

## Text color

- Default text: `onSurface`. Secondary text: `onSurfaceVariant`. Text on a filled role: that role's
  on partner (see color.md).
- Never lower text opacity to make it secondary; use `onSurfaceVariant`.

## Scaling and fitting

- Text must grow with the user's font setting up to 200% [site:/foundations/writing/text-resizing]:
  web sizes in `rem` (the tokens are), Flutter and Compose in `sp` (the assets are).
- Padding and gaps stay at their normal values when text grows; only text and line height scale.
- When enlarged text does not fit: let the container grow taller, then reflow side-by-side items
  into a stack, then allow vertical scrolling. Never two-way scrolling.
- Wrap instead of truncating. An ellipsis is allowed only when the full text is reachable (tooltip,
  detail view).
- Fixed-height bars (app bar, navigation bar, rail, tabs) keep labels at normal size and show the
  full label in a tooltip.

## Do not

- Write a literal `font-size`, `font-weight`, `TextStyle(fontSize: ...)` or `fontSize = <n>.sp` in
  UI code.
- Change the scale's sizes to fit a layout.
- Use very thin weights or decorative faces for body or label text.
- Use ALL CAPS styling for labels; Material text is sentence case.
- Mix more than two families on a screen.
