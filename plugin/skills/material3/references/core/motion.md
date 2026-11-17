# Motion

Component motion runs on springs from one motion scheme. Screen transitions still use the easing and
duration tokens. Never write a duration, curve or spring constant by hand.

## Motion scheme

- M3 Expressive (default): the expressive scheme. Spatial springs overshoot a little and settle.
- Classic M3 or a calm, utilitarian product: the standard scheme.
- One scheme per product. Code asks for a spring by role; the scheme supplies the values.

| Spring | Animates | Speed |
|---|---|---|
| fast spatial | position, size, rotation, corner radius of small parts (switch handle, button, chip) | fast |
| default spatial | the same for medium areas (sheet, expanding rail, card) | default |
| slow spatial | full-screen movement | slow |
| fast / default / slow effects | color and opacity; never overshoots | same speed rule |

Material components use fast spatial and fast effects. Never use a spatial spring for color or
opacity.

## Where the values come from

| Platform | Asset | Use |
|---|---|---|
| Compose | `theme/Motion.kt`; also `MaterialExpressiveTheme` / `MotionScheme.expressive()` | `MaterialTheme.motionScheme.fastSpatialSpec()` inside Material themes; for custom code `M3Motion.expressive.fastSpatial.spec()`; `M3Motion.durationMedium2Millis`, `M3Motion.easingEmphasizedDecelerate` |
| Flutter | `lib/m3/motion.dart` | `M3Motion.expressive.fastSpatial` (stiffness, damping ratio) into a `SpringSimulation`; `M3Motion.durationMedium2`, `M3Motion.easingEmphasizedDecelerate` |
| Web | `assets/web/tokens.css` | `--md-sys-motion-duration-*`, `--md-sys-motion-easing-*`; spring variables `--md-sys-motion-spring-<speed>-<kind>-damping\|stiffness` for a JS spring |

Flutter's `M3Spring.dampingRatio` is a ratio; convert it to a coefficient for `SpringDescription`
(`SpringDescription.withDampingRatio(mass: 1, stiffness:, ratio:)`).

## Web without a spring library

CSS has no springs. Use these curve-and-duration stand-ins:

| Spring | Expressive | Standard |
|---|---|---|
| Fast spatial | (0.42, 1.67, 0.21, 0.90), 350ms [site:/styles/motion/overview/specs] | (0.27, 1.06, 0.18, 1.00), 350ms [site:/styles/motion/overview/specs] |
| Default spatial | (0.38, 1.21, 0.22, 1.00), 500ms [site:/styles/motion/overview/specs] | (0.27, 1.06, 0.18, 1.00), 500ms [site:/styles/motion/overview/specs] |
| Slow spatial | (0.39, 1.29, 0.35, 0.98), 650ms [site:/styles/motion/overview/specs] | (0.27, 1.06, 0.18, 1.00), 750ms [site:/styles/motion/overview/specs] |
| Fast effects | (0.31, 0.94, 0.34, 1.00), 150ms [site:/styles/motion/overview/specs] | (0.31, 0.94, 0.34, 1.00), 150ms [site:/styles/motion/overview/specs] |
| Default effects | (0.34, 0.80, 0.34, 1.00), 200ms [site:/styles/motion/overview/specs] | (0.34, 0.80, 0.34, 1.00), 200ms [site:/styles/motion/overview/specs] |
| Slow effects | (0.34, 0.88, 0.34, 1.00), 300ms [site:/styles/motion/overview/specs] | (0.34, 0.88, 0.34, 1.00), 300ms [site:/styles/motion/overview/specs] |

Define them once as custom properties in the project's own theme layer, then use the variables.

## Transitions (easing and duration tokens)

| Element | Easing token | Duration token |
|---|---|---|
| starts and ends on screen | emphasized (web: standard; CSS cannot draw the emphasized path) | `duration-long2` |
| enters the screen | `easing-emphasized-decelerate` | `duration-medium4` |
| leaves for good | `easing-emphasized-accelerate` | `duration-short4` |
| small utility change | `easing-standard` | `duration-medium2` |
| small element enters / leaves | `easing-standard-decelerate` / `-accelerate` | `duration-medium1` / `duration-short4` |

- Smaller areas get shorter durations; exits are shorter than entrances.
- `legacy` easings are M2 curves; do not use them.

## Transition patterns

- Container transform (card opens into its detail, FAB into a sheet): hero moments only.
- Forward/back in a hierarchy: platform default page transition.
- Lateral (tabs, peer pages): slide together, no fade.
- Top-level destination switch (bar, rail): quick fade out, then fade in.
- Enter/exit of dialogs, menus, snackbars: fade plus a small grow along one axis; sheets and drawers
  slide from their edge.
- Loading content: skeleton placeholders with a gentle pulse, then a quick fade to real content.

## Accessibility

- Honour reduced motion (`prefers-reduced-motion`, `MediaQuery.disableAnimationsOf(context)`,
  the system animator scale on Android): replace slides, scales and morphs with a short fade or an
  instant change; drop parallax and decorative motion.
- No bouncy springs on frequent full-screen transitions. No jump cuts for common navigation.
- Fade old content fully out before new content fades in.
