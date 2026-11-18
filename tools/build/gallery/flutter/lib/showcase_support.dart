// Caption helper for the gap-component specimens (maintainer gallery, not shipped).
import 'package:flutter/material.dart';

/// A caption above [child].
Widget labelled(String text, Widget child) => Padding(
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 8),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: <Widget>[
        Builder(builder: (BuildContext context) => Text(text, style: Theme.of(context).textTheme.labelMedium)),
        const SizedBox(height: 8),
        child,
      ]),
    );
