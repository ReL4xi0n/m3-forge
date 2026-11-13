---
title: Navigation rail
kind: component
pages: [/components/navigation-rail/overview, /components/navigation-rail/specs, /components/navigation-rail/guidelines, /components/navigation-rail/accessibility]
tokenSets: [nav-rail.collapsed, nav-rail.expanded, nav-rail.item, navigation-rail]
expressive: true
fetched: 2026-11-13
---

## Summary

A navigation rail is a vertical strip on the leading edge of the window that holds the main
destinations, optionally with a menu button and a FAB above them. M3 Expressive replaced the
baseline rail with two matching rails that turn into each other through the menu button: the
collapsed rail (icons with labels underneath) and the expanded rail (icons with labels beside
them, wide enough to replace the navigation drawer).

## Use it when

- Medium, expanded, large or extra-large windows (tablets, foldables, desktop).
- Collapsed rail: three to seven destinations, always visible.
- Expanded rail: more destinations or secondary destinations, opened from a menu icon. It
  replaces the navigation drawer.
  - Standard (non-modal): placed beside the content; best when there is plenty of width.
  - Modal: overlaps the content; for dense layouts, limited space, or many destinations.
  - In immersive screens the expanded rail can stay hidden until the menu icon is used.
- In medium windows with few destinations, a navigation bar may serve better. Compact windows use a
  navigation bar, or a modal expanded rail opened from a menu button.
- Avoid when:
  - Another primary navigation component (a navigation bar) is on screen at the same time.
  - You want horizontal navigation; use a navigation bar.

## Anatomy

1. Container (its fill may be turned off).
2. Menu button (optional): toggles between collapsed and expanded; its icon changes to show the
   rail can collapse again.
3. FAB or extended FAB (optional), top-aligned above the destinations.
4. Navigation item: icon, label and active indicator.
5. Active indicator.
6. Badges (optional): small dot, or large badge with a label.
7. Divider (optional): a vertical line on the edge next to the content.

## Variants

- Collapsed rail: vertical items (label under the icon). Replaces the baseline rail.
- Expanded rail: horizontal items (label beside the icon); the active indicator hugs the label.
  To mimic the old drawer, the indicator can be overridden to fill the width.
- Expanded rail configurations:
  - Layout: standard (default) or modal.
  - Behaviour when closed: transition back to the collapsed rail, or hide entirely.
- Baseline rail (not recommended): narrower, with a menu, FAB and optional labels.
- Common layouts: items alone, with a menu, with a FAB, with both, with or without labels.

## Expressive

- May 2025: the collapsed and expanded rails arrived; the baseline rail is no longer recommended
  and the expanded rail stands in for the navigation drawer.
- The two rails share one visual language so they can morph into each other on any device,
  including phones in portrait.
- Predictive back is supported for the modal expanded rail on Android: the rail lifts off the
  window edge as the gesture previews the previous screen.
- Vertical items now color the active label secondary (it used to be on surface variant).
- Changes from M2: a pill-shaped active indicator instead of icon color and weight alone, and new
  color mappings for dynamic color.

## States and behavior

- Item states: enabled, hovered, focused, pressed, each on an active or inactive item.
- Selecting a destination uses a top-level transition; the icon fills and the indicator grows
  from the icon's center.
- The touch target of every item spans the full rail width, even where the item hugs its content.
- Placement:
  - Always on the leading edge (left in LTR, right in RTL), outside any panes, never inside body
    content.
  - Destinations group at the top or in the center; center them on tablets for reach. The menu
    and FAB always stay at the top.
  - A FAB nested in the rail rests at elevation level 0.
  - A logo at the top is allowed if it cannot be mistaken for a button; never use it to expand
    the rail.
- Expanding: page content resizes to fit, the rail's contents grow (the FAB becomes an extended
  FAB), and extra destinations may appear.
- Scrolling: destinations stay fixed during vertical scrolling. With horizontal scrolling the rail
  may stay or scroll away; mark the boundary with a divider or elevation level 1.
- Resizing: a rail may turn into a navigation bar on small windows; never show both.
- Badges: on the icon's top corner in the collapsed rail, next to the label in the expanded rail.
- Labels: one word each. Avoid wrapping; if unavoidable, break between words or hyphenate. Never
  truncate or shrink them.

## Measurements

Collapsed and expanded rails. The values are material-web's (canonical). Compose keeps these
values under `navigation-rail-collapsed.*`, `navigation-rail-expanded.*` and
`navigation-rail-*-item.*` ids.

