import React, { useState } from 'react';
import { useInventory } from '../context/InventoryContext';
import { MaintenanceRecord, AssetItem } from '../types/inventory';
import { Wrench, Plus, DollarSign, Calendar, UserCheck, Search, X, ShieldCheck, BatteryCharging, Zap, Clock, CalendarDays } from 'lucide-react';
import { UPSMaintenanceModal } from './UPSMaintenanceModal';
import { MaintenanceCalendarView } from './MaintenanceCalendarView';

interface MaintenanceViewProps {
  onOpenGatePass?: (asset?: AssetItem) => void;
  onSelectAsset?: (asset: AssetItem) => void;
}

export const MaintenanceView: React.FC<MaintenanceViewProps> = ({ onOpenGatePass, onSelectAsset }) => {
  const { maintenanceRecords, upsMaintenanceRecords, addMaintenanceRecord, assets, gatePassRecords } = useInventory();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showUPSModal, setShowUPSModal] = useState(false);
  const [selectedAssetForUPSModal, setSelectedAssetForUPSModal] = useState<AssetItem | null>(null);
  const [activeCategoryTab, setActiveCategoryTab] = useState<'all' | 'calendar' | 'ups' | 'general'>('all');

  // Form State
  const [assetId, setAssetId] = useState(assets[0]?.id || '');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [engineer, setEngineer] = useState('Muhammad Bilal (IT Tech)');
  const [description, setDescription] = useState('');
  const [partsReplaced, setPartsReplaced] = useState('');
  const [cost, setCost] = useState(0);
  const [remarks, setRemarks] = useState('');

  const totalGeneralCost = maintenanceRecords.reduce((acc, curr) => acc + curr.cost, 0);
  const totalUPSCost = upsMaintenanceRecords.reduce((acc, curr) => acc + (curr.cost || 0), 0);
  const totalCombinedCost = totalGeneralCost + totalUPSCost;

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
              Total Budget Spend: PKR {totalCombinedCost.toLocaleString()}
            </span>
          </div>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            Audit history of parts replaced, thermal paste service, vendor repairs, and airport UPS battery bank replacements.
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
            onClick={() => setShowUPSModal(true)}
            className="flex items-center gap-2 rounded-xl bg-amber-600 px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-amber-500 transition"
          >
            <BatteryCharging className="h-4 w-4" />
            <span>Log UPS Maintenance & Battery</span>
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-emerald-500 transition"
          >
            <Plus className="h-4 w-4" />
            <span>Log General Maintenance</span>
          </button>
        </div>
      </div>

      {/* Subtabs Filter */}
      <div className="flex flex-wrap items-center gap-1.5 rounded-xl bg-slate-100 p-1 dark:bg-slate-800 text-xs font-bold w-fit">
        <button
          type="button"
          onClick={() => setActiveCategoryTab('all')}
          className={`rounded-lg px-3 py-1.5 transition ${
            activeCategoryTab === 'all'
              ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-900 dark:text-white'
              : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
          }`}
        >
          All Records ({maintenanceRecords.length + upsMaintenanceRecords.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveCategoryTab('calendar')}
          className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition ${
            activeCategoryTab === 'calendar'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'text-amber-700 hover:text-amber-800 dark:text-amber-400'
          }`}
        >
          <CalendarDays className="h-3.5 w-3.5" />
          <span>3-Month Calendar View</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveCategoryTab('ups')}
          className={`rounded-lg px-3 py-1.5 transition ${
            activeCategoryTab === 'ups'
              ? 'bg-white text-amber-800 shadow-xs dark:bg-slate-900 dark:text-amber-400'
              : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
          }`}
        >
          ⚡ UPS & Battery Banks ({upsMaintenanceRecords.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveCategoryTab('general')}
          className={`rounded-lg px-3 py-1.5 transition ${
            activeCategoryTab === 'general'
              ? 'bg-white text-emerald-800 shadow-xs dark:bg-slate-900 dark:text-emerald-400'
              : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
          }`}
        >
          General IT Maintenance ({maintenanceRecords.length})
        </button>
      </div>

      {/* 3-Month Calendar View Section */}
      {activeCategoryTab === 'calendar' && (
        <MaintenanceCalendarView
          onOpenUPSMaintenanceModal={(asset) => {
            setSelectedAssetForUPSModal(asset || null);
            setShowUPSModal(true);
          }}
          onSelectAsset={onSelectAsset}
        />
      )}

      {/* UPS Maintenance Records Section */}
      {(activeCategoryTab === 'all' || activeCategoryTab === 'ups') && upsMaintenanceRecords.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-extrabold text-amber-800 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              <BatteryCharging className="h-4 w-4 text-amber-600" />
              <span>Airport UPS & Battery Bank Replacement Audit Logs</span>
            </h3>
            <span className="text-[11px] text-slate-400">
              Spend: PKR {totalUPSCost.toLocaleString()}
            </span>
          </div>

          <div className="space-y-3">
            {upsMaintenanceRecords.map((u) => (
              <div
                key={u.id}
                className="rounded-2xl border border-amber-200/80 bg-white p-4 shadow-sm dark:border-amber-900/40 dark:bg-slate-900"
              >
                <div className="flex flex-wrap items-center justify-between border-b border-amber-100 pb-2 dark:border-slate-800 text-xs gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-extrabold text-amber-700 dark:text-amber-400">{u.id}</span>
                    <span className="text-slate-300 dark:text-slate-700">•</span>
                    <span className="rounded-md bg-amber-500/10 px-2 py-0.5 font-mono font-bold text-amber-700 dark:text-amber-400 text-[11px]">
                      {u.roomNo}
                    </span>
                    <span className="text-slate-300 dark:text-slate-700">•</span>
                    <span className="font-mono text-slate-500 dark:text-slate-400">{u.assetId}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-block rounded-md px-2 py-0.5 text-[10px] font-bold ${
                        u.batteryCondition.includes('Optimal')
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : u.batteryCondition.includes('Good')
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                      }`}
                    >
                      {u.batteryCondition}
                    </span>
                    <div className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                      PKR {u.cost?.toLocaleString() || 0}
                    </div>
                  </div>
                </div>

                <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                  <div className="font-bold text-slate-900 text-sm dark:text-white">
                    {u.modelNo} - <span className="font-normal text-slate-600 dark:text-slate-300">{u.upsName}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="text-slate-500">Bank: <strong className="text-slate-800 dark:text-slate-200">{u.noOfBatteries}x Cells</strong></span>
                    <span className="text-slate-500">Backup: <strong className="text-emerald-600 dark:text-emerald-400">{u.backupTime}</strong></span>
                  </div>
                </div>

                <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">{u.description}</p>

                <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2 rounded-xl bg-amber-50/50 p-2.5 text-[11px] dark:bg-amber-950/20 text-slate-700 dark:text-slate-300 border border-amber-200/40 dark:border-amber-900/30">
                  <div>
                    <span className="font-bold text-slate-400">Voltage:</span> {u.voltage}
                  </div>
                  <div>
                    <span className="font-bold text-slate-400">Battery Replaced:</span> {u.batteryChangeDate} {u.nextBatteryChangeDate ? `(Next: ${u.nextBatteryChangeDate})` : ''}
                  </div>
                  <div>
                    <span className="font-bold text-slate-400">Engineer:</span> {u.engineer}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* General Maintenance Cards */}
      {(activeCategoryTab === 'all' || activeCategoryTab === 'general') && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Wrench className="h-4 w-4 text-emerald-600" />
              <span>General IT Hardware Maintenance</span>
            </h3>
            <span className="text-[11px] text-slate-400">
              Spend: PKR {totalGeneralCost.toLocaleString()}
            </span>
          </div>

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
        </div>
      )}

      {/* Add General Maintenance Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600"
            >
              <X className="h-5 w-5" />
            </button>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Log IT Maintenance Service</h3>

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Select Asset</label>
                <select
                  value={assetId}
                  onChange={(e) => setAssetId(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800"
                >
                  {assets.filter((a) => !a.isRemoved).map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({a.id})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Service Date</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Cost (PKR)</label>
                  <input
                    type="number"
                    value={cost}
                    onChange={(e) => setCost(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Service Engineer</label>
                <input
                  type="text"
                  value={engineer}
                  onChange={(e) => setEngineer(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Parts Replaced</label>
                <input
                  type="text"
                  placeholder="e.g. Fuser unit, Thermal paste, RAM Stick"
                  value={partsReplaced}
                  onChange={(e) => setPartsReplaced(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Description</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800"
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 dark:border-slate-700 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-500"
                >
                  Save Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* UPS Maintenance & Battery Bank Modal */}
      <UPSMaintenanceModal
        isOpen={showUPSModal}
        onClose={() => {
          setShowUPSModal(false);
          setSelectedAssetForUPSModal(null);
        }}
        preselectedAsset={selectedAssetForUPSModal}
      />
    </div>
  );
};
