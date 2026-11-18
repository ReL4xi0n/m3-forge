// M3FloatingToolbar and M3DockedToolbar: goldens (standard and vibrant, horizontal and vertical, with
// FAB, docked; light and dark), 48 dp targets and accessible names, token measurements, selected colors.
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:m3_gallery/m3/expressive/toolbar.dart';
import 'package:m3_gallery/m3/m3_symbols.dart';
import 'package:m3_gallery/m3/schemes.dart';
import 'package:m3_gallery/toolbar_showcase.dart';

import 'support.dart';

const Key _bar = ValueKey<String>('bar');

// The icon button's layout box: its 48 dp target (the tooltip wraps only the 40 dp circle).
Finder _button(String tooltip) => find.ancestor(of: find.byTooltip(tooltip), matching: find.byType(IconButton)).first;

void main() {
  for (final Brightness b in Brightness.values) {
    testWidgets('golden ${b.name}', (WidgetTester tester) async {
      useRealShadows();
      await pumpApp(tester, SingleChildScrollView(child: toolbarSpecimens()), brightness: b, height: 860);
      await tester.pumpAndSettle();
      await expectLater(find.byType(MaterialApp), matchesGoldenFile('goldens/toolbar_${b.name}.png'));
    });
  }

  testWidgets('every target is 48 dp or more and named', (WidgetTester tester) async {
    final SemanticsHandle handle = tester.ensureSemantics();
    await pumpApp(tester, SingleChildScrollView(child: toolbarSpecimens()), height: 860);
    await tester.pumpAndSettle();
    await expectLater(tester, meetsGuideline(androidTapTargetGuideline));
    await expectLater(tester, meetsGuideline(labeledTapTargetGuideline));
    expect(find.bySemanticsLabel('Text formatting'), findsOneWidget);
    handle.dispose();
  });

  testWidgets('floating toolbar: 64 dp tall, 8 dp padding, 4 dp between items, 8 dp to the FAB, FAB 56 dp', (WidgetTester tester) async {
    await pumpApp(tester, Align(alignment: Alignment.topLeft, child: M3FloatingToolbar(key: _bar, floatingActionButton: toolbarFab(), children: toolbarActions())));
    await tester.pumpAndSettle();
    final Rect bar = tester.getRect(find.descendant(of: find.byKey(_bar), matching: find.byType(Material)).first);
    expect(bar.height, 64); // md.comp.toolbar.floating.horizontal.container.height
    final Rect first = tester.getRect(_button('Bold'));
    final Rect second = tester.getRect(_button('Italic'));
    expect(first.left - bar.left, 8); // md.comp.toolbar.floating.container.leading-space
    expect(second.left - first.right, 4); // md.comp.toolbar.floating.container.between-space
    final Rect fab = tester.getRect(find.byType(FloatingActionButton));
    expect(fab.left - bar.right, 8); // md.comp.toolbar.floating.fab.between-space
    expect(fab.size, const Size(56, 56)); // md.comp.toolbar.floating.fab.container.width and .height
  });

  testWidgets('vertical floating toolbar: 64 dp wide', (WidgetTester tester) async {
    await pumpApp(tester, Align(alignment: Alignment.topLeft, child: M3FloatingToolbar(key: _bar, vertical: true, children: toolbarActions())));
    await tester.pumpAndSettle();
    final Rect bar = tester.getRect(find.descendant(of: find.byKey(_bar), matching: find.byType(Material)).first);
    expect(bar.width, 64); // md.comp.toolbar.floating.vertical.container.width
    expect(tester.getRect(_button('Italic')).top - tester.getRect(_button('Bold')).bottom, 4);
  });

  testWidgets('docked toolbar: full width, 64 dp tall, 16 dp end padding, square corners', (WidgetTester tester) async {
    await pumpApp(tester, Align(alignment: Alignment.bottomCenter, child: M3DockedToolbar(key: _bar, children: toolbarActions())), height: 480);
    await tester.pumpAndSettle();
    final Finder material = find.descendant(of: find.byKey(_bar), matching: find.byType(Material)).first;
    final Rect bar = tester.getRect(material);
    expect(bar.width, 412);
    expect(bar.height, 64); // md.comp.toolbar.docked.container.height
    expect(tester.getRect(_button('Bold')).left, 16); // md.comp.toolbar.docked.container.leading-space
    expect(tester.getRect(_button('Link')).right, 412 - 16);
    expect(tester.widget<Material>(material).shape, const RoundedRectangleBorder());
  });

  testWidgets('colors: standard is surface container, vibrant is primary container; a toggled icon button is selected', (WidgetTester tester) async {
    await pumpApp(tester, Column(children: <Widget>[
      M3DockedToolbar(key: _bar, children: toolbarActions()),
      M3DockedToolbar(key: const ValueKey<String>('vibrant'), colors: M3ToolbarColors.vibrant, children: toolbarActions()),
    ]));
    await tester.pumpAndSettle();
    final ColorScheme scheme = M3ColorSchemes.light;
    Color container(String key) => tester.widget<Material>(find.descendant(of: find.byKey(ValueKey<String>(key)), matching: find.byType(Material)).first).color!;
    expect(container('bar'), scheme.surfaceContainer);
    expect(container('vibrant'), scheme.primaryContainer);
    final Material selected = tester.widget<Material>(find.descendant(of: find.widgetWithIcon(IconButton, M3Symbols.formatItalic), matching: find.byType(Material)).first);
    expect(selected.color, scheme.secondaryContainer); // md.comp.toolbar.standard.selected.button.container.color
  });
}
