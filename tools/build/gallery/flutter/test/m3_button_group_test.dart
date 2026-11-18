// M3ButtonGroup: goldens (standard and connected; rest, selected, pressed; light and dark),
// 48 dp targets, press width change and reduced motion.
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:m3_gallery/button_group_showcase.dart';
import 'package:m3_gallery/m3/expressive/button_group.dart';

import 'support.dart';

Finder _week(String group) => find.descendant(of: find.byKey(ValueKey<String>(group)), matching: find.text('Week'));

void main() {
  for (final Brightness b in Brightness.values) {
    testWidgets('golden ${b.name}', (WidgetTester tester) async {
      await pumpApp(tester, groupSpecimens(), brightness: b, height: 520);
      await tester.pumpAndSettle();
      final TestGesture g1 = await tester.startGesture(tester.getCenter(_week('std')), pointer: 1);
      final TestGesture g2 = await tester.startGesture(tester.getCenter(_week('con')), pointer: 2);
      await tester.pump(); // the spring starts on its first frame
    await tester.pump(const Duration(milliseconds: 700));
      await expectLater(find.byType(MaterialApp), matchesGoldenFile('goldens/button_group_${b.name}.png'));
      await g1.up();
      await g2.up();
      await tester.pumpAndSettle();
    });
  }

  testWidgets('every button meets the 48 dp target and has a label', (WidgetTester tester) async {
    final SemanticsHandle handle = tester.ensureSemantics();
    await pumpApp(tester, groupSpecimens(), height: 520);
    await tester.pumpAndSettle();
    await expectLater(tester, meetsGuideline(androidTapTargetGuideline));
    await expectLater(tester, meetsGuideline(labeledTapTargetGuideline));
    handle.dispose();
  });

  testWidgets('standard group: pressing a button widens it and narrows its neighbor, the group keeps its width', (WidgetTester tester) async {
    await pumpApp(tester, M3ButtonGroup(key: const ValueKey<String>('g'), children: groupButtons(<int>{})));
    await tester.pumpAndSettle();
    final Finder group = find.byKey(const ValueKey<String>('g'));
    final double total = tester.getSize(group).width;
    final double week = tester.getRect(find.widgetWithText(FilledButton, 'Week')).width;
    final double day = tester.getRect(find.widgetWithText(FilledButton, 'Day')).width;
    final TestGesture g = await tester.startGesture(tester.getCenter(find.text('Week')));
    await tester.pump(); // the spring starts on its first frame
    await tester.pump(const Duration(milliseconds: 800));
    expect(tester.getRect(find.widgetWithText(FilledButton, 'Week')).width, greaterThan(week));
    expect(tester.getRect(find.widgetWithText(FilledButton, 'Day')).width, lessThan(day));
    expect(tester.getSize(group).width, closeTo(total, 0.01));
    await g.up();
    await tester.pumpAndSettle();
    expect(tester.getRect(find.widgetWithText(FilledButton, 'Week')).width, closeTo(week, 0.01));
  });

  testWidgets('reduced motion: no width change on press', (WidgetTester tester) async {
    await pumpApp(tester, M3ButtonGroup(children: groupButtons(<int>{})), reduceMotion: true);
    await tester.pumpAndSettle();
    final double week = tester.getRect(find.widgetWithText(FilledButton, 'Week')).width;
    final TestGesture g = await tester.startGesture(tester.getCenter(find.text('Week')));
    await tester.pump(); // the spring starts on its first frame
    await tester.pump(const Duration(milliseconds: 800));
    expect(tester.getRect(find.widgetWithText(FilledButton, 'Week')).width, week);
    await g.up();
    await tester.pumpAndSettle();
  });

  testWidgets('connected group: 2 dp apart, the pressed button changes shape, not width', (WidgetTester tester) async {
    await pumpApp(tester, M3ButtonGroup(connected: true, children: groupButtons(<int>{})));
    await tester.pumpAndSettle();
    final Rect a = tester.getRect(find.widgetWithText(FilledButton, 'Day'));
    final Rect b = tester.getRect(find.widgetWithText(FilledButton, 'Week'));
    expect(b.left - a.right, 2);
    final TestGesture g = await tester.startGesture(tester.getCenter(find.text('Week')));
    await tester.pump(); // the spring starts on its first frame
    await tester.pump(const Duration(milliseconds: 800));
    expect(tester.getRect(find.widgetWithText(FilledButton, 'Week')), b);
    await g.up();
    await tester.pumpAndSettle();
  });
}
