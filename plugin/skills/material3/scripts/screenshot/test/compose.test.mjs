// Compose back end of the screenshot step without a toolchain: a fake Gradle wrapper stands in for Gradle.
// States file validation, skip reasons (no wrapper, no Compose, no launcher, no JDK, no SDK, offline),
// the result shape verify reads (disabled nodes out, one entry per element, states ok / failed), and the
// project byte for byte the same afterwards (folder name with spaces).
import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { loadStates, screenshot, UsageError } from '../index.mjs';
import { findAndroidSdk, findJava, findLauncher, isResolutionFailure, launcherNames, normalizeReport, INIT_SCRIPT } from '../compose.mjs';

const MANIFEST = `<manifest xmlns:android="http://schemas.android.com/apk/res/android">
  <application><activity android:name=".MainActivity" android:exported="true">
    <intent-filter><action android:name="android.intent.action.MAIN"/><category android:name="android.intent.category.LAUNCHER"/></intent-filter>
  </activity></application></manifest>`;

const FAKE = `
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
const args = process.argv.slice(2);
const arg = (k) => args.find((a) => a.startsWith('-P' + k + '='))?.slice(k.length + 3);
const cfg = JSON.parse(readFileSync(new URL('./fake-cfg.json', import.meta.url), 'utf8'));
const out = arg('m3.outDir');
if (cfg.mode === 'resolve') { console.error('Could not resolve io.github.takahirom.roborazzi:roborazzi:1.79.0.'); process.exit(1); }
if (cfg.mode === 'hang') { console.log('> Task :app:testDebugUnitTest'); setInterval(() => {}, 1000); await new Promise(() => {}); }
if (cfg.mode === 'compile') { console.error('e: MainActivity.kt: Unresolved reference'); process.exit(1); }
const init = args[args.indexOf('--init-script') + 1];
if (!existsSync(init) || !init.endsWith('m3-shots.init.gradle.kts')) { console.error('init script missing'); process.exit(3); }
if (!existsSync(join(arg('m3.testSrcDir'), 'm3shots', 'M3ShotsTest.kt'))) { console.error('generated test missing'); process.exit(3); }
if (arg('m3.launcher') !== 'dev.fake.app.MainActivity') { console.error('launcher ' + arg('m3.launcher')); process.exit(3); }
if (process.cwd() === cfg.project) { console.error('ran inside the project'); process.exit(3); }
mkdirSync(out, { recursive: true });
const png = (f) => writeFileSync(join(out, f), Buffer.from([0x89, 0x50, 0x4e, 0x47]));
const el = (text, enabled, bounds) => ({ check: 'TextContrastCheck', type: 'WARNING', message: 'ratio 1.5', element: { className: 'android.widget.TextView', text, enabled, bounds } });
const statesFile = arg('m3.statesFile');
for (const theme of ['light', 'dark']) {
  if (statesFile) break;
  const frames = [1, 2].map((i) => ({
    frame: i, file: theme + '-412x915-0' + i + '.png',
    results: [el('Faint', true, [0, 0, 10, 10]), el('Faint off', false, [0, 20, 10, 30])],
    semanticsTargets: [
      { label: 'Small', enabled: true, widthDp: 32, heightDp: 32, bounds: [0, 40, 80, 120] },
      { label: 'Small off', enabled: false, widthDp: 32, heightDp: 32, bounds: [0, 140, 80, 220] },
    ],
  }));
  for (const f of frames) png(f.file);
  writeFileSync(join(out, 'runtime-' + theme + '.json'), JSON.stringify({ theme, frames, truncated: cfg.truncated === true }));
}
if (statesFile) {
  if (cfg.mode === 'states-hang') { setInterval(() => {}, 1000); await new Promise(() => {}); }
  for (const theme of ['light', 'dark']) {
    for (const s of JSON.parse(readFileSync(statesFile, 'utf8')).states) {
      const bad = s.name === 'broken';
      const file = 'state-' + s.name + '-' + theme + '-412x915.png';
      if (!bad) png(file);
      writeFileSync(join(out, 'state-' + s.name + '-' + theme + '.json'), JSON.stringify(bad ? { ok: false, error: 'step 1 click: nothing matches text "x"' } : { ok: true, file }));
    }
  }
}
`;

