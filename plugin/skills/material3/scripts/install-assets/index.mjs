#!/usr/bin/env node
// Copy skill assets into a project without ever overwriting the user's files.
// Usage: node index.mjs <projectDir> --platform web|flutter|compose --parts a,b
//          [--dest dir] [--package com.example.app] [--flutter-library material|material_ui]
//   (JSON on stdout). Exit 3: conflicts (nothing was copied). Exit 2: usage or setup error.
//
// A destination file that already holds exactly what this script would write is "identical";
// one that differs is a "conflict". With any conflict, nothing at all is written.
//
// Destination rules (relative to the project; --dest overrides the "main" group only):
//   web      main    src/styles/m3/ if src/ exists, else assets/m3/
//            fonts   <main>/fonts/ (licenses alongside)
//   flutter  main    lib/m3/
//            fonts   assets/fonts/ (licenses alongside); pubspec.yaml is NOT edited, the
//                    snippet to add is returned as `pubspec`
//   compose  module  app/ if it exists, else the project root
//            main    <module>/src/main/{kotlin|java}/<package path>/theme/
//            fonts   <module>/src/main/res/font/   (lowercase Android names)
//            licenses <module>/src/main/res/raw/
// Rewrites applied while copying (and when judging "identical"):
//   Compose: `package m3.theme` becomes `package <package>.theme`
//   Flutter: `package:flutter/material.dart` becomes `package:material_ui/material_ui.dart`
//            when the project uses material_ui; a line `// [material_ui] <code>` becomes
//            `<code> // [material_ui]` (code only material_ui compiles, e.g. StyleVariant)
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { MANIFEST } from './manifest.mjs';

const ASSETS = fileURLToPath(new URL('../../assets/', import.meta.url));
const PLATFORMS = Object.keys(MANIFEST);
const TEXT_EXT = /\.(css|dart|kt|txt)$/;

class SetupError extends Error {}

const read = (f) => { try { return readFileSync(f, 'utf8'); } catch { return null; } };
const isDir = (f) => { try { return statSync(f).isDirectory(); } catch { return false; } };
const posix = (p) => p.split('\\').join('/');

function composeModule(projectDir) {
  return isDir(join(projectDir, 'app')) ? 'app' : '.';
}

