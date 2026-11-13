---
title: Menus
kind: component
pages: [/components/menus/overview, /components/menus/specs, /components/menus/guidelines, /components/menus/accessibility]
tokenSets: [menus, menus.standard, menus.vibrant, menu]
expressive: true
fetched: 2026-11-13
---

## Summary

A menu is a temporary surface that lists choices or actions. It opens from something on screen (an
icon button, a button, a split button, a text field, a filter chip, selected text or an image) or
from a secondary click, and closes once a choice is made. The Expressive update (November 2025)
added vertical menus with rounded shapes, standard and vibrant color styles, selected states,
groups separated by gaps, and submenu motion. The older baseline menu still exists; vertical menus
are recommended for new designs.

## Use it when

- Actions or options are needed only occasionally: overflow menus, text field dropdowns, select
  menus, context menus.
- A list of choices would take too much room as radio buttons or chips.
- Avoid when:
  - The actions should stay visible all the time; use a toolbar.
  - The window is compact and the labels are long; a bottom sheet gives more room for items and
    text.
  - An item would need its own buttons, switches or several actions. Each menu item does one thing.

## Anatomy

1. Menu item.
2. Leading icon (optional).
3. Item text.
4. Trailing icon (optional), for example a submenu arrow.
5. Badge (optional).
6. Trailing text (optional), for example a keyboard shortcut.
7. Container.
8. Supporting text (optional), a second line under the item text.
9. Label text (optional), a heading for a group.
10. Gap (optional), between groups.
11. Divider (optional), between groups.

Items may also hold a custom slot with simple content such as an image, a color swatch or a
progress indicator.

## Variants

| Category | Configuration | Baseline M3 | M3 Expressive (vertical menu) |
|---|---|---|---|
| Color | Standard (surface-based) | yes | yes |
| Color | Vibrant (tertiary-based) | no | yes |
| Layout | Standard (one block) | yes | yes |
| Layout | Grouped (blocks separated by gaps) | no | yes |

- Standard color is quieter and utilitarian; vibrant draws more attention, so use it sparingly.
- Baseline menu: square-ish corners and older colors, with no vibrant style, no gap groups, no new
  selected state and no submenu motion. It keeps working in existing products.
- Dropdown menus and exposed dropdown menus are no longer separate variants; both are just
  menus, differing only in what opens them.

## Expressive

- Vertical menus (November 2025) bring:
  - Rounded containers and items, and a selected item that changes both shape and color.
  - Standard and vibrant color styles.
  - Groups separated by a small gap, a more expressive alternative to dividers.
  - Submenus with a shape morph: as focus moves between open submenus, the active one gets rounder
    corners and the inactive one less round corners.
- Selected item: shape becomes rounder and the container switches to tertiary container (standard)
  or tertiary (vibrant). A checkmark is recommended as an extra cue.
- Availability limits named by the site:
  - Gaps are not available on the web; use dividers there.
  - Submenus are not available on Jetpack Compose.

## States and behavior

- Item states: enabled, disabled, hovered, focused, pressed, selected; a parent item also has an
  active state while its submenu is open.
- An item that only works under certain conditions shows as disabled instead of disappearing.
- Opening:
  - The menu appears in front of all other UI, positioned against the window edges. It usually
    opens below, beside or over its trigger.
  - Near an edge it flips to the left, right or above so it is not cut off; at the top of the
    screen it expands downwards.
  - The trigger keeps its look while the menu is open, plus a pressed state. Choosing an item does
    not change the trigger's icon.
- Selection:
  - Single-select: picking an item clears the previous choice.
  - Multi-select: several items can be on; the menu stays open until dismissed.
- Groups:
  - Gaps: keep the gap size, use at most one or two, and never in a scrolling menu.
  - Dividers: subtler; use them in scrolling menus, in text field dropdowns, and on the web.
- Scrolling: when items do not all fit, the menu scrolls and shows a persistent scrollbar.
- Filtering: a menu can include a text field (autocomplete). Items filter as the person types and
  ease into their new positions.
- Submenus: open beside the parent item without covering it; best on larger screens. Focus follows
  whichever submenu is hovered or focused.
- Density (web only): levels 0 to -3 reduce the top and bottom padding.

## Measurements

Vertical menu (material-web values, canonical):

