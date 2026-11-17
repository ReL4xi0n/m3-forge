# States

Every interactive element shows its state the same way: a state layer in the content color, plus a
second cue where the spec has one (elevation, outline, shape, icon fill).

## The states

| State | Trigger | State-layer opacity token | Notes |
|---|---|---|---|
| Hovered | pointer rests on it | `hover-state-layer-opacity` | pointer devices only; combines with focused and selected |
| Focused | keyboard (Tab) or equivalent | `focus-state-layer-opacity` | web also draws the focus ring |
| Pressed | tap, click, Enter/Space | `pressed-state-layer-opacity` | ripple from the touch point; some components also lift |
| Dragged | pressed and moved | `dragged-state-layer-opacity` | list items, cards, chips, sliders |
| Disabled | not available | `disabled-state-layer-opacity` (applied to the content) | no hover, focus or press; out of the tab order |

Selected and activated sit under these; a selected chip can also be hovered.

Token names per platform: web `--md-sys-state-<state>-state-layer-opacity`, Flutter
`M3State.hoverStateLayerOpacity` ..., Compose `M3State.hoverStateLayerOpacity` ... (from
`assets/web/tokens.css`, `assets/flutter/lib/m3/tokens.dart`, `assets/compose/theme/Tokens.kt`).

## State-layer rules

- Color = the content color on that container (the on role): `onPrimary` over `primary`,
  `onSecondaryContainer` over `secondaryContainer`, `primary` for primary-colored text on a surface.
  Never a fixed gray, black or white, and never the container color.
- Only the opacity changes per state. Draw one layer at a time (pressed replaces hover).
- The layer sits between the container and its content, clipped to the container shape. Selection
  controls (checkbox, radio, switch handle) use a round layer around the control.
- Disabled: content and container fade by the disabled tokens of the component; the element keeps
  its layout. Disabled elements are exempt from contrast rules.

## Per platform

- Material components (Flutter `ButtonStyle`, `InkWell`; Compose `ripple()` and component
  defaults) already draw state layers. Do not add a second overlay on top.
- Custom interactive surfaces:
  - Compose: `Modifier.clickable(interactionSource, indication = ripple())`; the ripple uses the
    theme's state opacities.
  - Flutter: wrap in `Material` + `InkWell` (with the container's shape as `customBorder`); set
    `overlayColor` with `WidgetStateProperty` from the content color.
  - Web: a `::before` pseudo-element filled with `currentColor` (or the on role variable), opacity
    from `--md-sys-state-*-state-layer-opacity` on `:hover`, `:focus-visible`, `:active`.
- Focus ring on the web: `outline-width: var(--md-sys-state-focus-indicator-thickness)` and
  `outline-offset: var(--md-sys-state-focus-indicator-outer-offset)`, shown on `:focus-visible`
  only. Our practice: color it with a role that reaches 3:1 against the background behind it
  (`--md-sys-color-primary` on surfaces).

## Selection

- Show selection with more than color: a check mark, a filled icon (FILL 1), a shape change, an
  active indicator, or an underline.
- Navigation bar, rail, drawer and tabs mark exactly one current destination with their active
  indicator.
- Pointer UIs where selection is the main task show checkboxes all the time; touch UIs enter
  selection mode by long press.

## Disabled vs hidden

- Controls that act, select or take input can be disabled (buttons, chips, fields, checkboxes,
  switches, list items).
- Surfaces that inform or navigate are never disabled (tooltips, badges, dialogs, menus, sheets,
  app bars, tabs, navigation). Hide a FAB whose action is unavailable instead of greying it out.
- Put the reason something is unavailable in visible text near the control, not inside it.

## Input and keyboard

- Every action works with touch, mouse and keyboard: Tab order follows reading order, Enter/Space
  activate, Escape closes menus, dialogs and sheets and returns focus to the trigger.
- Mouse clicks show the pressed ripple too. Secondary click may open a context menu.
- Anything done by drag or swipe has a single-tap alternative (a menu item, a button).
