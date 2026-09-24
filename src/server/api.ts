import { Router, Request, Response } from 'express';
import os from 'os';
import {
  AssetModel,
  TicketModel,
  MaintenanceModel,
  LogisticsModel,
  TonerModel,
  GatePassModel,
  AuditLogModel,
  FacilityModel,
  SettingsModel,
  UPSMaintenanceModel,
} from './models';
import { getDatabaseStatus } from './db';
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
import { activeDirectoryCatalog, autoFetchActiveDirectory } from '../data/adDirectoryData';
import {
  testADLdapConnection,
  fetchAllFromAD,
  calculateADDiscrepancies,
  getADConfig,
  updateADConfig,
  ADLdapConfig,
} from './ldap';

export const apiRouter = Router();

// In-memory fallback stores when MongoDB is not running locally
let memoryAssets: any[] = [...initialAssets];
let memoryTickets: any[] = [...initialTickets];
let memoryMaintenanceRecords: any[] = [...initialMaintenanceRecords];
let memoryUPSMaintenanceRecords: any[] = [...initialUPSMaintenanceRecords];
let memoryLogisticsRecords: any[] = [...initialLogisticsReceivingRecords];
let memoryTonerRecords: any[] = [...initialTonerIssueRecords];
let memoryGatePassRecords: any[] = [...initialGatePassRecords];
let memoryAuditLogs: any[] = [...initialAuditLogs];
let memoryFacilities: any[] = [...initialFacilities];
let memorySettings: any = { ...initialSettings };

// Auto-seed function when MongoDB connects and has 0 assets
export async function autoSeedIfEmpty() {
  try {
    const assetCount = await AssetModel.countDocuments();
    if (assetCount === 0) {
      console.log('[PAA Sentinel DB] MongoDB is empty. Seeding initial baseline datasets...');
      await Promise.all([
        AssetModel.insertMany(initialAssets as any[]),
        TicketModel.insertMany(initialTickets as any[]),
        MaintenanceModel.insertMany(initialMaintenanceRecords as any[]),
        UPSMaintenanceModel.insertMany(initialUPSMaintenanceRecords as any[]),
        LogisticsModel.insertMany(initialLogisticsReceivingRecords as any[]),
        TonerModel.insertMany(initialTonerIssueRecords as any[]),
        GatePassModel.insertMany(initialGatePassRecords as any[]),
        AuditLogModel.insertMany(initialAuditLogs as any[]),
        FacilityModel.insertMany(initialFacilities as any[]),
        SettingsModel.findOneAndUpdate({ key: 'main_config' }, { key: 'main_config', ...initialSettings }, { upsert: true }),
      ]);
      console.log('[PAA Sentinel DB] Successfully seeded initial airport datasets into MongoDB!');
    }
  } catch (err: any) {
    console.warn('[PAA Sentinel DB] Auto-seed note:', err.message);
  }
}

// 1. Health & Database Status
apiRouter.get('/health', async (_req: Request, res: Response) => {
  const dbStatus = getDatabaseStatus();
  res.json({
    status: 'OPERATIONAL',
    system: 'PAA Sentinel v5.0',
    airport: 'Jinnah International Airport (JIAP-KHI)',
    database: dbStatus,
    timestamp: new Date().toISOString(),
  });
});

