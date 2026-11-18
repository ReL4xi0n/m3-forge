#!/usr/bin/env node
// Builds and runs the Flutter theme gallery (maintainer tool, not shipped; ruling R21):
// copies this package to a temp folder, installs the skill's Flutter assets and the color schemes the
// way a project gets them (scripts/install-assets, scripts/color), under either library import, then
// runs `flutter analyze` and `flutter test --update-goldens`, and copies the images to
// out/gallery/flutter/<library>/. Needs the local toolchain (Flutter SDK, pub cache, fonts).
//
//   runGallery('material_ui' | 'material', outDir) -> { dir, images, analyze, test, verify }
//   CLI: node tools/build/gallery/flutter/run.mjs [material_ui|material ...]
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { installAssets } from '../../../../plugin/skills/material3/scripts/install-assets/index.mjs';
import { writeTheme } from '../../../../plugin/skills/material3/scripts/color/index.mjs';
import { verify } from '../../../../plugin/skills/material3/scripts/verify/index.mjs';

const HERE = fileURLToPath(new URL('.', import.meta.url));
const REPO = resolve(HERE, '../../../..');
export const OUT = join(REPO, 'out', 'gallery', 'flutter');
const SEED = '#3366CC';

async function tools() {
  return import(pathToFileURL(join(REPO, 'evals/tools/prepare-fixture.mjs')).href);
}

async function toolchainRoot() {
  const { toolchainRoot: root } = await import(pathToFileURL(join(REPO, 'evals/tools/toolchain-env.mjs')).href);
  return root();
}

const useLibrary = (text, library) => (library === 'material_ui'
  ? text.replace(/package:flutter\/material\.dart/g, 'package:material_ui/material_ui.dart')
  : text);

export async function runGallery(library, outDir = join(OUT, library)) {
  if (!['material_ui', 'material'].includes(library)) throw new Error(`unknown library ${library}`);
  const { runTool } = await tools();
  const dir = realpathSync.native(mkdtempSync(join(tmpdir(), `m3-gallery-${library}-`)));
  try {
    cpSync(HERE, dir, { recursive: true, filter: p => !['run.mjs', 'gallery.test.mjs', 'goldens', '.dart_tool', 'build'].includes(basename(p)) });
    if (library === 'material') {
      const pub = join(dir, 'pubspec.yaml');
      writeFileSync(pub, readFileSync(pub, 'utf8').replace(/^ {2}material_ui: .*\n/m, ''));
    }
    const inst = installAssets({ projectDir: dir, platform: 'flutter', parts: ['tokens', 'fonts'], flutterLibrary: library });
    if (inst.conflicts.length) throw new Error(`install conflicts: ${inst.conflicts.join(', ')}`);
    writeTheme({ platform: 'flutter', seed: SEED, style: 'expressive', flutterLibrary: library, out: join(dir, 'lib/m3/schemes.dart') });
    writeTheme({ platform: 'flutter', seed: SEED, style: 'classic', flutterLibrary: library, out: join(dir, 'lib/m3/schemes_classic.dart') });
    for (const f of ['lib/sample_screen.dart', 'test/m3_theme_test.dart']) {
      const p = join(dir, f);
      writeFileSync(p, useLibrary(readFileSync(p, 'utf8'), library));
    }

    const get = await runTool('flutter', ['pub', 'get', '--offline'], dir);
    if (get.code !== 0) throw new Error(`pub get failed\n${get.out}`);

    const analyze = await runTool('flutter', ['analyze', '--no-fatal-infos'], dir);
    process.env.M3_FONTS_DIR = join(await toolchainRoot(), 'fonts');
    const test = await runTool('flutter', ['test', '--update-goldens'], dir);
    const goldens = join(dir, 'test', 'goldens');
    const images = existsSync(goldens) ? readdirSync(goldens).filter(n => n.endsWith('.png')).sort() : [];
    mkdirSync(outDir, { recursive: true });
    for (const n of images) cpSync(join(goldens, n), join(outDir, n));
    const v = await verify({ projectDir: dir, platform: 'flutter' });
    return { dir: outDir, images, analyze, test, verify: { counts: v.counts, violations: v.violations } };
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const libs = process.argv.slice(2).length ? process.argv.slice(2) : ['material_ui', 'material'];
  for (const lib of libs) {
    const r = await runGallery(lib);
    console.log(`${lib}: analyze exit ${r.analyze.code}, test exit ${r.test.code}, ${r.images.length} images in ${r.dir}`);
    if (r.test.code !== 0) console.log(r.test.out.slice(-3000));
    if (r.analyze.code !== 0) console.log(r.analyze.out.slice(-3000));
    console.log(`  verify: ${JSON.stringify(r.verify.counts)}`);
    process.exitCode ||= r.test.code === 0 && r.analyze.code === 0 ? 0 : 1;
  }
}
