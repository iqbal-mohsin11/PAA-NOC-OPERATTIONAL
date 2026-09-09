@echo off
setlocal EnableDelayedExpansion
title Pakistan Airports Authority - PAA Sentinel PC Installer v5.0
color 0A
cls

echo ===============================================================================
echo      PAKISTAN AIRPORTS AUTHORITY (PAA) - IT ASSET & LOGISTICS HUB
echo                   OFFICIAL PC SERVER & DATABASE INSTALLER
echo ===============================================================================
echo  Target System: Jinnah International Airport (JIAP) / HQCAA Intranet
echo  Server Port:   3000 (LAN / Intranet: 0.0.0.0:3000)
echo  Database:      mongodb://127.0.0.1:27017/paa_sentinel
echo ===============================================================================
echo.

:: -----------------------------------------------------------------------------
:: Step 0: Set Working Directory to Project Folder
:: -----------------------------------------------------------------------------
cd /d "%~dp0"

:: -----------------------------------------------------------------------------
:: Step 1: Self-Elevation to Administrator (Required for Firewall & Services)
:: -----------------------------------------------------------------------------
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo [INFO] Requesting Administrator Privileges to configure Windows Firewall & Services...
    powershell -Command "Start-Process cmd -ArgumentList '/c \"\"%~f0\"\"' -Verb RunAs"
    exit /b
)

echo [OK] Running with Elevated Administrator Privileges.
echo.

:: -----------------------------------------------------------------------------
:: Step 2: Auto-Detect & Auto-Install Node.js
:: -----------------------------------------------------------------------------
echo ===============================================================================
echo  [STEP 1/6] Verifying Node.js Runtime Environment...
echo ===============================================================================
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [WARNING] Node.js is not detected on this PC.
    echo [ACTION] Downloading and installing Node.js LTS in silent mode...
    echo Please wait a moment while Node.js is configured...
    
    powershell -NoProfile -ExecutionPolicy Bypass -Command "& { \
        Write-Host '[INFO] Checking winget package manager...'; \
        if (Get-Command winget -ErrorAction SilentlyContinue) { \
            winget install OpenJS.NodeJS.LTS -e --silent --accept-source-agreements --accept-package-agreements; \
        } else { \
            Write-Host '[INFO] Downloading official Node.js LTS 64-bit installer...'; \
            $url = 'https://nodejs.org/dist/v20.18.0/node-v20.18.0-x64.msi'; \
            $installer = \"$env:TEMP\node_installer.msi\"; \
            [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; \
            Invoke-WebRequest -Uri $url -OutFile $installer; \
            Write-Host '[INFO] Running silent MSI installer...'; \
            Start-Process msiexec.exe -ArgumentList '/i', $installer, '/quiet', '/norestart' -Wait; \
            Remove-Item $installer -Force -ErrorAction SilentlyContinue; \
        } \
    }"
    
    set "PATH=%ProgramFiles%\nodejs;%APPDATA%\npm;%PATH%"
    set "PATH=%ProgramFiles(x86)%\nodejs;%PATH%"
)

where node >nul 2>nul
if %errorlevel% equ 0 (
    echo [OK] Node.js is active:
    node -v
    npm -v
) else (
    echo [NOTE] Node.js recently configured. Setting system path.
    set "PATH=%ProgramFiles%\nodejs;%APPDATA%\npm;%PATH%"
)
echo.

:: -----------------------------------------------------------------------------
:: Step 3: Auto-Detect & Auto-Start MongoDB Database
:: -----------------------------------------------------------------------------
echo ===============================================================================
echo  [STEP 2/6] Verifying MongoDB Database Service (Port 27017)...
echo ===============================================================================
netstat -ano | findstr :27017 >nul 2>nul
if %errorlevel% equ 0 (
    echo [OK] MongoDB is actively running on port 27017!
) else (
    echo [INFO] MongoDB is not running on port 27017.
    echo [ACTION] Attempting to start Windows MongoDB Service...
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
                Write-Host '[INFO] Note: If MongoDB is installed manually, launch mongod.exe or Docker.'; \
            } \
        }"
    )
)
echo.

