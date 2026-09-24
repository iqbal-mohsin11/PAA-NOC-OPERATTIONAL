import React, { useState } from 'react';
import { useInventory } from '../context/InventoryContext';
import { ProcurementFormModal } from './ProcurementFormModal';
import { InternalRequisitionFormModal } from './InternalRequisitionFormModal';
import { LogisticsReceivingModal } from './LogisticsReceivingModal';
import { PCWebFileModal } from './PCWebFileModal';
import { DesktopAppSetupModal } from './DesktopAppSetupModal';
import { PWAInstallButton } from './PWAInstallButton';
import { OfflineManagerModal } from './OfflineManagerModal';
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
  ShoppingCart,
  Store,
  Laptop,
  PackageCheck,
  Monitor,
  Zap,
  BatteryCharging,
  PenLine,
  ShieldCheck,
  Eye,
  UserPlus,
  Menu,
  Smartphone,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { UserRole } from '../types/inventory';
import { RolePasswordModal } from './RolePasswordModal';
import { LoginModal } from './LoginModal';
import { AutoFetchADModal } from './AutoFetchADModal';
import { CreateUserModal } from './CreateUserModal';
import { getUPSBatteryAlerts } from '../utils/upsBatteryAlerts';

interface HeaderProps {
  onOpenSettings: () => void;
  onOpenExcelImport?: () => void;
  onOpenImportExcel?: () => void;
  onSelectAsset?: (asset: any) => void;
  onNavigateTab?: (tab: string) => void;
  onToggleMobileDrawer?: () => void;
  onOpenMobileConnect?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenSettings,
  onNavigateTab,
  onToggleMobileDrawer,
  onOpenMobileConnect,
}) => {
  const {
    settings,
    userRole,
    currentUser,
    userAccounts,
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
    dbStatus,
    refreshDbData,
    isOnline,
    pendingOfflineCount,
    lastBackupTime,
  } = useInventory();

  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showNotificationDrawer, setShowNotificationDrawer] = useState(false);
  const [targetRoleForAuth, setTargetRoleForAuth] = useState<UserRole | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showFormsMenu, setShowFormsMenu] = useState(false);
  const [showProcurementModal, setShowProcurementModal] = useState(false);
  const [procurementInitialData, setProcurementInitialData] = useState<any>(undefined);
  const [showRequisitionModal, setShowRequisitionModal] = useState(false);
  const [showLogisticsModal, setShowLogisticsModal] = useState(false);
  const [showPCWebFileModal, setShowPCWebFileModal] = useState(false);
  const [showDesktopAppModal, setShowDesktopAppModal] = useState(false);
  const [showAutoFetchADModal, setShowAutoFetchADModal] = useState(false);
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [showOfflineModal, setShowOfflineModal] = useState(false);
  const [isMobileSearchExpanded, setIsMobileSearchExpanded] = useState(false);

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
  const upsBatteryAlerts = getUPSBatteryAlerts(activeAssets, now, 30);
  const upsBatteryDueCount = upsBatteryAlerts.length;
  const totalNocAlertsCount = expiringWarrantyCount + lowTonerCount + openTicketsCount + upsBatteryDueCount;

  const roles: UserRole[] = ['Administrator', 'Technician', 'Viewer'];

  return (
    <header className="sticky top-0 z-30 w-full border-b border-slate-200 bg-white/95 backdrop-blur transition-colors dark:border-slate-800 dark:bg-slate-900/95 dark:text-slate-100 shadow-sm">
      {/* Tier 1: Main Top Header (Brand, Search & Account Utilities) */}
      <div className="flex h-14 w-full items-center justify-between px-3 sm:px-4 border-b border-slate-100 dark:border-slate-800/60 gap-2">
        {/* Mobile Hamburger & Brand Identity */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Mobile Hamburger Drawer Trigger */}
          <button
            onClick={onToggleMobileDrawer}
            className="flex md:hidden h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 shrink-0 transition"
            title="Open Navigation Menu"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-600 via-teal-700 to-cyan-800 text-white shadow-md shadow-emerald-500/20 shrink-0">
            <Shield className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <h1 className="font-bold text-slate-900 tracking-tight text-xs sm:text-base dark:text-white truncate max-w-[130px] sm:max-w-none">
                {settings.orgName}
              </h1>
              <span className="inline-flex items-center rounded-md bg-emerald-500/10 px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-[11px] font-semibold text-emerald-600 dark:bg-emerald-400/10 dark:text-emerald-400 shrink-0">
                v5.0
              </span>
            </div>
            <p className="hidden text-[11px] text-slate-500 sm:block dark:text-slate-400">
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
              className="w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-4 py-1.5 text-xs font-medium text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-emerald-400 dark:focus:bg-slate-900"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Utility Controls & Login */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Offline & Sync Status Button */}
          <button
            type="button"
            onClick={() => setShowOfflineModal(true)}
            className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 rounded-lg border text-xs font-semibold transition shrink-0 ${
              isOnline
                ? pendingOfflineCount > 0
                  ? 'border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300 shadow-2xs'
                  : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
                : 'border-amber-400 bg-amber-500 text-white font-bold animate-pulse shadow-xs'
            }`}
            title={
              isOnline
                ? pendingOfflineCount > 0
                  ? `${pendingOfflineCount} offline changes queued | Periodic crash backup: ${lastBackupTime || 'Active'}`
                  : `100% Offline Ready | Crash Backup: ${lastBackupTime || 'Guarded'}`
                : `Working in Offline Mode | Continuous storage backup: ${lastBackupTime || 'Active'}`
            }
          >
            {isOnline ? (
              <Wifi className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            ) : (
              <WifiOff className="h-3.5 w-3.5 text-white shrink-0" />
            )}
            <span className="hidden xl:inline text-[11px]">
              {!isOnline
                ? 'Offline'
                : pendingOfflineCount > 0
                ? `${pendingOfflineCount} Queued`
                : 'Offline Ready'}
            </span>
            <span
              className={`h-2 w-2 rounded-full ${
                !isOnline
                  ? 'bg-white'
                  : pendingOfflineCount > 0
                  ? 'bg-amber-500 animate-ping'
                  : 'bg-emerald-500'
              }`}
            />
          </button>

          {/* PWA Install Button */}
          <PWAInstallButton />

          {/* MongoDB Server Status Button */}
          <button
            onClick={() => setShowPCWebFileModal(true)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-semibold transition ${
              dbStatus.isConnected
                ? 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
                : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
            }`}
            title={`MongoDB Server: ${dbStatus.isConnected ? 'Connected (' + dbStatus.host + ':' + dbStatus.port + '/' + dbStatus.dbName + ')' : 'Local Storage Mode (Click for PC MongoDB Server Setup)'}`}
          >
            <Database className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
            <span className="hidden lg:inline text-[11px]">
              {dbStatus.isConnected ? 'MongoDB Active' : 'PC Server / DB'}
            </span>
            <span
              className={`h-2 w-2 rounded-full ${
                dbStatus.isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'
              }`}
            />
          </button>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            title="Toggle Light / Dark Mode"
          >
            {settings.theme === 'dark' ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-slate-700" />}
          </button>

          {/* Auto Fetch AD Button */}
          <button
            onClick={() => setShowAutoFetchADModal(true)}
            className="flex items-center gap-1.5 rounded-lg border border-teal-200 bg-teal-50/90 px-2.5 py-1.5 text-xs font-bold text-teal-700 transition hover:bg-teal-100 dark:border-teal-800 dark:bg-teal-950/40 dark:text-teal-300 dark:hover:bg-teal-900/60 shadow-2xs"
            title="Auto Fetch Computer Objects from Active Directory (DC01.paa.gov.pk)"
          >
            <Zap className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
            <span className="hidden md:inline">Auto Fetch AD</span>
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          </button>

          {/* UPS & Power Fleet Quick Nav Button */}
          {onNavigateTab && (
            <button
              onClick={() => onNavigateTab('ups')}
              className="flex items-center gap-1.5 rounded-lg border border-amber-300 bg-amber-50/90 px-2.5 py-1.5 text-xs font-bold text-amber-800 transition hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300 dark:hover:bg-amber-900/60 shadow-2xs"
              title="Open UPS & kVA Power Infrastructure Fleet"
            >
              <BatteryCharging className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
              <span className="hidden md:inline">UPS Fleet</span>
            </button>
          )}

          {/* Desktop App (.exe) & Shortcut Setup */}
          <button
            onClick={() => setShowDesktopAppModal(true)}
            className="flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50/80 px-2.5 py-1.5 text-xs font-bold text-indigo-700 transition hover:bg-indigo-100 dark:border-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-300 dark:hover:bg-indigo-900/60 shadow-2xs"
            title="Make Windows .exe File & Install Desktop Shortcut"
          >
            <Monitor className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            <span className="hidden sm:inline">Desktop App (.exe)</span>
          </button>

          {/* Add User / Admin Quick Button */}
          <button
            onClick={() => setShowCreateUserModal(true)}
            className="flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50/90 px-2.5 py-1.5 text-xs font-bold text-rose-700 transition hover:bg-rose-100 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300 dark:hover:bg-rose-900/60 shadow-2xs"
            title="Create New User / Administrator Account"
          >
            <UserPlus className="h-3.5 w-3.5 text-rose-600 dark:text-rose-400" />
            <span className="hidden sm:inline">+ Add User</span>
          </button>

          {/* Open on Mobile / Smartphone QR */}
          <button
            onClick={onOpenMobileConnect}
            className="flex items-center gap-1.5 rounded-lg border border-emerald-300 bg-emerald-50/90 px-2 sm:px-2.5 py-1.5 text-xs font-bold text-emerald-800 transition hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 dark:hover:bg-emerald-900/60 shadow-2xs shrink-0"
            title="Open on Mobile / Smartphone (Scan QR)"
          >
            <Smartphone className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
            <span className="hidden sm:inline">Open on Mobile</span>
          </button>

          {/* Mobile Search Toggle */}
          <button
            onClick={() => setIsMobileSearchExpanded(!isMobileSearchExpanded)}
            className="flex md:hidden h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 shrink-0"
            title="Search Assets"
          >
            <Search className="h-4 w-4" />
          </button>

          {/* System Settings Button */}
          <button
            onClick={onOpenSettings}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
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
            {totalNocAlertsCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow">
                {totalNocAlertsCount}
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

              {/* Automated UPS Battery Change Alert Banner */}
              {upsBatteryDueCount > 0 && (
                <div className="mt-2.5 rounded-xl border border-amber-300 bg-amber-50/90 p-2.5 dark:border-amber-700 dark:bg-amber-950/40">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 font-bold text-[11px] text-amber-900 dark:text-amber-200">
                      <BatteryCharging className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
                      <span>{upsBatteryDueCount} UPS Batteries Due (&le;30 Days)</span>
                    </div>
                    <button
                      onClick={() => {
                        setShowNotificationDrawer(false);
                        onNavigateTab?.('noc_alerts');
                      }}
                      className="text-[10px] font-bold text-amber-700 underline dark:text-amber-300 hover:text-amber-900"
                    >
                      View in NOC
                    </button>
                  </div>
                  <div className="mt-1.5 space-y-1">
                    {upsBatteryAlerts.slice(0, 3).map((alert) => (
                      <div
                        key={alert.id}
                        onClick={() => {
                          setShowNotificationDrawer(false);
                          onNavigateTab?.('ups');
                        }}
                        className="flex items-center justify-between rounded-md bg-white/80 px-2 py-1 text-[10px] cursor-pointer hover:bg-white dark:bg-slate-800/80 dark:hover:bg-slate-800"
                      >
                        <span className="font-bold text-slate-800 dark:text-slate-200">{alert.tagNo} ({alert.roomNo})</span>
                        <span className={alert.isOverdue ? 'font-bold text-rose-600' : 'font-medium text-amber-700 dark:text-amber-400'}>
                          {alert.urgencyLabel}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

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

        {/* User Login, Identity & Access Level Indicator (Write vs. Read-Only) */}
        <div className="relative flex items-center gap-1.5 sm:gap-2">
          {isLoggedIn ? (
            <div className="flex items-center rounded-xl border border-slate-200/90 bg-slate-50/95 p-1 shadow-xs dark:border-slate-800 dark:bg-slate-800/90">
              {/* Active User Card & Access Indicator Button */}
              <button
                onClick={() => setShowLoginModal(true)}
                className="group flex items-center gap-2 rounded-lg px-2.5 py-1 text-xs transition hover:bg-white dark:hover:bg-slate-700/70"
                title={`Active User: ${currentUser?.displayName || currentUser?.username || roleUsernames[userRole]} (${userRole})\nAccess Level: ${userRole === 'Administrator' ? 'Full Write & Admin' : userRole === 'Technician' ? 'Write Data & View Data Only' : 'View Data Only (Read-Only)'}\nClick to view credentials or switch accounts`}
              >
                {/* User Avatar Circle */}
                <div
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-black shadow-2xs ${
                    userRole === 'Administrator'
                      ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300'
                      : userRole === 'Technician'
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300'
                      : 'bg-sky-100 text-sky-800 dark:bg-sky-950/80 dark:text-sky-300'
                  }`}
                >
                  {(currentUser?.username || userRole).charAt(0).toUpperCase()}
                </div>

                {/* Name & Access Level Status Badge */}
                <div className="flex flex-col text-left leading-tight">
                  <div className="flex items-center gap-1.5">
                    <span className="font-extrabold text-slate-900 dark:text-white text-xs max-w-[130px] truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition">
                      {currentUser?.username || roleUsernames[userRole]}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">
                      ({userRole})
                    </span>
                  </div>

                  {/* Access Level Pill: Write Access vs Read-Only */}
                  <div className="mt-0.5 flex items-center gap-1">
                    {userRole === 'Administrator' || userRole === 'Technician' ? (
                      <span className="inline-flex items-center gap-1 rounded bg-emerald-500/15 border border-emerald-500/30 px-1.5 py-0.5 text-[10px] font-extrabold text-emerald-700 dark:text-emerald-300 dark:bg-emerald-950/60">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                        <PenLine className="h-2.5 w-2.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                        <span>Write Access</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded bg-sky-500/15 border border-sky-500/30 px-1.5 py-0.5 text-[10px] font-extrabold text-sky-700 dark:text-sky-300 dark:bg-sky-950/60">
                        <span className="h-1.5 w-1.5 rounded-full bg-sky-500 shrink-0" />
                        <Eye className="h-2.5 w-2.5 shrink-0 text-sky-600 dark:text-sky-400" />
                        <span>Read-Only</span>
                      </span>
                    )}
                  </div>
                </div>
              </button>

              {/* Quick Account Switch Dropdown Trigger */}
              <button
                onClick={() => setShowRoleMenu(!showRoleMenu)}
                className="flex h-7 w-7 items-center justify-center rounded-md text-slate-400 hover:bg-white hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-200 transition"
                title="Switch User Account or Access Level"
              >
                <ChevronDown className="h-3.5 w-3.5" />
              </button>

              {/* Logout Button */}
              <button
                onClick={logout}
                className="flex h-7 items-center gap-1 rounded-md px-2 text-[11px] font-bold text-slate-500 hover:bg-rose-50 hover:text-rose-600 dark:text-slate-400 dark:hover:bg-rose-950/50 dark:hover:text-rose-400 transition"
                title="Log Out of Active Session"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span className="hidden md:inline">Log Out</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 rounded-xl border border-slate-200/90 bg-slate-50/95 p-1 dark:border-slate-800 dark:bg-slate-800/90">
              <span className="inline-flex items-center gap-1 rounded bg-slate-200/70 border border-slate-300/80 px-2 py-1 text-[10px] font-bold text-slate-600 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-300">
                <Eye className="h-3 w-3 shrink-0" />
                <span>Read-Only (Guest)</span>
              </span>
              <button
                onClick={() => setShowLoginModal(true)}
                className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1 text-xs font-bold text-white shadow-sm hover:bg-emerald-500 transition"
                title="Click to Log In"
              >
                <LogIn className="h-3.5 w-3.5" />
                <span>Log In</span>
              </button>
            </div>
          )}

          {showRoleMenu && isLoggedIn && (
            <div className="absolute right-0 top-12 z-50 w-64 rounded-xl border border-slate-200 bg-white p-2 shadow-xl dark:border-slate-800 dark:bg-slate-900">
              <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                User Accounts & Access Levels
              </div>
              <div className="space-y-1 max-h-60 overflow-y-auto">
                {userAccounts.map((account) => {
                  const isAccountActive = currentUser?.username.toLowerCase() === account.username.toLowerCase();
                  const isAccountWrite = account.role === 'Administrator' || account.role === 'Technician';
                  return (
                    <button
                      key={account.id}
                      onClick={() => {
                        setShowRoleMenu(false);
                        setShowLoginModal(true);
                      }}
                      className={`flex w-full items-center justify-between rounded-lg p-2 text-xs font-medium transition ${
                        isAccountActive
                          ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50'
                          : 'text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800/70'
                      }`}
                    >
                      <div className="flex flex-col text-left">
                        <div className="flex items-center gap-1.5">
                          <span className="font-extrabold text-slate-900 dark:text-white">{account.username}</span>
                          <span
                            className={`inline-flex items-center gap-0.5 rounded px-1.5 py-0.2 text-[9px] font-bold border ${
                              isAccountWrite
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
                                : 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-800'
                            }`}
                          >
                            {isAccountWrite ? (
                              <>
                                <PenLine className="h-2 w-2 text-emerald-600 dark:text-emerald-400" />
                                <span>Write Access</span>
                              </>
                            ) : (
                              <>
                                <Eye className="h-2 w-2 text-sky-600 dark:text-sky-400" />
                                <span>Read-Only</span>
                              </>
                            )}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-normal mt-0.5">
                          {account.role} &bull; {account.displayName}
                        </span>
                      </div>
                      {isAccountActive && (
                        <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0 shadow-2xs" />
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="mt-1.5 border-t border-slate-100 pt-1.5 dark:border-slate-800 space-y-1">
                <button
                  onClick={() => {
                    setShowRoleMenu(false);
                    setShowCreateUserModal(true);
                  }}
                  className="flex w-full items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/50"
                >
                  <UserPlus className="h-3.5 w-3.5" />
                  <span>+ Add User / Admin Account</span>
                </button>

                <button
                  onClick={() => {
                    setShowRoleMenu(false);
                    setShowLoginModal(true);
                  }}
                  className="flex w-full items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-bold text-emerald-600 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/50"
                >
                  <KeyRound className="h-3.5 w-3.5" />
                  <span>Switch Account / Change Password</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
      
      {/* Mobile Expanded Search Bar */}
      {isMobileSearchExpanded && (
        <div className="flex md:hidden w-full px-3 py-2 border-b border-slate-100 dark:border-slate-800/60 bg-slate-50/95 dark:bg-slate-800/80 animate-in slide-in-from-top-2 duration-150">
          <div className="relative w-full">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              autoFocus
              placeholder="Search Asset ID, Serial, IP, User..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-8 py-2 text-xs font-medium text-slate-800 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            />
            {searchQuery ? (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="h-4 w-4" />
              </button>
            ) : (
              <button
                onClick={() => setIsMobileSearchExpanded(false)}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      )}

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
        initialData={procurementInitialData}
      />

      <InternalRequisitionFormModal
        isOpen={showRequisitionModal}
        onClose={() => setShowRequisitionModal(false)}
      />

      <LogisticsReceivingModal
        isOpen={showLogisticsModal}
        onClose={() => setShowLogisticsModal(false)}
      />

      <PCWebFileModal
        isOpen={showPCWebFileModal}
        onClose={() => setShowPCWebFileModal(false)}
      />

      <DesktopAppSetupModal
        isOpen={showDesktopAppModal}
        onClose={() => setShowDesktopAppModal(false)}
      />

      <AutoFetchADModal
        isOpen={showAutoFetchADModal}
        onClose={() => setShowAutoFetchADModal(false)}
        onNavigateToADSync={() => onNavigateTab?.('adsync')}
      />

      <CreateUserModal
        isOpen={showCreateUserModal}
        onClose={() => setShowCreateUserModal(false)}
      />

      <OfflineManagerModal
        isOpen={showOfflineModal}
        onClose={() => setShowOfflineModal(false)}
        isOnline={isOnline}
      />
    </header>
  );
};

