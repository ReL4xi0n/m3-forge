// The emitted Flutter and Compose color files compile (M3_TOOLCHAIN_TESTS=1, local toolchain).
//   Flutter: `flutter analyze` on a temp copy of evals/fixtures/flutter-material_ui, both imports.
//   Compose: `:app:compileDebugKotlin` on a temp copy of harness/compose/test/sample_app.
// The temp folders have no spaces: the space-in-path cases are covered by color.test.mjs.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cpSync, existsSync, mkdirSync, mkdtempSync, realpathSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { writeTheme } from '../index.mjs';

const REPO = fileURLToPath(new URL('../../../../../../', import.meta.url));
const skip = process.env.M3_TOOLCHAIN_TESTS !== '1' && 'needs the local toolchain (M3_TOOLCHAIN_TESTS=1)';
const custom = { brand: '#B5651D', success: '#2F6F5E' };

async function tools() {
  return import(pathToFileURL(join(REPO, 'evals/tools/prepare-fixture.mjs')).href);
}

test('Flutter: the color file analyzes clean with material_ui and with flutter/material', { skip, timeout: 15 * 60_000 }, async () => {
  const { prepareFixture, runTool } = await tools();
  const dir = realpathSync.native(mkdtempSync(join(tmpdir(), 'm3-color-flutter-')));
  try {
    const prep = await prepareFixture('flutter-material_ui', dir);
    assert.ok(prep.ok, prep.log);
    writeTheme({ platform: 'flutter', seed: '#3366CC', variant: 'tonalSpot', custom, flutterLibrary: 'material_ui', out: join(dir, 'lib/m3/schemes.dart') });
    writeTheme({ platform: 'flutter', seed: '#6750A4', variant: 'expressive', custom, flutterLibrary: 'material', out: join(dir, 'lib/m3/schemes_material.dart') });
    const r = await runTool('flutter', ['analyze', 'lib/m3/schemes.dart'], dir);
    assert.equal(r.code, 0, r.out);
    assert.match(r.out, /No issues found/);
    // This Flutter SDK marks package:flutter/material.dart deprecated in favour of material_ui; that
    // info on the import line is the only issue allowed for the flutter/material variant.
    const m = await runTool('flutter', ['analyze', '--no-fatal-infos', 'lib/m3/schemes_material.dart'], dir);
    assert.equal(m.code, 0, m.out);
    const issues = m.out.split(/\r?\n/).map(l => l.trim()).filter(l => / - .*:\d+:\d+ - /.test(l));
    assert.equal(issues.length, 1, m.out);
    assert.match(issues[0], /^info - 'package:flutter\/material\.dart' is deprecated.* - lib[\\/]m3[\\/]schemes_material\.dart:6:1 - deprecated_member_use$/);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('Compose: the color file compiles in the harness sample app', { skip, timeout: 30 * 60_000 }, async () => {
  const { GRADLE_FLAGS, runTool } = await tools();
  const dir = realpathSync.native(mkdtempSync(join(tmpdir(), 'm3-color-compose-')));
  try {
    const src = join(REPO, 'harness/compose/test/sample_app');
    cpSync(src, dir, { recursive: true, filter: p => !['build', '.gradle', '.kotlin'].includes(basename(p)) });
    const themeDir = join(dir, 'app/src/main/kotlin/dev/m3forge/sample/theme');
    mkdirSync(themeDir, { recursive: true });
    writeTheme({ platform: 'compose', seed: '#3366CC', variant: 'vibrant', custom, packageName: 'dev.m3forge.sample', out: join(themeDir, 'Color.kt') });
    const r = await runTool('./gradlew.bat', [...GRADLE_FLAGS, '--offline', ':app:compileDebugKotlin'], dir);
    assert.equal(r.code, 0, r.out.slice(-4000));
    const classes = join(dir, 'app/build/intermediates/built_in_kotlinc/debug/compileDebugKotlin/classes/dev/m3forge/sample/theme');
    for (const c of ['ColorKt.class', 'M3CustomColors.class']) assert.ok(existsSync(join(classes, c)), `${c} compiled`);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
