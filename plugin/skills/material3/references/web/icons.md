# Web icons

Material Symbols Outlined as a variable font with ligatures: the icon is its name as text.

## Script

```
node "S/scripts/icons/index.mjs" <project> --platform web --names home,search,favorite [--dest <main>]
```

- Pass every icon name the UI uses, including the filled variants' names (the same name: FILL is
  an axis, not a separate icon) and icons inside components (`check`, `close`, `keyboard_arrow_down`).
  The checkbox and the switch with icons draw `check`, `remove` and `close` glyphs themselves: add
  those names when you use them.
- Exit 4 lists unknown names with suggestions; pick from them and run again.
- It writes `<main>/fonts/MaterialSymbolsOutlined.woff2`, the file `fonts.css` already points at
  (`--dest` is the folder that holds `fonts.css`). Run it after `install-assets` and again whenever
  the set of names changes: a name left out of the subset renders as plain text.
- Output `subset: true` means only the requested glyphs are in the font (a few KB). `subset: false`
  means the full font was copied (the subsetter could not run): every icon works, the file is just
  large; say so in the report.
- Every icon showing as its name, although every name was passed, means the font did not load (the
  browser console shows a font decode error). Copy the full font as in "Without Node" below and say
  so in the report.

## Markup and class

```html
<span class="m3-icon" aria-hidden="true">favorite</span>
```

Page CSS (once):

```css
.m3-icon {
  font-family: 'Material Symbols Outlined';
  font-style: normal;
  font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
  font-feature-settings: 'liga';
  letter-spacing: normal;
  text-transform: none;
  white-space: nowrap;
  direction: ltr;
  -webkit-font-smoothing: antialiased;
}
[aria-pressed="true"] .m3-icon,
[aria-current="page"] .m3-icon,
[aria-selected="true"] .m3-icon {
  font-variation-settings: 'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24;
}
```

- The component sheets size and color `.m3-icon` inside their components; outside them, size an icon
  with a type class (the icon follows the font size) and color it with a role.
- FILL 1 for selected and active states only: toggled icon buttons, the active navigation item or
  tab, a favorited item. Everything else stays at FILL 0, weight 400.
- Decorative icons get `aria-hidden="true"`; an icon-only button names the action with
  `aria-label` on the button, not on the glyph.
- No icon CDN, no `<img>` or hand-written `<svg>` icons, no other icon font, no emoji.

## Without Node

Copy `S/assets/fonts/MaterialSymbolsOutlined.woff2` to `<main>/fonts/` (the full font: every name
works). Check each name in `S/assets/fonts/MaterialSymbolsOutlined.codepoints` (one `name codepoint`
per line) before using it.
