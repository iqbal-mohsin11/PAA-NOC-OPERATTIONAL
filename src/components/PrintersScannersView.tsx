import React, { useState, useMemo } from 'react';
import { useInventory } from '../context/InventoryContext';
import { AssetItem, IssueTicket, PrinterMaintenanceRecord } from '../types/inventory';
import {
  Printer,
  AlertTriangle,
  CheckCircle2,
  Wrench,
  Search,
  Plus,
  Filter,
  Droplet,
  RotateCw,
  History,
  Building2,
  Package,
  Layers,
  FileSpreadsheet,
  Activity,
  SlidersHorizontal,
  Clock,
  Sparkles,
  Check,
  ArrowRight,
  Edit,
  Battery,
  BatteryWarning,
  ShieldAlert,
  ShieldCheck,
} from 'lucide-react';
import { TonerIssueModal } from './TonerIssueModal';
import { PrinterMaintenanceModal } from './PrinterMaintenanceModal';
import { PrinterModelsModal } from './PrinterModelsModal';
import { TonerModelsModal } from './TonerModelsModal';
import { PrinterPartsModal } from './PrinterPartsModal';
import { PrintersMasterLogModal } from './PrintersMasterLogModal';
import { PrinterGriefDetailModal } from './PrinterGriefDetailModal';

export type FleetStatusLevel = 'Optimal' | 'Warning' | 'Critical';

export const formatLocation = (loc: unknown): string => {
  if (!loc) return 'Main Terminal';
  if (typeof loc === 'string') return loc;
  if (typeof loc === 'object') {
    const l = loc as { building?: string; floor?: string; room?: string };
    const parts = [l.building, l.floor, l.room].filter(Boolean);
    return parts.length > 0 ? parts.join(', ') : 'Main Terminal';
  }
  return String(loc);
};

export interface FleetStatusInfo {
  level: FleetStatusLevel;
  badgeLabel: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  dotBg: string;
  pingDot: boolean;
  summary: string;
  details: string[];
  batteryDays?: number;
  isBatteryWarning: boolean;
  isOverdueMaintenance: boolean;
  isFailedPrinter: boolean;
  isFailedParts: boolean;
  isFailedToner: boolean;
}

export const getPrinterScannerFleetStatus = (
  item: AssetItem,
  allTickets: IssueTicket[],
  allMntRecords: PrinterMaintenanceRecord[]
): FleetStatusInfo => {
  const isPrinter = item.category === 'Printer';
  const itemTickets = allTickets.filter((t) => t.assetId === item.id);
  const activeTickets = itemTickets.filter(
    (t) => t.status === 'Open' || t.status === 'Working' || t.status === 'Pending'
  );
  const criticalTicket = activeTickets.find((t) => t.priority === 'Critical');
  const highTicket = activeTickets.find((t) => t.priority === 'High');

  // 1. Maintenance Overdue Check (> 90 days overdue)
  const mntRecords = allMntRecords.filter(
    (r) => r.assetId === item.id || r.printerName.toLowerCase().includes(item.name.toLowerCase())
  );
  const sortedMnt = [...mntRecords].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  const latestMntDateStr = sortedMnt[0]?.date || item.lastMaintenanceDate;

  let daysSinceMaintenance = 999;
  let isOverdueMaintenance = false;

  if (latestMntDateStr) {
    const mntTime = new Date(latestMntDateStr).getTime();
    if (!isNaN(mntTime)) {
      daysSinceMaintenance = Math.floor((Date.now() - mntTime) / (1000 * 60 * 60 * 24));
      if (daysSinceMaintenance > 90) {
        isOverdueMaintenance = true;
      }
    }
  } else {
    // If no maintenance recorded, check age from purchase
    const purchaseTime = new Date(item.purchaseDate).getTime();
    if (!isNaN(purchaseTime)) {
      const daysSincePurchase = Math.floor((Date.now() - purchaseTime) / (1000 * 60 * 60 * 24));
      if (daysSincePurchase > 180) {
        isOverdueMaintenance = true;
        daysSinceMaintenance = daysSincePurchase;
      }
    }
  }

  // 2. Failed Printer Check (defect, breakdown, critical ticket, scrap)
  const isFailedPrinter =
    item.status === 'Faulty' ||
    item.status === 'Under Repair' ||
    item.status === 'Scrap' ||
    item.pingStatus === 'Offline' ||
    Boolean(criticalTicket) ||
    Boolean(
      highTicket &&
        (highTicket.description.toLowerCase().includes('fail') ||
          highTicket.description.toLowerCase().includes('dead') ||
          highTicket.description.toLowerCase().includes('offline') ||
          highTicket.description.toLowerCase().includes('broken') ||
          highTicket.description.toLowerCase().includes('error'))
    );

  // 3. Failed Parts Check (worn fusers, broken pickup rollers, torn teflon, defective ADF feeder, thermal head defect)
  const partsFailureKeywords = [
    'part',
    'roller',
    'fuser',
    'drum',
    'printhead',
    'head',
    'feeder',
    'pickup',
    'pad',
    'sensor',
    'board',
    'gear',
    'film',
    'belt',
    'teflon',
  ];
  const isFailedParts = activeTickets.some((t) => {
    const desc = t.description.toLowerCase();
    const hasPartKw = partsFailureKeywords.some((kw) => desc.includes(kw));
    const hasFaultKw =
      desc.includes('jam') ||
      desc.includes('broken') ||
      desc.includes('fail') ||
      desc.includes('melted') ||
      desc.includes('worn') ||
      desc.includes('torn') ||
      desc.includes('slip') ||
      desc.includes('multiple sheet') ||
      desc.includes('noise') ||
      desc.includes('faint') ||
      desc.includes('defect');
    return hasPartKw && hasFaultKw;
  });

  // 4. Failed / Depleted Toners Check (<= 10% or depleted/failed cartridge)
  const tonerLvl = item.printerSpecs?.tonerLevel;
  const isFailedToner =
    isPrinter &&
    ((tonerLvl !== undefined && tonerLvl <= 10) ||
      activeTickets.some((t) => {
        const desc = t.description.toLowerCase();
        return (
          desc.includes('toner empty') ||
          desc.includes('cartridge depleted') ||
          desc.includes('toner failed') ||
          desc.includes('ribbon exhausted') ||
          desc.includes('ribbon snapped') ||
          desc.includes('out of toner')
        );
      }));

  // 5. Battery Life Check (< 30 days battery life)
  let batteryDays: number | undefined = undefined;
  if (item.batteryLifeDays !== undefined) {
    batteryDays = item.batteryLifeDays;
  } else if (item.scannerSpecs?.batteryLifeDays !== undefined) {
    batteryDays = item.scannerSpecs.batteryLifeDays;
  } else if (item.printerSpecs?.batteryLifeDays !== undefined) {
    batteryDays = item.printerSpecs.batteryLifeDays;
  } else if (item.upsSpecs?.nextBatteryChangeDate) {
    const dueTime = new Date(item.upsSpecs.nextBatteryChangeDate).getTime();
    if (!isNaN(dueTime)) {
      batteryDays = Math.ceil((dueTime - Date.now()) / (1000 * 60 * 60 * 24));
    }
  } else if (
    item.scannerSpecs?.scannerType === 'Portable' ||
    item.name.toLowerCase().includes('portable') ||
    item.name.toLowerCase().includes('cordless') ||
    item.name.toLowerCase().includes('wireless') ||
    item.model.toLowerCase().includes('ds3678')
  ) {
    batteryDays = 22; // default portable scanner battery life in days
  }

  const isBatteryWarning = batteryDays !== undefined && batteryDays < 30;

  // 6. Other Warning triggers: low toner (11% - 25%), preventive maintenance due soon (75-90 days), or medium ticket
  const isTonerWarning = isPrinter && tonerLvl !== undefined && tonerLvl > 10 && tonerLvl <= 25;
  const isMntDueSoon = daysSinceMaintenance >= 75 && daysSinceMaintenance <= 90;
  const hasMediumTicket = activeTickets.some((t) => t.priority === 'Medium');

  // CRITICAL STATUS (Red: overdue maintenance or failed printer/parts or tonners)
  if (isOverdueMaintenance || isFailedPrinter || isFailedParts || isFailedToner) {
    const details: string[] = [];
    if (isOverdueMaintenance) {
      details.push(
        daysSinceMaintenance < 999
          ? `Overdue Mnt (${daysSinceMaintenance}d ago)`
          : 'Overdue Mnt Schedule'
      );
    }
    if (isFailedPrinter) {
      details.push(
        criticalTicket
          ? `Grief #${criticalTicket.ticketNumber} (${criticalTicket.priority})`
          : 'Failed / Offline Printer'
      );
    }
    if (isFailedParts) {
      details.push('Defective / Failed Hardware Parts');
    }
    if (isFailedToner) {
      details.push(`Failed / Low Toner (${tonerLvl ?? 0}%)`);
    }

    return {
      level: 'Critical',
      badgeLabel: 'Critical',
      badgeBg: 'bg-rose-500/15 dark:bg-rose-950/40',
      badgeText: 'text-rose-700 dark:text-rose-300',
      badgeBorder: 'border-rose-300 dark:border-rose-800',
      dotBg: 'bg-rose-600',
      pingDot: true,
      summary: details.join(' • '),
      details,
      batteryDays,
      isBatteryWarning,
      isOverdueMaintenance,
      isFailedPrinter,
      isFailedParts,
      isFailedToner,
    };
  }

  // WARNING STATUS (Amber: < 30 days battery life, or low supply/preventive alerts)
  if (isBatteryWarning || isTonerWarning || isMntDueSoon || hasMediumTicket) {
    const details: string[] = [];
    if (isBatteryWarning) {
      details.push(
        batteryDays !== undefined
          ? `< 30d Battery Life (${batteryDays}d left)`
          : '< 30d Battery Life'
      );
    }
    if (isTonerWarning) {
      details.push(`Low Toner Supply (${tonerLvl}%)`);
    }
    if (isMntDueSoon) {
      details.push(`Mnt Due in ${90 - daysSinceMaintenance}d`);
    }
    if (hasMediumTicket) {
      details.push(`Ticket #${activeTickets[0]?.ticketNumber}`);
    }

    return {
      level: 'Warning',
      badgeLabel: 'Warning',
      badgeBg: 'bg-amber-500/15 dark:bg-amber-950/40',
      badgeText: 'text-amber-800 dark:text-amber-300',
      badgeBorder: 'border-amber-400 dark:border-amber-700',
      dotBg: 'bg-amber-500',
      pingDot: false,
      summary: isBatteryWarning
        ? `< 30d Battery Life (${batteryDays ?? 0}d left)`
        : details.join(' • '),
      details,
      batteryDays,
      isBatteryWarning,
      isOverdueMaintenance: false,
      isFailedPrinter: false,
      isFailedParts: false,
      isFailedToner: false,
    };
  }

  // OPTIMAL STATUS (Green: healthy, no griefs, up-to-date maintenance, battery healthy/AC, normal toners)
  const daysInfo = daysSinceMaintenance < 999 ? `Mnt ${daysSinceMaintenance}d ago` : 'Mnt Up-to-date';
  const supplyInfo =
    isPrinter && tonerLvl !== undefined
      ? `Toner ${tonerLvl}%`
      : batteryDays !== undefined
      ? `Batt ${batteryDays}d`
      : 'Line Power';

  return {
    level: 'Optimal',
    badgeLabel: 'Optimal',
    badgeBg: 'bg-emerald-500/10 dark:bg-emerald-950/40',
    badgeText: 'text-emerald-700 dark:text-emerald-300',
    badgeBorder: 'border-emerald-300 dark:border-emerald-800',
    dotBg: 'bg-emerald-500',
    pingDot: false,
    summary: 'Operational • Normal',
    details: [daysInfo, supplyInfo, '0 Active Faults'],
    batteryDays,
    isBatteryWarning: false,
    isOverdueMaintenance: false,
    isFailedPrinter: false,
    isFailedParts: false,
    isFailedToner: false,
  };
};

