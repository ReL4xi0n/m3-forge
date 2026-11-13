---
title: Motion
kind: style
pages: [/styles/motion/overview/how-it-works, /styles/motion/overview/specs, /styles/motion/easing-and-duration/applying-easing-and-duration, /styles/motion/easing-and-duration/tokens-specs, /styles/motion/transitions/transition-patterns, /styles/motion/transitions/applying-transitions]
tokenSets: [sys.motion]
expressive: true
fetched: 2026-11-13
---

## Summary

M3 Expressive (May 2025) moved Material motion to a physics system built on springs. A spring is
described by stiffness and damping (plus the starting velocity), not by a duration and a curve, so
it handles gestures, interruptions and retargeting naturally. Two preset motion schemes,
expressive and standard, decide how every spring in a product feels. The older easing-and-duration
system is still published, is no longer maintained, and still drives screen transitions until those
move to springs.

## Rules

Motion schemes:

- Expressive is Material's recommended scheme for most products and especially for hero moments
  and key interactions. Its spatial springs overshoot and settle with a bounce.
- Standard is calmer, with little bounce; use it for utilitarian products.
- Pick one scheme for the product. Advanced products may swap the scheme for particular elements
  or moments, or define a custom scheme.
- The scheme is not part of a token's name. Code asks for, say, the fast spatial spring
  (`md.sys.motion.spring.fast.spatial`) and the active scheme supplies its values. Switching
  schemes therefore needs no token changes.

Spring tokens: two kinds times three speeds.

- Spatial springs move things: position, size, rotation, corner radius. They may overshoot.
- Effects springs change color or opacity and must not overshoot.
- Default speed is for most motion and for things covering part of the screen (a bottom sheet,
  an expanding navigation rail). Fast is for small components (switches, buttons). Slow is for
  full-screen motion.
- Actual spring values may vary by device class (watch, phone, tablet) while keeping the order
  fast > default > slow.
- Material components get their motion from just two springs, expressive fast spatial and
  expressive fast effects. On Compose, 21 components use the physics system by default.
- Three levels of adoption: keep the default scheme; replace the product-wide scheme with a custom
  one; or swap the scheme for one element or subtree.

Easing and duration (legacy, still used for transitions):

- The emphasized easing set fits most transitions; the standard set is for small, quick, utility
  transitions and is the fallback where the emphasized path cannot be expressed (CSS, iOS).
- Choose the easing by how the element relates to the screen:
  - begins and ends on screen, or leaves only temporarily (it can come back): emphasized;
  - enters: emphasized decelerate (arrives at speed, settles gently);
  - leaves for good: emphasized accelerate (starts at rest, exits at full speed).
- Choose the duration by size and direction: small areas get short durations, large areas long
  ones; exits and collapses are shorter than entrances.

Transitions:

- Six patterns:
  - Container transform: one container morphs into the next view (card to detail page, FAB to
    sheet). The strongest link between elements and the most expressive; save it for hero moments
    and shallow hierarchies.
  - Forward and backward: moving one level deeper or back. Use the platform default (Android
    slides with a fade, iOS slides with parallax).
  - Lateral: peers at the same level (tabs, galleries). Everything slides together with no fade,
    which hints that swiping works.
  - Top level: switching destinations in a navigation bar, rail or drawer. A quick fade out, then
    fade in, with no implied relationship.
  - Enter and exit: a component appears or leaves, within the screen (dialog, menu, snackbar) or
    across its edge (sheets, drawers, app bars). On Android it grows or shrinks along one axis,
    away from the nearest screen edge; scale and z-axis motion are avoided because they suggest an
    elevation change.
  - Skeleton loaders: a placeholder layout with a gentle pulse (moving from top-left toward
    bottom-right), replaced by a quick fade-in of the real content.
- Good transitions keep layouts stable, avoid jump cuts (unless pure speed matters, as in a
  productivity menu), build a consistent spatial model, move grouped elements along one axis,
  fade the old content fully out before fading new content in, and keep a simple style (no bouncy
  springs on frequent full-screen transitions).

## Measurements

Spring tokens (`md.sys.motion.spring.*`; mode = scheme). Damping is a damping ratio; both values
are unitless. material-web defines only the standard mode; the expressive mode values come from the
Compose and Flutter token data.

