import React, { useState } from 'react';
import { jsPDF } from 'jspdf';
import {
  X,
  Printer,
  FileDown,
  Plus,
  Trash2,
  FileSpreadsheet,
} from 'lucide-react';
import { useInventory } from '../context/InventoryContext';

interface RequisitionItem {
  sNo: number;
  refNo: string;
  description: string;
  assetInventory: string;
  partOf: string;
  uom: string;
  qtyReturned: number | string;
  qtyDemanded: number | string;
  qtySupplied: number | string;
}

interface InternalRequisitionFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: {
    demandingSection?: string;
    requiredBy?: string;
    purpose?: string;
    items?: RequisitionItem[];
  };
}

export const InternalRequisitionFormModal: React.FC<InternalRequisitionFormModalProps> = ({
  isOpen,
  onClose,
  initialData,
}) => {
  const { allDepartments, userRole } = useInventory();

  // Header Info
  const [demandingSection, setDemandingSection] = useState(initialData?.demandingSection || 'Information Technology (IT)');
  const [copyNo, setCopyNo] = useState('01 / 03');
  const [reqNo, setReqNo] = useState(`REQ-PAA-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`);
  const [reqDate, setReqDate] = useState(new Date().toISOString().slice(0, 10));
  const [authorityRef, setAuthorityRef] = useState('PAA/HQ/IT/TNR-2026/04');
  const [lastIssuance, setLastIssuance] = useState('30 Days Ago (Full Clearance)');
  const [requiredBy, setRequiredBy] = useState(initialData?.requiredBy || 'Engr. Tariq Mahmood (Sr. IT Officer)');
  const [priority, setPriority] = useState<'Normal' | 'Urgent'>('Normal');
  const [budgetHead, setBudgetHead] = useState('IT Consumables & Toners (A03901)');
  const [purpose, setPurpose] = useState(initialData?.purpose || 'Routine replacement of printer toner cartridges and IT hardware peripherals at Airport Operational Offices.');

  // Items Table
  const [items, setItems] = useState<RequisitionItem[]>(
    initialData?.items && initialData.items.length > 0
      ? initialData.items
      : [
          {
            sNo: 1,
            refNo: 'VOC-8841-A',
            description: 'HP LaserJet 59A Toner Cartridge (Black)',
            assetInventory: 'AST-PRN-5542',
            partOf: 'HP LaserJet Pro M404dn',
            uom: 'Nos',
            qtyReturned: 1,
            qtyDemanded: 2,
            qtySupplied: 2,
          },
          {
            sNo: 2,
            refNo: 'VOC-9920-B',
            description: 'Logitech USB Optical Mouse & Keyboard Set',
            assetInventory: 'INV-PERIPH-102',
            partOf: 'PAA Operations Workstation',
            uom: 'Sets',
            qtyReturned: 1,
            qtyDemanded: 1,
            qtySupplied: 1,
          },
        ]
  );

  if (!isOpen) return null;

  const handleAddItem = () => {
    if (items.length < 8) {
      setItems([
        ...items,
        {
          sNo: items.length + 1,
          refNo: '',
          description: '',
          assetInventory: '',
          partOf: '',
          uom: 'Nos',
          qtyReturned: 0,
          qtyDemanded: 1,
          qtySupplied: 1,
        },
      ]);
    }
  };

  const handleRemoveItem = (index: number) => {
    const updated = items.filter((_, i) => i !== index).map((item, idx) => ({ ...item, sNo: idx + 1 }));
    setItems(updated);
  };

  const handleItemChange = (index: number, field: keyof RequisitionItem, value: any) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    setItems(updated);
  };

  const exportPDF = () => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    // Outer Border
    doc.setDrawColor(30, 41, 59);
    doc.setLineWidth(0.6);
    doc.rect(8, 8, 194, 281);

    // Title Block
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text('CIVIL AVIATION AUTHORITY / PAKISTAN AIRPORTS AUTHORITY', 105, 15, { align: 'center' });

    doc.setFontSize(11);
    doc.text('INTERNAL REQUISITION', 105, 21, { align: 'center' });

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.text('(FOR AIRPORTS/ LOCATION INTERNAL DEMANDS)', 105, 26, { align: 'center' });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('LOGISTIC BRANCH (AP3/AN8)', 105, 31, { align: 'center' });

    // Form Code Top Right
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.text('CAAF-003-XXLA-1.0', 198, 13, { align: 'right' });
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.text('[CAAF-078]', 198, 17, { align: 'right' });

    // Grid Divider Line
    doc.line(8, 33, 202, 33);

    // Metadata Grid Rows
    let y = 38;
    doc.setFontSize(8);

    // Row 1
    doc.setFont('helvetica', 'bold');
    doc.text('DEMANDING SECTION:', 11, y);
    doc.setFont('helvetica', 'normal');
    doc.text(demandingSection || '_________________', 45, y);

    doc.setFont('helvetica', 'bold');
    doc.text('COPY NO:', 110, y);
    doc.setFont('helvetica', 'normal');
    doc.text(copyNo || '_____', 128, y);

    doc.setFont('helvetica', 'bold');
    doc.text('INTERNAL REQUISITION NO:', 150, y);
    doc.setFont('helvetica', 'normal');
    doc.text(reqNo || '__________', 188, y);

    // Row 2
    y += 6;
    doc.setFont('helvetica', 'bold');
    doc.text('AUTHORITY REF & DATE:', 11, y);
    doc.setFont('helvetica', 'normal');
    doc.text(authorityRef || '_________________', 45, y);

    doc.setFont('helvetica', 'bold');
    doc.text('DATE:', 150, y);
    doc.setFont('helvetica', 'normal');
    doc.text(reqDate || '__________', 188, y);

    // Row 3
    y += 6;
    doc.setFont('helvetica', 'bold');
    doc.text('REQUIRED BY (END-USER):', 11, y);
    doc.setFont('helvetica', 'normal');
    doc.text(requiredBy || '_________________', 45, y);

    doc.setFont('helvetica', 'bold');
    doc.text('PRIORITY:', 110, y);
    doc.setFont('helvetica', 'normal');
    doc.text(priority, 128, y);

    doc.setFont('helvetica', 'bold');
    doc.text('BUDGET HEAD:', 150, y);
    doc.setFont('helvetica', 'normal');
    doc.text(budgetHead || '__________', 188, y);

    // Row 4
    y += 6;
    doc.setFont('helvetica', 'bold');
    doc.text('LAST ISSUANCE:', 11, y);
    doc.setFont('helvetica', 'normal');
    doc.text(lastIssuance || '_________________', 45, y);

    doc.setFont('helvetica', 'bold');
    doc.text('PURPOSE:', 110, y);
    doc.setFont('helvetica', 'normal');
    doc.text(purpose || '_________________', 128, y);

    // Table Header
    y += 8;
    doc.setFillColor(241, 245, 249);
    doc.rect(8, y, 194, 7, 'F');
    doc.line(8, y, 202, y);
    doc.line(8, y + 7, 202, y + 7);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);

    doc.text('S.NO', 10, y + 4.5);
    doc.text('REF. NO.', 20, y + 4.5);
    doc.text('DESCRIPTION', 42, y + 4.5);
    doc.text('ASSET/INV', 95, y + 4.5);
    doc.text('PART OF', 122, y + 4.5);
    doc.text('UOM', 148, y + 4.5);
    doc.text('QTY RET', 160, y + 4.5);
    doc.text('QTY DEM', 176, y + 4.5);
    doc.text('QTY SUP', 190, y + 4.5);

    // Table Rows
    y += 7;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);

    items.forEach((item, idx) => {
      doc.text(String(idx + 1), 11, y + 4.5);
      doc.text(item.refNo || '-', 20, y + 4.5);

      const descShort = doc.splitTextToSize(item.description || 'N/A', 50);
      doc.text(descShort[0], 42, y + 4.5);

      doc.text(item.assetInventory || '-', 95, y + 4.5);
      doc.text(item.partOf || '-', 122, y + 4.5);
      doc.text(item.uom || 'Nos', 148, y + 4.5);
      doc.text(String(item.qtyReturned ?? 0), 163, y + 4.5);
      doc.text(String(item.qtyDemanded ?? 1), 179, y + 4.5);
      doc.text(String(item.qtySupplied ?? 1), 193, y + 4.5);

      y += 6;
      doc.line(8, y, 202, y);
    });

    // Fill remaining table lines up to 8 rows
    for (let i = items.length; i < 7; i++) {
      y += 6;
      doc.line(8, y, 202, y);
    }

    // Signatures Block
    y += 10;
    doc.setLineWidth(0.3);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);

    // Sign 1
    doc.line(12, y + 12, 52, y + 12);
    doc.text('SIGN & STAMP OF O/C OF DEMANDING SECTION', 12, y + 16);

    // Sign 2
    doc.line(62, y + 12, 102, y + 12);
    doc.text('SUPPLIED BY AND DATE', 68, y + 16);

    // Sign 3
    doc.line(112, y + 12, 152, y + 12);
    doc.text('RECEIVING OF ISSUE AND DATE', 114, y + 16);

    // Sign 4
    doc.line(162, y + 12, 198, y + 12);
    doc.text('UNIT HEAD / AIRPORT MANAGER', 162, y + 16);

    // Instructions Section at bottom
    y += 24;
    doc.setFillColor(241, 245, 249);
    doc.rect(8, y, 194, 5, 'F');
    doc.line(8, y, 202, y);
    doc.line(8, y + 5, 202, y + 5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.text('INSTRUCTION FOR INTIMATION OF DESCRIPTION ETC FOR CORRECT IDENTIFICATION OF ITEM', 105, y + 3.5, {
      align: 'center',
    });

    y += 8;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);

    const instructions = [
      '1. Any demand shall not be treated if Master Vocab. Reference no. is not mentioned.',
      '2. Nomenclature (which includes commercial name etc.), Type, Model, Make and size etc.',
      '3. Manufacturer Name and Part Number.',
      '4. In case of requirement of component / spares, additional information regarding Main Equipment is also required to be intimated i.e. Description of Main Equipment Type, Model and manufacturer address etc.',
      '5. A replacement item will be issued upon the return of the corresponding old item to the local logistics section. For example, if cartridges or filters are requested, the demanding section must return an equivalent quantity of empty cartridges or filters to the local logistics section.',
    ];

    instructions.forEach((ins) => {
      const split = doc.splitTextToSize(ins, 188);
      doc.text(split, 12, y);
      y += split.length * 3.5;
    });

    doc.save('CAAF-003-XXLA-1.0_Internal_Requisition.pdf');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm animate-fadeIn overflow-y-auto">
      <div className="w-full max-w-5xl max-h-[92vh] flex flex-col rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900 overflow-hidden my-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-4 dark:border-slate-800 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-md shadow-emerald-500/20">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                  CIVIL AVIATION AUTHORITY / PAKISTAN AIRPORTS AUTHORITY
                </h3>
                <span className="rounded-md bg-emerald-100 dark:bg-emerald-950 px-2 py-0.5 text-[10px] font-black text-emerald-700 dark:text-emerald-300">
                  CAAF-003-XXLA-1.0 [CAAF-078]
                </span>
              </div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                INTERNAL REQUISITION FORM (LOGISTIC BRANCH AP3/AN8)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={exportPDF}
              className="flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 transition"
            >
              <FileDown className="h-4 w-4" />
              <span>Export PDF</span>
            </button>
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white shadow-md hover:bg-emerald-500 transition"
            >
              <Printer className="h-4 w-4" />
              <span>Print Requisition</span>
            </button>
            <button
              onClick={onClose}
              className="rounded-xl p-2 text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 dark:hover:text-white transition"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-slate-800 dark:text-slate-200">
          <div className="border border-slate-300 dark:border-slate-700 rounded-xl p-6 bg-white dark:bg-slate-900 shadow-sm space-y-6">
            {/* Header Document Banner */}
            <div className="border-b-2 border-slate-900 dark:border-slate-100 pb-4 relative pt-1 min-h-[90px]">
              <div className="absolute top-0 right-0 text-right font-mono font-bold border border-slate-900 dark:border-slate-100 px-2.5 py-1 bg-white dark:bg-slate-900 rounded shadow-2xs">
                <div className="text-[11px] leading-tight text-slate-900 dark:text-slate-100 font-extrabold">
                  CAAF-003-XXLA-1.0
                </div>
                <div className="text-[10px] leading-tight text-slate-700 dark:text-slate-300 font-bold mt-0.5">
                  [CAAF-078]
                </div>
              </div>

              <div className="text-center sm:pr-36 sm:pl-36">
                <h1 className="text-lg sm:text-xl font-black tracking-wide text-slate-900 dark:text-white">
                  CIVIL AVIATION AUTHORITY / PAKISTAN AIRPORTS AUTHORITY
                </h1>
                <h2 className="text-xs sm:text-sm font-extrabold text-slate-800 dark:text-slate-200 uppercase mt-1">
                  INTERNAL REQUISITION
                </h2>
                <p className="text-[11px] sm:text-xs font-bold text-slate-600 dark:text-slate-400 italic">
                  (FOR AIRPORTS / LOCATION INTERNAL DEMANDS)
                </p>
                <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400 font-mono mt-0.5">
                  LOGISTIC BRANCH (AP3/AN8)
                </p>
              </div>
            </div>

            {/* Demanding Section & Requisition Details */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Demanding Section:
                </label>
                <input
                  type="text"
                  value={demandingSection}
                  onChange={(e) => setDemandingSection(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 font-semibold text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Internal Requisition No:
                </label>
                <input
                  type="text"
                  value={reqNo}
                  onChange={(e) => setReqNo(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 font-semibold text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Date:
                </label>
                <input
                  type="date"
                  value={reqDate}
                  onChange={(e) => setReqDate(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 font-semibold text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Required By (End-User Name):
                </label>
                <input
                  type="text"
                  value={requiredBy}
                  onChange={(e) => setRequiredBy(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 font-semibold text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Priority:
                </label>
                <div className="flex items-center gap-4 py-1">
                  <label className="flex items-center gap-1.5 font-bold cursor-pointer">
                    <input
                      type="radio"
                      name="priority"
                      checked={priority === 'Normal'}
                      onChange={() => setPriority('Normal')}
                      className="h-4 w-4 text-emerald-600"
                    />
                    <span>Normal</span>
                  </label>
                  <label className="flex items-center gap-1.5 font-bold cursor-pointer text-rose-600 dark:text-rose-400">
                    <input
                      type="radio"
                      name="priority"
                      checked={priority === 'Urgent'}
                      onChange={() => setPriority('Urgent')}
                      className="h-4 w-4 text-rose-600"
                    />
                    <span>Urgent</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Budget Head (If Any):
                </label>
                <input
                  type="text"
                  value={budgetHead}
                  onChange={(e) => setBudgetHead(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 font-semibold text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div className="md:col-span-3">
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Purpose / Demanding Reason:
                </label>
                <input
                  type="text"
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 font-semibold text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                />
              </div>
            </div>

            {/* Requisition Items Table */}
            <div className="space-y-3">
              <div className="flex items-center justify-between bg-slate-100 dark:bg-slate-800 px-3 py-2 font-bold text-xs text-slate-900 dark:text-white border-l-4 border-emerald-600">
                <span>REQUISITIONED ITEMS TABLE</span>
                <button
                  onClick={handleAddItem}
                  className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Add Item Row</span>
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse border border-slate-300 dark:border-slate-700">
                  <thead className="bg-slate-100 dark:bg-slate-800 font-bold text-[10px] uppercase text-slate-700 dark:text-slate-300">
                    <tr>
                      <th className="border border-slate-300 dark:border-slate-700 p-2 text-center w-10">S.No</th>
                      <th className="border border-slate-300 dark:border-slate-700 p-2">Ref No</th>
                      <th className="border border-slate-300 dark:border-slate-700 p-2 min-w-[200px]">Description</th>
                      <th className="border border-slate-300 dark:border-slate-700 p-2">Asset/Inv</th>
                      <th className="border border-slate-300 dark:border-slate-700 p-2">Part Of</th>
                      <th className="border border-slate-300 dark:border-slate-700 p-2 text-center w-16">UOM</th>
                      <th className="border border-slate-300 dark:border-slate-700 p-2 text-center w-16">Qty Ret</th>
                      <th className="border border-slate-300 dark:border-slate-700 p-2 text-center w-16">Qty Dem</th>
                      <th className="border border-slate-300 dark:border-slate-700 p-2 text-center w-16">Qty Sup</th>
                      <th className="border border-slate-300 dark:border-slate-700 p-2 text-center w-10"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <td className="border border-slate-300 dark:border-slate-700 p-2 text-center font-bold">
                          {idx + 1}
                        </td>
                        <td className="border border-slate-300 dark:border-slate-700 p-1">
                          <input
                            type="text"
                            value={item.refNo}
                            onChange={(e) => handleItemChange(idx, 'refNo', e.target.value)}
                            placeholder="VOC-REF"
                            className="w-full bg-transparent p-1 border-none focus:ring-0 text-xs font-mono"
                          />
                        </td>
                        <td className="border border-slate-300 dark:border-slate-700 p-1">
                          <input
                            type="text"
                            value={item.description}
                            onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
                            placeholder="Item commercial name / description"
                            className="w-full bg-transparent p-1 border-none focus:ring-0 text-xs font-semibold"
                          />
                        </td>
                        <td className="border border-slate-300 dark:border-slate-700 p-1">
                          <input
                            type="text"
                            value={item.assetInventory}
                            onChange={(e) => handleItemChange(idx, 'assetInventory', e.target.value)}
                            placeholder="Asset ID"
                            className="w-full bg-transparent p-1 border-none focus:ring-0 text-xs"
                          />
                        </td>
                        <td className="border border-slate-300 dark:border-slate-700 p-1">
                          <input
                            type="text"
                            value={item.partOf}
                            onChange={(e) => handleItemChange(idx, 'partOf', e.target.value)}
                            placeholder="Main Machine"
                            className="w-full bg-transparent p-1 border-none focus:ring-0 text-xs"
                          />
                        </td>
                        <td className="border border-slate-300 dark:border-slate-700 p-1">
                          <input
                            type="text"
                            value={item.uom}
                            onChange={(e) => handleItemChange(idx, 'uom', e.target.value)}
                            className="w-full bg-transparent p-1 text-center border-none focus:ring-0 text-xs"
                          />
                        </td>
                        <td className="border border-slate-300 dark:border-slate-700 p-1">
                          <input
                            type="number"
                            value={item.qtyReturned}
                            onChange={(e) => handleItemChange(idx, 'qtyReturned', e.target.value)}
                            className="w-full bg-transparent p-1 text-center border-none focus:ring-0 text-xs font-bold"
                          />
                        </td>
                        <td className="border border-slate-300 dark:border-slate-700 p-1">
                          <input
                            type="number"
                            value={item.qtyDemanded}
                            onChange={(e) => handleItemChange(idx, 'qtyDemanded', e.target.value)}
                            className="w-full bg-transparent p-1 text-center border-none focus:ring-0 text-xs font-bold text-indigo-600 dark:text-indigo-400"
                          />
                        </td>
                        <td className="border border-slate-300 dark:border-slate-700 p-1">
                          <input
                            type="number"
                            value={item.qtySupplied}
                            onChange={(e) => handleItemChange(idx, 'qtySupplied', e.target.value)}
                            className="w-full bg-transparent p-1 text-center border-none focus:ring-0 text-xs font-bold text-emerald-600 dark:text-emerald-400"
                          />
                        </td>
                        <td className="border border-slate-300 dark:border-slate-700 p-1 text-center">
                          {items.length > 1 && (
                            <button
                              onClick={() => handleRemoveItem(idx)}
                              className="text-rose-500 hover:text-rose-700 p-1"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Bottom Instructions Box */}
            <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200 dark:border-slate-700 text-[11px] leading-relaxed space-y-1 text-slate-600 dark:text-slate-400">
              <p className="font-bold text-slate-800 dark:text-slate-200 border-b border-slate-200 dark:border-slate-700 pb-1 uppercase tracking-wider text-[10px]">
                INSTRUCTION FOR INTIMATION OF DESCRIPTION ETC FOR CORRECT IDENTIFICATION OF ITEM
              </p>
              <p>1. Any demand shall not be treated if Master Vocab. Reference no. is not mentioned.</p>
              <p>2. Nomenclature (which includes commercial name etc.), Type, Model, Make and size etc.</p>
              <p>3. Manufacturer Name and Part Number.</p>
              <p>4. In case of requirement of component / spares, additional information regarding Main Equipment is also required to be intimated i.e. Description of Main Equipment Type, Model and manufacturer address etc.</p>
              <p>5. A replacement item will be issued upon the return of the corresponding old item to the local logistics section. For example, if cartridges or filters are requested, the demanding section must return an equivalent quantity of empty cartridges or filters to the local logistics section.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
