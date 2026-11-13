---
title: FAB menu
kind: component
pages: [/components/fab-menu/overview, /components/fab-menu/specs, /components/fab-menu/guidelines, /components/fab-menu/accessibility]
tokenSets: [fab-menu, fab-menu.primary, fab-menu.secondary, fab-menu.tertiary, fab-menu.primary-container, fab-menu.secondary-container, fab-menu.tertiary-container]
expressive: true
fetched: 2026-11-13
---

## Summary

A FAB menu unfolds from a FAB to offer two to six related actions in large, colorful pills. When
it opens, the FAB turns into the menu's close button in the same spot. It is new in M3 Expressive
(May 2025), has one size that works with every FAB size, and replaces the M2 speed dial and any
stack of small FABs. For the FAB itself see floating-action-button.md#summary.

## Use it when

- The FAB's action naturally splits into a few closely related kinds (for example several ways to
  share or to create).
- You need between two and six items, all under one theme.
- Avoid when:
  - The trigger is an extended FAB or any other component; a FAB menu opens only from a FAB.
  - There is only one item, or the items are unrelated.
  - The FAB sits beside a floating toolbar or inside a navigation rail; the menu would add clutter.

## Anatomy

1. Close button. Takes the place of the FAB while the menu is open.
2. Menu items. Each is a rounded pill with an icon and a label text.

## Variants

- One variant, in three color sets: primary, secondary, tertiary.
- Match the set to the FAB that opens it:
  - Primary set for a primary or primary container FAB.
  - Secondary set for a secondary or secondary container FAB.
  - Tertiary set for a tertiary or tertiary container FAB.
- Items: label text is required. Keep the icon too; drop it only when you must, since it helps
  people tell items apart.

## Expressive

- The whole component is Expressive-only. Its M2 predecessor, the speed dial, used small round
  FABs; the FAB menu uses larger items and dynamic color.
- Close button and items use contrasting colors so the menu draws focus.
- The FAB morphs into the close button (shape, size and icon change) as the items appear.

## States and behavior

- Close button and items each have enabled, hovered, focused and pressed states.
- Alignment: anchored to the trailing edge of the window. In right-to-left languages it moves to
  the left edge and each item mirrors its icon and label.
- The menu stays anchored to the same corner or edge at every window size; pair it with the FAB
  size that suits the window (larger FABs for larger windows).
- Items hug their content: no fixed widths, no stretched containers, no truncated labels, and no
  shape changes (all elements stay fully rounded).
- Scrolling: in short windows (a phone in landscape, for example) the items may scroll, passing
  behind the close button, which must stay unobstructed.
- Any item may expand into a new surface with a container transform.
- Web: the FAB opens a standard menu component instead, inheriting the menu's states and specs.

## Measurements

The values are material-web's (canonical). No token cited in this note differs on another
platform; the linter checks this, and a difference would need a `[differs:]` marker.

| Element | Value |
|---|---|
| Close button size | 56dp [site:/components/fab-menu/specs] [token:md.comp.fab-menu.close-button.container.width] |
| Close button icon | 20dp [token:md.comp.fab-menu.close-button.icon.size] |
| Close button shape | full [token:md.comp.fab-menu.close-button.container.shape] |
| Gap between close button and items | 8dp [token:md.comp.fab-menu.close-button.between-space] |
| Item height | 56dp [token:md.comp.fab-menu.menu-item.container.height] |
| Item shape | full [token:md.comp.fab-menu.menu-item.container.shape] |
| Item start and end padding | 24dp [token:md.comp.fab-menu.menu-item.leading-space] |
| Item icon | 24dp [token:md.comp.fab-menu.menu-item.icon.size] |
| Item icon–label gap | 8dp [token:md.comp.fab-menu.menu-item.icon-label-space] |
| Gap between items | 4dp [token:md.comp.fab-menu.menu-item.between-space] |

- The close button is always 56dp [site:/components/fab-menu/specs]
  [token:md.comp.fab-menu.close-button.container.height], whatever the FAB size. Items follow the
  medium button measurements.
- Placement on compact screens:
  - The FAB keeps 16dp [site:/components/fab-menu/specs] margins.
  - The close button and the FAB share the FAB's top trailing corner as anchor.
  - From a medium FAB, the menu sits 40dp [site:/components/fab-menu/specs] above the bottom edge.
  - From a large FAB, the menu sits 56dp [site:/components/fab-menu/specs] above the bottom edge.
- On large and extra large windows, FAB and menu margins grow from 16dp [site:/components/fab-menu/guidelines]
  to 24dp [site:/components/fab-menu/guidelines].
- Web: the gap between the FAB and its menu may vary; 4dp [site:/components/fab-menu/specs] is the
  recommendation.
- Compose's FAB menu uses compose-only ids (`md.comp.fab-menu-baseline.*`, listed under
  `FabMenuBaselineTokens`), so the `md.comp.fab-menu.*` ids show NOT FOUND for Compose.

## Typography

- Item label: title medium [token:md.comp.fab-menu.menu-item.label-text]. This token exists only
  in Flutter's data; material-web and Compose define no FAB-menu label token [NOT FOUND].
  Compose's code sets `MaterialTheme.typography.titleMedium` for items
  (FloatingActionButtonMenu.kt:408).

## Color roles and state layers

