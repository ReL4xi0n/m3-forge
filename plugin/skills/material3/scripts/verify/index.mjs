#!/usr/bin/env node
// m3-forge verify v1: static checks on UI source plus the harness runtime results.
//
//   verify({ projectDir, platform, runtime }) -> {
//     violations: [{ check, file, line, detail, severity }], counts, uiLines, exitCode, ... }
//
// CLI: node index.mjs <projectDir> <web|flutter|compose> [capture.json] [--out <dir>]
//   Prints a short summary and writes verify.json to the project folder (or to --out).
//   Exit code: 1 if any error-severity violation, 0 otherwise, 2 on bad usage.
import { mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { CHECKS, Collector } from './common.mjs';
import { scanWeb } from './web.mjs';
import { scanFlutter } from './flutter.mjs';
import { scanCompose } from './compose.mjs';

export { CHECKS };
export const PLATFORMS = ['web', 'flutter', 'compose'];

const SCANNERS = { web: scanWeb, flutter: scanFlutter, compose: scanCompose };

function runtimeViolations(runtime) {
  const out = [];
  const list = (x) => (Array.isArray(x) ? x : []);
  for (const [key, check] of [['contrast', 'contrast'], ['targets', 'touch-target']]) {
    for (const e of list(runtime[key])) {
      const where = e && e.where != null ? String(e.where) : 'unknown element';
      const detail = e && e.detail != null ? String(e.detail) : check;
      out.push({ check, file: null, line: null, where, detail: `${where}: ${detail}`, severity: 'error' });
    }
  }
  return out;
}

export async function verify({ projectDir, platform, runtime } = {}) {
  if (!PLATFORMS.includes(platform)) {
    throw new Error(`unknown platform "${platform}" (expected ${PLATFORMS.join(', ')})`);
  }
  const dir = resolve(String(projectDir || ''));
  const st = await stat(dir).catch(() => null);
  if (!st || !st.isDirectory()) throw new Error(`project folder not found: ${projectDir}`);

  const collector = new Collector();
  const scan = await SCANNERS[platform](dir, collector);

  const runtimeChecked = runtime != null && typeof runtime === 'object';
  const violations = [
    ...collector.violations.sort((a, b) =>
      a.file < b.file ? -1 : a.file > b.file ? 1 : a.line - b.line || (a.check < b.check ? -1 : 1)),
    ...(runtimeChecked ? runtimeViolations(runtime) : []),
  ];
  const counts = Object.fromEntries(CHECKS.map(c => [c, 0]));
  for (const v of violations) counts[v.check]++;
  const allowlisted = collector.allowlisted.sort((a, b) =>
    a.file < b.file ? -1 : a.file > b.file ? 1 : (a.line ?? 0) - (b.line ?? 0));

  return {
    platform,
    violations,
    counts,
    uiLines: scan.uiLines,
    themeLines: scan.themeLines,
    filesScanned: scan.files,
    runtimeChecked,
    allowlisted,
    exitCode: violations.some(v => v.severity === 'error') ? 1 : 0,
  };
}

export function summarize(r) {
  const lines = [];
  const errors = r.violations.filter(v => v.severity === 'error').length;
  const warnings = r.violations.length - errors;
  const per100 = (n) => (r.uiLines ? ((n * 100) / r.uiLines).toFixed(2) : 'n/a');
  lines.push(`verify (${r.platform}): ${errors} error(s), ${warnings} warning(s) in ${r.uiLines} UI line(s), ${r.filesScanned} file(s)`);
  for (const c of Object.keys(r.counts)) {
    if (r.counts[c]) lines.push(`  ${c.padEnd(18)} ${String(r.counts[c]).padStart(4)}   (${per100(r.counts[c])} per 100 UI lines)`);
  }
  if (!r.runtimeChecked) lines.push('  contrast / touch-target: not checked (no runtime results)');
  if (r.allowlisted.length) lines.push(`  allowlisted theme literals: ${r.allowlisted.length} exemption(s), see verify.json`);
  const shown = r.violations.slice(0, 20);
  for (const v of shown) {
    const at = v.file ? `${v.file}:${v.line}` : 'runtime';
    lines.push(`  ${v.severity === 'error' ? 'E' : 'W'} ${v.check} ${at}  ${v.detail}`);
  }
  if (r.violations.length > shown.length) lines.push(`  … ${r.violations.length - shown.length} more in verify.json`);
  return lines.join('\n');
}

async function main(argv) {
  const args = [];
  let out = null;
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--out') out = argv[++i];
    else args.push(argv[i]);
  }
  const [projectDir, platform, capturePath] = args;
  if (!projectDir || !PLATFORMS.includes(platform) || (argv.includes('--out') && !out)) {
    console.error('usage: node index.mjs <projectDir> <web|flutter|compose> [capture.json] [--out <dir>]');
    return 2;
  }
  let runtime;
  if (capturePath) {
    const capture = JSON.parse(await readFile(capturePath, 'utf8'));
    runtime = capture && capture.runtime ? capture.runtime : undefined;
  }
  const result = await verify({ projectDir, platform, runtime });
  const outDir = resolve(out || projectDir);
  await mkdir(outDir, { recursive: true });
  await writeFile(join(outDir, 'verify.json'), JSON.stringify({ tool: 'm3-forge verify v1', ...result }, null, 2) + '\n');
  console.log(summarize(result));
  return result.exitCode;
}

if (resolve(process.argv[1] || '') === fileURLToPath(import.meta.url)) {
  main(process.argv.slice(2)).then(
    code => { process.exitCode = code; },
    err => { console.error(`verify: ${err.message}`); process.exitCode = 2; },
  );
}
