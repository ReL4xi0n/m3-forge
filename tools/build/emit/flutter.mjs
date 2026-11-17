// Flutter emitter: assets/flutter/lib/m3/{tokens,type,shape,space,motion}.dart.
//   tokens.dart  exports the others; M3Elevation (levels) and M3State (state layer opacities, focus
//                indicator)
//   type.dart    M3Type.textTheme (the type scale as a TextTheme) and M3EmphasizedType (ThemeExtension)
//   shape.dart   M3Corners (BorderRadius) and M3Shapes (OutlinedBorder), Expressive steps included
//   space.dart   M3Space (md.sys.measurement steps on the 4 dp grid, ruling R1)
//   motion.dart  M3Motion: standard and expressive spring schemes, durations, easings
// Files that need Flutter types have exactly one import line, `package:flutter/material.dart`;
// install-assets rewrites it to `package:material_ui/material_ui.dart` where that library is used.
// Only types both libraries export are used. Flutter {number} values carry no unit: they are logical
// pixels (dp) for measurement, shape, elevation and state, and font logical pixels for type.
import {
  MOTION_MODES, ROLES, SHAPE_STEPS, SPRING_KINDS, SPRING_SPEEDS, camel, cell, deref, durationIds,
  easingIds, elevationIds, headerLines, idsUnder, num, sideShapeIds, spaceSteps, stateIds,
} from './common.mjs';

const P = 'flutter';
const DIR = 'assets/flutter/lib/m3';
const IMPORT = "import 'package:flutter/material.dart';";
const ROLE_NAMES = ROLES.map(r => camel(r));

function file(name, about, body, { material = true } = {}) {
  const path = `${DIR}/${name}`;
  const lines = [...headerLines(path, about).map(l => `// ${l}`), ''];
  if (material) lines.push('// install-assets rewrites this import to the Material library the project uses.', IMPORT, '');
  return [path, [...lines, ...body, ''].join('\n')];
}

const trace = keys => ` // ${keys.join(', ')}`;

// TextStyle fields for one role ('' or 'emphasized.' prefix); every field traced.
function textStyle(sys, prefix, role, indent, skipped) {
  const id = a => `md.sys.typescale.${prefix}${role}.${a}`;
  const out = [];
  const skip = (a, why) => skipped.push({ key: id(a), platform: P, reason: why });
  const font = deref(sys, id('font'), P);
  if (font && typeof font.value.string === 'string') out.push(`fontFamily: '${font.value.string}',${trace(font.keys)}`);
  else skip('font', 'no font family name');
  const weight = deref(sys, id('weight'), P);
  const w = weight?.value.number;
  if (Number.isInteger(w) && w >= 100 && w <= 900 && w % 100 === 0) out.push(`fontWeight: FontWeight.w${w},${trace(weight.keys)}`);
  else skip('weight', 'no FontWeight constant for this value');
  const size = deref(sys, id('size'), P);
  const s = size?.value.number;
  if (typeof s === 'number') out.push(`fontSize: ${num(s)},${trace(size.keys)}`);
  else skip('size', 'not a number');
  const lh = deref(sys, id('line-height'), P);
  // Flutter sets line height as a multiple of the font size: the two token values, divided in Dart.
  if (typeof lh?.value.number === 'number' && typeof s === 'number') out.push(`height: ${num(lh.value.number)} / ${num(s)},${trace([lh.keys[0], size.keys[0]])}`);
  else skip('line-height', 'needs numeric line height and size');
  const tr = deref(sys, id('tracking'), P);
  if (typeof tr?.value.number === 'number') out.push(`letterSpacing: ${num(tr.value.number)},${trace(tr.keys)}`);
  else skip('tracking', 'not a number');
  return out.map(l => indent + l);
}

