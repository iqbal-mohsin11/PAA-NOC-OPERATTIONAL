export interface TechnicianProfile {
  id: string;
  name: string;
  role: string;
  department: string;
  specialization: string;
  contactNumber: string;
  email: string;
  shift: 'Morning (08:00 - 16:00)' | 'Evening (16:00 - 00:00)' | 'Night (00:00 - 08:00)' | 'General Duty';
  status: 'Active / On Duty' | 'In Field Repair' | 'On Call' | 'Off Duty';
  certifications?: string[];
  maxDailyWorkload: number;
  rating: number;
  joinedDate: string;
}

export interface MaintenanceSettingsConfig {
  preventiveMaintenanceIntervalDays: number;
  approvalCostThresholdPkr: number;
  autoDeductPartsStock: boolean;
  requireTestPrintVerification: boolean;
  defaultAssignedTechnician: string;
  autoNotifySupervisorOnHighCost: boolean;
  warrantyReminderDays: number;
  workshopLocation: string;
  dutySupervisor: string;
}

export const DEFAULT_TECHNICIANS: TechnicianProfile[] = [
  {
    id: 'TECH-001',
    name: 'Engr. Mohsin (IT NOC)',
    role: 'Lead Hardware Engineer',
    department: 'Airport IT NOC',
    specialization: 'Laser Printers, Optical Scanners & Core Network Hardware',
    contactNumber: '+92 300 8451102 (Ext. 4101)',
    email: 'mohsin.tech@paa.gov.pk',
    shift: 'Morning (08:00 - 16:00)',
    status: 'Active / On Duty',
    certifications: ['HP Certified Systems Engineer', 'CompTIA A+', 'Cisco CCNA'],
    maxDailyWorkload: 6,
    rating: 4.95,
    joinedDate: '2021-03-15',
  },
  {
    id: 'TECH-002',
    name: 'Muhammad Bilal (IT Tech)',
    role: 'Senior Maintenance Technician',
    department: 'Terminal Hardware Support',
    specialization: 'Fuser Assemblies, Pickup Rollers & Terminal Workstations',
    contactNumber: '+92 301 7729104 (Ext. 4102)',
    email: 'bilal.tech@paa.gov.pk',
    shift: 'Morning (08:00 - 16:00)',
    status: 'In Field Repair',
    certifications: ['LaserJet Overhaul Specialist', 'Hardware Maintenance Level II'],
    maxDailyWorkload: 5,
    rating: 4.85,
    joinedDate: '2022-06-10',
  },
  {
    id: 'TECH-003',
    name: 'Engr. Tariq Mehmood',
    role: 'Hardware Specialist',
    department: 'Airport Electronics Division',
    specialization: 'High-Volume Enterprise Printers, ADF Scanners & Logic Boards',
    contactNumber: '+92 321 4455667 (Ext. 4105)',
    email: 'tariq.mehmood@paa.gov.pk',
    shift: 'General Duty',
    status: 'Active / On Duty',
    certifications: ['Canon & HP Certified Master Tech', 'Industrial Electronics Diploma'],
    maxDailyWorkload: 5,
    rating: 4.9,
    joinedDate: '2020-01-20',
  },
  {
    id: 'TECH-004',
    name: 'Kalsoom (Technician)',
    role: 'Terminal Systems Support',
    department: 'Passenger Terminal Operations',
    specialization: 'Board Diagnostics, Peripheral Sensors & Thermal Receipt Printers',
    contactNumber: '+92 333 9988112 (Ext. 4108)',
    email: 'kalsoom.tech@paa.gov.pk',
    shift: 'Evening (16:00 - 00:00)',
    status: 'On Call',
    certifications: ['IT Systems Specialist', 'Printer Maintenance Fundamentals'],
    maxDailyWorkload: 4,
    rating: 4.75,
    joinedDate: '2023-08-01',
  },
  {
    id: 'TECH-005',
    name: 'Engr. Usman (NOC Tech)',
    role: 'Field Service Engineer',
    department: 'Airport IT NOC',
    specialization: 'Formatter Boards, Power Supplies & Laser Optical Sensors',
    contactNumber: '+92 345 6677889 (Ext. 4110)',
    email: 'usman.tech@paa.gov.pk',
    shift: 'Evening (16:00 - 00:00)',
    status: 'Active / On Duty',
    certifications: ['Electronic Circuit Troubleshooting', 'Network Peripherals Cert.'],
    maxDailyWorkload: 5,
    rating: 4.8,
    joinedDate: '2022-11-15',
  },
  {
    id: 'TECH-006',
    name: 'Senior Engr. Rizwan Ali',
    role: 'Principal Systems Specialist',
    department: 'Power & ATC Infrastructure',
    specialization: 'Online Redundant UPS, Battery Banks & Heavy Duty Overhauls',
    contactNumber: '+92 302 3344556 (Ext. 4120)',
    email: 'rizwan.ali@paa.gov.pk',
    shift: 'General Duty',
    status: 'Active / On Duty',
    certifications: ['EATON Certified Power Engineer', 'Schneider APC Master Tech'],
    maxDailyWorkload: 4,
    rating: 5.0,
    joinedDate: '2018-05-12',
  },
  {
    id: 'TECH-007',
    name: 'Engr. Tariq Aziz (ATC Tech In-charge)',
    role: 'Air Traffic Control Tech Lead',
    department: 'Air Traffic Control Systems',
    specialization: 'ATC Critical Radar Power, Tower Consoles & Redundancy Banks',
    contactNumber: '+92 312 8899001 (Ext. 4125)',
    email: 'tariq.aziz@paa.gov.pk',
    shift: 'Morning (08:00 - 16:00)',
    status: 'Active / On Duty',
    certifications: ['Civil Aviation Authority ATC Hardware Spec', 'Safety Critical Systems'],
    maxDailyWorkload: 4,
    rating: 4.92,
    joinedDate: '2019-09-01',
  },
  {
    id: 'TECH-008',
    name: 'Syed Hamza Shah',
    role: 'Hardware Support Technician',
    department: 'Terminal Hardware Support',
    specialization: 'Scanner Alignment, Paper Handling & Preventative Servicing',
    contactNumber: '+92 304 5566778 (Ext. 4104)',
    email: 'hamza.shah@paa.gov.pk',
    shift: 'Night (00:00 - 08:00)',
    status: 'Active / On Duty',
    certifications: ['Peripherals Support Certified'],
    maxDailyWorkload: 4,
    rating: 4.7,
    joinedDate: '2024-02-10',
  },
];

