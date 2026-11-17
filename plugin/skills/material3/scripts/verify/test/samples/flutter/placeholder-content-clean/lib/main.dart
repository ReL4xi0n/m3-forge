import 'package:flutter/material.dart';

class Home extends StatelessWidget {
  const Home({super.key});

  @override
  Widget build(BuildContext context) {
    return ListView(
      children: [
        const Text('Mara Lindqvist'),
        const Text('you@lumenfold.app'),
        FilledButton(onPressed: () {}, child: const Text('Pay')),
        const Text('Items'),
        const Text('Search bar'),
        const Text('Bar'),
      ],
    );
  }
}
