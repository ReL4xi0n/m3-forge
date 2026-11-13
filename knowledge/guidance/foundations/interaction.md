---
title: Interaction
kind: foundation
pages: [/foundations/interaction/states/overview, /foundations/interaction/states/state-layers, /foundations/interaction/states/applying-states, /foundations/interaction/gestures, /foundations/interaction/inputs, /foundations/interaction/selection, /components/lists/accessibility, /components/cards/accessibility, /components/bottom-sheets/accessibility]
tokenSets: [sys.state]
expressive: false
fetched: 2026-11-13
---

## Summary

Interaction covers how a UI reacts to people: the visual states a component can be in (and the
state layers that draw them), the touch gestures it answers to, how it behaves with a mouse,
trackpad, stylus or physical keyboard, and how items get selected. The core idea is a small,
fixed vocabulary of states, each drawn the same way on every component, so users learn it once.

## Rules

### States

- Six interaction states: enabled, disabled, hovered, focused, pressed, dragged. Selected and
  activated are separate conditions that can sit underneath them.
- Each state should be signalled by two visual cues, not one (for example a state layer plus an
  elevation or outline change), so it does not rely on a single channel such as color.
- States stack: a chip can be selected and hovered at once. Apply them the same way on every
  component.
- At most one element in a layout is hovered, one is focused, one is pressed and one is dragged
  at any moment. Any number of elements can be disabled.

### State layers

- A state layer is a translucent overlay that shows the current state. It sits between the
  container (below) and the content (icon, label) above.
- Its color is the content color of the component, normally the "on" role paired with the
  container: a secondary container with on-secondary-container content gets an
  on-secondary-container layer; a surface container with primary content gets a primary layer.
  With an icon and a label, the label's color is the fallback when no icon exists.
- Only the opacity changes per state, and it is fixed (see Measurements). Only one state layer is
  drawn at a time.
- The layer can cover the whole component, part of it, or be a circle over part of it (for
  example around a checkbox or a switch handle).

### Applying each state

- Enabled: the component's default styling.
- Disabled:
  - Shown by color changes and lower (or no) elevation. Disabled elements are exempt from contrast
    requirements.
  - Cannot be focused, pressed or dragged and shows no hover layer.
  - Controls that act, select or take input can be disabled (for example a button, icon button,
    checkbox, radio button, switch, chip, segmented button, text field, card or list item).
  - Surfaces that inform, contain or navigate cannot: tooltips, badges, dialogs, menus, sheets,
    app bars, tabs and the navigation bar, rail and drawer. The FAB is also on this side: when its
    action is unavailable, remove the FAB rather than greying it out.
- Hovered:
  - Starts when a cursor rests on an interactive element. Low-emphasis layer that fades in and out.
    No token gives the fade timing [NOT FOUND].
  - Applies to action, selection and input components (including chips, segmented buttons, date
    and time pickers, sliders). In an app bar only the individual actions get hover, not the bar.
  - Combines with focused, activated, selected and pressed.
- Focused:
  - Starts from Tab (or an equivalent key or voice command). A higher-emphasis layer than hover.
  - On the web, a keyboard-focused element also shows a ring-shaped focus indicator so users can
    see where they are.
  - Applies to every interactive component; banners, cards used as containers and whole app bars
    do not take focus themselves, their actionable children do.
  - Combines with hovered, activated and selected.
- Pressed:
  - From a tap, click, keyboard or voice activation. High emphasis, drawn as a ripple from the
    touch point. Some components (buttons, cards) also raise their elevation.
  - Applies to action, selection and some containment components, not to communication or
    navigation containers.
- Dragged:
  - When an element is pressed and moved. Low emphasis so it does not distract. List items, chips
    and cards may also lift in elevation.
  - Applies to some containment and selection components (list items, cards, chips, sliders).
    Components with a fixed position, like an app bar, never take it.

### Gestures

- Respond in real time while the finger moves.
- Tap opens or activates; double tap zooms in or out; long press reveals extra functions (often
  selection); scroll and pan move content in any direction; swipe moves between peer views (tabs)
  or completes an action on an item; drag moves items or slides surfaces; long press then drag
  picks up and reorders; pinch scales content; compound gestures (pan while pinching on a map)
  flow into each other.
