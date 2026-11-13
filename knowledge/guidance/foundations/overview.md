---
title: Foundations overview
kind: foundation
pages: [/foundations, /foundations/overview/principles, /foundations/overview/assistive-technology, /foundations/designing/flow, /foundations/interaction/inputs, /blog/material-google-io22, /blog/material-google-io23, /blog/google-io-2024, /blog/material-design-2022-roundup, /blog/material-io-redesign, /blog/interview-oddfellows-m3-art-style, /blog/material-partner-studies, /blog/research-state-of-design-systems-2020, /blog/year-in-the-life-material-design-advocate, /blog/material-design-awards-2021, /blog/mda-2020-winners, /blog/mda-2021-winners]
tokenSets: []
expressive: false
fetched: 2026-11-13
---

## Summary

Foundations are the parts of M3 that every screen depends on, whatever its components:
accessibility, content design, customization, design tokens, interaction states, layout, and the
vocabulary (Material A–Z). This note gives the map, the accessibility principles and assistive
technologies from the foundations overview, and a short digest of older blog posts, kept to what
still helps when designing with M3.

## Rules

### The foundations map

| Area | What it decides | Our note |
|---|---|---|
| Accessibility | Principles and assistive technology (below) | this note |
| Building for all | Inclusive process: whose needs, co-design | `building-for-all.md` |
| Content design | Voice, grammar, global writing, alt text, notifications | `content-design.md` |
| Writing and text | Text resizing, truncation, accessibility text | `writing.md` |
| Customizing Material | Brand color with dynamic color | `customization.md` |
| Design tokens | ref / sys / comp tiers, contexts | `design-tokens.md` |
| Material A–Z | Terms | `glossary.md` |
| Interaction states, layout | States and state layers; layout and adaptation | covered by other notes |

### Accessibility principles

- Accessibility is a default in Material, not an add-on. Components ship with accessibility
  behavior built in, and anticipating diverse needs early is cheaper than redesigning later.
- Plan for permanent, temporary and situational limits alike: low vision, blindness, hearing,
  cognitive and motor impairments, and situations such as an arm in a cast.
- Honor individuals. One default never fits everyone; let people adjust the experience, and
  expect their needs to change over a day or a lifetime.
- Learn before you build. Research with people across many abilities and backgrounds before
  choosing a solution, and treat unexpected problems after launch as research input.
- Treat requirements as a starting point. WCAG minimums address specific needs, and meeting them
  creatively often helps everyone; dark mode, text-to-speech and speech-to-text began as access
  features.

### Assistive technology to design for

- Keyboard and other directional input (D-pad, trackball): focus moves item by item in a line, so
  focus order and visible focus matter.
- Screen readers (for example TalkBack): speak or braille visible text plus hidden labels such as
  alt text, icon labels and headings. Label content so the text-only version of the UI makes
  sense.
- Switch access: the system highlights items in turn until the person selects one, using one or
  more switches instead of touch.
- Also: tracking input (such as eye tracking), magnifiers, braille displays and voice input.
- Interactive icons need a target area larger than the glyph; the overview illustrates this with
  an icon's expanded touch perimeter.

### From the blog (brief)

Only the points that still guide M3 design:

- M3 launched in 2021 with Material You; dynamic color is its signature. Content-based dynamic
  color derives the scheme from an image on screen instead of the wallpaper (the 2022 m3.material.io
  redesign uses it on article pages, and switches imagery for dark mode).
- Do not signal meaning by color alone. The site's do/don't labels use blue for "do" instead of
  green and pair every color with an icon and text, which keeps them readable for people with
  red-green color blindness.
- Variable fonts give extra state cues. Material Symbols have weight, fill, grade and optical-size
  axes: fill an icon when its navigation item is selected, vary weight on hover and press. Use the
  grade axis for text state changes, since grade does not change text width.
- Match transition direction to the navigation: vertical slides between top-level pages reached
  from a vertical rail or drawer, lateral slides between tabs.
- Dark themes (award winners): use dark, slightly tinted grey surfaces rather than pure black so
  elevation can still show as lighter surfaces; keep the brand color for a few key elements; give
  illustrations darker, less saturated versions so they do not glare.
- Motion (award winners): restraint and purpose; longer timings can make an app feel calm; motion
  can be paired with sound and haptics.
- Large screens (award winners): start with margins and content regions on a column grid, then
  rethink features (for example use the extra width for previews) instead of stretching the phone
  layout.
- Illustration and imagery: keep light areas behind black text so titles stay legible, and draw
  palettes from the color system so mixed styles sit together.
- Material Theming (from 2018) set the idea that color, type and shape are the customizable
  subsystems of a theme; M3 keeps it.
- The 2018 partner studies are M2-era. Their lessons remain useful (an extended FAB fits a
  descriptive, translatable label for the main action), but some components they show, such as
  the backdrop, are not part of M3.
- Research shaped several M3 components: the switch was redesigned after accessibility findings,
  and the time picker was revised for 24-hour clock users after testing many variants.
- Teams commonly build their own design system and use public ones such as Material as a
  reference; representing the brand is the most-cited reason (2020 survey).
- Conference posts (I/O 2022–2024) list sessions and codelabs; their lasting pointers are Material
  Theme Builder for themes, the Compose and Flutter M3 libraries, and the Material 3 adaptive
  library for list-detail and supporting-pane layouts.

## Measurements

Not covered by the sources. The overview pages give no sizes; touch-target sizes are in each
component note (for example `buttons.md#accessibility`).

## Accessibility

- Design for keyboard, screen reader and switch users from the start: logical focus order,
  visible focus, a label for every control and meaningful image, and generous touch targets.
- Offer personal adjustments (text size, contrast, dark theme, motion) rather than one fixed
  experience.
- Never rely on color alone for meaning; pair it with an icon, text or shape.
- Text-specific requirements are in `writing.md`; inclusive process is in `building-for-all.md`.

## Platform mapping

- Jetpack Compose (material3 1.5.0-rc01): components carry semantics by default; `Icon` takes a
  `contentDescription` for screen readers (`null` for decorative icons).
- Flutter (`material_ui` 1.11.0): `IconButton.tooltip` supplies both a long-press tooltip and the
  spoken label.
- Web: no maintained official component. Our CSS components are built in Phase 3 and must supply
  native semantics, focus styles and labels themselves.

## Pitfalls

- Treating accessibility as a final audit instead of a starting requirement.
- Color as the only signal (red/green status, do/don't).
- Unlabeled icon buttons and images, which a screen reader announces without meaning.
- Small hit areas that equal the visible icon.
- Pure black dark themes, which lose the elevation cue.
- Copying M2-era patterns from old case studies (backdrop, M2 theming tools) into an M3 design.
