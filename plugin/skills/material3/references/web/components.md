# Web components

Each shipped component is one style sheet and one `install-assets` part of the same name
(`assets/web/components/<part>.css`). The full markup is in each sheet's header comment.

Rules for every sheet:

- Use the classes as given. Never set size, padding, radius, color, font or shadow on an `m3-*`
  element: the sheet draws containers, state layers (hover, focus ring, pressed) and the disabled
  look from tokens. Your CSS only places components (grid, flex, gaps and margins with
  `--md-sys-space-*`).
- The element is its own touch target (at least `--md-target-size`); do not shrink it.
- Disabled: `disabled` on native controls, `aria-disabled="true"` elsewhere.
- Icons are `<span class="m3-icon" aria-hidden="true">name</span>` (class set up in `icons.md`).
  An icon-only control needs `aria-label`.
- Overlays show only with `[open]` (a `<dialog>` opened with `showModal()`) or `[data-open]`;
  `behaviors.js` (`M3.dialog`, `M3.menu`, `M3.snackbar`) does it with focus handling and motion.

Page inputs (CSS cannot read them, the page sets them):

| Input | Where | Value |
|---|---|---|
| `--m3-slider-value` | `.m3-slider` wrapper | input position 0..1, updated on `input` |
| `--m3-progress-value` | `.m3-progress` | 0..1, set together with `aria-valuenow` |
| `--m3-text-field-notch-color` | outlined `.m3-text-field` (or a parent) | the surface role behind the field when it is not `--md-sys-color-surface` |
| `data-scrolled` | `.m3-top-app-bar` | present while content scrolls under the bar |

## Buttons

Part `button`. `<button class="m3-button m3-button--filled">Save</button>`. Kinds `--elevated`,
`--filled` (default), `--tonal`, `--outlined`, `--text`; sizes `--xsmall`, `--small` (default),
`--medium`, `--large`, `--xlarge`; `--square` for square corners. Toggle: `aria-pressed` (not on
text buttons); selected changes the shape. One leading `.m3-icon` before the label.

## Icon buttons

Part `icon-button`. `<button class="m3-icon-button" aria-label="Search"><span class="m3-icon"
aria-hidden="true">search</span></button>`. Kinds `--standard` (default), `--filled`, `--tonal`,
`--outlined`; the five sizes; widths `--narrow`, `--wide`; `--square`. Toggle with `aria-pressed`
and the filled glyph when pressed (`icons.md`). `aria-label` is required.

## Button groups

Part `button-group` (with `button` and/or `icon-button`).
`<div class="m3-button-group" role="group" aria-label="Text style">` holding buttons or icon
buttons of the same size class as the group (`m3-button-group--medium` + `m3-button--medium`).
Connected: `m3-button-group--connected`, every child a toggle (`aria-pressed`); one line only.

## Split button

Parts `split-button`, `button`. `<div class="m3-split-button">` with two `m3-button` of the same
kind and size: the action, then `<button ... aria-label="More send options" aria-haspopup="menu"
aria-expanded="false">` holding `keyboard_arrow_down` (swap to `keyboard_arrow_up` while open). Open a
menu from it with `M3.menu(button, menu)`.

## Segmented buttons

Part `segmented-button` (retired: use a connected button group unless the request names it).
`<div class="m3-segmented-button-set" role="radiogroup" aria-label="...">` with
`<button class="m3-segmented-button" role="radio" aria-checked="true">`; multi-select uses
`aria-pressed`. A selected segment shows a `check` icon.

## Floating action button

Part `fab`. `<button class="m3-fab m3-fab--medium" aria-label="Compose">` + icon. Sizes default,
`--medium`, `--large`; colors `--primary-container` (default), `--secondary-container`,
`--tertiary-container`, `--primary`, `--secondary`, `--tertiary`. Place it with
`position: fixed` and `--md-sys-space-*` insets. No disabled state.

## Extended FAB

Part `fab`. `<button class="m3-extended-fab m3-extended-fab--medium">` + icon + short label. Sizes
Default (no modifier) is small; `--medium`, `--large`; the same color modifiers as the FAB.

## Floating action button menu