// A Compose project (fake wrapper) in a folder whose name has spaces.
function project({ wrapper = true, compose = true, launcher = true, mode = 'ok', truncated = false } = {}) {
  const dir = join(mkdtempSync(join(tmpdir(), 'm3 compose-unit-')), 'my app');
  mkdirSync(join(dir, 'app', 'src', 'main'), { recursive: true });
  writeFileSync(join(dir, 'settings.gradle.kts'), 'include(":app")\n');
  writeFileSync(join(dir, 'app', 'build.gradle.kts'), `plugins {\n  alias(libs.plugins.android.application)\n${compose ? '  alias(libs.plugins.kotlin.compose)\n' : ''}}\nandroid { namespace = "dev.fake.app" }\n`);
  writeFileSync(join(dir, 'app', 'src', 'main', 'AndroidManifest.xml'), launcher ? MANIFEST : '<manifest><application/></manifest>');
  if (wrapper) {
    writeFileSync(join(dir, 'fake.mjs'), FAKE);
    writeFileSync(join(dir, 'fake-cfg.json'), JSON.stringify({ mode, project: dir, truncated }));
    writeFileSync(join(dir, 'gradlew.bat'), '@echo off\r\nnode "%~dp0fake.mjs" %*\r\nexit /b %ERRORLEVEL%\r\n');
    writeFileSync(join(dir, 'gradlew'), '#!/bin/sh\nexec node "$(dirname "$0")/fake.mjs" "$@"\n', { mode: 0o755 });
  }
  return dir;
}

const TOOLS = { java: { exe: 'java', major: 21 }, sdk: tmpdir() };

function snapshot(dir, out = {}, base = dir) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) snapshot(p, out, base);
    else out[p.slice(base.length)] = createHash('sha256').update(readFileSync(p)).digest('hex');
  }
  return out;
}

test('compose states: the steps are click, enterText, scrollTo, waitMs with their finders', () => {
  const ok = { states: [
    { name: 'dialog', steps: [{ click: { text: 'Remove' } }, { click: { tag: 'fab' } }, { click: { desc: 'Close', index: 1 } }] },
    { name: 'empty_search-1', steps: [{ enterText: { into: { hint: 'Search' }, text: 'cactus' } }, { enterText: { into: { tag: 'q' }, text: '' } }, { scrollTo: { text: 'Total' } }, { waitMs: 300 }] },
  ] };
  assert.deepEqual(loadStates(ok, 'compose').map((s) => s.name), ['dialog', 'empty_search-1']);
  const bad = (steps) => assert.throws(() => loadStates({ states: [{ name: 's', steps }] }, 'compose'), UsageError);
  bad([{ tap: { text: 'x' } }]);
  bad([{ click: { key: 'x' } }]);
  bad([{ click: { text: 'a', tag: 'b' } }]);
  bad([{ click: { text: '' } }]);
  bad([{ click: 'Remove' }]);
  bad([{ click: { text: 'a', index: -1 } }]);
  bad([{ enterText: { into: { type: 'TextField' }, text: 'x' } }]);
  bad([{ enterText: { into: { hint: 'h' } } }]);
  bad([{ scrollTo: { hint: 'x' } }]);
  bad([{ waitMs: 60000 }]);
  bad([{ click: { text: 'a' }, waitMs: 1 }]);
  assert.throws(() => loadStates({ states: [] }, 'compose'), UsageError);
  assert.throws(() => loadStates({ states: [{ name: 'a b', steps: [{ waitMs: 1 }] }] }, 'compose'), UsageError);
  assert.throws(() => loadStates({ states: [{ name: 'a', steps: [{ waitMs: 1 }] }, { name: 'a', steps: [{ waitMs: 1 }] }] }, 'compose'), UsageError);
});

