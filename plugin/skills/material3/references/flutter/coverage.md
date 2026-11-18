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
| 4 | FAB menu | No | Planned, not built yet | pending | pending | when material_ui ships a FAB menu |
| 5 | Split button | No | Planned, not built yet | pending | pending | when material_ui ships a split button |
| 6 | Floating and docked toolbar | No (only text-selection toolbars) | Planned, not built yet | pending | pending | when material_ui ships a floating or docked toolbar |
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

## Install

```
node "S/scripts/install-assets/index.mjs" <project> --platform flutter --parts tokens,button-group,loading-indicator
```

The widgets import `../tokens.dart` and `../theme.dart`, so install `tokens` with them. Import the
file in the screen that uses the widget (verify's `asset-unused` flags a copied widget nothing imports).
