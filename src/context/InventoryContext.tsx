import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  AssetItem,
  IssueTicket,
  MaintenanceRecord,
  AuditLog,
  AirportFacility,
  OrganizationSettings,
  UserRole,
  RemovalReason,
  Department,
  TonerIssueRecord,
  GatePassRecord,
  LogisticsReceivingRecord,
  UPSMaintenanceRecord,
} from '../types/inventory';
import {
  initialAssets,
  initialTickets,
  initialMaintenanceRecords,
  initialUPSMaintenanceRecords,
  initialAuditLogs,
  initialFacilities,
  initialSettings,
  initialTonerIssueRecords,
  initialGatePassRecords,
  initialLogisticsReceivingRecords,
} from '../data/mockData';
import { initialAIIAPUpsAssets } from '../data/aiiapUpsData';

export interface RolePasswords {
  Administrator: string;
  Technician: string;
  Viewer: string;
}

export interface DbStatusInfo {
  isConnected: boolean;
  dbName: string;
  host: string;
  port: number;
  uriUsed: string;
  counts?: {
    assets: number;
    tickets: number;
    maintenance: number;
    logistics: number;
    gatepasses: number;
    auditLogs: number;
  };
  error?: string | null;
}

interface InventoryContextType {
  assets: AssetItem[];
  tickets: IssueTicket[];
  maintenanceRecords: MaintenanceRecord[];
  tonerIssueRecords: TonerIssueRecord[];
  gatePassRecords: GatePassRecord[];
  logisticsReceivingRecords: LogisticsReceivingRecord[];
  upsMaintenanceRecords: UPSMaintenanceRecord[];
  auditLogs: AuditLog[];
  facilities: AirportFacility[];
  settings: OrganizationSettings;
  userRole: UserRole;
  isLoggedIn: boolean;
  searchQuery: string;
  selectedDepartment: string;
  selectedCategory: string;
  selectedStatus: string;

  // MongoDB & Server Connection Status
  dbStatus: DbStatusInfo;
  isSyncing: boolean;
  refreshDbData: () => Promise<void>;

  // Role Passwords & Security
  rolePasswords: RolePasswords;
  updateRolePasswords: (newPasswords: Partial<RolePasswords>) => void;
  verifyRolePassword: (role: UserRole, inputPass: string) => boolean;
  switchRoleWithPassword: (role: UserRole, inputPass: string) => { success: boolean; message: string };
  login: (role: UserRole, inputPass: string) => { success: boolean; message: string };
  logout: () => void;

  // Actions
  setUserRole: (role: UserRole) => void;
  setSearchQuery: (query: string) => void;
  setSelectedDepartment: (dept: string) => void;
  setSelectedCategory: (cat: string) => void;
  setSelectedStatus: (status: string) => void;
  toggleTheme: () => void;

  addAsset: (assetData: Partial<AssetItem>) => AssetItem;
  updateAsset: (id: string, assetData: Partial<AssetItem>) => void;
  softRemoveAsset: (id: string, reason: RemovalReason, removedBy: string, remarks: string) => void;
  restoreAsset: (id: string) => void;
  deletePermanently: (id: string) => void;

  addTicket: (ticket: Omit<IssueTicket, 'ticketNumber'>) => void;
  updateTicketStatus: (ticketNumber: string, status: IssueTicket['status'], resolution?: string, closedDate?: string) => void;

  addMaintenanceRecord: (record: Omit<MaintenanceRecord, 'id'>) => void;
  addUPSMaintenanceRecord: (record: Omit<UPSMaintenanceRecord, 'id' | 'createdAt'>, updateAssetSpecs?: boolean) => UPSMaintenanceRecord;
  updateUPSMaintenanceRecord: (id: string, updates: Partial<UPSMaintenanceRecord>) => void;
  addTonerIssueRecord: (record: Omit<TonerIssueRecord, 'id'>, updatePrinterLevel?: boolean) => void;
  addGatePassRecord: (record: Omit<GatePassRecord, 'id'>) => void;
  updateGatePassStatus: (id: string, status: GatePassRecord['status'], actualReturnDate?: string, securityCleared?: string) => void;
  addLogisticsReceivingRecord: (recordData: Omit<LogisticsReceivingRecord, 'id' | 'createdAt'>, autoCreateAssets?: boolean) => LogisticsReceivingRecord;

  updateSettings: (newSettings: Partial<OrganizationSettings>) => void;
  bulkImportAssets: (newAssets: AssetItem[]) => void;
  loadAIIAPUpsFleet: () => void;
  exportDatabaseJson: () => void;
  importDatabaseJson: (jsonString: string) => boolean;
  resetToDefaultData: () => void;
  addAuditLog: (action: string, details: string, assetId?: string, type?: 'info' | 'warning' | 'danger' | 'success') => void;

  // Utility Getters
  getAssetById: (id: string) => AssetItem | undefined;
  allDepartments: Department[];
  addDepartment: (deptName: string) => boolean;
  allBrands: string[];
  addBrand: (brandName: string) => boolean;
  allVendors: string[];
  addVendor: (vendorName: string) => boolean;
  allCategories: string[];
  addCategory: (catName: string) => boolean;
}

const LOCAL_STORAGE_KEY = 'paa_sentinel_v5_data';

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

export const allPaaDepartments: Department[] = [
  'Fire',
  'Cargo',
  'CTO',
  'CNS',
  'HR',
  'Medical',
  'IT',
  'APM',
  'DYAPM',
  'ENM',
  'Works',
  'Estate',
  'Commercial',
  'Flight Inquiry',
  'APS',
  'RD Block',
  'Radar',
  'NavAid',
  'Supply',
  'Accounts',
  'Finance',
  'Security',
  'Administration',
  'Engineering',
  'Operations',
  'Data Center',
];

