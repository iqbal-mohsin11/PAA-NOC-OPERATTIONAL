import React, { useState, useRef } from 'react';
import { useInventory } from '../context/InventoryContext';
import { AssetItem } from '../types/inventory';
import {
  QrCode,
  Printer,
  X,
  Download,
  Copy,
  Check,
  Sparkles,
  Sliders,
  Maximize2,
  FileCode,
  Layers,
  Search,
  CheckCircle2,
  Tag,
  Scan,
} from 'lucide-react';
import { generateCode128Bars, generateQRMatrix } from '../utils/barcodeQrGenerator';

interface BarcodeModalProps {
  initialAsset?: AssetItem | null;
  onClose: () => void;
}

export type LabelFormat = 'standard' | 'compact' | 'logistics' | 'custom';

export const BarcodeModal: React.FC<BarcodeModalProps> = ({ initialAsset, onClose }) => {
  const { assets } = useInventory();
  const [selectedAssetId, setSelectedAssetId] = useState(initialAsset?.id || assets[0]?.id || '');
  const [labelFormat, setLabelFormat] = useState<LabelFormat>('standard');
  const [copied, setCopied] = useState(false);
  const [customText, setCustomText] = useState('PAA-AST-10001');
  const [useCustomText, setUseCustomText] = useState(false);
  const [qrSize, setQrSize] = useState<number>(120);
  const [barcodeHeight, setBarcodeHeight] = useState<number>(48);
  const [showQrPayload, setShowQrPayload] = useState(true);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const printAreaRef = useRef<HTMLDivElement>(null);

  const formatLocation = (loc: any): string => {
    if (!loc) return 'AOCC Terminal';
    if (typeof loc === 'string') return loc;
    if (typeof loc === 'object') {
      const parts = [loc.building, loc.floor, loc.room].filter(Boolean);
      return parts.length > 0 ? parts.join(', ') : 'AOCC Terminal';
    }
    return String(loc);
  };

  const asset = assets.find((a) => a.id === selectedAssetId) || initialAsset || assets[0];

  // Active barcode and QR payload string
  const activeBarcodeValue = useCustomText ? customText : asset?.barcode || '10001849201';
  const activeAssetId = useCustomText ? customText : asset?.id || 'PAA-AST-10001';
  const activeQrPayload = useCustomText
    ? `PAA-SENTINEL-VAL:${customText}`
    : JSON.stringify({
        sys: 'PAA-SENTINEL-v5',
        id: asset?.id || 'PAA-AST-10001',
        tag: asset?.assetTag || 'TAG-001',
        sn: asset?.serialNumber || 'SN-001',
        dept: asset?.department || 'IT/CNS',
        loc: formatLocation(asset?.location),
        bc: asset?.barcode || '10001849201',
      });

  // Generate real vector Code 128 bars
  const { bars, totalWidth } = generateCode128Bars(activeBarcodeValue, 2);

  // Generate real QR matrix
  const qrMatrix = generateQRMatrix(activeQrPayload);

  const handlePrint = () => {
    window.print();
  };

  const handleCopyPayload = () => {
    navigator.clipboard.writeText(activeQrPayload);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadSVG = () => {
    if (!printAreaRef.current) return;
    const svgData = printAreaRef.current.innerHTML;
    const blob = new Blob([`<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400"><foreignObject width="100%" height="100%">${svgData}</foreignObject></svg>`], {
      type: 'image/svg+xml;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `PAA_Tag_${activeAssetId}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm overflow-y-auto print:p-0 print:bg-white animate-fadeIn">
      <div className="relative w-full max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 print:shadow-none print:border-none print:p-0 my-auto">
        
        {/* Header (Hidden in print) */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800 print:hidden">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/20">
              <Scan className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-slate-900 text-base dark:text-white">
                  PAA Property QR & Barcode Generator
                </h3>
                <span className="rounded-full bg-emerald-100 dark:bg-emerald-950/70 px-2.5 py-0.5 text-[10px] font-black text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  100% Scan Compliant
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                True Code 128 & 2D QR matrix engine formatted for thermal label printers (Zebra, TSC, Brother, Xprinter).
              </p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Configuration Controls (Hidden in Print) */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 print:hidden">
          {/* Left Column: Asset Selection or Custom Mode */}
          <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 dark:border-slate-800 dark:bg-slate-800/40">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Tag className="h-3.5 w-3.5 text-cyan-600" />
                <span>Target Asset / Data Source</span>
              </label>
              <button
                type="button"
                onClick={() => setUseCustomText(!useCustomText)}
                className="text-[11px] font-bold text-cyan-600 hover:text-cyan-500 underline"
              >
                {useCustomText ? 'Switch to Asset List' : 'Custom Barcode Input'}
              </button>
            </div>

            {useCustomText ? (
              <div>
                <input
                  type="text"
                  value={customText}
                  onChange={(e) => setCustomText(e.target.value)}
                  placeholder="e.g. PAA-AST-10045 or Serial Number"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-mono dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                />
                <p className="text-[10px] text-slate-400 mt-1">Type any code, asset ID, or serial to generate instant vector barcode & QR.</p>
              </div>
            ) : (
              <select
                value={selectedAssetId}
                onChange={(e) => setSelectedAssetId(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white p-2 text-xs font-mono dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
              >
                {assets.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.id} • {a.name} ({a.department})
                  </option>
                ))}
              </select>
            )}

            {/* Label Layout Format Selector */}
            <div>
              <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                Sticker Size & Thermal Template:
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { id: 'standard', name: 'Standard (3"x2")', desc: 'Asset Property Tag' },
                  { id: 'compact', name: 'Compact (2"x1")', desc: 'Micro Device Tag' },
                  { id: 'logistics', name: 'Carton (4"x6")', desc: 'Logistics Carton' },
                ].map((fmt) => (
                  <button
                    key={fmt.id}
                    type="button"
                    onClick={() => setLabelFormat(fmt.id as LabelFormat)}
                    className={`rounded-lg border px-2 py-1.5 text-center text-xs font-bold transition ${
                      labelFormat === fmt.id
                        ? 'border-cyan-500 bg-cyan-50 text-cyan-800 dark:bg-cyan-950/60 dark:text-cyan-300'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400'
                    }`}
                  >
                    <div>{fmt.name}</div>
                    <div className="text-[9px] font-normal text-slate-400 truncate">{fmt.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Graphic Sizing & Scannability */}
          <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 dark:border-slate-800 dark:bg-slate-800/40">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
              <span className="flex items-center gap-1.5">
                <Sliders className="h-3.5 w-3.5 text-indigo-600" />
                <span>Vector Dimensions</span>
              </span>
              <span className="text-[10px] font-mono text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded font-bold">
                Code 128 + 2D Matrix
              </span>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-600 dark:text-slate-400">QR Code Size:</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{qrSize}px</span>
              </div>
              <input
                type="range"
                min="80"
                max="160"
                value={qrSize}
                onChange={(e) => setQrSize(parseInt(e.target.value, 10))}
                className="w-full accent-cyan-600"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-600 dark:text-slate-400">Barcode Height:</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{barcodeHeight}px</span>
              </div>
              <input
                type="range"
                min="30"
                max="70"
                value={barcodeHeight}
                onChange={(e) => setBarcodeHeight(parseInt(e.target.value, 10))}
                className="w-full accent-cyan-600"
              />
            </div>

            <div className="pt-1 flex items-center justify-between text-xs">
              <button
                type="button"
                onClick={handleCopyPayload}
                className="flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-500"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copied ? 'Copied QR Payload!' : 'Copy Raw QR Payload'}</span>
              </button>
              <button
                type="button"
                onClick={handleDownloadSVG}
                className="flex items-center gap-1 text-[11px] font-bold text-cyan-600 hover:text-cyan-500"
              >
                <Download className="h-3.5 w-3.5" />
                <span>{downloadSuccess ? 'Downloaded SVG!' : 'Download Vector Tag (.svg)'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Printable Label Sticker Card (Interactive Live Canvas) */}
        <div className="mt-6 flex flex-col items-center justify-center print:mt-0" ref={printAreaRef}>
          {labelFormat === 'standard' && (
            <div className="w-[360px] rounded-2xl border-2 border-slate-950 bg-white p-4 shadow-xl text-slate-950 font-sans print:w-full print:border-2 print:border-black print:shadow-none">
              {/* Header Bar */}
              <div className="flex items-center justify-between border-b-2 border-slate-950 pb-2">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded bg-emerald-800 text-white font-black text-xs shadow-xs">
                    PAA
                  </div>
                  <div>
                    <div className="font-black text-[12px] uppercase tracking-wide leading-tight">PAKISTAN AIRPORTS AUTHORITY</div>
                    <div className="text-[9px] font-bold text-emerald-800">OFFICIAL IT ASSET PROPERTY TAG</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-mono font-black text-xs text-slate-950">{activeAssetId}</div>
                  <div className="text-[8px] font-bold text-slate-500 uppercase">{asset?.department || 'IT/CNS'}</div>
                </div>
              </div>

              {/* Title & Specs */}
              <div className="mt-2.5">
                <div className="text-xs font-black uppercase text-slate-950 truncate">
                  {useCustomText ? customText : asset?.name || 'Enterprise IT Workstation'}
                </div>
                <div className="flex justify-between text-[9px] font-bold text-slate-700 mt-0.5">
                  <span>SN: <strong className="font-mono text-slate-950">{asset?.serialNumber || 'SN-78492019'}</strong></span>
                  <span>LOC: <strong className="text-slate-950">{formatLocation(asset?.location)}</strong></span>
                </div>
              </div>

              {/* Barcode & QR Code Center Matrix */}
              <div className="my-3 flex items-center justify-between gap-3 rounded-xl border border-slate-300 bg-slate-50/90 p-3">
                {/* Real 2D QR Code SVG */}
                <div className="flex flex-col items-center">
                  <svg
                    width={qrSize}
                    height={qrSize}
                    viewBox={`0 0 ${qrMatrix.length} ${qrMatrix.length}`}
                    className="bg-white p-1 rounded border border-slate-300 shadow-2xs"
                  >
                    {qrMatrix.map((row, rIdx) =>
                      row.map((isDark, cIdx) =>
                        isDark ? (
                          <rect
                            key={`${rIdx}-${cIdx}`}
                            x={cIdx}
                            y={rIdx}
                            width="1"
                            height="1"
                            fill="#020617"
                          />
                        ) : null
                      )
                    )}
                  </svg>
                  <span className="text-[7px] font-mono font-bold text-slate-500 mt-1 uppercase">2D QR Matrix</span>
                </div>

                {/* Real Code 128 Barcode Vector */}
                <div className="flex-1 flex flex-col items-center">
                  <div className="font-mono text-xs font-black tracking-widest text-slate-950">{activeBarcodeValue}</div>
                  <div className="w-full overflow-hidden flex justify-center py-1">
                    <svg
                      width={totalWidth}
                      height={barcodeHeight}
                      viewBox={`0 0 ${totalWidth} ${barcodeHeight}`}
                      className="w-full max-w-[200px]"
                    >
                      <rect width="100%" height="100%" fill="#ffffff" />
                      {bars.map((bar, bIdx) => (
                        <rect
                          key={bIdx}
                          x={bar.x}
                          y="0"
                          width={bar.width}
                          height={barcodeHeight}
                          fill="#020617"
                        />
                      ))}
                    </svg>
                  </div>
                  <div className="text-[8px] font-mono font-bold text-slate-600 mt-0.5">
                    TAG: {asset?.assetTag || 'PAA-TAG-8921'}
                  </div>
                </div>
              </div>

              {/* Tag Footer Note */}
              <div className="flex items-center justify-between border-t border-slate-200 pt-1.5 text-[8px] font-bold text-slate-600">
                <span>DO NOT REMOVE OR TAMPER</span>
                <span className="font-mono text-emerald-800">PAA SENTINEL v5.0</span>
              </div>
            </div>
          )}

          {labelFormat === 'compact' && (
            <div className="w-[280px] rounded-xl border-2 border-slate-950 bg-white p-3 shadow-xl text-slate-950 font-sans print:w-full print:border-2 print:border-black">
              <div className="flex items-center justify-between border-b border-slate-950 pb-1">
                <span className="font-black text-[10px] uppercase tracking-wider text-emerald-900">PAA PROPERTY</span>
                <span className="font-mono font-bold text-[10px]">{activeAssetId}</span>
              </div>
              <div className="my-2 flex items-center justify-center gap-3">
                <svg
                  width="70"
                  height="70"
                  viewBox={`0 0 ${qrMatrix.length} ${qrMatrix.length}`}
                  className="bg-white p-0.5 rounded border border-slate-300"
                >
                  {qrMatrix.map((row, rIdx) =>
                    row.map((isDark, cIdx) =>
                      isDark ? <rect key={`${rIdx}-${cIdx}`} x={cIdx} y={rIdx} width="1" height="1" fill="#000000" /> : null
                    )
                  )}
                </svg>
                <div className="text-left text-[9px] font-bold">
                  <div className="truncate max-w-[140px] font-black">{asset?.name || customText}</div>
                  <div className="font-mono text-slate-600">{asset?.serialNumber || 'SN-100293'}</div>
                  <div className="font-mono text-[8px] text-emerald-700">{activeBarcodeValue}</div>
                </div>
              </div>
            </div>
          )}

          {labelFormat === 'logistics' && (
            <div className="w-[480px] rounded-2xl border-4 border-slate-950 bg-white p-5 shadow-2xl text-slate-950 font-sans print:w-full print:border-4 print:border-black">
              <div className="flex items-center justify-between border-b-2 border-slate-950 pb-2">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded bg-emerald-800 text-white font-black text-sm">
                    PAA
                  </div>
                  <div>
                    <div className="font-black text-sm uppercase tracking-wide">PAKISTAN AIRPORTS AUTHORITY</div>
                    <div className="text-[10px] font-bold text-emerald-800">AIRPORT IT LOGISTICS & CARTON MANIFEST</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-mono font-black text-sm">{activeAssetId}</div>
                  <div className="text-[10px] font-bold text-slate-600">{asset?.department}</div>
                </div>
              </div>

              <div className="my-4 grid grid-cols-2 gap-4">
                <div className="space-y-1 text-xs">
                  <div><strong className="text-slate-600">EQUIPMENT:</strong> {asset?.name || customText}</div>
                  <div><strong className="text-slate-600">SERIAL NO:</strong> <span className="font-mono">{asset?.serialNumber}</span></div>
                  <div><strong className="text-slate-600">LOCATION:</strong> {typeof asset?.location === 'object' && asset?.location ? [asset.location.building, asset.location.floor, asset.location.room].filter(Boolean).join(', ') : (asset?.location || 'Main Airport Terminal')}</div>
                  <div><strong className="text-slate-600">RECEIVING REF:</strong> <span className="font-mono">LOG-2026-JIAP</span></div>
                </div>
                <div className="flex flex-col items-center justify-center">
                  <svg
                    width="110"
                    height="110"
                    viewBox={`0 0 ${qrMatrix.length} ${qrMatrix.length}`}
                    className="bg-white p-1 rounded border-2 border-slate-950"
                  >
                    {qrMatrix.map((row, rIdx) =>
                      row.map((isDark, cIdx) =>
                        isDark ? <rect key={`${rIdx}-${cIdx}`} x={cIdx} y={rIdx} width="1" height="1" fill="#000000" /> : null
                      )
                    )}
                  </svg>
                  <span className="text-[8px] font-mono font-bold mt-1">SCAN VIA PAA MOBILE / TERMINAL</span>
                </div>
              </div>

              <div className="border-t-2 border-slate-950 pt-2 flex flex-col items-center">
                <div className="font-mono text-sm font-black tracking-widest">{activeBarcodeValue}</div>
                <svg
                  width={totalWidth}
                  height="45"
                  viewBox={`0 0 ${totalWidth} 45`}
                  className="w-full max-w-[340px] mt-1"
                >
                  <rect width="100%" height="100%" fill="#ffffff" />
                  {bars.map((bar, bIdx) => (
                    <rect key={bIdx} x={bar.x} y="0" width={bar.width} height="45" fill="#000000" />
                  ))}
                </svg>
              </div>
            </div>
          )}
        </div>

        {/* Modal Action Controls (Hidden in Print) */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4 dark:border-slate-800 print:hidden">
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            <span>Ready for thermal sticker peel & stick labeling</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition"
            >
              Close
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 rounded-xl bg-cyan-600 px-5 py-2 text-xs font-bold text-white shadow-md shadow-cyan-600/20 hover:bg-cyan-500 transition"
            >
              <Printer className="h-4 w-4" />
              <span>Print Thermal Tag</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
