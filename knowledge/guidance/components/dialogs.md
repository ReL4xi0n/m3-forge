---
title: Dialogs
kind: component
pages: [/components/dialogs/overview, /components/dialogs/specs, /components/dialogs/guidelines, /components/dialogs/accessibility]
tokenSets: [dialog, full-screen-dialog, scrim]
expressive: false
fetched: 2026-11-13
---

## Summary

A dialog is a modal surface that interrupts the app to deliver critical information or to get a
decision. While it is open the rest of the app is blocked; it stays until the person confirms,
dismisses, or completes the required step. M3 has two variants: the basic dialog (a floating
card above a scrim) and the full-screen dialog (a whole-screen task surface for compact windows).

## Use it when

- The prompt must block normal use: confirming a risky or destructive action (discarding work,
  deleting), acknowledging critical information, or a decision the app cannot proceed without.
- A short, focused task fits in one surface: a quick choice from a list, a date or time picker.
- Full-screen dialog: a multi-step task on a compact window, especially when it has text fields,
  when changes are not saved instantly, or when it may open further dialogs (for example creating
  a calendar event).
- Avoid when:
  - The message is low or medium priority. Use a snackbar, which needs no action and can time
    out.
  - Options only need to be offered, not forced. A menu interrupts less.
  - On medium and expanded windows, avoid the full-screen dialog; use a basic dialog there.

## Anatomy

Basic dialog:

1. Container.
2. Icon (optional). Centered above the headline.
3. Headline (optional). A short statement or question.
4. Supporting text.
5. Divider (optional). Separates scrolling content from the title and buttons.
6. Action buttons (text buttons).
7. Scrim behind the dialog.

Full-screen dialog:

1. Container.
2. Header (app bar) with a close icon button, the headline and a confirming text button.
3. Content area. Long or variable-length headlines (translations) go here, not in the header.
4. Optional divider and bottom action bar.

## Variants

- Basic: alerts, quick selection lists, confirmations, and pickers (date and time pickers are
  basic dialogs that confirm with OK). Centered by default; on larger windows it may be placed
  elsewhere for ergonomics.
- Full-screen: compact windows only. It is the one dialog over which another dialog may open,
  because opening it resets the perceived elevation of the app.
- Adaptive swap: a full-screen dialog on a phone can become a basic dialog on a tablet or
  desktop.

## Expressive

Not covered by the sources. The dialogs pages list no M3 Expressive changes. Compared with M2, M3
dialogs have new color mappings with dynamic color, more padding to suit the larger corner radius
and headline, an optional custom position, a larger corner radius, and a bigger, darker headline.

## States and behavior

- Writing the headline:
  - Make it a clear, short statement or question about this specific decision.
  - No apologies, no alarm words, no vague "Are you sure?".
  - It may wrap to a second line and may truncate.
- Actions:
  - Two at most. A single action is allowed only as an acknowledgement. With two, one confirms
    and one dismisses.
  - Buttons sit at the trailing edge. The confirming action is nearest the edge, with the
    dismissive action before it; the order mirrors in right-to-left layouts.
  - Disable the confirm button until a required choice is made. Never disable the dismissive
    action.
  - Long labels may stack, with the confirming action on top.
  - Skip a third action such as "Learn more": it leads away and leaves the task unfinished. Use
    an inline expansion, or explain before opening the dialog.
- Full-screen dialog flow:
  - Confirm with a specific verb (Save, Create, Send), not Done, OK or Close. Do not disable it.
  - The close icon (or Cancel / Back) closes without saving. If there are unsaved changes, a
    basic dialog asks whether to discard them.
  - The close "X" is the only navigation in its header.
  - Field errors appear inline next to the field, all at once. A general failure (for example
    network) shows a basic dialog only when confirming fails.
- Scrolling: avoid it. When content must scroll, the title stays pinned at the top and the
  buttons at the bottom; the background never scrolls with the dialog.
