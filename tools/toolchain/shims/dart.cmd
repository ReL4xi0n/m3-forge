@echo off
rem m3-forge shim: see flutter.cmd. Dart writes its tool config (.dart-tool) to %APPDATA% on Windows.
setlocal
if not defined M3_TOOLCHAIN (
  echo m3-forge: M3_TOOLCHAIN is not set; dot-source tools\toolchain\env.ps1 first 1>&2
  exit /b 2
)
set "APPDATA=%M3_TOOLCHAIN%\flutter-appdata"
if not exist "%APPDATA%" mkdir "%APPDATA%"
call "%M3_TOOLCHAIN%\flutter\bin\dart.bat" %*
exit /b %ERRORLEVEL%
