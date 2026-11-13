---
title: Developing with M3
kind: foundation
pages: [/develop, /develop/android/jetpack-compose, /develop/android/mdc-android, /develop/flutter, /develop/web, /blog/material-3-compose-1-1, /blog/material-3-compose-1-3, /blog/migrating-material-3, /blog/how-to-gemini-app-compose-material-design-3, /blog/designtocode, /blog/relay-ravn-case-study, /blog/testing-material-3]
tokenSets: []
expressive: true
fetched: 2026-11-13
---

## Summary

Material 3 ships on four code platforms, and they are not equal. The site's position (announced on
19 May 2026) is:

- Android is Compose-first. The Jetpack Compose Material 3 library is built by the Material team,
  gets new Material features first, and is the recommended Android toolkit. Upcoming work named on
  the site: stable Expressive components, a Styles API for easier customization, and Navigation3
  in the adaptive library.
- Android Views (MDC-Android) is in maintenance mode: critical fixes only. The site calls Material
  Views 1.14 the final stable release.
- Flutter's Material library is maintained by the Flutter team and receives Material updates
  periodically. The site's Flutter page says Flutter has the original M3 components and no M3
  Expressive; the pinned `material_ui` 1.11.0 package already has a partial Expressive opt-in (see
  Platform mapping).
- Web: the Material Web components are in maintenance mode with no further updates, and M3
  Expressive is not implemented on the web. Angular Material is a separate library whose
  implementation can differ from Material guidance.

The versions this knowledge base is pinned to: Compose material3 1.5.0-rc01, Flutter `material_ui`
1.11.0, MDC-Android 1.14.0 (token XML only), and material-web's token files (Sass) from its main
branch.

The blog posts in this note are older (2021 to 2024). They explain how M3 reached each platform;
several of their code samples use APIs that have since been renamed (see Pitfalls).

## Rules

Choosing a platform:

- Android: build with Compose. Only use MDC-Android for existing Views apps, and plan a migration.
- Multi-platform apps: Flutter is the site's recommended choice for Material support.
- Web: there is no maintained official component set.
  - **Our practice:** use the material-web token values and build components on top (this repo's
    Phase 3 CSS does exactly that).
- Wear OS and Android XR have their own guidance and libraries; see `foundations/watches.md` and
  `foundations/xr.md`.

Migrating from M2 to M3 (from the 2021 MDC-Android migration post, still useful as a checklist):

- Theme: move the app theme and widget styles from the Material Components family to the Material 3
  family; Material Theme Builder can export ready-made theme code for Android XML and Compose.
- Color: M3 adds a tertiary color, container and on-container roles for primary, secondary,
  tertiary and error, inverse roles, outline, and surface variant. The old "variant" roles
  (primary variant, secondary variant) are deprecated.
- Dynamic color (Android 12 and later) derives palettes from the wallpaper. It only works when the
  app reads colors from theme attributes or the color scheme; hard-coded hex values and color
  resources break it. MDC-Android offers a one-line opt-in at application start.
- Typography: M2's headline 1–6, subtitle, body, button, caption and overline styles become five
  roles (display, headline, title, body, label) in three sizes each. The post's mapping: display
  large and medium replace older display styles, M2 headline 1 → display small, headline 2–4 → headline large/medium/small, headline 5 → title large,
  subtitle 1–2 → title medium/small, body 1–2 → body large/medium, caption → body small, button →
  label large, overline → label medium; label small is new. MDC-Android names them
  `textAppearance` + role + size, for example `textAppearanceBodyLarge`.
- Components: top app bars separate from content with a color fill instead of a shadow; navigation
  bar destinations use an outlined icon when inactive and a filled icon inside a pill indicator
  when active; FABs become rounded squares with primary, secondary or surface styles and gain a
  large size; buttons become fully rounded; chips get small rounded
  corners; badges can sit on any corner of a navigation icon.

What the Compose releases added (blog posts for 1.1 and 1.3):

- 1.1 (2023): bottom sheets (standard via a scaffold, modal), date and date-range pickers with an
  input mode and a dialog, time pickers (dial or keyboard input), search bars (full-screen and
  docked), tooltips (plain and rich), and app bar scroll behaviors (pinned: stays and changes
  color; enter-always: hides on scroll and returns). Scaffold, surface, navigation drawer and rail
  became stable.
- 1.3 (2024): ripples moved to a new API for performance, carousels (multi-browse, uncontained),
  restyled progress indicators (rounded caps, gap to track, stop indicator) and sliders, bottom
  sheet inset fixes, a reworked pull-to-refresh, built-in predictive back for modal bottom sheet,
  search bar and drawer sheets, segmented buttons and swipe-to-dismiss promoted to stable.
