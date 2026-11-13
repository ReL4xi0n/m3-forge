---
title: Typography
kind: style
pages: [/styles/typography/overview, /styles/typography/fonts, /styles/typography/type-scale-tokens, /styles/typography/applying-type, /styles/typography/editorial-treatments, /blog/design-material-theme-type, /blog/roboto-flex, /blog/color-fonts-are-here, /blog/fonts-are-software-video, /blog/google-fonts-pairing-figma, /foundations/writing/text-resizing]
tokenSets: [sys.typescale, sys.typescale.emphasized, ref.typeface]
expressive: true
fetched: 2026-11-13
---

## Summary

M3 has one type scale with 30 styles: 15 baseline styles and, since the May 2025 Expressive update,
15 emphasized twins. The styles are named by role (display, headline, title, body, label) and size
(large, medium, small). Each emphasized style keeps its twin's size and line height and uses a
heavier weight. Every style has a token per property (font, size, line height, tracking, weight).
Roboto is the default face for all of them; variable fonts such as Roboto Flex are recommended for
expressive "editorial" moments but are not part of the scale yet.

## Rules

Roles:

- Display: the largest text, for short, important text or numbers, best on large screens. An
  expressive face (even script or handwritten) can work here; set the optical size if the font
  has one.
- Headline: short, high-emphasis text, especially on smaller screens; marks main passages or
  regions. Expressive faces are fine with suitable line height and letter spacing.
- Title: medium-emphasis, fairly short text such as secondary headings, app bar titles and
  category headers. Be careful with decorative faces here.
- Body: long-form reading. Use a face designed for small sizes; never a decorative one.
- Label: small utility text inside components and captions (buttons use label large).
- No product needs all 15 sizes. Pick the subset you need.

Emphasized styles:

- Use them alongside the baseline styles, for selection, key actions, headlines and editorial
  treatments; two reasons to reach for them: the text already relies on weight for hierarchy, or
  the context needs attention (selected state, unread item, key interaction).
- Good fits: badges, buttons for primary actions, extended FAB, selected list items and selected
  menu items.
- Material components never use emphasized styles by default. To use one, swap the baseline token
  for its twin, e.g. `md.sys.typescale.display-large` becomes
  `md.sys.typescale.emphasized.display-large`.

Typefaces:

- The scale has two typeface slots: brand (larger styles, display and headline, for expression)
  and plain (smaller styles, body and label, for legibility). Both default to Roboto.
- Swapping in another face (for example Roboto Flex) is encouraged for brand expression; it can
  make emphasized styles stand out more. Baseline and emphasized styles may use different faces.
- Default families:
  - Roboto: Android's default, used by the scale, very wide glyph coverage.
  - Roboto Flex: variable, more weights and widths and size-specific designs; Latin, Greek and
    Cyrillic only.
  - Roboto Serif: variable serif built for comfortable reading, usable in UI.
  - Roboto Mono: monospaced, for code and aligned numbers.
  - Noto Sans: global fallback collection compatible with Roboto, covering most scripts.
- Fallback order when using Roboto Flex: Roboto Flex, then Roboto, then Noto Sans. Confirm with
  engineering that fallback is in place.

Customizing:

- Change the brand and plain typeface tokens first, then tune line height and letter spacing.
  Avoid changing sizes, which can break component layout and reflow.
- Repeat for both baseline and emphasized sets and keep the emphasized set consistent (for
  example all a bit wider than baseline).
- Heavier faces may need wider letter spacing; faces with long ascenders or descenders need other
  line heights.
- A custom scale can drop styles or move a size to another step of the same ratio (Major Second,
  1.125). Aim for clear contrast between neighboring sizes.
- Customizing may stop you from receiving Material's typography token updates.

Typesetting:

- Web and iOS: set type with line-height boxes and padding. In CSS the line box equals the line
  height and the text sits centered in it (half-leading); measure spacing from the box.
- Android and platform-neutral specs: measure from the text baseline (baseline to baseline, or a
  reference point to baseline).
