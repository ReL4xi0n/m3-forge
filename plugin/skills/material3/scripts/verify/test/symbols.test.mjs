// Icon-source rule for vector icons (owner decision, 2026-11-17): path data counts as Material
// Symbols only when it is the official geometry from google/material-design-icons (pinned in
// knowledge/sources.lock.json, indexed in symbols-paths.json). Hand-drawn paths and paths from other
// sets are icon-source violations.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { verify } from '../index.mjs';
import { absolutize, canonical, isOfficial, normalizePath, officialIndex, svgIsIcon, webSvgIcons } from '../symbols.mjs';

const repo = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..', '..', '..', '..');

// Official Material Symbols "home": Outlined, unfilled, web SVG form (symbols/web/home/
// materialsymbolsoutlined/home_24px.svg) and Rounded, filled, Android form (symbols/android/home/
// materialsymbolsrounded/home_fill1_24px.xml), at the pinned commit. Apache-2.0.
const HOME_WEB = 'M240-200h120v-240h240v240h120v-360L480-740 240-560v360Zm-80 80v-480l320-240 320 240v480H520v-240h-80v240H160Zm320-350Z';
const HOME_ANDROID = 'M160,760L160,400Q160,381 168.5,364Q177,347 192,336L432,156Q453,140 480,140Q507,140 528,156L768,336Q783,347 791.5,364Q800,381 800,400L800,760Q800,793 776.5,816.5Q753,840 720,840L600,840Q583,840 571.5,828.5Q560,817 560,800L560,600Q560,583 548.5,571.5Q537,560 520,560L440,560Q423,560 411.5,571.5Q400,583 400,600L400,800Q400,817 388.5,828.5Q377,840 360,840L240,840Q207,840 183.5,816.5Q160,793 160,760Z';
// Another set: legacy Material Icons "home" (src/action/home/materialicons/24px.svg, same commit).
const LEGACY_HOME = 'M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z';
// Hand-drawn.
const DRAWN = 'M12 3 21 20H3Z';

const svg = d => `<svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 -960 960 960" width="24"><path d="${d}"/></svg>`;

// What an SVG-to-Compose converter writes: the path as absolute DSL calls.
function dsl(d) {
  return absolutize(
    normalizePath(d).map(([c, ...a]) => [c, ...a]),
  ).map(([c, ...a]) => {
    const f = a.map(n => `${n}f`).join(', ');
    return { M: `moveTo(${f})`, L: `lineTo(${f})`, C: `curveTo(${f})`, Q: `quadTo(${f})`, Z: 'close()' }[c];
  }).join('\n        ');
}

const imageVector = (body, width = 24) => `package app
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.graphics.vector.path
import androidx.compose.ui.unit.dp
val Home: ImageVector = ImageVector.Builder(
    name = "Home", defaultWidth = ${width}.dp, defaultHeight = ${width}.dp,
    viewportWidth = 960f, viewportHeight = 960f,
).apply {
    ${body}
}.build()
`;

function project(files) {
  const dir = mkdtempSync(join(tmpdir(), 'm3-symbols-'));
  for (const [rel, text] of Object.entries(files)) {
    mkdirSync(dirname(join(dir, rel)), { recursive: true });
    writeFileSync(join(dir, rel), text);
  }
  return dir;
}

const iconHits = async (dir, platform) => (await verify({ projectDir: dir, platform })).violations.filter(v => v.check === 'icon-source');

test('the index is built from the pinned official source', () => {
  const lock = JSON.parse(readFileSync(join(repo, 'knowledge', 'sources.lock.json'), 'utf8')).sources.find(s => s.id === 'material-symbols-paths');
  const { set, source } = officialIndex();
  assert.equal(source.commit, lock.commit);
  assert.equal(source.repo, lock.repo);
  assert.ok(set.size > 30000, `${set.size} paths`);
});

