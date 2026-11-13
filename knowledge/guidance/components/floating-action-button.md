---
title: Floating action button (FAB)
kind: component
pages: [/components/floating-action-button/overview, /components/floating-action-button/specs, /components/floating-action-button/guidelines, /components/floating-action-button/accessibility]
tokenSets: [fab, fab.medium, fab.large, fab.small, fab.primary-container, fab.secondary-container, fab.tertiary-container, fab.primary, fab.secondary, fab.tertiary]
expressive: true
fetched: 2026-11-13
---

## Summary

The floating action button (FAB) holds the single most important action on a screen. It floats
above the content, stays put while the content scrolls, and shows one clear icon. It comes in
three sizes (FAB, medium FAB, large FAB) and six color styles. Related components: the extended
FAB (icon plus label, see extended-fab.md#summary) and the FAB menu (see fab-menu.md#summary).

## Use it when

- The screen has one primary, positive, constructive action: create, compose, favorite, share,
  start something. The action may work on the current screen or open a new one.
- Pick the size from the layout's hierarchy and window size:
  - FAB: the smallest. Best in compact windows where other actions are already on screen.
  - Medium FAB: the recommended default. Works best in compact and medium windows.
  - Large FAB: when the primary action must stand out; best in expanded and larger windows.
- Switch to an extended FAB when a label is needed, or to a FAB menu when the action has several
  related kinds.
- Avoid when:
  - The action is minor, unclear or destructive (archive, delete, error alerts, cutting text).
  - The control belongs in a toolbar (volume, font color).
  - The screen does not need one, for example when images already act as the main actions.
  - Another FAB is already on screen. Only one per screen; cards and other single components
    never get their own FAB.

## Anatomy

1. Container. A rounded square, never covered by badges or other elements, and with enough
   contrast against the surface it floats on.
2. Icon. A filled (not outlined) icon with a clear meaning, such as add, edit or message.

## Variants

- Size: FAB, medium FAB, large FAB. The small FAB still exists as a baseline variant but is no
  longer recommended; use a larger size.
- Color style: six pairings, each an accent role for the container and its "on" role for the
  icon. Three use the softer container roles (primary container is the default, then secondary
  and tertiary container); three use the stronger accent roles themselves (primary, secondary,
  tertiary). They are equally legible, so the choice is about look. Roles are listed under Color
  roles and state layers.
- Surface-colored FABs are a baseline style and are no longer recommended.

## Expressive

- The May 2025 update added the medium FAB, retired the small FAB, and kept the FAB and large FAB
  sizes unchanged. Variants are now named by size, not by color.
- Colors: new primary, secondary and tertiary styles were added. The older tonal styles were
  renamed to match the roles they really use (primary became primary container, and so on); their
  values did not change.
- Compared with M2, FABs are boxier rather than circular, can use dynamic color, and gained the
  large size.

## States and behavior

- States: enabled, hovered, focused, pressed. A FAB is never shown disabled; if its action is not
  available, hide the FAB.
- Resting elevation is level 3 [token:md.comp.fab.primary-container.container.elevation]; hover
  raises it to level 4 [token:md.comp.fab.primary-container.hovered.container.elevation].
- Placement:
  - Compact and medium windows: usually the lower trailing corner, easy to reach and away from
    important content. It may also sit left or center, above or inside the navigation bar.
  - Expanded and larger windows: consider the upper leading corner, for example inside the
    navigation rail, so it is one of the first things people meet.
- Scrolling: the FAB stays in place. An extended FAB may collapse into a FAB on scroll.
- The FAB can turn into an extended FAB on larger screens, open a FAB menu, or expand into a new
  surface with a container transform.
- Web: show a tooltip with the action's name on hover.
- No notifications or duplicated on-screen actions inside a FAB.

## Measurements

The values are material-web's (canonical). Every token that differs on another platform is
listed under "Platform differences" with a `[differs:]` marker.

| | FAB | Medium FAB | Large FAB |
|---|---|---|---|
| Container (width × height) | 56dp [token:md.comp.fab.container.height] | 80dp [token:md.comp.fab.medium.container.height] | 96dp [token:md.comp.fab.large.container.height] |
| Icon | 24dp [token:md.comp.fab.icon.size] | 28dp [token:md.comp.fab.medium.icon.size] | 36dp [token:md.comp.fab.large.icon.size] |
| Corner radius | 16dp [token:md.comp.fab.container.shape] | 20dp [token:md.comp.fab.medium.container.shape] | 28dp [token:md.comp.fab.large.container.shape] |

- Each container is square: width equals height [token:md.comp.fab.medium.container.width].
- The site's token table prints the FAB container height as 56dp [site:/components/floating-action-button/specs]
  [token:md.comp.fab.container.height] and its icon as 24dp [site:/components/floating-action-button/specs] [token:md.comp.fab.icon.size].
- Baseline small FAB (not recommended): 40dp [token:md.comp.fab.small.container.height] with a
  24dp [token:md.comp.fab.small.icon.size] icon and a 12dp [token:md.comp.fab.small.container.shape]
  corner.
- Padding and screen margins are drawn only in spec images without printed values [NOT FOUND].

Platform differences (see `knowledge/conflicts.md`):

- Large FAB icon [differs:md.comp.fab.large.icon.size]:
  - Compose's token: 32dp [token:md.comp.fab.large.icon.size]. Compose's code marks that token as
    wrong; `FloatingActionButtonDefaults.LargeIconSize` is set to
    36dp [impl:compose-material3/commonMain/androidx/compose/material3/FloatingActionButton.kt:1010].
  - material-web and Flutter: 36dp [token:md.comp.fab.large.icon.size].
- Medium FAB shape: Compose has no token for it [NOT FOUND] and uses `ShapeDefaults.LargeIncreased`
  in code (`FloatingActionButtonDefaults.mediumShape`).

## Typography

- A FAB shows no text, so it has no label type token [NOT FOUND]. For the labelled version see
  extended-fab.md#typography.

## Color roles and state layers

Color style → container / icon:

- Primary container (default): primary container
  [token:md.comp.fab.primary-container.container.color] / on primary container
  [token:md.comp.fab.primary-container.icon.color].
- Secondary container: secondary container [token:md.comp.fab.secondary-container.container.color]
  / on secondary container [token:md.comp.fab.secondary-container.icon.color].
- Tertiary container: tertiary container [token:md.comp.fab.tertiary-container.container.color] /
  on tertiary container [token:md.comp.fab.tertiary-container.icon.color].
- Primary: primary [token:md.comp.fab.primary.container.color] / on primary
  [token:md.comp.fab.primary.icon.color].
- Secondary: secondary [token:md.comp.fab.secondary.container.color] / on secondary
  [token:md.comp.fab.secondary.icon.color].
- Tertiary: tertiary [token:md.comp.fab.tertiary.container.color] / on tertiary
  [token:md.comp.fab.tertiary.icon.color].
- Baseline surface style (not recommended): surface container high
  [token:md.comp.fab.surface.container.color] / primary [token:md.comp.fab.surface.icon.color].

State layers, drawn in the icon color (with a non-default style, keep the state layer in that
style's icon role):

- Hovered: 8% [site:/components/floating-action-button/specs]
  [token:md.comp.fab.primary-container.hovered.state-layer.opacity], plus elevation level 4.
- Focused: 10% [site:/components/floating-action-button/specs]
  [token:md.comp.fab.primary-container.focused.state-layer.opacity].
- Pressed: 10% [site:/components/floating-action-button/specs]
  [token:md.comp.fab.primary-container.pressed.state-layer.opacity].

## Motion

- Appearing: the FAB grows outward from its center; its icon may animate too. It moves on its own,
  not with the body content.
- Screen and tab changes: the FAB briefly leaves and comes back once the new content has settled,
  in the same place if it is still relevant. It does not slide along with a tab's content.
- No FAB duration, easing or spring token covers these transitions [NOT FOUND].
- Compose: `Modifier.animateFloatingActionButton` scales the FAB with the fast spatial spring
  [impl:compose-material3/commonMain/androidx/compose/material3/FloatingActionButton.kt:1249] and
  fades it with the fast effects spring
  [impl:compose-material3/commonMain/androidx/compose/material3/FloatingActionButton.kt:1259].
  - Fast spatial, standard scheme: damping 0.9, stiffness 1400
    [token:md.sys.motion.spring.fast.spatial.damping]
    [token:md.sys.motion.spring.fast.spatial.stiffness]; expressive scheme: damping 0.6,
    stiffness 800.
  - Fast effects: damping 1, stiffness 3800 [token:md.sys.motion.spring.fast.effects.damping]
    [token:md.sys.motion.spring.fast.effects.stiffness].
- Flutter: the `Scaffold` swaps FABs over `kFloatingActionButtonSegue`, which is
  200ms [impl:material_ui/packages/material_ui/lib/src/floating_action_button_location.dart:31].
- Expanding into a surface uses the container transform pattern; see the motion foundations.

## Accessibility

- People must be able to reach the FAB, activate it, and (for the extended FAB) expand and
  collapse it with assistive technology.
- Never disable the FAB; remove it when its action is unavailable.
- The icon needs at least 3:1 contrast with the container.
- Put the FAB early in the focus order. On mobile, focus can go from the app bar to the
  navigation bar and then jump straight to the FAB.
- Keyboard: Tab focuses the FAB; Space or Enter runs its action.
- The accessible name states the action ("Compose a new message"), not the icon.
- On the web, a tooltip on focus can surface the label.
- On expanded web layouts, an upper-left position helps screen-reader users find it; test this
  with users. In compact and medium windows, keep it in the lower trailing corner.
- On the web, do not place the FAB where it fully hides another control's focus indicator; partial
  overlap is fine while the indicator stays visible.

## Platform mapping

- Jetpack Compose (material3 1.5.0-rc01): `FloatingActionButton`, `MediumFloatingActionButton`,
  `LargeFloatingActionButton`, and the baseline `SmallFloatingActionButton`.
  - `FloatingActionButtonDefaults` gives `shape`, `mediumShape`, `largeShape`, `MediumIconSize`,
    `LargeIconSize`, `containerColor`, `elevation(...)` and `loweredElevation(...)`.
  - `Modifier.animateFloatingActionButton(visible, alignment, ...)` shows and hides it.
- Flutter (`material_ui` 1.11.0): `FloatingActionButton`, `FloatingActionButton.small` and
  `FloatingActionButton.large`. There is no medium FAB constructor; we supply it in Phase 3 as a
  reference widget.
- Web: no maintained official component. Our CSS FAB is built in Phase 3 from the material-web
  token values above.

## Pitfalls

- More than one FAB on a screen, or a FAB on a card.
- A FAB for destructive, minor or overflow actions.
- Showing a disabled FAB instead of hiding it.
- Outlined or ambiguous icons; use a filled, well-known glyph.
- Badges or other elements covering the container.
- Using the small FAB, or surface-colored FABs, in new designs.
- Letting the FAB slide along with tab content instead of leaving and returning.
- Placing it so it completely hides another control's focus ring on the web.
