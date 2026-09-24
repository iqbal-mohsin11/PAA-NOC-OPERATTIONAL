import { AssetItem } from '../types/inventory';

export type BackupTrigger =
  | 'timer'
  | 'offline'
  | 'visibilitychange'
  | 'beforeunload'
  | 'manual'
  | 'startup';

export interface AssetBackupSnapshot {
  backupId: string;
  timestamp: string; // ISO string
  formattedTime: string;
  assetCount: number;
  trigger: BackupTrigger;
  sizeKb: number;
  hash: string;
  assets: AssetItem[];
  notes?: string;
}

const DB_NAME = 'PAA_Sentinel_Offline_Storage';
const STORE_NAME = 'asset_backups';
const DB_VERSION = 1;
const MAX_BACKUPS_TO_RETAIN = 15;

const STORAGE_KEYS = {
  LATEST_BACKUP: 'paa_sentinel_asset_crash_recovery_latest',
  CRASH_HEARTBEAT: 'paa_sentinel_session_heartbeat',
  CRASH_CLEAN_EXIT: 'paa_sentinel_session_clean_exit',
  BACKUP_CONFIG: 'paa_sentinel_backup_config',
  DISMISSED_CRASH_ID: 'paa_sentinel_dismissed_crash_id',
};

export interface BackupConfig {
  intervalSeconds: number;
  enabled: boolean;
}

const DEFAULT_CONFIG: BackupConfig = {
  intervalSeconds: 60,
  enabled: true,
};

// Simple fast hash of asset list to avoid writing identical backups
function calculateAssetsHash(assets: AssetItem[]): string {
  try {
    let hash = 0;
    const str = `${assets.length}-${assets.map((a) => `${a.id}:${a.status}:${a.updatedAt || a.createdAt || ''}`).join('|')}`;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0; // Convert to 32bit integer
    }
    return `h_${Math.abs(hash)}_${assets.length}`;
  } catch {
    return `h_${assets.length}_${Date.now()}`;
  }
}

// Open IndexedDB database with Promise wrapper
function openBackupDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not supported in this environment'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'backupId' });
        store.createIndex('timestamp', 'timestamp', { unique: false });
        store.createIndex('assetCount', 'assetCount', { unique: false });
        store.createIndex('trigger', 'trigger', { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Failed to open backup database'));
  });
}

// Get user configuration
export function getBackupConfig(): BackupConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.BACKUP_CONFIG);
    if (!raw) return DEFAULT_CONFIG;
    const parsed = JSON.parse(raw);
    return {
      intervalSeconds: Number(parsed.intervalSeconds) || DEFAULT_CONFIG.intervalSeconds,
      enabled: parsed.enabled !== false,
    };
  } catch {
    return DEFAULT_CONFIG;
  }
}

