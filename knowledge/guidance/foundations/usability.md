---
title: Usability
kind: foundation
pages: [/foundations/usability/overview]
tokenSets: []
expressive: true
fetched: 2026-11-13
---

## Summary

Usability is about how easily anyone can understand and operate a product. Material frames it as
a design goal that M3 Expressive tactics serve: color, containment, motion, shape, size and type
are tools for building a clear visual hierarchy and pushing the key action forward. The page also
covers how to rank goals and why testing matters. Its "Applying M3 Expressive" tab now redirects
to the overview, so this note is written from that one page.

## Rules

### What usability means

- Material borrows the Nielsen Norman Group's five qualities of a usable product:
  - Efficiency: people reach their goal with little effort.
  - Errors: the design makes mistakes unlikely and easy to undo.
  - Learnability: a first-time user gets through a task without help.
  - Memorability: a returning user still knows how it works.
  - Satisfaction: people enjoy using it.
- Usability and accessibility overlap but are not the same goal. Accessibility makes a product
  usable for people with disabilities and their assistive technology (perceivable, operable,
  understandable, robust). Usability aims at clarity for every user. See designing.md#summary
  for the accessibility checklist.

### Building hierarchy with Expressive tactics

- First set a strong hierarchy (color, size, spacing, placement, containment). Then add special
  emphasis for moments of success or progress (illustration, scale, shape, shape morph).
- Not every tactic is needed at once. A good mix makes the product easy to learn and remember,
  shows the next step quickly, and removes distractions. Too many tactics together distract.
- Color: use vivid primary and secondary colors to mark key actions; contrasting hues (purple
  against green) separate better than near neighbours. Always meet the contrast rules in
  designing.md#rules. Dynamic color roles already pair colors with suitable emphasis and contrast.
- Containment and grouping: wrap related elements in quiet containers and break long content into
  sections with containers, spacing and headings.
- Motion: reserve it for key moments; constant motion distracts.
- Shape: the Material shape library has 35 shapes [site:/foundations/usability/overview]. Shapes
  mask images, fill empty areas, add emphasis, steer focus, tell containers and buttons apart,
  hint at interactivity and set the emotional tone.
- Shape morph: any library shape can morph into any other. Components use morphing to show
  interaction states (select, tap, swipe, scroll, release, long press) and actions in progress;
  see buttons.md#expressive.
- Size: the bigger the element, the more important it reads. The main call to action should be
  the largest element on screen. Larger key actions make products faster to use, cut errors, and
  make them easier to learn and more satisfying.
- Typography: use type to separate levels of information. The largest, clearest text can mark the
  primary action, smaller text the secondary ones, and a shared style ties related content
  together. Different fonts can split important from supporting content.

### Ranking goals

- Primary goals are the tasks a product exists for (starting a process, making a decision) and get
  the strongest emphasis. Secondary and tertiary goals (checking a status, changing settings)
  enrich the experience but are optional.
- Decide the ranking from both product needs and user satisfaction.
- To lead people to the primary goal while keeping the rest findable:
  - Build hierarchy with size, color and the other tactics.
  - Aim for one primary task per page and use empty space to frame it.
  - Make core actions easy to recognize and reach, for example by giving the most frequent action
    a large button.
  - Keep the whole experience coherent and pleasant to look at.
  - Hold back: several expressive tactics at once compete for attention.

### Iterating

- Test early and often with a range of users and contexts. Feedback shows how people actually
  perceive the product and catches errors before release.

## Measurements

- Shape library size: 35 shapes [site:/foundations/usability/overview].
- The page gives no sizes, spacings or color values. Concrete numbers for the tactics live in the
  component and style notes (for example the button sizes in buttons.md#measurements).
- No system token encodes usability guidance itself [NOT FOUND].

## Accessibility

- Usability tactics never replace accessibility requirements. Color choices still meet the
  contrast minimums (designing.md#rules) and states still use two cues
  (interaction.md#rules).
- Size helps everyone: a larger primary action is also an easier touch target.
- Use motion sparingly; frequent or large motion is a burden for people sensitive to it.

## Platform mapping

- Jetpack Compose (material3 1.5.0-rc01):
  - `MaterialExpressiveTheme` turns on the Expressive defaults; `MotionScheme.expressive()` gives
    the expressive motion scheme.
  - `MaterialShapes` holds the shape library as `RoundedPolygon` values; `RoundedPolygon.toShape()`
    turns one into a `Shape` for clipping or containers.
- Flutter (`material_ui` 1.11.0):
  - `StyleVariant.material3Expressive` switches components to the Expressive style.
  - `MaterialShapes` holds the shape library too (with an `all` list) and `MaterialShapeBorder` uses a
    shape as a widget border.
- Web: no maintained official component library. Our Phase 3 CSS supplies the Expressive sizes and
  shapes from the material-web token values.

## Pitfalls

- Several equally prominent actions on one screen, leaving no clear primary goal.
- Using every Expressive tactic at once: bright color, big type, motion and odd shapes together.
- Choosing similar hues for actions that need to stand apart.
- Decorative motion that runs all the time.
- Treating a usability review as an accessibility review, or the other way round.
- Shipping without testing with real users.
