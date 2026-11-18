// material3 skill asset: assets/flutter/lib/m3/expressive/fab_menu.dart
// Material 3 Expressive FAB menu: a FAB that turns into a close button while two to six pill items
// unfold above it. Built from official Material, InkWell and the skill tokens (both imports).
// Behavior follows the Compose FloatingActionButtonMenu (androidx.compose.material3 1.5.0-rc01).
// The widget sits at the trailing bottom corner of its parent: place it in Scaffold.floatingActionButton
// (the Scaffold supplies the 16 dp margin) or in an Align.
// Needs the `tokens` part (../tokens.dart, ../theme.dart).

// install-assets rewrites this import to the Material library the project uses.
import 'package:flutter/material.dart';
import 'package:flutter/physics.dart';
import 'package:flutter/services.dart';

import '../theme.dart';
import '../tokens.dart';

/// Values of the FAB menu. Each comes from a component token or the Compose implementation.
class _Spec {
  _Spec._();

  static const double closeSize = 56; // md.comp.fab-menu.close-button.container.width and .height
  static const double closeIconSize = 20; // md.comp.fab-menu.close-button.icon.size
  static const double closeToItemsSpace = 8; // md.comp.fab-menu.close-button.between-space
  static const double itemHeight = 56; // md.comp.fab-menu.menu-item.container.height
  static const double itemPadding = 24; // md.comp.fab-menu.menu-item.leading-space and .trailing-space
  static const double itemIconSize = 24; // md.comp.fab-menu.menu-item.icon.size
  static const double itemIconLabelSpace = 8; // md.comp.fab-menu.menu-item.icon-label-space
  static const double itemSpace = 4; // md.comp.fab-menu.menu-item.between-space
  static const double elevation = M3Elevation.level3; // md.comp.fab-menu.close-button.container.elevation
  static const int minItems = 2; // [site:/components/fab-menu/overview]
  static const int maxItems = 6; // [site:/components/fab-menu/overview]
}

/// The FAB the menu opens from: its size when closed (the close button is always 56 dp).
enum M3FabMenuFabSize {
  /// 56 dp, corner 16, icon 24.
  baseline(56, 16, 24), // md.comp.fab.container.height, md.comp.fab.container.shape, md.comp.fab.icon.size
  /// 80 dp, corner 20, icon 28.
  medium(80, 20, 28), // md.comp.fab.medium.container.height, .container.shape, .icon.size
  /// 96 dp, corner 28, icon 36.
  large(96, 28, 36); // md.comp.fab.large.container.height, .container.shape, .icon.size

  const M3FabMenuFabSize(this.size, this.corner, this.iconSize);

  final double size;
  final double corner;
  final double iconSize;
}

/// The color set of the menu: match it to the FAB (a primary FAB opens a primary menu).
enum M3FabMenuColors { primary, secondary, tertiary }

/// One item of the menu. [label] is required (it is also the accessible name); keep the [icon].
@immutable
class M3FabMenuItem {
  const M3FabMenuItem({required this.icon, required this.label, required this.onPressed});

  /// An icon widget, for example `Icon(M3Symbols.mail)`; its size and color come from the menu.
  final Widget icon;
  final String label;
  final VoidCallback onPressed;
}

class _Colors {
  const _Colors({required this.closedContainer, required this.closedIcon, required this.openContainer, required this.openIcon, required this.item, required this.onItem});

  final Color closedContainer;
  final Color closedIcon;
  final Color openContainer;
  final Color openIcon;
  final Color item;
  final Color onItem;

  // md.comp.fab-menu.<set>.close-button.container.color / .icon.color and
  // md.comp.fab-menu.<set>-container.list-item.container.color / .label-text.color; the closed FAB is the
  // set's container FAB (Compose containerColor default: primaryContainer -> primary).
  static _Colors of(ColorScheme s, M3FabMenuColors set) => switch (set) {
        M3FabMenuColors.primary => _Colors(closedContainer: s.primaryContainer, closedIcon: s.onPrimaryContainer, openContainer: s.primary, openIcon: s.onPrimary, item: s.primaryContainer, onItem: s.onPrimaryContainer),
        M3FabMenuColors.secondary => _Colors(closedContainer: s.secondaryContainer, closedIcon: s.onSecondaryContainer, openContainer: s.secondary, openIcon: s.onSecondary, item: s.secondaryContainer, onItem: s.onSecondaryContainer),
        M3FabMenuColors.tertiary => _Colors(closedContainer: s.tertiaryContainer, closedIcon: s.onTertiaryContainer, openContainer: s.tertiary, openIcon: s.onTertiary, item: s.tertiaryContainer, onItem: s.onTertiaryContainer),
      };
}

