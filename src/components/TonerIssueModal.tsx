import React, { useState } from 'react';
import { useInventory } from '../context/InventoryContext';
import { AssetItem, Department } from '../types/inventory';
import { InternalRequisitionFormModal } from './InternalRequisitionFormModal';
import {
  X,
  Printer as PrinterIcon,
  Calendar,
  Building2,
  Package,
  UserCheck,
  FileText,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Droplet,
  Printer,
  Download,
  AlertCircle,
  FileSpreadsheet,
} from 'lucide-react';

interface TonerIssueModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedAsset?: AssetItem | null;
}

export const TonerIssueModal: React.FC<TonerIssueModalProps> = ({
  isOpen,
  onClose,
  preselectedAsset,
}) => {
  const { assets, tonerIssueRecords, addTonerIssueRecord, allDepartments, userRole } = useInventory();

  const [activeTab, setActiveTab] = useState<'issue' | 'logs'>('issue');

  // Form State
  const [issuedDate, setIssuedDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [department, setDepartment] = useState<Department>(
    preselectedAsset ? preselectedAsset.department : 'IT'
  );
  const [selectedAssetId, setSelectedAssetId] = useState<string>(
    preselectedAsset ? preselectedAsset.id : ''
  );
  const [tonerModel, setTonerModel] = useState<string>(
    preselectedAsset?.printerSpecs?.tonerModel || ''
  );
  const [quantity, setQuantity] = useState<number>(1);
  const [recipientUser, setRecipientUser] = useState<string>(
    preselectedAsset ? preselectedAsset.assignedUser : ''
  );
  const [issuedBy, setIssuedBy] = useState<string>(`${userRole} Officer`);
  const [remarks, setRemarks] = useState<string>('');
  const [updateTonerLevel, setUpdateTonerLevel] = useState<boolean>(true);

  // Filter State for Logs
  const [logDepartmentFilter, setLogDepartmentFilter] = useState<string>('ALL');
  const [logSearchQuery, setLogSearchQuery] = useState<string>('');
  const [logDateFilter, setLogDateFilter] = useState<string>('');

  // Voucher Print & Requisition Modal State
  const [printingRecord, setPrintingRecord] = useState<any | null>(null);
  const [showRequisitionModal, setShowRequisitionModal] = useState<boolean>(false);

  if (!isOpen) return null;

  // Printers List for dropdown
  const printerAssets = assets.filter(
    (a) => !a.isRemoved && a.category === 'Printer'
  );

  const handlePrinterSelect = (assetId: string) => {
    setSelectedAssetId(assetId);
    if (!assetId) return;
    const found = printerAssets.find((p) => p.id === assetId);
    if (found) {
      setDepartment(found.department);
      if (found.printerSpecs?.tonerModel) {
        setTonerModel(found.printerSpecs.tonerModel);
      }
      if (found.assignedUser) {
        setRecipientUser(found.assignedUser);
      }
    }
  };

  const handleSubmitIssue = (e: React.FormEvent) => {
    e.preventDefault();
    if (!department || !tonerModel.trim()) return;

    const matchedPrinter = printerAssets.find((p) => p.id === selectedAssetId);

    addTonerIssueRecord(
      {
        issuedDate,
        department,
        assetId: selectedAssetId || undefined,
        printerName: matchedPrinter ? matchedPrinter.name : undefined,
        tonerModel: tonerModel.trim(),
        quantity: Number(quantity) || 1,
        issuedBy: issuedBy.trim() || `${userRole} Officer`,
        recipientUser: recipientUser.trim() || undefined,
        remarks: remarks.trim() || undefined,
      },
      updateTonerLevel
    );

    // Reset Form
    setRemarks('');
    setQuantity(1);
    setActiveTab('logs');
  };

  // Filtered Logs
  const filteredLogs = tonerIssueRecords.filter((record) => {
    if (logDepartmentFilter !== 'ALL' && record.department !== logDepartmentFilter) {
      return false;
    }
    if (logDateFilter && record.issuedDate !== logDateFilter) {
      return false;
    }
    if (logSearchQuery.trim()) {
      const q = logSearchQuery.toLowerCase();
      return (
        record.id.toLowerCase().includes(q) ||
        record.department.toLowerCase().includes(q) ||
        record.tonerModel.toLowerCase().includes(q) ||
        (record.printerName && record.printerName.toLowerCase().includes(q)) ||
        (record.recipientUser && record.recipientUser.toLowerCase().includes(q)) ||
        record.issuedBy.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const exportTonerCsv = () => {
    const headers = ['Ref ID', 'Issued Date', 'Department', 'Printer Asset', 'Toner Model', 'Qty', 'Recipient', 'Issued By', 'Remarks'];
    const rows = filteredLogs.map((r) => [
      r.id,
      r.issuedDate,
      r.department,
      r.printerName || r.assetId || 'N/A',
      r.tonerModel,
      r.quantity,
      r.recipientUser || 'N/A',
      r.issuedBy,
      r.remarks || '',
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.map((cell) => `"${cell}"`).join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `PAA_Toner_Issue_Log_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-4xl max-h-[92vh] overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900 my-auto flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-6 py-4 dark:border-slate-800 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white shadow-md">
              <Droplet className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                Departmental Toner Issue & Distribution Portal
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Track printer toner cartridge issue records by department and dated register
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

        {/* Tab Switcher */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-100/60 px-6 py-2 dark:border-slate-800 dark:bg-slate-800/30">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('issue')}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
                activeTab === 'issue'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'bg-white text-slate-700 hover:bg-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800'
              }`}
            >
              <Plus className="h-4 w-4" />
              <span>Issue New Toner Cartridge</span>
            </button>

            <button
              onClick={() => setActiveTab('logs')}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
                activeTab === 'logs'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'bg-white text-slate-700 hover:bg-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800'
              }`}
            >
              <FileText className="h-4 w-4" />
              <span>Departmental Toner Register ({tonerIssueRecords.length} Dated Records)</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {activeTab === 'logs' && (
              <button
                type="button"
                onClick={exportTonerCsv}
                className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              >
                <Download className="h-3.5 w-3.5 text-emerald-500" />
                <span>Export CSV</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setShowRequisitionModal(true)}
              className="flex items-center gap-1.5 rounded-xl border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-800 hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 transition"
              title="Open Official Internal Requisition Form CAAF-003-XXLA-1.0"
            >
              <FileSpreadsheet className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <span>Official CAAF-003-XXLA-1.0 Form</span>
            </button>
          </div>
        </div>

        {/* Tab 1: Issue Toner Form */}
        {activeTab === 'issue' && (
          <form onSubmit={handleSubmitIssue} className="p-6 space-y-5">
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-xs text-emerald-800 dark:text-emerald-300 flex items-start gap-2.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>
                Register a new toner or ink cartridge issue voucher. Select department, issue date, toner cartridge model, quantity, and recipient officer.
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Issued Date */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Issue Date (Dated) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="date"
                    required
                    value={issuedDate}
                    onChange={(e) => setIssuedDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 py-2 text-xs font-bold text-slate-800 outline-none focus:border-emerald-500 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                  />
                </div>
              </div>

              {/* Department */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Department <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value as Department)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 py-2 text-xs font-bold text-slate-800 outline-none focus:border-emerald-500 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                  >
                    {allDepartments.map((dept) => (
                      <option key={dept} value={dept}>
                        {dept} Department
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Select Printer Asset */}
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Target Printer Device (Optional)
                </label>
                <div className="relative">
                  <PrinterIcon className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <select
                    value={selectedAssetId}
                    onChange={(e) => handlePrinterSelect(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 py-2 text-xs font-semibold text-slate-800 outline-none focus:border-emerald-500 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                  >
                    <option value="">-- General Departmental Stock / Unassigned Printer --</option>
                    {printerAssets.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.id} - {p.name} ({p.department} - {p.printerSpecs?.tonerModel || 'LaserJet'})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Toner Cartridge Model */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Toner Cartridge Model / Spec <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Package className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. HP 59A (CF259A), HP 05A, Canon CRG-054..."
                    value={tonerModel}
                    onChange={(e) => setTonerModel(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 py-2 text-xs font-bold text-slate-800 outline-none focus:border-emerald-500 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                  />
                </div>
              </div>

              {/* Quantity */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Quantity Issued <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  required
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:border-emerald-500 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                />
              </div>

              {/* Recipient User */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Recipient Staff / Incharge
                </label>
                <div className="relative">
                  <UserCheck className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="e.g. Shift Supervisor, Duty Officer..."
                    value={recipientUser}
                    onChange={(e) => setRecipientUser(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 py-2 text-xs font-medium text-slate-800 outline-none focus:border-emerald-500 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                  />
                </div>
              </div>

              {/* Issued By Officer */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Issued By (IT Officer)
                </label>
                <input
                  type="text"
                  required
                  value={issuedBy}
                  onChange={(e) => setIssuedBy(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-800 outline-none focus:border-emerald-500 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                />
              </div>
            </div>

            {/* Auto Update Printer Level Checkbox */}
            {selectedAssetId && (
              <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-800/50">
                <input
                  type="checkbox"
                  id="chkUpdateTonerLevel"
                  checked={updateTonerLevel}
                  onChange={(e) => setUpdateTonerLevel(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                <label htmlFor="chkUpdateTonerLevel" className="text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                  Automatically reset printer toner gauge level to 100% in asset inventory
                </label>
              </div>
            )}

            {/* Remarks */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Remarks & Voucher Notes
              </label>
              <textarea
                rows={2}
                placeholder="Reason for issue, previous toner status, room number..."
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs font-medium text-slate-800 outline-none focus:border-emerald-500 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              />
            </div>

            {/* Submit Action */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2 text-xs font-bold text-white shadow-md hover:bg-emerald-500 transition"
              >
                <Droplet className="h-4 w-4" />
                <span>Issue Toner & Save Register Record</span>
              </button>
            </div>
          </form>
        )}

        {/* Tab 2: Departmental Dated Toner Register */}
        {activeTab === 'logs' && (
          <div className="p-6 space-y-4">
            {/* Filter Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50/80 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 dark:bg-slate-800/40">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search toner model, printer, staff..."
                  value={logSearchQuery}
                  onChange={(e) => setLogSearchQuery(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 py-1.5 text-xs font-medium text-slate-800 outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                />
              </div>

              {/* Department Filter */}
              <div>
                <select
                  value={logDepartmentFilter}
                  onChange={(e) => setLogDepartmentFilter(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-800 outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                >
                  <option value="ALL">All Departments</option>
                  {allDepartments.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept} Dept
                    </option>
                  ))}
                </select>
              </div>

              {/* Date Filter */}
              <div className="relative">
                <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="date"
                  value={logDateFilter}
                  onChange={(e) => setLogDateFilter(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 py-1.5 text-xs font-semibold text-slate-800 outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                />
              </div>
            </div>

            {/* Register Log Table */}
            {filteredLogs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                <AlertCircle className="h-10 w-10 text-slate-300 dark:text-slate-600 mb-2" />
                <p className="text-xs font-bold text-slate-600 dark:text-slate-400">
                  No toner issue records match the selected date or department filters.
                </p>
                <button
                  onClick={() => {
                    setLogDepartmentFilter('ALL');
                    setLogSearchQuery('');
                    setLogDateFilter('');
                  }}
                  className="mt-2 text-xs text-emerald-600 hover:underline font-bold"
                >
                  Reset Register Filters
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-[11px] font-bold text-slate-600 dark:bg-slate-800/80 dark:text-slate-300 uppercase tracking-wider">
                    <tr>
                      <th className="px-3.5 py-3">Issue Ref ID</th>
                      <th className="px-3.5 py-3">Dated</th>
                      <th className="px-3.5 py-3">Department</th>
                      <th className="px-3.5 py-3">Toner Cartridge Model</th>
                      <th className="px-3.5 py-3 text-center">Qty</th>
                      <th className="px-3.5 py-3">Recipient Staff</th>
                      <th className="px-3.5 py-3">Issued By</th>
                      <th className="px-3.5 py-3 text-right">Voucher</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                    {filteredLogs.map((log) => (
                      <tr
                        key={log.id}
                        className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition"
                      >
                        <td className="px-3.5 py-3 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                          {log.id}
                        </td>
                        <td className="px-3.5 py-3 font-bold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                          {log.issuedDate}
                        </td>
                        <td className="px-3.5 py-3">
                          <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-500/20">
                            {log.department}
                          </span>
                        </td>
                        <td className="px-3.5 py-3">
                          <div className="font-bold text-slate-900 dark:text-white">{log.tonerModel}</div>
                          {log.printerName && (
                            <div className="text-[10px] text-slate-400 truncate max-w-[200px]">
                              {log.printerName}
                            </div>
                          )}
                        </td>
                        <td className="px-3.5 py-3 text-center">
                          <span className="rounded-md bg-slate-100 px-2 py-0.5 font-extrabold text-slate-800 dark:bg-slate-800 dark:text-slate-200">
                            {log.quantity}
                          </span>
                        </td>
                        <td className="px-3.5 py-3 text-slate-700 dark:text-slate-300">
                          {log.recipientUser || 'Department Officer'}
                        </td>
                        <td className="px-3.5 py-3 text-slate-500 dark:text-slate-400 text-[11px]">
                          {log.issuedBy}
                        </td>
                        <td className="px-3.5 py-3 text-right">
                          <button
                            onClick={() => setPrintingRecord(log)}
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-bold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                            title="Print Official Toner Voucher"
                          >
                            <Printer className="h-3 w-3 text-emerald-500" />
                            <span>Voucher</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Voucher Print Preview Modal */}
        {printingRecord && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
            <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 space-y-4">
              <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <Printer className="h-5 w-5 text-emerald-500" />
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                    PAA Official Toner Cartridge Issue Voucher
                  </h4>
                </div>
                <button
                  onClick={() => setPrintingRecord(null)}
                  className="rounded-lg p-1 text-slate-400 hover:text-slate-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Printable Voucher Format */}
              <div id="printable-toner-voucher" className="rounded-xl border border-slate-300 p-5 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 space-y-4">
                <div className="text-center border-b pb-3 border-slate-300">
                  <h5 className="font-black text-sm uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                    PAKISTAN AIRPORTS AUTHORITY
                  </h5>
                  <p className="text-[10px] font-bold text-slate-500 uppercase">
                    IT Directorate - Departmental Stores & Consumable Requisition
                  </p>
                  <p className="text-[10px] font-mono text-slate-400 mt-1">
                    Voucher Ref: <span className="font-bold">{printingRecord.id}</span> • Date: <span className="font-bold">{printingRecord.issuedDate}</span>
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-500 text-[10px] block uppercase font-bold">Issued Department</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">{printingRecord.department} Department</span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] block uppercase font-bold">Toner Cartridge Spec</span>
                    <span className="font-bold">{printingRecord.tonerModel}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] block uppercase font-bold">Quantity Issued</span>
                    <span className="font-bold">{printingRecord.quantity} Unit(s)</span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] block uppercase font-bold">Receiving Staff</span>
                    <span className="font-bold">{printingRecord.recipientUser || 'Department Staff'}</span>
                  </div>
                </div>

                {printingRecord.printerName && (
                  <div className="text-xs">
                    <span className="text-slate-500 text-[10px] block uppercase font-bold">Target Printer Device</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{printingRecord.printerName}</span>
                  </div>
                )}

                {printingRecord.remarks && (
                  <div className="text-xs">
                    <span className="text-slate-500 text-[10px] block uppercase font-bold">Remarks / Purpose</span>
                    <p className="italic text-slate-600 dark:text-slate-300">{printingRecord.remarks}</p>
                  </div>
                )}

                <div className="pt-6 border-t border-slate-300 grid grid-cols-2 gap-4 text-[10px] font-bold text-center">
                  <div>
                    <div className="border-b border-slate-400 mb-1 pb-4"></div>
                    <span>Issued By: {printingRecord.issuedBy}</span>
                  </div>
                  <div>
                    <div className="border-b border-slate-400 mb-1 pb-4"></div>
                    <span>Received By (Dept Stamp & Sign)</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={() => setPrintingRecord(null)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                >
                  Close
                </button>
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-emerald-500"
                >
                  <Printer className="h-4 w-4" />
                  <span>Print Official Voucher</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <InternalRequisitionFormModal
        isOpen={showRequisitionModal}
        onClose={() => setShowRequisitionModal(false)}
        initialData={{
          demandingSection: department,
          requiredBy: recipientUser || `${userRole} Officer`,
          purpose: remarks || 'Internal Requisition for Printer Toner & IT Consumables',
          items: [
            {
              sNo: 1,
              refNo: 'VOC-TNR-01',
              description: tonerModel ? `Printer Toner Cartridge (${tonerModel})` : 'Toner Cartridge Replacement',
              assetInventory: selectedAssetId || 'AST-PRN-01',
              partOf: 'Department Printer',
              uom: 'Nos',
              qtyReturned: 1,
              qtyDemanded: quantity || 1,
              qtySupplied: quantity || 1,
            },
          ],
        }}
      />
    </div>
  );
};