| Spring | Standard: damping / stiffness | Expressive: damping / stiffness |
|---|---|---|
| Fast spatial | 0.9 / 1400 [token:md.sys.motion.spring.fast.spatial.damping] [token:md.sys.motion.spring.fast.spatial.stiffness] | 0.6 / 800 [token:md.sys.motion.spring.fast.spatial.damping] [token:md.sys.motion.spring.fast.spatial.stiffness] |
| Default spatial | 0.9 / 700 [token:md.sys.motion.spring.default.spatial.damping] [token:md.sys.motion.spring.default.spatial.stiffness] | 0.8 / 380 [token:md.sys.motion.spring.default.spatial.damping] [token:md.sys.motion.spring.default.spatial.stiffness] |
| Slow spatial | 0.9 / 300 [token:md.sys.motion.spring.slow.spatial.damping] [token:md.sys.motion.spring.slow.spatial.stiffness] | 0.8 / 200 [token:md.sys.motion.spring.slow.spatial.damping] [token:md.sys.motion.spring.slow.spatial.stiffness] |
| Fast effects | 1 / 3800 [token:md.sys.motion.spring.fast.effects.damping] [token:md.sys.motion.spring.fast.effects.stiffness] | 1 / 3800 [token:md.sys.motion.spring.fast.effects.damping] [token:md.sys.motion.spring.fast.effects.stiffness] |
| Default effects | 1 / 1600 [token:md.sys.motion.spring.default.effects.damping] [token:md.sys.motion.spring.default.effects.stiffness] | 1 / 1600 [token:md.sys.motion.spring.default.effects.damping] [token:md.sys.motion.spring.default.effects.stiffness] |
| Slow effects | 1 / 800 [token:md.sys.motion.spring.slow.effects.damping] [token:md.sys.motion.spring.slow.effects.stiffness] | 1 / 800 [token:md.sys.motion.spring.slow.effects.damping] [token:md.sys.motion.spring.slow.effects.stiffness] |

- Effects springs are critically damped (ratio 1) in both schemes, so they never overshoot; the two
  schemes differ only in their spatial springs.

Web conversion: where a real spring is not available (no gesture, no interruption), the site gives
a cubic-bezier and a duration that imitate each spring.

| Spring | Expressive curve, duration | Standard curve, duration |
|---|---|---|
| Fast spatial | (0.42, 1.67, 0.21, 0.90), 350ms [site:/styles/motion/overview/specs] | (0.27, 1.06, 0.18, 1.00), 350ms [site:/styles/motion/overview/specs] |
| Default spatial | (0.38, 1.21, 0.22, 1.00), 500ms [site:/styles/motion/overview/specs] | (0.27, 1.06, 0.18, 1.00), 500ms [site:/styles/motion/overview/specs] |
| Slow spatial | (0.39, 1.29, 0.35, 0.98), 650ms [site:/styles/motion/overview/specs] | (0.27, 1.06, 0.18, 1.00), 750ms [site:/styles/motion/overview/specs] |
| Fast effects | (0.31, 0.94, 0.34, 1.00), 150ms [site:/styles/motion/overview/specs] | (0.31, 0.94, 0.34, 1.00), 150ms [site:/styles/motion/overview/specs] |
| Default effects | (0.34, 0.80, 0.34, 1.00), 200ms [site:/styles/motion/overview/specs] | (0.34, 0.80, 0.34, 1.00), 200ms [site:/styles/motion/overview/specs] |
| Slow effects | (0.34, 0.88, 0.34, 1.00), 300ms [site:/styles/motion/overview/specs] | (0.34, 0.88, 0.34, 1.00), 300ms [site:/styles/motion/overview/specs] |

Easing tokens (`md.sys.motion.easing.*`, cubic-bezier control points):

| Token | Curve |
|---|---|
| emphasized | Two-segment path, not a single cubic; see the platform note below [token:md.sys.motion.easing.emphasized] |
| emphasized.decelerate | (0.05, 0.7, 0.1, 1) [token:md.sys.motion.easing.emphasized.decelerate] |
| emphasized.accelerate | (0.3, 0, 0.8, 0.15) [token:md.sys.motion.easing.emphasized.accelerate] |
| standard | (0.2, 0, 0, 1) [token:md.sys.motion.easing.standard] |
| standard.decelerate | (0, 0, 0, 1) [token:md.sys.motion.easing.standard.decelerate] |
| standard.accelerate | (0.3, 0, 1, 1) [token:md.sys.motion.easing.standard.accelerate] |
| legacy, legacy.decelerate, legacy.accelerate | M2 curves (0.4, 0, 0.2, 1), (0, 0, 0.2, 1), (0.4, 0, 1, 1) [token:md.sys.motion.easing.legacy] |
| linear | (0, 0, 1, 1) [token:md.sys.motion.easing.linear] |

Emphasized easing per platform (the linter cannot compare a path with a cubic, so it does not flag
this token; the values below are what each source holds):

- Flutter's token data holds the real two-segment path (control points 0.05, 0, 0.133333, 0.06,
  0.166666, 0.4, then 0.208333, 0.82, 0.25, 1, ending at 1, 1).
- material-web points the token at `md.sys.motion.easing.standard`, because CSS cannot express
  the path.
- Compose's `MotionTokens` uses a single cubic (0.2, 0, 0, 1) for it.

Duration tokens (`md.sys.motion.duration.*`):