- Position: a dialog must never be partly off screen or covered (full-screen dialogs aside).
  Custom placement on large windows keeps a 56dp margin from the screen edges [site:/components/dialogs/guidelines].
- Elevation: basic dialog at level 3 [token:md.comp.dialog.container.elevation]. The full-screen
  header rests at level 0 and rises to level 2 on scroll [token:md.comp.full-screen-dialog.header.on-scroll.container.elevation].

## Measurements

Basic dialog (site spec table; token or code where one exists):

| Property | Value |
|---|---|
| Corner radius | 28dp [site:/components/dialogs/specs] [token:md.comp.dialog.container.shape] |
| Minimum width | 280dp [site:/components/dialogs/specs] |
| Maximum width | 560dp [site:/components/dialogs/specs] |
| Height | Dynamic |
| Padding on all sides | 24dp [site:/components/dialogs/specs] |
| Gap between buttons | 8dp [site:/components/dialogs/specs] |
| Gap, headline to body | 16dp [site:/components/dialogs/specs] |
| Gap, icon to headline | 16dp [site:/components/dialogs/specs] |
| Gap, body to actions | 24dp [site:/components/dialogs/specs] |
| Icon size | 24dp [site:/components/dialogs/specs] [token:md.comp.dialog.with-icon.icon.size] |
| Divider thickness | 1dp [site:/components/dialogs/specs] [token:md.comp.dialog.with-divider.divider.height] |
| Content alignment | Centered with an icon, start-aligned without |

Full-screen dialog:

| Property | Value |
|---|---|
| Corner radius | 0dp [site:/components/dialogs/specs] [token:md.comp.full-screen-dialog.container.shape] |
| Width | Window width, up to 560dp [site:/components/dialogs/specs] |
| Header height | 56dp [site:/components/dialogs/specs] [token:md.comp.full-screen-dialog.header.container.height] |
| Close icon size | 24dp [site:/components/dialogs/specs] [token:md.comp.full-screen-dialog.header.icon.size] |
| Bottom action bar height | 56dp [site:/components/dialogs/specs] [token:md.comp.full-screen-dialog.action-bar.container.height] |
| Top, start and end padding | 24dp [site:/components/dialogs/specs] |
| Gap between elements | 8dp [site:/components/dialogs/specs] |
| Divider thickness | 1dp [site:/components/dialogs/specs] [token:md.comp.full-screen-dialog.with-divider.divider.height] |
| Headline alignment | Start |

Implementation references (Compose `AlertDialog`):

- Width bounds: minimum 280dp [impl:compose-material3/commonMain/androidx/compose/material3/AlertDialog.kt:410], maximum 560dp [impl:compose-material3/commonMain/androidx/compose/material3/AlertDialog.kt:412].
- Container padding: 24dp, or 20dp under precision-pointer sizing [impl:compose-material3/commonMain/androidx/compose/material3/AlertDialog.kt:230].
- Gap below the text: 24dp, or 16dp under precision-pointer sizing [impl:compose-material3/commonMain/androidx/compose/material3/AlertDialog.kt:233].
- Gap between buttons: 8dp [impl:compose-material3/commonMain/androidx/compose/material3/AlertDialog.kt:415].
- Gap below the icon: 16dp [impl:compose-material3/commonMain/androidx/compose/material3/AlertDialog.kt:419].
- Tonal elevation default: 0dp [impl:compose-material3/commonMain/androidx/compose/material3/AlertDialog.kt:219].

Flutter keeps a dialog away from the window edges with a default inset padding:
40dp horizontal, 24dp vertical [impl:material_ui/packages/material_ui/lib/src/dialog.dart:35].

## Typography

| Element | Type style |
|---|---|
| Basic dialog headline | headline small [token:md.comp.dialog.headline.font] |
| Supporting text | body medium [token:md.comp.dialog.supporting-text.font] |
| Action labels | label large [token:md.comp.dialog.action.label-text.font] |
| Full-screen header headline | title large [token:md.comp.full-screen-dialog.header.headline.font] |
| Full-screen header action | label large [token:md.comp.full-screen-dialog.header.action.label-text.font] |

