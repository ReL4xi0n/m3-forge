// Flutter checks: lib/**/*.dart.
import { join } from 'node:path';
import {
  callArgs, countNonBlank, findEmoji, looksGenerated, matchClose, onGrid, radiusOnScale, readText,
  SHAPE_SCALE, stripComments, walk,
} from './common.mjs';

const GENERATED_NAME = /(?:\.(?:g|freezed|gr|mocks|config|pb|pbenum|pbjson|pbserver)\.dart|(?:^|\/)generated_plugin_registrant\.dart)$/;
const THEME_NAME = /theme|color_scheme|colors/i;
const THEME_TYPES = '(?:ColorScheme|ThemeData|TextTheme)';
const NUM = /(?<![\w.])(\d+(?:\.\d+)?)(?![\w.])/g;

// Top-level declarations, split at `;` or a closing `}` at depth 0. Directives are dropped.
function topLevelDecls(src) {
  const decls = [];
  let start = 0;
  let i = 0;
  while (i < src.length) {
    const c = src[i];
    if (c === '"' || c === "'") {
      let j = i + 1;
      while (j < src.length && src[j] !== c && src[j] !== '\n') j += src[j] === '\\' ? 2 : 1;
      i = j + 1;
      continue;
    }
    if (c === '(' || c === '[' || c === '{') {
      const close = matchClose(src, i);
      i = close;
      if (c === '{') {
        // A body ends the declaration unless more follows on the same statement (`= {...};`).
        const rest = src.slice(i).match(/^\s*(;?)/);
        i += rest[0].length;
        decls.push(src.slice(start, i));
        start = i;
      }
      continue;
    }
    if (c === ';') {
      decls.push(src.slice(start, i + 1));
      start = i + 1;
    }
    i++;
  }
  if (src.slice(start).trim()) decls.push(src.slice(start));
  return decls
    .map(d => d.trim())
    .filter(d => d && !/^(?:import|export|part|library)\b/.test(d));
}

function buildsTheme(decl) {
  const d = decl.replace(/^(?:@\w+(?:\([^)]*\))?\s*)+/, '');
  return new RegExp(`^(?:(?:const|final|late|var|static)\\s+)*${THEME_TYPES}\\??\\s+\\w+`).test(d) ||
    new RegExp(`^(?:(?:const|final|late|var)\\s+)+\\w+\\s*=\\s*(?:const\\s+)?${THEME_TYPES}\\b`).test(d) ||
    new RegExp(`^(?:[\\w<>?]+\\s+)?\\w+\\s*\\([^)]*\\)\\s*=>\\s*(?:const\\s+)?${THEME_TYPES}\\b`).test(d);
}

function themeReason(rel, src) {
  const base = rel.slice(rel.lastIndexOf('/') + 1);
  const name = base.match(THEME_NAME);
  if (name) return `file name contains "${name[0]}"`;
  const decls = topLevelDecls(src);
  if (decls.length && decls.every(buildsTheme)) {
    return 'every top-level declaration builds a ColorScheme, ThemeData or TextTheme';
  }
  return null;
}

function each(re, src, cb) {
  re.lastIndex = 0;
  let m;
  while ((m = re.exec(src))) cb(m);
}

function scanDart(src, hit) {
  each(/\bColor\(\s*0[xX][0-9a-fA-F]+/g, src, m => hit('hardcoded-color', m.index, `${m[0]}) literal color`));
  each(/\bColor\.(?:fromARGB|fromRGBO|from)\(/g, src, m => hit('hardcoded-color', m.index, `${m[0]}…) literal color`));
  each(/(?<![\w.])(?:Colors|CupertinoColors)\.(?!transparent\b)\w+/g, src, m =>
    hit('hardcoded-color', m.index, `${m[0]} is a fixed palette color, not a ColorScheme role`));

  each(/\bfontSize\s*:\s*-?\d[\d.]*/g, src, m => hit('off-token-type', m.index, `${m[0]} literal; use a TextTheme style`));

  each(/\b(?:BorderRadius(?:Directional)?|Radius)\.circular\(\s*(\d+(?:\.\d+)?)\s*\)/g, src, m => {
    const n = parseFloat(m[1]);
    if (!radiusOnScale(n)) hit('off-token-radius', m.index, `${m[0]}: ${n} not in the M3 shape scale (${SHAPE_SCALE.join(', ')})`);
  });

  const offGrid = (args) => [...args.matchAll(NUM)].map(x => parseFloat(x[1])).filter(n => !onGrid(n));
  each(/\bEdgeInsets(?:Directional)?\.(?:all|symmetric|only|fromLTRB|fromSTEB)\(/g, src, m => {
    const call = callArgs(src, m.index);
    const bad = call ? offGrid(call.args) : [];
    if (bad.length) hit('off-grid-spacing', m.index, `${src.slice(m.index, call.close).replace(/\s+/g, ' ')}: ${bad.join(', ')} off the 4dp grid`);
  });
  each(/\bSizedBox\(\s*(?:height|width)\s*:\s*(\d+(?:\.\d+)?)\s*,?\s*\)/g, src, m => {
    if (!onGrid(parseFloat(m[1]))) hit('off-grid-spacing', m.index, `${m[0]} gap off the 4dp grid`);
  });
  each(/\b(?:spacing|runSpacing|mainAxisSpacing|crossAxisSpacing)\s*:\s*(\d+(?:\.\d+)?)(?![\w.])|\bGap\(\s*(\d+(?:\.\d+)?)\s*\)/g, src, m => {
    if (!onGrid(parseFloat(m[1] ?? m[2]))) hit('off-grid-spacing', m.index, `${m[0]} off the 4dp grid`);
  });

  each(/\b(?:BoxShadow|LinearGradient|RadialGradient|SweepGradient)\(/g, src, m =>
    hit('shadow-gradient', m.index, `${m[0].slice(0, -1)} (use elevation and tonal surfaces)`));

  each(/(?<![\w.])Icons\.\w+/g, src, m => hit('icon-source', m.index, `${m[0]} is the legacy Material Icons font; use Material Symbols`));
  each(/\b(?:CupertinoIcons|FontAwesomeIcons|FaIcon|LucideIcons|PhosphorIcons|HeroIcons|Ionicons|FeatherIcons|MdiIcons|EvaIcons|LineIcons|Octicons|BoxIcons)\b/g, src, m =>
    hit('icon-source', m.index, `${m[0]} is not Material Symbols`));
  findEmoji(src, (i, e) => hit('icon-source', i, `emoji ${e} in UI text (use Material Symbols)`));
}

export async function scanFlutter(projectDir, collector) {
  const files = (await walk(join(projectDir, 'lib'))).filter(f => f.endsWith('.dart') && !GENERATED_NAME.test(f) && !/^generated\//.test(f));
  let uiLines = 0;
  let themeLines = 0;
  let scanned = 0;
  for (const f of files) {
    const rel = `lib/${f}`;
    const text = await readText(projectDir, rel);
    if (looksGenerated(text)) continue;
    scanned++;
    const src = stripComments(text, { triple: true });
    const reason = themeReason(rel, src);
    let exempt = () => null;
    if (reason) {
      const entry = collector.allow({ file: rel, line: null, reason, suppressed: {} });
      exempt = () => entry;
      themeLines += countNonBlank(text);
    } else {
      uiLines += countNonBlank(text);
    }
    scanDart(src, collector.forFile(rel, text, exempt));
  }
  return { uiLines, themeLines, files: scanned };
}
