// The Flutter theme compiles, renders and passes verify under both library imports
// (M3_TOOLCHAIN_TESTS=1, local toolchain; one Flutter build at a time). Images go to out/gallery/flutter/.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { statSync } from 'node:fs';
import { join } from 'node:path';

import { runGallery, widgetsFor } from './run.mjs';

const IMAGES = {
  'loading-indicator': ['loading_indicator_dark.png', 'loading_indicator_light.png'],
  'button-group': ['button_group_dark.png', 'button_group_light.png'],
  'fab-menu': ['fab_menu_dark.png', 'fab_menu_light.png'],
  'split-button': ['split_button_dark.png', 'split_button_light.png'],
};

const skip = process.env.M3_TOOLCHAIN_TESTS !== '1' && 'needs the local toolchain (M3_TOOLCHAIN_TESTS=1)';

for (const library of ['material_ui', 'material']) {
  test(`Flutter theme gallery under ${library}: analyze, goldens, verify`, { skip, timeout: 15 * 60_000 }, async () => {
    const r = await runGallery(library);
    assert.equal(r.analyze.code, 0, r.analyze.out);
    assert.equal(r.test.code, 0, r.test.out.slice(-4000));
    const expected = ['classic_dark.png', 'classic_light.png', 'expressive_dark.png', 'expressive_light.png', 'symbols_axes.png', ...widgetsFor(library).flatMap(w => IMAGES[w])].sort();
    assert.deepEqual(r.images, expected);
    for (const n of r.images) assert.ok(statSync(join(r.dir, n)).size > 10_000, `${n} is not an empty image`);
    // The installed assets, the generated schemes and the sample screen report no findings at all.
    assert.deepEqual(r.verify.violations, []);
  });
}
