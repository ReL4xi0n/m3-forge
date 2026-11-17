# Color

Every color in the UI is a color role. A scheme maps roles to values; the code only names roles.

## Make the scheme

1. Seed. The brand or requested color is the seed. No color requested: pick a seed that fits the
   request's subject and name it in the report. The script's `BASELINE_SEED` (the published
   baseline scheme) is only for neutral, generic requests.
2. Variant. Default is `tonalSpot`, for M3 and for M3 Expressive alike.
   - The MCU variant called `expressive` is a palette recipe, not the M3 Expressive style. Pass
     `--variant expressive` only when the request names that variant. Other variants (`vibrant`,
     `fidelity`, `content`, `neutral`, `monochrome`, `rainbow`, `fruitSalad`) also only on request.
3. Run `scripts/color/index.mjs` (its header comment is the interface):
   `node "S/scripts/color/index.mjs" --seed <hex> --platform web|flutter|compose --out <theme file>`
   plus `--package` (Compose) or `--flutter-library` (Flutter) when needed.
   - It writes light, dark, medium-contrast and high-contrast schemes.
   - It never overwrites a file that is not its own output: exit 3 with the path. Pick another
     file name; re-running over its own output is fine.
   - An achromatic seed (gray, near black, near white) is replaced by the baseline; the JSON says
     `exact: false` with a note. Tell the user.
4. Extra semantic colors (success, warning, chart series, categories): either use existing roles
   (error, tertiary, secondary, the container roles) or add `--custom name=<hex>`. Each custom color
   comes back harmonized with the seed as four roles: `name`, `onName`, `nameContainer`,
   `onNameContainer`. Never define another red; the error roles exist.
5. No Node: follow `nearest` in `tokens/precomputed-schemes.json` (achromatic test, then HSL hue
   and saturation), copy that seed's scheme, and tell the user which seed was used.

Never edit the generated theme file by hand. Re-run the script to change it.

## Where the roles come from

| Platform | Theme file | In UI code |
|---|---|---|
| Web | CSS custom properties `--md-sys-color-<role>` (light on `:root`, dark by `prefers-color-scheme` or `data-theme="dark"`, `data-contrast="medium"`/`"high"`) | `var(--md-sys-color-primary)` |
| Flutter | `M3ColorSchemes.light`, `.dark`, `.lightMediumContrast` ... into `ThemeData(colorScheme:)`; custom colors in the `M3CustomColors` theme extension | `Theme.of(context).colorScheme.primary`, `Theme.of(context).extension<M3CustomColors>()!` |
| Compose | `M3LightColorScheme`, `M3DarkColorScheme`, `M3LightMediumContrastColorScheme` ... into `MaterialTheme(colorScheme =)`; custom colors in `M3LightCustomColors` / `M3DarkCustomColors` | `MaterialTheme.colorScheme.primary` |

## Which role for what

- Page background: `surface`. Text and icons on it: `onSurface`; quieter text: `onSurfaceVariant`.
- Nested regions, from quietest to strongest: `surfaceContainerLowest`, `surfaceContainerLow`,
  `surfaceContainer`, `surfaceContainerHigh`, `surfaceContainerHighest`. Body on `surface`,
  navigation on `surfaceContainer` is the common pairing. Two overlapping containers never share a
  role.
- Most prominent action and active state: `primary` / `onPrimary`. Large tinted fills:
  `primaryContainer` / `onPrimaryContainer`.
- Less emphasis (filter chips, tonal buttons, selected nav indicator): `secondary`,
  `secondaryContainer` and their on roles.
- Contrasting accent for a small item (badge, highlight): `tertiary`, `tertiaryContainer`.
- Errors: `error`, `onError`, `errorContainer`, `onErrorContainer`.
- Boundaries that matter (text field outline): `outline`. Dividers and decoration: `outlineVariant`.
- Snackbars and other elements that stand out from the surrounding UI: `inverseSurface`,
  `inverseOnSurface`, action in `inversePrimary`.
- Modal backdrop: `scrim` (see elevation.md).
- `primaryFixed` and the other fixed roles keep one value in light and dark; avoid them where
  contrast matters.

## Pairing rules

- Text and icons use only the "on" partner of the fill under them: `onPrimary` on `primary`,
  `onPrimaryContainer` on `primaryContainer`, `onSurface`/`onSurfaceVariant` on any surface role.
  Any other pair can fail at medium or high contrast.
- Links on a surface: `primary`, underlined.
- Charts and status: map each series or status to a role pair or a custom color's four roles.
  Keep meaning stable (error stays error) and add a second cue: label, icon or pattern.
- State layers use the content color, never a gray (see states.md).

## Hard rules

- No hex, `rgb()`, `hsl()`, named colors, `Color(0x...)` or `Color(0xFF...)` in UI code. The only
  place a literal color lives is the generated theme file.
- No palette tones (`md.ref.palette.*`) in UI code; roles only.
- Do not harmonize a brand color that must stay exact; pass it as the seed instead.
- Do not let image-derived color replace error or success meaning.

## Platform notes

- Compose's plain `lightColorScheme()` differs from web and Flutter on the light on-container roles;
  the generated `M3LightColorScheme` is what the skill uses on every platform.
- Compose `dynamicLightColorScheme(context)` (Android 12+) is allowed only when the request asks for
  wallpaper colors; keep the generated scheme as the fallback.
- `surfaceTint` and `surfaceColorAtElevation` belong to the old tint model; use container roles.
