---
name: material3
description: Build a Material Design 3 (Expressive by default) UI for web, Flutter or Jetpack Compose from a request. An unofficial skill for Material Design 3.
argument-hint: "<UI request>"
disable-model-invocation: true
---

# Material 3 UI builder

Request: $ARGUMENTS

Build the requested UI so that it looks like a first-party Material 3 product: M3 Expressive unless
the request asks for classic Material 3. Everything below is the order of work. `S` stands for
`${CLAUDE_SKILL_DIR}`; run every script as `node "S/scripts/<name>/index.mjs" ...`.

## 1. Read the request

- Note the platform if named, a classic-M3 wish, a brand or seed color, dark-mode or density
  wishes, a requested icon style (Rounded, Sharp) and the language of the UI text. (W)

## 2. Detect the project

- Run `detect` with the project folder (and the platform if the request names one). It prints
  JSON: `platform`, `framework`, `flutterLibrary`, `composeMaterial3`, `belowExpressive`,
  `composeBom`, `themeFiles`, `empty`, and `tools.<name>.available`. (W)
- An explicit platform in the request wins over detection. An empty or non-matching folder is
  scaffolded as `references/<platform>/setup.md` says. (W)
- Compose: `belowExpressive: true` means material3 is older than 1.5. Say that Expressive needs
  1.5 and offer the upgrade; if the user declines, use classic APIs. `null` means the version is
  unknown (BOM or variable): check the resolved version or ask. Never edit Gradle or dependency
  files without consent. (W)

## 3. Load references

- Always read `references/core/color.md`, `typography.md`, `shape.md`, `layout.md`, `icons.md`,
  `content.md` and `components.md`. (W)
- Then every file in `references/<platform>/`, and from `references/core/` only the other notes
  the request needs (`elevation.md`, `motion.md`, `states.md`, `accessibility.md`,
  `expressive.md`, `anti-patterns.md`). (W)

## 4. Theme, fonts and icons

- Color: run `color` with `--seed`, `--platform` and `--out` (the platform reference names the
  file; it never overwrites a user file, exit 3). A brand color in the request is the seed. With no
  color in the request, pick a seed that
  fits the subject and say which; use the baseline seed `#6750A4` only for neutral requests.
  Variant stays tonal spot unless the request names another variant. Status and chart colors use
  roles, or `--custom name=#hex` for harmonized extra roles. (F2, F8)
- Copy the theme, token and font assets with `install-assets` (`--parts` per the platform
  reference). It never overwrites a user file: on exit 3, read the listed conflicts and merge by
  hand. A project that already has a role-based M3 theme (`themeFiles`) is extended, not
  replaced. (F1, F3, F4, F5)
- Icons: run `icons` with every icon name the UI uses (`--names a,b,c`). Exit 4 lists unknown
  names with suggestions: pick a listed name. Only the icons the UI uses are copied. (F7)

## 5. Build the UI

Hard rules. `verify` checks these (contrast and touch targets only with the step 7 capture;
judgment calls are not machine-checked).

- Colors only through color roles of the generated scheme; no hex, rgb, hsl or named colors in UI
  code. (F2)
- Text only through type-scale roles (emphasized roles for Expressive emphasis); no literal font
  sizes or weights. (F3, F10)
- Corners only through the shape scale; no literal radii. (F4)
- Padding, gaps and margins only through the spacing scale (`space*` names). (F1)
- No gradients. Depth comes from surface-container roles; shadows only through elevation tokens
  on components that carry elevation. (F5)
- Every interactive element has a target of at least 48 dp: use the official components (Flutter,
  Compose) or the shipped component CSS (web); give custom clickables the minimum size. (F6)
- Icons only from `icons` output. Never draw an icon, import another icon set, use the legacy
  `Icons.*`, or put an emoji in place of an icon. (F7)
- Text pairs only on-role over its role (`on-surface` on `surface`, and so on). (F8)
- Every icon-only button has an accessible label: `aria-label` (web), `tooltip` or
  `semanticLabel` (Flutter), `contentDescription` (Compose). (W)
- Content follows `references/core/content.md`: an invented but credible product, people, numbers
  and addresses; imagery as shape containers, avatars as initials. No lorem ipsum, `example.com`,
  "Acme", "John Doe" or "Item 1", and no image URLs. (F11)
- No Google brand: no "Google", no Google product names or logos, no copy of a Google product.
  (F12)
- Judgment calls (hierarchy, rhythm, density, component choice, Expressive character) follow
  `CHECKLIST.md`. (F9, F10)

## 6. Verify

- Run `verify` with the project folder and platform (add `capture.json` from step 7 when it
  exists). It writes `verify.json` to a temporary folder (path printed), never into the project;
  `--out <dir>` picks another folder. Fix every error, and also every `off-grid-spacing` and `asset-unused` warning. Repeat
  until it reports none. (F1, F2, F3, F4, F5, F6, F7, F8, F11, F12)

## 7. Look

- Run `screenshot` with the project folder and `--platform` (`--url <address>` for a running dev
  server where the platform reference says so). It renders mobile and desktop (web) or phone
  (Flutter, Compose), light and dark, into a temporary folder, never the project, and prints the PNG
  paths, the `contrast` and `targets` findings and `capture` (the `capture.json` for step 6).
  `ran: false` comes with `skippedReason` (no Playwright, browser or SDK): report it. Read every
  image, critique it against `CHECKLIST.md`, fix, then run `screenshot` and `verify` again.
  (F6, F8, F9, F10)

## 8. Report

- End with this report, in the language the user wrote in: (W)
  1. What was built, and where (files).
  2. Platform, style (M3 Expressive or classic) and, on Compose, the material3 version.
  3. Color source: the exact seed and variant, or the precomputed seed used instead of the
     requested one, and why.
  4. Checks that ran, with their result.
  5. Checks that were skipped, each with its reason (for example "Flutter SDK not found:
     screenshots skipped").
  6. Anything the user must run later (package install, `flutter create .`, an upgrade).

## When a tool is missing

| Missing | Do instead | Say in the report |
|---|---|---|
| Node | Detect by reading `pubspec.yaml`, Gradle files and `package.json`. Color: pick the scheme from `tokens/precomputed-schemes.json` by its `nearest` rule. Icons: the steps in the platform's `icons.md` without Node. Review the code against `CHECKLIST.md` by reading it. | Verify, icon subsetting and screenshots skipped; precomputed seed used; install Node for an exact scheme |
| Platform SDK | Write the code anyway. | Build and screenshots skipped, with the command to run later |
| Network | Nothing: fonts and icons are bundled. A requested Rounded or Sharp style falls back to Outlined. | "Rounded icons requested but could not be downloaded (offline?); used bundled Outlined. Re-run with network access to switch." |

(W, F7)
