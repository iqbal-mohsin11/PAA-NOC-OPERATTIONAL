import React, { useState, useMemo } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Search,
  Filter,
  Clock,
  User,
  Terminal,
  Trash2,
  RefreshCw,
  Lock,
  Calendar,
} from 'lucide-react';
import { useInventory } from '../context/InventoryContext';
import { LoginAttempt, UserRole } from '../types/inventory';

export const LoginHistorySection: React.FC = () => {
  const { loginAttempts, clearLoginAttempts, userAccounts, userRole } = useInventory();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<string>('all');
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'Success' | 'Failed'>('all');
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Filter accounts specifically highlighting Administrative and Technician users
  const adminAndTechAccounts = useMemo(() => {
    return userAccounts.filter((u) => u.role === 'Administrator' || u.role === 'Technician');
  }, [userAccounts]);

  const filteredAttempts = useMemo(() => {
    return loginAttempts.filter((attempt) => {
      // User filter
      if (selectedUser !== 'all' && attempt.username.toLowerCase() !== selectedUser.toLowerCase()) {
        return false;
      }

      // Role filter
      if (selectedRole !== 'all' && attempt.role !== selectedRole) {
        return false;
      }

      // Status filter
      if (selectedStatus !== 'all' && attempt.status !== selectedStatus) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchUser = attempt.username.toLowerCase().includes(query);
        const matchName = attempt.displayName.toLowerCase().includes(query);
        const matchTerminal = attempt.terminal?.toLowerCase().includes(query);
        const matchIp = attempt.ipAddress?.toLowerCase().includes(query);
        const matchReason = attempt.failureReason?.toLowerCase().includes(query);
        const matchTime = attempt.timestamp.toLowerCase().includes(query);
        return matchUser || matchName || matchTerminal || matchIp || matchReason || matchTime;
      }

      return true;
    });
  }, [loginAttempts, selectedUser, selectedRole, selectedStatus, searchQuery]);

  const stats = useMemo(() => {
    const total = loginAttempts.length;
    const successCount = loginAttempts.filter((a) => a.status === 'Success').length;
    const failedCount = loginAttempts.filter((a) => a.status === 'Failed').length;
    const adminAttempts = loginAttempts.filter((a) => a.role === 'Administrator').length;
    const techAttempts = loginAttempts.filter((a) => a.role === 'Technician').length;
    const successRate = total > 0 ? Math.round((successCount / total) * 100) : 0;
    const lastAttempt = loginAttempts[0] || null;

    return {
      total,
      successCount,
      failedCount,
      adminAttempts,
      techAttempts,
      successRate,
      lastAttempt,
    };
  }, [loginAttempts]);

  return (
    <div id="login-history-section" className="space-y-5">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:bg-emerald-400/10 dark:text-emerald-400">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Account Login Attempt History
            </h3>
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              {loginAttempts.length} Records
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Chronological audit trail of authentication attempts for registered administrative and technician accounts, logging success/failure status, timestamps, and origin terminals.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {userRole === 'Administrator' && (
            <button
              id="clear-login-history-btn"
              onClick={() => setShowClearConfirm(true)}
              className="flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100 dark:border-rose-900/40 dark:bg-rose-950/40 dark:text-rose-300 transition"
              title="Clear all login attempt records"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Clear History</span>
            </button>
          )}
        </div>
      </div>

      {/* Confirmation Modal for Clear History */}
      {showClearConfirm && (
        <div className="rounded-xl border border-rose-300 bg-rose-50 p-4 dark:border-rose-900 dark:bg-rose-950/60 flex items-start gap-3">
          <ShieldAlert className="h-5 w-5 text-rose-600 mt-0.5 shrink-0" />
          <div className="flex-1 text-xs">
            <p className="font-bold text-rose-900 dark:text-rose-200">
              Confirm Clearing Login History Log
            </p>
            <p className="text-rose-700 dark:text-rose-300 mt-0.5">
              Are you sure you want to clear all {loginAttempts.length} authentication audit logs? This action cannot be undone.
            </p>
            <div className="mt-3 flex items-center gap-2">
              <button
                id="confirm-clear-logs-btn"
                onClick={() => {
                  clearLoginAttempts();
                  setShowClearConfirm(false);
                }}
                className="rounded-lg bg-rose-600 px-3 py-1.5 font-bold text-white hover:bg-rose-500 transition"
              >
                Yes, Clear All Logs
              </button>
              <button
                onClick={() => setShowClearConfirm(false)}
                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Metric Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 dark:border-slate-800 dark:bg-slate-800/40">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Total Attempts</span>
            <Clock className="h-4 w-4 text-slate-400" />
          </div>
          <div className="mt-1 text-xl font-extrabold text-slate-900 dark:text-white">
            {stats.total}
          </div>
          <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
            {stats.adminAttempts} Admin • {stats.techAttempts} Tech
          </div>
        </div>

        <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-3 dark:border-emerald-900/40 dark:bg-emerald-950/20">
          <div className="flex items-center justify-between text-xs text-emerald-700 dark:text-emerald-400">
            <span>Successful</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="mt-1 text-xl font-extrabold text-emerald-700 dark:text-emerald-400">
            {stats.successCount}
          </div>
          <div className="mt-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400/90">
            {stats.successRate}% Success Rate
          </div>
        </div>

        <div className="rounded-xl border border-rose-200 bg-rose-50/50 p-3 dark:border-rose-900/40 dark:bg-rose-950/20">
          <div className="flex items-center justify-between text-xs text-rose-700 dark:text-rose-400">
            <span>Failed Attempts</span>
            <XCircle className="h-4 w-4 text-rose-500" />
          </div>
          <div className="mt-1 text-xl font-extrabold text-rose-700 dark:text-rose-400">
            {stats.failedCount}
          </div>
          <div className="mt-1 text-[11px] font-medium text-rose-600 dark:text-rose-400/90">
            {stats.failedCount === 0 ? 'No security alerts' : 'Password/credential flags'}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 dark:border-slate-800 dark:bg-slate-800/40">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Latest Attempt</span>
            <Lock className="h-4 w-4 text-slate-400" />
          </div>
          <div className="mt-1 text-xs font-bold text-slate-900 dark:text-white truncate">
            {stats.lastAttempt ? stats.lastAttempt.username : 'None'}
          </div>
          <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400 truncate">
            {stats.lastAttempt ? stats.lastAttempt.timestamp : 'No activity logged'}
          </div>
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <input
            id="login-history-search-input"
            type="text"
            placeholder="Search by user, IP address, terminal, reason..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:border-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          />
        </div>

        {/* Dropdown Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Account Filter */}
          <div className="flex items-center gap-1.5">
            <User className="h-3.5 w-3.5 text-slate-400" />
            <select
              id="login-history-user-filter"
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 focus:outline-none focus:border-emerald-500"
            >
              <option value="all">All Accounts ({userAccounts.length})</option>
              <optgroup label="Admin & Tech Accounts">
                {adminAndTechAccounts.map((acc) => (
                  <option key={acc.id} value={acc.username}>
                    {acc.displayName} ({acc.role})
                  </option>
                ))}
              </optgroup>
              <optgroup label="Other Accounts">
                {userAccounts
                  .filter((u) => u.role === 'Viewer')
                  .map((acc) => (
                    <option key={acc.id} value={acc.username}>
                      {acc.displayName} ({acc.role})
                    </option>
                  ))}
              </optgroup>
            </select>
          </div>

          {/* Role Filter */}
          <div className="flex items-center gap-1.5">
            <Filter className="h-3.5 w-3.5 text-slate-400" />
            <select
              id="login-history-role-filter"
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 focus:outline-none focus:border-emerald-500"
            >
              <option value="all">All Roles</option>
              <option value="Administrator">Administrator</option>
              <option value="Technician">Technician</option>
              <option value="Viewer">Viewer</option>
            </select>
          </div>

          {/* Status Filter Buttons */}
          <div className="flex items-center rounded-xl border border-slate-200 bg-slate-100 p-0.5 dark:border-slate-700 dark:bg-slate-800">
            <button
              id="filter-status-all"
              onClick={() => setSelectedStatus('all')}
              className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                selectedStatus === 'all'
                  ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              All
            </button>
            <button
              id="filter-status-success"
              onClick={() => setSelectedStatus('Success')}
              className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                selectedStatus === 'Success'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-emerald-700 hover:text-emerald-800 dark:text-emerald-400'
              }`}
            >
              Success
            </button>
            <button
              id="filter-status-failed"
              onClick={() => setSelectedStatus('Failed')}
              className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                selectedStatus === 'Failed'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-rose-700 hover:text-rose-800 dark:text-rose-400'
              }`}
            >
              Failed
            </button>
          </div>
        </div>
      </div>

      {/* History Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
            <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-400">
              <tr>
                <th className="px-4 py-3">Timestamp</th>
                <th className="px-4 py-3">Account & Role</th>
                <th className="px-4 py-3">Access Level</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Terminal / IP Address</th>
                <th className="px-4 py-3">Details / Outcome</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
              {filteredAttempts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-400 dark:text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-1.5">
                      <ShieldCheck className="h-8 w-8 text-slate-300 dark:text-slate-600" />
                      <p className="font-semibold text-slate-600 dark:text-slate-400">No login attempts found</p>
                      <p className="text-[11px] text-slate-400">
                        {searchQuery || selectedUser !== 'all' || selectedStatus !== 'all' || selectedRole !== 'all'
                          ? 'Try resetting the filters or search term.'
                          : 'No login attempts have been recorded yet.'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredAttempts.map((attempt) => {
                  const isSuccess = attempt.status === 'Success';
                  const isMohsin = attempt.username.toLowerCase() === 'mohsin';
                  const isKalsoom = attempt.username.toLowerCase() === 'kalsoom';
                  const isAdmin = attempt.role === 'Administrator';
                  const isTech = attempt.role === 'Technician';

                  return (
                    <tr
                      key={attempt.id}
                      className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition"
                    >
                      {/* Timestamp */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-slate-800 dark:text-slate-200">
                          <Calendar className="h-3.5 w-3.5 text-slate-400" />
                          <span className="font-mono text-[11px] font-medium">{attempt.timestamp}</span>
                        </div>
                      </td>

                      {/* Account & Role */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div
                            className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-white shrink-0 ${
                              isAdmin
                                ? 'bg-gradient-to-tr from-rose-600 to-rose-400'
                                : isTech
                                ? 'bg-gradient-to-tr from-amber-600 to-amber-400'
                                : 'bg-gradient-to-tr from-sky-600 to-sky-400'
                            }`}
                          >
                            {attempt.username.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-slate-900 dark:text-white">
                                {attempt.displayName || attempt.username}
                              </span>
                              {(isMohsin || isKalsoom) && (
                                <span className="rounded bg-emerald-100 px-1.5 py-0.2 text-[10px] font-bold text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                                  Technician Account
                                </span>
                              )}
                            </div>
                            <span className="font-mono text-[10px] text-slate-400">
                              @{attempt.username}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Access Level Badge */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          {isAdmin ? (
                            <span className="inline-flex items-center gap-1 rounded-md bg-rose-100 px-2 py-0.5 text-[11px] font-bold text-rose-800 dark:bg-rose-950/60 dark:text-rose-300">
                              <ShieldAlert className="h-3 w-3" />
                              Write & View (Admin)
                            </span>
                          ) : isTech ? (
                            <span className="inline-flex items-center gap-1 rounded-md bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                              <ShieldCheck className="h-3 w-3" />
                              Write & View Data
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-md bg-sky-100 px-2 py-0.5 text-[11px] font-medium text-sky-800 dark:bg-sky-950/60 dark:text-sky-300">
                              Read-Only
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        {isSuccess ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                            <CheckCircle2 className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                            Success
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2.5 py-0.5 text-[11px] font-bold text-rose-700 dark:bg-rose-950/60 dark:text-rose-300">
                            <XCircle className="h-3 w-3 text-rose-600 dark:text-rose-400" />
                            Failed
                          </span>
                        )}
                      </td>

                      {/* Terminal / IP Address */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-1 text-[11px] font-medium text-slate-700 dark:text-slate-300">
                            <Terminal className="h-3 w-3 text-slate-400 shrink-0" />
                            <span>{attempt.terminal || 'PAA IT Console'}</span>
                          </div>
                          <span className="font-mono text-[10px] text-slate-400 pl-4">
                            IP: {attempt.ipAddress || '192.168.10.x'}
                          </span>
                        </div>
                      </td>

                      {/* Details / Outcome */}
                      <td className="px-4 py-3">
                        {isSuccess ? (
                          <span className="text-[11px] text-slate-600 dark:text-slate-400">
                            {attempt.role === 'Administrator'
                              ? 'Root Administrative session authorized'
                              : attempt.role === 'Technician'
                              ? 'Technician permissions authorized (Write & View)'
                              : 'Auditor read-only session authorized'}
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-md bg-rose-50 px-2 py-0.5 text-[11px] font-medium text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
                            {attempt.failureReason || 'Authentication challenge failed'}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer info note */}
        <div className="flex flex-col sm:flex-row items-center justify-between border-t border-slate-100 bg-slate-50/70 px-4 py-2.5 text-[11px] text-slate-500 dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-400">
          <span>
            Showing {filteredAttempts.length} of {loginAttempts.length} recorded login attempts
          </span>
          <span className="font-mono text-[10px] text-slate-400">
            PAA Sentinel Security Subsystem • SHA-256 Audit Trail
          </span>
        </div>
      </div>
    </div>
  );
};
