# Compose components

Which official `androidx.compose.material3` composable to use for a need. `M3Theme` (`theme.md`)
styles them: write no colors, shapes or text styles on them. Icons: `icons.md`. Rows marked
`1.5+` need material3 1.5 or newer (`versions.md`); below that use the classic row.

**Rule (F6):** every button, chip, checkable chip, icon button and clickable row gets a layout of at
least 48 dp in both directions (`heightIn(min = 48.dp)`, `sizeIn(...)`): see "Layout size, not touch
area" below. The default sizes of `Button` and the chips are shorter and are reported as findings.

## Which composable

| Need | Use | Notes |
|---|---|---|
| Primary action | `Button` | One per screen area. Emphasis down: `FilledTonalButton`, `ElevatedButton`, `OutlinedButton`, `TextButton` |
| Icon-only action | `IconButton`, `FilledIconButton`, `FilledTonalIconButton`, `OutlinedIconButton` | `contentDescription` on the `Icon` |
| Toggle icon or button | `IconToggleButton`, `ToggleButton` (1.5+) | Selected state uses the filled glyph |
| Related buttons in a row | `ButtonGroup` (1.5+) | Classic: `SingleChoiceSegmentedButtonRow` |
| Split action with a menu | `SplitButtonLayout` (1.5+) | Classic: `Button` plus `DropdownMenu` |
| Main screen action | `FloatingActionButton`, `MediumFloatingActionButton`, `LargeFloatingActionButton`, `ExtendedFloatingActionButton` | In `Scaffold(floatingActionButton = ...)` |
| Several FAB actions | `FloatingActionButtonMenu` with `ToggleFloatingActionButton` (1.5+) | Classic: one FAB that opens a `ModalBottomSheet` |
| Choose one of 2 to 5 | `SingleChoiceSegmentedButtonRow`, `MultiChoiceSegmentedButtonRow` | Or the connected `ButtonGroup` (1.5+) |
| Filter, choice, input, suggestion | `FilterChip`, `AssistChip`, `InputChip`, `SuggestionChip` | The chip height is a token; the touch area pads out |
| Top of screen | `TopAppBar`, `CenterAlignedTopAppBar`, `MediumTopAppBar`, `LargeTopAppBar` | `TopAppBarDefaults.exitUntilCollapsedScrollBehavior()` for collapsing; 1.5+: `MediumFlexibleTopAppBar`, `LargeFlexibleTopAppBar` |
| Primary navigation | `NavigationBar` with `NavigationBarItem` on phones; `NavigationRail` from medium width; 1.5+: `ShortNavigationBar`, `WideNavigationRail` | Every item has a label and an icon; `ModalNavigationDrawer` for more destinations |
| Bottom bar of actions | `BottomAppBar`; 1.5+: `HorizontalFloatingToolbar` | As `Scaffold(bottomBar = ...)` |
| Tabs | `PrimaryTabRow` or `SecondaryTabRow` with `Tab` | One text per tab |
| Content container | `Card`, `ElevatedCard`, `OutlinedCard` | The theme sets the shape |
| Rows | `ListItem`; 1.5+: `SegmentedListItem` for grouped lists | `headlineContent`, `supportingContent`, `leadingContent`, `trailingContent` |
| Text input | `TextField`, `OutlinedTextField` | Always a `label`; `supportingText` for errors, with `isError` |
| Search | `SearchBar` with `SearchBarDefaults.InputField`; 1.5+: `AppBarWithSearch` | `placeholder` and a leading icon |
| Dropdown | `ExposedDropdownMenuBox` with `ExposedDropdownMenu`; plain menus: `DropdownMenu`, `DropdownMenuItem` | |
| Switch, checkbox, radio, slider | `Switch`, `Checkbox`, `RadioButton`, `Slider`, `RangeSlider` | Put the control and its label in one `Row` with `toggleable` or `selectable` so the label belongs to it |
| Dialog | `AlertDialog` | Title, text, two actions at most; `TextButton`s |
| Bottom sheet | `ModalBottomSheet`, `BottomSheetScaffold` | |
| Message | `SnackbarHost` in `Scaffold(snackbarHost = ...)`, `SnackbarHostState.showSnackbar` | One action at most |
| Counts | `BadgedBox` with `Badge` | Wrap the icon of a destination or button |
| Progress | `LinearProgressIndicator`, `CircularProgressIndicator`; 1.5+: `LoadingIndicator`, `LinearWavyProgressIndicator` | Pass a `progress` lambda when it is known |
| Pull to refresh | `PullToRefreshBox` | |
| Carousel | `HorizontalMultiBrowseCarousel`, `HorizontalUncontainedCarousel`, `HorizontalCenteredHeroCarousel` | |
| Date, time | `DatePicker`, `DatePickerDialog`, `TimePicker`, `TimePickerDialog` | |
| Tooltip | `TooltipBox` with `rememberTooltipState` | |

## Compose specifics

- Touch targets: the Material components extend their touch area to the minimum interactive size
  [token:md.sys.measurement.touch-target] by default. A bare `clickable` has none: put
  `Modifier.minimumInteractiveComponentSize()` before it, or use `IconButton`. Never turn the
  minimum off with `LocalMinimumInteractiveComponentSize`. The screenshot step reports clickables
  whose layout size is below the minimum (`screenshot.md`).
- Layout size, not touch area (F6): the capture and verify measure the LAYOUT size of every clickable,
  not the touch area `minimumInteractiveComponentSize()` adds around it. The default `Button` and the
  chips are laid out shorter than the minimum [impl: Button.kt ButtonDefaults.MinHeight,
  Chip.kt FilterChipDefaults.Height], so they are reported although they are tappable. Give every
  button, chip (checkable chips included), icon button and clickable row a layout of at least the
  minimum [token:md.sys.measurement.touch-target] in both directions: `Modifier.heightIn(min = 48.dp)`
  on buttons and chips, `Modifier.sizeIn(minWidth = 48.dp, minHeight = 48.dp)` on icon buttons and
  small clickables (use `M3Space` for the surrounding gaps, not for this minimum). Disabled
  controls are not measured.
- Labels: an `Icon` that carries meaning alone gets `contentDescription`; a decorative one next to
  text gets `null`. Images the same.
- Selected states: use the component's own (`NavigationBarItem(selected)`, `FilterChip(selected)`,
  `Tab(selected)`, `ListItem` inside `selectable`). Do not paint a selection by hand.
- Disabled: `enabled = false`; never fake it with `alpha`.
- Slots: build a screen as `Scaffold(topBar, bottomBar, floatingActionButton, snackbarHost)` and use
  its `PaddingValues` on the content. Do not stack a FAB or bar in a `Box` over the content.
- Lists: `LazyColumn` for long content, with `contentPadding` from `M3Space`. The first vertical
  scrollable of the screen is what the screenshot step scrolls.
- Text: `MaterialTheme.typography.<role>`; the emphasized styles are in `theme.md`.
- Window size: `currentWindowAdaptiveInfo()` or `BoxWithConstraints` to switch `NavigationBar` to
  `NavigationRail`; the window class limits are in `core/layout.md`.
- Opt-in: `expressive.md` says which 1.5 APIs still need it.
