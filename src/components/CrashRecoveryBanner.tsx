import React, { useState } from 'react';
import {
  ShieldAlert,
  RotateCcw,
  Eye,
  X,
  CheckCircle2,
  HardDrive,
  Clock,
  Database,
} from 'lucide-react';
import { useInventory } from '../context/InventoryContext';

interface CrashRecoveryBannerProps {
  onOpenBackupManager: () => void;
}

export const CrashRecoveryBanner: React.FC<CrashRecoveryBannerProps> = ({
  onOpenBackupManager,
}) => {
  const {
    crashRecoveryInfo,
    restoreAssetBackup,
    dismissCrashRecovery,
    assets,
  } = useInventory();

  const [isRestoring, setIsRestoring] = useState(false);
  const [restoredSuccess, setRestoredSuccess] = useState(false);

  if (!crashRecoveryInfo || !crashRecoveryInfo.crashDetected || !crashRecoveryInfo.latestBackup) {
    return null;
  }

  const backup = crashRecoveryInfo.latestBackup;

  const handleRestore = async () => {
    if (
      !window.confirm(
        `Are you sure you want to restore ${backup.assetCount} assets from the offline storage backup (${new Date(
          backup.timestamp
        ).toLocaleTimeString()})? This will replace your current memory list.`
      )
    ) {
      return;
    }

    setIsRestoring(true);
    try {
      const ok = await restoreAssetBackup(backup.backupId);
      if (ok) {
        setRestoredSuccess(true);
        setTimeout(() => {
          dismissCrashRecovery();
        }, 3500);
      }
    } finally {
      setIsRestoring(false);
    }
  };

  if (restoredSuccess) {
    return (
      <div className="bg-emerald-600 text-white px-4 py-2.5 shadow-md flex items-center justify-between text-xs font-semibold animate-in slide-in-from-top-3">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-200" />
          <span>
            Successfully restored <strong>{backup.assetCount} assets</strong> from your offline storage backup point!
          </span>
        </div>
        <button
          type="button"
          onClick={dismissCrashRecovery}
          className="rounded p-1 hover:bg-emerald-700 text-white/80 hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div
      role="alert"
      className="bg-gradient-to-r from-amber-600 via-amber-700 to-orange-700 text-white shadow-lg border-b border-amber-800 px-3.5 py-2.5 sm:px-5 sm:py-3 transition animate-in slide-in-from-top-3"
    >
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex items-start sm:items-center gap-2.5 min-w-0">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/20 text-white shadow-xs">
            <ShieldAlert className="h-4 w-4 text-amber-200 animate-pulse" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-extrabold uppercase tracking-wider text-[11px] bg-amber-900/60 px-2 py-0.5 rounded-full border border-amber-400/40">
                Crash Recovery Available
              </span>
              <span className="text-[11px] text-amber-100 flex items-center gap-1 font-medium">
                <Clock className="h-3 w-3 inline text-amber-200" />
                Snapshot: {new Date(backup.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ({backup.assetCount} assets, ~{backup.sizeKb}KB)
              </span>
            </div>
            <p className="text-xs text-amber-50 mt-0.5 line-clamp-1">
              {crashRecoveryInfo.reason ||
                'An abnormal browser termination was detected while working offline. Your continuous storage backup is ready to restore.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
          <button
            type="button"
            onClick={handleRestore}
            disabled={isRestoring}
            className="flex items-center gap-1.5 rounded-xl bg-white px-3 py-1.5 text-xs font-bold text-amber-950 shadow-sm hover:bg-amber-50 active:scale-[0.98] transition disabled:opacity-50"
          >
            <RotateCcw className={`h-3.5 w-3.5 ${isRestoring ? 'animate-spin' : ''}`} />
            <span>{isRestoring ? 'Restoring...' : `Restore ${backup.assetCount} Assets`}</span>
          </button>

          <button
            type="button"
            onClick={onOpenBackupManager}
            className="flex items-center gap-1 rounded-xl bg-amber-800/80 hover:bg-amber-800 border border-amber-500/50 px-2.5 py-1.5 text-xs font-semibold text-white transition"
          >
            <Eye className="h-3.5 w-3.5 text-amber-200" />
            <span className="hidden sm:inline">Review Backups</span>
          </button>

          <button
            type="button"
            onClick={dismissCrashRecovery}
            className="rounded-lg p-1 text-white/80 hover:bg-black/20 hover:text-white transition"
            title="Dismiss notification"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
