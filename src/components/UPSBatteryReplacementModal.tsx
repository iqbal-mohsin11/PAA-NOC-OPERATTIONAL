import React, { useState, useEffect } from 'react';
import { jsPDF } from 'jspdf';
import {
  X,
  Printer,
  Download,
  Plus,
  Trash2,
  Save,
  RotateCcw,
  Sparkles,
  BatteryCharging,
  CheckCircle2,
  FileSpreadsheet,
  FileText,
  Loader2,
} from 'lucide-react';
import { UPSBatteryReplacementEntry } from '../types/inventory';
import { defaultUPSBatteryReplacementEntries } from '../data/upsFormsData';
import { useInventory } from '../context/InventoryContext';

interface UPSBatteryReplacementModalProps {
  onClose: () => void;
}

export const UPSBatteryReplacementModal: React.FC<UPSBatteryReplacementModalProps> = ({ onClose }) => {
  const { assets } = useInventory();

  // Load from localStorage or fall back to defaultUPSBatteryReplacementEntries
  const [entries, setEntries] = useState<UPSBatteryReplacementEntry[]>(() => {
    try {
      const saved = localStorage.getItem('paa_ups_battery_replacement_entries');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return defaultUPSBatteryReplacementEntries;
  });

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isProcessingPrint, setIsProcessingPrint] = useState(false);

  const handleCellChange = (index: number, field: keyof UPSBatteryReplacementEntry, value: any) => {
    const updated = [...entries];
    updated[index] = { ...updated[index], [field]: value };
    setEntries(updated);
  };

  const handleAddRow = () => {
    const nextSNo = entries.length + 1;
    const newEntry: UPSBatteryReplacementEntry = {
      sNo: nextSNo,
      itemDescription: 'UPS-',
      location: '',
      date: new Date().toISOString().split('T')[0],
      replacedBy: 'Engr. Mohsin (IT NOC)',
      signature: 'Mohsin / PAA',
      remarks: 'New batteries replaced & tested.',
    };
    setEntries([...entries, newEntry]);
  };

  const handleDeleteRow = (index: number) => {
    if (entries.length <= 1) return;
    const filtered = entries.filter((_, i) => i !== index).map((row, i) => ({ ...row, sNo: i + 1 }));
    setEntries(filtered);
  };

  const handleResetToDefault = () => {
    if (window.confirm('Reset this replacement table to official default records?')) {
      setEntries(defaultUPSBatteryReplacementEntries);
      localStorage.setItem('paa_ups_battery_replacement_entries', JSON.stringify(defaultUPSBatteryReplacementEntries));
    }
  };

  const handleAutoPopulateFromFleet = () => {
    const upsAssets = assets.filter((a) => !a.isRemoved && (a.category === 'UPS' || a.upsSpecs !== undefined));
    if (upsAssets.length === 0) {
      alert('No UPS assets found in current inventory.');
      return;
    }

    const newRows: UPSBatteryReplacementEntry[] = upsAssets.slice(0, 20).map((a, idx) => ({
      sNo: idx + 1,
      itemDescription: `${a.assetTag || a.id} (${a.brand} ${a.model})`,
      location: a.upsSpecs?.roomNo || a.location?.room || 'Airport Facility',
      date: a.upsSpecs?.lastBatteryChangeDate || '2024-11-20',
      replacedBy: 'Engr. Mohsin (IT NOC)',
      signature: 'Mohsin / PAA',
      remarks: `${a.upsSpecs?.noOfBatteries || 3}x ${a.upsSpecs?.batteryType || '12V VRLA'} replaced. Tested backup ${a.upsSpecs?.backupTime || '25m'}.`,
    }));

    // Pad to at least 20 rows if fewer
    while (newRows.length < 20) {
      const idx = newRows.length + 1;
      newRows.push({
        sNo: idx,
        itemDescription: 'UPS-',
        location: '',
        date: '',
        replacedBy: '',
        signature: '',
        remarks: '',
      });
    }

    setEntries(newRows);
  };

  const handleSave = () => {
    try {
      localStorage.setItem('paa_ups_battery_replacement_entries', JSON.stringify(entries));
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (e) {
      console.error(e);
    }
  };

  const handleExportCSV = () => {
    const headers = ['S.NO', 'ITEAM DESCRIPTION', 'LOCATION', 'DATE', 'REPLACED BY', 'SIGNATURE', 'REMARKS'];
    const rows = entries.map((r) => [
      r.sNo,
      `"${r.itemDescription.replace(/"/g, '""')}"`,
      `"${r.location.replace(/"/g, '""')}"`,
      `"${r.date}"`,
      `"${r.replacedBy.replace(/"/g, '""')}"`,
      `"${r.signature.replace(/"/g, '""')}"`,
      `"${r.remarks.replace(/"/g, '""')}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      'DETAILS REPLACEMENT OF UPS BATTERIES INSTALLED AT DIFFERENT LOCATIONS\n\n' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `DETAILS_REPLACEMENT_OF_UPS_BATTERIES_${new Date().toISOString().split('T')[0]}.csv`);
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
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text(
      'DETAILS REPLACEMENT OF UPS BATTERIES INSTALLED AT DIFFERENT LOCATIONS',
      pageWidth / 2,
      margin + 8,
      { align: 'center' }
    );

    // Underline
    doc.setLineWidth(0.3);
    doc.line(margin + 10, margin + 9.5, pageWidth - margin - 10, margin + 9.5);

    // Table Header
    const startY = margin + 14;
    const headerHeight = 7.5;
    const colWidths = [12, 38, 36, 22, 26, 22, 34];
    const colHeaders = [
      'S.NO',
      'ITEAM DESCRIPTION',
      'LOCATION',
      'DATE',
      'REPLACED BY',
      'SIGNATURE',
      'REMARKS',
    ];

    doc.setFillColor(241, 245, 249);
    doc.rect(margin, startY, contentWidth, headerHeight, 'FD');

    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);

    let curX = margin;
    colHeaders.forEach((header, i) => {
      const w = colWidths[i];
      if (i === 0 || i === 3) {
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

    entries.forEach((row, idx) => {
      if (y + rowHeight > pageHeight - margin - 12) {
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
          if (i === 0 || i === 3) {
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
        row.replacedBy || '',
        row.signature || '',
        row.remarks || '',
      ];

      cells.forEach((cellText, i) => {
        const w = colWidths[i];
        doc.setTextColor(15, 23, 42);
        if (i === 0 || i === 3) {
          if (i === 0) doc.setFont('helvetica', 'bold');
          doc.text(cellText, x + w / 2, y + 4.8, { align: 'center' });
          if (i === 0) doc.setFont('helvetica', 'normal');
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

    return doc;
  };

  const handleExportPDF = () => {
    try {
      setIsProcessingPrint(true);
      setStatusMessage('Generating official PDF...');
      const doc = buildPDFDoc();
      const dateStr = new Date().toISOString().split('T')[0];
      doc.save(`DETAILS_REPLACEMENT_OF_UPS_BATTERIES_${dateStr}.pdf`);
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

    const rowsHtml = entries
      .map(
        (r, i) => `
      <tr style="border-bottom: 1px solid #000; font-size: 10px; background: ${i % 2 === 1 ? '#f8fafc' : '#fff'};">
        <td style="border: 1px solid #000; padding: 4px 6px; text-align: center; font-weight: bold;">${r.sNo}</td>
        <td style="border: 1px solid #000; padding: 4px 6px; font-weight: bold;">${r.itemDescription || ''}</td>
        <td style="border: 1px solid #000; padding: 4px 6px;">${r.location || ''}</td>
        <td style="border: 1px solid #000; padding: 4px 6px; text-align: center;">${r.date || ''}</td>
        <td style="border: 1px solid #000; padding: 4px 6px;">${r.replacedBy || ''}</td>
        <td style="border: 1px solid #000; padding: 4px 6px;">${r.signature || ''}</td>
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
        <title>DETAILS REPLACEMENT OF UPS BATTERIES INSTALLED AT DIFFERENT LOCATIONS</title>
        <style>
          @page { size: A4 portrait; margin: 10mm; }
          body { font-family: Arial, Helvetica, sans-serif; color: #000; margin: 0; padding: 10px; font-size: 10px; }
          .container { border: 1.5px solid #000; padding: 12px; min-height: 96vh; box-sizing: border-box; }
          .title { font-size: 14px; font-weight: 900; text-decoration: underline; text-transform: uppercase; text-align: center; margin-bottom: 10px; }
          table { width: 100%; border-collapse: collapse; border: 1px solid #000; }
          th { border: 1px solid #000; background-color: #f1f5f9; padding: 6px 4px; font-size: 9px; font-weight: 900; text-transform: uppercase; }
          @media print {
            body { padding: 0; }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="title">DETAILS REPLACEMENT OF UPS BATTERIES INSTALLED AT DIFFERENT LOCATIONS</div>
          <table>
            <thead>
              <tr>
                <th style="width: 45px;">S.NO</th>
                <th style="width: 160px;">ITEAM DESCRIPTION</th>
                <th style="width: 140px;">LOCATION</th>
                <th style="width: 85px;">DATE</th>
                <th style="width: 110px;">REPLACED BY</th>
                <th style="width: 90px;">SIGNATURE</th>
                <th>REMARKS</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>
        </div>
      </body>
      </html>
    `;

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
            setStatusMessage('System print dialog opened!');
          } catch (e) {
            console.warn('Iframe print restricted:', e);
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
        
        {/* Modal Header & Action Toolbar (Hidden during browser print) */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 p-4 dark:border-slate-800 print:hidden">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-amber-500/10 p-2.5 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400">
              <BatteryCharging className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                  UPS Battery Replacement Official Form
                </h3>
                <span className="rounded-md bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-800 dark:text-amber-300 uppercase">
                  Different Locations
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Official form: "DETAILS REPLACEMENT OF UPS BATTERIES INSTALLED AT DIFFERENT LOCATIONS"
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
              onClick={handleAutoPopulateFromFleet}
              className="flex items-center gap-1.5 rounded-lg border border-amber-300 bg-amber-50 px-2.5 py-1.5 text-xs font-bold text-amber-900 hover:bg-amber-100 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-300 transition"
              title="Populate table with live inventory UPS units"
            >
              <Sparkles className="h-3.5 w-3.5 text-amber-600" />
              <span className="hidden sm:inline">Fleet Auto-fill</span>
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
              title="Reset to default 20 rows"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>

            <button
              type="button"
              onClick={handleSave}
              className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-500 transition shadow-xs"
            >
              <Save className="h-3.5 w-3.5" />
              <span>Save Table</span>
            </button>

            <button
              type="button"
              onClick={handleExportPDF}
              disabled={isProcessingPrint}
              className="flex items-center gap-1.5 rounded-lg border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-900 hover:bg-amber-100 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-300 transition shadow-xs disabled:opacity-50"
              title="Download official PDF replacement sheet"
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
            
            {/* Sheet Title Matching Uploaded Image Exactly */}
            <div className="mb-4 text-center">
              <h1 className="text-sm sm:text-base font-black uppercase tracking-wider underline underline-offset-4 decoration-2 text-slate-950 dark:text-white print:text-black">
                DETAILS REPLACEMENT OF UPS BATTERIES INSTALLED AT DIFFERENT LOCATIONS
              </h1>
              <p className="mt-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400 print:text-gray-700">
                Pakistan Airports Authority • Information Technology Directorate • NOC Power Systems
              </p>
            </div>

            {/* Grid Table Matching Image 1 Exactly */}
            <div className="overflow-x-auto border border-black print:border-black">
              <table className="w-full border-collapse text-left text-xs font-sans">
                <thead>
                  <tr className="border-b-2 border-black bg-slate-100 dark:bg-slate-800 text-center font-black uppercase tracking-wider text-slate-950 dark:text-white print:bg-gray-100 print:text-black print:border-black">
                    <th className="w-12 border-r border-black p-2 text-center">S.NO</th>
                    <th className="w-48 sm:w-60 border-r border-black p-2">ITEAM DESCRIPTION</th>
                    <th className="w-40 border-r border-black p-2">LOCATION</th>
                    <th className="w-28 border-r border-black p-2">DATE</th>
                    <th className="w-36 border-r border-black p-2">REPLACED BY</th>
                    <th className="w-32 border-r border-black p-2">SIGNATURE</th>
                    <th className="border-black p-2">REMARKS</th>
                    <th className="w-10 border-black p-1 print:hidden"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black">
                  {entries.map((row, index) => (
                    <tr
                      key={row.sNo || index}
                      className="border-b border-black hover:bg-amber-50/40 dark:hover:bg-amber-950/20 transition print:hover:bg-transparent"
                    >
                      {/* S.NO */}
                      <td className="border-r border-black p-1 text-center font-bold text-slate-900 dark:text-slate-100 print:text-black">
                        {row.sNo}
                      </td>

                      {/* ITEAM DESCRIPTION */}
                      <td className="border-r border-black p-1">
                        <input
                          type="text"
                          value={row.itemDescription}
                          onChange={(e) => handleCellChange(index, 'itemDescription', e.target.value)}
                          className="w-full bg-transparent px-1.5 py-1 font-semibold text-slate-900 outline-none focus:bg-amber-50/80 dark:text-slate-100 dark:focus:bg-slate-800 print:p-0 print:text-black"
                          placeholder="e.g. UPS-2215 (Eaton 1kVA)"
                        />
                      </td>

                      {/* LOCATION */}
                      <td className="border-r border-black p-1">
                        <input
                          type="text"
                          value={row.location}
                          onChange={(e) => handleCellChange(index, 'location', e.target.value)}
                          className="w-full bg-transparent px-1.5 py-1 text-slate-800 outline-none focus:bg-amber-50/80 dark:text-slate-200 dark:focus:bg-slate-800 print:p-0 print:text-black"
                          placeholder="e.g. Level 6 / Room 104"
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

                      {/* REPLACED BY */}
                      <td className="border-r border-black p-1">
                        <input
                          type="text"
                          value={row.replacedBy}
                          onChange={(e) => handleCellChange(index, 'replacedBy', e.target.value)}
                          className="w-full bg-transparent px-1.5 py-1 text-slate-800 outline-none focus:bg-amber-50/80 dark:text-slate-200 dark:focus:bg-slate-800 print:p-0 print:text-black"
                          placeholder="Technician name"
                        />
                      </td>

                      {/* SIGNATURE */}
                      <td className="border-r border-black p-1">
                        <input
                          type="text"
                          value={row.signature}
                          onChange={(e) => handleCellChange(index, 'signature', e.target.value)}
                          className="w-full bg-transparent px-1.5 py-1 italic font-serif text-slate-800 outline-none focus:bg-amber-50/80 dark:text-slate-200 dark:focus:bg-slate-800 print:p-0 print:text-black"
                          placeholder="Signature"
                        />
                      </td>

                      {/* REMARKS */}
                      <td className="p-1 border-r border-black print:border-r-0">
                        <input
                          type="text"
                          value={row.remarks}
                          onChange={(e) => handleCellChange(index, 'remarks', e.target.value)}
                          className="w-full bg-transparent px-1.5 py-1 text-slate-700 outline-none focus:bg-amber-50/80 dark:text-slate-300 dark:focus:bg-slate-800 print:p-0 print:text-black"
                          placeholder="e.g. 3x 12V 7.2Ah replaced. Tested backup OK."
                        />
                      </td>

                      {/* Action (Hidden in print) */}
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

            {/* Official Footer Verification Block for Printing */}
            <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 gap-6 pt-4 text-xs print:grid print:pt-6 print:border-t print:border-black">
              <div>
                <span className="font-bold text-slate-900 dark:text-slate-200 print:text-black">
                  Prepared By (NOC Tech):
                </span>
                <div className="mt-6 border-b border-black dark:border-slate-500 w-44"></div>
                <p className="text-[10px] text-slate-500 mt-1">Signature & Date</p>
              </div>

              <div>
                <span className="font-bold text-slate-900 dark:text-slate-200 print:text-black">
                  Verified By (Supervisor IT):
                </span>
                <div className="mt-6 border-b border-black dark:border-slate-500 w-44"></div>
                <p className="text-[10px] text-slate-500 mt-1">Signature & Date</p>
              </div>

              <div className="col-span-2 sm:col-span-1">
                <span className="font-bold text-slate-900 dark:text-slate-200 print:text-black">
                  Approved By (O/IC IT PAA):
                </span>
                <div className="mt-6 border-b border-black dark:border-slate-500 w-44"></div>
                <p className="text-[10px] text-slate-500 mt-1">Signature & Official Stamp</p>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};