- 1.3 also replaced elevation-tinted surfaces with tone-based surface container roles. Remap
  custom code this way:
  - Elevation tints +4 and +5 (deprecated): use the highest container role by default, or the
    high one, or surface dim, depending on the case.
  - Surface variant: now the highest container role.
  - Tint +3: the high container role. Tint +2: the plain container role. Tint +1: the low one.
  - The lowest container role has no older equivalent. The default light scheme's on-container
  roles became more colorful while keeping accessible contrast.

Design-to-code handoff (2021 and 2023 posts):

- Handoff loses detail when values travel by chat, email and tickets. Google's answer was a
  Figma-to-Compose workflow (later named Relay) that packaged Figma components as "UI packages"
  for Compose projects, carrying layout, appearance, data bindings and interaction intent.
- The lessons that outlast the tool: agree on a standard component structure, document which
  parts are dynamic, and use system tokens as the shared vocabulary between designers and
  developers.
- Relay is not part of our pinned sources; treat it as history, not a recommendation.

Asking an AI assistant about M3 (2024 post, useful for this skill's own answers):

- Name the exact stack in the prompt: Material 3 (not just "Material Design"), Jetpack Compose or
  Compose Material 3, Kotlin, and the reader's level ("new to Compose").
- Split a large request (components + orientation + themes + accessibility + code) into smaller
  prompts; each answer gets more specific.
- Treat generated code as a draft and review it. The post's own sample output missed touch target
  sizes until accessibility was asked about separately, which is exactly the kind of gap to check.

How Material evaluates designs (2024 research post):

- Interfaces communicate hierarchy (what matters most), perceived utility (what each part does
  and how to use it), and style (brand, mood, who it is for). Material asks users to rate pairs
  of designs on these three dimensions.
- In an email-app comparison with 229 US participants, the M3 design won on hierarchy and utility;
  only playfulness went to M2. Estimated shares of people preferring each design:
  - M3 guides attention better: 81% [site:/blog/testing-material-3].
  - M3 is more informative: 92% [site:/blog/testing-material-3].
  - M3 is more obvious to use: 77% [site:/blog/testing-material-3].
  - M3 has a clearer main function: 76% [site:/blog/testing-material-3].
  - M2 is more playful: 65% [site:/blog/testing-material-3].
- Takeaways: a larger, labeled compose button and a full search bar read as more usable; a
  strongly colored top app bar reads as playful.

## Measurements

The develop pages are about libraries, not dimensions. Values they mention:

- M3 chips have small rounded corners of 8dp [site:/blog/migrating-material-3]
  [token:md.comp.assist-chip.container.shape].
- Code samples in the Compose blog posts use example sizes (sheet peek height, carousel item width)
  that are illustrations, not spec values; do not reuse them as tokens [NOT FOUND].
- No platform-level spacing or size tokens are introduced on these pages [NOT FOUND].

## Accessibility

- Dynamic color keeps contrast only when every color comes from roles; custom hex values bypass
  the contrast-aware palettes.
- Compose 1.3 raised the colorfulness of on-container roles while keeping contrast accessible; do
  not lower contrast back when overriding them.
- Pull-to-refresh needs an accessible alternative, such as a refresh action in the app bar (the
  1.3 sample does this).
- Generated or migrated code still needs a check for touch targets, contrast, and screen reader
  labels.

## Platform mapping

Theming entry points:

| Concept | Jetpack Compose (1.5.0-rc01) | Flutter (`material_ui` 1.11.0) | MDC-Android (1.14.0) | Web |
|---|---|---|---|---|
| Theme | `MaterialTheme(colorScheme, motionScheme, shapes, typography)` | `ThemeData` (`useMaterial3` defaults to true) | Material 3 app themes (names not in our pinned token XML) | `@material/web` CSS custom properties; maintenance mode |
| Expressive theme | `MaterialExpressiveTheme` | per-component `variant: StyleVariant.material3Expressive` | Expressive tokens present in 1.14.0 XML | not implemented |
| Color scheme | `lightColorScheme`, `darkColorScheme`, `expressiveLightColorScheme` | `ColorScheme.fromSeed`, `DynamicSchemeVariant`, `ContrastLevel` | theme color attributes | token values |
| Dynamic color | `dynamicLightColorScheme`, `dynamicDarkColorScheme` (Android only) | from a seed color | supported (helper not in pinned sources) | none |
| Motion scheme | `MotionScheme.standard()`, `MotionScheme.expressive()` | none | spring tokens for both schemes | standard-scheme spring tokens only |
| Emphasized type | `Typography.displayLargeEmphasized` and 14 more | none | none found | none |
| Expressive shapes | `Shapes.largeIncreased`, `extraLargeIncreased`, `extraExtraLarge`; `MaterialShapes` | none | increased corner tokens in the XML | corner tokens only |

Notes on the table:

- Compose:
  - `dynamicLightColorScheme` and `dynamicDarkColorScheme` live in the Android source set, not in
    common code.
  - Most Expressive composables carry no experimental opt-in in 1.5.0-rc01. `LoadingIndicator`
    and some `MaterialShapes` members still need `ExperimentalMaterial3ExpressiveApi`.
- Flutter:
  - `StyleVariant.material3Expressive` is read only by `ElevatedButton` (through
    `ElevatedButtonThemeData.variant`) and `IconButton` (through `IconButtonThemeData.variant`).
    Everything else renders baseline M3.
  - `LinearProgressIndicator`, `CircularProgressIndicator` and `Slider` have a deprecated
    `year2023` flag that still defaults to true. Set it to false to get the 2024 visuals the
    Compose 1.3 post describes.
- Web: material-web's token files include Expressive token sets (button groups, flexible app
  bars), although its components never implemented them.

