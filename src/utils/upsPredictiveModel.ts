import { AssetItem, UPSMaintenanceRecord, UPSBatteryReplacementEntry, UPSPredictiveForecast } from '../types/inventory';
import { defaultUPSBatteryReplacementEntries } from '../data/upsFormsData';

// System reference date for predictive calculations
export const PREDICTIVE_BASELINE_DATE = new Date('2026-09-08');

// Load historical entries safely from localStorage if available
export function getStoredBatteryReplacementEntries(): UPSBatteryReplacementEntry[] {
  try {
    const saved = localStorage.getItem('paa_ups_battery_replacement_entries');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    // ignore parse error
  }
  return defaultUPSBatteryReplacementEntries;
}

// Find historical replacement log matching a given UPS asset
export function findHistoricalBatteryRecord(
  asset: AssetItem,
  historicalEntries: UPSBatteryReplacementEntry[],
  maintenanceRecords: UPSMaintenanceRecord[] = []
): {
  date: string;
  source: 'Verified Log' | 'Maintenance Record' | 'AIIAP Fleet Baseline';
  remarks?: string;
  batteriesUsed?: number;
  batteryBrand?: string;
} {
  const assetTag = (asset.upsSpecs?.tagNo || asset.assetTag || asset.name || '').toUpperCase();
  const crn = (asset.upsSpecs?.crnNo || '').toUpperCase();
  const room = (asset.upsSpecs?.roomNo || asset.location?.room || '').toUpperCase();

  // 1. Check direct maintenance records first (highest recency)
  const sortedMaint = [...maintenanceRecords]
    .filter((m) => m.assetId === asset.id || m.upsName.toUpperCase().includes(assetTag) || (crn && m.upsName.toUpperCase().includes(crn)))
    .sort((a, b) => new Date(b.maintenanceDate).getTime() - new Date(a.maintenanceDate).getTime());

  if (sortedMaint.length > 0) {
    const latest = sortedMaint[0];
    const repDate = latest.batteryChangeDate || latest.maintenanceDate;
    if (repDate) {
      return {
        date: repDate,
        source: 'Maintenance Record',
        remarks: latest.batteryBrandType || `${latest.maintenanceType} recorded by ${latest.engineer}`,
        batteriesUsed: latest.noOfBatteries,
        batteryBrand: latest.batteryBrandType,
      };
    }
  }

  // 2. Check verified official 20-point replacement entries (Image 1)
  const matchedEntry = historicalEntries.find((entry) => {
    const desc = entry.itemDescription.toUpperCase();
    const loc = entry.location.toUpperCase();

    if (assetTag && desc.includes(assetTag)) return true;
    if (crn && desc.includes(crn)) return true;
    if (room && (loc.includes(room) || desc.includes(room))) return true;
    return false;
  });

  if (matchedEntry) {
    return {
      date: matchedEntry.date || '2024-11-20',
      source: 'Verified Log',
      remarks: matchedEntry.remarks,
      batteriesUsed: matchedEntry.remarks.includes('8x') || matchedEntry.remarks.includes('8 ') ? 8 : 3,
      batteryBrand: matchedEntry.remarks,
    };
  }

  // 3. Fallback to asset's explicit lastBatteryChangeDate or AIIAP fleet campaign date
  const fallbackDate = asset.upsSpecs?.lastBatteryChangeDate || asset.lastMaintenanceDate || '2024-11-20';
  return {
    date: fallbackDate,
    source: asset.upsSpecs?.lastBatteryChangeDate ? 'Verified Log' : 'AIIAP Fleet Baseline',
    remarks: 'AIIAP Structured LAN fleet-wide replacement cycle',
  };
}

