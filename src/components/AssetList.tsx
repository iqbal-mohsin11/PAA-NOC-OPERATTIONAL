import React, { useState } from 'react';
import { useInventory } from '../context/InventoryContext';
import { AssetItem, DeviceCategory, AssetStatus } from '../types/inventory';
import { AddDepartmentModal } from './AddDepartmentModal';
import { AddBrandModal } from './AddBrandModal';
import { AddVendorModal } from './AddVendorModal';
import { AddCategoryModal } from './AddCategoryModal';
import { RolePasswordModal } from './RolePasswordModal';
import {
  Search,
  Plus,
  FileSpreadsheet,
  Upload,
  QrCode,
  Building2,
  HardDrive,
  MoreVertical,
  Eye,
  Edit,
  Wrench,
  Trash2,
  Tag,
  Store,
  Layers,
  LayoutGrid,
  List,
  User,
} from 'lucide-react';
import * as XLSX from 'xlsx';

interface AssetListProps {
  onOpenAddModal: () => void;
  onOpenEditModal?: (asset: AssetItem) => void;
  onEditAsset?: (asset: AssetItem) => void;
  onSelectAsset: (asset: AssetItem) => void;
  onOpenExcelImport?: () => void;
  onOpenImportModal?: () => void;
  onOpenLabelModal?: (asset?: AssetItem) => void;
  onOpenSoftRemoveModal?: (asset: AssetItem) => void;
  onSoftRemove?: (asset: AssetItem) => void;
  onOpenIssueModal?: (asset: AssetItem) => void;
}

