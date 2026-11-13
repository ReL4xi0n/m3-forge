import 'package:flutter/material.dart';

class Heading extends StatelessWidget {
  const Heading({super.key});

  @override
  Widget build(BuildContext context) {
    final tt = Theme.of(context).textTheme;
    final cs = Theme.of(context).colorScheme;
    return Column(
      children: [
        Text('Title', style: tt.titleLarge),
        Text('Body', style: tt.bodyLarge?.copyWith(color: cs.onSurfaceVariant)),
        Text('Plain', style: TextStyle(color: cs.primary)),
      ],
    );
  }
}
