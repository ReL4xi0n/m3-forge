---
title: Layout
kind: foundation
pages: [/foundations/layout/layout-overview/overview, /foundations/layout/layout-overview/parts-of-layout, /foundations/layout/layout-overview/adaptive-design, /foundations/layout/breakpoints/overview, /foundations/layout/breakpoints/compact, /foundations/layout/breakpoints/medium, /foundations/layout/breakpoints/expanded, /foundations/layout/breakpoints/large-extra-large, /foundations/layout/scaffold/overview, /foundations/layout/scaffold/bars, /foundations/layout/scaffold/rails, /foundations/layout/scaffold/panes, /foundations/layout/canonical-examples/overview, /foundations/layout/canonical-examples/feed, /foundations/layout/canonical-examples/list-detail, /foundations/layout/canonical-examples/supporting-pane, /foundations/layout/grids-spacing/overview, /foundations/layout/grids-spacing/grids, /foundations/layout/grids-spacing/spacing, /foundations/layout/grids-spacing/density, /foundations/layout/bidirectionality-rtl, /components/cards/accessibility]
tokenSets: [sys.measurement, drag-handle, sheet.side]
expressive: true
fetched: 2026-11-13
---

## Summary

Layout decides where everything on a screen sits, how it is grouped, and how that arrangement
changes when the window changes. M3 builds every layout from three regions (bars, rails and
panes), sizes them by five width breakpoints, and recommends starting from one of three canonical
layouts (feed, list-detail, supporting pane). The guidance targets Android and the web.

The May 2026 refresh of the layout pages renamed two core ideas and added the scaffold vocabulary:

- "Window size classes" are now **breakpoints**.
- "Responsive layout" is now **adaptive design**: not just stretching one layout, but choosing a
  different arrangement per device, person and situation.
