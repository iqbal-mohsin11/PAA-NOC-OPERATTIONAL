@echo off
title PAA Sentinel v5.0 - Full-Stack Local PC Server Setup
color 0A
cls
echo ===============================================================================
echo      PAKISTAN AIRPORTS AUTHORITY (PAA) - IT ASSET & LOGISTICS HUB
echo                 FULL-STACK PC SERVER & MONGODB LAUNCHER
echo ===============================================================================
echo  Target System: Jinnah International Airport (JIAP) / HQCAA Intranet
echo  Database: mongodb://127.0.0.1:27017/paa_sentinel
echo  Web URL:  http://localhost:3000
echo ===============================================================================
echo.

:: 1. Check Administrator Privileges (optional but useful)
net session >nul 2>&1
if %errorLevel% == 0 (
    echo [INFO] Running with Administrator Privileges.
) else (
    echo [INFO] Running in Standard User Mode.
)
echo.

:: 2. Check Node.js
echo [STEP 1/5] Checking for Node.js runtime environment...
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Node.js is NOT found on this PC!
    echo Node.js is required to run the full-stack server backend.
    echo.
    echo Please download and install the official Node.js LTS installer from:
    echo https://nodejs.org/en/download
    echo (Choose Windows 64-bit .msi installer)
    echo.
    start https://nodejs.org/en/download
    pause
    exit /b
)
echo [OK] Node.js is detected:
node -v
npm -v
echo.

:: 3. Check / Configure .env File
echo [STEP 2/5] Checking Server Environment Configuration...
if not exist ".env" (
    echo [INFO] Creating default .env configuration...
    (
        echo PORT=3000
        echo HOST=0.0.0.0
        echo MONGODB_URI=mongodb://127.0.0.1:27017/paa_sentinel
        echo NODE_ENV=development
    ) > .env
    echo [OK] Created .env configuration file!
) else (
    echo [OK] .env file already exists.
)
echo.

:: 4. Check MongoDB Service
echo [STEP 3/5] Checking MongoDB database on port 27017...
netstat -ano | findstr :27017 >nul 2>nul
if %errorlevel% equ 0 (
    echo [OK] MongoDB is actively listening on port 27017!
) else (
    echo [WARNING] MongoDB is not currently running on port 27017.
    echo Attempting to start Windows MongoDB Service...
    net start MongoDB >nul 2>nul
    if %errorlevel% equ 0 (
        echo [OK] Windows MongoDB Service started successfully!
    ) else (
        echo [INFO] Note: If MongoDB is installed manually, make sure mongod.exe
        echo        is running, or start your Docker MongoDB container.
        echo        The server will continue and retry connecting automatically.
    )
)
echo.

:: 5. Install Dependencies if needed
echo [STEP 4/5] Checking and Installing Node Dependencies (Express, Mongoose, Vite)...
if not exist "node_modules" (
    echo [INFO] Installing required packages. This only happens once...
    call npm install
    if %errorlevel% neq 0 (
        echo [ERROR] Failed to install dependencies. Please check your internet connection.
        pause
        exit /b
    )
    echo [OK] Dependencies installed successfully!
) else (
    echo [OK] node_modules folder is present.
)
echo.

:: 6. Add Windows Firewall Exception for Local Airport Network Access
echo [STEP 5/5] Configuring Port 3000 Inbound Access for Local Airport LAN...
netsh advfirewall firewall show rule name="PAA Sentinel Server (Port 3000)" >nul 2>nul
if %errorlevel% neq 0 (
    netsh advfirewall firewall add rule name="PAA Sentinel Server (Port 3000)" dir=in action=allow protocol=TCP localport=3000 >nul 2>nul
)
echo.

:: 7. Launch Browser and Server
echo ===============================================================================
echo  [SUCCESS] Launching PAA Sentinel Server on http://localhost:3000
echo  Other computers on your WiFi/LAN can open: http://%COMPUTERNAME%:3000
echo ===============================================================================
echo.
timeout /t 2 >nul
start http://localhost:3000
npm run dev
