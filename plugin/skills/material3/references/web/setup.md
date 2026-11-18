# Web setup

`S` is the skill folder. `<main>` is where the skill's web files go: `src/styles/m3/` when the
project has a `src/` folder, else `assets/m3/` (`install-assets` picks it; `--dest` overrides).

## Project kinds

- Empty or plain folder (`framework: plain`): a static site. `index.html` at the project root,
  `<main>` = `assets/m3/`, page CSS in `styles.css`, script in `app.js`. No build step and no npm
  package is needed.
- React, Vue or Svelte project (`framework`): keep its build tool and structure; put components in
  its usual folder and import the skill CSS once from the entry module (`frameworks.md`). Add no UI
  library, CSS-in-JS or utility CSS framework.
- A project with a role-based M3 theme (`themeFiles`): keep it and add only what is missing.

## Steps

1. Color theme (the web file is `<main>/theme.css`):
   `node "S/scripts/color/index.mjs" --seed "<hex>" --platform web --out "<project>/<main>/theme.css"`.
   Exit 3: the file exists and is not generated; pick another name (`m3-theme.css`).
2. Assets: `node "S/scripts/install-assets/index.mjs" <project> --platform web --parts tokens,fonts,<components>[,behaviors]`.
3. Icons, after step 2 (it replaces the full Material Symbols font with the subset):
   `node "S/scripts/icons/index.mjs" <project> --platform web --names a,b,c` (`icons.md`).

Parts and what they copy (all into `<main>`):

| Part | Files |
|---|---|
| `tokens` | `tokens.css`: type scale, `.m3-type-*` classes, shape, elevation, motion, state, spacing, component tokens |
| `fonts` | `fonts.css` and `fonts/` (Roboto, Roboto Flex, Material Symbols Outlined woff2, licenses) |
| `behaviors` | `behaviors.js`: global `M3` (dialog, menu, snackbar, ripple, motion) |
| `<component>` | `<component>.css`, one per component (`components.md`) |

- Install only the components the UI uses: verify warns about an installed sheet no page links
  (`asset-unused`). Companions: `button-group`, `split-button`, `dialog`, `snackbar` and
  `tooltip` need `button`; `top-app-bar`, `search` and `snackbar` need `icon-button`; `menu`
  separators need `divider`.
- Re-running `install-assets` later: leave out `fonts` once `icons` has run (the subset differs from
  the shipped font, so it would be a conflict, exit 3). Never edit an installed file: verify exempts
  the shipped files only while they are unchanged.

## Linking order

Static page (`<head>`):

```html
<link rel="stylesheet" href="assets/m3/fonts.css">
<link rel="stylesheet" href="assets/m3/tokens.css">
<link rel="stylesheet" href="assets/m3/theme.css">
<link rel="stylesheet" href="assets/m3/button.css">   <!-- each component part used -->
<link rel="stylesheet" href="styles.css">              <!-- page CSS last -->
<script src="assets/m3/behaviors.js" defer></script>
<script src="app.js" defer></script>
```

Framework: the same order as imports in the entry module (`import './styles/m3/fonts.css'`, ...,
`import './styles/m3/behaviors.js'`), before the app's own CSS.

Page CSS starts with:

```css
body {
  margin: 0;
  background: var(--md-sys-color-surface);
  color: var(--md-sys-color-on-surface);
  font-family: var(--md-sys-typescale-body-large-font);
}
```

plus the icon class from `icons.md`. Text takes an `.m3-type-<role>-<size>` class (or
`.m3-type-emphasized-...`); spacing `var(--md-sys-space-<step>)`; corners
`var(--md-sys-shape-corner-<step>)`; surfaces the `--md-sys-color-surface-container*` roles.
Call `M3.ripple(document)` once after the page loads for pressed ripples.

## Theme attributes

On the root element (`<html>`):

- Light by default; dark follows `prefers-color-scheme`. `data-theme="light"` or `"dark"` forces
  one (a theme switch sets this attribute; never write a second set of colors).
- `data-contrast="medium"` or `"high"` selects the medium or high contrast scheme.
- `data-m3-style="classic"` when the request asks for classic Material 3: emphasized type becomes the
  regular role, the Expressive shape steps fall back to the standard ones and springs to the standard
  motion. Leave out Expressive-only components then (button groups, split button, loading
  indicator, FAB menu, toolbars).

## Screenshot step (SKILL step 7)

```
node "S/scripts/screenshot/index.mjs" <project> --platform web [--url <dev server address>] [--states <file.json>]
node "S/scripts/verify/index.mjs" <project> web "<capture.json>"
```

- It renders the page at 412x915 and 1440x900, light and dark (4 PNGs), in a new temporary folder
  (path in `capture`), never in the project. It uses the project's or a global Playwright, else an
  installed Chrome or Edge (`engine: "cdp"`); it never installs either. With neither it gives
  `ran: false` with `skippedReason`: name it in the report.
- Open every PNG and look at it: overlapping parts, clipped text and icons shown as their names
  appear only in the images, not in the findings.
- What it opens: the `--url` address if given; a Vite project is built into the temporary folder;
  otherwise the first `index.html` in the root, `dist/`, `public/` or `src/`. Next, Nuxt,
  SvelteKit, Astro and Angular need `--url` (start the dev server first).
- It prints `contrast` (text against the background actually drawn) and `targets` (interactive
  elements below the minimum at 412 width), plus `warnings` (sideways scroll) and `pageErrors`.
  Fix them all, read every PNG against `CHECKLIST.md`, and run it again. Pass `capture.json` to verify.
- States (screens reached by an action): `--states <file>`, a JSON file outside the project. Each
  state reloads the page, runs its steps, and shoots both viewports in both themes as
  `state-<name>-<theme>-<viewport>.png`. `capture.json` gets `states: [{ name, ok, shots, error? }]`;
  a step that finds nothing marks that state `ok: false` (and a warning): fix the steps or the page.
  A target is a CSS selector, or `text=Label` for exact visible text. Steps: `click`, `fill` (with
  `text`), `press` (a key name such as `Enter`), `waitMs`.

  ```json
  { "states": [ { "name": "empty-search", "steps": [
    { "fill": "#search", "text": "cactus" }, { "press": "Enter" } ] } ] }
  ```

## Without Node

Copy the files by hand from `S/assets/web/` (`tokens.css`, `fonts.css`, `behaviors.js`,
`components/<part>.css`) and `S/assets/fonts/` (the `.woff2` files and licenses into `<main>/fonts/`).
Write `theme.css` from the precomputed scheme: `--md-sys-color-<role>` for light in `:root`, dark in
`@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) { ... } }` and
`:root[data-theme="dark"]`.
