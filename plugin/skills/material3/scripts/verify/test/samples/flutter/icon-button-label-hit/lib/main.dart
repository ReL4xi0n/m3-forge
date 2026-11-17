import 'package:flutter/material.dart';
import 'm3/m3_symbols.dart';

class Toolbar extends StatelessWidget {
  const Toolbar({super.key});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        IconButton(onPressed: () {}, icon: const Icon(M3Symbols.close)), // HIT
        IconButton.filledTonal( // HIT
          onPressed: () {},
          icon: const Icon(M3Symbols.search),
        ),
        IconButton(onPressed: () {}, tooltip: 'Delete', icon: const Icon(M3Symbols.delete)),
      ],
    );
  }
}
