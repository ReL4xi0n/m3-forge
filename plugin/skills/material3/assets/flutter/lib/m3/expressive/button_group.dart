// material3 skill asset: assets/flutter/lib/m3/expressive/button_group.dart
// Material 3 Expressive button group, standard and connected, built from the official buttons.
// Standard: a pressed button grows and its neighbors give way. Connected: toggle buttons packed with
// small inner corners; the pressed one squares off and a selected one turns fully round.
// Size small only (40 dp). Behavior follows the Compose ButtonGroup (androidx.compose.material3
// 1.5.0-rc01). There is no overflow menu: keep the buttons within one line.
// Needs the `tokens` part (../tokens.dart, ../theme.dart).

// install-assets rewrites this import to the Material library the project uses.
import 'package:flutter/material.dart';
import 'package:flutter/physics.dart';
import 'package:flutter/rendering.dart';

import '../theme.dart';
import '../tokens.dart';

/// Group values, small size. Each comes from a component token or the Compose implementation.
class _Spec {
  _Spec._();

  static const double standardGap = 12; // md.comp.button-group.standard.small.between-space
  static const double connectedGap = 2; // md.comp.button-group.connected.small.between-space
  static const double height = 40; // md.comp.button-group.connected.small.container.height
  static const double fullRadius = height / 2; // md.comp.button-group.connected.small.container.shape (full)
  static const double innerCorner = 8; // md.comp.button-group.connected.small.inner-corner.corner-size
  static const double pressedInnerCorner = 4; // md.comp.button-group.connected.small.pressed.inner-corner.corner-size
  static const double expandedRatio = 0.15; // md.comp.button-group.standard.small.pressed.item.width.multiplier
  static const double compressionLimit = M3Space.space200; // md.comp.button.small.trailing-space (Compose ButtonGroup.kt:1055 uses 24)
}

/// A row of buttons that react to each other.
///
/// [children] are official buttons (FilledButton, FilledButton.tonal, OutlinedButton, ElevatedButton,
/// or IconButton in a container style); standard icon buttons and text buttons have no container
/// to reshape. With [connected], every child is a toggle: tell the group which ones are on with
/// [selected] and give the selected ones their selected colors yourself. Do not mix color styles in
/// a connected group.
class M3ButtonGroup extends StatefulWidget {
  const M3ButtonGroup({
    super.key,
    required this.children,
    this.connected = false,
    this.selected = const <int>{},
    this.expand = false,
    this.spacing,
    this.expandedRatio = _Spec.expandedRatio,
  });

  final List<Widget> children;

  /// Packs the buttons 2 dp apart with asymmetric corners (a selection group), instead of the
  /// standard group where a pressed button grows.
  final bool connected;

  /// Indices of the toggled-on children (connected groups): they take the fully round shape.
  final Set<int> selected;

  /// Connected groups only: share the available width between the buttons.
  final bool expand;

  /// Space between buttons; defaults to the token for the variant.
  final double? spacing;

  /// Standard groups only: how much of its own width a pressed button grows (0 turns it off).
  final double expandedRatio;

  @override
  State<M3ButtonGroup> createState() => _M3ButtonGroupState();
}

class _M3ButtonGroupState extends State<M3ButtonGroup> with TickerProviderStateMixin {
  final List<AnimationController> _press = <AnimationController>[];

  @override
  void initState() {
    super.initState();
    _sync();
  }

  @override
  void didUpdateWidget(M3ButtonGroup old) {
    super.didUpdateWidget(old);
    _sync();
  }

  void _sync() {
    while (_press.length < widget.children.length) {
      _press.add(AnimationController.unbounded(vsync: this));
    }
    while (_press.length > widget.children.length) {
      _press.removeLast().dispose();
    }
  }

  @override
  void dispose() {
    for (final AnimationController c in _press) {
      c.dispose();
    }
    super.dispose();
  }

