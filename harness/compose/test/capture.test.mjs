// Tests for the Compose capture harness (plan Task 8). Gradle runs are gated behind
// M3_TOOLCHAIN_TESTS=1; the manifest parsing tests run everywhere.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { appendFileSync, cpSync, existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
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
    // harness v3: the official 40 dp button and 32 dp chip pad out to 48 dp (minimumInteractiveComponentSize)
    assert.ok(!cap.runtime.targets.some(t => /Official/.test(t.where)), JSON.stringify(cap.runtime.targets));
    assert.equal(cap.harness, 'v3');
    assert.ok(cap.runtime.contrast.length >= 1, 'expected a contrast hit');
    assert.ok(cap.raw.atf.light.length > 0 && cap.raw.atf.dark.length > 0, 'raw ATF results per theme');
    // The label of a disabled Button: ATF reports its Text child (itself enabled); the harness drops it
    // because an ancestor is disabled (hold-out, 2026-11-26).
    assert.ok(!cap.runtime.contrast.some(c => /Disabled button/.test(c.where)), JSON.stringify(cap.runtime.contrast));
    const label = [...cap.raw.atf.light, ...cap.raw.atf.dark].find(r => r.element?.text === 'Disabled button');
    if (label) assert.deepEqual([label.element.selfEnabled, label.element.enabled], [true, false]);
    assert.deepEqual(JSON.parse(readFileSync(join(outDir, 'capture.json'), 'utf8')), JSON.parse(JSON.stringify(cap)));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('harness v2 (layout size) still reports the official button and chip', { skip, timeout: GRADLE_TIMEOUT }, async () => {
  const { root, projectDir, outDir } = copySample();
  try {
    const cap = await captureCompose({ projectDir, outDir, version: 'v2' });
    assert.equal(cap.buildOk, true, cap.reason);
    assert.equal(cap.harness, 'v2');
    for (const name of ['Official button', 'Official chip', 'Small target']) {
      assert.ok(cap.runtime.targets.some(t => t.where.includes(name)), `${name}: ${JSON.stringify(cap.runtime.targets)}`);
    }
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('an unknown harness version is refused', async () => {
  await assert.rejects(() => captureCompose({ projectDir: sample, outDir: tmpdir(), version: 'v9' }), /unknown harness version/);
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

// Found in the baseline (landing and onboarding): with an endless animation, ActivityScenario.launch's
// idle() ran frames until the Recomposer failed, 20-25 minutes later. The harness now captures with
// reduced motion (animator duration scale 0), so such an app settles at once.
test('an app with an endless animation is captured in both themes within minutes', { skip, timeout: GRADLE_TIMEOUT }, async () => {
  const { root, projectDir, outDir } = copySample();
  try {
    const main = join(projectDir, 'app/src/main/kotlin/dev/m3forge/sample/MainActivity.kt');
    writeFileSync(join(dirname(main), 'Spin.kt'), [
      'package dev.m3forge.sample',
      'import androidx.compose.animation.core.LinearEasing',
      'import androidx.compose.animation.core.animateFloat',
      'import androidx.compose.animation.core.infiniteRepeatable',
      'import androidx.compose.animation.core.rememberInfiniteTransition',
      'import androidx.compose.animation.core.tween',
      'import androidx.compose.foundation.layout.Box',
      'import androidx.compose.foundation.layout.size',
      'import androidx.compose.runtime.Composable',
      'import androidx.compose.runtime.getValue',
      'import androidx.compose.ui.Modifier',
      'import androidx.compose.ui.draw.rotate',
      'import androidx.compose.ui.unit.dp',
      '@Composable',
      'fun M3Spin() {',
      '    val t = rememberInfiniteTransition(label = "spin")',
      '    val r by t.animateFloat(0f, 360f, infiniteRepeatable(tween(2_000, easing = LinearEasing)), label = "r")',
      '    Box(Modifier.size(8.dp).rotate(r))',
      '}',
      '',
    ].join('\n'));
    writeFileSync(main, readFileSync(main, 'utf8').replace('setContent {', 'setContent {\n            M3Spin()'));
    const t0 = Date.now();
    const cap = await captureCompose({ projectDir, outDir, timeoutMs: 15 * 60_000 });
    assert.equal(cap.buildOk, true, cap.reason);
    assert.equal(cap.reason, undefined);
    assert.deepEqual(cap.shots.map(s => s.theme).sort(), ['dark', 'light']);
    assert.ok(Date.now() - t0 < 10 * 60_000, `took ${Math.round((Date.now() - t0) / 1000)} s`);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
