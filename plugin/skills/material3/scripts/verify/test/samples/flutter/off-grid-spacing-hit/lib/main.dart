import 'package:flutter/material.dart';

class Spaced extends StatelessWidget {
  const Spaced({super.key});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(10), // HIT
      child: Column(
        children: [
          const Padding(
            padding: EdgeInsets.symmetric(horizontal: 16, vertical: 6), // HIT
            child: Placeholder(),
          ),
          const SizedBox(height: 14), // HIT
        ],
      ),
    );
  }
}
