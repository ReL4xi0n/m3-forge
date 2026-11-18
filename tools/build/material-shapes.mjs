#!/usr/bin/env node
// Maintainer tool, run in the m3-forge repository only (never by the skill at runtime).
// Compose's Expressive MaterialShapes as web masks, generated from the official library:
//
//   --dump   (needs the local toolchain) copies the compose-1.5 eval fixture to a temporary folder,
//            adds a JVM unit test that reads every public MaterialShapes.<Name> RoundedPolygon
//            (androidx.compose.material3 1.5.0-rc01 with androidx.graphics:graphics-shapes) and
//            writes its cubics, runs Gradle there, and stores the result in material-shapes.json
//            next to this file. The fixture itself is never changed.
//   (none)   writes plugin/skills/material3/assets/web/components/shapes.css from that JSON.
//   --check  exits 1 when shapes.css differs from what the JSON gives.
//
// Usage: node tools/build/material-shapes.mjs [--dump] [--check]
import { spawn } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync, appendFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { withToolchain } from '../../evals/tools/toolchain-env.mjs';
import { sourceDir } from '../extract/sources/lock.mjs';

const ROOT = fileURLToPath(new URL('../../', import.meta.url));
export const CUBICS_JSON = join(ROOT, 'tools/build/material-shapes.json');
export const SHAPES_CSS = join(ROOT, 'plugin/skills/material3/assets/web/components/shapes.css');
const FIXTURE = join(ROOT, 'evals/fixtures/compose-1.5');
const SOURCE_REL = 'commonMain/androidx/compose/material3/MaterialShapes.kt';
const MATERIAL3 = '1.5.0-rc01';
// Coordinates are written with this many decimals (1e-4 of the box: 0.04px on a 400px box).
export const DECIMALS = 4;

// ---------------------------------------------------------------------------------------------------
// Names of the public MaterialShapes vals, in source order.
export function publicShapeNames(sourceText) {
  return [...sourceText.matchAll(/^\s*public val (\w+): RoundedPolygon$/gm)].map(m => m[1]);
}

export const kebab = name => name.replace(/([a-z])([A-Z0-9])/g, '$1-$2').replace(/([0-9])([A-Z])/g, '$1-$2').toLowerCase();

const num = v => {
  let s = v.toFixed(DECIMALS).replace(/\.?0+$/, '');
  if (s === '-0') s = '0';
  return s.replace(/^(-?)0\./, '$1.');
};

// SVG path data in the 0..1 box: one closed subpath of cubics. Each cubic is
// [anchor0X, anchor0Y, control0X, control0Y, control1X, control1Y, anchor1X, anchor1Y].
export function pathData(cubics) {
  const parts = [`M${num(cubics[0][0])} ${num(cubics[0][1])}`];
  for (const c of cubics) parts.push(`C${c.slice(2).map(num).join(' ')}`);
  return `${parts.join('')}Z`;
}

// A path's numbers joined with spaces is not ambiguous; minus signs never occur (all within 0..1).
const svgUrl = d => {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1 1' preserveAspectRatio='none'><path d='${d}'/></svg>`;
  return `url("data:image/svg+xml,${svg.replace(/</g, '%3C').replace(/>/g, '%3E')}")`;
};

const HEADER = `/* material3 skill asset: assets/web/components/shapes.css
 * Material 3 Expressive shapes (Compose MaterialShapes): masks that cut an element to one of the
 * 35 shapes, for avatars, image placeholders and a hero or selected container in an Expressive
 * page. Never in classic M3 (data-m3-style="classic" drops the mask, the element keeps its own
 * corner radius). The class sets a mask only: the color is the element's own background (a color
 * role), its content (an img, initials, an icon) is cut with it.
 *
 *   <div class="m3-shape--cookie-9-sided" style="background: var(--md-sys-color-primary-container)"></div>
 *   <img class="m3-shape--clover-4-leaf" src="avatar.jpg" alt="…" width="96" height="96">
 *
 * The shape stretches to the element's box like Compose's RoundedPolygon.toShape() (scale by the
 * width and the height; keep the box square for the shape as drawn).
 * Geometry generated from the official library: each path is the cubics of the public
 * MaterialShapes.<Name> RoundedPolygon (already normalized to the 1x1 box), read on the JVM from
 * androidx.compose.material3:material3 ${MATERIAL3} by a maintainer tool,
 * written with ${DECIMALS} decimals in a 0..1 view box. Do not edit by hand.
 */
`;