function composePackage(projectDir, packageName) {
  if (packageName) return packageName;
  const mod = composeModule(projectDir);
  for (const f of ['build.gradle.kts', 'build.gradle']) {
    const m = /namespace\s*=?\s*["']([\w.]+)["']/.exec(read(join(projectDir, mod, f)) ?? '');
    if (m) return m[1];
  }
  throw new SetupError('compose: cannot find the app package; pass --package com.example.app');
}

function groupDirs({ projectDir, platform, dest, packageName }) {
  if (platform === 'web') {
    const main = dest ?? (isDir(join(projectDir, 'src')) ? 'src/styles/m3' : 'assets/m3');
    return { main, fonts: `${main}/fonts`, licenses: `${main}/fonts` };
  }
  if (platform === 'flutter') {
    return { main: dest ?? 'lib/m3', fonts: 'assets/fonts', licenses: 'assets/fonts' };
  }
  const mod = composeModule(projectDir);
  const base = mod === '.' ? 'src/main' : `${mod}/src/main`;
  const pkgPath = composePackage(projectDir, packageName).split('.').join('/');
  const lang = isDir(join(projectDir, base, 'kotlin')) ? 'kotlin' : 'java';
  return {
    main: dest ?? `${base}/${lang}/${pkgPath}/theme`,
    fonts: `${base}/res/font`,
    licenses: `${base}/res/raw`,
  };
}

function usesMaterialUi(projectDir) {
  return /^\s*material_ui\s*:/m.test(read(join(projectDir, 'pubspec.yaml')) ?? '');
}

// The bytes install-assets writes for one manifest entry.
function render(entry, { platform, themePackage, flutterLibrary }) {
  const file = join(ASSETS, entry.src);
  if (!TEXT_EXT.test(entry.src)) return readFileSync(file);
  let text = readFileSync(file, 'utf8');
  if (platform === 'compose' && entry.group === 'main') {
    // [ \t]* (not \s*): the line break and the blank line after the package line stay.
    text = text.replace(/^package m3\.theme[ \t]*$/m, `package ${themePackage}`);
  }
  if (platform === 'flutter' && flutterLibrary === 'material_ui') {
    text = text.replace(/package:flutter\/material\.dart/g, 'package:material_ui/material_ui.dart');
    // Lines only material_ui can compile (theme.dart) ship as comments; they become code here.
    text = text.replace(/^([ 	]*)\/\/ \[material_ui\] (.*)$/gm, '$1$2 // [material_ui]');
  }
  return Buffer.from(text, 'utf8');
}

function pubspecSnippet(fontsDir) {
  const font = (family, file) => `    - family: ${family}\n      fonts:\n        - asset: ${fontsDir}/${file}`;
  return [
    'flutter:',
    '  fonts:',
    font('Roboto Flex', 'RobotoFlex.ttf'),
    font('Roboto', 'Roboto.ttf'),
    font('MaterialSymbolsOutlined', 'MaterialSymbolsOutlined.ttf'),
    '',
  ].join('\n');
}

export function installAssets({ projectDir, platform, parts, dest, packageName, flutterLibrary }) {
  if (!PLATFORMS.includes(platform)) throw new SetupError(`unknown platform: ${platform}`);
  if (!parts?.length) throw new SetupError('no parts given');
  const table = MANIFEST[platform];
  for (const p of parts) {
    if (!table[p]) throw new SetupError(`unknown part "${p}" for ${platform}; known: ${Object.keys(table).join(', ')}`);
  }
  const dirs = groupDirs({ projectDir, platform, dest, packageName });
  const themePackage = platform === 'compose' ? `${composePackage(projectDir, packageName)}.theme` : null;
  const library = flutterLibrary ?? (usesMaterialUi(projectDir) ? 'material_ui' : 'material');

  // Plan every file first; write only if nothing conflicts.
  const plan = [];
  for (const part of parts) {
    for (const entry of table[part]) {
      const name = platform === 'compose' && entry.androidName ? entry.androidName : (entry.name ?? basename(entry.src));
      const rel = `${dirs[entry.group]}/${name}`;
      plan.push({ rel, abs: join(projectDir, rel), data: render(entry, { platform, themePackage, flutterLibrary: library }) });
    }
  }

  const copied = [];
  const identical = [];
  const conflicts = [];
  const todo = [];
  for (const item of plan) {
    if (!existsSync(item.abs)) { copied.push(item.rel); todo.push(item); continue; }
    let same = false;
    try { same = readFileSync(item.abs).equals(item.data); } catch { /* unreadable: conflict */ }
    (same ? identical : conflicts).push(item.rel);
  }
  if (conflicts.length) return { copied: [], identical, conflicts };

  for (const item of todo) {
    mkdirSync(dirname(item.abs), { recursive: true });
    writeFileSync(item.abs, item.data);
  }
  const result = { copied, identical, conflicts };
  if (platform === 'flutter' && parts.includes('fonts')) result.pubspec = pubspecSnippet(dirs.fonts);
  return result;
}

function parseArgs(argv) {
  const [dir, ...rest] = argv;
  const opts = { dir };
  for (let i = 0; i < rest.length; i += 2) {
    if (!rest[i].startsWith('--') || rest[i + 1] === undefined) return null;
    opts[rest[i].slice(2)] = rest[i + 1];
  }
  return opts;
}

function main(argv) {
  const usage = 'usage: install-assets <projectDir> --platform web|flutter|compose --parts a,b [--dest dir] [--package com.x] [--flutter-library material|material_ui]';
  const o = parseArgs(argv);
  if (!o || !o.dir || !isDir(o.dir) || !o.platform || !o.parts) {
    process.stderr.write(`${usage}\n`);
    return 2;
  }
  let result;
  try {
    result = installAssets({
      projectDir: resolve(o.dir),
      platform: o.platform,
      parts: o.parts.split(',').map((s) => s.trim()).filter(Boolean),
      dest: o.dest ? posix(o.dest) : undefined,
      packageName: o.package,
      flutterLibrary: o['flutter-library'],
    });
  } catch (e) {
    if (!(e instanceof SetupError)) throw e;
    process.stderr.write(`${e.message}\n${usage}\n`);
    return 2;
  }
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  return result.conflicts.length ? 3 : 0;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.exitCode = main(process.argv.slice(2));
}
