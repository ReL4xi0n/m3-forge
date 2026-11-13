// Spec §10 gate: variable-font axes must render under flutter_tester.
// Each pair differs in one axis only. If a pair renders pixel-identical, that axis does not render
// and the Flutter harness must not be built on top of it.
//
// Images go to M3_SMOKE_OUT (default build/m3_smoke), with smoke-result.json listing pixel diffs.
import 'dart:convert';
import 'dart:io';
import 'dart:typed_data';
import 'dart:ui' as ui;

import 'package:flutter/rendering.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_test/flutter_test.dart';

import '../../flutter_test_config.dart' show m3RobotoFlex, m3Symbols, m3SymbolCodepoint;

const Color _ink = Color(0xFF000000);
const Color _paper = Color(0xFFFFFFFF);

Widget _flex(List<FontVariation> axes) => Text(
      'Hamburgefonstiv 0123',
      style: TextStyle(fontFamily: m3RobotoFlex, fontSize: 40, color: _ink, fontVariations: axes),
    );

Widget _icon(int codepoint, {required double fill, required double weight}) => Icon(
      IconData(codepoint, fontFamily: m3Symbols),
      size: 96,
      color: _ink,
      fill: fill,
      weight: weight,
      opticalSize: 48,
    );

Future<({Uint8List rgba, Uint8List png})> _render(WidgetTester tester, Widget child) async {
  final GlobalKey key = GlobalKey();
  await tester.pumpWidget(
    Directionality(
      textDirection: TextDirection.ltr,
      child: Center(
        child: RepaintBoundary(
          key: key,
          child: ColoredBox(
            color: _paper,
            child: SizedBox(width: 560, height: 160, child: Center(child: child)),
          ),
        ),
      ),
    ),
  );
  final RenderRepaintBoundary boundary = key.currentContext!.findRenderObject()! as RenderRepaintBoundary;
  return (await tester.runAsync(() async {
    final ui.Image image = await boundary.toImage();
    final ByteData rgba = (await image.toByteData(format: ui.ImageByteFormat.rawRgba))!;
    final ByteData png = (await image.toByteData(format: ui.ImageByteFormat.png))!;
    image.dispose();
    return (rgba: rgba.buffer.asUint8List(), png: png.buffer.asUint8List());
  }))!;
}

int _diffPixels(Uint8List a, Uint8List b) {
  expect(a.length, b.length, reason: 'images differ in size');
  int n = 0;
  for (int i = 0; i < a.length; i += 4) {
    if (a[i] != b[i] || a[i + 1] != b[i + 1] || a[i + 2] != b[i + 2] || a[i + 3] != b[i + 3]) n++;
  }
  return n;
}

int _inkPixels(Uint8List rgba) {
  int n = 0;
  for (int i = 0; i < rgba.length; i += 4) {
    if (rgba[i] < 128) n++;
  }
  return n;
}

void main() {
  final String outDir = Platform.environment['M3_SMOKE_OUT'] ?? 'build/m3_smoke';
  final Map<String, Object> results = <String, Object>{};

  tearDownAll(() {
    Directory(outDir).createSync(recursive: true);
    File('$outDir/smoke-result.json').writeAsStringSync(const JsonEncoder.withIndent('  ').convert(results));
  });

  final int favorite = m3SymbolCodepoint('favorite');

  final Map<String, (Widget, Widget)> pairs = <String, (Widget, Widget)>{
    'flex-wght-300-vs-800': (
      _flex(const <FontVariation>[FontVariation('wght', 300)]),
      _flex(const <FontVariation>[FontVariation('wght', 800)]),
    ),
    'flex-opsz-8-vs-144': (
      _flex(const <FontVariation>[FontVariation('opsz', 8)]),
      _flex(const <FontVariation>[FontVariation('opsz', 144)]),
    ),
    'symbol-fill-0-vs-1': (
      _icon(favorite, fill: 0, weight: 400),
      _icon(favorite, fill: 1, weight: 400),
    ),
    'symbol-wght-200-vs-700': (
      _icon(favorite, fill: 0, weight: 200),
      _icon(favorite, fill: 0, weight: 700),
    ),
  };

  for (final MapEntry<String, (Widget, Widget)> pair in pairs.entries) {
    testWidgets('axis renders: ${pair.key}', (WidgetTester tester) async {
      final ({Uint8List rgba, Uint8List png}) a = await _render(tester, pair.value.$1);
      final ({Uint8List rgba, Uint8List png}) b = await _render(tester, pair.value.$2);
      Directory(outDir).createSync(recursive: true);
      File('$outDir/${pair.key}-a.png').writeAsBytesSync(a.png);
      File('$outDir/${pair.key}-b.png').writeAsBytesSync(b.png);
      final int diff = _diffPixels(a.rgba, b.rgba);
      results[pair.key] = <String, Object>{
        'a': '${pair.key}-a.png',
        'b': '${pair.key}-b.png',
        'pixels': a.rgba.length ~/ 4,
        'diffPixels': diff,
        'inkA': _inkPixels(a.rgba),
        'inkB': _inkPixels(b.rgba),
      };
      expect(_inkPixels(a.rgba), greaterThan(0), reason: '${pair.key}: nothing drawn');
      expect(diff, greaterThan(0), reason: '${pair.key}: pixel-identical, so the axis does not render');
    });
  }
}
