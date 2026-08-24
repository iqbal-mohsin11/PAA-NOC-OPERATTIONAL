import React, { useState } from 'react';
import { jsPDF } from 'jspdf';
import {
  X,
  Printer,
  FileSpreadsheet,
  PackageCheck,
  Building2,
  Calendar,
  FileText,
  UserCheck,
  CheckCircle2,
  Plus,
  RotateCcw,
  Boxes,
  Tag,
  Search,
  Eye,
} from 'lucide-react';
import { useInventory } from '../context/InventoryContext';
import { LogisticsReceivingRecord, DeviceCategory, Department } from '../types/inventory';

interface LogisticsReceivingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LogisticsReceivingModal: React.FC<LogisticsReceivingModalProps> = ({
  isOpen,
  onClose,
}) => {
  const {
    allDepartments,
    allBrands,
    allCategories,
    logisticsReceivingRecords,
    addLogisticsReceivingRecord,
    userRole,
  } = useInventory();

  const [activeTab, setActiveTab] = useState<'new' | 'history'>('new');

  // Form Fields
  const [logisticsSupplyRefNo, setLogisticsSupplyRefNo] = useState(
    `SUP/HQCAA/LOG/${new Date().getFullYear()}/${Math.floor(1000 + Math.random() * 9000)}`
  );
  const [localSupplyRefNo, setLocalSupplyRefNo] = useState(
    `LPO/PAA/IT/${new Date().getFullYear()}/${Math.floor(1000 + Math.random() * 9000)}`
  );
  const [receivedDate, setReceivedDate] = useState(new Date().toISOString().slice(0, 10));

  const [category, setCategory] = useState<DeviceCategory>('Desktop PC');
  const [brand, setBrand] = useState('HP');
  const [model, setModel] = useState('');
  const [specifications, setSpecifications] = useState('');
  const [quantity, setQuantity] = useState<number>(1);
  const [serialNumbersText, setSerialNumbersText] = useState<string>('');

  const [storeLocation, setStoreLocation] = useState('IT Central Store - PAA HQ');
  const [receivingPersonName, setReceivingPersonName] = useState('Engr. Tariq Mahmood');
  const [receivingPersonDesignation, setReceivingPersonDesignation] = useState(
    'Assistant Director (IT Logistics & Hardware)'
  );
  const [receivingPersonDate, setReceivingPersonDate] = useState(new Date().toISOString().slice(0, 10));
  const [department, setDepartment] = useState<Department>('IT');
  const [remarks, setRemarks] = useState('Received brand new sealed hardware in good order from HQCAA Supply Directorate.');
  const [autoCreateAssets, setAutoCreateAssets] = useState(true);

  // Search & Selected record for history
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRecordForView, setSelectedRecordForView] = useState<LogisticsReceivingRecord | null>(null);

  // Success state feedback
  const [lastCreatedRecord, setLastCreatedRecord] = useState<LogisticsReceivingRecord | null>(null);

  if (!isOpen) return null;

  const handleClearForm = () => {
    setLogisticsSupplyRefNo(`SUP/HQCAA/LOG/${new Date().getFullYear()}/${Math.floor(1000 + Math.random() * 9000)}`);
    setLocalSupplyRefNo(`LPO/PAA/IT/${new Date().getFullYear()}/${Math.floor(1000 + Math.random() * 9000)}`);
    setReceivedDate(new Date().toISOString().slice(0, 10));
    setCategory('Desktop PC');
    setBrand('HP');
    setModel('');
    setSpecifications('');
    setQuantity(1);
    setSerialNumbersText('');
    setStoreLocation('IT Central Store - PAA HQ');
    setReceivingPersonName('Engr. Tariq Mahmood');
    setReceivingPersonDesignation('Assistant Director (IT Logistics & Hardware)');
    setReceivingPersonDate(new Date().toISOString().slice(0, 10));
    setDepartment('IT');
    setRemarks('');
    setLastCreatedRecord(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const serialList = serialNumbersText
      ? serialNumbersText.split(/[\n,]+/).map((s) => s.trim()).filter(Boolean)
      : [];

    const record = addLogisticsReceivingRecord(
      {
        logisticsSupplyRefNo: logisticsSupplyRefNo.trim() || 'N/A',
        localSupplyRefNo: localSupplyRefNo.trim() || 'N/A',
        receivedDate,
        category,
        brand: brand.trim() || 'Generic',
        model: model.trim() || 'Standard Model',
        specifications: specifications.trim() || 'Standard Specifications',
        quantity: quantity > 0 ? quantity : 1,
        unitCostPkr: undefined,
        totalCostPkr: undefined,
        storeLocation: storeLocation.trim() || 'IT Store',
        receivingPersonName: receivingPersonName.trim() || 'IT Officer',
        receivingPersonDesignation: receivingPersonDesignation.trim() || 'Store Officer',
        receivingPersonDate,
        department,
        serialNumbers: serialList,
        remarks: remarks.trim(),
      },
      autoCreateAssets
    );

    setLastCreatedRecord(record);
  };

  const exportPDFForRecord = (record: LogisticsReceivingRecord) => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    // Header Title
    doc.setFillColor(15, 23, 42); // slate 900
    doc.rect(0, 0, 210, 28, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('PAKISTAN AIRPORTS AUTHORITY', 105, 11, { align: 'center' });

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('LOGISTICS (SUPPLY) HQCAA STORE ITEM RECEIVING VOUCHER (CAAF-005)', 105, 17, { align: 'center' });
    doc.text('HEADQUARTERS CIVIL AVIATION / AIRPORT IT STORE INWARD REGISTER', 105, 22, { align: 'center' });

    let y = 36;
    doc.setTextColor(0, 0, 0);

    // Reference Table Meta Box
    doc.setDrawColor(200, 200, 200);
    doc.setFillColor(248, 250, 252);
    doc.rect(10, y, 190, 28, 'FD');

    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('Receiving Voucher ID:', 14, y + 6);
    doc.setFont('helvetica', 'normal');
    doc.text(record.id, 55, y + 6);

    doc.setFont('helvetica', 'bold');
    doc.text('Supply HQCAA Ref No:', 110, y + 6);
    doc.setFont('helvetica', 'normal');
    doc.text(record.logisticsSupplyRefNo, 150, y + 6);

    doc.setFont('helvetica', 'bold');
    doc.text('Supply Receiving Date:', 14, y + 13);
    doc.setFont('helvetica', 'normal');
    doc.text(record.receivedDate, 55, y + 13);

    doc.setFont('helvetica', 'bold');
    doc.text('Local Supply LPO Ref:', 110, y + 13);
    doc.setFont('helvetica', 'normal');
    doc.text(record.localSupplyRefNo, 150, y + 13);

    doc.setFont('helvetica', 'bold');
    doc.text('IT Store Location:', 14, y + 20);
    doc.setFont('helvetica', 'normal');
    doc.text(record.storeLocation, 55, y + 20);

    doc.setFont('helvetica', 'bold');
    doc.text('Target Department:', 110, y + 20);
    doc.setFont('helvetica', 'normal');
    doc.text(`${record.department} Department`, 150, y + 20);

    y += 35;

    // Equipment Details Section Header
    doc.setFillColor(30, 41, 59);
    doc.rect(10, y, 190, 7, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('RECEIVED EQUIPMENT & HARDWARE SPECIFICATIONS', 14, y + 5);

    y += 10;
    doc.setTextColor(0, 0, 0);

    // Equipment Table Headers
    doc.setFillColor(226, 232, 240);
    doc.rect(10, y, 190, 7, 'FD');
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('Category', 12, y + 5);
    doc.text('Brand & Model', 45, y + 5);
    doc.text('Specifications / Technical Summary', 95, y + 5);
    doc.text('Qty Received', 168, y + 5);

    y += 7;
    doc.setFont('helvetica', 'normal');
    doc.rect(10, y, 190, 16);
    doc.text(record.category, 12, y + 5);
    doc.text(`${record.brand} ${record.model}`, 45, y + 5);

    const specLines = doc.splitTextToSize(record.specifications || 'N/A', 70);
    doc.text(specLines, 95, y + 5);

    doc.setFont('helvetica', 'bold');
    doc.text(String(record.quantity), 175, y + 5);

    y += 20;

    // Generated Asset Inventory Tag Numbers Block
    if (record.generatedAssetIds && record.generatedAssetIds.length > 0) {
      doc.setFillColor(241, 245, 249);
      doc.rect(10, y, 190, 20, 'FD');
      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'bold');
      doc.text('AUTO-GENERATED IT STORE INVENTORY ASSET TAG NUMBERS:', 14, y + 5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      const tagsString = record.generatedAssetIds.join(', ');
      const tagLines = doc.splitTextToSize(tagsString, 182);
      doc.text(tagLines, 14, y + 10);

      y += 24;
    }

    // Receiving Officer & Inspection Box
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('RECEIVING OFFICER & INSPECTION REMARKS', 10, y);
    y += 3;

    doc.setDrawColor(200, 200, 200);
    doc.setFillColor(255, 255, 255);
    doc.rect(10, y, 190, 18);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.text(`Receiving Person: ${record.receivingPersonName} (${record.receivingPersonDesignation})`, 14, y + 6);
    doc.text(`Receiving Date: ${record.receivingPersonDate}`, 120, y + 6);
    doc.text(`Inspection Remarks: ${record.remarks || 'Hardware received in good original sealed condition.'}`, 14, y + 12);

    y += 28;

    // Signatures
    doc.line(15, y + 18, 65, y + 18);
    doc.line(80, y + 18, 130, y + 18);
    doc.line(145, y + 18, 195, y + 18);

    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('SUPPLY DISPATCH OFFICER', 40, y + 23, { align: 'center' });
    doc.text('IT STORE RECEIVING OFFICER', 105, y + 23, { align: 'center' });
    doc.text('AD IT / STORE INCHARGE', 170, y + 23, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.text('Signature & Official Stamp', 40, y + 27, { align: 'center' });
    doc.text('Signature & Official Stamp', 105, y + 27, { align: 'center' });
    doc.text('Signature & Official Stamp', 170, y + 27, { align: 'center' });

    doc.save(`${record.id}_Supply_Receiving_Voucher.pdf`);
  };

  const filteredHistory = logisticsReceivingRecords.filter((rec) => {
    const q = searchQuery.toLowerCase();
    return (
      rec.id.toLowerCase().includes(q) ||
      rec.logisticsSupplyRefNo.toLowerCase().includes(q) ||
      rec.localSupplyRefNo.toLowerCase().includes(q) ||
      rec.brand.toLowerCase().includes(q) ||
      rec.model.toLowerCase().includes(q) ||
      rec.receivingPersonName.toLowerCase().includes(q) ||
      rec.storeLocation.toLowerCase().includes(q)
    );
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm animate-fadeIn overflow-y-auto print:p-0 print:bg-white">
      <div
        id="printable-local-demand-form"
        className="w-full max-w-5xl max-h-[92vh] flex flex-col rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900 overflow-hidden my-auto print:shadow-none print:border-none print:max-h-none print:w-full"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-4 dark:border-slate-800 dark:bg-slate-900/50 print:hidden">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-600 text-white shadow-md shadow-purple-600/20">
              <PackageCheck className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Logistics & Supply HQCAA Store Item Receiving Register
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Log items received from Supply Directorate, generate receiving vouchers & auto-create inventory assets
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex rounded-lg border border-slate-200 bg-slate-100 p-1 dark:border-slate-800 dark:bg-slate-800/80">
              <button
                onClick={() => setActiveTab('new')}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-bold transition ${activeTab === 'new' ? 'bg-white text-purple-700 shadow-2xs dark:bg-slate-900 dark:text-purple-400' : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'}`}
              >
                <Plus className="h-3.5 w-3.5" />
                <span>New Receiving Voucher</span>
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-bold transition ${activeTab === 'history' ? 'bg-white text-purple-700 shadow-2xs dark:bg-slate-900 dark:text-purple-400' : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'}`}
              >
                <Boxes className="h-3.5 w-3.5" />
                <span>Receiving Registers ({logisticsReceivingRecords.length})</span>
              </button>
            </div>

            <button
              onClick={onClose}
              className="rounded-lg p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === 'new' ? (
            <>
              {/* Success Feedback Banner */}
              {lastCreatedRecord && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50/90 p-4 dark:border-emerald-900/60 dark:bg-emerald-950/70 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold text-sm">
                      <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                      <span>Item Receiving Voucher {lastCreatedRecord.id} Saved Successfully!</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => exportPDFForRecord(lastCreatedRecord)}
                        className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1 text-xs font-bold text-white hover:bg-emerald-700 shadow-2xs transition"
                      >
                        <FileSpreadsheet className="h-3.5 w-3.5" />
                        <span>Download PDF Voucher</span>
                      </button>
                      <button
                        onClick={() => window.print()}
                        className="flex items-center gap-1.5 rounded-lg border border-emerald-300 bg-white px-3 py-1 text-xs font-bold text-emerald-800 hover:bg-emerald-100 transition shadow-2xs"
                      >
                        <Printer className="h-3.5 w-3.5" />
                        <span>Print Voucher</span>
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-emerald-700 dark:text-emerald-400">
                    Received <strong>{lastCreatedRecord.quantity}x {lastCreatedRecord.brand} {lastCreatedRecord.model}</strong> from Supply HQCAA ({lastCreatedRecord.logisticsSupplyRefNo}).
                    {lastCreatedRecord.generatedAssetIds && lastCreatedRecord.generatedAssetIds.length > 0 ? (
                      <span className="block mt-1 font-mono text-emerald-900 dark:text-emerald-200">
                        Auto-Created Inventory Assets: {lastCreatedRecord.generatedAssetIds.join(', ')}
                      </span>
                    ) : (
                      ' Registered in Store receiving logs.'
                    )}
                  </p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* 1. Supply Reference Information */}
                <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-900/40 space-y-4">
                  <h3 className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-purple-700 dark:text-purple-400">
                    <Building2 className="h-4 w-4" />
                    1. Logistics (Supply) HQCAA Reference Information
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Supply HQCAA Reference No *
                      </label>
                      <input
                        type="text"
                        required
                        value={logisticsSupplyRefNo}
                        onChange={(e) => setLogisticsSupplyRefNo(e.target.value)}
                        placeholder="e.g. SUP/HQCAA/LOG/2026/8942"
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-mono font-semibold text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:border-purple-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Local Supply LPO / PO Reference No
                      </label>
                      <input
                        type="text"
                        value={localSupplyRefNo}
                        onChange={(e) => setLocalSupplyRefNo(e.target.value)}
                        placeholder="e.g. LPO/PAA/IT/2026/4102"
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-mono font-semibold text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:border-purple-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Supply Received Date *
                      </label>
                      <input
                        type="date"
                        required
                        value={receivedDate}
                        onChange={(e) => setReceivedDate(e.target.value)}
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:border-purple-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* 2. Equipment & Specifications */}
                <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-900/40 space-y-4">
                  <h3 className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-purple-700 dark:text-purple-400">
                    <FileText className="h-4 w-4" />
                    2. Received Equipment Details & Specifications
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Equipment Category *
                      </label>
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value as DeviceCategory)}
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:border-purple-500 focus:outline-none"
                      >
                        {allCategories.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Brand / Manufacturer *
                      </label>
                      <input
                        type="text"
                        required
                        value={brand}
                        onChange={(e) => setBrand(e.target.value)}
                        placeholder="e.g. HP, Dell, Cisco, Canon"
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:border-purple-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Model Name / Series *
                      </label>
                      <input
                        type="text"
                        required
                        value={model}
                        onChange={(e) => setModel(e.target.value)}
                        placeholder="e.g. ProDesk 400 G9 / Catalyst 9300"
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:border-purple-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Quantity Received *
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="200"
                        required
                        value={quantity}
                        onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-purple-700 dark:text-purple-300 dark:border-slate-700 dark:bg-slate-800 focus:border-purple-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Equipment Specifications / Technical Summary
                    </label>
                    <input
                      type="text"
                      value={specifications}
                      onChange={(e) => setSpecifications(e.target.value)}
                      placeholder="e.g. Intel Core i7 13th Gen, 16GB DDR5, 512GB NVMe SSD, 21.5 IPS LED"
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:border-purple-500 focus:outline-none"
                    />
                  </div>

                  {/* Serial Numbers List Input */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Serial Numbers (Optional - Enter {quantity} serial numbers separated by commas or lines)
                    </label>
                    <textarea
                      rows={2}
                      value={serialNumbersText}
                      onChange={(e) => setSerialNumbersText(e.target.value)}
                      placeholder={`e.g. SN-HP-101, SN-HP-102, SN-HP-103 ... (Will auto-assign to generated asset tags)`}
                      className="w-full rounded-lg border border-slate-300 bg-white p-2.5 text-xs font-mono text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:border-purple-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* 3. IT Store Location & Receiving Personnel */}
                <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-900/40 space-y-4">
                  <h3 className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-purple-700 dark:text-purple-400">
                    <UserCheck className="h-4 w-4" />
                    3. IT Store Receiving Location & Officer Sign-off
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Equipment Received in IT Store Location *
                      </label>
                      <input
                        type="text"
                        required
                        value={storeLocation}
                        onChange={(e) => setStoreLocation(e.target.value)}
                        placeholder="e.g. IT Central Store - PAA HQ"
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:border-purple-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        IT Receiving Person Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={receivingPersonName}
                        onChange={(e) => setReceivingPersonName(e.target.value)}
                        placeholder="e.g. Engr. Tariq Mahmood"
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:border-purple-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Receiving Officer Designation
                      </label>
                      <input
                        type="text"
                        value={receivingPersonDesignation}
                        onChange={(e) => setReceivingPersonDesignation(e.target.value)}
                        placeholder="e.g. Assistant Director IT"
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:border-purple-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        IT Store Receiving Date *
                      </label>
                      <input
                        type="date"
                        required
                        value={receivingPersonDate}
                        onChange={(e) => setReceivingPersonDate(e.target.value)}
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:border-purple-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Assign Department *
                      </label>
                      <select
                        value={department}
                        onChange={(e) => setDepartment(e.target.value as Department)}
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:border-purple-500 focus:outline-none"
                      >
                        {allDepartments.map((d) => (
                          <option key={d} value={d}>
                            {d} Department
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Inspection Remarks / Condition
                      </label>
                      <input
                        type="text"
                        value={remarks}
                        onChange={(e) => setRemarks(e.target.value)}
                        placeholder="e.g. Brand new sealed condition, inspected ok"
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:border-purple-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Auto Create Assets Option */}
                  <div className="rounded-xl border border-purple-200 bg-purple-50/80 p-3.5 dark:border-purple-900/60 dark:bg-purple-950/70 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-600 text-white">
                        <Tag className="h-4 w-4" />
                      </div>
                      <div>
                        <span className="text-xs font-extrabold text-purple-900 dark:text-purple-200 block">
                          Auto-Generate Multiple Asset Tag Records
                        </span>
                        <span className="text-[11px] text-purple-700 dark:text-purple-300 block">
                          Automatically generate {quantity} individual asset inventory item(s) (e.g. PAA-AST-100XX) with barcodes upon saving.
                        </span>
                      </div>
                    </div>

                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={autoCreateAssets}
                        onChange={(e) => setAutoCreateAssets(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:peer-focus:ring-purple-800 peer-checked:bg-purple-600"></div>
                    </label>
                  </div>
                </div>

                {/* Form Actions */}
                <div className="flex items-center justify-between border-t border-slate-200 pt-4 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={handleClearForm}
                    className="flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 transition"
                  >
                    <RotateCcw className="h-4 w-4" />
                    <span>Reset Form</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={onClose}
                      className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex items-center gap-2 rounded-xl bg-purple-600 px-5 py-2 text-xs font-extrabold text-white hover:bg-purple-700 shadow-md shadow-purple-600/20 transition"
                    >
                      <PackageCheck className="h-4 w-4" />
                      <span>Save Item Receiving Voucher</span>
                    </button>
                  </div>
                </div>
              </form>
            </>
          ) : (
            /* History Tab */
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="relative w-full sm:w-80">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search voucher ID, supply ref, brand, officer..."
                    className="w-full rounded-xl border border-slate-300 bg-white pl-9 pr-3 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:border-purple-500 focus:outline-none"
                  />
                </div>

                <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  Showing {filteredHistory.length} receiving vouchers
                </div>
              </div>

              {filteredHistory.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center dark:border-slate-800">
                  <Boxes className="mx-auto h-8 w-8 text-slate-400 mb-2" />
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    No receiving vouchers found
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Use the 'New Receiving Voucher' tab to register items received from Supply HQCAA.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredHistory.map((rec) => (
                    <div
                      key={rec.id}
                      className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs hover:border-purple-300 dark:border-slate-800 dark:bg-slate-800/80 dark:hover:border-purple-800 transition space-y-3"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5 dark:border-slate-800">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-extrabold text-purple-700 dark:text-purple-400">
                            {rec.id}
                          </span>
                          <span className="rounded-md bg-purple-100 px-2 py-0.5 text-[10px] font-bold text-purple-800 dark:bg-purple-950 dark:text-purple-300">
                            Supply Ref: {rec.logisticsSupplyRefNo}
                          </span>
                          {rec.localSupplyRefNo && rec.localSupplyRefNo !== 'N/A' && (
                            <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                              LPO: {rec.localSupplyRefNo}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => exportPDFForRecord(rec)}
                            className="flex items-center gap-1 rounded-lg border border-purple-200 bg-purple-50 px-2.5 py-1 text-xs font-bold text-purple-700 hover:bg-purple-100 dark:border-purple-800 dark:bg-purple-950 dark:text-purple-300 transition"
                          >
                            <FileSpreadsheet className="h-3.5 w-3.5" />
                            <span>PDF</span>
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                        <div>
                          <span className="text-slate-400 text-[10px] block uppercase font-bold">Equipment</span>
                          <span className="font-extrabold text-slate-800 dark:text-slate-200">
                            {rec.brand} {rec.model} ({rec.category})
                          </span>
                        </div>

                        <div>
                          <span className="text-slate-400 text-[10px] block uppercase font-bold">Quantity & Store</span>
                          <span className="font-bold text-purple-700 dark:text-purple-300">
                            {rec.quantity} Unit(s) • {rec.storeLocation}
                          </span>
                        </div>

                        <div>
                          <span className="text-slate-400 text-[10px] block uppercase font-bold">IT Receiving Person</span>
                          <span className="font-semibold text-slate-700 dark:text-slate-300">
                            {rec.receivingPersonName} ({rec.receivingPersonDate})
                          </span>
                        </div>

                        <div>
                          <span className="text-slate-400 text-[10px] block uppercase font-bold">Department</span>
                          <span className="font-bold text-slate-800 dark:text-slate-200">
                            {rec.department} Department
                          </span>
                        </div>
                      </div>

                      {rec.generatedAssetIds && rec.generatedAssetIds.length > 0 && (
                        <div className="rounded-lg bg-slate-50 p-2 text-[11px] font-mono text-slate-700 dark:bg-slate-900/60 dark:text-slate-300 border border-slate-200 dark:border-slate-800">
                          <span className="font-bold text-slate-900 dark:text-white mr-2">Generated Asset Tags:</span>
                          {rec.generatedAssetIds.join(', ')}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
