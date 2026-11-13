# Rubric v1 (draft until frozen)

Each output is scored 0–3 on every item below. An output is one screen, or one set of states of one
screen. It has screenshots at one or two sizes, in light and dark.

General scale:
- **0**: not Material 3, or wrong.
- **1**: recognizably Material 3, with clear errors.
- **2**: correct Material 3, with minor flaws.
- **3**: indistinguishable from first-party quality.

The reference images marked as score-3 examples show what 3 looks like.

## Fixed rules

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

These come from the verify script and the harness. Rates are per 100 non-blank lines of UI source.

| Item | 3 | 2 | 1 | 0 |
|---|---|---|---|---|
| Token fidelity: hardcoded color, off-token type and off-token radius violations per 100 UI lines | 0 | more than 0, up to 1 | more than 1, up to 5 | more than 5, or no buildable output |
| Contrast and targets: runtime contrast and touch-target findings | 0 | 1–2 | 3–6 | 7 or more, or no buildable output |
| Anti-patterns: shadow/gradient, icon-source and foreign-styling findings | 0 | 1 | 2–4 | 5 or more, or no buildable output |

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
- **3**: Visible states look like Material states:
  - selected items use the indicator or container styling;
  - focus is visible;
  - disabled items use reduced emphasis;
  - errors show the error color with supporting text;
  - inputs show labels and helper or error text.

  The screen as a whole makes the available actions obvious.
- **2**: States present and mostly Material, with one or two weak or unclear ones.
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

For each ID in the batch, give every judged item exactly once, as a JSON array:

```json
[{ "id": "k7f2q9", "item": "component-choice", "score": 2, "reason": "one sentence" }]
```

Item keys: `component-choice`, `hierarchy-typography`, `color-roles`, `shape-expressive`,
`spacing-layout`, `interaction-states`, `dark-mode`, `overall-polish`.
