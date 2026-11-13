import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { spawnSync, execFileSync } from 'node:child_process';

const cli = join(dirname(fileURLToPath(import.meta.url)), '..', 'scan-secrets.mjs');
const fake = 'sk-ant-' + 'oat01-' + 'M4n5B6v7'.repeat(6);

function repo() {
  const d = mkdtempSync(join(tmpdir(), 'm3sec-'));
  execFileSync('git', ['init', '-q'], { cwd: d });
  return d;
}

test('scan-secrets --staged: blocks a staged token, passes a clean file, never prints the secret', () => {
  const d = repo();
  writeFileSync(join(d, 'run.jsonl'), `{"out":"${fake}"}\n`);
  writeFileSync(join(d, 'ok.txt'), 'nothing secret\n');
  execFileSync('git', ['add', '.'], { cwd: d });
  const bad = spawnSync(process.execPath, [cli, '--staged'], { cwd: d, encoding: 'utf8' });
  assert.equal(bad.status, 1);
  assert.match(bad.stderr + bad.stdout, /run\.jsonl: anthropic-key at line 1/);
  assert.ok(!(bad.stderr + bad.stdout).includes(fake.slice(12)));
  execFileSync('git', ['rm', '-q', '--cached', 'run.jsonl'], { cwd: d });
  const good = spawnSync(process.execPath, [cli, '--staged'], { cwd: d, encoding: 'utf8' });
  assert.equal(good.status, 0, good.stderr);
});
