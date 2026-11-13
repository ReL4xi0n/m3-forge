---
title: Sliders
kind: component
pages: [/components/sliders/overview, /components/sliders/specs, /components/sliders/guidelines, /components/sliders/accessibility]
tokenSets: [slider, slider.xsmall, slider.small, slider.medium, slider.large, slider.xlarge]
expressive: true
fetched: 2026-11-13
---

## Summary

A slider picks a value, or a range of values, by moving a handle along a track. It suits settings
whose effect people want to see while they adjust them: volume, brightness, filter strength. M3
has three variants: standard, centered and range. M3 Expressive added five sizes, a vertical
orientation and an optional icon inside the track.

## Use it when

- The value lies on a continuous or stepped scale, and seeing the full range helps.
- The change can apply live while the handle moves, so people judge by the result.
- Pick the variant by where the value starts:
  - Standard: the scale starts at zero or at the beginning of a sequence.
  - Centered: zero or the default sits in the middle, with negative and positive values on
    either side.
  - Range: two handles set a minimum and a maximum.
- **Our practice:** when the value must be exact and the range is wide, offer a text field instead,
  or pair one with the slider.
- Avoid when:
  - A range slider would be vertical. Two handles on a vertical track add too much cognitive load;
    keep range sliders horizontal.

## Anatomy

1. Value indicator (optional): a bubble showing the current value while the handle is in use.
2. Stop indicators (optional): dots marking the selectable values.
3. Active track: from the minimum to the handle (or between the two handles of a range slider).
4. Handle: a narrow vertical bar.
5. Inactive track: the rest of the range.
6. Inset icon (optional): an icon inside the track of medium and larger standard sliders.

Values grow from left to right in left-to-right languages and from right to left in right-to-left
ones.

## Variants

- Variant: standard (the old "continuous" slider), centered, range.
- Stops: off (default) or on. The old "discrete" slider is now the stops configuration.
- Orientation: horizontal (default) or vertical.
- Size: XS (default), S, M, L, XL. Larger sizes enlarge the target and add emphasis. Keep XL for
  hero moments where the slider is the main element of the page.
- Inset icon: only on standard sliders of size M, L or XL.
  - Never on XS or S, on centered or range sliders, or on any track thinner than
    40dp [site:/components/sliders/guidelines] [token:md.comp.slider.medium.active.track.height].
  - The icon should show what the slider controls. It may change at zero (volume becomes mute).
  - When the active track is too short to hold it, the icon moves to the inactive track.
- Value indicator: off (default) or on. Not needed when the value is shown elsewhere.
- Since the December 2023 refresh (before M3 Expressive):
  - The handle became a narrow vertical bar that gets thinner while pressed.
  - Stop indicators were added at the track ends for contrast.
  - The value label grew larger.
  - Centered sliders start from the middle.
  - The track ends change shape as the handle reaches an edge.

## Expressive

- May 2025 (M3 Expressive):
  - Vertical orientation.
  - The S, M, L and XL sizes (XS is the previous default).
  - The inset icon.
  - Vertical orientation and the inset icon are listed simply as available. Only the S–XL sizes
    carry a platform note: they are presets in code on MDC-Android, and elsewhere exist only as
    tokens with no preset. To resize there, replace the default `md.comp.slider.xsmall.*` tokens
    with another size's set.

## States and behavior

- States: enabled, hovered, focused, pressed (dragged), disabled.
- Handle feedback: on touch, press or drag, the handle narrows and the value indicator appears.
  With a pointer, hovering changes the cursor; clicking and dragging narrows the handle and shows
  the value.
- Selecting:
  - Drag: without stops the handle glides; with stops it snaps to the nearest stop.
  - Click or tap on the track: the handle jumps there, or to the nearest stop.
  - Keyboard: see Accessibility.
- Range sliders show the value of only one handle at a time.
- Stop indicators:
  - Mark the values that can be chosen. Too many make the track crowded and hard to set.
  - Every slider has a stop at the end of the inactive track so the end is visible (3:1
    contrast). If the inactive track already has that contrast, the end stops may be removed.
- Icons or text outside the slider (minus and plus, low and high) can mark the range instead of
  stops.
- A separate text field may show and edit the value. Keep the slider and the field in sync, and
  place the field next in tab order.
- Active and inactive tracks are always the same thickness.

## Measurements

The values are material-web's (canonical). Every token that differs on another platform is listed
under "Platform differences" with a `[differs:]` marker.

