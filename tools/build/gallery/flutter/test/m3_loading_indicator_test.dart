// M3LoadingIndicator (material_ui only): goldens at several animation frames, contained and not,
// light and dark; semantics; reduced motion.
import 'package:flutter/material.dart';
import 'package:flutter/scheduler.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:m3_gallery/loading_indicator_showcase.dart';
import 'package:m3_gallery/m3/expressive/loading_indicator.dart';

import 'support.dart';

void main() {
  for (final Brightness b in Brightness.values) {
    testWidgets('golden ${b.name}', (WidgetTester tester) async {
      final List<bool> shown = List<bool>.filled(loadingFrames.length, false);
      late StateSetter set;
      await pumpApp(tester, StatefulBuilder(builder: (BuildContext context, StateSetter s) {
        set = s;
        return loadingRows(shown);
      }), brightness: b, height: 260);
      int now = 0;
      for (int i = 0; i < loadingFrames.length; i++) {
        final int start = loadingFrames[0] - loadingFrames[i];
        await tester.pump(Duration(milliseconds: start - now));
        now = start;
        set(() => shown[i] = true);
        await tester.pump();
      }
      await tester.pump(Duration(milliseconds: loadingFrames[0] - now));
      await expectLater(find.byType(MaterialApp), matchesGoldenFile('goldens/loading_indicator_${b.name}.png'));
    });
  }

  testWidgets('semantics: labelled, 48 dp by default', (WidgetTester tester) async {
    final SemanticsHandle handle = tester.ensureSemantics();
    await pumpApp(tester, const Center(child: M3LoadingIndicator(semanticLabel: 'Loading messages')));
    expect(find.bySemanticsLabel('Loading messages'), findsOneWidget);
    expect(tester.getSize(find.byType(M3LoadingIndicator)), const Size(48, 48));
    handle.dispose();
  });

  testWidgets('animates by default', (WidgetTester tester) async {
    await pumpApp(tester, const Center(child: M3LoadingIndicator()));
    await tester.pump(const Duration(milliseconds: 100));
    expect(SchedulerBinding.instance.transientCallbackCount, greaterThan(0));
  });

  testWidgets('reduced motion: no animation runs', (WidgetTester tester) async {
    await pumpApp(tester, const Center(child: M3LoadingIndicator()), reduceMotion: true);
    await tester.pump(const Duration(milliseconds: 100));
    expect(SchedulerBinding.instance.transientCallbackCount, 0);
  });
}
