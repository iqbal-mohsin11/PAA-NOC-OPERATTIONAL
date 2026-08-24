import React, { useState } from 'react';
import { useInventory } from '../context/InventoryContext';
import { AddDepartmentModal } from './AddDepartmentModal';
import { AddBrandModal } from './AddBrandModal';
import { AddVendorModal } from './AddVendorModal';
import { AddCategoryModal } from './AddCategoryModal';
import {
  Settings,
  Download,
  Upload,
  Moon,
  Sun,
  Building,
  Building2,
  Database,
  X,
  ShieldCheck,
  RefreshCw,
  Server,
  Plus,
  Tag,
  Store,
  Layers,
  Lock,
  Key,
  Eye,
  EyeOff,
  CheckCircle2,
  Wrench,
  ShieldAlert,
  Trash2,
  RotateCcw,
  Search,
  ExternalLink,
  AlertTriangle,
} from 'lucide-react';

interface SettingsModalProps {
  onClose: () => void;
  onNavigateTab?: (tab: string) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ onClose, onNavigateTab }) => {
  const {
    settings,
    updateSettings,
    theme,
    toggleTheme,
    exportDatabaseJson,
    importDatabaseJson,
    resetToDefaultSeed,
    allDepartments,
    allBrands,
    allVendors,
    allCategories,
    rolePasswords,
    updateRolePasswords,
    assets,
    restoreAsset,
    deletePermanently,
  } = useInventory();

  const [orgName, setOrgName] = useState(settings.organizationName);
  const [airportName, setAirportName] = useState(settings.airportName);
  const [code, setCode] = useState(settings.airportCode);

  // Deleted Data Asset Entries State
  const [showDeletedList, setShowDeletedList] = useState(false);
  const [deletedSearch, setDeletedSearch] = useState('');
  const [deletedActionMsg, setDeletedActionMsg] = useState<string | null>(null);

  const deletedAssets = assets.filter((a) => a.isRemoved);

  const filteredDeletedAssets = deletedAssets.filter((item) => {
    if (!deletedSearch.trim()) return true;
    const q = deletedSearch.toLowerCase();
    return (
      item.name.toLowerCase().includes(q) ||
      item.id.toLowerCase().includes(q) ||
      item.department.toLowerCase().includes(q) ||
      (item.removalDetails?.reason || '').toLowerCase().includes(q) ||
      (item.removalDetails?.removedBy || '').toLowerCase().includes(q)
    );
  });

  const handleRestoreAll = () => {
    if (deletedAssets.length === 0) return;
    if (confirm(`Restore all ${deletedAssets.length} soft-deleted asset entries back to active inventory?`)) {
      deletedAssets.forEach((item) => restoreAsset(item.id));
      setDeletedActionMsg(`All ${deletedAssets.length} deleted asset entries restored successfully!`);
      setTimeout(() => setDeletedActionMsg(null), 3000);
    }
  };

  const handlePurgeAll = () => {
    if (deletedAssets.length === 0) return;
    if (confirm(`CRITICAL WARNING: Permanently hard-delete all ${deletedAssets.length} soft-deleted asset records? This action CANNOT be undone.`)) {
      deletedAssets.forEach((item) => deletePermanently(item.id));
      setDeletedActionMsg(`All soft-deleted records purged permanently.`);
      setTimeout(() => setDeletedActionMsg(null), 3000);
    }
  };

  // Role Passwords State
  const [adminPass, setAdminPass] = useState(rolePasswords?.Administrator || 'admin123');
  const [techPass, setTechPass] = useState(rolePasswords?.Technician || 'tech123');
  const [viewerPass, setViewerPass] = useState(rolePasswords?.Viewer || 'viewer123');
  const [showAdminPass, setShowAdminPass] = useState(false);
  const [showTechPass, setShowTechPass] = useState(false);
  const [showViewerPass, setShowViewerPass] = useState(false);
  const [passSaveMsg, setPassSaveMsg] = useState<string | null>(null);

  const [isAddDeptOpen, setIsAddDeptOpen] = useState(false);
  const [isAddBrandOpen, setIsAddBrandOpen] = useState(false);
  const [isAddVendorOpen, setIsAddVendorOpen] = useState(false);
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      organizationName: orgName,
      airportName: airportName,
      airportCode: code,
    });
    onClose();
  };

  const handleSavePasswords = () => {
    updateRolePasswords({
      Administrator: adminPass,
      Technician: techPass,
      Viewer: viewerPass,
    });
    setPassSaveMsg('Role security passwords updated successfully!');
    setTimeout(() => setPassSaveMsg(null), 3000);
  };

  const handleImportJsonFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const content = evt.target?.result as string;
      if (content) {
        importDatabaseJson(content);
        alert('Database restored successfully from backup JSON file!');
        onClose();
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 my-auto">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-emerald-500" />
            <h3 className="font-bold text-slate-900 text-sm dark:text-white">PAA System Configuration & Backup</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSaveSettings} className="mt-4 space-y-4 text-xs">
          {/* Organization Settings */}
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/40">
            <h4 className="font-bold text-slate-800 dark:text-slate-200 mb-3 flex items-center gap-2">
              <Building className="h-4 w-4 text-emerald-500" />
              <span>Airport Authority Identity</span>
            </h4>

            <div className="space-y-3">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Organization Name</label>
                <input
                  type="text"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white p-2 font-bold dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Airport Name</label>
                  <input
                    type="text"
                    value={airportName}
                    onChange={(e) => setAirportName(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white p-2 font-bold dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">IATA Code</label>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white p-2 font-bold uppercase dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Active Directory Sync Status */}
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/40">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <RefreshCw className="h-4 w-4 text-emerald-500" />
                <span>Active Directory (AD) LDAPS Sync</span>
              </h4>
              <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                Connected
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Domain: <code className="font-mono text-emerald-600 dark:text-emerald-400">paa.gov.pk</code> | Endpoint: <code className="font-mono">10.100.0.5:636</code>
            </p>
            <div className="mt-2.5 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">Interval: Every 15 Minutes | 6 Delta Items Discovered</span>
            </div>
          </div>

          {/* Theme Switcher */}
          <div className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/40">
            <div>
              <span className="font-bold text-slate-800 dark:text-slate-200">Interface Theme</span>
              <p className="text-[11px] text-slate-400">Toggle dark NOC dashboard or clean light mode</p>
            </div>

            <button
              type="button"
              onClick={toggleTheme}
              className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 font-bold text-slate-800 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            >
              {theme === 'dark' ? (
                <>
                  <Moon className="h-4 w-4 text-emerald-400" />
                  <span>Dark NOC Mode</span>
                </>
              ) : (
                <>
                  <Sun className="h-4 w-4 text-amber-500" />
                  <span>Light Mode</span>
                </>
              )}
            </button>
          </div>

          {/* Departments Directory Management */}
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/40">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2 text-xs">
                <Building2 className="h-4 w-4 text-emerald-500" />
                <span>Organizational Departments Directory ({allDepartments.length})</span>
              </h4>
              <button
                type="button"
                onClick={() => setIsAddDeptOpen(true)}
                className="flex items-center gap-1 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-500 shadow-sm transition"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Department</span>
              </button>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-2">
              Departments configured in the directory for asset allocation, filtering, and ticket routing.
            </p>
            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-1">
              {allDepartments.map((dept) => (
                <span
                  key={dept}
                  className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 shadow-2xs dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                >
                  {dept}
                </span>
              ))}
            </div>
          </div>

          {/* Brands Directory Management */}
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/40">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2 text-xs">
                <Tag className="h-4 w-4 text-blue-500" />
                <span>Hardware Brands Directory ({allBrands.length})</span>
              </h4>
              <button
                type="button"
                onClick={() => setIsAddBrandOpen(true)}
                className="flex items-center gap-1 rounded-xl bg-blue-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-blue-500 shadow-sm transition"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Brand</span>
              </button>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-2">
              Hardware manufacturers and equipment brands registered across system assets.
            </p>
            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-1">
              {allBrands.map((b) => (
                <span
                  key={b}
                  className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 shadow-2xs dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                >
                  {b}
                </span>
              ))}
            </div>
          </div>

          {/* Vendors Directory Management */}
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/40">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2 text-xs">
                <Store className="h-4 w-4 text-purple-500" />
                <span>Supplier Vendors Directory ({allVendors.length})</span>
              </h4>
              <button
                type="button"
                onClick={() => setIsAddVendorOpen(true)}
                className="flex items-center gap-1 rounded-xl bg-purple-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-purple-500 shadow-sm transition"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Vendor</span>
              </button>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-2">
              Authorized IT contractors, suppliers, and vendor companies.
            </p>
            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-1">
              {allVendors.map((v) => (
                <span
                  key={v}
                  className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 shadow-2xs dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                >
                  {v}
                </span>
              ))}
            </div>
          </div>

          {/* Device Categories Directory Management */}
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/40">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2 text-xs">
                <Layers className="h-4 w-4 text-amber-500" />
                <span>Device Categories Directory ({allCategories.length})</span>
              </h4>
              <button
                type="button"
                onClick={() => setIsAddCategoryOpen(true)}
                className="flex items-center gap-1 rounded-xl bg-amber-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-amber-500 shadow-sm transition"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Category</span>
              </button>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-2">
              Registered asset categories across IT infrastructure (e.g., Keyboard, Mouse, Network Switch, Printers).
            </p>
            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-1">
              {allCategories.map((c) => (
                <span
                  key={c}
                  className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 shadow-2xs dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                >
                  {c}
                </span>
              ))}
            </div>
          </div>

          {/* Role Access Passwords & Rights Management */}
          <div className="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-4 dark:border-rose-500/30 dark:bg-rose-950/20 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-rose-700 dark:text-rose-300 flex items-center gap-2 text-xs">
                <ShieldCheck className="h-4 w-4 text-rose-500" />
                <span>Access Rights & Security Passwords</span>
              </h4>
              <button
                type="button"
                onClick={handleSavePasswords}
                className="flex items-center gap-1 rounded-xl bg-rose-600 px-3 py-1 text-xs font-bold text-white hover:bg-rose-500 shadow-sm transition"
              >
                <Key className="h-3.5 w-3.5" />
                <span>Save Passwords</span>
              </button>
            </div>

            {passSaveMsg && (
              <div className="flex items-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-2 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                <span>{passSaveMsg}</span>
              </div>
            )}

            <p className="text-[11px] text-slate-600 dark:text-slate-300">
              Set or update security passcodes required when switching session roles in the top header menu.
            </p>

            {/* Role Passwords Inputs Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 pt-1">
              {/* Administrator */}
              <div className="rounded-xl border border-rose-200 bg-white p-2.5 dark:border-rose-900/40 dark:bg-slate-900">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-rose-600 dark:text-rose-400 text-[11px] flex items-center gap-1">
                    <ShieldAlert className="h-3.5 w-3.5" />
                    Administrator
                  </span>
                  <span className="text-[9px] font-semibold text-rose-500 bg-rose-50 px-1.5 py-0.5 rounded-full dark:bg-rose-950/50">
                    Full Control
                  </span>
                </div>
                <div className="relative mt-1">
                  <input
                    type={showAdminPass ? 'text' : 'password'}
                    value={adminPass}
                    onChange={(e) => setAdminPass(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 pl-2 pr-7 py-1.5 text-xs font-mono font-bold text-slate-800 outline-none focus:border-rose-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                  />
                  <button
                    type="button"
                    onClick={() => setShowAdminPass(!showAdminPass)}
                    className="absolute right-2 top-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    {showAdminPass ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </button>
                </div>
                <p className="text-[9px] text-slate-400 mt-1 leading-tight">
                  Rights: Add/Edit/Delete Assets, Manage Users/Passwords, Restore Backup, Full Directory Edit.
                </p>
              </div>

              {/* Technician */}
              <div className="rounded-xl border border-amber-200 bg-white p-2.5 dark:border-amber-900/40 dark:bg-slate-900">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-amber-600 dark:text-amber-400 text-[11px] flex items-center gap-1">
                    <Wrench className="h-3.5 w-3.5" />
                    Technician
                  </span>
                  <span className="text-[9px] font-semibold text-amber-500 bg-amber-50 px-1.5 py-0.5 rounded-full dark:bg-amber-950/50">
                    Operations
                  </span>
                </div>
                <div className="relative mt-1">
                  <input
                    type={showTechPass ? 'text' : 'password'}
                    value={techPass}
                    onChange={(e) => setTechPass(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 pl-2 pr-7 py-1.5 text-xs font-mono font-bold text-slate-800 outline-none focus:border-amber-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                  />
                  <button
                    type="button"
                    onClick={() => setShowTechPass(!showTechPass)}
                    className="absolute right-2 top-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    {showTechPass ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </button>
                </div>
                <p className="text-[9px] text-slate-400 mt-1 leading-tight">
                  Rights: Add/Edit Assets, Update Status, Tickets, AD Sync, Printer Maintenance.
                </p>
              </div>

              {/* Viewer */}
              <div className="rounded-xl border border-blue-200 bg-white p-2.5 dark:border-blue-900/40 dark:bg-slate-900">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-blue-600 dark:text-blue-400 text-[11px] flex items-center gap-1">
                    <Eye className="h-3.5 w-3.5" />
                    Viewer
                  </span>
                  <span className="text-[9px] font-semibold text-blue-500 bg-blue-50 px-1.5 py-0.5 rounded-full dark:bg-blue-950/50">
                    Read-Only
                  </span>
                </div>
                <div className="relative mt-1">
                  <input
                    type={showViewerPass ? 'text' : 'password'}
                    value={viewerPass}
                    onChange={(e) => setViewerPass(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 pl-2 pr-7 py-1.5 text-xs font-mono font-bold text-slate-800 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                  />
                  <button
                    type="button"
                    onClick={() => setShowViewerPass(!showViewerPass)}
                    className="absolute right-2 top-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    {showViewerPass ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </button>
                </div>
                <p className="text-[9px] text-slate-400 mt-1 leading-tight">
                  Rights: View Asset Directory, Infrastructure Metrics, Reports & NOC Alerts.
                </p>
              </div>
            </div>
          </div>

          {/* Deleted Data Asset Entries Management */}
          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4 dark:border-amber-500/30 dark:bg-amber-950/20 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Trash2 className="h-4 w-4 text-amber-500" />
                <h4 className="font-bold text-amber-800 dark:text-amber-300 text-xs">
                  Deleted Data Asset Entries Directory
                </h4>
                <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-extrabold text-amber-700 dark:text-amber-300">
                  {deletedAssets.length} Soft-Deleted
                </span>
              </div>

              <div className="flex items-center gap-2">
                {onNavigateTab && (
                  <button
                    type="button"
                    onClick={() => {
                      onNavigateTab('removed');
                      onClose();
                    }}
                    className="flex items-center gap-1 rounded-xl border border-amber-300 bg-amber-100 px-2.5 py-1 text-[11px] font-bold text-amber-800 hover:bg-amber-200 dark:border-amber-800 dark:bg-amber-900/60 dark:text-amber-200 transition"
                    title="Open Full Removed Assets Archive Page"
                  >
                    <ExternalLink className="h-3 w-3" />
                    <span>View Archive</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setShowDeletedList(!showDeletedList)}
                  className="flex items-center gap-1 rounded-xl bg-amber-600 px-3 py-1 text-xs font-bold text-white hover:bg-amber-500 shadow-sm transition"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>{showDeletedList ? 'Hide Deleted Entries' : 'Manage Deleted Entries'}</span>
                </button>
              </div>
            </div>

            <p className="text-[11px] text-slate-600 dark:text-slate-300">
              Audit-compliant archive containing all soft-deleted assets (Scrap, BER, Transfer, Disposed, Lost). You can restore individual or bulk deleted entries, or permanently purge them.
            </p>

            {deletedActionMsg && (
              <div className="flex items-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-2 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                <span>{deletedActionMsg}</span>
              </div>
            )}

            {showDeletedList && (
              <div className="mt-3 rounded-xl border border-amber-200 bg-white p-3 dark:border-amber-900/40 dark:bg-slate-900 space-y-3 animate-fadeIn">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search deleted entries by ID, name, officer..."
                      value={deletedSearch}
                      onChange={(e) => setDeletedSearch(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 pl-8 pr-2 py-1 text-xs outline-none focus:border-amber-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                    />
                  </div>

                  {deletedAssets.length > 0 && (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleRestoreAll}
                        className="flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-emerald-500"
                      >
                        <RotateCcw className="h-3 w-3" />
                        <span>Restore All ({deletedAssets.length})</span>
                      </button>

                      <button
                        type="button"
                        onClick={handlePurgeAll}
                        className="flex items-center gap-1 rounded-lg bg-rose-600 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-rose-500"
                      >
                        <Trash2 className="h-3 w-3" />
                        <span>Purge All</span>
                      </button>
                    </div>
                  )}
                </div>

                {filteredDeletedAssets.length === 0 ? (
                  <div className="py-6 text-center text-xs text-slate-400">
                    {deletedAssets.length === 0
                      ? 'No soft-deleted asset entries present in system memory.'
                      : 'No deleted entries match search query.'}
                  </div>
                ) : (
                  <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                    {filteredDeletedAssets.map((item) => (
                      <div
                        key={item.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-lg border border-slate-100 bg-slate-50/80 p-2.5 dark:border-slate-800 dark:bg-slate-800/60 text-xs"
                      >
                        <div>
                          <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
                            <span className="font-mono text-[11px] text-amber-600 dark:text-amber-400">
                              {item.id}
                            </span>
                            <span>{item.name}</span>
                            <span className="rounded-full bg-slate-200 px-2 py-0.2 text-[9px] font-extrabold text-slate-700 dark:bg-slate-700 dark:text-slate-300">
                              {item.department}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-500 mt-0.5 flex flex-wrap items-center gap-2">
                            <span>Reason: <strong className="text-rose-600 dark:text-rose-400">{item.removalDetails?.reason || 'Scrap'}</strong></span>
                            <span>•</span>
                            <span>By: {item.removalDetails?.removedBy || 'N/A'}</span>
                            <span>•</span>
                            <span>Date: {item.removalDetails?.date || 'N/A'}</span>
                          </div>
                          {item.removalDetails?.remarks && (
                            <p className="text-[10px] text-slate-400 italic mt-0.5">
                              "{item.removalDetails.remarks}"
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                          <button
                            type="button"
                            onClick={() => {
                              restoreAsset(item.id);
                              setDeletedActionMsg(`Asset ${item.id} restored to inventory!`);
                              setTimeout(() => setDeletedActionMsg(null), 3000);
                            }}
                            className="flex items-center gap-1 rounded-md bg-emerald-600 px-2 py-1 text-[10px] font-bold text-white hover:bg-emerald-500 shadow-2xs"
                          >
                            <RotateCcw className="h-3 w-3" />
                            <span>Restore</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              if (confirm(`Permanently delete record ${item.id}? This CANNOT be undone.`)) {
                                deletePermanently(item.id);
                                setDeletedActionMsg(`Asset ${item.id} permanently purged.`);
                                setTimeout(() => setDeletedActionMsg(null), 3000);
                              }
                            }}
                            className="flex items-center gap-1 rounded-md border border-rose-200 bg-rose-50 px-2 py-1 text-[10px] font-bold text-rose-700 hover:bg-rose-100 dark:border-rose-800 dark:bg-rose-950/60 dark:text-rose-300 shadow-2xs"
                          >
                            <Trash2 className="h-3 w-3" />
                            <span>Purge</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Database Backup & Restore */}
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/40">
            <h4 className="font-bold text-slate-800 dark:text-slate-200 mb-2 flex items-center gap-2">
              <Database className="h-4 w-4 text-cyan-500" />
              <span>Database Backup & Restore</span>
            </h4>
            <p className="text-[11px] text-slate-500 mb-3">
              Export entire local state database (Assets, Tickets, Maintenance, Logs) to JSON file or restore from a backup.
            </p>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={exportDatabaseJson}
                className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 font-bold text-white hover:bg-emerald-500"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Backup JSON Database</span>
              </button>

              <label className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 font-bold text-slate-700 hover:bg-slate-100 cursor-pointer dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
                <Upload className="h-3.5 w-3.5 text-cyan-500" />
                <span>Restore JSON Backup</span>
                <input type="file" accept=".json" onChange={handleImportJsonFile} className="hidden" />
              </label>

              <button
                type="button"
                onClick={() => {
                  if (confirm('Reset database to default seed data? Custom modifications will be lost.')) {
                    resetToDefaultSeed();
                    onClose();
                  }
                }}
                className="ml-auto text-[11px] font-bold text-rose-500 hover:underline"
              >
                Reset Seed Data
              </button>
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 font-bold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
            >
              Cancel
            </button>
            <button type="submit" className="rounded-xl bg-emerald-600 px-5 py-2 font-bold text-white hover:bg-emerald-500">
              Save Settings
            </button>
          </div>
        </form>
      </div>

      <AddDepartmentModal isOpen={isAddDeptOpen} onClose={() => setIsAddDeptOpen(false)} />
      <AddBrandModal isOpen={isAddBrandOpen} onClose={() => setIsAddBrandOpen(false)} />
      <AddVendorModal isOpen={isAddVendorOpen} onClose={() => setIsAddVendorOpen(false)} />
      <AddCategoryModal isOpen={isAddCategoryOpen} onClose={() => setIsAddCategoryOpen(false)} />
    </div>
  );
};
