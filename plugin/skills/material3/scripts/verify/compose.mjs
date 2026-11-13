// Jetpack Compose checks: src/main/**/*.kt of any module.
import {
  callArgs, countNonBlank, findEmoji, looksGenerated, onGrid, radiusOnScale, readText, SHAPE_SCALE,
  stripComments, walk,
} from './common.mjs';

const THEME_FILES = new Set(['Color.kt', 'Theme.kt', 'Type.kt', 'Shape.kt']);
const DP = /(?<![\w.])(\d+(?:\.\d+)?)f?\.dp\b/g;

function themeReason(rel) {
  if (/(?:^|\/)ui\/theme\//.test(rel)) return 'file is under ui/theme/';
  const base = rel.slice(rel.lastIndexOf('/') + 1);
  if (THEME_FILES.has(base)) return `file is named ${base}`;
  return null;
}

function each(re, src, cb) {
  re.lastIndex = 0;
  let m;
  while ((m = re.exec(src))) cb(m);
}

const dps = (s) => [...s.matchAll(DP)].map(x => parseFloat(x[1]));

function scanKotlin(src, hit) {
  each(/\bColor\(\s*0[xX][0-9a-fA-F]+/g, src, m => hit('hardcoded-color', m.index, `${m[0]}) literal color`));
  each(/\bColor\(\s*(?:red\s*=|\d+(?:\.\d+)?f?\s*,)/g, src, m => hit('hardcoded-color', m.index, `${m[0]}…) literal color`));
  each(/\bColor\.(?:Red|Green|Blue|Black|White|Gray|LightGray|DarkGray|Yellow|Cyan|Magenta)\b/g, src, m =>
    hit('hardcoded-color', m.index, `${m[0]} is a fixed color, not a colorScheme role`));
  each(/\b(?:parseColor|Color\.(?:rgb|argb|hsl|hsv))\(/g, src, m => hit('hardcoded-color', m.index, `${m[0]}…) literal color`));

  each(/(?<![\w.])\d+(?:\.\d+)?f?\.sp\b/g, src, m => hit('off-token-type', m.index, `${m[0]} literal; use MaterialTheme.typography`));

  each(/\b(?:RoundedCornerShape|CornerSize)\(/g, src, m => {
    const call = callArgs(src, m.index);
    if (!call) return;
    const values = dps(call.args);
    let bad = values.filter(n => !radiusOnScale(n)).map(n => `${n}.dp`);
    if (!values.length) {
      const pct = call.args.match(/^\s*(?:percent\s*=\s*)?(\d+)\s*$/);
      if (pct && ![0, 50, 100].includes(Number(pct[1]))) bad = [`${pct[1]}%`];
    }
    if (bad.length) {
      hit('off-token-radius', m.index, `${src.slice(m.index, call.close).replace(/\s+/g, ' ')}: ${bad.join(', ')} not in the M3 shape scale (${SHAPE_SCALE.join(', ')})`);
    }
  });

  each(/(?:\.(?:padding|absolutePadding)|\bPaddingValues|\bspacedBy|\bSpacer)\(/g, src, m => {
    const call = callArgs(src, m.index);
    if (!call) return;
    const bad = dps(call.args).filter(n => !onGrid(n));
    if (bad.length) {
      hit('off-grid-spacing', m.index, `${src.slice(m.index, call.close).replace(/\s+/g, ' ').replace(/^\./, '')}: ${bad.map(n => `${n}.dp`).join(', ')} off the 4dp grid`);
    }
  });

  each(/\.shadow\(/g, src, m => hit('shadow-gradient', m.index, 'Modifier.shadow() (use tonal or shadow elevation of a Surface)'));
  each(/\bBrush\.\w*[Gg]radient\(/g, src, m => hit('shadow-gradient', m.index, `${m[0].slice(0, -1)} (M3 uses tonal surfaces, not gradients)`));

  each(/\bIcons\.(?:Default|Filled|Outlined|Rounded|Sharp|TwoTone|AutoMirrored)\b(?:\.\w+)*/g, src, m =>
    hit('icon-source', m.index, `${m[0]} comes from material-icons; use Material Symbols`));
  findEmoji(src, (i, e) => hit('icon-source', i, `emoji ${e} in UI text (use Material Symbols)`));
}

export async function scanCompose(projectDir, collector) {
  const files = (await walk(projectDir)).filter(f => f.endsWith('.kt') && /(?:^|\/)src\/main\//.test(f));
  let uiLines = 0;
  let themeLines = 0;
  let scanned = 0;
  for (const rel of files) {
    const text = await readText(projectDir, rel);
    if (looksGenerated(text)) continue;
    scanned++;
    const reason = themeReason(rel);
    let exempt = () => null;
    if (reason) {
      const entry = collector.allow({ file: rel, line: null, reason, suppressed: {} });
      exempt = () => entry;
      themeLines += countNonBlank(text);
    } else {
      uiLines += countNonBlank(text);
    }
    scanKotlin(stripComments(text, { triple: true, quotes: ['"', "'"] }), collector.forFile(rel, text, exempt));
  }
  return { uiLines, themeLines, files: scanned };
}
