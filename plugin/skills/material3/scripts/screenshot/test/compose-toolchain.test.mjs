// Real Gradle toolchain (M3_TOOLCHAIN_TESTS=1, the local toolchain): a small Compose app (search field,
// long list, empty text, confirmation dialog, a 32 dp clickable, a disabled one) is rendered by the
// screenshot step in a path with spaces: 6 frames (3 per theme), runtime findings in the shape verify
// reads (disabled node out), the states (dialog after a click, empty text after enterText, a row far down
// after scrollTo; one broken state ok:false), the project byte for byte the same.
// Set M3_KEEP_SHOTS=<folder> to keep the PNGs for a look.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { cpSync, existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { screenshot } from '../index.mjs';
import { sampleApp, STATES } from './compose-app.mjs';

const skip = process.env.M3_TOOLCHAIN_TESTS !== '1' && 'needs the local toolchain (M3_TOOLCHAIN_TESTS=1)';

function snapshot(dir, out = {}, base = dir) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) snapshot(p, out, base);
    else out[p.slice(base.length)] = createHash('sha256').update(readFileSync(p)).digest('hex');
  }
  return out;
}

test('real Gradle: frames, ATF findings, states, project untouched', { skip, timeout: 40 * 60_000 }, async () => {
  // evals/tools is read only here: the toolchain environment of the local machine.
  const { withToolchain } = await import(pathToFileURL(fileURLToPath(new URL('../../../../../../evals/tools/toolchain-env.mjs', import.meta.url))).href);
  const dir = sampleApp();
  const before = snapshot(dir);
  const r = await screenshot({ projectDir: dir, platform: 'compose', env: withToolchain(process.env), states: STATES });
  assert.equal(r.ran, true, r.skippedReason);
  const names = r.shots.map((s) => s.split(/[\\/]/).pop());
  assert.deepEqual(names.filter((n) => n.startsWith('light')), ['light-412x915-01.png', 'light-412x915-02.png', 'light-412x915-03.png']);
  assert.equal(names.length, 6);
  for (const s of r.shots) assert.deepEqual([...readFileSync(s).subarray(0, 4)], [0x89, 0x50, 0x4e, 0x47], s);
  assert.ok(r.runtime.contrast.some((e) => /Faint caption/.test(e.where)), JSON.stringify(r.runtime.contrast));
  assert.ok(r.runtime.targets.some((e) => /Small target/.test(e.where)));
  assert.ok(!r.runtime.targets.some((e) => /Disabled small target/.test(e.where)), 'disabled node excluded');
  const byName = Object.fromEntries(r.states.map((s) => [s.name, s]));
  // sort-menu leaves a DropdownMenu frame loop behind: the regression for the 45 min hang
  for (const n of ['remove-dialog', 'empty-search', 'sort-menu', 'last-row']) {
    assert.equal(byName[n].ok, true, byName[n].error);
    assert.equal(byName[n].shots.length, 2);
  }
  assert.equal(byName.broken.ok, false);
  assert.ok(r.warnings.some((w) => /state "broken" failed/.test(w)));
  assert.deepEqual(snapshot(dir), before, 'the project is byte for byte the same');
  if (process.env.M3_KEEP_SHOTS) cpSync(r.out, process.env.M3_KEEP_SHOTS, { recursive: true });
  assert.ok(existsSync(r.capture));
});
