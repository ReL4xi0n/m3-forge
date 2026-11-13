import 'package:flutter/material.dart';

class NewBadge extends StatelessWidget {
  const NewBadge({super.key});

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return Container(
      color: cs.primary,
      child: Text(
        'New',
        style: TextStyle(color: cs.onPrimary),
      ),
      foregroundDecoration: BoxDecoration(
        border: Border.all(color: Colors.transparent),
      ),
    );
  }
}
