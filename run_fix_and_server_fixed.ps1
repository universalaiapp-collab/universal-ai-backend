# Elevated helper (fixed) - placed in project root
# Purpose: stop offending PID, free port, start server in a new visible window, test endpoint, keep window open
$ErrorActionPreference = "Stop"

# Adjust this if you discovered a different PID previously holding the port
$targetPid = 16504
$port = 4000

# ensure we run in the project root (avoid System32 working dir)
$projectRoot = "C:\Users\shubh\universal-ai-backend"
Set-Location $projectRoot

Write-Host "=== Elevated helper started (working dir: $projectRoot) ===" -ForegroundColor Cyan

# 1) Show process info if present
try {
  $proc = Get-Process -Id $targetPid -ErrorAction Stop
  Write-Host "`nProcess found for PID $($targetPid):" -ForegroundColor Yellow
  $proc | Format-List Id, ProcessName, StartTime, Path, CPU
} catch {
  Write-Host "`nNo process with PID $($targetPid) found (it may already be stopped)." -ForegroundColor Green
}

# 2) Try Stop-Process, fallback to taskkill
Write-Host "`nAttempting to stop PID $($targetPid) ..." -ForegroundColor Cyan
try {
  Stop-Process -Id $targetPid -Force -ErrorAction Stop
  Write-Host "Stop-Process succeeded for PID $($targetPid)." -ForegroundColor Green
} catch {
  Write-Host "Stop-Process failed or access denied; trying taskkill ..." -ForegroundColor Yellow
  try {
    & taskkill /PID $targetPid /F | Out-Null
    Write-Host "taskkill attempted for PID $($targetPid)." -ForegroundColor Green
  } catch {
    Write-Host "taskkill failed. You may need to investigate or reboot to clear the port." -ForegroundColor Red
    Write-Host "Process info (if available):"
    try { Get-CimInstance Win32_Process -Filter "ProcessId=$targetPid" | Select-Object ProcessId, CommandLine } catch {}
    Read-Host "Press Enter to exit elevated helper (server NOT started)"
    exit 1
  }
}

Start-Sleep -Seconds 1

# 3) Confirm port is free (retry)
function WaitPortFree([int]$p, [int]$tries=12, [int]$delayMs=500) {
  for ($i=0; $i -lt $tries; $i++) {
    $lines = netstat -ano | Select-String "[:\[]$p\b"
    if (-not $lines) { return $true }
    Start-Sleep -Milliseconds $delayMs
  }
  return $false
}

Write-Host "`nChecking port $($port) is free..." -ForegroundColor Cyan
if (-not (WaitPortFree -p $port -tries 12 -delayMs 500)) {
  Write-Host "Port $($port) still in use after attempts. Listing listeners:" -ForegroundColor Red
  netstat -ano | Select-String "[:\[]$port\b" | ForEach-Object { Write-Host $_.Line }
  Write-Host "If the above still shows a PID, stop it manually or reboot the machine." -ForegroundColor Yellow
  Read-Host "Press Enter to exit elevated helper (server NOT started)"
  exit 1
}

Write-Host "Port $($port) is free. Proceeding to start the server." -ForegroundColor Green

# 4) Start compiled server (node ./dist/index.js) in a NEW visible PowerShell window (stays open)
$serverScript = (Resolve-Path .\dist\index.js).Path
$cwd = (Get-Location).Path
$argList = "-NoExit","-Command","cd `"$cwd`"; node `"$serverScript`""
Write-Host "`nLaunching server in NEW PowerShell window (command: node $serverScript) ..." -ForegroundColor Cyan
$serverWindow = Start-Process -FilePath (Get-Command powershell).Source -ArgumentList $argList -PassThru

if (-not $serverWindow) {
  Write-Host "Failed to start server window." -ForegroundColor Red
  Read-Host "Press Enter to exit elevated helper"
  exit 1
}

Write-Host "Started server window PID: $($serverWindow.Id). Switch to that window to view logs." -ForegroundColor Green

# 5) Wait up to 30s for the port to open
function WaitForOpen([string]$HostName='localhost',[int]$PortNum=4000,[int]$TimeoutSec=30) {
  $deadline = (Get-Date).AddSeconds($TimeoutSec)
  while ((Get-Date) -lt $deadline) {
    try {
      $tcp = New-Object System.Net.Sockets.TcpClient
      $iar = $tcp.BeginConnect($HostName, $PortNum, $null, $null)
      if ($iar.AsyncWaitHandle.WaitOne(500) -and $tcp.Connected) { $tcp.EndConnect($iar); $tcp.Close(); return $true }
      $tcp.Close()
    } catch {}
    Start-Sleep -Milliseconds 300
  }
  return $false
}

Write-Host "`nWaiting up to 30s for localhost:$($port) to accept connections..." -ForegroundColor Cyan
# CALL POSITIONALLY to avoid named-parameter collision with reserved variables
if (-not (WaitForOpen 'localhost' $port 30)) {
  Write-Host "Timeout waiting for port $($port). Check the NEW server window for errors." -ForegroundColor Red
  Write-Host "Server window PID: $($serverWindow.Id)" -ForegroundColor Yellow
  Read-Host "Press Enter to finish elevated helper (server window remains open)"
  exit 1
}

Write-Host "Port $($port) is open. Running POST test to /api/v1/chat ..." -ForegroundColor Green

# 6) Run POST test and print response
$uri = "http://localhost:$($port)/api/v1/chat"
$headers = @{ 'x-user-id' = 'test-user'; 'Content-Type' = 'application/json' }
$body = @{ messages = @(@{ role = 'user'; content = 'Hello! Please reply briefly.' }) } | ConvertTo-Json -Depth 8

try {
  $resp = Invoke-WebRequest -Uri $uri -Method POST -Headers $headers -Body $body -ContentType 'application/json' -UseBasicParsing -ErrorAction Stop
  Write-Host "`nHTTP/$($resp.StatusCode) $($resp.StatusDescription)" -ForegroundColor Green
  Write-Host "Response body:" -ForegroundColor Cyan
  $resp.Content | Write-Host
} catch {
  Write-Host "`nRequest failed. Diagnostics:" -ForegroundColor Red
  $ex = $_.Exception
  if ($ex -and $ex.Response) {
    try {
      $st = $ex.Response.StatusCode.Value__
      $desc = $ex.Response.StatusDescription
      Write-Host "Status: $st $desc" -ForegroundColor Yellow
      $sr = New-Object System.IO.StreamReader($ex.Response.GetResponseStream())
      $bodyText = $sr.ReadToEnd()
      Write-Host "Response body (raw):" -ForegroundColor Yellow
      $bodyText | Write-Host
    } catch {
      Write-Host "Failed to read response stream: $_" -ForegroundColor Red
    }
  } else {
    Write-Host "No HTTP response. Exception message:" -ForegroundColor Yellow
    Write-Host $ex.Message
    $_ | Format-List -Force
  }
}

Write-Host "`nElevated helper finished. Server window PID: $($serverWindow.Id). To stop server: Stop-Process -Id $($serverWindow.Id) -Force" -ForegroundColor Green
Read-Host "Press Enter to exit elevated helper (server window will remain open)"