:: -----------------------------------------------------------------------------
:: Step 4: Auto-Generate .env Configuration
:: -----------------------------------------------------------------------------
echo ===============================================================================
echo  [STEP 3/6] Configuring Server Environment (.env)...
echo ===============================================================================
(
    echo PORT=3000
    echo HOST=0.0.0.0
    echo MONGODB_URI=mongodb://127.0.0.1:27017/paa_sentinel
    echo NODE_ENV=development
) > "%~dp0.env"
echo [OK] Created .env configuration file (Port 3000, 0.0.0.0 Host, MongoDB URI).
echo.

:: -----------------------------------------------------------------------------
:: Step 5: Install Project Dependencies (Express, Vite, Mongoose, etc.)
:: -----------------------------------------------------------------------------
echo ===============================================================================
echo  [STEP 4/6] Installing Node Packages (npm install)...
echo ===============================================================================
if not exist "%~dp0node_modules" (
    echo [INFO] Installing packages. This only takes ~30 seconds on first run...
    call npm install
    if %errorlevel% neq 0 (
        echo [WARNING] Retrying with --legacy-peer-deps...
        call npm install --legacy-peer-deps
    )
    echo [OK] All dependencies successfully installed!
) else (
    echo [OK] node_modules folder is already present and ready.
)
echo.

:: -----------------------------------------------------------------------------
:: Step 6: Configure Windows Firewall Rule for Port 3000 (LAN / Wi-Fi Access)
:: -----------------------------------------------------------------------------
echo ===============================================================================
echo  [STEP 5/6] Opening Port 3000 in Windows Firewall for LAN Access...
echo ===============================================================================
netsh advfirewall firewall delete rule name="PAA Sentinel Server (Port 3000)" >nul 2>nul
netsh advfirewall firewall add rule name="PAA Sentinel Server (Port 3000)" dir=in action=allow protocol=TCP localport=3000 profile=any >nul 2>nul
echo [OK] Windows Firewall rule configured for Port 3000.
echo.

:: -----------------------------------------------------------------------------
:: Step 7: Create Desktop Shortcut and Auto-Start on Windows Boot Shortcut
:: -----------------------------------------------------------------------------
echo ===============================================================================
echo  [STEP 6/6] Creating Desktop Shortcut & Windows Startup Entry...
echo ===============================================================================
set "VBS_MK=%TEMP%\paa_mkshortcuts_inst.vbs"
(
echo Set oWS = CreateObject("WScript.Shell"^)
echo sDesktop = oWS.SpecialFolders("Desktop"^)
echo Set oLink = oWS.CreateShortcut(sDesktop ^& "\PAA Sentinel IT Hub.lnk"^)
echo oLink.TargetPath = "%~dp0INSTALL_ON_PC.bat"
echo oLink.WorkingDirectory = "%~dp0"
echo oLink.Description = "Pakistan Airports Authority IT Asset & Logistics Hub"
echo oLink.IconLocation = "shell32.dll,13"
echo oLink.Save
echo Set oUrl = oWS.CreateShortcut(sDesktop ^& "\PAA Sentinel Web App.url"^)
echo oUrl.TargetPath = "http://localhost:3000"
echo oUrl.Save
echo sStartup = oWS.SpecialFolders("Startup"^)
echo Set oAuto = oWS.CreateShortcut(sStartup ^& "\PAA_Sentinel_AutoServer.lnk"^)
echo oAuto.TargetPath = "%~dp0INSTALL_ON_PC.bat"
echo oAuto.WorkingDirectory = "%~dp0"
echo oAuto.WindowStyle = 7
echo oAuto.Save
) > "%VBS_MK%"
cscript //nologo "%VBS_MK%"
if exist "%VBS_MK%" del "%VBS_MK%" >nul 2>nul
echo [OK] Created Desktop Shortcut: PAA Sentinel IT Hub.lnk
echo [OK] Created Desktop Web Link: PAA Sentinel Web App.url
echo [OK] Created Windows Startup Entry (Auto-starts on PC boot)
echo.

:: -----------------------------------------------------------------------------
:: Step 8: Launch Browser & Start Server
:: -----------------------------------------------------------------------------
echo ===============================================================================
echo                [SUCCESS] PAA SENTINEL SERVER IS INSTALLED & RUNNING!
echo ===============================================================================
echo.
echo  * Local Browser URL:    http://localhost:3000
echo  * Other LAN PCs / WiFi: http://%COMPUTERNAME%:3000
echo  * MongoDB Database:     mongodb://127.0.0.1:27017/paa_sentinel
echo.
echo ===============================================================================
echo.
timeout /t 2 >nul
start http://localhost:3000
npm run dev
