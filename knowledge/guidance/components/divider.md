---
title: Divider
kind: component
pages: [/components/divider/overview, /components/divider/specs, /components/divider/guidelines, /components/divider/accessibility]
tokenSets: [divider]
expressive: false
fetched: 2026-11-13
---

## Summary

A divider is a thin line that groups content and shows hierarchy, including parent / child
nesting. It comes in a full-width and an inset form, and since M3 it can also run vertically. It
should be visible but quiet, and used only when open space alone cannot do the grouping.

## Use it when

- Full width: to split larger sections of unrelated content, either on a surface or inside a
  component such as a card or a list. It also separates an interactive area from a
  non-interactive one (for example inside a card).
- Inset: to separate related items inside one section, such as messages in a list. Pair it with
  anchoring elements (icons, avatars) and align it with the content's leading edge. An inset
  divider may also sit mid-layout, for example between body text and a row of chips.
- Both on one screen: full width between kinds of content, inset between nested items, so the
  lines echo the information hierarchy.
- Vertical: on large screens, to separate side-by-side regions such as text and media.
- Avoid when:
  - Spacing already separates the items. Lists with repeated, regular items often need only the
    gap between them.
  - Every single item would get its own line. Dividers group; too many make a screen look busy.

## Anatomy

1. The line. Nothing else; optional supporting text may sit next to it (see Measurements).

## Variants

- Full width: spans the container.
- Inset: indented at the start only.
- Middle inset: indented equally at both ends.
- Orientation: horizontal or vertical.

## Expressive

Not covered by the sources. The divider pages describe no M3 Expressive change. Against M2 they
list new color mappings with dynamic color and the new vertical orientation.

## States and behavior

- Dividers are static and non-interactive; they have no states.
- Keep the type of divider consistent within one level of the hierarchy.

## Measurements

| Property | Value |
|---|---|
| Thickness | 1dp [token:md.comp.divider.thickness] |
| Full-width length | 100% of the container [site:/components/divider/specs] |
| Inset: start margin | 16dp [site:/components/divider/specs] |
| Inset: end margin | 0dp [site:/components/divider/specs] |
| Middle inset: start margin | 16dp [site:/components/divider/specs] |
| Middle inset: end margin | 16dp [site:/components/divider/specs] |
| Gap between divider and supporting text | 4dp [site:/components/divider/specs] |

- The spec table also lists a divider right margin of 8dp [site:/components/divider/specs] and a
  bottom margin of 8dp [site:/components/divider/specs] without saying which configuration they
  apply to; we do not guess.
- Flutter's `Divider` defaults, with no indents
  [impl:material_ui/packages/material_ui/lib/src/generated/divider_defaults_m3.g.dart:12]:
  - Reserved height around the line (`space`): 16dp [impl:material_ui/packages/material_ui/lib/src/generated/divider_defaults_m3.g.dart:12].
  - Line thickness: 1dp [impl:material_ui/packages/material_ui/lib/src/generated/divider_defaults_m3.g.dart:12].
  The reserved space is a Flutter default, not a spec value.
- Inside lists, the list divider tokens apply instead; see lists.md#measurements.

## Typography

- The divider has no text of its own and no type token [NOT FOUND].

## Color roles and state layers

- Line: outline variant [token:md.comp.divider.color].
- No state layers; the divider is never interactive.
- Some components set their own divider color: lists [token:md.comp.list.divider.color] and
  basic dialogs [token:md.comp.dialog.with-divider.divider.color] use outline. Follow the
  component's token where one exists.

## Motion

- No motion. The divider has no motion tokens [NOT FOUND] and no animated behavior in the
  sources.

## Accessibility

- Dividers are decorative, so they have no minimum contrast requirement.
- The accessibility page covers nothing else for dividers.

## Platform mapping

- Jetpack Compose (material3 1.5.0-rc01): `HorizontalDivider` and `VerticalDivider`, with
  `DividerDefaults.Thickness` and `DividerDefaults.color`. The older `Divider` is deprecated.
- Flutter (`material_ui` 1.11.0): `Divider` and `VerticalDivider`; insets via `indent` and
  `endIndent`.
- Web: no maintained official component. Our CSS divider is built in Phase 3 from the
  material-web token values above.

## Pitfalls

- A divider between every item when spacing would do.
- Bold or high-contrast lines; dividers should stay in the background.
- Mixing full-width and inset dividers at random instead of by hierarchy.
- Inset dividers that do not line up with the content's leading edge.
