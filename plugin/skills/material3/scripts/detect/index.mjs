#!/usr/bin/env node
// Detect the platform, framework, Material library and tools of a project.
// Usage: node index.mjs <projectDir> [web|flutter|compose]   (JSON on stdout)
import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { createRequire } from 'node:module';
import { delimiter, extname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const PLATFORMS = ['web', 'flutter', 'compose'];
const SKIP_DIRS = new Set(['node_modules', 'build', '.dart_tool', '.gradle', '.git', 'dist', 'out']);
const MAX_FILES = 5000;
const MAX_BYTES = 512 * 1024;

function readText(file) {
  try { return readFileSync(file, 'utf8'); } catch { return null; }
}

function readJson(file) {
  const t = readText(file);
  if (t === null) return null;
  try { return JSON.parse(t); } catch { return null; }
}

// Walk the project, returning relative posix paths of files with one of the extensions.
function walk(root, exts) {
  const found = [];
  let seen = 0;
  const visit = (dir) => {
    let entries;
    try { entries = readdirSync(dir, { withFileTypes: true }); } catch { return; }
    for (const e of entries) {
      if (seen > MAX_FILES) return;
      const full = join(dir, e.name);
      if (e.isDirectory()) {
        if (!SKIP_DIRS.has(e.name)) visit(full);
      } else if (e.isFile()) {
        seen++;
        if (exts.includes(extname(e.name))) found.push(full);
      }
    }
  };
  visit(root);
  return found;
}

function themeFilesFor(root, exts, pattern) {
  const out = [];
  for (const f of walk(root, exts)) {
    try { if (statSync(f).size > MAX_BYTES) continue; } catch { continue; }
    const t = readText(f);
    if (t !== null && pattern.test(t)) out.push(relative(root, f).split(sep).join('/'));
  }
  return out.sort();
}

// ---- tools -----------------------------------------------------------------

function normalizeEnv(env) {
  const out = {};
  for (const [k, v] of Object.entries(env)) {
    if (v !== undefined && k.toLowerCase() !== 'path') out[k] = v;
  }
  const pathKey = Object.keys(env).find((k) => k.toLowerCase() === 'path');
  out.PATH = pathKey ? env[pathKey] : '';
  if (process.platform === 'win32') out.Path = out.PATH;
  return out;
}

function which(name, env) {
  const dirs = (env.PATH || '').split(delimiter).filter(Boolean);
  const exts = process.platform === 'win32'
    ? (env.PATHEXT || process.env.PATHEXT || '.COM;.EXE;.BAT;.CMD').split(';').filter(Boolean)
    : [''];
  for (const d of dirs) {
    for (const x of exts) {
      const f = join(d, name + x);
      try { if (statSync(f).isFile()) return f; } catch { /* next */ }
    }
  }
  return null;
}

// Run a command resolved from env.PATH. Returns { ok, stdout, stderr }; never throws.
function probe(name, args, env, timeout = 8000) {
  try {
    const exe = which(name, env);
    if (!exe) return { ok: false, stdout: '', stderr: '' };
    const wrapped = /\.(cmd|bat)$/i.test(exe);
    const r = wrapped
      ? spawnSync(`"${exe}" ${args.join(' ')}`, { env, timeout, shell: true, encoding: 'utf8', windowsHide: true })
      : spawnSync(exe, args, { env, timeout, encoding: 'utf8', windowsHide: true });
    if (r.error || r.status === null) return { ok: false, stdout: '', stderr: '' };
    return { ok: r.status === 0, stdout: r.stdout || '', stderr: r.stderr || '' };
  } catch {
    return { ok: false, stdout: '', stderr: '' };
  }
}

function resolvePlaywright(projectDir, env) {
  const bases = [join(projectDir, 'package.json'), fileURLToPath(import.meta.url)];
  for (const base of bases) {
    for (const mod of ['playwright', 'playwright-core']) {
      try {
        const p = createRequire(base).resolve(`${mod}/package.json`);
        return { available: true, version: readJson(p)?.version ?? null };
      } catch { /* next */ }
    }
  }
  const exe = which('playwright', env);
  return exe ? { available: true, version: null } : { available: false, version: null };
}

function androidSdk(env) {
  for (const key of ['ANDROID_HOME', 'ANDROID_SDK_ROOT']) {
    const dir = env[key];
    if (dir && existsSync(join(dir, 'platforms'))) return { available: true, path: dir };
  }
  return { available: false, path: null };
}

function probeFlutter(env, wantVersion) {
  if (!which('flutter', env)) return { available: false, version: null };
  if (!wantVersion) return { available: true, version: null };
  const r = probe('flutter', ['--version', '--machine'], env, 15000);
  if (!r.ok) return { available: true, version: null };
  try {
    const m = r.stdout.match(/\{[\s\S]*\}/);
    return { available: true, version: JSON.parse(m[0]).frameworkVersion ?? null };
  } catch {
    return { available: true, version: null };
  }
}

function probeJava(env) {
  const r = probe('java', ['-version'], env);
  if (!which('java', env)) return { available: false, version: null };
  const m = (r.stderr + r.stdout).match(/version "([^"]+)"/);
  return { available: true, version: m ? m[1] : null };
}

