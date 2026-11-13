---
title: Lists
kind: component
pages: [/components/lists/overview, /components/lists/specs, /components/lists/guidelines, /components/lists/accessibility]
tokenSets: [list, expanded-list, reorder-list, reveal-list]
expressive: true
fetched: 2026-11-13
---

## Summary

A list is a vertical group of items, each built from text plus optional visuals and controls,
tuned for scanning and acting on one item. Since December 2025 there are two variants: the
expressive list (recommended for new work), with a standard or segmented look, a highlighted
selected state and flexible slots; and the baseline list, still supported but no longer
recommended.

## Use it when

- People need to find one item and act on it: open it, select it, toggle it.
- Choosing among discrete things (colors, contacts, files), where images, labels and controls sit
  side by side.
- Order the items in a way people can predict (alphabetical, numerical, by date) and keep every
  item in the same format so the eye can scan one column.
- Avoid when:
  - Items are visual and should be browsed; a carousel or a grid of cards fits better.
  - Items carry lots of content; on larger windows swap the list for cards, a carousel, or a
    list-detail layout.

## Anatomy

Required: container and label text. Everything else is optional.

1. Container.
2. Overline (small text above the label).
3. Label text.
4. Supporting text (one to three lines).
5. Trailing text (meta information: price, count, date).
6. Trailing icon, icon button, or selection control (checkbox, radio button, switch).
7. Leading element: avatar (person or entity; circle or expressive shape), icon, image or video
   thumbnail, or a selection control.
8. Divider (optional).

Slots (expressive lists in the design kit): leading, content and trailing.

- Leading slot: a visual (avatar, icon, image, video), a selection control, or a badge or larger
  image.
- Content slot: label and supporting text, plus small add-ons (badge, icon, inline label). It must
  be the widest slot and sit in the middle.
- Trailing slot: an icon, icon button or trailing text.
- Slots need custom code that you maintain, and they are not accessible by default (see
  Accessibility).

## Variants

- Expressive list:
  - Style: standard or segmented. The style is purely visual; behavior does not change.
  - Segmented items are separate rounded containers with small gaps; standard items are flush.
- Baseline list: square corners and the original colors. On the web the expressive list is
  layered on top of the baseline list.
- Selection modes (one per list at a time; a list can switch modes but not combine them):
  - Single-action: the whole item is one tap target, usually navigation. No persistent selected
    state.
  - Multi-action: a primary action fills the leading and content area; secondary actions
    (bookmark, menu) go in the trailing position. Only the actions are selectable, not the item.
  - Single-select: radio buttons. No nested or secondary actions, no checkboxes.
  - Multi-select: checkboxes or switches, never radio buttons.
  - Non-interactive: information only, nothing to tap or select.
- Interactions:
  - Expand and collapse: items that hold other items open like folders. Opening an item to fill
    the screen uses a container transform (parent-child) transition.
  - Swipe to reveal: buttons appear behind the item (Android Views only). The primary action is
    the last, end-aligned button, and a full swipe triggers it.
  - Drag to reorder (dragged items lift and recolor; see Color roles).

## Expressive

- The expressive list (December 2025) added the segmented style, the highlighted selection
  treatment, and slots.
- Shape morph on selection:
  - Unselected segmented items: 4dp inner corners [site:/components/lists/specs] [token:md.comp.list.list-item.container.expressive.shape].
  - The group's outer corners: 16dp [site:/components/lists/specs] [token:md.comp.list.container.shape].
  - Selected item: 16dp on every corner [site:/components/lists/specs] [token:md.comp.list.list-item.selected.container.expressive.shape].
- Interaction shapes in the token data:
  - Hovered: 12dp [token:md.comp.list.list-item.hovered.container.expressive.shape].
  - Focused: 16dp [token:md.comp.list.list-item.focused.container.expressive.shape].
  - Pressed: 16dp [token:md.comp.list.list-item.pressed.container.expressive.shape].
  - Dragged: 16dp [token:md.comp.list.list-item.dragged.container.expressive.shape].
