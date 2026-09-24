import React, { useState } from 'react';
import { useInventory } from '../context/InventoryContext';
import { PrinterPartItem } from '../types/inventory';
import {
  X,
  Wrench,
  Plus,
  Search,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  Package,
  Layers,
  ArrowUpDown,
  FileSpreadsheet,
} from 'lucide-react';

interface PrinterPartsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PART_CATEGORIES: PrinterPartItem['category'][] = [
  'Paper Feed & Separation',
  'Fuser & Heating',
  'Optics & Laser Scanner',
  'Electronics & Formatter',
  'Consumable & Drum',
  'Gears & Mechanics',
  'Power Supply',
  'Cables & Sensors',
];

export const PrinterPartsModal: React.FC<PrinterPartsModalProps> = ({ isOpen, onClose }) => {
  const { printerParts, addPrinterPart, updatePrinterPartStock, deletePrinterPart, printerCompanies, printerModels } =
    useInventory();

  const [activeTab, setActiveTab] = useState<'list' | 'add'>('list');
  const [search, setSearch] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('ALL');

  // Form State for Adding Part
  const [partName, setPartName] = useState('');
  const [partNumber, setPartNumber] = useState('');
  const [category, setCategory] = useState<PrinterPartItem['category']>('Paper Feed & Separation');
  const [company, setCompany] = useState<string>(printerCompanies[0] || 'HP (Hewlett-Packard)');
  const [compatibleModelsText, setCompatibleModelsText] = useState('');
  const [quantityInStock, setQuantityInStock] = useState<number>(5);
  const [reorderLevel, setReorderLevel] = useState<number>(2);
  const [unitCostPkr, setUnitCostPkr] = useState<number>(1200);
  const [storeLocation, setStoreLocation] = useState('Shelf 3, Parts Bin #5');
  const [condition, setCondition] = useState<PrinterPartItem['condition']>('Brand New');
  const [remarks, setRemarks] = useState('');
  const [formSuccess, setFormSuccess] = useState(false);

  if (!isOpen) return null;

  const filteredParts = printerParts.filter((part) => {
    if (selectedCategoryFilter !== 'ALL' && part.category !== selectedCategoryFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchCompat = part.compatibleModels?.some((m) => m.toLowerCase().includes(q));
      return (
        part.partName.toLowerCase().includes(q) ||
        part.partNumber.toLowerCase().includes(q) ||
        part.company.toLowerCase().includes(q) ||
        part.storeLocation?.toLowerCase().includes(q) ||
        matchCompat
      );
    }
    return true;
  });

  const lowStockCount = printerParts.filter((p) => p.quantityInStock <= p.reorderLevel).length;

  const handleAddPart = (e: React.FormEvent) => {
    e.preventDefault();
    if (!partName.trim() || !partNumber.trim()) return;

    const modelsList = compatibleModelsText
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    addPrinterPart({
      partName: partName.trim(),
      partNumber: partNumber.trim(),
      category,
      company,
      compatibleModels: modelsList.length > 0 ? modelsList : ['Universal / Multi-model'],
      quantityInStock: Number(quantityInStock) || 0,
      reorderLevel: Number(reorderLevel) || 1,
      unitCostPkr: Number(unitCostPkr) || 0,
      storeLocation: storeLocation.trim(),
      condition,
      remarks: remarks.trim(),
    });

    setFormSuccess(true);
    setTimeout(() => {
      setFormSuccess(false);
      // Reset form
      setPartName('');
      setPartNumber('');
      setCompatibleModelsText('');
      setRemarks('');
      setActiveTab('list');
    }, 1000);
  };

  const exportCsv = () => {
    const headers = ['Part Name', 'Part Number', 'Category', 'Company', 'Compatible Models', 'Stock', 'Reorder Level', 'Unit Cost (PKR)', 'Location', 'Condition'];
    const rows = filteredParts.map((p) => [
      `"${p.partName}"`,
      `"${p.partNumber}"`,
      `"${p.category}"`,
      `"${p.company}"`,
      `"${(p.compatibleModels || []).join('; ')}"`,
      p.quantityInStock,
      p.reorderLevel,
      p.unitCostPkr || 0,
      `"${p.storeLocation || ''}"`,
      `"${p.condition}"`,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Printer_Spare_Parts_Inventory_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4">
      <div className="flex h-full max-h-[90vh] w-full max-w-5xl flex-col rounded-2xl bg-white shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-600 text-white shadow-md shadow-amber-500/20">
              <Wrench className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 dark:text-white">Printer Spare Parts Inventory & Catalog</h2>
                <span className="rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-bold text-amber-600 dark:text-amber-400">
                  {printerParts.length} Parts Registered
                </span>
                {lowStockCount > 0 && (
                  <span className="rounded-full bg-rose-500/10 px-2.5 py-0.5 text-xs font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    {lowStockCount} Low Stock
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Manage spare parts (fusers, pickup rollers, separation pads, formatters, teflon sleeves) for printer repairs.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={exportCsv}
              className="hidden sm:flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 transition"
              title="Export Spare Parts CSV"
            >
              <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={onClose}
              className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Tab Toggle Navigation */}
        <div className="flex border-b border-slate-200 bg-white px-6 dark:border-slate-800 dark:bg-slate-900">
          <button
            onClick={() => setActiveTab('list')}
            className={`flex items-center gap-2 border-b-2 py-3 px-4 text-xs font-bold transition ${
              activeTab === 'list'
                ? 'border-amber-600 text-amber-600 dark:border-amber-400 dark:text-amber-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <Package className="h-4 w-4" />
            <span>Spare Parts List ({printerParts.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('add')}
            className={`flex items-center gap-2 border-b-2 py-3 px-4 text-xs font-bold transition ${
              activeTab === 'add'
                ? 'border-amber-600 text-amber-600 dark:border-amber-400 dark:text-amber-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <Plus className="h-4 w-4" />
            <span>Add New Spare Part</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'list' ? (
            <div className="space-y-4">
              {/* Search & Filter Bar */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search part name, part number, model, cabinet location..."
                    className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 py-2 text-xs font-medium text-slate-800 outline-none focus:border-amber-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
                  />
                </div>

                <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
                  <select
                    value={selectedCategoryFilter}
                    onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
                  >
                    <option value="ALL">All Categories ({printerParts.length})</option>
                    {PART_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Parts Table */}
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
                    <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-black uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-400">
                      <tr>
                        <th className="py-3 px-4">Part Details</th>
                        <th className="py-3 px-4">Part Number / SKU</th>
                        <th className="py-3 px-4">Category</th>
                        <th className="py-3 px-4">Compatible Printers</th>
                        <th className="py-3 px-4 text-center">Stock Level</th>
                        <th className="py-3 px-4">Unit Cost</th>
                        <th className="py-3 px-4">Location</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                      {filteredParts.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="py-10 text-center text-xs text-slate-400">
                            No printer spare parts found matching the criteria.
                          </td>
                        </tr>
                      ) : (
                        filteredParts.map((part) => {
                          const isLow = part.quantityInStock <= part.reorderLevel;
                          return (
                            <tr key={part.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition">
                              <td className="py-3 px-4">
                                <div className="font-bold text-slate-900 dark:text-white">{part.partName}</div>
                                <div className="text-[10px] text-slate-400 font-medium">
                                  {part.company} • <span className="text-amber-600 dark:text-amber-400 font-semibold">{part.condition}</span>
                                </div>
                              </td>
                              <td className="py-3 px-4 font-mono font-bold text-slate-700 dark:text-slate-300">
                                {part.partNumber}
                              </td>
                              <td className="py-3 px-4">
                                <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                  {part.category}
                                </span>
                              </td>
                              <td className="py-3 px-4 max-w-xs">
                                <div className="flex flex-wrap gap-1">
                                  {(part.compatibleModels || []).map((m, idx) => (
                                    <span
                                      key={idx}
                                      className="rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
                                    >
                                      {m}
                                    </span>
                                  ))}
                                </div>
                              </td>
                              <td className="py-3 px-4 text-center">
                                <div className="flex items-center justify-center gap-1.5">
                                  <button
                                    onClick={() => updatePrinterPartStock(part.id, part.quantityInStock - 1)}
                                    className="h-6 w-6 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-black"
                                    title="Decrease stock by 1"
                                  >
                                    -
                                  </button>
                                  <span
                                    className={`px-2 py-0.5 rounded-full text-xs font-black ${
                                      isLow
                                        ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 animate-pulse'
                                        : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                    }`}
                                  >
                                    {part.quantityInStock} pcs
                                  </span>
                                  <button
                                    onClick={() => updatePrinterPartStock(part.id, part.quantityInStock + 1)}
                                    className="h-6 w-6 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-black"
                                    title="Increase stock by 1"
                                  >
                                    +
                                  </button>
                                </div>
                                {isLow && (
                                  <div className="text-[10px] text-rose-500 font-bold mt-0.5">
                                    Reorder &le; {part.reorderLevel}
                                  </div>
                                )}
                              </td>
                              <td className="py-3 px-4 font-mono font-bold text-slate-800 dark:text-slate-200">
                                PKR {part.unitCostPkr?.toLocaleString() || 0}
                              </td>
                              <td className="py-3 px-4 text-slate-500 dark:text-slate-400 text-[11px]">
                                {part.storeLocation || 'Main IT Store'}
                              </td>
                              <td className="py-3 px-4 text-right">
                                <button
                                  onClick={() => {
                                    if (confirm(`Delete part "${part.partName}"?`)) {
                                      deletePrinterPart(part.id);
                                    }
                                  }}
                                  className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40 transition"
                                  title="Delete part"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            /* Add New Part Form */
            <form onSubmit={handleAddPart} className="max-w-3xl mx-auto space-y-5">
              {formSuccess && (
                <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs font-bold text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span>Spare part successfully registered into PAA IT inventory!</span>
                </div>
              )}

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-4">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 pb-2 dark:border-slate-800">
                  <Wrench className="h-4 w-4 text-amber-600" />
                  <span>Part Identification & Specifications</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Part Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Fuser Assembly Unit (220V)"
                      value={partName}
                      onChange={(e) => setPartName(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-800 outline-none focus:border-amber-500 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-200"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Part Number / SKU / OEM Code *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. RM1-7727-000CN or RL1-2593-000"
                      value={partNumber}
                      onChange={(e) => setPartNumber(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-mono font-bold text-slate-800 outline-none focus:border-amber-500 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-200"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Component Category</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value as any)}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:border-amber-500 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-200"
                    >
                      {PART_CATEGORIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Company / Brand</label>
                    <select
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:border-amber-500 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-200"
                    >
                      {printerCompanies.map((comp) => (
                        <option key={comp} value={comp}>
                          {comp}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Compatible Printer Models (Comma Separated)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. HP LaserJet P1102, HP LaserJet P1102w, Canon LBP2900B"
                    value={compatibleModelsText}
                    onChange={(e) => setCompatibleModelsText(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-800 outline-none focus:border-amber-500 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-200"
                  />
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    <span className="text-[10px] text-slate-400 font-medium">Quick Suggestions:</span>
                    {['HP 1102', 'HP 102', 'HP 402', 'HP 1320', 'HP 2300', 'Canon 2900', 'Brother 2321', 'Epson L3250'].map((s) => (
                      <button
                        type="button"
                        key={s}
                        onClick={() => {
                          const current = compatibleModelsText ? compatibleModelsText.split(',').map((x) => x.trim()) : [];
                          if (!current.includes(s)) {
                            setCompatibleModelsText([...current, s].join(', '));
                          }
                        }}
                        className="text-[10px] rounded bg-slate-100 hover:bg-slate-200 px-1.5 py-0.5 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                      >
                        +{s}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Stock & Storage Section */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-4">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 pb-2 dark:border-slate-800">
                  <Package className="h-4 w-4 text-emerald-600" />
                  <span>Inventory Stock & Storage Location</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Initial Quantity in Stock *</label>
                    <input
                      type="number"
                      min="0"
                      required
                      value={quantityInStock}
                      onChange={(e) => setQuantityInStock(parseInt(e.target.value) || 0)}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:border-amber-500 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-200"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Reorder Alert Threshold</label>
                    <input
                      type="number"
                      min="1"
                      value={reorderLevel}
                      onChange={(e) => setReorderLevel(parseInt(e.target.value) || 1)}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:border-amber-500 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-200"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Unit Cost (PKR)</label>
                    <input
                      type="number"
                      min="0"
                      value={unitCostPkr}
                      onChange={(e) => setUnitCostPkr(parseInt(e.target.value) || 0)}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-mono font-bold text-slate-800 outline-none focus:border-amber-500 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-200"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Store / Shelf Location</label>
                    <input
                      type="text"
                      placeholder="e.g. Shelf 4, Parts Bin #12"
                      value={storeLocation}
                      onChange={(e) => setStoreLocation(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-800 outline-none focus:border-amber-500 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-200"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Condition</label>
                    <select
                      value={condition}
                      onChange={(e) => setCondition(e.target.value as any)}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:border-amber-500 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-200"
                    >
                      <option value="Brand New">Brand New</option>
                      <option value="Refurbished">Refurbished</option>
                      <option value="Tested Good">Tested Good</option>
                    </select>
                  </div>

                  <div className="sm:col-span-3">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Remarks / Technical Notes</label>
                    <input
                      type="text"
                      placeholder="e.g. Includes heating element, teflon film sleeve, and silicon grease."
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-800 outline-none focus:border-amber-500 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-200"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('list')}
                  className="rounded-xl border border-slate-200 px-5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-amber-600 px-6 py-2 text-xs font-bold text-white shadow-md shadow-amber-500/20 hover:bg-amber-500 transition"
                >
                  Save Spare Part
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