- Line height ratio: about 1.2 × size for title, headline and display; about 1.5 × size for body
  and label.
- Use tabular (monospaced) figures where numbers line up or change often (tables, clocks).
- Line height adapts to script height: small (Latin, Greek, Cyrillic, Hebrew), medium (most other
  scripts), large (Burmese, Telugu) and extra large (Nastaliq). Default to medium and switch by
  detected language; fixed-height components may not adapt.

Editorial treatments (expressive):

- Large, type-led showcase moments that break from functional layouts, possibly combined with
  motion, shape and color. Use them to celebrate content, express the user's voice, or highlight a
  bespoke feature.
- Guard rails: tokenize each treatment and reuse it, fit the emotional tone to the task, avoid
  mixing clashing treatments in one layout, and do not imitate personalization theming. Never use
  them for labels or plain information.
- Tune variable axes to the feeling:
  - Weight: avoid very light weights for small body text on low-resolution screens; light
    weights suit large sizes.
  - Grade: changes visual weight without changing widths or line breaks; a negative grade
    balances text that looks heavier in dark theme.
  - Width: narrow fits more characters (labels); avoid wide styles in tight spaces such as a top
    app bar.
  - Optical size: match it to the actual size; do not use a large optical size for small text.

From the blog posts:

- A type scale is a set of reusable styles; editing one style updates every component that uses
  it.
- Fit the type to the product: a task app benefits from one readable family; an editorial app
  can pair a readable face with an expressive one; a strongly visual app can use a readable but
  playful face; an elegant brand may favor light weights at large sizes.
- Pair faces either by shared traits (similar terminals or letterforms) or by contrast (serif with
  sans, humanist with geometric). Check language support and the feeling the face gives, and keep
  the pair readable at every size.
- If a brand scale already exists, map its styles onto the Material roles.
- Roboto Flex has twelve axes: five user axes (weight, width, optical size, grade, slant; slant
  replaces italic) and seven parametric ones (XTRA, YOPQ, YTLC, YTUC, YTAS, YTDE, YTFI). With
  automatic optical sizing, the regular weight works across the whole scale with little manual
  tracking.
- Variable fonts put many styles in one file: more expressive control and fewer font downloads.
- COLRv1 color fonts are vector, so they scale cleanly. They support gradients, built-in palettes
  (CSS `base-palette`) and custom palettes (`@font-palette-values`), and can also be variable.

## Measurements

The type scale. Values are the token values in sp (material-web stores them in rem, size ÷ 16).
In the token data every emphasized style keeps its baseline size and line height and
changes the weight.