- The **layout scaffold** (bars, rails, panes) is new, as are rulers, guidance for three
  experience types (mobile, desktop, spatial/XR), updated canonical examples, and a spacing
  system with "Expressive" spacing guidance. See [What the 2026 refresh changed](#what-the-2026-refresh-changed).

No platform ships breakpoint or margin tokens. Breakpoint, margin and pane numbers below come from
the site; where a value happens to equal a step of the spacing scale, the step's token is cited too.

## Rules

### Vocabulary

- **Window**: the frame an app runs in. Phones default to full screen; tablets and foldables add
  split screen and floating "bubbles"; desktops have free-form windows that people resize at will.
- **Breakpoint**: a window width at which the layout should rearrange itself.
- **Pane**: a container for one destination's content (a message list, one conversation). All
  content lives in a pane, and a window shows one to three of them.
- **Bar**: the top or bottom strip that frames the screen, holding an app bar or a navigation bar.
- **Rail**: the strip around the panes, next to the bars, holding things like a navigation rail,
  toolbar, chat input or FAB. It can also float above panes.
- **Safety region**: space at the screen edges kept for system UI (status bar, gesture bar). Never
  put primary content there.
- **Column**: a vertical block of content inside a pane. **Margin**: space from the window edge to
  content. **Gap**: space between elements inside a container. **Spacer**: the space between two
  panes; on a foldable it also covers the hinge.
- **Fold**: the hinge or flexible area dividing a foldable's display.
- **Drag handle**: the control that resizes or collapses panes.
- **Rulers**: global alignment lines shared by every layer of the layout.

### Breakpoints (formerly window size classes)

Classify by available window width, never by device type. The same device changes class when it
rotates, unfolds, enters split screen, or when a desktop window is resized.

| Breakpoint | Typical devices | Panes (recommended in bold) | Navigation |
|---|---|---|---|
| Compact | phone held upright | **1** | navigation bar, or a modal expanded navigation rail |
| Medium | tablet or open foldable held upright | **1**, or 2 | navigation rail with one pane; navigation bar with two panes |
| Expanded | phone or tablet sideways, open foldable sideways, desktop | 1 or **2** | navigation rail, collapsed or expanded |
| Large | desktop | 1 or **2** | navigation rail, collapsed or expanded |
| Extra-large | desktop, very wide monitor | 1, **2**, or 3 | navigation rail; the expanded form fits best here |

The width ranges are in [Measurements](#measurements).

- Large and extra-large exist mainly for laptop and desktop web. A product may skip them; decide
  from the platform's conventions and its audience.
- Android also offers compact, medium and expanded classes for **height**. Because most screens
  scroll vertically, layouts rarely need to react to them.
- Each view should have a layout for every breakpoint that matters on its platform, and should
  switch automatically when the class changes.

Per-breakpoint component choices (the site's recommendation table, restated):

| Need | Compact | Medium | Expanded and wider |
|---|---|---|---|
| Primary navigation | navigation bar or modal expanded rail | collapsed rail, or modal expanded rail | collapsed rail, or standard (or modal) expanded rail |
| Communication | basic or full-screen dialog | basic dialog | basic dialog |
| Supplemental choices | bottom sheet | menu | menu |

#### Compact

- One pane. Keep navigation low on the screen, near the thumb.
- Plan the jump to a larger layout: unfolding, rotating to landscape, leaving split screen, or
  growing a window must all re-layout live.

#### Medium

- One pane is the default, because width is still tight. Two panes are acceptable only for
  low-density content with obvious actions, such as a settings list beside its options; avoid two
  panes for dense content.
- In a two-pane medium layout, split the width evenly and do not invent custom widths. Use a
  navigation bar (not a rail) so both panes get the full width. A drag handle may expand either
  pane to the whole window.
- On secondary destinations the navigation rail may be hidden, provided back navigation still
  reaches the primary destination.
- **Reachability** on sideways tablets and open foldables: the top quarter of the screen is hard to
  reach without shifting grip, and the very bottom edge is awkward for large hands. Keep frequent
  interactions in the comfortable middle band.

#### Expanded

- Two panes usually work best. A single pane suits dense or immersive content such as video.
- Use a navigation rail (collapsed or expanded) near the window edge. Put sorting, filtering and
  secondary navigation inside the pane (for example as tabs), not in the global navigation.
- Fixed-and-flexible layouts give the fixed pane a default width (see
  [Measurements](#measurements)); split-pane layouts keep the spacer visually centered.
- Plan the reverse transitions too: folding, rotating to portrait, entering split screen or
  multi-window, and shrinking a window.

#### Large and extra-large

- Two panes are the default; one pane only for dense content or media.
- Expanded navigation rails suit extra-large windows. Collapse the rail when the content needs
  room or when the person is deep in the hierarchy.
- In a split-pane layout the spacer stays centered even with an expanded rail: the rail eats into
  the leading pane only.
- Extra-large may add a **standard side sheet as a third pane**; the rail can then stay, collapse,
  or disappear. Never go beyond three panes.
- Watch line length on very wide windows (see [Spacing](#spacing)).

### The layout scaffold: bars, rails, panes

Fill the scaffold from the outside in: bars and rails first, then panes in the remaining space.

#### Bars

- A bar spans one pane or the whole window. The app bar sits at the top (title plus one or two key
  actions such as search or back); the navigation bar sits at the bottom and switches between three
  to five top-level views at compact and medium widths.
- Bars sit next to the safety regions, never inside them.

#### Rails

- On compact screens the top and bottom rail regions carry screen-level controls: a toolbar
  (which may float), a chat input, a FAB.
- On larger screens the sides become rail regions too. The leading side usually holds the
  navigation rail; the trailing side holds controls that act on the pane's content, such as a
  vertical toolbar.
- In XR full space, rail components can become **orbiters** that float outside the content.

#### Panes

- **Fixed** panes keep their width; **flexible** panes grow and shrink. Every layout needs at least
  one flexible pane.
- Panes are **permanent** or **temporary**. A temporary pane appears and is dismissed on demand,
  and the others resize around it.
- **Single-pane**: one flexible pane filling the width. Valid everywhere, recommended for compact
  and medium.
- **Split-pane** (two flexible panes): the spacer stays visually centered, which suits foldables
  and resizable windows. With a navigation bar or no navigation, each pane takes half the window.
  With a rail or drawer, rail plus first pane take half, and the second pane keeps the other half.
- **Fixed-and-flexible**: common from expanded upward. Either pane may come first. The fixed pane
  is often temporary and holds a side sheet or a light list.
- **Three panes**: extra-large only, with a standard side sheet as the third. Note the site's own
  tension: fixed panes at that size are recommended wider than a side sheet's default maximum
  width (see [Measurements](#measurements)).
- **Containment**: panes can blend with the background (implicit grouping) or use their own
  container color or outline (explicit grouping). Use color for emphasis and tight spacing for
  related content. In XR, panes always need a container color to separate them from passthrough or
  virtual surroundings.

#### Resizing panes with drag handles

- In a split-pane layout either pane can be dragged freely or made to snap to set widths. From
  expanded upward, the recommended snap widths are in [Measurements](#measurements).
- In a fixed-and-flexible layout the handle can collapse the fixed pane completely, switching
  between one and two panes.
- Selecting the handle (tap, double tap or long press) should also toggle between preset sizes.
- **Persistent resizing** (the default for most resizable layouts) remembers the chosen width
  across app restarts and breakpoint changes. A layout collapsed to one pane stays collapsed.
- **Temporary resizing** forgets the width once the pane or app closes and returns to the default.
  Use it for supporting-pane layouts, where people rarely resize.

#### How panes are presented

- **Co-planar**: side by side. Persistent utilities, such as tool panels, belong here so they stay
  reachable.
- **Floating**: a smaller pane above the others, like a dialog. Temporary tasks stay floating at
  every breakpoint. On large screens floating is the default and the scrim is optional.
- **Docked**: pinned to a window edge and partly beyond it, like a bottom sheet.

#### Rulers

- **Bar and safety rulers** mark the usable edges so actionable content (app bars) is never covered
  by system UI.
- The **title ruler** lines up the app bar's title, icons and controls.
- **Content rulers** anchor headlines, hero images and carousels (the first ruler) and the start of
  supporting text or actions (secondary rulers).
- **Margin rulers** have some latitude: shift them in or out to make a product feel tighter or
  airier. Different components may use different margin rulers, for example an edge-to-edge photo
  grid under a search field with wide margins.

### Adaptive design

Adaptive design reacts to the **person** (settings, preferences), the **device** (watch, phone,
foldable, tablet, desktop, XR) and the **usage** (resizing, rotating, switching device). Start
from mobile and make sure the same product scales up to desktop and spatial. Support touch, pointer
and physical keyboard on every device: a tablet with a keyboard and mouse, or a phone on an
external monitor, becomes a desktop. For Compose, the site points to the Navigation 3 library for
showing several destinations at once while keeping them stable across window sizes.

#### Pane strategies

When the window changes, panes adapt in three ways:

- **Show and hide**: panes enter or leave as space allows.
- **Levitate**: a pane rises above the content as a floating or docked pane, near its trigger.
  Floating panes may be draggable or resizable; give those controls accessible alternatives. A
  docked pane on compact can become floating or co-planar at medium and expanded, and should
  usually become co-planar on large screens.
- **Reflow**: panes move. A supporting pane drops below the primary pane in portrait, and panes
  stack vertically when width runs out.

#### Component strategies

- **Resize**: components grow with their container or hug their content (a button may stretch, or
  stay content-sized and keep its alignment).
- **Show and hide**: reveal or collapse detail (a list item gains a description on a tablet).
- **Change presentation**: orientation, color, type, shape, or configuration (a FAB becomes an
  extended FAB; a rail opens to its expanded form).

#### Five questions when moving to the next breakpoint

Design one breakpoint first, then for the next size ask:

1. **Reveal**: what was hidden that now fits (an expanded rail, a second pane with the selected
   item)? More space is a chance for more structure, not bigger copies.
2. **Divide**: one pane at compact and medium, two at expanded and large, consider three at
   extra-large.
3. **Resize**: cards, feeds and lists can grow, adjusting margins, orientation, text size and
   density.
4. **Reposition**: move cards, add a content column, add negative space, and move actions from the
   bottom to the leading edge for reach. Children can anchor start, end or center as their parent
   grows, or stay fixed (the FAB inside a rail; a button's icon and label stay together).
5. **Swap**: exchange components only for functionally equivalent ones with an ergonomic reason.

| Role | Compact | Medium | Expanded |
|---|---|---|---|
| Navigation | navigation bar | collapsed navigation rail | collapsed navigation rail |
| Navigation (expanded form) | modal expanded rail | modal expanded rail | standard expanded rail |
| Communication | basic or full-screen dialog | basic dialog | basic dialog |
| Supplemental selection | bottom sheet | menu | menu |

At large and extra-large a collapsed rail may also swap to an expanded rail. Never swap a button
for a chip or a menu; treat list item to card swaps with care.

### Canonical layouts

Three ready-made starting points, each defined for compact, medium and expanded, available as
Figma kit layouts and as Compose and MDC-Android samples. Build custom layouts on top of them, or
layer scaffold parts.

#### Feed

- A grid of cards or list items for browsing (news, photos, social).
- Compact: a single column of full-width items. Medium: columns may appear. Expanded and wider:
  usually more columns, which may also widen. The site's examples show two columns growing to four
  between phone and tablet.
- Items may differ in size; use size and position to show relationships. Items reflow on rotation,
  unfolding or multi-window, and their order follows position.

#### List-detail

- Two panes with a parent-child relation: inbox and email, conversations and thread, folders and
  files, artist and album, settings and category.
- Compact (including a closed foldable or a tablet in split screen): one pane at a time.
- Medium: one pane for dense or focused content, two panes for quick browsing; give the panes all
  the width by using a navigation bar or a modal rail.
- Expanded and wider: two panes.
- Single pane shows a back button in the detail view; two panes show the selection state in the
  list. Never both.
- Switching layouts:
  - Nothing selected: one pane shows the list; two panes show placeholder content in the detail
    pane (an empty state on an unfolding foldable).
  - Something selected, growing to two panes: show both, with the item's details visible.
  - Shrinking to one pane: usually show the detail with an app bar. If the product selects without
    navigating deeper (multi-select), the list can stay with the item selected. Return to whichever
    view was showing before.
  - Keep read state and each detail view's scroll position when moving between items.

#### Supporting pane

- A primary area (roughly two thirds of the window) plus a secondary area whose content only makes
  sense next to the primary (document and comments, media and related items, productivity tools).
  For parent-child content use list-detail instead.
- Compact and medium: the supporting pane sits below the focus pane, flexible in width; on compact
  a bottom sheet works well. Expanded: it sits leading or trailing, at a fixed width.

#### Custom: layering

Use the levitate strategy to lay a pane over the content for a focused task, such as reviewing a
basket, answering comments, or creating an event.

### Grids and columns

- Rails and panes sit on a grid whose column count, column width and spacing change with the
  breakpoint. Fewer columns keep compact screens focused; more columns enrich larger ones. The
  site's examples use four columns on a phone and eight on an unfolded foldable, with each of two
  panes four columns wide on a tablet.
- Grid structure and spacing values also carry personality.

### Spacing

Spacing does three jobs:

- **Group**. Explicit grouping uses outlines, dividers or shadows, and can signal interactivity
  (a card, list items between dividers). Implicit grouping uses proximity and white space only (a
  carousel's tightly spaced items). Support it with rhythm (even gaps between related items, even
  when heights vary), similarity (like items share size and spacing; leading thumbnails, avatars
  and icons align), proximity (actions sit next to what they affect) and continuity (related items
  share a row, column or container, like a row of chips acting as one control).
- **Direct attention**. Keep key actions and information in consistent places across screens so
  they become familiar focal points; frame what matters with generous negative space and the
  brightest surfaces.
- **Express**. Tight spacing reads as serious and focused; open spacing reads as calm. Desktop
  layouts can afford more generous spacing than mobile ones, and the spacing system adapts to
  breakpoint and density.
- Keep body text at roughly 40 to 60 characters per line by adjusting margins and type styles at
  every breakpoint.

### Density

- **Information density** is how much content fits in an area; changing margins, spacers and
  padding changes it. High density helps scanning and comparing (tables, dashboards, finance,
  news); low density suits focused, aesthetic or simple products.
- **Component density** (component scaling) shrinks a component's internal spacing on a numbered
  scale: 0 is the default and each step down (-1, -2, -3) is tighter. Keep the grouped content
  centered in the container and never change text size with density.
- Do not change density automatically when the breakpoint or orientation changes; a person may want
  dense on desktop and roomy on mobile.
- Do not raise density for focused choices (menus) or for components that announce changes
  (snackbars, dialogs).
- Make density opt-in through settings, not the default.

### Bidirectionality (RTL)

- Support right-to-left reading as a layout rule: correct alignment and text direction, plus
  mirrored navigation and gestures, as detailed below.
- More than two billion people read right to left (Arabic, Hebrew, Persian, Urdu and others).
  Mirror the layout: alignment and order flip and reading starts at the top right. Material names
  things "leading" and "trailing" so components mirror, but some cases need extra work.
- Text needs both RTL alignment and RTL direction; LTR direction on RTL text scrambles word order.
  Watch text entry, cursor position, punctuation, phone numbers and URLs. An email address keeps
  the domain to the right of the user name.
- Mirror directional icons (back, forward, send). Help icons mirror only in some languages (Urdu,
  Persian). Never mirror clocks, circular refresh arrows or other clockwise symbols.
- Time: linear progress fills from the right in most RTL languages but stays left to right in
  Hebrew; circular progress stays clockwise; media controls and their progress are always left to
  right; clocks keep their direction but 12-hour AM/PM moves to the left.
- Charts and graphs keep LTR direction for Persian and Urdu; Hebrew keeps timelines and media
  controls LTR.
- All three canonical layouts mirror. The navigation rail (collapsed or expanded) always opens
  from the leading edge, which is the right edge in RTL. Badges move to the top left of their
  icon; toolbars reverse their tool order; app bars mirror and flip arrows; text-field and chip
  icons swap sides (a chip's trailing icon stays at the end).
- Swipe gestures and predictive back mirror too: an action revealed by swiping one way in LTR is
  revealed by swiping the other way in RTL.

### What the 2026 refresh changed

The layout pages carry a "What's new" dated May 2026; the grids and spacing pages list "Expressive
spacing guidelines" in theirs. Treat these as the Expressive-era layout changes:

- Renames: window size classes became breakpoints; responsive layout became adaptive design.
- The **layout scaffold** (bars, rails, panes, safety regions) is new and is now the recommended
  way to build any layout, together with **rulers** as shared alignment lines.
- Guidance now covers three experience types: mobile (phones, foldables, tablets), desktop
  (free-form windows, including tablets and phones driven like desktops) and spatial (XR, where a
  navigation rail can become an orbiter and panes become spatial panels with explicit containment).
- Canonical layout examples were updated and now explicitly demonstrate the scaffold.
- A **spacing system** was introduced, with spacing framed as expression: margin rulers may move in
  or out to create calm or dramatic moments in content-led products.

## Measurements

Values are from the site unless a token marker stands alone. No platform defines a breakpoint,
margin, spacer or pane-width token. A spacing-scale token next to a margin or spacer only records
that the number is also a step of the `md.sys.measurement` scale; that scale exists only in
material_ui's generator data (see Platform mapping).

### Breakpoints, margins, spacers and pane widths

| Breakpoint | Window width | Side margins | Spacer between panes | Default fixed pane |
|---|---|---|---|---|
| Compact | below 600dp [site:/foundations/layout/breakpoints/overview] | 16dp [site:/foundations/layout/breakpoints/compact] [token:md.sys.measurement.space200] | none (one pane) | none |
| Medium | 600–839dp [site:/foundations/layout/breakpoints/overview] | 24dp [site:/foundations/layout/breakpoints/medium] [token:md.sys.measurement.space300] | 24dp [site:/foundations/layout/breakpoints/medium] [token:md.sys.measurement.space300] | none; two panes split 50% each [site:/foundations/layout/breakpoints/medium] |
| Expanded | 840–1199dp [site:/foundations/layout/breakpoints/overview] | 24dp [site:/foundations/layout/breakpoints/expanded] [token:md.sys.measurement.space300] | 24dp [site:/foundations/layout/breakpoints/expanded] [token:md.sys.measurement.space300] | 360dp [site:/foundations/layout/breakpoints/expanded] |
| Large | 1200–1599dp [site:/foundations/layout/breakpoints/overview] | 24dp [site:/foundations/layout/breakpoints/large-extra-large] [token:md.sys.measurement.space300] | 24dp [site:/foundations/layout/breakpoints/large-extra-large] [token:md.sys.measurement.space300] | 412dp [site:/foundations/layout/breakpoints/large-extra-large] |
| Extra-large | 1600dp and wider [site:/foundations/layout/breakpoints/overview] | 24dp [site:/foundations/layout/breakpoints/large-extra-large] [token:md.sys.measurement.space300] | 24dp [site:/foundations/layout/breakpoints/large-extra-large] [token:md.sys.measurement.space300] | 412dp [site:/foundations/layout/breakpoints/large-extra-large] |

- The canonical-layout pages write the same ranges as compact 0–599, medium 600–839, expanded
  840 and up, large 1200–1599, extra-large 1600 and up (in dp, without the unit on the page).
- Split-pane layouts: rail (if any) plus the first pane take 50% of the window width [site:/foundations/layout/scaffold/panes];
  the second pane takes the rest.
- Recommended snap widths when resizing a two-pane layout at expanded and wider:
  360dp and 412dp [site:/foundations/layout/scaffold/panes].
- Supporting pane at expanded: fixed width of 360dp [site:/foundations/layout/canonical-examples/supporting-pane];
  flexible width below the focus pane at compact and medium.
- Side sheet used as a third pane: default maximum width 400dp [site:/foundations/layout/breakpoints/large-extra-large],
  narrower than the 412dp fixed-pane recommendation [site:/foundations/layout/scaffold/panes].
  The docked side-sheet token gives a container width of 256dp [token:md.comp.sheet.side.docked.container.width];
  no token states a maximum width [NOT FOUND].
- Reachability at medium (sideways tablets, open foldables): keep interactions out of the top
  25% of the screen where possible [site:/foundations/layout/breakpoints/medium].
- Pixels per inch and dp: one dp is one physical pixel on a 160 dpi screen; dp = px × 160 ÷ dpi.
  A 1.5 inch wide screen is 240dp wide at any density [site:/foundations/layout/grids-spacing/density]:
  180 px at 120 dpi, 240 px at 160 dpi, 360 px at 240 dpi [site:/foundations/layout/grids-spacing/density].

### Pane drag handle

The pane drag handle is a vertical pill. Each token cited below has a value on material-web, in
material_ui's generator data and in Compose, and none needs a `[differs:]` marker. (Its hover and
focus state-layer tokens have no Compose value, and its dragged-state tokens exist only in Compose.)

| Property | Value |
|---|---|
| Handle width, resting | 4dp [token:md.comp.drag-handle.width] |
| Handle height, resting | 48dp [token:md.comp.drag-handle.height] |
| Handle width, pressed | 12dp [token:md.comp.drag-handle.pressed.width] |
| Handle height, pressed | 52dp [token:md.comp.drag-handle.pressed.height] |
| Container (touch) width | 24dp [token:md.comp.drag-handle.container.width] |
| Shape | fully round at rest [token:md.comp.drag-handle.shape], medium corner when pressed [token:md.comp.drag-handle.pressed.shape] |
| Color | outline at rest [token:md.comp.drag-handle.color], on-surface when pressed [token:md.comp.drag-handle.pressed.color] |

### Density

- One component density step usually removes 4dp [site:/foundations/layout/grids-spacing/density]
  from the top and bottom padding or from the overall height.
- The site's text-field example keeps 20dp between label and input [site:/foundations/layout/grids-spacing/density].
- Targets stay at least 48 × 48dp at any density [site:/foundations/layout/grids-spacing/density];
  settings that turn density on or off always use the default target size.

### Spacing scale

The spacing system's steps, as material_ui's generator data names them (no web or Compose value):

| Step | Value | Step | Value | Step | Value |
|---|---|---|---|---|---|
| space0 | 0dp [token:md.sys.measurement.space0] | space150 | 12dp [token:md.sys.measurement.space150] | space450 | 36dp [token:md.sys.measurement.space450] |
| space25 | 2dp [token:md.sys.measurement.space25] | space175 | 14dp [token:md.sys.measurement.space175] | space500 | 40dp [token:md.sys.measurement.space500] |
| space50 | 4dp [token:md.sys.measurement.space50] | space200 | 16dp [token:md.sys.measurement.space200] | space600 | 48dp [token:md.sys.measurement.space600] |
| space75 | 6dp [token:md.sys.measurement.space75] | space250 | 20dp [token:md.sys.measurement.space250] | space700 | 56dp [token:md.sys.measurement.space700] |
| space100 | 8dp [token:md.sys.measurement.space100] | space300 | 24dp [token:md.sys.measurement.space300] | space800 | 64dp [token:md.sys.measurement.space800] |
| space125 | 10dp [token:md.sys.measurement.space125] | space400 | 32dp [token:md.sys.measurement.space400] | space900 | 72dp [token:md.sys.measurement.space900] |

The layout pages do not say which step each margin, gap or padding should use [NOT FOUND].

## Accessibility

- Interactive targets: at least 48 × 48dp [site:/foundations/layout/grids-spacing/density]
  (48 × 48 CSS pixels on the web), even when the visible icon or button is smaller. Do not let
  component density push targets below that by default.
- Density must be something a person chooses and can easily undo.
- Reachability: keep primary controls near reachable edges (bottom on compact, leading edge on
  medium and expanded) and out of the hard-to-reach top band of large handheld screens.
- Focus order:
  - Co-planar panes: focus moves in the same order the panes appear on screen.
  - Modal floating pane: content behind it is inert; focus jumps to its first element and, on
    close, returns to whatever opened it. If it opened on its own, return focus to the next sensible
    element. Interacting outside dismisses it.
  - Non-modal floating pane: the rest of the product stays usable; focus can enter and leave the
    pane, which sits in a logical place in the reading order.
  - Docked panes follow the modal or non-modal rules above, depending on their behavior.
- Draggable or resizable floating panes and drag handles need non-drag alternatives (tap, double
  tap or long press toggles on the handle; accessible move or resize controls).
- Readable line length (about 40 to 60 characters) at every breakpoint.

## Platform mapping

- **Jetpack Compose** (material3 1.5.0-rc01):
  - Bars and safety regions: `Scaffold` with `topBar`, `bottomBar` and `contentWindowInsets`
    (the inset handling corresponds to the safety regions).
  - Navigation per breakpoint: `NavigationBar` and `ShortNavigationBar`; `NavigationRail`;
    `WideNavigationRail` (collapsed and expanded) and `ModalWideNavigationRail`.
  - Rail-region toolbars: `HorizontalFloatingToolbar`, `VerticalFloatingToolbar`.
  - Pane drag handle: `VerticalDragHandle` with `VerticalDragHandleDefaults`.
  - Breakpoints (window size classes), pane scaffolds for the canonical layouts, rulers and
    Navigation 3 are **not** in the pinned material3 sources. The site links them as separate
    Compose resources; this note names no API for them.
- **Flutter** (`material_ui` 1.11.0):
  - `Scaffold` with `appBar`, `bottomNavigationBar`, `drawer`, `endDrawer`, `bottomSheet` covers
    bars and the docked bottom pane. `NavigationRail` (with `extended`) and `NavigationBar` cover
    navigation.
  - No breakpoint helper, pane scaffold, ruler or pane drag handle was found in `lib/`. The
    bottom-sheet handle is a private widget. The only width switch we found is private: the
    licenses page changes to a master-detail flow at a width of 840
    [impl:material_ui/packages/material_ui/lib/src/about.dart:1363].
  - The `md.sys.measurement` spacing scale and the `md.comp.drag-handle` values exist only in the
    generator data (`tool/gen_defaults/data/`), not as public API.
  - Breakpoint logic and pane layouts are therefore ours to build (Phase 3), using the values in
    [Measurements](#measurements).
- **Web**: no maintained official component or layout helper. Our CSS layout (breakpoint media or
  container queries, margins, panes) is built in Phase 3 from the site values above and
  material-web's drag-handle and side-sheet tokens.

## Pitfalls

- Designing for named devices instead of width classes; rotation, unfolding and multi-window
  change the class on the same device.
- Two dense panes at medium width. Two panes there are for light content only.
- Custom pane widths in a medium two-pane layout instead of an even split.
- A layout with no flexible pane, or more than three panes.
- Letting an expanded rail push the spacer off center in a split-pane layout; the rail should take
  its space from the leading pane only.
- Assuming a side sheet can fill a 412dp fixed pane [site:/foundations/layout/scaffold/panes];
  its default maximum is 400dp [site:/foundations/layout/breakpoints/large-extra-large].
- Showing a back button in a two-pane list-detail, or a selection state in single-pane mode.
- Losing the selection, scroll position or read state when the layout changes.
- Resetting a person's chosen pane width on a breakpoint change (persistent layouts must keep it).
- Swapping components that do different jobs (button for chip or menu) just because the window
  grew.
- Changing density automatically with the breakpoint, or making dense mode the default.
- Putting content in the safety regions, or app bars where system UI can cover them.
- Mirroring things that must stay put in RTL: clocks, media controls, circular arrows, Hebrew
  timelines and progress.
- Treating more space as permission to scale everything up instead of revealing more structure.