export function buildShapesCss(data) {
  const rules = [];
  const names = [];
  for (const s of data.shapes) {
    const cls = `.m3-shape--${kebab(s.name)}`;
    names.push(cls);
    rules.push(`/* [impl: compose-material3 ${data.material3} MaterialShapes.${s.name}] */\n${cls} {\n  mask-image: ${svgUrl(pathData(s.cubics))};\n}`);
  }
  const all = `:is(${names.join(', ')})`;
  // 100% 100%: the element's own box, scaled by its width and height like toShape().
  const shared = `${all} {\n  mask-position: center;\n  mask-size: 100% 100%;\n  mask-repeat: no-repeat;\n}`;
  const classic = `:root[data-m3-style="classic"] ${all} {\n  mask-image: none;\n}`;
  return `${HEADER}\n${shared}\n\n${rules.join('\n\n')}\n\n/* Classic M3 has no shape library: the element keeps its own corner radius. */\n${classic}\n`;
}

// ---------------------------------------------------------------------------------------------------
// JVM dump (toolchain).

const DUMP_TEST = `package com.example.fixture

import androidx.compose.material3.ExperimentalMaterial3ExpressiveApi
import androidx.compose.material3.MaterialShapes
import androidx.graphics.shapes.RoundedPolygon
import java.io.File
import java.lang.reflect.Modifier
import org.junit.Test

// Every public MaterialShapes.<Name> (a getter on the companion that returns a RoundedPolygon),
// with its cubics as returned by the library.
@OptIn(ExperimentalMaterial3ExpressiveApi::class)
class MaterialShapesDump {
    @Test
    fun dump() {
        val companion = MaterialShapes.Companion
        val getters = companion.javaClass.declaredMethods.filter {
            Modifier.isPublic(it.modifiers) && it.parameterCount == 0 && !it.name.contains('$') &&
                it.name.startsWith("get") && it.returnType == RoundedPolygon::class.java
        }.sortedBy { it.name }
        val out = StringBuilder("{\\"shapes\\":[")
        getters.forEachIndexed { i, g ->
            val polygon = g.invoke(companion) as RoundedPolygon
            if (i > 0) out.append(',')
            out.append("{\\"name\\":\\"").append(g.name.removePrefix("get")).append("\\",\\"cubics\\":[")
            polygon.cubics.forEachIndexed { j, c ->
                if (j > 0) out.append(',')
                val p = floatArrayOf(c.anchor0X, c.anchor0Y, c.control0X, c.control0Y, c.control1X, c.control1Y, c.anchor1X, c.anchor1Y)
                out.append(p.joinToString(",", "[", "]") { it.toString() })
            }
            out.append("]}")
        }
        out.append("]}")
        File("build/m3-material-shapes.json").writeText(out.toString())
    }
}
`;

const BUILD_APPEND = `
// Added by tools/build/material-shapes.mjs (temporary copy only).
dependencies {
    testImplementation("junit:junit:4.13.2")
}
`;