No sheet [NOT FOUND] (web asset). Build it from part `fab`: the FAB toggles `aria-expanded` and the
list; open, it shows a close button `m3-fab m3-fab--primary` with `close`
[token:md.comp.fab-menu.primary.close-button.container.color] and, above it, items
`m3-extended-fab m3-extended-fab--primary-container` (small is the default size) (same color set as the
FAB) with `box-shadow: none` [token:md.comp.fab-menu.menu-item.container.elevation], in a column
aligned to the FAB's end, gap `--md-sys-space-50` (4dp [token:md.comp.fab-menu.menu-item.between-space]),
`--md-sys-space-100` above the close button (8dp [token:md.comp.fab-menu.close-button.between-space]).
List `role="menu"`, items `role="menuitem"`; Escape closes and returns focus.

## Cards

Part `card`. `<article class="m3-card m3-card--outlined">`; kinds `--elevated`, `--filled`
(default), `--outlined`. A card adds no padding: lay out its content with `--md-sys-space-*`.
A whole-card action is an `<a href>` or `<button class="m3-card ...">` (gets hover, focus,
pressed) with no other buttons inside.

## Carousel

No sheet [NOT FOUND] (web asset). A horizontal scroller: `display: flex; overflow-x: auto;
scroll-snap-type: x mandatory`, items `scroll-snap-align: start`, gap `--md-sys-space-100`
(8dp [site:/components/carousel/specs]), item corners `--md-sys-shape-corner-extra-large`
[token:md.comp.carousel-item.container.shape], item fill a surface-container role; items are
links or buttons with an accessible name, and a "Show all" text button on long pages.

## Lists

Part `list`. `<ul class="m3-list">` with `<li><a class="m3-list-item" href="...">` (or a plain
`li.m3-list-item`). Parts: `.m3-list-item-text` (headline) holding `.m3-list-item-overline` and
`.m3-list-item-supporting-text`; `.m3-list-item-trailing-text`; `.m3-list-item-avatar` (initials);
an `.m3-icon` before or after the text is the leading or trailing icon. `m3-list-item--three-line`
for two lines of supporting text; `aria-current` marks the selected item; `m3-list--segmented` for
Expressive separated items. Checkbox, radio or switch can sit at either end.

## Divider

Part `divider`. `<hr class="m3-divider">`; `--inset`, `--inset-start`, `--inset-end`; vertical:
`<div class="m3-divider m3-divider--vertical" role="separator" aria-orientation="vertical">`.

## Chips

Part `chip`. `<div class="m3-chip-set" role="group" aria-label="...">` with
`<button class="m3-chip m3-chip--assist">`; kinds `--assist`, `--filter` (toggle `aria-pressed`,
put a `check` icon first: it shows only when selected), `--input` (a `span` whose remove action is
a child `<button aria-label="Remove ...">` with `close`), `--suggestion`; `--elevated` on assist,
filter and suggestion.

## Checkbox

Part `checkbox` (needs `fonts.css`). `<label><input class="m3-checkbox" type="checkbox"> Email
updates</label>`. Indeterminate: set `input.indeterminate = true` from script. Error:
`aria-invalid="true"`. Make the whole label row the click target.

## Radio button

Part `radio`. `<div role="radiogroup" aria-labelledby="...">` with `<label><input class="m3-radio"
type="radio" name="size" value="s"> Small</label>`.

## Switch

Part `switch` (needs `fonts.css`). `<label>Wi-Fi <input class="m3-switch" type="checkbox"
role="switch" checked></label>`; `m3-switch--icons` shows check and close glyphs on the handle.

## Sliders

Part `slider`. `<div class="m3-slider" style="--m3-slider-value: 0.4"><input type="range" min="0"
max="100" value="40" aria-label="Volume"></div>` and an `input` handler setting
`--m3-slider-value` to `(value - min) / (max - min)` on the wrapper. Sizes `--small`, `--medium`,
`--large`, `--xlarge` (default extra small). No value label or ticks: show the value in text
nearby when it matters.

## Text fields

Part `text-field`. `<div class="m3-text-field m3-text-field--outlined"><div>[icon] <input id="city"
placeholder=" " aria-describedby="city-help"> <label for="city">City</label> [icon]</div>
<p id="city-help">Supporting text</p></div>`. The `label` comes right after the input; with
`placeholder=" "` it rests inside and floats on focus or input. Kinds `--filled` (default),
`--outlined`; error `aria-invalid="true"` on the input with the error text in the `p`. Outlined on a
non-surface background: set `--m3-text-field-notch-color` to that role, for example
`var(--md-sys-color-surface-container)`.

