---
title: Loading indicator
kind: component
pages: [/components/loading-indicator/overview, /components/loading-indicator/specs, /components/loading-indicator/guidelines, /components/loading-indicator/accessibility]
tokenSets: [loading-indicator]
expressive: true
fetched: 2026-11-13
---

## Summary

The loading indicator is an Expressive component (May 2025) for short waits whose length is
unknown. Instead of a spinning arc it shows one shape that keeps morphing through a looping
sequence of Material shapes while it turns. It can sit directly on a surface or inside a circular
container, and it is the indicator used for pull-to-refresh. For most indeterminate circular
progress indicators it is the recommended replacement.

## Use it when

- A process is short, roughly between 200ms [site:/components/loading-indicator/guidelines] and
  five seconds, and its progress cannot be measured or is not worth showing.
- Something is running in the background and people should know the app is busy.
- Content is being refreshed with pull-to-refresh.
- In a button whose action takes a few seconds (form validation, checking for updates); it shows
  activity without taking much room.
- Avoid when:
  - The wait is shorter than 200ms [site:/components/loading-indicator/guidelines] (show the
    content directly) or longer than about five seconds (use a progress indicator; see
    progress-indicators.md#use-it-when).
  - The process will later report real progress. Start with an indeterminate progress indicator
    instead, because a loading indicator should never turn into a determinate progress indicator.
  - Decoration. The indicator always stands for real ongoing work.

## Anatomy

1. Active indicator: the morphing shape. Its looping sequence uses seven different shapes from the
   Material shape library.
2. Container (optional): a circle behind the active indicator.

## Variants

| Configuration | When |
|---|---|
| Default (uncontained) | Placed straight on a surface. |
| Contained | Placed over other content, where it needs more contrast; always used for pull-to-refresh. |

- When the container is shown, the active indicator switches color from primary to on primary
  container.

## Expressive

- The whole component is Expressive-only; there is no baseline M3 version.
- Shape morph: the indicator morphs through a closed loop of seven shapes. In Compose the default
  sequence is soft burst, 9-sided cookie, pentagon, pill, sunny, 4-sided cookie and oval
  (`LoadingIndicatorDefaults.IndeterminateIndicatorPolygons`, LoadingIndicator.kt:541).
- Compose also offers a progress-driven version that morphs from a circle to a soft burst as
  progress goes from 0 to 1 (`DeterminateIndicatorPolygons`, LoadingIndicator.kt:560). The site
  itself does not describe a determinate use.
- Size scales between limits, and the ratio of indicator to container stays fixed while scaling.

## States and behavior

- Placement:
  - Center it on the page or container that is loading.
  - When more items are coming into a page that already has content, put it in the empty space
    where the new items will appear and keep it off existing content.
- Size:
  - The default suits compact windows. As the window or pane grows, scale it up so it stays in
    proportion to the empty space around it.
  - Keep it between 24dp and 240dp [site:/components/loading-indicator/guidelines]; reserve the
    largest sizes for large and extra-large windows.
- Pull-to-refresh (Jetpack Compose only, per the site):
  - Use it at the top of lists, grids and card collections with frequently changing content.
  - It can overlap the content or sit next to it.
  - The pull must pass a threshold before a refresh starts. Releasing past the threshold starts the
    refresh; pulling back above it cancels.
  - Keep the indicator in view until the refresh finishes and new content is visible, or until the
    person leaves. Do not let it scroll off-screen, which hides the status and suggests that only
    part of the screen is refreshing.

## Measurements

| Part | Value |
|---|---|
| Overall size (default) | 48dp [site:/components/loading-indicator/specs] [token:md.comp.loading-indicator.container.width] |
| Container width and height | 48dp [token:md.comp.loading-indicator.container.width] [token:md.comp.loading-indicator.container.height] |
| Active indicator (shape area) | 38dp [site:/components/loading-indicator/specs] [token:md.comp.loading-indicator.active-indicator.size] |
| Container shape | fully round [token:md.comp.loading-indicator.container.shape] |
| Allowed size range | 24dp to 240dp [site:/components/loading-indicator/guidelines] |

- The 48dp [site:/components/loading-indicator/specs] box leaves margin around the 38dp
  [token:md.comp.loading-indicator.active-indicator.size] shape area.
- Compose names the active size with its own id: 38dp [token:md.comp.loading-indicator.active-size].
- No token gives the minimum or maximum size [NOT FOUND]; the range comes from the guidelines page.

## Typography

- The loading indicator has no text and no type token [NOT FOUND].

## Color roles and state layers

- Default: active indicator in primary [token:md.comp.loading-indicator.active-indicator.color], no
  container.
- Contained: container in primary container [token:md.comp.loading-indicator.contained.container.color]
  and active indicator in on primary container
  [token:md.comp.loading-indicator.contained.active-indicator.color].
- material-web's data also has `md.comp.loading-indicator.container.color` set to secondary
  container [token:md.comp.loading-indicator.container.color]. The site never uses that role for
  this component, so we do not apply it.
- No state layers: the indicator is not interactive.

## Motion

- No loading-indicator motion token exists in any repository [NOT FOUND]. Compose's code sets the
  motion directly:
  - Each morph to the next shape uses a spring with damping 0.6 and stiffness 200
    (LoadingIndicator.kt:401). This spring is not one of the motion-scheme tokens.
  - A new morph starts every 650ms [impl:compose-material3/commonMain/androidx/compose/material3/LoadingIndicator.kt:681].
  - Each morph also adds a quarter turn to the shape (LoadingIndicator.kt:684).
  - On top of that the whole indicator keeps rotating with linear easing (LoadingIndicator.kt:431).
    One full turn takes 4666ms [impl:compose-material3/commonMain/androidx/compose/material3/LoadingIndicator.kt:680].
- The determinate Compose variant rotates with progress rather than time: half a turn
  counter-clockwise across the full range (LoadingIndicator.kt:330).

## Accessibility

- People using assistive technology need to reach the indicator, learn what is loading, and be
  able to refresh without a gesture.
- Contrast: the active indicator needs at least 3:1 against what is behind it. The container does
  not need to meet that ratio. Inside another component, such as a button, the indicator needs 3:1
  against that component.
- Pull-to-refresh is a swipe, so also offer a single-pointer way to refresh, for example a refresh
  action in the app bar, an overflow menu, or next to the content.
- Role and label: use the progress bar role and a label that states what is loading, such as
  "Loading news article" or "Refreshing page".

## Platform mapping

- Jetpack Compose (material3 1.5.0-rc01): `LoadingIndicator` and `ContainedLoadingIndicator`, each
  with an indeterminate and a progress-driven overload, plus `LoadingIndicatorDefaults`
  (sizes, colors, shape sequences). They require `@ExperimentalMaterial3ExpressiveApi`.
  - Pull-to-refresh: `PullToRefreshBox` with `PullToRefreshDefaults.LoadingIndicator` (also
    Expressive-experimental).
- Flutter (`material_ui` 1.11.0): no loading indicator; a search of the package finds none. It is a
  Phase 3 gap component, built from our tokens and protected by golden tests. `RefreshIndicator`
  is the existing pull-to-refresh widget and uses a circular progress spinner.
- Web: no maintained official component. Our CSS loading indicator is built in Phase 3 from the
  material-web token values above.

## Pitfalls

- Using it for long or measurable work; that calls for a progress indicator.
- Switching from a loading indicator to a determinate progress indicator mid-process.
- Placing the uncontained indicator over busy content, where it loses contrast. Use the contained
  version there.
- Leaving the indicator primary-colored inside its container; contained uses on primary container.
- Scaling past 240dp [site:/components/loading-indicator/guidelines] or below 24dp
  [site:/components/loading-indicator/guidelines], or changing the indicator-to-container ratio.
- Pull-to-refresh with no button or menu alternative.
