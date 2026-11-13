import 'package:flutter/material.dart';

class Tile extends StatelessWidget {
  const Tile({super.key});

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        ClipRRect(borderRadius: BorderRadius.circular(10), child: const Placeholder()), // HIT
        ClipRRect(
          borderRadius: const BorderRadius.only(topLeft: Radius.circular(6)), // HIT
          child: const Placeholder(),
        ),
      ],
    );
  }
}
