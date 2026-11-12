@echo off
rem m3-forge shim: runs the toolchain Flutter with APPDATA pointed inside the toolchain folder, because
rem Flutter on Windows always writes its config (.flutter_tool_state, .flutter_settings, .dart-tool)
rem to %APPDATA%. The override applies to this process tree only.
setlocal
if not defined M3_TOOLCHAIN (
  echo m3-forge: M3_TOOLCHAIN is not set; dot-source tools\toolchain\env.ps1 first 1>&2
  exit /b 2
)
set "APPDATA=%M3_TOOLCHAIN%\flutter-appdata"
if not exist "%APPDATA%" mkdir "%APPDATA%"
call "%M3_TOOLCHAIN%\flutter\bin\flutter.bat" %*
exit /b %ERRORLEVEL%
