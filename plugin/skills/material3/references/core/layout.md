# Layout and spacing

Build every screen from bars, rails and panes, choose the arrangement by window width, and space
everything with the spacing scale.

## Spacing scale

Only these steps exist: the system measurement steps that sit on the grid of `space50`. There are
no in-between names.

| Step | Value | Web (`tokens.css`) | Flutter (`lib/m3/space.dart`) | Compose (`theme/Space.kt`) |
|---|---|---|---|---|
| space0 | 0dp [token:md.sys.measurement.space0] | `--md-sys-space-0` | `M3Space.space0` | `M3Space.space0` |
| space50 | 4dp [token:md.sys.measurement.space50] | `--md-sys-space-50` | `M3Space.space50` | `M3Space.space50` |
| space100 | 8dp [token:md.sys.measurement.space100] | `--md-sys-space-100` | `M3Space.space100` | `M3Space.space100` |
| space150 | 12dp [token:md.sys.measurement.space150] | `--md-sys-space-150` | `M3Space.space150` | `M3Space.space150` |
| space200 | 16dp [token:md.sys.measurement.space200] | `--md-sys-space-200` | `M3Space.space200` | `M3Space.space200` |
| space250 | 20dp [token:md.sys.measurement.space250] | `--md-sys-space-250` | `M3Space.space250` | `M3Space.space250` |
| space300 | 24dp [token:md.sys.measurement.space300] | `--md-sys-space-300` | `M3Space.space300` | `M3Space.space300` |
| space400 | 32dp [token:md.sys.measurement.space400] | `--md-sys-space-400` | `M3Space.space400` | `M3Space.space400` |
| space450 | 36dp [token:md.sys.measurement.space450] | `--md-sys-space-450` | `M3Space.space450` | `M3Space.space450` |
| space500 | 40dp [token:md.sys.measurement.space500] | `--md-sys-space-500` | `M3Space.space500` | `M3Space.space500` |
| space600 | 48dp [token:md.sys.measurement.space600] | `--md-sys-space-600` | `M3Space.space600` | `M3Space.space600` |
| space700 | 56dp [token:md.sys.measurement.space700] | `--md-sys-space-700` | `M3Space.space700` | `M3Space.space700` |
| space800 | 64dp [token:md.sys.measurement.space800] | `--md-sys-space-800` | `M3Space.space800` | `M3Space.space800` |
| space900 | 72dp [token:md.sys.measurement.space900] | `--md-sys-space-900` | `M3Space.space900` | `M3Space.space900` |

- Every padding, gap and margin in custom code is one of these names. No literals, no `calc()` to
  reach an off-scale value. A half step a component needs comes from that component's own defaults.
- Put padding and gaps on the parent (`gap`, `Arrangement.spacedBy`, `Column`/`Row` spacing);
  avoid a margin on every child.
- Use leading/trailing (start/end, `EdgeInsetsDirectional`, `padding-inline-start`) so layouts
  mirror in right-to-left languages.
- Spacing does not grow when text grows.
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
- Web: media or container queries on these widths. Flutter: `LayoutBuilder` /
  `MediaQuery.sizeOf(context).width`. Compose: `BoxWithConstraints` or the window size class when
  the project already has it.
- Swap components at a breakpoint only for an equivalent one: bar to rail, bottom sheet to menu,
  full-screen dialog to basic dialog. Never a button into a chip.

## Scaffold

- Fill from the outside in: app bar and navigation (bars, rails) first, panes in what remains.
- Keep content out of the system areas (status bar, gesture bar): web `env(safe-area-inset-*)`,
  Flutter `SafeArea`/`Scaffold`, Compose `Scaffold` with window insets.
- One primary navigation component per screen: never a navigation bar and a rail (or a bar and a
  toolbar at the bottom) together.

## Canonical layouts

- Feed: a grid of cards or items; one column on compact, more columns as width grows.
- List-detail: list and detail as two panes from expanded up; one pane at a time on compact (detail
  shows a back button). Two panes show the selection in the list and no back button.
- Supporting pane: primary content plus a narrower related pane; below the main pane on compact
  and medium, beside it from expanded up.

## Readability and reach

- Keep body text to roughly 40 to 60 characters per line by widening margins or adding columns on
  wide windows. More space reveals more structure; do not just scale things up.
- Keep frequent controls in reach: bottom on compact, leading edge on wider windows.
- Every interactive target is at least 48 × 48dp [site:/foundations/layout/grids-spacing/density],
  at any density.
- Dense mode is opt-in, never automatic.
