import React, { useState } from 'react';
import { useInventory } from '../context/InventoryContext';
import { AssetItem } from '../types/inventory';
import { QrCode, Printer, X, Shield, Check } from 'lucide-react';

interface BarcodeModalProps {
  initialAsset?: AssetItem | null;
  onClose: () => void;
}

export const BarcodeModal: React.FC<BarcodeModalProps> = ({ initialAsset, onClose }) => {
  const { assets } = useInventory();
  const [selectedAssetId, setSelectedAssetId] = useState(initialAsset?.id || assets[0]?.id || '');

  const asset = assets.find((a) => a.id === selectedAssetId) || initialAsset || assets[0];

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm overflow-y-auto print:p-0 print:bg-white">
      <div className="relative w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 print:shadow-none print:border-none print:p-0">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800 print:hidden">
          <div className="flex items-center gap-2">
            <QrCode className="h-5 w-5 text-cyan-500" />
            <h3 className="font-bold text-slate-900 text-sm dark:text-white">PAA Property QR & Barcode Label Printer</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Asset Selector (Hidden in Print) */}
        <div className="mt-4 print:hidden">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Select Asset Label</label>
          <select
            value={selectedAssetId}
            onChange={(e) => setSelectedAssetId(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2 text-xs font-mono dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            {assets.map((a) => (
              <option key={a.id} value={a.id}>
                {a.id} - {a.name} ({a.department})
              </option>
            ))}
          </select>
        </div>

        {/* Printable Label Sticker Card */}
        {asset && (
          <div className="mt-6 flex flex-col items-center justify-center">
            <div className="w-80 rounded-2xl border-2 border-slate-900 bg-white p-4 shadow-lg text-slate-900 text-center font-sans print:w-full">
              {/* Sticker Header */}
              <div className="flex items-center justify-between border-b-2 border-slate-900 pb-1.5">
                <div className="flex items-center gap-1.5">
                  <div className="flex h-6 w-6 items-center justify-center rounded bg-emerald-700 text-white font-black text-xs">
                    PAA
                  </div>
                  <span className="font-black text-[11px] uppercase tracking-wider">PAKISTAN AIRPORTS AUTHORITY</span>
                </div>
              </div>

              {/* Asset Title */}
              <div className="mt-2 text-xs font-black uppercase text-slate-900 truncate">{asset.name}</div>
              <div className="text-[10px] font-bold text-emerald-700">{asset.department} DEPARTMENT</div>

              {/* QR & Barcode Graphic Area */}
              <div className="my-3 flex items-center justify-around rounded-xl border border-slate-200 bg-slate-50 p-2.5">
                {/* QR Code visual simulation */}
                <div className="h-20 w-20 p-1 bg-white border border-slate-300 rounded flex flex-col justify-between text-[6px]">
                  <div className="flex justify-between">
                    <div className="h-4 w-4 bg-slate-900"></div>
                    <div className="h-4 w-4 bg-slate-900"></div>
                  </div>
                  <div className="text-center font-mono font-bold text-slate-800 text-[7px]">{asset.id}</div>
                  <div className="flex justify-between">
                    <div className="h-4 w-4 bg-slate-900"></div>
                    <div className="h-2 w-2 bg-slate-900"></div>
                  </div>
                </div>

                {/* Barcode simulation */}
                <div>
                  <div className="font-mono text-xs font-black tracking-widest">{asset.barcode}</div>
                  <div className="h-10 w-32 mt-1 flex items-center justify-center space-x-0.5">
                    {[2, 1, 3, 1, 2, 4, 1, 2, 1, 3, 2, 1, 4, 1, 2, 3, 1, 2, 1, 3].map((w, idx) => (
                      <div key={idx} className="h-full bg-slate-900" style={{ width: `${w * 1.2}px` }}></div>
                    ))}
                  </div>
                  <div className="font-mono text-[9px] font-bold text-slate-600 mt-0.5">TAG: {asset.assetTag}</div>
                </div>
              </div>

              {/* Footer Serial */}
              <div className="flex justify-between text-[9px] font-mono font-bold text-slate-600">
                <span>SN: {asset.serialNumber}</span>
                <span>PAA SENTINEL v5</span>
              </div>
            </div>
          </div>
        )}

        {/* Modal Action Controls (Hidden in Print) */}
        <div className="mt-6 flex justify-end gap-2 border-t border-slate-100 pt-3 dark:border-slate-800 print:hidden">
          <button
            onClick={onClose}
            className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-bold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
          >
            Close
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 rounded-xl bg-cyan-600 px-5 py-2 text-xs font-bold text-white hover:bg-cyan-500"
          >
            <Printer className="h-4 w-4" />
            <span>Print Thermal Label</span>
          </button>
        </div>
      </div>
    </div>
  );
};
