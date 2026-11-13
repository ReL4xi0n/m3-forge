---
title: Tooltips
kind: component
pages: [/components/tooltips/overview, /components/tooltips/specs, /components/tooltips/guidelines, /components/tooltips/accessibility]
tokenSets: [plain-tooltip, rich-tooltip]
expressive: false
fetched: 2026-11-13
---

## Summary

A tooltip adds context to a UI element when it is hovered, focused or long-pressed. There are two
variants. A plain tooltip is a short label, mostly for icon-only controls. A rich tooltip is a small
card with optional subhead, body text and up to two text buttons, used to explain a feature or
define a term. Both are temporary by default; a rich tooltip can also be made persistent.

## Use it when

- Plain: naming an icon-only button or field that has no visible text ("Settings", "Present now").
- Rich: a definition, a short explanation, or an introduction to a new feature, optionally with an
  action such as "Learn more".
- Avoid when:
  - The element already shows a text label. A plain tooltip that repeats the label adds nothing.
  - The information is critical or a warning that must be read. Tooltips are easy to miss; use a
    dialog.
  - The tooltip would cover the element it describes or other information people need.

## Anatomy

Plain tooltip:

1. Container.
2. Supporting text.

Rich tooltip:

1. Container.
2. Subhead (optional).
3. Supporting text.
4. Text buttons (optional, at most two).

## Variants

- Plain tooltip: one short label. Avoid line wraps and multiple pieces of information. A short
  second line is acceptable for things like an account name and email address.
- Rich tooltip, in five layouts:
  - subhead, text and two buttons;
  - subhead, text and one button;
  - subhead and text;
  - text and one button;
  - text and two buttons.
- Rich tooltips are transient by default or persistent (see States and behavior).

## Expressive

- The sources show no Expressive update for tooltips. The M3 changes listed are new color mappings
  with dynamic color support and rounder corners on rich tooltips.

## States and behavior

- Triggers: hover on desktop, long press on mobile, and keyboard focus. Persistent rich tooltips
  open only on click or tap, or automatically on page load to introduce a new feature; hovering
  does not open them.
- Dismissal:
  - Transient tooltips (plain and rich) hide 1.5 seconds after the pointer or focus leaves the
    target area.
  - Persistent rich tooltips stay until the person interacts with something else.
  - Showing a new tooltip closes any other one; only one is visible at a time.
- Placement:
  - Plain: centered above the element by default. Below it when the element sits in an app bar.
  - Gap to the element: 4dp [site:/components/tooltips/guidelines] when the element has a visible
    boundary (a button), 8dp [site:/components/tooltips/guidelines] when it does not (plain text).
  - Rich: below and to the end side of the element by default, never covering it.
  - When space runs out, the tooltip shifts in 8dp [site:/components/tooltips/guidelines] steps to
    stay on screen.
  - On desktop a tooltip may appear centered below the element and stays while the pointer moves
    within the target area.
- Rich tooltip content:
  - Keep the subhead to a single line that sums up the message. Include it whenever the tooltip
    opens by itself (on page load).
  - Keep button labels short so two fit side by side; avoid stacking them.
- Do not put persistent rich tooltips on icon buttons.

## Measurements

Plain tooltip:

| Part | Value |
|---|---|
| Container height | 24dp [site:/components/tooltips/specs] |
| Horizontal padding | 8dp [site:/components/tooltips/specs] |
| Corner radius | 4dp [token:md.comp.plain-tooltip.container.shape] |

Rich tooltip:

| Part | Value |
|---|---|
| Top padding | 12dp [site:/components/tooltips/specs] |
| Bottom padding | 8dp [site:/components/tooltips/specs] |
| Start and end padding | 16dp [site:/components/tooltips/specs] |
| Corner radius | 12dp [token:md.comp.rich-tooltip.container.shape] |
| Elevation | level 2, 3dp [token:md.comp.rich-tooltip.container.elevation] |

- There is no height, padding or width token for either variant [NOT FOUND]; those values come
  from the specs page.
- Compose code constants (implementation, not tokens):
  - Plain: minimum height 24dp [impl:compose-material3/commonMain/androidx/compose/material3/Tooltip.kt:1451],
    minimum width 40dp [impl:compose-material3/commonMain/androidx/compose/material3/Tooltip.kt:1453].
  - Plain padding: 8dp [impl:compose-material3/commonMain/androidx/compose/material3/Tooltip.kt:1457]
    horizontal and 4dp [impl:compose-material3/commonMain/androidx/compose/material3/Tooltip.kt:1455]
    vertical.
  - Maximum width: plain 200dp [impl:compose-material3/commonMain/androidx/compose/material3/Tooltip.kt:535],
    rich 320dp [impl:compose-material3/commonMain/androidx/compose/material3/Tooltip.kt:538].
  - Rich horizontal padding 16dp [impl:compose-material3/commonMain/androidx/compose/material3/Tooltip.kt:1461].
  - Gap to the anchor 4dp [impl:compose-material3/commonMain/androidx/compose/material3/Tooltip.kt:1449].
  - Optional caret, 16dp [impl:compose-material3/commonMain/androidx/compose/material3/Tooltip.kt:532]
    wide by 8dp [impl:compose-material3/commonMain/androidx/compose/material3/Tooltip.kt:532] tall.
    The site does not show a caret.

