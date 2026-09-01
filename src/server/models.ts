import mongoose, { Schema, Model } from 'mongoose';

// 1. Asset Schema
const LocationSchema = new Schema(
  {
    building: { type: String, default: 'Terminal 1' },
    floor: { type: String, default: 'Ground Floor' },
    room: { type: String, default: 'Server Room' },
  },
  { _id: false }
);

const RemovalDetailsSchema = new Schema(
  {
    reason: { type: String },
    removedBy: { type: String },
    date: { type: String },
    remarks: { type: String },
  },
  { _id: false }
);

const AssetSchema = new Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    barcode: { type: String, required: true, index: true },
    qrCode: { type: String, default: '' },
    name: { type: String, required: true, index: true },
    category: { type: String, required: true, index: true },
    department: { type: String, required: true, index: true },
    assignedUser: { type: String, default: 'Unassigned' },
    paaNumber: { type: String, default: '' },
    location: { type: LocationSchema, default: () => ({}) },
    vendorCompany: { type: String, default: '' },
    brand: { type: String, default: '' },
    model: { type: String, default: '' },
    serialNumber: { type: String, required: true, index: true },
    assetTag: { type: String, default: '' },
    purchaseDate: { type: String, default: '' },
    warrantyExpiry: { type: String, default: '' },
    status: { type: String, default: 'Active', index: true },
    isRemoved: { type: Boolean, default: false, index: true },
    removalDetails: { type: RemovalDetailsSchema },
    images: {
      devicePhoto: { type: String },
      serialPhoto: { type: String },
      invoice: { type: String },
      warrantyCard: { type: String },
    },
    systemSpecs: { type: Schema.Types.Mixed },
    printerSpecs: { type: Schema.Types.Mixed },
    scannerSpecs: { type: Schema.Types.Mixed },
    networkSpecs: { type: Schema.Types.Mixed },
    pingStatus: { type: String, default: 'Online' },
    uptime: { type: String, default: '99.9%' },
    lastMaintenanceDate: { type: String },
    createdAt: { type: String, default: () => new Date().toISOString() },
    updatedAt: { type: String, default: () => new Date().toISOString() },
  },
  { timestamps: true, strict: false }
);

// 2. Issue Ticket Schema
const TicketSchema = new Schema(
  {
    ticketNumber: { type: String, required: true, unique: true, index: true },
    assetId: { type: String, required: true, index: true },
    deviceName: { type: String, required: true },
    department: { type: String, required: true },
    user: { type: String, required: true },
    description: { type: String, required: true },
    dateReported: { type: String, default: () => new Date().toISOString().split('T')[0] },
    priority: { type: String, default: 'Medium' },
    assignedEngineer: { type: String, default: 'tech_paa' },
    resolution: { type: String },
    closedDate: { type: String },
    status: { type: String, default: 'Open', index: true },
  },
  { timestamps: true, strict: false }
);

// 3. Maintenance Record Schema
const MaintenanceSchema = new Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    assetId: { type: String, required: true, index: true },
    deviceName: { type: String, required: true },
    date: { type: String, required: true },
    engineer: { type: String, required: true },
    description: { type: String, required: true },
    partsReplaced: { type: String, default: '' },
    cost: { type: Number, default: 0 },
    remarks: { type: String, default: '' },
  },
  { timestamps: true, strict: false }
);

// 4. Logistics Receiving Record Schema
const LogisticsSchema = new Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    logisticsSupplyRefNo: { type: String, required: true },
    localSupplyRefNo: { type: String, default: '' },
    receivedDate: { type: String, required: true },
    category: { type: String, required: true },
    brand: { type: String, required: true },
    model: { type: String, required: true },
    specifications: { type: String, default: '' },
    quantity: { type: Number, required: true, default: 1 },
    unitCostPkr: { type: Number, default: 0 },
    totalCostPkr: { type: Number, default: 0 },
    storeLocation: { type: String, default: 'IT Main Store HQCAA' },
    receivingPersonName: { type: String, required: true },
    receivingPersonDesignation: { type: String, default: 'Store Officer' },
    receivingPersonDate: { type: String, default: () => new Date().toISOString().split('T')[0] },
    department: { type: String, default: 'Supply' },
    serialNumbers: [{ type: String }],
    generatedAssetIds: [{ type: String }],
    remarks: { type: String, default: '' },
    createdAt: { type: String, default: () => new Date().toISOString() },
  },
  { timestamps: true, strict: false }
);

