// Web back end of the screenshot step: renders the page with Playwright at 412x915 and 1440x900, in
// light and dark (prefers-color-scheme), and measures in the page what only a browser can:
//   - contrast: every visible text against the background actually drawn under it (the element's and
//     its ancestors' backgrounds, and the ::before / ::after containers the shipped component CSS
//     draws), composited; 4.5:1, or 3:1 for large text and Material Symbols glyphs;
//   - targets (at 412 width): every visible, enabled interactive element smaller than 48x48 CSS px
//     (inline links inside a paragraph excepted, as WCAG 2.5.8 does).
// Results are { where, detail } entries, the shape verify reads from capture.json `runtime`.
//
// Playwright is never installed here: the project's own (its node_modules or a folder above it) or a
// global one is used when it resolves; otherwise the step is skipped with the reason. A browser is
// started from Playwright's own Chromium, else the installed Chrome or Edge.
//
// What is served: --url when given (a running dev server); a Vite project is built into the output
// folder (vite build --outDir <out>/site); otherwise the first index.html in the project root, dist/,
// public/ or src/ is served from a local static server. Nothing is written into the project
// (a Vite build may refresh its own caches under node_modules).
import { spawnSync } from 'node:child_process';
import { createReadStream, existsSync, readFileSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { delimiter, dirname, extname, join, relative, resolve, sep } from 'node:path';
import { pathToFileURL } from 'node:url';

export const VIEWPORTS = [
  { name: '412x915', width: 412, height: 915 },
  { name: '1440x900', width: 1440, height: 900 },
];
export const THEMES = ['light', 'dark'];
// Minimum touch target in CSS px: --md-target-size in tokens.css (48, from material-web's touch target).
export const MIN_TARGET = 48;
const PACKAGES = ['playwright', 'playwright-core', '@playwright/test'];
const ENTRY_DIRS = ['', 'dist', 'public', 'src'];
// Frameworks whose build does not go to a plain static folder: they need --url.
const NEEDS_URL = ['next', 'nuxt', '@sveltejs/kit', 'astro', '@angular/core', '@remix-run/react', 'gatsby'];
const BUILD_TIMEOUT_MS = 10 * 60_000;
const NAV_TIMEOUT_MS = 60_000;
const IDLE_TIMEOUT_MS = 15_000;

const NO_MOTION_CSS = `*, *::before, *::after {
  animation-play-state: paused !important;
  transition: none !important;
  caret-color: transparent !important;
  scroll-behavior: auto !important;
}`;

const firstLine = (e) => String(e?.message ?? e).split('\n').find((l) => l.trim())?.trim() ?? 'unknown error';

// ---- Playwright -------------------------------------------------------------------------------

// Global node_modules folders, cheapest guesses first.
export function globalRoots(env = process.env) {
  const roots = String(env.NODE_PATH ?? '').split(delimiter).filter(Boolean);
  const win = process.platform === 'win32';
  const prefix = env.npm_config_prefix || env.NPM_CONFIG_PREFIX;
  if (prefix) roots.push(win ? join(prefix, 'node_modules') : join(prefix, 'lib', 'node_modules'));
  if (win && env.APPDATA) roots.push(join(env.APPDATA, 'npm', 'node_modules'));
  roots.push(win ? join(dirname(process.execPath), 'node_modules') : join(dirname(dirname(process.execPath)), 'lib', 'node_modules'));
  return [...new Set(roots)];
}

function npmGlobalRoot() {
  const r = spawnSync('npm', ['root', '-g'], { encoding: 'utf8', shell: process.platform === 'win32', timeout: 15_000, windowsHide: true });
  const out = r.status === 0 ? r.stdout.trim() : '';
  return out && existsSync(out) ? out : null;
}

function resolveIn(base) {
  for (const name of PACKAGES) {
    try {
      const path = require_resolve(name, base);
      return { name, path };
    } catch { /* next */ }
  }
  return null;
}

// require.resolve from a start folder: looks in <base>/node_modules and every folder above it (and in
// <base> itself when it is a node_modules folder).
function require_resolve(name, base) {
  const parts = [];
  for (let d = resolve(base); ; d = dirname(d)) {
    parts.push(d.endsWith(`${sep}node_modules`) || d.endsWith('/node_modules') ? d : join(d, 'node_modules'));
    if (dirname(d) === d) break;
  }
  for (const nm of parts) {
    const pkgFile = join(nm, ...name.split('/'), 'package.json');
    if (!existsSync(pkgFile)) continue;
    const pkg = JSON.parse(readFileSync(pkgFile, 'utf8'));
    const main = join(dirname(pkgFile), typeof pkg.main === 'string' ? pkg.main : 'index.js');
    const file = existsSync(main) ? main : existsSync(`${main}.js`) ? `${main}.js` : join(main, 'index.js');
    if (existsSync(file)) return { file, version: pkg.version ?? null };
  }
  throw new Error(`${name} not found from ${base}`);
}

// { from: 'project' | 'global', name, file, version } or null.
export function findPlaywright(projectDir, { roots } = {}) {
  const hit = resolveIn(projectDir);
  if (hit) return { from: 'project', name: hit.name, ...hit.path };
  const list = roots ?? globalRoots();
  for (const r of list) {
    const g = resolveIn(r);
    if (g) return { from: 'global', name: g.name, ...g.path };
  }
  if (!roots) {
    const npm = npmGlobalRoot();
    const g = npm && !list.includes(npm) ? resolveIn(npm) : null;
    if (g) return { from: 'global', name: g.name, ...g.path };
  }
  return null;
}

async function launch(pw) {
  const mod = await import(pathToFileURL(pw.file).href);
  const chromium = mod.chromium ?? mod.default?.chromium;
  if (!chromium) throw new Error(`${pw.name} has no chromium export`);
  let last;
  for (const opts of [{}, { channel: 'chrome' }, { channel: 'msedge' }]) {
    try { return await chromium.launch(opts); } catch (e) { last = e; }
  }
  throw last;
}

// ---- What to serve ----------------------------------------------------------------------------

const readJson = (f) => { try { return JSON.parse(readFileSync(f, 'utf8')); } catch { return null; } };

export function findEntry(projectDir) {
  for (const d of ENTRY_DIRS) {
    const f = join(projectDir, d, 'index.html');
    if (existsSync(f)) return f;
  }
  return null;
}

// { url } | { root, path } | { skip }
function site(projectDir, outDir) {
  const pkg = readJson(join(projectDir, 'package.json'));
  const deps = pkg ? { ...pkg.dependencies, ...pkg.devDependencies } : {};
  const needsUrl = NEEDS_URL.find((n) => n in deps);
  if (needsUrl) return { skip: `${needsUrl} project: start its dev server and pass --url <address>` };
  if ('vite' in deps) {
    let vite;
    try { vite = join(dirname(require_resolve('vite', projectDir).file), '..', 'bin', 'vite.js'); } catch { vite = null; }
    if (!vite || !existsSync(vite)) return { skip: 'Vite project without installed dependencies: run the package install, or start the dev server and pass --url <address>' };
    const dist = join(outDir, 'site');
    const r = spawnSync(process.execPath, [vite, 'build', '--outDir', dist, '--emptyOutDir', '--logLevel', 'warn'],
      { cwd: projectDir, encoding: 'utf8', timeout: BUILD_TIMEOUT_MS, windowsHide: true, env: { ...process.env, CI: '1', NO_COLOR: '1' } });
    if (r.status !== 0 || !existsSync(join(dist, 'index.html'))) {
      const tail = `${r.stdout ?? ''}${r.stderr ?? ''}`.trim().split(/\r?\n/).slice(-15).join('\n');
      return { skip: `vite build failed (fix the build, or pass --url <address>):\n${tail || r.error?.message || `exit ${r.status}`}` };
    }
    return { root: dist, path: '/', spa: true };
  }
  const entry = findEntry(projectDir);
  if (!entry) return { skip: `no index.html in ${ENTRY_DIRS.map((d) => d || '.').join(', ')}: start the dev server and pass --url <address>` };
  return { root: projectDir, path: `/${relative(projectDir, entry).split(sep).join('/')}` };
}

const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png',
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.gif': 'image/gif', '.webp': 'image/webp', '.avif': 'image/avif',
  '.ico': 'image/x-icon', '.woff': 'font/woff', '.woff2': 'font/woff2', '.ttf': 'font/ttf', '.otf': 'font/otf',
  '.txt': 'text/plain; charset=utf-8', '.wasm': 'application/wasm', '.webmanifest': 'application/manifest+json',
};

