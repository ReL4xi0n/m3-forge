// icon-button-label (error, not scored): a button whose only content is an icon needs an accessible
// name. Regexes and light parsing only. A button is reported only when it is clearly icon-only and
// clearly unlabeled: a button with visible text, a props spread or content verify cannot read is
// clean.
//   web      <button>, <a>, any element with role="button", and the Material Web icon buttons
//            (<md-icon-button>, <md-filled-icon-button>, <md-filled-tonal-icon-button>,
//            <md-outlined-icon-button>) whose content is only icons (an element with class m3-icon or
//            material-symbols*, <md-icon>, an <svg>) and that carry no aria-label, aria-labelledby or
//            title (plain, Vue or Angular binding, or JSX ariaLabel).
//   flutter  IconButton(...) (and .filled, .filledTonal, .outlined) with an Icon(...) and neither a
//            tooltip: nor a semanticLabel: on its Icon.
//   compose  IconButton, FilledIconButton, FilledTonalIconButton, OutlinedIconButton and their
//            IconToggleButton forms whose content has an Icon(...) with contentDescription = null, no
//            Icon with a description, no Text(...), and no semantics contentDescription.
import { callArgs, matchClose } from './common.mjs';

const CHECK = 'icon-button-label';

// Arguments of a call split at top-level commas (quotes and brackets skipped).
function splitArgs(args) {
  const out = [];
  let depth = 0;
  let last = 0;
  for (let i = 0; i < args.length; i++) {
    const c = args[i];
    if (c === '"' || c === "'" || c === '`') {
      let j = i + 1;
      while (j < args.length && args[j] !== c && args[j] !== '\n') j += args[j] === '\\' ? 2 : 1;
      i = j;
      continue;
    }
    if (c === '(' || c === '[' || c === '{') depth++;
    else if (c === ')' || c === ']' || c === '}') depth--;
    else if (c === ',' && depth === 0) {
      out.push(args.slice(last, i));
      last = i + 1;
    }
  }
  out.push(args.slice(last));
  return out.map(a => a.trim()).filter(Boolean);
}

// ---------------------------------------------------------------------------------------------
// Web.