- Selected items fill with secondary container and switch every text and icon to on secondary
  container, so selection reads at a glance.
- Leading and trailing icons shrink to 20dp [token:md.comp.list.list-item.leading-icon.expressive.size]
  in expressive lists (baseline: 24dp [token:md.comp.list.list-item.leading-icon.size]).
- Leading images get 8dp corners [token:md.comp.list.list-item.leading-image.expressive.shape];
  baseline images are square-cornered.

## States and behavior

- States: enabled, disabled, hovered, focused, pressed, dragged; selected items have the same set.
- Selection applies to the whole item: when its checkbox is checked, the item shows its selected
  state too.
- Height comes from the tallest element: one, two or three lines (see Measurements).
- Alignment: content is vertically centered; items 88dp [site:/components/lists/overview] or
  taller, or with three or more lines of text, align their content to the top.
- Text: label text may wrap or truncate; keep supporting text to one to three lines and truncate
  it on small windows.
- Separation:
  - Gaps suit contained (segmented) lists; they lean on shape and containment.
  - Dividers suit uncontained or complex lists that need a stronger break.
- Image items may take a content-based color scheme for the container, either at rest or while
  interacting.
- Adaptive:
  - Compact: the list runs edge to edge, and picking an item opens a detail page.
  - Medium and expanded: show list and detail side by side, show more per item (supporting text,
    larger images), or switch to a multi-column layout, cards or a carousel.
  - Keep lines readable: about 40 to 60 characters is ideal; up to about 120 on large screens,
    with more line height near the upper end.
- Dragged items rise to elevation level 4 [token:md.comp.list.list-item.dragged.container.elevation];
  items rest at level 0.

## Measurements

Heights:

| Lines | Height |
|---|---|
| One | 56dp [site:/components/lists/overview] [token:md.comp.list.list-item.one-line.container.height] |
| Two | 72dp [site:/components/lists/overview] [token:md.comp.list.list-item.two-line.container.height] |
| Three | 88dp [site:/components/lists/overview] [token:md.comp.list.list-item.three-line.container.height] |

Spacing (token data, material-web canonical):

| Property | Value |
|---|---|
| Start padding | 16dp [token:md.comp.list.list-item.leading-space] |
| End padding | 16dp [token:md.comp.list.list-item.trailing-space] |
| Top padding | 10dp [token:md.comp.list.list-item.top-space] |
| Bottom padding | 10dp [token:md.comp.list.list-item.bottom-space] |
| Gap between leading, content and trailing | 12dp [token:md.comp.list.list-item.between-space] |
| Gap between segmented items | 2dp [token:md.comp.list.segmented.gap] |
| Divider start inset | 16dp [token:md.comp.list.divider.leading-space] |
| Divider end inset | 16dp [token:md.comp.list.divider.trailing-space] |
| Space above and below a divider | 0dp [token:md.comp.list.divider.top-space] |
| Divider thickness | 1dp [token:md.comp.list.divider.height] |

Leading elements:

| Element | Size |
|---|---|
| Avatar | 40dp [token:md.comp.list.list-item.leading-avatar.size] |
| Icon (baseline) | 24dp [token:md.comp.list.list-item.leading-icon.size] |
| Image | 56dp [token:md.comp.list.list-item.leading-image.width] |
| Small video, width | 100dp [token:md.comp.list.list-item.small.leading-video.width] |
| Small video, height | 56dp [token:md.comp.list.list-item.small.leading-video.height] |
| Large video, width | 114dp [token:md.comp.list.list-item.large.leading-video.width] |
| Large video, height | 64dp [token:md.comp.list.list-item.large.leading-video.height] |
| Video corner | 8dp [token:md.comp.list.list-item.leading-video.shape] |

Baseline list table on the site (where it differs from the tokens above, the repository value
wins):

