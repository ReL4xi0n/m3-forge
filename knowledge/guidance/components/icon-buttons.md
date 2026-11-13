---
title: Icon buttons
kind: component
pages: [/components/icon-buttons/overview, /components/icon-buttons/specs, /components/icon-buttons/guidelines, /components/icon-buttons/accessibility, /styles/icons/applying-icons]
tokenSets: [icon-button, icon-button.xsmall, icon-button.small, icon-button.medium, icon-button.large, icon-button.xlarge, icon-button.filled, icon-button.tonal, icon-button.outlined, icon-button.standard]
expressive: true
fetched: 2026-11-13
---

## Summary

An icon button performs one action that is shown by an icon alone, with no label. It has two
variants: default (a plain action, which may also open a menu or search) and toggle (an on/off
choice such as favorite or bookmark). M3 Expressive gave it the same five sizes and two shapes as
buttons, added three widths, and made the container morph when pressed or selected.

## Use it when

- The action is common and the icon reads without a caption: search, share, favorite, more.
- The button sits on a background or inside a container component: app bars, toolbars, cards.
  For dense layouts, put several icon buttons side by side in a toolbar or a button group.
- Choose the color style by emphasis, from most to least:
  - Filled: key actions with high impact, such as download or delete. Use sparingly.
  - Tonal: a middle step. Good for a secondary action that sits next to a high-emphasis one (for
    example "raise hand" between an outlined menu button and a filled "end call").
  - Outlined: medium emphasis, when the button is not the focus of the task (paging through cards).
  - Standard: low emphasis, and the choice for colorful surfaces.
- Use a contained style (filled, tonal, outlined) when the button must stand apart from a busy
  background such as a photo.
- Use the toggle variant only when the action really has a selected state.
- Avoid when:
  - The icon's meaning could be read more than one way; use a labelled button instead.
  - The action has no on/off state but you reach for the toggle variant (an overflow menu, for
    example).
  - The screen already shows many icon buttons; keep to a few.

## Anatomy

1. Container. Visible for filled, tonal and outlined. The standard style has no visible container
   at rest; it appears only through the state layer.
2. Icon. A system icon with one clear meaning.

## Variants

- Behaviour: default, or toggle (unselected and selected).
- Color style: filled (default), tonal, outlined, standard. Each style is available for both
  default and toggle buttons.
- Size: five steps from extra small to extra large, with small as the default. Heights are in
  Measurements; the default is 40dp [site:/components/icon-buttons/guidelines] [token:md.comp.icon-button.small.container.height].
- Width: narrow, default, wide. Width changes only the side padding, never the height or the icon.
- Shape: round (default) or square.
- Use size and width to rank actions: the main action (play/pause, start/stop) should be the most
  prominent through color or size. Buttons of equal importance should be equal in size.
- Changes from M2 (these predate M3 Expressive): M2 called these components toggle buttons. M3
  splits icon buttons into two variants, default and toggle, and gives them new color mappings
  that work with dynamic color.

## Expressive

- Added in the May 2025 Expressive update: the four extra sizes, the three widths, the square
  shape, and shape morphing on press and on selection.
- The four color styles (filled, tonal, outlined, standard) are now configurations of one
  component rather than separate types.
- Inside a standard button group, pressing one icon button also pushes its neighbours; see
  button-groups.md#motion.

## States and behavior

- States: enabled, disabled, hovered, focused, pressed. Toggles add unselected and selected.
- Disabled: container at 10% [token:md.comp.icon-button.disabled.container.opacity] and icon at
  38% [token:md.comp.icon-button.disabled.icon.opacity].
- Pressed: the container morphs toward a squarer pressed shape. At a given size the round and the
  square button share one pressed radius.
- Selected (toggle): the resting shape flips. A round toggle becomes square when selected; if the
  unselected shape is square, the selected one is round.
- Icon fill rules:
  - Default icon buttons use filled icons.
  - Toggles use the outlined icon when unselected and the filled icon when selected.
  - If no filled glyph exists, raise the selected icon's weight to semibold, or bold if semibold is
    not visible enough. Selection must change at least two properties, never color alone.
