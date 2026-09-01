<#
================================================================================
  Pakistan Airports Authority - Create Desktop Shortcuts Script
================================================================================
#>

$WshShell = New-Object -comObject WScript.Shell
$DesktopPath = [Environment]::GetFolderPath('Desktop')
$CurrentDir = Split-Path -Parent $MyInvocation.MyCommand.Path

# 1. Main Launcher Shortcut (.lnk)
$ShortcutPath = Join-Path $DesktopPath "PAA Sentinel IT Hub.lnk"
$Shortcut = $WshShell.CreateShortcut($ShortcutPath)
$Shortcut.TargetPath = Join-Path $CurrentDir "INSTALL_ON_PC.bat"
$Shortcut.WorkingDirectory = $CurrentDir
$Shortcut.Description = "Pakistan Airports Authority IT Asset & Logistics Hub"
$Shortcut.IconLocation = "shell32.dll,13"
$Shortcut.Save()

# 2. Browser Direct URL Shortcut (.url)
$UrlShortcutPath = Join-Path $DesktopPath "PAA Sentinel Web App.url"
$UrlContent = @"
[InternetShortcut]
URL=http://localhost:3000
IconIndex=0
IconFile=shell32.dll,14
"@
Set-Content -Path $UrlShortcutPath -Value $UrlContent -Encoding Ascii

Write-Host "===============================================================================" -ForegroundColor Green
Write-Host " [SUCCESS] PAA Sentinel Desktop Shortcuts Created!" -ForegroundColor Green
Write-Host " 1. $ShortcutPath" -ForegroundColor White
Write-Host " 2. $UrlShortcutPath" -ForegroundColor White
Write-Host "===============================================================================" -ForegroundColor Green
