---
title: Side sheets
kind: component
pages: [/components/side-sheets/overview, /components/side-sheets/specs, /components/side-sheets/guidelines, /components/side-sheets/accessibility]
tokenSets: [sheet.side, scrim]
expressive: false
fetched: 2026-11-13
---

## Summary

A side sheet is a tall surface attached to the side of the window (usually the trailing edge) that
offers optional content and actions without taking over the main content: filters, details about
a selected photo, settings. The standard side sheet sits beside the content on medium and
expanded windows; the modal side sheet floats above a scrim and is the better fit for compact
windows.

## Use it when

- Standard: tablet and desktop layouts that need a steady place for contextual tools or extra
  information, for example filters that change the main list, or metadata about the selected
  item. The main content stays usable.
- Modal: phones, where there is no room to sit beside the content. The sheet must be closed
  before the content behind it can be used.
- The sheet can hold its own navigation (a back icon button to an earlier level inside the
  sheet).
- Avoid when:
  - The content needs horizontal scrolling or wide tables; the sheet is narrow.
  - The task is the main task of the screen.

## Anatomy

1. Container. The only required part.
2. Headline.
3. Close icon button. Strongly recommended and required by the accessibility guidance.
4. Back icon button (optional). Goes back a level inside the sheet.
5. Content (optional). Lists of actions, form controls, tabular details.
6. Divider (optional). Separates the action buttons from content, or user content from system
   content.
7. Action buttons (optional). Save, Edit, Download and similar; use fill, tone and elevation to
   rank them.
8. Scrim (modal only).

## Variants

- Standard: docked, flush with the window edge, coplanar with the content. When it opens, the
  body area narrows to make room and keeps its trailing margin.
- Modal: above a scrim; blocks the content until dismissed.
- Detached: a sheet may be inset slightly from the window edges (see Measurements). Do not inset
  it much further, which hides content and blurs how it scrolls.
- Adaptive: a modal sheet on a small window can become a standard sheet on a larger one.

## Expressive

Not covered by the sources. The side sheets pages describe no M3 Expressive change. Compared with
M2 they list right-to-left support (the sheet moves to the left edge), new color mappings with
dynamic color, and rounded corners on the modal sheet.

## States and behavior

- Placement: usually the right edge, away from navigation on the left. In right-to-left languages
  the sheet sits on the left edge and its layout mirrors.
- Size: a fixed width that may be adjusted for the layout; typically the full window height.
- Scrolling: vertical only, independent of the page, so each keeps its own scroll position. No
  horizontal scrolling, and no layout that hints at it.
- Exiting: always offer a way back to the main content, at least a close icon button.
- Predictive back (Android): the sheet lets go of the top and bottom edges and shrinks toward the
  gesture while the previous screen shows behind it; release or fling commits.
- Elevation: modal at level 1 [token:md.comp.sheet.side.docked.modal.container.elevation];
  standard at level 0 [token:md.comp.sheet.side.docked.standard.container.elevation].

## Measurements

From the site's spec tables (standard and modal share these unless noted):

| Property | Value |
|---|---|
| Start and end padding | 24dp [site:/components/side-sheets/specs] |
| Start padding with a leading icon (modal table) | 16dp [site:/components/side-sheets/specs] |
| Space between top elements | 12dp [site:/components/side-sheets/specs] |
| Bottom action area height | 72dp [site:/components/side-sheets/specs] |
| Bottom action area, top padding | 16dp [site:/components/side-sheets/specs] |
| Bottom action area, bottom padding | 24dp [site:/components/side-sheets/specs] |
| Bottom action alignment | Start (left in left-to-right layouts) |
| Maximum width | 400dp [site:/components/side-sheets/specs] |
| Margins when detached | 16dp [site:/components/side-sheets/specs] |
| Modal corner radius | 16dp [site:/components/side-sheets/overview] [token:md.comp.sheet.side.detached.container.shape] |
| Standard (docked) corner radius | 0dp [token:md.comp.sheet.side.docked.container.shape] |

- The guidelines also allow a slight inset of 16dp [site:/components/side-sheets/guidelines] from
  the window edge.
- Default docked width in the token data: 256dp [token:md.comp.sheet.side.docked.container.width].
  The site states only a maximum width, not a default one.
- A modal sheet docked to the edge rounds only the corners facing the content
  [token:md.comp.sheet.side.docked.modal.container.shape].

## Typography

- Headline: title large [token:md.comp.sheet.side.docked.headline.font].
- Action buttons and content use their own components' type styles.

## Color roles and state layers

- Standard container: surface [token:md.comp.sheet.side.docked.standard.container.color].
- Modal container: surface container low [token:md.comp.sheet.side.docked.modal.container.color].
- Headline: on surface variant [token:md.comp.sheet.side.docked.headline.color].
- Divider: outline in the token data [token:md.comp.sheet.side.docked.divider.color]. The site's
  color list names outline variant instead; the repository value wins.
- Focus indicator: secondary [token:md.comp.sheet.side.docked.focus.indicator.color].
- Header actions (text actions in the sheet): label primary; state layers in primary
  [token:md.comp.sheet.side.docked.action.hover.state-layer.color]:
  - Hovered: 8% [token:md.comp.sheet.side.docked.action.hover.state-layer.opacity].
  - Focused: 10% [token:md.comp.sheet.side.docked.action.focus.state-layer.opacity].
  - Pressed: 10% [token:md.comp.sheet.side.docked.action.pressed.state-layer.opacity].
- Scrim (modal): the scrim role at 32% opacity [token:md.comp.scrim.container.opacity].
- Icon buttons in the header follow the icon button colors.

## Motion

- Side sheet motion tokens (duration, easing or spring): none in the token set [NOT FOUND].
- No official Compose or Flutter implementation exists to read motion from, so no code reference
  either [NOT FOUND].
- Behavior described by the guidelines: a standard sheet's entrance pushes the body to narrow;
  predictive back scales the sheet in the gesture direction.

## Accessibility

- People must be able to dismiss the sheet with assistive technology, so a close affordance (such
  as a close icon button) is always present. Without one, people cannot tell whether the sheet is
  temporary or permanent.
- Keyboard and switch: Tab moves through the sheet's actions (for example headline region, close,
  Cancel, Save); Space or Enter activates the focused, enabled control.
- Role: the side sheet is announced as a dialog.

## Platform mapping

- Jetpack Compose (material3 1.5.0-rc01): no side sheet component, and the side sheet tokens are
  NOT FOUND in Compose.
- Flutter (`material_ui` 1.11.0): no side sheet component (the overview also lists Flutter as
  unavailable).
- Android Views (MDC-Android) provides a side sheet; our pinned checkout holds its token
  resources only, so no class names are given here.
- Web: no maintained official component. Our CSS side sheet is built in Phase 3 from the
  material-web token values above.

## Pitfalls

- No close button, especially on a modal sheet.
- Insetting the sheet far from the window edge.
- Horizontal scrolling or wide tables inside the sheet.
- Placing it on the left in a left-to-right app that has navigation there.
- Forgetting to mirror the sheet and its contents for right-to-left languages.
- Standard sheets that cover the content instead of resizing the body.