// Read-only static server on 127.0.0.1 and a free port.
function serve(root, { spa = false } = {}) {
  root = resolve(root);
  const server = createServer((req, res) => {
    let p;
    try { p = decodeURIComponent(new URL(req.url, 'http://x').pathname); } catch { res.writeHead(400).end(); return; }
    let file = resolve(root, `.${p}`);
    if (file !== root && !file.startsWith(root + sep)) { res.writeHead(403).end(); return; }
    if (existsSync(file) && statSync(file).isDirectory()) file = join(file, 'index.html');
    if (!existsSync(file) && spa && !extname(p)) file = join(root, 'index.html');
    if (!existsSync(file) || !statSync(file).isFile()) { res.writeHead(404, { 'content-type': 'text/plain' }).end('not found'); return; }
    res.writeHead(200, { 'content-type': MIME[extname(file).toLowerCase()] ?? 'application/octet-stream', 'cache-control': 'no-store' });
    createReadStream(file).pipe(res);
  });
  return new Promise((ok, fail) => {
    server.once('error', fail);
    server.listen(0, '127.0.0.1', () => ok({
      origin: `http://127.0.0.1:${server.address().port}`,
      close: () => new Promise((r) => { server.close(() => r()); server.closeAllConnections(); }),
    }));
  });
}

