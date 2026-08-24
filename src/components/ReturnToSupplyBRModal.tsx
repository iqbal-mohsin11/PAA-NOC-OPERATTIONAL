import React, { useState } from 'react';
import { jsPDF } from 'jspdf';
import { useInventory } from '../context/InventoryContext';
import { AssetItem, Department, DeviceCategory } from '../types/inventory';
import {
  X,
  RotateCcw,
  Printer,
  Building2,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Truck,
  UserCheck,
  ShieldAlert,
  Plus,
  Trash2,
  Package,
  Layers,
  ListPlus,
  Search,
  CheckSquare,
  Square,
  PackageCheck,
} from 'lucide-react';

interface ReturnToSupplyBRModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedAsset?: AssetItem | null;
}

export interface ReturnItemEntry {
  id: string;
  assetId?: string;
  equipmentName: string;
  category: DeviceCategory;
  serialNumber: string;
  department: Department;
  assignedUser: string;
  defectDetails: string;
}

export const ReturnToSupplyBRModal: React.FC<ReturnToSupplyBRModalProps> = ({
  isOpen,
  onClose,
  preselectedAsset,
}) => {
  const { assets, softRemoveAsset, addAuditLog, allDepartments, settings } = useInventory();

  const activeAssets = assets.filter((a) => !a.isRemoved);

  // Form state
  const [voucherNo, setVoucherNo] = useState<string>(
    `PAA-BR-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`
  );
  const [returnDate, setReturnDate] = useState<string>(new Date().toISOString().slice(0, 10));

  // Multi-entry items box list
  const [items, setItems] = useState<ReturnItemEntry[]>(() => {
    if (preselectedAsset) {
      return [
        {
          id: `item-${Date.now()}`,
          assetId: preselectedAsset.id,
          equipmentName: preselectedAsset.name,
          category: preselectedAsset.category,
          serialNumber: preselectedAsset.serialNumber,
          department: preselectedAsset.department,
          assignedUser: preselectedAsset.assignedUser || '',
          defectDetails: 'Hardware Unserviceable - Declared BR / BER by IT Engineer',
        },
      ];
    }
    return [];
  });

  // Draft form input state for adding single/multiple items
  const [selectedAssetId, setSelectedAssetId] = useState<string>('');
  const [equipmentName, setEquipmentName] = useState<string>('');
  const [assignedUser, setAssignedUser] = useState<string>('');
  const [category, setCategory] = useState<DeviceCategory>('Desktop PC');
  const [serialNumber, setSerialNumber] = useState<string>('');
  const [department, setDepartment] = useState<Department>('IT');
  const [defectDetails, setDefectDetails] = useState<string>(
    'Hardware Unserviceable - Declared BR / BER by IT Engineer'
  );

  const [returnType, setReturnType] = useState<string>('Beyond Economical Repair (BER / BR)');
  const [returningOfficer, setReturningOfficer] = useState<string>('Muhammad Bilal (IT Officer)');
  const [receivingSupplyOfficer, setReceivingSupplyOfficer] = useState<string>('Store In-Charge (Supply Store)');
  const [archiveFromActive, setArchiveFromActive] = useState<boolean>(true);
  const [remarks, setRemarks] = useState<string>('Returned to Supply Store for disposal/scrap auction.');

  const [submittedVoucher, setSubmittedVoucher] = useState<any | null>(null);

  // Inventory search & multi-select states
  const [inventorySearchQuery, setInventorySearchQuery] = useState<string>('');
  const [selectedInventoryAssetIds, setSelectedInventoryAssetIds] = useState<string[]>([]);
  const [showManualEntryForm, setShowManualEntryForm] = useState<boolean>(false);

  if (!isOpen) return null;

  const filteredActiveAssets = activeAssets.filter((a) => {
    if (!inventorySearchQuery.trim()) return true;
    const q = inventorySearchQuery.toLowerCase();
    return (
      a.id.toLowerCase().includes(q) ||
      a.name.toLowerCase().includes(q) ||
      a.serialNumber.toLowerCase().includes(q) ||
      a.department.toLowerCase().includes(q) ||
      (a.assignedUser && a.assignedUser.toLowerCase().includes(q))
    );
  });

  const handleAddSingleInventoryAssetToBox = (asset: AssetItem) => {
    if (items.some((i) => i.assetId === asset.id)) {
      return;
    }
    const newItem: ReturnItemEntry = {
      id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      assetId: asset.id,
      equipmentName: asset.name,
      category: asset.category,
      serialNumber: asset.serialNumber,
      department: asset.department,
      assignedUser: asset.assignedUser || '',
      defectDetails: 'Hardware Unserviceable - Declared BR / BER by IT Engineer',
    };
    setItems((prev) => [...prev, newItem]);
  };

  const handleToggleSelectInventoryAsset = (assetId: string) => {
    setSelectedInventoryAssetIds((prev) =>
      prev.includes(assetId) ? prev.filter((id) => id !== assetId) : [...prev, assetId]
    );
  };

  const handleAddBulkSelectedInventoryAssets = () => {
    const newEntries: ReturnItemEntry[] = [];
    selectedInventoryAssetIds.forEach((assetId) => {
      if (!items.some((i) => i.assetId === assetId)) {
        const found = activeAssets.find((a) => a.id === assetId);
        if (found) {
          newEntries.push({
            id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            assetId: found.id,
            equipmentName: found.name,
            category: found.category,
            serialNumber: found.serialNumber,
            department: found.department,
            assignedUser: found.assignedUser || '',
            defectDetails: 'Hardware Unserviceable - Declared BR / BER by IT Engineer',
          });
        }
      }
    });
    if (newEntries.length > 0) {
      setItems((prev) => [...prev, ...newEntries]);
      setSelectedInventoryAssetIds([]);
    }
  };

  const handleAssetSelect = (assetId: string) => {
    setSelectedAssetId(assetId);
    if (!assetId) return;
    const found = activeAssets.find((a) => a.id === assetId);
    if (found) {
      setEquipmentName(found.name);
      setCategory(found.category);
      setSerialNumber(found.serialNumber);
      setDepartment(found.department);
      setAssignedUser(found.assignedUser || '');
    }
  };

  const handleAddItemToBox = () => {
    if (!equipmentName.trim()) {
      alert('Please enter equipment name or select an asset from inventory.');
      return;
    }

    const newItem: ReturnItemEntry = {
      id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      assetId: selectedAssetId || undefined,
      equipmentName: equipmentName.trim(),
      category,
      serialNumber: serialNumber.trim() || 'N/A',
      department,
      assignedUser: assignedUser.trim(),
      defectDetails: defectDetails.trim() || 'Hardware Unserviceable - Declared BR / BER by IT Engineer',
    };

    setItems((prev) => [...prev, newItem]);

    // Reset draft fields for next item
    setSelectedAssetId('');
    setEquipmentName('');
    setSerialNumber('');
    setAssignedUser('');
  };

  const handleRemoveItemFromBox = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    let finalItems = [...items];

    // If form fields are currently filled out, automatically include this item
    if (equipmentName.trim()) {
      finalItems.push({
        id: `item-${Date.now()}`,
        assetId: selectedAssetId || undefined,
        equipmentName: equipmentName.trim(),
        category,
        serialNumber: serialNumber.trim() || 'N/A',
        department,
        assignedUser: assignedUser.trim(),
        defectDetails: defectDetails.trim() || 'Hardware Unserviceable - Declared BR / BER by IT Engineer',
      });
      // Clear draft form inputs after push
      setEquipmentName('');
      setSelectedAssetId('');
      setSerialNumber('');
      setAssignedUser('');
    }

    if (finalItems.length === 0) {
      alert('Please select or add at least one equipment/asset item to return.');
      return;
    }

    const record = {
      voucherNo,
      returnDate,
      items: finalItems,
      returnType,
      returningOfficer: returningOfficer.trim(),
      receivingSupplyOfficer: receivingSupplyOfficer.trim(),
      remarks: remarks.trim(),
    };

    // Soft remove assets if archiveFromActive is enabled
    finalItems.forEach((item) => {
      if (item.assetId && archiveFromActive) {
        softRemoveAsset(
          item.assetId,
          'Scrap', // Removal reason
          `Returned to Supply Store under BR / BER Voucher ${voucherNo}. Defect: ${item.defectDetails}`,
          returningOfficer.trim()
        );
      } else {
        addAuditLog(
          'Return to Supply / BR Voucher Created',
          `Return Voucher ${voucherNo} issued for ${item.equipmentName} (${item.category}) back to Supply store.`,
          item.assetId || undefined,
          'warning'
        );
      }
    });

    setSubmittedVoucher(record);
  };

  const handlePrintA4Voucher = (rec: any) => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    // Header Title Banner
    doc.setFillColor(15, 23, 42); // slate 900
    doc.rect(0, 0, 210, 34, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text(`${settings.organizationName || 'PAKISTAN AIRPORTS AUTHORITY'}`, 14, 9);

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(`RETURN TO SUPPLY IT AIIAP`, 14, 17);

    doc.setFontSize(9);
    doc.setTextColor(192, 132, 252);
    doc.text(`IT AIIAP LAHORE — EQUIPMENT RETURN / BR VOUCHER`, 14, 23);

    doc.setFontSize(7.5);
    doc.setTextColor(203, 213, 225);
    doc.text(
      `Voucher No: ${rec.voucherNo}  |  Issued Date: ${rec.returnDate}  |  Classification: ${rec.returnType}`,
      14,
      29
    );

    let y = 38;

    // Equipment Items Box Table Header
    doc.setFillColor(241, 245, 249);
    doc.rect(14, y, 182, 7, 'F');
    doc.setDrawColor(203, 213, 225);
    doc.rect(14, y, 182, 7, 'S');

    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text('#', 16, y + 5);
    doc.text('Equipment Name & Category', 24, y + 5);
    doc.text('Serial / Tag No', 85, y + 5);
    doc.text('Dept & User', 125, y + 5);
    doc.text('Technical Fault / Defect', 160, y + 5);

    y += 7;

    // Items List Rows
    const itemsList: ReturnItemEntry[] = rec.items || [];
    doc.setFont('helvetica', 'normal');

    itemsList.forEach((item, idx) => {
      const rowHeight = 12;
      doc.setFillColor(idx % 2 === 0 ? 255 : 250, idx % 2 === 0 ? 255 : 250, idx % 2 === 0 ? 255 : 250);
      doc.rect(14, y, 182, rowHeight, 'F');
      doc.rect(14, y, 182, rowHeight, 'S');

      doc.setTextColor(15, 23, 42);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.text(`${idx + 1}`, 16, y + 5);

      doc.text(item.equipmentName.substring(0, 32), 24, y + 5);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(100, 116, 139);
      doc.text(`Cat: ${item.category}`, 24, y + 9);

      doc.setFontSize(7.5);
      doc.setTextColor(15, 23, 42);
      doc.text(item.serialNumber || 'N/A', 85, y + 5);
      if (item.assetId) {
        doc.setFontSize(6.5);
        doc.setTextColor(100, 116, 139);
        doc.text(`ID: ${item.assetId}`, 85, y + 9);
      }

      doc.setFontSize(7.5);
      doc.setTextColor(15, 23, 42);
      doc.text(`${item.department}`, 125, y + 5);
      if (item.assignedUser) {
        doc.setFontSize(6.5);
        doc.setTextColor(100, 116, 139);
        doc.text(`User: ${item.assignedUser.substring(0, 18)}`, 125, y + 9);
      }

      doc.setFontSize(7);
      doc.setTextColor(185, 28, 28);
      const defectTxt = doc.splitTextToSize(item.defectDetails || 'BR Fault', 34);
      doc.text(defectTxt, 160, y + 4);

      y += rowHeight;
    });

    if (rec.remarks) {
      y += 4;
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(51, 65, 85);
      doc.text(`Additional Remarks: ${rec.remarks}`, 14, y);
      y += 4;
    } else {
      y += 2;
    }

    // Signature Boxes Section
    y += 4;
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.text('AUTHORIZATION & RECEIPT SIGNATURE BOXES', 14, y);

    y += 4;

    // Box 1: IT Department
    doc.setDrawColor(203, 213, 225);
    doc.setFillColor(255, 255, 255);
    doc.rect(14, y, 88, 42, 'S');

    doc.setFillColor(241, 245, 249);
    doc.rect(14, y, 88, 7, 'F');
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text('1. ISSUED / HANDED OVER BY (IT DEPT)', 16, y + 5);

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(51, 65, 85);
    doc.text(`Officer Name: ${rec.returningOfficer}`, 17, y + 13);
    doc.text(`Date of Handover: ${rec.returnDate}`, 17, y + 18);

    doc.setDrawColor(148, 163, 184);
    doc.line(17, y + 31, 80, y + 31);
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text('Signature & Official IT Dept Seal', 17, y + 35);

    // Box 2: Supply Store
    doc.setDrawColor(203, 213, 225);
    doc.rect(108, y, 88, 42, 'S');

    doc.setFillColor(241, 245, 249);
    doc.rect(108, y, 88, 7, 'F');
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text('2. RECEIVED BY (SUPPLY STORE)', 110, y + 5);

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(51, 65, 85);
    doc.text(`Store Receiver: ${rec.receivingSupplyOfficer}`, 111, y + 13);
    doc.text(`Date of Receipt: _______________`, 111, y + 18);

    doc.line(111, y + 31, 158, y + 31);
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text('Receiver Signature & Date', 111, y + 35);

    doc.setDrawColor(203, 213, 225);
    doc.rect(162, y + 20, 31, 19, 'S');
    doc.setFontSize(6.5);
    doc.text('Official Supply', 164, y + 27);
    doc.text('Store Stamp', 164, y + 32);

    // Footer
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `RETURN TO SUPPLY IT AIIAP Voucher System — Page 1 of 1 — Generated ${new Date().toLocaleDateString()}`,
      14,
      285
    );

    doc.save(`Return_To_Supply_Voucher_${rec.voucherNo}.pdf`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/60 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-3xl rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800 max-h-[92vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4 dark:border-slate-800">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400">
            <RotateCcw className="h-5 w-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-black text-slate-900 text-lg dark:text-white uppercase tracking-tight">
                RETURN TO SUPPLY IT AIIAP
              </h3>
            </div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              IT AIIAP LAHORE — Official Equipment Return to Supply / Beyond Economical Repair Voucher
            </p>
          </div>
        </div>

        {submittedVoucher ? (
          <div className="mt-6 space-y-4 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-7 w-7" />
            </div>
            <h4 className="font-bold text-slate-900 dark:text-white text-base">
              RETURN TO SUPPLY IT AIIAP Voucher Issued Successfully!
            </h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Voucher No <strong className="text-rose-600">{submittedVoucher.voucherNo}</strong> recorded for{' '}
              <strong>{submittedVoucher.items?.length || 1} hardware item(s)</strong>. Returned to Supply store.
            </p>

            {/* Added Items Summary Box */}
            <div className="mx-auto max-w-lg text-left rounded-xl border border-slate-200 bg-slate-50 p-3.5 dark:border-slate-800 dark:bg-slate-800/60 text-xs space-y-2">
              <span className="font-bold text-slate-800 dark:text-slate-200 text-[11px] block border-b border-slate-200 dark:border-slate-700 pb-1">
                Equipment Items Included in Voucher ({submittedVoucher.items?.length || 0})
              </span>
              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {submittedVoucher.items?.map((it: ReturnItemEntry, idx: number) => (
                  <div
                    key={it.id || idx}
                    className="flex items-center justify-between rounded bg-white p-2 border border-slate-200 dark:bg-slate-900 dark:border-slate-700 text-[11px]"
                  >
                    <div>
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {idx + 1}. {it.equipmentName}
                      </span>
                      <span className="ml-2 text-[10px] text-slate-500">
                        (SN: {it.serialNumber} | {it.department})
                      </span>
                    </div>
                    <span className="rounded bg-rose-500/10 px-1.5 py-0.5 text-[9px] font-bold text-rose-600 dark:text-rose-400">
                      {it.category}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Signature Boxes Preview in Confirmation */}
            <div className="mx-auto max-w-lg text-left rounded-xl border border-slate-200 bg-slate-50 p-3.5 dark:border-slate-800 dark:bg-slate-800/60 text-xs space-y-2">
              <span className="font-bold text-slate-700 dark:text-slate-300 text-[11px] block text-center border-b border-slate-200 dark:border-slate-700 pb-1">
                Authorization & Receipt Verification Signature Boxes
              </span>
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="rounded-lg border border-slate-300 bg-white p-2.5 dark:border-slate-700 dark:bg-slate-900 text-center">
                  <p className="font-extrabold text-[10px] text-slate-800 dark:text-slate-200">1. Issued by IT Dept</p>
                  <p className="text-[10px] text-slate-600 dark:text-slate-400 font-semibold mt-0.5">
                    {submittedVoucher.returningOfficer}
                  </p>
                  <div className="mt-3 border-b border-slate-400 dark:border-slate-500 w-3/4 mx-auto"></div>
                  <p className="text-[8px] text-slate-400 mt-1">IT Officer Sign & Seal Box</p>
                </div>

                <div className="rounded-lg border border-slate-300 bg-white p-2.5 dark:border-slate-700 dark:bg-slate-900 text-center">
                  <p className="font-extrabold text-[10px] text-slate-800 dark:text-slate-200">2. Received in Supply Store</p>
                  <p className="text-[10px] text-slate-600 dark:text-slate-400 font-semibold mt-0.5">
                    {submittedVoucher.receivingSupplyOfficer}
                  </p>
                  <div className="mt-3 border-b border-slate-400 dark:border-slate-500 w-3/4 mx-auto"></div>
                  <p className="text-[8px] text-slate-400 mt-1">Store Stamp & Sign Box</p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => handlePrintA4Voucher(submittedVoucher)}
                className="flex items-center gap-2 rounded-xl bg-rose-600 px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-rose-500 transition"
              >
                <Printer className="h-4 w-4" />
                <span>Print Official RETURN TO SUPPLY IT AIIAP Voucher</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSubmittedVoucher(null);
                  onClose();
                }}
                className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              >
                Close Window
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs">
            {/* Voucher Header Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Voucher Reference No
                </label>
                <input
                  type="text"
                  value={voucherNo}
                  onChange={(e) => setVoucherNo(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white font-mono font-bold"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Return Date
                </label>
                <input
                  type="date"
                  value={returnDate}
                  onChange={(e) => setReturnDate(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  required
                />
              </div>
            </div>

            {/* MULTI-ENTRY BOX SECTION */}
            <div className="rounded-xl border-2 border-rose-500/20 bg-slate-50/80 p-4 dark:border-rose-500/30 dark:bg-slate-800/50 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2 dark:border-slate-700">
                <div className="flex items-center gap-2">
                  <Layers className="h-4 w-4 text-rose-600 dark:text-rose-400" />
                  <span className="font-extrabold text-slate-800 dark:text-slate-100 text-xs uppercase">
                    (RETURN TO SUPPLY) Select Asset from Inventory (Optional) & Multi-Entry Box
                  </span>
                </div>
                <span className="rounded-full bg-rose-600/10 px-2.5 py-0.5 text-[10px] font-extrabold text-rose-600 dark:text-rose-400">
                  {items.length} Item(s) In Box
                </span>
              </div>

              {/* SECTION A: Select Multiple Assets from Active Inventory */}
              <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-900 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="font-extrabold text-slate-800 dark:text-slate-200 text-xs flex items-center gap-1.5">
                    <PackageCheck className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                    <span>Select Active Inventory Assets for Multi-Entry Box ({activeAssets.length} Available)</span>
                  </label>
                  {selectedInventoryAssetIds.length > 0 && (
                    <button
                      type="button"
                      onClick={handleAddBulkSelectedInventoryAssets}
                      className="flex items-center gap-1.5 rounded-lg bg-purple-600 px-3 py-1.5 text-[11px] font-bold text-white shadow-sm hover:bg-purple-500 transition animate-pulse"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>+ Add ({selectedInventoryAssetIds.length}) Checked Assets to Box</span>
                    </button>
                  )}
                </div>

                {/* Inventory Search Input */}
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="text"
                    value={inventorySearchQuery}
                    onChange={(e) => setInventorySearchQuery(e.target.value)}
                    placeholder="Search active inventory by name, serial no, ID, department..."
                    className="w-full rounded-lg border border-slate-300 bg-slate-50 pl-9 pr-3 py-1.5 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>

                {/* Scrollable Inventory Multi-Selection List Box */}
                <div className="max-h-40 overflow-y-auto rounded-lg border border-slate-200 bg-slate-50/50 p-2 dark:border-slate-800 dark:bg-slate-800/40 space-y-1.5">
                  {filteredActiveAssets.length > 0 ? (
                    filteredActiveAssets.map((asset) => {
                      const isAlreadyInBox = items.some((i) => i.assetId === asset.id);
                      const isChecked = selectedInventoryAssetIds.includes(asset.id);

                      return (
                        <div
                          key={asset.id}
                          className={`flex items-center justify-between rounded-lg border px-2.5 py-1.5 text-xs transition ${
                            isAlreadyInBox
                              ? 'border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-950/20'
                              : isChecked
                              ? 'border-purple-500/50 bg-purple-50 dark:bg-purple-950/30'
                              : 'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900'
                          }`}
                        >
                          <div className="flex items-center gap-2 overflow-hidden">
                            {!isAlreadyInBox && (
                              <button
                                type="button"
                                onClick={() => handleToggleSelectInventoryAsset(asset.id)}
                                className="text-slate-400 hover:text-purple-600 dark:hover:text-purple-400"
                              >
                                {isChecked ? (
                                  <CheckSquare className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                                ) : (
                                  <Square className="h-4 w-4" />
                                )}
                              </button>
                            )}
                            <div className="truncate">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-900 dark:text-white text-xs truncate">
                                  {asset.name}
                                </span>
                                <span className="rounded bg-slate-100 px-1.5 py-0.2 text-[9px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                                  {asset.category}
                                </span>
                                <span className="rounded bg-rose-500/10 px-1.5 py-0.2 text-[9px] font-mono font-bold text-rose-600">
                                  {asset.id}
                                </span>
                              </div>
                              <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                                SN: <span className="font-mono">{asset.serialNumber}</span> | Dept: {asset.department}
                                {asset.assignedUser ? ` | User: ${asset.assignedUser}` : ''}
                              </p>
                            </div>
                          </div>

                          <div className="ml-2 flex-shrink-0">
                            {isAlreadyInBox ? (
                              <span className="flex items-center gap-1 rounded-md bg-emerald-500/10 px-2 py-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                                <CheckCircle2 className="h-3 w-3" /> Added to Box
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleAddSingleInventoryAssetToBox(asset)}
                                className="flex items-center gap-1 rounded-md bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-700 hover:bg-purple-600 hover:text-white dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-purple-600 transition"
                              >
                                <Plus className="h-3 w-3" /> Add to Box
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-[10px] text-slate-400 italic text-center py-2">
                      No active inventory assets found matching "{inventorySearchQuery}".
                    </p>
                  )}
                </div>
              </div>

              {/* SECTION B: Manual Custom Item Entry Toggle */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => setShowManualEntryForm(!showManualEntryForm)}
                  className="flex items-center gap-1.5 text-xs font-bold text-purple-600 hover:text-purple-700 dark:text-purple-400"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>
                    {showManualEntryForm
                      ? '- Hide Manual Custom Item Form'
                      : '+ Click here to manually enter an unlisted hardware item'}
                  </span>
                </button>

                {showManualEntryForm && (
                  <div className="mt-2 space-y-3 rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                          Equipment Name / Model
                        </label>
                        <input
                          type="text"
                          value={equipmentName}
                          onChange={(e) => setEquipmentName(e.target.value)}
                          placeholder="e.g. HP LaserJet Pro M404dn / Dell OptiPlex 7090"
                          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                          Assigned User / Employee Name
                        </label>
                        <input
                          type="text"
                          value={assignedUser}
                          onChange={(e) => setAssignedUser(e.target.value)}
                          placeholder="e.g. Syed Farhan (IT Officer / User)"
                          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                          Department
                        </label>
                        <select
                          value={department}
                          onChange={(e) => setDepartment(e.target.value as Department)}
                          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                        >
                          {allDepartments.map((d) => (
                            <option key={d} value={d}>
                              {d}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                          Serial Number
                        </label>
                        <input
                          type="text"
                          value={serialNumber}
                          onChange={(e) => setSerialNumber(e.target.value)}
                          placeholder="e.g. CNB1234567"
                          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white font-mono"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                          Device Category
                        </label>
                        <input
                          type="text"
                          value={category}
                          onChange={(e) => setCategory(e.target.value as DeviceCategory)}
                          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white font-bold"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Item Technical Defect / Fault
                      </label>
                      <input
                        type="text"
                        value={defectDetails}
                        onChange={(e) => setDefectDetails(e.target.value)}
                        placeholder="e.g. Mainboard power failure and damaged formatter board"
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      />
                    </div>

                    <div className="flex justify-end pt-1">
                      <button
                        type="button"
                        onClick={handleAddItemToBox}
                        className="flex items-center gap-1.5 rounded-xl bg-purple-600 px-4 py-2 text-xs font-bold text-white shadow hover:bg-purple-500 transition"
                      >
                        <Plus className="h-4 w-4" />
                        <span>+ Add Custom Item Entry to Voucher Box</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* BOX FORM MULTIPLE ENTRIES LIST DISPLAY */}
              {items.length > 0 ? (
                <div className="mt-3 space-y-2 border-t border-slate-200 dark:border-slate-700 pt-3">
                  <span className="font-extrabold text-[11px] text-slate-700 dark:text-slate-300 block">
                    Added Equipment / Asset Entries Box ({items.length}):
                  </span>
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {items.map((it, idx) => (
                      <div
                        key={it.id}
                        className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-300 bg-white p-2.5 shadow-sm dark:border-slate-700 dark:bg-slate-900"
                      >
                        <div className="flex items-center gap-2">
                          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-rose-500/10 text-[10px] font-black text-rose-600">
                            {idx + 1}
                          </span>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900 dark:text-white text-xs">
                                {it.equipmentName}
                              </span>
                              <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[9px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                                {it.category}
                              </span>
                              {it.assetId && (
                                <span className="rounded bg-rose-500/10 px-1.5 py-0.5 text-[9px] font-bold text-rose-600">
                                  ID: {it.assetId}
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400">
                              SN: <span className="font-mono">{it.serialNumber}</span> | Dept: {it.department}
                              {it.assignedUser ? ` | User: ${it.assignedUser}` : ''}
                            </p>
                            <p className="text-[9.5px] text-rose-600 dark:text-rose-400 italic">
                              Defect: {it.defectDetails}
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveItemFromBox(it.id)}
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40"
                          title="Remove item"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-[10px] text-slate-400 italic text-center py-1">
                  No entries added to box yet. Select active inventory items above or click "+ Add to Box".
                </p>
              )}
            </div>

            {/* Voucher Settings */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Return Classification
                </label>
                <select
                  value={returnType}
                  onChange={(e) => setReturnType(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white font-bold text-rose-600 dark:text-rose-400"
                >
                  <option value="Beyond Economical Repair (BER / BR)">Beyond Economical Repair (BER / BR)</option>
                  <option value="Unserviceable Faulty Item Return">Unserviceable Faulty Item Return</option>
                  <option value="Obsolete / Scrap Hardware Return">Obsolete / Scrap Hardware Return</option>
                  <option value="Surplus Store Return">Surplus Store Return</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Additional Remarks
                </label>
                <input
                  type="text"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="e.g. Sent back to Supply Store for auction/scrap processing."
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
            </div>

            {/* Signature Boxes Section */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3.5 dark:border-slate-800 dark:bg-slate-800/50 space-y-3">
              <h4 className="font-bold text-slate-800 dark:text-slate-200 text-xs flex items-center justify-between">
                <span>Official Signature & Stamp Authorization Boxes</span>
                <span className="text-[10px] text-slate-400 font-normal">Required for physical voucher handover</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* IT Dept Issuing Officer Box */}
                <div className="rounded-lg border border-slate-300 bg-white p-3 dark:border-slate-700 dark:bg-slate-900 space-y-2">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-1.5 dark:border-slate-800">
                    <span className="font-extrabold text-[11px] text-slate-800 dark:text-slate-200">
                      1. Issued & Handed Over By (IT Dept)
                    </span>
                    <span className="rounded bg-purple-500/10 px-1.5 py-0.5 text-[9px] font-bold text-purple-600 dark:text-purple-400">
                      IT Dept
                    </span>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 mb-0.5">
                      Officer Name & Designation
                    </label>
                    <input
                      type="text"
                      value={returningOfficer}
                      onChange={(e) => setReturningOfficer(e.target.value)}
                      className="w-full rounded border border-slate-300 bg-slate-50 px-2 py-1 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      required
                    />
                  </div>

                  {/* Signature Line Box */}
                  <div className="mt-2 rounded border border-dashed border-slate-300 bg-slate-50/50 p-2.5 text-center dark:border-slate-700 dark:bg-slate-800/40">
                    <div className="mx-auto h-8 border-b border-slate-400 dark:border-slate-500 w-3/4 mb-1"></div>
                    <p className="text-[9px] font-bold text-slate-500 dark:text-slate-400">
                      Signature & Official IT Seal Box
                    </p>
                    <p className="text-[8px] text-slate-400">Date: {returnDate}</p>
                  </div>
                </div>

                {/* Supply Store Receiving Officer Box */}
                <div className="rounded-lg border border-slate-300 bg-white p-3 dark:border-slate-700 dark:bg-slate-900 space-y-2">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-1.5 dark:border-slate-800">
                    <span className="font-extrabold text-[11px] text-slate-800 dark:text-slate-200">
                      2. Received By (Supply Store)
                    </span>
                    <span className="rounded bg-rose-500/10 px-1.5 py-0.5 text-[9px] font-bold text-rose-600 dark:text-rose-400">
                      Supply Store
                    </span>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 mb-0.5">
                      Store Receiver Officer Name
                    </label>
                    <input
                      type="text"
                      value={receivingSupplyOfficer}
                      onChange={(e) => setReceivingSupplyOfficer(e.target.value)}
                      className="w-full rounded border border-slate-300 bg-slate-50 px-2 py-1 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      required
                    />
                  </div>

                  {/* Signature & Stamp Line Box */}
                  <div className="mt-2 rounded border border-dashed border-slate-300 bg-slate-50/50 p-2.5 text-center dark:border-slate-700 dark:bg-slate-800/40 flex justify-between gap-2">
                    <div className="flex-1">
                      <div className="h-8 border-b border-slate-400 dark:border-slate-500 w-full mb-1"></div>
                      <p className="text-[9px] font-bold text-slate-500 dark:text-slate-400">Receiver Signature</p>
                    </div>
                    <div className="w-16 h-10 border border-slate-300 rounded text-[8px] text-slate-400 flex items-center justify-center dark:border-slate-700">
                      Store Stamp
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 rounded-xl bg-rose-500/10 border border-rose-500/20 p-3 text-rose-700 dark:text-rose-300">
              <input
                type="checkbox"
                id="archiveAssetCheckbox"
                checked={archiveFromActive}
                onChange={(e) => setArchiveFromActive(e.target.checked)}
                className="h-4 w-4 rounded border-rose-300 text-rose-600 focus:ring-rose-500"
              />
              <label htmlFor="archiveAssetCheckbox" className="font-bold cursor-pointer">
                Automatically move selected inventory assets from Active Inventory to Soft-Deleted / Scrap Archive
              </label>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              >
                Cancel
              </button>

              <button
                type="submit"
                className="flex items-center gap-2 rounded-xl bg-rose-600 px-5 py-2 text-xs font-bold text-white shadow-md hover:bg-rose-500 transition"
              >
                <RotateCcw className="h-4 w-4" />
                <span>Issue RETURN TO SUPPLY IT AIIAP Voucher</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
