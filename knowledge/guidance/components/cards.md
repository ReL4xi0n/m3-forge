---
title: Cards
kind: component
pages: [/components/cards/overview, /components/cards/specs, /components/cards/guidelines, /components/cards/accessibility]
tokenSets: [elevated-card, filled-card, outlined-card]
expressive: false
fetched: 2026-11-13
---

## Summary

A card is a container for content and actions about one subject: an album, a trip, a product. Its
size comes from what it holds. M3 has three card styles (elevated, filled, outlined) that differ
only in how they separate from the background; they offer the same features and legibility. Cards
have no M3 Expressive changes.

## Use it when

- Several pieces of content (media, a headline, some text, actions) belong to one topic and should
  read as a unit.
- The card is an entry point to more detail, for example opening a full screen about the item.
- Items are shown as a collection in a grid, a vertical list or a horizontal row / carousel.
- Avoid when:
  - Plain spacing, a headline or a divider would already make the grouping clear. Wrapping
    everything in cards adds visual weight without adding structure.
  - On compact windows a list would show the same items more densely; consider swapping.

## Anatomy

1. Container. The only required part; it carries the elevation and the shape.
2. Headline. Names the subject (album title, article name).
3. Subhead. Smaller secondary text such as a byline or a place.
4. Supporting text. Body content such as a summary.
5. Media. Thumbnail (avatar, logo), image, illustration or video.
6. Actions. Buttons, icon buttons, chips, sliders, checkboxes, links in the text, or an overflow
   menu, usually in the top or bottom trailing corner.
7. Dividers (optional). Full width to mark a region that expands, inset to separate related
   content inside the card.

Content is arranged in blocks with a clear hierarchy. Text or icons placed over an image need a
scrim or a backing shape so they keep accessible contrast.

## Variants

- Elevated: surface container low with a shadow (elevation level 1). More separation than filled,
  less than outlined.
- Filled: surface container highest, no shadow. The quietest separation.
- Outlined: surface with an outline-variant border. The strongest boundary of the three.
- Choose by style only. The three are functionally equivalent.

## Expressive

Not covered by the sources. The cards pages describe no M3 Expressive changes. The overview's
"differences from M2" list mentions new color mappings with dynamic color support, a lower default
elevation without a default shadow, and the three official variants.

## States and behavior

- Two interaction models; do not mix them:
  - Directly actionable card: the whole card is one target (button or link). It has hover,
    focus, pressed and dragged states and shows a ripple. It must not also contain buttons.
  - Non-actionable card: a plain container whose buttons and links are the targets. It has no
    hover state and no ripple.
- Elevation per state, per variant (token levels):
  - Elevated: rests at level 1, level 2 on hover, level 4 while dragged
    [token:md.comp.elevated-card.container.elevation] [token:md.comp.elevated-card.hover.container.elevation]
    [token:md.comp.elevated-card.dragged.container.elevation].
  - Filled and outlined: rest at level 0, level 1 on hover, level 3 while dragged
    [token:md.comp.filled-card.hover.container.elevation] [token:md.comp.outlined-card.dragged.container.elevation].
- Disabled:
  - Elevated and filled containers: 38% opacity [token:md.comp.elevated-card.disabled.container.opacity].
  - Outlined border: 12% opacity [token:md.comp.outlined-card.disabled.outline.opacity].
- Collections: cards in a collection share one resting elevation (they sit on the same plane)
  until one is picked up. A picked-up card rises above everything except app bars and navigation,
  and it does not push other elements aside.
- Swipe: one swipe action per card (dismiss, or change state such as archive). Do not put
  swipeable content (image carousel, paging) inside a swipeable card, and do not let parts of the
  card come loose during the swipe.
- Filtering and sorting controls live outside the collection and apply to every card.
- Overflowing content:
  - On mobile, content taller than the card is truncated; the card can expand to show it, and
    the expanded card scrolls with the screen. The card itself never scrolls internally (two
    scroll bars).
  - On desktop, content inside a card may expand and scroll.
- Adaptive layout: cards can change orientation (horizontal on compact, vertical on expanded),
  realign, or move into multi-column grids and horizontal rows on large screens.

## Measurements

| Property | Value |
|---|---|
| Corner radius | 12dp [site:/components/cards/specs] [token:md.comp.elevated-card.container.shape] |
| Start and end padding | 16dp [site:/components/cards/specs] |
| Space between cards | 8dp at most [site:/components/cards/specs] |
| Icon size | 24dp [token:md.comp.elevated-card.icon.size] |
| Outline width (outlined) | 1dp [token:md.comp.outlined-card.outline.width] |
| Text alignment | Start-aligned |

- All three variants use the medium corner shape, 12dp [token:md.comp.filled-card.container.shape]
  [token:md.comp.outlined-card.container.shape].
