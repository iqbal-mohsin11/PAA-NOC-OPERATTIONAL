import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
  AreaChart,
  Area,
} from 'recharts';
import {
  Zap,
  BatteryCharging,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Activity,
  Layers,
  ArrowUpRight,
  ShieldCheck,
  ShieldAlert,
  Server,
  Wrench,
  ChevronRight,
  FileSpreadsheet,
  TrendingUp,
  Cpu,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { AssetItem, UPSMaintenanceRecord } from '../types/inventory';
import {
  computeFleetPredictiveForecast,
  computeUPSPredictiveForecast,
  getStoredBatteryReplacementEntries,
} from '../utils/upsPredictiveModel';
import { UPSPredictiveMaintenancePanel } from './UPSPredictiveMaintenancePanel';

interface UPSSummaryDashboardProps {
  upsAssets: AssetItem[];
  maintenanceRecords?: UPSMaintenanceRecord[];
  onSelectAsset?: (asset: AssetItem) => void;
  onOpenService?: (asset?: AssetItem) => void;
  onOpenBatteryForm?: () => void;
  onOpenChecklistForm?: () => void;
  onFilterCapacity?: (kva: string) => void;
  onFilterStatus?: (status: string) => void;
}

// Current baseline date for calculation
const CURRENT_DATE = new Date('2026-09-08');

// Helper to parse kVA number from string
function parseKvaValue(asset: AssetItem): number {
  if (asset.upsSpecs?.kvaRating) {
    const m = asset.upsSpecs.kvaRating.match(/(\d+(\.\d+)?)/);
    if (m) return parseFloat(m[1]);
  }
  const specStr = `${asset.upsSpecs?.capacityKvaKw || ''} ${asset.model || ''} ${asset.name || ''}`.toUpperCase();
  if (specStr.includes('10KVA') || specStr.includes('10 KVA')) return 10;
  if (specStr.includes('5KVA') || specStr.includes('5 KVA')) return 5;
  if (specStr.includes('3KVA') || specStr.includes('3 KVA') || specStr.includes('3000H')) return 3;
  if (specStr.includes('2KVA') || specStr.includes('2 KVA') || specStr.includes('2000H')) return 2;
  if (specStr.includes('1KVA') || specStr.includes('1 KVA') || specStr.includes('1000H')) return 1;
  return 1;
}

// Helper to parse kW value
function parseKwValue(asset: AssetItem): number {
  if (asset.upsSpecs?.kwRating) {
    const m = asset.upsSpecs.kwRating.match(/(\d+(\.\d+)?)/);
    if (m) return parseFloat(m[1]);
  }
  const kva = parseKvaValue(asset);
  return Number((kva * 0.7).toFixed(1));
}

// Helper to evaluate battery health
function getBatteryHealth(asset: AssetItem): {
  score: number;
  status: 'Optimal' | 'Good' | 'Attention' | 'Critical';
  reason: string;
} {
  const backupStr = (asset.upsSpecs?.backupTime || '').toUpperCase();
  const isNoBackup = backupStr.includes('NO BACKUP') || asset.status === 'Faulty';

  if (isNoBackup) {
    return { score: 20, status: 'Critical', reason: 'Zero backup reported / Defective bank' };
  }

  if (asset.upsSpecs?.batteryHealthPercent !== undefined) {
    const pct = asset.upsSpecs.batteryHealthPercent;
    if (pct >= 90) return { score: pct, status: 'Optimal', reason: 'Recent cell replacement' };
    if (pct >= 75) return { score: pct, status: 'Good', reason: 'Normal cell conductance' };
    if (pct >= 50) return { score: pct, status: 'Attention', reason: 'Impedance rising / Due soon' };
    return { score: pct, status: 'Critical', reason: 'Deep discharge / Replace bank' };
  }

  // Age based estimation
  const battDateStr = asset.upsSpecs?.lastBatteryChangeDate || asset.lastMaintenanceDate || '2024-11-20';
  const battDate = new Date(battDateStr);
  const ageMonths = Math.max(0, (CURRENT_DATE.getTime() - battDate.getTime()) / (1000 * 60 * 60 * 24 * 30.4));

  if (ageMonths <= 12) {
    return { score: 95, status: 'Optimal', reason: `Batteries fresh (${Math.round(ageMonths)} mos old)` };
  } else if (ageMonths <= 24) {
    return { score: 85, status: 'Good', reason: `In normal cycle (${Math.round(ageMonths)} mos old)` };
  } else if (ageMonths <= 36) {
    return { score: 65, status: 'Attention', reason: `Over 2 years old (${Math.round(ageMonths)} mos)` };
  } else {
    return { score: 40, status: 'Critical', reason: `Exceeded 36 mos lifecycle (${Math.round(ageMonths)} mos)` };
  }
}

// Helper to calculate next scheduled maintenance / replacement date
function getNextMaintenanceInfo(asset: AssetItem): {
  dueDate: Date;
  dueDateStr: string;
  daysRemaining: number;
  isOverdue: boolean;
  type: string;
} {
  let dueDate: Date;
  let type = 'Routine Battery Test';

  if (asset.upsSpecs?.nextBatteryChangeDate) {
    dueDate = new Date(asset.upsSpecs.nextBatteryChangeDate);
    type = 'Battery Bank Replacement';
  } else {
    // If not specified, estimate 24 months from last replacement date
    const lastDateStr = asset.upsSpecs?.lastBatteryChangeDate || '2024-11-20';
    const lastDate = new Date(lastDateStr);
    dueDate = new Date(lastDate);
    dueDate.setMonth(dueDate.getMonth() + 24);
    type = 'Battery Renewal Cycle';
  }

  const diffMs = dueDate.getTime() - CURRENT_DATE.getTime();
  const daysRemaining = Math.round(diffMs / (1000 * 60 * 60 * 24));
  const isOverdue = daysRemaining < 0;

  return {
    dueDate,
    dueDateStr: dueDate.toISOString().split('T')[0],
    daysRemaining,
    isOverdue,
    type,
  };
}

export const UPSSummaryDashboard: React.FC<UPSSummaryDashboardProps> = ({
  upsAssets,
  maintenanceRecords = [],
  onSelectAsset,
  onOpenService,
  onOpenBatteryForm,
  onOpenChecklistForm,
  onFilterCapacity,
  onFilterStatus,
}) => {
  const [dashboardViewMode, setDashboardViewMode] = useState<'overview' | 'predictive'>('overview');
  const [selectedZone, setSelectedZone] = useState<string>('all');

  // Filter out removed assets
  const activeFleet = useMemo(() => {
    return upsAssets.filter((a) => !a.isRemoved && (a.category === 'UPS' || a.upsSpecs !== undefined));
  }, [upsAssets]);

  // Compute fleet predictive forecast using historical replacement records
  const predictiveFleetData = useMemo(() => {
    const historicalEntries = getStoredBatteryReplacementEntries();
    return computeFleetPredictiveForecast(activeFleet, historicalEntries, maintenanceRecords);
  }, [activeFleet, maintenanceRecords]);

  // 1. KPI Calculations
  const fleetKpis = useMemo(() => {
    let totalKva = 0;
    let totalKw = 0;
    let totalConnectedKw = 0;
    let totalCells = 0;
    let healthScoresSum = 0;
    let optimalCount = 0;
    let goodCount = 0;
    let attentionCount = 0;
    let criticalCount = 0;
    let overdueMaintenanceCount = 0;
    let next30DaysDueCount = 0;

    activeFleet.forEach((asset) => {
      const kva = parseKvaValue(asset);
      const kw = parseKwValue(asset);
      const loadPct = asset.upsSpecs?.loadPercentage || 60;
      const cells = asset.upsSpecs?.noOfBatteries || (kva >= 3 ? 8 : 3);
      const health = getBatteryHealth(asset);
      const nextMaint = getNextMaintenanceInfo(asset);

      totalKva += kva;
      totalKw += kw;
      totalConnectedKw += (kw * loadPct) / 100;
      totalCells += cells;
      healthScoresSum += health.score;

      if (health.status === 'Optimal') optimalCount++;
      else if (health.status === 'Good') goodCount++;
      else if (health.status === 'Attention') attentionCount++;
      else criticalCount++;

      if (nextMaint.isOverdue) {
        overdueMaintenanceCount++;
      } else if (nextMaint.daysRemaining <= 30) {
        next30DaysDueCount++;
      }
    });

    const avgHealthIndex = activeFleet.length > 0 ? Math.round(healthScoresSum / activeFleet.length) : 0;
    const avgLoadPct = totalKw > 0 ? Math.round((totalConnectedKw / totalKw) * 100) : 0;
    const headroomKw = Number((totalKw - totalConnectedKw).toFixed(1));

    return {
      totalKva: Number(totalKva.toFixed(1)),
      totalKw: Number(totalKw.toFixed(1)),
      totalConnectedKw: Number(totalConnectedKw.toFixed(1)),
      headroomKw,
      avgLoadPct,
      totalCells,
      avgHealthIndex,
      optimalCount,
      goodCount,
      attentionCount,
      criticalCount,
      overdueMaintenanceCount,
      next30DaysDueCount,
      totalUnits: activeFleet.length,
    };
  }, [activeFleet]);

  // 2. Capacity Distribution Chart Data (by kVA Tier)
  const capacityChartData = useMemo(() => {
    const map: Record<string, { tier: string; units: number; totalKva: number; loadKw: number }> = {
      '1 kVA': { tier: '1 kVA', units: 0, totalKva: 0, loadKw: 0 },
      '2 kVA': { tier: '2 kVA', units: 0, totalKva: 0, loadKw: 0 },
      '3 kVA': { tier: '3 kVA', units: 0, totalKva: 0, loadKw: 0 },
      '5 kVA': { tier: '5 kVA', units: 0, totalKva: 0, loadKw: 0 },
      '10+ kVA': { tier: '10+ kVA', units: 0, totalKva: 0, loadKw: 0 },
    };

    activeFleet.forEach((asset) => {
      const kva = parseKvaValue(asset);
      const kw = parseKwValue(asset);
      const load = (kw * (asset.upsSpecs?.loadPercentage || 60)) / 100;

      let key = '1 kVA';
      if (kva >= 10) key = '10+ kVA';
      else if (kva >= 5) key = '5 kVA';
      else if (kva >= 3) key = '3 kVA';
      else if (kva >= 2) key = '2 kVA';

      map[key].units += 1;
      map[key].totalKva += kva;
      map[key].loadKw += load;
    });

    return Object.values(map).map((row) => ({
      ...row,
      totalKva: Number(row.totalKva.toFixed(1)),
      loadKw: Number(row.loadKw.toFixed(1)),
    }));
  }, [activeFleet]);

  // 3. Battery Health Distribution Chart Data
  const batteryHealthChartData = useMemo(() => {
    return [
      { name: 'Optimal (90-100%)', value: fleetKpis.optimalCount, color: '#10b981', status: 'optimal' },
      { name: 'Good (75-89%)', value: fleetKpis.goodCount, color: '#3b82f6', status: 'good' },
      { name: 'Attention (50-74%)', value: fleetKpis.attentionCount, color: '#f59e0b', status: 'attention' },
      { name: 'Critical (<50%)', value: fleetKpis.criticalCount, color: '#ef4444', status: 'critical' },
    ].filter((item) => item.value > 0);
  }, [fleetKpis]);

  // 4. Upcoming Maintenance Timeline Chart Data (Grouped by schedule period)
  const maintenanceScheduleData = useMemo(() => {
    const buckets: Record<string, { label: string; order: number; units: number; cellsNeeded: number }> = {
      overdue: { label: 'Overdue', order: 1, units: 0, cellsNeeded: 0 },
      immediate: { label: 'Next 30D', order: 2, units: 0, cellsNeeded: 0 },
      q4_2026: { label: 'Oct-Dec 26', order: 3, units: 0, cellsNeeded: 0 },
      q1_2027: { label: 'Q1 2027', order: 4, units: 0, cellsNeeded: 0 },
      q2_2027: { label: 'Q2 2027', order: 5, units: 0, cellsNeeded: 0 },
      future: { label: '2028+', order: 6, units: 0, cellsNeeded: 0 },
    };

    activeFleet.forEach((asset) => {
      const info = getNextMaintenanceInfo(asset);
      const cells = asset.upsSpecs?.noOfBatteries || 3;

      if (info.isOverdue) {
        buckets.overdue.units += 1;
        buckets.overdue.cellsNeeded += cells;
      } else if (info.daysRemaining <= 30) {
        buckets.immediate.units += 1;
        buckets.immediate.cellsNeeded += cells;
      } else if (info.dueDate <= new Date('2026-12-31')) {
        buckets.q4_2026.units += 1;
        buckets.q4_2026.cellsNeeded += cells;
      } else if (info.dueDate <= new Date('2027-03-31')) {
        buckets.q1_2027.units += 1;
        buckets.q1_2027.cellsNeeded += cells;
      } else if (info.dueDate <= new Date('2027-06-30')) {
        buckets.q2_2027.units += 1;
        buckets.q2_2027.cellsNeeded += cells;
      } else {
        buckets.future.units += 1;
        buckets.future.cellsNeeded += cells;
      }
    });

    return Object.values(buckets).sort((a, b) => a.order - b.order);
  }, [activeFleet]);

  // 5. Imminent Maintenance Action Items (Next 6 items that need attention)
  const imminentMaintenanceItems = useMemo(() => {
    const historicalEntries = getStoredBatteryReplacementEntries();
    return [...activeFleet]
      .map((asset) => {
        const maint = getNextMaintenanceInfo(asset);
        const health = getBatteryHealth(asset);
        const forecast = computeUPSPredictiveForecast(asset, historicalEntries, maintenanceRecords);
        return { asset, maint, health, forecast };
      })
      .sort((a, b) => a.forecast.daysRemaining - b.forecast.daysRemaining)
      .slice(0, 6);
  }, [activeFleet, maintenanceRecords]);

  return (
    <div className="space-y-6">
      {/* SECTION HEADER & CONTROL BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-3xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="rounded-xl bg-amber-500/10 p-2 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400">
              <Activity className="h-5 w-5" />
            </div>
            <h3 className="text-base font-black text-slate-900 dark:text-white">
              Executive UPS & Power Fleet Dashboard
            </h3>
            <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
              Live Fleet Telemetry
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Real-time aggregate capacity metrics, electrochemical cell health grading, and predictive maintenance schedule.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Main Dashboard Sub-view Toggle */}
          <div className="flex rounded-xl bg-slate-100 p-1 dark:bg-slate-800 text-xs font-bold gap-1">
            <button
              type="button"
              onClick={() => setDashboardViewMode('overview')}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition ${
                dashboardViewMode === 'overview'
                  ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-900 dark:text-white'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
              }`}
            >
              <Activity className="h-3.5 w-3.5 text-amber-500" />
              <span>Capacity & Health</span>
            </button>
            <button
              type="button"
              onClick={() => setDashboardViewMode('predictive')}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition ${
                dashboardViewMode === 'predictive'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-amber-800 hover:text-amber-950 dark:text-amber-400'
              }`}
            >
              <Sparkles className="h-3.5 w-3.5 text-amber-300" />
              <span>
                Predictive Maintenance ({predictiveFleetData.criticalCount > 0 ? `${predictiveFleetData.criticalCount} Critical` : 'Forecasting Active'})
              </span>
            </button>
          </div>

          <span className="hidden sm:inline text-slate-300 dark:text-slate-700">|</span>

          {onOpenBatteryForm && (
            <button
              type="button"
              onClick={onOpenBatteryForm}
              className="flex items-center gap-1.5 rounded-xl border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-900 hover:bg-amber-100 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-300 transition"
              title="Open Official Battery Replacement Log (Image 1)"
            >
              <BatteryCharging className="h-3.5 w-3.5 text-amber-600" />
              <span>Replacement Log</span>
            </button>
          )}

          {onOpenChecklistForm && (
            <button
              type="button"
              onClick={onOpenChecklistForm}
              className="flex items-center gap-1.5 rounded-xl border border-blue-300 bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-900 hover:bg-blue-100 dark:border-blue-700 dark:bg-blue-950/40 dark:text-blue-300 transition"
              title="Open Official UPS 22-Point Backup Checklist (Image 2)"
            >
              <FileSpreadsheet className="h-3.5 w-3.5 text-blue-600" />
              <span>Backup Checklist</span>
            </button>
          )}

          {onOpenService && (
            <button
              type="button"
              onClick={() => onOpenService()}
              className="flex items-center gap-1.5 rounded-xl bg-amber-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-amber-500 transition shadow-xs"
            >
              <Wrench className="h-3.5 w-3.5" />
              <span>Log Maintenance</span>
            </button>
          )}
        </div>
      </div>

      {/* TOP KPI CARDS: 5-PILLAR ARCHITECTURE INCLUDING PREDICTIVE ETNR */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {/* Total kVA & Active Load */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-4.5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Total kVA Capacity
            </span>
            <div className="rounded-xl bg-amber-500/10 p-2 text-amber-600 dark:text-amber-400">
              <Zap className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 dark:text-white">
              {fleetKpis.totalKva}
            </span>
            <span className="text-sm font-bold text-amber-600 dark:text-amber-400 font-mono">
              kVA Total
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] border-t border-slate-100 dark:border-slate-800 pt-2.5">
            <span className="text-slate-500 dark:text-slate-400 font-medium">
              Output: <strong className="text-slate-800 dark:text-slate-200">{fleetKpis.totalKw} kW</strong>
            </span>
            <span className="font-bold text-amber-700 dark:text-amber-400">
              Load: {fleetKpis.avgLoadPct}%
            </span>
          </div>
        </div>

        {/* Battery Health Index */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-4.5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Fleet Battery Health
            </span>
            <div
              className={`rounded-xl p-2 ${
                fleetKpis.avgHealthIndex >= 80
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                  : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
              }`}
            >
              <BatteryCharging className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 dark:text-white">
              {fleetKpis.avgHealthIndex}%
            </span>
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
              Health Index
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] border-t border-slate-100 dark:border-slate-800 pt-2.5">
            <span className="text-slate-500 dark:text-slate-400 font-medium">
              {fleetKpis.totalCells} Cells (12V)
            </span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400">
              {fleetKpis.optimalCount + fleetKpis.goodCount} Normal / {fleetKpis.criticalCount} Critical
            </span>
          </div>
        </div>

        {/* Operational Redundancy & Headroom */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-4.5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Power Headroom
            </span>
            <div className="rounded-xl bg-blue-500/10 p-2 text-blue-600 dark:text-blue-400">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 dark:text-white">
              {fleetKpis.headroomKw}
            </span>
            <span className="text-sm font-bold text-blue-600 dark:text-blue-400 font-mono">
              kW Reserve
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] border-t border-slate-100 dark:border-slate-800 pt-2.5">
            <span className="text-slate-500 dark:text-slate-400 font-medium">
              Connected: <strong className="text-slate-800 dark:text-slate-200">{fleetKpis.totalConnectedKw} kW</strong>
            </span>
            <span className="font-bold text-blue-700 dark:text-blue-400">
              {fleetKpis.totalUnits} Units Online
            </span>
          </div>
        </div>

        {/* Upcoming Maintenance Alert */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-4.5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Scheduled Cycles
            </span>
            <div
              className={`rounded-xl p-2 ${
                fleetKpis.overdueMaintenanceCount > 0
                  ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                  : 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
              }`}
            >
              <Calendar className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span
              className={`text-3xl font-black ${
                fleetKpis.overdueMaintenanceCount > 0
                  ? 'text-rose-600 dark:text-rose-400'
                  : 'text-slate-900 dark:text-white'
              }`}
            >
              {fleetKpis.overdueMaintenanceCount + fleetKpis.next30DaysDueCount}
            </span>
            <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
              Units Due
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] border-t border-slate-100 dark:border-slate-800 pt-2.5">
            <span className="text-rose-600 dark:text-rose-400 font-bold">
              {fleetKpis.overdueMaintenanceCount} Overdue
            </span>
            <span className="font-medium text-slate-500 dark:text-slate-400">
              {fleetKpis.next30DaysDueCount} in next 30 days
            </span>
          </div>
        </div>

        {/* 5. PREDICTIVE REPLACEMENT FORECAST (NEW INDICATOR) */}
        <div
          onClick={() => setDashboardViewMode('predictive')}
          className="relative overflow-hidden rounded-2xl border border-amber-300 bg-gradient-to-br from-amber-500/10 via-amber-50/50 to-white p-4.5 shadow-xs dark:border-amber-800 dark:from-amber-950/30 dark:via-slate-900 dark:to-slate-900 cursor-pointer hover:border-amber-500 transition group"
          title="Click to toggle full Predictive Maintenance Forecast Engine"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-amber-600 animate-pulse" />
              <span>Predictive ETNR</span>
            </span>
            <div className="rounded-xl bg-amber-500/20 p-2 text-amber-700 dark:text-amber-300 group-hover:scale-110 transition">
              <Clock className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 dark:text-white">
              {predictiveFleetData.medianDaysRemaining}
            </span>
            <span className="text-xs font-bold text-amber-700 dark:text-amber-300 font-mono">
              Days (Median)
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] border-t border-amber-200/80 dark:border-slate-800 pt-2.5">
            <span className="font-bold text-rose-600 dark:text-rose-400">
              {predictiveFleetData.criticalCount} Critical Action
            </span>
            <span className="font-bold text-indigo-600 dark:text-indigo-400">
              {predictiveFleetData.dueWithin60Days} Due in 60d
            </span>
          </div>
        </div>
      </div>

      {/* DEDICATED PREDICTIVE MAINTENANCE INDICATOR BANNER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-2xl border border-amber-200/90 bg-gradient-to-r from-amber-500/15 via-amber-50/70 to-indigo-500/10 p-4 dark:border-amber-900/40 dark:from-amber-950/30 dark:via-slate-900/80 dark:to-indigo-950/30 text-xs">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-amber-500/20 p-2 text-amber-700 dark:text-amber-300 shrink-0">
            <Sparkles className="h-4 w-4 animate-pulse text-amber-600" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-black text-slate-900 dark:text-white text-xs">
                Predictive Maintenance Indicator:
              </span>
              <span className="font-mono text-amber-800 dark:text-amber-300 font-bold">
                Estimated Time to Next Replacement (ETNR) Active
              </span>
              <span className="rounded-md bg-white/80 dark:bg-slate-800 px-2 py-0.5 text-[10px] font-bold text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                Baseline: Nov 20, 2024 PAA Campaign
              </span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5">
              Correlates historical replacement logs with electrical load stress & thermal environment to forecast battery end-of-life.{' '}
              {predictiveFleetData.criticalCount > 0 ? (
                <strong className="text-rose-600 dark:text-rose-400 font-bold">
                  {predictiveFleetData.criticalCount} units require immediate battery bank renewal.
                </strong>
              ) : (
                <span className="text-slate-500">Fleet degradation within expected nominal cycles.</span>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setDashboardViewMode(dashboardViewMode === 'predictive' ? 'overview' : 'predictive')}
            className="flex items-center gap-1.5 rounded-xl bg-amber-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-amber-500 transition shadow-xs"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>{dashboardViewMode === 'predictive' ? 'View Telemetry Overview' : 'Open Predictive Engine'}</span>
          </button>
        </div>
      </div>

      {/* CONDITIONAL VIEW RENDERER */}
      {dashboardViewMode === 'predictive' ? (
        <UPSPredictiveMaintenancePanel
          upsAssets={activeFleet}
          maintenanceRecords={maintenanceRecords}
          onSelectAsset={onSelectAsset}
          onOpenService={onOpenService}
          onOpenBatteryForm={onOpenBatteryForm}
        />
      ) : (
        <div className="space-y-6">

      {/* CHARTS GRID: 3 PRIMARY VISUALIZATIONS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* CHART 1: TOTAL KVA CAPACITY BREAKDOWN (7 Cols) */}
        <div className="lg:col-span-7 flex flex-col rounded-3xl border border-slate-200 bg-white p-5.5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
            <div>
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-amber-500" />
                <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">
                  Capacity Distribution by kVA Rating Tier
                </h4>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Installed rating capacity (kVA) compared with actual connected load output (kW).
              </p>
            </div>
            <div className="flex items-center gap-3 text-[11px]">
              <span className="flex items-center gap-1.5 font-bold text-amber-600 dark:text-amber-400">
                <span className="h-2.5 w-2.5 rounded-sm bg-amber-500 inline-block" /> Total kVA
              </span>
              <span className="flex items-center gap-1.5 font-bold text-blue-600 dark:text-blue-400">
                <span className="h-2.5 w-2.5 rounded-sm bg-blue-500 inline-block" /> Load kW
              </span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={capacityChartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.15} />
                <XAxis
                  dataKey="tier"
                  tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }}
                  tickLine={false}
                  axisLine={{ stroke: '#cbd5e1' }}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  tickLine={false}
                  axisLine={{ stroke: '#cbd5e1' }}
                  unit=" "
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-lg dark:border-slate-700 dark:bg-slate-800 text-xs font-sans">
                          <p className="font-extrabold text-slate-900 dark:text-white mb-1.5">{data.tier} Power Tier</p>
                          <div className="space-y-1 text-slate-600 dark:text-slate-300">
                            <p className="flex justify-between gap-4">
                              <span>Installed Fleet Units:</span>
                              <strong className="text-slate-900 dark:text-white font-mono">{data.units} Units</strong>
                            </p>
                            <p className="flex justify-between gap-4">
                              <span>Total Rating Capacity:</span>
                              <strong className="text-amber-600 dark:text-amber-400 font-mono">{data.totalKva} kVA</strong>
                            </p>
                            <p className="flex justify-between gap-4">
                              <span>Connected Load:</span>
                              <strong className="text-blue-600 dark:text-blue-400 font-mono">{data.loadKw} kW</strong>
                            </p>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="totalKva" name="Total Capacity (kVA)" fill="#f59e0b" radius={[6, 6, 0, 0]} barSize={28} />
                <Bar dataKey="loadKw" name="Connected Load (kW)" fill="#3b82f6" radius={[6, 6, 0, 0]} barSize={28} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px]">
            {capacityChartData.map((tier) => (
              <div
                key={tier.tier}
                onClick={() => onFilterCapacity && onFilterCapacity(tier.tier.toLowerCase().replace(' ', ''))}
                className="cursor-pointer rounded-xl bg-slate-50 p-2 dark:bg-slate-800/60 hover:bg-amber-500/10 transition"
              >
                <div className="font-bold text-slate-700 dark:text-slate-200">{tier.tier}</div>
                <div className="text-slate-500 dark:text-slate-400 mt-0.5">
                  {tier.units} units • {tier.totalKva} kVA
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CHART 2: BATTERY HEALTH STATUS (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col rounded-3xl border border-slate-200 bg-white p-5.5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BatteryCharging className="h-4 w-4 text-emerald-500" />
                <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">
                  Battery Health & Integrity Status
                </h4>
              </div>
              <span className="text-xs font-mono font-bold text-slate-500 dark:text-slate-400">
                {fleetKpis.totalCells} Cells
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Electrochemical health breakdown and runtime backup validation.
            </p>
          </div>

          <div className="relative h-56 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={batteryHealthChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={54}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {batteryHealthChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      const pct = Math.round((data.value / fleetKpis.totalUnits) * 100);
                      return (
                        <div className="rounded-xl border border-slate-200 bg-white p-2.5 shadow-lg dark:border-slate-700 dark:bg-slate-800 text-xs">
                          <div className="font-extrabold" style={{ color: data.color }}>
                            {data.name}
                          </div>
                          <div className="text-slate-600 dark:text-slate-300 font-mono mt-1">
                            {data.value} Units ({pct}% of fleet)
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>

            {/* Inner Center Stat */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-black text-slate-900 dark:text-white">
                {fleetKpis.avgHealthIndex}%
              </span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                Index Score
              </span>
            </div>
          </div>

          {/* Health Category Legend Cards */}
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
            <div
              onClick={() => onFilterStatus && onFilterStatus('ok')}
              className="cursor-pointer rounded-xl bg-emerald-500/10 p-2 border border-emerald-500/20 text-emerald-900 dark:text-emerald-300 hover:bg-emerald-500/20 transition"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold">Optimal / Good</span>
                <span className="font-mono font-black">{fleetKpis.optimalCount + fleetKpis.goodCount}</span>
              </div>
              <div className="text-[10px] text-emerald-700 dark:text-emerald-400 mt-0.5">
                Full 10-45m load backup
              </div>
            </div>

            <div
              onClick={() => onFilterStatus && onFilterStatus('nobackup')}
              className="cursor-pointer rounded-xl bg-rose-500/10 p-2 border border-rose-500/20 text-rose-900 dark:text-rose-300 hover:bg-rose-500/20 transition"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold">Needs Action</span>
                <span className="font-mono font-black">{fleetKpis.attentionCount + fleetKpis.criticalCount}</span>
              </div>
              <div className="text-[10px] text-rose-700 dark:text-rose-400 mt-0.5">
                Overdue or &lt;50% capacity
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* CHART 3 & TIMELINE: UPCOMING MAINTENANCE SCHEDULES */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* CHART 3: SCHEDULE TIMELINE CHART (7 Cols) */}
        <div className="lg:col-span-7 flex flex-col rounded-3xl border border-slate-200 bg-white p-5.5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
            <div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-indigo-500" />
                <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">
                  Upcoming Maintenance & Replacement Cycles
                </h4>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Scheduled quarterly preventative inspections and 24-month battery bank renewals.
              </p>
            </div>
            <div className="flex items-center gap-3 text-[11px]">
              <span className="flex items-center gap-1.5 font-bold text-indigo-600 dark:text-indigo-400">
                <span className="h-2.5 w-2.5 rounded-sm bg-indigo-500 inline-block" /> Units Due
              </span>
              <span className="flex items-center gap-1.5 font-bold text-amber-600 dark:text-amber-400">
                <span className="h-2.5 w-2.5 rounded-sm bg-amber-500 inline-block" /> Cells Needed
              </span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={maintenanceScheduleData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.15} />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }}
                  tickLine={false}
                  axisLine={{ stroke: '#cbd5e1' }}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  tickLine={false}
                  axisLine={{ stroke: '#cbd5e1' }}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-lg dark:border-slate-700 dark:bg-slate-800 text-xs font-sans">
                          <p className="font-extrabold text-slate-900 dark:text-white mb-1.5">{data.label} Schedule</p>
                          <div className="space-y-1 text-slate-600 dark:text-slate-300">
                            <p className="flex justify-between gap-4">
                              <span>UPS Units Scheduled:</span>
                              <strong className="text-indigo-600 dark:text-indigo-400 font-mono">{data.units} Units</strong>
                            </p>
                            <p className="flex justify-between gap-4">
                              <span>Replacement Cells Required:</span>
                              <strong className="text-amber-600 dark:text-amber-400 font-mono">{data.cellsNeeded} Cells (12V)</strong>
                            </p>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="units" name="Units Due" fill="#6366f1" radius={[6, 6, 0, 0]} barSize={28} />
                <Bar dataKey="cellsNeeded" name="Cells Required" fill="#f59e0b" radius={[6, 6, 0, 0]} barSize={28} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-3 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-3">
            <span>
              <strong>Planning Tip:</strong> Group procurement of 12V 7.2Ah cells for Q4 2026 to ensure zero flight interruption.
            </span>
            <span className="font-bold text-indigo-600 dark:text-indigo-400">
              Procurement Target: {fleetKpis.totalCells} Max Cells
            </span>
          </div>
        </div>

        {/* IMMINENT ACTION ITEMS LIST (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col rounded-3xl border border-slate-200 bg-white p-5.5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-amber-500" />
              <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">
                Imminent Scheduled Actions
              </h4>
            </div>
            <span className="text-[10px] font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
              Closest Due
            </span>
          </div>

          <div className="flex-1 space-y-2.5 overflow-y-auto max-h-[290px] pr-1">
            {imminentMaintenanceItems.map(({ asset, maint, health, forecast }) => {
              const tag = asset.upsSpecs?.tagNo || asset.assetTag || asset.id;
              const room = asset.upsSpecs?.roomNo || asset.location?.room || 'Room';
              const model = asset.upsSpecs?.modelNo || asset.model;
              const cells = asset.upsSpecs?.noOfBatteries || 3;

              return (
                <div
                  key={asset.id}
                  onClick={() => onSelectAsset && onSelectAsset(asset)}
                  className="group flex items-center justify-between gap-3 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 hover:border-amber-400 dark:hover:border-amber-600 transition cursor-pointer"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg font-bold text-xs ${
                        maint.isOverdue
                          ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30'
                          : maint.daysRemaining <= 30
                          ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                          : 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30'
                      }`}
                    >
                      <Zap className="h-4 w-4" />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-black text-slate-900 dark:text-white truncate">
                          {tag}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400 truncate">
                          ({room})
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                        {model} • {cells}x Cells ({maint.type})
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-extrabold ${
                        maint.isOverdue
                          ? 'bg-rose-600 text-white'
                          : maint.daysRemaining <= 30
                          ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30'
                          : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {maint.isOverdue
                        ? `Overdue (${Math.abs(maint.daysRemaining)}d)`
                        : maint.daysRemaining <= 30
                        ? `Due in ${maint.daysRemaining}d`
                        : maint.dueDateStr}
                    </span>
                    <div className="flex items-center justify-end gap-1.5 mt-0.5">
                      <span className="text-[9px] text-slate-400 font-medium">
                        Health: {health.score}%
                      </span>
                      <span className="text-[9px] font-bold text-amber-600 dark:text-amber-400">
                        • Forecast: {forecast.estimatedTimeToReplacementText}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              Click any item to inspect technical specifications
            </span>
            {onOpenService && (
              <button
                type="button"
                onClick={() => onOpenService()}
                className="text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1"
              >
                <span>Log Maintenance</span>
                <ChevronRight className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  )}

</div>
);
};
