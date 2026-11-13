---
title: Design for XR
kind: foundation
pages: [/foundations/xr/design/overview, /foundations/xr/design/interaction, /foundations/xr/design/layout, /foundations/xr/design/accessibility, /foundations/xr/components/overview, /foundations/xr/components/app-bars, /foundations/xr/components/dialogs, /foundations/xr/components/nav-bar, /foundations/xr/components/nav-rail, /foundations/xr/components/toolbars]
tokenSets: []
expressive: false
fetched: 2026-11-13
---

## Summary

Extended reality (XR) guidance covers Android XR headsets, where an app's UI floats in a room or a
virtual environment instead of sitting on a flat screen. Material keeps its familiar components
but lets them use depth: content lives on spatial panels, navigation moves into floating
orbiters, and elevation becomes real distance on the Z-axis. The site notes that this guidance is
aimed mainly at designers; the design kit shows what is implemented in code.

Key terms:

- Home space: the shared mode where an XR app runs next to other apps with the real world behind.
  It shows phone and tablet apps but no spatial components.
- Full space: the immersive mode where one app takes over and spatial components (panels,
  orbiters, spatial elevation) are available.
- Passthrough: the headset shows the physical room behind the apps.
- Spatial panel: the basic container for UI and media. Full space only.
- Orbiter: a floating element attached to a panel, used for navigation and controls. Full space
  only.
- Spatial elevation: lifting a component toward the viewer on the Z-axis.
- Spatial environment: a 360° virtual world around the person.

Five components have XR variants: app bars, dialogs, navigation bar, navigation rail, and
toolbars.

## Rules

Principles:

- Reuse familiar Material patterns (buttons, menus) so spatial apps feel known; a menu, for
  example, gains elevation and reads as 3D.
- Comfort first: keep content near the center of view and support sitting, standing and
  reclining.
- Use depth (elevation, 3D models that can be inspected from any side) to give volume and help
  people understand space.
- Give feedback through several channels: visuals, spatial audio and haptics.

Layout:

- XR layouts must account for Z-axis depth, viewing distance and field of view, not screen edges.
- Panels scale with distance; Material 3 components reflow so text stays readable at any distance
  or angle. People can resize panels, and the system rescales them when moved.
- Multiple panels can be arranged flat in a row (side-by-side comparison), curved around the
  person (immersive media, wide dashboards), or freely (multitasking).
- Orbiters carry navigation so it stays reachable without covering content. Material XR
  components turn into orbiters automatically.
- Depth replaces shadows: bring active items forward, push background items back. A dialog's scrim
  can sit physically behind the dialog.
- Anchoring in passthrough: panels can be world-locked (pinned to a spot such as a table). Avoid
  head-locked UI; use a lazy follow that drifts after the person's movement.
- Standard surface roles handle contrast automatically: in a bright room the system dims the
  background; in a virtual environment panels adapt to its lighting.

Interaction:

- Gestures should be easy to learn, echo mobile patterns (press, pinch, swipe) and be comfortable
  to repeat. Essential actions must work one-handed; avoid big repeated arm movements.
- A system navigation menu (back, launcher, recents) must always be one simple gesture away.
- Support many inputs: direct touch and ray-based pointing with hand tracking, gaze with dwell
  (looking at an item gives it hover), voice for text and commands, mouse and keyboard, and 6DoF
  controllers.
- Motion comfort: use standard easing with long duration tokens, keep the horizon stable, limit
  continuous movement (teleport or jump instead), and narrow the view with vignetting while
  moving.
- Feedback: hover icons, focus indicators, ripples, labels and elevation changes for state;
  spatial audio for confirmation (a click on press); optional controller vibration.

Components:

- App bar orbiter: one variant, close to the small app bar, centered or left-aligned. Global
  context (centered at the top of the app, recommended, normally only one) or local context (top of
  one panel; only for actions that affect that panel). Keep it within the width of nearby panels
  and the person's field of view; it may align center, left or right.
- Navigation bar orbiter: centered at the bottom of the app (global) or of a panel (local; use with
  care). Never at the top of a panel, which is reserved for app bars. Do not exceed the panel's
  width.
- Navigation rail orbiter: global context only, centered on the left or right edge of the app;
  never between panels. Two variants: contained FAB (subtle, close to the baseline rail) and
  spatialized FAB (the FAB becomes its own orbiter, above or below the rail, for more emphasis).
  For layouts with more than two panels consider a navigation bar orbiter instead.
- Toolbar orbiter: one variant, close to the floating toolbar, horizontal or vertical. Local context
  (bottom of the panel it controls) is recommended. With more than five items it can expand and
  collapse but must stay within the panel's bounds; complex sets can split into several toolbars.
  Do not place a vertical one between panels.
