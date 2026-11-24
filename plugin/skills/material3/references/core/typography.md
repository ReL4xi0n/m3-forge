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

## Hierarchy recipes by screen type

Neighboring levels must differ in at least two ways: role or size, weight (emphasized twin), and
color (`onSurface` against `onSurfaceVariant`). Same size and weight for a name and its price reads
as one level. "(E)" means the emphasized twin in M3 Expressive and the baseline style in classic.

| Screen | Focal point | Second level | Supporting text | Metadata and small print |
|---|---|---|---|---|
| Product detail | product name: headline medium | price: title large (E), `onSurface`, shown once at that size | description: body large | rating, stock, delivery: label large, `onSurfaceVariant` |
| Product card in a grid | price: title large (E) | name: title medium | one attribute: body medium, `onSurfaceVariant` | badge text: label small |
| List or queue | selected or current item label: body large (E) | item label: body large [token:md.comp.list.list-item.label-text.type] | body medium [token:md.comp.list.list-item.supporting-text.type], one or two lines | trailing time, count, price: label small [token:md.comp.list.list-item.trailing-supporting-text.type]; section headers: title small |
| Form | screen title: headline small (or the app bar title) | section titles: title medium | inputs: body large [token:md.comp.filled-text-field.input-text.type] | total or result: title large (E); helper text stays the field's default |
| Media player | track title: headline small (E) | artist or show: title medium, `onSurfaceVariant` | episode notes: body medium | elapsed and remaining time: label medium, tabular figures |
| Settings | screen title: headline medium | section labels: title small, `primary` | row labels: body large; values: body medium, `onSurfaceVariant` | the account name: title medium, never above the screen title |
| Dashboard | key numbers: display small or headline large (E), one row | card titles: title medium | chart and table text: body medium | number labels and deltas: label large, `onSurfaceVariant`; a delta carries an icon, not color alone |

- One focal point per screen or card. A collection repeats its card recipe exactly.
- The screen title is headline medium or larger (headline large on expanded); a subtitle is body
  large in `onSurfaceVariant` just below it.

## Emphasized styles (M3 Expressive)

- Use an emphasized twin where weight carries meaning: selected or unread items, the primary
  action's label, an extended FAB label, a hero headline, a badge.
- Use them by contrast with baseline text. A screen that is all emphasized has no emphasis.
- Components never switch to emphasized on their own; swap the style where you want it.
- Classic M3 request: emphasized styles are off (web: `data-m3-style="classic"` on the root maps
  them back to the baseline style).

## Where the styles come from

The platform asset (web `tokens.css` classes, Flutter `type.dart`, Compose `Type.kt`), installed with
`scripts/install-assets`; how to read the styles is in the platform's theme or setup reference. Do
not copy the numbers out of it.

## Typefaces

- Two slots: brand (display, headline) and plain (body, label), both Roboto from `assets/fonts/`
  (Roboto Flex also ships). A brand face may change the typeface variable, never the sizes; fall
  back to Roboto, then a system sans.
- Numbers that line up or update (tables, prices, timers): turn on tabular figures
  (`font-variant-numeric: tabular-nums`, `FontFeature.tabularFigures()`,
  `fontFeatureSettings = "tnum"`).

## Text color

- Default text: `onSurface`. Secondary text: `onSurfaceVariant`. Text on a filled role: that role's
  on partner (see color.md).
- Never lower text opacity or use `outline` to make text secondary; use `onSurfaceVariant` (helper
  text included).

## Scaling and fitting

- Text must grow with the user's font setting up to 200% [site:/foundations/writing/text-resizing]:
  web sizes in `rem` (the tokens are), Flutter and Compose in `sp` (the assets are).
- When enlarged text does not fit: let the container grow taller, then reflow side-by-side items
  into a stack, then allow vertical scrolling. Never two-way scrolling.
- Wrap instead of truncating. An ellipsis only when the full text is reachable (tooltip, detail
  view), as for one-line titles in dense queues and tables.
- Fixed-height bars (app bar, navigation bar, rail, tabs) keep labels at normal size and show the
  full label in a tooltip.

## Do not

- Change the scale's sizes to fit a layout; use ALL CAPS labels (Material is sentence case); mix
  more than two families on a screen.
