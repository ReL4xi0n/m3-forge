import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { installAssets } from '../index.mjs';
import { verify } from '../../verify/index.mjs';

const INDEX = fileURLToPath(new URL('../index.mjs', import.meta.url));

async function project(setup) {
  const dir = await mkdtemp(join(tmpdir(), 'm3 install proj '));
  if (setup) await setup(dir);
  return dir;
}

test('web: copies, then a second run reports only identical', async () => {
  const dir = await project((d) => mkdir(join(d, 'src')));
  try {
    const a = installAssets({ projectDir: dir, platform: 'web', parts: ['tokens', 'fonts'] });
    assert.ok(a.copied.includes('src/styles/m3/tokens.css'));
    assert.ok(a.copied.includes('src/styles/m3/fonts/MaterialSymbolsOutlined.woff2'));
    assert.ok(a.copied.includes('src/styles/m3/fonts/OFL-Roboto.txt'));
    assert.deepEqual(a.conflicts, []);
    const b = installAssets({ projectDir: dir, platform: 'web', parts: ['tokens', 'fonts'] });
    assert.deepEqual(b.copied, []);
    assert.deepEqual(b.conflicts, []);
    assert.equal(b.identical.length, a.copied.length);
  } finally { await rm(dir, { recursive: true, force: true }); }
});

test('web: assets/m3 when there is no src/', async () => {
  const dir = await project();
  try {
    const r = installAssets({ projectDir: dir, platform: 'web', parts: ['tokens'] });
    assert.deepEqual(r.copied, ['assets/m3/tokens.css']);
  } finally { await rm(dir, { recursive: true, force: true }); }
});

test('an edited destination file is a conflict; nothing is copied and the file is untouched', async () => {
  const dir = await project((d) => mkdir(join(d, 'lib/m3'), { recursive: true }));
  try {
    await writeFile(join(dir, 'lib/m3/space.dart'), '// mine\n');
    const r = installAssets({ projectDir: dir, platform: 'flutter', parts: ['tokens'] });
    assert.deepEqual(r.conflicts, ['lib/m3/space.dart']);
    assert.deepEqual(r.copied, []);
    assert.equal(await readFile(join(dir, 'lib/m3/space.dart'), 'utf8'), '// mine\n');
    assert.equal(existsSync(join(dir, 'lib/m3/type.dart')), false);
  } finally { await rm(dir, { recursive: true, force: true }); }
});

test('flutter: material_ui import rewrite, identical on rerun, pubspec snippet', async () => {
  const dir = await project((d) => writeFile(join(d, 'pubspec.yaml'), 'dependencies:\n  material_ui: ^1.11.0\n'));
  try {
    const a = installAssets({ projectDir: dir, platform: 'flutter', parts: ['tokens', 'fonts'] });
    const type = await readFile(join(dir, 'lib/m3/type.dart'), 'utf8');
    assert.match(type, /package:material_ui\/material_ui\.dart/);
    assert.doesNotMatch(type, /package:flutter\/material\.dart/);
    assert.match(type, /material3 skill asset: assets\/flutter\/lib\/m3\/type\.dart/);
    assert.match(a.pubspec, /asset: assets\/fonts\/RobotoFlex\.ttf/);
    const b = installAssets({ projectDir: dir, platform: 'flutter', parts: ['tokens', 'fonts'] });
    assert.deepEqual(b.copied, []);
    assert.deepEqual(b.conflicts, []);
  } finally { await rm(dir, { recursive: true, force: true }); }
});

test('flutter: theme.dart turns the material_ui lines into code only for material_ui', async () => {
  const a = await project((d) => writeFile(join(d, 'pubspec.yaml'), 'dependencies:\n  material_ui: ^1.11.0\n'));
  const b = await project();
  try {
    installAssets({ projectDir: a, platform: 'flutter', parts: ['tokens'] });
    installAssets({ projectDir: b, platform: 'flutter', parts: ['tokens'] });
    const ui = await readFile(join(a, 'lib/m3/theme.dart'), 'utf8');
    const plain = await readFile(join(b, 'lib/m3/theme.dart'), 'utf8');
    assert.match(ui, /^ +iconButtonTheme: IconButtonThemeData\(variant: expressive \? StyleVariant\.material3Expressive : StyleVariant\.material3\), \/\/ \[material_ui\]$/m);
    assert.doesNotMatch(ui, /^ *\/\/ \[material_ui\] /m);
    assert.match(plain, /^ +\/\/ \[material_ui\] iconButtonTheme: /m);
    assert.doesNotMatch(plain, /^ +iconButtonTheme:/m);
  } finally { await rm(a, { recursive: true, force: true }); await rm(b, { recursive: true, force: true }); }
});

test('flutter: plain material keeps the flutter import', async () => {
  const dir = await project();
  try {
    installAssets({ projectDir: dir, platform: 'flutter', parts: ['tokens'] });
    assert.match(await readFile(join(dir, 'lib/m3/type.dart'), 'utf8'), /package:flutter\/material\.dart/);
  } finally { await rm(dir, { recursive: true, force: true }); }
});