- Dialogs: use basic dialogs only (full-screen ones can push actions out of view). In full space a
  dialog can be spatially elevated: it scales uniformly and fades in, rises to the highest resting
  level, and returns when done; the scrim only fades and stays at content level. Center it in the
  field of view, with lazy follow if it can track head movement.
- Offset positioning signals global actions; inset positioning signals panel-specific ones.

Color and elevation:

- Color shows elevation. Elevated app bars use surface container, surface container high or
  surface container highest.
- Navigation bars and toolbars may also use tertiary container.
- Navigation rails pair a container with a FAB color: surface container with a tertiary FAB;
  surface container high or highest with a tertiary fixed dim FAB; tertiary container with a
  primary FAB.
- Dialogs use surface container high or highest and must be the highest-colored element: if the
  dialog is surface container high, nothing else may use surface container highest.
- The site notes that Compose does not yet provide spatial dialog color and elevation; set them by
  hand.

## Measurements

| Item | Value |
|---|---|
| Default panel size at launch | 1024 × 720dp [site:/foundations/xr/design/layout] |
| Default launch distance | 1.75 m [site:/foundations/xr/design/layout] |
| Default panel corner radius | 32dp [site:/foundations/xr/design/layout] |
| Maximum panel size (no minimum) | 2560 × 1800dp [site:/foundations/xr/design/layout] |
| Panel vertical center | 5° below eye level [site:/foundations/xr/design/layout] |
| Primary content zone | central 41° of the field of view [site:/foundations/xr/design/layout] |
| Movement depth limits | 0.75 m to 5 m [site:/foundations/xr/design/layout] |
| Orbiter offset from panel (app bar, nav bar, nav rail, toolbar) | 20dp [site:/foundations/xr/components/app-bars] |
| Orbiter inset over panel, maximum | 12dp [site:/foundations/xr/components/toolbars] |
| Spatialized FAB to rail gap | 20dp [site:/foundations/xr/components/nav-rail] |
| Minimum target size | 56 × 56dp [site:/foundations/xr/design/accessibility] |
| Minimum visible affordance | 48 × 48dp [site:/foundations/xr/design/accessibility] |
| Target offset | 4dp [site:/foundations/xr/design/accessibility] |
| Minimum body text size | 14dp [site:/foundations/xr/design/accessibility] |

- Navigation bar and rail orbiters may overlap a panel by 12dp [site:/foundations/xr/components/nav-bar],
  and never by more than half their own height (bar) or width (rail).
- Per-component orbiter padding and sizes appear only in diagrams without printed values
  [NOT FOUND]. The toolbar orbiter's padding is 12dp [site:/foundations/xr/components/toolbars].
- No XR-specific tokens exist in our token sources [NOT FOUND]; the motion guidance names
  "standard easing with long durations" without fixing a value.

## Accessibility

- Support system features: TalkBack, voice input, live captions, dwell control, magnification,
  and color inversion and correction.
- Text must stay legible against bright windows and dark rooms: high contrast, at least
  14dp [site:/foundations/xr/design/accessibility] body text, light and dark themes, and standard
  background roles (such as surface container) so the system can dim behind them.
- Every action must be possible with one hand, voice, or eyes; never require two-handed gestures.
- Let people recenter the UI and pull it closer; design for seated, standing and reclined use.
- Targets: at least 56 × 56dp [site:/foundations/xr/design/accessibility], visible affordance at least
  48 × 48dp [site:/foundations/xr/design/accessibility], 4dp [site:/foundations/xr/design/accessibility]
  offset; do not let targets of different elements overlap; scale targets and icons with their
  container or label.
- XR component accessibility guidance is still evolving; each XR component follows its regular
  Material component's accessibility rules.

## Platform mapping

- Android XR with Jetpack Compose: the site points to the Jetpack XR SDK and a "Material Design for
  XR" API. Neither is part of our pinned sources (Compose material3 1.5.0-rc01 contains no orbiter,
  spatial panel or spatial dialog API), so we name no XR composables. Regular Compose Material 3
  components render in home space as on a tablet.
- Flutter (`material_ui` 1.11.0): no XR or spatial components.
- Web: no XR components.
- Design: the M3 design kit (Figma) includes the XR components.

## Pitfalls

- Using orbiters or spatial elevation in home space; they exist only in full space. In home space
  keep the app bar, navigation and toolbar on the same plane as the content.
- More than one app bar orbiter, or a local app bar orbiter with app-wide actions.
- Navigation rail orbiters placed between panels or in local context; navigation bar orbiters at
  the top of a panel.
- Orbiters wider (or taller) than the panels next to them, or reaching outside the field of view.
- Inset orbiters that cover more than 12dp [site:/foundations/xr/components/app-bars] of a panel.
- Full-screen dialogs, or a dialog that is not the highest-colored element.
- Head-locked UI, long continuous motion, or a moving horizon, all of which can cause motion
  sickness.
- Custom background colors that the system cannot dim in passthrough.
