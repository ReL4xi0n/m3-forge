// Hand-written sample for harness/flutter/test/capture.test.mjs. It plants:
// - one 32x32 tappable InkWell (a tap-target hit; the minimum is 48x48);
// - one low-contrast Text on white (a contrast hit, in both themes);
// - one disabled 24x24 InkWell and one disabled TextButton, which the guidelines must skip.
import 'package:flutter/material.dart';

void main() => runApp(const SampleApp());

class SampleApp extends StatelessWidget {
  const SampleApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      theme: ThemeData(brightness: Brightness.light),
      darkTheme: ThemeData(brightness: Brightness.dark),
      home: const SampleScreen(),
    );
  }
}

class SampleScreen extends StatelessWidget {
  const SampleScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Center(
        child: ColoredBox(
          color: const Color(0xFFFFFFFF),
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: <Widget>[
                const Text('Harness sample', style: TextStyle(fontSize: 22, color: Color(0xFF1B1B1F))),
                const SizedBox(height: 16),
                const Text('Faint caption', style: TextStyle(fontSize: 14, color: Color(0xFFD0D0D0))),
                const SizedBox(height: 16),
                InkWell(
                  onTap: () {},
                  child: const SizedBox(
                    width: 32,
                    height: 32,
                    child: Center(child: Text('Go', style: TextStyle(fontSize: 12, color: Color(0xFF1B1B1F)))),
                  ),
                ),
                const SizedBox(height: 16),
                const InkWell(onTap: null, child: SizedBox(width: 24, height: 24)),
                const SizedBox(height: 16),
                const TextButton(onPressed: null, child: Text('Disabled action')),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
