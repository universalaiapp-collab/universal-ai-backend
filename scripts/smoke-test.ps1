# scripts/smoke-test.ps1
$health = curl.exe -s http://localhost:4000/health
Write-Host "Health: $health"

$uri = 'http://127.0.0.1:4000/api/v1/chat'
$hdr = @{ 'x-user-id' = 'smoke-test'; 'Content-Type' = 'application/json' }
$body = @{ messages = @(@{ role='user'; content='smoke test' }) } | ConvertTo-Json -Depth 6

try {
  $resp = Invoke-RestMethod -Uri $uri -Method Post -Headers $hdr -Body $body -ContentType 'application/json' -TimeoutSec 30
  Write-Host "Chat smoke result: " ($resp | ConvertTo-Json -Depth 6)
} catch {
  Write-Host "Chat smoke failed: $($_.Exception.Message)" -ForegroundColor Red
  exit 1
}
