import test from 'node:test';
import assert from 'node:assert/strict';
import { cpSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { verify } from '../index.mjs';
import { sample } from './helpers.mjs';

const VERIFY = fileURLToPath(new URL('../', import.meta.url));

test('verify still runs when the color script fails to load', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'm3 verify guard '));
  try {
    cpSync(VERIFY, join(dir, 'scripts', 'verify'), { recursive: true, filter: p => !p.includes(`${join('verify', 'test')}`) });
    mkdirSync(join(dir, 'scripts', 'color'), { recursive: true });
    writeFileSync(join(dir, 'scripts', 'color', 'index.mjs'), "throw new Error('vendored library missing');\n");
    const copy = await import(pathToFileURL(join(dir, 'scripts', 'verify', 'index.mjs')).href);
    for (const platform of ['web', 'flutter', 'compose']) {
      const project = sample(platform, 'hardcoded-color-hit');
      const broken = await copy.verify({ projectDir: project, platform });
      const ok = await verify({ projectDir: project, platform });
      assert.deepEqual(broken.counts, ok.counts, platform);
      assert.ok(broken.counts['hardcoded-color'] > 0, platform);
    }
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