- Hover on the web shows a tooltip that names the action, not the icon ("Add to favorites", not
  "Heart").

## Measurements

Per size. The values are material-web's (canonical). No token cited in this note differs on
another platform; the linter checks this, and a difference would need a `[differs:]` marker.

| | XS | S | M | L | XL |
|---|---|---|---|---|---|
| Height | 32dp [token:md.comp.icon-button.xsmall.container.height] | 40dp [token:md.comp.icon-button.small.container.height] | 56dp [token:md.comp.icon-button.medium.container.height] | 96dp [token:md.comp.icon-button.large.container.height] | 136dp [token:md.comp.icon-button.xlarge.container.height] |
| Icon | 20dp [token:md.comp.icon-button.xsmall.icon.size] | 24dp [token:md.comp.icon-button.small.icon.size] | 24dp [token:md.comp.icon-button.medium.icon.size] | 32dp [token:md.comp.icon-button.large.icon.size] | 40dp [token:md.comp.icon-button.xlarge.icon.size] |
| Side padding, narrow | 4dp [token:md.comp.icon-button.xsmall.narrow.leading-space] | 4dp [token:md.comp.icon-button.small.narrow.leading-space] | 12dp [token:md.comp.icon-button.medium.narrow.leading-space] | 16dp [token:md.comp.icon-button.large.narrow.leading-space] | 32dp [token:md.comp.icon-button.xlarge.narrow.leading-space] |
| Side padding, default | 6dp [token:md.comp.icon-button.xsmall.default.leading-space] | 8dp [token:md.comp.icon-button.small.default.leading-space] | 16dp [token:md.comp.icon-button.medium.default.leading-space] | 32dp [token:md.comp.icon-button.large.default.leading-space] | 48dp [token:md.comp.icon-button.xlarge.default.leading-space] |
| Side padding, wide | 10dp [token:md.comp.icon-button.xsmall.wide.leading-space] | 14dp [token:md.comp.icon-button.small.wide.leading-space] | 24dp [token:md.comp.icon-button.medium.wide.leading-space] | 48dp [token:md.comp.icon-button.large.wide.leading-space] | 72dp [token:md.comp.icon-button.xlarge.wide.leading-space] |
| Outline width (outlined) | 1dp [token:md.comp.icon-button.xsmall.outlined.outline.width] | 1dp [token:md.comp.icon-button.small.outlined.outline.width] | 1dp [token:md.comp.icon-button.medium.outlined.outline.width] | 2dp [token:md.comp.icon-button.large.outlined.outline.width] | 3dp [token:md.comp.icon-button.xlarge.outlined.outline.width] |

- Side padding is applied on both sides of the icon (leading and trailing tokens carry equal
  values); the container width is the icon plus both paddings.

Corner radius. The site's table and the tokens give the round, square and pressed values;
`knowledge/conflicts.md` lists no site-vs-repo difference for them.

| | XS | S | M | L | XL |
|---|---|---|---|---|---|
| Round | full [token:md.comp.icon-button.xsmall.container.shape.round] | full | full | full | full |
| Square | 12dp [site:/components/icon-buttons/specs] [token:md.comp.icon-button.xsmall.container.shape.square] | 12dp [site:/components/icon-buttons/specs] [token:md.comp.icon-button.small.container.shape.square] | 16dp [site:/components/icon-buttons/specs] [token:md.comp.icon-button.medium.container.shape.square] | 28dp [site:/components/icon-buttons/specs] [token:md.comp.icon-button.large.container.shape.square] | 28dp [site:/components/icon-buttons/specs] [token:md.comp.icon-button.xlarge.container.shape.square] |
| Pressed | 8dp [site:/components/icon-buttons/specs] [token:md.comp.icon-button.xsmall.pressed.container.shape] | 8dp [site:/components/icon-buttons/specs] [token:md.comp.icon-button.small.pressed.container.shape] | 12dp [site:/components/icon-buttons/specs] [token:md.comp.icon-button.medium.pressed.container.shape] | 16dp [site:/components/icon-buttons/specs] [token:md.comp.icon-button.large.pressed.container.shape] | 16dp [site:/components/icon-buttons/specs] [token:md.comp.icon-button.xlarge.pressed.container.shape] |
| Selected, round toggle | 12dp [token:md.comp.icon-button.xsmall.selected.container.shape.round] | 12dp [token:md.comp.icon-button.small.selected.container.shape.round] | 16dp [token:md.comp.icon-button.medium.selected.container.shape.round] | 28dp [token:md.comp.icon-button.large.selected.container.shape.round] | 28dp [token:md.comp.icon-button.xlarge.selected.container.shape.round] |
| Selected, square toggle | full [token:md.comp.icon-button.xsmall.selected.container.shape.square] | full | full | full | full |

