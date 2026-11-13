// Merge per-source token records into one view per token key (id + mode).
// Precedence (spec §11): a platform uses the value from its own repository; the cross-platform
// canonical value is material-web's; site vs repo -> the repo wins. Disagreements are conflicts.
import { buildIndex } from './model.mjs';

export const PLATFORMS = { web: 'material-web', flutter: 'material_ui', compose: 'compose-material3' };
export const CROSS_CHECK = { 'android-views': 'material-components-android' };
export const NOT_FOUND = 'NOT FOUND';
const NUMERIC = new Set(['dp', 'sp', 'ms', 'number']);
const kindOf = v => Object.keys(v)[0];
const keyOf = r => (r.mode ? `${r.id}@${r.mode}` : r.id);

function resolve(value, index) {
  let v = value;
  for (let hops = 0; v.ref && index && hops < 10; hops++) {
    const r = index.get(v.ref);
    if (!r) break;
    v = r.value;
  }
  return v;
}

// 'same' | 'different' | 'not-compared'. Refs are followed inside their own source first; a unitless
// {number} (Flutter) is compared with any numeric unit by magnitude only.
export function compare(a, b, indexA = null, indexB = null) {
  if (a.ref && b.ref && a.ref === b.ref) return 'same';
  const x = resolve(a, indexA);
  const y = resolve(b, indexB);
  if (x.ref && y.ref) return x.ref === y.ref ? 'same' : 'different';
  if (x.ref || y.ref) return 'not-compared';
  const kx = kindOf(x);
  const ky = kindOf(y);
  if (kx === 'unparsed' || ky === 'unparsed') return 'not-compared';
  if (NUMERIC.has(kx) && NUMERIC.has(ky)) {
    if (kx !== ky && kx !== 'number' && ky !== 'number') return 'different';
    return x[kx] === y[ky] ? 'same' : 'different';
  }
  if (kx !== ky) return 'not-compared';
  return JSON.stringify(x[kx]) === JSON.stringify(y[ky]) ? 'same' : 'different';
}

const componentOf = id => {
  const p = id.split('.');
  return p[1] === 'comp' ? p[2] : `${p[1]}.${p[2]}`;
};
const prov = r => (r ? { source: r.source, file: r.file, line: r.line } : null);

export function merge(bySource, siteValues = []) {
  const sources = Object.keys(bySource).sort();
  const indexes = Object.fromEntries(sources.map(s => [s, buildIndex(bySource[s])]));
  const keys = [...new Set(sources.flatMap(s => [...indexes[s].keys()]))].sort();

  const merged = [];
  const conflicts = [];
  const notFound = { web: [], flutter: [], compose: [] };
  const deprecated = new Set();
  const collapsed = { web: new Map(), flutter: new Map(), compose: new Map() };

  for (const key of keys) {
    const recs = Object.fromEntries(sources.map(s => [s, indexes[s].get(key)]).filter(([, r]) => r));
    const any = Object.values(recs)[0];
    const { id, mode } = any;
    const isDerived = Object.values(recs).every(r => r.derived);
    const isDeprecated = Object.values(recs).some(r => r.deprecated);
    if (isDeprecated) deprecated.add(id);
    const valueIn = src => (recs[src] ? recs[src].value : NOT_FOUND);
    merged.push({
      id, ...(mode ? { mode } : {}),
      canonical: valueIn(PLATFORMS.web),
      perPlatform: Object.fromEntries(Object.entries(PLATFORMS).map(([p, s]) => [p, valueIn(s)])),
      crossCheck: Object.fromEntries(Object.entries(CROSS_CHECK).map(([p, s]) => [p, valueIn(s)])),
      provenance: {
        canonical: prov(recs[PLATFORMS.web]),
        ...Object.fromEntries(Object.entries({ ...PLATFORMS, ...CROSS_CHECK }).map(([p, s]) => [p, prov(recs[s])])),
      },
      ...(isDerived ? { derived: true } : {}), ...(isDeprecated ? { deprecated: true } : {}),
    });

    const present = Object.keys(recs);
    const diff = [];
    for (let i = 0; i < present.length; i++) {
      for (let j = i + 1; j < present.length; j++) {
        const [a, b] = [present[i], present[j]];
        if (compare(recs[a].value, recs[b].value, indexes[a], indexes[b]) === 'different') diff.push([a, b]);
      }
    }
    if (diff.length) {
      conflicts.push({
        id, ...(mode ? { mode } : {}), kind: 'repo-vs-repo',
        values: present.map(s => ({ where: s, value: recs[s].value })).sort((p, q) => p.where.localeCompare(q.where)),
        pairs: diff, winner: 'each platform keeps its own value; canonical = material-web',
      });
    }

    if (isDerived || isDeprecated) continue;
    for (const [p, src] of Object.entries(PLATFORMS)) {
      if (recs[src]) continue;
      const component = componentOf(id);
      const prefix = id.split('.').slice(0, 3).join('.') + '.';
      const platformHasComponent = [...indexes[src]?.keys() ?? []].some(k => k.startsWith(prefix));
      if (!platformHasComponent && id.split('.')[1] === 'comp') {
        const c = collapsed[p].get(component) || new Set();
        present.forEach(s => c.add(s));
        collapsed[p].set(component, c);
      } else {
        notFound[p].push({ id, ...(mode ? { mode } : {}), component, availableIn: present.slice().sort() });
      }
    }
  }
  for (const p of Object.keys(notFound)) {
    for (const [component, set] of collapsed[p]) notFound[p].push({ id: `${component}.*`, component, availableIn: [...set].sort() });
    notFound[p].sort((a, b) => a.component.localeCompare(b.component) || a.id.localeCompare(b.id));
  }

  for (const sv of siteValues) {
    if (!sv.token) continue;
    const src = indexes[PLATFORMS.web]?.get(sv.token) ? PLATFORMS.web
      : sources.find(s => indexes[s].get(sv.token));
    if (!src) continue;
    const repo = indexes[src].get(sv.token);
    if (compare(sv.value, repo.value, null, indexes[src]) === 'different') {
      conflicts.push({
        id: sv.token, kind: 'site-vs-repo',
        values: [{ where: `site:${sv.page}`, value: sv.value }, { where: src, value: repo.value }],
        winner: src, note: sv.note, line: sv.line,
      });
    }
  }

  const all = sources.flatMap(s => bySource[s]);
  return {
    merged, conflicts, notFound,
    deprecated: [...deprecated].sort(),
    unparsed: all.filter(r => r.value && r.value.unparsed !== undefined),
    unmapped: all.filter(r => !r.id || r.derived),
  };
}

export { keyOf };