// ---- platform detection ------------------------------------------------------

function gradleFiles(dir) {
  const files = [];
  const add = (d) => {
    for (const n of ['build.gradle.kts', 'build.gradle']) {
      const f = join(d, n);
      if (existsSync(f)) files.push(f);
    }
  };
  add(dir);
  let entries = [];
  try { entries = readdirSync(dir, { withFileTypes: true }); } catch { /* none */ }
  for (const e of entries) {
    if (e.isDirectory() && !SKIP_DIRS.has(e.name) && !e.name.startsWith('.')) add(join(dir, e.name));
  }
  const catalog = join(dir, 'gradle', 'libs.versions.toml');
  if (existsSync(catalog)) files.push(catalog);
  return files;
}

function tomlVersions(text) {
  const out = {};
  const sec = text.match(/\[versions\]([\s\S]*?)(?=^\s*\[|(?![\s\S]))/m);
  if (!sec) return out;
  for (const m of sec[1].matchAll(/^\s*([\w.-]+)\s*=\s*"([^"]+)"/gm)) out[m[1]] = m[2];
  return out;
}

function composeInfo(dir) {
  const files = gradleFiles(dir);
  let isCompose = false;
  let material3 = null;
  let bom = null;
  for (const f of files) {
    const t = readText(f);
    if (t === null) continue;
    if (/androidx\.compose|org\.jetbrains\.compose|kotlin\.compose|buildFeatures[\s\S]{0,80}compose\s*=\s*true|compose\s*=\s*true/.test(t)) isCompose = true;
    if (f.endsWith('.toml')) {
      const versions = tomlVersions(t);
      for (const line of t.split(/\r?\n/)) {
        if (!bom && /compose-bom/.test(line)) {
          const r = line.match(/version\.ref\s*=\s*"([^"]+)"/);
          const l = line.match(/version\s*=\s*"([^"]+)"/);
          const mod = line.match(/compose-bom:([^"\s]+)/);
          bom = r ? versions[r[1]] ?? null : l ? l[1] : mod ? mod[1] : null;
        }
        if (material3) continue;
        if (!/androidx\.compose\.material3/.test(line) || !/name\s*=\s*"material3"|module\s*=\s*"androidx\.compose\.material3:material3"/.test(line)) continue;
        const ref = line.match(/version\.ref\s*=\s*"([^"]+)"/);
        const lit = line.match(/version\s*=\s*"([^"]+)"/);
        material3 = ref ? versions[ref[1]] ?? null : lit ? lit[1] : null;
        if (material3) break;
      }
    } else {
      const m = t.match(/androidx\.compose\.material3:material3:([^"'\s)]+)/);
      if (m && !material3 && !m[1].includes('$')) material3 = m[1];
      const b = t.match(/androidx\.compose:compose-bom:([^"'\s)]+)/);
      if (b && !bom && !b[1].includes('$')) bom = b[1];
    }
  }
  return { isCompose, material3, bom };
}

function isBelowExpressive(version) {
  if (!version) return false;
  const m = version.match(/^(\d+)(?:\.(\d+))?(?:\.(\d+))?/);
  if (!m) return false;
  const [maj, min] = [Number(m[1]), Number(m[2] ?? 0)];
  return maj < 1 || (maj === 1 && min < 5);
}

function webFramework(dir) {
  const pkg = readJson(join(dir, 'package.json'));
  if (!pkg) return 'plain';
  const deps = { ...pkg.dependencies, ...pkg.devDependencies, ...pkg.peerDependencies };
  const has = (n) => Object.prototype.hasOwnProperty.call(deps, n);
  if (has('react') || has('next')) return 'react';
  if (has('vue') || has('nuxt')) return 'vue';
  if (has('svelte') || has('@sveltejs/kit')) return 'svelte';
  return 'plain';
}

function flutterLibrary(dir) {
  const t = readText(join(dir, 'pubspec.yaml'));
  if (t === null) return null;
  return /^\s*material_ui\s*:/m.test(t) ? 'material_ui' : 'material';
}

function detectPlatform(dir) {
  if (existsSync(join(dir, 'pubspec.yaml'))) return 'flutter';
  if (composeInfo(dir).isCompose) return 'compose';
  return 'web';
}

function isEmpty(dir) {
  try { return readdirSync(dir).every((n) => n.startsWith('.')); } catch { return true; }
}

export async function detect(dir, opts = {}) {
  const root = resolve(dir);
  const env = normalizeEnv(opts.env ?? process.env);
  const platform = opts.platform ?? detectPlatform(root);
  const compose = platform === 'compose' ? composeInfo(root) : { material3: null, bom: null };

  let themeFiles = [];
  try {
    if (platform === 'web') themeFiles = themeFilesFor(root, ['.css', '.scss', '.sass', '.less'], /--md-sys-color-/);
    else if (platform === 'flutter') themeFiles = themeFilesFor(root, ['.dart'], /\b(ThemeData|ColorScheme)\s*(\.\w+)?\s*\(/);
    else themeFiles = themeFilesFor(root, ['.kt'], /\b(lightColorScheme|darkColorScheme|MaterialTheme)\s*\(/);
  } catch { themeFiles = []; }

  const flutter = probeFlutter(env, platform === 'flutter');
  const nodeOnPath = Boolean(which('node', env));
  return {
    platform,
    framework: platform === 'web' ? webFramework(root) : null,
    flutterLibrary: platform === 'flutter' ? flutterLibrary(root) : null,
    flutterVersion: platform === 'flutter' ? flutter.version : null,
    composeMaterial3: compose.material3,
    // Unresolved Compose version (BOM-managed, interpolated, missing alias): unknown, not false.
    composeBom: platform === 'compose' ? compose.bom : null,
    belowExpressive: platform !== 'compose' ? false : compose.material3 ? isBelowExpressive(compose.material3) : null,
    themeFiles,
    empty: isEmpty(root),
    tools: {
      node: { available: true, version: process.version, onPath: nodeOnPath },
      playwright: resolvePlaywright(root, env),
      flutter,
      java: probeJava(env),
      androidSdk: androidSdk(env),
    },
  };
}

async function main(argv) {
  const [dir, platform, ...rest] = argv;
  const usage = 'usage: detect <projectDir> [web|flutter|compose]';
  if (!dir || rest.length || (platform && !PLATFORMS.includes(platform))) {
    process.stderr.write(`${usage}\n`);
    return 2;
  }
  let ok = false;
  try { ok = statSync(dir).isDirectory(); } catch { /* not a dir */ }
  if (!ok) {
    process.stderr.write(`not a directory: ${dir}\n${usage}\n`);
    return 2;
  }
  process.stdout.write(`${JSON.stringify(await detect(dir, { platform }), null, 2)}\n`);
  return 0;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.exitCode = await main(process.argv.slice(2));
}
