@echo off
setlocal EnableDelayedExpansion
title PAA Sentinel v5.0 - Create Desktop Shortcut
color 0A
cls

echo ===============================================================================
echo      PAKISTAN AIRPORTS AUTHORITY (PAA) - IT ASSET & LOGISTICS HUB
echo                 DESKTOP SHORTCUT & LAUNCHER CREATOR
echo ===============================================================================
echo.

cd /d "%~dp0"

echo [1/2] Creating Desktop Shortcut for PAA Sentinel Server...
powershell -NoProfile -ExecutionPolicy Bypass -Command "& { \
    $WshShell = New-Object -comObject WScript.Shell; \
    $DesktopPath = [Environment]::GetFolderPath('Desktop'); \
    \
    # 1. Server Launcher Shortcut on Desktop \
    $Shortcut = $WshShell.CreateShortcut(\"$DesktopPath\PAA Sentinel IT Hub.lnk\"); \
    $Shortcut.TargetPath = \"%~dp0INSTALL_ON_PC.bat\"; \
    $Shortcut.WorkingDirectory = \"%~dp0\"; \
    $Shortcut.Description = 'Pakistan Airports Authority IT Asset & Logistics Hub Server'; \
    $Shortcut.IconLocation = 'shell32.dll,13'; \
    $Shortcut.Save(); \
    Write-Host '[OK] Created: Desktop\PAA Sentinel IT Hub.lnk' -ForegroundColor Green; \
    \
    # 2. Direct Browser Web App URL Shortcut on Desktop \
    $UrlShortcut = \"$DesktopPath\PAA Sentinel Web App.url\"; \
    '[InternetShortcut]' | Out-File -FilePath $UrlShortcut -Encoding ascii; \
    'URL=http://localhost:3000' | Out-File -FilePath $UrlShortcut -Append -Encoding ascii; \
    'IconIndex=0' | Out-File -FilePath $UrlShortcut -Append -Encoding ascii; \
    'IconFile=shell32.dll,14' | Out-File -FilePath $UrlShortcut -Append -Encoding ascii; \
    Write-Host '[OK] Created: Desktop\PAA Sentinel Web App.url' -ForegroundColor Green; \
}"

echo.
echo [2/2] Verifying shortcuts...
if exist "%USERPROFILE%\Desktop\PAA Sentinel IT Hub.lnk" (
    echo [SUCCESS] "PAA Sentinel IT Hub" launcher is now on your Desktop!
)
if exist "%USERPROFILE%\Desktop\PAA Sentinel Web App.url" (
    echo [SUCCESS] "PAA Sentinel Web App" direct link is now on your Desktop!
)

echo.
echo ===============================================================================
echo  Done! You can now double-click either icon on your Desktop anytime to run PAA.
echo ===============================================================================
echo.
pause
