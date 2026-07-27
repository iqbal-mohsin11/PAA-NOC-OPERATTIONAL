import React from 'react';
import {
  LayoutDashboard,
  HardDrive,
  Printer,
  Network,
  Ticket,
  Wrench,
  ShieldCheck,
  Trash2,
  FileBarChart,
  QrCode,
  Settings,
  Server,
  Building2,
  RefreshCw,
  Bell,
  LogOut,
  LogIn,
  User,
} from 'lucide-react';
import { useInventory } from '../context/InventoryContext';

export type ActiveTab =
  | 'dashboard'
  | 'noc_alerts'
  | 'inventory'
  | 'printers'
  | 'network'
  | 'issues'
  | 'maintenance'
  | 'gatepass'
  | 'removed'
  | 'reports'
  | 'labels'
  | 'adsync'
  | 'settings';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const { assets, tickets, gatePassRecords, userRole, isLoggedIn, logout } = useInventory();

  const activeAssets = assets.filter((a) => !a.isRemoved);
  const activeAssetsCount = activeAssets.length;
  const printerCount = activeAssets.filter((a) => a.category === 'Printer' || a.category === 'Scanner').length;
  const networkCount = activeAssets.filter((a) =>
    ['Network Switch', 'Core Switch', 'Distribution Switch', 'Access Switch', 'Router', 'Firewall', 'Access Point', 'Server'].includes(a.category)
  ).length;
  const openTicketsCount = tickets.filter((t) => t.status !== 'Closed').length;
  const activeGatePassesCount = gatePassRecords.filter((gp) => gp.status === 'Out for Market Repair').length;
  const removedCount = assets.filter((a) => a.isRemoved).length;

  // NOC Alerts count
  const now = new Date();
  const ninetyDays = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
  const expiringWarrantyCount = activeAssets.filter((a) => a.warrantyExpiry && new Date(a.warrantyExpiry) <= ninetyDays).length;
  const lowTonerCount = activeAssets.filter((a) => a.category === 'Printer' && a.printerSpecs?.tonerLevel !== undefined && a.printerSpecs.tonerLevel <= 25).length;
  const totalNocAlertsCount = expiringWarrantyCount + lowTonerCount + openTicketsCount;

  const navItems = [
    {
      id: 'dashboard' as ActiveTab,
      label: 'NOC Dashboard',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'noc_alerts' as ActiveTab,
      label: 'NOC Operations Alerts',
      icon: Bell,
      badge: totalNocAlertsCount > 0 ? totalNocAlertsCount : null,
      badgeColor: 'bg-amber-500 text-white',
    },
    {
      id: 'inventory' as ActiveTab,
      label: 'Asset Directory',
      icon: HardDrive,
      badge: activeAssetsCount,
    },
    {
      id: 'printers' as ActiveTab,
      label: 'Printers & Scanners',
      icon: Printer,
      badge: printerCount,
    },
    {
      id: 'network' as ActiveTab,
      label: 'Network & Infrastructure',
      icon: Network,
      badge: networkCount,
    },
    {
      id: 'issues' as ActiveTab,
      label: 'Issue Tickets',
      icon: Ticket,
      badge: openTicketsCount > 0 ? openTicketsCount : null,
      badgeColor: 'bg-rose-500 text-white',
    },
    {
      id: 'maintenance' as ActiveTab,
      label: 'Maintenance History',
      icon: Wrench,
      badge: null,
    },
    {
      id: 'gatepass' as ActiveTab,
      label: 'Market Repair Gate Pass',
      icon: ShieldCheck,
      badge: activeGatePassesCount > 0 ? `${activeGatePassesCount} Out` : null,
      badgeColor: 'bg-indigo-500 text-white',
    },
    {
      id: 'removed' as ActiveTab,
      label: 'Soft Removed Archive',
      icon: Trash2,
      badge: removedCount > 0 ? removedCount : null,
    },
    {
      id: 'reports' as ActiveTab,
      label: 'Reports & Audit',
      icon: FileBarChart,
      badge: null,
    },
    {
      id: 'labels' as ActiveTab,
      label: 'QR / Barcode Generator',
      icon: QrCode,
      badge: null,
    },
    {
      id: 'adsync' as ActiveTab,
      label: 'Active Directory Sync',
      icon: RefreshCw,
      badge: '6 Delta',
      badgeColor: 'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-400/10 dark:text-emerald-400',
    },
    {
      id: 'settings' as ActiveTab,
      label: 'System Settings',
      icon: Settings,
      badge: null,
    },
  ];

  return (
    <aside className="w-64 flex-shrink-0 border-r border-slate-200 bg-white p-3 transition-colors dark:border-slate-800 dark:bg-slate-900 hidden md:block">
      <div className="mb-3 px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
        Navigation Modules
      </div>
      <nav className="space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-xs font-semibold transition ${
                isActive
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20 dark:bg-emerald-500'
                  : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-slate-500 dark:text-slate-400'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge !== null && (
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                    item.badgeColor
                      ? item.badgeColor
                      : isActive
                      ? 'bg-emerald-700/50 text-white'
                      : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* User Session Card */}
      <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs dark:border-slate-800 dark:bg-slate-800/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`flex h-7 w-7 items-center justify-center rounded-lg text-white font-bold text-xs ${
              isLoggedIn ? 'bg-emerald-600' : 'bg-slate-500'
            }`}>
              <User className="h-4 w-4" />
            </div>
            <div>
              <div className="font-bold text-slate-800 dark:text-slate-200 leading-none text-[11px]">
                {isLoggedIn ? userRole : 'Logged Out'}
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                {isLoggedIn ? 'Active Session' : 'Read-Only Mode'}
              </div>
            </div>
          </div>

          {isLoggedIn && (
            <button
              onClick={logout}
              className="flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2 py-1 text-[10px] font-bold text-rose-700 hover:bg-rose-100 dark:border-rose-900/50 dark:bg-rose-950/60 dark:text-rose-400 transition"
              title="Log Out"
            >
              <LogOut className="h-3 w-3" />
              <span>Exit</span>
            </button>
          )}
        </div>
      </div>

      <div className="mt-3 rounded-xl border border-slate-100 bg-slate-50 p-3 text-xs dark:border-slate-800 dark:bg-slate-800/50">
        <div className="flex items-center gap-2 font-semibold text-slate-800 dark:text-slate-200">
          <Server className="h-4 w-4 text-emerald-500" />
          <span>PAA NOC Operations</span>
        </div>
        <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
          Live monitoring active. AD Sync status healthy.
        </p>
        <div className="mt-2.5 flex items-center gap-1.5 text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>PAA Core v5.0 Operational</span>
        </div>
      </div>
    </aside>
  );
};
