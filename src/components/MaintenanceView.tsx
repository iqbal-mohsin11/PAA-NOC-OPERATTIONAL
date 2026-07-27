import React, { useState } from 'react';
import { useInventory } from '../context/InventoryContext';
import { MaintenanceRecord, AssetItem } from '../types/inventory';
import { Wrench, Plus, DollarSign, Calendar, UserCheck, Search, X, ShieldCheck } from 'lucide-react';

interface MaintenanceViewProps {
  onOpenGatePass?: (asset?: AssetItem) => void;
}

export const MaintenanceView: React.FC<MaintenanceViewProps> = ({ onOpenGatePass }) => {
  const { maintenanceRecords, addMaintenanceRecord, assets, gatePassRecords } = useInventory();
  const [showAddModal, setShowAddModal] = useState(false);

  // Form State
  const [assetId, setAssetId] = useState(assets[0]?.id || '');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [engineer, setEngineer] = useState('Muhammad Bilal (IT Tech)');
  const [description, setDescription] = useState('');
  const [partsReplaced, setPartsReplaced] = useState('');
  const [cost, setCost] = useState(0);
  const [remarks, setRemarks] = useState('');

  const totalCost = maintenanceRecords.reduce((acc, curr) => acc + curr.cost, 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const asset = assets.find((a) => a.id === assetId);

    addMaintenanceRecord({
      assetId,
      deviceName: asset ? asset.name : 'IT Asset',
      date,
      engineer,
      description,
      partsReplaced: partsReplaced || 'None',
      cost: Number(cost) || 0,
      remarks,
    });

    setShowAddModal(false);
    setDescription('');
    setPartsReplaced('');
    setCost(0);
    setRemarks('');
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Wrench className="h-5 w-5 text-emerald-500" />
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Maintenance & Service Records</h2>
            <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
              Total Budget Spend: PKR {totalCost.toLocaleString()}
            </span>
          </div>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            Audit history of parts replaced, fuser assemblies, thermal paste service, and vendor repairs.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {onOpenGatePass && (
            <button
              onClick={() => onOpenGatePass()}
              className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-indigo-500 transition"
            >
              <ShieldCheck className="h-4 w-4" />
              <span>Make Market Repair Gate Pass</span>
            </button>
          )}

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-emerald-500 transition"
          >
            <Plus className="h-4 w-4" />
            <span>Log Maintenance Work</span>
          </button>
        </div>
      </div>

      {/* Maintenance Cards */}
      <div className="space-y-3">
        {maintenanceRecords.map((m) => (
          <div
            key={m.id}
            className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-2 dark:border-slate-800 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-mono font-extrabold text-slate-900 dark:text-white">{m.id}</span>
                <span className="text-slate-400">•</span>
                <span className="font-mono text-emerald-600 dark:text-emerald-400">{m.assetId}</span>
              </div>
              <div className="font-bold text-emerald-600 dark:text-emerald-400">
                Cost: PKR {m.cost.toLocaleString()}
              </div>
            </div>

            <div className="mt-2 font-bold text-slate-800 text-sm dark:text-slate-200">{m.deviceName}</div>
            <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">{m.description}</p>

            <div className="mt-3 grid grid-cols-2 gap-2 rounded-xl bg-slate-50 p-2.5 text-[11px] dark:bg-slate-800/60 text-slate-600 dark:text-slate-300">
              <div>
                <span className="font-bold text-slate-400">Parts Replaced:</span> {m.partsReplaced}
              </div>
              <div>
                <span className="font-bold text-slate-400">Engineer:</span> {m.engineer} ({m.date})
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Maintenance Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <h3 className="font-bold text-slate-900 text-sm dark:text-white">Log Hardware Maintenance Service</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Select Hardware Asset</label>
                <select
                  value={assetId}
                  onChange={(e) => setAssetId(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2 font-mono dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                >
                  {assets.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.id} - {a.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Service Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Engineer / Vendor</label>
                <input
                  type="text"
                  value={engineer}
                  onChange={(e) => setEngineer(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Service Description</label>
                <textarea
                  required
                  rows={2}
                  placeholder="e.g. Fuser kit replacement, thermal paste re-applied..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Parts Replaced</label>
                <input
                  type="text"
                  placeholder="e.g. HP Fuser Assembly RM2-2568"
                  value={partsReplaced}
                  onChange={(e) => setPartsReplaced(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Service Cost (PKR)</label>
                <input
                  type="number"
                  value={cost}
                  onChange={(e) => setCost(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                />
              </div>

              <div className="mt-4 flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 font-bold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button type="submit" className="rounded-xl bg-emerald-600 px-5 py-2 font-bold text-white hover:bg-emerald-500">
                  Save Service Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
