---
title: Carousel
kind: component
pages: [/components/carousel/overview, /components/carousel/specs, /components/carousel/guidelines, /components/carousel/accessibility, /blog/material-3-carousel-research-design]
tokenSets: [carousel-item]
expressive: false
fetched: 2026-11-13
---

## Summary

A carousel is a scrollable row of mostly visual items (photos, video, posters) with optional short
text. Items are not one fixed width: they grow and shrink as they travel through the layout, and
their content moves with a parallax offset while scrolling. The component is new in M3 (first
shipped in 2023); a multi-aspect-ratio uncontained layout was added in November 2025.

## Use it when

- People browse a set of visual items and want to see several at once, or step through large
  featured items one by one.
- Layout chooser:
  - Multi-browse: many visual items at once (photo grids, event feeds). Not for text-heavy items
    or busy imagery.
  - Uncontained: traditional carousel with one item size; items run past the screen edge. Best
    for custom or text-heavy items, or text stacked above or below the visual.
  - Uncontained multi-aspect ratio: like uncontained, but items keep their own widths (from 9:16
    up to 16:9). Use only when items really vary in width.
  - Hero: one large item in focus with a preview of the next. For movies, shows, featured apps.
  - Center-aligned hero: the large item is centered with a preview on each side.
  - Full-screen: one edge-to-edge item, scrolled vertically, for immersive feeds. Portrait only,
    on compact and medium windows.
- Avoid when:
  - Items need a lot of text; use the uncontained layout or a set of cards.
  - **Our practice:** when every item must be visible at once for comparison, a list or grid is
    clearer.

## Anatomy

1. Container. A plain rectangle that holds the items and can be stretched to any size.
2. Large item. Its maximum width can be set; that width decides how the other sizes fit.
3. Medium item. Width adapts to the space left over.
4. Small item. A narrow preview that signals more content.
5. Item text (optional). Short labels inside the item that shorten or hide as the item shrinks
   (full title on large items, title hidden on medium items, abbreviated label on small ones).

## Variants

- Six layouts (see "Use it when"): the browsing family (multi-browse), the fixed-size family
  (uncontained, plus its multi-aspect-ratio form), the spotlight family (hero, centered hero) and
  full-screen.
- Alignment: start-aligned or centered. Center-aligned hero is the usual centered layout.
- Scrolling:
  - Default (free) scrolling: items can stop anywhere. Use it only for uncontained layouts.
  - Snap scrolling: on release, items settle back into the layout grid. Use it for multi-browse,
    hero and full-screen; full-screen must snap.
- Item counts by window size:
  - Compact windows show up to three items comfortably; with text, keep to three.
  - Larger windows add and enlarge items.
  - Full-screen always shows exactly one item.
  - Multi-browse shows at least one large, one medium and one small item. Hero shows at least one
    large and one small; center-aligned hero adds a second small item.

## Expressive

Not covered by the sources. The carousel pages describe no M3 Expressive change; the only recent
update is the uncontained multi-aspect ratio layout (November 2025).

## States and behavior

- Items have enabled, hovered, focused, pressed and disabled states. Tapping gives a ripple and a
  slight shape change.
- Items in every layout except uncontained must stay fully on screen; size changes and snapping
  keep the layout stable while scrolling.
- Hover raises an item to elevation level 1 [token:md.comp.carousel-item.hover.container.elevation];
  it rests at level 0.
- Disabled items are drawn at 38% opacity [token:md.comp.carousel-item.disabled.container.opacity].
- Background from the research blog (May 2023), summarized:
  - A team study with over 200 participants compared five carousel designs, quantitatively and
    then qualitatively.
  - People understood how to scroll every design and found them similarly usable.
  - A partly visible, squeezed item clearly signalled that more content follows.
  - For carousels that move several items at a time, people expected roughly ten items. They were
    less sure about the count in vertical and single-large-item (hero) designs.
  - The right layout depended on two things: whether the task is a deep browse or a quick pick,
    and how big a commitment the chosen item is (picking a two-hour movie calls for slower,
    one-at-a-time browsing).

## Measurements

The tables are the site's spec tables; the item corner also has a token.

| | Multi-browse | Uncontained | Hero / center-aligned hero | Full-screen |
|---|---|---|---|---|
| Leading / trailing padding | 16dp [site:/components/carousel/specs] | 16dp leading only [site:/components/carousel/specs] | 16dp [site:/components/carousel/specs] | 0dp [site:/components/carousel/specs] |
| Top / bottom padding | 8dp [site:/components/carousel/specs] | 8dp [site:/components/carousel/specs] | 8dp [site:/components/carousel/specs] | 0dp [site:/components/carousel/specs] |
| Space between items | 8dp [site:/components/carousel/specs] | 8dp [site:/components/carousel/specs] | 8dp [site:/components/carousel/specs] | 16dp [site:/components/carousel/specs] |
| Item corner radius | 28dp [site:/components/carousel/specs] [token:md.comp.carousel-item.container.shape] | 28dp [site:/components/carousel/specs] [token:md.comp.carousel-item.container.shape] | 28dp [site:/components/carousel/specs] [token:md.comp.carousel-item.container.shape] | [NOT FOUND] |
| Vertical alignment | Centered | Centered | Centered | Centered |

