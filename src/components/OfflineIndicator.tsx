import React, { useEffect, useState } from 'react';
import { WifiOff, RefreshCw, AlertCircle, CheckCircle2, ChevronRight } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { getOfflineQueue, processOfflineQueue } from '../utils/offlineSync';
import { useInventory } from '../context/InventoryContext';

interface OfflineIndicatorProps {
  onOpenOfflineManager: () => void;
  onRefreshDb?: () => Promise<void>;
}

export const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({
  onOpenOfflineManager,
  onRefreshDb,
}) => {
  const isOnline = useOnlineStatus();
  const { lastBackupTime } = useInventory();
  const [wasOffline, setWasOffline] = useState(false);
  const [showReconnectedToast, setShowReconnectedToast] = useState(false);
  const [queueCount, setQueueCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    const updateCount = () => {
      setQueueCount(getOfflineQueue().length);
    };

    updateCount();
    const interval = setInterval(updateCount, 4000);
    return () => clearInterval(interval);
  }, []);

  // When coming back online from offline
  useEffect(() => {
    if (!isOnline) {
      setWasOffline(true);
      setShowReconnectedToast(false);
    } else if (wasOffline && isOnline) {
      setShowReconnectedToast(true);
      // Auto-flush queue
      setIsSyncing(true);
      processOfflineQueue()
        .then(() => {
          if (onRefreshDb) onRefreshDb();
        })
        .finally(() => {
          setIsSyncing(false);
          setQueueCount(getOfflineQueue().length);
        });

      const timer = setTimeout(() => {
        setShowReconnectedToast(false);
        setWasOffline(false);
      }, 6000);
      return () => clearTimeout(timer);
    }
  }, [isOnline, wasOffline, onRefreshDb]);

  // If online and not recently reconnected, don't render floating banner
  if (isOnline && !showReconnectedToast) {
    return null;
  }

  // Reconnected Toast Banner
  if (isOnline && showReconnectedToast) {
    return (
      <div className="fixed bottom-4 right-4 z-50 flex items-center gap-3 rounded-2xl border border-emerald-300 bg-white/95 px-4 py-3 text-xs font-semibold text-emerald-900 shadow-xl backdrop-blur dark:border-emerald-800 dark:bg-slate-900/95 dark:text-emerald-200 animate-in slide-in-from-bottom-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 shrink-0">
          {isSyncing ? (
            <RefreshCw className="h-4 w-4 animate-spin text-emerald-600" />
          ) : (
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          )}
        </div>
        <div>
          <p className="font-bold">Network Reconnected</p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            {isSyncing
              ? 'Synchronizing offline queue with server...'
              : 'All offline changes have been synchronized successfully.'}
          </p>
        </div>
        <button
          type="button"
          onClick={onOpenOfflineManager}
          className="ml-1 rounded-lg bg-emerald-50 px-2 py-1 text-[11px] font-bold text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-300"
        >
          Details
        </button>
      </div>
    );
  }

  // Offline Mode Floating Banner
  return (
    <div
      role="status"
      className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-50 flex items-center justify-between gap-3 rounded-2xl border border-amber-300 bg-amber-500/95 p-3.5 text-xs text-white shadow-2xl backdrop-blur animate-in slide-in-from-bottom-5"
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/20 shrink-0">
          <WifiOff className="h-4 w-4 text-white" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-black uppercase tracking-wider text-[11px]">
              Offline Working Mode
            </span>
            <span className="h-2 w-2 rounded-full bg-white animate-pulse" />
          </div>
          <p className="text-[11px] text-amber-100 truncate">
            {queueCount > 0
              ? `${queueCount} change(s) queued • Storage backup active`
              : `Operating offline • Crash protected (${lastBackupTime || 'IndexedDB Guard'})`}
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={onOpenOfflineManager}
        className="flex items-center gap-1 rounded-xl bg-white px-3 py-1.5 text-xs font-bold text-amber-900 hover:bg-amber-50 shadow-xs transition shrink-0 active:scale-[0.98]"
      >
        <span>Manage</span>
        <ChevronRight className="h-3 w-3" />
      </button>
    </div>
  );
};
