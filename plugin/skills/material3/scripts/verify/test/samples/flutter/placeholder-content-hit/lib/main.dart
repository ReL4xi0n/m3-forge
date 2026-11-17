import 'package:flutter/material.dart';

class Home extends StatelessWidget {
  const Home({super.key});

  @override
  Widget build(BuildContext context) {
    return ListView(
      children: [
        const Text('Lorem ipsum dolor sit amet'), // HIT
        const Text('Acme Coffee'), // HIT
        const Text("John Doe"), // HIT
        const Text('Item 4'), // HIT
        const Text('support@example.net'), // HIT
        Image.network('https://picsum.photos/200'), // HIT
        const Text('foo'), // HIT
      ],
    );
  }
}
