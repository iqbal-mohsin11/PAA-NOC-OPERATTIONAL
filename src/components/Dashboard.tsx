import React from 'react';
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
} from 'lucide-react';
import { AssetItem, DeviceCategory } from '../types/inventory';
import { NotificationCenter } from './NotificationCenter';

interface DashboardProps {
  onNavigateTab: (tab: any) => void;
  onOpenAddModal: () => void;
  onOpenExcelImport: () => void;
  onSelectAsset: (asset: AssetItem) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  onNavigateTab,
  onOpenAddModal,
  onOpenExcelImport,
  onSelectAsset,
}) => {
  const { assets, tickets, facilities, maintenanceRecords, exportDatabaseJson, allDepartments, allCategories } = useInventory();

  // Calculate metrics
  const activeAssets = assets.filter((a) => !a.isRemoved);
  const totalCount = activeAssets.length;
  const activeCount = activeAssets.filter((a) => a.status === 'Active').length;
  const spareCount = activeAssets.filter((a) => a.status === 'Spare').length;
  const repairCount = activeAssets.filter((a) => a.status === 'Under Repair').length;
  const faultyCount = activeAssets.filter((a) => a.status === 'Faulty').length;

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

  // Status Pie Data
  const statusPieData = [
    { name: 'Active', value: activeCount, color: '#10B981' },
    { name: 'Spare', value: spareCount, color: '#3B82F6' },
    { name: 'Under Repair', value: repairCount, color: '#F59E0B' },
    { name: 'Faulty', value: faultyCount, color: '#EF4444' },
  ].filter((d) => d.value > 0);

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

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => onNavigateTab('noc_alerts')}
            className="flex items-center gap-2 rounded-xl border border-amber-500/40 bg-amber-500/20 px-3.5 py-2 text-xs font-bold text-amber-300 transition hover:bg-amber-500/30 shadow-sm"
          >
            <Bell className="h-4 w-4 text-amber-400 animate-pulse" />
            <span>NOC Operations Alerts</span>
          </button>
          <button
            onClick={onOpenAddModal}
            className="flex items-center gap-2 rounded-xl bg-emerald-500 px-3.5 py-2 text-xs font-bold text-slate-950 shadow-md transition hover:bg-emerald-400"
          >
            <PlusCircle className="h-4 w-4" />
            <span>Add Asset</span>
          </button>
          <button
            onClick={() => onNavigateTab('labels')}
            className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800/80 px-3 py-2 text-xs font-semibold text-slate-200 transition hover:bg-slate-700"
          >
            <QrCode className="h-4 w-4 text-emerald-400" />
            <span>QR Labels</span>
          </button>
          <button
            onClick={() => onNavigateTab('reports')}
            className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800/80 px-3 py-2 text-xs font-semibold text-slate-200 transition hover:bg-slate-700"
          >
            <FileSpreadsheet className="h-4 w-4 text-amber-400" />
            <span>Reports</span>
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
              <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-400">Live</span>
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

              <div>
                <div className="flex justify-between text-[11px] font-semibold text-slate-300 mb-1">
                  <span>UPS Emergency Battery Health</span>
                  <span className="text-emerald-400 font-mono">100% Fully Charged</span>
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
    </div>
  );
};
