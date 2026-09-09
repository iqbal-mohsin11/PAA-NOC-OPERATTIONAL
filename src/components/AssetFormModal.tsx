import React, { useState, useEffect } from 'react';
import { useInventory } from '../context/InventoryContext';
import { AddDepartmentModal } from './AddDepartmentModal';
import { AddBrandModal } from './AddBrandModal';
import { AddVendorModal } from './AddVendorModal';
import { AddCategoryModal } from './AddCategoryModal';
import { ProcurementFormModal } from './ProcurementFormModal';
import {
  AssetItem,
  Department,
  DeviceCategory,
  AssetStatus,
  SystemSpecs,
  PrinterSpecs,
  ScannerSpecs,
  NetworkDeviceSpecs,
  CableSpecs,
  UPSSpecs,
} from '../types/inventory';
import {
  X,
  HardDrive,
  Building,
  Building2,
  Cpu,
  Printer,
  Server,
  Image,
  Check,
  Upload,
  AlertCircle,
  QrCode,
  Plus,
  Tag,
  Store,
  FileText,
  Cable,
  Zap,
  BatteryCharging,
  Search,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { autoFetchActiveDirectory, activeDirectoryCatalog } from '../data/adDirectoryData';

interface AssetFormModalProps {
  assetToEdit?: AssetItem | null;
  onClose: () => void;
}

export const AssetFormModal: React.FC<AssetFormModalProps> = ({ assetToEdit, onClose }) => {
  const { addAsset, updateAsset, allDepartments, allBrands, allVendors, allCategories } = useInventory();

  const [activeTab, setActiveTab] = useState<'basic' | 'company' | 'specs' | 'images' | 'status'>('basic');
  const [isAddDeptOpen, setIsAddDeptOpen] = useState(false);
  const [isAddBrandOpen, setIsAddBrandOpen] = useState(false);
  const [isAddVendorOpen, setIsAddVendorOpen] = useState(false);
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [isManualCategory, setIsManualCategory] = useState(false);
  const [isProcurementModalOpen, setIsProcurementModalOpen] = useState(false);

  // Basic Info State
  const [name, setName] = useState('');
  const [category, setCategory] = useState<DeviceCategory>('Desktop PC');
  const [department, setDepartment] = useState<Department>('IT');
  const [assignedUser, setAssignedUser] = useState('');
  const [paaNumber, setPaaNumber] = useState('');
  const [building, setBuilding] = useState('PAA Main Headquarters');
  const [floor, setFloor] = useState('1st Floor');
  const [room, setRoom] = useState('Room 101');

  // Company State
  const [vendorCompany, setVendorCompany] = useState('');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [assetTag, setAssetTag] = useState('');
  const [purchaseDate, setPurchaseDate] = useState('');
  const [warrantyExpiry, setWarrantyExpiry] = useState('');

  // Specs State
  const [systemSpecs, setSystemSpecs] = useState<SystemSpecs>({
    processor: 'Intel Core i7',
    generation: '13th Gen',
    ram: '16 GB',
    ramType: 'DDR4',
    hdd: '1 TB',
    ssd: '512 GB NVMe',
    graphicsCard: 'Integrated Intel UHD',
    motherboard: 'OEM Board',
    biosVersion: 'v1.0.0',
    osVersion: 'Windows 11 Enterprise',
    officeVersion: 'Office 2021 LTSC',
    antivirus: 'Kaspersky Endpoint Security',
    macAddress: '00:1A:2B:3C:4D:5E',
    ipAddress: '10.100.1.10',
    computerName: 'PAA-WORKSTATION-01',
  });

  const [printerSpecs, setPrinterSpecs] = useState<PrinterSpecs>({
    printerType: 'Laser',
    colorType: 'Mono',
    connectionType: 'Network',
    duplex: true,
    tonerModel: 'HP 59A',
    tonerLevel: 85,
  });

  const [scannerSpecs, setScannerSpecs] = useState<ScannerSpecs>({
    scannerType: 'ADF',
  });

  const [networkSpecs, setNetworkSpecs] = useState<NetworkDeviceSpecs>({
    totalPorts: 24,
    uplinkPorts: 4,
    sfpPorts: 2,
    vlanSupported: true,
    layer: 'Layer 2',
    firmwareVersion: 'v1.2.0',
    managementIp: '10.100.0.15',
    rackNumber: 'Rack-01',
  });

  const [cableSpecs, setCableSpecs] = useState<CableSpecs>({
    cableType: 'Single-Mode OS2',
    connectorType: 'LC-LC Duplex',
    length: '10m',
    shielding: 'LSZH Fire Retardant',
    jacketColor: 'Yellow',
    bandwidthSpeed: '10 Gbps',
  });

  const [upsSpecs, setUpsSpecs] = useState<UPSSpecs>({
    modelNo: 'EATON DX 1000H',
    capacityKvaKw: '1000VA / 900W',
    voltage: '230V AC (In/Out), 36V DC Bus (3x 12V)',
    roomNo: 'Room 104',
    locationDetails: 'Control Tower Complex, 1st Floor, ATC Avionics Rack',
    backupTime: '25 Minutes',
    noOfBatteries: 3,
    batteryType: '12V 7.2Ah VRLA AGM',
    lastBatteryChangeDate: new Date().toISOString().split('T')[0],
    nextBatteryChangeDate: new Date(Date.now() + 730 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    batteryHealthPercent: 100,
    loadPercentage: 55,
  });

  // Images State
  const [devicePhoto, setDevicePhoto] = useState('https://images.unsplash.com/photo-1587831990711-23ca6441447b?auto=format&fit=crop&w=600&q=80');
  const [serialPhoto, setSerialPhoto] = useState('');
  const [invoice, setInvoice] = useState('');
  const [warrantyCard, setWarrantyCard] = useState('');

  // Status
  const [status, setStatus] = useState<AssetStatus>('Active');

  // Active Directory Auto Fetch State
  const [adSearchQuery, setAdSearchQuery] = useState('');
  const [isFetchingAD, setIsFetchingAD] = useState(false);
  const [adSuccessInfo, setAdSuccessInfo] = useState<{
    computerName: string;
    domain: string;
    dc: string;
    user: string;
    ip: string;
    os: string;
    ou: string;
  } | null>(null);

  const handleAutoFetchAD = async (customQuery?: string) => {
    const q = (customQuery || adSearchQuery || systemSpecs.computerName || name).trim();
    if (!q) return;

    setIsFetchingAD(true);
    setAdSuccessInfo(null);

    try {
      let adObj: any = null;
      try {
        const res = await fetch(`/api/ad/lookup?query=${encodeURIComponent(q)}`);
        if (res.ok) {
          const data = await res.json();
          adObj = data.computer;
        }
      } catch {
        // Fallback to client-side LDAP directory simulation
      }

      if (!adObj) {
        adObj = autoFetchActiveDirectory(q);
      }

      // Populate form state automatically
      setName(`${adObj.brand} ${adObj.model} (${adObj.computerName})`);
      setCategory(adObj.category);
      setBrand(adObj.brand);
      setModel(adObj.model);
      setDepartment(adObj.department as Department);
      setAssignedUser(adObj.assignedUser);

      if (adObj.location) {
        setBuilding(adObj.location.building || building);
        setFloor(adObj.location.floor || floor);
        setRoom(adObj.location.room || room);
      }

      setSystemSpecs((prev) => ({
        ...prev,
        computerName: adObj.computerName,
        ipAddress: adObj.ipAddress,
        macAddress: adObj.macAddress,
        osVersion: adObj.operatingSystem,
        processor: adObj.processor,
        ram: adObj.ram,
        ramType: adObj.ramType,
        ssd: adObj.ssd,
        hdd: adObj.hdd,
      }));

      setAdSuccessInfo({
        computerName: adObj.computerName,
        domain: 'paa.gov.pk',
        dc: 'DC01.paa.gov.pk (10.100.0.5)',
        user: adObj.assignedUser,
        ip: adObj.ipAddress,
        os: adObj.operatingSystem,
        ou: adObj.distinguishedName,
      });
      setAdSearchQuery(adObj.computerName);
    } finally {
      setIsFetchingAD(false);
    }
  };


  useEffect(() => {
    if (assetToEdit) {
      setName(assetToEdit.name);
      setCategory(assetToEdit.category);
      setDepartment(assetToEdit.department);
      setAssignedUser(assetToEdit.assignedUser);
      setPaaNumber(assetToEdit.paaNumber);
      setBuilding(assetToEdit.location.building);
      setFloor(assetToEdit.location.floor);
      setRoom(assetToEdit.location.room);

      setVendorCompany(assetToEdit.vendorCompany);
      setBrand(assetToEdit.brand);
      setModel(assetToEdit.model);
      setSerialNumber(assetToEdit.serialNumber);
      setAssetTag(assetToEdit.assetTag);
      setPurchaseDate(assetToEdit.purchaseDate);
      setWarrantyExpiry(assetToEdit.warrantyExpiry);

      if (assetToEdit.systemSpecs) setSystemSpecs(assetToEdit.systemSpecs);
      if (assetToEdit.printerSpecs) setPrinterSpecs(assetToEdit.printerSpecs);
      if (assetToEdit.scannerSpecs) setScannerSpecs(assetToEdit.scannerSpecs);
      if (assetToEdit.networkSpecs) setNetworkSpecs(assetToEdit.networkSpecs);
      if (assetToEdit.cableSpecs) setCableSpecs(assetToEdit.cableSpecs);
      if (assetToEdit.upsSpecs) setUpsSpecs(assetToEdit.upsSpecs);

      if (assetToEdit.images) {
        setDevicePhoto(assetToEdit.images.devicePhoto || '');
        setSerialPhoto(assetToEdit.images.serialPhoto || '');
        setInvoice(assetToEdit.images.invoice || '');
        setWarrantyCard(assetToEdit.images.warrantyCard || '');
      }

      setStatus(assetToEdit.status);
    }
  }, [assetToEdit]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const isCableCategory = ['Fiber Patch Cord', 'UTP Patch Cord / Network Cable', 'Network Cable'].includes(category);

    const payload: Partial<AssetItem> = {
      name: name || `${brand} ${model}`,
      category,
      department,
      assignedUser: assignedUser || 'General Department Stock',
      paaNumber: paaNumber || `PAA/HQ/${department}/2026/${Math.floor(100 + Math.random() * 900)}`,
      location: { building, floor, room },
      vendorCompany,
      brand,
      model,
      serialNumber: serialNumber || `SN-${Math.floor(100000 + Math.random() * 900000)}`,
      assetTag: assetTag || `TAG-${Math.floor(1000 + Math.random() * 9000)}`,
      purchaseDate: purchaseDate || new Date().toISOString().split('T')[0],
      warrantyExpiry: warrantyExpiry || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000 * 3).toISOString().split('T')[0],
      status,
      images: { devicePhoto, serialPhoto, invoice, warrantyCard },
      systemSpecs: ['Desktop PC', 'Laptop', 'Server', 'Monitor'].includes(category) ? systemSpecs : undefined,
      printerSpecs: category === 'Printer' ? printerSpecs : undefined,
      scannerSpecs: category === 'Scanner' ? scannerSpecs : undefined,
      networkSpecs: ['Network Switch', 'Core Switch', 'Distribution Switch', 'Access Switch', 'Router', 'Firewall', 'Access Point'].includes(category)
        ? networkSpecs
        : undefined,
      cableSpecs: isCableCategory ? cableSpecs : undefined,
      upsSpecs: category === 'UPS' ? upsSpecs : undefined,
    };

    if (assetToEdit) {
      updateAsset(assetToEdit.id, payload);
    } else {
      addAsset(payload);
    }

    onClose();
  };

  const isPcOrLaptop = ['Desktop PC', 'Laptop', 'Server', 'Monitor'].includes(category);
  const isPrinter = category === 'Printer';
  const isScanner = category === 'Scanner';
  const isNetworkDev = ['Network Switch', 'Core Switch', 'Distribution Switch', 'Access Switch', 'Router', 'Firewall', 'Access Point'].includes(category);
  const isCable = ['Fiber Patch Cord', 'UTP Patch Cord / Network Cable', 'Network Cable'].includes(category);
  const isUPS = category === 'UPS';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-4xl rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900 my-8">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold">
              <HardDrive className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {assetToEdit ? `Edit Asset Record (${assetToEdit.id})` : 'Register New IT Inventory Asset'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Pakistan Airports Authority Official IT Asset Management System
              </p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Navigation Tabs */}
        <div className="flex border-b border-slate-100 bg-slate-50 px-6 text-xs font-semibold dark:border-slate-800 dark:bg-slate-800/50">
          <button
            onClick={() => setActiveTab('basic')}
            className={`flex items-center gap-1.5 border-b-2 px-4 py-3 transition ${
              activeTab === 'basic'
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400'
            }`}
          >
            <Building className="h-4 w-4" />
            <span>1. Basic Info</span>
          </button>

          <button
            onClick={() => setActiveTab('company')}
            className={`flex items-center gap-1.5 border-b-2 px-4 py-3 transition ${
              activeTab === 'company'
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400'
            }`}
          >
            <HardDrive className="h-4 w-4" />
            <span>2. Vendor & Brand</span>
          </button>

          <button
            onClick={() => setActiveTab('specs')}
            className={`flex items-center gap-1.5 border-b-2 px-4 py-3 transition ${
              activeTab === 'specs'
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400'
            }`}
          >
            <Cpu className="h-4 w-4" />
            <span>3. Hardware Configuration</span>
          </button>

          <button
            onClick={() => setActiveTab('images')}
            className={`flex items-center gap-1.5 border-b-2 px-4 py-3 transition ${
              activeTab === 'images'
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400'
            }`}
          >
            <Image className="h-4 w-4" />
            <span>4. Photos & Attachments</span>
          </button>

          <button
            onClick={() => setActiveTab('status')}
            className={`flex items-center gap-1.5 border-b-2 px-4 py-3 transition ${
              activeTab === 'status'
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400'
            }`}
          >
            <Check className="h-4 w-4" />
            <span>5. Status & Save</span>
          </button>
        </div>

        {/* Modal Form Content */}
        <form onSubmit={handleSubmit} className="p-6">
          {/* TAB 1: BASIC INFO */}
          {activeTab === 'basic' && (
            <div className="space-y-4">
              {/* Quick Preset Buttons for New Item Purchasing & Registration */}
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-3 dark:border-emerald-900/40 dark:bg-emerald-950/30 space-y-2">
                <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-wider text-emerald-900 dark:text-emerald-300">
                  <span>🛒 Quick Presets for New Item Purchasing & Entry:</span>
                  <span className="text-[10px] font-normal text-emerald-700 dark:text-emerald-400">Click preset to quick-fill form</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { label: '💾 RAM', cat: 'RAM / Memory', name: '16GB DDR4 Desktop RAM Module', brand: 'Kingston / Crucial', model: 'DDR4 3200MHz' },
                    { label: '💽 SSD', cat: 'SSD / Storage', name: '512GB NVMe M.2 High Speed SSD', brand: 'Samsung / Crucial', model: '980 NVMe M.2' },
                    { label: '⌨️ KEYBOARD / MOUSE', cat: 'Peripherals', name: 'USB Ergonomic Keyboard & Mouse Set', brand: 'Logitech / HP', model: 'MK120 Combo' },
                    { label: '🖥️ LED / MONITOR', cat: 'Monitor', name: '24-inch Full HD IPS LED Monitor', brand: 'Dell / HP', model: '2422H FHD LED' },
                    { label: '💻 PC / DESKTOP', cat: 'Desktop PC', name: 'Core i7 Desktop Workstation', brand: 'Dell / HP', model: 'OptiPlex 7010' },
                    { label: '🖨️ PRINTER', cat: 'Printer', name: 'Heavy Duty Laser Printer B/W', brand: 'HP LaserJet', model: 'Pro M404dn' },
                    { label: '🧵 FIBER CABLES / PATCHCORD', cat: 'Network Cables', name: '10m Fiber Optic LC-LC Patchcord', brand: 'Cisco / Panduit', model: 'Single Mode LC-LC' },
                    { label: '🔌 POWER CABLES', cat: 'Power Cables', name: '1.8m Heavy Duty C13 Power Cable', brand: 'Generic PAA', model: 'C13 Heavy Duty' },
                    { label: '🔌 USB PRINTER CABLES', cat: 'Printer Cables', name: '3m High-Speed USB 2.0 A-to-B Printer Cable', brand: 'Generic PAA', model: 'USB A-to-B 3m' },
                    { label: '🧰 NEW TOOLS FOR IT LAB', cat: 'IT Tools & Equipment', name: 'Network Cable Tester & Crimping Tool Kit', brand: 'Fluke / Prokit', model: 'Network Tester & Crimper Set' },
                    { label: '📦 OTHER DETAILS', cat: 'Accessories & Supplies', name: 'Cat6 Network Patch Cord Roll (305m)', brand: 'D-Link / Schneider', model: 'Cat6 UTP Cable' },
                  ].map((item) => (
                    <button
                      key={item.label}
                      type="button"
                      onClick={() => {
                        setName(item.name);
                        setCategory(item.cat);
                        setBrand(item.brand);
                        setModel(item.model);
                      }}
                      className="rounded-lg border border-emerald-200 bg-white px-2.5 py-1 text-xs font-bold text-slate-800 hover:border-emerald-500 hover:bg-emerald-100 dark:border-emerald-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 transition shadow-2xs"
                      title={`Quick fill ${item.name}`}
                    >
                      <span>{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* AUTO FETCH FROM ACTIVE DIRECTORY (AD) CARD */}
              <div className="rounded-xl border border-teal-200 bg-gradient-to-br from-teal-50/90 via-emerald-50/40 to-slate-50 p-3.5 dark:border-teal-900/50 dark:from-teal-950/40 dark:via-slate-900/40 dark:to-slate-900 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-teal-600 text-white shadow-xs">
                      <Zap className="h-3.5 w-3.5 fill-amber-300 text-amber-300" />
                    </span>
                    <h4 className="text-xs font-bold text-teal-900 dark:text-teal-200">
                      Auto Fetch from Active Directory (AD)
                    </h4>
                    <span className="rounded-md bg-teal-200/60 dark:bg-teal-900/60 px-1.5 py-0.5 text-[10px] font-bold text-teal-800 dark:text-teal-300">
                      DC01.paa.gov.pk
                    </span>
                  </div>
                  <span className="text-[10px] font-semibold text-teal-700 dark:text-teal-400">
                    LDAPS Port 636
                  </span>
                </div>

                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Type Computer Name (e.g. PAA-CTO-PC01, PAA-FIN-PC14) or IP Address..."
                      value={adSearchQuery}
                      onChange={(e) => setAdSearchQuery(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAutoFetchAD();
                        }
                      }}
                      className="w-full rounded-lg border border-teal-300 bg-white pl-8 pr-3 py-1.5 text-xs font-mono font-medium text-slate-800 outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 dark:border-teal-800 dark:bg-slate-900 dark:text-slate-100"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleAutoFetchAD()}
                    disabled={isFetchingAD}
                    className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-teal-600 to-emerald-600 px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:from-teal-500 hover:to-emerald-500 transition disabled:opacity-50"
                  >
                    <Zap className="h-3.5 w-3.5 fill-amber-300 text-amber-300" />
                    <span>{isFetchingAD ? 'Fetching AD...' : 'Auto Fetch AD'}</span>
                  </button>
                </div>

                {/* Quick AD Computer Presets */}
                <div className="flex items-center flex-wrap gap-1">
                  <span className="text-[10px] font-bold text-teal-800 dark:text-teal-300 mr-1">Quick Fetch AD:</span>
                  {[
                    'PAA-CTO-PC01',
                    'PAA-APM-LAP01',
                    'PAA-FIN-PC14',
                    'PAA-IT-PC05',
                    'PAA-FIRE-STN02',
                    'PAA-RADAR-DSP04',
                    'PAA-NAV-SRV01',
                    'PAA-COMM-WS02',
                  ].map((cName) => (
                    <button
                      key={cName}
                      type="button"
                      onClick={() => handleAutoFetchAD(cName)}
                      className="rounded-md border border-teal-200 bg-white/90 px-2 py-0.5 text-[10px] font-mono font-bold text-teal-800 hover:bg-teal-100 hover:border-teal-400 dark:border-teal-800 dark:bg-slate-900 dark:text-teal-300 dark:hover:bg-slate-800 transition"
                      title={`Auto Fetch ${cName} from Active Directory`}
                    >
                      ⚡ {cName}
                    </button>
                  ))}
                </div>

                {/* Active Directory Success / Verified Banner */}
                {adSuccessInfo && (
                  <div className="rounded-lg border border-emerald-300 bg-emerald-100/70 p-2 text-xs text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-200 flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1 text-[11px]">
                      <div className="font-bold flex items-center justify-between">
                        <span>✓ Auto-Fetched from Active Directory ({adSuccessInfo.dc})</span>
                        <span className="font-mono text-[10px]">{adSuccessInfo.ip}</span>
                      </div>
                      <div className="text-[10px] text-emerald-800 dark:text-emerald-300 mt-0.5">
                        Populated Computer: <span className="font-mono font-bold">{adSuccessInfo.computerName}</span> &bull; User: <span className="font-semibold">{adSuccessInfo.user}</span> &bull; OS: {adSuccessInfo.os}
                      </div>
                    </div>
                  </div>
                )}
              </div>


              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Device Name / Label <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. CTO Workstation OptiPlex 7010"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-800 outline-none focus:border-emerald-500 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Device Category <span className="text-rose-500">*</span>
                    </label>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setIsManualCategory(!isManualCategory)}
                        className="text-[11px] font-semibold text-slate-500 hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-400 transition underline decoration-dotted"
                      >
                        {isManualCategory ? '← Select from list' : '✍ Write manually'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsAddCategoryOpen(true)}
                        className="flex items-center gap-1 text-[11px] font-bold text-amber-600 hover:text-amber-500 dark:text-amber-400"
                      >
                        <Plus className="h-3 w-3" />
                        <span>New Cat</span>
                      </button>
                    </div>
                  </div>

                  {isManualCategory ? (
                    <input
                      type="text"
                      list="category-suggestions"
                      required
                      placeholder="Type device category (e.g. Keyboard, Mouse, Biometric...)"
                      value={category}
                      onChange={(e) => setCategory(e.target.value as DeviceCategory)}
                      className="w-full rounded-xl border border-amber-500/40 bg-amber-500/5 px-3 py-2 text-xs font-semibold text-slate-800 outline-none focus:border-amber-500 focus:bg-white dark:bg-amber-500/10 dark:text-slate-200"
                    />
                  ) : (
                    <select
                      value={category}
                      onChange={(e) => {
                        if (e.target.value === 'CUSTOM_MANUAL') {
                          setIsManualCategory(true);
                          setCategory('');
                        } else {
                          setCategory(e.target.value as DeviceCategory);
                        }
                      }}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-800 outline-none focus:border-emerald-500 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                    >
                      {Array.from(new Set([...allCategories, 'Keyboard', 'Mouse', 'Keyboard & Mouse'])).map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                      <option value="CUSTOM_MANUAL">✍ + Write / Type Custom Category...</option>
                    </select>
                  )}

                  <datalist id="category-suggestions">
                    {allCategories.map((c) => (
                      <option key={c} value={c} />
                    ))}
                  </datalist>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Department <span className="text-rose-500">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsAddDeptOpen(true)}
                      className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 hover:text-emerald-500 dark:text-emerald-400"
                    >
                      <Plus className="h-3 w-3" />
                      <span>New Dept</span>
                    </button>
                  </div>
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value as Department)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-800 outline-none focus:border-emerald-500 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                  >
                    {allDepartments.map((dept) => (
                      <option key={dept} value={dept}>
                        {dept} Department
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Assigned User / Officer
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Engr. Tariq Mehmood"
                    value={assignedUser}
                    onChange={(e) => setAssignedUser(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-800 outline-none focus:border-emerald-500 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    PAA Record Reference Number
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. PAA/HQ/CTO/2024/0912"
                    value={paaNumber}
                    onChange={(e) => setPaaNumber(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-800 outline-none focus:border-emerald-500 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Building Facility
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. PAA Headquarters Block A"
                    value={building}
                    onChange={(e) => setBuilding(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-800 outline-none focus:border-emerald-500 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Floor Level</label>
                  <input
                    type="text"
                    placeholder="e.g. 2nd Floor"
                    value={floor}
                    onChange={(e) => setFloor(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-800 outline-none focus:border-emerald-500 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Room / Bay Office
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Room 204 or Avionics Bay"
                    value={room}
                    onChange={(e) => setRoom(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-800 outline-none focus:border-emerald-500 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: COMPANY & BRAND */}
          {activeTab === 'company' && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Vendor / Company</label>
                  <button
                    type="button"
                    onClick={() => setIsAddVendorOpen(true)}
                    className="flex items-center gap-1 text-[11px] font-bold text-purple-600 hover:text-purple-500 dark:text-purple-400"
                  >
                    <Plus className="h-3 w-3" />
                    <span>New Vendor</span>
                  </button>
                </div>
                <div className="space-y-1.5">
                  <input
                    type="text"
                    list="vendors-list"
                    placeholder="e.g. Dell Technologies / Premier Systems"
                    value={vendorCompany}
                    onChange={(e) => setVendorCompany(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-800 outline-none focus:border-purple-500 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                  />
                  <datalist id="vendors-list">
                    {allVendors.map((v) => (
                      <option key={v} value={v} />
                    ))}
                  </datalist>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Brand / Manufacturer</label>
                  <button
                    type="button"
                    onClick={() => setIsAddBrandOpen(true)}
                    className="flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-500 dark:text-blue-400"
                  >
                    <Plus className="h-3 w-3" />
                    <span>New Brand</span>
                  </button>
                </div>
                <div className="space-y-1.5">
                  <input
                    type="text"
                    list="brands-list"
                    placeholder="e.g. Dell / HP / Cisco / Lenovo"
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-800 outline-none focus:border-blue-500 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                  />
                  <datalist id="brands-list">
                    {allBrands.map((b) => (
                      <option key={b} value={b} />
                    ))}
                  </datalist>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Model Number</label>
                <input
                  type="text"
                  placeholder="e.g. OptiPlex 7010 / Catalyst 9500"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-800 outline-none focus:border-emerald-500 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Serial Number</label>
                <input
                  type="text"
                  placeholder="e.g. 7G2K9X3-PAA"
                  value={serialNumber}
                  onChange={(e) => setSerialNumber(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-800 outline-none focus:border-emerald-500 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Asset Tag</label>
                <input
                  type="text"
                  placeholder="e.g. PAA-HQ-041"
                  value={assetTag}
                  onChange={(e) => setAssetTag(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-800 outline-none focus:border-emerald-500 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Purchase Date</label>
                <input
                  type="date"
                  value={purchaseDate}
                  onChange={(e) => setPurchaseDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-800 outline-none focus:border-emerald-500 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Warranty Expiry Date</label>
                <input
                  type="date"
                  value={warrantyExpiry}
                  onChange={(e) => setWarrantyExpiry(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-800 outline-none focus:border-emerald-500 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                />
              </div>
            </div>
          )}

          {/* TAB 3: SYSTEM CONFIG / CATEGORY SPECIFIC SPECS */}
          {activeTab === 'specs' && (
            <div className="space-y-4">
              {/* PC / LAPTOP SPECS */}
              {isPcOrLaptop && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2 dark:border-slate-800">
                    <h4 className="font-bold text-xs text-emerald-600 dark:text-emerald-400">Desktop / Laptop System Hardware Specs</h4>
                    <button
                      type="button"
                      onClick={() => handleAutoFetchAD()}
                      disabled={isFetchingAD}
                      className="flex items-center gap-1.5 rounded-lg border border-teal-300 bg-teal-50 px-2.5 py-1 text-[11px] font-bold text-teal-700 hover:bg-teal-100 dark:border-teal-800 dark:bg-teal-950/40 dark:text-teal-300 transition shadow-2xs"
                    >
                      <Zap className="h-3 w-3 fill-amber-500 text-amber-500" />
                      <span>{isFetchingAD ? 'Querying DC01...' : '⚡ Auto-Fetch Specs from AD'}</span>
                    </button>
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400">Processor</label>
                      <input
                        type="text"
                        value={systemSpecs.processor || ''}
                        onChange={(e) => setSystemSpecs({ ...systemSpecs, processor: e.target.value })}
                        className="w-full rounded-lg border border-slate-200 bg-slate-50 p-2 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400">RAM Size</label>
                      <input
                        type="text"
                        value={systemSpecs.ram || ''}
                        onChange={(e) => setSystemSpecs({ ...systemSpecs, ram: e.target.value })}
                        className="w-full rounded-lg border border-slate-200 bg-slate-50 p-2 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400">RAM Type</label>
                      <input
                        type="text"
                        value={systemSpecs.ramType || ''}
                        onChange={(e) => setSystemSpecs({ ...systemSpecs, ramType: e.target.value })}
                        className="w-full rounded-lg border border-slate-200 bg-slate-50 p-2 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400">SSD Storage</label>
                      <input
                        type="text"
                        value={systemSpecs.ssd || ''}
                        onChange={(e) => setSystemSpecs({ ...systemSpecs, ssd: e.target.value })}
                        className="w-full rounded-lg border border-slate-200 bg-slate-50 p-2 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400">HDD Storage</label>
                      <input
                        type="text"
                        value={systemSpecs.hdd || ''}
                        onChange={(e) => setSystemSpecs({ ...systemSpecs, hdd: e.target.value })}
                        className="w-full rounded-lg border border-slate-200 bg-slate-50 p-2 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400">IP Address</label>
                      <input
                        type="text"
                        value={systemSpecs.ipAddress || ''}
                        onChange={(e) => setSystemSpecs({ ...systemSpecs, ipAddress: e.target.value })}
                        className="w-full rounded-lg border border-slate-200 bg-slate-50 p-2 text-xs font-mono dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400">MAC Address</label>
                      <input
                        type="text"
                        value={systemSpecs.macAddress || ''}
                        onChange={(e) => setSystemSpecs({ ...systemSpecs, macAddress: e.target.value })}
                        className="w-full rounded-lg border border-slate-200 bg-slate-50 p-2 text-xs font-mono dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400">Windows OS Version</label>
                      <input
                        type="text"
                        value={systemSpecs.osVersion || ''}
                        onChange={(e) => setSystemSpecs({ ...systemSpecs, osVersion: e.target.value })}
                        className="w-full rounded-lg border border-slate-200 bg-slate-50 p-2 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400">Computer Name</label>
                      <input
                        type="text"
                        value={systemSpecs.computerName || ''}
                        onChange={(e) => setSystemSpecs({ ...systemSpecs, computerName: e.target.value })}
                        className="w-full rounded-lg border border-slate-200 bg-slate-50 p-2 text-xs font-mono dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* PRINTER SPECS */}
              {isPrinter && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-xs text-emerald-600 dark:text-emerald-400">Printer Specific Configurations</h4>
                    <span className="text-[10px] text-slate-400 font-medium">Quick select model preset</span>
                  </div>

                  {/* Quick Select Buttons */}
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-2.5 dark:border-slate-800 dark:bg-slate-800/40 space-y-1.5">
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      Standard Printer Model Presets:
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        { label: 'HP 1102W', modelName: 'HP LaserJet Pro P1102w', tonerModel: 'HP 85A (CE285A)', type: 'Laser', colorType: 'Mono' },
                        { label: 'HP 102', modelName: 'HP LaserJet Pro M102a/w', tonerModel: 'HP 17A (CF217A)', type: 'Laser', colorType: 'Mono' },
                        { label: 'HP 402', modelName: 'HP LaserJet Pro M402dn', tonerModel: 'HP 26A (CF226A)', type: 'Laser', colorType: 'Mono' },
                        { label: 'HP 1320', modelName: 'HP LaserJet 1320', tonerModel: 'HP 49A (Q5949A)', type: 'Laser', colorType: 'Mono' },
                        { label: 'HP M 600', modelName: 'HP LaserJet Enterprise 600 M601', tonerModel: 'HP 90A (CE390A)', type: 'Laser', colorType: 'Mono' },
                        { label: 'HP M 602', modelName: 'HP LaserJet Enterprise M602dn', tonerModel: 'HP 90A (CE390A)', type: 'Laser', colorType: 'Mono' },
                        { label: 'HP 2300', modelName: 'HP LaserJet 2300', tonerModel: 'HP 10A (Q2610A)', type: 'Laser', colorType: 'Mono' },
                        { label: 'BROTHER', modelName: 'Brother Laser Printer', tonerModel: 'Brother TN-2380 / TN-2420', type: 'Laser', colorType: 'Mono' },
                        { label: 'EPSON INK JET', modelName: 'Epson EcoTank InkJet', tonerModel: 'Epson 003 / 664 Ink Bottle', type: 'Inkjet', colorType: 'Color' },
                      ].map((preset) => (
                        <button
                          key={preset.label}
                          type="button"
                          onClick={() => {
                            if (!name) setName(preset.modelName);
                            setPrinterSpecs({
                              ...printerSpecs,
                              printerType: preset.type as any,
                              colorType: preset.colorType as any,
                              tonerModel: preset.tonerModel,
                            });
                          }}
                          className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-bold text-slate-700 hover:border-emerald-500 hover:bg-emerald-50 hover:text-emerald-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 transition"
                          title={`Auto fill ${preset.modelName} (${preset.tonerModel})`}
                        >
                          <span>{preset.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400">Printer Type</label>
                      <select
                        value={printerSpecs.printerType || 'Laser'}
                        onChange={(e) => setPrinterSpecs({ ...printerSpecs, printerType: e.target.value as any })}
                        className="w-full rounded-lg border border-slate-200 bg-slate-50 p-2 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                      >
                        <option value="Laser">Laser</option>
                        <option value="Inkjet">Inkjet</option>
                        <option value="Thermal">Thermal</option>
                        <option value="Dot Matrix">Dot Matrix</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400">Color / Mono</label>
                      <select
                        value={printerSpecs.colorType || 'Mono'}
                        onChange={(e) => setPrinterSpecs({ ...printerSpecs, colorType: e.target.value as any })}
                        className="w-full rounded-lg border border-slate-200 bg-slate-50 p-2 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                      >
                        <option value="Mono">Monochrome</option>
                        <option value="Color">Color</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400">Connection</label>
                      <select
                        value={printerSpecs.connectionType || 'Network'}
                        onChange={(e) => setPrinterSpecs({ ...printerSpecs, connectionType: e.target.value as any })}
                        className="w-full rounded-lg border border-slate-200 bg-slate-50 p-2 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                      >
                        <option value="Network">Network Ethernet</option>
                        <option value="USB">USB Direct</option>
                        <option value="Both">Both Network & USB</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400">Toner Model</label>
                      <input
                        type="text"
                        placeholder="e.g. HP 59A (CF259A)"
                        value={printerSpecs.tonerModel || ''}
                        onChange={(e) => setPrinterSpecs({ ...printerSpecs, tonerModel: e.target.value })}
                        className="w-full rounded-lg border border-slate-200 bg-slate-50 p-2 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400">Toner Level (%)</label>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={printerSpecs.tonerLevel || 100}
                        onChange={(e) => setPrinterSpecs({ ...printerSpecs, tonerLevel: Number(e.target.value) })}
                        className="w-full rounded-lg border border-slate-200 bg-slate-50 p-2 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* SCANNER SPECS & PRESETS */}
              {category === 'Scanner' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-xs text-blue-600 dark:text-blue-400">Scanner Specific Configurations</h4>
                    <span className="text-[10px] text-slate-400 font-medium">Quick select scanner preset</span>
                  </div>

                  {/* Quick Select Buttons for Scanners */}
                  <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-2.5 dark:border-blue-900 dark:bg-blue-950/40 space-y-1.5">
                    <div className="text-[10px] font-bold text-blue-700 dark:text-blue-300 uppercase tracking-wider">
                      Standard Scanner Model Presets:
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        { label: 'Fujitsu fi-7160', brandName: 'Fujitsu', modelName: 'fi-7160 Heavy Duty ADF Scanner', type: 'ADF Sheetfed', speed: '60 ppm', duplex: true },
                        { label: 'HP ScanJet Pro', brandName: 'HP', modelName: 'ScanJet Pro 2600 f1', type: 'Flatbed & ADF', speed: '25 ppm', duplex: true },
                        { label: 'Canon ImageFORMULA', brandName: 'Canon', modelName: 'ImageFORMULA DR-C225 II', type: 'ADF Sheetfed', speed: '25 ppm', duplex: true },
                        { label: 'Epson Perfection', brandName: 'Epson', modelName: 'Perfection V600 Photo Scanner', type: 'Flatbed', speed: '15 ppm', duplex: false },
                        { label: 'Avision ADF', brandName: 'Avision', modelName: 'AV332U Sheetfed Scanner', type: 'ADF Sheetfed', speed: '40 ppm', duplex: true },
                      ].map((preset) => (
                        <button
                          key={preset.label}
                          type="button"
                          onClick={() => {
                            if (!name) setName(preset.modelName);
                            if (!brand) setBrand(preset.brandName);
                            if (!model) setModel(preset.label);
                            setScannerSpecs({
                              scannerType: preset.type as any,
                              scanSpeedPpm: preset.speed,
                              duplexSupported: preset.duplex,
                              maxResolutionDpi: '600 x 600 DPI',
                            });
                          }}
                          className="rounded-lg border border-blue-200 bg-white px-2 py-1 text-[11px] font-bold text-blue-900 hover:border-blue-500 hover:bg-blue-100 dark:border-blue-800 dark:bg-slate-900 dark:text-blue-200 dark:hover:bg-slate-800 transition"
                          title={`Auto fill ${preset.modelName}`}
                        >
                          <span>📄 {preset.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400">Scanner Type</label>
                      <select
                        value={scannerSpecs.scannerType || 'ADF Sheetfed'}
                        onChange={(e) => setScannerSpecs({ ...scannerSpecs, scannerType: e.target.value as any })}
                        className="w-full rounded-lg border border-slate-200 bg-slate-50 p-2 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                      >
                        <option value="ADF Sheetfed">ADF Sheetfed</option>
                        <option value="Flatbed">Flatbed</option>
                        <option value="Flatbed & ADF">Flatbed & ADF</option>
                        <option value="Handheld / Portable">Handheld / Portable</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400">Scan Speed (PPM)</label>
                      <input
                        type="text"
                        placeholder="e.g. 60 ppm"
                        value={scannerSpecs.scanSpeedPpm || ''}
                        onChange={(e) => setScannerSpecs({ ...scannerSpecs, scanSpeedPpm: e.target.value })}
                        className="w-full rounded-lg border border-slate-200 bg-slate-50 p-2 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400">Duplex (Both Sides)</label>
                      <select
                        value={scannerSpecs.duplexSupported ? 'yes' : 'no'}
                        onChange={(e) => setScannerSpecs({ ...scannerSpecs, duplexSupported: e.target.value === 'yes' })}
                        className="w-full rounded-lg border border-slate-200 bg-slate-50 p-2 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                      >
                        <option value="yes">Supported (Duplex)</option>
                        <option value="no">Single Sided (Simplex)</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* NETWORK DEVICE SPECS */}
              {isNetworkDev && (
                <div className="space-y-3">
                  <h4 className="font-bold text-xs text-emerald-600 dark:text-emerald-400">Network Device Hardware Details</h4>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400">Total Ports</label>
                      <input
                        type="number"
                        value={networkSpecs.totalPorts || 24}
                        onChange={(e) => setNetworkSpecs({ ...networkSpecs, totalPorts: Number(e.target.value) })}
                        className="w-full rounded-lg border border-slate-200 bg-slate-50 p-2 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400">SFP Fiber Ports</label>
                      <input
                        type="number"
                        value={networkSpecs.sfpPorts || 4}
                        onChange={(e) => setNetworkSpecs({ ...networkSpecs, sfpPorts: Number(e.target.value) })}
                        className="w-full rounded-lg border border-slate-200 bg-slate-50 p-2 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400">Management IP</label>
                      <input
                        type="text"
                        placeholder="10.100.0.10"
                        value={networkSpecs.managementIp || ''}
                        onChange={(e) => setNetworkSpecs({ ...networkSpecs, managementIp: e.target.value })}
                        className="w-full rounded-lg border border-slate-200 bg-slate-50 p-2 text-xs font-mono dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400">Rack Number</label>
                      <input
                        type="text"
                        placeholder="Rack-04-A"
                        value={networkSpecs.rackNumber || ''}
                        onChange={(e) => setNetworkSpecs({ ...networkSpecs, rackNumber: e.target.value })}
                        className="w-full rounded-lg border border-slate-200 bg-slate-50 p-2 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* CABLE & PATCH CORD SPECS */}
              {isCable && (
                <div className="space-y-3 rounded-xl border border-cyan-200 bg-cyan-50/50 p-3.5 dark:border-cyan-900/50 dark:bg-cyan-950/20">
                  <div className="flex items-center justify-between">
                    <h4 className="flex items-center gap-1.5 font-extrabold text-xs text-cyan-900 dark:text-cyan-300">
                      <Cable className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
                      <span>Fiber & Network Cable Technical Specifications</span>
                    </h4>
                    <span className="text-[10px] text-slate-500">Quick Cable Presets</span>
                  </div>

                  {/* Cable Presets */}
                  <div className="flex flex-wrap gap-1.5 pb-2 border-b border-cyan-200 dark:border-cyan-900/40">
                    {[
                      {
                        label: '🧵 Fiber 10m LC-LC OS2 (Corning)',
                        brand: 'Corning',
                        model: 'LC-LC Duplex 9/125 OS2',
                        type: 'Single-Mode OS2',
                        connector: 'LC-LC Duplex',
                        length: '10m',
                        shielding: 'LSZH Fire Retardant',
                        color: 'Yellow',
                        speed: '10 Gbps',
                      },
                      {
                        label: '🧵 Fiber 5m OM3 Aqua (Panduit)',
                        brand: 'Panduit',
                        model: 'LC-LC Duplex OM3 10G',
                        type: 'Multi-Mode OM3',
                        connector: 'LC-LC Duplex',
                        length: '5m',
                        shielding: 'LSZH Fire Retardant',
                        color: 'Aqua',
                        speed: '10 Gbps',
                      },
                      {
                        label: '🌐 Cat6 UTP 3m Blue (Schneider)',
                        brand: 'Schneider Electric',
                        model: 'Actassi Cat6 UTP 3m',
                        type: 'Cat6 UTP',
                        connector: 'RJ45 Snagless Molded',
                        length: '3m',
                        shielding: 'UTP (Unshielded)',
                        color: 'Blue',
                        speed: '1 Gbps (250MHz)',
                      },
                      {
                        label: '🌐 Cat6 UTP 5m Grey (D-Link)',
                        brand: 'D-Link',
                        model: 'Cat6 Patch Cord 5m',
                        type: 'Cat6 UTP',
                        connector: 'RJ45 Snagless Molded',
                        length: '5m',
                        shielding: 'UTP (Unshielded)',
                        color: 'Grey',
                        speed: '1 Gbps (250MHz)',
                      },
                      {
                        label: '📦 Cat6 305m Roll (Solid Copper)',
                        brand: 'Schneider Electric',
                        model: 'Cat6 UTP 23AWG 305m Box',
                        type: 'Cat6 UTP',
                        connector: 'Raw Cable (No RJ45)',
                        length: '305m Roll Box',
                        shielding: 'UTP (Unshielded)',
                        color: 'Blue',
                        speed: '1 Gbps (250MHz)',
                      },
                    ].map((preset) => (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => {
                          if (!brand) setBrand(preset.brand);
                          if (!model) setModel(preset.model);
                          if (!name) setName(`${preset.brand} ${preset.model}`);
                          setCableSpecs({
                            cableType: preset.type,
                            connectorType: preset.connector,
                            length: preset.length,
                            shielding: preset.shielding,
                            jacketColor: preset.color,
                            bandwidthSpeed: preset.speed,
                          });
                        }}
                        className="rounded-lg border border-cyan-200 bg-white px-2 py-1 text-[11px] font-bold text-cyan-950 hover:border-cyan-500 hover:bg-cyan-100 dark:border-cyan-800 dark:bg-slate-900 dark:text-cyan-200 dark:hover:bg-slate-800 transition shadow-2xs"
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">Cable Type / Standard</label>
                      <select
                        value={cableSpecs.cableType || 'Single-Mode OS2'}
                        onChange={(e) => setCableSpecs({ ...cableSpecs, cableType: e.target.value })}
                        className="w-full rounded-lg border border-slate-200 bg-white p-2 text-xs font-medium dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                      >
                        <option value="Single-Mode OS2">Fiber Single-Mode OS2 (9/125µm)</option>
                        <option value="Multi-Mode OM3">Fiber Multi-Mode OM3 10G (50/125µm)</option>
                        <option value="Multi-Mode OM4">Fiber Multi-Mode OM4 (50/125µm)</option>
                        <option value="Cat6 UTP">Cat6 UTP Gigabit (250MHz)</option>
                        <option value="Cat6A SFTP">Cat6A 10G Shielded (500MHz)</option>
                        <option value="Cat5e UTP">Cat5e UTP (100MHz)</option>
                        <option value="Cat7 / Cat8">Cat7 / Cat8 Ultra Shielded</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">Connector Interface</label>
                      <select
                        value={cableSpecs.connectorType || 'LC-LC Duplex'}
                        onChange={(e) => setCableSpecs({ ...cableSpecs, connectorType: e.target.value })}
                        className="w-full rounded-lg border border-slate-200 bg-white p-2 text-xs font-medium dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                      >
                        <option value="LC-LC Duplex">LC-LC Duplex (SFP Optical)</option>
                        <option value="SC-LC Duplex">SC-LC Duplex</option>
                        <option value="SC-SC Duplex">SC-SC Duplex</option>
                        <option value="RJ45 Snagless Molded">RJ45 Snagless Molded Boot</option>
                        <option value="Raw Cable (No RJ45)">Raw Cable / 305m Roll Box</option>
                        <option value="ST-ST Duplex">ST-ST Duplex</option>
                        <option value="MTP/MPO 12-Fiber">MTP/MPO 12-Fiber High Density</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">Length / Dimension</label>
                      <select
                        value={cableSpecs.length || '10m'}
                        onChange={(e) => setCableSpecs({ ...cableSpecs, length: e.target.value })}
                        className="w-full rounded-lg border border-slate-200 bg-white p-2 text-xs font-medium dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                      >
                        <option value="1m">1 Meter (3.3 ft)</option>
                        <option value="2m">2 Meters (6.6 ft)</option>
                        <option value="3m">3 Meters (9.8 ft)</option>
                        <option value="5m">5 Meters (16.4 ft)</option>
                        <option value="10m">10 Meters (32.8 ft)</option>
                        <option value="15m">15 Meters (49.2 ft)</option>
                        <option value="20m">20 Meters (65.6 ft)</option>
                        <option value="30m">30 Meters (98.4 ft)</option>
                        <option value="50m">50 Meters (164 ft)</option>
                        <option value="305m Roll Box">305m (1000 ft) Roll Box</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">Shielding / Jacket</label>
                      <select
                        value={cableSpecs.shielding || 'LSZH Fire Retardant'}
                        onChange={(e) => setCableSpecs({ ...cableSpecs, shielding: e.target.value })}
                        className="w-full rounded-lg border border-slate-200 bg-white p-2 text-xs font-medium dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                      >
                        <option value="LSZH Fire Retardant">LSZH (Low Smoke Zero Halogen)</option>
                        <option value="UTP (Unshielded)">UTP (Unshielded Twisted Pair)</option>
                        <option value="STP / FTP Shielded">STP / FTP Shielded Foil</option>
                        <option value="PVC Standard">PVC Standard Commercial</option>
                        <option value="Armored Outdoor">Armored Outdoor Direct Burial</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">Jacket Color</label>
                      <select
                        value={cableSpecs.jacketColor || 'Yellow'}
                        onChange={(e) => setCableSpecs({ ...cableSpecs, jacketColor: e.target.value })}
                        className="w-full rounded-lg border border-slate-200 bg-white p-2 text-xs font-medium dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                      >
                        <option value="Yellow">Yellow (OS2 Single-Mode Standard)</option>
                        <option value="Aqua">Aqua (OM3 Multi-Mode Standard)</option>
                        <option value="Blue">Blue (Cat6 Data Standard)</option>
                        <option value="Grey">Grey (Standard Network)</option>
                        <option value="Orange">Orange (OM1/OM2 Legacy)</option>
                        <option value="Purple">Purple (OM4 Standard)</option>
                        <option value="White">White</option>
                        <option value="Black">Black</option>
                        <option value="Red">Red (Critical / Security)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">Bandwidth / Rated Speed</label>
                      <input
                        type="text"
                        placeholder="e.g. 10 Gbps / 250 MHz"
                        value={cableSpecs.bandwidthSpeed || ''}
                        onChange={(e) => setCableSpecs({ ...cableSpecs, bandwidthSpeed: e.target.value })}
                        className="w-full rounded-lg border border-slate-200 bg-white p-2 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* UPS & BATTERY BANK SPECIFICATIONS */}
              {isUPS && (
                <div className="space-y-4 rounded-xl border border-amber-200 bg-amber-50/50 p-4 dark:border-amber-900/60 dark:bg-amber-950/20">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-amber-200/60 pb-2 dark:border-amber-900/40">
                    <div className="flex items-center gap-2">
                      <div className="rounded-lg bg-amber-500/20 p-1.5 text-amber-600 dark:text-amber-400">
                        <BatteryCharging className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-amber-950 dark:text-amber-200 uppercase tracking-wider">
                          Airport UPS & Battery Bank Engineering Specifications
                        </h4>
                        <p className="text-[11px] text-amber-700 dark:text-amber-400">
                          Critical power backup parameters for Radar, ATC Towers, Avionics and Data Centers
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Airport Quick Presets */}
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-bold text-amber-900 dark:text-amber-300">
                      PAA Airport Hardware Presets (Click to Auto-fill):
                    </label>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          if (!brand) setBrand('EATON');
                          setModel('DX 1000H');
                          setName('EATON DX 1000H - ATC Tower');
                          setRoom('Room 104');
                          setUpsSpecs({
                            modelNo: 'EATON DX 1000H',
                            capacityKvaKw: '1000VA / 900W Online Double Conversion',
                            voltage: '230V AC (Input: 220V/230V, Output: 230V ±1%, DC Bus: 36V DC)',
                            roomNo: 'Room 104',
                            locationDetails: 'Control Tower Complex, 1st Floor, ATC Avionics Rack',
                            backupTime: '25 Minutes (@ 70% load)',
                            noOfBatteries: 3,
                            batteryType: '12V 7.2Ah VRLA AGM (Phoenix / CSB)',
                            lastBatteryChangeDate: '2024-11-20',
                            nextBatteryChangeDate: '2026-11-20',
                            batteryHealthPercent: 95,
                            loadPercentage: 58,
                          });
                        }}
                        className="rounded-lg border border-amber-300 bg-white px-2.5 py-1 text-xs font-bold text-amber-900 hover:bg-amber-100 dark:border-amber-700 dark:bg-slate-900 dark:text-amber-300 shadow-2xs"
                      >
                        ⚡ EATON DX 1000H (Room 104 - 3 Batt)
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          if (!brand) setBrand('EATON');
                          setModel('3000H');
                          setName('EATON 3000H - Radar Station Bravo');
                          setRoom('Room 202');
                          setUpsSpecs({
                            modelNo: 'EATON 3000H',
                            capacityKvaKw: '3000VA / 2700W Online Double Conversion',
                            voltage: '230V AC (Input: 160V-290V, Output: 230V ±1%, DC Bus: 96V DC)',
                            roomNo: 'Room 202',
                            locationDetails: 'Radar Station Bravo, Ground Floor, Primary Rack 01',
                            backupTime: '45 Minutes (@ 65% load)',
                            noOfBatteries: 8,
                            batteryType: '12V 9.0Ah High-Rate VRLA AGM (Narada / Exide)',
                            lastBatteryChangeDate: '2024-08-15',
                            nextBatteryChangeDate: '2026-08-15',
                            batteryHealthPercent: 88,
                            loadPercentage: 62,
                          });
                        }}
                        className="rounded-lg border border-blue-300 bg-white px-2.5 py-1 text-xs font-bold text-blue-900 hover:bg-blue-100 dark:border-blue-700 dark:bg-slate-900 dark:text-blue-300 shadow-2xs"
                      >
                        ⚡ EATON 3000H (Room 202 - 8 Batt)
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          if (!brand) setBrand('APC by Schneider');
                          setModel('Smart-UPS SRT 5000VA');
                          setName('APC Smart-UPS 5000VA - Comms Room');
                          setRoom('Communications Room');
                          setUpsSpecs({
                            modelNo: 'Smart-UPS SRT 5000VA',
                            capacityKvaKw: '5000VA / 4500W Double Conversion Online',
                            voltage: '230V AC Single Phase In/Out, DC Bus: 192V DC',
                            roomNo: 'Communications Room',
                            locationDetails: 'Fire Station Main Building, Ground Floor Comms Rack',
                            backupTime: '50 Minutes (@ 55% load)',
                            noOfBatteries: 16,
                            batteryType: '12V 9Ah VRLA AGM RBC140 Cartridge',
                            lastBatteryChangeDate: '2024-10-05',
                            nextBatteryChangeDate: '2026-10-05',
                            batteryHealthPercent: 92,
                            loadPercentage: 55,
                          });
                        }}
                        className="rounded-lg border border-purple-300 bg-white px-2.5 py-1 text-xs font-bold text-purple-900 hover:bg-purple-100 dark:border-purple-700 dark:bg-slate-900 dark:text-purple-300 shadow-2xs"
                      >
                        ⚡ APC Smart-UPS 5000VA (Comms)
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
                        UPS Model Number
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. EATON DX 1000H, EATON 3000H"
                        value={upsSpecs.modelNo}
                        onChange={(e) => setUpsSpecs({ ...upsSpecs, modelNo: e.target.value })}
                        className="w-full rounded-lg border border-slate-200 bg-white p-2 text-xs font-semibold text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
                        Room Number / Station
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Room 104, Room 202"
                        value={upsSpecs.roomNo || room}
                        onChange={(e) => {
                          setUpsSpecs({ ...upsSpecs, roomNo: e.target.value });
                          setRoom(e.target.value);
                        }}
                        className="w-full rounded-lg border border-slate-200 bg-white p-2 text-xs font-bold text-amber-800 dark:border-slate-700 dark:bg-slate-800 dark:text-amber-300"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
                        Capacity / Power Rating
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 1000VA / 900W or 3000VA / 2700W"
                        value={upsSpecs.capacityKvaKw || ''}
                        onChange={(e) => setUpsSpecs({ ...upsSpecs, capacityKvaKw: e.target.value })}
                        className="w-full rounded-lg border border-slate-200 bg-white p-2 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
                        Operating Voltage & DC Bus
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 230V AC In/Out, 36V DC Bus (3x12V)"
                        value={upsSpecs.voltage}
                        onChange={(e) => setUpsSpecs({ ...upsSpecs, voltage: e.target.value })}
                        className="w-full rounded-lg border border-slate-200 bg-white p-2 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
                        Number of Installed Batteries
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="64"
                        value={upsSpecs.noOfBatteries}
                        onChange={(e) => setUpsSpecs({ ...upsSpecs, noOfBatteries: Number(e.target.value) })}
                        className="w-full rounded-lg border border-slate-200 bg-white p-2 text-xs font-bold text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
                        Tested Backup Time on Load
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 25 Minutes, 45 Minutes"
                        value={upsSpecs.backupTime}
                        onChange={(e) => setUpsSpecs({ ...upsSpecs, backupTime: e.target.value })}
                        className="w-full rounded-lg border border-slate-200 bg-white p-2 text-xs font-bold text-emerald-700 dark:border-slate-700 dark:bg-slate-800 dark:text-emerald-300"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
                        Battery Type & Model
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 12V 7.2Ah VRLA AGM (Phoenix / CSB)"
                        value={upsSpecs.batteryType || ''}
                        onChange={(e) => setUpsSpecs({ ...upsSpecs, batteryType: e.target.value })}
                        className="w-full rounded-lg border border-slate-200 bg-white p-2 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
                        Last Battery Replacement Date
                      </label>
                      <input
                        type="date"
                        value={upsSpecs.lastBatteryChangeDate || ''}
                        onChange={(e) => setUpsSpecs({ ...upsSpecs, lastBatteryChangeDate: e.target.value })}
                        className="w-full rounded-lg border border-slate-200 bg-white p-2 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
                        Next Battery Change Due
                      </label>
                      <input
                        type="date"
                        value={upsSpecs.nextBatteryChangeDate || ''}
                        onChange={(e) => setUpsSpecs({ ...upsSpecs, nextBatteryChangeDate: e.target.value })}
                        className="w-full rounded-lg border border-slate-200 bg-white p-2 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
                        Location / Floor Details
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Control Tower Complex, 1st Floor, ATC Avionics Rack"
                        value={upsSpecs.locationDetails || ''}
                        onChange={(e) => setUpsSpecs({ ...upsSpecs, locationDetails: e.target.value })}
                        className="w-full rounded-lg border border-slate-200 bg-white p-2 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
                        Current Battery Bank Health: {upsSpecs.batteryHealthPercent ?? 100}%
                      </label>
                      <input
                        type="range"
                        min="10"
                        max="100"
                        value={upsSpecs.batteryHealthPercent ?? 100}
                        onChange={(e) => setUpsSpecs({ ...upsSpecs, batteryHealthPercent: Number(e.target.value) })}
                        className="w-full accent-amber-500 cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: PHOTOS & ATTACHMENTS */}
          {activeTab === 'images' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Device Photo URL</label>
                <input
                  type="text"
                  placeholder="https://images.unsplash.com/..."
                  value={devicePhoto}
                  onChange={(e) => setDevicePhoto(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-800 outline-none focus:border-emerald-500 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                />
              </div>

              {devicePhoto && (
                <div className="mt-2 h-32 w-48 overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700">
                  <img src={devicePhoto} alt="Device Preview" className="h-full w-full object-cover" />
                </div>
              )}
            </div>
          )}

          {/* TAB 5: STATUS & SAVE */}
          {activeTab === 'status' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Asset Status <span className="text-rose-500">*</span>
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as AssetStatus)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:border-emerald-500 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                >
                  <option value="Active">Active (Deployed in Service)</option>
                  <option value="Spare">Spare (Available in Store)</option>
                  <option value="Under Repair">Under Repair / Service</option>
                  <option value="Faulty">Faulty (Awaiting Inspection)</option>
                  <option value="Scrap">Scrap (Beyond Repair)</option>
                </select>
              </div>

              <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-4 text-xs text-emerald-800 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300">
                <div className="flex items-center gap-2 font-bold mb-1">
                  <QrCode className="h-4 w-4 text-emerald-500" />
                  <span>Automatic Barcode & QR Generation</span>
                </div>
                Upon saving, PAA Sentinel will automatically assign a unique Barcode and QR code sticker payload formatted for standard PAA property tags.
              </div>
            </div>
          )}

          {/* Modal Footer Controls */}
          <div className="mt-8 flex items-center justify-between border-t border-slate-100 pt-4 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() => setIsProcurementModalOpen(true)}
                className="flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs font-bold text-indigo-700 hover:bg-indigo-100 dark:border-indigo-900/50 dark:bg-indigo-950 dark:text-indigo-300 transition"
                title="Generate Official CAAF-001-XXIT-2.0 Procurement Authorization Form"
              >
                <FileText className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                <span>Official CAAF-001-XXIT-2.0 Form</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              {activeTab !== 'basic' && (
                <button
                  type="button"
                  onClick={() => {
                    if (activeTab === 'company') setActiveTab('basic');
                    else if (activeTab === 'specs') setActiveTab('company');
                    else if (activeTab === 'images') setActiveTab('specs');
                    else if (activeTab === 'status') setActiveTab('images');
                  }}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                >
                  Back
                </button>
              )}

              {activeTab !== 'status' ? (
                <button
                  type="button"
                  onClick={() => {
                    if (activeTab === 'basic') setActiveTab('company');
                    else if (activeTab === 'company') setActiveTab('specs');
                    else if (activeTab === 'specs') setActiveTab('images');
                    else if (activeTab === 'images') setActiveTab('status');
                  }}
                  className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900"
                >
                  Next Step
                </button>
              ) : (
                <button
                  type="submit"
                  className="rounded-xl bg-emerald-600 px-5 py-2 text-xs font-bold text-white shadow-md hover:bg-emerald-500 dark:bg-emerald-500 dark:hover:bg-emerald-400"
                >
                  {assetToEdit ? 'Update Asset Record' : 'Save & Register Asset'}
                </button>
              )}
            </div>
          </div>
        </form>
      </div>

      <AddDepartmentModal
        isOpen={isAddDeptOpen}
        onClose={() => setIsAddDeptOpen(false)}
        onDepartmentAdded={(newDept) => setDepartment(newDept as Department)}
      />
      <AddBrandModal
        isOpen={isAddBrandOpen}
        onClose={() => setIsAddBrandOpen(false)}
        onBrandAdded={(newBrand) => setBrand(newBrand)}
      />
      <AddVendorModal
        isOpen={isAddVendorOpen}
        onClose={() => setIsAddVendorOpen(false)}
        onVendorAdded={(newVendor) => setVendorCompany(newVendor)}
      />
      <AddCategoryModal
        isOpen={isAddCategoryOpen}
        onClose={() => setIsAddCategoryOpen(false)}
        onCategoryAdded={(newCat) => setCategory(newCat as DeviceCategory)}
      />

      <ProcurementFormModal
        isOpen={isProcurementModalOpen}
        onClose={() => setIsProcurementModalOpen(false)}
        initialData={{
          directorate: 'Directorate of Information Technology',
          section: department,
          requirementType: 'new',
          desktopQty: category === 'Desktop PC' ? 1 : 0,
          laptopQty: category === 'Laptop' ? 1 : 0,
          printerColorQty: category === 'Printer' ? 1 : 0,
          printerBwQty: category === 'Printer' ? 1 : 0,
          scannerQty: category === 'Scanner' ? 1 : 0,
          othersDetail: !['Desktop PC', 'Laptop', 'Printer', 'Scanner'].includes(category) ? `1 x ${category}` : '',
          justification: name ? `Procurement request for ${name} (${category}) for ${assignedUser || 'Department Staff'}.` : undefined,
        }}
      />
    </div>
  );
};
