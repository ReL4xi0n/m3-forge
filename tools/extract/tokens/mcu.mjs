// material-color-utilities (npm package): variant names, color-role names and spec versions exactly as
// written, plus every place a Variant is chosen (evidence for the default variant per style, which is
// decided in the knowledge notes from all sources, never here).
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { listFiles } from './model.mjs';

export async function extractMcu(dir) {
  const read = rel => readFile(join(dir, rel), 'utf8');
  const variants = [...(await read('dynamiccolor/variant.js')).matchAll(/Variant\["([A-Z_]+)"\]\s*=\s*\d+/g)].map(m => m[1]);
  const specVersions = [...new Set([...(await read('dynamiccolor/color_spec.js')).matchAll(/'(20\d\d)'/g)].map(m => m[1]))].sort();

  const js = (await listFiles(dir, n => n.endsWith('.js'))).filter(f => !f.rel.endsWith('.map'));
  const roles = new Set();
  const defaultVariantEvidence = [];
  for (const f of js) {
    const text = await readFile(f.abs, 'utf8');
    if (f.rel.startsWith('dynamiccolor/')) for (const m of text.matchAll(/\bname:\s*'([a-z0-9_]+)'/g)) roles.add(m[1]);
    text.split(/\r?\n/).forEach((line, i) => {
      if (/Variant\.[A-Z_]+/.test(line) && !/\bcase\b|===|!==/.test(line)) {
        defaultVariantEvidence.push({ file: f.rel, line: i + 1, text: line.trim() });
      }
    });
  }
  return { variants, roles: [...roles].sort(), specVersions, defaultVariantEvidence };
}
