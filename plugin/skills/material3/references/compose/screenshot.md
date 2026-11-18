# Compose screenshot step

`node "S/scripts/screenshot/index.mjs" <project> --platform compose [--states <file.json>]`

Needs the project's own Gradle wrapper, a JDK 17 or newer (`JAVA_HOME` or `java` on `PATH`) and the
Android SDK (`ANDROID_HOME`, `ANDROID_SDK_ROOT` or `local.properties`). The project does not have to
use Roborazzi.

- It copies the project to a temporary folder, runs its Gradle wrapper there with an init script of
  the skill (Robolectric, Roborazzi and the accessibility checks added to the app module's unit tests,
  plus a generated test), and deletes the copy. The project stays byte for byte as it was. The first
  run downloads those libraries (network); later runs use the cache. Shots and `capture.json` go to a
  new folder under the OS temp directory (or `--out`, outside the project).
- Shots at 412x915 dp (420 dpi), light and dark, of the launcher activity (the one in the manifest
  with MAIN and LAUNCHER; it must call `setContent`; the dark run is night mode, so the app follows
  `isSystemInDarkTheme()`). Named `<theme>-412x915-<nn>.png`: `01` is the top, `02` and on are the
  first vertical scrollable that can scroll, moved one viewport down each time. At most 4 frames per
  theme; when it is longer a warning says so. Animations run in reduced motion.
- `runtime.contrast` (text contrast estimated from the picture by the Accessibility Test Framework)
  and `runtime.targets` (clickable nodes below the minimum touch size) leave out disabled nodes; pass
  `capture.json` to verify.
- `ran: false` comes with `skippedReason`: no wrapper, no JDK or SDK, no Compose, no launcher
  activity, dependencies that could not be downloaded (offline), or a build or test failure (with the
  log tail). Report the reason; do not install anything for it.

## States

Plan check: every requested element must be visible in a main frame or in a state shot. Elements
behind an action (a dialog, an empty result, an open menu, a row far down the list) are reached with
`--states`, a JSON file outside the project. Each state launches the app fresh, runs its steps with a
settle after each, and shoots light and dark as `state-<name>-<theme>-412x915.png` (dialogs are in the picture, popup menus are not: see "Known limitations"). `capture.json` gets `states: [{ name, ok, shots, error? }]`; a step whose finder
matches nothing marks that state `ok: false` (and a warning): fix the steps or the screen, run again.
The main shots never depend on the states.

| Step | Form |
|---|---|
| Click | `{"click": {"text": "Remove all"}}`; the finder is `text` (exact), `tag` (`Modifier.testTag`) or `desc` (`contentDescription`) |
| Type | `{"enterText": {"into": {"hint": "Search"}, "text": "cactus"}}`; `into` is `hint` (the label), `text` (the current text) or `tag` |
| Scroll | `{"scrollTo": {"text": "Order total"}}` scrolls the first vertical scrollable until the element is on screen |
| Wait | `{"waitMs": 300}` |

Known limitations of the Robolectric render:
- A popup menu (`DropdownMenu`, the menu of an `ExposedDropdownMenuBox`, a sort menu) does not appear
  in the shot: Robolectric does not draw popup windows. Its state may report `ok` with the menu closed
  or missing. A `reached` row that is only a popup menu cannot be proved here: say so in the report
  instead of counting it as seen, and show the result of choosing an item (a sorted list) in a state
  of its own. Dialogs, bottom sheets and snackbars are drawn.
- `enterText` fails the state when the typed text is not in a text field afterwards (a field that
  ignores its change callback, or a custom field the action does not reach).

Any finder takes `"index": n` (zero based) when several nodes match. A finder looks at the dialog
first, then the screen. Prefer `text`; add `Modifier.testTag` in the screen only when no text is unique.

```json
{ "states": [
  { "name": "confirm-dialog", "steps": [ { "click": { "text": "Remove all" } } ] },
  { "name": "empty-search", "steps": [
    { "enterText": { "into": { "hint": "Search" }, "text": "cactus" } } ] }
] }
```