export const AssetList: React.FC<AssetListProps> = ({
  onOpenAddModal,
  onOpenEditModal,
  onEditAsset,
  onSelectAsset,
  onOpenExcelImport,
  onOpenImportModal,
  onOpenLabelModal,
  onOpenSoftRemoveModal,
  onSoftRemove,
  onOpenIssueModal,
}) => {
  const handleEdit = onOpenEditModal || onEditAsset;
  const handleSoftRemove = onOpenSoftRemoveModal || onSoftRemove;
  const handleImport = onOpenExcelImport || onOpenImportModal;
  const {
    assets,
    searchQuery,
    setSearchQuery,
    selectedDepartment,
    setSelectedDepartment,
    selectedCategory,
    setSelectedCategory,
    selectedStatus,
    setSelectedStatus,
    allDepartments,
    allCategories,
    userRole,
  } = useInventory();

  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [isAddDeptOpen, setIsAddDeptOpen] = useState(false);
  const [isAddBrandOpen, setIsAddBrandOpen] = useState(false);
  const [isAddVendorOpen, setIsAddVendorOpen] = useState(false);
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [authRoleModal, setAuthRoleModal] = useState<'Administrator' | 'Technician' | null>(null);
  const [viewMode, setViewMode] = useState<'cards' | 'table'>(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      return 'cards';
    }
    return 'table';
  });

  const categories: DeviceCategory[] = Array.from(
    new Set([...allCategories, 'Keyboard', 'Mouse', 'Keyboard & Mouse'])
  ) as DeviceCategory[];

  const statuses: AssetStatus[] = ['Active', 'Spare', 'Under Repair', 'Faulty', 'Scrap', 'Lost'];

  const handleProtectedAction = (roleRequired: 'Technician' | 'Administrator', action: () => void) => {
    if (userRole === 'Viewer') {
      setAuthRoleModal(roleRequired);
    } else {
      action();
    }
  };

  // Filter assets
  const filteredAssets = assets.filter((asset) => {
    if (asset.isRemoved) return false;

    // Search query check
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchId = asset.id.toLowerCase().includes(q);
      const matchName = asset.name.toLowerCase().includes(q);
      const matchSerial = asset.serialNumber.toLowerCase().includes(q);
      const matchUser = asset.assignedUser.toLowerCase().includes(q);
      const matchBrand = asset.brand.toLowerCase().includes(q);
      const matchModel = asset.model.toLowerCase().includes(q);
      const matchDept = asset.department.toLowerCase().includes(q);
      const matchTag = asset.assetTag.toLowerCase().includes(q);
      const matchIp = asset.systemSpecs?.ipAddress?.toLowerCase().includes(q) || asset.networkSpecs?.managementIp?.toLowerCase().includes(q);
      if (!matchId && !matchName && !matchSerial && !matchUser && !matchBrand && !matchModel && !matchDept && !matchTag && !matchIp) {
        return false;
      }
    }

    // Dept filter
    if (selectedDepartment !== 'ALL' && asset.department !== selectedDepartment) {
      return false;
    }

    // Category filter
    if (selectedCategory !== 'ALL' && asset.category !== selectedCategory) {
      return false;
    }

    // Status filter
    if (selectedStatus !== 'ALL' && asset.status !== selectedStatus) {
      return false;
    }

    return true;
  });

  // One-click Export to Excel using SheetJS XLSX
  const exportToExcel = () => {
    const exportData = filteredAssets.map((asset) => ({
      'Asset ID': asset.id,
      'Device Name': asset.name,
      Category: asset.category,
      Department: asset.department,
      'Assigned User': asset.assignedUser,
      'PAA Record #': asset.paaNumber,
      Vendor: asset.vendorCompany,
      Brand: asset.brand,
      Model: asset.model,
      'Serial Number': asset.serialNumber,
      'Asset Tag': asset.assetTag,
      Location: `${asset.location.building}, ${asset.location.floor}, ${asset.location.room}`,
      Status: asset.status,
      'IP Address': asset.systemSpecs?.ipAddress || asset.networkSpecs?.managementIp || 'N/A',
      'MAC Address': asset.systemSpecs?.macAddress || 'N/A',
      'Purchase Date': asset.purchaseDate,
      'Warranty Expiry': asset.warrantyExpiry,
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'PAA_IT_Inventory');
    XLSX.writeFile(workbook, `PAA_Sentinel_Inventory_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  return (
    <div className="space-y-4 pb-12">
      {/* Header & Control Toolbar */}
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <HardDrive className="h-5 w-5 text-emerald-500" />
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">IT Asset Directory</h2>
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-extrabold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
              {filteredAssets.length} Assets
            </span>
          </div>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            Manage workstations, printers, network switches, servers, and airport IT hardware.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => handleProtectedAction('Technician', onOpenAddModal)}
            className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white shadow-md transition hover:bg-emerald-500 dark:bg-emerald-500 dark:hover:bg-emerald-400"
          >
            <Plus className="h-4 w-4" />
            <span>Add Asset</span>
          </button>

          <button
            onClick={() => handleProtectedAction('Administrator', () => setIsAddDeptOpen(true))}
            className="flex items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs font-bold text-emerald-700 hover:bg-emerald-500/20 dark:bg-emerald-500/20 dark:text-emerald-300 transition"
            title="Create a new Department"
          >
            <Building2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <span>Add Dept</span>
          </button>

          <button
            onClick={() => handleProtectedAction('Administrator', () => setIsAddBrandOpen(true))}
            className="flex items-center gap-1.5 rounded-xl border border-blue-500/30 bg-blue-500/10 px-3 py-2 text-xs font-bold text-blue-700 hover:bg-blue-500/20 dark:bg-blue-500/20 dark:text-blue-300 transition"
            title="Register a new Brand"
          >
            <Tag className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <span>Add Brand</span>
          </button>

          <button
            onClick={() => handleProtectedAction('Administrator', () => setIsAddVendorOpen(true))}
            className="flex items-center gap-1.5 rounded-xl border border-purple-500/30 bg-purple-500/10 px-3 py-2 text-xs font-bold text-purple-700 hover:bg-purple-500/20 dark:bg-purple-500/20 dark:text-purple-300 transition"
            title="Register a new Vendor Supplier"
          >
            <Store className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            <span>Add Vendor</span>
          </button>

          <button
            onClick={() => handleProtectedAction('Administrator', () => setIsAddCategoryOpen(true))}
            className="flex items-center gap-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs font-bold text-amber-700 hover:bg-amber-500/20 dark:bg-amber-500/20 dark:text-amber-300 transition"
            title="Register a new Device Category"
          >
            <Layers className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            <span>Add Category</span>
          </button>

          <button
            onClick={() => handleProtectedAction('Technician', onOpenExcelImport)}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            <Upload className="h-4 w-4 text-blue-500" />
            <span>Import Excel</span>
          </button>

          <button
            onClick={exportToExcel}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
            <span>Export Excel</span>
          </button>

          <button
            onClick={() => onOpenLabelModal && onOpenLabelModal()}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            <QrCode className="h-4 w-4 text-amber-500" />
            <span>Print QR Labels</span>
          </button>
        </div>
      </div>

      {/* Filter Options Bar */}
      <div className="grid grid-cols-1 gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:grid-cols-2 md:grid-cols-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search Asset ID, Serial, IP..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 py-2 text-xs font-medium text-slate-800 outline-none focus:border-emerald-500 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          />
        </div>

        {/* Department Filter with Quick Add */}
        <div className="flex items-center gap-1.5">
          <select
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-800 outline-none focus:border-emerald-500 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            <option value="ALL">All Departments ({allDepartments.length})</option>
            {allDepartments.map((dept) => (
              <option key={dept} value={dept}>
                {dept} Department
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => setIsAddDeptOpen(true)}
            className="flex h-8 shrink-0 items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 px-2 text-[11px] font-bold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            title="Add New Department"
          >
            <Plus className="h-3.5 w-3.5 text-emerald-500" />
            <span className="hidden sm:inline">Dept</span>
          </button>
        </div>

        {/* Category Filter */}
        <div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-800 outline-none focus:border-emerald-500 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            <option value="ALL">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-800 outline-none focus:border-emerald-500 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            <option value="ALL">All Statuses</option>
            {statuses.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Results Count & View Mode Switcher (Mobile Cards vs Table) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <span>
            Showing <strong className="text-slate-800 dark:text-slate-200">{filteredAssets.length}</strong> of{' '}
            <strong className="text-slate-800 dark:text-slate-200">{assets.filter((a) => !a.isRemoved).length}</strong> Active Assets
          </span>
        </div>

        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setViewMode('cards')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              viewMode === 'cards'
                ? 'bg-white text-emerald-700 shadow-xs dark:bg-slate-700 dark:text-emerald-400'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <LayoutGrid className="h-3.5 w-3.5" />
            <span>Mobile Cards</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('table')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              viewMode === 'table'
                ? 'bg-white text-emerald-700 shadow-xs dark:bg-slate-700 dark:text-emerald-400'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <List className="h-3.5 w-3.5" />
            <span>Table View</span>
          </button>
        </div>
      </div>

      {/* Main Asset View: Mobile Cards or Full Table */}
      {viewMode === 'cards' ? (
        <div className="space-y-3">
          {filteredAssets.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-slate-400 dark:border-slate-800 dark:bg-slate-900 shadow-sm">
              <HardDrive className="mx-auto h-8 w-8 opacity-40 mb-2" />
              <p className="font-semibold">No assets found matching filter criteria.</p>
              <p className="text-[11px] text-slate-500 mt-1">Try clearing filters or search keywords.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredAssets.map((asset) => {
                const ipAddr = asset.systemSpecs?.ipAddress || asset.networkSpecs?.managementIp || null;
                const macAddr = asset.systemSpecs?.macAddress || null;

                return (
                  <div
                    key={asset.id}
                    className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md hover:border-emerald-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-emerald-600 transition flex flex-col justify-between gap-3"
                  >
                    {/* Card Top */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div
                          onClick={() => onSelectAsset(asset)}
                          className="cursor-pointer font-mono text-sm font-bold text-slate-900 hover:text-emerald-600 dark:text-white dark:hover:text-emerald-400 flex items-center gap-1.5"
                        >
                          <span className="truncate">{asset.id}</span>
                          <span className="text-[10px] font-normal px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 font-sans shrink-0">
                            {asset.assetTag}
                          </span>
                        </div>
                        <h4
                          onClick={() => onSelectAsset(asset)}
                          className="cursor-pointer text-xs font-bold text-slate-800 hover:text-emerald-600 dark:text-slate-200 mt-1 line-clamp-1"
                        >
                          {asset.name}
                        </h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                          {asset.brand} {asset.model} • SN: {asset.serialNumber}
                        </p>
                      </div>

                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-extrabold shrink-0 ${
                          asset.status === 'Active'
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400'
                            : asset.status === 'Spare'
                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400'
                            : asset.status === 'Under Repair'
                            ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400'
                            : 'bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400'
                        }`}
                      >
                        {asset.status}
                      </span>
                    </div>

                    {/* Card Metadata Grid */}
                    <div className="grid grid-cols-2 gap-2 text-xs border-y border-slate-100 dark:border-slate-800/80 py-2.5">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Department</span>
                        <span className="font-semibold text-emerald-700 dark:text-emerald-400 text-xs truncate block">
                          {asset.department}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Assigned User</span>
                        <span className="font-medium text-slate-700 dark:text-slate-300 text-xs truncate block">
                          {asset.assignedUser || '—'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Category</span>
                        <span className="inline-block font-semibold text-slate-700 dark:text-slate-300 text-xs truncate">
                          {asset.category}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">IP Address</span>
                        <span className="font-mono text-xs text-slate-600 dark:text-slate-400 truncate block">
                          {ipAddr || '—'}
                        </span>
                      </div>
                    </div>

                    {/* Touch Friendly Action Buttons with >=44px touch targets */}
                    <div className="flex items-center justify-between gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => onSelectAsset(asset)}
                        className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 py-2.5 px-3 text-xs font-bold text-slate-700 dark:text-slate-200 transition min-h-[44px] active:scale-[0.98]"
                      >
                        <Eye className="h-4 w-4 text-emerald-500" />
                        <span>Inspect</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleEdit && handleEdit(asset)}
                        className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-900/60 py-2.5 px-3 text-xs font-bold text-blue-700 dark:text-blue-300 transition min-h-[44px] active:scale-[0.98]"
                      >
                        <Edit className="h-4 w-4 text-blue-500" />
                        <span>Edit</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => onOpenLabelModal && onOpenLabelModal(asset)}
                        className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition shrink-0 min-h-[44px] min-w-[44px] active:scale-[0.98]"
                        title="Print QR Asset Label"
                      >
                        <QrCode className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
                      </button>

                      <button
                        type="button"
                        onClick={() => onOpenIssueModal && onOpenIssueModal(asset)}
                        className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900/60 text-amber-700 dark:text-amber-300 transition shrink-0 min-h-[44px] min-w-[44px] active:scale-[0.98]"
                        title="Report Ticket / Grief"
                      >
                        <Wrench className="h-4 w-4 text-amber-500" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* Main Asset Table */
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-[10px] uppercase font-bold text-slate-400 dark:border-slate-800 dark:bg-slate-800/50">
                  <th className="py-3 px-4">Asset ID / Tag</th>
                  <th className="py-3 px-4">Device Name & Brand</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4">Assigned User</th>
                  <th className="py-3 px-4">IP / MAC</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredAssets.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      <HardDrive className="mx-auto h-8 w-8 opacity-40 mb-2" />
                      <p className="font-semibold">No assets found matching filter criteria.</p>
                      <p className="text-[11px] text-slate-500 mt-1">Try clearing filters or search keywords.</p>
                    </td>
                  </tr>
                ) : (
                  filteredAssets.map((asset) => {
                    const ipAddr = asset.systemSpecs?.ipAddress || asset.networkSpecs?.managementIp || '—';
                    const macAddr = asset.systemSpecs?.macAddress || '—';

                    return (
                      <tr key={asset.id} className="hover:bg-slate-50/80 transition dark:hover:bg-slate-800/40">
                        <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white">
                          <div
                            onClick={() => onSelectAsset(asset)}
                            className="cursor-pointer hover:text-emerald-600 dark:hover:text-emerald-400"
                          >
                            <div>{asset.id}</div>
                            <div className="text-[10px] font-medium text-slate-400">{asset.assetTag}</div>
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <div onClick={() => onSelectAsset(asset)} className="cursor-pointer">
                            <div className="font-bold text-slate-800 dark:text-slate-200 hover:text-emerald-600">
                              {asset.name}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              {asset.brand} {asset.model} • SN: {asset.serialNumber}
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">
                          <span className="inline-flex items-center rounded-lg bg-slate-100 px-2 py-1 text-[11px] font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                            {asset.category}
                          </span>
                        </td>

                        <td className="py-3 px-4 font-bold text-emerald-700 dark:text-emerald-400">
                          {asset.department}
                        </td>

                        <td className="py-3 px-4 text-slate-700 dark:text-slate-300 font-medium">
                          {asset.assignedUser}
                        </td>

                        <td className="py-3 px-4 font-mono text-[11px] text-slate-600 dark:text-slate-400">
                          <div>{ipAddr}</div>
                          <div className="text-[9px] text-slate-400">{macAddr}</div>
                        </td>

                        <td className="py-3 px-4 text-center">
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-extrabold ${
                              asset.status === 'Active'
                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400'
                                : asset.status === 'Spare'
                                ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400'
                                : asset.status === 'Under Repair'
                                ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400'
                                : 'bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400'
                            }`}
                          >
                            {asset.status}
                          </span>
                        </td>

                        <td className="py-3 px-4 text-center">
                          <div className="relative inline-block text-left">
                            <button
                              onClick={() => setActiveMenuId(activeMenuId === asset.id ? null : asset.id)}
                              className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </button>

                            {activeMenuId === asset.id && (
                              <div
                                onMouseLeave={() => setActiveMenuId(null)}
                                className="absolute right-0 top-8 z-50 w-44 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl dark:border-slate-800 dark:bg-slate-900"
                              >
                                <button
                                  onClick={() => {
                                    onSelectAsset(asset);
                                    setActiveMenuId(null);
                                  }}
                                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                                >
                                  <Eye className="h-3.5 w-3.5 text-emerald-500" />
                                  <span>View Details</span>
                                </button>

                                <button
                                  onClick={() => {
                                    handleEdit && handleEdit(asset);
                                    setActiveMenuId(null);
                                  }}
                                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                                >
                                  <Edit className="h-3.5 w-3.5 text-blue-500" />
                                  <span>Edit Record</span>
                                </button>

                                <button
                                  onClick={() => {
                                    onOpenIssueModal && onOpenIssueModal(asset);
                                    setActiveMenuId(null);
                                  }}
                                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                                >
                                  <Wrench className="h-3.5 w-3.5 text-amber-500" />
                                  <span>Report Ticket</span>
                                </button>

                                <button
                                  onClick={() => {
                                    onOpenLabelModal && onOpenLabelModal(asset);
                                    setActiveMenuId(null);
                                  }}
                                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                                >
                                  <QrCode className="h-3.5 w-3.5 text-cyan-500" />
                                  <span>Print Label</span>
                                </button>

                                <div className="my-1 border-t border-slate-100 dark:border-slate-800"></div>

                                <button
                                  onClick={() => {
                                    handleSoftRemove && handleSoftRemove(asset);
                                    setActiveMenuId(null);
                                  }}
                                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-500/10"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                  <span>Remove Item</span>
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <AddDepartmentModal isOpen={isAddDeptOpen} onClose={() => setIsAddDeptOpen(false)} />
      <AddBrandModal isOpen={isAddBrandOpen} onClose={() => setIsAddBrandOpen(false)} />
      <AddVendorModal isOpen={isAddVendorOpen} onClose={() => setIsAddVendorOpen(false)} />
      <AddCategoryModal isOpen={isAddCategoryOpen} onClose={() => setIsAddCategoryOpen(false)} />
      <RolePasswordModal
        isOpen={!!authRoleModal}
        targetRole={authRoleModal}
        onClose={() => setAuthRoleModal(null)}
      />
    </div>
  );
};
