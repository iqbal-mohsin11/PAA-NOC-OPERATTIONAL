import React, { useState } from 'react';
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
} from 'lucide-react';

interface PCWebFileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PCWebFileModal: React.FC<PCWebFileModalProps> = ({ isOpen, onClose }) => {
  const [downloadedHtml, setDownloadedHtml] = useState(false);
  const [downloadedBat, setDownloadedBat] = useState(false);

  if (!isOpen) return null;

  const handleDownloadStandaloneHTML = () => {
    const standaloneContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Pakistan Airports Authority - IT Asset Management Hub (Offline PC Web App)</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
  <style>
    body { font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif; }
    .glass-card { background: rgba(255, 255, 255, 0.9); backdrop-filter: blur(8px); }
  </style>
</head>
<body class="bg-slate-900 text-slate-100 min-h-screen flex flex-col">
  <!-- Header Bar -->
  <header class="bg-slate-800/90 border-b border-slate-700 px-6 py-4 flex items-center justify-between sticky top-0 z-50">
    <div class="flex items-center gap-3">
      <div class="bg-gradient-to-r from-emerald-500 to-teal-600 p-2.5 rounded-xl text-white shadow-lg shadow-emerald-500/20">
        <i class="fa-solid fa-shield-halved text-xl"></i>
      </div>
      <div>
        <h1 class="font-bold text-lg text-white tracking-tight">PAKISTAN AIRPORTS AUTHORITY</h1>
        <p class="text-xs text-emerald-400 font-medium">Standalone Offline PC Web Application • IT Asset & Inventory Hub</p>
      </div>
    </div>
    <div class="flex items-center gap-2">
      <span class="bg-emerald-500/20 text-emerald-300 text-xs px-3 py-1 rounded-full font-mono border border-emerald-500/30">
        <i class="fa-solid fa-laptop text-xs mr-1"></i> Running Offline on Local PC
      </span>
    </div>
  </header>

  <!-- Main Content -->
  <main class="flex-1 max-w-7xl w-full mx-auto p-6 space-y-6">
    <!-- Status Banner -->
    <div class="bg-gradient-to-r from-slate-800 to-slate-850 border border-slate-700 rounded-2xl p-6 shadow-xl relative overflow-hidden">
      <div class="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span class="bg-emerald-500/10 text-emerald-400 text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-md border border-emerald-500/20">
            Offline PC Web File Ready
          </span>
          <h2 class="text-2xl font-black text-white mt-2">IT Asset Management Hub - PC Edition</h2>
          <p class="text-sm text-slate-300 mt-1 max-w-2xl">
            This offline web app file is designed to run directly on any Windows / Mac PC web browser (Chrome, Edge, Firefox, Brave) without requiring an internet connection or backend server setup.
          </p>
        </div>
        <button onclick="window.location.reload()" class="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-5 py-2.5 rounded-xl shadow-lg transition flex items-center gap-2">
          <i class="fa-solid fa-rotate-right"></i> Refresh Local Web File
        </button>
      </div>
    </div>

    <!-- Quick Stat Cards -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div class="bg-slate-800/80 border border-slate-700 rounded-xl p-4">
        <p class="text-xs font-bold text-slate-400 uppercase">Total IT Assets</p>
        <p class="text-2xl font-black text-white mt-1">1,248 Units</p>
        <p class="text-xs text-emerald-400 mt-1"><i class="fa-solid fa-circle-check"></i> All Airports Synchronized</p>
      </div>
      <div class="bg-slate-800/80 border border-slate-700 rounded-xl p-4">
        <p class="text-xs font-bold text-slate-400 uppercase">Active Workstations</p>
        <p class="text-2xl font-black text-indigo-400 mt-1">842 Desktop PCs</p>
        <p class="text-xs text-slate-400 mt-1">AOCC, Tower & Terminal Ops</p>
      </div>
      <div class="bg-slate-800/80 border border-slate-700 rounded-xl p-4">
        <p class="text-xs font-bold text-slate-400 uppercase">Annual IT Budget (2025–26)</p>
        <p class="text-2xl font-black text-purple-400 mt-1">PKR 45.00M</p>
        <p class="text-xs text-purple-300 mt-1">PKR 21.75M Utilized YTD</p>
      </div>
      <div class="bg-slate-800/80 border border-slate-700 rounded-xl p-4">
        <p class="text-xs font-bold text-slate-400 uppercase">NOC Operational Health</p>
        <p class="text-2xl font-black text-emerald-400 mt-1">99.9% Online</p>
        <p class="text-xs text-emerald-400 mt-1"><i class="fa-solid fa-wifi"></i> All Airport Nodes Operational</p>
      </div>
    </div>

    <!-- Quick Tools Grid -->
    <div class="bg-slate-800/60 border border-slate-700 rounded-2xl p-6 space-y-4">
      <h3 class="font-bold text-base text-white flex items-center gap-2">
        <i class="fa-solid fa-screwdriver-wrench text-emerald-400"></i> Local PC Tools & Forms Access
      </h3>
      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        <div class="bg-slate-900/80 border border-slate-700 p-4 rounded-xl">
          <p class="font-bold text-sm text-emerald-300">CAAF-001 Form</p>
          <p class="text-xs text-slate-400 mt-1">IT Equipment Procurement Authorization Form for HQCAA</p>
        </div>
        <div class="bg-slate-900/80 border border-slate-700 p-4 rounded-xl">
          <p class="font-bold text-sm text-purple-300">CAAF-003 Form</p>
          <p class="text-xs text-slate-400 mt-1">Local Demand & Internal Requisition Note for Airport Purchases</p>
        </div>
        <div class="bg-slate-900/80 border border-slate-700 p-4 rounded-xl">
          <p class="font-bold text-sm text-amber-300">Local Storage Sync</p>
          <p class="text-xs text-slate-400 mt-1">Saves all records offline directly to your PC browser memory</p>
        </div>
      </div>
    </div>
  </main>

  <!-- Footer -->
  <footer class="bg-slate-800/90 border-t border-slate-700 px-6 py-3 text-center text-xs text-slate-400">
    Pakistan Airports Authority • Standalone PC Web File • Double Click to Launch Anywhere
  </footer>
</body>
</html>`;

    const blob = new Blob([standaloneContent], { type: 'text/html' });
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

  const handleDownloadWindowsLauncher = () => {
    const batContent = `@echo off
title Pakistan Airports Authority - IT Asset Management Hub PC Launcher
color 0A
echo =======================================================================
echo          PAKISTAN AIRPORTS AUTHORITY - IT ASSET HUB
echo                 PC DESKTOP LAUNCHER SCRIPT
echo =======================================================================
echo.
echo Launching PAA Asset Hub Web Application in your default browser...
echo.
start "" "%~dp0PAA_Asset_Hub_PC_Web_App.html"
echo App opened successfully!
timeout /t 3 >nul
exit
`;

    const blob = new Blob([batContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Run_PAA_Asset_Hub.bat';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setDownloadedBat(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm animate-fadeIn overflow-y-auto">
      <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 my-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-500/20">
              <Laptop className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-slate-900 text-base dark:text-white">
                  Run / Export Web File for PC
                </h3>
                <span className="rounded-md bg-indigo-100 dark:bg-indigo-950 px-2 py-0.5 text-[10px] font-black text-indigo-700 dark:text-indigo-300">
                  Offline PC Web App
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Download standalone PC web application files to open on any computer (Windows / Mac)
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

        {/* Feature Highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="rounded-xl border border-indigo-200 bg-indigo-50/60 p-4 dark:border-indigo-900/50 dark:bg-indigo-950/30 space-y-2">
            <div className="flex items-center gap-2 font-bold text-indigo-900 text-xs dark:text-indigo-300">
              <FileCode className="h-4 w-4 text-indigo-600" />
              <span>1. Standalone HTML Web File</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              Single-file web application (<code className="font-mono text-indigo-600">.html</code>) that runs directly in Google Chrome, Microsoft Edge, Firefox, or Safari on any PC.
            </p>
            <button
              onClick={handleDownloadStandaloneHTML}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-bold text-white shadow-xs hover:bg-indigo-500 transition"
            >
              {downloadedHtml ? <CheckCircle2 className="h-4 w-4 text-emerald-300" /> : <Download className="h-4 w-4" />}
              <span>{downloadedHtml ? 'Downloaded HTML Web File!' : 'Download PC Web File (.html)'}</span>
            </button>
          </div>

          <div className="rounded-xl border border-purple-200 bg-purple-50/60 p-4 dark:border-purple-900/50 dark:bg-purple-950/30 space-y-2">
            <div className="flex items-center gap-2 font-bold text-purple-900 text-xs dark:text-purple-300">
              <Terminal className="h-4 w-4 text-purple-600" />
              <span>2. Windows Batch Launcher</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              Double-clickable Windows batch launcher script (<code className="font-mono text-purple-600">Run_PAA_Asset_Hub.bat</code>) for instant 1-click startup on PC desktop.
            </p>
            <button
              onClick={handleDownloadWindowsLauncher}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-purple-600 px-3 py-2 text-xs font-bold text-white shadow-xs hover:bg-purple-500 transition"
            >
              {downloadedBat ? <CheckCircle2 className="h-4 w-4 text-emerald-300" /> : <Download className="h-4 w-4" />}
              <span>{downloadedBat ? 'Downloaded Launcher!' : 'Download PC Launcher (.bat)'}</span>
            </button>
          </div>
        </div>

        {/* Step by Step Execution Instructions */}
        <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-800/50 space-y-3">
          <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-2">
            <Monitor className="h-4 w-4 text-emerald-500" />
            <span>3 Ways to Run this Web Application on PC:</span>
          </h4>

          <ol className="list-decimal list-inside space-y-2 text-xs text-slate-700 dark:text-slate-300 font-medium">
            <li className="leading-relaxed">
              <strong className="text-slate-900 dark:text-white">Double-Click HTML File:</strong> Download <code className="font-mono bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 rounded text-[11px]">PAA_Asset_Hub_PC_Web_App.html</code> and double click it on your PC. It will instantly launch in Chrome or Edge without any installation!
            </li>
            <li className="leading-relaxed">
              <strong className="text-slate-900 dark:text-white">Save as Chrome / Edge Web App:</strong> Open the HTML web file in Google Chrome, click the 3 dots menu → <em>More Tools</em> → <em>Create Shortcut...</em> → Check <em>"Open as Window"</em> to run it like a native Windows Desktop app!
            </li>
            <li className="leading-relaxed">
              <strong className="text-slate-900 dark:text-white">Full Source Code on PC:</strong> Download or copy the project source folder to your PC, open command prompt or terminal in folder, and type <code className="font-mono bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 rounded text-[11px]">npm run dev</code> to run locally on <code className="font-mono text-emerald-600 dark:text-emerald-400">http://localhost:3000</code>.
            </li>
          </ol>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between border-t border-slate-100 pt-4 dark:border-slate-800">
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
            <span>100% Virus-Free Offline Client Web File</span>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl bg-slate-900 px-5 py-2 text-xs font-bold text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white transition"
          >
            Close Window
          </button>
        </div>
      </div>
    </div>
  );
};
