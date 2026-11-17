// Data-driven asset manifest: platform -> part -> files.
// Each file: { src, group, name? , androidName? }
//   src          path under the skill's assets/ folder
//   group        'main' (theme/token files), 'fonts', or 'licenses'; the platform rules in
//                index.mjs decide each group's destination directory
//   name         file name at the destination (default: basename of src)
//   androidName  file name for Compose (res/ names must be lowercase [a-z0-9_])
// A later task adds assets by adding entries here; nothing else needs to change.

const LICENSES = [
  { src: 'fonts/OFL-Roboto.txt', group: 'licenses', androidName: 'ofl_roboto.txt' },
  { src: 'fonts/OFL-RobotoFlex.txt', group: 'licenses', androidName: 'ofl_roboto_flex.txt' },
  { src: 'fonts/LICENSE-material-design-icons.txt', group: 'licenses', androidName: 'license_material_design_icons.txt' },
];

const TTF_FONTS = [
  { src: 'fonts/RobotoFlex.ttf', group: 'fonts', androidName: 'roboto_flex.ttf' },
  { src: 'fonts/Roboto.ttf', group: 'fonts', androidName: 'roboto.ttf' },
  { src: 'fonts/MaterialSymbolsOutlined.ttf', group: 'fonts', androidName: 'material_symbols_outlined.ttf' },
];

// Compose icons are vector drawables, so Compose copies no Symbols font (and no icons license).
// Roboto and Roboto Flex stay for now: Type.kt uses FontFamily.SansSerif and references no R.font.*;
// Task 23 decides whether they become R.font families or leave this part.
const COMPOSE_LICENSES = LICENSES.filter((l) => !/material-design-icons/.test(l.src));
const COMPOSE_FONTS = TTF_FONTS.filter((f) => !/MaterialSymbols/.test(f.src));

export const MANIFEST = {
  web: {
    tokens: [{ src: 'web/tokens.css', group: 'main' }],
    // The Roboto Flex woff2 replaces the TTF here; fonts.css (main group) declares the @font-face rules.
    fonts: [
      { src: 'web/fonts.css', group: 'main' },
      { src: 'fonts/RobotoFlex.woff2', group: 'fonts' },
      { src: 'fonts/Roboto.ttf', group: 'fonts' },
      { src: 'fonts/MaterialSymbolsOutlined.woff2', group: 'fonts' },
      ...LICENSES,
    ],
  },
  flutter: {
    tokens: ['motion', 'shape', 'space', 'tokens', 'type'].map((n) => ({ src: `flutter/lib/m3/${n}.dart`, group: 'main' })),
    fonts: [...TTF_FONTS, ...LICENSES],
  },
  compose: {
    theme: ['Motion', 'Shape', 'Space', 'Tokens', 'Type'].map((n) => ({ src: `compose/theme/${n}.kt`, group: 'main' })),
    fonts: [...COMPOSE_FONTS, ...COMPOSE_LICENSES],
  },
};