test('launcher lookup: aliases, relative names, no launcher, compose detection', () => {
  assert.deepEqual(launcherNames(MANIFEST), ['.MainActivity']);
  const dir = project();
  assert.deepEqual({ ...findLauncher(dir), dir: undefined }, { module: 'app', dir: undefined, activity: 'dev.fake.app.MainActivity', compose: true, hasLauncher: true });
  assert.equal(findLauncher(project({ compose: false })).compose, false);
  assert.equal(findLauncher(project({ launcher: false })).hasLauncher, false);
  assert.equal(findLauncher(mkdtempSync(join(tmpdir(), 'm3 empty-'))), null);
});

test('isResolutionFailure recognizes dependency download failures', () => {
  assert.ok(isResolutionFailure('> Could not resolve org.robolectric:robolectric:4.17.'));
  assert.ok(isResolutionFailure('java.net.UnknownHostException: repo.maven.apache.org'));
  assert.ok(!isResolutionFailure('e: MainActivity.kt: Unresolved reference: foo'));
});

test('normalizeReport leaves out disabled nodes', () => {
  const n = normalizeReport('light frame 1/1', {
    semanticsTargets: [{ label: 'On', enabled: true, widthDp: 20, heightDp: 20, bounds: [0, 0, 1, 1] }, { label: 'Off', enabled: false, widthDp: 20, heightDp: 20, bounds: [0, 0, 1, 1] }],
    results: [{ check: 'TextContrastCheck', type: 'WARNING', message: 'm', element: { text: 'a', enabled: false } }],
  });
  assert.equal(n.targets.length, 1);
  assert.match(n.targets[0].where, /clickable "On"/);
  assert.deepEqual(n.contrast, []);
});

test('skipped without a wrapper, without Compose, without a launcher: reason, nothing written into the project', async () => {
  for (const [opts, re] of [[{ wrapper: false }, /no Gradle wrapper/], [{ compose: false }, /does not use Jetpack Compose/], [{ launcher: false }, /no launcher activity/]]) {
    const dir = project(opts);
    const before = snapshot(dir);
    const r = await screenshot({ projectDir: dir, platform: 'compose', env: {}, ...{ tools: TOOLS } });
    assert.equal(r.ran, false);
    assert.match(r.skippedReason, re);
    assert.deepEqual(r.runtime, { contrast: [], targets: [] });
    assert.equal(JSON.parse(readFileSync(r.capture, 'utf8')).ran, false);
    assert.deepEqual(snapshot(dir), before);
  }
});

test('skipped without a JDK and without an Android SDK, naming what is missing', async (t) => {
  const dir = project();
  const clean = { PATH: '', LOCALAPPDATA: '', ANDROID_HOME: '', ANDROID_SDK_ROOT: '' };
  const r = await screenshot({ projectDir: dir, platform: 'compose', env: clean });
  assert.equal(r.ran, false);
  assert.match(r.skippedReason, /no JDK found/);
  const old = await screenshot({ projectDir: dir, platform: 'compose', env: clean, tools: { java: { exe: 'java', major: 11 } } });
  assert.match(old.skippedReason, /JDK 11 found/);
  if (findAndroidSdk(dir, clean)) { t.skip('an Android SDK sits in a default folder of this machine'); return; }
  const noSdk = await screenshot({ projectDir: dir, platform: 'compose', env: clean, tools: { java: TOOLS.java } });
  assert.match(noSdk.skippedReason, /Android SDK not found/);
  assert.equal(findJava({ PATH: '' }), null);
});

