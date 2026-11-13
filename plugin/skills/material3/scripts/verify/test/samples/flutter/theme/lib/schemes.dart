import 'package:flutter/material.dart';

final darkScheme = ColorScheme.fromSeed(
  seedColor: const Color(0xFF6750A4),
  brightness: Brightness.dark,
);

ThemeData buildDarkTheme() => ThemeData(colorScheme: darkScheme, scaffoldBackgroundColor: Color(0xFF141218));

const TextTheme denseText = TextTheme(labelSmall: TextStyle(fontSize: 11));
