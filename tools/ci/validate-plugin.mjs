#!/usr/bin/env node
// Deterministic checks for the m3-forge marketplace, plugin manifest and skill frontmatter.
// Usage: node tools/ci/validate-plugin.mjs [repoRoot]   (exit 1 on any error)
import { readFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const PHRASE = 'an unofficial skill for material design 3';
const MAX_SKILL_LINES = 500;

async function readJson(file, errors) {
  try {
    return JSON.parse(await readFile(file, 'utf8'));
  } catch (e) {
    errors.push(`${file}: cannot read JSON (${e.message})`);
    return null;
  }
}

function parseFrontmatter(text) {
  const lines = text.split(/\r?\n/);
  if (lines[0] !== '---') return null;
  const end = lines.indexOf('---', 1);
  if (end === -1) return null;
  const fm = {};
  for (const line of lines.slice(1, end)) {
    const m = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (m) fm[m[1]] = m[2].trim().replace(/^"(.*)"$/, '$1').replace(/^'(.*)'$/, '$1');
  }
  return { fm, body: lines.slice(end + 1).join('\n'), lineCount: lines.length };
}

export async function validatePlugin(repoRoot) {
  const errors = [];
  const names = [];

  const mp = await readJson(join(repoRoot, '.claude-plugin', 'marketplace.json'), errors);
  if (mp) {
    if (mp.name !== 'm3-forge') errors.push(`marketplace name must be "m3-forge" (got "${mp.name}")`);
    if (!mp.owner || !String(mp.owner.name || '').trim()) errors.push('marketplace owner.name must be non-empty');
    const p = Array.isArray(mp.plugins) ? mp.plugins[0] : null;
    if (!p || p.name !== 'm3-forge' || p.source !== './plugin') {
      errors.push('marketplace plugins[0] must be {name: "m3-forge", source: "./plugin"}');
    }
    names.push(mp.name, p && p.name);
  }

  const pj = await readJson(join(repoRoot, 'plugin', '.claude-plugin', 'plugin.json'), errors);
  if (pj) {
    if (pj.name !== 'm3-forge') errors.push(`plugin.json name must be "m3-forge" (got "${pj.name}")`);
    if (!String(pj.description || '').toLowerCase().includes(PHRASE)) {
      errors.push(`plugin.json description must contain "an unofficial skill for Material Design 3"`);
    }
    names.push(pj.name);
  }

  const skillFile = join(repoRoot, 'plugin', 'skills', 'material3', 'SKILL.md');
  let skillText = null;
  try {
    skillText = await readFile(skillFile, 'utf8');
  } catch (e) {
    errors.push(`SKILL.md missing (${e.message})`);
  }
  if (skillText !== null) {
    const parsed = parseFrontmatter(skillText);
    if (!parsed) {
      errors.push('SKILL.md must start with a --- frontmatter block');
    } else {
      const { fm, body, lineCount } = parsed;
      if (fm.name !== 'material3') errors.push(`SKILL.md frontmatter name must be "material3" (got "${fm.name}")`);
      if (fm['disable-model-invocation'] !== 'true') errors.push('SKILL.md must set disable-model-invocation: true');
      if (!fm['argument-hint']) errors.push('SKILL.md argument-hint must be non-empty');
      if (!body.includes('$ARGUMENTS')) errors.push('SKILL.md body must contain $ARGUMENTS');
      if (lineCount > MAX_SKILL_LINES) errors.push(`SKILL.md must be <= ${MAX_SKILL_LINES} lines (has ${lineCount})`);
      names.push(fm.name);
    }
  }

  for (const n of names) {
    if (n && /google/i.test(n)) errors.push(`name "${n}" must not contain "google"`);
  }
  return errors;
}

if (resolve(process.argv[1] || '') === fileURLToPath(import.meta.url)) {
  const root = resolve(process.argv[2] || '.');
  const errors = await validatePlugin(root);
  for (const e of errors) console.error(`validate-plugin: ${e}`);
  console.log(errors.length ? `validate-plugin: ${errors.length} error(s)` : 'validate-plugin: ok');
  process.exit(errors.length ? 1 : 0);
}
