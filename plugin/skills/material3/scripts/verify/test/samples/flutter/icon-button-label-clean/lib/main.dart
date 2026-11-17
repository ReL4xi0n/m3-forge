import 'package:flutter/material.dart';
import 'm3/m3_symbols.dart';

class Toolbar extends StatelessWidget {
  const Toolbar({super.key, required this.trailing});

  final Widget trailing;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        IconButton(onPressed: () {}, tooltip: 'Close', icon: const Icon(M3Symbols.close)),
        IconButton.filledTonal(
          onPressed: () {},
          icon: const Icon(M3Symbols.search, semanticLabel: 'Search'),
        ),
        IconButton(onPressed: () {}, icon: trailing),
        TextButton.icon(onPressed: () {}, icon: const Icon(M3Symbols.add), label: const Text('New list')),
        const Icon(M3Symbols.home),
      ],
    );
  }
}
