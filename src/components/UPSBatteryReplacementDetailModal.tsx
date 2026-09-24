import React from 'react';
import { UPSBatteryReplacementLogSheet } from '../types/inventory';
import {
  X,
  Printer,
  Download,
  Calendar,
  Wrench,
  BatteryCharging,
  ShieldCheck,
  FileSpreadsheet,
  ArrowDownToLine,
} from 'lucide-react';

interface UPSBatteryReplacementDetailModalProps {
  sheet: UPSBatteryReplacementLogSheet;
  onClose: () => void;
  onLoadIntoEditor?: (sheet: UPSBatteryReplacementLogSheet) => void;
}

export const UPSBatteryReplacementDetailModal: React.FC<UPSBatteryReplacementDetailModalProps> = ({
  sheet,
  onClose,
  onLoadIntoEditor,
}) => {
  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    const headers = ['S.NO', 'ITEM DESCRIPTION', 'LOCATION', 'DATE', 'REPLACED BY', 'SIGNATURE', 'REMARKS'];
    const dataRows = sheet.entries.map((r) => [
      r.sNo,
      `"${(r.itemDescription || '').replace(/"/g, '""')}"`,
      `"${(r.location || '').replace(/"/g, '""')}"`,
      `"${r.date || ''}"`,
      `"${(r.replacedBy || '').replace(/"/g, '""')}"`,
      `"${(r.signature || '').replace(/"/g, '""')}"`,
      `"${(r.remarks || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      `DETAILS REPLACEMENT OF UPS BATTERIES INSTALLED AT DIFFERENT LOCATIONS - LOG SHEET\n` +
      `Sheet Number: ${sheet.sheetNumber}\n` +
      `Batch Date: ${sheet.batchDate || new Date(sheet.createdAt).toLocaleDateString()}\n` +
      `Logged At: ${new Date(sheet.createdAt).toLocaleString()}\n` +
      `Chief Technician: ${sheet.chiefTechnician || sheet.loggedByUser || 'NOC Technician'},Supervisor: ${sheet.supervisor || sheet.supervisorOrVerifiedBy || 'NOC Supervisor'}\n` +
      `Total Units Replaced: ${sheet.totalUnitsReplaced ?? sheet.entries.length},Total Batteries Installed: ${sheet.totalBatteriesCount ?? sheet.entries.length}\n\n` +
      [headers.join(','), ...dataRows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${sheet.sheetNumber.replace(/\//g, '_')}_Replacement.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div
      id="ups-battery-replacement-detail-modal"
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-fadeIn"
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl max-w-5xl w-full max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-400">
              <BatteryCharging className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="px-2 py-0.5 text-xs font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded">
                  {sheet.sheetNumber}
                </span>
                <span className="text-xs text-slate-400">Saved Replacement Log Sheet</span>
              </div>
              <h2 className="text-lg font-bold text-white tracking-tight">{sheet.title}</h2>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {onLoadIntoEditor && (
              <button
                type="button"
                onClick={() => onLoadIntoEditor(sheet)}
                className="hidden sm:inline-flex items-center space-x-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-medium transition-colors"
                title="Load this log sheet's entries into the live battery replacement form"
              >
                <ArrowDownToLine className="w-3.5 h-3.5" />
                <span>Load into Form</span>
              </button>
            )}
            <button
              type="button"
              onClick={handleExportCSV}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium border border-slate-700 transition-colors"
              title="Download CSV file"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Export CSV</span>
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium border border-slate-700 transition-colors"
              title="Print official log sheet"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Print</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Sheet Metadata Banner */}
        <div className="bg-slate-50 dark:bg-slate-800/60 p-4 border-b border-slate-200 dark:border-slate-800 grid grid-cols-2 md:grid-cols-4 gap-3 text-xs shrink-0">
          <div className="space-y-0.5">
            <span className="text-slate-500 dark:text-slate-400 font-medium">Batch Date</span>
            <div className="flex items-center space-x-1.5 font-semibold text-slate-800 dark:text-slate-200">
              <Calendar className="w-3.5 h-3.5 text-blue-500" />
              <span>{sheet.batchDate || new Date(sheet.createdAt).toLocaleDateString()}</span>
            </div>
          </div>

          <div className="space-y-0.5">
            <span className="text-slate-500 dark:text-slate-400 font-medium">Lead Technician</span>
            <div className="flex items-center space-x-1.5 font-semibold text-slate-800 dark:text-slate-200 truncate">
              <Wrench className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span className="truncate">{sheet.chiefTechnician || sheet.loggedByUser || 'NOC Technician'}</span>
            </div>
          </div>

          <div className="space-y-0.5">
            <span className="text-slate-500 dark:text-slate-400 font-medium">Supervisor / Verification</span>
            <div className="flex items-center space-x-1.5 font-semibold text-slate-800 dark:text-slate-200 truncate">
              <ShieldCheck className="w-3.5 h-3.5 text-purple-500 shrink-0" />
              <span className="truncate">{sheet.supervisor || sheet.supervisorOrVerifiedBy || sheet.verifiedBy || 'Supervisor IT'}</span>
            </div>
          </div>

          <div className="space-y-0.5">
            <span className="text-slate-500 dark:text-slate-400 font-medium">Batteries Installed</span>
            <div className="flex items-center space-x-2">
              <span className="inline-flex items-center text-amber-600 dark:text-amber-400 font-bold">
                <BatteryCharging className="w-3.5 h-3.5 mr-1" />
                {sheet.totalBatteriesCount ?? sheet.entries.length} Batteries
              </span>
              <span className="text-slate-400 font-normal">({sheet.totalUnitsReplaced ?? sheet.totalEntries ?? sheet.entries.length} units)</span>
            </div>
          </div>
        </div>

        {/* Scope Notes */}
        {sheet.notes && (
          <div className="px-6 py-2.5 bg-amber-50/50 dark:bg-slate-800/30 border-b border-slate-200 dark:border-slate-800 text-xs flex items-center justify-between text-slate-600 dark:text-slate-300">
            <div>
              <strong className="text-slate-700 dark:text-slate-200 mr-1.5">Scope & Procurement:</strong>
              {sheet.notes}
            </div>
          </div>
        )}

        {/* Itemized Table */}
        <div className="flex-1 overflow-auto p-4 sm:p-6">
          <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden shadow-sm">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 uppercase tracking-wider font-semibold border-b border-slate-200 dark:border-slate-700">
                  <th className="py-2.5 px-3 text-center w-12">S.No</th>
                  <th className="py-2.5 px-3">Item Description</th>
                  <th className="py-2.5 px-3">Location</th>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Replaced By</th>
                  <th className="py-2.5 px-3">Signature</th>
                  <th className="py-2.5 px-3">Remarks / Scope</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {sheet.entries.map((entry, idx) => (
                  <tr
                    key={entry.id || idx}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <td className="py-2.5 px-3 text-center font-mono font-medium text-slate-500 dark:text-slate-400">
                      {entry.sNo}
                    </td>
                    <td className="py-2.5 px-3 font-medium text-slate-900 dark:text-white">
                      {entry.itemDescription}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300">
                      {entry.location}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-500 dark:text-slate-400">
                      {entry.date}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300">
                      {entry.replacedBy}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-[11px] text-slate-500 dark:text-slate-400">
                      {entry.signature || '-'}
                    </td>
                    <td className="py-2.5 px-3 text-slate-500 dark:text-slate-400 italic">
                      {entry.remarks || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 shrink-0">
          <span>
            Archived on {new Date(sheet.createdAt).toLocaleString()} by {sheet.loggedByUser || sheet.chiefTechnician}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 rounded-lg font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