/// A FAB with a menu of two to six related actions.
///
/// Controlled with [expanded] and [onExpandedChanged], or uncontrolled (the menu keeps its own state).
/// Tapping the toggle, pressing Escape or the system back gesture closes it; selecting an item runs
/// its callback and closes the menu unless [closeOnSelect] is false. Reduced motion
/// (`MediaQuery.disableAnimations`) switches the springs off.
class M3FabMenu extends StatefulWidget {
  const M3FabMenu({
    super.key,
    required this.items,
    required this.icon,
    required this.closeIcon,
    this.expanded,
    this.onExpandedChanged,
    this.initiallyExpanded = false,
    this.colors = M3FabMenuColors.primary,
    this.fabSize = M3FabMenuFabSize.baseline,
    this.toggleLabel = 'Toggle menu',
    this.closeOnSelect = true,
  }) : assert(items.length >= _Spec.minItems && items.length <= _Spec.maxItems, 'A FAB menu holds two to six items');

  /// Top to bottom as they appear above the FAB.
  final List<M3FabMenuItem> items;

  /// The icon of the closed FAB (for example add) and of the close button (close); sized by the menu.
  final Widget icon;
  final Widget closeIcon;

  final bool? expanded;
  final ValueChanged<bool>? onExpandedChanged;
  final bool initiallyExpanded;
  final M3FabMenuColors colors;
  final M3FabMenuFabSize fabSize;

  /// The accessible name of the toggle; say what the menu holds when "Toggle menu" is too vague.
  final String toggleLabel;
  final bool closeOnSelect;

  @override
  State<M3FabMenu> createState() => _M3FabMenuState();
}

class _M3FabMenuState extends State<M3FabMenu> with TickerProviderStateMixin {
  late bool _expanded = widget.initiallyExpanded;
  // 0 closed .. 1 open: the FAB morph (fast spatial spring) [impl: FloatingActionButtonMenu.kt:460].
  late final AnimationController _progress = AnimationController.unbounded(vsync: this);
  // Number of items shown, 0 .. count: the stagger (slow effects spring) [impl: FloatingActionButtonMenu.kt:208].
  late final AnimationController _stagger = AnimationController.unbounded(vsync: this);
  final List<AnimationController> _width = <AnimationController>[]; // fast spatial [impl: FloatingActionButtonMenu.kt:342]
  final List<AnimationController> _alpha = <AnimationController>[]; // fast effects [impl: FloatingActionButtonMenu.kt:343]
  final List<double> _target = <double>[]; // the target each item's springs run to
  final FocusNode _toggleFocus = FocusNode(debugLabel: 'M3FabMenu toggle');

  // A spring stops within this distance of its target, not exactly on it.
  static final double _settled = Tolerance.defaultTolerance.distance;

  bool get _open => widget.expanded ?? _expanded;

  @override
  void initState() {
    super.initState();
    _syncItemControllers();
    if (_open) {
      _progress.value = 1;
      _stagger.value = widget.items.length.toDouble();
      for (int i = 0; i < _width.length; i++) {
        _width[i].value = 1;
        _alpha[i].value = 1;
      }
    }
    _stagger.addListener(_syncItems);
  }

  @override
  void didUpdateWidget(M3FabMenu old) {
    super.didUpdateWidget(old);
    _syncItemControllers();
    _animateToExpanded(old.expanded ?? _expanded);
  }

  void _syncItemControllers() {
    while (_width.length < widget.items.length) {
      _width.add(AnimationController.unbounded(vsync: this));
      _alpha.add(AnimationController.unbounded(vsync: this));
      _target.add(_open ? 1 : 0);
    }
    while (_width.length > widget.items.length) {
      _width.removeLast().dispose();
      _alpha.removeLast().dispose();
      _target.removeLast();
    }
  }