| Group | 1 | 2 | 3 | 4 |
|---|---|---|---|---|
| short | 50ms [token:md.sys.motion.duration.short1] | 100ms [token:md.sys.motion.duration.short2] | 150ms [token:md.sys.motion.duration.short3] | 200ms [token:md.sys.motion.duration.short4] |
| medium | 250ms [token:md.sys.motion.duration.medium1] | 300ms [token:md.sys.motion.duration.medium2] | 350ms [token:md.sys.motion.duration.medium3] | 400ms [token:md.sys.motion.duration.medium4] |
| long | 450ms [token:md.sys.motion.duration.long1] | 500ms [token:md.sys.motion.duration.long2] | 550ms [token:md.sys.motion.duration.long3] | 600ms [token:md.sys.motion.duration.long4] |
| extra-long | 700ms [token:md.sys.motion.duration.extra-long1] | 800ms [token:md.sys.motion.duration.extra-long2] | 900ms [token:md.sys.motion.duration.extra-long3] | 1000ms [token:md.sys.motion.duration.extra-long4] |

- Short: small utility transitions (selection controls). Medium: transitions across a medium area
  (a FAB growing into a sheet). Long: large expressive transitions (a card opening full screen).
  Extra long: rare, ambient motion without user input (carousel auto-advance).

Starting pairs for transitions (easing, duration, use):

| Easing | Duration | Use |
|---|---|---|
| Emphasized | 500ms [site:/styles/motion/easing-and-duration/applying-easing-and-duration] [token:md.sys.motion.duration.long2] | Starts and ends on screen |
| Emphasized decelerate | 400ms [site:/styles/motion/easing-and-duration/applying-easing-and-duration] [token:md.sys.motion.duration.medium4] | Enters the screen |
| Emphasized accelerate | 200ms [site:/styles/motion/easing-and-duration/applying-easing-and-duration] [token:md.sys.motion.duration.short4] | Leaves the screen |
| Standard | 300ms [site:/styles/motion/easing-and-duration/applying-easing-and-duration] [token:md.sys.motion.duration.medium2] | Starts and ends on screen |
| Standard decelerate | 250ms [site:/styles/motion/easing-and-duration/applying-easing-and-duration] [token:md.sys.motion.duration.medium1] | Enters the screen |
| Standard accelerate | 200ms [site:/styles/motion/easing-and-duration/applying-easing-and-duration] [token:md.sys.motion.duration.short4] | Leaves the screen |

## Accessibility

- Respect the platform's reduced-motion setting. When it is on, replace big slides and scales
  with subtle fades, and turn off decorative effects such as parallax and shape morphing.
- Avoid durations so short they feel jarring, and so long that people wait on the animation.
- Avoid jump cuts for common navigation; they remove the cues people use to stay oriented.
- Fade content out completely before fading new content in; overlapping translucent layers are
  hard to read.

## Platform mapping

- Jetpack Compose (material3 1.5.0-rc01):
  - `MotionScheme` with `MotionScheme.standard()` and `MotionScheme.expressive()`, and six spec
    functions: `defaultSpatialSpec`, `fastSpatialSpec`, `slowSpatialSpec`, `defaultEffectsSpec`,
    `fastEffectsSpec`, `slowEffectsSpec`.
  - `MaterialTheme(motionScheme = ...)` sets it and `MaterialTheme.motionScheme` reads it. The plain
    theme defaults to the standard scheme (MaterialTheme.kt:181); `MaterialExpressiveTheme`
    defaults to the expressive one (MaterialTheme.kt:262).
  - A custom scheme implements `MotionScheme`. To swap the scheme for one element, wrap that
    subtree in `MaterialTheme` with another `motionScheme`.
- Flutter (`material_ui` 1.11.0):
  - `Springs` holds twelve `SpringDescription` constants, `standardDefaultSpatial` through
    `expressiveSlowEffects` (generated/motion_defaults_m3e.g.dart:45).
  - `Durations` (`short1` … `extralong4`) and `Easing` (`standard`, `standardAccelerate`,
    `standardDecelerate`, `emphasizedAccelerate`, `emphasizedDecelerate`, `linear`, `legacy*`)
    hold the legacy tokens. `Easing` has no `emphasized` member.
  - Components do not run on springs; the site lists Flutter as unavailable for the physics
    system. For example, the Android page transition is approximated with a fixed duration:
    450ms [impl:material_ui/packages/material_ui/lib/src/page_transitions_theme.dart:623].
- Web: no maintained official component. Use a spring implementation when one is available,
  otherwise the curve-and-duration conversion table above. material-web carries only the standard
  spring values.

## Pitfalls

- Treating the damping token as a raw damping coefficient. It is a ratio; Flutter's `Springs`
  constants already convert it (coefficient = ratio × 2 × √stiffness, with mass 1).
- Hard-coding a scheme into token names, or mixing schemes across a product without intent.
- Using spatial (overshooting) springs for color or opacity, which should never overshoot.
- Bouncy springs on frequent, full-screen transitions.
- Applying container transform everywhere, or lateral slides for hierarchical navigation, or
  lateral slides between top-level destinations (they clash with swipeable carousels and list
  items).
- Long cross-fades and fading sheets as they slide.
- Ignoring reduced-motion settings.
