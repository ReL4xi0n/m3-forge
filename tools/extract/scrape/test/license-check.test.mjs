import { test } from 'node:test';
import assert from 'node:assert/strict';
import { join } from 'node:path';
import { findLicenseSentences, licenseDir, REPORT_ROBOTS_SHA256 } from '../license-check.mjs';

test('findLicenseSentences returns the license sentences verbatim', () => {
  const text = 'Intro line.\nYou may reuse these notes per CC BY 4.0 terms. Another sentence here.\nUnrelated.';
  assert.deepEqual(findLicenseSentences(text), ['You may reuse these notes per CC BY 4.0 terms.']);
  assert.deepEqual(findLicenseSentences('Licensed under Creative Commons Attribution.'), ['Licensed under Creative Commons Attribution.']);
  assert.deepEqual(findLicenseSentences('No license words.'), []);
});

test('licenseDir stays inside private/raw and needs a date', () => {
  assert.equal(licenseDir(join('x', 'private'), '2026-11-13'), join('x', 'private', 'raw', 'license-check', '2026-11-13'));
  assert.throws(() => licenseDir(join('x', 'private'), '../evil'), /YYYY-MM-DD/);
});

test('the robots.txt hash recorded in the terms report is pinned', () => {
  assert.equal(REPORT_ROBOTS_SHA256, 'f2277178e0afd0938b7ba3610d8005d2c14101c1615684f23db96f9da08ccdc1');
});
