// material3 skill asset: assets/flutter/lib/m3/expressive/toolbar.dart
// Material 3 Expressive toolbars: the floating toolbar (horizontal or vertical, optional FAB) and the
// docked toolbar (full width, replaces the bottom app bar). Standard (quiet) or vibrant (emphasized)
// colors. Built from official Material widgets and the skill tokens (both imports).
// Behavior follows the Compose HorizontalFloatingToolbar, VerticalFloatingToolbar and
// FlexibleBottomAppBar (androidx.compose.material3 1.5.0-rc01). Not built: scroll-away and collapse
// behavior, the overflow menu and the medium FAB size.
// Needs the `tokens` part (../tokens.dart).

// install-assets rewrites this import to the Material library the project uses.
import 'package:flutter/material.dart';

import '../tokens.dart';

/// Values of the toolbars. Each comes from a component token or the Compose implementation.
class _Spec {
  _Spec._();

  static const double size = 64; // md.comp.toolbar.floating.horizontal.container.height, .vertical.container.width, md.comp.toolbar.docked.container.height
  static const double floatingPadding = 8; // md.comp.toolbar.floating.container.leading-space and .trailing-space
  static const double floatingSpace = 4; // md.comp.toolbar.floating.container.between-space
  static const double floatingElevation = M3Elevation.level3; // md.comp.toolbar.floating.container.elevation
  static const double fabSpace = 8; // md.comp.toolbar.floating.fab.between-space
  static const double fabSize = 56; // md.comp.toolbar.floating.fab.container.width and .height
  static const double fabCorner = 16; // md.comp.toolbar.floating.fab.container.shape
  static const double fabIcon = 24; // md.comp.toolbar.floating.fab.icon.size
  static const double fabElevation = M3Elevation.level1; // md.comp.toolbar.floating.fab.container.elevation
  static const double dockedPadding = 16; // md.comp.toolbar.docked.container.leading-space and .trailing-space
  static const double dockedMinSpace = 4; // md.comp.toolbar.docked.container.min-spacing
  static const double dockedFixedSpace = 32; // md.comp.toolbar.docked.container.max-spacing [impl: AppBar.kt:2361]
}

/// The color style: standard keeps attention on the content, vibrant puts it on the controls (or
/// signals a temporary mode such as editing).
enum M3ToolbarColors { standard, vibrant }

class _Colors {
  const _Colors(this.container, this.content, this.selectedContainer, this.selectedContent, this.fabContainer, this.fabContent);

  final Color container;
  final Color content;
  final Color selectedContainer;
  final Color selectedContent;
  final Color fabContainer;
  final Color fabContent;

  // md.comp.toolbar.<style>.container.color, .icon.color, .selected.button.container.color,
  // .selected.icon.color; md.comp.toolbar.floating.fab.<style>.container.color and .icon.color.
  static _Colors of(ColorScheme s, M3ToolbarColors style) => switch (style) {
        M3ToolbarColors.standard => _Colors(s.surfaceContainer, s.onSurfaceVariant, s.secondaryContainer, s.onSecondaryContainer, s.secondaryContainer, s.onSecondaryContainer),
        M3ToolbarColors.vibrant => _Colors(s.primaryContainer, s.onPrimaryContainer, s.surfaceContainer, s.onSurface, s.tertiaryContainer, s.onTertiaryContainer),
      };
}

/// Gives the controls inside a toolbar the colors of its style: icon buttons and text buttons take
/// the toolbar's content color, and a selected (toggle) icon button takes the selected colors.
/// A control with its own `style` keeps it (use that for the one emphasized action).
Widget _themed(BuildContext context, _Colors c, Widget child) {
  final ThemeData t = Theme.of(context);
  Color? content(Set<WidgetState> s) => s.contains(WidgetState.selected) ? c.selectedContent : c.content;
  return Theme(
    data: t.copyWith(
      iconTheme: t.iconTheme.copyWith(color: c.content),
      iconButtonTheme: IconButtonThemeData(
        style: ButtonStyle(
          foregroundColor: WidgetStateProperty.resolveWith<Color?>(content),
          backgroundColor: WidgetStateProperty.resolveWith<Color?>((Set<WidgetState> s) => s.contains(WidgetState.selected) ? c.selectedContainer : null),
        ),
      ),
      textButtonTheme: TextButtonThemeData(style: ButtonStyle(foregroundColor: WidgetStateProperty.resolveWith<Color?>(content))),
    ),
    child: IconTheme.merge(data: IconThemeData(color: c.content), child: DefaultTextStyle.merge(style: TextStyle(color: c.content), child: child)),
  );
}

