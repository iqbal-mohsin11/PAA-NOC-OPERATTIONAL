import React, { useState } from 'react';
import {
  Monitor,
  Download,
  Terminal,
  CheckCircle2,
  Copy,
  Check,
  Shield,
  FileCode,
  Sparkles,
  X,
  ExternalLink,
  Laptop,
} from 'lucide-react';

interface DesktopAppSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DesktopAppSetupModal: React.FC<DesktopAppSetupModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'shortcut' | 'exe' | 'pwa'>('shortcut');
  const [copiedCmd, setCopiedCmd] = useState(false);
  const [installedNotification, setInstalledNotification] = useState(false);

  if (!isOpen) return null;

  const psShortcutCommand = `$ws = New-Object -ComObject WScript.Shell; $d = [System.IO.Path]::Combine($env:USERPROFILE, 'Desktop', 'PAA Sentinel IT Inventory.lnk'); $s = $ws.CreateShortcut($d); if (Test-Path 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe') { $s.TargetPath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'; $s.Arguments = '--app=http://localhost:3000'; } else { $s.TargetPath = 'http://localhost:3000'; }; $s.Description = 'PAA IT Inventory Management'; $s.Save(); Write-Host 'Installation done! Shortcut created on Desktop.' -ForegroundColor Green`;

  const handleCopyCmd = () => {
    navigator.clipboard.writeText(psShortcutCommand);
    setCopiedCmd(true);
    setTimeout(() => setCopiedCmd(false), 2500);
  };

  const handleDownloadBat = () => {
    const batContent = `@echo off
title PAA Sentinel v5.0 - Desktop Installer
color 0A
cls
echo ====================================================================
echo        PAKISTAN AIRPORTS AUTHORITY (PAA) - IT INVENTORY
echo             Desktop Installer & Shortcut Provisioning
echo ====================================================================
echo.
echo [*] Checking System & Desktop Path...
set DESKTOP_DIR=%USERPROFILE%\\Desktop
set STARTMENU_DIR=%APPDATA%\\Microsoft\\Windows\\Start Menu\\Programs

echo [*] Target Desktop: %DESKTOP_DIR%
echo [*] Generating PAA IT Inventory Desktop Application Shortcut...

powershell -ExecutionPolicy Bypass -NoProfile -Command ^
  "$ws = New-Object -ComObject WScript.Shell; " ^
  "$deskPath = [System.IO.Path]::Combine($env:USERPROFILE, 'Desktop', 'PAA Sentinel IT Inventory.lnk'); " ^
  "$shortcut = $ws.CreateShortcut($deskPath); " ^
  "if (Test-Path 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe') { $shortcut.TargetPath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'; $shortcut.Arguments = '--app=http://localhost:3000'; } " ^
  "elseif (Test-Path 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe') { $shortcut.TargetPath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'; $shortcut.Arguments = '--app=http://localhost:3000'; } " ^
  "else { $shortcut.TargetPath = 'http://localhost:3000'; } " ^
  "$shortcut.Description = 'Pakistan Airports Authority IT Asset & Logistics Inventory Management System'; " ^
  "$shortcut.WindowStyle = 1; " ^
  "$shortcut.Save(); " ^
  "Write-Host ' -> [OK] Desktop Shortcut successfully created on Desktop!' -ForegroundColor Green"

powershell -ExecutionPolicy Bypass -NoProfile -Command ^
  "$ws = New-Object -ComObject WScript.Shell; " ^
  "$smPath = [System.IO.Path]::Combine($env:APPDATA, 'Microsoft\\Windows\\Start Menu\\Programs', 'PAA Sentinel IT Inventory.lnk'); " ^
  "$shortcut = $ws.CreateShortcut($smPath); " ^
  "if (Test-Path 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe') { $shortcut.TargetPath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'; $shortcut.Arguments = '--app=http://localhost:3000'; } " ^
  "elseif (Test-Path 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe') { $shortcut.TargetPath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'; $shortcut.Arguments = '--app=http://localhost:3000'; } " ^
  "else { $shortcut.TargetPath = 'http://localhost:3000'; } " ^
  "$shortcut.Description = 'Pakistan Airports Authority IT Asset Management'; " ^
  "$shortcut.Save(); " ^
  "Write-Host ' -> [OK] Start Menu Shortcut created successfully!' -ForegroundColor Green"

echo.
echo ====================================================================
echo   [SUCCESS] Installation done!
echo   Shortcut created on desktop:
echo   - %USERPROFILE%\\Desktop\\PAA Sentinel IT Inventory.lnk
echo ====================================================================
echo.
pause
`;
    const blob = new Blob([batContent], { type: 'application/x-bat' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Install-PAA-Desktop-Shortcut.bat';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setInstalledNotification(true);
    setTimeout(() => setInstalledNotification(false), 5000);
  };

  const handleDownloadUrlShortcut = () => {
    const urlContent = `[InternetShortcut]
URL=http://localhost:3000/
IconIndex=0
IconFile=https://raw.githubusercontent.com/feathericons/feather/master/icons/shield.svg
HotKey=0
IDList=
`;
    const blob = new Blob([urlContent], { type: 'application/internet-shortcut' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'PAA Sentinel IT Inventory.url';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setInstalledNotification(true);
    setTimeout(() => setInstalledNotification(false), 5000);
  };

  const handleDownloadBuildExeBat = () => {
    const batContent = `@echo off
title PAA Sentinel v5.0 - Build Windows .exe Executable
color 0B
cls
echo ====================================================================
echo      BUILD STANDALONE WINDOWS .EXE INSTALLER FOR PAA SENTINEL
echo ====================================================================
echo.
echo [*] Step 1: Installing electron and electron-builder (if needed)...
call npm install --save-dev electron electron-builder
echo.
echo [*] Step 2: Compiling production React and Node server bundle...
call npm run build
echo.
echo [*] Step 3: Packaging into Windows Installer (.exe) with NSIS...
call npx electron-builder --win --x64
echo.
echo ====================================================================
echo   [SUCCESS] Standalone Executable created in ./dist folder:
echo   -> dist/PAA-Sentinel-IT-Inventory-Setup-5.0.0.exe
echo   (NSIS installer automatically creates Desktop shortcut upon installation)
echo ====================================================================
echo.
pause
`;
    const blob = new Blob([batContent], { type: 'application/x-bat' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'build-windows-exe.bat';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-3xl rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900 my-8 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-500/20">
              <Monitor className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <span>Desktop App (.exe) & Shortcut Setup</span>
                <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300">
                  Windows Ready
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Generate Windows executable (.exe) installer & automated desktop shortcut
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 px-6 dark:border-slate-800 bg-white dark:bg-slate-900">
          <button
            onClick={() => setActiveTab('shortcut')}
            className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs font-bold transition ${
              activeTab === 'shortcut'
                ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400'
            }`}
          >
            <Sparkles className="h-4 w-4" />
            <span>1. Create Desktop Shortcut</span>
          </button>
          <button
            onClick={() => setActiveTab('exe')}
            className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs font-bold transition ${
              activeTab === 'exe'
                ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400'
            }`}
          >
            <FileCode className="h-4 w-4" />
            <span>2. Build .exe Executable</span>
          </button>
          <button
            onClick={() => setActiveTab('pwa')}
            className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs font-bold transition ${
              activeTab === 'pwa'
                ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400'
            }`}
          >
            <Laptop className="h-4 w-4" />
            <span>3. Browser App Mode</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
          {/* Notification Toast when download triggered */}
          {installedNotification && (
            <div className="flex items-center gap-3 rounded-xl border border-emerald-300 bg-emerald-50 p-3.5 text-xs text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200 animate-in fade-in">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
              <div>
                <span className="font-extrabold block">Installation script downloaded!</span>
                <span>Double-click the downloaded file on your Windows computer: installation done, shortcut created on desktop!</span>
              </div>
            </div>
          )}

          {activeTab === 'shortcut' && (
            <div className="space-y-4">
              <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 dark:border-slate-800 dark:bg-slate-800/40 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                    <Download className="h-4 w-4 text-indigo-600" />
                    <span>Option A: 1-Click Windows Desktop Shortcut Installer (.bat)</span>
                  </h3>
                  <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                    Recommended
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  Click below to download the automated Windows installer script. Run it on your Windows machine, and it will immediately create the <strong>"PAA Sentinel IT Inventory"</strong> shortcut on your Desktop and in the Windows Start Menu.
                </p>
                <div className="flex flex-wrap gap-2.5 pt-1">
                  <button
                    type="button"
                    onClick={handleDownloadBat}
                    className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow hover:bg-indigo-500 transition"
                  >
                    <Download className="h-4 w-4" />
                    <span>Download Install-PAA-Desktop-Shortcut.bat</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleDownloadUrlShortcut}
                    className="flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 transition"
                  >
                    <ExternalLink className="h-4 w-4 text-slate-500" />
                    <span>Download Direct .url Shortcut</span>
                  </button>
                </div>
              </div>

              {/* Option B: Copyable PowerShell Command */}
              <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 dark:border-slate-800 dark:bg-slate-800/40 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                    <Terminal className="h-4 w-4 text-indigo-600" />
                    <span>Option B: Instant PowerShell Command</span>
                  </h3>
                  <button
                    type="button"
                    onClick={handleCopyCmd}
                    className="flex items-center gap-1 rounded-md bg-white border border-slate-200 px-2 py-1 text-[11px] font-bold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                  >
                    {copiedCmd ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                    <span>{copiedCmd ? 'Copied!' : 'Copy Command'}</span>
                  </button>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  Open Windows PowerShell and paste this command to immediately generate the shortcut on your desktop:
                </p>
                <pre className="overflow-x-auto rounded-lg bg-slate-900 p-3 font-mono text-[11px] text-emerald-400 whitespace-pre-wrap break-all leading-relaxed">
                  {psShortcutCommand}
                </pre>
              </div>

              {/* Verified Result Banner */}
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-3.5 dark:border-emerald-900/40 dark:bg-emerald-950/20 flex items-start gap-3">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
                <div className="text-xs text-emerald-900 dark:text-emerald-200">
                  <span className="font-bold">Installation Behavior:</span> Upon execution, the Windows script displays <em>"Installation done! Shortcut created on Desktop."</em> and places an icon pointing to PAA IT Inventory in app-mode with zero browser toolbars.
                </div>
              </div>
            </div>
          )}

          {activeTab === 'exe' && (
            <div className="space-y-4">
              <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 dark:border-slate-800 dark:bg-slate-800/40 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                    <FileCode className="h-4 w-4 text-indigo-600" />
                    <span>How to Compile Standalone Windows Executable (.exe)</span>
                  </h3>
                  <span className="text-[11px] font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded border border-indigo-200">
                    Electron + NSIS
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  The project includes the complete Electron runner (<code>electron/main.cjs</code>) and NSIS installer configuration with <code>createDesktopShortcut: true</code>.
                </p>

                <div className="space-y-2 text-xs">
                  <div className="font-bold text-slate-800 dark:text-slate-200">
                    Step-by-step commands to build the .exe:
                  </div>
                  <div className="rounded-lg bg-slate-900 p-3 font-mono text-slate-200 text-[11px] space-y-1">
                    <p className="text-slate-400"># 1. Install electron builder</p>
                    <p className="text-cyan-400">npm install --save-dev electron electron-builder</p>
                    <p className="text-slate-400 pt-1"># 2. Build the production React & Node assets</p>
                    <p className="text-cyan-400">npm run build</p>
                    <p className="text-slate-400 pt-1"># 3. Compile standalone Windows installer (.exe)</p>
                    <p className="text-emerald-400">npx electron-builder --win --x64</p>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleDownloadBuildExeBat}
                    className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow hover:bg-indigo-500 transition"
                  >
                    <Download className="h-4 w-4" />
                    <span>Download build-windows-exe.bat</span>
                  </button>
                </div>
              </div>

              {/* NSIS Configuration Specs */}
              <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 dark:border-slate-800 dark:bg-slate-800/40 space-y-2">
                <h4 className="font-bold text-xs text-slate-800 dark:text-slate-200">
                  NSIS Installer Preset (Automated Desktop Shortcut):
                </h4>
                <pre className="rounded-lg bg-slate-900 p-3 font-mono text-[11px] text-amber-300 overflow-x-auto">
{`"build": {
  "appId": "com.paa.sentinel.inventory",
  "productName": "PAA Sentinel IT Inventory",
  "win": {
    "target": ["nsis", "portable"]
  },
  "nsis": {
    "oneClick": false,
    "allowToChangeInstallationDirectory": true,
    "createDesktopShortcut": true,
    "createStartMenuShortcut": true,
    "shortcutName": "PAA Sentinel IT Inventory"
  }
}`}
                </pre>
              </div>
            </div>
          )}

          {activeTab === 'pwa' && (
            <div className="space-y-4">
              <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 dark:border-slate-800 dark:bg-slate-800/40 space-y-3">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <Laptop className="h-4 w-4 text-indigo-600" />
                  <span>Option C: Native Browser Standalone Desktop App (Chrome / Edge)</span>
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  You can install this app directly into Windows with full native window borders, taskbar pinning, and a desktop icon without needing external tools:
                </p>

                <ol className="list-decimal list-inside space-y-2 text-xs text-slate-700 dark:text-slate-300 pl-1 font-medium">
                  <li>
                    In <strong>Google Chrome</strong> or <strong>Microsoft Edge</strong>, click the three dots menu <span className="font-bold">(⋮)</span> in the top-right corner.
                  </li>
                  <li>
                    Select <strong>"Cast, save, and share"</strong> or <strong>"Apps"</strong>.
                  </li>
                  <li>
                    Click <strong>"Install PAA Sentinel v5.0 as an app"</strong> or <strong>"Create shortcut..."</strong>.
                  </li>
                  <li>
                    Check the box: <strong>"Open as window"</strong> and click <strong>Create</strong>.
                  </li>
                </ol>

                <div className="rounded-lg border border-indigo-200 bg-indigo-50 p-3 text-xs text-indigo-900 dark:border-indigo-900/50 dark:bg-indigo-950/40 dark:text-indigo-300 flex items-center gap-2">
                  <Shield className="h-4 w-4 shrink-0 text-indigo-600" />
                  <span>
                    When completed, Windows will automatically pin the application to your Desktop and Start Menu as a native application!
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-100 px-6 py-4 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
          <div className="text-xs text-slate-500 dark:text-slate-400">
            PAA Sentinel IT Infrastructure & Asset Management
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-slate-900 px-5 py-2 text-xs font-bold text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
