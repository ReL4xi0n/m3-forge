import 'package:flutter/material.dart';
import 'm3/m3_symbols.dart';

class Home extends StatelessWidget {
  const Home({super.key});

  @override
  Widget build(BuildContext context) {
    return ListView(
      children: [
        const Icon(M3Symbols.setings), // HIT
        const Icon(M3Symbols.favourite), // HIT
        const Icon(M3Symbols.settings),
      ],
    );
  }
}
