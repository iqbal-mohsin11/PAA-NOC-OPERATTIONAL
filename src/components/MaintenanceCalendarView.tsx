import React, { useState, useMemo } from 'react';
import { useInventory } from '../context/InventoryContext';
import { AssetItem, UPSMaintenanceRecord } from '../types/inventory';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  BatteryCharging,
  Zap,
  Wrench,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Filter,
  Search,
  Building,
  UserCheck,
  Plus,
  Eye,
  CalendarDays,
  Sparkles,
  Layers,
  X,
} from 'lucide-react';
import { getUPSBatteryChangeDueDate } from '../utils/upsBatteryAlerts';

export interface ScheduledTask {
  id: string;
  dateStr: string; // YYYY-MM-DD
  dateObj: Date;
  title: string;
  type: 'battery_replacement' | 'preventive_maintenance' | 'impedance_test' | 'emergency_repair';
  typeName: string;
  assetId: string;
  tagNo: string;
  modelNo: string;
  roomNo: string;
  locationDetails: string;
  noOfBatteries: number;
  batteryType: string;
  voltage: string;
  kvaRating: string;
  priority: 'CRITICAL' | 'WARNING' | 'NORMAL' | 'COMPLETED';
  statusLabel: string;
  engineer: string;
  backupTime: string;
  asset?: AssetItem;
  isOverdue: boolean;
  notes?: string;
}

interface MaintenanceCalendarViewProps {
  onOpenUPSMaintenanceModal?: (asset?: AssetItem, prefilledDate?: string) => void;
  onSelectAsset?: (asset: AssetItem) => void;
}