export const allPaaBrands: string[] = [
  'Dell',
  'HP',
  'Cisco',
  'Lenovo',
  'Fortinet',
  'APC Schneider Electric',
  'Schneider Electric',
  'EATON',
  'Corning',
  'Panduit',
  'CommScope / AMP',
  'D-Link',
  'Hikvision',
  'Fujitsu',
  'Zebra',
  'Epson',
  'Canon',
  'Kyocera',
  'Ubiquiti',
  'MikroTik',
  'Apple',
  'Panasonic',
];

export const allPaaVendors: string[] = [
  'Dell Technologies Pakistan',
  'HP Inc. Pakistan',
  'Cisco Systems / Wateen Telecom',
  'Fujitsu Pakistan',
  'Fortinet / Premier Systems',
  'Schneider Electric / APC Pakistan',
  'Lenovo Official Pakistan',
  'Zebra Technologies / Barcode Solutions',
  'M/S Airport Tech Solutions',
  'Siemens Pakistan',
  'Global Telecom Systems',
  'National IT Services',
];

export const allPaaCategories: string[] = [
  'Desktop PC',
  'Laptop',
  'Printer',
  'Scanner',
  'Keyboard',
  'Mouse',
  'Keyboard & Mouse',
  'Network Switch',
  'Core Switch',
  'Distribution Switch',
  'Access Switch',
  'Hub',
  'Router',
  'Firewall',
  'Access Point',
  'Server',
  'UPS',
  'Rack',
  'Patch Panel',
  'Fiber Patch Cord',
  'UTP Patch Cord / Network Cable',
  'Network Cable',
  'IP Phone',
  'Monitor',
  'NAS Storage',
  'Other',
];

