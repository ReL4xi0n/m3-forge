---
title: Snackbar
kind: component
pages: [/components/snackbar/overview, /components/snackbar/specs, /components/snackbar/guidelines, /components/snackbar/accessibility]
tokenSets: [snackbar]
expressive: false
fetched: 2026-11-13
---

## Summary

A snackbar is a brief, low-priority message about something the app did or is about to do. It
shows up near the bottom of the screen, in front of the content, and never blocks the page. It may
carry one action (such as Undo) and an optional close icon. Without an action it goes away on its
own; with an action it stays until the person responds or dismisses it.

## Use it when

- Confirming a completed process: "Message archived", "Saved to album".
- Offering a quick way to reverse or amend what just happened (Undo).
- The message can be missed without harm. People keep using the page; responding is optional.
- Avoid when:
  - The message is important or needs a decision. Use a dialog, which blocks until the person
    acts.
  - The content needs an icon, a link or rich formatting. Choose another component, or turn the
    link into the action button.
  - The action is the only way to reach a core feature.

| Component | Priority | Response from the person |
|---|---|---|
| Snackbar | Low | Optional; dismisses itself unless it has an action |
| Dialog | High | Required before the app can be used again |

## Anatomy

1. Container: a solid, opaque rectangle with a shadow.
2. Supporting text: the message.
3. Action (optional): a single text button.
4. Close icon (optional): a dismiss affordance.

## Variants

The specs page shows five layouts rather than named variants:

- One line of text.
- One line with an action.
- Two lines of text.
- Two lines with an action.
- Two lines with a longer action, which moves to its own (third) line.

On wide layouts the container extends horizontally so long messages can stay on one line.

## Expressive

- The sources show no Expressive update for snackbars. The M3 changes listed are the new color
  mappings (with dynamic color support) and a clarified rule that a snackbar either disappears by
  itself or persists until acted on.

## States and behavior

- Only one snackbar at a time. A new one waits for the current one to leave, but a snackbar with
  newer information may replace an outdated one at once. Never stack them or show them side by
  side.
- Timing:
  - Without an action: may disappear after about 4 to 10 seconds, depending on the platform. On
    the web, avoid auto-dismissal unless the same information also appears inline.
  - With an action: stays until the person uses the action or dismisses it.
- Action: one text button only, in a color that differs from the message. Never a filled or
  elevated button. A "Dismiss" action is redundant, since the snackbar leaves on its own.
- Text: aim for one line; two lines are allowed on compact screens. On medium and larger screens,
  aim for one line plus an optional action.
- Placement:
  - Bottom of the UI, in front of the main content. It may be nudged up to clear a FAB or a docked
    toolbar.
  - Never in front of navigation bars, frequently used touch targets, or a FAB. Above the FAB is
    correct; in front of or behind it is not.
  - Full-width snackbars are allowed only when the screen has no persistent navigation such as an
    app bar or navigation bar. They may push a FAB up, but other components must not animate
    together with the snackbar.
  - Compact windows: fixed distance from the leading, trailing and bottom edges; the height grows
    with one or two lines.
  - Medium and expanded windows: the width grows to fit longer text (lines of about 40 to 60
    characters read best). Left or center alignment are both fine if the position is consistent.
    Do not place it flush against an edge.
  - On the web, do not let it fully cover the element that has keyboard focus.
- The container may be slightly translucent as long as the text stays legible. Do not reshape it
  drastically.

## Measurements

| Part | Value |
|---|---|
| Height, one line | 48dp [token:md.comp.snackbar.with-single-line.container.height] |
| Height, two lines | 68dp [token:md.comp.snackbar.with-two-lines.container.height] |
| Corner radius | 4dp [token:md.comp.snackbar.container.shape] |
| Elevation | level 3, 6dp [token:md.comp.snackbar.container.elevation] |
| Close icon size | 24dp [token:md.comp.snackbar.icon.size] |

- Site and repositories disagree on the two-line height. The guidelines say a compact snackbar
  grows from 48dp to 64dp [site:/components/snackbar/guidelines] [token:md.comp.snackbar.with-two-lines.container.height].
  The token value (68dp [token:md.comp.snackbar.with-two-lines.container.height]) wins.
- The specs page labels padding only in images; we found no printed padding values and no padding
  token [NOT FOUND].
- Compose code constants (implementation, not tokens):
  - Maximum width 600dp [impl:compose-material3/commonMain/androidx/compose/material3/Snackbar.kt:604].
  - Outer margin around the snackbar 12dp [impl:compose-material3/commonMain/androidx/compose/material3/Snackbar.kt:272].
  - Horizontal text spacing 16dp [impl:compose-material3/commonMain/androidx/compose/material3/Snackbar.kt:608].
  - Horizontal spacing on the button side 8dp [impl:compose-material3/commonMain/androidx/compose/material3/Snackbar.kt:610].
