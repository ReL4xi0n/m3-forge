---
title: Split button
kind: component
pages: [/components/split-button/overview, /components/split-button/specs, /components/split-button/guidelines, /components/split-button/accessibility]
tokenSets: [split-button.xsmall, split-button.small, split-button.medium, split-button.large, split-button.xlarge]
expressive: true
fetched: 2026-11-13
---

## Summary

A split button pairs a main action with a menu of related actions. It has two touching parts: a
leading button that performs the action, and a trailing menu button that opens the options. It is
new in M3 Expressive (May 2025) and comes in the same five sizes as buttons and icon buttons.

## Use it when

- One action is clearly primary but has close alternatives (Send with "schedule send", Watch later
  with other save options). Folding them into the menu keeps the screen calm.
- It works alone, beside ordinary buttons, or with button groups. It can be a different size from
  nearby buttons, since it is wider.
- Scale it up on large windows or for a hero moment on a small one.
- Avoid when:
  - The options are peers rather than variants of one action; use a button group or a menu
    button.
  - Something other than a menu or a closely related surface would open. A card is acceptable;
    reshaping the menu in unusual ways is not.

## Anatomy

1. Leading button: icon, label, or both. Keep the label to one or two words.
2. Trailing button: always the expand/collapse (menu) icon, which rotates when opened. Do not
   swap it for another icon.
3. Gap between the two buttons.

The layout mirrors in right-to-left languages.

## Variants

- Color configurations: elevated, filled, tonal, outlined, using the same color roles and state
  layers as buttons. There is no text configuration.
- Sizes: extra small, small (default), medium, large, extra large.
- Unlike a toggle button, the split button does not recolor when its menu is open. Only a state
  layer is added.

## Expressive

- The whole component is Expressive-only. It has no classic M3 version.
- Shape morph:
  - The inner corners (where the two halves meet) grow when hovered, focused or pressed.
  - When the menu is open, the trailing button turns fully round and its icon is centered.
- The menu icon rotates 180° inwards on open and close using the standard motion scheme, not the
  expressive one.

## States and behavior

- Each half has its own states: enabled, disabled, hovered, focused, pressed. The trailing half
  also has selected (menu open).
- Tab moves focus from the leading to the trailing button (operating-system settings can change
  this order); Space or Enter activates the focused half.
- Menu placement:
  - Align the menu with the trailing button's edge when there is room.
  - Otherwise align it with either edge of the whole split button.
  - Keep a 4dp gap between the menu and the split button [site:/components/split-button/guidelines].
- When the halves are asymmetrical, text and icons are optically centered, not mathematically.
  The unselected menu icon is shifted from center by XS -1dp, S -1dp, M -2dp, L -3dp, XL -6dp
  [site:/components/split-button/specs].

## Measurements

The values are material-web's (canonical). No token cited below differs on another platform; the
linter checks this, and a difference would need a `[differs:]` marker.

| | XS | S | M | L | XL |
|---|---|---|---|---|---|
| Height | 32dp [token:md.comp.split-button.xsmall.container.height] | 40dp [token:md.comp.split-button.small.container.height] | 56dp [token:md.comp.split-button.medium.container.height] | 96dp [token:md.comp.split-button.large.container.height] | 136dp [token:md.comp.split-button.xlarge.container.height] |
| Gap between halves | 2dp [token:md.comp.split-button.xsmall.between-space] | 2dp [token:md.comp.split-button.small.between-space] | 2dp [token:md.comp.split-button.medium.between-space] | 2dp [token:md.comp.split-button.large.between-space] | 2dp [token:md.comp.split-button.xlarge.between-space] |
| Leading half: start padding | 12dp [token:md.comp.split-button.xsmall.leading-button.leading-space] | 16dp [token:md.comp.split-button.small.leading-button.leading-space] | 24dp [token:md.comp.split-button.medium.leading-button.leading-space] | 48dp [token:md.comp.split-button.large.leading-button.leading-space] | 64dp [token:md.comp.split-button.xlarge.leading-button.leading-space] |
| Leading half: end padding | 10dp [token:md.comp.split-button.xsmall.leading-button.trailing-space] | 12dp [token:md.comp.split-button.small.leading-button.trailing-space] | 24dp [token:md.comp.split-button.medium.leading-button.trailing-space] | 48dp [token:md.comp.split-button.large.leading-button.trailing-space] | 64dp [token:md.comp.split-button.xlarge.leading-button.trailing-space] |
| Trailing half: side padding | 13dp [token:md.comp.split-button.xsmall.trailing-button.leading-space] | 13dp [token:md.comp.split-button.small.trailing-button.leading-space] | 15dp [token:md.comp.split-button.medium.trailing-button.leading-space] | 29dp [token:md.comp.split-button.large.trailing-button.leading-space] | 43dp [token:md.comp.split-button.xlarge.trailing-button.leading-space] |
| Menu icon | 22dp [token:md.comp.split-button.xsmall.trailing-button.icon.size] | 22dp [token:md.comp.split-button.small.trailing-button.icon.size] | 26dp [token:md.comp.split-button.medium.trailing-button.icon.size] | 38dp [token:md.comp.split-button.large.trailing-button.icon.size] | 50dp [token:md.comp.split-button.xlarge.trailing-button.icon.size] |
| Inner corner, resting | 4dp [site:/components/split-button/specs] [token:md.comp.split-button.xsmall.inner-corner.corner-size] | 4dp [site:/components/split-button/specs] [token:md.comp.split-button.small.inner-corner.corner-size] | 4dp [site:/components/split-button/specs] [token:md.comp.split-button.medium.inner-corner.corner-size] | 8dp [site:/components/split-button/specs] [token:md.comp.split-button.large.inner-corner.corner-size] | 12dp [site:/components/split-button/specs] [token:md.comp.split-button.xlarge.inner-corner.corner-size] |
| Inner corner, hovered or pressed | 8dp [token:md.comp.split-button.xsmall.inner-corner.pressed.corner-size] | 12dp [token:md.comp.split-button.small.inner-corner.pressed.corner-size] | 12dp [token:md.comp.split-button.medium.inner-corner.pressed.corner-size] | 20dp [token:md.comp.split-button.large.inner-corner.pressed.corner-size] | 20dp [token:md.comp.split-button.xlarge.inner-corner.pressed.corner-size] |

