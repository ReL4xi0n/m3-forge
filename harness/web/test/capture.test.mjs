import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, existsSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { captureWeb } from '../capture.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const skip = process.env.M3_TOOLCHAIN_TESTS !== '1' && 'needs the local toolchain (M3_TOOLCHAIN_TESTS=1)';

function tempOut() { return mkdtempSync(join(tmpdir(), 'm3-harness-web-')); }

test('web-empty sample: 4 shots, a contrast hit and a target hit', { skip, timeout: 180_000 }, async () => {
  const outDir = tempOut();
  try {
    const cap = await captureWeb({ projectDir: join(here, 'sample'), kind: 'web-empty', outDir });
    assert.equal(cap.platform, 'web');
    assert.equal(cap.buildOk, true, cap.reason);
    assert.equal(cap.shots.length, 4);
    const combos = cap.shots.map(s => `${s.theme}-${s.viewport}`).sort();
    assert.deepEqual(combos, ['dark-1440x900', 'dark-412x915', 'light-1440x900', 'light-412x915']);
    for (const s of cap.shots) {
      const png = readFileSync(join(outDir, s.file));
      assert.equal(png.subarray(1, 4).toString('latin1'), 'PNG', `${s.file} is a PNG`);
      assert.equal(s.file, `${s.theme}-${s.viewport}.png`);
    }

    const contrast = cap.runtime.contrast.find(c => c.where.includes('#faint-label'));
    assert.ok(contrast, `contrast hit on #faint-label, got ${JSON.stringify(cap.runtime.contrast)}`);
    // Deduplicated by selector across the 4 captures, with every capture named in `where`.
    assert.equal(cap.runtime.contrast.filter(c => c.selector === '#faint-label').length, 1);
    for (const w of ['light-412x915', 'dark-412x915', 'light-1440x900', 'dark-1440x900']) assert.ok(contrast.where.includes(w), w);

    const tiny = cap.runtime.targets.find(t => t.where.includes('#tiny-button'));
    assert.ok(tiny, `target hit on #tiny-button, got ${JSON.stringify(cap.runtime.targets)}`);
    assert.match(tiny.detail, /24x24/);

    // Exclusions: disabled elements, inline links in a paragraph, and big-enough targets.
    const all = [...cap.runtime.contrast, ...cap.runtime.targets].map(x => x.where).join('\n');
    assert.doesNotMatch(all, /#off-button/);
    assert.doesNotMatch(all, /#inline-link/);
    assert.doesNotMatch(all, /#big-button/);

    assert.ok(cap.raw.axe && Object.keys(cap.raw.axe).length === 4, 'raw axe summaries for 4 captures');
    assert.ok(existsSync(join(outDir, 'capture.json')));
    assert.deepEqual(JSON.parse(readFileSync(join(outDir, 'capture.json'), 'utf8')), JSON.parse(JSON.stringify(cap)));
  } finally { rmSync(outDir, { recursive: true, force: true }); }
});

test('broken React-like project: buildOk false with the build output as reason', { skip, timeout: 180_000 }, async () => {
  const outDir = tempOut();
  try {
    const cap = await captureWeb({ projectDir: join(here, 'broken-react'), kind: 'web-react', outDir });
    assert.equal(cap.platform, 'web');
    assert.equal(cap.buildOk, false);
    assert.match(cap.reason, /planted build failure/);
    assert.deepEqual(cap.shots, []);
    assert.ok(existsSync(join(outDir, 'capture.json')));
  } finally { rmSync(outDir, { recursive: true, force: true }); }
});

test('unknown kind is rejected', async () => {
  await assert.rejects(captureWeb({ projectDir: here, kind: 'web-svelte', outDir: join(here, 'never-created') }), /kind/);
});