- Compose has its own ids for the heights: 48dp [token:md.comp.snackbar.single-line-container-height]
  and 68dp [token:md.comp.snackbar.two-lines-container-height].

## Typography

- Supporting text: body medium [token:md.comp.snackbar.supporting-text.font].
- Action label: label large [token:md.comp.snackbar.action.label-text.font].
- Flutter's data gives the styles through type tokens instead
  [token:md.comp.snackbar.supporting-text.type] [token:md.comp.snackbar.action.label-text.type].

## Color roles and state layers

- Container: inverse surface [token:md.comp.snackbar.container.color].
- Supporting text: inverse on surface [token:md.comp.snackbar.supporting-text.color].
- Action label: inverse primary [token:md.comp.snackbar.action.label-text.color].
- Close icon: inverse on surface [token:md.comp.snackbar.icon.color].
- State layers on the action use inverse primary; on the close icon they use inverse on surface:
  - Hover: 8% [token:md.comp.snackbar.action.hover.state-layer.opacity]
    [token:md.comp.snackbar.icon.hover.state-layer.opacity].
  - Focus: 10% [token:md.comp.snackbar.action.focus.state-layer.opacity]
    [token:md.comp.snackbar.icon.focus.state-layer.opacity].
  - Pressed: 10% [token:md.comp.snackbar.action.pressed.state-layer.opacity]
    [token:md.comp.snackbar.icon.pressed.state-layer.opacity].
- The inverse roles make the snackbar stand out from the page in both light and dark themes; keep
  the default mapping.

## Motion

- No snackbar motion token exists in any repository [NOT FOUND]. The site only says that the
  snackbar's entrance and exit must not drag other components (such as the FAB) into the same
  animation.
- Compose's `SnackbarHost` fades with the fast effects spring and scales with the fast spatial
  spring (`MotionSchemeKeyTokens.FastEffects` and `FastSpatial`, SnackbarHost.kt:342 and :355).
  - Fast effects: damping 1, stiffness 3800 [token:md.sys.motion.spring.fast.effects.damping]
    [token:md.sys.motion.spring.fast.effects.stiffness].
  - Fast spatial, standard scheme: damping 0.9, stiffness 1400; expressive scheme: damping 0.6,
    stiffness 800 [token:md.sys.motion.spring.fast.spatial.damping]
    [token:md.sys.motion.spring.fast.spatial.stiffness].
- Flutter's entrance and exit take 250ms [impl:material_ui/packages/material_ui/lib/src/snack_bar.dart:30].

## Accessibility

- A new snackbar is announced, but focus does not move to it. Use a polite (queued) live region on
  Android and the web; iOS 17 and later announce politely by default. At app launch, announce it
  after the page title.
- Never trap focus in a snackbar. When focus leaves it, return to the element that triggered it,
  or the next logical element if that one is gone. On Compose, focus may move to the nearest
  visible element or the first actionable item.
- On the web, provide a documented keyboard shortcut that jumps to a snackbar with an action
  (for example Alt+G).
- Keyboard: Tab moves between interactive elements; Esc dismisses a focused snackbar.
- Snackbars with an action must not auto-dismiss, so people can respond at their own pace.
- On the web, auto-dismissing snackbars are hard for people who need more time. Either repeat the
  information inline (for example, the Save button turns into "Saved") or add an action so it
  stays until acted on.

## Platform mapping

- Jetpack Compose (material3 1.5.0-rc01): `Snackbar` (with `action`, `dismissAction` and
  `actionOnNewLine`), shown through `SnackbarHost` and `SnackbarHostState.showSnackbar`.
  - `showSnackbar` picks `SnackbarDuration.Short` without an action and `Indefinite` with one
    (SnackbarHost.kt:105).
  - Short lasts 4000ms [impl:compose-material3/commonMain/androidx/compose/material3/SnackbarHost.kt:306].
  - Long lasts 10000ms [impl:compose-material3/commonMain/androidx/compose/material3/SnackbarHost.kt:305].
- Flutter (`material_ui` 1.11.0): `SnackBar` with `SnackBarAction` and `showCloseIcon`, shown via
  `ScaffoldMessengerState.showSnackBar`.
  - `persist` defaults to true when an action is set (snack_bar.dart:323).
  - Default display time is 4000ms [impl:material_ui/packages/material_ui/lib/src/snack_bar.dart:31].
- Web: material-web has no snackbar, as the accessibility page also notes. Our CSS snackbar is
  built in Phase 3 from the material-web token values above.

## Pitfalls

- Using a snackbar for a decision or critical error; that is a dialog.
- Several snackbars stacked, queued side by side, or shown at once.
- Filled or elevated buttons, two actions, or a pointless "Dismiss" action.
- Icons, links or styled text inside the message.
- Covering navigation, a FAB, or the focused element.
- Auto-dismissing on the web with no inline feedback.
- Moving focus into the snackbar when it appears.
- Animating the FAB or other components together with the snackbar.
