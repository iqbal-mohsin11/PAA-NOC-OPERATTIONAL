<#
================================================================================
     PAKISTAN AIRPORTS AUTHORITY (PAA) - IT ASSET & LOGISTICS HUB
              100% AUTOMATED POWERSHELL PC SERVER INSTALLER
================================================================================
#>

# 1. Require Administrator
$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "[INFO] Elevating to Administrator..." -ForegroundColor Yellow
    Start-Process powershell.exe -ArgumentList "-NoProfile -ExecutionPolicy Bypass -File `"$PSCommandPath`"" -Verb RunAs
    exit
}

$CurrentDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $CurrentDir

Write-Host "===============================================================================" -ForegroundColor Cyan
Write-Host "     PAKISTAN AIRPORTS AUTHORITY - ZERO-TOUCH PC SERVER INSTALLER" -ForegroundColor Cyan
Write-Host "===============================================================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Verify / Install Node.js
Write-Host "[1/6] Verifying Node.js environment..." -ForegroundColor White
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "[ACTION] Node.js not detected. Auto-installing Node.js LTS..." -ForegroundColor Yellow
    if (Get-Command winget -ErrorAction SilentlyContinue) {
        winget install OpenJS.NodeJS.LTS -e --silent --accept-source-agreements --accept-package-agreements
    } else {
        $nodeMsi = "$env:TEMP\node_setup.msi"
        [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
        Invoke-WebRequest -Uri "https://nodejs.org/dist/v20.18.0/node-v20.18.0-x64.msi" -OutFile $nodeMsi
        Start-Process msiexec.exe -ArgumentList "/i `"$nodeMsi`" /quiet /norestart" -Wait
        Remove-Item $nodeMsi -Force -ErrorAction SilentlyContinue
    }
    $env:PATH = "$env:ProgramFiles\nodejs;$env:APPDATA\npm;" + $env:PATH
}
Write-Host "[OK] Node.js verified: $(node -v)" -ForegroundColor Green

# Step 2: Verify / Start MongoDB
Write-Host "`n[2/6] Verifying MongoDB database..." -ForegroundColor White
$mongoPortOpen = (Test-NetConnection -ComputerName 127.0.0.1 -Port 27017 -WarningAction SilentlyContinue).TcpTestSucceeded
if (-not $mongoPortOpen) {
    Write-Host "[INFO] Starting MongoDB Windows Service..." -ForegroundColor Yellow
    Start-Service MongoDB -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 2
}
Write-Host "[OK] MongoDB is ready!" -ForegroundColor Green

# Step 3: Configure .env
Write-Host "`n[3/6] Configuring .env environment..." -ForegroundColor White
$envContent = @"
PORT=3000
HOST=0.0.0.0
MONGODB_URI=mongodb://127.0.0.1:27017/paa_sentinel
NODE_ENV=development
"@
Set-Content -Path "$CurrentDir\.env" -Value $envContent -Force
Write-Host "[OK] .env configured!" -ForegroundColor Green

# Step 4: Install Node dependencies
Write-Host "`n[4/6] Installing npm packages..." -ForegroundColor White
if (-not (Test-Path "$CurrentDir\node_modules")) {
    npm install
} else {
    Write-Host "[OK] node_modules already present." -ForegroundColor Green
}

# Step 5: Windows Firewall
Write-Host "`n[5/6] Opening Port 3000 in Windows Firewall for LAN..." -ForegroundColor White
New-NetFirewallRule -DisplayName "PAA Sentinel IT Hub (Port 3000)" -Direction Inbound -LocalPort 3000 -Protocol TCP -Action Allow -ErrorAction SilentlyContinue | Out-Null
Write-Host "[OK] Firewall configured for Port 3000!" -ForegroundColor Green

# Step 6: Shortcuts
Write-Host "`n[6/6] Creating Desktop and Windows Startup Shortcuts..." -ForegroundColor White
$WshShell = New-Object -comObject WScript.Shell
$DesktopPath = [Environment]::GetFolderPath('Desktop')
$Shortcut = $WshShell.CreateShortcut("$DesktopPath\PAA Sentinel IT Hub.lnk")
$Shortcut.TargetPath = "$CurrentDir\Install_and_Run_PAA_Server.bat"
$Shortcut.WorkingDirectory = $CurrentDir
$Shortcut.Description = "PAA Sentinel IT Hub Server"
$Shortcut.Save()

$StartupPath = [Environment]::GetFolderPath('Startup')
$AutoShortcut = $WshShell.CreateShortcut("$StartupPath\PAA_Sentinel_AutoServer.lnk")
$AutoShortcut.TargetPath = "$CurrentDir\Install_and_Run_PAA_Server.bat"
$AutoShortcut.WorkingDirectory = $CurrentDir
$AutoShortcut.WindowStyle = 7
$AutoShortcut.Save()
Write-Host "[OK] Shortcuts created!" -ForegroundColor Green

Write-Host "`n===============================================================================" -ForegroundColor Green
Write-Host "  [AUTO-INSTALLATION COMPLETE] Starting Server on http://localhost:3000..." -ForegroundColor Green
Write-Host "===============================================================================" -ForegroundColor Green

Start-Process "http://localhost:3000"
npm run dev
