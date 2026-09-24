import React, { useState, useRef, useMemo } from 'react';
import { useInventory } from '../context/InventoryContext';
import { AssetItem, DeviceCategory, Department } from '../types/inventory';
import {
  QrCode,
  Printer,
  Download,
  Copy,
  Check,
  Search,
  CheckCircle2,
  Tag,
  Scan,
  Sliders,
  Layers,
  FileCode,
  PrinterCheck,
  Sparkles,
  ExternalLink,
  Info,
  RefreshCw,
  Eye,
  Filter,
  Package,
  Cpu,
  Monitor,
  HardDrive,
  Wifi,
  ShieldCheck,
  Grid3X3,
  ListFilter,
  CheckSquare,
  Square,
  AlertCircle,
  FileText,
} from 'lucide-react';
import { generateCode128Bars, generateQRMatrix } from '../utils/barcodeQrGenerator';

interface BarcodeLabelsViewProps {
  onSelectAsset?: (asset: AssetItem) => void;
}

export type LabelFormat = 'standard' | 'compact' | 'logistics' | 'cable';
export type ViewTab = 'designer' | 'batch' | 'scanner';

export const BarcodeLabelsView: React.FC<BarcodeLabelsViewProps> = ({ onSelectAsset }) => {
  const { assets } = useInventory();

  // Active Main Tab
  const [activeTab, setActiveTab] = useState<ViewTab>('designer');

  // Single Asset Designer State
  const [selectedAssetId, setSelectedAssetId] = useState<string>(assets[0]?.id || '');
  const [useCustomText, setUseCustomText] = useState(false);
  const [labelFormat, setLabelFormat] = useState<LabelFormat>('standard');
  const [searchFilter, setSearchFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [departmentFilter, setDepartmentFilter] = useState<string>('All');

  // Custom Tag Input Fields
  const [customAssetId, setCustomAssetId] = useState('PAA-AST-10088');
  const [customName, setCustomName] = useState('Airside Handheld Barcode Scanner');
  const [customSerial, setCustomSerial] = useState('SN-ZEB-849201');
  const [customBarcode, setCustomBarcode] = useState('10088294019');
  const [customDept, setCustomDept] = useState<Department>('IT/CNS');
  const [customLoc, setCustomLoc] = useState('Terminal 1 - Baggage Handling');

  // Sizing & Vector Customization
  const [qrSize, setQrSize] = useState<number>(120);
  const [barcodeHeight, setBarcodeHeight] = useState<number>(45);
  const [barWidthMult, setBarWidthMult] = useState<number>(2);
  const [showLocation, setShowLocation] = useState(true);
  const [showTamperNotice, setShowTamperNotice] = useState(true);

  // User Action Feedbacks
  const [copied, setCopied] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [printSuccess, setPrintSuccess] = useState(false);

  // Batch Printing State
  const [batchSelectedIds, setBatchSelectedIds] = useState<string[]>(
    assets.slice(0, 6).map((a) => a.id)
  );
  const [batchFormat, setBatchFormat] = useState<LabelFormat>('standard');
  const [batchCategory, setBatchCategory] = useState<string>('All');
  const [batchDepartment, setBatchDepartment] = useState<string>('All');
  const [batchLayout, setBatchLayout] = useState<'sheet' | 'roll'>('sheet');

  // Simulator State
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<{
    barcodeDecoded?: string;
    qrDecoded?: any;
    timestamp?: string;
  } | null>(null);

  const printAreaRef = useRef<HTMLDivElement>(null);
  const batchPrintAreaRef = useRef<HTMLDivElement>(null);

  // Location string formatter
  const formatLocation = (loc: any): string => {
    if (!loc) return 'Main Terminal';
    if (typeof loc === 'string') return loc;
    if (typeof loc === 'object') {
      const parts = [loc.building, loc.floor, loc.room].filter(Boolean);
      return parts.length > 0 ? parts.join(', ') : 'Main Terminal';
    }
    return String(loc);
  };

  // Filtered assets for dropdown / search
  const filteredAssets = useMemo(() => {
    return assets.filter((a) => {
      const matchesSearch =
        !searchFilter ||
        a.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
        a.id.toLowerCase().includes(searchFilter.toLowerCase()) ||
        a.assetTag.toLowerCase().includes(searchFilter.toLowerCase()) ||
        a.serialNumber.toLowerCase().includes(searchFilter.toLowerCase()) ||
        a.barcode.toLowerCase().includes(searchFilter.toLowerCase());

      const matchesCat = categoryFilter === 'All' || a.category === categoryFilter;
      const matchesDept = departmentFilter === 'All' || a.department === departmentFilter;

      return matchesSearch && matchesCat && matchesDept;
    });
  }, [assets, searchFilter, categoryFilter, departmentFilter]);

  // Active Asset
  const currentAsset: AssetItem = useMemo(() => {
    return assets.find((a) => a.id === selectedAssetId) || assets[0] || {
      id: 'PAA-AST-10001',
      name: 'Standard IT Workstation',
      category: 'Desktop Computers',
      department: 'IT/CNS',
      barcode: '10001849201',
      assetTag: 'PAA-TAG-8921',
      serialNumber: 'SN-78492019',
      location: { building: 'AOCC Terminal', floor: '1st Floor', room: 'Ops Room 12' },
      assignedUser: 'Operations Supervisor',
      vendorCompany: 'Dell Technologies',
      brand: 'Dell',
      model: 'OptiPlex 7090',
      paaNumber: 'PAA-HQ-019',
      purchaseDate: '2023-01-15',
      warrantyExpiry: '2026-01-15',
      status: 'In Service',
      isRemoved: false,
      qrCode: 'PAA-AST-10001-QR',
    };
  }, [assets, selectedAssetId]);

  // Derived Barcode & QR strings
  const activeBarcodeValue = useCustomText ? customBarcode : currentAsset.barcode || '10001849201';
  const activeAssetId = useCustomText ? customAssetId : currentAsset.id || 'PAA-AST-10001';
  const activeAssetName = useCustomText ? customName : currentAsset.name;
  const activeSerial = useCustomText ? customSerial : currentAsset.serialNumber;
  const activeDept = useCustomText ? customDept : currentAsset.department;
  const activeLoc = useCustomText ? customLoc : formatLocation(currentAsset.location);

  const activeQrPayload = useMemo(() => {
    if (useCustomText) {
      return JSON.stringify({
        sys: 'PAA-SENTINEL-v5',
        id: customAssetId,
        name: customName,
        sn: customSerial,
        dept: customDept,
        loc: customLoc,
        bc: customBarcode,
      });
    }
    return JSON.stringify({
      sys: 'PAA-SENTINEL-v5',
      id: currentAsset.id,
      tag: currentAsset.assetTag,
      name: currentAsset.name,
      sn: currentAsset.serialNumber,
      dept: currentAsset.department,
      loc: formatLocation(currentAsset.location),
      bc: currentAsset.barcode,
    });
  }, [useCustomText, customAssetId, customName, customSerial, customDept, customLoc, customBarcode, currentAsset]);

  // Generate Vector Barcode & QR Matrix
  const { bars, totalWidth } = useMemo(() => {
    return generateCode128Bars(activeBarcodeValue, barWidthMult);
  }, [activeBarcodeValue, barWidthMult]);

  const qrMatrix = useMemo(() => {
    return generateQRMatrix(activeQrPayload);
  }, [activeQrPayload]);

  // Handle Print Action
  const handlePrint = () => {
    window.print();
    setPrintSuccess(true);
    setTimeout(() => setPrintSuccess(false), 3000);
  };

  // Copy QR Payload to Clipboard
  const handleCopyPayload = () => {
    navigator.clipboard.writeText(activeQrPayload);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Download SVG
  const handleDownloadSVG = () => {
    if (!printAreaRef.current) return;
    const innerHtml = printAreaRef.current.innerHTML;
    const svgWrapper = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="420" viewBox="0 0 600 420"><foreignObject width="100%" height="100%">${innerHtml}</foreignObject></svg>`;
    const blob = new Blob([svgWrapper], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `PAA_Label_${activeAssetId}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 2500);
  };

  // Simulate Barcode Scanner
  const handleSimulateScan = () => {
    setIsScanning(true);
    setScanResult(null);

    setTimeout(() => {
      setIsScanning(false);
      try {
        const parsed = JSON.parse(activeQrPayload);
        setScanResult({
          barcodeDecoded: activeBarcodeValue,
          qrDecoded: parsed,
          timestamp: new Date().toLocaleTimeString(),
        });
      } catch {
        setScanResult({
          barcodeDecoded: activeBarcodeValue,
          qrDecoded: { raw: activeQrPayload },
          timestamp: new Date().toLocaleTimeString(),
        });
      }
    }, 700);
  };

  // Batch toggle helpers
  const handleToggleBatchAsset = (id: string) => {
    if (batchSelectedIds.includes(id)) {
      setBatchSelectedIds(batchSelectedIds.filter((item) => item !== id));
    } else {
      setBatchSelectedIds([...batchSelectedIds, id]);
    }
  };

  const handleSelectAllBatch = () => {
    setBatchSelectedIds(assets.map((a) => a.id));
  };

  const handleDeselectAllBatch = () => {
    setBatchSelectedIds([]);
  };

  // Batch assets filtered
  const batchAssets = useMemo(() => {
    return assets.filter((a) => {
      const matchCat = batchCategory === 'All' || a.category === batchCategory;
      const matchDept = batchDepartment === 'All' || a.department === batchDepartment;
      return matchCat && matchDept;
    });
  }, [assets, batchCategory, batchDepartment]);

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5 dark:border-slate-800">
          <div className="flex items-center gap-3.5">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 text-white shadow-lg shadow-emerald-600/20">
              <Scan className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl font-black text-slate-900 dark:text-white">
                  PAA Property QR & Barcode Generator
                </h1>
                <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300 border border-emerald-500/30">
                  Scan Compliant (Code 128 + 2D Matrix)
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Official property tag engine calibrated for Zebra ZPL, TSC, Brother, Xprinter, and continuous thermal sticker label rolls.
              </p>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2 text-center dark:border-slate-800 dark:bg-slate-800/60">
              <div className="text-[10px] uppercase font-bold text-slate-400">Total Assets</div>
              <div className="text-sm font-black text-slate-800 dark:text-slate-100">{assets.length}</div>
            </div>
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 px-3 py-2 text-center dark:border-emerald-800/60 dark:bg-emerald-950/40">
              <div className="text-[10px] uppercase font-bold text-emerald-700 dark:text-emerald-300">Barcodes Verified</div>
              <div className="text-sm font-black text-emerald-800 dark:text-emerald-200">100%</div>
            </div>
            <div className="rounded-xl border border-cyan-200 bg-cyan-50/60 px-3 py-2 text-center dark:border-cyan-800/60 dark:bg-cyan-950/40">
              <div className="text-[10px] uppercase font-bold text-cyan-700 dark:text-cyan-300">Format Presets</div>
              <div className="text-sm font-black text-cyan-800 dark:text-cyan-200">4 Types</div>
            </div>
          </div>
        </div>

        {/* View Mode Navigation Tabs */}
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('designer')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition ${
              activeTab === 'designer'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300'
            }`}
          >
            <Tag className="h-4 w-4" />
            <span>Single Asset & Custom Tag Designer</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('batch')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition ${
              activeTab === 'batch'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300'
            }`}
          >
            <Grid3X3 className="h-4 w-4" />
            <span>Batch Multi-Asset Printing Sheet</span>
            <span className="rounded-full bg-white/20 px-2 py-0.2 text-[10px] font-mono">
              {batchSelectedIds.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('scanner')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition ${
              activeTab === 'scanner'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300'
            }`}
          >
            <Scan className="h-4 w-4" />
            <span>Barcode & QR Scanner Simulator</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: SINGLE ASSET & CUSTOM TAG DESIGNER */}
      {/* ========================================================================= */}
      {activeTab === 'designer' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Configuration Controls (5 cols) */}
          <div className="lg:col-span-5 space-y-5">
            {/* Source Selection Card */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
                <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                  <Tag className="h-4 w-4 text-emerald-600" />
                  <span>Target Asset Data Source</span>
                </label>
                <div className="flex rounded-lg bg-slate-100 p-0.5 dark:bg-slate-800">
                  <button
                    type="button"
                    onClick={() => setUseCustomText(false)}
                    className={`rounded-md px-2.5 py-1 text-[11px] font-bold transition ${
                      !useCustomText
                        ? 'bg-white text-emerald-700 shadow-xs dark:bg-slate-700 dark:text-emerald-300'
                        : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
                    }`}
                  >
                    Inventory Asset
                  </button>
                  <button
                    type="button"
                    onClick={() => setUseCustomText(true)}
                    className={`rounded-md px-2.5 py-1 text-[11px] font-bold transition ${
                      useCustomText
                        ? 'bg-white text-emerald-700 shadow-xs dark:bg-slate-700 dark:text-emerald-300'
                        : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
                    }`}
                  >
                    Custom Input
                  </button>
                </div>
              </div>

              {!useCustomText ? (
                <div className="space-y-3">
                  {/* Search and Filters */}
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      value={searchFilter}
                      onChange={(e) => setSearchFilter(e.target.value)}
                      placeholder="Filter by name, ID, serial, barcode..."
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 py-2 text-xs font-medium text-slate-800 focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <select
                      value={departmentFilter}
                      onChange={(e) => setDepartmentFilter(e.target.value)}
                      className="rounded-xl border border-slate-200 bg-slate-50 p-2 text-[11px] font-bold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                    >
                      <option value="All">All Departments</option>
                      <option value="IT/CNS">IT/CNS</option>
                      <option value="Terminal Operations">Terminal Operations</option>
                      <option value="Airside Operations">Airside Operations</option>
                      <option value="Security (ASF)">Security (ASF)</option>
                      <option value="Cargo & Logistics">Cargo & Logistics</option>
                      <option value="Administration">Administration</option>
                    </select>

                    <select
                      value={categoryFilter}
                      onChange={(e) => setCategoryFilter(e.target.value)}
                      className="rounded-xl border border-slate-200 bg-slate-50 p-2 text-[11px] font-bold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                    >
                      <option value="All">All Categories</option>
                      <option value="Desktop Computers">Desktop Computers</option>
                      <option value="Laptops">Laptops</option>
                      <option value="Printers">Printers</option>
                      <option value="Scanners">Scanners</option>
                      <option value="Network Switches">Network Switches</option>
                      <option value="Routers">Routers</option>
                      <option value="UPS Systems">UPS Systems</option>
                      <option value="Servers">Servers</option>
                    </select>
                  </div>

                  {/* Asset Select Dropdown */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                      Choose Asset ({filteredAssets.length} matching)
                    </label>
                    <select
                      value={selectedAssetId}
                      onChange={(e) => setSelectedAssetId(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white p-2.5 font-mono text-xs font-bold text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                    >
                      {filteredAssets.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.id} • {a.name} ({a.department})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Asset Details Preview Mini-Card */}
                  {currentAsset && (
                    <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3 text-xs space-y-1 dark:border-slate-800 dark:bg-slate-800/40">
                      <div className="flex justify-between font-bold text-slate-800 dark:text-slate-200">
                        <span>{currentAsset.name}</span>
                        <span className="font-mono text-emerald-600 dark:text-emerald-400">{currentAsset.id}</span>
                      </div>
                      <div className="flex justify-between text-[11px] text-slate-500 dark:text-slate-400">
                        <span>Tag: {currentAsset.assetTag}</span>
                        <span>SN: {currentAsset.serialNumber}</span>
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">
                        Location: {formatLocation(currentAsset.location)}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* Custom Tag Input Mode */
                <div className="space-y-3 text-xs">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Asset ID</label>
                      <input
                        type="text"
                        value={customAssetId}
                        onChange={(e) => setCustomAssetId(e.target.value)}
                        placeholder="PAA-AST-99999"
                        className="w-full rounded-xl border border-slate-200 bg-white p-2 font-mono text-xs font-bold dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Barcode Code 128</label>
                      <input
                        type="text"
                        value={customBarcode}
                        onChange={(e) => setCustomBarcode(e.target.value)}
                        placeholder="10088294019"
                        className="w-full rounded-xl border border-slate-200 bg-white p-2 font-mono text-xs font-bold dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Equipment Name / Title</label>
                    <input
                      type="text"
                      value={customName}
                      onChange={(e) => setCustomName(e.target.value)}
                      placeholder="Handheld Wireless Scanner"
                      className="w-full rounded-xl border border-slate-200 bg-white p-2 text-xs font-bold dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Serial Number</label>
                      <input
                        type="text"
                        value={customSerial}
                        onChange={(e) => setCustomSerial(e.target.value)}
                        placeholder="SN-9948201"
                        className="w-full rounded-xl border border-slate-200 bg-white p-2 font-mono text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Department</label>
                      <select
                        value={customDept}
                        onChange={(e) => setCustomDept(e.target.value as Department)}
                        className="w-full rounded-xl border border-slate-200 bg-white p-2 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      >
                        <option value="IT/CNS">IT/CNS</option>
                        <option value="Terminal Operations">Terminal Operations</option>
                        <option value="Airside Operations">Airside Operations</option>
                        <option value="Security (ASF)">Security (ASF)</option>
                        <option value="Cargo & Logistics">Cargo & Logistics</option>
                        <option value="Administration">Administration</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Location Details</label>
                    <input
                      type="text"
                      value={customLoc}
                      onChange={(e) => setCustomLoc(e.target.value)}
                      placeholder="Level 2 Terminal Flight Ops"
                      className="w-full rounded-xl border border-slate-200 bg-white p-2 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Template & Sizing Customizer */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4">
              <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <Sliders className="h-4 w-4 text-cyan-600" />
                <span>Label Template & Vector Tuning</span>
              </h3>

              {/* Template Buttons */}
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'standard', name: 'Standard (3"x2")', desc: 'Desktop / Server Tag' },
                  { id: 'compact', name: 'Compact (2"x1")', desc: 'Micro Peripheral Tag' },
                  { id: 'logistics', name: 'Carton (4"x6")', desc: 'Freight Cargo Box' },
                  { id: 'cable', name: 'Cable Wrap', desc: 'Patch Cord & Power' },
                ].map((fmt) => (
                  <button
                    key={fmt.id}
                    type="button"
                    onClick={() => setLabelFormat(fmt.id as LabelFormat)}
                    className={`rounded-xl border p-2.5 text-left text-xs font-bold transition ${
                      labelFormat === fmt.id
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-200'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
                    }`}
                  >
                    <div>{fmt.name}</div>
                    <div className="text-[10px] font-normal text-slate-400 mt-0.5">{fmt.desc}</div>
                  </button>
                ))}
              </div>

              {/* Sliders */}
              <div className="space-y-3 pt-2">
                <div>
                  <div className="flex justify-between text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    <span>Barcode Bar Height</span>
                    <span className="font-mono text-emerald-600">{barcodeHeight}px</span>
                  </div>
                  <input
                    type="range"
                    min="25"
                    max="75"
                    value={barcodeHeight}
                    onChange={(e) => setBarcodeHeight(Number(e.target.value))}
                    className="w-full accent-emerald-600"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    <span>2D QR Matrix Size</span>
                    <span className="font-mono text-emerald-600">{qrSize}px</span>
                  </div>
                  <input
                    type="range"
                    min="80"
                    max="160"
                    value={qrSize}
                    onChange={(e) => setQrSize(Number(e.target.value))}
                    className="w-full accent-emerald-600"
                  />
                </div>

                {/* Toggles */}
                <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100 dark:border-slate-800">
                  <span className="font-medium text-slate-600 dark:text-slate-400">Show Tamper Warning Note</span>
                  <input
                    type="checkbox"
                    checked={showTamperNotice}
                    onChange={(e) => setShowTamperNotice(e.target.checked)}
                    className="h-4 w-4 rounded text-emerald-600 focus:ring-emerald-500"
                  />
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-600 dark:text-slate-400">Show Physical Location</span>
                  <input
                    type="checkbox"
                    checked={showLocation}
                    onChange={(e) => setShowLocation(e.target.checked)}
                    className="h-4 w-4 rounded text-emerald-600 focus:ring-emerald-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Live Interactive Preview & Action Controls (7 cols) */}
          <div className="lg:col-span-7 space-y-5">
            {/* Live Interactive Sticker Preview Container */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800 mb-6">
                <div>
                  <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <PrinterCheck className="h-4 w-4 text-emerald-500" />
                    <span>Real-Time Label Sticker Canvas</span>
                  </h2>
                  <span className="text-[11px] text-slate-400">
                    Format: {labelFormat.toUpperCase()} • Dimensions: {labelFormat === 'standard' ? '3" x 2"' : labelFormat === 'compact' ? '2" x 1"' : labelFormat === 'logistics' ? '4" x 6"' : '1" x 3"'}
                  </span>
                </div>

                {/* Action Feedback Alerts */}
                {copied && (
                  <span className="rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 animate-in fade-in">
                    ✓ Scannable Payload Copied!
                  </span>
                )}
                {downloadSuccess && (
                  <span className="rounded-lg bg-cyan-50 px-2.5 py-1 text-xs font-bold text-cyan-700 dark:bg-cyan-950 dark:text-cyan-300 animate-in fade-in">
                    ✓ SVG File Downloaded!
                  </span>
                )}
              </div>

              {/* STICKER RENDERING AREA (Captured by print and SVG export) */}
              <div className="flex flex-col items-center justify-center p-4 bg-slate-100/70 dark:bg-slate-950/60 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 overflow-x-auto" ref={printAreaRef}>
                
                {/* 1. STANDARD TAG (3" x 2") */}
                {labelFormat === 'standard' && (
                  <div className="w-[360px] rounded-2xl border-2 border-slate-950 bg-white p-4 shadow-xl text-slate-950 font-sans print:w-full print:border-2 print:border-black print:shadow-none select-none">
                    {/* Header Bar */}
                    <div className="flex items-center justify-between border-b-2 border-slate-950 pb-2">
                      <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded bg-emerald-800 text-white font-black text-xs">
                          PAA
                        </div>
                        <div>
                          <div className="font-black text-[12px] uppercase tracking-wide leading-tight">PAKISTAN AIRPORTS AUTHORITY</div>
                          <div className="text-[9px] font-bold text-emerald-800">OFFICIAL IT ASSET PROPERTY TAG</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono font-black text-xs text-slate-950">{activeAssetId}</div>
                        <div className="text-[8px] font-bold text-slate-500 uppercase">{activeDept}</div>
                      </div>
                    </div>

                    {/* Title & Specs */}
                    <div className="mt-2.5">
                      <div className="text-xs font-black uppercase text-slate-950 truncate">
                        {activeAssetName}
                      </div>
                      <div className="flex justify-between text-[9px] font-bold text-slate-700 mt-0.5">
                        <span>SN: <strong className="font-mono text-slate-950">{activeSerial || 'SN-78492019'}</strong></span>
                        {showLocation && <span>LOC: <strong className="text-slate-950">{activeLoc}</strong></span>}
                      </div>
                    </div>

                    {/* Barcode & QR Code Center Matrix */}
                    <div className="my-3 flex items-center justify-between gap-3 rounded-xl border border-slate-300 bg-slate-50/90 p-3">
                      {/* Real 2D QR Code SVG */}
                      <div className="flex flex-col items-center">
                        <svg
                          width={qrSize}
                          height={qrSize}
                          viewBox={`0 0 ${qrMatrix.length} ${qrMatrix.length}`}
                          className="bg-white p-1 rounded border border-slate-300 shadow-2xs"
                        >
                          {qrMatrix.map((row, rIdx) =>
                            row.map((isDark, cIdx) =>
                              isDark ? (
                                <rect
                                  key={`${rIdx}-${cIdx}`}
                                  x={cIdx}
                                  y={rIdx}
                                  width="1"
                                  height="1"
                                  fill="#020617"
                                />
                              ) : null
                            )
                          )}
                        </svg>
                        <span className="text-[7px] font-mono font-bold text-slate-500 mt-1 uppercase">2D QR Matrix</span>
                      </div>

                      {/* Real Code 128 Barcode Vector */}
                      <div className="flex-1 flex flex-col items-center">
                        <div className="font-mono text-xs font-black tracking-widest text-slate-950">{activeBarcodeValue}</div>
                        <div className="w-full overflow-hidden flex justify-center py-1">
                          <svg
                            width={totalWidth}
                            height={barcodeHeight}
                            viewBox={`0 0 ${totalWidth} ${barcodeHeight}`}
                            className="w-full max-w-[200px]"
                          >
                            <rect width="100%" height="100%" fill="#ffffff" />
                            {bars.map((bar, bIdx) => (
                              <rect
                                key={bIdx}
                                x={bar.x}
                                y="0"
                                width={bar.width}
                                height={barcodeHeight}
                                fill="#020617"
                              />
                            ))}
                          </svg>
                        </div>
                        <div className="text-[8px] font-mono font-bold text-slate-600 mt-0.5">
                          TAG: {currentAsset.assetTag || 'PAA-TAG-8921'}
                        </div>
                      </div>
                    </div>

                    {/* Tag Footer Note */}
                    <div className="flex items-center justify-between border-t border-slate-200 pt-1.5 text-[8px] font-bold text-slate-600">
                      {showTamperNotice ? <span>DO NOT REMOVE OR TAMPER</span> : <span>CIVIL AVIATION / IT PROPERTY</span>}
                      <span className="font-mono text-emerald-800">PAA SENTINEL v5.0</span>
                    </div>
                  </div>
                )}

                {/* 2. COMPACT MICRO TAG (2" x 1") */}
                {labelFormat === 'compact' && (
                  <div className="w-[280px] rounded-xl border-2 border-slate-950 bg-white p-3 shadow-xl text-slate-950 font-sans print:w-full print:border-2 print:border-black select-none">
                    <div className="flex items-center justify-between border-b border-slate-950 pb-1">
                      <span className="font-black text-[10px] uppercase tracking-wider text-emerald-900">PAA PROPERTY</span>
                      <span className="font-mono font-bold text-[10px]">{activeAssetId}</span>
                    </div>
                    <div className="my-2 flex items-center justify-center gap-3">
                      <svg
                        width="70"
                        height="70"
                        viewBox={`0 0 ${qrMatrix.length} ${qrMatrix.length}`}
                        className="bg-white p-0.5 rounded border border-slate-300"
                      >
                        {qrMatrix.map((row, rIdx) =>
                          row.map((isDark, cIdx) =>
                            isDark ? <rect key={`${rIdx}-${cIdx}`} x={cIdx} y={rIdx} width="1" height="1" fill="#000000" /> : null
                          )
                        )}
                      </svg>
                      <div className="text-left text-[9px] font-bold space-y-0.5">
                        <div className="truncate max-w-[140px] font-black">{activeAssetName}</div>
                        <div className="font-mono text-slate-600">SN: {activeSerial}</div>
                        <div className="font-mono text-[8px] text-emerald-700">{activeBarcodeValue}</div>
                        <div className="text-[8px] text-slate-500">{activeDept}</div>
                      </div>
                    </div>
                    <div className="border-t border-slate-200 pt-1 text-center font-mono text-[8px] text-slate-500">
                      SENTINEL v5 • {activeAssetId}
                    </div>
                  </div>
                )}

                {/* 3. LOGISTICS & CARTON MANIFEST TAG (4" x 6") */}
                {labelFormat === 'logistics' && (
                  <div className="w-[460px] rounded-2xl border-4 border-slate-950 bg-white p-5 shadow-2xl text-slate-950 font-sans print:w-full print:border-4 print:border-black select-none">
                    <div className="flex items-center justify-between border-b-2 border-slate-950 pb-2">
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded bg-emerald-800 text-white font-black text-sm">
                          PAA
                        </div>
                        <div>
                          <div className="font-black text-sm uppercase tracking-wide">PAKISTAN AIRPORTS AUTHORITY</div>
                          <div className="text-[10px] font-bold text-emerald-800">AIRPORT IT LOGISTICS & CARTON MANIFEST</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono font-black text-sm">{activeAssetId}</div>
                        <div className="text-[10px] font-bold text-slate-600">{activeDept}</div>
                      </div>
                    </div>

                    <div className="my-4 grid grid-cols-2 gap-4">
                      <div className="space-y-1.5 text-xs">
                        <div><strong className="text-slate-600">EQUIPMENT:</strong> {activeAssetName}</div>
                        <div><strong className="text-slate-600">SERIAL NO:</strong> <span className="font-mono">{activeSerial}</span></div>
                        <div><strong className="text-slate-600">LOCATION:</strong> {activeLoc}</div>
                        <div><strong className="text-slate-600">DISPATCH REF:</strong> <span className="font-mono">LOG-2026-PAA</span></div>
                        <div><strong className="text-slate-600">TAMPER SEAL:</strong> <span className="font-bold text-emerald-800">VERIFIED</span></div>
                      </div>
                      <div className="flex flex-col items-center justify-center">
                        <svg
                          width="110"
                          height="110"
                          viewBox={`0 0 ${qrMatrix.length} ${qrMatrix.length}`}
                          className="bg-white p-1 rounded border-2 border-slate-950"
                        >
                          {qrMatrix.map((row, rIdx) =>
                            row.map((isDark, cIdx) =>
                              isDark ? <rect key={`${rIdx}-${cIdx}`} x={cIdx} y={rIdx} width="1" height="1" fill="#000000" /> : null
                            )
                          )}
                        </svg>
                        <span className="text-[8px] font-mono font-bold mt-1">SCAN VIA PAA MOBILE SCANNER</span>
                      </div>
                    </div>

                    <div className="border-t-2 border-slate-950 pt-2 flex flex-col items-center">
                      <div className="font-mono text-sm font-black tracking-widest">{activeBarcodeValue}</div>
                      <svg
                        width={totalWidth}
                        height="45"
                        viewBox={`0 0 ${totalWidth} 45`}
                        className="w-full max-w-[340px] mt-1"
                      >
                        <rect width="100%" height="100%" fill="#ffffff" />
                        {bars.map((bar, bIdx) => (
                          <rect key={bIdx} x={bar.x} y="0" width={bar.width} height="45" fill="#000000" />
                        ))}
                      </svg>
                    </div>
                  </div>
                )}

                {/* 4. CABLE / PORT WRAP TAG (1" x 3") */}
                {labelFormat === 'cable' && (
                  <div className="w-[320px] rounded-lg border-2 border-slate-950 bg-white p-2.5 shadow-lg text-slate-950 font-sans select-none">
                    <div className="flex items-center justify-between text-[9px] font-black border-b border-slate-300 pb-1">
                      <span>PAA CABLE FLAG</span>
                      <span className="font-mono">{activeAssetId}</span>
                    </div>
                    <div className="flex items-center justify-between gap-2 py-2">
                      <div className="text-[8px] font-bold space-y-0.5">
                        <div className="truncate max-w-[150px]">{activeAssetName}</div>
                        <div className="font-mono text-emerald-800">PORT: {activeSerial}</div>
                        <div className="text-slate-500">{activeDept}</div>
                      </div>
                      <svg
                        width="50"
                        height="50"
                        viewBox={`0 0 ${qrMatrix.length} ${qrMatrix.length}`}
                        className="bg-white p-0.5 border border-slate-300 shrink-0"
                      >
                        {qrMatrix.map((row, rIdx) =>
                          row.map((isDark, cIdx) =>
                            isDark ? <rect key={`${rIdx}-${cIdx}`} x={cIdx} y={rIdx} width="1" height="1" fill="#000000" /> : null
                          )
                        )}
                      </svg>
                    </div>
                    <div className="border-t border-slate-200 pt-1 flex justify-center">
                      <svg
                        width={totalWidth}
                        height="20"
                        viewBox={`0 0 ${totalWidth} 20`}
                        className="w-full max-w-[200px]"
                      >
                        <rect width="100%" height="100%" fill="#ffffff" />
                        {bars.map((bar, bIdx) => (
                          <rect key={bIdx} x={bar.x} y="0" width={bar.width} height="20" fill="#000000" />
                        ))}
                      </svg>
                    </div>
                  </div>
                )}

              </div>

              {/* Action Buttons Row */}
              <div className="mt-6 flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopyPayload}
                    className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 transition"
                  >
                    {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                    <span>{copied ? 'Copied QR Payload!' : 'Copy QR Data'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDownloadSVG}
                    className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 transition"
                  >
                    <Download className="h-4 w-4" />
                    <span>Download Vector SVG</span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  {onSelectAsset && currentAsset && (
                    <button
                      type="button"
                      onClick={() => onSelectAsset(currentAsset)}
                      className="flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2 text-xs font-bold text-emerald-800 hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 transition"
                    >
                      <Eye className="h-4 w-4" />
                      <span>Inspect Asset</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={handlePrint}
                    className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-emerald-600/20 hover:from-emerald-500 hover:to-teal-500 transition"
                  >
                    <Printer className="h-4 w-4" />
                    <span>Print Thermal Sticker Tag</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Scanner Simulation Card */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-600 dark:bg-cyan-500/20 dark:text-cyan-400">
                  <Scan className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white">Verify Label Scannability</h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Test how a handheld scanner (Zebra DS3678 / Honeywell) or mobile camera decodes this tag.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleSimulateScan}
                disabled={isScanning}
                className="flex items-center gap-2 rounded-xl bg-cyan-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-cyan-500 transition disabled:opacity-50"
              >
                <Scan className={`h-4 w-4 ${isScanning ? 'animate-pulse text-amber-300' : ''}`} />
                <span>{isScanning ? 'Decoding...' : 'Test Scan Tag'}</span>
              </button>
            </div>

            {/* Simulated Scan Result Popup/Card */}
            {scanResult && (
              <div className="rounded-2xl border border-emerald-300 bg-emerald-50/90 p-4 text-xs dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200 space-y-2 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <span className="font-bold flex items-center gap-1.5 text-emerald-900 dark:text-emerald-300">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    100% Scan Verification Successful (Beep!)
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">{scanResult.timestamp}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-1 font-mono text-[11px]">
                  <div className="bg-white/80 dark:bg-slate-900/80 p-2 rounded-lg border border-emerald-200 dark:border-emerald-800">
                    <div className="text-[9px] uppercase font-bold text-slate-400">Code 128 Decoded Value:</div>
                    <div className="font-black text-slate-900 dark:text-white">{scanResult.barcodeDecoded}</div>
                  </div>
                  <div className="bg-white/80 dark:bg-slate-900/80 p-2 rounded-lg border border-emerald-200 dark:border-emerald-800">
                    <div className="text-[9px] uppercase font-bold text-slate-400">QR System ID:</div>
                    <div className="font-black text-slate-900 dark:text-white">{scanResult.qrDecoded?.id || 'PAA-ASSET'}</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: BATCH MULTI-ASSET PRINTING SHEET */}
      {/* ========================================================================= */}
      {activeTab === 'batch' && (
        <div className="space-y-6">
          {/* Filter & Selection Bar */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4 dark:border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Grid3X3 className="h-4 w-4 text-emerald-500" />
                  <span>Batch Multi-Asset Label Printing</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Select equipment from any department or category to generate continuous sticker rolls or multi-label A4 sheets.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSelectAllBatch}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 transition"
                >
                  Select All ({assets.length})
                </button>
                <button
                  type="button"
                  onClick={handleDeselectAllBatch}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 transition"
                >
                  Clear Selection
                </button>
                <button
                  type="button"
                  onClick={handlePrint}
                  disabled={batchSelectedIds.length === 0}
                  className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-1.5 text-xs font-bold text-white shadow-md shadow-emerald-600/20 hover:from-emerald-500 hover:to-teal-500 transition disabled:opacity-50"
                >
                  <Printer className="h-4 w-4" />
                  <span>Print Batch ({batchSelectedIds.length})</span>
                </button>
              </div>
            </div>

            {/* Quick Filters */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Filter Department</label>
                <select
                  value={batchDepartment}
                  onChange={(e) => setBatchDepartment(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2 font-bold dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                >
                  <option value="All">All Departments</option>
                  <option value="IT/CNS">IT/CNS</option>
                  <option value="Terminal Operations">Terminal Operations</option>
                  <option value="Airside Operations">Airside Operations</option>
                  <option value="Security (ASF)">Security (ASF)</option>
                  <option value="Cargo & Logistics">Cargo & Logistics</option>
                  <option value="Administration">Administration</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Filter Category</label>
                <select
                  value={batchCategory}
                  onChange={(e) => setBatchCategory(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2 font-bold dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                >
                  <option value="All">All Categories</option>
                  <option value="Desktop Computers">Desktop Computers</option>
                  <option value="Laptops">Laptops</option>
                  <option value="Printers">Printers</option>
                  <option value="Scanners">Scanners</option>
                  <option value="Network Switches">Network Switches</option>
                  <option value="UPS Systems">UPS Systems</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Tag Format</label>
                <select
                  value={batchFormat}
                  onChange={(e) => setBatchFormat(e.target.value as LabelFormat)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2 font-bold dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                >
                  <option value="standard">Standard (3" x 2")</option>
                  <option value="compact">Compact (2" x 1")</option>
                  <option value="logistics">Carton (4" x 6")</option>
                  <option value="cable">Cable Wrap</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Paper Layout</label>
                <select
                  value={batchLayout}
                  onChange={(e) => setBatchLayout(e.target.value as 'sheet' | 'roll')}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2 font-bold dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                >
                  <option value="sheet">A4 / Letter Sheet Grid (2 columns)</option>
                  <option value="roll">Continuous Thermal Roll (Single Column)</option>
                </select>
              </div>
            </div>

            {/* Asset Selection Grid Chips */}
            <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-400">
                <span>Select Assets to Include in Batch</span>
                <span className="font-mono text-emerald-600">{batchSelectedIds.length} of {batchAssets.length} Selected</span>
              </div>
              <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto p-2 bg-slate-50 rounded-xl border border-slate-200 dark:bg-slate-800/40 dark:border-slate-700">
                {batchAssets.map((asset) => {
                  const isChecked = batchSelectedIds.includes(asset.id);
                  return (
                    <button
                      key={asset.id}
                      type="button"
                      onClick={() => handleToggleBatchAsset(asset.id)}
                      className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold transition border ${
                        isChecked
                          ? 'border-emerald-400 bg-emerald-50 text-emerald-800 dark:border-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-200'
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
                      }`}
                    >
                      {isChecked ? <CheckSquare className="h-3.5 w-3.5 text-emerald-600" /> : <Square className="h-3.5 w-3.5 text-slate-400" />}
                      <span>{asset.id}</span>
                      <span className="text-[10px] font-normal text-slate-400">({asset.name.slice(0, 18)})</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Batch Print Preview Canvas */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900" ref={batchPrintAreaRef}>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800 mb-6">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Printer className="h-4 w-4 text-emerald-500" />
                <span>Batch Sheet Preview ({batchSelectedIds.length} Labels Formatted)</span>
              </h3>
              <span className="text-xs text-slate-400">Ready for Thermal Roll or A4 Sheet Sticker Paper</span>
            </div>

            {batchSelectedIds.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 text-center text-slate-400">
                <Tag className="h-10 w-10 mb-2 opacity-40 text-slate-400" />
                <p className="text-sm font-bold">No Assets Selected for Batch Printing</p>
                <p className="text-xs mt-1">Select assets above or click "Select All" to generate a printable sheet.</p>
              </div>
            ) : (
              <div
                className={`gap-4 ${
                  batchLayout === 'sheet'
                    ? 'grid grid-cols-1 md:grid-cols-2 justify-items-center'
                    : 'flex flex-col items-center space-y-4'
                }`}
              >
                {assets
                  .filter((a) => batchSelectedIds.includes(a.id))
                  .map((asset) => {
                    const itemBars = generateCode128Bars(asset.barcode || '10001849201', 2);
                    const itemQr = generateQRMatrix(
                      JSON.stringify({
                        sys: 'PAA-SENTINEL-v5',
                        id: asset.id,
                        tag: asset.assetTag,
                        sn: asset.serialNumber,
                        dept: asset.department,
                        loc: formatLocation(asset.location),
                      })
                    );

                    return (
                      <div
                        key={asset.id}
                        className="w-[340px] rounded-2xl border-2 border-slate-950 bg-white p-3.5 shadow-md text-slate-950 font-sans print:shadow-none print:border-2 print:border-black"
                      >
                        <div className="flex items-center justify-between border-b border-slate-950 pb-1.5">
                          <div className="flex items-center gap-1.5">
                            <span className="flex h-5 w-5 items-center justify-center rounded bg-emerald-800 text-white font-black text-[10px]">
                              PAA
                            </span>
                            <span className="font-black text-[10px] uppercase">PAKISTAN AIRPORTS AUTHORITY</span>
                          </div>
                          <span className="font-mono font-black text-xs">{asset.id}</span>
                        </div>

                        <div className="mt-1.5">
                          <div className="text-[11px] font-black uppercase truncate">{asset.name}</div>
                          <div className="flex justify-between text-[8px] font-bold text-slate-600">
                            <span>SN: <strong className="font-mono text-slate-950">{asset.serialNumber}</strong></span>
                            <span>{asset.department}</span>
                          </div>
                        </div>

                        <div className="my-2 flex items-center justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50 p-2">
                          <svg
                            width="64"
                            height="64"
                            viewBox={`0 0 ${itemQr.length} ${itemQr.length}`}
                            className="bg-white p-0.5 rounded border border-slate-300"
                          >
                            {itemQr.map((row, rIdx) =>
                              row.map((isDark, cIdx) =>
                                isDark ? <rect key={`${rIdx}-${cIdx}`} x={cIdx} y={rIdx} width="1" height="1" fill="#020617" /> : null
                              )
                            )}
                          </svg>

                          <div className="flex-1 flex flex-col items-center">
                            <div className="font-mono text-[10px] font-black tracking-wider text-slate-950">
                              {asset.barcode || '10001849201'}
                            </div>
                            <div className="w-full overflow-hidden flex justify-center py-1">
                              <svg
                                width={itemBars.totalWidth}
                                height="32"
                                viewBox={`0 0 ${itemBars.totalWidth} 32`}
                                className="w-full max-w-[170px]"
                              >
                                <rect width="100%" height="100%" fill="#ffffff" />
                                {itemBars.bars.map((bar, bIdx) => (
                                  <rect key={bIdx} x={bar.x} y="0" width={bar.width} height="32" fill="#020617" />
                                ))}
                              </svg>
                            </div>
                            <div className="text-[7px] font-mono text-slate-500">TAG: {asset.assetTag}</div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between border-t border-slate-200 pt-1 text-[7px] font-bold text-slate-500">
                          <span>DO NOT REMOVE</span>
                          <span className="font-mono text-emerald-800">PAA SENTINEL v5</span>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: BARCODE & QR SCANNER SIMULATOR */}
      {/* ========================================================================= */}
      {activeTab === 'scanner' && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4 dark:border-slate-800">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Scan className="h-5 w-5 text-cyan-600" />
                <span>Hardware Barcode Scanner Simulation & Verification</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Simulate optical laser scanning on Code 128 bar symbology and 2D camera decoding on QR matrices.
              </p>
            </div>

            <button
              type="button"
              onClick={handleSimulateScan}
              disabled={isScanning}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 px-5 py-2.5 text-xs font-bold text-white shadow-md hover:from-cyan-500 hover:to-blue-500 transition disabled:opacity-50"
            >
              <Scan className={`h-4 w-4 ${isScanning ? 'animate-pulse text-amber-300' : ''}`} />
              <span>{isScanning ? 'Firing Laser & Decoding...' : 'Trigger Laser Barcode Scan'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Visual Scanner Stage */}
            <div className="relative flex flex-col items-center justify-center p-8 bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden min-h-[300px]">
              {/* Laser Beam Animation */}
              {isScanning && (
                <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-rose-500 to-transparent shadow-[0_0_15px_#f43f5e] animate-bounce" />
              )}

              {/* Tag Under Laser */}
              <div className={`transition-all duration-300 ${isScanning ? 'scale-105 filter drop-shadow-[0_0_12px_rgba(244,63,94,0.6)]' : ''}`}>
                <div className="w-[300px] rounded-xl bg-white p-4 text-slate-950 font-sans shadow-2xl">
                  <div className="flex justify-between border-b border-slate-950 pb-1 text-[10px] font-black">
                    <span>PAA SENTINEL SCAN TARGET</span>
                    <span className="font-mono">{activeAssetId}</span>
                  </div>
                  <div className="my-3 flex items-center justify-center">
                    <svg
                      width={totalWidth}
                      height="40"
                      viewBox={`0 0 ${totalWidth} 40`}
                      className="w-full max-w-[240px]"
                    >
                      <rect width="100%" height="100%" fill="#ffffff" />
                      {bars.map((bar, bIdx) => (
                        <rect key={bIdx} x={bar.x} y="0" width={bar.width} height="40" fill="#020617" />
                      ))}
                    </svg>
                  </div>
                  <div className="font-mono text-center text-xs font-black tracking-widest text-slate-950">
                    {activeBarcodeValue}
                  </div>
                </div>
              </div>

              <span className="text-[11px] font-mono text-slate-400 mt-4">
                {isScanning ? 'Laser Optics Active • Intercepting Barcode...' : 'Optical Field Ready • Aim Scanner Laser'}
              </span>
            </div>

            {/* Decoder Telemetry & Decoded Object Inspector */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Decoder Output & Scan Telemetry
              </h4>

              {scanResult ? (
                <div className="space-y-3">
                  <div className="rounded-xl border border-emerald-300 bg-emerald-50/80 p-3.5 text-xs text-emerald-950 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200">
                    <div className="flex items-center gap-2 font-bold text-emerald-900 dark:text-emerald-300">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      <span>Scan Captured at {scanResult.timestamp}</span>
                    </div>
                    <div className="mt-2 font-mono text-xs">
                      Decoded Code 128: <strong className="text-emerald-700 dark:text-emerald-400">{scanResult.barcodeDecoded}</strong>
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 font-mono text-xs space-y-1.5 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-200">
                    <div className="font-bold text-[11px] text-slate-500 uppercase">2D QR JSON Payload:</div>
                    <pre className="text-[11px] overflow-x-auto whitespace-pre-wrap bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700">
                      {JSON.stringify(scanResult.qrDecoded, null, 2)}
                    </pre>
                  </div>

                  {onSelectAsset && currentAsset && (
                    <button
                      type="button"
                      onClick={() => onSelectAsset(currentAsset)}
                      className="w-full flex items-center justify-center gap-2 rounded-xl bg-slate-900 py-2.5 text-xs font-bold text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white transition"
                    >
                      <Eye className="h-4 w-4" />
                      <span>Open Asset Record in Sentinel ({currentAsset.id})</span>
                    </button>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center p-12 text-center rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-slate-400">
                  <Scan className="h-8 w-8 mb-2 opacity-50 text-slate-400" />
                  <p className="text-xs font-bold">No Scan Data Yet</p>
                  <p className="text-[11px] mt-0.5">Click "Trigger Laser Barcode Scan" to test optical decoding.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