function typeFile(sys, skipped) {
  const body = [
    '/// The Material 3 type scale. Use the roles through Theme.of(context).textTheme.',
    'class M3Type {',
    '  M3Type._();',
    '',
    '  static const TextTheme textTheme = TextTheme(',
  ];
  ROLES.forEach((role, i) => body.push(`    ${ROLE_NAMES[i]}: TextStyle(`, ...textStyle(sys, '', role, '      ', skipped), '    ),'));
  body.push('  );', '}', '',
    '/// The emphasized type scale of Material 3 Expressive, as a theme extension:',
    '/// M3EmphasizedType.of(context).titleLarge.',
    '@immutable',
    'class M3EmphasizedType extends ThemeExtension<M3EmphasizedType> {',
    '  const M3EmphasizedType({',
    ...ROLE_NAMES.map(n => `    required this.${n},`),
    '  });',
    '',
    ...ROLE_NAMES.map(n => `  final TextStyle ${n};`),
    '',
    '  /// The emphasized type scale from the tokens.',
    '  static const M3EmphasizedType baseline = M3EmphasizedType(');
  ROLES.forEach((role, i) => body.push(`    ${ROLE_NAMES[i]}: TextStyle(`, ...textStyle(sys, 'emphasized.', role, '      ', skipped), '    ),'));
  body.push('  );',
    '',
    '  /// The extension of the current theme, or [baseline] when the theme has none.',
    '  static M3EmphasizedType of(BuildContext context) =>',
    '      Theme.of(context).extension<M3EmphasizedType>() ?? baseline;',
    '',
    '  @override',
    '  M3EmphasizedType copyWith({',
    ...ROLE_NAMES.map(n => `    TextStyle? ${n},`),
    '  }) {',
    '    return M3EmphasizedType(',
    ...ROLE_NAMES.map(n => `      ${n}: ${n} ?? this.${n},`),
    '    );',
    '  }',
    '',
    '  @override',
    '  M3EmphasizedType lerp(covariant ThemeExtension<M3EmphasizedType>? other, double t) {',
    '    if (other is! M3EmphasizedType) return this;',
    '    return M3EmphasizedType(',
    ...ROLE_NAMES.map(n => `      ${n}: TextStyle.lerp(${n}, other.${n}, t)!,`),
    '    );',
    '  }',
    '}');
  return file('type.dart', 'Material 3 type scale and emphasized type scale (Flutter).', body);
}

// BorderRadius source for a Flutter shape cell; null for the circular family (no radius).
function borderRadius(v) {
  const r = n => `Radius.circular(${num(n)})`;
  if (v?.shape?.family === 'SHAPE_FAMILY_ROUNDED_CORNERS' && v.shape.corners.length === 4) {
    const [tl, tr, bl, br] = v.shape.corners; // extractor order: topLeft, topRight, bottomLeft, bottomRight
    if (tl === tr && tr === bl && bl === br) return `BorderRadius.all(${r(tl)})`;
    return `BorderRadius.only(topLeft: ${r(tl)}, topRight: ${r(tr)}, bottomLeft: ${r(bl)}, bottomRight: ${r(br)})`;
  }
  if (typeof v?.number === 'number' || typeof v?.dp === 'number') return `BorderRadius.all(${r(v.number ?? v.dp)})`;
  return null;
}

