# Compose versions

`detect` reports `composeMaterial3` (the resolved version or `null`), `belowExpressive` and
`composeBom`.

| `belowExpressive` | Do |
|---|---|
| `false` | material3 is 1.5 or newer: use the Expressive components (`expressive.md`) and `--parts theme` |
| `true` | Say in the report: "Expressive needs material3 1.5". Offer the upgrade (below). Until the user agrees, build with the classic APIs and `--parts theme-below-1.5` |
| `null` | The version comes from a BOM or a variable. Read the resolved version from `./gradlew :<module>:dependencies --configuration debugRuntimeClasspath` (when the SDK and JDK exist) or ask |

## The upgrade offer

- Ask first, in one line: which version the project is on, that 1.5 brings the Expressive
  components, shapes and motion, and which Gradle files change (the version catalog or
  `build.gradle.kts`; a BOM project changes the BOM version instead). Never edit a Gradle or
  dependency file without the user's yes, and never raise only one pin of a set that is pinned
  together (`setup.md`).
- Yes: change the version (the new pin is `compose.material3` in `S/versions.json`), then
  `--parts theme`, then build. The upgrade can need a newer AGP, Kotlin or `compileSdk`; report what
  the build says instead of guessing.
- No, or no answer: stay classic and say so in the report.

## Classic fallback

| Instead of | Use below 1.5 |
|---|---|
| `MaterialExpressiveTheme`, `MotionScheme.expressive()` | `MaterialTheme` (what `theme-below-1.5` installs) |
| `LoadingIndicator` | `CircularProgressIndicator` |
| `ButtonGroup`, `ToggleButton` | `SingleChoiceSegmentedButtonRow`, `FilledIconToggleButton` |
| `SplitButtonLayout` | `Button` plus `DropdownMenu` |
| `FloatingActionButtonMenu` | One `FloatingActionButton` that opens a `ModalBottomSheet` |
| `HorizontalFloatingToolbar` | `BottomAppBar` |
| `ShortNavigationBar`, `WideNavigationRail` | `NavigationBar`, `NavigationRail` |
| `MediumFlexibleTopAppBar`, `LargeFlexibleTopAppBar` | `MediumTopAppBar`, `LargeTopAppBar` |
| `MaterialShapes` | Shape-scale corners from `M3Shapes` |

An Expressive color scheme on a below-1.5 library works for color and type, but the Expressive shape
steps and motion are missing; the report says so.
