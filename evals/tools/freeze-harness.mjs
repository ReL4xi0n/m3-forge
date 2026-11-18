#!/usr/bin/env node
// Freezes the Flutter capture harness v3 (owner decision 2026-11-18: real elevation shadows). Hashes are over
// LF-normalized bytes. v2 stays in capture_test.v2.dart only to reproduce the old numbers.
//   node evals/tools/freeze-harness.mjs        writes evals/frozen-harness.json
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { hashText } from './frozen.mjs';

export const HARNESS_FILES = ['harness/flutter/capture_test.dart', 'harness/flutter/capture_test.v2.dart', 'harness/flutter/flutter_test_config.dart', 'harness/flutter/capture.mjs'];
export const hashes = (root) => Object.fromEntries(HARNESS_FILES.map((f) => [f, hashText(readFileSync(join(root, ...f.split('/'))))]));

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
  writeFileSync(join(root, 'evals', 'frozen-harness.json'), `${JSON.stringify({ flutterHarness: 'v3', frozenOn: '2026-11-18', files: hashes(root) }, null, 2)}\n`);
  console.log('frozen flutter harness v3');
}
