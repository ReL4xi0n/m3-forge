# Rubric v2 (draft until frozen)

Owner decision of 2026-11-17 (protocol change PC-2). Rubric v1 (`evals/rubric.md`) stays frozen as it
was. v2 changes three things:
- **Side by side.** Every output is judged next to real first-party reference screenshots of the same
  platform, paired by screen type and theme. Score 3 now means that, side by side, there is no visible
  design gap on the item.
- **Non-design tells are ignored.** Brand, product names, the data shown, the interface language, phone
  status and navigation bars and browser parts are not design. They never lower or raise a score.
- **Automated items** are the v2 items of `evals/automated-v2.md`.

The judged items and their anchors for 0, 1 and 2 are those of v1; the anchor for 3 is stricter.

Each output is scored 0–3 on every item below. An output is one screen, or one set of states of one
screen. It has screenshots at one or two sizes, in light and dark.

General scale:
- **0**: not Material 3, or wrong.
- **1**: recognizably Material 3, with clear errors.
- **2**: correct Material 3, with minor flaws.
- **3**: indistinguishable from first-party quality: next to the paired first-party references, a
  reviewer sees no design gap on the item.

The reference images marked as score-3 examples show what 3 looks like. Each output is also paired
with one or two of them; compare the output with its paired references first.

## Fixed rules

- **Side by side.** For each item, first name the most visible design difference between the output
  and its paired references (the "gap"). Give 3 only if there is no such difference. A visible gap
  that a first-party reviewer would fix caps the item at 2; several, or one that makes the screen look
  generic or dated, cap it at 1.
- **Not design.** Ignore brand and product names, logos, the data and copy shown, the interface
  language, phone status and navigation bars, browser parts, and image scaling. The references are
  real products with real content; the outputs use made-up products. That difference is not a gap.
- **Clean is not enough.** A screen that is tidy and free of errors but looks like a generic template,
  a framework default or an older Material version (Material 2: elevated colored app bars, small
  uniform corners, all-caps buttons, drop shadows) is not first-party quality: overall polish at most
  2, and the items where it shows (shape and Expressive character, color-role use, component choice)
  at most 2.

- **Nothing to judge.** If an output has no screenshot (the build failed, the app did not start, or
  the request was not attempted), every judged item scores 0. The reason given is "no output".
- **Partial request.** If the request was only partly built, judge what is there. "Component choice"
  and "Overall polish" also go down for each missing part the request asked for.
- **Classic requests.** A request may ask for the classic Material 3 style instead of M3 Expressive.
  Then "Shape and Expressive character" is scored as Material 3 shape correctness, and Expressive
  features are neither required nor rewarded.
- **Brand color.** A request may name a brand color. Then "Color-role use" also checks that the
  scheme is derived from that color: primary, secondary and tertiary harmonize with it, and the
  neutral surfaces are lightly tinted by it. A raw brand hex painted everywhere does not count.
- **Platform.** Judge each output against the platform its request names: web, Flutter (mobile) or
  Android.
- **What can be seen.** Score only what the screenshots show; do not guess hidden states. "Interaction
  states" uses only visible evidence, such as a selected, focused, disabled or error state, or
  pressed or hover styling where a screenshot captured it.

## Automated items (computed, not judged)

These come from verify v2 and harness v2 (`evals/automated-v2.md`). Rates are per 100 non-blank
lines of UI source.

| Item | 3 | 2 | 1 | 0 |
|---|---|---|---|---|
| Token fidelity: hardcoded color, off-token type and off-token radius violations per 100 UI lines | 0 | more than 0, up to 1 | more than 1, up to 5 | more than 5, or no buildable output |
| Contrast and targets: runtime contrast and touch-target findings | 0 | 1–2 | 3–6 | 7 or more, or no buildable output |
| Anti-patterns: shadow/gradient and foreign-styling findings | 0 | 1 | 2–4 | 5 or more, or no buildable output |
| Icon source: legacy icon sets, other icon libraries, emoji, and vector icons that are not official Material Symbols geometry | 0 | 1 | 2–4 | 5 or more, or no buildable output |

## Judged items

### 1. Component choice
- **3**: Every control is the Material component a first-party app would use for that job, for
  example:
  - switches for instant settings;
  - a navigation bar or rail for top-level destinations;
  - chips for filters;
  - a FAB only for the screen's main action;
  - dialogs only for interruptions that need a decision.

  Nothing is improvised where a standard component exists.
- **2**: Right components overall; one or two questionable choices that a reviewer would mention.
- **1**: Several wrong or improvised components. Examples: generic boxes as buttons, checkboxes for
  instant settings, tabs for top-level navigation, several FABs.
