import { AssetItem } from '../types/inventory';

export interface UPSBatteryAlertItem {
  id: string; // e.g. `NOTIF-UPS-BATT-${asset.id}`
  assetId: string;
  asset: AssetItem;
  tagNo: string;
  modelNo: string;
  roomNo: string;
  locationDetails: string;
  capacityKvaKw: string;
  noOfBatteries: number;
  batteryType: string;
  backupTime: string;
  batteryChangeDate: string; // Due date in YYYY-MM-DD
  dueDate: Date;
  diffDays: number;
  isOverdue: boolean;
  severity: 'CRITICAL' | 'WARNING';
  urgencyLabel: string;
  source: 'Explicit Scheduled Date' | '24-Month VRLA Cycle' | 'Immediate Battery Fault';
}

/**
 * Calculates the target batteries change date for any UPS unit.
 * Priority order:
 * 1. Immediate Fault (NO BACKUP / Faulty state requires immediate battery overhaul)
 * 2. Explicit nextBatteryChangeDate stored in upsSpecs
 * 3. Standard 24-month (730 days) manufacturer VRLA replacement cycle from lastBatteryChangeDate
 */
export function getUPSBatteryChangeDueDate(
  asset: AssetItem,
  referenceDate: Date = new Date()
): {
  dateStr: string;
  dateObj: Date;
  diffDays: number;
  isOverdue: boolean;
  source: 'Explicit Scheduled Date' | '24-Month VRLA Cycle' | 'Immediate Battery Fault';
} {
  const backup = (asset.upsSpecs?.backupTime || '').toUpperCase();
  const isFaulty = backup.includes('NO BACKUP') || asset.status === 'Faulty' || asset.status === 'Under Repair';

  if (isFaulty) {
    const today = new Date(referenceDate);
    return {
      dateStr: today.toISOString().split('T')[0],
      dateObj: today,
      diffDays: 0,
      isOverdue: true,
      source: 'Immediate Battery Fault',
    };
  }

  // 1. Explicit scheduled battery change date
  if (asset.upsSpecs?.nextBatteryChangeDate && asset.upsSpecs.nextBatteryChangeDate.trim().length > 0) {
    const d = new Date(asset.upsSpecs.nextBatteryChangeDate);
    if (!isNaN(d.getTime())) {
      const diffMs = d.getTime() - referenceDate.getTime();
      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      return {
        dateStr: asset.upsSpecs.nextBatteryChangeDate,
        dateObj: d,
        diffDays,
        isOverdue: diffDays < 0,
        source: 'Explicit Scheduled Date',
      };
    }
  }

  // 2. Derive 24 months (730 days) from last recorded battery replacement date
  const lastDateStr = asset.upsSpecs?.lastBatteryChangeDate || asset.lastMaintenanceDate || '2024-11-20';
  const lastDate = new Date(lastDateStr);
  const validLastDate = isNaN(lastDate.getTime()) ? new Date('2024-11-20') : lastDate;

  const dueDateObj = new Date(validLastDate.getTime() + 730 * 24 * 60 * 60 * 1000);
  const dateStr = dueDateObj.toISOString().split('T')[0];
  const diffMs = dueDateObj.getTime() - referenceDate.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  return {
    dateStr,
    dateObj: dueDateObj,
    diffDays,
    isOverdue: diffDays < 0,
    source: '24-Month VRLA Cycle',
  };
}

/**
 * Returns all active UPS units whose batteries change date is within the next 30 days (or overdue).
 */