- Touch target: extra small and small icon buttons are shorter than the minimum, so give them a
  target of at least 48 × 48dp [site:/components/icon-buttons/specs] around the container.

## Typography

- Icon buttons carry no text, so there is no label type token [NOT FOUND].
- The web hover tooltip follows the plain tooltip styles, not an icon-button token.

## Color roles and state layers

Default (non-toggle) icon buttons, container / icon:

- Filled: primary [token:md.comp.icon-button.filled.container.color] / on primary
  [token:md.comp.icon-button.filled.icon.color].
- Tonal: secondary container [token:md.comp.icon-button.tonal.container.color] / on secondary
  container [token:md.comp.icon-button.tonal.icon.color].
- Outlined: no fill, outline variant outline [token:md.comp.icon-button.outlined.outline.color] /
  on surface variant [token:md.comp.icon-button.outlined.icon.color].
- Standard: no container / on surface variant [token:md.comp.icon-button.standard.icon.color].

Toggle icon buttons, unselected → selected:

- Filled: surface container with on surface variant icon
  [token:md.comp.icon-button.filled.unselected.container.color] → primary with on primary
  [token:md.comp.icon-button.filled.selected.container.color].
- Tonal: secondary container with on secondary container
  [token:md.comp.icon-button.tonal.unselected.container.color] → secondary with on secondary
  [token:md.comp.icon-button.tonal.selected.container.color].
- Outlined: outline variant outline with on surface variant icon
  [token:md.comp.icon-button.outlined.unselected.outline.color] → inverse surface with inverse on
  surface [token:md.comp.icon-button.outlined.selected.container.color].
- Standard: on surface variant icon [token:md.comp.icon-button.standard.unselected.icon.color] →
  primary icon [token:md.comp.icon-button.standard.selected.icon.color].
- Other role pairs (tertiary and on tertiary, for example) are allowed when container and icon keep
  at least 3:1 contrast.

State layers (drawn in the icon color over the container):

- Hovered: 8% [token:md.comp.icon-button.hovered.state-layer.opacity].
- Focused: 10% [token:md.comp.icon-button.focused.state-layer.opacity].
- Pressed: 10% [token:md.comp.icon-button.pressed.state-layer.opacity].
- Disabled: container at 10% [token:md.comp.icon-button.disabled.container.opacity] and icon at
  38% [token:md.comp.icon-button.disabled.icon.opacity].

## Motion

- Pressed shape morph: material-web and Flutter tie the pressed corner change to the fast spatial
  spring [token:md.comp.icon-button.small.pressed.container.corner-size.motion.spring.damping]
  [token:md.comp.icon-button.small.pressed.container.corner-size.motion.spring.stiffness].
  - Standard scheme: damping 0.9, stiffness 1400 [token:md.sys.motion.spring.fast.spatial.damping]
    [token:md.sys.motion.spring.fast.spatial.stiffness].
  - Expressive scheme: damping 0.6, stiffness 800 [token:md.sys.motion.spring.fast.spatial.damping]
    [token:md.sys.motion.spring.fast.spatial.stiffness].
- Selected-state shape change and color change: no icon-button duration, easing or spring token
  [NOT FOUND].
- Compose defines no icon-button motion token [NOT FOUND]. Its code animates both the press morph
  and the toggle morph with the default effects spring, chosen so the shape does not bounce
  [impl:compose-material3/commonMain/androidx/compose/material3/IconButton.kt:1581]
  [impl:compose-material3/commonMain/androidx/compose/material3/IconButton.kt:1599]: damping 1,
  stiffness 1600 [token:md.sys.motion.spring.default.effects.damping]
  [token:md.sys.motion.spring.default.effects.stiffness].
