// Web capture harness: screenshots plus runtime contrast and touch-target checks.
//
//   captureWeb({ projectDir, kind, outDir }) -> capture object (see the Phase 2 harness brief)
//   CLI: node harness/web/capture.mjs <projectDir> <kind> <outDir>
//        exit 0 = captured, 1 = build or capture failed (capture.json still written), 2 = usage.
//
// kind:
//   web-empty           static site; the entry is index.html at the root, else in dist/, public/
//                       or src/ (first found). The whole project folder is served.
//   web-react, web-vue  `npm run build` (or `npx --no-install vite build` when there is no build
//                       script), then dist/ is served. Dependencies are not installed here; the
//                       project must already have them.
//
// Each of the 4 captures (412x915 and 1440x900, light and dark via colorScheme emulation) waits for
// network idle and document.fonts.ready, with reducedMotion emulated, a stylesheet that pauses CSS
// animations and transitions, and remaining Web Animations finished (or cancelled if infinite).
//
// Runtime checks, normalized into runtime.contrast / runtime.targets and deduplicated by selector:
//   - axe-core (pinned in harness/web/package.json), rules color-contrast and target-size only,
//     with :disabled and [aria-disabled="true"] excluded from the context;
//   - a computed-box check at 412 width (both themes), because axe target-size uses 24 CSS px and
//     the spec wants 48dp: every visible, enabled interactive element smaller than 48x48 CSS px.
//     Exception: inline text inside a paragraph (an element whose computed display is `inline` and
//     that sits inside a <p>), e.g. a link in running text. WCAG 2.5.8 exempts such targets because
//     their size is set by the line of text, and M3 does not ask for 48dp links inside body copy.
import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync, createReadStream } from 'node:fs';
import { join, resolve, relative, sep, extname, dirname } from 'node:path';
import { pathToFileURL } from 'node:url';
import { withToolchain } from '../../evals/tools/toolchain-env.mjs';

export const KINDS = ['web-empty', 'web-react', 'web-vue'];
export const VIEWPORTS = [
  { name: '412x915', width: 412, height: 915 },
  { name: '1440x900', width: 1440, height: 900 },
];
export const THEMES = ['light', 'dark'];
export const MIN_TARGET = 48;
const AXE_RULES = ['color-contrast', 'target-size'];
const EXCLUDE = [':disabled', '[aria-disabled="true"]'];
const ENTRY_DIRS = ['', 'dist', 'public', 'src'];
const BUILD_TIMEOUT_MS = 10 * 60_000;
const NAV_TIMEOUT_MS = 60_000;
const IDLE_TIMEOUT_MS = 15_000;

const NO_MOTION_CSS = `*, *::before, *::after {
  animation-play-state: paused !important;
  transition: none !important;
  caret-color: transparent !important;
  scroll-behavior: auto !important;
}`;

// Playwright reads PLAYWRIGHT_BROWSERS_PATH when it is first imported, so point it at the toolchain
// Chromium (this process only) before the dynamic import below.
process.env.PLAYWRIGHT_BROWSERS_PATH = withToolchain(process.env).PLAYWRIGHT_BROWSERS_PATH;

function axeSource() {
  const require = createRequire(import.meta.url);
  let path;
  try { path = require.resolve('axe-core/axe.min.js'); }
  catch { throw new Error('axe-core is not installed: run `npm ci` in harness/web'); }
  return { source: readFileSync(path, 'utf8'), version: JSON.parse(readFileSync(join(dirname(path), 'package.json'), 'utf8')).version };
}

const stripAnsi = s => s.replace(/\x1b\[[0-9;?]*[A-Za-z]/g, '');
const lastLines = (text, n) => {
  const lines = stripAnsi(text).replace(/\r\n/g, '\n').split('\n');
  while (lines.length && !lines.at(-1).trim()) lines.pop();
  return lines.slice(-n).join('\n').replace(/^\s*\n/, '');
};

function run(cmd, cwd) {
  return new Promise(res => {
    const env = { ...withToolchain(process.env), FORCE_COLOR: '0', NO_COLOR: '1', CI: '1' };
    const child = spawn(cmd, { cwd, env, shell: true, windowsHide: true });
    let out = '';
    child.stdout.on('data', d => { out += d; });
    child.stderr.on('data', d => { out += d; });
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      if (process.platform === 'win32') spawn('taskkill', ['/pid', String(child.pid), '/T', '/F'], { windowsHide: true });
      else child.kill('SIGKILL');
    }, BUILD_TIMEOUT_MS);
    child.on('error', e => { out += `\n${e.message}`; });
    child.on('close', code => { clearTimeout(timer); res({ code: timedOut ? null : code, timedOut, out }); });
  });
}

