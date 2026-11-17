// material3 skill asset: assets/flutter/lib/m3/motion.dart
// Material 3 motion: springs (standard and expressive), durations, easings (Flutter).
// Built from the skill token files (tokens/sys.json); generated, do not edit.

// install-assets rewrites this import to the Material library the project uses.
import 'package:flutter/material.dart';

/// A spring from the motion tokens: stiffness and damping ratio (mass 1).
@immutable
class M3Spring {
  const M3Spring({required this.stiffness, required this.dampingRatio});

  final double stiffness;
  final double dampingRatio;
}

/// One motion scheme: spatial springs move things, effects springs change color and opacity.
@immutable
class M3MotionScheme {
  const M3MotionScheme({
    required this.fastSpatial,
    required this.fastEffects,
    required this.defaultSpatial,
    required this.defaultEffects,
    required this.slowSpatial,
    required this.slowEffects,
  });

  final M3Spring fastSpatial;
  final M3Spring fastEffects;
  final M3Spring defaultSpatial;
  final M3Spring defaultEffects;
  final M3Spring slowSpatial;
  final M3Spring slowEffects;
}

/// Material 3 motion tokens: the expressive scheme (default) and the standard scheme (Classic).
class M3Motion {
  M3Motion._();

  static const M3MotionScheme standard = M3MotionScheme(
    fastSpatial: M3Spring(stiffness: 1400, dampingRatio: 0.9), // md.sys.motion.spring.fast.spatial.stiffness@standard, md.sys.motion.spring.fast.spatial.damping@standard
    fastEffects: M3Spring(stiffness: 3800, dampingRatio: 1), // md.sys.motion.spring.fast.effects.stiffness@standard, md.sys.motion.spring.fast.effects.damping@standard
    defaultSpatial: M3Spring(stiffness: 700, dampingRatio: 0.9), // md.sys.motion.spring.default.spatial.stiffness@standard, md.sys.motion.spring.default.spatial.damping@standard
    defaultEffects: M3Spring(stiffness: 1600, dampingRatio: 1), // md.sys.motion.spring.default.effects.stiffness@standard, md.sys.motion.spring.default.effects.damping@standard
    slowSpatial: M3Spring(stiffness: 300, dampingRatio: 0.9), // md.sys.motion.spring.slow.spatial.stiffness@standard, md.sys.motion.spring.slow.spatial.damping@standard
    slowEffects: M3Spring(stiffness: 800, dampingRatio: 1), // md.sys.motion.spring.slow.effects.stiffness@standard, md.sys.motion.spring.slow.effects.damping@standard
  );

  static const M3MotionScheme expressive = M3MotionScheme(
    fastSpatial: M3Spring(stiffness: 800, dampingRatio: 0.6), // md.sys.motion.spring.fast.spatial.stiffness@expressive, md.sys.motion.spring.fast.spatial.damping@expressive
    fastEffects: M3Spring(stiffness: 3800, dampingRatio: 1), // md.sys.motion.spring.fast.effects.stiffness@expressive, md.sys.motion.spring.fast.effects.damping@expressive
    defaultSpatial: M3Spring(stiffness: 380, dampingRatio: 0.8), // md.sys.motion.spring.default.spatial.stiffness@expressive, md.sys.motion.spring.default.spatial.damping@expressive
    defaultEffects: M3Spring(stiffness: 1600, dampingRatio: 1), // md.sys.motion.spring.default.effects.stiffness@expressive, md.sys.motion.spring.default.effects.damping@expressive
    slowSpatial: M3Spring(stiffness: 200, dampingRatio: 0.8), // md.sys.motion.spring.slow.spatial.stiffness@expressive, md.sys.motion.spring.slow.spatial.damping@expressive
    slowEffects: M3Spring(stiffness: 800, dampingRatio: 1), // md.sys.motion.spring.slow.effects.stiffness@expressive, md.sys.motion.spring.slow.effects.damping@expressive
  );

  static const Duration durationShort1 = Duration(milliseconds: 50); // md.sys.motion.duration.short1
  static const Duration durationShort2 = Duration(milliseconds: 100); // md.sys.motion.duration.short2
  static const Duration durationShort3 = Duration(milliseconds: 150); // md.sys.motion.duration.short3
  static const Duration durationShort4 = Duration(milliseconds: 200); // md.sys.motion.duration.short4
  static const Duration durationMedium1 = Duration(milliseconds: 250); // md.sys.motion.duration.medium1
  static const Duration durationMedium2 = Duration(milliseconds: 300); // md.sys.motion.duration.medium2
  static const Duration durationMedium3 = Duration(milliseconds: 350); // md.sys.motion.duration.medium3
  static const Duration durationMedium4 = Duration(milliseconds: 400); // md.sys.motion.duration.medium4
  static const Duration durationLong1 = Duration(milliseconds: 450); // md.sys.motion.duration.long1
  static const Duration durationLong2 = Duration(milliseconds: 500); // md.sys.motion.duration.long2
  static const Duration durationLong3 = Duration(milliseconds: 550); // md.sys.motion.duration.long3
  static const Duration durationLong4 = Duration(milliseconds: 600); // md.sys.motion.duration.long4
  static const Duration durationExtraLong1 = Duration(milliseconds: 700); // md.sys.motion.duration.extra-long1
  static const Duration durationExtraLong2 = Duration(milliseconds: 800); // md.sys.motion.duration.extra-long2
  static const Duration durationExtraLong3 = Duration(milliseconds: 900); // md.sys.motion.duration.extra-long3
  static const Duration durationExtraLong4 = Duration(milliseconds: 1000); // md.sys.motion.duration.extra-long4

  static const Curve easingEmphasized = ThreePointCubic(Offset(0.05, 0), Offset(0.133333, 0.06), Offset(0.166666, 0.4), Offset(0.208333, 0.82), Offset(0.25, 1)); // md.sys.motion.easing.emphasized
  static const Curve easingEmphasizedAccelerate = Cubic(0.3, 0, 0.8, 0.15); // md.sys.motion.easing.emphasized.accelerate
  static const Curve easingEmphasizedDecelerate = Cubic(0.05, 0.7, 0.1, 1); // md.sys.motion.easing.emphasized.decelerate
  static const Curve easingLegacy = Cubic(0.4, 0, 0.2, 1); // md.sys.motion.easing.legacy
  static const Curve easingLegacyAccelerate = Cubic(0.4, 0, 1, 1); // md.sys.motion.easing.legacy.accelerate
  static const Curve easingLegacyDecelerate = Cubic(0, 0, 0.2, 1); // md.sys.motion.easing.legacy.decelerate
  static const Curve easingLinear = Cubic(0, 0, 1, 1); // md.sys.motion.easing.linear
  static const Curve easingStandard = Cubic(0.2, 0, 0, 1); // md.sys.motion.easing.standard
  static const Curve easingStandardAccelerate = Cubic(0.3, 0, 1, 1); // md.sys.motion.easing.standard.accelerate
  static const Curve easingStandardDecelerate = Cubic(0, 0, 0, 1); // md.sys.motion.easing.standard.decelerate
}
