import 'package:flutter/material.dart';

const lightScheme = ColorScheme(
  brightness: Brightness.light,
  primary: Color(0xFF6750A4),
  onPrimary: Color(0xFFFFFFFF),
  secondary: Color(0xFF625B71),
  onSecondary: Colors.white,
  error: Color(0xFFB3261E),
  onError: Color(0xFFFFFFFF),
  surface: Color(0xFFFEF7FF),
  onSurface: Color(0xFF1D1B20),
);

const appTextTheme = TextTheme(
  bodyLarge: TextStyle(fontSize: 16, height: 1.5),
);

class AppShapes {
  static final card = BorderRadius.circular(10);
  static const padding = EdgeInsets.all(10);
}
