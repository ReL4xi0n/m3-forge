// Specimens of M3FabMenu for the goldens and tests (maintainer gallery, not shipped).
import 'package:flutter/material.dart';

import 'm3/expressive/fab_menu.dart';
import 'm3/m3_symbols.dart';
import 'showcase_support.dart';

List<M3FabMenuItem> fabMenuItems({void Function(String)? onPressed}) => <M3FabMenuItem>[
      M3FabMenuItem(icon: const Icon(M3Symbols.mail), label: 'Mail', onPressed: () => onPressed?.call('Mail')),
      M3FabMenuItem(icon: const Icon(M3Symbols.share), label: 'Share', onPressed: () => onPressed?.call('Share')),
      M3FabMenuItem(icon: const Icon(M3Symbols.edit), label: 'Edit', onPressed: () => onPressed?.call('Edit')),
    ];

Widget fabMenu({M3FabMenuColors colors = M3FabMenuColors.primary, M3FabMenuFabSize size = M3FabMenuFabSize.baseline, bool open = false, Key? key, void Function(String)? onPressed}) => M3FabMenu(
      key: key,
      colors: colors,
      fabSize: size,
      initiallyExpanded: open,
      icon: const Icon(M3Symbols.add),
      closeIcon: const Icon(M3Symbols.close),
      items: fabMenuItems(onPressed: onPressed),
    );

Widget fabMenuSpecimens() => Column(crossAxisAlignment: CrossAxisAlignment.start, children: <Widget>[
      labelled(
        'Open: primary, secondary and tertiary sets',
        Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, crossAxisAlignment: CrossAxisAlignment.end, children: <Widget>[
          fabMenu(open: true),
          fabMenu(open: true, colors: M3FabMenuColors.secondary),
          fabMenu(open: true, colors: M3FabMenuColors.tertiary),
        ]),
      ),
      labelled(
        'Closed: baseline, medium and large FAB',
        Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, crossAxisAlignment: CrossAxisAlignment.end, children: <Widget>[
          fabMenu(),
          fabMenu(colors: M3FabMenuColors.secondary, size: M3FabMenuFabSize.medium),
          fabMenu(colors: M3FabMenuColors.tertiary, size: M3FabMenuFabSize.large),
        ]),
      ),
    ]);