test('dependencies that cannot be resolved (offline): skipped with the reason; a compile error says it did not build', async () => {
  const off = project({ mode: 'resolve' });
  const r = await screenshot({ projectDir: off, platform: 'compose', env: process.env, tools: TOOLS });
  assert.equal(r.ran, false);
  assert.match(r.skippedReason, /could not resolve or download dependencies \(offline/);
  assert.match(r.skippedReason, /Could not resolve io\.github/);
  const bad = await screenshot({ projectDir: project({ mode: 'compile' }), platform: 'compose', env: process.env, tools: TOOLS });
  assert.equal(bad.ran, false);
  assert.match(bad.skippedReason, /did not build or run/);
  assert.equal(bad.buildOk, false);
});

test('a run: shots in scroll order, one entry per element, disabled out, states ok and failed, project untouched', async () => {
  const dir = project({ truncated: true });
  const before = snapshot(dir);
  const states = { states: [
    { name: 'dialog', steps: [{ click: { text: 'Remove' } }] },
    { name: 'broken', steps: [{ click: { text: 'x' } }] },
  ] };
  const r = await screenshot({ projectDir: dir, platform: 'compose', env: process.env, tools: TOOLS, states });
  assert.equal(r.ran, true, r.skippedReason);
  assert.deepEqual(r.shots.map((s) => s.split(/[\\/]/).pop()), ['light-412x915-01.png', 'light-412x915-02.png', 'dark-412x915-01.png', 'dark-412x915-02.png']);
  assert.equal(r.runtime.contrast.length, 2);
  assert.ok(r.runtime.contrast.every((e) => /^(light|dark) frame 1\/2: .*text="Faint"/.test(e.where) && !/Faint off/.test(e.where)));
  assert.equal(r.runtime.targets.length, 2);
  assert.ok(r.runtime.targets.every((e) => /clickable "Small"/.test(e.where) && /32x32dp/.test(e.detail)));
  const [ok, broken] = r.states;
  assert.equal(ok.ok, true);
  assert.deepEqual(ok.shots.map((s) => s.split(/[\\/]/).pop()), ['state-dialog-light-412x915.png', 'state-dialog-dark-412x915.png']);
  assert.equal(broken.ok, false);
  assert.match(broken.error, /nothing matches text/);
  assert.ok(r.warnings.some((w) => /state "broken" failed/.test(w)));
  assert.ok(r.warnings.some((w) => /longer than 4 viewports/.test(w)));
  const cap = JSON.parse(readFileSync(r.capture, 'utf8'));
  assert.equal(cap.platform, 'compose');
  assert.ok(cap.shots.every((s) => !/[\\/]/.test(s)));
  assert.deepEqual(snapshot(dir), before);
  assert.ok(existsSync(INIT_SCRIPT));
});

test('hard cap: a wrapper that never returns is killed and the step reports ran:false with the phase', async () => {
  const t = Date.now();
  const r = await screenshot({ projectDir: project({ mode: 'hang' }), platform: 'compose', env: process.env, tools: TOOLS, timeoutMs: 4000 });
  assert.ok(Date.now() - t < 60_000);
  assert.equal(r.ran, false);
  assert.match(r.skippedReason, /capped at 4 s in total/);
  assert.match(r.skippedReason, /while running the Robolectric test/);
  assert.match(r.skippedReason, /killed/);
});

test('hard cap in the states run: the main shots stay, the states fail with the cap message', async () => {
  const states = { states: [{ name: 'dialog', steps: [{ click: { text: 'Remove' } }] }] };
  const r = await screenshot({ projectDir: project({ mode: 'states-hang' }), platform: 'compose', env: process.env, tools: TOOLS, states, timeoutMs: 8000 });
  assert.equal(r.ran, true, r.skippedReason);
  assert.equal(r.shots.length, 4);
  assert.equal(r.states[0].ok, false);
  assert.match(r.states[0].error, /capped at 8 s/);
  assert.ok(r.warnings.some((w) => /^states: .*killed/.test(w)));
});
