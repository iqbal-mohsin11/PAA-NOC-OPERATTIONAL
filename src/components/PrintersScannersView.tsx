import React, { useState } from 'react';
import { useInventory } from '../context/InventoryContext';
import { AssetItem } from '../types/inventory';
import { Printer, AlertTriangle, CheckCircle2, Wrench, Search, Plus, Filter, Droplet, RotateCw } from 'lucide-react';
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
  const [tonerMode, setTonerMode] = useState<'new' | 'refill'>('new');

  const [selectedModelFilter, setSelectedModelFilter] = useState<string>('ALL');

  const items = assets.filter(
    (a) => !a.isRemoved && (a.category === 'Printer' || a.category === 'Scanner')
  );

  const filtered = items.filter((item) => {
    if (filterType !== 'ALL' && item.category !== filterType) return false;
    if (selectedModelFilter !== 'ALL') {
      const target = selectedModelFilter.toLowerCase();
      const combined = `${item.name} ${item.brand} ${item.model} ${item.printerSpecs?.tonerModel || ''}`.toLowerCase();
      if (!combined.includes(target)) return false;
    }
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

  const handleOpenTonerIssue = (asset?: AssetItem, mode: 'new' | 'refill' = 'new') => {
    setSelectedTonerAsset(asset || null);
    setTonerMode(mode);
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
            onClick={() => handleOpenTonerIssue(undefined, 'refill')}
            className="flex items-center gap-2 rounded-xl bg-teal-600 px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-teal-500 transition"
          >
            <RotateCw className="h-4 w-4" />
            <span>Refill Toner Issue</span>
          </button>

          <button
            onClick={() => handleOpenTonerIssue(undefined, 'new')}
            className="flex items-center gap-2 rounded-xl border border-teal-600 bg-teal-50 px-4 py-2 text-xs font-bold text-teal-800 hover:bg-teal-100 dark:bg-slate-800 dark:text-teal-300 transition"
          >
            <Droplet className="h-4 w-4" />
            <span>Departmental Toner Register</span>
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
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleOpenTonerIssue(lowTonerPrinters[0], 'refill')}
              className="flex items-center justify-center gap-1.5 rounded-xl bg-teal-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-teal-500 transition shrink-0"
            >
              <RotateCw className="h-3.5 w-3.5" />
              <span>Refill Toner Issue</span>
            </button>
            <button
              onClick={() => handleOpenTonerIssue(lowTonerPrinters[0], 'new')}
              className="flex items-center justify-center gap-1.5 rounded-xl bg-amber-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-amber-500 transition shrink-0"
            >
              <Droplet className="h-3.5 w-3.5" />
              <span>Issue New Toner</span>
            </button>
          </div>
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

      {/* Quick Select Model & Scanner Preset Buttons Bar */}
      <div className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <Printer className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Quick Filter by Printer & Scanner Models:</span>
          </span>
          {selectedModelFilter !== 'ALL' && (
            <button
              onClick={() => setSelectedModelFilter('ALL')}
              className="text-[11px] font-bold text-rose-600 hover:underline dark:text-rose-400"
            >
              Reset Model Filter ({selectedModelFilter})
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setSelectedModelFilter('ALL')}
            className={`rounded-lg px-2.5 py-1 text-xs font-bold transition border ${
              selectedModelFilter === 'ALL'
                ? 'bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900 dark:border-white'
                : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
            }`}
          >
            All Models
          </button>

          {/* Printer Models */}
          {[
            { label: 'HP 1102W', filterKey: '1102' },
            { label: 'HP 102', filterKey: '102' },
            { label: 'HP 402', filterKey: '402' },
            { label: 'HP 1320', filterKey: '1320' },
            { label: 'HP M 600', filterKey: '600' },
            { label: 'HP M 602', filterKey: '602' },
            { label: 'HP 2300', filterKey: '2300' },
            { label: 'BROTHER', filterKey: 'brother' },
            { label: 'EPSON INK JET', filterKey: 'epson' },
          ].map((m) => {
            const isActive = selectedModelFilter === m.filterKey;
            return (
              <button
                key={m.label}
                onClick={() => {
                  setSelectedModelFilter(isActive ? 'ALL' : m.filterKey);
                  setFilterType('Printer');
                }}
                className={`rounded-lg px-2.5 py-1 text-xs font-bold transition border ${
                  isActive
                    ? 'bg-teal-600 text-white border-teal-600 shadow-xs'
                    : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60'
                }`}
              >
                🖨️ {m.label}
              </button>
            );
          })}

          {/* Scanner Models */}
          {[
            { label: 'Fujitsu fi-7160', filterKey: 'fujitsu' },
            { label: 'HP ScanJet Pro', filterKey: 'scanjet' },
            { label: 'Canon ImageFORMULA', filterKey: 'canon' },
            { label: 'Epson Scanner', filterKey: 'perfection' },
            { label: 'Avision ADF', filterKey: 'avision' },
          ].map((s) => {
            const isActive = selectedModelFilter === s.filterKey;
            return (
              <button
                key={s.label}
                onClick={() => {
                  setSelectedModelFilter(isActive ? 'ALL' : s.filterKey);
                  setFilterType('Scanner');
                }}
                className={`rounded-lg px-2.5 py-1 text-xs font-bold transition border ${
                  isActive
                    ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                    : 'bg-blue-50 text-blue-800 border-blue-200 hover:bg-blue-100 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800/60'
                }`}
              >
                📄 {s.label}
              </button>
            );
          })}
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

                    <div className="mt-2.5 grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => handleOpenTonerIssue(item, 'refill')}
                        className="flex items-center justify-center gap-1 rounded-lg bg-teal-600 hover:bg-teal-500 px-2 py-1.5 text-xs font-bold text-white transition shadow-xs"
                        title="Issue Refill Toner and reset gauge level to 100%"
                      >
                        <RotateCw className="h-3.5 w-3.5" />
                        <span>Refill Toner</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenTonerIssue(item, 'new')}
                        className="flex items-center justify-center gap-1 rounded-lg bg-teal-50 hover:bg-teal-100 border border-teal-200 px-2 py-1.5 text-xs font-bold text-teal-800 dark:bg-slate-800 dark:border-teal-900 dark:text-teal-300 transition"
                        title="Issue New Toner Cartridge"
                      >
                        <Droplet className="h-3.5 w-3.5 text-teal-600" />
                        <span>Issue New</span>
                      </button>
                    </div>
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
                    onClick={() => handleOpenTonerIssue(item, 'refill')}
                    className="flex items-center gap-1 font-bold text-teal-600 hover:underline dark:text-teal-400"
                  >
                    <RotateCw className="h-3.5 w-3.5" />
                    <span>Refill Toner</span>
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
        initialMode={tonerMode}
      />
    </div>
  );
};
