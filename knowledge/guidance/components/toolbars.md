---
title: Toolbars
kind: component
pages: [/components/toolbars/overview, /components/toolbars/specs, /components/toolbars/guidelines, /components/toolbars/accessibility]
tokenSets: [toolbar.docked, toolbar.floating, toolbar.standard, toolbar.vibrant, docked-toolbar, floating-toolbar, bottom-app-bar]
expressive: true
fetched: 2026-11-13
---

## Summary

A toolbar is a container of slots holding the actions for the current page: icon buttons,
buttons, text fields, images or custom controls. M3 Expressive introduced two variants. The
docked toolbar spans the bottom of the window and replaces the bottom app bar; the floating
toolbar hovers over the content, horizontally or vertically, and can be paired with a FAB. Both
come in a standard (quiet) and a vibrant (emphasized) color style.

## Use it when

- A page has actions, especially more than an app bar's one or two.
- Docked toolbar: global actions that stay the same across several pages.
- Floating toolbar: contextual actions tied to the page or the content under it. It can also act
  as local navigation between related sub-pages (like tabs), as long as it does not repeat the
  main navigation.
- Color style:
  - Standard: low emphasis, keeps attention on the content.
  - Vibrant: high emphasis on the controls, or a signal that the page is in a temporary mode such
    as editing.
- Avoid when:
  - A navigation bar is on screen. Both live at the bottom; show the navigation bar on top-level
    pages and a toolbar on deeper pages.
  - You would show a navigation bar and a toolbar with navigation controls in the same view.

## Anatomy

1. Container.
2. Elements placed in its slots (most often icon buttons, buttons and text fields).
3. Optional FAB next to a floating toolbar.
4. Optional overflow menu in the trailing slot for actions that do not fit.

## Variants

- Docked toolbar: full width, at the bottom of the window, square corners. On the web and large
  screens it may be rounded, placed elsewhere on the page, and organized with dividers.
- Floating toolbar:
  - Horizontal (default) or vertical. Vertical toolbars suit larger windows and sit on the side
    opposite the navigation rail; with a rail present, use the rail's centered configuration.
  - With FAB: one high-priority action beside the toolbar. Compose builds this pairing in; other
    platforms place the two components separately.
- Color: standard (default) or vibrant, for either variant.
- Bottom app bar (baseline): still available but not recommended; use the docked toolbar.

## Expressive

- The docked and floating toolbars are Expressive additions (May 2025).
- The docked toolbar is shorter than the bottom app bar and more flexible in layout and content.
- The floating toolbar adds horizontal and vertical layouts, room for many element types, and FAB
  pairing.
- Color mappings were redone for dynamic color.
- Changes from M2 (bottom app bar): M2 used 8dp [site:/components/toolbars/overview] elevation
  and kept the FAB outside the bar; M3 removed elevation and shadow, made the container taller,
  and put the FAB inside it.

## States and behavior

- The toolbar itself is not interactive; states belong to the elements in it.
- Emphasis: highlight at most one action, by a filled or tonal icon button style, custom color
  roles on one action, a wide icon button, or a FAB. Never emphasize a button and a FAB together.
- Keep the control types consistent. Avoid square icon buttons in a floating toolbar (they clash
  with its round container); the docked toolbar may use them. Vertical toolbars avoid wide icon
  buttons.
- The floating toolbar must stay fully on screen and inside its window or pane. Put extra
  actions in an overflow menu.
- Floating toolbars are elevated by default; drop the elevation when the content behind is
  already visually distinct.
- Scrolling:
  - Docked: stays put or animates off screen.
  - Floating: stays put, animates off screen, or collapses into one high-emphasis action (on
    Compose, into the FAB or a key action). Do not collapse and scroll away at once.
- Resizing:
  - Docked: always 100% of the width [site:/components/toolbars/guidelines]. Compact windows space
    items evenly; medium and up center everything, or center a key action and push the rest to the
    edges. Shrink the height and use extra small buttons only when vertical space is tight.
  - Floating: only as large as its items, up to the outer margin. Larger windows reveal more
    actions; the width can be capped to hide more. Trailing actions fold into the overflow menu on
    small windows.
  - Vertical toolbars are not recommended in compact windows except on simple screens with few
    controls. Use only one toolbar in compact windows; larger windows may use several, styled to
    show their different roles.