function shapeFile(sys, skipped) {
  const ids = [...SHAPE_STEPS.map(s => `md.sys.shape.corner.${s}`), ...sideShapeIds(sys)];
  const corners = [];
  const shapes = [];
  for (const id of ids) {
    const name = camel(id.slice('md.sys.shape.corner.'.length));
    const c = cell(sys, id, P);
    if (!c || c.value === null) {
      skipped.push({ key: id, platform: P, reason: c ? c.provenance : 'missing' });
      continue;
    }
    if (c.value.shape?.family === 'SHAPE_FAMILY_CIRCULAR') {
      shapes.push(`  static const OutlinedBorder ${name} = StadiumBorder();${trace([c.key])}`);
      continue;
    }
    const br = borderRadius(c.value);
    if (!br) {
      skipped.push({ key: id, platform: P, reason: `no BorderRadius form for ${JSON.stringify(c.value)}` });
      continue;
    }
    corners.push(`  static const BorderRadius ${name} = ${br};${trace([c.key])}`);
    shapes.push(`  static const OutlinedBorder ${name} = RoundedRectangleBorder(borderRadius: M3Corners.${name});${trace([c.key])}`);
  }
  for (const id of idsUnder(sys, 'md.sys.shape.corner-value.')) skipped.push({ key: id, platform: P, reason: 'duplicate of md.sys.shape.corner.*' });
  const body = [
    '/// Corner radii of the Material 3 shape scale (Expressive steps included), for BoxDecoration,',
    '/// ClipRRect and other BorderRadius users. The full (pill) step is a shape only: M3Shapes.full.',
    'class M3Corners {',
    '  M3Corners._();',
    '',
    ...corners,
    '}',
    '',
    '/// Shapes of the Material 3 shape scale, for widgets and themes that take an OutlinedBorder.',
    'class M3Shapes {',
    '  M3Shapes._();',
    '',
    ...shapes,
    '}',
  ];
  return file('shape.dart', 'Material 3 shape scale (Flutter).', body);
}

function spaceFile(sys, skipped) {
  const body = [
    '/// The Material 3 spacing scale (md.sys.measurement steps on the 4 dp grid), in logical pixels.',
    '/// Padding, gaps and margins use these values only.',
    'class M3Space {',
    '  M3Space._();',
    '',
    ...spaceSteps(sys, P, skipped).map(s => `  static const double space${s.step} = ${num(s.n)};${trace([s.id])}`),
    '}',
  ];
  return file('space.dart', 'Material 3 spacing scale (Flutter).', body, { material: false });
}

// Curve source for an easing cell, or null. A path of two cubic segments from (0,0) to (1,1) is a
// ThreePointCubic with the path's own control points.
function curve(v, names) {
  if (Array.isArray(v?.easing) && v.easing.length === 4) return `Cubic(${v.easing.map(num).join(', ')})`;
  if (v?.ref && names.has(v.ref)) return names.get(v.ref);
  if (typeof v?.string === 'string') {
    const n = '(-?\\d*\\.?\\d+)';
    const pt = `${n}\\s*,\\s*${n}`;
    const m = v.string.trim().match(new RegExp(`^M\\s*0\\s*,\\s*0\\s*C\\s*${pt}\\s*,\\s*${pt}\\s*,\\s*${pt}\\s*C\\s*${pt}\\s*,\\s*${pt}\\s*,\\s*1\\s*,\\s*1$`));
    if (m) {
      const o = (i) => `Offset(${m[i]}, ${m[i + 1]})`;
      return `ThreePointCubic(${o(1)}, ${o(3)}, ${o(5)}, ${o(7)}, ${o(9)})`;
    }
  }
  return null;
}

