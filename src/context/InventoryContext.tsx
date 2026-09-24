import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import {
  AssetItem,
  IssueTicket,
  MaintenanceRecord,
  AuditLog,
  AirportFacility,
  OrganizationSettings,
  UserRole,
  UserAccount,
  RemovalReason,
  Department,
  TonerIssueRecord,
  GatePassRecord,
  LogisticsReceivingRecord,
  UPSMaintenanceRecord,
  LoginAttempt,
  UPSBackupChecklistLogSheet,
  UPSBatteryReplacementLogSheet,
  PrinterMaintenanceRecord,
  PrinterModelDefinition,
  TonerModelDefinition,
  PrinterPartItem,
} from '../types/inventory';
import {
  initialAssets,
  initialTickets,
  initialMaintenanceRecords,
  initialUPSMaintenanceRecords,
  initialAuditLogs,
  initialLoginAttempts,
  initialFacilities,
  initialSettings,
  initialTonerIssueRecords,
  initialGatePassRecords,
  initialLogisticsReceivingRecords,
} from '../data/mockData';
import { initialAIIAPUpsAssets } from '../data/aiiapUpsData';
import {
  defaultUPSBackupChecklistLogSheets,
  defaultUPSBatteryReplacementLogSheets,
} from '../data/upsFormsData';
import {
  initialPrinterCompanies,
  initialPrinterModels,
  initialTonerModels,
  initialPrinterParts,
  initialPrinterMaintenanceRecords,
} from '../data/printerMaintenanceData';
import {
  enqueueOfflineAction,
  processOfflineQueue,
  getOfflineQueue,
} from '../utils/offlineSync';
import {
  AssetBackupSnapshot,
  startBackgroundBackupService,
  saveAssetSnapshot,
  getBackupHistory,
  restoreBackup,
  deleteBackup,
  clearAllBackups,
  checkCrashRecovery,
  dismissCrashRecovery as dismissCrashRecoveryService,
  getBackupConfig,
  setBackupConfig,
} from '../services/assetBackupService';

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
  upsBackupChecklistLogSheets: UPSBackupChecklistLogSheet[];
  upsBatteryReplacementLogSheets: UPSBatteryReplacementLogSheet[];
  printerMaintenanceRecords: PrinterMaintenanceRecord[];
  printerModels: PrinterModelDefinition[];
  printerCompanies: string[];
  tonerModels: TonerModelDefinition[];
  printerParts: PrinterPartItem[];
  auditLogs: AuditLog[];
  facilities: AirportFacility[];
  settings: OrganizationSettings;
  userRole: UserRole;
  currentUser: UserAccount | null;
  userAccounts: UserAccount[];
  isLoggedIn: boolean;
  searchQuery: string;
  selectedDepartment: string;
  selectedCategory: string;
  selectedStatus: string;

  // MongoDB & Server Connection Status
  dbStatus: DbStatusInfo;
  isSyncing: boolean;
  refreshDbData: () => Promise<void>;

  // User Accounts & Security
  rolePasswords: RolePasswords;
  updateRolePasswords: (newPasswords: Partial<RolePasswords>) => void;
  verifyRolePassword: (role: UserRole, inputPass: string) => boolean;
  switchRoleWithPassword: (role: UserRole, inputPass: string) => { success: boolean; message: string };
  login: (usernameOrRole: string, inputPass: string) => { success: boolean; message: string; user?: UserAccount };
  logout: () => void;
  addUserAccount: (user: Omit<UserAccount, 'id'>) => { success: boolean; message: string };
  updateUserAccount: (id: string, updates: Partial<UserAccount>) => void;
  deleteUserAccount: (id: string) => { success: boolean; message: string };
  triggerPasswordResetEmail: (userId: string) => { success: boolean; message: string; resetToken: string; email: string };
  generateTemporaryBypassCode: (userId: string, durationMinutes?: number) => { success: boolean; code: string; expiresAt: string; message: string };
  revokeTemporaryBypassCode: (userId: string) => { success: boolean; message: string };
  resetUserPasswordWithToken: (userId: string, token: string, newPassword: string) => { success: boolean; message: string };
  loginAttempts: LoginAttempt[];
  recordLoginAttempt: (attempt: Omit<LoginAttempt, 'id' | 'timestamp'>) => void;
  clearLoginAttempts: () => void;

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
  addUPSBackupChecklistLogSheet: (sheet: Omit<UPSBackupChecklistLogSheet, 'id' | 'createdAt'>) => UPSBackupChecklistLogSheet;
  deleteUPSBackupChecklistLogSheet: (id: string) => void;
  addUPSBatteryReplacementLogSheet: (sheet: Omit<UPSBatteryReplacementLogSheet, 'id' | 'createdAt'>) => UPSBatteryReplacementLogSheet;
  deleteUPSBatteryReplacementLogSheet: (id: string) => void;

  addPrinterMaintenanceRecord: (record: Omit<PrinterMaintenanceRecord, 'id' | 'createdAt'>, updateAssetCondition?: boolean) => PrinterMaintenanceRecord;
  updatePrinterMaintenanceRecord: (id: string, updates: Partial<PrinterMaintenanceRecord>) => void;
  deletePrinterMaintenanceRecord: (id: string) => void;
  addPrinterModel: (model: Omit<PrinterModelDefinition, 'id'>) => PrinterModelDefinition;
  deletePrinterModel: (id: string) => void;
  addPrinterCompany: (company: string) => boolean;
  deletePrinterCompany: (company: string) => void;
  addTonerModel: (toner: Omit<TonerModelDefinition, 'id'>) => TonerModelDefinition;
  updateTonerModelStock: (id: string, newStock: number) => void;
  deleteTonerModel: (id: string) => void;
  addPrinterPart: (part: Omit<PrinterPartItem, 'id'>) => PrinterPartItem;
  updatePrinterPartStock: (id: string, newStock: number) => void;
  deletePrinterPart: (id: string) => void;

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

  // Offline Working & Data Sync
  isOnline: boolean;
  pendingOfflineCount: number;
  syncOfflineData: () => Promise<{ success: number; failed: number }>;

  // Background Crash Prevention & Browser Storage Backups
  lastBackupTime: string | null;
  lastBackupSnapshot: AssetBackupSnapshot | null;
  backupIntervalSeconds: number;
  isBackupServiceActive: boolean;
  backupHistory: AssetBackupSnapshot[];
  crashRecoveryInfo: { crashDetected: boolean; latestBackup: AssetBackupSnapshot | null; reason: string } | null;
  triggerManualBackup: (notes?: string) => Promise<AssetBackupSnapshot>;
  restoreAssetBackup: (backupId: string) => Promise<boolean>;
  deleteAssetBackup: (backupId: string) => Promise<void>;
  clearAllAssetBackups: () => Promise<void>;
  setBackupIntervalSeconds: (seconds: number) => void;
  dismissCrashRecovery: () => void;
  refreshBackupHistory: () => Promise<void>;
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

