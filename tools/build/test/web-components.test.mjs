// Web component style sheets (plugin/skills/material3/assets/web/components/*.css) and their gallery
// pages (tools/build/gallery/web/*.html).
//   Static: install parts and markers, every value a token variable, colors only from the color roles,
//   every variable declared, class names, the [impl:] values in tokens.css, the token ladder, and
//   verify on a gallery site (no scored finding).
//   Toolchain (M3_TOOLCHAIN_TESTS=1): the harness capture of each gallery (no touch-target or
//   contrast finding in either theme or viewport) and computed checks in Chromium (label contrast over
//   the drawn container, which axe cannot measure on a pseudo-element; state layers, elevation and
//   focus rings per gallery (STATE_CHECKS); container geometry and button group gaps; text field labels;
//   no sideways scroll).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createReadStream, existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { extname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildSkillTokens } from '../tokens.mjs';
import { shadowOf, TARGET_SIZE } from '../emit/web.mjs';
import { buildGallerySite, GALLERY_DIR } from '../gallery/web/site.mjs';
import { MANIFEST, WEB_COMPONENTS } from '../../../plugin/skills/material3/scripts/install-assets/manifest.mjs';
import { BASELINE_SEED, renderTheme } from '../../../plugin/skills/material3/scripts/color/index.mjs';
import { verify } from '../../../plugin/skills/material3/scripts/verify/index.mjs';
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
//   (the anchor's end edge) and a slider handle's travel.
const NUMBER_EXCEPTIONS = [{ prop: 'z-index', value: '-1' }];
const HALVING = /\/\s*2(?![\d.])/g;
const PERCENT_PROPS = new Set(['inset-inline-start', '--_handle-offset']);

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

