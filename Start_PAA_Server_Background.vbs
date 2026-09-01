' ==============================================================================
'  PAA Sentinel v5.0 - Silent Windows Background Server Launcher
'  Runs "npm run dev" silently in the background without keeping CMD window open.
'  Place this file or a shortcut into your Windows Startup folder (shell:startup)
'  to auto-boot the server whenever your PC turns on.
' ==============================================================================

Set WshShell = CreateObject("WScript.Shell")
WshShell.Run "cmd /c Install_and_Run_PAA_Server.bat", 0, False
Set WshShell = Nothing
