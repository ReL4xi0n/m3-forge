// Gallery test config: registers the real fonts before any test runs, so text and icons in the
// golden images are not boxes. Approach copied from harness/flutter/flutter_test_config.dart
// (without its sha256 check; the golden images are local review pictures, not measurements).
// M3_FONTS_DIR names the folder with Roboto.ttf and RobotoFlex.ttf.
import 'dart:async';
import 'dart:convert';
import 'dart:io';

import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';

const List<String> _robotoAliases = <String>[
  'Roboto',
  '.SF UI Text',
  '.SF UI Display',
  '.AppleSystemUIFont',
  'CupertinoSystemText',
  'CupertinoSystemDisplay',
  'FlutterTest',
];

Future<void> testExecutable(FutureOr<void> Function() testMain) async {
  TestWidgetsFlutterBinding.ensureInitialized();
  final String dir = Platform.environment['M3_FONTS_DIR'] ?? (throw StateError('set M3_FONTS_DIR'));
  Future<void> register(String family, String file) async {
    final Uint8List bytes = File('$dir${Platform.pathSeparator}$file').readAsBytesSync();
    final FontLoader loader = FontLoader(family)..addFont(Future<ByteData>.value(ByteData.sublistView(bytes)));
    await loader.load();
  }

  // The app's own families first (MaterialIcons from uses-material-design).
  final Set<String> app = <String>{};
  try {
    final String manifest = await rootBundle.loadString('FontManifest.json');
    for (final dynamic entry in jsonDecode(manifest) as List<dynamic>) {
      final Map<String, dynamic> e = entry as Map<String, dynamic>;
      final FontLoader loader = FontLoader(e['family'] as String);
      for (final dynamic f in e['fonts'] as List<dynamic>) {
        loader.addFont(rootBundle.load((f as Map<String, dynamic>)['asset'] as String));
      }
      await loader.load();
      app.add(e['family'] as String);
    }
  } catch (_) {}
  if (!app.contains('Roboto Flex')) await register('Roboto Flex', 'RobotoFlex.ttf');
  for (final String alias in _robotoAliases) {
    if (!app.contains(alias)) await register(alias, 'Roboto.ttf');
  }
  await testMain();
}
