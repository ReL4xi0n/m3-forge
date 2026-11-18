// Web component style sheets (plugin/skills/material3/assets/web/components/*.css) and their gallery
// pages (tools/build/gallery/web/*.html).
//   Static: install parts and markers, every value a token variable, colors only from the color roles,
//   every variable declared, class names, the [impl:] values in tokens.css, the token ladder, and
//   verify on a gallery site (no scored finding).
//   Toolchain (M3_TOOLCHAIN_TESTS=1): the harness capture and the skill's screenshot step on each
//   gallery (no touch-target or contrast finding in either theme or viewport) and computed checks in
//   Chromium (label contrast over the drawn container, which axe cannot measure on a pseudo-element;
//   state layers, elevation and focus rings per gallery (STATE_CHECKS); container geometry and button
//   group gaps; text field labels; no sideways scroll).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createReadStream, existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { extname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildSkillTokens } from '../tokens.mjs';
import { IMPL_VALUES, implCss, shadowOf, TARGET_SIZE } from '../emit/web.mjs';
import { sourceDir } from '../../extract/sources/lock.mjs';
import { buildGallerySite, GALLERY_DIR } from '../gallery/web/site.mjs';
import { MANIFEST, WEB_COMPONENTS } from '../../../plugin/skills/material3/scripts/install-assets/manifest.mjs';
import { BASELINE_SEED, renderTheme } from '../../../plugin/skills/material3/scripts/color/index.mjs';
import { verify } from '../../../plugin/skills/material3/scripts/verify/index.mjs';
import { screenshot } from '../../../plugin/skills/material3/scripts/screenshot/index.mjs';
import { withToolchain } from '../../../evals/tools/toolchain-env.mjs';

const root = fileURLToPath(new URL('../../../', import.meta.url));
const skill = join(root, 'plugin/skills/material3');
const compDir = join(skill, 'assets/web/components');
const files = readdirSync(compDir).filter(n => n.endsWith('.css')).sort();
const sheets = new Map(files.map(n => [n, readFileSync(join(compDir, n), 'utf8').replace(/\r\n/g, '\n')]));
const galleries = readdirSync(GALLERY_DIR).filter(n => n.endsWith('.html')).sort();
const tokensCss = readFileSync(join(skill, 'assets/web/tokens.css'), 'utf8');
const theme = renderTheme({ platform: 'web', seed: BASELINE_SEED });
const { comp } = buildSkillTokens();
const toolchain = process.env.M3_TOOLCHAIN_TESTS !== '1' && 'needs the local toolchain (M3_TOOLCHAIN_TESTS=1)';

