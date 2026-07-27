import React, { useState } from 'react';
import { useInventory } from '../context/InventoryContext';
import { FileSpreadsheet, Upload, X, Check, AlertCircle } from 'lucide-react';
import * as XLSX from 'xlsx';

interface ExcelImportModalProps {
  onClose: () => void;
}

export const ExcelImportModal: React.FC<ExcelImportModalProps> = ({ onClose }) => {
  const { importAssetsFromList } = useInventory();
  const [file, setFile] = useState<File | null>(null);
  const [previewCount, setPreviewCount] = useState(0);
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [errorMsg, setErrorMsg] = useState('');

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (!uploadedFile) return;

    setFile(uploadedFile);
    setErrorMsg('');

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);

        if (data.length === 0) {
          setErrorMsg('The uploaded Excel file contains no data rows.');
          return;
        }

        setParsedData(data);
        setPreviewCount(data.length);
      } catch (err: any) {
        setErrorMsg('Failed to parse Excel file. Ensure valid .xlsx or .csv format.');
      }
    };
    reader.readAsBinaryString(uploadedFile);
  };

  const handleImportConfirm = () => {
    if (parsedData.length === 0) return;

    const formatted = parsedData.map((row: any, idx: number) => ({
      name: row['Name'] || row['Device Name'] || row['Asset Name'] || `Excel Asset ${idx + 1}`,
      category: row['Category'] || 'Computer System',
      department: row['Department'] || 'IT',
      assignedUser: row['User'] || row['Assigned User'] || 'PAA Staff',
      brand: row['Brand'] || 'HP',
      model: row['Model'] || 'ProBook',
      serialNumber: row['Serial Number'] || row['Serial'] || `EXCEL-SN-${Math.floor(100000 + Math.random() * 900000)}`,
      status: row['Status'] || 'Active',
      vendorCompany: row['Vendor'] || 'M/S Airport Tech Solutions',
      purchaseDate: row['Purchase Date'] || '2026-01-01',
      warrantyExpiry: row['Warranty Expiry'] || '2029-01-01',
      location: {
        building: row['Building'] || 'Terminal 1',
        floor: row['Floor'] || '1st Floor',
        room: row['Room'] || 'Room 101',
      },
      systemSpecs: {
        processor: row['Processor'] || 'Intel Core i7',
        ram: row['RAM'] || '16 GB',
        ssd: row['SSD'] || '512 GB SSD',
        ipAddress: row['IP Address'] || '10.100.1.50',
      },
    }));

    importAssetsFromList(formatted);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-emerald-500" />
            <h3 className="font-bold text-slate-900 text-sm dark:text-white">Batch Import Assets from Excel</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4 space-y-4 text-xs">
          {/* File Upload Box */}
          <div className="border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
            <Upload className="mx-auto h-8 w-8 text-emerald-500 mb-2" />
            <p className="font-bold text-slate-800 dark:text-slate-200">Upload Excel (.xlsx, .xls) or CSV Sheet</p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Columns expected: Name, Category, Department, User, Brand, Model, Serial Number, Status
            </p>

            <input
              type="file"
              accept=".xlsx, .xls, .csv"
              onChange={handleFileUpload}
              className="mt-3 block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-emerald-600 file:text-white hover:file:bg-emerald-500 cursor-pointer"
            />
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 text-xs font-semibold">
              {errorMsg}
            </div>
          )}

          {previewCount > 0 && (
            <div className="p-3 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold flex items-center justify-between">
              <span>Successfully parsed {previewCount} items ready for import.</span>
              <Check className="h-4 w-4 text-emerald-600" />
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
          <button
            onClick={onClose}
            className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-bold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
          >
            Cancel
          </button>
          <button
            disabled={previewCount === 0}
            onClick={handleImportConfirm}
            className="rounded-xl bg-emerald-600 px-5 py-2 text-xs font-bold text-white hover:bg-emerald-500 disabled:opacity-50"
          >
            Import {previewCount} Items
          </button>
        </div>
      </div>
    </div>
  );
};
