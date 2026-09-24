import React, { useState, useMemo } from 'react';
import {
  UserPlus,
  ShieldAlert,
  ShieldCheck,
  Eye,
  EyeOff,
  Search,
  Filter,
  Trash2,
  Edit2,
  Check,
  X,
  Lock,
  Unlock,
  Mail,
  Building2,
  Briefcase,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  LogIn,
  UserCheck,
  Crown,
  Wrench,
  Timer,
} from 'lucide-react';
import { useInventory } from '../context/InventoryContext';
import { UserAccount, UserRole } from '../types/inventory';
import { CreateUserModal } from './CreateUserModal';
import { ResetPasswordModal } from './ResetPasswordModal';

export const UserAccountsManagement: React.FC = () => {
  const {
    userAccounts,
    currentUser,
    userRole,
    updateUserAccount,
    deleteUserAccount,
    login,
  } = useInventory();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [resetUserTarget, setResetUserTarget] = useState<UserAccount | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>('all');
  const [editingPasswordId, setEditingPasswordId] = useState<string | null>(null);
  const [tempPassword, setTempPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
  const [feedbackMessage, setFeedbackMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [userToDelete, setUserToDelete] = useState<UserAccount | null>(null);

  const showNotification = (text: string, type: 'success' | 'error' = 'success') => {
    setFeedbackMessage({ text, type });
    setTimeout(() => setFeedbackMessage(null), 3500);
  };

  const togglePasswordVisibility = (id: string) => {
    setShowPasswords((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const startEditPassword = (account: UserAccount) => {
    setEditingPasswordId(account.id);
    setTempPassword(account.password);
  };

  const savePassword = (id: string) => {
    if (!tempPassword.trim()) {
      showNotification('Password cannot be blank.', 'error');
      return;
    }
    updateUserAccount(id, { password: tempPassword.trim() });
    setEditingPasswordId(null);
    showNotification('Account password updated successfully!', 'success');
  };

  const cancelEditPassword = () => {
    setEditingPasswordId(null);
    setTempPassword('');
  };

  const handleSwitchAccount = (account: UserAccount) => {
    const res = login(account.username, account.password);
    if (res.success) {
      showNotification(`Switched active session to ${account.displayName} (${account.role}).`, 'success');
    } else {
      showNotification(res.message, 'error');
    }
  };

  const confirmDelete = () => {
    if (!userToDelete) return;
    const res = deleteUserAccount(userToDelete.id);
    if (res.success) {
      showNotification(res.message, 'success');
    } else {
      showNotification(res.message, 'error');
    }
    setUserToDelete(null);
  };

  const filteredAccounts = useMemo(() => {
    return userAccounts.filter((account) => {
      // Role filter
      if (selectedRoleFilter !== 'all' && account.role !== selectedRoleFilter) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchUser = account.username.toLowerCase().includes(q);
        const matchName = account.displayName.toLowerCase().includes(q);
        const matchDept = account.department?.toLowerCase().includes(q);
        const matchEmail = account.email?.toLowerCase().includes(q);
        const matchRole = account.role.toLowerCase().includes(q);
        return matchUser || matchName || matchDept || matchEmail || matchRole;
      }

      return true;
    });
  }, [userAccounts, selectedRoleFilter, searchQuery]);

  const stats = useMemo(() => {
    const total = userAccounts.length;
    const admins = userAccounts.filter((u) => u.role === 'Administrator').length;
    const technicians = userAccounts.filter((u) => u.role === 'Technician').length;
    const viewers = userAccounts.filter((u) => u.role === 'Viewer').length;
    return { total, admins, technicians, viewers };
  }, [userAccounts]);

  const protectedUsernames = ['mohsin', 'kalsoom', 'admin_paa'];

  return (
    <div id="user-accounts-management-section" className="space-y-5">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-500/10 text-rose-600 dark:bg-rose-400/10 dark:text-rose-400">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              User Accounts & Role Permissions
            </h3>
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              {userAccounts.length} Registered
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Create, configure and authorize user and administrator accounts for PAA IT personnel with explicit role permissions (Administrator, Technician, Viewer).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="open-create-user-modal-btn"
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-rose-600 to-rose-500 px-3.5 py-2 text-xs font-bold text-white shadow-md shadow-rose-600/20 hover:from-rose-500 hover:to-rose-400 transition"
          >
            <UserPlus className="h-4 w-4" />
            <span>Add User / Admin</span>
          </button>
        </div>
      </div>

      {/* Feedback Toast Banner */}
      {feedbackMessage && (
        <div
          className={`flex items-center gap-2 rounded-xl p-3 text-xs font-semibold transition animate-fadeIn ${
            feedbackMessage.type === 'success'
              ? 'border border-emerald-500/20 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
              : 'border border-rose-500/20 bg-rose-50 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300'
          }`}
        >
          {feedbackMessage.type === 'success' ? (
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
          ) : (
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
          )}
          <span>{feedbackMessage.text}</span>
        </div>
      )}

      {/* Stat Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 dark:border-slate-800 dark:bg-slate-800/40">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Total Accounts</span>
            <UserCheck className="h-4 w-4 text-slate-400" />
          </div>
          <div className="mt-1 text-xl font-extrabold text-slate-900 dark:text-white">
            {stats.total}
          </div>
          <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
            Active PAA Staff Directory
          </div>
        </div>

        <div className="rounded-xl border border-rose-200 bg-rose-50/50 p-3 dark:border-rose-900/40 dark:bg-rose-950/20">
          <div className="flex items-center justify-between text-xs text-rose-700 dark:text-rose-400">
            <span>Administrators</span>
            <Crown className="h-4 w-4 text-rose-500" />
          </div>
          <div className="mt-1 text-xl font-extrabold text-rose-700 dark:text-rose-400">
            {stats.admins}
          </div>
          <div className="mt-1 text-[11px] font-medium text-rose-600 dark:text-rose-400">
            Write & View (Full Admin)
          </div>
        </div>

        <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-3 dark:border-amber-900/40 dark:bg-amber-950/20">
          <div className="flex items-center justify-between text-xs text-amber-700 dark:text-amber-400">
            <span>Technicians</span>
            <Wrench className="h-4 w-4 text-amber-500" />
          </div>
          <div className="mt-1 text-xl font-extrabold text-amber-700 dark:text-amber-400">
            {stats.technicians}
          </div>
          <div className="mt-1 text-[11px] font-medium text-amber-600 dark:text-amber-400">
            Write & View Data (Asset Ops)
          </div>
        </div>

        <div className="rounded-xl border border-sky-200 bg-sky-50/50 p-3 dark:border-sky-900/40 dark:bg-sky-950/20">
          <div className="flex items-center justify-between text-xs text-sky-700 dark:text-sky-400">
            <span>Viewers</span>
            <Eye className="h-4 w-4 text-sky-500" />
          </div>
          <div className="mt-1 text-xl font-extrabold text-sky-700 dark:text-sky-400">
            {stats.viewers}
          </div>
          <div className="mt-1 text-[11px] font-medium text-sky-600 dark:text-sky-400">
            Read-Only Audit Scope
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <input
            id="search-user-accounts-input"
            type="text"
            placeholder="Search accounts by username, display name, department or role..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:border-rose-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="h-3.5 w-3.5 text-slate-400 shrink-0" />
          <div className="flex items-center rounded-xl border border-slate-200 bg-slate-100 p-0.5 dark:border-slate-700 dark:bg-slate-800">
            <button
              onClick={() => setSelectedRoleFilter('all')}
              className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                selectedRoleFilter === 'all'
                  ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-700 dark:text-white'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
              }`}
            >
              All Roles
            </button>
            <button
              onClick={() => setSelectedRoleFilter('Administrator')}
              className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                selectedRoleFilter === 'Administrator'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-rose-700 hover:text-rose-800 dark:text-rose-400'
              }`}
            >
              Admin
            </button>
            <button
              onClick={() => setSelectedRoleFilter('Technician')}
              className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                selectedRoleFilter === 'Technician'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-amber-700 hover:text-amber-800 dark:text-amber-400'
              }`}
            >
              Technician
            </button>
            <button
              onClick={() => setSelectedRoleFilter('Viewer')}
              className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                selectedRoleFilter === 'Viewer'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'text-sky-700 hover:text-sky-800 dark:text-sky-400'
              }`}
            >
              Viewer
            </button>
          </div>
        </div>
      </div>

      {/* User Accounts Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {filteredAccounts.map((account) => {
          const isAdmin = account.role === 'Administrator';
          const isTech = account.role === 'Technician';
          const isViewer = account.role === 'Viewer';
          const isActiveUser = currentUser?.username.toLowerCase() === account.username.toLowerCase();
          const isProtected = protectedUsernames.includes(account.username.toLowerCase());
          const isEditingThisPassword = editingPasswordId === account.id;
          const isPasswordShown = !!showPasswords[account.id];

          return (
            <div
              key={account.id}
              className={`relative rounded-2xl border p-4 transition flex flex-col justify-between ${
                isActiveUser
                  ? 'border-emerald-500/50 bg-emerald-50/20 shadow-md dark:border-emerald-500/40 dark:bg-emerald-950/20'
                  : isAdmin
                  ? 'border-rose-200 bg-white dark:border-rose-900/40 dark:bg-slate-900'
                  : isTech
                  ? 'border-amber-200/80 bg-white dark:border-amber-900/40 dark:bg-slate-900'
                  : 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900'
              }`}
            >
              {/* Card Top: Identity & Role Badge */}
              <div>
                <div className="flex items-start justify-between gap-2 mb-2.5">
                  <div className="flex items-center gap-2.5">
                    {/* User Avatar Initials */}
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-xl text-xs font-extrabold text-white shadow-xs shrink-0 ${
                        isAdmin
                          ? 'bg-gradient-to-tr from-rose-600 to-rose-400'
                          : isTech
                          ? 'bg-gradient-to-tr from-amber-600 to-amber-500'
                          : 'bg-gradient-to-tr from-sky-600 to-sky-400'
                      }`}
                    >
                      {account.username.slice(0, 2).toUpperCase()}
                    </div>

                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                          {account.displayName || account.username}
                        </span>
                        {isActiveUser && (
                          <span className="flex items-center gap-0.5 rounded-full bg-emerald-100 px-2 py-0.2 text-[10px] font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                            Active
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 font-mono text-xs font-bold text-slate-400">
                        <span>@{account.username}</span>
                        {isProtected && (
                          <span className="text-[9px] font-sans font-semibold rounded bg-slate-100 px-1 text-slate-500 dark:bg-slate-800">
                            System
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Role Badge */}
                  <div className="shrink-0">
                    {isAdmin ? (
                      <span className="inline-flex items-center gap-1 rounded-lg bg-rose-100 px-2 py-1 text-[10px] font-bold text-rose-800 dark:bg-rose-950/60 dark:text-rose-300">
                        <ShieldAlert className="h-3 w-3 text-rose-600" />
                        Admin
                      </span>
                    ) : isTech ? (
                      <span className="inline-flex items-center gap-1 rounded-lg bg-amber-100 px-2 py-1 text-[10px] font-bold text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                        <ShieldCheck className="h-3 w-3 text-amber-600" />
                        Technician
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-lg bg-sky-100 px-2 py-1 text-[10px] font-bold text-sky-800 dark:bg-sky-950/60 dark:text-sky-300">
                        <Eye className="h-3 w-3 text-sky-600" />
                        Viewer
                      </span>
                    )}
                  </div>
                </div>

                {/* Scope Description */}
                <div className="mb-3 rounded-lg bg-slate-50 px-2.5 py-1.5 text-[11px] font-medium text-slate-600 dark:bg-slate-800/60 dark:text-slate-300">
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {isAdmin
                      ? 'Write & View (Admin):'
                      : isTech
                      ? 'Write & View Data:'
                      : 'Read-Only:'}{' '}
                  </span>
                  {isAdmin
                    ? 'Full rights, database backups, user accounts & settings'
                    : isTech
                    ? 'Register assets, issue maintenance & gate passes'
                    : 'Search inventory & generate audit reports'}
                </div>

                {/* Account Details */}
                <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
                  {account.department && (
                    <div className="flex items-center gap-1.5 truncate">
                      <Building2 className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{account.department}</span>
                    </div>
                  )}

                  {account.email && (
                    <div className="flex items-center gap-1.5 truncate">
                      <Mail className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span className="font-mono text-[11px] truncate">{account.email}</span>
                    </div>
                  )}

                  {/* Password Line with Inline Edit */}
                  <div className="mt-2 rounded-xl border border-slate-100 bg-slate-50/80 p-2 dark:border-slate-800 dark:bg-slate-800/40">
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <span className="font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1">
                        <KeyRound className="h-3 w-3 text-slate-400" />
                        Password:
                      </span>

                      {!isEditingThisPassword && (
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => togglePasswordVisibility(account.id)}
                            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5"
                            title={isPasswordShown ? 'Hide Password' : 'Show Password'}
                          >
                            {isPasswordShown ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                          </button>
                          <button
                            type="button"
                            onClick={() => startEditPassword(account)}
                            className="text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 p-0.5"
                            title="Edit Password"
                          >
                            <Edit2 className="h-3 w-3" />
                          </button>
                        </div>
                      )}
                    </div>

                    {isEditingThisPassword ? (
                      <div className="flex items-center gap-1">
                        <input
                          type="text"
                          value={tempPassword}
                          onChange={(e) => setTempPassword(e.target.value)}
                          placeholder="New password"
                          className="flex-1 rounded-lg border border-emerald-400 bg-white px-2 py-1 text-xs font-mono font-bold text-slate-900 focus:outline-none dark:bg-slate-900 dark:text-white"
                        />
                        <button
                          type="button"
                          onClick={() => savePassword(account.id)}
                          className="rounded-lg bg-emerald-600 p-1 text-white hover:bg-emerald-500"
                          title="Save Password"
                        >
                          <Check className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={cancelEditPassword}
                          className="rounded-lg bg-slate-200 p-1 text-slate-600 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-300"
                          title="Cancel"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ) : (
                      <span className="font-mono text-xs font-extrabold text-slate-800 dark:text-slate-100">
                        {isPasswordShown ? account.password : '••••••••'}
                      </span>
                    )}
                  </div>

                  {/* Active Bypass Code Banner if set & not expired */}
                  {account.temporaryBypassCode &&
                    (!account.temporaryBypassCodeExpiresAt ||
                      new Date(account.temporaryBypassCodeExpiresAt).getTime() > Date.now()) && (
                      <div className="mt-2 flex items-center justify-between rounded-xl border border-amber-300 bg-amber-50/90 p-2 text-xs text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-200">
                        <div className="flex items-center gap-1.5 truncate">
                          <Unlock className="h-3.5 w-3.5 shrink-0 text-amber-600 animate-pulse" />
                          <span className="truncate">
                            Bypass: <strong className="font-mono font-black">{account.temporaryBypassCode}</strong>
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setResetUserTarget(account)}
                          className="rounded-md bg-amber-200/80 px-1.5 py-0.5 text-[10px] font-bold text-amber-900 hover:bg-amber-300 dark:bg-amber-900/60 dark:text-amber-200 shrink-0 ml-1 transition"
                        >
                          Manage
                        </button>
                      </div>
                    )}
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-1.5">
                <button
                  type="button"
                  onClick={() => handleSwitchAccount(account)}
                  className={`flex-1 flex items-center justify-center gap-1 rounded-xl py-1.5 text-xs font-bold transition shadow-2xs ${
                    isActiveUser
                      ? 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
                      : 'bg-emerald-600 text-white hover:bg-emerald-500'
                  }`}
                >
                  <LogIn className="h-3.5 w-3.5" />
                  <span>{isActiveUser ? 'Active' : 'Login'}</span>
                </button>

                {/* Reset Password & Bypass Code Button */}
                <button
                  type="button"
                  onClick={() => setResetUserTarget(account)}
                  className="flex items-center gap-1 rounded-xl border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-xs font-bold text-amber-800 hover:bg-amber-100 dark:border-amber-900/40 dark:bg-amber-950/40 dark:text-amber-300 transition"
                  title="Reset Password or Generate Temporary Bypass Code"
                >
                  <KeyRound className="h-3.5 w-3.5" />
                  <span>Reset</span>
                </button>

                {!isProtected ? (
                  <button
                    type="button"
                    onClick={() => setUserToDelete(account)}
                    className="flex h-8 w-8 items-center justify-center rounded-xl border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100 dark:border-rose-900/40 dark:bg-rose-950/40 dark:text-rose-400 transition shrink-0"
                    title={`Delete account "${account.username}"`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                ) : (
                  <span
                    className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-100 bg-slate-50 text-slate-300 dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-600 cursor-not-allowed shrink-0"
                    title="Primary system account is protected"
                  >
                    <Lock className="h-3.5 w-3.5" />
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Delete Account Confirmation Modal */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-md rounded-2xl border border-rose-200 bg-white p-5 shadow-2xl dark:border-rose-900 dark:bg-slate-900 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-100 dark:bg-rose-950/60">
                <ShieldAlert className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-900 dark:text-white">
                  Confirm Account Deletion
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Permanent removal of user credentials
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300">
              Are you sure you want to delete user account{' '}
              <strong className="text-slate-900 dark:text-white font-mono">
                @{userToDelete.username}
              </strong>{' '}
              ({userToDelete.displayName})? This user will no longer be able to log in or authorize airport operations.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setUserToDelete(null)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white hover:bg-rose-500 shadow-sm"
              >
                Yes, Delete User Account
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create User Modal */}
      <CreateUserModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onUserCreated={(newUser) => {
          showNotification(`User account "${newUser.username}" created successfully!`, 'success');
        }}
      />

      {/* Reset Password & Temporary Bypass Code Modal */}
      <ResetPasswordModal
        isOpen={Boolean(resetUserTarget)}
        onClose={() => setResetUserTarget(null)}
        targetUser={
          resetUserTarget
            ? userAccounts.find((u) => u.id === resetUserTarget.id) || resetUserTarget
            : null
        }
        onSuccessNotification={(msg) => showNotification(msg, 'success')}
      />
    </div>
  );
};
