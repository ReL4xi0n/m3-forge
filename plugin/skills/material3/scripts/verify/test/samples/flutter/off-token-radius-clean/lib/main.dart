import 'package:flutter/material.dart';

class Tile extends StatelessWidget {
  const Tile({super.key});

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        ClipRRect(borderRadius: BorderRadius.circular(12), child: const Placeholder()),
        ClipRRect(
          borderRadius: const BorderRadius.all(Radius.circular(28)),
          child: const Placeholder(),
        ),
        const Material(shape: StadiumBorder(), child: Placeholder()),
      ],
    );
  }
}
