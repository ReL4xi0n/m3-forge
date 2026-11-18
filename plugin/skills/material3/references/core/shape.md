# Shape

Every corner radius is a step of the shape scale. Never write a radius number in UI code.

## The scale

Names: web `--md-sys-shape-corner-<step>` (`assets/web/tokens.css`); Flutter `M3Corners.<camel>`
and `M3Shapes.<camel>` (`lib/m3/shape.dart`); Compose `M3Shapes.<camel>` (`theme/Shape.kt`). (E) marks
the Expressive-only steps.

| Step | camel | Radius |
|---|---|---|
| none | none | 0dp [token:md.sys.shape.corner-value.none] |
| extra-small | extraSmall | 4dp [token:md.sys.shape.corner-value.extra-small] |
| small | small | 8dp [token:md.sys.shape.corner-value.small] |
| medium | medium | 12dp [token:md.sys.shape.corner-value.medium] |
| large | large | 16dp [token:md.sys.shape.corner-value.large] |
| large-increased (E) | largeIncreased | 20dp [token:md.sys.shape.corner-value.large-increased] |
| extra-large | extraLarge | 28dp [token:md.sys.shape.corner-value.extra-large] |
| extra-large-increased (E) | extraLargeIncreased | 32dp [token:md.sys.shape.corner-value.extra-large-increased] |
| extra-extra-large (E) | extraExtraLarge | 48dp [token:md.sys.shape.corner-value.extra-extra-large] |
| full (pill, circle) | `M3Shapes.full` (Flutter `StadiumBorder`, Compose `CircleShape`) | fully round [token:md.sys.shape.corner.full] |

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

- Library shapes: Compose `MaterialShapes`, Flutter `MaterialShapes` / `MaterialShapeBorder`, web
  part `shapes`; where they go is in composition.md. A shape carries no fixed meaning.
- Morphs answer an interaction (pressed, selected, loading). Drive them with the motion scheme's
  spatial springs (motion.md), never a fixed duration.
- Web has no shape morph; switch between scale steps on state change and transition the radius
  with the spatial curve from motion.md.
- Reduced motion: jump straight to the end shape.

- Pills and circles use the full step, never a percentage radius.
