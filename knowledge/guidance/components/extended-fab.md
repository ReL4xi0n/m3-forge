---
title: Extended FAB
kind: component
pages: [/components/extended-fab/overview, /components/extended-fab/specs, /components/extended-fab/guidelines, /components/extended-fab/accessibility]
tokenSets: [extended-fab, extended-fab.small, extended-fab.medium, extended-fab.large, extended-fab.primary-container, extended-fab.secondary-container, extended-fab.tertiary-container, extended-fab.primary, extended-fab.secondary, extended-fab.tertiary]
expressive: true
fetched: 2026-11-13
---

## Summary

The extended FAB is a FAB with a text label, and optionally an icon. It carries a screen's main
action when a word makes that action clearer, or when the action needs extra weight. Since the
May 2025 Expressive update it comes in small, medium and large sizes whose heights line up with
the FAB sizes, so the two can turn into each other. The single baseline extended FAB is no longer
recommended. General FAB rules are in floating-action-button.md#use-it-when.

## Use it when

- A long, scrolling screen needs its primary action reachable at all times (a checkout, for
  example).
- An icon alone would be vague, and a short label settles the meaning.
- The primary action deserves more emphasis than a plain FAB gives it.
- Pick the size by emphasis and window: large can suit a compact window with one dominant
  action; medium or large suits larger windows.
- Avoid when:
  - Another FAB or extended FAB is already on screen. One per screen.
  - The action is one choice among several. Use filled buttons for a set of options.
  - A floating toolbar is on the same screen; toolbars pair with FABs, not extended FABs.
  - It would sit on a card, inside another container, on top of a toolbar, or in the upper half of
    a mobile screen.

## Anatomy

1. Container. A rounded rectangle that hugs the label and icon; it grows and shrinks with the text.
2. Label text. Required; one or two words.
3. Icon. Optional. An icon without a label is not allowed (that is a FAB).

The icon sits before the label; in right-to-left languages the layout mirrors.

## Variants

- Size: small, medium, large.
- Color style: the six FAB pairings (three container styles, with primary container as the
  default, and three solid accent styles); see floating-action-button.md#color-roles-and-state-layers.
- Baseline (not recommended): the original extended FAB, the surface style and the branded style.
  Replace the baseline extended FAB with the small size.

## Expressive

- New sizes: small, medium and large, matching the FAB family heights.
- The label type moved up a step: the small size uses title medium where the baseline used label
  large, and its inner padding shrank.
- Shape is boxier, with a smaller radius than the M2 pill. Height now equals the FAB height, and
  the elevation model is simpler.
- Colors were remapped to support dynamic color.

## States and behavior

- States: enabled, hovered (raised to level 4
  [token:md.comp.extended-fab.primary-container.hovered.container.elevation]), focused, pressed.
  Resting elevation is level 3 [token:md.comp.extended-fab.primary-container.container.elevation].
- The label and icon form one focusable element.
- Width follows the label; never wrap or truncate it. Allow for longer translations.
- Transforming:
  - It can collapse into a FAB while the content scrolls down and expand again on scroll up.
  - In a navigation rail it is a FAB while the rail is collapsed and an extended FAB when the rail
    expands. When space runs short, it can shrink to a FAB.
- Placement:
  - Compact and medium windows: at the bottom, centered or at the trailing edge.
  - Expanded and larger windows: the bottom right corner (in both reading directions), or the top
    of the expanded navigation rail.

## Measurements

The values are material-web's (canonical). Every token that differs on another platform is
listed under "Platform differences" with a `[differs:]` marker.

| | Small | Medium | Large |
|---|---|---|---|
| Height | 56dp [site:/components/extended-fab/overview] [token:md.comp.extended-fab.small.container.height] | 80dp [site:/components/extended-fab/overview] [token:md.comp.extended-fab.medium.container.height] | 96dp [site:/components/extended-fab/overview] [token:md.comp.extended-fab.large.container.height] |
| Side padding (each side) | 16dp [token:md.comp.extended-fab.small.leading-space] | 26dp [token:md.comp.extended-fab.medium.leading-space] | 28dp [token:md.comp.extended-fab.large.leading-space] |
| Icon | 24dp [token:md.comp.extended-fab.small.icon.size] | 28dp [token:md.comp.extended-fab.medium.icon.size] | 36dp [token:md.comp.extended-fab.large.icon.size] |
| Icon–label gap | 8dp [token:md.comp.extended-fab.small.icon-label-space] | 12dp [token:md.comp.extended-fab.medium.icon-label-space] | 16dp [token:md.comp.extended-fab.large.icon-label-space] |
| Corner radius | 16dp [token:md.comp.extended-fab.small.container.shape] | 20dp [token:md.comp.extended-fab.medium.container.shape] | 28dp [token:md.comp.extended-fab.large.container.shape] |

