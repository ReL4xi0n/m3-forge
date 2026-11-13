import 'package:flutter/material.dart';

class Glow extends StatelessWidget {
  const Glow({super.key});

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return DecoratedBox(
      decoration: BoxDecoration(
        boxShadow: [BoxShadow(color: cs.shadow, blurRadius: 8)], // HIT
        gradient: LinearGradient(colors: [cs.primary, cs.tertiary]), // HIT
      ),
      child: const Placeholder(),
    );
  }
}
