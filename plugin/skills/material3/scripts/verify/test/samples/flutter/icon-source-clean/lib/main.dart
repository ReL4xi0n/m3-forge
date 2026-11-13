import 'package:flutter/material.dart';
import 'package:material_symbols_icons/symbols.dart';

class Status extends StatelessWidget {
  const Status({super.key});

  @override
  Widget build(BuildContext context) {
    return const Row(
      children: [
        Icon(Symbols.home),
        Text('Done'),
      ],
    );
  }
}
