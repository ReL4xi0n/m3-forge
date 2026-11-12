# Dot-source this file:  . tools\toolchain\env.ps1
# Sets m3-forge toolchain variables for the CURRENT PROCESS ONLY.
# It never writes user or machine environment variables and never touches the system Java.

$m3Cfg = Get-Content -Raw (Join-Path $PSScriptRoot 'toolchain.json') | ConvertFrom-Json
$m3Root = [Environment]::ExpandEnvironmentVariables($m3Cfg.root)

$env:M3_TOOLCHAIN = $m3Root
$env:JAVA_HOME = Join-Path $m3Root 'jdk-21'
$env:ANDROID_HOME = Join-Path $m3Root 'android-sdk'
$env:ANDROID_SDK_ROOT = $env:ANDROID_HOME
$env:ANDROID_USER_HOME = Join-Path $m3Root 'android-user'
$env:GRADLE_USER_HOME = Join-Path $m3Root 'gradle-home'
$env:PUB_CACHE = Join-Path $m3Root 'pub-cache'
$env:PLAYWRIGHT_BROWSERS_PATH = Join-Path $m3Root 'ms-playwright'
$env:FLUTTER_SUPPRESS_ANALYTICS = 'true'

$m3Prepend = @(
  # shims\flutter.cmd and shims\dart.cmd keep Flutter's %APPDATA% config inside the toolchain folder.
  (Join-Path $PSScriptRoot 'shims'),
  (Join-Path $env:JAVA_HOME 'bin'),
  (Join-Path $m3Root 'flutter\bin'),
  (Join-Path $env:ANDROID_HOME 'cmdline-tools\latest\bin')
)
$m3Rest = $env:Path -split ';' | Where-Object { $_ -and ($m3Prepend -notcontains $_) }
$env:Path = ($m3Prepend + $m3Rest) -join ';'
Remove-Variable m3Cfg, m3Prepend, m3Rest
