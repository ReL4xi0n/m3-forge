---
title: Buttons
kind: component
pages: [/components/all-buttons, /components/buttons/overview, /components/buttons/specs, /components/buttons/guidelines, /components/buttons/accessibility, /styles/motion/overview/how-it-works]
tokenSets: [button, button.xsmall, button.small, button.medium, button.large, button.xlarge, button.filled, button.tonal, button.elevated, button.outlined, button.text]
expressive: true
fetched: 2026-11-13
---

## Summary

A button triggers one action. It is the general-purpose action control; icon buttons, split
buttons, button groups and the FAB family are its relatives. M3 Expressive turned the five old
button types into one button with five color configurations, five sizes, two shapes, and an
optional toggle (selected / unselected) behaviour.

## Use it when

- An action is discrete and the label can say what happens, in a word or three.
- Pick emphasis by importance (from the "All buttons" chooser, most to least prominent):
  - FAB, extended FAB, FAB menu: the screen's primary action.
  - Filled: final or unblocking steps (Save, Confirm, Send).
  - Split button: a key action that has related alternatives.
  - Standard button group: several key actions together.
  - Tonal: important but secondary; also fine for final steps.
  - Elevated: only when the button must stand off a busy or patterned background.
  - Outlined: needs attention but is not the main action; also the "change my mind" action.
  - Text: optional or supplementary actions.
  - Connected button group: switching what content is shown.
- Avoid when:
  - The screen already has many buttons. Move low-priority actions to an overflow menu, icon
    buttons, chips or links.
  - The action is a binary selection, such as Save or Favorite; the guidelines recommend a
    toggle button for that rather than a default button.

## Anatomy

1. Container. The text configuration shows its container only on hover, focus or press.
2. Label text. Required unless the control is an icon button.
3. Leading icon. Optional, at most one, placed before the label (after it in right-to-left
   layouts).

## Variants

- Behaviour: default, or toggle. A toggle has unselected and selected states.
- Color configuration: elevated, filled (default), tonal, outlined, text. There is no toggle text
  button.
- Size: extra small, small (default), medium, large, extra large. Sizes are a recommendation; mix
  them to set hierarchy (for example a bigger primary action inside a group).
- Shape: round (default, fully rounded) or square (radius grows with size).
- Small-size padding: 16dp is now recommended [token:md.comp.button.small.leading-space].
  The older 24dp padding is no longer recommended [site:/components/buttons/overview].

## Expressive

- Added in the May 2025 Expressive update: the four extra sizes, the square shape, toggle
  behaviour, and shape morphing.
- Pressing morphs either shape toward a squarer pressed shape. Round and square buttons of the same
  size share one pressed shape.
- A toggle changes its resting shape when selected: round becomes square. If the unselected shape
  is square, the selected one should be round.
- Colors were remapped so the icon and label always share a color, and they work with dynamic
  color. The neutral text button is no longer recommended.
- M2 used 36dp tall buttons [site:/components/buttons/overview]; M3 buttons start at 40dp
  [token:md.comp.button.small.container.height] with fully rounded corners.

## States and behavior

- States: enabled, disabled, hovered, focused, pressed; toggles add selected and unselected.
- State layers are the same for every configuration, including outlined and text, whose container
  only becomes visible through them.
- The elevated configuration rests at elevation level 1 and drops to 0 when disabled
  [token:md.comp.button.elevated.container.elevation].
- Disabled container opacity is 10% [token:md.comp.button.disabled.container.opacity] and
  disabled label opacity is 38% [token:md.comp.button.disabled.label-text.opacity].
- Width follows the label. A responsive layout may stretch it, but it must never be narrower than
  the label. Labels never wrap or truncate.
- Toggle labels may change between states, but keep both labels about the same length. Use an
  outlined icon when unselected and the filled version when selected (or a heavier weight if no
  filled glyph exists).

## Measurements

Per size. The values are material-web's (canonical). Every token that differs on another platform
is listed under "Platform differences" with a `[differs:]` marker.

