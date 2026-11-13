---
title: Designing
kind: foundation
pages: [/foundations/designing/overview, /foundations/designing/color-contrast, /foundations/designing/structure, /foundations/designing/flow, /foundations/designing/elements]
tokenSets: []
expressive: false
fetched: 2026-11-13
---

## Summary

The Designing pages are Material's accessibility checklist for laying out a screen. They take a
visual design and turn it into something that also works as a linear, text-based experience for
screen readers, keyboards and other assistive technology. The approach builds on WCAG and covers
four topics: color contrast, structure (hierarchy, landmarks, headings, target sizes), flow (focus
order, key traversal, shortcuts) and elements (labels and roles).

## Rules

### Start from standard controls

- Native platform controls and semantic HTML already carry the markup that assistive technology
  needs. A home-made replacement for a standard control (for example a custom dialog) has to be
  tested and wired up by hand.
- Accessibility annotations are part of a design spec: mark reading order, focus, roles and labels
  next to the visual spec, not afterwards.

### Color and contrast

- A contrast ratio expresses the difference in relative luminance between two colors. The W3C
  scale runs from 1:1 (no difference) to 21:1 [site:/foundations/designing/color-contrast].
- Text, following the W3C recommendation:
  - Small text: 4.5:1 or more against its background [site:/foundations/designing/color-contrast].
  - Large text (14 pt bold, 18 pt regular, or bigger) and graphics: 3:1 or more
    [site:/foundations/designing/color-contrast].
- Non-text elements that sit in a cluster, such as a row of buttons, need their container to reach
  3:1 against the background [site:/foundations/designing/color-contrast]. Users have to pick
  each one out from its neighbours, and low-vision users depend on that edge.
- A standalone, prominent element such as a FAB is already easy to find, so its container is
  exempt from the container-to-background minimum.
- When you build a cluster, choose components whose containers each pass that minimum on their
  own. One weak container drags down the whole group.
- Disabled elements are exempt from contrast requirements.
- Color helps convey meaning and mood, but pair it with other cues (shape, text, icons, motion) so
  that importance and state never depend on color alone.

### Structure and hierarchy

- Every element added makes a screen harder to parse. Keep elements clearly visible, with
  enough contrast and size, rank them by importance, and make the key information readable at a
  glance.
- Put the most important actions at the top or bottom of the screen, where shortcuts reach them,
  and keep items of equal rank next to each other.
- Screen readers follow the order of the source (the DOM, or the view tree on mobile), not the
  visual layout produced by CSS. Agree the intended reading order with developers so the markup
  is written in that order.
- Web landmarks (ARIA roles) give the page a top-level map. There are eight:
  - `banner`: the site header that repeats on each page. Use one.
  - `navigation`: a set of navigation links. Several are allowed; give each a distinct label
    (for example "Primary" and "Pagination").
  - `search`: the search area.
  - `main`: the main content. Use one.
  - `complementary`: an aside that still makes sense without the main content.
  - `contentinfo`: the footer with information about the site. Use one.
  - `region`: an important block, possibly nested in `main`. Always label it.
  - `form`: a form that collects user input.
- Label any landmark that appears more than once, every region, and any landmark whose purpose a
  label clarifies. Do not repeat the role name inside the label.
- Headings:
  - Derive heading levels from the content hierarchy, not from type size; the visual weight of a
    title does not have to follow its level.
  - Use one H1 for the page title and go down H1–H6 in order without skipping a level.
  - If a visible title is not meaningful as a heading, rename it in the UI or add a label for
    assistive technology.

### Flow: focus and keyboard traversal

- Users must be able to finish every primary and secondary journey with Tab, Shift+Tab, the arrow
  keys, Enter and other common keys, without a mouse or touch screen.
- Keep the default tab order (source order, usually left to right then top to bottom) unless a
  journey needs special handling. Many components already define their internal arrow-key
  traversal; reuse it.
- Plan the flow in three steps:
  1. Sort use cases into primary and secondary journeys; the primary ones decide focus priority.
  2. Set the initial focus for each screen (on the control that serves the most common goal) and
     for composite components such as dialogs or complex cards.
  3. Write down any traversal that departs from the default.
- Focus after a context change: when a dialog opens, focus moves into it, usually to a specific
  control. When it closes or is cancelled, focus goes back to the control that opened it.
- Key roles: Tab moves between interactive elements and Shift+Tab goes back; arrow keys move inside
  a component (menu items, grid cells); Enter activates a link or button or submits a form.
- A dense group of controls can be a single tab stop whose children are reached with the arrow
  keys.
- Keyboard shortcuts:
  - Use combinations of two or more keys by default, so speech users and keyboard users do not
    fire them by accident.
  - Publish all custom shortcuts in a list, tutorial or help page.
  - A single-key shortcut needs an escape hatch, in order of preference: let users remap it to
    include a non-printing key; make it work only while its component has focus; or, as a
    temporary measure, let users switch it off.

### Elements: labels and roles

- "Accessibility label" here means any platform form of it: an ARIA label, alt text, a content
  description. "Role" covers native control types and ARIA roles.
- Needs a label:
  - Interactive icons, buttons and images with no visible text or with too little context (a
    pencil-icon edit button).
  - Visual cues such as progress indicators and error marks, plus meaningful icons (status) and
    meaningful images (diagrams, informative photos, illustrations, instructive images in help
    content).
  - Text controls whose text is generic: "Learn more" links, or several "Save" buttons on one page.
