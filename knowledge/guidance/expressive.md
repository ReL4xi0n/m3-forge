---
title: M3 Expressive
kind: expressive
pages: [/components, /components/app-bars/overview, /components/button-groups/overview, /components/buttons/overview, /components/extended-fab/overview, /components/fab-menu/overview, /components/floating-action-button/overview, /components/icon-buttons/overview, /components/lists/overview, /components/loading-indicator/overview, /components/menus/overview, /components/navigation-bar/overview, /components/navigation-drawer/overview, /components/navigation-rail/overview, /components/progress-indicators/overview, /components/search/overview, /components/segmented-buttons/overview, /components/sliders/overview, /components/split-button/overview, /components/toolbars/overview]
tokenSets: [button, fab, extended-fab, fab-menu, loading-indicator, toolbar, nav-bar, list]
expressive: true
fetched: 2026-11-13
---

## Summary

M3 Expressive is the 2025 evolution of Material 3. It does not replace M3; it extends it with more
shape, size, motion and type range so products can feel more engaging and make key actions easier
to find. Most of it landed in May 2025, with follow-ups for search (February 2025), menus (November
2025) and lists (December 2025); the wavy progress indicator came earlier (August 2024).

What changes across the system:

- Shape: controls morph their corners when pressed or selected, and a round or square shape can
  be chosen per control.
- Size range: buttons and their relatives get five sizes (extra small to extra large); FABs and
  extended FABs get small, medium and large.
- Motion: springs, grouped into a standard and an expressive motion scheme, replace fixed
  durations and easing curves for component motion.
- Type: every baseline type style gets an emphasized (heavier) counterpart.
- Color: new role mappings that work with dynamic color, plus "vibrant" color styles on toolbars
  and menus.
- New components: button groups, split button, FAB menu, loading indicator, docked and floating
  toolbars, flexible app bars, a search app bar, a flexible navigation bar, collapsed and expanded
  navigation rails, vertical menus and Expressive lists.
- Retirements: several baseline components are no longer recommended (see Rules).

## Rules

Shape morphing:

- Buttons, icon buttons and split buttons change shape when pressed, and toggles change shape when
  selected (round becomes square and the reverse). Details: `components/buttons.md#expressive`.
- In a button group, pressing one button also changes the shape and width of its neighbors. See
  the button groups note (components/button-groups.md).
- The split button's inner corners grow on interaction and its menu button turns round when open;
  see `components/split-button.md#expressive`.
- FABs and extended FABs use a boxier corner than M2's circles and pills.
- Sliders change the handle width and track shape while dragging.
- Loading indicators rely on changing shape and motion to hold attention.
- Larger corner steps were added between large and full: large increased, extra large increased
  and extra extra large (values under Measurements).

Size range:

- Buttons, icon buttons, split buttons and button groups share five sizes: XS, S (default), M, L,
  XL. Sizes are a hierarchy tool; a bigger button can lead a group.
- Icon buttons also come in three widths: narrow, default, wide.
- FABs: FAB, medium FAB (new) and large FAB; the small FAB is no longer recommended. FAB variants
  are named by size, not by color.
- Extended FABs: small, medium and large, with larger type, at the heights of the FAB sizes so the
  two can swap smoothly.
- Sliders: five sizes (XS is the old default), horizontal or vertical, and an optional inset icon
  on the standard slider.

Motion (springs and schemes):

- Component motion is described by springs (damping and stiffness) rather than a duration plus an
  easing curve.
- Two schemes: standard (little or no overshoot) and expressive (lower damping, so spatial
  motion bounces). A theme carries one scheme, and components read their springs from it.
- Each scheme has spatial springs (position, size, shape; may overshoot) and effects springs
  (color, opacity; never overshoot), each in fast, default and slow speeds. Values are in
  Measurements.
- Not every motion uses the expressive scheme: the split button's menu icon rotates with the
  standard scheme.
- New motion behaviors named in the update: the search bar widens when focused, navigation rails
  support predictive back, the collapsed and expanded rails animate into each other, and vertical
  menus refine their submenu motion.

Emphasized type:

- Each of the 15 baseline styles (display, headline, title, body, label in large, medium, small)
  has an emphasized twin with a heavier weight, for example display large regular → medium, and
  label large medium → bold (weights under Measurements).
