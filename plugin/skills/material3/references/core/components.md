# Components

Pick the component by job, then open its section (the Section column is the heading anchor) in
`references/<platform>/components.md` for the API, the skill asset (if any) and the exact tokens.
`<platform>` is `web`, `flutter` or `compose`.

| Component | Use it when | Key rule | Section |
|---|---|---|---|
| Button (filled, tonal, outlined, text, elevated) | A discrete action whose label says what happens in one to three words | One filled button per area; elevated only on busy backgrounds; sentence-case label, at most one icon | `#buttons` |
| Icon button | A common action an icon alone explains (search, share, favorite, more) | Filled style sparingly; toggles switch to the filled glyph when selected; every one has an accessible name and a full-size target | `#icon-buttons` |
| Button group | Related actions together (standard), or toggles that pick options or views (connected) | Stays on one line, overflow goes to a menu; every button in a connected group is a toggle | `#button-groups` |
| Split button | One clear primary action with close variants (send / schedule send) | Menu holds variants of the main action only; trailing icon stays | `#split-button` |
| Segmented button (retired) | Only when the request names it | Two to five short options; selection shown beyond color | `#segmented-buttons` |
| FAB (FAB, medium, large) | The screen's single primary, constructive action (create, compose, start) | One per screen; never destructive or minor; hide it, never disable it; medium is the default size | `#floating-action-button` |
| Extended FAB | The primary action needs a short label, or must stay reachable on a long scrolling screen | One per screen; short label; not on cards or toolbars; never opens a FAB menu | `#extended-fab` |
| FAB menu | A FAB's action splits into two to six related kinds | Opens only from a FAB; labelled items; matching color set | `#floating-action-button-menu` |
| Card (elevated, filled, outlined) | Several pieces of content about one subject read as a unit, or open a detail view | No buttons inside a fully clickable card; one resting level per collection; do not card-wrap what spacing already groups | `#cards` |
| Carousel | Browsing visual items, several at once or one featured at a time | Snap scrolling for multi-browse and hero; short text; a show-all path on long pages | `#carousel` |
| List | Finding one item among many and acting on it | Same structure in every row; one selection control type per list; swipe actions also reachable by tap | `#lists` |
| Divider | Separating sections (full width) or items in a group (inset) | Only where spacing is not enough; inset lines align with the content's leading edge | `#divider` |
| Chip (assist, filter, input, suggestion) | Contextual options, filters, entered tokens or suggestions next to content | Not for primary or flow actions (use buttons); never a lone chip; short labels | `#chips` |
| Checkbox | Several options can be chosen, or a parent selects its children | Whole label row is clickable; parent shows the indeterminate value when children are mixed | `#checkbox` |
| Radio button | Exactly one of a few (up to about five) visible options | Vertical list; labels clickable; never nested | `#radio-button` |
| Switch | One independent setting that applies immediately | Never for choices applied on save or for two opposing views; label names the setting | `#switch` |
| Slider | Picking a value on a range where seeing the result live helps | Pair with a text field when the exact value matters; range sliders stay horizontal | `#sliders` |
| Text field (filled, outlined) | Typed input: names, messages, amounts, addresses, anything not picked from a few known options | Always a visible label; one style per form; error replaces supporting text and is not color-only | `#text-fields` |
| Search (bar, view, search app bar) | Many items to sift through; search is an entry point | Hint says what is searched; at most two trailing icons; full-screen view on compact only | `#search` |
| Date picker (docked, modal, input) | Picking a date or a date range | Always allow typing the date; modal input or docked for distant dates (birth date) | `#date-pickers` |
| Time picker (dial, input) | Picking a clock time | Always offer typed entry; follow the locale's 12- or 24-hour clock | `#time-pickers` |
| Menu | Occasional actions or options: overflow, select, context menu | One action per item; disable unavailable items rather than removing them; bottom sheet for long labels on compact | `#menus` |
| Dialog (basic, full-screen) | A blocking decision, a risky confirmation, or a short focused task | Specific headline; at most two actions, dismissive first; full-screen only on compact | `#dialogs` |
| Snackbar | Brief confirmation of a finished process, optionally with Undo | Never for decisions; one at a time; at most one text action | `#snackbar` |
| Tooltip (plain, rich) | Naming an icon-only control (plain) or a short explanation (rich) | Never repeats a visible label; never holds critical information | `#tooltips` |
| Badge | Unread count or a status dot on an icon or destination | Short counts; anchored to the icon corner; cleared when the destination is opened | `#badges` |
| Progress indicator (linear, circular) | Work longer than about five seconds, or with measurable progress | Determinate only for real progress; one variant per kind of process across the product | `#progress-indicators` |
| Loading indicator | Short unmeasured waits, pull-to-refresh, busy buttons | Never decorative; never turns into a determinate indicator; contained version over busy content | `#loading-indicator` |
| Bottom sheet (standard, modal) | Secondary content or a long action list on compact windows | Never the screen's main content; modal opens at most half height; side sheet on wide windows | `#bottom-sheets` |
| Side sheet (standard, modal) | Filters or details beside the main content on medium and wider windows | Has a close button; no wide tables; standard sheets resize the body instead of covering it | `#side-sheets` |
| App bar (small, medium flexible, large flexible, search app bar) | Page title, back or menu, and up to two key page actions | More actions go to a toolbar; square corners; title not truncated | `#app-bars` |
| Toolbar (docked, floating) | Page actions beyond what an app bar holds; global (docked) or contextual (floating) | Never with a navigation bar on the same screen; one emphasized action | `#toolbars` |
| Navigation bar (flexible) | Three to five top-level destinations on compact and medium windows | Labels always shown; one active item with filled icon; not on wide layouts | `#navigation-bar` |
| Navigation rail (collapsed, expanded) | Top-level navigation on medium and wider windows; expanded for more destinations | Never with a navigation bar; FAB above the destinations; labels never truncated | `#navigation-rail` |
| Navigation drawer (retired) | Only when the request names it or the product is classic M3 | Never with a navigation bar; modal drawer closes on scrim tap and swipe | `#navigation-drawer` |
| Tabs (primary, secondary) | Parallel categories of content inside one page | Not for steps or top-level app navigation; one style per set; secondary tabs sit under primary | `#tabs` |

Choosing between neighbors:

- Action vs choice: buttons act, chips filter or suggest, connected button groups and radio
  buttons choose, switches toggle a setting.
- Navigation by width: navigation bar on compact, collapsed rail from medium, expanded rail when
  there are many destinations (layout.md).
- Steps of a flow: a determinate linear progress indicator with "Step n of m", under a top app
  bar with a back button; never hand-drawn step bars.
- Color or finish options: round swatches of the real colors, the selected one ringed, the name as
  the label; never text-only pills.
- Every screen has a top app bar with its title; screens below the top level add a back button.
