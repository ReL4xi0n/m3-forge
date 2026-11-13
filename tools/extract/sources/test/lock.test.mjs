import { test } from 'node:test';
import assert from 'node:assert/strict';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { pathToFileURL } from 'node:url';
import { mkdtemp, mkdir, writeFile, readFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { validateLock, verifySource, fetchSource, sha256File } from '../lock.mjs';

const C40 = 'a'.repeat(40);
const S64 = 'b'.repeat(64);
const validLock = () => ({
  schemaVersion: 1, resolvedOn: '2026-11-13', sources: [
    { id: 'material-web', type: 'git', repo: 'https://example.test/mw.git', ref: 'main', commit: C40, paths: ['tokens'], license: 'Apache-2.0' },
    { id: 'material-color-utilities', type: 'archive', version: '0.4.0', url: 'https://example.test/mcu.tgz', sha256: S64, license: 'Apache-2.0' },
    { id: 'material-components-android', type: 'git', repo: 'https://example.test/mdc.git', ref: '1.14.0', commit: C40, paths: ['lib'], license: 'Apache-2.0' },
    { id: 'material_ui', type: 'git', repo: 'https://example.test/p.git', ref: 'material_ui-v1.11.0', version: '1.11.0', commit: C40, paths: ['packages/material_ui'], license: 'BSD-3-Clause' },
    { id: 'compose-material3', type: 'archive', version: '1.5.0-rc01', url: 'https://example.test/m3.jar', sha256: S64, license: 'Apache-2.0' },
  ],
});

test('validateLock accepts a complete lock and rejects gaps', () => {
  assert.deepEqual(validateLock(validLock()), []);
  const noCommit = validLock(); delete noCommit.sources[0].commit;
  assert.match(validateLock(noCommit).join('\n'), /material-web: commit must be 40 hex/);
  const badCommit = validLock(); badCommit.sources[2].commit = 'abc';
  assert.match(validateLock(badCommit).join('\n'), /material-components-android: commit must be 40 hex/);
  const noSha = validLock(); delete noSha.sources[1].sha256;
  assert.match(validateLock(noSha).join('\n'), /material-color-utilities: sha256 must be 64 hex/);
  const compose = validLock(); compose.sources[4].version = '1.4.0';
  assert.match(validateLock(compose).join('\n'), /compose-material3: version must be 1\.5\.0-rc01/);
  const missing = validLock(); missing.sources.pop();
  assert.match(validateLock(missing).join('\n'), /missing source compose-material3/);
});

async function bareRepoWithTwoCommits() {
  const d = await mkdtemp(join(tmpdir(), 'lock test '));
  const work = join(d, 'work');
  await mkdir(join(work, 'tokens'), { recursive: true });
  const git = (...a) => execFileSync('git', a, { cwd: work, encoding: 'utf8', stdio: 'pipe' });
  git('init', '-q', '-b', 'main');
  git('config', 'user.email', '1+t@users.noreply.github.com');
  git('config', 'user.name', 't');
  await writeFile(join(work, 'tokens', 'a.scss'), 'one');
  await writeFile(join(work, 'other.txt'), 'x');
  git('add', '-A'); git('commit', '-q', '-m', 'one');
  const first = git('rev-parse', 'HEAD').trim();
  await writeFile(join(work, 'tokens', 'a.scss'), 'two');
  git('commit', '-q', '-am', 'two');
  return { d, url: pathToFileURL(work).href, first };
}

test('git source: fetched at the pinned commit (sparse), verify fails after HEAD moves', async () => {
  const { d, url, first } = await bareRepoWithTwoCommits();
  const entry = { id: 'material-web', type: 'git', repo: url, ref: 'main', commit: first, paths: ['tokens'] };
  const dir = join(d, 'src');
  await fetchSource(entry, dir);
  await verifySource(entry, dir);
  assert.equal(await readFile(join(dir, 'tokens', 'a.scss'), 'utf8'), 'one');
  execFileSync('git', ['fetch', '-q', 'origin', 'main'], { cwd: dir, stdio: 'pipe' });
  execFileSync('git', ['checkout', '-q', 'FETCH_HEAD'], { cwd: dir, stdio: 'pipe' });
  await assert.rejects(verifySource(entry, dir), /HEAD .* is not the pinned commit/);
});

test('archive source over file://: verified by sha256, tampering is refused', async () => {
  const d = await mkdtemp(join(tmpdir(), 'lock test '));
  await mkdir(join(d, 'pkg', 'package'), { recursive: true });
  await writeFile(join(d, 'pkg', 'package', 'index.js'), 'export const x = 1;\n');
  execFileSync('tar', ['-czf', 'pkg.tgz', '-C', 'pkg', 'package'], { cwd: d });
  const archive = join(d, 'pkg.tgz');
  const entry = { id: 'material-color-utilities', type: 'archive', version: '0.4.0', url: pathToFileURL(archive).href, sha256: await sha256File(archive) };
  const dir = join(d, 'src');
  await fetchSource(entry, dir);
  await verifySource(entry, dir);
  assert.equal(await readFile(join(dir, 'package', 'index.js'), 'utf8'), 'export const x = 1;\n');

  const bad = { ...entry, sha256: 'c'.repeat(64) };
  await assert.rejects(fetchSource(bad, join(d, 'src2')), /sha256 mismatch/);
});
