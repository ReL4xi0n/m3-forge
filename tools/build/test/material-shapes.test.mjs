// Compose MaterialShapes as web masks (tools/build/material-shapes.mjs).
//   Static: shapes.css is what the tool writes from the committed cubics (material-shapes.json),
//   every path is one closed subpath inside the 0..1 box, the shapes are centered in that box (so
//   toShape()'s re-centering moves nothing), one class per shape, and the shape list is the public
//   MaterialShapes vals of the pinned source (when the toolchain sources are present).
//   Toolchain (M3_TOOLCHAIN_TESTS=1): a fresh JVM dump of the official library equals the committed JSON.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { sourceDir } from '../../extract/sources/lock.mjs';
import { buildShapesCss, dumpFromJvm, kebab, pathData, publicShapeNames, readCubics, SHAPES_CSS } from '../material-shapes.mjs';

const data = readCubics();
const css = readFileSync(SHAPES_CSS, 'utf8').replace(/\r\n/g, '\n');
const SOURCE = join(sourceDir('compose-material3'), 'commonMain/androidx/compose/material3/MaterialShapes.kt');
const toolchain = process.env.M3_TOOLCHAIN_TESTS !== '1' && 'needs the local toolchain (M3_TOOLCHAIN_TESTS=1)';

test('shapes.css is what the tool writes from material-shapes.json (--check)', () => {
  assert.equal(css, buildShapesCss(data));
});

test('35 shapes, each with one class and its provenance', () => {
  assert.equal(data.material3, '1.5.0-rc01');
  assert.equal(data.shapes.length, 35);
  for (const s of data.shapes) {
    assert.ok(css.includes(`/* [impl: compose-material3 1.5.0-rc01 MaterialShapes.${s.name}] */\n.m3-shape--${kebab(s.name)} {\n  mask-image: url("data:image/svg+xml,`), s.name);
  }
  assert.equal(new Set(data.shapes.map(s => kebab(s.name))).size, 35);
  assert.equal(kebab('Cookie9Sided'), 'cookie-9-sided');
  assert.equal(kebab('Clover4Leaf'), 'clover-4-leaf');
  assert.equal(kebab('SemiCircle'), 'semi-circle');
});

test('the shape list is the public MaterialShapes vals of the pinned source', { skip: !existsSync(SOURCE) && 'Compose sources not fetched' }, () => {
  assert.deepEqual(data.shapes.map(s => s.name), publicShapeNames(readFileSync(SOURCE, 'utf8')));
});

test('every path is one closed subpath of cubics inside the 0..1 box', () => {
  for (const s of data.shapes) {
    const d = pathData(s.cubics);
    assert.match(d, /^M[^MZ]+Z$/, s.name);
    // The cubics chain: each one starts where the previous ends, and the last ends at the start.
    s.cubics.forEach((c, i) => {
      const next = s.cubics[(i + 1) % s.cubics.length];
      assert.ok(Math.hypot(c[6] - next[0], c[7] - next[1]) < 1e-6, `${s.name}: cubic ${i} does not meet the next`);
    });
    const nums = d.match(/-?\d*\.?\d+/g).map(Number);
    assert.equal(nums.length, 2 + 6 * s.cubics.length, s.name);
    for (const n of nums) assert.ok(n >= 0 && n <= 1, `${s.name}: ${n}`);
    // The path's embedded copy in shapes.css.
    assert.ok(css.includes(`%3Cpath d='${d}'/%3E`), s.name);
  }
});

// RoundedPolygon.normalized() fits the shape's control points into the 1x1 box, centered;
// toShape() then centers the path's control-point bounds in the element (MaterialShapes.kt:115-119),
// which therefore moves nothing.
test('every shape is centered in the box and touches two opposite sides', () => {
  for (const s of data.shapes) {
    const xs = s.cubics.flatMap(c => [c[0], c[2], c[4], c[6]]);
    const ys = s.cubics.flatMap(c => [c[1], c[3], c[5], c[7]]);
    const [x0, x1, y0, y1] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
    assert.ok(Math.abs((x0 + x1) / 2 - 0.5) < 1e-5 && Math.abs((y0 + y1) / 2 - 0.5) < 1e-5, `${s.name}: not centered`);
    assert.ok(Math.abs(Math.max(x1 - x0, y1 - y0) - 1) < 1e-5, `${s.name}: does not fill the box`);
  }
});

test('the JVM dump of the official library equals the committed cubics', { skip: toolchain, timeout: 900_000 }, async () => {
  assert.deepEqual(await dumpFromJvm(), { material3: data.material3, shapes: data.shapes });
});
