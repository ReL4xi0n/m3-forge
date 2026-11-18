// material3 skill asset: assets/flutter/lib/m3/expressive/loading_indicator.dart
// Material 3 Expressive loading indicator: one shape that keeps morphing through a looping sequence
// of Material shapes while it turns. Needs material_ui (MaterialShapes, RoundedPolygon,
// MaterialShapeBorder); there is no flutter/material.dart version. On a project that uses
// flutter/material.dart, show CircularProgressIndicator instead.
// Behavior and timing follow the Compose LoadingIndicator (androidx.compose.material3 1.5.0-rc01).

import 'dart:math' as math;
import 'dart:ui' show PathMetric;

import 'package:flutter/foundation.dart';
import 'package:flutter/physics.dart';
import 'package:flutter/scheduler.dart';
import 'package:material_ui/material_ui.dart';

/// Values that no component token carries; each comes from the Compose implementation.
class _Spec {
  _Spec._();

  static const double containerSize = 48; // md.comp.loading-indicator.container.width and .height
  static const double activeSize = 38; // md.comp.loading-indicator.active-indicator.size
  static const double minSize = 24; // [site: /components/loading-indicator/guidelines]
  static const double maxSize = 240; // [site: /components/loading-indicator/guidelines]
  static const int morphIntervalMillis = 650; // [impl: compose-material3 LoadingIndicator.kt:681]
  static const int rotationMillis = 4666; // [impl: compose-material3 LoadingIndicator.kt:680]
  static const double morphDamping = 0.6; // [impl: compose-material3 LoadingIndicator.kt:401]
  static const double morphStiffness = 200; // [impl: compose-material3 LoadingIndicator.kt:401]
  static const int outlineSamples = 720; // how finely the outline is measured; no spec value
  static const double quarterTurn = 90; // degrees, each morph adds one [impl: LoadingIndicator.kt:684]
  static const double fullTurn = 360; // degrees [impl: LoadingIndicator.kt:683]
}

/// The shape sequence of the indeterminate indicator [impl: LoadingIndicator.kt:541].
final List<RoundedPolygon> _sequence = <RoundedPolygon>[
  MaterialShapes.softBurst,
  MaterialShapes.cookie9Sided,
  MaterialShapes.pentagon,
  MaterialShapes.pill,
  MaterialShapes.sunny,
  MaterialShapes.cookie4Sided,
  MaterialShapes.oval,
];

final List<MaterialShapeBorder> _borders = <MaterialShapeBorder>[
  for (final RoundedPolygon p in _sequence) MaterialShapeBorder(shape: p.normalized()),
];

/// Largest scale at which every shape stays inside the box while it turns, from the ratio of its
/// own bounds to the square that holds it in any rotation [impl: LoadingIndicator.kt:615]. material_ui
/// does not export RoundedPolygon's bounds helpers, so both are measured on the shape's outline,
/// whose center is the middle of the unit square for every shape in the sequence.
final double _scaleFactor = () {
  const Rect unit = Rect.fromLTWH(0, 0, 1, 1);
  const Offset center = Offset(0.5, 0.5);
  double factor = 1;
  for (final RoundedPolygon p in _sequence) {
    final Path outline = MaterialShapeBorder(shape: p).getOuterPath(unit);
    final Rect bounds = outline.getBounds();
    double farthest = 0;
    for (final PathMetric m in outline.computeMetrics()) {
      for (double d = 0; d <= m.length; d += m.length / _Spec.outlineSamples) {
        farthest = math.max(farthest, (m.getTangentForOffset(d)!.position - center).distance);
      }
    }
    factor = math.min(factor, math.max(bounds.width, bounds.height) / (2 * farthest));
  }
  return factor * _Spec.activeSize / _Spec.containerSize;
}();

final SpringSimulation _morphSpring = SpringSimulation(
  SpringDescription.withDampingRatio(mass: 1, stiffness: _Spec.morphStiffness, ratio: _Spec.morphDamping),
  0,
  1,
  0,
);

