// Goldens of the sample screen under M3Theme: expressive and classic, light and dark.
// Images are written under test/goldens/ (run.mjs copies them to out/gallery/flutter/).
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:m3_gallery/m3/schemes.dart';
import 'package:m3_gallery/m3/schemes_classic.dart' as classic;
import 'package:m3_gallery/m3/tokens.dart';
import 'package:m3_gallery/m3/theme.dart';
import 'package:m3_gallery/sample_screen.dart';

Future<void> _shot(WidgetTester tester, ThemeData theme, String name) async {
  tester.view.physicalSize = const Size(412 * 2, 915 * 2);
  tester.view.devicePixelRatio = 2;
  addTearDown(tester.view.reset);
  // flutter_test draws elevation shadows as solid black outlines unless this is off.
  debugDisableShadows = false;
  try {
    await tester.pumpWidget(MaterialApp(debugShowCheckedModeBanner: false, theme: theme, home: const SampleScreen()));
    await tester.pumpAndSettle();
    await expectLater(find.byType(MaterialApp), matchesGoldenFile('goldens/$name.png'));
  } finally {
    debugDisableShadows = true;
  }
}

void main() {

  testWidgets('expressive light', (WidgetTester tester) => _shot(tester, M3Theme.light(M3ColorSchemes.light), 'expressive_light'));
  testWidgets('expressive dark', (WidgetTester tester) => _shot(tester, M3Theme.dark(M3ColorSchemes.dark), 'expressive_dark'));
  testWidgets('classic light', (WidgetTester tester) => _shot(tester, M3Theme.light(classic.M3ColorSchemes.light, expressive: false), 'classic_light'));
  testWidgets('classic dark', (WidgetTester tester) => _shot(tester, M3Theme.dark(classic.M3ColorSchemes.dark, expressive: false), 'classic_dark'));

  testWidgets('M3EmphasizedType.of: emphasized under Expressive, plain type roles under Classic', (WidgetTester tester) async {
    Future<M3EmphasizedType> read(ThemeData theme) async {
      late M3EmphasizedType got;
      await tester.pumpWidget(MaterialApp(theme: theme, home: Builder(builder: (BuildContext context) {
        got = M3EmphasizedType.of(context);
        return const SizedBox();
      })));
      await tester.pumpAndSettle(); // the app theme animates between the two themes
      return got;
    }

    final M3EmphasizedType e = await read(M3Theme.light(M3ColorSchemes.light));
    final M3EmphasizedType c = await read(M3Theme.light(classic.M3ColorSchemes.light, expressive: false));
    expect(e.titleLarge, M3EmphasizedType.baseline.titleLarge);
    expect(e.titleLarge, isNot(M3Type.textTheme.titleLarge));
    expect(c.titleLarge, M3Type.textTheme.titleLarge);
    expect(c.headlineMedium, M3Type.textTheme.headlineMedium);
    expect(c.labelSmall, M3Type.textTheme.labelSmall);
  });

  test('motion scheme and brightness follow the theme', () {
    final ThemeData e = M3Theme.light(M3ColorSchemes.light);
    final ThemeData c = M3Theme.light(classic.M3ColorSchemes.light, expressive: false);
    expect(e.extension<M3MotionTheme>()!.scheme, same(M3Motion.expressive));
    expect(c.extension<M3MotionTheme>()!.scheme, same(M3Motion.standard));
    expect(e.colorScheme.brightness, Brightness.light);
    expect(M3Theme.dark(M3ColorSchemes.dark).colorScheme.brightness, Brightness.dark);
  });
}
