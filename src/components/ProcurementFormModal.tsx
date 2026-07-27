import React, { useState } from 'react';
import { jsPDF } from 'jspdf';
import {
  X,
  Printer,
  FileDown,
  Building2,
  FileText,
  CheckSquare,
  Square,
  Plus,
  Trash2,
  ShieldCheck,
} from 'lucide-react';
import { useInventory } from '../context/InventoryContext';

interface ProcurementFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: {
    directorate?: string;
    section?: string;
    requirementType?: 'new' | 'replacement';
    desktopQty?: number;
    laptopQty?: number;
    printerColorQty?: number;
    printerBwQty?: number;
    scannerQty?: number;
    othersDetail?: string;
    justification?: string;
  };
}

export const ProcurementFormModal: React.FC<ProcurementFormModalProps> = ({
  isOpen,
  onClose,
  initialData,
}) => {
  const { allDepartments, userRole } = useInventory();

  // Form State
  const [directorate, setDirectorate] = useState(initialData?.directorate || 'Directorate of Information Technology');
  const [section, setSection] = useState(initialData?.section || 'IT Infrastructure & Operations');
  const [reqType, setReqType] = useState<'new' | 'replacement'>(initialData?.requirementType || 'new');

  // Quantities
  const [desktopQty, setDesktopQty] = useState<number | string>(initialData?.desktopQty || '');
  const [laptopQty, setLaptopQty] = useState<number | string>(initialData?.laptopQty || '');
  const [printerColorQty, setPrinterColorQty] = useState<number | string>(initialData?.printerColorQty || '');
  const [printerBwQty, setPrinterBwQty] = useState<number | string>(initialData?.printerBwQty || '');
  const [scannerQty, setScannerQty] = useState<number | string>(initialData?.scannerQty || '');
  const [othersDetail, setOthersDetail] = useState(initialData?.othersDetail || '');

  // Replacement Items
  const [replacements, setReplacements] = useState<Array<{ type: string; serialNo: string }>>([
    { type: 'Desktop PC', serialNo: 'PAA-DESK-2023-089' },
    { type: 'Laser Printer B/W', serialNo: 'HP-LJP-1020-554' },
    { type: '', serialNo: '' },
  ]);

  // Justification & Existing
  const [justification, setJustification] = useState(
    initialData?.justification ||
      'Required for operational enhancement and replacement of obsolete hardware at the Airport Operations Control Centre (AOCC).'
  );
  const [existingDesktop, setExistingDesktop] = useState<number | string>('12');
  const [existingLaptop, setExistingLaptop] = useState<number | string>('4');
  const [existingPrinterColor, setExistingPrinterColor] = useState<number | string>('1');
  const [existingPrinterBw, setExistingPrinterBw] = useState<number | string>('5');
  const [existingScanner, setExistingScanner] = useState<number | string>('2');
  const [existingOthers, setExistingOthers] = useState<string>('2 x Network Switches');

  // Approvals & Signatures
  const [directorRemarks, setDirectorRemarks] = useState('Recommended for approval based on operational needs.');
  const [directorDate, setDirectorDate] = useState(new Date().toISOString().slice(0, 10));
  const [dateReceived, setDateReceived] = useState(new Date().toISOString().slice(0, 10));
  const [addDirectorRemarks, setAddDirectorRemarks] = useState('Approved as per IT Procurement Policy.');
  const [addDirectorDate, setAddDirectorDate] = useState(new Date().toISOString().slice(0, 10));

  if (!isOpen) return null;

  const handleAddReplacement = () => {
    if (replacements.length < 5) {
      setReplacements([...replacements, { type: '', serialNo: '' }]);
    }
  };

  const handleRemoveReplacement = (index: number) => {
    setReplacements(replacements.filter((_, i) => i !== index));
  };

  const exportPDF = () => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    // Outer Box Border
    doc.setDrawColor(30, 41, 59);
    doc.setLineWidth(0.6);
    doc.rect(8, 8, 194, 281);

    // Header Table Layout
    doc.setLineWidth(0.4);

    // Header Logo & Title Block
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('PAKISTAN AIRPORTS AUTHORITY', 105, 16, { align: 'center' });

    doc.setFontSize(11);
    doc.text('IT EQUIPMENT PROCUREMENT AUTHORIZATION FORM', 105, 22, { align: 'center' });

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('(I.T. Branch HQCAA)', 105, 27, { align: 'center' });

    // Top Right Form Code
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('CAAF-001-XXIT-2.0', 198, 14, { align: 'right' });

    // Header Horizontal Divider Line
    doc.line(8, 30, 202, 30);

    // Directorate & Section Row
    let y = 36;
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.text('Directorate / Branch:', 12, y);
    doc.setFont('helvetica', 'normal');
    doc.text(directorate || '_____________________', 48, y);

    // Checkboxes on Right
    doc.setFont('helvetica', 'bold');
    doc.text('New IT Equipment', 135, y);
    doc.rect(162, y - 3, 3.5, 3.5, reqType === 'new' ? 'F' : 'S');

    y += 7;
    doc.setFont('helvetica', 'bold');
    doc.text('Location / Section:', 12, y);
    doc.setFont('helvetica', 'normal');
    doc.text(section || '_____________________', 48, y);

    doc.setFont('helvetica', 'bold');
    doc.text('Replacement requirement', 135, y);
    doc.rect(162, y - 3, 3.5, 3.5, reqType === 'replacement' ? 'F' : 'S');

    // Section 1 Header
    y += 8;
    doc.setFillColor(241, 245, 249);
    doc.rect(8, y, 194, 6, 'F');
    doc.line(8, y, 202, y);
    doc.line(8, y + 6, 202, y + 6);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(30, 41, 59);
    doc.text('1. Required Quantity (Hardware, and/or IT related peripherals):', 11, y + 4.2);

    // Section 1 Quantities Grid
    y += 11;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');

    // Desktop
    doc.text('Desktop', 12, y);
    doc.rect(26, y - 3.5, 12, 4.5);
    doc.text(String(desktopQty || '0'), 32, y, { align: 'center' });

    // Laptop
    doc.text('Laptop', 44, y);
    doc.rect(56, y - 3.5, 12, 4.5);
    doc.text(String(laptopQty || '0'), 62, y, { align: 'center' });

    // Printer Color
    doc.text('Printer Color', 74, y);
    doc.rect(94, y - 3.5, 12, 4.5);
    doc.text(String(printerColorQty || '0'), 100, y, { align: 'center' });

    // Printer B/W
    doc.text('Printer B/W', 112, y);
    doc.rect(130, y - 3.5, 12, 4.5);
    doc.text(String(printerBwQty || '0'), 136, y, { align: 'center' });

    // Scanner
    doc.text('Scanner B/W', 148, y);
    doc.rect(170, y - 3.5, 12, 4.5);
    doc.text(String(scannerQty || '0'), 176, y, { align: 'center' });

    y += 7;
    doc.text('Others Please specify:', 12, y);
    doc.line(42, y + 0.5, 200, y + 0.5);
    if (othersDetail) {
      doc.text(othersDetail, 43, y);
    }

    // Section 2 Header
    y += 8;
    doc.setFillColor(241, 245, 249);
    doc.rect(8, y, 194, 6, 'F');
    doc.line(8, y, 202, y);
    doc.line(8, y + 6, 202, y + 6);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.text('2. If Replacement : Please Specify the Equipment Serial No.', 11, y + 4.2);

    // Section 2 Replacement Table
    y += 10;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('S.No', 14, y);
    doc.text('Equipment Type', 35, y);
    doc.text('Serial No.', 125, y);

    doc.line(8, y + 2, 202, y + 2);

    y += 6;
    doc.setFont('helvetica', 'normal');
    replacements.slice(0, 3).forEach((item, idx) => {
      doc.text(`${idx + 1}.`, 15, y);
      doc.text(item.type || '____________________________', 35, y);
      doc.text(item.serialNo || '____________________________', 125, y);
      y += 6;
    });

    // Section 3 Header
    y += 3;
    doc.setFillColor(241, 245, 249);
    doc.rect(8, y, 194, 6, 'F');
    doc.line(8, y, 202, y);
    doc.line(8, y + 6, 202, y + 6);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.text('3. Justification for the Provision of New / Replacement (Hardware, and/or IT related peripherals):', 11, y + 4.2);

    y += 11;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    const justLines = doc.splitTextToSize(justification || 'N/A', 188);
    doc.text(justLines, 12, y);

    y += Math.max(justLines.length * 4.5, 12);

    // Section 4 Header
    doc.setFillColor(241, 245, 249);
    doc.rect(8, y, 194, 6, 'F');
    doc.line(8, y, 202, y);
    doc.line(8, y + 6, 202, y + 6);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.text('4. Existing IT Equipment Detail : (In Case of New IT Equipment Requirement)', 11, y + 4.2);

    y += 11;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');

    // Existing Desktop
    doc.text('Desktop', 12, y);
    doc.rect(26, y - 3.5, 12, 4.5);
    doc.text(String(existingDesktop || '0'), 32, y, { align: 'center' });

    // Existing Laptop
    doc.text('Laptop', 44, y);
    doc.rect(56, y - 3.5, 12, 4.5);
    doc.text(String(existingLaptop || '0'), 62, y, { align: 'center' });

    // Existing Printer Color
    doc.text('Printer Color', 74, y);
    doc.rect(94, y - 3.5, 12, 4.5);
    doc.text(String(existingPrinterColor || '0'), 100, y, { align: 'center' });

    // Existing Printer B/W
    doc.text('Printer B/W', 112, y);
    doc.rect(130, y - 3.5, 12, 4.5);
    doc.text(String(existingPrinterBw || '0'), 136, y, { align: 'center' });

    // Existing Scanner
    doc.text('Scanner B/W', 148, y);
    doc.rect(170, y - 3.5, 12, 4.5);
    doc.text(String(existingScanner || '0'), 176, y, { align: 'center' });

    y += 7;
    doc.text('Others Please specify:', 12, y);
    doc.line(42, y + 0.5, 200, y + 0.5);
    if (existingOthers) {
      doc.text(existingOthers, 43, y);
    }

    // Section 5 Header
    y += 8;
    doc.setFillColor(241, 245, 249);
    doc.rect(8, y, 194, 6, 'F');
    doc.line(8, y, 202, y);
    doc.line(8, y + 6, 202, y + 6);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.text('RECOMMENDATIONS BY DIRECTOR / APM :', 11, y + 4.2);

    y += 10;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('Remarks:', 12, y);
    doc.setFont('helvetica', 'normal');
    doc.text(directorRemarks || '________________________________________________', 28, y);

    y += 12;
    doc.text(`Date: ${directorDate || '____/____/_______'}`, 12, y);
    doc.text('Signature: __________________________', 130, y);

    // Date request received bar
    y += 10;
    doc.line(8, y, 202, y);
    y += 5;
    doc.setFont('helvetica', 'bold');
    doc.text(`Date request received:  ${dateReceived || '____/____/_______'}`, 12, y);

    // Section 6 Header
    y += 7;
    doc.setFillColor(241, 245, 249);
    doc.rect(8, y, 194, 6, 'F');
    doc.line(8, y, 202, y);
    doc.line(8, y + 6, 202, y + 6);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.text('APPROVED / DISAPPROVED BY ADDITIONAL DIRECTOR IT :', 11, y + 4.2);

    y += 10;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('Remarks:', 12, y);
    doc.setFont('helvetica', 'normal');
    doc.text(addDirectorRemarks || '________________________________________________', 28, y);

    y += 14;
    doc.text(`Date: ${addDirectorDate || '____/____/_______'}`, 12, y);
    doc.text('Signature: __________________________', 130, y);

    doc.save('CAAF-001-XXIT-2.0_IT_Procurement_Authorization.pdf');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm animate-fadeIn overflow-y-auto">
      <div className="w-full max-w-5xl max-h-[92vh] flex flex-col rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900 overflow-hidden my-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-4 dark:border-slate-800 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-500/20">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                  PAKISTAN AIRPORTS AUTHORITY
                </h3>
                <span className="rounded-md bg-indigo-100 dark:bg-indigo-950 px-2 py-0.5 text-[10px] font-black text-indigo-700 dark:text-indigo-300">
                  CAAF-001-XXIT-2.0
                </span>
              </div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                IT Equipment Procurement Authorization Form (I.T. Branch HQCAA)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={exportPDF}
              className="flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-700 hover:bg-indigo-100 dark:border-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 transition"
            >
              <FileDown className="h-4 w-4" />
              <span>Export PDF</span>
            </button>
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white shadow-md hover:bg-indigo-500 transition"
            >
              <Printer className="h-4 w-4" />
              <span>Print Form</span>
            </button>
            <button
              onClick={onClose}
              className="rounded-xl p-2 text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 dark:hover:text-white transition"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Modal Content - Scrollable Grid */}
        <div className="p-6 overflow-y-auto space-y-6 text-slate-800 dark:text-slate-200">
          {/* Printable Container Target */}
          <div className="border border-slate-300 dark:border-slate-700 rounded-xl p-6 bg-white dark:bg-slate-900 shadow-sm space-y-6">
            {/* Document Header Box */}
            <div className="text-center border-b-2 border-slate-900 dark:border-slate-100 pb-4 relative">
              <span className="absolute top-0 right-0 text-[11px] font-black font-mono border border-slate-900 dark:border-slate-100 px-2 py-1">
                CAAF-001-XXIT-2.0
              </span>
              <h1 className="text-xl font-black tracking-wide text-slate-900 dark:text-white">
                PAKISTAN AIRPORTS AUTHORITY
              </h1>
              <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-1 uppercase tracking-wider">
                IT EQUIPMENT PROCUREMENT AUTHORIZATION FORM
              </h2>
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 font-mono mt-0.5">
                (I.T. Branch HQCAA)
              </p>
            </div>

            {/* Directorate & Requirement Type */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Directorate / Branch:
                  </label>
                  <input
                    type="text"
                    value={directorate}
                    onChange={(e) => setDirectorate(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Location / Section:
                  </label>
                  <input
                    type="text"
                    value={section}
                    onChange={(e) => setSection(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                  />
                </div>
              </div>

              <div className="space-y-3 flex flex-col justify-center">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Requirement Type:
                </label>
                <div className="flex items-center gap-6">
                  <label className="flex items-center gap-2 text-xs font-extrabold cursor-pointer">
                    <input
                      type="radio"
                      name="reqType"
                      checked={reqType === 'new'}
                      onChange={() => setReqType('new')}
                      className="h-4 w-4 text-indigo-600"
                    />
                    <span>New IT Equipment</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs font-extrabold cursor-pointer">
                    <input
                      type="radio"
                      name="reqType"
                      checked={reqType === 'replacement'}
                      onChange={() => setReqType('replacement')}
                      className="h-4 w-4 text-indigo-600"
                    />
                    <span>Replacement Requirement</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Section 1: Required Quantity */}
            <div className="space-y-3">
              <div className="bg-slate-100 dark:bg-slate-800 px-3 py-2 font-bold text-xs text-slate-900 dark:text-white border-l-4 border-indigo-600">
                1. Required Quantity (Hardware, and/or IT related peripherals):
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Desktop
                  </label>
                  <input
                    type="number"
                    value={desktopQty}
                    onChange={(e) => setDesktopQty(e.target.value)}
                    placeholder="0"
                    className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-center text-xs font-bold dark:border-slate-600 dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Laptop
                  </label>
                  <input
                    type="number"
                    value={laptopQty}
                    onChange={(e) => setLaptopQty(e.target.value)}
                    placeholder="0"
                    className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-center text-xs font-bold dark:border-slate-600 dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Printer Color
                  </label>
                  <input
                    type="number"
                    value={printerColorQty}
                    onChange={(e) => setPrinterColorQty(e.target.value)}
                    placeholder="0"
                    className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-center text-xs font-bold dark:border-slate-600 dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Printer B/W
                  </label>
                  <input
                    type="number"
                    value={printerBwQty}
                    onChange={(e) => setPrinterBwQty(e.target.value)}
                    placeholder="0"
                    className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-center text-xs font-bold dark:border-slate-600 dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Scanner
                  </label>
                  <input
                    type="number"
                    value={scannerQty}
                    onChange={(e) => setScannerQty(e.target.value)}
                    placeholder="0"
                    className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-center text-xs font-bold dark:border-slate-600 dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Others (Specify)
                  </label>
                  <input
                    type="text"
                    value={othersDetail}
                    onChange={(e) => setOthersDetail(e.target.value)}
                    placeholder="e.g. 2 x UPS"
                    className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs font-bold dark:border-slate-600 dark:bg-slate-800"
                  />
                </div>
              </div>
            </div>

            {/* Section 2: If Replacement */}
            <div className="space-y-3">
              <div className="flex items-center justify-between bg-slate-100 dark:bg-slate-800 px-3 py-2 font-bold text-xs text-slate-900 dark:text-white border-l-4 border-indigo-600">
                <span>2. If Replacement : Please Specify the Equipment Serial No.</span>
                <button
                  onClick={handleAddReplacement}
                  className="flex items-center gap-1 text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Add Row</span>
                </button>
              </div>

              <div className="space-y-2">
                {replacements.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <span className="text-xs font-bold text-slate-500 w-6 text-center">{idx + 1}.</span>
                    <input
                      type="text"
                      placeholder="Equipment Type (e.g. Desktop PC)"
                      value={item.type}
                      onChange={(e) => {
                        const newArr = [...replacements];
                        newArr[idx].type = e.target.value;
                        setReplacements(newArr);
                      }}
                      className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium dark:border-slate-600 dark:bg-slate-800"
                    />
                    <input
                      type="text"
                      placeholder="Serial Number (e.g. PAA-SN-99812)"
                      value={item.serialNo}
                      onChange={(e) => {
                        const newArr = [...replacements];
                        newArr[idx].serialNo = e.target.value;
                        setReplacements(newArr);
                      }}
                      className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium dark:border-slate-600 dark:bg-slate-800"
                    />
                    {replacements.length > 1 && (
                      <button
                        onClick={() => handleRemoveReplacement(idx)}
                        className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950 rounded"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Section 3: Justification */}
            <div className="space-y-2">
              <div className="bg-slate-100 dark:bg-slate-800 px-3 py-2 font-bold text-xs text-slate-900 dark:text-white border-l-4 border-indigo-600">
                3. Justification for the Provision of New / Replacement (Hardware, and/or IT related peripherals):
              </div>
              <textarea
                rows={3}
                value={justification}
                onChange={(e) => setJustification(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white p-3 text-xs font-medium text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                placeholder="Enter justification here..."
              />
            </div>

            {/* Section 4: Existing IT Equipment Detail */}
            <div className="space-y-3">
              <div className="bg-slate-100 dark:bg-slate-800 px-3 py-2 font-bold text-xs text-slate-900 dark:text-white border-l-4 border-indigo-600">
                4. Existing IT Equipment Detail : (In Case of New IT Equipment Requirement)
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Desktop
                  </label>
                  <input
                    type="number"
                    value={existingDesktop}
                    onChange={(e) => setExistingDesktop(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-center text-xs font-bold dark:border-slate-600 dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Laptop
                  </label>
                  <input
                    type="number"
                    value={existingLaptop}
                    onChange={(e) => setExistingLaptop(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-center text-xs font-bold dark:border-slate-600 dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Printer Color
                  </label>
                  <input
                    type="number"
                    value={existingPrinterColor}
                    onChange={(e) => setExistingPrinterColor(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-center text-xs font-bold dark:border-slate-600 dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Printer B/W
                  </label>
                  <input
                    type="number"
                    value={existingPrinterBw}
                    onChange={(e) => setExistingPrinterBw(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-center text-xs font-bold dark:border-slate-600 dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Scanner
                  </label>
                  <input
                    type="number"
                    value={existingScanner}
                    onChange={(e) => setExistingScanner(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-center text-xs font-bold dark:border-slate-600 dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Others
                  </label>
                  <input
                    type="text"
                    value={existingOthers}
                    onChange={(e) => setExistingOthers(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs font-bold dark:border-slate-600 dark:bg-slate-800"
                  />
                </div>
              </div>
            </div>

            {/* Recommendations & Approval Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              {/* Director / APM */}
              <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-4 space-y-3 bg-slate-50/50 dark:bg-slate-800/30">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-700 pb-2">
                  RECOMMENDATIONS BY DIRECTOR / APM
                </h4>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Remarks:</label>
                  <input
                    type="text"
                    value={directorRemarks}
                    onChange={(e) => setDirectorRemarks(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium dark:border-slate-600 dark:bg-slate-800"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">Date:</label>
                    <input
                      type="date"
                      value={directorDate}
                      onChange={(e) => setDirectorDate(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs dark:border-slate-600 dark:bg-slate-800"
                    />
                  </div>
                  <div className="flex flex-col justify-end">
                    <div className="border-b border-slate-400 mb-1"></div>
                    <span className="text-[10px] font-bold text-center text-slate-600 dark:text-slate-400">
                      Signature of Director / APM
                    </span>
                  </div>
                </div>
              </div>

              {/* Additional Director IT */}
              <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-4 space-y-3 bg-slate-50/50 dark:bg-slate-800/30">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-700 pb-2">
                  APPROVED / DISAPPROVED BY ADDITIONAL DIRECTOR IT
                </h4>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Remarks:</label>
                  <input
                    type="text"
                    value={addDirectorRemarks}
                    onChange={(e) => setAddDirectorRemarks(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium dark:border-slate-600 dark:bg-slate-800"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">Date:</label>
                    <input
                      type="date"
                      value={addDirectorDate}
                      onChange={(e) => setAddDirectorDate(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs dark:border-slate-600 dark:bg-slate-800"
                    />
                  </div>
                  <div className="flex flex-col justify-end">
                    <div className="border-b border-slate-400 mb-1"></div>
                    <span className="text-[10px] font-bold text-center text-slate-600 dark:text-slate-400">
                      Signature of Additional Director IT
                    </span>
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
