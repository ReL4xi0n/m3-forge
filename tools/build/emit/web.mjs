// Web emitter: assets/web/tokens.css (CSS custom properties and type role classes).
//   --md-ref-typeface-*, --md-sys-typescale-*, --md-sys-shape-*, --md-sys-elevation-*,
//   --md-sys-motion-*, --md-sys-state-*, --md-sys-space-<step>; .m3-type-<role> classes.
// The Expressive-only values (shape steps, emphasized type, expressive springs) live in
// `:root:not([data-m3-style="classic"])`; `:root` holds the standard set, and the Expressive-only names
// there point at their standard counterpart, so data-m3-style="classic" on the root falls back to it.
import { springToLinear } from '../spring-linear.mjs';
import {
  EXPRESSIVE_SHAPES, MOTION_MODES, ROLES, SHAPE_STEPS, SPRING_KINDS, SPRING_SPEEDS, TYPE_ATTRS, cell,
  durationIds, easingIds, elevationIds, headerLines, idsUnder, sideShapeIds, spaceSteps, stateIds,
  typefaceIds,
} from './common.mjs';

export const PATH = 'assets/web/tokens.css';
const P = 'web';
const CLASSIC_OFF = ':root:not([data-m3-style="classic"])';

export const cssName = id => `--${id.replace(/\./g, '-')}`;
const spaceName = step => `--md-sys-space-${step}`;

// CSS text for one cell value; kind: 'dp' (px), 'plain' (unitless), 'ms', 'font', 'easing', 'raw'.
function cssValue(v, kind) {
  if (!v) return null;
  if (v.ref) return `var(${cssName(v.ref)})`;
  if (v.unparsed !== undefined) return String(v.unparsed).trim();
  if (typeof v.dp === 'number') return `${v.dp}px`;
  if (typeof v.ms === 'number') return `${v.ms}ms`;
  if (Array.isArray(v.easing) && v.easing.length === 4) return `cubic-bezier(${v.easing.join(', ')})`;
  if (typeof v.number === 'number') return kind === 'dp' ? `${v.number}px` : kind === 'plain' ? String(v.number) : null;
  if (typeof v.string === 'string' && kind === 'font') return `'${v.string.replace(/'/g, "\\'")}'`;
  return null;
}

