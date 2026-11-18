# Flutter gap components: what is official, what the skill ships

`material_ui` 1.11.0 (and 1.11.1, checked the same way) has no widget for these pieces. The skill
ships its own for priority 1 and 2 as opt-in parts of install-assets (Expressive, `lib/m3/expressive/`).
Priority 3 is not built in v1.

Each shipped widget uses only official widgets, `material_ui` primitives (`MaterialShapes`,
`MaterialShapeBorder`) and the skill tokens. When material_ui ships the official widget, switch to it
and delete ours: the column "Replace ours" says when. No version number is guessed; the check is to
search the package for the widget name.

| # | Piece | Official in material_ui 1.11.0 | Ours | Imports it supports | Install part | Replace ours |
|---|---|---|---|---|---|---|
| 1a | Emphasized type | No: the text theme has only the baseline roles | Yes: `M3EmphasizedType` (`type.dart`, read it with `M3EmphasizedType.of(context)`) | both | `tokens` | when material_ui ships emphasized type styles |
| 1b | Expressive motion switch | Partly: `Springs` holds the spring descriptions, but there is no motion scheme that a theme carries | Yes: `M3Motion` and `M3MotionTheme` (`motion.dart`, `theme.dart`); the springs match `Springs` | both | `tokens` | when material_ui ships a motion scheme on its theme |
| 2 | Loading indicator | No | Yes: `M3LoadingIndicator(contained:)` | material_ui only | `loading-indicator` | when material_ui ships a loading indicator |
| 3 | Button group, standard and connected | No (`ToggleButtons` and `SegmentedButton` are older, different widgets) | Yes: `M3ButtonGroup(children:, connected:)` | both | `button-group` | when material_ui ships a button group |
| 4 | FAB menu | No | Yes: `M3FabMenu(items:, icon:, closeIcon:)` | both | `fab-menu` | when material_ui ships a FAB menu |
| 5 | Split button | No | Yes: `M3SplitButton(onPressed:, child:, menuChildren:)` | both | `split-button` | when material_ui ships a split button |
| 6 | Floating and docked toolbar | No (only text-selection toolbars; `BottomAppBar` is the baseline bar) | Yes: `M3FloatingToolbar` and `M3DockedToolbar` (`toolbar.dart`) | both | `toolbar` | when material_ui ships a floating or docked toolbar |
| 7 | Wavy progress | No | Not built in v1 | n/a | n/a | n/a; use the plain progress indicators |
| 8 | Flexible app bar with a subtitle | No: `AppBar` and `FlexibleSpaceBar` have no subtitle | Not built in v1 | n/a | n/a | n/a; put the subtitle in the app bar title area as a second text line |

## Loading indicator (material_ui only)

- It needs `MaterialShapes`, `RoundedPolygon` and `MaterialShapeBorder`, which exist only in
  material_ui. `install-assets --parts loading-indicator` copies it only when the project uses
  material_ui; on a `flutter/material.dart` project it skips the file and reports why
  (`skipped` in the JSON).
- Under `flutter/material.dart` use `CircularProgressIndicator` (or `RefreshIndicator` for
  pull-to-refresh) and tell the user the Expressive indicator needs material_ui. Adding material_ui
  to a project is a dependency change: ask first.
- Behavior follows the Compose `LoadingIndicator`: seven shapes in a loop, a spring morph and a
  turning shape. Timing values are `[impl:]` comments in the file, never invented.
- Reduced motion (`MediaQuery.disableAnimations`) shows one still shape.
- Flutter allows the progress-bar semantics role only with a value, so the indeterminate indicator
  exposes just the `semanticLabel` you pass. Always pass one ("what is loading").
- Size stays between the guideline limits [site:/components/loading-indicator/guidelines]; the
  `size` assert enforces it.

## Button group (both imports)

- It is built from the official `FilledButton`, `OutlinedButton`, `ElevatedButton` and `IconButton`
  and reshapes them through the button themes, so it compiles and renders the same under
  `flutter/material.dart` and material_ui (no `// [material_ui]` line is needed).
- Standard: a pressed button widens and its neighbors give way with the fast spatial spring of the
  theme's motion scheme [token:md.comp.button-group.standard.small.pressed.item.width.motion.spring.stiffness];
  the neighbor that gives way is drawn narrower rather than laid out narrower, so labels never wrap.
- Connected: toggle buttons packed together; the pressed button squares its inner corners, a
  selected one (listed in `selected`) turns fully round. Pass the selected colors to the selected
  child yourself (for example `FilledButton` for selected, `FilledButton.tonal` for the rest).
- Size small only. The other sizes have tokens but need the matching button sizes first.
- No overflow menu: keep the buttons on one line.
- Reduced motion turns the width change off; the buttons' own shape morph is unaffected.
- Targets: each child button keeps its own minimum tap area (checked by
  `androidTapTargetGuideline` in the gallery test).