const MIME = {
  '.html': 'text/html; charset=utf-8', '.htm': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json',
  '.map': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.gif': 'image/gif', '.webp': 'image/webp', '.avif': 'image/avif', '.ico': 'image/x-icon', '.woff': 'font/woff',
  '.woff2': 'font/woff2', '.ttf': 'font/ttf', '.otf': 'font/otf', '.txt': 'text/plain; charset=utf-8',
  '.wasm': 'application/wasm', '.webmanifest': 'application/manifest+json',
};

// Minimal static server bound to 127.0.0.1 on a free port. With spaFallback, extension-less paths
// that do not exist get index.html (what `vite preview` does for client-side routes).
function serve(root, { spaFallback = false } = {}) {
  root = resolve(root);
  const server = createServer((req, res) => {
    let p;
    try { p = decodeURIComponent(new URL(req.url, 'http://x').pathname); }
    catch { res.writeHead(400).end(); return; }
    let file = resolve(root, '.' + p);
    if (file !== root && !file.startsWith(root + sep)) { res.writeHead(403).end(); return; }
    if (existsSync(file) && statSync(file).isDirectory()) file = join(file, 'index.html');
    if (!existsSync(file) && spaFallback && !extname(p)) file = join(root, 'index.html');
    if (!existsSync(file) || !statSync(file).isFile()) { res.writeHead(404, { 'content-type': 'text/plain' }).end('not found'); return; }
    res.writeHead(200, { 'content-type': MIME[extname(file).toLowerCase()] ?? 'application/octet-stream', 'cache-control': 'no-store' });
    createReadStream(file).pipe(res);
  });
  return new Promise((res, rej) => {
    server.once('error', rej);
    server.listen(0, '127.0.0.1', () => res({ origin: `http://127.0.0.1:${server.address().port}`, close: () => new Promise(r => { server.close(() => r()); server.closeAllConnections(); }) }));
  });
}

export function findEntry(projectDir) {
  for (const d of ENTRY_DIRS) {
    const f = join(projectDir, d, 'index.html');
    if (existsSync(f)) return f;
  }
  return null;
}

// Runs in the page after axe is injected: visible, enabled interactive elements below the minimum.
function boxCheckInPage({ min }) {
  const SEL = 'a[href], button, input, select, textarea, [role=button], [tabindex]:not([tabindex="-1"])';
  const selectorOf = el => {
    try {
      window.axe.setup(document);
      try { return window.axe.utils.getSelector(el); } finally { window.axe.teardown(); }
    } catch {
      if (el.id && document.querySelectorAll('#' + CSS.escape(el.id)).length === 1) return '#' + CSS.escape(el.id);
      const parts = [];
      for (let e = el; e && e.nodeType === 1 && e !== document.documentElement; e = e.parentElement) {
        const i = e.parentElement ? [...e.parentElement.children].indexOf(e) + 1 : 1;
        parts.unshift(`${e.localName}:nth-child(${i})`);
      }
      return parts.join(' > ');
    }
  };
  const fmt = n => (Number.isInteger(n) ? String(n) : n.toFixed(1));
  const hits = [];
  for (const el of document.querySelectorAll(SEL)) {
    if (el.matches(':disabled') || el.closest('[aria-disabled="true"]')) continue;
    if (el.localName === 'input' && el.type === 'hidden') continue;
    if (el.checkVisibility && !el.checkVisibility({ checkOpacity: false, checkVisibilityCSS: true })) continue;
    const r = el.getBoundingClientRect();
    if (r.width <= 0 || r.height <= 0) continue;
    if (getComputedStyle(el).display === 'inline' && el.closest('p')) continue; // inline text in a paragraph
    if (r.width >= min && r.height >= min) continue;
    hits.push({ selector: selectorOf(el), width: fmt(r.width), height: fmt(r.height) });
  }
  return hits;
}