- Label start padding: 16dp [site:/components/lists/specs].
- Leading and trailing elements: centered, or top-aligned at 88dp [site:/components/lists/specs]
  and taller.
- Leading icon top padding: 8dp [site:/components/lists/specs].
- Leading icon top padding, tall items: 12dp [site:/components/lists/specs].
- Space before the trailing element: 16dp [site:/components/lists/specs].
- Trailing end padding in the site table: 24dp [site:/components/lists/specs] [token:md.comp.list.list-item.trailing-space] (the token's 16dp wins; listed in `conflicts.md`).
- Divider inset end padding in the site table: 24dp [site:/components/lists/specs] [token:md.comp.list.divider.trailing-space] (the token's 16dp wins; listed in `conflicts.md`).
- Touch targets: 48dp [site:/components/lists/specs].
- The icon button in the trailing slot stretches to the item's height.

Implementation references:

- Flutter's `ListTile` content padding: 16dp start, 24dp end [impl:material_ui/packages/material_ui/lib/src/generated/list_tile_defaults_m3.g.dart:13].
- Flutter's minimum vertical padding: 8dp [impl:material_ui/packages/material_ui/lib/src/generated/list_tile_defaults_m3.g.dart:15].

## Typography

| Element | Type style |
|---|---|
| Label text | body large [token:md.comp.list.list-item.label-text.font] |
| Supporting text | body medium [token:md.comp.list.list-item.supporting-text.font] |
| Overline | label small [token:md.comp.list.list-item.overline.font] |
| Trailing text | label small [token:md.comp.list.list-item.trailing-supporting-text.font] |
| Avatar initial | title medium [token:md.comp.list.list-item.leading-avatar-label.font] |

## Color roles and state layers

Enabled:

- Container: surface [token:md.comp.list.list-item.container.color]; segmented items also surface
  [token:md.comp.list.list-item.segmented.container.color].
- Label: on surface [token:md.comp.list.list-item.label-text.color].
- Supporting text, overline, trailing text: on surface variant
  [token:md.comp.list.list-item.supporting-text.color].
- Leading and trailing icons: on surface variant [token:md.comp.list.list-item.leading-icon.color].
- Avatar: primary container with on primary container initials
  [token:md.comp.list.list-item.leading-avatar.color] [token:md.comp.list.list-item.leading-avatar-label.color].
- Divider: outline in the token data [token:md.comp.list.divider.color]; the site's color list
  names outline variant. The repository value wins.

Selected:

- Container: secondary container [token:md.comp.list.list-item.selected.container.color].
- All text and icons: on secondary container [token:md.comp.list.list-item.selected.label-text.color].

Dragged (reorder):

- Container: tertiary container [token:md.comp.list.reorder.list-item.container.color], content on
  tertiary container [token:md.comp.list.reorder.list-item.label-text.color].
- The space left behind (drop zone): surface container low [token:md.comp.list.reorder.list-item.drop-zone.color].

Swipe to reveal:

- Primary action button: primary with an on primary icon
  [token:md.comp.list.reveal.list-item.action.icon-button.container.color].
- Other revealed buttons: secondary container with on secondary container icons
  [token:md.comp.list.reveal.list-item.icon-button.container.color].

State layers (on surface):

- Hovered: 8% [token:md.comp.list.list-item.hover.state-layer.opacity].
- Focused: 10% [token:md.comp.list.list-item.focus.state-layer.opacity].
- Pressed: 10% [token:md.comp.list.list-item.pressed.state-layer.opacity].
- Dragged: 16% [token:md.comp.list.list-item.dragged.state-layer.opacity].
- Disabled: text and icons at 38% [token:md.comp.list.list-item.disabled.label-text.opacity].
- Focus indicator: 3dp thick [token:md.comp.list.focus.indicator.thickness], drawn inside the item.

## Motion

- List motion tokens (duration, easing or spring): none in the token data [NOT FOUND].
- Compose animates list items from the motion scheme in code (ListItem.kt:1503 to 1505):
  - Shape morph and elevation: the fast spatial spring. Standard scheme damping 0.9, stiffness
    1400; expressive scheme damping 0.6, stiffness 800 [token:md.sys.motion.spring.fast.spatial.damping]
    [token:md.sys.motion.spring.fast.spatial.stiffness].
  - Color changes: the default effects spring, damping 1 and stiffness 1600
    [token:md.sys.motion.spring.default.effects.damping] [token:md.sys.motion.spring.default.effects.stiffness].
- Expanding an item to full screen uses the container transform pattern; the site gives no
  duration or spring for it.
- material-web and Flutter have no list motion values [NOT FOUND].

## Accessibility

- Assistive technology users must be able to reach and select any item.
- Selection must not depend on color alone. Add a second cue: a radio button or checkbox, a
  leading or trailing icon, or a non-color style.
- Feedback: tap shows a ripple, hover shows a hover state.
- Keyboard, single-action lists:
  - Tab enters the list on the first item, or on the selected item if there is one.
  - Arrow keys move between items and wrap at both ends.
  - Space or Enter activates the item.
- Keyboard, multi-action lists:
  - Tab lands on the first action of the item.
  - Down and Right go to the next action (or the first action of the next item); Up and Left go
    back (from an item's first action, to the last action of the previous item).
  - Space or Enter activates the focused action.
- Swipe actions need an alternative that is not a swipe: a visible more icon, single or double
  tap, long press.
- Slots: keep list structure and standard padding, give every target at least 48 × 48dp [site:/components/lists/specs],
  and do not add controls that make the item hard to traverse with a
  screen reader.
- Labels: an item's accessible name is its label plus supporting text. Roles differ by platform:
  - Web: the list container is a listbox whose label describes the kind of selection; items are
    options with a selected / not selected state.
  - Jetpack Compose: the role sits on the whole item, radio button for single-select and
    checkbox for multi-select, with a checked / not checked state.
  - Android Views: label and role go to the control inside the item, per that control's
    guidance.
  - Non-selectable lists read the label text without a role.

## Platform mapping

- Jetpack Compose (material3 1.5.0-rc01):
  - `ListItem` overloads for the expressive list: non-interactive, `onClick`, `selected` +
    `onClick`, and `checked` + `onCheckedChange`. The older overload whose first parameter is
    `headlineContent` is deprecated.
  - `SegmentedListItem` (same four forms, plus a `shapes` parameter) with
    `ListItemDefaults.segmentedShapes(index, count)`, `segmentedColors` and `SegmentedGap`.
  - `ListItemDefaults` also has `shapes()`, `colors()` and `Elevation`.
  - Dragged colors come from the reorder tokens (`ReorderListTokens`). No expand or
    swipe-to-reveal list composable exists in material3.
- Flutter (`material_ui` 1.11.0): `ListTile`, `CheckboxListTile`, `RadioListTile`,
  `SwitchListTile`, `ExpansionTile`, `ReorderableListView`. There is no segmented or expressive
  list API.
- Android Views (MDC-Android): baseline and expressive lists; the only platform with swipe to
  reveal. Our pinned checkout holds token resources only, so no class names are given here.
- Web: no maintained official component. The site links material-web's baseline list (that
  repository is in maintenance mode) and marks the expressive web list unavailable. Our CSS list
  is built in Phase 3 from the material-web token values above.

## Pitfalls

- Elements that change position from item to item, or visuals placed in the middle of a row.
- Mixing selection types in one item (a checkbox and a radio, or a switch plus a checkbox).
- Radio buttons in multi-select lists, or checkboxes in single-select ones.
- Selected state shown by color only.
- Swipe-only actions with no visible alternative.
- Dividers between every item of a segmented list; use the gap.
- Custom slots that break keyboard order or shrink targets below 48dp [site:/components/lists/specs].
- Over-long lines on wide windows.
