// Shared helpers for the verify checks: file walking, comment stripping, line lookup, emoji,
// the corner scale and the hit collector. Zero dependencies; regexes and light parsing only.
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { readFileSync } from 'node:fs';

export const CHECKS = [
  'hardcoded-color',
  'off-token-type',
  'off-token-radius',
  'off-grid-spacing',
  'shadow-gradient',
  'icon-source',
  'foreign-styling',
  'contrast',
  'touch-target',
];

// Checks about literal values. Theme files and theme declarations are exempt from these only.
export const LITERAL_CHECKS = new Set([
  'hardcoded-color',
  'off-token-type',
  'off-token-radius',
  'off-grid-spacing',
  'shadow-gradient',
]);

export function severityOf(check) {
  return check === 'off-grid-spacing' ? 'warning' : 'error';
}

// ---------------------------------------------------------------------------------------------
// Corner scale (numbers embedded at build time; see tools/build/shape-scale.mjs in the m3-forge repository).

const SHAPE = JSON.parse(readFileSync(new URL('./shape-scale.json', import.meta.url), 'utf8'));
export const SHAPE_SCALE = SHAPE.scale;
const SCALE_SET = new Set(SHAPE_SCALE);
const FULL = Math.max(...SHAPE_SCALE);

// A radius in dp/px is on the scale if it is a scale value, or so large that it reads as "full".
export function radiusOnScale(n) {
  const a = Math.abs(n);
  return SCALE_SET.has(a) || a >= 999 || a === FULL;
}

export function onGrid(n) {
  const a = Math.abs(n);
  return Number.isFinite(a) && a % 4 === 0;
}

// ---------------------------------------------------------------------------------------------
// Files.

export const SKIP_DIRS = new Set([
  'node_modules', 'dist', 'build', '.dart_tool', '.gradle', '.git', '.idea', '.vscode',
  '.next', '.nuxt', '.svelte-kit', '.output', '.cache', '.parcel-cache', 'coverage', '.kotlin',
]);

const GENERATED_HEADER =
  /GENERATED CODE|@generated|DO NOT EDIT|Code generated|auto-?generated|This file (?:was|is) generated/i;

export function looksGenerated(text) {
  return GENERATED_HEADER.test(text.split('\n', 6).join('\n'));
}

// Recursive walk below `root`, skipping SKIP_DIRS. Returns sorted posix paths relative to `base`.
export async function walk(base, root = base, prefix = '') {
  let entries;
  try {
    entries = await readdir(root, { withFileTypes: true });
  } catch {
    return [];
  }
  const out = [];
  for (const e of entries) {
    if (e.isDirectory()) {
      if (SKIP_DIRS.has(e.name)) continue;
      out.push(...(await walk(base, join(root, e.name), `${prefix}${e.name}/`)));
    } else if (e.isFile()) {
      out.push(`${prefix}${e.name}`);
    }
  }
  return out.sort();
}

export async function readText(projectDir, rel) {
  const raw = await readFile(join(projectDir, ...rel.split('/')), 'utf8');
  return raw.replace(/^﻿/, '').replace(/\r\n?/g, '\n');
}

export function countNonBlank(text) {
  let n = 0;
  for (const l of text.split('\n')) if (l.trim() !== '') n++;
  return n;
}

// ---------------------------------------------------------------------------------------------
// Comment stripping. Comments become spaces (newlines kept), so offsets and lines do not move.
// Strings are kept: emoji and color literals live in them.

