// Unscored checks (placeholder-content, brand, unknown-icon, asset-unused, icon-button-label) and the
// exact-copy rule for theme assets.
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';

import { verify } from '../index.mjs';
import { brandInFileName } from '../content.mjs';
import { installAssets } from '../../install-assets/index.mjs';
import { nonZero, unscoredSuite } from './helpers.mjs';

unscoredSuite('web', ['placeholder-content', 'brand', 'unknown-icon', 'asset-unused', 'icon-button-label']);
unscoredSuite('flutter', ['placeholder-content', 'brand', 'unknown-icon', 'asset-unused', 'icon-button-label']);
unscoredSuite('compose', ['placeholder-content', 'brand', 'asset-unused', 'icon-button-label']);

function project(files = {}) {
  const dir = mkdtempSync(join(tmpdir(), 'm3 verify unscored '));
  for (const [rel, text] of Object.entries(files)) put(dir, rel, text);
  return dir;
}
function put(dir, rel, text) {
  mkdirSync(dirname(join(dir, rel)), { recursive: true });
  writeFileSync(join(dir, rel), text);
}
const unused = r => r.violations.filter(v => v.check === 'asset-unused').map(v => v.file).sort();

test('brand in file names: multi-word brands match as parts or joined; common words and Android do not', () => {
  assert.equal(brandInFileName('GooglePay.png'), 'Google Pay');
  assert.equal(brandInFileName('google_pay_button.svg'), 'Google Pay');
  assert.equal(brandInFileName('ic_youtube.xml'), 'YouTube');
  assert.equal(brandInFileName('google-logo.svg'), 'Google');
  assert.equal(brandInFileName('android.png'), null);
  assert.equal(brandInFileName('pixel_grid.png'), null);
  assert.equal(brandInFileName('chrome_frame.png'), null);
  assert.equal(brandInFileName('googly_eyes.png'), null);
  assert.equal(brandInFileName('gemini_sign.png'), null);
  assert.equal(brandInFileName('maps_pin.png'), null);
  assert.equal(brandInFileName('google_pixel_case.png'), 'Google Pixel');
});

