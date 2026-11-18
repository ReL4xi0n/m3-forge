# Compose Expressive

Expressive on Compose means material3 1.5 or newer plus the expressive theme (`theme.md`). The rules
for the style itself are in `core/expressive.md`; this note is only what is specific to the library.
Below 1.5: `versions.md`.

## What exists at 1.5

| Group | APIs |
|---|---|
| Theme | `MaterialExpressiveTheme`, `MotionScheme.expressive()` (set by `M3Theme`) |
| Buttons | `ButtonGroup`, `ToggleButton`, `ElevatedToggleButton`, `FilledTonalToggleButton`, `OutlinedToggleButton`, `SplitButtonLayout`; button and icon button sizes through the `ButtonDefaults` and `IconButtonDefaults` size helpers |
| FAB | `FloatingActionButtonMenu`, `ToggleFloatingActionButton`, `FloatingActionButtonMenuItem` |
| Toolbars | `HorizontalFloatingToolbar`, `VerticalFloatingToolbar`, `FlexibleBottomAppBar` |
| App bars | `MediumFlexibleTopAppBar`, `LargeFlexibleTopAppBar`, `AppBarWithSearch`, `ExpandedFullScreenSearchBar` |
| Navigation | `ShortNavigationBar`, `ShortNavigationBarItem`, `WideNavigationRail`, `ModalWideNavigationRail`, `WideNavigationRailItem` |
| Lists | `SegmentedListItem` |
| Progress | `LoadingIndicator`, `ContainedLoadingIndicator`, `LinearWavyProgressIndicator`, `CircularWavyProgressIndicator` |
| Shapes | `MaterialShapes` with `toShape()` and `toPath()` |
| Other | `PullToRefreshBox` with the loading indicator, `VerticalDragHandle`, `ScrollField` |

## Opt-in

When a call does not compile, the compiler names the annotation it needs; trust it over this list.
At the pinned 1.5 release these were marked `@ExperimentalMaterial3ExpressiveApi`
[impl: LoadingIndicator.kt, MaterialShapes.kt, Menu.kt]:

- `LoadingIndicator`, `ContainedLoadingIndicator`, `LoadingIndicatorDefaults`;
- `MaterialShapes`, `RoundedPolygon.toShape()`, `Morph.toPath()`;
- the `DropdownMenuItem` overload with a `checked` state and `shapes`.

The other rows of the table need no Expressive opt-in at that release. `AppBarWithSearch`,
`TopSearchBar` and parts of `SearchBar` carry `@ExperimentalMaterial3Api` [impl: SearchBar.kt]. Where
an opt-in is needed, put `@OptIn(ExperimentalMaterial3ExpressiveApi::class)` (or
`ExperimentalMaterial3Api`) on the function or file that uses it, with a one-line comment saying why.
Never opt in a whole module through compiler flags and never use `@Suppress` for it.

## Rules

- Use the official component of the table before building anything; the style comes from the theme
  and the component, not from hand-set shapes and colors.
- Main action: the largest button size on the screen goes to its one primary action; the others stay
  at the default size.
- Shapes: `M3Shapes.*` for corners; `MaterialShapes.<name>.toShape()` only for decoration
  (`core/expressive.md`).
- Motion: components animate through the theme's motion scheme; do not pass `tween` specs to them.
- A `ShortNavigationBar` or `NavigationBar` never shares the screen with a floating toolbar; a FAB
  menu opens only from its own toggle FAB.
