import React, { useState } from 'react';
import { useInventory } from '../context/InventoryContext';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import {
  Shield,
  Activity,
  Server,
  HardDrive,
  Printer,
  Wifi,
  AlertTriangle,
  CheckCircle2,
  Clock,
  PlusCircle,
  FileSpreadsheet,
  QrCode,
  ArrowUpRight,
  Zap,
  Globe,
  Radio,
  Building,
  UserCheck,
  Wrench,
  Search,
  Calendar,
  Keyboard,
  Mouse,
  Layers,
  Bell,
  ShoppingCart,
  Store,
  Coins,
  Wallet,
  TrendingUp,
  Receipt,
  Banknote,
  PackageCheck,
  FileText,
  ChevronDown,
  ChevronRight,
  Laptop,
  Database,
  RotateCcw,
  Cable,
  Network,
  BatteryCharging,
  Compass,
  Map,
  X,
} from 'lucide-react';
import { AssetItem, DeviceCategory } from '../types/inventory';
import { NotificationCenter } from './NotificationCenter';
import { AirportMapOverlay } from './AirportMapOverlay';
import { ProcurementFormModal } from './ProcurementFormModal';
import { InternalRequisitionFormModal } from './InternalRequisitionFormModal';
import { LogisticsReceivingModal } from './LogisticsReceivingModal';
import { PCWebFileModal } from './PCWebFileModal';
import { ReturnToSupplyBRModal } from './ReturnToSupplyBRModal';
import { RecentActivityPanel } from './RecentActivityPanel';
import { UPSBatteryReplacementModal } from './UPSBatteryReplacementModal';
import { UPSBackupListModal } from './UPSBackupListModal';