/// A toolbar that hovers over the content, as large as its [children] and fully rounded.
///
/// [children] are icon buttons (give each a `tooltip`: it is the accessible name), buttons or other
/// official controls, each at least 48 dp (the toolbar does not resize them: an official IconButton
/// already has a 48 dp target; a custom control must size itself). Square icon buttons clash with the round container, and a vertical
/// toolbar avoids wide ones. [floatingActionButton] is an optional FloatingActionButton shown beside
/// it (after it when horizontal, below it when vertical); emphasize one action at most: a button or
/// the FAB, not both. Keep the toolbar inside its window: margin 16 dp from the edge when horizontal,
/// 24 dp when vertical [md.comp.toolbar.floating.horizontal.container.external-space], put extra actions
/// in an overflow menu yourself.
class M3FloatingToolbar extends StatelessWidget {
  const M3FloatingToolbar({
    super.key,
    required this.children,
    this.vertical = false,
    this.colors = M3ToolbarColors.standard,
    this.floatingActionButton,
    this.semanticLabel,
  });

  final List<Widget> children;
  final bool vertical;
  final M3ToolbarColors colors;
  final Widget? floatingActionButton;

  /// An accessible name for the whole toolbar ("Text formatting"); optional.
  final String? semanticLabel;

  @override
  Widget build(BuildContext context) {
    final _Colors c = _Colors.of(Theme.of(context).colorScheme, colors);
    final Axis axis = vertical ? Axis.vertical : Axis.horizontal;
    final Widget bar = Material(
      color: c.container,
      elevation: _Spec.floatingElevation,
      shape: const StadiumBorder(), // md.comp.toolbar.floating.container.shape (full)
      child: ConstrainedBox(
        constraints: vertical ? const BoxConstraints(minWidth: _Spec.size) : const BoxConstraints(minHeight: _Spec.size),
        child: Padding(
          padding: vertical ? const EdgeInsets.symmetric(vertical: _Spec.floatingPadding) : const EdgeInsets.symmetric(horizontal: _Spec.floatingPadding),
          child: Flex(
            direction: axis,
            mainAxisSize: MainAxisSize.min,
            spacing: _Spec.floatingSpace,
            crossAxisAlignment: CrossAxisAlignment.center,
            children: children,
          ),
        ),
      ),
    );
    Widget result = _themed(context, c, bar);
    if (floatingActionButton != null) {
      final ThemeData t = Theme.of(context);
      final Widget fab = Theme(
        data: t.copyWith(
          floatingActionButtonTheme: FloatingActionButtonThemeData(
            backgroundColor: c.fabContainer,
            foregroundColor: c.fabContent,
            elevation: _Spec.fabElevation,
            focusElevation: _Spec.fabElevation,
            hoverElevation: _Spec.fabElevation,
            highlightElevation: _Spec.fabElevation,
            iconSize: _Spec.fabIcon,
            sizeConstraints: const BoxConstraints.tightFor(width: _Spec.fabSize, height: _Spec.fabSize),
            shape: const RoundedRectangleBorder(borderRadius: BorderRadius.all(Radius.circular(_Spec.fabCorner))),
          ),
        ),
        child: floatingActionButton!,
      );
      result = Flex(
        direction: axis,
        mainAxisSize: MainAxisSize.min,
        spacing: _Spec.fabSpace,
        crossAxisAlignment: CrossAxisAlignment.center,
        children: <Widget>[result, fab],
      );
    }
    return Semantics(container: true, explicitChildNodes: true, label: semanticLabel, child: result);
  }
}

/// A toolbar docked to the bottom of the window: full width, 64 dp tall, square corners, no elevation.
/// It replaces the bottom app bar: use it as `Scaffold.bottomNavigationBar`.
///
/// [children] are laid out between the 16 dp end paddings with the arrangement Compose's flexible
/// bottom app bar uses by default, space between [impl: AppBar.kt:2355], at least 4 dp apart. Pass
/// [spacing] (32 dp is Compose's fixed value, [M3DockedToolbar.fixedSpacing]) to center the items with
/// exactly that gap instead. Do not show it together with a navigation bar.
class M3DockedToolbar extends StatelessWidget {
  const M3DockedToolbar({
    super.key,
    required this.children,
    this.colors = M3ToolbarColors.standard,
    this.spacing,
    this.semanticLabel,
  });

  /// The gap of the fixed arrangement [impl: AppBar.kt:2361].
  static const double fixedSpacing = _Spec.dockedFixedSpace;

  final List<Widget> children;
  final M3ToolbarColors colors;
  final double? spacing;
  final String? semanticLabel;

  @override
  Widget build(BuildContext context) {
    final _Colors c = _Colors.of(Theme.of(context).colorScheme, colors);
    return Semantics(
      container: true,
      explicitChildNodes: true,
      label: semanticLabel,
      child: _themed(
        context,
        c,
        Material(
          color: c.container,
          shape: const RoundedRectangleBorder(), // md.comp.toolbar.docked.container.shape (none)
          child: SafeArea(
            top: false,
            child: SizedBox(
              width: double.infinity,
              height: _Spec.size,
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: _Spec.dockedPadding),
                child: Row(
                  mainAxisAlignment: spacing == null ? MainAxisAlignment.spaceBetween : MainAxisAlignment.center,
                  spacing: spacing ?? _Spec.dockedMinSpace,
                  children: children,
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
