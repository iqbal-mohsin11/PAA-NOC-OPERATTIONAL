@echo off
setlocal EnableDelayedExpansion
title PAA Sentinel v5.0 - Desktop Shortcut Creator
color 0A
cls

echo ===============================================================================
echo      PAKISTAN AIRPORTS AUTHORITY (PAA) - IT ASSET & LOGISTICS HUB
echo                 DESKTOP SHORTCUT & LAUNCHER CREATOR
echo ===============================================================================
echo.

cd /d "%~dp0"

echo [1/3] Creating Windows Desktop Shortcuts...

:: Determine launcher target
set "TARGET=%~dp0INSTALL_ON_PC.bat"
if exist "%~dp0PAA_Sentinel.exe" (
    set "TARGET=%~dp0PAA_Sentinel.exe"
) else if exist "%~dp0Install_and_Run_PAA_Server.bat" (
    set "TARGET=%~dp0Install_and_Run_PAA_Server.bat"
)

:: Create temporary VBScript to reliably create Windows .lnk and .url shortcuts
set "VBS_SCRIPT=%TEMP%\paa_mkshortcut.vbs"
(
echo Set oWS = CreateObject("WScript.Shell"^)
echo sDesktop = oWS.SpecialFolders("Desktop"^)
echo Set oLink = oWS.CreateShortcut(sDesktop ^& "\PAA Sentinel IT Hub.lnk"^)
echo oLink.TargetPath = "%TARGET%"
echo oLink.WorkingDirectory = "%~dp0"
echo oLink.Description = "Pakistan Airports Authority IT Asset & Logistics Hub"
echo oLink.IconLocation = "shell32.dll,13"
echo oLink.Save
echo Set oUrl = oWS.CreateShortcut(sDesktop ^& "\PAA Sentinel Web App.url"^)
echo oUrl.TargetPath = "http://localhost:3000"
echo oUrl.Save
) > "%VBS_SCRIPT%"

cscript //nologo "%VBS_SCRIPT%"
if exist "%VBS_SCRIPT%" del "%VBS_SCRIPT%" >nul 2>nul

echo.
echo [2/3] Checking for PAA_Sentinel.exe...
if exist "%~dp0PAA_Sentinel.exe" (
    copy /y "%~dp0PAA_Sentinel.exe" "%USERPROFILE%\Desktop\PAA_Sentinel.exe" >nul 2>nul
    echo [OK] Copied PAA_Sentinel.exe directly to your Desktop!
)

echo.
echo [3/3] Verifying Desktop items...
set "FOUND=0"
if exist "%USERPROFILE%\Desktop\PAA Sentinel IT Hub.lnk" (
    echo [FOUND] Desktop\PAA Sentinel IT Hub.lnk
    set "FOUND=1"
)
if exist "%USERPROFILE%\Desktop\PAA Sentinel Web App.url" (
    echo [FOUND] Desktop\PAA Sentinel Web App.url
    set "FOUND=1"
)
if exist "%USERPROFILE%\Desktop\PAA_Sentinel.exe" (
    echo [FOUND] Desktop\PAA_Sentinel.exe
    set "FOUND=1"
)

echo.
echo ===============================================================================
if "!FOUND!"=="1" (
    echo      [SUCCESS] PAA SENTINEL SHORTCUTS ARE NOW ON YOUR DESKTOP!
    echo ===============================================================================
    echo  1. "PAA Sentinel IT Hub" (Desktop Shortcut) -> Launches Server
    echo  2. "PAA Sentinel Web App" (Browser Link)    -> http://localhost:3000
    if exist "%USERPROFILE%\Desktop\PAA_Sentinel.exe" (
        echo  3. "PAA_Sentinel.exe" (Direct Executable)   -> Native Standalone GUI
    )
) else (
    echo [NOTE] Shortcuts placed in User Desktop.
)
echo ===============================================================================
echo.
pause
