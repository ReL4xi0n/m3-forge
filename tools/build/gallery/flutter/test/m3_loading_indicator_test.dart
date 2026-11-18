// M3LoadingIndicator (material_ui only): goldens at several animation frames, contained and not,
// light and dark; semantics; reduced motion.
import 'package:flutter/material.dart';
import 'package:flutter/scheduler.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:m3_gallery/m3/expressive/loading_indicator.dart';

import 'support.dart';

// Elapsed milliseconds shown, longest first; each slot is mounted so it has run exactly that long.
const List<int> _frames = <int>[2600, 1400, 800, 400, 150, 0];

Widget _rows(List<bool> shown) => Column(crossAxisAlignment: CrossAxisAlignment.start, children: <Widget>[
      for (final bool contained in <bool>[false, true])
        labelled(
          '${contained ? 'Contained' : 'Default'}: after 2600, 1400, 800, 400, 150, 0 ms',
          Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: <Widget>[
            for (int i = 0; i < _frames.length; i++)
              SizedBox(width: 48, height: 48, child: shown[i] ? M3LoadingIndicator(contained: contained, semanticLabel: 'Loading') : null),
          ]),
        ),
    ]);

void main() {
  for (final Brightness b in Brightness.values) {
    testWidgets('golden ${b.name}', (WidgetTester tester) async {
      final List<bool> shown = List<bool>.filled(_frames.length, false);
      late StateSetter set;
      await pumpApp(tester, StatefulBuilder(builder: (BuildContext context, StateSetter s) {
        set = s;
        return _rows(shown);
      }), brightness: b, height: 260);
      int now = 0;
      for (int i = 0; i < _frames.length; i++) {
        final int start = _frames[0] - _frames[i];
        await tester.pump(Duration(milliseconds: start - now));
        now = start;
        set(() => shown[i] = true);
        await tester.pump();
      }
      await tester.pump(Duration(milliseconds: _frames[0] - now));
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