| | XS | S | M | L | XL |
|---|---|---|---|---|---|
| Track thickness | 16dp [site:/components/sliders/specs] [token:md.comp.slider.xsmall.active.track.height] | 24dp [site:/components/sliders/specs] [token:md.comp.slider.small.active.track.height] | 40dp [site:/components/sliders/specs] [token:md.comp.slider.medium.active.track.height] | 56dp [site:/components/sliders/specs] [token:md.comp.slider.large.active.track.height] | 96dp [site:/components/sliders/specs] [token:md.comp.slider.xlarge.active.track.height] |
| Handle height | 44dp [site:/components/sliders/specs] [token:md.comp.slider.xsmall.active.handle.height] | 44dp [site:/components/sliders/specs] [token:md.comp.slider.small.active.handle.height] | 44dp [token:md.comp.slider.medium.active.handle.height] | 68dp [site:/components/sliders/specs] [token:md.comp.slider.large.active.handle.height] | 108dp [site:/components/sliders/specs] [token:md.comp.slider.xlarge.active.handle.height] |
| Outer track corner | 8dp [site:/components/sliders/specs] [token:md.comp.slider.xsmall.active.track.shape.leading] | 8dp [site:/components/sliders/specs] [token:md.comp.slider.small.active.track.shape.leading] | 12dp [site:/components/sliders/specs] [token:md.comp.slider.medium.active.track.shape.leading] | 16dp [site:/components/sliders/specs] [token:md.comp.slider.large.active.track.shape.leading] | 28dp [site:/components/sliders/specs] [token:md.comp.slider.xlarge.active.track.shape.leading] |
| Inset icon | none | none | 24dp [site:/components/sliders/specs] [token:md.comp.slider.medium.icon.size] | 24dp [site:/components/sliders/specs] [token:md.comp.slider.large.icon.size] | 32dp [site:/components/sliders/specs] [token:md.comp.slider.xlarge.icon.size] |
| Inset icon padding | none | none | 6dp [token:md.comp.slider.medium.icon.padding] | 6dp [token:md.comp.slider.large.icon.padding] | 8dp [token:md.comp.slider.xlarge.icon.padding] |

- Medium handle height: the site's table prints 52dp [site:/components/sliders/specs] [token:md.comp.slider.medium.active.handle.height],
  but the token is 44dp [token:md.comp.slider.medium.active.handle.height]. The repository wins
  (see `knowledge/conflicts.md`).
- Handle width: 4dp [site:/components/sliders/specs] [token:md.comp.slider.handle.width] at rest
  and on hover; 2dp [token:md.comp.slider.pressed.handle.width] when pressed or
  focused [token:md.comp.slider.focus.handle.width].
- Gap between the handle and each track: 6dp [token:md.comp.slider.active.handle.leading-space].
- Stop indicator: 4dp [token:md.comp.slider.stop-indicator.size] dot, fully round.
- Stop at the track end: inset 4dp [token:md.comp.slider.stop-indicator.trailing-space] from the
  end (material-web; see Platform differences).
- Value indicator: 48dp [site:/components/sliders/specs] wide and 44dp [site:/components/sliders/specs]
  tall, sitting 12dp [token:md.comp.slider.value-indicator.active.bottom-space] above the handle.
- The inner track corners next to the handle are small and fixed; the outer corners follow the
  size table. Compose reads only the default (XS) slider tokens; the size sets are absent from its
  data [NOT FOUND].

Platform differences (see `knowledge/conflicts.md`):

- End-stop inset [differs:md.comp.slider.stop-indicator.trailing-space]:
  - material-web and Flutter: 4dp [token:md.comp.slider.stop-indicator.trailing-space].
  - Compose: 6dp [token:md.comp.slider.stop-indicator.trailing-space].
- Stop color on the inactive track [differs:md.comp.slider.stop-indicator.color]: on secondary
  container on material-web and Flutter, secondary container on Compose.
- Stop color on the active track [differs:md.comp.slider.stop-indicator.color-selected]: on primary
  on material-web and Flutter, secondary container on Compose.

## Typography

- Value indicator label: label large [token:md.comp.slider.value-indicator.label.label-text.font],
  14sp [token:md.sys.typescale.label-large.size].
- material-web's value-indicator weight and tracking tokens point at body large instead
  [token:md.comp.slider.value-indicator.label.label-text.weight]. Treat this as a token-data quirk
  and use label large throughout.
