import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cpSync, existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { captureFlutter, parseGuidelineFailures } from '../capture.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const repo = join(here, '..', '..', '..');
const work = join(repo, 'out', 'harness-flutter-test');
const skip = process.env.M3_TOOLCHAIN_TESTS !== '1' && 'needs the local toolchain (M3_TOOLCHAIN_TESTS=1)';

// Works on a copy, so the checked-in sample never gains .dart_tool/, build/ or harness files.
function copySample(name) {
  const dir = join(work, name);
  rmSync(dir, { recursive: true, force: true });
  cpSync(join(here, 'sample_app'), dir, {
    recursive: true,
    filter: src => !/[\\/](\.dart_tool|build)([\\/]|$)/.test(src),
  });
  return dir;
}

const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

test('parseGuidelineFailures splits flutter_test guideline reasons into {where, detail}', () => {
  const reason = [
    'SemanticsNode#7(Rect.fromLTRB(10.0, 20.0, 42.0, 52.0), actions: [tap], label: "Go"): expected tap target size of at least Size(48.0, 48.0), but found Size(32.0, 32.0)',
    'See also: https://support.google.com/accessibility/android/answer/7101858?hl=en',
    'SemanticsNode#4(Rect.fromLTRB(0.0, 0.0, 80.0, 20.0), label: "Faint caption"):',
    'Expected contrast ratio of at least 4.5 but found 1.50 for a font size of 14.0.',
    'The computed colors was:',
    'light - Color(0xffffffff), dark - Color(0xffd0d0d0)',
    'See also: https://www.w3.org/TR/UNDERSTANDING-WCAG20/visual-audio-contrast-contrast.html',
  ].join('\n');
  const out = parseGuidelineFailures(reason, 'light');
  assert.equal(out.length, 2);
  assert.equal(out[0].where, 'light: SemanticsNode#7(Rect.fromLTRB(10.0, 20.0, 42.0, 52.0), actions: [tap], label: "Go")');
  assert.match(out[0].detail, /^expected tap target size of at least Size\(48\.0, 48\.0\), but found Size\(32\.0, 32\.0\)/);
  assert.match(out[1].where, /label: "Faint caption"\)$/);
  assert.match(out[1].detail, /^Expected contrast ratio of at least 4\.5 but found 1\.50/);
  assert.deepEqual(parseGuidelineFailures(null, 'dark'), []);
  assert.deepEqual(parseGuidelineFailures('', 'dark'), []);
});

test('captureFlutter: sample app gives 2 shots, a tap-target hit and a contrast hit', { skip, timeout: 900_000 }, async () => {
  const projectDir = copySample('sample_app');
  const outDir = join(work, 'shots-sample');
  rmSync(outDir, { recursive: true, force: true });

  const r = await captureFlutter({ projectDir, outDir });

  assert.equal(r.buildOk, true, r.reason);
  assert.equal(r.platform, 'flutter');
  assert.deepEqual(r.shots.map(s => [s.theme, s.viewport]), [['light', '412x915'], ['dark', '412x915']]);
  for (const s of r.shots) {
    assert.ok(existsSync(s.file), s.file);
    assert.ok(readFileSync(s.file).subarray(0, 8).equals(PNG), `${s.file} is a PNG`);
  }
  assert.ok(existsSync(join(outDir, 'light-412x915.png')));
  assert.ok(existsSync(join(outDir, 'dark-412x915.png')));

  // One 32x32 target per theme; the disabled 24x24 InkWell is excluded.
  assert.ok(r.runtime.targets.length >= 1, JSON.stringify(r.runtime));
  assert.equal(r.runtime.targets.filter(t => t.where.startsWith('light:')).length, 1, JSON.stringify(r.runtime.targets));
  assert.ok(r.runtime.targets.every(t => /Size\(32\.0, 32\.0\)/.test(t.detail)), JSON.stringify(r.runtime.targets));
  // The faint caption fails; the disabled TextButton's label is excluded.
  assert.ok(r.runtime.contrast.length >= 1, JSON.stringify(r.runtime));
  assert.ok(r.runtime.contrast.some(c => /Faint caption/.test(c.where)), JSON.stringify(r.runtime.contrast));
  assert.ok(!r.runtime.contrast.some(c => /Disabled action/.test(c.where)), JSON.stringify(r.runtime.contrast));

  assert.ok(r.raw.light && r.raw.dark, 'raw guideline output per theme');
  const written = JSON.parse(readFileSync(join(outDir, 'capture.json'), 'utf8'));
  assert.deepEqual(written, JSON.parse(JSON.stringify(r)));

  // The harness files are removed again; the project is left as it was.
  assert.ok(!existsSync(join(projectDir, 'test', 'm3_capture_test.dart')));
  assert.ok(!existsSync(join(projectDir, 'test', 'flutter_test_config.dart')));
});

test('captureFlutter: a syntax error gives buildOk false with the output tail', { skip, timeout: 900_000 }, async () => {
  const projectDir = copySample('broken_app');
  const main = join(projectDir, 'lib', 'main.dart');
  writeFileSync(main, readFileSync(main, 'utf8').replace('void main() => runApp(const SampleApp());', 'void main() => runApp(const SampleApp(;'));
  const outDir = join(work, 'shots-broken');
  rmSync(outDir, { recursive: true, force: true });

  const r = await captureFlutter({ projectDir, outDir });

  assert.equal(r.buildOk, false);
  assert.equal(r.platform, 'flutter');
  assert.deepEqual(r.shots, []);
  assert.ok(typeof r.reason === 'string' && r.reason.length > 0);
  assert.ok(r.reason.split('\n').length <= 40, 'reason is at most 40 lines');
  assert.match(r.reason, /main\.dart/);
  assert.ok(existsSync(join(outDir, 'capture.json')));
});
