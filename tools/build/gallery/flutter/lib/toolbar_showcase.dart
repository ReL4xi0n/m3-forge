// Specimens of M3FloatingToolbar and M3DockedToolbar for the goldens and tests (maintainer gallery, not shipped).
import 'package:flutter/material.dart';

import 'm3/expressive/toolbar.dart';
import 'm3/m3_symbols.dart';
import 'showcase_support.dart';

/// Four formatting actions; the second one is toggled on.
List<Widget> toolbarActions({void Function(String)? onPressed}) => <Widget>[
      IconButton(tooltip: 'Bold', icon: const Icon(M3Symbols.formatBold), onPressed: () => onPressed?.call('Bold')),
      IconButton(tooltip: 'Italic', isSelected: true, icon: const Icon(M3Symbols.formatItalic), onPressed: () => onPressed?.call('Italic')),
      IconButton(tooltip: 'Underline', icon: const Icon(M3Symbols.formatUnderlined), onPressed: () => onPressed?.call('Underline')),
      IconButton(tooltip: 'Link', icon: const Icon(M3Symbols.link), onPressed: () => onPressed?.call('Link')),
    ];

Widget toolbarFab({void Function(String)? onPressed}) => FloatingActionButton(tooltip: 'Edit', onPressed: () => onPressed?.call('Edit'), child: const Icon(M3Symbols.edit));

Widget _caption(String text) => labelled(text, const SizedBox.shrink());

Widget toolbarSpecimens() => Column(crossAxisAlignment: CrossAxisAlignment.start, children: <Widget>[
      labelled('Floating, standard, with FAB', M3FloatingToolbar(semanticLabel: 'Text formatting', floatingActionButton: toolbarFab(), children: toolbarActions())),
      labelled('Floating, vibrant', M3FloatingToolbar(colors: M3ToolbarColors.vibrant, children: toolbarActions())),
      labelled(
        'Floating, vertical: standard, vibrant with FAB',
        Row(crossAxisAlignment: CrossAxisAlignment.start, children: <Widget>[
          M3FloatingToolbar(vertical: true, children: toolbarActions()),
          const SizedBox(width: 24),
          M3FloatingToolbar(vertical: true, colors: M3ToolbarColors.vibrant, floatingActionButton: toolbarFab(), children: toolbarActions()),
        ]),
      ),
      _caption('Docked, standard (space between) and vibrant (fixed 32 dp)'),
      M3DockedToolbar(children: toolbarActions()),
      const SizedBox(height: 8),
      M3DockedToolbar(colors: M3ToolbarColors.vibrant, spacing: M3DockedToolbar.fixedSpacing, children: toolbarActions()),
    ]);