  // The width change follows the fast spatial spring of the motion scheme
  // (md.comp.button-group.standard.small.pressed.item.width.motion.spring.*); reduced motion skips it.
  void _setPressed(int index, bool down) {
    if (widget.connected || index >= _press.length || MediaQuery.disableAnimationsOf(context)) {
      return;
    }
    final M3Spring s = M3MotionTheme.of(context).fastSpatial;
    final AnimationController c = _press[index];
    c.animateWith(SpringSimulation(
      SpringDescription.withDampingRatio(mass: 1, stiffness: s.stiffness, ratio: s.dampingRatio),
      c.value,
      down ? 1 : 0,
      c.velocity,
    ));
  }

  Widget _item(BuildContext context, int index) {
    Widget child = Listener(
      onPointerDown: (_) => _setPressed(index, true),
      onPointerUp: (_) => _setPressed(index, false),
      onPointerCancel: (_) => _setPressed(index, false),
      child: widget.children[index],
    );
    if (widget.connected) {
      child = _ConnectedShape(
        index: index,
        count: widget.children.length,
        selected: widget.selected.contains(index),
        child: child,
      );
    }
    return child;
  }

  @override
  Widget build(BuildContext context) {
    final int count = widget.children.length;
    final double gap = widget.spacing ?? (widget.connected ? _Spec.connectedGap : _Spec.standardGap);
    if (widget.connected) {
      return Row(
        mainAxisSize: widget.expand ? MainAxisSize.max : MainAxisSize.min,
        children: <Widget>[
          for (int i = 0; i < count; i++) ...<Widget>[
            if (i > 0) SizedBox(width: gap),
            if (widget.expand) Expanded(child: _item(context, i)) else _item(context, i),
          ],
        ],
      );
    }
    return AnimatedBuilder(
      animation: Listenable.merge(_press),
      builder: (BuildContext context, Widget? _) => _GroupLayout(
        gap: gap,
        ratio: widget.expandedRatio,
        limit: _Spec.compressionLimit,
        factors: <double>[for (final AnimationController c in _press) c.value],
        children: <Widget>[for (int i = 0; i < count; i++) _item(context, i)],
      ),
    );
  }
}

/// Gives the buttons below the corner shapes of one position in a connected group, through the
/// button themes (the buttons keep every other style from the app theme).
class _ConnectedShape extends StatelessWidget {
  const _ConnectedShape({required this.index, required this.count, required this.selected, required this.child});

  final int index;
  final int count;
  final bool selected;
  final Widget child;

