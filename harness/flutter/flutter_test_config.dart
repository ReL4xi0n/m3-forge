// m3-forge Flutter harness: loads the real fonts before any test runs (spec §10).
//
// The capture runner copies this file into a result project's `test/` folder after the run, so it
// must compile with only `flutter` and `flutter_test` available: no extra packages.
//
// Inputs (environment variables, set by harness/flutter/capture.mjs):
//   M3_FONTS_DIR       folder holding the fonts (default: %M3_TOOLCHAIN%\fonts)
//   M3_FONTS_MANIFEST  tools/toolchain/fonts.json; every font's sha256 is checked against it
//
// Text drawn without a loaded family falls back to the test font (boxes), so Roboto is registered
// under every family name the framework's default typographies ask for.
import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'dart:typed_data';

import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';

const String m3RobotoFlex = 'Roboto Flex';
const String m3Symbols = 'Material Symbols Outlined';

/// Family names that resolve to Roboto: Material's default (`Roboto`), the Cupertino and iOS
/// defaults (`.SF UI Text`, `.SF UI Display`, `CupertinoSystemText`, `CupertinoSystemDisplay`) and
/// the test default (`FlutterTest`), so unstyled text is not drawn as boxes.
const List<String> m3RobotoAliases = <String>[
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
  await m3LoadFonts();
  await testMain();
}

String m3FontsDir() {
  final Map<String, String> env = Platform.environment;
  final String? dir = env['M3_FONTS_DIR'];
  if (dir != null && dir.isNotEmpty) return dir;
  final String? root = env['M3_TOOLCHAIN'];
  if (root != null && root.isNotEmpty) return '$root${Platform.pathSeparator}fonts';
  throw StateError('m3-forge: set M3_FONTS_DIR (or M3_TOOLCHAIN) to the toolchain fonts folder');
}

bool _loaded = false;

/// Verifies every font against fonts.json, then registers the families. Idempotent.
Future<void> m3LoadFonts() async {
  if (_loaded) return;
  final String dir = m3FontsDir();
  final String? manifestPath = Platform.environment['M3_FONTS_MANIFEST'];
  if (manifestPath == null || manifestPath.isEmpty) {
    throw StateError('m3-forge: set M3_FONTS_MANIFEST to tools/toolchain/fonts.json');
  }
  final Map<String, dynamic> manifest =
      jsonDecode(File(manifestPath).readAsStringSync()) as Map<String, dynamic>;
  final Map<String, String> expected = <String, String>{
    for (final dynamic f in manifest['files'] as List<dynamic>)
      (f as Map<String, dynamic>)['name'] as String: f['sha256'] as String,
  };

  Uint8List read(String name) {
    final File file = File('$dir${Platform.pathSeparator}$name');
    if (!file.existsSync()) throw StateError('m3-forge: font missing: ${file.path}');
    final Uint8List bytes = file.readAsBytesSync();
    final String want = expected[name] ?? (throw StateError('m3-forge: $name is not in fonts.json'));
    final String got = m3Sha256Hex(bytes);
    if (got != want) {
      throw StateError('m3-forge: sha256 mismatch for $name: got $got, fonts.json says $want');
    }
    return bytes;
  }

  Future<void> register(String family, Uint8List bytes) async {
    final FontLoader loader = FontLoader(family)..addFont(Future<ByteData>.value(ByteData.sublistView(bytes)));
    await loader.load();
  }

  final Uint8List flex = read('RobotoFlex.ttf');
  final Uint8List roboto = read('Roboto.ttf');
  final Uint8List symbols = read('MaterialSymbolsOutlined.ttf');
  read('MaterialSymbolsOutlined.codepoints'); // verified here; m3SymbolCodepoint reads it later
  await register(m3RobotoFlex, flex);
  for (final String alias in m3RobotoAliases) {
    await register(alias, roboto);
  }
  await register(m3Symbols, symbols);
  _loaded = true;
}

/// Reads `name codepoint` lines from MaterialSymbolsOutlined.codepoints (checked against fonts.json
/// like the fonts) and returns the codepoint for [name].
int m3SymbolCodepoint(String name) {
  final File file = File('${m3FontsDir()}${Platform.pathSeparator}MaterialSymbolsOutlined.codepoints');
  for (final String line in file.readAsLinesSync()) {
    final List<String> parts = line.trim().split(RegExp(r'\s+'));
    if (parts.length == 2 && parts[0] == name) return int.parse(parts[1], radix: 16);
  }
  throw StateError('m3-forge: no codepoint for "$name"');
}

// SHA-256 (FIPS 180-4), so the check needs no package beyond flutter_test.
const List<int> _k = <int>[
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
  0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
  0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
  0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
  0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
  0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
];

String m3Sha256Hex(Uint8List data) {
  const int mask = 0xffffffff;
  int rotr(int x, int n) => ((x >> n) | (x << (32 - n))) & mask;
  final int bitLength = data.length * 8;
  final int padded = ((data.length + 9 + 63) ~/ 64) * 64;
  final Uint8List msg = Uint8List(padded)..setRange(0, data.length, data);
  msg[data.length] = 0x80;
  final ByteData view = ByteData.sublistView(msg);
  view.setUint32(padded - 8, (bitLength ~/ 0x100000000) & mask);
  view.setUint32(padded - 4, bitLength & mask);
  final List<int> h = <int>[
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19,
  ];
  final List<int> w = List<int>.filled(64, 0);
  for (int off = 0; off < padded; off += 64) {
    for (int i = 0; i < 16; i++) {
      w[i] = view.getUint32(off + i * 4);
    }
    for (int i = 16; i < 64; i++) {
      final int s0 = rotr(w[i - 15], 7) ^ rotr(w[i - 15], 18) ^ (w[i - 15] >> 3);
      final int s1 = rotr(w[i - 2], 17) ^ rotr(w[i - 2], 19) ^ (w[i - 2] >> 10);
      w[i] = (w[i - 16] + s0 + w[i - 7] + s1) & mask;
    }
    int a = h[0], b = h[1], c = h[2], d = h[3], e = h[4], f = h[5], g = h[6], hh = h[7];
    for (int i = 0; i < 64; i++) {
      final int s1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25);
      final int ch = (e & f) ^ ((~e & mask) & g);
      final int t1 = (hh + s1 + ch + _k[i] + w[i]) & mask;
      final int s0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22);
      final int maj = (a & b) ^ (a & c) ^ (b & c);
      final int t2 = (s0 + maj) & mask;
      hh = g;
      g = f;
      f = e;
      e = (d + t1) & mask;
      d = c;
      c = b;
      b = a;
      a = (t1 + t2) & mask;
    }
    h[0] = (h[0] + a) & mask;
    h[1] = (h[1] + b) & mask;
    h[2] = (h[2] + c) & mask;
    h[3] = (h[3] + d) & mask;
    h[4] = (h[4] + e) & mask;
    h[5] = (h[5] + f) & mask;
    h[6] = (h[6] + g) & mask;
    h[7] = (h[7] + hh) & mask;
  }
  return h.map((int x) => x.toRadixString(16).padLeft(8, '0')).join();
}
