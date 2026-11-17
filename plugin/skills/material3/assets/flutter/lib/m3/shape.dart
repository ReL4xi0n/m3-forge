// material3 skill asset: assets/flutter/lib/m3/shape.dart
// Material 3 shape scale (Flutter).
// Built from the skill token files (tokens/sys.json); generated, do not edit.

// install-assets rewrites this import to the Material library the project uses.
import 'package:flutter/material.dart';

/// Corner radii of the Material 3 shape scale (Expressive steps included), for BoxDecoration,
/// ClipRRect and other BorderRadius users. The full (pill) step is a shape only: M3Shapes.full.
class M3Corners {
  M3Corners._();

  static const BorderRadius none = BorderRadius.all(Radius.circular(0)); // md.sys.shape.corner.none
  static const BorderRadius extraSmall = BorderRadius.all(Radius.circular(4)); // md.sys.shape.corner.extra-small
  static const BorderRadius small = BorderRadius.all(Radius.circular(8)); // md.sys.shape.corner.small
  static const BorderRadius medium = BorderRadius.all(Radius.circular(12)); // md.sys.shape.corner.medium
  static const BorderRadius large = BorderRadius.all(Radius.circular(16)); // md.sys.shape.corner.large
  static const BorderRadius largeIncreased = BorderRadius.all(Radius.circular(20)); // md.sys.shape.corner.large-increased
  static const BorderRadius extraLarge = BorderRadius.all(Radius.circular(28)); // md.sys.shape.corner.extra-large
  static const BorderRadius extraLargeIncreased = BorderRadius.all(Radius.circular(32)); // md.sys.shape.corner.extra-large-increased
  static const BorderRadius extraExtraLarge = BorderRadius.all(Radius.circular(48)); // md.sys.shape.corner.extra-extra-large
  static const BorderRadius extraLargeTop = BorderRadius.only(topLeft: Radius.circular(28), topRight: Radius.circular(28), bottomLeft: Radius.circular(0), bottomRight: Radius.circular(0)); // md.sys.shape.corner.extra-large.top
  static const BorderRadius extraSmallTop = BorderRadius.only(topLeft: Radius.circular(4), topRight: Radius.circular(4), bottomLeft: Radius.circular(0), bottomRight: Radius.circular(0)); // md.sys.shape.corner.extra-small.top
  static const BorderRadius largeEnd = BorderRadius.only(topLeft: Radius.circular(0), topRight: Radius.circular(16), bottomLeft: Radius.circular(0), bottomRight: Radius.circular(16)); // md.sys.shape.corner.large.end
  static const BorderRadius largeStart = BorderRadius.only(topLeft: Radius.circular(16), topRight: Radius.circular(0), bottomLeft: Radius.circular(16), bottomRight: Radius.circular(0)); // md.sys.shape.corner.large.start
  static const BorderRadius largeTop = BorderRadius.only(topLeft: Radius.circular(16), topRight: Radius.circular(16), bottomLeft: Radius.circular(0), bottomRight: Radius.circular(0)); // md.sys.shape.corner.large.top
}

/// Shapes of the Material 3 shape scale, for widgets and themes that take an OutlinedBorder.
class M3Shapes {
  M3Shapes._();

  static const OutlinedBorder none = RoundedRectangleBorder(borderRadius: M3Corners.none); // md.sys.shape.corner.none
  static const OutlinedBorder extraSmall = RoundedRectangleBorder(borderRadius: M3Corners.extraSmall); // md.sys.shape.corner.extra-small
  static const OutlinedBorder small = RoundedRectangleBorder(borderRadius: M3Corners.small); // md.sys.shape.corner.small
  static const OutlinedBorder medium = RoundedRectangleBorder(borderRadius: M3Corners.medium); // md.sys.shape.corner.medium
  static const OutlinedBorder large = RoundedRectangleBorder(borderRadius: M3Corners.large); // md.sys.shape.corner.large
  static const OutlinedBorder largeIncreased = RoundedRectangleBorder(borderRadius: M3Corners.largeIncreased); // md.sys.shape.corner.large-increased
  static const OutlinedBorder extraLarge = RoundedRectangleBorder(borderRadius: M3Corners.extraLarge); // md.sys.shape.corner.extra-large
  static const OutlinedBorder extraLargeIncreased = RoundedRectangleBorder(borderRadius: M3Corners.extraLargeIncreased); // md.sys.shape.corner.extra-large-increased
  static const OutlinedBorder extraExtraLarge = RoundedRectangleBorder(borderRadius: M3Corners.extraExtraLarge); // md.sys.shape.corner.extra-extra-large
  static const OutlinedBorder full = StadiumBorder(); // md.sys.shape.corner.full
  static const OutlinedBorder extraLargeTop = RoundedRectangleBorder(borderRadius: M3Corners.extraLargeTop); // md.sys.shape.corner.extra-large.top
  static const OutlinedBorder extraSmallTop = RoundedRectangleBorder(borderRadius: M3Corners.extraSmallTop); // md.sys.shape.corner.extra-small.top
  static const OutlinedBorder largeEnd = RoundedRectangleBorder(borderRadius: M3Corners.largeEnd); // md.sys.shape.corner.large.end
  static const OutlinedBorder largeStart = RoundedRectangleBorder(borderRadius: M3Corners.largeStart); // md.sys.shape.corner.large.start
  static const OutlinedBorder largeTop = RoundedRectangleBorder(borderRadius: M3Corners.largeTop); // md.sys.shape.corner.large.top
}
