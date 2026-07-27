import React, { useState } from 'react';
import { useInventory } from '../context/InventoryContext';
import { AssetItem, IssueTicket } from '../types/inventory';
import {
  Bell,
  AlertTriangle,
  Clock,
  Printer,
  Wrench,
  CheckCircle2,
  XCircle,
  Filter,
  Search,
  ArrowRight,
  RefreshCw,
  Eye,
  Check,
  ShieldAlert,
  Droplets,
  Calendar,
  X,
  PlusCircle,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface NotificationCenterProps {
  onSelectAsset: (asset: AssetItem) => void;
  onNavigateTab: (tab: any) => void;
}

export type NotificationType = 'WARRANTY' | 'TONER' | 'MAINTENANCE';
export type SeverityLevel = 'CRITICAL' | 'WARNING' | 'INFO';

export interface AlertNotificationItem {
  id: string;
  type: NotificationType;
  severity: SeverityLevel;
  title: string;
  subtitle: string;
  department: string;
  assetId?: string;
  ticketNumber?: string;
  dateOrSpec: string;
  metricValue?: number; // e.g. toner percentage or days left
  rawAsset?: AssetItem;
  rawTicket?: IssueTicket;
  actionType: 'RENEW_WARRANTY' | 'REFILL_TONER' | 'RESOLVE_TICKET' | 'VIEW_ASSET';
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  onSelectAsset,
  onNavigateTab,
}) => {
  const { assets, tickets, updateAsset, updateTicketStatus, addAuditLog } = useInventory();

  // Active Filter state
  const [activeTab, setActiveTab] = useState<'ALL' | 'WARRANTY' | 'TONER' | 'MAINTENANCE' | 'CRITICAL'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);
  const [showDismissed, setShowDismissed] = useState(false);

  // Quick Action Modal States
  const [activeActionItem, setActiveActionItem] = useState<AlertNotificationItem | null>(null);
  const [actionModalType, setActionModalType] = useState<'TONER' | 'WARRANTY' | 'TICKET' | null>(null);

  // Form Inputs for Modals
  const [newTonerLevel, setNewTonerLevel] = useState(100);
  const [newWarrantyDate, setNewWarrantyDate] = useState('2028-12-31');
  const [ticketResolution, setTicketResolution] = useState('');
  const [ticketStatusInput, setTicketStatusInput] = useState<IssueTicket['status']>('Closed');

  const activeAssets = assets.filter((a) => !a.isRemoved);
  const now = new Date();

  // 1. Expiring Warranty Alerts (< 90 days or already expired)
  const ninetyDaysFromNow = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
  const warrantyAlerts: AlertNotificationItem[] = activeAssets
    .filter((asset) => {
      if (!asset.warrantyExpiry) return false;
      const expDate = new Date(asset.warrantyExpiry);
      return expDate <= ninetyDaysFromNow;
    })
    .map((asset) => {
      const expDate = new Date(asset.warrantyExpiry);
      const isExpired = expDate < now;
      const diffMs = expDate.getTime() - now.getTime();
      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

      return {
        id: `NOTIF-WAR-${asset.id}`,
        type: 'WARRANTY',
        severity: isExpired ? 'CRITICAL' : diffDays <= 30 ? 'CRITICAL' : 'WARNING',
        title: `${asset.name} - Warranty ${isExpired ? 'EXPIRED' : 'Expiring Soon'}`,
        subtitle: `Vendor: ${asset.vendorCompany || 'OEM Supplier'} • Tag: ${asset.assetTag}`,
        department: asset.department,
        assetId: asset.id,
        dateOrSpec: isExpired
          ? `Expired on ${asset.warrantyExpiry} (${Math.abs(diffDays)} days ago)`
          : `Expires on ${asset.warrantyExpiry} (${diffDays} days remaining)`,
        metricValue: diffDays,
        rawAsset: asset,
        actionType: 'RENEW_WARRANTY',
      };
    });

  // 2. Low Toner Level Alerts (Printers with toner <= 25%)
  const tonerAlerts: AlertNotificationItem[] = activeAssets
    .filter(
      (asset) =>
        asset.category === 'Printer' &&
        asset.printerSpecs?.tonerLevel !== undefined &&
        asset.printerSpecs.tonerLevel <= 25
    )
    .map((asset) => {
      const level = asset.printerSpecs?.tonerLevel || 0;
      return {
        id: `NOTIF-TONER-${asset.id}`,
        type: 'TONER',
        severity: level <= 15 ? 'CRITICAL' : 'WARNING',
        title: `${asset.name} - Low Toner Level (${level}%)`,
        subtitle: `Cartridge Model: ${asset.printerSpecs?.tonerModel || 'Standard Laser Toner'}`,
        department: asset.department,
        assetId: asset.id,
        dateOrSpec: `Toner Level: ${level}% Remaining`,
        metricValue: level,
        rawAsset: asset,
        actionType: 'REFILL_TONER',
      };
    });

  // 3. Pending Maintenance & Critical Open Support Tickets
  const openTickets = tickets.filter((t) => t.status !== 'Closed');
  const maintenanceAlerts: AlertNotificationItem[] = openTickets.map((t) => {
    const matchedAsset = activeAssets.find((a) => a.id === t.assetId);
    return {
      id: `NOTIF-MNT-${t.ticketNumber}`,
      type: 'MAINTENANCE',
      severity: t.priority === 'Critical' ? 'CRITICAL' : t.priority === 'High' ? 'WARNING' : 'INFO',
      title: `[${t.priority}] ${t.deviceName}`,
      subtitle: `Ticket: ${t.ticketNumber} • Engineer: ${t.assignedEngineer}`,
      department: t.department,
      assetId: t.assetId,
      ticketNumber: t.ticketNumber,
      dateOrSpec: `Reported: ${t.dateReported} • Status: ${t.status}`,
      rawTicket: t,
      rawAsset: matchedAsset,
      actionType: 'RESOLVE_TICKET',
    };
  });

  // Combine All Notifications
  const allNotifications = [...warrantyAlerts, ...tonerAlerts, ...maintenanceAlerts];

  // Dismissed Filter
  const visibleNotifications = allNotifications.filter((item) =>
    showDismissed ? dismissedIds.includes(item.id) : !dismissedIds.includes(item.id)
  );

  // Tab & Search Filtering
  const filteredNotifications = visibleNotifications.filter((item) => {
    if (activeTab === 'WARRANTY' && item.type !== 'WARRANTY') return false;
    if (activeTab === 'TONER' && item.type !== 'TONER') return false;
    if (activeTab === 'MAINTENANCE' && item.type !== 'MAINTENANCE') return false;
    if (activeTab === 'CRITICAL' && item.severity !== 'CRITICAL') return false;

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      return (
        item.title.toLowerCase().includes(q) ||
        item.subtitle.toLowerCase().includes(q) ||
        item.department.toLowerCase().includes(q) ||
        (item.assetId && item.assetId.toLowerCase().includes(q)) ||
        (item.ticketNumber && item.ticketNumber.toLowerCase().includes(q))
      );
    }
    return true;
  });

  // Handlers for dismissing notifications
  const handleDismissAlert = (id: string) => {
    setDismissedIds((prev) => [...prev, id]);
  };

  const handleRestoreAlert = (id: string) => {
    setDismissedIds((prev) => prev.filter((item) => item !== id));
  };

  const handleClearAllVisible = () => {
    const idsToDismiss = filteredNotifications.map((n) => n.id);
    setDismissedIds((prev) => Array.from(new Set([...prev, ...idsToDismiss])));
  };

  // Quick Action Triggers
  const handleOpenActionModal = (item: AlertNotificationItem) => {
    setActiveActionItem(item);
    if (item.type === 'TONER') {
      setNewTonerLevel(100);
      setActionModalType('TONER');
    } else if (item.type === 'WARRANTY') {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 3);
      setNewWarrantyDate(futureDate.toISOString().split('T')[0]);
      setActionModalType('WARRANTY');
    } else if (item.type === 'MAINTENANCE') {
      setTicketStatusInput('Closed');
      setTicketResolution('Issue resolved by engineer on site.');
      setActionModalType('TICKET');
    }
  };

  // Submit Quick Toner Refill
  const handleConfirmTonerRefill = () => {
    if (!activeActionItem?.rawAsset) return;
    const asset = activeActionItem.rawAsset;

    updateAsset(asset.id, {
      printerSpecs: {
        ...asset.printerSpecs,
        tonerLevel: newTonerLevel,
      },
    });

    addAuditLog(
      'Printer Toner Refilled',
      `Toner level for printer ${asset.id} (${asset.name}) replenished to ${newTonerLevel}%.`,
      asset.id,
      'success'
    );

    // If there is an associated ticket for this printer, automatically update it
    if (activeActionItem.ticketNumber) {
      updateTicketStatus(
        activeActionItem.ticketNumber,
        'Closed',
        `Toner cartridge replaced and level reset to ${newTonerLevel}%.`
      );
    }

    handleDismissAlert(activeActionItem.id);
    setActionModalType(null);
    setActiveActionItem(null);
  };

  // Submit Warranty Renewal
  const handleConfirmWarrantyRenew = () => {
    if (!activeActionItem?.rawAsset) return;
    const asset = activeActionItem.rawAsset;

    updateAsset(asset.id, {
      warrantyExpiry: newWarrantyDate,
    });

    addAuditLog(
      'Warranty Renewed',
      `Warranty for asset ${asset.id} extended to ${newWarrantyDate}.`,
      asset.id,
      'success'
    );

    handleDismissAlert(activeActionItem.id);
    setActionModalType(null);
    setActiveActionItem(null);
  };

  // Submit Ticket Resolution
  const handleConfirmTicketResolve = () => {
    if (!activeActionItem?.rawTicket) return;
    const ticket = activeActionItem.rawTicket;

    updateTicketStatus(
      ticket.ticketNumber,
      ticketStatusInput,
      ticketResolution || 'Resolved via Notification Center Quick Action.',
      new Date().toISOString().split('T')[0]
    );

    addAuditLog(
      'Ticket Status Updated',
      `Ticket ${ticket.ticketNumber} status changed to ${ticketStatusInput}. Notes: ${ticketResolution}`,
      ticket.assetId,
      'info'
    );

    handleDismissAlert(activeActionItem.id);
    setActionModalType(null);
    setActiveActionItem(null);
  };

  const countCritical = allNotifications.filter((n) => n.severity === 'CRITICAL' && !dismissedIds.includes(n.id)).length;
  const countWarranty = warrantyAlerts.filter((n) => !dismissedIds.includes(n.id)).length;
  const countToner = tonerAlerts.filter((n) => !dismissedIds.includes(n.id)).length;
  const countMaintenance = maintenanceAlerts.filter((n) => !dismissedIds.includes(n.id)).length;
  const activeCount = allNotifications.filter((n) => !dismissedIds.includes(n.id)).length;

  return (
    <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      {/* Header Banner */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400 border border-amber-500/20">
            <Bell className="h-6 w-6" />
            {activeCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-rose-600 text-[10px] font-extrabold text-white ring-2 ring-white dark:ring-slate-900">
                {activeCount}
              </span>
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-slate-900 text-base dark:text-white">
                NOC Operations Alert & Notification Center
              </h3>
              {countCritical > 0 && (
                <span className="rounded-full bg-rose-500/10 px-2.5 py-0.5 text-[10px] font-bold text-rose-600 border border-rose-500/20 dark:text-rose-400">
                  {countCritical} Critical Action Items
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Live alerts for expiring warranties, low printer toner levels, and pending hardware maintenance.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {dismissedIds.length > 0 && (
            <button
              onClick={() => setShowDismissed(!showDismissed)}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              <Eye className="h-3.5 w-3.5 text-slate-400" />
              <span>{showDismissed ? 'Show Active Alerts' : `Archived (${dismissedIds.length})`}</span>
            </button>
          )}

          {filteredNotifications.length > 0 && !showDismissed && (
            <button
              onClick={handleClearAllVisible}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
            >
              <Check className="h-3.5 w-3.5 text-emerald-500" />
              <span>Acknowledge All</span>
            </button>
          )}
        </div>
      </div>

      {/* Metric Counters Bar */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <button
          onClick={() => setActiveTab('WARRANTY')}
          className={`flex items-center justify-between rounded-xl border p-3 transition text-left ${
            activeTab === 'WARRANTY'
              ? 'border-amber-500 bg-amber-500/10 dark:bg-amber-500/20'
              : 'border-slate-100 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/40'
          }`}
        >
          <div>
            <span className="block text-[10px] font-bold uppercase text-slate-400">Expiring Warranties</span>
            <span className="text-lg font-black text-slate-900 dark:text-white">{countWarranty}</span>
          </div>
          <Clock className="h-5 w-5 text-amber-500" />
        </button>

        <button
          onClick={() => setActiveTab('TONER')}
          className={`flex items-center justify-between rounded-xl border p-3 transition text-left ${
            activeTab === 'TONER'
              ? 'border-cyan-500 bg-cyan-500/10 dark:bg-cyan-500/20'
              : 'border-slate-100 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/40'
          }`}
        >
          <div>
            <span className="block text-[10px] font-bold uppercase text-slate-400">Low Toner Printers</span>
            <span className="text-lg font-black text-slate-900 dark:text-white">{countToner}</span>
          </div>
          <Droplets className="h-5 w-5 text-cyan-500" />
        </button>

        <button
          onClick={() => setActiveTab('MAINTENANCE')}
          className={`flex items-center justify-between rounded-xl border p-3 transition text-left ${
            activeTab === 'MAINTENANCE'
              ? 'border-rose-500 bg-rose-500/10 dark:bg-rose-500/20'
              : 'border-slate-100 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/40'
          }`}
        >
          <div>
            <span className="block text-[10px] font-bold uppercase text-slate-400">Pending Maintenance</span>
            <span className="text-lg font-black text-slate-900 dark:text-white">{countMaintenance}</span>
          </div>
          <Wrench className="h-5 w-5 text-rose-500" />
        </button>

        <button
          onClick={() => setActiveTab('CRITICAL')}
          className={`flex items-center justify-between rounded-xl border p-3 transition text-left ${
            activeTab === 'CRITICAL'
              ? 'border-rose-600 bg-rose-600/10 dark:bg-rose-600/20'
              : 'border-slate-100 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/40'
          }`}
        >
          <div>
            <span className="block text-[10px] font-bold uppercase text-slate-400">Critical Priority</span>
            <span className="text-lg font-black text-slate-900 dark:text-white">{countCritical}</span>
          </div>
          <ShieldAlert className="h-5 w-5 text-rose-600" />
        </button>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between pt-1">
        <div className="flex flex-wrap items-center gap-1">
          {[
            { id: 'ALL', label: `All Alerts (${visibleNotifications.length})` },
            { id: 'WARRANTY', label: `Warranty (${countWarranty})` },
            { id: 'TONER', label: `Toner Low (${countToner})` },
            { id: 'MAINTENANCE', label: `Maintenance (${countMaintenance})` },
            { id: 'CRITICAL', label: `Critical (${countCritical})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                activeTab === tab.id
                  ? 'bg-slate-900 text-white dark:bg-emerald-500'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-56">
          <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search alerts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-slate-50 pl-8 pr-2.5 py-1.5 text-xs text-slate-800 outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          />
        </div>
      </div>

      {/* List of Notification Cards */}
      <div className="space-y-2.5">
        {filteredNotifications.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center dark:border-slate-800">
            <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-500 opacity-60" />
            <p className="mt-2 font-bold text-slate-800 text-xs dark:text-slate-200">
              {showDismissed ? 'No Archived Alerts Found' : 'All Clear! No Pending Operations Alerts'}
            </p>
            <p className="text-[11px] text-slate-400">
              All warranties are active, printer toners are full, and tickets are addressed.
            </p>
          </div>
        ) : (
          filteredNotifications.map((item) => (
            <div
              key={item.id}
              className={`group flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border p-3.5 transition ${
                item.severity === 'CRITICAL'
                  ? 'border-rose-200 bg-rose-50/40 dark:border-rose-900/40 dark:bg-rose-950/10'
                  : item.severity === 'WARNING'
                  ? 'border-amber-200 bg-amber-50/40 dark:border-amber-900/40 dark:bg-amber-950/10'
                  : 'border-slate-200 bg-slate-50/40 dark:border-slate-800 dark:bg-slate-800/40'
              }`}
            >
              <div className="flex items-start gap-3 overflow-hidden">
                <div
                  className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl font-bold text-xs ${
                    item.type === 'WARRANTY'
                      ? 'bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400'
                      : item.type === 'TONER'
                      ? 'bg-cyan-500/10 text-cyan-600 dark:bg-cyan-500/20 dark:text-cyan-400'
                      : 'bg-rose-500/10 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400'
                  }`}
                >
                  {item.type === 'WARRANTY' ? (
                    <Clock className="h-5 w-5" />
                  ) : item.type === 'TONER' ? (
                    <Droplets className="h-5 w-5" />
                  ) : (
                    <Wrench className="h-5 w-5" />
                  )}
                </div>

                <div className="overflow-hidden">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-slate-900 text-xs dark:text-white truncate">
                      {item.title}
                    </span>
                    <span
                      className={`rounded px-1.5 py-0.5 text-[9px] font-extrabold uppercase ${
                        item.severity === 'CRITICAL'
                          ? 'bg-rose-600 text-white'
                          : item.severity === 'WARNING'
                          ? 'bg-amber-500 text-white'
                          : 'bg-blue-500 text-white'
                      }`}
                    >
                      {item.severity}
                    </span>
                    <span className="rounded bg-slate-200 px-1.5 py-0.5 text-[9px] font-bold text-slate-700 dark:bg-slate-700 dark:text-slate-300">
                      {item.department}
                    </span>
                  </div>

                  <p className="mt-0.5 text-[11px] text-slate-600 dark:text-slate-300 truncate">
                    {item.subtitle}
                  </p>

                  <div className="mt-1 flex flex-wrap items-center gap-3 text-[10px] font-mono text-slate-500 dark:text-slate-400">
                    <span>{item.dateOrSpec}</span>
                    {item.type === 'TONER' && item.metricValue !== undefined && (
                      <div className="flex items-center gap-1.5">
                        <div className="h-1.5 w-16 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                          <div
                            className={`h-full ${
                              item.metricValue <= 15 ? 'bg-rose-600' : 'bg-amber-500'
                            }`}
                            style={{ width: `${item.metricValue}%` }}
                          ></div>
                        </div>
                        <span className="font-bold text-slate-700 dark:text-slate-300">
                          {item.metricValue}%
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 flex-shrink-0 self-end sm:self-center">
                {item.rawAsset && (
                  <button
                    onClick={() => onSelectAsset(item.rawAsset!)}
                    className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                    title="View Asset Details"
                  >
                    <Eye className="h-3 w-3 text-emerald-500" />
                    <span>View</span>
                  </button>
                )}

                <button
                  onClick={() => handleOpenActionModal(item)}
                  className={`flex items-center gap-1 rounded-lg px-3 py-1 text-[11px] font-bold text-white shadow-sm transition ${
                    item.type === 'TONER'
                      ? 'bg-cyan-600 hover:bg-cyan-500'
                      : item.type === 'WARRANTY'
                      ? 'bg-amber-600 hover:bg-amber-500'
                      : 'bg-rose-600 hover:bg-rose-500'
                  }`}
                >
                  <RefreshCw className="h-3 w-3" />
                  <span>
                    {item.type === 'TONER'
                      ? 'Refill Toner'
                      : item.type === 'WARRANTY'
                      ? 'Extend Warranty'
                      : 'Resolve Ticket'}
                  </span>
                </button>

                {!showDismissed ? (
                  <button
                    onClick={() => handleDismissAlert(item.id)}
                    className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    title="Acknowledge & Archive Alert"
                  >
                    <X className="h-4 w-4" />
                  </button>
                ) : (
                  <button
                    onClick={() => handleRestoreAlert(item.id)}
                    className="p-1 text-emerald-500 hover:text-emerald-600"
                    title="Restore Alert"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Quick Action Modal for Refill Toner, Renew Warranty, or Resolve Ticket */}
      {actionModalType && activeActionItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <div className="flex items-center gap-2">
                {actionModalType === 'TONER' && <Droplets className="h-5 w-5 text-cyan-500" />}
                {actionModalType === 'WARRANTY' && <Clock className="h-5 w-5 text-amber-500" />}
                {actionModalType === 'TICKET' && <Wrench className="h-5 w-5 text-rose-500" />}
                <h3 className="font-bold text-slate-900 text-sm dark:text-white">
                  {actionModalType === 'TONER' && 'Replenish Printer Toner Level'}
                  {actionModalType === 'WARRANTY' && 'Renew / Extend Asset Warranty'}
                  {actionModalType === 'TICKET' && 'Update Support Ticket Status'}
                </h3>
              </div>
              <button
                onClick={() => setActionModalType(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 space-y-4 text-xs">
              <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/60 font-mono text-[11px]">
                <p className="font-bold text-slate-800 dark:text-slate-200">{activeActionItem.title}</p>
                <p className="text-slate-500 dark:text-slate-400 mt-0.5">{activeActionItem.subtitle}</p>
              </div>

              {/* Toner Refill Form */}
              {actionModalType === 'TONER' && (
                <div className="space-y-3">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      New Toner Percentage Level (%)
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min="25"
                        max="100"
                        value={newTonerLevel}
                        onChange={(e) => setNewTonerLevel(Number(e.target.value))}
                        className="w-full accent-cyan-500"
                      />
                      <span className="font-black text-cyan-600 text-sm">{newTonerLevel}%</span>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    This will update the printer specification record and log a cartridge replacement audit entry in Sentinel.
                  </p>
                </div>
              )}

              {/* Warranty Renewal Form */}
              {actionModalType === 'WARRANTY' && (
                <div className="space-y-3">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      New Warranty Expiry Date
                    </label>
                    <input
                      type="date"
                      value={newWarrantyDate}
                      onChange={(e) => setNewWarrantyDate(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 font-mono text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                    />
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Extends warranty coverage period. The status alert will be cleared automatically.
                  </p>
                </div>
              )}

              {/* Ticket Resolution Form */}
              {actionModalType === 'TICKET' && (
                <div className="space-y-3">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Ticket Resolution Status
                    </label>
                    <select
                      value={ticketStatusInput}
                      onChange={(e) => setTicketStatusInput(e.target.value as any)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2 font-bold dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                    >
                      <option value="Closed">Closed (Resolved & Verified)</option>
                      <option value="Working">Working (Under Maintenance)</option>
                      <option value="Pending">Pending Parts / Vendor</option>
                      <option value="Open">Open</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Engineer Resolution Notes / Remarks
                    </label>
                    <textarea
                      rows={3}
                      value={ticketResolution}
                      onChange={(e) => setTicketResolution(e.target.value)}
                      placeholder="Enter maintenance work done or parts replaced..."
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-800 outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="mt-6 flex items-center justify-end gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setActionModalType(null)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={
                  actionModalType === 'TONER'
                    ? handleConfirmTonerRefill
                    : actionModalType === 'WARRANTY'
                    ? handleConfirmWarrantyRenew
                    : handleConfirmTicketResolve
                }
                className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-500 shadow-md shadow-emerald-600/20"
              >
                Confirm & Apply Action
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
