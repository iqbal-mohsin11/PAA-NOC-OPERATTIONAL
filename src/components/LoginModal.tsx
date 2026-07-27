import React, { useState } from 'react';
import { useInventory } from '../context/InventoryContext';
import { UserRole } from '../types/inventory';
import {
  X,
  Lock,
  KeyRound,
  User,
  ShieldCheck,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Wrench,
  Eye as ViewIcon,
  Copy,
  Check,
  Key,
  ShieldAlert,
  LogIn,
  LogOut,
} from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
  const { userRole, rolePasswords, isLoggedIn, login, logout } = useInventory();

  const [selectedRole, setSelectedRole] = useState<UserRole>(userRole);
  const [passwordInput, setPasswordInput] = useState('');
  const [showPasswordInput, setShowPasswordInput] = useState(false);
  const [showAllPasswords, setShowAllPasswords] = useState(true);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [copiedRole, setCopiedRole] = useState<string | null>(null);

  if (!isOpen) return null;

  const roleUsernames: Record<UserRole, { username: string; label: string; desc: string }> = {
    Administrator: {
      username: 'admin_paa',
      label: 'PAA System Administrator',
      desc: 'Full administrative rights, settings, passwords & inventory control',
    },
    Technician: {
      username: 'tech_paa',
      label: 'PAA IT Support Technician',
      desc: 'Asset editing, barcode printing, tickets & maintenance logs',
    },
    Viewer: {
      username: 'viewer_paa',
      label: 'PAA Read-Only Auditor',
      desc: 'Read-only directory access & infrastructure reports view',
    },
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const result = login(selectedRole, passwordInput);
    if (!result.success) {
      setErrorMsg(result.message);
      return;
    }

    setSuccessMsg(`Successfully authenticated as ${selectedRole} (${roleUsernames[selectedRole].username})!`);
    setTimeout(() => {
      setPasswordInput('');
      setSuccessMsg(null);
      setErrorMsg(null);
      onClose();
    }, 700);
  };

  const copyToClipboard = (text: string, roleName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedRole(roleName);
    setTimeout(() => setCopiedRole(null), 2000);
  };

  const fillQuickLogin = (role: UserRole) => {
    setSelectedRole(role);
    const pass = rolePasswords?.[role] || 'admin123';
    setPasswordInput(pass);
    setErrorMsg(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900 overflow-hidden my-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-6 py-4 dark:border-slate-800 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white shadow-md">
              <LogIn className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">User Login & Role Credentials</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Authenticate with username and security password to access features
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Active Logged-In User Banner */}
          <div className={`flex flex-wrap items-center justify-between gap-3 rounded-xl border p-3.5 ${
            isLoggedIn
              ? 'border-emerald-500/30 bg-emerald-500/10 dark:bg-emerald-500/15'
              : 'border-slate-300 bg-slate-100 dark:border-slate-700 dark:bg-slate-800/80'
          }`}>
            <div className="flex items-center gap-3">
              <div className={`flex h-9 w-9 items-center justify-center rounded-lg font-bold text-sm text-white ${
                isLoggedIn ? 'bg-emerald-600' : 'bg-slate-500'
              }`}>
                <User className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-900 dark:text-white">Current Session:</span>
                  <span className="font-mono text-xs font-extrabold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950 px-2 py-0.5 rounded">
                    {isLoggedIn ? (roleUsernames[userRole]?.username || 'admin_paa') : 'Logged Out (Guest)'}
                  </span>
                </div>
                <p className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 mt-0.5">
                  {isLoggedIn ? `Active Role: ${userRole} (${roleUsernames[userRole]?.label})` : 'Please select a role and enter password to log in.'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {isLoggedIn ? (
                <>
                  <span className="hidden sm:flex items-center gap-1 rounded-full bg-emerald-600 text-white px-2.5 py-1 text-[10px] font-bold">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Active Session
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      logout();
                      setErrorMsg(null);
                      setSuccessMsg('Logged out successfully.');
                    }}
                    className="flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-700 hover:bg-rose-100 dark:border-rose-900/50 dark:bg-rose-950/60 dark:text-rose-400 transition"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    <span>Log Out</span>
                  </button>
                </>
              ) : (
                <span className="flex items-center gap-1 rounded-full bg-slate-500 text-white px-2.5 py-1 text-[10px] font-bold">
                  Logged Out
                </span>
              )}
            </div>
          </div>

          {/* Quick System Credentials Table Display */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 dark:border-slate-800 dark:bg-slate-800/40 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Key className="h-4 w-4 text-emerald-500" />
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  System User Names & Access Passwords
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setShowAllPasswords(!showAllPasswords)}
                className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400"
              >
                {showAllPasswords ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                <span>{showAllPasswords ? 'Hide Passwords' : 'Show Passwords'}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
              {(['Administrator', 'Technician', 'Viewer'] as UserRole[]).map((r) => {
                const info = roleUsernames[r];
                const pass = rolePasswords?.[r] || (r === 'Administrator' ? 'admin123' : r === 'Technician' ? 'tech123' : 'viewer123');
                const isCurrent = userRole === r;

                return (
                  <div
                    key={r}
                    className={`rounded-xl border p-3 transition ${
                      isCurrent
                        ? 'border-emerald-500/50 bg-white shadow-sm dark:bg-slate-900 dark:border-emerald-500/40'
                        : 'border-slate-200 bg-white/70 dark:border-slate-800 dark:bg-slate-900/60'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1">
                        {r === 'Administrator' ? (
                          <ShieldAlert className="h-3.5 w-3.5 text-rose-500" />
                        ) : r === 'Technician' ? (
                          <Wrench className="h-3.5 w-3.5 text-amber-500" />
                        ) : (
                          <ViewIcon className="h-3.5 w-3.5 text-blue-500" />
                        )}
                        {r}
                      </span>
                      {isCurrent && (
                        <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full dark:bg-emerald-950/80 dark:text-emerald-400">
                          Active
                        </span>
                      )}
                    </div>

                    <div className="space-y-1 text-xs">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-500 dark:text-slate-400">User Name:</span>
                        <div className="flex items-center gap-1 font-mono font-bold text-slate-800 dark:text-slate-200">
                          <span>{info.username}</span>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(info.username, `${r}-user`)}
                            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5"
                            title="Copy username"
                          >
                            {copiedRole === `${r}-user` ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-500 dark:text-slate-400">Password:</span>
                        <div className="flex items-center gap-1 font-mono font-bold text-slate-800 dark:text-slate-200">
                          <span>{showAllPasswords ? pass : '••••••••'}</span>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(pass, `${r}-pass`)}
                            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5"
                            title="Copy password"
                          >
                            {copiedRole === `${r}-pass` ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                          </button>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => fillQuickLogin(r)}
                      className="w-full mt-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 py-1 text-[11px] font-semibold dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 transition"
                    >
                      Use For Login
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* User Login Form */}
          <form onSubmit={handleLogin} className="space-y-4 pt-1">
            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <KeyRound className="h-4 w-4 text-emerald-500" />
              <span>Authenticate Role Login</span>
            </h4>

            {errorMsg && (
              <div className="flex items-center gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-xs font-medium text-rose-600 dark:text-rose-400">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Target Role Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Select User Role / Name
                </label>
                <select
                  value={selectedRole}
                  onChange={(e) => {
                    const r = e.target.value as UserRole;
                    setSelectedRole(r);
                    setErrorMsg(null);
                  }}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-semibold text-slate-800 outline-none focus:border-emerald-500 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                >
                  <option value="Administrator">Administrator ({roleUsernames.Administrator.username})</option>
                  <option value="Technician">Technician ({roleUsernames.Technician.username})</option>
                  <option value="Viewer">Viewer ({roleUsernames.Viewer.username})</option>
                </select>
                <p className="text-[10px] text-slate-400 mt-1">
                  User Name: <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{roleUsernames[selectedRole].username}</span>
                </p>
              </div>

              {/* Password Input */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPasswordInput ? 'text' : 'password'}
                    required
                    value={passwordInput}
                    onChange={(e) => {
                      setPasswordInput(e.target.value);
                      if (errorMsg) setErrorMsg(null);
                    }}
                    placeholder={`Enter password for ${selectedRole}`}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-3.5 pr-10 py-2.5 text-xs font-mono font-bold text-slate-800 outline-none focus:border-emerald-500 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswordInput(!showPasswordInput)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    {showPasswordInput ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  Default password: <span className="font-mono font-bold text-slate-600 dark:text-slate-300">{rolePasswords?.[selectedRole] || 'admin123'}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
              >
                Close
              </button>
              <button
                type="submit"
                className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-5 py-2 text-xs font-bold text-white shadow-md hover:bg-emerald-500 transition"
              >
                <LogIn className="h-4 w-4" />
                <span>Log In As {selectedRole}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
