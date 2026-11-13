---
title: App bars
kind: component
pages: [/components/app-bars/overview, /components/app-bars/specs, /components/app-bars/guidelines, /components/app-bars/accessibility]
tokenSets: [app-bar, app-bar.small, app-bar.medium-flexible, app-bar.large-flexible, app-bar.search, app-bar.medium, app-bar.large]
expressive: true
fetched: 2026-11-13
---

## Summary

An app bar sits at the top of a screen. It names the current page and holds the controls for
moving around: a leading navigation button, a headline, and one or two page actions. Page-level
tool collections belong in a toolbar instead. M3 Expressive renamed "top app bar" to "app bar"
and settled on four variants: search, small, medium flexible and large flexible.

## Use it when

- A page needs a title, a way back or to the navigation menu, and at most two key actions.
- Pick the variant by how much the headline matters:
  - Search app bar: home pages of products where search is the main entry point.
  - Small: dense layouts, or the collapsed state of a bigger bar after scrolling.
  - Medium flexible: a larger headline that can shrink into a small bar on scroll.
  - Large flexible: the headline is the visual focus of the page.
- Keep actions contextual to the page. Global controls such as search or notifications are
  acceptable too.
- Avoid when:
  - The page has many actions. Put them in a toolbar rather than an overflow menu in the bar.
  - You would reach for the baseline medium or large app bar; they are no longer recommended.

## Anatomy

1. Container: full window width, square corners.
2. Leading button: navigation, usually a back arrow or a menu icon that opens a modal expanded
   navigation rail.
3. Headline: describes the page, the section or the product.
4. Subtitle (optional): extra context under the headline.
5. Trailing icon buttons: up to two actions; the search variant may add an avatar.

Search app bar parts: leading icon button (or a product logo), the search container with hint
text, and trailing icons or an avatar, which can sit inside or outside the search container.

Optional additions: an image or logo (it can replace the text in a small bar and sits above the
text in the taller bars), and one filled or tonal icon button, default or wide width, in place of
the trailing icons.

## Variants

- Search: a search field takes the place of the headline. Selecting it opens the search view.
- Small: a single row; the headline can be leading-aligned or centered.
- Medium flexible and large flexible: two rows, the headline under the action row. Text can be
  leading-aligned or centered and may wrap to two lines.
- Text alignment: leading edge is the default; centered is the other option. The old
  center-aligned app bar became the centered configuration of the small bar.
- Baseline (not recommended): medium and large. Replace them with the flexible versions, which
  look similar but are shorter, support multiple lines and accept images.
- Changes from M2 (these predate M3 Expressive): M2 raised the bar with elevation and a shadow when content scrolled under it.
  M3 fills the container with a color instead and drops the shadow. M3 also uses larger default
  text and a smaller default height.

## Expressive

- Added in the May 2025 Expressive update: the search app bar, the medium flexible and large
  flexible bars, a centered-text option for the small bar, and subtitles.
- The flexible bars are shorter overall than the baseline bars, use bigger headline text, wrap
  long headlines, and grow to hug their content, so a subtitle makes them taller.
- The flexible bars accept images and filled icon buttons as elements.
- Colors were remapped to work with dynamic color.

## States and behavior

- Flat state: the container has the background color. On scroll it fills with a contrasting
  color to separate itself from the content.
- Alternative: keep the container transparent on scroll so the buttons float over the content.
  Then give every icon button a filled container; narrow icon buttons keep Back compact.
- The bar can stay pinned, or hide while scrolling up and come back when scrolling down.
- Medium flexible and large flexible bars can compress into a small bar on scroll and stay small
  until the page returns to the top. Never turn a bar into a search app bar on scroll.
- Selecting the search field of a search app bar opens the search view.
- Resizing: the container always spans 100% of the window width [site:/components/app-bars/guidelines].
  On narrow windows trailing actions may collapse into an
  overflow menu and come back when space allows.
- The search container fills the free space between leading and trailing elements until it
  reaches 312dp [site:/components/app-bars/guidelines]; past that it takes 50% of the free space
  [site:/components/app-bars/guidelines].
