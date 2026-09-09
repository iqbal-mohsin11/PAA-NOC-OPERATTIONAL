@echo off
setlocal EnableDelayedExpansion
title PAA Sentinel - Windows .EXE Executable Builder
color 0A
cls

echo ===============================================================================
echo      PAKISTAN AIRPORTS AUTHORITY (PAA) - IT ASSET & LOGISTICS HUB
echo                 NATIVE WINDOWS .EXE COMPILER & BUILDER
echo ===============================================================================
echo  Target: PAA_Sentinel.exe (Windows 64-bit / 32-bit Standalone GUI Launcher)
echo  Features:
echo   - 100%% Native Windows GUI (.exe)
echo   - No black CMD terminal popup
echo   - Runs server invisibly in background
echo   - Windows Taskbar System Tray icon (Shield) with Context Menu
echo   - Auto-launches http://localhost:3000 in your default browser
echo   - Auto-copies PAA_Sentinel.exe to your Desktop
echo ===============================================================================
echo.

cd /d "%~dp0"

:: -----------------------------------------------------------------------------
:: Step 1: Locate Microsoft .NET C# Compiler (csc.exe) on Windows
:: -----------------------------------------------------------------------------
echo [STEP 1/4] Detecting Microsoft .NET C# Compiler (csc.exe)...

set "CSC="

if exist "%windir%\Microsoft.NET\Framework64\v4.0.30319\csc.exe" (
    set "CSC=%windir%\Microsoft.NET\Framework64\v4.0.30319\csc.exe"
) else if exist "%windir%\Microsoft.NET\Framework\v4.0.30319\csc.exe" (
    set "CSC=%windir%\Microsoft.NET\Framework\v4.0.30319\csc.exe"
) else (
    for /f "delims=" %%I in ('where csc 2^>nul') do set "CSC=%%I"
)

if "%CSC%"=="" (
    echo [ERROR] Microsoft .NET Framework C# compiler was not found.
    echo Please make sure .NET Framework 4.5+ is enabled in Windows Features.
    pause
    exit /b 1
)

echo [OK] Found .NET C# Compiler:
echo      %CSC%
echo.

:: -----------------------------------------------------------------------------
:: Step 2: Verify Source Code
:: -----------------------------------------------------------------------------
echo [STEP 2/4] Verifying C# Source Code (PAA_Sentinel_Launcher.cs)...
if not exist "%~dp0PAA_Sentinel_Launcher.cs" (
    echo [ERROR] PAA_Sentinel_Launcher.cs not found in current folder!
    pause
    exit /b 1
)
echo [OK] Source code verified.
echo.

:: -----------------------------------------------------------------------------
:: Step 3: Compile PAA_Sentinel.exe
:: -----------------------------------------------------------------------------
echo [STEP 3/4] Compiling native Windows executable: PAA_Sentinel.exe...
"%CSC%" /target:winexe /platform:anycpu /optimize+ /out:"%~dp0PAA_Sentinel.exe" "%~dp0PAA_Sentinel_Launcher.cs"

if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Compilation failed. Check the error messages above.
    pause
    exit /b 1
)

echo [SUCCESS] PAA_Sentinel.exe compiled successfully!
echo File Size:
dir "%~dp0PAA_Sentinel.exe" | findstr "PAA_Sentinel.exe"
echo.

:: -----------------------------------------------------------------------------
:: Step 4: Copy to Desktop & Create Shortcut
:: -----------------------------------------------------------------------------
echo [STEP 4/4] Placing PAA_Sentinel.exe onto your Desktop...
copy /y "%~dp0PAA_Sentinel.exe" "%USERPROFILE%\Desktop\PAA_Sentinel.exe" >nul 2>nul
if %errorlevel% equ 0 (
    echo [OK] Direct executable placed at: %USERPROFILE%\Desktop\PAA_Sentinel.exe
) else (
    echo [NOTE] Could not copy directly to Desktop, created in project folder.
)

set "VBS_EXE_LNK=%TEMP%\paa_exe_lnk.vbs"
(
echo Set oWS = CreateObject("WScript.Shell"^)
echo sDesktop = oWS.SpecialFolders("Desktop"^)
echo Set oLink = oWS.CreateShortcut(sDesktop ^& "\PAA Sentinel (Run .exe).lnk"^)
echo oLink.TargetPath = "%~dp0PAA_Sentinel.exe"
echo oLink.WorkingDirectory = "%~dp0"
echo oLink.Description = "Launch Pakistan Airports Authority IT Asset Hub"
echo oLink.IconLocation = "shell32.dll,13"
echo oLink.Save
echo Set oUrl = oWS.CreateShortcut(sDesktop ^& "\PAA Sentinel Web App.url"^)
echo oUrl.TargetPath = "http://localhost:3000"
echo oUrl.Save
) > "%VBS_EXE_LNK%"
cscript //nologo "%VBS_EXE_LNK%"
if exist "%VBS_EXE_LNK%" del "%VBS_EXE_LNK%" >nul 2>nul
echo [OK] Created Desktop Shortcut: PAA Sentinel (Run .exe).lnk
echo [OK] Created Desktop Web Link: PAA Sentinel Web App.url

echo.
echo ===============================================================================
echo                [100%% COMPLETE] PAA_SENTINEL.EXE IS READY!
echo ===============================================================================
echo  Your standalone Windows executable is located at:
echo  1. %~dp0PAA_Sentinel.exe
echo  2. %USERPROFILE%\Desktop\PAA_Sentinel.exe
echo.
echo  Double-click PAA_Sentinel.exe anytime to launch the Asset Hub!
echo ===============================================================================
echo.

set /p RUNNOW="Would you like to run PAA_Sentinel.exe right now? (Y/N): "
if /i "%RUNNOW%"=="Y" (
    start "" "%~dp0PAA_Sentinel.exe"
)