## FAB menu (both imports)

- `M3FabMenu(items:, icon:, closeIcon:)` holds two to six `M3FabMenuItem(icon:, label:, onPressed:)`
  (the assert enforces the count). Pass icon widgets from `M3Symbols` (`Icon(M3Symbols.add)`); the menu
  sizes and colors them. Match `colors` (primary, secondary, tertiary) to the FAB and set `fabSize`
  (baseline, medium, large) to the FAB size it replaces; the close button is always 56 dp.
- Place it at the trailing bottom corner: `Scaffold.floatingActionButton` (the Scaffold gives the 16 dp
  margin; the widget grows upward when open) or an `Align`. It is controlled with `expanded` and
  `onExpandedChanged`, or keeps its own state.
- Opening runs the Compose animations: the FAB morphs into the close button with the fast spatial
  spring, the items appear one after another (slow effects spring) with their own width and fade
  springs [impl: FloatingActionButtonMenu.kt:208, :342, :460]. Reduced motion shows the final state at once.
- Escape, the system back gesture and the toggle close it; focus stays on the toggle, Tab or Down goes to
  the top item and then down. Selecting an item closes it unless `closeOnSelect: false`.
- Accessible names: the toggle says "Toggle menu" (change `toggleLabel` to say what it holds) and exposes
  expanded or collapsed; each item's name is its label. Hidden items leave the semantics and focus order.
- Not built: the hover lift of the close button (level 4), scrolling of the items in a short window, the
  container transform of an item, the 16 dp bottom padding Compose adds (the Scaffold margin covers it).

## Split button (both imports)

- `M3SplitButton(onPressed:, child:, menuIcon:, menuLabel:, menuChildren:)` builds two official buttons
  and a `MenuAnchor`. Sizes extra small to extra large, styles filled, tonal, elevated and outlined.
  `menuIcon` is `Icon(M3Symbols.keyboardArrowDown)`; it turns 180 degrees while the menu is open.
- The inner corners grow when hovered, focused or pressed; with the menu open the trailing button is
  fully round and gets the pressed state layer [impl: SplitButton.kt:421]. The unselected menu icon sits
  off center by the optical offsets of the spec.
- `menuLabel` is required: the trailing button's name must say that more options exist and what they
  relate to ("More send options"). The button reports expanded or collapsed.
- The menu opens below the trailing button with a 4 dp gap, aligned to its start edge (the library
  default; Compose leaves menu placement to the caller).
- Motion: the site says the icon turns with the standard motion scheme but names no spring; the widget
  uses the standard scheme's default spatial spring. The shape morph uses the button's own shape
  animation (no spring token exists for it, so the library default stays; Compose uses the default
  effects spring, SplitButton.kt:697). Reduced motion removes both.
- Targets: each half is a button with the padded 48 dp tap target (checked by `androidTapTargetGuideline`).
  Pass your own `MenuController` (`menuController:`) to open or close the menu from code.

## Toolbars (both imports)

- `M3FloatingToolbar(children:, vertical:, colors:, floatingActionButton:)` hovers over the content,
  fully rounded, 64 dp tall (wide when vertical), 8 dp padding, 4 dp between items, elevation level 3
  from the token (Compose's defaults are lower, see toolbars.md). `colors` is `standard` or `vibrant`.
  The optional FAB sits 8 dp beside it (below when vertical); the widget themes the FAB to 56 dp with the
  toolbar's FAB colors. Keep margins of 16 dp (horizontal) or 24 dp (vertical) from the window edge
  yourself.
- `M3DockedToolbar(children:)` is full width, 64 dp tall, square, 16 dp end padding, no elevation: use it
  as `Scaffold.bottomNavigationBar` in place of the bottom app bar. Default arrangement is space between
  (Compose's default [impl: AppBar.kt:2355]); `spacing: M3DockedToolbar.fixedSpacing` centers the items
  32 dp apart [impl: AppBar.kt:2361].
- Children are your icon buttons (give each a `tooltip`, which is its accessible name), buttons or fields.
  The toolbar sets their content color and the selected colors of a toggled icon button. In a vibrant
  toolbar a filled or tonal icon button would take the vibrant content color too; give the one emphasized
  control its own `style`.
- Not built: scroll-away and collapse behavior, the overflow menu, the medium FAB size, the toolbar role
  of the web (a plain container on Flutter, as the guidance allows).

## Install

```
node "S/scripts/install-assets/index.mjs" <project> --platform flutter --parts tokens,button-group,fab-menu,split-button,toolbar,loading-indicator
```

The widgets import `../tokens.dart` and `../theme.dart`, so install `tokens` with them. Import the
file in the screen that uses the widget (verify's `asset-unused` flags a copied widget nothing imports).
