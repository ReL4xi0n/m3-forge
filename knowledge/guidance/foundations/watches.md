---
title: Design for watches
kind: foundation
pages: [/foundations/watches/overview, /foundations/watches/foundations, /foundations/watches/styles, /foundations/watches/layout]
tokenSets: []
expressive: true
fetched: 2026-11-13
---

## Summary

Watch guidance adapts M3 Expressive to small round screens. Everything on these pages is shown
through Material for Wear OS, which is a separate library and design kit from phone Material 3.
The ideas carried over from the phone system are the Expressive ones: edge-hugging shapes for
round displays, spring-based motion, controls that morph when pressed or selected, a dark-first
color system, and two type roles made only for watches (numerals and arc text).

A watch is used in brief glances, often while the wearer is moving, and usually leans on a paired
phone. Design for one or two tasks per screen rather than shrinking a phone app.

## Rules

Surfaces of the watch experience:

- Watch face: shows the time plus complications (small customizable details such as heart rate or
  progress). Ongoing activities (timers, workouts, media) stay reachable from it.
- Apps: either non-scrolling (one focused screen: player, picker, timer, short confirmation) or
  scrolling (lists, threads, menus, longer dialogs).
- Tiles: glanceable, fixed-height, non-scrolling views reached by swiping from the watch face. Use
  them for progress, weather, or one frequent action.
- Notifications: can expand into actions such as reply or open on a map. Wear OS ships templates
  for messaging and calendar notifications.

Hardware input:

- Rotating side buttons scroll lists or change values such as volume.
- System buttons belong to the OS (power and similar) and cannot be reassigned.
- Multifunction buttons can be given app actions, for example start/stop on a stopwatch.

Design principles:

- Glanceable first: show the most important thing at the top; never port dense views such as a
  month calendar grid.
- Cut choices: fewer actions means faster decisions; keep hierarchy shallow and put navigation
  inline with content.
- Context aware: update content for time, place and activity.
- Offline tolerant: plan for no network (exercise, commuting) and say so with an offline icon or a
  dialog.
- Cross-device: decide which part of a task belongs on the watch and which on the phone.
- Always-on display: ambient mode keeps ongoing content (a timer, a workout) visible; light as few
  pixels as possible while in it.
- Battery: keep interactions short.

Standard screen furniture (scrolling and non-scrolling): the time at the top on most screens, a
page title, a scroll indicator when more content exists, and an edge-hugging action button that
follows the round edge.

Styles:

- Shape: containers and buttons hug the curved screen edge; selected controls change corner radius
  (shape morphing).
- Motion: physics-based springs drive transitions and feedback for state and hierarchy changes.
- Color: watches start from a black background, not the tinted surfaces of phones, to save power.
  Wear OS has its own color roles tuned for dark low-light use and for daylight.
  - Pair each fill with its matching "on" role (on primary on primary, on primary container on
    primary container) so text stays readable as contrast settings change.
  - Wear-specific roles such as primary dim and tertiary dim are for highlights and feedback,
    not for text placed on primary fills. These roles are not part of our token set.
  - Suggested pairings: primary dim for an important element with tertiary for standout feedback;
    tertiary plus primary for main actions with secondary container for supporting ones; secondary
    and primary container for two equally weighted options.
- Typography: the baseline scale is tuned for round screens, plus two watch-only roles:
  - Numerals: large stylized digits (a few at a time); because digits need no localization they
    can take more expressive treatment at display sizes.
  - Arc text: spacing tuned for text that follows the curve at the top or bottom of the screen
    (titles, confirmation overlays, calls to action).
- Haptics: use system patterns and tokens when they exist and keep them in sync with motion and
  sound. Strong pulses for key moments (a payment going through), light ones for precise
  interactions (scrolling a list).

## Measurements

- Design for the smallest common watch first: 192dp [site:/foundations/watches/layout].
- Screens larger than 225dp [site:/foundations/watches/layout] should use the extra room to show
  more (extra buttons, more text lines, richer data).
- Margins and padding are given as percentages of the screen rather than fixed values, so content
  stays centered and unclipped as the display grows. The pages print no percentage values
  [NOT FOUND].
- Wear OS type sizes, color role values, and spring values are documented in the Wear OS material
  library, not on these pages and not in our token sources [NOT FOUND].

## Accessibility

- Text must survive font scaling and bold-text settings; test every font size, because larger text
  changes the size of controls.
- Pair fills with their "on" roles so legibility holds when the user changes contrast.
- Test while moving: the UI must work at a glance during a walk or a run.
- Use haptics as a second channel for important confirmations, not as the only feedback.

## Platform mapping

- Jetpack Compose: the site points to the Wear OS Compose Material 3 library, which provides the
  adaptive, round-screen components. It is not part of our pinned sources (we pin phone Compose
  material3 1.5.0-rc01, which has no watch components), so we name no watch APIs here.
- Flutter (`material_ui` 1.11.0): no watch-specific components, arc text or numeral roles.
- Web: not a watch platform; no material-web support.
- Our skill should treat watch work as Wear OS Compose work and point to its own documentation.

## Pitfalls

- Shrinking a phone screen onto a watch instead of choosing the one or two tasks that matter.
- Fixed pixel margins that clip content on round screens; use percentages.
- Tinted phone-style backgrounds instead of black.
- Using a dim role for text on primary fills, which fails when contrast shifts.
- Bright, mostly lit layouts in always-on mode.
- Assuming a network connection or a nearby phone.