/// A looping, morphing loading indicator for short waits of unknown length (about 200 ms to five
/// seconds). Set [contained] to place it in a circular container when it sits over other content.
/// With reduced motion (MediaQuery.disableAnimations) it shows one still shape.
class M3LoadingIndicator extends StatefulWidget {
  const M3LoadingIndicator({
    super.key,
    this.contained = false,
    this.size = _Spec.containerSize,
    this.color,
    this.containerColor,
    this.semanticLabel,
  }) : assert(size >= _Spec.minSize && size <= _Spec.maxSize, 'size must stay between 24 and 240');

  /// Draws the indicator inside a circular container (primary container) with the active color
  /// on primary container.
  final bool contained;

  /// Width and height of the whole indicator, including the container area; the active shape
  /// keeps its ratio to this size.
  final double size;

  /// Overrides the active indicator color (primary, or on primary container when [contained]).
  final Color? color;

  /// Overrides the container color of a [contained] indicator.
  final Color? containerColor;

  /// Says what is loading, for screen readers (for example "Loading messages"). Flutter allows the
  /// progress bar role only with a value, so an indeterminate indicator announces just this label.
  final String? semanticLabel;

  @override
  State<M3LoadingIndicator> createState() => _M3LoadingIndicatorState();
}

class _M3LoadingIndicatorState extends State<M3LoadingIndicator> with SingleTickerProviderStateMixin {
  final ValueNotifier<Duration> _elapsed = ValueNotifier<Duration>(Duration.zero);
  late final Ticker _ticker = createTicker((Duration d) => _elapsed.value = d);

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    final bool still = MediaQuery.disableAnimationsOf(context);
    if (still) {
      _ticker.stop();
      _elapsed.value = Duration.zero;
    } else if (!_ticker.isActive) {
      _ticker.start();
    }
  }

  @override
  void dispose() {
    _ticker.dispose();
    _elapsed.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final ColorScheme scheme = Theme.of(context).colorScheme;
    final Color active = widget.color ?? (widget.contained ? scheme.onPrimaryContainer : scheme.primary);
    final Color container = widget.containerColor ?? scheme.primaryContainer;
    Widget body = CustomPaint(
      painter: _MorphPainter(elapsed: _elapsed, color: active),
      size: Size.square(widget.size),
    );
    if (widget.contained) {
      body = DecoratedBox(decoration: BoxDecoration(color: container, shape: BoxShape.circle), child: body);
    }
    return Semantics(
      label: widget.semanticLabel,
      child: ExcludeSemantics(child: RepaintBoundary(child: SizedBox.square(dimension: widget.size, child: body))),
    );
  }
}

class _MorphPainter extends CustomPainter {
  _MorphPainter({required this.elapsed, required this.color}) : super(repaint: elapsed);

  final ValueListenable<Duration> elapsed;
  final Color color;

  @override
  void paint(Canvas canvas, Size size) {
    final int ms = elapsed.value.inMilliseconds;
    final int step = ms ~/ _Spec.morphIntervalMillis;
    final double seconds = (ms % _Spec.morphIntervalMillis) / 1000;
    // The coerced spring position: the shape never overshoots the next one [impl: LoadingIndicator.kt:479].
    final double progress = _morphSpring.x(seconds).clamp(0.0, 1.0);
    final int from = step % _borders.length;
    final int to = (from + 1) % _borders.length;

    final double globalTurn = _Spec.fullTurn * (ms % _Spec.rotationMillis) / _Spec.rotationMillis;
    final double angle = progress * _Spec.quarterTurn + (step * _Spec.quarterTurn) % _Spec.fullTurn + globalTurn;

    final Offset center = size.center(Offset.zero);
    final double side = math.min(size.width, size.height) * _scaleFactor;
    final Rect box = Rect.fromCenter(center: center, width: side, height: side);
    final ShapeBorder morph = ShapeBorder.lerp(_borders[from], _borders[to], progress)!;
    final Path path = morph.getOuterPath(box);
    // Keep the shape centered while it morphs [impl: LoadingIndicator.kt:676].
    final Path centered = path.shift(center - path.getBounds().center);

    canvas
      ..save()
      ..translate(center.dx, center.dy)
      ..rotate(angle * math.pi / 180)
      ..translate(-center.dx, -center.dy)
      ..drawPath(centered, Paint()..color = color)
      ..restore();
  }

  @override
  bool shouldRepaint(_MorphPainter old) => old.color != color || old.elapsed != elapsed;
}
