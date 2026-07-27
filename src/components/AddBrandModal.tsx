import React, { useState } from 'react';
import { useInventory } from '../context/InventoryContext';
import { X, Tag, Plus, CheckCircle2, AlertCircle } from 'lucide-react';

interface AddBrandModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBrandAdded?: (newBrand: string) => void;
}

export const AddBrandModal: React.FC<AddBrandModalProps> = ({
  isOpen,
  onClose,
  onBrandAdded,
}) => {
  const { addBrand, allBrands } = useInventory();
  const [brandName, setBrandName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const suggestions = [
    'Apple',
    'Asus',
    'Acer',
    'Brother',
    'Lexmark',
    'Palo Alto Networks',
    'Arista Networks',
    'Avaya',
    'Extreme Networks',
    'Honeywell',
  ].filter((s) => !allBrands.some((b) => b.toLowerCase() === s.toLowerCase()));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const trimmed = brandName.trim();
    if (!trimmed) {
      setError('Brand name cannot be empty.');
      return;
    }

    const added = addBrand(trimmed);
    if (!added) {
      setError(`Brand "${trimmed}" already exists in the directory.`);
      return;
    }

    setSuccessMsg(`Brand "${trimmed}" successfully registered!`);
    if (onBrandAdded) {
      onBrandAdded(trimmed);
    }

    setTimeout(() => {
      setBrandName('');
      setSuccessMsg(null);
      onClose();
    }, 1200);
  };

  const handleSelectSuggestion = (suggestion: string) => {
    setBrandName(suggestion);
    setError(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-6 py-4 dark:border-slate-800 dark:bg-slate-800/40">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400">
              <Tag className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">Add New Brand</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Register a hardware / equipment brand</p>
            </div>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="flex items-center gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-xs font-medium text-rose-600 dark:text-rose-400">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-xs font-medium text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Brand / Manufacturer Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              autoFocus
              value={brandName}
              onChange={(e) => {
                setBrandName(e.target.value);
                if (error) setError(null);
              }}
              placeholder="e.g. Cisco, Apple, Palo Alto, Brother"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-medium text-slate-800 outline-none focus:border-blue-500 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            />
          </div>

          {suggestions.length > 0 && (
            <div>
              <span className="block text-[11px] font-bold text-slate-400 dark:text-slate-500 mb-1.5 uppercase tracking-wider">
                Popular Brands
              </span>
              <div className="flex flex-wrap gap-1.5">
                {suggestions.slice(0, 5).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => handleSelectSuggestion(s)}
                    className="rounded-lg border border-slate-200 bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-blue-950/40 dark:hover:text-blue-400 transition"
                  >
                    + {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-800/40 text-[11px] text-slate-500 dark:text-slate-400">
            Currently managing <strong className="text-slate-800 dark:text-slate-200">{allBrands.length}</strong> hardware brands across the inventory.
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-blue-500 dark:bg-blue-500 dark:hover:bg-blue-400 transition"
            >
              <Plus className="h-4 w-4" />
              <span>Add Brand</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
