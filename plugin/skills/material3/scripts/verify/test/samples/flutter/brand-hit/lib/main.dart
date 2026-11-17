import 'package:flutter/material.dart';

class Home extends StatelessWidget {
  const Home({super.key});

  @override
  Widget build(BuildContext context) {
    return ListView(
      children: [
        FilledButton(onPressed: () {}, child: const Text('Pay with Google Pay')), // HIT
        const Text('Google Gemini suggestions'), // HIT
        const Text('Cases for the Google Pixel 8'), // HIT
        const Text('Back up to Google Drive'), // HIT
      ],
    );
  }
}