- Up to two trailing icons next to an avatar on mobile; on large screens up to four.
- The layout mirrors in right-to-left languages.

## Measurements

The values are material-web's (canonical). No token cited below differs on another platform; the
linter checks this, and a difference would need a `[differs:]` marker.

| | Search | Small | Medium flexible | Large flexible |
|---|---|---|---|---|
| Container height | [NOT FOUND] | 64dp [token:md.comp.app-bar.small.container.height] | 112dp [token:md.comp.app-bar.medium-flexible.container.height] | 120dp [token:md.comp.app-bar.large-flexible.container.height] |
| Height with subtitle | not applicable | [NOT FOUND] | 136dp [token:md.comp.app-bar.medium-flexible.with-subtitle.container.height] | 152dp [token:md.comp.app-bar.large-flexible.with-subtitle.container.height] |
| Search container height | 56dp [token:md.comp.app-bar.small.search.container.height] | not applicable | not applicable | not applicable |

- No token gives the search app bar's own container height, or a small bar's height with a
  subtitle [NOT FOUND].
- Common to all variants:
  - Leading padding 4dp [token:md.comp.app-bar.leading-space] and trailing padding 4dp
    [token:md.comp.app-bar.trailing-space].
  - Icon size 24dp [token:md.comp.app-bar.icon.size]; avatar 32dp [token:md.comp.app-bar.avatar.size].
  - Gap between icon buttons 0dp [token:md.comp.app-bar.icon-button-space].
  - Container corners: none [token:md.comp.app-bar.container.shape].
- Search app bar: the search container is fully rounded
  [token:md.comp.app-bar.small.search.container.shape]. Its inner padding:
  - leading side 8dp [token:md.comp.app-bar.search.leading-space];
  - trailing side 8dp [token:md.comp.app-bar.search.trailing-space].
- Baseline bars (not recommended):
  - Medium height 112dp [site:/components/app-bars/specs] [token:md.comp.app-bar.medium.container.height].
  - Large height 152dp [token:md.comp.app-bar.large.container.height].
  - Icon buttons 24dp [site:/components/app-bars/specs] [token:md.comp.app-bar.medium.icon.size].
- Compose has no `with-subtitle` token ids. It reads the subtitle heights from its own flexible
  token sets:
  - medium flexible 136dp [token:md.comp.app-bar-medium-flexible.large-container-height];
  - large flexible 152dp [token:md.comp.app-bar-large-flexible.large-container-height].

## Typography

| Variant | Headline | Subtitle |
|---|---|---|
| Search | body large (hint text) [token:md.comp.app-bar.small.search.label-text.font] | none |
| Small | title large [token:md.comp.app-bar.small.title.font] | label medium [token:md.comp.app-bar.small.subtitle.font] |
| Medium flexible | headline medium [token:md.comp.app-bar.medium-flexible.title.font] | label large [token:md.comp.app-bar.medium-flexible.subtitle.font] |
| Large flexible | display small [token:md.comp.app-bar.large-flexible.title.font] | title medium [token:md.comp.app-bar.large-flexible.subtitle.font] |
| Medium (baseline) | headline small [token:md.comp.app-bar.medium.title.font] | none |
| Large (baseline) | headline medium [token:md.comp.app-bar.large.title.font] | none |

- These font tokens come from Flutter and Compose. material-web's app-bar set defines no title or
  subtitle font token [NOT FOUND]; its older `top-app-bar` set gives the baseline styles.
- The search hint style exists only in Flutter's data; Compose's app-bar set has no search font
  token [NOT FOUND].
- Do not resize the headline or the subtitle. Never truncate the headline; switch to a flexible
  bar and wrap to at most two lines. Do not wrap text in a small bar.

## Color roles and state layers

- Container: surface [token:md.comp.app-bar.container.color]; on scroll, surface container
  [token:md.comp.app-bar.on-scroll.container.color].
- Headline: on surface [token:md.comp.app-bar.title.color]. Subtitle: on surface variant
  [token:md.comp.app-bar.subtitle.color].
