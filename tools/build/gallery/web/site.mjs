#!/usr/bin/env node
// Builds a servable folder for one web component gallery page (maintainer tool, not shipped):
// the page as index.html, the skill's web assets installed the way a project gets them
// (scripts/install-assets: tokens, fonts and the component parts the page links, into assets/m3/), and the color
// theme from scripts/color for the baseline seed (assets/m3/theme.css).
//
//   buildGallerySite(name, outDir) -> { dir, page }      name: actions, ...
//   CLI: node tools/build/gallery/web/site.mjs <name> <outDir>
// Capture it with the harness (read-only use): node harness/web/capture.mjs <outDir> web-empty <shotsDir>
import { copyFileSync, existsSync, mkdirSync, readFileSync, rmSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { installAssets } from '../../../../plugin/skills/material3/scripts/install-assets/index.mjs';
import { MANIFEST, WEB_COMPONENTS } from '../../../../plugin/skills/material3/scripts/install-assets/manifest.mjs';
import { BASELINE_SEED, writeTheme } from '../../../../plugin/skills/material3/scripts/color/index.mjs';

const HERE = fileURLToPath(new URL('.', import.meta.url));
export const GALLERY_DIR = HERE;
export const THEME_PATH = 'assets/m3/theme.css';

export function buildGallerySite(name, outDir) {
  const page = join(HERE, `${name}.html`);
  if (!existsSync(page)) throw new Error(`no gallery page ${name}.html in ${HERE}`);
  const dir = resolve(outDir);
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
  // Tokens, fonts and the component parts whose style sheet the page links (an installed sheet the
  // page does not use would be an unused asset).
  const html = readFileSync(page, 'utf8');
  const linked = WEB_COMPONENTS.filter(c => html.includes(`href="assets/m3/${c}.css"`));
  const parts = Object.keys(MANIFEST.web).filter(p => !WEB_COMPONENTS.includes(p) || linked.includes(p));
  const r = installAssets({ projectDir: dir, platform: 'web', parts });
  if (r.conflicts.length) throw new Error(`install conflicts: ${r.conflicts.join(', ')}`);
  writeTheme({ platform: 'web', seed: BASELINE_SEED, out: join(dir, THEME_PATH) });
  copyFileSync(page, join(dir, 'index.html'));
  return { dir, page };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [name, outDir] = process.argv.slice(2);
  if (!name || !outDir) {
    console.error('usage: node tools/build/gallery/web/site.mjs <name> <outDir>');
    process.exit(2);
  }
  const { dir } = buildGallerySite(name, outDir);
  console.log(dir);
}
