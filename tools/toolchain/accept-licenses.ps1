# Run by the OWNER only. Shows the Android SDK licenses so you can read and accept them yourself.
# Usage: powershell -NoProfile -ExecutionPolicy Bypass -File tools\toolchain\accept-licenses.ps1
$ErrorActionPreference = 'Stop'
. (Join-Path $PSScriptRoot 'env.ps1')
$sdkmanager = Join-Path $env:ANDROID_HOME 'cmdline-tools\latest\bin\sdkmanager.bat'
& $sdkmanager "--sdk_root=$($env:ANDROID_HOME)" --licenses
exit $LASTEXITCODE
