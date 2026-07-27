import React, { useState } from 'react';
import { useInventory } from '../context/InventoryContext';
import { X, Layers, Plus, CheckCircle2, AlertCircle } from 'lucide-react';

interface AddCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCategoryAdded?: (newCategory: string) => void;
}

export const AddCategoryModal: React.FC<AddCategoryModalProps> = ({
  isOpen,
  onClose,
  onCategoryAdded,
}) => {
  const { addCategory, allCategories } = useInventory();
  const [categoryName, setCategoryName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const suggestions = [
    'Keyboard',
    'Mouse',
    'Keyboard & Mouse',
    'Biometric Scanner',
    'Barcode Scanner',
    'Kiosk',
    'Flight Display Screen',
    'Projector',
    'Docking Station',
    'CCTV Camera',
  ].filter((s) => !allCategories.some((c) => c.toLowerCase() === s.toLowerCase()));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const trimmed = categoryName.trim();
    if (!trimmed) {
      setError('Category name cannot be empty.');
      return;
    }

    const added = addCategory(trimmed);
    if (!added) {
      setError(`Category "${trimmed}" already exists in the system directory.`);
      return;
    }

    setSuccessMsg(`Device Category "${trimmed}" successfully registered!`);
    if (onCategoryAdded) {
      onCategoryAdded(trimmed);
    }

    setTimeout(() => {
      setCategoryName('');
      setSuccessMsg(null);
      onClose();
    }, 1200);
  };

  const handleSelectSuggestion = (suggestion: string) => {
    setCategoryName(suggestion);
    setError(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-6 py-4 dark:border-slate-800 dark:bg-slate-800/40">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">Add Device Category</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Register or write a custom asset category</p>
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
              Category Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              autoFocus
              value={categoryName}
              onChange={(e) => {
                setCategoryName(e.target.value);
                if (error) setError(null);
              }}
              placeholder="e.g. Keyboard, Mouse, Keyboard & Mouse, Kiosk"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-medium text-slate-800 outline-none focus:border-amber-500 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            />
          </div>

          {suggestions.length > 0 && (
            <div>
              <span className="block text-[11px] font-bold text-slate-400 dark:text-slate-500 mb-1.5 uppercase tracking-wider">
                Quick Add Suggestions
              </span>
              <div className="flex flex-wrap gap-1.5">
                {suggestions.slice(0, 6).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => handleSelectSuggestion(s)}
                    className="rounded-lg border border-slate-200 bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600 hover:bg-amber-50 hover:text-amber-700 hover:border-amber-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-amber-950/40 dark:hover:text-amber-400 transition"
                  >
                    + {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-800/40 text-[11px] text-slate-500 dark:text-slate-400">
            Currently managing <strong className="text-slate-800 dark:text-slate-200">{allCategories.length}</strong> active device categories in system inventory.
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
              className="flex items-center gap-1.5 rounded-xl bg-amber-600 px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-amber-500 dark:bg-amber-500 dark:hover:bg-amber-400 transition"
            >
              <Plus className="h-4 w-4" />
              <span>Add Category</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
