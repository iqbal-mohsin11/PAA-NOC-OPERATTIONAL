import React, { useState } from 'react';
import { useInventory } from '../context/InventoryContext';
import { ProcurementFormModal } from './ProcurementFormModal';
import { InternalRequisitionFormModal } from './InternalRequisitionFormModal';
import {
  Shield,
  Search,
  Bell,
  Sun,
  Moon,
  Download,
  Database,
  UserCheck,
  ChevronDown,
  Activity,
  AlertTriangle,
  X,
  Plane,
  Server,
  RefreshCw,
  Settings,
  LogIn,
  LogOut,
  KeyRound,
  User,
  FileText,
  FileSpreadsheet,
} from 'lucide-react';
import { UserRole } from '../types/inventory';
import { RolePasswordModal } from './RolePasswordModal';
import { LoginModal } from './LoginModal';

interface HeaderProps {
  onOpenSettings: () => void;
  onOpenExcelImport?: () => void;
  onOpenImportExcel?: () => void;
  onSelectAsset?: (asset: any) => void;
  onNavigateTab?: (tab: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenSettings, onNavigateTab }) => {
  const {
    settings,
    userRole,
    setUserRole,
    isLoggedIn,
    logout,
    searchQuery,
    setSearchQuery,
    toggleTheme,
    exportDatabaseJson,
    auditLogs,
    tickets,
    assets,
  } = useInventory();

  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showNotificationDrawer, setShowNotificationDrawer] = useState(false);
  const [targetRoleForAuth, setTargetRoleForAuth] = useState<UserRole | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showFormsMenu, setShowFormsMenu] = useState(false);
  const [showProcurementModal, setShowProcurementModal] = useState(false);
  const [showRequisitionModal, setShowRequisitionModal] = useState(false);

  const roleUsernames: Record<UserRole, string> = {
    Administrator: 'admin_paa',
    Technician: 'tech_paa',
    Viewer: 'viewer_paa',
  };

  const activeAssets = assets.filter((a) => !a.isRemoved);
  const openTicketsCount = tickets.filter((t) => t.status !== 'Closed').length;

  const now = new Date();
  const ninetyDays = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
  const expiringWarrantyCount = activeAssets.filter((a) => a.warrantyExpiry && new Date(a.warrantyExpiry) <= ninetyDays).length;
  const lowTonerCount = activeAssets.filter((a) => a.category === 'Printer' && a.printerSpecs?.tonerLevel !== undefined && a.printerSpecs.tonerLevel <= 25).length;
  const totalNocAlertsCount = expiringWarrantyCount + lowTonerCount + openTicketsCount;

  const roles: UserRole[] = ['Administrator', 'Technician', 'Viewer'];

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white/95 px-4 shadow-sm backdrop-blur transition-colors dark:border-slate-800 dark:bg-slate-900/95 dark:text-slate-100">
      {/* Brand & Identity */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-600 via-teal-700 to-cyan-800 text-white shadow-md shadow-emerald-500/20">
          <Shield className="h-6 w-6" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-bold text-slate-900 tracking-tight text-base sm:text-lg dark:text-white">
              {settings.orgName}
            </h1>
            <span className="inline-flex items-center rounded-md bg-emerald-500/10 px-2 py-0.5 text-xs font-semibold text-emerald-600 dark:bg-emerald-400/10 dark:text-emerald-400">
              PAA Asset Hub v5.0
            </span>
          </div>
          <p className="hidden text-xs text-slate-500 sm:block dark:text-slate-400">
            {settings.airportName}
          </p>
        </div>
      </div>

      {/* Global Search Bar */}
      <div className="hidden max-w-md flex-1 px-6 md:flex">
        <div className="relative w-full">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search Asset ID, Serial #, IP, MAC, User, Dept, Model..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-4 py-2 text-xs font-medium text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-emerald-400 dark:focus:bg-slate-900"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Action Icons & Controls */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Dedicated Separate NOC Operations Alert & Notification Center Button */}
        {onNavigateTab && (
          <button
            onClick={() => onNavigateTab('noc_alerts')}
            className="flex items-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-2.5 py-1.5 text-xs font-bold text-amber-700 hover:bg-amber-500/20 dark:bg-amber-500/20 dark:text-amber-300 transition"
            title="Open NOC Operations Alert & Notification Center"
          >
            <Bell className="h-4 w-4 text-amber-500 animate-pulse" />
            <span className="hidden sm:inline">NOC Alerts</span>
            {totalNocAlertsCount > 0 && (
              <span className="rounded-full bg-rose-500 px-1.5 py-0.2 text-[10px] font-extrabold text-white">
                {totalNocAlertsCount}
              </span>
            )}
          </button>
        )}

        {/* Official CAAF Forms Dropdown Button */}
        <div className="relative">
          <button
            onClick={() => setShowFormsMenu(!showFormsMenu)}
            className="flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50/80 px-2.5 py-1.5 text-xs font-bold text-indigo-700 hover:bg-indigo-100 dark:border-indigo-900/50 dark:bg-indigo-950/60 dark:text-indigo-300 transition"
            title="Official PAA/CAA Forms (CAAF-001 & CAAF-003)"
          >
            <FileText className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            <span className="hidden lg:inline">Official Forms</span>
            <ChevronDown className="h-3.5 w-3.5 opacity-70" />
          </button>

          {showFormsMenu && (
            <div className="absolute right-0 top-11 z-50 w-72 rounded-xl border border-slate-200 bg-white p-2 shadow-2xl dark:border-slate-800 dark:bg-slate-900 animate-fadeIn">
              <div className="px-2 py-1 text-[10px] font-black uppercase tracking-wider text-slate-400">
                Official PAA / CAA Forms
              </div>

              <button
                onClick={() => {
                  setShowFormsMenu(false);
                  setShowProcurementModal(true);
                }}
                className="flex w-full items-start gap-2.5 rounded-lg p-2.5 text-left hover:bg-indigo-50 dark:hover:bg-indigo-950/50 transition group"
              >
                <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300">
                  <FileText className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                    IT Procurement Authorization
                  </div>
                  <div className="text-[10px] font-mono font-bold text-indigo-600 dark:text-indigo-400">
                    CAAF-001-XXIT-2.0
                  </div>
                </div>
              </button>

              <button
                onClick={() => {
                  setShowFormsMenu(false);
                  setShowRequisitionModal(true);
                }}
                className="flex w-full items-start gap-2.5 rounded-lg p-2.5 text-left hover:bg-emerald-50 dark:hover:bg-emerald-950/50 transition group"
              >
                <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300">
                  <FileSpreadsheet className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
                    Toner & Logistics Internal Demand
                  </div>
                  <div className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    CAAF-003-XXLA-1.0 [CAAF-078]
                  </div>
                </div>
              </button>
            </div>
          )}
        </div>

        {/* Backup Quick Action */}
        <button
          onClick={exportDatabaseJson}
          className="hidden items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 sm:flex"
          title="Backup JSON Database"
        >
          <Database className="h-4 w-4 text-blue-500" />
          <span className="hidden xl:inline">Backup</span>
        </button>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
          title="Toggle Light / Dark Mode"
        >
          {settings.theme === 'dark' ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-slate-700" />}
        </button>

        {/* System Settings Button */}
        <button
          onClick={onOpenSettings}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
          title="PAA System Settings & Role Security Passwords"
        >
          <Settings className="h-4 w-4 text-slate-600 dark:text-slate-300 hover:text-emerald-500" />
        </button>

        {/* Notification Bell & Drawer */}
        <div className="relative">
          <button
            onClick={() => setShowNotificationDrawer(!showNotificationDrawer)}
            className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            title="System Audit Logs & Alerts"
          >
            <Bell className="h-4 w-4" />
            {openTicketsCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow">
                {openTicketsCount}
              </span>
            )}
          </button>

          {/* Notification Popup Drawer */}
          {showNotificationDrawer && (
            <div className="absolute right-0 top-11 z-50 w-80 sm:w-96 rounded-xl border border-slate-200 bg-white p-4 shadow-xl dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-emerald-500" />
                  <span className="font-semibold text-slate-800 text-sm dark:text-white">PAA Sentinel Activity Feed</span>
                </div>
                <button onClick={() => setShowNotificationDrawer(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-3 max-h-80 space-y-2.5 overflow-y-auto pr-1">
                {auditLogs.slice(0, 6).map((log) => (
                  <div
                    key={log.id}
                    className="flex items-start gap-2.5 rounded-lg border border-slate-100 bg-slate-50 p-2.5 text-xs dark:border-slate-800 dark:bg-slate-800/60"
                  >
                    <div className="mt-0.5">
                      {log.type === 'danger' ? (
                        <AlertTriangle className="h-4 w-4 text-rose-500" />
                      ) : log.type === 'warning' ? (
                        <AlertTriangle className="h-4 w-4 text-amber-500" />
                      ) : (
                        <Activity className="h-4 w-4 text-emerald-500" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between font-semibold text-slate-800 dark:text-slate-200">
                        <span>{log.action}</span>
                        <span className="text-[10px] font-normal text-slate-400">{log.timestamp.split(' ')[1]}</span>
                      </div>
                      <p className="mt-0.5 text-slate-600 dark:text-slate-300">{log.details}</p>
                      <span className="mt-1 block text-[10px] font-medium text-slate-400">Actor: {log.actor}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User Login & Logout Controls */}
        <div className="relative flex items-center gap-2">
          {isLoggedIn ? (
            <>
              <button
                onClick={() => setShowLoginModal(true)}
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 px-3 py-1.5 text-xs font-bold text-white shadow-md shadow-emerald-500/20 hover:from-emerald-500 hover:to-teal-600 transition"
                title="Click to view user credentials or switch login"
              >
                <User className="h-4 w-4" />
                <div className="flex flex-col text-left leading-tight">
                  <span className="text-[11px] font-extrabold flex items-center gap-1">
                    <span>{roleUsernames[userRole]}</span>
                    <span className="text-[9px] font-normal opacity-80">({userRole})</span>
                  </span>
                  <span className="text-[9px] font-semibold text-emerald-100 opacity-90">Account & Passwords</span>
                </div>
              </button>

              <button
                onClick={() => setShowRoleMenu(!showRoleMenu)}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                title="Switch User Role"
              >
                <ChevronDown className="h-4 w-4 text-slate-500" />
              </button>

              <button
                onClick={logout}
                className="flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-700 hover:bg-rose-100 dark:border-rose-900/50 dark:bg-rose-950/50 dark:text-rose-400 transition"
                title="Log Out of Active Session"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Log Out</span>
              </button>
            </>
          ) : (
            <button
              onClick={() => setShowLoginModal(true)}
              className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-1.5 text-xs font-bold text-white shadow-md shadow-emerald-500/20 hover:bg-emerald-500 transition"
              title="Click to Log In"
            >
              <LogIn className="h-4 w-4" />
              <span>Log In</span>
            </button>
          )}

          {showRoleMenu && isLoggedIn && (
            <div className="absolute right-0 top-11 z-50 w-48 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl dark:border-slate-800 dark:bg-slate-900">
              <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">Select Active Role</div>
              {roles.map((r) => (
                <button
                  key={r}
                  onClick={() => {
                    setShowRoleMenu(false);
                    if (r !== userRole) {
                      setTargetRoleForAuth(r);
                    }
                  }}
                  className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-xs font-medium transition ${
                    userRole === r
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 font-bold'
                      : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="flex flex-col text-left">
                    <span>{r}</span>
                    <span className="text-[9px] font-mono text-slate-400">{roleUsernames[r]}</span>
                  </div>
                  {userRole === r && <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>}
                </button>
              ))}
              <div className="mt-1 border-t border-slate-100 pt-1 dark:border-slate-800">
                <button
                  onClick={() => {
                    setShowRoleMenu(false);
                    setShowLoginModal(true);
                  }}
                  className="flex w-full items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-bold text-emerald-600 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/50"
                >
                  <KeyRound className="h-3.5 w-3.5" />
                  <span>View All Login Passwords</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <RolePasswordModal
        isOpen={!!targetRoleForAuth}
        targetRole={targetRoleForAuth}
        onClose={() => setTargetRoleForAuth(null)}
      />

      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
      />

      <ProcurementFormModal
        isOpen={showProcurementModal}
        onClose={() => setShowProcurementModal(false)}
      />

      <InternalRequisitionFormModal
        isOpen={showRequisitionModal}
        onClose={() => setShowRequisitionModal(false)}
      />
    </header>
  );
};

