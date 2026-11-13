---
title: Bottom sheets
kind: component
pages: [/components/bottom-sheets/overview, /components/bottom-sheets/specs, /components/bottom-sheets/guidelines, /components/bottom-sheets/accessibility]
tokenSets: [sheet.bottom, scrim]
expressive: false
fetched: 2026-11-13
---

## Summary

A bottom sheet is a surface anchored to the bottom edge that holds secondary content or actions:
a share sheet, a menu of actions, a mini player, details over a map. It is meant for compact and
medium windows. The standard sheet lives alongside the main content; the modal sheet sits above a
scrim and blocks the app until it is used or dismissed.

## Use it when

- Standard: supplementary content that people use while still working with the main screen, such
  as a music player while browsing, or place details that continue below the fold over a map.
- Modal: on mobile, instead of an inline menu or a simple dialog, especially for long action
  lists or items that need an icon and a description.
- Avoid when:
  - The content is the screen's main content. Sheets are for secondary material.
  - The window is expanded (desktop). A side sheet fits better there; for complex, long-lived
    tasks consider a non-transient surface.
  - Modal sheets outside mobile apps.

## Anatomy

1. Container. The only required part; its size follows its content.
2. Drag handle (optional). Resizes the sheet and doubles as a button.
3. Scrim (modal sheets only).

Typical content: list items (text, icons, text buttons), dividers between groups of actions,
thumbnails, images and video, or a grid of menu items. At full-screen height a sheet shows an app
bar with a collapse icon (standard) or a close affordance (modal).

## Variants

- Standard: no scrim, coexists with the main UI. It can rest at several preset heights, from a
  small preview up to full screen.
- Modal: above a scrim, blocks the app. Its first position is capped at
  50% [site:/components/bottom-sheets/guidelines] of the screen height; if the content is taller, the person can pull it to
  full height and scroll inside it.
- Expandable: a sheet may be fully raised and switch between collapsed and expanded, set by the
  system or by the person, which gives a predictable footprint.
- Apart from the scrim, both variants share one spec.

## Expressive

Not covered by the sources. The bottom sheets pages describe no M3 Expressive change. Against M2
they list new color mappings with dynamic color, a larger top corner radius, a maximum width and
an optional drag handle with an accessible hit area.

## States and behavior

- A modal sheet closes when the person:
  - picks an item or action in it;
  - taps the scrim;
  - swipes it down;
  - uses the close affordance in its app bar.
- A full-screen modal sheet must show a close affordance.
- Heights: the drag handle can be dragged, or selected to step through the preset heights or to
  close. Tapping the scrim always closes. Sheets with several heights but no drag handle need
  another single-pointer control.
- Scrolling: content taller than the visible area scrolls; a sheet can also scroll horizontally
  without moving the rest of the screen.
- Predictive back (Android): during the back swipe the sheet pulls in from the side edges and the
  previous screen shows behind it; release or fling commits, reversing cancels.
- Adaptive: full width on compact windows. On wider windows the sheet stops at its maximum width
  (which may be overridden). On desktop, swap it for a side sheet with the same content.
- Elevation: level 1 for both the modal and the standard sheet
  [token:md.comp.sheet.bottom.docked.modal.container.elevation]
  [token:md.comp.sheet.bottom.docked.standard.container.elevation].

## Measurements

| Property | Value |
|---|---|
| Maximum width | 640dp [site:/components/bottom-sheets/specs] |
| Top corners | 28dp [site:/components/bottom-sheets/overview] [token:md.comp.sheet.bottom.docked.container.shape] |
| Corners when minimized | 0dp [token:md.comp.sheet.bottom.docked.minimized.container.shape] |
| Drag handle width | 32dp [token:md.comp.sheet.bottom.docked.drag-handle.width] |
| Drag handle height | 4dp [token:md.comp.sheet.bottom.docked.drag-handle.height] |
| Space above and below the drag handle | 22dp [site:/components/bottom-sheets/specs] |
| Drag handle alignment | Horizontally centered |
| Top margin to the window | 72dp [site:/components/bottom-sheets/specs] |
| Height | Variable |

- Wider windows: once the window is wider than 640dp [site:/components/bottom-sheets/specs], the
  sheet keeps a top margin of 56dp [site:/components/bottom-sheets/specs] and side margins of
  56dp [site:/components/bottom-sheets/specs].
- Touch area: with a drag handle and resizing enabled, the top 48dp [site:/components/bottom-sheets/accessibility]
  of the sheet is reserved for resize interaction. The overview describes this as the handle's
  accessible hit target of 48dp [site:/components/bottom-sheets/overview].
