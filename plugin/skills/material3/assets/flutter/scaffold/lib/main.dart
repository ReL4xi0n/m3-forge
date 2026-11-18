import 'package:material_ui/material_ui.dart';

// These two files appear when the steps of references/flutter/setup.md ran: the color script writes
// schemes.dart, install-assets (parts tokens) writes theme.dart and the files it needs.
import 'm3/schemes.dart';
import 'm3/theme.dart';

void main() => runApp(const App());

class App extends StatelessWidget {
  const App({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'App',
      theme: M3Theme.light(M3ColorSchemes.light),
      darkTheme: M3Theme.dark(M3ColorSchemes.dark),
      themeMode: ThemeMode.system,
      home: const HomeScreen(),
    );
  }
}

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Home')),
      body: const SafeArea(child: Center(child: Text('Ready'))),
    );
  }
}