- The component pages give no rule for when to pick an emphasized style; the typography note
  (styles/typography.md) covers that.
- Component updates also enlarge text: larger titles in flexible app bars, larger labels in
  extended FABs, and larger label text on sliders.

Color:

- Components got new color mappings that support dynamic color. Buttons now color their icon and
  label alike.
- Toolbars and menus offer a vibrant color style for more emphasis. The FAB menu uses a contrasting
  close button and items, and works with any FAB color.
- FABs gained tone styles (primary, secondary, tertiary); the former tonal styles were renamed to
  primary container, secondary container and tertiary container without changing values.
- The active label of navigation bars and vertical rail items changed from on surface variant to
  secondary.

New components (see each component note as it lands):

- Button groups (components/button-groups.md): standard and connected; connected replaces the
  segmented button. Single-select, multi-select and selection-required.
- Split button: `components/split-button.md#summary`.
- FAB menu (components/fab-menu.md): opens from any FAB size to show 2 to 6 related actions; one menu
  size; not used with extended FABs; replaces speed dials and stacked small FABs.
- Loading indicator (components/loading-indicator.md): for waits under about five seconds; replaces
  most indeterminate circular progress indicators; used for pull-to-refresh; contained or
  uncontained; never decorative; not for processes that switch to determinate.
- Toolbars (components/toolbars.md): docked toolbar replaces the bottom app bar (shorter, standard
  or vibrant, more layout options); floating toolbar is horizontal or vertical and can pair with a
  FAB. Do not show a toolbar together with a navigation bar.
- App bars (components/app-bars.md): "top app bar" is renamed "app bar"; a new search app bar;
  medium flexible and large flexible app bars (shorter, larger title, subtitle, left or center
  aligned, wrapping text) replace medium and large; the small app bar gets a centered option.
- Navigation bar (components/navigation-bar.md): the flexible navigation bar is shorter and can use
  horizontal items in medium windows; it replaces the baseline bar.
- Navigation rail (components/navigation-rail.md): collapsed rail replaces the baseline rail;
  expanded rail (modal or non-modal) replaces the navigation drawer.
- Menus (components/menus.md): vertical menus with new shapes, standard or vibrant colors,
  selection states, gaps and submenus; the baseline menu remains available.
- Lists (components/lists.md): Expressive lists with standard or segmented styles, highlighted
  selection and flexible slots; recommended for new designs.
- Search (components/search.md): contained (recommended) or divided style, gaps between result
  groups; search bar and search view are now just "search".
- Progress indicators (components/progress-indicators.md): optional wavy active track and
  configurable track height.

No longer recommended (use the replacement):

- Segmented button → connected button group.
- Navigation drawer → expanded navigation rail.
- Baseline navigation rail → collapsed navigation rail.
- Baseline navigation bar → flexible navigation bar.
- Bottom app bar → docked toolbar.
- Medium and large app bars → medium flexible and large flexible app bars.
- Small FAB, surface FABs, baseline extended FAB, surface extended FAB → the new FAB and extended
  FAB sizes and tone styles.
- Speed dial or stacked small FABs → FAB menu.
- Neutral text button, and the wider small-button padding → current button configurations.

## Measurements

Sizes (material-web values):

| | XS | S | M | L | XL |
|---|---|---|---|---|---|
| Button height | 32dp [token:md.comp.button.xsmall.container.height] | 40dp [token:md.comp.button.small.container.height] | 56dp [token:md.comp.button.medium.container.height] | 96dp [token:md.comp.button.large.container.height] | 136dp [token:md.comp.button.xlarge.container.height] |

| | FAB | Medium | Large |
|---|---|---|---|
| FAB | 56dp [token:md.comp.fab.container.height] | 80dp [token:md.comp.fab.medium.container.height] | 96dp [token:md.comp.fab.large.container.height] |
| Extended FAB height | 56dp (small) [site:/components/extended-fab/overview] [token:md.comp.extended-fab.small.container.height] | 80dp [site:/components/extended-fab/overview] [token:md.comp.extended-fab.medium.container.height] | 96dp [site:/components/extended-fab/overview] [token:md.comp.extended-fab.large.container.height] |

- Retired sizes: small FAB 40dp [token:md.comp.fab.small.container.height]; baseline extended FAB
  56dp [site:/components/extended-fab/overview] [token:md.comp.extended-fab.container.height].
