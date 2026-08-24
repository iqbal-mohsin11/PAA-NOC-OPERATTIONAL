import React, { useState, useEffect } from 'react';
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
  Store,
  ShoppingCart,
  ClipboardList,
  RotateCcw,
} from 'lucide-react';
import { useInventory } from '../context/InventoryContext';

interface LocalDemandItem {
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

interface ProcurementFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: {
    directorate?: string;
    section?: string;
    requirementType?: 'new' | 'replacement' | 'local';
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

  // Active Tab Mode: 'authorization' (CAAF-001) or 'local_demand' (CAAF-003)
  const [formMode, setFormMode] = useState<'authorization' | 'local_demand'>(
    initialData?.requirementType === 'local' ? 'local_demand' : 'authorization'
  );

  // Form State (CAAF-001 Authorization)
  const [directorate, setDirectorate] = useState(initialData?.directorate || 'Directorate of Information Technology');
  const [section, setSection] = useState(initialData?.section || 'IT Infrastructure & Operations');
  const [reqType, setReqType] = useState<'new' | 'replacement' | 'local'>(initialData?.requirementType || 'new');

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

  // Local Demand Form State (CAAF-003 / Local Requisition)
  const [demandingSection, setDemandingSection] = useState('Information Technology (IT Branch)');
  const [copyNo, setCopyNo] = useState('01 / 03');
  const [reqNo, setReqNo] = useState(`DEM-PAA-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`);
  const [reqDate, setReqDate] = useState(new Date().toISOString().slice(0, 10));
  const [authorityRef, setAuthorityRef] = useState('PAA/HQ/IT/DEM-2026/08');
  const [lastIssuance, setLastIssuance] = useState('15 Days Ago (Partial Issuance)');
  const [requiredBy, setRequiredBy] = useState('Engr. Tariq Mahmood (Sr. IT Officer)');
  const [priority, setPriority] = useState<'Normal' | 'Urgent'>('Urgent');
  const [budgetHead, setBudgetHead] = useState('IT Consumables & Local Market Purchase (A03901)');
  const [demandPurpose, setDemandPurpose] = useState(
    initialData?.justification ||
      'Urgent local market procurement of RAM, SSDs, cables, and IT lab repair tools for airport operational servers & workstations.'
  );

  // Local Demand Items List
  const [localDemandItems, setLocalDemandItems] = useState<LocalDemandItem[]>([
    {
      sNo: 1,
      refNo: 'VOC-8841-A',
      description: '16GB DDR4 3200MHz RAM Module & 512GB NVMe M.2 SSD',
      assetInventory: 'AST-DESK-102',
      partOf: 'AOCC Control Workstation',
      uom: 'Sets',
      qtyReturned: 0,
      qtyDemanded: 2,
      qtySupplied: 2,
    },
    {
      sNo: 2,
      refNo: 'VOC-9920-B',
      description: 'Logitech USB Ergonomic Keyboard & Optical Mouse Set',
      assetInventory: 'INV-PERIPH-102',
      partOf: 'Tower Flight Operations',
      uom: 'Sets',
      qtyReturned: 1,
      qtyDemanded: 3,
      qtySupplied: 3,
    },
    {
      sNo: 3,
      refNo: 'VOC-3312-C',
      description: '10m Fiber Optic LC-LC Patchcord & Heavy Duty Power Cable C13',
      assetInventory: 'NW-SW-04',
      partOf: 'Core Network Rack Server',
      uom: 'Nos',
      qtyReturned: 0,
      qtyDemanded: 5,
      qtySupplied: 5,
    },
    {
      sNo: 4,
      refNo: 'VOC-4411-D',
      description: 'IT Lab Tool Kit (Network Cable Tester, Crimper & Precision Screwdrivers)',
      assetInventory: 'IT-LAB-TOOL-01',
      partOf: 'IT Maintenance Lab',
      uom: 'Kit',
      qtyReturned: 0,
      qtyDemanded: 1,
      qtySupplied: 1,
    },
  ]);