## Search

Part `search` (with `icon-button`). Bar: `<form class="m3-search" role="search">` with an
`.m3-icon` or icon button, `<input class="m3-search-input" type="search" placeholder="Search
mail" aria-label="Search mail">` and up to two trailing icon buttons. View:
`<div class="m3-search-view" data-open>` holding the same form then an `m3-list` of results;
`m3-search-view--fullscreen` on compact.

## Date pickers

No sheet [NOT FOUND] (web asset). Use a native `<input type="date">` inside an `m3-text-field`
(typed entry always works and the browser supplies the calendar). For a modal picker, put it in an
`m3-dialog`.

## Time pickers

No sheet [NOT FOUND] (web asset). Use a native `<input type="time">` inside an `m3-text-field`; it
follows the locale's clock.

## Menus

Part `menu` (with `divider` for separators). `<div class="m3-menu" role="menu" aria-label="Edit"
id="edit-menu">` holding `<button class="m3-menu-item" role="menuitem">` with optional `.m3-icon`,
`.m3-menu-item-text` (may hold `.m3-menu-item-supporting-text`) and `.m3-menu-item-trailing-text`.
`m3-menu--vibrant` for the vibrant colors. Selection: `role="menuitemradio"` or
`menuitemcheckbox` with `aria-checked`. Open with `M3.menu(button, menu).toggle()` (button gets
`aria-haspopup="menu"`, `aria-controls`).

## Dialogs

Parts `dialog`, `button`. `<dialog class="m3-dialog" aria-labelledby="t">` with optional
`.m3-icon`, `<h2 class="m3-dialog-headline" id="t">`, `<div class="m3-dialog-content">` and
`<div class="m3-dialog-actions">` of `m3-button m3-button--text` (dismissive first). Open with
`M3.dialog(el).open()` (or `showModal()`); close with `close()`. Full-screen dialog: not shipped.

## Snackbar

Parts `snackbar`, `button`, `icon-button`. `<div class="m3-snackbar"><span
class="m3-snackbar-text"></span><button class="m3-button m3-button--text">Undo</button></div>`,
optional close icon button; `m3-snackbar--two-line`. Show with `M3.snackbar(el).show('Photo
archived', ms)`: it announces through a live region. Place it bottom-center with the layout.

## Tooltips

Part `tooltip` (`button` for rich actions). Plain: `<div class="m3-tooltip" role="tooltip"
id="tip-save">Save to library</div>`, the anchor has `aria-describedby="tip-save"`; set
`data-open` on hover and focus of the anchor, remove on leave, blur and Escape. Rich:
`m3-tooltip--rich` with `.m3-tooltip-subhead`, `.m3-tooltip-text`, `.m3-tooltip-actions`.

## Badges

Part `badge`. `<span class="m3-badge"></span>` (dot) or `<span class="m3-badge">3</span>`;
`m3-badge--anchored` after the icon, inside a wrapper with `position: relative`. Put the meaning in
the anchor's `aria-label` ("Inbox, 3 unread").

## Progress indicators

Part `progress`. `<div class="m3-progress" role="progressbar" aria-label="Upload"
aria-valuemin="0" aria-valuemax="100" aria-valuenow="40" style="--m3-progress-value: 0.4">`;
`--circular`, `--indeterminate` (no value), `--wavy` (wave container size, flat line). Keep the
sheet unmodified (verify exempts only the shipped file).

## Loading indicator

Part `loading-indicator`. `<div class="m3-loading-indicator" role="progressbar"
aria-label="Loading">`; `--contained` over busy content.

## Expressive shapes

Part `shapes`, Expressive only (under `data-m3-style="classic"` the mask is dropped; never plan
them for classic). For avatars, image placeholders and one hero or selected container as emphasis.
`<div class="m3-shape--cookie-9-sided" style="background: var(--md-sys-color-primary-container)">`
The class is a mask only: the color is the element's own role background, an `<img>` is cut too.
Names (Compose `MaterialShapes`): circle, square, slanted, arch, fan, arrow, semi-circle, oval,
pill, triangle, diamond, clam-shell, pentagon, gem, sunny, very-sunny, cookie-4/6/7/9/12-sided,
ghostish, clover-4-leaf, clover-8-leaf, burst, soft-burst, boom, soft-boom, flower, puffy,
puffy-diamond, pixel-circle, pixel-triangle, bun, heart. Keep the box square (the shape stretches
with it). The mask also cuts focus rings and shadows: put it on a non-interactive element.

