---
title: Search
kind: component
pages: [/components/search/overview, /components/search/specs, /components/search/guidelines, /components/search/accessibility]
tokenSets: [search-bar, search-bar.contained, search-view, search-view.contained]
expressive: true
fetched: 2026-11-13
---

## Summary

Search lets people find content by typing a query. It has two parts: the search bar, a rounded
field with a leading icon, hint text and optional trailing icons or an avatar; and focused
search (the former "search view"), the surface that opens on selection and lists suggestions or
results. The M3 Expressive update (February 2025) merged the two names into "search" and added the
contained style, which keeps the bar's filled, rounded shape when it opens.

## Use it when

- The product holds many items to sift through (files, messages, mail).
- Pick the entry point by how central search is:
  - Search bar: searching the contents of one view, placed under the title.
  - Search app bar: search is the main, global function (see app-bars.md#variants).
  - Search icon button: search is secondary.
- Focused search can be its own destination, reached from a navigation bar, when search is the
  primary action.
- Avoid when:
  - Search is a secondary action; a search icon button is enough, without a persistent bar.

## Anatomy

1. Search bar container.
2. Leading icon: a navigation icon button (menu, back) or a decorative search icon.
3. Hint (supporting) text, replaced by the query as soon as typing starts.
4. Trailing icon buttons or avatar (optional).
5. Input text.
6. Container for suggestions or results: empty by default and filled with list items.

In the divided style a divider separates the bar from the results.

## Variants

- Style:
  - Contained (recommended): a persistent filled container separates the bar from the list of
    suggestions or results, with the latest motion and rounded shape.
  - Divided (baseline, not recommended): a divider separates them, without the newer visuals,
    motion or flexibility.
- Layout of focused search:
  - Full-screen: fills the window; the default for compact windows.
  - Docked: a list opens under the bar and a scrim covers the content; best for medium and
    expanded windows.
- Trailing configurations: an avatar, one icon button, two icon buttons, or an icon button plus
  an avatar.

## Expressive

- February 2025 update: "search bar" and "search view" are now just "search"; the contained style
  arrived; gaps can split results into groups; and the bar grows wider when focused (its outer
  margin shrinks).
- Changes from M2: the old "open search bar" was square and elevated. M3 search is rounded, uses a
  tonal surface, supports dynamic color, and has lower elevation with no shadow by default.

## States and behavior

- Search bar states: enabled, hovered, focused, pressed. Once focused, each element inside keeps
  its own states.
- Selecting the bar (or a search icon) opens focused search, which may:
  - show history or suggestions before typing;
  - update suggestions or results while typing;
  - wait until a query is submitted.
- A search runs when the person presses Enter or picks a suggestion or result directly.
- Results scroll underneath the bar. After a query the input stays visible but loses focus.
- Show a clear status that results are displayed, for example a search icon or a "Results" label.
- The back icon releases focus, dismisses the list and restores the bar. An optional clear icon
  empties the input.
- Contained style: the bar keeps the same shape when focused; do not change that behaviour. Its
  side margin shrinks from 24dp [site:/components/search/specs] to 12dp [site:/components/search/specs].
- Results can be grouped with gaps, enriched with leading icons, category labels (Recent,
  Contacts), avatars, or filter chips.
- Scrolling: the bar can scroll away and return when scrolling back, or stay fixed at the top.
- Layout: the bar stays inside its pane and stretches with it; inner elements anchor to its two
  ends. Switch from full-screen in compact windows to docked in larger ones.
- Predictive back (Android): the full-screen surface pulls away from the edge and shrinks toward
  the gesture, revealing the previous screen.

## Measurements

The values are material-web's (canonical). No token cited below differs on another platform; the
linter checks this, and a difference would need a `[differs:]` marker.

Search bar (unfocused):

| Part | Value |
|---|---|
| Height | 56dp [site:/components/search/specs] [token:md.comp.search-bar.container.height] |
| Width | 360dp minimum [site:/components/search/specs], 720dp maximum [site:/components/search/specs] |
| Outer margin, contained, unfocused | 24dp [site:/components/search/specs] [token:md.comp.search-bar.contained.leading-margin] |
| Outer margin, contained, focused | 12dp [site:/components/search/specs] [token:md.comp.search-view.contained.leading-margin] |
| Inner padding, contained (beside icon buttons) | 4dp [token:md.comp.search-bar.contained.leading-space] |
| Inner padding, contained, no actions | 16dp [token:md.comp.search-bar.contained.no-actions.leading-space] |
| Icon tap target to label | 4dp [site:/components/search/specs] [token:md.comp.search-bar.contained.icon-label.gap] |
| Gap between trailing actions | 0dp [token:md.comp.search-bar.contained.trailing-actions.gap] |
| Icon size | 24dp [token:md.comp.search-bar.icon.size] |
| Avatar | 30dp [site:/components/search/specs] [token:md.comp.search-bar.avatar.size], target 48dp [token:md.comp.search-bar.contained.avatar.target-size] |
| Corners | fully rounded [token:md.comp.search-bar.container.shape] |

- Divided (baseline) bar: 16dp [token:md.comp.search-bar.leading-space] side padding and
  16dp [token:md.comp.search-bar.leading-icon.leading-icon-label-space] between icon and label.

Focused search:

| Part | Contained | Divided |
|---|---|---|
| Full-screen container | full width and height | full width and height, square corners [token:md.comp.search-view.full-screen.container.shape] |
| Full-screen header height | 56dp bar [token:md.comp.search-view.contained.full-screen.bar.container.height] | 72dp [token:md.comp.search-view.full-screen.header.container.height] |
| Docked header height | not given [NOT FOUND] | 56dp [token:md.comp.search-view.docked.header.container.height] |
| Docked results height | 240dp minimum [site:/components/search/specs], at most two thirds of the screen | [NOT FOUND] |
| Docked bar-to-results gap | 2dp [token:md.comp.search-view.contained.docked.bar-results.gap] | divider |
| Docked corners | bar fully rounded [token:md.comp.search-view.contained.docked.bar.shape], results 12dp [token:md.comp.search-view.contained.docked.results.shape] | 28dp [token:md.comp.search-view.docked.container.shape] |

- The specs page also prints a 16dp [site:/components/search/specs] value for the docked contained
  container; the text does not say which edge it measures.
- Flutter's `SearchBar` default constraints allow up to 800 logical pixels of width
  [impl:material_ui/packages/material_ui/lib/src/generated/search_bar_defaults_m3.g.dart:68],
  wider than the site's maximum.

## Typography

- Hint (supporting) text: body large [token:md.comp.search-bar.supporting-text.font].
- Input text: body large [token:md.comp.search-bar.input-text.font].
- Focused search header input and hint: body large [token:md.comp.search-view.header.input-text.font]
  [token:md.comp.search-view.header.supporting-text.font].
- Flutter keeps these styles under `.type` ids [token:md.comp.search-bar.input-text.type].
- Hint text describes what can be searched ("Search your messages", "Search replies").
- Results use the list component's type styles.

## Color roles and state layers

- Search bar container: surface container high [token:md.comp.search-bar.container.color]. It
  contrasts with white or tonal backgrounds. On a surface container background it blends in; keep
  the two roles more than one step apart.
- Leading icon and input text: on surface [token:md.comp.search-bar.leading-icon.color]
  [token:md.comp.search-bar.input-text.color]. Hint text and trailing icons: on surface variant
  [token:md.comp.search-bar.supporting-text.color] [token:md.comp.search-bar.trailing-icon.color].
- Focused search container: surface container high [token:md.comp.search-view.container.color]; the
  contained full-screen background behind it is surface container low
  [token:md.comp.search-view.contained.background.color].
- Divider (divided style): outline [token:md.comp.search-view.divider.color].
- State layers on the bar, in on surface [token:md.comp.search-bar.hover.state-layer.color]:
  - hovered 8% [token:md.comp.search-bar.hover.state-layer.opacity];
  - pressed 10% [token:md.comp.search-bar.pressed.state-layer.opacity].
- Focus ring: secondary [token:md.comp.search-bar.focus.indicator.color].
- Elevation tokens say level 3 [token:md.comp.search-bar.container.elevation], while the site says
  search has no shadow by default; Compose's `SearchBarDefaults` sets tonal and shadow elevation to
  level 0.

## Motion

- Contained search bar spring: the fast spatial spring
  [token:md.comp.search-bar.contained.motion.spring] (material-web only). Standard scheme damping
  0.9, stiffness 1400 [token:md.sys.motion.spring.fast.spatial.damping]
  [token:md.sys.motion.spring.fast.spatial.stiffness]; expressive scheme damping 0.6, stiffness 800.
- Compose:
  - `rememberSearchBarState` expands with the slow spatial spring and collapses with the default
    spatial spring [impl:compose-material3/commonMain/androidx/compose/material3/SearchBar.kt:1640].
  - `rememberContainedSearchBarState` uses the fast spatial spring both ways
    [impl:compose-material3/commonMain/androidx/compose/material3/SearchBar.kt:1676].
  - `rememberSearchBarWithGapState` expands with default spatial and collapses with fast spatial
    [impl:compose-material3/commonMain/androidx/compose/material3/SearchBar.kt:1720].
  - The file also keeps tween specs: enter over duration long 4,
    600ms [token:md.sys.motion.duration.long4] [impl:compose-material3/commonMain/androidx/compose/material3/SearchBar.kt:4195],
    with emphasized decelerate easing; exit over duration medium 3,
    350ms [token:md.sys.motion.duration.medium3] [impl:compose-material3/commonMain/androidx/compose/material3/SearchBar.kt:4196].
- Flutter: `SearchAnchor` opens its view over
  600ms [impl:material_ui/packages/material_ui/lib/src/search_anchor.dart:41] with
  `Curves.easeInOutCubicEmphasized` [impl:material_ui/packages/material_ui/lib/src/search_anchor.dart:909].

## Accessibility

- Assistive technology users must be able to reach and focus the bar, hear the hint or label,
  type and submit a query, use the suggestion and result list, and clear the input.
- Screen readers must announce when suggestions or results appear.
- Initial focus lands on the first interactive element: the leading icon button if there is one,
  otherwise the text field.
- Keyboard: Tab and Shift+Tab move between elements; Space or Enter puts the field into input
  mode; arrow keys move through results.
- The hint text is the bar's accessible label. Role: text field on Android, search field on iOS.
- Label icon buttons by their action. Suggestions and results are lists and follow the list
  accessibility guidance.
- Keep text and container contrast; avoid placing a surface container high bar on a surface
  container background.

## Platform mapping

- Jetpack Compose (material3 1.5.0-rc01):
  - Collapsed bar: `SearchBar` with `SearchBarState` (`rememberSearchBarState`,
    `rememberContainedSearchBarState`, `rememberSearchBarWithGapState`) and
    `SearchBarDefaults.InputField`.
  - Focused search: `ExpandedFullScreenContainedSearchBar` and `ExpandedDockedSearchBarWithGap`
    (contained style), `ExpandedFullScreenSearchBar` and `ExpandedDockedSearchBar` (divided style).
  - Search app bar: `AppBarWithSearch` (`@ExperimentalMaterial3Api`).
  - The older `SearchBar(inputField, expanded, …)` and `DockedSearchBar` overloads are deprecated.
- Flutter (`material_ui` 1.11.0): `SearchBar`, `SearchAnchor` and `SearchAnchor.bar` (with
  `isFullScreen` for the layout), `SearchController`, themed by `SearchBarTheme` and
  `SearchViewTheme`. Its view separates header and results with a divider (the divided style);
  there is no contained style. We supply it in Phase 3.
- Web: no maintained official component. Our CSS search is built in Phase 3 from the material-web
  token values above.

## Pitfalls

- More than two trailing icons, or an avatar with more than one other icon.
- Hint text that does not say what is searched.
- A surface container high bar on a surface container background.
- Changing the contained bar's shape when it opens.
- Full-screen focused search on large windows, or docked on phones.
- Dropping the "results" status indicator, or hiding the query after submitting.
- Results that do not announce themselves to screen readers.
