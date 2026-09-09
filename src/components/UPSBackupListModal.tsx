import React, { useState } from 'react';
import { jsPDF } from 'jspdf';
import {
  X,
  Printer,
  Download,
  Plus,
  Trash2,
  Save,
  RotateCcw,
  CheckCircle2,
  BatteryCharging,
  Check,
  FileText,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { UPSBackupListItem } from '../types/inventory';
import { defaultUPSBackupListRows } from '../data/upsFormsData';

interface UPSBackupListModalProps {
  onClose: () => void;
}

export const UPSBackupListModal: React.FC<UPSBackupListModalProps> = ({ onClose }) => {
  // Saved header and signature info
  const [reportDate, setReportDate] = useState<string>(() => {
    try {
      const d = localStorage.getItem('paa_ups_backup_list_date');
      if (d) return d;
    } catch (e) {}
    const now = new Date();
    const dd = String(now.getDate()).padStart(2, '0');
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    return `${dd} / ${mm} / 2026`;
  });

  const [checkedByName, setCheckedByName] = useState<string>(() => {
    return localStorage.getItem('paa_ups_backup_checked_by') || 'Engr. Mohsin (IT NOC)';
  });
  const [supervisorName, setSupervisorName] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('paa_ups_backup_supervisor');
      if (saved && !saved.includes('Asif Mehmood')) {
        return saved;
      }
    } catch (e) {}
    try {
      localStorage.setItem('paa_ups_backup_supervisor', 'Farid');
    } catch (e) {}
    return 'Farid';
  });
  const [preparedByName, setPreparedByName] = useState<string>(() => {
    return localStorage.getItem('paa_ups_backup_prepared_by') || 'Engr. Mohsin';
  });
  const [preparedBySig, setPreparedBySig] = useState<string>(() => {
    return localStorage.getItem('paa_ups_backup_prepared_sig') || 'Mohsin / PAA';
  });
  const [verifiedByName, setVerifiedByName] = useState<string>(() => {
    return localStorage.getItem('paa_ups_backup_verified_by') || 'Officer In-Charge (IT)';
  });
  const [verifiedBySig, setVerifiedBySig] = useState<string>(() => {
    return localStorage.getItem('paa_ups_backup_verified_sig') || 'O/IC IT / PAA';
  });

  // Table rows matching Image 2
  const [rows, setRows] = useState<UPSBackupListItem[]>(() => {
    try {
      const saved = localStorage.getItem('paa_ups_backup_list_rows');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return defaultUPSBackupListRows;
  });

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isProcessingPrint, setIsProcessingPrint] = useState(false);

  const handleCellChange = (index: number, field: keyof UPSBackupListItem, value: any) => {
    const updated = [...rows];
    updated[index] = { ...updated[index], [field]: value };
    setRows(updated);
  };

  const handleAddRow = () => {
    const nextSNo = rows.length + 1;
    const newRow: UPSBackupListItem = {
      sNo: nextSNo,
      itemDescription: 'UPS-',
      location: '',
      date: new Date().toISOString().split('T')[0],
      status: 'Active',
      checkedBy: checkedByName || 'Engr. Mohsin',
      remarks: 'Normal inspection passed',
    };
    setRows([...rows, newRow]);
  };

  const handleDeleteRow = (index: number) => {
    if (rows.length <= 1) return;
    const filtered = rows.filter((_, i) => i !== index).map((row, i) => ({ ...row, sNo: i + 1 }));
    setRows(filtered);
  };

  const handleMarkAllActive = () => {
    const today = new Date().toISOString().split('T')[0];
    const updated = rows.map((r) => ({
      ...r,
      date: r.date || today,
      status: r.status || 'Active (Backup OK)',
      checkedBy: r.checkedBy || checkedByName,
      remarks: r.remarks || 'Load test OK',
    }));
    setRows(updated);
  };

  const handleResetToDefault = () => {
    if (window.confirm('Reset this checklist to the official 22-item airport roster?')) {
      setRows(defaultUPSBackupListRows);
      localStorage.setItem('paa_ups_backup_list_rows', JSON.stringify(defaultUPSBackupListRows));
    }
  };

  const handleSave = () => {
    try {
      localStorage.setItem('paa_ups_backup_list_rows', JSON.stringify(rows));
      localStorage.setItem('paa_ups_backup_list_date', reportDate);
      localStorage.setItem('paa_ups_backup_checked_by', checkedByName);
      localStorage.setItem('paa_ups_backup_supervisor', supervisorName);
      localStorage.setItem('paa_ups_backup_prepared_by', preparedByName);
      localStorage.setItem('paa_ups_backup_prepared_sig', preparedBySig);
      localStorage.setItem('paa_ups_backup_verified_by', verifiedByName);
      localStorage.setItem('paa_ups_backup_verified_sig', verifiedBySig);

      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (e) {
      console.error(e);
    }
  };

  const handleExportCSV = () => {
    const headers = ['S.NO', 'ITEM DESCRIPTION', 'LOCATION', 'DATE', 'STATUS', 'CHECKED BY', 'REMARKS'];
    const dataRows = rows.map((r) => [
      r.sNo,
      `"${r.itemDescription.replace(/"/g, '""')}"`,
      `"${r.location.replace(/"/g, '""')}"`,
      `"${r.date}"`,
      `"${r.status.replace(/"/g, '""')}"`,
      `"${r.checkedBy.replace(/"/g, '""')}"`,
      `"${r.remarks.replace(/"/g, '""')}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      `UPS BACKUP LIST OF IT EQUIPMENT\n` +
      `Date: ${reportDate}\n\n` +
      [headers.join(','), ...dataRows.map((e) => e.join(','))].join('\n') +
      `\n\nCHECKED BY: ${checkedByName},SUPERVISOR: ${supervisorName}\n` +
      `PREPARED BY: ${preparedByName},VERIFIED BY O/IC IT: ${verifiedByName}\n`;

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `UPS_BACKUP_LIST_OF_IT_EQUIPMENT_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const buildPDFDoc = () => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = 210;
    const pageHeight = 297;
    const margin = 10;
    const contentWidth = 190;

    // Outer border
    doc.setDrawColor(20, 20, 20);
    doc.setLineWidth(0.4);
    doc.rect(margin, margin, contentWidth, pageHeight - margin * 2);

    // Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(15, 23, 42);
    doc.text('UPS BACKUP LIST OF IT EQUIPMENT', pageWidth / 2, margin + 8, { align: 'center' });

    // Underline
    doc.setLineWidth(0.3);
    doc.line(pageWidth / 2 - 45, margin + 9.5, pageWidth / 2 + 45, margin + 9.5);

    // Subtitle
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text('Pakistan Airports Authority • Directorate of IT • Power Continuity & Health Audit', pageWidth / 2, margin + 13.5, { align: 'center' });

    // Date
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(`Date : ${reportDate}`, pageWidth - margin - 4, margin + 18, { align: 'right' });

    // Table Header
    const startY = margin + 21;
    const headerHeight = 7.5;
    const colWidths = [12, 36, 34, 22, 24, 26, 36];
    const colHeaders = ['S.NO', 'ITEM DESCRIPTION', 'LOCATION', 'DATE', 'STATUS', 'CHECKED BY', 'REMARKS'];

    doc.setFillColor(241, 245, 249);
    doc.rect(margin, startY, contentWidth, headerHeight, 'FD');

    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);

    let curX = margin;
    colHeaders.forEach((header, i) => {
      const w = colWidths[i];
      if (i === 0) {
        doc.text(header, curX + w / 2, startY + 5, { align: 'center' });
      } else {
        doc.text(header, curX + 2, startY + 5);
      }
      if (i < colHeaders.length - 1) {
        doc.line(curX + w, startY, curX + w, startY + headerHeight);
      }
      curX += w;
    });

    // Rows
    let y = startY + headerHeight;
    const rowHeight = 7.2;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);

    rows.forEach((row, idx) => {
      // Check if page overflow
      if (y + rowHeight > pageHeight - margin - 35) {
        doc.addPage();
        y = margin + 12;
        doc.rect(margin, margin, contentWidth, pageHeight - margin * 2);

        // Repeat Header
        doc.setFillColor(241, 245, 249);
        doc.rect(margin, y, contentWidth, headerHeight, 'FD');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.setTextColor(15, 23, 42);
        let headerX = margin;
        colHeaders.forEach((header, i) => {
          const w = colWidths[i];
          if (i === 0) {
            doc.text(header, headerX + w / 2, y + 5, { align: 'center' });
          } else {
            doc.text(header, headerX + 2, y + 5);
          }
          if (i < colHeaders.length - 1) {
            doc.line(headerX + w, y, headerX + w, y + headerHeight);
          }
          headerX += w;
        });
        y += headerHeight;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
      }

      // Alternate row fill
      if (idx % 2 === 1) {
        doc.setFillColor(248, 250, 252);
        doc.rect(margin, y, contentWidth, rowHeight, 'F');
      }
      doc.setDrawColor(20, 20, 20);
      doc.rect(margin, y, contentWidth, rowHeight, 'S');

      let x = margin;
      const cells = [
        String(row.sNo || idx + 1),
        row.itemDescription || '',
        row.location || '',
        row.date || '',
        row.status || '',
        row.checkedBy || '',
        row.remarks || '',
      ];

      cells.forEach((cellText, i) => {
        const w = colWidths[i];
        doc.setTextColor(15, 23, 42);
        if (i === 0) {
          doc.setFont('helvetica', 'bold');
          doc.text(cellText, x + w / 2, y + 4.8, { align: 'center' });
          doc.setFont('helvetica', 'normal');
        } else {
          const truncated = doc.splitTextToSize(cellText, w - 3)[0] || '';
          doc.text(truncated, x + 2, y + 4.8);
        }
        if (i < cells.length - 1) {
          doc.line(x + w, y, x + w, y + rowHeight);
        }
        x += w;
      });

      y += rowHeight;
    });

    // Signature Box
    const sigY = Math.max(y + 5, pageHeight - margin - 32);

    // Row 1: CHECKED BY   NAME: _____    SUPERVISOR: _____
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(15, 23, 42);
    doc.text(`CHECKED BY  NAME:  ${checkedByName}`, margin + 6, sigY);
    doc.text(`SUPERVISOR:  ${supervisorName}`, margin + 105, sigY);

    // Row 2: PREPARED BY vs VERIFIED BY O/IC IT
    const blockY = sigY + 5;
    doc.rect(margin + 5, blockY, 85, 20, 'S');
    doc.rect(margin + 100, blockY, 85, 20, 'S');

    doc.setFontSize(7.5);
    doc.text('PREPARED BY:', margin + 7, blockY + 4);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.text(`Name: ${preparedByName}`, margin + 7, blockY + 9);
    doc.text(`Signature: ${preparedBySig}`, margin + 7, blockY + 14);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.text('VERIFIED BY O/IC IT:', margin + 102, blockY + 4);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.text(`Name: ${verifiedByName}`, margin + 102, blockY + 9);
    doc.text(`Signature: ${verifiedBySig}`, margin + 102, blockY + 14);

    return doc;
  };

  const handleExportPDF = () => {
    try {
      setIsProcessingPrint(true);
      setStatusMessage('Generating official PDF...');
      const doc = buildPDFDoc();
      const cleanDate = reportDate.replace(/[^a-zA-Z0-9]/g, '_');
      doc.save(`UPS_BACKUP_LIST_OF_IT_EQUIPMENT_${cleanDate}.pdf`);
      setStatusMessage('Official PDF downloaded successfully!');
      setTimeout(() => setStatusMessage(null), 4000);
    } catch (err) {
      console.error('Failed to export PDF:', err);
      setStatusMessage('Failed to create PDF. Please try again.');
    } finally {
      setIsProcessingPrint(false);
    }
  };

  const handlePrint = () => {
    setIsProcessingPrint(true);
    setStatusMessage('Preparing printer document & PDF...');

    // Generate table HTML rows
    const rowsHtml = rows
      .map(
        (r, i) => `
      <tr style="border-bottom: 1px solid #000; font-size: 10px; background: ${i % 2 === 1 ? '#f8fafc' : '#fff'};">
        <td style="border: 1px solid #000; padding: 4px 6px; text-align: center; font-weight: bold;">${r.sNo}</td>
        <td style="border: 1px solid #000; padding: 4px 6px; font-weight: bold;">${r.itemDescription || ''}</td>
        <td style="border: 1px solid #000; padding: 4px 6px;">${r.location || ''}</td>
        <td style="border: 1px solid #000; padding: 4px 6px; text-align: center;">${r.date || ''}</td>
        <td style="border: 1px solid #000; padding: 4px 6px;">${r.status || ''}</td>
        <td style="border: 1px solid #000; padding: 4px 6px;">${r.checkedBy || ''}</td>
        <td style="border: 1px solid #000; padding: 4px 6px;">${r.remarks || ''}</td>
      </tr>
    `
      )
      .join('');

    const printHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>UPS BACKUP LIST OF IT EQUIPMENT</title>
        <style>
          @page { size: A4 portrait; margin: 10mm; }
          body { font-family: Arial, Helvetica, sans-serif; color: #000; margin: 0; padding: 10px; font-size: 10px; }
          .container { border: 1.5px solid #000; padding: 12px; min-height: 96vh; box-sizing: border-box; }
          .header { border-bottom: 2px solid #000; padding-bottom: 6px; margin-bottom: 8px; display: flex; justify-content: space-between; align-items: flex-end; }
          .title { font-size: 16px; font-weight: 900; text-decoration: underline; text-transform: uppercase; }
          .subtitle { font-size: 9px; color: #333; margin-top: 3px; }
          .date { font-size: 12px; font-weight: bold; font-family: monospace; }
          table { width: 100%; border-collapse: collapse; border: 1px solid #000; margin-top: 6px; }
          th { border: 1px solid #000; background-color: #f1f5f9; padding: 6px 4px; font-size: 9.5px; font-weight: 900; text-transform: uppercase; }
          .sig-row-1 { display: flex; justify-content: space-between; margin-top: 24px; font-weight: bold; font-size: 11px; }
          .sig-row-2 { display: flex; justify-content: space-between; margin-top: 14px; gap: 20px; }
          .sig-box { flex: 1; border: 1px solid #000; padding: 8px 10px; font-size: 10px; }
          .sig-box-title { font-weight: 900; font-size: 11px; margin-bottom: 6px; }
          .sig-line { margin-top: 6px; }
          @media print {
            body { padding: 0; }
            .no-print { display: none !important; }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div>
              <div class="title">UPS BACKUP LIST OF IT EQUIPMENT</div>
              <div class="subtitle">Pakistan Airports Authority • Directorate of IT • Power Continuity & Health Audit</div>
            </div>
            <div class="date">Date : ${reportDate}</div>
          </div>
          <table>
            <thead>
              <tr>
                <th style="width: 45px;">S.NO</th>
                <th style="width: 140px;">ITEM DESCRIPTION</th>
                <th style="width: 130px;">LOCATION</th>
                <th style="width: 85px;">DATE</th>
                <th style="width: 95px;">STATUS</th>
                <th style="width: 100px;">CHECKED BY</th>
                <th>REMARKS</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>
          <div class="sig-row-1">
            <div>CHECKED BY &nbsp; NAME: &nbsp; <u>${checkedByName || '____________________'}</u></div>
            <div>SUPERVISOR: &nbsp; <u>${supervisorName || '____________________'}</u></div>
          </div>
          <div class="sig-row-2">
            <div class="sig-box">
              <div class="sig-box-title">PREPARED BY:</div>
              <div class="sig-line"><strong>Name:</strong> ${preparedByName}</div>
              <div class="sig-line"><strong>Signature:</strong> ${preparedBySig}</div>
            </div>
            <div class="sig-box">
              <div class="sig-box-title">VERIFIED BY O/IC IT:</div>
              <div class="sig-line"><strong>Name:</strong> ${verifiedByName}</div>
              <div class="sig-line"><strong>Signature:</strong> ${verifiedBySig}</div>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    // Attempt printing via hidden iframe
    let printSuccess = false;
    try {
      const iframe = document.createElement('iframe');
      iframe.setAttribute('style', 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden;');
      document.body.appendChild(iframe);

      const frameDoc = iframe.contentWindow?.document || iframe.contentDocument;
      if (frameDoc) {
        frameDoc.open();
        frameDoc.write(printHtml);
        frameDoc.close();

        setTimeout(() => {
          try {
            iframe.contentWindow?.focus();
            iframe.contentWindow?.print();
            printSuccess = true;
            setStatusMessage('System print dialog opened!');
          } catch (e) {
            console.warn('Iframe print restricted by sandbox:', e);
            // Download PDF directly if browser restricts iframe printing
            handleExportPDF();
          } finally {
            setTimeout(() => {
              try {
                document.body.removeChild(iframe);
              } catch (e) {}
              setIsProcessingPrint(false);
            }, 3000);
          }
        }, 500);
      } else {
        handleExportPDF();
      }
    } catch (err) {
      console.warn('Printing error, downloading PDF:', err);
      handleExportPDF();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-2 sm:p-4 backdrop-blur-xs overflow-y-auto print:p-0 print:bg-white print:static">
      <div className="relative flex max-h-[96vh] w-full max-w-7xl flex-col rounded-2xl bg-white shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800 print:max-h-none print:shadow-none print:border-0 print:w-full print:rounded-none">
        
        {/* Modal Header & Actions (Hidden during browser print) */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 p-4 dark:border-slate-800 print:hidden">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-amber-500/10 p-2.5 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400">
              <BatteryCharging className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                  UPS Backup List of IT Equipment
                </h3>
                <span className="rounded-md bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-800 dark:text-amber-300 uppercase">
                  Official 22-Point Inspection Sheet
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Official form: "UPS BACKUP LIST OF IT EQUIPMENT" with verified sign-off block
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {savedSuccess && (
              <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 animate-fadeIn">
                <CheckCircle2 className="h-4 w-4" />
                <span>Saved!</span>
              </span>
            )}

            <button
              type="button"
              onClick={handleMarkAllActive}
              className="flex items-center gap-1 rounded-lg border border-emerald-300 bg-emerald-50 px-2.5 py-1.5 text-xs font-bold text-emerald-900 hover:bg-emerald-100 dark:border-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 transition"
              title="Populate current date and mark all units Active / OK"
            >
              <Check className="h-3.5 w-3.5" />
              <span>Mark All OK</span>
            </button>

            <button
              type="button"
              onClick={handleAddRow}
              className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 transition"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Row</span>
            </button>

            <button
              type="button"
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 transition"
            >
              <Download className="h-3.5 w-3.5 text-slate-500" />
              <span className="hidden sm:inline">Export CSV</span>
            </button>

            <button
              type="button"
              onClick={handleResetToDefault}
              className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-semibold text-slate-500 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 transition"
              title="Reset to default 22 rows"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>

            <button
              type="button"
              onClick={handleSave}
              className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-500 transition shadow-xs"
            >
              <Save className="h-3.5 w-3.5" />
              <span>Save Form</span>
            </button>

            <button
              type="button"
              onClick={handleExportPDF}
              disabled={isProcessingPrint}
              className="flex items-center gap-1.5 rounded-lg border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-900 hover:bg-amber-100 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-300 transition shadow-xs disabled:opacity-50"
              title="Download official PDF inspection sheet"
            >
              <FileText className="h-3.5 w-3.5 text-amber-600" />
              <span>Download PDF</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              disabled={isProcessingPrint}
              className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-indigo-500 transition shadow-xs disabled:opacity-50"
              title="Print official paper sheet or open system print dialog"
            >
              {isProcessingPrint ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Printer className="h-3.5 w-3.5" />
              )}
              <span>{isProcessingPrint ? 'Processing...' : 'Print Form'}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Status notification toast/banner */}
        {statusMessage && (
          <div className="flex items-center justify-between gap-2 border-b border-amber-200 bg-amber-50 px-4 py-2 text-xs font-semibold text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200 print:hidden animate-fadeIn">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <span>{statusMessage}</span>
            </div>
            <button
              type="button"
              onClick={handleExportPDF}
              className="underline font-bold text-amber-800 dark:text-amber-300 hover:text-amber-950"
            >
              Click here to download PDF file directly
            </button>
          </div>
        )}

        {/* Scrollable Printable Paper Container */}
        <div className="flex-1 overflow-auto p-3 sm:p-6 bg-slate-50 dark:bg-slate-950/60 print:bg-white print:p-0 print:overflow-visible">
          <div className="mx-auto w-full max-w-5xl rounded-xl bg-white p-4 sm:p-8 shadow-sm border border-slate-200 dark:bg-slate-900 dark:border-slate-800 print:border-0 print:shadow-none print:p-0 print:max-w-none text-slate-900 dark:text-slate-100">
            
            {/* Sheet Title & Date Header Matching Image 2 Exactly */}
            <div className="mb-4 flex flex-col sm:flex-row items-center justify-between gap-2 border-b-2 border-black pb-3 print:border-black">
              <div className="text-center sm:text-left">
                <h1 className="text-base sm:text-lg font-black uppercase tracking-wider underline underline-offset-4 decoration-2 text-slate-950 dark:text-white print:text-black">
                  UPS BACKUP LIST OF IT EQUIPMENT
                </h1>
                <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 print:text-gray-700">
                  Pakistan Airports Authority • Directorate of IT • Power Continuity & Health Audit
                </p>
              </div>

              {/* Date Header: Date : ____ / ____ / 2026 */}
              <div className="flex items-center gap-1 font-mono text-xs font-bold text-slate-900 dark:text-slate-100 print:text-black whitespace-nowrap">
                <span>Date :</span>
                <input
                  type="text"
                  value={reportDate}
                  onChange={(e) => setReportDate(e.target.value)}
                  className="w-36 bg-transparent px-1.5 py-0.5 font-bold border-b border-black text-center outline-none focus:bg-amber-50 dark:focus:bg-slate-800 print:border-black print:p-0"
                  placeholder="DD / MM / 2026"
                />
              </div>
            </div>

            {/* Grid Table Matching Image 2 Exactly */}
            <div className="overflow-x-auto border border-black print:border-black">
              <table className="w-full border-collapse text-left text-xs font-sans">
                <thead>
                  <tr className="border-b-2 border-black bg-slate-100 dark:bg-slate-800 text-center font-black uppercase tracking-wider text-slate-950 dark:text-white print:bg-gray-100 print:text-black print:border-black">
                    <th className="w-12 border-r border-black p-2 text-center">S.NO</th>
                    <th className="w-44 sm:w-52 border-r border-black p-2">ITEM DESCRIPTION</th>
                    <th className="w-40 sm:w-44 border-r border-black p-2">LOCATION</th>
                    <th className="w-28 border-r border-black p-2">DATE</th>
                    <th className="w-32 border-r border-black p-2">STATUS</th>
                    <th className="w-36 border-r border-black p-2">CHECKED BY</th>
                    <th className="border-black p-2">REMARKS</th>
                    <th className="w-8 border-black p-1 print:hidden"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black">
                  {rows.map((row, index) => (
                    <tr
                      key={row.sNo || index}
                      className="border-b border-black hover:bg-amber-50/40 dark:hover:bg-amber-950/20 transition print:hover:bg-transparent"
                    >
                      {/* S.NO */}
                      <td className="border-r border-black p-1 text-center font-bold text-slate-900 dark:text-slate-100 print:text-black">
                        {row.sNo}
                      </td>

                      {/* ITEM DESCRIPTION */}
                      <td className="border-r border-black p-1">
                        <input
                          type="text"
                          value={row.itemDescription}
                          onChange={(e) => handleCellChange(index, 'itemDescription', e.target.value)}
                          className="w-full bg-transparent px-1.5 py-1 font-bold text-slate-900 outline-none focus:bg-amber-50/80 dark:text-slate-100 dark:focus:bg-slate-800 print:p-0 print:text-black"
                          placeholder="e.g. UPS-2215"
                        />
                      </td>

                      {/* LOCATION */}
                      <td className="border-r border-black p-1">
                        <input
                          type="text"
                          value={row.location}
                          onChange={(e) => handleCellChange(index, 'location', e.target.value)}
                          className="w-full bg-transparent px-1.5 py-1 text-slate-800 outline-none focus:bg-amber-50/80 dark:text-slate-200 dark:focus:bg-slate-800 print:p-0 print:text-black"
                          placeholder="e.g. Level 6, 4102, AIRSIDE 1057"
                        />
                      </td>

                      {/* DATE */}
                      <td className="border-r border-black p-1 text-center">
                        <input
                          type="text"
                          value={row.date}
                          onChange={(e) => handleCellChange(index, 'date', e.target.value)}
                          className="w-full text-center bg-transparent px-1 py-1 font-mono text-slate-800 outline-none focus:bg-amber-50/80 dark:text-slate-200 dark:focus:bg-slate-800 print:p-0 print:text-black"
                          placeholder="YYYY-MM-DD"
                        />
                      </td>

                      {/* STATUS */}
                      <td className="border-r border-black p-1">
                        <input
                          type="text"
                          value={row.status}
                          onChange={(e) => handleCellChange(index, 'status', e.target.value)}
                          className="w-full bg-transparent px-1.5 py-1 font-semibold text-slate-800 outline-none focus:bg-amber-50/80 dark:text-slate-200 dark:focus:bg-slate-800 print:p-0 print:text-black"
                          placeholder="e.g. Active, OK, Faulty"
                        />
                      </td>

                      {/* CHECKED BY */}
                      <td className="border-r border-black p-1">
                        <input
                          type="text"
                          value={row.checkedBy}
                          onChange={(e) => handleCellChange(index, 'checkedBy', e.target.value)}
                          className="w-full bg-transparent px-1.5 py-1 text-slate-800 outline-none focus:bg-amber-50/80 dark:text-slate-200 dark:focus:bg-slate-800 print:p-0 print:text-black"
                          placeholder="Technician"
                        />
                      </td>

                      {/* REMARKS */}
                      <td className="p-1 border-r border-black print:border-r-0">
                        <input
                          type="text"
                          value={row.remarks}
                          onChange={(e) => handleCellChange(index, 'remarks', e.target.value)}
                          className="w-full bg-transparent px-1.5 py-1 text-slate-700 outline-none focus:bg-amber-50/80 dark:text-slate-300 dark:focus:bg-slate-800 print:p-0 print:text-black"
                          placeholder="Operational notes, backup test, etc."
                        />
                      </td>

                      {/* Action */}
                      <td className="p-1 text-center print:hidden">
                        <button
                          type="button"
                          onClick={() => handleDeleteRow(index)}
                          className="text-slate-400 hover:text-rose-600 transition"
                          title="Delete row"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Official Signature Blocks Matching Image 2 Exactly */}
            <div className="mt-8 space-y-6 pt-4 text-xs font-sans print:pt-6">
              
              {/* Row 1: CHECKED BY   NAME: _________   SUPERVISOR: _________ */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-baseline">
                <div className="flex items-baseline gap-2">
                  <span className="font-black text-slate-900 dark:text-white print:text-black whitespace-nowrap uppercase">
                    CHECKED BY &nbsp; NAME:
                  </span>
                  <input
                    type="text"
                    value={checkedByName}
                    onChange={(e) => setCheckedByName(e.target.value)}
                    className="flex-1 border-b border-black bg-transparent px-2 py-0.5 font-bold text-slate-900 outline-none dark:text-white print:border-black print:text-black"
                    placeholder="Inspector Name"
                  />
                </div>

                <div className="flex items-baseline gap-2">
                  <span className="font-black text-slate-900 dark:text-white print:text-black whitespace-nowrap uppercase">
                    SUPERVISOR:
                  </span>
                  <input
                    type="text"
                    value={supervisorName}
                    onChange={(e) => setSupervisorName(e.target.value)}
                    className="flex-1 border-b border-black bg-transparent px-2 py-0.5 font-bold text-slate-900 outline-none dark:text-white print:border-black print:text-black"
                    placeholder="Supervisor Name"
                  />
                </div>
              </div>

              {/* Row 2: PREPARED BY vs VERIFIED BY O/IC IT */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 pt-4">
                {/* PREPARED BY */}
                <div className="space-y-3 rounded-lg border border-dashed border-slate-300 p-3.5 dark:border-slate-700 print:border-0 print:p-0">
                  <div className="font-black text-slate-900 dark:text-white print:text-black uppercase tracking-wider">
                    PREPARED BY:
                  </div>
                  
                  <div className="flex items-baseline gap-2">
                    <span className="w-20 font-bold text-slate-800 dark:text-slate-200 print:text-black">Name:</span>
                    <input
                      type="text"
                      value={preparedByName}
                      onChange={(e) => setPreparedByName(e.target.value)}
                      className="flex-1 border-b border-black bg-transparent px-2 py-0.5 font-semibold text-slate-900 outline-none dark:text-white print:border-black print:text-black"
                      placeholder="Name"
                    />
                  </div>

                  <div className="flex items-baseline gap-2">
                    <span className="w-20 font-bold text-slate-800 dark:text-slate-200 print:text-black">Signature:</span>
                    <input
                      type="text"
                      value={preparedBySig}
                      onChange={(e) => setPreparedBySig(e.target.value)}
                      className="flex-1 border-b border-black bg-transparent px-2 py-0.5 italic font-serif text-slate-900 outline-none dark:text-white print:border-black print:text-black"
                      placeholder="Signature"
                    />
                  </div>
                </div>

                {/* VERIFIED BY O/IC IT */}
                <div className="space-y-3 rounded-lg border border-dashed border-slate-300 p-3.5 dark:border-slate-700 print:border-0 print:p-0">
                  <div className="font-black text-slate-900 dark:text-white print:text-black uppercase tracking-wider">
                    VERIFIED BY O/IC IT:
                  </div>

                  <div className="flex items-baseline gap-2">
                    <span className="w-20 font-bold text-slate-800 dark:text-slate-200 print:text-black">Name:</span>
                    <input
                      type="text"
                      value={verifiedByName}
                      onChange={(e) => setVerifiedByName(e.target.value)}
                      className="flex-1 border-b border-black bg-transparent px-2 py-0.5 font-semibold text-slate-900 outline-none dark:text-white print:border-black print:text-black"
                      placeholder="Officer In-Charge Name"
                    />
                  </div>

                  <div className="flex items-baseline gap-2">
                    <span className="w-20 font-bold text-slate-800 dark:text-slate-200 print:text-black">Signature:</span>
                    <input
                      type="text"
                      value={verifiedBySig}
                      onChange={(e) => setVerifiedBySig(e.target.value)}
                      className="flex-1 border-b border-black bg-transparent px-2 py-0.5 italic font-serif text-slate-900 outline-none dark:text-white print:border-black print:text-black"
                      placeholder="Officer Signature"
                    />
                  </div>
                </div>
              </div>

            </div>

          </div>
        </div>

      </div>
    </div>
  );
};