| | XS | S | M | L | XL |
|---|---|---|---|---|---|
| Height | 32dp [token:md.comp.button.xsmall.container.height] | 40dp [token:md.comp.button.small.container.height] | 56dp [token:md.comp.button.medium.container.height] | 96dp [token:md.comp.button.large.container.height] | 136dp [token:md.comp.button.xlarge.container.height] |
| Icon | 20dp [token:md.comp.button.xsmall.icon.size] | 20dp [token:md.comp.button.small.icon.size] | 24dp [token:md.comp.button.medium.icon.size] | 32dp [token:md.comp.button.large.icon.size] | 40dp [token:md.comp.button.xlarge.icon.size] |
| Side padding | 12dp [token:md.comp.button.xsmall.leading-space] | 16dp [token:md.comp.button.small.leading-space] | 24dp [token:md.comp.button.medium.leading-space] | 48dp [token:md.comp.button.large.leading-space] | 64dp [token:md.comp.button.xlarge.leading-space] |
| Icon–label gap | 8dp [token:md.comp.button.xsmall.icon-label-space] | 8dp [token:md.comp.button.small.icon-label-space] | 8dp [token:md.comp.button.medium.icon-label-space] | 12dp [token:md.comp.button.large.icon-label-space] | 16dp [token:md.comp.button.xlarge.icon-label-space] |
| Outline width | 1dp [token:md.comp.button.xsmall.outlined.outline.width] | 1dp [token:md.comp.button.small.outlined.outline.width] | 1dp [token:md.comp.button.medium.outlined.outline.width] | 2dp [token:md.comp.button.large.outlined.outline.width] | 3dp [token:md.comp.button.xlarge.outlined.outline.width] |

Corner radius. The site's table and the tokens give these values; `knowledge/conflicts.md` lists
no site-vs-repo difference for them.

| | XS | S | M | L | XL |
|---|---|---|---|---|---|
| Round | full [token:md.comp.button.small.container.shape.round] | full | full | full | full |
| Square | 12dp [site:/components/buttons/specs] [token:md.comp.button.xsmall.container.shape.square] | 12dp [site:/components/buttons/specs] [token:md.comp.button.small.container.shape.square] | 16dp [site:/components/buttons/specs] [token:md.comp.button.medium.container.shape.square] | 28dp [site:/components/buttons/specs] [token:md.comp.button.large.container.shape.square] | 28dp [site:/components/buttons/specs] [token:md.comp.button.xlarge.container.shape.square] |
| Pressed | 8dp [site:/components/buttons/specs] [token:md.comp.button.xsmall.pressed.container.shape] | 8dp [site:/components/buttons/specs] [token:md.comp.button.small.pressed.container.shape] | 12dp [site:/components/buttons/specs] [token:md.comp.button.medium.pressed.container.shape] | 16dp [site:/components/buttons/specs] [token:md.comp.button.large.pressed.container.shape] | 16dp [site:/components/buttons/specs] [token:md.comp.button.xlarge.pressed.container.shape] |

Platform differences (see `knowledge/conflicts.md`):

- Extra small side padding [differs:md.comp.button.xsmall.leading-space]:
  - Compose: 16dp [token:md.comp.button.xsmall.leading-space].
  - material-web and Flutter: 12dp [token:md.comp.button.xsmall.leading-space].
- Extra small icon–label gap [differs:md.comp.button.xsmall.icon-label-space]:
  - Flutter: 4dp [token:md.comp.button.xsmall.icon-label-space].
  - material-web and Compose: 8dp [token:md.comp.button.xsmall.icon-label-space].
- Selected shape of a round toggle: material-web and Flutter switch to the square corner of the
  size; Compose keeps it fully round [token:md.comp.button.small.selected.container.shape.round]
  [differs:md.comp.button.small.selected.container.shape.round]. The site describes the switch to
  square (see Expressive above).

## Typography

The label's type style per size [token:md.comp.button.xsmall.label-text]:

| XS | S | M | L | XL |
|---|---|---|---|---|
| label large [token:md.comp.button.xsmall.label-text] | label large [token:md.comp.button.small.label-text] | title medium [token:md.comp.button.medium.label-text] | headline small [token:md.comp.button.large.label-text] | headline large [token:md.comp.button.xlarge.label-text] |

- These per-size label tokens exist only in Flutter's data. material-web and Compose define no
  per-size label token [NOT FOUND]; their single label token is `md.comp.button.label-text`.
- Labels use sentence case and stay on one line.

## Color roles and state layers

Configuration → container / icon and label:

- Elevated: surface container low [token:md.comp.button.elevated.container.color] / primary.
- Filled: primary [token:md.comp.button.filled.container.color] / on primary.
- Tonal: secondary container [token:md.comp.button.tonal.container.color] / on secondary container.
- Outlined: no fill, outline variant outline [token:md.comp.button.outlined.outline.color] /
  on surface variant.
- Text: no container / primary [token:md.comp.button.text.label-text.color].
- Toggles use other roles. For example, filled unselected uses surface container
  [token:md.comp.button.filled.unselected.container.color] and filled selected uses primary
  [token:md.comp.button.filled.selected.container.color].
