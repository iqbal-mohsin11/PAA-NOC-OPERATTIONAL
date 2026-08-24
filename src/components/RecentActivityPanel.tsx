import React, { useState, useMemo } from 'react';
import {
  Activity,
  Wrench,
  Truck,
  ShieldCheck,
  ShieldAlert,
  Search,
  Filter,
  ArrowUpRight,
  Calendar,
  UserCheck,
  Clock,
  Building,
  PackageCheck,
  Droplets,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Layers,
  Tag,
  ChevronRight,
  MapPin,
  RefreshCw,
  PlusCircle,
  ArrowRightLeft,
  FileKey,
} from 'lucide-react';
import { useInventory } from '../context/InventoryContext';
import { AssetItem, Department } from '../types/inventory';

export type ActivityCategory = 'ALL' | 'movements' | 'maintenance' | 'gatepass' | 'audit' | 'supplies';

export interface RecentActivityPanelProps {
  onSelectAsset?: (asset: AssetItem) => void;
  onNavigateTab?: (tab: string) => void;
}

export interface ActivityItem {
  id: string;
  type: 'addition' | 'movement' | 'maintenance' | 'gatepass' | 'audit' | 'toner' | 'logistics';
  timestamp: string;
  sortDate: Date;
  title: string;
  description: string;
  actorOrEngineer?: string;
  department?: Department;
  assetId?: string;
  assetName?: string;
  iconBgClass: string;
  statusBadge: {
    text: string;
    bgClass: string;
    textClass: string;
  };
  detailsExtra?: string;
  locationInfo?: string;
}