- Outer corners are fully round [token:md.comp.split-button.small.container.shape]. The site writes
  the outer and selected-trailing corner sizes as 50% [site:/components/split-button/specs].
- The gap between halves is always 2dp, whatever the size [site:/components/split-button/specs]
  [token:md.comp.split-button.medium.between-space].
- Several Compose names for this component do not map to a token-database id (the menu-icon size,
  the hovered and pressed inner corners, the selected trailing corner). They are listed under
  "Unmapped native names" in `knowledge/not-found.md`, so Compose shows NOT FOUND for those ids
  rather than a value.

## Typography

- The split button has no label type token of its own [NOT FOUND].
- The leading button follows the button label styles per size; see
  buttons.md#typography (label large for extra small and small, title medium, headline small,
  headline large).

## Color roles and state layers

- The color configurations, roles and state-layer opacities are the button ones; see
  buttons.md#color-roles-and-state-layers.
- Opening the menu does not change colors. The trailing button only adds its selected state layer.

## Motion

- Menu icon: rotates 180° inwards when the menu opens or closes, using the standard motion scheme
  [site:/components/split-button/guidelines].
- Inner-corner shape morph on hover, focus and press: no split-button duration, easing or spring
  token [NOT FOUND].
- Compose animates both halves with the default effects spring of the active motion scheme
  (`MotionSchemeKeyTokens.DefaultEffects`, SplitButton.kt:697): damping 1, stiffness 1600 in both
  schemes [token:md.sys.motion.spring.default.effects.damping]
  [token:md.sys.motion.spring.default.effects.stiffness].
- The site names a scheme but no token, so material-web and Flutter have no split-button motion
  token [NOT FOUND].

## Accessibility

- Each half needs a touch target of at least 48 × 48dp [site:/components/split-button/accessibility].
  Extra small and small are shorter than that, so pad their targets vertically.
- The leading button's accessible name follows the normal button rule: it matches the visible
  label.
- The trailing button's name says that more options exist and what they relate to (for example
  "More watch options" next to "Watch later"). It also exposes whether the menu is expanded.
- The opened menu follows the menu accessibility guidance.

## Platform mapping

- Jetpack Compose (material3 1.5.0-rc01): `SplitButtonLayout` with `SplitButtonDefaults.LeadingButton`
  and `SplitButtonDefaults.TrailingButton`. In this version the files carry no experimental opt-in.
- Flutter (`material_ui` 1.11.0): no split button. It is one of our Phase 3 gap components, built
  from official buttons and our tokens and protected by golden tests.
- Web: no maintained official component. Our CSS split button is built in Phase 3 from the
  material-web token values above.

## Pitfalls

- Using it for unrelated actions. The menu should hold variants of the main action.
- Changing the trailing icon, or omitting it.
- Long leading labels that push the menu button far away.
- Recoloring the whole component when the menu is open. Only a state layer changes.
- Ignoring the optical offset of the menu icon, which makes asymmetric sizes look off-center.
- Menus floating away from the button instead of aligned to an edge with a
  4dp gap [site:/components/split-button/guidelines].
