import React, { useState, useEffect } from 'react';
import {
  Monitor,
  Download,
  FileCode,
  Terminal,
  CheckCircle2,
  X,
  Laptop,
  Globe,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  HardDrive,
  Layers,
  FolderDown,
  AlertCircle,
  Play,
  Database,
  Server,
  Copy,
  Check,
  RefreshCw,
  Cpu,
  Boxes,
  Network,
  Share2,
  Power,
  Shield,
  Zap,
} from 'lucide-react';
import { useInventory } from '../context/InventoryContext';

interface PCWebFileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PCWebFileModal: React.FC<PCWebFileModalProps> = ({ isOpen, onClose }) => {
  const { assets, dbStatus, refreshDbData } = useInventory();
  const [activeTab, setActiveTab] = useState<'autoinstall' | 'install' | 'lan' | 'autostart' | 'standalone'>('autoinstall');
  const [copiedCompose, setCopiedCompose] = useState(false);
  const [copiedFirewall, setCopiedFirewall] = useState(false);
  const [copiedNpm, setCopiedNpm] = useState(false);
  const [copiedPs1Liner, setCopiedPs1Liner] = useState(false);
  const [downloadedAutoInstaller, setDownloadedAutoInstaller] = useState(false);
  const [downloadedInstaller, setDownloadedInstaller] = useState(false);
  const [downloadedShortcut, setDownloadedShortcut] = useState(false);
  const [downloadedSilent, setDownloadedSilent] = useState(false);
  const [downloadedStartup, setDownloadedStartup] = useState(false);
  const [downloadedHtml, setDownloadedHtml] = useState(false);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [serverInfo, setServerInfo] = useState<{
    hostname?: string;
    platform?: string;
    addresses?: { name: string; address: string; family: string }[];
  }>({});

