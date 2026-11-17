# Icons

Material Symbols (Outlined) is the only icon source. Every icon comes from `scripts/icons`.

## Workflow

1. List the icons the UI needs by their Material Symbols names (`search`, `shopping_cart`,
   `calendar_month`, `person`, ...).
2. Run `node scripts/icons/index.mjs <projectDir> --platform web|flutter|compose --names a,b,c`.
   - Names are checked against the bundled `assets/fonts/MaterialSymbolsOutlined.codepoints`.
     Exit 4 lists unknown names: pick a real name and run again. Never guess a codepoint.
   - Exit 5 means the platform has no icon back end in this version; follow the platform
     reference for that case.
3. Use exactly what it returns. Icons that are not in its output do not go in the UI.

## Per platform

- Web: the bundled `MaterialSymbolsOutlined.woff2` (installed with `scripts/install-assets`, part
  `fonts`) in an `@font-face`, and a `material-symbols-outlined` class using it. Icon text is the
  ligature name inside an element with `aria-hidden="true"` when decorative. No icon CDN links.
- Flutter: the bundled Material Symbols font installed as an asset family, with icons from the
  script's output. Never the `Icons.*` class: that is the legacy Material Icons font.
- Compose: official Material Symbols vector drawables `res/drawable/m3s_<name>.xml`, copied by the
  script only for the icons used, referenced as `painterResource(R.drawable.m3s_<name>)` (or
  `ImageVector.vectorResource`). Never `Icons.Default.*`, `Icons.Filled.*`, `Icons.Outlined.*` or
  the `material-icons-extended` artifact. Delete no longer used `m3s_` files.

## Axes

| Axis | Default | Change it when |
|---|---|---|
| FILL | 0 | 1 for a selected or active state (selected nav destination, toggled-on icon button, favorited item) |
| wght | 400 | keep 400 everywhere; one weight per product |
| GRAD | 0 | keep 0 |
| opsz | 24 | match the rendered size when an icon is drawn larger or smaller |

- Web: `font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24` on the class, and
  `'FILL' 1` on the selected state.
- Flutter and Compose cannot set axes at runtime the same way; the script's `--fill` option
  (default `0,1`) delivers both the outline and the filled variant. Swap between them on selection.
- Standard size is 24dp [site:/styles/icons/designing-icons]; component icon sizes come from the
  component (button icons, FAB icons). Never stretch a glyph past its optical size.

## Use

- One style (Outlined) and one weight in the whole UI.
- Pick a common, widely understood metaphor; label any icon whose meaning is not obvious.
  Navigation destinations always have a text label.
- Icon-only buttons have an accessible name (accessibility.md) and a target of at least
  48dp [site:/styles/icons/applying-icons].
- Next to text: same visual size as the text, vertically centered, not sitting on the baseline.
- Icon color is a role: the on role of its container, `onSurfaceVariant` for inactive icons on a
  surface, `primary` or the component's active role when selected.
- Mirror directional icons (arrow_back, arrow_forward, send) in right-to-left layouts; never mirror
  clocks or refresh arrows.
- Image placeholders use an icon in a tokened container (content.md).

## Never

- Draw an icon: no hand-written `<svg>` paths, `Path` or `ImageVector.Builder` geometry, no edited
  official paths.
- Import another icon set: Font Awesome, Heroicons, Lucide, Feather, Ionicons, Phosphor, Tabler,
  Bootstrap Icons, Remix, Iconify, `@mui/icons-material`, the legacy Material Icons font, or
  similar.
- Use emoji or Unicode symbols as icons, bullets or decoration.
- Mix filled and outlined glyphs for the same state, or several weights.
