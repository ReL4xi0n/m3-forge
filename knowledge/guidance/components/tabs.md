---
title: Tabs
kind: component
pages: [/components/tabs/overview, /components/tabs/specs, /components/tabs/guidelines, /components/tabs/accessibility, /components/navigation-bar/guidelines]
tokenSets: [primary-navigation-tab, secondary-navigation-tab]
expressive: false
fetched: 2026-11-13
---

## Summary

Tabs split related content at one level of hierarchy into peer groups and let people switch
between them inside a screen region. A row of tabs sits above the content it controls, marks the
active tab with an underline and color, and can scroll sideways when the tabs do not fit. There are
two variants: primary and secondary.

## Use it when

- Content falls into related, parallel categories (for example video, photos, audio).
- Primary tabs: the main content groups of a pane, placed at the top under the app bar. Use them
  when only one tab row is needed.
- Secondary tabs: a second level inside a content area, always below primary tabs.
- Tabs can be attached to an app bar, embedded in a region, or nested inside cards and sheets.
- Avoid when:
  - The content is sequential and must be read in order; use headings and spacing instead.
  - The navigation is between top-level destinations of the app; use a navigation bar or rail.
  - The content area is full of swipeable items (maps, swipe-to-act lists) that would fight the
    swipe between fixed tabs.

## Anatomy

1. Container: full window width, split into equal sections, with a divider along its bottom edge.
2. Icon (optional).
3. Badge (optional).
4. Label.
5. Divider: inside the container height, separating the tabs from the content below.
6. Active indicator: an underline under the active tab.

## Variants

- Primary tabs: a thicker indicator with rounded top corners, and the active label and icon in
  the primary color.
- Secondary tabs: a thinner, simpler indicator; the active label stays in a neutral color.
- Content: label only, icon only (only with universally understood icons), or icon and label
  (stacked or inline). All tabs in a set use the same combination.
- Fixed tabs: every tab visible at once; good for quick switching between related views. Fixed
  tabs share the width; each tab is as wide as the widest one, and the group uses fluid margins,
  aligned to the center or the leading edge.
- Scrollable tabs: for many tabs or long labels; each tab is as wide as its label.
- Changes from M2 (these predate M3 Expressive): new color mappings that support dynamic color, and icons and labels centered
  vertically in the container.

## Expressive

- Not covered by the sources. The tabs pages have no M3 Expressive section, and no Expressive tab
  tokens exist.

## States and behavior

- States: enabled, hovered, focused, pressed, on an active or inactive tab; one tab is always
  active.
- Switching: tap a tab, or swipe left or right in the content area of fixed tabs.
- The indicator moves to the new tab when selection changes.
- Scrollable tabs: offset the first visible tab 52dp [site:/components/tabs/guidelines] from the
  leading edge so it is obvious more tabs exist. Keep padding equal on every tab.
- Do not loop a scrollable tab set endlessly; it traps linear screen-reader navigation.
- On vertical scroll the tabs either stay pinned at the top or scroll away and come back when the
  page scrolls up. Tabs attached to an app bar move with it as one unit and never slide behind it.
- Keep to four tabs or fewer in a fixed set; five or more get cramped.
- Labels sit on one line. A second line with truncation is possible but best avoided; prefer
  scrollable tabs for long labels.
- Badges hold at most four characters including "+", and update or disappear once the tab's
  content has been seen.

## Measurements

The values are material-web's (canonical). No token cited below differs on another platform; the
linter checks this, and a difference would need a `[differs:]` marker.

