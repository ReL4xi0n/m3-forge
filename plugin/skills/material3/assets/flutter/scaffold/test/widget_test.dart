import 'package:flutter_test/flutter_test.dart';
import 'package:m3_app/main.dart';

void main() {
  testWidgets('the home screen shows', (WidgetTester tester) async {
    await tester.pumpWidget(const App());
    expect(find.text('Ready'), findsOneWidget);
  });
}
