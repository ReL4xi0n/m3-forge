// Shared selection and formatting for the token emitters (web.mjs, flutter.mjs, compose.mjs).
//
// Input: the `sys` part of buildSkillTokens() (tools/build/tokens.mjs): key ("<id>" or "<id>@<mode>")
// -> { web, flutter, compose } cells, each [value, provenance]; value null = library default.
// Rules (controller rulings R1, R5, R8 and the Task 4 carry-over):
// - numbers are copied from the cells, never computed, rounded or converted; a raw CSS string
//   ({unparsed}) is used on another platform only where the parse is exact, otherwise skipped;
// - a unitless {number} gets its unit from the token kind (measurement/shape/elevation/state -> dp,
//   type size/line-height/tracking -> sp on Compose, logical pixels on Flutter, px on the web);
// - an "<id>@<mode>" key wins over a mode-less key with the same id;
// - the spacing scale keeps only the md.sys.measurement steps on the 4 dp grid (R1);
// - color is not emitted here (scripts/color writes the scheme).
// Every emitted line that carries a value ends with a trace comment naming its token key(s).

export const ROLES = ['display', 'headline', 'title', 'body', 'label']
  .flatMap(g => ['large', 'medium', 'small'].map(s => `${g}-${s}`));
export const TYPE_ATTRS = ['font', 'weight', 'size', 'line-height', 'tracking'];

// Uniform corner steps in scale order; the Expressive-only ones fall back to a standard step in
// Classic Material 3 (the step they enlarge; extra-extra-large to the largest classic step).
export const SHAPE_STEPS = ['none', 'extra-small', 'small', 'medium', 'large', 'large-increased', 'extra-large',
  'extra-large-increased', 'extra-extra-large', 'full'];
export const EXPRESSIVE_SHAPES = { 'large-increased': 'large', 'extra-large-increased': 'extra-large', 'extra-extra-large': 'extra-large' };

export const SPRING_SPEEDS = ['fast', 'default', 'slow'];
export const SPRING_KINDS = ['spatial', 'effects'];
export const MOTION_MODES = ['standard', 'expressive'];
export const DURATION_GROUPS = ['short', 'medium', 'long', 'extra-long'];

export const camel = s => s.replace(/[-.]([a-z0-9])/g, (_, c) => c.toUpperCase());
export const num = n => String(n);

// The cell of `id` (preferring `id@mode`) on `platform`: { key, value, provenance } or null.
export function cell(sys, id, platform, mode = null) {
  const key = mode && sys[`${id}@${mode}`] ? `${id}@${mode}` : id;
  const c = sys[key];
  if (!c) return null;
  const [value, provenance] = c[platform];
  return { key, value, provenance };
}

// Follows {ref} values to a concrete one: { keys: [key, ...targets], value } or null when a link is
// missing or left at the library default.
export function deref(sys, id, platform, mode = null) {
  const keys = [];
  let c = cell(sys, id, platform, mode);
  for (let i = 0; c && i < 8; i++) {
    keys.push(c.key);
    if (c.value === null) return null;
    if (!c.value.ref) return { keys, value: c.value };
    c = cell(sys, c.value.ref, platform);
  }
  return null;
}

// Ids present in `sys` (mode-less part) that start with `prefix`, in file order, without duplicates.
export function idsUnder(sys, prefix) {
  const seen = new Set();
  for (const k of Object.keys(sys)) {
    const id = k.split('@')[0];
    if (id.startsWith(prefix)) seen.add(id);
  }
  return [...seen];
}

export const durationIds = sys => idsUnder(sys, 'md.sys.motion.duration.').sort((a, b) => {
  const pa = a.match(/\.([a-z-]+)(\d+)$/);
  const pb = b.match(/\.([a-z-]+)(\d+)$/);
  return DURATION_GROUPS.indexOf(pa[1]) - DURATION_GROUPS.indexOf(pb[1]) || Number(pa[2]) - Number(pb[2]);
});

export const easingIds = sys => idsUnder(sys, 'md.sys.motion.easing.');
export const elevationIds = sys => idsUnder(sys, 'md.sys.elevation.level');
export const stateIds = sys => idsUnder(sys, 'md.sys.state.');
export const typefaceIds = sys => idsUnder(sys, 'md.ref.typeface.');
// Corner variants with a side (`md.sys.shape.corner.large.top`).
export const sideShapeIds = sys => idsUnder(sys, 'md.sys.shape.corner.').filter(id => /^md\.sys\.shape\.corner\.[a-z-]+\.[a-z]+$/.test(id));

// The spacing steps: [{ id, step, n }] for md.sys.measurement.space<step> whose value on this
// platform is a plain number on the 4 dp grid (ruling R1); `skipped` gets the others.
export function spaceSteps(sys, platform, skipped) {
  const out = [];
  for (const id of idsUnder(sys, 'md.sys.measurement.space')) {
    const step = id.match(/space(\d+)$/)?.[1];
    const c = cell(sys, id, platform);
    const n = c?.value?.number ?? c?.value?.dp;
    if (step === undefined || typeof n !== 'number') {
      skipped.push({ key: id, platform, reason: 'no numeric value' });
      continue;
    }
    if (n % 4 !== 0) {
      skipped.push({ key: id, platform, reason: `${n} is off the 4 dp grid (ruling R1)` });
      continue;
    }
    out.push({ id, step, n });
  }
  return out.sort((a, b) => a.n - b.n);
}

// A dp-kind magnitude: {dp} or a unitless {number}. null otherwise.
export const dpOf = v => (v && typeof v.dp === 'number' ? v.dp : v && typeof v.number === 'number' ? v.number : null);

// Header comment lines (without comment syntax). Line 1 is the asset marker (rulings R5/R8).
export function headerLines(assetPath, about) {
  return [
    `material3 skill asset: ${assetPath}`,
    about,
    'Built from the skill token files (tokens/sys.json); generated, do not edit.',
  ];
}