export function getUPSBatteryAlerts(
  assets: AssetItem[],
  referenceDate: Date = new Date(),
  thresholdDays: number = 30
): UPSBatteryAlertItem[] {
  const upsAssets = assets.filter(
    (a) => !a.isRemoved && (a.category === 'UPS' || a.upsSpecs !== undefined)
  );

  const alerts: UPSBatteryAlertItem[] = [];

  for (const asset of upsAssets) {
    const info = getUPSBatteryChangeDueDate(asset, referenceDate);

    // Trigger alert if within the next 30 days (or already overdue)
    if (info.diffDays <= thresholdDays) {
      const isOverdue = info.diffDays < 0;
      const severity: 'CRITICAL' | 'WARNING' = isOverdue || info.diffDays <= 7 ? 'CRITICAL' : 'WARNING';

      let urgencyLabel = '';
      if (info.diffDays < 0) {
        const absDays = Math.abs(info.diffDays);
        urgencyLabel = `Overdue by ${absDays} day${absDays === 1 ? '' : 's'}`;
      } else if (info.diffDays === 0) {
        urgencyLabel = 'Due Today';
      } else if (info.diffDays === 1) {
        urgencyLabel = 'Due Tomorrow';
      } else {
        urgencyLabel = `Due in ${info.diffDays} days`;
      }

      const tagNo = asset.upsSpecs?.tagNo || asset.assetTag || asset.name;
      const modelNo = asset.upsSpecs?.modelNo || asset.model || 'EATON UPS';
      const roomNo = asset.upsSpecs?.roomNo || asset.location?.room || 'N/A';
      const locationDetails =
        asset.upsSpecs?.locationDetails ||
        asset.location?.floor ||
        asset.location?.building ||
        'AIIAP Complex';
      const capacityKvaKw =
        asset.upsSpecs?.capacityKvaKw ||
        `${asset.upsSpecs?.kvaRating || '1KVA'} / ${asset.upsSpecs?.kwRating || '0.7KW'}`;
      const noOfBatteries = asset.upsSpecs?.noOfBatteries || 3;
      const batteryType = asset.upsSpecs?.batteryType || '12V 7.2Ah VRLA AGM';
      const backupTime = asset.upsSpecs?.backupTime || '10 MIN/OK';

      alerts.push({
        id: `NOTIF-UPS-BATT-${asset.id}`,
        assetId: asset.id,
        asset,
        tagNo,
        modelNo,
        roomNo,
        locationDetails,
        capacityKvaKw,
        noOfBatteries,
        batteryType,
        backupTime,
        batteryChangeDate: info.dateStr,
        dueDate: info.dateObj,
        diffDays: info.diffDays,
        isOverdue,
        severity,
        urgencyLabel,
        source: info.source,
      });
    }
  }

  // Sort: Overdue first (most overdue first), then closest upcoming
  alerts.sort((a, b) => a.diffDays - b.diffDays);

  return alerts;
}

/**
 * Returns summary counts for UPS battery change alerts.
 */
export function getUPSBatteryAlertSummary(
  assets: AssetItem[],
  referenceDate: Date = new Date(),
  thresholdDays: number = 30
) {
  const alerts = getUPSBatteryAlerts(assets, referenceDate, thresholdDays);
  const overdueCount = alerts.filter((a) => a.isOverdue).length;
  const upcomingWithin30DaysCount = alerts.filter((a) => !a.isOverdue && a.diffDays <= 30).length;
  const criticalCount = alerts.filter((a) => a.severity === 'CRITICAL').length;
  const warningCount = alerts.filter((a) => a.severity === 'WARNING').length;

  return {
    totalAlerts: alerts.length,
    overdueCount,
    upcomingWithin30DaysCount,
    criticalCount,
    warningCount,
    alerts,
  };
}

export type UPSSupervisorStatusTier = 'Optimal' | 'Warning' | 'Critical';

export interface UPSSupervisorStatus {
  tier: UPSSupervisorStatusTier;
  label: 'Optimal' | 'Warning' | 'Critical';
  pillClass: string;
  badgeBg: string;
  textColor: string;
  borderColor: string;
  dotColor: string;
  barGradient: string;
  reason: string;
  subtext: string;
  diffDays: number;
  dueDateStr: string;
  isFailedBattery: boolean;
  isOverdue: boolean;
}

/**
 * Calculates supervisor status tier ('Optimal' | 'Warning' | 'Critical')
 * - 'Critical' (Red for overdue maintenance or failed battery)
 * - 'Warning' (Amber for < 30 days battery life)
 * - 'Optimal' (Green for healthy battery life and normal maintenance)
 */