- Implementation references:
  - Compose maximum width: 640dp [impl:compose-material3/commonMain/androidx/compose/material3/SheetDefaults.kt:536].
  - Compose drag handle vertical padding: 22dp [impl:compose-material3/commonMain/androidx/compose/material3/SheetDefaults.kt:789].
  - Compose `BottomSheetScaffold` peek height: 56dp [impl:compose-material3/commonMain/androidx/compose/material3/SheetDefaults.kt:533].
  - Flutter maximum width: 640dp [impl:material_ui/packages/material_ui/lib/src/generated/bottom_sheet_defaults_m3.g.dart:40].

## Typography

- The bottom sheet token set defines no text style [NOT FOUND].
- Content inside a sheet (list items, app bar titles, buttons) uses those components' own type
  styles.

## Color roles and state layers

- Container: surface container low [token:md.comp.sheet.bottom.docked.container.color].
- Drag handle: on surface variant [token:md.comp.sheet.bottom.docked.drag-handle.color].
  material-web also sets it to 40% opacity [token:md.comp.sheet.bottom.docked.drag-handle.opacity];
  the other two platforms have no handle-opacity token.
- Drag handle focus indicator: secondary [token:md.comp.sheet.bottom.focus.indicator.color].
  - Thickness: 3dp [token:md.comp.sheet.bottom.focus.indicator.thickness].
- Scrim (modal): the scrim role at 32% opacity [token:md.comp.scrim.container.opacity]. On Android
  the system UI handles scrim color and opacity.
- The sheet itself has no state layer. Content inside follows its own components' state layers.

## Motion

- Bottom sheet motion tokens (duration, easing or spring): none in the token set [NOT FOUND].
- Compose drives sheet motion from the motion scheme in code:
  - Show and settle after a drag: the default spatial spring (BottomSheet.kt:135 and :137).
    Standard scheme damping 0.9, stiffness 700; expressive scheme damping 0.8, stiffness 380
    [token:md.sys.motion.spring.default.spatial.damping] [token:md.sys.motion.spring.default.spatial.stiffness].
  - Hide: the fast effects spring (BottomSheet.kt:136), damping 1 and stiffness 3800 in both
    schemes [token:md.sys.motion.spring.fast.effects.damping] [token:md.sys.motion.spring.fast.effects.stiffness].
  - Modal scrim fade: the default effects spring (ModalBottomSheet.kt:149).
- Flutter animates the sheet with fixed durations and the legacy decelerate curve
  (bottom_sheet.dart:31):
  - Enter: 250ms [impl:material_ui/packages/material_ui/lib/src/bottom_sheet.dart:29].
  - Exit: 200ms [impl:material_ui/packages/material_ui/lib/src/bottom_sheet.dart:30].

## Accessibility

- People must be able to resize the sheet without touch gestures.
- The drag handle is focusable in the tab order and works with keyboards and switch access. Tab
  lands on it; Space or Enter steps through the available heights. If the sheet has no handle,
  provide a button that does the same.
- Give every drag action a single-pointer alternative.
- Label only the drag handle; its role is button.

## Platform mapping

- Jetpack Compose (material3 1.5.0-rc01), all marked `@ExperimentalMaterial3Api`:
  - `ModalBottomSheet` with `rememberModalBottomSheetState`.
  - `BottomSheetScaffold` with `rememberBottomSheetScaffoldState` and
    `rememberStandardBottomSheetState` for the standard sheet.
  - `BottomSheet` (the sheet surface itself), `SheetState`, `SheetValue`.
  - `BottomSheetDefaults` (`DragHandle`, `SheetMaxWidth`, `SheetPeekHeight`, `ScrimColor`).
- Flutter (`material_ui` 1.11.0): `BottomSheet`, `showModalBottomSheet` (modal) and
  `showBottomSheet` / `ScaffoldState.showBottomSheet` (standard). `showDragHandle` turns the
  handle on.
- Web: no maintained official component (the overview lists web as unavailable). Our CSS sheet is
  built in Phase 3 from the material-web token values above.

## Pitfalls

- Opening a modal sheet taller than half the screen at first.
- A full-screen modal sheet with no close affordance.
- Height changes that only work by dragging.
- Labelling the whole sheet instead of the drag handle.
- Stretching the sheet across a wide window; respect the maximum width or switch to a side sheet.
- Putting the screen's primary content in a sheet.