test('asset-unused (web): links and imports in every usual form count; a reference from an unused asset does not', async () => {
  const css = name => `/* material3 skill asset: assets/web/components/${name}.css */\n.m3-${name} { padding: var(--md-sys-space-100); }\n`;
  const js = name => `// material3 skill asset: assets/web/${name}.js\nexport const ${name} = 1;\n`;
  const dir = project({
    'src/index.html': '<!doctype html>\n<html lang="en"><head><title>Shelf</title><link rel=stylesheet href=styles/chip.css></head><body><p>Shelf</p></body></html>\n',
    'src/main.js': "import { behaviors } from './m3/behaviors';\nexport const x = behaviors;\n",
    'src/app.scss': "@use 'styles/card';\n@use \"styles/list\" as list;\n",
    'src/styles/chip.css': css('chip'),
    'src/styles/card.css': css('card'),
    'src/styles/list.scss': css('list'),
    'src/m3/behaviors.js': js('behaviors'),
    // Linked only from an asset that nothing uses: both unused.
    'src/styles/menu.css': `${css('menu')}@import 'tooltip.css';\n`,
    'src/styles/tooltip.css': css('tooltip'),
  });
  try {
    const r = await verify({ projectDir: dir, platform: 'web' });
    assert.deepEqual(unused(r), ['src/styles/menu.css', 'src/styles/tooltip.css']);
    // Once menu.css is linked, tooltip.css is used through it.
    put(dir, 'src/main.js', "import './styles/menu.css';\nimport { behaviors } from './m3/behaviors';\nexport const x = behaviors;\n");
    const s = await verify({ projectDir: dir, platform: 'web' });
    assert.deepEqual(unused(s), []);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

// Image files are written at test time (the repository keeps no image files outside its asset folders).
test('brand in image file names: web and flutter projects', async () => {
  const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"></svg>\n';
  const cases = [
    ['web', { 'index.html': '<!doctype html>\n<html lang="en"><head><title>Shelf</title></head><body><p>Shelf</p></body></html>\n' }],
    ['flutter', { 'lib/main.dart': "const title = 'Shelf';\n" }],
  ];
  for (const [platform, files] of cases) {
    const dir = project({
      ...files,
      'assets/images/google-logo.svg': svg,
      'assets/images/YouTubeBadge.png': 'x',
      'assets/images/leaf.svg': svg,
      'assets/images/android.png': 'x',
      'assets/images/pixel_grid.png': 'x',
    });
    try {
      const r = await verify({ projectDir: dir, platform });
      assert.deepEqual(r.violations.map(v => `${v.check} ${v.file}:${v.line}`).sort(), [
        'brand assets/images/YouTubeBadge.png:1',
        'brand assets/images/google-logo.svg:1',
      ], platform);
      assert.deepEqual(nonZero(r.counts), {});
    } finally { rmSync(dir, { recursive: true, force: true }); }
  }
});

test('flutter: exact theme assets (material_ui rewrite) are theme files; a marker on other content is not', async () => {
  const dir = project({ 'pubspec.yaml': 'name: app\ndependencies:\n  material_ui: any\n' });
  try {
    const res = installAssets({ projectDir: dir, platform: 'flutter', parts: ['tokens'], flutterLibrary: 'material_ui' });
    assert.equal(res.copied.length, 5);
    assert.ok(res.copied.some(f => readFileSync(join(dir, f), 'utf8').includes('package:material_ui/material_ui.dart')), 'the rewrite applied');
    put(dir, 'lib/main.dart', "import 'm3/tokens.dart';\n\nconst gap = M3Space.space200;\n");
    // Spoof: the shipped space.dart header (marker and "do not edit") over an off-grid literal.
    const header = readFileSync(join(dir, 'lib/m3/space.dart'), 'utf8').split('\n').slice(0, 3).join('\n');
    put(dir, 'lib/space.dart', `${header}\nimport 'package:flutter/widgets.dart';\n\nconst pad = EdgeInsets.all(6);\n`);
    const r = await verify({ projectDir: dir, platform: 'flutter' });
    const allowed = r.allowlisted.map(a => a.file).sort();
    assert.deepEqual(allowed, res.copied.slice().sort());
    assert.deepEqual(r.violations.filter(v => v.check === 'off-grid-spacing').map(v => `${v.file}:${v.line}`), ['lib/space.dart:6']);
    assert.equal(r.counts['off-grid-spacing'], 1);

    // One edited number in an installed copy: no longer the asset, scanned as UI code.
    const space = join(dir, 'lib/m3/space.dart');
    writeFileSync(space, readFileSync(space, 'utf8').replace('space50 = 4;', 'space50 = 6;'));
    const s = await verify({ projectDir: dir, platform: 'flutter' });
    assert.ok(!s.allowlisted.some(a => a.file === 'lib/m3/space.dart'));
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('compose: exact theme assets (package rewrite) are theme files; an edited copy is not', async () => {
  const dir = project({ 'app/build.gradle.kts': 'android { namespace = "com.example.shelf" }\n' });
  try {
    const res = installAssets({ projectDir: dir, platform: 'compose', parts: ['theme'] });
    assert.equal(res.copied.length, 5);
    assert.match(readFileSync(join(dir, res.copied[0]), 'utf8'), /^package com\.example\.shelf\.theme$/m);
    put(dir, 'app/src/main/java/com/example/shelf/Screen.kt', 'package com.example.shelf\n\nimport com.example.shelf.theme.M3Space\n\nval gap = M3Space.space200\n');
    const r = await verify({ projectDir: dir, platform: 'compose' });
    assert.deepEqual(r.allowlisted.map(a => a.file).sort(), res.copied.slice().sort());
    assert.deepEqual(r.violations, []);

    const space = join(dir, res.copied.find(f => f.endsWith('Space.kt')));
    writeFileSync(space, readFileSync(space, 'utf8').replace('space50: Dp = 4.dp', 'space50: Dp = 6.dp'));
    const s = await verify({ projectDir: dir, platform: 'compose' });
    assert.ok(!s.allowlisted.some(a => a.file.endsWith('Space.kt')));
    assert.ok(s.uiLines > r.uiLines, 'the edited copy counts as UI code');
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('asset-unused: the theme files are one set, used when any project file uses one of them', async () => {
  // Flutter: nothing imports the token files, then main.dart imports tokens.dart (which exports the rest).
  const fl = project({ 'pubspec.yaml': 'name: app\n', 'lib/main.dart': "import 'package:flutter/material.dart';\n\nconst title = 'Shelf';\n" });
  try {
    const res = installAssets({ projectDir: fl, platform: 'flutter', parts: ['tokens'] });
    let r = await verify({ projectDir: fl, platform: 'flutter' });
    assert.deepEqual(unused(r), res.copied.slice().sort());
    assert.ok(r.violations.every(v => v.severity === 'warning' && v.line === 1));
    assert.equal(r.exitCode, 0);
    assert.deepEqual(nonZero(r.counts), {});
    put(fl, 'lib/main.dart', "import 'package:flutter/material.dart';\nimport 'm3/tokens.dart';\n\nconst title = 'Shelf';\n");
    r = await verify({ projectDir: fl, platform: 'flutter' });
    assert.deepEqual(unused(r), []);
  } finally { rmSync(fl, { recursive: true, force: true }); }

  // Compose: a Kotlin file that names one theme declaration uses the set.
  const co = project({ 'app/src/main/java/com/example/app/Screen.kt': 'package com.example.app\n\nval title = "Shelf"\n' });
  try {
    const res = installAssets({ projectDir: co, platform: 'compose', parts: ['theme'], packageName: 'com.example.app' });
    let r = await verify({ projectDir: co, platform: 'compose' });
    assert.deepEqual(unused(r), res.copied.slice().sort());
    put(co, 'app/src/main/java/com/example/app/Screen.kt', 'package com.example.app\n\nimport com.example.app.theme.M3Motion\n\nval d = M3Motion.durationShort1\n');
    r = await verify({ projectDir: co, platform: 'compose' });
    assert.deepEqual(unused(r), []);
  } finally { rmSync(co, { recursive: true, force: true }); }

  // Web: tokens.css must be linked or imported; a mention in a comment does not count.
  const web = project({ 'index.html': '<!doctype html>\n<html lang="en"><head><title>Shelf</title><!-- assets/m3/tokens.css --></head><body><p>Shelf</p></body></html>\n' });
  try {
    installAssets({ projectDir: web, platform: 'web', parts: ['tokens'] });
    let r = await verify({ projectDir: web, platform: 'web' });
    assert.deepEqual(unused(r), ['assets/m3/tokens.css']);
    put(web, 'main.js', "import './assets/m3/tokens.css';\n");
    r = await verify({ projectDir: web, platform: 'web' });
    assert.deepEqual(unused(r), []);
  } finally { rmSync(web, { recursive: true, force: true }); }
});
