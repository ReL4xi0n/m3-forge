// The resolution ladder (spec §3, knowledge/README.md "Precedence" rules 1, 2, 5 and 6).
// For one merged.json entry and one platform:
//   own              the platform's own repository has a usable value (rule 1)
//   cross-source:<r> rung 1: the same token (same id and mode) has a concrete value in another
//                    official repository; tried in RUNG1_ORDER (rule 2: material-web is canonical)
//   derived:<sys>    rung 2: no repository gives a concrete value, but one maps the token to a sys
//                    token by reference ({ref: md.sys...}); the platform uses its own value of that
//                    sys token. Only references present in the data count, never a guess.
//   library-default  rung 3: nothing usable; Flutter and Compose keep the library default, the web
//                    omits the property (value null)
// Values are copied verbatim from merged.json; a number is never computed or converted here.
import { NOT_FOUND, fmt } from '../extract/tokens/merge.mjs';

export const PLATFORMS = { web: 'material-web', flutter: 'material_ui', compose: 'compose-material3' };
export const ANDROID_VIEWS = 'material-components-android';
export const RUNG1_ORDER = {
  web: ['compose-material3', 'material_ui', ANDROID_VIEWS],
  flutter: ['material-web', 'compose-material3', ANDROID_VIEWS],
  compose: ['material-web', 'material_ui', ANDROID_VIEWS],
};

export const keyOf = e => (e.mode ? `${e.id}@${e.mode}` : e.id);

// A value is usable unless it is NOT FOUND or an unparsed raw that carries no value
// (material-web writes `/* Type "custom_composite" is not supported. */ null`).
export function usable(v) {
  if (v === NOT_FOUND || v == null) return false;
  if (v.unparsed !== undefined) return String(v.unparsed).replace(/\/\*[\s\S]*?\*\//g, '').trim() !== 'null';
  return true;
}

function valueIn(entry, repo) {
  if (repo === ANDROID_VIEWS) return entry.crossCheck?.['android-views'] ?? NOT_FOUND;
  const p = Object.keys(PLATFORMS).find(k => PLATFORMS[k] === repo);
  return entry.perPlatform[p];
}

// A reference target counts as a mapping when the data defines that token (or tokens under it,
// e.g. md.sys.typescale.label-large for .font/.size/...; idSet() adds those prefixes). Without
// `ids` every md.sys ref counts.
const knownTarget = (ref, ids) => !ids || ids.has(ref) || ids.has(`${ref}.`);

export function resolveEntry(entry, platform, { ids = null } = {}) {
  const own = entry.perPlatform[platform];
  if (usable(own)) return { value: own, provenance: 'own' };
  let mapping = null;
  for (const repo of RUNG1_ORDER[platform]) {
    const v = valueIn(entry, repo);
    if (!usable(v)) continue;
    if (v.ref && v.ref.startsWith('md.sys.') && knownTarget(v.ref, ids)) {
      mapping ??= { repo, sys: v.ref };
      continue;
    }
    return { value: v, provenance: `cross-source:${repo}` };
  }
  if (mapping) return { value: { ref: mapping.sys }, provenance: `derived:${mapping.sys}` };
  return { value: null, provenance: 'library-default' };
}

// Which repository a derived mapping came from (for the reasoning line in not-found.md).
function mappingRepo(entry, platform, sys) {
  return RUNG1_ORDER[platform].find(r => valueIn(entry, r)?.ref === sys);
}

export const idSet = merged => {
  const s = new Set();
  for (const e of merged) {
    if (e.deprecated) continue;
    s.add(e.id);
    const parts = e.id.split('.');
    for (let i = 1; i < parts.length; i++) s.add(`${parts.slice(0, i).join('.')}.`);
  }
  return s;
};

// Every rung-1 and rung-2 use, in merged.json order then platform order (deterministic).
export function ladderUses(merged) {
  const ids = idSet(merged);
  const uses = [];
  for (const e of merged) {
    if (e.deprecated) continue;
    for (const platform of Object.keys(PLATFORMS)) {
      const r = resolveEntry(e, platform, { ids });
      if (r.provenance === 'own' || r.provenance === 'library-default') continue;
      const use = { key: keyOf(e), platform, provenance: r.provenance, value: r.value };
      if (r.provenance.startsWith('derived:')) use.from = mappingRepo(e, platform, r.value.ref);
      uses.push(use);
    }
  }
  return uses;
}

export function ladderUseLine(u) {
  const why = u.provenance.startsWith('derived:') ? `${u.from} maps it to ${u.value.ref}` : fmt(u.value);
  return `- ${u.key}: ${u.platform} ${u.provenance} (${why})`;
}

export function ladderSection(merged) {
  const uses = ladderUses(merged);
  const out = [`## Ladder uses (skill tokens): ${uses.length}`, '',
    'Generated from the merged tokens with `tools/build/ladder.mjs`; the skill token files',
    '(`tools/build/tokens.mjs`) use exactly these values. Rung 1 `cross-source:<repo>`: the same token',
    '(same id and mode) from another official repository, in the order material-web, the other platform,',
    'Android views (own repository first). Rung 2 `derived:<sys-token>`: no repository gives a concrete',
    'value, and the reason line names the repository whose reference maps the token to that sys token;',
    "the platform uses its own value of it. Rung 3 (library default / omitted on the web) is not listed.", ''];
  for (const platform of Object.keys(PLATFORMS)) {
    const mine = uses.filter(u => u.platform === platform);
    const counts = {};
    for (const u of mine) { const k = u.provenance.startsWith('derived:') ? 'derived' : u.provenance; counts[k] = (counts[k] || 0) + 1; }
    out.push(`### ${platform} (${PLATFORMS[platform]}): ${mine.length} uses (${Object.entries(counts).sort().map(([k, n]) => `${k}: ${n}`).join(', ') || 'none'})`, '');
    for (const u of mine) out.push(ladderUseLine(u));
    out.push('');
  }
  return out.join('\n');
}
