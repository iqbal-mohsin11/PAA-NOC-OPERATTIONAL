import React, { useState, useEffect } from 'react';
import { AssetItem, IssueTicket, PrinterMaintenanceRecord, TonerIssueRecord, PrinterPartItem } from '../types/inventory';
import { useInventory } from '../context/InventoryContext';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  X,
  Plus,
  Wrench,
  Printer,
  FileText,
  User,
  Building2,
  Calendar,
  Layers,
  Sparkles,
  Info,
  Check,
  RotateCw,
  Droplet,
  Package,
  Activity,
  ArrowRight,
  ShieldCheck,
  Cpu,
  Search,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { TechnicianSelectDropdown } from './TechnicianSelectDropdown';

export interface PrinterGriefDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  asset: AssetItem | null;
  onOpenMaintenanceForm?: (assetId: string) => void;
  onOpenTonerIssueModal?: (asset?: AssetItem, mode?: 'new' | 'refill') => void;
  onSelectAsset?: (asset: AssetItem) => void;
  initialTab?: 'brief' | 'grief' | 'toner' | 'maintenance' | 'parts';
}

const COMMON_PRINTER_GRIEFS = [
  'Paper Jam in Tray 2 / Internal Pickup Roller',
  'Fuser Unit Heating Error / 50.4 Service Alarm',
  'Pickup & Separation Roller Slipping (Multifeed)',
  'Faint / Ghosting Print Output (Toner or Drum Worn)',
  'Vertical Black / Colored Streaks on Printout',
  'Communication Timeout / Network Spooler Offline',
  'Toner Cartridge Not Recognized / Chip Error',
  'Duplex Unit Jam / Paper Accordion in Rear Door',
  'Loud Grinding Noise from Main Drive Gearbox',
  'Blank Pages Output / Laser Scanner Shutter Stuck',
];

const COMMON_SCANNER_GRIEFS = [
  'ADF Feeder Multiple Consignment Sheets Jam',
  'Faint Vertical Line on Scanned Image (Dirty Glass / Sensor)',
  'Optical CIS / CCD Calibration Error on Startup',
  'Scanner Motor Grinding Noise / Carriage Stuck',
  'TWAIN / ISIS Driver Communication Error via USB',
  'Slow Document Processing / High Duty Thermal Pause',
];

