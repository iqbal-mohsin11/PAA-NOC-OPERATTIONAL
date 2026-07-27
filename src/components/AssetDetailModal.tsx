import React, { useState } from 'react';
import { useInventory } from '../context/InventoryContext';
import { AssetItem } from '../types/inventory';
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
} from 'lucide-react';

interface AssetDetailModalProps {
  asset: AssetItem;
  onClose: () => void;
  onEdit: (asset: AssetItem) => void;
  onSoftRemove: (asset: AssetItem) => void;
  onOpenLabelModal: (asset: AssetItem) => void;
  onOpenIssueModal: (asset: AssetItem) => void;
  onOpenGatePass?: (asset: AssetItem) => void;
}

export const AssetDetailModal: React.FC<AssetDetailModalProps> = ({
  asset,
  onClose,
  onEdit,
  onSoftRemove,
  onOpenLabelModal,
  onOpenIssueModal,
  onOpenGatePass,
}) => {
  const { tickets, maintenanceRecords } = useInventory();

  const [activeTab, setActiveTab] = useState<'overview' | 'specs' | 'tickets' | 'maintenance'>('overview');

  const assetTickets = tickets.filter((t) => t.assetId === asset.id);
  const assetMaintenance = maintenanceRecords.filter((m) => m.assetId === asset.id);

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
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-center dark:border-slate-800 dark:bg-slate-800/50">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">PAA Official Asset Property Tag</div>
                  <div className="my-2 flex justify-center">
                    <div className="p-2 bg-white rounded-lg border border-slate-200 shadow-sm">
                      {/* Barcode visual lines simulation */}
                      <div className="font-mono text-xs font-black tracking-widest text-slate-900">{asset.barcode}</div>
                      <div className="h-6 w-36 mx-auto mt-1 flex items-center justify-center space-x-0.5">
                        {[2, 1, 3, 1, 2, 4, 1, 2, 1, 3, 2, 1, 4, 1, 2, 3, 1, 2].map((w, idx) => (
                          <div key={idx} className="h-full bg-slate-900" style={{ width: `${w * 1.5}px` }}></div>
                        ))}
                      </div>
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">{asset.paaNumber}</p>
                </div>
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
          <div className="flex items-center gap-2">
            <button
              onClick={() => onSoftRemove(asset)}
              className="flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2 text-xs font-bold text-rose-600 hover:bg-rose-100 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-400"
            >
              <Trash2 className="h-4 w-4" />
              <span>Soft Remove</span>
            </button>

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