- Right-to-left: mirror icons and text direction; reverse the order of actions when order
  carries meaning (for example keep Next on the trailing edge).

## Measurements

The values are material-web's (canonical). Compose keeps these values under
`docked-toolbar.*` and `floating-toolbar.*` ids (for example its docked height
64dp [token:md.comp.docked-toolbar.container-height]).

| | Docked | Floating |
|---|---|---|
| Height (horizontal) | 64dp [site:/components/toolbars/specs] [token:md.comp.toolbar.docked.container.height] | 64dp [token:md.comp.toolbar.floating.horizontal.container.height] |
| Width (vertical) | not applicable | 64dp [token:md.comp.toolbar.floating.vertical.container.width] |
| Leading padding | 16dp [token:md.comp.toolbar.docked.container.leading-space] | 8dp [token:md.comp.toolbar.floating.container.leading-space] |
| Trailing padding | 16dp [token:md.comp.toolbar.docked.container.trailing-space] | 8dp [token:md.comp.toolbar.floating.container.trailing-space] |
| Space between items | 4dp min [token:md.comp.toolbar.docked.container.min-spacing], 32dp max [token:md.comp.toolbar.docked.container.max-spacing] | 4dp [token:md.comp.toolbar.floating.container.between-space] |
| Margin from the window edge | not applicable | horizontal 16dp [token:md.comp.toolbar.floating.horizontal.container.external-space], vertical 24dp [token:md.comp.toolbar.floating.vertical.container.external-space] |
| Corners | none [token:md.comp.toolbar.docked.container.shape] | fully rounded [token:md.comp.toolbar.floating.container.shape] |

- Site guidance:
  - Every toolbar defaults to 64dp [site:/components/toolbars/specs] tall, centered, with equal
    spacing and at least 16dp [site:/components/toolbars/specs] of outside padding.
  - In the docked toolbar, 32dp [site:/components/toolbars/guidelines] between items is only the
    default; any arrangement works as long as the ends keep 16dp [site:/components/toolbars/guidelines].
  - A centered layout example uses 8dp [site:/components/toolbars/specs] between items.
  - Horizontal floating toolbars keep at least 16dp [site:/components/toolbars/guidelines] from the
    window edge; vertical ones at least 24dp [site:/components/toolbars/guidelines].
- FAB paired with a floating toolbar:
  - Gap to the toolbar 8dp [token:md.comp.toolbar.floating.fab.between-space].
  - Default FAB 56dp [token:md.comp.toolbar.floating.fab.container.width] square with a
    24dp [token:md.comp.toolbar.floating.fab.icon.size] icon and large corners
    [token:md.comp.toolbar.floating.fab.container.shape].
  - Medium FAB 80dp [token:md.comp.toolbar.floating.fab.medium.container.width] square with a
    28dp [token:md.comp.toolbar.floating.fab.medium.icon.size] icon.
- Bottom app bar (baseline): 80dp [token:md.comp.bottom-app-bar.container.height] tall (material-web
  also lists 72dp [token:md.comp.bottom-app-bar.with-fab.container.height] with a FAB), square corners
  [token:md.comp.bottom-app-bar.container.shape].

## Typography

- No toolbar type token exists [NOT FOUND]. Text inside comes from the placed components (button
  labels, text fields); see buttons.md#typography.

## Color roles and state layers

Standard:

- Container surface container [token:md.comp.toolbar.standard.container.color].
- Icons and labels on surface variant [token:md.comp.toolbar.standard.icon.color]
  [token:md.comp.toolbar.standard.label-text.color].
- Selected (toggle) button: secondary container [token:md.comp.toolbar.standard.selected.button.container.color]
  with on secondary container content [token:md.comp.toolbar.standard.selected.icon.color].
- The site's example: a filled button in primary and on primary, a tonal toggle in secondary
  container, and standard icon buttons in primary.

Vibrant:

- Container primary container [token:md.comp.toolbar.vibrant.container.color].
- Icons and labels on primary container [token:md.comp.toolbar.vibrant.icon.color]
  [token:md.comp.toolbar.vibrant.label-text.color].
- Selected button: surface container [token:md.comp.toolbar.vibrant.selected.button.container.color]
  with on surface content [token:md.comp.toolbar.vibrant.selected.icon.color].

