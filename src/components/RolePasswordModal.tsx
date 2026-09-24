import React, { useState } from 'react';
import { useInventory } from '../context/InventoryContext';
import { UserRole } from '../types/inventory';
import { X, Lock, KeyRound, ShieldAlert, Eye, EyeOff, CheckCircle2, AlertCircle, ShieldCheck, UserCheck, Wrench, Eye as ViewIcon } from 'lucide-react';

interface RolePasswordModalProps {
  isOpen: boolean;
  targetRole: UserRole | null;
  onClose: () => void;
  onSuccess?: (role: UserRole) => void;
}

export const RolePasswordModal: React.FC<RolePasswordModalProps> = ({
  isOpen,
  targetRole,
  onClose,
  onSuccess,
}) => {
  const { switchRoleWithPassword, rolePasswords } = useInventory();
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen || !targetRole) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const result = switchRoleWithPassword(targetRole, password);
    if (!result.success) {
      setError(result.message);
      return;
    }

    setSuccessMsg(`Authenticated as ${targetRole}! Access Granted.`);
    if (onSuccess) {
      onSuccess(targetRole);
    }

    setTimeout(() => {
      setPassword('');
      setSuccessMsg(null);
      setError(null);
      onClose();
    }, 800);
  };

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'Administrator':
        return {
          icon: ShieldCheck,
          color: 'bg-rose-500/10 text-rose-600 border-rose-500/20 dark:text-rose-400',
          btnBg: 'bg-rose-600 hover:bg-rose-500 dark:bg-rose-500 dark:hover:bg-rose-400',
          hint: 'Full System Control & Rights Management',
        };
      case 'Technician':
        return {
          icon: Wrench,
          color: 'bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-400',
          btnBg: 'bg-amber-600 hover:bg-amber-500 dark:bg-amber-500 dark:hover:bg-amber-400',
          hint: 'Operational Asset & Maintenance Management',
        };
      case 'Viewer':
        return {
          icon: ViewIcon,
          color: 'bg-blue-500/10 text-blue-600 border-blue-500/20 dark:text-blue-400',
          btnBg: 'bg-blue-600 hover:bg-blue-500 dark:bg-blue-500 dark:hover:bg-blue-400',
          hint: 'Read-Only Inventory & Audit Reports Access',
        };
    }
  };

  const roleMeta = getRoleBadge(targetRole);
  const RoleIcon = roleMeta.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-6 py-4 dark:border-slate-800 dark:bg-slate-800/40">
          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl border ${roleMeta.color}`}>
              <RoleIcon className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">Role Switch Authentication</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Security passcode required to assume role</p>
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

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className={`rounded-xl border p-3 flex items-start gap-3 ${roleMeta.color}`}>
            <ShieldAlert className="h-5 w-5 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold">Role: {targetRole}</p>
              <p className="text-[11px] opacity-90 mt-0.5">{roleMeta.hint}</p>
            </div>
          </div>

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
              Enter {targetRole} Access Password <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                autoFocus
                required
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError(null);
                }}
                placeholder={`Enter password for ${targetRole}`}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-3.5 pr-10 py-2.5 text-xs font-mono font-medium text-slate-800 outline-none focus:border-emerald-500 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <p className="text-[10px] text-slate-400 mt-1">
              Hint default passwords: <span className="font-mono font-bold text-rose-600 dark:text-rose-400">123</span> (Mohsin / kalsoom Admin) or <span className="font-mono font-bold text-slate-600 dark:text-slate-300">admin123</span>, <span className="font-mono font-bold text-slate-600 dark:text-slate-300">tech123</span> (Tech), <span className="font-mono font-bold text-slate-600 dark:text-slate-300">viewer123</span> (Viewer).
            </p>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold text-white shadow-md transition ${roleMeta.btnBg}`}
            >
              <KeyRound className="h-4 w-4" />
              <span>Authenticate Role</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
