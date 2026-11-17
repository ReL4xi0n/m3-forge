#!/usr/bin/env node
// Screenshot step of the material3 skill: renders the built UI in light and dark, and measures text
// contrast and touch targets in the rendered page.
//
//   screenshot({ projectDir, platform, out?, url?, roots?, browsers? }) -> {
//     ran: boolean, skippedReason?: string, engine?: 'playwright' | 'cdp', shots: string[] (PNG paths),
//     runtime: { contrast: [{ where, detail }], targets: [{ where, detail }] },
//     out, capture (capture.json path), pageErrors?, warnings?, measured?, playwright?, browser? }
//   `runtime` is what verify reads from capture.json. `roots` replaces the global node_modules
//   folders searched for Playwright, `browsers` the browser executables tried without it (tests).
//   engine 'playwright': a Playwright that resolves; 'cdp': an installed Chrome, Edge or Chromium.
//
// CLI: node index.mjs <projectDir> --platform web|flutter|compose [--out <dir>] [--url <address>]
//   Writes the PNGs and capture.json to a new folder under the OS temp directory, or to --out, which
//   must not be inside the project. Prints JSON. Then: verify <projectDir> <platform> <capture.json>.
//   Exit 0: ran. Exit 5: skipped (the reason is in `skippedReason`). Exit 2: bad usage.
import { mkdirSync, mkdtempSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { isAbsolute, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { screenshotWeb } from './web.mjs';

export const PLATFORMS = ['web', 'flutter', 'compose'];
// Platform back ends: ({ projectDir, outDir, url, roots, browsers }) -> result without out/capture.
export const BACKENDS = { web: screenshotWeb };

export class UsageError extends Error {}

const isDir = (p) => { try { return statSync(p).isDirectory(); } catch { return false; } };
const within = (child, parent) => {
  const r = relative(parent, child);
  return r === '' || (!r.startsWith('..') && !isAbsolute(r));
};

export async function screenshot({ projectDir, platform, out, url, roots, browsers } = {}) {
  if (!PLATFORMS.includes(platform)) throw new UsageError(`unknown platform "${platform}" (expected ${PLATFORMS.join(', ')})`);
  const dir = resolve(String(projectDir ?? ''));
  if (!isDir(dir)) throw new UsageError(`project folder not found: ${projectDir}`);
  let outDir;
  if (out) {
    outDir = resolve(out);
    if (within(outDir, dir)) throw new UsageError(`--out must be outside the project (${outDir})`);
    mkdirSync(outDir, { recursive: true });
  } else {
    outDir = mkdtempSync(join(tmpdir(), 'm3-screenshot-'));
  }

  const backend = BACKENDS[platform];
  const result = backend
    ? await backend({ projectDir: dir, outDir, url, roots, browsers })
    : { ran: false, skippedReason: `no screenshot back end for ${platform} in this version: screenshots skipped`, shots: [], runtime: { contrast: [], targets: [] } };

  const capture = join(outDir, 'capture.json');
  const record = { platform, ...result, shots: result.shots.map((s) => relative(outDir, s)) };
  writeFileSync(capture, `${JSON.stringify(record, null, 2)}\n`);
  return { ...result, out: outDir, capture };
}

function parseArgs(argv) {
  const [dir, ...rest] = argv;
  if (!dir || dir.startsWith('--')) return null;
  const o = { dir };
  for (let i = 0; i < rest.length; i += 2) {
    if (!rest[i].startsWith('--') || rest[i + 1] === undefined) return null;
    o[rest[i].slice(2)] = rest[i + 1];
  }
  return o;
}

async function main(argv) {
  const o = parseArgs(argv);
  if (!o || !PLATFORMS.includes(o.platform)) {
    process.stderr.write('usage: screenshot <projectDir> --platform web|flutter|compose [--out dir] [--url address]\n');
    return 2;
  }
  let r;
  try {
    r = await screenshot({ projectDir: o.dir, platform: o.platform, out: o.out, url: o.url });
  } catch (e) {
    if (e instanceof UsageError) { process.stderr.write(`${e.message}\n`); return 2; }
    throw e;
  }
  const summary = {
    ran: r.ran,
    ...(r.engine ? { engine: r.engine } : {}),
    ...(r.skippedReason ? { skippedReason: r.skippedReason } : {}),
    shots: r.shots,
    contrast: r.runtime.contrast.map(({ where, detail }) => ({ where, detail })),
    targets: r.runtime.targets.map(({ where, detail }) => ({ where, detail })),
    ...(r.warnings?.length ? { warnings: r.warnings } : {}),
    ...(r.pageErrors && Object.keys(r.pageErrors).length ? { pageErrors: r.pageErrors } : {}),
    capture: r.capture,
  };
  process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
  return r.ran ? 0 : 5;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.exitCode = await main(process.argv.slice(2));
}
