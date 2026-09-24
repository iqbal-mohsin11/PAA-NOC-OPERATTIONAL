import React, { useState } from 'react';
import { useInventory } from '../context/InventoryContext';
import { TonerModelDefinition } from '../types/inventory';
import {
  X,
  Droplet,
  Plus,
  Search,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  Package,
  Layers,
  FileSpreadsheet,
} from 'lucide-react';

interface TonerModelsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TonerModelsModal: React.FC<TonerModelsModalProps> = ({ isOpen, onClose }) => {
  const { tonerModels, addTonerModel, updateTonerModelStock, deleteTonerModel, printerCompanies } = useInventory();

  const [activeTab, setActiveTab] = useState<'list' | 'add'>('list');
  const [search, setSearch] = useState('');
  const [companyFilter, setCompanyFilter] = useState('ALL');

  // Form State
  const [modelCode, setModelCode] = useState('');
  const [company, setCompany] = useState(printerCompanies[0] || 'HP (Hewlett-Packard)');
  const [compatiblePrintersText, setCompatiblePrintersText] = useState('');
  const [tonerType, setTonerType] = useState<TonerModelDefinition['tonerType']>('Monochrome Black');
  const [pageYield, setPageYield] = useState<number>(2000);
  const [currentStock, setCurrentStock] = useState<number>(10);
  const [reorderLevel, setReorderLevel] = useState<number>(3);
  const [unitCostPkr, setUnitCostPkr] = useState<number>(3500);
  const [shelfLocation, setShelfLocation] = useState('Rack B-1, IT Central Store');
  const [remarks, setRemarks] = useState('');
  const [formSuccess, setFormSuccess] = useState(false);

  if (!isOpen) return null;

  const filteredToners = tonerModels.filter((toner) => {
    if (companyFilter !== 'ALL' && toner.company !== companyFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchCompat = toner.compatiblePrinters?.some((p) => p.toLowerCase().includes(q));
      return (
        toner.modelCode.toLowerCase().includes(q) ||
        toner.company.toLowerCase().includes(q) ||
        toner.shelfLocation?.toLowerCase().includes(q) ||
        matchCompat
      );
    }
    return true;
  });

  const lowStockCount = tonerModels.filter((t) => t.currentStock <= t.reorderLevel).length;

  const handleAddToner = (e: React.FormEvent) => {
    e.preventDefault();
    if (!modelCode.trim()) return;

    const compatList = compatiblePrintersText
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    addTonerModel({
      modelCode: modelCode.trim(),
      company,
      compatiblePrinters: compatList.length > 0 ? compatList : ['Universal Model'],
      tonerType,
      pageYield: Number(pageYield) || 1500,
      currentStock: Number(currentStock) || 0,
      reorderLevel: Number(reorderLevel) || 1,
      unitCostPkr: Number(unitCostPkr) || 0,
      shelfLocation: shelfLocation.trim(),
      remarks: remarks.trim(),
    });

    setFormSuccess(true);
    setTimeout(() => {
      setFormSuccess(false);
      setModelCode('');
      setCompatiblePrintersText('');
      setRemarks('');
      setActiveTab('list');
    }, 1000);
  };

