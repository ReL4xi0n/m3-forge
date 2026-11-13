import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { createHash } from 'node:crypto';
import { mkdtemp, mkdir, cp, writeFile, readFile, stat } from 'node:fs/promises';
import { execFileSync, spawnSync } from 'node:child_process';
import { loadCorpus, loadPrivateHashes } from '../lib.mjs';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const NOREPLY = '1+tester@users.noreply.github.com';

async function tempDir(prefix) {
  const parent = join(tmpdir(), 'guard test repo');
  await mkdir(parent, { recursive: true });
  return mkdtemp(join(parent, prefix));
}

test('corpus cache written by the pre-version algorithm is not reused', async () => {
  const dir = await tempDir('c-');
  const raw = join(dir, 'raw');
  await mkdir(raw, { recursive: true });
  await writeFile(join(raw, 'p.txt'), 'one two three four five six seven eight nine ten eleven twelve thirteen');
  const st = await stat(join(raw, 'p.txt'));
  const oldFingerprint = createHash('sha256').update(`p.txt|${st.size}|${st.mtimeMs}`).digest('hex');
  const cacheFile = join(dir, 'cache', 'corpus.json');
  await mkdir(dirname(cacheFile), { recursive: true });
  await writeFile(cacheFile, JSON.stringify({ fingerprint: oldFingerprint, shingles: ['deadbeefdeadbeef'] }));
  const { corpus, fromCache } = await loadCorpus(raw, cacheFile);
  assert.equal(fromCache, false);
  assert.ok(!corpus.has('deadbeefdeadbeef'));
});

test('private hashes are cached, rebuilt when a private file changes, and skip empty files and .git', async () => {
  const dir = await tempDir('p-');
  const priv = join(dir, 'private');
  await mkdir(join(priv, 'shots'), { recursive: true });
  await mkdir(join(priv, '.git'), { recursive: true });
  await writeFile(join(priv, 'shots', 'a.png'), Buffer.from([1, 2, 3]));
  await writeFile(join(priv, 'raw.gitkeep'), '');
  await writeFile(join(priv, '.git', 'HEAD'), 'ref: refs/heads/main\n');
  const cacheFile = join(priv, '.guard-cache', 'hashes.json');
  const sha = b => createHash('sha256').update(b).digest('hex');

  const first = await loadPrivateHashes(priv, cacheFile);
  assert.deepEqual([...first], [sha(Buffer.from([1, 2, 3]))]);

  const cached = JSON.parse(await readFile(cacheFile, 'utf8'));
  cached.hashes.push('f'.repeat(64));
  await writeFile(cacheFile, JSON.stringify(cached));
  assert.ok((await loadPrivateHashes(priv, cacheFile)).has('f'.repeat(64)), 'second call uses the cache');

  await writeFile(join(priv, 'shots', 'a.png'), Buffer.from([1, 2, 3, 4]));
  const rebuilt = await loadPrivateHashes(priv, cacheFile);
  assert.ok(!rebuilt.has('f'.repeat(64)), 'cache rebuilt after a change');
  assert.ok(rebuilt.has(sha(Buffer.from([1, 2, 3, 4]))));
  assert.equal(await loadPrivateHashes(join(dir, 'missing'), cacheFile), null);
});

test('private-copy: a committed file identical to a private file is flagged, empty files are not', async () => {
  const dir = await tempDir('r-');
  const git = (...a) => execFileSync('git', a, { cwd: dir, stdio: 'pipe', encoding: 'utf8' });
  git('init', '-q', '-b', 'main');
  git('config', 'user.email', NOREPLY);
  git('config', 'user.name', 'guard test');
  await mkdir(join(dir, 'tools'), { recursive: true });
  await cp(join(repoRoot, 'tools', 'guard'), join(dir, 'tools', 'guard'), { recursive: true });
  await writeFile(join(dir, '.gitignore'), 'private/\ntools/\n');
  const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0, 1, 2, 3]);
  await mkdir(join(dir, 'private', 'reference-screenshots'), { recursive: true });
  await writeFile(join(dir, 'private', 'reference-screenshots', 'x.png'), png);
  await writeFile(join(dir, 'private', 'reference-screenshots', '.gitkeep'), '');
  await mkdir(join(dir, 'docs', 'images'), { recursive: true });
  await writeFile(join(dir, 'docs', 'images', 'x.png'), png);
  await writeFile(join(dir, 'docs', 'images', '.gitkeep'), '');
  git('add', 'docs');
  const env = { ...process.env };
  for (const k of ['GUARD_FORBIDDEN_TERMS', 'GUARD_REQUIRE_TERMS', 'GUARD_REQUIRE_CORPUS']) delete env[k];
  const r = spawnSync(process.execPath, ['tools/guard/check-public-diff.mjs', '--staged'], { cwd: dir, env, encoding: 'utf8' });
  const out = (r.stdout || '') + (r.stderr || '');
  assert.equal(r.status, 1, out);
  assert.match(out, /private-copy\s+docs\/images\/x\.png\s.*\(not allowlistable\)/);
  assert.doesNotMatch(out, /private-copy\s+docs\/images\/\.gitkeep/);
});
