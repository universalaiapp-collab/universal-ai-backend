@echo off
REM snapshot-and-repair.bat
REM Usage: snapshot-and-repair.bat user@example.com [startingBalance]
REM Example: snapshot-and-repair.bat shubh@example.com
setlocal

set "USER=%~1"
set "START=%~2"

if "%USER%"=="" (
  echo Usage: snapshot-and-repair.bat user@example.com [startingBalance]
  exit /b 1
)

echo Snapshotting wallet for %USER% ...
"C:\Users\%USERNAME%\AppData\Local\Programs\mongosh\mongosh.exe" "mongodb://localhost:27017/universal-ai" --quiet --eval "db.backups.insertOne({ type:'wallet-snapshot', at:new Date(), doc: db.wallets.findOne({ userId: '%USER%' }) })"

if not "%ERRORLEVEL%"=="0" (
  echo mongosh snapshot failed.
  exit /b 2
)

if not "%START%"=="" (
  echo Running repair for %USER% with startingBalance=%START% ...
  node scripts\repairWalletCredits.js %USER% %START%
) else (
  echo Running repair for %USER% with default startingBalance ...
  node scripts\repairWalletCredits.js %USER%
)

echo Current wallet:
"C:\Users\%USERNAME%\AppData\Local\Programs\mongosh\mongosh.exe" "mongodb://localhost:27017/universal-ai" --quiet --eval "printjson(db.wallets.findOne({ userId: '%USER%' }))"

echo Done.
endlocal
pause