- The site's small-size token table prints the leading space as 16dp [site:/components/extended-fab/specs]
  [token:md.comp.extended-fab.small.leading-space] and the icon–label space as 8dp [site:/components/extended-fab/specs] [token:md.comp.extended-fab.small.icon-label-space].
- Keep 16dp [site:/components/extended-fab/specs] margins from the window edges.
- Baseline extended FAB (not recommended): 56dp [site:/components/extended-fab/overview]
  [token:md.comp.extended-fab.container.height] tall; its minimum width is
  80dp [site:/components/extended-fab/specs], its corner 16dp [site:/components/extended-fab/specs]
  [token:md.comp.extended-fab.container.shape], and its padding 16dp [site:/components/extended-fab/specs].

Platform differences (see `knowledge/conflicts.md`):

- Large icon [differs:md.comp.extended-fab.large.icon.size]:
  - Compose's token: 32dp [token:md.comp.extended-fab.large.icon.size].
  - material-web and Flutter: 36dp [token:md.comp.extended-fab.large.icon.size].
- Medium icon–label gap [differs:md.comp.extended-fab.medium.icon-label-space]:
  - Compose's token: 16dp [token:md.comp.extended-fab.medium.icon-label-space]. Its code marks the
    token as wrong and uses
    12dp [impl:compose-material3/commonMain/androidx/compose/material3/FloatingActionButton.kt:1456].
  - material-web and Flutter: 12dp [token:md.comp.extended-fab.medium.icon-label-space].
- Large icon–label gap [differs:md.comp.extended-fab.large.icon-label-space]:
  - Compose's token: 20dp [token:md.comp.extended-fab.large.icon-label-space]. Its code marks the
    token as wrong and uses
    16dp [impl:compose-material3/commonMain/androidx/compose/material3/FloatingActionButton.kt:1469].
  - material-web and Flutter: 16dp [token:md.comp.extended-fab.large.icon-label-space].
- The "primary" color style: see Color roles and state layers below.

## Typography

| Small | Medium | Large |
|---|---|---|
| title medium [token:md.comp.extended-fab.small.label-text] | title large [token:md.comp.extended-fab.medium.label-text] | headline small [token:md.comp.extended-fab.large.label-text] |

- These per-size label tokens exist only in Flutter's data. material-web and Compose define no
  extended-FAB label token [NOT FOUND]. Compose's code hard-codes those three styles
  (`TypographyKeyTokens.TitleMedium`, `TitleLarge`, `HeadlineSmall`,
  FloatingActionButton.kt:1444, :1457, :1470).
- Baseline extended FAB: label large [token:md.comp.extended-fab.label-text].
- Labels are one or two words, in sentence case, on one line.

## Color roles and state layers

Color style → container / icon and label:

- Primary container (default): primary container
  [token:md.comp.extended-fab.primary-container.container.color] / on primary container
  [token:md.comp.extended-fab.primary-container.label-text.color].
- Secondary container: secondary container
  [token:md.comp.extended-fab.secondary-container.container.color] / on secondary container
  [token:md.comp.extended-fab.secondary-container.label-text.color].
- Tertiary container: tertiary container
  [token:md.comp.extended-fab.tertiary-container.container.color] / on tertiary container
  [token:md.comp.extended-fab.tertiary-container.label-text.color].
- Primary: primary [token:md.comp.extended-fab.primary.container.color] / on primary
  [token:md.comp.extended-fab.primary.label-text.color] [token:md.comp.extended-fab.primary.icon.color].
- Secondary: secondary [token:md.comp.extended-fab.secondary.container.color] / on secondary
  [token:md.comp.extended-fab.secondary.label-text.color].
- Tertiary: tertiary [token:md.comp.extended-fab.tertiary.container.color] / on tertiary
  [token:md.comp.extended-fab.tertiary.label-text.color].
- Baseline surface style (not recommended): surface container high
  [token:md.comp.extended-fab.surface.container.color] / primary
  [token:md.comp.extended-fab.surface.label-text.color].