test('colors come only from the --md-sys-color-* roles', () => {
  const COLOR = /(?:^|-)(?:color|background|border|outline|shadow|fill|stroke)$/;
  for (const [f, css] of sheets) {
    assert.ok(!/#[0-9a-f]{3,8}\b/i.test(stripComments(css)), `${f}: hex color`);
    for (const d of declarations(css)) {
      if (!COLOR.test(d.prop) || d.prop === 'transition-property') continue;
      for (const v of usedIn(`x{a:${d.value}}`)) {
        assert.ok(/^--md-sys-color-|^--_|^--md-comp-[\w-]+-(?:opacity|width)$|^--md-sys-elevation-level\d-shadow$|^--md-sys-state-focus-indicator-thickness$|^--md-impl-[\w-]+-width$/.test(v),
          `${f}: ${d.prop} uses ${v}`);
      }
      const rest = stripVar(d.value).replace(/\b(?:transparent|none|inherit|solid|from|r|g|b|rgb|0)\b|[()/,\s]/g, '');
      assert.equal(rest, '', `${f}: ${d.prop}: ${d.value}`);
    }
  }
});

// Variables the page sets for a component (CSS cannot read them): the slider's position, 0 to 1.
const PAGE_INPUTS = ['--m3-slider-value'];

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
  ];
  const re = new RegExp(`^m3-(?:${COMPONENTS.join('|')})(?:--[a-z0-9]+(?:-[a-z0-9]+)*)?$`);
  for (const [f, css] of sheets) {
    for (const m of stripComments(css).matchAll(/\.(m3-[\w-]+)/g)) assert.match(m[1], re, f);
    for (const m of stripComments(css).matchAll(/\.(?!m3-)([a-z][\w-]*)/g)) assert.fail(`${f}: class .${m[1]} outside the m3- namespace`);
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
    'md.comp.button.large.label-text derived:md.sys.typescale.headline-small',
    'md.comp.button.medium.label-text derived:md.sys.typescale.title-medium',
    'md.comp.button.small.label-text derived:md.sys.typescale.label-large',
    'md.comp.button.xlarge.label-text derived:md.sys.typescale.headline-large',
    'md.comp.button.xsmall.label-text derived:md.sys.typescale.label-large',
    'md.comp.extended-fab.large.label-text derived:md.sys.typescale.headline-small',
    'md.comp.extended-fab.medium.label-text derived:md.sys.typescale.title-large',
    'md.comp.extended-fab.small.label-text derived:md.sys.typescale.title-medium',
  ]);
  // Each rung-2 comment matches the provenance in tokens/comp.json.
  for (const [k, p] of used) if (p.startsWith('derived:')) assert.equal(comp[k].web[1], p, k);
  assert.ok(used.size > 150, `${used.size} component tokens`);
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
const MIN_CHECKED = { actions: 100, containment: 10 };

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
    // md.comp.button.filled.hovered.container.elevation: level1
    assert.equal(await pseudoOf(btn, '::before', 'box-shadow'), await probe(page, 'box-shadow', '--md-sys-elevation-level1-shadow'));
    await page.screenshot({ path: join(outDir, `state-hover-${scheme}.png`), clip: await clipOf(btn) });
    await page.mouse.down();
    assert.equal(await pseudoOf(btn, '::after', 'opacity'), await rootVar(page, '--md-sys-state-pressed-state-layer-opacity'));
    assert.equal(await pseudoOf(btn, '::before', 'border-top-left-radius'), await rootVar(page, '--md-sys-shape-corner-small'));
    assert.equal(await pseudoOf(btn, '::before', 'box-shadow'), 'none');
    await page.screenshot({ path: join(outDir, `state-pressed-${scheme}.png`), clip: await clipOf(btn) });
    await page.mouse.up();
    await page.mouse.move(0, 0);
    await btn.evaluate(el => el.blur());

    // Elevated button: level1 at rest, level2 on hover; text button: no elevation on hover.
    const elevated = page.locator('.m3-button--elevated:not([aria-pressed]):not(:disabled)').first();
    assert.equal(await pseudoOf(elevated, '::before', 'box-shadow'), await probe(page, 'box-shadow', '--md-sys-elevation-level1-shadow'));
    await elevated.hover();
    assert.equal(await pseudoOf(elevated, '::before', 'box-shadow'), await probe(page, 'box-shadow', '--md-sys-elevation-level2-shadow'));
    await page.screenshot({ path: join(outDir, `state-hover-elevated-${scheme}.png`), clip: await clipOf(elevated) });
    const text = page.locator('.m3-button--text:not(:disabled)').first();
    await text.hover();
    assert.equal(await pseudoOf(text, '::before', 'box-shadow'), 'none');
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
    assert.equal(await pseudoOf(checked, '::after', 'content'), '"check"');
    assert.equal(await pseudoOf(checked, '::after', 'background-color'), await probe(page, 'color', '--md-sys-color-primary'));
    assert.equal(await pseudoOf(page.locator('#indeterminate'), '::after', 'content'), '"remove"');

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
  const SEL = '.m3-button, .m3-icon-button, .m3-segmented-button, .m3-fab, .m3-extended-fab, .m3-chip';
  for (const el of document.querySelectorAll(SEL)) {
    if (el.matches(':disabled, [aria-disabled="true"]')) continue;
    checked++;
    const cs = getComputedStyle(el);
    const before = getComputedStyle(el, '::before');
    let bg = backdrop(el);
    const own = parse(cs.backgroundColor);
    if (own && own.a > 0) bg = over(own, bg);
    if (before.content !== 'none' && before.content !== 'normal') {
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
    if (before.content !== 'none' && before.content !== 'normal' && !el.matches('.m3-fab, .m3-extended-fab')) {
      const h = px(cs.getPropertyValue('--_height'));
      if (Math.abs(px(before.height) - h) > 0.01) badGeometry.push(`${label}: container ${before.height} vs ${h}px`);
      if (Math.abs(box.height - Math.max(h, target)) > 0.01) badGeometry.push(`${label}: element ${box.height} vs ${Math.max(h, target)}px`);
    }
  }
  return { lowContrast, badGeometry, checked, scrollWidth: document.documentElement.scrollWidth };
}

const MIME = { '.html': 'text/html', '.css': 'text/css', '.woff2': 'font/woff2', '.ttf': 'font/ttf', '.txt': 'text/plain' };
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