test('normalizePath: relative and absolute spellings of the same geometry are equal', () => {
  const a = canonical(normalizePath('M10 10h5v5h-5z'));
  const b = canonical(normalizePath('m10,10 L15 10 L15 15 L10 15 Z'));
  assert.equal(a, b);
  assert.equal(canonical(normalizePath('M0 0 10 10')), canonical(normalizePath('M0 0L10 10')), 'implicit lineto after moveto');
  assert.equal(canonical(normalizePath('M0 0a5 5 0 105 5')), canonical(normalizePath('M0 0A5 5 0 1 0 5 5')), 'compact arc flags');
  assert.equal(normalizePath('M0 0 L x'), null);
});

test('official paths are recognised in both official forms; others are not', () => {
  assert.equal(isOfficial(normalizePath(HOME_WEB)), true);
  assert.equal(isOfficial(normalizePath(HOME_ANDROID)), true);
  assert.equal(isOfficial(normalizePath(LEGACY_HOME)), false, 'legacy Material Icons are another set');
  assert.equal(isOfficial(normalizePath(DRAWN)), false);
  assert.equal(isOfficial(normalizePath(HOME_WEB.replace('h120v-240', 'h121v-240'))), false, 'one coordinate changed');
});

test('svgIsIcon: icon-sized or official-frame svgs are icons; charts and illustrations are not', () => {
  assert.equal(svgIsIcon(' viewBox="0 -960 960 960"'), true);
  assert.equal(svgIsIcon(' viewBox="0 0 24 24"'), true);
  assert.equal(svgIsIcon(' width="20" height="20"'), true);
  assert.equal(svgIsIcon(' viewBox="0 0 600 200"'), false);
  assert.equal(svgIsIcon(' width="320" height="180"'), false);
  assert.equal(webSvgIcons('<svg viewBox="0 0 600 200"><path d="M0 0L600 200"/></svg>').length, 0);
});

test('web: an official Material Symbols svg copied unchanged is not a violation (HTML and JSX)', async () => {
  const dir = project({
    'index.html': `<!doctype html><html><body><button aria-label="Home">${svg(HOME_WEB)}</button></body></html>\n`,
    'src/Nav.jsx': `export const Nav = () => (\n  <a href="/">\n    <svg viewBox="0 -960 960 960" width={24} height={24}><path d="${HOME_WEB}" /></svg>\n  </a>\n);\n`,
  });
  assert.deepEqual(await iconHits(dir, 'web'), []);
});

test('web: hand-drawn, other-set, edited and non-path icons are violations; a chart is not', async () => {
  const dir = project({
    'drawn.html': `<p>${svg(DRAWN).replace('0 -960 960 960', '0 0 24 24')}</p>\n`,
    'legacy.html': `<p><svg viewBox="0 0 24 24" width="24" height="24"><path d="M0 0h24v24H0z" fill="none"/><path d="${LEGACY_HOME}"/></svg></p>\n`,
    'edited.html': `<p>${svg(HOME_WEB.replace('h120v-240', 'h121v-240'))}</p>\n`,
    'circle.html': `<p><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8"/></svg></p>\n`,
    'chart.html': '<p><svg viewBox="0 0 600 200"><path d="M0 200L100 120L200 160L300 40"/></svg></p>\n',
  });
  const hits = await iconHits(dir, 'web');
  assert.deepEqual(hits.map(h => h.file).sort(), ['circle.html', 'drawn.html', 'edited.html', 'legacy.html']);
  assert.ok(hits.every(h => /not official Material Symbols geometry/.test(h.detail)));
});

test('compose: an ImageVector of the official geometry (converter DSL or path string) is not a violation', async () => {
  const dir = project({
    'app/src/main/kotlin/app/HomeDsl.kt': imageVector(`path {\n        ${dsl(HOME_ANDROID)}\n    }`),
    'app/src/main/kotlin/app/HomeNodes.kt': imageVector(`addPath(pathData = addPathNodes("${HOME_WEB}"))`).replace('val Home', 'val HomeNodes'),
  });
  assert.deepEqual(await iconHits(dir, 'compose'), []);
});

