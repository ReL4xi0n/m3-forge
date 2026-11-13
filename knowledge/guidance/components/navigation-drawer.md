---
title: Navigation drawer
kind: component
pages: [/components/navigation-drawer/overview, /components/navigation-drawer/specs, /components/navigation-drawer/guidelines, /components/navigation-drawer/accessibility]
tokenSets: [navigation-drawer]
expressive: false
fetched: 2026-11-13
---

## Summary

A navigation drawer is a side sheet holding a vertical list of destinations, plus optional
headers, section labels and dividers. It either stays on screen or opens from a menu button, and
exactly one destination is active. Since the M3 Expressive update (May 2025) the drawer is no
longer recommended: the expanded navigation rail covers almost the same ground and adapts better
across window sizes. Existing products may keep using it.

## Use it when

- Only in products that have not moved to Expressive; otherwise use an expanded navigation rail
  (see navigation-rail.md#summary).
- Five or more top-level destinations, or two or more levels of hierarchy.
- Fast jumps between unrelated destinations, or replacing a rail or bar on large screens.
- Choose the variant by window size:
  - Standard drawer: expanded, large and extra-large windows.
  - Modal drawer: compact and medium windows (allowed at any size).
- Avoid when:
  - Another primary navigation component is on the same screen (for example a navigation bar).
    The exception: a modal drawer opened from a navigation rail may repeat the rail's
    destinations if the levels of hierarchy are visually distinct.

## Anatomy

1. Sheet (container): a side sheet anchored to the start edge (left in LTR, right in RTL).
2. Headline (optional) at the top.
3. Section label (optional): short subheads that group destinations.
4. Divider (optional): full-width, between groups only.
5. Destination item: optional leading icon, required label, optional badge label at the end.
6. Active indicator: a pill behind the active item.
7. Scrim (modal only): covers the rest of the app behind the sheet.

## Variants

- Standard: sits beside the content in the layout. It can be permanently visible (quick switching,
  cannot be closed) or dismissible (opened and closed by a visible menu icon, good when content
  matters more or destinations change rarely).
- Modal: floats above the content with a scrim and does not change the layout grid. It is always
  opened from outside, usually a menu icon. It closes when an item is selected, the scrim is
  tapped, or the sheet is swiped toward its anchoring edge.
- A bottom drawer shape also exists in the tokens (top corners rounded)
  [token:md.comp.navigation-drawer.bottom.container.shape]; the current pages do not describe it.
- Changes from M2 (these predate M3 Expressive and are still current): rounded corners on the sheet's end edge, a pill-shaped
  active indicator instead of a rectangle, separate standard and modal variants, and new color
  mappings that work with dynamic color.

## Expressive

- Not part of M3 Expressive. The update marked the drawer as not recommended and points to the
  expanded navigation rail; there is no Expressive drawer.

## States and behavior

- Item states: enabled, hovered, focused, pressed; each item is active or inactive.
- The drawer's list scrolls on its own when destinations overflow; the page content behind it
  does not move.
- Enter and exit use the enter-and-exit transition pattern.
- Adaptive behaviour:
  - Compact: a modal drawer, or swap it for a navigation bar. On the web, below 320 CSS pixels
    [site:/components/navigation-drawer/guidelines] wide, switch to a navigation bar.
  - Medium and expanded: a modal drawer alone or opened from a navigation rail; a standard drawer
    fits single-pane layouts in expanded windows.
  - Large and extra-large (web on laptops and desktops): a standard drawer, or a rail that turns
    into a modal drawer.
  - Animate between components when the layout changes, for example a rail turning into a drawer
    on rotation.
- Labels: keep them short; truncate if they would overflow, but never wrap or shrink them.
- Icons: all items have icons or none do. Icons always come before the label.

## Measurements

Standard drawer. The values are material-web's (canonical). No token cited below differs on
another platform; the linter checks this, and a difference would need a `[differs:]` marker.

| Part | Value |
|---|---|
| Container width | 360dp [site:/components/navigation-drawer/specs] [token:md.comp.navigation-drawer.container.width] |
| Container height | 100% of the window [site:/components/navigation-drawer/specs] |
| Container corners | 16dp on the end corners [site:/components/navigation-drawer/specs] [token:md.sys.shape.corner.large] |
| Active indicator width | 336dp [site:/components/navigation-drawer/specs] [token:md.comp.navigation-drawer.active-indicator.width] |
| Active indicator height | 56dp [site:/components/navigation-drawer/specs] [token:md.comp.navigation-drawer.active-indicator.height] |
| Active indicator corners | 28dp [site:/components/navigation-drawer/specs] |
| Padding around the indicator | 12dp [site:/components/navigation-drawer/specs] |
| Space between items | 0dp [site:/components/navigation-drawer/specs] |
| Icon size | 24dp [site:/components/navigation-drawer/specs] [token:md.comp.navigation-drawer.icon.size] |

- The container shape token is the large corner on the end side
  [token:md.comp.navigation-drawer.container.shape]. The indicator token is fully rounded
  [token:md.comp.navigation-drawer.active-indicator.shape]; the site prints that pill's corner
  as half its height.
- Labels are start-aligned.
- Modal drawer: the specs page gives no separate measurements [NOT FOUND].

## Typography

- Destination label: label large [token:md.comp.navigation-drawer.label-text.font].
- Headline: title small [token:md.comp.navigation-drawer.headline.font].
- Badge label: label large [token:md.comp.navigation-drawer.large-badge-label.font].
- Flutter stores these under `.type` ids, for example
  [token:md.comp.navigation-drawer.label-text.type].

## Color roles and state layers

- Container: surface for the standard drawer [token:md.comp.navigation-drawer.standard.container.color],
  surface container low for the modal drawer [token:md.comp.navigation-drawer.modal.container.color].
- Elevation: standard level 0 [token:md.comp.navigation-drawer.standard.container.elevation],
  modal level 1 [token:md.comp.navigation-drawer.modal.container.elevation].
- Active item: indicator secondary container [token:md.comp.navigation-drawer.active-indicator.color];
  icon and label on secondary container [token:md.comp.navigation-drawer.active.icon.color]
  [token:md.comp.navigation-drawer.active.label-text.color].
- Inactive item: icon and label on surface variant [token:md.comp.navigation-drawer.inactive.icon.color]
  [token:md.comp.navigation-drawer.inactive.label-text.color]; on hover, focus and press they darken
  to on surface [token:md.comp.navigation-drawer.inactive.hover.icon.color].
- Headline and badge label: on surface variant [token:md.comp.navigation-drawer.headline.color]
  [token:md.comp.navigation-drawer.large-badge-label.color].
- Focus ring: secondary [token:md.comp.navigation-drawer.focus.indicator.color].
- State layers:
  - hovered 8% [token:md.comp.navigation-drawer.hover.state-layer.opacity];
  - focused 10% [token:md.comp.navigation-drawer.focus.state-layer.opacity];
  - pressed 10% [token:md.comp.navigation-drawer.pressed.state-layer.opacity].
- Scrim (material-web): neutral variant 20 [token:md.comp.navigation-drawer.scrim.color].
  Its opacity is 40% [token:md.comp.navigation-drawer.scrim.opacity].
- Dividers use the divider component's roles.

## Motion

- No drawer duration, easing or spring token exists [NOT FOUND].
- Compose: `ModalNavigationDrawer` opens with the default spatial spring and closes with the fast
  effects spring [impl:compose-material3/commonMain/androidx/compose/material3/NavigationDrawer.kt:354];
  `DismissibleNavigationDrawer` does the same
  [impl:compose-material3/commonMain/androidx/compose/material3/NavigationDrawer.kt:501].
- Flutter: the drawer settles over 246ms [impl:material_ui/packages/material_ui/lib/src/drawer.dart:66];
  `NavigationDrawer` animates item selection over
  500ms [impl:material_ui/packages/material_ui/lib/src/navigation_drawer.dart:170].

## Accessibility

- Assistive technology users must be able to move between destinations, select one, and get
  feedback that suits their input.
- Feedback: on tap the indicator appears, a ripple passes through it, and the icon fills and
  darkens. On hover a hover indicator appears; on click a ripple passes through. Icons get darker
  in a light theme and lighter in a dark theme.
- Initial focus lands on the first item.
- Keyboard: Tab lands on the first destination; arrow keys move between destinations; Space or
  Enter selects the focused destination and moves focus into the opened section where there is
  one.
- Selecting the scrim closes a modal drawer.
- The selected item uses a filled icon; the others use outlined icons. Keeping the same style
  hides which item is active.
- The accessible label is usually the destination name; add context when the visible text is
  vague (for example "Recent images" for "Recents"). MDC-Android Views cannot set a more
  descriptive label and do not announce the role.

## Platform mapping

- Jetpack Compose (material3 1.5.0-rc01): `ModalNavigationDrawer`, `DismissibleNavigationDrawer`,
  `PermanentNavigationDrawer`, with sheets `ModalDrawerSheet`, `DismissibleDrawerSheet`,
  `PermanentDrawerSheet` and items `NavigationDrawerItem` (with a `badge` slot). State:
  `rememberDrawerState`, `DrawerValue`.
- Flutter (`material_ui` 1.11.0): `NavigationDrawer` with `NavigationDrawerDestination` (M3 style),
  hosted by `Scaffold.drawer`; `Drawer` and `DrawerController` are the underlying sheet and
  gesture handling.
- Web: no maintained official component. Because the drawer is not recommended, prefer our
  Phase 3 expanded navigation rail; any CSS drawer uses the material-web values above.

## Pitfalls

- Adopting the drawer in a new Expressive design instead of the expanded navigation rail.
- Showing a drawer and a navigation bar together.
- Dividers between single destinations instead of between groups.
- Icons on some items but not others.
- Wrapped or shrunk labels.
- Modal drawers that cannot be closed by tapping the scrim or swiping.
- Scrolling the page content when the drawer list scrolls.
