import 'package:flutter/material.dart';

class Raised extends StatelessWidget {
  const Raised({super.key});

  @override
  Widget build(BuildContext context) {
    return const Card(
      elevation: 1,
      child: Material(elevation: 3, child: Placeholder()),
    );
  }
}
