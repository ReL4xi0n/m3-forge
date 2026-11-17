// Overfitting guard: the skill must not contain distinct terms of the eval requests
// (product names, quoted UI strings, numbers with units). Usage: node tools/ci/overfit.mjs
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, resolve, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const TEXT_EXT = new Set(['.md', '.mjs', '.js', '.css', '.dart', '.kt', '.json', '.tsv']);
const MAX_BYTES = 1024 * 1024;
const SKIP_DIRS = new Set(['node_modules', '.git']);
const MIN_LENGTH = 5;
const STOP = new Set(['Material', 'Android', 'Flutter', 'Compose', 'Jetpack', 'Platform', 'Expressive', 'Design']);

export function devCells() {
  return JSON.parse(readFileSync(join(repoRoot, 'evals', 'dev', 'cells.json'), 'utf8'));
}

export function distinctTerms(markdown) {
  const terms = new Set();
  const text = markdown.replace(/^#.*$/gm, '');
  for (const m of text.matchAll(/"([^"\n]+)"/g)) terms.add(m[1].trim());
  const unquoted = text.replace(/"[^"\n]*"/g, ' ');
  for (const m of unquoted.matchAll(/\$\d+(?:,\d{3})*(?:\.\d+)?/g)) terms.add(m[0]);
  for (const m of unquoted.matchAll(/\b\d[\d,.]*\s?(?:%|reviews|units|days|minutes|seconds|EUR|USD)(?![A-Za-z])/g)) terms.add(m[0]);
  // Capitalized words that are not the first word of a sentence, line or list item.
  for (const m of unquoted.matchAll(/(?<![.!?:;]\s)(?<!^\s*)(?<!^\s*[-\d.]+\s+)(?<=[\p{L}\d,)(]\s+)\b[A-Z][a-z]{3,}\b/gmu)) {
    if (!STOP.has(m[0])) terms.add(m[0]);
  }
  return [...terms].filter(t => t.length >= MIN_LENGTH || /\d/.test(t)).sort();
}

function* textFiles(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) { if (!SKIP_DIRS.has(name)) yield* textFiles(p); }
    else if (TEXT_EXT.has(extname(name).toLowerCase()) && st.size <= MAX_BYTES) yield p;
  }
}

export function overfitHits(skillDir, promptsDir) {
  const terms = new Set();
  for (const f of readdirSync(promptsDir)) {
    if (!f.endsWith('.md') || f === 'variants.md') continue;
    for (const t of distinctTerms(readFileSync(join(promptsDir, f), 'utf8'))) terms.add(t);
  }
  const hits = [];
  for (const file of textFiles(skillDir)) {
    const body = readFileSync(file, 'utf8').toLowerCase();
    for (const term of terms) if (body.includes(term.toLowerCase())) hits.push({ file, term });
  }
  return hits;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const hits = overfitHits(join(repoRoot, 'plugin', 'skills', 'material3'), join(repoRoot, 'evals', 'prompts'));
  for (const h of hits) console.error(`overfit: "${h.term}" in ${h.file}`);
  if (hits.length) process.exit(1);
  console.log('overfit: no eval terms in the skill');
}