test('flutter: expressive parts install under lib/m3/expressive; the loading indicator needs material_ui (R24)', async () => {
  const dir = await project();
  try {
    const plain = installAssets({ projectDir: dir, platform: 'flutter', parts: ['tokens', 'loading-indicator'] });
    assert.ok(!plain.copied.some((f) => f.includes('loading_indicator')));
    assert.equal(plain.skipped.length, 1);
    assert.match(plain.skipped[0].reason, /material_ui/);
    const ui = installAssets({ projectDir: dir, platform: 'flutter', parts: ['loading-indicator'], flutterLibrary: 'material_ui' });
    assert.deepEqual(ui.copied, ['lib/m3/expressive/loading_indicator.dart']);
    assert.equal(ui.skipped, undefined);
    assert.match(await readFile(join(dir, 'lib/m3/expressive/loading_indicator.dart'), 'utf8'), /^\/\/ material3 skill asset: assets\/flutter\/lib\/m3\/expressive\/loading_indicator\.dart/);
  } finally { await rm(dir, { recursive: true, force: true }); }
});

test('flutter: expressive assets have no verify findings, and count as used once imported', async () => {
  const dir = await project();
  try {
    installAssets({ projectDir: dir, platform: 'flutter', parts: ['tokens', 'loading-indicator'], flutterLibrary: 'material_ui' });
    const unused = await verify({ projectDir: dir, platform: 'flutter' });
    assert.deepEqual(unused.violations.filter((v) => v.check !== 'asset-unused'), []);
    assert.ok(unused.violations.some((v) => v.check === 'asset-unused' && /loading_indicator/.test(v.file)));
    await writeFile(join(dir, 'lib/main.dart'), ["import 'm3/tokens.dart';", "import 'm3/expressive/loading_indicator.dart';", 'void main() {}', ''].join(String.fromCharCode(10)));
    const used = await verify({ projectDir: dir, platform: 'flutter' });
    assert.deepEqual(used.violations, []);
  } finally { await rm(dir, { recursive: true, force: true }); }
});

test('compose: package rewrite, theme dir, android font names', async () => {
  const dir = await project((d) => mkdir(join(d, 'app'), { recursive: true }));
  try {
    const a = installAssets({ projectDir: dir, platform: 'compose', parts: ['theme', 'fonts'], packageName: 'com.example.shop' });
    assert.ok(a.copied.includes('app/src/main/java/com/example/shop/theme/Type.kt'));
    assert.ok(a.copied.includes('app/src/main/res/font/roboto_flex.ttf'));
    assert.ok(a.copied.includes('app/src/main/res/raw/ofl_roboto.txt'));
    assert.ok(!a.copied.some(f => /material_symbols|license_material_design_icons/.test(f)), 'no Symbols font on Compose');
    const kt = await readFile(join(dir, 'app/src/main/java/com/example/shop/theme/Type.kt'), 'utf8');
    assert.match(kt, /^package com\.example\.shop\.theme$/m);
    assert.doesNotMatch(kt, /m3\.theme/);
    const b = installAssets({ projectDir: dir, platform: 'compose', parts: ['theme', 'fonts'], packageName: 'com.example.shop' });
    assert.deepEqual(b.copied, []);
    assert.equal(b.identical.length, a.copied.length);
  } finally { await rm(dir, { recursive: true, force: true }); }
});

test('compose: package comes from the gradle namespace', async () => {
  const dir = await project(async (d) => {
    await mkdir(join(d, 'app'), { recursive: true });
    await writeFile(join(d, 'app/build.gradle.kts'), 'android {\n    namespace = "org.demo.notes"\n}\n');
  });
  try {
    const r = installAssets({ projectDir: dir, platform: 'compose', parts: ['theme'] });
    assert.ok(r.copied.includes('app/src/main/java/org/demo/notes/theme/Tokens.kt'));
  } finally { await rm(dir, { recursive: true, force: true }); }
});

test('--dest overrides the main group', async () => {
  const dir = await project();
  try {
    const r = installAssets({ projectDir: dir, platform: 'web', parts: ['tokens'], dest: 'public/m3' });
    assert.deepEqual(r.copied, ['public/m3/tokens.css']);
  } finally { await rm(dir, { recursive: true, force: true }); }
});

test('CLI: path with spaces, exit codes', async () => {
  const dir = await project();
  try {
    const run = (...a) => spawnSync(process.execPath, [INDEX, dir, ...a], { encoding: 'utf8' });
    const first = run('--platform', 'web', '--parts', 'tokens');
    assert.equal(first.status, 0);
    assert.deepEqual(JSON.parse(first.stdout).copied, ['assets/m3/tokens.css']);
    assert.equal(JSON.parse(run('--platform', 'web', '--parts', 'tokens').stdout).identical.length, 1);
    await writeFile(join(dir, 'assets/m3/tokens.css'), '/* edited */');
    const clash = run('--platform', 'web', '--parts', 'tokens');
    assert.equal(clash.status, 3);
    assert.deepEqual(JSON.parse(clash.stdout).conflicts, ['assets/m3/tokens.css']);
    assert.equal(run('--platform', 'web', '--parts', 'nope').status, 2);
    assert.equal(run('--platform', 'compose', '--parts', 'theme').status, 2);
  } finally { await rm(dir, { recursive: true, force: true }); }
});
