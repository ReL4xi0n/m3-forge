# m3-forge local toolchain setup (Windows PowerShell 5.1).
#   setup.ps1 -Stage base       download + verify + extract JDK 21, Flutter, Android cmdline-tools
#   setup.ps1 -Stage packages   install Android SDK packages (requires licenses accepted by the owner)
# Everything goes into the folder named by toolchain.json "root". Environment changes are process-only.
# This script NEVER accepts Android SDK licenses.
param(
  [Parameter(Mandatory = $true)][ValidateSet('base', 'packages')][string]$Stage
)
$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'

$cfg = Get-Content -Raw (Join-Path $PSScriptRoot 'toolchain.json') | ConvertFrom-Json
. (Join-Path $PSScriptRoot 'env.ps1')
$root = $env:M3_TOOLCHAIN
$downloads = Join-Path $root 'downloads'
New-Item -ItemType Directory -Force -Path $downloads | Out-Null

function Test-Checksum([string]$File, $Checksum) {
  if (-not (Test-Path -LiteralPath $File)) { return $false }
  $h = (Get-FileHash -LiteralPath $File -Algorithm $Checksum.algo).Hash
  return $h.ToLowerInvariant() -eq $Checksum.value.ToLowerInvariant()
}

function Install-Component([string]$Name, $C) {
  $fileName = [Uri]::UnescapeDataString(($C.url -split '/')[-1])
  $archive = Join-Path $downloads $fileName
  $target = Join-Path $root ($C.dir -replace '/', '\')
  $marker = Join-Path $target '.m3-installed'
  $remove = @($C.removeAfterExtract | Where-Object { $_ })
  $stamp = "$($C.url)|$($C.checksum.algo)|$($C.checksum.value)"
  if ($remove.Count) { $stamp += "|remove=$($remove -join ',')" }

  $archiveOk = Test-Checksum $archive $C.checksum
  if ((Test-Path -LiteralPath $marker) -and $archiveOk -and ((Get-Content -Raw -LiteralPath $marker).Trim() -eq $stamp)) {
    Write-Host "$Name : ok (already installed, checksum verified)"
    return
  }
  if (-not $archiveOk) {
    if (Test-Path -LiteralPath $archive) { Write-Host "$Name : checksum mismatch -> re-downloading" }
    else { Write-Host "$Name : downloading $fileName" }
    if (Test-Path -LiteralPath $archive) { Remove-Item -LiteralPath $archive -Force }
    & curl.exe -fL --retry 3 --silent --show-error -o $archive $C.url
    if ($LASTEXITCODE -ne 0) { throw "$Name : download failed (curl exit $LASTEXITCODE)" }
    if (-not (Test-Checksum $archive $C.checksum)) { throw "$Name : checksum mismatch after download; refusing to install" }
  }

  if (Test-Path -LiteralPath $target) { Remove-Item -LiteralPath $target -Recurse -Force }
  $tmp = Join-Path $root ("tmp-extract-" + $Name)
  if (Test-Path -LiteralPath $tmp) { Remove-Item -LiteralPath $tmp -Recurse -Force }
  New-Item -ItemType Directory -Force -Path $tmp | Out-Null
  Write-Host "$Name : extracting"
  & tar.exe -xf $archive -C $tmp
  if ($LASTEXITCODE -ne 0) { throw "$Name : extraction failed (tar exit $LASTEXITCODE)" }
  $top = @(Get-ChildItem -LiteralPath $tmp)
  if ($top.Count -ne 1 -or -not $top[0].PSIsContainer) { throw "$Name : expected one top-level folder in archive" }
  New-Item -ItemType Directory -Force -Path (Split-Path -Parent $target) | Out-Null
  Move-Item -LiteralPath $top[0].FullName -Destination $target
  Remove-Item -LiteralPath $tmp -Recurse -Force
  # removeAfterExtract: files we deliberately do not ship (cmdline-tools: the Android CLI launcher,
  # which downloads a separate tool that collects usage metrics by default).
  foreach ($rel in $remove) {
    $p = Join-Path $target ($rel -replace '/', '\')
    if (Test-Path -LiteralPath $p) { Remove-Item -LiteralPath $p -Force; Write-Host "$Name : removed $rel" }
  }
  Set-Content -LiteralPath $marker -Value $stamp -Encoding ASCII
  Write-Host "$Name : ok (installed $($C.version))"
}

if ($Stage -eq 'base') {
  foreach ($name in @('jdk', 'flutter', 'cmdlinetools')) {
    Install-Component $name $cfg.components.$name
  }
  Write-Host ''
  Write-Host 'STOP: owner must run tools\toolchain\accept-licenses.ps1, then setup.ps1 -Stage packages'
  exit 0
}

if ($Stage -eq 'packages') {
  $license = Join-Path $env:ANDROID_HOME 'licenses\android-sdk-license'
  if (-not (Test-Path -LiteralPath $license)) {
    Write-Host 'Android SDK licenses not accepted yet: run tools\toolchain\accept-licenses.ps1'
    exit 3
  }
  $sdkmanager = Join-Path $env:ANDROID_HOME 'cmdline-tools\latest\bin\sdkmanager.bat'
  $pkgs = @($cfg.androidPackages)
  & $sdkmanager "--sdk_root=$($env:ANDROID_HOME)" --install @pkgs
  if ($LASTEXITCODE -ne 0) { throw "sdkmanager --install failed (exit $LASTEXITCODE)" }
  Write-Host "packages : ok ($($pkgs -join ', '))"
  exit 0
}
