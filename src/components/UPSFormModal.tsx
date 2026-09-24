import React, { useState, useEffect } from 'react';
import { useInventory } from '../context/InventoryContext';
import { AssetItem, UPSSpecs, AssetStatus } from '../types/inventory';
import {
  X,
  BatteryCharging,
  Zap,
  Building,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Tag,
  Hash,
  MapPin,
  Clock,
  Sparkles,
  Layers,
  ShieldCheck,
  RotateCcw,
} from 'lucide-react';
import { aiiapUpsRawData } from '../data/aiiapUpsData';

interface UPSFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  assetToEdit?: AssetItem | null;
  onSuccess?: (asset: AssetItem) => void;
}

export const UPSFormModal: React.FC<UPSFormModalProps> = ({
  isOpen,
  onClose,
  assetToEdit,
  onSuccess,
}) => {
  const { assets, addAsset, updateAsset } = useInventory();

  // Determine existing UPS assets to find next Tag number (e.g. UPS-21)
  const upsAssets = assets.filter((a) => !a.isRemoved && (a.category === 'UPS' || a.upsSpecs !== undefined));
  const defaultNextIndex = upsAssets.length + 1;
  const defaultTag = `UPS-${String(defaultNextIndex).padStart(2, '0')}`;
  const defaultSr = String(defaultNextIndex).padStart(2, '0');

  // Form Fields based on the AIIAP Spreadsheet
  const [srNo, setSrNo] = useState(defaultSr);
  const [tagNo, setTagNo] = useState(defaultTag);
  const [modelNo, setModelNo] = useState('EATON DX 1000H');
  const [brand, setBrand] = useState('EATON');
  const [serialNo, setSerialNo] = useState('');
  
  // Power & kVA
  const [kvaRating, setKvaRating] = useState('1KVA');
  const [kwRating, setKwRating] = useState('0.7KW');
  const [voltageString, setVoltageString] = useState('1KVA / 0.7KW');
  const [operatingVoltage, setOperatingVoltage] = useState('230V AC (Input: 160V-290V, Output: 230V ±1%, DC Bus: 36V DC)');
  
  // Airport Identification & Location
  const [crnNo, setCrnNo] = useState(`22${Math.floor(40 + Math.random() * 50)}`);
  const [locationFloor, setLocationFloor] = useState('Level 4');
  const [roomNo, setRoomNo] = useState('4102');
  const [department, setDepartment] = useState('IT Infrastructure');
  
  // Backup Time & Battery Details
  const [backupTime, setBackupTime] = useState('10 MIN/OK');
  const [backupStatus, setBackupStatus] = useState<'OK' | 'NO BACKUP'>('OK');
  const [batteryReplacementDate, setBatteryReplacementDate] = useState(new Date().toISOString().split('T')[0]);
  const [nextBatteryReplacementDate, setNextBatteryReplacementDate] = useState(
    new Date(Date.now() + 730 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [noOfBatteries, setNoOfBatteries] = useState<number>(3);
  const [batteryType, setBatteryType] = useState('12V 7.2Ah VRLA AGM (Phoenix / CSB)');
  const [batteryHealthPercent, setBatteryHealthPercent] = useState<number>(100);
  const [status, setStatus] = useState<AssetStatus>('Active');
  const [remarks, setRemarks] = useState('');

  // Hydrate form if editing
  useEffect(() => {
    if (assetToEdit && isOpen) {
      const specs = assetToEdit.upsSpecs;
      setSrNo(specs?.srNo || '01');
      setTagNo(specs?.tagNo || assetToEdit.assetTag || 'UPS-01');
      setModelNo(specs?.modelNo || assetToEdit.model || 'EATON DX 1000H');
      setBrand(assetToEdit.brand || 'EATON');
      setSerialNo(assetToEdit.serialNumber || '');
      
      const kva = specs?.kvaRating || (specs?.capacityKvaKw?.includes('1KVA') ? '1KVA' : specs?.capacityKvaKw?.includes('3KVA') ? '3KVA' : '1KVA');
      const kw = specs?.kwRating || (specs?.capacityKvaKw?.includes('0.7KW') ? '0.7KW' : specs?.capacityKvaKw?.includes('2.1KW') ? '2.1KW' : '0.7KW');
      setKvaRating(kva);
      setKwRating(kw);
      setVoltageString(specs?.capacityKvaKw || `${kva} / ${kw}`);
      setOperatingVoltage(specs?.voltage || '230V AC');
      
      setCrnNo(specs?.crnNo || assetToEdit.crnNo || '');
      setLocationFloor(assetToEdit.location?.floor || 'Level 4');
      setRoomNo(specs?.roomNo || assetToEdit.location?.room || '4102');
      setDepartment(assetToEdit.department || 'IT Infrastructure');
      
      setBackupTime(specs?.backupTime || '10 MIN/OK');
      setBackupStatus(specs?.backupStatus || (specs?.backupTime === 'NO BACKUP' ? 'NO BACKUP' : 'OK'));
      setBatteryReplacementDate(specs?.lastBatteryChangeDate || new Date().toISOString().split('T')[0]);
      setNextBatteryReplacementDate(specs?.nextBatteryChangeDate || '');
      setNoOfBatteries(specs?.noOfBatteries || 3);
      setBatteryType(specs?.batteryType || '12V 7.2Ah VRLA AGM');
      setBatteryHealthPercent(specs?.batteryHealthPercent ?? 95);
      setStatus(assetToEdit.status || 'Active');
    } else if (!assetToEdit && isOpen) {
      // Fresh new UPS
      const nextNum = upsAssets.length + 1;
      const formattedNum = String(nextNum).padStart(2, '0');
      setSrNo(formattedNum);
      setTagNo(`UPS-${formattedNum}`);
      setModelNo('EATON DX 1000H');
      setBrand('EATON');
      setSerialNo(`150831-${Math.floor(90000000 + Math.random() * 9000000)}`);
      setKvaRating('1KVA');
      setKwRating('0.7KW');
      setVoltageString('1KVA / 0.7KW');
      setOperatingVoltage('230V AC (Input: 160V-290V, Output: 230V ±1%, DC Bus: 36V DC)');
      setCrnNo(`22${Math.floor(40 + Math.random() * 50)}`);
      setLocationFloor('Level 4');
      setRoomNo('4102');
      setBackupTime('10 MIN/OK');
      setBackupStatus('OK');
      setBatteryReplacementDate(new Date().toISOString().split('T')[0]);
      setNextBatteryReplacementDate(new Date(Date.now() + 730 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
      setNoOfBatteries(3);
      setBatteryType('12V 7.2Ah VRLA AGM (Phoenix / CSB)');
      setBatteryHealthPercent(100);
      setStatus('Active');
      setRemarks('');
    }
  }, [assetToEdit, isOpen, upsAssets.length]);

  if (!isOpen) return null;

  // Handler for changing kVA and auto-syncing kW & voltage
  const handleKvaChange = (selectedKva: string) => {
    setKvaRating(selectedKva);
    let calculatedKw = '0.7KW';
    let defaultVolt = '230V AC (Input: 160V-290V, Output: 230V ±1%, DC Bus: 36V DC)';
    let batteries = 3;
    let bType = '12V 7.2Ah VRLA AGM';

    if (selectedKva === '1KVA') {
      calculatedKw = '0.7KW';
      defaultVolt = '230V AC (Input: 160V-290V, Output: 230V ±1%, DC Bus: 36V DC)';
      batteries = 3;
      bType = '12V 7.2Ah VRLA AGM';
    } else if (selectedKva === '1.5KVA') {
      calculatedKw = '1.05KW';
      defaultVolt = '230V AC (DC Bus: 36V DC or 48V DC)';
      batteries = 3;
      bType = '12V 9Ah VRLA AGM';
    } else if (selectedKva === '2KVA') {
      calculatedKw = '1.4KW';
      defaultVolt = '230V AC (DC Bus: 72V DC or 96V DC)';
      batteries = 6;
      bType = '12V 9Ah VRLA High-Rate';
    } else if (selectedKva === '3KVA') {
      calculatedKw = '2.1KW';
      defaultVolt = '230V AC (Input: 160V-290V, Output: 230V ±1%, DC Bus: 96V DC)';
      batteries = 8;
      bType = '12V 9Ah VRLA High-Rate AGM';
    } else if (selectedKva === '5KVA') {
      calculatedKw = '4.5KW';
      defaultVolt = '230V AC (In: 220V/230V, DC Bus: 192V DC, 16x 12V)';
      batteries = 16;
      bType = '12V 9Ah VRLA AGM RBC140';
    } else if (selectedKva === '6KVA') {
      calculatedKw = '5.4KW';
      defaultVolt = '230V AC (DC Bus: 192V DC or 240V DC)';
      batteries = 16;
      bType = '12V 18Ah VRLA Deep Cycle';
    } else if (selectedKva === '10KVA') {
      calculatedKw = '9.0KW';
      defaultVolt = '3-Phase / 1-Phase 400V/230V AC (DC Bus: 240V DC)';
      batteries = 20;
      bType = '12V 26Ah VRLA AGM Long Life';
    } else if (selectedKva === '20KVA') {
      calculatedKw = '18.0KW';
      defaultVolt = '3-Phase 400V AC (DC Bus: 384V DC)';
      batteries = 32;
      bType = '12V 45Ah VRLA Modular';
    }

    setKwRating(calculatedKw);
    setVoltageString(`${selectedKva} / ${calculatedKw}`);
    setOperatingVoltage(defaultVolt);
    setNoOfBatteries(batteries);
    setBatteryType(bType);
  };

  // One-click Preset Loaders
  const applyPreset = (preset: 'eaton1000h' | 'eaton3000h' | 'apc5000' | 'vertiv10k') => {
    if (preset === 'eaton1000h') {
      setModelNo('EATON DX 1000H');
      setBrand('EATON');
      handleKvaChange('1KVA');
      setBackupTime('10 MIN/OK');
      setBackupStatus('OK');
      setBatteryType('12V 7.2Ah VRLA AGM');
      setNoOfBatteries(3);
    } else if (preset === 'eaton3000h') {
      setModelNo('EATON 3000H');
      setBrand('EATON');
      handleKvaChange('3KVA');
      setBackupTime('45 MIN/OK');
      setBackupStatus('OK');
      setBatteryType('12V 9Ah High-Rate VRLA AGM');
      setNoOfBatteries(8);
      setLocationFloor('Level 2');
      setRoomNo('2207');
    } else if (preset === 'apc5000') {
      setModelNo('Smart-UPS SRT 5000VA');
      setBrand('APC Schneider Electric');
      handleKvaChange('5KVA');
      setBackupTime('50 MIN/OK');
      setBackupStatus('OK');
      setBatteryType('12V 9Ah VRLA AGM RBC140');
      setNoOfBatteries(16);
      setLocationFloor('Ground Floor');
      setRoomNo('Comms Room');
    } else if (preset === 'vertiv10k') {
      setModelNo('Liebert GXT5 10kVA');
      setBrand('Vertiv');
      handleKvaChange('10KVA');
      setBackupTime('60 MIN/OK');
      setBackupStatus('OK');
      setBatteryType('12V 26Ah VRLA AGM Long Life');
      setNoOfBatteries(20);
      setLocationFloor('Level 6');
      setRoomNo('Data Center');
    }
  };

  // Load sample row from AIIAP official spreadsheet
  const loadAIIAPRowSample = (rowTag: string) => {
    const row = aiiapUpsRawData.find((r) => r.tagNo === rowTag);
    if (!row) return;

    setSrNo(row.srNo);
    setTagNo(row.tagNo);
    setModelNo(row.modelNo);
    setBrand('EATON');
    setSerialNo(row.serialNo);
    setKvaRating(row.kvaRating);
    setKwRating(row.kwRating);
    setVoltageString(row.voltage);
    setCrnNo(row.crnNo);
    setLocationFloor(row.location);
    setRoomNo(row.roomNo);
    setBackupTime(row.backupTime);
    setBackupStatus(row.backupStatus);
    setBatteryReplacementDate(row.batteryReplacementDate);
    setNoOfBatteries(row.noOfBatteries);
    setBatteryType(row.batteryType);
    setStatus(row.status === 'Active' ? 'Active' : 'Maintenance');
    setBatteryHealthPercent(row.backupStatus === 'OK' ? 90 : 15);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const assetId = assetToEdit?.id || `PAA-UPS-${tagNo.replace('UPS-', '')}`;
    const cleanTag = tagNo.trim() || `UPS-${srNo}`;

    const upsSpecsPayload: UPSSpecs = {
      modelNo: modelNo.trim(),
      capacityKvaKw: voltageString.trim() || `${kvaRating} / ${kwRating}`,
      kvaRating,
      kwRating,
      crnNo: crnNo.trim(),
      srNo: srNo.trim(),
      tagNo: cleanTag,
      voltage: `${voltageString} (${operatingVoltage})`,
      inputVoltage: '220V/230V AC (160V-290V)',
      outputVoltage: '230V AC ± 1% Pure Sine Wave',
      batteryBankVoltage: `${noOfBatteries * 12}V DC (${noOfBatteries}x 12V Cells)`,
      roomNo: roomNo.trim(),
      locationDetails: `${locationFloor.trim()} - Room ${roomNo.trim()}`,
      backupTime: backupStatus === 'NO BACKUP' ? 'NO BACKUP' : backupTime.trim(),
      backupStatus,
      noOfBatteries: Number(noOfBatteries) || 3,
      batteryType: batteryType.trim(),
      lastBatteryChangeDate: batteryReplacementDate,
      nextBatteryChangeDate: nextBatteryReplacementDate,
      batteryHealthPercent: Number(batteryHealthPercent),
      loadPercentage: 55,
    };

    const assetPayload: Partial<AssetItem> = {
      name: `${modelNo.trim()} (${kvaRating}) - ${cleanTag}`,
      category: 'UPS',
      department: department as any,
      assignedUser: `Allama Iqbal Int'l Airport (${locationFloor} - ${roomNo})`,
      paaNumber: `PAA/AIIAP/UPS/${crnNo || srNo}`,
      location: {
        building: 'AIIAP Terminal Complex',
        floor: locationFloor.trim(),
        room: roomNo.trim(),
      },
      vendorCompany: `${brand} Power Quality Pakistan`,
      brand: brand.trim(),
      model: modelNo.trim(),
      serialNumber: serialNo.trim() || `SN-${Math.floor(10000000 + Math.random() * 90000000)}`,
      assetTag: cleanTag,
      crnNo: crnNo.trim(),
      purchaseDate: assetToEdit?.purchaseDate || '2022-01-15',
      warrantyExpiry: assetToEdit?.warrantyExpiry || '2027-12-31',
      status: backupStatus === 'NO BACKUP' ? 'Maintenance' : status,
      isRemoved: false,
      images: {
        devicePhoto: assetToEdit?.images?.devicePhoto || '/eaton_dx1000.webp',
      },
      upsSpecs: upsSpecsPayload,
      pingStatus: backupStatus === 'NO BACKUP' ? 'Warning' : 'Online',
      uptime: backupStatus === 'NO BACKUP' ? 'Faulty' : '180 days',
      lastMaintenanceDate: batteryReplacementDate,
    };

    if (assetToEdit) {
      updateAsset(assetToEdit.id, assetPayload);
      if (onSuccess) onSuccess({ ...assetToEdit, ...assetPayload } as AssetItem);
    } else {
      addAsset({
        ...assetPayload,
        id: assetId,
      });
      if (onSuccess) {
        onSuccess({
          id: assetId,
          ...assetPayload,
          barcode: `10099${tagNo.replace(/\D/g, '').padStart(4, '0')}`,
          qrCode: `${assetId}|${modelNo}|${locationFloor}-${roomNo}|CRN:${crnNo}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        } as AssetItem);
      }
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-3 sm:p-4 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* MODAL HEADER */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-6 py-4 dark:border-slate-800 dark:bg-slate-800/60">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-amber-500/10 p-2.5 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400">
              <BatteryCharging className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {assetToEdit ? 'Edit UPS & Battery Bank Specification' : 'Add New Airport UPS & Power Infrastructure'}
                </h3>
                <span className="rounded-full bg-amber-500/10 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-amber-700 dark:text-amber-300">
                  AIIAP Structured LAN
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Official PAA UPS Details Form: Tag, Model, Serial, Voltage/kVA, CRN, Location, Room, Backup Time & Battery Cycle
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 hover:bg-slate-200/60 hover:text-slate-700 dark:hover:bg-slate-700 dark:hover:text-slate-200 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* QUICK PRESETS TOOLBAR */}
        <div className="border-b border-slate-100 bg-amber-50/40 px-6 py-2.5 dark:border-slate-800 dark:bg-amber-950/10 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900 dark:text-amber-300">
            <Sparkles className="h-3.5 w-3.5 text-amber-600" />
            <span>Airport Quick Presets:</span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => applyPreset('eaton1000h')}
              className="rounded-lg border border-amber-200 bg-white px-2.5 py-1 text-[11px] font-bold text-amber-950 hover:bg-amber-100 dark:border-amber-800 dark:bg-slate-800 dark:text-amber-200 transition shadow-2xs"
            >
              ⚡ EATON 1kVA (0.7kW)
            </button>
            <button
              type="button"
              onClick={() => applyPreset('eaton3000h')}
              className="rounded-lg border border-blue-200 bg-white px-2.5 py-1 text-[11px] font-bold text-blue-950 hover:bg-blue-100 dark:border-blue-800 dark:bg-slate-800 dark:text-blue-200 transition shadow-2xs"
            >
              ⚡ EATON 3kVA (2.1kW - Radar)
            </button>
            <button
              type="button"
              onClick={() => applyPreset('apc5000')}
              className="rounded-lg border border-purple-200 bg-white px-2.5 py-1 text-[11px] font-bold text-purple-950 hover:bg-purple-100 dark:border-purple-800 dark:bg-slate-800 dark:text-purple-200 transition shadow-2xs"
            >
              ⚡ APC 5kVA (4.5kW - Comms)
            </button>
            <button
              type="button"
              onClick={() => applyPreset('vertiv10k')}
              className="rounded-lg border border-emerald-200 bg-white px-2.5 py-1 text-[11px] font-bold text-emerald-950 hover:bg-emerald-100 dark:border-emerald-800 dark:bg-slate-800 dark:text-emerald-200 transition shadow-2xs"
            >
              ⚡ Vertiv 10kVA (Data Center)
            </button>

            {/* Quick Clone from Sheet */}
            <div className="relative inline-block">
              <select
                onChange={(e) => {
                  if (e.target.value) {
                    loadAIIAPRowSample(e.target.value);
                  }
                }}
                defaultValue=""
                className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-[11px] font-bold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              >
                <option value="" disabled>📋 Clone AIIAP Sheet Row (UPS-01..20)...</option>
                {aiiapUpsRawData.map((row) => (
                  <option key={row.tagNo} value={row.tagNo}>
                    {row.tagNo}: {row.location} ({row.roomNo}) - CRN {row.crnNo}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* FORM CONTENT */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* SECTION 1: TAG, MODEL & SERIAL */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-800/40 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <Tag className="h-4 w-4 text-emerald-500" />
              1. Tagging, Model & Serial Number
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  SR. NO. (Sequence)
                </label>
                <input
                  type="text"
                  placeholder="e.g. 01, 21"
                  value={srNo}
                  onChange={(e) => setSrNo(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs font-mono font-bold text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  TAG NO. (e.g. UPS-01)
                </label>
                <input
                  type="text"
                  placeholder="UPS-01, UPS-21"
                  value={tagNo}
                  onChange={(e) => setTagNo(e.target.value)}
                  className="w-full rounded-xl border border-amber-300 bg-amber-50/40 p-2.5 text-xs font-mono font-extrabold text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-300"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  MODEL NO.
                </label>
                <input
                  type="text"
                  placeholder="EATON DX 1000H"
                  value={modelNo}
                  onChange={(e) => setModelNo(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs font-bold text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  SERIAL NO.
                </label>
                <input
                  type="text"
                  placeholder="e.g. 150831-93370005"
                  value={serialNo}
                  onChange={(e) => setSerialNo(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs font-mono font-bold text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Manufacturer / Brand
                </label>
                <select
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs font-bold dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                >
                  <option value="EATON">EATON Power Quality</option>
                  <option value="APC Schneider Electric">APC by Schneider Electric</option>
                  <option value="Vertiv">Vertiv / Emerson Liebert</option>
                  <option value="Delta">Delta Electronics</option>
                  <option value="Socomec">Socomec Masterys</option>
                  <option value="ABB">ABB Power Solutions</option>
                  <option value="Other">Other Industrial UPS</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Airport CRN NO. (Ledger Entry)
                </label>
                <input
                  type="text"
                  placeholder="e.g. 2214, 2215"
                  value={crnNo}
                  onChange={(e) => setCrnNo(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs font-mono font-bold text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Assigned Department / Ops
                </label>
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs font-bold dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                >
                  <option value="IT Infrastructure">IT Infrastructure / Structured LAN</option>
                  <option value="CTO">CTO / Control Tower Operations</option>
                  <option value="Radar">Radar Operations & Signal Processing</option>
                  <option value="Operations">Passenger Terminal Operations</option>
                  <option value="Cargo">Cargo & Freight Terminal</option>
                  <option value="Fire">Fire & Emergency Rescue Services</option>
                  <option value="Flight Inquiry">Flight Inquiry / Concourse</option>
                </select>
              </div>
            </div>
          </div>

          {/* SECTION 2: POWER RATING & kVA / kW MATRIX */}
          <div className="rounded-2xl border border-amber-200 bg-amber-50/40 p-4 dark:border-amber-900/60 dark:bg-amber-950/20 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-900 dark:text-amber-300 flex items-center gap-2">
                <Zap className="h-4 w-4 text-amber-600" />
                2. Power Capacity & kVA / kW Matrix
              </h4>
              <span className="rounded-md bg-amber-500/20 px-2 py-0.5 font-mono text-[11px] font-extrabold text-amber-800 dark:text-amber-300">
                Formula: Voltage = {kvaRating} / {kwRating}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Capacity (kVA Rating)
                </label>
                <select
                  value={kvaRating}
                  onChange={(e) => handleKvaChange(e.target.value)}
                  className="w-full rounded-xl border border-amber-300 bg-white p-2.5 text-xs font-extrabold text-amber-900 dark:border-amber-800 dark:bg-slate-900 dark:text-amber-300"
                >
                  <option value="1KVA">1 kVA (Standard AIIAP DX 1000H)</option>
                  <option value="1.5KVA">1.5 kVA (Mid-Duty)</option>
                  <option value="2KVA">2 kVA (Rack Mount)</option>
                  <option value="3KVA">3 kVA (Radar / EATON 3000H)</option>
                  <option value="5KVA">5 kVA (Heavy Duty / APC 5000VA)</option>
                  <option value="6KVA">6 kVA (Facility Power)</option>
                  <option value="10KVA">10 kVA (Tier-3 Server Room)</option>
                  <option value="20KVA">20 kVA (Core Power Plant)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Active Power (kW Rating)
                </label>
                <input
                  type="text"
                  value={kwRating}
                  onChange={(e) => {
                    setKwRating(e.target.value);
                    setVoltageString(`${kvaRating} / ${e.target.value}`);
                  }}
                  className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs font-mono font-bold text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                  placeholder="e.g. 0.7KW"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  VOLTAGE Column String (Spreadsheet)
                </label>
                <input
                  type="text"
                  value={voltageString}
                  onChange={(e) => setVoltageString(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs font-mono font-bold text-amber-900 dark:border-slate-700 dark:bg-slate-900 dark:text-amber-300"
                  placeholder="1KVA / 0.7KW"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Operating Voltage & DC Bus
                </label>
                <input
                  type="text"
                  value={operatingVoltage}
                  onChange={(e) => setOperatingVoltage(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                  placeholder="e.g. 230V AC ±1%, 36V DC Bus"
                />
              </div>
            </div>
          </div>

          {/* SECTION 3: LOCATION & ROOM DETAILS */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-800/40 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <MapPin className="h-4 w-4 text-emerald-500" />
              3. Airport Location & Room Placement
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  LOCATION (Level / Terminal / Zone)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={locationFloor}
                    onChange={(e) => setLocationFloor(e.target.value)}
                    placeholder="Level 4, Level 6, Cargo, Airside..."
                    className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs font-bold text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                    required
                  />
                  <select
                    onChange={(e) => e.target.value && setLocationFloor(e.target.value)}
                    defaultValue=""
                    className="rounded-xl border border-slate-200 bg-white px-2 py-1 text-xs dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                  >
                    <option value="" disabled>Quick Pick</option>
                    <option value="Level 4">Level 4</option>
                    <option value="Level 6">Level 6</option>
                    <option value="Level 3">Level 3</option>
                    <option value="Level 2">Level 2</option>
                    <option value="Level 1">Level 1</option>
                    <option value="Level 0">Level 0</option>
                    <option value="IT STORE">IT STORE</option>
                    <option value="Cargo">Cargo</option>
                    <option value="Airside">Airside</option>
                    <option value="ECR">ECR</option>
                    <option value="Apron">Apron</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  ROOM NO. / Station
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={roomNo}
                    onChange={(e) => setRoomNo(e.target.value)}
                    placeholder="4102, Data Center, IT STORE, Radar, 3084..."
                    className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs font-bold text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                    required
                  />
                  <select
                    onChange={(e) => e.target.value && setRoomNo(e.target.value)}
                    defaultValue=""
                    className="rounded-xl border border-slate-200 bg-white px-2 py-1 text-xs dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                  >
                    <option value="" disabled>Quick Pick</option>
                    <option value="4102">4102</option>
                    <option value="Data Center">Data Center</option>
                    <option value="IT STORE">IT STORE</option>
                    <option value="Cargo">Cargo</option>
                    <option value="Radar">Radar</option>
                    <option value="3084">3084</option>
                    <option value="0053">0053</option>
                    <option value="2207">2207</option>
                    <option value="1157">1157</option>
                    <option value="1004">1004</option>
                    <option value="4035">4035</option>
                    <option value="Fire">Fire</option>
                    <option value="1244">1244</option>
                    <option value="4064">4064</option>
                    <option value="2126">2126</option>
                    <option value="4121">4121</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 4: BACKUP TIME & BATTERY REPLACEMENT AUDIT */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-800/40 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <Clock className="h-4 w-4 text-emerald-500" />
                4. Backup Duration, Battery Bank & Replacement Date
              </h4>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setBackupStatus('OK');
                    setBackupTime('10 MIN/OK');
                  }}
                  className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition ${
                    backupStatus === 'OK'
                      ? 'bg-emerald-500 text-white'
                      : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                  }`}
                >
                  ✓ 10 MIN/OK (Normal)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setBackupStatus('NO BACKUP');
                    setBackupTime('NO BACKUP');
                    setStatus('Maintenance');
                    setBatteryHealthPercent(15);
                  }}
                  className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition ${
                    backupStatus === 'NO BACKUP'
                      ? 'bg-rose-600 text-white'
                      : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                  }`}
                >
                  ⚠️ NO BACKUP (Faulty)
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  BACKUP TIME (Status in Sheet)
                </label>
                <input
                  type="text"
                  value={backupTime}
                  onChange={(e) => setBackupTime(e.target.value)}
                  placeholder="10 MIN/OK, 25 MIN/OK, NO BACKUP"
                  className={`w-full rounded-xl border p-2.5 text-xs font-extrabold ${
                    backupTime.includes('NO BACKUP')
                      ? 'border-rose-300 bg-rose-50 text-rose-700 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-300'
                      : 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
                  }`}
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  BATTERIES REPLACEMENT Date
                </label>
                <input
                  type="date"
                  value={batteryReplacementDate}
                  onChange={(e) => {
                    setBatteryReplacementDate(e.target.value);
                    const dt = new Date(e.target.value);
                    const next = new Date(dt.getTime() + 730 * 24 * 60 * 60 * 1000);
                    if (!isNaN(next.getTime())) {
                      setNextBatteryReplacementDate(next.toISOString().split('T')[0]);
                    }
                  }}
                  className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs font-bold text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Next Due Date (+2 Years)
                </label>
                <input
                  type="date"
                  value={nextBatteryReplacementDate}
                  onChange={(e) => setNextBatteryReplacementDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs font-bold text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Number of Batteries
                </label>
                <input
                  type="number"
                  min="1"
                  max="64"
                  value={noOfBatteries}
                  onChange={(e) => setNoOfBatteries(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs font-bold text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Battery Type & Chemistry
                </label>
                <input
                  type="text"
                  value={batteryType}
                  onChange={(e) => setBatteryType(e.target.value)}
                  placeholder="12V 7.2Ah VRLA AGM"
                  className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Battery Health ({batteryHealthPercent}%)
                </label>
                <div className="flex items-center gap-2 pt-1.5">
                  <input
                    type="range"
                    min="10"
                    max="100"
                    value={batteryHealthPercent}
                    onChange={(e) => setBatteryHealthPercent(Number(e.target.value))}
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                  <span className="text-xs font-bold font-mono text-amber-700 dark:text-amber-400">
                    {batteryHealthPercent}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* SUBMIT BUTTONS */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="text-xs text-slate-500 dark:text-slate-400">
              * Record will automatically update both Asset Directory and AIIAP UPS Inventory Ledger
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-slate-200 px-5 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex items-center gap-2 rounded-xl bg-amber-600 px-6 py-2.5 text-xs font-bold text-white shadow-lg shadow-amber-600/25 hover:bg-amber-500 transition"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>{assetToEdit ? 'Save Changes' : 'Register UPS into AIIAP Database'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
