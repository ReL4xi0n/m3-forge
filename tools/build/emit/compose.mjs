// Compose emitter: assets/compose/theme/{Type,Shape,Space,Motion,Tokens}.kt.
//   Type.kt    M3Typography (the type scale as a material3 Typography) and M3EmphasizedType (the
//              emphasized TextStyles of Material 3 Expressive)
//   Shape.kt   M3Shapes (every step, Expressive steps included) and M3ShapeScheme (material3 Shapes)
//   Space.kt   M3Space (md.sys.measurement steps on the 4 dp grid, ruling R1)
//   Motion.kt  M3Motion: standard and expressive spring schemes, durations, easings
//   Tokens.kt  M3Elevation and M3State
// Package: `m3.theme` is a placeholder; install-assets rewrites the package line to the project's
// theme package. Raw values from another platform are used only when they are exact Kotlin
// (FontFamily.*, FontWeight.*, RectangleShape, CircleShape) or a plain number with a known unit.
import {
  MOTION_MODES, ROLES, SHAPE_STEPS, SPRING_KINDS, SPRING_SPEEDS, camel, cell, deref, dpOf, durationIds,
  easingIds, elevationIds, headerLines, idsUnder, num, sideShapeIds, spaceSteps, stateIds,
} from './common.mjs';

const P = 'compose';
const DIR = 'assets/compose/theme';
export const PACKAGE = 'm3.theme';
const ROLE_NAMES = ROLES.map(r => camel(r));

const trace = keys => ` // ${keys.join(', ')}`;
const unit = (n, u) => (n < 0 ? `(${num(n)}).${u}` : `${num(n)}.${u}`);
const float = n => `${num(n)}f`;

const FONT_FAMILY = /^FontFamily\.(?:Default|SansSerif|Serif|Monospace|Cursive)$/;
const FONT_WEIGHT = /^FontWeight\.(?:Thin|ExtraLight|Light|Normal|Medium|SemiBold|Bold|ExtraBold|Black|W[1-9]00)$/;
const LIBRARY_SHAPE = /^(?:RectangleShape|CircleShape)$/;

function file(name, about, imports, body) {
  const path = `${DIR}/${name}`;
  return [path, [
    ...headerLines(path, about).map(l => `// ${l}`),
    `// Placeholder package: install-assets rewrites it to the project's theme package.`,
    `package ${PACKAGE}`,
    '',
    ...imports.map(i => `import ${i}`),
    '',
    ...body,
    '',
  ].join('\n')];
}

function textStyle(sys, prefix, role, indent, skipped) {
  const id = a => `md.sys.typescale.${prefix}${role}.${a}`;
  const out = [];
  const skip = (a, why) => skipped.push({ key: id(a), platform: P, reason: why });
  const raw = (a, re) => {
    const d = deref(sys, id(a), P);
    const s = d?.value.unparsed !== undefined ? String(d.value.unparsed).trim() : null;
    return s && re.test(s) ? { s, keys: d.keys } : null;
  };
  const font = raw('font', FONT_FAMILY);
  if (font) out.push(`fontFamily = ${font.s},${trace(font.keys)}`);
  else skip('font', 'no exact FontFamily constant');
  const weight = raw('weight', FONT_WEIGHT);
  if (weight) out.push(`fontWeight = ${weight.s},${trace(weight.keys)}`);
  else skip('weight', 'no exact FontWeight constant');
  for (const [a, field] of [['size', 'fontSize'], ['line-height', 'lineHeight'], ['tracking', 'letterSpacing']]) {
    const d = deref(sys, id(a), P);
    const n = d?.value.sp ?? d?.value.number;
    if (typeof n === 'number') out.push(`${field} = ${unit(n, 'sp')},${trace(d.keys)}`);
    else skip(a, 'not an sp value');
  }
  return out.map(l => indent + l);
}