function motionFile(sys, skipped) {
  const springFields = SPRING_SPEEDS.flatMap(s => SPRING_KINDS.map(k => ({ s, k, name: `${s}${k[0].toUpperCase()}${k.slice(1)}` })));
  const body = [
    '/// A spring from the motion tokens: stiffness and damping ratio (mass 1).',
    '@immutable',
    'class M3Spring {',
    '  const M3Spring({required this.stiffness, required this.dampingRatio});',
    '',
    '  final double stiffness;',
    '  final double dampingRatio;',
    '}',
    '',
    '/// One motion scheme: spatial springs move things, effects springs change color and opacity.',
    '@immutable',
    'class M3MotionScheme {',
    '  const M3MotionScheme({',
    ...springFields.map(f => `    required this.${f.name},`),
    '  });',
    '',
    ...springFields.map(f => `  final M3Spring ${f.name};`),
    '}',
    '',
    '/// Material 3 motion tokens: the expressive scheme (default) and the standard scheme (Classic).',
    'class M3Motion {',
    '  M3Motion._();',
  ];
  for (const mode of MOTION_MODES) {
    body.push('', `  static const M3MotionScheme ${mode} = M3MotionScheme(`);
    for (const f of springFields) {
      const st = cell(sys, `md.sys.motion.spring.${f.s}.${f.k}.stiffness`, P, mode);
      const dm = cell(sys, `md.sys.motion.spring.${f.s}.${f.k}.damping`, P, mode);
      if (typeof st?.value?.number !== 'number' || typeof dm?.value?.number !== 'number') {
        throw new Error(`flutter: spring ${f.s}.${f.k}@${mode} has no numeric stiffness and damping`);
      }
      body.push(`    ${f.name}: M3Spring(stiffness: ${num(st.value.number)}, dampingRatio: ${num(dm.value.number)}),${trace([st.key, dm.key])}`);
    }
    body.push('  );');
  }
  body.push('');
  for (const id of durationIds(sys)) {
    const c = cell(sys, id, P);
    if (typeof c?.value?.ms !== 'number') {
      skipped.push({ key: id, platform: P, reason: 'no millisecond value' });
      continue;
    }
    body.push(`  static const Duration duration${camel('-' + id.split('.').pop())} = Duration(milliseconds: ${num(c.value.ms)});${trace([c.key])}`);
  }
  body.push('');
  const names = new Map();
  for (const id of easingIds(sys)) {
    const c = cell(sys, id, P);
    const name = `easing${camel('-' + id.slice('md.sys.motion.easing.'.length))}`;
    const src = c && curve(c.value, names);
    if (!src) {
      skipped.push({ key: id, platform: P, reason: `no exact Curve for ${JSON.stringify(c?.value)}` });
      continue;
    }
    names.set(id, name);
    body.push(`  static const Curve ${name} = ${src};${trace([c.key])}`);
  }
  body.push('}');
  for (const id of idsUnder(sys, 'md.sys.motion.path')) skipped.push({ key: id, platform: P, reason: 'motion path type, not a value' });
  return file('motion.dart', 'Material 3 motion: springs (standard and expressive), durations, easings (Flutter).', body);
}

function tokensFile(sys, skipped) {
  const plain = (id, name) => {
    const c = cell(sys, id, P);
    if (typeof c?.value?.number !== 'number' && typeof c?.value?.dp !== 'number') {
      skipped.push({ key: id, platform: P, reason: 'not a number' });
      return [];
    }
    return [`  static const double ${name} = ${num(c.value.number ?? c.value.dp)};${trace([c.key])}`];
  };
  const body = [
    "export 'motion.dart';",
    "export 'shape.dart';",
    "export 'space.dart';",
    "export 'type.dart';",
    '',
    '/// Elevation levels in logical pixels (Material elevation, not shadows to draw by hand).',
    'class M3Elevation {',
    '  M3Elevation._();',
    '',
    ...elevationIds(sys).flatMap(id => plain(id, id.split('.').pop())),
    '}',
    '',
    '/// State layer opacities and the focus indicator (logical pixels).',
    'class M3State {',
    '  M3State._();',
    '',
    ...stateIds(sys).flatMap(id => plain(id, camel(id.slice('md.sys.state.'.length)))),
    '}',
  ];
  return file('tokens.dart', 'Material 3 tokens for Flutter (exports type, shape, space and motion; elevation and state here).', body, { material: false });
}

export function emitFlutter(sys) {
  const skipped = [];
  const files = new Map([
    tokensFile(sys, skipped),
    typeFile(sys, skipped),
    shapeFile(sys, skipped),
    spaceFile(sys, skipped),
    motionFile(sys, skipped),
  ]);
  for (const id of idsUnder(sys, 'md.sys.typescale.')) {
    if (!/\.(font|weight|size|line-height|tracking)$/.test(id)) skipped.push({ key: id, platform: P, reason: 'font variation axis (raw CSS string) or composite: not part of the emitted type roles' });
  }
  return { files, skipped };
}