- Leading icon: on surface [token:md.comp.app-bar.leading-icon.color]. Trailing icons: on surface
  variant [token:md.comp.app-bar.trailing-icon.color].
- Search app bar: search container surface container [token:md.comp.app-bar.search.container.color],
  surface container highest on scroll [token:md.comp.app-bar.search.on-scroll.container.color];
  hint text on surface variant [token:md.comp.app-bar.search.label.color].
- On a darker background the search container may use surface bright. Any alternative pair must
  keep at least 3:1 contrast between text and container.
- The container has no elevation when flat [token:md.comp.app-bar.container.elevation]; the
  scrolled color fill replaces a shadow.
- State layers belong to the icon buttons inside the bar; see icon-button guidance. The app bar
  itself defines no state-layer opacity [NOT FOUND].

## Motion

- No app-bar duration, easing or spring token exists [NOT FOUND]. The site describes the
  compress-on-scroll transition but names no motion value.
- Compose: the bars snap between expanded and collapsed with `TopAppBarDefaults.snapAnimationSpec`,
  the default effects spring of the motion scheme
  [impl:compose-material3/commonMain/androidx/compose/material3/AppBar.kt:1540].
- Flutter: `SliverAppBar.medium` and `.large` fade the collapsed title in with a
  `Cubic(0.2, 0.0, 0.0, 1.0)` curve over
  500ms [impl:material_ui/packages/material_ui/lib/src/app_bar.dart:1381].
  A floating bar with `snap` settles with `Curves.easeOut` over
  200ms [impl:material_ui/packages/material_ui/lib/src/app_bar.dart:2059].

## Accessibility

- Assistive technology users must be able to tell which page they are on, act or move to another
  destination, and still reach the bar's actions after scrolling.
- Initial focus goes to the leading button, the first interactive element.
- Keyboard: Tab moves between interactive elements; Space or Enter activates the focused one.
- Interactive elements show focus rings, hover states, and a ripple on tap or click.
- The headline's accessible label repeats its visible text, with extra context when the visible
  text alone does not identify the page. Screen readers read the text and then the role.
- Label each icon button by the action it performs (for example "View on map").
- Search app bar: keep the default roles where possible (surface container for the field, on
  surface variant for the hint). Any custom pair needs at least 3:1 contrast.

## Platform mapping

- Jetpack Compose (material3 1.5.0-rc01):
  - `TopAppBar` (with optional `subtitle` and `titleHorizontalAlignment`) and
    `CenterAlignedTopAppBar` for the small bar.
  - `MediumFlexibleTopAppBar`, `LargeFlexibleTopAppBar`; baseline `MediumTopAppBar`,
    `LargeTopAppBar`; the general `TwoRowsTopAppBar`.
  - `AppBarWithSearch` for the search app bar (marked `@ExperimentalMaterial3Api`; it replaces
    the deprecated `TopSearchBar`).
  - Scroll behaviors: `TopAppBarDefaults.pinnedScrollBehavior`, `enterAlwaysScrollBehavior`,
    `exitUntilCollapsedScrollBehavior`.
- Flutter (`material_ui` 1.11.0): `AppBar` (with `centerTitle` and `scrolledUnderElevation`) and
  `SliverAppBar`, `SliverAppBar.medium`, `SliverAppBar.large` (the baseline sizes).
  - There is no flexible app bar, no subtitle slot and no search app bar widget. A search field can
    be placed with `SearchAnchor.bar`. We supply the flexible and search bars in Phase 3.
- Web: no maintained official component. Our CSS app bar is built in Phase 3 from the material-web
  token values above.

## Pitfalls

- More than two trailing actions, or an overflow menu holding page actions that belong in a
  toolbar.
- Several filled or tonal icon buttons. Use at most one, and then only one icon button in total.
- Rounded container corners: they suggest the bar can expand.
- Making the bar shorter than its default height, or narrower than the window.
- Truncated headlines, or wrapped headlines in a small bar.
- Using a logo to open an expanded navigation rail.
- Three icons plus an avatar in a mobile search app bar.
- Search hint text without the word "Search".
- Transparent scrolled bars whose icon buttons have no container fill.
