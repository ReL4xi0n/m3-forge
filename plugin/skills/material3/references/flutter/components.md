# Flutter components

Which widget to use for a need. Use the official widgets: `Theme` (`theme.md`) styles them, so
write no colors, shapes or text styles on them. Pieces the library lacks are in `coverage.md`
(`M3ButtonGroup`, `M3FabMenu`, `M3SplitButton`, `M3FloatingToolbar`, `M3DockedToolbar`,
`M3LoadingIndicator`); use those instead of building your own. Icons: `icons.md`.

## Which widget

| Need | Use | Notes |
|---|---|---|
| Primary action | `FilledButton` | One per screen area. Emphasis down: `FilledButton.tonal`, `ElevatedButton`, `OutlinedButton`, `TextButton` |
| Icon-only action | `IconButton` (`.filled`, `.filledTonal`, `.outlined`) | `tooltip` is required |
| Toggle icon | `IconButton(isSelected:, selectedIcon:)` | Selected state needs both, with the filled glyph for selected |
| Main screen action | `FloatingActionButton` (`.small`, `.large`, `.extended`) | In `Scaffold.floatingActionButton`; give `tooltip`, or a label on `.extended` |
| Several FAB actions | `M3FabMenu` | `coverage.md` |
| Split action with a menu | `M3SplitButton` | `coverage.md` |
| Related buttons in a row | `M3ButtonGroup` | `coverage.md`; `SegmentedButton` is the older single-choice control |
| Choose one of 2 to 5 | `SegmentedButton` | `selected` is a set; `showSelectedIcon` for the check |
| Filter, choice, input, suggestion | `FilterChip`, `ChoiceChip`, `InputChip`, `ActionChip` | Chips are 32 dp tall [token:md.comp.filter-chip.container.height]: the tap area still pads to 48 dp, do not set `materialTapTargetSize` to shrinkWrap |
| Top of screen | `AppBar`, or `SliverAppBar` / `.medium` / `.large` in a scroll view | Subtitle is not built: `coverage.md` row 8 |
| Primary navigation, 3 to 5 | `NavigationBar` on phones, `NavigationRail` from medium width, `NavigationDrawer` for more | Each `NavigationDestination` has a `label`, `icon` and `selectedIcon` |
| Bottom bar of actions | `BottomAppBar`, or `M3DockedToolbar` | As `Scaffold.bottomNavigationBar` |
| Tabs | `TabBar` with `TabBarView` | One `Tab` text per view; do not nest tab bars |
| Content container | `Card` (`Card.filled`, `Card.outlined`) | The theme sets the shape |
| Rows | `ListTile` | `leading`, `title`, `subtitle`, `trailing`; `selected` and `onTap` set the state |
| Text input | `TextField` / `TextFormField` with `InputDecoration` | Filled is the default; outlined with `OutlineInputBorder`. Always `labelText` |
| Search | `SearchBar`, `SearchAnchor` | Hint text and a leading icon |
| Dropdown | `DropdownMenu`; menus with `MenuAnchor` | `label` on the field |
| Switch, checkbox, radio, slider | `Switch`, `Checkbox`, `RadioGroup` with `Radio`, `Slider` | Wrap in `ListTile` or `SwitchListTile` / `CheckboxListTile` so the label belongs to the control |
| Dialog | `AlertDialog` via `showDialog` | Title, content, two actions at most; text buttons |
| Bottom sheet | `showModalBottomSheet`, `BottomSheet` | `showDragHandle: true` |
| Message | `ScaffoldMessenger.of(context).showSnackBar(SnackBar(...))` | One action at most |
| Counts | `Badge` | Wrap the icon of a destination or button |
| Progress | `LinearProgressIndicator`, `CircularProgressIndicator` | Pass `semanticLabel`; indeterminate when unknown |
| Date, time | `showDatePicker`, `showTimePicker` | |

## Flutter specifics

- Touch targets are 48 dp: the Material buttons, `IconButton`, chips, checkboxes and switches pad
  their tap area to it by default. Never wrap one in a `SizedBox` smaller than 48, never set
  `visualDensity: VisualDensity.compact` or `MaterialTapTargetSize.shrinkWrap`. A bare
  `GestureDetector` or `InkWell` has no minimum: give it `ConstrainedBox(constraints:
  BoxConstraints(minWidth: 48, minHeight: 48))`, or use `IconButton`.
- Labels: an icon-only control gets `tooltip` (it is also its accessible name). An `Icon` that
  carries meaning alone gets `semanticLabel`; a decorative one next to text is excluded with
  `ExcludeSemantics`. Images get `semanticLabel`, decorative ones `excludeFromSemantics: true`.
- Selected states: use the widget's own (`NavigationBar.selectedIndex`, `ListTile.selected`,
  `IconButton.isSelected`, `SegmentedButton.selected`, `FilterChip.selected`). Do not paint a
  selection by hand with colors.
- Disabled: pass `onPressed: null` (or `onChanged: null`); never fake it with opacity.
- Slots: build a screen as `Scaffold(appBar:, body:, floatingActionButton:, bottomNavigationBar:)`.
  The `Scaffold` reserves the space of the app bar and the bottom bar and lifts snack bars and the
  FAB above the bottom bar, so nothing is covered. Do not stack a FAB or bar in a `Stack` over the
  body. A body that scrolls under a FAB needs bottom padding for it (the FAB is 56 dp [token:md.comp.fab.container.height]
  and the Scaffold adds its own margin).
- Lists: `ListView.builder` (or slivers) for long content; the first vertical scrollable of the home
  screen is what the screenshot step scrolls (`scaffold.md`).
- Text: `Theme.of(context).textTheme.<role>`; the emphasized scale is `M3EmphasizedType` (`theme.md`).
- Window size: use `MediaQuery.sizeOf(context)` or `LayoutBuilder` to switch `NavigationBar` to
  `NavigationRail`; the window class limits are in `core/layout.md`.