  // Synchronize state when initialData or modal open status changes
  useEffect(() => {
    if (isOpen && initialData) {
      if (initialData.directorate) setDirectorate(initialData.directorate);
      if (initialData.section) setSection(initialData.section);
      if (initialData.requirementType) {
        setReqType(initialData.requirementType);
        if (initialData.requirementType === 'local') setFormMode('local_demand');
      }
      if (initialData.desktopQty !== undefined) setDesktopQty(initialData.desktopQty);
      if (initialData.laptopQty !== undefined) setLaptopQty(initialData.laptopQty);
      if (initialData.printerColorQty !== undefined) setPrinterColorQty(initialData.printerColorQty);
      if (initialData.printerBwQty !== undefined) setPrinterBwQty(initialData.printerBwQty);
      if (initialData.scannerQty !== undefined) setScannerQty(initialData.scannerQty);
      if (initialData.othersDetail) setOthersDetail(initialData.othersDetail);
      if (initialData.justification) {
        setJustification(initialData.justification);
        setDemandPurpose(initialData.justification);
      }
    }
  }, [isOpen, initialData]);

  const handleClearToBlankForm = () => {
    // Clear CAAF-001 Authorization fields for a fresh blank form template
    setDirectorate('Directorate of Information Technology');
    setSection('');
    setReqType(formMode === 'local_demand' ? 'local' : 'new');
    setDesktopQty('');
    setLaptopQty('');
    setPrinterColorQty('');
    setPrinterBwQty('');
    setScannerQty('');
    setOthersDetail('');
    setReplacements([
      { type: '', serialNo: '' },
      { type: '', serialNo: '' },
      { type: '', serialNo: '' },
    ]);
    setJustification('');
    setExistingDesktop('');
    setExistingLaptop('');
    setExistingPrinterColor('');
    setExistingPrinterBw('');
    setExistingScanner('');
    setExistingOthers('');
    setDirectorRemarks('');
    setDirectorDate('');
    setDateReceived('');
    setAddDirectorRemarks('');
    setAddDirectorDate('');

    // Clear CAAF-003 Local Demand fields
    setDemandingSection('');
    setCopyNo('01 / 03');
    setReqNo(`DEM-PAA-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`);
    setReqDate(new Date().toISOString().slice(0, 10));
    setAuthorityRef('');
    setLastIssuance('');
    setRequiredBy('');
    setPriority('Normal');
    setBudgetHead('IT Consumables & Local Market Purchase (A03901)');
    setDemandPurpose('');
    setLocalDemandItems([
      { sNo: 1, refNo: '', description: '', assetInventory: '', partOf: '', uom: 'Nos', qtyReturned: '', qtyDemanded: '', qtySupplied: '' },
      { sNo: 2, refNo: '', description: '', assetInventory: '', partOf: '', uom: 'Nos', qtyReturned: '', qtyDemanded: '', qtySupplied: '' },
      { sNo: 3, refNo: '', description: '', assetInventory: '', partOf: '', uom: 'Nos', qtyReturned: '', qtyDemanded: '', qtySupplied: '' },
      { sNo: 4, refNo: '', description: '', assetInventory: '', partOf: '', uom: 'Nos', qtyReturned: '', qtyDemanded: '', qtySupplied: '' },
      { sNo: 5, refNo: '', description: '', assetInventory: '', partOf: '', uom: 'Nos', qtyReturned: '', qtyDemanded: '', qtySupplied: '' },
    ]);
  };

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
    doc.text('New IT Equipment', 130, y);
    doc.rect(170, y - 3, 3.5, 3.5, reqType === 'new' ? 'F' : 'S');

    y += 5;
    doc.setFont('helvetica', 'bold');
    doc.text('Location / Section:', 12, y);
    doc.setFont('helvetica', 'normal');
    doc.text(section || '_____________________', 48, y);

    doc.setFont('helvetica', 'bold');
    doc.text('Replacement requirement', 130, y);
    doc.rect(170, y - 3, 3.5, 3.5, reqType === 'replacement' ? 'F' : 'S');

    y += 5;
    doc.setFont('helvetica', 'bold');
    doc.text('Local Procurement', 130, y);
    doc.rect(170, y - 3, 3.5, 3.5, reqType === 'local' ? 'F' : 'S');

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
    doc.text(desktopQty !== '' && desktopQty !== undefined ? String(desktopQty) : '', 32, y, { align: 'center' });

    // Laptop
    doc.text('Laptop', 44, y);
    doc.rect(56, y - 3.5, 12, 4.5);
    doc.text(laptopQty !== '' && laptopQty !== undefined ? String(laptopQty) : '', 62, y, { align: 'center' });

    // Printer Color
    doc.text('Printer Color', 74, y);
    doc.rect(94, y - 3.5, 12, 4.5);
    doc.text(printerColorQty !== '' && printerColorQty !== undefined ? String(printerColorQty) : '', 100, y, { align: 'center' });