- Width and height are set by content. The cards pages give no fixed size or minimum height
  [NOT FOUND].
- Flutter's `Card` has a default outer margin of 4dp [impl:material_ui/packages/material_ui/lib/src/generated/card_defaults_m3.g.dart:12]
  on every side. It is a Flutter default, not a spec value.

## Typography

- The card token sets define no headline, subhead or supporting-text type style [NOT FOUND].
- The type styles of headline, subhead and body text are left to the layout. Use the type scale
  for the hierarchy the content needs.

## Color roles and state layers

Container / border:

- Elevated: surface container low [token:md.comp.elevated-card.container.color], shadow color
  shadow.
- Filled: surface container highest [token:md.comp.filled-card.container.color].
- Outlined: surface [token:md.comp.outlined-card.container.color] with an outline variant border
  [token:md.comp.outlined-card.outline.color]. The border turns on surface when focused
  [token:md.comp.outlined-card.focus.outline.color].
- Icons default to primary [token:md.comp.elevated-card.icon.color].
- The focus indicator uses secondary [token:md.comp.elevated-card.focus.indicator.color].

State layers (on surface, over the container) for directly actionable cards:

- Hovered: 8% [token:md.comp.elevated-card.hover.state-layer.opacity].
- Focused: 10% [token:md.comp.elevated-card.focus.state-layer.opacity].
- Pressed: 10% [token:md.comp.elevated-card.pressed.state-layer.opacity].
- Dragged: 16% [token:md.comp.elevated-card.dragged.state-layer.opacity].

Platform difference:

- Disabled filled container [token:md.comp.filled-card.disabled.container.color]
  [differs:md.comp.filled-card.disabled.container.color]: material-web and Compose use surface
  variant; Flutter's data uses on surface. Either color is then drawn at reduced opacity,
  38% [token:md.comp.filled-card.disabled.container.opacity].

## Motion

- Card motion tokens: none in any card token set [NOT FOUND].
- Expanding a card into a full-screen detail view uses the container transform pattern; keep it
  for expressive hero moments. Moving between levels of a hierarchy can use the simpler forward /
  backward transition. The cards pages name the patterns, not durations or springs.
- Compose animates card elevation changes with tweens from its shared elevation helper:
  - Into hover, focus, press or drag: 120ms [impl:compose-material3/commonMain/androidx/compose/material3/internal/Elevation.kt:109].
  - Out of press, focus or drag: 150ms [impl:compose-material3/commonMain/androidx/compose/material3/internal/Elevation.kt:111].
  - Out of hover: 120ms [impl:compose-material3/commonMain/androidx/compose/material3/internal/Elevation.kt:113].

## Accessibility

- Never stack actions: an actionable card holds no buttons, and a card with buttons is not itself
  actionable.
- Focus order:
  - A directly actionable card is one tab stop.
  - A non-actionable card is not a tab stop. Each control inside it is, and all of them are
    visited before focus moves to the next card.
- Keys: Tab moves to the next actionable element; Space or Enter performs the action or opens a
  secondary menu. Inside that menu, arrows move, Space or Enter picks, Tab leaves.
- Roles: an actionable card takes the button or link role, depending on what it does. A
  non-actionable card needs no role; its contents are read in order (for example headline, image,
  body, primary button, secondary button).
- Hide purely decorative images from screen readers.
- Drag and swipe need a single-pointer alternative, for example a menu (opened by tap or long
  press) with move and delete options. Avoid menus on top of a card while it is being dragged; if
  unavoidable, keep them from covering the card.

## Platform mapping

- Jetpack Compose (material3 1.5.0-rc01): `Card` (filled styling by default), `ElevatedCard`,
  `OutlinedCard`, each with a non-clickable and an `onClick` overload. Defaults live in
  `CardDefaults` (`cardColors`, `elevatedCardColors`, `outlinedCardColors`, `cardElevation`,
  `elevatedCardElevation`, `outlinedCardElevation`, `outlinedCardBorder`, `shape`).
  - Compose has no card state-layer tokens; those ids show as NOT FOUND for Compose.
- Flutter (`material_ui` 1.11.0): `Card` (elevated), `Card.filled`, `Card.outlined`. `Card` is
  not interactive by itself; wrap the content in an `InkWell` for a directly actionable card.
- Web: no maintained official component (the overview lists web as unavailable). Our CSS card is
  built in Phase 3 from the material-web token values above.

## Pitfalls

- Buttons inside a card that is itself clickable.
- Choosing the elevated card for emphasis. The three styles are equal in function; the shadow is
  only about separation.
- Cards with different resting elevations in one collection.
- Scrolling inside a card on mobile.
- Several swipe actions on one card, or swipeable content inside a swipeable card.
- Text on images without a scrim or backing shape.
- Forcing content into cards when spacing or dividers would do.