function deduplicateItems<T>(items: T[], getKey: (item: T) => string): T[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = getKey(item);
    if (!key) return true;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export const defaultRolePasswords: RolePasswords = {
  Administrator: 'admin123',
  Technician: 'tech123',
  Viewer: 'viewer123',
};

export const InventoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [assets, setAssets] = useState<AssetItem[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_assets`);
    let initial: AssetItem[] = saved ? JSON.parse(saved) : initialAssets;
    const existingTags = new Set(initial.map((a) => a.assetTag?.toLowerCase()));
    const missingUps = initialAIIAPUpsAssets.filter((a) => !existingTags.has(a.assetTag?.toLowerCase()));
    if (missingUps.length > 0) {
      initial = [...initial, ...missingUps];
    }
    return deduplicateItems<AssetItem>(initial, (a) => a.id);
  });

  const [tickets, setTickets] = useState<IssueTicket[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_tickets`);
    const initial: IssueTicket[] = saved ? JSON.parse(saved) : initialTickets;
    return deduplicateItems<IssueTicket>(initial, (t) => t.ticketNumber);
  });

  const [maintenanceRecords, setMaintenanceRecords] = useState<MaintenanceRecord[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_maintenance`);
    const initial: MaintenanceRecord[] = saved ? JSON.parse(saved) : initialMaintenanceRecords;
    return deduplicateItems<MaintenanceRecord>(initial, (m) => m.id);
  });

  const [tonerIssueRecords, setTonerIssueRecords] = useState<TonerIssueRecord[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_toner_issues`);
    const initial: TonerIssueRecord[] = saved ? JSON.parse(saved) : initialTonerIssueRecords;
    return deduplicateItems<TonerIssueRecord>(initial, (tr) => tr.id);
  });

  const [gatePassRecords, setGatePassRecords] = useState<GatePassRecord[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_gate_passes`);
    const initial: GatePassRecord[] = saved ? JSON.parse(saved) : initialGatePassRecords;
    return deduplicateItems<GatePassRecord>(initial, (gp) => gp.id);
  });

  const [logisticsReceivingRecords, setLogisticsReceivingRecords] = useState<LogisticsReceivingRecord[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_receiving_records`);
    const initial: LogisticsReceivingRecord[] = saved ? JSON.parse(saved) : initialLogisticsReceivingRecords;
    return deduplicateItems<LogisticsReceivingRecord>(initial, (rc) => rc.id);
  });

  const [upsMaintenanceRecords, setUpsMaintenanceRecords] = useState<UPSMaintenanceRecord[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_ups_maintenance`);
    const initial: UPSMaintenanceRecord[] = saved ? JSON.parse(saved) : initialUPSMaintenanceRecords;
    return deduplicateItems<UPSMaintenanceRecord>(initial, (u) => u.id);
  });

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_logs`);
    return saved ? JSON.parse(saved) : initialAuditLogs;
  });

  const [facilities, setFacilities] = useState<AirportFacility[]>(initialFacilities);

  const [settings, setSettings] = useState<OrganizationSettings>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_settings`);
    return saved ? JSON.parse(saved) : initialSettings;
  });

  // DB Status state
  const [dbStatus, setDbStatus] = useState<DbStatusInfo>({
    isConnected: false,
    dbName: 'paa_sentinel',
    host: '127.0.0.1',
    port: 27017,
    uriUsed: 'mongodb://127.0.0.1:27017/paa_sentinel',
  });
  const [isSyncing, setIsSyncing] = useState(false);

  const [departments, setDepartments] = useState<Department[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_departments`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {
        console.error('Error parsing saved departments', e);
      }
    }
    return allPaaDepartments;
  });

  const [brands, setBrands] = useState<string[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_brands`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return Array.from(new Set([...allPaaBrands, ...parsed]));
        }
      } catch (e) {
        console.error('Error parsing saved brands', e);
      }
    }
    return allPaaBrands;
  });

  const [vendors, setVendors] = useState<string[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_vendors`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {
        console.error('Error parsing saved vendors', e);
      }
    }
    return allPaaVendors;
  });

  const [categories, setCategories] = useState<string[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_categories`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return Array.from(new Set([...allPaaCategories, ...parsed]));
        }
      } catch (e) {
        console.error('Error parsing saved categories', e);
      }
    }
    return allPaaCategories;
  });

  const [rolePasswords, setRolePasswords] = useState<RolePasswords>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_role_passwords`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          return {
            Administrator: parsed.Administrator || 'admin123',
            Technician: parsed.Technician || 'tech123',
            Viewer: parsed.Viewer || 'viewer123',
          };
        }
      } catch (e) {
        console.error('Error parsing saved role passwords', e);
      }
    }
    return defaultRolePasswords;
  });

  const [userRole, setUserRole] = useState<UserRole>('Administrator');
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_is_logged_in`);
    return saved !== null ? JSON.parse(saved) : true;
  });

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_is_logged_in`, JSON.stringify(isLoggedIn));
  }, [isLoggedIn]);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('ALL');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_departments`, JSON.stringify(departments));
  }, [departments]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_brands`, JSON.stringify(brands));
  }, [brands]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_vendors`, JSON.stringify(vendors));
  }, [vendors]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_categories`, JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_role_passwords`, JSON.stringify(rolePasswords));
  }, [rolePasswords]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_assets`, JSON.stringify(assets));
  }, [assets]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_tickets`, JSON.stringify(tickets));
  }, [tickets]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_maintenance`, JSON.stringify(maintenanceRecords));
  }, [maintenanceRecords]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_toner_issues`, JSON.stringify(tonerIssueRecords));
  }, [tonerIssueRecords]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_gate_passes`, JSON.stringify(gatePassRecords));
  }, [gatePassRecords]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_receiving_records`, JSON.stringify(logisticsReceivingRecords));
  }, [logisticsReceivingRecords]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_ups_maintenance`, JSON.stringify(upsMaintenanceRecords));
  }, [upsMaintenanceRecords]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_logs`, JSON.stringify(auditLogs));
  }, [auditLogs]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_settings`, JSON.stringify(settings));
    if (settings.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings]);

  // Connect & Sync from MongoDB Backend API
  const refreshDbData = useCallback(async () => {
    try {
      setIsSyncing(true);
      const res = await fetch('/api/db/status');
      if (res.ok) {
        const statusData = await res.json();
        setDbStatus(statusData);

        if (statusData.isConnected) {
          const syncRes = await fetch('/api/sync/all');
          if (syncRes.ok) {
            const syncJson = await syncRes.json();
            if (syncJson.success && syncJson.data) {
              const { data } = syncJson;
              if (data.assets && data.assets.length > 0) setAssets(deduplicateItems(data.assets, (a: AssetItem) => a.id));
              if (data.tickets && data.tickets.length > 0) setTickets(deduplicateItems(data.tickets, (t: IssueTicket) => t.ticketNumber));
              if (data.maintenanceRecords && data.maintenanceRecords.length > 0) setMaintenanceRecords(deduplicateItems(data.maintenanceRecords, (m: MaintenanceRecord) => m.id));
              if (data.upsMaintenanceRecords && data.upsMaintenanceRecords.length > 0) setUpsMaintenanceRecords(deduplicateItems(data.upsMaintenanceRecords, (u: UPSMaintenanceRecord) => u.id));
              if (data.logisticsReceivingRecords && data.logisticsReceivingRecords.length > 0) setLogisticsReceivingRecords(deduplicateItems(data.logisticsReceivingRecords, (l: LogisticsReceivingRecord) => l.id));
              if (data.tonerIssueRecords && data.tonerIssueRecords.length > 0) setTonerIssueRecords(deduplicateItems(data.tonerIssueRecords, (tr: TonerIssueRecord) => tr.id));
              if (data.gatePassRecords && data.gatePassRecords.length > 0) setGatePassRecords(deduplicateItems(data.gatePassRecords, (gp: GatePassRecord) => gp.id));
              if (data.auditLogs && data.auditLogs.length > 0) setAuditLogs(data.auditLogs);
              if (data.facilities && data.facilities.length > 0) setFacilities(data.facilities);
              if (data.settings && data.settings.orgName) setSettings(data.settings);
            }
          }
        }
      }
    } catch (err) {
      // Backend not running or in offline SPA mode - fallback to localStorage gracefully
      console.log('MongoDB server sync note:', err);
    } finally {
      setIsSyncing(false);
    }
  }, []);

  useEffect(() => {
    refreshDbData();
    const interval = setInterval(refreshDbData, 30000); // periodically refresh status
    return () => clearInterval(interval);
  }, [refreshDbData]);

  const addAuditLog = (action: string, details: string, assetId?: string, type: AuditLog['type'] = 'info') => {
    const newLog: AuditLog = {
      id: `LOG-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
      timestamp: new Date().toLocaleString('en-US', { timeZoneName: 'short' }),
      actor: `${userRole} User`,
      action,
      assetId,
      details,
      type,
    };
    setAuditLogs((prev) => [newLog, ...prev]);

    // Async sync to Mongo
    fetch('/api/audit-logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newLog),
    }).catch(() => {});
  };

  const toggleTheme = () => {
    setSettings((prev) => ({
      ...prev,
      theme: prev.theme === 'dark' ? 'light' : 'dark',
    }));
  };

  const addAsset = (assetData: Partial<AssetItem>): AssetItem => {
    const nextNum = 10000 + assets.length + 1;
    const newId = `PAA-AST-${nextNum}`;
    const barcode = `${nextNum}${Math.floor(100000 + Math.random() * 900000)}`;
    const qrCode = `${newId}|${assetData.name || 'Device'}|${assetData.department || 'IT'}`;

    const newAsset: AssetItem = {
      id: newId,
      barcode,
      qrCode,
      name: assetData.name || 'New IT Asset',
      category: assetData.category || 'Desktop PC',
      department: assetData.department || 'IT',
      assignedUser: assetData.assignedUser || 'Unassigned Store',
      paaNumber: assetData.paaNumber || `PAA/HQ/IT/2026/${Math.floor(100 + Math.random() * 900)}`,
      location: assetData.location || { building: 'PAA Main Terminal', floor: '1st Floor', room: 'Store Room' },
      vendorCompany: assetData.vendorCompany || 'Vendor Partner',
      brand: assetData.brand || 'Generic',
      model: assetData.model || 'Standard Model',
      serialNumber: assetData.serialNumber || `SN-${Math.floor(100000 + Math.random() * 900000)}`,
      assetTag: assetData.assetTag || `TAG-${nextNum}`,
      purchaseDate: assetData.purchaseDate || new Date().toISOString().split('T')[0],
      warrantyExpiry: assetData.warrantyExpiry || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000 * 3).toISOString().split('T')[0],
      status: assetData.status || 'Active',
      isRemoved: false,
      images: assetData.images || { devicePhoto: 'https://images.unsplash.com/photo-1587831990711-23ca6441447b?auto=format&fit=crop&w=600&q=80' },
      systemSpecs: assetData.systemSpecs,
      printerSpecs: assetData.printerSpecs,
      scannerSpecs: assetData.scannerSpecs,
      networkSpecs: assetData.networkSpecs,
      pingStatus: 'Online',
      uptime: '1 day',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setAssets((prev) => [newAsset, ...prev]);

    // Persist to MongoDB API
    fetch('/api/assets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newAsset),
    }).catch(() => {});

    addAuditLog('Asset Created', `Asset ${newAsset.id} (${newAsset.name}) registered in ${newAsset.department}`, newAsset.id, 'success');
    return newAsset;
  };

  const updateAsset = (id: string, assetData: Partial<AssetItem>) => {
    setAssets((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const updated = {
            ...item,
            ...assetData,
            updatedAt: new Date().toISOString(),
          };
          return updated;
        }
        return item;
      })
    );

    // Sync to Mongo
    fetch(`/api/assets/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(assetData),
    }).catch(() => {});

    addAuditLog('Asset Updated', `Asset ${id} details updated in system`, id, 'info');
  };

  const softRemoveAsset = (id: string, reason: RemovalReason, removedBy: string, remarks: string) => {
    const removalDetails = {
      reason,
      removedBy,
      date: new Date().toISOString().split('T')[0],
      remarks,
    };

    setAssets((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              isRemoved: true,
              status: reason === 'Scrap' ? 'Scrap' : reason === 'Lost' ? 'Lost' : 'Faulty',
              removalDetails,
              updatedAt: new Date().toISOString(),
            }
          : item
      )
    );

    fetch(`/api/assets/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isRemoved: true, status: reason, removalDetails }),
    }).catch(() => {});

    addAuditLog('Asset Archived/Removed', `Asset ${id} marked as removed (${reason}) by ${removedBy}. Reason: ${remarks}`, id, 'warning');
  };

  const restoreAsset = (id: string) => {
    setAssets((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              isRemoved: false,
              status: 'Spare',
              removalDetails: undefined,
              updatedAt: new Date().toISOString(),
            }
          : item
      )
    );

    fetch(`/api/assets/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isRemoved: false, status: 'Spare', removalDetails: null }),
    }).catch(() => {});

    addAuditLog('Asset Restored', `Asset ${id} restored from archive to active/spare inventory`, id, 'success');
  };

  const deletePermanently = (id: string) => {
    setAssets((prev) => prev.filter((item) => item.id !== id));
    fetch(`/api/assets/${id}`, { method: 'DELETE' }).catch(() => {});
    addAuditLog('Asset Permanently Deleted', `Asset ${id} permanently removed from database`, id, 'danger');
  };

  const addTicket = (ticketData: Omit<IssueTicket, 'ticketNumber'>) => {
    const num = Math.floor(8822 + tickets.length + 1);
    const ticketNumber = `PAA-TCK-${num}`;
    const newTicket: IssueTicket = {
      ...ticketData,
      ticketNumber,
    };
    setTickets((prev) => [newTicket, ...prev]);
    addAuditLog('Ticket Created', `Support Ticket ${ticketNumber} raised for asset ${ticketData.assetId} (${ticketData.priority} Priority)`, ticketData.assetId, 'warning');
  };

  const updateTicketStatus = (ticketNumber: string, status: IssueTicket['status'], resolution?: string, closedDate?: string) => {
    setTickets((prev) =>
      prev.map((t) =>
        t.ticketNumber === ticketNumber
          ? {
              ...t,
              status,
              resolution: resolution ?? t.resolution,
              closedDate: closedDate ?? (status === 'Closed' ? new Date().toISOString().split('T')[0] : t.closedDate),
            }
          : t
      )
    );
    addAuditLog('Ticket Status Updated', `Ticket ${ticketNumber} marked as ${status}`, undefined, status === 'Closed' ? 'success' : 'info');
  };

  const addMaintenanceRecord = (recordData: Omit<MaintenanceRecord, 'id'>) => {
    const num = maintenanceRecords.length + 1;
    const newRecord: MaintenanceRecord = {
      ...recordData,
      id: `MNT-2026-${num < 10 ? '00' + num : num < 100 ? '0' + num : num}`,
    };
    setMaintenanceRecords((prev) => [newRecord, ...prev]);

    fetch('/api/maintenance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newRecord),
    }).catch(() => {});

    addAuditLog('Maintenance Logged', `Maintenance service logged for ${recordData.deviceName} (Cost: PKR ${recordData.cost.toLocaleString()})`, recordData.assetId, 'info');
  };

  const addTonerIssueRecord = (recordData: Omit<TonerIssueRecord, 'id'>, updatePrinterLevel = true) => {
    const num = tonerIssueRecords.length + 1001;
    const newRecord: TonerIssueRecord = {
      ...recordData,
      id: `PAA-TNR-${num}`,
    };

    setTonerIssueRecords((prev) => [newRecord, ...prev]);

    if (recordData.assetId && updatePrinterLevel) {
      setAssets((prev) =>
        prev.map((a) => {
          if (a.id === recordData.assetId && a.category === 'Printer' && a.printerSpecs) {
            return {
              ...a,
              printerSpecs: {
                ...a.printerSpecs,
                tonerLevel: 100,
              },
              updatedAt: new Date().toISOString(),
            };
          }
          return a;
        })
      );
    }

    fetch('/api/toner', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...newRecord, updatePrinterLevel }),
    }).catch(() => {});

    addAuditLog(
      'Toner Cartridge Issued',
      `Issued ${recordData.quantity}x ${recordData.tonerModel} cartridge to ${recordData.department} Dept on ${recordData.issuedDate} (Recipient: ${recordData.recipientUser || 'Staff'}).`,
      recordData.assetId,
      'success'
    );
  };

  const addGatePassRecord = (recordData: Omit<GatePassRecord, 'id'>) => {
    const num = gatePassRecords.length + 1;
    const year = new Date().getFullYear();
    const newRecord: GatePassRecord = {
      ...recordData,
      id: `PAA-GP-${year}-${String(num).padStart(3, '0')}`,
    };

    setGatePassRecords((prev) => [newRecord, ...prev]);

    if (recordData.assetId) {
      setAssets((prev) =>
        prev.map((a) => {
          if (a.id === recordData.assetId) {
            return {
              ...a,
              status: recordData.gatePassType.includes('Returnable') ? 'Under Repair' : 'Scrap',
              updatedAt: new Date().toISOString(),
            };
          }
          return a;
        })
      );
    }

    fetch('/api/gatepasses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newRecord),
    }).catch(() => {});

    addAuditLog(
      'Gate Pass Issued',
      `Issued ${recordData.gatePassType} Gate Pass (${newRecord.id}) for "${recordData.equipmentName}" to Market Workshop "${recordData.vendorMarketWorkshop}".`,
      recordData.assetId,
      'warning'
    );
  };

  const updateGatePassStatus = (
    id: string,
    status: GatePassRecord['status'],
    actualReturnDate?: string,
    securityCleared?: string
  ) => {
    setGatePassRecords((prev) =>
      prev.map((gp) => {
        if (gp.id === id) {
          const updated: GatePassRecord = {
            ...gp,
            status,
            actualReturnDate: actualReturnDate || gp.actualReturnDate,
            securityClearedBy: securityCleared || gp.securityClearedBy,
          };

          if (status === 'Returned & Repaired' && gp.assetId) {
            setAssets((assetsPrev) =>
              assetsPrev.map((a) =>
                a.id === gp.assetId ? { ...a, status: 'Active', updatedAt: new Date().toISOString() } : a
              )
            );
          }

          return updated;
        }
        return gp;
      })
    );

    fetch(`/api/gatepasses/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, actualReturnDate, securityClearedBy: securityCleared }),
    }).catch(() => {});

    addAuditLog('Gate Pass Status Updated', `Gate Pass ${id} status updated to: ${status}`, undefined, 'info');
  };

  const addLogisticsReceivingRecord = (
    recordData: Omit<LogisticsReceivingRecord, 'id' | 'createdAt'>,
    autoCreateAssets = true
  ): LogisticsReceivingRecord => {
    const num = logisticsReceivingRecords.length + 1;
    const year = new Date().getFullYear();
    const newRecordId = `PAA-RCV-${year}-${String(num).padStart(3, '0')}`;

    const createdAssetIds: string[] = [];

    if (autoCreateAssets && recordData.quantity > 0) {
      const newAssetsBatch: AssetItem[] = [];
      const currentAssetCount = assets.length;

      for (let i = 0; i < recordData.quantity; i++) {
        const assetNum = 10000 + currentAssetCount + i + 1;
        const newAssetId = `PAA-AST-${assetNum}`;
        createdAssetIds.push(newAssetId);

        const customSn = recordData.serialNumbers && recordData.serialNumbers[i] && recordData.serialNumbers[i].trim() !== ''
          ? recordData.serialNumbers[i].trim()
          : `SN-${(recordData.brand || 'PAA').slice(0, 3).toUpperCase()}-${Math.floor(100000 + Math.random() * 900000)}`;

        const barcode = `${assetNum}${Math.floor(100000 + Math.random() * 900000)}`;
        const qrCode = `${newAssetId}|${recordData.brand} ${recordData.model}|${recordData.department}`;

        const newAsset: AssetItem = {
          id: newAssetId,
          barcode,
          qrCode,
          name: `${recordData.brand} ${recordData.model}`,
          category: recordData.category,
          department: recordData.department || 'IT',
          assignedUser: `IT Store (${recordData.receivingPersonName || 'Store Incharge'})`,
          paaNumber: recordData.logisticsSupplyRefNo || `PAA/HQ/IT/${year}/${Math.floor(100 + Math.random() * 900)}`,
          location: {
            building: recordData.storeLocation || 'IT Central Main Store',
            floor: 'Ground Floor',
            room: 'Logistics Receiving Room',
          },
          vendorCompany: recordData.localSupplyRefNo ? `Supply LPO (${recordData.localSupplyRefNo})` : 'HQCAA Supply Directorate',
          brand: recordData.brand,
          model: recordData.model,
          serialNumber: customSn,
          assetTag: `TAG-HQCAA-${Math.floor(1000 + Math.random() * 9000)}`,
          purchaseDate: recordData.receivedDate || new Date().toISOString().split('T')[0],
          warrantyExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000 * 3).toISOString().split('T')[0],
          status: 'Spare',
          isRemoved: false,
          images: { devicePhoto: 'https://images.unsplash.com/photo-1587831990711-23ca6441447b?auto=format&fit=crop&w=600&q=80' },
          systemSpecs: { processor: recordData.specifications },
          pingStatus: 'Online',
          uptime: '1 day',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        newAssetsBatch.push(newAsset);
      }

      setAssets((prev) => [...newAssetsBatch, ...prev]);

      fetch('/api/assets/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assets: newAssetsBatch }),
      }).catch(() => {});
    }

    const finalRecord: LogisticsReceivingRecord = {
      ...recordData,
      id: newRecordId,
      generatedAssetIds: createdAssetIds.length > 0 ? createdAssetIds : recordData.generatedAssetIds,
      createdAt: new Date().toISOString(),
    };

    setLogisticsReceivingRecords((prev) => [finalRecord, ...prev]);

    fetch('/api/logistics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(finalRecord),
    }).catch(() => {});

    addAuditLog(
      'Logistics Item Received',
      `Received ${recordData.quantity}x ${recordData.brand} ${recordData.model} from Supply HQCAA (${recordData.logisticsSupplyRefNo}). Created ${createdAssetIds.length} inventory asset record(s). Store: ${recordData.storeLocation}.`,
      createdAssetIds[0],
      'success'
    );

    return finalRecord;
  };

  const addUPSMaintenanceRecord = (
    recordData: Omit<UPSMaintenanceRecord, 'id' | 'createdAt'>,
    updateAssetSpecs: boolean = true
  ): UPSMaintenanceRecord => {
    const num = upsMaintenanceRecords.length + 1;
    const newRecordId = `PAA-UPS-MNT-2026-${num < 10 ? '00' + num : num < 100 ? '0' + num : num}`;
    const newRecord: UPSMaintenanceRecord = {
      ...recordData,
      id: newRecordId,
      createdAt: new Date().toISOString(),
    };

    setUpsMaintenanceRecords((prev) => [newRecord, ...prev]);

    // Also mirror to generic maintenance records
    const genericMntId = `MNT-2026-U${num < 10 ? '00' + num : num < 100 ? '0' + num : num}`;
    const genericRecord: MaintenanceRecord = {
      id: genericMntId,
      assetId: recordData.assetId,
      deviceName: recordData.upsName,
      date: recordData.maintenanceDate,
      engineer: recordData.engineer,
      description: `[UPS ${recordData.maintenanceType}] ${recordData.description}`,
      partsReplaced: `${recordData.noOfBatteries}x Batteries (${recordData.batteryBrandType || 'VRLA'})`,
      cost: recordData.cost || 0,
      remarks: `Voltage: ${recordData.voltage} | Backup: ${recordData.backupTime} | Next Due: ${recordData.nextBatteryChangeDate || 'N/A'}`,
    };
    setMaintenanceRecords((prev) => [genericRecord, ...prev]);

    if (updateAssetSpecs && recordData.assetId) {
      setAssets((prev) =>
        prev.map((a) => {
          if (a.id === recordData.assetId) {
            const isWarning = recordData.batteryCondition.includes('Weak') || recordData.batteryCondition.includes('Defective');
            return {
              ...a,
              lastMaintenanceDate: recordData.maintenanceDate,
              pingStatus: isWarning ? 'Warning' : 'Online',
              upsSpecs: {
                ...(a.upsSpecs || {
                  modelNo: recordData.modelNo,
                }),
                modelNo: recordData.modelNo || a.upsSpecs?.modelNo || a.model,
                voltage: recordData.voltage || a.upsSpecs?.voltage,
                roomNo: recordData.roomNo || a.upsSpecs?.roomNo || a.location?.room,
                locationDetails: recordData.location || a.upsSpecs?.locationDetails,
                backupTime: recordData.backupTime || a.upsSpecs?.backupTime,
                noOfBatteries: recordData.noOfBatteries || a.upsSpecs?.noOfBatteries,
                batteryType: recordData.batteryBrandType || a.upsSpecs?.batteryType,
                lastBatteryChangeDate: recordData.batteryChangeDate,
                nextBatteryChangeDate: recordData.nextBatteryChangeDate,
                batteryHealthPercent: recordData.batteryCondition.includes('Optimal')
                  ? 100
                  : recordData.batteryCondition.includes('Good')
                  ? 85
                  : recordData.batteryCondition.includes('Fair')
                  ? 65
                  : recordData.batteryCondition.includes('Weak')
                  ? 35
                  : 10,
                loadPercentage: recordData.loadPercentage ?? a.upsSpecs?.loadPercentage,
              },
              updatedAt: new Date().toISOString(),
            };
          }
          return a;
        })
      );
    }

    fetch('/api/ups-maintenance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newRecord),
    }).catch(() => {});

    addAuditLog(
      'UPS Maintenance & Battery Logged',
      `UPS Service/Battery replacement logged for ${recordData.upsName} (${recordData.modelNo}) - ${recordData.noOfBatteries} batteries, Backup: ${recordData.backupTime}`,
      recordData.assetId,
      'success'
    );

    return newRecord;
  };

  const updateUPSMaintenanceRecord = (id: string, updates: Partial<UPSMaintenanceRecord>) => {
    setUpsMaintenanceRecords((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ...updates } : r))
    );
    addAuditLog('UPS Maintenance Record Updated', `UPS Maintenance Record ${id} updated`, undefined, 'info');
  };

  const updateSettings = (newSettings: Partial<OrganizationSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
    addAuditLog('Settings Updated', 'Organization system configurations updated', undefined, 'info');
  };

  const bulkImportAssets = (importedAssets: AssetItem[]) => {
    setAssets((prev) => deduplicateItems([...importedAssets, ...prev], (a) => a.id));
    fetch('/api/assets/bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ assets: importedAssets }),
    }).catch(() => {});
    addAuditLog('Bulk Import', `Imported ${importedAssets.length} assets from Excel spreadsheet into database`, undefined, 'success');
  };

  const loadAIIAPUpsFleet = () => {
    setAssets((prev) => {
      const existingTags = new Set(prev.map((a) => a.assetTag?.toLowerCase()));
      const toAdd = initialAIIAPUpsAssets.filter((a) => !existingTags.has(a.assetTag?.toLowerCase()));
      if (toAdd.length === 0) return prev;
      return deduplicateItems<AssetItem>([...prev, ...toAdd], (a) => a.id);
    });
    addAuditLog('AIIAP UPS Fleet Loaded', 'Synchronized 20-unit AIIAP UPS & Rack equipment list with kVA details', undefined, 'success');
  };

  const exportDatabaseJson = () => {
    const fullBackup = {
      exportTimestamp: new Date().toISOString(),
      version: '5.0',
      database: dbStatus.isConnected ? 'MongoDB (Local Server)' : 'Local Cache',
      settings,
      assets,
      tickets,
      maintenanceRecords,
      logisticsReceivingRecords,
      tonerIssueRecords,
      gatePassRecords,
      auditLogs,
    };
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(fullBackup, null, 2));
    const downloadAnchor = document.createElement('a');
    const fileName = `PAA_Sentinel_MongoDB_Backup_${new Date().toISOString().slice(0, 10)}.json`;
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', fileName);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    const timestampStr = new Date().toLocaleString();
    setSettings((prev) => ({ ...prev, lastBackupDate: timestampStr }));
    addAuditLog('Database Backup', `Full JSON database backup downloaded (${fileName})`, undefined, 'success');
  };

  const importDatabaseJson = (jsonString: string): boolean => {
    try {
      const parsed = JSON.parse(jsonString);
      if (parsed.assets && Array.isArray(parsed.assets)) {
        setAssets(deduplicateItems<AssetItem>(parsed.assets, (a) => a.id));
        if (parsed.tickets) setTickets(deduplicateItems<IssueTicket>(parsed.tickets, (t) => t.ticketNumber));
        if (parsed.maintenanceRecords) setMaintenanceRecords(deduplicateItems<MaintenanceRecord>(parsed.maintenanceRecords, (m) => m.id));
        if (parsed.logisticsReceivingRecords) setLogisticsReceivingRecords(deduplicateItems<LogisticsReceivingRecord>(parsed.logisticsReceivingRecords, (l) => l.id));
        if (parsed.tonerIssueRecords) setTonerIssueRecords(deduplicateItems<TonerIssueRecord>(parsed.tonerIssueRecords, (t) => t.id));
        if (parsed.gatePassRecords) setGatePassRecords(deduplicateItems<GatePassRecord>(parsed.gatePassRecords, (g) => g.id));
        if (parsed.auditLogs) setAuditLogs(parsed.auditLogs);
        if (parsed.settings) setSettings(parsed.settings);

        // Sync to MongoDB backend
        fetch('/api/assets/bulk', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ assets: parsed.assets }),
        }).catch(() => {});

        addAuditLog('Database Restored', 'System state successfully restored from JSON backup file', undefined, 'warning');
        return true;
      }
      return false;
    } catch (e) {
      console.error('Error importing JSON:', e);
      return false;
    }
  };

  const resetToDefaultData = () => {
    setAssets(deduplicateItems(initialAssets, (a) => a.id));
    setTickets(deduplicateItems(initialTickets, (t) => t.ticketNumber));
    setMaintenanceRecords(deduplicateItems(initialMaintenanceRecords, (m) => m.id));
    setLogisticsReceivingRecords(deduplicateItems(initialLogisticsReceivingRecords, (l) => l.id));
    setTonerIssueRecords(deduplicateItems(initialTonerIssueRecords, (tr) => tr.id));
    setGatePassRecords(deduplicateItems(initialGatePassRecords, (gp) => gp.id));
    setAuditLogs(initialAuditLogs);
    setSettings(initialSettings);

    fetch('/api/seed/reset', { method: 'POST' }).catch(() => {});

    addAuditLog('System Reset', 'All inventory records reset to factory default seed dataset', undefined, 'danger');
  };

  const addDepartment = (deptName: string): boolean => {
    const trimmed = deptName.trim();
    if (!trimmed) return false;
    const exists = departments.some((d) => d.toLowerCase() === trimmed.toLowerCase());
    if (exists) return false;

    setDepartments((prev) => [...prev, trimmed]);
    addAuditLog('Department Added', `New department "${trimmed}" registered in organizational directory`, undefined, 'success');
    return true;
  };

  const addBrand = (brandName: string): boolean => {
    const trimmed = brandName.trim();
    if (!trimmed) return false;
    const exists = brands.some((b) => b.toLowerCase() === trimmed.toLowerCase());
    if (exists) return false;

    setBrands((prev) => [...prev, trimmed]);
    addAuditLog('Brand Added', `New hardware brand "${trimmed}" registered in system directory`, undefined, 'success');
    return true;
  };

  const addVendor = (vendorName: string): boolean => {
    const trimmed = vendorName.trim();
    if (!trimmed) return false;
    const exists = vendors.some((v) => v.toLowerCase() === trimmed.toLowerCase());
    if (exists) return false;

    setVendors((prev) => [...prev, trimmed]);
    addAuditLog('Vendor Added', `New supplier vendor "${trimmed}" registered in vendor directory`, undefined, 'success');
    return true;
  };

  const addCategory = (catName: string): boolean => {
    const trimmed = catName.trim();
    if (!trimmed) return false;
    const exists = categories.some((c) => c.toLowerCase() === trimmed.toLowerCase());
    if (exists) return false;

    setCategories((prev) => [...prev, trimmed]);
    addAuditLog('Category Added', `New device category "${trimmed}" registered in system directory`, undefined, 'success');
    return true;
  };

  const updateRolePasswords = (newPasswords: Partial<RolePasswords>) => {
    setRolePasswords((prev) => {
      const updated = { ...prev, ...newPasswords };
      addAuditLog('Security Settings Updated', 'System access passwords for Administrator / Technician / Viewer roles were updated', undefined, 'warning');
      return updated;
    });
  };

  const verifyRolePassword = (role: UserRole, inputPass: string): boolean => {
    const expected = rolePasswords[role] || defaultRolePasswords[role];
    return inputPass.trim() === expected.trim();
  };

  const switchRoleWithPassword = (role: UserRole, inputPass: string): { success: boolean; message: string } => {
    const isValid = verifyRolePassword(role, inputPass);
    if (!isValid) {
      return { success: false, message: `Invalid security password for ${role} role access.` };
    }
    setUserRole(role);
    setIsLoggedIn(true);
    addAuditLog('User Role Switched', `Authenticated and switched active session role to ${role}`, undefined, 'info');
    return { success: true, message: `Successfully authenticated as ${role}` };
  };

  const login = (role: UserRole, inputPass: string): { success: boolean; message: string } => {
    const result = switchRoleWithPassword(role, inputPass);
    if (result.success) {
      setIsLoggedIn(true);
      addAuditLog('User Logged In', `User logged in successfully as ${role}`, undefined, 'success');
    }
    return result;
  };

  const logout = () => {
    setIsLoggedIn(false);
    setUserRole('Viewer');
    addAuditLog('User Logged Out', `Active session ended. User logged out.`, undefined, 'warning');
  };

  const getAssetById = (id: string) => {
    return assets.find((a) => a.id === id);
  };

  return (
    <InventoryContext.Provider
      value={{
        assets,
        tickets,
        maintenanceRecords,
        tonerIssueRecords,
        gatePassRecords,
        logisticsReceivingRecords,
        upsMaintenanceRecords,
        auditLogs,
        facilities,
        settings,
        userRole,
        isLoggedIn,
        login,
        logout,
        searchQuery,
        selectedDepartment,
        selectedCategory,
        selectedStatus,
        rolePasswords,
        updateRolePasswords,
        verifyRolePassword,
        switchRoleWithPassword,
        setUserRole,
        setSearchQuery,
        setSelectedDepartment,
        setSelectedCategory,
        setSelectedStatus,
        toggleTheme,
        addAsset,
        updateAsset,
        softRemoveAsset,
        restoreAsset,
        deletePermanently,
        addTicket,
        updateTicketStatus,
        addMaintenanceRecord,
        addUPSMaintenanceRecord,
        updateUPSMaintenanceRecord,
        addTonerIssueRecord,
        addGatePassRecord,
        updateGatePassStatus,
        addLogisticsReceivingRecord,
        updateSettings,
        bulkImportAssets,
        loadAIIAPUpsFleet,
        exportDatabaseJson,
        importDatabaseJson,
        resetToDefaultData,
        addAuditLog,
        getAssetById,
        allDepartments: departments,
        addDepartment,
        allBrands: brands,
        addBrand,
        allVendors: vendors,
        addVendor,
        allCategories: categories,
        addCategory,
        dbStatus,
        isSyncing,
        refreshDbData,
      }}
    >
      {children}
    </InventoryContext.Provider>
  );
};

export const useInventory = () => {
  const context = useContext(InventoryContext);
  if (!context) {
    throw new Error('useInventory must be used within an InventoryProvider');
  }
  return context;
};
