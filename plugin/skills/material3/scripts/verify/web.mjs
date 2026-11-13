// Web checks: HTML, CSS/SCSS, JS/TS (JSX/TSX) and Vue single-file components.
import {
  countNonBlank, findEmoji, lineAt, lineStarts, looksGenerated, onGrid, radiusOnScale,
  readText, SHAPE_SCALE, stripComments, walk,
} from './common.mjs';

const EXT = /\.(html?|css|scss|js|jsx|ts|tsx|vue)$/i;
const NOT_UI = /(?:\.min\.(?:js|css)|\.d\.ts|\.(?:test|spec|stories)\.[cm]?[jt]sx?|(?:^|\/)[^/]*\.config\.[cm]?[jt]s)$/i;

// ---------------------------------------------------------------------------------------------
// Vocabulary.

const NAMED_COLORS = new Set(('aliceblue antiquewhite aqua aquamarine azure beige bisque black ' +
  'blanchedalmond blue blueviolet brown burlywood cadetblue chartreuse chocolate coral ' +
  'cornflowerblue cornsilk crimson cyan darkblue darkcyan darkgoldenrod darkgray darkgreen darkgrey ' +
  'darkkhaki darkmagenta darkolivegreen darkorange darkorchid darkred darksalmon darkseagreen ' +
  'darkslateblue darkslategray darkslategrey darkturquoise darkviolet deeppink deepskyblue dimgray ' +
  'dimgrey dodgerblue firebrick floralwhite forestgreen fuchsia gainsboro ghostwhite gold goldenrod ' +
  'gray green greenyellow grey honeydew hotpink indianred indigo ivory khaki lavender lavenderblush ' +
  'lawngreen lemonchiffon lightblue lightcoral lightcyan lightgoldenrodyellow lightgray lightgreen ' +
  'lightgrey lightpink lightsalmon lightseagreen lightskyblue lightslategray lightslategrey ' +
  'lightsteelblue lightyellow lime limegreen linen magenta maroon mediumaquamarine mediumblue ' +
  'mediumorchid mediumpurple mediumseagreen mediumslateblue mediumspringgreen mediumturquoise ' +
  'mediumvioletred midnightblue mintcream mistyrose moccasin navajowhite navy oldlace olive ' +
  'olivedrab orange orangered orchid palegoldenrod palegreen paleturquoise palevioletred papayawhip ' +
  'peachpuff peru pink plum powderblue purple rebeccapurple red rosybrown royalblue saddlebrown ' +
  'salmon sandybrown seagreen seashell sienna silver skyblue slateblue slategray slategrey snow ' +
  'springgreen steelblue tan teal thistle tomato turquoise violet wheat white whitesmoke yellow ' +
  'yellowgreen').split(' '));

const COLOR_PROPS = /^(?:color|background(?:-color)?|border(?:-(?:top|right|bottom|left|block|inline)(?:-(?:start|end))?)?(?:-color)?|outline(?:-color)?|fill|stroke|caret-color|accent-color|text-decoration(?:-color)?|column-rule(?:-color)?|stop-color|flood-color|lighting-color|scrollbar-color|text-emphasis-color|box-shadow|text-shadow)$/;
const TYPE_PROPS = /^(?:font-size|font-weight)$/;
const RADIUS_PROPS = /^border(?:-(?:top|bottom|start|end)-(?:left|right|start|end))?-radius$/;
const SPACING_PROPS = /^(?:padding|margin)(?:-(?:top|right|bottom|left|inline|block)(?:-(?:start|end))?)?$|^(?:grid-)?(?:row-|column-)?gap$/;

// Known properties for JS objects (camelCase) and CSS-in-JS; CSS files check every property.
const JS_PROPS = new RegExp(
  `^(?:${[COLOR_PROPS, TYPE_PROPS, RADIUS_PROPS, SPACING_PROPS].map(r => r.source.replace(/^\^|\$$/g, '')).join('|')}|font|background-image)$`,
);