// ---- In-page measurement (runs in the browser) ------------------------------------------------

function measureInPage({ min, targets }) {
  const parse = (c) => {
    let m = /^rgba?\(([^)]+)\)$/.exec(c);
    if (m) {
      const p = m[1].split(/[\s,/]+/).filter(Boolean).map(Number);
      return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 };
    }
    m = /^color\(srgb ([^)]+)\)$/.exec(c);
    if (m) {
      const p = m[1].split(/[\s/]+/).filter(Boolean).map(Number);
      return { r: p[0] * 255, g: p[1] * 255, b: p[2] * 255, a: p.length > 3 ? p[3] : 1 };
    }
    return null;
  };
  const over = (t, b) => ({ r: t.r * t.a + b.r * (1 - t.a), g: t.g * t.a + b.g * (1 - t.a), b: t.b * t.a + b.b * (1 - t.a), a: 1 });
  const lum = ({ r, g, b }) => {
    const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
  };
  const ratio = (x, y) => { const [a, b] = [lum(x), lum(y)].sort((p, q) => q - p); return (a + 0.05) / (b + 0.05); };
  const hex = ({ r, g, b }) => `#${[r, g, b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('')}`;
  const n = (v) => parseFloat(v) || 0;
  const unique = (s) => document.querySelectorAll(s).length === 1;
  const selectorOf = (el) => {
    const parts = [];
    for (let e = el; e && e !== document.body && e !== document.documentElement && parts.length < 5; e = e.parentElement) {
      if (e.id && unique(`#${CSS.escape(e.id)}`)) { parts.unshift(`#${CSS.escape(e.id)}`); break; }
      let s = e.localName + [...e.classList].slice(0, 2).map((c) => `.${CSS.escape(c)}`).join('');
      const same = e.parentElement ? [...e.parentElement.children].filter((x) => x.localName === e.localName) : [];
      if (same.length > 1) s += `:nth-of-type(${same.indexOf(e) + 1})`;
      parts.unshift(s);
    }
    return parts.join(' > ');
  };

  // The box a positioned ::before/::after draws, with its background (null when it draws none or
  // cannot be placed: a pseudo-element is only placed when it is absolutely positioned in a
  // positioned element).
  const pseudo = (el, cs, which) => {
    const ps = getComputedStyle(el, which);
    if (ps.content === 'none' || ps.content === 'normal' || ps.display === 'none' || ps.visibility === 'hidden') return null;
    const c = parse(ps.backgroundColor);
    const image = ps.backgroundImage !== 'none';
    if ((!c || c.a === 0) && !image) return null;
    if (ps.position !== 'absolute' || cs.position === 'static') return null;
    const box = el.getBoundingClientRect();
    const x = box.left + n(cs.borderLeftWidth) + n(ps.left) + n(ps.marginLeft);
    const y = box.top + n(cs.borderTopWidth) + n(ps.top) + n(ps.marginTop);
    const extra = ps.boxSizing === 'content-box';
    const w = n(ps.width) + (extra ? n(ps.paddingLeft) + n(ps.paddingRight) + n(ps.borderLeftWidth) + n(ps.borderRightWidth) : 0);
    const h = n(ps.height) + (extra ? n(ps.paddingTop) + n(ps.paddingBottom) + n(ps.borderTopWidth) + n(ps.borderBottomWidth) : 0);
    return { x, y, w, h, image, color: c ? { ...c, a: c.a * n(ps.opacity) } : null };
  };
  const inside = (p, pt) => pt.x >= p.x && pt.x <= p.x + p.w && pt.y >= p.y && pt.y <= p.y + p.h;

  const rootCs = getComputedStyle(document.documentElement);
  const darkCanvas = /dark/.test(rootCs.colorScheme) && matchMedia('(prefers-color-scheme: dark)').matches;
  const canvas = darkCanvas ? { r: 18, g: 18, b: 18, a: 1 } : { r: 255, g: 255, b: 255, a: 1 };

  const contrast = [];
  let checked = 0;
  let unmeasured = 0;
  const seen = new Set();
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let t = walker.nextNode(); t; t = walker.nextNode()) {
    if (!t.nodeValue.trim()) continue;
    const el = t.parentElement;
    if (!el || seen.has(el)) continue;
    seen.add(el);
    if (el.closest('script, style, noscript, template, title, select, option, textarea')) continue;
    if (el.closest(':disabled, [aria-disabled="true"], [inert]')) continue;
    const label = el.closest('label');
    if (label && label.control && label.control.disabled) continue;
    if (el.checkVisibility && !el.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true })) continue;
    const cs = getComputedStyle(el);
    const box = el.getBoundingClientRect();
    if (box.width <= 1 || box.height <= 1 || cs.clipPath !== 'none' || (cs.clip && cs.clip !== 'auto')) continue;
    const range = document.createRange();
    range.selectNodeContents(t);
    const rr = range.getBoundingClientRect();
    if (rr.width < 1 || rr.height < 1) continue;
    const pt = { x: rr.left + rr.width / 2, y: rr.top + rr.height / 2 };

    let fg = parse(cs.color);
    let faded = false;
    for (let e = el; e; e = e.parentElement) if (n(getComputedStyle(e).opacity) < 1) { faded = true; break; }
    if (!fg || faded) { unmeasured++; continue; }

    const layers = [];
    let unknown = false;
    walk: for (let e = el; e; e = e.parentElement) {
      const ecs = e === el ? cs : getComputedStyle(e);
      for (const which of ['::after', '::before']) {
        const p = pseudo(e, ecs, which);
        if (!p || !inside(p, pt)) continue;
        if (p.image) { unknown = true; break walk; }
        if (p.color && p.color.a > 0) {
          layers.push(p.color);
          if (p.color.a >= 1) break walk;
        }
      }
      if (ecs.backgroundImage !== 'none') { unknown = true; break; }
      const bg = parse(ecs.backgroundColor);
      if (bg && bg.a > 0) {
        layers.push(bg);
        if (bg.a >= 1) break;
      }
    }
    if (unknown) { unmeasured++; continue; }
    let bg = canvas;
    for (const l of layers.reverse()) bg = over(l, bg);
    if (fg.a < 1) fg = over(fg, bg);
    checked++;
    const size = n(cs.fontSize);
    const icon = /Material Symbols/i.test(cs.fontFamily);
    const large = size >= 24 || (size >= 18.66 && n(cs.fontWeight) >= 700);
    const need = icon || large ? 3 : 4.5;
    const r = ratio(fg, bg);
    if (r < need) {
      const text = t.nodeValue.trim().replace(/\s+/g, ' ').slice(0, 40);
      contrast.push({ selector: selectorOf(el), detail: `${icon ? 'icon' : 'text'} "${text}" ${r.toFixed(2)}:1, needs ${need}:1 (${hex(fg)} on ${hex(bg)})` });
    }
  }

  const small = [];
  if (targets) {
    const SEL = 'a[href], button, input, select, textarea, [role=button], [tabindex]:not([tabindex="-1"])';
    const fmt = (v) => (Number.isInteger(v) ? String(v) : v.toFixed(1));
    for (const el of document.querySelectorAll(SEL)) {
      if (el.matches(':disabled') || el.closest('[aria-disabled="true"]')) continue;
      if (el.localName === 'input' && el.type === 'hidden') continue;
      if (el.checkVisibility && !el.checkVisibility({ checkOpacity: false, checkVisibilityCSS: true })) continue;
      const r = el.getBoundingClientRect();
      if (r.width <= 0 || r.height <= 0) continue;
      if (getComputedStyle(el).display === 'inline' && el.closest('p')) continue;
      if (r.width >= min && r.height >= min) continue;
      small.push({ selector: selectorOf(el), detail: `${fmt(r.width)}x${fmt(r.height)} CSS px, below ${min}x${min} at 412 width` });
    }
  }
  return { contrast, targets: small, checked, unmeasured, scrollWidth: document.documentElement.scrollWidth };
}

