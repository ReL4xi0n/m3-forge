---
title: Shape
kind: style
pages: [/styles/shape/overview-principles, /styles/shape/corner-radius-scale, /styles/shape/shape-morph]
tokenSets: [sys.shape]
expressive: true
fetched: 2026-11-13
---

## Summary

M3 shape has three parts: a corner radius scale that every rectangular component maps to, a
library of 35 decorative shapes, and shape morphing between them. The scale is named by how round a
corner is, not by component size, and runs from no rounding to fully round in ten steps. The
Expressive update (May 2025) added three larger steps, the shape library and morphing, and new
principles that encourage contrast between round and sharp forms.

## Rules

The corner scale:

- Every rectangular component picks a step on the scale. The same steps serve symmetric shapes
  (all four corners equal) and asymmetric ones (corners set individually).
- Asymmetric shapes appear where items sit close together, such as menus and split buttons. Those
  "inner corners" map to per-corner tokens (`md.sys.shape.corner-value.*`).
- Customize at one of two levels:
  - Style level: change what a step (say medium) resolves to; every component on that step
    follows unless it has its own override.
  - Component level: remap one component to another step, e.g. move buttons from full to small or
    medium for a squarer product.
- The corner family can switch from rounded to cut (straight diagonal corners). Cut corners eat
  more of the content area, so add padding in dense components.
- Keep large or full corners off information-dense containers such as cards full of content.
- Mixing square and fully round shapes on purpose adds variety and surprise.
- Nested rounded shapes need optical roundness: the inner radius is the outer radius minus the
  padding between them. Reusing the outer radius inside looks unbalanced.

The shape library and principles:

- Use the 35 library shapes mostly for visual, decorative elements: image crops, avatar masks,
  graphics. Avoid odd shapes on text-heavy containers.
- Use them sparingly, for emphasis and delight, and only when they serve the product; shapes with
  no reason add clutter.
- Shapes carry no fixed meaning. A wavy form is not a symbol for "progress"; the same idea could be
  shown by rotation or a morph, and waves can appear elsewhere.
- Shape and type are designed to feel related (M3 shapes echo the roundness of Google Sans Flex);
  use them together.
- Tension (round next to sharp, conventional next to unusual) makes a design more memorable; use
  it to show state, draw attention or improve the look.
- Moving shape layers differently can give flat visuals a sense of depth (2.5D).

Shape morph:

- Morphing should answer the user: a selected state, work in progress (someone typing, a page
  loading), or a change in the environment (sound, temperature, time).
- Consider how shapes respond to tap, swipe, scroll, release and long press.
- Material components that morph library shapes: the standard button group and the loading
  indicator.
- Morphs run on the expressive motion scheme by default and can be switched to standard. See
  motion.md#measurements for the spring values.

## Measurements

The values are material-web's (canonical). No cited corner-value token differs between
platforms.

| Step | Corner radius |
|---|---|
| None | 0dp [token:md.sys.shape.corner-value.none] |
| Extra small | 4dp [token:md.sys.shape.corner-value.extra-small] |
| Small | 8dp [token:md.sys.shape.corner-value.small] |
| Medium | 12dp [token:md.sys.shape.corner-value.medium] |
| Large | 16dp [token:md.sys.shape.corner-value.large] |
| Large increased (Expressive) | 20dp [site:/styles/shape/corner-radius-scale] [token:md.sys.shape.corner-value.large-increased] |
| Extra large | 28dp [token:md.sys.shape.corner-value.extra-large] |
| Extra large increased (Expressive) | 32dp [site:/styles/shape/corner-radius-scale] [token:md.sys.shape.corner-value.extra-large-increased] |
| Extra extra large (Expressive) | 48dp [site:/styles/shape/corner-radius-scale] [token:md.sys.shape.corner-value.extra-extra-large] |
| Full | Fully round [token:md.sys.shape.corner.full] |

- Full: material-web writes it as a very large radius, Compose as `CircleShape`, Flutter's token
  data as a circular shape family.
- Before the Expressive update, full was defined as 50% of the component size [site:/styles/shape/overview-principles].
- Partial-corner styles (top, start or end corners only): extra small top
  [token:md.sys.shape.corner.extra-small.top], large top [token:md.sys.shape.corner.large.top],
  large start [token:md.sys.shape.corner.large.start], large end
  [token:md.sys.shape.corner.large.end], extra large top [token:md.sys.shape.corner.extra-large.top].
  The rounded corners take the value of their step; the others are square. Compose defines none of
  these as tokens [NOT FOUND].
- Optical roundness example: an outer radius of 48dp minus 14dp of padding gives 34dp inside [site:/styles/shape/corner-radius-scale].
- Shape morph timing: the site names the scheme but no spring speed for morphs in general [NOT FOUND].
  Component notes give their own (e.g. buttons.md#motion).

## Accessibility

- Do not trade clarity for decoration: unconventional shapes on text-heavy containers hurt
  reading.
- Large corners clip content in dense containers; keep text and images clear of the corner.
- A shape morph answers an interaction and tells the user something: a selected state, work in
  progress, or a change around them. Make sure that message survives when the morph does not play.
- **Our practice:** when the user has asked for reduced motion, turn shape morphing off and jump
  straight to the end shape (see motion.md#accessibility).

## Platform mapping

- Jetpack Compose (material3 1.5.0-rc01):
  - `Shapes(extraSmall, small, medium, large, extraLarge, largeIncreased, extraLargeIncreased,
    extraExtraLarge)` on `MaterialTheme.shapes`; matching constants in `ShapeDefaults`
    (`LargeIncreased`, `ExtraLargeIncreased`, `ExtraExtraLarge` included).
  - `MaterialShapes` holds the 35 library shapes as `RoundedPolygon`s (`Circle`, `Square`,
    `Cookie9Sided`, `Sunny`, `Heart`, …). It is `@ExperimentalMaterial3ExpressiveApi`.
  - `RoundedPolygon.toShape()` turns a library shape into a `Shape`; `Morph.toPath(progress)` draws
    an in-between shape. `Morph` and `RoundedPolygon` come from `androidx.graphics.shapes`.
- Flutter (`material_ui` 1.11.0):
  - `MaterialShapes` is a port of the Compose catalog (lower-camel names, plus `MaterialShapes.all`).
  - `MaterialShapeBorder` draws a library shape as a border; lerping between two of them morphs
    the shape. `RoundedPolygon` and `CornerRounding` are exported.
  - There is no theme-level corner scale class; the scale exists only as token data that the
    component defaults are generated from.
- Web: no maintained official component, and the site states shape morph is not available on the
  web. Our CSS uses the corner values above.

## Pitfalls

- Equal radii on nested containers instead of subtracting the padding.
- Full or large corners on dense cards, or cut corners without extra padding.
- Decorative library shapes on text containers or used everywhere.
- Giving a shape a fixed meaning (for example "wavy means loading").
- Changing a component's corners by hard-coding a radius instead of remapping it to a scale step.
- Treating full as 50% of the size [site:/styles/shape/overview-principles]; it is now its own value.