| Style | Size | Line height | Tracking | Weight, baseline | Weight, emphasized |
|---|---|---|---|---|---|
| Display large | 57sp [token:md.sys.typescale.display-large.size] | 64sp [token:md.sys.typescale.display-large.line-height] | -0.25 [token:md.sys.typescale.display-large.tracking] | 400 [token:md.sys.typescale.display-large.weight] | 500 [token:md.sys.typescale.emphasized.display-large.weight] |
| Display medium | 45sp [token:md.sys.typescale.display-medium.size] | 52sp [token:md.sys.typescale.display-medium.line-height] | 0 [token:md.sys.typescale.display-medium.tracking] | 400 [token:md.sys.typescale.display-medium.weight] | 500 [token:md.sys.typescale.emphasized.display-medium.weight] |
| Display small | 36sp [token:md.sys.typescale.display-small.size] | 44sp [token:md.sys.typescale.display-small.line-height] | 0 [token:md.sys.typescale.display-small.tracking] | 400 [token:md.sys.typescale.display-small.weight] | 500 [token:md.sys.typescale.emphasized.display-small.weight] |
| Headline large | 32sp [token:md.sys.typescale.headline-large.size] | 40sp [token:md.sys.typescale.headline-large.line-height] | 0 [token:md.sys.typescale.headline-large.tracking] | 400 [token:md.sys.typescale.headline-large.weight] | 500 [token:md.sys.typescale.emphasized.headline-large.weight] |
| Headline medium | 28sp [token:md.sys.typescale.headline-medium.size] | 36sp [token:md.sys.typescale.headline-medium.line-height] | 0 [token:md.sys.typescale.headline-medium.tracking] | 400 [token:md.sys.typescale.headline-medium.weight] | 500 [token:md.sys.typescale.emphasized.headline-medium.weight] |
| Headline small | 24sp [token:md.sys.typescale.headline-small.size] | 32sp [token:md.sys.typescale.headline-small.line-height] | 0 [token:md.sys.typescale.headline-small.tracking] | 400 [token:md.sys.typescale.headline-small.weight] | 500 [token:md.sys.typescale.emphasized.headline-small.weight] |
| Title large | 22sp [token:md.sys.typescale.title-large.size] | 28sp [token:md.sys.typescale.title-large.line-height] | 0 [token:md.sys.typescale.title-large.tracking] | 400 [token:md.sys.typescale.title-large.weight] | 500 [token:md.sys.typescale.emphasized.title-large.weight] |
| Title medium | 16sp [token:md.sys.typescale.title-medium.size] | 24sp [token:md.sys.typescale.title-medium.line-height] | 0.15 [token:md.sys.typescale.title-medium.tracking] | 500 [token:md.sys.typescale.title-medium.weight] | 700 [token:md.sys.typescale.emphasized.title-medium.weight] |
| Title small | 14sp [token:md.sys.typescale.title-small.size] | 20sp [token:md.sys.typescale.title-small.line-height] | 0.1 [token:md.sys.typescale.title-small.tracking] | 500 [token:md.sys.typescale.title-small.weight] | 700 [token:md.sys.typescale.emphasized.title-small.weight] |
| Body large | 16sp [token:md.sys.typescale.body-large.size] | 24sp [token:md.sys.typescale.body-large.line-height] | 0.5 [token:md.sys.typescale.body-large.tracking] | 400 [token:md.sys.typescale.body-large.weight] | 500 [token:md.sys.typescale.emphasized.body-large.weight] |
| Body medium | 14sp [token:md.sys.typescale.body-medium.size] | 20sp [token:md.sys.typescale.body-medium.line-height] | 0.25 [token:md.sys.typescale.body-medium.tracking] | 400 [token:md.sys.typescale.body-medium.weight] | 500 [token:md.sys.typescale.emphasized.body-medium.weight] |
| Body small | 12sp [token:md.sys.typescale.body-small.size] | 16sp [token:md.sys.typescale.body-small.line-height] | 0.4 [token:md.sys.typescale.body-small.tracking] | 400 [token:md.sys.typescale.body-small.weight] | 500 [token:md.sys.typescale.emphasized.body-small.weight] |
| Label large | 14sp [token:md.sys.typescale.label-large.size] | 20sp [token:md.sys.typescale.label-large.line-height] | 0.1 [token:md.sys.typescale.label-large.tracking] | 500 [token:md.sys.typescale.label-large.weight] | 700 [token:md.sys.typescale.emphasized.label-large.weight] |
| Label medium | 12sp [token:md.sys.typescale.label-medium.size] | 16sp [token:md.sys.typescale.label-medium.line-height] | 0.5 [token:md.sys.typescale.label-medium.tracking] | 500 [token:md.sys.typescale.label-medium.weight] | 700 [token:md.sys.typescale.emphasized.label-medium.weight] |
| Label small | 11sp [token:md.sys.typescale.label-small.size] | 16sp [token:md.sys.typescale.label-small.line-height] | 0.5 [token:md.sys.typescale.label-small.tracking] | 500 [token:md.sys.typescale.label-small.weight] | 700 [token:md.sys.typescale.emphasized.label-small.weight] |

- Tracking is given in sp (px on the web); material-web stores it in rem.
  On material-web and Flutter, each emphasized tracking token carries its baseline value; Compose
  departs from that in two places (listed below).
- Weights: regular 400 [token:md.ref.typeface.weight-regular], medium 500
  [token:md.ref.typeface.weight-medium], bold 700 [token:md.ref.typeface.weight-bold].