- Small button padding:
  - Recommended: 16dp [site:/components/buttons/overview] [token:md.comp.button.small.leading-space].
  - No longer recommended: 24dp [site:/components/buttons/overview].
- Button leading and trailing icons: 20dp [site:/components/buttons/overview] [token:md.comp.button.small.icon.size].
- M2 buttons were 36dp tall; M3 buttons start at 40dp [site:/components/buttons/overview].
- Segmented buttons (now retired) are 40dp tall [site:/components/segmented-buttons/overview] [token:md.comp.outlined-segmented-button.container.height].
- FAB menu items and close button: 56dp tall [token:md.comp.fab-menu.menu-item.container.height] [token:md.comp.fab-menu.close-button.container.height].
- Loading indicator:
  - Container: 48dp [token:md.comp.loading-indicator.container.width].
  - Indicator: 38dp [token:md.comp.loading-indicator.active-indicator.size].
- Toolbars: docked 64dp [token:md.comp.toolbar.docked.container.height], floating horizontal 64dp [token:md.comp.toolbar.floating.horizontal.container.height].
- M2 bottom app bars sat at 8dp elevation [site:/components/toolbars/overview]; docked toolbars
  have no shadow.
- Navigation bar heights [differs:md.comp.navigation-bar.container.height]:
  - Flexible navigation bar: 64dp [token:md.comp.nav-bar.container.height].
  - Baseline bar in material-web and Flutter: 80dp [token:md.comp.navigation-bar.container.height].
  - Compose's value for the baseline id is 64dp [token:md.comp.navigation-bar.container.height].
- List item heights are set by the tallest element in the item [site:/components/lists/overview]:
  - 56dp (one-line token) [site:/components/lists/overview] [token:md.comp.list.list-item.one-line.container.height].
  - 72dp (two-line token) [site:/components/lists/overview] [token:md.comp.list.list-item.two-line.container.height].
  - 88dp (three-line token) [site:/components/lists/overview] [token:md.comp.list.list-item.three-line.container.height].
  - Items of 88dp or more top-align their content [site:/components/lists/overview].

New corner steps:

- Large increased: 20dp [token:md.sys.shape.corner.large-increased].
- Extra large increased: 32dp [token:md.sys.shape.corner.extra-large-increased].
- Extra extra large: 48dp [token:md.sys.shape.corner.extra-extra-large].

Springs (damping / stiffness). Flutter and Compose define both schemes; material-web's tokens hold
only the standard scheme (expressive values for web: [NOT FOUND]).

| Spring | Standard | Expressive |
|---|---|---|
| Fast spatial | 0.9 / 1400 [token:md.sys.motion.spring.fast.spatial.damping] [token:md.sys.motion.spring.fast.spatial.stiffness] | 0.6 / 800 [token:md.sys.motion.spring.fast.spatial.damping] [token:md.sys.motion.spring.fast.spatial.stiffness] |
| Default spatial | 0.9 / 700 [token:md.sys.motion.spring.default.spatial.damping] [token:md.sys.motion.spring.default.spatial.stiffness] | 0.8 / 380 [token:md.sys.motion.spring.default.spatial.damping] [token:md.sys.motion.spring.default.spatial.stiffness] |
| Slow spatial | 0.9 / 300 [token:md.sys.motion.spring.slow.spatial.damping] [token:md.sys.motion.spring.slow.spatial.stiffness] | 0.8 / 200 [token:md.sys.motion.spring.slow.spatial.damping] [token:md.sys.motion.spring.slow.spatial.stiffness] |
| Fast effects | 1 / 3800 [token:md.sys.motion.spring.fast.effects.damping] [token:md.sys.motion.spring.fast.effects.stiffness] | 1 / 3800 [token:md.sys.motion.spring.fast.effects.damping] [token:md.sys.motion.spring.fast.effects.stiffness] |
| Default effects | 1 / 1600 [token:md.sys.motion.spring.default.effects.damping] [token:md.sys.motion.spring.default.effects.stiffness] | 1 / 1600 [token:md.sys.motion.spring.default.effects.damping] [token:md.sys.motion.spring.default.effects.stiffness] |
| Slow effects | 1 / 800 [token:md.sys.motion.spring.slow.effects.damping] [token:md.sys.motion.spring.slow.effects.stiffness] | 1 / 800 [token:md.sys.motion.spring.slow.effects.damping] [token:md.sys.motion.spring.slow.effects.stiffness] |

