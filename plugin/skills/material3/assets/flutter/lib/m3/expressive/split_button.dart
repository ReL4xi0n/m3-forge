// material3 skill asset: assets/flutter/lib/m3/expressive/split_button.dart
// Material 3 Expressive split button: a leading button that runs the main action and a trailing
// button that opens a menu of related actions. Built from the official buttons and MenuAnchor with the
// skill tokens (both imports). Behavior follows the Compose SplitButtonLayout (androidx.compose.material3
// 1.5.0-rc01). Sizes extra small to extra large; elevated, filled, tonal and outlined.
// Needs the `tokens` part (../tokens.dart).

// install-assets rewrites this import to the Material library the project uses.
import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:flutter/physics.dart';

import '../tokens.dart';

/// Per-size values: height, leading start and end padding, trailing side padding, menu icon, inner
/// corner (rest and pressed), button icon, icon-label gap, optical offset of the menu icon.
class _Size {
  const _Size(this.height, this.leadStart, this.leadEnd, this.trailSide, this.menuIcon, this.inner, this.innerPressed, this.icon, this.iconLabel, this.opticalOffset);

  final double height;
  final double leadStart;
  final double leadEnd;
  final double trailSide;
  final double menuIcon;
  final double inner;
  final double innerPressed;
  final double icon;
  final double iconLabel;
  final double opticalOffset;
}

/// The gap between the halves is 2 dp at every size.
const double _gap = 2; // md.comp.split-button.small.between-space (and the other sizes)

/// The five sizes. Tokens: md.comp.split-button.<size>.container.height, .leading-button.leading-space,
/// .leading-button.trailing-space, .trailing-button.leading-space and .trailing-space,
/// .trailing-button.icon.size, .inner-corner.corner-size and .inner-corner.pressed.corner-size;
/// button icon and icon-label gap from md.comp.button.<size>.icon.size and .icon-label-space; the
/// optical offset of the unselected menu icon from [site:/components/split-button/specs].
enum M3SplitButtonSize {
  extraSmall(_Size(32, 12, 10, 13, 22, 4, 8, 20, 4, -1)),
  small(_Size(40, 16, 12, 13, 22, 4, 12, 20, 8, -1)),
  medium(_Size(56, 24, 24, 15, 26, 4, 12, 24, 8, -2)),
  large(_Size(96, 48, 48, 29, 38, 8, 20, 32, 12, -3)),
  extraLarge(_Size(136, 64, 64, 43, 50, 12, 20, 40, 16, -6));

  const M3SplitButtonSize(this._v);
  final _Size _v;

  /// The label style of the leading button: md.comp.button.<size>.label-text.
  TextStyle? label(TextTheme t) => switch (this) {
        extraSmall || small => t.labelLarge,
        medium => t.titleMedium,
        large => t.headlineSmall,
        extraLarge => t.headlineLarge,
      };
}

/// The color configuration, as the buttons: elevated, filled, tonal or outlined (there is no text one).
enum M3SplitButtonStyle { filled, tonal, elevated, outlined }

/// A button with a main action and a menu of related actions.
///
/// [child] is the label of the leading button (one or two words), [icon] an optional icon before it.
/// [menuIcon] is the trailing button's expand icon (`Icon(M3Symbols.keyboardArrowDown)`); it rotates
/// 180 degrees while the menu is open and its size comes from the split button. [menuLabel] is the
/// accessible name of the trailing button ("More watch options"): it says that more options exist and
/// what they relate to. [menuChildren] are the menu's entries (MenuItemButton, SubmenuButton, ...).
class M3SplitButton extends StatefulWidget {
  const M3SplitButton({
    super.key,
    required this.onPressed,
    required this.child,
    required this.menuIcon,
    required this.menuLabel,
    required this.menuChildren,
    this.icon,
    this.size = M3SplitButtonSize.small,
    this.style = M3SplitButtonStyle.filled,
    this.menuController,
  });

  final VoidCallback? onPressed;
  final Widget child;
  final Widget? icon;
  final Widget menuIcon;
  final String menuLabel;
  final List<Widget> menuChildren;
  final M3SplitButtonSize size;
  final M3SplitButtonStyle style;

  /// Open or close the menu from code; the split button makes its own when this is null.
  final MenuController? menuController;

  @override
  State<M3SplitButton> createState() => _M3SplitButtonState();
}

class _M3SplitButtonState extends State<M3SplitButton> with SingleTickerProviderStateMixin {
  late final MenuController _own = MenuController();
  // 0 closed .. 1 open: the menu icon turn.
  late final AnimationController _turn = AnimationController.unbounded(vsync: this);
  bool _open = false;

  MenuController get _controller => widget.menuController ?? _own;

  @override
  void dispose() {
    _turn.dispose();
    super.dispose();
  }

  // The site says the icon turns with the standard motion scheme, not the expressive one, and names no
  // spring: the standard scheme's default spatial spring is our reading [site:/components/split-button/guidelines].
  void _setOpen(bool open) {
    setState(() => _open = open);
    if (MediaQuery.disableAnimationsOf(context)) {
      _turn.value = open ? 1 : 0;
      return;
    }
    final M3Spring s = M3Motion.standard.defaultSpatial;
    _turn.animateWith(SpringSimulation(
      SpringDescription.withDampingRatio(mass: 1, stiffness: s.stiffness, ratio: s.dampingRatio),
      _turn.value,
      open ? 1 : 0,
      _turn.velocity,
    ));
  }