| | Collapsed | Expanded |
|---|---|---|
| Container width | 96dp [token:md.comp.nav-rail.collapsed.container.width] | 220dp minimum [token:md.comp.nav-rail.expanded.container.width.minimum] |
| Narrow / maximum width | 80dp narrow [token:md.comp.nav-rail.collapsed.narrow.container.width] | 360dp maximum [token:md.comp.nav-rail.expanded.container.width.maximum] |
| Top space | 44dp [token:md.comp.nav-rail.collapsed.top-space] | 44dp [token:md.comp.nav-rail.expanded.top-space] |
| Space between items | 4dp [token:md.comp.nav-rail.collapsed.item.vertical-space] | 0dp [token:md.comp.nav-rail.expanded.between-item-space] |
| Active indicator height | 32dp [token:md.comp.nav-rail.item.vertical.active-indicator.height] | 56dp [token:md.comp.nav-rail.item.horizontal.active-indicator.height] |
| Active indicator width | 56dp [token:md.comp.nav-rail.item.vertical.active-indicator.width] | hugs the content [NOT FOUND] |
| Icon–label gap | 4dp [token:md.comp.nav-rail.item.vertical.icon-label-space] | 8dp [token:md.comp.nav-rail.item.horizontal.icon-label-space] |
| Item side padding | 16dp [token:md.comp.nav-rail.item.vertical.leading-space] | 16dp [token:md.comp.nav-rail.item.horizontal.full-width.leading-space] |

- Icon size 24dp [token:md.comp.nav-rail.item.icon.size].
- Item height 64dp [token:md.comp.nav-rail.item.container.height]; a short item is
  56dp [token:md.comp.nav-rail.item.short.container.height].
- Minimum space below the header (menu and FAB): 40dp [token:md.comp.nav-rail.item.header-space-minimum].
- Expanded rail trailing space for vertical content (material-web only):
  20dp [token:md.comp.nav-rail.expanded.vertical.trailing-space].
- Container corners: none for the collapsed and standard expanded rails
  [token:md.comp.nav-rail.collapsed.container.shape]; the modal expanded rail uses the large
  corner, 16dp [token:md.comp.nav-rail.expanded.modal.container.shape].
- Indicator: fully rounded [token:md.comp.nav-rail.item.active-indicator.shape].

Baseline rail (not recommended):

- Width 80dp [token:md.comp.navigation-rail.container.width].
- Indicator 56dp [token:md.comp.navigation-rail.active-indicator.width] wide and
  32dp [token:md.comp.navigation-rail.active-indicator.height] tall; without labels the indicator is
  56dp [token:md.comp.navigation-rail.no-label.active-indicator.height] tall.
- Icons 24dp [token:md.comp.navigation-rail.icon.size].
- Small badge 6dp [token:md.comp.navigation-rail.badge.size]; large badge 16dp [token:md.comp.navigation-rail.large-badge.size] tall.

## Typography

- Collapsed rail (vertical items): label medium [token:md.comp.nav-rail.item.vertical.label-text.font].
- Expanded rail (horizontal items): label large [token:md.comp.nav-rail.item.horizontal.label-text.font].
- These two ids exist only in Flutter's data; material-web's `nav-rail` set defines no label font
  [NOT FOUND]. Compose's ids are `navigation-rail-vertical-item.label-text-font` (label medium)
  [token:md.comp.navigation-rail-vertical-item.label-text-font] and
  `navigation-rail-horizontal-item.label-text-font` (label large)
  [token:md.comp.navigation-rail-horizontal-item.label-text-font].
- Baseline rail: label medium [token:md.comp.navigation-rail.label-text.font]; active labels use the
  prominent weight [token:md.comp.navigation-rail.active.label-text.weight]. Large badge label:
  label small [token:md.comp.navigation-rail.large-badge-label.font].

## Color roles and state layers

- Container: surface for the collapsed rail [token:md.comp.nav-rail.collapsed.container.color] and
  standard expanded rail [token:md.comp.nav-rail.expanded.container.color]; surface container for
  the modal expanded rail [token:md.comp.nav-rail.expanded.modal.container.color], at elevation
  level 2 [token:md.comp.nav-rail.expanded.modal.container.elevation].
- Active item: indicator secondary container [token:md.comp.nav-rail.item.active.indicator.color],
  icon on secondary container [token:md.comp.nav-rail.item.active.icon.color], label secondary
  [token:md.comp.nav-rail.item.active.label-text.color]. The site notes that horizontal items
  (inside the indicator) use on secondary container for the label instead.
- Inactive item: icon and label on surface variant [token:md.comp.nav-rail.item.inactive.icon.color]
  [token:md.comp.nav-rail.item.inactive.label-text.color].