- Predictive back (Android): a sideways swipe previews going back, and the user can still cancel
  before releasing. Supported on bottom sheets, side sheets, navigation bar and rail, and search.

### Inputs

- Support touch, mouse, trackpad, stylus and physical keyboard on every device class (phone,
  tablet, foldable, TV, laptop, desktop). People switch input mid-task.

| Input action | Expected behaviour |
|---|---|
| Mouse or trackpad movement | Show a cursor, whatever the device type |
| Primary click | Handle as a click, not as a touch event; still show the pressed ripple |
| Secondary click (or two-finger click) | Open a context menu for the clicked object |
| Hover | Show the hover state; show a tooltip where one exists |
| Click and drag over text | Select text |
| Wheel or two-finger drag | Scroll the list under the cursor, vertically or horizontally |
| Trackpad pinch | Zoom the element or page |
| Physical keyboard attached / removed | Hide / show the on-screen keyboard |

- Cursor shapes: arrow pointer by default; hand over links and linked images; resize arrows on
  resizable edges; I-beam over text. A stylus usually needs no cursor unless it shows the tool
  (for example brush size).
- Editable text with a pointer: one click places the caret, two select a word, three select a
  paragraph, a further single click clears the selection.
- Text selection: highlight in one color. Show touch handles only for touch input; with a mouse,
  trackpad or stylus, show the I-beam and the right-click menu instead, even on a touch device.
- Dragging in a text area scrolls it on touch but selects text with a mouse.
- Devices that do not recognise a mouse treat it as touch.
- Keyboard: Enter performs the main action (send a message); Space plays or pauses media; Tab
  follows a logical left-to-right, top-to-bottom order and shows the focus ring; Escape closes
  menus, dialogs and sheets, clears focus indicators and selections, and removes the text caret
  without deleting typed text.

### Selection

- Show selection with a check mark, a checkbox, a surface color change, or a mix.
- Selection is built into the selection controls (checkbox, radio button, switch, slider), into
  chips, icon buttons and segmented buttons, into item containers (list and menu items, cards,
  data-table rows) and into pickers.
- Navigation bar, drawer, rail and tabs show the current destination with an active indicator
  instead; exactly one item is selected, and the indicator's shape and color vary by component.
- Touch: enter selection mode with a long press or a shortcut (tap an avatar), then tap more items
  to add them. Leave by deselecting every item or by an action in the toolbar.
- Batch selection: long press and drag across items, unless long-press-drag already means "pick up
  and move" in that view.
- Pointer: when selection is the main task, show checkboxes all the time. When it is secondary,
  reveal one item's checkbox on hover, and all checkboxes once one item is selected.

## Measurements

State-layer opacities (material-web, canonical):

| State | Opacity |
|---|---|
| Hovered | 8% [token:md.sys.state.hover.state-layer-opacity] [site:/foundations/interaction/states/state-layers] |
| Focused | 10% [token:md.sys.state.focus.state-layer-opacity] [site:/foundations/interaction/states/state-layers] |
| Pressed | 10% [token:md.sys.state.pressed.state-layer-opacity] [site:/foundations/interaction/states/state-layers] |
| Dragged | 16% [token:md.sys.state.dragged.state-layer-opacity] [site:/foundations/interaction/states/state-layers] |
| Disabled | 38% [token:md.sys.state.disabled.state-layer-opacity] [site:/foundations/interaction/states/state-layers] |

- Hover, focus, pressed and dragged opacities hold on all three platforms
  [same:md.sys.state.hover.state-layer-opacity] [same:md.sys.state.focus.state-layer-opacity]
  [same:md.sys.state.pressed.state-layer-opacity] [same:md.sys.state.dragged.state-layer-opacity].
