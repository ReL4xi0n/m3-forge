// m3-forge Flutter capture (spec §10). harness/flutter/capture.mjs copies this file to a result
// project's test/m3_capture_test.dart after the run, replacing __M3_APP_PACKAGE__ with the `name`
// from the project's pubspec.yaml. The session that wrote the app never sees it.
//
// For each theme it calls the app's main(), settles, then writes to M3_CAPTURE_OUT:
//   <theme>-412x915.png      the root render view at device pixel ratio 2.625
//   runtime-<theme>.json     textContrastGuideline and androidTapTargetGuideline results
// Guideline failures are recorded, not thrown. Both guidelines skip what Flutter skips: nodes with
// no tap/long-press action (null callbacks) and nodes marked enabled: false.
import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'dart:typed_data';
import 'dart:ui' as ui;

import 'package:flutter/rendering.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:__M3_APP_PACKAGE__/main.dart' as app;

const double kWidth = 412;
const double kHeight = 915;
const double kRatio = 2.625;
const String kViewport = '412x915';
const Duration kSettleTimeout = Duration(seconds: 10);

Future<void> _runMain() async {
  final Function entry = app.main;
  final Object? result = entry is Function() ? entry() : Function.apply(entry, <Object>[<String>[]]);
  if (result is Future) await result;
}

Future<Map<String, Object?>> _guideline(WidgetTester tester, AccessibilityGuideline guideline) async {
  try {
    final Evaluation e = await guideline.evaluate(tester);
    return <String, Object?>{'passed': e.passed, 'reason': e.reason};
  } catch (error) {
    // A crash in the guideline is a harness problem, not an app finding; keep it visible.
    return <String, Object?>{'passed': null, 'reason': null, 'error': '$error'};
  }
}

void main() {
  final String outDir = Platform.environment['M3_CAPTURE_OUT'] ??
      (throw StateError('m3-forge: set M3_CAPTURE_OUT to the capture output folder'));

  for (final ui.Brightness brightness in <ui.Brightness>[ui.Brightness.light, ui.Brightness.dark]) {
    final String theme = brightness == ui.Brightness.light ? 'light' : 'dark';

    testWidgets('m3 capture $theme $kViewport', (WidgetTester tester) async {
      tester.view.devicePixelRatio = kRatio;
      tester.view.physicalSize = const Size(kWidth * kRatio, kHeight * kRatio);
      tester.platformDispatcher.platformBrightnessTestValue = brightness;
      addTearDown(tester.view.reset);
      addTearDown(tester.platformDispatcher.clearPlatformBrightnessTestValue);
      final SemanticsHandle semantics = tester.ensureSemantics();

      await _runMain();
      String settle = 'settled';
      try {
        await tester.pumpAndSettle(const Duration(milliseconds: 100), EnginePhase.sendSemanticsUpdate, kSettleTimeout);
      } on FlutterError {
        // Endless animation (a spinner, for example): capture the frame we have.
        settle = 'timeout after ${kSettleTimeout.inSeconds}s';
        await tester.pump();
      }

      final Map<String, Object?> contrast = await _guideline(tester, textContrastGuideline);
      final Map<String, Object?> targets = await _guideline(tester, androidTapTargetGuideline);

      final RenderView view = tester.binding.renderViews.first;
      final OffsetLayer layer = view.debugLayer! as OffsetLayer;
      final List<int> png = (await tester.runAsync(() async {
        final ui.Image image = await layer.toImage(view.paintBounds);
        final ByteData bytes = (await image.toByteData(format: ui.ImageByteFormat.png))!;
        final List<int> out = bytes.buffer.asUint8List(bytes.offsetInBytes, bytes.lengthInBytes);
        image.dispose();
        return out;
      }))!;

      Directory(outDir).createSync(recursive: true);
      File('$outDir${Platform.pathSeparator}$theme-$kViewport.png').writeAsBytesSync(png);
      File('$outDir${Platform.pathSeparator}runtime-$theme.json').writeAsStringSync(
        const JsonEncoder.withIndent('  ').convert(<String, Object?>{
          'theme': theme,
          'viewport': kViewport,
          'devicePixelRatio': kRatio,
          'physicalSize': <double>[view.paintBounds.width, view.paintBounds.height],
          'settle': settle,
          'textContrastGuideline': contrast,
          'androidTapTargetGuideline': targets,
        }),
      );
      semantics.dispose();
    });
  }
}
