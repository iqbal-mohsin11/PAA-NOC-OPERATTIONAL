@echo off
title PAA Sentinel v5.0 - Windows Auto-Start Service Setup
color 0B
cls
echo ===============================================================================
echo     PAA SENTINEL - CONFIGURE AUTOMATIC WINDOWS STARTUP ON PC BOOT
echo ===============================================================================
echo.
echo  This tool configures your PC to automatically start the PAA Sentinel Server
echo  every time your Windows computer turns on or reboots.
echo.
echo ===============================================================================
echo.

set STARTUP_DIR=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup
set SHORTCUT_SCRIPT=%TEMP%\create_paa_shortcut.vbs

echo [1/2] Creating Windows Startup shortcut in:
echo %STARTUP_DIR%
echo.

(
    echo Set oWS = WScript.CreateObject("WScript.Shell"^)
    echo sLinkFile = "%STARTUP_DIR%\PAA_Sentinel_AutoServer.lnk"
    echo Set oLink = oWS.CreateShortcut(sLinkFile^)
    echo oLink.TargetPath = "%~dp0Install_and_Run_PAA_Server.bat"
    echo oLink.WorkingDirectory = "%~dp0"
    echo oLink.Description = "PAA Sentinel IT Asset Server"
    echo oLink.WindowStyle = 7
    echo oLink.Save
) > "%SHORTCUT_SCRIPT%"

cscript /nologo "%SHORTCUT_SCRIPT%"
del "%SHORTCUT_SCRIPT%"

echo [OK] Auto-Start Shortcut created successfully!
echo.
echo [2/2] Testing Local Firewall rule for LAN access (Port 3000)...
netsh advfirewall firewall add rule name="PAA Sentinel Server" dir=in action=allow protocol=TCP localport=3000 >nul 2>nul
echo [OK] Port 3000 is open in Windows Firewall!
echo.
echo ===============================================================================
echo  [DONE] Setup Complete!
echo  The server will now automatically start whenever this PC turns on.
echo ===============================================================================
echo.
pause
