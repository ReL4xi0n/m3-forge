# Local toolchain (Windows)

Contributor tooling for running the m3-forge verification harness locally. End users of the
`/material3` skill do not need any of this.

Everything is installed into one folder, `%USERPROFILE%\.m3-toolchain` (`root` in
[toolchain.json](toolchain.json)). The scripts never change user or machine environment variables,
never touch an existing system Java, and never accept Android SDK licenses on your behalf.

| Component | Version | Pinned by |
| --- | --- | --- |
| JDK | Temurin 21.0.13+9, Windows x64 | SHA-256 |
| Flutter | 3.50.0 stable (Dart 3.14.0) | SHA-256 |
| Android cmdline-tools | 22.0 | SHA-1 (from the official repository XML) |
| Android SDK packages | `platforms;android-36`, `build-tools;36.0.0` | installed by sdkmanager |

## Usage

```powershell
# 1. Download, verify and extract JDK, Flutter and cmdline-tools.
powershell -NoProfile -ExecutionPolicy Bypass -File tools\toolchain\setup.ps1 -Stage base

# 2. OWNER ONLY: read each Android SDK license and accept it yourself.
powershell -NoProfile -ExecutionPolicy Bypass -File tools\toolchain\accept-licenses.ps1

# 3. Install the Android SDK packages (refuses to run until step 2 has written licenses\).
powershell -NoProfile -ExecutionPolicy Bypass -File tools\toolchain\setup.ps1 -Stage packages

# 4. Verify versions.
powershell -NoProfile -ExecutionPolicy Bypass -File tools\toolchain\check.ps1
```

To use the tools in a shell, dot-source the environment. This only affects that PowerShell process:

```powershell
. tools\toolchain\env.ps1
```

`setup.ps1` can be re-run at any time. A component whose archive checksum and install marker
match is skipped. A corrupt or truncated archive is downloaded again.

## Why cmdline-tools is pinned to 22.0

cmdline-tools 23.0 (the current `latest`) replaces the Java `sdkmanager` with a wrapper around a new
tool, the Android CLI (`android`):

- `sdkmanager --licenses` prints "The --licenses option is no longer needed" and shows no licenses.
  `android sdk install` has no license prompt. The official documentation does not say whether it
  writes the `licenses\` files in the SDK root.
- The Android Gradle Plugin reads `<sdk>\licenses\` to decide whether licenses were accepted before
  it installs missing SDK components during a build. Without those files, the Compose harness could
  fail later with a license error.
- The Android CLI collects usage metrics by default. It downloads itself into `ANDROID_USER_HOME`
  on first run. A trial run of `android --help` spooled usage records there. The documented opt-outs
  are a per-invocation `--no-metrics` flag and a `%USERPROFILE%\.androidrc` file, which is outside
  the toolchain folder.

22.0 is the last release whose `sdkmanager` is still the classic Java tool. This was verified from
the official archives (SHA-1 from `repository2-3.xml`), not from the release notes, which do not
cover it:

- 23.0: `bin\sdkmanager.bat` intercepts `--licenses`, and `lib\sdkmanager-classpath.jar` is gone.
- 22.0: `bin\sdkmanager.bat` launches `com.android.sdklib.tool.sdkmanager.SdkManagerCli`, which
  contains `LicensesAction` and the interactive "Review licenses that have not been accepted" prompt.
  It prints a deprecation notice, but the license flow is unchanged.

Consequences:

- 22.0 still ships the Android CLI launcher `bin\android.exe`. `setup.ps1` deletes it after
  extraction (`removeAfterExtract` in `toolchain.json`), and `check.ps1` fails if it or
  `android-user\cli` exists.
- Never run `sdkmanager --update` and never install `cmdline-tools;latest`: either would bring
  back 23.0 or later.

### Does sdkmanager 22.0 send usage data?

No usage reporting was found. The `sdkmanager` class path contains no usage tracker or publisher
(`tools.analytics-tracker.jar` ships in `lib\` but is not on its class path). The only analytics
class it references is `CommonMetricsData`, which it uses to read the OS and JVM architecture so it
can pick the right archive. Its network access is the SDK repository XML and package downloads.

## Flutter shims

Flutter on Windows always writes its config files (`.flutter_tool_state`, `.flutter_settings`,
`.dart-tool`) to `%APPDATA%`. [shims\flutter.cmd](shims/flutter.cmd) and
[shims\dart.cmd](shims/dart.cmd) come first on the `PATH` that `env.ps1` sets. They point `APPDATA` at
`<root>\flutter-appdata` for that process tree only. Flutter analytics are also suppressed
(`FLUTTER_SUPPRESS_ANALYTICS`).

### Expected `flutter doctor` warnings

- "`flutter` on your path resolves to ...\shims\flutter.cmd": this is the shim. It is expected.
- "Android SDK file not found: adb": `platform-tools` is not installed. The harness renders Compose
  with Robolectric/Roborazzi and Flutter with `flutter test` goldens, so no device or emulator is used.
- "Visual Studio not installed": only needed for Windows desktop apps. The harness does not build them.

## Playwright (site extraction)

The scraper uses Playwright, which is pinned in `package.json` as a devDependency. Install it from a
shell where `env.ps1` is dot-sourced. That puts the npm cache and the browsers in the toolchain
folder (`npm-cache\`, `ms-playwright\`):

```powershell
. tools\toolchain\env.ps1
npm ci
npx playwright install chromium
```

The browser tests in `tools/extract/scrape/test/` run only where Chromium is installed this way.
They are skipped elsewhere, including in CI.

## Proving nothing outside the folder changed

```powershell
powershell -NoProfile -File tools\toolchain\snapshot-system.ps1 -Out out\snapshot-before.json
# ... install, use ...
powershell -NoProfile -File tools\toolchain\snapshot-system.ps1 -Out out\snapshot-after.json
powershell -NoProfile -File tools\toolchain\check.ps1 -Before out\snapshot-before.json -After out\snapshot-after.json
```

The comparison covers the persisted user and machine `PATH` and `JAVA_HOME`, the system `java -version`,
and the top-level entries of `%APPDATA%`, `%LOCALAPPDATA%` and `%USERPROFILE%`. The only expected new
entry is `.m3-toolchain`.

## Uninstall

Delete `%USERPROFILE%\.m3-toolchain`. The scripts set no persistent environment variables or `PATH`
entries, and the snapshot comparison above shows no other new entries.
