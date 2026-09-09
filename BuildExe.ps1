<#
================================================================================
  Pakistan Airports Authority - Compile PAA_Sentinel.exe
================================================================================
#>

$CurrentDir = Split-Path -Parent $MyInvocation.MyCommand.Path
if (-not $CurrentDir) { $CurrentDir = Get-Location }

Write-Host "===============================================================================" -ForegroundColor Green
Write-Host "  PAA SENTINEL - WINDOWS .EXE COMPILER (POWERSHELL)" -ForegroundColor Green
Write-Host "===============================================================================" -ForegroundColor Green

# Find csc.exe
$cscPaths = @(
    "$env:windir\Microsoft.NET\Framework64\v4.0.30319\csc.exe",
    "$env:windir\Microsoft.NET\Framework\v4.0.30319\csc.exe"
)

$csc = $null
foreach ($path in $cscPaths) {
    if (Test-Path $path) {
        $csc = $path
        break
    }
}

if (-not $csc) {
    $cmd = Get-Command csc.exe -ErrorAction SilentlyContinue
    if ($cmd) { $csc = $cmd.Source }
}

if (-not $csc) {
    Write-Error "Microsoft .NET C# compiler (csc.exe) was not found on this computer."
    exit 1
}

Write-Host "[OK] Using C# Compiler: $csc" -ForegroundColor Cyan

$sourceFile = Join-Path $CurrentDir "PAA_Sentinel_Launcher.cs"
$outFile = Join-Path $CurrentDir "PAA_Sentinel.exe"

if (-not (Test-Path $sourceFile)) {
    Write-Error "Source file $sourceFile not found."
    exit 1
}

Write-Host "[INFO] Compiling $outFile ..." -ForegroundColor Yellow
$proc = Start-Process -FilePath $csc -ArgumentList "/target:winexe /platform:anycpu /optimize+ /out:`"$outFile`" `"$sourceFile`"" -Wait -NoNewWindow -PassThru

if ($proc.ExitCode -eq 0 -and (Test-Path $outFile)) {
    Write-Host "[SUCCESS] PAA_Sentinel.exe created successfully!" -ForegroundColor Green
    
    # Copy to Desktop
    $DesktopPath = [Environment]::GetFolderPath('Desktop')
    $DesktopExe = Join-Path $DesktopPath "PAA_Sentinel.exe"
    Copy-Item -Path $outFile -Destination $DesktopExe -Force
    Write-Host "[OK] Copied to Desktop: $DesktopExe" -ForegroundColor Green
    
    # Create Shortcut
    $WshShell = New-Object -comObject WScript.Shell
    $Shortcut = $WshShell.CreateShortcut(Join-Path $DesktopPath "PAA Sentinel (Run .exe).lnk")
    $Shortcut.TargetPath = $outFile
    $Shortcut.WorkingDirectory = $CurrentDir
    $Shortcut.Description = "Pakistan Airports Authority IT Asset Hub"
    $Shortcut.IconLocation = "shell32.dll,13"
    $Shortcut.Save()
    Write-Host "[OK] Created Desktop Shortcut" -ForegroundColor Green
    
    Write-Host "`nYou can now double-click PAA_Sentinel.exe on your Desktop!" -ForegroundColor Cyan
} else {
    Write-Error "Compilation failed with exit code $($proc.ExitCode)."
}
