// M3FabMenu: goldens (open in three color sets and closed in three FAB sizes; light and dark),
// 48 dp targets and accessible names, open and close (toggle, Escape, back), focus order and reduced motion.
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:m3_gallery/fab_menu_showcase.dart';
import 'package:m3_gallery/m3/m3_symbols.dart';

import 'support.dart';

const Key _menu = ValueKey<String>('menu');
Finder get _toggle => find.bySemanticsLabel('Toggle menu');
Rect _itemRect(WidgetTester tester, String label) => tester.getRect(find.ancestor(of: find.text(label), matching: find.byType(Material)).first);

void main() {
  for (final Brightness b in Brightness.values) {
    testWidgets('golden ${b.name}', (WidgetTester tester) async {
      useRealShadows();
      await pumpApp(tester, fabMenuSpecimens(), brightness: b, height: 640);
      await tester.pumpAndSettle();
      await expectLater(find.byType(MaterialApp), matchesGoldenFile('goldens/fab_menu_${b.name}.png'));
    });
  }

  testWidgets('every target is 48 dp or more and named; the toggle reports expanded', (WidgetTester tester) async {
    final SemanticsHandle handle = tester.ensureSemantics();
    await pumpApp(tester, fabMenu(key: _menu, open: true), height: 400);
    await tester.pumpAndSettle();
    await expectLater(tester, meetsGuideline(androidTapTargetGuideline));
    await expectLater(tester, meetsGuideline(labeledTapTargetGuideline));
    expect(tester.getSemantics(_toggle), matchesSemantics(label: 'Toggle menu', isButton: true, hasExpandedState: true, isExpanded: true, hasTapAction: true, isFocusable: true));
    expect(find.bySemanticsLabel('Mail'), findsOneWidget);
    expect(find.bySemanticsLabel('Share'), findsOneWidget);
    expect(find.bySemanticsLabel('Edit'), findsOneWidget);
    handle.dispose();
  });

  testWidgets('closed: the items are out of the semantics tree; the toggle reports collapsed', (WidgetTester tester) async {
    final SemanticsHandle handle = tester.ensureSemantics();
    await pumpApp(tester, fabMenu(key: _menu), height: 400);
    await tester.pumpAndSettle();
    expect(find.bySemanticsLabel('Mail'), findsNothing);
    expect(tester.getSemantics(_toggle), matchesSemantics(label: 'Toggle menu', isButton: true, hasExpandedState: true, isExpanded: false, hasTapAction: true, isFocusable: true));
    handle.dispose();
  });

  testWidgets('the toggle opens the menu, an item runs its callback and closes it', (WidgetTester tester) async {
    final List<String> pressed = <String>[];
    await pumpApp(tester, fabMenu(key: _menu, onPressed: pressed.add), height: 400);
    await tester.pumpAndSettle();
    expect(find.text('Mail'), findsNothing);
    await tester.tap(_toggle);
    await tester.pumpAndSettle();
    expect(find.text('Mail'), findsOneWidget);
    await tester.tap(find.text('Share'));
    await tester.pumpAndSettle();
    expect(pressed, <String>['Share']);
    expect(find.text('Mail'), findsNothing);
  });

  testWidgets('Escape closes the menu', (WidgetTester tester) async {
    await pumpApp(tester, fabMenu(key: _menu), height: 400);
    await tester.tap(_toggle);
    await tester.pumpAndSettle();
    await tester.sendKeyEvent(LogicalKeyboardKey.tab); // focus enters the menu at the toggle
    await tester.sendKeyEvent(LogicalKeyboardKey.escape);
    await tester.pumpAndSettle();
    expect(find.text('Mail'), findsNothing);
  });

  testWidgets('the back gesture closes the menu instead of leaving the screen', (WidgetTester tester) async {
    await pumpApp(tester, fabMenu(key: _menu, open: true), height: 400);
    await tester.pumpAndSettle();
    expect(find.text('Mail'), findsOneWidget);
    await tester.binding.handlePopRoute();
    await tester.pumpAndSettle();
    expect(find.text('Mail'), findsNothing);
  });

  testWidgets('focus starts on the toggle, then Down and Tab walk the items from the top', (WidgetTester tester) async {
    await pumpApp(tester, fabMenu(key: _menu, open: true), height: 400);
    await tester.pumpAndSettle();
    bool focused(String label) => Focus.of(tester.element(find.text(label))).hasPrimaryFocus;
    await tester.sendKeyEvent(LogicalKeyboardKey.tab);
    expect(Focus.of(tester.element(find.byIcon(M3Symbols.close))).hasPrimaryFocus, isTrue);
    await tester.sendKeyEvent(LogicalKeyboardKey.arrowDown);
    expect(focused('Mail'), isTrue);
    await tester.sendKeyEvent(LogicalKeyboardKey.tab);
    expect(focused('Share'), isTrue);
    await tester.sendKeyEvent(LogicalKeyboardKey.tab);
    expect(focused('Edit'), isTrue);
  });

  testWidgets('items unfold with a spring; reduced motion shows them at once', (WidgetTester tester) async {
    await pumpApp(tester, fabMenu(key: _menu), height: 400);
    await tester.pumpAndSettle();
    await tester.tap(_toggle);
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 16));
    final bool mailBuilt = find.text('Mail').evaluate().isNotEmpty;
    final double early = mailBuilt ? _itemRect(tester, 'Edit').width : 0;
    await tester.pumpAndSettle();
    final double settled = _itemRect(tester, 'Edit').width;
    expect(early, lessThan(settled));
    await tester.tap(_toggle);
    await tester.pumpAndSettle();

    await pumpApp(tester, fabMenu(key: _menu), height: 400, reduceMotion: true);
    await tester.pumpAndSettle();
    await tester.tap(_toggle);
    await tester.pump();
    expect(_itemRect(tester, 'Edit').width, closeTo(settled, 0.01));
    expect(_itemRect(tester, 'Mail').width, greaterThan(0));
  });
}
