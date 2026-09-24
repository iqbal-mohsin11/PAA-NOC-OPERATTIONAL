import React, { useState, useMemo } from 'react';
import { useInventory } from '../context/InventoryContext';
import { AssetItem, UPSMaintenanceRecord } from '../types/inventory';
import {
  BatteryCharging,
  Zap,
  Clock,
  Building,
  Calendar,
  ShieldCheck,
  Search,
  Plus,
  Filter,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Printer,
  ChevronRight,
  Activity,
  HardDrive,
  Info,
  Layers,
  Edit,
  Download,
  Table as TableIcon,
  LayoutGrid,
  History,
  Sparkles,
  Tag,
  Hash,
  FileSpreadsheet,
  BarChart3,
  XCircle,
} from 'lucide-react';
import { UPSMaintenanceModal } from './UPSMaintenanceModal';
import { UPSFormModal } from './UPSFormModal';
import { UPSBatteryReplacementModal } from './UPSBatteryReplacementModal';
import { UPSBackupListModal } from './UPSBackupListModal';
import { UPSSummaryDashboard } from './UPSSummaryDashboard';
import { UPSPredictiveMaintenancePanel } from './UPSPredictiveMaintenancePanel';
import {
  getUPSSupervisorStatus,
  UPSSupervisorStatus,
  UPSSupervisorStatusTier,
} from '../utils/upsBatteryAlerts';

interface UPSViewProps {
  onSelectAsset?: (asset: AssetItem) => void;
  onOpenGatePass?: (asset: AssetItem) => void;
  onOpenAddUPS?: () => void;
}

