import 'package:flutter/material.dart';

class Spaced extends StatelessWidget {
  const Spaced({super.key});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          const Padding(
            padding: EdgeInsets.fromLTRB(24, 16, 24, 8),
            child: Placeholder(),
          ),
          const SizedBox(height: 12),
          const SizedBox(width: 120, height: 41, child: Placeholder()),
          const Padding(padding: EdgeInsets.zero, child: Placeholder()),
        ],
      ),
    );
  }
}
