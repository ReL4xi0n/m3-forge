// material3 skill asset: assets/flutter/lib/m3/tokens.dart
// Material 3 tokens for Flutter (exports type, shape, space and motion; elevation and state here).
// Built from the skill token files (tokens/sys.json); generated, do not edit.

export 'motion.dart';
export 'shape.dart';
export 'space.dart';
export 'type.dart';

/// Elevation levels in logical pixels (Material elevation, not shadows to draw by hand).
class M3Elevation {
  M3Elevation._();

  static const double level0 = 0; // md.sys.elevation.level0
  static const double level1 = 1; // md.sys.elevation.level1
  static const double level2 = 3; // md.sys.elevation.level2
  static const double level3 = 6; // md.sys.elevation.level3
  static const double level4 = 8; // md.sys.elevation.level4
  static const double level5 = 12; // md.sys.elevation.level5
}

/// State layer opacities and the focus indicator (logical pixels).
class M3State {
  M3State._();

  static const double disabledStateLayerOpacity = 0.38; // md.sys.state.disabled.state-layer-opacity
  static const double draggedStateLayerOpacity = 0.16; // md.sys.state.dragged.state-layer-opacity
  static const double focusIndicatorInnerOffset = -3; // md.sys.state.focus-indicator.inner-offset
  static const double focusIndicatorOuterOffset = 2; // md.sys.state.focus-indicator.outer-offset
  static const double focusIndicatorThickness = 3; // md.sys.state.focus-indicator.thickness
  static const double focusStateLayerOpacity = 0.1; // md.sys.state.focus.state-layer-opacity
  static const double hoverStateLayerOpacity = 0.08; // md.sys.state.hover.state-layer-opacity
  static const double pressedStateLayerOpacity = 0.1; // md.sys.state.pressed.state-layer-opacity
}