- Compose sets the value-indicator font to label large [token:md.comp.slider.value-indicator-label-text-font].

## Color roles and state layers

| Element | Enabled | Disabled |
|---|---|---|
| Active track | primary [token:md.comp.slider.active.track.color] | on surface at 38% [token:md.comp.slider.disabled.active.track.opacity] |
| Inactive track | secondary container [token:md.comp.slider.inactive.track.color] | on surface at 12% [token:md.comp.slider.disabled.inactive.track.opacity] |
| Handle | primary [token:md.comp.slider.handle.color] | on surface at 38% [token:md.comp.slider.disabled.handle.opacity] |
| Stop on the active track | on primary [token:md.comp.slider.active.stop-indicator.container.color] | inverse on surface [token:md.comp.slider.disabled.active.stop-indicator.container.color] |
| Stop on the inactive track | on secondary container [token:md.comp.slider.inactive.stop-indicator.container.color] | on surface [token:md.comp.slider.disabled.inactive.stop-indicator.container.color] |
| Value indicator | inverse surface [token:md.comp.slider.value-indicator.container.color] with inverse on surface text [token:md.comp.slider.value-indicator.label.label-text.color] | not shown |

- Hovered, focused and pressed tracks keep their enabled colors
  [token:md.comp.slider.pressed.active.track.color] [token:md.comp.slider.focus.inactive.track.color].
  State is shown mainly by the handle width. The slider's state-layer tokens are deprecated in
  material-web and absent from Flutter and Compose, so the current tokens define no state layer
  [token:md.comp.slider.hover.state-layer.color].
- The site lists the slider's roles as inverse surface, inverse on surface, primary, on primary,
  secondary container and on secondary container.

## Motion

- No slider duration, easing or spring token exists in the three sources [NOT FOUND]. Code chooses
  the motion:
- Compose halves the handle width while it is pressed, focused or dragged
  [impl:compose-material3/commonMain/androidx/compose/material3/Slider.kt:2756]. The change snaps;
  no animation spec is applied.
- Flutter:
  - The value indicator animates in over 100ms [impl:material_ui/packages/material_ui/lib/src/slider.dart:664].
  - Enabling and disabling animate over 75ms [impl:material_ui/packages/material_ui/lib/src/slider.dart:663].
  - A jump to a tapped position takes 75ms [impl:material_ui/packages/material_ui/lib/src/slider.dart:1250].
- The track-end shape change when the handle reaches an edge has no token [NOT FOUND].

## Accessibility

- People using assistive technology must be able to reach the slider, move the handle to set a
  value or range, and get feedback suited to their input.
- Focus lands directly on the handle, the main interactive element.
- Keyboard:
  - Tab moves to the handle.
  - Arrow keys change the value by one step or one stop.
  - Space with an arrow changes it by a larger interval or one stop.
  - Home and End jump to the minimum and maximum.
- Contrast: the end of the inactive track needs 3:1 against the background. The end stop provides
  it; icons or other marks with 3:1 contrast at the ends also work.
- Accessible name: normally the adjacent label, with the slider role. When linked, screen readers
  read the label and then the role. Icon buttons placed beside the slider have the button role.

## Platform mapping

- Jetpack Compose (material3 1.5.0-rc01):
  - `Slider`, `RangeSlider` and `VerticalSlider` (there is no vertical range slider).
  - `SliderDefaults.Thumb` and `SliderDefaults.Track` build custom handles and tracks.
  - Centered tracks are shown in the official samples (`CenteredSliderSample`).
  - There are no size presets; build larger sizes from the size tokens.
- Flutter (`material_ui` 1.11.0):
  - `Slider`, `RangeSlider` and `Slider.adaptive`.
  - Set `year2023: false` to get the current M3 look with the bar handle and stop indicators.
  - There is no vertical slider, no size API and no inset icon. We supply them in Phase 3 as
    reference widgets.
- Web: no maintained official component. Our CSS slider is built in Phase 3 from the material-web
  token values above.

## Pitfalls

- **Our practice:** do not rely on a slider alone where an exact value matters; offer text entry
  too.
- Vertical range sliders.
- Inset icons on XS or S sliders, on centered or range sliders.
- Too many stop indicators.
- Removing the end stops on a low-contrast background.
- Changes that apply only after release or after Save; sliders should act live.
- Using XL sliders anywhere but a hero moment.
