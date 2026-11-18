// Real Flutter SDK (M3_TOOLCHAIN_TESTS=1, the local toolchain): the shipped scaffold, after
// `flutter create` and the setup steps, analyzes clean, and the screenshot step runs on it (path
// with spaces): 8 PNGs (4 frames per theme), runtime in the shape verify reads, project unchanged.
// Set M3_KEEP_SHOTS=<folder> to keep the PNGs for a look.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { cpSync, existsSync, mkdtempSync, readdirSync, readFileSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { screenshot } from '../index.mjs';
import { installAssets } from '../../install-assets/index.mjs';
import { writeTheme } from '../../color/index.mjs';

const REPO = fileURLToPath(new URL('../../../../../../', import.meta.url));
const SCAFFOLD = fileURLToPath(new URL('../../../assets/flutter/scaffold/', import.meta.url));
const skip = process.env.M3_TOOLCHAIN_TESTS !== '1' && 'needs the local toolchain (M3_TOOLCHAIN_TESTS=1)';

function snapshot(dir, out = {}, base = dir) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) snapshot(p, out, base);
    else out[p.slice(base.length)] = createHash('sha256').update(readFileSync(p)).digest('hex');
  }
  return out;
}

const SCREEN = `import 'package:material_ui/material_ui.dart';

import 'm3/schemes.dart';
import 'm3/theme.dart';

void main() => runApp(const App());

class App extends StatelessWidget {
  const App({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'App',
      theme: M3Theme.light(M3ColorSchemes.light),
      darkTheme: M3Theme.dark(M3ColorSchemes.dark),
      themeMode: ThemeMode.system,
      home: const HomeScreen(),
    );
  }
}

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Home')),
      body: ListView.builder(
        itemCount: 40,
        itemBuilder: (BuildContext context, int i) => i == 0
            ? Row(children: <Widget>[
                TextButton(
                  onPressed: () {},
                  style: TextButton.styleFrom(foregroundColor: const Color(0xFFDDDDDD)),
                  child: const Text('EnabledFaint'),
                ),
                const TextButton(
                  onPressed: null,
                  style: ButtonStyle(foregroundColor: WidgetStatePropertyAll<Color>(Color(0xFFDDDDDD))),
                  child: Text('DisabledFaint'),
                ),
              ])
            : ListTile(
          leading: const Icon(Icons.map_outlined),
          title: Text('Route number \${i + 1}'),
          subtitle: const Text('Lake Orta, 6 km'),
          trailing: IconButton(icon: const Icon(Icons.star_outline), tooltip: 'Save', onPressed: () {}),
        ),
      ),
    );
  }
}
`;

test('real SDK: scaffold analyzes clean; screenshot step gives 8 PNGs and leaves the project unchanged', { skip, timeout: 30 * 60_000 }, async () => {
  const { runTool } = await import(pathToFileURL(join(REPO, 'evals/tools/prepare-fixture.mjs')).href);
  const { withToolchain } = await import(pathToFileURL(join(REPO, 'evals/tools/toolchain-env.mjs')).href);
  const root = realpathSync.native(mkdtempSync(join(tmpdir(), 'm3 scaffold-')));
  const dir = join(root, 'm3_app');
  try {
    cpSync(SCAFFOLD, dir, { recursive: true });
    const create = await runTool('flutter', ['create', '--platforms', 'android,ios', '--project-name', 'm3_app', '.'], dir);
    assert.equal(create.code, 0, create.out);
    writeTheme({ platform: 'flutter', seed: '#6750A4', variant: 'expressive', flutterLibrary: 'material_ui', out: join(dir, 'lib/m3/schemes.dart') });
    const ins = installAssets({ projectDir: dir, platform: 'flutter', parts: ['tokens'] });
    assert.deepEqual(ins.conflicts, []);
    const get = await runTool('flutter', ['pub', 'get'], dir);
    assert.equal(get.code, 0, get.out);
    const an = await runTool('flutter', ['analyze'], dir);
    assert.equal(an.code, 0, an.out);
    assert.match(an.out, /No issues found/);

    // A home screen that scrolls, so the scrolled frames exist.
    writeFileSync(join(dir, 'lib/main.dart'), SCREEN);
    writeFileSync(join(dir, 'test/widget_test.dart'), "import 'package:flutter_test/flutter_test.dart';\nvoid main() { test('ok', () {}); }\n");
    // The project's own test config must stay in effect (chained after the fonts load).
    writeFileSync(join(dir, 'test/flutter_test_config.dart'), "import 'dart:async';\n\nFuture<void> testExecutable(FutureOr<void> Function() testMain) async {\n  await testMain();\n}\n");
    const before = snapshot(dir);
    const out = join(root, 'shots');
    const r = await screenshot({ projectDir: dir, platform: 'flutter', out, env: withToolchain(process.env) });
    assert.equal(r.ran, true, r.skippedReason);
    assert.equal(r.shots.length, 8, r.shots.join('\n'));
    for (const s of r.shots) assert.ok(readFileSync(s).subarray(1, 4).toString() === 'PNG', s);
    assert.ok(Array.isArray(r.runtime.contrast) && Array.isArray(r.runtime.targets));
    for (const f of [...r.runtime.contrast, ...r.runtime.targets]) assert.ok(f.where && f.detail);
    // Contrast: the enabled faint button is reported, the disabled one is not.
    const text = JSON.stringify(r.runtime.contrast);
    assert.match(text, /EnabledFaint/, text);
    assert.doesNotMatch(text, /DisabledFaint/, text);
    assert.deepEqual(snapshot(dir), before);
    assert.ok(!existsSync(join(dir, 'test', 'm3_shots_test.dart')));
    if (process.env.M3_KEEP_SHOTS) cpSync(out, process.env.M3_KEEP_SHOTS, { recursive: true });
  } finally { rmSync(root, { recursive: true, force: true }); }
});
