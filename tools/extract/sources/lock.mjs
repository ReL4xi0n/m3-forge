// knowledge/sources.lock.json: the pinned token sources. Git sources are pinned by commit, archives by
// SHA-256. Fetched copies live in the toolchain folder (%USERPROFILE%\.m3-toolchain\sources\<id>).
import { createHash } from 'node:crypto';
import { createReadStream, existsSync } from 'node:fs';
import { copyFile, mkdir, rm, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { homedir } from 'node:os';

export const REQUIRED = ['material-web', 'material-color-utilities', 'material-components-android', 'material_ui', 'compose-material3'];
export const COMPOSE_VERSION = '1.5.0-rc01';

export function validateLock(lock) {
  const errors = [];
  if (!lock || lock.schemaVersion !== 1) errors.push('schemaVersion must be 1');
  const byId = new Map((lock?.sources || []).map(s => [s.id, s]));
  for (const id of REQUIRED) if (!byId.has(id)) errors.push(`missing source ${id}`);
  for (const s of lock?.sources || []) {
    if (s.type === 'git') {
      if (!/^[0-9a-f]{40}$/.test(s.commit || '')) errors.push(`${s.id}: commit must be 40 hex characters`);
      if (!s.repo || !s.ref) errors.push(`${s.id}: repo and ref are required`);
      if (!Array.isArray(s.paths) || !s.paths.length) errors.push(`${s.id}: paths are required`);
    } else if (s.type === 'archive') {
      if (!/^[0-9a-f]{64}$/.test(s.sha256 || '')) errors.push(`${s.id}: sha256 must be 64 hex characters`);
      if (!s.url || !s.version) errors.push(`${s.id}: url and version are required`);
    } else {
      errors.push(`${s.id}: type must be git or archive`);
    }
  }
  const compose = byId.get('compose-material3');
  if (compose && compose.version !== COMPOSE_VERSION) errors.push(`compose-material3: version must be ${COMPOSE_VERSION}`);
  return errors;
}

export function sourceDir(id) {
  const root = process.env.M3_TOOLCHAIN || join(homedir(), '.m3-toolchain');
  return join(root, 'sources', id);
}

export function sha256File(file) {
  return new Promise((resolve, reject) => {
    const h = createHash('sha256');
    createReadStream(file).on('data', d => h.update(d)).on('end', () => resolve(h.digest('hex'))).on('error', reject);
  });
}

const git = (cwd, ...args) => execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();

function tarExe() {
  const win = 'C:\\Windows\\System32\\tar.exe';
  return process.platform === 'win32' && existsSync(win) ? win : 'tar'; // bsdtar on Windows also reads .jar/.zip
}

async function download(url, file) {
  await mkdir(dirname(file), { recursive: true });
  if (url.startsWith('file:')) return copyFile(fileURLToPath(url), file);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`download failed: HTTP ${res.status} for ${url}`);
  await writeFile(file, Buffer.from(await res.arrayBuffer()));
}

export async function fetchSource(entry, dir) {
  await rm(dir, { recursive: true, force: true });
  if (entry.type === 'git') {
    await mkdir(dir, { recursive: true });
    git(dir, 'init', '-q');
    git(dir, 'remote', 'add', 'origin', entry.repo);
    git(dir, 'sparse-checkout', 'set', '--no-cone', ...entry.paths);
    git(dir, 'fetch', '-q', '--filter=tree:0', 'origin', entry.ref);
    git(dir, 'checkout', '-q', entry.commit);
  } else {
    const archive = `${dir}.archive`;
    await download(entry.url, archive);
    const got = await sha256File(archive);
    if (got !== entry.sha256) {
      await rm(archive, { force: true });
      throw new Error(`${entry.id}: sha256 mismatch (got ${got}, pinned ${entry.sha256})`);
    }
    await mkdir(dir, { recursive: true });
    execFileSync(tarExe(), ['-xf', archive, '-C', dir], { stdio: 'pipe' });
  }
  await verifySource(entry, dir);
}

export async function verifySource(entry, dir) {
  if (entry.type === 'git') {
    const head = git(dir, 'rev-parse', 'HEAD');
    if (head !== entry.commit) throw new Error(`${entry.id}: HEAD ${head} is not the pinned commit ${entry.commit}`);
  } else {
    const got = await sha256File(`${dir}.archive`);
    if (got !== entry.sha256) throw new Error(`${entry.id}: sha256 mismatch (got ${got}, pinned ${entry.sha256})`);
  }
}
