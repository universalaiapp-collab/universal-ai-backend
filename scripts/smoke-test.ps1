# scripts/smoke-test.ps1
 = curl.exe -s http://localhost:4000/health
Write-Host "Health: "

http://127.0.0.1:4000/api/v1/chat = "http://127.0.0.1:4000/api/v1/chat"
System.Collections.Hashtable = @{ 'x-user-id' = 'smoke-test'; 'Content-Type' = 'application/json' }
{
    "messages":  [
                     {
                         "content":  "smoke test",
                         "role":  "user"
                     }
                 ]
} = @{ messages = @(@{ role='user'; content='smoke test' }) } | ConvertTo-Json -Depth 6
try {
   = Invoke-RestMethod -Uri http://127.0.0.1:4000/api/v1/chat -Method Post -Headers System.Collections.Hashtable -Body {
    "messages":  [
                     {
                         "content":  "smoke test",
                         "role":  "user"
                     }
                 ]
} -ContentType 'application/json' -TimeoutSec 30
  Write-Host "Chat smoke result: " ( | ConvertTo-Json -Depth 6)
} catch {
  Write-Host "Chat smoke failed: " -ForegroundColor Red
  exit 1
}
