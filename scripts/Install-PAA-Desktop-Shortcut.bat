@echo off
title PAA Sentinel v5.0 - Desktop Installer
color 0A
cls
echo ====================================================================
echo        PAKISTAN AIRPORTS AUTHORITY (PAA) - IT INVENTORY
echo             Desktop Installer & Shortcut Provisioning
echo ====================================================================
echo.
echo [*] Checking System & Desktop Path...
set DESKTOP_DIR=%USERPROFILE%\Desktop
set STARTMENU_DIR=%APPDATA%\Microsoft\Windows\Start Menu\Programs

echo [*] Target Desktop: %DESKTOP_DIR%
echo [*] Generating PAA IT Inventory Desktop Application Shortcut...

powershell -ExecutionPolicy Bypass -NoProfile -Command ^
  "$ws = New-Object -ComObject WScript.Shell; " ^
  "$deskPath = [System.IO.Path]::Combine($env:USERPROFILE, 'Desktop', 'PAA Sentinel IT Inventory.lnk'); " ^
  "$shortcut = $ws.CreateShortcut($deskPath); " ^
  "if (Test-Path 'C:\Program Files\Google\Chrome\Application\chrome.exe') { $shortcut.TargetPath = 'C:\Program Files\Google\Chrome\Application\chrome.exe'; $shortcut.Arguments = '--app=http://localhost:3000'; } " ^
  "elseif (Test-Path 'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe') { $shortcut.TargetPath = 'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe'; $shortcut.Arguments = '--app=http://localhost:3000'; } " ^
  "else { $shortcut.TargetPath = 'http://localhost:3000'; } " ^
  "$shortcut.Description = 'Pakistan Airports Authority IT Asset & Logistics Inventory Management System'; " ^
  "$shortcut.WindowStyle = 1; " ^
  "$shortcut.Save(); " ^
  "Write-Host ' -> [OK] Desktop Shortcut successfully created on Desktop!' -ForegroundColor Green"

powershell -ExecutionPolicy Bypass -NoProfile -Command ^
  "$ws = New-Object -ComObject WScript.Shell; " ^
  "$smPath = [System.IO.Path]::Combine($env:APPDATA, 'Microsoft\Windows\Start Menu\Programs', 'PAA Sentinel IT Inventory.lnk'); " ^
  "$shortcut = $ws.CreateShortcut($smPath); " ^
  "if (Test-Path 'C:\Program Files\Google\Chrome\Application\chrome.exe') { $shortcut.TargetPath = 'C:\Program Files\Google\Chrome\Application\chrome.exe'; $shortcut.Arguments = '--app=http://localhost:3000'; } " ^
  "elseif (Test-Path 'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe') { $shortcut.TargetPath = 'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe'; $shortcut.Arguments = '--app=http://localhost:3000'; } " ^
  "else { $shortcut.TargetPath = 'http://localhost:3000'; } " ^
  "$shortcut.Description = 'Pakistan Airports Authority IT Asset Management'; " ^
  "$shortcut.Save(); " ^
  "Write-Host ' -> [OK] Start Menu Shortcut created successfully!' -ForegroundColor Green"

echo.
echo ====================================================================
echo   [SUCCESS] Installation done!
echo   Shortcut created on desktop:
echo   - %USERPROFILE%\Desktop\PAA Sentinel IT Inventory.lnk
echo ====================================================================
echo.
pause