const ICON_BUTTON_TAG = /^(?:button|a|md-(?:filled-|filled-tonal-|outlined-)?icon-button)$/i;
const ROLE_BUTTON = /(?:^|\s)role\s*=\s*\{?\s*["'`]button["'`]/i;
const LABEL_ATTR = /(?:^|[\s{[])(?::|v-bind:|attr\.)?(?:aria-label|aria-labelledby|title|ariaLabel|ariaLabelledby)\]?\s*=|\{\s*\.\.\./;
const ICON_CLASS = /\bclass(?:Name)?\s*=\s*\{?\s*["'`][^"'`]*(?<![\w-])(?:m3-icon|material-symbols(?:-outlined|-rounded|-sharp)?)(?![\w-])/;
const ICON_ELEMENT = /<([a-zA-Z][\w-]*)\b([^<>]*)>[^<]*<\/\1\s*>/g;
const SVG = /<svg\b[\s\S]*?<\/svg\s*>/gi;
const MAX_TAG = 4000;

const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Index just past the `>` that ends the opening tag at `i` (quotes and JSX braces skipped), and
// whether it is self-closing; null when no end is found nearby.
function openTagEnd(src, i, end) {
  let depth = 0;
  const stop = Math.min(end, i + MAX_TAG);
  for (let j = i + 1; j < stop; j++) {
    const c = src[j];
    if (c === '"' || c === "'" || c === '`') {
      const k = src.indexOf(c, j + 1);
      if (k === -1 || k >= stop) return null;
      j = k;
      continue;
    }
    if (c === '{') depth++;
    else if (c === '}') depth--;
    else if (c === '<' && depth === 0) return null;
    else if (c === '>' && depth === 0) return { end: j + 1, selfClosing: src[j - 1] === '/' };
  }
  return null;
}

// Start of the closing tag that matches the element opened before `from`, or -1.
function closeTagStart(src, tag, from, end) {
  const re = new RegExp(`<(/?)${esc(tag)}(?![\\w-])`, 'gi');
  re.lastIndex = from;
  let depth = 1;
  let m;
  while ((m = re.exec(src)) && m.index < end) {
    if (m[1]) {
      if (--depth === 0) return m.index;
    } else {
      const t = openTagEnd(src, m.index, end);
      if (t && !t.selfClosing) depth++;
    }
  }
  return -1;
}

function iconOnly(content) {
  let icons = 0;
  const rest = content
    .replace(SVG, () => { icons++; return ' '; })
    .replace(ICON_ELEMENT, (all, tag, attrs) => {
      if (tag.toLowerCase() !== 'md-icon' && !ICON_CLASS.test(attrs)) return all;
      icons++;
      return ' ';
    });
  return icons > 0 && rest.trim() === '';
}

// Elements in src[start, end) (markup or script with JSX / HTML strings).
export function webIconButtons(src, start, end, hit) {
  const re = /<([a-zA-Z][\w-]*)/g;
  re.lastIndex = start;
  let m;
  while ((m = re.exec(src)) && m.index < end) {
    const tag = m[1];
    const t = openTagEnd(src, m.index, end);
    if (!t || t.selfClosing) continue;
    const attrs = src.slice(m.index + m[0].length, t.end - 1);
    if (!ICON_BUTTON_TAG.test(tag) && !ROLE_BUTTON.test(attrs)) continue;
    if (LABEL_ATTR.test(attrs)) continue;
    const close = closeTagStart(src, tag, t.end, end);
    if (close === -1) continue;
    if (!iconOnly(src.slice(t.end, close))) continue;
    const what = ICON_BUTTON_TAG.test(tag) ? `<${tag}>` : `<${tag} role="button">`;
    hit(CHECK, m.index, `${what} holds only an icon and has no accessible name (add aria-label)`);
  }
}

// ---------------------------------------------------------------------------------------------
// Flutter.

export function flutterIconButtons(src, hit) {
  const re = /(?<![\w$])IconButton(?:\.(?:filled|filledTonal|outlined))?\s*\(/g;
  let m;
  while ((m = re.exec(src))) {
    const call = callArgs(src, m.index);
    if (!call) continue;
    if (!/(?<![\w$.])Icon\s*\(/.test(call.args)) continue;
    if (/\btooltip\s*:/.test(call.args) || /\bsemanticLabel\s*:/.test(call.args)) continue;
    hit(CHECK, m.index, `${m[0].replace(/\s*\($/, '')} without tooltip: (add a tooltip, or a semanticLabel on its Icon)`);
  }
}

// ---------------------------------------------------------------------------------------------
// Compose.

function iconDescription(args) {
  const parts = splitArgs(args);
  const named = parts.find(p => /^contentDescription\s*=/.test(p));
  if (named) return named.replace(/^contentDescription\s*=\s*/, '');
  return parts.length > 1 && !/^\w+\s*=/.test(parts[1]) ? parts[1] : undefined;
}

export function composeIconButtons(src, hit) {
  const re = /(?<![\w$])(?:Filled|FilledTonal|Outlined)?Icon(?:Toggle)?Button\s*\(/g;
  let m;
  while ((m = re.exec(src))) {
    if (/\bfun\s+(?:<[^>]*>\s*)?(?:[\w.]+\.)?$/.test(src.slice(Math.max(0, m.index - 80), m.index))) continue;
    const call = callArgs(src, m.index);
    if (!call) continue;
    let bodyEnd = call.close;
    const lambda = src.slice(call.close).match(/^\s*\{/);
    if (lambda) bodyEnd = matchClose(src, call.close + lambda[0].length - 1);
    const body = src.slice(call.open, bodyEnd);
    if (/(?<![\w$.])Text\s*\(/.test(body)) continue;
    if (/\b(?:semantics|clearAndSetSemantics)\b/.test(body) && /contentDescription\s*=\s*(?!null\b)/.test(body)) continue;
    let unlabeled = 0;
    let labeled = 0;
    const icon = /(?<![\w$.])Icon\s*\(/g;
    let i;
    while ((i = icon.exec(body))) {
      const c = callArgs(body, i.index);
      if (!c) continue;
      const d = iconDescription(c.args);
      if (d === 'null') unlabeled++;
      else if (d !== undefined) labeled++;
    }
    if (unlabeled && !labeled) {
      hit(CHECK, m.index, `${m[0].replace(/\s*\($/, '')} with Icon(contentDescription = null) has no accessible name (describe the action)`);
    }
  }
}