// 5. Toner Issue Schema
const TonerSchema = new Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    issuedDate: { type: String, required: true },
    department: { type: String, required: true },
    assetId: { type: String },
    printerName: { type: String },
    tonerModel: { type: String, required: true },
    quantity: { type: Number, default: 1 },
    issuedBy: { type: String, required: true },
    recipientUser: { type: String },
    remarks: { type: String, default: '' },
  },
  { timestamps: true, strict: false }
);

// 6. Gate Pass Record Schema
const GatePassSchema = new Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    gatePassType: { type: String, required: true },
    issuedDate: { type: String, required: true },
    expectedReturnDate: { type: String },
    actualReturnDate: { type: String },
    assetId: { type: String },
    equipmentName: { type: String, required: true },
    category: { type: String, default: 'Desktop PC' },
    serialNumber: { type: String },
    department: { type: String, required: true },
    vendorMarketWorkshop: { type: String, required: true },
    vendorContactPerson: { type: String },
    vendorPhone: { type: String },
    defectReason: { type: String, required: true },
    issuedByOfficer: { type: String, required: true },
    carrierPersonName: { type: String, required: true },
    carrierCNIC: { type: String },
    securityClearedBy: { type: String },
    status: { type: String, default: 'Out for Market Repair', index: true },
    remarks: { type: String, default: '' },
  },
  { timestamps: true, strict: false }
);

// 7. Audit Log Schema
const AuditLogSchema = new Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    timestamp: { type: String, required: true },
    actor: { type: String, required: true },
    action: { type: String, required: true },
    assetId: { type: String },
    details: { type: String, required: true },
    type: { type: String, default: 'info' },
  },
  { timestamps: true, strict: false }
);

// 8. Airport Facility Schema
const FacilitySchema = new Schema(
  {
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    code: { type: String, required: true },
    status: { type: String, default: 'Healthy' },
    ipAddress: { type: String, default: '192.168.1.1' },
    latencyMs: { type: Number, default: 4 },
    bandwidthUsage: { type: String, default: '45%' },
  },
  { timestamps: true, strict: false }
);

// 9. Organization Settings Schema
const SettingsSchema = new Schema(
  {
    key: { type: String, required: true, unique: true, default: 'main_config' },
    orgName: { type: String, default: 'Pakistan Airports Authority' },
    subtitle: { type: String, default: 'Jinnah International Airport (JIAP-KHI)' },
    airportName: { type: String, default: 'Jinnah International Airport (JIAP)' },
    address: { type: String, default: 'JIAP, Airport Road, Karachi, Pakistan' },
    email: { type: String, default: 'it.support@caapakistan.com.pk' },
    phone: { type: String, default: '+92-21-99071111' },
    logoUrl: { type: String, default: '' },
    theme: { type: String, default: 'light' },
    lastBackupDate: { type: String },
  },
  { timestamps: true, strict: false }
);

export const AssetModel: Model<any> = mongoose.models.Asset || mongoose.model('Asset', AssetSchema);
export const TicketModel: Model<any> = mongoose.models.Ticket || mongoose.model('Ticket', TicketSchema);
export const MaintenanceModel: Model<any> = mongoose.models.Maintenance || mongoose.model('Maintenance', MaintenanceSchema);
export const LogisticsModel: Model<any> = mongoose.models.Logistics || mongoose.model('Logistics', LogisticsSchema);
export const TonerModel: Model<any> = mongoose.models.Toner || mongoose.model('Toner', TonerSchema);
export const GatePassModel: Model<any> = mongoose.models.GatePass || mongoose.model('GatePass', GatePassSchema);
export const AuditLogModel: Model<any> = mongoose.models.AuditLog || mongoose.model('AuditLog', AuditLogSchema);
export const FacilityModel: Model<any> = mongoose.models.Facility || mongoose.model('Facility', FacilitySchema);
export const SettingsModel: Model<any> = mongoose.models.Settings || mongoose.model('Settings', SettingsSchema);
