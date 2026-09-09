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
  | 'Fiber Patch Cord'
  | 'UTP Patch Cord / Network Cable'
  | 'Network Cable'
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

export interface UPSSpecs {
  modelNo: string; // e.g. 'EATON DX 1000H', 'EATON 3000H', 'EATON DX 3000H'
  capacityKvaKw?: string; // e.g. '1KVA / 0.7KW', '3KVA / 2.1KW', '5KVA / 4.5KW'
  kvaRating?: string; // e.g. '1KVA', '2KVA', '3KVA', '5KVA'
  kwRating?: string; // e.g. '0.7KW', '1.4KW', '2.1KW', '4.5KW'
  crnNo?: string; // CRN No from AIIAP inventory, e.g. '2214'
  srNo?: string; // Serial row number e.g. '01', '02'
  tagNo?: string; // e.g. 'UPS-01', 'UPS-02'
  voltage?: string; // e.g. '1KVA / 0.7KW', '230V AC (Input: 220V/230V, Output: 230V ±1%, DC Bus: 36V DC)'
  inputVoltage?: string; // e.g. '220V / 230V AC (160V-290V)'
  outputVoltage?: string; // e.g. '230V AC ± 1% Pure Sine Wave'
  batteryBankVoltage?: string; // e.g. '36V DC' for 1000H (3x12V) or '96V DC' for 3000H (8x12V)
  roomNo?: string; // e.g. '4102', 'Data Center', 'IT STORE', 'Cargo', 'Radar'
  locationDetails?: string; // Building, Floor, Rack / Location description (e.g. 'Level 4')
  backupTime?: string; // e.g. '10 MIN/OK', 'NO BACKUP', '25 Minutes'
  backupStatus?: 'OK' | 'NO BACKUP' | 'Degraded' | 'Critical';
  noOfBatteries?: number; // e.g. 3 for DX 1000H, 8 (or 6) for DX 3000H
  batteryType?: string; // e.g. '12V 7.2Ah VRLA AGM', '12V 9Ah VRLA High-Rate'
  lastBatteryChangeDate?: string; // YYYY-MM-DD
  nextBatteryChangeDate?: string; // YYYY-MM-DD
  batteryHealthPercent?: number; // 0-100%
  loadPercentage?: number; // 0-100%
}

export interface CableSpecs {
  cableType?: string; // 'Cat6', 'Cat6A', 'Cat5e', 'Single-Mode OS2', 'Multi-Mode OM3', 'Multi-Mode OM4'
  connectorType?: string; // 'LC-LC Duplex', 'SC-LC Duplex', 'SC-SC Duplex', 'RJ45 Molded Snagless'
  length?: string; // '1m', '2m', '3m', '5m', '10m', '15m', '20m', '305m Roll'
  shielding?: string; // 'UTP (Unshielded)', 'STP/FTP (Shielded)', 'LSZH Fire Retardant'
  jacketColor?: string; // 'Blue', 'Yellow', 'Aqua', 'Grey', 'Orange', 'White', 'Black'
  bandwidthSpeed?: string; // '1 Gbps', '10 Gbps', '40 Gbps', '100 Gbps'
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
  crnNo?: string;
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
  cableSpecs?: CableSpecs;
  upsSpecs?: UPSSpecs;
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

export interface UPSMaintenanceRecord {
  id: string; // e.g. PAA-UPS-MNT-2026-001
  assetId: string; // link to UPS AssetItem
  upsName: string;
  modelNo: string; // 'EATON DX 1000H' | 'EATON 3000H' | 'EATON DX 3000H' | string
  serialNumber: string;
  voltage: string; // e.g. '230V AC In/Out, 36V DC Bus' or '230V AC In/Out, 96V DC Bus'
  roomNo: string;
  location: string;
  maintenanceDate: string; // YYYY-MM-DD
  batteryChangeDate: string; // YYYY-MM-DD (last replacement date)
  nextBatteryChangeDate?: string; // YYYY-MM-DD (next scheduled change)
  backupTime: string; // Tested on-load backup time e.g. '28 Minutes'
  noOfBatteries: number; // e.g. 3 or 8
  batteryBrandType?: string; // e.g. '12V 7.2Ah VRLA AGM (Phoenix / CSB)'
  batteryCondition: 'Optimal (100%)' | 'Good (85%)' | 'Fair (65%)' | 'Weak / Replace Soon' | 'Defective / Replaced';
  maintenanceType: 'Routine Battery Test & Inspection' | 'Battery Bank Replacement' | 'Quarterly Preventative Maintenance' | 'Capacitor & Inverter Service' | 'Emergency Overhaul';
  engineer: string;
  loadPercentage?: number; // e.g. 60%
  cost?: number; // PKR
  description: string;
  remarks?: string;
  createdAt: string;
}

export interface LogisticsReceivingRecord {
  id: string; // e.g. PAA-RCV-2026-001
  logisticsSupplyRefNo: string; // Supply HQCAA Reference / Delivery Note No
  localSupplyRefNo: string; // Local Supply Reference / LPO No
  receivedDate: string; // YYYY-MM-DD
  category: DeviceCategory;
  brand: string;
  model: string;
  specifications: string;
  quantity: number;
  unitCostPkr?: number;
  totalCostPkr?: number;
  storeLocation: string; // e.g. IT Main Store HQCAA
  receivingPersonName: string;
  receivingPersonDesignation: string;
  receivingPersonDate: string;
  department: Department;
  serialNumbers?: string[];
  generatedAssetIds?: string[];
  remarks?: string;
  createdAt: string;
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

export interface UPSBatteryReplacementEntry {
  sNo: number;
  itemDescription: string;
  location: string;
  date: string;
  replacedBy: string;
  signature: string;
  remarks: string;
}

export interface UPSBackupListItem {
  sNo: number;
  itemDescription: string;
  location: string;
  date: string;
  status: string;
  checkedBy: string;
  remarks: string;
}

export interface UPSBackupListReport {
  id: string;
  reportDate: string;
  checkedByName: string;
  supervisorName: string;
  preparedByName: string;
  preparedBySignature?: string;
  verifiedByOfficerName: string;
  verifiedByOfficerSignature?: string;
  items: UPSBackupListItem[];
}

export interface UPSPredictiveForecast {
  assetId: string;
  tagNo: string;
  modelNo: string;
  capacityKva: number;
  location: string;
  roomNo: string;
  lastReplacementDate: string;
  historySource: 'Verified Log' | 'Maintenance Record' | 'AIIAP Fleet Baseline';
  historyRemarks?: string;
  elapsedDays: number;
  elapsedMonths: number;
  loadPercentage: number;
  loadStressFactor: number;
  envStressFactor: number;
  effectiveLifespanDays: number;
  forecastDate: string;
  daysRemaining: number;
  estimatedTimeToReplacementText: string;
  rulPercent: number; // 0-100 Remaining Useful Life
  urgency: 'critical' | 'high' | 'moderate' | 'healthy';
  urgencyLabel: string;
  batteriesRequired: number;
  batterySpec: string;
  confidenceScore: number;
  recommendation: string;
}