Only the spatial springs differ between the schemes; effects springs never bounce.

Emphasized type weights (sizes stay the baseline ones):

- Display large: 400 [token:md.sys.typescale.display-large.weight] → 500
  [token:md.sys.typescale.emphasized.display-large.weight].
- Headline large: 400 [token:md.sys.typescale.headline-large.weight] → 500
  [token:md.sys.typescale.emphasized.headline-large.weight].
- Label large: 500 [token:md.sys.typescale.label-large.weight] → 700
  [token:md.sys.typescale.emphasized.label-large.weight].

## Accessibility

- Extra small and small controls are shorter than a comfortable touch target, so pad their targets;
  see buttons.md#accessibility.
- Selected toggles do not rely on shape alone: their colors change too, and icons switch from the
  outlined to the filled glyph.
- Progress indicators gained a stop indicator at the track end and stronger track contrast; sliders
  were refreshed for non-text contrast. Keep both when restyling.
- Loading indicators always stand for a real process; never use one as decoration.
- Segmented buttons that remain in use can show a check icon for the selected state.
- Guidance on reduced motion for springs is not covered by these pages [NOT FOUND].

## Platform mapping

- Jetpack Compose (material3 1.5.0-rc01) has the fullest support:
  - Theme: `MaterialExpressiveTheme`, `MotionScheme.expressive()` / `MotionScheme.standard()`,
    `expressiveLightColorScheme`, emphasized styles such as `Typography.displayLargeEmphasized`,
    `Shapes.largeIncreased` / `extraLargeIncreased` / `extraExtraLarge`, and `MaterialShapes`.
  - Buttons: `ToggleButton`, `IconToggleButton`, `ButtonGroup`, `SplitButtonLayout`.
  - FABs: `MediumFloatingActionButton`, `MediumExtendedFloatingActionButton`,
    `FloatingActionButtonMenu` with `ToggleFloatingActionButton`.
  - Progress: `LoadingIndicator`, `ContainedLoadingIndicator`, `LinearWavyProgressIndicator`,
    `CircularWavyProgressIndicator`; sliders: `VerticalSlider`.
  - Bars: `FlexibleBottomAppBar` (built on the docked toolbar tokens), `HorizontalFloatingToolbar`,
    `VerticalFloatingToolbar`, `MediumFlexibleTopAppBar`, `LargeFlexibleTopAppBar`,
    `AppBarWithSearch`.
  - Navigation: `ShortNavigationBar` (flexible bar), `WideNavigationRail` and
    `ModalWideNavigationRail` (collapsed and expanded rails).
  - Menus and lists: `DropdownMenuPopup` with `DropdownMenuGroup`; `SegmentedListItem`.
  - Most of these need no experimental opt-in in this version; `LoadingIndicator` and some
    `MaterialShapes` members still require `ExperimentalMaterial3ExpressiveApi`.
- Flutter (`material_ui` 1.11.0): `StyleVariant.material3Expressive` exists but only `ElevatedButton`
  and `IconButton` read it (through their theme data's `variant`). There is no motion scheme, no
  emphasized type, and none of the new components. Phase 3 supplies reference widgets.
- MDC-Android 1.14.0: its token XML includes Expressive sets (button groups, split buttons, docked
  and floating toolbars, loading indicator, both spring schemes), but the library is in maintenance
  mode.
- Web: no Expressive components. material-web's token files include Expressive token sets (button
  groups, flexible app bars), which our Phase 3 CSS builds on.

## Pitfalls

- Treating Expressive as a theme switch only. It adds components and retires others; check the
  "no longer recommended" list before reusing a baseline pattern.
- Animating morphs with fixed durations and easing curves instead of the scheme's springs.
- Using the expressive scheme everywhere, including small utility motion that the guidance keeps
  standard (for example the split button's menu icon).
- Mixing a docked toolbar or floating toolbar with a navigation bar on the same screen.
- Using a loading indicator for long or determinate processes; use a progress indicator.
- Expecting Expressive output from Flutter widgets other than elevated and icon buttons, or from
  material-web components.
