// Re-runs the spec §10 gate: Roboto Flex wght/opsz and Material Symbols FILL/wght must render under
// flutter_tester. harness/flutter/smoke/test/axes_smoke_test.dart fails on any pixel-identical pair;
// this wrapper runs it with the toolchain and checks the pixel diffs it wrote.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFileSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { withToolchain } from '../../../evals/tools/toolchain-env.mjs';
import { FONTS_MANIFEST, verifyFonts } from '../capture.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const repo = join(here, '..', '..', '..');
const skip = process.env.M3_TOOLCHAIN_TESTS !== '1' && 'needs the local toolchain (M3_TOOLCHAIN_TESTS=1)';

test('variable-font axes render under flutter_tester (smoke golden)', { skip, timeout: 600_000 }, () => {
  const outDir = join(repo, 'out', 'harness-flutter-smoke');
  rmSync(outDir, { recursive: true, force: true });
  const env = { ...withToolchain(process.env), M3_FONTS_DIR: verifyFonts(), M3_FONTS_MANIFEST: FONTS_MANIFEST, M3_SMOKE_OUT: outDir };
  const r = spawnSync('cmd.exe', ['/d', '/s', '/c', 'flutter test test/axes_smoke_test.dart --reporter expanded'], {
    cwd: join(here, '..', 'smoke'), env, encoding: 'utf8', windowsHide: true,
  });
  assert.equal(r.status, 0, `${r.stdout}\n${r.stderr}`);
  const result = JSON.parse(readFileSync(join(outDir, 'smoke-result.json'), 'utf8'));
  assert.deepEqual(Object.keys(result).sort(), ['flex-opsz-8-vs-144', 'flex-wght-300-vs-800', 'symbol-fill-0-vs-1', 'symbol-wght-200-vs-700']);
  for (const [pair, v] of Object.entries(result)) {
    assert.ok(v.diffPixels > 0, `${pair} is pixel-identical: the axis does not render`);
  }
});
