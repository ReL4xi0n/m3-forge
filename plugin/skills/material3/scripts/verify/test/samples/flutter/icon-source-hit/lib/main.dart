import 'package:flutter/material.dart';

class Status extends StatelessWidget {
  const Status({super.key});

  @override
  Widget build(BuildContext context) {
    return const Row(
      children: [
        Icon(Icons.home), // HIT
        Text('Done ✅'), // HIT
      ],
    );
  }
}
