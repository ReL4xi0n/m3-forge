import 'package:flutter/material.dart';

class Home extends StatelessWidget {
  const Home({super.key});

  @override
  Widget build(BuildContext context) {
    return ListView(
      children: [
        FilledButton(onPressed: () {}, child: const Text('Pay')),
        const Text('Made for Android'),
        const Text('Pixel art'),
        const Text('Pixel 8 case'),
        const Text('Chrome finish'),
        const Text('Gemini'),
        const Text('Photos'),
        const Text('Drive'),
        const Text('Maps'),
      ],
    );
  }
}
