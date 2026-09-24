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
  UserPlus,
} from 'lucide-react';
import { CreateUserModal } from './CreateUserModal';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
  const { userRole, currentUser, userAccounts, rolePasswords, isLoggedIn, login, logout } = useInventory();

  const [usernameInput, setUsernameInput] = useState<string>(currentUser?.username || 'Mohsin');
  const [passwordInput, setPasswordInput] = useState('');
  const [showPasswordInput, setShowPasswordInput] = useState(false);
  const [showAllPasswords, setShowAllPasswords] = useState(true);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  if (!isOpen) return null;

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const result = login(usernameInput, passwordInput);
    if (!result.success) {
      setErrorMsg(result.message);
      return;
    }

    setSuccessMsg(result.message);
    setTimeout(() => {
      setPasswordInput('');
      setSuccessMsg(null);
      setErrorMsg(null);
      onClose();
    }, 700);
  };

  const copyToClipboard = (text: string, idKey: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(idKey);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const executeQuickLogin = (username: string, pass: string) => {
    setUsernameInput(username);
    setPasswordInput(pass);
    setErrorMsg(null);
    const result = login(username, pass);
    if (result.success) {
      setSuccessMsg(result.message);
      setTimeout(() => {
        setSuccessMsg(null);
        onClose();
      }, 600);
    } else {
      setErrorMsg(result.message);
    }
  };

  const fillCredentials = (username: string, pass: string) => {
    setUsernameInput(username);
    setPasswordInput(pass);
    setErrorMsg(null);
  };

  const currentAccount = userAccounts.find(
    (u) => u.username.toLowerCase() === (currentUser?.username || '').toLowerCase()
  ) || currentUser;

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
              <h3 className="font-bold text-slate-900 dark:text-white text-base">User Login & Access Accounts</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Log in with user credentials (Mohsin, kalsoom - Technician) or System Administrator
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
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl font-bold text-sm text-white shadow-sm ${
                isLoggedIn ? 'bg-emerald-600' : 'bg-slate-500'
              }`}>
                <User className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-900 dark:text-white">Active Session:</span>
                  <span className="font-mono text-xs font-extrabold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/80 px-2 py-0.5 rounded-md border border-emerald-500/20">
                    {isLoggedIn ? (currentAccount?.username || 'admin_paa') : 'Logged Out (Guest)'}
                  </span>
                  {isLoggedIn && (
                    <div className="flex items-center gap-1.5">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                        userRole === 'Administrator'
                          ? 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20'
                          : userRole === 'Technician'
                          ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20'
                          : 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20'
                      }`}>
                        {userRole}
                      </span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400">
                        {userRole === 'Administrator' ? '• Full Admin Rights' : userRole === 'Technician' ? '• Write Data & View Data Only' : '• Read-Only'}
                      </span>
                    </div>
                  )}
                </div>
                <p className="text-[11px] font-medium text-slate-600 dark:text-slate-300 mt-0.5">
                  {isLoggedIn
                    ? `${currentAccount?.displayName || currentAccount?.username} (${currentAccount?.email || 'paa.gov.pk'})`
                    : 'Please select an account or enter username and password to log in.'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {isLoggedIn ? (
                <>
                  <span className="hidden sm:flex items-center gap-1 rounded-full bg-emerald-600 text-white px-2.5 py-1 text-[10px] font-bold shadow-xs">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Authenticated
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

          {/* Quick User Credentials Table Display */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 dark:border-slate-800 dark:bg-slate-800/40 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Key className="h-4 w-4 text-emerald-500" />
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  User Accounts & Access Passwords
                </h4>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(true)}
                  className="flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1 text-[11px] font-bold text-rose-700 hover:bg-rose-100 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300 transition"
                  title="Create New User or Administrator Account"
                >
                  <UserPlus className="h-3 w-3 text-rose-600" />
                  <span>+ Add User / Admin</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowAllPasswords(!showAllPasswords)}
                  className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400"
                >
                  {showAllPasswords ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  <span>{showAllPasswords ? 'Hide Passwords' : 'Show Passwords'}</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
              {userAccounts.map((account) => {
                const isCurrent = isLoggedIn && currentUser?.username?.toLowerCase() === account.username.toLowerCase();
                const isAdmin = account.role === 'Administrator';

                return (
                  <div
                    key={account.id}
                    className={`rounded-xl border p-3 transition flex flex-col justify-between ${
                      isCurrent
                        ? 'border-emerald-500/50 bg-white shadow-sm dark:bg-slate-900 dark:border-emerald-500/40 ring-1 ring-emerald-500/30'
                        : isAdmin
                        ? 'border-rose-200 bg-white/90 dark:border-rose-900/30 dark:bg-slate-900/80'
                        : 'border-slate-200 bg-white/70 dark:border-slate-800 dark:bg-slate-900/60'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                          {isAdmin ? (
                            <ShieldAlert className="h-3.5 w-3.5 text-rose-500" />
                          ) : account.role === 'Technician' ? (
                            <Wrench className="h-3.5 w-3.5 text-amber-500" />
                          ) : (
                            <ViewIcon className="h-3.5 w-3.5 text-blue-500" />
                          )}
                          <span className="truncate">{account.username}</span>
                        </span>
                        <div className="flex items-center gap-1">
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                            isAdmin
                              ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400'
                              : account.role === 'Technician'
                              ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400'
                              : 'bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400'
                          }`}>
                            {account.role === 'Administrator' ? 'Admin' : account.role}
                          </span>
                          {isCurrent && (
                            <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-1 py-0.5 rounded dark:bg-emerald-950 dark:text-emerald-300">
                              Active
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 mb-1.5 flex items-center gap-1">
                        <span className={`h-1.5 w-1.5 rounded-full ${
                          isAdmin ? 'bg-rose-500' : account.role === 'Technician' ? 'bg-amber-500' : 'bg-blue-500'
                        }`} />
                        <span>
                          {account.role === 'Administrator'
                            ? 'Full Administration & Security'
                            : account.role === 'Technician'
                            ? 'Write Data & View Data Only'
                            : 'View Data Only (Read-Only)'}
                        </span>
                      </div>

                      <div className="space-y-1 text-xs">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-500 dark:text-slate-400">Username:</span>
                          <div className="flex items-center gap-1 font-mono font-bold text-slate-800 dark:text-slate-200">
                            <span>{account.username}</span>
                            <button
                              type="button"
                              onClick={() => copyToClipboard(account.username, `${account.id}-user`)}
                              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5"
                              title="Copy username"
                            >
                              {copiedId === `${account.id}-user` ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                            </button>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-500 dark:text-slate-400">Password:</span>
                          <div className="flex items-center gap-1 font-mono font-bold text-slate-800 dark:text-slate-200">
                            <span className={isAdmin ? 'text-rose-600 dark:text-rose-400' : ''}>
                              {showAllPasswords ? account.password : '••••••'}
                            </span>
                            <button
                              type="button"
                              onClick={() => copyToClipboard(account.password, `${account.id}-pass`)}
                              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5"
                              title="Copy password"
                            >
                              {copiedId === `${account.id}-pass` ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                            </button>
                          </div>
                        </div>

                        {/* Active Bypass Code if set */}
                        {account.temporaryBypassCode &&
                          (!account.temporaryBypassCodeExpiresAt ||
                            new Date(account.temporaryBypassCodeExpiresAt).getTime() > Date.now()) && (
                            <div className="flex items-center justify-between text-[11px] bg-amber-50 dark:bg-amber-950/40 p-1 rounded border border-amber-200 dark:border-amber-800">
                              <span className="text-amber-800 dark:text-amber-200 font-bold">Bypass:</span>
                              <div className="flex items-center gap-1 font-mono font-bold text-amber-700 dark:text-amber-300">
                                <span>{account.temporaryBypassCode}</span>
                                <button
                                  type="button"
                                  onClick={() => executeQuickLogin(account.username, account.temporaryBypassCode!)}
                                  className="text-[10px] text-emerald-600 dark:text-emerald-400 font-sans hover:underline ml-1"
                                >
                                  Use
                                </button>
                              </div>
                            </div>
                          )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                      <button
                        type="button"
                        onClick={() => fillCredentials(account.username, account.password)}
                        className="flex-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 py-1 text-[11px] font-semibold dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 transition"
                      >
                        Fill Form
                      </button>
                      <button
                        type="button"
                        onClick={() => executeQuickLogin(account.username, account.password)}
                        className="flex-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white py-1 text-[11px] font-bold transition shadow-2xs"
                      >
                        Login Now
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* User Login Form */}
          <form onSubmit={handleLogin} className="space-y-4 pt-1">
            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <KeyRound className="h-4 w-4 text-emerald-500" />
              <span>Authenticate Account Login</span>
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
              {/* Target Username / Account Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Select or Enter User Name <span className="text-rose-500">*</span>
                </label>
                <div className="space-y-1.5">
                  <select
                    value={usernameInput}
                    onChange={(e) => {
                      const uName = e.target.value;
                      setUsernameInput(uName);
                      const acc = userAccounts.find((u) => u.username.toLowerCase() === uName.toLowerCase());
                      if (acc) {
                        setPasswordInput(acc.password);
                      }
                      setErrorMsg(null);
                    }}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-800 outline-none focus:border-emerald-500 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                  >
                    <option value="">-- Choose User Account --</option>
                    {userAccounts.map((acc) => (
                      <option key={acc.id} value={acc.username}>
                        {acc.username} ({acc.role} - {acc.displayName})
                      </option>
                    ))}
                  </select>

                  <input
                    type="text"
                    required
                    value={usernameInput}
                    onChange={(e) => {
                      setUsernameInput(e.target.value);
                      if (errorMsg) setErrorMsg(null);
                    }}
                    placeholder="Or type user name: Mohsin, kalsoom, admin_paa"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-mono font-bold text-slate-800 outline-none focus:border-emerald-500 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                  />
                </div>
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
                    placeholder="Enter password or temporary bypass code"
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
                {(() => {
                  const targetAcc = userAccounts.find(
                    (u) => u.username.toLowerCase() === usernameInput.toLowerCase()
                  );
                  const isBypassActive = Boolean(
                    targetAcc?.temporaryBypassCode &&
                      (!targetAcc.temporaryBypassCodeExpiresAt ||
                        new Date(targetAcc.temporaryBypassCodeExpiresAt).getTime() > Date.now())
                  );

                  return (
                    <div className="flex items-center justify-between mt-1.5 text-[10px]">
                      <p className="text-slate-400">
                        Passcode for <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{usernameInput || 'Admin'}</span>: <span className="font-mono font-bold text-rose-600 dark:text-rose-400">
                          {targetAcc?.password || '123 / admin123'}
                        </span>
                      </p>
                      {isBypassActive && targetAcc?.temporaryBypassCode && (
                        <button
                          type="button"
                          onClick={() => setPasswordInput(targetAcc.temporaryBypassCode!)}
                          className="font-bold text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/60 px-1.5 py-0.5 rounded hover:bg-amber-200 transition"
                        >
                          Use Bypass: {targetAcc.temporaryBypassCode}
                        </button>
                      )}
                    </div>
                  );
                })()}
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
                <span>Log In As {usernameInput || 'User'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      <CreateUserModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onUserCreated={(newUser) => {
          setUsernameInput(newUser.username);
          setPasswordInput(newUser.password);
          setSuccessMsg(`User "${newUser.username}" created! Ready to authenticate.`);
        }}
      />
    </div>
  );
};
