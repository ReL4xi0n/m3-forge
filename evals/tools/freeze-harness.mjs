#!/usr/bin/env node
// Freezes the Flutter capture harness v3 (owner decision 2026-11-18: real elevation shadows) and the Compose
// capture harness v3 (owner decision 2026-11-18: touch targets include minimumInteractiveComponentSize). Hashes are over
// LF-normalized bytes. v2 stays in capture_test.v2.dart only to reproduce the old numbers.
//   node evals/tools/freeze-harness.mjs        writes evals/frozen-harness.json
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { hashText } from './frozen.mjs';

export const HARNESS_FILES = ['harness/flutter/capture_test.dart', 'harness/flutter/capture_test.v2.dart', 'harness/flutter/flutter_test_config.dart', 'harness/flutter/capture.mjs',
  'harness/compose/capture.mjs', 'harness/compose/roborazzi.init.gradle.kts', 'harness/compose/src/test/kotlin/m3forge/harness/CaptureTest.kt'];
export const hashes = (root) => Object.fromEntries(HARNESS_FILES.map((f) => [f, hashText(readFileSync(join(root, ...f.split('/'))))]));

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
  // Amendments (filters that can only remove findings; screenshots unchanged) are kept from the existing file.
  const prev = (() => { try { return JSON.parse(readFileSync(join(root, 'evals', 'frozen-harness.json'), 'utf8')); } catch { return {}; } })();
  writeFileSync(join(root, 'evals', 'frozen-harness.json'), `${JSON.stringify({ flutterHarness: 'v3', composeHarness: 'v3', frozenOn: '2026-11-18', amendments: prev.amendments ?? [], files: hashes(root) }, null, 2)}\n`);
  console.log('frozen flutter and compose harness v3');
}