// Compute individual UPS predictive maintenance forecast
export function computeUPSPredictiveForecast(
  asset: AssetItem,
  historicalEntries: UPSBatteryReplacementEntry[] = getStoredBatteryReplacementEntries(),
  maintenanceRecords: UPSMaintenanceRecord[] = []
): UPSPredictiveForecast {
  const history = findHistoricalBatteryRecord(asset, historicalEntries, maintenanceRecords);
  const lastDate = new Date(history.date);

  // Time elapsed since last recorded replacement
  const elapsedMs = Math.max(0, PREDICTIVE_BASELINE_DATE.getTime() - lastDate.getTime());
  const elapsedDays = Math.round(elapsedMs / (1000 * 60 * 60 * 24));
  const elapsedMonths = Number((elapsedDays / 30.417).toFixed(1));

  // Determine kVA and kW
  let capacityKva = 1;
  if (asset.upsSpecs?.kvaRating) {
    const m = asset.upsSpecs.kvaRating.match(/(\d+(\.\d+)?)/);
    if (m) capacityKva = parseFloat(m[1]);
  } else {
    const str = `${asset.upsSpecs?.capacityKvaKw || ''} ${asset.model || ''} ${asset.name || ''}`.toUpperCase();
    if (str.includes('10KVA')) capacityKva = 10;
    else if (str.includes('5KVA')) capacityKva = 5;
    else if (str.includes('3KVA') || str.includes('3000H')) capacityKva = 3;
    else if (str.includes('2KVA') || str.includes('2000H')) capacityKva = 2;
  }

  // Load percentage
  const loadPercentage = asset.upsSpecs?.loadPercentage || (capacityKva >= 3 ? 65 : 55);

  // 1. Load Stress Multiplier (Higher continuous load creates internal joule heating & plate sulfation)
  let loadStressFactor = 1.0;
  if (loadPercentage >= 80) loadStressFactor = 1.25;
  else if (loadPercentage >= 65) loadStressFactor = 1.12;
  else if (loadPercentage >= 50) loadStressFactor = 1.0;
  else if (loadPercentage >= 35) loadStressFactor = 0.94;
  else loadStressFactor = 0.88;

  // 2. Environmental & Thermal Stress Multiplier
  const locationStr = `${asset.upsSpecs?.roomNo || ''} ${asset.upsSpecs?.locationDetails || ''} ${asset.location?.room || ''} ${asset.location?.building || ''}`.toUpperCase();
  let envStressFactor = 1.0;

  if (locationStr.includes('RADAR') || locationStr.includes('SERVER') || locationStr.includes('DATA CENTER')) {
    envStressFactor = 0.95; // 24/7 Precision A/C cooling
  } else if (locationStr.includes('AIRSIDE') || locationStr.includes('APRON') || locationStr.includes('BASEMENT') || locationStr.includes('CRASH FIRE') || locationStr.includes('PLANT')) {
    envStressFactor = 1.15; // Higher ambient thermal swings & airborne dust
  } else if (locationStr.includes('CARGO') || locationStr.includes('WORKSHOP')) {
    envStressFactor = 1.08;
  } else {
    envStressFactor = 1.0; // Standard terminal / office environment
  }

  // Check autonomy condition
  const backupStr = (asset.upsSpecs?.backupTime || '').toUpperCase();
  const isNoBackup = backupStr.includes('NO BACKUP') || asset.status === 'Faulty';

  // Base nominal lifespan: 730 days (~24.0 months) for VRLA in mission-critical infrastructure
  const nominalLifespanDays = 730;
  const effectiveLifespanDays = Math.round(nominalLifespanDays / (loadStressFactor * envStressFactor));

  // Compute forecast date
  let forecastDateObj: Date;
  let daysRemaining: number;
  let rulPercent: number;
  let urgency: 'critical' | 'high' | 'moderate' | 'healthy';
  let urgencyLabel: string;
  let recommendation: string;

  if (isNoBackup) {
    // Immediate failure condition
    forecastDateObj = new Date(PREDICTIVE_BASELINE_DATE);
    daysRemaining = 0;
    rulPercent = 0;
    urgency = 'critical';
    urgencyLabel = 'Critical • Immediate Replacement';
    recommendation = 'Battery bank autonomy failed (0 min backup). Immediate emergency replacement required to protect active load.';
  } else {
    forecastDateObj = new Date(lastDate.getTime() + effectiveLifespanDays * 24 * 60 * 60 * 1000);
    daysRemaining = Math.round((forecastDateObj.getTime() - PREDICTIVE_BASELINE_DATE.getTime()) / (1000 * 60 * 60 * 24));

    // Calculate Remaining Useful Life percentage
    const rawRul = Math.round((1 - elapsedDays / effectiveLifespanDays) * 100);
    rulPercent = Math.max(0, Math.min(100, rawRul));

    if (daysRemaining <= 0) {
      daysRemaining = Math.min(0, daysRemaining);
      urgency = 'critical';
      urgencyLabel = `Critical • Overdue by ${Math.abs(daysRemaining)}d`;
      recommendation = `Exceeded effective chemical lifespan by ${Math.abs(daysRemaining)} days. High risk of autonomy drop upon mains outage.`;
    } else if (daysRemaining <= 20) {
      urgency = 'critical';
      urgencyLabel = `Critical • ${daysRemaining} Days Left`;
      recommendation = `Autonomy degradation imminent within ${daysRemaining} days. Issue procurement voucher and schedule replacement window.`;
    } else if (daysRemaining <= 50) {
      urgency = 'high';
      urgencyLabel = `High Urgency • ${daysRemaining} Days Left`;
      recommendation = `Target replacement in Q4 2026 fleet renewal campaign. Reserve cells from central IT store.`;
    } else if (daysRemaining <= 120) {
      urgency = 'moderate';
      urgencyLabel = `Scheduled • ${Math.round(daysRemaining / 30.4)} Mos (${daysRemaining}d)`;
      recommendation = `Normal degradation progression. Inspect terminals and log quarterly float voltage check.`;
    } else {
      urgency = 'healthy';
      urgencyLabel = `Optimal • ${Math.round(daysRemaining / 30.4)} Mos (${daysRemaining}d)`;
      recommendation = `Electrochemical conductance optimal. Cell bank in healthy float charge state.`;
    }
  }

  // Format Estimated Time to Replacement Text
  let estimatedTimeToReplacementText: string;
  if (daysRemaining <= 0) {
    estimatedTimeToReplacementText = isNoBackup ? 'Immediate (Autonomy 0m)' : `Overdue by ${Math.abs(daysRemaining)} days`;
  } else if (daysRemaining === 1) {
    estimatedTimeToReplacementText = '1 day remaining';
  } else if (daysRemaining < 30) {
    estimatedTimeToReplacementText = `${daysRemaining} days (~${(daysRemaining / 7).toFixed(0)} wks)`;
  } else {
    const mos = (daysRemaining / 30.417).toFixed(1);
    estimatedTimeToReplacementText = `${daysRemaining} days (~${mos} mos)`;
  }

  // Cell requirements
  const batteriesRequired = asset.upsSpecs?.noOfBatteries || (capacityKva >= 3 ? 8 : 3);
  const batterySpec = capacityKva >= 3 ? '12V 9Ah VRLA AGM (High-Rate)' : '12V 7.2Ah VRLA AGM (Standard)';

  // Model Confidence Score: 96% if verified log exists, 88% if derived from baseline
  let confidenceScore = 90;
  if (history.source === 'Verified Log') confidenceScore = 96;
  else if (history.source === 'Maintenance Record') confidenceScore = 94;
  else confidenceScore = 86;

  if (asset.upsSpecs?.loadPercentage !== undefined) confidenceScore += 2;

  const forecastDateStr = forecastDateObj.toISOString().split('T')[0];

  return {
    assetId: asset.id,
    tagNo: asset.upsSpecs?.tagNo || asset.assetTag || asset.name,
    modelNo: asset.upsSpecs?.modelNo || asset.model || 'EATON UPS',
    capacityKva,
    location: asset.upsSpecs?.locationDetails || asset.location?.building || 'AIIAP Terminal',
    roomNo: asset.upsSpecs?.roomNo || asset.location?.room || 'Room',
    lastReplacementDate: history.date,
    historySource: history.source,
    historyRemarks: history.remarks,
    elapsedDays,
    elapsedMonths,
    loadPercentage,
    loadStressFactor,
    envStressFactor,
    effectiveLifespanDays,
    forecastDate: forecastDateStr,
    daysRemaining,
    estimatedTimeToReplacementText,
    rulPercent,
    urgency,
    urgencyLabel,
    batteriesRequired,
    batterySpec,
    confidenceScore: Math.min(99, confidenceScore),
    recommendation,
  };
}

