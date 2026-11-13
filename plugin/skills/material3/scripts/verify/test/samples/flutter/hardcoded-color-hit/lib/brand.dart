import 'package:flutter/material.dart';

// Mixes a scheme with a widget, so it is not a theme file.
const brandScheme = ColorScheme.light(primary: Color(0xFF6750A4)); // HIT

class BrandBar extends StatelessWidget {
  const BrandBar({super.key});

  @override
  Widget build(BuildContext context) {
    return ColoredBox(color: Color(0xFF000000)); // HIT
  }
}