export function emitWeb(sys) {
  const skipped = [];
  const base = [];
  const expressive = [];

  // A declaration from token `id` (optionally `id@mode`) under `name`; skipped when no value.
  const decl = (out, id, kind, { name = cssName(id), mode = null } = {}) => {
    const c = cell(sys, id, P, mode);
    const value = c && cssValue(c.value, kind);
    if (!value) {
      skipped.push({ key: c?.key ?? id, platform: P, reason: c?.value == null ? `${c?.provenance ?? 'missing'}` : `no CSS form for ${JSON.stringify(c.value)}` });
      return;
    }
    out.push(`  ${name}: ${value}; /* ${c.key} */`);
  };
  const section = (out, title) => {
    if (out.length) out.push('');
    out.push(`  /* ${title} */`);
  };

  section(base, 'Typefaces');
  for (const id of typefaceIds(sys)) decl(base, id, /weight/.test(id) ? 'plain' : 'font');

  section(base, 'Type scale');
  for (const role of ROLES) for (const a of TYPE_ATTRS) decl(base, `md.sys.typescale.${role}.${a}`, 'raw');
  section(base, 'Emphasized type scale (Expressive); Classic uses the same role of the type scale');
  for (const role of ROLES) for (const a of TYPE_ATTRS) base.push(`  ${cssName(`md.sys.typescale.emphasized.${role}.${a}`)}: var(${cssName(`md.sys.typescale.${role}.${a}`)});`);

  section(base, 'Shape (corner radius)');
  for (const step of SHAPE_STEPS) {
    const id = `md.sys.shape.corner.${step}`;
    if (EXPRESSIVE_SHAPES[step]) base.push(`  ${cssName(id)}: var(${cssName(`md.sys.shape.corner.${EXPRESSIVE_SHAPES[step]}`)});`);
    else decl(base, id, 'dp');
  }
  for (const id of sideShapeIds(sys)) decl(base, id, 'dp');

  section(base, 'Elevation');
  for (const id of elevationIds(sys)) decl(base, id, 'dp');

  section(base, 'Motion: durations and easings');
  for (const id of durationIds(sys)) decl(base, id, 'ms');
  for (const id of easingIds(sys)) decl(base, id, 'easing');
  section(base, 'Motion: springs (standard scheme; the expressive scheme is set below)');
  const springs = (out, mode) => {
    for (const speed of SPRING_SPEEDS) for (const kind of SPRING_KINDS) for (const part of ['stiffness', 'damping']) {
      decl(out, `md.sys.motion.spring.${speed}.${kind}.${part}`, 'plain', { mode });
    }
    // Derived easing (linear()) and duration of each spring, from its own stiffness and damping.
    for (const speed of SPRING_SPEEDS) for (const kind of SPRING_KINDS) {
      const id = `md.sys.motion.spring.${speed}.${kind}`;
      const k = cell(sys, `${id}.stiffness`, P, mode)?.value?.number;
      const d = cell(sys, `${id}.damping`, P, mode)?.value?.number;
      if (typeof k !== 'number' || typeof d !== 'number') {
        skipped.push({ key: id, platform: P, reason: 'spring easing: stiffness or damping missing' });
        continue;
      }
      const { easing, durationMs } = springToLinear({ damping: d, stiffness: k });
      const name = cssName(id);
      out.push(`  ${name}-easing: ${easing}; /* derived from ${id}.stiffness, ${id}.damping */`);
      out.push(`  ${name}-duration: ${durationMs}ms; /* derived from ${id}.stiffness, ${id}.damping */`);
    }
  };
  springs(base, MOTION_MODES[0]);

  section(base, 'State');
  for (const id of stateIds(sys)) decl(base, id, /opacity/.test(id) ? 'plain' : 'dp');

  section(base, 'Spacing (md.sys.measurement steps on the 4 dp grid)');
  for (const s of spaceSteps(sys, P, skipped)) decl(base, s.id, 'dp', { name: spaceName(s.step) });

  section(expressive, 'Emphasized type scale');
  for (const role of ROLES) for (const a of TYPE_ATTRS) decl(expressive, `md.sys.typescale.emphasized.${role}.${a}`, 'raw');
  section(expressive, 'Shape steps added by Expressive');
  for (const step of Object.keys(EXPRESSIVE_SHAPES)) decl(expressive, `md.sys.shape.corner.${step}`, 'dp');
  section(expressive, 'Springs: expressive scheme');
  springs(expressive, MOTION_MODES[1]);

  const classes = [];
  for (const prefix of ['', 'emphasized.']) {
    for (const role of ROLES) {
      const v = a => `var(${cssName(`md.sys.typescale.${prefix}${role}.${a}`)})`;
      classes.push(`.m3-type-${prefix.replace('.', '-')}${role} {`,
        `  font-family: ${v('font')};`,
        `  font-weight: ${v('weight')};`,
        `  font-size: ${v('size')};`,
        `  line-height: ${v('line-height')};`,
        `  letter-spacing: ${v('tracking')};`,
        '}');
    }
  }

  // Tokens left out on purpose (not values that are missing).
  for (const id of idsUnder(sys, 'md.sys.typescale.')) {
    if (!/\.(font|weight|size|line-height|tracking)$/.test(id)) skipped.push({ key: id, platform: P, reason: 'font variation axis or composite: not part of the emitted type roles' });
  }
  for (const id of idsUnder(sys, 'md.sys.shape.corner-value.')) skipped.push({ key: id, platform: P, reason: 'duplicate of md.sys.shape.corner.*' });
  for (const id of idsUnder(sys, 'md.sys.motion.path')) skipped.push({ key: id, platform: P, reason: 'motion path type, not a value' });

  const head = headerLines(PATH, 'Material 3 design tokens for the web: type scale, shape, elevation, motion, state and spacing.');
  const text = [
    `/* ${head[0]}`,
    ...head.slice(1).map(l => ` * ${l}`),
    ' * Color roles are not here: scripts/color writes them.',
    ' * Material 3 Expressive is the default. data-m3-style="classic" on the root element turns the',
    ' * Expressive-only values off: emphasized type becomes the same role of the type scale, the added',
    ' * shape steps become the standard step they enlarge, and springs use the standard scheme.',
    ' * Use the variables (and the .m3-type-* classes) instead of literal sizes, radii and spacing.',
    ' */',
    '',
    ':root {',
    ...base,
    '}',
    '',
    `${CLASSIC_OFF} {`,
    ...expressive,
    '}',
    '',
    '/* Type roles */',
    ...classes,
    '',
  ].join('\n');

  // Every var() must point at a declared variable.
  const declared = new Set([...text.matchAll(/^\s*(--[\w-]+):/gm)].map(m => m[1]));
  for (const m of text.matchAll(/var\((--[\w-]+)\)/g)) {
    if (!declared.has(m[1])) throw new Error(`tokens.css uses undeclared ${m[1]}`);
  }
  return { files: new Map([[PATH, text]]), skipped };
}
