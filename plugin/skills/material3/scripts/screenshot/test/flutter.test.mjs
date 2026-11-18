// Flutter back end of the screenshot step, with a fake `flutter` launcher on PATH (no SDK needed):
// skipped without the SDK, the project is byte for byte the same afterwards (path with spaces), the
// shots are named in scroll order, contrast and targets come out in the shape verify reads, and a
// project that still imports flutter/material.dart on Flutter 3.50 gets the migration hint.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { chmodSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { delimiter, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { screenshot } from '../index.mjs';
import { legacyImportWarning, MIGRATE_COMMAND, parseGuidelineFailures } from '../flutter.mjs';

const here = dirname(fileURLToPath(import.meta.url));

// A project folder whose path has spaces.
function project({ material = 'package:flutter/material.dart' } = {}) {
  const dir = join(mkdtempSync(join(tmpdir(), 'm3 flutter-')), 'my app');
  mkdirSync(join(dir, 'lib'), { recursive: true });
  mkdirSync(join(dir, 'test'), { recursive: true });
  const ui = material.includes('material_ui') ? '  material_ui: ^1.11.0\n' : '';
  writeFileSync(join(dir, 'pubspec.yaml'), `name: my_app\nenvironment:\n  sdk: ^3.14.0\ndependencies:\n  flutter:\n    sdk: flutter\n${ui}`);
  writeFileSync(join(dir, 'lib', 'main.dart'), `import '${material}';\nvoid main() {}\n`);
  writeFileSync(join(dir, 'test', 'flutter_test_config.dart'), '// the project own config\n');
  return dir;
}

// Every file under dir with its hash, to compare before and after.
function snapshot(dir, out = {}, base = dir) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) snapshot(p, out, base);
    else out[p.slice(base.length)] = createHash('sha256').update(readFileSync(p)).digest('hex');
  }
  return out;
}

const FAKE = `
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
const args = process.argv.slice(2);
const cfg = JSON.parse(readFileSync(new URL('./cfg.json', import.meta.url), 'utf8'));
if (args[0] === '--version') { console.log(JSON.stringify({ frameworkVersion: cfg.version })); process.exit(0); }
if (args[0] === 'pub') process.exit(0);
if (args[0] === 'test') {
  const theme = args[args.indexOf('--name') + 1].split('.')[2];
  const cwd = process.cwd();
  const gen = join(cwd, 'test', 'm3_shots_test.dart');
  if (!existsSync(gen) || !existsSync(join(cwd, 'test', 'flutter_test_config.dart'))) { console.error('generated test missing'); process.exit(3); }
  if (!readFileSync(gen, 'utf8').includes('package:my_app/main.dart')) { console.error('package not substituted'); process.exit(3); }
  const out = process.env.M3_CAPTURE_OUT;
  const reason = cfg.contrast ? 'SemanticsNode#7(Rect.fromLTRB(0.0, 0.0, 40.0, 20.0), label: "Tiny"): Expected contrast ratio of at least 4.5 but found 2.1 for a font size of 14.0.\\nSee also: https://www.w3.org/TR/WCAG21/#contrast-minimum' : null;
  const frames = [];
  for (let i = 1; i <= cfg.frames; i++) {
    const file = theme + '-412x915-' + String(i).padStart(2, '0') + '.png';
    writeFileSync(join(out, file), 'png');
    frames.push({ frame: i, file, textContrastGuideline: { passed: !reason, reason }, touchTargetGuideline: { passed: true, reason: null } });
  }
  writeFileSync(join(out, 'runtime-' + theme + '.json'), JSON.stringify({ theme, truncated: false, settle: 'settled', frames }));
  process.exit(0);
}
process.exit(4);
`;

// A flutter launcher that answers --version, `pub get` and `test` like the real one would.
function fakeFlutter({ version = '3.50.0', frames = 3, contrast = true } = {}) {
  const bin = mkdtempSync(join(tmpdir(), 'm3 fake-flutter-'));
  writeFileSync(join(bin, 'fake-flutter.mjs'), FAKE);
  writeFileSync(join(bin, 'cfg.json'), JSON.stringify({ version, frames, contrast }));
  if (process.platform === 'win32') {
    writeFileSync(join(bin, 'flutter.cmd'), '@echo off\r\nnode "%~dp0fake-flutter.mjs" %*\r\n');
  } else {
    writeFileSync(join(bin, 'flutter'), '#!/bin/sh\nexec node "$(dirname "$0")/fake-flutter.mjs" "$@"\n');
    chmodSync(join(bin, 'flutter'), 0o755);
  }
  const key = Object.keys(process.env).find((k) => k.toLowerCase() === 'path') ?? 'PATH';
  return { ...process.env, [key]: `${bin}${delimiter}${process.env[key]}` };
}