export const UPSView: React.FC<UPSViewProps> = ({
  onSelectAsset,
  onOpenGatePass,
  onOpenAddUPS,
}) => {
  const { assets, upsMaintenanceRecords, loadAIIAPUpsFleet } = useInventory();

  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'predictive' | 'table' | 'cards' | 'history'>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedKva, setSelectedKva] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedRoom, setSelectedRoom] = useState<string>('all');
  
  // Modals state
  const [isMaintenanceModalOpen, setIsMaintenanceModalOpen] = useState(false);
  const [selectedAssetForService, setSelectedAssetForService] = useState<AssetItem | null>(null);
  
  const [isUPSFormModalOpen, setIsUPSFormModalOpen] = useState(false);
  const [selectedAssetForEdit, setSelectedAssetForEdit] = useState<AssetItem | null>(null);

  const [isBatteryReplacementModalOpen, setIsBatteryReplacementModalOpen] = useState(false);
  const [isBackupListModalOpen, setIsBackupListModalOpen] = useState(false);

  // Active UPS Assets (Category === 'UPS' or has upsSpecs)
  const activeUPSAssets = assets.filter(
    (a) => !a.isRemoved && (a.category === 'UPS' || a.upsSpecs !== undefined)
  );

  // Supervisor Status Map for all active UPS units
  const assetStatusMap = useMemo(() => {
    const map = new Map<string, UPSSupervisorStatus>();
    for (const a of activeUPSAssets) {
      map.set(a.id, getUPSSupervisorStatus(a));
    }
    return map;
  }, [activeUPSAssets]);

  // Status Tier KPI Counts
  const optimalCount = useMemo(() => {
    return activeUPSAssets.filter((a) => assetStatusMap.get(a.id)?.tier === 'Optimal').length;
  }, [activeUPSAssets, assetStatusMap]);

  const warningCount = useMemo(() => {
    return activeUPSAssets.filter((a) => assetStatusMap.get(a.id)?.tier === 'Warning').length;
  }, [activeUPSAssets, assetStatusMap]);

  const criticalCount = useMemo(() => {
    return activeUPSAssets.filter((a) => assetStatusMap.get(a.id)?.tier === 'Critical').length;
  }, [activeUPSAssets, assetStatusMap]);

  // Filtered Assets
  const filteredAssets = activeUPSAssets.filter((a) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      a.name.toLowerCase().includes(q) ||
      a.model.toLowerCase().includes(q) ||
      a.id.toLowerCase().includes(q) ||
      a.assetTag.toLowerCase().includes(q) ||
      (a.serialNumber && a.serialNumber.toLowerCase().includes(q)) ||
      (a.location?.room && a.location.room.toLowerCase().includes(q)) ||
      (a.location?.floor && a.location.floor.toLowerCase().includes(q)) ||
      (a.crnNo && a.crnNo.toLowerCase().includes(q)) ||
      (a.upsSpecs?.crnNo && a.upsSpecs.crnNo.toLowerCase().includes(q)) ||
      (a.upsSpecs?.modelNo && a.upsSpecs.modelNo.toLowerCase().includes(q)) ||
      (a.upsSpecs?.roomNo && a.upsSpecs.roomNo.toLowerCase().includes(q)) ||
      (a.upsSpecs?.capacityKvaKw && a.upsSpecs.capacityKvaKw.toLowerCase().includes(q));

    // KVA Filter
    const kvaStr = (a.upsSpecs?.kvaRating || a.upsSpecs?.capacityKvaKw || a.model || '').toUpperCase();
    const matchesKva =
      selectedKva === 'all' ||
      (selectedKva === '1kva' && kvaStr.includes('1KVA')) ||
      (selectedKva === '2kva' && kvaStr.includes('2KVA')) ||
      (selectedKva === '3kva' && kvaStr.includes('3KVA')) ||
      (selectedKva === '5kva' && (kvaStr.includes('5KVA') || kvaStr.includes('5000'))) ||
      (selectedKva === '10kva' && kvaStr.includes('10KVA'));

    // Status Filter (Supervisor Tier: Optimal, Warning, Critical)
    const statusInfo = assetStatusMap.get(a.id);
    const matchesStatus =
      selectedStatus === 'all' ||
      (selectedStatus === 'optimal' && statusInfo?.tier === 'Optimal') ||
      (selectedStatus === 'warning' && statusInfo?.tier === 'Warning') ||
      (selectedStatus === 'critical' && statusInfo?.tier === 'Critical') ||
      (selectedStatus === 'ok' && statusInfo?.tier === 'Optimal') ||
      (selectedStatus === 'nobackup' && statusInfo?.tier === 'Critical');

    // Room filter
    const roomStr = (a.upsSpecs?.roomNo || a.location?.room || '').toLowerCase();
    const matchesRoom =
      selectedRoom === 'all' ||
      (selectedRoom === '4102' && roomStr.includes('4102')) ||
      (selectedRoom === 'datacenter' && roomStr.includes('data')) ||
      (selectedRoom === 'itstore' && roomStr.includes('store')) ||
      (selectedRoom === 'cargo' && roomStr.includes('cargo')) ||
      (selectedRoom === 'radar' && roomStr.includes('radar')) ||
      (selectedRoom === '104' && roomStr.includes('104')) ||
      (selectedRoom === '202' && roomStr.includes('202'));

    return matchesSearch && matchesKva && matchesStatus && matchesRoom;
  });

  // Filtered Maintenance Records
  const filteredRecords = upsMaintenanceRecords.filter((r) => {
    const q = searchQuery.toLowerCase();
    return (
      r.id.toLowerCase().includes(q) ||
      r.upsName.toLowerCase().includes(q) ||
      r.modelNo.toLowerCase().includes(q) ||
      r.roomNo.toLowerCase().includes(q) ||
      r.engineer.toLowerCase().includes(q) ||
      r.voltage.toLowerCase().includes(q)
    );
  });

  // KPI Calculations
  const totalBatteries = activeUPSAssets.reduce((sum, a) => sum + (a.upsSpecs?.noOfBatteries || 3), 0);
  const noBackupCount = activeUPSAssets.filter((a) => {
    const b = (a.upsSpecs?.backupTime || '').toUpperCase();
    return b.includes('NO BACKUP') || a.status === 'Faulty' || a.status === 'Under Repair';
  }).length;
  const total1kVA = activeUPSAssets.filter((a) => (a.upsSpecs?.capacityKvaKw || a.model || '').toUpperCase().includes('1KVA')).length;

  const handleOpenEdit = (asset: AssetItem) => {
    setSelectedAssetForEdit(asset);
    setIsUPSFormModalOpen(true);
  };

  const handleOpenAdd = () => {
    setSelectedAssetForEdit(null);
    setIsUPSFormModalOpen(true);
  };

  const handleOpenService = (asset?: AssetItem) => {
    setSelectedAssetForService(asset || null);
    setIsMaintenanceModalOpen(true);
  };

  // Export AIIAP Spreadsheet CSV with exact columns
  const exportAIIAPSpreadsheetCSV = () => {
    const headers = [
      'SR.NO.',
      'TAG NO.',
      'MODEL NO.',
      'SERIAL NO.',
      'VOLTAGE',
      'CRN NO.',
      'LOCATION',
      'ROOM NO.',
      'BACKUP TIME',
      'BATTERIES REPLACEMENT Date',
      'STATUS',
    ];

    const rows = filteredAssets.map((a, idx) => {
      const sr = a.upsSpecs?.srNo || String(idx + 1).padStart(2, '0');
      const tag = a.upsSpecs?.tagNo || a.assetTag || `UPS-${sr}`;
      const model = a.upsSpecs?.modelNo || a.model;
      const sn = a.serialNumber || 'N/A';
      const voltage = a.upsSpecs?.capacityKvaKw || `${a.upsSpecs?.kvaRating || '1KVA'} / ${a.upsSpecs?.kwRating || '0.7KW'}`;
      const crn = a.upsSpecs?.crnNo || a.crnNo || 'N/A';
      const location = a.location?.floor || a.location?.building || 'Level 4';
      const room = a.upsSpecs?.roomNo || a.location?.room || '4102';
      const backup = a.upsSpecs?.backupTime || '10 MIN/OK';
      const battDate = a.upsSpecs?.lastBatteryChangeDate || a.lastMaintenanceDate || '2024-10-21';
      const st = a.status;

      return [
        sr,
        `"${tag}"`,
        `"${model}"`,
        `"${sn}"`,
        `"${voltage}"`,
        `"${crn}"`,
        `"${location}"`,
        `"${room}"`,
        `"${backup}"`,
        `"${battDate}"`,
        `"${st}"`,
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `AIIAP_UPS_DETAILS_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <div className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-amber-500/10 p-3 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400">
              <BatteryCharging className="h-7 w-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-slate-900 dark:text-white">
                  UPS & Power Infrastructure (kVA Details)
                </h2>
                <span className="rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-black text-amber-700 dark:text-amber-400 border border-amber-500/20 uppercase tracking-wider">
                  AIIAP Structured LAN
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Official Airport Inventory: Tag No., Model, Serial, Voltage/kVA, CRN, Location, Room, Backup Time & Battery Replacement Cycles.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setIsBatteryReplacementModalOpen(true)}
            className="flex items-center gap-1.5 rounded-xl border border-amber-300 bg-amber-500/10 px-3.5 py-2 text-xs font-bold text-amber-900 dark:text-amber-300 hover:bg-amber-500/20 transition shadow-2xs"
            title="Details Replacement of UPS Batteries Installed at Different Locations (Image 1 Form)"
          >
            <BatteryCharging className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            <span>Battery Replacement Form</span>
          </button>

          <button
            type="button"
            onClick={() => setIsBackupListModalOpen(true)}
            className="flex items-center gap-1.5 rounded-xl border border-blue-300 bg-blue-500/10 px-3.5 py-2 text-xs font-bold text-blue-900 dark:text-blue-300 hover:bg-blue-500/20 transition shadow-2xs"
            title="UPS Backup List of IT Equipment (Image 2 Official Checklist & Signatures)"
          >
            <FileSpreadsheet className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <span>UPS Backup Checklist</span>
          </button>

          <button
            type="button"
            onClick={loadAIIAPUpsFleet}
            className="flex items-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50/60 px-3.5 py-2 text-xs font-bold text-amber-900 hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-300 transition"
            title="Synchronize official 20 UPS rows from AIIAP sheet"
          >
            <Sparkles className="h-4 w-4 text-amber-600" />
            <span>Sync 20-UPS Fleet</span>
          </button>

          <button
            type="button"
            onClick={exportAIIAPSpreadsheetCSV}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 shadow-2xs transition"
          >
            <Download className="h-4 w-4 text-slate-500" />
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            onClick={() => handleOpenService()}
            className="flex items-center gap-1.5 rounded-xl border border-amber-200 bg-white px-3.5 py-2 text-xs font-bold text-amber-800 hover:bg-amber-50 dark:border-amber-900/60 dark:bg-slate-800 dark:text-amber-300 transition"
          >
            <History className="h-4 w-4 text-amber-600" />
            <span>Log Service</span>
          </button>

          <button
            type="button"
            onClick={handleOpenAdd}
            className="flex items-center gap-2 rounded-xl bg-amber-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-amber-600/25 hover:bg-amber-500 transition"
          >
            <Plus className="h-4 w-4" />
            <span>Add UPS Asset</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Installed UPS */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Installed Fleet
            </span>
            <div className="rounded-xl bg-amber-500/10 p-2 text-amber-600 dark:text-amber-400">
              <Zap className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 dark:text-white">{activeUPSAssets.length}</span>
            <span className="text-xs text-amber-600 font-semibold font-mono">UPS Units</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400">
            {total1kVA} Units @ 1kVA / 0.7kW Rating
          </p>
        </div>

        {/* Installed Battery Cells */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Total Battery Cells
            </span>
            <div className="rounded-xl bg-emerald-500/10 p-2 text-emerald-600 dark:text-emerald-400">
              <BatteryCharging className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 dark:text-white">{totalBatteries}</span>
            <span className="text-xs text-emerald-600 font-semibold">12V VRLA AGM</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400">3x Cells per 1kVA, 8x per 3kVA</p>
        </div>

        {/* Operational / Battery Status */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Supervisor Health Scan
            </span>
            <div className={`rounded-xl p-2 ${criticalCount > 0 ? 'bg-rose-500/10 text-rose-600' : warningCount > 0 ? 'bg-amber-500/10 text-amber-600' : 'bg-emerald-500/10 text-emerald-600'}`}>
              <ShieldCheck className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-2.5 flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={() => setSelectedStatus(selectedStatus === 'optimal' ? 'all' : 'optimal')}
              className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-black border transition ${
                selectedStatus === 'optimal'
                  ? 'bg-emerald-600 text-white border-emerald-600 ring-2 ring-emerald-400'
                  : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800'
              }`}
              title="Filter Optimal (Green)"
            >
              <CheckCircle2 className="h-3 w-3" />
              <span>{optimalCount} Optimal</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedStatus(selectedStatus === 'warning' ? 'all' : 'warning')}
              className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-black border transition ${
                selectedStatus === 'warning'
                  ? 'bg-amber-600 text-white border-amber-600 ring-2 ring-amber-400'
                  : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800'
              }`}
              title="Filter Warning (Amber for < 30 days battery life)"
            >
              <Clock className="h-3 w-3" />
              <span>{warningCount} Warning</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedStatus(selectedStatus === 'critical' ? 'all' : 'critical')}
              className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-black border transition ${
                selectedStatus === 'critical'
                  ? 'bg-rose-600 text-white border-rose-600 ring-2 ring-rose-400'
                  : 'bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800'
              }`}
              title="Filter Critical (Red for overdue maintenance or failed battery)"
            >
              <AlertTriangle className="h-3 w-3" />
              <span>{criticalCount} Critical</span>
            </button>
          </div>
          <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate">
            {criticalCount > 0 ? `${criticalCount} unit(s) require urgent action` : warningCount > 0 ? `${warningCount} unit(s) due within 30 days` : '100% units within optimal operating range'}
          </p>
        </div>

        {/* Airport Ledger / CRN Tracked */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              CRN Ledger Tracking
            </span>
            <div className="rounded-xl bg-blue-500/10 p-2 text-blue-600 dark:text-blue-400">
              <Hash className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl font-extrabold text-blue-600 dark:text-blue-400">
              CRN 2211 - 2237
            </span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400">Level 0 to Level 6, IT Store & Cargo</p>
        </div>
      </div>

      {/* Control Bar: Sub-tabs, Search & Filters */}
      <div className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          
          {/* Main Subtabs Toggle */}
          <div className="flex flex-wrap rounded-2xl bg-slate-100 p-1 dark:bg-slate-800 text-xs font-bold gap-1">
            <button
              type="button"
              onClick={() => setActiveSubTab('overview')}
              className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 transition ${
                activeSubTab === 'overview'
                  ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-900 dark:text-white'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
              }`}
            >
              <BarChart3 className="h-4 w-4 text-amber-500" />
              <span>Summary Dashboard</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSubTab('predictive')}
              className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 transition ${
                activeSubTab === 'predictive'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-amber-700 hover:text-amber-900 dark:text-amber-400'
              }`}
            >
              <Sparkles className="h-4 w-4 text-amber-300 animate-pulse" />
              <span>Predictive Maintenance</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSubTab('table')}
              className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 transition ${
                activeSubTab === 'table'
                  ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-900 dark:text-white'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
              }`}
            >
              <TableIcon className="h-4 w-4 text-amber-500" />
              <span>AIIAP Spreadsheet Table ({filteredAssets.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSubTab('cards')}
              className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 transition ${
                activeSubTab === 'cards'
                  ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-900 dark:text-white'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
              }`}
            >
              <LayoutGrid className="h-4 w-4 text-blue-500" />
              <span>Equipment Cards</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSubTab('history')}
              className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 transition ${
                activeSubTab === 'history'
                  ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-900 dark:text-white'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
              }`}
            >
              <History className="h-4 w-4 text-emerald-500" />
              <span>Maintenance Logs ({filteredRecords.length})</span>
            </button>
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Tag, Model, Serial, CRN, Room, kVA..."
              className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-4 py-2 text-xs text-slate-800 placeholder-slate-400 focus:border-amber-500 focus:outline-hidden dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            />
          </div>
        </div>

        {/* Filter Badges Row */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
          
          {/* Capacity kVA Filter */}
          <div className="flex items-center gap-1">
            <span className="text-slate-400 font-bold ml-1 mr-1">Capacity:</span>
            {[
              { id: 'all', label: 'All kVA' },
              { id: '1kva', label: '1 kVA (0.7 kW)' },
              { id: '2kva', label: '2 kVA' },
              { id: '3kva', label: '3 kVA (Radar)' },
              { id: '5kva', label: '5 kVA' },
              { id: '10kva', label: '10 kVA' },
            ].map((k) => (
              <button
                key={k.id}
                type="button"
                onClick={() => setSelectedKva(k.id)}
                className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition border ${
                  selectedKva === k.id
                    ? 'bg-amber-500 text-white border-amber-500 shadow-2xs'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
                }`}
              >
                {k.label}
              </button>
            ))}
          </div>

          <span className="text-slate-300 dark:text-slate-700 mx-1">|</span>

          {/* Supervisor Color-Coded Status Filter */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-slate-400 font-bold mr-1">Status:</span>
            <button
              type="button"
              onClick={() => setSelectedStatus('all')}
              className={`rounded-lg px-2.5 py-1 text-[11px] font-bold border transition ${
                selectedStatus === 'all'
                  ? 'bg-slate-800 text-white border-slate-800 dark:bg-slate-200 dark:text-slate-900'
                  : 'bg-white text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
              }`}
            >
              All ({activeUPSAssets.length})
            </button>
            <button
              type="button"
              onClick={() => setSelectedStatus('optimal')}
              className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-bold border transition ${
                selectedStatus === 'optimal'
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs ring-2 ring-emerald-400'
                  : 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
              }`}
              title="Optimal: Healthy battery and normal maintenance schedule"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Optimal ({optimalCount})</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedStatus('warning')}
              className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-bold border transition ${
                selectedStatus === 'warning'
                  ? 'bg-amber-600 text-white border-amber-600 shadow-2xs ring-2 ring-amber-400'
                  : 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800'
              }`}
              title="Warning: < 30 days battery life remaining"
            >
              <Clock className="h-3.5 w-3.5" />
              <span>Warning &lt;30d ({warningCount})</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedStatus('critical')}
              className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-bold border transition ${
                selectedStatus === 'critical'
                  ? 'bg-rose-600 text-white border-rose-600 shadow-2xs ring-2 ring-rose-400'
                  : 'bg-rose-50 text-rose-800 border-rose-300 hover:bg-rose-100 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800'
              }`}
              title="Critical: Overdue maintenance or failed battery (NO BACKUP)"
            >
              <AlertTriangle className="h-3.5 w-3.5" />
              <span>Critical ({criticalCount})</span>
            </button>
          </div>

          <span className="text-slate-300 dark:text-slate-700 mx-1">|</span>

          {/* Room quick select */}
          <div className="flex items-center gap-1">
            <span className="text-slate-400 font-bold mr-1">Room:</span>
            <select
              value={selectedRoom}
              onChange={(e) => setSelectedRoom(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-bold dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              <option value="all">All Rooms</option>
              <option value="4102">Room 4102 (Level 4)</option>
              <option value="datacenter">Data Center (Level 6)</option>
              <option value="itstore">IT STORE</option>
              <option value="cargo">Cargo</option>
              <option value="radar">Radar (Airside / Room 202)</option>
              <option value="104">Room 104 (ATC)</option>
            </select>
          </div>
        </div>
      </div>

      {/* VIEW 0: SUMMARY DASHBOARD & ANALYTICS */}
      {activeSubTab === 'overview' && (
        <UPSSummaryDashboard
          upsAssets={activeUPSAssets}
          maintenanceRecords={upsMaintenanceRecords}
          onSelectAsset={(asset) => handleOpenEdit(asset)}
          onOpenService={(asset) => handleOpenService(asset)}
          onOpenBatteryForm={() => setIsBatteryReplacementModalOpen(true)}
          onOpenChecklistForm={() => setIsBackupListModalOpen(true)}
          onFilterCapacity={(kva) => {
            setSelectedKva(kva);
            setActiveSubTab('table');
          }}
          onFilterStatus={(st) => {
            setSelectedStatus(st);
            setActiveSubTab('table');
          }}
        />
      )}

      {/* VIEW 0.5: PREDICTIVE MAINTENANCE FORECASTING ENGINE */}
      {activeSubTab === 'predictive' && (
        <UPSPredictiveMaintenancePanel
          upsAssets={activeUPSAssets}
          maintenanceRecords={upsMaintenanceRecords}
          onSelectAsset={(asset) => handleOpenEdit(asset)}
          onOpenService={(asset) => handleOpenService(asset)}
          onOpenBatteryForm={() => setIsBatteryReplacementModalOpen(true)}
        />
      )}

      {/* VIEW 1: SPREADSHEET TABLE VIEW (Matches official AIIAP UPS DETAILS sheet) */}
      {activeSubTab === 'table' && (
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="border-b border-slate-100 bg-slate-50/75 px-6 py-3.5 dark:border-slate-800 dark:bg-slate-800/50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TableIcon className="h-4 w-4 text-amber-500" />
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                AIIAP Structured LAN — UPS AND RACK DETAILS
              </span>
              <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-bold text-slate-700 dark:bg-slate-700 dark:text-slate-300">
                {filteredAssets.length} Rows
              </span>
            </div>

            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              * Click "Edit Specs" on any row to modify full kVA, CRN, and battery cycle details
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-100/60 font-bold uppercase tracking-wider text-slate-600 dark:border-slate-800 dark:bg-slate-800/80 dark:text-slate-300 text-[11px]">
                  <th className="py-3 px-4 font-black">SR. NO.</th>
                  <th className="py-3 px-4">TAG NO.</th>
                  <th className="py-3 px-4 font-black text-slate-900 dark:text-white">STATUS</th>
                  <th className="py-3 px-4">MODEL NO.</th>
                  <th className="py-3 px-4">SERIAL NO.</th>
                  <th className="py-3 px-4">VOLTAGE (kVA / kW)</th>
                  <th className="py-3 px-4">CRN NO.</th>
                  <th className="py-3 px-4">LOCATION</th>
                  <th className="py-3 px-4">ROOM NO.</th>
                  <th className="py-3 px-4">BACKUP TIME</th>
                  <th className="py-3 px-4">BATTERIES REPLACEMENT Date</th>
                  <th className="py-3 px-4 text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {filteredAssets.length === 0 ? (
                  <tr>
                    <td colSpan={12} className="py-12 text-center text-slate-400">
                      No UPS records found matching the current search filters.
                    </td>
                  </tr>
                ) : (
                  filteredAssets.map((asset, idx) => {
                    const sr = asset.upsSpecs?.srNo || String(idx + 1).padStart(2, '0');
                    const tag = asset.upsSpecs?.tagNo || asset.assetTag || `UPS-${sr}`;
                    const model = asset.upsSpecs?.modelNo || asset.model;
                    const sn = asset.serialNumber || 'N/A';
                    const voltage = asset.upsSpecs?.capacityKvaKw || `${asset.upsSpecs?.kvaRating || '1KVA'} / ${asset.upsSpecs?.kwRating || '0.7KW'}`;
                    const crn = asset.upsSpecs?.crnNo || asset.crnNo || '—';
                    const location = asset.location?.floor || asset.location?.building || 'Level 4';
                    const room = asset.upsSpecs?.roomNo || asset.location?.room || '4102';
                    const backup = asset.upsSpecs?.backupTime || '10 MIN/OK';
                    const isNoBackup = backup.toUpperCase().includes('NO BACKUP') || asset.status === 'Faulty' || asset.status === 'Under Repair';
                    const battDate = asset.upsSpecs?.lastBatteryChangeDate || asset.lastMaintenanceDate || '—';
                    const statusInfo = assetStatusMap.get(asset.id) || getUPSSupervisorStatus(asset);

                    return (
                      <tr
                        key={asset.id}
                        className={`transition group border-l-4 ${
                          statusInfo.tier === 'Critical'
                            ? 'border-l-rose-500 bg-rose-50/25 dark:bg-rose-950/15 hover:bg-rose-50/45 dark:hover:bg-rose-950/25'
                            : statusInfo.tier === 'Warning'
                            ? 'border-l-amber-500 bg-amber-50/20 dark:bg-amber-950/15 hover:bg-amber-50/40 dark:hover:bg-amber-950/25'
                            : 'border-l-emerald-500 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                        }`}
                      >
                        {/* SR. NO */}
                        <td className="py-3 px-4 font-mono font-bold text-slate-500 dark:text-slate-400">
                          {sr}
                        </td>

                        {/* TAG NO */}
                        <td className="py-3 px-4 font-mono font-extrabold text-amber-700 dark:text-amber-400">
                          <span className="rounded-md bg-amber-500/10 px-2 py-0.5 border border-amber-500/20">
                            {tag}
                          </span>
                        </td>

                        {/* SUPERVISOR STATUS BADGE */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-black border shadow-2xs ${statusInfo.pillClass} ${
                              statusInfo.tier === 'Critical' ? 'animate-pulse' : ''
                            }`}
                            title={statusInfo.reason}
                          >
                            {statusInfo.tier === 'Critical' ? (
                              <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                            ) : statusInfo.tier === 'Warning' ? (
                              <Clock className="h-3.5 w-3.5 shrink-0" />
                            ) : (
                              <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                            )}
                            <span>{statusInfo.label}</span>
                          </span>
                          <div
                            className={`mt-0.5 text-[10px] font-bold truncate max-w-[140px] ${
                              statusInfo.tier === 'Critical'
                                ? 'text-rose-700 dark:text-rose-400'
                                : statusInfo.tier === 'Warning'
                                ? 'text-amber-700 dark:text-amber-400'
                                : 'text-emerald-700 dark:text-emerald-400'
                            }`}
                            title={statusInfo.reason}
                          >
                            {statusInfo.subtext}
                          </div>
                        </td>

                        {/* MODEL NO */}
                        <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                          <div className="flex items-center gap-2">
                            <img
                              src={asset.images?.devicePhoto || '/eaton_dx1000.webp'}
                              alt=""
                              className="h-8 w-8 rounded-lg object-contain border border-slate-200 bg-white p-0.5 dark:border-slate-700 dark:bg-slate-800 shrink-0"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = '/eaton_dx1000.webp';
                              }}
                            />
                            <button
                              type="button"
                              onClick={() => onSelectAsset?.(asset)}
                              className="hover:text-amber-600 hover:underline text-left"
                            >
                              {model}
                            </button>
                          </div>
                        </td>

                        {/* SERIAL NO */}
                        <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-300">
                          {sn}
                        </td>

                        {/* VOLTAGE & KVA */}
                        <td className="py-3 px-4">
                          <span className="font-mono font-extrabold text-slate-800 dark:text-slate-200 rounded-md bg-slate-100 px-2 py-0.5 dark:bg-slate-800">
                            {voltage}
                          </span>
                        </td>

                        {/* CRN NO */}
                        <td className="py-3 px-4 font-mono font-bold text-blue-600 dark:text-blue-400">
                          {crn}
                        </td>

                        {/* LOCATION */}
                        <td className="py-3 px-4 text-slate-700 dark:text-slate-300">
                          {location}
                        </td>

                        {/* ROOM NO */}
                        <td className="py-3 px-4 font-bold text-slate-800 dark:text-slate-200">
                          {room}
                        </td>

                        {/* BACKUP TIME */}
                        <td className="py-3 px-4">
                          {isNoBackup ? (
                            <span className="inline-flex items-center gap-1 rounded-md bg-rose-100 px-2 py-0.5 text-[10px] font-extrabold text-rose-700 dark:bg-rose-950/60 dark:text-rose-300">
                              <AlertTriangle className="h-3 w-3" />
                              NO BACKUP
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-md bg-emerald-100 px-2 py-0.5 text-[10px] font-extrabold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                              <CheckCircle2 className="h-3 w-3" />
                              {backup}
                            </span>
                          )}
                          {/* Mini visual health indicator */}
                          {(() => {
                            const tableHealth = Math.min(
                              Math.max(
                                asset.upsSpecs?.batteryHealthPercent ?? (isNoBackup ? 15 : 90),
                                0
                              ),
                              100
                            );
                            return (
                              <div className="mt-1 flex items-center gap-1.5 w-24" title={`Battery Health: ${tableHealth}%`}>
                                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                                  <div
                                    className={`h-full rounded-full transition-all duration-300 ${
                                      isNoBackup || tableHealth < 40
                                        ? 'bg-rose-500'
                                        : tableHealth < 75
                                        ? 'bg-amber-500'
                                        : 'bg-emerald-500'
                                    }`}
                                    style={{ width: `${tableHealth}%` }}
                                  />
                                </div>
                                <span className="font-mono text-[9px] font-bold text-slate-500 dark:text-slate-400">
                                  {tableHealth}%
                                </span>
                              </div>
                            );
                          })()}
                        </td>

                        {/* BATTERIES REPLACEMENT DATE */}
                        <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-300">
                          {battDate}
                        </td>

                        {/* ACTIONS */}
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(asset)}
                              className="rounded-lg p-1.5 text-slate-500 hover:bg-amber-100 hover:text-amber-800 dark:hover:bg-slate-800 dark:hover:text-amber-300 transition"
                              title="Edit UPS Details & kVA"
                            >
                              <Edit className="h-4 w-4" />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleOpenService(asset)}
                              className="rounded-lg p-1.5 text-slate-500 hover:bg-emerald-100 hover:text-emerald-800 dark:hover:bg-slate-800 dark:hover:text-emerald-300 transition"
                              title="Log Battery Service"
                            >
                              <BatteryCharging className="h-4 w-4" />
                            </button>

                            <button
                              type="button"
                              onClick={() => onSelectAsset?.(asset)}
                              className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-200 hover:text-slate-800 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition"
                              title="View Full Asset Profile"
                            >
                              <ChevronRight className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 2: EQUIPMENT CARDS VIEW */}
      {activeSubTab === 'cards' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredAssets.map((asset) => {
            const isEaton3000 = asset.model.includes('3000') || asset.upsSpecs?.modelNo?.includes('3000');
            const roomNumber = asset.upsSpecs?.roomNo || asset.location?.room || 'Room N/A';
            const battCount = asset.upsSpecs?.noOfBatteries || (isEaton3000 ? 8 : 3);
            const voltageStr = asset.upsSpecs?.capacityKvaKw || (isEaton3000 ? '3KVA / 2.1KW' : '1KVA / 0.7KW');
            const backupTime = asset.upsSpecs?.backupTime || '10 MIN/OK';
            const isNoBackup = backupTime.toUpperCase().includes('NO BACKUP') || asset.status === 'Faulty' || asset.status === 'Under Repair';
            const statusInfo = assetStatusMap.get(asset.id) || getUPSSupervisorStatus(asset);
            
            // Accurate Battery Health Percentage
            let calculatedHealth = asset.upsSpecs?.batteryHealthPercent;
            if (calculatedHealth === undefined) {
              if (isNoBackup) {
                calculatedHealth = 15;
              } else {
                const battDateStr = asset.upsSpecs?.lastBatteryChangeDate || asset.lastMaintenanceDate;
                if (battDateStr) {
                  const bDate = new Date(battDateStr);
                  const ageMonths = Math.max(0, (Date.now() - bDate.getTime()) / (1000 * 60 * 60 * 24 * 30.4));
                  if (ageMonths <= 12) calculatedHealth = 95;
                  else if (ageMonths <= 24) calculatedHealth = 85;
                  else if (ageMonths <= 36) calculatedHealth = 65;
                  else calculatedHealth = 40;
                } else {
                  calculatedHealth = 90;
                }
              }
            }
            const healthPercent = Math.min(Math.max(calculatedHealth, 0), 100);

            const lastChange = asset.upsSpecs?.lastBatteryChangeDate || asset.lastMaintenanceDate || '2024-10-21';
            const tag = asset.upsSpecs?.tagNo || asset.assetTag;
            const crn = asset.upsSpecs?.crnNo || asset.crnNo;

            return (
              <div
                key={asset.id}
                className={`group relative flex flex-col justify-between rounded-3xl border bg-white p-5 shadow-sm transition hover:shadow-md dark:bg-slate-900 border-t-4 ${
                  statusInfo.tier === 'Critical'
                    ? 'border-t-rose-500 border-slate-200 dark:border-slate-800'
                    : statusInfo.tier === 'Warning'
                    ? 'border-t-amber-500 border-slate-200 dark:border-slate-800'
                    : 'border-t-emerald-500 border-slate-200 dark:border-slate-800'
                }`}
              >
                <div>
                  {/* Top Badges */}
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <span className="rounded-xl bg-amber-500/10 px-2.5 py-1 text-xs font-black text-amber-700 dark:text-amber-400 font-mono">
                        {tag}
                      </span>
                      <span className="font-mono text-xs font-bold text-slate-500 dark:text-slate-400">
                        {roomNumber}
                      </span>
                    </div>

                    {/* Supervisor Color-Coded Status Badge */}
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-black border shadow-2xs ${statusInfo.pillClass} ${
                        statusInfo.tier === 'Critical' ? 'animate-pulse' : ''
                      }`}
                      title={statusInfo.reason}
                    >
                      {statusInfo.tier === 'Critical' ? (
                        <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                      ) : statusInfo.tier === 'Warning' ? (
                        <Clock className="h-3.5 w-3.5 shrink-0" />
                      ) : (
                        <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                      )}
                      <span>{statusInfo.label}</span>
                    </span>
                  </div>

                  {/* Title & Model with Device Thumbnail */}
                  <div className="mt-3.5 flex items-center gap-3">
                    <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-white p-1 dark:border-slate-800 dark:bg-slate-800/80 flex items-center justify-center shadow-xs">
                      <img
                        src={asset.images?.devicePhoto || '/eaton_dx1000.webp'}
                        alt={asset.name}
                        className="h-full w-full object-contain"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/eaton_dx1000.webp';
                        }}
                      />
                    </div>
                    <div className="min-w-0 flex-1 space-y-1">
                      <h3 className="font-extrabold text-slate-900 dark:text-white text-sm line-clamp-1 group-hover:text-amber-600 transition">
                        {asset.name}
                      </h3>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                        <span className="font-bold text-slate-700 dark:text-slate-300">
                          {asset.upsSpecs?.modelNo || asset.model}
                        </span>
                        <span>•</span>
                        <span>CRN: {crn || 'N/A'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Visual Progress Bar: Battery Health Percentage & Supervisor Status */}
                  <div className="mt-3.5 rounded-2xl border border-slate-200/80 bg-slate-50/90 p-3.5 dark:border-slate-800 dark:bg-slate-800/50">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1.5">
                        <BatteryCharging className={`h-4 w-4 ${statusInfo.textColor}`} />
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                          Battery Health
                        </span>
                        <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md border ${statusInfo.pillClass}`}>
                          {statusInfo.label} • {statusInfo.subtext}
                        </span>
                      </div>
                      <div className="flex items-baseline gap-0.5 font-mono">
                        <span className={`text-sm font-black ${statusInfo.textColor}`}>
                          {healthPercent}
                        </span>
                        <span className={`text-[10px] font-bold ${statusInfo.textColor}`}>%</span>
                      </div>
                    </div>

                    {/* Progress Bar Track */}
                    <div
                      className="relative h-2.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700"
                      role="progressbar"
                      aria-valuenow={healthPercent}
                      aria-valuemin={0}
                      aria-valuemax={100}
                    >
                      <div
                        className={`h-full rounded-full transition-all duration-500 ease-out ${statusInfo.barGradient}`}
                        style={{ width: `${healthPercent}%` }}
                      />
                    </div>

                    {/* Telemetry Micro-Footer */}
                    <div className="mt-2 flex items-center justify-between text-[10px] font-medium text-slate-500 dark:text-slate-400">
                      <span className="truncate pr-2 font-semibold text-slate-600 dark:text-slate-300" title={statusInfo.reason}>
                        {statusInfo.reason}
                      </span>
                      <span className="shrink-0 font-mono font-semibold text-slate-700 dark:text-slate-300">
                        {battCount}x 12V Cells ({battCount * 12}V)
                      </span>
                    </div>
                  </div>

                  {/* Spec Sheet Grid */}
                  <div className="mt-4 rounded-2xl border border-slate-100 bg-slate-50 p-3.5 dark:border-slate-800/80 dark:bg-slate-800/40 space-y-2.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 dark:text-slate-400">Voltage / Rating:</span>
                      <span className="font-mono font-extrabold text-amber-800 dark:text-amber-300">
                        {voltageStr}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 dark:text-slate-400">Battery Bank:</span>
                      <div className="flex items-center gap-1.5 font-bold text-amber-700 dark:text-amber-400">
                        <BatteryCharging className="h-4 w-4" />
                        <span>{battCount}x 12V Cells ({battCount * 12}V DC)</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 dark:text-slate-400">Backup Test Result:</span>
                      <div className={`flex items-center gap-1 font-extrabold ${isNoBackup ? 'text-rose-600' : 'text-emerald-600'}`}>
                        <Clock className="h-3.5 w-3.5" />
                        <span>{backupTime}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between border-t border-slate-200/60 pt-2 dark:border-slate-700">
                      <span className="text-slate-500 dark:text-slate-400">Batteries Replaced:</span>
                      <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                        {lastChange}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 dark:text-slate-400">Location Placement:</span>
                      <span className="font-medium text-slate-800 dark:text-slate-200">
                        {asset.location?.floor || 'Level 4'} - Room {roomNumber}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Action Buttons */}
                <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(asset)}
                    className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 transition"
                  >
                    <Edit className="h-3.5 w-3.5 text-amber-600" />
                    <span>Edit Specs</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleOpenService(asset)}
                    className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-amber-600 py-2 text-xs font-bold text-white shadow-sm hover:bg-amber-500 transition"
                  >
                    <BatteryCharging className="h-3.5 w-3.5" />
                    <span>Log Service</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* VIEW 3: MAINTENANCE HISTORY VIEW */}
      {activeSubTab === 'history' && (
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="border-b border-slate-100 bg-slate-50/75 px-6 py-4 dark:border-slate-800 dark:bg-slate-800/50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <History className="h-5 w-5 text-emerald-500" />
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                UPS & Battery Bank Service Ledger ({filteredRecords.length} Events)
              </h3>
            </div>
            <button
              type="button"
              onClick={() => handleOpenService()}
              className="flex items-center gap-1.5 rounded-xl bg-amber-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-amber-500 transition"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Log Event</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-100/60 font-bold uppercase tracking-wider text-slate-600 dark:border-slate-800 dark:bg-slate-800/80 dark:text-slate-300 text-[11px]">
                  <th className="py-3 px-4">Event ID</th>
                  <th className="py-3 px-4">UPS & Model</th>
                  <th className="py-3 px-4">Room No.</th>
                  <th className="py-3 px-4">Service Date</th>
                  <th className="py-3 px-4">Battery Bank Detail</th>
                  <th className="py-3 px-4">Backup Result</th>
                  <th className="py-3 px-4">Health</th>
                  <th className="py-3 px-4">Engineer</th>
                  <th className="py-3 px-4">Cost (PKR)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-10 text-center text-slate-400">
                      No maintenance events found matching search query.
                    </td>
                  </tr>
                ) : (
                  filteredRecords.map((rec) => (
                    <tr key={rec.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                      <td className="py-3 px-4 font-mono font-bold text-slate-500">{rec.id}</td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 dark:text-white">{rec.upsName}</div>
                        <div className="text-[11px] text-slate-500 font-mono">{rec.modelNo}</div>
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-800 dark:text-slate-200">{rec.roomNo}</td>
                      <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-300">{rec.maintenanceDate}</td>
                      <td className="py-3 px-4">
                        <span className="font-bold text-amber-700 dark:text-amber-400">
                          {rec.noOfBatteries}x {rec.batteryBrandType}
                        </span>
                        <div className="text-[10px] text-slate-400">{rec.voltage}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                          {rec.backupTime}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                          {rec.batteryCondition}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-800 dark:text-slate-200 font-medium">{rec.engineer}</td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white">
                        {rec.cost ? `PKR ${rec.cost.toLocaleString()}` : '—'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* DEDICATED UPS FORM MODAL */}
      <UPSFormModal
        isOpen={isUPSFormModalOpen}
        onClose={() => {
          setIsUPSFormModalOpen(false);
          setSelectedAssetForEdit(null);
        }}
        assetToEdit={selectedAssetForEdit}
      />

      {/* DEDICATED UPS MAINTENANCE MODAL */}
      <UPSMaintenanceModal
        isOpen={isMaintenanceModalOpen}
        onClose={() => {
          setIsMaintenanceModalOpen(false);
          setSelectedAssetForService(null);
        }}
        asset={selectedAssetForService || undefined}
      />

      {/* UPS BATTERY REPLACEMENT MODAL (IMAGE 1) */}
      {isBatteryReplacementModalOpen && (
        <UPSBatteryReplacementModal
          onClose={() => setIsBatteryReplacementModalOpen(false)}
        />
      )}

      {/* UPS BACKUP LIST OF IT EQUIPMENT MODAL (IMAGE 2) */}
      {isBackupListModalOpen && (
        <UPSBackupListModal
          onClose={() => setIsBackupListModalOpen(false)}
        />
      )}
    </div>
  );
};
