import React, { useState } from 'react';
import { useInventory } from '../context/InventoryContext';
import { PrinterModelDefinition } from '../types/inventory';
import {
  X,
  Printer,
  Plus,
  Search,
  Building2,
  Trash2,
  CheckCircle2,
  Layers,
  FileSpreadsheet,
} from 'lucide-react';

interface PrinterModelsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PrinterModelsModal: React.FC<PrinterModelsModalProps> = ({ isOpen, onClose }) => {
  const { printerModels, addPrinterModel, deletePrinterModel, printerCompanies, addPrinterCompany, deletePrinterCompany } =
    useInventory();

  const [activeTab, setActiveTab] = useState<'models' | 'companies' | 'addModel'>('models');
  const [search, setSearch] = useState('');
  const [selectedCompanyFilter, setSelectedCompanyFilter] = useState('ALL');

  // Form State for New Model
  const [company, setCompany] = useState(printerCompanies[0] || 'HP (Hewlett-Packard)');
  const [modelName, setModelName] = useState('');
  const [category, setCategory] = useState<PrinterModelDefinition['category']>('Laser');
  const [colorType, setColorType] = useState<PrinterModelDefinition['colorType']>('Mono');
  const [compatibleTonerModel, setCompatibleTonerModel] = useState('');
  const [ppmSpeed, setPpmSpeed] = useState<number>(20);
  const [connectionType, setConnectionType] = useState<PrinterModelDefinition['connectionType']>('Network');
  const [duplex, setDuplex] = useState(true);
  const [remarks, setRemarks] = useState('');
  const [formSuccess, setFormSuccess] = useState(false);

  // New Company Input
  const [newCompanyName, setNewCompanyName] = useState('');
  const [companySuccess, setCompanySuccess] = useState('');

  if (!isOpen) return null;

