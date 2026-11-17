// Icon-name validation against the official Material Symbols codepoints file
// (one "<name> <hex>" pair per line), bundled with the skill. Offline.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

export const CODEPOINTS_FILE = fileURLToPath(
  new URL('../../assets/fonts/MaterialSymbolsOutlined.codepoints', import.meta.url),
);

let cache = null;

export function loadCodepoints(file = CODEPOINTS_FILE) {
  if (file === CODEPOINTS_FILE && cache) return cache;
  const map = new Map();
  for (const line of readFileSync(file, 'utf8').split(/\r?\n/)) {
    const [name, hex] = line.trim().split(/\s+/);
    if (name && hex) map.set(name, hex);
  }
  if (file === CODEPOINTS_FILE) cache = map;
  return map;
}

// Levenshtein edit distance with two rolling rows.
export function editDistance(a, b) {
  if (a === b) return 0;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    prev = cur;
  }
  return prev[b.length];
}

// Up to three closest known names, closest first; ties by length gap, then alphabetically.
export function suggest(name, known, limit = 3) {
  return [...known]
    .map((k) => ({ k, d: editDistance(name, k), g: Math.abs(k.length - name.length) }))
    .sort((x, y) => x.d - y.d || x.g - y.g || (x.k < y.k ? -1 : 1))
    .slice(0, limit)
    .map((x) => x.k);
}

// checkNames(names) -> { known: string[], unknown: [{ name, suggestions: string[] }] }
export function checkNames(names, file) {
  const codepoints = loadCodepoints(file);
  const known = [];
  const unknown = [];
  for (const name of names) {
    if (codepoints.has(name)) known.push(name);
    else unknown.push({ name, suggestions: suggest(name, codepoints.keys()) });
  }
  return { known, unknown };
}
