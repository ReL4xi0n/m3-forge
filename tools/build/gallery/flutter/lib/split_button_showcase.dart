// Specimens of M3SplitButton for the goldens and tests (maintainer gallery, not shipped).
import 'package:flutter/material.dart';

import 'm3/expressive/split_button.dart';
import 'm3/m3_symbols.dart';
import 'showcase_support.dart';

const Key openSplitKey = ValueKey<String>('open');

List<Widget> splitMenu({void Function(String)? onPressed}) => <Widget>[
      for (final String name in <String>['Schedule send', 'Send later', 'Save draft']) MenuItemButton(onPressed: () => onPressed?.call(name), child: Text(name)),
    ];

Widget splitButton({
  Key? key,
  M3SplitButtonSize size = M3SplitButtonSize.small,
  M3SplitButtonStyle style = M3SplitButtonStyle.filled,
  String label = 'Send',
  bool icon = true,
  void Function(String)? onPressed,
}) =>
    M3SplitButton(
      key: key,
      size: size,
      style: style,
      icon: icon ? const Icon(M3Symbols.send) : null,
      onPressed: () => onPressed?.call(label),
      menuIcon: const Icon(M3Symbols.keyboardArrowDown),
      menuLabel: 'More send options',
      menuChildren: splitMenu(onPressed: onPressed),
      child: Text(label),
    );

Widget splitSpecimens() => Column(crossAxisAlignment: CrossAxisAlignment.start, children: <Widget>[
      labelled(
        'Filled, tonal, elevated, outlined',
        Wrap(spacing: 16, runSpacing: 8, children: <Widget>[
          for (final M3SplitButtonStyle s in M3SplitButtonStyle.values) splitButton(style: s),
        ]),
      ),
      labelled(
        'Extra small, small, medium (with icon); large, extra large (label only)',
        Column(crossAxisAlignment: CrossAxisAlignment.start, children: <Widget>[
          splitButton(size: M3SplitButtonSize.extraSmall, style: M3SplitButtonStyle.tonal),
          const SizedBox(height: 8),
          splitButton(size: M3SplitButtonSize.small, style: M3SplitButtonStyle.tonal),
          const SizedBox(height: 8),
          splitButton(size: M3SplitButtonSize.medium, style: M3SplitButtonStyle.tonal),
          const SizedBox(height: 8),
          splitButton(size: M3SplitButtonSize.large, style: M3SplitButtonStyle.tonal, icon: false),
          const SizedBox(height: 8),
          splitButton(size: M3SplitButtonSize.extraLarge, style: M3SplitButtonStyle.tonal, icon: false),
        ]),
      ),
      labelled('Menu open', splitButton(key: openSplitKey)),
    ]);
