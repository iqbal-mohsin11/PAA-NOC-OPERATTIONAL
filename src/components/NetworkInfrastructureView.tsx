import React, { useState } from 'react';
import { useInventory } from '../context/InventoryContext';
import { AssetItem } from '../types/inventory';
import { Server, Shield, Radio, Wifi, Globe, Layers, Activity, Search, Plus, ExternalLink } from 'lucide-react';

interface NetworkInfrastructureViewProps {
  onSelectAsset: (asset: AssetItem) => void;
  onOpenAddModal: () => void;
}

export const NetworkInfrastructureView: React.FC<NetworkInfrastructureViewProps> = ({
  onSelectAsset,
  onOpenAddModal,
}) => {
  const { assets } = useInventory();
  const [search, setSearch] = useState('');

  const networkCategories = [
    'Network Switch',
    'Core Switch',
    'Distribution Switch',
    'Access Switch',
    'Router',
    'Firewall',
    'Access Point',
    'Server',
    'UPS',
    'Rack',
    'Patch Panel',
    'NAS Storage',
  ];

  const networkItems = assets.filter((a) => !a.isRemoved && networkCategories.includes(a.category));

  const filtered = networkItems.filter((item) => {
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        item.name.toLowerCase().includes(q) ||
        item.department.toLowerCase().includes(q) ||
        item.brand.toLowerCase().includes(q) ||
        item.model.toLowerCase().includes(q) ||
        item.id.toLowerCase().includes(q) ||
        item.networkSpecs?.managementIp?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-gradient-to-r from-slate-900 via-slate-800 to-cyan-950 p-5 text-white shadow-lg dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Server className="h-5 w-5 text-cyan-400" />
            <h2 className="text-lg font-bold text-white">NOC Network & Server Infrastructure</h2>
            <span className="rounded-full bg-cyan-400/20 px-2.5 py-0.5 text-xs font-bold text-cyan-300">
              {networkItems.length} Network Nodes
            </span>
          </div>
          <p className="mt-0.5 text-xs text-slate-300">
            Cisco Catalyst Core/Access switches, FortiGate Firewalls, Dell R750 Radar Servers, Racks & Fiber Optics.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenAddModal}
            className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-emerald-500"
          >
            <Plus className="h-4 w-4" />
            <span>Add Network Node</span>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search by Switch Name, Management IP, Rack #, Serial, Brand..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 py-2 text-xs font-medium text-slate-800 outline-none focus:border-emerald-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
        />
      </div>

      {/* Table of Network Devices */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-[10px] uppercase font-bold text-slate-400 dark:border-slate-800 dark:bg-slate-800/50">
                <th className="py-3 px-4">Asset ID / Node</th>
                <th className="py-3 px-4">Node Name & Model</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Management IP</th>
                <th className="py-3 px-4">Ports / SFP</th>
                <th className="py-3 px-4">Rack #</th>
                <th className="py-3 px-4 text-center">Health Status</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.map((node) => (
                <tr key={node.id} className="hover:bg-slate-50/80 transition dark:hover:bg-slate-800/40">
                  <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white">
                    <div>{node.id}</div>
                    <div className="text-[10px] font-normal text-slate-400">{node.department}</div>
                  </td>

                  <td className="py-3 px-4">
                    <div
                      onClick={() => onSelectAsset(node)}
                      className="font-bold text-slate-800 dark:text-slate-200 hover:text-emerald-600 cursor-pointer"
                    >
                      {node.name}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {node.brand} {node.model} • SN: {node.serialNumber}
                    </div>
                  </td>

                  <td className="py-3 px-4">
                    <span className="rounded-md bg-cyan-50 px-2 py-0.5 text-[10px] font-extrabold text-cyan-700 dark:bg-cyan-500/10 dark:text-cyan-400">
                      {node.category}
                    </span>
                  </td>

                  <td className="py-3 px-4 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    {node.networkSpecs?.managementIp || node.systemSpecs?.ipAddress || '10.100.0.X'}
                  </td>

                  <td className="py-3 px-4 text-slate-700 dark:text-slate-300 font-medium">
                    {node.networkSpecs?.totalPorts ? `${node.networkSpecs.totalPorts} Ports` : 'N/A'}{' '}
                    {node.networkSpecs?.sfpPorts ? `(${node.networkSpecs.sfpPorts} Fiber SFP)` : ''}
                  </td>

                  <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-400">
                    {node.networkSpecs?.rackNumber || 'Rack-01'}
                  </td>

                  <td className="py-3 px-4 text-center">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-extrabold ${
                        node.pingStatus === 'Online' || node.status === 'Active'
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400'
                          : 'bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400'
                      }`}
                    >
                      {node.pingStatus || 'Online'}
                    </span>
                  </td>

                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={() => onSelectAsset(node)}
                      className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-bold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                    >
                      Inspect
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
