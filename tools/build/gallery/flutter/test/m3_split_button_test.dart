// M3SplitButton: goldens (styles, sizes, menu open; light and dark), 48 dp targets and accessible names,
// the menu, the inner-corner morph and reduced motion.
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:m3_gallery/split_button_showcase.dart';

import 'support.dart';

Finder _trailing() => find.bySemanticsLabel('More send options');
Finder _lead(String label) => find.widgetWithText(FilledButton, label);

BorderRadiusDirectional _radius(WidgetTester tester, Finder button) {
  final Material m = tester.widget<Material>(find.descendant(of: button, matching: find.byType(Material)).first);
  return (m.shape! as RoundedRectangleBorder).borderRadius as BorderRadiusDirectional;
}

// The smallest cosine over the transforms of the split button: 1 while the menu icon is upright,
// -1 after half a turn.
double _turn(WidgetTester tester) {
  double least = 1;
  for (final Transform t in tester.widgetList<Transform>(find.descendant(of: find.byType(MenuAnchor), matching: find.byType(Transform)))) {
    final double cos = t.transform.storage[0];
    if (cos < least) least = cos;
  }
  return least;
}

void main() {
  for (final Brightness b in Brightness.values) {
    testWidgets('golden ${b.name}', (WidgetTester tester) async {
      useRealShadows();
      await pumpApp(tester, SingleChildScrollView(child: splitSpecimens()), brightness: b, height: 900);
      await tester.pumpAndSettle();
      await tester.tap(find.descendant(of: find.byKey(openSplitKey), matching: _trailing()));
      await tester.pumpAndSettle();
      await expectLater(find.byType(MaterialApp), matchesGoldenFile('goldens/split_button_${b.name}.png'));
    });
  }

  testWidgets('every target is 48 dp or more and named; the trailing button reports expanded', (WidgetTester tester) async {
    final SemanticsHandle handle = tester.ensureSemantics();
    await pumpApp(tester, SingleChildScrollView(child: splitSpecimens()), height: 900);
    await tester.pumpAndSettle();
    await expectLater(tester, meetsGuideline(androidTapTargetGuideline));
    await expectLater(tester, meetsGuideline(labeledTapTargetGuideline));
    expect(
      tester.getSemantics(find.descendant(of: find.byKey(openSplitKey), matching: _trailing())),
      matchesSemantics(label: 'More send options', isButton: true, isEnabled: true, hasEnabledState: true, hasExpandedState: true, isExpanded: false, hasTapAction: true, isFocusable: true, hasFocusAction: true),
    );
    handle.dispose();
  });

  testWidgets('the leading button runs the action; the trailing one opens the menu and an entry closes it', (WidgetTester tester) async {
    final List<String> pressed = <String>[];
    await pumpApp(tester, splitButton(onPressed: pressed.add));
    await tester.pumpAndSettle();
    await tester.tap(_lead('Send'));
    await tester.pumpAndSettle();
    expect(pressed, <String>['Send']);
    expect(find.text('Schedule send'), findsNothing);
    await tester.tap(_trailing());
    await tester.pumpAndSettle();
    expect(find.text('Schedule send'), findsOneWidget);
    await tester.tap(find.text('Send later'));
    await tester.pumpAndSettle();
    expect(pressed, <String>['Send', 'Send later']);
    expect(find.text('Schedule send'), findsNothing);
  });

  testWidgets('inner corner grows on press; open, the trailing button is fully round', (WidgetTester tester) async {
    await pumpApp(tester, splitButton());
    await tester.pumpAndSettle();
    expect(_radius(tester, _lead('Send')).topEnd, const Radius.circular(4)); // md.comp.split-button.small.inner-corner.corner-size
    final TestGesture g = await tester.startGesture(tester.getCenter(find.text('Send')));
    await tester.pumpAndSettle();
    expect(_radius(tester, _lead('Send')).topEnd, const Radius.circular(12)); // md.comp.split-button.small.inner-corner.pressed.corner-size
    await g.up();
    await tester.pumpAndSettle();
    final Finder trailingButton = find.ancestor(of: _trailing(), matching: find.byType(FilledButton)).first;
    expect(_radius(tester, trailingButton).topStart, const Radius.circular(4));
    await tester.tap(_trailing());
    await tester.pumpAndSettle();
    expect(_radius(tester, trailingButton).topStart, const Radius.circular(20)); // fully round: half of the 40 dp height
  });

  testWidgets('the menu icon turns half a turn while open', (WidgetTester tester) async {
    await pumpApp(tester, splitButton());
    await tester.pumpAndSettle();
    expect(_turn(tester), closeTo(1, 0.001));
    await tester.tap(_trailing());
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 16));
    expect(_turn(tester), greaterThan(-0.999));
    await tester.pumpAndSettle();
    expect(_turn(tester), closeTo(-1, 0.001));
  });

  testWidgets('reduced motion: the menu icon turns at once', (WidgetTester tester) async {
    await pumpApp(tester, splitButton(), reduceMotion: true);
    await tester.pumpAndSettle();
    await tester.tap(_trailing());
    await tester.pump();
    expect(_turn(tester), closeTo(-1, 0.001));
  });
}
