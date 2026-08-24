import React, { useState } from 'react';
import { jsPDF } from 'jspdf';
import { useInventory } from '../context/InventoryContext';
import { AssetItem, Department, AuditLog, MaintenanceRecord } from '../types/inventory';
import {
  FileBarChart,
  FileSpreadsheet,
  Printer,
  Download,
  Filter,
  Shield,
  Building,
  Calendar,
  CheckCircle2,
  Search,
  FileText,
  ShieldAlert,
  Clock,
  Wrench,
  UserCheck,
  Activity,
  HardDrive,
  Layers,
  AlertTriangle,
} from 'lucide-react';
import * as XLSX from 'xlsx';

export const ReportsView: React.FC = () => {
  const { assets, settings, allDepartments, tickets, maintenanceRecords, auditLogs } = useInventory();

  const [reportType, setReportType] = useState<string>('Asset Inventory Report');
  const [selectedDept, setSelectedDept] = useState<string>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [auditSeverity, setAuditSeverity] = useState<string>('ALL');
  const [startDate, setStartDate] = useState<string>('2026-01-01');
  const [endDate, setEndDate] = useState<string>(new Date().toISOString().split('T')[0]);

  // Checkbox Options
  const [includeSignature, setIncludeSignature] = useState<boolean>(true);
  const [includeLogo, setIncludeLogo] = useState<boolean>(true);
  const [includeMetadata, setIncludeMetadata] = useState<boolean>(true);

  // Available unique categories
  const allCategories = Array.from(new Set(assets.map((a) => a.category).filter(Boolean))).sort();

  // Filtered Assets for Asset Reports
  const filteredAssets = assets.filter((a) => {
    if (reportType === 'Soft Removed / Archived Assets') {
      if (!a.isRemoved) return false;
    } else {
      if (a.isRemoved) return false;
    }

    if (selectedDept !== 'ALL' && a.department !== selectedDept) return false;
    if (selectedCategory !== 'ALL' && a.category !== selectedCategory) return false;

    if (reportType === 'Printers & Scanners Report') {
      if (a.category !== 'Printer' && a.category !== 'Scanner') return false;
    } else if (reportType === 'Network Switches & Router Infrastructure') {
      if (!['Network Switch', 'Core Switch', 'Distribution Switch', 'Access Switch', 'Router', 'Firewall', 'Server', 'Access Point'].includes(a.category))
        return false;
    } else if (reportType === 'Faulty & Repairing Devices Report') {
      if (a.status !== 'Under Repair' && a.status !== 'Faulty') return false;
    } else if (reportType === 'Warranty Expiring Report') {
      if (!a.warrantyExpiry) return false;
      const expDate = new Date(a.warrantyExpiry);
      const ninetyDaysFromNow = new Date(new Date().getTime() + 90 * 24 * 60 * 60 * 1000);
      if (expDate > ninetyDaysFromNow) return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = a.name.toLowerCase().includes(q);
      const matchId = a.id.toLowerCase().includes(q);
      const matchSerial = a.serialNumber.toLowerCase().includes(q);
      const matchUser = a.assignedUser?.toLowerCase().includes(q) || false;
      const matchCategory = a.category.toLowerCase().includes(q);
      if (!matchName && !matchId && !matchSerial && !matchUser && !matchCategory) return false;
    }

    return true;
  });

  // Filtered Audit Logs
  const filteredAuditLogs = auditLogs.filter((log) => {
    if (auditSeverity !== 'ALL' && log.type !== auditSeverity) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchAction = log.action.toLowerCase().includes(q);
      const matchActor = log.actor.toLowerCase().includes(q);
      const matchDetails = log.details.toLowerCase().includes(q);
      const matchAsset = log.assetId?.toLowerCase().includes(q) || false;
      if (!matchAction && !matchActor && !matchDetails && !matchAsset) return false;
    }

    return true;
  });

  // Filtered Maintenance Records
  const filteredMaintenance = maintenanceRecords.filter((rec) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchDev = rec.deviceName.toLowerCase().includes(q);
      const matchEng = rec.engineer.toLowerCase().includes(q);
      const matchDesc = rec.description.toLowerCase().includes(q);
      const matchAsset = rec.assetId.toLowerCase().includes(q);
      if (!matchDev && !matchEng && !matchDesc && !matchAsset) return false;
    }
    return true;
  });

  const handlePrint = () => {
    try {
      const el = document.getElementById('printable-report-document');
      if (el) {
        // Create an isolated hidden iframe for printing
        const iframe = document.createElement('iframe');
        iframe.style.position = 'fixed';
        iframe.style.right = '0';
        iframe.style.bottom = '0';
        iframe.style.width = '0';
        iframe.style.height = '0';
        iframe.style.border = '0';
        document.body.appendChild(iframe);

        const iframeDoc = iframe.contentWindow?.document;
        if (iframeDoc) {
          iframeDoc.open();
          iframeDoc.write(`
            <!DOCTYPE html>
            <html>
              <head>
                <title>${reportType} - PAA Official Report</title>
                <style>
                  @page { size: A4 portrait; margin: 10mm; }
                  body { font-family: system-ui, -apple-system, sans-serif; color: #000 !important; background: #fff !important; margin: 0; padding: 15px; }
                  table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 11px; }
                  th, td { border: 1px solid #cbd5e1 !important; padding: 6px 8px; text-align: left; color: #000 !important; background: transparent !important; }
                  th { background-color: #f1f5f9 !important; font-weight: bold; text-transform: uppercase; font-size: 10px; }
                  .border-b-2 { border-bottom: 2px solid #000 !important; }
                  .flex { display: flex; }
                  .items-center { align-items: center; }
                  .justify-between { justify-content: space-between; }
                  .gap-3 { gap: 12px; }
                  .gap-2 { gap: 8px; }
                  .text-right { text-align: right; }
                  .font-mono { font-family: monospace; }
                  .font-bold, .font-black, .font-extrabold { font-weight: bold; }
                  .text-xl { font-size: 18px; }
                  .text-xs { font-size: 11px; }
                  .uppercase { text-transform: uppercase; }
                  .no-print, button, .print\\:hidden { display: none !important; }
                </style>
              </head>
              <body>
                ${el.outerHTML}
              </body>
            </html>
          `);
          iframeDoc.close();

          setTimeout(() => {
            try {
              iframe.contentWindow?.focus();
              iframe.contentWindow?.print();
            } catch (err) {
              console.warn('Iframe print failed, falling back to window.print():', err);
              window.print();
            } finally {
              setTimeout(() => {
                try {
                  document.body.removeChild(iframe);
                } catch (e) {
                  // ignore
                }
              }, 3000);
            }
          }, 250);
          return;
        }
      }

      window.print();
    } catch (e) {
      console.warn('Print failed or blocked, attempting PDF download fallback:', e);
      try {
        handleGeneratePdf();
      } catch (pdfErr) {
        alert('Unable to invoke print. Please use the "Download Official PDF" button instead.');
      }
    }
  };

  const handleExportExcel = () => {
    let data: any[] = [];
    let sheetName = 'PAA_Audit_Report';

    if (reportType === 'System Audit Trail & Security Logs') {
      sheetName = 'System_Audit_Logs';
      data = filteredAuditLogs.map((log) => ({
        'Log ID': log.id,
        Timestamp: log.timestamp,
        Actor: log.actor,
        Action: log.action,
        'Target Asset ID': log.assetId || 'N/A',
        Severity: log.type.toUpperCase(),
        Details: log.details,
      }));
    } else if (reportType === 'Maintenance & Service History Logs') {
      sheetName = 'Maintenance_Logs';
      data = filteredMaintenance.map((m) => ({
        'Record ID': m.id,
        Date: m.date,
        'Asset ID': m.assetId,
        'Device Name': m.deviceName,
        Engineer: m.engineer,
        'Parts Replaced': m.partsReplaced,
        'Cost (PKR)': m.cost,
        Description: m.description,
        Remarks: m.remarks,
      }));
    } else {
      data = filteredAssets.map((a) => ({
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
    }

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    XLSX.writeFile(
      wb,
      `PAA_Official_${reportType.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.xlsx`
    );
  };

  // GENERATE PDF REPORT FUNCTION
  const handleGeneratePdf = () => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    let pageNumber = 1;

    // Helper to render page top header
    const renderPdfHeader = () => {
      // Dark Slate Header Banner
      doc.setFillColor(15, 23, 42); // slate 900
      doc.rect(0, 0, 210, 32, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text(`${settings.orgName || 'PAKISTAN AIRPORTS AUTHORITY'}`, 14, 9);

      doc.setFontSize(13);
      doc.text(`${reportType.toUpperCase()}`, 14, 16);

      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(192, 132, 252);
      doc.text(
        `OFFICIAL AUDIT & COMPLIANCE REPORT • ${settings.airportName || 'AIIAP LAHORE'}`,
        14,
        22
      );

      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(203, 213, 225);
      doc.text(
        `Report ID: REP-${Date.now().toString().slice(-6)}  |  Date: ${new Date().toLocaleDateString('en-GB')}  |  Dept: ${selectedDept}  |  Category: ${selectedCategory}`,
        14,
        28
      );
    };

    renderPdfHeader();

    let y = 38;

    // Summary Box
    if (includeMetadata) {
      doc.setFillColor(248, 250, 252);
      doc.rect(14, y, 182, 12, 'F');
      doc.setDrawColor(203, 213, 225);
      doc.rect(14, y, 182, 12, 'S');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(30, 41, 59);

      let recordCountText = '';
      if (reportType === 'System Audit Trail & Security Logs') {
        recordCountText = `${filteredAuditLogs.length} Security & System Logs`;
      } else if (reportType === 'Maintenance & Service History Logs') {
        recordCountText = `${filteredMaintenance.length} Maintenance Records`;
      } else {
        recordCountText = `${filteredAssets.length} Active Asset Items`;
      }

      doc.text(`Report Subject: ${reportType}`, 18, y + 5);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(71, 85, 105);
      doc.text(
        `Total Filtered Entries: ${recordCountText}  |  Dept: ${selectedDept}  |  Equipment: ${selectedCategory}  |  Classification: OFFICIAL AUDIT`,
        18,
        9.5 + y
      );

      y += 16;
    }

    // RENDER DATA TABLES BASED ON REPORT TYPE
    if (reportType === 'System Audit Trail & Security Logs') {
      // Audit Logs Table Header
      doc.setFillColor(241, 245, 249);
      doc.rect(14, y, 182, 7, 'F');
      doc.setDrawColor(203, 213, 225);
      doc.rect(14, y, 182, 7, 'S');

      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 41, 59);
      doc.text('#', 16, y + 5);
      doc.text('Timestamp', 24, y + 5);
      doc.text('Actor / User', 58, y + 5);
      doc.text('Action / Event', 86, y + 5);
      doc.text('Asset ID', 122, y + 5);
      doc.text('Type', 142, y + 5);
      doc.text('Details', 160, y + 5);

      y += 7;

      filteredAuditLogs.forEach((log, idx) => {
        const detailsLines = doc.splitTextToSize(log.details || 'N/A', 33);
        const rowHeight = Math.max(10, detailsLines.length * 3.5 + 4);

        if (y + rowHeight > 265) {
          doc.addPage();
          pageNumber++;
          renderPdfHeader();
          y = 38;

          doc.setFillColor(241, 245, 249);
          doc.rect(14, y, 182, 7, 'F');
          doc.setDrawColor(203, 213, 225);
          doc.rect(14, y, 182, 7, 'S');
          doc.setFontSize(8);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(30, 41, 59);
          doc.text('#', 16, y + 5);
          doc.text('Timestamp', 24, y + 5);
          doc.text('Actor / User', 58, y + 5);
          doc.text('Action / Event', 86, y + 5);
          doc.text('Asset ID', 122, y + 5);
          doc.text('Type', 142, y + 5);
          doc.text('Details', 160, y + 5);
          y += 7;
        }

        doc.setFillColor(idx % 2 === 0 ? 255 : 250, idx % 2 === 0 ? 255 : 250, idx % 2 === 0 ? 255 : 250);
        doc.rect(14, y, 182, rowHeight, 'F');
        doc.setDrawColor(226, 232, 240);
        doc.rect(14, y, 182, rowHeight, 'S');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.setTextColor(15, 23, 42);
        doc.text(`${idx + 1}`, 16, y + 4.5);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(6.5);
        doc.text(log.timestamp, 24, y + 4.5);

        doc.setFontSize(7);
        doc.setFont('helvetica', 'bold');
        doc.text(log.actor, 58, y + 4.5);

        doc.setFontSize(7);
        doc.setTextColor(30, 41, 59);
        const actionTxt = doc.splitTextToSize(log.action, 34);
        doc.text(actionTxt, 86, y + 4.5);

        doc.setFont('helvetica', 'mono');
        doc.setFontSize(6.5);
        doc.setTextColor(100, 116, 139);
        doc.text(log.assetId || '—', 122, y + 4.5);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(6.5);
        if (log.type === 'danger') doc.setTextColor(220, 38, 38);
        else if (log.type === 'warning') doc.setTextColor(217, 119, 6);
        else if (log.type === 'success') doc.setTextColor(16, 185, 129);
        else doc.setTextColor(37, 99, 235);
        doc.text(log.type.toUpperCase(), 142, y + 4.5);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(6.5);
        doc.setTextColor(51, 65, 85);
        doc.text(detailsLines, 160, y + 4);

        y += rowHeight;
      });
    } else if (reportType === 'Maintenance & Service History Logs') {
      // Maintenance Table Header
      doc.setFillColor(241, 245, 249);
      doc.rect(14, y, 182, 7, 'F');
      doc.setDrawColor(203, 213, 225);
      doc.rect(14, y, 182, 7, 'S');

      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 41, 59);
      doc.text('#', 16, y + 5);
      doc.text('Date', 24, y + 5);
      doc.text('Asset ID / Device', 48, y + 5);
      doc.text('Engineer', 95, y + 5);
      doc.text('Parts Replaced', 125, y + 5);
      doc.text('Cost (PKR)', 165, y + 5);

      y += 7;

      filteredMaintenance.forEach((m, idx) => {
        const rowHeight = 11;
        if (y + rowHeight > 265) {
          doc.addPage();
          pageNumber++;
          renderPdfHeader();
          y = 38;

          doc.setFillColor(241, 245, 249);
          doc.rect(14, y, 182, 7, 'F');
          doc.setDrawColor(203, 213, 225);
          doc.rect(14, y, 182, 7, 'S');
          doc.setFontSize(8);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(30, 41, 59);
          doc.text('#', 16, y + 5);
          doc.text('Date', 24, y + 5);
          doc.text('Asset ID / Device', 48, y + 5);
          doc.text('Engineer', 95, y + 5);
          doc.text('Parts Replaced', 125, y + 5);
          doc.text('Cost (PKR)', 165, y + 5);
          y += 7;
        }

        doc.setFillColor(idx % 2 === 0 ? 255 : 250, idx % 2 === 0 ? 255 : 250, idx % 2 === 0 ? 255 : 250);
        doc.rect(14, y, 182, rowHeight, 'F');
        doc.setDrawColor(226, 232, 240);
        doc.rect(14, y, 182, rowHeight, 'S');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.setTextColor(15, 23, 42);
        doc.text(`${idx + 1}`, 16, y + 5);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.text(m.date, 24, y + 5);

        doc.setFont('helvetica', 'bold');
        doc.text(m.assetId, 48, y + 4.5);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(6.5);
        doc.setTextColor(100, 116, 139);
        doc.text(m.deviceName.substring(0, 26), 48, y + 8.5);

        doc.setFontSize(7);
        doc.setTextColor(15, 23, 42);
        doc.text(m.engineer, 95, y + 5);

        doc.setFontSize(6.5);
        doc.setTextColor(51, 65, 85);
        doc.text(m.partsReplaced || 'N/A', 125, y + 5);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.setTextColor(16, 185, 129);
        doc.text(`Rs. ${m.cost?.toLocaleString() || '0'}`, 165, y + 5);

        y += rowHeight;
      });
    } else {
      // Standard Asset Directory Table Header
      doc.setFillColor(241, 245, 249);
      doc.rect(14, y, 182, 7, 'F');
      doc.setDrawColor(203, 213, 225);
      doc.rect(14, y, 182, 7, 'S');

      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 41, 59);
      doc.text('#', 16, y + 5);
      doc.text('Asset ID', 22, y + 5);
      doc.text('Device Name & Model', 44, y + 5);
      doc.text('Category', 92, y + 5);
      doc.text('Dept', 122, y + 5);
      doc.text('Assigned User', 140, y + 5);
      doc.text('Serial No', 168, y + 5);

      y += 7;

      filteredAssets.forEach((asset, idx) => {
        const rowHeight = 11;

        if (y + rowHeight > 265) {
          doc.addPage();
          pageNumber++;
          renderPdfHeader();
          y = 38;

          doc.setFillColor(241, 245, 249);
          doc.rect(14, y, 182, 7, 'F');
          doc.setDrawColor(203, 213, 225);
          doc.rect(14, y, 182, 7, 'S');

          doc.setFontSize(8);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(30, 41, 59);
          doc.text('#', 16, y + 5);
          doc.text('Asset ID', 22, y + 5);
          doc.text('Device Name & Model', 44, y + 5);
          doc.text('Category', 92, y + 5);
          doc.text('Dept', 122, y + 5);
          doc.text('Assigned User', 140, y + 5);
          doc.text('Serial No', 168, y + 5);

          y += 7;
        }

        doc.setFillColor(idx % 2 === 0 ? 255 : 250, idx % 2 === 0 ? 255 : 250, idx % 2 === 0 ? 255 : 250);
        doc.rect(14, y, 182, rowHeight, 'F');
        doc.setDrawColor(226, 232, 240);
        doc.rect(14, y, 182, rowHeight, 'S');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.setTextColor(15, 23, 42);
        doc.text(`${idx + 1}`, 16, y + 5);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7);
        doc.text(asset.id, 22, y + 5);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.text(asset.name.substring(0, 26), 44, y + 4.5);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(6.5);
        doc.setTextColor(100, 116, 139);
        doc.text(`${asset.brand} ${asset.model}`.substring(0, 28), 44, y + 8.5);

        doc.setFontSize(7);
        doc.setTextColor(15, 23, 42);
        doc.text(asset.category, 92, y + 5);

        doc.setFont('helvetica', 'bold');
        doc.setTextColor(16, 185, 129);
        doc.text(asset.department, 122, y + 5);

        doc.setFont('helvetica', 'normal');
        doc.setTextColor(15, 23, 42);
        doc.text((asset.assignedUser || '—').substring(0, 18), 140, y + 5);

        doc.setFont('helvetica', 'mono');
        doc.setFontSize(6.5);
        doc.setTextColor(71, 85, 105);
        doc.text((asset.serialNumber || 'N/A').substring(0, 16), 168, y + 5);

        y += rowHeight;
      });
    }

    // SIGNATURE & SEAL BOXES SECTION
    if (includeSignature) {
      if (y + 42 > 265) {
        doc.addPage();
        pageNumber++;
        renderPdfHeader();
        y = 38;
      } else {
        y += 6;
      }

      doc.setTextColor(15, 23, 42);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.text('OFFICIAL AUTHORIZATION & COMPLIANCE SIGNATURE BLOCK', 14, y);

      y += 4;

      const sigWidth = 58;
      const sigHeight = 30;

      // Box 1: Prepared By
      doc.setDrawColor(203, 213, 225);
      doc.setFillColor(255, 255, 255);
      doc.rect(14, y, sigWidth, sigHeight, 'S');
      doc.setFillColor(241, 245, 249);
      doc.rect(14, y, sigWidth, 6, 'F');
      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 41, 59);
      doc.text('1. PREPARED BY', 16, y + 4.5);
      doc.setFontSize(6.5);
      doc.setFont('helvetica', 'normal');
      doc.text('IT Inspector / Assistant Officer', 16, y + 11);
      doc.line(16, y + 21, 66, y + 21);
      doc.setFontSize(6);
      doc.setTextColor(100, 116, 139);
      doc.text('Signature & Date', 16, y + 25);

      // Box 2: Verified By
      doc.rect(76, y, sigWidth, sigHeight, 'S');
      doc.setFillColor(241, 245, 249);
      doc.rect(76, y, sigWidth, 6, 'F');
      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 41, 59);
      doc.text('2. VERIFIED BY', 78, y + 4.5);
      doc.setFontSize(6.5);
      doc.setFont('helvetica', 'normal');
      doc.text('Deputy Manager IT Operations', 78, y + 11);
      doc.line(78, y + 21, 128, y + 21);
      doc.setFontSize(6);
      doc.setTextColor(100, 116, 139);
      doc.text('Signature & Seal Box', 78, y + 25);

      // Box 3: Approved By
      doc.rect(138, y, sigWidth, sigHeight, 'S');
      doc.setFillColor(241, 245, 249);
      doc.rect(138, y, sigWidth, 6, 'F');
      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 41, 59);
      doc.text('3. APPROVED BY', 140, y + 4.5);
      doc.setFontSize(6.5);
      doc.setFont('helvetica', 'normal');
      doc.text('Airport Manager / Director IT', 140, y + 11);
      doc.line(140, y + 21, 190, y + 21);
      doc.setFontSize(6);
      doc.setTextColor(100, 116, 139);
      doc.text('Airport Authority Stamp', 140, y + 25);

      y += sigHeight + 4;
    }

    // Add footers on all pages
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(148, 163, 184);
      doc.text(
        `PAA Sentinel v5.0 • Official Audit Copy • ${settings.orgName || 'Pakistan Airports Authority'} • Confidential`,
        14,
        287
      );
      doc.text(`Page ${i} of ${pageCount}`, 180, 287);
    }

    doc.save(`PAA_Official_${reportType.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Top Action Banner */}
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:flex-row sm:items-center sm:justify-between print:hidden">
        <div>
          <div className="flex items-center gap-2">
            <FileBarChart className="h-5 w-5 text-emerald-500" />
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Official Audit & Compliance PDF Reports Engine
            </h2>
          </div>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            Generate, view, and export official PAA IT Sentinel audit logs and infrastructure reports as printable PDFs or Excel files.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleGeneratePdf}
            className="flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-xs font-bold text-white shadow-md hover:bg-rose-500 transition"
          >
            <Download className="h-4 w-4" />
            <span>Download Official PDF</span>
          </button>

          <button
            type="button"
            onClick={handleExportExcel}
            className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-md hover:bg-emerald-500 transition"
          >
            <FileSpreadsheet className="h-4 w-4" />
            <span>Export Excel</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white shadow-md hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 transition"
          >
            <Printer className="h-4 w-4" />
            <span>Print Paper Copy</span>
          </button>
        </div>
      </div>

      {/* Filter & Scope Selection Controls (Hidden in Print) */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-6 print:hidden">
        {/* Section Title */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <Filter className="h-4 w-4 text-rose-500" />
              <span>Select Department, Equipment & Report Scope</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Click buttons below to filter reports by Department or Equipment type, then generate as PDF or Excel.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase">Export Format:</span>
            <button
              type="button"
              onClick={handleGeneratePdf}
              className="flex items-center gap-1.5 rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-rose-500 transition"
            >
              <Download className="h-3.5 w-3.5" />
              <span>PDF Report</span>
            </button>
            <button
              type="button"
              onClick={handleExportExcel}
              className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-500 transition"
            >
              <FileSpreadsheet className="h-3.5 w-3.5" />
              <span>Excel Sheet</span>
            </button>
          </div>
        </div>

        {/* 1. Select Report Type Buttons */}
        <div>
          <label className="block text-xs font-extrabold text-slate-800 dark:text-slate-200 mb-2 uppercase tracking-wide">
            1. Select Report Category
          </label>
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'Asset Inventory Report', label: '📋 Asset Inventory' },
              { id: 'System Audit Trail & Security Logs', label: '🛡️ Audit & Security Logs' },
              { id: 'Maintenance & Service History Logs', label: '🔧 Maintenance Logs' },
              { id: 'Printers & Scanners Report', label: '🖨️ Printers & Scanners' },
              { id: 'Network Switches & Router Infrastructure', label: '🌐 Network & Switches' },
              { id: 'Warranty Expiring Report', label: '⚠️ Warranty Expiring' },
              { id: 'Faulty & Repairing Devices Report', label: '🛠️ Faulty / Repairing' },
              { id: 'Soft Removed / Archived Assets', label: '📦 Soft Removed / Archived' },
            ].map((rep) => {
              const isActive = reportType === rep.id;
              return (
                <button
                  key={rep.id}
                  type="button"
                  onClick={() => setReportType(rep.id)}
                  className={`rounded-xl px-3 py-2 text-xs font-bold transition flex items-center gap-1.5 border ${
                    isActive
                      ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 dark:hover:bg-slate-700'
                  }`}
                >
                  <span>{rep.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Select Department Buttons */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wide flex items-center gap-1.5">
              <Building className="h-3.5 w-3.5 text-blue-500" />
              <span>2. Select Department</span>
            </label>
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-bold dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              <option value="ALL">All Departments ({allDepartments.length})</option>
              {allDepartments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept} Department
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {['ALL', 'IT', 'CNS', 'Cargo', 'Operations', 'Finance', 'Security', 'Engineering', 'Works', 'Fire', 'Administration'].map((dept) => {
              const isActive = selectedDept === dept;
              return (
                <button
                  key={dept}
                  type="button"
                  onClick={() => setSelectedDept(dept)}
                  className={`rounded-lg px-2.5 py-1.5 text-xs font-bold transition border ${
                    isActive
                      ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 dark:bg-slate-800/80 dark:text-slate-300 dark:border-slate-700 dark:hover:bg-slate-700'
                  }`}
                >
                  {dept === 'ALL' ? '🏢 All Departments' : dept}
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. Select Equipment / Device Category Buttons */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wide flex items-center gap-1.5">
              <HardDrive className="h-3.5 w-3.5 text-purple-500" />
              <span>3. Select Equipment / Category</span>
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-bold dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              <option value="ALL">All Equipment Types</option>
              {allCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {['ALL', 'Desktop PC', 'Laptop', 'Printer', 'Scanner', 'Network Switch', 'Router', 'Server', 'UPS', 'IP Phone', 'Monitor'].map((cat) => {
              const isActive = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`rounded-lg px-2.5 py-1.5 text-xs font-bold transition border ${
                    isActive
                      ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 dark:bg-slate-800/80 dark:text-slate-300 dark:border-slate-700 dark:hover:bg-slate-700'
                  }`}
                >
                  {cat === 'ALL' ? '💻 All Equipment' : cat}
                </button>
              );
            })}
          </div>
        </div>

        {/* Search Keyword & Severity Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-slate-100 dark:border-slate-800">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Search Keyword Filter
            </label>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search report entries..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-8 pr-3 p-2 text-xs font-medium dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              />
            </div>
          </div>

          {reportType === 'System Audit Trail & Security Logs' && (
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Audit Severity Filter
              </label>
              <select
                value={auditSeverity}
                onChange={(e) => setAuditSeverity(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2 text-xs font-bold dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              >
                <option value="ALL">All Severities</option>
                <option value="info">Info / Routine</option>
                <option value="success">Success / Normal</option>
                <option value="warning">Warning / Caution</option>
                <option value="danger">Danger / Critical</option>
              </select>
            </div>
          )}
        </div>

        {/* Options Checkboxes */}
        <div className="flex flex-wrap items-center gap-6 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={includeSignature}
              onChange={(e) => setIncludeSignature(e.target.checked)}
              className="rounded accent-rose-600 h-4 w-4"
            />
            <span>Include Official Authorization & Signature Block</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={includeLogo}
              onChange={(e) => setIncludeLogo(e.target.checked)}
              className="rounded accent-rose-600 h-4 w-4"
            />
            <span>Include PAA Header Banner</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={includeMetadata}
              onChange={(e) => setIncludeMetadata(e.target.checked)}
              className="rounded accent-rose-600 h-4 w-4"
            />
            <span>Include Audit Metadata & Summary Line</span>
          </label>
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 print:hidden">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
            <Layers className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-500">Filtered Records</p>
            <p className="text-lg font-black text-slate-900 dark:text-white">
              {reportType === 'System Audit Trail & Security Logs'
                ? filteredAuditLogs.length
                : reportType === 'Maintenance & Service History Logs'
                ? filteredMaintenance.length
                : filteredAssets.length}
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
            <Building className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-500">Department Scope</p>
            <p className="text-base font-bold text-slate-900 dark:text-white">{selectedDept}</p>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
            <HardDrive className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-500">Equipment Type</p>
            <p className="text-base font-bold text-slate-900 dark:text-white">{selectedCategory}</p>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400">
            <ShieldAlert className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-500">Classification</p>
            <p className="text-base font-extrabold text-rose-600 dark:text-rose-400">Official PAA Audit</p>
          </div>
        </div>
      </div>

      {/* Official Printable Report Document Container */}
      <div id="printable-report-document" className="rounded-2xl border border-slate-200 bg-white p-8 shadow-md dark:border-slate-800 dark:bg-slate-900 text-slate-900 dark:text-slate-100 print:shadow-none print:border-none print:p-0">
        {/* Document Official Header */}
        {includeLogo && (
          <div className="flex items-center justify-between border-b-2 border-slate-900 pb-4 mb-6 dark:border-slate-100">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-700 text-white font-black text-xl">
                PAA
              </div>
              <div>
                <h1 className="text-xl font-black uppercase tracking-tight text-slate-900 dark:text-white">
                  {settings.orgName || 'PAKISTAN AIRPORTS AUTHORITY'}
                </h1>
                <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
                  PAA Sentinel v5.0 • IT Infrastructure & Asset Management
                </p>
                <p className="text-[11px] text-slate-500">{settings.airportName || 'All Pakistan Airports'}</p>
              </div>
            </div>

            <div className="text-right text-xs">
              <div className="font-mono font-bold text-slate-900 dark:text-white">
                REPORT ID: REP-{Date.now().toString().slice(-6)}
              </div>
              <div className="text-slate-500 mt-0.5">Generated Date: {new Date().toLocaleDateString('en-GB')}</div>
              <div className="text-slate-500 font-bold text-rose-600">Classification: OFFICIAL AUDIT</div>
            </div>
          </div>
        )}

        {/* Report Title & Scope Summary */}
        {includeMetadata && (
          <div className="mb-6 rounded-xl bg-slate-50 p-4 border border-slate-200 dark:bg-slate-800/60 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-extrabold text-slate-900 dark:text-white">{reportType}</h2>
                <p className="text-xs text-slate-500">
                  Department: <span className="font-bold text-slate-700 dark:text-slate-300">{selectedDept}</span> • Equipment: <span className="font-bold text-slate-700 dark:text-slate-300">{selectedCategory}</span>
                </p>
              </div>
              <div className="text-right text-xs">
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  {reportType === 'System Audit Trail & Security Logs'
                    ? `${filteredAuditLogs.length} Total Audit Entries`
                    : reportType === 'Maintenance & Service History Logs'
                    ? `${filteredMaintenance.length} Maintenance Records`
                    : `${filteredAssets.length} Total Assets Listed`}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ON-SCREEN REPORT DATA TABLES */}
        {reportType === 'System Audit Trail & Security Logs' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b-2 border-slate-200 bg-slate-100 text-[10px] uppercase font-bold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                  <th className="py-2.5 px-3">#</th>
                  <th className="py-2.5 px-3">Timestamp</th>
                  <th className="py-2.5 px-3">Actor / User</th>
                  <th className="py-2.5 px-3">Action / Event</th>
                  <th className="py-2.5 px-3 font-mono">Asset ID</th>
                  <th className="py-2.5 px-3 text-center">Severity</th>
                  <th className="py-2.5 px-3">Log Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {filteredAuditLogs.map((log, idx) => (
                  <tr key={log.id || idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="py-2.5 px-3 font-bold text-slate-400 text-[10px]">{idx + 1}</td>
                    <td className="py-2.5 px-3 font-mono text-[11px] text-slate-600 dark:text-slate-400">
                      {log.timestamp}
                    </td>
                    <td className="py-2.5 px-3 font-bold text-slate-800 dark:text-slate-200">{log.actor}</td>
                    <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-white">{log.action}</td>
                    <td className="py-2.5 px-3 font-mono text-[11px] text-purple-600 dark:text-purple-400">
                      {log.assetId || '—'}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span
                        className={`inline-block rounded px-2 py-0.5 text-[9px] font-extrabold uppercase ${
                          log.type === 'danger'
                            ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                            : log.type === 'warning'
                            ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                            : log.type === 'success'
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                            : 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                        }`}
                      >
                        {log.type}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300 max-w-xs truncate">
                      {log.details}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : reportType === 'Maintenance & Service History Logs' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b-2 border-slate-200 bg-slate-100 text-[10px] uppercase font-bold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                  <th className="py-2.5 px-3">#</th>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Asset ID & Device</th>
                  <th className="py-2.5 px-3">Engineer</th>
                  <th className="py-2.5 px-3">Parts Replaced</th>
                  <th className="py-2.5 px-3 text-right">Cost (PKR)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {filteredMaintenance.map((m, idx) => (
                  <tr key={m.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="py-2.5 px-3 font-bold text-slate-400 text-[10px]">{idx + 1}</td>
                    <td className="py-2.5 px-3 text-slate-600 font-mono text-[11px]">{m.date}</td>
                    <td className="py-2.5 px-3 font-semibold text-slate-800 dark:text-slate-200">
                      <div className="font-mono font-bold text-purple-600">{m.assetId}</div>
                      <div className="text-[10px] text-slate-400 font-normal">{m.deviceName}</div>
                    </td>
                    <td className="py-2.5 px-3 font-medium">{m.engineer}</td>
                    <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400">{m.partsReplaced || 'N/A'}</td>
                    <td className="py-2.5 px-3 text-right font-bold text-emerald-600 dark:text-emerald-400">
                      Rs. {m.cost?.toLocaleString() || '0'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
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
                {filteredAssets.map((asset) => (
                  <tr key={asset.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-900 dark:text-white">{asset.id}</td>
                    <td className="py-2.5 px-3 font-semibold text-slate-800 dark:text-slate-200">
                      <div>{asset.name}</div>
                      <div className="text-[10px] text-slate-400 font-normal">
                        {asset.brand} {asset.model}
                      </div>
                    </td>
                    <td className="py-2.5 px-3 font-medium">{asset.category}</td>
                    <td className="py-2.5 px-3 font-bold text-emerald-700 dark:text-emerald-400">
                      {asset.department}
                    </td>
                    <td className="py-2.5 px-3">{asset.assignedUser || '—'}</td>
                    <td className="py-2.5 px-3 font-mono text-[11px] text-slate-600 dark:text-slate-400">
                      {asset.serialNumber || 'N/A'}
                    </td>
                    <td className="py-2.5 px-3 text-center font-bold text-slate-800 dark:text-slate-200">
                      {asset.status}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Official Signature Lines */}
        {includeSignature && (
          <div className="mt-16 grid grid-cols-3 gap-8 pt-8 border-t border-slate-200 dark:border-slate-800 text-center text-xs">
            <div>
              <div className="h-10"></div>
              <div className="border-t border-slate-400 pt-1 font-bold">1. Prepared By</div>
              <div className="text-slate-500 text-[10px]">IT Inspector / Assistant Officer</div>
            </div>

            <div>
              <div className="h-10"></div>
              <div className="border-t border-slate-400 pt-1 font-bold">2. Verified By</div>
              <div className="text-slate-500 text-[10px]">Deputy Manager IT Operations</div>
            </div>

            <div>
              <div className="h-10"></div>
              <div className="border-t border-slate-400 pt-1 font-bold">3. Approved By</div>
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