  @override
  void dispose() {
    _progress.dispose();
    _stagger.dispose();
    for (final AnimationController c in <AnimationController>[..._width, ..._alpha]) {
      c.dispose();
    }
    _toggleFocus.dispose();
    super.dispose();
  }

  void _spring(AnimationController c, M3Spring s, double target) {
    if (MediaQuery.disableAnimationsOf(context)) {
      c.value = target;
      return;
    }
    c.animateWith(SpringSimulation(
      SpringDescription.withDampingRatio(mass: 1, stiffness: s.stiffness, ratio: s.dampingRatio),
      c.value,
      target,
      c.velocity,
    ));
  }

  // The expanded state changed (by a tap, by the parent, or at build): run the morph and the stagger.
  void _animateToExpanded(bool before) {
    if (before == _open) return;
    final M3MotionScheme m = M3MotionTheme.of(context);
    _spring(_progress, m.fastSpatial, _open ? 1 : 0);
    _spring(_stagger, m.slowEffects, _open ? widget.items.length.toDouble() : 0);
    _syncItems();
  }

  // An item is shown when index >= count - stagger [impl: FloatingActionButtonMenu.kt:283], and its
  // width and fade follow with their own springs.
  void _syncItems() {
    if (!mounted) return;
    final M3MotionScheme m = M3MotionTheme.of(context);
    final int shown = _stagger.value.round();
    for (int i = 0; i < _width.length; i++) {
      final double target = i >= _width.length - shown ? 1 : 0;
      if (_target[i] == target) continue;
      _target[i] = target;
      _spring(_width[i], m.fastSpatial, target);
      _spring(_alpha[i], m.fastEffects, target);
    }
  }

  void _setExpanded(bool value) {
    if (value == _open) return;
    if (widget.expanded == null) {
      setState(() => _expanded = value);
      _animateToExpanded(!value);
    }
    widget.onExpandedChanged?.call(value);
    if (!value) _toggleFocus.requestFocus();
  }

