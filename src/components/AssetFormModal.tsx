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
} from 'lucide-react';

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

  // Images State
  const [devicePhoto, setDevicePhoto] = useState('https://images.unsplash.com/photo-1587831990711-23ca6441447b?auto=format&fit=crop&w=600&q=80');
  const [serialPhoto, setSerialPhoto] = useState('');
  const [invoice, setInvoice] = useState('');
  const [warrantyCard, setWarrantyCard] = useState('');

  // Status
  const [status, setStatus] = useState<AssetStatus>('Active');

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
                  <h4 className="font-bold text-xs text-emerald-600 dark:text-emerald-400">Desktop / Laptop System Hardware Specs</h4>
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
                  <h4 className="font-bold text-xs text-emerald-600 dark:text-emerald-400">Printer Specific Configurations</h4>
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
