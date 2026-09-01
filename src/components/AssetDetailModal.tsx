import React, { useState } from 'react';
import { useInventory } from '../context/InventoryContext';
import { AssetItem } from '../types/inventory';
import { generateCode128Bars, generateQRMatrix } from '../utils/barcodeQrGenerator';
import {
  X,
  HardDrive,
  Building,
  User,
  Calendar,
  ShieldCheck,
  QrCode,
  Printer as PrintIcon,
  Wrench,
  AlertTriangle,
  Edit,
  Trash2,
  Cpu,
  Server,
  Wifi,
  FileText,
  MapPin,
  Tag,
  CheckCircle2,
  Droplet,
  RotateCw,
  RefreshCw,
  Package,
} from 'lucide-react';

interface AssetDetailModalProps {
  asset: AssetItem;
  onClose: () => void;
  onEdit: (asset: AssetItem) => void;
  onSoftRemove: (asset: AssetItem) => void;
  onOpenLabelModal: (asset: AssetItem) => void;
  onOpenIssueModal: (asset: AssetItem) => void;
  onOpenGatePass?: (asset: AssetItem) => void;
  onOpenTonerIssue?: (asset: AssetItem, mode?: 'new' | 'refill') => void;
}

export const AssetDetailModal: React.FC<AssetDetailModalProps> = ({
  asset,
  onClose,
  onEdit,
  onSoftRemove,
  onOpenLabelModal,
  onOpenIssueModal,
  onOpenGatePass,
  onOpenTonerIssue,
}) => {
  const { tickets, maintenanceRecords, updateAsset } = useInventory();

  const [activeTab, setActiveTab] = useState<'overview' | 'specs' | 'tickets' | 'maintenance'>('overview');

  const assetTickets = tickets.filter((t) => t.assetId === asset.id);
  const assetMaintenance = maintenanceRecords.filter((m) => m.assetId === asset.id);

  const isPrinterAsset = asset.category === 'Printer' || !!asset.printerSpecs;
  const currentTonerLevel = asset.printerSpecs?.tonerLevel ?? 100;

  const handleQuickPresetToner = (tonerModelStr: string) => {
    if (asset.printerSpecs) {
      updateAsset(asset.id, {
        printerSpecs: {
          ...asset.printerSpecs,
          tonerModel: tonerModelStr,
        },
      });
    }
  };

  const handleReplenishGaugeTo100 = () => {
    if (asset.printerSpecs) {
      updateAsset(asset.id, {
        printerSpecs: {
          ...asset.printerSpecs,
          tonerLevel: 100,
        },
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-4xl rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900 my-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold">
              <HardDrive className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-black text-emerald-600 dark:text-emerald-400">{asset.id}</span>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold ${
                    asset.status === 'Active'
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400'
                      : asset.status === 'Spare'
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400'
                      : 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400'
                  }`}
                >
                  {asset.status}
                </span>
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">{asset.name}</h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onOpenLabelModal(asset)}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              <QrCode className="h-4 w-4 text-cyan-500" />
              <span>Asset Tag Label</span>
            </button>

            <button
              onClick={() => {
                onClose();
                onEdit(asset);
              }}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              <Edit className="h-4 w-4 text-blue-500" />
              <span>Edit</span>
            </button>

            <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-100 bg-slate-50 px-6 text-xs font-semibold dark:border-slate-800 dark:bg-slate-800/50">
          <button
            onClick={() => setActiveTab('overview')}
            className={`border-b-2 px-4 py-3 transition ${
              activeTab === 'overview'
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400'
            }`}
          >
            Overview & Location
          </button>

          <button
            onClick={() => setActiveTab('specs')}
            className={`border-b-2 px-4 py-3 transition ${
              activeTab === 'specs'
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400'
            }`}
          >
            Hardware Specifications
          </button>

          <button
            onClick={() => setActiveTab('tickets')}
            className={`border-b-2 px-4 py-3 transition ${
              activeTab === 'tickets'
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400'
            }`}
          >
            Issue Tickets ({assetTickets.length})
          </button>

          <button
            onClick={() => setActiveTab('maintenance')}
            className={`border-b-2 px-4 py-3 transition ${
              activeTab === 'maintenance'
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400'
            }`}
          >
            Service Maintenance ({assetMaintenance.length})
          </button>
        </div>

        {/* Tab Contents */}
        <div className="p-6">
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {/* Left Column: Image & Barcode Card */}
              <div className="space-y-4">
                <div className="h-48 overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-800">
                  <img
                    src={asset.images.devicePhoto || 'https://images.unsplash.com/photo-1587831990711-23ca6441447b?auto=format&fit=crop&w=600&q=80'}
                    alt={asset.name}
                    className="h-full w-full object-cover"
                  />
                </div>

                {/* QR / Barcode Tag Rendering Box */}
                {(() => {
                  const { bars, totalWidth } = generateCode128Bars(asset.barcode || '10001849201', 1.5);
                  const qrMatrix = generateQRMatrix(`PAA-SENTINEL-VAL:${asset.id}|${asset.serialNumber}`);
                  return (
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-center dark:border-slate-800 dark:bg-slate-800/50">
                      <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        <span>PAA Property Tag</span>
                        <span className="text-emerald-600 font-mono">100% SCAN READY</span>
                      </div>
                      
                      <div className="my-2 flex items-center justify-center gap-3 p-2 bg-white rounded-xl border border-slate-200 shadow-2xs">
                        {/* 2D QR Matrix */}
                        <svg
                          width="48"
                          height="48"
                          viewBox={`0 0 ${qrMatrix.length} ${qrMatrix.length}`}
                          className="bg-white p-0.5 rounded border border-slate-200 shrink-0"
                        >
                          {qrMatrix.map((row, rIdx) =>
                            row.map((isDark, cIdx) =>
                              isDark ? <rect key={`${rIdx}-${cIdx}`} x={cIdx} y={rIdx} width="1" height="1" fill="#000000" /> : null
                            )
                          )}
                        </svg>

                        {/* Code 128 Barcode */}
                        <div className="flex-1 overflow-hidden">
                          <div className="font-mono text-[11px] font-black tracking-wider text-slate-900">{asset.barcode}</div>
                          <div className="h-6 w-full flex items-center justify-center py-0.5">
                            <svg
                              width={totalWidth}
                              height="24"
                              viewBox={`0 0 ${totalWidth} 24`}
                              className="w-full max-w-[140px]"
                            >
                              <rect width="100%" height="100%" fill="#ffffff" />
                              {bars.map((bar, bIdx) => (
                                <rect key={bIdx} x={bar.x} y="0" width={bar.width} height="24" fill="#000000" />
                              ))}
                            </svg>
                          </div>
                          <div className="text-[9px] font-mono font-bold text-slate-500">{asset.assetTag}</div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => onOpenLabelModal(asset)}
                        className="mt-1 flex w-full items-center justify-center gap-1.5 rounded-lg bg-cyan-50 px-2 py-1 text-[11px] font-bold text-cyan-700 hover:bg-cyan-100 dark:bg-cyan-950/60 dark:text-cyan-300 transition"
                      >
                        <QrCode className="h-3 w-3" />
                        <span>Print High-Res Thermal Sticker</span>
                      </button>
                    </div>
                  );
                })()}
              </div>

              {/* Right 2 Columns: Information Details */}
              <div className="space-y-4 md:col-span-2 text-xs">
                <div className="grid grid-cols-2 gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/40">
                  <div>
                    <span className="text-slate-400 font-medium">Department</span>
                    <div className="font-bold text-emerald-600 dark:text-emerald-400 text-sm mt-0.5">{asset.department}</div>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium">Assigned Officer</span>
                    <div className="font-bold text-slate-800 dark:text-slate-200 text-sm mt-0.5">{asset.assignedUser}</div>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium">Brand & Model</span>
                    <div className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                      {asset.brand} {asset.model}
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium">Serial Number</span>
                    <div className="font-mono font-bold text-slate-800 dark:text-slate-200 mt-0.5">{asset.serialNumber}</div>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium">Asset Tag</span>
                    <div className="font-mono font-bold text-slate-800 dark:text-slate-200 mt-0.5">{asset.assetTag}</div>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium">Vendor Company</span>
                    <div className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">{asset.vendorCompany}</div>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/40">
                  <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-200 mb-2">
                    <MapPin className="h-4 w-4 text-emerald-500" />
                    <span>Airport Location Details</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <span className="text-slate-400">Building</span>
                      <div className="font-semibold text-slate-800 dark:text-slate-200">{asset.location.building}</div>
                    </div>
                    <div>
                      <span className="text-slate-400">Floor</span>
                      <div className="font-semibold text-slate-800 dark:text-slate-200">{asset.location.floor}</div>
                    </div>
                    <div>
                      <span className="text-slate-400">Room / Bay</span>
                      <div className="font-semibold text-slate-800 dark:text-slate-200">{asset.location.room}</div>
                    </div>
                  </div>
                </div>

                {/* Printer Specific Toner Model & Quick Action Block */}
                {isPrinterAsset && (
                  <div className="rounded-2xl border border-teal-200 bg-teal-50/70 p-4 dark:border-teal-900/60 dark:bg-teal-950/30 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-teal-200/60 pb-2.5 dark:border-teal-900/40">
                      <div className="flex items-center gap-2">
                        <PrintIcon className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                        <div>
                          <h4 className="font-bold text-teal-900 dark:text-teal-200 text-sm">Printer & Toner Management</h4>
                          <p className="text-[11px] text-teal-700 dark:text-teal-400">
                            Model: <span className="font-bold">{asset.brand} {asset.model}</span> | Cartridge: <span className="font-mono font-bold text-teal-900 dark:text-teal-100">{asset.printerSpecs?.tonerModel || 'HP 85A / Standard'}</span>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            if (onOpenTonerIssue) {
                              onOpenTonerIssue(asset, 'refill');
                            } else {
                              handleReplenishGaugeTo100();
                            }
                          }}
                          className="flex items-center gap-1.5 rounded-xl bg-teal-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-teal-500 transition"
                          title="Register Refill Toner Issue & Reset Gauge to 100%"
                        >
                          <RotateCw className="h-4 w-4" />
                          <span>Refill Toner Issue</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            if (onOpenTonerIssue) {
                              onOpenTonerIssue(asset, 'new');
                            } else {
                              handleReplenishGaugeTo100();
                            }
                          }}
                          className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-500 transition"
                          title="Issue New Toner Cartridge Voucher"
                        >
                          <Droplet className="h-4 w-4" />
                          <span>Issue New Toner</span>
                        </button>
                      </div>
                    </div>

                    {/* Toner Gauge Level */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                        <span>Toner Level Remaining</span>
                        <span className={currentTonerLevel <= 25 ? 'text-rose-600 dark:text-rose-400 font-extrabold' : 'text-teal-700 dark:text-teal-300'}>
                          {currentTonerLevel}% {currentTonerLevel <= 25 ? '(LOW TONER WARNING)' : ''}
                        </span>
                      </div>
                      <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                        <div
                          className={`h-full transition-all duration-500 ${
                            currentTonerLevel <= 25
                              ? 'bg-rose-500'
                              : currentTonerLevel <= 50
                              ? 'bg-amber-500'
                              : 'bg-emerald-500'
                          }`}
                          style={{ width: `${currentTonerLevel}%` }}
                        />
                      </div>
                    </div>

                    {/* Quick Select Toner Model Buttons */}
                    <div className="space-y-1.5 pt-1">
                      <div className="flex items-center justify-between text-[11px] font-bold text-teal-900 dark:text-teal-300">
                        <span>Quick Select Printer Toner Model Buttons:</span>
                        <span className="text-[10px] text-teal-600 dark:text-teal-400 font-normal">Click to update toner spec</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {[
                          { label: 'HP 1102W', toner: 'HP 85A (CE285A)' },
                          { label: 'HP 102', toner: 'HP 17A (CF217A)' },
                          { label: 'HP 402', toner: 'HP 26A (CF226A)' },
                          { label: 'HP 1320', toner: 'HP 49A (Q5949A)' },
                          { label: 'HP M 600', toner: 'HP 90A (CE390A)' },
                          { label: 'HP M 602', toner: 'HP 90A (CE390A)' },
                          { label: 'HP 2300', toner: 'HP 10A (Q2610A)' },
                          { label: 'BROTHER', toner: 'Brother TN-2380' },
                          { label: 'EPSON INK JET', toner: 'Epson 003 Ink' },
                        ].map((p) => {
                          const isCurrent = asset.printerSpecs?.tonerModel?.includes(p.label) || asset.printerSpecs?.tonerModel?.includes(p.toner);
                          return (
                            <button
                              key={p.label}
                              type="button"
                              onClick={() => handleQuickPresetToner(`${p.toner} (${p.label})`)}
                              className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition border ${
                                isCurrent
                                  ? 'bg-teal-700 text-white border-teal-700 shadow-xs'
                                  : 'bg-white text-slate-700 border-teal-200 hover:bg-teal-100 dark:bg-slate-900 dark:text-slate-200 dark:border-teal-900 dark:hover:bg-slate-800'
                              }`}
                              title={`Set Toner Model to ${p.toner}`}
                            >
                              <span>{p.label}</span>
                              <span className="ml-1 opacity-70 font-mono text-[10px]">({p.toner.split(' ')[1] || p.toner.slice(0, 5)})</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/40">
                  <div>
                    <span className="text-slate-400">Purchase Date</span>
                    <div className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">{asset.purchaseDate}</div>
                  </div>
                  <div>
                    <span className="text-slate-400">Warranty Expiry</span>
                    <div className="font-semibold text-amber-600 dark:text-amber-400 mt-0.5">{asset.warrantyExpiry}</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'specs' && (
            <div className="space-y-4 text-xs">
              {asset.systemSpecs && (
                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/40">
                  <h4 className="font-bold text-emerald-600 dark:text-emerald-400 mb-3 text-sm">Computer Workstation Specifications</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div>
                      <span className="text-slate-400">Processor:</span>
                      <div className="font-semibold text-slate-800 dark:text-slate-200">{asset.systemSpecs.processor || 'N/A'}</div>
                    </div>
                    <div>
                      <span className="text-slate-400">RAM:</span>
                      <div className="font-semibold text-slate-800 dark:text-slate-200">{asset.systemSpecs.ram || 'N/A'}</div>
                    </div>
                    <div>
                      <span className="text-slate-400">Storage SSD/HDD:</span>
                      <div className="font-semibold text-slate-800 dark:text-slate-200">{asset.systemSpecs.ssd || asset.systemSpecs.hdd || 'N/A'}</div>
                    </div>
                    <div>
                      <span className="text-slate-400">IP Address:</span>
                      <div className="font-mono font-semibold text-slate-800 dark:text-slate-200">{asset.systemSpecs.ipAddress || 'N/A'}</div>
                    </div>
                    <div>
                      <span className="text-slate-400">MAC Address:</span>
                      <div className="font-mono font-semibold text-slate-800 dark:text-slate-200">{asset.systemSpecs.macAddress || 'N/A'}</div>
                    </div>
                    <div>
                      <span className="text-slate-400">Windows OS:</span>
                      <div className="font-semibold text-slate-800 dark:text-slate-200">{asset.systemSpecs.osVersion || 'N/A'}</div>
                    </div>
                  </div>
                </div>
              )}

              {asset.printerSpecs && (
                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/40">
                  <h4 className="font-bold text-emerald-600 dark:text-emerald-400 mb-3 text-sm">Printer Specifications</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div>
                      <span className="text-slate-400">Type:</span>
                      <div className="font-semibold text-slate-800 dark:text-slate-200">{asset.printerSpecs.printerType}</div>
                    </div>
                    <div>
                      <span className="text-slate-400">Color / Mono:</span>
                      <div className="font-semibold text-slate-800 dark:text-slate-200">{asset.printerSpecs.colorType}</div>
                    </div>
                    <div>
                      <span className="text-slate-400">Toner Model:</span>
                      <div className="font-semibold text-slate-800 dark:text-slate-200">{asset.printerSpecs.tonerModel}</div>
                    </div>
                    <div>
                      <span className="text-slate-400">Toner Remaining:</span>
                      <div className="font-bold text-emerald-600">{asset.printerSpecs.tonerLevel}%</div>
                    </div>
                  </div>
                </div>
              )}

              {asset.networkSpecs && (
                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/40">
                  <h4 className="font-bold text-emerald-600 dark:text-emerald-400 mb-3 text-sm">Network Switch / Device Details</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div>
                      <span className="text-slate-400">Total Ports:</span>
                      <div className="font-semibold text-slate-800 dark:text-slate-200">{asset.networkSpecs.totalPorts}</div>
                    </div>
                    <div>
                      <span className="text-slate-400">SFP Ports:</span>
                      <div className="font-semibold text-slate-800 dark:text-slate-200">{asset.networkSpecs.sfpPorts}</div>
                    </div>
                    <div>
                      <span className="text-slate-400">Management IP:</span>
                      <div className="font-mono font-semibold text-slate-800 dark:text-slate-200">{asset.networkSpecs.managementIp}</div>
                    </div>
                    <div>
                      <span className="text-slate-400">Rack Number:</span>
                      <div className="font-semibold text-slate-800 dark:text-slate-200">{asset.networkSpecs.rackNumber}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'tickets' && (
            <div className="space-y-3">
              <div className="flex justify-between items-center mb-2">
                <h4 className="font-bold text-xs text-slate-800 dark:text-slate-200">Support Ticket Log History</h4>
                <button
                  onClick={() => onOpenIssueModal(asset)}
                  className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-500"
                >
                  Report New Ticket
                </button>
              </div>

              {assetTickets.length === 0 ? (
                <div className="p-8 text-center text-slate-400 bg-slate-50 rounded-xl">No support tickets reported for this asset.</div>
              ) : (
                assetTickets.map((t) => (
                  <div key={t.ticketNumber} className="p-3 rounded-xl border border-slate-100 bg-slate-50 text-xs dark:border-slate-800 dark:bg-slate-800/50">
                    <div className="flex justify-between font-bold text-slate-800 dark:text-slate-200">
                      <span>{t.ticketNumber}</span>
                      <span className="text-emerald-600">{t.status}</span>
                    </div>
                    <p className="mt-1 text-slate-600 dark:text-slate-300">{t.description}</p>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'maintenance' && (
            <div className="space-y-3">
              <h4 className="font-bold text-xs text-slate-800 dark:text-slate-200 mb-2">Service Maintenance Log Records</h4>
              {assetMaintenance.length === 0 ? (
                <div className="p-8 text-center text-slate-400 bg-slate-50 rounded-xl">No maintenance history recorded yet.</div>
              ) : (
                assetMaintenance.map((m) => (
                  <div key={m.id} className="p-3 rounded-xl border border-slate-100 bg-slate-50 text-xs dark:border-slate-800 dark:bg-slate-800/50">
                    <div className="flex justify-between font-bold text-slate-800 dark:text-slate-200">
                      <span>{m.id} - {m.date}</span>
                      <span className="text-emerald-600">PKR {m.cost.toLocaleString()}</span>
                    </div>
                    <p className="mt-1 text-slate-600 dark:text-slate-300">{m.description}</p>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex flex-wrap items-center justify-between border-t border-slate-100 px-6 py-4 dark:border-slate-800 gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => onSoftRemove(asset)}
              className="flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-100 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-400"
            >
              <Trash2 className="h-4 w-4" />
              <span>Soft Remove</span>
            </button>

            {isPrinterAsset && (
              <>
                <button
                  onClick={() => {
                    if (onOpenTonerIssue) {
                      onOpenTonerIssue(asset, 'refill');
                    } else {
                      handleReplenishGaugeTo100();
                    }
                  }}
                  className="flex items-center gap-1.5 rounded-xl bg-teal-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-teal-500 shadow-md transition"
                >
                  <RotateCw className="h-4 w-4" />
                  <span>Refill Toner Issue</span>
                </button>

                <button
                  onClick={() => {
                    if (onOpenTonerIssue) {
                      onOpenTonerIssue(asset, 'new');
                    } else {
                      handleReplenishGaugeTo100();
                    }
                  }}
                  className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-emerald-500 shadow-md transition"
                >
                  <Droplet className="h-4 w-4" />
                  <span>Issue New Toner</span>
                </button>
              </>
            )}

            {onOpenGatePass && (
              <button
                onClick={() => {
                  onClose();
                  onOpenGatePass(asset);
                }}
                className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-indigo-500 shadow-md transition"
              >
                <ShieldCheck className="h-4 w-4" />
                <span>Make Market Repair Gate Pass</span>
              </button>
            )}
          </div>

          <button
            onClick={onClose}
            className="rounded-xl bg-slate-900 px-5 py-2 text-xs font-bold text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
