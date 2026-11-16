import { test } from 'node:test';
import assert from 'node:assert/strict';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync } from 'node:fs';
import { withToolchain, toolchainRoot } from '../toolchain-env.mjs';

const repo = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const norm = p => p.replace(/[\\/]+/g, '/').toLowerCase();

// Found in the pilot: the Flutter shim lived in the repo, so `where flutter` showed a run the repo path.
test('withToolchain: no PATH entry points into the repository; shims come from the toolchain folder', () => {
  const env = withToolchain({ PATH: 'C:\\Windows', USERPROFILE: process.env.USERPROFILE ?? 'C:\\Users\\x' });
  const entries = env.PATH.split(';');
  assert.ok(entries.every(e => !norm(e).startsWith(norm(repo))), entries.join('\n'));
  assert.equal(norm(entries[0]), norm(join(toolchainRoot(env), 'shims')));
});

test('withToolchain: the shim copy exists in the toolchain folder (Windows)', { skip: process.platform !== 'win32' }, () => {
  const env = withToolchain({ PATH: '', USERPROFILE: process.env.USERPROFILE });
  assert.ok(existsSync(join(toolchainRoot(env), 'shims', 'flutter.cmd')));
});
