---
title: Navigation bar
kind: component
pages: [/components/navigation-bar/overview, /components/navigation-bar/specs, /components/navigation-bar/guidelines, /components/navigation-bar/accessibility]
tokenSets: [nav-bar, nav-bar.item, navigation-bar]
expressive: true
fetched: 2026-11-13
---

## Summary

A navigation bar sits at the bottom of the window on phones and small tablets and switches
between three to five top-level destinations of equal weight. Each destination shows an icon and
a label, and exactly one is active. M3 Expressive replaced the baseline bar with a shorter
"flexible" navigation bar that can also lay its items out horizontally in medium windows. In M2
the component was called bottom navigation.

## Use it when

- The product has three to five main destinations and runs in compact or medium windows.
- Destinations stay the same on every screen.
- Choose the window behaviour:
  - Compact: a navigation bar, or a modal navigation rail.
  - Medium: a navigation bar or a navigation rail, depending on whether vertical or horizontal
    space is scarcer.
  - Expanded and larger: a navigation rail instead.
- Avoid when:
  - There are more than five destinations: labels collide and translations will not fit. Use tabs
    within a page, or a modal expanded navigation rail behind a menu button.
  - There are fewer than three destinations; use tabs.
  - The target is a single task (one email, one item), or a desktop layout (use a rail or tabs).

## Anatomy

1. Container: spans the full window width at the bottom, filled with color to separate it from
   the content.
2. Navigation item: holds the icon, the label and the active indicator for one destination.
3. Icon.
4. Label text.
5. Active indicator: a pill behind the icon (vertical items) or behind icon and label (horizontal
   items).
6. Small badge (optional): a dot for "something changed".
7. Large badge (optional) with its label: a count.

Badges sit at the top trailing corner of the icon and overlap it in both item layouts.

## Variants

- Flexible navigation bar (current): item layout is either
  - vertical (default): label under the icon; items share the width equally; or
  - horizontal: icon and label side by side inside the indicator; items have a fixed width and
    are centered, so leftover space goes to the two ends.
- Use vertical items in compact windows and horizontal items in medium windows.
- Baseline navigation bar: taller, vertical items only, no longer recommended.
- Changes from M2 (these predate M3 Expressive): no drop shadow, a taller container, new color
  mappings that work with dynamic color, and the active destination shown with a filled icon on a
  contrasting pill.

## Expressive

- May 2025: the flexible navigation bar arrived and the baseline bar stopped being recommended.
- The flexible bar is shorter than the baseline bar and supports horizontal items for medium
  windows.
- The active label color moved from on surface variant to secondary.

## States and behavior

- Item states: enabled, hovered, focused, pressed; each item is active or inactive.
- Selecting an inactive item opens that destination with a top-level transition. The product
  either restores the destination's previous state (scroll position, tab, inline search) or
  resets it. Products where people switch sections often should restore state.
- Selecting the already active item scrolls its page back to the top.
- Swiping across the content never changes destination.
- On scroll the bar may hide (scrolling down) and reappear (scrolling up). Keep it visible while a
  screen reader is running.
- Dialogs, sheets, drawers or the keyboard may cover it for the length of a flow, never
  permanently.
- Selection animation: the icon turns filled and the indicator grows outward from the icon's
  center, along one axis only.
- The FAB sits above the bar, aligned to the trailing side; it must not cover the bar.
- Destinations keep fixed positions; they never scroll or reorder.
- Horizontal items keep the same padding at every breakpoint and stay centered.
- The container spans 100% of the window width [site:/components/navigation-bar/guidelines].

## Measurements

Flexible navigation bar. The values are material-web's (canonical). Compose stores these under
other ids (`navigation-bar-vertical-item.*`, `navigation-bar-horizontal-item.*`), noted after the
table.

