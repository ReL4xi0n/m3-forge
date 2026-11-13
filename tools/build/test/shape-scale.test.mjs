import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { buildShapeScale } from '../shape-scale.mjs';

const merged = JSON.parse(readFileSync(fileURLToPath(new URL('../../../knowledge/tokens/merged.json', import.meta.url)), 'utf8'));
const committed = JSON.parse(readFileSync(fileURLToPath(new URL('../../../plugin/skills/material3/scripts/verify/shape-scale.json', import.meta.url)), 'utf8'));

test('verify/shape-scale.json is up to date with knowledge/tokens/merged.json', () => {
  assert.deepEqual(buildShapeScale(merged), committed);
});
