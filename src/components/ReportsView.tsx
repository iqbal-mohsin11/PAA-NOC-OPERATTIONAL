import React, { useState } from 'react';
import { useInventory } from '../context/InventoryContext';
import { AssetItem, Department } from '../types/inventory';
import {
  FileBarChart,
  FileSpreadsheet,
  Printer,
  Download,
  Filter,
  CheckSquare,
  Shield,
  Building,
  Calendar,
  CheckCircle2,
} from 'lucide-react';
import * as XLSX from 'xlsx';

export const ReportsView: React.FC = () => {
  const { assets, settings, allDepartments, tickets, maintenanceRecords } = useInventory();

  const [reportType, setReportType] = useState('Asset Inventory Report');
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [startDate, setStartDate] = useState('2026-01-01');
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  // Checkbox Options
  const [includeSignature, setIncludeSignature] = useState(true);
  const [includeLogo, setIncludeLogo] = useState(true);
  const [includeMaintenance, setIncludeMaintenance] = useState(true);
  const [includeQrCode, setIncludeQrCode] = useState(true);

  // Filtered Assets for Report
  const activeAssets = assets.filter((a) => {
    if (reportType === 'Soft Removed / Archived Assets') {
      if (!a.isRemoved) return false;
    } else {
      if (a.isRemoved) return false;
    }

    if (selectedDept !== 'ALL' && a.department !== selectedDept) return false;

    if (reportType === 'Printers & Scanners Report') {
      if (a.category !== 'Printer' && a.category !== 'Scanner') return false;
    } else if (reportType === 'Network Switches & Router Infrastructure') {
      if (!['Network Switch', 'Core Switch', 'Distribution Switch', 'Access Switch', 'Router', 'Firewall', 'Server'].includes(a.category))
        return false;
    } else if (reportType === 'Faulty & Repairing Devices Report') {
      if (a.status !== 'Under Repair' && a.status !== 'Faulty') return false;
    }

    return true;
  });

  const handlePrint = () => {
    window.print();
  };

  const handleExportExcel = () => {
    const data = activeAssets.map((a) => ({
      'Asset ID': a.id,
      Name: a.name,
      Category: a.category,
      Department: a.department,
      User: a.assignedUser,
      Brand: a.brand,
      Model: a.model,
      'Serial Number': a.serialNumber,
      Status: a.status,
      'Purchase Date': a.purchaseDate,
      'Warranty Expiry': a.warrantyExpiry,
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Audit_Report');
    XLSX.writeFile(wb, `PAA_Audit_Report_${reportType.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Top Banner */}
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:flex-row sm:items-center sm:justify-between print:hidden">
        <div>
          <div className="flex items-center gap-2">
            <FileBarChart className="h-5 w-5 text-emerald-500" />
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Export Official Audit & Compliance Report</h2>
          </div>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            Generate formal PAA IT Infrastructure reports with signatures, QR codes, and Excel export.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-emerald-500"
          >
            <FileSpreadsheet className="h-4 w-4" />
            <span>Export Excel</span>
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900"
          >
            <Printer className="h-4 w-4" />
            <span>Print Official PDF / Paper</span>
          </button>
        </div>
      </div>

      {/* Filter Controls (Hidden in Print) */}
      <div className="grid grid-cols-1 gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 md:grid-cols-3 print:hidden">
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Select Report Type</label>
          <select
            value={reportType}
            onChange={(e) => setReportType(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2 text-xs font-bold dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            <option value="Asset Inventory Report">Asset Inventory Report</option>
            <option value="Department Asset Breakdown">Department Asset Breakdown</option>
            <option value="Printers & Scanners Report">Printers & Scanners Report</option>
            <option value="Network Switches & Router Infrastructure">Network Switches & Infrastructure</option>
            <option value="Warranty Expiring Report">Warranty Expiring Report</option>
            <option value="Faulty & Repairing Devices Report">Faulty & Repairing Devices Report</option>
            <option value="Soft Removed / Archived Assets">Soft Removed / Archived Assets</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Department Filter</label>
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2 text-xs font-bold dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            <option value="ALL">All PAA Departments</option>
            {allDepartments.map((dept) => (
              <option key={dept} value={dept}>
                {dept} Department
              </option>
            ))}
          </select>
        </div>

        {/* Options Checkboxes */}
        <div className="flex flex-col justify-center space-y-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={includeSignature}
              onChange={(e) => setIncludeSignature(e.target.checked)}
              className="rounded accent-emerald-500"
            />
            <span>Include Official Signature Block</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={includeLogo}
              onChange={(e) => setIncludeLogo(e.target.checked)}
              className="rounded accent-emerald-500"
            />
            <span>Include PAA Header & Logo</span>
          </label>
        </div>
      </div>

      {/* Official Printable Report Document Container */}
      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-md dark:border-slate-800 dark:bg-slate-900 text-slate-900 dark:text-slate-100 print:shadow-none print:border-none print:p-0">
        {/* Document Official Header */}
        {includeLogo && (
          <div className="flex items-center justify-between border-b-2 border-slate-900 pb-4 mb-6 dark:border-slate-100">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-700 text-white font-black text-xl">
                PAA
              </div>
              <div>
                <h1 className="text-xl font-black uppercase tracking-tight text-slate-900 dark:text-white">
                  Pakistan Airports Authority
                </h1>
                <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
                  PAA Sentinel v5.0 • IT Infrastructure & Asset Management
                </p>
                <p className="text-[11px] text-slate-500">{settings.airportName}</p>
              </div>
            </div>

            <div className="text-right text-xs">
              <div className="font-mono font-bold text-slate-900 dark:text-white">REPORT ID: REP-2026-000451</div>
              <div className="text-slate-500 mt-0.5">Generated Date: {new Date().toLocaleDateString('en-GB')}</div>
              <div className="text-slate-500">Classification: OFFICIAL AUDIT</div>
            </div>
          </div>
        )}

        {/* Report Title & Scope Summary */}
        <div className="mb-6 rounded-xl bg-slate-50 p-4 border border-slate-200 dark:bg-slate-800/60 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white">{reportType}</h2>
              <p className="text-xs text-slate-500">Department Scope: {selectedDept}</p>
            </div>
            <div className="text-right text-xs">
              <span className="font-bold text-emerald-600 dark:text-emerald-400">{activeAssets.length} Total Records Found</span>
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b-2 border-slate-200 bg-slate-100 text-[10px] uppercase font-bold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                <th className="py-2.5 px-3">Asset ID</th>
                <th className="py-2.5 px-3">Device Name & Model</th>
                <th className="py-2.5 px-3">Category</th>
                <th className="py-2.5 px-3">Department</th>
                <th className="py-2.5 px-3">Assigned User</th>
                <th className="py-2.5 px-3 font-mono">Serial Number</th>
                <th className="py-2.5 px-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {activeAssets.map((asset) => (
                <tr key={asset.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="py-2.5 px-3 font-mono font-bold text-slate-900 dark:text-white">{asset.id}</td>
                  <td className="py-2.5 px-3 font-semibold text-slate-800 dark:text-slate-200">
                    <div>{asset.name}</div>
                    <div className="text-[10px] text-slate-400 font-normal">{asset.brand} {asset.model}</div>
                  </td>
                  <td className="py-2.5 px-3 font-medium">{asset.category}</td>
                  <td className="py-2.5 px-3 font-bold text-emerald-700 dark:text-emerald-400">{asset.department}</td>
                  <td className="py-2.5 px-3">{asset.assignedUser}</td>
                  <td className="py-2.5 px-3 font-mono text-[11px] text-slate-600 dark:text-slate-400">{asset.serialNumber}</td>
                  <td className="py-2.5 px-3 text-center font-bold text-slate-800 dark:text-slate-200">{asset.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Official Signature Lines */}
        {includeSignature && (
          <div className="mt-16 grid grid-cols-3 gap-8 pt-8 border-t border-slate-200 dark:border-slate-800 text-center text-xs">
            <div>
              <div className="h-10"></div>
              <div className="border-t border-slate-400 pt-1 font-bold">Prepared By</div>
              <div className="text-slate-500 text-[10px]">IT Assistant / Inspector</div>
            </div>

            <div>
              <div className="h-10"></div>
              <div className="border-t border-slate-400 pt-1 font-bold">Verified By</div>
              <div className="text-slate-500 text-[10px]">Deputy Manager IT Operations</div>
            </div>

            <div>
              <div className="h-10"></div>
              <div className="border-t border-slate-400 pt-1 font-bold">Approved By</div>
              <div className="text-slate-500 text-[10px]">Airport Manager / Director IT</div>
            </div>
          </div>
        )}

        {/* Footer info */}
        <div className="mt-8 border-t border-slate-100 pt-3 flex justify-between text-[10px] text-slate-400 dark:border-slate-800">
          <span>PAA Sentinel v5.0 Enterprise • Pakistan Airports Authority</span>
          <span>Confidential Audit Copy</span>
        </div>
      </div>
    </div>
  );
};