test('without the SDK: skipped with the reason, nothing written into the project', async () => {
  const dir = project();
  const before = snapshot(dir);
  const r = await screenshot({ projectDir: dir, platform: 'flutter', env: { PATH: '' } });
  assert.equal(r.ran, false);
  assert.match(r.skippedReason, /Flutter SDK not found/);
  assert.deepEqual(r.runtime, { contrast: [], targets: [] });
  assert.deepEqual(snapshot(dir), before);
});

test('shots in scroll order, runtime in the shape verify reads, project byte for byte unchanged', { timeout: 120_000 }, async () => {
  const dir = project();
  const before = snapshot(dir);
  const out = join(mkdtempSync(join(tmpdir(), 'm3 out-')), 'shots');
  const r = await screenshot({ projectDir: dir, platform: 'flutter', out, env: fakeFlutter() });
  assert.equal(r.ran, true, r.skippedReason);
  assert.deepEqual(r.shots.map((s) => s.slice(out.length + 1)), [
    'light-412x915-01.png', 'light-412x915-02.png', 'light-412x915-03.png',
    'dark-412x915-01.png', 'dark-412x915-02.png', 'dark-412x915-03.png',
  ]);
  for (const s of r.shots) assert.ok(existsSync(s));
  // The same fixed element in three frames is one finding per theme.
  assert.equal(r.runtime.contrast.length, 2);
  assert.match(r.runtime.contrast[0].where, /^light frame 1\/3: SemanticsNode#7\(/);
  assert.match(r.runtime.contrast[0].detail, /Expected contrast ratio/);
  assert.deepEqual(r.runtime.targets, []);
  const capture = JSON.parse(readFileSync(r.capture, 'utf8'));
  assert.equal(capture.platform, 'flutter');
  assert.equal(capture.shots[0], 'light-412x915-01.png');
  assert.deepEqual(snapshot(dir), before);
});

test('Flutter 3.50 and flutter/material.dart: the report names the migration, nothing changes', { timeout: 120_000 }, async () => {
  const dir = project();
  const before = snapshot(dir);
  const r = await screenshot({ projectDir: dir, platform: 'flutter', env: fakeFlutter({ version: '3.50.0', contrast: false }) });
  assert.ok(r.warnings.some((w) => w.includes('dart fix --apply --code=migrate_design_widgets')));
  assert.ok(r.warnings.some((w) => w.includes(MIGRATE_COMMAND)));
  assert.deepEqual(r.runtime.contrast, []);
  assert.deepEqual(snapshot(dir), before);
});

test('no migration hint on material_ui, or on a Flutter older than 3.50', () => {
  assert.equal(legacyImportWarning(project({ material: 'package:material_ui/material_ui.dart' }), '3.50.0'), null);
  assert.equal(legacyImportWarning(project(), '3.49.2'), null);
  assert.equal(legacyImportWarning(project(), null), null);
  assert.match(legacyImportWarning(project(), '3.51.1'), /migrate_design_widgets/);
});

test('an output folder inside the project is refused for flutter too', async () => {
  const dir = project();
  await assert.rejects(screenshot({ projectDir: dir, platform: 'flutter', out: join(dir, 'shots') }), /outside the project/);
});

test('guideline blocks become { where, detail }', () => {
  const r = 'SemanticsNode#3(Rect.fromLTRB(0, 0, 20, 20), label: "x"): Tap target too small.\nSee also: https://x\nSemanticsNode#4(r): Another.\nSee also: https://x';
  const out = parseGuidelineFailures(r, 'dark frame 2/3');
  assert.equal(out.length, 2);
  assert.equal(out[0].where, 'dark frame 2/3: SemanticsNode#3(Rect.fromLTRB(0, 0, 20, 20), label: "x")');
  assert.equal(out[0].detail, 'Tap target too small.');
});

test('the shipped scaffold has a pubspec on material_ui, lib/ and test/', () => {
  const dir = join(here, '..', '..', '..', 'assets', 'flutter', 'scaffold');
  assert.match(readFileSync(join(dir, 'pubspec.yaml'), 'utf8'), /^\s+material_ui:/m);
  for (const f of ['lib/main.dart', 'test/widget_test.dart']) assert.ok(statSync(join(dir, f)).isFile());
  assert.match(readFileSync(join(dir, 'lib', 'main.dart'), 'utf8'), /package:material_ui\/material_ui\.dart/);
});
