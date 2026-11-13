// Tests for the Compose capture harness (plan Task 8). Gradle runs are gated behind
// M3_TOOLCHAIN_TESTS=1; the manifest parsing tests run everywhere.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { appendFileSync, cpSync, existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { captureCompose, findLauncher } from '../capture.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const sample = join(here, 'sample_app');
const skip = process.env.M3_TOOLCHAIN_TESTS !== '1' && 'needs the local toolchain (M3_TOOLCHAIN_TESTS=1)';
const GRADLE_TIMEOUT = 45 * 60_000;
const SKIP_DIRS = new Set(['build', '.gradle', '.kotlin']);

// Copies the sample app to a fresh temp folder, leaving out build outputs.
function copySample() {
  const root = mkdtempSync(join(tmpdir(), 'm3-compose-'));
  const projectDir = join(root, 'app-under-test');
  cpSync(sample, projectDir, { recursive: true, filter: src => !SKIP_DIRS.has(basename(src)) });
  return { root, projectDir, outDir: join(root, 'out') };
}

test('findLauncher resolves the launcher activity from the app manifest', () => {
  assert.deepEqual(findLauncher(sample), { module: 'app', activity: 'dev.m3forge.sample.MainActivity' });
});

test('findLauncher returns null when there is no Android app module', () => {
  assert.equal(findLauncher(join(here, '..', 'src')), null);
});

test('captures light and dark with touch-target and contrast hits', { skip, timeout: GRADLE_TIMEOUT }, async () => {
  const { root, projectDir, outDir } = copySample();
  try {
    const cap = await captureCompose({ projectDir, outDir });
    assert.equal(cap.buildOk, true, cap.reason);
    assert.equal(cap.platform, 'compose');
    assert.deepEqual(cap.shots.map(s => [s.theme, s.viewport]).sort(), [['dark', '412x915'], ['light', '412x915']]);
    for (const s of cap.shots) {
      assert.ok(existsSync(join(outDir, s.file)), `missing ${s.file}`);
      assert.deepEqual([...readFileSync(join(outDir, s.file)).subarray(0, 4)], [0x89, 0x50, 0x4e, 0x47]);
    }
    assert.ok(cap.runtime.targets.length >= 1, 'expected a touch-target hit');
    assert.ok(cap.runtime.targets.some(t => /Small target/.test(t.where)), JSON.stringify(cap.runtime.targets));
    assert.ok(!cap.runtime.targets.some(t => /Disabled small target/.test(t.where)), 'disabled node must be excluded');
    assert.ok(cap.runtime.contrast.length >= 1, 'expected a contrast hit');
    assert.ok(cap.raw.atf.light.length > 0 && cap.raw.atf.dark.length > 0, 'raw ATF results per theme');
    assert.deepEqual(JSON.parse(readFileSync(join(outDir, 'capture.json'), 'utf8')), JSON.parse(JSON.stringify(cap)));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('a Kotlin compile error gives buildOk false with the log tail', { skip, timeout: GRADLE_TIMEOUT }, async () => {
  const { root, projectDir, outDir } = copySample();
  try {
    appendFileSync(join(projectDir, 'app/src/main/kotlin/dev/m3forge/sample/MainActivity.kt'), '\nval broken: Int = "not an int"\n');
    const cap = await captureCompose({ projectDir, outDir });
    assert.equal(cap.buildOk, false);
    assert.deepEqual(cap.shots, []);
    assert.ok(cap.reason && cap.reason.split('\n').length <= 40, 'reason is the last 40 lines at most');
    assert.match(cap.reason, /FAILED|error/i);
    assert.ok(existsSync(join(outDir, 'capture.json')));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