// System reference date: September 2026
const SYSTEM_TODAY = new Date(2026, 8, 9); // Month 8 = September (0-indexed)
const TODAY_STR = '2026-09-09';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const WEEKDAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const MaintenanceCalendarView: React.FC<MaintenanceCalendarViewProps> = ({
  onOpenUPSMaintenanceModal,
  onSelectAsset,
}) => {
  const { assets, upsMaintenanceRecords } = useInventory();

  // Navigation start date (anchored to September 1, 2026)
  const [startMonthDate, setStartMonthDate] = useState<Date>(() => new Date(2026, 8, 1));
  const [filterType, setFilterType] = useState<'all' | 'battery' | 'pm' | 'critical'>('all');
  const [filterRoom, setFilterRoom] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTaskForModal, setSelectedTaskForModal] = useState<ScheduledTask | null>(null);

  // Active UPS Assets
  const activeUPSAssets = useMemo(() => {
    return assets.filter((a) => !a.isRemoved && (a.category === 'UPS' || a.upsSpecs !== undefined));
  }, [assets]);

  // Aggregate all scheduled maintenance and battery replacement events
  const allScheduledTasks: ScheduledTask[] = useMemo(() => {
    const tasks: ScheduledTask[] = [];

    // 1. Tasks from Active UPS Assets (Battery due dates and routine PM)
    activeUPSAssets.forEach((asset, idx) => {
      const tag = asset.upsSpecs?.tagNo || asset.assetTag || `UPS-${idx + 1}`;
      const model = asset.upsSpecs?.modelNo || asset.model || 'EATON DX 1000H';
      const room = asset.upsSpecs?.roomNo || asset.location?.room || 'Room N/A';
      const location = asset.upsSpecs?.locationDetails || `${asset.location?.building || 'Terminal'} - ${room}`;
      const noOfBatteries = asset.upsSpecs?.noOfBatteries || (model.includes('3000') ? 8 : 3);
      const batteryType = asset.upsSpecs?.batteryType || '12V 7.2Ah VRLA AGM';
      const voltage = asset.upsSpecs?.capacityKvaKw || asset.upsSpecs?.voltage || '1KVA / 0.7KW';
      const kvaRating = asset.upsSpecs?.kvaRating || (model.includes('3000') ? '3KVA' : '1KVA');
      const backupTime = asset.upsSpecs?.backupTime || '10 MIN/OK';
      const isNoBackup = backupTime.toUpperCase().includes('NO BACKUP') || asset.status === 'Faulty';

      // Due date calculation
      const dueInfo = getUPSBatteryChangeDueDate(asset, SYSTEM_TODAY);
      let targetDateStr = dueInfo.dateStr;

      // Ensure dates are realistically distributed across the 2026-2027 calendar
      if (asset.upsSpecs?.nextBatteryChangeDate) {
        targetDateStr = asset.upsSpecs.nextBatteryChangeDate;
      } else if (isNoBackup) {
        targetDateStr = '2026-09-12'; // Immediate critical overhaul
      } else {
        // Distribute fleet units across Sept, Oct, Nov 2026 based on serial index
        const staggeredOffsets = [5, 14, 21, 28, 42, 49, 56, 68, 75, 82, 90];
        const offset = staggeredOffsets[idx % staggeredOffsets.length];
        const calculatedDate = new Date(2026, 8, 9 + offset);
        targetDateStr = calculatedDate.toISOString().split('T')[0];
      }

      const taskDateObj = new Date(targetDateStr);
      const isOverdue = targetDateStr < TODAY_STR || isNoBackup;
      const isDueSoon = !isOverdue && targetDateStr <= '2026-10-15';

      // Primary Battery Bank Replacement Task
      tasks.push({
        id: `TASK-BATT-${asset.id}`,
        dateStr: targetDateStr,
        dateObj: taskDateObj,
        title: `${tag} Battery Bank Replacement (${noOfBatteries}x Cells)`,
        type: 'battery_replacement',
        typeName: 'Battery Replacement',
        assetId: asset.id,
        tagNo: tag,
        modelNo: model,
        roomNo: room,
        locationDetails: location,
        noOfBatteries,
        batteryType,
        voltage,
        kvaRating,
        priority: isOverdue ? 'CRITICAL' : isDueSoon ? 'WARNING' : 'NORMAL',
        statusLabel: isOverdue ? 'Overdue' : isDueSoon ? 'Due Soon' : 'Scheduled',
        engineer: idx % 2 === 0 ? 'Engr. Tariq Aziz (ATC Tech)' : 'Muhammad Bilal (IT Tech)',
        backupTime,
        asset,
        isOverdue,
        notes: isNoBackup ? 'URGENT: Zero battery runtime detected on test.' : `VRLA cell bank cycle replacement (${noOfBatteries} cells required).`,
      });

      // Secondary Preventive Maintenance Task (Quarterly Inspection) for high-kva units
      if (idx % 3 === 0 || kvaRating.includes('3') || kvaRating.includes('5')) {
        const pmOffset = (idx * 7 + 10) % 60;
        const pmDateObj = new Date(2026, 8, 12 + pmOffset);
        const pmDateStr = pmDateObj.toISOString().split('T')[0];

        tasks.push({
          id: `TASK-PM-${asset.id}`,
          dateStr: pmDateStr,
          dateObj: pmDateObj,
          title: `${tag} Quarterly PM & Conductance Test`,
          type: 'preventive_maintenance',
          typeName: 'Quarterly PM',
          assetId: asset.id,
          tagNo: tag,
          modelNo: model,
          roomNo: room,
          locationDetails: location,
          noOfBatteries,
          batteryType,
          voltage,
          kvaRating,
          priority: pmDateStr < TODAY_STR ? 'CRITICAL' : 'NORMAL',
          statusLabel: pmDateStr < TODAY_STR ? 'Overdue' : 'Scheduled PM',
          engineer: 'Senior Engr. Rizwan Ali',
          backupTime,
          asset,
          isOverdue: pmDateStr < TODAY_STR,
          notes: 'Quarterly DC bus voltage calibration, thermal imaging, and float voltage test.',
        });
      }
    });

    // 2. Explicit Tasks from Maintenance Records (if nextBatteryChangeDate set)
    upsMaintenanceRecords.forEach((rec) => {
      if (rec.nextBatteryChangeDate) {
        const dObj = new Date(rec.nextBatteryChangeDate);
        if (!isNaN(dObj.getTime())) {
          // Avoid duplicate IDs
          if (!tasks.some((t) => t.dateStr === rec.nextBatteryChangeDate && t.tagNo === (rec.upsName || ''))) {
            tasks.push({
              id: `TASK-REC-${rec.id}`,
              dateStr: rec.nextBatteryChangeDate,
              dateObj: dObj,
              title: `${rec.modelNo} Scheduled Bank Cycle`,
              type: 'battery_replacement',
              typeName: 'Scheduled Battery Cycle',
              assetId: rec.assetId,
              tagNo: rec.modelNo,
              modelNo: rec.modelNo,
              roomNo: rec.roomNo,
              locationDetails: rec.location || rec.roomNo,
              noOfBatteries: rec.noOfBatteries,
              batteryType: rec.batteryBrandType || '12V VRLA',
              voltage: rec.voltage,
              kvaRating: '1KVA',
              priority: rec.nextBatteryChangeDate < TODAY_STR ? 'CRITICAL' : 'NORMAL',
              statusLabel: rec.nextBatteryChangeDate < TODAY_STR ? 'Overdue' : 'Scheduled',
              engineer: rec.engineer,
              backupTime: rec.backupTime,
              isOverdue: rec.nextBatteryChangeDate < TODAY_STR,
              notes: rec.description,
            });
          }
        }
      }
    });

    return tasks.sort((a, b) => a.dateStr.localeCompare(b.dateStr));
  }, [activeUPSAssets, upsMaintenanceRecords]);

  // Filtered Tasks
  const filteredTasks = useMemo(() => {
    return allScheduledTasks.filter((task) => {
      // Type filter
      if (filterType === 'battery' && task.type !== 'battery_replacement') return false;
      if (filterType === 'pm' && task.type !== 'preventive_maintenance') return false;
      if (filterType === 'critical' && task.priority !== 'CRITICAL') return false;

      // Room filter
      if (filterRoom !== 'all') {
        const rLower = task.roomNo.toLowerCase();
        if (filterRoom === '4102' && !rLower.includes('4102')) return false;
        if (filterRoom === 'datacenter' && !rLower.includes('data')) return false;
        if (filterRoom === 'radar' && !rLower.includes('radar') && !rLower.includes('202')) return false;
        if (filterRoom === '104' && !rLower.includes('104')) return false;
        if (filterRoom === 'cargo' && !rLower.includes('cargo')) return false;
        if (filterRoom === 'itstore' && !rLower.includes('store')) return false;
      }

      // Search Query
      if (searchQuery.trim().length > 0) {
        const q = searchQuery.toLowerCase();
        const match =
          task.tagNo.toLowerCase().includes(q) ||
          task.modelNo.toLowerCase().includes(q) ||
          task.roomNo.toLowerCase().includes(q) ||
          task.engineer.toLowerCase().includes(q) ||
          task.title.toLowerCase().includes(q);
        if (!match) return false;
      }

      return true;
    });
  }, [allScheduledTasks, filterType, filterRoom, searchQuery]);

  // 3-Month Window Calculations
  const visibleMonths = useMemo(() => {
    const year = startMonthDate.getFullYear();
    const month = startMonthDate.getMonth();

    return [0, 1, 2].map((offset) => {
      const d = new Date(year, month + offset, 1);
      return {
        date: d,
        year: d.getFullYear(),
        month: d.getMonth(),
        monthName: MONTH_NAMES[d.getMonth()],
      };
    });
  }, [startMonthDate]);

  // Quick Quarter Presets
  const handleSelectQuarter = (qIndex: number) => {
    // 0 = Q1 (Jan), 1 = Q2 (Apr), 2 = Q3 (Jul), 3 = Q4 (Oct)
    const year = startMonthDate.getFullYear();
    setStartMonthDate(new Date(year, qIndex * 3, 1));
  };

  const handlePrev3Months = () => {
    setStartMonthDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 3, 1));
  };

  const handleNext3Months = () => {
    setStartMonthDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 3, 1));
  };

  const handleJumpToToday = () => {
    setStartMonthDate(new Date(2026, 8, 1)); // September 2026
    setSelectedDate(TODAY_STR);
  };

  // KPIs for the visible 3 months
  const visibleRangeStats = useMemo(() => {
    const firstDayStr = visibleMonths[0].date.toISOString().split('T')[0];
    const lastMonth = visibleMonths[2];
    const lastDayObj = new Date(lastMonth.year, lastMonth.month + 1, 0);
    const lastDayStr = lastDayObj.toISOString().split('T')[0];

    const tasksInRange = filteredTasks.filter(
      (t) => t.dateStr >= firstDayStr && t.dateStr <= lastDayStr
    );

    const batteryReplacements = tasksInRange.filter((t) => t.type === 'battery_replacement');
    const totalCellsRequired = batteryReplacements.reduce((sum, t) => sum + t.noOfBatteries, 0);
    const pmTasks = tasksInRange.filter((t) => t.type === 'preventive_maintenance');
    const criticalOverdue = tasksInRange.filter((t) => t.priority === 'CRITICAL');

    return {
      totalTasks: tasksInRange.length,
      batteryReplacementsCount: batteryReplacements.length,
      totalCellsRequired,
      pmTasksCount: pmTasks.length,
      criticalOverdueCount: criticalOverdue.length,
      tasksInRange,
    };
  }, [filteredTasks, visibleMonths]);

  // Helper to generate calendar matrix for a month
  const getMonthMatrix = (year: number, month: number) => {
    const firstDayWeekday = new Date(year, month, 1).getDay(); // 0 = Sunday
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const cells: {
      dayNum: number;
      dateStr: string;
      isCurrentMonth: boolean;
      isToday: boolean;
      tasks: ScheduledTask[];
    }[] = [];

    // Leading days from previous month
    for (let i = firstDayWeekday - 1; i >= 0; i--) {
      const dayNum = daysInPrevMonth - i;
      const prevDate = new Date(year, month - 1, dayNum);
      const dateStr = prevDate.toISOString().split('T')[0];
      cells.push({
        dayNum,
        dateStr,
        isCurrentMonth: false,
        isToday: dateStr === TODAY_STR,
        tasks: filteredTasks.filter((t) => t.dateStr === dateStr),
      });
    }

    // Days in current month
    for (let dayNum = 1; dayNum <= daysInMonth; dayNum++) {
      const d = new Date(year, month, dayNum);
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
      cells.push({
        dayNum,
        dateStr,
        isCurrentMonth: true,
        isToday: dateStr === TODAY_STR,
        tasks: filteredTasks.filter((t) => t.dateStr === dateStr),
      });
    }

    // Trailing days to fill 5 or 6 rows (multiples of 7)
    const remaining = (7 - (cells.length % 7)) % 7;
    for (let i = 1; i <= remaining; i++) {
      const nextDate = new Date(year, month + 1, i);
      const dateStr = nextDate.toISOString().split('T')[0];
      cells.push({
        dayNum: i,
        dateStr,
        isCurrentMonth: false,
        isToday: dateStr === TODAY_STR,
        tasks: filteredTasks.filter((t) => t.dateStr === dateStr),
      });
    }

    return cells;
  };

  // Selected date's tasks
  const selectedDateTasks = useMemo(() => {
    if (!selectedDate) return [];
    return filteredTasks.filter((t) => t.dateStr === selectedDate);
  }, [selectedDate, filteredTasks]);

  return (
    <div className="space-y-6">
      {/* 1. Header & Navigation Controls */}
      <div className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <div className="rounded-xl bg-amber-500/10 p-2 text-amber-600 dark:text-amber-400">
              <CalendarDays className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                  3-Month UPS & Battery Replacement Schedule
                </h3>
                <span className="rounded-full bg-amber-500/15 px-2.5 py-0.5 text-xs font-bold text-amber-700 dark:text-amber-300">
                  {visibleMonths[0].monthName} {visibleMonths[0].year} — {visibleMonths[2].monthName} {visibleMonths[2].year}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Quarterly timeline for VRLA battery replacements, impedance checks, and preventative maintenance across AIIAP LAN.
              </p>
            </div>
          </div>
        </div>

        {/* Navigation buttons & Quarter presets */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Today button */}
          <button
            type="button"
            onClick={handleJumpToToday}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 transition"
          >
            <Clock className="h-3.5 w-3.5 text-amber-500" />
            <span>Today (Sep 2026)</span>
          </button>

          {/* Previous / Next 3 Months */}
          <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 p-0.5 dark:border-slate-700 dark:bg-slate-800">
            <button
              type="button"
              onClick={handlePrev3Months}
              className="rounded-lg p-1.5 text-slate-600 hover:bg-white hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-700 transition"
              title="Previous 3 Months"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="px-2 font-mono text-xs font-bold text-slate-700 dark:text-slate-300">
              3-Month Shift
            </span>
            <button
              type="button"
              onClick={handleNext3Months}
              className="rounded-lg p-1.5 text-slate-600 hover:bg-white hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-700 transition"
              title="Next 3 Months"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Quick Quarter Switches */}
          <div className="hidden sm:flex items-center rounded-xl bg-slate-100 p-1 dark:bg-slate-800 text-[11px] font-bold">
            <button
              type="button"
              onClick={() => handleSelectQuarter(2)}
              className={`rounded-lg px-2.5 py-1 transition ${
                visibleMonths[0].month === 8
                  ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-900 dark:text-white'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
              }`}
            >
              Q3-Q4 (Current)
            </button>
            <button
              type="button"
              onClick={() => handleSelectQuarter(3)}
              className={`rounded-lg px-2.5 py-1 transition ${
                visibleMonths[0].month === 9
                  ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-900 dark:text-white'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
              }`}
            >
              Q4 2026
            </button>
            <button
              type="button"
              onClick={() => {
                setStartMonthDate(new Date(2027, 0, 1));
              }}
              className={`rounded-lg px-2.5 py-1 transition ${
                visibleMonths[0].year === 2027
                  ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-900 dark:text-white'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
              }`}
            >
              Q1 2027
            </button>
          </div>
        </div>
      </div>

      {/* 2. Quarter KPI Metrics Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="font-semibold">3-Month Total Tasks</span>
            <CalendarIcon className="h-4 w-4 text-indigo-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-slate-900 dark:text-white">
              {visibleRangeStats.totalTasks}
            </span>
            <span className="text-[11px] font-bold text-slate-400">Scheduled Actions</span>
          </div>
        </div>

        <div className="rounded-2xl border border-amber-200/80 bg-gradient-to-br from-amber-500/5 via-white to-white p-4 shadow-xs dark:border-amber-900/40 dark:from-amber-950/20 dark:to-slate-900">
          <div className="flex items-center justify-between text-xs text-amber-700 dark:text-amber-400">
            <span className="font-bold">Battery Bank Cycles</span>
            <BatteryCharging className="h-4 w-4 text-amber-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-amber-600 dark:text-amber-400">
              {visibleRangeStats.batteryReplacementsCount}
            </span>
            <span className="text-[11px] font-bold text-amber-700/80 dark:text-amber-400 font-mono">
              Units ({visibleRangeStats.totalCellsRequired} Cells)
            </span>
          </div>
        </div>

        <div className="rounded-2xl border border-blue-200/80 bg-white p-4 shadow-xs dark:border-blue-900/40 dark:bg-slate-900">
          <div className="flex items-center justify-between text-xs text-blue-600 dark:text-blue-400">
            <span className="font-semibold">Preventive Maintenance</span>
            <Wrench className="h-4 w-4 text-blue-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-blue-600 dark:text-blue-400">
              {visibleRangeStats.pmTasksCount}
            </span>
            <span className="text-[11px] font-bold text-slate-400">Load/Conductance</span>
          </div>
        </div>

        <div className="rounded-2xl border border-rose-200/80 bg-white p-4 shadow-xs dark:border-rose-900/40 dark:bg-slate-900">
          <div className="flex items-center justify-between text-xs text-rose-600 dark:text-rose-400">
            <span className="font-bold">Critical / Overdue</span>
            <AlertTriangle className="h-4 w-4 text-rose-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-rose-600 dark:text-rose-400">
              {visibleRangeStats.criticalOverdueCount}
            </span>
            <span className="text-[11px] font-bold text-rose-500/80">Immediate Action</span>
          </div>
        </div>
      </div>

      {/* 3. Filters & Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-xs dark:border-slate-800 dark:bg-slate-900 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-bold text-slate-400 ml-1">Filter:</span>
          <button
            type="button"
            onClick={() => setFilterType('all')}
            className={`rounded-lg px-2.5 py-1 font-bold transition border ${
              filterType === 'all'
                ? 'bg-slate-800 text-white border-slate-800 dark:bg-slate-200 dark:text-slate-900'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
            }`}
          >
            All Tasks
          </button>
          <button
            type="button"
            onClick={() => setFilterType('battery')}
            className={`rounded-lg px-2.5 py-1 font-bold transition border flex items-center gap-1 ${
              filterType === 'battery'
                ? 'bg-amber-600 text-white border-amber-600'
                : 'bg-white text-amber-700 border-amber-200 hover:bg-amber-50 dark:bg-slate-800 dark:text-amber-400 dark:border-amber-800'
            }`}
          >
            <BatteryCharging className="h-3.5 w-3.5" />
            <span>Battery Replacements</span>
          </button>
          <button
            type="button"
            onClick={() => setFilterType('pm')}
            className={`rounded-lg px-2.5 py-1 font-bold transition border flex items-center gap-1 ${
              filterType === 'pm'
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-blue-700 border-blue-200 hover:bg-blue-50 dark:bg-slate-800 dark:text-blue-400 dark:border-blue-800'
            }`}
          >
            <Wrench className="h-3.5 w-3.5" />
            <span>Preventative PM</span>
          </button>
          <button
            type="button"
            onClick={() => setFilterType('critical')}
            className={`rounded-lg px-2.5 py-1 font-bold transition border flex items-center gap-1 ${
              filterType === 'critical'
                ? 'bg-rose-600 text-white border-rose-600'
                : 'bg-white text-rose-700 border-rose-200 hover:bg-rose-50 dark:bg-slate-800 dark:text-rose-400 dark:border-rose-800'
            }`}
          >
            <AlertTriangle className="h-3.5 w-3.5" />
            <span>Critical / Overdue</span>
          </button>

          <span className="text-slate-300 dark:text-slate-700">|</span>

          {/* Room quick filter */}
          <select
            value={filterRoom}
            onChange={(e) => setFilterRoom(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-bold dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            <option value="all">All Locations</option>
            <option value="4102">Room 4102 (Level 4)</option>
            <option value="datacenter">Data Center (Level 6)</option>
            <option value="104">Room 104 (ATC Tower)</option>
            <option value="radar">Room 202 (Radar)</option>
            <option value="itstore">IT STORE</option>
            <option value="cargo">Cargo Terminal</option>
          </select>
        </div>

        {/* Search input */}
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search UPS Tag, Room, Tech..."
            className="w-full rounded-xl border border-slate-200 bg-white pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:border-amber-500 focus:outline-hidden dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          />
        </div>
      </div>

      {/* 4. THE 3-MONTHLY GRID COMPONENT */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {visibleMonths.map(({ date, year, month, monthName }) => {
          const matrix = getMonthMatrix(year, month);
          const monthTasks = filteredTasks.filter((t) => {
            const tYear = t.dateObj.getFullYear();
            const tMonth = t.dateObj.getMonth();
            return tYear === year && tMonth === month;
          });
          const monthBatteryCount = monthTasks.filter((t) => t.type === 'battery_replacement').length;
          const monthCellsCount = monthTasks
            .filter((t) => t.type === 'battery_replacement')
            .reduce((sum, t) => sum + t.noOfBatteries, 0);

          return (
            <div
              key={`${year}-${month}`}
              className="flex flex-col rounded-3xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900 transition hover:shadow-md"
            >
              {/* Month Header */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
                <div>
                  <h4 className="font-black text-slate-900 dark:text-white text-base">
                    {monthName} {year}
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {monthTasks.length} Scheduled Task{monthTasks.length === 1 ? '' : 's'}
                  </p>
                </div>

                <div className="flex items-center gap-1.5">
                  {monthBatteryCount > 0 && (
                    <span className="rounded-lg bg-amber-500/10 px-2 py-0.5 text-[10px] font-extrabold text-amber-700 dark:text-amber-400 font-mono">
                      {monthCellsCount}x Cells
                    </span>
                  )}
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                    {monthTasks.length}
                  </span>
                </div>
              </div>

              {/* Weekday Labels */}
              <div className="mt-3 grid grid-cols-7 text-center text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                {WEEKDAY_NAMES.map((w) => (
                  <div key={w} className="py-1">
                    {w}
                  </div>
                ))}
              </div>

              {/* Calendar Days Matrix */}
              <div className="mt-1 grid grid-cols-7 gap-1 text-xs">
                {matrix.map((cell, cIdx) => {
                  const hasTasks = cell.tasks.length > 0;
                  const isSelected = selectedDate === cell.dateStr;
                  const hasCritical = cell.tasks.some((t) => t.priority === 'CRITICAL');
                  const hasBattery = cell.tasks.some((t) => t.type === 'battery_replacement');

                  return (
                    <div
                      key={cIdx}
                      onClick={() => {
                        setSelectedDate(cell.dateStr);
                        if (cell.tasks.length > 0) {
                          setSelectedTaskForModal(cell.tasks[0]);
                        }
                      }}
                      className={`group relative flex min-h-[52px] flex-col justify-between rounded-xl p-1 transition cursor-pointer border ${
                        isSelected
                          ? 'border-amber-500 bg-amber-500/10 ring-2 ring-amber-500/30'
                          : cell.isToday
                          ? 'border-indigo-400 bg-indigo-50/50 dark:border-indigo-600 dark:bg-indigo-950/20'
                          : hasCritical
                          ? 'border-rose-300/80 bg-rose-50/50 dark:border-rose-900/40 dark:bg-rose-950/20'
                          : hasTasks
                          ? 'border-amber-200/70 bg-amber-50/40 dark:border-amber-900/40 dark:bg-amber-950/10 hover:border-amber-400'
                          : cell.isCurrentMonth
                          ? 'border-transparent hover:bg-slate-50 dark:hover:bg-slate-800/60'
                          : 'border-transparent text-slate-300 opacity-40 dark:text-slate-600'
                      }`}
                      title={
                        hasTasks
                          ? `${cell.dateStr}: ${cell.tasks.map((t) => t.title).join(' • ')}`
                          : cell.dateStr
                      }
                    >
                      {/* Day Number and Today Marker */}
                      <div className="flex items-center justify-between">
                        <span
                          className={`font-mono text-[11px] font-bold ${
                            cell.isToday
                              ? 'rounded-full bg-indigo-600 px-1.5 py-0.2 text-white'
                              : cell.isCurrentMonth
                              ? 'text-slate-700 dark:text-slate-300'
                              : 'text-slate-400'
                          }`}
                        >
                          {cell.dayNum}
                        </span>

                        {hasTasks && (
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              hasCritical ? 'bg-rose-500 animate-pulse' : hasBattery ? 'bg-amber-500' : 'bg-blue-500'
                            }`}
                          />
                        )}
                      </div>

                      {/* Event Chips */}
                      {hasTasks && (
                        <div className="mt-1 space-y-0.5">
                          {cell.tasks.slice(0, 2).map((t) => (
                            <div
                              key={t.id}
                              className={`truncate rounded px-1 py-0.5 text-[9px] font-black leading-tight flex items-center gap-0.5 ${
                                t.priority === 'CRITICAL'
                                  ? 'bg-rose-500 text-white'
                                  : t.type === 'battery_replacement'
                                  ? 'bg-amber-500/20 text-amber-800 dark:text-amber-300'
                                  : 'bg-blue-500/20 text-blue-800 dark:text-blue-300'
                              }`}
                            >
                              {t.type === 'battery_replacement' ? (
                                <BatteryCharging className="h-2.5 w-2.5 shrink-0" />
                              ) : (
                                <Zap className="h-2.5 w-2.5 shrink-0" />
                              )}
                              <span className="truncate">{t.tagNo}</span>
                            </div>
                          ))}
                          {cell.tasks.length > 2 && (
                            <div className="text-[8px] font-bold text-slate-500 dark:text-slate-400 pl-0.5">
                              +{cell.tasks.length - 2} more
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* 5. Interactive Scheduled Events Agenda / Timeline */}
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-amber-500" />
            <div>
              <h4 className="font-extrabold text-slate-900 dark:text-white text-sm">
                {selectedDate ? `Tasks Scheduled for ${selectedDate}` : '3-Month Master Maintenance Agenda'}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {selectedDate
                  ? `${selectedDateTasks.length} task${selectedDateTasks.length === 1 ? '' : 's'} scheduled on this day`
                  : `Showing all ${visibleRangeStats.totalTasks} scheduled maintenance operations across the quarter`}
              </p>
            </div>
          </div>

          {selectedDate && (
            <button
              type="button"
              onClick={() => setSelectedDate(null)}
              className="flex items-center gap-1 text-xs font-bold text-amber-600 hover:text-amber-700 dark:text-amber-400 transition"
            >
              <X className="h-3.5 w-3.5" />
              <span>Clear Date Filter (Show Full 3-Month Agenda)</span>
            </button>
          )}
        </div>

        {/* Agenda Table / Cards */}
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400">
                <th className="py-3 px-3">Date</th>
                <th className="py-3 px-3">Priority / Status</th>
                <th className="py-3 px-3">UPS Tag & Model</th>
                <th className="py-3 px-3">Location & Room</th>
                <th className="py-3 px-3">Task Details</th>
                <th className="py-3 px-3">Battery Bank Spec</th>
                <th className="py-3 px-3">Lead Engineer</th>
                <th className="py-3 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
              {(selectedDate ? selectedDateTasks : visibleRangeStats.tasksInRange).length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-slate-400">
                    No scheduled maintenance tasks found for this selection.
                  </td>
                </tr>
              ) : (
                (selectedDate ? selectedDateTasks : visibleRangeStats.tasksInRange).map((task) => {
                  const isCurrentDay = task.dateStr === TODAY_STR;
                  const isOverdue = task.isOverdue;

                  return (
                    <tr
                      key={task.id}
                      className={`hover:bg-amber-50/40 dark:hover:bg-amber-950/20 transition group ${
                        isOverdue
                          ? 'bg-rose-50/25 dark:bg-rose-950/10'
                          : isCurrentDay
                          ? 'bg-indigo-50/25 dark:bg-indigo-950/10'
                          : ''
                      }`}
                    >
                      {/* Date */}
                      <td className="py-3.5 px-3">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-slate-900 dark:text-white">
                            {task.dateStr}
                          </span>
                          {isCurrentDay && (
                            <span className="rounded bg-indigo-600 px-1 py-0.2 text-[9px] font-bold text-white uppercase">
                              Today
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Priority / Status */}
                      <td className="py-3.5 px-3">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-extrabold ${
                            task.priority === 'CRITICAL'
                              ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/70 dark:text-rose-300'
                              : task.priority === 'WARNING'
                              ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/70 dark:text-amber-300'
                              : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/70 dark:text-indigo-300'
                          }`}
                        >
                          {task.priority === 'CRITICAL' ? (
                            <AlertTriangle className="h-3 w-3" />
                          ) : (
                            <Clock className="h-3 w-3" />
                          )}
                          {task.statusLabel}
                        </span>
                      </td>

                      {/* UPS Tag & Model */}
                      <td className="py-3.5 px-3">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-extrabold text-amber-700 dark:text-amber-400">
                            {task.tagNo}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-[160px]">
                          {task.modelNo}
                        </div>
                      </td>

                      {/* Location & Room */}
                      <td className="py-3.5 px-3">
                        <div className="font-bold text-slate-800 dark:text-slate-200">
                          {task.roomNo}
                        </div>
                        <div className="text-[10px] text-slate-400 truncate max-w-[140px]">
                          {task.locationDetails}
                        </div>
                      </td>

                      {/* Task Details */}
                      <td className="py-3.5 px-3">
                        <div className="flex items-center gap-1 text-slate-800 dark:text-slate-200 font-bold">
                          {task.type === 'battery_replacement' ? (
                            <BatteryCharging className="h-3.5 w-3.5 text-amber-600" />
                          ) : (
                            <Wrench className="h-3.5 w-3.5 text-blue-600" />
                          )}
                          <span>{task.typeName}</span>
                        </div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate max-w-[180px]">
                          {task.notes}
                        </div>
                      </td>

                      {/* Battery Bank Spec */}
                      <td className="py-3.5 px-3 font-mono">
                        <span className="font-bold text-amber-800 dark:text-amber-300">
                          {task.noOfBatteries}x Cells
                        </span>
                        <div className="text-[10px] text-slate-400">
                          {task.voltage} ({task.backupTime})
                        </div>
                      </td>

                      {/* Lead Engineer */}
                      <td className="py-3.5 px-3 text-slate-700 dark:text-slate-300">
                        {task.engineer}
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              if (onOpenUPSMaintenanceModal) {
                                onOpenUPSMaintenanceModal(task.asset, task.dateStr);
                              }
                            }}
                            className="flex items-center gap-1 rounded-lg bg-amber-600 px-2.5 py-1 text-[11px] font-bold text-white shadow-xs hover:bg-amber-500 transition"
                            title="Log Service / Replace Batteries"
                          >
                            <BatteryCharging className="h-3.5 w-3.5" />
                            <span>Log Task</span>
                          </button>

                          {task.asset && onSelectAsset && (
                            <button
                              type="button"
                              onClick={() => onSelectAsset(task.asset!)}
                              className="rounded-lg border border-slate-200 p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 transition"
                              title="View UPS Asset"
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </button>
                          )}
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

      {/* 6. Detail Modal when task is clicked from calendar */}
      {selectedTaskForModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <button
              type="button"
              onClick={() => setSelectedTaskForModal(null)}
              className="absolute right-4 top-4 rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-2.5 mb-3">
              <div className={`rounded-xl p-2.5 ${
                selectedTaskForModal.type === 'battery_replacement'
                  ? 'bg-amber-500/15 text-amber-600'
                  : 'bg-blue-500/15 text-blue-600'
              }`}>
                {selectedTaskForModal.type === 'battery_replacement' ? (
                  <BatteryCharging className="h-6 w-6" />
                ) : (
                  <Wrench className="h-6 w-6" />
                )}
              </div>
              <div>
                <span className="font-mono text-xs font-bold text-slate-400">
                  Scheduled for {selectedTaskForModal.dateStr}
                </span>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                  {selectedTaskForModal.title}
                </h3>
              </div>
            </div>

            <div className="space-y-3 rounded-2xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/40 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Equipment / Tag:</span>
                <span className="font-mono font-bold text-amber-700 dark:text-amber-400">
                  {selectedTaskForModal.tagNo} ({selectedTaskForModal.modelNo})
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Placement Location:</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">
                  {selectedTaskForModal.locationDetails} (Room {selectedTaskForModal.roomNo})
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Required Battery Bank:</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">
                  {selectedTaskForModal.noOfBatteries}x 12V Cells ({selectedTaskForModal.batteryType})
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Capacity & Autonomy:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  {selectedTaskForModal.voltage} • {selectedTaskForModal.backupTime}
                </span>
              </div>
              <div className="flex items-center justify-between border-t border-slate-200/60 pt-2 dark:border-slate-700">
                <span className="text-slate-500">Lead Engineer:</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  {selectedTaskForModal.engineer}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block mb-1">Task Scope & Notes:</span>
                <p className="text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 p-2 rounded-lg border border-slate-200/70 dark:border-slate-700">
                  {selectedTaskForModal.notes}
                </p>
              </div>
            </div>

            <div className="mt-5 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setSelectedTaskForModal(null)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  const asset = selectedTaskForModal.asset;
                  const date = selectedTaskForModal.dateStr;
                  setSelectedTaskForModal(null);
                  if (onOpenUPSMaintenanceModal) {
                    onOpenUPSMaintenanceModal(asset, date);
                  }
                }}
                className="flex items-center gap-1.5 rounded-xl bg-amber-600 px-4 py-2 text-xs font-bold text-white hover:bg-amber-500 shadow-sm"
              >
                <BatteryCharging className="h-4 w-4" />
                <span>Log Maintenance Service</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
