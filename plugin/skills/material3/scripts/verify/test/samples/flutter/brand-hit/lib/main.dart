import 'package:flutter/material.dart';

class Home extends StatelessWidget {
  const Home({super.key});

  @override
  Widget build(BuildContext context) {
    return ListView(
      children: [
        FilledButton(onPressed: () {}, child: const Text('Pay with Google Pay')), // HIT
        const Text('Gemini suggestions'), // HIT
        const Text('Back up to Google Drive'), // HIT
      ],
    );
  }
}
