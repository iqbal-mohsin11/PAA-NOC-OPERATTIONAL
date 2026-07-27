import React, { useState } from 'react';
import { useInventory } from '../context/InventoryContext';
import { X, Building2, Plus, CheckCircle2, AlertCircle } from 'lucide-react';

interface AddDepartmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDepartmentAdded?: (newDept: string) => void;
}

export const AddDepartmentModal: React.FC<AddDepartmentModalProps> = ({
  isOpen,
  onClose,
  onDepartmentAdded,
}) => {
  const { addDepartment, allDepartments } = useInventory();
  const [deptName, setDeptName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const popularSuggestions = [
    'Cyber Security',
    'Avionics',
    'VIP Lounge',
    'Terminal Operations',
    'Ground Handling',
    'ATC Tower',
    'Baggage Claim',
    'Quality Assurance',
  ].filter((s) => !allDepartments.some((d) => d.toLowerCase() === s.toLowerCase()));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const trimmed = deptName.trim();
    if (!trimmed) {
      setError('Department name cannot be empty.');
      return;
    }

    const added = addDepartment(trimmed);
    if (!added) {
      setError(`Department "${trimmed}" already exists in the directory.`);
      return;
    }

    setSuccessMsg(`Department "${trimmed}" successfully added!`);
    if (onDepartmentAdded) {
      onDepartmentAdded(trimmed);
    }

    setTimeout(() => {
      setDeptName('');
      setSuccessMsg(null);
      onClose();
    }, 1200);
  };

  const handleSelectSuggestion = (suggestion: string) => {
    setDeptName(suggestion);
    setError(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-6 py-4 dark:border-slate-800 dark:bg-slate-800/40">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">Add New Department</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Create a new organizational department</p>
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
              Department Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              autoFocus
              value={deptName}
              onChange={(e) => {
                setDeptName(e.target.value);
                if (error) setError(null);
              }}
              placeholder="e.g. Cyber Security, Logistics, VIP Lounge"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-medium text-slate-800 outline-none focus:border-emerald-500 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            />
          </div>

          {popularSuggestions.length > 0 && (
            <div>
              <span className="block text-[11px] font-bold text-slate-400 dark:text-slate-500 mb-1.5 uppercase tracking-wider">
                Quick Suggestions
              </span>
              <div className="flex flex-wrap gap-1.5">
                {popularSuggestions.slice(0, 5).map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => handleSelectSuggestion(suggestion)}
                    className="rounded-lg border border-slate-200 bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-emerald-950/40 dark:hover:text-emerald-400 transition"
                  >
                    + {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Current count info */}
          <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-800/40 text-[11px] text-slate-500 dark:text-slate-400">
            Currently managing <strong className="text-slate-800 dark:text-slate-200">{allDepartments.length}</strong> active departments across the organization.
          </div>

          {/* Actions */}
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
              className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-emerald-500 dark:bg-emerald-500 dark:hover:bg-emerald-400 transition"
            >
              <Plus className="h-4 w-4" />
              <span>Add Department</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
