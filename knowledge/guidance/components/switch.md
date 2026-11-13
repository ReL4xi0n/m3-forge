---
title: Switch
kind: component
pages: [/components/switch/overview, /components/switch/specs, /components/switch/guidelines, /components/switch/accessibility]
tokenSets: [switch]
expressive: false
fetched: 2026-11-13
---

## Summary

A switch turns one setting on or off, and the change applies at once. It is the selection control
for standalone options such as settings. The handle slides along a track and grows when the switch
is on or being touched, so its state is clear at a glance. An icon inside the handle is optional.

## Use it when

- A single option is binary (on or off, true or false) and should take effect immediately, with
  no Save step.
- Settings screens, and similar lists of independent options that are each controlled on their
  own.
- Avoid when:
  - The choice is between two opposing options (list view vs map view); use a connected button
    group.
  - Several related options are picked from a list; use checkboxes.
  - Only one item of a list may be chosen; use radio buttons.
  - Changes are collected and saved later; use checkboxes, since a switch implies an immediate
    effect.
  - The control starts an action; people expect a button for that.

## Anatomy

1. Track: the pill-shaped background.
2. Handle (formerly "thumb"): the circle that slides from one end of the track to the other.
3. Icon (optional): drawn inside the handle.

An inline label next to the switch is required. It says what the switch controls when it is on.

## Variants

- Without icons (default).
- With an icon on the selected handle only.
- With icons on both the selected and the unselected handle.
- Icons must state the value without ambiguity, such as a check mark for on and an X for off. Avoid
  icons with no clear on/off meaning (a moon, a pencil).
- Do not put text inside the switch; it would be too small to read. Use an icon.

## Expressive

- Switches did not receive an Expressive update; there are no new sizes or shape morphs.
- The M3 changes from M2:
  - A taller, wider track. The M2 handle overhung the track's edges.
  - The optional handle icon.
  - New color mappings that work with dynamic color and meet the non-text contrast requirement.

## States and behavior

- Interaction states: enabled, hovered, focused, pressed, disabled; each for on and off.
- Toggling slides the handle to the other end of the track, and the effect applies immediately.
- The handle size shows the state and gives feedback:
  - Off: small. On, or carrying an icon: larger. Pressed or dragged: largest.
  - With a pointer, hovering grows the hover area; clicking grows the handle.
- Switches are usually stacked in lists, one per setting.
- Labels are short and describe the on state.

## Measurements

The values are material-web's (canonical). Every token that differs on another platform is listed
under "Platform differences" with a `[differs:]` marker.

| Part | Property | Value |
|---|---|---|
| Track | Width | 52dp [site:/components/switch/specs] [token:md.comp.switch.track.width] |
| Track | Height | 32dp [site:/components/switch/specs] [token:md.comp.switch.track.height] |
| Track | Outline width | 2dp [site:/components/switch/specs] [token:md.comp.switch.track.outline.width] |
| Track | Shape | fully round [token:md.comp.switch.track.shape] |
| Handle | Off, no icon | 16dp [site:/components/switch/specs] [token:md.comp.switch.unselected.handle.width] |
| Handle | With an icon (on or off) | 24dp [site:/components/switch/specs] [token:md.comp.switch.with-icon.handle.width] |
| Handle | On | 24dp [site:/components/switch/specs] [token:md.comp.switch.selected.handle.width] |
| Handle | Pressed | 28dp [site:/components/switch/specs] [token:md.comp.switch.pressed.handle.width] |
| Handle | Shape | circle [token:md.comp.switch.handle.shape] |
| Icon | Size, on and off | 16dp [site:/components/switch/specs] [token:md.comp.switch.selected.icon.size] |
| State layer | Size | 40dp [site:/components/switch/specs] [token:md.comp.switch.state-layer.size] |
| Touch target | Size | 48dp [site:/components/switch/specs] |
| Focus ring | Thickness / offset | 3dp [token:md.comp.switch.focus.indicator.thickness] / 2dp [token:md.comp.switch.focus.indicator.offset] |

- Handle sizes are given as width; height is equal in every case
  [token:md.comp.switch.selected.handle.height] [token:md.comp.switch.pressed.handle.height].
- Compose names the icon-handle size `icon-handle-width` and `icon-handle-height`, both
  24dp [token:md.comp.switch.icon-handle-width].
- Compose defines no focus-ring tokens for the switch [NOT FOUND].

Platform differences (see `knowledge/conflicts.md`):

- Icon color on the selected handle [differs:md.comp.switch.selected.icon.color]:
  - material-web and Flutter: primary [token:md.comp.switch.selected.icon.color].
  - Compose: on primary container [token:md.comp.switch.selected.icon.color]. Its hovered,
    focused and pressed icon tokens show this difference too (`knowledge/conflicts.md`).
  - The site's role list for the switch includes on primary container.

