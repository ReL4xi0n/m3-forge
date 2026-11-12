# Records system state that the toolchain must NOT change (and top-level folders it might add).
# Usage: powershell -NoProfile -File tools\toolchain\snapshot-system.ps1 -Out out\snapshot-before.json
param([Parameter(Mandatory = $true)][string]$Out)
$ErrorActionPreference = 'Stop'

$userPath = [Environment]::GetEnvironmentVariable('Path', 'User')
$machinePath = [Environment]::GetEnvironmentVariable('Path', 'Machine')
# Run java with ONLY the persisted machine+user PATH, so this process's environment cannot leak in.
$sysPath = (@($machinePath, $userPath) | Where-Object { $_ }) -join ';'
$javaVersion = (& cmd.exe /d /c "set `"PATH=$sysPath`" && java -version 2>&1") -join "`n"

# .NET enumeration returns plain strings; Get-ChildItem -Name strings carry PS provider notes that
# Windows PowerShell 5.1 ConvertTo-Json serializes as objects.
function Get-Names([string]$Dir) {
  [string[]]$names = [IO.Directory]::EnumerateFileSystemEntries($Dir) | ForEach-Object { [IO.Path]::GetFileName($_) }
  [Array]::Sort($names, [StringComparer]::OrdinalIgnoreCase)
  return ,$names
}

$snapshot = [ordered]@{
  takenAt         = (Get-Date).ToString('o')
  userPath        = $userPath
  machinePath     = $machinePath
  userJavaHome    = [Environment]::GetEnvironmentVariable('JAVA_HOME', 'User')
  machineJavaHome = [Environment]::GetEnvironmentVariable('JAVA_HOME', 'Machine')
  systemJava      = $javaVersion
  entries         = [ordered]@{
    APPDATA      = Get-Names $env:APPDATA
    LOCALAPPDATA = Get-Names $env:LOCALAPPDATA
    USERPROFILE  = Get-Names $env:USERPROFILE
  }
}
$dir = Split-Path -Parent $Out
if ($dir) { New-Item -ItemType Directory -Force -Path $dir | Out-Null }
$snapshot | ConvertTo-Json -Depth 4 | Out-File -LiteralPath $Out -Encoding utf8
Write-Host "snapshot written: $Out"