## Bottom sheets

Part `bottom-sheet`. Modal: `<dialog class="m3-bottom-sheet" aria-label="Share">` with an optional
`<button class="m3-bottom-sheet-drag-handle" type="button" aria-label="Close the sheet">` first;
open with `M3.dialog(el).open()`. Standard: `<section class="m3-bottom-sheet">` placed by the
layout. Lay out content with `--md-sys-space-*`.

## Side sheets

No sheet [NOT FOUND] (web asset). Standard: an `<aside>` beside the content, background
`--md-sys-color-surface` [token:md.comp.sheet.side.docked.container.color], no corners, padding
`--md-sys-space-300` (24dp [site:/components/side-sheets/specs]). Modal: a `<dialog>` at the
end edge opened with `M3.dialog`, background `--md-sys-color-surface-container-low`, corners
`--md-sys-shape-corner-large-start` [token:md.comp.sheet.side.docked.modal.container.shape],
`--md-sys-elevation-level1-shadow`, a close icon button in its header.

## App bars

Part `top-app-bar` (with `icon-button`). `<header class="m3-top-app-bar">` holding a leading icon
button, `<div class="m3-top-app-bar-text"><h1 class="m3-top-app-bar-title">` (optional
`p.m3-top-app-bar-subtitle`) and `<div class="m3-top-app-bar-actions">` (at most two icon
buttons). Sizes default small, `--medium-flexible`, `--large-flexible`. Set `data-scrolled` while
content scrolls under it (`scroll` listener or an IntersectionObserver sentinel).

## Toolbars

No sheet [NOT FOUND] (web asset). A `div role="toolbar" aria-label="..."` of icon buttons (one
filled or tonal for the emphasized action). Docked: full width at the bottom,
`--md-sys-color-surface-container` [token:md.comp.toolbar.docked.container.color], square corners,
`min-block-size: var(--md-sys-space-800)` (64dp [token:md.comp.toolbar.docked.container.height]),
inline padding `--md-sys-space-200` (16dp [token:md.comp.toolbar.docked.container.leading-space]).
Floating: the same color, `--md-sys-shape-corner-full`, `--md-sys-elevation-level3-shadow`
[token:md.comp.toolbar.floating.container.elevation], padding `--md-sys-space-100`, gap
`--md-sys-space-50`. Never with a navigation bar.

## Navigation bar

Part `navigation-bar`. `<nav class="m3-navigation-bar" aria-label="Main">` with three to five
`<a class="m3-navigation-bar-item" href="..." aria-current="page"><span class="m3-icon"
aria-hidden="true">home</span><span class="m3-navigation-bar-label">Home</span></a>`. Fix it to the
bottom on compact widths only; the active item uses the filled glyph.

## Navigation rail

Part `navigation-rail`. `<nav class="m3-navigation-rail" aria-label="Main">` with an optional
`.m3-navigation-rail-header` (menu button, FAB) and `a.m3-navigation-rail-item` holding `.m3-icon`
and `.m3-navigation-rail-label`; `aria-current="page"` on the active one. `--expanded` for icon and
label in a row; `--expanded --modal` on a `<dialog>` opened with `M3.dialog`. Swap the bar for the
rail with a media query on the layout width (`layout.md`).

## Navigation drawer

Part `navigation-drawer` (retired). `<nav class="m3-navigation-drawer" aria-label="Mail">` with
optional `h2.m3-navigation-drawer-headline` and `a.m3-navigation-drawer-item` (`.m3-icon`,
`.m3-navigation-drawer-label`, optional `.m3-navigation-drawer-badge`). Modal:
`m3-navigation-drawer--modal` on a `<dialog>`, closes on scrim click.

## Tabs

Part `tabs`. `<div class="m3-tabs" role="tablist" aria-label="Library">` with
`<button class="m3-tab" role="tab" aria-selected="true" aria-controls="p-music"><span
class="m3-tab-content">[icon]<span class="m3-tab-label">Music</span></span></button>`; other tabs
`aria-selected="false" tabindex="-1"`; arrow keys move between tabs; panels `role="tabpanel"`.
`m3-tabs--secondary` for secondary tabs.