// ---- Capture ----------------------------------------------------------------------------------

function collector() {
  const map = new Map();
  return {
    add(selector, capture, detail) {
      const e = map.get(selector) ?? { selector, captures: [], details: [] };
      if (!e.captures.includes(capture)) e.captures.push(capture);
      if (!e.details.includes(detail)) e.details.push(detail);
      map.set(selector, e);
    },
    list: () => [...map.values()].map((e) => ({ where: `${e.selector} [${e.captures.join(', ')}]`, detail: e.details.join(' | '), selector: e.selector, captures: e.captures })),
  };
}

async function captureAll(browser, url, outDir) {
  const shots = [];
  const contrast = collector();
  const targets = collector();
  const pageErrors = {};
  const warnings = [];
  const measured = {};
  for (const vp of VIEWPORTS) {
    for (const theme of THEMES) {
      const key = `${theme}-${vp.name}`;
      const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, colorScheme: theme, reducedMotion: 'reduce', deviceScaleFactor: 1 });
      try {
        await context.addInitScript((css) => {
          const add = () => { const s = document.createElement('style'); s.textContent = css; (document.head ?? document.documentElement).appendChild(s); };
          if (document.documentElement) add(); else document.addEventListener('DOMContentLoaded', add, { once: true });
        }, NO_MOTION_CSS);
        const page = await context.newPage();
        const errors = [];
        page.on('pageerror', (e) => errors.push(String(e.message ?? e)));
        page.on('console', (m) => { if (m.type() === 'error') errors.push(`console: ${m.text()}`); });
        const resp = await page.goto(url, { waitUntil: 'load', timeout: NAV_TIMEOUT_MS });
        if (resp && !resp.ok()) throw new Error(`HTTP ${resp.status()} for ${url}`);
        await page.waitForLoadState('networkidle', { timeout: IDLE_TIMEOUT_MS }).catch(() => warnings.push(`${key}: network not idle after ${IDLE_TIMEOUT_MS} ms`));
        await page.evaluate(() => document.fonts.ready.then(() => undefined));
        await page.addStyleTag({ content: NO_MOTION_CSS });
        await page.evaluate(() => { for (const a of document.getAnimations()) { try { a.finish(); } catch { a.cancel(); } } });

        const file = join(outDir, `${key}.png`);
        await page.screenshot({ path: file, fullPage: true, animations: 'disabled', caret: 'hide' });
        shots.push(file);

        const m = await page.evaluate(measureInPage, { min: MIN_TARGET, targets: vp.width === 412 });
        measured[key] = { checked: m.checked, unmeasured: m.unmeasured };
        for (const c of m.contrast) contrast.add(c.selector, key, c.detail);
        for (const c of m.targets) targets.add(c.selector, key, c.detail);
        if (m.scrollWidth > vp.width) warnings.push(`${key}: the page scrolls sideways (${m.scrollWidth} px wide)`);
        if (errors.length) pageErrors[key] = errors.slice(0, 20);
      } finally {
        await context.close();
      }
    }
  }
  return { shots, runtime: { contrast: contrast.list(), targets: targets.list() }, pageErrors, warnings, measured };
}

