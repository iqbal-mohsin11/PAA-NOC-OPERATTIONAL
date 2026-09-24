import React, { useState, useMemo } from 'react';
import { useInventory } from '../context/InventoryContext';
import {
  X,
  FileSpreadsheet,
  Printer,
  Droplet,
  Wrench,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Layers,
  ArrowUpDown,
  Calendar,
  Building,
  Activity,
  HardDrive,
} from 'lucide-react';

interface PrintersMasterLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenMaintenanceForm?: (assetId: string) => void;
  onOpenTonerIssueModal?: (assetId: string) => void;
}

const formatLocation = (loc: unknown): string => {
  if (!loc) return 'PAA Terminal Area';
  if (typeof loc === 'string') return loc;
  if (typeof loc === 'object' && loc !== null) {
    const l = loc as { building?: string; floor?: string; room?: string };
    const parts = [l.building, l.floor, l.room].filter(Boolean);
    return parts.length > 0 ? parts.join(' - ') : 'PAA Terminal Area';
  }
  return String(loc);
};

export const PrintersMasterLogModal: React.FC<PrintersMasterLogModalProps> = ({
  isOpen,
  onClose,
  onOpenMaintenanceForm,
  onOpenTonerIssueModal,
}) => {
  const {
    assets,
    tonerIssueRecords,
    printerMaintenanceRecords,
    printerModels,
    tonerModels,
    printerParts,
  } = useInventory();

  const [activeTab, setActiveTab] = useState<'printers' | 'toners' | 'parts'>('printers');
  const [search, setSearch] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('ALL');

  // Filter only printers & scanners from all assets
  const printerFleet = useMemo(() => {
    return assets.filter(
      (a) =>
        a.category.toLowerCase().includes('printer') ||
        a.category.toLowerCase().includes('scanner') ||
        a.name.toLowerCase().includes('printer') ||
        a.name.toLowerCase().includes('laserjet') ||
        a.name.toLowerCase().includes('deskjet')
    );
  }, [assets]);

  const uniqueDepartments = useMemo(() => {
    const set = new Set(printerFleet.map((p) => p.department).filter(Boolean));
    return Array.from(set);
  }, [printerFleet]);

  if (!isOpen) return null;

  // Filtered lists
  const filteredPrinters = printerFleet.filter((p) => {
    if (departmentFilter !== 'ALL' && p.department !== departmentFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        p.name.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        p.model.toLowerCase().includes(q) ||
        p.serialNumber.toLowerCase().includes(q) ||
        p.department.toLowerCase().includes(q) ||
        p.assignedUser?.toLowerCase().includes(q) ||
        p.systemSpecs?.ipAddress?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const filteredTonerLogs = tonerIssueRecords.filter((t) => {
    if (departmentFilter !== 'ALL' && t.department !== departmentFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        t.printerName.toLowerCase().includes(q) ||
        t.tonerModel.toLowerCase().includes(q) ||
        t.issuedTo.toLowerCase().includes(q) ||
        t.department.toLowerCase().includes(q) ||
        t.ticketNumber?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const filteredPartLogs = printerMaintenanceRecords.filter((m) => {
    if (departmentFilter !== 'ALL' && m.department !== departmentFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        m.printerName.toLowerCase().includes(q) ||
        m.model.toLowerCase().includes(q) ||
        m.technicianName.toLowerCase().includes(q) ||
        (m.partsChangedSummary && m.partsChangedSummary.toLowerCase().includes(q))
      );
    }
    return true;
  });

  // Export functions
  const exportPrintersCsv = () => {
    const headers = [
      'Asset ID',
      'Device Name',
      'Brand',
      'Model',
      'Department',
      'Location',
      'Serial Number',
      'Assigned User',
      'IP Address',
      'Toner Level %',
      'Toner Model',
      'Condition/Status',
    ];
    const rows = filteredPrinters.map((p) => [
      `"${p.id}"`,
      `"${p.name}"`,
      `"${p.brand}"`,
      `"${p.model}"`,
      `"${p.department}"`,
      `"${formatLocation(p.location)}"`,
      `"${p.serialNumber}"`,
      `"${p.assignedUser || ''}"`,
      `"${p.systemSpecs?.ipAddress || ''}"`,
      p.printerSpecs?.tonerLevel ?? 'N/A',
      `"${p.printerSpecs?.tonerModel || ''}"`,
      `"${p.status}"`,
    ]);
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Printers_Scanners_Fleet_Master_Log_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportTonersCsv = () => {
    const headers = [
      'Issue ID',
      'Date',
      'Printer Name',
      'Department',
      'Toner Model',
      'Issue Type',
      'Quantity',
      'Issued To',
      'Issued By',
      'Page Counter',
      'Status',
    ];
    const rows = filteredTonerLogs.map((t) => [
      `"${t.id}"`,
      `"${t.date}"`,
      `"${t.printerName}"`,
      `"${t.department}"`,
      `"${t.tonerModel}"`,
      `"${t.issueType}"`,
      t.quantity,
      `"${t.issuedTo}"`,
      `"${t.issuedBy}"`,
      t.pageCount || 'N/A',
      `"${t.status}"`,
    ]);
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Toner_Issue_Master_Log_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4">
      <div className="flex h-full max-h-[92vh] w-full max-w-6xl flex-col rounded-2xl bg-white shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-600 text-white shadow-md shadow-cyan-500/20">
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Printers & Toners Master Log Sheet
                </h2>
                <span className="rounded-full bg-cyan-500/10 px-2.5 py-0.5 text-xs font-bold text-cyan-600 dark:text-cyan-400">
                  {printerFleet.length} Active Fleet Units
                </span>
                <span className="rounded-full bg-teal-500/10 px-2.5 py-0.5 text-xs font-bold text-teal-600 dark:text-teal-400">
                  {tonerIssueRecords.length} Toner Transactions
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Complete operational log for all airport printers, scanners, toner cartridges issued, and replaced spare parts.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={activeTab === 'printers' ? exportPrintersCsv : exportTonersCsv}
              className="hidden sm:flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 transition"
              title="Export Current Log to CSV"
            >
              <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={onClose}
              className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Tab Toggle Navigation */}
        <div className="flex border-b border-slate-200 bg-white px-6 dark:border-slate-800 dark:bg-slate-900">
          <button
            onClick={() => setActiveTab('printers')}
            className={`flex items-center gap-2 border-b-2 py-3 px-4 text-xs font-bold transition ${
              activeTab === 'printers'
                ? 'border-cyan-600 text-cyan-600 dark:border-cyan-400 dark:text-cyan-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <Printer className="h-4 w-4" />
            <span>All Printers & Scanners Roster ({filteredPrinters.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('toners')}
            className={`flex items-center gap-2 border-b-2 py-3 px-4 text-xs font-bold transition ${
              activeTab === 'toners'
                ? 'border-cyan-600 text-cyan-600 dark:border-cyan-400 dark:text-cyan-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <Droplet className="h-4 w-4" />
            <span>Toner Issue & Consumption Log ({filteredTonerLogs.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('parts')}
            className={`flex items-center gap-2 border-b-2 py-3 px-4 text-xs font-bold transition ${
              activeTab === 'parts'
                ? 'border-cyan-600 text-cyan-600 dark:border-cyan-400 dark:text-cyan-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <Wrench className="h-4 w-4" />
            <span>Parts Replacement Log ({filteredPartLogs.length})</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Search & Department Filter */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search device name, brand, model, serial, toner, department..."
                className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 py-2 text-xs font-medium text-slate-800 outline-none focus:border-cyan-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
              />
            </div>

            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
            >
              <option value="ALL">All Departments</option>
              {uniqueDepartments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>

          {activeTab === 'printers' ? (
            /* Printers Fleet Master Table */
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
                  <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-black uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-400">
                    <tr>
                      <th className="py-3 px-4">Asset ID & Device Name</th>
                      <th className="py-3 px-4">Make & Model</th>
                      <th className="py-3 px-4">Department & Location</th>
                      <th className="py-3 px-4">Custodian / IP</th>
                      <th className="py-3 px-4">Toner Level & Model</th>
                      <th className="py-3 px-4 text-center">Interventions</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {filteredPrinters.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-10 text-center text-xs text-slate-400">
                          No printers/scanners match the search filter.
                        </td>
                      </tr>
                    ) : (
                      filteredPrinters.map((p) => {
                        const mntCount = printerMaintenanceRecords.filter((m) => m.assetId === p.id).length;
                        const tonerCount = tonerIssueRecords.filter((t) => t.assetId === p.id).length;
                        const tonerPct = p.printerSpecs?.tonerLevel ?? 80;
                        const isTonerLow = tonerPct <= 20;

                        return (
                          <tr key={p.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition">
                            <td className="py-3 px-4">
                              <span className="font-mono font-bold text-cyan-600 dark:text-cyan-400 block text-[11px]">
                                {p.id}
                              </span>
                              <div className="font-bold text-slate-900 dark:text-white">{p.name}</div>
                              <span className="text-[10px] text-slate-400 font-mono">SN: {p.serialNumber}</span>
                            </td>
                            <td className="py-3 px-4">
                              <div className="font-bold text-slate-800 dark:text-slate-200">{p.brand}</div>
                              <div className="text-[11px] text-slate-500 dark:text-slate-400">{p.model}</div>
                            </td>
                            <td className="py-3 px-4">
                              <div className="font-bold text-slate-700 dark:text-slate-300">{p.department}</div>
                              <div className="text-[10px] text-slate-400">{formatLocation(p.location)}</div>
                            </td>
                            <td className="py-3 px-4">
                              <div className="font-medium text-slate-800 dark:text-slate-200">
                                {p.assignedUser || 'Dept Pool'}
                              </div>
                              <div className="font-mono text-[10px] text-slate-400">{p.systemSpecs?.ipAddress || 'USB'}</div>
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2">
                                <div className="h-1.5 w-16 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full ${
                                      isTonerLow ? 'bg-rose-500' : 'bg-emerald-500'
                                    }`}
                                    style={{ width: `${tonerPct}%` }}
                                  />
                                </div>
                                <span className={`text-[11px] font-bold ${isTonerLow ? 'text-rose-600' : 'text-slate-700 dark:text-slate-300'}`}>
                                  {tonerPct}%
                                </span>
                              </div>
                              <div className="text-[10px] text-teal-600 dark:text-teal-400 font-mono font-semibold mt-0.5">
                                {p.printerSpecs?.tonerModel || 'Standard'}
                              </div>
                            </td>
                            <td className="py-3 px-4 text-center">
                              <div className="inline-flex gap-1 text-[10px]">
                                <span className="rounded bg-indigo-50 px-1.5 py-0.5 font-bold text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300" title="Repairs">
                                  {mntCount} repairs
                                </span>
                                <span className="rounded bg-teal-50 px-1.5 py-0.5 font-bold text-teal-700 dark:bg-teal-950/40 dark:text-teal-300" title="Toners issued">
                                  {tonerCount} toners
                                </span>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <span
                                className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                  p.status === 'Active'
                                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                    : p.status === 'Under Repair'
                                    ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                                    : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                                }`}
                              >
                                {p.status}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end gap-1">
                                {onOpenMaintenanceForm && (
                                  <button
                                    onClick={() => {
                                      onOpenMaintenanceForm(p.id);
                                    }}
                                    className="rounded-lg bg-indigo-50 p-1.5 text-indigo-600 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:text-indigo-300 transition"
                                    title="Perform Maintenance / Repair"
                                  >
                                    <Wrench className="h-3.5 w-3.5" />
                                  </button>
                                )}
                                {onOpenTonerIssueModal && (
                                  <button
                                    onClick={() => {
                                      onOpenTonerIssueModal(p.id);
                                    }}
                                    className="rounded-lg bg-teal-50 p-1.5 text-teal-600 hover:bg-teal-100 dark:bg-teal-950/40 dark:text-teal-300 transition"
                                    title="Issue Toner Cartridge"
                                  >
                                    <Droplet className="h-3.5 w-3.5" />
                                  </button>
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
          ) : activeTab === 'toners' ? (
            /* Toners Log Master Table */
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
                  <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-black uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-400">
                    <tr>
                      <th className="py-3 px-4">Transaction # & Date</th>
                      <th className="py-3 px-4">Target Printer</th>
                      <th className="py-3 px-4">Toner Model</th>
                      <th className="py-3 px-4">Issue Type & Qty</th>
                      <th className="py-3 px-4">Issued To</th>
                      <th className="py-3 px-4">Counter at Change</th>
                      <th className="py-3 px-4">Issued By</th>
                      <th className="py-3 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {filteredTonerLogs.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-10 text-center text-xs text-slate-400">
                          No toner issue transactions recorded.
                        </td>
                      </tr>
                    ) : (
                      filteredTonerLogs.map((t) => (
                        <tr key={t.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition">
                          <td className="py-3 px-4">
                            <span className="font-mono font-bold text-teal-600 dark:text-teal-400 block text-[11px]">
                              {t.id}
                            </span>
                            <span className="text-[10px] text-slate-400">{t.date}</span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-bold text-slate-900 dark:text-white">{t.printerName}</div>
                            <span className="text-[10px] text-slate-400">{t.department}</span>
                          </td>
                          <td className="py-3 px-4 font-mono font-bold text-slate-800 dark:text-slate-200">
                            {t.tonerModel}
                          </td>
                          <td className="py-3 px-4">
                            <span className="rounded-md bg-teal-50 px-2 py-0.5 text-[10px] font-bold text-teal-800 dark:bg-teal-950/40 dark:text-teal-300">
                              {t.issueType} ({t.quantity} unit)
                            </span>
                          </td>
                          <td className="py-3 px-4 font-medium text-slate-700 dark:text-slate-300">
                            {t.issuedTo}
                          </td>
                          <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-400">
                            {t.pageCount ? `${t.pageCount.toLocaleString()} pages` : 'N/A'}
                          </td>
                          <td className="py-3 px-4 text-slate-500 dark:text-slate-400">
                            {t.issuedBy}
                          </td>
                          <td className="py-3 px-4">
                            <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                              {t.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* Parts Replacement Log Master Table */
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
                  <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-black uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-400">
                    <tr>
                      <th className="py-3 px-4">Log ID & Date</th>
                      <th className="py-3 px-4">Printer Unit</th>
                      <th className="py-3 px-4">Department</th>
                      <th className="py-3 px-4">Service Category</th>
                      <th className="py-3 px-4">Parts Changed Summary</th>
                      <th className="py-3 px-4">Technician</th>
                      <th className="py-3 px-4">Cost (PKR)</th>
                      <th className="py-3 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {filteredPartLogs.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-10 text-center text-xs text-slate-400">
                          No parts replacement records found.
                        </td>
                      </tr>
                    ) : (
                      filteredPartLogs.map((m) => (
                        <tr key={m.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition">
                          <td className="py-3 px-4">
                            <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400 block text-[11px]">
                              {m.id}
                            </span>
                            <span className="text-[10px] text-slate-400">{m.date}</span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-bold text-slate-900 dark:text-white">{m.printerName}</div>
                            <span className="text-[10px] text-slate-400">{m.model}</span>
                          </td>
                          <td className="py-3 px-4 font-medium text-slate-700 dark:text-slate-300">
                            {m.department}
                          </td>
                          <td className="py-3 px-4">
                            <span className="rounded-md bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300">
                              {m.serviceType}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-medium text-slate-800 dark:text-slate-200 max-w-xs">
                            {m.partsChangedSummary || 'Routine maintenance'}
                          </td>
                          <td className="py-3 px-4 text-slate-700 dark:text-slate-300">
                            {m.technicianName}
                          </td>
                          <td className="py-3 px-4 font-mono font-bold text-slate-800 dark:text-slate-200">
                            PKR {m.costPkr?.toLocaleString() || 0}
                          </td>
                          <td className="py-3 px-4">
                            <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                              {m.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
