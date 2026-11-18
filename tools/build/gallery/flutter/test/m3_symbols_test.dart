// Golden of the generated icon constants: `settings` at FILL 0/1 and wght 400/700.
// Image goes to test/goldens/ (run.mjs copies it to out/gallery/flutter/).
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:m3_gallery/m3/m3_symbols.dart';

void main() {
  testWidgets('settings at fill 0/1 and weight 400/700', (WidgetTester tester) async {
    tester.view.physicalSize = const Size(960, 720);
    tester.view.devicePixelRatio = 2;
    addTearDown(tester.view.reset);
    Widget cell(double fill, double weight) => Padding(
          padding: const EdgeInsets.all(16),
          child: Column(mainAxisSize: MainAxisSize.min, children: <Widget>[
            Icon(M3Symbols.settings, size: 64, fill: fill, weight: weight, grade: 0, opticalSize: 48, color: Colors.black),
            Text('FILL ${fill.toInt()}  wght ${weight.toInt()}', style: const TextStyle(fontSize: 12, color: Colors.black)),
          ]),
        );
    await tester.pumpWidget(MaterialApp(
      debugShowCheckedModeBanner: false,
      home: Scaffold(
        backgroundColor: Colors.white,
        body: Center(
          child: Column(mainAxisSize: MainAxisSize.min, children: <Widget>[
            Row(mainAxisSize: MainAxisSize.min, children: <Widget>[cell(0, 400), cell(1, 400)]),
            Row(mainAxisSize: MainAxisSize.min, children: <Widget>[cell(0, 700), cell(1, 700)]),
          ]),
        ),
      ),
    ));
    await tester.pumpAndSettle();
    await expectLater(find.byType(MaterialApp), matchesGoldenFile('goldens/symbols_axes.png'));
  });
}
