// Screenshot step: skips without Playwright and without a system browser, refuses an output folder
// inside the project, finds Chrome / Edge / Chromium per OS, and (with the local toolchain) renders 4
// shots with Playwright or with a system browser over CDP, measuring contrast and touch targets in
// the shape verify reads, without writing anything into the project.
import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, statSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, relative, win32 } from 'node:path';
import { fileURLToPath } from 'node:url';

import { screenshot, UsageError } from '../index.mjs';
import { browserCandidates, findBrowser, findPlaywright } from '../web.mjs';
import { installAssets } from '../../install-assets/index.mjs';
import { writeTheme } from '../../color/index.mjs';
import { verify } from '../../verify/index.mjs';

const INDEX = fileURLToPath(new URL('../index.mjs', import.meta.url));
const VERIFY = fileURLToPath(new URL('../../verify/index.mjs', import.meta.url));
const REPO = fileURLToPath(new URL('../../../../../../', import.meta.url));
const toolchain = process.env.M3_TOOLCHAIN_TESTS !== '1' && 'needs the local toolchain (M3_TOOLCHAIN_TESTS=1)';
const noBrowser = process.env.M3_NO_BROWSER_TESTS === '1' && 'M3_NO_BROWSER_TESTS=1';
const SHOTS = ['dark-1440x900.png', 'dark-412x915.png', 'light-1440x900.png', 'light-412x915.png'];
const ALL = ['dark-1440x900', 'dark-412x915', 'light-1440x900', 'light-412x915'];

// A project folder whose path has spaces.
function project(html = '<!doctype html><title>Plan</title><p>Ready</p>') {
  const dir = join(mkdtempSync(join(tmpdir(), 'm3 shot-')), 'my project');
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'index.html'), html);
  return dir;
}

// The page both engines render: M3 assets, a faint text, a label over a ::before container and a
// 20 px button.
function fixture() {
  const dir = project(`<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Trail planner</title>
  <link rel="stylesheet" href="assets/m3/fonts.css">
  <link rel="stylesheet" href="assets/m3/tokens.css">
  <link rel="stylesheet" href="assets/m3/theme.css">
  <link rel="stylesheet" href="assets/m3/button.css">
  <link rel="stylesheet" href="assets/m3/icon-button.css">
  <style>
    body { margin: 0; background: var(--md-sys-color-surface); color: var(--md-sys-color-on-surface); font-family: var(--md-sys-typescale-body-large-font); }
    main { display: grid; gap: var(--md-sys-space-200); padding: var(--md-sys-space-200); }
    .m3-icon { font-family: 'Material Symbols Outlined'; font-style: normal; font-feature-settings: 'liga'; }
    .boxed { position: relative; isolation: isolate; color: #555555; }
    .boxed::before { content: ''; position: absolute; inset: 0; z-index: -1; background: #333333; }
  </style>
</head>
<body>
<main>
  <h1 class="m3-type-headline-small">Weekend trails</h1>
  <p class="m3-type-body-large">Three routes near Lake Orta, 6 to 14 km.</p>
  <div><button class="m3-button m3-button--filled">Plan a hike</button>
    <button class="m3-button m3-button--tonal">Save</button>
    <button class="m3-icon-button" aria-label="Favorite"><span class="m3-icon" aria-hidden="true">favorite</span></button></div>
  <p id="faint" style="color: #c8c8c8; background: #ffffff">Faint note</p>
  <p><span id="boxed" class="boxed">Boxed label</span></p>
  <button id="tiny" style="inline-size: 20px; block-size: 20px; padding: 0">i</button>
</main>
</body>
</html>`);
  const ins = installAssets({ projectDir: dir, platform: 'web', parts: ['tokens', 'fonts', 'button', 'icon-button'] });
  assert.deepEqual(ins.conflicts, []);
  writeTheme({ platform: 'web', seed: '#6750A4', out: join(dir, 'assets/m3/theme.css') });
  return dir;
}

// Every file below dir (node_modules left out) with its size and modification time.
function listing(dir, base = dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    if (e.name === 'node_modules') return [];
    const p = join(dir, e.name);
    if (e.isDirectory()) return [`${relative(base, p)}/`, ...listing(p, base)];
    const s = statSync(p);
    return [`${relative(base, p)} ${s.size} ${s.mtimeMs}`];
  }).sort();
}

const isWithin = (child, parent) => !relative(parent, child).startsWith('..');