export const defaultUserAccounts: UserAccount[] = [
  {
    id: 'USR-MOHSIN',
    username: 'Mohsin',
    displayName: 'Mohsin (Technician)',
    role: 'Technician',
    password: '123',
    department: 'Hardware & Network Support',
    email: 'mohsin@paa.gov.pk',
    createdAt: '2026-09-15',
    isSystem: true,
  },
  {
    id: 'USR-KALSOOM',
    username: 'kalsoom',
    displayName: 'Kalsoom (Technician)',
    role: 'Technician',
    password: '123',
    department: 'Hardware & Network Support',
    email: 'kalsoom@paa.gov.pk',
    createdAt: '2026-09-15',
    isSystem: true,
  },
  {
    id: 'USR-ADMIN-PAA',
    username: 'admin_paa',
    displayName: 'PAA System Administrator',
    role: 'Administrator',
    password: 'admin123',
    department: 'IT Operations',
    email: 'admin@paa.gov.pk',
    createdAt: '2026-01-01',
    isSystem: true,
  },
  {
    id: 'USR-TECH-PAA',
    username: 'tech_paa',
    displayName: 'PAA IT Support Technician',
    role: 'Technician',
    password: 'tech123',
    department: 'Hardware Maintenance',
    email: 'tech@paa.gov.pk',
    createdAt: '2026-01-01',
    isSystem: true,
  },
  {
    id: 'USR-VIEWER-PAA',
    username: 'viewer_paa',
    displayName: 'PAA Read-Only Auditor',
    role: 'Viewer',
    password: 'viewer123',
    department: 'Internal Audit',
    email: 'auditor@paa.gov.pk',
    createdAt: '2026-01-01',
    isSystem: true,
  },
];

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

  const [upsBackupChecklistLogSheets, setUpsBackupChecklistLogSheets] = useState<UPSBackupChecklistLogSheet[]>(() => {
    try {
      const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_ups_backup_log_sheets`);
      const initial: UPSBackupChecklistLogSheet[] = saved ? JSON.parse(saved) : defaultUPSBackupChecklistLogSheets;
      return deduplicateItems<UPSBackupChecklistLogSheet>(initial, (s) => s.id);
    } catch {
      return defaultUPSBackupChecklistLogSheets;
    }
  });

  const [upsBatteryReplacementLogSheets, setUpsBatteryReplacementLogSheets] = useState<UPSBatteryReplacementLogSheet[]>(() => {
    try {
      const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_ups_battery_log_sheets`);
      const initial: UPSBatteryReplacementLogSheet[] = saved ? JSON.parse(saved) : defaultUPSBatteryReplacementLogSheets;
      return deduplicateItems<UPSBatteryReplacementLogSheet>(initial, (s) => s.id);
    } catch {
      return defaultUPSBatteryReplacementLogSheets;
    }
  });

  const [printerMaintenanceRecords, setPrinterMaintenanceRecords] = useState<PrinterMaintenanceRecord[]>(() => {
    try {
      const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_printer_maintenance`);
      return saved ? JSON.parse(saved) : initialPrinterMaintenanceRecords;
    } catch {
      return initialPrinterMaintenanceRecords;
    }
  });

  const [printerModels, setPrinterModels] = useState<PrinterModelDefinition[]>(() => {
    try {
      const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_printer_models`);
      return saved ? JSON.parse(saved) : initialPrinterModels;
    } catch {
      return initialPrinterModels;
    }
  });

  const [printerCompanies, setPrinterCompanies] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_printer_companies`);
      return saved ? JSON.parse(saved) : initialPrinterCompanies;
    } catch {
      return initialPrinterCompanies;
    }
  });

  const [tonerModels, setTonerModels] = useState<TonerModelDefinition[]>(() => {
    try {
      const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_toner_models`);
      return saved ? JSON.parse(saved) : initialTonerModels;
    } catch {
      return initialTonerModels;
    }
  });

  const [printerParts, setPrinterParts] = useState<PrinterPartItem[]>(() => {
    try {
      const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_printer_parts`);
      return saved ? JSON.parse(saved) : initialPrinterParts;
    } catch {
      return initialPrinterParts;
    }
  });

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_printer_maintenance`, JSON.stringify(printerMaintenanceRecords));
  }, [printerMaintenanceRecords]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_printer_models`, JSON.stringify(printerModels));
  }, [printerModels]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_printer_companies`, JSON.stringify(printerCompanies));
  }, [printerCompanies]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_toner_models`, JSON.stringify(tonerModels));
  }, [tonerModels]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_printer_parts`, JSON.stringify(printerParts));
  }, [printerParts]);

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_logs`);
    return saved ? JSON.parse(saved) : initialAuditLogs;
  });

  const [loginAttempts, setLoginAttempts] = useState<LoginAttempt[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_login_attempts`);
    return saved ? JSON.parse(saved) : initialLoginAttempts;
  });

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_login_attempts`, JSON.stringify(loginAttempts));
  }, [loginAttempts]);

  const recordLoginAttempt = (attempt: Omit<LoginAttempt, 'id' | 'timestamp'>) => {
    const newAttempt: LoginAttempt = {
      ...attempt,
      id: `LOG-ATT-${Date.now().toString().slice(-6)}`,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
    };
    setLoginAttempts((prev) => [newAttempt, ...prev]);
  };

  const clearLoginAttempts = () => {
    setLoginAttempts([]);
    addAuditLog('Login History Cleared', 'Administrator cleared login attempt history audit log', undefined, 'warning');
  };

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

  const [userAccounts, setUserAccounts] = useState<UserAccount[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_user_accounts`);
    let accounts: UserAccount[] = defaultUserAccounts;
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          accounts = parsed;
        }
      } catch (e) {
        console.error('Error parsing saved user accounts', e);
      }
    }

    // Guarantee Mohsin and kalsoom are registered as Technician (Write Data & View Data Only) with password 123
    const hasMohsin = accounts.some((u) => u.username.toLowerCase() === 'mohsin');
    if (!hasMohsin) {
      accounts = [
        {
          id: 'USR-MOHSIN',
          username: 'Mohsin',
          displayName: 'Mohsin (Technician)',
          role: 'Technician',
          password: '123',
          department: 'Hardware & Network Support',
          email: 'mohsin@paa.gov.pk',
          createdAt: '2026-09-15',
          isSystem: true,
        },
        ...accounts,
      ];
    } else {
      accounts = accounts.map((u) =>
        u.username.toLowerCase() === 'mohsin'
          ? {
              ...u,
              role: 'Technician' as UserRole,
              displayName: 'Mohsin (Technician)',
              department: 'Hardware & Network Support',
              password: u.password || '123',
            }
          : u
      );
    }

    const hasKalsoom = accounts.some((u) => u.username.toLowerCase() === 'kalsoom');
    if (!hasKalsoom) {
      accounts = [
        {
          id: 'USR-KALSOOM',
          username: 'kalsoom',
          displayName: 'Kalsoom (Technician)',
          role: 'Technician',
          password: '123',
          department: 'Hardware & Network Support',
          email: 'kalsoom@paa.gov.pk',
          createdAt: '2026-09-15',
          isSystem: true,
        },
        ...accounts,
      ];
    } else {
      accounts = accounts.map((u) =>
        u.username.toLowerCase() === 'kalsoom'
          ? {
              ...u,
              role: 'Technician' as UserRole,
              displayName: 'Kalsoom (Technician)',
              department: 'Hardware & Network Support',
              password: u.password || '123',
            }
          : u
      );
    }

    return accounts;
  });

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_user_accounts`, JSON.stringify(userAccounts));
  }, [userAccounts]);

  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_current_user`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed?.username?.toLowerCase() === 'mohsin') {
          return {
            ...parsed,
            role: 'Technician' as UserRole,
            displayName: 'Mohsin (Technician)',
            password: parsed.password || '123',
          };
        }
        if (parsed?.username?.toLowerCase() === 'kalsoom') {
          return {
            ...parsed,
            role: 'Technician' as UserRole,
            displayName: 'Kalsoom (Technician)',
            password: parsed.password || '123',
          };
        }
        return parsed;
      } catch (e) {
        console.error('Error parsing saved current user', e);
      }
    }
    return defaultUserAccounts[0]; // Default to Mohsin (Technician)
  });

  useEffect(() => {
    if (currentUser) {
      // Keep currentUser role and info in sync with userAccounts
      const matchingAccount = userAccounts.find(
        (u) => u.username.toLowerCase() === currentUser.username.toLowerCase()
      );
      if (matchingAccount && (matchingAccount.role !== currentUser.role || matchingAccount.displayName !== currentUser.displayName)) {
        setCurrentUser(matchingAccount);
        setUserRole(matchingAccount.role);
        localStorage.setItem(`${LOCAL_STORAGE_KEY}_current_user`, JSON.stringify(matchingAccount));
        return;
      }
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_current_user`, JSON.stringify(currentUser));
      setUserRole(currentUser.role);
    } else {
      localStorage.removeItem(`${LOCAL_STORAGE_KEY}_current_user`);
    }
  }, [currentUser, userAccounts]);

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
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_ups_backup_log_sheets`, JSON.stringify(upsBackupChecklistLogSheets));
  }, [upsBackupChecklistLogSheets]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_ups_battery_log_sheets`, JSON.stringify(upsBatteryReplacementLogSheets));
  }, [upsBatteryReplacementLogSheets]);

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

  // Offline Connectivity State & Synchronization Queue
  const [isOnlineState, setIsOnlineState] = useState<boolean>(() =>
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [pendingOfflineCount, setPendingOfflineCount] = useState<number>(() => getOfflineQueue().length);

  // Dispatch API call with automatic offline queue fallback
  const dispatchSync = useCallback(
    (action: string, endpoint: string, method: 'POST' | 'PUT' | 'DELETE' = 'POST', payload?: any) => {
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        enqueueOfflineAction(action, endpoint, method, payload);
        setPendingOfflineCount(getOfflineQueue().length);
        return;
      }
      const opts: RequestInit = {
        method,
        headers: { 'Content-Type': 'application/json' },
      };
      if (payload && method !== 'DELETE') {
        opts.body = JSON.stringify(payload);
      }
      fetch(endpoint, opts)
        .then((res) => {
          if (!res.ok) {
            enqueueOfflineAction(action, endpoint, method, payload);
            setPendingOfflineCount(getOfflineQueue().length);
          }
        })
        .catch(() => {
          enqueueOfflineAction(action, endpoint, method, payload);
          setPendingOfflineCount(getOfflineQueue().length);
        });
    },
    []
  );

  const syncOfflineData = useCallback(async () => {
    const res = await processOfflineQueue();
    setPendingOfflineCount(getOfflineQueue().length);
    if (res.successCount > 0) {
      await refreshDbData();
    }
    return { success: res.successCount, failed: res.failureCount };
  }, [refreshDbData]);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnlineState(true);
      // Auto flush queued mutations on reconnect
      syncOfflineData();
    };
    const handleOffline = () => {
      setIsOnlineState(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [syncOfflineData]);

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

    // Async sync to Mongo with offline fallback
    dispatchSync('Audit Log Entry', '/api/audit-logs', 'POST', newLog);
  };

  // Asset Reference for background backup service without stale closures
  const assetsRef = useRef<AssetItem[]>(assets);
  useEffect(() => {
    assetsRef.current = assets;
  }, [assets]);

  // Asset Crash Prevention & Backup States
  const [backupConfigState, setBackupConfigState] = useState(() => getBackupConfig());
  const [lastBackupTime, setLastBackupTime] = useState<string | null>(null);
  const [lastBackupSnapshot, setLastBackupSnapshot] = useState<AssetBackupSnapshot | null>(null);
  const [backupHistory, setBackupHistory] = useState<AssetBackupSnapshot[]>([]);
  const [isBackupServiceActive, setIsBackupServiceActive] = useState<boolean>(true);
  const [crashRecoveryInfo, setCrashRecoveryInfo] = useState<{
    crashDetected: boolean;
    latestBackup: AssetBackupSnapshot | null;
    reason: string;
  } | null>(null);

  // Refresh backup history from IndexedDB / LocalStorage Mirror
  const refreshBackupHistory = useCallback(async () => {
    try {
      const history = await getBackupHistory();
      setBackupHistory(history);
      if (history.length > 0) {
        setLastBackupSnapshot(history[0]);
        setLastBackupTime(history[0].formattedTime);
      }
    } catch (err) {
      console.warn('Failed to load backup history:', err);
    }
  }, []);

  // Initialize background backup service & crash detection
  useEffect(() => {
    refreshBackupHistory();

    // Check for crash recovery after state initialization
    const timer = setTimeout(() => {
      checkCrashRecovery(assetsRef.current).then((result) => {
        if (result.crashDetected) {
          setCrashRecoveryInfo(result);
        }
      });
    }, 1500);

    // Start periodic background service with lifecycle guards
    const cleanup = startBackgroundBackupService(
      () => assetsRef.current,
      (snapshot) => {
        setLastBackupSnapshot(snapshot);
        setLastBackupTime(snapshot.formattedTime);
        getBackupHistory().then(setBackupHistory);
      }
    );

    return () => {
      clearTimeout(timer);
      cleanup();
    };
  }, [refreshBackupHistory]);

  const triggerManualBackup = useCallback(
    async (notes?: string) => {
      const snapshot = await saveAssetSnapshot(assetsRef.current, 'manual', notes);
      setLastBackupSnapshot(snapshot);
      setLastBackupTime(snapshot.formattedTime);
      await refreshBackupHistory();
      addAuditLog(
        'Asset Storage Backup Created',
        `Manual snapshot ${snapshot.backupId} (${snapshot.assetCount} assets, ${snapshot.sizeKb}KB) saved to browser storage`,
        undefined,
        'info'
      );
      return snapshot;
    },
    [refreshBackupHistory]
  );

  const restoreAssetBackup = useCallback(
    async (backupId: string) => {
      const restored = await restoreBackup(backupId);
      if (restored && Array.isArray(restored) && restored.length > 0) {
        setAssets(restored);
        try {
          localStorage.setItem(`${LOCAL_STORAGE_KEY}_assets`, JSON.stringify(restored));
        } catch (err) {
          console.warn('LocalStorage save error on restore:', err);
        }
        addAuditLog(
          'Asset List Restored from Backup',
          `Restored ${restored.length} assets from snapshot ${backupId}`,
          undefined,
          'warning'
        );
        await refreshBackupHistory();
        setCrashRecoveryInfo(null);
        return true;
      }
      return false;
    },
    [refreshBackupHistory]
  );

  const deleteAssetBackup = useCallback(
    async (backupId: string) => {
      await deleteBackup(backupId);
      await refreshBackupHistory();
    },
    [refreshBackupHistory]
  );

  const clearAllAssetBackups = useCallback(async () => {
    await clearAllBackups();
    await refreshBackupHistory();
    setLastBackupSnapshot(null);
    setLastBackupTime(null);
  }, [refreshBackupHistory]);

  const setBackupIntervalSeconds = useCallback((seconds: number) => {
    setBackupConfig({ intervalSeconds: seconds });
    setBackupConfigState((prev) => ({ ...prev, intervalSeconds: seconds }));
  }, []);

  const dismissCrashRecovery = useCallback(() => {
    if (crashRecoveryInfo?.latestBackup?.backupId) {
      dismissCrashRecoveryService(crashRecoveryInfo.latestBackup.backupId);
    } else {
      dismissCrashRecoveryService();
    }
    setCrashRecoveryInfo(null);
  }, [crashRecoveryInfo]);

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

    // Persist to MongoDB API with offline queue
    dispatchSync(`Create Asset ${newAsset.id}`, '/api/assets', 'POST', newAsset);

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

    // Sync to Mongo with offline queue fallback
    dispatchSync(`Update Asset ${id}`, `/api/assets/${id}`, 'PUT', assetData);

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

    dispatchSync(`Archive Asset ${id}`, `/api/assets/${id}`, 'PUT', { isRemoved: true, status: reason, removalDetails });

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

    dispatchSync(`Restore Asset ${id}`, `/api/assets/${id}`, 'PUT', { isRemoved: false, status: 'Spare', removalDetails: null });

    addAuditLog('Asset Restored', `Asset ${id} restored from archive to active/spare inventory`, id, 'success');
  };

  const deletePermanently = (id: string) => {
    setAssets((prev) => prev.filter((item) => item.id !== id));
    dispatchSync(`Delete Asset ${id}`, `/api/assets/${id}`, 'DELETE');
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

    dispatchSync(`Log Maintenance ${newRecord.id}`, '/api/maintenance', 'POST', newRecord);

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

    dispatchSync(`Issue Toner ${newRecord.id}`, '/api/toner', 'POST', { ...newRecord, updatePrinterLevel });

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

    dispatchSync(`Issue Gate Pass ${newRecord.id}`, '/api/gatepasses', 'POST', newRecord);

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

    dispatchSync(`Update Gate Pass ${id}`, `/api/gatepasses/${id}`, 'PUT', { status, actualReturnDate, securityClearedBy: securityCleared });

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

      dispatchSync('Bulk Import Assets', '/api/assets/bulk', 'POST', { assets: newAssetsBatch });
    }

    const finalRecord: LogisticsReceivingRecord = {
      ...recordData,
      id: newRecordId,
      generatedAssetIds: createdAssetIds.length > 0 ? createdAssetIds : recordData.generatedAssetIds,
      createdAt: new Date().toISOString(),
    };

    setLogisticsReceivingRecords((prev) => [finalRecord, ...prev]);

    dispatchSync(`Logistics Receiving ${finalRecord.id}`, '/api/logistics', 'POST', finalRecord);

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

    dispatchSync(`UPS Service ${newRecord.id}`, '/api/ups-maintenance', 'POST', newRecord);

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

  const addUPSBackupChecklistLogSheet = (
    sheetData: Omit<UPSBackupChecklistLogSheet, 'id' | 'createdAt'>
  ): UPSBackupChecklistLogSheet => {
    const year = new Date().getFullYear();
    const count = upsBackupChecklistLogSheets.length + 1;
    const newId = `LOG-CHK-${year}-${String(count).padStart(3, '0')}`;
    const newSheet: UPSBackupChecklistLogSheet = {
      ...sheetData,
      id: newId,
      createdAt: new Date().toISOString(),
    };
    setUpsBackupChecklistLogSheets((prev) => [newSheet, ...prev]);
    addAuditLog(
      'UPS Backup Checklist Logged',
      `Saved UPS Backup Checklist Log Sheet ${newSheet.sheetNumber} (${newSheet.title}) with ${newSheet.totalItems} items. Inspector: ${newSheet.checkedByName}`,
      undefined,
      'success'
    );
    return newSheet;
  };

  const deleteUPSBackupChecklistLogSheet = (id: string) => {
    const target = upsBackupChecklistLogSheets.find((s) => s.id === id);
    setUpsBackupChecklistLogSheets((prev) => prev.filter((s) => s.id !== id));
    if (target) {
      addAuditLog(
        'UPS Checklist Log Deleted',
        `Deleted UPS Backup Checklist Log Sheet ${target.sheetNumber} (${target.id})`,
        undefined,
        'warning'
      );
    }
  };

  const addUPSBatteryReplacementLogSheet = (
    sheetData: Omit<UPSBatteryReplacementLogSheet, 'id' | 'createdAt'>
  ): UPSBatteryReplacementLogSheet => {
    const year = new Date().getFullYear();
    const count = upsBatteryReplacementLogSheets.length + 1;
    const newId = `LOG-BAT-${year}-${String(count).padStart(3, '0')}`;
    const newSheet: UPSBatteryReplacementLogSheet = {
      ...sheetData,
      id: newId,
      createdAt: new Date().toISOString(),
    };
    setUpsBatteryReplacementLogSheets((prev) => [newSheet, ...prev]);
    addAuditLog(
      'UPS Battery Replacement Logged',
      `Saved UPS Battery Replacement Log Sheet ${newSheet.sheetNumber} (${newSheet.title}) for ${newSheet.totalUnitsReplaced} UPS units (${newSheet.totalBatteriesCount} batteries). Technician: ${newSheet.chiefTechnician}`,
      undefined,
      'success'
    );
    return newSheet;
  };

  const deleteUPSBatteryReplacementLogSheet = (id: string) => {
    const target = upsBatteryReplacementLogSheets.find((s) => s.id === id);
    setUpsBatteryReplacementLogSheets((prev) => prev.filter((s) => s.id !== id));
    if (target) {
      addAuditLog(
        'UPS Battery Log Deleted',
        `Deleted UPS Battery Replacement Log Sheet ${target.sheetNumber} (${target.id})`,
        undefined,
        'warning'
      );
    }
  };

  const addPrinterMaintenanceRecord = (
    recordData: Omit<PrinterMaintenanceRecord, 'id' | 'createdAt'>,
    updateAssetCondition: boolean = true
  ): PrinterMaintenanceRecord => {
    const year = new Date().getFullYear();
    const count = printerMaintenanceRecords.length + 1;
    const newId = `PMR-${year}-${String(count).padStart(3, '0')}`;
    const newRecord: PrinterMaintenanceRecord = {
      ...recordData,
      id: newId,
      createdAt: new Date().toISOString(),
    };

    setPrinterMaintenanceRecords((prev) => [newRecord, ...prev]);

    // Mirror to generic maintenance records
    const genericMntId = `MNT-${year}-P${String(count).padStart(3, '0')}`;
    const genericRecord: MaintenanceRecord = {
      id: genericMntId,
      assetId: recordData.assetId,
      deviceName: recordData.printerName,
      date: recordData.date,
      engineer: recordData.technicianName,
      description: `[Printer ${recordData.serviceType}] ${recordData.issueReported}`,
      partsReplaced: recordData.partsChangedSummary || (recordData.partsChanged && recordData.partsChanged.length > 0 ? recordData.partsChanged.map(p => `${p.quantity}x ${p.partName}`).join(', ') : 'None'),
      cost: recordData.costPkr || 0,
      remarks: `Status: ${recordData.status} | Counter: ${recordData.pageCount || 'N/A'} pages | Test Page: ${recordData.testPagePrinted ? 'Verified' : 'Pending'} | ${recordData.remarks || ''}`,
    };
    setMaintenanceRecords((prev) => [genericRecord, ...prev]);

    // Automatically decrement stock for any matched printer parts used!
    if (recordData.partsChanged && recordData.partsChanged.length > 0) {
      setPrinterParts((prev) =>
        prev.map((part) => {
          const used = recordData.partsChanged.find(
            (p) => (p.partId && p.partId === part.id) || (p.partNumber && p.partNumber.toLowerCase() === part.partNumber.toLowerCase()) || (p.partName && p.partName.toLowerCase() === part.partName.toLowerCase())
          );
          if (used) {
            const newStock = Math.max(0, part.quantityInStock - used.quantity);
            return { ...part, quantityInStock: newStock };
          }
          return part;
        })
      );
    }

    // Update asset condition if requested
    if (updateAssetCondition && recordData.assetId) {
      setAssets((prev) =>
        prev.map((a) => {
          if (a.id === recordData.assetId) {
            return {
              ...a,
              status: recordData.status === 'Completed' ? 'Active' : recordData.status === 'Scrap / Unrepairable' ? 'Scrapped' : 'Under Repair',
              updatedAt: new Date().toISOString(),
            };
          }
          return a;
        })
      );
    }

    addAuditLog(
      'Printer Maintenance & Repair Logged',
      `Logged ${recordData.serviceType} for ${recordData.printerName} (${recordData.model}) [${newId}]. Tech: ${recordData.technicianName}. Parts: ${recordData.partsChangedSummary || 'None'}`,
      recordData.assetId,
      'success'
    );

    return newRecord;
  };

  const updatePrinterMaintenanceRecord = (id: string, updates: Partial<PrinterMaintenanceRecord>) => {
    setPrinterMaintenanceRecords((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ...updates } : r))
    );
    addAuditLog('Printer Maintenance Record Updated', `Updated Printer Maintenance Record ${id}`, undefined, 'info');
  };

  const deletePrinterMaintenanceRecord = (id: string) => {
    const target = printerMaintenanceRecords.find((r) => r.id === id);
    setPrinterMaintenanceRecords((prev) => prev.filter((r) => r.id !== id));
    if (target) {
      addAuditLog(
        'Printer Maintenance Record Deleted',
        `Deleted Printer Maintenance Record ${target.id} (${target.printerName})`,
        target.assetId,
        'warning'
      );
    }
  };

  const addPrinterModel = (modelData: Omit<PrinterModelDefinition, 'id'>): PrinterModelDefinition => {
    const cleanComp = modelData.company.split(' ')[0].toUpperCase().replace(/[^A-Z]/g, '').slice(0, 3) || 'PRT';
    const newId = `PM-${cleanComp}-${Date.now().toString().slice(-4)}`;
    const newModel: PrinterModelDefinition = {
      ...modelData,
      id: newId,
    };
    setPrinterModels((prev) => [newModel, ...prev]);

    // Also auto-add company if not already present
    if (modelData.company && !printerCompanies.includes(modelData.company)) {
      setPrinterCompanies((prev) => [...prev, modelData.company]);
    }

    addAuditLog('Printer Model Added', `Added new printer model: ${modelData.company} ${modelData.modelName} (${modelData.category})`, undefined, 'success');
    return newModel;
  };

  const deletePrinterModel = (id: string) => {
    const target = printerModels.find((m) => m.id === id);
    setPrinterModels((prev) => prev.filter((m) => m.id !== id));
    if (target) {
      addAuditLog('Printer Model Removed', `Removed printer model: ${target.company} ${target.modelName}`, undefined, 'warning');
    }
  };

  const addPrinterCompany = (company: string): boolean => {
    const trimmed = company.trim();
    if (!trimmed) return false;
    if (printerCompanies.some((c) => c.toLowerCase() === trimmed.toLowerCase())) {
      return false;
    }
    setPrinterCompanies((prev) => [...prev, trimmed]);
    addAuditLog('Printer Company Added', `Registered new printer manufacturer / company: ${trimmed}`, undefined, 'info');
    return true;
  };

  const deletePrinterCompany = (company: string) => {
    setPrinterCompanies((prev) => prev.filter((c) => c !== company));
    addAuditLog('Printer Company Removed', `Removed printer manufacturer / company: ${company}`, undefined, 'warning');
  };

  const addTonerModel = (tonerData: Omit<TonerModelDefinition, 'id'>): TonerModelDefinition => {
    const cleanComp = tonerData.company.split(' ')[0].toUpperCase().replace(/[^A-Z]/g, '').slice(0, 3) || 'TNR';
    const newId = `TNR-${cleanComp}-${Date.now().toString().slice(-4)}`;
    const newToner: TonerModelDefinition = {
      ...tonerData,
      id: newId,
    };
    setTonerModels((prev) => [newToner, ...prev]);
    addAuditLog('Toner Model Added', `Registered new toner model: ${newToner.modelCode} for ${newToner.company} (Stock: ${newToner.currentStock})`, undefined, 'success');
    return newToner;
  };

  const updateTonerModelStock = (id: string, newStock: number) => {
    setTonerModels((prev) =>
      prev.map((t) => (t.id === id ? { ...t, currentStock: Math.max(0, newStock) } : t))
    );
  };

  const deleteTonerModel = (id: string) => {
    const target = tonerModels.find((t) => t.id === id);
    setTonerModels((prev) => prev.filter((t) => t.id !== id));
    if (target) {
      addAuditLog('Toner Model Removed', `Removed toner model: ${target.modelCode}`, undefined, 'warning');
    }
  };

  const addPrinterPart = (partData: Omit<PrinterPartItem, 'id'>): PrinterPartItem => {
    const count = printerParts.length + 1;
    const catCode = partData.category.split(' ')[0].toUpperCase().slice(0, 3);
    const newId = `PRT-${catCode}-${String(count).padStart(3, '0')}`;
    const newPart: PrinterPartItem = {
      ...partData,
      id: newId,
    };
    setPrinterParts((prev) => [newPart, ...prev]);
    addAuditLog('Printer Part Added', `Added spare part: ${newPart.partName} (PN: ${newPart.partNumber}, Stock: ${newPart.quantityInStock})`, undefined, 'success');
    return newPart;
  };

  const updatePrinterPartStock = (id: string, newStock: number) => {
    setPrinterParts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, quantityInStock: Math.max(0, newStock) } : p))
    );
  };

  const deletePrinterPart = (id: string) => {
    const target = printerParts.find((p) => p.id === id);
    setPrinterParts((prev) => prev.filter((p) => p.id !== id));
    if (target) {
      addAuditLog('Printer Part Removed', `Removed printer spare part: ${target.partName} (${target.partNumber})`, undefined, 'warning');
    }
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
      upsMaintenanceRecords,
      upsBackupChecklistLogSheets,
      upsBatteryReplacementLogSheets,
      logisticsReceivingRecords,
      tonerIssueRecords,
      gatePassRecords,
      auditLogs,
      loginAttempts,
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
        if (parsed.upsMaintenanceRecords) setUpsMaintenanceRecords(deduplicateItems<UPSMaintenanceRecord>(parsed.upsMaintenanceRecords, (u) => u.id));
        if (parsed.upsBackupChecklistLogSheets) setUpsBackupChecklistLogSheets(deduplicateItems<UPSBackupChecklistLogSheet>(parsed.upsBackupChecklistLogSheets, (s) => s.id));
        if (parsed.upsBatteryReplacementLogSheets) setUpsBatteryReplacementLogSheets(deduplicateItems<UPSBatteryReplacementLogSheet>(parsed.upsBatteryReplacementLogSheets, (s) => s.id));
        if (parsed.logisticsReceivingRecords) setLogisticsReceivingRecords(deduplicateItems<LogisticsReceivingRecord>(parsed.logisticsReceivingRecords, (l) => l.id));
        if (parsed.tonerIssueRecords) setTonerIssueRecords(deduplicateItems<TonerIssueRecord>(parsed.tonerIssueRecords, (t) => t.id));
        if (parsed.gatePassRecords) setGatePassRecords(deduplicateItems<GatePassRecord>(parsed.gatePassRecords, (g) => g.id));
        if (parsed.auditLogs) setAuditLogs(parsed.auditLogs);
        if (parsed.loginAttempts && Array.isArray(parsed.loginAttempts)) setLoginAttempts(parsed.loginAttempts);
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
    setLoginAttempts(initialLoginAttempts);
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
    const trimmed = inputPass.trim();
    // Check user accounts with this role (e.g. Mohsin '123', kalsoom '123', admin_paa 'admin123')
    const hasMatchingUser = userAccounts.some((u) => u.role === role && u.password.trim() === trimmed);
    if (hasMatchingUser) return true;
    const expected = rolePasswords[role] || defaultRolePasswords[role];
    return trimmed === expected.trim();
  };

  const switchRoleWithPassword = (role: UserRole, inputPass: string): { success: boolean; message: string } => {
    const trimmed = inputPass.trim();
    const matchingUser = userAccounts.find(
      (u) => u.role === role && u.password.trim() === trimmed
    );
    const legacyPass = rolePasswords[role] || defaultRolePasswords[role];
    const isLegacyValid = trimmed === legacyPass.trim();

    if (!matchingUser && !isLegacyValid) {
      recordLoginAttempt({
        username: role.toLowerCase(),
        displayName: `${role} Access Key`,
        role: role,
        status: 'Failed',
        failureReason: `Invalid security password for ${role} role access`,
        ipAddress: '192.168.10.22',
        terminal: 'PAA Workshop Terminal 01',
      });
      return { success: false, message: `Invalid security password for ${role} role access.` };
    }

    const assignedUser = matchingUser || userAccounts.find((u) => u.role === role) || null;
    if (assignedUser) {
      setCurrentUser(assignedUser);
    }
    setUserRole(role);
    setIsLoggedIn(true);
    recordLoginAttempt({
      username: assignedUser?.username || role.toLowerCase(),
      displayName: assignedUser?.displayName || `${role} Role User`,
      role: role,
      status: 'Success',
      ipAddress: '192.168.10.22',
      terminal: 'PAA Workshop Terminal 01',
    });
    addAuditLog(
      'User Role Switched',
      `Switched active role to ${role}${assignedUser ? ` (${assignedUser.displayName})` : ''}`,
      undefined,
      'info'
    );
    return { success: true, message: `Successfully authenticated as ${role}` };
  };

  const login = (
    usernameOrRole: string,
    inputPass: string
  ): { success: boolean; message: string; user?: UserAccount } => {
    const trimmedInput = usernameOrRole.trim();
    const trimmedPass = inputPass.trim();

    // 1. Match by username (case-insensitive) e.g., 'Mohsin', 'kalsoom', 'admin_paa'
    const matchedUser = userAccounts.find(
      (u) => u.username.toLowerCase() === trimmedInput.toLowerCase()
    );

    if (matchedUser) {
      const isPasswordMatch = matchedUser.password.trim() === trimmedPass;
      const isBypassValid = Boolean(
        matchedUser.temporaryBypassCode &&
        matchedUser.temporaryBypassCode.trim().toLowerCase() === trimmedPass.toLowerCase() &&
        (!matchedUser.temporaryBypassCodeExpiresAt || new Date(matchedUser.temporaryBypassCodeExpiresAt).getTime() > Date.now())
      );

      if (isPasswordMatch || isBypassValid) {
        setCurrentUser(matchedUser);
        setUserRole(matchedUser.role);
        setIsLoggedIn(true);
        recordLoginAttempt({
          username: matchedUser.username,
          displayName: matchedUser.displayName,
          role: matchedUser.role,
          status: 'Success',
          ipAddress: '192.168.10.22',
          terminal: isBypassValid ? 'PAA Bypass Terminal (Temporary Code)' : 'PAA Workshop Terminal 01',
        });
        addAuditLog(
          'User Logged In',
          `User "${matchedUser.displayName}" (${matchedUser.username}) authenticated successfully as ${matchedUser.role}${isBypassValid ? ' via Temporary Bypass Code' : ''}`,
          undefined,
          isBypassValid ? 'warning' : 'success'
        );
        return {
          success: true,
          message: isBypassValid
            ? `Welcome, ${matchedUser.displayName}! Authenticated via emergency bypass code.`
            : `Welcome, ${matchedUser.displayName}! Logged in as ${matchedUser.role}.`,
          user: matchedUser,
        };
      } else {
        recordLoginAttempt({
          username: matchedUser.username,
          displayName: matchedUser.displayName,
          role: matchedUser.role,
          status: 'Failed',
          failureReason: `Incorrect password or expired bypass code entered for account "${matchedUser.username}"`,
          ipAddress: '192.168.10.22',
          terminal: 'PAA Workshop Terminal 01',
        });
        return { success: false, message: `Incorrect password or expired bypass code for user account "${matchedUser.username}".` };
      }
    }

    // 2. Match by Role Name (e.g. Administrator, Technician, Viewer)
    const matchingRoleUsers = userAccounts.filter(
      (u) => u.role.toLowerCase() === trimmedInput.toLowerCase()
    );

    if (matchingRoleUsers.length > 0) {
      // Check if password or bypass code matches any administrator/technician/viewer user
      const userWithMatchingPass = matchingRoleUsers.find(
        (u) =>
          u.password.trim() === trimmedPass ||
          Boolean(
            u.temporaryBypassCode &&
            u.temporaryBypassCode.trim().toLowerCase() === trimmedPass.toLowerCase() &&
            (!u.temporaryBypassCodeExpiresAt || new Date(u.temporaryBypassCodeExpiresAt).getTime() > Date.now())
          )
      );
      if (userWithMatchingPass) {
        setCurrentUser(userWithMatchingPass);
        setUserRole(userWithMatchingPass.role);
        setIsLoggedIn(true);
        recordLoginAttempt({
          username: userWithMatchingPass.username,
          displayName: userWithMatchingPass.displayName,
          role: userWithMatchingPass.role,
          status: 'Success',
          ipAddress: '192.168.10.22',
          terminal: 'PAA Workshop Terminal 01',
        });
        addAuditLog(
          'User Logged In',
          `Authenticated as ${userWithMatchingPass.displayName} (${userWithMatchingPass.role})`,
          undefined,
          'success'
        );
        return {
          success: true,
          message: `Authenticated as ${userWithMatchingPass.displayName} (${userWithMatchingPass.role})`,
          user: userWithMatchingPass,
        };
      }

      // Check legacy role password
      const targetRole = matchingRoleUsers[0].role;
      const expectedLegacyPass = rolePasswords[targetRole] || defaultRolePasswords[targetRole];
      if (expectedLegacyPass && trimmedPass === expectedLegacyPass.trim()) {
        const fallbackUser = matchingRoleUsers[0];
        setCurrentUser(fallbackUser);
        setUserRole(fallbackUser.role);
        setIsLoggedIn(true);
        recordLoginAttempt({
          username: fallbackUser.username,
          displayName: fallbackUser.displayName,
          role: fallbackUser.role,
          status: 'Success',
          ipAddress: '192.168.10.22',
          terminal: 'PAA Workshop Terminal 01',
        });
        addAuditLog(
          'User Logged In',
          `Authenticated as ${fallbackUser.role} via security password`,
          undefined,
          'success'
        );
        return {
          success: true,
          message: `Authenticated as ${fallbackUser.role}`,
          user: fallbackUser,
        };
      }

      recordLoginAttempt({
        username: matchingRoleUsers[0].username,
        displayName: matchingRoleUsers[0].displayName,
        role: matchingRoleUsers[0].role,
        status: 'Failed',
        failureReason: `Invalid password for ${matchingRoleUsers[0].role} role`,
        ipAddress: '192.168.10.22',
        terminal: 'PAA Workshop Terminal 01',
      });
      return { success: false, message: `Invalid password for ${matchingRoleUsers[0].role} role.` };
    }

    recordLoginAttempt({
      username: trimmedInput,
      displayName: trimmedInput,
      role: 'Viewer',
      status: 'Failed',
      failureReason: `Unregistered account name "${trimmedInput}"`,
      ipAddress: '192.168.10.22',
      terminal: 'PAA Workshop Terminal 01',
    });
    return {
      success: false,
      message: `User account "${trimmedInput}" not recognized. Please use Mohsin, kalsoom, or admin_paa.`,
    };
  };

  const logout = () => {
    setIsLoggedIn(false);
    setCurrentUser(null);
    setUserRole('Viewer');
    addAuditLog('User Logged Out', `Active session ended. User logged out.`, undefined, 'warning');
  };

  const addUserAccount = (userData: Omit<UserAccount, 'id'>): { success: boolean; message: string } => {
    const trimmedUsername = userData.username.trim();
    if (!trimmedUsername) {
      return { success: false, message: 'Username cannot be empty.' };
    }
    const exists = userAccounts.some(
      (u) => u.username.toLowerCase() === trimmedUsername.toLowerCase()
    );
    if (exists) {
      return { success: false, message: `Username "${trimmedUsername}" already exists.` };
    }

    const newUser: UserAccount = {
      ...userData,
      id: `USR-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
      username: trimmedUsername,
      displayName: userData.displayName || trimmedUsername,
      password: userData.password || '123',
      createdAt: new Date().toISOString().split('T')[0],
      isSystem: false,
    };

    setUserAccounts((prev) => [...prev, newUser]);
    addAuditLog(
      'User Account Created',
      `New user account "${newUser.username}" (${newUser.role}) created by ${currentUser?.username || userRole}`,
      undefined,
      'success'
    );
    return { success: true, message: `User account "${trimmedUsername}" created successfully.` };
  };

  const updateUserAccount = (id: string, updates: Partial<UserAccount>) => {
    setUserAccounts((prev) =>
      prev.map((u) => (u.id === id ? { ...u, ...updates } : u))
    );
    if (currentUser?.id === id) {
      setCurrentUser((prev) => (prev ? { ...prev, ...updates } : prev));
    }
    addAuditLog('User Account Updated', `User account details/password updated for ID ${id}`, undefined, 'info');
  };

  const deleteUserAccount = (id: string): { success: boolean; message: string } => {
    const user = userAccounts.find((u) => u.id === id);
    if (!user) return { success: false, message: 'User not found.' };
    if (
      user.username.toLowerCase() === 'mohsin' ||
      user.username.toLowerCase() === 'kalsoom'
    ) {
      return { success: false, message: `Primary administrator account "${user.username}" cannot be deleted.` };
    }

    setUserAccounts((prev) => prev.filter((u) => u.id !== id));
    if (currentUser?.id === id) {
      const fallback = userAccounts.find((u) => u.username.toLowerCase() === 'mohsin') || userAccounts[0];
      setCurrentUser(fallback);
      setUserRole(fallback.role);
    }
    addAuditLog('User Account Deleted', `User account "${user.username}" was removed`, undefined, 'warning');
    return { success: true, message: `User account "${user.username}" deleted.` };
  };

  const triggerPasswordResetEmail = (
    userId: string
  ): { success: boolean; message: string; resetToken: string; email: string } => {
    const user = userAccounts.find((u) => u.id === userId);
    if (!user) {
      return { success: false, message: 'User account not found.', resetToken: '', email: '' };
    }

    const resetToken = `RST-${Math.random().toString(36).substring(2, 8).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;
    const userEmail = user.email || `${user.username.toLowerCase()}@paa.gov.pk`;
    const nowIso = new Date().toISOString();

    setUserAccounts((prev) =>
      prev.map((u) =>
        u.id === userId
          ? {
              ...u,
              lastPasswordResetEmailSentAt: nowIso,
              lastPasswordResetToken: resetToken,
            }
          : u
      )
    );

    addAuditLog(
      'Password Reset Dispatched',
      `Admin triggered password reset link email to ${user.displayName} (${userEmail}) with token ${resetToken}`,
      undefined,
      'warning'
    );

    return {
      success: true,
      message: `Password reset verification instructions sent to ${userEmail}.`,
      resetToken,
      email: userEmail,
    };
  };

  const generateTemporaryBypassCode = (
    userId: string,
    durationMinutes: number = 60
  ): { success: boolean; code: string; expiresAt: string; message: string } => {
    const user = userAccounts.find((u) => u.id === userId);
    if (!user) {
      return { success: false, code: '', expiresAt: '', message: 'User account not found.' };
    }

    // 6-digit emergency bypass code
    const randomCode = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = new Date(Date.now() + durationMinutes * 60 * 1000).toISOString();

    setUserAccounts((prev) =>
      prev.map((u) =>
        u.id === userId
          ? {
              ...u,
              temporaryBypassCode: randomCode,
              temporaryBypassCodeExpiresAt: expiresAt,
            }
          : u
      )
    );

    addAuditLog(
      'Temporary Bypass Code Created',
      `Emergency bypass code generated for technician account "${user.username}" (Valid for ${durationMinutes} minutes)`,
      undefined,
      'danger'
    );

    return {
      success: true,
      code: randomCode,
      expiresAt,
      message: `Bypass code ${randomCode} generated. Valid for ${durationMinutes} min.`,
    };
  };

  const revokeTemporaryBypassCode = (userId: string): { success: boolean; message: string } => {
    const user = userAccounts.find((u) => u.id === userId);
    if (!user) {
      return { success: false, message: 'User account not found.' };
    }

    setUserAccounts((prev) =>
      prev.map((u) =>
        u.id === userId
          ? {
              ...u,
              temporaryBypassCode: undefined,
              temporaryBypassCodeExpiresAt: undefined,
            }
          : u
      )
    );

    addAuditLog(
      'Bypass Code Revoked',
      `Emergency temporary bypass code for "${user.username}" was revoked by administrator`,
      undefined,
      'info'
    );

    return { success: true, message: `Bypass code for "${user.username}" was revoked successfully.` };
  };

  const resetUserPasswordWithToken = (
    userId: string,
    _token: string,
    newPassword: string
  ): { success: boolean; message: string } => {
    const user = userAccounts.find((u) => u.id === userId);
    if (!user) {
      return { success: false, message: 'User account not found.' };
    }
    if (!newPassword || newPassword.trim() === '') {
      return { success: false, message: 'Password cannot be blank.' };
    }

    const trimmed = newPassword.trim();
    setUserAccounts((prev) =>
      prev.map((u) =>
        u.id === userId
          ? {
              ...u,
              password: trimmed,
              lastPasswordResetToken: undefined,
              temporaryBypassCode: undefined,
              temporaryBypassCodeExpiresAt: undefined,
            }
          : u
      )
    );

    addAuditLog(
      'Password Reset Completed',
      `Password successfully reset for "${user.username}" via authorized reset link`,
      undefined,
      'success'
    );

    return { success: true, message: `Password for "${user.username}" updated successfully.` };
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
        loginAttempts,
        recordLoginAttempt,
        clearLoginAttempts,
        facilities,
        settings,
        userRole,
        currentUser,
        userAccounts,
        addUserAccount,
        updateUserAccount,
        deleteUserAccount,
        triggerPasswordResetEmail,
        generateTemporaryBypassCode,
        revokeTemporaryBypassCode,
        resetUserPasswordWithToken,
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
        upsBackupChecklistLogSheets,
        addUPSBackupChecklistLogSheet,
        deleteUPSBackupChecklistLogSheet,
        upsBatteryReplacementLogSheets,
        addUPSBatteryReplacementLogSheet,
        deleteUPSBatteryReplacementLogSheet,
        printerMaintenanceRecords,
        addPrinterMaintenanceRecord,
        updatePrinterMaintenanceRecord,
        deletePrinterMaintenanceRecord,
        printerModels,
        addPrinterModel,
        deletePrinterModel,
        printerCompanies,
        addPrinterCompany,
        deletePrinterCompany,
        tonerModels,
        addTonerModel,
        updateTonerModelStock,
        deleteTonerModel,
        printerParts,
        addPrinterPart,
        updatePrinterPartStock,
        deletePrinterPart,
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
        isOnline: isOnlineState,
        pendingOfflineCount,
        syncOfflineData,
        lastBackupTime,
        lastBackupSnapshot,
        backupIntervalSeconds: backupConfigState.intervalSeconds,
        isBackupServiceActive,
        backupHistory,
        crashRecoveryInfo,
        triggerManualBackup,
        restoreAssetBackup,
        deleteAssetBackup,
        clearAllAssetBackups,
        setBackupIntervalSeconds,
        dismissCrashRecovery,
        refreshBackupHistory,
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
