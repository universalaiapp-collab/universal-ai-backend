@echo off
SET BASE=http://localhost:5000
SET ADMIN_API_KEY=admin-secret-key

echo === 1) seed wallet ===
node ..\scripts\seedWallet.js shubh@example.com 10000

echo.
echo === 2) basic call ===
curl -s -X POST %BASE%/orch -H "Content-Type: application/json" -d "{\"prompt\":\"Summarize this document in 1 paragraph.\"}"
echo.
echo.
echo === 3) forced openai failure (refund expected) ===
curl -s -X POST %BASE%/orch -H "Content-Type: application/json" -d "{\"prompt\":\"test refund\",\"forceFail\":\"openai\"}"
echo.
echo.
echo === 4) admin wallet check ===
curl -s -X GET "%BASE%/admin/wallets/shubh@example.com" -H "x-admin-api-key: %ADMIN_API_KEY%"
echo.
pause