export const PrinterGriefDetailModal: React.FC<PrinterGriefDetailModalProps> = ({
  isOpen,
  onClose,
  asset,
  onOpenMaintenanceForm,
  onOpenTonerIssueModal,
  onSelectAsset,
  initialTab = 'brief',
}) => {
  const {
    assets,
    tickets,
    addTicket,
    updateTicketStatus,
    currentUser,
    printerMaintenanceRecords,
    tonerIssueRecords,
    printerParts,
    tonerModels,
  } = useInventory();

  // All eligible printer / scanner assets
  const allPrinterAssets = assets.filter(
    (a) => !a.isRemoved && (a.category === 'Printer' || a.category === 'Scanner')
  );

  // Active current asset state with fallback
  const [selectedAssetId, setSelectedAssetId] = useState<string>(
    asset?.id || allPrinterAssets[0]?.id || ''
  );

  useEffect(() => {
    if (asset?.id) {
      setSelectedAssetId(asset.id);
    } else if (allPrinterAssets.length > 0 && !selectedAssetId) {
      setSelectedAssetId(allPrinterAssets[0].id);
    }
  }, [asset?.id, allPrinterAssets]);

  const currentAsset: AssetItem | undefined =
    assets.find((a) => a.id === selectedAssetId) || asset || allPrinterAssets[0];

  const [activeTab, setActiveTab] = useState<'brief' | 'grief' | 'toner' | 'maintenance' | 'parts'>('brief');
  const [griefSubTab, setGriefSubTab] = useState<'current' | 'new_grief' | 'history'>('current');

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  // New Grief form state
  const [selectedQuickGrief, setSelectedQuickGrief] = useState('');
  const [customDescription, setCustomDescription] = useState('');
  const [priority, setPriority] = useState<IssueTicket['priority']>('High');
  const [assignedEngineer, setAssignedEngineer] = useState(
    currentUser?.displayName || currentUser?.username || 'Engr. Tariq Mehmood (Hardware Tech)'
  );
  const [reportingUser, setReportingUser] = useState(currentAsset?.assignedUser || 'Duty Officer');
  const [formSuccess, setFormSuccess] = useState(false);

  // Resolving ticket state
  const [resolvingTicketNumber, setResolvingTicketNumber] = useState<string | null>(null);
  const [resolutionRemarks, setResolutionRemarks] = useState('');

  if (!isOpen || !currentAsset) return null;

  const isPrinter = currentAsset.category === 'Printer';
  const isColor =
    (isPrinter && currentAsset.printerSpecs?.colorType === 'Color') ||
    currentAsset.name.toLowerCase().includes('color') ||
    currentAsset.model.toLowerCase().includes('color') ||
    !isPrinter;

  const tonerLvl = currentAsset.printerSpecs?.tonerLevel ?? 100;
  const isLowToner = isPrinter && tonerLvl <= 25;

  // CMYK percentages for color display
  const cmyk = {
    c: Math.min(100, Math.max(15, Math.round(tonerLvl * 0.95))),
    m: Math.min(100, Math.max(10, Math.round(tonerLvl * 0.82))),
    y: Math.min(100, Math.max(20, Math.round(tonerLvl * 1.05))),
    k: tonerLvl,
  };

  // Filter tickets related to this asset
  const assetTickets = tickets.filter((t) => t.assetId === currentAsset.id);
  const openTickets = assetTickets.filter(
    (t) => t.status === 'Open' || t.status === 'Working' || t.status === 'Pending'
  );
  const closedTickets = assetTickets.filter((t) => t.status === 'Closed');

  // Filter maintenance records for this asset
  const assetMaintenance = printerMaintenanceRecords.filter(
    (r) =>
      r.assetId === currentAsset.id ||
      r.printerName.toLowerCase().includes(currentAsset.name.toLowerCase())
  );

  // Total maintenance spend
  const totalMaintenanceCost = assetMaintenance.reduce((sum, r) => sum + (r.costPkr || 0), 0);

  // Filter toner issue records for this asset
  const assetTonerIssues = tonerIssueRecords.filter(
    (r) =>
      r.assetId === currentAsset.id ||
      (r.printerName && r.printerName.toLowerCase().includes(currentAsset.name.toLowerCase()))
  );

  // Replaced parts on this printer across all maintenance records
  const partsReplacedOnThisPrinter: {
    partName: string;
    partNumber?: string;
    quantity: number;
    unitCostPkr?: number;
    oldPartStatus?: string;
    date: string;
    jobId: string;
  }[] = [];

  assetMaintenance.forEach((m) => {
    if (m.partsChanged && m.partsChanged.length > 0) {
      m.partsChanged.forEach((p) => {
        partsReplacedOnThisPrinter.push({
          partName: p.partName,
          partNumber: p.partNumber,
          quantity: p.quantity,
          unitCostPkr: p.unitCostPkr,
          oldPartStatus: p.oldPartStatus,
          date: m.date,
          jobId: m.id,
        });
      });
    }
  });

  // Compatible spare parts from inventory catalog
  const targetModelStr = `${currentAsset.name} ${currentAsset.brand} ${currentAsset.model}`.toLowerCase();
  const compatibleSpares = printerParts.filter((part) => {
    return part.compatibleModels.some((m) => targetModelStr.includes(m.toLowerCase()));
  });

  // Handle Grief Submission
  const handleCreateGrief = (e: React.FormEvent) => {
    e.preventDefault();
    const finalDesc = selectedQuickGrief
      ? customDescription.trim()
        ? `${selectedQuickGrief} — ${customDescription.trim()}`
        : selectedQuickGrief
      : customDescription.trim();

    if (!finalDesc) return;

    addTicket({
      assetId: currentAsset.id,
      deviceName: `${currentAsset.name} (${currentAsset.brand} ${currentAsset.model})`,
      department: currentAsset.department,
      user: reportingUser.trim() || currentAsset.assignedUser,
      description: finalDesc,
      dateReported: new Date().toISOString().replace('T', ' ').slice(0, 16),
      priority,
      assignedEngineer: assignedEngineer.trim() || 'IT Duty Engineer',
      status: 'Open',
    });

    setFormSuccess(true);
    setTimeout(() => {
      setFormSuccess(false);
      setSelectedQuickGrief('');
      setCustomDescription('');
      setGriefSubTab('current');
    }, 1200);
  };

  // Handle Grief Resolution
  const handleResolveGrief = (ticketNumber: string) => {
    const finalResolution =
      resolutionRemarks.trim() ||
      'Defect investigated & repaired by IT hardware engineering. Test output verified normal.';
    updateTicketStatus(
      ticketNumber,
      'Closed',
      finalResolution,
      new Date().toISOString().replace('T', ' ').slice(0, 16)
    );
    setResolvingTicketNumber(null);
    setResolutionRemarks('');
  };

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
      <div className="relative w-full max-w-4xl rounded-2xl bg-white shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden my-6 flex flex-col max-h-[92vh]">
        {/* Top Title Bar */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-5 py-3.5 dark:border-slate-800 dark:bg-slate-800/80">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-xl text-white shadow-sm ${
                openTickets.length > 0 ? 'bg-rose-600' : 'bg-emerald-600'
              }`}
            >
              {openTickets.length > 0 ? (
                <AlertTriangle className="h-5 w-5 animate-pulse" />
              ) : (
                <Printer className="h-5 w-5" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                  Printer & Scanner Grief Detail Center
                </h2>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider ${
                    openTickets.length > 0
                      ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                      : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                  }`}
                >
                  {openTickets.length > 0
                    ? `🚨 ${openTickets.length} Active Grief Logged`
                    : '🟢 Grief-Free (Operational)'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Detailed audit of printer specifications, toner condition, repair & maintenance history, and parts catalog.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Quick Switcher Dropdown */}
            <div className="hidden sm:flex items-center gap-1.5 text-xs">
              <span className="text-[11px] font-bold text-slate-500">Switch:</span>
              <select
                value={selectedAssetId}
                onChange={(e) => {
                  setSelectedAssetId(e.target.value);
                  const found = assets.find((a) => a.id === e.target.value);
                  if (found && onSelectAsset) onSelectAsset(found);
                }}
                className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs font-semibold text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              >
                {allPrinterAssets.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.id} — {p.name} ({p.department})
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Equipment Identification & 360° Metrics Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white p-4 sm:p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-xs font-black px-2.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {currentAsset.id}
                </span>
                <span className="text-xs font-bold text-slate-300">
                  {currentAsset.brand} {currentAsset.model}
                </span>
                <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-bold text-slate-200">
                  {currentAsset.category}
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-black text-white mt-1 leading-snug">
                {currentAsset.name}
              </h3>
              <p className="text-xs text-slate-300 mt-0.5">
                Dept: <span className="text-emerald-400 font-semibold">{currentAsset.department}</span> • User:{' '}
                <span className="text-white font-medium">{currentAsset.assignedUser}</span> • Location:{' '}
                <span className="text-slate-300">{formatLocation(currentAsset.location)}</span>
              </p>
            </div>

            {/* Color Display Capabilities Pill */}
            <div className="flex flex-col items-start sm:items-end gap-1.5">
              {isColor ? (
                <div className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-3 py-1.5 border border-white/20 backdrop-blur-xs">
                  <div className="flex items-center gap-1">
                    <span className="h-3 w-3 rounded-full bg-cyan-400 shadow-xs" title="Cyan (C)" />
                    <span className="h-3 w-3 rounded-full bg-pink-500 shadow-xs" title="Magenta (M)" />
                    <span className="h-3 w-3 rounded-full bg-amber-300 shadow-xs" title="Yellow (Y)" />
                    <span className="h-3 w-3 rounded-full bg-slate-900 border border-white/40 shadow-xs" title="Black (K)" />
                  </div>
                  <span className="text-xs font-black tracking-wide text-cyan-200">
                    {isPrinter ? 'COLOR DISPLAY / CMYK' : 'COLOR OPTICAL SCAN'}
                  </span>
                </div>
              ) : (
                <div className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-3 py-1.5 border border-white/20">
                  <span className="h-3 w-3 rounded-full bg-slate-900 border border-slate-400" />
                  <span className="text-xs font-black tracking-wide text-slate-200">
                    MONO LASER (HIGH-YIELD)
                  </span>
                </div>
              )}

              <div className="text-[11px] text-slate-300 flex items-center gap-2 font-mono">
                <span>SN: {currentAsset.serialNumber}</span>
                {currentAsset.printerSpecs?.tonerModel && <span>• Toner: {currentAsset.printerSpecs.tonerModel}</span>}
              </div>
            </div>
          </div>

          {/* 4 Interactive Quick Summary Metric Badges */}
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3 border-t border-white/10 text-xs">
            <button
              onClick={() => setActiveTab('grief')}
              className={`rounded-xl p-2 text-left transition flex items-center gap-2.5 ${
                openTickets.length > 0
                  ? 'bg-rose-500/20 border border-rose-500/40 text-rose-200 hover:bg-rose-500/30'
                  : 'bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10'
              }`}
            >
              <AlertTriangle className={`h-4 w-4 ${openTickets.length > 0 ? 'text-rose-400' : 'text-slate-400'}`} />
              <div>
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Grief Status</span>
                <span className="font-bold">{openTickets.length > 0 ? `${openTickets.length} Active Faults` : 'Grief-Free'}</span>
              </div>
            </button>

            <button
              onClick={() => setActiveTab('toner')}
              className={`rounded-xl p-2 text-left transition flex items-center gap-2.5 ${
                isLowToner
                  ? 'bg-amber-500/20 border border-amber-500/40 text-amber-200 hover:bg-amber-500/30'
                  : 'bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10'
              }`}
            >
              <Droplet className={`h-4 w-4 ${isLowToner ? 'text-amber-400' : 'text-teal-400'}`} />
              <div>
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Toner Level</span>
                <span className="font-bold">{tonerLvl}% ({currentAsset.printerSpecs?.tonerModel || 'Laser'})</span>
              </div>
            </button>

            <button
              onClick={() => setActiveTab('maintenance')}
              className="rounded-xl p-2 text-left bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 transition flex items-center gap-2.5"
            >
              <Wrench className="h-4 w-4 text-indigo-400" />
              <div>
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Maintenance</span>
                <span className="font-bold">{assetMaintenance.length} Records (PKR {totalMaintenanceCost.toLocaleString()})</span>
              </div>
            </button>

            <button
              onClick={() => setActiveTab('parts')}
              className="rounded-xl p-2 text-left bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 transition flex items-center gap-2.5"
            >
              <Package className="h-4 w-4 text-emerald-400" />
              <div>
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Parts Replaced</span>
                <span className="font-bold">{partsReplacedOnThisPrinter.length} Components Changed</span>
              </div>
            </button>
          </div>
        </div>

        {/* 5 Distinct Primary Tabs Requested by User */}
        <div className="flex border-b border-slate-200 bg-slate-100/80 px-4 sm:px-6 dark:border-slate-800 dark:bg-slate-800/50 text-xs font-bold overflow-x-auto">
          {/* Tab 1: Brief */}
          <button
            onClick={() => setActiveTab('brief')}
            className={`flex items-center gap-1.5 py-3 px-3.5 border-b-2 whitespace-nowrap transition ${
              activeTab === 'brief'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400 bg-white dark:bg-slate-900 shadow-xs'
                : 'border-transparent text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <Printer className="h-3.5 w-3.5" />
            <span>🖨️ Printer Brief</span>
          </button>

          {/* Tab 2: Grief */}
          <button
            onClick={() => setActiveTab('grief')}
            className={`flex items-center gap-1.5 py-3 px-3.5 border-b-2 whitespace-nowrap transition ${
              activeTab === 'grief'
                ? 'border-rose-600 text-rose-600 dark:text-rose-400 bg-white dark:bg-slate-900 shadow-xs'
                : 'border-transparent text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <AlertTriangle className="h-3.5 w-3.5" />
            <span>🚨 Grief & Trouble Tickets ({openTickets.length})</span>
          </button>

          {/* Tab 3: Toner */}
          <button
            onClick={() => setActiveTab('toner')}
            className={`flex items-center gap-1.5 py-3 px-3.5 border-b-2 whitespace-nowrap transition ${
              activeTab === 'toner'
                ? 'border-teal-600 text-teal-600 dark:text-teal-400 bg-white dark:bg-slate-900 shadow-xs'
                : 'border-transparent text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <Droplet className="h-3.5 w-3.5" />
            <span>💧 Toner in Detail ({tonerLvl}%)</span>
          </button>

          {/* Tab 4: Repair & Maintenance */}
          <button
            onClick={() => setActiveTab('maintenance')}
            className={`flex items-center gap-1.5 py-3 px-3.5 border-b-2 whitespace-nowrap transition ${
              activeTab === 'maintenance'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-white dark:bg-slate-900 shadow-xs'
                : 'border-transparent text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <Wrench className="h-3.5 w-3.5" />
            <span>🔧 Repair & Maintenance ({assetMaintenance.length})</span>
          </button>

          {/* Tab 5: Printer Parts */}
          <button
            onClick={() => setActiveTab('parts')}
            className={`flex items-center gap-1.5 py-3 px-3.5 border-b-2 whitespace-nowrap transition ${
              activeTab === 'parts'
                ? 'border-amber-600 text-amber-600 dark:text-amber-400 bg-white dark:bg-slate-900 shadow-xs'
                : 'border-transparent text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <Package className="h-3.5 w-3.5" />
            <span>📦 Printer Parts ({partsReplacedOnThisPrinter.length} Replaced)</span>
          </button>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          {/* ============================================================ */}
          {/* TAB 1: PRINTER HARDWARE BRIEF */}
          {/* ============================================================ */}
          {activeTab === 'brief' && (
            <div className="space-y-5">
              {/* Executive Hardware Profile */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4.5 dark:border-slate-800 dark:bg-slate-800/40 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2.5 dark:border-slate-700">
                  <div className="flex items-center gap-2">
                    <Printer className="h-4 w-4 text-emerald-600" />
                    <span className="font-bold text-xs uppercase tracking-wider text-slate-800 dark:text-slate-200">
                      PAA Equipment Hardware Specification Brief
                    </span>
                  </div>
                  <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
                    Status: {currentAsset.status || 'Active'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                  <div className="rounded-xl border border-slate-200/80 bg-white p-3 dark:border-slate-700 dark:bg-slate-900">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Asset ID & Category</span>
                    <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-sm">{currentAsset.id}</span>
                    <span className="text-slate-500 block text-[11px]">{currentAsset.category} Hardware</span>
                  </div>

                  <div className="rounded-xl border border-slate-200/80 bg-white p-3 dark:border-slate-700 dark:bg-slate-900">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Make & Model</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">{currentAsset.brand} {currentAsset.model}</span>
                    <span className="text-slate-500 block text-[11px]">Serial: {currentAsset.serialNumber || 'N/A'}</span>
                  </div>

                  <div className="rounded-xl border border-slate-200/80 bg-white p-3 dark:border-slate-700 dark:bg-slate-900">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Department & Officer</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">{currentAsset.department}</span>
                    <span className="text-slate-500 block text-[11px]">User: {currentAsset.assignedUser}</span>
                  </div>

                  <div className="rounded-xl border border-slate-200/80 bg-white p-3 dark:border-slate-700 dark:bg-slate-900">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Location & Room</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{formatLocation(currentAsset.location)}</span>
                    <span className="text-slate-500 block text-[11px]">Aviation Facility</span>
                  </div>

                  <div className="rounded-xl border border-slate-200/80 bg-white p-3 dark:border-slate-700 dark:bg-slate-900">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Print Technology & Speed</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {isPrinter ? (currentAsset.printerSpecs?.printerType || 'LaserJet') : (currentAsset.scannerSpecs?.scannerType || 'Flatbed/ADF')}
                    </span>
                    <span className="text-slate-500 block text-[11px]">
                      {isPrinter ? (currentAsset.printerSpecs?.duplex ? 'Auto-Duplex Enabled' : 'Single-Sided Manual') : '600x600 DPI High-Res'}
                    </span>
                  </div>

                  <div className="rounded-xl border border-slate-200/80 bg-white p-3 dark:border-slate-700 dark:bg-slate-900">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Interface & Spooler</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {isPrinter ? (currentAsset.printerSpecs?.connectionType || 'Network & USB') : 'USB 3.0 / TWAIN'}
                    </span>
                    <span className="text-slate-500 block text-[11px]">TCP/IP RAW 9100 Ready</span>
                  </div>
                </div>
              </div>

              {/* Action Quick Shortcuts */}
              <div className="rounded-2xl border border-indigo-100 bg-indigo-50/50 p-4 dark:border-indigo-900/40 dark:bg-indigo-950/20">
                <span className="text-xs font-bold text-indigo-900 dark:text-indigo-300 block mb-2">
                  Direct Action Shortcuts for {currentAsset.name}:
                </span>
                <div className="flex flex-wrap gap-2 text-xs">
                  <button
                    onClick={() => {
                      setActiveTab('grief');
                      setGriefSubTab('new_grief');
                    }}
                    className="flex items-center gap-1.5 rounded-xl bg-rose-600 px-3.5 py-2 font-bold text-white hover:bg-rose-500 shadow-xs transition"
                  >
                    <AlertTriangle className="h-3.5 w-3.5" />
                    <span>Report Grief / Fault</span>
                  </button>

                  {isPrinter && (
                    <>
                      <button
                        onClick={() => {
                          if (onOpenTonerIssueModal) {
                            onClose();
                            onOpenTonerIssueModal(currentAsset, 'refill');
                          } else {
                            setActiveTab('toner');
                          }
                        }}
                        className="flex items-center gap-1.5 rounded-xl bg-teal-600 px-3.5 py-2 font-bold text-white hover:bg-teal-500 shadow-xs transition"
                      >
                        <RotateCw className="h-3.5 w-3.5" />
                        <span>Issue Refill Toner</span>
                      </button>

                      <button
                        onClick={() => {
                          if (onOpenMaintenanceForm) {
                            onClose();
                            onOpenMaintenanceForm(currentAsset.id);
                          } else {
                            setActiveTab('maintenance');
                          }
                        }}
                        className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-2 font-bold text-white hover:bg-indigo-500 shadow-xs transition"
                      >
                        <Wrench className="h-3.5 w-3.5" />
                        <span>Log Repair & Change Parts</span>
                      </button>
                    </>
                  )}

                  <button
                    onClick={() => setActiveTab('parts')}
                    className="flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2 font-bold text-slate-800 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 transition"
                  >
                    <Package className="h-3.5 w-3.5 text-amber-500" />
                    <span>Check Spare Parts ({compatibleSpares.length} Available)</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* TAB 2: GRIEF & TROUBLE TICKETS */}
          {/* ============================================================ */}
          {activeTab === 'grief' && (
            <div className="space-y-4">
              {/* Grief Sub-Navigation */}
              <div className="flex items-center justify-between border-b border-slate-200 pb-2 dark:border-slate-700">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setGriefSubTab('current')}
                    className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                      griefSubTab === 'current'
                        ? 'bg-rose-600 text-white shadow-xs'
                        : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
                    }`}
                  >
                    Active Griefs ({openTickets.length})
                  </button>
                  <button
                    onClick={() => setGriefSubTab('new_grief')}
                    className={`flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                      griefSubTab === 'new_grief'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Log New Grief</span>
                  </button>
                  <button
                    onClick={() => setGriefSubTab('history')}
                    className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                      griefSubTab === 'history'
                        ? 'bg-slate-800 text-white shadow-xs dark:bg-slate-700'
                        : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
                    }`}
                  >
                    Grief History ({closedTickets.length})
                  </button>
                </div>

                <span className="text-[11px] text-slate-400 font-medium">
                  {openTickets.length === 0 ? 'Equipment Healthy' : 'Action Required'}
                </span>
              </div>

              {/* Subtab 1: Active Tickets */}
              {griefSubTab === 'current' && (
                <div className="space-y-3">
                  {openTickets.length === 0 ? (
                    <div className="rounded-2xl border-2 border-dashed border-emerald-300 bg-emerald-50/60 p-8 text-center dark:border-emerald-900/60 dark:bg-emerald-950/20">
                      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/50 dark:text-emerald-400 mb-3">
                        <CheckCircle2 className="h-8 w-8" />
                      </div>
                      <h4 className="text-base font-bold text-emerald-900 dark:text-emerald-200">
                        No Active Grief / Breakdown on this Unit
                      </h4>
                      <p className="mt-1 text-xs text-emerald-700 dark:text-emerald-400 max-w-md mx-auto">
                        This equipment is operational with zero unresolved complaints or hardware trouble tickets.
                      </p>
                      <button
                        onClick={() => setGriefSubTab('new_grief')}
                        className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-4 py-2 text-xs font-bold text-white shadow-xs transition"
                      >
                        <Plus className="h-4 w-4" />
                        <span>Log Equipment Grief / Fault</span>
                      </button>
                    </div>
                  ) : (
                    openTickets.map((ticket) => {
                      const isResolving = resolvingTicketNumber === ticket.ticketNumber;
                      const isCritical = ticket.priority === 'Critical';
                      const isHigh = ticket.priority === 'High';

                      return (
                        <div
                          key={ticket.ticketNumber}
                          className={`rounded-2xl border p-4.5 transition shadow-xs ${
                            isCritical
                              ? 'border-red-300 bg-red-50/70 dark:border-red-800 dark:bg-red-950/40'
                              : isHigh
                              ? 'border-rose-300 bg-rose-50/70 dark:border-rose-800 dark:bg-rose-950/40'
                              : 'border-amber-300 bg-amber-50/70 dark:border-amber-800 dark:bg-amber-950/40'
                          }`}
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-black/5 pb-2.5 dark:border-white/5">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs font-black text-rose-700 dark:text-rose-300">
                                {ticket.ticketNumber}
                              </span>
                              <span
                                className={`rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider ${
                                  isCritical
                                    ? 'bg-red-600 text-white'
                                    : isHigh
                                    ? 'bg-rose-600 text-white'
                                    : 'bg-amber-500 text-white'
                                }`}
                              >
                                {ticket.priority} Priority
                              </span>
                              <span className="rounded-full bg-slate-200/80 px-2 py-0.5 text-[10px] font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                Status: {ticket.status}
                              </span>
                            </div>
                            <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                              <Calendar className="h-3.5 w-3.5" />
                              <span>Logged: {ticket.dateReported}</span>
                            </div>
                          </div>

                          <div className="mt-2.5">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                              Reported Fault / Grief Description:
                            </span>
                            <p className="mt-0.5 text-sm font-bold text-slate-900 dark:text-white leading-relaxed">
                              "{ticket.description}"
                            </p>
                          </div>

                          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-300 bg-white/70 dark:bg-slate-900/70 p-2.5 rounded-xl border border-black/5 dark:border-white/5">
                            <div>
                              <span className="text-[10px] text-slate-400 block">Reported By:</span>
                              <span className="font-semibold">{ticket.user}</span> ({ticket.department})
                            </div>
                            <div>
                              <span className="text-[10px] text-slate-400 block">Assigned Engineer:</span>
                              <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                                {ticket.assignedEngineer || 'Unassigned'}
                              </span>
                            </div>
                          </div>

                          {/* Resolution Section */}
                          {isResolving ? (
                            <div className="mt-3 rounded-xl border border-emerald-300 bg-emerald-50 p-3.5 dark:border-emerald-800 dark:bg-emerald-950/40">
                              <label className="block text-xs font-bold text-emerald-900 dark:text-emerald-200 mb-1">
                                Resolution Remarks & Action Taken:
                              </label>
                              <textarea
                                value={resolutionRemarks}
                                onChange={(e) => setResolutionRemarks(e.target.value)}
                                placeholder="Detail steps taken to fix the defect (e.g. replaced pickup roller, cleaned mirror optics, cleared fuser jam, test print successful)..."
                                className="w-full rounded-lg border border-emerald-300 bg-white p-2.5 text-xs text-slate-900 dark:border-emerald-700 dark:bg-slate-900 dark:text-white outline-none"
                                rows={2}
                              />
                              <div className="mt-2 flex items-center justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={() => setResolvingTicketNumber(null)}
                                  className="rounded-lg px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-800 transition"
                                >
                                  Cancel
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleResolveGrief(ticket.ticketNumber)}
                                  className="flex items-center gap-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs transition"
                                >
                                  <Check className="h-3.5 w-3.5" />
                                  <span>Confirm Resolution</span>
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-black/5 dark:border-white/5">
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() =>
                                    updateTicketStatus(
                                      ticket.ticketNumber,
                                      ticket.status === 'Working' ? 'Open' : 'Working'
                                    )
                                  }
                                  className={`rounded-lg px-3 py-1.5 text-xs font-bold transition border ${
                                    ticket.status === 'Working'
                                      ? 'bg-blue-600 text-white border-blue-600'
                                      : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700'
                                  }`}
                                >
                                  {ticket.status === 'Working' ? '⚙️ Under Repair (Working)' : 'Mark In-Progress'}
                                </button>

                                {isPrinter && onOpenMaintenanceForm && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      onClose();
                                      onOpenMaintenanceForm(currentAsset.id);
                                    }}
                                    className="flex items-center gap-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 px-3 py-1.5 text-xs font-bold text-white shadow-xs transition"
                                  >
                                    <Wrench className="h-3.5 w-3.5" />
                                    <span>Log Parts / Repair Job</span>
                                  </button>
                                )}
                              </div>

                              <button
                                type="button"
                                onClick={() => {
                                  setResolvingTicketNumber(ticket.ticketNumber);
                                  setResolutionRemarks('');
                                }}
                                className="flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs transition ml-auto"
                              >
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                <span>Resolve Grief</span>
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {/* Subtab 2: Log New Grief Form */}
              {griefSubTab === 'new_grief' && (
                <form onSubmit={handleCreateGrief} className="rounded-2xl border border-slate-200 bg-white p-4.5 dark:border-slate-800 dark:bg-slate-900 space-y-4">
                  {formSuccess && (
                    <div className="rounded-xl bg-emerald-100 border border-emerald-300 p-3 text-emerald-900 font-bold text-xs flex items-center gap-2 dark:bg-emerald-950/60 dark:text-emerald-200 dark:border-emerald-800">
                      <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                      <span>Grief ticket registered! Dispatched to IT airport maintenance roster.</span>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Quick Select Common {isPrinter ? 'Printer' : 'Scanner'} Grief Symptom:
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      {(isPrinter ? COMMON_PRINTER_GRIEFS : COMMON_SCANNER_GRIEFS).map((symptom) => {
                        const isSelected = selectedQuickGrief === symptom;
                        return (
                          <button
                            key={symptom}
                            type="button"
                            onClick={() => setSelectedQuickGrief(isSelected ? '' : symptom)}
                            className={`text-left rounded-xl p-2 text-xs font-medium transition border ${
                              isSelected
                                ? 'border-indigo-600 bg-indigo-50 text-indigo-900 dark:bg-indigo-950/50 dark:text-indigo-200 dark:border-indigo-500 font-bold'
                                : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-300'
                            }`}
                          >
                            {isSelected ? '✓ ' : '• '} {symptom}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Detailed Defect Description / Observations *
                    </label>
                    <textarea
                      value={customDescription}
                      onChange={(e) => setCustomDescription(e.target.value)}
                      placeholder="Specify error messages, audible noise, paper jam code, or print artifact description..."
                      className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      rows={3}
                      required={!selectedQuickGrief}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Severity / Priority *
                      </label>
                      <select
                        value={priority}
                        onChange={(e) => setPriority(e.target.value as IssueTicket['priority'])}
                        className="w-full rounded-xl border border-slate-300 bg-white p-2 text-xs font-bold text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      >
                        <option value="Critical">🔴 Critical (Halts Flight Ops)</option>
                        <option value="High">🟠 High (Frequent Malfunction)</option>
                        <option value="Medium">🟡 Medium (Degraded Output)</option>
                        <option value="Low">⚪ Low (Routine / Cosmetic)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Reported By (Officer / Counter):
                      </label>
                      <input
                        type="text"
                        value={reportingUser}
                        onChange={(e) => setReportingUser(e.target.value)}
                        className="w-full rounded-xl border border-slate-300 bg-white p-2 text-xs font-bold text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                        placeholder="Duty Officer"
                      />
                    </div>

                    <div>
                      <TechnicianSelectDropdown
                        value={assignedEngineer}
                        onChange={setAssignedEngineer}
                        label="Assigned Hardware Tech"
                        required
                        showCardPreview={false}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setGriefSubTab('current')}
                      className="rounded-xl px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 px-5 py-2 text-xs font-bold text-white shadow-xs transition"
                    >
                      <AlertTriangle className="h-4 w-4" />
                      <span>Register Equipment Grief</span>
                    </button>
                  </div>
                </form>
              )}

              {/* Subtab 3: Resolved History */}
              {griefSubTab === 'history' && (
                <div className="space-y-2.5">
                  {closedTickets.length === 0 ? (
                    <div className="text-center py-8 text-xs text-slate-400">
                      No resolved tickets on record for this asset.
                    </div>
                  ) : (
                    closedTickets.map((t) => (
                      <div
                        key={t.ticketNumber}
                        className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 text-xs dark:border-slate-800 dark:bg-slate-800/40"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                            {t.ticketNumber}
                          </span>
                          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                            Resolved / Closed
                          </span>
                        </div>
                        <p className="mt-1 font-semibold text-slate-800 dark:text-slate-200">
                          {t.description}
                        </p>
                        {t.resolution && (
                          <div className="mt-1.5 rounded-lg bg-emerald-50 border border-emerald-200 p-2 text-[11px] text-emerald-900 dark:bg-emerald-950/30 dark:border-emerald-800 dark:text-emerald-300">
                            <strong>Resolution Action:</strong> {t.resolution}
                          </div>
                        )}
                        <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400">
                          <span>Logged: {t.dateReported}</span>
                          <span>Tech: {t.assignedEngineer}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )}

          {/* ============================================================ */}
          {/* TAB 3: TONER IN DETAIL */}
          {/* ============================================================ */}
          {activeTab === 'toner' && (
            <div className="space-y-5">
              {/* Toner Level & Cartridge Specification Card */}
              <div className="rounded-2xl border border-teal-200 bg-teal-50/50 p-4.5 dark:border-teal-900/50 dark:bg-teal-950/20 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Droplet className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                        Installed Toner & Supply Level Status
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Compatible Cartridge: <strong>{currentAsset.printerSpecs?.tonerModel || 'Standard Laser Cartridge'}</strong>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        if (onOpenTonerIssueModal) {
                          onClose();
                          onOpenTonerIssueModal(currentAsset, 'refill');
                        }
                      }}
                      className="flex items-center gap-1.5 rounded-xl bg-teal-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-teal-500 shadow-xs transition"
                    >
                      <RotateCw className="h-3.5 w-3.5" />
                      <span>Issue Refill</span>
                    </button>
                    <button
                      onClick={() => {
                        if (onOpenTonerIssueModal) {
                          onClose();
                          onOpenTonerIssueModal(currentAsset, 'new');
                        }
                      }}
                      className="flex items-center gap-1.5 rounded-xl border border-teal-600 bg-white px-3 py-1.5 text-xs font-bold text-teal-800 hover:bg-teal-50 dark:bg-slate-800 dark:text-teal-300 transition"
                    >
                      <Droplet className="h-3.5 w-3.5 text-teal-600" />
                      <span>Issue New Toner</span>
                    </button>
                  </div>
                </div>

                {/* Visual Level Display */}
                {isColor ? (
                  <div className="rounded-xl bg-white p-4 dark:bg-slate-900 border border-teal-100 dark:border-teal-900/40 space-y-3">
                    <span className="text-[11px] font-black uppercase text-slate-500 tracking-wider block">
                      CMYK 4-Color Cartridge Channel Status:
                    </span>
                    <div className="grid grid-cols-4 gap-3 text-center text-xs font-bold">
                      <div className="space-y-1">
                        <div className="h-3 w-full rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                          <div className="h-full bg-cyan-400" style={{ width: `${cmyk.c}%` }} />
                        </div>
                        <span className="text-cyan-600 dark:text-cyan-400 text-[11px]">Cyan: {cmyk.c}%</span>
                      </div>
                      <div className="space-y-1">
                        <div className="h-3 w-full rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                          <div className="h-full bg-pink-500" style={{ width: `${cmyk.m}%` }} />
                        </div>
                        <span className="text-pink-600 dark:text-pink-400 text-[11px]">Magenta: {cmyk.m}%</span>
                      </div>
                      <div className="space-y-1">
                        <div className="h-3 w-full rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                          <div className="h-full bg-amber-400" style={{ width: `${cmyk.y}%` }} />
                        </div>
                        <span className="text-amber-600 dark:text-amber-400 text-[11px]">Yellow: {cmyk.y}%</span>
                      </div>
                      <div className="space-y-1">
                        <div className="h-3 w-full rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                          <div className="h-full bg-slate-900 dark:bg-slate-200" style={{ width: `${cmyk.k}%` }} />
                        </div>
                        <span className="text-slate-800 dark:text-slate-200 text-[11px]">Black: {cmyk.k}%</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-xl bg-white p-4 dark:bg-slate-900 border border-teal-100 dark:border-teal-900/40">
                    <div className="flex items-center justify-between text-xs font-bold mb-2">
                      <span className="text-slate-700 dark:text-slate-300">Monochrome Laser Black Toner Yield:</span>
                      <span className={isLowToner ? 'text-rose-600 font-black' : 'text-emerald-600 font-black'}>
                        {tonerLvl}% {isLowToner && '(Low Toner Warning)'}
                      </span>
                    </div>
                    <div className="h-3 w-full rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                      <div
                        className={`h-full ${isLowToner ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500'}`}
                        style={{ width: `${tonerLvl}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Toner Issue History for this Printer */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-800 dark:text-slate-200 text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-teal-600" />
                    <span>Toner Issuance & Refill Log Sheet ({assetTonerIssues.length} records)</span>
                  </h4>
                  <span className="text-[11px] text-slate-400">PAA Central Store Register</span>
                </div>

                {assetTonerIssues.length === 0 ? (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-6 text-center text-xs text-slate-400 dark:border-slate-800 dark:bg-slate-800/40">
                    No toner issues logged yet for this printer. Click "Issue Refill" or "Issue New Toner" to register.
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold">
                        <tr>
                          <th className="p-2.5">Date</th>
                          <th className="p-2.5">Toner Model</th>
                          <th className="p-2.5">Qty</th>
                          <th className="p-2.5">Recipient User</th>
                          <th className="p-2.5">Issued By</th>
                          <th className="p-2.5">Remarks</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                        {assetTonerIssues.map((issue) => (
                          <tr key={issue.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                            <td className="p-2.5 font-mono text-[11px]">{issue.issuedDate}</td>
                            <td className="p-2.5 font-bold text-teal-700 dark:text-teal-400">{issue.tonerModel}</td>
                            <td className="p-2.5 font-bold">{issue.quantity} unit(s)</td>
                            <td className="p-2.5">{issue.recipientUser || 'Duty Officer'}</td>
                            <td className="p-2.5 text-slate-500 font-medium">{issue.issuedBy}</td>
                            <td className="p-2.5 text-slate-500 text-[11px]">{issue.remarks || 'Routine replacement'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* TAB 4: REPAIR & MAINTENANCE IN DETAIL */}
          {/* ============================================================ */}
          {activeTab === 'maintenance' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3 dark:border-slate-800">
                <div>
                  <h4 className="font-bold text-slate-800 dark:text-slate-200 text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <Wrench className="h-4 w-4 text-indigo-600" />
                    <span>Hardware Repair & Service History</span>
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Total Lifetime Spend: <strong>PKR {totalMaintenanceCost.toLocaleString()}</strong> across {assetMaintenance.length} service jobs
                  </p>
                </div>

                {isPrinter && onOpenMaintenanceForm && (
                  <button
                    onClick={() => {
                      onClose();
                      onOpenMaintenanceForm(currentAsset.id);
                    }}
                    className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-indigo-500 shadow-xs transition"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Open New Repair Sheet</span>
                  </button>
                )}
              </div>

              {assetMaintenance.length === 0 ? (
                <div className="rounded-2xl border-2 border-dashed border-slate-200 p-8 text-center text-xs text-slate-400 dark:border-slate-800">
                  <Wrench className="mx-auto h-8 w-8 text-slate-300 dark:text-slate-600 mb-2" />
                  <p className="font-bold text-slate-700 dark:text-slate-300">No maintenance jobs on file for this machine.</p>
                  <p className="mt-1 text-slate-500">Scheduled inspections and replacement parts will appear here.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {assetMaintenance.map((record) => (
                    <div
                      key={record.id}
                      className="rounded-2xl border border-slate-200 bg-white p-4.5 dark:border-slate-800 dark:bg-slate-900 shadow-xs space-y-2.5"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5 dark:border-slate-800">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-black text-indigo-600 dark:text-indigo-400">
                            {record.id}
                          </span>
                          <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
                            {record.serviceType}
                          </span>
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                              record.status === 'Completed'
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                                : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                            }`}
                          >
                            {record.status}
                          </span>
                        </div>

                        <div className="flex items-center gap-3 text-xs">
                          <span className="text-slate-500 font-mono">{record.date}</span>
                          <span className="font-black text-slate-800 dark:text-slate-200">
                            PKR {(record.costPkr || 0).toLocaleString()}
                          </span>
                        </div>
                      </div>

                      {/* Issue Reported & Action Taken */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div className="rounded-xl bg-rose-50/50 p-2.5 border border-rose-100 dark:bg-rose-950/20 dark:border-rose-900/40">
                          <span className="text-[10px] font-bold uppercase text-rose-700 dark:text-rose-300 block">
                            Issue Reported / Symptom:
                          </span>
                          <p className="mt-0.5 text-slate-800 dark:text-slate-200 font-medium">
                            {record.issueReported}
                          </p>
                        </div>

                        <div className="rounded-xl bg-emerald-50/50 p-2.5 border border-emerald-100 dark:bg-emerald-950/20 dark:border-emerald-900/40">
                          <span className="text-[10px] font-bold uppercase text-emerald-700 dark:text-emerald-300 block">
                            Action Taken & Diagnostics:
                          </span>
                          <p className="mt-0.5 text-slate-800 dark:text-slate-200 font-medium">
                            {record.actionTaken}
                          </p>
                        </div>
                      </div>

                      {/* Parts Changed in this job */}
                      {record.partsChanged && record.partsChanged.length > 0 && (
                        <div className="rounded-xl bg-slate-50 p-2.5 text-xs dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                          <span className="text-[10px] font-bold uppercase text-slate-500 block mb-1">
                            Parts Replaced During Service:
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {record.partsChanged.map((p, idx) => (
                              <span
                                key={idx}
                                className="rounded-md bg-white px-2 py-0.5 text-[11px] font-bold text-slate-800 shadow-xs border border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200"
                              >
                                ⚙️ {p.quantity}x {p.partName} {p.partNumber ? `(${p.partNumber})` : ''} — PKR {(p.unitCostPkr || 0).toLocaleString()}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                        <span>Technician: <strong>{record.technicianName}</strong></span>
                        <span>Test Page Printed: <strong>{record.testPagePrinted ? '✓ Yes (Verified)' : 'No'}</strong></span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ============================================================ */}
          {/* TAB 5: PRINTER PARTS CHANGED & SPARES */}
          {/* ============================================================ */}
          {activeTab === 'parts' && (
            <div className="space-y-5">
              {/* Section A: Parts Replaced on this Printer */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-800 dark:text-slate-200 text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <Package className="h-4 w-4 text-amber-600" />
                    <span>Parts Replaced on This Unit ({partsReplacedOnThisPrinter.length})</span>
                  </h4>
                  <span className="text-[11px] text-slate-400">Cumulative Overhaul Log</span>
                </div>

                {partsReplacedOnThisPrinter.length === 0 ? (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 text-center text-xs text-slate-400 dark:border-slate-800 dark:bg-slate-800/40">
                    No replacement parts recorded for this machine yet.
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold">
                        <tr>
                          <th className="p-2.5">Date</th>
                          <th className="p-2.5">Part Name</th>
                          <th className="p-2.5">Part Number</th>
                          <th className="p-2.5">Qty</th>
                          <th className="p-2.5">Cost</th>
                          <th className="p-2.5">Old Part Status</th>
                          <th className="p-2.5">Job Ref</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                        {partsReplacedOnThisPrinter.map((part, idx) => (
                          <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                            <td className="p-2.5 font-mono text-[11px]">{part.date}</td>
                            <td className="p-2.5 font-bold text-slate-900 dark:text-white">{part.partName}</td>
                            <td className="p-2.5 font-mono text-slate-500">{part.partNumber || 'OEM Standard'}</td>
                            <td className="p-2.5 font-bold">{part.quantity}</td>
                            <td className="p-2.5 font-bold text-amber-700 dark:text-amber-400">
                              PKR {(part.unitCostPkr || 0).toLocaleString()}
                            </td>
                            <td className="p-2.5 text-slate-500">{part.oldPartStatus || 'Discarded'}</td>
                            <td className="p-2.5 font-mono text-indigo-600 dark:text-indigo-400 font-bold">{part.jobId}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Section B: Compatible Spare Parts in Store Stock */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-800 dark:text-slate-200 text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldCheck className="h-4 w-4 text-emerald-600" />
                    <span>Compatible Spare Parts in IT Store ({compatibleSpares.length})</span>
                  </h4>
                  <span className="text-[11px] text-slate-400">Ready for Dispatch / Replacement</span>
                </div>

                {compatibleSpares.length === 0 ? (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 text-center text-xs text-slate-400 dark:border-slate-800 dark:bg-slate-800/40">
                    No dedicated spare parts currently listed in inventory specifically for this model ({currentAsset.model}).
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                    {compatibleSpares.map((spare) => (
                      <div
                        key={spare.id}
                        className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900 shadow-xs flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-mono text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                              {spare.id}
                            </span>
                            <span
                              className={`rounded-full px-2 py-0.2 text-[10px] font-bold ${
                                spare.quantityInStock <= spare.reorderLevel
                                  ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                                  : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                              }`}
                            >
                              Stock: {spare.quantityInStock} units
                            </span>
                          </div>
                          <span className="font-bold text-slate-900 dark:text-white block">
                            {spare.partName}
                          </span>
                          <span className="text-[11px] text-slate-500 font-mono block">
                            Part #{spare.partNumber} • {spare.category}
                          </span>
                        </div>

                        <div className="mt-2.5 flex items-center justify-between text-[11px] border-t border-slate-100 pt-2 dark:border-slate-800">
                          <span className="text-slate-400">Loc: {spare.storeLocation}</span>
                          <span className="font-black text-slate-800 dark:text-slate-200">
                            PKR {(spare.unitCostPkr || 0).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="border-t border-slate-200 bg-slate-50 px-5 py-3 flex items-center justify-between text-xs dark:border-slate-800 dark:bg-slate-800/80">
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
            <span>PAA Fleet ID:</span>
            <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
              {currentAsset.id}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="rounded-xl bg-slate-800 hover:bg-slate-700 px-4 py-2 font-bold text-white transition dark:bg-slate-700 dark:hover:bg-slate-600 shadow-xs"
            >
              Close Brief
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
