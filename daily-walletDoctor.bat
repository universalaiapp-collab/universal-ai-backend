@echo off
cd /d C:\Users\shubh\universal-ai-backend

:: ensure logs dir exists
mkdir logs 2> NUL

:: timestamp (use double %% because this is inside a .bat file)
for /f "usebackq delims=" %%T in (`powershell -NoProfile -Command "[DateTime]::UtcNow.ToString('yyyyMMdd-HHmmss')"`) do set "TS=%%T"

echo Running walletDoctor at %TS% ...
node scripts\walletDoctor.js > logs\walletDoctor-%TS%.log 2>&1
echo Log written to logs\walletDoctor-%TS%.log
exit /b 0