  OutlinedBorder _shape({required bool pressed}) {
    const Radius full = Radius.circular(_Spec.fullRadius);
    if (selected) {
      return const RoundedRectangleBorder(borderRadius: BorderRadiusDirectional.all(full));
    }
    final Radius inner = Radius.circular(pressed ? _Spec.pressedInnerCorner : _Spec.innerCorner);
    final bool first = index == 0;
    final bool last = index == count - 1;
    return RoundedRectangleBorder(
      borderRadius: BorderRadiusDirectional.only(
        topStart: first ? full : inner,
        bottomStart: first ? full : inner,
        topEnd: last ? full : inner,
        bottomEnd: last ? full : inner,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final ButtonStyle shape = ButtonStyle(
      shape: WidgetStateProperty.resolveWith<OutlinedBorder>(
        (Set<WidgetState> states) => _shape(pressed: states.contains(WidgetState.pressed)),
      ),
    );
    ButtonStyle over(ButtonStyle? theme) => theme?.merge(shape) ?? shape;
    return FilledButtonTheme(
      data: FilledButtonThemeData(style: over(FilledButtonTheme.of(context).style)),
      child: OutlinedButtonTheme(
        data: OutlinedButtonThemeData(style: over(OutlinedButtonTheme.of(context).style)),
        child: ElevatedButtonTheme(
          data: ElevatedButtonThemeData(style: over(ElevatedButtonTheme.of(context).style)),
          child: IconButtonTheme(
            data: IconButtonThemeData(style: over(IconButtonTheme.of(context).style)),
            child: child,
          ),
        ),
      ),
    );
  }
}

class _GroupLayout extends MultiChildRenderObjectWidget {
  const _GroupLayout({
    required this.gap,
    required this.ratio,
    required this.limit,
    required this.factors,
    required super.children,
  });

  final double gap;
  final double ratio;
  final double limit;
  final List<double> factors;

  @override
  RenderObject createRenderObject(BuildContext context) =>
      _RenderGroup(gap: gap, ratio: ratio, limit: limit, factors: factors);

  @override
  void updateRenderObject(BuildContext context, _RenderGroup renderObject) {
    renderObject
      ..gap = gap
      ..ratio = ratio
      ..limit = limit
      ..factors = factors;
  }
}

class _GroupParentData extends ContainerBoxParentData<RenderBox> {}

/// Lays the buttons out at their own widths, then moves width from the neighbors of a pressed
/// button to the pressed one, so the group keeps its overall width [impl: ButtonGroup.kt:462].
class _RenderGroup extends RenderBox
    with ContainerRenderObjectMixin<RenderBox, _GroupParentData>, RenderBoxContainerDefaultsMixin<RenderBox, _GroupParentData> {
  _RenderGroup({required double gap, required double ratio, required double limit, required List<double> factors})
      : _gap = gap,
        _ratio = ratio,
        _limit = limit,
        _factors = factors;

  double _gap;
  double _ratio;
  double _limit;
  List<double> _factors;

  set gap(double v) {
    if (v == _gap) return;
    _gap = v;
    markNeedsLayout();
  }

  set ratio(double v) {
    if (v == _ratio) return;
    _ratio = v;
    markNeedsLayout();
  }

  set limit(double v) {
    if (v == _limit) return;
    _limit = v;
    markNeedsLayout();
  }

  set factors(List<double> v) {
    _factors = v;
    markNeedsLayout();
  }

  @override
  void setupParentData(RenderBox child) {
    if (child.parentData is! _GroupParentData) child.parentData = _GroupParentData();
  }

  List<RenderBox> get _kids {
    final List<RenderBox> out = <RenderBox>[];
    RenderBox? c = firstChild;
    while (c != null) {
      out.add(c);
      c = childAfter(c);
    }
    return out;
  }

  double _factor(int i) => i < _factors.length ? _factors[i] : 0;

  // Widths after the press: the pressed button takes up to the ratio of its width, bounded by what
  // each neighbor can give; a button in the middle takes from both sides.
  List<double> _adjust(List<double> natural) {
    final List<double> w = List<double>.of(natural);
    final int n = w.length;
    if (n < 2) return w;
    for (int i = 0; i < n; i++) {
      final double f = _factor(i);
      if (f == 0) continue;
      double grown;
      if (i > 0 && i < n - 1) {
        final double growth = f * _min3(_ratio * w[i] / 2, _limit, _limit);
        final double left = growth.clamp(0.0, w[i - 1]);
        final double right = growth.clamp(0.0, w[i + 1]);
        w[i - 1] -= left;
        w[i + 1] -= right;
        grown = left + right;
      } else {
        final int nb = i == 0 ? 1 : n - 2;
        final double growth = f * (_ratio * w[i] < _limit ? _ratio * w[i] : _limit);
        grown = growth.clamp(0.0, w[nb]);
        w[nb] -= grown;
      }
      w[i] += grown;
    }
    return w;
  }

  double _min3(double a, double b, double c) => a < b ? (a < c ? a : c) : (b < c ? b : c);

  @override
  void performLayout() {
    final List<RenderBox> kids = _kids;
    _scales = List<double>.filled(kids.length, 1);
    if (kids.isEmpty) {
      size = constraints.constrain(Size.zero);
      return;
    }
    final BoxConstraints loose = BoxConstraints(maxHeight: constraints.maxHeight);
    final List<double> natural = <double>[];
    for (final RenderBox k in kids) {
      k.layout(loose, parentUsesSize: true);
      natural.add(k.size.width);
    }
    final List<double> widths = _adjust(natural);
    double height = 0;
    for (int i = 0; i < kids.length; i++) {
      if (widths[i] > natural[i]) {
        kids[i].layout(BoxConstraints(minWidth: widths[i], maxWidth: widths[i], maxHeight: constraints.maxHeight), parentUsesSize: true);
      } else if (widths[i] < natural[i]) {
        // A button laid out narrower than its label would wrap the label, so a button that gives
        // way keeps its natural layout and is drawn slightly narrower.
        _scales[i] = widths[i] / natural[i];
      }
      if (kids[i].size.height > height) height = kids[i].size.height;
    }
    double x = 0;
    for (int i = 0; i < kids.length; i++) {
      (kids[i].parentData! as _GroupParentData).offset = Offset(x, (height - kids[i].size.height) / 2);
      x += widths[i] + _gap;
    }
    size = constraints.constrain(Size(x - _gap, height));
  }

  List<double> _scales = <double>[];

  Matrix4 _paintTransform(int i, RenderBox kid) {
    final Offset o = (kid.parentData! as _GroupParentData).offset;
    return Matrix4.translationValues(o.dx, o.dy, 0)..scaleByDouble(i < _scales.length ? _scales[i] : 1, 1, 1, 1);
  }

  @override
  Size computeDryLayout(BoxConstraints constraints) {
    final BoxConstraints loose = BoxConstraints(maxHeight: constraints.maxHeight);
    double width = 0;
    double height = 0;
    int n = 0;
    for (final RenderBox k in _kids) {
      final Size s = k.getDryLayout(loose);
      width += s.width;
      if (s.height > height) height = s.height;
      n++;
    }
    return constraints.constrain(Size(n == 0 ? 0 : width + _gap * (n - 1), height));
  }

  @override
  double computeMinIntrinsicWidth(double height) => computeMaxIntrinsicWidth(height);

  @override
  double computeMaxIntrinsicWidth(double height) {
    double width = 0;
    int n = 0;
    for (final RenderBox k in _kids) {
      width += k.getMaxIntrinsicWidth(height);
      n++;
    }
    return n == 0 ? 0 : width + _gap * (n - 1);
  }

  @override
  double computeMinIntrinsicHeight(double width) => computeMaxIntrinsicHeight(width);

  @override
  double computeMaxIntrinsicHeight(double width) {
    double height = 0;
    for (final RenderBox k in _kids) {
      final double h = k.getMaxIntrinsicHeight(double.infinity);
      if (h > height) height = h;
    }
    return height;
  }

  @override
  double? computeDistanceToActualBaseline(TextBaseline baseline) => defaultComputeDistanceToHighestActualBaseline(baseline);

  @override
  void applyPaintTransform(RenderBox child, Matrix4 transform) {
    transform.multiply(_paintTransform(_kids.indexOf(child), child));
  }

  @override
  bool hitTestChildren(BoxHitTestResult result, {required Offset position}) {
    final List<RenderBox> kids = _kids;
    for (int i = kids.length - 1; i >= 0; i--) {
      final bool hit = result.addWithPaintTransform(
        transform: _paintTransform(i, kids[i]),
        position: position,
        hitTest: (BoxHitTestResult r, Offset p) => kids[i].hitTest(r, position: p),
      );
      if (hit) return true;
    }
    return false;
  }

  @override
  void paint(PaintingContext context, Offset offset) {
    final List<RenderBox> kids = _kids;
    for (int i = 0; i < kids.length; i++) {
      final Offset at = offset + (kids[i].parentData! as _GroupParentData).offset;
      final double sx = i < _scales.length ? _scales[i] : 1;
      if (sx == 1) {
        context.paintChild(kids[i], at);
      } else {
        context.pushTransform(needsCompositing, at, Matrix4.diagonal3Values(sx, 1, 1), (PaintingContext c, Offset o) => c.paintChild(kids[i], o));
      }
    }
  }
}