  const exportCsv = () => {
    const headers = ['Toner Model Code', 'Company', 'Toner Type', 'Page Yield', 'Compatible Printers', 'Current Stock', 'Reorder Level', 'Unit Cost (PKR)', 'Shelf Location'];
    const rows = filteredToners.map((t) => [
      `"${t.modelCode}"`,
      `"${t.company}"`,
      `"${t.tonerType}"`,
      t.pageYield || 0,
      `"${(t.compatiblePrinters || []).join('; ')}"`,
      t.currentStock,
      t.reorderLevel,
      t.unitCostPkr || 0,
      `"${t.shelfLocation || ''}"`,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Toner_Models_Registry_${new Date().toISOString().slice(0, 10)}.csv`);
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
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-600 text-white shadow-md shadow-teal-500/20">
              <Droplet className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 dark:text-white">Toner Models & Consumables Registry</h2>
                <span className="rounded-full bg-teal-500/10 px-2.5 py-0.5 text-xs font-bold text-teal-600 dark:text-teal-400">
                  {tonerModels.length} Models Registered
                </span>
                {lowStockCount > 0 && (
                  <span className="rounded-full bg-rose-500/10 px-2.5 py-0.5 text-xs font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    {lowStockCount} Need Reorder
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Register new toner cartridge models, page yields, compatibility mappings, and track live store stock.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={exportCsv}
              className="hidden sm:flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 transition"
              title="Export Toners CSV"
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
                ? 'border-teal-600 text-teal-600 dark:border-teal-400 dark:text-teal-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <Package className="h-4 w-4" />
            <span>Toner Models Directory ({tonerModels.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('add')}
            className={`flex items-center gap-2 border-b-2 py-3 px-4 text-xs font-bold transition ${
              activeTab === 'add'
                ? 'border-teal-600 text-teal-600 dark:border-teal-400 dark:text-teal-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <Plus className="h-4 w-4" />
            <span>Add New Toner Model</span>
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
                    placeholder="Search toner code (85A, 12A, 59A), company, compatible printer..."
                    className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 py-2 text-xs font-medium text-slate-800 outline-none focus:border-teal-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
                  />
                </div>

                <select
                  value={companyFilter}
                  onChange={(e) => setCompanyFilter(e.target.value)}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
                >
                  <option value="ALL">All Manufacturers ({tonerModels.length})</option>
                  {printerCompanies.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              {/* Toners Table */}
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
                    <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-black uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-400">
                      <tr>
                        <th className="py-3 px-4">Toner Model & Code</th>
                        <th className="py-3 px-4">Manufacturer</th>
                        <th className="py-3 px-4">Type & Page Yield</th>
                        <th className="py-3 px-4">Compatible Fleet Printers</th>
                        <th className="py-3 px-4 text-center">Store Stock</th>
                        <th className="py-3 px-4">Unit Cost</th>
                        <th className="py-3 px-4">Shelf Location</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                      {filteredToners.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="py-10 text-center text-xs text-slate-400">
                            No toner models found matching criteria.
                          </td>
                        </tr>
                      ) : (
                        filteredToners.map((toner) => {
                          const isLow = toner.currentStock <= toner.reorderLevel;
                          return (
                            <tr key={toner.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition">
                              <td className="py-3 px-4">
                                <div className="font-mono font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                                  <Droplet className="h-3.5 w-3.5 text-teal-600" />
                                  <span>{toner.modelCode}</span>
                                </div>
                                {toner.remarks && (
                                  <div className="text-[10px] text-slate-400 mt-0.5 max-w-xs truncate">
                                    {toner.remarks}
                                  </div>
                                )}
                              </td>
                              <td className="py-3 px-4 font-medium text-slate-700 dark:text-slate-300">
                                {toner.company}
                              </td>
                              <td className="py-3 px-4">
                                <div className="font-bold text-slate-800 dark:text-slate-200">{toner.tonerType}</div>
                                <div className="text-[10px] text-slate-400 font-mono">
                                  {toner.pageYield ? `~${toner.pageYield.toLocaleString()} pages` : 'Standard'}
                                </div>
                              </td>
                              <td className="py-3 px-4 max-w-xs">
                                <div className="flex flex-wrap gap-1">
                                  {(toner.compatiblePrinters || []).map((p, idx) => (
                                    <span
                                      key={idx}
                                      className="rounded bg-teal-50 px-1.5 py-0.5 text-[10px] font-bold text-teal-800 dark:bg-teal-950/40 dark:text-teal-300"
                                    >
                                      {p}
                                    </span>
                                  ))}
                                </div>
                              </td>
                              <td className="py-3 px-4 text-center">
                                <div className="flex items-center justify-center gap-1.5">
                                  <button
                                    onClick={() => updateTonerModelStock(toner.id, toner.currentStock - 1)}
                                    className="h-6 w-6 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-black"
                                    title="Decrease stock by 1"
                                  >
                                    -
                                  </button>
                                  <span
                                    className={`px-2 py-0.5 rounded-full text-xs font-black ${
                                      isLow
                                        ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 animate-pulse'
                                        : 'bg-teal-500/10 text-teal-600 dark:text-teal-400'
                                    }`}
                                  >
                                    {toner.currentStock} units
                                  </span>
                                  <button
                                    onClick={() => updateTonerModelStock(toner.id, toner.currentStock + 1)}
                                    className="h-6 w-6 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-black"
                                    title="Increase stock by 1"
                                  >
                                    +
                                  </button>
                                </div>
                                {isLow && (
                                  <div className="text-[10px] text-rose-500 font-bold mt-0.5">
                                    Reorder &le; {toner.reorderLevel}
                                  </div>
                                )}
                              </td>
                              <td className="py-3 px-4 font-mono font-bold text-slate-800 dark:text-slate-200">
                                PKR {toner.unitCostPkr?.toLocaleString() || 0}
                              </td>
                              <td className="py-3 px-4 text-slate-500 dark:text-slate-400 text-[11px]">
                                {toner.shelfLocation || 'IT Store'}
                              </td>
                              <td className="py-3 px-4 text-right">
                                <button
                                  onClick={() => {
                                    if (confirm(`Delete toner model "${toner.modelCode}"?`)) {
                                      deleteTonerModel(toner.id);
                                    }
                                  }}
                                  className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40 transition"
                                  title="Delete toner model"
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
            /* Add New Toner Form */
            <form onSubmit={handleAddToner} className="max-w-3xl mx-auto space-y-5">
              {formSuccess && (
                <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs font-bold text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span>New toner model successfully registered in PAA IT database!</span>
                </div>
              )}

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-4">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 pb-2 dark:border-slate-800">
                  <Droplet className="h-4 w-4 text-teal-600" />
                  <span>Toner Specification & Identification</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Toner Model Code *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. HP 85A (CE285A) or Canon 328"
                      value={modelCode}
                      onChange={(e) => setModelCode(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-mono font-bold text-slate-800 outline-none focus:border-teal-500 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-200"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Manufacturer / Brand</label>
                    <select
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:border-teal-500 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-200"
                    >
                      {printerCompanies.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Toner Type / Color</label>
                    <select
                      value={tonerType}
                      onChange={(e) => setTonerType(e.target.value as any)}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:border-teal-500 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-200"
                    >
                      <option value="Monochrome Black">Monochrome Black</option>
                      <option value="Cyan">Cyan</option>
                      <option value="Magenta">Magenta</option>
                      <option value="Yellow">Yellow</option>
                      <option value="Refill Powder">Refill Powder Bottle</option>
                      <option value="Waste Toner Box">Waste Toner Box</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Rated Page Yield (Pages)</label>
                    <input
                      type="number"
                      min="100"
                      value={pageYield}
                      onChange={(e) => setPageYield(parseInt(e.target.value) || 1500)}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:border-teal-500 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-200"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Compatible Printers (Comma Separated)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. HP LaserJet P1102, HP LaserJet P1102w, HP LaserJet M1212nf"
                    value={compatiblePrintersText}
                    onChange={(e) => setCompatiblePrintersText(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-800 outline-none focus:border-teal-500 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-200"
                  />
                </div>
              </div>

              {/* Stock and Cost */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-4">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 pb-2 dark:border-slate-800">
                  <Package className="h-4 w-4 text-emerald-600" />
                  <span>Store Stock & Procurement Values</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Initial Stock (Units) *</label>
                    <input
                      type="number"
                      min="0"
                      required
                      value={currentStock}
                      onChange={(e) => setCurrentStock(parseInt(e.target.value) || 0)}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:border-teal-500 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-200"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Reorder Alert Threshold</label>
                    <input
                      type="number"
                      min="1"
                      value={reorderLevel}
                      onChange={(e) => setReorderLevel(parseInt(e.target.value) || 1)}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:border-teal-500 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-200"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Unit Cost (PKR)</label>
                    <input
                      type="number"
                      min="0"
                      value={unitCostPkr}
                      onChange={(e) => setUnitCostPkr(parseInt(e.target.value) || 0)}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-mono font-bold text-slate-800 outline-none focus:border-teal-500 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-200"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Shelf / Rack Location</label>
                    <input
                      type="text"
                      placeholder="e.g. Rack B-1, IT Central Store"
                      value={shelfLocation}
                      onChange={(e) => setShelfLocation(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-800 outline-none focus:border-teal-500 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-200"
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Remarks / Supplier Notes</label>
                    <input
                      type="text"
                      placeholder="e.g. Original chip required for firmware version 2026. OEM warranty sealed."
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-800 outline-none focus:border-teal-500 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-200"
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
                  className="rounded-xl bg-teal-600 px-6 py-2 text-xs font-bold text-white shadow-md shadow-teal-500/20 hover:bg-teal-500 transition"
                >
                  Save Toner Model
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
