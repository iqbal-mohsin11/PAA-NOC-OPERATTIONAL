import React, { useState, useMemo, useEffect } from 'react';
import { useInventory } from '../context/InventoryContext';
import { PrinterMaintenanceRecord, PrinterPartItem } from '../types/inventory';
import {
  X,
  Wrench,
  History,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileSpreadsheet,
  Printer,
  Trash2,
  Eye,
  SlidersHorizontal,
  FileText,
  DollarSign,
  User,
  Calendar,
  Layers,
  Activity,
} from 'lucide-react';
import { TechnicianSelectDropdown } from './TechnicianSelectDropdown';
import { TechnicianActivityDashboard } from './TechnicianActivityDashboard';

interface PrinterMaintenanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedAssetId?: string;
  defaultTab?: 'form' | 'history' | 'technicians';
}

const SERVICE_TYPES: PrinterMaintenanceRecord['serviceType'][] = [
  'General Maintenance & Cleaning',
  'Part Replacement / Overhaul',
  'Paper Jam & Roller Service',
  'Fuser Assembly Repair',
  'Formatter / Logic Board Repair',
  'Laser Scanner Optics Service',
  'Firmware / Network Config',
  'Toner Cartridge & Drum Service',
  'Full Overhaul / Reconditioning',
];

interface PartRowState {
  partId?: string;
  partName: string;
  partNumber: string;
  quantity: number;
  costPkr: number;
}

const formatLocation = (loc: unknown): string => {
  if (!loc) return 'PAA Terminal Area';
  if (typeof loc === 'string') return loc;
  if (typeof loc === 'object' && loc !== null) {
    const l = loc as { building?: string; floor?: string; room?: string };
    const parts = [l.building, l.floor, l.room].filter(Boolean);
    return parts.length > 0 ? parts.join(' - ') : 'PAA Terminal Area';
  }
  return String(loc);
};

