import React, { useState, useEffect } from 'react';
import {
  Smartphone,
  QrCode,
  Copy,
  Check,
  X,
  ExternalLink,
  Share2,
  PlusSquare,
  Shield,
  Layers,
  Sparkles,
  Wifi,
  MonitorSmartphone,
  Info,
} from 'lucide-react';
import { generateQRMatrix } from '../utils/barcodeQrGenerator';

interface MobileConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MobileConnectModal: React.FC<MobileConnectModalProps> = ({ isOpen, onClose }) => {
  const [currentUrl, setCurrentUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'scan' | 'ios' | 'android'>('scan');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setCurrentUrl(window.location.href);
    }
  }, []);

  if (!isOpen) return null;

  // Generate QR Code matrix for current URL
  const qrMatrix = currentUrl ? generateQRMatrix(currentUrl) : [];
  const matrixSize = qrMatrix.length || 29;
  const cellSize = 5;
  const svgSize = matrixSize * cellSize;

  const handleCopy = () => {
    if (!currentUrl) return;
    navigator.clipboard.writeText(currentUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white shadow-md shadow-emerald-500/20">
              <Smartphone className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Open on Mobile & Smartphone
                </h3>
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300">
                  PWA Ready
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Scan QR code or install as mobile app on Android & iOS
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="mt-4 flex rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
          <button
            onClick={() => setActiveTab('scan')}
            className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-bold transition ${
              activeTab === 'scan'
                ? 'bg-white text-emerald-700 shadow-xs dark:bg-slate-700 dark:text-emerald-400'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-300'
            }`}
          >
            <QrCode className="h-4 w-4" />
            <span>Scan QR Code</span>
          </button>
          <button
            onClick={() => setActiveTab('android')}
            className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-bold transition ${
              activeTab === 'android'
                ? 'bg-white text-emerald-700 shadow-xs dark:bg-slate-700 dark:text-emerald-400'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-300'
            }`}
          >
            <Smartphone className="h-4 w-4 text-emerald-500" />
            <span>Android Setup</span>
          </button>
          <button
            onClick={() => setActiveTab('ios')}
            className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-bold transition ${
              activeTab === 'ios'
                ? 'bg-white text-emerald-700 shadow-xs dark:bg-slate-700 dark:text-emerald-400'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-300'
            }`}
          >
            <Share2 className="h-4 w-4 text-sky-500" />
            <span>iOS (iPhone) Setup</span>
          </button>
        </div>

        {/* Tab 1: Scan QR Code */}
        {activeTab === 'scan' && (
          <div className="mt-5 space-y-4 text-center">
            <div className="mx-auto flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-emerald-300 bg-emerald-50/50 p-5 dark:border-emerald-800/80 dark:bg-emerald-950/20 max-w-xs">
              <div className="rounded-xl bg-white p-3 shadow-md dark:bg-white">
                <svg
                  width={svgSize}
                  height={svgSize}
                  viewBox={`0 0 ${svgSize} ${svgSize}`}
                  className="mx-auto"
                >
                  <rect width={svgSize} height={svgSize} fill="#ffffff" />
                  {qrMatrix.map((row, rIdx) =>
                    row.map((isDark, cIdx) =>
                      isDark ? (
                        <rect
                          key={`${rIdx}-${cIdx}`}
                          x={cIdx * cellSize}
                          y={rIdx * cellSize}
                          width={cellSize}
                          height={cellSize}
                          fill="#0f172a"
                        />
                      ) : null
                    )
                  )}
                </svg>
              </div>
              <span className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 dark:text-emerald-300">
                <Sparkles className="h-3.5 w-3.5 text-emerald-500" />
                Scan with phone camera or QR scanner
              </span>
              <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                Instantly opens PAA Sentinel v5.0 on your phone
              </p>
            </div>

            {/* Direct Link Field */}
            <div className="space-y-1.5 text-left">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Direct Mobile URL
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={currentUrl}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-mono text-slate-700 outline-none select-all dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                />
                <button
                  onClick={handleCopy}
                  className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition shrink-0 shadow-xs ${
                    copied
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white'
                  }`}
                >
                  {copied ? (
                    <>
                      <Check className="h-4 w-4" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Android Instructions */}
        {activeTab === 'android' && (
          <div className="mt-5 space-y-3.5">
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-3 text-xs text-emerald-900 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300 flex items-start gap-2.5">
              <Smartphone className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
              <div>
                <p className="font-bold">Android Chrome PWA Installation</p>
                <p className="text-[11px] opacity-90 mt-0.5">
                  Allows you to launch PAA Sentinel as a full-screen app with offline caching and instant home screen access.
                </p>
              </div>
            </div>

            <ol className="space-y-3 text-xs">
              <li className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-800/60">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-xs font-black text-white">
                  1
                </span>
                <div>
                  <strong className="text-slate-900 dark:text-white">Open in Google Chrome</strong>
                  <p className="text-slate-500 dark:text-slate-400 mt-0.5 text-[11px]">
                    Open this URL in Google Chrome on your Android mobile device.
                  </p>
                </div>
              </li>

              <li className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-800/60">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-xs font-black text-white">
                  2
                </span>
                <div>
                  <strong className="text-slate-900 dark:text-white">Tap Menu (⋮)</strong>
                  <p className="text-slate-500 dark:text-slate-400 mt-0.5 text-[11px]">
                    Tap the 3 dots in the top right corner of Chrome.
                  </p>
                </div>
              </li>

              <li className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-800/60">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-xs font-black text-white">
                  3
                </span>
                <div>
                  <strong className="text-slate-900 dark:text-white">Select "Install app" or "Add to Home screen"</strong>
                  <p className="text-slate-500 dark:text-slate-400 mt-0.5 text-[11px]">
                    Chrome will prompt you with the PAA Sentinel app icon and title. Tap <strong>Install</strong>.
                  </p>
                </div>
              </li>
            </ol>
          </div>
        )}

        {/* Tab 3: iOS Instructions */}
        {activeTab === 'ios' && (
          <div className="mt-5 space-y-3.5">
            <div className="rounded-xl border border-sky-200 bg-sky-50/70 p-3 text-xs text-sky-900 dark:border-sky-900/60 dark:bg-sky-950/40 dark:text-sky-300 flex items-start gap-2.5">
              <Share2 className="h-4 w-4 text-sky-600 mt-0.5 shrink-0" />
              <div>
                <p className="font-bold">Apple iPhone & iPad (Safari) Installation</p>
                <p className="text-[11px] opacity-90 mt-0.5">
                  Apple Safari provides native home screen installation without requiring the App Store.
                </p>
              </div>
            </div>

            <ol className="space-y-3 text-xs">
              <li className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-800/60">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-sky-600 text-xs font-black text-white">
                  1
                </span>
                <div>
                  <strong className="text-slate-900 dark:text-white">Open in Safari</strong>
                  <p className="text-slate-500 dark:text-slate-400 mt-0.5 text-[11px]">
                    Open the web app link in Apple Safari on your iPhone or iPad.
                  </p>
                </div>
              </li>

              <li className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-800/60">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-sky-600 text-xs font-black text-white">
                  2
                </span>
                <div>
                  <strong className="text-slate-900 dark:text-white">Tap Share Button</strong>
                  <p className="text-slate-500 dark:text-slate-400 mt-0.5 text-[11px]">
                    Tap the iOS Share icon (a square box with an arrow pointing upward) at the bottom toolbar.
                  </p>
                </div>
              </li>

              <li className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-800/60">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-sky-600 text-xs font-black text-white">
                  3
                </span>
                <div>
                  <strong className="text-slate-900 dark:text-white">Tap "Add to Home Screen"</strong>
                  <p className="text-slate-500 dark:text-slate-400 mt-0.5 text-[11px]">
                    Scroll down the share sheet and select <strong>Add to Home Screen</strong>, then tap <strong>Add</strong> in the top right.
                  </p>
                </div>
              </li>
            </ol>
          </div>
        )}

        {/* Mobile Viewport Feature Highlights */}
        <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs dark:border-slate-800 dark:bg-slate-800/40">
          <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-200 text-[11px]">
            <MonitorSmartphone className="h-4 w-4 text-emerald-500" />
            <span>Mobile-First Optimizations Included:</span>
          </div>
          <div className="mt-2 grid grid-cols-2 gap-2 text-[10px] text-slate-600 dark:text-slate-300">
            <div className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              <span>Bottom Thumb Navigation Bar</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              <span>Full Slide-over Module Drawer</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              <span>Touch-friendly 44px+ controls</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              <span>Offline & Standalone App mode</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-5 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-xl bg-slate-900 px-5 py-2 text-xs font-bold text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