const nodeMessage = n => [...(n.any ?? []), ...(n.all ?? []), ...(n.none ?? [])].map(c => c.message).find(Boolean) ?? n.failureSummary ?? '';
const nodeSelector = n => (Array.isArray(n.target) ? n.target.flat(Infinity).join(' ') : String(n.target));

function collector() {
  const map = new Map();
  return {
    add(selector, capture, detail) {
      const e = map.get(selector) ?? { selector, captures: [], details: [] };
      if (!e.captures.includes(capture)) e.captures.push(capture);
      if (detail && !e.details.includes(detail)) e.details.push(detail);
      map.set(selector, e);
    },
    list: () => [...map.values()].map(e => ({ where: `${e.selector} [${e.captures.join(', ')}]`, detail: e.details.join(' | '), selector: e.selector, captures: e.captures })),
  };
}

async function captureAll({ origin, path, outDir }) {
  const axe = axeSource();
  const { chromium } = await import('playwright');
  const browser = await chromium.launch();
  const shots = [];
  const contrast = collector();
  const targets = collector();
  const raw = { axeVersion: axe.version, url: origin + path, axe: {}, axeIncomplete: {}, boxCheck: {}, pageErrors: {}, warnings: [] };
  try {
    for (const vp of VIEWPORTS) {
      for (const theme of THEMES) {
        const key = `${theme}-${vp.name}`;
        const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, colorScheme: theme, reducedMotion: 'reduce', deviceScaleFactor: 1 });
        try {
          await context.addInitScript(css => {
            const add = () => { const s = document.createElement('style'); s.setAttribute('data-m3-harness', ''); s.textContent = css; (document.head ?? document.documentElement).appendChild(s); };
            if (document.documentElement) add(); else document.addEventListener('DOMContentLoaded', add, { once: true });
          }, NO_MOTION_CSS);
          const page = await context.newPage();
          const errors = [];
          page.on('pageerror', e => errors.push(String(e.message ?? e)));
          page.on('console', m => { if (m.type() === 'error') errors.push(`console: ${m.text()}`); });
          const resp = await page.goto(origin + path, { waitUntil: 'load', timeout: NAV_TIMEOUT_MS });
          if (resp && !resp.ok()) throw new Error(`HTTP ${resp.status()} for ${path}`);
          await page.waitForLoadState('networkidle', { timeout: IDLE_TIMEOUT_MS }).catch(() => raw.warnings.push(`${key}: network not idle after ${IDLE_TIMEOUT_MS} ms`));
          await page.evaluate(() => document.fonts.ready.then(() => undefined));
          await page.addStyleTag({ content: NO_MOTION_CSS });
          await page.evaluate(() => {
            for (const a of document.getAnimations()) { try { a.finish(); } catch { a.cancel(); } }
          });

          const file = `${key}.png`;
          await page.screenshot({ path: join(outDir, file), fullPage: true, animations: 'disabled', caret: 'hide' });
          shots.push({ file, theme, viewport: vp.name });

          await page.addScriptTag({ content: axe.source });
          const res = await page.evaluate(async ({ rules, exclude }) => {
            const r = await window.axe.run({ exclude: exclude.map(s => [s]) }, { runOnly: { type: 'rule', values: rules }, resultTypes: ['violations', 'incomplete'] });
            const pick = list => list.map(v => ({ id: v.id, impact: v.impact, help: v.help, nodes: v.nodes.map(n => ({ target: n.target, html: n.html.slice(0, 200), failureSummary: n.failureSummary, any: n.any.map(c => ({ id: c.id, message: c.message })), all: n.all.map(c => ({ id: c.id, message: c.message })), none: n.none.map(c => ({ id: c.id, message: c.message })) })) }));
            return { violations: pick(r.violations), incomplete: pick(r.incomplete) };
          }, { rules: AXE_RULES, exclude: EXCLUDE });
          raw.axe[key] = res.violations;
          raw.axeIncomplete[key] = res.incomplete.map(v => ({ id: v.id, count: v.nodes.length, targets: v.nodes.map(n => nodeSelector(n)) }));
          for (const v of res.violations) {
            const into = v.id === 'color-contrast' ? contrast : targets;
            for (const n of v.nodes) into.add(nodeSelector(n), key, `axe ${v.id}: ${nodeMessage(n)}`);
          }

          if (vp.width === 412) {
            const hits = await page.evaluate(boxCheckInPage, { min: MIN_TARGET });
            raw.boxCheck[key] = hits;
            for (const h of hits) targets.add(h.selector, key, `${h.width}x${h.height} CSS px, below ${MIN_TARGET}x${MIN_TARGET} at 412 width`);
          }
          if (errors.length) raw.pageErrors[key] = errors.slice(0, 50);
        } finally {
          await context.close();
        }
      }
    }
  } finally {
    await browser.close();
  }
  return { shots, runtime: { contrast: contrast.list(), targets: targets.list() }, raw };
}

