---
title: Badges
kind: component
pages: [/components/badges/overview, /components/badges/specs, /components/badges/guidelines, /components/badges/accessibility]
tokenSets: [badge, badge.large]
expressive: false
fetched: 2026-11-13
---

## Summary

A badge is a small marker pinned to an icon to flag something new or to show a count. It almost
always lives inside another component: a navigation bar or rail destination, an app bar icon, or a
tab. There are two variants: a plain dot, and a pill that holds a short label.

## Use it when

- A navigation destination or icon has unread items, a pending count or a short status worth
  surfacing without opening it.
- Pick the variant by what you need to say and how much room there is:
  - Small badge (a dot): "something is new here", with no number. Prefer it in tight places such
    as app bars, where a wider badge could hit the screen edge.
  - Large badge: a number or short status. Good where nothing sits next to the icon, for example a
    navigation rail.
- Avoid when:
  - The badge would cover the icon or collide with a neighbouring label or element. Move a large
    badge to the trailing edge of the row, or fall back to a small badge.
  - The information is essential and needs explanation; a badge only hints.

## Anatomy

1. Small badge: a filled circle with no text.
2. Large badge container: a pill that widens as the label grows; its height stays fixed.
3. Large badge label: up to four characters, counting a trailing "+" (for example "999+").

The badge is anchored inside the icon's bounding box, at its top trailing corner. In right-to-left
layouts it moves to the mirrored corner.

## Variants

- Small: status only.
- Large: count or short label. One character keeps it circular; more characters stretch the width
  while the anchor point stays put.
- No size or color configurations beyond these two.

## Expressive

- The sources show no Expressive update for badges. The only M3 change listed is the new color
  mapping (error and on error), which also works with dynamic color.

## States and behavior

- A badge has no interactive states of its own; it follows the state of the destination it sits
  on (active or inactive, with or without a label).
- When a badge marks unread content on a navigation destination, hide it once that destination is
  selected.
- Keep labels to four characters. Shorten large numbers with a "+" rather than letting the badge
  grow until it is clipped or overlaps something.
- Do not move the badge to arbitrary positions or place it over the middle of the icon. The only
  sanctioned move is mirroring for right-to-left languages.

## Measurements

| Part | Value |
|---|---|
| Small badge size | 6dp [site:/components/badges/specs] [token:md.comp.badge.size] |
| Small badge corner radius | 3dp [site:/components/badges/specs], fully round [token:md.comp.badge.shape] |
| Large badge height (one character is a circle) | 16dp [site:/components/badges/specs] [token:md.comp.badge.large.size] |
| Large badge corner radius | 8dp [site:/components/badges/specs], fully round [token:md.comp.badge.large.shape] |
| Large badge at four characters (H × W) | 16 × 34dp [site:/components/badges/specs] |
| Large badge horizontal padding around the label | 4dp [site:/components/badges/specs] |
| Small badge offset from the icon's top trailing corner (H × W) | 6 × 6dp [site:/components/badges/specs] |
| Large badge offset from the icon's top trailing corner (H × W) | 14 × 12dp [site:/components/badges/specs] |

- The token set has no padding, offset or maximum-width token [NOT FOUND]; those values come from
  the specs page only.
- Compose writes the offsets and padding as code constants in `Badge.kt`:
  - Label padding: 4dp [impl:compose-material3/commonMain/androidx/compose/material3/Badge.kt:202].
  - Large badge: 12dp horizontal [impl:compose-material3/commonMain/androidx/compose/material3/Badge.kt:209]
    and 14dp vertical [impl:compose-material3/commonMain/androidx/compose/material3/Badge.kt:211]
    from the anchor's top end corner.
  - Small badge: 6dp [impl:compose-material3/commonMain/androidx/compose/material3/Badge.kt:218]
    from the anchor edge.

## Typography

- Large badge label: label small [token:md.comp.badge.large.label-text.font]. In Flutter's data
  the style is given by a separate type token [token:md.comp.badge.large.label-text.type], which
  also points to label small.
- The small badge has no text.

## Color roles and state layers

- Container (small and large): error [token:md.comp.badge.color]
  [token:md.comp.badge.large.color].
- Large badge label: on error [token:md.comp.badge.large.label-text.color].
- No state layers: the badge is not interactive. The destination underneath keeps its own state
  layers (see the navigation bar and rail notes).
- Keep the default mapping. If a product must use other roles, the container and label still need
  at least 3:1 contrast.

## Motion

- No badge motion, duration, easing or spring token [NOT FOUND]. The sources do not describe how a
  badge appears or disappears.

## Accessibility

- Assistive technology should convey what the badge says (the count or the "new" status) and let
  people reach the related destination.
- The badge's announcement comes after the destination's own label:
  - a numbered badge reads its number;
  - a dot badge reads as a generic new-notification message.
- Default colors are chosen to give at least 3:1 contrast; custom roles must keep that ratio.
- Hiding the badge when the destination is opened keeps the announcement accurate.

## Platform mapping

- Jetpack Compose (material3 1.5.0-rc01): `BadgedBox` places a `Badge` on an anchor such as a
  navigation item icon; pass content to `Badge` for a large badge, none for a dot. Colors come
  from `BadgeDefaults`.
- Flutter (`material_ui` 1.11.0): `Badge` (dot or custom label) and `Badge.count` (numeric label
  with an overflow cap).
- Web: no maintained official component. Our CSS badge is built in Phase 3 from the material-web
  token values above.

## Pitfalls

- Letting long counts run past four characters, so the pill gets clipped at the screen edge or
  hits a neighbouring label.
- Placing a large badge where it overlaps a trailing label in a tab or list row.
- Recoloring the badge with roles that drop below 3:1 contrast.
- Leaving an "unread" badge visible after the destination has been opened.
- Shifting the badge off its anchor corner, or centering it over the icon.
