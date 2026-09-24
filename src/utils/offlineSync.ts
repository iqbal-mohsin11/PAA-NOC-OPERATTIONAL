// Offline Sync Queue & Storage Management for PAA Sentinel

export interface OfflineQueueItem {
  id: string;
  timestamp: string;
  action: string;
  endpoint: string;
  method: 'POST' | 'PUT' | 'DELETE';
  payload?: any;
  status: 'pending' | 'syncing' | 'failed' | 'synced';
  error?: string;
  retryCount: number;
}

const OFFLINE_QUEUE_KEY = 'paa_sentinel_offline_queue';
const OFFLINE_LAST_SYNC_KEY = 'paa_sentinel_last_sync_time';

export function getOfflineQueue(): OfflineQueueItem[] {
  try {
    const raw = localStorage.getItem(OFFLINE_QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveOfflineQueue(queue: OfflineQueueItem[]): void {
  try {
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
  } catch (err) {
    console.error('Failed to save offline sync queue:', err);
  }
}

export function enqueueOfflineAction(
  action: string,
  endpoint: string,
  method: 'POST' | 'PUT' | 'DELETE',
  payload?: any
): OfflineQueueItem {
  const queue = getOfflineQueue();
  const newItem: OfflineQueueItem = {
    id: `OFL-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
    timestamp: new Date().toISOString(),
    action,
    endpoint,
    method,
    payload,
    status: 'pending',
    retryCount: 0,
  };

  queue.push(newItem);
  saveOfflineQueue(queue);
  return newItem;
}

export function removeOfflineAction(id: string): void {
  const queue = getOfflineQueue().filter((item) => item.id !== id);
  saveOfflineQueue(queue);
}

export function clearSyncedOfflineActions(): void {
  const queue = getOfflineQueue().filter((item) => item.status !== 'synced');
  saveOfflineQueue(queue);
}

export function clearAllOfflineQueue(): void {
  saveOfflineQueue([]);
}

export function getLastSyncTime(): string | null {
  return localStorage.getItem(OFFLINE_LAST_SYNC_KEY);
}

export function setLastSyncTime(time: string): void {
  localStorage.setItem(OFFLINE_LAST_SYNC_KEY, time);
}

export async function processOfflineQueue(): Promise<{
  successCount: number;
  failureCount: number;
  remainingQueue: OfflineQueueItem[];
}> {
  const queue = getOfflineQueue();
  if (queue.length === 0) {
    return { successCount: 0, failureCount: 0, remainingQueue: [] };
  }

  let successCount = 0;
  let failureCount = 0;
  const updatedQueue: OfflineQueueItem[] = [];

  for (const item of queue) {
    if (item.status === 'synced') continue;

    try {
      item.status = 'syncing';
      const options: RequestInit = {
        method: item.method,
        headers: { 'Content-Type': 'application/json' },
      };
      if (item.payload && item.method !== 'DELETE') {
        options.body = JSON.stringify(item.payload);
      }

      const res = await fetch(item.endpoint, options);
      if (res.ok) {
        item.status = 'synced';
        successCount++;
      } else {
        item.status = 'failed';
        item.error = `HTTP ${res.status}: ${res.statusText}`;
        item.retryCount = (item.retryCount || 0) + 1;
        failureCount++;
        updatedQueue.push(item);
      }
    } catch (err: any) {
      item.status = 'failed';
      item.error = err?.message || 'Network unreachable';
      item.retryCount = (item.retryCount || 0) + 1;
      failureCount++;
      updatedQueue.push(item);
    }
  }

  saveOfflineQueue(updatedQueue);
  if (successCount > 0) {
    setLastSyncTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
  }

  return {
    successCount,
    failureCount,
    remainingQueue: updatedQueue,
  };
}