  const filteredModels = printerModels.filter((m) => {
    if (selectedCompanyFilter !== 'ALL' && m.company !== selectedCompanyFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        m.modelName.toLowerCase().includes(q) ||
        m.company.toLowerCase().includes(q) ||
        m.compatibleTonerModel?.toLowerCase().includes(q) ||
        m.category.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleAddModel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!modelName.trim() || !company) return;

    addPrinterModel({
      company,
      modelName: modelName.trim(),
      category,
      colorType,
      compatibleTonerModel: compatibleTonerModel.trim() || undefined,
      ppmSpeed: Number(ppmSpeed) || undefined,
      connectionType,
      duplex,
      remarks: remarks.trim() || undefined,
    });

    setFormSuccess(true);
    setTimeout(() => {
      setFormSuccess(false);
      setModelName('');
      setCompatibleTonerModel('');
      setRemarks('');
      setActiveTab('models');
    }, 1000);
  };

  const handleAddCompany = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCompanyName.trim()) return;
    const ok = addPrinterCompany(newCompanyName.trim());
    if (ok) {
      setCompanySuccess(`Manufacturer "${newCompanyName.trim()}" added!`);
      setNewCompanyName('');
      setTimeout(() => setCompanySuccess(''), 2500);
    }
  };

  const exportCsv = () => {
    const headers = ['Manufacturer', 'Model Name', 'Category', 'Color Type', 'Print Speed (PPM)', 'Connection', 'Duplex', 'Toner Model', 'Remarks'];
    const rows = filteredModels.map((m) => [
      `"${m.company}"`,
      `"${m.modelName}"`,
      `"${m.category}"`,
      `"${m.colorType}"`,
      m.ppmSpeed || 'N/A',
      `"${m.connectionType || ''}"`,
      m.duplex ? 'Yes' : 'No',
      `"${m.compatibleTonerModel || ''}"`,
      `"${m.remarks || ''}"`,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Printer_Models_Catalog_${new Date().toISOString().slice(0, 10)}.csv`);
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
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-md shadow-emerald-500/20">
              <Printer className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 dark:text-white">Printer Models & Companies Hub</h2>
                <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  {printerModels.length} Models • {printerCompanies.length} Companies
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Register approved printer/scanner hardware models, manufacturers, toner compatibility, and specs.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={exportCsv}
              className="hidden sm:flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 transition"
              title="Export Models CSV"
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
            onClick={() => setActiveTab('models')}
            className={`flex items-center gap-2 border-b-2 py-3 px-4 text-xs font-bold transition ${
              activeTab === 'models'
                ? 'border-emerald-600 text-emerald-600 dark:border-emerald-400 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <Printer className="h-4 w-4" />
            <span>Hardware Models Directory ({printerModels.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('companies')}
            className={`flex items-center gap-2 border-b-2 py-3 px-4 text-xs font-bold transition ${
              activeTab === 'companies'
                ? 'border-emerald-600 text-emerald-600 dark:border-emerald-400 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <Building2 className="h-4 w-4" />
            <span>Companies / Brands ({printerCompanies.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('addModel')}
            className={`flex items-center gap-2 border-b-2 py-3 px-4 text-xs font-bold transition ${
              activeTab === 'addModel'
                ? 'border-emerald-600 text-emerald-600 dark:border-emerald-400 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <Plus className="h-4 w-4" />
            <span>Add New Model</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'models' ? (
            <div className="space-y-4">
              {/* Search & Filter Bar */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search model name, company, toner compatibility..."
                    className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 py-2 text-xs font-medium text-slate-800 outline-none focus:border-emerald-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
                  />
                </div>

                <select
                  value={selectedCompanyFilter}
                  onChange={(e) => setSelectedCompanyFilter(e.target.value)}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
                >
                  <option value="ALL">All Companies ({printerModels.length})</option>
                  {printerCompanies.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              {/* Models Table */}
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
                    <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-black uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-400">
                      <tr>
                        <th className="py-3 px-4">Manufacturer & Model</th>
                        <th className="py-3 px-4">Category</th>
                        <th className="py-3 px-4">Color & Speed</th>
                        <th className="py-3 px-4">Connection & Duplex</th>
                        <th className="py-3 px-4">Default Toner Model</th>
                        <th className="py-3 px-4">Remarks</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                      {filteredModels.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-10 text-center text-xs text-slate-400">
                            No printer models found matching criteria.
                          </td>
                        </tr>
                      ) : (
                        filteredModels.map((m) => (
                          <tr key={m.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition">
                            <td className="py-3 px-4">
                              <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                                <Printer className="h-3.5 w-3.5 text-emerald-600" />
                                <span>{m.modelName}</span>
                              </div>
                              <div className="text-[10px] text-slate-400 font-semibold">{m.company}</div>
                            </td>
                            <td className="py-3 px-4">
                              <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
                                {m.category}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <div className="font-bold text-slate-800 dark:text-slate-200">{m.colorType}</div>
                              <div className="text-[10px] text-slate-400">{m.ppmSpeed ? `${m.ppmSpeed} ppm` : 'Standard'}</div>
                            </td>
                            <td className="py-3 px-4">
                              <div className="font-bold text-slate-800 dark:text-slate-200">{m.connectionType || 'Both'}</div>
                              <div className="text-[10px] text-slate-400">{m.duplex ? 'Auto Duplex' : 'Manual'}</div>
                            </td>
                            <td className="py-3 px-4 font-mono font-bold text-teal-600 dark:text-teal-400">
                              {m.compatibleTonerModel || 'N/A'}
                            </td>
                            <td className="py-3 px-4 max-w-xs text-slate-500 dark:text-slate-400 text-[11px] truncate">
                              {m.remarks || 'Standard'}
                            </td>
                            <td className="py-3 px-4 text-right">
                              <button
                                onClick={() => {
                                  if (confirm(`Delete printer model "${m.modelName}"?`)) {
                                    deletePrinterModel(m.id);
                                  }
                                }}
                                className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40 transition"
                                title="Delete model"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : activeTab === 'companies' ? (
            /* Companies Management Tab */
            <div className="space-y-6 max-w-3xl mx-auto">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-4">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 pb-2 dark:border-slate-800">
                  <Building2 className="h-4 w-4 text-emerald-600" />
                  <span>Register New Printer / Scanner Manufacturer</span>
                </h3>

                {companySuccess && (
                  <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 p-2.5 text-xs font-bold text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    <span>{companySuccess}</span>
                  </div>
                )}

                <form onSubmit={handleAddCompany} className="flex gap-2">
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ricoh, Kyocera, Lexmark, Sharp, Konica Minolta..."
                    value={newCompanyName}
                    onChange={(e) => setNewCompanyName(e.target.value)}
                    className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:border-emerald-500 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-200"
                  />
                  <button
                    type="submit"
                    className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-emerald-500/20 hover:bg-emerald-500 transition shrink-0"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Add Manufacturer</span>
                  </button>
                </form>
              </div>

              {/* Companies Grid */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-3">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center justify-between border-b border-slate-100 pb-2 dark:border-slate-800">
                  <span>Registered Hardware Manufacturers ({printerCompanies.length})</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                  {printerCompanies.map((c) => {
                    const count = printerModels.filter((m) => m.company === c).length;
                    return (
                      <div
                        key={c}
                        className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-800/60"
                      >
                        <div>
                          <div className="text-xs font-bold text-slate-900 dark:text-white">{c}</div>
                          <div className="text-[10px] text-slate-400 font-semibold">{count} Models in Fleet</div>
                        </div>

                        <button
                          onClick={() => {
                            if (confirm(`Remove company "${c}"?`)) {
                              deletePrinterCompany(c);
                            }
                          }}
                          className="rounded-lg p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40 transition"
                          title="Remove manufacturer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            /* Add New Printer Model Tab */
            <form onSubmit={handleAddModel} className="max-w-3xl mx-auto space-y-5">
              {formSuccess && (
                <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs font-bold text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span>Hardware model successfully registered into PAA IT database!</span>
                </div>
              )}

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-4">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 pb-2 dark:border-slate-800">
                  <Printer className="h-4 w-4 text-emerald-600" />
                  <span>Model Information & Hardware Specifications</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Company / Manufacturer *</label>
                    <select
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:border-emerald-500 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-200"
                    >
                      {printerCompanies.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Model Name & Number *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. LaserJet Pro M404dn or LBP2900B"
                      value={modelName}
                      onChange={(e) => setModelName(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:border-emerald-500 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-200"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Hardware Category</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value as any)}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:border-emerald-500 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-200"
                    >
                      <option value="Laser">Laser</option>
                      <option value="Inkjet">Inkjet</option>
                      <option value="Scanner">Scanner</option>
                      <option value="MFP">Multifunction MFP</option>
                      <option value="Thermal">Thermal</option>
                      <option value="Dot Matrix">Dot Matrix</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Color Capability</label>
                    <select
                      value={colorType}
                      onChange={(e) => setColorType(e.target.value as any)}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:border-emerald-500 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-200"
                    >
                      <option value="Mono">Monochrome (Black & White)</option>
                      <option value="Color">Color</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Default Compatible Toner Model</label>
                    <input
                      type="text"
                      placeholder="e.g. HP 59A (CF259A)"
                      value={compatibleTonerModel}
                      onChange={(e) => setCompatibleTonerModel(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-mono font-bold text-slate-800 outline-none focus:border-emerald-500 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-200"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Print / Scan Speed (PPM)</label>
                    <input
                      type="number"
                      min="5"
                      value={ppmSpeed}
                      onChange={(e) => setPpmSpeed(parseInt(e.target.value) || 20)}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:border-emerald-500 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-200"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Connectivity</label>
                    <select
                      value={connectionType}
                      onChange={(e) => setConnectionType(e.target.value as any)}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:border-emerald-500 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-200"
                    >
                      <option value="Network">Network Ethernet (RJ45)</option>
                      <option value="USB">USB Direct</option>
                      <option value="Both">Both (Network + USB)</option>
                      <option value="Wireless">Wireless / Wi-Fi</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-2 pt-6">
                    <input
                      type="checkbox"
                      id="duplexCheck"
                      checked={duplex}
                      onChange={(e) => setDuplex(e.target.checked)}
                      className="h-4 w-4 rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <label htmlFor="duplexCheck" className="text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                      Supports Automatic Two-Sided Duplexing
                    </label>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Deployment Remarks / Technical Notes</label>
                    <input
                      type="text"
                      placeholder="e.g. Standard network printer for passenger terminal flight clearance desks."
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-800 outline-none focus:border-emerald-500 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-200"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('models')}
                  className="rounded-xl border border-slate-200 px-5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-emerald-600 px-6 py-2 text-xs font-bold text-white shadow-md shadow-emerald-500/20 hover:bg-emerald-500 transition"
                >
                  Save Model Definition
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