- Badges: error, with on error for the label (see the badge component).
- State layers use on secondary container [token:md.comp.nav-rail.item.active.hovered.state-layer.color]:
  - hovered 8% [token:md.comp.nav-rail.item.active.hovered.state-layer.opacity];
  - focused 10% [token:md.comp.nav-rail.item.active.focused.state-layer.opacity];
  - pressed 10% [token:md.comp.nav-rail.item.active.pressed.state-layer.opacity].
- If the container fill is turned off, every item still needs at least 3:1 contrast.
- Baseline rail: container surface [token:md.comp.navigation-rail.container.color], active label on
  surface [token:md.comp.navigation-rail.active.label-text.color], state layers on surface
  [token:md.comp.navigation-rail.active.hover.state-layer.color]; menu icon on surface variant
  [token:md.comp.navigation-rail.menu.icon.color].

## Motion

- No navigation-rail duration, easing or spring token exists [NOT FOUND]. The site describes the
  collapse–expand morph and the indicator growing from the icon's center but gives no value.
- Compose:
  - `WideNavigationRail` animates its width with the default spatial spring, and the modal rail
    with the fast spatial spring [impl:compose-material3/commonMain/androidx/compose/material3/WideNavigationRail.kt:324].
  - The modal rail's open and close state uses the default spatial spring
    [impl:compose-material3/commonMain/androidx/compose/material3/WideNavigationRail.kt:732].
  - `WideNavigationRailItem` moves between top and start icon positions with the default spatial
    spring [impl:compose-material3/commonMain/androidx/compose/material3/NavigationItem.kt:492]; its
    indicator grows with the same spring
    [impl:compose-material3/commonMain/androidx/compose/material3/NavigationItem.kt:1229] and its
    label color changes with default effects
    [impl:compose-material3/commonMain/androidx/compose/material3/NavigationItem.kt:1212].
  - Baseline `NavigationRailItem`: indicator fade with default effects
    [impl:compose-material3/commonMain/androidx/compose/material3/NavigationRail.kt:239], size with
    fast spatial [impl:compose-material3/commonMain/androidx/compose/material3/NavigationRail.kt:245].
- Flutter: `NavigationRail` extends and collapses over `kThemeAnimationDuration`, which is
  200ms [impl:material_ui/packages/material_ui/lib/src/theme.dart:20], with `Curves.easeInOut`
  [impl:material_ui/packages/material_ui/lib/src/navigation_rail.dart:632].

## Accessibility

- Assistive technology users must be able to move between destinations, choose one, and get
  feedback suited to their input.
- Feedback: on tap the indicator appears, a ripple passes through it, the icon fills, and icon and
  text change color. Hover shows a hover state.
- The target area spans the full rail width in the expanded rail even though the indicator hugs
  the content.
- Filled icon for the active destination, outlined for the others; if no filled glyph exists, use
  the semibold weight. Do not use more than two colors across destinations.
- Text scaling: items grow taller and keep their padding; wrapping is fine. Labels stay fully
  visible up to 2x text size and may truncate beyond that.
- Initial focus lands on the first interactive element: the menu, the FAB or the first item.
- Keyboard: Tab or the arrow keys move between elements; from the menu or FAB, Tab enters the
  items. Space or Enter activates the focused element.
- Accessible labels normally match the visible label; add context when it is vague (for example
  "Recent images" for "Recent"). MDC-Android Views cannot set the extra label and do not announce
  the role.

## Platform mapping

- Jetpack Compose (material3 1.5.0-rc01):
  - Collapsed and expanded rails: `WideNavigationRail` with `WideNavigationRailItem`, state from
    `rememberWideNavigationRailState` (`WideNavigationRailValue.Collapsed` / `.Expanded`).
  - Modal expanded rail: `ModalWideNavigationRail` (with `hideOnCollapse` for the hidden
    behaviour).
  - Baseline: `NavigationRail` with `NavigationRailItem`.
- Flutter (`material_ui` 1.11.0): `NavigationRail` with `NavigationRailDestination`,
  `NavigationRailLabelType`, `extended` and `groupAlignment`. This is the baseline rail; there is
  no collapsed/expanded Expressive rail and no modal rail. We supply them in Phase 3.
- Web: no maintained official component. Our CSS rails are built in Phase 3 from the material-web
  token values above.

## Pitfalls

- Using a rail and a navigation bar together, or a rail in compact windows.
- Laying the rail out horizontally.
- Hiding the collapsed rail.
- Putting the FAB below the destinations, or using a logo as the expand button.
- Active indicator on more than one item.
- Truncated, ellipsized or shrunk labels.
- A container without fill where items fall below 3:1 contrast.
- Placing the rail inside a pane or the body content.