const HEX = /#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3,4})(?![\w-])/g;
const COLOR_FN = /\b(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch)\(\s*[-+.\d]/gi;
const GRADIENT = /\b(?:repeating-)?(?:linear|radial|conic)-gradient\(/g;
const GLOBAL_KW = /^(?:inherit|initial|unset|revert|revert-layer)$/i;
const FONT_KW = /\b(?:bold|bolder|lighter|xx-small|x-small|small|medium|large|x-large|xx-large|xxx-large|smaller|larger)\b/i;

const ICON_LIB = /@fortawesome\/|font-?awesome|heroicons|\blucide(?:-react|-vue|-angular|-static)?\b|react-icons|@mui\/icons-material|@material-ui\/icons|bootstrap-icons|feather-icons|\bionicons\b|@tabler\/icons|@phosphor-icons|phosphor-react|@iconify|remixicon|boxicons|@primer\/octicons|@radix-ui\/react-icons|@ant-design\/icons|line-awesome|material-design-icons|family=Material\+Icons|@material-icons\//gi;
const ICON_CLASS = /^(?:fa|fas|far|fal|fab|fad|fa-[\w-]+|bi|bi-[\w-]+|glyphicon(?:-[\w-]+)?|material-icons(?:-outlined|-round|-sharp|-two-tone)?|ion-[\w-]+|ri-[\w-]+|bx|bxs?-[\w-]+|ti|ti-[\w-]+|las|la-[\w-]+)$/;

const TW_COLORS = 'slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|white|black';
const TAILWIND = [
  /^(?:sm|md|lg|xl|2xl|hover|focus|focus-visible|active|disabled|dark|group-hover|peer-[\w-]+|first|last|odd|even):\S+$/,
  /^-?(?:p|px|py|pt|pr|pb|pl|ps|pe|m|mx|my|mt|mr|mb|ml|ms|me|w|h|size|min-w|min-h|max-w|max-h|gap|gap-x|gap-y|space-x|space-y|inset|inset-x|inset-y|top|right|bottom|left|z|grid-cols|grid-rows|col-span|row-span|basis|leading|tracking|translate-x|translate-y|scale|rotate|duration|delay|opacity)-(?:\d+(?:\.5)?|px|full|screen|auto|min|max|fit|\d\/\d+|\[[^\]]+\])$/,
  new RegExp(`^(?:text|bg|border|ring|from|to|via|fill|stroke|divide|outline|decoration|accent|caret|placeholder|shadow)-(?:${TW_COLORS})(?:-\\d{2,3})?(?:\\/\\d+)?$`),
  /^text-(?:xs|sm|base|lg|xl|[2-9]xl)$/,
  /^font-(?:thin|extralight|light|normal|medium|semibold|bold|extrabold|black|sans|serif|mono)$/,
  /^rounded(?:-[trblse]{1,2})?(?:-(?:none|sm|md|lg|xl|2xl|3xl|full))?$/,
  /^shadow-(?:sm|md|lg|xl|2xl|inner|none)$/,
  /^(?:flex-(?:row|col|wrap|nowrap|1|auto|none)(?:-reverse)?|items-(?:start|end|center|baseline|stretch)|justify-(?:start|end|center|between|around|evenly)|self-(?:auto|start|end|center|stretch)|place-(?:items|content)-\w+|content-(?:start|end|center|between))$/,
  /^(?:bg|text|border|ring|from|to|via)-\[[^\]]+\]$/,
];
const BOOTSTRAP = [
  /^btn(?:-(?:primary|secondary|success|danger|warning|info|light|dark|link|lg|sm|block|close|group|toolbar|outline-\w+))?$/,
  /^col(?:-(?:xs|sm|md|lg|xl|xxl))?(?:-(?:\d{1,2}|auto))?$/,
  /^(?:container-fluid|navbar(?:-[\w-]+)?|nav-(?:item|link|tabs|pills)|card-(?:body|header|footer|title|subtitle|text|img-top|img-bottom)|form-(?:control|group|label|select|check(?:-[\w]+)?|floating|range|text)|input-group(?:-text)?|list-group(?:-item)?|dropdown-(?:menu|item|toggle)|modal-(?:dialog|content|header|body|footer|title)|alert-(?:primary|secondary|success|danger|warning|info|light|dark|dismissible))$/,
  /^d-(?:(?:sm|md|lg|xl|xxl)-)?(?:none|inline|inline-block|block|flex|inline-flex|grid|table)$/,
  /^[mp][trblxyse]?-(?:(?:sm|md|lg|xl|xxl)-)?(?:[0-5]|auto)$/,
  /^(?:text|bg)-(?:primary|secondary|success|danger|warning|info|light|dark|muted|body|white)$/,
  /^text-(?:center|start|end|uppercase|lowercase|nowrap|truncate)$/,
  /^(?:fw-(?:bold|bolder|semibold|medium|normal|light|lighter)|fs-[1-6]|g-[0-5]|g[xy]-[0-5]|justify-content-\w+|align-items-\w+|align-self-\w+|rounded-(?:pill|circle|[0-5])|shadow-sm|w-(?:25|50|75|100)|h-(?:25|50|75|100))$/,
];