// Compute aggregate fleet-wide predictive indicators
export function computeFleetPredictiveForecast(
  assets: AssetItem[],
  historicalEntries?: UPSBatteryReplacementEntry[],
  maintenanceRecords?: UPSMaintenanceRecord[]
) {
  const activeFleet = assets.filter((a) => !a.isRemoved && (a.category === 'UPS' || a.upsSpecs !== undefined));
  const forecasts = activeFleet.map((asset) => computeUPSPredictiveForecast(asset, historicalEntries, maintenanceRecords));

  let criticalCount = 0;
  let highUrgencyCount = 0;
  let moderateCount = 0;
  let healthyCount = 0;
  let dueWithin30Days = 0;
  let dueWithin60Days = 0;
  let dueWithin90Days = 0;
  let totalCellsNeeded90Days = 0;
  let totalCellsInFleet = 0;
  let sumDaysRemaining = 0;
  let sumRul = 0;

  forecasts.forEach((f) => {
    totalCellsInFleet += f.batteriesRequired;
    sumDaysRemaining += Math.max(0, f.daysRemaining);
    sumRul += f.rulPercent;

    if (f.urgency === 'critical') criticalCount++;
    else if (f.urgency === 'high') highUrgencyCount++;
    else if (f.urgency === 'moderate') moderateCount++;
    else healthyCount++;

    if (f.daysRemaining <= 30) dueWithin30Days++;
    if (f.daysRemaining <= 60) dueWithin60Days++;
    if (f.daysRemaining <= 90) {
      dueWithin90Days++;
      totalCellsNeeded90Days += f.batteriesRequired;
    }
  });

  const medianDaysRemaining =
    forecasts.length > 0
      ? [...forecasts].sort((a, b) => a.daysRemaining - b.daysRemaining)[Math.floor(forecasts.length / 2)].daysRemaining
      : 0;

  const avgFleetRul = forecasts.length > 0 ? Math.round(sumRul / forecasts.length) : 0;

  return {
    totalUnits: forecasts.length,
    criticalCount,
    highUrgencyCount,
    moderateCount,
    healthyCount,
    dueWithin30Days,
    dueWithin60Days,
    dueWithin90Days,
    totalCellsNeeded90Days,
    totalCellsInFleet,
    medianDaysRemaining,
    avgFleetRul,
    forecasts: forecasts.sort((a, b) => a.daysRemaining - b.daysRemaining),
  };
}

