import 'package:flutter/material.dart';

class Heading extends StatelessWidget {
  const Heading({super.key});

  @override
  Widget build(BuildContext context) {
    final base = Theme.of(context).textTheme.bodyLarge!;
    return Column(
      children: [
        Text('Title', style: TextStyle(fontSize: 22)), // HIT
        Text('Body', style: base.copyWith(fontSize: 18.5)), // HIT
      ],
    );
  }
}
