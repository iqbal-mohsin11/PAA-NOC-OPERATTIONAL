import React, { useState, useEffect } from 'react';
import { useInventory } from '../context/InventoryContext';
import { AssetItem, UPSMaintenanceRecord } from '../types/inventory';
import {
  X,
  BatteryCharging,
  Zap,
  Calendar,
  Clock,
  ShieldCheck,
  Building,
  UserCheck,
  CheckCircle2,
  DollarSign,
  FileText,
  Activity,
} from 'lucide-react';

interface UPSMaintenanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedAsset?: AssetItem | null;
}

export const UPSMaintenanceModal: React.FC<UPSMaintenanceModalProps> = ({
  isOpen,
  onClose,
  preselectedAsset,
}) => {
  const { assets, upsMaintenanceRecords, addUPSMaintenanceRecord } = useInventory();

  const upsAssets = assets.filter((a) => !a.isRemoved && (a.category === 'UPS' || a.upsSpecs !== undefined));

  const [selectedAssetId, setSelectedAssetId] = useState<string>('');
  const [upsName, setUpsName] = useState('');
  const [modelNo, setModelNo] = useState('EATON DX 1000H');
  const [serialNumber, setSerialNumber] = useState('');
  const [voltage, setVoltage] = useState('230V AC (Input: 220V/230V, Output: 230V ±1%, DC Bus: 36V DC)');
  const [roomNo, setRoomNo] = useState('Room 104');
  const [location, setLocation] = useState('Control Tower Complex, 1st Floor');
  const [maintenanceDate, setMaintenanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [batteryChangeDate, setBatteryChangeDate] = useState(new Date().toISOString().split('T')[0]);
  const [nextBatteryChangeDate, setNextBatteryChangeDate] = useState(
    new Date(Date.now() + 730 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [backupTime, setBackupTime] = useState('25 Minutes');
  const [noOfBatteries, setNoOfBatteries] = useState<number>(3);
  const [batteryBrandType, setBatteryBrandType] = useState('12V 7.2Ah VRLA AGM (Phoenix / CSB Sealed Lead-Acid)');
  const [batteryCondition, setBatteryCondition] = useState<UPSMaintenanceRecord['batteryCondition']>('Optimal (100%)');
  const [maintenanceType, setMaintenanceType] = useState<UPSMaintenanceRecord['maintenanceType']>('Battery Bank Replacement');
  const [engineer, setEngineer] = useState('Engr. Tariq Aziz (ATC Tech In-charge)');
  const [loadPercentage, setLoadPercentage] = useState<number>(55);
  const [cost, setCost] = useState<number>(18500);
  const [description, setDescription] = useState('Installed fresh VRLA battery bank in series. Verified float and boost charge voltages.');
  const [remarks, setRemarks] = useState('Mains failover test passed seamlessly. Battery runtime verified on active load.');
  const [updateAssetSpecs, setUpdateAssetSpecs] = useState(true);
  const [isSuccess, setIsSuccess] = useState(false);
  const [lastLoggedRecord, setLastLoggedRecord] = useState<UPSMaintenanceRecord | null>(null);

  useEffect(() => {
    if (preselectedAsset) {
      applyAssetData(preselectedAsset);
    } else if (upsAssets.length > 0 && !selectedAssetId) {
      applyAssetData(upsAssets[0]);
    }
  }, [preselectedAsset, isOpen]);

  const applyAssetData = (asset: AssetItem) => {
    setSelectedAssetId(asset.id);
    setUpsName(asset.name);
    setSerialNumber(asset.serialNumber || '');
    setModelNo(asset.upsSpecs?.modelNo || asset.model || 'EATON DX 1000H');
    setVoltage(asset.upsSpecs?.voltage || (asset.model.includes('3000') ? '230V AC In/Out, 96V DC Bus' : '230V AC In/Out, 36V DC Bus'));
    setRoomNo(asset.upsSpecs?.roomNo || asset.location?.room || 'Room 104');
    setLocation(`${asset.location?.building || ''}, ${asset.location?.floor || ''} ${asset.upsSpecs?.locationDetails ? `(${asset.upsSpecs.locationDetails})` : ''}`.trim());
    setBackupTime(asset.upsSpecs?.backupTime || (asset.model.includes('3000') ? '45 Minutes' : '25 Minutes'));
    setNoOfBatteries(asset.upsSpecs?.noOfBatteries || (asset.model.includes('3000') ? 8 : 3));
    setBatteryBrandType(asset.upsSpecs?.batteryType || (asset.model.includes('3000') ? '12V 9.0Ah High-Rate VRLA AGM' : '12V 7.2Ah VRLA AGM'));
    setLoadPercentage(asset.upsSpecs?.loadPercentage ?? 55);
    if (asset.upsSpecs?.lastBatteryChangeDate) {
      setBatteryChangeDate(asset.upsSpecs.lastBatteryChangeDate);
    }
    if (asset.upsSpecs?.nextBatteryChangeDate) {
      setNextBatteryChangeDate(asset.upsSpecs.nextBatteryChangeDate);
    }
  };

  const handleAssetSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const aid = e.target.value;
    setSelectedAssetId(aid);
    const target = assets.find((a) => a.id === aid);
    if (target) {
      applyAssetData(target);
    }
  };

  const handleApplyPreset = (preset: 'eaton1000' | 'eaton3000' | 'apc5000') => {
    if (preset === 'eaton1000') {
      setModelNo('EATON DX 1000H');
      setVoltage('230V AC (Input: 220V/230V, Output: 230V ±1%, DC Bus: 36V DC)');
      setRoomNo('Room 104');
      setLocation('Control Tower Complex, 1st Floor, ATC Avionics Rack');
      setBackupTime('25 Minutes (@ 70% load)');
      setNoOfBatteries(3);
      setBatteryBrandType('12V 7.2Ah VRLA AGM (Phoenix / CSB)');
      setLoadPercentage(58);
      setCost(18500);
      setDescription('Installed 3x 12V 7.2Ah batteries (36V DC bus). Calibrated float voltage and checked terminal contacts.');
    } else if (preset === 'eaton3000') {
      setModelNo('EATON 3000H');
      setVoltage('230V AC (Input: 160V-290V, Output: 230V ±1%, DC Bus: 96V DC)');
      setRoomNo('Room 202');
      setLocation('Radar Station Bravo, Ground Floor, Primary Rack 01');
      setBackupTime('45 Minutes (@ 65% load)');
      setNoOfBatteries(8);
      setBatteryBrandType('12V 9.0Ah High-Rate VRLA AGM (Narada / Exide)');
      setLoadPercentage(62);
      setCost(46000);
      setDescription('Replaced complete 8-battery bank (96V DC bus). Cleaned DC busbar terminals and performed simulated blackout transfer.');
    } else if (preset === 'apc5000') {
      setModelNo('Smart-UPS SRT 5000VA 230V');
      setVoltage('230V AC Single Phase In/Out, DC Bus: 192V DC');
      setRoomNo('Communications Room');
      setLocation('Fire Station Main Building, Ground Floor');
      setBackupTime('50 Minutes (@ 55% load)');
      setNoOfBatteries(16);
      setBatteryBrandType('12V 9Ah VRLA AGM RBC140 Cartridge');
      setLoadPercentage(55);
      setCost(120000);
      setDescription('Routine battery inspection & internal calibration on 16-battery modular bank.');
    }
  };

  const handleDateChangeCalculateNext = (dateStr: string) => {
    setBatteryChangeDate(dateStr);
    try {
      const d = new Date(dateStr);
      d.setFullYear(d.getFullYear() + 2);
      setNextBatteryChangeDate(d.toISOString().split('T')[0]);
    } catch {
      // ignore
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const record = addUPSMaintenanceRecord(
      {
        assetId: selectedAssetId || (preselectedAsset?.id ?? 'PAA-AST-UPS'),
        upsName: upsName || `${modelNo} (${roomNo})`,
        modelNo,
        serialNumber: serialNumber || 'SN-UPS-UNKNOWN',
        voltage,
        roomNo,
        location,
        maintenanceDate,
        batteryChangeDate,
        nextBatteryChangeDate,
        backupTime,
        noOfBatteries: Number(noOfBatteries) || 1,
        batteryBrandType,
        batteryCondition,
        maintenanceType,
        engineer,
        loadPercentage: Number(loadPercentage) || 50,
        cost: Number(cost) || 0,
        description,
        remarks,
      },
      updateAssetSpecs
    );

    setLastLoggedRecord(record);
    setIsSuccess(true);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 my-8 max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition"
        >
          <X className="h-5 w-5" />
        </button>

        {isSuccess ? (
          <div className="py-6 text-center space-y-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
              <CheckCircle2 className="h-10 w-10" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">UPS Service & Battery Log Saved</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Record <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{lastLoggedRecord?.id}</span> has been logged to PAA Maintenance Audit Vault.
              </p>
            </div>

            {lastLoggedRecord && (
              <div className="mx-auto max-w-lg rounded-xl border border-slate-200 bg-slate-50 p-4 text-left text-xs dark:border-slate-800 dark:bg-slate-800/60 space-y-2">
                <div className="flex justify-between border-b border-slate-200/60 pb-1.5 dark:border-slate-700">
                  <span className="text-slate-500">UPS Model & Location:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{lastLoggedRecord.modelNo} • {lastLoggedRecord.roomNo}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200/60 pb-1.5 dark:border-slate-700">
                  <span className="text-slate-500">Battery Bank:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{lastLoggedRecord.noOfBatteries}x Batteries ({lastLoggedRecord.voltage})</span>
                </div>
                <div className="flex justify-between border-b border-slate-200/60 pb-1.5 dark:border-slate-700">
                  <span className="text-slate-500">Tested Backup Time:</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">{lastLoggedRecord.backupTime}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200/60 pb-1.5 dark:border-slate-700">
                  <span className="text-slate-500">Battery Replacement:</span>
                  <span className="font-mono text-slate-800 dark:text-slate-200">{lastLoggedRecord.batteryChangeDate} (Next Due: {lastLoggedRecord.nextBatteryChangeDate})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Certified Engineer:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{lastLoggedRecord.engineer}</span>
                </div>
              </div>
            )}

            <div className="flex justify-center gap-3 pt-4">
              <button
                type="button"
                onClick={() => {
                  window.print();
                }}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              >
                Print Official Slip
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsSuccess(false);
                  onClose();
                }}
                className="rounded-xl bg-emerald-600 px-5 py-2 text-xs font-bold text-white shadow-md hover:bg-emerald-500 transition"
              >
                Done / Back to Dashboard
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Title */}
            <div>
              <div className="flex items-center gap-2">
                <div className="rounded-xl bg-amber-500/10 p-2 text-amber-600 dark:text-amber-400">
                  <BatteryCharging className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Log UPS Maintenance & Battery Bank Replacement
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Maintain critical avionics & radar backup uptime (Room 104, Room 202, Comms, ATC Tower).
                  </p>
                </div>
              </div>

              {/* Quick Model Presets */}
              <div className="mt-3 flex flex-wrap items-center gap-2 rounded-xl bg-slate-50 p-2.5 dark:bg-slate-800/60 text-xs border border-slate-200/60 dark:border-slate-700">
                <span className="font-bold text-slate-500 dark:text-slate-400 text-[11px]">Quick Airport Presets:</span>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('eaton1000')}
                  className="rounded-lg bg-white px-2.5 py-1 font-semibold text-emerald-700 shadow-xs border border-emerald-200 hover:bg-emerald-50 dark:bg-slate-900 dark:text-emerald-300 dark:border-emerald-800 text-[11px]"
                >
                  ⚡ EATON DX 1000H (Room 104 - 3 Batt)
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('eaton3000')}
                  className="rounded-lg bg-white px-2.5 py-1 font-semibold text-blue-700 shadow-xs border border-blue-200 hover:bg-blue-50 dark:bg-slate-900 dark:text-blue-300 dark:border-blue-800 text-[11px]"
                >
                  ⚡ EATON 3000H (Room 202 - 8 Batt)
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('apc5000')}
                  className="rounded-lg bg-white px-2.5 py-1 font-semibold text-purple-700 shadow-xs border border-purple-200 hover:bg-purple-50 dark:bg-slate-900 dark:text-purple-300 dark:border-purple-800 text-[11px]"
                >
                  ⚡ APC Smart-UPS 5000VA (Comms)
                </button>
              </div>
            </div>

            {/* Target Asset Selector */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Select UPS Asset from Inventory
                </label>
                <select
                  value={selectedAssetId}
                  onChange={handleAssetSelect}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 focus:border-emerald-500 focus:outline-hidden"
                >
                  <option value="">-- Manual UPS Device Entry --</option>
                  {upsAssets.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({a.id}) - {a.location?.room || 'Room N/A'}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Device Label / Name
                </label>
                <input
                  type="text"
                  value={upsName}
                  onChange={(e) => setUpsName(e.target.value)}
                  placeholder="e.g. ATC Avionics Online UPS - EATON DX 1000H"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 focus:border-emerald-500 focus:outline-hidden"
                  required
                />
              </div>
            </div>

            {/* Model, Serial & Room */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  UPS Model Number
                </label>
                <input
                  type="text"
                  value={modelNo}
                  onChange={(e) => setModelNo(e.target.value)}
                  placeholder="e.g. EATON DX 1000H or EATON 3000H"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 focus:border-emerald-500 focus:outline-hidden"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Room No / Location
                </label>
                <div className="flex gap-1">
                  <input
                    type="text"
                    value={roomNo}
                    onChange={(e) => setRoomNo(e.target.value)}
                    placeholder="e.g. Room 104, Room 202"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 focus:border-emerald-500 focus:outline-hidden"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Serial Number
                </label>
                <input
                  type="text"
                  value={serialNumber}
                  onChange={(e) => setSerialNumber(e.target.value)}
                  placeholder="e.g. EDX1000H-PK-2024-8812"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 focus:border-emerald-500 focus:outline-hidden"
                />
              </div>
            </div>

            {/* Electrical Specs & Battery Bank */}
            <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-3.5 dark:border-amber-900/60 dark:bg-amber-950/20 space-y-3">
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900 dark:text-amber-300">
                <Zap className="h-4 w-4 text-amber-600" />
                <span>Electrical & Battery Bank Parameters</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Voltage Configuration
                  </label>
                  <input
                    type="text"
                    value={voltage}
                    onChange={(e) => setVoltage(e.target.value)}
                    placeholder="e.g. 230V AC In/Out, 36V DC Bus"
                    className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Number of Batteries
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="64"
                    value={noOfBatteries}
                    onChange={(e) => setNoOfBatteries(Number(e.target.value))}
                    className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                    required
                  />
                  <span className="text-[10px] text-slate-500">DX 1000H: 3 batt | 3000H: 8 batt</span>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Tested Backup Time on Load
                  </label>
                  <input
                    type="text"
                    value={backupTime}
                    onChange={(e) => setBackupTime(e.target.value)}
                    placeholder="e.g. 25 Minutes, 45 Minutes"
                    className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400 dark:border-slate-700 dark:bg-slate-800"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Battery Model & Brand
                  </label>
                  <input
                    type="text"
                    value={batteryBrandType}
                    onChange={(e) => setBatteryBrandType(e.target.value)}
                    placeholder="e.g. 12V 7.2Ah VRLA AGM (Phoenix / CSB)"
                    className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Load Percentage During Test: {loadPercentage}%
                  </label>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    value={loadPercentage}
                    onChange={(e) => setLoadPercentage(Number(e.target.value))}
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* Dates, Service Type & Condition */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Service / Test Date
                </label>
                <input
                  type="date"
                  value={maintenanceDate}
                  onChange={(e) => setMaintenanceDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Battery Replacement Date
                </label>
                <input
                  type="date"
                  value={batteryChangeDate}
                  onChange={(e) => handleDateChangeCalculateNext(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Next Scheduled Change Date
                </label>
                <input
                  type="date"
                  value={nextBatteryChangeDate}
                  onChange={(e) => setNextBatteryChangeDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                />
              </div>
            </div>

            {/* Maintenance Type & Condition */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Maintenance Type
                </label>
                <select
                  value={maintenanceType}
                  onChange={(e) => setMaintenanceType(e.target.value as any)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                >
                  <option value="Battery Bank Replacement">Battery Bank Replacement</option>
                  <option value="Routine Battery Test & Inspection">Routine Battery Test & Inspection</option>
                  <option value="Quarterly Preventative Maintenance">Quarterly Preventative Maintenance</option>
                  <option value="Capacitor & Inverter Service">Capacitor & Inverter Service</option>
                  <option value="Emergency Overhaul">Emergency Overhaul</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Battery Condition After Service
                </label>
                <select
                  value={batteryCondition}
                  onChange={(e) => setBatteryCondition(e.target.value as any)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                >
                  <option value="Optimal (100%)">Optimal (100%) - Brand New</option>
                  <option value="Good (85%)">Good (85%) - Healthy</option>
                  <option value="Fair (65%)">Fair (65%) - Usable</option>
                  <option value="Weak / Replace Soon">Weak / Replace Soon (Warning)</option>
                  <option value="Defective / Replaced">Defective / Replaced</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Service Cost (PKR)
                </label>
                <input
                  type="number"
                  min="0"
                  value={cost}
                  onChange={(e) => setCost(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-emerald-600 dark:border-slate-700 dark:bg-slate-800"
                />
              </div>
            </div>

            {/* Engineer & Description */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Certified Avionics / Power Engineer
                </label>
                <input
                  type="text"
                  value={engineer}
                  onChange={(e) => setEngineer(e.target.value)}
                  placeholder="e.g. Engr. Tariq Aziz (ATC Tech In-charge)"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Location / Rack Details
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Control Tower Complex, 1st Floor, Rack A"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Description of Technical Actions Performed
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Details of battery torque tightening, DC bus check, float voltage verification, failover simulation..."
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Remarks & Observations
              </label>
              <input
                type="text"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="e.g. Next battery cycle inspection due in 24 months. Cleaned air filters."
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              />
            </div>

            {/* Checkbox */}
            <div className="flex items-center gap-2 rounded-xl bg-slate-50 p-3 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700">
              <input
                type="checkbox"
                id="updateAssetSpecs"
                checked={updateAssetSpecs}
                onChange={(e) => setUpdateAssetSpecs(e.target.checked)}
                className="h-4 w-4 rounded-sm border-slate-300 text-emerald-600 focus:ring-emerald-500"
              />
              <label htmlFor="updateAssetSpecs" className="text-xs text-slate-700 dark:text-slate-300">
                <span className="font-bold">Sync to Live UPS Inventory Specs:</span> Automatically update device's last battery change date, next schedule, backup time, voltage, and room number.
              </label>
            </div>

            {/* Buttons */}
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2 text-xs font-bold text-white shadow-md hover:bg-emerald-500 transition"
              >
                <BatteryCharging className="h-4 w-4" />
                <span>Commit UPS Maintenance Record</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