// screenshotWeb({ projectDir, outDir, url?, roots? }) -> result (see index.mjs)
export async function screenshotWeb({ projectDir, outDir, url, roots }) {
  const empty = { shots: [], runtime: { contrast: [], targets: [] } };
  const pw = findPlaywright(projectDir, { roots });
  if (!pw) {
    return { ran: false, skippedReason: 'Playwright not found in the project or globally (this step never installs it): screenshots skipped', ...empty };
  }
  const target = url ? { url } : site(projectDir, outDir);
  if (target.skip) return { ran: false, skippedReason: target.skip, ...empty, playwright: { from: pw.from, version: pw.version } };

  let browser;
  try {
    browser = await launch(pw);
  } catch (e) {
    return {
      ran: false,
      skippedReason: `Playwright ${pw.version ?? ''} found (${pw.from}) but no browser could start; install one with \`npx playwright install chromium\` yourself (this step never installs): ${firstLine(e)}`,
      ...empty,
      playwright: { from: pw.from, version: pw.version },
    };
  }
  const server = target.url ? null : await serve(target.root, { spa: target.spa });
  try {
    const cap = await captureAll(browser, target.url ?? server.origin + target.path, outDir);
    return { ran: true, ...cap, playwright: { from: pw.from, version: pw.version } };
  } catch (e) {
    return { ran: false, skippedReason: `capture failed: ${firstLine(e)}`, ...empty, playwright: { from: pw.from, version: pw.version } };
  } finally {
    await browser.close();
    if (server) await server.close();
  }
}