## Color roles and state layers

Basic dialog:

- Container: surface container high [token:md.comp.dialog.container.color].
- Icon: secondary [token:md.comp.dialog.with-icon.icon.color].
- Headline: on surface [token:md.comp.dialog.headline.color].
- Supporting text: on surface variant [token:md.comp.dialog.supporting-text.color].
- Action labels: primary [token:md.comp.dialog.action.label-text.color].
- Divider: outline [token:md.comp.dialog.with-divider.divider.color].
- Scrim: the scrim role at 32% opacity [token:md.comp.scrim.container.opacity].

Full-screen dialog:

- Container and header: surface [token:md.comp.full-screen-dialog.container.color]; the header
  becomes surface container on scroll [token:md.comp.full-screen-dialog.header.on-scroll.container.color].
- Headline and close icon: on surface [token:md.comp.full-screen-dialog.header.headline.color].
- Header action label: primary [token:md.comp.full-screen-dialog.header.action.label-text.color].
- Divider: surface variant [token:md.comp.full-screen-dialog.with-divider.divider.color].

State layers: the action buttons are text buttons; see buttons.md#color-roles-and-state-layers.

## Motion

- Dialog motion tokens (duration, easing or spring): none in either token set [NOT FOUND].
- The guidelines name patterns only: dialogs enter and exit with the enter-and-exit transition, and
  a FAB turns into a full-screen dialog with a container transform.
- Flutter's dialog route fades in over 150ms [impl:material_ui/packages/material_ui/lib/src/dialog.dart:1930]
  with an ease-out curve (dialog.dart:1942). These are Flutter defaults, not tokens.

## Accessibility

- Use dialogs sparingly. They break the reading flow, which is especially disruptive for screen
  reader users; put non-critical information in the page instead.
- At 200% text size [site:/components/dialogs/accessibility] on Android, keep the headline within
  four lines. If it would truncate, give a one-tap way to read all of it.
- Focus:
  - On open, focus goes to the first interactive element inside the dialog.
  - Tab and Shift+Tab cycle through the dialog's elements and wrap at both ends; focus does not
    leave the dialog.
  - Space or Enter activates the focused element. Escape closes the dialog.
- Naming and roles: the dialog's accessible name is normally its headline. On the web a basic
  dialog takes the alertdialog role. Elements inside (text fields, buttons) follow their own
  labeling guidance.
- Assistive technology users must be able to open and close the dialog, use any inputs in it,
  and scroll its content when it overflows.

## Platform mapping

- Jetpack Compose (material3 1.5.0-rc01):
  - `AlertDialog` with `confirmButton`, `dismissButton`, `icon`, `title`, `text` slots, and
    `AlertDialogDefaults`.
  - `BasicAlertDialog` for custom content. The `AlertDialog` overload that takes free `content`
    is deprecated in favour of `BasicAlertDialog`.
  - No full-screen dialog composable in material3, and the full-screen dialog tokens are NOT
    FOUND in Compose.
- Flutter (`material_ui` 1.11.0): `AlertDialog`, `SimpleDialog` with `SimpleDialogOption`,
  `Dialog`, and `Dialog.fullscreen`; open them with `showDialog` or `showAdaptiveDialog`.
- Web: no maintained official component. Our CSS dialog is built in Phase 3 from the
  material-web token values above, on the native `dialog` element.

## Pitfalls

- Dialogs for routine, low-priority messages.
- Vague headlines ("Are you sure?", "Warning!") or apologetic ones.
- More than two actions, or a Cancel button when nothing is being proposed.
- Confirming action placed before the dismissive one, or a disabled dismissive action.
- Full-screen dialogs on tablets and desktops.
- Long headlines in the full-screen header, where they truncate.
- Scrolling dialogs whose title and buttons scroll away with the content.
- Showing a basic dialog after a successful full-screen confirm.
