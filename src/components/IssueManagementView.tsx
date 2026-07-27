import React, { useState } from 'react';
import { useInventory } from '../context/InventoryContext';
import { IssueTicket, TicketPriority, TicketStatus, Department } from '../types/inventory';
import { Ticket, Plus, CheckCircle2, Clock, AlertTriangle, Wrench, X, UserCheck } from 'lucide-react';

interface IssueManagementViewProps {
  initialAssetForTicket?: any;
}

export const IssueManagementView: React.FC<IssueManagementViewProps> = ({ initialAssetForTicket }) => {
  const { tickets, addTicket, updateTicketStatus, assets, allDepartments } = useInventory();

  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [showCreateModal, setShowCreateModal] = useState(Boolean(initialAssetForTicket));
  const [selectedTicket, setSelectedTicket] = useState<IssueTicket | null>(null);

  // Form State
  const [assetId, setAssetId] = useState(initialAssetForTicket?.id || assets[0]?.id || '');
  const [user, setUser] = useState(initialAssetForTicket?.assignedUser || '');
  const [department, setDepartment] = useState<Department>(initialAssetForTicket?.department || 'IT');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TicketPriority>('High');
  const [assignedEngineer, setAssignedEngineer] = useState('Muhammad Bilal (IT Tech)');

  // Update Status State
  const [resolutionText, setResolutionText] = useState('');
  const [newStatus, setNewStatus] = useState<TicketStatus>('Closed');

  const filteredTickets = tickets.filter((t) => {
    if (filterStatus !== 'ALL' && t.status !== filterStatus) return false;
    return true;
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const asset = assets.find((a) => a.id === assetId);

    addTicket({
      assetId,
      deviceName: asset ? asset.name : 'IT Hardware Asset',
      department: department || asset?.department || 'IT',
      user: user || asset?.assignedUser || 'Department Officer',
      description,
      dateReported: new Date().toISOString().replace('T', ' ').slice(0, 16),
      priority,
      assignedEngineer,
      status: 'Open',
    });

    setShowCreateModal(false);
    setDescription('');
  };

  const handleUpdateStatus = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket) return;

    updateTicketStatus(
      selectedTicket.ticketNumber,
      newStatus,
      resolutionText || selectedTicket.resolution,
      newStatus === 'Closed' ? new Date().toISOString().split('T')[0] : undefined
    );

    setSelectedTicket(null);
    setResolutionText('');
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Ticket className="h-5 w-5 text-rose-500" />
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">IT Support & Fault Issue Module</h2>
            <span className="rounded-full bg-rose-500/10 px-2.5 py-0.5 text-xs font-bold text-rose-600 dark:text-rose-400">
              {tickets.filter((t) => t.status !== 'Closed').length} Active Tickets
            </span>
          </div>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            Log technical faults, printer toner issues, switch outages, and track engineer resolutions.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-rose-500"
        >
          <Plus className="h-4 w-4" />
          <span>Report Fault / Ticket</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto border-b border-slate-200 pb-2 dark:border-slate-800 text-xs">
        {['ALL', 'Open', 'Working', 'Pending', 'Closed'].map((st) => (
          <button
            key={st}
            onClick={() => setFilterStatus(st)}
            className={`rounded-xl px-3.5 py-2 font-bold transition ${
              filterStatus === st
                ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                : 'bg-white text-slate-600 hover:bg-slate-100 dark:bg-slate-900 dark:text-slate-400'
            }`}
          >
            {st === 'ALL' ? 'All Tickets' : st}
          </button>
        ))}
      </div>

      {/* Ticket Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filteredTickets.map((t) => (
          <div
            key={t.ticketNumber}
            className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-extrabold text-slate-900 dark:text-white">{t.ticketNumber}</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                    t.priority === 'Critical'
                      ? 'bg-rose-500 text-white'
                      : t.priority === 'High'
                      ? 'bg-amber-500 text-white'
                      : 'bg-blue-500 text-white'
                  }`}
                >
                  {t.priority}
                </span>
              </div>

              <div className="mt-2 font-bold text-slate-800 text-xs dark:text-slate-200">{t.deviceName}</div>
              <div className="text-[10px] text-slate-400 font-mono">
                Asset: {t.assetId} • Dept: <span className="font-bold text-emerald-600">{t.department}</span>
              </div>

              <p className="mt-3 rounded-xl border border-slate-100 bg-slate-50 p-2.5 text-xs text-slate-700 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-300">
                "{t.description}"
              </p>

              {t.resolution && (
                <div className="mt-2 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                  <span className="font-bold">Resolution:</span> {t.resolution}
                </div>
              )}

              <div className="mt-3 flex items-center justify-between text-[10px] text-slate-400">
                <span>User: {t.user}</span>
                <span>Engineer: {t.assignedEngineer}</span>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 dark:border-slate-800">
              <span
                className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${
                  t.status === 'Closed'
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400'
                    : t.status === 'Working'
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400'
                    : 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400'
                }`}
              >
                Status: {t.status}
              </span>

              <button
                onClick={() => {
                  setSelectedTicket(t);
                  setNewStatus(t.status);
                  setResolutionText(t.resolution || '');
                }}
                className="text-xs font-bold text-emerald-600 hover:underline dark:text-emerald-400"
              >
                Update Status
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Create Ticket Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <h3 className="font-bold text-slate-900 text-sm dark:text-white">Create IT Fault Ticket</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Select Hardware Asset</label>
                <select
                  value={assetId}
                  onChange={(e) => setAssetId(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2 font-mono dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                >
                  {assets.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.id} - {a.name} ({a.department})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Department</label>
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value as Department)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                >
                  {allDepartments.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept} Department
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Priority Level</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as TicketPriority)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2 font-bold dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                >
                  <option value="Critical">Critical (Immediate Airport Outage)</option>
                  <option value="High">High Priority</option>
                  <option value="Medium">Medium Priority</option>
                  <option value="Low">Low Priority</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Fault Description</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Describe the issue (e.g. Printer low toner, switch port down...)"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Assigned Engineer</label>
                <input
                  type="text"
                  value={assignedEngineer}
                  onChange={(e) => setAssignedEngineer(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                />
              </div>

              <div className="mt-4 flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 font-bold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button type="submit" className="rounded-xl bg-rose-600 px-5 py-2 font-bold text-white hover:bg-rose-500">
                  Submit Fault Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Update Ticket Status Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <h3 className="font-bold text-slate-900 text-sm dark:text-white">Update Ticket {selectedTicket.ticketNumber}</h3>
              <button onClick={() => setSelectedTicket(null)} className="text-slate-400 hover:text-slate-600">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateStatus} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Status</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as TicketStatus)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2 font-bold dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                >
                  <option value="Open">Open</option>
                  <option value="Working">Working / In Progress</option>
                  <option value="Pending">Pending Parts</option>
                  <option value="Closed">Closed / Resolved</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Engineer Resolution Notes</label>
                <textarea
                  rows={3}
                  placeholder="Details of fix or replacement parts..."
                  value={resolutionText}
                  onChange={(e) => setResolutionText(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                />
              </div>

              <div className="mt-4 flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setSelectedTicket(null)}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 font-bold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button type="submit" className="rounded-xl bg-emerald-600 px-5 py-2 font-bold text-white hover:bg-emerald-500">
                  Update Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