export function getUPSSupervisorStatus(
  asset: AssetItem,
  referenceDate: Date = new Date()
): UPSSupervisorStatus {
  const backupStr = (asset.upsSpecs?.backupTime || '').toUpperCase();
  const isFailedBattery =
    backupStr.includes('NO BACKUP') ||
    asset.status === 'Faulty' ||
    asset.status === 'Under Repair' ||
    (asset.upsSpecs?.batteryHealthPercent !== undefined && asset.upsSpecs.batteryHealthPercent < 40);

  const dueInfo = getUPSBatteryChangeDueDate(asset, referenceDate);
  const isOverdue = dueInfo.isOverdue || dueInfo.diffDays < 0;

  // 1. Critical (Red for overdue maintenance or failed battery)
  if (isFailedBattery || isOverdue) {
    let reason = '';
    let subtext = '';

    if (isFailedBattery && isOverdue) {
      reason = `Failed Battery (NO BACKUP) & Overdue (${Math.abs(dueInfo.diffDays)}d)`;
      subtext = 'Failed Battery / Overdue';
    } else if (isFailedBattery) {
      reason = 'Failed Battery: Zero or defective runtime recorded (NO BACKUP)';
      subtext = 'Failed Battery (No Backup)';
    } else {
      const absDays = Math.abs(dueInfo.diffDays);
      reason = `Overdue Maintenance: Battery replacement overdue by ${absDays} day${absDays === 1 ? '' : 's'}`;
      subtext = `Overdue by ${absDays}d`;
    }

    return {
      tier: 'Critical',
      label: 'Critical',
      pillClass: 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950/70 dark:text-rose-200 dark:border-rose-800',
      badgeBg: 'bg-rose-500/15 dark:bg-rose-500/25',
      textColor: 'text-rose-600 dark:text-rose-400',
      borderColor: 'border-rose-500',
      dotColor: 'bg-rose-500',
      barGradient: 'bg-gradient-to-r from-rose-600 to-rose-500',
      reason,
      subtext,
      diffDays: dueInfo.diffDays,
      dueDateStr: dueInfo.dateStr,
      isFailedBattery,
      isOverdue,
    };
  }

  // 2. Warning (Amber for < 30 days battery life)
  if (
    dueInfo.diffDays <= 30 ||
    (asset.upsSpecs?.batteryHealthPercent !== undefined && asset.upsSpecs.batteryHealthPercent < 75)
  ) {
    let daysLabel = '';
    if (dueInfo.diffDays === 0) daysLabel = 'Due today';
    else if (dueInfo.diffDays === 1) daysLabel = 'Due tomorrow';
    else if (dueInfo.diffDays > 1 && dueInfo.diffDays <= 30) daysLabel = `${dueInfo.diffDays}d remaining`;
    else daysLabel = 'Degraded capacity';

    const reason =
      dueInfo.diffDays <= 30
        ? `Upcoming Battery Replacement: ${daysLabel} (Due ${dueInfo.dateStr})`
        : 'Battery bank showing degraded capacity (< 75%)';

    return {
      tier: 'Warning',
      label: 'Warning',
      pillClass: 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/70 dark:text-amber-200 dark:border-amber-800',
      badgeBg: 'bg-amber-500/15 dark:bg-amber-500/25',
      textColor: 'text-amber-600 dark:text-amber-400',
      borderColor: 'border-amber-500',
      dotColor: 'bg-amber-500',
      barGradient: 'bg-gradient-to-r from-amber-600 to-amber-500',
      reason,
      subtext: daysLabel,
      diffDays: dueInfo.diffDays,
      dueDateStr: dueInfo.dateStr,
      isFailedBattery: false,
      isOverdue: false,
    };
  }

  // 3. Optimal (Green for normal battery life)
  return {
    tier: 'Optimal',
    label: 'Optimal',
    pillClass: 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/70 dark:text-emerald-300 dark:border-emerald-800',
    badgeBg: 'bg-emerald-500/15 dark:bg-emerald-500/25',
    textColor: 'text-emerald-600 dark:text-emerald-400',
    borderColor: 'border-emerald-500',
    dotColor: 'bg-emerald-500',
    barGradient: 'bg-gradient-to-r from-emerald-600 to-emerald-500',
    reason: `Battery health optimal with full backup autonomy (Due ${dueInfo.dateStr})`,
    subtext: `${dueInfo.diffDays}d remaining`,
    diffDays: dueInfo.diffDays,
    dueDateStr: dueInfo.dateStr,
    isFailedBattery: false,
    isOverdue: false,
  };
}