// Save user configuration
export function setBackupConfig(config: Partial<BackupConfig>): void {
  try {
    const current = getBackupConfig();
    const updated = { ...current, ...config };
    localStorage.setItem(STORAGE_KEYS.BACKUP_CONFIG, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to save backup config:', err);
  }
}

// Save a backup snapshot to IndexedDB and LocalStorage Mirror
export async function saveAssetSnapshot(
  assets: AssetItem[],
  trigger: BackupTrigger = 'timer',
  notes?: string
): Promise<AssetBackupSnapshot> {
  const timestamp = new Date().toISOString();
  const backupId = `BAK-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
  const hash = calculateAssetsHash(assets);

  // Deep copy assets to prevent mutations
  const serialized = JSON.stringify(assets);
  const sizeKb = Math.round((serialized.length * 2) / 1024);

  const snapshot: AssetBackupSnapshot = {
    backupId,
    timestamp,
    formattedTime: new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }),
    assetCount: assets.length,
    trigger,
    sizeKb,
    hash,
    assets: JSON.parse(serialized),
    notes,
  };

  // 1. Save to LocalStorage Mirror (Single latest recovery point for immediate crash access)
  try {
    const mirrorMetadata = {
      backupId: snapshot.backupId,
      timestamp: snapshot.timestamp,
      assetCount: snapshot.assetCount,
      trigger: snapshot.trigger,
      sizeKb: snapshot.sizeKb,
      hash: snapshot.hash,
      formattedTime: snapshot.formattedTime,
    };
    localStorage.setItem(STORAGE_KEYS.LATEST_BACKUP, JSON.stringify({ metadata: mirrorMetadata, assets }));
  } catch (lsErr) {
    console.warn('LocalStorage backup mirror warning (quota or restricted):', lsErr);
  }

  // 2. Save full structured snapshot to IndexedDB
  try {
    const db = await openBackupDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(snapshot);

      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });

    // 3. Purge oldest backups beyond MAX_BACKUPS_TO_RETAIN
    await pruneOldBackups(db, MAX_BACKUPS_TO_RETAIN);
  } catch (idbErr) {
    console.error('IndexedDB backup failed, relying on localStorage mirror:', idbErr);
  }

  return snapshot;
}

// Prune old backups to keep storage clean
async function pruneOldBackups(db: IDBDatabase, maxKeep: number): Promise<void> {
  try {
    const all = await getAllSnapshotsFromDb(db);
    if (all.length > maxKeep) {
      // Sort oldest first
      all.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      const toDelete = all.slice(0, all.length - maxKeep);

      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      for (const item of toDelete) {
        store.delete(item.backupId);
      }
    }
  } catch (err) {
    console.warn('Failed to prune old backups:', err);
  }
}

// Internal helper to get all snapshots from open IndexedDB
function getAllSnapshotsFromDb(db: IDBDatabase): Promise<AssetBackupSnapshot[]> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const req = store.getAll();

    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

// Public: Get all backup snapshots sorted by newest first
export async function getBackupHistory(): Promise<AssetBackupSnapshot[]> {
  try {
    const db = await openBackupDb();
    const snapshots = await getAllSnapshotsFromDb(db);
    snapshots.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    return snapshots;
  } catch (err) {
    console.warn('Could not read from IndexedDB, checking localStorage mirror:', err);
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.LATEST_BACKUP);
      if (raw) {
        const parsed = JSON.parse(raw);
        return [
          {
            ...parsed.metadata,
            assets: parsed.assets,
          },
        ];
      }
    } catch {
      // Ignore
    }
    return [];
  }
}

// Public: Get the single latest backup snapshot
export async function getLatestBackup(): Promise<AssetBackupSnapshot | null> {
  const history = await getBackupHistory();
  return history.length > 0 ? history[0] : null;
}

// Public: Restore assets from a specific snapshot
export async function restoreBackup(backupId: string): Promise<AssetItem[] | null> {
  try {
    const db = await openBackupDb();
    const snapshot = await new Promise<AssetBackupSnapshot | undefined>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(backupId);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });

    if (snapshot && snapshot.assets && Array.isArray(snapshot.assets)) {
      return snapshot.assets;
    }
  } catch (err) {
    console.warn('Failed to restore from IndexedDB:', err);
  }

  // Fallback to localStorage mirror
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.LATEST_BACKUP);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.metadata?.backupId === backupId || !backupId) {
        return parsed.assets;
      }
    }
  } catch {
    // Ignore
  }

  return null;
}

// Public: Delete a single backup
export async function deleteBackup(backupId: string): Promise<void> {
  try {
    const db = await openBackupDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(backupId);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.error('Failed to delete backup from IndexedDB:', err);
  }
}

// Public: Clear all backups
export async function clearAllBackups(): Promise<void> {
  try {
    const db = await openBackupDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.clear();
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.error('Failed to clear IndexedDB backups:', err);
  }
  try {
    localStorage.removeItem(STORAGE_KEYS.LATEST_BACKUP);
  } catch {
    // Ignore
  }
}

// Public: Export snapshot as downloadable JSON file
export function exportBackupAsJson(snapshot: AssetBackupSnapshot): void {
  const data = {
    exportedAt: new Date().toISOString(),
    system: 'PAA Sentinel v5.0 Emergency Storage Backup',
    backupId: snapshot.backupId,
    timestamp: snapshot.timestamp,
    assetCount: snapshot.assetCount,
    trigger: snapshot.trigger,
    assets: snapshot.assets,
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `PAA_Asset_Backup_${snapshot.backupId}_${snapshot.timestamp.slice(0, 10)}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Crash Detection Logic
export async function checkCrashRecovery(currentAssets: AssetItem[]): Promise<{
  crashDetected: boolean;
  latestBackup: AssetBackupSnapshot | null;
  reason: string;
}> {
  try {
    const dismissedId = localStorage.getItem(STORAGE_KEYS.DISMISSED_CRASH_ID);
    const cleanExit = localStorage.getItem(STORAGE_KEYS.CRASH_CLEAN_EXIT);
    const lastHeartbeat = localStorage.getItem(STORAGE_KEYS.CRASH_HEARTBEAT);

    // If cleanExit was false and heartbeat was recent, a crash/force-close occurred
    const wasAbnormalTermination = cleanExit === 'false' && !!lastHeartbeat;

    const latest = await getLatestBackup();
    if (!latest || latest.assets.length === 0) {
      return { crashDetected: false, latestBackup: null, reason: '' };
    }

    if (dismissedId === latest.backupId) {
      return { crashDetected: false, latestBackup: null, reason: '' };
    }

    // Check if the backup has more assets or differs from currentAssets
    const currentHash = calculateAssetsHash(currentAssets);
    const hasUnsavedChanges = latest.hash !== currentHash;
    const hasMoreAssets = latest.assetCount > currentAssets.length;

    if (wasAbnormalTermination && hasUnsavedChanges) {
      return {
        crashDetected: true,
        latestBackup: latest,
        reason: `Unexpected session termination detected. Your offline backup has ${latest.assetCount} assets (${new Date(latest.timestamp).toLocaleTimeString()}).`,
      };
    }

    if (hasMoreAssets && currentAssets.length === 0) {
      return {
        crashDetected: true,
        latestBackup: latest,
        reason: `Storage was reset or empty, but an emergency offline backup containing ${latest.assetCount} assets was recovered.`,
      };
    }

    return { crashDetected: false, latestBackup: null, reason: '' };
  } catch (err) {
    console.warn('Crash recovery check failed:', err);
    return { crashDetected: false, latestBackup: null, reason: '' };
  }
}

export function dismissCrashRecovery(backupId?: string): void {
  try {
    if (backupId) {
      localStorage.setItem(STORAGE_KEYS.DISMISSED_CRASH_ID, backupId);
    }
    localStorage.setItem(STORAGE_KEYS.CRASH_CLEAN_EXIT, 'true');
  } catch {
    // Ignore
  }
}

// Background Runner that starts interval backups and lifecycle crash listeners
export function startBackgroundBackupService(
  getAssets: () => AssetItem[],
  onBackupComplete?: (snapshot: AssetBackupSnapshot) => void
): () => void {
  let lastHash = '';
  let intervalId: any = null;
  let heartbeatId: any = null;

  // Mark session active & start heartbeat
  try {
    localStorage.setItem(STORAGE_KEYS.CRASH_CLEAN_EXIT, 'false');
    localStorage.setItem(STORAGE_KEYS.CRASH_HEARTBEAT, Date.now().toString());
  } catch {
    // Ignore
  }

  heartbeatId = setInterval(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.CRASH_HEARTBEAT, Date.now().toString());
    } catch {
      // Ignore
    }
  }, 5000);

  // Helper to trigger backup only if dirty or forced
  const triggerBackup = async (trigger: BackupTrigger, force = false) => {
    const assets = getAssets();
    if (!assets) return;

    const currentHash = calculateAssetsHash(assets);
    if (!force && currentHash === lastHash) {
      // No changes detected since last backup
      return;
    }

    try {
      const snapshot = await saveAssetSnapshot(assets, trigger);
      lastHash = currentHash;
      if (onBackupComplete) {
        onBackupComplete(snapshot);
      }
    } catch (err) {
      console.error(`Failed to execute backup (${trigger}):`, err);
    }
  };

  // 1. Initial snapshot on launch (if assets present)
  setTimeout(() => {
    const initialAssets = getAssets();
    if (initialAssets && initialAssets.length > 0) {
      triggerBackup('startup', true);
    }
  }, 3000);

  // 2. Periodic background interval
  const setupInterval = () => {
    if (intervalId) clearInterval(intervalId);
    const config = getBackupConfig();
    if (!config.enabled) return;

    const ms = Math.max(10000, config.intervalSeconds * 1000);
    intervalId = setInterval(() => {
      triggerBackup('timer', false);
    }, ms);
  };

  setupInterval();

  // 3. Tab Visibility Change (switching tabs / minimizing browser)
  const handleVisibilityChange = () => {
    if (document.visibilityState === 'hidden') {
      triggerBackup('visibilitychange', false);
    }
  };
  document.addEventListener('visibilitychange', handleVisibilityChange);

  // 4. Network dropped to Offline
  const handleOffline = () => {
    triggerBackup('offline', true);
  };
  window.addEventListener('offline', handleOffline);

  // 5. Page Hide & Before Unload (Crash / tab close prevention)
  const handlePageUnload = () => {
    try {
      // Mark clean exit
      localStorage.setItem(STORAGE_KEYS.CRASH_CLEAN_EXIT, 'true');
      const assets = getAssets();
      if (assets && assets.length > 0) {
        // Synchronous write to LocalStorage mirror as final line of defense
        const metadata = {
          backupId: `BAK-${Date.now()}-EMERGENCY`,
          timestamp: new Date().toISOString(),
          assetCount: assets.length,
          trigger: 'beforeunload' as const,
          sizeKb: Math.round((JSON.stringify(assets).length * 2) / 1024),
          hash: calculateAssetsHash(assets),
          formattedTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        localStorage.setItem(STORAGE_KEYS.LATEST_BACKUP, JSON.stringify({ metadata, assets }));
      }
    } catch {
      // Ignore
    }
  };
  window.addEventListener('beforeunload', handlePageUnload);
  window.addEventListener('pagehide', handlePageUnload);

  // Return cleanup function
  return () => {
    if (intervalId) clearInterval(intervalId);
    if (heartbeatId) clearInterval(heartbeatId);
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    window.removeEventListener('offline', handleOffline);
    window.removeEventListener('beforeunload', handlePageUnload);
    window.removeEventListener('pagehide', handlePageUnload);
    try {
      localStorage.setItem(STORAGE_KEYS.CRASH_CLEAN_EXIT, 'true');
    } catch {
      // Ignore
    }
  };
}