| Part | Value |
|---|---|
| Item height | 44dp [token:md.comp.menus.menu-item.height] |
| Item start and end padding | 16dp [token:md.comp.menus.menu-item.leading-space] [token:md.comp.menus.menu-item.trailing-space] |
| Item top and bottom padding | 8dp [token:md.comp.menus.menu-item.top-space] [token:md.comp.menus.menu-item.bottom-space] |
| Space between item elements | 12dp [token:md.comp.menus.menu-item.between-space] |
| Leading and trailing icon size | 20dp [token:md.comp.menus.menu-item.leading-icon.size] [token:md.comp.menus.menu-item.trailing-icon.size] |
| Gap between groups | 2dp [token:md.comp.menus.gap] |
| Group padding | 2dp [token:md.comp.menus.group.padding] |
| Container corner (menu, and active submenu) | 16dp [token:md.comp.menus.container.shape] [token:md.comp.menus.active.container.shape] |
| Inactive submenu corner | 8dp [token:md.comp.menus.inactive.container.shape] |
| Group corner | 8dp [token:md.comp.menus.group.shape] |
| Item corner | 4dp [token:md.comp.menus.menu-item.shape] |
| First and last item, outer corners | 12dp [token:md.comp.menus.menu-item.first-child.shape] [token:md.comp.menus.menu-item.last-child.shape] |
| First and last item, inner corners | 4dp [token:md.comp.menus.menu-item.first-child.inner-corner.corner-size] [token:md.comp.menus.menu-item.last-child.inner-corner.corner-size] |
| Selected item corner | 12dp [token:md.comp.menus.menu-item.selected.shape] |
| Elevation | level 2, 3dp [token:md.comp.menus.container.elevation] |

- The vertical-menu measurement image on the specs page has no printed values in the scraped text
  [NOT FOUND]; the table above uses the tokens.
- Interactive targets inside a slot must be at least 48 × 48dp [site:/components/menus/accessibility].
- Compose reads these values from its own `SegmentedMenuTokens` and `VibrantMenuTokens` sets. The
  token database does not map them to `md.comp.menus.*` ids, so those ids show NOT FOUND for
  Compose.
- material-web and Flutter's data also define horizontal menu tokens (`md.comp.menus.horizontal.*`);
  the site pages do not describe a horizontal menu, so this note does not cover them.

Baseline menu:

| Part | Value |
|---|---|
| Container width | 112dp minimum, 280dp maximum [site:/components/menus/specs] |
| Corner radius | 4dp [site:/components/menus/specs] [token:md.comp.menu.container.shape] |
| Item height | 48dp [site:/components/menus/specs] [token:md.comp.menu.list-item.container.height] |
| Start and end padding (with or without icon) | 12dp [site:/components/menus/specs] |
| Space between elements in an item | 12dp [site:/components/menus/specs] |
| Padding above and below a divider | 8dp [site:/components/menus/specs] |
| Divider thickness | 1dp [site:/components/menus/specs] [token:md.comp.menu.divider.height] |
| Leading and trailing icon size | 24dp [site:/components/menus/specs] [token:md.comp.menu.list-item.with-leading-icon.leading-icon.size] |
| Elevation | level 2, 3dp [token:md.comp.menu.container.elevation] |

- Item text is vertically centered and start-aligned.

## Typography

- Item text: label large [token:md.comp.menus.menu-item.label-text.font].
- Supporting text: body small [token:md.comp.menus.menu-item.supporting-text.font].
- Trailing text: label large [token:md.comp.menus.menu-item.trailing-supporting-text.font].
- Baseline item text: label large [token:md.comp.menu.list-item.label-text.font].
- Group label text: no type token [NOT FOUND].

## Color roles and state layers

Vertical menu, standard:

- Container: surface container low [token:md.comp.menus.standard.container.color].
- Item text: on surface [token:md.comp.menus.standard.menu-item.label-text.color].
- Icons, supporting and trailing text: on surface variant
  [token:md.comp.menus.standard.menu-item.leading-icon.color].
- Selected item: tertiary container [token:md.comp.menus.standard.menu-item.selected.container.color]
  with on tertiary container content [token:md.comp.menus.standard.menu-item.selected.label-text.color].
- State layer: on surface (on tertiary container when selected).

Vertical menu, vibrant:

- Container: tertiary container [token:md.comp.menus.vibrant.container.color].
- Item text and icons: on tertiary container [token:md.comp.menus.vibrant.menu-item.label-text.color].
- Selected item: tertiary [token:md.comp.menus.vibrant.menu-item.selected.container.color] with on
  tertiary content [token:md.comp.menus.vibrant.menu-item.selected.label-text.color].
- State layer: on tertiary container (on tertiary when selected).

State-layer opacities (both styles):

- Hovered: 8% [token:md.comp.menus.standard.menu-item.hovered.state-layer.opacity].
- Focused: 10% [token:md.comp.menus.standard.menu-item.focused.state-layer.opacity].
- Pressed: 10% [token:md.comp.menus.standard.menu-item.pressed.state-layer.opacity].
- Active (parent of an open submenu): 8% [token:md.comp.menus.standard.menu-item.active.state-layer.opacity].
- Disabled content: 38% [token:md.comp.menus.standard.menu-item.disabled.label-text.opacity].
- Disabled selected item: its container is drawn at 38% [token:md.comp.menus.standard.menu-item.selected.disabled.container.opacity].
- Focus ring: secondary [token:md.comp.menus.menu-item.focus.indicator.color].

Baseline menu:

- Container: surface container [token:md.comp.menu.container.color].
- Item text: on surface [token:md.comp.menu.list-item.label-text.color]; icons on surface variant.
- Selected item: secondary container [token:md.comp.menu.list-item.selected.container.color] with
  on secondary container text [token:md.comp.menu.list-item.selected.label-text.color].
