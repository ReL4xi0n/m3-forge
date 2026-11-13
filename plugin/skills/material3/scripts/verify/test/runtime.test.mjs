import test from 'node:test';
import assert from 'node:assert/strict';

import { CHECKS, verify } from '../index.mjs';
import { nonZero, run, sample } from './helpers.mjs';

const runtime = {
  contrast: [{ where: 'button.primary', detail: 'contrast 2.1:1, needs 4.5:1' }],
  targets: [{ where: 'a.chip', detail: '40x32 CSS px, needs 48x48' }],
};

for (const platform of ['web', 'flutter', 'compose']) {
  test(`${platform}: one contrast and one target entry give 2 violations`, async () => {
    const r = await run(platform, 'off-token-type-clean', runtime);
    assert.equal(r.violations.length, 2);
    assert.deepEqual(nonZero(r.counts), { contrast: 1, 'touch-target': 1 });
    for (const v of r.violations) {
      assert.equal(v.severity, 'error');
      assert.equal(v.file, null);
      assert.equal(v.line, null);
      assert.ok(v.detail.includes(v.check === 'contrast' ? 'button.primary' : 'a.chip'));
    }
    assert.equal(r.exitCode, 1);
  });
}

test('counts list every check, with zero for checks that did not fire', async () => {
  const r = await run('web', 'off-token-type-clean');
  assert.deepEqual(Object.keys(r.counts).sort(), [...CHECKS].sort());
  assert.equal(r.runtimeChecked, false);
  const withRuntime = await run('web', 'off-token-type-clean', { contrast: [], targets: [] });
  assert.equal(withRuntime.runtimeChecked, true);
  assert.equal(withRuntime.exitCode, 0);
});

test('an unknown platform is rejected', async () => {
  await assert.rejects(verify({ projectDir: sample('web', 'theme'), platform: 'ios' }), /platform/);
});
