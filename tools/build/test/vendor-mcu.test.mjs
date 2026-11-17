import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ARCHIVE, VENDOR_DIR, addJsToSpecifiers, readArchive, treeHash, vendorPlan } from '../vendor-mcu.mjs';

const root = fileURLToPath(new URL('../../../', import.meta.url));
const skill = join(root, 'plugin/skills/material3');
const versions = JSON.parse(readFileSync(join(skill, 'versions.json'), 'utf8'));
const lock = JSON.parse(readFileSync(join(root, 'knowledge/sources.lock.json'), 'utf8'));
const pinned = lock.sources.find(s => s.id === 'material-color-utilities');
const entry = versions.tools.find(t => t.name === '@material/material-color-utilities');
const sha = b => createHash('sha256').update(b).digest('hex');

function vendoredFiles(dir = VENDOR_DIR, prefix = '') {
  const out = [];
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (e.isDirectory()) out.push(...vendoredFiles(join(dir, e.name), `${prefix}${e.name}/`));
    else out.push(`${prefix}${e.name}`);
  }
  return out.sort();
}

test('versions.json records MCU: version, archive hash from the lock, tree hash of the listed files', () => {
  assert.ok(entry, 'tools entry for @material/material-color-utilities');
  assert.equal(entry.version, '0.4.0');
  assert.equal(entry.version, versions.mcu);
  assert.equal(entry.archive.sha256, pinned.sha256);
  assert.equal(entry.path, 'scripts/color/vendor/mcu');
  assert.match(entry.modified, /import specifiers only/);
  assert.deepEqual(entry.tree.files, vendoredFiles());
  assert.equal(entry.tree.sha256, treeHash(VENDOR_DIR, entry.tree.files));
  assert.ok(entry.tree.files.includes('LICENSE'));
  assert.ok(entry.tree.files.includes('package.json'));
});

test('addJsToSpecifiers only appends .js to extensionless relative specifiers', () => {
  const src = "import { A } from './a';\nimport { B } from '../b/b.js';\nexport * from './c';\nimport x from 'pkg';\n";
  const r = addJsToSpecifiers(src);
  assert.equal(r.text, "import { A } from './a.js';\nimport { B } from '../b/b.js';\nexport * from './c.js';\nimport x from 'pkg';\n");
  assert.deepEqual(r.changed, ['./a', './c']);
});

test('the vendored tree equals the pinned 0.4.0 archive except the added .js specifiers',
  { skip: !existsSync(ARCHIVE) && `pinned archive not present (${ARCHIVE})` }, () => {
    const buf = readFileSync(ARCHIVE);
    assert.equal(sha(buf), pinned.sha256, 'archive SHA-256 equals sources.lock.json');
    const upstream = readArchive(buf);
    // Upstream 0.4.0 has exactly 10 extensionless relative specifiers (9 scheme files + color_spec_2025).
    let total = 0;
    for (const [p, b] of upstream) if (p.endsWith('.js')) total += addJsToSpecifiers(b.toString('utf8')).changed.length;
    assert.equal(total, 10);
    let patched = 0;
    for (const rel of entry.tree.files) {
      const up = upstream.get(rel);
      assert.ok(up, `${rel} exists upstream`);
      const ours = readFileSync(join(VENDOR_DIR, ...rel.split('/')));
      if (ours.equals(up)) continue;
      const fixed = addJsToSpecifiers(up.toString('utf8'));
      assert.ok(fixed.changed.length > 0, `${rel} differs from upstream without a specifier fix`);
      assert.equal(ours.toString('utf8'), fixed.text, `${rel}: only the specifiers may differ`);
      patched += fixed.changed.length;
    }
    assert.ok(patched >= 1);
    // A fresh plan from the archive gives exactly the committed tree.
    const plan = vendorPlan(upstream);
    assert.deepEqual([...plan.keys()].sort(), entry.tree.files);
  });
