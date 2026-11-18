#!/usr/bin/env node
// Validate Material Symbols names, then hand them to a platform back end.
// Usage: node index.mjs <projectDir> --platform web|flutter|compose --names a,b [--style outlined] [--dest dir]
//   (JSON on stdout). Exit 4: unknown names. Exit 5: no back end for the platform yet.
// Outlined never touches the network.
import { statSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { checkNames } from './names.mjs';
import { webBackend } from './web.mjs';
import { flutterBackend } from './flutter.mjs';

const PLATFORMS = ['web', 'flutter', 'compose'];

// Platform back ends: (request) => result. Each platform registers its own here.
export const BACKENDS = { web: webBackend, flutter: flutterBackend };

export async function icons({ projectDir, platform, names, style = 'outlined', fill = [0, 1], dest, backends = BACKENDS }) {
  const { known, unknown } = checkNames(names);
  if (unknown.length) {
    return { exitCode: 4, error: 'unknown icon names', known, unknown };
  }
  const backend = backends[platform];
  if (!backend) {
    return { exitCode: 5, error: `icons: not implemented for ${platform}`, known, unknown };
  }
  const result = await backend({ projectDir, platform, names: known, style, fill, dest });
  return { exitCode: 0, known, unknown, ...result };
}

function parseArgs(argv) {
  const [dir, ...rest] = argv;
  const opts = { dir };
  for (let i = 0; i < rest.length; i += 2) {
    const key = rest[i];
    if (!key.startsWith('--') || rest[i + 1] === undefined) return null;
    opts[key.slice(2)] = rest[i + 1];
  }
  return opts;
}

async function main(argv) {
  const usage = 'usage: icons <projectDir> --platform web|flutter|compose --names a,b [--style outlined] [--fill 0,1] [--dest dir]';
  const o = parseArgs(argv);
  let isDir = false;
  try { isDir = !!o?.dir && statSync(o.dir).isDirectory(); } catch { /* not a dir */ }
  if (!o || !isDir || !PLATFORMS.includes(o.platform) || !o.names) {
    process.stderr.write(`${usage}\n`);
    return 2;
  }
  const result = await icons({
    projectDir: resolve(o.dir),
    platform: o.platform,
    names: o.names.split(',').map((s) => s.trim()).filter(Boolean),
    style: o.style ?? 'outlined',
    fill: o.fill ? o.fill.split(',').map(Number) : [0, 1],
    dest: o.dest,
  });
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  return result.exitCode;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.exitCode = await main(process.argv.slice(2));
}
