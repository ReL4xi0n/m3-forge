# Anti-patterns

Habits from generic UI code that break Material 3. `scripts/verify` reports most of them under the
check name in brackets. Fix the cause, never silence the check.

## Color [hardcoded-color]

- Hex, `rgb()`, `hsl()`, named colors, `Color(0xFF...)`, `Colors.blue`, `Color.Red` in UI code.
  Use roles (color.md); new semantic colors go through `scripts/color --custom`.
- Opacity tricks (`opacity`, `withOpacity`, `copy(alpha = ...)`) to make secondary text or tinted
  fills. Use `onSurfaceVariant` and the container roles.
- Text on a role that is not its on partner (`primary` text on `primaryContainer`).

## Shadows and gradients [shadow-gradient]

- Gradients of any kind: `linear-gradient`, `radial-gradient`, `conic-gradient`, `LinearGradient`,
  `RadialGradient`, `SweepGradient`, `Brush.linearGradient`, gradient text, gradient borders,
  glassmorphism blur panels. M3 uses flat tonal surfaces.
- Hand-written shadows: `box-shadow`, `filter: drop-shadow`, `BoxShadow`, `Modifier.shadow()`,
  glows. Separate with surface container roles; use the component's own elevation (elevation.md).
- Shadows on every card.

## Shape [off-token-radius]

- Arbitrary radii (`border-radius` with a pixel or rem value, `BorderRadius.circular(<n>)`,
  `RoundedCornerShape(<n>.dp)`) or a percentage for pills. Use a shape-scale step (shape.md).
- The same radius on nested containers.

## Spacing [off-grid-spacing]

- Padding, gap or margin values that are not a spacing step, including off-grid ones made with
  `calc()` or multiplication. Use `space*` names (layout.md).
- Margins on every child instead of padding and gap on the parent.
- Left/right where start/end is meant.

## Typography [off-token-type]

- Literal font sizes, weights, line heights or letter spacing in UI code. Use the type roles
  (typography.md).
- Many sizes on one screen, ALL CAPS labels, thin weights for body text.

## Foreign styling systems [foreign-styling]

- Tailwind utility classes (`bg-blue-500`, `text-gray-700`, `rounded-xl`, `shadow-lg`, `p-4`) in a
  project that does not depend on Tailwind.
- Bootstrap classes (`btn btn-primary`, `card`, `row`/`col-*`, `fw-bold`, `rounded-pill`) in a
  project that does not depend on Bootstrap.
- In a project that does use one of them, its color, radius, shadow and font utilities still map to
  M3 tokens; never its default palette.
- Other component kits (Material UI's old M2 theme, Chakra, shadcn defaults) restyled to look
  Material. Use the platform's Material 3 components and the skill assets.

## Icons [icon-source]

- Emoji as icons, bullets, status markers or decoration.
- Flutter `Icons.*` and Compose `Icons.Default.*` / `Icons.Filled.*` / `Icons.Outlined.*`: the
  legacy Material Icons set.
- Hand-drawn or edited SVG, `Path` or `ImageVector` icons; icons from other sets or CDNs.
  Use `scripts/icons` (icons.md).

## Structure and behavior

- A navigation bar and a toolbar (or a rail) as primary navigation on one screen.
- Retired components in Expressive work (segmented button, navigation drawer, bottom app bar,
  small FAB): use the replacements in expressive.md.
- A FAB for a destructive or minor action, or two FABs on one screen.
- Dialogs for low-priority messages (use a snackbar), snackbars for decisions (use a dialog).
- Disabled FABs, disabled tabs or navigation items.
- Clickable `div`s, icon-only buttons without a name, targets under the minimum
  [contrast] [touch-target].
- Tabs or nav items that lead to empty or placeholder screens; filler content (content.md).
- Image URLs or stock photos; use tokened icon placeholders.
- Animations with literal durations and curves, bouncy springs on full-screen transitions, no
  reduced-motion handling.
- Editing generated theme files or skill assets by hand; re-run the script or install the asset.
