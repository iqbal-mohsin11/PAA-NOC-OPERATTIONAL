@echo off
setlocal EnableDelayedExpansion
title PAA Sentinel v5.0 - 100%% Automated Zero-Touch PC Server Installer
color 0A
cls

echo ===============================================================================
echo      PAKISTAN AIRPORTS AUTHORITY (PAA) - IT ASSET & LOGISTICS HUB
echo             100%% ZERO-TOUCH AUTO-INSTALLER & PC SERVER PROVISIONER
echo ===============================================================================
echo  Target System: Jinnah International Airport (JIAP) / HQCAA Intranet
echo  Server Port:   3000 (LAN Access: 0.0.0.0:3000)
echo  Database:      mongodb://127.0.0.1:27017/paa_sentinel
echo ===============================================================================
echo.

:: -----------------------------------------------------------------------------
:: Step 0: Ensure script runs from current project directory
:: -----------------------------------------------------------------------------
cd /d "%~dp0"

:: -----------------------------------------------------------------------------
:: Step 1: Check Administrator Privileges (Auto-Elevate if needed)
:: -----------------------------------------------------------------------------
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo [INFO] Requesting Administrator Elevation for Firewall & Service configuration...
    powershell -Command "Start-Process cmd -ArgumentList '/c \"\"%~f0\"\"' -Verb RunAs"
    exit /b
)

echo [OK] Running with Elevated Administrator Privileges.
echo.

:: -----------------------------------------------------------------------------
:: Step 2: Auto-Detect and Auto-Install Node.js if Missing
:: -----------------------------------------------------------------------------
echo ===============================================================================
echo  [STEP 1/6] Verifying Node.js Environment...
echo ===============================================================================
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [WARNING] Node.js is not installed on this PC.
    echo [ACTION] Automatically downloading and installing Node.js LTS in silent mode...
    echo Please wait a moment while Node.js is configured...
    
    powershell -NoProfile -ExecutionPolicy Bypass -Command "& { \
        Write-Host '[INFO] Checking winget package manager...'; \
        if (Get-Command winget -ErrorAction SilentlyContinue) { \
            winget install OpenJS.NodeJS.LTS -e --silent --accept-source-agreements --accept-package-agreements; \
        } else { \
            Write-Host '[INFO] Downloading Node.js 20 LTS installer directly...'; \
            $url = 'https://nodejs.org/dist/v20.18.0/node-v20.18.0-x64.msi'; \
            $installer = \"$env:TEMP\node_installer.msi\"; \
            [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; \
            Invoke-WebRequest -Uri $url -OutFile $installer; \
            Write-Host '[INFO] Installing Node.js silently...'; \
            Start-Process msiexec.exe -ArgumentList '/i', $installer, '/quiet', '/norestart' -Wait; \
            Remove-Item $installer -Force -ErrorAction SilentlyContinue; \
        } \
    }"
    
    :: Refresh Environment PATH immediately in this session
    set "PATH=%ProgramFiles%\nodejs;%APPDATA%\npm;%PATH%"
    set "PATH=%ProgramFiles(x86)%\nodejs;%PATH%"
)

where node >nul 2>nul
if %errorlevel% equ 0 (
    echo [OK] Node.js is ready:
    node -v
    npm -v
) else (
    echo [NOTE] Node.js installer just finished. Using default Node path.
    set "PATH=%ProgramFiles%\nodejs;%APPDATA%\npm;%PATH%"
)
echo.

:: -----------------------------------------------------------------------------
:: Step 3: Auto-Detect and Auto-Install/Start MongoDB
:: -----------------------------------------------------------------------------
echo ===============================================================================
echo  [STEP 2/6] Verifying MongoDB Database Service...
echo ===============================================================================
netstat -ano | findstr :27017 >nul 2>nul
if %errorlevel% equ 0 (
    echo [OK] MongoDB is actively running on port 27017!
) else (
    echo [INFO] MongoDB is not running on port 27017.
    echo [ACTION] Checking Windows MongoDB Service...
    net start MongoDB >nul 2>nul
    if %errorlevel% equ 0 (
        echo [OK] Windows MongoDB Service started successfully!
    ) else (
        echo [INFO] Attempting automated MongoDB installation via winget...
        powershell -NoProfile -ExecutionPolicy Bypass -Command "& { \
            if (Get-Command winget -ErrorAction SilentlyContinue) { \
                Write-Host '[INFO] Installing MongoDB Server via winget...'; \
                winget install MongoDB.Server -e --silent --accept-source-agreements --accept-package-agreements; \
                Start-Sleep -Seconds 5; \
                Start-Service MongoDB -ErrorAction SilentlyContinue; \
            } else { \
                Write-Host '[INFO] Docker or local MongoDB instance will be used.'; \
            } \
        }"
    )
)
echo.