function typeFile(sys, skipped) {
  const body = ['/** The Material 3 type scale. Pass it to MaterialTheme(typography = M3Typography). */',
    'val M3Typography: Typography = Typography('];
  ROLES.forEach((role, i) => body.push(`    ${ROLE_NAMES[i]} = TextStyle(`, ...textStyle(sys, '', role, '        ', skipped), '    ),'));
  body.push(')', '', '/** The emphasized type scale of Material 3 Expressive: M3EmphasizedType.titleLarge. */', 'object M3EmphasizedType {');
  ROLES.forEach((role, i) => body.push(`    val ${ROLE_NAMES[i]}: TextStyle = TextStyle(`, ...textStyle(sys, 'emphasized.', role, '        ', skipped), '    )'));
  body.push('}');
  return file('Type.kt', 'Material 3 type scale and emphasized type scale (Compose).', [
    'androidx.compose.material3.Typography',
    'androidx.compose.ui.text.TextStyle',
    'androidx.compose.ui.text.font.FontFamily',
    'androidx.compose.ui.text.font.FontWeight',
    'androidx.compose.ui.unit.sp',
  ], body);
}

function shapeFile(sys, skipped) {
  const ids = [...SHAPE_STEPS.map(s => `md.sys.shape.corner.${s}`), ...sideShapeIds(sys)];
  const lines = [];
  const names = new Set();
  for (const id of ids) {
    const name = camel(id.slice('md.sys.shape.corner.'.length));
    const c = cell(sys, id, P);
    const raw = c?.value?.unparsed !== undefined ? String(c.value.unparsed).trim() : null;
    let src = null;
    if (raw && LIBRARY_SHAPE.test(raw)) src = raw;
    else if (typeof c?.value?.dp === 'number') src = `RoundedCornerShape(${unit(c.value.dp, 'dp')})`;
    if (!src) {
      skipped.push({ key: id, platform: P, reason: c?.value == null ? (c?.provenance ?? 'missing') : `no exact Compose shape for ${JSON.stringify(c.value)} (${c.provenance})` });
      continue;
    }
    names.add(name);
    lines.push(`    val ${name} = ${src}${trace([c.key])}`);
  }
  for (const id of idsUnder(sys, 'md.sys.shape.corner-value.')) skipped.push({ key: id, platform: P, reason: 'duplicate of md.sys.shape.corner.*' });
  const scheme = ['extraSmall', 'small', 'medium', 'large', 'extraLarge'].filter(n => names.has(n));
  const body = [
    '/** The Material 3 shape scale, Expressive steps (largeIncreased, extraLargeIncreased, extraExtraLarge) included. */',
    'object M3Shapes {',
    ...lines,
    '}',
    '',
    '/** The material3 Shapes of the scale. Pass it to MaterialTheme(shapes = M3ShapeScheme). */',
    'val M3ShapeScheme: Shapes = Shapes(',
    ...scheme.map(n => `    ${n} = M3Shapes.${n},`),
    ')',
  ];
  return file('Shape.kt', 'Material 3 shape scale (Compose).', [
    'androidx.compose.foundation.shape.CircleShape',
    'androidx.compose.foundation.shape.RoundedCornerShape',
    'androidx.compose.material3.Shapes',
    'androidx.compose.ui.graphics.RectangleShape',
    'androidx.compose.ui.unit.dp',
  ], body);
}

function spaceFile(sys, skipped) {
  const body = [
    '/** The Material 3 spacing scale (md.sys.measurement steps on the 4 dp grid). Padding, gaps and margins use these only. */',
    'object M3Space {',
    ...spaceSteps(sys, P, skipped).map(s => `    val space${s.step}: Dp = ${unit(s.n, 'dp')}${trace([s.id])}`),
    '}',
  ];
  return file('Space.kt', 'Material 3 spacing scale (Compose).', ['androidx.compose.ui.unit.Dp', 'androidx.compose.ui.unit.dp'], body);
}

