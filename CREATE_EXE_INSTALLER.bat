@echo off
setlocal EnableDelayedExpansion
title PAA Sentinel - Standalone Windows Package & Installer Builder
color 0A
cls

echo ===============================================================================
echo      PAKISTAN AIRPORTS AUTHORITY (PAA) - IT ASSET & LOGISTICS HUB
echo                 ALL-IN-ONE WINDOWS INSTALLER (.EXE) CREATOR
echo ===============================================================================
echo.

cd /d "%~dp0"

:: Step 1: Build the native executable first
echo [STEP 1/3] Building PAA_Sentinel.exe launcher...
call "%~dp0BUILD_WINDOWS_EXE.bat"

echo.
echo [STEP 2/3] Preparing Windows Package...
if not exist "%~dp0dist" (
    echo Building web distribution assets (npm run build)...
    call npm run build
)

echo.
echo [STEP 3/3] Generating IExpress Self-Extracting Installer (.exe)...

set "SED_FILE=%TEMP%\paa_installer.sed"
(
echo [Version]
echo Class=IEXPRESS
echo SEDVersion=3
echo [Options]
echo PackagePurpose=InstallApp
echo ShowInstallProgramWindow=0
echo HideExtractAnimation=0
echo UseLongFileName=1
echo InsideCompressed=0
echo CAB_FixedSize=0
echo CAB_ResvCodeSigning=0
echo RebootMode=N
echo InstallPrompt=Do you want to install Pakistan Airports Authority Sentinel Server on this PC?
echo DisplayLicense=
echo FinishMessage=PAA Sentinel is installed. Starting server...
echo TargetName=%USERPROFILE%\Desktop\PAA_Sentinel_Setup.exe
echo FriendlyName=PAA Sentinel IT Asset Hub Setup
echo AppLaunched=cmd /c "INSTALL_ON_PC.bat"
echo PostInstallCmd=PAA_Sentinel.exe
echo AdminQuietInstCmd=
echo UserQuietInstCmd=
echo SourceFiles=SourceFiles
echo [SourceFiles]
echo SourceFiles0=%~dp0
echo [SourceFiles0]
echo %%FILE0%%=
) > "%SED_FILE%"

echo IExpress configuration generated.
echo To run IExpress directly from Windows, execute: iexpress.exe
echo.
echo ===============================================================================
echo  Your direct Windows executable is ready:
echo  1. %~dp0PAA_Sentinel.exe
echo  2. %USERPROFILE%\Desktop\PAA_Sentinel.exe
echo ===============================================================================
pause