test('compose: hand-drawn and other-set ImageVector icons are violations; a large illustration is not', async () => {
  const dir = project({
    'app/src/main/kotlin/app/Drawn.kt': imageVector(`path {\n        moveTo(480f, 80f)\n        lineTo(880f, 880f)\n        lineTo(80f, 880f)\n        close()\n    }`),
    'app/src/main/kotlin/app/Legacy.kt': imageVector(`path {\n        ${dsl(LEGACY_HOME)}\n    }`),
    'app/src/main/kotlin/app/Hero.kt': imageVector(`path {\n        moveTo(0f, 0f)\n        lineTo(960f, 960f)\n    }`, 240),
  });
  const hits = await iconHits(dir, 'compose');
  assert.deepEqual(hits.map(h => h.file).sort(), ['app/src/main/kotlin/app/Drawn.kt', 'app/src/main/kotlin/app/Legacy.kt']);
});

test('compose: path strings passed to an icon helper are checked one by one; the helper is not an icon', async () => {
  const helper = `package app
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.graphics.vector.addPathNodes
import androidx.compose.ui.unit.dp
object AppIcons {
    private fun icon(name: String, path: String): ImageVector =
        ImageVector.Builder(name = name, defaultWidth = 24.dp, defaultHeight = 24.dp, viewportWidth = 960f, viewportHeight = 960f)
            .addPath(pathData = addPathNodes(path), fill = SolidColor(Color.Black)).build()
    val Home = icon("Home", "${HOME_WEB}")
    val HomeRounded = icon("HomeRounded", "${HOME_ANDROID}")
    val Legacy = icon("Legacy", "${LEGACY_HOME}")
    val Drawn = icon("Drawn", "M480,80L880,880L80,880Z")
}
`;
  const dir = project({ 'app/src/main/kotlin/app/AppIcons.kt': helper });
  const hits = await iconHits(dir, 'compose');
  const lines = helper.split('\n');
  assert.deepEqual(hits.map(h => lines[h.line - 1].trim().split(' =')[0]), ['val Legacy', 'val Drawn']);
});

test('web: an icon map rendered through <path d={…}> is checked string by string', async () => {
  const dir = project({
    'src/Icon.jsx': `const PATHS = {\n  home: '${HOME_WEB}',\n  legacy: '${LEGACY_HOME}',\n};\nexport const Icon = ({ name }) => (\n  <svg viewBox="0 -960 960 960" width="24" height="24"><path d={PATHS[name]} /></svg>\n);\n`,
  });
  const hits = await iconHits(dir, 'web');
  assert.deepEqual(hits.map(h => h.line), [3]);
});

test('web: sprite symbols are icons of their own, <use> is not counted again, favicons are not icons', async () => {
  const dir = project({
    'index.html': [
      `<link rel="icon" href="data:image/svg+xml,%3Csvg viewBox='0 0 32 32'%3E%3Cpath d='M22 6H10a2 2 0 0 0-2 2v16'/%3E%3C/svg%3E">`,
      '<svg width="0" height="0" style="position:absolute">',
      `  <symbol id="home" viewBox="0 -960 960 960"><path d="${HOME_WEB}"/></symbol>`,
      `  <symbol id="legacy" viewBox="0 0 24 24"><path d="${LEGACY_HOME}"/></symbol>`,
      '</svg>',
      '<p><svg class="icon" aria-hidden="true"><use href="#legacy"/></svg> <svg class="icon"><use href="#home"/></svg></p>',
      '',
    ].join('\n'),
  });
  const hits = await iconHits(dir, 'web');
  assert.deepEqual(hits.map(h => h.line), [4]);
});

test('android: vector drawables are checked the same way', async () => {
  const vector = d => `<vector xmlns:android="http://schemas.android.com/apk/res/android" android:width="24dp" android:height="24dp" android:viewportWidth="960" android:viewportHeight="960">\n  <path android:fillColor="#FF000000" android:pathData="${d}"/>\n</vector>\n`;
  const dir = project({
    'app/src/main/res/drawable/ic_home.xml': vector(HOME_ANDROID),
    'app/src/main/res/drawable/ic_drawn.xml': vector('M480,80L880,880L80,880Z'),
    'app/src/main/kotlin/app/Main.kt': 'package app\n',
  });
  const hits = await iconHits(dir, 'compose');
  assert.deepEqual(hits.map(h => h.file), ['app/src/main/res/drawable/ic_drawn.xml']);
});