function record(outDir, cap) {
  writeFileSync(join(outDir, 'capture.json'), JSON.stringify(cap, null, 2) + '\n');
  return cap;
}

const failed = (reason, raw = {}) => ({ platform: 'web', buildOk: false, reason, shots: [], runtime: { contrast: [], targets: [] }, raw });

export async function captureWeb({ projectDir, kind, outDir }) {
  if (!KINDS.includes(kind)) throw new Error(`unknown kind '${kind}'; expected one of ${KINDS.join(', ')}`);
  if (!projectDir || !outDir) throw new Error('projectDir and outDir are required');
  projectDir = resolve(projectDir);
  outDir = resolve(outDir);
  mkdirSync(outDir, { recursive: true });

  let root, path, spaFallback = false;
  const raw = { kind };
  if (kind === 'web-empty') {
    const entry = findEntry(projectDir);
    if (!entry) return record(outDir, failed(`no entry HTML: looked for index.html in ${ENTRY_DIRS.map(d => d || '.').join(', ')}`, raw));
    root = projectDir;
    path = '/' + relative(projectDir, entry).split(sep).join('/');
  } else {
    const pkgFile = join(projectDir, 'package.json');
    if (!existsSync(pkgFile)) return record(outDir, failed('no package.json in the project', raw));
    let pkg;
    try { pkg = JSON.parse(readFileSync(pkgFile, 'utf8')); }
    catch (e) { return record(outDir, failed(`package.json does not parse: ${e.message}`, raw)); }
    const cmd = pkg.scripts?.build ? 'npm run build' : 'npx --no-install vite build';
    const b = await run(cmd, projectDir);
    raw.build = { command: cmd, exitCode: b.code, timedOut: b.timedOut };
    if (b.timedOut) return record(outDir, failed(`build timed out after ${BUILD_TIMEOUT_MS / 1000} s\n${lastLines(b.out, 40)}`, raw));
    if (b.code !== 0) return record(outDir, failed(lastLines(b.out, 40) || `build exited with ${b.code}`, raw));
    root = join(projectDir, 'dist');
    if (!existsSync(join(root, 'index.html'))) return record(outDir, failed(`build succeeded but dist/index.html is missing\n${lastLines(b.out, 40)}`, raw));
    path = '/';
    spaFallback = true;
  }

  const server = await serve(root, { spaFallback });
  try {
    const cap = await captureAll({ origin: server.origin, path, outDir });
    return record(outDir, { platform: 'web', buildOk: true, reason: undefined, ...cap, raw: { ...raw, ...cap.raw } });
  } catch (e) {
    return record(outDir, failed(`capture failed: ${e.message}`, raw));
  } finally {
    await server.close();
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const [projectDir, kind, outDir] = process.argv.slice(2);
  if (!projectDir || !kind || !outDir || !KINDS.includes(kind)) {
    console.error(`usage: node harness/web/capture.mjs <projectDir> <${KINDS.join('|')}> <outDir>`);
    process.exit(2);
  }
  const cap = await captureWeb({ projectDir, kind, outDir });
  console.log(JSON.stringify({ buildOk: cap.buildOk, reason: cap.reason, shots: cap.shots.length, contrast: cap.runtime.contrast.length, targets: cap.runtime.targets.length, out: join(resolve(outDir), 'capture.json') }, null, 2));
  process.exit(cap.buildOk ? 0 : 1);
}