- Needs no label: plain non-interactive text (screen readers already read it) and buttons whose
  text explains itself ("Download image").
- Describe purpose, not appearance: "Search", not "magnifying glass". A label can combine task
  and method, as in "Voice search". Keep labels short.
- Never put the role in the label. The role is announced automatically, so "Got it button" would
  be read as "Got it button, button".
- Mark purely decorative icons and images as decorative so assistive technology skips them.
- Give every interactive element a role: an ARIA role on the web, the matching component type
  (button, slider, menu) on native platforms. Two elements can look alike yet behave differently;
  the role tells users which interaction to expect.

## Measurements

| Item | Value |
|---|---|
| Minimum touch target | 48 × 48dp [site:/foundations/designing/structure] |
| Physical size of the minimum target | about 9 mm [site:/foundations/designing/structure] |
| Recommended physical range for touch targets | 7–10 mm [site:/foundations/designing/structure] |
| iOS recommended touch target | 44 × 44dp [site:/foundations/designing/structure] |
| Minimum pointer (mouse, stylus) target | 44 × 44dp [site:/foundations/designing/structure] |
| Example: icon inside a minimum target | 24dp icon [site:/foundations/designing/structure] |
| Example: larger icon inside a minimum target | 40dp icon [site:/foundations/designing/structure] |
| Space between targets | 8dp or more [site:/foundations/designing/structure] |
| Small text contrast | at least 4.5:1 [site:/foundations/designing/color-contrast] |
| Large text and graphics contrast | at least 3:1 [site:/foundations/designing/color-contrast] |
| Clustered element container vs background | at least 3:1 [site:/foundations/designing/color-contrast] |

- The touch target extends past the visible element: a small icon gets padding until the
  tappable area reaches 48dp [site:/foundations/designing/structure].
- Bigger targets than the minimum are fine and help a wider range of users.
- No system token defines the minimum target or the target spacing [NOT FOUND]. The libraries
  hard-code the minimum:
  - Compose: 48dp [impl:compose-material3/commonMain/androidx/compose/material3/InteractiveComponentSize.kt:268].
  - Flutter: 48 [impl:material_ui/packages/material_ui/lib/src/constants.dart:27].

## Accessibility

The whole page family is accessibility guidance. A review checklist drawn from it:

- Text meets 4.5:1 (small) or 3:1 (large) [site:/foundations/designing/color-contrast]; clustered
  containers meet 3:1 [site:/foundations/designing/color-contrast].
- Touch targets are at least 48dp [site:/foundations/designing/structure] and pointer targets at
  least 44dp [site:/foundations/designing/structure], with 8dp or more between them
  [site:/foundations/designing/structure].
- Reading order, landmarks and headings are annotated in the spec.
- Initial focus, focus return and any custom traversal are defined.
- Every interactive or meaningful element has a purpose-based label and a role; decorative ones
  are hidden.
- Custom shortcuts are documented and single-key ones can be remapped or limited to focus.

## Platform mapping

- Jetpack Compose (material3 1.5.0-rc01):
  - `Modifier.minimumInteractiveComponentSize()` pads a control to the minimum target, read from
    `LocalMinimumInteractiveComponentSize`, whose default is
    48dp [impl:compose-material3/commonMain/androidx/compose/material3/InteractiveComponentSize.kt:268].
  - Labels: `Icon` takes `contentDescription`; pass `null` only for a decorative icon.
  - Roles: material3 components set them through `Modifier.semantics { role = ... }` (for example
    `Role.Button` in `Button.kt`); custom controls do the same.
  - Compose material3 has no contrast-level option on its color scheme functions; the contrast
    variants have to be generated elsewhere.
- Flutter (`material_ui` 1.11.0):
  - `kMinInteractiveDimension` is 48 [impl:material_ui/packages/material_ui/lib/src/constants.dart:27].
  - `ThemeData.materialTapTargetSize` defaults to `MaterialTapTargetSize.padded` on Android,
    Fuchsia and iOS and to `shrinkWrap` on Linux, macOS and Windows (`theme_data.dart:479-488`).
  - Labels: widgets such as `Checkbox` take a `semanticLabel`; the framework's `Semantics` and
    `ExcludeSemantics` widgets set roles and hide decoration.
  - `ColorScheme.fromSeed` takes a `contrastLevel` (default 0.0) for higher-contrast schemes.
- Web: no maintained official component library. Use semantic HTML elements, ARIA landmarks and
  roles, and `aria-label` or `alt`. Our Phase 3 CSS pads small controls to the
  48dp [site:/foundations/designing/structure] target.

## Pitfalls

- Checking contrast only for text and forgetting the containers of grouped buttons or chips.
- Applying the 3:1 container rule to a lone FAB and forcing an unnatural color for it.
- Matching heading levels to font size instead of to the content outline, or skipping a level.
- Two `navigation` landmarks with no labels, or labels that repeat the role ("Navigation nav").
- Labels that describe the picture ("pencil") instead of the action ("Edit"), or that include
  the role word.
- Leaving focus stranded after a dialog closes.
- Single-letter shortcuts that cannot be remapped or turned off.
- Shrinking a target to its icon's 24dp size [site:/foundations/designing/structure] instead of
  padding it to 48dp [site:/foundations/designing/structure].
