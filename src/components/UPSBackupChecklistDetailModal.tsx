import React from 'react';
import { UPSBackupChecklistLogSheet } from '../types/inventory';
import {
  X,
  Printer,
  Download,
  Calendar,
  UserCheck,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  ArrowDownToLine,
} from 'lucide-react';

interface UPSBackupChecklistDetailModalProps {
  sheet: UPSBackupChecklistLogSheet;
  onClose: () => void;
  onLoadIntoEditor?: (sheet: UPSBackupChecklistLogSheet) => void;
}

export const UPSBackupChecklistDetailModal: React.FC<UPSBackupChecklistDetailModalProps> = ({
  sheet,
  onClose,
  onLoadIntoEditor,
}) => {
  const activeCount = sheet.activeCount ?? sheet.items.filter((i) => i.status.toLowerCase().includes('ok') || i.status.toLowerCase().includes('active')).length;
  const issueCount = sheet.issueCount ?? sheet.items.filter((i) => i.status.toLowerCase().includes('fault') || i.status.toLowerCase().includes('replace') || i.status.toLowerCase().includes('down') || i.status.toLowerCase().includes('offline')).length;

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    const headers = ['S.NO', 'ITEM DESCRIPTION', 'LOCATION', 'DATE', 'STATUS', 'CHECKED BY', 'REMARKS'];
    const dataRows = sheet.items.map((r) => [
      r.sNo,
      `"${(r.itemDescription || '').replace(/"/g, '""')}"`,
      `"${(r.location || '').replace(/"/g, '""')}"`,
      `"${r.date || ''}"`,
      `"${(r.status || '').replace(/"/g, '""')}"`,
      `"${(r.checkedBy || '').replace(/"/g, '""')}"`,
      `"${(r.remarks || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      `UPS BACKUP LIST OF IT EQUIPMENT - LOG SHEET\n` +
      `Sheet Number: ${sheet.sheetNumber}\n` +
      `Report Date: ${sheet.reportDate}\n` +
      `Logged At: ${new Date(sheet.createdAt).toLocaleString()}\n` +
      `Inspector: ${sheet.checkedByName},Supervisor: ${sheet.supervisorName}\n` +
      `Prepared By: ${sheet.preparedByName},Verified By: ${sheet.verifiedByName}\n\n` +
      [headers.join(','), ...dataRows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${sheet.sheetNumber.replace(/\//g, '_')}_Checklist.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div
      id="ups-backup-checklist-detail-modal"
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-fadeIn"
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl max-w-5xl w-full max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="px-2 py-0.5 text-xs font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded">
                  {sheet.sheetNumber}
                </span>
                <span className="text-xs text-slate-400">Saved Log Sheet Record</span>
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
                title="Load this log sheet's data into the live editable checklist form"
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
            <span className="text-slate-500 dark:text-slate-400 font-medium">Report Date</span>
            <div className="flex items-center space-x-1.5 font-semibold text-slate-800 dark:text-slate-200">
              <Calendar className="w-3.5 h-3.5 text-blue-500" />
              <span>{sheet.reportDate}</span>
            </div>
          </div>

          <div className="space-y-0.5">
            <span className="text-slate-500 dark:text-slate-400 font-medium">Inspector / Checked By</span>
            <div className="flex items-center space-x-1.5 font-semibold text-slate-800 dark:text-slate-200 truncate">
              <UserCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span className="truncate">{sheet.checkedByName}</span>
            </div>
          </div>

          <div className="space-y-0.5">
            <span className="text-slate-500 dark:text-slate-400 font-medium">Supervisor / Officer</span>
            <div className="flex items-center space-x-1.5 font-semibold text-slate-800 dark:text-slate-200 truncate">
              <ShieldCheck className="w-3.5 h-3.5 text-purple-500 shrink-0" />
              <span className="truncate">{sheet.supervisorName}</span>
            </div>
          </div>

          <div className="space-y-0.5">
            <span className="text-slate-500 dark:text-slate-400 font-medium">Health Status Summary</span>
            <div className="flex items-center space-x-2">
              <span className="inline-flex items-center text-emerald-600 dark:text-emerald-400 font-bold">
                <CheckCircle2 className="w-3 h-3 mr-0.5" />
                {activeCount} OK
              </span>
              {issueCount > 0 && (
                <span className="inline-flex items-center text-amber-600 dark:text-amber-400 font-bold">
                  <AlertTriangle className="w-3 h-3 mr-0.5" />
                  {issueCount} Issues
                </span>
              )}
              <span className="text-slate-400 font-normal">({sheet.totalItems} total)</span>
            </div>
          </div>
        </div>

        {/* Signatures & Notes Info */}
        {(sheet.notes || sheet.preparedByName || sheet.verifiedByName) && (
          <div className="px-6 py-2.5 bg-blue-50/50 dark:bg-slate-800/30 border-b border-slate-200 dark:border-slate-800 text-xs flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center space-x-4 text-slate-600 dark:text-slate-300">
              {sheet.preparedByName && (
                <span>
                  <strong className="text-slate-700 dark:text-slate-200">Prepared By:</strong> {sheet.preparedByName} ({sheet.preparedBySig || 'Signed'})
                </span>
              )}
              {sheet.verifiedByName && (
                <span>
                  <strong className="text-slate-700 dark:text-slate-200">Verified By:</strong> {sheet.verifiedByName} ({sheet.verifiedBySig || 'Signed'})
                </span>
              )}
            </div>
            {sheet.notes && (
              <div className="text-slate-500 dark:text-slate-400 italic">
                &ldquo;{sheet.notes}&rdquo;
              </div>
            )}
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
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Checked By</th>
                  <th className="py-2.5 px-3">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {sheet.items.map((item, idx) => {
                  const isOk = item.status.toLowerCase().includes('ok') || item.status.toLowerCase().includes('active');
                  const isIssue = item.status.toLowerCase().includes('fault') || item.status.toLowerCase().includes('replace') || item.status.toLowerCase().includes('down') || item.status.toLowerCase().includes('offline');

                  return (
                    <tr
                      key={item.id || idx}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      <td className="py-2.5 px-3 text-center font-mono font-medium text-slate-500 dark:text-slate-400">
                        {item.sNo}
                      </td>
                      <td className="py-2.5 px-3 font-medium text-slate-900 dark:text-white">
                        {item.itemDescription}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300">
                        {item.location}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-500 dark:text-slate-400">
                        {item.date}
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                            isOk
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                              : isIssue
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                              : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300">
                        {item.checkedBy}
                      </td>
                      <td className="py-2.5 px-3 text-slate-500 dark:text-slate-400 italic">
                        {item.remarks || '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 shrink-0">
          <span>
            Archived on {new Date(sheet.createdAt).toLocaleString()} by {sheet.loggedByUser || sheet.checkedByName}
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