    // Printer B/W
    doc.text('Printer B/W', 112, y);
    doc.rect(130, y - 3.5, 12, 4.5);
    doc.text(printerBwQty !== '' && printerBwQty !== undefined ? String(printerBwQty) : '', 136, y, { align: 'center' });

    // Scanner
    doc.text('Scanner B/W', 148, y);
    doc.rect(170, y - 3.5, 12, 4.5);
    doc.text(scannerQty !== '' && scannerQty !== undefined ? String(scannerQty) : '', 176, y, { align: 'center' });

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
    const repList = [...replacements];
    while (repList.length < 3) {
      repList.push({ type: '', serialNo: '' });
    }
    repList.slice(0, 3).forEach((item, idx) => {
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
    const justText = justification.trim()
      ? justification
      : '1. ____________________________________________________________________________________\n2. ____________________________________________________________________________________\n3. ____________________________________________________________________________________';
    const justLines = doc.splitTextToSize(justText, 188);
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
    doc.text(existingDesktop !== '' && existingDesktop !== undefined ? String(existingDesktop) : '', 32, y, { align: 'center' });

    // Existing Laptop
    doc.text('Laptop', 44, y);
    doc.rect(56, y - 3.5, 12, 4.5);
    doc.text(existingLaptop !== '' && existingLaptop !== undefined ? String(existingLaptop) : '', 62, y, { align: 'center' });

    // Existing Printer Color
    doc.text('Printer Color', 74, y);
    doc.rect(94, y - 3.5, 12, 4.5);
    doc.text(existingPrinterColor !== '' && existingPrinterColor !== undefined ? String(existingPrinterColor) : '', 100, y, { align: 'center' });

    // Existing Printer B/W
    doc.text('Printer B/W', 112, y);
    doc.rect(130, y - 3.5, 12, 4.5);
    doc.text(existingPrinterBw !== '' && existingPrinterBw !== undefined ? String(existingPrinterBw) : '', 136, y, { align: 'center' });

    // Existing Scanner
    doc.text('Scanner B/W', 148, y);
    doc.rect(170, y - 3.5, 12, 4.5);
    doc.text(existingScanner !== '' && existingScanner !== undefined ? String(existingScanner) : '', 176, y, { align: 'center' });

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

  const exportLocalDemandPDF = () => {
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
    doc.text('PAKISTAN AIRPORTS AUTHORITY', 105, 15, { align: 'center' });

    doc.setFontSize(11);
    doc.text('LOCAL DEMAND & INTERNAL REQUISITION NOTE', 105, 21, { align: 'center' });

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.text('(FOR AIRPORTS/ LOCATION LOCAL MARKET DEMANDS & PURCHASES)', 105, 26, { align: 'center' });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('LOGISTIC BRANCH & IT SECTION (HQCAA)', 105, 31, { align: 'center' });

    // Form Code Top Right
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.text('CAAF-003-XXLA-1.0', 198, 13, { align: 'right' });
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.text('[LOCAL DEMAND]', 198, 17, { align: 'right' });

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
    doc.text('DEMAND NO:', 150, y);
    doc.setFont('helvetica', 'normal');
    doc.text(reqNo || '__________', 175, y);

    // Row 2
    y += 6;
    doc.setFont('helvetica', 'bold');
    doc.text('AUTHORITY REF & DATE:', 11, y);
    doc.setFont('helvetica', 'normal');
    doc.text(authorityRef || '_________________', 45, y);

    doc.setFont('helvetica', 'bold');
    doc.text('DATE:', 150, y);
    doc.setFont('helvetica', 'normal');
    doc.text(reqDate || '__________', 175, y);

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
    doc.text(budgetHead || '__________', 175, y);

    // Row 4
    y += 6;
    doc.setFont('helvetica', 'bold');
    doc.text('LAST ISSUANCE:', 11, y);
    doc.setFont('helvetica', 'normal');
    doc.text(lastIssuance || '_________________', 45, y);

    doc.setFont('helvetica', 'bold');
    doc.text('PURPOSE:', 110, y);
    doc.setFont('helvetica', 'normal');
    doc.text(demandPurpose || '_________________', 128, y);

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
    doc.text('DESCRIPTION / ITEM SPECIFICATION', 42, y + 4.5);
    doc.text('ASSET/INV', 105, y + 4.5);
    doc.text('PART OF', 128, y + 4.5);
    doc.text('UOM', 152, y + 4.5);
    doc.text('RET', 166, y + 4.5);
    doc.text('DEM', 178, y + 4.5);
    doc.text('SUP', 190, y + 4.5);

    // Table Rows
    y += 7;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);

    const rowsToPrint = [...localDemandItems];
    while (rowsToPrint.length < 6) {
      rowsToPrint.push({
        sNo: rowsToPrint.length + 1,
        refNo: '',
        description: '',
        assetInventory: '',
        partOf: '',
        uom: 'Nos',
        qtyReturned: '',
        qtyDemanded: '',
        qtySupplied: '',
      });
    }

    rowsToPrint.slice(0, 7).forEach((item, idx) => {
      doc.text(String(idx + 1), 11, y + 4.5);
      doc.text(item.refNo || '________', 20, y + 4.5);

      const descText = item.description
        ? doc.splitTextToSize(item.description, 60)[0]
        : '________________________________________';
      doc.text(descText, 42, y + 4.5);

      doc.text(item.assetInventory || '___________', 105, y + 4.5);
      doc.text(item.partOf || '___________', 128, y + 4.5);
      doc.text(item.uom || 'Nos', 152, y + 4.5);
      doc.text(item.qtyReturned !== '' && item.qtyReturned !== undefined ? String(item.qtyReturned) : '___', 167, y + 4.5);
      doc.text(item.qtyDemanded !== '' && item.qtyDemanded !== undefined ? String(item.qtyDemanded) : '___', 179, y + 4.5);
      doc.text(item.qtySupplied !== '' && item.qtySupplied !== undefined ? String(item.qtySupplied) : '___', 191, y + 4.5);

      doc.line(8, y + 6.5, 202, y + 6.5);
      y += 6.5;
    });

    // Footer Signatures
    y = 235;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.line(8, y, 202, y);

    y += 6;
    doc.text('DEMANDED BY:', 12, y);
    doc.text('RECOMMENDED BY:', 75, y);
    doc.text('APPROVED BY:', 140, y);

    y += 18;
    doc.text('____________________', 12, y);
    doc.text('____________________', 75, y);
    doc.text('____________________', 140, y);

    y += 4;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.text('In-Charge / Officer (IT)', 12, y);
    doc.text('Director / APM', 75, y);
    doc.text('Additional Director IT / HQCAA', 140, y);

    doc.save('CAAF-003_Local_Demand_Form_Requisition.pdf');
  };

  const handleExportPDF = () => {
    if (formMode === 'local_demand') {
      exportLocalDemandPDF();
    } else {
      exportPDF();
    }
  };

  const handleAddLocalDemandRow = () => {
    setLocalDemandItems([
      ...localDemandItems,
      {
        sNo: localDemandItems.length + 1,
        refNo: `DEM-${Math.floor(100 + Math.random() * 900)}`,
        description: '',
        assetInventory: '',
        partOf: '',
        uom: 'Nos',
        qtyReturned: 0,
        qtyDemanded: 1,
        qtySupplied: 1,
      },
    ]);
  };

  const handleRemoveLocalDemandRow = (index: number) => {
    const updated = localDemandItems.filter((_, i) => i !== index).map((item, idx) => ({ ...item, sNo: idx + 1 }));
    setLocalDemandItems(updated);
  };

  const handleLocalItemChange = (index: number, field: keyof LocalDemandItem, value: any) => {
    const updated = [...localDemandItems];
    updated[index] = { ...updated[index], [field]: value };
    setLocalDemandItems(updated);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm animate-fadeIn overflow-y-auto">
      <div className="w-full max-w-5xl max-h-[92vh] flex flex-col rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900 overflow-hidden my-auto" id="printable-procurement-modal">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-4 dark:border-slate-800 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl text-white shadow-md ${formMode === 'local_demand' ? 'bg-purple-600 shadow-purple-500/20' : 'bg-indigo-600 shadow-indigo-500/20'}`}>
              {formMode === 'local_demand' ? <Store className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                  PAKISTAN AIRPORTS AUTHORITY
                </h3>
                <span className={`rounded-md px-2 py-0.5 text-[10px] font-black ${formMode === 'local_demand' ? 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300' : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'}`}>
                  {formMode === 'local_demand' ? 'CAAF-003-XXLA-1.0 [LOCAL DEMAND]' : 'CAAF-001-XXIT-2.0'}
                </span>
              </div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                {formMode === 'local_demand'
                  ? 'Local Demand Form & Internal Market Requisition (I.T. Branch & Logistics HQCAA)'
                  : 'IT Equipment Procurement Authorization Form (I.T. Branch HQCAA)'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleClearToBlankForm}
              className="flex items-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-800 hover:bg-amber-100 dark:border-amber-900/60 dark:bg-amber-950/80 dark:text-amber-300 transition shadow-2xs"
              title="Clear form to print/download a blank form template"
            >
              <RotateCcw className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
              <span>Blank Form Template</span>
            </button>
            <button
              onClick={handleExportPDF}
              className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold transition ${formMode === 'local_demand' ? 'border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-100 dark:border-purple-800 dark:bg-purple-950 dark:text-purple-300' : 'border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 dark:border-indigo-800 dark:bg-indigo-950 dark:text-indigo-300'}`}
            >
              <FileDown className="h-4 w-4" />
              <span>Export PDF</span>
            </button>
            <button
              onClick={() => window.print()}
              className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold text-white shadow-md transition ${formMode === 'local_demand' ? 'bg-purple-600 hover:bg-purple-500' : 'bg-indigo-600 hover:bg-indigo-500'}`}
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

        {/* Form Mode Navigation Bar */}
        <div className="flex border-b border-slate-200 bg-slate-100/70 dark:border-slate-800 dark:bg-slate-900 px-6 pt-3 gap-2">
          <button
            type="button"
            onClick={() => setFormMode('authorization')}
            className={`flex items-center gap-2 rounded-t-xl px-4 py-2.5 text-xs font-extrabold transition border-t border-x ${
              formMode === 'authorization'
                ? 'border-indigo-300 bg-white text-indigo-700 dark:border-indigo-800 dark:bg-slate-900 dark:text-indigo-300 shadow-2xs'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <ShoppingCart className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            <span>IT Procurement Authorization (CAAF-001)</span>
          </button>

          <button
            type="button"
            onClick={() => setFormMode('local_demand')}
            className={`flex items-center gap-2 rounded-t-xl px-4 py-2.5 text-xs font-extrabold transition border-t border-x ${
              formMode === 'local_demand'
                ? 'border-purple-300 bg-white text-purple-700 dark:border-purple-800 dark:bg-slate-900 dark:text-purple-300 shadow-2xs'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <ClipboardList className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            <span>Local Demand Form / Internal Requisition (CAAF-003)</span>
            <span className="ml-1 rounded-full bg-purple-100 dark:bg-purple-950 px-2 py-0.5 text-[10px] font-black text-purple-700 dark:text-purple-300">
              Local Purchase
            </span>
          </button>
        </div>

        {/* Modal Content - Scrollable */}
        <div className="p-6 overflow-y-auto space-y-6 text-slate-800 dark:text-slate-200">
          {formMode === 'local_demand' ? (
            /* LOCAL DEMAND FORM UI */
            <div className="border border-purple-200 dark:border-purple-900/60 rounded-xl p-6 bg-white dark:bg-slate-900 shadow-sm space-y-6">
              {/* Document Title Header */}
              <div className="text-center border-b-2 border-purple-900 dark:border-purple-400 pb-4 relative">
                <span className="absolute top-0 right-0 text-[11px] font-black font-mono border border-purple-900 dark:border-purple-300 px-2 py-1 text-purple-800 dark:text-purple-300">
                  CAAF-003 [LOCAL DEMAND]
                </span>
                <h1 className="text-xl font-black tracking-wide text-slate-900 dark:text-white">
                  PAKISTAN AIRPORTS AUTHORITY
                </h1>
                <h2 className="text-sm font-bold text-purple-900 dark:text-purple-300 mt-1 uppercase tracking-wider">
                  LOCAL DEMAND FORM & INTERNAL REQUISITION NOTE
                </h2>
                <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 font-mono mt-0.5">
                  (FOR AIRPORT & LOCATION LOCAL MARKET DEMANDS & PURCHASES)
                </p>
              </div>

              {/* Demand Metadata Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 bg-purple-50/50 dark:bg-purple-950/20 p-4 rounded-xl border border-purple-200 dark:border-purple-900/40">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Demanding Section / Dept:
                  </label>
                  <input
                    type="text"
                    value={demandingSection}
                    onChange={(e) => setDemandingSection(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium dark:border-slate-600 dark:bg-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Demand Ref No:
                  </label>
                  <input
                    type="text"
                    value={reqNo}
                    onChange={(e) => setReqNo(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-mono font-bold dark:border-slate-600 dark:bg-slate-800 text-purple-700 dark:text-purple-300"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Demand Date:
                  </label>
                  <input
                    type="date"
                    value={reqDate}
                    onChange={(e) => setReqDate(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium dark:border-slate-600 dark:bg-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Required By (End User):
                  </label>
                  <input
                    type="text"
                    value={requiredBy}
                    onChange={(e) => setRequiredBy(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium dark:border-slate-600 dark:bg-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Demand Priority:
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as 'Normal' | 'Urgent')}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold dark:border-slate-600 dark:bg-slate-800 text-purple-700 dark:text-purple-300"
                  >
                    <option value="Normal">Normal Priority</option>
                    <option value="Urgent">🚨 Urgent Local Purchase</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Budget Head:
                  </label>
                  <input
                    type="text"
                    value={budgetHead}
                    onChange={(e) => setBudgetHead(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium dark:border-slate-600 dark:bg-slate-800"
                  />
                </div>

                <div className="sm:col-span-2 md:col-span-3">
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Purpose & Operational Justification of Local Demand:
                  </label>
                  <textarea
                    rows={2}
                    value={demandPurpose}
                    onChange={(e) => setDemandPurpose(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium dark:border-slate-600 dark:bg-slate-800"
                  />
                </div>
              </div>

              {/* Quick Preset Buttons for Local Demand Form Items */}
              <div className="rounded-xl border border-purple-200 bg-purple-50/70 p-3.5 dark:border-purple-900/50 dark:bg-purple-950/30 space-y-2">
                <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-wider text-purple-900 dark:text-purple-300">
                  <span>🛍️ Quick Buttons for Local Demand Items:</span>
                  <span className="text-[10px] font-normal text-slate-500">Click button to instantly insert item row</span>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {[
                    { label: '💾 16GB RAM', desc: '16GB DDR4 3200MHz RAM Module', uom: 'Nos' },
                    { label: '💽 512GB NVMe SSD', desc: '512GB NVMe M.2 High-Speed SSD', uom: 'Nos' },
                    { label: '⌨️ KEYBOARD / MOUSE', desc: 'USB Ergonomic Keyboard & Optical Mouse Set', uom: 'Sets' },
                    { label: '🖥️ 24" LED MONITOR', desc: '24-inch Full HD IPS LED Display Monitor', uom: 'Nos' },
                    { label: '💻 DESKTOP PC', desc: 'Intel Core i7 Workstation PC', uom: 'Nos' },
                    { label: '🖨️ LASER PRINTER', desc: 'Heavy Duty Laser Printer B/W (Network Enabled)', uom: 'Nos' },
                    { label: '🧵 FIBER CABLES / PATCHCORD', desc: '10m Fiber Optic LC-LC Single Mode Patchcord', uom: 'Nos' },
                    { label: '🔌 POWER CABLES', desc: '1.8m Heavy Duty C13 Power Cable', uom: 'Nos' },
                    { label: '🔌 USB PRINTER CABLE', desc: '3m High-Speed USB 2.0 A-to-B Printer Cable', uom: 'Nos' },
                    { label: '🧰 IT LAB TOOL KIT', desc: 'IT Lab Tool Kit (Network Cable Tester, Crimper & Precision Screwdriver Set)', uom: 'Kit' },
                    { label: '🛒 LOCAL REPAIR SPARES', desc: 'Local Market Repair Spares & Consumables', uom: 'Pack' },
                  ].map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => {
                        setLocalDemandItems([
                          ...localDemandItems,
                          {
                            sNo: localDemandItems.length + 1,
                            refNo: `LOCAL-${Math.floor(100 + Math.random() * 900)}`,
                            description: preset.desc,
                            assetInventory: 'AST-LOCAL-DEMAND',
                            partOf: 'Airport Operations IT',
                            uom: preset.uom,
                            qtyReturned: 0,
                            qtyDemanded: 1,
                            qtySupplied: 1,
                          },
                        ]);
                      }}
                      className="group flex items-center gap-1 rounded-lg border border-purple-200 bg-white px-2.5 py-1 text-xs font-bold text-slate-800 hover:border-purple-500 hover:bg-purple-100 dark:border-purple-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 transition shadow-2xs"
                      title={`Click to add ${preset.desc}`}
                    >
                      <span>{preset.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Itemized Table for Local Demand Form */}
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-purple-200 pb-2 dark:border-purple-900/60">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-purple-900 dark:text-purple-300">
                    Demanded Items List (Local Procurement)
                  </h3>
                  <button
                    type="button"
                    onClick={handleAddLocalDemandRow}
                    className="flex items-center gap-1 rounded-lg bg-purple-600 px-3 py-1 text-xs font-bold text-white hover:bg-purple-500 transition shadow-xs"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Add Item Row</span>
                  </button>
                </div>

                <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-purple-100/70 dark:bg-purple-950/60 font-black text-purple-900 dark:text-purple-300">
                      <tr>
                        <th className="p-2 w-10 text-center">S.#</th>
                        <th className="p-2 w-24">Ref. No</th>
                        <th className="p-2">Description / Specifications</th>
                        <th className="p-2 w-28">Asset/Inv ID</th>
                        <th className="p-2 w-28">Part Of</th>
                        <th className="p-2 w-16 text-center">UOM</th>
                        <th className="p-2 w-16 text-center">Demanded</th>
                        <th className="p-2 w-10 text-center"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-medium">
                      {localDemandItems.map((item, index) => (
                        <tr key={index} className="hover:bg-purple-50/30 dark:hover:bg-purple-950/20">
                          <td className="p-2 text-center font-bold text-slate-500">{index + 1}</td>
                          <td className="p-2">
                            <input
                              type="text"
                              value={item.refNo}
                              onChange={(e) => handleLocalItemChange(index, 'refNo', e.target.value)}
                              className="w-full rounded border border-slate-300 bg-white px-2 py-1 text-xs font-mono dark:border-slate-700 dark:bg-slate-800"
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="text"
                              value={item.description}
                              onChange={(e) => handleLocalItemChange(index, 'description', e.target.value)}
                              placeholder="e.g. 16GB DDR4 RAM, 512GB NVMe SSD, Fiber Cable..."
                              className="w-full rounded border border-slate-300 bg-white px-2 py-1 text-xs font-bold text-slate-900 dark:text-white dark:border-slate-700 dark:bg-slate-800"
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="text"
                              value={item.assetInventory}
                              onChange={(e) => handleLocalItemChange(index, 'assetInventory', e.target.value)}
                              className="w-full rounded border border-slate-300 bg-white px-2 py-1 text-xs dark:border-slate-700 dark:bg-slate-800"
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="text"
                              value={item.partOf}
                              onChange={(e) => handleLocalItemChange(index, 'partOf', e.target.value)}
                              className="w-full rounded border border-slate-300 bg-white px-2 py-1 text-xs dark:border-slate-700 dark:bg-slate-800"
                            />
                          </td>
                          <td className="p-2 text-center">
                            <input
                              type="text"
                              value={item.uom}
                              onChange={(e) => handleLocalItemChange(index, 'uom', e.target.value)}
                              className="w-full text-center rounded border border-slate-300 bg-white px-1 py-1 text-xs dark:border-slate-700 dark:bg-slate-800"
                            />
                          </td>
                          <td className="p-2 text-center">
                            <input
                              type="number"
                              value={item.qtyDemanded}
                              onChange={(e) => handleLocalItemChange(index, 'qtyDemanded', e.target.value)}
                              className="w-full text-center font-bold text-purple-700 dark:text-purple-300 rounded border border-slate-300 bg-white px-1 py-1 text-xs dark:border-slate-700 dark:bg-slate-800"
                            />
                          </td>
                          <td className="p-2 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveLocalDemandRow(index)}
                              className="text-rose-500 hover:text-rose-700 p-1"
                              title="Remove item"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Action Bar */}
              <div className="flex items-center justify-between border-t border-purple-100 pt-4 dark:border-purple-900/40">
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  Total Items Demanded: <span className="font-bold text-purple-700 dark:text-purple-300">{localDemandItems.length}</span>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={exportLocalDemandPDF}
                    className="flex items-center gap-2 rounded-xl bg-purple-600 px-5 py-2 text-xs font-extrabold text-white shadow-md hover:bg-purple-500 transition"
                  >
                    <FileDown className="h-4 w-4" />
                    <span>Download Local Demand PDF</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* CAAF-001 PROCUREMENT AUTHORIZATION FORM UI */
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
                <div className="flex flex-wrap items-center gap-4">
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
                  <label className="flex items-center gap-2 text-xs font-extrabold cursor-pointer text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/60 px-2 py-1 rounded-md border border-purple-200 dark:border-purple-800">
                    <input
                      type="radio"
                      name="reqType"
                      checked={reqType === 'local'}
                      onChange={() => setReqType('local')}
                      className="h-4 w-4 text-purple-600"
                    />
                    <span>🛍️ Local Market Procurement</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Section 1: Required Quantity */}
            <div className="space-y-3">
              <div className="flex items-center justify-between bg-slate-100 dark:bg-slate-800 px-3 py-2 font-bold text-xs text-slate-900 dark:text-white border-l-4 border-indigo-600">
                <span>1. Required Quantity (Hardware, and/or IT related peripherals):</span>
                <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold">Quick select item preset below</span>
              </div>

              {/* Quick Select Buttons for New Item & Local Procurement */}
              <div className="rounded-xl border border-purple-200 bg-purple-50/60 p-3 dark:border-purple-900/50 dark:bg-purple-950/30 space-y-2">
                <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-wider text-purple-900 dark:text-purple-300">
                  <span>🛍️ Quick Buttons for Local Procurement & New Item Purchasing:</span>
                  <span className="text-[10px] font-medium text-slate-500">Click button to auto fill authorization request</span>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {[
                    { label: '🛍️ LOCAL MARKET RAM/SSD', desc: 'Urgent Local RAM & SSD', type: 'other', detail: 'Local Purchase: 16GB RAM & 512GB NVMe SSD' },
                    { label: '💾 RAM', desc: '16GB DDR4 RAM Module', type: 'other', detail: '16GB DDR4 Desktop RAM Module' },
                    { label: '💽 SSD', desc: '512GB NVMe M.2 SSD', type: 'other', detail: '512GB NVMe M.2 High-Speed SSD' },
                    { label: '⌨️ KEYBOARD / MOUSE', desc: 'USB Keyboard & Mouse Combo', type: 'other', detail: 'USB Ergonomic Keyboard & Optical Mouse Set' },
                    { label: '🖥️ LED / MONITOR', desc: '24" FHD LED Monitor', type: 'other', detail: '24-inch Full HD IPS LED Display Monitor' },
                    { label: '💻 PC / DESKTOP', desc: 'Desktop Workstation PC', type: 'desktop', detail: 'Intel Core i7 Desktop Workstation PC' },
                    { label: '🖨️ PRINTER', desc: 'Laser Printer B/W', type: 'printerBw', detail: 'Heavy Duty Laser Printer B/W (Network Enabled)' },
                    { label: '🧵 FIBER CABLES / PATCHCORD', desc: 'Fiber LC-LC Patchcord', type: 'other', detail: '10m Fiber Optic LC-LC Single Mode Patchcord' },
                    { label: '🔌 POWER CABLES', desc: 'Heavy Duty C13 Power Cables', type: 'other', detail: '1.8m Heavy Duty C13 PC/Server Power Cable' },
                    { label: '🔌 USB PRINTER CABLES', desc: 'USB A-to-B Cable 3m', type: 'other', detail: '3m High-Speed USB 2.0 A-to-B Printer Cable' },
                    { label: '🧰 NEW TOOLS FOR IT LAB', desc: 'IT Lab Tool Kit', type: 'other', detail: 'IT Lab Tool Kit (Network Cable Tester, Crimper & Precision Screwdriver Set)' },
                    { label: '🛒 LOCAL REPAIR SPARES', desc: 'Local Spare Parts', type: 'other', detail: 'Local Market Repair Spares & Consumables' },
                    { label: '📦 OTHER DETAILS', desc: 'Custom Peripheral / Accessory', type: 'other', detail: 'Cat6 Network Patch Cable & Cable Organizer Roll' },
                  ].map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => {
                        setReqType('new');
                        if (preset.type === 'desktop') {
                          setDesktopQty((prev) => (Number(prev) || 0) + 1);
                        } else if (preset.type === 'printerBw') {
                          setPrinterBwQty((prev) => (Number(prev) || 0) + 1);
                        } else {
                          setOthersDetail((prev) => (prev ? `${prev}, 1 x ${preset.detail}` : `1 x ${preset.detail}`));
                        }
                        if (!justification.includes(preset.detail)) {
                          setJustification((prev) => `${prev} Required item: ${preset.detail} for IT operational maintenance.`);
                        }
                      }}
                      className="group flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-white px-2.5 py-1 text-xs font-bold text-slate-800 hover:border-indigo-500 hover:bg-indigo-100 dark:border-indigo-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 transition shadow-2xs"
                      title={`Click to add ${preset.desc} to request`}
                    >
                      <span>{preset.label}</span>
                    </button>
                  ))}
                </div>
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
        )}
      </div>
    </div>
  </div>
);
};
