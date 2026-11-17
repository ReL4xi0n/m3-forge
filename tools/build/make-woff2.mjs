#!/usr/bin/env node
// Maintainer tool: converts the bundled Roboto Flex TTF to woff2 with the pinned encoder
// (wawoff2, Google's woff2 reference encoder compiled to WebAssembly; pin in versions.json `tools`).
//   node tools/build/make-woff2.mjs           write assets/fonts/RobotoFlex.woff2 and print its sha256
//   node tools/build/make-woff2.mjs --check   fail if the committed woff2 differs from a fresh conversion
// The npm archive is downloaded once into the maintainer toolchain folder, verified against the pinned
// sha256 and unpacked next to it; nothing from it is shipped (only the converted font).
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readArchive } from './vendor-mcu.mjs';

const REPO = fileURLToPath(new URL('../../', import.meta.url));
const SKILL = join(REPO, 'plugin/skills/material3');
const toolchain = process.env.M3_TOOLCHAIN || join(homedir(), '.m3-toolchain');
const sha = b => createHash('sha256').update(b).digest('hex');

export const TTF = join(SKILL, 'assets/fonts/RobotoFlex.ttf');
export const WOFF2 = join(SKILL, 'assets/fonts/RobotoFlex.woff2');
export const pin = () => JSON.parse(readFileSync(join(SKILL, 'versions.json'), 'utf8')).tools.find(t => t.name === 'wawoff2');

// Loads the pinned encoder: fetches (if absent), verifies sha256, unpacks and requires it.
export async function loadEncoder() {
  const entry = pin();
  if (!entry) throw new Error('versions.json has no tools entry for wawoff2');
  const archive = join(toolchain, 'sources', `wawoff2-${entry.version}.tgz`);
  if (!existsSync(archive)) {
    const res = await fetch(entry.archive.url);
    if (!res.ok) throw new Error(`download ${entry.archive.url}: ${res.status}`);
    mkdirSync(dirname(archive), { recursive: true });
    writeFileSync(archive, Buffer.from(await res.arrayBuffer()));
  }
  const buf = readFileSync(archive);
  if (sha(buf) !== entry.archive.sha256) throw new Error(`wawoff2 archive sha256 ${sha(buf)} != pinned ${entry.archive.sha256}`);
  const dir = join(toolchain, 'wawoff2', entry.version);
  if (!existsSync(join(dir, 'index.js'))) {
    for (const [p, body] of readArchive(buf)) {
      mkdirSync(dirname(join(dir, p)), { recursive: true });
      writeFileSync(join(dir, p), body);
    }
  }
  return createRequire(join(dir, 'index.js'))('./index.js');
}

export async function convert(ttf = readFileSync(TTF)) {
  const { compress } = await loadEncoder();
  return Buffer.from(await compress(ttf));
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const out = await convert();
  if (process.argv.includes('--check')) {
    if (!existsSync(WOFF2) || sha(readFileSync(WOFF2)) !== sha(out)) { console.error('RobotoFlex.woff2 differs from a fresh conversion'); process.exit(1); }
    console.log('RobotoFlex.woff2 ok');
  } else {
    writeFileSync(WOFF2, out);
    console.log(`RobotoFlex.woff2 ${out.length} bytes sha256 ${sha(out)}`);
  }
}
