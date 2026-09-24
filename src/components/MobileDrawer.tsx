import React from 'react';
import {
  X,
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
  Bell,
  BatteryCharging,
  RefreshCw,
  LogOut,
  User,
  Plus,
  Zap,
  Smartphone,
  Shield,
  Monitor,
  Database,
  Moon,
  Sun,
  PenLine,
  Eye,
  Compass,
} from 'lucide-react';
import { useInventory } from '../context/InventoryContext';
import { getUPSBatteryAlerts } from '../utils/upsBatteryAlerts';

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: string;
  onSelectTab: (tab: string) => void;
  onOpenAddModal: () => void;
  onOpenSettings: () => void;
  onOpenMobileConnect: () => void;
  onOpenBarcodeModal: () => void;
}

export const MobileDrawer: React.FC<MobileDrawerProps> = ({
  isOpen,
  onClose,
  activeTab,
  onSelectTab,
  onOpenAddModal,
  onOpenSettings,
  onOpenMobileConnect,
  onOpenBarcodeModal,
}) => {
  const {
    assets,
    tickets,
    gatePassRecords,
    userRole,
    currentUser,
    isLoggedIn,
    logout,
    settings,
    toggleTheme,
    dbStatus,
  } = useInventory();

  if (!isOpen) return null;

  const activeAssets = assets.filter((a) => !a.isRemoved);
  const activeAssetsCount = activeAssets.length;
  const printerCount = activeAssets.filter((a) => a.category === 'Printer' || a.category === 'Scanner').length;
  const networkCount = activeAssets.filter((a) =>
    ['Network Switch', 'Core Switch', 'Distribution Switch', 'Access Switch', 'Router', 'Firewall', 'Access Point', 'Server'].includes(a.category)
  ).length;
  const upsCount = activeAssets.filter((a) => a.category === 'UPS' || a.upsSpecs !== undefined).length;
  const openTicketsCount = tickets.filter((t) => t.status !== 'Closed').length;
  const activeGatePassesCount = gatePassRecords.filter((gp) => gp.status === 'Out for Market Repair').length;
  const removedCount = assets.filter((a) => a.isRemoved).length;

  const now = new Date();
  const ninetyDays = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
  const expiringWarrantyCount = activeAssets.filter((a) => a.warrantyExpiry && new Date(a.warrantyExpiry) <= ninetyDays).length;
  const lowTonerCount = activeAssets.filter((a) => a.category === 'Printer' && a.printerSpecs?.tonerLevel !== undefined && a.printerSpecs.tonerLevel <= 25).length;
  const upsBatteryAlerts = getUPSBatteryAlerts(activeAssets, now, 30);
  const upsBatteryDueCount = upsBatteryAlerts.length;
  const totalNocAlertsCount = expiringWarrantyCount + lowTonerCount + openTicketsCount + upsBatteryDueCount;

  const navItems = [
    {
      id: 'dashboard',
      label: 'NOC Dashboard',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'airport_map',
      label: 'Airport Map',
      icon: Compass,
      badge: '8 Zones',
      badgeColor: 'bg-teal-600 text-white font-bold',
    },
    {
      id: 'noc_alerts',
      label: 'NOC Operations Alerts',
      icon: Bell,
      badge: totalNocAlertsCount > 0 ? totalNocAlertsCount : null,
      badgeColor: 'bg-amber-500 text-white',
    },
    {
      id: 'inventory',
      label: 'Asset Directory',
      icon: HardDrive,
      badge: activeAssetsCount,
    },
    {
      id: 'printers',
      label: 'Printers & Scanners',
      icon: Printer,
      badge: printerCount,
    },
    {
      id: 'network',
      label: 'Network & Infrastructure',
      icon: Network,
      badge: networkCount,
    },
    {
      id: 'ups',
      label: 'UPS & kVA Infrastructure',
      icon: BatteryCharging,
      badge: upsBatteryDueCount > 0 ? `${upsCount} (${upsBatteryDueCount} due)` : upsCount > 0 ? upsCount : null,
      badgeColor: upsBatteryDueCount > 0 ? 'bg-amber-600 text-white font-extrabold' : 'bg-amber-600 text-white',
    },
    {
      id: 'issues',
      label: 'Issue Tickets & Griefs',
      icon: Ticket,
      badge: openTicketsCount > 0 ? openTicketsCount : null,
      badgeColor: 'bg-rose-500 text-white',
    },
    {
      id: 'maintenance',
      label: 'Maintenance History',
      icon: Wrench,
      badge: null,
    },
    {
      id: 'gatepass',
      label: 'Market Repair Gate Pass',
      icon: ShieldCheck,
      badge: activeGatePassesCount > 0 ? `${activeGatePassesCount} Out` : null,
      badgeColor: 'bg-indigo-500 text-white',
    },
    {
      id: 'removed',
      label: 'Soft Removed Archive',
      icon: Trash2,
      badge: removedCount > 0 ? removedCount : null,
    },
    {
      id: 'reports',
      label: 'Reports & Audit',
      icon: FileBarChart,
      badge: null,
    },
    {
      id: 'labels',
      label: 'QR / Barcode Generator',
      icon: QrCode,
      badge: null,
    },
    {
      id: 'adsync',
      label: 'Active Directory Sync',
      icon: RefreshCw,
      badge: '6 Delta',
      badgeColor: 'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-400/10 dark:text-emerald-400',
    },
    {
      id: 'settings',
      label: 'System Settings',
      icon: Settings,
      badge: null,
    },
  ];

  const handleSelect = (tabId: string) => {
    onSelectTab(tabId);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex md:hidden animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Drawer Body */}
      <div className="relative flex w-5/6 max-w-sm flex-1 flex-col bg-white dark:bg-slate-900 shadow-2xl border-r border-slate-200 dark:border-slate-800 h-full overflow-hidden">
        {/* Top Drawer Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-600 via-teal-700 to-cyan-800 text-white shadow-md shadow-emerald-500/20">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-slate-900 dark:text-white leading-tight">
                PAA Sentinel v5.0
              </h2>
              <span className="text-[10px] text-slate-500 dark:text-slate-400">
                {settings.airportName}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Quick Mobile Action Bar */}
        <div className="grid grid-cols-3 gap-2 p-3 border-b border-slate-100 dark:border-slate-800/60 bg-slate-50/70 dark:bg-slate-800/30">
          <button
            onClick={() => {
              onOpenAddModal();
              onClose();
            }}
            className="flex flex-col items-center justify-center gap-1 rounded-xl bg-emerald-600 p-2 text-white shadow-xs hover:bg-emerald-500 transition min-h-[52px]"
          >
            <Plus className="h-4 w-4" />
            <span className="text-[10px] font-bold">+ Add Asset</span>
          </button>

          <button
            onClick={() => {
              onOpenMobileConnect();
              onClose();
            }}
            className="flex flex-col items-center justify-center gap-1 rounded-xl border border-emerald-300 bg-white p-2 text-emerald-800 dark:border-emerald-800 dark:bg-slate-800 dark:text-emerald-300 shadow-xs transition min-h-[52px]"
          >
            <Smartphone className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <span className="text-[10px] font-bold">QR / Phone</span>
          </button>

          <button
            onClick={toggleTheme}
            className="flex flex-col items-center justify-center gap-1 rounded-xl border border-slate-200 bg-white p-2 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 shadow-xs transition min-h-[52px]"
          >
            {settings.theme === 'dark' ? (
              <>
                <Sun className="h-4 w-4 text-amber-400" />
                <span className="text-[10px] font-bold">Light</span>
              </>
            ) : (
              <>
                <Moon className="h-4 w-4 text-slate-700" />
                <span className="text-[10px] font-bold">Dark</span>
              </>
            )}
          </button>
        </div>

        {/* Scrollable Nav List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            System Modules
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleSelect(item.id)}
                className={`flex w-full items-center justify-between rounded-xl px-3 py-3 text-xs font-semibold transition min-h-[44px] ${
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
        </div>

        {/* User Session & Status Footer */}
        <div className="border-t border-slate-200 bg-slate-50 p-3.5 dark:border-slate-800 dark:bg-slate-800/80">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-xl text-xs font-black text-white shadow-xs ${
                  userRole === 'Administrator'
                    ? 'bg-rose-600'
                    : userRole === 'Technician'
                    ? 'bg-emerald-600'
                    : 'bg-sky-600'
                }`}
              >
                {(currentUser?.username || userRole).charAt(0).toUpperCase()}
              </div>
              <div className="text-left">
                <div className="text-xs font-bold text-slate-900 dark:text-white">
                  {currentUser?.username || userRole}
                </div>
                <div className="flex items-center gap-1 text-[10px] text-slate-500 dark:text-slate-400">
                  {userRole === 'Administrator' || userRole === 'Technician' ? (
                    <span className="flex items-center gap-0.5 text-emerald-600 dark:text-emerald-400 font-bold">
                      <PenLine className="h-2.5 w-2.5" /> Write Mode
                    </span>
                  ) : (
                    <span className="flex items-center gap-0.5 text-sky-600 dark:text-sky-400 font-bold">
                      <Eye className="h-2.5 w-2.5" /> Read-Only
                    </span>
                  )}
                </div>
              </div>
            </div>

            {isLoggedIn ? (
              <button
                onClick={() => {
                  logout();
                  onClose();
                }}
                className="flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-[11px] font-bold text-rose-700 hover:bg-rose-100 dark:border-rose-900/50 dark:bg-rose-950/60 dark:text-rose-400 transition"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Exit</span>
              </button>
            ) : null}
          </div>

          <div className="mt-2.5 flex items-center justify-between border-t border-slate-200/60 dark:border-slate-700/60 pt-2 text-[10px] text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-1">
              <span className={`h-2 w-2 rounded-full ${dbStatus.isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'}`} />
              <span>{dbStatus.isConnected ? 'MongoDB Active' : 'Local Storage'}</span>
            </div>
            <span className="font-mono">v5.0 Mobile Ready</span>
          </div>
        </div>
      </div>
    </div>
  );
};
