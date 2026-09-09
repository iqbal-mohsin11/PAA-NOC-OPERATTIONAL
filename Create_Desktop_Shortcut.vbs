' ===============================================================================
'      PAKISTAN AIRPORTS AUTHORITY (PAA) - IT ASSET & LOGISTICS HUB
'                OFFICIAL 1-CLICK DESKTOP SHORTCUT CREATOR
' ===============================================================================
Option Explicit

Dim oWS, fso, strCurrentDir, strDesktop, strTarget, oLink, oUrl

Set oWS = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")

strCurrentDir = fso.GetParentFolderName(WScript.ScriptFullName)
strDesktop = oWS.SpecialFolders("Desktop")

' Determine best target launcher
strTarget = strCurrentDir & "\INSTALL_ON_PC.bat"
If fso.FileExists(strCurrentDir & "\PAA_Sentinel.exe") Then
    strTarget = strCurrentDir & "\PAA_Sentinel.exe"
ElseIf fso.FileExists(strCurrentDir & "\Install_and_Run_PAA_Server.bat") Then
    strTarget = strCurrentDir & "\Install_and_Run_PAA_Server.bat"
End If

' 1. Create main launcher shortcut (.lnk)
Set oLink = oWS.CreateShortcut(strDesktop & "\PAA Sentinel IT Hub.lnk")
oLink.TargetPath = strTarget
oLink.WorkingDirectory = strCurrentDir
oLink.Description = "Pakistan Airports Authority IT Asset & Logistics Hub Server"
oLink.IconLocation = "shell32.dll,13"
oLink.Save

' 2. Create direct browser web shortcut (.url)
Set oUrl = oWS.CreateShortcut(strDesktop & "\PAA Sentinel Web App.url")
oUrl.TargetPath = "http://localhost:3000"
oUrl.Save

' 3. If PAA_Sentinel.exe exists, copy it to Desktop as well
If fso.FileExists(strCurrentDir & "\PAA_Sentinel.exe") Then
    On Error Resume Next
    fso.CopyFile strCurrentDir & "\PAA_Sentinel.exe", strDesktop & "\PAA_Sentinel.exe", True
    On Error Goto 0
End If

' 4. Notification
MsgBox "PAA Sentinel Desktop Shortcuts created successfully!" & vbCrLf & vbCrLf & _
       "• 'PAA Sentinel IT Hub' (Launcher)" & vbCrLf & _
       "• 'PAA Sentinel Web App' (http://localhost:3000)" & vbCrLf & vbCrLf & _
       "You can now double-click either icon on your Desktop to open the Hub.", _
       vbInformation, "PAA Sentinel IT Asset Hub"