interface DashboardProps {
  onNavigateTab?: (tab: any) => void;
  onNavigate?: (tab: any) => void;
  onOpenAddModal: () => void;
  onOpenExcelImport?: () => void;
  onOpenImportModal?: () => void;
  onSelectAsset: (asset: AssetItem) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  onNavigateTab,
  onNavigate,
  onOpenAddModal,
  onOpenExcelImport,
  onOpenImportModal,
  onSelectAsset,
}) => {
  const { assets, tickets, facilities, maintenanceRecords, exportDatabaseJson, allDepartments, allCategories } = useInventory();

  // Modal States for Dashboard Toolbar Actions
  const [showProcurementModal, setShowProcurementModal] = useState<boolean>(false);
  const [procurementInitialData, setProcurementInitialData] = useState<any>(undefined);
  const [showRequisitionModal, setShowRequisitionModal] = useState<boolean>(false);
  const [showLogisticsModal, setShowLogisticsModal] = useState<boolean>(false);
  const [showPCWebFileModal, setShowPCWebFileModal] = useState<boolean>(false);
  const [showReturnToSupplyModal, setShowReturnToSupplyModal] = useState<boolean>(false);
  const [showFormsMenu, setShowFormsMenu] = useState<boolean>(false);
  const [showBatteryReplacementModal, setShowBatteryReplacementModal] = useState<boolean>(false);
  const [showBackupListModal, setShowBackupListModal] = useState<boolean>(false);
  const [showAirportMapModal, setShowAirportMapModal] = useState<boolean>(false);

  const handleNav = (tab: string) => {
    if (onNavigateTab) onNavigateTab(tab);
    else if (onNavigate) onNavigate(tab);
  };

  // Calculate metrics
  const activeAssets = assets.filter((a) => !a.isRemoved);
  const totalCount = activeAssets.length;
  const activeCount = activeAssets.filter((a) => a.status === 'Active').length;
  const spareCount = activeAssets.filter((a) => a.status === 'Spare').length;
  const repairCount = activeAssets.filter((a) => a.status === 'Under Repair').length;
  const faultyCount = activeAssets.filter((a) => a.status === 'Faulty').length;
  const upsCount = activeAssets.filter((a) => a.category === 'UPS' || a.upsSpecs !== undefined).length;

  const onlineCount = activeAssets.filter((a) => a.pingStatus === 'Online').length;
  const warningCount = activeAssets.filter((a) => a.pingStatus === 'Warning').length;
  const offlineCount = activeAssets.filter((a) => a.pingStatus === 'Offline').length;

  const openTickets = tickets.filter((t) => t.status !== 'Closed');

  // Expiring Warranty within 90 days or already expired
  const now = new Date();
  const ninetyDays = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
  const expiringWarrantyCount = activeAssets.filter((a) => {
    if (!a.warrantyExpiry) return false;
    const exp = new Date(a.warrantyExpiry);
    return exp <= ninetyDays;
  }).length;

  // Category counts
  const categoriesList: { name: string; categoryKey: DeviceCategory; icon: any }[] = [
    { name: 'Desktop Computers', categoryKey: 'Desktop PC', icon: HardDrive },
    { name: 'Laptops', categoryKey: 'Laptop', icon: HardDrive },
    { name: 'Printers', categoryKey: 'Printer', icon: Printer },
    { name: 'Scanners', categoryKey: 'Scanner', icon: Printer },
    { name: 'Keyboards', categoryKey: 'Keyboard', icon: Keyboard },
    { name: 'Computer Mice', categoryKey: 'Mouse', icon: Mouse },
    { name: 'Keyboard & Mouse Combos', categoryKey: 'Keyboard & Mouse', icon: Keyboard },
    { name: 'Core Switches', categoryKey: 'Core Switch', icon: Server },
    { name: 'Access Switches', categoryKey: 'Access Switch', icon: Server },
    { name: 'Routers', categoryKey: 'Router', icon: Globe },
    { name: 'Firewalls', categoryKey: 'Firewall', icon: Shield },
    { name: 'Wireless APs', categoryKey: 'Access Point', icon: Wifi },
    { name: 'Servers', categoryKey: 'Server', icon: Server },
    { name: 'UPS Units', categoryKey: 'UPS', icon: Zap },
    { name: 'IP Phones', categoryKey: 'IP Phone', icon: Radio },
    { name: 'Fiber Patch Cords', categoryKey: 'Fiber Patch Cord', icon: Network },
    { name: 'UTP Patch Cords & Cables', categoryKey: 'UTP Patch Cord / Network Cable', icon: Cable },
  ];

  const categoryMatrixData = categoriesList.map((item) => {
    const items = activeAssets.filter((a) => a.category === item.categoryKey);
    return {
      ...item,
      total: items.length,
      active: items.filter((a) => a.status === 'Active').length,
      spare: items.filter((a) => a.status === 'Spare').length,
      maintenance: items.filter((a) => a.status === 'Under Repair').length,
      faulty: items.filter((a) => a.status === 'Faulty').length,
    };
  });

  // Department distribution for Recharts
  const deptDistributionData = allDepartments
    .map((dept) => ({
      department: dept,
      count: activeAssets.filter((a) => a.department === dept).length,
    }))
    .filter((d) => d.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Asset Utilization Overview Data (Distribution of asset statuses across departments)
  const departmentUtilizationData = allDepartments
    .map((dept) => {
      const deptAssets = activeAssets.filter((a) => a.department === dept);
      const active = deptAssets.filter((a) => a.status === 'Active').length;
      const spare = deptAssets.filter((a) => a.status === 'Spare').length;
      const inRepair = deptAssets.filter((a) => a.status === 'Under Repair').length;
      const faulty = deptAssets.filter((a) => a.status === 'Faulty' || a.status === 'Retired').length;
      const total = deptAssets.length;
      const activeRate = total > 0 ? Math.round((active / total) * 100) : 0;
      return {
        department: dept,
        Active: active,
        Spare: spare,
        'In Repair': inRepair,
        Faulty: faulty,
        total,
        activeRate,
      };
    })
    .filter((d) => d.total > 0)
    .sort((a, b) => b.total - a.total);

  // Status Pie Data
  const statusPieData = [
    { name: 'Active', value: activeCount, color: '#10B981' },
    { name: 'Spare', value: spareCount, color: '#3B82F6' },
    { name: 'Under Repair', value: repairCount, color: '#F59E0B' },
    { name: 'Faulty', value: faultyCount, color: '#EF4444' },
  ].filter((d) => d.value > 0);

  // Annual Budget & Usage Data Calculations
  const totalMaintCost = maintenanceRecords.reduce((sum, m) => sum + (m.cost || 0), 0);
  const annualTotalAllocated = 45000000; // PKR 45 Million
  const annualUtilizedToDate = 21750000 + totalMaintCost; // PKR 21.75M + actual maintenance
  const annualCommittedPending = 6250000; // PKR 6.25M
  const annualRemainingBudget = annualTotalAllocated - (annualUtilizedToDate + annualCommittedPending);
  const annualUtilizedPct = Math.round((annualUtilizedToDate / annualTotalAllocated) * 100);

  const budgetHeads = [
    {
      code: 'A03901',
      name: 'IT Consumables, Toners & Local Market Purchase',
      allocated: 12500000,
      utilized: 6850000,
      color: '#8B5CF6',
    },
    {
      code: 'A03902',
      name: 'Hardware Equipment & Workstation Procurement',
      allocated: 20000000,
      utilized: 9400000,
      color: '#10B981',
    },
    {
      code: 'A03903',
      name: 'Maintenance, Local Market Repairs & Spares',
      allocated: 8500000,
      utilized: 3850000 + totalMaintCost,
      color: '#F59E0B',
    },
    {
      code: 'A03904',
      name: 'Network Infrastructure, Switches & Fiber Optics',
      allocated: 4000000,
      utilized: 1650000,
      color: '#06B6D4',
    },
  ];

  const monthlySpendTrend = [
    { month: 'Jul', spend: 1800000 },
    { month: 'Aug', spend: 2100000 },
    { month: 'Sep', spend: 2400000 },
    { month: 'Oct', spend: 1950000 },
    { month: 'Nov', spend: 3200000 },
    { month: 'Dec', spend: 2800000 },
    { month: 'Jan', spend: 2500000 },
    { month: 'Feb', spend: 2250000 },
    { month: 'Mar (Est)', spend: 2750000 },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner / Welcome Row */}
      <div className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-200 bg-gradient-to-r from-slate-900 via-slate-800 to-teal-950 p-5 text-white shadow-lg dark:border-slate-800 md:flex-row md:items-center">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-400 animate-ping"></span>
            <span className="text-xs font-semibold uppercase tracking-widest text-emerald-400">
              PAA NOC Operational v5.0
            </span>
          </div>
          <h2 className="mt-1 text-xl font-extrabold tracking-tight sm:text-2xl text-white">
            Pakistan Airports Authority IT Operations Center
          </h2>
          <p className="mt-0.5 text-xs text-slate-300">
            Real-time infrastructure monitoring, network equipment, printers & IT asset management across airport facilities.
          </p>
        </div>

        {/* Quick Action Buttons Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Airport Map Visualization Overlay Button */}
          <button
            onClick={() => {
              const el = document.getElementById('airport-map-visualization');
              if (el) {
                el.scrollIntoView({ behavior: 'smooth' });
              } else {
                setShowAirportMapModal(true);
              }
            }}
            className="flex items-center gap-2 rounded-xl border border-teal-500/50 bg-teal-500/20 px-3.5 py-2 text-xs font-extrabold text-teal-300 transition hover:bg-teal-500/30 shadow-md shrink-0"
            title="Airport Map Visualization Overlay: View asset distribution by terminal & zone"
          >
            <Compass className="h-4 w-4 text-teal-400 animate-spin-slow" />
            <span>Airport Map</span>
            <span className="rounded-full bg-teal-600 px-1.5 py-0.2 text-[10px] font-extrabold text-white">
              8 Zones
            </span>
          </button>

          {/* NOC Operations Alerts */}
          <button
            onClick={() => handleNav('noc_alerts')}
            className="flex items-center gap-2 rounded-xl border border-amber-500/40 bg-amber-500/20 px-3.5 py-2 text-xs font-bold text-amber-300 transition hover:bg-amber-500/30 shadow-sm shrink-0"
            title="Open NOC Operations Alert & Notification Center"
          >
            <Bell className="h-4 w-4 text-amber-400 animate-pulse" />
            <span>NOC Operations Alerts</span>
            {openTickets.length > 0 && (
              <span className="rounded-full bg-rose-500 px-1.5 py-0.2 text-[10px] font-extrabold text-white">
                {openTickets.length}
              </span>
            )}
          </button>

          {/* UPS & kVA Power Fleet Module Button */}
          <button
            onClick={() => handleNav('ups')}
            className="flex items-center gap-2 rounded-xl border border-amber-500/50 bg-amber-500/20 px-3.5 py-2 text-xs font-extrabold text-amber-300 transition hover:bg-amber-500/30 shadow-md shrink-0"
            title="Open UPS & kVA Power Infrastructure Fleet (AIIAP Structured LAN Details)"
          >
            <BatteryCharging className="h-4 w-4 text-amber-400" />
            <span>UPS & kVA Power Fleet</span>
            {upsCount > 0 && (
              <span className="rounded-full bg-amber-600 px-1.5 py-0.2 text-[10px] font-extrabold text-white">
                {upsCount}
              </span>
            )}
          </button>

          {/* Add Asset */}
          <button
            onClick={onOpenAddModal}
            className="flex items-center gap-2 rounded-xl bg-emerald-500 px-3.5 py-2 text-xs font-bold text-slate-950 shadow-md transition hover:bg-emerald-400 shrink-0"
          >
            <PlusCircle className="h-4 w-4" />
            <span>Add Asset</span>
          </button>

          {/* Supply HQCAA Item Received */}
          <button
            onClick={() => setShowLogisticsModal(true)}
            className="flex items-center gap-2 rounded-xl border border-purple-400/50 bg-purple-600 px-3.5 py-2 text-xs font-extrabold text-white hover:bg-purple-500 shadow-md transition shrink-0"
            title="Log receiving voucher from Logistics Supply HQCAA"
          >
            <PackageCheck className="h-4 w-4 text-purple-100" />
            <span>Supply HQCAA Item Received</span>
          </button>

          {/* Return to Supply / BR */}
          <button
            onClick={() => setShowReturnToSupplyModal(true)}
            className="flex items-center gap-2 rounded-xl border border-rose-500/40 bg-rose-500/20 px-3.5 py-2 text-xs font-extrabold text-rose-300 hover:bg-rose-500/30 shadow-md transition shrink-0"
            title="Issue Return to Supply / BR (Beyond Economical Repair) Voucher"
          >
            <RotateCcw className="h-4 w-4 text-rose-400" />
            <span>Return to Supply / BR</span>
          </button>

          {/* New Item Purchasing */}
          <button
            onClick={() => {
              setProcurementInitialData(undefined);
              setShowProcurementModal(true);
            }}
            className="flex items-center gap-2 rounded-xl border border-indigo-500/40 bg-indigo-500/20 px-3.5 py-2 text-xs font-bold text-indigo-300 transition hover:bg-indigo-500/30 shadow-sm shrink-0"
            title="New Item Purchasing: Fiber Patch Cord, UTP Patch Cord / Network Cable, RAM, SSD, Keyboard/Mouse, LED, PC, Printer, Cables, Tools"
          >
            <ShoppingCart className="h-4 w-4 text-indigo-400" />
            <span>New Item Purchasing</span>
          </button>

          {/* Local Procurement */}
          <button
            onClick={() => {
              setProcurementInitialData({
                requirementType: 'local',
                justification: 'Emergency Local Market Procurement for urgent IT operational needs & local hardware consumables.',
              });
              setShowProcurementModal(true);
            }}
            className="flex items-center gap-2 rounded-xl border border-purple-500/40 bg-purple-500/20 px-3.5 py-2 text-xs font-bold text-purple-300 transition hover:bg-purple-500/30 shadow-sm shrink-0"
            title="Local Procurement / Local Market Purchase Request"
          >
            <Store className="h-4 w-4 text-purple-400" />
            <span>Local Procurement</span>
          </button>

          {/* Official CAAF Forms Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowFormsMenu(!showFormsMenu)}
              className="flex items-center gap-1.5 rounded-xl border border-indigo-500/40 bg-indigo-500/20 px-3.5 py-2 text-xs font-bold text-indigo-300 transition hover:bg-indigo-500/30 shadow-sm shrink-0"
              title="Official PAA/CAA Forms (CAAF-001, CAAF-003, CAAF-005)"
            >
              <FileText className="h-4 w-4 text-indigo-400" />
              <span>Official Forms</span>
              <ChevronDown className="h-3.5 w-3.5 opacity-70" />
            </button>

            {showFormsMenu && (
              <div className="absolute right-0 top-11 z-50 w-72 rounded-xl border border-slate-700 bg-slate-900 p-2 shadow-2xl text-slate-100 animate-fadeIn">
                <div className="px-2 py-1 text-[10px] font-black uppercase tracking-wider text-slate-400">
                  Official PAA / CAA Forms
                </div>

                <button
                  onClick={() => {
                    setShowFormsMenu(false);
                    setProcurementInitialData(undefined);
                    setShowProcurementModal(true);
                  }}
                  className="flex w-full items-start gap-2.5 rounded-lg p-2.5 text-left hover:bg-indigo-950/60 transition group"
                >
                  <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-indigo-900 text-indigo-300">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-200 group-hover:text-indigo-400">
                      IT Procurement Authorization
                    </div>
                    <div className="text-[10px] font-mono font-bold text-indigo-400">
                      CAAF-001-XXIT-2.0
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setShowFormsMenu(false);
                    setProcurementInitialData({
                      requirementType: 'local',
                      justification: 'Emergency Local Market Procurement for urgent local IT hardware & consumable supplies.',
                    });
                    setShowProcurementModal(true);
                  }}
                  className="flex w-full items-start gap-2.5 rounded-lg p-2.5 text-left hover:bg-purple-950/60 transition group"
                >
                  <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-purple-900 text-purple-300">
                    <Store className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-200 group-hover:text-purple-400">
                      Local Market Procurement Request
                    </div>
                    <div className="text-[10px] font-mono font-bold text-purple-400">
                      CAAF-001 [Local Purchase]
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setShowFormsMenu(false);
                    setShowRequisitionModal(true);
                  }}
                  className="flex w-full items-start gap-2.5 rounded-lg p-2.5 text-left hover:bg-emerald-950/60 transition group"
                >
                  <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-emerald-900 text-emerald-300">
                    <FileSpreadsheet className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-200 group-hover:text-emerald-400">
                      Toner & Logistics Internal Demand
                    </div>
                    <div className="text-[10px] font-mono font-bold text-emerald-400">
                      CAAF-003-XXLA-1.0 [CAAF-078]
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setShowFormsMenu(false);
                    setShowLogisticsModal(true);
                  }}
                  className="flex w-full items-start gap-2.5 rounded-lg p-2.5 text-left hover:bg-purple-950/60 transition group border-t border-slate-800 mt-1 pt-2"
                >
                  <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-purple-900 text-purple-300">
                    <PackageCheck className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-200 group-hover:text-purple-400">
                      Logistics (Supply) HQCAA Item Received
                    </div>
                    <div className="text-[10px] font-mono font-bold text-purple-400">
                      CAAF-005 [Supply Inward Voucher]
                    </div>
                  </div>
                </button>

                {/* UPS Battery Replacement Form (Image 1) */}
                <button
                  onClick={() => {
                    setShowFormsMenu(false);
                    setShowBatteryReplacementModal(true);
                  }}
                  className="flex w-full items-start gap-2.5 rounded-lg p-2.5 text-left hover:bg-amber-950/60 transition group border-t border-slate-800 mt-1 pt-2"
                >
                  <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-amber-900 text-amber-300">
                    <BatteryCharging className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-200 group-hover:text-amber-400">
                      UPS Battery Replacement Form
                    </div>
                    <div className="text-[10px] font-mono font-bold text-amber-400">
                      PAA/CAA Replacement at Different Locations
                    </div>
                  </div>
                </button>

                {/* UPS Backup List of IT Equipment (Image 2) */}
                <button
                  onClick={() => {
                    setShowFormsMenu(false);
                    setShowBackupListModal(true);
                  }}
                  className="flex w-full items-start gap-2.5 rounded-lg p-2.5 text-left hover:bg-blue-950/60 transition group"
                >
                  <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-blue-900 text-blue-300">
                    <FileSpreadsheet className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-200 group-hover:text-blue-400">
                      UPS Backup List of IT Equipment
                    </div>
                    <div className="text-[10px] font-mono font-bold text-blue-400">
                      Official 22-Point Inspection & Sign-off Sheet
                    </div>
                  </div>
                </button>
              </div>
            )}
          </div>

          {/* QR Labels */}
          <button
            onClick={() => handleNav('labels')}
            className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800/80 px-3.5 py-2 text-xs font-semibold text-slate-200 transition hover:bg-slate-700 shrink-0"
          >
            <QrCode className="h-4 w-4 text-emerald-400" />
            <span>QR Labels</span>
          </button>

          {/* Reports */}
          <button
            onClick={() => handleNav('reports')}
            className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800/80 px-3.5 py-2 text-xs font-semibold text-slate-200 transition hover:bg-slate-700 shrink-0"
          >
            <FileSpreadsheet className="h-4 w-4 text-amber-400" />
            <span>Reports</span>
          </button>

          {/* Run on PC */}
          <button
            onClick={() => setShowPCWebFileModal(true)}
            className="flex items-center gap-2 rounded-xl border border-purple-500/40 bg-purple-500/20 px-3.5 py-2 text-xs font-bold text-purple-300 transition hover:bg-purple-500/30 shadow-sm shrink-0"
            title="Export / Run Web File on PC"
          >
            <Laptop className="h-4 w-4 text-purple-400" />
            <span>Run on PC</span>
          </button>

          {/* Backup */}
          <button
            onClick={exportDatabaseJson}
            className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800/80 px-3.5 py-2 text-xs font-semibold text-slate-200 transition hover:bg-slate-700 shrink-0"
            title="Backup JSON Database"
          >
            <Database className="h-4 w-4 text-blue-400" />
            <span>Backup</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Row (10 Executive Metrics Grid) */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-5">
        <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm transition hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Total Assets</span>
            <div className="rounded-lg bg-emerald-50 p-1.5 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
              <HardDrive className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-slate-900 dark:text-white">{totalCount}</span>
            <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">{activeCount} Active</span>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm transition hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Online Devices</span>
            <div className="rounded-lg bg-teal-50 p-1.5 text-teal-600 dark:bg-teal-500/10 dark:text-teal-400">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-slate-900 dark:text-white">{onlineCount}</span>
            <span className="text-[10px] font-semibold text-teal-600 dark:text-teal-400">
              {Math.round((onlineCount / (totalCount || 1)) * 100)}% Online
            </span>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm transition hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Critical Tickets</span>
            <div className="rounded-lg bg-rose-50 p-1.5 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400">
              <AlertTriangle className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-slate-900 dark:text-white">{openTickets.length}</span>
            <span className="text-[10px] font-semibold text-rose-500">Open Tickets</span>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm transition hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Warranty Expiring</span>
            <div className="rounded-lg bg-amber-50 p-1.5 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-slate-900 dark:text-white">{expiringWarrantyCount}</span>
            <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400">&lt; 90 Days</span>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm transition hover:shadow-md dark:border-slate-800 dark:bg-slate-900 col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">AD Sync / Backup</span>
            <div className="rounded-lg bg-cyan-50 p-1.5 text-cyan-600 dark:bg-cyan-500/10 dark:text-cyan-400">
              <Zap className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-base font-extrabold text-emerald-600 dark:text-emerald-400">Healthy</span>
            <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">Sync Ok</span>
          </div>
        </div>
      </div>

      {/* Notification Center System Alerts (Expiring Warranties, Low Toner Levels, Pending Maintenance) */}
      <NotificationCenter onSelectAsset={onSelectAsset} onNavigateTab={onNavigateTab} />

      {/* ANNUAL IT BUDGET ALLOCATION & USAGE OVERVIEW PANEL */}
      <div className="rounded-2xl border border-purple-200/80 bg-gradient-to-br from-white via-purple-50/20 to-slate-50 p-5 shadow-sm dark:border-purple-900/50 dark:from-slate-900 dark:via-purple-950/20 dark:to-slate-900 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-purple-100 pb-3.5 dark:border-purple-900/40">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-600 text-white shadow-md shadow-purple-500/20">
              <Coins className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-slate-900 text-base dark:text-white">
                  Annual IT Budget Allocation & Usage Overview
                </h3>
                <span className="rounded-md bg-purple-100 dark:bg-purple-950/80 px-2.5 py-0.5 text-xs font-black text-purple-700 dark:text-purple-300">
                  FY 2025–2026
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Pakistan Airports Authority (HQCAA) - IT Procurement, Local Market Demands & Maintenance Budget Breakdown
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onOpenAddModal}
              className="flex items-center gap-2 rounded-xl bg-purple-600 px-3.5 py-2 text-xs font-bold text-white shadow-sm hover:bg-purple-500 transition"
            >
              <Receipt className="h-4 w-4" />
              <span>Create Budget Requisition</span>
            </button>
          </div>
        </div>

        {/* Executive Budget KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* Card 1: Total Allocated */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Total Annual Allocated
              </span>
              <div className="rounded-lg bg-indigo-50 p-2 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
                <Banknote className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2.5">
              <div className="text-2xl font-black text-slate-900 dark:text-white">
                PKR {(annualTotalAllocated / 1000000).toFixed(2)}M
              </div>
              <div className="mt-1 flex items-center justify-between text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                <span>All Budget Heads</span>
                <span className="text-indigo-600 dark:text-indigo-400">100% Sanctioned</span>
              </div>
            </div>
          </div>

          {/* Card 2: Utilized Budget */}
          <div className="rounded-xl border border-purple-200 bg-purple-50/50 p-4 shadow-2xs dark:border-purple-900/60 dark:bg-purple-950/30">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase tracking-wider text-purple-900 dark:text-purple-300">
                Annual Utilized / Expended
              </span>
              <div className="rounded-lg bg-purple-600 p-2 text-white shadow-xs">
                <Wallet className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2.5">
              <div className="text-2xl font-black text-purple-950 dark:text-purple-200">
                PKR {(annualUtilizedToDate / 1000000).toFixed(2)}M
              </div>
              <div className="mt-1 flex items-center justify-between text-[11px] font-semibold text-purple-700 dark:text-purple-300">
                <span>PKR {annualUtilizedToDate.toLocaleString()}</span>
                <span className="font-extrabold bg-purple-200/80 dark:bg-purple-900/80 px-1.5 py-0.5 rounded text-[10px]">
                  {annualUtilizedPct}% Used
                </span>
              </div>
            </div>
          </div>

          {/* Card 3: Committed / Pending */}
          <div className="rounded-xl border border-amber-200 bg-amber-50/40 p-4 shadow-2xs dark:border-amber-900/50 dark:bg-amber-950/20">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase tracking-wider text-amber-900 dark:text-amber-300">
                Pending Requisitions
              </span>
              <div className="rounded-lg bg-amber-500 p-2 text-white shadow-xs">
                <Clock className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2.5">
              <div className="text-2xl font-black text-amber-950 dark:text-amber-200">
                PKR {(annualCommittedPending / 1000000).toFixed(2)}M
              </div>
              <div className="mt-1 flex items-center justify-between text-[11px] font-semibold text-amber-700 dark:text-amber-300">
                <span>In Procurement Pipeline</span>
                <span className="font-extrabold text-amber-600 dark:text-amber-400">
                  {Math.round((annualCommittedPending / annualTotalAllocated) * 100)}% Committed
                </span>
              </div>
            </div>
          </div>

          {/* Card 4: Remaining Available */}
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-4 shadow-2xs dark:border-emerald-900/50 dark:bg-emerald-950/20">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-900 dark:text-emerald-300">
                Remaining Available Budget
              </span>
              <div className="rounded-lg bg-emerald-600 p-2 text-white shadow-xs">
                <TrendingUp className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2.5">
              <div className="text-2xl font-black text-emerald-950 dark:text-emerald-200">
                PKR {(annualRemainingBudget / 1000000).toFixed(2)}M
              </div>
              <div className="mt-1 flex items-center justify-between text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
                <span>Unallocated Balance</span>
                <span className="font-extrabold text-emerald-600 dark:text-emerald-400">
                  {Math.round((annualRemainingBudget / annualTotalAllocated) * 100)}% Free
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Budget Heads Breakdown & Monthly Annual Spending Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 pt-2">
          {/* Left Sub-Card: Budget Head Breakdown Bars */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 dark:border-slate-800">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <Coins className="h-4 w-4 text-purple-600" />
                <span>Annual Budget Head Allocation & Utilization</span>
              </h4>
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">4 Active Budget Heads</span>
            </div>

            <div className="space-y-3.5">
              {budgetHeads.map((head) => {
                const pct = Math.round((head.utilized / head.allocated) * 100);
                return (
                  <div key={head.code} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-200">
                        <span
                          className="rounded-md px-1.5 py-0.5 text-[10px] font-black text-white"
                          style={{ backgroundColor: head.color }}
                        >
                          {head.code}
                        </span>
                        <span className="truncate max-w-[220px] sm:max-w-[300px]">{head.name}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-black text-slate-900 dark:text-white">
                          PKR {(head.utilized / 1000000).toFixed(2)}M
                        </span>
                        <span className="text-[10px] font-semibold text-slate-400 ml-1">
                          / {(head.allocated / 1000000).toFixed(1)}M
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="h-2.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden relative">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: head.color }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                      <span>Utilized: {pct}%</span>
                      <span>Remaining: PKR {((head.allocated - head.utilized) / 1000000).toFixed(2)}M</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Sub-Card: Monthly Annual Spending Chart */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 dark:border-slate-800">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-emerald-500" />
                <span>Monthly Annual Usage Spend Trend (PKR)</span>
              </h4>
              <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">FY 2025–26 YTD</span>
            </div>

            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlySpendTrend} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
                  <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#64748B' }} />
                  <YAxis
                    tick={{ fontSize: 10, fill: '#64748B' }}
                    tickFormatter={(val) => `${(val / 1000000).toFixed(1)}M`}
                  />
                  <Tooltip
                    formatter={(val: any) => [`PKR ${Number(val).toLocaleString()}`, 'Monthly Expenditure']}
                    contentStyle={{
                      backgroundColor: '#0F172A',
                      borderColor: '#334155',
                      borderRadius: '8px',
                      color: '#FFF',
                      fontSize: '11px',
                    }}
                  />
                  <Bar dataKey="spend" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Chronological Recent Activity & Audit Feed Panel */}
      <RecentActivityPanel
        onSelectAsset={onSelectAsset}
        onNavigateTab={(tab) => handleNav(tab)}
      />

      {/* AIRPORT MAP VISUALIZATION OVERLAY: ASSET DISTRIBUTION BY TERMINAL / ZONE */}
      <div id="airport-map-visualization" className="scroll-mt-6">
        <AirportMapOverlay
          onSelectAsset={onSelectAsset}
          isOverlayDefaultOpen={false}
        />
      </div>

      {/* Main Bento Layout: Left 2 Cols (Airport Facilities + Category Matrix + Charts), Right Col (Live NOC Metrics & Critical Assets) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column (2 Cols wide on desktop) */}
        <div className="space-y-6 lg:col-span-2">
          {/* Airport Operations Facilities Status Bar */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between pb-3">
              <div className="flex items-center gap-2">
                <Building className="h-4 w-4 text-emerald-500" />
                <h3 className="font-bold text-slate-900 text-sm dark:text-white">Airport Operations & Network Facilities</h3>
              </div>
              <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">8/8 Nodes Operational</span>
            </div>

            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
              {facilities.map((fac) => (
                <div
                  key={fac.id}
                  className="rounded-xl border border-slate-100 bg-slate-50 p-2.5 dark:border-slate-800 dark:bg-slate-800/60"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase text-slate-400">{fac.code}</span>
                    <span
                      className={`h-2 w-2 rounded-full ${
                        fac.status === 'Healthy' ? 'bg-emerald-500' : fac.status === 'Backup' ? 'bg-amber-500' : 'bg-rose-500'
                      }`}
                    ></span>
                  </div>
                  <div className="mt-1 font-bold text-slate-800 text-xs truncate dark:text-slate-200">{fac.name}</div>
                  <div className="mt-1 flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400">
                    <span>{fac.ipAddress}</span>
                    <span className="font-medium text-emerald-600 dark:text-emerald-400">{fac.latencyMs}ms</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Infrastructure Health Category Breakdown Matrix */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <div>
                <h3 className="font-bold text-slate-900 text-sm dark:text-white">Infrastructure Asset Category Matrix</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Detailed count of Active, Spare, Under Repair, and Faulty equipment.</p>
              </div>
              <button
                onClick={() => onNavigateTab('inventory')}
                className="flex items-center gap-1 text-xs font-bold text-emerald-600 hover:underline dark:text-emerald-400"
              >
                <span>View All</span>
                <ArrowUpRight className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50 text-[10px] uppercase text-slate-400 dark:border-slate-800 dark:bg-slate-800/50">
                    <th className="py-2.5 px-3 font-bold">Category</th>
                    <th className="py-2.5 px-2 font-bold text-center">Total</th>
                    <th className="py-2.5 px-2 font-bold text-center text-emerald-600 dark:text-emerald-400">Active</th>
                    <th className="py-2.5 px-2 font-bold text-center text-blue-600 dark:text-blue-400">Spare</th>
                    <th className="py-2.5 px-2 font-bold text-center text-amber-600 dark:text-amber-400">Repair</th>
                    <th className="py-2.5 px-2 font-bold text-center text-rose-600 dark:text-rose-400">Faulty</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {categoryMatrixData.map((cat) => (
                    <tr key={cat.name} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition">
                      <td className="py-2 px-3 font-semibold text-slate-800 dark:text-slate-200">
                        <div className="flex items-center gap-2">
                          <cat.icon className="h-3.5 w-3.5 text-slate-400" />
                          <span>{cat.name}</span>
                        </div>
                      </td>
                      <td className="py-2 px-2 text-center font-bold text-slate-900 dark:text-white">{cat.total}</td>
                      <td className="py-2 px-2 text-center font-semibold text-emerald-600 dark:text-emerald-400">{cat.active}</td>
                      <td className="py-2 px-2 text-center font-semibold text-blue-600 dark:text-blue-400">{cat.spare}</td>
                      <td className="py-2 px-2 text-center font-semibold text-amber-600 dark:text-amber-400">{cat.maintenance}</td>
                      <td className="py-2 px-2 text-center font-semibold text-rose-600 dark:text-rose-400">{cat.faulty}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Asset Utilization Overview (Recharts Data Visualization across Departments) */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3.5 dark:border-slate-800">
              <div>
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  <h3 className="font-bold text-slate-900 text-base dark:text-white">Asset Utilization Overview</h3>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Distribution of asset statuses (Active, Spare, In Repair, Faulty/Retired) across departments.
                </p>
              </div>

              {/* Status Summary Pills */}
              <div className="flex flex-wrap items-center gap-1.5">
                <div className="flex items-center gap-1.5 rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
                  <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                  <span>Active: {activeCount}</span>
                </div>
                <div className="flex items-center gap-1.5 rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60">
                  <span className="h-2 w-2 rounded-full bg-blue-500"></span>
                  <span>Spare: {spareCount}</span>
                </div>
                <div className="flex items-center gap-1.5 rounded-lg bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60">
                  <span className="h-2 w-2 rounded-full bg-amber-500"></span>
                  <span>In Repair: {repairCount}</span>
                </div>
                <div className="flex items-center gap-1.5 rounded-lg bg-rose-50 px-2.5 py-1 text-xs font-bold text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60">
                  <span className="h-2 w-2 rounded-full bg-rose-500"></span>
                  <span>Faulty: {faultyCount}</span>
                </div>
              </div>
            </div>

            {/* Recharts Stacked Bar Chart */}
            <div className="h-64 w-full pt-1">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={departmentUtilizationData}
                  margin={{ top: 10, right: 15, left: -10, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis
                    dataKey="department"
                    tick={{ fontSize: 10, fill: '#64748B' }}
                    angle={-15}
                    textAnchor="end"
                    interval={0}
                  />
                  <YAxis tick={{ fontSize: 10, fill: '#64748B' }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0F172A',
                      borderColor: '#334155',
                      color: '#F8FAFC',
                      borderRadius: '12px',
                      fontSize: '12px',
                      boxShadow: '0 10px 25px -5px rgba(0,0,0,0.4)',
                    }}
                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                  />
                  <Legend
                    verticalAlign="top"
                    align="right"
                    wrapperStyle={{ paddingBottom: '12px', fontSize: '11px', fontWeight: 'bold' }}
                  />
                  <Bar dataKey="Active" name="Active Assets" stackId="utilization" fill="#10B981" />
                  <Bar dataKey="Spare" name="Spare Inventory" stackId="utilization" fill="#3B82F6" />
                  <Bar dataKey="In Repair" name="In Repair" stackId="utilization" fill="#F59E0B" />
                  <Bar dataKey="Faulty" name="Faulty / Retired" stackId="utilization" fill="#EF4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Department Active Utilization Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
              {departmentUtilizationData.slice(0, 4).map((d) => (
                <div key={d.department} className="rounded-xl border border-slate-100 bg-slate-50 p-2.5 dark:border-slate-800 dark:bg-slate-800/50">
                  <div className="text-[11px] font-bold text-slate-700 dark:text-slate-300 truncate" title={d.department}>{d.department}</div>
                  <div className="mt-1 flex items-baseline justify-between">
                    <span className="text-xs font-black text-slate-900 dark:text-white">{d.total} Assets</span>
                    <span className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400">{d.activeRate}% Active</span>
                  </div>
                  <div className="mt-1 h-1.5 w-full rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full transition-all duration-500" style={{ width: `${d.activeRate}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Analytical Charts Row (Department Distribution & Status breakdown) */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <h4 className="font-bold text-slate-900 text-xs dark:text-white mb-2">Department-Wise Inventory</h4>
              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={deptDistributionData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis dataKey="department" tick={{ fontSize: 9 }} />
                    <YAxis tick={{ fontSize: 9 }} />
                    <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '8px' }} />
                    <Bar dataKey="count" fill="#10B981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <h4 className="font-bold text-slate-900 text-xs dark:text-white mb-2">Device Status Breakdown</h4>
              <div className="h-48 w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={statusPieData} cx="50%" cy="50%" innerRadius={35} outerRadius={60} paddingAngle={4} dataKey="value">
                      {statusPieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '8px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-1 flex flex-wrap justify-center gap-3 text-[10px]">
                {statusPieData.map((s) => (
                  <div key={s.name} className="flex items-center gap-1 font-medium">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: s.color }}></span>
                    <span className="text-slate-600 dark:text-slate-300">
                      {s.name}: {s.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: NOC Live Hardware Metrics & Critical Asset Review */}
        <div className="space-y-6">
          {/* NOC Live Telemetry Gauge Card */}
          <div className="rounded-2xl border border-slate-200 bg-gradient-to-b from-slate-900 to-slate-950 p-4 text-white shadow-md dark:border-slate-800">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-emerald-400" />
                <h3 className="font-bold text-sm text-white">NOC Live Infrastructure Metrics</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowReturnToSupplyModal(true)}
                  className="flex items-center gap-1 rounded-lg border border-rose-500/40 bg-rose-500/20 px-2 py-0.5 text-[10px] font-bold text-rose-300 hover:bg-rose-500/30 transition"
                  title="Issue Return to Supply / BR Voucher"
                >
                  <RotateCcw className="h-3 w-3" />
                  <span>Return to Supply / BR</span>
                </button>
                <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-400">Live</span>
              </div>
            </div>

            <div className="mt-4 space-y-3.5 text-xs">
              <div>
                <div className="flex justify-between text-[11px] font-semibold text-slate-300 mb-1">
                  <span>Cisco Core Switch Catalyst 9500 CPU</span>
                  <span className="text-emerald-400 font-mono">14% Load</span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-800">
                  <div className="h-2 rounded-full bg-emerald-400" style={{ width: '14%' }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[11px] font-semibold text-slate-300 mb-1">
                  <span>Main Data Center Memory Usage</span>
                  <span className="text-emerald-400 font-mono">38% Used (48.6 GB)</span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-800">
                  <div className="h-2 rounded-full bg-emerald-400" style={{ width: '38%' }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[11px] font-semibold text-slate-300 mb-1">
                  <span>Primary WAN Fiber Bandwidth</span>
                  <span className="text-cyan-400 font-mono">1.2 Gbps / 2 Gbps</span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-800">
                  <div className="h-2 rounded-full bg-cyan-400" style={{ width: '60%' }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[11px] font-semibold text-slate-300 mb-1">
                  <span>Data Center Climate / Temp</span>
                  <span className="text-emerald-400 font-mono">21.4°C (Normal)</span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-800">
                  <div className="h-2 rounded-full bg-emerald-400" style={{ width: '25%' }}></div>
                </div>
              </div>

              <div
                onClick={() => handleNav('ups')}
                className="cursor-pointer group hover:bg-slate-800/60 p-1.5 -mx-1.5 rounded-lg transition"
                title="Open UPS & kVA Infrastructure View"
              >
                <div className="flex justify-between text-[11px] font-semibold text-slate-300 mb-1">
                  <span className="group-hover:text-amber-300 flex items-center gap-1">
                    <span>UPS Emergency Battery Health (AIIAP Fleet)</span>
                    <ChevronRight className="h-3 w-3 opacity-60" />
                  </span>
                  <span className="text-emerald-400 font-mono">100% Online</span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-800">
                  <div className="h-2 rounded-full bg-emerald-400" style={{ width: '100%' }}></div>
                </div>
              </div>
            </div>
          </div>

          {/* Dedicated Pending & Scheduled Maintenance Feed Card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="rounded-lg bg-emerald-500/10 p-1.5 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
                  <Wrench className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm dark:text-white">
                    Pending Maintenance
                  </h3>
                  <p className="text-[10px] text-slate-400">
                    Upcoming hardware servicing & vendor tasks
                  </p>
                </div>
              </div>
              <button
                onClick={() => onNavigateTab('maintenance')}
                className="flex items-center gap-1 text-xs font-bold text-emerald-600 hover:text-emerald-500 dark:text-emerald-400 transition"
                title="Open Maintenance Module"
              >
                <span>Module</span>
                <ArrowUpRight className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="mt-3 space-y-2.5">
              {maintenanceRecords.slice(0, 4).map((m, idx) => {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const isUpcoming = new Date(m.date) >= today;
                const matchedAsset = activeAssets.find((a) => a.id === m.assetId);

                return (
                  <div
                    key={`${m.id}-${m.assetId}-${idx}`}
                    className="group rounded-xl border border-slate-100 bg-slate-50 p-2.5 transition hover:border-emerald-300 hover:bg-white dark:border-slate-800 dark:bg-slate-800/60 dark:hover:bg-slate-800"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                        {m.assetId}
                      </span>
                      <span
                        className={`rounded px-1.5 py-0.5 text-[9px] font-extrabold uppercase ${
                          isUpcoming
                            ? 'bg-amber-500/10 text-amber-600 border border-amber-500/20 dark:text-amber-400'
                            : 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 dark:text-emerald-400'
                        }`}
                      >
                        {isUpcoming ? 'Pending / Scheduled' : 'Logged'}
                      </span>
                    </div>

                    <div
                      onClick={() => matchedAsset && onSelectAsset(matchedAsset)}
                      className="mt-1 font-bold text-slate-800 text-xs truncate dark:text-slate-200 cursor-pointer hover:text-emerald-600 dark:hover:text-emerald-400"
                      title={m.deviceName}
                    >
                      {m.deviceName}
                    </div>

                    <p className="mt-0.5 text-[11px] text-slate-500 line-clamp-1 dark:text-slate-400">
                      {m.description}
                    </p>

                    <div className="mt-2 flex items-center justify-between border-t border-slate-200/60 pt-2 text-[10px] text-slate-500 dark:border-slate-700/60 dark:text-slate-400">
                      <div className="flex items-center gap-1 font-mono">
                        <Calendar className="h-3 w-3 text-slate-400" />
                        <span>{m.date}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <UserCheck className="h-3 w-3 text-slate-400" />
                        <span className="font-medium text-slate-700 dark:text-slate-300 truncate max-w-[120px]">
                          {m.engineer}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 text-center">
              <button
                onClick={() => onNavigateTab('maintenance')}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 transition flex items-center justify-center gap-1.5"
              >
                <Wrench className="h-3.5 w-3.5 text-emerald-500" />
                <span>Quick Update & Full Schedule ({maintenanceRecords.length})</span>
              </button>
            </div>
          </div>

          {/* Critical Infrastructure Assets Review */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <h3 className="font-bold text-slate-900 text-sm dark:text-white">Critical Assets Review</h3>
              <button
                onClick={() => onNavigateTab('inventory')}
                className="text-xs font-bold text-emerald-600 hover:underline dark:text-emerald-400"
              >
                All Assets
              </button>
            </div>

            <div className="mt-3 space-y-2.5">
              {activeAssets.slice(0, 5).map((asset, idx) => (
                <div
                  key={`${asset.id}-${idx}`}
                  onClick={() => onSelectAsset(asset)}
                  className="group flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 p-2.5 transition hover:border-emerald-300 hover:bg-white dark:border-slate-800 dark:bg-slate-800/60 dark:hover:bg-slate-800 cursor-pointer"
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 font-bold text-[10px]">
                      {asset.category.slice(0, 3).toUpperCase()}
                    </div>
                    <div className="overflow-hidden">
                      <div className="font-bold text-slate-800 text-xs truncate group-hover:text-emerald-600 dark:text-slate-200 dark:group-hover:text-emerald-400">
                        {asset.name}
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-slate-500 dark:text-slate-400">
                        <span className="font-mono">{asset.id}</span>
                        <span>•</span>
                        <span>{asset.department}</span>
                      </div>
                    </div>
                  </div>

                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
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
              ))}
            </div>
          </div>

          {/* Quick Support Tickets Panel */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Wrench className="h-4 w-4 text-rose-500" />
                <h3 className="font-bold text-slate-900 text-sm dark:text-white">Active Support Tickets</h3>
              </div>
              <button
                onClick={() => onNavigateTab('issues')}
                className="text-xs font-bold text-emerald-600 hover:underline dark:text-emerald-400"
              >
                Ticket Portal
              </button>
            </div>

            <div className="mt-3 space-y-2">
              {openTickets.slice(0, 3).map((t, idx) => (
                <div key={`${t.ticketNumber}-${idx}`} className="rounded-xl border border-slate-100 bg-slate-50 p-2.5 text-xs dark:border-slate-800 dark:bg-slate-800/60">
                  <div className="flex items-center justify-between font-bold text-slate-800 dark:text-slate-200">
                    <span>{t.ticketNumber}</span>
                    <span
                      className={`px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase ${
                        t.priority === 'Critical'
                          ? 'bg-rose-500 text-white'
                          : t.priority === 'High'
                          ? 'bg-amber-500 text-white'
                          : 'bg-blue-500 text-white'
                      }`}
                    >
                      {t.priority}
                    </span>
                  </div>
                  <p className="mt-1 text-slate-600 line-clamp-1 dark:text-slate-300">{t.description}</p>
                  <div className="mt-1.5 flex items-center justify-between text-[10px] text-slate-400">
                    <span>Dept: {t.department}</span>
                    <span>Engr: {t.assignedEngineer}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Modal Dialogs Triggered from Dashboard Banner */}
      <ProcurementFormModal
        isOpen={showProcurementModal}
        onClose={() => setShowProcurementModal(false)}
        initialData={procurementInitialData}
      />

      <InternalRequisitionFormModal
        isOpen={showRequisitionModal}
        onClose={() => setShowRequisitionModal(false)}
      />

      <LogisticsReceivingModal
        isOpen={showLogisticsModal}
        onClose={() => setShowLogisticsModal(false)}
      />

      <PCWebFileModal
        isOpen={showPCWebFileModal}
        onClose={() => setShowPCWebFileModal(false)}
      />

      <ReturnToSupplyBRModal
        isOpen={showReturnToSupplyModal}
        onClose={() => setShowReturnToSupplyModal(false)}
      />

      {/* UPS Battery Replacement Form Modal (Image 1) */}
      {showBatteryReplacementModal && (
        <UPSBatteryReplacementModal
          onClose={() => setShowBatteryReplacementModal(false)}
        />
      )}

      {/* UPS Backup List of IT Equipment Modal (Image 2) */}
      {showBackupListModal && (
        <UPSBackupListModal
          onClose={() => setShowBackupListModal(false)}
        />
      )}

      {/* Airport Map Fullscreen Overlay Modal */}
      {showAirportMapModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-2 sm:p-4 md:p-6 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-7xl max-h-[96vh] overflow-y-auto rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl">
            <div className="absolute top-4 right-4 z-20">
              <button
                type="button"
                onClick={() => setShowAirportMapModal(false)}
                className="flex items-center gap-1.5 rounded-xl bg-slate-800/90 border border-slate-700 px-3 py-1.5 text-xs font-bold text-slate-200 hover:bg-slate-700 hover:text-white transition shadow-lg"
                title="Close Map Overlay"
              >
                <X className="h-4 w-4" />
                <span>Close Overlay</span>
              </button>
            </div>
            <AirportMapOverlay
              onSelectAsset={(asset) => {
                setShowAirportMapModal(false);
                onSelectAsset(asset);
              }}
              isOverlayDefaultOpen={false}
            />
          </div>
        </div>
      )}
    </div>
  );
};
