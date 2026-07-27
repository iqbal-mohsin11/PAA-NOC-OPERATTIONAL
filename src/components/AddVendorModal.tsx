import React, { useState } from 'react';
import { useInventory } from '../context/InventoryContext';
import { X, Store, Plus, CheckCircle2, AlertCircle } from 'lucide-react';

interface AddVendorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVendorAdded?: (newVendor: string) => void;
}

export const AddVendorModal: React.FC<AddVendorModalProps> = ({
  isOpen,
  onClose,
  onVendorAdded,
}) => {
  const { addVendor, allVendors } = useInventory();
  const [vendorName, setVendorName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const suggestions = [
    'Siemens Pakistan Ltd.',
    'Global Telecom Systems',
    'National IT Services',
    'Supernet Broadband',
    'Multinet Pakistan',
    'Techlogix Pakistan',
    'Megaplus Pakistan',
  ].filter((s) => !allVendors.some((v) => v.toLowerCase() === s.toLowerCase()));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const trimmed = vendorName.trim();
    if (!trimmed) {
      setError('Vendor company name cannot be empty.');
      return;
    }

    const added = addVendor(trimmed);
    if (!added) {
      setError(`Vendor "${trimmed}" already exists in the directory.`);
      return;
    }

    setSuccessMsg(`Vendor "${trimmed}" successfully registered!`);
    if (onVendorAdded) {
      onVendorAdded(trimmed);
    }

    setTimeout(() => {
      setVendorName('');
      setSuccessMsg(null);
      onClose();
    }, 1200);
  };

  const handleSelectSuggestion = (suggestion: string) => {
    setVendorName(suggestion);
    setError(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-6 py-4 dark:border-slate-800 dark:bg-slate-800/40">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-600 dark:text-purple-400">
              <Store className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">Add New Vendor</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Register a contractor or supplier vendor</p>
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
              Vendor / Supplier Company Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              autoFocus
              value={vendorName}
              onChange={(e) => {
                setVendorName(e.target.value);
                if (error) setError(null);
              }}
              placeholder="e.g. Siemens Pakistan, M/S Airport Tech, Megaplus"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-medium text-slate-800 outline-none focus:border-purple-500 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            />
          </div>

          {suggestions.length > 0 && (
            <div>
              <span className="block text-[11px] font-bold text-slate-400 dark:text-slate-500 mb-1.5 uppercase tracking-wider">
                Popular Vendors
              </span>
              <div className="flex flex-wrap gap-1.5">
                {suggestions.slice(0, 5).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => handleSelectSuggestion(s)}
                    className="rounded-lg border border-slate-200 bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600 hover:bg-purple-50 hover:text-purple-700 hover:border-purple-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-purple-950/40 dark:hover:text-purple-400 transition"
                  >
                    + {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-800/40 text-[11px] text-slate-500 dark:text-slate-400">
            Currently managing <strong className="text-slate-800 dark:text-slate-200">{allVendors.length}</strong> supplier vendors in directory.
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
              className="flex items-center gap-1.5 rounded-xl bg-purple-600 px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-purple-500 dark:bg-purple-500 dark:hover:bg-purple-400 transition"
            >
              <Plus className="h-4 w-4" />
              <span>Add Vendor</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
