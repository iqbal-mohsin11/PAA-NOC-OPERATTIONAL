import React, { useState, useEffect } from 'react';
import {
  X,
  Wifi,
  WifiOff,
  RefreshCw,
  HardDrive,
  Database,
  CloudUpload,
  CheckCircle2,
  AlertCircle,
  Download,
  Trash2,
  ShieldCheck,
  Smartphone,
  Info,
  ShieldAlert,
  Clock,
  RotateCcw,
  Save,
  Check,
  Layers,
  Activity,
  History,
} from 'lucide-react';
import { useInventory } from '../context/InventoryContext';
import {
  getOfflineQueue,
  clearAllOfflineQueue,
  processOfflineQueue,
  getLastSyncTime,
  OfflineQueueItem,
} from '../utils/offlineSync';
import {
  exportBackupAsJson,
  AssetBackupSnapshot,
} from '../services/assetBackupService';
import { PWAInstallButton } from './PWAInstallButton';

interface OfflineManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  isOnline: boolean;
  initialTab?: 'sync' | 'backups';
}

export const OfflineManagerModal: React.FC<OfflineManagerModalProps> = ({
  isOpen,
  onClose,
  isOnline,
  initialTab = 'sync',
}) => {
  const {
    assets,
    tickets,
    maintenanceRecords,
    upsMaintenanceRecords,
    tonerIssueRecords,
    gatePassRecords,
    dbStatus,
    refreshDbData,
    lastBackupTime,
    lastBackupSnapshot,
    backupIntervalSeconds,
    isBackupServiceActive,
    backupHistory,
    triggerManualBackup,
    restoreAssetBackup,
    deleteAssetBackup,
    clearAllAssetBackups,
    setBackupIntervalSeconds,
    refreshBackupHistory,
  } = useInventory();

  const [activeTab, setActiveTab] = useState<'sync' | 'backups'>(initialTab);
  const [queue, setQueue] = useState<OfflineQueueItem[]>(() => getOfflineQueue());
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{ success: number; failed: number } | null>(null);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [backupSuccessMessage, setBackupSuccessMessage] = useState<string | null>(null);
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const lastSync = getLastSyncTime();

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      setQueue(getOfflineQueue());
      if (refreshBackupHistory) {
        refreshBackupHistory();
      }
    }
  }, [isOpen, initialTab, refreshBackupHistory]);

  if (!isOpen) return null;

  const handleManualSync = async () => {
    setIsSyncing(true);
    setSyncResult(null);
    try {
      const res = await processOfflineQueue();
      setQueue(res.remainingQueue);
      setSyncResult({ success: res.successCount, failed: res.failureCount });
      if (refreshDbData) {
        await refreshDbData();
      }
    } finally {
      setIsSyncing(false);
    }
  };

  const handleClearQueue = () => {
    if (
      window.confirm(
        'Are you sure you want to clear the pending offline queue? Local edits are still saved in your device storage.'
      )
    ) {
      clearAllOfflineQueue();
      setQueue([]);
    }
  };

  const handleTriggerManualBackup = async () => {
    setIsBackingUp(true);
    try {
      const snapshot = await triggerManualBackup('Manual backup triggered from Offline Manager');
      setBackupSuccessMessage(`Snapshot saved: ${snapshot.assetCount} assets at ${snapshot.formattedTime}`);
      setTimeout(() => setBackupSuccessMessage(null), 4000);
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleRestore = async (snapshot: AssetBackupSnapshot) => {
    if (
      window.confirm(
        `Restore ${snapshot.assetCount} assets from backup "${snapshot.backupId}" (${new Date(
          snapshot.timestamp
        ).toLocaleString()})?\n\nThis will safely roll back your asset list to this snapshot.`
      )
    ) {
      setRestoringId(snapshot.backupId);
      try {
        const ok = await restoreAssetBackup(snapshot.backupId);
        if (ok) {
          setBackupSuccessMessage(`Successfully restored ${snapshot.assetCount} assets!`);
          setTimeout(() => setBackupSuccessMessage(null), 4000);
        }
      } finally {
        setRestoringId(null);
      }
    }
  };

  const handleDeleteSnapshot = async (backupId: string) => {
    if (window.confirm('Delete this backup snapshot?')) {
      await deleteAssetBackup(backupId);
    }
  };

  const handleClearAllSnapshots = async () => {
    if (
      window.confirm(
        'Are you sure you want to clear all backup snapshots? (Your current active assets will not be affected).'
      )
    ) {
      await clearAllAssetBackups();
    }
  };

  const handleExportOfflineBackup = () => {
    const backupData = {
      exportedAt: new Date().toISOString(),
      system: 'PAA Sentinel v5.0 Offline Backup',
      counts: {
        assets: assets.length,
        tickets: tickets.length,
        maintenance: maintenanceRecords.length,
        upsMaintenance: upsMaintenanceRecords.length,
        tonerIssues: tonerIssueRecords.length,
        gatePasses: gatePassRecords.length,
      },
      data: {
        assets,
        tickets,
        maintenanceRecords,
        upsMaintenanceRecords,
        tonerIssueRecords,
        gatePassRecords,
      },
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `PAA_Sentinel_Full_Offline_Backup_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Estimate storage usage
  let storageEstimateKb = 0;
  try {
    let total = 0;
    for (const x in localStorage) {
      if (Object.prototype.hasOwnProperty.call(localStorage, x)) {
        total += (localStorage[x].length + x.length) * 2;
      }
    }
    storageEstimateKb = Math.round(total / 1024);
  } catch {
    storageEstimateKb = 0;
  }

  const totalBackupSizeKb = backupHistory.reduce((acc, b) => acc + (b.sizeKb || 0), 0);

  const getTriggerBadge = (trigger: AssetBackupSnapshot['trigger']) => {
    switch (trigger) {
      case 'timer':
        return (
          <span className="rounded bg-blue-100 px-1.5 py-0.5 text-[9px] font-bold text-blue-800 dark:bg-blue-950 dark:text-blue-300">
            Periodic Timer
          </span>
        );
      case 'beforeunload':
        return (
          <span className="rounded bg-rose-100 px-1.5 py-0.5 text-[9px] font-bold text-rose-800 dark:bg-rose-950 dark:text-rose-300">
            Browser Exit
          </span>
        );
      case 'visibilitychange':
        return (
          <span className="rounded bg-purple-100 px-1.5 py-0.5 text-[9px] font-bold text-purple-800 dark:bg-purple-950 dark:text-purple-300">
            Tab Switch
          </span>
        );
      case 'offline':
        return (
          <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[9px] font-bold text-amber-800 dark:bg-amber-950 dark:text-amber-300">
            Offline Trigger
          </span>
        );
      case 'manual':
        return (
          <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[9px] font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
            Manual
          </span>
        );
      default:
        return (
          <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[9px] font-bold text-slate-800 dark:bg-slate-800 dark:text-slate-300">
            Startup
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-2xl bg-white shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800 my-8 overflow-hidden animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="border-b border-slate-100 bg-slate-50/80 px-5 py-4 dark:border-slate-800 dark:bg-slate-800/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-xl shadow-xs ${
                  isOnline ? 'bg-emerald-600 text-white' : 'bg-amber-500 text-white'
                }`}
              >
                {isOnline ? <Wifi className="h-5 w-5" /> : <WifiOff className="h-5 w-5" />}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">
                    Offline Operations & Crash Protection
                  </h2>
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wider ${
                      isOnline
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                    }`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                      }`}
                    />
                    {isOnline ? 'Network Online' : 'Offline Mode'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Continuous browser storage backups & background synchronization
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="mt-4 flex gap-1 rounded-xl bg-slate-200/70 p-1 dark:bg-slate-800">
            <button
              type="button"
              onClick={() => setActiveTab('sync')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-bold transition ${
                activeTab === 'sync'
                  ? 'bg-white text-slate-900 shadow-2xs dark:bg-slate-900 dark:text-white'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              <CloudUpload className="h-3.5 w-3.5" />
              <span>Data Sync & Queue</span>
              {queue.length > 0 && (
                <span className="ml-1 rounded-full bg-amber-500 px-1.5 py-0.2 text-[10px] text-white font-extrabold">
                  {queue.length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('backups')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-bold transition ${
                activeTab === 'backups'
                  ? 'bg-white text-slate-900 shadow-2xs dark:bg-slate-900 dark:text-white'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              <ShieldAlert className="h-3.5 w-3.5 text-emerald-500" />
              <span>Crash Prevention & Backups</span>
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            </button>
          </div>
        </div>

        {/* Tab 1: Sync & Queue */}
        {activeTab === 'sync' && (
          <div className="max-h-[72vh] overflow-y-auto p-5 space-y-5">
            {/* Status Metrics Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-3 dark:border-slate-800 dark:bg-slate-800/40">
                <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-xs font-semibold">
                  <HardDrive className="h-3.5 w-3.5 text-blue-500" />
                  <span>Offline Storage</span>
                </div>
                <p className="mt-1 text-lg font-black text-slate-800 dark:text-slate-100">
                  {storageEstimateKb} <span className="text-xs font-medium text-slate-500">KB</span>
                </p>
                <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                  Persistent Cache
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-3 dark:border-slate-800 dark:bg-slate-800/40">
                <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-xs font-semibold">
                  <Database className="h-3.5 w-3.5 text-teal-500" />
                  <span>Cached Assets</span>
                </div>
                <p className="mt-1 text-lg font-black text-slate-800 dark:text-slate-100">
                  {assets.length} <span className="text-xs font-medium text-slate-500">items</span>
                </p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">
                  {tickets.length} tickets, {maintenanceRecords.length} repairs
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-3 dark:border-slate-800 dark:bg-slate-800/40">
                <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-xs font-semibold">
                  <CloudUpload className="h-3.5 w-3.5 text-amber-500" />
                  <span>Pending Sync</span>
                </div>
                <p className="mt-1 text-lg font-black text-slate-800 dark:text-slate-100">
                  {queue.length} <span className="text-xs font-medium text-slate-500">queued</span>
                </p>
                <p className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold">
                  {queue.length === 0 ? 'Everything Synced' : 'Ready to push'}
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-3 dark:border-slate-800 dark:bg-slate-800/40">
                <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-xs font-semibold">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                  <span>Server State</span>
                </div>
                <p className="mt-1 text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                  {dbStatus.isConnected ? 'MongoDB Active' : 'Standalone / Local'}
                </p>
                <p className="text-[10px] text-slate-400">{lastSync ? `Last: ${lastSync}` : 'Ready'}</p>
              </div>
            </div>

            {/* Sync Actions Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2.5 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-800/60">
              <div className="text-xs">
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {queue.length === 0
                    ? 'All local data is up-to-date with your backend.'
                    : `${queue.length} modification(s) waiting to synchronize.`}
                </span>
                <p className="text-slate-500 dark:text-slate-400 text-[11px]">
                  {isOnline
                    ? 'Click "Sync Now" to push all pending changes to the server.'
                    : 'You are currently offline. Changes will auto-sync when network returns.'}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleManualSync}
                  disabled={isSyncing || (!isOnline && queue.length === 0)}
                  className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-500 disabled:opacity-50 transition active:scale-[0.98]"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span>{isSyncing ? 'Syncing...' : 'Sync Now'}</span>
                </button>

                {queue.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearQueue}
                    className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 hover:bg-rose-50 hover:text-rose-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-rose-950/40 dark:hover:text-rose-400 transition"
                    title="Clear Queue"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Clear</span>
                  </button>
                )}
              </div>
            </div>

            {/* Sync Result Feedback */}
            {syncResult && (
              <div
                className={`flex items-center gap-2 rounded-xl p-3 text-xs font-semibold ${
                  syncResult.failed === 0
                    ? 'border border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
                    : 'border border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300'
                }`}
              >
                {syncResult.failed === 0 ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <AlertCircle className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
                )}
                <span>
                  Sync completed: <strong>{syncResult.success}</strong> actions pushed successfully.
                  {syncResult.failed > 0 && ` (${syncResult.failed} failed/server offline)`}
                </span>
              </div>
            )}

            {/* Pending Sync Queue List */}
            <div>
              <div className="flex items-center justify-between pb-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Pending Offline Queue ({queue.length})
                </h3>
                <span className="text-[11px] text-slate-400">Auto-flushes on reconnect</span>
              </div>

              {queue.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center dark:border-slate-800">
                  <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-500 opacity-60" />
                  <p className="mt-2 text-xs font-bold text-slate-700 dark:text-slate-300">
                    Queue is Clear & Synced
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Any updates made while offline will be recorded here and synced when connection resumes.
                  </p>
                </div>
              ) : (
                <div className="max-h-48 overflow-y-auto space-y-2 rounded-xl border border-slate-200 p-2 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                  {queue.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between rounded-lg bg-white p-2.5 text-xs shadow-2xs dark:bg-slate-800 border border-slate-100 dark:border-slate-700/60"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className={`rounded px-1.5 py-0.5 text-[9px] font-black uppercase ${
                            item.method === 'POST'
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                              : item.method === 'PUT'
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                              : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                          }`}
                        >
                          {item.method}
                        </span>
                        <div className="truncate">
                          <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                            {item.action}
                          </p>
                          <p className="text-[10px] text-slate-400 truncate">
                            {item.endpoint} • {new Date(item.timestamp).toLocaleTimeString()}
                            {item.error ? ` • Error: ${item.error}` : ''}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] font-bold ${
                          item.status === 'failed'
                            ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                            : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {item.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Offline Capabilities Guide */}
            <div className="rounded-xl border border-indigo-100 bg-indigo-50/60 p-4 dark:border-indigo-900/50 dark:bg-indigo-950/30 space-y-2 text-xs">
              <div className="flex items-center gap-2 font-bold text-indigo-900 dark:text-indigo-200">
                <Info className="h-4 w-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                <span>How Offline Working Operates in PAA Sentinel:</span>
              </div>
              <ul className="list-disc pl-5 space-y-1 text-slate-600 dark:text-slate-300 text-[11px]">
                <li>
                  <strong>No Internet Required:</strong> When airport runway/ramp, terminal basement, or sub-station networks go down, you can keep working normally.
                </li>
                <li>
                  <strong>Crash-Resilient Backups:</strong> The background service continuously backs up your assets to browser storage (IndexedDB) every {backupIntervalSeconds} seconds.
                </li>
                <li>
                  <strong>Automatic Conflict-Free Reconciliation:</strong> When Wi-Fi/LAN reconnects, the system flushes the offline queue and reconciles with the central database.
                </li>
              </ul>
            </div>
          </div>
        )}

        {/* Tab 2: Crash Prevention & Asset Backups */}
        {activeTab === 'backups' && (
          <div className="max-h-[72vh] overflow-y-auto p-5 space-y-5">
            {/* Service Live Monitor Banner */}
            <div className="rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 p-4 dark:border-emerald-800/80 dark:from-emerald-950/30 dark:via-teal-950/20 dark:to-emerald-950/30">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-xs">
                    <Activity className="h-5 w-5 animate-pulse" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-extrabold text-emerald-950 dark:text-emerald-100">
                        Periodic Asset Backup Service
                      </h3>
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
                        Running
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                      Continuously backs up {assets.length} assets to <strong>IndexedDB</strong> + LocalStorage Mirror to prevent data loss from browser crashes.
                    </p>
                    <p className="text-[11px] text-emerald-800 dark:text-emerald-300 font-semibold mt-1 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Last Backup: {lastBackupTime ? `${lastBackupTime}` : 'Initiating...'}
                      {lastBackupSnapshot && ` • Trigger: ${lastBackupSnapshot.trigger}`}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
                  <button
                    type="button"
                    onClick={handleTriggerManualBackup}
                    disabled={isBackingUp}
                    className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-500 active:scale-[0.98] transition disabled:opacity-50"
                  >
                    <Save className={`h-3.5 w-3.5 ${isBackingUp ? 'animate-spin' : ''}`} />
                    <span>{isBackingUp ? 'Saving Snapshot...' : 'Backup Now'}</span>
                  </button>
                </div>
              </div>

              {/* Feedback toast */}
              {backupSuccessMessage && (
                <div className="mt-3 flex items-center gap-2 rounded-xl bg-emerald-100/80 px-3 py-2 text-xs font-bold text-emerald-900 dark:bg-emerald-900/50 dark:text-emerald-200 animate-in fade-in">
                  <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  <span>{backupSuccessMessage}</span>
                </div>
              )}
            </div>

            {/* Config & Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Frequency Selector */}
              <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-3 dark:border-slate-800 dark:bg-slate-800/40">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-blue-500" />
                  Backup Interval
                </span>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Frequency of periodic storage snapshots
                </p>
                <div className="mt-2.5 flex items-center gap-1.5">
                  {[30, 60, 120, 300].map((sec) => (
                    <button
                      key={sec}
                      type="button"
                      onClick={() => setBackupIntervalSeconds(sec)}
                      className={`flex-1 py-1 rounded-lg text-[11px] font-bold transition ${
                        backupIntervalSeconds === sec
                          ? 'bg-emerald-600 text-white shadow-2xs'
                          : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
                      }`}
                    >
                      {sec >= 60 ? `${sec / 60}m` : `${sec}s`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Stored Snapshots Counter */}
              <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-3 dark:border-slate-800 dark:bg-slate-800/40">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Layers className="h-3.5 w-3.5 text-purple-500" />
                  Rolling Snapshots
                </span>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Retains up to 15 latest recovery checkpoints
                </p>
                <div className="mt-2 flex items-baseline gap-1.5">
                  <span className="text-xl font-black text-slate-900 dark:text-white">
                    {backupHistory.length}
                  </span>
                  <span className="text-xs text-slate-500">/ 15 stored</span>
                  <span className="ml-auto text-[11px] font-semibold text-purple-600 dark:text-purple-400">
                    ~{totalBackupSizeKb} KB
                  </span>
                </div>
              </div>

              {/* Crash Protection Triggers */}
              <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-3 dark:border-slate-800 dark:bg-slate-800/40">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                  Lifecycle Guards
                </span>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Instant snapshot on critical events
                </p>
                <div className="mt-2 flex flex-wrap gap-1 text-[10px] font-semibold text-slate-600 dark:text-slate-300">
                  <span className="rounded bg-emerald-50 px-1.5 py-0.5 border border-emerald-200 dark:bg-emerald-950 dark:border-emerald-800">
                    Tab Hide
                  </span>
                  <span className="rounded bg-emerald-50 px-1.5 py-0.5 border border-emerald-200 dark:bg-emerald-950 dark:border-emerald-800">
                    Window Close
                  </span>
                  <span className="rounded bg-emerald-50 px-1.5 py-0.5 border border-emerald-200 dark:bg-emerald-950 dark:border-emerald-800">
                    Go Offline
                  </span>
                </div>
              </div>
            </div>

            {/* Rolling Snapshots List */}
            <div>
              <div className="flex items-center justify-between pb-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <History className="h-3.5 w-3.5" />
                  <span>Available Storage Snapshots ({backupHistory.length})</span>
                </h3>
                {backupHistory.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearAllSnapshots}
                    className="text-[11px] font-semibold text-rose-600 hover:text-rose-700 dark:text-rose-400"
                  >
                    Clear All
                  </button>
                )}
              </div>

              {backupHistory.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center dark:border-slate-800">
                  <ShieldAlert className="mx-auto h-8 w-8 text-slate-400" />
                  <p className="mt-2 text-xs font-bold text-slate-700 dark:text-slate-300">
                    No Snapshots Yet
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Click &quot;Backup Now&quot; or wait for the automatic periodic background timer.
                  </p>
                </div>
              ) : (
                <div className="max-h-56 overflow-y-auto space-y-2 rounded-xl border border-slate-200 p-2 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                  {backupHistory.map((item) => (
                    <div
                      key={item.backupId}
                      className="flex items-center justify-between gap-2 rounded-xl bg-white p-2.5 text-xs shadow-2xs dark:bg-slate-800 border border-slate-100 dark:border-slate-700/60"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                          <Database className="h-4 w-4" />
                        </div>
                        <div className="truncate">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-900 dark:text-slate-100">
                              {item.assetCount} Assets
                            </span>
                            {getTriggerBadge(item.trigger)}
                            <span className="text-[10px] text-slate-400">~{item.sizeKb}KB</span>
                          </div>
                          <p className="text-[10px] text-slate-400 truncate mt-0.5">
                            {new Date(item.timestamp).toLocaleString()} • {item.backupId}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {/* Restore Button */}
                        <button
                          type="button"
                          onClick={() => handleRestore(item)}
                          disabled={restoringId === item.backupId}
                          className="flex items-center gap-1 rounded-lg bg-emerald-50 px-2 py-1 text-[11px] font-bold text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-300 transition"
                          title="Restore asset list from this snapshot"
                        >
                          <RotateCcw
                            className={`h-3 w-3 ${restoringId === item.backupId ? 'animate-spin' : ''}`}
                          />
                          <span>Restore</span>
                        </button>

                        {/* Download JSON Button */}
                        <button
                          type="button"
                          onClick={() => exportBackupAsJson(item)}
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-700 transition"
                          title="Export snapshot as .json file"
                        >
                          <Download className="h-3.5 w-3.5" />
                        </button>

                        {/* Delete Button */}
                        <button
                          type="button"
                          onClick={() => handleDeleteSnapshot(item.backupId)}
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40 transition"
                          title="Delete snapshot"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Offline Crash Architecture Description */}
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/40 text-xs space-y-1.5 text-slate-600 dark:text-slate-300">
              <p className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                Why this protects airport operations:
              </p>
              <p className="text-[11px]">
                Airport inventory audits and runway inspections occur in connectivity dead zones. If an iPad or laptop battery dies, or if a browser tab crashes unexpectedly, the background service guarantees that your latest modifications are safely recorded in local persistent <strong>IndexedDB</strong> and ready for instant 1-click recovery.
              </p>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 border-t border-slate-100 bg-slate-50/80 dark:border-slate-800 dark:bg-slate-800/50">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportOfflineBackup}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 transition shadow-2xs"
              title="Download full database snapshot"
            >
              <Download className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
              <span>Full Offline Export (.json)</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <PWAInstallButton />
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 transition"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