- Other role pairs are allowed when container and label keep at least 3:1 contrast.

State layers (drawn in the label/icon color over the container):

- Hovered: 8% [token:md.comp.button.hovered.state-layer.opacity].
- Focused: 10% [token:md.comp.button.focused.state-layer.opacity].
- Pressed: 10% [token:md.comp.button.pressed.state-layer.opacity].
- Disabled: container at 10% [token:md.comp.button.disabled.container.opacity] and label at
  38% [token:md.comp.button.disabled.label-text.opacity].

## Motion

- Pressed shape morph: material-web and Flutter tie the pressed corner change to the fast spatial
  spring [token:md.comp.button.small.pressed.container.corner-size.motion.spring.damping]
  [token:md.comp.button.small.pressed.container.corner-size.motion.spring.stiffness].
  - Standard scheme: damping 0.9, stiffness 1400 [token:md.sys.motion.spring.fast.spatial.damping]
    [token:md.sys.motion.spring.fast.spatial.stiffness].
  - Expressive scheme: damping 0.6, stiffness 800 [token:md.sys.motion.spring.fast.spatial.damping]
    [token:md.sys.motion.spring.fast.spatial.stiffness].
- Compose defines no per-button motion token [NOT FOUND]. Its code animates the plain button's
  pressed shape with the default effects spring (`MotionSchemeKeyTokens.DefaultEffects`,
  Button.kt:253) and toggle shape changes with the fast spatial spring (`FastSpatial`,
  ToggleButton.kt:176).
- Selected-state shape change and color change: no button-level duration, easing or spring token
  [NOT FOUND]. Springs replace durations and easings in Expressive motion.

## Accessibility

- Enabled buttons need 3:1 contrast against the background. Measure from the container for
  elevated, filled and tonal, and from the label for outlined and text.
- Extra small and small buttons are shorter than 48dp [site:/components/buttons/specs], so give
  them a touch target of at least 48 × 48dp [site:/components/buttons/specs] around the visible
  button.
- At 200% text size [site:/components/buttons/accessibility], Android labels should still fit in two
  lines; otherwise offer the full text in one tap.
- Keyboard: Tab moves to the button; Space or Enter activates it.
- The accessible name equals the visible label, with optional extra context.
- On the web, expect rapid repeated clicks: use the modified motion curve so overlapping
  animations do not resonate.

## Platform mapping

- Jetpack Compose (material3 1.5.0-rc01): `Button`, `FilledTonalButton`, `ElevatedButton`,
  `OutlinedButton`, `TextButton`; toggles: `ToggleButton`, `ElevatedToggleButton`,
  `OutlinedToggleButton`.
  - Size helpers live in `ButtonDefaults` (`ExtraSmallContainerHeight` … `ExtraLargeContainerHeight`,
    `contentPaddingFor`, `iconSizeFor`, `shapesFor`).
  - Compose reads the filled colors from the older `FilledButtonTokens` set, so its
    `md.comp.button.filled.*` ids show as NOT FOUND (`knowledge/not-found.md`).
- Flutter (`material_ui` 1.11.0): `FilledButton`, `FilledButton.tonal`, `ElevatedButton`,
  `OutlinedButton`, `TextButton`.
  - Sizes: `ButtonStyle.sizeVariant` takes `ButtonSizeVariant.xSmall` … `xLarge`, but only
    `ElevatedButton` and `IconButton` read it (`button_style.dart`, `elevated_button.dart`,
    `icon_button.dart`). The other button widgets have no size API.
  - `StyleVariant.material3Expressive` is not a theme-wide switch. Only `ElevatedButton` and
    `IconButton` read it, through `ElevatedButtonThemeData.variant` and
    `IconButtonThemeData.variant`.
  - There is no Expressive toggle button. We supply it, and the sizes for the other button
    widgets, in Phase 3 as reference widgets.
- Web: no maintained official component. Our CSS button is built in Phase 3 from the material-web
  token values above.

## Pitfalls

- More than one filled button competing for attention on a screen.
- Outlined buttons placed next to chips: they look alike, so prefer filled or tonal there.
- Two icons in one button, or an icon stacked above the label.
- Fixed widths narrower than the label, wrapped labels, or ALL CAPS labels (use sentence case).
- Using the elevated configuration by default. The shadow is for separation from busy
  backgrounds, not for emphasis.
- Forgetting the 48dp touch target on extra small and small buttons [site:/components/buttons/specs].