function motionFile(sys, skipped) {
  const springFields = SPRING_SPEEDS.flatMap(s => SPRING_KINDS.map(k => ({ s, k, name: `${s}${k[0].toUpperCase()}${k.slice(1)}` })));
  const body = [
    '/** A spring from the motion tokens: stiffness and damping ratio. */',
    'class M3Spring(val stiffness: Float, val dampingRatio: Float) {',
    '    fun <T> spec(): SpringSpec<T> = spring(dampingRatio = dampingRatio, stiffness = stiffness)',
    '}',
    '',
    '/** One motion scheme: spatial springs move things, effects springs change color and opacity. */',
    'class M3MotionScheme(',
    ...springFields.map(f => `    val ${f.name}: M3Spring,`),
    ')',
    '',
    '/** Material 3 motion tokens: the expressive scheme (default) and the standard scheme (Classic). */',
    'object M3Motion {',
  ];
  for (const mode of MOTION_MODES) {
    body.push(`    val ${mode}: M3MotionScheme = M3MotionScheme(`);
    for (const f of springFields) {
      const st = cell(sys, `md.sys.motion.spring.${f.s}.${f.k}.stiffness`, P, mode);
      const dm = cell(sys, `md.sys.motion.spring.${f.s}.${f.k}.damping`, P, mode);
      if (typeof st?.value?.number !== 'number' || typeof dm?.value?.number !== 'number') {
        throw new Error(`compose: spring ${f.s}.${f.k}@${mode} has no numeric stiffness and damping`);
      }
      body.push(`        ${f.name} = M3Spring(stiffness = ${float(st.value.number)}, dampingRatio = ${float(dm.value.number)}),${trace([st.key, dm.key])}`);
    }
    body.push('    )', '');
  }
  body.push('    // Durations in milliseconds (tween(durationMillis = ...)).');
  for (const id of durationIds(sys)) {
    const c = cell(sys, id, P);
    if (typeof c?.value?.ms !== 'number') {
      skipped.push({ key: id, platform: P, reason: 'no millisecond value' });
      continue;
    }
    body.push(`    const val duration${camel('-' + id.split('.').pop())}Millis: Int = ${num(c.value.ms)}${trace([c.key])}`);
  }
  body.push('');
  for (const id of easingIds(sys)) {
    const c = cell(sys, id, P);
    const e = c?.value?.easing;
    if (!Array.isArray(e) || e.length !== 4) {
      skipped.push({ key: id, platform: P, reason: `no cubic-bezier value (${JSON.stringify(c?.value)})` });
      continue;
    }
    body.push(`    val easing${camel('-' + id.slice('md.sys.motion.easing.'.length))}: Easing = CubicBezierEasing(${e.map(float).join(', ')})${trace([c.key])}`);
  }
  body.push('}');
  for (const id of idsUnder(sys, 'md.sys.motion.path')) skipped.push({ key: id, platform: P, reason: 'motion path type, not a value' });
  return file('Motion.kt', 'Material 3 motion: springs (standard and expressive), durations, easings (Compose).', [
    'androidx.compose.animation.core.CubicBezierEasing',
    'androidx.compose.animation.core.Easing',
    'androidx.compose.animation.core.SpringSpec',
    'androidx.compose.animation.core.spring',
  ], body);
}

function tokensFile(sys, skipped) {
  const dpLine = (id, name) => {
    const c = cell(sys, id, P);
    const n = dpOf(c?.value);
    if (n === null) {
      skipped.push({ key: id, platform: P, reason: 'not a dp value' });
      return [];
    }
    return [`    val ${name}: Dp = ${unit(n, 'dp')}${trace([c.key])}`];
  };
  const stateLines = stateIds(sys).flatMap(id => {
    const name = camel(id.slice('md.sys.state.'.length));
    if (!/opacity$/.test(id)) return dpLine(id, name);
    const c = cell(sys, id, P);
    if (typeof c?.value?.number !== 'number') {
      skipped.push({ key: id, platform: P, reason: 'not a number' });
      return [];
    }
    return [`    const val ${name}: Float = ${float(c.value.number)}${trace([c.key])}`];
  });
  const body = [
    '/** Elevation levels (tonalElevation / shadowElevation of a Surface). */',
    'object M3Elevation {',
    ...elevationIds(sys).flatMap(id => dpLine(id, id.split('.').pop())),
    '}',
    '',
    '/** State layer opacities and the focus indicator. */',
    'object M3State {',
    ...stateLines,
    '}',
  ];
  return file('Tokens.kt', 'Material 3 elevation and state tokens (Compose).', ['androidx.compose.ui.unit.Dp', 'androidx.compose.ui.unit.dp'], body);
}

export function emitCompose(sys) {
  const skipped = [];
  const files = new Map([
    typeFile(sys, skipped),
    shapeFile(sys, skipped),
    spaceFile(sys, skipped),
    motionFile(sys, skipped),
    tokensFile(sys, skipped),
  ]);
  for (const id of idsUnder(sys, 'md.sys.typescale.')) {
    if (!/\.(font|weight|size|line-height|tracking)$/.test(id)) skipped.push({ key: id, platform: P, reason: 'font variation axis (raw CSS string) or composite: not part of the emitted type roles' });
  }
  return { files, skipped };
}
