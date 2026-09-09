// Active Directory Domain Controller Data & LDAP Engine
// Domain: paa.gov.pk | DC: DC01.paa.gov.pk (10.100.0.5)

export interface ADComputerObject {
  computerName: string;
  sAMAccountName: string;
  dNSHostName: string;
  distinguishedName: string;
  operatingSystem: string;
  operatingSystemVersion: string;
  ipAddress: string;
  macAddress: string;
  assignedUser: string;
  userPrincipalName: string;
  department: string;
  category: 'Desktop PC' | 'Laptop' | 'Server';
  brand: string;
  model: string;
  processor: string;
  ram: string;
  ramType: string;
  ssd: string;
  hdd: string;
  location: {
    building: string;
    floor: string;
    room: string;
  };
  enabled: boolean;
  lastLogonTimestamp: string;
  whenCreated: string;
  objectGUID: string;
}

export const activeDirectoryCatalog: ADComputerObject[] = [
  {
    computerName: 'PAA-CTO-PC01',
    sAMAccountName: 'PAA-CTO-PC01$',
    dNSHostName: 'PAA-CTO-PC01.paa.gov.pk',
    distinguishedName: 'CN=PAA-CTO-PC01,OU=Workstations,OU=CTO,DC=paa,DC=gov,DC=pk',
    operatingSystem: 'Windows 11 Enterprise',
    operatingSystemVersion: '10.0 (Build 22631.3593)',
    ipAddress: '10.100.12.98',
    macAddress: '00:1A:4B:92:1F:10',
    assignedUser: 'Engr. Tariq Mehmood',
    userPrincipalName: 'tariq.mehmood@paa.gov.pk',
    department: 'CTO',
    category: 'Desktop PC',
    brand: 'Dell',
    model: 'OptiPlex 7010 Tower',
    processor: 'Intel Core i7-13700 @ 2.10GHz (16 Cores)',
    ram: '16GB',
    ramType: 'DDR5 4800MHz',
    ssd: '512GB NVMe M.2',
    hdd: '1TB 7200RPM SATA',
    location: {
      building: 'PAA HQ Block A',
      floor: '3rd Floor',
      room: 'Room 304 (CTO Wing)',
    },
    enabled: true,
    lastLogonTimestamp: '2026-09-07 20:45 PKT',
    whenCreated: '2024-03-15 09:12 PKT',
    objectGUID: 'c3f4e2a1-9b88-4c12-8e10-1a2b3c4d5e01',
  },
  {
    computerName: 'PAA-APM-LAP01',
    sAMAccountName: 'PAA-APM-LAP01$',
    dNSHostName: 'PAA-APM-LAP01.paa.gov.pk',
    distinguishedName: 'CN=PAA-APM-LAP01,OU=Laptops,OU=APM,DC=paa,DC=gov,DC=pk',
    operatingSystem: 'Windows 11 Pro 23H2',
    operatingSystemVersion: '10.0 (Build 22631.3447)',
    ipAddress: '10.100.1.50',
    macAddress: 'E4:A7:A0:88:22:9C',
    assignedUser: 'Mr. Sarfraz Ahmed (Airport Manager)',
    userPrincipalName: 'sarfraz.ahmed@paa.gov.pk',
    department: 'Operations',
    category: 'Laptop',
    brand: 'HP',
    model: 'EliteBook 840 G10',
    processor: 'Intel Core i7-1365U vPro (10 Cores)',
    ram: '32GB',
    ramType: 'DDR5 5200MHz',
    ssd: '1TB PCIe Gen4 NVMe',
    hdd: 'None',
    location: {
      building: 'Passenger Terminal Building (PTB)',
      floor: '2nd Floor',
      room: 'Airport Manager Secretariat',
    },
    enabled: true,
    lastLogonTimestamp: '2026-09-07 21:15 PKT',
    whenCreated: '2023-11-20 11:30 PKT',
    objectGUID: 'f8a7d6c5-4b3e-2a10-9f8e-2b3c4d5e6f02',
  },
  {
    computerName: 'PAA-FIN-PC14',
    sAMAccountName: 'PAA-FIN-PC14$',
    dNSHostName: 'PAA-FIN-PC14.paa.gov.pk',
    distinguishedName: 'CN=PAA-FIN-PC14,OU=Workstations,OU=Finance,DC=paa,DC=gov,DC=pk',
    operatingSystem: 'Windows 11 Enterprise 23H2',
    operatingSystemVersion: '10.0 (Build 22631.3296)',
    ipAddress: '10.100.18.22',
    macAddress: '2C:F0:5D:71:A4:8B',
    assignedUser: 'Farhan Zaidi (Senior Accounts Officer)',
    userPrincipalName: 'farhan.zaidi@paa.gov.pk',
    department: 'Finance',
    category: 'Desktop PC',
    brand: 'HP',
    model: 'ProDesk 400 G9 Microtower',
    processor: 'Intel Core i5-13500 @ 2.50GHz (14 Cores)',
    ram: '16GB',
    ramType: 'DDR4 3200MHz',
    ssd: '512GB PCIe NVMe',
    hdd: '1TB SATA',
    location: {
      building: 'PAA HQ Block B',
      floor: '2nd Floor',
      room: 'Finance & Payroll Section',
    },
    enabled: true,
    lastLogonTimestamp: '2026-09-07 19:30 PKT',
    whenCreated: '2024-06-10 14:22 PKT',
    objectGUID: 'a1b2c3d4-e5f6-7a8b-9c0d-3e4f5a6b7c03',
  },
  {
    computerName: 'PAA-FIRE-STN02',
    sAMAccountName: 'PAA-FIRE-STN02$',
    dNSHostName: 'PAA-FIRE-STN02.paa.gov.pk',
    distinguishedName: 'CN=PAA-FIRE-STN02,OU=Workstations,OU=Fire,DC=paa,DC=gov,DC=pk',
    operatingSystem: 'Windows 11 Pro 23H2',
    operatingSystemVersion: '10.0 (Build 22631.2861)',
    ipAddress: '10.100.3.15',
    macAddress: 'B8:27:EB:44:91:0F',
    assignedUser: 'Station Officer Haroon (Emergency Ops)',
    userPrincipalName: 'haroon.fire@paa.gov.pk',
    department: 'Fire & Safety',
    category: 'Desktop PC',
    brand: 'Dell',
    model: 'OptiPlex 3000 Small Form Factor',
    processor: 'Intel Core i5-12500 @ 3.00GHz (6 Cores)',
    ram: '16GB',
    ramType: 'DDR4 3200MHz',
    ssd: '256GB NVMe M.2',
    hdd: '500GB SATA',
    location: {
      building: 'Emergency Fire & Rescue Station (FRS-01)',
      floor: 'Ground Floor',
      room: 'Watch Room & Dispatch Desk',
    },
    enabled: true,
    lastLogonTimestamp: '2026-09-07 21:50 PKT',
    whenCreated: '2023-08-14 08:45 PKT',
    objectGUID: 'd4e5f6a7-b8c9-0d1e-2f3a-4b5c6d7e8f04',
  },
  {
    computerName: 'PAA-RADAR-DSP04',
    sAMAccountName: 'PAA-RADAR-DSP04$',
    dNSHostName: 'PAA-RADAR-DSP04.paa.gov.pk',
    distinguishedName: 'CN=PAA-RADAR-DSP04,OU=Servers,OU=Radar,DC=paa,DC=gov,DC=pk',
    operatingSystem: 'Red Hat Enterprise Linux 9.2 (AD Joined - SSSD/Kerberos)',
    operatingSystemVersion: 'Kernel 5.14.0-284.11.1.el9_2.x86_64',
    ipAddress: '10.100.4.18',
    macAddress: '00:50:56:B9:33:41',
    assignedUser: 'Radar & Avionics Engineering Wing',
    userPrincipalName: 'radar.ops@paa.gov.pk',
    department: 'Radar',
    category: 'Server',
    brand: 'Dell',
    model: 'PowerEdge R650 Rack Server',
    processor: '2x Intel Xeon Silver 4314 @ 2.4GHz (32 Cores)',
    ram: '128GB',
    ramType: 'ECC Registered DDR4',
    ssd: '4x 960GB SAS SSD RAID-10',
    hdd: '4TB Enterprise SAS',
    location: {
      building: 'ATC Tower / Radar Complex',
      floor: '4th Floor',
      room: 'Radar Avionics Server Room Rack 2',
    },
    enabled: true,
    lastLogonTimestamp: '2026-09-07 22:10 PKT',
    whenCreated: '2022-04-18 16:00 PKT',
    objectGUID: 'e5f6a7b8-c9d0-1e2f-3a4b-5c6d7e8f9a05',
  },
  {
    computerName: 'PAA-IT-PC05',
    sAMAccountName: 'PAA-IT-PC05$',
    dNSHostName: 'PAA-IT-PC05.paa.gov.pk',
    distinguishedName: 'CN=PAA-IT-PC05,OU=Workstations,OU=IT,DC=paa,DC=gov,DC=pk',
    operatingSystem: 'Windows 11 Enterprise 23H2',
    operatingSystemVersion: '10.0 (Build 22631.3593)',
    ipAddress: '10.100.12.105',
    macAddress: '34:73:5A:CC:11:02',
    assignedUser: 'Zahid Mehmood (Network Engineer)',
    userPrincipalName: 'zahid.mehmood@paa.gov.pk',
    department: 'IT',
    category: 'Desktop PC',
    brand: 'HP',
    model: 'Z2 G9 Workstation',
    processor: 'Intel Core i9-13900 @ 3.00GHz (24 Cores)',
    ram: '32GB',
    ramType: 'DDR5 5600MHz',
    ssd: '1TB NVMe M.2 Gen4',
    hdd: '2TB Seagate Enterprise',
    location: {
      building: 'PAA HQ Block A',
      floor: '1st Floor',
      room: 'Network Operations Center (NOC)',
    },
    enabled: true,
    lastLogonTimestamp: '2026-09-07 22:05 PKT',
    whenCreated: '2024-01-20 10:15 PKT',
    objectGUID: 'b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d06',
  },
  {
    computerName: 'PAA-COMM-WS02',
    sAMAccountName: 'PAA-COMM-WS02$',
    dNSHostName: 'PAA-COMM-WS02.paa.gov.pk',
    distinguishedName: 'CN=PAA-COMM-WS02,OU=Workstations,OU=Commercial,DC=paa,DC=gov,DC=pk',
    operatingSystem: 'Windows 10 Enterprise LTSC 2021',
    operatingSystemVersion: '10.0 (Build 19044.4046)',
    ipAddress: '10.100.15.42',
    macAddress: 'D8:9D:67:84:3B:EE',
    assignedUser: 'Ayesha Siddiqui (Commercial Billing)',
    userPrincipalName: 'ayesha.comm@paa.gov.pk',
    department: 'Commercial',
    category: 'Desktop PC',
    brand: 'Dell',
    model: 'OptiPlex 5090 Micro',
    processor: 'Intel Core i5-11500T @ 1.50GHz (6 Cores)',
    ram: '16GB',
    ramType: 'DDR4 2666MHz',
    ssd: '256GB M.2 SSD',
    hdd: '1TB 5400RPM SATA',
    location: {
      building: 'Passenger Terminal Building (PTB)',
      floor: 'Concourse Level',
      room: 'Commercial Directorate Room C-12',
    },
    enabled: true,
    lastLogonTimestamp: '2026-09-07 18:20 PKT',
    whenCreated: '2023-05-12 12:00 PKT',
    objectGUID: 'f1e2d3c4-b5a6-9788-0123-456789abcdef',
  },
  {
    computerName: 'PAA-CARGO-CL03',
    sAMAccountName: 'PAA-CARGO-CL03$',
    dNSHostName: 'PAA-CARGO-CL03.paa.gov.pk',
    distinguishedName: 'CN=PAA-CARGO-CL03,OU=Workstations,OU=Cargo,DC=paa,DC=gov,DC=pk',
    operatingSystem: 'Windows 11 Pro 23H2',
    operatingSystemVersion: '10.0 (Build 22631.3085)',
    ipAddress: '10.100.2.88',
    macAddress: '00:E0:4C:68:01:FE',
    assignedUser: 'Rashid Khan (Cargo Manifest Superintendent)',
    userPrincipalName: 'rashid.cargo@paa.gov.pk',
    department: 'Cargo',
    category: 'Desktop PC',
    brand: 'Lenovo',
    model: 'ThinkCentre M70q Tiny',
    processor: 'Intel Core i5-12400T @ 1.80GHz (6 Cores)',
    ram: '16GB',
    ramType: 'DDR4 3200MHz',
    ssd: '512GB NVMe SSD',
    hdd: 'None',
    location: {
      building: 'Cargo & Freight Complex',
      floor: 'Ground Floor',
      room: 'Import Clearance Counter 3',
    },
    enabled: true,
    lastLogonTimestamp: '2026-09-07 20:10 PKT',
    whenCreated: '2024-02-28 15:40 PKT',
    objectGUID: '7a8b9c0d-1e2f-3a4b-5c6d-7e8f9a0b1c07',
  },
  {
    computerName: 'PAA-NAV-SRV01',
    sAMAccountName: 'PAA-NAV-SRV01$',
    dNSHostName: 'PAA-NAV-SRV01.paa.gov.pk',
    distinguishedName: 'CN=PAA-NAV-SRV01,OU=Servers,OU=CNS,DC=paa,DC=gov,DC=pk',
    operatingSystem: 'Windows Server 2022 Datacenter',
    operatingSystemVersion: '10.0 (Build 20348.2461)',
    ipAddress: '10.100.5.10',
    macAddress: '70:69:79:3F:12:00',
    assignedUser: 'CNS Telecom & Navigation Control',
    userPrincipalName: 'cns.server@paa.gov.pk',
    department: 'CNS',
    category: 'Server',
    brand: 'HPE',
    model: 'ProLiant DL380 Gen10',
    processor: '2x Intel Xeon Gold 5218 @ 2.30GHz (32 Cores)',
    ram: '64GB',
    ramType: 'DDR4 2933MHz ECC',
    ssd: '2x 480GB SSD RAID-1 (OS)',
    hdd: '4x 2.4TB 10K SAS RAID-5 (Data)',
    location: {
      building: 'CNS & Avionics Hangar',
      floor: 'Server Room',
      room: 'Rack CNS-01',
    },
    enabled: true,
    lastLogonTimestamp: '2026-09-07 22:15 PKT',
    whenCreated: '2022-09-01 11:20 PKT',
    objectGUID: '9a0b1c2d-3e4f-5a6b-7c8d-9e0f1a2b3c08',
  },
  {
    computerName: 'PAA-AUDIT-LAP02',
    sAMAccountName: 'PAA-AUDIT-LAP02$',
    dNSHostName: 'PAA-AUDIT-LAP02.paa.gov.pk',
    distinguishedName: 'CN=PAA-AUDIT-LAP02,OU=Laptops,OU=Audit,DC=paa,DC=gov,DC=pk',
    operatingSystem: 'Windows 11 Enterprise 23H2',
    operatingSystemVersion: '10.0 (Build 22631.3593)',
    ipAddress: '10.100.1.72',
    macAddress: '48:BA:4E:59:71:03',
    assignedUser: 'Ms. Rabia Noreen (Internal Auditor)',
    userPrincipalName: 'rabia.audit@paa.gov.pk',
    department: 'Audit',
    category: 'Laptop',
    brand: 'Dell',
    model: 'Latitude 5440',
    processor: 'Intel Core i7-1355U (10 Cores)',
    ram: '16GB',
    ramType: 'DDR4 3200MHz',
    ssd: '512GB M.2 PCIe NVMe',
    hdd: 'None',
    location: {
      building: 'PAA HQ Block B',
      floor: '1st Floor',
      room: 'Internal Audit Wing',
    },
    enabled: true,
    lastLogonTimestamp: '2026-09-07 17:45 PKT',
    whenCreated: '2024-04-05 13:10 PKT',
    objectGUID: '5c6d7e8f-9a0b-1c2d-3e4f-5a6b7c8d9e09',
  },
  {
    computerName: 'PAA-FIDS-SRV02',
    sAMAccountName: 'PAA-FIDS-SRV02$',
    dNSHostName: 'PAA-FIDS-SRV02.paa.gov.pk',
    distinguishedName: 'CN=PAA-FIDS-SRV02,OU=Servers,OU=Operations,DC=paa,DC=gov,DC=pk',
    operatingSystem: 'Windows Server 2022 Standard',
    operatingSystemVersion: '10.0 (Build 20348.2405)',
    ipAddress: '10.100.1.15',
    macAddress: '00:1E:67:E2:BB:88',
    assignedUser: 'Flight Information Display (FIDS) Ops',
    userPrincipalName: 'fids.ops@paa.gov.pk',
    department: 'Operations',
    category: 'Server',
    brand: 'Dell',
    model: 'PowerEdge R450 1U',
    processor: 'Intel Xeon Silver 4310 @ 2.10GHz (12 Cores)',
    ram: '32GB',
    ramType: 'ECC Registered DDR4',
    ssd: '2x 480GB NVMe SSD RAID-1',
    hdd: '2TB SAS Enterprise',
    location: {
      building: 'Passenger Terminal Building (PTB)',
      floor: 'Basement NOC',
      room: 'Terminal Server Room Rack 4',
    },
    enabled: true,
    lastLogonTimestamp: '2026-09-07 22:16 PKT',
    whenCreated: '2023-01-15 08:30 PKT',
    objectGUID: '3a4b5c6d-7e8f-9a0b-1c2d-3e4f5a6b7c10',
  },
];