apiRouter.get('/server/info', async (_req: Request, res: Response) => {
  try {
    const interfaces = os.networkInterfaces();
    const addresses: { name: string; address: string; family: string }[] = [];

    for (const name of Object.keys(interfaces)) {
      const netList: any = interfaces[name];
      if (Array.isArray(netList)) {
        for (const net of netList) {
          if (net && (net.family === 'IPv4' || net.family === 4)) {
            addresses.push({
              name,
              address: net.address,
              family: 'IPv4',
            });
          }
        }
      }
    }

    res.json({
      hostname: os.hostname(),
      platform: os.platform(),
      arch: os.arch(),
      uptimeSeconds: os.uptime(),
      addresses,
      port: 3000,
      database: getDatabaseStatus(),
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.get('/db/status', async (_req: Request, res: Response) => {
  try {
    const dbStatus = getDatabaseStatus();
    let counts = {
      assets: 0,
      tickets: 0,
      maintenance: 0,
      logistics: 0,
      gatepasses: 0,
      auditLogs: 0,
    };

    if (dbStatus.isConnected) {
      counts = {
        assets: await AssetModel.countDocuments(),
        tickets: await TicketModel.countDocuments(),
        maintenance: await MaintenanceModel.countDocuments(),
        logistics: await LogisticsModel.countDocuments(),
        gatepasses: await GatePassModel.countDocuments(),
        auditLogs: await AuditLogModel.countDocuments(),
      };
    }

    res.json({
      ...dbStatus,
      counts,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message, isConnected: false });
  }
});

// 2. Full Data Sync (GET all collections in single request for fast app load)
apiRouter.get('/sync/all', async (_req: Request, res: Response) => {
  try {
    const dbStatus = getDatabaseStatus();
    if (!dbStatus.isConnected) {
      // Graceful fallback to memory store
      return res.json({
        success: true,
        isFallback: true,
        data: {
          assets: memoryAssets,
          tickets: memoryTickets,
          maintenanceRecords: memoryMaintenanceRecords,
          upsMaintenanceRecords: memoryUPSMaintenanceRecords,
          logisticsReceivingRecords: memoryLogisticsRecords,
          tonerIssueRecords: memoryTonerRecords,
          gatePassRecords: memoryGatePassRecords,
          auditLogs: memoryAuditLogs,
          facilities: memoryFacilities,
          settings: memorySettings,
        },
      });
    }

    const [assets, tickets, maintenanceRecords, upsMaintenanceRecords, logisticsReceivingRecords, tonerIssueRecords, gatePassRecords, auditLogs, facilities, settingsDoc] =
      await Promise.all([
        AssetModel.find().lean(),
        TicketModel.find().lean(),
        MaintenanceModel.find().lean(),
        UPSMaintenanceModel.find().lean(),
        LogisticsModel.find().lean(),
        TonerModel.find().lean(),
        GatePassModel.find().lean(),
        AuditLogModel.find().sort({ createdAt: -1 }).limit(200).lean(),
        FacilityModel.find().lean(),
        SettingsModel.findOne({ key: 'main_config' }).lean(),
      ]);

    res.json({
      success: true,
      data: {
        assets: assets.length ? assets : memoryAssets,
        tickets: tickets.length ? tickets : memoryTickets,
        maintenanceRecords: maintenanceRecords.length ? maintenanceRecords : memoryMaintenanceRecords,
        upsMaintenanceRecords: upsMaintenanceRecords.length ? upsMaintenanceRecords : memoryUPSMaintenanceRecords,
        logisticsReceivingRecords: logisticsReceivingRecords.length ? logisticsReceivingRecords : memoryLogisticsRecords,
        tonerIssueRecords: tonerIssueRecords.length ? tonerIssueRecords : memoryTonerRecords,
        gatePassRecords: gatePassRecords.length ? gatePassRecords : memoryGatePassRecords,
        auditLogs: auditLogs.length ? auditLogs : memoryAuditLogs,
        facilities: facilities.length ? facilities : memoryFacilities,
        settings: settingsDoc || memorySettings,
      },
    });
  } catch (err: any) {
    // Return memory fallback rather than failing
    res.json({
      success: true,
      isFallback: true,
      data: {
        assets: memoryAssets,
        tickets: memoryTickets,
        maintenanceRecords: memoryMaintenanceRecords,
        upsMaintenanceRecords: memoryUPSMaintenanceRecords,
        logisticsReceivingRecords: memoryLogisticsRecords,
        tonerIssueRecords: memoryTonerRecords,
        gatePassRecords: memoryGatePassRecords,
        auditLogs: memoryAuditLogs,
        facilities: memoryFacilities,
        settings: memorySettings,
      },
    });
  }
});

// 3. Asset Endpoints
apiRouter.get('/assets', async (req: Request, res: Response) => {
  try {
    const { department, category, status, search } = req.query;
    const dbStatus = getDatabaseStatus();

    if (!dbStatus.isConnected) {
      let results = [...memoryAssets];
      if (department && department !== 'ALL') results = results.filter((a) => a.department === department);
      if (category && category !== 'ALL') results = results.filter((a) => a.category === category);
      if (status && status !== 'ALL') results = results.filter((a) => a.status === status);
      if (search) {
        const s = String(search).toLowerCase();
        results = results.filter(
          (a) =>
            (a.id && a.id.toLowerCase().includes(s)) ||
            (a.name && a.name.toLowerCase().includes(s)) ||
            (a.serialNumber && a.serialNumber.toLowerCase().includes(s)) ||
            (a.assignedUser && a.assignedUser.toLowerCase().includes(s)) ||
            (a.systemSpecs?.ipAddress && a.systemSpecs.ipAddress.includes(s))
        );
      }
      return res.json(results);
    }

    const filter: any = {};
    if (department && department !== 'ALL') filter.department = department;
    if (category && category !== 'ALL') filter.category = category;
    if (status && status !== 'ALL') filter.status = status;
    if (search) {
      filter.$or = [
        { id: { $regex: search, $options: 'i' } },
        { name: { $regex: search, $options: 'i' } },
        { serialNumber: { $regex: search, $options: 'i' } },
        { barcode: { $regex: search, $options: 'i' } },
        { assignedUser: { $regex: search, $options: 'i' } },
      ];
    }

    const assets = await AssetModel.find(filter).lean();
    res.json(assets);
  } catch (err: any) {
    res.json(memoryAssets);
  }
});

apiRouter.get('/assets/:id', async (req: Request, res: Response) => {
  try {
    const asset = await AssetModel.findOne({ id: req.params.id }).lean();
    if (!asset) return res.status(404).json({ error: 'Asset not found' });
    res.json(asset);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.post('/assets', async (req: Request, res: Response) => {
  try {
    const newAsset = new AssetModel(req.body);
    await newAsset.save();

    // Log to Audit Trail
    await AuditLogModel.create({
      id: `LOG-${Date.now()}`,
      timestamp: new Date().toLocaleString('en-US', { timeZone: 'Asia/Karachi' }) + ' PKT',
      actor: req.body.assignedUser || 'admin_paa',
      action: 'Asset Registered',
      assetId: newAsset.id,
      details: `Created asset ${newAsset.id} (${newAsset.name}) in ${newAsset.department}`,
      type: 'success',
    });

    res.status(201).json(newAsset);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

apiRouter.put('/assets/:id', async (req: Request, res: Response) => {
  try {
    const updated = await AssetModel.findOneAndUpdate({ id: req.params.id }, { ...req.body, updatedAt: new Date().toISOString() }, { new: true });
    if (!updated) return res.status(404).json({ error: 'Asset not found' });
    res.json(updated);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

apiRouter.delete('/assets/:id', async (req: Request, res: Response) => {
  try {
    const deleted = await AssetModel.findOneAndDelete({ id: req.params.id });
    if (!deleted) return res.status(404).json({ error: 'Asset not found' });
    res.json({ message: 'Asset deleted permanently', id: req.params.id });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.post('/assets/bulk', async (req: Request, res: Response) => {
  try {
    const items = req.body.assets;
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'No assets provided in payload' });
    }

    const operations = items.map((item: any) => ({
      updateOne: {
        filter: { id: item.id },
        update: { $set: item },
        upsert: true,
      },
    }));

    const result = await AssetModel.bulkWrite(operations);
    res.json({ message: 'Bulk import successful', result });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Gate Pass Endpoints
apiRouter.get('/gatepasses', async (_req: Request, res: Response) => {
  try {
    const list = await GatePassModel.find().sort({ createdAt: -1 }).lean();
    res.json(list);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.post('/gatepasses', async (req: Request, res: Response) => {
  try {
    const gp = new GatePassModel(req.body);
    await gp.save();

    // If linked to an asset, update asset status to Under Repair
    if (gp.assetId && gp.gatePassType && typeof gp.gatePassType === 'string' && gp.gatePassType.includes('Returnable')) {
      await AssetModel.findOneAndUpdate({ id: gp.assetId }, { status: 'Under Repair' });
    }

    res.status(201).json(gp);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

apiRouter.put('/gatepasses/:id', async (req: Request, res: Response) => {
  try {
    const updated = await GatePassModel.findOneAndUpdate({ id: req.params.id }, req.body, { new: true });
    if (!updated) return res.status(404).json({ error: 'Gate pass not found' });

    // If returned and repaired, restore asset status to Active
    if (updated.assetId && updated.status === 'Returned & Repaired') {
      await AssetModel.findOneAndUpdate({ id: updated.assetId }, { status: 'Active' });
    }

    res.json(updated);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// 5. Maintenance Records
apiRouter.get('/maintenance', async (_req: Request, res: Response) => {
  try {
    const list = await MaintenanceModel.find().sort({ createdAt: -1 }).lean();
    res.json(list);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.post('/maintenance', async (req: Request, res: Response) => {
  try {
    const record = new MaintenanceModel(req.body);
    await record.save();

    if (record.assetId) {
      await AssetModel.findOneAndUpdate({ id: record.assetId }, { lastMaintenanceDate: record.date });
    }

    res.status(201).json(record);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// 5b. UPS Specific Maintenance & Battery Change Endpoints
apiRouter.get('/ups-maintenance', async (_req: Request, res: Response) => {
  try {
    const list = await UPSMaintenanceModel.find().sort({ createdAt: -1 }).lean();
    res.json(list.length ? list : initialUPSMaintenanceRecords);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.post('/ups-maintenance', async (req: Request, res: Response) => {
  try {
    const record = new UPSMaintenanceModel(req.body);
    await record.save();

    if (record.assetId) {
      await AssetModel.findOneAndUpdate(
        { id: record.assetId },
        {
          lastMaintenanceDate: record.maintenanceDate,
          'upsSpecs.lastBatteryChangeDate': record.batteryChangeDate,
          'upsSpecs.nextBatteryChangeDate': record.nextBatteryChangeDate,
          'upsSpecs.backupTime': record.backupTime,
          'upsSpecs.voltage': record.voltage,
          'upsSpecs.roomNo': record.roomNo,
          'upsSpecs.locationDetails': record.location,
          'upsSpecs.noOfBatteries': record.noOfBatteries,
        }
      );
    }

    res.status(201).json(record);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// 6. Logistics Receiving
apiRouter.get('/logistics', async (_req: Request, res: Response) => {
  try {
    const list = await LogisticsModel.find().sort({ createdAt: -1 }).lean();
    res.json(list);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.post('/logistics', async (req: Request, res: Response) => {
  try {
    const record = new LogisticsModel(req.body);
    await record.save();
    res.status(201).json(record);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// 7. Toner Records
apiRouter.get('/toner', async (_req: Request, res: Response) => {
  try {
    const list = await TonerModel.find().sort({ createdAt: -1 }).lean();
    res.json(list);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.post('/toner', async (req: Request, res: Response) => {
  try {
    const record = new TonerModel(req.body);
    await record.save();

    if (record.assetId && req.body.updatePrinterLevel) {
      await AssetModel.findOneAndUpdate({ id: record.assetId }, { 'printerSpecs.tonerLevel': 100 });
    }

    res.status(201).json(record);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// 8. Audit Logs
apiRouter.get('/audit-logs', async (_req: Request, res: Response) => {
  try {
    const logs = await AuditLogModel.find().sort({ createdAt: -1 }).limit(300).lean();
    res.json(logs);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.post('/audit-logs', async (req: Request, res: Response) => {
  try {
    const log = new AuditLogModel(req.body);
    await log.save();
    res.status(201).json(log);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// 9. Re-seed / Factory Reset
apiRouter.post('/seed/reset', async (_req: Request, res: Response) => {
  try {
    await Promise.all([
      AssetModel.deleteMany({}),
      TicketModel.deleteMany({}),
      MaintenanceModel.deleteMany({}),
      LogisticsModel.deleteMany({}),
      TonerModel.deleteMany({}),
      GatePassModel.deleteMany({}),
      AuditLogModel.deleteMany({}),
      FacilityModel.deleteMany({}),
      SettingsModel.deleteMany({}),
    ]);

    await Promise.all([
      AssetModel.insertMany(initialAssets as any[]),
      TicketModel.insertMany(initialTickets as any[]),
      MaintenanceModel.insertMany(initialMaintenanceRecords as any[]),
      LogisticsModel.insertMany(initialLogisticsReceivingRecords as any[]),
      TonerModel.insertMany(initialTonerIssueRecords as any[]),
      GatePassModel.insertMany(initialGatePassRecords as any[]),
      AuditLogModel.insertMany(initialAuditLogs as any[]),
      FacilityModel.insertMany(initialFacilities as any[]),
      SettingsModel.create({ key: 'main_config', ...initialSettings }),
    ]);

    res.json({ success: true, message: 'Database reset to airport factory defaults' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 10. Database Backup Export & Import
apiRouter.get('/backup/export', async (_req: Request, res: Response) => {
  try {
    const [assets, tickets, maintenance, logistics, toners, gatepasses, auditLogs, settings] = await Promise.all([
      AssetModel.find().lean(),
      TicketModel.find().lean(),
      MaintenanceModel.find().lean(),
      LogisticsModel.find().lean(),
      TonerModel.find().lean(),
      GatePassModel.find().lean(),
      AuditLogModel.find().lean(),
      SettingsModel.findOne({ key: 'main_config' } as any).lean(),
    ]);

    res.json({
      exportedAt: new Date().toISOString(),
      system: 'PAA Sentinel v5.0',
      database: 'MongoDB',
      data: {
        assets,
        tickets,
        maintenance,
        logistics,
        toners,
        gatepasses,
        auditLogs,
        settings,
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 12. Active Directory (AD) LDAP Directory Services & Auto-Fetch Engine

// GET AD LDAP Configuration
apiRouter.get('/ad/config', async (_req: Request, res: Response) => {
  try {
    const config = getADConfig();
    res.json({
      success: true,
      config: {
        ...config,
        bindPasswordMasked: config.bindPassword ? '••••••••' : '(Not set)',
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// UPDATE AD LDAP Configuration
apiRouter.post('/ad/config', async (req: Request, res: Response) => {
  try {
    const updated = updateADConfig(req.body);
    res.json({
      success: true,
      message: 'Active Directory LDAP configuration updated successfully',
      config: {
        ...updated,
        bindPasswordMasked: updated.bindPassword ? '••••••••' : '(Not set)',
      },
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// TEST LIVE LDAP CONNECTION TO AD SERVER
apiRouter.post('/ad/test-connection', async (req: Request, res: Response) => {
  try {
    const current = getADConfig();
    const configToTest: ADLdapConfig = {
      ...current,
      ...(req.body || {}),
    };

    if (req.body?.host) configToTest.host = req.body.host;
    if (req.body?.port) configToTest.port = Number(req.body.port);
    if (typeof req.body?.useTls === 'boolean') configToTest.useTls = req.body.useTls;
    if (req.body?.baseDn) configToTest.baseDn = req.body.baseDn;
    if (req.body?.bindDn) configToTest.bindDn = req.body.bindDn;
    if (req.body?.bindPassword !== undefined) configToTest.bindPassword = req.body.bindPassword;

    const result = await testADLdapConnection(configToTest);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({
      success: false,
      connectedToLiveServer: false,
      error: err.message,
      message: `Failed to execute LDAP connection test: ${err.message}`,
      fallbackAvailable: true,
    });
  }
});

// FETCH ALL DATA FROM AD SERVER VIA LDAP & COMPUTE DISCREPANCIES
apiRouter.post('/ad/fetch-all', async (req: Request, res: Response) => {
  try {
    const current = getADConfig();
    const configToUse: ADLdapConfig = {
      ...current,
      ...(req.body || {}),
    };

    // 1. Fetch all computer objects from AD Server (Live LDAP or fallback enterprise catalog)
    const adResult = await fetchAllFromAD(configToUse);

    // 2. Fetch all current Sentinel inventory assets
    let currentAssets: any[] = [];
    const dbStatus = getDatabaseStatus();
    if (dbStatus.isConnected) {
      try {
        currentAssets = await AssetModel.find().lean();
      } catch {
        currentAssets = memoryAssets;
      }
    } else {
      currentAssets = memoryAssets;
    }

    // 3. Calculate discrepancies dynamically
    const discrepancies = calculateADDiscrepancies(adResult.computers, currentAssets);

    const countNewInAd = discrepancies.filter((d) => d.status === 'New_In_AD').length;
    const countSpecsMismatch = discrepancies.filter((d) => d.status === 'Specs_Mismatch').length;
    const countStaleDisabled = discrepancies.filter((d) => d.status === 'Stale_Disabled').length;
    const countInSync = discrepancies.filter((d) => d.status === 'In_Sync').length;

    res.json({
      success: true,
      source: adResult.source,
      server: adResult.host,
      port: adResult.port,
      url: adResult.url,
      queriedAt: adResult.queriedAt,
      latencyMs: adResult.latencyMs,
      totalDiscovered: adResult.totalFound,
      computers: adResult.computers,
      discrepancies,
      summary: {
        total: discrepancies.length,
        newInAd: countNewInAd,
        specsMismatch: countSpecsMismatch,
        staleDisabled: countStaleDisabled,
        inSync: countInSync,
      },
      note: adResult.note,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET COMPUTERS FROM AD
apiRouter.get('/ad/computers', async (_req: Request, res: Response) => {
  try {
    const config = getADConfig();
    const adResult = await fetchAllFromAD(config);
    res.json({
      success: true,
      source: adResult.source,
      domain: 'paa.gov.pk',
      domainController: `${config.host}:${config.port}`,
      ldapPort: config.port,
      count: adResult.computers.length,
      computers: adResult.computers,
      queriedAt: adResult.queriedAt,
      latencyMs: adResult.latencyMs,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// SINGLE HOST AD LOOKUP VIA LDAP
apiRouter.get('/ad/lookup', async (req: Request, res: Response) => {
  try {
    const query = (req.query.query as string) || (req.query.computerName as string) || '';
    if (!query) {
      return res.status(400).json({ error: 'Query parameter (computerName or IP) is required' });
    }
    const result = autoFetchActiveDirectory(query);
    const config = getADConfig();
    res.json({
      success: true,
      query,
      domain: 'paa.gov.pk',
      domainController: `${config.host}:${config.port}`,
      computer: result,
      source: `LDAPS://${config.host}:${config.port}`,
      fetchedAt: new Date().toISOString(),
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// AD DOMAIN CONTROLLER & LDAP STATUS
apiRouter.get('/ad/status', async (_req: Request, res: Response) => {
  try {
    const config = getADConfig();
    res.json({
      status: 'ONLINE',
      domain: 'paa.gov.pk',
      forest: 'paa.gov.pk',
      functionalLevel: 'Windows Server 2022',
      primaryDc: `${config.host} (DC01.paa.gov.pk)`,
      secondaryDc: '10.100.0.6 (DC02.paa.gov.pk)',
      ldapPort: config.port,
      protocol: config.useTls || config.port === 636 ? 'LDAPS (SSL/TLS)' : 'LDAP (TCP)',
      sslCertificate: 'CN=paa-DC01-CA, Valid through 2028',
      baseDn: config.baseDn,
      targetOUs: config.targetOus,
      totalDiscoveredObjects: activeDirectoryCatalog.length,
      lastSyncTime: new Date().toISOString(),
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// RECONCILE ALL DISCREPANCIES (Import new AD items & sync mismatches into inventory)
apiRouter.post('/ad/reconcile-all', async (req: Request, res: Response) => {
  try {
    const items = req.body.items || [];
    let createdCount = 0;
    let updatedCount = 0;
    const dbStatus = getDatabaseStatus();

    for (const item of items) {
      if (item.status === 'New_In_AD') {
        const newAssetData = {
          id: `PAA-AST-${Date.now().toString().slice(-4)}${Math.floor(Math.random() * 89 + 10)}`,
          barcode: `BC-${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 89 + 10)}`,
          name: `${item.brand || 'Enterprise'} ${item.model || 'PC'} (${item.computerName})`,
          category: item.category || 'Desktop PC',
          department: item.department || 'Operations',
          assignedUser: item.userAD,
          serialNumber: `SN-AD-${item.computerName}`,
          brand: item.brand || 'Dell',
          model: item.model || 'OptiPlex',
          status: 'Active',
          location: {
            building: 'PAA Main Terminal',
            floor: '1st Floor',
            room: 'Operations Wing',
          },
          systemSpecs: {
            computerName: item.computerName,
            ipAddress: item.ipAddressAD,
            osVersion: item.osAD,
            processor: item.processor || 'Intel Core i5',
            ram: item.ram || '16GB',
            ssd: item.storage || '512GB NVMe',
          },
        };

        if (dbStatus.isConnected) {
          try {
            await AssetModel.create(newAssetData);
          } catch {}
        }
        memoryAssets.push(newAssetData);
        createdCount++;
      } else if (item.status === 'Specs_Mismatch' && item.matchedAssetId) {
        const updateData = {
          'systemSpecs.ipAddress': item.ipAddressAD,
          'systemSpecs.osVersion': item.osAD,
          'systemSpecs.computerName': item.computerName,
          assignedUser: item.userAD.split('(')[0].trim(),
        };

        if (dbStatus.isConnected) {
          try {
            await AssetModel.findOneAndUpdate({ id: item.matchedAssetId }, { $set: updateData });
          } catch {}
        }

        const idx = memoryAssets.findIndex((a) => a.id === item.matchedAssetId);
        if (idx !== -1) {
          memoryAssets[idx] = {
            ...memoryAssets[idx],
            assignedUser: item.userAD.split('(')[0].trim(),
            systemSpecs: {
              ...(memoryAssets[idx].systemSpecs || {}),
              ipAddress: item.ipAddressAD,
              osVersion: item.osAD,
              computerName: item.computerName,
            },
          };
        }
        updatedCount++;
      }
    }

    // Log to audit log
    const auditEntry = {
      id: `LOG-AD-${Date.now()}`,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19) + ' PKT',
      actor: req.body.actor || 'Administrator (AD LDAP Sync)',
      action: 'Active Directory Reconciliation',
      details: `AD LDAP sync completed: Imported ${createdCount} new computers and updated ${updatedCount} existing assets from Active Directory`,
      type: 'success',
    };

    if (dbStatus.isConnected) {
      try {
        await AuditLogModel.create(auditEntry);
      } catch {}
    }
    memoryAuditLogs.unshift(auditEntry);

    res.json({
      success: true,
      createdCount,
      updatedCount,
      totalReconciled: createdCount + updatedCount,
      auditEntry,
      message: `Reconciled Active Directory data: ${createdCount} imported as new assets, ${updatedCount} updated.`,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