  Widget _toggle(BuildContext context, _Colors c) {
    final double p = _progress.value;
    final double t = p.clamp(0.0, 1.0);
    final M3FabMenuFabSize f = widget.fabSize;
    final double size = f.size + (_Spec.closeSize - f.size) * p;
    final double corner = f.corner + (_Spec.closeSize / 2 - f.corner) * p; // closed corner to full round
    final double iconSize = f.iconSize + (_Spec.closeIconSize - f.iconSize) * p;
    final Color container = Color.lerp(c.closedContainer, c.openContainer, t)!;
    final Color iconColor = Color.lerp(c.closedIcon, c.openIcon, t)!;
    final ShapeBorder shape = RoundedRectangleBorder(borderRadius: BorderRadius.circular(corner));
    return SizedBox(
      width: f.size,
      height: f.size,
      child: Align(
        alignment: AlignmentDirectional.topEnd,
        child: Semantics(
          container: true,
          button: true,
          focusable: true,
          label: widget.toggleLabel,
          expanded: _open,
          onTap: () => _setExpanded(!_open),
          excludeSemantics: true,
          child: Material(
            color: container,
            elevation: _Spec.elevation,
            shape: shape,
            clipBehavior: Clip.antiAlias,
            child: InkWell(
              focusNode: _toggleFocus,
              customBorder: shape,
              overlayColor: _overlay(iconColor),
              onTap: () => _setExpanded(!_open),
              child: SizedBox(
                width: size,
                height: size,
                child: Center(
                  child: IconTheme(
                    data: IconThemeData(size: iconSize, color: iconColor),
                    child: p < 0.5 ? widget.icon : widget.closeIcon, // switches at half progress [impl: FloatingActionButtonMenu.kt:386]
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }

  // State layers in the content color [token:md.comp.fab-menu.primary.close-button.hovered.state-layer.opacity].
  static WidgetStateProperty<Color?> _overlay(Color content) => WidgetStateProperty.resolveWith<Color?>((Set<WidgetState> s) {
        if (s.contains(WidgetState.pressed)) return content.withValues(alpha: M3State.pressedStateLayerOpacity);
        if (s.contains(WidgetState.focused)) return content.withValues(alpha: M3State.focusStateLayerOpacity);
        if (s.contains(WidgetState.hovered)) return content.withValues(alpha: M3State.hoverStateLayerOpacity);
        return null;
      });

  Widget _item(BuildContext context, int index, _Colors c) {
    final M3FabMenuItem item = widget.items[index];
    final double alpha = _alpha[index].value.clamp(0.0, 1.0);
    final double widthFactor = _width[index].value < 0 ? 0 : _width[index].value; // the spring may overshoot
    final bool visible = alpha > _settled;
    const ShapeBorder shape = StadiumBorder(); // md.comp.fab-menu.menu-item.container.shape (full)
    final Widget content = SizedBox(
      height: _Spec.itemHeight,
      child: Padding(
        padding: const EdgeInsetsDirectional.symmetric(horizontal: _Spec.itemPadding),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: <Widget>[
            IconTheme(data: IconThemeData(size: _Spec.itemIconSize, color: c.onItem), child: item.icon),
            const SizedBox(width: _Spec.itemIconLabelSpace),
            Text(item.label, softWrap: false, style: Theme.of(context).textTheme.titleMedium?.copyWith(color: c.onItem)), // md.comp.fab-menu.menu-item.label-text
          ],
        ),
      ),
    );
    return FocusTraversalOrder(
      order: NumericFocusOrder(index + 1.0),
      child: ExcludeSemantics(
        excluding: !visible,
        child: ExcludeFocus(
          excluding: !visible,
          child: IgnorePointer(
            ignoring: !visible,
            child: Opacity(
              opacity: alpha,
              child: MergeSemantics(
                child: Semantics(
                  button: true,
                  child: Material(
                    color: c.item,
                    shape: shape,
                    clipBehavior: Clip.antiAlias,
                    child: InkWell(
                      customBorder: shape,
                      overlayColor: _overlay(c.onItem),
                      onTap: () {
                        item.onPressed();
                        if (widget.closeOnSelect) _setExpanded(false);
                      },
                      child: Align(
                        alignment: AlignmentDirectional.centerEnd,
                        widthFactor: widthFactor,
                        heightFactor: 1,
                        child: content,
                      ),
                    ),
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final _Colors c = _Colors.of(Theme.of(context).colorScheme, widget.colors);
    return PopScope(
      canPop: !_open,
      onPopInvokedWithResult: (bool didPop, Object? _) {
        if (!didPop) _setExpanded(false);
      },
      child: CallbackShortcuts(
        bindings: <ShortcutActivator, VoidCallback>{
          const SingleActivator(LogicalKeyboardKey.escape): () => _setExpanded(false),
        },
        child: FocusTraversalGroup(
          policy: OrderedTraversalPolicy(),
          child: TapRegion(
            // A tap outside the toggle and the items closes the open menu.
            onTapOutside: (PointerDownEvent _) {
              if (_open) _setExpanded(false);
            },
            child: AnimatedBuilder(
            animation: Listenable.merge(<Listenable>[_progress, _stagger, ..._width, ..._alpha]),
            builder: (BuildContext context, Widget? _) {
              final bool anyShown = _alpha.any((AnimationController a) => a.value > _settled);
              return Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.end,
                children: <Widget>[
                  if (anyShown) ...<Widget>[
                    for (int i = 0; i < widget.items.length; i++) ...<Widget>[
                      if (i > 0) const SizedBox(height: _Spec.itemSpace),
                      _item(context, i, c),
                    ],
                    const SizedBox(height: _Spec.closeToItemsSpace),
                  ],
                  FocusTraversalOrder(
                    order: const NumericFocusOrder(0),
                    child: Focus(
                      canRequestFocus: false,
                      skipTraversal: true,
                      onKeyEvent: (FocusNode node, KeyEvent e) {
                        // Down arrow from the toggle goes to the first item at the top (as Tab does).
                        if (_open && e is KeyDownEvent && e.logicalKey == LogicalKeyboardKey.arrowDown) {
                          node.nextFocus();
                          return KeyEventResult.handled;
                        }
                        return KeyEventResult.ignored;
                      },
                      child: _toggle(context, c),
                    ),
                  ),
                ],
              );
            },
            ),
          ),
        ),
      ),
    );
  }
}