- Hover state layer: 8% [token:md.comp.menu.list-item.hover.state-layer.opacity]; focus and
  pressed: 10% [token:md.comp.menu.list-item.focus.state-layer.opacity]
  [token:md.comp.menu.list-item.pressed.state-layer.opacity].
- Divider: surface variant in the tokens [token:md.comp.menu.divider.color]; the specs page lists
  outline variant among the baseline roles. We follow the token.

## Motion

- No menu motion token exists in any repository [NOT FOUND]. The site describes the behavior:
  - Menus enter and exit with a transition tied to the element that opened them.
  - Dense desktop products may open menus instantly to reduce motion.
  - Items ease into place while the list filters.
  - Submenu corners morph as focus moves between submenus.
- Compose chooses the motion in code (`Menu.kt`):
  - Open and close: scale from 0.8 to 1 with the fast spatial spring and fade with the fast effects
    spring (Menu.kt:1830, Menu.kt:1831, Menu.kt:2403).
  - Group (submenu) shape morph on hover: fast spatial spring (Menu.kt:294).
  - Selected item shape morph: fast spatial spring; item color change: fast effects spring
    (Menu.kt:2015, Menu.kt:2016).
  - Fast spatial, standard scheme: damping 0.9, stiffness 1400; expressive scheme: damping 0.6,
    stiffness 800 [token:md.sys.motion.spring.fast.spatial.damping]
    [token:md.sys.motion.spring.fast.spatial.stiffness].
  - Fast effects: damping 1, stiffness 3800 [token:md.sys.motion.spring.fast.effects.damping]
    [token:md.sys.motion.spring.fast.effects.stiffness].
- Flutter's `MenuAnchor` uses fixed durations:
  - Opening: 500ms [impl:material_ui/packages/material_ui/lib/src/menu_anchor.dart:94].
  - Closing: 150ms [impl:material_ui/packages/material_ui/lib/src/menu_anchor.dart:97].

## Accessibility

- People using assistive technology must be able to open, move through, select in, and close a
  menu.
- Selected items need more than color: the default shape and color change gives 3:1 contrast
  between selected and unselected items, and adding a checkmark is recommended.
- Focus:
  - When a menu opens, focus goes to its first item.
  - Disabled items can receive focus but cannot be chosen. Dividers and gaps never take focus.
  - Where focus lands after closing depends on the app.
- Closing: by choosing an option, pressing Escape, tapping outside, or using the system back
  action.
- Keyboard (Android and web):
  - Tab: focus lands on the menu.
  - Space or Enter: opens a closed menu or submenu; chooses the focused item in an open menu.
  - Up and Down arrows: open a closed menu; move between items in an open one.
  - Left and Right arrows: open or close a submenu.
  - A letter key: jumps to the next item starting with that letter.
  - Escape: closes the menu.
- Labels: the item's accessible name is its visible text. Mark a leading icon next to text as
  decorative. Roles differ per platform: menu item on the web, a generic actionable element on
  Android Views and Compose.
- Slots: keep the standard item padding and put only one action in each item. Targets must be
  48 × 48dp [site:/components/menus/accessibility] or larger.

## Platform mapping

- Jetpack Compose (material3 1.5.0-rc01):
  - Baseline: `DropdownMenu` with `DropdownMenuItem`; `ExposedDropdownMenuBox` with
    `ExposedDropdownMenu` for text field menus.
  - Vertical (Expressive): `DropdownMenuPopup` holding `DropdownMenuGroup`s of
    `DropdownMenuItem`, `SelectableDropdownMenuItem` or `CheckableDropdownMenuItem`.
    `MenuDefaults` supplies `groupShape`, `itemShape`, `GroupSpacing`, the standard and vibrant
    colors (`itemColors`, `itemVibrantColors`, `selectableItemVibrantColors`,
    `groupVibrantContainerColor`), `DropdownMenuGroupLabel` and `DropdownMenuItemTrailingLabel`.
    In this version these carry no experimental opt-in.
  - No submenus, as the site notes.
- Flutter (`material_ui` 1.11.0): `MenuAnchor` with `MenuItemButton`, `SubmenuButton` and
  `CheckboxMenuButton`; `MenuBar`; `DropdownMenu`; `PopupMenuButton` with `PopupMenuItem`.
  - The package's generator data includes the vertical-menu tokens, but no widget uses them: there
    is no vibrant style, gap grouping or selected shape. We supply them in Phase 3 as reference
    widgets.
- Web: no maintained official component. Our CSS menu is built in Phase 3 from the material-web
  token values above. Follow the web limits from the site: dividers instead of gaps, and density
  levels for compact layouts.

## Pitfalls

- Using a menu for actions that should always be visible.
- Overusing the vibrant style; it is for occasional emphasis.
- Gaps in scrolling menus, resized gaps, or more than two gaps.
- Removing unavailable items instead of disabling them.
- Putting switches, buttons or several actions inside one item.
- Changing the trigger icon after a choice is made.
- Submenus that cover their parent item, or submenus on compact screens where a bottom sheet works
  better.
- Showing selection by color alone.