- Flutter's Expressive icon-button defaults animate shape and color changes over
  `kThemeChangeDuration`
  [impl:material_ui/packages/material_ui/lib/src/generated/icon_button_defaults_m3e.g.dart:21],
  which is 200ms [impl:material_ui/packages/material_ui/lib/src/constants.dart:39], rather than a
  spring.
- Icon change on selection (outlined to filled glyph): no motion token [NOT FOUND].

## Accessibility

- People using assistive technology must be able to reach and activate each icon button and
  understand what its icon means.
- The icon (or, for contained styles, the container) needs at least 3:1 contrast with the
  surface behind it.
- Keyboard: Tab moves focus to an enabled icon button; Space or Enter activates it.
- The accessible name describes the action ("Add to favorites", "Send message"), never the shape
  of the glyph.
- Target size is at least 48dp [site:/components/icon-buttons/accessibility], also when the icon
  button is nested inside another component such as an app bar.
- Do not apply density by default: it would push targets below the 48 × 48 CSS pixel minimum
  [site:/components/icon-buttons/accessibility]. Offer higher density only as a user choice, and
  keep the target size even then.
- On the web, show a tooltip carrying the accessible label on hover; keep it short.
- Toggles must show selection through more than color (fill or weight change plus color).

## Platform mapping

- Jetpack Compose (material3 1.5.0-rc01):
  - Default: `IconButton`, `FilledIconButton`, `FilledTonalIconButton`, `OutlinedIconButton`.
  - Toggle: `IconToggleButton`, `FilledIconToggleButton`, `FilledTonalIconToggleButton`,
    `OutlinedIconToggleButton`.
  - Sizes and widths: `IconButtonDefaults.extraSmallContainerSize(...)` …
    `extraLargeContainerSize(...)`, each taking an `IconButtonWidthOption` (`Narrow`, `Uniform`,
    `Wide`); icon sizes `extraSmallIconSize` … `extraLargeIconSize`.
  - Shapes: `IconButtonDefaults.shapes(...)` and `toggleableShapes(...)`, with per-size values such
    as `smallRoundShape`, `smallSquareShape`, `smallPressedShape`, `smallSelectedRoundShape`.
  - Colors also come in "vibrant" variants (`iconButtonVibrantColors`, and so on).
  - Compose reads its colors from the older `FilledIconButtonTokens`, `FilledTonalIconButtonTokens`
    and `OutlinedIconButtonTokens` sets, so the `md.comp.icon-button.*` color ids show NOT FOUND
    for Compose. `knowledge/conflicts.md` lists where those older ids differ from material-web.
- Flutter (`material_ui` 1.11.0): `IconButton`, `IconButton.filled`, `IconButton.filledTonal`,
  `IconButton.outlined`. Passing `isSelected` (with an optional `selectedIcon`) makes it a toggle.
  - Expressive styling: set `IconButtonThemeData.variant` to `StyleVariant.material3Expressive`,
    then pick `ButtonStyle.sizeVariant` (`ButtonSizeVariant.xSmall` … `xLarge`),
    `ButtonStyle.iconButtonWidth` (`IconButtonWidthVariant.narrow`, `standard`, `wide`) and
    `ButtonStyle.shapeVariant` (`ButtonShapeVariant.round`, `square`).
- Web: no maintained official component. Our CSS icon button is built in Phase 3 from the
  material-web token values above.

## Pitfalls

- Icons whose meaning is ambiguous, or labels that name the glyph instead of the action.
- Overusing the filled style; use it sparingly, for key high-emphasis actions.
- Toggle variant on actions that cannot be "on" (overflow, back, close).
- A selected toggle that differs only in color; switch to the filled glyph (or a heavier weight).
- Applying density by default, or leaving extra small and small buttons without their
  48dp target [site:/components/icon-buttons/specs].
- Mixing sizes among buttons of equal importance.
- Standard icon buttons on a busy image without a contained style to separate them.
