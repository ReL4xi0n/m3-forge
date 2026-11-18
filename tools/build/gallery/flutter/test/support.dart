// Shared helpers for the gap-component goldens: a themed app at phone width, light or dark.
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:m3_gallery/m3/schemes.dart';
import 'package:m3_gallery/m3/theme.dart';

ThemeData themeFor(Brightness b) => b == Brightness.light ? M3Theme.light(M3ColorSchemes.light) : M3Theme.dark(M3ColorSchemes.dark);

/// Pumps [child] on a Scaffold surface in a 412 x [height] dp window (device pixel ratio 2).
Future<void> pumpApp(WidgetTester tester, Widget child, {Brightness brightness = Brightness.light, double height = 480, bool reduceMotion = false}) async {
  tester.view.physicalSize = Size(412 * 2, height * 2);
  tester.view.devicePixelRatio = 2;
  addTearDown(tester.view.reset);
  await tester.pumpWidget(MaterialApp(
    debugShowCheckedModeBanner: false,
    theme: themeFor(brightness),
    builder: (BuildContext context, Widget? app) => MediaQuery(
      data: MediaQuery.of(context).copyWith(disableAnimations: reduceMotion),
      child: app!,
    ),
    home: Scaffold(body: SafeArea(child: child)),
  ));
}