FAB paired with a floating toolbar: secondary container
[token:md.comp.toolbar.floating.fab.standard.container.color] for standard, tertiary container
[token:md.comp.toolbar.floating.fab.vibrant.container.color] for vibrant.

State layers (in the content color):

- hovered 8% [token:md.comp.toolbar.standard.hovered.state-layer.opacity];
- focused 10% [token:md.comp.toolbar.standard.focused.state-layer.opacity];
- pressed 10% [token:md.comp.toolbar.standard.pressed.state-layer.opacity];
- disabled icons and labels: on surface at 38% [token:md.comp.toolbar.standard.disabled.icon.opacity].
- The vibrant style uses the same opacities [token:md.comp.toolbar.vibrant.hovered.state-layer.opacity].

Elevation: the floating toolbar token is level 3 [token:md.comp.toolbar.floating.container.elevation].
Compose's defaults are lower: level 0 alone, level 1 when expanded next to a FAB (TODO comments in
`FloatingToolbarDefaults` say these are not yet read from tokens). The bottom app bar uses surface
container [token:md.comp.bottom-app-bar.container.color].

## Motion

- No toolbar duration, easing or spring token exists [NOT FOUND].
- Compose:
  - Floating toolbars expand and collapse with `FloatingToolbarDefaults.animationSpec()`, the fast
    spatial spring [impl:compose-material3/commonMain/androidx/compose/material3/FloatingToolbar.kt:698].
  - `FloatingToolbarDefaults.exitAlwaysScrollBehavior` snaps with the default effects spring
    [impl:compose-material3/commonMain/androidx/compose/material3/FloatingToolbar.kt:725].
  - The docked toolbar (`FlexibleBottomAppBar`) and `BottomAppBar` snap on scroll with the fast
    spatial spring [impl:compose-material3/commonMain/androidx/compose/material3/AppBar.kt:2368].
- Fast spatial spring values: standard scheme damping 0.9, stiffness 1400
  [token:md.sys.motion.spring.fast.spatial.damping] [token:md.sys.motion.spring.fast.spatial.stiffness];
  expressive scheme damping 0.6, stiffness 800.

## Accessibility

- Assistive technology users must be able to reach and activate every action, open menus,
  activate a back button, and keep access to the controls when content scrolls or the toolbar
  collapses.
- Initial focus lands on the first interactive element; Tab or the arrow keys move on; Space or
  Enter activates.
- Every element needs a target of at least 48 × 48dp [site:/components/toolbars/guidelines].
- On the web, give the container the `toolbar` role; on mobile it may be a plain container. Each
  placed control follows its own accessibility rules.
- Compose keeps a floating toolbar expanded while a touch-exploration service (screen reader) is
  on [impl:compose-material3/commonMain/androidx/compose/material3/FloatingToolbar.kt:197].

## Platform mapping

- Jetpack Compose (material3 1.5.0-rc01):
  - Floating: `HorizontalFloatingToolbar`, `VerticalFloatingToolbar` (each with an overload that
    takes `floatingActionButton`), `FloatingToolbarDefaults.standardFloatingToolbarColors` /
    `vibrantFloatingToolbarColors`, `FloatingToolbarDefaults.exitAlwaysScrollBehavior`,
    `FloatingToolbarHorizontalFabPosition`, `FloatingToolbarVerticalFabPosition`.
  - Docked: `FlexibleBottomAppBar`, whose height default reads the docked-toolbar tokens.
  - Baseline: `BottomAppBar`.
- Flutter (`material_ui` 1.11.0): only `BottomAppBar` (the baseline bar). No docked or floating
  toolbar widget exists, although Flutter's token data includes the toolbar sets. We supply both
  toolbars in Phase 3.
- Web: no maintained official component. Our CSS toolbars are built in Phase 3 from the
  material-web token values above, with `role="toolbar"`.

## Pitfalls

- A toolbar and a navigation bar on screen together.
- Rounded corners on a docked toolbar on mobile, or a floating toolbar running off the window.
- Too many controls, or many different control types in one toolbar.
- Emphasizing more than one action (for example a filled button and a FAB).
- Square icon buttons in a floating toolbar; wide icon buttons in a vertical one.
- Vertical toolbars or several toolbars in compact windows.
- Padding a floating toolbar wider than its contents need.
- Collapsing and scrolling away at the same time.
