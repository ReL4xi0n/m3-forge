// Uses the harness's own font loader, so the smoke also exercises it.
import 'dart:async';

import '../../flutter_test_config.dart' as m3;

Future<void> testExecutable(FutureOr<void> Function() testMain) => m3.testExecutable(testMain);