Color set → close button (container / icon) and items (container / icon and label):

- Primary: close button primary [token:md.comp.fab-menu.primary.close-button.container.color] /
  on primary [token:md.comp.fab-menu.primary.close-button.icon.color]; items primary container
  [token:md.comp.fab-menu.primary-container.list-item.container.color] / on primary container
  [token:md.comp.fab-menu.primary-container.list-item.label-text.color].
- Secondary: close button secondary [token:md.comp.fab-menu.secondary.close-button.container.color]
  / on secondary [token:md.comp.fab-menu.secondary.close-button.icon.color]; items secondary
  container [token:md.comp.fab-menu.secondary-container.list-item.container.color] / on secondary
  container [token:md.comp.fab-menu.secondary-container.list-item.label-text.color].
- Tertiary: close button tertiary [token:md.comp.fab-menu.tertiary.close-button.container.color] /
  on tertiary [token:md.comp.fab-menu.tertiary.close-button.icon.color]; items tertiary container
  [token:md.comp.fab-menu.tertiary-container.list-item.container.color] / on tertiary container
  [token:md.comp.fab-menu.tertiary-container.list-item.label-text.color].

State layers (in the icon/label color):

- Hovered: 8% [token:md.comp.fab-menu.primary.close-button.hovered.state-layer.opacity].
- Focused: 10% [token:md.comp.fab-menu.primary.close-button.focused.state-layer.opacity].
- Pressed: 10% [token:md.comp.fab-menu.primary.close-button.pressed.state-layer.opacity].
- Items use the same opacities [token:md.comp.fab-menu.primary-container.list-item.hovered.state-layer.opacity].
- The close button is raised; hover lifts it to level 4
  [token:md.comp.fab-menu.primary.close-button.hovered.container.elevation].

## Motion

- Opening: the FAB transforms into the close button, and the items enter with the enter and exit
  transition. The motion starts from one of the FAB's trailing corners, preferably the top one.
- No FAB-menu duration, easing or spring token exists [NOT FOUND].
- Compose:
  - Items appear one after another with a stagger driven by the slow effects spring
    [impl:compose-material3/commonMain/androidx/compose/material3/FloatingActionButtonMenu.kt:208]:
    damping 1, stiffness 800 [token:md.sys.motion.spring.slow.effects.damping]
    [token:md.sys.motion.spring.slow.effects.stiffness].
  - Each item's width uses the fast spatial spring and its fade the fast effects spring
    [impl:compose-material3/commonMain/androidx/compose/material3/FloatingActionButtonMenu.kt:342]
    [impl:compose-material3/commonMain/androidx/compose/material3/FloatingActionButtonMenu.kt:343].
  - `ToggleFloatingActionButton` morphs the FAB into the close button (size, corner radius and icon
    size) with the fast spatial spring
    [impl:compose-material3/commonMain/androidx/compose/material3/FloatingActionButtonMenu.kt:460]:
    damping 0.9, stiffness 1400 in the standard scheme
    [token:md.sys.motion.spring.fast.spatial.damping]
    [token:md.sys.motion.spring.fast.spatial.stiffness]; damping 0.6, stiffness 800 in the
    expressive scheme.

## Accessibility

- People must be able to move through the menu and act on it, with focus always in the right
  place.
- Every element meets the 48dp [site:/components/fab-menu/accessibility] minimum target, with
  enough spacing by default.
- Focus: when the menu opens, focus stays on the close button (where the FAB was), then moves
  from the top item down to the bottom one.
- Keyboard: Tab moves to the next element; Space or Enter activates the focused button or item.
- Android:
  - Close button: label "Toggle menu", button role, and an expanded or collapsed state.
  - Items: the accessible name repeats the visible text ("Reply all"), with the button role.
- Web: the FAB plus menu follow the FAB and menu guidance. The FAB's accessible name says which
  menu it opens.
- On the web, do not let the menu fully hide another control's focus indicator; partial overlap
  is fine.

## Platform mapping

- Jetpack Compose (material3 1.5.0-rc01): `FloatingActionButtonMenu` with
  `FloatingActionButtonMenuItem` inside its scope, opened by `ToggleFloatingActionButton`.
  `ToggleFloatingActionButtonDefaults` gives `containerSize()`, `containerSizeMedium()`,
  `containerSizeLarge()`, the matching corner radius and icon size functions, and
  `Modifier.animateIcon(...)`.
  - The menu pads itself 16dp [impl:compose-material3/commonMain/androidx/compose/material3/FloatingActionButtonMenu.kt:738]
    from the side.
- Flutter (`material_ui` 1.11.0): no FAB menu. It is one of our Phase 3 gap components, built from
  official FABs and our tokens and protected by golden tests.
- Web: no maintained official component (the site marks the web version unavailable). On the web
  the pattern is a FAB that opens a menu; our CSS version is built in Phase 3 from the
  material-web token values above.

## Pitfalls

- Opening the menu from an extended FAB or from anything other than a FAB.
- One item, more than six, or unrelated items.
- Using it next to a floating toolbar or navigation rail.
- Removing labels, truncating them, fixing item widths or changing item shapes.
- Mismatched color sets (a tertiary FAB opening a primary menu).
- Letting scrolling items cover the close button in short windows.
- A close button with no expanded/collapsed state for screen readers on Android.
