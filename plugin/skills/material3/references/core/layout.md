# Layout and spacing

Build every screen from bars, rails and panes, choose the arrangement by window width, and space
everything with the spacing scale.

## Spacing scale

Only these steps exist: the system measurement steps that sit on the grid of `space50`. There are
no in-between names.

Names: web `--md-sys-space-<n>`, Flutter and Compose `M3Space.space<n>`. Steps n → dp, each
[token:md.sys.measurement.space<n>]: 0 → 0, 50 → 4, 100 → 8, 150 → 12, 200 → 16, 250 → 20, 300 → 24,
400 → 32, 450 → 36, 500 → 40, 600 → 48, 700 → 56, 800 → 64, 900 → 72 (dp, [token:md.sys.measurement.space<n>]).

- Every padding, gap and margin in custom code is one of these names. No literals, no `calc()` to
  reach an off-scale value. A half step a component needs comes from that component's own defaults.
- Put padding and gaps on the parent (`gap`, `Arrangement.spacedBy`, `Column`/`Row` spacing);
  avoid a margin on every child.
- Use leading/trailing (start/end, `EdgeInsetsDirectional`, `padding-inline-start`) so layouts
  mirror in right-to-left languages.
- Related items sit closer than unrelated ones; repeat the same gap between like items.

## Breakpoints (by window width, never by device)

| Breakpoint | Width | Side margin | Panes | Primary navigation |
|---|---|---|---|---|
| Compact | below 600dp [site:/foundations/layout/breakpoints/overview] | 16dp [site:/foundations/layout/breakpoints/compact] [token:md.sys.measurement.space200] | 1 | navigation bar (or modal expanded rail) |
| Medium | 600–839dp [site:/foundations/layout/breakpoints/overview] | 24dp [site:/foundations/layout/breakpoints/medium] [token:md.sys.measurement.space300] | 1 (2 only for light content, split evenly) | collapsed navigation rail, or navigation bar |
| Expanded | 840–1199dp [site:/foundations/layout/breakpoints/overview] | 24dp [site:/foundations/layout/breakpoints/expanded] [token:md.sys.measurement.space300] | usually 2 | navigation rail, collapsed or expanded |
| Large | 1200–1599dp [site:/foundations/layout/breakpoints/overview] | 24dp [site:/foundations/layout/breakpoints/large-extra-large] [token:md.sys.measurement.space300] | 2 | navigation rail, collapsed or expanded |
| Extra-large | 1600dp and wider [site:/foundations/layout/breakpoints/overview] | 24dp [site:/foundations/layout/breakpoints/large-extra-large] [token:md.sys.measurement.space300] | 2, or 3 with a side sheet | expanded navigation rail fits best |

- Spacer between two panes: the side-margin value of that breakpoint, as a spacing token.
- Fixed pane default: 360dp [site:/foundations/layout/breakpoints/expanded] at expanded, 412dp
  [site:/foundations/layout/breakpoints/large-extra-large] at large and wider. At least one pane is
  always flexible. Never more than three panes.
- Swap components at a breakpoint only for an equivalent one: bar to rail, bottom sheet to menu,
  full-screen dialog to basic dialog. Never a button into a chip.

## Scaffold

- Fill from the outside in: app bar and navigation (bars, rails) first, panes in what remains.
- Keep content out of the system areas (status bar, gesture bar): web `env(safe-area-inset-*)`,
  Flutter `SafeArea`/`Scaffold`, Compose `Scaffold` with window insets.
- One primary navigation component per screen: never a navigation bar and a rail (or a bar and a
  toolbar at the bottom) together.

## Canonical layouts (choose one before writing code)

Pick the layout from what the screen does, then apply the column for the window width. The web
captures at 412 and 1440 px are compact and large.

| The screen mainly... | Layout | Compact | Medium | Expanded and wider |
|---|---|---|---|---|
| lets people browse many similar items (catalog, gallery, feed) | Feed | one column of full-width items, or two for small tiles | two columns | more columns; filters in a fixed pane or a chip row above the grid |
| shows a collection and one open item (inbox, queue, schedule, categories) | List-detail | one pane: list, and the detail as its own view with a back button | one pane, or two for quick browsing | list in the fixed pane, detail in the flexible pane with the selection shown; no back button |
| does one main task with related tools (player and queue, form and summary, document and notes) | Supporting pane | supporting content below the main content, or in a bottom sheet | below the main content | main content flexible (about two thirds), supporting pane fixed beside it |
| is one short focused task (sign-in, one form step, a confirmation) | Single pane | full width | one column | one column at reading width, centered, inside a container on the page background |

- Two panes: one fixed (the fixed-pane width of the breakpoint, above) and one flexible, or
  two flexible panes split evenly. The spacer between them is the side margin of the breakpoint.
- List-detail with nothing selected: the detail pane shows placeholder content (what to select,
  one line), never a blank pane. Select a credible first item in the delivered UI.
- Supporting pane on compact: it moves below the main content in reading order; it is not hidden.

### Filling the window (no empty columns)

- Panes run from the app bar to the bottom of the window; when content is longer, the pane scrolls
  inside itself. A short pane never ends halfway down beside a long one.
- A pane whose content is short gets the content that belongs there (details of the selected item,
  a summary, related actions), or the layout drops to fewer panes. Never leave a blank column.
- Free space is allowed only as balanced margins around a centered column, never as a hole at one
  side or below a short pane.
- Grids fill the width of their pane: add columns as the pane grows instead of leaving a gutter.

## Readability and reach

- Keep body text to roughly 40 to 60 characters per line by widening margins or adding columns on
  wide windows. More space reveals more structure; do not just scale things up.
- Keep frequent controls in reach: bottom on compact, leading edge on wider windows.
