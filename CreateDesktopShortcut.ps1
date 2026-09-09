<#
================================================================================
  Pakistan Airports Authority - Create Desktop Shortcuts Script
================================================================================
#>

$CurrentDir = if ($MyInvocation.MyCommand.Path) { Split-Path -Parent $MyInvocation.MyCommand.Path } else { (Get-Location).Path }
$DesktopPath = [Environment]::GetFolderPath('Desktop')
$WshShell = New-Object -comObject WScript.Shell

# Determine best target launcher
$target = Join-Path $CurrentDir "INSTALL_ON_PC.bat"
if (Test-Path (Join-Path $CurrentDir "PAA_Sentinel.exe")) {
    $target = Join-Path $CurrentDir "PAA_Sentinel.exe"
} elseif (Test-Path (Join-Path $CurrentDir "Install_and_Run_PAA_Server.bat")) {
    $target = Join-Path $CurrentDir "Install_and_Run_PAA_Server.bat"
}

# 1. Main Launcher Shortcut (.lnk)
$ShortcutPath = Join-Path $DesktopPath "PAA Sentinel IT Hub.lnk"
$Shortcut = $WshShell.CreateShortcut($ShortcutPath)
$Shortcut.TargetPath = $target
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

# 3. Direct .EXE copy if exists
$exeSource = Join-Path $CurrentDir "PAA_Sentinel.exe"
if (Test-Path $exeSource) {
    $desktopExe = Join-Path $DesktopPath "PAA_Sentinel.exe"
    Copy-Item -Path $exeSource -Destination $desktopExe -Force
    Write-Host "[OK] Copied PAA_Sentinel.exe directly to Desktop" -ForegroundColor Cyan
}

Write-Host "===============================================================================" -ForegroundColor Green
Write-Host " [SUCCESS] PAA Sentinel Desktop Shortcuts Created!" -ForegroundColor Green
Write-Host " 1. $ShortcutPath" -ForegroundColor White
Write-Host " 2. $UrlShortcutPath" -ForegroundColor White
Write-Host "===============================================================================" -ForegroundColor Green
