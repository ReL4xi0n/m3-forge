import 'package:flutter/material.dart';

class NewBadge extends StatelessWidget {
  const NewBadge({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      color: const Color(0xFF6750A4), // HIT
      child: Text(
        'New',
        style: TextStyle(color: Colors.white), // HIT
      ),
      foregroundDecoration: BoxDecoration(
        border: Border.all(color: Color.fromARGB(255, 0, 0, 0)), // HIT
      ),
    );
  }
}
