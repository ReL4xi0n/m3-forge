# Shape

Every corner radius is a step of the shape scale. Never write a radius number in UI code.

## The scale

| Step | Web (`assets/web/tokens.css`) | Flutter (`lib/m3/shape.dart`) | Compose (`theme/Shape.kt`) | Radius |
|---|---|---|---|---|
| None | `--md-sys-shape-corner-none` | `M3Corners.none` / `M3Shapes.none` | `M3Shapes.none` | 0dp [token:md.sys.shape.corner-value.none] |
| Extra small | `--md-sys-shape-corner-extra-small` | `M3Corners.extraSmall` | `M3Shapes.extraSmall` | 4dp [token:md.sys.shape.corner-value.extra-small] |
| Small | `--md-sys-shape-corner-small` | `M3Corners.small` | `M3Shapes.small` | 8dp [token:md.sys.shape.corner-value.small] |
| Medium | `--md-sys-shape-corner-medium` | `M3Corners.medium` | `M3Shapes.medium` | 12dp [token:md.sys.shape.corner-value.medium] |
| Large | `--md-sys-shape-corner-large` | `M3Corners.large` | `M3Shapes.large` | 16dp [token:md.sys.shape.corner-value.large] |
| Large increased (Expressive) | `--md-sys-shape-corner-large-increased` | `M3Corners.largeIncreased` | `M3Shapes.largeIncreased` | 20dp [token:md.sys.shape.corner-value.large-increased] |
| Extra large | `--md-sys-shape-corner-extra-large` | `M3Corners.extraLarge` | `M3Shapes.extraLarge` | 28dp [token:md.sys.shape.corner-value.extra-large] |
| Extra large increased (Expressive) | `--md-sys-shape-corner-extra-large-increased` | `M3Corners.extraLargeIncreased` | `M3Shapes.extraLargeIncreased` | 32dp [token:md.sys.shape.corner-value.extra-large-increased] |
| Extra extra large (Expressive) | `--md-sys-shape-corner-extra-extra-large` | `M3Corners.extraExtraLarge` | `M3Shapes.extraExtraLarge` | 48dp [token:md.sys.shape.corner-value.extra-extra-large] |
| Full (pill, circle) | `--md-sys-shape-corner-full` | `M3Shapes.full` (`StadiumBorder`) | `M3Shapes.full` (`CircleShape`) | fully round [token:md.sys.shape.corner.full] |

- Partial-corner steps: web `--md-sys-shape-corner-extra-small-top`, `-large-top`, `-large-start`,
  `-large-end`, `-extra-large-top`; Flutter `M3Corners.extraSmallTop`, `largeTop`, `largeStart`,
  `largeEnd`, `extraLargeTop`. Compose builds them from the step's shape with `.copy(...)` on
  `RoundedCornerShape` corners set to `ZeroCornerSize`.
- Flutter: `M3Corners.*` is a `BorderRadius` (for `BoxDecoration`, `ClipRRect`); `M3Shapes.*` is an
  `OutlinedBorder` (for `shape:` parameters).
- Compose: pass `MaterialTheme(shapes = M3ShapeScheme)`; read `MaterialTheme.shapes.medium` or
  `M3Shapes.largeIncreased`.
- Classic M3 request: avoid the three Expressive steps (web: `data-m3-style="classic"` maps each to
  the standard step below it).

## Choosing a step

- Material components already carry their shape. Do not override it unless the request asks for a
  squarer or rounder product; then remap the component to another step, never to a number.
- Custom containers follow the component they resemble:
  - card-like containers: medium [token:md.comp.filled-card.container.shape];
  - menus, tooltips, text fields: extra small [token:md.comp.menu.container.shape];
  - chips: small [token:md.comp.assist-chip.container.shape];
  - dialogs, bottom sheet top corners, carousel items: extra large
    [token:md.comp.dialog.container.shape];
  - buttons, search bar, floating toolbar, avatars, icon containers: full
    [token:md.comp.search-bar.container.shape].
- Keep large and full corners off dense, text-heavy containers; content must stay clear of the
  corner.
- Nested shapes: subtract the padding from the outer radius to get the inner one, then use the
  nearest scale step. Reusing the outer step inside looks wrong.
- Contrast round and square on purpose (a round button on a square-cornered card) for Expressive
  tension, but keep one shape language per component type.

## Expressive shape library and morphing

- Decorative library shapes (Compose `MaterialShapes`, Flutter `MaterialShapes` /
  `MaterialShapeBorder`) are for imagery: avatar masks, image crops, empty-state art. Never for
  text containers.
- Use them sparingly; a shape carries no fixed meaning.
- Morphs answer an interaction (pressed, selected, loading). Drive them with the motion scheme's
  spatial springs (motion.md), never a fixed duration.
- Web has no shape morph; switch between scale steps on state change and transition the radius
  with the spatial curve from motion.md.
- Reduced motion: jump straight to the end shape.

## Do not

- A literal radius in UI code: `border-radius: <n>px`, `BorderRadius.circular(<n>)`,
  `RoundedCornerShape(<n>.dp)`.
- A percentage radius for pills or circles; use the full step.
- Cut corners or odd library shapes on text-heavy surfaces.
