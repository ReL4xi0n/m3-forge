# M3 Expressive

M3 Expressive is the default style. It is M3 plus a wider range of shape, size, motion and type,
some new components and a list of retired ones. Use classic M3 only when the request asks for
classic, baseline or non-Expressive Material 3.

## What changes in the build

- Color: unchanged. The scheme variant stays `tonalSpot` (color.md). The MCU variant named
  `expressive` has nothing to do with this style.
- Shape: the three added corner steps (large increased, extra large increased, extra extra large)
  are available; buttons and toggles morph their corners when pressed or selected (shape.md).
- Motion: the expressive motion scheme (motion.md). Morphs and component motion use springs, not
  fixed durations.
- Type: emphasized styles for selected, unread and key-action text (typography.md).
- Size: buttons, icon buttons, split buttons and button groups come in XS, S (default), M, L, XL.
  Make the screen's main action the largest control on it.
- Hierarchy: one primary task per screen; frame it with space, size and color. Do not stack every
  expressive tactic on one screen.

## Use the current component, not the retired one

| Instead of | Use |
|---|---|
| Segmented button | Connected button group |
| Navigation drawer | Expanded navigation rail (modal or standard) |
| Baseline navigation rail | Collapsed navigation rail |
| Baseline navigation bar | Flexible (short) navigation bar |
| Bottom app bar | Docked toolbar |
| Medium / large top app bar | Medium flexible / large flexible app bar |
| Small FAB, surface FAB, surface extended FAB | FAB, medium FAB, large FAB; small, medium, large extended FAB in tone styles |
| Speed dial, stacked small FABs | FAB menu |
| Indeterminate circular progress for short waits | Loading indicator |

New components worth reaching for (all in components.md): split button and button groups for
related actions, the FAB menu, toolbars (floating or docked), flexible and search app bars,
collapsed or expanded rails, the loading indicator, vertical menus and Expressive lists.

## Rules that come with it

- FAB sizes: medium FAB is the default choice; large FAB for a dominant action on wide windows.
- FAB menu opens only from a FAB and holds two to six related actions.
- Docked or floating toolbar never shares the screen with a navigation bar.
- Toggle buttons change shape and fill when selected; color is not the only cue.
- Loading indicator only for real work shorter than about five seconds; longer or measurable work
  gets a progress indicator.
- Spatial springs may overshoot; color and opacity use effects springs, which never do.
- Some small motions stay standard even in Expressive (a split button's menu icon rotation).

## Platform support

| Platform | How to get Expressive |
|---|---|
| Compose | `MaterialExpressiveTheme(colorScheme = M3LightColorScheme, typography = M3Typography, shapes = M3ShapeScheme, motionScheme = MotionScheme.expressive())`; the Expressive components are in material3 (some need `@OptIn(ExperimentalMaterial3ExpressiveApi::class)`) |
| Flutter | Material widgets are mostly baseline. Theme with the skill assets (`M3Type`, `M3EmphasizedType`, `M3Shapes`, `M3Motion.expressive`) and use the Expressive widgets that `references/flutter/components.md` lists; build anything else from Material primitives with tokens |
| Web | No Expressive component library. `assets/web/tokens.css` is Expressive by default; components come from the skill's web component CSS listed in `references/web/components.md` |

## Classic M3 opt-out

- Web: `data-m3-style="classic"` on the root element.
- Compose: `MaterialTheme` (standard motion scheme) and the baseline styles only.
- Flutter: `M3Motion.standard`, baseline `M3Type.textTheme` only, no Expressive-only shape steps.
- Classic still uses the current components; retired components appear only when the request names
  them.