export const RecentActivityPanel: React.FC<RecentActivityPanelProps> = ({
  onSelectAsset,
  onNavigateTab,
}) => {
  const {
    assets,
    maintenanceRecords,
    gatePassRecords,
    auditLogs,
    tonerIssueRecords,
    logisticsReceivingRecords,
  } = useInventory();

  const [activeCategory, setActiveCategory] = useState<ActivityCategory>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState<string>('ALL');

  // Build unified chronological activity list
  const allActivities = useMemo(() => {
    const list: ActivityItem[] = [];

    // 1. Asset Movements, Additions & Status Changes from Audit Logs
    auditLogs.forEach((log) => {
      const logDate = new Date(log.timestamp.replace(' PKT', ''));
      const actLower = log.action.toLowerCase();
      const detLower = log.details.toLowerCase();

      const isAddition =
        actLower.includes('create') ||
        actLower.includes('add') ||
        actLower.includes('new asset') ||
        actLower.includes('registered') ||
        detLower.includes('registered new asset') ||
        detLower.includes('added to inventory');

      const isMovement =
        !isAddition &&
        (actLower.includes('move') ||
          actLower.includes('transfer') ||
          actLower.includes('location') ||
          actLower.includes('relocate') ||
          detLower.includes('transferred to'));

      const matchedAsset = log.assetId ? assets.find((a) => a.id === log.assetId) : undefined;

      let itemType: ActivityItem['type'] = 'audit';
      let iconBgClass = 'bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700';
      let badgeBg = 'bg-slate-100 dark:bg-slate-800';
      let badgeText = 'text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700';

      if (isAddition) {
        itemType = 'addition';
        iconBgClass = 'bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800';
        badgeBg = 'bg-emerald-100 dark:bg-emerald-900/40';
        badgeText = 'text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700';
      } else if (isMovement) {
        itemType = 'movement';
        iconBgClass = 'bg-cyan-50 dark:bg-cyan-950/60 border border-cyan-200 dark:border-cyan-800';
        badgeBg = 'bg-cyan-100 dark:bg-cyan-900/40';
        badgeText = 'text-cyan-700 dark:text-cyan-300 border border-cyan-300 dark:border-cyan-700';
      } else if (log.type === 'danger') {
        iconBgClass = 'bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800';
        badgeBg = 'bg-rose-100 dark:bg-rose-900/40';
        badgeText = 'text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-700';
      } else if (log.type === 'warning') {
        iconBgClass = 'bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800';
        badgeBg = 'bg-amber-100 dark:bg-amber-900/40';
        badgeText = 'text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-700';
      }

      list.push({
        id: `audit-${log.id}`,
        type: itemType,
        timestamp: log.timestamp,
        sortDate: isNaN(logDate.getTime()) ? new Date() : logDate,
        title: log.action,
        description: log.details,
        actorOrEngineer: log.actor,
        assetId: log.assetId,
        assetName: matchedAsset?.name,
        department: matchedAsset?.department,
        iconBgClass,
        statusBadge: {
          text: isAddition ? 'New Asset Added' : isMovement ? 'Asset Transfer' : log.type.toUpperCase(),
          bgClass: badgeBg,
          textClass: badgeText,
        },
      });
    });

    // 2. Maintenance Updates (Amber Theme)
    maintenanceRecords.forEach((mnt) => {
      const mntDate = new Date(mnt.date);
      const matchedAsset = assets.find((a) => a.id === mnt.assetId);

      list.push({
        id: `mnt-${mnt.id}`,
        type: 'maintenance',
        timestamp: mnt.date,
        sortDate: isNaN(mntDate.getTime()) ? new Date() : mntDate,
        title: `Maintenance Record: ${mnt.id}`,
        description: `${mnt.deviceName} - ${mnt.description}`,
        actorOrEngineer: mnt.engineer,
        assetId: mnt.assetId,
        assetName: mnt.deviceName,
        department: matchedAsset?.department,
        iconBgClass: 'bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800',
        statusBadge: {
          text: 'Maintenance',
          bgClass: 'bg-amber-100 dark:bg-amber-900/40',
          textClass: 'text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-700',
        },
        detailsExtra: `${mnt.partsReplaced ? `Parts: ${mnt.partsReplaced}` : 'Routine Service'} ${
          mnt.cost ? `| Cost: PKR ${mnt.cost.toLocaleString()}` : ''
        }`,
      });
    });

    // 3. Gate Pass Issuances (Blue Theme / Emerald if returned)
    gatePassRecords.forEach((gp) => {
      const gpDate = new Date(gp.issuedDate);
      const matchedAsset = gp.assetId ? assets.find((a) => a.id === gp.assetId) : undefined;

      const isReturned = gp.status === 'Returned & Repaired' || gp.status === 'Completed / Closed';
      const iconBgClass = isReturned
        ? 'bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800'
        : 'bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800';

      const badgeBg = isReturned ? 'bg-emerald-100 dark:bg-emerald-900/40' : 'bg-blue-100 dark:bg-blue-900/40';
      const badgeText = isReturned
        ? 'text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700'
        : 'text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-700';

      list.push({
        id: `gp-${gp.id}`,
        type: 'gatepass',
        timestamp: gp.issuedDate,
        sortDate: isNaN(gpDate.getTime()) ? new Date() : gpDate,
        title: `Gate Pass (${gp.id}): ${gp.gatePassType}`,
        description: `${gp.equipmentName} - ${gp.defectReason}`,
        actorOrEngineer: `Officer: ${gp.issuedByOfficer} | Carrier: ${gp.carrierPersonName}`,
        assetId: gp.assetId,
        assetName: gp.equipmentName,
        department: gp.department,
        iconBgClass,
        statusBadge: {
          text: isReturned ? 'Gate Pass (Returned)' : `Gate Pass (${gp.status})`,
          bgClass: badgeBg,
          textClass: badgeText,
        },
        detailsExtra: `Vendor/Workshop: ${gp.vendorMarketWorkshop}`,
      });
    });

    // 4. Logistics Supplies Received (Teal Theme)
    logisticsReceivingRecords.forEach((rcv) => {
      const rcvDate = new Date(rcv.receivedDate || rcv.createdAt);

      list.push({
        id: `logistics-${rcv.id}`,
        type: 'logistics',
        timestamp: rcv.receivedDate,
        sortDate: isNaN(rcvDate.getTime()) ? new Date() : rcvDate,
        title: `Supply Item Received (${rcv.id})`,
        description: `${rcv.quantity}x ${rcv.brand} ${rcv.model} (${rcv.category}) received at ${rcv.storeLocation}`,
        actorOrEngineer: rcv.receivingPersonName,
        department: rcv.department,
        iconBgClass: 'bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800',
        statusBadge: {
          text: 'Supply Received',
          bgClass: 'bg-teal-100 dark:bg-teal-900/40',
          textClass: 'text-teal-700 dark:text-teal-300 border border-teal-300 dark:border-teal-700',
        },
        detailsExtra: `Supply Ref: ${rcv.logisticsSupplyRefNo || 'Local LPO'} | Store: ${rcv.storeLocation}`,
      });
    });

    // 5. Toner Issuance Vouchers (Violet Theme)
    tonerIssueRecords.forEach((tnr) => {
      const tnrDate = new Date(tnr.issuedDate);

      list.push({
        id: `toner-${tnr.id}`,
        type: 'toner',
        timestamp: tnr.issuedDate,
        sortDate: isNaN(tnrDate.getTime()) ? new Date() : tnrDate,
        title: `Toner / Consumable Issued (${tnr.id})`,
        description: `${tnr.quantity}x ${tnr.tonerModel} issued for ${tnr.printerName || tnr.department}`,
        actorOrEngineer: tnr.issuedBy,
        assetId: tnr.assetId,
        department: tnr.department,
        iconBgClass: 'bg-violet-50 dark:bg-violet-950/60 border border-violet-200 dark:border-violet-800',
        statusBadge: {
          text: 'Consumable Issued',
          bgClass: 'bg-violet-100 dark:bg-violet-900/40',
          textClass: 'text-violet-700 dark:text-violet-300 border border-violet-300 dark:border-violet-700',
        },
        detailsExtra: `Recipient: ${tnr.recipientUser || 'Department Staff'}`,
      });
    });

    // Sort descending by sortDate
    return list.sort((a, b) => b.sortDate.getTime() - a.sortDate.getTime());
  }, [auditLogs, maintenanceRecords, gatePassRecords, logisticsReceivingRecords, tonerIssueRecords, assets]);

  // Unique departments for filter
  const departments = useMemo(() => {
    const set = new Set<string>();
    allActivities.forEach((act) => {
      if (act.department) set.add(act.department);
    });
    return Array.from(set).sort();
  }, [allActivities]);

  // Filtered Activities
  const filteredActivities = useMemo(() => {
    return allActivities.filter((act) => {
      // Category filter
      if (activeCategory === 'movements' && act.type !== 'movement' && act.type !== 'addition') return false;
      if (activeCategory === 'maintenance' && act.type !== 'maintenance') return false;
      if (activeCategory === 'gatepass' && act.type !== 'gatepass') return false;
      if (activeCategory === 'audit' && act.type !== 'audit') return false;
      if (activeCategory === 'supplies' && act.type !== 'logistics' && act.type !== 'toner') return false;

      // Department filter
      if (selectedDeptFilter !== 'ALL' && act.department !== selectedDeptFilter) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = act.title.toLowerCase().includes(q);
        const matchesDesc = act.description.toLowerCase().includes(q);
        const matchesActor = act.actorOrEngineer?.toLowerCase().includes(q);
        const matchesAsset = act.assetId?.toLowerCase().includes(q) || act.assetName?.toLowerCase().includes(q);
        const matchesDept = act.department?.toLowerCase().includes(q);
        const matchesExtra = act.detailsExtra?.toLowerCase().includes(q);

        if (!matchesTitle && !matchesDesc && !matchesActor && !matchesAsset && !matchesDept && !matchesExtra) {
          return false;
        }
      }

      return true;
    });
  }, [allActivities, activeCategory, selectedDeptFilter, searchQuery]);

  // Helper for type icon with color coding
  const renderActivityIcon = (act: ActivityItem) => {
    switch (act.type) {
      case 'addition':
        return <PlusCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />;
      case 'maintenance':
        return <Wrench className="h-4 w-4 text-amber-600 dark:text-amber-400" />;
      case 'gatepass':
        return <Tag className="h-4 w-4 text-blue-600 dark:text-blue-400" />;
      case 'movement':
        return <ArrowRightLeft className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />;
      case 'logistics':
        return <PackageCheck className="h-4 w-4 text-teal-600 dark:text-teal-400" />;
      case 'toner':
        return <Droplets className="h-4 w-4 text-violet-600 dark:text-violet-400" />;
      case 'audit':
      default:
        if (act.statusBadge.text.includes('DANGER') || act.statusBadge.text.includes('ALERT')) {
          return <ShieldAlert className="h-4 w-4 text-rose-600 dark:text-rose-400" />;
        }
        return <ShieldCheck className="h-4 w-4 text-slate-600 dark:text-slate-400" />;
    }
  };

  const counts = useMemo(() => {
    return {
      total: allActivities.length,
      movements: allActivities.filter((a) => a.type === 'movement' || a.type === 'addition').length,
      maintenance: allActivities.filter((a) => a.type === 'maintenance').length,
      gatepass: allActivities.filter((a) => a.type === 'gatepass').length,
      audit: allActivities.filter((a) => a.type === 'audit').length,
      supplies: allActivities.filter((a) => a.type === 'logistics' || a.type === 'toner').length,
    };
  }, [allActivities]);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-md dark:border-slate-800 dark:bg-slate-900 transition-all">
      {/* Panel Header */}
      <div className="flex flex-col gap-4 border-b border-slate-100 pb-4 dark:border-slate-800 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-md">
            <Activity className="h-5 w-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                Recent Activity & Audit Feed
              </h3>
              <span className="rounded-full bg-blue-500/10 px-2.5 py-0.5 text-xs font-bold text-blue-600 dark:bg-blue-500/20 dark:text-blue-400 border border-blue-500/20">
                {filteredActivities.length} Events
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Color-coded chronological feed of asset additions, transfers, maintenance logs, and market repair gate passes.
            </p>
          </div>
        </div>

        {/* Top Quick Actions / Nav */}
        <div className="flex flex-wrap items-center gap-2">
          {onNavigateTab && (
            <>
              <button
                onClick={() => onNavigateTab('gatepass')}
                className="flex items-center gap-1.5 rounded-xl border border-purple-200 bg-purple-50 px-3 py-1.5 text-xs font-bold text-purple-700 hover:bg-purple-100 dark:border-purple-800/50 dark:bg-purple-950/40 dark:text-purple-300 dark:hover:bg-purple-900/60 transition shadow-sm"
              >
                <Tag className="h-3.5 w-3.5 text-purple-500" />
                <span>Gate Pass Portal</span>
              </button>

              <button
                onClick={() => onNavigateTab('maintenance')}
                className="flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 hover:bg-emerald-100 dark:border-emerald-800/50 dark:bg-emerald-950/40 dark:text-emerald-300 dark:hover:bg-emerald-900/60 transition shadow-sm"
              >
                <Wrench className="h-3.5 w-3.5 text-emerald-500" />
                <span>Maintenance Schedule</span>
              </button>

              <button
                onClick={() => onNavigateTab('reports')}
                className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 transition shadow-sm"
              >
                <FileText className="h-3.5 w-3.5 text-slate-500" />
                <span>Full Audit Report</span>
                <ArrowUpRight className="h-3.5 w-3.5 opacity-60" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setActiveCategory('ALL')}
            className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition ${
              activeCategory === 'ALL'
                ? 'bg-slate-900 text-white shadow dark:bg-white dark:text-slate-900'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
            }`}
          >
            <Layers className="h-3.5 w-3.5" />
            <span>All Activities ({counts.total})</span>
          </button>

          <button
            onClick={() => setActiveCategory('movements')}
            className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition ${
              activeCategory === 'movements'
                ? 'bg-blue-600 text-white shadow'
                : 'bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-950/50 dark:text-blue-300 dark:hover:bg-blue-900/60'
            }`}
          >
            <Truck className="h-3.5 w-3.5" />
            <span>Asset Movements ({counts.movements})</span>
          </button>

          <button
            onClick={() => setActiveCategory('maintenance')}
            className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition ${
              activeCategory === 'maintenance'
                ? 'bg-amber-600 text-white shadow'
                : 'bg-amber-50 text-amber-700 hover:bg-amber-100 dark:bg-amber-950/50 dark:text-amber-300 dark:hover:bg-amber-900/60'
            }`}
          >
            <Wrench className="h-3.5 w-3.5" />
            <span>Maintenance ({counts.maintenance})</span>
          </button>

          <button
            onClick={() => setActiveCategory('gatepass')}
            className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition ${
              activeCategory === 'gatepass'
                ? 'bg-purple-600 text-white shadow'
                : 'bg-purple-50 text-purple-700 hover:bg-purple-100 dark:bg-purple-950/50 dark:text-purple-300 dark:hover:bg-purple-900/60'
            }`}
          >
            <Tag className="h-3.5 w-3.5" />
            <span>Gate Passes ({counts.gatepass})</span>
          </button>

          <button
            onClick={() => setActiveCategory('supplies')}
            className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition ${
              activeCategory === 'supplies'
                ? 'bg-teal-600 text-white shadow'
                : 'bg-teal-50 text-teal-700 hover:bg-teal-100 dark:bg-teal-950/50 dark:text-teal-300 dark:hover:bg-teal-900/60'
            }`}
          >
            <PackageCheck className="h-3.5 w-3.5" />
            <span>Supplies Received ({counts.supplies})</span>
          </button>

          <button
            onClick={() => setActiveCategory('audit')}
            className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition ${
              activeCategory === 'audit'
                ? 'bg-slate-700 text-white shadow'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
            }`}
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Audit Logs ({counts.audit})</span>
          </button>
        </div>

        {/* Search & Department Selector Controls */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {/* Department Filter */}
          <div className="relative">
            <select
              value={selectedDeptFilter}
              onChange={(e) => setSelectedDeptFilter(e.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">All Departments</option>
              {departments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept} Department
                </option>
              ))}
            </select>
          </div>

          {/* Search Box */}
          <div className="relative min-w-[180px] sm:min-w-[220px]">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search recent activity..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-8 pr-3 py-1.5 text-xs font-medium text-slate-800 placeholder-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Activity Timeline List */}
      <div className="mt-5 space-y-3 max-h-[520px] overflow-y-auto pr-1">
        {filteredActivities.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center dark:border-slate-800">
            <Activity className="mx-auto h-8 w-8 text-slate-300 dark:text-slate-600" />
            <p className="mt-2 text-sm font-bold text-slate-600 dark:text-slate-400">
              No matching activities found
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
              Try adjusting your search query or department filter tab.
            </p>
          </div>
        ) : (
          filteredActivities.map((act) => {
            const matchedAsset = act.assetId ? assets.find((a) => a.id === act.assetId) : undefined;

            return (
              <div
                key={act.id}
                className="group relative rounded-xl border border-slate-100 bg-slate-50/70 p-3.5 transition-all hover:border-slate-300 hover:bg-white hover:shadow-md dark:border-slate-800/80 dark:bg-slate-800/40 dark:hover:border-slate-700 dark:hover:bg-slate-800"
              >
                <div className="flex items-start justify-between gap-3">
                  {/* Left: Color-Coded Icon Box & Main Content */}
                  <div className="flex items-start gap-3">
                    {/* Color Coded Icon Box */}
                    <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg shadow-2xs ${act.iconBgClass}`}>
                      {renderActivityIcon(act)}
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-extrabold text-slate-900 dark:text-white">
                          {act.title}
                        </span>

                        {/* Color Coded Status Badge with Indicator Dot */}
                        {act.statusBadge && (
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide ${act.statusBadge.bgClass} ${act.statusBadge.textClass}`}
                          >
                            <span className="h-1.5 w-1.5 rounded-full bg-current animate-pulse"></span>
                            {act.statusBadge.text}
                          </span>
                        )}

                        {act.department && (
                          <span className="flex items-center gap-1 rounded-md bg-slate-200/60 px-2 py-0.5 text-[10px] font-bold text-slate-700 dark:bg-slate-700 dark:text-slate-300">
                            <Building className="h-3 w-3 text-slate-400" />
                            <span>{act.department}</span>
                          </span>
                        )}
                      </div>

                      <p className="mt-1 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                        {act.description}
                      </p>

                      {act.detailsExtra && (
                        <p className="mt-1 text-[11px] font-mono text-slate-500 dark:text-slate-400">
                          {act.detailsExtra}
                        </p>
                      )}

                      {/* Footer Info: Actor / Engineer / Asset Tag */}
                      <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400">
                        {act.actorOrEngineer && (
                          <div className="flex items-center gap-1 font-medium">
                            <UserCheck className="h-3 w-3 text-slate-400" />
                            <span>{act.actorOrEngineer}</span>
                          </div>
                        )}

                        {act.assetId && (
                          <button
                            type="button"
                            onClick={() => matchedAsset && onSelectAsset && onSelectAsset(matchedAsset)}
                            className="flex items-center gap-1 font-mono font-bold text-blue-600 hover:underline dark:text-blue-400 transition"
                            title="Click to view asset details"
                          >
                            <Tag className="h-3 w-3 text-blue-500" />
                            <span>{act.assetId}</span>
                            {act.assetName && (
                              <span className="font-sans font-medium text-slate-500 dark:text-slate-400">
                                ({act.assetName})
                              </span>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Date Timestamp */}
                  <div className="shrink-0 text-right">
                    <div className="flex items-center gap-1 text-[11px] font-mono font-semibold text-slate-500 dark:text-slate-400">
                      <Clock className="h-3 w-3 text-slate-400" />
                      <span>{act.timestamp}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer Banner */}
      <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
        <span className="flex items-center gap-1.5 text-[11px]">
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
          <span>Real-time Audit Sync Active</span>
        </span>

        {onNavigateTab && (
          <button
            onClick={() => onNavigateTab('reports')}
            className="flex items-center gap-1 font-bold text-blue-600 hover:text-blue-500 dark:text-blue-400 transition"
          >
            <span>View Full Audit Logs & Reports</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};