export const DEFAULT_MAINTENANCE_SETTINGS: MaintenanceSettingsConfig = {
  preventiveMaintenanceIntervalDays: 90,
  approvalCostThresholdPkr: 15000,
  autoDeductPartsStock: true,
  requireTestPrintVerification: true,
  defaultAssignedTechnician: 'Engr. Mohsin (IT NOC)',
  autoNotifySupervisorOnHighCost: true,
  warrantyReminderDays: 30,
  workshopLocation: 'PAA Central IT Hardware Repair Workshop, Ground Floor, Terminal 1',
  dutySupervisor: 'Director IT Operations (PAA HQ)',
};

const TECH_STORAGE_KEY = 'paa_technicians_roster_v1';
const SETTINGS_STORAGE_KEY = 'paa_maintenance_settings_v1';

export const loadTechnicians = (): TechnicianProfile[] => {
  try {
    const raw = localStorage.getItem(TECH_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Failed to load technicians from storage', e);
  }
  return DEFAULT_TECHNICIANS;
};

export const saveTechnicians = (techs: TechnicianProfile[]): void => {
  try {
    localStorage.setItem(TECH_STORAGE_KEY, JSON.stringify(techs));
  } catch (e) {
    console.error('Failed to save technicians to storage', e);
  }
};

export const loadMaintenanceSettings = (): MaintenanceSettingsConfig => {
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_MAINTENANCE_SETTINGS, ...parsed };
    }
  } catch (e) {
    console.error('Failed to load maintenance settings from storage', e);
  }
  return DEFAULT_MAINTENANCE_SETTINGS;
};

export const saveMaintenanceSettings = (settings: MaintenanceSettingsConfig): void => {
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error('Failed to save maintenance settings to storage', e);
  }
};
