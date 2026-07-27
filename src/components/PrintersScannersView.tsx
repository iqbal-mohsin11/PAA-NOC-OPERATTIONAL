import React, { useState } from 'react';
import { useInventory } from '../context/InventoryContext';
import { AssetItem } from '../types/inventory';
import { Printer, AlertTriangle, CheckCircle2, Wrench, Search, Plus, Filter, Droplet } from 'lucide-react';
import { TonerIssueModal } from './TonerIssueModal';

interface PrintersScannersViewProps {
  onSelectAsset: (asset: AssetItem) => void;
  onOpenIssueModal: (asset: AssetItem) => void;
  onOpenAddModal: () => void;
}

export const PrintersScannersView: React.FC<PrintersScannersViewProps> = ({
  onSelectAsset,
  onOpenIssueModal,
  onOpenAddModal,
}) => {
  const { assets } = useInventory();
  const [filterType, setFilterType] = useState<'ALL' | 'Printer' | 'Scanner'>('ALL');
  const [search, setSearch] = useState('');
  const [isTonerModalOpen, setIsTonerModalOpen] = useState(false);
  const [selectedTonerAsset, setSelectedTonerAsset] = useState<AssetItem | null>(null);

  const items = assets.filter(
    (a) => !a.isRemoved && (a.category === 'Printer' || a.category === 'Scanner')
  );

  const filtered = items.filter((item) => {
    if (filterType !== 'ALL' && item.category !== filterType) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        item.name.toLowerCase().includes(q) ||
        item.department.toLowerCase().includes(q) ||
        item.brand.toLowerCase().includes(q) ||
        item.model.toLowerCase().includes(q) ||
        item.id.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const lowTonerPrinters = items.filter(
    (p) => p.category === 'Printer' && p.printerSpecs?.tonerLevel !== undefined && p.printerSpecs.tonerLevel <= 25
  );

  const handleOpenTonerIssue = (asset?: AssetItem) => {
    setSelectedTonerAsset(asset || null);
    setIsTonerModalOpen(true);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Printer className="h-5 w-5 text-emerald-500" />
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Printers & Scanners Command Hub</h2>
            <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
              {items.length} Units Online
            </span>
          </div>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            Monitor toner levels, ADF scanners, laser/inkjet printers, and departmental toner issue records by date.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => handleOpenTonerIssue()}
            className="flex items-center gap-2 rounded-xl bg-teal-600 px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-teal-500 transition"
          >
            <Droplet className="h-4 w-4" />
            <span>Departmental Toner Issue & Dated Log</span>
          </button>

          <button
            onClick={onOpenAddModal}
            className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-emerald-500 transition"
          >
            <Plus className="h-4 w-4" />
            <span>Add Printer / Scanner</span>
          </button>
        </div>
      </div>

      {/* Low Toner Alert Bar */}
      {lowTonerPrinters.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
            <div>
              <span className="font-bold">Low Toner Alert ({lowTonerPrinters.length} Printers Require Replenishment):</span>
              <p className="mt-0.5 text-[11px] opacity-90">
                {lowTonerPrinters.map((p) => `${p.name} (${p.department}: ${p.printerSpecs?.tonerLevel}%)`).join(' • ')}
              </p>
            </div>
          </div>
          <button
            onClick={() => handleOpenTonerIssue(lowTonerPrinters[0])}
            className="flex items-center justify-center gap-1.5 rounded-xl bg-amber-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-amber-500 transition shrink-0"
          >
            <Droplet className="h-3.5 w-3.5" />
            <span>Issue Replenishment Toner</span>
          </button>
        </div>
      )}

      {/* Search & Filter Options */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search printers, toner model, department, brand..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 py-2 text-xs font-medium text-slate-800 outline-none focus:border-emerald-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
          />
        </div>

        <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white p-1 dark:border-slate-800 dark:bg-slate-900">
          {(['ALL', 'Printer', 'Scanner'] as const).map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                filterType === type
                  ? 'bg-emerald-600 text-white'
                  : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
              }`}
            >
              {type === 'ALL' ? 'All Hardware' : `${type}s`}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Printer / Scanner Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((item) => {
          const isP = item.category === 'Printer';
          const tonerLvl = item.printerSpecs?.tonerLevel ?? 100;
          const isLowToner = isP && tonerLvl <= 25;

          return (
            <div
              key={item.id}
              className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-black text-emerald-600 dark:text-emerald-400">{item.id}</span>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                    {item.category}
                  </span>
                </div>

                <h3
                  onClick={() => onSelectAsset(item)}
                  className="mt-2 text-sm font-bold text-slate-900 dark:text-white hover:text-emerald-600 cursor-pointer"
                >
                  {item.name}
                </h3>

                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                  Dept: <span className="text-emerald-600 dark:text-emerald-400 font-bold">{item.department}</span> • User: {item.assignedUser}
                </p>

                {/* Printer Specific Toner Bar */}
                {isP && item.printerSpecs && (
                  <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-800/50">
                    <div className="flex items-center justify-between text-xs font-bold mb-1">
                      <span className="text-slate-600 dark:text-slate-300">Toner Model: {item.printerSpecs.tonerModel || 'Standard'}</span>
                      <span className={isLowToner ? 'text-rose-500 font-black' : 'text-emerald-600 font-black'}>
                        {tonerLvl}%
                      </span>
                    </div>

                    <div className="h-2 w-full rounded-full bg-slate-200 dark:bg-slate-700">
                      <div
                        className={`h-2 rounded-full ${isLowToner ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500'}`}
                        style={{ width: `${tonerLvl}%` }}
                      ></div>
                    </div>

                    <div className="mt-2 flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400">
                      <span>Type: {item.printerSpecs.printerType} ({item.printerSpecs.colorType})</span>
                      <span>{item.printerSpecs.connectionType}</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleOpenTonerIssue(item)}
                      className="mt-2.5 w-full flex items-center justify-center gap-1.5 rounded-lg bg-teal-600/10 hover:bg-teal-600 hover:text-white px-2.5 py-1.5 text-xs font-bold text-teal-700 dark:text-teal-300 transition"
                    >
                      <Droplet className="h-3.5 w-3.5" />
                      <span>Issue Toner to {item.department}</span>
                    </button>
                  </div>
                )}

                {/* Scanner Specific Specs */}
                {!isP && item.scannerSpecs && (
                  <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50 p-3 text-xs dark:border-slate-800 dark:bg-slate-800/50">
                    <span className="font-bold text-slate-700 dark:text-slate-300">Scanner Type:</span> {item.scannerSpecs.scannerType} ADF Duplex
                  </div>
                )}
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 dark:border-slate-800 text-[11px] gap-2">
                <button
                  onClick={() => onOpenIssueModal(item)}
                  className="flex items-center gap-1 font-bold text-amber-600 hover:underline dark:text-amber-400"
                >
                  <Wrench className="h-3.5 w-3.5" />
                  <span>Report Ticket</span>
                </button>

                {isP && (
                  <button
                    onClick={() => handleOpenTonerIssue(item)}
                    className="flex items-center gap-1 font-bold text-teal-600 hover:underline dark:text-teal-400"
                  >
                    <Droplet className="h-3.5 w-3.5" />
                    <span>Issue Toner</span>
                  </button>
                )}

                <button
                  onClick={() => onSelectAsset(item)}
                  className="font-bold text-emerald-600 hover:underline dark:text-emerald-400 ml-auto"
                >
                  Details &rarr;
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Toner Issue Modal */}
      <TonerIssueModal
        isOpen={isTonerModalOpen}
        onClose={() => setIsTonerModalOpen(false)}
        preselectedAsset={selectedTonerAsset}
      />
    </div>
  );
};
