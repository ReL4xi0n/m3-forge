#!/usr/bin/env node
// Token sources.
//   fetch.mjs --resolve   resolve current refs/versions, download archives to hash them, write
//                         knowledge/sources.lock.json
//   fetch.mjs             fetch exactly what the lock pins (skips sources that already verify)
import { execFileSync } from 'node:child_process';
import { readFile, writeFile, rm } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';
import { validateLock, fetchSource, verifySource, sourceDir, sha256File, COMPOSE_VERSION } from './lock.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const LOCK = join(root, 'knowledge', 'sources.lock.json');

function lsRemote(repo, pattern) {
  const out = execFileSync('git', ['ls-remote', repo, pattern], { encoding: 'utf8' });
  return out.split('\n').filter(Boolean).map(l => { const [sha, ref] = l.split('\t'); return { sha, ref }; });
}

// Commit of a tag (peeled when annotated) or branch.
function commitOf(repo, ref) {
  const rows = lsRemote(repo, ref.startsWith('refs/') ? `${ref}*` : ref);
  const peeled = rows.find(r => r.ref.endsWith('^{}'));
  const exact = rows.find(r => r.ref === ref || r.ref === `refs/heads/${ref}` || r.ref === `refs/tags/${ref}`);
  const hit = peeled || exact;
  if (!hit) throw new Error(`cannot resolve ${ref} in ${repo}`);
  return hit.sha;
}

async function hashUrl(url) {
  const file = join(tmpdir(), `m3-forge-resolve-${Date.now()}`);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  await writeFile(file, Buffer.from(await res.arrayBuffer()));
  const sha = await sha256File(file);
  await rm(file, { force: true });
  return sha;
}

async function resolve() {
  const MW = 'https://github.com/material-components/material-web.git';
  const MDC = 'https://github.com/material-components/material-components-android.git';
  const PKG = 'https://github.com/flutter/packages.git';

  const mdcTags = lsRemote(MDC, 'refs/tags/*')
    .map(r => /^refs\/tags\/(\d+)\.(\d+)\.(\d+)$/.exec(r.ref))
    .filter(Boolean)
    .sort((a, b) => (+a[1] - +b[1]) || (+a[2] - +b[2]) || (+a[3] - +b[3]));
  const mdcTag = mdcTags.at(-1)[0].slice('refs/tags/'.length);

  const pub = await (await fetch('https://pub.dev/api/packages/material_ui')).json();
  const muiVersion = pub.latest.version;
  const muiTag = `material_ui-v${muiVersion}`;

  const npm = await (await fetch('https://registry.npmjs.org/@material/material-color-utilities/0.4.0')).json();
  const composeUrl = `https://dl.google.com/android/maven2/androidx/compose/material3/material3-android/${COMPOSE_VERSION}/material3-android-${COMPOSE_VERSION}-sources.jar`;

  const lock = {
    schemaVersion: 1,
    resolvedOn: new Date().toLocaleDateString('sv-SE'),
    sources: [
      { id: 'material-web', type: 'git', repo: MW, ref: 'main', commit: commitOf(MW, 'refs/heads/main'), paths: ['/tokens/'], license: 'Apache-2.0',
        note: 'tokens/versions/latest (Sass); repository in maintenance mode, default branch head' },
      { id: 'material-color-utilities', type: 'archive', name: '@material/material-color-utilities', version: '0.4.0',
        url: npm.dist.tarball, integrity: npm.dist.integrity, sha256: await hashUrl(npm.dist.tarball), license: 'Apache-2.0' },
      { id: 'material-components-android', type: 'git', repo: MDC, ref: `refs/tags/${mdcTag}`, version: mdcTag, commit: commitOf(MDC, `refs/tags/${mdcTag}`),
        paths: ['/lib/java/com/google/android/material/**/res/values*/*tokens*.xml'], license: 'Apache-2.0', note: 'latest stable release tag' },
      { id: 'material_ui', type: 'git', repo: PKG, ref: `refs/tags/${muiTag}`, version: muiVersion, commit: commitOf(PKG, `refs/tags/${muiTag}`),
        paths: ['/packages/material_ui/tool/gen_defaults/data/', '/packages/material_ui/lib/', '/packages/material_ui/pubspec.yaml', '/packages/material_ui/LICENSE'],
        license: 'BSD-3-Clause', note: 'gen_defaults data is generated Dart (token id in a doc comment above each constant)' },
      { id: 'compose-material3', type: 'archive', name: 'androidx.compose.material3:material3-android (sources jar)', version: COMPOSE_VERSION,
        url: composeUrl, sha256: await hashUrl(composeUrl), license: 'Apache-2.0' },
    ],
  };
  const errors = validateLock(lock);
  if (errors.length) throw new Error(`resolved lock is invalid:\n${errors.join('\n')}`);
  await writeFile(LOCK, JSON.stringify(lock, null, 2) + '\n');
  return lock;
}

async function fetchAll() {
  const lock = JSON.parse(await readFile(LOCK, 'utf8'));
  const errors = validateLock(lock);
  if (errors.length) throw new Error(errors.join('\n'));
  for (const s of lock.sources) {
    const dir = sourceDir(s.id);
    try {
      await verifySource(s, dir);
      console.log(`${s.id}: ok (already fetched)`);
    } catch {
      await fetchSource(s, dir);
      console.log(`${s.id}: fetched ${s.commit || s.sha256}`);
    }
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  try {
    if (process.argv.includes('--resolve')) {
      const lock = await resolve();
      for (const s of lock.sources) console.log(`${s.id}: ${s.version || s.ref} ${s.commit || s.sha256}`);
    } else {
      await fetchAll();
    }
  } catch (e) {
    console.error(e.message);
    process.exitCode = 1;
  }
}