- Compose's `md.comp.extended-fab.primary.*` ids point at the container roles instead (primary
  container with on primary container) [differs:md.comp.extended-fab.primary.container.color]
  [differs:md.comp.extended-fab.primary.label-text.color]
  [differs:md.comp.extended-fab.primary.icon.color]. material-web and Flutter use primary and on
  primary.
- State layers: hover 8% [token:md.comp.extended-fab.primary-container.hovered.state-layer.opacity],
  focus and press 10% [token:md.comp.extended-fab.primary-container.pressed.state-layer.opacity];
  see floating-action-button.md#color-roles-and-state-layers. With a non-default style, keep the state
  layer in that style's icon role.

## Motion

- Appearing: the container expands onto the screen using the enter and exit transition pattern.
- FAB to extended FAB: the container shape changes, the icon slides to the leading side, and the
  label fades in. The reverse happens on collapse.
- No extended-FAB duration, easing or spring token covers these transitions [NOT FOUND].
- Compose, when `expanded` changes on the text-and-icon overloads, animates the width with the fast
  spatial spring and the label's opacity with the fast effects spring
  [impl:compose-material3/commonMain/androidx/compose/material3/FloatingActionButton.kt:963]
  [impl:compose-material3/commonMain/androidx/compose/material3/FloatingActionButton.kt:964].
  - Fast spatial, standard scheme: damping 0.9, stiffness 1400
    [token:md.sys.motion.spring.fast.spatial.damping]
    [token:md.sys.motion.spring.fast.spatial.stiffness]; expressive scheme: damping 0.6,
    stiffness 800.
  - Fast effects: damping 1, stiffness 3800 [token:md.sys.motion.spring.fast.effects.damping]
    [token:md.sys.motion.spring.fast.effects.stiffness].
- Compose's baseline `ExtendedFloatingActionButton` expands with a default-effects fade and a
  fast-spatial horizontal expand, and collapses with a fast-effects fade and a default-spatial
  shrink [impl:compose-material3/commonMain/androidx/compose/material3/FloatingActionButton.kt:1488]
  [impl:compose-material3/commonMain/androidx/compose/material3/FloatingActionButton.kt:1499].
- Expanding into a new surface uses the container transform pattern.

## Accessibility

- People must be able to reach and activate the extended FAB with assistive technology.
- Put it early in the focus order (on mobile, after the app bar and navigation bar, skipping the
  rest of the content).
- Label and icon are one focus stop. No tooltip is needed, since the label is visible.
- Keyboard: Tab moves focus to it; Space or Enter activates it.
- The accessible name starts with the visible label's first word ("Create" can be announced as
  "Create a new invite").
- Keep icon and label consistent with each other and with one purpose.
- On large web layouts, the upper left (top of an expanded navigation rail) helps screen-reader
  users; in smaller windows, the lower right corner. Never place it over another control.

## Platform mapping

- Jetpack Compose (material3 1.5.0-rc01): `SmallExtendedFloatingActionButton`,
  `MediumExtendedFloatingActionButton`, `LargeExtendedFloatingActionButton`, each with a content
  overload and a `text` + `icon` + `expanded` overload. The baseline is `ExtendedFloatingActionButton`.
  Shapes come from `FloatingActionButtonDefaults.smallExtendedFabShape`, `mediumExtendedFabShape`,
  `largeExtendedFabShape`.
- Flutter (`material_ui` 1.11.0): `FloatingActionButton.extended` only, which is the baseline
  extended FAB: fixed height
  56dp [impl:material_ui/packages/material_ui/lib/src/generated/fab_defaults_m3.g.dart:21] and a
  label-large label (`extendedTextStyle`, fab_defaults_m3.g.dart:72). There are no small, medium
  or large sizes; we supply them in Phase 3 as reference widgets.
- Web: no maintained official component. Our CSS extended FAB is built in Phase 3 from the
  material-web token values above.

## Pitfalls

- Two extended FABs on one screen, or an extended FAB used as one option among several.
- Long labels, wrapped labels or truncated labels.
- An icon with no label (use a FAB), or an icon that does not match the label.
- Placing it on cards, toolbars, other containers or high up on a mobile screen.
- Pairing it with a floating toolbar, or opening a FAB menu from it.
- Keeping the baseline extended FAB (label large, 56dp [site:/components/extended-fab/overview]) in new designs instead of the small size.