- Small items: minimum width 40dp [site:/components/carousel/specs], maximum width 56dp
  [site:/components/carousel/specs]. Compose ships these bounds as its defaults:
  `CarouselDefaults.MinSmallItemSize` 40dp [impl:compose-material3/commonMain/androidx/compose/material3/carousel/Carousel.kt:813]
  and `MaxSmallItemSize` 56dp [impl:compose-material3/commonMain/androidx/compose/material3/carousel/Carousel.kt:816].
- Large items: dynamic, or a width the designer sets. Medium items: dynamic.
- Uncontained items bleed over the side padding while scrolling. The multi-aspect ratio version
  has only leading padding and 8dp between items [site:/components/carousel/specs].
- Show-all affordance (see Accessibility): button padding 4dp [site:/components/carousel/accessibility];
  header arrow icon button 48dp [site:/components/carousel/accessibility].
- Flutter's `CarouselView` defaults:
  - Item padding on every side: 4dp [impl:material_ui/packages/material_ui/lib/src/carousel.dart:632].
  - Item corner: 28dp [impl:material_ui/packages/material_ui/lib/src/carousel.dart:639].

## Typography

- The carousel-item token set defines no text style [NOT FOUND].
- Keep item text short. On compact windows, avoid more than two lines unless the background
  behind the text is simple (a flat color, for example).

## Color roles and state layers

- Item container: surface [token:md.comp.carousel-item.container.color]; the visual normally
  covers it.
- Optional outline: outline [token:md.comp.carousel-item.with-outline.outline.color]; on surface
  when focused.
  - Width: 1dp [token:md.comp.carousel-item.with-outline.outline.width].
- Focus indicator: secondary [token:md.comp.carousel-item.focus.indicator.color].
  - Thickness: 3dp [token:md.comp.carousel-item.focus.indicator.thickness].
- State layers (on surface):
  - Hovered: 8% [token:md.comp.carousel-item.hover.state-layer.opacity].
  - Focused: 10% [token:md.comp.carousel-item.focus.state-layer.opacity].
  - Pressed: 10% [token:md.comp.carousel-item.pressed.state-layer.opacity].

## Motion

- Carousel motion tokens (duration, easing or spring): none in the token data [NOT FOUND].
- Item width changes and the parallax shift are driven by scroll position, not by a timed
  animation.
- Compose snaps with a spring of medium-low stiffness in both `CarouselDefaults.singleAdvanceFlingBehavior`
  and `multiBrowseFlingBehavior` (Carousel.kt:739 and Carousel.kt:772); it is a Compose default, not a
  token.
- Reduced motion: remove the parallax, stop items from growing as they enter, and show all items
  at one size. Let the reduced-motion carousel reach the window edges so visuals are not clipped;
  in a hero layout the small item is then only partly visible.

## Accessibility

- Required abilities: reach the carousel, move between items, activate an item, and skip past
  the carousel.
- On vertically scrolling pages, people must be able to see every item without horizontal
  scrolling (full-screen carousels are exempt):
  - Without a header: a Show all button below the carousel that opens a vertical page of all
    items.
  - With a header: an arrow icon button next to the header (start-aligned) that opens the same
    page, which repeats the header.
  - If neither fits, put a Show all control in nearby navigation or add controls close to the
    carousel. Never overlay buttons on the carousel or place them beside it; put them above or
    below.
- Focus: Tab lands on the first item, not on the container. Tab or arrow keys move between items;
  Up and Down leave the carousel (for example to the Show all button). Space or Enter activates.
- Semantics: the container has a container role and a label. Each item announces its position
  and the total count.

## Platform mapping

- Jetpack Compose (material3 1.5.0-rc01): `HorizontalMultiBrowseCarousel`,
  `HorizontalUncontainedCarousel`, `HorizontalCenteredHeroCarousel`, with `rememberCarouselState`
  and `CarouselDefaults`.
  - Items get `Modifier.maskClip` and `Modifier.maskBorder` through `CarouselItemScope`.
  - `Modifier.carouselParallaxScrollEffect` is marked `@ExperimentalMaterial3Api`.
  - There is no full-screen or vertical carousel composable, and no multi-aspect-ratio layout.
  - The carousel-item tokens are NOT FOUND in Compose's token set.
- Flutter (`material_ui` 1.11.0): `CarouselView` (uncontained) and `CarouselView.weighted`
  (multi-browse, hero, center-aligned hero and full-screen via `flexWeights`), plus the
  `.builder` and `.weightedBuilder` constructors and `CarouselController`. Snapping is off by
  default (`itemSnapping`).
- Android Views (MDC-Android) also ships a carousel; the 2023 blog announced multi-browse there
  first. Our pinned MDC-Android checkout holds token resources only, so no class names are given
  here.
- Web: no maintained official component. Our CSS carousel is built in Phase 3 from the
  material-web token values above.

## Pitfalls

- Large items so narrow that images can no longer be recognized.
- Default (free) scrolling on multi-browse, hero or full-screen layouts.
- Long text inside items, or more than three text-bearing items on a compact window.
- No Show all path on a vertically scrolling page.
- Arrow buttons drawn over or beside the carousel.
- Initial focus on the container instead of the first item.
- Keeping parallax and size animation when the user asked for reduced motion.
- Full-screen layout in landscape.