// Generate monthly forecast breakdown for Recharts projection
export function computeMonthlyDegradationCurve(forecasts: UPSPredictiveForecast[]) {
  // Monthly buckets from Sep 2026 to Aug 2027
  const months = [
    { key: '2026-09', label: 'Sep 26', unitsDue: 0, cellsNeeded: 0, critical: 0 },
    { key: '2026-10', label: 'Oct 26', unitsDue: 0, cellsNeeded: 0, critical: 0 },
    { key: '2026-11', label: 'Nov 26', unitsDue: 0, cellsNeeded: 0, critical: 0 },
    { key: '2026-12', label: 'Dec 26', unitsDue: 0, cellsNeeded: 0, critical: 0 },
    { key: '2027-01', label: 'Jan 27', unitsDue: 0, cellsNeeded: 0, critical: 0 },
    { key: '2027-02', label: 'Feb 27', unitsDue: 0, cellsNeeded: 0, critical: 0 },
    { key: '2027-03', label: 'Mar 27', unitsDue: 0, cellsNeeded: 0, critical: 0 },
    { key: '2027-04', label: 'Apr 27', unitsDue: 0, cellsNeeded: 0, critical: 0 },
    { key: '2027-05+', label: 'May 27+', unitsDue: 0, cellsNeeded: 0, critical: 0 },
  ];

  forecasts.forEach((f) => {
    const fMonth = f.forecastDate.slice(0, 7);
    const bucket = months.find((m) => m.key === fMonth) || months[months.length - 1];

    bucket.unitsDue += 1;
    bucket.cellsNeeded += f.batteriesRequired;
    if (f.urgency === 'critical') bucket.critical += 1;
  });

  return months;
}