- **0**: Components are mostly not Material, or the screen is a generic web or framework default.

### 2. Hierarchy and typography
- **3**: One clear focal point per screen. Type comes from the Material type scale (display,
  headline, title, body, label) and is used for its role. Weights and sizes create a calm, readable
  order. No text is cramped or oversized.
- **2**: Clear hierarchy, with a few off-scale sizes or weak contrasts between levels.
- **1**: Competing focal points, many arbitrary sizes, or headings that do not read as headings.
- **0**: No discernible hierarchy, or typography unrelated to Material.

### 3. Color-role use
- **3**: Colors come from a coherent Material scheme and each role does its job:
  - primary for key actions;
  - containers for grouped content;
  - surface tones for layers;
  - error only for errors;
  - "on" colors for content placed on them.

  Light and dark are both coherent schemes, not inverted copies.
- **2**: Coherent scheme with one or two role misuses, for example a container color used for a
  primary action, or a surface level that blends into the background.
- **1**: Colors look picked by hand. Roles are used inconsistently, or accent color is spread across
  unrelated elements.
- **0**: No scheme: arbitrary colors, gradients or framework defaults.

### 4. Shape and Expressive character
- **3**: Corner shapes follow the Material shape scale, consistently per component family. For M3
  Expressive requests, the screen shows the Expressive character where it fits: varied and
  confident shapes, emphasized type, lively but purposeful accents. It does not tip into decoration.
- **2**: Correct shapes with small inconsistencies. For Expressive requests: plain, standard Material
  3 with little Expressive character.
- **1**: Shapes are inconsistent or off the scale. Examples: sharp corners next to pills for no
  reason, uniform radius on everything, or decoration in place of Expressive character.
- **0**: Shapes unrelated to Material.

### 5. Spacing and layout
- **3**: Spacing follows a consistent 4/8dp rhythm. Margins and gutters suit the window size. Content
  aligns to a clear grid. Dense areas and breathing room are balanced. Nothing overflows, overlaps
  or is clipped. On large screens the layout uses the space (panes, columns or max widths) rather
  than stretching.
- **2**: Good layout with a few uneven gaps or alignment slips.
- **1**: Cramped or uneven spacing, misalignment, or a layout that does not adapt (a stretched mobile
  layout on desktop, or a desktop layout squeezed on a phone).
- **0**: Broken layout: overlap, overflow, clipped content or unreadable areas.

### 6. Interaction states
Score only the states the screenshots actually show. A static screenshot often cannot show focus,
pressed, error or disabled states. Never lower the score because a state is absent that this
screen had no reason to show.
- **3**: Every visible state is a correct Material state, for example:
  - selected items use the indicator or container styling;
  - a visible focus is clear;
  - disabled items use reduced emphasis;
  - errors show the error color with supporting text;
  - inputs show labels.

  The screen as a whole makes the available actions obvious.
- **2**: One or two of the visible states are weak or unclear. Examples: a selected item that is
  hard to tell apart, or an input whose label is easy to miss.
- **1**: States missing or non-Material. Examples: selection shown only by bold text, errors without
  text, or inputs without labels.
- **0**: No states can be told apart.

### 7. Dark mode
- **3**: The dark screenshot is a proper dark scheme:
  - tonal surfaces, not pure black everywhere and not grey-on-grey mud;
  - accents adjusted for dark;
  - text and icons readable;
  - images and illustrations still fit.
- **2**: Proper dark scheme with small issues, such as one element left in light colors.
- **1**: Partly dark. Several light-only elements, or poor contrast in places.
- **0**: No dark mode (the dark screenshot looks like the light one), or unreadable.

### 8. Overall polish
- **3**: Could ship in a first-party Google app today. Consistent, finished, nothing looks like a
  placeholder by mistake, and the details are right: icons, alignment, truncation, empty space.
- **2**: Solid and consistent. A reviewer would list a few small fixes.
- **1**: Works, but looks unfinished or generic in several places.
- **0**: Looks broken or clearly not designed.

## Output format (for the judge)

For each ID in the batch, give every judged item exactly once, as a JSON array. "gap" is the most
visible design difference from the paired references on that item, or "none":

```json
[{ "id": "k7f2q9", "item": "component-choice", "gap": "one sentence or none", "score": 2, "reason": "one sentence" }]
```

Item keys: `component-choice`, `hierarchy-typography`, `color-roles`, `shape-expressive`,
`spacing-layout`, `interaction-states`, `dark-mode`, `overall-polish`.
