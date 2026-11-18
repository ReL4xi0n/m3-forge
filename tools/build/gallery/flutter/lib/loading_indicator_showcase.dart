// Specimens of M3LoadingIndicator for the goldens and tests (maintainer gallery, not shipped).
import 'package:flutter/material.dart';

import 'm3/expressive/loading_indicator.dart';
import 'showcase_support.dart';

// Elapsed milliseconds shown, longest first; each slot is mounted so it has run exactly that long.
const List<int> loadingFrames = <int>[2600, 1400, 800, 400, 150, 0];

Widget loadingRows(List<bool> shown) => Column(crossAxisAlignment: CrossAxisAlignment.start, children: <Widget>[
      for (final bool contained in <bool>[false, true])
        labelled(
          '${contained ? 'Contained' : 'Default'}: after 2600, 1400, 800, 400, 150, 0 ms',
          Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: <Widget>[
            for (int i = 0; i < loadingFrames.length; i++)
              SizedBox(width: 48, height: 48, child: shown[i] ? M3LoadingIndicator(contained: contained, semanticLabel: 'Loading') : null),
          ]),
        ),
    ]);
