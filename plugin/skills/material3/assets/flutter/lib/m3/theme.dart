// material3 skill asset: assets/flutter/lib/m3/theme.dart
// Material 3 theme for Flutter: ThemeData from a color scheme (Expressive by default, Classic with expressive: false).

// install-assets rewrites this import to the Material library the project uses, and turns each
// line that starts with "// [material_ui] " into code when the project uses material_ui.
import 'package:flutter/material.dart';

import 'tokens.dart';

/// The motion scheme a theme carries: M3MotionTheme.of(context) gives the springs to animate with
/// (expressive by default, standard in a Classic theme).
@immutable
class M3MotionTheme extends ThemeExtension<M3MotionTheme> {
  const M3MotionTheme({required this.scheme});

  final M3MotionScheme scheme;

  /// The scheme of the current theme, or the expressive scheme when the theme has none.
  static M3MotionScheme of(BuildContext context) =>
      Theme.of(context).extension<M3MotionTheme>()?.scheme ?? M3Motion.expressive;

  @override
  M3MotionTheme copyWith({M3MotionScheme? scheme}) => M3MotionTheme(scheme: scheme ?? this.scheme);

  @override
  M3MotionTheme lerp(covariant ThemeExtension<M3MotionTheme>? other, double t) =>
      other is M3MotionTheme && t >= 0.5 ? other : this;
}

/// Classic Material 3 has no emphasized scale: its emphasized roles are the plain type-scale styles,
/// so M3EmphasizedType.of(context) returns the same styles as the textTheme.
final M3EmphasizedType _classicEmphasized = _plainAsEmphasized(M3Type.textTheme);

M3EmphasizedType _plainAsEmphasized(TextTheme t) => M3EmphasizedType(
      displayLarge: t.displayLarge!,
      displayMedium: t.displayMedium!,
      displaySmall: t.displaySmall!,
      headlineLarge: t.headlineLarge!,
      headlineMedium: t.headlineMedium!,
      headlineSmall: t.headlineSmall!,
      titleLarge: t.titleLarge!,
      titleMedium: t.titleMedium!,
      titleSmall: t.titleSmall!,
      bodyLarge: t.bodyLarge!,
      bodyMedium: t.bodyMedium!,
      bodySmall: t.bodySmall!,
      labelLarge: t.labelLarge!,
      labelMedium: t.labelMedium!,
      labelSmall: t.labelSmall!,
    );

/// Material 3 themes. Pass a scheme from M3ColorSchemes (lib/m3/schemes.dart, written by the color
/// script): M3Theme.light(M3ColorSchemes.light), M3Theme.dark(M3ColorSchemes.dark).
///
/// expressive: true (default) adds the emphasized type scale (M3EmphasizedType), the expressive
/// motion scheme and, on material_ui, the Expressive style variant. expressive: false builds
/// Classic Material 3: standard motion, emphasized roles equal the plain type roles, no style variant.
class M3Theme {
  M3Theme._();

  static ThemeData light(ColorScheme scheme, {bool expressive = true}) {
    assert(scheme.brightness == Brightness.light, 'M3Theme.light needs a light color scheme');
    return _build(scheme, expressive);
  }

  static ThemeData dark(ColorScheme scheme, {bool expressive = true}) {
    assert(scheme.brightness == Brightness.dark, 'M3Theme.dark needs a dark color scheme');
    return _build(scheme, expressive);
  }

  static ThemeData _build(ColorScheme scheme, bool expressive) {
    return ThemeData(
      useMaterial3: true,
      colorScheme: scheme,
      textTheme: M3Type.textTheme,
      cardTheme: const CardThemeData(shape: M3Shapes.medium), // md.comp.filled-card.container.shape (md.sys.shape.corner.medium)
      dialogTheme: const DialogThemeData(shape: M3Shapes.extraLarge), // md.comp.dialog.container.shape (md.sys.shape.corner.extra-large)
      bottomSheetTheme: const BottomSheetThemeData(shape: M3Shapes.extraLargeTop), // md.comp.sheet.bottom.docked.container.shape (md.sys.shape.corner.extra-large.top)
      // [material_ui] elevatedButtonTheme: ElevatedButtonThemeData(variant: expressive ? StyleVariant.material3Expressive : StyleVariant.material3),
      // [material_ui] iconButtonTheme: IconButtonThemeData(variant: expressive ? StyleVariant.material3Expressive : StyleVariant.material3),
      extensions: <ThemeExtension<dynamic>>[
        M3MotionTheme(scheme: expressive ? M3Motion.expressive : M3Motion.standard),
        expressive ? M3EmphasizedType.baseline : _classicEmphasized,
      ],
    );
  }
}
