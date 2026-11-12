# Verifies the toolchain, or compares two system snapshots.
#   check.ps1                                         tool versions (process-scoped env)
#   check.ps1 -Before out\snapshot-before.json -After out\snapshot-after.json
param([string]$Before, [string]$After)
$ErrorActionPreference = 'Stop'

if ($Before -or $After) {
  if (-not ($Before -and $After)) { throw "pass both -Before and -After" }
  $a = Get-Content -Raw -LiteralPath $Before | ConvertFrom-Json
  $b = Get-Content -Raw -LiteralPath $After | ConvertFrom-Json
  $failed = $false
  foreach ($f in @('userPath', 'machinePath', 'userJavaHome', 'machineJavaHome', 'systemJava')) {
    # ", sharing" (JVM class-data sharing) varies between runs of the same java; it is not a system change.
    $va = "$($a.$f)" -replace ', sharing\)', ')'
    $vb = "$($b.$f)" -replace ', sharing\)', ')'
    if ($va -ceq $vb) { Write-Host "IDENTICAL  $f" }
    else { Write-Host "CHANGED    $f"; $failed = $true }
  }
  Write-Host ''
  Write-Host "system java: $(($b.systemJava -split "`n")[0])"
  foreach ($loc in @('APPDATA', 'LOCALAPPDATA', 'USERPROFILE')) {
    $new = @($b.entries.$loc | Where-Object { $a.entries.$loc -notcontains $_ })
    if ($new.Count) { Write-Host "NEW in %$loc%: $($new -join ', ')" }
    else { Write-Host "NEW in %$loc%: (none)" }
  }
  if ($failed) { exit 1 } else { exit 0 }
}

. (Join-Path $PSScriptRoot 'env.ps1')
$ok = $true
$java = (& cmd.exe /d /c "java -version 2>&1") -join "`n"
Write-Host "--- java -version`n$java"
if ($java -notmatch '"21\.' -or $java -notmatch '64-Bit') { Write-Host 'FAIL: expected JDK 21 64-Bit'; $ok = $false }
$cfg = Get-Content -Raw (Join-Path $PSScriptRoot 'toolchain.json') | ConvertFrom-Json
$flutterWant = ($cfg.components.flutter.version -split ' ')[0]
$flutter = (& cmd.exe /d /c "flutter --version 2>&1") -join "`n"
Write-Host "--- flutter --version`n$flutter"
if ($flutter -notmatch ('Flutter ' + [regex]::Escape($flutterWant))) { Write-Host "FAIL: expected Flutter $flutterWant"; $ok = $false }
$sdk = (& cmd.exe /d /c "sdkmanager --version 2>&1") -join "`n"
Write-Host "--- sdkmanager --version`n$sdk"
if ($LASTEXITCODE -ne 0) { Write-Host 'FAIL: sdkmanager'; $ok = $false }
# 22.0 prints a deprecation notice but is still the classic Java sdkmanager (interactive --licenses).
$sdkWant = ($cfg.components.cmdlinetools.version -split ' ')[0]
if (($sdk -split "`n" | ForEach-Object { $_.Trim() }) -notcontains $sdkWant) { Write-Host "FAIL: expected sdkmanager $sdkWant"; $ok = $false }
if (-not (Test-Path -LiteralPath (Join-Path $env:ANDROID_HOME 'cmdline-tools\latest\lib\sdkmanager-classpath.jar'))) { Write-Host 'FAIL: classic Java sdkmanager missing (cmdline-tools 23+ is the Android CLI wrapper)'; $ok = $false }
if (Test-Path -LiteralPath (Join-Path $env:ANDROID_HOME 'cmdline-tools\latest\bin\android.exe')) { Write-Host 'FAIL: Android CLI launcher present (bin\android.exe)'; $ok = $false }
if (Test-Path -LiteralPath (Join-Path $env:ANDROID_USER_HOME 'cli')) { Write-Host 'FAIL: Android CLI data present (android-user\cli)'; $ok = $false }
Write-Host '--- flutter doctor'
& cmd.exe /d /c "flutter doctor 2>&1"
if ($ok) { Write-Host 'check: ok'; exit 0 } else { Write-Host 'check: FAILED'; exit 1 }