| Part | Value |
|---|---|
| Container height, label only | 48dp [site:/components/tabs/specs] [token:md.comp.primary-navigation-tab.container.height] |
| Container height, icon and label | 64dp [site:/components/tabs/specs] [token:md.comp.primary-navigation-tab.with-icon-and-label-text.container.height] |
| Icon size | 24dp [site:/components/tabs/specs] [token:md.comp.primary-navigation-tab.with-icon.icon.size] |
| Divider height | 1dp [site:/components/tabs/specs] [token:md.comp.primary-navigation-tab.divider.height] |
| Primary indicator height | 3dp [site:/components/tabs/specs] [token:md.comp.primary-navigation-tab.active-indicator.height] |
| Secondary indicator height | 2dp [site:/components/tabs/specs] [token:md.comp.secondary-navigation-tab.active-indicator.height] |
| Primary indicator corners | 3dp on the top corners, square at the bottom [token:md.comp.primary-navigation-tab.active-indicator.shape] |
| Primary indicator minimum length | 24dp [site:/components/tabs/specs] |
| Primary indicator inset | 2dp on each side [site:/components/tabs/specs] |
| Inline icon to label | 8dp [site:/components/tabs/specs] |
| Inline label to badge | 4dp [site:/components/tabs/specs] |
| Badge overlap on a stacked icon | 6dp [site:/components/tabs/specs] |

- Secondary tabs use the same container heights [token:md.comp.secondary-navigation-tab.container.height]
  and icon size [token:md.comp.secondary-navigation-tab.with-icon.icon.size].
- Beyond the minimum length, the site and tokens give no indicator width [NOT FOUND]. Flutter
  sizes the primary indicator to the label
  [impl:material_ui/packages/material_ui/lib/src/generated/tabs_defaults_m3.g.dart:12] and the
  secondary indicator to the whole tab
  [impl:material_ui/packages/material_ui/lib/src/generated/tabs_defaults_m3.g.dart:91].
- Compose's scrollable rows start with an edge padding of
  52dp [impl:compose-material3/commonMain/androidx/compose/material3/TabRow.kt:987], matching the
  guideline offset.
- Flutter's `Tab` widget sizes itself with internal constants: 46 for label-only tabs
  [impl:material_ui/packages/material_ui/lib/src/tabs.dart:32] and 72 for icon and label
  [impl:material_ui/packages/material_ui/lib/src/tabs.dart:33] (logical pixels).

## Typography

- Label, primary and secondary: title small
  [token:md.comp.primary-navigation-tab.with-label-text.label-text.font]
  [token:md.comp.secondary-navigation-tab.label-text.font].
- Flutter stores the style under `.type` ids
  [token:md.comp.primary-navigation-tab.with-label-text.label-text.type]; Compose under
  `label-text-font` [token:md.comp.primary-navigation-tab.label-text-font].
- Do not truncate labels unless there is no alternative.

## Color roles and state layers

Primary tabs:

- Container: surface [token:md.comp.primary-navigation-tab.container.color].
- Active: indicator, label and icon primary [token:md.comp.primary-navigation-tab.active-indicator.color]
  [token:md.comp.primary-navigation-tab.with-label-text.active.label-text.color]
  [token:md.comp.primary-navigation-tab.with-icon.active.icon.color].
- Inactive: label and icon on surface variant
  [token:md.comp.primary-navigation-tab.with-label-text.inactive.label-text.color]
  [token:md.comp.primary-navigation-tab.with-icon.inactive.icon.color].
- State layers: primary on the active tab [token:md.comp.primary-navigation-tab.active.hover.state-layer.color],
  on surface on inactive tabs for hover and focus [token:md.comp.primary-navigation-tab.inactive.hover.state-layer.color]
  (the inactive pressed ripple is primary [token:md.comp.primary-navigation-tab.inactive.pressed.state-layer.color]).
  - hovered 8% [token:md.comp.primary-navigation-tab.active.hover.state-layer.opacity];
  - focused 10% [token:md.comp.primary-navigation-tab.active.focus.state-layer.opacity];
  - pressed 10% [token:md.comp.primary-navigation-tab.active.pressed.state-layer.opacity].

Secondary tabs:

- Container: surface [token:md.comp.secondary-navigation-tab.container.color].
- Active label and icon: on surface [token:md.comp.secondary-navigation-tab.active.label-text.color]
  [token:md.comp.secondary-navigation-tab.with-icon.active.icon.color]; indicator primary
  [token:md.comp.secondary-navigation-tab.active-indicator.color].
