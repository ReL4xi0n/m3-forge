import 'package:flutter/material.dart';
import 'm3/expressive/loading_indicator.dart';

class Home extends StatelessWidget {
  const Home({super.key});

  @override
  Widget build(BuildContext context) {
    return ListView(
      children: [
        const Text('Shelf'),
        const M3LoadingIndicator(),
      ],
    );
  }
}