Components named in the blog posts, as they exist in Compose 1.5.0-rc01:

- Sheets: `BottomSheetScaffold`, `ModalBottomSheet` with `rememberModalBottomSheetState`;
  `contentWindowInsets` sets where insets apply.
- Pickers: `DatePicker`, `DateRangePicker`, `DatePickerDialog`, `rememberDatePickerState`;
  `TimePicker` (with `TimePickerLayoutType`), `TimeInput`, `rememberTimePickerState`.
- Search: `SearchBar` with `rememberSearchBarState`, plus `ExpandedFullScreenSearchBar` or
  `ExpandedDockedSearchBar` for results; `AppBarWithSearch` for the search app bar.
- Tooltips: `TooltipBox` with `TooltipScope.PlainTooltip` or `TooltipScope.RichTooltip`, and
  `rememberTooltipState`.
- App bars: `TopAppBar` with `TopAppBarDefaults.pinnedScrollBehavior`,
  `enterAlwaysScrollBehavior`, `exitUntilCollapsedScrollBehavior`.
- Carousel: `HorizontalMultiBrowseCarousel`, `HorizontalUncontainedCarousel`,
  `HorizontalCenteredHeroCarousel`, `rememberCarouselState`; item modifiers `Modifier.maskClip`
  and `Modifier.maskBorder`.
- Others: `PullToRefreshBox` with `rememberPullToRefreshState`; `SegmentedButton` inside
  `SingleChoiceSegmentedButtonRow` or `MultiChoiceSegmentedButtonRow`; `SwipeToDismissBox`;
  `ModalDrawerSheet`, `DismissibleDrawerSheet`; `ripple()` with `LocalRippleConfiguration`;
  `ColorScheme.surfaceColorAtElevation` (still present, but the surface container roles replace
  it).

Flutter equivalents that exist in `material_ui` 1.11.0: `SearchBar` and `SearchAnchor`,
`CarouselView`, `SegmentedButton`, `NavigationBar`, `NavigationRail`, `NavigationDrawer`,
`MenuAnchor`, `DropdownMenu`, `Tooltip`, `showModalBottomSheet`, `showDatePicker`,
`showDateRangePicker`, `showTimePicker`. There are no Flutter widgets for button groups, split
buttons, the FAB menu, loading indicators or floating toolbars.

## Pitfalls

- Copying blog code without checking the current API:
  - `PlainTooltipBox` and `RichTooltipBox` no longer exist; use `TooltipBox` with `PlainTooltip` or
    `RichTooltip`.
  - The `SearchBar` overload with `active` / `onActiveChange` and the old `DockedSearchBar` are
    deprecated; use the state-based `SearchBar` with the expanded variants.
  - `TopSearchBar` is deprecated and renamed `AppBarWithSearch`.
  - `LocalRippleTheme` and `RippleTheme` are gone; Material components no longer read them.
- Building new Android UI on MDC-Android, which only receives critical fixes.
- Expecting M3 Expressive on the web or on most Flutter widgets. Flutter's opt-in currently covers
  elevated buttons and icon buttons only.
- Leaving Flutter progress indicators and sliders on the `year2023` default and comparing them with
  current Compose visuals.
- Still using `surfaceColorAtElevation` or elevation tints for new surfaces instead of surface
  container roles.
- Hard-coded colors in an app that enables dynamic color.
- Prompting an assistant with "Material Design" alone, which can return M2 or the wrong platform's
  code.