const stripComments = s => s.replace(/\/\*[\s\S]*?\*\//g, '');
const declaredIn = css => new Set([...stripComments(css).matchAll(/(--[\w-]+)\s*:/g)].map(m => m[1]));
const usedIn = css => [...stripComments(css).matchAll(/var\((--[\w-]+)/g)].map(m => m[1]);

// Removes every var(...) (nested) from a value.
function stripVar(v) {
  for (;;) {
    const i = v.indexOf('var(');
    if (i < 0) return v;
    let depth = 0;
    let j = i + 3;
    for (; j < v.length; j++) {
      if (v[j] === '(') depth++;
      else if (v[j] === ')' && --depth === 0) break;
    }
    v = v.slice(0, i) + v.slice(j + 1);
  }
}

// [{ selector, prop, value }] of a style sheet without nested at-rules.
function declarations(css) {
  const out = [];
  for (const m of stripComments(css).matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    for (const d of m[2].split(';')) {
      const i = d.indexOf(':');
      if (i < 0 || !d.trim()) continue;
      out.push({ selector: m[1].trim(), prop: d.slice(0, i).trim(), value: d.slice(i + 1).trim() });
    }
  }
  return out;
}

// The only literal numbers besides 0, each with its reason.
//   z-index: -1: the container and state layer sit under the label inside the element's own
//   stacking context.
//   "/ 2" inside calc(): halving, to center one box in another (a container in its touch target, a
//   handle on its track, a ring around a dot, a label on an outline, an icon button's target over
//   its neighbours in a button group) or to draw a fully round corner next to a small one as half
//   the height (a very large radius would make CSS scale the small corners of the same box down to
//   nothing).
//   100%: the containing block's size, where a position depends on it: an anchored badge's start
//   (the anchor's end edge), a slider handle's travel and a progress track's length.
//   mask-size: 100% 100% in shapes.css: the element's own box (a shape stretches to the element like
//   Compose's RoundedPolygon.toShape()).
//   1turn: the whole circle, where an angle along a circular progress indicator depends on it.
//   @keyframes in progress.css: Compose's indeterminate timelines (offsets, 0 and 1 positions, the
//   circular sweep and rotation angles); the keyframes test below derives each from the Compose
//   constants.
const NUMBER_EXCEPTIONS = [{ prop: 'z-index', value: '-1' }, { prop: '--_full-turn', value: '1turn' }];
const HALVING = /\/\s*2(?![\d.])/g;
const PERCENT_PROPS = new Set(['inset-inline-start', '--_handle-offset', '--_length', 'mask-size']);
const KEYFRAME = /^(?:from|to|[\d.]+%)$/;

test('every component style sheet is its own web install part and starts with the asset marker', () => {
  assert.deepEqual(files, WEB_COMPONENTS.map(c => `${c}.css`).sort());
  for (const c of WEB_COMPONENTS) {
    assert.deepEqual(MANIFEST.web[c], [{ src: `web/components/${c}.css`, group: 'main' }], c);
    const text = sheets.get(`${c}.css`);
    assert.ok(text.startsWith(`/* material3 skill asset: assets/web/components/${c}.css\n`), c);
    assert.ok(!/m3-forge|holdout|reference-screenshots/i.test(text), c);
  }
});

test('every property value is a token variable or 0 (the listed structural exceptions aside)', () => {
  let n = 0;
  for (const [f, css] of sheets) {
    for (const d of declarations(css)) {
      n++;
      if (f === 'progress.css' && KEYFRAME.test(d.selector)) continue;
      let rest = stripVar(d.value).replace(/(["']).*?\1/g, '');
      if (/calc\(/.test(d.value)) rest = rest.replace(HALVING, '');
      if (PERCENT_PROPS.has(d.prop)) rest = rest.replace(/(?<![\w.])100%/g, '');
      const nums = (rest.match(/(?<![\w#-])-?\d*\.?\d+(?:[a-z%]+)?/gi) || []).filter(x => !/^-?0+(?:\.0+)?$/.test(x));
      if (!nums.length) continue;
      const ok = NUMBER_EXCEPTIONS.some(e => e.prop === d.prop && e.value === d.value);
      assert.ok(ok, `${f}: ${d.selector} { ${d.prop}: ${d.value} } has a literal ${nums.join(', ')}`);
    }
  }
  assert.ok(n > 400, `only ${n} declarations`);
});

const GRADIENT_WORDS = '|(?:radial|conic|linear)-gradient|circle|right|left|center|no-repeat|auto|calc|min|max|sin|cos|to';
test('colors come only from the --md-sys-color-* roles', () => {
  const COLOR = /(?:^|-)(?:color|background|border|outline|shadow|fill|stroke)$/;
  for (const [f, css] of sheets) {
    assert.ok(!/#[0-9a-f]{3,8}\b/i.test(stripComments(css)), `${f}: hex color`);
    for (const d of declarations(css)) {
      if (!COLOR.test(d.prop) || d.prop === 'transition-property') continue;
      for (const v of usedIn(`x{a:${d.value}}`)) {
        assert.ok(/^--md-sys-color-|^--m3-text-field-notch-color$|^--_|^--md-comp-[\w-]+-(?:opacity|width|thickness)$|^--md-sys-elevation-level\d-shadow$|^--md-sys-state-focus-indicator-thickness$|^--md-impl-[\w-]+-width$/.test(v),
          `${f}: ${d.prop} uses ${v}`);
      }
      // progress.css draws arcs, round ends and the stop indicator as gradients of private variables.
      const words = f === 'progress.css' ? GRADIENT_WORDS : '';
      const rest = stripVar(d.value).replace(HALVING, '').replace(new RegExp(`\\b(?:transparent|none|inherit|solid|from|r|g|b|rgb|0${words})\\b|[()/,\\s*+-]`, 'g'), '');
      assert.equal(rest, '', `${f}: ${d.prop}: ${d.value}`);
    }
  }
});

// Classic M3: every Expressive-only style sheet has a classic section scoped to the root attribute, and
// no classic rule reads an Expressive size or shape token (the Expressive set is what it replaces).
test('classic scoping: the Expressive-only styles have a classic section in their sheet', () => {
  const classic = ['button', 'button-group', 'icon-button', 'list', 'loading-indicator', 'menu', 'navigation-bar', 'navigation-rail', 'progress', 'shapes', 'slider', 'top-app-bar'];
  for (const c of classic) {
    const css = sheets.get(`${c}.css`);
    assert.match(css, /^:root\[data-m3-style="classic"\] /m,`${c}: no classic section`);
    const section = css.slice(css.indexOf(':root[data-m3-style="classic"]'));
    for (const d of declarations(section)) {
      for (const v of usedIn(`x{a:${d.value}}`)) {
        assert.ok(!/^--md-comp-(?:button|icon-button|slider)-(?:x?small|medium|x?large|xsmall)-|^--md-comp-app-bar-(?:medium|large)-flexible-|^--md-comp-list-.*expressive|^--md-comp-loading-indicator-/.test(v), `${c}: classic rule uses the Expressive token ${v}`);
      }
    }
  }
});

// Variables the page sets for a component (CSS cannot read them): the slider's position, 0 to 1.
const PAGE_INPUTS = ['--m3-slider-value', '--m3-text-field-notch-color', '--m3-progress-value'];

test('every --md-* variable used by the style sheets and galleries is declared in tokens.css or the color theme', () => {
  const declared = new Set([...declaredIn(tokensCss), ...declaredIn(theme)]);
  const own = new Set([...sheets.values()].flatMap(css => [...declaredIn(css)]));
  const pages = galleries.map(g => [g, readFileSync(join(GALLERY_DIR, g), 'utf8')]);
  for (const [f, text] of [...sheets, ...pages]) {
    for (const v of usedIn(text)) {
      if (v.startsWith('--_')) assert.ok(own.has(v), `${f}: private ${v} is declared in no component sheet`);
      else if (PAGE_INPUTS.includes(v)) continue;
      else assert.ok(declared.has(v), `${f}: ${v} is not declared in tokens.css or the color theme`);
    }
  }
});

test('class names are m3-<component> or m3-<component>--<variant>', () => {
  // m3-icon: the icon element inside a component (the class verify knows for Material Symbols).
  // Parts of a component that need their own class: m3-<component>-<part> (list item text, avatar).
  const COMPONENTS = [
    'icon', 'button', 'icon-button', 'fab', 'extended-fab', 'button-group', 'split-button', 'segmented-button-set', 'segmented-button',
    'card', 'list', 'list-item', 'list-item-text', 'list-item-overline', 'list-item-supporting-text', 'list-item-trailing-text',
    'list-item-avatar', 'chip-set', 'chip', 'text-field', 'checkbox', 'radio', 'switch', 'slider', 'divider', 'badge',
    'top-app-bar', 'top-app-bar-text', 'top-app-bar-title', 'top-app-bar-subtitle', 'top-app-bar-actions',
    'navigation-bar', 'navigation-bar-item', 'navigation-bar-label',
    'navigation-rail', 'navigation-rail-header', 'navigation-rail-item', 'navigation-rail-label',
    'navigation-drawer', 'navigation-drawer-headline', 'navigation-drawer-item', 'navigation-drawer-label', 'navigation-drawer-badge',
    'tabs', 'tab', 'tab-content', 'tab-label', 'dialog', 'dialog-headline', 'dialog-content', 'dialog-actions',
    'bottom-sheet', 'bottom-sheet-drag-handle', 'menu', 'menu-item', 'menu-item-text', 'menu-item-supporting-text',
    'menu-item-trailing-text', 'snackbar', 'snackbar-text', 'tooltip', 'tooltip-subhead', 'tooltip-text', 'tooltip-actions',
    'search', 'search-input', 'search-view', 'progress', 'loading-indicator', 'shape',
  ];
  const re = new RegExp(`^m3-(?:${COMPONENTS.join('|')})(?:--[a-z0-9]+(?:-[a-z0-9]+)*)?$`);
  for (const [f, css] of sheets) {
    // Quoted strings (shapes.css's inline SVG masks name www.w3.org) hold no selectors.
    const rules = stripComments(css).replace(/(["']).*?\1/g, '');
    for (const m of rules.matchAll(/\.(m3-[\w-]+)/g)) assert.match(m[1], re, f);
    for (const m of rules.matchAll(/\.(?!m3-)([a-z][\w-]*)/g)) assert.fail(`${f}: class .${m[1]} outside the m3- namespace`);
  }
});

test('tokens.css: the elevation shadows and the touch target are material-web\'s values', () => {
  // The per-level table in the comments of material-web elevation/internal/_elevation.scss:64-69 (key)
  // and :110-115 (ambient), [impl:] at the commit in knowledge/sources.lock.json; opacity 0.3 (:105)
  // and 0.15 (:174); the touch target from button/internal/_touch-target.scss:10.
  const KEY = [[0, 0, 0], [1, 2, 0], [1, 2, 0], [1, 3, 0], [2, 3, 0], [4, 4, 0]];
  const AMBIENT = [[0, 0, 0], [1, 3, 1], [2, 6, 2], [4, 8, 3], [6, 10, 4], [8, 12, 6]];
  for (let level = 0; level <= 5; level++) {
    const s = shadowOf(level);
    assert.deepEqual([s.key.y, s.key.blur, s.key.spread], KEY[level], `key ${level}`);
    assert.deepEqual([s.ambient.y, s.ambient.blur, s.ambient.spread], AMBIENT[level], `ambient ${level}`);
    const line = tokensCss.split('\n').find(l => l.includes(`--md-sys-elevation-level${level}-shadow:`));
    assert.ok(line && line.includes('[impl:material-web/elevation/internal/_elevation.scss'), `level ${level}`);
    const want = level === 0 ? 'none'
      : `0px ${KEY[level][0]}px ${KEY[level][1]}px ${KEY[level][2]}px rgb(from var(--md-sys-color-shadow) r g b / 0.3), `
        + `0px ${AMBIENT[level][0]}px ${AMBIENT[level][1]}px ${AMBIENT[level][2]}px rgb(from var(--md-sys-color-shadow) r g b / 0.15)`;
    assert.ok(line.includes(`: ${want};`), line);
  }
  assert.match(tokensCss, /^ {2}--md-target-size: 48px; \/\* \[impl:material-web\/button\/internal\/_touch-target\.scss:10\] \*\/$/m);
  assert.equal(TARGET_SIZE.px, 48);
});

test('tokens.css: the --md-impl-* values the style sheets use, each with its source line', () => {
  const used = new Set([...sheets.values()].flatMap(css => usedIn(css).filter(v => v.startsWith('--md-impl-'))));
  assert.deepEqual([...used].sort(), IMPL_VALUES.map(v => v.name).sort(), 'every [impl:] value is used, and only those');
  for (const v of IMPL_VALUES) {
    assert.ok(tokensCss.split(/\r?\n/).includes(`  ${v.name}: ${implCss(v)}; /* [impl:${v.impl}] */`), v.name);
  }
});

// The cited line of each [impl:] value holds that number (the pinned Compose sources in the toolchain).
test('[impl:] values: the cited Compose source line holds the value', { skip: toolchain }, () => {
  for (const v of IMPL_VALUES) {
    const [, lib, rel, line] = v.impl.match(/^(compose-material3|material-web)\/(.+):(\d+)$/);
    const text = readFileSync(join(sourceDir(lib), ...rel.split('/')), 'utf8').split('\n')[Number(line) - 1];
    const want = v.ms !== undefined ? `= ${v.ms}\\b` : `\\b${v.px}(?:\\.0)?(?:\\.dp|px)\\b`;
    assert.match(text, new RegExp(want), `${v.name}: ${v.impl}: ${text}`);
  }
});

// The "[impl:compose-material3/<file>:<line>] <number>" citations in the style sheets' comments: the
// cited line holds the number (as N.dp, Nf or a plain N).
test('[impl:] citations in the style sheets: the cited Compose source line holds the number', { skip: toolchain }, () => {
  let n = 0;
  for (const [f, css] of sheets) {
    for (const m of css.matchAll(/\[impl:compose-material3\/([^\]:]+):(\d+)\] (\d+(?:\.\d+)?)\b/g)) {
      n++;
      const text = readFileSync(join(sourceDir('compose-material3'), ...m[1].split('/')), 'utf8').split('\n')[Number(m[2]) - 1];
      assert.match(text, new RegExp(`(?<![\\w.])${m[3].replace('.', '\\.')}(?:\\.0)?(?:\\.dp|f)?\\b`), `${f}: ${m[0]}: ${text}`);
    }
  }
  assert.ok(n >= 25, `${n} citations`);
});

// progress.css keyframes: Compose's indeterminate timelines (ProgressIndicator.kt:928-1023 with the
// constants at :1049-1076; the durations are the [impl:] values in tokens.css).
test("progress.css: the indeterminate keyframes are Compose's timelines", () => {
  const css = stripComments(sheets.get('progress.css'));
  const frames = name => {
    const body = css.match(new RegExp(`@keyframes ${name} \\{([\\s\\S]*?)\\n\\}`))[1];
    return [...body.matchAll(/([\d.]+)% \{ [^:]+: ([^;]+);/g)].map(m => [Number(m[1]), m[2]]);
  };
  // LinearAnimationDuration 1750; [delay, duration] of FirstLineHead 0/1000, FirstLineTail 250/1000,
  // SecondLineHead 650/850, SecondLineTail 900/850 (:1049-1061).
  const LINEAR = 1750;
  assert.equal(IMPL_VALUES.find(v => v.name === '--md-impl-linear-progress-indeterminate-duration').ms, LINEAR);
  const pct = ms => Number((ms / LINEAR * 100).toFixed(3));
  const parts = { 'm3-progress-head-1': [0, 1000], 'm3-progress-tail-1': [250, 1000], 'm3-progress-head-2': [650, 850], 'm3-progress-tail-2': [900, 850] };
  for (const [name, [delay, dur]] of Object.entries(parts)) {
    const want = [[0, '0'], ...(delay ? [[pct(delay), '0']] : []), [pct(delay + dur), '1'], ...(delay + dur < LINEAR ? [[100, '1']] : [])];
    assert.deepEqual(frames(name), want, name);
  }
  // CircularAnimationProgressDuration 6000: sweep CircularIndeterminateMinProgress 0.1 -> MaxProgress
  // 0.87 at 3000 -> 0.1; global rotation 1080 degrees; a quarter turn (300 ms) every 1500 ms.
  const CIRCULAR = 6000;
  assert.equal(IMPL_VALUES.find(v => v.name === '--md-impl-circular-progress-indeterminate-duration').ms, CIRCULAR);
  assert.deepEqual(frames('m3-progress-sweep'), [[0, '0.1'], [50, '0.87'], [100, '0.1']]);
  assert.deepEqual(frames('m3-progress-rotation'), [[0, '0deg'], [100, '1080deg']]);
  const steps = [[0, 'rotate(0deg)']];
  for (let k = 0; k < 4; k++) {
    steps.push([Number((((k * 1500 + 300) / CIRCULAR) * 100).toFixed(3)), `rotate(${(k + 1) * 90}deg)`]);
    steps.push([k < 3 ? (((k + 1) * 1500) / CIRCULAR) * 100 : 100, `rotate(${(k + 1) * 90}deg)`]);
  }
  assert.deepEqual(frames('m3-progress-steps'), steps);
});

// Every component token the style sheets read, with its provenance; and the composite label-text
// tokens they name in comments (resolved to the type scale role by rung 2 of the ladder).
function ladder() {
  const used = new Map();
  for (const [f, css] of sheets) {
    for (const v of usedIn(css)) {
      if (!v.startsWith('--md-comp-')) continue;
      const m = tokensCss.match(new RegExp(`^ {2}${v}: .*/\\* (md\\.comp\\.[^ ]+) \\*/$`, 'm'));
      assert.ok(m, `${f}: ${v} not in tokens.css`);
      used.set(m[1], comp[m[1]].web[1]);
    }
    for (const m of css.matchAll(/\/\* (md\.comp\.[\w.-]+) \(derived: (md\.sys\.[\w.-]+)\) \*\//g)) used.set(m[1], `derived:${m[2]}`);
  }
  return used;
}

test('ladder: the component tokens used are the web\'s own, except the ones listed here', () => {
  const used = ladder();
  const notOwn = [...used].filter(([, p]) => p !== 'own').map(([k, p]) => `${k} ${p}`).sort();
  assert.deepEqual(notOwn, [
    // Top app bar, navigation bar and rail type roles: composite tokens resolved by rung 2.
    'md.comp.app-bar.large-flexible.subtitle.font derived:md.sys.typescale.title-medium',
    'md.comp.app-bar.large-flexible.title.font derived:md.sys.typescale.display-small',
    'md.comp.app-bar.medium-flexible.subtitle.font derived:md.sys.typescale.label-large',
    'md.comp.app-bar.medium-flexible.title.font derived:md.sys.typescale.headline-medium',
    'md.comp.app-bar.small.subtitle.font derived:md.sys.typescale.label-medium',
    'md.comp.app-bar.small.title.font derived:md.sys.typescale.title-large',
    'md.comp.button.large.label-text derived:md.sys.typescale.headline-small',
    'md.comp.button.medium.label-text derived:md.sys.typescale.title-medium',
    'md.comp.button.small.label-text derived:md.sys.typescale.label-large',
    'md.comp.button.xlarge.label-text derived:md.sys.typescale.headline-large',
    'md.comp.button.xsmall.label-text derived:md.sys.typescale.label-large',
    // The gap between chips in a chip set and an input chip's start space before an avatar: Flutter's
    // material_ui chips tokens (material-web has no token; rung 1).
    'md.comp.chips.gap.horizontal cross-source:material_ui',
    'md.comp.chips.with-avatar.padding.leading cross-source:material_ui',
    'md.comp.extended-fab.large.label-text derived:md.sys.typescale.headline-small',
    'md.comp.extended-fab.medium.label-text derived:md.sys.typescale.title-large',
    'md.comp.extended-fab.small.label-text derived:md.sys.typescale.title-medium',
    'md.comp.nav-bar.item.vertical.label-text.font derived:md.sys.typescale.label-medium',
    'md.comp.nav-rail.item.horizontal.label-text.font derived:md.sys.typescale.label-large',
    'md.comp.nav-rail.item.vertical.label-text.font derived:md.sys.typescale.label-medium',
  ]);
  // Each rung-2 comment matches the provenance in tokens/comp.json.
  for (const [k, p] of used) if (p.startsWith('derived:')) assert.equal(comp[k].web[1], p, k);
  assert.ok(used.size > 300, `${used.size} component tokens`);
});

// A gallery site (index.html + installed assets + baseline theme) in a folder whose path has spaces.
async function withSite(name, fn) {
  const dir = mkdtempSync(join(tmpdir(), 'm3 gallery '));
  try {
    buildGallerySite(name, dir);
    return await fn(dir);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

for (const g of galleries) {
  const name = g.replace(/\.html$/, '');

  test(`verify: the ${name} gallery and the component style sheets have no scored finding`, async () => {
    await withSite(name, async dir => {
      const r = await verify({ projectDir: dir, platform: 'web' });
      const scored = Object.entries(r.counts).filter(([, n]) => n);
      assert.deepEqual(scored, [], JSON.stringify(r.violations.filter(v => r.counts[v.check] !== undefined).slice(0, 10), null, 1));
      for (const c of ['hardcoded-color', 'off-token-type', 'off-token-radius', 'shadow-gradient']) assert.equal(r.counts[c], 0, c);
      for (const c of ['asset-unused', 'icon-button-label', 'unknown-icon', 'placeholder-content']) assert.equal(r.unscored[c], 0, c);
      assert.ok(r.uiLines > 500, `${r.uiLines} UI lines scanned`);
    });
  });

  // Screenshots and capture.json stay in out/gallery/web/<name>/ (gitignored) for reading.
  const outDir = join(root, 'out', 'gallery', 'web', name);
  const siteDir = join(outDir, 'site');

  test(`harness capture: the ${name} gallery has no touch-target or contrast finding`, { skip: toolchain, timeout: 600_000 }, () => {
    buildGallerySite(name, siteDir);
    const shots = join(outDir, 'capture');
    const r = spawnSync(process.execPath, [join(root, 'harness/web/capture.mjs'), siteDir, 'web-empty', shots], { encoding: 'utf8' });
    assert.equal(r.status, 0, r.stdout + r.stderr);
    const cap = JSON.parse(readFileSync(join(shots, 'capture.json'), 'utf8'));
    assert.equal(cap.buildOk, true, cap.reason);
    assert.deepEqual(cap.shots.map(s => s.file).sort(), ['dark-1440x900.png', 'dark-412x915.png', 'light-1440x900.png', 'light-412x915.png']);
    assert.deepEqual(cap.runtime.targets, []);
    assert.deepEqual(cap.runtime.contrast, []);
    assert.deepEqual(cap.raw.pageErrors, {});
  });

  // The skill's own screenshot step measures the gallery the same way a model's page is measured.
  test(`screenshot step: the ${name} gallery has no contrast or touch-target finding`, { skip: toolchain, timeout: 600_000 }, async () => {
    if (!existsSync(join(siteDir, 'index.html'))) buildGallerySite(name, siteDir);
    process.env.PLAYWRIGHT_BROWSERS_PATH = withToolchain(process.env).PLAYWRIGHT_BROWSERS_PATH;
    const r = await screenshot({ projectDir: siteDir, platform: 'web', out: join(outDir, 'screenshot'), roots: [join(root, 'node_modules')] });
    assert.equal(r.ran, true, r.skippedReason);
    assert.equal(r.shots.length, 4);
    assert.deepEqual(r.runtime.contrast, []);
    assert.deepEqual(r.runtime.targets, []);
    assert.deepEqual(r.pageErrors, {});
    assert.deepEqual(r.warnings, []);
    for (const m of Object.values(r.measured)) assert.ok(m.checked > MIN_CHECKED[name], `${m.checked} texts measured`);
  });

  test(`computed: the ${name} gallery's labels, state layers, focus ring and geometry`, { skip: toolchain, timeout: 600_000 }, async () => {
    if (!existsSync(join(siteDir, 'index.html'))) buildGallerySite(name, siteDir);
    process.env.PLAYWRIGHT_BROWSERS_PATH = withToolchain(process.env).PLAYWRIGHT_BROWSERS_PATH;
    const { chromium } = await import('playwright');
    const server = await serve(siteDir);
    const browser = await chromium.launch();
    try {
      for (const scheme of ['light', 'dark']) {
        const page = await browser.newPage({ viewport: { width: 412, height: 915 }, colorScheme: scheme, reducedMotion: 'reduce' });
        await page.goto(server.origin + '/');
        await page.evaluate(() => document.fonts.ready.then(() => undefined));
        await page.addStyleTag({ content: '*, *::before, *::after { transition: none !important; }' });
        const report = await page.evaluate(inPage);
        assert.deepEqual(report.lowContrast, [], `${scheme}: labels below the minimum contrast`);
        assert.deepEqual(report.badGeometry, [], `${scheme}: container or target size`);
        assert.ok(report.checked > MIN_CHECKED[name], `${scheme}: ${report.checked} elements checked`);
        assert.ok(report.scrollWidth <= 412, `${scheme}: page scrolls sideways (${report.scrollWidth}px)`);

        await STATE_CHECKS[name](page, { scheme, outDir });
        await page.close();
      }
    } finally {
      await browser.close();
      await server.close();
    }
  });
}

// Elements the computed check measures on each gallery, at least.
const MIN_CHECKED = { actions: 100, classic: 10, containment: 10, navigation: 40 };

// Helpers on a page: a root variable, a pseudo-element's computed property, the alpha of a color,
// the computed value of a box-shadow or color variable (from a probe element).
const rootVar = (page, n) => page.evaluate(v => getComputedStyle(document.documentElement).getPropertyValue(v).trim(), n);
const pseudoOf = (loc, which, prop) => loc.evaluate((el, [w, p]) => getComputedStyle(el, w).getPropertyValue(p), [which, prop]);
const alphaOf = c => {
  const slash = c.match(/\/\s*([\d.]+)\s*\)$/); // rgb(r g b / a), color(srgb r g b / a)
  if (slash) return Number(slash[1]);
  const m = c.match(/rgba?\(([^)]+)\)/);
  if (!m) return null;
  const parts = m[1].split(/[\s,]+/).filter(Boolean).map(Number);
  return parts.length > 3 ? parts[3] : 1;
};
const probe = (page, prop, v) => page.evaluate(([p, x]) => {
  const d = document.createElement('div');
  d.style.setProperty(p, `var(${x})`);
  document.body.append(d);
  const s = getComputedStyle(d).getPropertyValue(p);
  d.remove();
  return s;
}, [prop, v]);
const near = (a, b, what) => assert.ok(Math.abs(a - b) <= 0.5, `${what}: ${a} vs ${b}`);

// State and geometry checks per gallery (light and dark), with crops of the states for reading.
const STATE_CHECKS = {
  async actions(page, { scheme, outDir }) {
    // Hover, keyboard focus and press on a filled button (state layer, focus ring, pressed shape).
    const btn = page.locator('.m3-button--filled:not([aria-pressed]):not(:disabled)').first();
    await btn.hover();
    assert.equal(await pseudoOf(btn, '::after', 'opacity'), await rootVar(page, '--md-sys-state-hover-state-layer-opacity'));
    await page.screenshot({ path: join(outDir, `state-hover-${scheme}.png`), clip: await clipOf(btn) });
    await page.mouse.down();
    assert.equal(await pseudoOf(btn, '::after', 'opacity'), await rootVar(page, '--md-sys-state-pressed-state-layer-opacity'));
    assert.equal(await pseudoOf(btn, '::before', 'border-top-left-radius'), await rootVar(page, '--md-sys-shape-corner-small'));
    assert.equal(await pseudoOf(btn, '::before', 'box-shadow'), 'none');
    await page.screenshot({ path: join(outDir, `state-pressed-${scheme}.png`), clip: await clipOf(btn) });
    await page.mouse.up();
    await page.mouse.move(0, 0);
    await btn.evaluate(el => el.blur());

    await page.mouse.move(0, 0);

    // A text button ignores aria-pressed (no toggle tokens): it looks like the plain text button.
    const same = await page.evaluate(() => {
      const plain = document.querySelector('.m3-button--text:not(:disabled)');
      const look = el => [getComputedStyle(el).color, getComputedStyle(el, '::before').backgroundColor, getComputedStyle(el, '::before').borderTopLeftRadius];
      const out = [];
      for (const v of ['true', 'false']) {
        const b = plain.cloneNode(true);
        b.setAttribute('aria-pressed', v);
        plain.after(b);
        out.push([look(plain), look(b)]);
        b.remove();
      }
      return out;
    });
    for (const [a, b] of same) assert.deepEqual(b, a, 'text button with aria-pressed');

    // Icon buttons in button groups: the visible gap between containers is the group's token gap
    // (the 48 px targets overlap instead of adding to it).
    const gaps = await page.evaluate(() => {
      const out = [];
      const box = el => {
        const r = el.getBoundingClientRect();
        const w = parseFloat(getComputedStyle(el, '::before').width);
        return { start: r.left + (r.width - w) / 2, end: r.left + (r.width + w) / 2 };
      };
      for (const group of document.querySelectorAll('.m3-button-group')) {
        const kids = [...group.children].filter(k => k.matches('.m3-icon-button'));
        const want = parseFloat(getComputedStyle(group).columnGap);
        for (let i = 1; i < kids.length; i++) out.push({ group: group.getAttribute('aria-label'), gap: box(kids[i]).start - box(kids[i - 1]).end, want });
      }
      return out;
    });
    assert.ok(gaps.length >= 10, `${gaps.length} icon button pairs in groups`);
    for (const g of gaps) near(g.gap, g.want, `gap in "${g.group}"`);
    const xs = page.locator('.m3-button-group--xsmall:not(.m3-button-group--connected)').first();
    await page.screenshot({ path: join(outDir, `group-xsmall-${scheme}.png`), clip: await clipOf(xs) });

    // Keyboard focus: the focus ring on the container and the focus state layer.
    await page.keyboard.press('Tab');
    const focused = page.locator(':focus-visible');
    assert.equal(await focused.evaluate(el => getComputedStyle(el, '::before').outlineStyle), 'solid');
    assert.equal(await focused.evaluate(el => getComputedStyle(el, '::before').outlineWidth), await rootVar(page, '--md-sys-state-focus-indicator-thickness'));
    assert.equal(await focused.evaluate(el => getComputedStyle(el, '::after').opacity), await rootVar(page, '--md-sys-state-focus-state-layer-opacity'));
    await page.screenshot({ path: join(outDir, `state-focus-${scheme}.png`), clip: await clipOf(focused) });
  },

  async navigation(page, { scheme, outDir }) {
    const hover = Number(await rootVar(page, '--md-sys-state-hover-state-layer-opacity'));
    const thickness = await rootVar(page, '--md-sys-state-focus-indicator-thickness');
    const len = async n => parseFloat(await rootVar(page, n));
    const shot = async (name, loc) => page.screenshot({ path: join(outDir, `${name}-${scheme}.png`), clip: await clipOf(loc) });

    // Top app bars: the token heights (small; medium and large flexible, with and without subtitle).
    const bars = await page.$$eval('.m3-top-app-bar', els => els.map(el => [el.className, el.getBoundingClientRect().height, !!el.querySelector('.m3-top-app-bar-subtitle')]));
    for (const [cls, h, sub] of bars) {
      const size = /medium-flexible/.test(cls) ? 'medium-flexible' : /large-flexible/.test(cls) ? 'large-flexible' : 'small';
      const token = size === 'small' ? '--md-comp-app-bar-small-container-height'
        : `--md-comp-app-bar-${size}-${sub ? 'with-subtitle-' : ''}container-height`;
      near(h, await len(token), `${cls} height`);
    }
    assert.equal(await page.locator('.m3-top-app-bar[data-scrolled]').evaluate(el => getComputedStyle(el).backgroundColor), await probe(page, 'color', '--md-sys-color-surface-container'));

    // Navigation bar: the token height; the active indicator (56 x 32) behind the active icon; the
    // hover state layer on an inactive item; the keyboard focus ring on the indicator.
    const bar = page.locator('.m3-navigation-bar');
    near((await bar.boundingBox()).height, await len('--md-comp-nav-bar-container-height'), 'navigation bar height');
    const active = bar.locator('[aria-current="page"]');
    assert.equal(await pseudoOf(active, '::before', 'background-color'), await probe(page, 'color', '--md-sys-color-secondary-container'));
    near(parseFloat(await pseudoOf(active, '::before', 'width')), await len('--md-comp-nav-bar-item-vertical-active-indicator-width'), 'nav bar indicator width');
    near(parseFloat(await pseudoOf(active, '::before', 'height')), await len('--md-comp-nav-bar-item-vertical-active-indicator-height'), 'nav bar indicator height');
    const inactive = bar.locator('.m3-navigation-bar-item:not([aria-current])').first();
    assert.equal(alphaOf(await pseudoOf(inactive, '::before', 'background-color')), 0);
    await inactive.hover();
    assert.equal(alphaOf(await pseudoOf(inactive, '::after', 'background-color')), hover);
    await shot('state-hover-nav-bar', bar);
    await page.mouse.move(0, 0);
    await page.locator('button[aria-label="Sort"]').focus();
    await page.keyboard.press('Tab');
    const focusedItem = page.locator(':focus-visible');
    assert.equal(await focusedItem.evaluate(el => el.matches('.m3-navigation-bar-item')), true);
    assert.equal(await pseudoOf(focusedItem, '::before', 'outline-width'), thickness);
    await shot('state-focus-nav-bar', bar);
    await focusedItem.evaluate(el => el.blur());

    // Navigation rail: collapsed width; the expanded active indicator covers the whole item.
    near((await page.locator('nav.m3-navigation-rail:not(.m3-navigation-rail--expanded)').boundingBox()).width, await len('--md-comp-nav-rail-collapsed-container-width'), 'collapsed rail width');
    const wide = page.locator('nav.m3-navigation-rail--expanded [aria-current="page"]');
    const wb = await wide.boundingBox();
    near(parseFloat(await pseudoOf(wide, '::before', 'width')), wb.width, 'expanded indicator width');
    near(wb.height, await len('--md-comp-nav-rail-item-horizontal-active-indicator-height'), 'expanded item height');
    // Modal overlays shown in place are hidden without [open].
    for (const sel of ['.m3-navigation-rail--modal', '.m3-navigation-drawer--modal']) {
      const hidden = await page.locator(sel).evaluate(el => { el.removeAttribute('open'); const d = getComputedStyle(el).display; el.setAttribute('open', ''); return d; });
      assert.equal(hidden, 'none', `${sel} without [open]`);
    }
    // The modal drawer's start edge is the stage's start edge and its height the stage's.
    const db = await page.locator('.m3-navigation-drawer--modal').boundingBox();
    const sb = await page.locator('#drawer-stage').boundingBox();
    near(db.x, sb.x, 'modal drawer start');
    near(db.height, sb.height, 'modal drawer height');
    near(db.width, await len('--md-comp-navigation-drawer-container-width'), 'modal drawer width');

    // Tabs: the primary indicator is as wide as the content and sits on the tab's bottom edge; the
    // secondary one is as wide as the tab; a primary tab with icon and label is the taller one.
    const ind = async tab => tab.evaluate(el => {
      const c = el.querySelector('.m3-tab-content');
      const a = getComputedStyle(c, '::after');
      return { w: parseFloat(a.width), h: parseFloat(a.height), cw: c.getBoundingClientRect().width, cb: c.getBoundingClientRect().bottom, tb: el.getBoundingClientRect().bottom, tw: el.getBoundingClientRect().width, th: el.getBoundingClientRect().height };
    });
    const p1 = await ind(page.locator('.m3-tabs:not(.m3-tabs--secondary) [aria-selected="true"]').first());
    near(p1.w, p1.cw, 'primary indicator width');
    near(p1.h, await len('--md-comp-primary-navigation-tab-active-indicator-height'), 'primary indicator height');
    near(p1.cb, p1.tb, 'primary indicator at the bottom');
    near(p1.th, await len('--md-comp-primary-navigation-tab-container-height'), 'primary tab height');
    const p2 = await ind(page.locator('.m3-tabs:not(.m3-tabs--secondary) [aria-selected="true"]').nth(1));
    near(p2.th, await len('--md-comp-primary-navigation-tab-with-icon-and-label-text-container-height'), 'icon and label tab height');
    for (const i of [0, 1]) {
      const s2 = await ind(page.locator('.m3-tabs--secondary [aria-selected="true"]').nth(i));
      near(s2.w, s2.tw, 'secondary indicator width');
      near(s2.h, await len('--md-comp-secondary-navigation-tab-active-indicator-height'), 'secondary indicator height');
      near(s2.th, await len('--md-comp-secondary-navigation-tab-container-height'), 'secondary tab height');
    }

    // Modal dialog: hidden until showModal(); then centered over the scrim with the level 3 shadow;
    // Escape closes it.
    const dlg = page.locator('#modal-dialog');
    assert.equal(await dlg.evaluate(el => getComputedStyle(el).display), 'none');
    await dlg.evaluate(el => el.showModal());
    const d = await dlg.evaluate(el => {
      const r = el.getBoundingClientRect();
      return { left: r.left, right: innerWidth - r.right, top: r.top, bottom: innerHeight - r.bottom, w: r.width, backdrop: getComputedStyle(el, '::backdrop').backgroundColor, shadow: getComputedStyle(el).boxShadow };
    });
    near(d.left, d.right, 'dialog centered horizontally');
    near(d.top, d.bottom, 'dialog centered vertically');
    assert.ok(d.w >= (await len('--md-impl-dialog-min-width')) - 0.5 && d.w <= (await len('--md-impl-dialog-max-width')) + 0.5, `dialog width ${d.w}`);
    assert.equal(alphaOf(d.backdrop), Number(await rootVar(page, '--md-comp-scrim-container-opacity')));
    assert.equal(d.shadow, await probe(page, 'box-shadow', '--md-sys-elevation-level3-shadow'));
    await page.screenshot({ path: join(outDir, `modal-dialog-${scheme}.png`) });
    await page.keyboard.press('Escape');
    assert.equal(await dlg.evaluate(el => getComputedStyle(el).display), 'none');

    // A long dialog keeps the window margin at its sides (space-700) and stays inside the window.
    const long = await dlg.evaluate(el => {
      const c = el.querySelector('.m3-dialog-content');
      const text = c.textContent;
      c.textContent = `${text} `.repeat(60);
      el.showModal();
      const r = el.getBoundingClientRect();
      const out = { left: r.left, right: innerWidth - r.right, top: r.top, bottom: innerHeight - r.bottom };
      el.close();
      c.textContent = text;
      return out;
    });
    const margin = await len('--md-sys-space-700');
    assert.ok(long.left >= margin - 0.5 && long.right >= margin - 0.5, `long dialog side margins ${long.left} / ${long.right}`);
    assert.ok(long.top > 0 && long.bottom > 0, `long dialog inside the window (${long.top} / ${long.bottom})`);

    // Modal bottom sheet: on the bottom edge, centered, at most the maximum width.
    const sheet = page.locator('#modal-sheet');
    await sheet.evaluate(el => el.showModal());
    const sh = await sheet.evaluate(el => { const r = el.getBoundingClientRect(); return { left: r.left, right: innerWidth - r.right, bottom: innerHeight - r.bottom, w: r.width }; });
    near(sh.bottom, 0, 'sheet on the bottom edge');
    near(sh.left, sh.right, 'sheet centered');
    assert.ok(sh.w <= (await len('--md-impl-bottom-sheet-max-width')) + 0.5, `sheet width ${sh.w}`);
    const handle = await sheet.locator('.m3-bottom-sheet-drag-handle').boundingBox();
    assert.ok(handle.width >= 48 && handle.height >= 48, `drag handle ${handle.width}x${handle.height}`);
    await page.screenshot({ path: join(outDir, `modal-sheet-${scheme}.png`) });
    await sheet.evaluate(el => el.close());

    // Menu: hidden without data-open; the drawn items (44) touch while each target is at least 48.
    const closed = page.locator('#closed-menu');
    assert.equal(await closed.evaluate(el => getComputedStyle(el).display), 'none');
    assert.equal(await closed.evaluate(el => { el.dataset.open = ''; const v = getComputedStyle(el).display; delete el.dataset.open; return v; }), 'flex');
    const runs = await page.$$eval('.m3-menu[data-open]', menus => menus.map(m => {
      const out = [];
      let prev = null;
      for (const el of m.children) {
        if (!el.matches('.m3-menu-item')) { prev = null; continue; }
        const r = el.getBoundingClientRect();
        const h = parseFloat(getComputedStyle(el, '::before').height);
        const top = r.top + (r.height - h) / 2;
        if (prev) out.push({ gap: top - prev, target: r.height, h });
        prev = top + h;
      }
      return out;
    }).flat());
    assert.ok(runs.length >= 5, `${runs.length} adjacent menu items`);
    for (const r of runs) {
      near(r.gap, 0, 'drawn menu items touch');
      near(r.h, await len('--md-comp-menus-menu-item-height'), 'menu item height');
      assert.ok(r.target >= 48, `menu item target ${r.target}`);
    }
    const item = page.locator('.m3-menu-item[role="menuitem"]:not(:disabled)').first();
    await item.hover();
    assert.equal(alphaOf(await pseudoOf(item, '::after', 'background-color')), hover);
    await shot('state-hover-menu', page.locator('.m3-menu').first());
    await page.mouse.move(0, 0);

    // Snackbar and tooltip: hidden without data-open.
    for (const sel of ['#closed-snackbar', '#closed-tooltip']) {
      assert.equal(await page.locator(sel).evaluate(el => getComputedStyle(el).display), 'none', sel);
    }

    // Search bar: the token height; focus on the input draws the focus ring on the bar.
    const search = page.locator('#search-bar');
    near((await search.locator('xpath=..').boundingBox()).height, await len('--md-comp-search-bar-container-height'), 'search bar height');
    await search.focus();
    assert.equal(await search.locator('xpath=..').evaluate(el => getComputedStyle(el).outlineWidth), thickness);
    await shot('state-focus-search', search.locator('xpath=..'));
    await search.blur();

    // Linear progress: the active end is the progress plus a round end, the track starts the
    // track-active space after it; 0 draws no active indicator, 1 no track.
    const gap = await len('--md-comp-progress-indicator-linear-track-active-indicator-space');
    const t = await len('--md-comp-progress-indicator-linear-active-indicator-thickness');
    const lin = id => page.locator(id).evaluate(el => {
      const w = el.getBoundingClientRect().width;
      const a = getComputedStyle(el, '::before');
      const k = getComputedStyle(el, '::after');
      return { w, active: parseFloat(a.width), trackStart: parseFloat(k.left), trackW: parseFloat(k.width) };
    });
    const l40 = await lin('#p-40');
    near(l40.active, 0.4 * l40.w + t / 2, 'active end at 40 %');
    near(l40.trackStart - l40.active, gap, 'gap between active and track');
    const l0 = await lin('#p-0');
    near(l0.active, 0, 'no active indicator at 0');
    near(l0.trackStart, 0, 'track from the start at 0');
    const l100 = await lin('#p-100');
    near(l100.active, l100.w, 'active to the end at 1');
    near(l100.trackW, 0, 'no track at 1');
    // Indeterminate: Compose's timelines run (4 linear parts, sweep and 2 rotations); at 1000 ms the
    // first line's head is at the end.
    const anims = await page.evaluate(() => ['#p-linear-indeterminate', '#c-indeterminate'].map(s => document.querySelector(s).getAnimations().length));
    assert.deepEqual(anims, [4, 3]);
    const headEnd = await page.locator('#p-linear-indeterminate').evaluate(el => {
      el.getAnimations().forEach(a => { a.pause(); a.currentTime = 1000; });
      return parseFloat(getComputedStyle(el, '::before').right);
    });
    near(headEnd, 0, 'first line head at the end at 1000 ms');
    await shot('progress', page.locator('.gallery-progress'));
  },

  // Classic M3 (data-m3-style="classic" on the root): the Expressive-only styles draw the classic visuals.
  async classic(page, { scheme, outDir }) {
    const px = async (loc, prop, pseudo = null) => parseFloat(await loc.evaluate((el, [p, w]) => getComputedStyle(el, w).getPropertyValue(p), [prop, pseudo]));
    const impl = async name => parseFloat(await rootVar(page, name));
    // Slider: the classic 4 px track and 20 px round handle, whatever the size class says.
    for (const slider of await page.locator('.m3-slider:not(:has(> input:disabled))').all()) {
      near(await px(slider, 'height', '::before'), await impl('--md-impl-classic-slider-track-height'), 'slider track');
      const dim = n => slider.evaluate((el, v) => parseFloat(getComputedStyle(el).getPropertyValue(v)), n);
      near(await dim('--_handle-width'), await impl('--md-impl-classic-slider-handle-size'), 'slider handle width');
      near(await dim('--_handle-height'), await impl('--md-impl-classic-slider-handle-size'), 'slider handle height');
      near(await dim('--_handle-visible-width'), await impl('--md-impl-classic-slider-handle-size'), 'handle does not narrow');
    }
    // Buttons and icon buttons: 40 px, fully round, in every size and shape class; no press morph.
    for (const b of await page.locator('.m3-button:not(:disabled)').all()) {
      near(await px(b, 'height', '::before'), await impl('--md-impl-classic-button-height'), 'button height');
      assert.ok(await px(b, 'border-top-left-radius', '::before') >= (await impl('--md-impl-classic-button-height')) / 2, 'button is round');
    }
    for (const b of await page.locator('.m3-icon-button').all()) {
      near(await px(b, 'width', '::before'), await impl('--md-impl-classic-icon-button-size'), 'icon button width');
      near(await px(b, 'height', '::before'), await impl('--md-impl-classic-icon-button-size'), 'icon button height');
    }
    const filled = page.locator('.m3-button--filled:not(:disabled)').first();
    await filled.hover();
    await page.mouse.down();
    assert.ok(await px(filled, 'border-top-left-radius', '::before') >= (await impl('--md-impl-classic-button-height')) / 2, 'no pressed shape morph');
    await page.mouse.up();
    await page.mouse.move(0, 0);
    // Connected group: separate round buttons.
    for (const b of await page.locator('.m3-button-group--connected > .m3-button').all()) {
      assert.ok(await px(b, 'border-top-left-radius', '::before') >= (await impl('--md-impl-classic-button-height')) / 2, 'connected group button is round');
    }
    // Segmented list: no gap, square items. Wavy progress: the flat height. Navigation bar 80, app bars 112 and 152.
    assert.equal(await page.locator('.m3-list--segmented').evaluate(el => getComputedStyle(el).rowGap), '0px');
    near(await px(page.locator('.m3-progress--wavy:not(.m3-progress--circular)').first(), 'height'), parseFloat(await rootVar(page, '--md-comp-progress-indicator-linear-active-indicator-thickness')), 'flat progress');
    near(await px(page.locator('.m3-navigation-bar'), 'height'), parseFloat(await rootVar(page, '--md-comp-navigation-bar-container-height')), 'navigation bar');
    near(await px(page.locator('.m3-top-app-bar--medium-flexible'), 'height'), parseFloat(await rootVar(page, '--md-comp-app-bar-medium-container-height')), 'medium app bar');
    near(await px(page.locator('.m3-top-app-bar--large-flexible'), 'height'), parseFloat(await rootVar(page, '--md-comp-app-bar-large-container-height')), 'large app bar');
    assert.equal(await page.locator('.m3-top-app-bar-subtitle').first().evaluate(el => getComputedStyle(el).display), 'none');
    // The vibrant menu is the standard one.
    assert.equal(await page.locator('.m3-menu--vibrant').evaluate(el => getComputedStyle(el).backgroundColor), await probe(page, 'background-color', '--md-sys-color-surface-container'));
    await page.screenshot({ path: join(outDir, `classic-${scheme}.png`), fullPage: true });
  },

  async containment(page, { scheme, outDir }) {
    const hover = Number(await rootVar(page, '--md-sys-state-hover-state-layer-opacity'));
    const thickness = await rootVar(page, '--md-sys-state-focus-indicator-thickness');
    const space = async step => parseFloat(await rootVar(page, `--md-sys-space-${step}`));

    // Interactive elevated card: level1 at rest, level2 and the state layer on hover.
    const card = page.locator('a.m3-card--elevated').first();
    assert.equal(await card.evaluate(el => getComputedStyle(el).boxShadow), await probe(page, 'box-shadow', '--md-sys-elevation-level1-shadow'));
    await card.hover();
    assert.equal(await card.evaluate(el => getComputedStyle(el).boxShadow), await probe(page, 'box-shadow', '--md-sys-elevation-level2-shadow'));
    assert.equal(alphaOf(await pseudoOf(card, '::after', 'background-color')), hover);
    await page.screenshot({ path: join(outDir, `state-hover-card-${scheme}.png`), clip: await clipOf(card) });

    // Filter chip: hover state layer.
    const chip = page.locator('.m3-chip--filter[aria-pressed="false"]').first();
    await chip.hover();
    assert.equal(alphaOf(await pseudoOf(chip, '::after', 'background-color')), hover);
    await page.screenshot({ path: join(outDir, `state-hover-chip-${scheme}.png`), clip: await clipOf(page.locator('.m3-chip-set').nth(1)) });
    await page.mouse.move(0, 0);

    // Input chip remove button: a full touch target around an icon-sized slot.
    const rb = await page.locator('.m3-chip--input > button').first().boundingBox();
    assert.ok(rb.width >= 48 && rb.height >= 48, `remove button ${rb.width}x${rb.height}`);

    // Checkbox: the checked box shows the check glyph on the primary color; indeterminate a dash.
    const checked = page.locator('.m3-checkbox:checked:not(:disabled):not([aria-invalid])').first();
    assert.equal(await pseudoOf(checked, '::after', 'content'), '"check" / ""');
    assert.equal(await pseudoOf(checked, '::after', 'background-color'), await probe(page, 'color', '--md-sys-color-primary'));
    assert.equal(await pseudoOf(page.locator('#indeterminate'), '::after', 'content'), '"remove" / ""');

    // Switch: the handle is centered half the track height in from the start (off) or end (on).
    for (const [sel, on] of [['.m3-switch:not(:checked):not(:disabled):not(.m3-switch--icons)', false], ['.m3-switch:checked:not(:disabled):not(.m3-switch--icons)', true]]) {
      const g = await page.locator(sel).last().evaluate(el => {
        const a = getComputedStyle(el, '::after');
        return { left: parseFloat(a.left), w: parseFloat(a.width), trackW: el.getBoundingClientRect().width, trackH: parseFloat(getComputedStyle(el, '::before').height) };
      });
      near(g.left + g.w / 2, on ? g.trackW - g.trackH / 2 : g.trackH / 2, `switch ${on ? 'on' : 'off'} handle center`);
    }
    await page.screenshot({ path: join(outDir, `selection-${scheme}.png`), clip: await clipOf(page.locator('section[aria-labelledby="selection"]')) });

    // Slider: the active track ends a gap before the handle and the inactive one starts a gap after.
    const sg = await page.locator('.m3-slider').first().evaluate(el => {
      const cs = getComputedStyle(el);
      return {
        v: parseFloat(cs.getPropertyValue('--m3-slider-value')),
        hw: parseFloat(cs.getPropertyValue('--_handle-width')),
        gap: parseFloat(cs.getPropertyValue('--_gap')),
        w: el.getBoundingClientRect().width,
        active: parseFloat(getComputedStyle(el, '::before').width),
        start: parseFloat(getComputedStyle(el, '::after').left),
      };
    });
    near(sg.active, sg.v * (sg.w - sg.hw) - sg.gap, 'slider active track');
    near(sg.start, sg.v * (sg.w - sg.hw) + sg.hw + sg.gap, 'slider inactive track start');
    await page.screenshot({ path: join(outDir, `sliders-${scheme}.png`), clip: await clipOf(page.locator('section[aria-labelledby="sliders"]')) });

    // Text fields: focus floats the label and thickens the indicator (filled) or outline (outlined).
    for (const [id, outlined] of [['#f-name', false], ['#o-name', true]]) {
      const input = page.locator(id);
      const label = page.locator(`${id} ~ label`);
      near(await label.evaluate(el => parseFloat(getComputedStyle(el).top)), await space(200), `${id} resting label`);
      await input.focus();
      const floating = await label.evaluate(el => parseFloat(getComputedStyle(el).top));
      const lineHeight = await label.evaluate(el => parseFloat(getComputedStyle(el).lineHeight)); // the populated (body small) line height
      near(floating, outlined ? -lineHeight / 2 : await space(100), `${id} floating label`);
      const container = input.locator('xpath=..');
      assert.equal(await pseudoOf(container, '::before', outlined ? 'border-top-width' : 'border-bottom-width'), thickness, `${id} focus indicator`);
      const ib = await input.boundingBox();
      assert.ok(ib.height >= 48, `${id} input height ${ib.height}`);
      await page.screenshot({ path: join(outDir, `state-focus-${id.slice(1)}-${scheme}.png`), clip: await clipOf(container) });
      await input.blur();
    }

    // The outlined field's notch on a surface-container panel paints the panel's color, not a patch.
    const notch = await page.locator('#o-panel ~ label').evaluate(el => ({
      bg: getComputedStyle(el).backgroundColor,
      panel: getComputedStyle(el.closest('.gallery-panel')).backgroundColor,
    }));
    assert.equal(notch.bg, notch.panel, 'notch matches the panel it sits on');
    await page.screenshot({ path: join(outDir, `notch-panel-${scheme}.png`), clip: await clipOf(page.locator('.gallery-panel')) });

    // Keyboard focus on the interactive elevated card (Shift+Tab from the card after it): the ring.
    await page.locator('button.m3-card').focus();
    await page.keyboard.press('Shift+Tab');
    const focused = page.locator(':focus-visible');
    assert.equal(await focused.evaluate(el => el.matches('a.m3-card--elevated')), true);
    assert.equal(await focused.evaluate(el => getComputedStyle(el).outlineStyle), 'solid');
    assert.equal(await focused.evaluate(el => getComputedStyle(el).outlineWidth), thickness);
    await page.screenshot({ path: join(outDir, `state-focus-${scheme}.png`), clip: await clipOf(focused) });
  },
};

async function clipOf(locator) {
  await locator.scrollIntoViewIfNeeded();
  const b = await locator.boundingBox();
  return { x: Math.max(0, b.x - 16), y: Math.max(0, b.y - 16), width: b.width + 32, height: b.height + 32 };
}

// Runs in the page: label contrast over the container each component draws (element background or
// ::before, composited over the nearest opaque ancestor), and container and target geometry.
function inPage() {
  const parse = c => {
    const m = c.match(/rgba?\(([^)]+)\)/);
    if (!m) return null;
    const [r, g, b, a = 1] = m[1].split(/[\s,/]+/).filter(Boolean).map(Number);
    return { r, g, b, a };
  };
  const over = (top, bottom) => ({
    r: top.r * top.a + bottom.r * (1 - top.a), g: top.g * top.a + bottom.g * (1 - top.a), b: top.b * top.a + bottom.b * (1 - top.a), a: 1,
  });
  const lum = ({ r, g, b }) => {
    const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
  };
  const ratio = (x, y) => { const [a, b] = [lum(x), lum(y)].sort((p, q) => q - p); return (a + 0.05) / (b + 0.05); };
  const backdrop = el => {
    for (let e = el.parentElement; e; e = e.parentElement) {
      const c = parse(getComputedStyle(e).backgroundColor);
      if (c && c.a > 0) return c;
    }
    return { r: 255, g: 255, b: 255, a: 1 };
  };
  const px = v => parseFloat(v);
  const target = px(getComputedStyle(document.documentElement).getPropertyValue('--md-target-size'));
  const lowContrast = [];
  const badGeometry = [];
  let checked = 0;
  const SEL = '.m3-button, .m3-icon-button, .m3-segmented-button, .m3-fab, .m3-extended-fab, .m3-chip, '
    + '.m3-navigation-bar-item, .m3-navigation-rail-item, .m3-navigation-drawer-item, .m3-tab, .m3-menu-item';
  // Items whose ::before is an indicator around the icon only (the label is not over it).
  const ICON_INDICATOR = '.m3-navigation-bar-item, .m3-navigation-rail:not(.m3-navigation-rail--expanded) .m3-navigation-rail-item';
  for (const el of document.querySelectorAll(SEL)) {
    if (el.matches(':disabled, [aria-disabled="true"]')) continue;
    if (!el.getClientRects().length) continue; // not rendered: in a closed overlay
    checked++;
    const cs = getComputedStyle(el);
    const before = getComputedStyle(el, '::before');
    let bg = backdrop(el);
    const own = parse(cs.backgroundColor);
    if (own && own.a > 0) bg = over(own, bg);
    if (before.content !== 'none' && before.content !== 'normal' && !el.matches(ICON_INDICATOR)) {
      const c = parse(before.backgroundColor);
      if (c) bg = over({ ...c, a: c.a * Number(before.opacity) }, bg);
    }
    const fg = parse(cs.color);
    const size = px(cs.fontSize);
    const large = size >= 24 || (size >= 18.66 && Number(cs.fontWeight) >= 700);
    const r = ratio(fg, bg);
    const label = `${el.className} "${(el.getAttribute('aria-label') || el.textContent).trim()}"`;
    if (r < (large ? 3 : 4.5)) lowContrast.push(`${label}: ${r.toFixed(2)}`);
    // Target at least --md-target-size; a drawn container (::before) as tall as --_height, centered.
    const box = el.getBoundingClientRect();
    if (box.width < target || box.height < target) badGeometry.push(`${label}: target ${box.width}x${box.height}`);
    // (Components without a --_height, such as navigation items and tabs, size their own boxes.)
    const h = px(cs.getPropertyValue('--_height'));
    if (before.content !== 'none' && before.content !== 'normal' && !el.matches('.m3-fab, .m3-extended-fab') && !Number.isNaN(h)) {
      if (Math.abs(px(before.height) - h) > 0.01) badGeometry.push(`${label}: container ${before.height} vs ${h}px`);
      if (Math.abs(box.height - Math.max(h, target)) > 0.01) badGeometry.push(`${label}: element ${box.height} vs ${Math.max(h, target)}px`);
    }
  }
  return { lowContrast, badGeometry, checked, scrollWidth: document.documentElement.scrollWidth };
}

const MIME = { '.html': 'text/html', '.js': 'text/javascript','.css': 'text/css', '.woff2': 'font/woff2', '.ttf': 'font/ttf', '.txt': 'text/plain' };
function serve(dir) {
  const base = resolve(dir);
  const server = createServer((req, res) => {
    const p = resolve(base, '.' + decodeURIComponent(new URL(req.url, 'http://x').pathname));
    let f = p;
    if (f !== base && !f.startsWith(base + sep)) { res.writeHead(403).end(); return; }
    if (existsSync(f) && statSync(f).isDirectory()) f = join(f, 'index.html');
    if (!existsSync(f)) { res.writeHead(404).end(); return; }
    res.writeHead(200, { 'content-type': MIME[extname(f)] ?? 'application/octet-stream' });
    createReadStream(f).pipe(res);
  });
  return new Promise(ok => server.listen(0, '127.0.0.1', () => ok({
    origin: `http://127.0.0.1:${server.address().port}`,
    close: () => new Promise(r => { server.close(() => r()); server.closeAllConnections(); }),
  })));
}