// The fixture's findings, whichever engine rendered it.
function assertFixtureFindings(r) {
  assert.deepEqual(r.shots.map((s) => relative(r.out, s)).sort(), SHOTS);
  for (const s of r.shots) assert.deepEqual([...readFileSync(s).subarray(0, 4)], [0x89, 0x50, 0x4e, 0x47], s);
  assert.deepEqual(r.pageErrors, {});
  assert.deepEqual(r.warnings, []);
  // { where, detail } entries, deduplicated by element across the captures.
  for (const e of [...r.runtime.contrast, ...r.runtime.targets]) {
    assert.equal(typeof e.where, 'string');
    assert.equal(typeof e.detail, 'string');
  }
  const bySelector = (list) => Object.fromEntries(list.map((e) => [e.selector, e]));
  const contrast = bySelector(r.runtime.contrast);
  assert.deepEqual(Object.keys(contrast).sort(), ['#boxed', '#faint']);
  assert.deepEqual(contrast['#faint'].captures.sort(), ALL);
  assert.match(contrast['#faint'].detail, /text "Faint note" \d\.\d\d:1, needs 4\.5:1/);
  // The label over a ::before container is measured against the container, also in light.
  assert.ok(contrast['#boxed'].captures.includes('light-412x915'), contrast['#boxed'].where);
  const targets = bySelector(r.runtime.targets);
  assert.deepEqual(Object.keys(targets), ['#tiny']);
  assert.deepEqual(targets['#tiny'].captures.sort(), ['dark-412x915', 'light-412x915']);
  assert.match(targets['#tiny'].detail, /20x20 CSS px, below 48x48 at 412 width/);
  for (const k of ALL) assert.ok(r.measured[k].checked > 0, k);
}

test('without Playwright and without a browser: skipped with the reason, nothing written into the project', async (t) => {
  const dir = project();
  if (findPlaywright(dir, { roots: [] })) { t.skip('a Playwright resolves from the temp folder'); return; }
  const before = listing(dir);
  const r = await screenshot({ projectDir: dir, platform: 'web', roots: [], browsers: [] });
  assert.equal(r.ran, false);
  assert.match(r.skippedReason, /Playwright not found/);
  assert.match(r.skippedReason, /no Chrome, Edge or Chromium found/);
  assert.match(r.skippedReason, /never installs/);
  assert.equal(r.engine, undefined);
  assert.deepEqual(r.shots, []);
  assert.deepEqual(r.runtime, { contrast: [], targets: [] });
  assert.ok(!isWithin(r.out, dir), r.out);
  const cap = JSON.parse(readFileSync(r.capture, 'utf8'));
  assert.deepEqual(cap.runtime, { contrast: [], targets: [] });
  assert.equal(cap.ran, false);
  assert.deepEqual(listing(dir), before);
});

test('a browser that does not start: skipped with the reason, profile removed', { timeout: 60_000 }, async (t) => {
  const dir = project();
  if (findPlaywright(dir, { roots: [] })) { t.skip('a Playwright resolves from the temp folder'); return; }
  // node rejects the browser flags and exits at once.
  const r = await screenshot({ projectDir: dir, platform: 'web', roots: [], browsers: [process.execPath] });
  assert.equal(r.ran, false);
  assert.equal(r.engine, 'cdp');
  assert.match(r.skippedReason, /could not start/);
  assert.equal(r.browser.path, process.execPath);
  assert.ok(!existsSync(r.browser.profile), r.browser.profile);
});