/**
 * Performs an Active Directory LDAP query simulation
 * matches by computer name, IP, user name, or returns a generated active directory object
 */
export function autoFetchActiveDirectory(query: string): ADComputerObject {
  const clean = query.trim().toLowerCase();
  
  // 1. Exact or partial match
  const matched = activeDirectoryCatalog.find(
    (c) =>
      c.computerName.toLowerCase() === clean ||
      c.computerName.toLowerCase().includes(clean) ||
      c.ipAddress.toLowerCase() === clean ||
      c.assignedUser.toLowerCase().includes(clean) ||
      c.sAMAccountName.toLowerCase() === clean
  );

  if (matched) {
    return matched;
  }

  // 2. If user entered a custom name like "PAA-ENG-PC02" or "JIAP-DESK-10"
  const formattedName = query.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '') || 'PAA-WORKSTATION-01';
  const isLap = formattedName.includes('LAP') || formattedName.includes('NOTE') || formattedName.includes('BOOK');
  const isSrv = formattedName.includes('SRV') || formattedName.includes('SERVER') || formattedName.includes('DC');
  
  const category: 'Desktop PC' | 'Laptop' | 'Server' = isLap ? 'Laptop' : isSrv ? 'Server' : 'Desktop PC';
  const lastOctet = Math.floor(Math.random() * 200) + 20;

  return {
    computerName: formattedName,
    sAMAccountName: `${formattedName}$`,
    dNSHostName: `${formattedName}.paa.gov.pk`,
    distinguishedName: `CN=${formattedName},OU=${isLap ? 'Laptops' : isSrv ? 'Servers' : 'Workstations'},DC=paa,DC=gov,DC=pk`,
    operatingSystem: isSrv ? 'Windows Server 2022 Datacenter' : 'Windows 11 Enterprise 23H2',
    operatingSystemVersion: '10.0 (Build 22631.3593)',
    ipAddress: `10.100.${isSrv ? '0' : '12'}.${lastOctet}`,
    macAddress: `00:1A:${Math.floor(Math.random() * 89 + 10)}:${Math.floor(Math.random() * 89 + 10)}:${Math.floor(Math.random() * 89 + 10)}:${Math.floor(Math.random() * 89 + 10)}`,
    assignedUser: 'PAA Domain User',
    userPrincipalName: `${formattedName.toLowerCase().replace(/[^a-z0-9]/g, '')}@paa.gov.pk`,
    department: isSrv ? 'IT' : 'Operations',
    category,
    brand: isSrv ? 'Dell' : isLap ? 'HP' : 'Dell',
    model: isSrv ? 'PowerEdge R650' : isLap ? 'EliteBook 840 G10' : 'OptiPlex 7010 Tower',
    processor: isSrv ? '2x Intel Xeon Silver 4314 (32 Cores)' : isLap ? 'Intel Core i7-1365U vPro' : 'Intel Core i7-13700 (16 Cores)',
    ram: isSrv ? '64GB' : '16GB',
    ramType: 'DDR5',
    ssd: '512GB NVMe SSD',
    hdd: isSrv ? '2TB SAS' : '1TB SATA',
    location: {
      building: 'PAA Headquarters Terminal',
      floor: isSrv ? 'Basement Server Room' : '1st Floor',
      room: 'IT Operations',
    },
    enabled: true,
    lastLogonTimestamp: 'Today (Live Active in AD)',
    whenCreated: '2024-01-10 10:00 PKT',
    objectGUID: 'auto-' + Math.random().toString(36).substring(2, 11),
  };
}