export const PrinterMaintenanceModal: React.FC<PrinterMaintenanceModalProps> = ({
  isOpen,
  onClose,
  preselectedAssetId,
  defaultTab = 'form',
}) => {
  const {
    assets,
    printerMaintenanceRecords,
    addPrinterMaintenanceRecord,
    deletePrinterMaintenanceRecord,
    printerParts,
    currentUser,
    userRole,
  } = useInventory();

  const [activeTab, setActiveTab] = useState<'form' | 'history' | 'technicians'>(defaultTab);

  // Filter printers and scanners
  const printerAssets = useMemo(() => {
    return assets.filter(
      (a) =>
        a.category.toLowerCase().includes('printer') ||
        a.category.toLowerCase().includes('scanner') ||
        a.name.toLowerCase().includes('printer') ||
        a.name.toLowerCase().includes('laserjet') ||
        a.name.toLowerCase().includes('deskjet')
    );
  }, [assets]);

  // Form State
  const [selectedAssetId, setSelectedAssetId] = useState<string>(
    preselectedAssetId || (printerAssets[0]?.id ?? '')
  );
  const selectedAsset = assets.find((a) => a.id === selectedAssetId);

  // Synchronize active tab and asset whenever modal opens or props change
  useEffect(() => {
    if (isOpen) {
      if (defaultTab) {
        setActiveTab(defaultTab);
      }
      if (preselectedAssetId) {
        setSelectedAssetId(preselectedAssetId);
      } else if (printerAssets.length > 0 && (!selectedAssetId || !printerAssets.some((p) => p.id === selectedAssetId))) {
        setSelectedAssetId(printerAssets[0].id);
      }
    }
  }, [isOpen, defaultTab, preselectedAssetId, printerAssets]);

  const [serviceType, setServiceType] = useState<PrinterMaintenanceRecord['serviceType']>(
    'Part Replacement / Overhaul'
  );
  const [issueReported, setIssueReported] = useState('Paper pickup failure & periodic paper jam in fuser area');
  const [diagnosticsFound, setDiagnosticsFound] = useState(
    'Worn-out rubber pickup roller and worn teflon sleeve with degraded silicon grease.'
  );
  const [workPerformed, setWorkPerformed] = useState(
    'Replaced pickup roller & separation pad. Cleaned optical sensor path and tested 10 sample prints.'
  );
  const [pageCount, setPageCount] = useState<number>(34200);
  const [technicianName, setTechnicianName] = useState<string>(
    currentUser?.displayName || currentUser?.username || 'Engr. Tariq Mehmood (Hardware Tech)'
  );
  const [status, setStatus] = useState<PrinterMaintenanceRecord['status']>('Completed');
  const [costPkr, setCostPkr] = useState<number>(4500);
  const [testPagePrinted, setTestPagePrinted] = useState<boolean>(true);
  const [remarks, setRemarks] = useState('Print quality sharp, toner density verified, smooth paper feed.');
  const [date, setDate] = useState<string>(new Date().toISOString().slice(0, 10));

  // Parts list
  const [partsList, setPartsList] = useState<PartRowState[]>(() => {
    const p0 = printerParts && printerParts.length > 0 ? printerParts[0] : null;
    return [
      {
        partId: p0?.id,
        partName: p0?.partName || 'Pickup Roller Assembly',
        partNumber: p0?.partNumber || 'RM1-7727-000CN',
        quantity: 1,
        costPkr: p0?.unitCostPkr || 1200,
      },
    ];
  });

  const [formSuccess, setFormSuccess] = useState(false);

  // History filters
  const [historySearch, setHistorySearch] = useState('');
  const [historyServiceFilter, setHistoryServiceFilter] = useState('ALL');
  const [viewRecord, setViewRecord] = useState<PrinterMaintenanceRecord | null>(null);

  if (!isOpen) return null;

  const handleAddPartRow = () => {
    const firstPart = printerParts[0];
    setPartsList((prev) => [
      ...prev,
      {
        partId: firstPart?.id,
        partName: firstPart?.partName || 'Spare Part',
        partNumber: firstPart?.partNumber || '',
        quantity: 1,
        costPkr: firstPart?.unitCostPkr || 0,
      },
    ]);
  };

  const handleRemovePartRow = (index: number) => {
    setPartsList((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handlePartSelectionChange = (index: number, partId: string) => {
    const targetPart = printerParts.find((p) => p.id === partId);
    if (!targetPart) return;

    setPartsList((prev) =>
      prev.map((row, idx) =>
        idx === index
          ? {
              ...row,
              partId: targetPart.id,
              partName: targetPart.partName,
              partNumber: targetPart.partNumber,
              costPkr: targetPart.unitCostPkr || 0,
            }
          : row
      )
    );
  };

  const handleUpdatePartRow = (index: number, field: keyof PartRowState, value: any) => {
    setPartsList((prev) =>
      prev.map((row, idx) => (idx === index ? { ...row, [field]: value } : row))
    );
  };

  // Auto calculate total cost from parts
  const totalPartsCost = partsList.reduce((sum, p) => sum + (p.costPkr * p.quantity), 0);

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();

    const printerName = selectedAsset ? selectedAsset.name : 'Unknown Printer';
    const brand = selectedAsset ? selectedAsset.brand : 'HP (Hewlett-Packard)';
    const model = selectedAsset ? selectedAsset.model : 'Standard Model';
    const department = selectedAsset ? selectedAsset.department : 'IT Support';
    const location = selectedAsset ? formatLocation(selectedAsset.location) : 'Main Airport Terminal';

    const partsSummary = partsList
      .filter((p) => p.partName.trim())
      .map((p) => `${p.quantity}x ${p.partName} (${p.partNumber || 'N/A'})`)
      .join(', ');

    const actionTaken = [diagnosticsFound.trim(), workPerformed.trim()].filter(Boolean).join(' | ');

    addPrinterMaintenanceRecord(
      {
        assetId: selectedAssetId,
        printerName,
        brand,
        model,
        department,
        location,
        assignedUser: selectedAsset?.assignedUser || 'Duty Station',
        serviceType,
        issueReported: issueReported.trim(),
        actionTaken: actionTaken || 'Service completed according to standard maintenance protocol.',
        diagnosticsFound: diagnosticsFound.trim(),
        workPerformed: workPerformed.trim(),
        partsChangedSummary: partsSummary || 'None',
        partsChanged: partsList.map((p) => ({
          partId: p.partId,
          partName: p.partName,
          partNumber: p.partNumber,
          quantity: Number(p.quantity) || 1,
          unitCostPkr: Number(p.costPkr) || 0,
          oldPartStatus: 'Discarded',
        })),
        pageCount: Number(pageCount) || undefined,
        technicianName: technicianName.trim(),
        date,
        status,
        costPkr: Number(costPkr) || totalPartsCost,
        testPagePrinted,
        remarks: remarks.trim(),
      },
      true // update asset condition
    );

    setFormSuccess(true);
    setTimeout(() => {
      setFormSuccess(false);
      setActiveTab('history');
    }, 1200);
  };

  const filteredHistory = printerMaintenanceRecords.filter((rec) => {
    if (!rec) return false;
    if (historyServiceFilter !== 'ALL' && rec.serviceType !== historyServiceFilter) return false;
    if (historySearch.trim()) {
      const q = historySearch.toLowerCase();
      const matchPart = rec.partsChanged?.some(
        (p) => p?.partName?.toLowerCase().includes(q) || p?.partNumber?.toLowerCase().includes(q)
      );
      return Boolean(
        rec.printerName?.toLowerCase().includes(q) ||
        rec.model?.toLowerCase().includes(q) ||
        rec.technicianName?.toLowerCase().includes(q) ||
        rec.department?.toLowerCase().includes(q) ||
        rec.id?.toLowerCase().includes(q) ||
        rec.issueReported?.toLowerCase().includes(q) ||
        rec.actionTaken?.toLowerCase().includes(q) ||
        rec.partsChangedSummary?.toLowerCase().includes(q) ||
        matchPart
      );
    }
    return true;
  });

  const exportHistoryCsv = () => {
    const headers = [
      'Log ID',
      'Date',
      'Printer Name',
      'Model',
      'Department',
      'Location',
      'Service Type',
      'Issue Reported',
      'Parts Changed',
      'Total Cost (PKR)',
      'Page Count',
      'Technician',
      'Status',
      'Test Page',
    ];
    const rows = filteredHistory.map((r) => [
      `"${r.id || ''}"`,
      `"${r.date || ''}"`,
      `"${(r.printerName || '').replace(/"/g, '""')}"`,
      `"${(r.model || '').replace(/"/g, '""')}"`,
      `"${(r.department || '').replace(/"/g, '""')}"`,
      `"${(formatLocation(r.location)).replace(/"/g, '""')}"`,
      `"${(r.serviceType || '').replace(/"/g, '""')}"`,
      `"${(r.issueReported || '').replace(/"/g, '""')}"`,
      `"${(r.partsChangedSummary || '').replace(/"/g, '""')}"`,
      r.costPkr || 0,
      r.pageCount || 'N/A',
      `"${(r.technicianName || '').replace(/"/g, '""')}"`,
      `"${(r.status || '').replace(/"/g, '""')}"`,
      r.testPagePrinted ? 'Passed' : 'Pending',
    ]);
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Printer_Maintenance_History_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4">
      <div className="flex h-full max-h-[92vh] w-full max-w-6xl flex-col rounded-2xl bg-white shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-500/20">
              <Wrench className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Printer Maintenance & Repair Command
                </h2>
                <span className="rounded-full bg-indigo-500/10 px-2.5 py-0.5 text-xs font-bold text-indigo-600 dark:text-indigo-400">
                  {printerMaintenanceRecords.length} Historical Logs
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Log parts replacement, fuser & roller overhauls, test print verification, and inspect repair logs.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {activeTab === 'history' && (
              <button
                onClick={exportHistoryCsv}
                className="hidden sm:flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 transition"
                title="Export Maintenance History CSV"
              >
                <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" />
                <span>Export CSV</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Tab Toggle Navigation */}
        <div className="flex border-b border-slate-200 bg-white px-6 dark:border-slate-800 dark:bg-slate-900">
          <button
            onClick={() => setActiveTab('form')}
            className={`flex items-center gap-2 border-b-2 py-3 px-4 text-xs font-bold transition ${
              activeTab === 'form'
                ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <Plus className="h-4 w-4" />
            <span>Repair & Maintenance Form (Change Parts)</span>
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-2 border-b-2 py-3 px-4 text-xs font-bold transition ${
              activeTab === 'history'
                ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <History className="h-4 w-4" />
            <span>Maintenance & Repair Log History ({printerMaintenanceRecords.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('technicians')}
            className={`flex items-center gap-2 border-b-2 py-3 px-4 text-xs font-bold transition ${
              activeTab === 'technicians'
                ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <Activity className="h-4 w-4" />
            <span>Technician Activity & Maintenance Settings</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'form' ? (
            /* Maintenance & Repair Form */
            <form onSubmit={handleSubmitForm} className="max-w-4xl mx-auto space-y-6">
              {formSuccess && (
                <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs font-bold text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span>Maintenance and parts replacement job sheet successfully logged & asset status synchronized!</span>
                </div>
              )}

              {/* Target Printer Selection Card */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-4">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 pb-2 dark:border-slate-800">
                  <Printer className="h-4 w-4 text-indigo-600" />
                  <span>Select Target Printer / Scanner Unit</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-2">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Target Asset *</label>
                    <select
                      value={selectedAssetId}
                      onChange={(e) => setSelectedAssetId(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:border-indigo-500 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-200"
                    >
                      {printerAssets.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} — {p.brand} {p.model} ({p.department} - {formatLocation(p.location)}) [SN: {p.serialNumber}]
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Service Date</label>
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:border-indigo-500 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-200"
                    />
                  </div>
                </div>

                {selectedAsset && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 rounded-xl bg-slate-50 p-3 text-xs dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Department:</span>
                      <span className="font-bold text-slate-700 dark:text-slate-300">{selectedAsset.department}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Location:</span>
                      <span className="font-bold text-slate-700 dark:text-slate-300">{formatLocation(selectedAsset.location)}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Serial Number:</span>
                      <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{selectedAsset.serialNumber}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Current Status:</span>
                      <span className="font-bold text-indigo-600 dark:text-indigo-400">{selectedAsset.status}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Service & Diagnostics Card */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-4">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 pb-2 dark:border-slate-800">
                  <Wrench className="h-4 w-4 text-amber-600" />
                  <span>Service Classification & Technical Findings</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Service Category *</label>
                    <select
                      value={serviceType}
                      onChange={(e) => setServiceType(e.target.value as any)}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:border-indigo-500 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-200"
                    >
                      {SERVICE_TYPES.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Page Counter Reading</label>
                    <input
                      type="number"
                      placeholder="e.g. 45200 pages"
                      value={pageCount}
                      onChange={(e) => setPageCount(parseInt(e.target.value) || 0)}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-mono font-bold text-slate-800 outline-none focus:border-indigo-500 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-200"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Fault / Issue Reported *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Fuser error 50.4, paper jamming on tray 2, light faded prints..."
                      value={issueReported}
                      onChange={(e) => setIssueReported(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-800 outline-none focus:border-indigo-500 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-200"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Diagnostics / Root Cause Findings</label>
                    <textarea
                      rows={2}
                      placeholder="e.g. Fuser heating element broken, teflon film torn, feed roller glazed..."
                      value={diagnosticsFound}
                      onChange={(e) => setDiagnosticsFound(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-800 outline-none focus:border-indigo-500 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-200"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Work Performed / Overhaul Steps</label>
                    <textarea
                      rows={2}
                      placeholder="e.g. Disassembled rear chassis, replaced fuser unit, lubricated gear train with silicon grease, blew out dust..."
                      value={workPerformed}
                      onChange={(e) => setWorkPerformed(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-800 outline-none focus:border-indigo-500 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-200"
                    />
                  </div>
                </div>
              </div>

              {/* Change Parts Section */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2 dark:border-slate-800">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Layers className="h-4 w-4 text-emerald-600" />
                    <span>Parts Changed / Replaced Spare Units</span>
                  </h3>
                  <button
                    type="button"
                    onClick={handleAddPartRow}
                    className="flex items-center gap-1 rounded-lg bg-indigo-50 px-2.5 py-1 text-xs font-bold text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:text-indigo-300 transition"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Add Replaced Part</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {partsList.length === 0 ? (
                    <div className="py-4 text-center text-xs text-slate-400">
                      No spare parts replaced for this service. Click "Add Replaced Part" if any hardware component was changed.
                    </div>
                  ) : (
                    partsList.map((row, idx) => (
                      <div
                        key={idx}
                        className="flex flex-col sm:flex-row items-start sm:items-center gap-2 rounded-xl border border-slate-100 bg-slate-50 p-2.5 dark:border-slate-800 dark:bg-slate-800/40"
                      >
                        {/* Preset selection or custom */}
                        <div className="flex-1 w-full">
                          <label className="text-[10px] font-bold text-slate-500 block mb-1">Pick from Catalog / Name</label>
                          <div className="flex gap-1.5">
                            <select
                              value={row.partId || ''}
                              onChange={(e) => handlePartSelectionChange(idx, e.target.value)}
                              className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-800 outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 flex-1"
                            >
                              <option value="">-- Custom Part --</option>
                              {printerParts.map((p) => (
                                <option key={p.id} value={p.id}>
                                  {p.partName} ({p.partNumber}) [Stock: {p.quantityInStock}]
                                </option>
                              ))}
                            </select>
                            <input
                              type="text"
                              placeholder="Part Name"
                              value={row.partName}
                              onChange={(e) => handleUpdatePartRow(idx, 'partName', e.target.value)}
                              className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-800 outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 flex-1"
                            />
                          </div>
                        </div>

                        {/* Part Number */}
                        <div className="w-full sm:w-36">
                          <label className="text-[10px] font-bold text-slate-500 block mb-1">Part #</label>
                          <input
                            type="text"
                            placeholder="Part Number"
                            value={row.partNumber}
                            onChange={(e) => handleUpdatePartRow(idx, 'partNumber', e.target.value)}
                            className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-mono font-bold text-slate-800 outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                          />
                        </div>

                        {/* Qty */}
                        <div className="w-20">
                          <label className="text-[10px] font-bold text-slate-500 block mb-1">Qty</label>
                          <input
                            type="number"
                            min="1"
                            value={row.quantity}
                            onChange={(e) => handleUpdatePartRow(idx, 'quantity', parseInt(e.target.value) || 1)}
                            className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-bold text-slate-800 outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                          />
                        </div>

                        {/* Unit Cost */}
                        <div className="w-28">
                          <label className="text-[10px] font-bold text-slate-500 block mb-1">Unit PKR</label>
                          <input
                            type="number"
                            min="0"
                            value={row.costPkr}
                            onChange={(e) => handleUpdatePartRow(idx, 'costPkr', parseInt(e.target.value) || 0)}
                            className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-mono font-bold text-slate-800 outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                          />
                        </div>

                        {/* Remove */}
                        <div className="pt-4 sm:pt-4">
                          <button
                            type="button"
                            onClick={() => handleRemovePartRow(idx)}
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40 transition"
                            title="Remove part"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {partsList.length > 0 && (
                  <div className="flex justify-end pt-1">
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
                      Calculated Parts Total:{' '}
                      <span className="font-mono text-emerald-600 dark:text-emerald-400">
                        PKR {totalPartsCost.toLocaleString()}
                      </span>
                    </span>
                  </div>
                )}
              </div>

              {/* Quality Verification & Finalization */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-4">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 pb-2 dark:border-slate-800">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span>Quality Assurance & Job Sign-Off</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Total Service Cost (PKR)</label>
                    <input
                      type="number"
                      value={costPkr}
                      onChange={(e) => setCostPkr(parseInt(e.target.value) || 0)}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-mono font-bold text-slate-800 outline-none focus:border-indigo-500 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-200"
                    />
                  </div>

                  <div className="sm:col-span-1">
                    <TechnicianSelectDropdown
                      value={technicianName}
                      onChange={setTechnicianName}
                      label="Assigned Technician"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Repair Status</label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value as any)}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:border-indigo-500 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-200"
                    >
                      <option value="Completed">Completed & Verified</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Awaiting Parts">Awaiting Parts</option>
                      <option value="Scrap / Unrepairable">Scrap / Beyond Economical Repair</option>
                    </select>
                  </div>

                  <div className="sm:col-span-3 flex items-center gap-2 pt-2">
                    <input
                      type="checkbox"
                      id="testPageCheck"
                      checked={testPagePrinted}
                      onChange={(e) => setTestPagePrinted(e.target.checked)}
                      className="h-4 w-4 rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <label htmlFor="testPageCheck" className="text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                      Test print successfully printed and verified for alignment, sharpness, and clean toner fusing
                    </label>
                  </div>

                  <div className="sm:col-span-3">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Remarks / Operational Feedback</label>
                    <input
                      type="text"
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                      placeholder="e.g. Return to passenger baggage check-in desk, tested fine."
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-800 outline-none focus:border-indigo-500 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-200"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-xl border border-slate-200 px-5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-indigo-600 px-6 py-2 text-xs font-bold text-white shadow-md shadow-indigo-500/20 hover:bg-indigo-500 transition"
                >
                  Save Maintenance & Repair Job
                </button>
              </div>
            </form>
          ) : activeTab === 'history' ? (
            /* Maintenance & Repair Log History */
            <div className="space-y-4">
              {/* Search & Filter Bar */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    value={historySearch}
                    onChange={(e) => setHistorySearch(e.target.value)}
                    placeholder="Search printer, model, technician, parts replaced, log number..."
                    className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 py-2 text-xs font-medium text-slate-800 outline-none focus:border-indigo-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
                  />
                </div>

                <select
                  value={historyServiceFilter}
                  onChange={(e) => setHistoryServiceFilter(e.target.value)}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
                >
                  <option value="ALL">All Service Types ({printerMaintenanceRecords.length})</option>
                  {SERVICE_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              {/* History Table */}
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
                    <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-black uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-400">
                      <tr>
                        <th className="py-3 px-4">Log # & Date</th>
                        <th className="py-3 px-4">Printer Unit</th>
                        <th className="py-3 px-4">Service Performed</th>
                        <th className="py-3 px-4">Parts Replaced</th>
                        <th className="py-3 px-4">Technician</th>
                        <th className="py-3 px-4">Cost (PKR)</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                      {filteredHistory.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="py-10 text-center text-xs text-slate-400">
                            No printer maintenance records found.
                          </td>
                        </tr>
                      ) : (
                        filteredHistory.map((rec) => (
                          <tr key={rec.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition">
                            <td className="py-3 px-4">
                              <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400 block">
                                {rec.id}
                              </span>
                              <span className="text-[10px] text-slate-400 font-medium">{rec.date}</span>
                            </td>
                            <td className="py-3 px-4">
                              <div className="font-bold text-slate-900 dark:text-white">{rec.printerName}</div>
                              <div className="text-[10px] text-slate-400">
                                {rec.model} • {rec.department}
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <span className="rounded-md bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 block w-fit">
                                {rec.serviceType}
                              </span>
                              <span className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                                {rec.issueReported}
                              </span>
                            </td>
                            <td className="py-3 px-4 max-w-xs">
                              <div className="text-slate-700 dark:text-slate-300 text-[11px] font-medium line-clamp-2">
                                {rec.partsChangedSummary || 'No parts changed'}
                              </div>
                            </td>
                            <td className="py-3 px-4 font-medium text-slate-700 dark:text-slate-300">
                              {rec.technicianName}
                            </td>
                            <td className="py-3 px-4 font-mono font-bold text-slate-800 dark:text-slate-200">
                              PKR {rec.costPkr?.toLocaleString() || 0}
                            </td>
                            <td className="py-3 px-4">
                              <span
                                className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                  rec.status === 'Completed'
                                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                    : rec.status === 'In Progress'
                                    ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                                    : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                                }`}
                              >
                                {rec.status}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  onClick={() => setViewRecord(rec)}
                                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-indigo-600 dark:hover:bg-slate-800 transition"
                                  title="View Full Job Card"
                                >
                                  <Eye className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => {
                                    if (confirm(`Delete maintenance record "${rec.id}"?`)) {
                                      deletePrinterMaintenanceRecord(rec.id);
                                    }
                                  }}
                                  className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40 transition"
                                  title="Delete record"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <div className="max-w-6xl mx-auto py-2">
              <TechnicianActivityDashboard
                onOpenMaintenanceForm={() => setActiveTab('form')}
              />
            </div>
          )}
        </div>

        {/* View Record Details Modal */}
        {viewRecord && (
          <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-4">
            <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 max-h-[85vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      Maintenance Job Sheet #{viewRecord.id}
                    </h3>
                    <p className="text-[10px] text-slate-400">PAA Airport Terminal IT Maintenance Record</p>
                  </div>
                </div>
                <button
                  onClick={() => setViewRecord(null)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/60">
                  <span className="text-[10px] text-slate-400 block font-semibold">Printer & Model:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {viewRecord.printerName} ({viewRecord.model})
                  </span>
                </div>
                <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/60">
                  <span className="text-[10px] text-slate-400 block font-semibold">Department & Location:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {viewRecord.department} — {formatLocation(viewRecord.location)}
                  </span>
                </div>
                <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/60">
                  <span className="text-[10px] text-slate-400 block font-semibold">Service Date & Technician:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {viewRecord.date} • {viewRecord.technicianName}
                  </span>
                </div>
                <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/60">
                  <span className="text-[10px] text-slate-400 block font-semibold">Service Status:</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    {viewRecord.status} (Test Page: {viewRecord.testPagePrinted ? 'Verified' : 'Pending'})
                  </span>
                </div>
              </div>

              <div className="space-y-2 text-xs">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Issue Reported</span>
                  <p className="mt-1 rounded-xl bg-slate-50 p-2.5 font-medium text-slate-700 dark:bg-slate-800/40 dark:text-slate-300">
                    {viewRecord.issueReported}
                  </p>
                </div>
                {(viewRecord.diagnosticsFound || viewRecord.actionTaken) && (
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Technical Diagnostics / Actions Taken</span>
                    <p className="mt-1 rounded-xl bg-slate-50 p-2.5 font-medium text-slate-700 dark:bg-slate-800/40 dark:text-slate-300">
                      {viewRecord.diagnosticsFound || viewRecord.actionTaken}
                    </p>
                  </div>
                )}
                {viewRecord.workPerformed && (
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Work Completed</span>
                    <p className="mt-1 rounded-xl bg-slate-50 p-2.5 font-medium text-slate-700 dark:bg-slate-800/40 dark:text-slate-300">
                      {viewRecord.workPerformed}
                    </p>
                  </div>
                )}
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Parts Changed</span>
                  <p className="mt-1 rounded-xl bg-emerald-50/60 border border-emerald-100 p-2.5 font-semibold text-emerald-900 dark:bg-emerald-950/30 dark:border-emerald-900/40 dark:text-emerald-300">
                    {viewRecord.partsChangedSummary || 'None'}
                  </p>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-xs text-slate-500 font-semibold">
                    Page Counter: {viewRecord.pageCount ? `${viewRecord.pageCount.toLocaleString()} pages` : 'N/A'}
                  </span>
                  <span className="text-xs font-mono font-bold text-slate-900 dark:text-white">
                    Total Service Cost: PKR {viewRecord.costPkr?.toLocaleString() || 0}
                  </span>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setViewRecord(null)}
                  className="rounded-xl bg-slate-800 px-4 py-1.5 text-xs font-bold text-white hover:bg-slate-700"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