## Typography

- Plain tooltip text: body small [token:md.comp.plain-tooltip.supporting-text.font].
- Rich tooltip subhead: title small [token:md.comp.rich-tooltip.subhead.font].
- Rich tooltip text: body medium [token:md.comp.rich-tooltip.supporting-text.font].
- Rich tooltip buttons: label large [token:md.comp.rich-tooltip.action.label-text.font].
- Flutter's data gives the styles through type tokens instead, for example
  [token:md.comp.plain-tooltip.supporting-text.type] and [token:md.comp.rich-tooltip.subhead.type].

## Color roles and state layers

Plain tooltip:

- Container: inverse surface [token:md.comp.plain-tooltip.container.color].
- Text: inverse on surface [token:md.comp.plain-tooltip.supporting-text.color].

Rich tooltip:

- Container: surface container [token:md.comp.rich-tooltip.container.color].
- Subhead: on surface variant [token:md.comp.rich-tooltip.subhead.color].
- Text: on surface variant [token:md.comp.rich-tooltip.supporting-text.color].
- Buttons: primary [token:md.comp.rich-tooltip.action.label-text.color].
- Button state layers, in primary:
  - Hover: 8% [token:md.comp.rich-tooltip.action.hover.state-layer.opacity].
  - Focus: 10% [token:md.comp.rich-tooltip.action.focus.state-layer.opacity].
  - Pressed: 10% [token:md.comp.rich-tooltip.action.pressed.state-layer.opacity].

The containers themselves have no state layers.

## Motion

- No tooltip motion token exists in any repository [NOT FOUND]. The site gives only the hide
  delay: 1.5 seconds after leaving the target.
- Compose shows a transient tooltip for 1500ms [impl:compose-material3/commonMain/androidx/compose/material3/internal/BasicTooltip.kt:465].
- Flutter's `Tooltip` defaults:
  - Stays for 1500ms [impl:material_ui/packages/material_ui/lib/src/tooltip.dart:416] after a long
    press ends.
  - Hides 100ms [impl:material_ui/packages/material_ui/lib/src/tooltip.dart:417] after the pointer
    leaves.

## Accessibility

- People must be able to receive the tooltip and open it with a keyboard or switch, not only by
  hovering.
- Transient tooltips stay long enough to read and linger briefly after the pointer leaves, without
  interrupting the task.
- Open on hover or focus for actionable elements; rich tooltips may also open on selection. Never
  hide essential information inside them.
- Do not let the container block important content or stop someone from finishing an action.
- Focus inside a rich tooltip moves top to bottom through its interactive parts (parent element,
  inline link, button). Do not trap screen reader or keyboard focus; people continue linearly
  through the page afterwards.
- Keyboard: Tab moves to a button in the tooltip; Space or Enter activates the focused element.
- Give the container the tooltip role (or the closest platform equivalent), and label every
  element inside it according to its own guidance.

## Platform mapping

- Jetpack Compose (material3 1.5.0-rc01): `TooltipBox` with `TooltipScope.PlainTooltip` or
  `TooltipScope.RichTooltip` (`title`, `action`, optional `caretShape`), and state from
  `rememberTooltipState` (`isPersistent` for persistent rich tooltips). Placement helpers are in
  `TooltipDefaults` (`rememberPlainTooltipPositionProvider`, `rememberRichTooltipPositionProvider`).
  These APIs need `@ExperimentalMaterial3Api`.
- Flutter (`material_ui` 1.11.0): `Tooltip` provides the plain tooltip (`message`, or `richMessage`
  for styled text). There is no M3 rich tooltip with subhead, surface container and action
  buttons. We supply it in Phase 3 as a reference widget.
- Web: no maintained official component. Our CSS tooltips are built in Phase 3 from the
  material-web token values above.

## Pitfalls

- Tooltips that repeat a visible label.
- Hiding critical or destructive-action warnings in a tooltip.
- Plain tooltips that wrap over several lines or carry several facts.
- Rich tooltips with stacked buttons, more than two buttons, or a long multi-line subhead.
- Persistent rich tooltips on icon buttons.
- Showing two tooltips at once.
- Tooltips that open only on hover, with no keyboard or long-press path.
- Trapping focus inside a rich tooltip.
