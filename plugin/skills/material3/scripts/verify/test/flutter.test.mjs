import test from 'node:test';
import assert from 'node:assert/strict';
import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { verify } from '../index.mjs';
import { STATIC_CHECKS, checkSuite, countNonBlank, nonZero, run, sample } from './helpers.mjs';

checkSuite('flutter', STATIC_CHECKS);

test('flutter theme: theme files by name and by content are allowlisted', async () => {
  const r = await run('flutter', 'theme');
  assert.deepEqual(r.violations, []);
  assert.equal(r.exitCode, 0);
  const byFile = Object.fromEntries(r.allowlisted.map(a => [a.file, a]));
  assert.deepEqual(Object.keys(byFile).sort(), ['lib/schemes.dart', 'lib/theme/app_theme.dart']);
  assert.match(byFile['lib/theme/app_theme.dart'].reason, /name/);
  assert.match(byFile['lib/schemes.dart'].reason, /top-level/);
  assert.ok(byFile['lib/theme/app_theme.dart'].suppressed['hardcoded-color'] > 0);
  assert.ok(byFile['lib/theme/app_theme.dart'].suppressed['off-token-type'] > 0);
  assert.ok(byFile['lib/schemes.dart'].suppressed['hardcoded-color'] > 0);
  // Only main.dart counts as UI source.
  const main = await readFile(join(sample('flutter', 'theme'), 'lib', 'main.dart'), 'utf8');
  assert.equal(r.uiLines, countNonBlank(main));
  assert.ok(r.themeLines > 0);
});

test('flutter: only lib/**/*.dart is scanned, generated files are skipped', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'm3-verify-flutter-'));
  try {
    await cp(sample('flutter', 'hardcoded-color-clean'), dir, { recursive: true });
    const dirty = "import 'package:flutter/material.dart';\nconst c = Color(0xFFFF0000);\n";
    await mkdir(join(dir, 'lib', 'generated'), { recursive: true });
    await writeFile(join(dir, 'lib', 'generated', 'l10n.dart'), dirty);
    await writeFile(join(dir, 'lib', 'model.freezed.dart'), dirty);
    await writeFile(join(dir, 'lib', 'generated_plugin_registrant.dart'), dirty);
    for (const sub of ['test', '.dart_tool/x', 'build/x']) {
      await mkdir(join(dir, sub), { recursive: true });
      await writeFile(join(dir, sub, 'x.dart'), dirty);
    }
    const r = await verify({ projectDir: dir, platform: 'flutter' });
    assert.deepEqual(nonZero(r.counts), {});
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
