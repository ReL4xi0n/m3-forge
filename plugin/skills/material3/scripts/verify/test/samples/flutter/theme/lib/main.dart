import 'package:flutter/material.dart';

import 'schemes.dart';
import 'theme/app_theme.dart';

void main() {
  runApp(
    MaterialApp(
      theme: ThemeData(colorScheme: lightScheme, textTheme: appTextTheme),
      darkTheme: buildDarkTheme(),
      home: const Scaffold(body: Placeholder()),
    ),
  );
}
