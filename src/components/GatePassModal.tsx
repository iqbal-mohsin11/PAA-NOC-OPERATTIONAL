import React, { useState } from 'react';
import { jsPDF } from 'jspdf';
import { useInventory } from '../context/InventoryContext';
import { AssetItem, Department, DeviceCategory, GatePassType, GatePassStatus, GatePassRecord } from '../types/inventory';
import {
  X,
  ShieldCheck,
  Calendar,
  Building2,
  Wrench,
  UserCheck,
  FileText,
  Plus,
  Search,
  CheckCircle2,
  Printer,
  Download,
  FileDown,
  AlertTriangle,
  Truck,
  Phone,
  Clock,
  ExternalLink,
} from 'lucide-react';

interface GatePassModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedAsset?: AssetItem | null;
}

export const GatePassModal: React.FC<GatePassModalProps> = ({
  isOpen,
  onClose,
  preselectedAsset,
}) => {
  const { assets, gatePassRecords, addGatePassRecord, updateGatePassStatus, allDepartments, allCategories, userRole } = useInventory();

  const [activeTab, setActiveTab] = useState<'create' | 'register'>('create');

  // Form State
  const [gatePassType, setGatePassType] = useState<GatePassType>('Returnable (Market Repair)');
  const [issuedDate, setIssuedDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [expectedReturnDate, setExpectedReturnDate] = useState<string>(
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  );
  const [selectedAssetId, setSelectedAssetId] = useState<string>(preselectedAsset ? preselectedAsset.id : '');
  const [equipmentName, setEquipmentName] = useState<string>(preselectedAsset ? preselectedAsset.name : '');
  const [category, setCategory] = useState<DeviceCategory>(preselectedAsset ? preselectedAsset.category : 'Desktop PC');
  const [serialNumber, setSerialNumber] = useState<string>(preselectedAsset ? preselectedAsset.serialNumber : '');
  const [department, setDepartment] = useState<Department>(preselectedAsset ? preselectedAsset.department : 'IT');

  const [vendorMarketWorkshop, setVendorMarketWorkshop] = useState<string>('');
  const [vendorContactPerson, setVendorContactPerson] = useState<string>('');
  const [vendorPhone, setVendorPhone] = useState<string>('');
  const [defectReason, setDefectReason] = useState<string>('');

  const [carrierPersonName, setCarrierPersonName] = useState<string>('');
  const [carrierCNIC, setCarrierCNIC] = useState<string>('');
  const [securityClearedBy, setSecurityClearedBy] = useState<string>('');
  const [remarks, setRemarks] = useState<string>('');

  // Register Search & Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Print Voucher
  const [printingRecord, setPrintingRecord] = useState<any | null>(null);

  if (!isOpen) return null;

  const handleAssetSelect = (assetId: string) => {
    setSelectedAssetId(assetId);
    if (!assetId) return;
    const found = assets.find((a) => a.id === assetId);
    if (found) {
      setEquipmentName(found.name);
      setCategory(found.category);
      setSerialNumber(found.serialNumber);
      setDepartment(found.department);
    }
  };

  const handleSubmitGatePass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!equipmentName.trim() || !vendorMarketWorkshop.trim() || !defectReason.trim() || !carrierPersonName.trim()) {
      return;
    }

    addGatePassRecord({
      gatePassType,
      issuedDate,
      expectedReturnDate: gatePassType.includes('Returnable') ? expectedReturnDate : undefined,
      assetId: selectedAssetId || undefined,
      equipmentName: equipmentName.trim(),
      category,
      serialNumber: serialNumber.trim() || undefined,
      department,
      vendorMarketWorkshop: vendorMarketWorkshop.trim(),
      vendorContactPerson: vendorContactPerson.trim() || undefined,
      vendorPhone: vendorPhone.trim() || undefined,
      defectReason: defectReason.trim(),
      issuedByOfficer: `${userRole} Officer`,
      carrierPersonName: carrierPersonName.trim(),
      carrierCNIC: carrierCNIC.trim() || undefined,
      securityClearedBy: securityClearedBy.trim() || 'Pending Security Check',
      status: 'Out for Market Repair',
      remarks: remarks.trim() || undefined,
    });

    // Reset Form
    setDefectReason('');
    setCarrierPersonName('');
    setCarrierCNIC('');
    setVendorMarketWorkshop('');
    setVendorContactPerson('');
    setVendorPhone('');
    setRemarks('');
    setActiveTab('register');
  };

  const filteredRegister = gatePassRecords.filter((gp) => {
    if (typeFilter !== 'ALL' && gp.gatePassType !== typeFilter) return false;
    if (statusFilter !== 'ALL' && gp.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        gp.id.toLowerCase().includes(q) ||
        gp.equipmentName.toLowerCase().includes(q) ||
        gp.vendorMarketWorkshop.toLowerCase().includes(q) ||
        gp.department.toLowerCase().includes(q) ||
        gp.carrierPersonName.toLowerCase().includes(q) ||
        (gp.serialNumber && gp.serialNumber.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const exportGatePassCsv = () => {
    const headers = [
      'Gate Pass ID',
      'Type',
      'Issued Date',
      'Expected Return',
      'Actual Return',
      'Equipment Name',
      'Category',
      'Serial Number',
      'Department',
      'Market Workshop',
      'Defect Reason',
      'Carrier Person',
      'Carrier CNIC',
      'Security Clearance',
      'Status',
    ];
    const rows = filteredRegister.map((r) => [
      r.id,
      r.gatePassType,
      r.issuedDate,
      r.expectedReturnDate || 'N/A',
      r.actualReturnDate || 'N/A',
      r.equipmentName,
      r.category,
      r.serialNumber || 'N/A',
      r.department,
      r.vendorMarketWorkshop,
      r.defectReason,
      r.carrierPersonName,
      r.carrierCNIC || 'N/A',
      r.securityClearedBy || 'N/A',
      r.status,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.map((cell) => `"${cell}"`).join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `PAA_Market_Repair_GatePass_Register_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportGatePassPDF = (gp: GatePassRecord) => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    // Outer Navy Border
    doc.setDrawColor(30, 41, 59);
    doc.setLineWidth(0.8);
    doc.rect(8, 8, 194, 281);

    // Header Navy Bar
    doc.setFillColor(30, 41, 59);
    doc.rect(8, 8, 194, 28, 'F');

    // Title
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(15);
    doc.text('PAKISTAN AIRPORTS AUTHORITY', 105, 18, { align: 'center' });

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('OFFICIAL AIRPORT SECURITY GATE PASS - MARKET REPAIR DISPATCH', 105, 25, { align: 'center' });

    doc.setFontSize(8);
    doc.setTextColor(203, 213, 225);
    doc.text(`Gate Pass Ref: ${gp.id}    |    Issued Date: ${gp.issuedDate}`, 105, 31, { align: 'center' });

    // Inner Content Container Box
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.3);

    // Section 1: Gate Pass Metadata
    let currentY = 42;
    doc.setFillColor(241, 245, 249);
    doc.rect(12, currentY, 186, 8, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(30, 41, 59);
    doc.text('1. GATE PASS & DISPATCH METADATA', 15, currentY + 5.5);

    currentY += 14;
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.text('Gate Pass Type:', 15, currentY);
    doc.setFont('helvetica', 'normal');
    doc.text(gp.gatePassType, 48, currentY);

    doc.setFont('helvetica', 'bold');
    doc.text('Department:', 115, currentY);
    doc.setFont('helvetica', 'normal');
    doc.text(`${gp.department} Department`, 145, currentY);

    currentY += 7;
    doc.setFont('helvetica', 'bold');
    doc.text('Dispatch Date:', 15, currentY);
    doc.setFont('helvetica', 'normal');
    doc.text(gp.issuedDate, 48, currentY);

    doc.setFont('helvetica', 'bold');
    doc.text('Expected Return:', 115, currentY);
    doc.setFont('helvetica', 'normal');
    doc.text(gp.expectedReturnDate || 'N/A (Non-Returnable)', 145, currentY);

    currentY += 7;
    doc.setFont('helvetica', 'bold');
    doc.text('Security Status:', 15, currentY);
    doc.setFont('helvetica', 'normal');
    doc.text(gp.status, 48, currentY);

    if (gp.actualReturnDate) {
      doc.setFont('helvetica', 'bold');
      doc.text('Actual Return Date:', 115, currentY);
      doc.setFont('helvetica', 'normal');
      doc.text(gp.actualReturnDate, 145, currentY);
    }

    // Section 2: Equipment & Hardware Info
    currentY += 12;
    doc.setFillColor(241, 245, 249);
    doc.rect(12, currentY, 186, 8, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('2. EQUIPMENT & HARDWARE IDENTIFICATION', 15, currentY + 5.5);

    currentY += 14;
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.text('Equipment Name:', 15, currentY);
    doc.setFont('helvetica', 'normal');
    doc.text(gp.equipmentName, 48, currentY);

    doc.setFont('helvetica', 'bold');
    doc.text('Category:', 115, currentY);
    doc.setFont('helvetica', 'normal');
    doc.text(gp.category, 145, currentY);

    currentY += 7;
    doc.setFont('helvetica', 'bold');
    doc.text('Serial Number / Tag:', 15, currentY);
    doc.setFont('helvetica', 'normal');
    doc.text(gp.serialNumber || 'N/A', 48, currentY);

    doc.setFont('helvetica', 'bold');
    doc.text('Asset Ref ID:', 115, currentY);
    doc.setFont('helvetica', 'normal');
    doc.text(gp.assetId || 'Unregistered / Custom Entry', 145, currentY);

    // Section 3: Market Workshop & Defect
    currentY += 12;
    doc.setFillColor(241, 245, 249);
    doc.rect(12, currentY, 186, 8, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('3. MARKET REPAIR WORKSHOP & WORK REASON', 15, currentY + 5.5);

    currentY += 14;
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.text('Market Workshop:', 15, currentY);
    doc.setFont('helvetica', 'normal');
    const vendorLines = doc.splitTextToSize(gp.vendorMarketWorkshop, 140);
    doc.text(vendorLines, 48, currentY);

    currentY += vendorLines.length * 5 + 2;

    doc.setFont('helvetica', 'bold');
    doc.text('Contact Person:', 15, currentY);
    doc.setFont('helvetica', 'normal');
    doc.text(gp.vendorContactPerson || 'N/A', 48, currentY);

    doc.setFont('helvetica', 'bold');
    doc.text('Phone Number:', 115, currentY);
    doc.setFont('helvetica', 'normal');
    doc.text(gp.vendorPhone || 'N/A', 145, currentY);

    currentY += 7;
    doc.setFont('helvetica', 'bold');
    doc.text('Defect Description:', 15, currentY);
    doc.setFont('helvetica', 'normal');
    const defectLines = doc.splitTextToSize(gp.defectReason, 140);
    doc.text(defectLines, 48, currentY);

    currentY += defectLines.length * 5 + 2;

    // Section 4: Carrier & Security Gate Info
    currentY += 5;
    doc.setFillColor(241, 245, 249);
    doc.rect(12, currentY, 186, 8, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('4. CARRIER & SECURITY GATE CLEARANCE', 15, currentY + 5.5);

    currentY += 14;
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.text('Carrier Person:', 15, currentY);
    doc.setFont('helvetica', 'normal');
    doc.text(gp.carrierPersonName, 48, currentY);

    doc.setFont('helvetica', 'bold');
    doc.text('Carrier CNIC:', 115, currentY);
    doc.setFont('helvetica', 'normal');
    doc.text(gp.carrierCNIC || 'N/A', 145, currentY);

    currentY += 7;
    doc.setFont('helvetica', 'bold');
    doc.text('Issued By Officer:', 15, currentY);
    doc.setFont('helvetica', 'normal');
    doc.text(gp.issuedByOfficer, 48, currentY);

    doc.setFont('helvetica', 'bold');
    doc.text('Supervisor / Approved By:', 115, currentY);
    doc.setFont('helvetica', 'normal');
    doc.text(gp.securityClearedBy || 'Pending Supervisor Sign', 145, currentY);

    if (gp.remarks) {
      currentY += 7;
      doc.setFont('helvetica', 'bold');
      doc.text('Remarks / Notes:', 15, currentY);
      doc.setFont('helvetica', 'normal');
      const remarkLines = doc.splitTextToSize(gp.remarks, 140);
      doc.text(remarkLines, 48, currentY);
      currentY += remarkLines.length * 5;
    }

    // Section 5: Signatures & Verification Boxes
    currentY = Math.max(currentY + 15, 220);
    doc.setDrawColor(148, 163, 184);
    doc.setLineWidth(0.4);

    // Box 1: Issuing Officer
    doc.line(18, currentY + 15, 68, currentY + 15);
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.text('ISSUING OFFICER SIGNATURE', 43, currentY + 19, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.text(`(${gp.issuedByOfficer})`, 43, currentY + 23, { align: 'center' });

    // Box 2: Carrier Person
    doc.line(80, currentY + 15, 130, currentY + 15);
    doc.setFont('helvetica', 'bold');
    doc.text('CARRIER ACKNOWLEDGEMENT', 105, currentY + 19, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.text(`(${gp.carrierPersonName})`, 105, currentY + 23, { align: 'center' });

    // Box 3: Supervisor Sign & Stamp
    doc.line(142, currentY + 15, 192, currentY + 15);
    doc.setFont('helvetica', 'bold');
    doc.text('SUPERVISOR SIGNATURE', 167, currentY + 19, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.text('(Sign & Stamp of Supervisor)', 167, currentY + 23, { align: 'center' });

    // Footer Note
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text(
      'Notice: This gate pass is an official security document issued under Pakistan Airports Authority (PAA) security regulations.',
      105,
      278,
      { align: 'center' }
    );
    doc.text(
      'Returnable equipment must be re-inspected and verified at the airport security gate upon market repair completion.',
      105,
      282,
      { align: 'center' }
    );

    doc.save(`${gp.id}_PAA_Market_Repair_GatePass.pdf`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-4xl max-h-[92vh] overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900 my-auto flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-6 py-4 dark:border-slate-800 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-blue-700 text-white shadow-md">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                Market Repair Equipment Gate Pass Management
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Generate official returnable & non-returnable market repair gate passes for airport security dispatch
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-100/60 px-6 py-2 dark:border-slate-800 dark:bg-slate-800/30">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('create')}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
                activeTab === 'create'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-white text-slate-700 hover:bg-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800'
              }`}
            >
              <Plus className="h-4 w-4" />
              <span>Make Market Repair Gate Pass</span>
            </button>

            <button
              onClick={() => setActiveTab('register')}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
                activeTab === 'register'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-white text-slate-700 hover:bg-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800'
              }`}
            >
              <FileText className="h-4 w-4" />
              <span>Gate Pass Security Register ({gatePassRecords.length})</span>
            </button>
          </div>

          {activeTab === 'register' && (
            <button
              onClick={exportGatePassCsv}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              <Download className="h-3.5 w-3.5 text-indigo-500" />
              <span>Export CSV</span>
            </button>
          )}
        </div>

        {/* Tab 1: Form */}
        {activeTab === 'create' && (
          <form onSubmit={handleSubmitGatePass} className="p-6 space-y-5">
            <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/10 p-3 text-xs text-indigo-900 dark:text-indigo-200 flex items-start gap-2.5">
              <CheckCircle2 className="h-4 w-4 text-indigo-600 shrink-0 mt-0.5" />
              <span>
                Create a formal Pakistan Airports Authority (PAA) Gate Pass for equipment being dispatched to external market workshops for hardware repair or maintenance.
              </span>
            </div>

            {/* Pass Type & Dates */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Gate Pass Type <span className="text-rose-500">*</span>
                </label>
                <select
                  value={gatePassType}
                  onChange={(e) => setGatePassType(e.target.value as GatePassType)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:border-indigo-500 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                >
                  <option value="Returnable (Market Repair)">Returnable (Market Repair)</option>
                  <option value="Non-Returnable (Scrap/Replacement)">Non-Returnable (Scrap/Replacement)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Dispatch Date <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="date"
                    required
                    value={issuedDate}
                    onChange={(e) => setIssuedDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 py-2 text-xs font-bold text-slate-800 outline-none focus:border-indigo-500 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                  />
                </div>
              </div>

              {gatePassType.includes('Returnable') && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Expected Return Date
                  </label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <input
                      type="date"
                      value={expectedReturnDate}
                      onChange={(e) => setExpectedReturnDate(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 py-2 text-xs font-bold text-slate-800 outline-none focus:border-indigo-500 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Equipment Info */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-800/30 space-y-3">
              <h4 className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                1. Equipment & Asset Identification
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Select Existing Inventory Asset (Optional)
                  </label>
                  <select
                    value={selectedAssetId}
                    onChange={(e) => handleAssetSelect(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                  >
                    <option value="">-- Manual Equipment Entry (Unregistered / Custom Item) --</option>
                    {assets
                      .filter((a) => !a.isRemoved)
                      .map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.id} - {a.name} ({a.department} - S/N: {a.serialNumber})
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Equipment / Device Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Cisco Core Switch 3850, LaserJet Pro 400..."
                    value={equipmentName}
                    onChange={(e) => setEquipmentName(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as DeviceCategory)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                  >
                    {allCategories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Serial Number / Asset Tag
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. SN-998231-X"
                    value={serialNumber}
                    onChange={(e) => setSerialNumber(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-mono font-medium text-slate-800 outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Department
                  </label>
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value as Department)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                  >
                    {allDepartments.map((d) => (
                      <option key={d} value={d}>
                        {d} Department
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Vendor & Market Repair Workshop Details */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-800/30 space-y-3">
              <h4 className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                2. Market Workshop & Vendor Details
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Market Workshop / Repair Vendor Name & Address <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. MicroTech Service Center, Hafeez Centre / Saddar Electronics Market"
                    value={vendorMarketWorkshop}
                    onChange={(e) => setVendorMarketWorkshop(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Workshop Contact Person
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Engr. Asif Mahmood"
                    value={vendorContactPerson}
                    onChange={(e) => setVendorContactPerson(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-800 outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Vendor Phone Number
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. +92 300 1234567"
                    value={vendorPhone}
                    onChange={(e) => setVendorPhone(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-mono font-medium text-slate-800 outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Defect Description & Work to be Performed <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Power supply board repair, printhead heating replacement, optical sensor fix..."
                    value={defectReason}
                    onChange={(e) => setDefectReason(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-800 outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                  />
                </div>
              </div>
            </div>

            {/* Carrier & Security Clearance Details */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-800/30 space-y-3">
              <h4 className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                3. Carrier Dispatch & Security Gate Info
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Carrier / Transport Staff Name <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Truck className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Kamran Shah (IT Transport)"
                      value={carrierPersonName}
                      onChange={(e) => setCarrierPersonName(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 py-2 text-xs font-medium text-slate-800 outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Carrier CNIC Number
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 35202-8492019-3"
                    value={carrierCNIC}
                    onChange={(e) => setCarrierCNIC(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-mono font-medium text-slate-800 outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Approving Supervisor / Officer
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Engr. Asif Mahmood (IT Supervisor)"
                    value={securityClearedBy}
                    onChange={(e) => setSecurityClearedBy(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-800 outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                  />
                </div>
              </div>
            </div>

            {/* Remarks */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Additional Gate Pass Remarks / Special Authorization
              </label>
              <textarea
                rows={2}
                placeholder="Include accessories (power cables, adapters) or special gate authorization notes..."
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs font-medium text-slate-800 outline-none focus:border-indigo-500 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2 text-xs font-bold text-white shadow-md hover:bg-indigo-500 transition"
              >
                <ShieldCheck className="h-4 w-4" />
                <span>Generate Market Repair Gate Pass</span>
              </button>
            </div>
          </form>
        )}

        {/* Tab 2: Security Register */}
        {activeTab === 'register' && (
          <div className="p-6 space-y-4">
            {/* Search Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50/80 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 dark:bg-slate-800/40">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search gate pass #, equipment, market vendor..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 py-1.5 text-xs font-medium text-slate-800 outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                />
              </div>

              <div>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-800 outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                >
                  <option value="ALL">All Gate Pass Types</option>
                  <option value="Returnable (Market Repair)">Returnable (Market Repair)</option>
                  <option value="Non-Returnable (Scrap/Replacement)">Non-Returnable (Scrap/Replacement)</option>
                </select>
              </div>

              <div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-800 outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="Out for Market Repair">Out for Market Repair</option>
                  <option value="Returned & Repaired">Returned & Repaired</option>
                  <option value="Completed / Closed">Completed / Closed</option>
                </select>
              </div>
            </div>

            {/* Table */}
            {filteredRegister.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                <AlertTriangle className="h-10 w-10 text-slate-300 dark:text-slate-600 mb-2" />
                <p className="text-xs font-bold text-slate-600 dark:text-slate-400">
                  No gate passes match the selected filters.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-[11px] font-bold text-slate-600 dark:bg-slate-800/80 dark:text-slate-300 uppercase tracking-wider">
                    <tr>
                      <th className="px-3.5 py-3">Gate Pass ID</th>
                      <th className="px-3.5 py-3">Type</th>
                      <th className="px-3.5 py-3">Equipment & Dept</th>
                      <th className="px-3.5 py-3">Market Workshop</th>
                      <th className="px-3.5 py-3">Carrier / CNIC</th>
                      <th className="px-3.5 py-3">Status</th>
                      <th className="px-3.5 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                    {filteredRegister.map((gp) => (
                      <tr key={gp.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                        <td className="px-3.5 py-3 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                          {gp.id}
                          <div className="text-[10px] text-slate-400 font-normal">Issued: {gp.issuedDate}</div>
                        </td>
                        <td className="px-3.5 py-3 whitespace-nowrap">
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-bold border ${
                              gp.gatePassType.includes('Returnable')
                                ? 'bg-indigo-50 text-indigo-700 border-indigo-300 dark:bg-indigo-950/80 dark:text-indigo-300'
                                : 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300'
                            }`}
                          >
                            {gp.gatePassType.includes('Returnable') ? 'Returnable' : 'Non-Returnable'}
                          </span>
                        </td>
                        <td className="px-3.5 py-3">
                          <div className="font-bold text-slate-900 dark:text-white">{gp.equipmentName}</div>
                          <div className="text-[10px] text-slate-500 dark:text-slate-400">
                            {gp.department} • {gp.serialNumber ? `S/N: ${gp.serialNumber}` : 'No S/N'}
                          </div>
                        </td>
                        <td className="px-3.5 py-3">
                          <div className="font-semibold text-slate-800 dark:text-slate-200">{gp.vendorMarketWorkshop}</div>
                          {gp.vendorPhone && (
                            <div className="text-[10px] text-slate-400 flex items-center gap-1">
                              <Phone className="h-2.5 w-2.5" />
                              <span>{gp.vendorPhone}</span>
                            </div>
                          )}
                        </td>
                        <td className="px-3.5 py-3 text-slate-700 dark:text-slate-300">
                          <div>{gp.carrierPersonName}</div>
                          {gp.carrierCNIC && <div className="text-[10px] text-slate-400 font-mono">{gp.carrierCNIC}</div>}
                        </td>
                        <td className="px-3.5 py-3 whitespace-nowrap">
                          <span
                            className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${
                              gp.status === 'Out for Market Repair'
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300'
                                : gp.status === 'Returned & Repaired'
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300'
                                : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                            }`}
                          >
                            {gp.status}
                          </span>
                        </td>
                        <td className="px-3.5 py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {gp.status === 'Out for Market Repair' && gp.gatePassType.includes('Returnable') && (
                              <button
                                onClick={() =>
                                  updateGatePassStatus(
                                    gp.id,
                                    'Returned & Repaired',
                                    new Date().toISOString().slice(0, 10),
                                    'Cleared at Gate'
                                  )
                                }
                                className="rounded-md bg-emerald-600 px-2 py-1 text-[10px] font-bold text-white hover:bg-emerald-500 shadow-sm"
                                title="Mark Return & Re-entry from Market"
                              >
                                Mark Returned
                              </button>
                            )}

                            <button
                              onClick={() => exportGatePassPDF(gp)}
                              className="flex items-center gap-1 rounded-lg border border-indigo-200 bg-indigo-50 px-2 py-1 text-[11px] font-bold text-indigo-700 hover:bg-indigo-100 dark:border-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300 transition"
                              title="Download Official PDF Gate Pass"
                            >
                              <FileDown className="h-3 w-3 text-indigo-600 dark:text-indigo-400" />
                              <span>PDF</span>
                            </button>

                            <button
                              onClick={() => setPrintingRecord(gp)}
                              className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-bold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 transition"
                              title="Preview & Print Voucher"
                            >
                              <Printer className="h-3 w-3 text-slate-600 dark:text-slate-400" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Official Voucher Print Modal */}
        {printingRecord && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
            <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 space-y-4">
              <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-indigo-500" />
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                    PAA Official Equipment Market Repair Gate Pass
                  </h4>
                </div>
                <button
                  onClick={() => setPrintingRecord(null)}
                  className="rounded-lg p-1 text-slate-400 hover:text-slate-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Printable Format */}
              <div id="printable-gatepass-voucher" className="rounded-xl border border-slate-300 p-5 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 space-y-4">
                <div className="text-center border-b pb-3 border-slate-300">
                  <h5 className="font-black text-sm uppercase tracking-wider text-indigo-700 dark:text-indigo-400">
                    PAKISTAN AIRPORTS AUTHORITY
                  </h5>
                  <p className="text-[10px] font-bold text-slate-500 uppercase">
                    Airport Security Gate Pass - Market Equipment Repair Dispatch
                  </p>
                  <p className="text-[10px] font-mono text-slate-400 mt-1">
                    Pass Ref: <span className="font-bold">{printingRecord.id}</span> • Date: <span className="font-bold">{printingRecord.issuedDate}</span>
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-500 text-[10px] block uppercase font-bold">Pass Type</span>
                    <span className="font-bold text-indigo-600 dark:text-indigo-400">{printingRecord.gatePassType}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] block uppercase font-bold">Department</span>
                    <span className="font-bold">{printingRecord.department}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] block uppercase font-bold">Equipment Name</span>
                    <span className="font-bold">{printingRecord.equipmentName}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] block uppercase font-bold">Serial Number / Tag</span>
                    <span className="font-mono font-bold">{printingRecord.serialNumber || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] block uppercase font-bold">Market Workshop / Vendor</span>
                    <span className="font-bold">{printingRecord.vendorMarketWorkshop}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] block uppercase font-bold">Carrier Person</span>
                    <span className="font-bold">{printingRecord.carrierPersonName} ({printingRecord.carrierCNIC || 'No CNIC'})</span>
                  </div>
                </div>

                <div className="text-xs">
                  <span className="text-slate-500 text-[10px] block uppercase font-bold">Defect / Work Reason</span>
                  <p className="italic text-slate-600 dark:text-slate-300">{printingRecord.defectReason}</p>
                </div>

                {printingRecord.remarks && (
                  <div className="text-xs">
                    <span className="text-slate-500 text-[10px] block uppercase font-bold">Authorization Remarks</span>
                    <p className="text-slate-600 dark:text-slate-300">{printingRecord.remarks}</p>
                  </div>
                )}

                <div className="pt-6 border-t border-slate-300 grid grid-cols-2 gap-4 text-[10px] font-bold text-center">
                  <div>
                    <div className="border-b border-slate-400 mb-1 pb-4"></div>
                    <span>Issued By: {printingRecord.issuedByOfficer}</span>
                  </div>
                  <div>
                    <div className="border-b border-slate-400 mb-1 pb-4"></div>
                    <span>Supervisor Sign & Stamp</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={() => setPrintingRecord(null)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300"
                >
                  Close
                </button>
                <button
                  onClick={() => exportGatePassPDF(printingRecord)}
                  className="flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2 text-xs font-bold text-indigo-700 hover:bg-indigo-100 dark:border-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 transition"
                >
                  <FileDown className="h-4 w-4" />
                  <span>Download PDF</span>
                </button>
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-indigo-500 transition"
                >
                  <Printer className="h-4 w-4" />
                  <span>Print Gate Pass</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