- Inactive: on surface variant [token:md.comp.secondary-navigation-tab.inactive.label-text.color].
- State layers on surface [token:md.comp.secondary-navigation-tab.hover.state-layer.color]: hovered
  8% [token:md.comp.secondary-navigation-tab.hover.state-layer.opacity], focused
  10% [token:md.comp.secondary-navigation-tab.focus.state-layer.opacity], pressed
  10% [token:md.comp.secondary-navigation-tab.pressed.state-layer.opacity].

Both:

- Divider: the tokens give surface variant [token:md.comp.primary-navigation-tab.divider.color];
  the site's color-role list names outline variant. The repository value wins.
- Focus ring: secondary [token:md.comp.primary-navigation-tab.focus.indicator.color].

## Motion

- No tab duration, easing or spring token exists [NOT FOUND]. The site only says the indicator
  shifts into place.
- Compose: the indicator slides with the default spatial spring
  [impl:compose-material3/commonMain/androidx/compose/material3/TabRow.kt:406], scrollable rows
  scroll the selected tab into view with the same spring
  [impl:compose-material3/commonMain/androidx/compose/material3/TabRow.kt:525], and tab content
  colors fade in with default effects and out with fast effects
  [impl:compose-material3/commonMain/androidx/compose/material3/Tab.kt:280].
- Flutter: the indicator follows `TabIndicatorAnimation.elastic` when it is sized to the label
  and `.linear` when sized to the tab [impl:material_ui/packages/material_ui/lib/src/tabs.dart:1798];
  scrollable bars scroll over `kTabScrollDuration`,
  300ms [impl:material_ui/packages/material_ui/lib/src/constants.dart:51].

## Accessibility

- People must be able to act or navigate with assistive technology, reach tabs that are off
  screen, and keep access to primary actions after scrolling.
- Feedback: a ripple on tap or click, a hover state for pointers, a focus indicator for keyboard
  and switch users; the indicator then moves to the selected tab.
- Keyboard: arrow keys (or Tab) move between tabs; Space or Enter activates the focused tab. Do
  not use Space or Enter to move between tabs.
- Scrollable tabs are acceptable for accessibility: they need to widen for their labels, and
  horizontal scrolling is the only way to reach them.
- Do not apply density by default; it pushes targets under 48 × 48 CSS pixels. Offer density as an
  opt-in, and keep the control that reverts it at full size.
- When a tab shows only an icon, or its text is vague, give it a descriptive accessible label (a
  camera icon might read "Video format media content").

## Platform mapping

- Jetpack Compose (material3 1.5.0-rc01): `PrimaryTabRow`, `SecondaryTabRow`,
  `PrimaryScrollableTabRow`, `SecondaryScrollableTabRow`, with `Tab` and `LeadingIconTab` (inline
  icon). Indicators: `TabRowDefaults.PrimaryIndicator`, `TabRowDefaults.SecondaryIndicator`.
  `TabRow` and `ScrollableTabRow` are deprecated in favour of the primary and secondary rows.
- Flutter (`material_ui` 1.11.0): `TabBar` (primary) and `TabBar.secondary`, with `Tab`,
  `TabBarView`, `TabController`; `isScrollable` and `TabAlignment` for scrollable sets;
  `TabIndicatorAnimation` for the indicator motion.
- Web: no maintained official component. Our CSS tabs are built in Phase 3 from the material-web
  token values above.

## Pitfalls

- Tabs for sequential steps.
- Mixing icon-and-label tabs with label-only tabs in one set.
- Icon-only tabs with icons people do not recognize.
- More than four fixed tabs.
- Secondary tabs above primary tabs.
- Truncated labels, or uneven padding between scrollable tabs.
- Scrollable tabs flush with the leading edge, hiding that more exist.
- Swipeable content inside a tabbed area.
- Default density that shrinks targets below 48 × 48 CSS pixels.