const quoteWin = a => (/[\s"&|<>^()]/.test(a) ? `"${a.replace(/"/g, '""')}"` : a);

function runGradle(projectDir, args, env) {
  return new Promise(res => {
    const win = process.platform === 'win32';
    const child = win
      ? spawn(process.env.ComSpec || 'cmd.exe', ['/d', '/s', '/c', `"${[join(projectDir, 'gradlew.bat'), ...args].map(quoteWin).join(' ')}"`], {
        cwd: projectDir, env, windowsHide: true, windowsVerbatimArguments: true,
      })
      : spawn('sh', [join(projectDir, 'gradlew'), ...args], { cwd: projectDir, env });
    let output = '';
    child.stdout.on('data', d => { output += d; });
    child.stderr.on('data', d => { output += d; });
    child.on('error', e => { output += `\n${e.message}`; });
    child.on('close', code => res({ code, output }));
  });
}

// Returns { material3, shapes: [{ name, cubics }] } in source order.
export async function dumpFromJvm() {
  const source = readFileSync(join(sourceDir('compose-material3'), ...SOURCE_REL.split('/')), 'utf8');
  const order = publicShapeNames(source);
  const work = mkdtempSync(join(tmpdir(), 'm3-material-shapes-'));
  try {
    const project = join(work, 'project');
    cpSync(FIXTURE, project, { recursive: true, filter: src => !/[\\/](?:build|\.gradle|\.kotlin)$/.test(src) });
    const testDir = join(project, 'app/src/test/kotlin/com/example/fixture');
    mkdirSync(testDir, { recursive: true });
    writeFileSync(join(testDir, 'MaterialShapesDump.kt'), DUMP_TEST);
    appendFileSync(join(project, 'app/build.gradle.kts'), BUILD_APPEND);
    const toml = readFileSync(join(project, 'gradle/libs.versions.toml'), 'utf8');
    if (!toml.includes(`material3 = "${MATERIAL3}"`)) throw new Error(`fixture is not on material3 ${MATERIAL3}`);
    const args = ['--no-daemon', '--console=plain', ':app:testDebugUnitTest', '--tests', '*MaterialShapesDump*',
      '-Pandroid.builder.sdkDownload=false', '-Pkotlin.compiler.execution.strategy=in-process'];
    const r = await runGradle(project, args, withToolchain(process.env));
    const out = join(project, 'app/build/m3-material-shapes.json');
    if (r.code !== 0 || !existsSync(out)) throw new Error(`Gradle failed (${r.code}):\n${r.output.split('\n').slice(-60).join('\n')}`);
    const dumped = JSON.parse(readFileSync(out, 'utf8')).shapes;
    const byName = new Map(dumped.map(s => [s.name, s.cubics]));
    const missing = order.filter(n => !byName.has(n));
    const extra = dumped.map(s => s.name).filter(n => !order.includes(n));
    if (missing.length || extra.length) throw new Error(`source and JVM disagree: missing ${missing}, extra ${extra}`);
    return { material3: MATERIAL3, shapes: order.map(name => ({ name, cubics: byName.get(name) })) };
  } finally {
    rmSync(work, { recursive: true, force: true });
  }
}

export const formatJson = data => `{\n  "_comment": ${JSON.stringify(
  'Generated by tools/build/material-shapes.mjs --dump: the cubics [anchor0X, anchor0Y, control0X, control0Y, ' +
  'control1X, control1Y, anchor1X, anchor1Y] of every public MaterialShapes.<Name> RoundedPolygon, read on the JVM ' +
  'from androidx.compose.material3:material3 (version below), in MaterialShapes.kt source order. Do not edit by hand.',
)},\n  "material3": ${JSON.stringify(data.material3)},\n  "shapes": [\n${data.shapes.map(s =>
  `    { "name": ${JSON.stringify(s.name)}, "cubics": [\n${s.cubics.map(c => `      ${JSON.stringify(c)}`).join(',\n')}\n    ] }`).join(',\n')}\n  ]\n}\n`;

export const readCubics = () => JSON.parse(readFileSync(CUBICS_JSON, 'utf8'));

if (resolve(process.argv[1] || '') === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  if (args.includes('--dump')) {
    const data = await dumpFromJvm();
    writeFileSync(CUBICS_JSON, formatJson(data));
    console.log(`material-shapes.json: ${data.shapes.length} shapes`);
  }
  const css = buildShapesCss(readCubics());
  if (args.includes('--check')) {
    const now = existsSync(SHAPES_CSS) ? readFileSync(SHAPES_CSS, 'utf8').replace(/\r\n/g, '\n') : '';
    if (now !== css) {
      console.error('shapes.css is out of date: run node tools/build/material-shapes.mjs');
      process.exit(1);
    }
    console.log('shapes.css is up to date');
  } else {
    writeFileSync(SHAPES_CSS, css);
    console.log(`shapes.css: ${Buffer.byteLength(css)} bytes`);
  }
}
