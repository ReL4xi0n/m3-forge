// Specimens of M3ButtonGroup for the goldens and tests (maintainer gallery, not shipped).
import 'package:flutter/material.dart';

import 'm3/expressive/button_group.dart';
import 'showcase_support.dart';

const List<String> groupNames = <String>['Day', 'Week', 'Month'];

List<Widget> groupButtons(Set<int> on) => <Widget>[
      for (int i = 0; i < groupNames.length; i++)
        on.contains(i) ? FilledButton(onPressed: () {}, child: Text(groupNames[i])) : FilledButton.tonal(onPressed: () {}, child: Text(groupNames[i])),
    ];

Widget groupSpecimens() => Column(crossAxisAlignment: CrossAxisAlignment.start, children: <Widget>[
      labelled('Standard, rest', M3ButtonGroup(children: groupButtons(<int>{}))),
      labelled('Standard, middle button pressed', M3ButtonGroup(key: const ValueKey<String>('std'), children: groupButtons(<int>{}))),
      labelled('Connected, rest', M3ButtonGroup(connected: true, children: groupButtons(<int>{}))),
      labelled('Connected, Day selected', M3ButtonGroup(connected: true, selected: const <int>{0}, children: groupButtons(<int>{0}))),
      labelled('Connected, middle button pressed', M3ButtonGroup(key: const ValueKey<String>('con'), connected: true, children: groupButtons(<int>{}))),
    ]);
