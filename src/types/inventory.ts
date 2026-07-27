export type Department =
  | 'Fire'
  | 'Cargo'
  | 'CTO'
  | 'CNS'
  | 'HR'
  | 'Medical'
  | 'IT'
  | 'APM'
  | 'DYAPM'
  | 'ENM'
  | 'Works'
  | 'Estate'
  | 'Commercial'
  | 'Flight Inquiry'
  | 'APS'
  | 'RD Block'
  | 'Radar'
  | 'NavAid'
  | 'Supply'
  | 'Accounts'
  | 'Finance'
  | 'Security'
  | 'Administration'
  | 'Engineering'
  | 'Operations'
  | 'Data Center'
  | (string & {});

export type DeviceCategory =
  | 'Desktop PC'
  | 'Laptop'
  | 'Printer'
  | 'Scanner'
  | 'Keyboard'
  | 'Mouse'
  | 'Keyboard & Mouse'
  | 'Network Switch'
  | 'Core Switch'
  | 'Distribution Switch'
  | 'Access Switch'
  | 'Hub'
  | 'Router'
  | 'Firewall'
  | 'Access Point'
  | 'Server'
  | 'UPS'
  | 'Rack'
  | 'Patch Panel'
  | 'IP Phone'
  | 'Monitor'
  | 'NAS Storage'
  | 'Other'
  | (string & {});

export type AssetStatus = 'Active' | 'Spare' | 'Under Repair' | 'Faulty' | 'Scrap' | 'Lost';

export type RemovalReason = 'Scrap' | 'Transfer' | 'Lost' | 'Auction' | 'Damaged' | 'Returned';

export interface LocationInfo {
  building: string;
  floor: string;
  room: string;
}

export interface SystemSpecs {
  processor?: string;
  generation?: string;
  ram?: string;
  ramType?: string;
  hdd?: string;
  ssd?: string;
  graphicsCard?: string;
  motherboard?: string;
  biosVersion?: string;
  osVersion?: string;
  officeVersion?: string;
  antivirus?: string;
  macAddress?: string;
  ipAddress?: string;
  computerName?: string;
}

export interface PrinterSpecs {
  printerType?: 'Laser' | 'Inkjet' | 'Thermal' | 'Dot Matrix';
  colorType?: 'Color' | 'Mono';
  connectionType?: 'Network' | 'USB' | 'Both';
  duplex?: boolean;
  tonerModel?: string;
  tonerLevel?: number; // percentage 0-100
}

export interface ScannerSpecs {
  scannerType?: 'Flatbed' | 'ADF' | 'Network' | 'Portable';
}

export interface NetworkDeviceSpecs {
  totalPorts?: number;
  uplinkPorts?: number;
  sfpPorts?: number;
  vlanSupported?: boolean;
  layer?: 'Layer 2' | 'Layer 3' | 'Layer 4-7';
  firmwareVersion?: string;
  managementIp?: string;
  rackNumber?: string;
}

export interface AssetImages {
  devicePhoto?: string;
  serialPhoto?: string;
  invoice?: string;
  warrantyCard?: string;
}

export interface AssetItem {
  id: string; // Asset ID e.g., PAA-AST-10024
  barcode: string;
  qrCode: string;
  name: string;
  category: DeviceCategory;
  department: Department;
  assignedUser: string;
  paaNumber: string;
  location: LocationInfo;
  vendorCompany: string;
  brand: string;
  model: string;
  serialNumber: string;
  assetTag: string;
  purchaseDate: string;
  warrantyExpiry: string;
  status: AssetStatus;
  isRemoved: boolean;
  removalDetails?: {
    reason: RemovalReason;
    removedBy: string;
    date: string;
    remarks: string;
  };
  images: AssetImages;
  systemSpecs?: SystemSpecs;
  printerSpecs?: PrinterSpecs;
  scannerSpecs?: ScannerSpecs;
  networkSpecs?: NetworkDeviceSpecs;
  pingStatus?: 'Online' | 'Offline' | 'Warning';
  uptime?: string;
  lastMaintenanceDate?: string;
  createdAt: string;
  updatedAt: string;
}

export type TicketPriority = 'Critical' | 'High' | 'Medium' | 'Low';
export type TicketStatus = 'Open' | 'Working' | 'Pending' | 'Closed';

export interface IssueTicket {
  ticketNumber: string; // e.g. PAA-TCK-8821
  assetId: string;
  deviceName: string;
  department: Department;
  user: string;
  description: string;
  dateReported: string;
  priority: TicketPriority;
  assignedEngineer: string;
  resolution?: string;
  closedDate?: string;
  status: TicketStatus;
}

export interface MaintenanceRecord {
  id: string;
  assetId: string;
  deviceName: string;
  date: string;
  engineer: string;
  description: string;
  partsReplaced: string;
  cost: number;
  remarks: string;
}

export interface TonerIssueRecord {
  id: string; // e.g. PAA-TNR-1001
  issuedDate: string; // YYYY-MM-DD
  department: Department;
  assetId?: string;
  printerName?: string;
  tonerModel: string;
  quantity: number;
  issuedBy: string;
  recipientUser?: string;
  remarks?: string;
}

export type GatePassType = 'Returnable (Market Repair)' | 'Non-Returnable (Scrap/Replacement)';
export type GatePassStatus = 'Pending Security Clearance' | 'Out for Market Repair' | 'Returned & Repaired' | 'Completed / Closed';

export interface GatePassRecord {
  id: string; // e.g. PAA-GP-2026-001
  gatePassType: GatePassType;
  issuedDate: string; // YYYY-MM-DD
  expectedReturnDate?: string; // YYYY-MM-DD
  actualReturnDate?: string;
  assetId?: string;
  equipmentName: string;
  category: DeviceCategory;
  serialNumber?: string;
  department: Department;
  vendorMarketWorkshop: string; // e.g. Al-Rehman Electronics & IT Market, Saddar
  vendorContactPerson?: string;
  vendorPhone?: string;
  defectReason: string;
  issuedByOfficer: string;
  carrierPersonName: string;
  carrierCNIC?: string;
  securityClearedBy?: string;
  status: GatePassStatus;
  remarks?: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  assetId?: string;
  details: string;
  type: 'info' | 'warning' | 'danger' | 'success';
}

export interface AirportFacility {
  id: string;
  name: string;
  code: string;
  status: 'Healthy' | 'Backup' | 'Warning' | 'Offline';
  ipAddress: string;
  latencyMs: number;
  bandwidthUsage: string;
}

export type UserRole = 'Administrator' | 'Technician' | 'Viewer';

export interface OrganizationSettings {
  orgName: string;
  subtitle: string;
  airportName: string;
  address: string;
  email: string;
  phone: string;
  logoUrl: string;
  theme: 'dark' | 'light';
  lastBackupDate?: string;
}