test('browser candidates: Chrome / Edge / Chromium per OS; the first that exists wins', () => {
  const W = win32.join;
  const win = browserCandidates({ PROGRAMFILES: 'C:\\PF', 'PROGRAMFILES(X86)': 'C:\\PF86', LOCALAPPDATA: 'C:\\LA' }, 'win32');
  for (const p of [W('C:\\PF', 'Google', 'Chrome', 'Application', 'chrome.exe'), W('C:\\PF86', 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
    W('C:\\LA', 'Google', 'Chrome', 'Application', 'chrome.exe')]) assert.ok(win.includes(p), `${p}\n${win.join('\n')}`);
  const mac = browserCandidates({ HOME: '/Users/a' }, 'darwin');
  for (const p of ['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
    '/Applications/Chromium.app/Contents/MacOS/Chromium', '/Users/a/Applications/Google Chrome.app/Contents/MacOS/Google Chrome']) assert.ok(mac.includes(p), p);
  const linux = browserCandidates({ PATH: '/usr/local/bin:/usr/bin' }, 'linux');
  for (const p of ['/usr/bin/google-chrome', '/usr/local/bin/chromium', '/usr/bin/microsoft-edge']) assert.ok(linux.includes(p), p);
  const bin = mkdtempSync(join(tmpdir(), 'm3 bin-'));
  writeFileSync(join(bin, 'chromium'), '');
  assert.equal(findBrowser([join(bin, 'missing'), join(bin, 'chromium')]), join(bin, 'chromium'));
  assert.equal(findBrowser([join(bin, 'missing')]), null);
});

test('compose has no back end yet: skipped with the reason', async () => {
  const dir = project();
  for (const platform of ['compose']) {
    const r = await screenshot({ projectDir: dir, platform, roots: [] });
    assert.equal(r.ran, false);
    assert.match(r.skippedReason, new RegExp(`no screenshot back end for ${platform}`));
  }
});

test('an output folder inside the project is refused (function and CLI)', async () => {
  const dir = project();
  const before = listing(dir);
  await assert.rejects(screenshot({ projectDir: dir, platform: 'web', out: join(dir, 'shots'), roots: [] }), UsageError);
  const cli = spawnSync(process.execPath, [INDEX, dir, '--platform', 'web', '--out', join(dir, 'shots')], { encoding: 'utf8' });
  assert.equal(cli.status, 2, cli.stderr);
  assert.match(cli.stderr, /outside the project/);
  assert.deepEqual(listing(dir), before);
  const usage = spawnSync(process.execPath, [INDEX, dir], { encoding: 'utf8' });
  assert.equal(usage.status, 2);
});

test('with Playwright: 4 shots, runtime in the shape verify reads, nothing written into the project', { skip: toolchain || noBrowser, timeout: 600_000 }, async () => {
  const { withToolchain } = await import('../../../../../../evals/tools/toolchain-env.mjs');
  process.env.PLAYWRIGHT_BROWSERS_PATH = withToolchain(process.env).PLAYWRIGHT_BROWSERS_PATH;
  const dir = fixture();
  // The project's own Playwright: a junction to the repository's package.
  mkdirSync(join(dir, 'node_modules'));
  symlinkSync(join(REPO, 'node_modules', 'playwright'), join(dir, 'node_modules', 'playwright'), 'junction');
  const before = listing(dir);

  const r = await screenshot({ projectDir: dir, platform: 'web', roots: [] });
  assert.equal(r.ran, true, r.skippedReason);
  assert.equal(r.engine, 'playwright');
  assert.equal(r.playwright.from, 'project');
  assert.ok(!isWithin(r.out, dir), r.out);
  assertFixtureFindings(r);

  // verify reads capture.json's runtime.
  const cap = JSON.parse(readFileSync(r.capture, 'utf8'));
  assert.deepEqual(cap.shots.sort(), SHOTS);
  const v = await verify({ projectDir: dir, platform: 'web', runtime: cap.runtime });
  assert.equal(v.runtimeChecked, true);
  assert.equal(v.counts.contrast, 2);
  assert.equal(v.counts['touch-target'], 1);

  // The CLI finds the project's Playwright, and verify's CLI takes the capture.
  const cli = spawnSync(process.execPath, [INDEX, dir, '--platform', 'web'], { encoding: 'utf8', env: process.env });
  assert.equal(cli.status, 0, cli.stderr);
  const out = JSON.parse(cli.stdout);
  assert.equal(out.ran, true);
  assert.equal(out.engine, 'playwright');
  assert.equal(out.shots.length, 4);
  assert.equal(out.contrast.length, 2);
  assert.ok(existsSync(out.capture));
  const vr = spawnSync(process.execPath, [VERIFY, dir, 'web', out.capture, '--out', join(tmpdir(), `m3-verify-${process.pid}`)], { encoding: 'utf8' });
  assert.doesNotMatch(vr.stdout, /not checked \(no runtime results\)/);

  assert.deepEqual(listing(dir), before, 'nothing written into the project');
});

test('without Playwright: a system Chrome / Edge over CDP gives the same shots and findings', { skip: toolchain || noBrowser, timeout: 600_000 }, async (t) => {
  const dir = fixture();
  if (findPlaywright(dir, { roots: [] })) { t.skip('a Playwright resolves from the temp folder'); return; }
  const exe = findBrowser();
  assert.ok(exe, 'a Chromium-family browser is installed on this machine');
  const before = listing(dir);

  const r = await screenshot({ projectDir: dir, platform: 'web', roots: [] });
  assert.equal(r.ran, true, r.skippedReason);
  assert.equal(r.engine, 'cdp');
  assert.equal(r.browser.path, exe);
  assert.match(r.browser.version, /\d+\.\d+/);
  assert.ok(!isWithin(r.out, dir), r.out);
  assert.ok(!existsSync(r.browser.profile), `profile removed: ${r.browser.profile}`);
  assertFixtureFindings(r);
  // Light and dark differ (prefers-color-scheme is emulated), and the 412 shot is 412 px wide.
  const light = readFileSync(join(r.out, 'light-412x915.png'));
  const dark = readFileSync(join(r.out, 'dark-412x915.png'));
  assert.notDeepEqual(light, dark);
  assert.equal(light.readUInt32BE(16), 412);
  assert.equal(readFileSync(join(r.out, 'light-1440x900.png')).readUInt32BE(16), 1440);

  const cap = JSON.parse(readFileSync(r.capture, 'utf8'));
  assert.equal(cap.engine, 'cdp');
  const v = await verify({ projectDir: dir, platform: 'web', runtime: cap.runtime });
  assert.equal(v.counts.contrast, 2);
  assert.equal(v.counts['touch-target'], 1);

  const cli = spawnSync(process.execPath, [INDEX, dir, '--platform', 'web'], { encoding: 'utf8', env: process.env, timeout: 300_000 });
  assert.equal(cli.status, 0, cli.stderr);
  const out = JSON.parse(cli.stdout);
  assert.equal(out.engine, 'cdp');
  assert.equal(out.shots.length, 4);

  assert.deepEqual(listing(dir), before, 'nothing written into the project');
});