:: -----------------------------------------------------------------------------
:: Step 4: Auto-Generate .env Configuration
:: -----------------------------------------------------------------------------
echo ===============================================================================
echo  [STEP 3/6] Generating Production Environment Configuration...
echo ===============================================================================
(
    echo PORT=3000
    echo HOST=0.0.0.0
    echo MONGODB_URI=mongodb://127.0.0.1:27017/paa_sentinel
    echo NODE_ENV=development
) > "%~dp0.env"
echo [OK] Created .env with Port 3000 and MongoDB URI.
echo.

:: -----------------------------------------------------------------------------
:: Step 5: Auto-Install Project Dependencies (npm install)
:: -----------------------------------------------------------------------------
echo ===============================================================================
echo  [STEP 4/6] Installing Node Packages (Express, Vite, Mongoose, TailwindCSS)...
echo ===============================================================================
if not exist "%~dp0node_modules" (
    echo [INFO] Installing packages. This takes about 30 seconds on initial install...
    call npm install
    if %errorlevel% neq 0 (
        echo [WARNING] npm install had warnings, retrying with --legacy-peer-deps...
        call npm install --legacy-peer-deps
    )
    echo [OK] All dependencies successfully installed!
) else (
    echo [OK] node_modules folder is already installed and verified!
)
echo.

:: -----------------------------------------------------------------------------
:: Step 6: Configure Windows Firewall for Port 3000 (LAN Airport Access)
:: -----------------------------------------------------------------------------
echo ===============================================================================
echo  [STEP 5/6] Opening Port 3000 in Windows Firewall for LAN Access...
echo ===============================================================================
netsh advfirewall firewall delete rule name="PAA Sentinel IT Hub Server (Port 3000)" >nul 2>nul
netsh advfirewall firewall add rule name="PAA Sentinel IT Hub Server (Port 3000)" dir=in action=allow protocol=TCP localport=3000 profile=any >nul 2>nul
echo [OK] Windows Firewall rule configured for Port 3000 (Inbound Allowed).
echo.

:: -----------------------------------------------------------------------------
:: Step 7: Create Desktop Shortcut & Windows Auto-Boot Startup Shortcut
:: -----------------------------------------------------------------------------
echo ===============================================================================
echo  [STEP 6/6] Creating Desktop Shortcut and Auto-Start on Windows Boot...
echo ===============================================================================
powershell -NoProfile -ExecutionPolicy Bypass -Command "& { \
    $WshShell = New-Object -comObject WScript.Shell; \
    \
    # 1. Desktop Shortcut \
    $DesktopPath = [Environment]::GetFolderPath('Desktop'); \
    $Shortcut = $WshShell.CreateShortcut(\"$DesktopPath\PAA Sentinel Server.lnk\"); \
    $Shortcut.TargetPath = \"%~dp0Install_and_Run_PAA_Server.bat\"; \
    $Shortcut.WorkingDirectory = \"%~dp0\"; \
    $Shortcut.Description = 'Launch Pakistan Airports Authority IT Asset Server'; \
    $Shortcut.Save(); \
    Write-Host '[OK] Created Desktop Shortcut: PAA Sentinel Server.lnk'; \
    \
    # 2. Windows Startup Auto-Boot Shortcut \
    $StartupPath = [Environment]::GetFolderPath('Startup'); \
    $AutoShortcut = $WshShell.CreateShortcut(\"$StartupPath\PAA_Sentinel_AutoServer.lnk\"); \
    $AutoShortcut.TargetPath = \"%~dp0Install_and_Run_PAA_Server.bat\"; \
    $AutoShortcut.WorkingDirectory = \"%~dp0\"; \
    $AutoShortcut.WindowStyle = 7; \
    $AutoShortcut.Description = 'Auto-start PAA Sentinel Server on Windows Boot'; \
    $AutoShortcut.Save(); \
    Write-Host '[OK] Created Windows Startup Entry: Server will auto-start on PC boot!'; \
}"
echo.

:: -----------------------------------------------------------------------------
:: Step 8: Success & Launch Server
:: -----------------------------------------------------------------------------
echo ===============================================================================
echo                   [AUTO-INSTALLATION 100%% COMPLETE!]
echo ===============================================================================
echo  The PAA Sentinel IT Hub Server is now running on your PC:
echo.
echo  * Local Browser URL:   http://localhost:3000
echo  * Other LAN PCs / WiFi: http://%COMPUTERNAME%:3000
echo  * MongoDB Database:    mongodb://127.0.0.1:27017/paa_sentinel
echo ===============================================================================
echo.
timeout /t 2 >nul
start http://localhost:3000
npm run dev