interface PrintersScannersViewProps {
  onSelectAsset: (asset: AssetItem) => void;
  onOpenIssueModal: (asset: AssetItem) => void;
  onOpenAddModal: () => void;
  onOpenEditModal?: (asset: AssetItem) => void;
}

export const PrintersScannersView: React.FC<PrintersScannersViewProps> = ({
  onSelectAsset,
  onOpenIssueModal,
  onOpenAddModal,
  onOpenEditModal,
}) => {
  const {
    assets,
    tickets,
    updateTicketStatus,
    printerMaintenanceRecords,
    tonerModels,
    printerParts,
    printerModels,
    addAuditLog,
  } = useInventory();
  const [filterType, setFilterType] = useState<'ALL' | 'Printer' | 'Scanner'>('ALL');
  const [search, setSearch] = useState('');
  const [isTonerModalOpen, setIsTonerModalOpen] = useState(false);
  const [selectedTonerAsset, setSelectedTonerAsset] = useState<AssetItem | null>(null);
  const [tonerMode, setTonerMode] = useState<'new' | 'refill'>('new');
  const [exportedFeedback, setExportedFeedback] = useState<string | null>(null);

  // Grief Detail Modal state
  const [selectedGriefAsset, setSelectedGriefAsset] = useState<AssetItem | null>(null);
  const [isGriefModalOpen, setIsGriefModalOpen] = useState(false);
  const [griefModalInitialTab, setGriefModalInitialTab] = useState<'brief' | 'grief' | 'toner' | 'maintenance' | 'parts'>('brief');
  const [viewMode, setViewMode] = useState<'GRID' | 'GRIEF_REGISTER'>('GRID');
  const [statusFilter, setStatusFilter] = useState<
    'ALL' | 'CRITICAL' | 'WARNING' | 'OPTIMAL' | 'ACTIVE_GRIEF' | 'COLOR_DISPLAY' | 'MONO'
  >('ALL');

  // Modals for Printer Maintenance, Models, Toners, Parts, Master Log
  const [isMaintenanceModalOpen, setIsMaintenanceModalOpen] = useState(false);
  const [maintenanceDefaultTab, setMaintenanceDefaultTab] = useState<'form' | 'history'>('form');
  const [preselectedMntAssetId, setPreselectedMntAssetId] = useState<string | undefined>(undefined);

  const [isPrinterModelsModalOpen, setIsPrinterModelsModalOpen] = useState(false);
  const [isTonerModelsModalOpen, setIsTonerModelsModalOpen] = useState(false);
  const [isPrinterPartsModalOpen, setIsPrinterPartsModalOpen] = useState(false);
  const [isMasterLogModalOpen, setIsMasterLogModalOpen] = useState(false);

  const [selectedModelFilter, setSelectedModelFilter] = useState<string>('ALL');

  const items = assets.filter(
    (a) => !a.isRemoved && (a.category === 'Printer' || a.category === 'Scanner')
  );

  // High-precision fleet status mapping for supervisors
  const itemStatusMap = useMemo(() => {
    const map = new Map<string, FleetStatusInfo>();
    items.forEach((item) => {
      map.set(item.id, getPrinterScannerFleetStatus(item, tickets, printerMaintenanceRecords));
    });
    return map;
  }, [items, tickets, printerMaintenanceRecords]);

  const criticalItems = useMemo(
    () => items.filter((item) => itemStatusMap.get(item.id)?.level === 'Critical'),
    [items, itemStatusMap]
  );
  const warningItems = useMemo(
    () => items.filter((item) => itemStatusMap.get(item.id)?.level === 'Warning'),
    [items, itemStatusMap]
  );
  const optimalItems = useMemo(
    () => items.filter((item) => itemStatusMap.get(item.id)?.level === 'Optimal'),
    [items, itemStatusMap]
  );
  const batteryWarningItems = useMemo(
    () => items.filter((item) => itemStatusMap.get(item.id)?.isBatteryWarning),
    [items, itemStatusMap]
  );

  const activeGriefItems = items.filter((item) =>
    tickets.some(
      (t) => t.assetId === item.id && (t.status === 'Open' || t.status === 'Working' || t.status === 'Pending')
    )
  );

  const colorDisplayItems = items.filter((item) => {
    const isP = item.category === 'Printer';
    return (
      (isP && item.printerSpecs?.colorType === 'Color') ||
      item.category === 'Scanner' ||
      item.name.toLowerCase().includes('color') ||
      item.model.toLowerCase().includes('color')
    );
  });

  const healthyItems = items.filter(
    (item) =>
      !tickets.some(
        (t) => t.assetId === item.id && (t.status === 'Open' || t.status === 'Working' || t.status === 'Pending')
      )
  );

  const filtered = items.filter((item) => {
    if (filterType !== 'ALL' && item.category !== filterType) return false;

    if (statusFilter === 'CRITICAL') {
      if (itemStatusMap.get(item.id)?.level !== 'Critical') return false;
    } else if (statusFilter === 'WARNING') {
      if (itemStatusMap.get(item.id)?.level !== 'Warning') return false;
    } else if (statusFilter === 'OPTIMAL') {
      if (itemStatusMap.get(item.id)?.level !== 'Optimal') return false;
    } else if (statusFilter === 'ACTIVE_GRIEF') {
      const hasGrief = tickets.some(
        (t) => t.assetId === item.id && (t.status === 'Open' || t.status === 'Working' || t.status === 'Pending')
      );
      if (!hasGrief) return false;
    } else if (statusFilter === 'COLOR_DISPLAY') {
      const isColor =
        (item.category === 'Printer' && item.printerSpecs?.colorType === 'Color') ||
        item.category === 'Scanner' ||
        item.name.toLowerCase().includes('color') ||
        item.model.toLowerCase().includes('color');
      if (!isColor) return false;
    } else if (statusFilter === 'MONO') {
      const isColor =
        (item.category === 'Printer' && item.printerSpecs?.colorType === 'Color') ||
        item.category === 'Scanner' ||
        item.name.toLowerCase().includes('color') ||
        item.model.toLowerCase().includes('color');
      if (isColor) return false;
    }

    if (selectedModelFilter !== 'ALL') {
      const target = selectedModelFilter.toLowerCase();
      const combined = `${item.name} ${item.brand} ${item.model} ${item.printerSpecs?.tonerModel || ''}`.toLowerCase();
      if (!combined.includes(target)) return false;
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        item.name.toLowerCase().includes(q) ||
        item.department.toLowerCase().includes(q) ||
        item.brand.toLowerCase().includes(q) ||
        item.model.toLowerCase().includes(q) ||
        item.id.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const lowTonerPrinters = items.filter(
    (p) => p.category === 'Printer' && p.printerSpecs?.tonerLevel !== undefined && p.printerSpecs.tonerLevel <= 25
  );

  const handleOpenTonerIssue = (asset?: AssetItem, mode: 'new' | 'refill' = 'new') => {
    setSelectedTonerAsset(asset || null);
    setTonerMode(mode);
    setIsTonerModalOpen(true);
  };

  const handleOpenMaintenance = (tab: 'form' | 'history', assetId?: string) => {
    setMaintenanceDefaultTab(tab);
    setPreselectedMntAssetId(assetId);
    setIsMaintenanceModalOpen(true);
  };

  const handleOpenGrief = (
    asset?: AssetItem,
    tab: 'brief' | 'grief' | 'toner' | 'maintenance' | 'parts' = 'brief'
  ) => {
    setSelectedGriefAsset(asset || activeGriefItems[0] || items[0] || null);
    setGriefModalInitialTab(tab);
    setIsGriefModalOpen(true);
  };

  const handleQuickResolveGrief = (ticketNumber: string) => {
    updateTicketStatus(
      ticketNumber,
      'Closed',
      'Defect investigated & resolved by duty hardware technician. Normal printer/scanner operation restored.',
      new Date().toISOString().replace('T', ' ').slice(0, 16)
    );
  };

  const exportHardwareInventoryCsv = () => {
    const listToExport = filtered.length > 0 ? filtered : items;

    const headers = [
      'Asset ID',
      'Device Name',
      'Category',
      'Brand',
      'Model',
      'Serial Number',
      'Asset Tag',
      'Department',
      'Location / Room',
      'Assigned User / Custodian',
      'IP Address',
      'Connection Type',
      'Hardware Type',
      'Color Capability',
      'Toner / Ribbon Model',
      'Toner Level (%)',
      'Fleet Health Status',
      'Operational Status',
      'Connectivity Status',
      'Battery Days Remaining',
      'Last Maintenance Date',
      'Repairs Count',
      'Total Maintenance Cost (PKR)',
      'Active Grief / Faults',
      'Purchase Date',
      'Warranty Expiry',
    ];

    const escapeCsv = (val: unknown): string => {
      if (val === null || val === undefined) return '""';
      const s = String(val).replace(/"/g, '""');
      return `"${s}"`;
    };

    const rows = listToExport.map((item) => {
      const isP = item.category === 'Printer';
      const fleetStatus =
        itemStatusMap.get(item.id) ||
        getPrinterScannerFleetStatus(item, tickets, printerMaintenanceRecords);

      // Maintenance records
      const itemMnt = printerMaintenanceRecords.filter(
        (r) =>
          r.assetId === item.id ||
          (r.printerName && r.printerName.toLowerCase().includes(item.name.toLowerCase()))
      );
      const totalSpend = itemMnt.reduce((acc, curr) => acc + (curr.totalCost || 0), 0);

      // Active complaints / grief tickets
      const itemTickets = tickets.filter(
        (t) =>
          t.assetId === item.id &&
          (t.status === 'Open' || t.status === 'Working' || t.status === 'Pending')
      );
      const activeFaults = itemTickets.map((t) => `[${t.ticketNumber}] ${t.description}`).join('; ');

      const tonerLvl = isP ? (item.printerSpecs?.tonerLevel ?? 'N/A') : 'N/A';
      const tonerMdl = isP ? (item.printerSpecs?.tonerModel || 'Standard') : 'N/A';
      const hwType = isP
        ? (item.printerSpecs?.printerType || 'Laser')
        : (item.scannerSpecs?.scannerType || 'Flatbed/ADF');
      const connType = isP ? (item.printerSpecs?.connectionType || 'Network') : 'USB/Network';
      const isColor =
        (isP && item.printerSpecs?.colorType === 'Color') ||
        item.name.toLowerCase().includes('color') ||
        item.model.toLowerCase().includes('color') ||
        !isP;

      const batteryDays =
        item.printerSpecs?.batteryLifeDays ??
        item.scannerSpecs?.batteryLifeDays ??
        item.batteryLifeDays ??
        'N/A';

      return [
        escapeCsv(item.id),
        escapeCsv(item.name),
        escapeCsv(item.category),
        escapeCsv(item.brand),
        escapeCsv(item.model),
        escapeCsv(item.serialNumber),
        escapeCsv(item.assetTag || item.id),
        escapeCsv(item.department),
        escapeCsv(formatLocation(item.location)),
        escapeCsv(item.assignedUser || 'Unassigned / Counter Shared'),
        escapeCsv(item.systemSpecs?.ipAddress || 'DHCP'),
        escapeCsv(connType),
        escapeCsv(hwType),
        escapeCsv(isColor ? 'Color' : 'Monochrome'),
        escapeCsv(tonerMdl),
        escapeCsv(tonerLvl),
        escapeCsv(fleetStatus.badgeLabel),
        escapeCsv(item.status),
        escapeCsv(item.pingStatus || 'Online'),
        escapeCsv(batteryDays),
        escapeCsv(item.lastMaintenanceDate || 'N/A'),
        escapeCsv(itemMnt.length),
        escapeCsv(totalSpend),
        escapeCsv(activeFaults || 'None (Operational)'),
        escapeCsv(item.purchaseDate || 'N/A'),
        escapeCsv(item.warrantyExpiry || 'N/A'),
      ];
    });

    const csvContent =
      '\uFEFF' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    const timestamp = new Date().toISOString().slice(0, 10);
    link.setAttribute(
      'download',
      `PAA_Printers_Scanners_Inventory_Report_${timestamp}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setExportedFeedback(`Exported (${listToExport.length})`);
    setTimeout(() => {
      setExportedFeedback(null);
    }, 3000);

    if (addAuditLog) {
      addAuditLog(
        'Printers & Scanners Inventory Exported',
        `Generated local hardware inventory CSV report (${listToExport.length} units exported)`,
        undefined,
        'info'
      );
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Printer className="h-5 w-5 text-emerald-500" />
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Printers & Scanners Command Hub</h2>
            <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
              {items.length} Units Online
            </span>
          </div>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            Monitor toner levels, ADF scanners, printer maintenance & parts replacement, toner registries, and fleet logs.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            id="export-printers-scanners-csv-btn-top"
            onClick={exportHardwareInventoryCsv}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 shadow-xs transition active:scale-[0.98]"
            title="Export Local Hardware Inventory Report (CSV)"
          >
            <FileSpreadsheet className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <span>{exportedFeedback || 'Export to CSV'}</span>
          </button>

          <button
            onClick={() => handleOpenTonerIssue(undefined, 'refill')}
            className="flex items-center gap-1.5 rounded-xl bg-teal-600 px-3.5 py-2 text-xs font-bold text-white shadow-md hover:bg-teal-500 transition"
          >
            <RotateCw className="h-4 w-4" />
            <span>Refill Toner Issue</span>
          </button>

          <button
            onClick={() => handleOpenTonerIssue(undefined, 'new')}
            className="flex items-center gap-1.5 rounded-xl border border-teal-600 bg-teal-50 px-3.5 py-2 text-xs font-bold text-teal-800 hover:bg-teal-100 dark:bg-slate-800 dark:text-teal-300 transition"
          >
            <Droplet className="h-4 w-4" />
            <span>Toner Issue Register</span>
          </button>

          <button
            onClick={onOpenAddModal}
            className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white shadow-md hover:bg-emerald-500 transition"
          >
            <Plus className="h-4 w-4" />
            <span>Add Printer / Scanner</span>
          </button>
        </div>
      </div>

      {/* Executive Command Brief & Fleet Grief Dashboard Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Card 1: Critical Fleet Status (Red: Overdue Maintenance, Failed Printer/Parts, Depleted Toners) */}
        <div
          onClick={() => setStatusFilter(statusFilter === 'CRITICAL' ? 'ALL' : 'CRITICAL')}
          className={`cursor-pointer rounded-2xl border p-4 transition shadow-xs flex flex-col justify-between ${
            statusFilter === 'CRITICAL'
              ? 'ring-2 ring-rose-500 border-rose-400 bg-rose-100/90 dark:bg-rose-950/70'
              : criticalItems.length > 0
              ? 'border-rose-300 bg-rose-50/80 hover:bg-rose-100/80 dark:border-rose-900/60 dark:bg-rose-950/30'
              : 'border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-rose-700 dark:text-rose-400">
              Critical Fleet Status
            </span>
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-xl text-white ${
                criticalItems.length > 0 ? 'bg-rose-600 animate-pulse' : 'bg-slate-600'
              }`}
            >
              <AlertTriangle className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black text-rose-600 dark:text-rose-400">
              {criticalItems.length}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 ml-1.5 font-medium">
              critical units
            </span>
          </div>
          <p className="mt-1 text-[11px] text-rose-700 dark:text-rose-300 font-bold leading-tight">
            {criticalItems.length > 0
              ? '🔴 Overdue Mnt • Failed Parts / Toners'
              : '🟢 Zero Critical Faults'}
          </p>
        </div>

        {/* Card 2: Warning & Battery Life (< 30 days battery life / low supply alerts) */}
        <div
          onClick={() => setStatusFilter(statusFilter === 'WARNING' ? 'ALL' : 'WARNING')}
          className={`cursor-pointer rounded-2xl border p-4 transition shadow-xs flex flex-col justify-between ${
            statusFilter === 'WARNING'
              ? 'ring-2 ring-amber-500 border-amber-400 bg-amber-100/90 dark:bg-amber-950/70'
              : warningItems.length > 0
              ? 'border-amber-300 bg-amber-50/80 hover:bg-amber-100/80 dark:border-amber-900/60 dark:bg-amber-950/30'
              : 'border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-amber-700 dark:text-amber-400">
              Warning & Battery Life
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-600 text-white">
              <BatteryWarning className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black text-amber-600 dark:text-amber-400">
              {warningItems.length}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 ml-1.5 font-medium">
              {batteryWarningItems.length > 0
                ? `${batteryWarningItems.length} batt < 30d`
                : 'attention required'}
            </span>
          </div>
          <p className="mt-1 text-[11px] text-amber-700 dark:text-amber-300 font-bold leading-tight">
            🟡 &lt; 30d Battery Life / Low Supply
          </p>
        </div>

        {/* Card 3: Optimal Fleet Units (Green) */}
        <div
          onClick={() => setStatusFilter(statusFilter === 'OPTIMAL' ? 'ALL' : 'OPTIMAL')}
          className={`cursor-pointer rounded-2xl border p-4 transition shadow-xs flex flex-col justify-between ${
            statusFilter === 'OPTIMAL'
              ? 'ring-2 ring-emerald-500 border-emerald-400 bg-emerald-100/90 dark:bg-emerald-950/70'
              : 'border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
              Optimal Fleet Units
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-600 text-white">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
              {optimalItems.length}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 ml-1.5 font-medium">
              healthy operational
            </span>
          </div>
          <p className="mt-1 text-[11px] text-emerald-700 dark:text-emerald-300 font-bold leading-tight">
            🟢 100% Operational • Mnt Current
          </p>
        </div>

        {/* Card 4: Repair Jobs & Spares Catalog */}
        <div
          onClick={() => handleOpenMaintenance('history')}
          className="cursor-pointer rounded-2xl border border-slate-200 bg-white p-4 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 transition shadow-xs flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-indigo-700 dark:text-indigo-400">
              Repairs & Maintenance
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-600 text-white">
              <Wrench className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black text-slate-900 dark:text-white">
              {printerMaintenanceRecords.length}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 ml-1.5 font-medium">
              service sheets
            </span>
          </div>
          <p className="mt-1 text-[11px] text-indigo-600 dark:text-indigo-400 font-bold leading-tight">
            PKR {printerMaintenanceRecords.reduce((s, r) => s + (r.costPkr || 0), 0).toLocaleString()} spent • {printerParts.length} spares
          </p>
        </div>
      </div>

      {/* Main Operations Action Bar (Requested Buttons) */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Wrench className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            <span className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Printer Maintenance, Grief & Fleet Command Center
            </span>
          </div>
          <span className="text-[11px] text-slate-400 font-medium">
            Fault trouble tickets, repair job sheets, toners, parts catalog, and master audit logs
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
          {/* Button 0: Printer Grief & Defect Brief (FIRST PRIORITY REQUESTED BUTTON) */}
          <button
            onClick={() => handleOpenGrief(activeGriefItems[0] || items[0], 'grief')}
            className={`flex flex-col items-start gap-1 rounded-xl border p-2.5 text-left transition group ${
              activeGriefItems.length > 0
                ? 'border-rose-300 bg-rose-50 hover:bg-rose-100/90 dark:border-rose-900/60 dark:bg-rose-950/40'
                : 'border-slate-200 bg-slate-50 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-800/60'
            }`}
          >
            <div className="flex items-center gap-1.5 text-rose-700 dark:text-rose-300">
              <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-rose-600 text-white group-hover:scale-105 transition">
                <AlertTriangle className="h-3.5 w-3.5" />
              </div>
              <span className="text-xs font-bold">Printer Grief & Faults</span>
            </div>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
              {activeGriefItems.length > 0 ? `🚨 ${activeGriefItems.length} active complaints` : '🟢 Grief-Free fleet'}
            </span>
          </button>

          {/* Button 1: Printer Maintenance Repair Form (Change Parts & Repair Maintenance) */}
          <button
            onClick={() => handleOpenMaintenance('form')}
            className="flex flex-col items-start gap-1 rounded-xl border border-indigo-200 bg-indigo-50/70 p-2.5 text-left hover:bg-indigo-100/80 dark:border-indigo-900/50 dark:bg-indigo-950/30 dark:hover:bg-indigo-950/60 transition group"
          >
            <div className="flex items-center gap-1.5 text-indigo-700 dark:text-indigo-300">
              <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-indigo-600 text-white group-hover:scale-105 transition">
                <Wrench className="h-3.5 w-3.5" />
              </div>
              <span className="text-xs font-bold">Repair & Maintenance</span>
            </div>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
              Change parts & log repair service
            </span>
          </button>

          {/* Button 2: Printer Maintenance Repair Log / History */}
          <button
            onClick={() => handleOpenMaintenance('history')}
            className="flex flex-col items-start gap-1 rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-left hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-800/60 dark:hover:bg-slate-800 transition group"
          >
            <div className="flex items-center gap-1.5 text-slate-800 dark:text-slate-200">
              <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-slate-700 text-white group-hover:scale-105 transition">
                <History className="h-3.5 w-3.5" />
              </div>
              <span className="text-xs font-bold">Maintenance Repair Log</span>
            </div>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
              {printerMaintenanceRecords.length} historical repair sheets
            </span>
          </button>

          {/* Button 3: New Printer / Models / Companies */}
          <button
            onClick={() => setIsPrinterModelsModalOpen(true)}
            className="flex flex-col items-start gap-1 rounded-xl border border-emerald-200 bg-emerald-50/70 p-2.5 text-left hover:bg-emerald-100/80 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:hover:bg-emerald-950/60 transition group"
          >
            <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-300">
              <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-600 text-white group-hover:scale-105 transition">
                <Building2 className="h-3.5 w-3.5" />
              </div>
              <span className="text-xs font-bold">Models & Companies</span>
            </div>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
              {printerModels.length} models / brands hub
            </span>
          </button>

          {/* Button 4: New Toner Models */}
          <button
            onClick={() => setIsTonerModelsModalOpen(true)}
            className="flex flex-col items-start gap-1 rounded-xl border border-teal-200 bg-teal-50/70 p-2.5 text-left hover:bg-teal-100/80 dark:border-teal-900/50 dark:bg-teal-950/30 dark:hover:bg-teal-950/60 transition group"
          >
            <div className="flex items-center gap-1.5 text-teal-700 dark:text-teal-300">
              <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-teal-600 text-white group-hover:scale-105 transition">
                <Droplet className="h-3.5 w-3.5" />
              </div>
              <span className="text-xs font-bold">New Toner Models</span>
            </div>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
              {tonerModels.length} toner types & stock
            </span>
          </button>

          {/* Button 5: Printer Parts */}
          <button
            onClick={() => setIsPrinterPartsModalOpen(true)}
            className="flex flex-col items-start gap-1 rounded-xl border border-amber-200 bg-amber-50/70 p-2.5 text-left hover:bg-amber-100/80 dark:border-amber-900/50 dark:bg-amber-950/30 dark:hover:bg-amber-950/60 transition group"
          >
            <div className="flex items-center gap-1.5 text-amber-700 dark:text-amber-300">
              <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-amber-600 text-white group-hover:scale-105 transition">
                <Package className="h-3.5 w-3.5" />
              </div>
              <span className="text-xs font-bold">Printer Spare Parts</span>
            </div>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
              {printerParts.length} parts inventory
            </span>
          </button>

          {/* Button 6: Printers Log for All Printers & Toners Details */}
          <button
            onClick={() => setIsMasterLogModalOpen(true)}
            className="flex flex-col items-start gap-1 rounded-xl border border-cyan-200 bg-cyan-50/70 p-2.5 text-left hover:bg-cyan-100/80 dark:border-cyan-900/50 dark:bg-cyan-950/30 dark:hover:bg-cyan-950/60 transition group"
          >
            <div className="flex items-center gap-1.5 text-cyan-700 dark:text-cyan-300">
              <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-cyan-600 text-white group-hover:scale-105 transition">
                <Activity className="h-3.5 w-3.5" />
              </div>
              <span className="text-xs font-bold">Printers & Toners Log</span>
            </div>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
              All fleet & toner audit sheet
            </span>
          </button>
        </div>
      </div>

      {/* Low Toner Alert Bar */}
      {lowTonerPrinters.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
            <div>
              <span className="font-bold">Low Toner Alert ({lowTonerPrinters.length} Printers Require Replenishment):</span>
              <p className="mt-0.5 text-[11px] opacity-90">
                {lowTonerPrinters.map((p) => `${p.name} (${p.department}: ${p.printerSpecs?.tonerLevel}%)`).join(' • ')}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleOpenTonerIssue(lowTonerPrinters[0], 'refill')}
              className="min-h-[44px] flex items-center justify-center gap-1.5 rounded-xl bg-teal-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-teal-500 transition shrink-0 active:scale-[0.98]"
            >
              <RotateCw className="h-4 w-4" />
              <span>Refill Toner Issue</span>
            </button>
            <button
              onClick={() => handleOpenTonerIssue(lowTonerPrinters[0], 'new')}
              className="min-h-[44px] flex items-center justify-center gap-1.5 rounded-xl bg-amber-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-amber-500 transition shrink-0 active:scale-[0.98]"
            >
              <Droplet className="h-4 w-4" />
              <span>Issue New Toner</span>
            </button>
          </div>
        </div>
      )}

      {/* Search & Filter Options */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search printers, toner model, department, brand..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 py-2 text-xs font-medium text-slate-800 outline-none focus:border-emerald-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
          />
        </div>

        <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white p-1 dark:border-slate-800 dark:bg-slate-900">
          {(['ALL', 'Printer', 'Scanner'] as const).map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                filterType === type
                  ? 'bg-emerald-600 text-white'
                  : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
              }`}
            >
              {type === 'ALL' ? 'All Hardware' : `${type}s`}
            </button>
          ))}
        </div>
      </div>

      {/* Quick Select Model & Scanner Preset Buttons Bar */}
      <div className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <Printer className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Quick Filter by Printer & Scanner Models:</span>
          </span>
          {selectedModelFilter !== 'ALL' && (
            <button
              onClick={() => setSelectedModelFilter('ALL')}
              className="text-[11px] font-bold text-rose-600 hover:underline dark:text-rose-400"
            >
              Reset Model Filter ({selectedModelFilter})
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setSelectedModelFilter('ALL')}
            className={`rounded-lg px-2.5 py-1 text-xs font-bold transition border ${
              selectedModelFilter === 'ALL'
                ? 'bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900 dark:border-white'
                : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
            }`}
          >
            All Models
          </button>

          {/* Printer Models */}
          {[
            { label: 'HP 1102W', filterKey: '1102' },
            { label: 'HP 102', filterKey: '102' },
            { label: 'HP 402', filterKey: '402' },
            { label: 'HP 1320', filterKey: '1320' },
            { label: 'HP M 600', filterKey: '600' },
            { label: 'HP M 602', filterKey: '602' },
            { label: 'HP 2300', filterKey: '2300' },
            { label: 'BROTHER', filterKey: 'brother' },
            { label: 'EPSON INK JET', filterKey: 'epson' },
          ].map((m) => {
            const isActive = selectedModelFilter === m.filterKey;
            return (
              <button
                key={m.label}
                onClick={() => {
                  setSelectedModelFilter(isActive ? 'ALL' : m.filterKey);
                  setFilterType('Printer');
                }}
                className={`rounded-lg px-2.5 py-1 text-xs font-bold transition border ${
                  isActive
                    ? 'bg-teal-600 text-white border-teal-600 shadow-xs'
                    : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60'
                }`}
              >
                🖨️ {m.label}
              </button>
            );
          })}

          {/* Scanner Models */}
          {[
            { label: 'Fujitsu fi-7160', filterKey: 'fujitsu' },
            { label: 'HP ScanJet Pro', filterKey: 'scanjet' },
            { label: 'Canon ImageFORMULA', filterKey: 'canon' },
            { label: 'Epson Scanner', filterKey: 'perfection' },
            { label: 'Avision ADF', filterKey: 'avision' },
          ].map((s) => {
            const isActive = selectedModelFilter === s.filterKey;
            return (
              <button
                key={s.label}
                onClick={() => {
                  setSelectedModelFilter(isActive ? 'ALL' : s.filterKey);
                  setFilterType('Scanner');
                }}
                className={`rounded-lg px-2.5 py-1 text-xs font-bold transition border ${
                  isActive
                    ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                    : 'bg-blue-50 text-blue-800 border-blue-200 hover:bg-blue-100 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800/60'
                }`}
              >
                📄 {s.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Grief & Color Display Filter Pill Bar & View Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mr-1 flex items-center gap-1">
            <Activity className="h-3.5 w-3.5 text-indigo-500" />
            <span>Filter:</span>
          </span>

          <button
            onClick={() => setStatusFilter('ALL')}
            className={`rounded-lg px-2.5 py-1 text-xs font-bold transition border ${
              statusFilter === 'ALL'
                ? 'bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900 dark:border-white'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
            }`}
          >
            All Hardware ({items.length})
          </button>

          {/* Optimal Badge Filter */}
          <button
            onClick={() => setStatusFilter(statusFilter === 'OPTIMAL' ? 'ALL' : 'OPTIMAL')}
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold transition border ${
              statusFilter === 'OPTIMAL'
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
            }`}
          >
            <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-2xs" />
            <span>Optimal ({optimalItems.length})</span>
          </button>

          {/* Warning Badge Filter (< 30 days battery life) */}
          <button
            onClick={() => setStatusFilter(statusFilter === 'WARNING' ? 'ALL' : 'WARNING')}
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold transition border ${
              statusFilter === 'WARNING'
                ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-700'
            }`}
          >
            <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
            <span>Warning: &lt; 30d Batt ({warningItems.length})</span>
          </button>

          {/* Critical Badge Filter (Overdue maintenance, failed printer/parts, toners) */}
          <button
            onClick={() => setStatusFilter(statusFilter === 'CRITICAL' ? 'ALL' : 'CRITICAL')}
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold transition border ${
              statusFilter === 'CRITICAL'
                ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                : 'bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900'
            }`}
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
            </span>
            <span>Critical ({criticalItems.length})</span>
          </button>

          <button
            onClick={() => setStatusFilter(statusFilter === 'ACTIVE_GRIEF' ? 'ALL' : 'ACTIVE_GRIEF')}
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold transition border ${
              statusFilter === 'ACTIVE_GRIEF'
                ? 'bg-red-700 text-white border-red-700 shadow-xs'
                : 'bg-red-50 text-red-800 border-red-200 hover:bg-red-100 dark:bg-red-950/40 dark:text-red-300 dark:border-red-900'
            }`}
          >
            <AlertTriangle className="h-3 w-3" />
            <span>Active Griefs ({activeGriefItems.length})</span>
          </button>

          <button
            onClick={() => setStatusFilter(statusFilter === 'COLOR_DISPLAY' ? 'ALL' : 'COLOR_DISPLAY')}
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold transition border ${
              statusFilter === 'COLOR_DISPLAY'
                ? 'bg-pink-600 text-white border-pink-600 shadow-xs'
                : 'bg-pink-50 text-pink-800 border-pink-200 hover:bg-pink-100 dark:bg-pink-950/40 dark:text-pink-300 dark:border-pink-900'
            }`}
          >
            <span className="flex items-center gap-0.5">
              <span className="h-2 w-2 rounded-full bg-cyan-400"></span>
              <span className="h-2 w-2 rounded-full bg-pink-500"></span>
              <span className="h-2 w-2 rounded-full bg-amber-400"></span>
              <span className="h-2 w-2 rounded-full bg-slate-900"></span>
            </span>
            <span>Color ({colorDisplayItems.length})</span>
          </button>

          <button
            onClick={() => setStatusFilter(statusFilter === 'MONO' ? 'ALL' : 'MONO')}
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold transition border ${
              statusFilter === 'MONO'
                ? 'bg-slate-700 text-white border-slate-700 shadow-xs'
                : 'bg-slate-100 text-slate-800 border-slate-200 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
            }`}
          >
            <span className="h-2 w-2 rounded-full bg-slate-900 dark:bg-slate-100"></span>
            <span>Mono ({items.length - colorDisplayItems.length})</span>
          </button>
        </div>

        {/* View Mode Switcher & Export */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            id="export-printers-scanners-csv-btn"
            onClick={exportHardwareInventoryCsv}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 shadow-2xs transition active:scale-[0.98]"
            title="Export local hardware inventory report to CSV"
          >
            <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>{exportedFeedback || 'Export to CSV'}</span>
          </button>

          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl shrink-0">
            <button
              onClick={() => setViewMode('GRID')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition ${
                viewMode === 'GRID'
                  ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-700 dark:text-white'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Fleet Cards</span>
            </button>
            <button
              onClick={() => setViewMode('GRIEF_REGISTER')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition ${
                viewMode === 'GRIEF_REGISTER'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400'
              }`}
            >
              <AlertTriangle className="h-3.5 w-3.5" />
              <span>Grief & Defect Register ({activeGriefItems.length})</span>
            </button>
          </div>
        </div>
      </div>

      {viewMode === 'GRIEF_REGISTER' ? (
        /* Comprehensive Grief & Breakdown Register Table */
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="border-b border-slate-100 bg-slate-50/70 px-5 py-4 dark:border-slate-800 dark:bg-slate-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-rose-600 dark:text-rose-400" />
                <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white">
                  Printers & Scanners Grief, Toner, Repair & Spare Parts Register
                </h3>
              </div>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                Detailed 360° breakdown of fault complaints, current toner levels, lifetime maintenance logs, and fitted spare components.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                id="export-printers-scanners-csv-btn-table"
                onClick={exportHardwareInventoryCsv}
                className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 transition shadow-2xs active:scale-[0.98]"
                title="Export local hardware inventory report to CSV"
              >
                <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>{exportedFeedback || 'Export to CSV'}</span>
              </button>
              <span className="rounded-full bg-rose-100 px-3 py-1 text-xs font-black text-rose-800 dark:bg-rose-950/60 dark:text-rose-300">
                {activeGriefItems.length} Open Griefs
              </span>
              <button
                onClick={() => handleOpenGrief(activeGriefItems[0] || items[0], 'grief')}
                className="flex items-center gap-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white px-3 py-1.5 text-xs font-bold transition shadow-xs"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Log New Grief</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-100 bg-slate-50/50 text-[10px] font-black uppercase tracking-wider text-slate-400 dark:border-slate-800 dark:bg-slate-800/20">
                <tr>
                  <th className="py-3 px-4">Equipment & Location</th>
                  <th className="py-3 px-4">Fleet Status</th>
                  <th className="py-3 px-4">Grief / Fault Complaint</th>
                  <th className="py-3 px-4">Toner in Detail</th>
                  <th className="py-3 px-4">Repair & Maintenance</th>
                  <th className="py-3 px-4">Parts Changed</th>
                  <th className="py-3 px-4 text-right">360° Detail Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filtered.map((item) => {
                  const isP = item.category === 'Printer';
                  const fleetStatus =
                    itemStatusMap.get(item.id) ||
                    getPrinterScannerFleetStatus(item, tickets, printerMaintenanceRecords);
                  const itemTickets = tickets.filter((t) => t.assetId === item.id);
                  const activeGrief = itemTickets.find(
                    (t) => t.status === 'Open' || t.status === 'Working' || t.status === 'Pending'
                  );
                  const itemMnt = printerMaintenanceRecords.filter(
                    (r) => r.assetId === item.id || r.printerName.toLowerCase().includes(item.name.toLowerCase())
                  );
                  const partsReplaced = itemMnt.flatMap((r) => r.partsReplaced || []);
                  const totalSpend = itemMnt.reduce((s, r) => s + (r.costPkr || 0), 0);
                  const tonerLvl = item.printerSpecs?.tonerLevel ?? 100;
                  const isColor =
                    (isP && item.printerSpecs?.colorType === 'Color') ||
                    item.name.toLowerCase().includes('color') ||
                    item.model.toLowerCase().includes('color');

                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition ${
                        fleetStatus.level === 'Critical'
                          ? 'bg-rose-50/30 dark:bg-rose-950/20'
                          : fleetStatus.level === 'Warning'
                          ? 'bg-amber-50/20 dark:bg-amber-950/10'
                          : ''
                      }`}
                    >
                      {/* Equipment & Location */}
                      <td className="py-3.5 px-4 align-top">
                        <div className="flex items-start gap-2.5">
                          <div className={`mt-0.5 flex h-7 w-7 items-center justify-center rounded-lg text-white shrink-0 ${
                            isP ? 'bg-emerald-600' : 'bg-blue-600'
                          }`}>
                            <Printer className="h-3.5 w-3.5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-slate-900 dark:text-white">
                                {item.name}
                              </span>
                              <span className="font-mono text-[10px] text-slate-400">
                                #{item.id}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400">
                              {item.brand} {item.model}
                            </p>
                            <span className="mt-1 inline-block rounded-md bg-slate-100 px-1.5 py-0.5 text-[9px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                              📍 {item.department} ({formatLocation(item.location)})
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Fleet Status Badge (Optimal, Warning, Critical) */}
                      <td className="py-3.5 px-4 align-top">
                        <div className="space-y-1.5 min-w-[145px]">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider border shadow-2xs ${fleetStatus.badgeBg} ${fleetStatus.badgeText} ${fleetStatus.badgeBorder}`}
                            title={fleetStatus.details.join(' • ')}
                          >
                            <span className="relative flex h-2 w-2 shrink-0">
                              {fleetStatus.pingDot && (
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                              )}
                              <span className={`relative inline-flex rounded-full h-2 w-2 ${fleetStatus.dotBg}`} />
                            </span>
                            <span>{fleetStatus.badgeLabel}</span>
                          </span>

                          <p className="text-[11px] font-bold text-slate-800 dark:text-slate-200 line-clamp-2 leading-tight">
                            {fleetStatus.summary}
                          </p>

                          <div className="flex flex-wrap items-center gap-1 text-[9px] font-semibold text-slate-500 dark:text-slate-400">
                            {fleetStatus.batteryDays !== undefined && (
                              <span
                                className={`inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 font-bold ${
                                  fleetStatus.isBatteryWarning
                                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300'
                                    : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                                }`}
                              >
                                <Battery className="h-2.5 w-2.5" />
                                {fleetStatus.batteryDays}d batt
                              </span>
                            )}
                            {item.lastMaintenanceDate && (
                              <span className="rounded bg-slate-100 dark:bg-slate-800 px-1 py-0.5 font-mono text-[9px]">
                                Mnt: {item.lastMaintenanceDate}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Grief / Fault Complaint */}
                      <td className="py-3.5 px-4 align-top max-w-[280px]">
                        {activeGrief ? (
                          <div className="rounded-xl border border-rose-200 bg-rose-50/90 p-2 text-rose-950 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-200">
                            <div className="flex items-center justify-between gap-1 mb-1">
                              <span className="font-mono text-[9px] font-black uppercase text-rose-700 dark:text-rose-400">
                                Grief #{activeGrief.ticketNumber}
                              </span>
                              <span className="rounded-full bg-rose-600 px-1.5 py-0.2 text-[8px] font-black uppercase text-white">
                                {activeGrief.priority}
                              </span>
                            </div>
                            <p className="text-[11px] font-bold line-clamp-2 leading-tight text-slate-900 dark:text-white">
                              "{activeGrief.description}"
                            </p>
                            <div className="mt-1.5 flex items-center justify-between text-[9px] text-slate-500 dark:text-slate-400 border-t border-rose-200/60 dark:border-rose-900/60 pt-1">
                              <span>Tech: <strong>{activeGrief.assignedEngineer}</strong></span>
                              <button
                                type="button"
                                onClick={() => handleQuickResolveGrief(activeGrief.ticketNumber)}
                                className="font-bold text-emerald-700 hover:underline dark:text-emerald-400 flex items-center gap-0.5"
                              >
                                <CheckCircle2 className="h-2.5 w-2.5" />
                                <span>Resolve</span>
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between rounded-lg border border-emerald-200/60 bg-emerald-50/50 px-2.5 py-1.5 text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/20 dark:text-emerald-300">
                            <div className="flex items-center gap-1.5">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                              <span className="font-bold text-[10px]">Nil (Grief-Free)</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleOpenGrief(item, 'grief')}
                              className="text-[9px] font-black text-emerald-700 hover:underline dark:text-emerald-300"
                            >
                              + Log Grief
                            </button>
                          </div>
                        )}
                      </td>

                      {/* Toner in Detail */}
                      <td className="py-3.5 px-4 align-top">
                        {isP ? (
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-bold text-slate-700 dark:text-slate-300">
                                {tonerLvl}%
                              </span>
                              <span className={`rounded-md px-1.5 py-0.5 text-[9px] font-bold ${
                                isColor
                                  ? 'bg-pink-100 text-pink-700 dark:bg-pink-950/40 dark:text-pink-300'
                                  : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                              }`}>
                                {isColor ? '🎨 CMYK' : '⚫ Mono'}
                              </span>
                            </div>
                            <div className="h-1.5 w-28 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                              <div
                                className={`h-full rounded-full ${
                                  tonerLvl <= 15
                                    ? 'bg-rose-500'
                                    : tonerLvl <= 30
                                    ? 'bg-amber-500'
                                    : 'bg-teal-500'
                                }`}
                                style={{ width: `${tonerLvl}%` }}
                              />
                            </div>
                            <div className="flex items-center justify-between text-[10px]">
                              <span className="font-mono text-slate-400">
                                {item.printerSpecs?.tonerModel || 'Standard'}
                              </span>
                              <button
                                onClick={() => handleOpenTonerIssue(item, 'refill')}
                                className="font-bold text-teal-600 hover:underline dark:text-teal-400"
                              >
                                Refill
                              </button>
                            </div>
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-400 italic">ADF Scanner</span>
                        )}
                      </td>

                      {/* Repair & Maintenance */}
                      <td className="py-3.5 px-4 align-top">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-900 dark:text-white">
                              {itemMnt.length} Repairs
                            </span>
                            <span className="text-[10px] text-slate-400">
                              (PKR {totalSpend.toLocaleString()})
                            </span>
                          </div>
                          {itemMnt.length > 0 && (
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate max-w-[150px]">
                              Last: {itemMnt[0].serviceType} ({itemMnt[0].serviceDate})
                            </p>
                          )}
                          <button
                            onClick={() => handleOpenMaintenance('form', item.id)}
                            className="font-bold text-indigo-600 hover:underline dark:text-indigo-400 text-[10px] flex items-center gap-0.5"
                          >
                            <Wrench className="h-2.5 w-2.5" />
                            <span>+ Log Repair</span>
                          </button>
                        </div>
                      </td>

                      {/* Parts Changed */}
                      <td className="py-3.5 px-4 align-top">
                        <div className="space-y-1">
                          <span className="font-bold text-slate-900 dark:text-white">
                            {partsReplaced.length} Parts Fitted
                          </span>
                          {partsReplaced.length > 0 ? (
                            <div className="flex flex-wrap gap-1 max-w-[160px]">
                              {partsReplaced.slice(0, 2).map((p, idx) => (
                                <span
                                  key={idx}
                                  className="rounded bg-slate-100 px-1 py-0.2 text-[9px] text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                                >
                                  {p}
                                </span>
                              ))}
                              {partsReplaced.length > 2 && (
                                <span className="text-[9px] text-slate-400 font-bold">
                                  +{partsReplaced.length - 2} more
                                </span>
                              )}
                            </div>
                          ) : (
                            <p className="text-[10px] text-slate-400 italic">No parts replaced</p>
                          )}
                          <button
                            onClick={() => handleOpenGrief(item, 'parts')}
                            className="font-bold text-amber-600 hover:underline dark:text-amber-400 text-[10px]"
                          >
                            Inspect Parts
                          </button>
                        </div>
                      </td>

                      {/* 360° Detail Action */}
                      <td className="py-3.5 px-4 align-top text-right">
                        <div className="flex flex-col items-end gap-2">
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => onOpenEditModal ? onOpenEditModal(item) : onSelectAsset(item)}
                              className="min-h-[44px] px-3 py-2 flex items-center justify-center gap-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-bold text-xs border border-blue-200/80 dark:border-blue-900/60 shadow-xs transition active:scale-[0.98]"
                              title="Edit Printer / Scanner Specifications"
                            >
                              <Edit className="h-4 w-4 text-blue-500" />
                              <span>Edit</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => onOpenIssueModal(item)}
                              className="min-h-[44px] px-3 py-2 flex items-center justify-center gap-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 font-bold text-xs border border-rose-200/80 dark:border-rose-900/60 shadow-xs transition active:scale-[0.98]"
                              title="Report Issue / Log Trouble Ticket"
                            >
                              <AlertTriangle className="h-4 w-4 text-rose-500" />
                              <span>Issue</span>
                            </button>
                          </div>
                          <button
                            onClick={() => handleOpenGrief(item, 'brief')}
                            className="min-h-[36px] flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 transition"
                          >
                            <span>Inspect Brief</span>
                            <ArrowRight className="h-3 w-3" />
                          </button>
                          <div className="flex items-center gap-1.5 text-[10px]">
                            <button
                              onClick={() => handleOpenGrief(item, 'grief')}
                              className="font-bold text-rose-600 hover:underline dark:text-rose-400 py-1"
                            >
                              Grief
                            </button>
                            <span className="text-slate-300 dark:text-slate-700">•</span>
                            <button
                              onClick={() => handleOpenGrief(item, 'toner')}
                              className="font-bold text-teal-600 hover:underline dark:text-teal-400 py-1"
                            >
                              Toner
                            </button>
                            <span className="text-slate-300 dark:text-slate-700">•</span>
                            <button
                              onClick={() => handleOpenGrief(item, 'maintenance')}
                              className="font-bold text-indigo-600 hover:underline dark:text-indigo-400 py-1"
                            >
                              Mnt
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Grid of Printer / Scanner Cards */
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <div className="text-xs text-slate-500 dark:text-slate-400">
              Showing <strong className="text-slate-800 dark:text-slate-200">{filtered.length}</strong> of {items.length} hardware units
              {statusFilter !== 'ALL' && (
                <span className="ml-1.5 rounded-md bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 text-[10px] font-bold text-slate-600 dark:text-slate-300">
                  Filter: {statusFilter}
                </span>
              )}
            </div>
            <button
              type="button"
              id="export-printers-scanners-csv-btn-grid"
              onClick={exportHardwareInventoryCsv}
              className="flex sm:hidden items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 shadow-2xs transition active:scale-[0.98]"
              title="Export local hardware inventory report to CSV"
            >
              <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>{exportedFeedback || 'Export to CSV'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((item) => {
          const isP = item.category === 'Printer';
          const fleetStatus =
            itemStatusMap.get(item.id) ||
            getPrinterScannerFleetStatus(item, tickets, printerMaintenanceRecords);
          const tonerLvl = item.printerSpecs?.tonerLevel ?? 100;
          const isLowToner = isP && tonerLvl <= 25;
          const isColor =
            (isP && item.printerSpecs?.colorType === 'Color') ||
            item.name.toLowerCase().includes('color') ||
            item.model.toLowerCase().includes('color') ||
            !isP;

          // Find active grief tickets for this asset
          const itemTickets = tickets.filter((t) => t.assetId === item.id);
          const activeGrief = itemTickets.find(
            (t) => t.status === 'Open' || t.status === 'Working' || t.status === 'Pending'
          );

          // Simulated or calculated CMYK levels for Color Printers
          const cmyk = {
            c: Math.min(100, Math.max(15, Math.round(tonerLvl * 0.95))),
            m: Math.min(100, Math.max(10, Math.round(tonerLvl * 0.82))),
            y: Math.min(100, Math.max(20, Math.round(tonerLvl * 1.05))),
            k: tonerLvl,
          };

          return (
            <div
              key={item.id}
              className={`flex flex-col justify-between rounded-2xl border bg-white p-4.5 shadow-xs transition hover:shadow-md dark:bg-slate-900 ${
                fleetStatus.level === 'Critical'
                  ? 'border-rose-400 dark:border-rose-700 ring-2 ring-rose-400/25 bg-rose-50/10'
                  : fleetStatus.level === 'Warning'
                  ? 'border-amber-400 dark:border-amber-600 ring-2 ring-amber-400/25 bg-amber-50/10'
                  : 'border-slate-200 dark:border-slate-800 hover:border-emerald-400'
              }`}
            >
              <div>
                {/* Header Row: ID, Category, Color Display & Color-Coded Status Badge */}
                <div className="flex items-center justify-between gap-1 flex-wrap">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-mono text-xs font-black text-emerald-600 dark:text-emerald-400">
                      {item.id}
                    </span>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                      {item.category}
                    </span>

                    {/* Color Display Capability Pill */}
                    {isColor ? (
                      <span
                        className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-cyan-500/10 via-pink-500/10 to-amber-500/10 border border-pink-400/30 px-2 py-0.5 text-[9px] font-black text-pink-700 dark:text-pink-300"
                        title={isP ? 'Full CMYK Color Laser/Inkjet' : '24-bit TrueColor High-Resolution Scanner'}
                      >
                        <span className="flex items-center gap-0.5">
                          <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
                          <span className="h-1.5 w-1.5 rounded-full bg-pink-500" />
                          <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                        </span>
                        <span>{isP ? 'COLOR CMYK' : 'COLOR SCAN'}</span>
                      </span>
                    ) : (
                      <span
                        className="inline-flex items-center gap-1 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 px-2 py-0.5 text-[9px] font-bold text-slate-700 dark:text-slate-300"
                        title="Monochrome High-Yield Laser"
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-slate-900 dark:bg-slate-200" />
                        <span>MONO</span>
                      </span>
                    )}
                  </div>

                  {/* Prominent Color-Coded Status Badge: 'Optimal' (Green), 'Warning' (Amber for < 30 days battery life), 'Critical' (Red) */}
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider border shadow-2xs ${fleetStatus.badgeBg} ${fleetStatus.badgeText} ${fleetStatus.badgeBorder}`}
                    title={fleetStatus.details.join(' • ')}
                  >
                    <span className="relative flex h-2 w-2 shrink-0">
                      {fleetStatus.pingDot && (
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                      )}
                      <span className={`relative inline-flex rounded-full h-2 w-2 ${fleetStatus.dotBg}`} />
                    </span>
                    <span>{fleetStatus.badgeLabel}</span>
                  </span>
                </div>

                {/* Device Title & User Assignment */}
                <h3
                  onClick={() => onSelectAsset(item)}
                  className="mt-2 text-sm font-bold text-slate-900 dark:text-white hover:text-emerald-600 cursor-pointer transition leading-snug"
                >
                  {item.name}
                </h3>

                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                  Dept: <span className="text-emerald-600 dark:text-emerald-400 font-bold">{item.department}</span> • User: {item.assignedUser}
                </p>

                {/* Supervisor Fleet Status Alert Banner */}
                {fleetStatus.level === 'Critical' && (
                  <div className="mt-2.5 flex items-start gap-2 rounded-xl border border-rose-300 bg-rose-50/90 p-2.5 text-xs text-rose-950 dark:border-rose-900/70 dark:bg-rose-950/40 dark:text-rose-200">
                    <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-black uppercase tracking-wider text-[10px] text-rose-700 dark:text-rose-400">
                          Critical Fleet Issue
                        </span>
                        <span className="rounded-full bg-rose-600 px-1.5 py-0.2 text-[8px] font-black text-white">
                          ACTION DUE
                        </span>
                      </div>
                      <p className="mt-0.5 text-[11px] font-bold text-rose-900 dark:text-rose-100">
                        {fleetStatus.summary}
                      </p>
                      {fleetStatus.details.length > 1 && (
                        <div className="mt-1 flex flex-wrap gap-1">
                          {fleetStatus.details.map((d, i) => (
                            <span
                              key={i}
                              className="rounded bg-rose-100 dark:bg-rose-900/60 px-1.5 py-0.5 text-[9px] font-semibold text-rose-800 dark:text-rose-300"
                            >
                              • {d}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {fleetStatus.level === 'Warning' && (
                  <div className="mt-2.5 flex items-start gap-2 rounded-xl border border-amber-300 bg-amber-50/90 p-2.5 text-xs text-amber-950 dark:border-amber-900/70 dark:bg-amber-950/40 dark:text-amber-200">
                    {fleetStatus.isBatteryWarning ? (
                      <BatteryWarning className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-black uppercase tracking-wider text-[10px] text-amber-700 dark:text-amber-400">
                          {fleetStatus.isBatteryWarning ? 'Battery Alert (< 30 Days)' : 'Warning / Advisory'}
                        </span>
                        {fleetStatus.batteryDays !== undefined && (
                          <span className="rounded-full bg-amber-500 px-2 py-0.2 text-[9px] font-black text-slate-950">
                            🔋 {fleetStatus.batteryDays}d left
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 text-[11px] font-bold text-amber-900 dark:text-amber-100">
                        {fleetStatus.summary}
                      </p>
                      {fleetStatus.details.length > 1 && (
                        <div className="mt-1 flex flex-wrap gap-1">
                          {fleetStatus.details.map((d, i) => (
                            <span
                              key={i}
                              className="rounded bg-amber-100 dark:bg-amber-900/60 px-1.5 py-0.5 text-[9px] font-semibold text-amber-800 dark:text-amber-300"
                            >
                              • {d}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {fleetStatus.level === 'Optimal' && (
                  <div className="mt-2.5 flex items-center justify-between rounded-xl border border-emerald-200/80 bg-emerald-50/50 px-2.5 py-1.5 text-[11px] text-emerald-900 dark:border-emerald-900/50 dark:bg-emerald-950/20 dark:text-emerald-300">
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span className="font-bold text-emerald-800 dark:text-emerald-300 text-[11px]">
                        Optimal: Fleet Operational
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-emerald-700/80 dark:text-emerald-400/80">
                      0 Faults • Mnt Current
                    </span>
                  </div>
                )}

                {/* Brief Technical Specifications in Color Display */}
                <div className="mt-2.5 flex flex-wrap items-center gap-1.5 text-[10px] font-semibold text-slate-600 dark:text-slate-300">
                  <span className="rounded-md bg-slate-100 dark:bg-slate-800 px-2 py-0.5">
                    {item.brand} {item.model}
                  </span>
                  {isP && item.printerSpecs?.printerType && (
                    <span className="rounded-md bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300 px-2 py-0.5">
                      ⚡ {item.printerSpecs.printerType}
                    </span>
                  )}
                  {isP && item.printerSpecs?.duplex && (
                    <span className="rounded-md bg-teal-50 text-teal-700 dark:bg-teal-950/50 dark:text-teal-300 px-2 py-0.5">
                      📑 Auto-Duplex
                    </span>
                  )}
                  {!isP && item.scannerSpecs && (
                    <span className="rounded-md bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 px-2 py-0.5">
                      📄 {item.scannerSpecs.scannerType} ADF Duplex
                    </span>
                  )}
                  {/* Battery Health Chip */}
                  {fleetStatus.batteryDays !== undefined && (
                    <span
                      className={`rounded-md px-2 py-0.5 text-[10px] font-bold flex items-center gap-1 ${
                        fleetStatus.isBatteryWarning
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 font-black'
                          : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                      }`}
                    >
                      <Battery className="h-3 w-3" />
                      <span>{fleetStatus.batteryDays}d Batt Life</span>
                    </span>
                  )}
                  {/* Maintenance Date Chip */}
                  <span
                    className={`rounded-md px-2 py-0.5 text-[10px] font-bold flex items-center gap-1 ${
                      fleetStatus.isOverdueMaintenance
                        ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-300 font-black'
                        : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                    }`}
                  >
                    <Wrench className="h-3 w-3" />
                    <span>
                      {fleetStatus.isOverdueMaintenance
                        ? 'Mnt Overdue'
                        : `Mnt: ${item.lastMaintenanceDate || 'Current'}`}
                    </span>
                  </span>
                  <span className="rounded-md bg-slate-100 dark:bg-slate-800 px-2 py-0.5">
                    {isP ? item.printerSpecs?.connectionType || 'Network / USB' : 'USB 3.0 / Twain'}
                  </span>
                </div>

                {/* Printer Specific Supply & Toner Gauge (CMYK / Mono) */}
                {isP && item.printerSpecs && (
                  <div className="mt-3 rounded-xl border border-slate-100 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-800/50">
                    <div className="flex items-center justify-between text-xs font-bold mb-1">
                      <span className="text-slate-600 dark:text-slate-300 text-[11px]">
                        Toner: {item.printerSpecs.tonerModel || 'Standard'}
                      </span>
                      <span className={isLowToner ? 'text-rose-500 font-black' : 'text-emerald-600 font-black'}>
                        {tonerLvl}%
                      </span>
                    </div>

                    {/* Color CMYK 4-Bar Display for Color Printers */}
                    {isColor ? (
                      <div className="space-y-1.5 my-2">
                        <div className="grid grid-cols-4 gap-1.5 text-[9px] font-black uppercase text-center">
                          <div className="space-y-0.5">
                            <div className="h-1.5 w-full rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                              <div className="h-full bg-cyan-400 rounded-full" style={{ width: `${cmyk.c}%` }} />
                            </div>
                            <span className="text-cyan-600 dark:text-cyan-400">C: {cmyk.c}%</span>
                          </div>

                          <div className="space-y-0.5">
                            <div className="h-1.5 w-full rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                              <div className="h-full bg-pink-500 rounded-full" style={{ width: `${cmyk.m}%` }} />
                            </div>
                            <span className="text-pink-600 dark:text-pink-400">M: {cmyk.m}%</span>
                          </div>

                          <div className="space-y-0.5">
                            <div className="h-1.5 w-full rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                              <div className="h-full bg-amber-400 rounded-full" style={{ width: `${cmyk.y}%` }} />
                            </div>
                            <span className="text-amber-600 dark:text-amber-400">Y: {cmyk.y}%</span>
                          </div>

                          <div className="space-y-0.5">
                            <div className="h-1.5 w-full rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                              <div className="h-full bg-slate-900 dark:bg-slate-100 rounded-full" style={{ width: `${cmyk.k}%` }} />
                            </div>
                            <span className="text-slate-800 dark:text-slate-300">K: {cmyk.k}%</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* Single Monochrome Laser Gauge */
                      <div className="h-2 w-full rounded-full bg-slate-200 dark:bg-slate-700 my-1.5">
                        <div
                          className={`h-2 rounded-full ${isLowToner ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500'}`}
                          style={{ width: `${tonerLvl}%` }}
                        ></div>
                      </div>
                    )}

                    <div className="mt-2.5 grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => handleOpenTonerIssue(item, 'refill')}
                        className="min-h-[44px] flex items-center justify-center gap-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 px-3 py-2.5 text-xs font-bold text-white transition shadow-xs active:scale-[0.98]"
                        title="Issue Refill Toner and reset gauge level to 100%"
                      >
                        <RotateCw className="h-3.5 w-3.5" />
                        <span>Refill Toner</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenTonerIssue(item, 'new')}
                        className="min-h-[44px] flex items-center justify-center gap-1.5 rounded-xl bg-teal-50 hover:bg-teal-100 border border-teal-200 px-3 py-2.5 text-xs font-bold text-teal-800 dark:bg-slate-800 dark:border-teal-900 dark:text-teal-300 transition active:scale-[0.98]"
                        title="Issue New Toner Cartridge"
                      >
                        <Droplet className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
                        <span>Issue New</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Scanner Specific Optics Condition Display */}
                {!isP && item.scannerSpecs && (
                  <div className="mt-3 rounded-xl border border-slate-100 bg-slate-50 p-3 text-xs dark:border-slate-800 dark:bg-slate-800/50">
                    <div className="flex items-center justify-between text-[11px] text-slate-700 dark:text-slate-300 font-bold">
                      <span className="flex items-center gap-1.5">
                        <Sparkles className="h-4 w-4 text-blue-500" />
                        <span>Optical Glass: Clean & Calibrated</span>
                      </span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-mono text-[10px]">600x600 DPI</span>
                    </div>
                    <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                      Feeder: 50-Sheet ADF Dual CIS Sensor
                    </div>
                  </div>
                )}

                {/* GRIEF DETAIL IN COLOR DISPLAY BLOCK */}
                {activeGrief ? (
                  <div
                    className={`mt-3 rounded-xl border p-3 shadow-xs transition ${
                      activeGrief.priority === 'Critical'
                        ? 'border-red-300 bg-red-50/90 text-red-950 dark:border-red-800/80 dark:bg-red-950/40 dark:text-red-200'
                        : activeGrief.priority === 'High'
                        ? 'border-rose-300 bg-rose-50/90 text-rose-950 dark:border-rose-800/80 dark:bg-rose-950/40 dark:text-rose-200'
                        : 'border-amber-300 bg-amber-50/90 text-amber-950 dark:border-amber-800/80 dark:bg-amber-950/40 dark:text-amber-200'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <div className="flex items-center gap-1.5">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                        </span>
                        <span className="font-mono text-[10px] font-black uppercase text-rose-700 dark:text-rose-300">
                          Grief #{activeGrief.ticketNumber}
                        </span>
                      </div>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-wider ${
                          activeGrief.priority === 'Critical'
                            ? 'bg-red-600 text-white'
                            : activeGrief.priority === 'High'
                            ? 'bg-rose-600 text-white'
                            : 'bg-amber-500 text-white'
                        }`}
                      >
                        {activeGrief.priority} Priority
                      </span>
                    </div>

                    <p className="text-xs font-bold leading-snug line-clamp-2 text-slate-900 dark:text-white">
                      "{activeGrief.description}"
                    </p>

                    <div className="mt-2 flex items-center justify-between text-[10px] text-slate-600 dark:text-slate-300 border-t border-black/5 dark:border-white/5 pt-1.5">
                      <span>User: <strong>{activeGrief.user}</strong></span>
                      <span className="text-indigo-600 dark:text-indigo-300 font-bold">
                        Tech: {activeGrief.assignedEngineer}
                      </span>
                    </div>

                    <div className="mt-2.5 flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => handleOpenGrief(item)}
                        className="min-h-[44px] flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-white/95 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 py-2 px-3 text-xs font-bold text-slate-800 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-700 transition active:scale-[0.98]"
                      >
                        <AlertTriangle className="h-4 w-4 text-rose-500" />
                        <span>Grief Sheet</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuickResolveGrief(activeGrief.ticketNumber)}
                        className="min-h-[44px] flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-3.5 py-2 text-xs font-bold text-white shadow-xs transition active:scale-[0.98]"
                        title="Mark Grief as Resolved"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        <span>Resolve</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-3 flex items-center justify-between gap-2 rounded-xl border border-emerald-200/80 bg-emerald-50/60 p-2.5 text-xs text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/20 dark:text-emerald-300">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-xs" />
                      <span className="text-[11px] font-bold">Grief Status: Nil (Healthy)</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleOpenGrief(item)}
                      className="min-h-[44px] flex items-center justify-center gap-1 rounded-lg bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-900/40 dark:hover:bg-emerald-900/60 px-3 py-2 text-xs font-black text-emerald-800 dark:text-emerald-200 transition active:scale-[0.98]"
                      title="Log a new equipment breakdown or fault complaint on this unit"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>Log Grief</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Primary Touch Action Targets for Mobile (>=44px touch height) */}
              <div className="mt-3.5 grid grid-cols-2 gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => onOpenEditModal ? onOpenEditModal(item) : onSelectAsset(item)}
                  className="min-h-[44px] flex items-center justify-center gap-2 rounded-xl bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-900/60 py-2.5 px-3.5 text-xs font-bold text-blue-700 dark:text-blue-300 border border-blue-200/80 dark:border-blue-900/60 shadow-xs transition active:scale-[0.98]"
                  title="Edit Printer / Scanner Specifications & Details"
                >
                  <Edit className="h-4 w-4 text-blue-500" />
                  <span>Edit Device</span>
                </button>

                <button
                  type="button"
                  onClick={() => onOpenIssueModal(item)}
                  className="min-h-[44px] flex items-center justify-center gap-2 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 py-2.5 px-3.5 text-xs font-bold text-rose-700 dark:text-rose-300 border border-rose-200/80 dark:border-rose-900/60 shadow-xs transition active:scale-[0.98]"
                  title="Report Issue / Log Trouble Ticket for this unit"
                >
                  <AlertTriangle className="h-4 w-4 text-rose-500" />
                  <span>Issue Ticket</span>
                </button>
              </div>

              {/* Secondary Navigation & Module Links */}
              <div className="mt-2.5 flex flex-wrap items-center justify-between border-t border-slate-100/60 pt-2.5 dark:border-slate-800/60 text-[11px] gap-1.5">
                <button
                  onClick={() => handleOpenGrief(item, 'grief')}
                  className="min-h-[36px] flex items-center gap-1 rounded-lg px-2 py-1 font-bold text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/30 transition"
                  title="View Grief History & Log Trouble Tickets"
                >
                  <AlertTriangle className="h-3.5 w-3.5 text-rose-500" />
                  <span>Grief</span>
                </button>

                {isP && (
                  <button
                    onClick={() => handleOpenGrief(item, 'toner')}
                    className="min-h-[36px] flex items-center gap-1 rounded-lg px-2 py-1 font-bold text-teal-600 hover:bg-teal-50 dark:text-teal-400 dark:hover:bg-teal-950/30 transition"
                    title="View Toner Levels & Replenishment Records"
                  >
                    <Droplet className="h-3.5 w-3.5 text-teal-500" />
                    <span>Toner</span>
                  </button>
                )}

                {isP && (
                  <button
                    onClick={() => handleOpenGrief(item, 'maintenance')}
                    className="min-h-[36px] flex items-center gap-1 rounded-lg px-2 py-1 font-bold text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-950/30 transition"
                    title="View Repair Jobs & Log Service"
                  >
                    <Wrench className="h-3.5 w-3.5 text-indigo-500" />
                    <span>Repair</span>
                  </button>
                )}

                {isP && (
                  <button
                    onClick={() => handleOpenGrief(item, 'parts')}
                    className="min-h-[36px] flex items-center gap-1 rounded-lg px-2 py-1 font-bold text-amber-600 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-950/30 transition"
                    title="Inspect Replaced Parts & Spare Inventory"
                  >
                    <Package className="h-3.5 w-3.5 text-amber-500" />
                    <span>Parts</span>
                  </button>
                )}

                <button
                  onClick={() => handleOpenGrief(item, 'brief')}
                  className="min-h-[36px] flex items-center gap-1 rounded-lg px-2.5 py-1 font-bold text-emerald-600 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/30 transition ml-auto"
                  title="Inspect 360-Degree Equipment Brief"
                >
                  <span>Brief</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          );
        })}
          </div>
        </div>
      )}

      {/* Printer & Scanner Grief Detail Modal */}
      <PrinterGriefDetailModal
        isOpen={isGriefModalOpen}
        onClose={() => setIsGriefModalOpen(false)}
        asset={selectedGriefAsset}
        onOpenMaintenanceForm={(assetId) => handleOpenMaintenance('form', assetId)}
        onOpenTonerIssueModal={handleOpenTonerIssue}
        onSelectAsset={(a) => setSelectedGriefAsset(a)}
        initialTab={griefModalInitialTab}
      />

      {/* Toner Issue Modal */}
      <TonerIssueModal
        isOpen={isTonerModalOpen}
        onClose={() => setIsTonerModalOpen(false)}
        preselectedAsset={selectedTonerAsset}
        initialMode={tonerMode}
      />

      {/* Printer Maintenance & Repair (Change Parts) Modal */}
      <PrinterMaintenanceModal
        isOpen={isMaintenanceModalOpen}
        onClose={() => setIsMaintenanceModalOpen(false)}
        preselectedAssetId={preselectedMntAssetId}
        defaultTab={maintenanceDefaultTab}
      />

      {/* Printer Models & Companies Modal */}
      <PrinterModelsModal
        isOpen={isPrinterModelsModalOpen}
        onClose={() => setIsPrinterModelsModalOpen(false)}
      />

      {/* Toner Models Modal */}
      <TonerModelsModal
        isOpen={isTonerModelsModalOpen}
        onClose={() => setIsTonerModelsModalOpen(false)}
      />

      {/* Printer Spare Parts Catalog Modal */}
      <PrinterPartsModal
        isOpen={isPrinterPartsModalOpen}
        onClose={() => setIsPrinterPartsModalOpen(false)}
      />

      {/* Printers & Toners Master Log Sheet Modal */}
      <PrintersMasterLogModal
        isOpen={isMasterLogModalOpen}
        onClose={() => setIsMasterLogModalOpen(false)}
        onOpenMaintenanceForm={(assetId) => handleOpenMaintenance('form', assetId)}
        onOpenTonerIssueModal={(assetId) => {
          const target = assets.find((a) => a.id === assetId);
          handleOpenTonerIssue(target, 'new');
        }}
      />
    </div>
  );
};
