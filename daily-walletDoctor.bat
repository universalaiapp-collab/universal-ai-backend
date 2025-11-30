@echo off
REM daily-walletDoctor.bat â€” runs walletDoctor locally on Windows and writes a timestamped log

setlocal enabledelayedexpansion

REM Timestamp for log filename: YYYYMMDD-HHMMSS
for /f "tokens=1-6 delims=:-. " %%a in ("%date% %time%") do (
  set yyyy=%%d
  set mm=%%b
  set dd=%%c
)
REM Better timestamp using PowerShell (works on modern Windows)
for /f "usebackq tokens=*" %%t in (`powershell -NoProfile -Command "Get-Date -Format 'yyyyMMdd-HHmmss'"`) do set TS=%%t

set LOG_DIR=%~dp0logs
if not exist "%LOG_DIR%" mkdir "%LOG_DIR%"

set LOGFILE=%LOG_DIR%\walletDoctor-%TS%.log

echo [walletDoctor] Starting at %DATE% %TIME% >> "%LOGFILE%"
echo [walletDoctor] Running node %~dp0scripts\walletDoctor.js >> "%LOGFILE%"

REM Set MONGO_URI here if you want to override; otherwise the script should read from environment or a config
REM set MONGO_URI=mongodb://localhost:27017/universal-ai

REM run and capture output (stdout+stderr)
node "%~dp0scripts\walletDoctor.js" >> "%LOGFILE%" 2>&1

echo [walletDoctor] Finished at %DATE% %TIME% >> "%LOGFILE%"
endlocal
