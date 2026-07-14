# Self-elevate the script to run as Administrator if not already elevated
$currentPrincipal = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())
if (-not $currentPrincipal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    Write-Host "Requesting Administrator privileges..." -ForegroundColor Yellow
    Start-Process powershell -ArgumentList "-NoProfile -ExecutionPolicy Bypass -File `"$PSCommandPath`"" -Verb RunAs
    Exit
}

Write-Host "--------------------------------------------------" -ForegroundColor Cyan
Write-Host "Configuring MongoDB Service for Permanent Auto-Run" -ForegroundColor Cyan
Write-Host "--------------------------------------------------" -ForegroundColor Cyan

# 1. Clean up leftover lock file if any
$lockFilePath = "C:\Program Files\MongoDB\Server\8.0\data\mongod.lock"
if (Test-Path $lockFilePath) {
    Write-Host "Found leftover mongod.lock file. Cleaning up..." -ForegroundColor Yellow
    Remove-Item $lockFilePath -Force
    Write-Host "Lock file deleted successfully." -ForegroundColor Green
}

# 2. Configure MongoDB service to Automatic (Delayed Start)
Write-Host "Configuring MongoDB service startup to Automatic (Delayed Start)..." -ForegroundColor Yellow
sc.exe config MongoDB start= delayed-auto
if ($LASTEXITCODE -eq 0) {
    Write-Host "Successfully configured MongoDB to Delayed Start." -ForegroundColor Green
} else {
    Write-Warning "Failed to set Delayed Start via sc.exe. Trying Set-Service..."
    Set-Service -Name MongoDB -StartupType Automatic
}

# 3. Configure service Recovery settings to restart on failure
Write-Host "Configuring service recovery options (auto-restart on crash)..." -ForegroundColor Yellow
sc.exe failure MongoDB reset= 86400 actions= restart/5000/restart/5000/restart/5000
if ($LASTEXITCODE -eq 0) {
    Write-Host "Successfully configured Recovery options (restart after 5 seconds on failures)." -ForegroundColor Green
} else {
    Write-Warning "Failed to configure service recovery settings."
}

# 4. Start the service
Write-Host "Starting MongoDB Service..." -ForegroundColor Yellow
Start-Service -Name MongoDB -ErrorAction SilentlyContinue

$service = Get-Service -Name MongoDB
if ($service.Status -eq 'Running') {
    Write-Host "MongoDB Service is now RUNNING." -ForegroundColor Green
} else {
    Write-Host "MongoDB Service status: $($service.Status)" -ForegroundColor Red
    Write-Host "Please check Event Viewer for errors." -ForegroundColor Red
}

Write-Host "--------------------------------------------------" -ForegroundColor Cyan
Write-Host "Done! Press any key to exit..." -ForegroundColor Cyan
[void][System.Console]::ReadKey()
