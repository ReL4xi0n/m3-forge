---
title: Progress indicators
kind: component
pages: [/components/progress-indicators/overview, /components/progress-indicators/specs, /components/progress-indicators/guidelines, /components/progress-indicators/accessibility]
tokenSets: [progress-indicator, progress-indicator.linear, progress-indicator.circular, progress-indicator.linear.thick, progress-indicator.circular.thick, linear-progress-indicator, circular-progress-indicator]
expressive: true
fetched: 2026-11-13
---

## Summary

Progress indicators tell people that a process is running and, when the amount of work is known,
how far it has got. There are two variants, linear and circular, and each can be determinate or
indeterminate. Since the Expressive update the active indicator can be drawn flat or as a wave, and
the track thickness is configurable.

## Use it when

- A process takes long enough that people need reassurance: loading, submitting, saving, syncing.
- Match the indicator to the expected wait:
  - Under 200ms [site:/components/progress-indicators/guidelines]: show nothing, just show the
    content.
  - From 200ms [site:/components/progress-indicators/guidelines] up to about five seconds: prefer
    a loading indicator (see loading-indicator.md#summary).
  - Longer than about five seconds: use a progress indicator. For very long waits, let people leave
    the screen while the work continues.
- Pick the variant by placement: linear along the edge of the thing that is loading, circular
  centered on it.
- Keep one variant per kind of process across the whole product (if refreshing is circular in one
  place, it is circular everywhere).
- Avoid when:
  - Several items load together. Show one indicator for the group, not one per item, unless the
    items really load independently.
  - Every button in a list would get its own spinner.

## Anatomy

1. Active indicator: the part that shows progress. In determinate mode it grows from the start;
   in indeterminate mode it repeatedly grows and shrinks along the track.
2. Track: the remaining, not-yet-filled path.
3. Stop indicator (linear determinate only): a small dot at the end of the track that marks where
   the process finishes.

Linear indicators fill from the leading edge to the trailing edge. Circular indicators start at
the top and run clockwise by default.

## Variants

| Category | Options |
|---|---|
| Variant | Linear, circular |
| Behavior | Determinate (default), indeterminate |
| Shape of the active indicator | Flat (default), wavy (Expressive) |
| Track thickness | Default, or configurable (Expressive). The specs show a thick sample alongside the default. |

- Determinate: the fill must reflect real progress.
- Indeterminate: only says that work is happening. When the remaining amount becomes known, switch
  from indeterminate to determinate.

## Expressive

- Added in the Expressive update (dated Aug 2024 on the overview page): configurable track
  thickness and the wavy active indicator.
- Wavy shape:
  - A sine-like wave drawn on the active indicator; the track stays flat.
  - Amplitude is measured from the resting centre line to the centre of a peak; wavelength is the
    distance between neighbouring peaks.
  - It makes the overall component taller (linear) or larger (circular), so reserve the space.
  - It suits longer processes and products with a more playful tone. At very small sizes the wave
    is hard to see; use the flat shape inside small buttons.
  - When a circular indicator is resized, scale the wave with it so the proportions hold.
- Compose fades the wave in and out with progress. Its default amplitude function keeps the wave
  flat below 10% and from 95% of progress onwards [impl:compose-material3/commonMain/androidx/compose/material3/WavyProgressIndicator.kt:490].
- An earlier change (Dec 2023) added the stop indicator, raised track contrast, rounded the ends
  and introduced new motion.

## States and behavior

- At the very start of determinate progress the active indicator appears as a dot, so people see
  that something has begun even when the fill is tiny.
- Linear placement:
  - Along the edge of the container that is loading; if the container changes shape, on the edge
    that moves. It may also sit in the middle of a container.
  - One indicator at the top of the page when the whole page loads; on a card when only the card
    loads.
  - It stretches to the width of its parent and should not be used in elements narrower than
    40dp [site:/components/progress-indicators/guidelines].
  - Leave at least 4dp [site:/components/progress-indicators/guidelines] at each end; this can be
    adjusted.
- Circular placement:
  - Centered on the page or element that is loading.
  - When more items are coming, put it in the empty space where they will appear, not over existing
    content.
  - Inside a button: recolor the active indicator to the button's label or icon color and drop the
    track, so it keeps 3:1 contrast.
- Stop indicator: required when the track has under 3:1 contrast with its container or the surface
  behind it. Remove it only if the track itself clears 3:1 against everything around it. It is not
  used on indeterminate or circular indicators.
- Right-to-left: mirror linear indicators; circular indicators are not mirrored.

## Measurements

Values are material-web's (canonical). The current tokens are the shared `md.comp.progress-indicator`
set; the separate linear and circular sets are deprecated.

Linear:

| Part | Default | Thick sample |
|---|---|---|
| Track thickness | 4dp [token:md.comp.progress-indicator.linear.track.thickness] | 8dp [token:md.comp.progress-indicator.linear.thick.track.thickness] |
| Active indicator thickness | 4dp [token:md.comp.progress-indicator.linear.active-indicator.thickness] | 8dp [token:md.comp.progress-indicator.linear.thick.active-indicator.thickness] |
| Height, flat | 4dp [token:md.comp.progress-indicator.linear.height] | 8dp [token:md.comp.progress-indicator.linear.thick.height] |
| Height, wavy | 10dp [token:md.comp.progress-indicator.linear.with-wave.height] | 14dp [token:md.comp.progress-indicator.linear.thick.with-wave.height] |
| Gap between active indicator and track | 4dp [token:md.comp.progress-indicator.linear.track-active-indicator-space] | 4dp [token:md.comp.progress-indicator.linear.thick.track-active-indicator-space] |
| Stop indicator size | 4dp [token:md.comp.progress-indicator.linear.stop-indicator.size] | 4dp [token:md.comp.progress-indicator.linear.thick.stop-indicator.size] |
| Stop indicator inset from track end | 0dp [token:md.comp.progress-indicator.linear.stop-indicator.trailing-space] | 2dp [token:md.comp.progress-indicator.linear.thick.stop-indicator.trailing-space] |
| Wave amplitude | 3dp [token:md.comp.progress-indicator.linear.active-indicator.wave.amplitude] | [NOT FOUND] |
| Wavelength, determinate | 40dp [token:md.comp.progress-indicator.linear.active-indicator.wave.wavelength] | [NOT FOUND] |
| Wavelength, indeterminate | 20dp [token:md.comp.progress-indicator.linear.indeterminate.active-indicator.wave.wavelength] | [NOT FOUND] |

Circular:

| Part | Default | Thick sample |
|---|---|---|
| Size, flat | 40dp [token:md.comp.progress-indicator.circular.size] | 52dp [token:md.comp.progress-indicator.circular.thick.size] |
| Size, wavy | 48dp [token:md.comp.progress-indicator.circular.with-wave.size] | [NOT FOUND] |
| Track thickness | 4dp [token:md.comp.progress-indicator.circular.track.thickness] | 8dp [token:md.comp.progress-indicator.circular.thick.track.thickness] |
| Active indicator thickness | 4dp [token:md.comp.progress-indicator.circular.active-indicator.thickness] | 8dp [token:md.comp.progress-indicator.circular.thick.active-indicator.thickness] |
| Gap between active indicator and track | 4dp [token:md.comp.progress-indicator.circular.track-active-indicator-space] | 4dp [token:md.comp.progress-indicator.circular.thick.track-active-indicator-space] |
| Wave amplitude | 1.6dp [token:md.comp.progress-indicator.circular.active-indicator.wave.amplitude] | [NOT FOUND] |
| Wavelength | 15dp [token:md.comp.progress-indicator.circular.active-indicator.wave.wavelength] | [NOT FOUND] |

- Ends of the active indicator, track and stop indicator are fully round
  [token:md.comp.progress-indicator.active-indicator.shape] [token:md.comp.progress-indicator.track.shape]
  [token:md.comp.progress-indicator.stop-indicator.shape].
- The stop indicator is a 4dp [site:/components/progress-indicators/guidelines]
  [token:md.comp.progress-indicator.stop-indicator.size] circle.
- Circular sizes may range from 24dp to 240dp [site:/components/progress-indicators/guidelines];
  keep the largest ones for large and extra-large windows.
- The specs show the linear indicator inset 4dp [site:/components/progress-indicators/specs] from
  the screen edge.
- The thick values exist only in material-web's data; Flutter and Compose define no thick token
  [NOT FOUND].
- Compose has no default width token. When a linear indicator has no width constraint, its code
  uses 240dp [impl:compose-material3/commonMain/androidx/compose/material3/ProgressIndicator.kt:1031].

Platform differences (see `knowledge/conflicts.md`):

- Circular size in the old (deprecated) circular set [differs:md.comp.circular-progress-indicator.size]:
  - material-web: 48dp [token:md.comp.circular-progress-indicator.size].
  - Compose: 40dp [token:md.comp.circular-progress-indicator.size], which equals the current shared
    token above.
- Compose reads its values from `LinearProgressIndicatorTokens` and `CircularProgressIndicatorTokens`,
  so the shared `md.comp.progress-indicator.*` ids show NOT FOUND for Compose in
  `knowledge/not-found.md`.

## Typography

- Progress indicators have no text and no type token [NOT FOUND].

## Color roles and state layers

- Active indicator: primary [token:md.comp.progress-indicator.active-indicator.color].
- Track: secondary container [token:md.comp.progress-indicator.track.color].
- Stop indicator: primary [token:md.comp.progress-indicator.stop-indicator.color].
- Inside a button: the active indicator takes the button's label or icon color and the track is
  removed.
- The deprecated linear set used surface container highest for the track
  [token:md.comp.linear-progress-indicator.track.color]; do not mix it with the current set.
- No state layers: the indicator is not interactive.

## Motion

- No progress-indicator motion token exists in any repository [NOT FOUND]. The values below are
  chosen by the Compose code.
- Wavy indicators (Compose `WavyProgressIndicatorDefaults`):
  - Determinate progress changes animate over 500ms [token:md.sys.motion.duration.long2] with
    linear easing [token:md.sys.motion.easing.linear]
    ([impl:compose-material3/commonMain/androidx/compose/material3/WavyProgressIndicator.kt:395]).
  - The wave grows in over 500ms [token:md.sys.motion.duration.long2] with standard easing
    [token:md.sys.motion.easing.standard]
    ([impl:compose-material3/commonMain/androidx/compose/material3/WavyProgressIndicator.kt:503]).
  - It flattens over 500ms [token:md.sys.motion.duration.long2] with emphasized accelerate easing
    [token:md.sys.motion.easing.emphasized.accelerate]
    ([impl:compose-material3/commonMain/androidx/compose/material3/WavyProgressIndicator.kt:510]).
  - By default the wave travels one wavelength per second (`waveSpeed = wavelength`,
    WavyProgressIndicator.kt:109).
- Flat indicators (Compose `ProgressIndicatorDefaults`):
  - Determinate progress follows a non-bouncy, very-low-stiffness spring (`ProgressAnimationSpec`,
    ProgressIndicator.kt:862).
  - One indeterminate linear cycle: 1750ms [impl:compose-material3/commonMain/androidx/compose/material3/ProgressIndicator.kt:1049].
  - One indeterminate circular cycle: 6000ms [impl:compose-material3/commonMain/androidx/compose/material3/ProgressIndicator.kt:1072].

## Accessibility

- People using assistive technology need to reach the indicator and learn what is loading and how
  far along it is.
- Contrast:
  - The active indicator needs at least 3:1 against the surface it sits on.
  - When embedded in another component, such as a button, it needs 3:1 against that component.
  - Keep the stop indicator unless the track itself reaches 3:1 against every adjacent surface.
- Role and label: give it the progress bar role, and a label naming the action and the content,
  such as "Loading news article" or "Refreshing page". With several regions, the label says which
  one is loading.

## Platform mapping

- Jetpack Compose (material3 1.5.0-rc01):
  - Flat: `LinearProgressIndicator`, `CircularProgressIndicator`, with `ProgressIndicatorDefaults`
    (stroke widths, gap sizes, stop indicator size, colors).
  - Wavy: `LinearWavyProgressIndicator`, `CircularWavyProgressIndicator`, with
    `WavyProgressIndicatorDefaults` (wavelengths, container sizes, amplitude function). In this
    version the file carries no experimental opt-in.
- Flutter (`material_ui` 1.11.0): `LinearProgressIndicator`, `CircularProgressIndicator`
  (`.adaptive` too) and `RefreshProgressIndicator`.
  - The `year2023` flag defaults to true
    (progress_indicator.dart:609), which keeps the older look. Set it to false for the rounded style
    with a track gap and the stop indicator.
  - There is no wavy indicator. We supply it in Phase 3 as a reference widget.
- Web: no maintained official component. Our CSS indicators are built in Phase 3 from the
  material-web token values above.

## Pitfalls

- A separate indicator for every item in a group that loads together.
- Using a determinate indicator that does not reflect real progress.
- Turning a loading indicator into a determinate progress indicator. Only an indeterminate
  progress indicator should hand over to a determinate one.
- Wavy shape on tiny indicators or in small buttons, where the wave cannot be seen.
- Forgetting that the wave makes the component taller, so the layout jumps.
- Dropping the stop indicator when the track contrast is below 3:1.
- Mirroring circular indicators in right-to-left layouts (only linear ones flip).
- Flutter: leaving `year2023` at its default and getting the pre-2024 visuals.
