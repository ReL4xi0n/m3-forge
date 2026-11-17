# Automated items v2

**Status.** Owner decision of 2026-11-17, written before any v2 score was computed. It replaces the
"Automated items" table of rubric v1 (`evals/rubric.md`, frozen at adf8854) and will be part of
rubric v2. Rubric v1 and its frozen hash are not changed. The baseline is re-scored with v2 from its
recorded code and runtime results; it is not run again. Phase 4 uses the same v2 tools.

## What changed from v1

1. **Icon source is its own item.** The rule stays: the target is Material Symbols, and legacy icon
   sets (Flutter `Icons.*`, Compose `Icons.*`), other icon libraries and emoji in UI text are
   violations. In v1 they counted toward "Anti-patterns", so one rule (a Flutter app using `Icons.*`)
   set that item to 0 by itself. In v2 "Anti-patterns" counts shadows, gradients and foreign styling
   only, and "Icon source" is scored on its own.
2. **Flutter touch targets have the same scope as web and Compose.** The Flutter harness checks every
   enabled node that can be tapped, long-pressed or focused, below 48x48 logical px. v1 used
   flutter_test's `androidTapTargetGuideline`, which looks at tap and long-press nodes only. Kept from
   Flutter's own check: nodes cut by a scrollable or the screen edge are skipped (their clipped rect
   would read too small), and links in running text are left out, as the web harness leaves out
   inline links in a paragraph. Disabled nodes are left out on every platform.
3. **The Flutter harness loads the app's own fonts** (found by PC-1, `evals/discrimination.md`). v1
   loaded only Roboto, Roboto Flex and Material Symbols, so `Icons.*` glyphs and fonts the app
   declares were drawn as empty boxes, unlike on a device. v2 loads every family in the
   `FontManifest.json` that `flutter test` builds (MaterialIcons with `uses-material-design`, app and
   package fonts) before the toolchain fonts. This changes the screenshots the judge sees, not the
   automated counts.

The static checks of the verify script are unchanged.

## Items

Rates are per 100 non-blank lines of UI source.

| Item | Counts | 3 | 2 | 1 | 0 |
|---|---|---|---|---|---|
| Token fidelity | hardcoded color, off-token type, off-token radius, per 100 UI lines | 0 | more than 0, up to 1 | more than 1, up to 5 | more than 5, or no buildable output |
| Contrast and targets | runtime contrast and touch-target findings | 0 | 1–2 | 3–6 | 7 or more, or no buildable output |
| Anti-patterns | shadow/gradient and foreign-styling findings | 0 | 1 | 2–4 | 5 or more, or no buildable output |
| Icon source | icon-source findings (legacy icon sets, other icon libraries, emoji) | 0 | 1 | 2–4 | 5 or more, or no buildable output |

Implementation: `evals/tools/automated.mjs` (`automatedScores(verify, buildOk, 'v2')`).