| | Vertical items | Horizontal items |
|---|---|---|
| Container height | 64dp [token:md.comp.nav-bar.container.height] | 64dp [token:md.comp.nav-bar.container.height] |
| Active indicator height | 32dp [token:md.comp.nav-bar.item.vertical.active-indicator.height] | 40dp [token:md.comp.nav-bar.item.horizontal.active-indicator.height] |
| Active indicator width | 56dp [token:md.comp.nav-bar.item.vertical.active-indicator.width] | hugs the content [NOT FOUND] |
| Indicator side padding | not applicable | 16dp [token:md.comp.nav-bar.item.horizontal.active-indicator.leading-space] |
| Icon–label gap | 4dp [token:md.comp.nav-bar.item.vertical.active-indicator.icon-label-space] | 4dp [token:md.comp.nav-bar.item.horizontal.active-indicator.icon-label-space] |
| Icon size | 24dp [token:md.comp.nav-bar.item.icon.size] | 24dp [token:md.comp.nav-bar.item.icon.size] |

- Vertical item inner spacing (the token's `container.between-space`): 6dp [token:md.comp.nav-bar.item.vertical.container.between-space].
- Gap between items: 0dp [token:md.comp.nav-bar.item.between-space].
- Container corners: none [token:md.comp.nav-bar.container.shape]; indicator fully rounded
  [token:md.comp.nav-bar.item.active-indicator.shape].
- Horizontal item width and the margin from the window edge: no value in the text or tokens
  [NOT FOUND].
- The Compose ids for these values: indicator 56dp [token:md.comp.navigation-bar-vertical-item.active-indicator-width]
  by 32dp [token:md.comp.navigation-bar-vertical-item.active-indicator-height]; horizontal indicator
  40dp [token:md.comp.navigation-bar-horizontal-item.active-indicator-height].

Baseline navigation bar (not recommended):

- Container height 80dp [token:md.comp.navigation-bar.container.height] on material-web and
  Flutter [differs:md.comp.navigation-bar.container.height]. Compose uses this id for the flexible
  bar, 64dp [token:md.comp.navigation-bar.container.height], and keeps the baseline height as
  80dp [token:md.comp.navigation-bar.tall-container-height].
- Active indicator 64dp [token:md.comp.navigation-bar.active-indicator.width] wide and
  32dp [token:md.comp.navigation-bar.active-indicator.height] tall; icon 24dp [token:md.comp.navigation-bar.icon.size].
- Badges (material-web only): small badge 6dp [token:md.comp.navigation-bar.badge.size], large badge
  16dp [token:md.comp.navigation-bar.large-badge.size] tall.

## Typography

- Flexible bar label: label medium for vertical items [token:md.comp.nav-bar.item.vertical.label-text.font]
  and for horizontal items [token:md.comp.nav-bar.item.horizontal.label-text.font]. These ids exist
  only in Flutter's data; material-web's `nav-bar` set defines no label font [NOT FOUND].
- Baseline bar label: label medium [token:md.comp.navigation-bar.label-text.font]; the active label
  uses the prominent weight of label medium [token:md.comp.navigation-bar.active.label-text.weight].
- Selected items pair a filled icon with a bold label; unselected items an outlined icon with a
  medium-weight label.
- Labels are one or two words, never wrapped, truncated or shrunk at the default text size.

## Color roles and state layers

Flexible navigation bar:

- Container: surface container [token:md.comp.nav-bar.container.color].
- Active: indicator secondary container [token:md.comp.nav-bar.item.active.indicator.color], icon on
  secondary container [token:md.comp.nav-bar.item.active.icon.color], label secondary
  [token:md.comp.nav-bar.item.active.label-text.color].
- Inactive: icon and label on surface variant [token:md.comp.nav-bar.item.inactive.icon.color]
  [token:md.comp.nav-bar.item.inactive.label-text.color].
- State layers use on secondary container [token:md.comp.nav-bar.item.active.hovered.state-layer.color]:
  - hovered 8% [token:md.comp.nav-bar.item.active.hovered.state-layer.opacity];
  - focused 10% [token:md.comp.nav-bar.item.active.focused.state-layer.opacity];
  - pressed 10% [token:md.comp.nav-bar.item.active.pressed.state-layer.opacity].
- Focus ring: secondary [token:md.comp.navigation-bar.focus.indicator.color].
  Its thickness is 3dp [token:md.comp.navigation-bar.focus.indicator.thickness].
- The tokens keep an elevation level on the container [token:md.comp.nav-bar.container.elevation],
  but the site calls for no drop shadow; the container color provides the separation.

Baseline navigation bar: container surface container
[token:md.comp.navigation-bar.container.color]; active label on surface
[token:md.comp.navigation-bar.active.label-text.color] (the flexible bar changed this to
secondary); state layers in on surface [token:md.comp.navigation-bar.active.hover.state-layer.color].

- Icons, active and inactive, need at least 3:1 contrast with the container. Avoid many colors or
  low-contrast colors across items.

## Motion

- No navigation-bar duration, easing or spring token exists [NOT FOUND]. The site describes the
  indicator growing from the icon's center but gives no value.
- Compose:
  - `NavigationBarItem` fades the indicator with the default effects spring
    [impl:compose-material3/commonMain/androidx/compose/material3/NavigationBar.kt:239] and grows
    it with the fast spatial spring [impl:compose-material3/commonMain/androidx/compose/material3/NavigationBar.kt:245].
  - `ShortNavigationBarItem` animates the indicator with the default spatial spring
    [impl:compose-material3/commonMain/androidx/compose/material3/NavigationItem.kt:1229]. Its icon
    position is fixed per item, so the top/start switch is not animated.
- Flutter: selection animates over 500ms by default [impl:material_ui/packages/material_ui/lib/src/navigation_bar.dart:329];
  the indicator scales up from 40% [impl:material_ui/packages/material_ui/lib/src/navigation_bar.dart:868]
  along `Curves.easeInOutCubicEmphasized`.

## Accessibility

- People using assistive technology must be able to move between destinations, pick one, and get
  feedback that suits their input.
- Feedback: on tap the indicator appears in place, a ripple runs through it, and the icon fills
  and changes color. On hover a reduced indicator appears; on click a ripple runs through it.
- Text scaling: the bar grows taller to fit bigger labels and keeps its padding; scaled labels may
  wrap. Labels must stay fully visible up to 2x text size; past that they may truncate.
- Initial focus lands on the first item.
- Keyboard: Tab moves between items; Space or Enter selects the focused one.
- The accessible label is normally the destination name. When the visible label is vague, add
  context (for example "Music library" for a destination shown as "Library"). MDC-Android Views
  cannot provide the extra label and do not announce the role.
- Never rely on color alone: a selected item uses a filled icon (or a heavier glyph when no filled
  one exists) plus the indicator.

## Platform mapping

- Jetpack Compose (material3 1.5.0-rc01):
  - Flexible bar: `ShortNavigationBar` with `ShortNavigationBarItem`. Arrangement is
    `ShortNavigationBarArrangement.EqualWeight` or `.Centered`; item layout is
    `NavigationItemIconPosition.Top` (vertical) or `.Start` (horizontal).
  - Baseline bar: `NavigationBar` with `NavigationBarItem`.
- Flutter (`material_ui` 1.11.0): `NavigationBar` with `NavigationDestination` and
  `NavigationDestinationLabelBehavior`; this is the baseline bar. There is no flexible bar and no
  horizontal item layout. `BottomNavigationBar` is the older M2 widget. We supply the flexible bar
  in Phase 3.
- Web: no maintained official component. Our CSS navigation bar is built in Phase 3 from the
  material-web token values above.

## Pitfalls

- More than five or fewer than three destinations.
- Removing labels, or wrapping, truncating or shrinking them.
- Showing the active indicator on more than one item.
- Outlined icons on the selected item.
- Using the bar on desktop layouts or for in-page content (use tabs).
- Letting a FAB cover the bar, or hiding it permanently.
- Swipe gestures that switch destinations.
- Hiding the bar on scroll while a screen reader is active.