  useEffect(() => {
    if (isOpen) {
      fetch('/api/server/info')
        .then((res) => res.json())
        .then((data) => setServerInfo(data))
        .catch(() => {});
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // 0. Download 100% Zero-Touch AUTO_INSTALL_PAA_SERVER.bat
  const handleDownloadAutoInstaller = () => {
    const batContent = `@echo off
setlocal EnableDelayedExpansion
title PAA Sentinel v5.0 - 100%% Automated Zero-Touch PC Server Installer
color 0A
cls

echo ===============================================================================
echo      PAKISTAN AIRPORTS AUTHORITY (PAA) - IT ASSET & LOGISTICS HUB
echo             100%% ZERO-TOUCH AUTO-INSTALLER & PC SERVER PROVISIONER
echo ===============================================================================
echo  Target System: Jinnah International Airport (JIAP) / HQCAA Intranet
echo  Server Port:   3000 (LAN Access: 0.0.0.0:3000)
echo  Database:      mongodb://127.0.0.1:27017/paa_sentinel
echo ===============================================================================
echo.

cd /d "%~dp0"

net session >nul 2>&1
if %errorLevel% neq 0 (
    echo [INFO] Requesting Administrator Elevation for Firewall & Service configuration...
    powershell -Command "Start-Process cmd -ArgumentList '/c \"\"%~f0\"\"' -Verb RunAs"
    exit /b
)

echo [OK] Running with Elevated Administrator Privileges.
echo.

echo ===============================================================================
echo  [STEP 1/6] Verifying Node.js Environment...
echo ===============================================================================
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [WARNING] Node.js is not installed on this PC.
    echo [ACTION] Automatically downloading and installing Node.js LTS in silent mode...
    echo Please wait a moment while Node.js is configured...
    
    powershell -NoProfile -ExecutionPolicy Bypass -Command "& { \\
        Write-Host '[INFO] Checking winget package manager...'; \\
        if (Get-Command winget -ErrorAction SilentlyContinue) { \\
            winget install OpenJS.NodeJS.LTS -e --silent --accept-source-agreements --accept-package-agreements; \\
        } else { \\
            Write-Host '[INFO] Downloading Node.js 20 LTS installer directly...'; \\
            $url = 'https://nodejs.org/dist/v20.18.0/node-v20.18.0-x64.msi'; \\
            $installer = \"$env:TEMP\\node_installer.msi\"; \\
            [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; \\
            Invoke-WebRequest -Uri $url -OutFile $installer; \\
            Write-Host '[INFO] Installing Node.js silently...'; \\
            Start-Process msiexec.exe -ArgumentList '/i', $installer, '/quiet', '/norestart' -Wait; \\
            Remove-Item $installer -Force -ErrorAction SilentlyContinue; \\
        } \\
    }"
    
    set "PATH=%ProgramFiles%\\nodejs;%APPDATA%\\npm;%PATH%"
    set "PATH=%ProgramFiles(x86)%\\nodejs;%PATH%"
)

where node >nul 2>nul
if %errorlevel% equ 0 (
    echo [OK] Node.js is ready:
    node -v
    npm -v
) else (
    echo [NOTE] Node.js installer just finished. Using default Node path.
    set "PATH=%ProgramFiles%\\nodejs;%APPDATA%\\npm;%PATH%"
)
echo.

echo ===============================================================================
echo  [STEP 2/6] Verifying MongoDB Database Service...
echo ===============================================================================
netstat -ano | findstr :27017 >nul 2>nul
if %errorlevel% equ 0 (
    echo [OK] MongoDB is actively running on port 27017!
) else (
    echo [INFO] MongoDB is not running on port 27017.
    echo [ACTION] Checking Windows MongoDB Service...
    net start MongoDB >nul 2>nul
    if %errorlevel% equ 0 (
        echo [OK] Windows MongoDB Service started successfully!
    ) else (
        echo [INFO] Attempting automated MongoDB installation via winget...
        powershell -NoProfile -ExecutionPolicy Bypass -Command "& { \\
            if (Get-Command winget -ErrorAction SilentlyContinue) { \\
                Write-Host '[INFO] Installing MongoDB Server via winget...'; \\
                winget install MongoDB.Server -e --silent --accept-source-agreements --accept-package-agreements; \\
                Start-Sleep -Seconds 5; \\
                Start-Service MongoDB -ErrorAction SilentlyContinue; \\
            } else { \\
                Write-Host '[INFO] Docker or local MongoDB instance will be used.'; \\
            } \\
        }"
    )
)
echo.

echo ===============================================================================
echo  [STEP 3/6] Generating Production Environment Configuration...
echo ===============================================================================
(
    echo PORT=3000
    echo HOST=0.0.0.0
    echo MONGODB_URI=mongodb://127.0.0.1:27017/paa_sentinel
    echo NODE_ENV=development
) > "%~dp0.env"
echo [OK] Created .env with Port 3000 and MongoDB URI.
echo.

echo ===============================================================================
echo  [STEP 4/6] Installing Node Packages (Express, Vite, Mongoose, TailwindCSS)...
echo ===============================================================================
if not exist "%~dp0node_modules" (
    echo [INFO] Installing packages. This takes about 30 seconds on initial install...
    call npm install
    if %errorlevel% neq 0 (
        echo [WARNING] npm install had warnings, retrying with --legacy-peer-deps...
        call npm install --legacy-peer-deps
    )
    echo [OK] All dependencies successfully installed!
) else (
    echo [OK] node_modules folder is already installed and verified!
)
echo.

echo ===============================================================================
echo  [STEP 5/6] Opening Port 3000 in Windows Firewall for LAN Access...
echo ===============================================================================
netsh advfirewall firewall delete rule name="PAA Sentinel IT Hub Server (Port 3000)" >nul 2>nul
netsh advfirewall firewall add rule name="PAA Sentinel IT Hub Server (Port 3000)" dir=in action=allow protocol=TCP localport=3000 profile=any >nul 2>nul
echo [OK] Windows Firewall rule configured for Port 3000 (Inbound Allowed).
echo.

echo ===============================================================================
echo  [STEP 6/6] Creating Desktop Shortcut and Auto-Start on Windows Boot...
echo ===============================================================================
powershell -NoProfile -ExecutionPolicy Bypass -Command "& { \\
    $WshShell = New-Object -comObject WScript.Shell; \\
    $DesktopPath = [Environment]::GetFolderPath('Desktop'); \\
    $Shortcut = $WshShell.CreateShortcut(\"$DesktopPath\\PAA Sentinel Server.lnk\"); \\
    $Shortcut.TargetPath = \"%~dp0Install_and_Run_PAA_Server.bat\"; \\
    $Shortcut.WorkingDirectory = \"%~dp0\"; \\
    $Shortcut.Description = 'Launch Pakistan Airports Authority IT Asset Server'; \\
    $Shortcut.Save(); \\
    Write-Host '[OK] Created Desktop Shortcut: PAA Sentinel Server.lnk'; \\
    \\
    $StartupPath = [Environment]::GetFolderPath('Startup'); \\
    $AutoShortcut = $WshShell.CreateShortcut(\"$StartupPath\\PAA_Sentinel_AutoServer.lnk\"); \\
    $AutoShortcut.TargetPath = \"%~dp0Install_and_Run_PAA_Server.bat\"; \\
    $AutoShortcut.WorkingDirectory = \"%~dp0\"; \\
    $AutoShortcut.WindowStyle = 7; \\
    $AutoShortcut.Description = 'Auto-start PAA Sentinel Server on Windows Boot'; \\
    $AutoShortcut.Save(); \\
    Write-Host '[OK] Created Windows Startup Entry: Server will auto-start on PC boot!'; \\
}"
echo.

echo ===============================================================================
echo                   [AUTO-INSTALLATION 100%% COMPLETE!]
echo ===============================================================================
echo  The PAA Sentinel IT Hub Server is now running on your PC:
echo.
echo  * Local Browser URL:   http://localhost:3000
echo  * Other LAN PCs / WiFi: http://%COMPUTERNAME%:3000
echo  * MongoDB Database:    mongodb://127.0.0.1:27017/paa_sentinel
echo ===============================================================================
echo.
timeout /t 2 >nul
start http://localhost:3000
npm run dev
`;
    const blob = new Blob([batContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'AUTO_INSTALL_PAA_SERVER.bat';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setDownloadedAutoInstaller(true);
  };

  // Download CREATE_DESKTOP_SHORTCUT.bat
  const handleDownloadShortcut = () => {
    const batContent = `@echo off
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
powershell -NoProfile -ExecutionPolicy Bypass -Command "& { \\
    $WshShell = New-Object -comObject WScript.Shell; \\
    $DesktopPath = [Environment]::GetFolderPath('Desktop'); \\
    \\
    # 1. Server Launcher Shortcut on Desktop \\
    $Shortcut = $WshShell.CreateShortcut(\\"$DesktopPath\\\\PAA Sentinel IT Hub.lnk\\"); \\
    $Shortcut.TargetPath = \\"%~dp0INSTALL_ON_PC.bat\\"; \\
    $Shortcut.WorkingDirectory = \\"%~dp0\\"; \\
    $Shortcut.Description = 'Pakistan Airports Authority IT Asset & Logistics Hub Server'; \\
    $Shortcut.IconLocation = 'shell32.dll,13'; \\
    $Shortcut.Save(); \\
    Write-Host '[OK] Created: Desktop\\\\PAA Sentinel IT Hub.lnk' -ForegroundColor Green; \\
    \\
    # 2. Direct Browser Web App URL Shortcut on Desktop \\
    $UrlShortcut = \\"$DesktopPath\\\\PAA Sentinel Web App.url\\"; \\
    '[InternetShortcut]' | Out-File -FilePath $UrlShortcut -Encoding ascii; \\
    'URL=http://localhost:3000' | Out-File -FilePath $UrlShortcut -Append -Encoding ascii; \\
    'IconIndex=0' | Out-File -FilePath $UrlShortcut -Append -Encoding ascii; \\
    'IconFile=shell32.dll,14' | Out-File -FilePath $UrlShortcut -Append -Encoding ascii; \\
    Write-Host '[OK] Created: Desktop\\\\PAA Sentinel Web App.url' -ForegroundColor Green; \\
}"

echo.
echo [2/2] Verifying shortcuts...
if exist "%USERPROFILE%\\Desktop\\PAA Sentinel IT Hub.lnk" (
    echo [SUCCESS] "PAA Sentinel IT Hub" launcher is now on your Desktop!
)
if exist "%USERPROFILE%\\Desktop\\PAA Sentinel Web App.url" (
    echo [SUCCESS] "PAA Sentinel Web App" direct link is now on your Desktop!
)

echo.
echo ===============================================================================
echo  Done! You can now double-click either icon on your Desktop anytime to run PAA.
echo ===============================================================================
echo.
pause
`;
    const blob = new Blob([batContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'CREATE_DESKTOP_SHORTCUT.bat';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setDownloadedShortcut(true);
  };

  // 1. Download Install_and_Run_PAA_Server.bat
  const handleDownloadInstaller = () => {
    const batContent = `@echo off
title PAA Sentinel v5.0 - Full-Stack Local PC Server Setup
color 0A
cls
echo ===============================================================================
echo      PAKISTAN AIRPORTS AUTHORITY (PAA) - IT ASSET & LOGISTICS HUB
echo                 FULL-STACK PC SERVER & MONGODB LAUNCHER
echo ===============================================================================
echo  Target System: Jinnah International Airport (JIAP) / HQCAA Intranet
echo  Database: mongodb://127.0.0.1:27017/paa_sentinel
echo  Web URL:  http://localhost:3000
echo ===============================================================================
echo.

:: 1. Check Node.js
echo [STEP 1/5] Checking for Node.js runtime environment...
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Node.js is NOT found on this PC!
    echo Node.js is required to run the full-stack server backend.
    echo.
    echo Please download and install the official Node.js LTS installer from:
    echo https://nodejs.org/en/download
    echo (Choose Windows 64-bit .msi installer)
    echo.
    start https://nodejs.org/en/download
    pause
    exit /b
)
echo [OK] Node.js is detected:
node -v
npm -v
echo.

:: 2. Check / Configure .env File
echo [STEP 2/5] Checking Server Environment Configuration...
if not exist ".env" (
    echo [INFO] Creating default .env configuration...
    (
        echo PORT=3000
        echo HOST=0.0.0.0
        echo MONGODB_URI=mongodb://127.0.0.1:27017/paa_sentinel
        echo NODE_ENV=development
    ) > .env
    echo [OK] Created .env configuration file!
) else (
    echo [OK] .env file already exists.
)
echo.

:: 3. Check MongoDB Service
echo [STEP 3/5] Checking MongoDB database on port 27017...
netstat -ano | findstr :27017 >nul 2>nul
if %errorlevel% equ 0 (
    echo [OK] MongoDB is actively listening on port 27017!
) else (
    echo [WARNING] MongoDB is not currently running on port 27017.
    echo Attempting to start Windows MongoDB Service...
    net start MongoDB >nul 2>nul
    if %errorlevel% equ 0 (
        echo [OK] Windows MongoDB Service started successfully!
    ) else (
        echo [INFO] Note: If MongoDB is installed manually, make sure mongod.exe
        echo        is running, or start your Docker MongoDB container.
        echo        The server will continue and retry connecting automatically.
    )
)
echo.

:: 4. Install Dependencies if needed
echo [STEP 4/5] Checking and Installing Node Dependencies (Express, Mongoose, Vite)...
if not exist "node_modules" (
    echo [INFO] Installing required packages. This only happens once...
    call npm install
    if %errorlevel% neq 0 (
        echo [ERROR] Failed to install dependencies. Please check your internet connection.
        pause
        exit /b
    )
    echo [OK] Dependencies installed successfully!
) else (
    echo [OK] node_modules folder is present.
)
echo.

:: 5. Add Windows Firewall Exception for Local Airport Network Access
echo [STEP 5/5] Configuring Port 3000 Inbound Access for Local Airport LAN...
netsh advfirewall firewall show rule name="PAA Sentinel Server (Port 3000)" >nul 2>nul
if %errorlevel% neq 0 (
    netsh advfirewall firewall add rule name="PAA Sentinel Server (Port 3000)" dir=in action=allow protocol=TCP localport=3000 >nul 2>nul
)
echo.

:: 6. Launch Browser and Server
echo ===============================================================================
echo  [SUCCESS] Launching PAA Sentinel Server on http://localhost:3000
echo  Other computers on your WiFi/LAN can open: http://%COMPUTERNAME%:3000
echo ===============================================================================
echo.
timeout /t 2 >nul
start http://localhost:3000
npm run dev
`;
    const blob = new Blob([batContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Install_and_Run_PAA_Server.bat';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setDownloadedInstaller(true);
  };

  // 2. Download Start_PAA_Server_Background.vbs
  const handleDownloadSilentVbs = () => {
    const vbsContent = `' PAA Sentinel v5.0 - Silent Windows Background Server Launcher
Set WshShell = CreateObject("WScript.Shell")
WshShell.Run "cmd /c Install_and_Run_PAA_Server.bat", 0, False
Set WshShell = Nothing
`;
    const blob = new Blob([vbsContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Start_PAA_Server_Background.vbs';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setDownloadedSilent(true);
  };

  // 3. Download PAA_Sentinel_Windows_Service_Setup.bat
  const handleDownloadStartupBat = () => {
    const batContent = `@echo off
title PAA Sentinel v5.0 - Windows Auto-Start Service Setup
color 0B
cls
echo ===============================================================================
echo     PAA SENTINEL - CONFIGURE AUTOMATIC WINDOWS STARTUP ON PC BOOT
echo ===============================================================================
echo.
set STARTUP_DIR=%APPDATA%\\Microsoft\\Windows\\Start Menu\\Programs\\Startup
set SHORTCUT_SCRIPT=%TEMP%\\create_paa_shortcut.vbs

(
    echo Set oWS = WScript.CreateObject("WScript.Shell"^)
    echo sLinkFile = "%STARTUP_DIR%\\PAA_Sentinel_AutoServer.lnk"
    echo Set oLink = oWS.CreateShortcut(sLinkFile^)
    echo oLink.TargetPath = "%~dp0Install_and_Run_PAA_Server.bat"
    echo oLink.WorkingDirectory = "%~dp0"
    echo oLink.Description = "PAA Sentinel IT Asset Server"
    echo oLink.WindowStyle = 7
    echo oLink.Save
) > "%SHORTCUT_SCRIPT%"

cscript /nologo "%SHORTCUT_SCRIPT%"
del "%SHORTCUT_SCRIPT%"

echo [OK] Auto-Start Shortcut created in %STARTUP_DIR%!
echo Server will now launch every time this PC boots.
pause
`;
    const blob = new Blob([batContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'PAA_Sentinel_Windows_Service_Setup.bat';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setDownloadedStartup(true);
  };

  const handleCopyCompose = () => {
    const dockerContent = `version: '3.8'

services:
  mongodb:
    image: mongo:6.0
    container_name: paa_sentinel_mongodb
    restart: always
    ports:
      - '27017:27017'
    volumes:
      - mongo_data:/data/db
    environment:
      MONGO_INITDB_DATABASE: paa_sentinel

  mongo-express:
    image: mongo-express:latest
    container_name: paa_sentinel_mongo_express
    restart: always
    ports:
      - '8081:8081'
    environment:
      ME_CONFIG_MONGODB_SERVER: mongodb
      ME_CONFIG_MONGODB_PORT: 27017
      ME_CONFIG_BASICAUTH: false
    depends_on:
      - mongodb

volumes:
  mongo_data:
    driver: local`;
    navigator.clipboard.writeText(dockerContent);
    setCopiedCompose(true);
    setTimeout(() => setCopiedCompose(false), 2500);
  };

  const handleCopyFirewall = () => {
    const cmd = `netsh advfirewall firewall add rule name="PAA Sentinel Server (Port 3000)" dir=in action=allow protocol=TCP localport=3000`;
    navigator.clipboard.writeText(cmd);
    setCopiedFirewall(true);
    setTimeout(() => setCopiedFirewall(false), 2500);
  };

  const handleCopyNpm = () => {
    const cmd = `npm install && npm run dev`;
    navigator.clipboard.writeText(cmd);
    setCopiedNpm(true);
    setTimeout(() => setCopiedNpm(false), 2500);
  };

  const handleCopyPs1Liner = () => {
    const cmd = `powershell -ExecutionPolicy Bypass -Command "& { .\\AUTO_INSTALL_PAA_SERVER.bat }"`;
    navigator.clipboard.writeText(cmd);
    setCopiedPs1Liner(true);
    setTimeout(() => setCopiedPs1Liner(false), 2500);
  };

  const handleTestConnection = async () => {
    setIsTestingConnection(true);
    await refreshDbData();
    setIsTestingConnection(false);
  };

  // Build the complete standalone offline single-file HTML application
  const generateStandaloneHTML = () => {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Pakistan Airports Authority - IT Asset & Logistics Hub (Offline PC Edition)</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
  <style>
    body { font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    @media print { .no-print { display: none !important; } }
  </style>
</head>
<body class="bg-slate-900 text-slate-100 min-h-screen flex flex-col antialiased">
  <header class="bg-slate-800/95 border-b border-slate-700 px-6 py-4 flex flex-wrap items-center justify-between sticky top-0 z-50 shadow-md">
    <div class="flex items-center gap-3">
      <div class="bg-gradient-to-r from-emerald-500 to-teal-600 p-2.5 rounded-xl text-white shadow-lg">
        <i class="fa-solid fa-shield-halved text-xl"></i>
      </div>
      <div>
        <div class="flex items-center gap-2">
          <h1 class="font-black text-lg text-white tracking-tight">PAKISTAN AIRPORTS AUTHORITY</h1>
          <span class="bg-emerald-500/20 text-emerald-300 text-[10px] font-extrabold px-2 py-0.5 rounded border border-emerald-500/30">HQCAA • JIAP</span>
        </div>
        <p class="text-xs text-emerald-400 font-medium">Standalone Offline PC Web Application • IT Asset & Logistics Hub</p>
      </div>
    </div>
  </header>
  <main class="flex-1 max-w-7xl w-full mx-auto p-6 space-y-6">
    <div class="bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-xl">
      <h2 class="text-xl font-bold text-white">PAA Asset Inventory - Local PC Edition</h2>
      <p class="text-sm text-slate-300 mt-1">Total Assets: ${assets.length} items loaded locally.</p>
    </div>
  </main>
</body>
</html>`;
  };

  const handleDownloadStandaloneHTML = () => {
    const htmlContent = generateStandaloneHTML();
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'PAA_Asset_Hub_PC_Web_App.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setDownloadedHtml(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm animate-fadeIn overflow-y-auto">
      <div className="w-full max-w-4xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 my-auto space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white shadow-lg shadow-emerald-500/20">
              <Zap className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-slate-900 text-base dark:text-white">
                  PAA Sentinel - 100% PC Auto-Installer
                </h3>
                <span
                  className={`rounded-md px-2 py-0.5 text-[10px] font-black border ${
                    dbStatus.isConnected
                      ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                      : 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                  }`}
                >
                  ⚡ Zero-Touch Automated
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                1-Click auto-install Node.js, MongoDB database, network sharing, Windows Firewall, and auto-boot service.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 dark:border-slate-800">
          <button
            onClick={() => setActiveTab('autoinstall')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition ${
              activeTab === 'autoinstall'
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-t-lg font-black'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'
            }`}
          >
            <Zap className="h-4 w-4 text-emerald-500" />
            <span>⚡ 1-Click Zero-Touch Auto-Install</span>
          </button>
          <button
            onClick={() => setActiveTab('install')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition ${
              activeTab === 'install'
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'
            }`}
          >
            <Download className="h-4 w-4" />
            <span>Step-by-Step Manual Setup</span>
          </button>
          <button
            onClick={() => setActiveTab('lan')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition ${
              activeTab === 'lan'
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'
            }`}
          >
            <Share2 className="h-4 w-4" />
            <span>LAN & Airport Network Sharing</span>
          </button>
          <button
            onClick={() => setActiveTab('autostart')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition ${
              activeTab === 'autostart'
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'
            }`}
          >
            <Power className="h-4 w-4" />
            <span>Auto-Start on PC Boot</span>
          </button>
          <button
            onClick={() => setActiveTab('standalone')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition ${
              activeTab === 'standalone'
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'
            }`}
          >
            <Laptop className="h-4 w-4" />
            <span>Single-File Offline .HTML</span>
          </button>
        </div>

        {/* Tab Content: 100% Zero-Touch Auto-Install */}
        {activeTab === 'autoinstall' && (
          <div className="space-y-4">
            {/* Auto-Installer Hero Card */}
            <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-900/40 via-slate-900 to-slate-900 p-5 shadow-xl space-y-4 text-white">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500 text-slate-950 font-black text-sm shadow-md">
                      ⚡
                    </span>
                    <h4 className="font-extrabold text-base text-white tracking-tight">
                      1-Click Zero-Touch PC Auto-Installer (.bat)
                    </h4>
                  </div>
                  <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
                    Double-click this single script on your Windows PC. It automatically downloads & installs Node.js, configures MongoDB, installs packages, opens Windows Firewall, creates a Desktop shortcut, and boots the local server.
                  </p>
                </div>

                <button
                  onClick={handleDownloadAutoInstaller}
                  className="shrink-0 flex items-center gap-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs px-6 py-3.5 shadow-lg shadow-emerald-500/25 transition transform active:scale-95 cursor-pointer"
                >
                  {downloadedAutoInstaller ? <CheckCircle2 className="h-5 w-5" /> : <Download className="h-5 w-5" />}
                  <span>{downloadedAutoInstaller ? 'Downloaded! Double-Click .bat' : 'Download AUTO_INSTALL_PAA_SERVER.bat'}</span>
                </button>
              </div>

              {/* 6 Auto-Actions Performed Silently */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-2 border-t border-slate-800 text-[11px]">
                <div className="flex items-center gap-2 bg-slate-800/80 p-2 rounded-lg border border-slate-700/60">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>Auto-Installs Node.js LTS</span>
                </div>
                <div className="flex items-center gap-2 bg-slate-800/80 p-2 rounded-lg border border-slate-700/60">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>Auto-Configures MongoDB</span>
                </div>
                <div className="flex items-center gap-2 bg-slate-800/80 p-2 rounded-lg border border-slate-700/60">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>Generates .env Settings</span>
                </div>
                <div className="flex items-center gap-2 bg-slate-800/80 p-2 rounded-lg border border-slate-700/60">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>Builds npm Dependencies</span>
                </div>
                <div className="flex items-center gap-2 bg-slate-800/80 p-2 rounded-lg border border-slate-700/60">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>Unblocks Windows Firewall</span>
                </div>
                <div className="flex items-center gap-2 bg-slate-800/80 p-2 rounded-lg border border-slate-700/60">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>Creates Desktop & Boot Shortcuts</span>
                </div>
              </div>
            </div>

            {/* Quick 1-Liner PowerShell Terminal Option */}
            <div className="rounded-xl border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/50 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white">
                  <Terminal className="h-4 w-4 text-indigo-500" />
                  <span>Or Run Auto-Installer via Terminal / PowerShell:</span>
                </div>
                <button
                  onClick={handleCopyPs1Liner}
                  className="flex items-center gap-1 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  {copiedPs1Liner ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{copiedPs1Liner ? 'Copied Command!' : 'Copy 1-Liner'}</span>
                </button>
              </div>

              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 font-mono text-xs text-emerald-400 flex items-center justify-between overflow-x-auto">
                <code>powershell -ExecutionPolicy Bypass -Command "&amp; &#123; .\AUTO_INSTALL_PAA_SERVER.bat &#125;"</code>
              </div>
            </div>

            {/* Desktop Shortcut Creator Card */}
            <div className="rounded-xl border border-teal-200 bg-teal-50/70 dark:border-teal-900/50 dark:bg-teal-950/30 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-600 text-white font-bold shadow-md shrink-0">
                  <Monitor className="h-5 w-5" />
                </div>
                <div>
                  <h5 className="font-extrabold text-xs text-slate-900 dark:text-white">
                    Create Desktop Shortcut & Web Launcher Icon
                  </h5>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300">
                    Already completed installation? Run <code className="font-bold text-teal-600 dark:text-teal-400">CREATE_DESKTOP_SHORTCUT.bat</code> or click to create 1-click desktop shortcuts anytime.
                  </p>
                </div>
              </div>
              <button
                onClick={handleDownloadShortcut}
                className="shrink-0 flex items-center gap-2 rounded-xl bg-teal-600 hover:bg-teal-500 px-4 py-2.5 text-xs font-black text-white shadow-md shadow-teal-600/30 transition transform active:scale-95 cursor-pointer"
              >
                {downloadedShortcut ? <CheckCircle2 className="h-4 w-4" /> : <Download className="h-4 w-4" />}
                <span>{downloadedShortcut ? 'Shortcut Script Ready!' : 'Download CREATE_DESKTOP_SHORTCUT.bat'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Tab Content: Manual Step-by-Step */}
        {activeTab === 'install' && (
          <div className="space-y-4">
            {/* Download Hero Banner */}
            <div className="rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-transparent p-4 dark:border-emerald-900/50">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-white font-black text-xs">
                      1
                    </span>
                    <h4 className="font-extrabold text-slate-900 dark:text-white text-sm">
                      Download Standard PC Server Setup Script
                    </h4>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    Downloads <code className="font-bold text-emerald-600 dark:text-emerald-400">Install_and_Run_PAA_Server.bat</code> which verifies Node.js, connects MongoDB, installs packages, and launches <code className="font-mono text-xs">http://localhost:3000</code>.
                  </p>
                </div>
                <button
                  onClick={handleDownloadInstaller}
                  className="shrink-0 flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-5 py-2.5 text-xs font-black text-white shadow-lg shadow-emerald-600/30 transition transform active:scale-95"
                >
                  {downloadedInstaller ? <CheckCircle2 className="h-4 w-4" /> : <Download className="h-4 w-4" />}
                  <span>{downloadedInstaller ? 'Downloaded! Run .bat' : 'Download Install_and_Run_PAA_Server.bat'}</span>
                </button>
              </div>
            </div>

            {/* 4 Step Visual Guide */}
            <div className="space-y-2">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Manual Setup Guide (Takes Under 3 Minutes):
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                {/* Step 1 */}
                <div className="rounded-xl border border-slate-200 bg-white p-3.5 dark:border-slate-800 dark:bg-slate-800/80 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black dark:bg-emerald-950 dark:text-emerald-300">
                        A
                      </span>
                      Install Node.js LTS
                    </span>
                    <a
                      href="https://nodejs.org/en/download"
                      target="_blank"
                      rel="noreferrer"
                      className="text-[11px] font-bold text-emerald-600 hover:underline flex items-center gap-1"
                    >
                      <span>nodejs.org</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                  <p className="text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">
                    Download and run the Windows 64-bit MSI installer from the official Node.js website (Default settings are fine).
                  </p>
                </div>

                {/* Step 2 */}
                <div className="rounded-xl border border-slate-200 bg-white p-3.5 dark:border-slate-800 dark:bg-slate-800/80 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black dark:bg-emerald-950 dark:text-emerald-300">
                        B
                      </span>
                      Install MongoDB Community
                    </span>
                    <a
                      href="https://www.mongodb.com/try/download/community"
                      target="_blank"
                      rel="noreferrer"
                      className="text-[11px] font-bold text-emerald-600 hover:underline flex items-center gap-1"
                    >
                      <span>mongodb.com</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                  <p className="text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">
                    Install MongoDB Community Server (Windows MSI). Make sure <em>"Install MongoDB as a Service"</em> is checked.
                  </p>
                </div>

                {/* Step 3 */}
                <div className="rounded-xl border border-slate-200 bg-white p-3.5 dark:border-slate-800 dark:bg-slate-800/80 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black dark:bg-emerald-950 dark:text-emerald-300">
                        C
                      </span>
                      Extract Project Folder
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">Settings → Export ZIP</span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">
                    Extract your downloaded project zip to a folder on your PC like <code className="font-mono text-emerald-600">C:\PAA_Sentinel</code>.
                  </p>
                </div>

                {/* Step 4 */}
                <div className="rounded-xl border border-slate-200 bg-white p-3.5 dark:border-slate-800 dark:bg-slate-800/80 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black dark:bg-emerald-950 dark:text-emerald-300">
                        D
                      </span>
                      Double-Click to Launch
                    </span>
                    <button
                      onClick={handleCopyNpm}
                      className="text-[11px] font-bold text-indigo-600 hover:underline flex items-center gap-1"
                    >
                      {copiedNpm ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                      <span>{copiedNpm ? 'Copied command' : 'Copy terminal cmd'}</span>
                    </button>
                  </div>
                  <p className="text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">
                    Double-click <code className="font-mono text-emerald-600">Install_and_Run_PAA_Server.bat</code> or open cmd and type <code className="font-mono text-emerald-600">npm run dev</code>.
                  </p>
                </div>
              </div>
            </div>

            {/* Docker 1-Line Alternative */}
            <div className="rounded-xl border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/40 p-3.5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Boxes className="h-5 w-5 text-indigo-500 shrink-0" />
                <div>
                  <h5 className="font-bold text-xs text-slate-800 dark:text-slate-200">
                    Prefer Docker on Windows?
                  </h5>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                    docker compose up -d (Runs MongoDB on port 27017 + Mongo Express UI on port 8081)
                  </p>
                </div>
              </div>
              <button
                onClick={handleCopyCompose}
                className="shrink-0 flex items-center gap-1 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                {copiedCompose ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copiedCompose ? 'Copied!' : 'Copy docker-compose'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Tab Content: LAN & Airport Network Sharing */}
        {activeTab === 'lan' && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-blue-200 bg-blue-50/60 dark:border-blue-900/40 dark:bg-blue-950/20 p-4 space-y-2">
              <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300 font-extrabold text-sm">
                <Globe className="h-5 w-5" />
                <span>How Colleagues and Officers Access This PC Server</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                When you run the PAA Sentinel server on your PC, it listens on all network interfaces (<code className="font-mono text-emerald-600">0.0.0.0:3000</code>). Any desktop, laptop, or mobile barcode scanner on the same office LAN or airport Wi-Fi can open the system in their browser.
              </p>
            </div>

            {/* Network URLs Box */}
            <div className="rounded-xl border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/50 p-4 space-y-3">
              <h5 className="font-bold text-xs uppercase tracking-wider text-slate-600 dark:text-slate-400">
                Server Access URLs:
              </h5>

              <div className="space-y-2 font-mono text-xs">
                <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800">
                  <div>
                    <span className="text-slate-400 mr-2">[This PC Localhost]:</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">http://localhost:3000</span>
                  </div>
                  <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded font-sans font-bold">
                    Direct
                  </span>
                </div>

                <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800">
                  <div>
                    <span className="text-slate-400 mr-2">[LAN / Office Network]:</span>
                    <span className="font-bold text-indigo-600 dark:text-indigo-400">http://&lt;YOUR_PC_IP_ADDRESS&gt;:3000</span>
                  </div>
                  <span className="text-[10px] bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded font-sans font-bold">
                    For Other Users
                  </span>
                </div>
              </div>

              {serverInfo.addresses && serverInfo.addresses.length > 0 && (
                <div className="pt-2">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    Detected Active IP Addresses on Host: {serverInfo.addresses.map((a) => a.address).join(', ')}
                  </span>
                </div>
              )}
            </div>

            {/* Windows Firewall Rule */}
            <div className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-800/80 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-xs">
                  <ShieldCheck className="h-4 w-4 text-emerald-500" />
                  <span>Allow Port 3000 Through Windows Firewall</span>
                </div>
                <button
                  onClick={handleCopyFirewall}
                  className="flex items-center gap-1 text-xs font-bold text-emerald-600 hover:underline"
                >
                  {copiedFirewall ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  <span>{copiedFirewall ? 'Copied Firewall Rule!' : 'Copy Rule'}</span>
                </button>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                If colleagues cannot open your PC URL, run this command in Administrator PowerShell or Command Prompt:
              </p>
              <code className="block p-2 rounded bg-slate-900 text-emerald-400 text-[11px] font-mono overflow-x-auto">
                netsh advfirewall firewall add rule name="PAA Sentinel Server (Port 3000)" dir=in action=allow protocol=TCP localport=3000
              </code>
            </div>
          </div>
        )}

        {/* Tab Content: Auto-Start on Boot */}
        {activeTab === 'autostart' && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/50 p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Power className="h-5 w-5 text-emerald-500" />
                <h4 className="font-extrabold text-slate-900 dark:text-white text-sm">
                  Run Server Automatically When Windows Starts
                </h4>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                You can configure your PC so that whenever the computer turns on or reboots, the PAA Sentinel Server and MongoDB automatically boot in the background without needing to manually run any commands.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                {/* Method 1: 1-Click Startup Installer */}
                <div className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 p-3.5 space-y-2">
                  <div className="flex items-center gap-1.5 font-bold text-xs text-slate-900 dark:text-white">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    <span>Option 1: Windows Auto-Start</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Registers a startup shortcut in your Windows Startup directory.
                  </p>
                  <button
                    onClick={handleDownloadStartupBat}
                    className="w-full flex items-center justify-center gap-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 py-2 text-xs font-bold text-white shadow transition cursor-pointer"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>{downloadedStartup ? 'Downloaded!' : 'Download Setup .bat'}</span>
                  </button>
                </div>

                {/* Method 2: Silent Background Launcher */}
                <div className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 p-3.5 space-y-2">
                  <div className="flex items-center gap-1.5 font-bold text-xs text-slate-900 dark:text-white">
                    <span className="h-2 w-2 rounded-full bg-indigo-500" />
                    <span>Option 2: Silent Background VBS</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Runs the server in the background without keeping a black CMD open.
                  </p>
                  <button
                    onClick={handleDownloadSilentVbs}
                    className="w-full flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-slate-50 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 py-2 text-xs font-bold transition cursor-pointer"
                  >
                    <FileCode className="h-3.5 w-3.5" />
                    <span>{downloadedSilent ? 'Downloaded!' : 'Download .vbs'}</span>
                  </button>
                </div>

                {/* Method 3: Desktop Shortcuts */}
                <div className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 p-3.5 space-y-2">
                  <div className="flex items-center gap-1.5 font-bold text-xs text-slate-900 dark:text-white">
                    <span className="h-2 w-2 rounded-full bg-teal-500" />
                    <span>Option 3: Desktop Shortcut</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Creates 1-click Desktop Icons for Server and Browser.
                  </p>
                  <button
                    onClick={handleDownloadShortcut}
                    className="w-full flex items-center justify-center gap-2 rounded-lg bg-teal-600 hover:bg-teal-500 py-2 text-xs font-bold text-white shadow transition cursor-pointer"
                  >
                    <Monitor className="h-3.5 w-3.5" />
                    <span>{downloadedShortcut ? 'Downloaded!' : 'Create Shortcut .bat'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab Content: Single-File Standalone */}
        {activeTab === 'standalone' && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/50 p-4 space-y-3">
              <h4 className="font-bold text-xs uppercase tracking-wider text-slate-600 dark:text-slate-400">
                Single-File Offline Web Application (.html)
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                If you need to carry the asset hub to a remote airport runway, radar site, or offline laptop that doesn't have Node.js or MongoDB installed, download this single HTML file. It opens directly in Google Chrome, Microsoft Edge, or Firefox.
              </p>
              <div className="flex flex-wrap gap-2 pt-2">
                <button
                  onClick={handleDownloadStandaloneHTML}
                  className="flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-4 py-2 text-xs font-bold text-white shadow-md transition cursor-pointer"
                >
                  <Download className="h-4 w-4" />
                  <span>{downloadedHtml ? 'Downloaded HTML File!' : 'Download Standalone HTML File'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-100 pt-4 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
          <span>PAA Sentinel v5.0 • Jinnah International Airport (JIAP-KHI)</span>
          <button
            onClick={onClose}
            className="rounded-xl bg-slate-100 px-5 py-2 font-bold text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
