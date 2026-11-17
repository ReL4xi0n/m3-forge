// references/web: the four files exist and stay within the always-read budget, every component link
// in references/core/components.md lands on a section of references/web/components.md, every shipped
// component part and page input is documented, and frameworks.md has one example per framework.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { WEB_COMPONENTS } from '../../../plugin/skills/material3/scripts/install-assets/manifest.mjs';

const skill = fileURLToPath(new URL('../../../plugin/skills/material3/', import.meta.url));
const FILES = ['setup', 'components', 'frameworks', 'icons'];
const WEB_REFS_MAX_CHARS = 30_000;
const read = (rel) => readFileSync(join(skill, rel), 'utf8');
const refs = Object.fromEntries(FILES.map((f) => [f, read(`references/web/${f}.md`)]));

// GitHub-style heading slugs.
const slug = (h) => h.trim().toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
const anchors = (md) => new Set([...md.matchAll(/^#{1,6} (.+)$/gm)].map((m) => slug(m[1])));

test(`the four web references total at most ${WEB_REFS_MAX_CHARS} characters`, () => {
  const total = FILES.reduce((n, f) => n + refs[f].length, 0);
  assert.ok(total <= WEB_REFS_MAX_CHARS, `${total} characters`);
});

test('every components.md#<anchor> link in the core components note has a web section', () => {
  const links = [...read('references/core/components.md').matchAll(/references\/<platform>\/components\.md#([\w-]+)/g)].map((m) => m[1]);
  assert.ok(links.length >= 30, `${links.length} links`);
  assert.ok(links.includes('floating-action-button-menu'));
  const have = anchors(refs.components);
  assert.deepEqual(links.filter((a) => !have.has(a)), []);
});

test('every shipped component part, page input and overlay attribute is documented', () => {
  for (const part of WEB_COMPONENTS) assert.match(refs.components, new RegExp(`Parts? \`${part}\`|\`${part}\``), part);
  for (const input of ['--m3-text-field-notch-color', '--m3-slider-value', '--m3-progress-value', 'data-scrolled', 'data-open', 'showModal()']) {
    assert.ok(refs.components.includes(input), input);
  }
  for (const api of ['M3.dialog', 'M3.menu', 'M3.snackbar']) assert.ok(refs.components.includes(api), api);
  assert.doesNotMatch(refs.components, /m3-menu-item[^\n]*aria-selected/, 'menu items use aria-checked only');
});

test('setup names the parts, the theme file, the link order, the theme attributes and the screenshot step', () => {
  for (const s of ['--parts tokens,fonts', '<main>/theme.css', 'data-theme', 'data-contrast', 'data-m3-style="classic"', 'scripts/screenshot/index.mjs']) {
    assert.ok(refs.setup.includes(s), s);
  }
  const order = ['fonts.css', 'tokens.css', 'theme.css', 'button.css', 'behaviors.js'].map((f) => refs.setup.indexOf(`assets/m3/${f}`));
  assert.deepEqual([...order].sort((a, b) => a - b), order, 'link order');
});

test('frameworks.md: one wrapper example each for React, Vue and Svelte over the shared classes', () => {
  for (const fw of ['React', 'Vue', 'Svelte']) {
    const section = refs.frameworks.split(/^## /m).find((s) => s.startsWith(`${fw}\n`));
    assert.ok(section, fw);
    assert.equal((section.match(/^```\w+$/gm) ?? []).length, 1, `${fw}: one example`);
    assert.match(section, /m3-button/, `${fw}: uses the shared classes`);
  }
  assert.doesNotMatch(refs.frameworks, /styled-components|@emotion|from 'tailwind|class(Name)?="[^"]*\b(?:flex|p-\d|bg-)/);
});

test('icons.md: the icons command, ligature markup, FILL for selected, subset and no-Node path', () => {
  for (const s of ['--platform web --names', 'aria-hidden="true">favorite<', "'FILL' 1", 'subset: true', 'subset: false', 'Without Node']) {
    assert.ok(refs.icons.includes(s), s);
  }
});
