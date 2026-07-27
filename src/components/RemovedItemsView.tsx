import React, { useState } from 'react';
import { useInventory } from '../context/InventoryContext';
import { AssetItem, RemovalReason } from '../types/inventory';
import { Trash2, RefreshCw, AlertTriangle, Shield, Search, X } from 'lucide-react';

interface RemovedItemsViewProps {
  onSelectAsset: (asset: AssetItem) => void;
}

export const RemovedItemsView: React.FC<RemovedItemsViewProps> = ({ onSelectAsset }) => {
  const { assets, restoreAsset, deletePermanently } = useInventory();
  const [search, setSearch] = useState('');

  const removedAssets = assets.filter((a) => a.isRemoved);

  const filtered = removedAssets.filter((item) => {
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        item.name.toLowerCase().includes(q) ||
        item.id.toLowerCase().includes(q) ||
        item.department.toLowerCase().includes(q) ||
        item.removalDetails?.reason.toLowerCase().includes(q) ||
        item.removalDetails?.removedBy.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Banner */}
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Trash2 className="h-5 w-5 text-rose-500" />
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Soft-Removed Asset Archive</h2>
            <span className="rounded-full bg-rose-500/10 px-2.5 py-0.5 text-xs font-bold text-rose-600 dark:text-rose-400">
              {removedAssets.length} Archived Items
            </span>
          </div>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            Soft-deleted inventory items preserved for audit integrity. Reasons include Scrap, Transfer, Auction, Lost, and Damaged.
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search by Asset ID, reason, officer name, department..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 py-2 text-xs font-medium text-slate-800 outline-none focus:border-emerald-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
        />
      </div>

      {/* Grid of Soft Removed Assets */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-200 dark:bg-slate-900 dark:border-slate-800">
            <Shield className="mx-auto h-8 w-8 text-emerald-500 opacity-50 mb-2" />
            <p className="font-bold text-slate-800 dark:text-slate-200">No soft-removed assets found.</p>
            <p className="text-xs text-slate-500 mt-1">All active inventory is intact in the main directory.</p>
          </div>
        ) : (
          filtered.map((item) => (
            <div
              key={item.id}
              className="flex flex-col justify-between rounded-2xl border border-rose-200 bg-rose-50/40 p-4 shadow-sm dark:border-rose-500/20 dark:bg-rose-500/5"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-black text-rose-600 dark:text-rose-400">{item.id}</span>
                  <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-extrabold text-rose-700 dark:bg-rose-500/20 dark:text-rose-300">
                    Reason: {item.removalDetails?.reason || 'Scrap'}
                  </span>
                </div>

                <h3 onClick={() => onSelectAsset(item)} className="mt-2 text-sm font-bold text-slate-900 dark:text-white cursor-pointer hover:underline">
                  {item.name}
                </h3>
                <p className="text-xs text-slate-500 font-medium">Department: {item.department}</p>

                <div className="mt-3 rounded-xl border border-rose-100 bg-white p-2.5 text-xs text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
                  <div className="font-bold text-slate-800 dark:text-slate-200">Remarks:</div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">{item.removalDetails?.remarks || 'No remarks logged.'}</p>
                  <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400 border-t border-slate-100 pt-1 dark:border-slate-800">
                    <span>By: {item.removalDetails?.removedBy}</span>
                    <span>Date: {item.removalDetails?.date}</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-rose-100 pt-3 dark:border-rose-500/20">
                <button
                  onClick={() => restoreAsset(item.id)}
                  className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-500"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  <span>Restore to Inventory</span>
                </button>

                <button
                  onClick={() => {
                    if (confirm(`Permanently delete record ${item.id}? This action cannot be undone.`)) {
                      deletePermanently(item.id);
                    }
                  }}
                  className="text-xs font-bold text-rose-600 hover:underline dark:text-rose-400"
                >
                  Hard Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// Soft Remove Confirmation Modal Component
export const SoftRemoveModal: React.FC<{
  asset: AssetItem | null;
  onClose: () => void;
}> = ({ asset, onClose }) => {
  const { softRemoveAsset } = useInventory();

  const [reason, setReason] = useState<RemovalReason>('Scrap');
  const [removedBy, setRemovedBy] = useState('Admin Board Survey Team');
  const [remarks, setRemarks] = useState('');

  if (!asset) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    softRemoveAsset(asset.id, reason, removedBy, remarks || `Item marked as ${reason}`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Trash2 className="h-5 w-5 text-rose-500" />
            <h3 className="font-bold text-slate-900 text-sm dark:text-white">Soft Remove Asset ({asset.id})</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3 text-xs">
          <div className="p-3 rounded-xl bg-amber-50 text-amber-900 border border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/20">
            <strong>Audit Integrity Rule:</strong> Soft removal moves the item to the archived audit log. The record will NOT be permanently lost.
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Reason for Removal</label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value as RemovalReason)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2 font-bold dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              <option value="Scrap">Scrap (BER - Beyond Economical Repair)</option>
              <option value="Transfer">Transfer to another Airport / Ministry</option>
              <option value="Lost">Lost / Missing</option>
              <option value="Auction">Auction / Disposed</option>
              <option value="Damaged">Damaged</option>
              <option value="Returned">Returned to Vendor</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Removed By (Officer Name)</label>
            <input
              type="text"
              required
              value={removedBy}
              onChange={(e) => setRemovedBy(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Remarks & Survey Board Approval Notes</label>
            <textarea
              required
              rows={3}
              placeholder="e.g. Survey Committee Approved Board Resolution #2026/04..."
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            />
          </div>

          <div className="mt-4 flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 font-bold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
            >
              Cancel
            </button>
            <button type="submit" className="rounded-xl bg-rose-600 px-5 py-2 font-bold text-white hover:bg-rose-500">
              Confirm Soft Remove
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
