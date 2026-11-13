import test from 'node:test';
import assert from 'node:assert/strict';
import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { verify } from '../index.mjs';
import { STATIC_CHECKS, checkSuite, countNonBlank, nonZero, run, sample } from './helpers.mjs';

checkSuite('compose', STATIC_CHECKS);

test('compose theme: ui/theme/ and Color/Theme/Type/Shape.kt are allowlisted', async () => {
  const r = await run('compose', 'theme');
  assert.deepEqual(r.violations, []);
  assert.equal(r.exitCode, 0);
  const files = r.allowlisted.map(a => a.file).sort();
  assert.deepEqual(files, [
    'app/src/main/java/com/example/app/ui/theme/Color.kt',
    'app/src/main/java/com/example/app/ui/theme/Elevation.kt',
    'app/src/main/java/com/example/app/ui/theme/Type.kt',
    'core/src/main/kotlin/com/example/core/Theme.kt',
  ]);
  for (const a of r.allowlisted) {
    assert.ok(a.reason.length > 0);
    assert.ok(Object.values(a.suppressed).reduce((s, n) => s + n, 0) > 0);
  }
  const screen = await readFile(
    join(sample('compose', 'theme'), 'app/src/main/java/com/example/app/Screen.kt'),
    'utf8',
  );
  assert.equal(r.uiLines, countNonBlank(screen));
});

test('compose: only src/main/**/*.kt is scanned, build and .gradle are skipped', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'm3-verify-compose-'));
  try {
    await cp(sample('compose', 'hardcoded-color-clean'), dir, { recursive: true });
    const dirty = 'package x\nval c = Color(0xFFFF0000)\n';
    for (const sub of ['app/build/generated/src/main/x', '.gradle/src/main', 'app/src/androidTest/java']) {
      await mkdir(join(dir, sub), { recursive: true });
      await writeFile(join(dir, sub, 'X.kt'), dirty);
    }
    const r = await verify({ projectDir: dir, platform: 'compose' });
    assert.deepEqual(nonZero(r.counts), {});
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