## Typography

- The switch shows no text and has no type token [NOT FOUND].
- The adjacent label uses on surface; supporting text below it may use on surface variant. The
  site names no type style for either [NOT FOUND].

## Color roles and state layers

| Part | Off | On |
|---|---|---|
| Track | surface container highest [token:md.comp.switch.unselected.track.color] with an outline-colored edge [token:md.comp.switch.unselected.track.outline.color] | primary [token:md.comp.switch.selected.track.color], no edge |
| Handle | outline [token:md.comp.switch.unselected.handle.color] | on primary [token:md.comp.switch.selected.handle.color] |
| Handle, hovered / focused / pressed | on surface variant [token:md.comp.switch.unselected.hover.handle.color] | primary container [token:md.comp.switch.selected.hover.handle.color] |
| Icon | surface container highest [token:md.comp.switch.unselected.icon.color] | primary (material-web) [token:md.comp.switch.selected.icon.color] |

Disabled:

- On: track on surface at 12% [token:md.comp.switch.disabled.track.opacity] and handle surface
  [token:md.comp.switch.disabled.selected.handle.color]. The icon is on surface at
  38% [token:md.comp.switch.disabled.selected.icon.opacity].
- Off: track surface container highest at 12% [token:md.comp.switch.disabled.track.opacity] with
  an on surface edge [token:md.comp.switch.disabled.unselected.track.outline.color]. The handle is
  on surface at 38% [token:md.comp.switch.disabled.unselected.handle.opacity].

State layers (a circle around the handle):

- On: primary [token:md.comp.switch.selected.hover.state-layer.color].
- Off: on surface [token:md.comp.switch.unselected.hover.state-layer.color].
- Opacities: hover 8% [token:md.comp.switch.selected.hover.state-layer.opacity], focus
  10% [token:md.comp.switch.selected.focus.state-layer.opacity], press
  10% [token:md.comp.switch.selected.pressed.state-layer.opacity].
- Focus ring: secondary [token:md.comp.switch.focus.indicator.color].

## Motion

- No switch duration, easing or spring token exists in the three sources [NOT FOUND]. The switch
  has no Expressive morph. Code chooses the motion:
- Compose moves and resizes the handle with the fast spatial spring
  [impl:compose-material3/commonMain/androidx/compose/material3/Switch.kt:188]: damping 0.9 and
  stiffness 1400 in the standard scheme, damping 0.6 and stiffness 800 in the expressive one
  [token:md.sys.motion.spring.fast.spatial.damping] [token:md.sys.motion.spring.fast.spatial.stiffness].
- Flutter's M3 switch slides the handle over
  300ms [impl:material_ui/packages/material_ui/lib/src/generated/switch_defaults_m3.g.dart:221].

## Accessibility

- People must be able to reach the switch with a keyboard or a switch device, toggle it, and get
  feedback that suits their input method.
- Keyboard: Tab puts focus on the handle, the main interactive part. Space or Enter toggles it.
- Accessible name: normally the adjacent label. When the label is linked, screen readers read it
  and then the role.
- When the visible label is vague, give the switch a more specific accessible name (for example
  "Photo album access" for a switch labelled "Photo album"). A clearer visible label is the better
  fix where possible.
- The handle icon is optional. The state shows without it: the handle slides to the other end of
  the track, and in the on state it is larger.
- Target: 48 × 48dp [site:/components/switch/specs]. Keep density opt-in, and keep the controls
  that undo it at full size.

## Platform mapping

- Jetpack Compose (material3 1.5.0-rc01): `Switch(checked, onCheckedChange, thumbContent = …)`.
  `SwitchDefaults.colors()` holds the colors and `SwitchDefaults.IconSize` the icon size,
  16dp [impl:compose-material3/commonMain/androidx/compose/material3/Switch.kt:473].
- Flutter (`material_ui` 1.11.0): `Switch` with `thumbIcon` (a state-dependent icon),
  `Switch.adaptive`, and `SwitchListTile` for a switch in a list item.
- Web: no maintained official component. Our CSS switch is built in Phase 3 from the material-web
  token values above.

## Pitfalls

- A switch for two opposing views, or for a choice that is only applied after Save.
- A switch used as a call to action instead of a button.
- Text inside the track, or icons with no clear on/off meaning.
- Labels that describe the off state, or no label at all.
- Expecting one selected-icon color on every platform; Compose uses a different role (see
  Platform differences).
- Default density that shrinks the 48dp [site:/components/switch/specs] target.
