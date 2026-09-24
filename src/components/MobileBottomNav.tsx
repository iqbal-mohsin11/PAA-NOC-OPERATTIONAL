import React from 'react';
import {
  LayoutDashboard,
  HardDrive,
  Printer,
  Bell,
  Menu,
  Ticket,
} from 'lucide-react';
import { useInventory } from '../context/InventoryContext';
import { getUPSBatteryAlerts } from '../utils/upsBatteryAlerts';

interface MobileBottomNavProps {
  activeTab: string;
  onSelectTab: (tab: string) => void;
  onToggleDrawer: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  onSelectTab,
  onToggleDrawer,
}) => {
  const { assets, tickets } = useInventory();

  const activeAssets = assets.filter((a) => !a.isRemoved);
  const printerAssets = activeAssets.filter((a) => a.category === 'Printer' || a.category === 'Scanner');
  const openTicketsCount = tickets.filter((t) => t.status !== 'Closed').length;

  const now = new Date();
  const ninetyDays = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
  const expiringWarrantyCount = activeAssets.filter((a) => a.warrantyExpiry && new Date(a.warrantyExpiry) <= ninetyDays).length;
  const lowTonerCount = activeAssets.filter((a) => a.category === 'Printer' && a.printerSpecs?.tonerLevel !== undefined && a.printerSpecs.tonerLevel <= 25).length;
  const upsBatteryAlerts = getUPSBatteryAlerts(activeAssets, now, 30);
  const upsBatteryDueCount = upsBatteryAlerts.length;
  const totalNocAlertsCount = expiringWarrantyCount + lowTonerCount + openTicketsCount + upsBatteryDueCount;

  // Active griefs on printers
  const printerGriefCount = tickets.filter(
    (t) => (t.status === 'Open' || t.status === 'Working' || t.status === 'Pending') &&
      printerAssets.some((p) => p.id === t.assetId)
  ).length;

  const tabs = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'inventory',
      label: 'Assets',
      icon: HardDrive,
      badge: activeAssets.length,
      badgeColor: 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
    },
    {
      id: 'printers',
      label: 'Printers',
      icon: Printer,
      badge: printerGriefCount > 0 ? `${printerGriefCount}!` : null,
      badgeColor: 'bg-rose-500 text-white',
    },
    {
      id: 'noc_alerts',
      label: 'NOC / Tickets',
      icon: Bell,
      badge: totalNocAlertsCount > 0 ? totalNocAlertsCount : null,
      badgeColor: 'bg-amber-500 text-white',
    },
  ];

  return (
    <nav
      aria-label="Mobile Navigation"
      className="fixed bottom-0 left-0 right-0 z-40 flex md:hidden items-center justify-around border-t border-slate-200 bg-white/95 px-1 py-1.5 backdrop-blur shadow-[0_-4px_16px_rgba(0,0,0,0.06)] dark:border-slate-800 dark:bg-slate-900/95 dark:shadow-[0_-4px_16px_rgba(0,0,0,0.3)] select-none safe-area-pb"
    >
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id || (tab.id === 'inventory' && activeTab === 'assets');
        return (
          <button
            key={tab.id}
            onClick={() => onSelectTab(tab.id)}
            className={`relative flex flex-1 flex-col items-center justify-center py-1 text-center transition min-h-[48px] ${
              isActive
                ? 'text-emerald-600 dark:text-emerald-400 font-bold'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <div className="relative">
              <Icon
                className={`h-5 w-5 transition-transform ${
                  isActive ? 'scale-110 text-emerald-600 dark:text-emerald-400' : ''
                }`}
              />
              {tab.badge !== null && (
                <span
                  className={`absolute -top-1.5 -right-2.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[9px] font-black ${
                    tab.badgeColor || 'bg-emerald-600 text-white'
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </div>
            <span className="mt-1 text-[10px] tracking-tight leading-none truncate max-w-[64px]">
              {tab.label}
            </span>
            {isActive && (
              <span className="mt-1 h-0.5 w-6 rounded-full bg-emerald-600 dark:bg-emerald-400 animate-in fade-in zoom-in" />
            )}
          </button>
        );
      })}

      {/* More / Menu Drawer Toggle */}
      <button
        onClick={onToggleDrawer}
        className="relative flex flex-1 flex-col items-center justify-center py-1 text-center text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 min-h-[48px]"
        title="Open Full Modules Menu"
      >
        <div className="relative">
          <Menu className="h-5 w-5" />
          <span className="absolute -top-1 -right-1 flex h-2 w-2 rounded-full bg-emerald-500" />
        </div>
        <span className="mt-1 text-[10px] tracking-tight leading-none">
          More
        </span>
      </button>
    </nav>
  );
};