- Typefaces: brand [token:md.ref.typeface.brand] and plain [token:md.ref.typeface.plain] are
  Roboto on material-web and Flutter, `FontFamily.SansSerif` on Compose. Flutter's token data also
  names Roboto Flex as the variable brand and plain face [token:md.ref.typeface.variable.brand].
- material-web also carries per-style variable-axis tokens (`.wght`, `.wdth`, `.opsz`, `.GRAD`,
  `.ROND`, `.slnt`, `.FILL`, `.CRSV`, `.HEXP`), e.g. optical size 57 for display large
  [token:md.sys.typescale.display-large.opsz]. They only take effect with a variable font.
- Language-height line heights: the site describes the categories, but no language-height token
  exists in our token sources [NOT FOUND]. Relative to the small category, scripts in the medium
  category are about 7% taller, large about 30% and extra large about 100% [site:/styles/typography/type-scale-tokens].
- Key base size: body text at 14sp [token:md.sys.typescale.body-medium.size], scaled by the Major
  Second ratio.
- Web units: rem = sp ÷ 16, assuming the browser default root size of 16px [site:/styles/typography/type-scale-tokens].
  Letter spacing in em (Android) or rem (web) is the tracking value divided by the font size.

Tracking differences (see `knowledge/conflicts.md`). material-web and Flutter use the values in
the table; Compose uses:

- Display large: -0.2 [differs:md.sys.typescale.display-large.tracking].
- Title medium: 0.2 [differs:md.sys.typescale.title-medium.tracking].
- Body medium: 0.2 [differs:md.sys.typescale.body-medium.tracking].
- Emphasized display large: 0 [token:md.sys.typescale.emphasized.display-large.tracking] [differs:md.sys.typescale.emphasized.display-large.tracking].
- Emphasized body large: 0.15 [token:md.sys.typescale.emphasized.body-large.tracking] [differs:md.sys.typescale.emphasized.body-large.tracking].

## Accessibility

- Contrast: at least 3:1 for large text and 4.5:1 for small text.
- Default text color is the on surface role; on surface variant is a good alternative. Links on a
  surface use primary (tertiary for quieter links) and must be underlined.
- Large text: people must be able to scale text up, through the OS setting or an in-app multiplier.
  Let containers grow, reflow the layout (stack side-by-side parts) or allow scrolling, so enlarged
  text is never clipped, overlapped or truncated.
- Script height: ignoring the language-height categories leads to overlapping or clipped text in
  taller scripts.
- Avoid very thin weights and decorative faces at small sizes; grade (not weight) can adjust
  emphasis without reflow.
- Use tabular figures for numbers that change, so the layout does not jump.

## Platform mapping

- Jetpack Compose (material3 1.5.0-rc01): `Typography` holds the 15 baseline styles
  (`displayLarge` … `labelSmall`) and the 15 emphasized ones (`displayLargeEmphasized` …
  `labelSmallEmphasized`), read through `MaterialTheme.typography`. The
  `Typography(fontFamily = ...)` constructor applies one family to every style.
- Flutter (`material_ui` 1.11.0): `TextTheme` has the 15 baseline styles (`displayLarge` …
  `labelSmall`), with defaults from `Typography.material2021`. It has no emphasized styles; the
  emphasized values exist only in the token data.
- Web: no maintained official component. Our CSS uses the material-web token values (rem sizes,
  plus the variable-axis tokens where a variable font is loaded).

## Pitfalls

- Using emphasized styles everywhere; they work by contrast with baseline text.
- Expecting components to switch to emphasized styles on their own.
- Changing type sizes when customizing a face; adjust line height and tracking instead.
- Decorative or very light faces for body or label text.
- Assuming Roboto Flex is part of the scale; it is opt-in, and it lacks scripts beyond Latin,
  Greek and Cyrillic without a fallback chain.
- Roboto Flex defaults to proportional figures (Roboto uses tabular ones), so turn on tabular
  figures where alignment matters.
- Large optical sizes or wide widths in small or cramped text.
- Fixed-height text containers that clip taller scripts.