// ---------------------------------------------------------------------------------------------
// Value helpers.

function stripVar(v) {
  let out = v;
  for (;;) {
    const i = out.search(/\bvar\(/);
    if (i === -1) return out;
    let depth = 0;
    let j = i + 3;
    for (; j < out.length; j++) {
      if (out[j] === '(') depth++;
      else if (out[j] === ')' && --depth === 0) break;
    }
    out = out.slice(0, i) + out.slice(j + 1);
  }
}

function clean(value) {
  let v = value.trim().replace(/!important\s*$/i, '').trim();
  if (/^(['"`]).*\1$/s.test(v)) v = v.slice(1, -1);
  return stripVar(v).trim();
}

function camelToKebab(p) {
  return p.replace(/[A-Z]/g, c => `-${c.toLowerCase()}`);
}

// Length tokens: [{ n (px), unit }]. Unitless numbers count as px only in JS objects.
function lengths(v, js) {
  const out = [];
  const re = /(?<![\w#.-])(-?\d*\.?\d+)(px|rem|em|%|vw|vh|vmin|vmax|dp)?(?![\w%])/g;
  let m;
  while ((m = re.exec(v))) {
    const n = parseFloat(m[1]);
    const unit = m[2] || '';
    if (unit === '' && n !== 0 && !js) continue;
    out.push({ n: unit === 'rem' ? n * 16 : n, unit: unit || 'px', raw: m[0] });
  }
  return out;
}

// What a custom property holds, guessed from its name, so the same literal checks apply.
function customKind(name) {
  const n = name.toLowerCase();
  return {
    type: /font-?size|font-?weight|typescale|(?:^|-)(?:type|text)-?(?:size|weight)|line-height/.test(n),
    radius: /radius|corner|shape/.test(n),
    spacing: /space|spacing|gap|padding|margin|gutter/.test(n),
    shadow: /shadow|elevation/.test(n),
  };
}

// ---------------------------------------------------------------------------------------------
// Declarations: `prop: value` in CSS (`;`-terminated) or JS objects (`,`-terminated).

function* declarations(text, start, end, mode) {
  const re = mode === 'css'
    ? /(?<![\w$.#@&-])(\$?-{0,2}[a-zA-Z_][\w-]*)\s*:(?!:)/g
    : /(?<![\w$.#@-])([a-zA-Z][\w-]*)\s*:(?!:)/g;
  re.lastIndex = start;
  let m;
  while ((m = re.exec(text)) && m.index < end) {
    const raw = m[1];
    const prop = raw.startsWith('-') || raw.startsWith('$') ? raw : camelToKebab(raw).toLowerCase();
    if (mode === 'js' && !JS_PROPS.test(prop)) continue;
    const vStart = m.index + m[0].length;
    let i = vStart;
    let depth = 0;
    let quote = null;
    for (; i < end; i++) {
      const c = text[i];
      if (quote) {
        if (c === '\\') i++;
        else if (c === quote || (c === '\n' && quote !== '`')) quote = null;
        continue;
      }
      if (c === '"' || c === "'" || c === '`') quote = c;
      else if (c === '(' || c === '[' || c === '{') {
        if (c === '{' && mode === 'css' && depth === 0) break;
        depth++;
      } else if (c === ')' || c === ']' || c === '}') {
        if (depth === 0) break;
        depth--;
      } else if (depth === 0 && (c === ';' || (mode === 'js' && (c === ',' || c === '\n')))) break;
    }
    re.lastIndex = Math.max(re.lastIndex, i);
    yield { prop, start: m.index, vStart, vEnd: i, value: text.slice(vStart, i) };
  }
}

// CSS block ranges with their selectors, for the theme-block allowlist.
function cssBlocks(text, start, end) {
  const blocks = [];
  const stack = [];
  let last = start;
  for (let i = start; i < end; i++) {
    const c = text[i];
    if (c === '"' || c === "'") {
      let j = i + 1;
      while (j < end && text[j] !== c && text[j] !== '\n') j += text[j] === '\\' ? 2 : 1;
      i = j;
      continue;
    }
    if (c === '{') {
      stack.push({ selector: text.slice(last, i).trim(), start: i });
      last = i + 1;
    } else if (c === '}') {
      const b = stack.pop();
      if (b) blocks.push({ ...b, end: i });
      last = i + 1;
    } else if (c === ';') {
      last = i + 1;
    }
  }
  return blocks;
}

const THEME_SELECTOR = /:root\b|(?:^|[\s,>+~(])html(?![\w-])|\[data-theme|\.(?:dark|light)(?![\w-])|@media[^{]*prefers-color-scheme/;

// ---------------------------------------------------------------------------------------------
// Per-file regions: css (style sheets, <style>), js (scripts), markup (HTML outside them).

function regions(rel, text) {
  const ext = rel.slice(rel.lastIndexOf('.') + 1).toLowerCase();
  if (ext === 'css' || ext === 'scss') {
    return { clean: stripComments(text, { line: ext === 'scss' }), parts: [{ kind: 'css', start: 0, end: text.length }] };
  }
  if (['js', 'jsx', 'ts', 'tsx'].includes(ext)) {
    return { clean: stripComments(text, { backtick: true }), parts: [{ kind: 'js', start: 0, end: text.length }] };
  }
  // html / vue
  let clean = stripComments(text, { html: true, line: false, block: false, quotes: [] });
  const parts = [];
  const re = /<(style|script)\b([^>]*)>([\s\S]*?)<\/\1\s*>/gi;
  let m;
  let pos = 0;
  while ((m = re.exec(clean))) {
    const bodyStart = m.index + m[0].indexOf('>') + 1;
    const bodyEnd = bodyStart + m[3].length;
    parts.push({ kind: 'markup', start: pos, end: bodyStart });
    const kind = m[1].toLowerCase() === 'style' ? 'css' : 'js';
    clean = kind === 'css'
      ? stripComments(clean, { line: /lang=["']?s[ac]ss/i.test(m[2]), start: bodyStart, end: bodyEnd })
      : stripComments(clean, { backtick: true, start: bodyStart, end: bodyEnd });
    parts.push({ kind, start: bodyStart, end: bodyEnd });
    pos = bodyEnd;
  }
  parts.push({ kind: 'markup', start: pos, end: clean.length });
  return { clean, parts };
}

// ---------------------------------------------------------------------------------------------
// Checks on one declaration.

function checkDecl(d, mode, hit) {
  const custom = d.prop.startsWith('--') || d.prop.startsWith('$');
  const kind = custom ? customKind(d.prop) : null;
  const value = clean(d.value);
  const label = `${d.prop}: ${d.value.trim().replace(/\s+/g, ' ').slice(0, 60)}`;
  const js = mode === 'js';

  // Colors: hex and color functions in any CSS declaration (known properties in JS);
  // named colors only where a color is expected.
  const noUrl = value.replace(/url\([^)]*\)/gi, '');
  const firstColor = (re) => {
    re.lastIndex = 0;
    const m = re.exec(noUrl);
    return m ? m[0] : null;
  };
  const hex = firstColor(HEX);
  const fn = firstColor(COLOR_FN);
  let named = null;
  if (custom || COLOR_PROPS.test(d.prop)) {
    const words = noUrl.replace(/(["']).*?\1/g, ' ').match(/[a-zA-Z]+/g) || [];
    named = words.find(w => NAMED_COLORS.has(w.toLowerCase())) || null;
  }
  const color = hex || fn || named;
  if (color) {
    const at = d.value.indexOf(color);
    const shown = color === fn ? fn.replace(/\(.*$/s, '()') : color;
    hit('hardcoded-color', at >= 0 ? d.vStart + at : d.start, `hardcoded color ${shown} in ${d.prop}`);
  }

  if (!value || GLOBAL_KW.test(value)) return;

  if (TYPE_PROPS.test(d.prop) || (kind && kind.type && /\d/.test(value))) {
    hit('off-token-type', d.start, `${label} is not a typescale token`);
  } else if (d.prop === 'font' && (/\d/.test(value) || FONT_KW.test(value))) {
    hit('off-token-type', d.start, `${label} sets size or weight without a typescale token`);
  }

  if (RADIUS_PROPS.test(d.prop) || (kind && kind.radius)) {
    const bad = lengths(value, js).filter(l => {
      if (l.unit === '%') return ![0, 50, 100].includes(l.n);
      if (/^v/.test(l.unit)) return l.n < 50;
      if (l.unit === 'em') return !radiusOnScale(l.n * 16);
      return !radiusOnScale(l.n);
    });
    if (bad.length) {
      hit('off-token-radius', d.start, `${label}: ${bad.map(b => b.raw).join(', ')} not in the M3 shape scale (${SHAPE_SCALE.join(', ')})`);
    }
  }

  if (SPACING_PROPS.test(d.prop) || (kind && kind.spacing)) {
    const bad = lengths(value, js).filter(l => (l.unit === 'px' || l.unit === 'rem' || l.unit === 'dp') && !onGrid(l.n));
    if (bad.length) hit('off-grid-spacing', d.start, `${label}: ${bad.map(b => b.raw).join(', ')} off the 4dp grid`);
  }

  if ((d.prop === 'box-shadow' || (kind && kind.shadow)) && !/^none$/i.test(value)) {
    hit('shadow-gradient', d.start, `${label} is not an elevation token`);
  }
}

// ---------------------------------------------------------------------------------------------

function classAttrs(text, start, end, cb) {
  const re = /\bclass(?:Name)?\s*=\s*\{?\s*(["'`])([^"'`]*)\1/g;
  re.lastIndex = start;
  let m;
  while ((m = re.exec(text)) && m.index < end) cb(m.index, m[2]);
  const re2 = /\bclassList\.(?:add|toggle|remove|replace)\(([^)]*)\)/g;
  re2.lastIndex = start;
  while ((m = re2.exec(text)) && m.index < end) {
    const inner = m[1].match(/(["'`])([^"'`]*)\1/g) || [];
    cb(m.index, inner.map(s => s.slice(1, -1)).join(' '));
  }
}

const NAV_CONTEXT = /(?:href|to|querySelector(?:All)?|getElementById|closest|matches|hash|scrollIntoView|navigate|router|anchor)\W*$/i;

function scanFile(rel, text, ctx, collector) {
  const { clean: src, parts } = regions(rel, text);
  const exemptRanges = [];

  // Theme declarations: custom properties inside :root, html, [data-theme], .dark/.light, or
  // @media (prefers-color-scheme) blocks.
  for (const p of parts) {
    if (p.kind !== 'css') continue;
    const blocks = cssBlocks(src, p.start, p.end).filter(b => THEME_SELECTOR.test(b.selector));
    if (!blocks.length) continue;
    for (const d of declarations(src, p.start, p.end, 'css')) {
      if (!d.prop.startsWith('--')) continue;
      const b = blocks.find(b => b.start < d.start && d.start < b.end);
      if (b) exemptRanges.push({ start: d.start, end: d.vEnd, prop: d.prop, selector: b.selector.replace(/\s+/g, ' ') });
    }
  }
  const starts = lineStarts(text);
  const entries = new Map();
  const exempt = (pos) => {
    const r = exemptRanges.find(r => r.start <= pos && pos <= r.end);
    if (!r) return null;
    if (!entries.has(r)) {
      entries.set(r, collector.allow({
        file: rel,
        line: lineAt(starts, r.start),
        reason: `CSS custom property declared in a theme block (${r.selector})`,
        detail: r.prop,
        suppressed: {},
      }));
    }
    return entries.get(r);
  };
  const hit = collector.forFile(rel, text, exempt);

  const themeLines = new Set();
  for (const r of exemptRanges) {
    for (let l = lineAt(starts, r.start); l <= lineAt(starts, r.end); l++) {
      if (text.slice(starts[l - 1], starts[l] ?? text.length).trim() !== '') themeLines.add(l);
    }
  }

  for (const p of parts) {
    if (p.kind === 'css' || p.kind === 'js') {
      for (const d of declarations(src, p.start, p.end, p.kind)) checkDecl(d, p.kind, hit);
    }
    if (p.kind === 'markup') {
      const re = /\sstyle\s*=\s*(["'])([\s\S]*?)\1/gi;
      re.lastIndex = p.start;
      let m;
      while ((m = re.exec(src)) && m.index < p.end) {
        const s = m.index + m[0].indexOf(m[1]) + 1;
        for (const d of declarations(src, s, s + m[2].length, 'css')) checkDecl(d, 'css', hit);
      }
      const attr = /\s(?:fill|stroke|color|bgcolor|stop-color|flood-color)\s*=\s*["']\s*([^"']+)["']/gi;
      attr.lastIndex = p.start;
      while ((m = attr.exec(src)) && m.index < p.end) {
        const v = m[1].trim();
        HEX.lastIndex = 0;
        COLOR_FN.lastIndex = 0;
        if (HEX.test(v) || COLOR_FN.test(v) || NAMED_COLORS.has(v.toLowerCase())) {
          hit('hardcoded-color', m.index + 1, `hardcoded color ${v} in a markup attribute`);
        }
      }
    }
    if (p.kind === 'js') {
      const lit = /(['"`])\s*(#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3,4}))\s*\1/g;
      lit.lastIndex = p.start;
      let m;
      while ((m = lit.exec(src)) && m.index < p.end) {
        const before = src.slice(Math.max(p.start, m.index - 40), m.index);
        if (NAV_CONTEXT.test(before.replace(/[\s('"`[=]+$/, ''))) continue;
        hit('hardcoded-color', m.index, `hardcoded color ${m[2]} in a string`);
      }
      const fnRe = /\b(?:rgba?|hsla?|hwb|oklab|oklch)\(\s*[-+.\d]/g;
      fnRe.lastIndex = p.start;
      while ((m = fnRe.exec(src)) && m.index < p.end) {
        hit('hardcoded-color', m.index, `hardcoded color ${m[0].replace(/\(.*/, '(…)')} in script`);
      }
    }
    // Gradients anywhere.
    GRADIENT.lastIndex = p.start;
    let g;
    while ((g = GRADIENT.exec(src)) && g.index < p.end) {
      hit('shadow-gradient', g.index, `${g[0].slice(0, -1)} (M3 uses tonal surfaces, not gradients)`);
    }
    // Icon libraries.
    ICON_LIB.lastIndex = p.start;
    let ic;
    while ((ic = ICON_LIB.exec(src)) && ic.index < p.end) {
      hit('icon-source', ic.index, `non-Material-Symbols icon source "${ic[0]}"`);
    }
    // Classes: icon fonts and foreign utility frameworks.
    if (p.kind !== 'css') {
      classAttrs(src, p.start, p.end, (pos, value) => {
        const tokens = value.split(/\s+/).filter(t => t && !/[${}]/.test(t));
        const icons = tokens.filter(t => ICON_CLASS.test(t));
        if (icons.length) hit('icon-source', pos, `icon font class ${icons.join(' ')} (use Material Symbols)`);
        const foreign = tokens.filter(t => {
          if (ctx.ownClasses.has(t)) return false;
          const tw = TAILWIND.some(r => r.test(t));
          const bs = BOOTSTRAP.some(r => r.test(t));
          if (!tw && !bs) return false;
          return !((tw && ctx.tailwind) || (bs && ctx.bootstrap));
        });
        if (foreign.length) {
          hit('foreign-styling', pos, `utility-framework classes without that framework in package.json: ${foreign.slice(0, 6).join(' ')}`);
        }
      });
    }
    // Emoji in UI text.
    findEmoji(src.slice(p.start, p.end), (i, e) => hit('icon-source', p.start + i, `emoji ${e} in UI text (use Material Symbols)`));
  }
  return { themeLines: themeLines.size, nonBlank: countNonBlank(text) };
}

// ---------------------------------------------------------------------------------------------

async function projectContext(projectDir, all, texts) {
  const ctx = { tailwind: false, bootstrap: false, ownClasses: new Set() };
  for (const rel of all.filter(f => /(?:^|\/)package\.json$/.test(f))) {
    try {
      const pj = JSON.parse(await readText(projectDir, rel));
      const deps = Object.keys({ ...pj.dependencies, ...pj.devDependencies, ...pj.peerDependencies });
      if (deps.some(d => d === 'tailwindcss' || d.startsWith('@tailwindcss/'))) ctx.tailwind = true;
      if (deps.some(d => d === 'bootstrap' || d === 'react-bootstrap' || d === 'bootstrap-vue' || d === 'bootstrap-vue-next')) ctx.bootstrap = true;
    } catch {
      // unreadable package.json: treat as no dependencies
    }
  }
  for (const [rel, text] of texts) {
    // A framework loaded from a CDN in a page counts as used.
    if (/\.(?:html?|vue)$/i.test(rel)) {
      if (/<script\b[^>]*src=["'][^"']*tailwind/i.test(text)) ctx.tailwind = true;
      if (/<(?:link|script)\b[^>]*(?:href|src)=["'][^"']*bootstrap(?:\.min)?\.(?:css|js)/i.test(text)) ctx.bootstrap = true;
    }
    // Classes the project defines itself are its own, whatever they look like.
    const sheet = /\.s?css$/i.test(rel)
      ? text
      : [...text.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style\s*>/gi)].map(m => m[1]).join('\n');
    for (const c of sheet.match(/\.(-?[_a-zA-Z][\w-]*)(?=[^{};]*\{)/g) || []) ctx.ownClasses.add(c.slice(1));
  }
  return ctx;
}

export async function scanWeb(projectDir, collector) {
  const all = await walk(projectDir);
  const files = all.filter(f => EXT.test(f) && !NOT_UI.test(f));
  const texts = [];
  for (const rel of files) {
    const text = await readText(projectDir, rel);
    if (looksGenerated(text)) continue;
    texts.push([rel, text]);
  }
  const ctx = await projectContext(projectDir, all, texts);
  let uiLines = 0;
  let themeLines = 0;
  for (const [rel, text] of texts) {
    const r = scanFile(rel, text, ctx, collector);
    uiLines += r.nonBlank - r.themeLines;
    themeLines += r.themeLines;
  }
  return { uiLines, themeLines, files: texts.length };
}
