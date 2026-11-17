// Total size of the skill folder; CI fails above 25 MB.
import { readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const MAX_BYTES = 25 * 1024 * 1024;

export function skillSize(dir) {
  let bytes = 0;
  let files = 0;
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) {
      const s = skillSize(p);
      bytes += s.bytes;
      files += s.files;
    } else if (e.isFile()) {
      bytes += statSync(p).size;
      files += 1;
    }
  }
  return { bytes, files };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const dir = fileURLToPath(new URL('../../plugin/skills/material3', import.meta.url));
  const { bytes, files } = skillSize(dir);
  console.log(`skill size: ${bytes} bytes in ${files} files (limit ${MAX_BYTES})`);
  if (bytes > MAX_BYTES) { console.error('skill is larger than 25 MB'); process.exit(1); }
}
