// asset-unused (warning, not scored): a file copied from the skill's assets that no source uses.
// Copied text assets carry the marker `material3 skill asset: <asset path>` in their first lines;
// Compose icon drawables are res/drawable*/m3s_*.xml. A file copied by hand without the marker is
// not checked.
// An asset is used when a used file references it. Project files outside the skill's assets are
// used; an asset becomes used when one of them (or an asset already used) references it:
//   web      a CSS or script asset is linked or imported by file name (<link href>, <script src>,
//            @import, import, url()), or by name without extension in an import, require, Sass
//            @use/@forward/@import (a partial's underscore allowed).
//   flutter  a Dart file under lib/ imports, exports or part-s it.
//   compose  a Kotlin file names one of its top-level declarations; an m3s_ drawable is referenced as
//            R.drawable.<name> (or @drawable/<name> in a resource file).
// The theme token assets (THEME_ASSETS) are one set: all of them count as used when a used file
// references any of them, since a screen rarely needs every token file.
import { ASSET_MARKER_LINES, readText, stripComments, THEME_ASSETS } from './common.mjs';
import { brandAssetNames } from './content.mjs';

const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const base = p => p.slice(p.lastIndexOf('/') + 1);

const WEB_TEXT = /\.(?:html?|css|scss|sass|less|[cm]?[jt]sx?|vue|svelte|astro|json)$/i;
const WEB_ASSET = /\.(?:css|scss|[cm]?js)$/i;
const DRAWABLE = /(?:^|\/)res\/drawable[^/]*\/(m3s_[a-z0-9_]+)\.xml$/;

function strip(rel, text) {
  if (/\.(?:html?|vue|svelte|astro)$/i.test(rel)) {
    return stripComments(stripComments(text, { html: true, line: false, block: false, quotes: [] }), { line: false, quotes: [] });
  }
  if (/\.json$/i.test(rel)) return text;
  if (/\.(?:css|less)$/i.test(rel)) return stripComments(text, { line: false });
  if (/\.xml$/i.test(rel)) return stripComments(text, { html: true, line: false, block: false, quotes: [] });
  return stripComments(text, { backtick: /\.[cm]?[jt]sx?$/i.test(rel), triple: /\.(?:dart|kt)$/i.test(rel) });
}

// Top-level declaration names of a Kotlin file (column 0, annotations allowed before them).
function kotlinDecls(src) {
  const names = [];
  const re = /^(?:@[\w.]+(?:\([^)\n]*\))?\s+)*(?:(?:public|internal|private|data|enum|sealed|value|inline|annotation|abstract|open|const|inner)\s+)*(?:object|class|interface|fun|val|var|typealias)\s+(?:<[^>]*>\s*)?(?:[\w.<>?, ]+\.)?([A-Za-z_]\w*)/gm;
  let m;
  while ((m = re.exec(src))) names.push(m[1]);
  return names;
}

function usedBy(platform, asset, other) {
  if (asset.drawable) {
    return new RegExp(`\\bR\\.drawable\\.${asset.drawable}\\b|@drawable/${asset.drawable}\\b`).test(other.src);
  }
  const name = esc(base(asset.rel));
  if (platform === 'web') {
    // By full file name (quoted or not, in links, url() and imports), or without the extension (and with
    // a Sass partial underscore) in an import, require, @use, @forward or @import.
    const stem = esc(base(asset.rel).replace(/\.[^.]+$/, ''));
    return new RegExp(`(?:^|[\\s"'(/=,])${name}(?=$|[\\s"')?#,;>])`, 'm').test(other.src) ||
      new RegExp(`(?:\\b(?:import|from|require)\\b|@use|@forward|@import)\\s*\\(?\\s*["'](?:[^"'\\n]*/)?_?${stem}["']`).test(other.src);
  }
  if (platform === 'flutter') {
    return new RegExp(`\\b(?:import|export|part)\\s+(["'])[^"'\\n]*\\b${name}\\1`).test(other.src);
  }
  return asset.decls.some(d => new RegExp(`\\b${esc(d)}\\b`).test(other.src));
}

// files: all project files (posix, relative); returns [{ rel, text, detail }] for unused assets.
export async function unusedAssets(projectDir, platform, files) {
  const sources = [];
  for (const rel of files) {
    let keep;
    if (platform === 'web') keep = WEB_TEXT.test(rel);
    else if (platform === 'flutter') keep = /^lib\/.*\.dart$/.test(rel);
    else keep = (/(?:^|\/)src\/main\/.*\.(?:kt|java)$/.test(rel) || /(?:^|\/)src\/main\/.*\.xml$/.test(rel));
    if (!keep) continue;
    let text;
    try {
      text = await readText(projectDir, rel);
    } catch {
      continue;
    }
    const head = text.split('\n', ASSET_MARKER_LINES).join('\n');
    const m = head.match(/material3 skill asset: (\S+)/);
    const d = platform === 'compose' ? rel.match(DRAWABLE) : null;
    const assetPath = m && (platform !== 'web' || WEB_ASSET.test(rel)) && !/\.xml$/i.test(rel) ? m[1] : null;
    const src = strip(rel, text);
    sources.push({
      rel, text, src,
      asset: assetPath || d ? {
        rel,
        path: assetPath ?? `drawable ${d[1]}`,
        theme: Boolean(assetPath && THEME_ASSETS.has(assetPath)),
        drawable: d ? d[1] : null,
        decls: platform === 'compose' && /\.kt$/.test(rel) ? kotlinDecls(src) : [],
      } : null,
    });
  }
  // An asset is used when a used file references it. Project files outside the skill's assets are the
  // starting set; an asset referenced only by unused assets stays unused. The theme files join as a set.
  const assets = sources.filter(s => s.asset);
  const usedFiles = sources.filter(s => !s.asset);
  const isUsed = new Set();
  const refBy = a => usedFiles.some(o => o.rel !== a.rel && usedBy(platform, a, o));
  for (let changed = true; changed;) {
    changed = false;
    const theme = assets.filter(s => s.asset.theme && !isUsed.has(s.rel));
    if (theme.length && theme.length === assets.filter(s => s.asset.theme).length && theme.some(s => refBy(s.asset))) {
      for (const s of theme) { isUsed.add(s.rel); usedFiles.push(s); }
      changed = true;
    }
    for (const s of assets) {
      if (s.asset.theme || isUsed.has(s.rel) || !refBy(s.asset)) continue;
      isUsed.add(s.rel);
      usedFiles.push(s);
      changed = true;
    }
  }
  const out = [];
  for (const s of assets) {
    const a = s.asset;
    if (isUsed.has(s.rel)) continue;
    const how = a.drawable
      ? `no code references R.drawable.${a.drawable}`
      : a.theme
        ? 'no used project file uses any of the skill theme files'
        : platform === 'web'
          ? 'no file links or imports it'
          : platform === 'flutter'
            ? 'no Dart file imports it'
            : 'no Kotlin file uses its declarations';
    out.push({ rel: s.rel, text: s.text, detail: `copied from the skill (${a.path}) but unused: ${how}` });
  }
  return out;
}

// Project-wide unscored checks: brand names in image and drawable file names, and unused assets.
export async function projectChecks(projectDir, platform, files, collector) {
  for (const { rel, brand } of brandAssetNames(files)) {
    collector.forFile(rel, '')('brand', 0, `brand name "${brand}" in the file name ${rel.slice(rel.lastIndexOf('/') + 1)}`);
  }
  for (const u of await unusedAssets(projectDir, platform, files)) {
    collector.forFile(u.rel, u.text)('asset-unused', 0, u.detail);
  }
}