- The disabled value exists for material-web and Flutter; Compose's state tokens have no disabled
  entry [NOT FOUND]. Components apply the 38% [token:md.sys.state.disabled.state-layer-opacity]
  to disabled content (see buttons.md#color-roles-and-state-layers).
- Circular state layers are 40dp [site:/foundations/interaction/states/state-layers] [token:md.comp.checkbox.state-layer.size].
- The interactive target around them is 48dp [site:/foundations/interaction/states/state-layers].
- Checkbox, radio button and switch carry the layer size as a token:
  40dp [token:md.comp.radio-button.state-layer.size] [token:md.comp.switch.state-layer.size].
- Focus indicator (the ring):
  - Thickness 3dp [token:md.sys.state.focus-indicator.thickness].
  - Drawn 2dp [token:md.sys.state.focus-indicator.outer-offset] outside the component edge.
  - Inner variant offset: -3dp, that is inside the edge [token:md.sys.state.focus-indicator.inner-offset].
  - Compose has none of these three tokens [NOT FOUND]. Its optional inset ring is set in code:
    outer stroke 2dp [impl:compose-material3/commonMain/androidx/compose/material3/Ripple.kt:353],
    inner stroke 3dp [impl:compose-material3/commonMain/androidx/compose/material3/Ripple.kt:355],
    inner inset 1dp [impl:compose-material3/commonMain/androidx/compose/material3/Ripple.kt:354].

## Accessibility

- Show selection with more than color: pair the color change with a second cue, such as a leading
  check mark or an underline.
- Keyboard focus must be visible: focus layer plus the focus ring on the web.
- Anything done by dragging or swiping needs a single-pointer alternative: the same action from a
  menu or bottom sheet, a more button on a swipeable list item, or a drag handle that changes size
  when selected.
- For swipeable list items, a single tap, double tap or long press can reveal the hidden actions.
- Keyboard: Tab order is logical, Escape dismisses and clears, Enter and Space do what users
  expect.
- Disabled controls cannot take focus.
- **Our practice:** keep essential explanations outside disabled controls, where keyboard and
  screen reader users can still reach them.
- The interactive target stays at 48dp [site:/foundations/interaction/states/state-layers] even
  where the state layer is 40dp [token:md.comp.checkbox.state-layer.size].

## Platform mapping

- Jetpack Compose (material3 1.5.0-rc01):
  - `ripple()` draws the press, hover, focus and drag layers with the `StateTokens` opacities;
    `LocalRippleConfiguration` and `RippleConfiguration` override color or alpha per subtree.
  - Focus defaults to an opacity layer (`RippleDefaults.ThemeConfiguration` is
    `OpacityFocusThemeConfiguration`, Ripple.kt:360). `InsetFocusRingThemeConfiguration` switches
    to a ring, provided through `LocalRippleThemeConfiguration`.
  - Predictive back is built into `ModalBottomSheet`, `ModalNavigationDrawer` and the expanded
    `SearchBar`.
  - Tooltips: `TooltipBox`.
- Flutter (`material_ui` 1.11.0):
  - States are `WidgetState` values (`hovered`, `focused`, `pressed`, `dragged`, `selected`,
    `disabled`); `ButtonStyle.overlayColor` resolves the state layer per state.
  - Ink: `InkWell` / `InkResponse`. With Material 3 the default splash is `InkSparkle` on Android
    (not web) and `InkRipple` elsewhere (`theme_data.dart:508-512`).
  - Predictive back: `PredictiveBackPageTransitionsBuilder` for route transitions.
  - Tooltips: `Tooltip`. Pointer text selection: `SelectionArea`.
- Web: no maintained official component library. Our Phase 3 CSS draws the state layer as a
  pseudo-element in the content color with the opacities above, and the focus ring from the
  `md.sys.state.focus-indicator.*` tokens.

## Pitfalls

- Coloring the state layer with a fixed gray or the container color instead of the content color.
- Stacking two state layers (hover plus pressed) instead of showing one.
- Giving a disabled control hover or focus feedback, or leaving it in the tab order.
- Disabling a FAB instead of hiding it.
- Applying hover, focus or drag to a whole app bar instead of its actions.
- Mouse clicks with no ripple because only touch events were wired.
- Touch selection handles shown during mouse selection, or an on-screen keyboard that stays up
  with a physical keyboard attached.
- Using long press and drag for batch selection in a view where it already reorders items.