export function stripComments(text, opts = {}) {
  const {
    line = true, // `//` comments
    block = true, // `/* */` comments
    html = false, // `<!-- -->` comments
    quotes = ['"', "'"], // single-line string delimiters
    backtick = false, // multi-line template strings (JS)
    triple = false, // """ / ''' multi-line strings (Dart, Kotlin)
    start = 0,
    end = text.length,
  } = opts;
  const out = text.split('');
  const blank = (a, b) => {
    for (let k = a; k < b; k++) if (out[k] !== '\n') out[k] = ' ';
  };
  let i = start;
  while (i < end) {
    const c = text[i];
    const n = text[i + 1];
    if (html && text.startsWith('<!--', i)) {
      const j = text.indexOf('-->', i + 4);
      const stop = j === -1 || j + 3 > end ? end : j + 3;
      blank(i, stop);
      i = stop;
      continue;
    }
    if (block && c === '/' && n === '*') {
      const j = text.indexOf('*/', i + 2);
      const stop = j === -1 || j + 2 > end ? end : j + 2;
      blank(i, stop);
      i = stop;
      continue;
    }
    if (line && c === '/' && n === '/' && text[i - 1] !== ':') {
      let j = text.indexOf('\n', i);
      if (j === -1 || j > end) j = end;
      blank(i, j);
      i = j;
      continue;
    }
    if (triple && (c === '"' || c === "'") && n === c && text[i + 2] === c) {
      const j = text.indexOf(c.repeat(3), i + 3);
      i = j === -1 ? end : j + 3;
      continue;
    }
    if (backtick && c === '`') {
      let j = i + 1;
      while (j < end && text[j] !== '`') j += text[j] === '\\' ? 2 : 1;
      i = j + 1;
      continue;
    }
    if (quotes.includes(c)) {
      let j = i + 1;
      while (j < end && text[j] !== c && text[j] !== '\n') j += text[j] === '\\' ? 2 : 1;
      i = j + 1;
      continue;
    }
    i++;
  }
  return out.join('');
}

// ---------------------------------------------------------------------------------------------
// Positions and small parsers.

export function lineStarts(text) {
  const starts = [0];
  for (let i = 0; i < text.length; i++) if (text[i] === '\n') starts.push(i + 1);
  return starts;
}

export function lineAt(starts, pos) {
  let lo = 0;
  let hi = starts.length - 1;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (starts[mid] <= pos) lo = mid;
    else hi = mid - 1;
  }
  return lo + 1;
}

// Index just past the bracket that closes the one at `open` (any of ( [ {). Quotes are skipped.
export function matchClose(text, open) {
  const pairs = { '(': ')', '[': ']', '{': '}' };
  const stack = [];
  for (let i = open; i < text.length; i++) {
    const c = text[i];
    if (c === '"' || c === "'" || c === '`') {
      let j = i + 1;
      while (j < text.length && text[j] !== c && text[j] !== '\n') j += text[j] === '\\' ? 2 : 1;
      i = j;
      continue;
    }
    if (pairs[c]) stack.push(pairs[c]);
    else if (c === ')' || c === ']' || c === '}') {
      stack.pop();
      if (stack.length === 0) return i + 1;
    }
  }
  return text.length;
}

// Arguments of the call whose `(` is at or after `pos`: { open, close, args }.
export function callArgs(text, pos) {
  const open = text.indexOf('(', pos);
  if (open === -1) return null;
  const close = matchClose(text, open);
  return { open, close, args: text.slice(open + 1, close - 1) };
}

// ---------------------------------------------------------------------------------------------
// Emoji: pictographs with emoji presentation, or text pictographs forced to emoji by VS16.
// (©, ®, ™ and arrows stay allowed.)
const EMOJI = /\p{Emoji_Presentation}|\p{Extended_Pictographic}️/gu;

export function findEmoji(text, cb) {
  EMOJI.lastIndex = 0;
  let m;
  while ((m = EMOJI.exec(text))) cb(m.index, m[0]);
}

// ---------------------------------------------------------------------------------------------
// Hit collector. One violation per (check, file, line); literal hits inside an exemption are
// moved to the allowlist instead.

export class Collector {
  constructor() {
    this.violations = [];
    this.allowlisted = [];
    this.seen = new Set();
  }

  // file: rel path; starts: lineStarts(text); exempt(pos) -> allowlist entry or null.
  forFile(file, text, exempt = () => null) {
    const starts = lineStarts(text);
    return (check, pos, detail) => {
      const line = lineAt(starts, pos);
      if (LITERAL_CHECKS.has(check)) {
        const entry = exempt(pos);
        if (entry) {
          const key = `allow\t${check}\t${file}\t${line}`;
          if (!this.seen.has(key)) {
            this.seen.add(key);
            entry.suppressed[check] = (entry.suppressed[check] || 0) + 1;
          }
          return;
        }
      }
      const key = `${check}\t${file}\t${line}`;
      if (this.seen.has(key)) return;
      this.seen.add(key);
      this.violations.push({ check, file, line, detail, severity: severityOf(check) });
    };
  }

  allow(entry) {
    this.allowlisted.push(entry);
    return entry;
  }
}
