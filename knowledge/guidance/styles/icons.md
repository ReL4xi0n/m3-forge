---
title: Icons
kind: style
pages: [/styles/icons/overview, /styles/icons/designing-icons, /styles/icons/applying-icons, /blog/material-icons-sehee-lee-interview]
tokenSets: []
expressive: false
fetched: 2026-11-13
---

## Summary

Icons are compact symbols for actions and categories. Material Symbols is the current default
set: a variable icon font (also offered as SVG) in three styles, outlined, rounded and sharp, with
four adjustable axes: weight, fill, grade and optical size. The older Material Icons set still
exists but has no variable axes. Icons are drawn on a fixed grid with keyline shapes so that
thousands of glyphs, including custom ones, look like one family.

## Rules

Choosing a style:

- Outlined: light strokes, suits dense UIs; its stroke weight can echo or contrast the text
  weight. Some glyphs stay filled even in outlined form (for example full-body people, or
  proprietary marks), because they read better that way.
- Rounded: rounded corners; pairs with heavy type, curved logos or circular brand elements.
- Sharp: straight-edged corners; stays crisp at small sizes and suits rectangular brand styles.
- Use one style and one weight throughout an icon set. Do not mix them.

Axes:

- Weight runs from thin (100) to bold (700); regular is 400. Heavier weights also make the glyph
  look larger. At the standard size, do not go below weight 200, and be careful with very heavy
  weights.
- Fill runs from 0 (outline) to 1 (solid). Animating it is a good way to show a state change,
  such as unselected to selected in navigation.
- Grade changes thickness in finer steps than weight and barely changes the glyph's size.
  - Default grade is 0 for a dark icon on a light background; use -25 for a light icon on a dark
    background, which offsets the way light-on-dark glyphs look heavier.
  - Positive grade adds emphasis, for example for an active state.
  - If the text font has a grade axis, set icons to the text's grade value.
- Optical size keeps strokes visually even as the icon grows or shrinks, instead of scaling a
  single drawing (which makes large icons look too heavy).

Pairing with text:

- Give icons and adjacent text the same size and the same optical weight.
- Do not sit the icon on the text baseline. Lower it by roughly 11.5% of the text size [site:/styles/icons/applying-icons].

Designing an icon (from the designing page and the Sehee Lee interview):

- Start from the meaning. Look at how the concept is pictured across many sources so the metaphor
  is not limited to one culture, place or age group.
- Build the base form from the four metrics: keyline shapes, the grid, stroke weight and corner
  radius. Add the essential lines, then remove every detail that is not needed.
- Keep icons simple, bold and graphic. Avoid literal, intricate or loose organic drawings.
- Icons face forward: no tilting, rotating or 3D effects.
- Snap geometry to whole pixels on the grid.
- Keep content inside the live area; it may push into the padding for visual weight but never past
  the trim edge.
- Outlined style: exterior corners rounded, interior corners square. Rounded style: rounded inside
  and out. Sharp style: square everywhere. Do not round strokes that are very thin.
- Use squared stroke terminals and one stroke weight per icon. Complex glyphs may thin some strokes
  (an optical correction) without distorting the base shapes.
- Name and tag new icons well; an icon people cannot find in search will not be used.
- Check meaning across scripts and cultures before publishing. A glyph that is harmless in one
  writing system can read as something offensive in another.

Why a variable font (from the interview): every style and axis value lives in one file, which
saves size and network requests, and lets CSS animate between icon styles. Teams that do not need
the axes can keep using SVGs.

## Measurements

| What | Value |
|---|---|
| Standard icon size | 24 × 24dp [site:/styles/icons/designing-icons] |
| Supported optical sizes | 20dp, 24dp, 40dp, 48dp [site:/styles/icons/designing-icons] |
| Optical size axis range | 20dp to 48dp [site:/styles/icons/applying-icons] |
| Live area | 20 × 20dp [site:/styles/icons/designing-icons] |
| Padding around the live area | 2dp [site:/styles/icons/designing-icons] |
| Square keyline | 18 × 18dp [site:/styles/icons/designing-icons] |
| Circle keyline (diameter) | 20dp [site:/styles/icons/designing-icons] |
| Vertical rectangle keyline (tall × wide) | 20 × 16dp [site:/styles/icons/designing-icons] |
| Horizontal rectangle keyline (tall × wide) | 16 × 20dp [site:/styles/icons/designing-icons] |
| Default corner radius | 2dp [site:/styles/icons/designing-icons] |
| Sharp style corner radius | 0dp [site:/styles/icons/applying-icons] |
| Recommended stroke | 2dp, i.e. weight 400 [site:/styles/icons/designing-icons] |
| Thinner stroke for optical correction | 1.5dp [site:/styles/icons/designing-icons] |
| Text baseline offset | about 11.5% of the text size [site:/styles/icons/applying-icons] |

Size choices:

- 20dp: dense desktop layouts and small visuals [site:/styles/icons/designing-icons].
- 40dp and 48dp: highlighted primary actions, display or headline text, large screens [site:/styles/icons/designing-icons].
- No icon-style token exists; these values come from the site [NOT FOUND]. Component icon sizes
  are component tokens, e.g. the small icon button uses a 24dp icon [token:md.comp.icon-button.small.icon.size].

## Accessibility

- Touch target: a 24dp icon gets a 48dp target by default [site:/styles/icons/applying-icons].
- Where mouse and keyboard are the main input, a 20dp icon may use a 40dp target [site:/styles/icons/applying-icons].
- Label icons whose meaning is not obvious. Navigation destinations always need labels.
- Below 20dp, complex icons and icons for key actions need a text label [site:/styles/icons/applying-icons];
  simple glyphs (rating stars, for example) can stand alone if they stay recognizable.
- Give actionable icons an accessible name; purely decorative icons need none.
- Localize: test icons with different ages, cultures and languages. Pick culturally fitting
  metaphors (cart, bag or basket for checkout), and remember that colors and symbols such as
  owls, white or red/green carry different meanings in different regions.

## Platform mapping

- Jetpack Compose (material3 1.5.0-rc01): `Icon` draws an `ImageVector`, `Painter` or
  `ImageBitmap` with a `tint` and a `contentDescription`.
  Without an explicit size it is 24dp [impl:compose-material3/commonMain/androidx/compose/material3/Icon.kt:219] [token:md.comp.icon-button.small.icon.size].
  The material3 sources have no API for the Symbols variable axes; axis values must be baked into
  the vector or font you supply.
- Flutter (`material_ui` 1.11.0): the `Icons` class lists glyphs from the legacy `MaterialIcons`
  font, with `_outlined`, `_rounded` and `_sharp` variants. The `Icon` widget is re-exported from
  `package:flutter/widgets.dart`, which is outside the pinned sources, so its axis parameters are
  not verified here.
- Web: no maintained official component. Material Symbols is served as a variable font from
  Google Fonts; the four axes are set through CSS font variation settings.

## Pitfalls

- Mixing outlined, rounded and sharp glyphs, or several weights, in one interface.
- Weight 100 at the standard 24dp size [site:/styles/icons/applying-icons]; it is too faint.
- Scaling the standard drawing up instead of using a larger optical size.
- Icons and labels at different sizes or weights, or icons resting on the text baseline.
- Unlabeled abstract icons, especially in navigation.
- Detailed, literal or tilted drawings; rounded stroke ends; inconsistent corner radii.
- Off-pixel coordinates that blur edges.