  // Outer corners are fully round; the inner corner grows when hovered, focused or pressed
  // [token:md.comp.split-button.small.inner-corner.pressed.corner-size]; with the menu open the
  // trailing button is fully round [site:/components/split-button/specs].
  OutlinedBorder _shape(bool leading, Set<WidgetState> states, {required bool open}) {
    final _Size v = widget.size._v;
    final Radius full = Radius.circular(v.height / 2); // md.comp.split-button.<size>.container.shape (full)
    if (!leading && open) return RoundedRectangleBorder(borderRadius: BorderRadiusDirectional.all(full));
    final bool active = states.contains(WidgetState.pressed) || states.contains(WidgetState.hovered) || states.contains(WidgetState.focused);
    final Radius inner = Radius.circular(active ? v.innerPressed : v.inner);
    return RoundedRectangleBorder(
      borderRadius: leading
          ? BorderRadiusDirectional.only(topStart: full, bottomStart: full, topEnd: inner, bottomEnd: inner)
          : BorderRadiusDirectional.only(topStart: inner, bottomStart: inner, topEnd: full, bottomEnd: full),
    );
  }

  ButtonStyle _buttonStyle(bool leading, {required bool open}) {
    final _Size v = widget.size._v;
    final bool still = MediaQuery.disableAnimationsOf(context);
    return ButtonStyle(
      minimumSize: WidgetStatePropertyAll<Size>(Size(0, v.height)),
      maximumSize: WidgetStatePropertyAll<Size>(Size(double.infinity, v.height)),
      padding: WidgetStatePropertyAll<EdgeInsetsGeometry>(
        leading ? EdgeInsetsDirectional.only(start: v.leadStart, end: v.leadEnd) : EdgeInsetsDirectional.symmetric(horizontal: v.trailSide),
      ),
      shape: WidgetStateProperty.resolveWith<OutlinedBorder>((Set<WidgetState> s) => _shape(leading, s, open: open)),
      iconSize: WidgetStatePropertyAll<double>(leading ? v.icon : v.menuIcon),
      textStyle: leading ? WidgetStatePropertyAll<TextStyle?>(widget.size.label(Theme.of(context).textTheme)) : null,
      animationDuration: still ? Duration.zero : null, // otherwise the button's own shape animation
    );
  }

  Widget _button(ButtonStyle style, VoidCallback? onPressed, Widget child) => switch (widget.style) {
        M3SplitButtonStyle.filled => FilledButton(style: style, onPressed: onPressed, child: child),
        M3SplitButtonStyle.tonal => FilledButton.tonal(style: style, onPressed: onPressed, child: child),
        M3SplitButtonStyle.elevated => ElevatedButton(style: style, onPressed: onPressed, child: child),
        M3SplitButtonStyle.outlined => OutlinedButton(style: style, onPressed: onPressed, child: child),
      };

  // The color of the content, for the state layer of the open trailing button.
  Color _content(ColorScheme c) => switch (widget.style) {
        M3SplitButtonStyle.filled => c.onPrimary,
        M3SplitButtonStyle.tonal => c.onSecondaryContainer,
        M3SplitButtonStyle.elevated => c.primary,
        M3SplitButtonStyle.outlined => c.onSurfaceVariant,
      };

  Widget _leading() {
    final _Size v = widget.size._v;
    final Widget child = widget.icon == null
        ? widget.child
        : Row(mainAxisSize: MainAxisSize.min, children: <Widget>[
            IconTheme.merge(data: IconThemeData(size: v.icon), child: widget.icon!),
            SizedBox(width: v.iconLabel),
            widget.child,
          ]);
    return _button(_buttonStyle(true, open: false), widget.onPressed, child);
  }

  Widget _trailing(BuildContext context) {
    final _Size v = widget.size._v;
    final TextDirection dir = Directionality.of(context);
    return AnimatedBuilder(
      animation: _turn,
      builder: (BuildContext context, Widget? _) {
        final double p = _turn.value;
        // The closed icon sits off center by the optical offset (mirrored in right-to-left); open it is centered.
        final double dx = v.opticalOffset * (1 - p.clamp(0.0, 1.0)) * (dir == TextDirection.rtl ? -1 : 1);
        final Widget icon = Semantics(
          label: widget.menuLabel,
          expanded: _open,
          child: Transform.translate(
            offset: Offset(dx, 0),
            child: Transform.rotate(angle: p * math.pi, child: IconTheme.merge(data: IconThemeData(size: v.menuIcon), child: widget.menuIcon)),
          ),
        );
        final Widget button = _button(
          _buttonStyle(false, open: _open),
          () => _open ? _controller.close() : _controller.open(),
          icon,
        );
        if (!_open) return button;
        // The open trailing button adds a state layer in the content color at the pressed opacity
        // [impl: SplitButton.kt:421].
        return DecoratedBox(
          position: DecorationPosition.foreground,
          decoration: ShapeDecoration(
            shape: _shape(false, const <WidgetState>{}, open: true),
            color: _content(Theme.of(context).colorScheme).withValues(alpha: M3State.pressedStateLayerOpacity),
          ),
          child: button,
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: <Widget>[
        _leading(),
        const SizedBox(width: _gap),
        MenuAnchor(
          controller: _controller,
          alignmentOffset: const Offset(0, M3Space.space50), // 4 dp between the menu and the split button [site:/components/split-button/guidelines]
          onOpen: () => _setOpen(true),
          onClose: () => _setOpen(false),
          menuChildren: widget.menuChildren,
          builder: (BuildContext context, MenuController controller, Widget? _) => _trailing(context),
        ),
      ],
    );
  }
}
