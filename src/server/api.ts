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
} from './models';
import { getDatabaseStatus } from './db';
import {
  initialAssets,
  initialTickets,
  initialMaintenanceRecords,
  initialAuditLogs,
  initialFacilities,
  initialSettings,
  initialTonerIssueRecords,
  initialGatePassRecords,
  initialLogisticsReceivingRecords,
} from '../data/mockData';

export const apiRouter = Router();

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
      return res.status(503).json({
        error: 'MongoDB is not connected',
        fallback: true,
      });
    }

    const [assets, tickets, maintenanceRecords, logisticsReceivingRecords, tonerIssueRecords, gatePassRecords, auditLogs, facilities, settingsDoc] =
      await Promise.all([
        AssetModel.find().lean(),
        TicketModel.find().lean(),
        MaintenanceModel.find().lean(),
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
        assets: assets.length ? assets : initialAssets,
        tickets: tickets.length ? tickets : initialTickets,
        maintenanceRecords: maintenanceRecords.length ? maintenanceRecords : initialMaintenanceRecords,
        logisticsReceivingRecords: logisticsReceivingRecords.length ? logisticsReceivingRecords : initialLogisticsReceivingRecords,
        tonerIssueRecords: tonerIssueRecords.length ? tonerIssueRecords : initialTonerIssueRecords,
        gatePassRecords: gatePassRecords.length ? gatePassRecords : initialGatePassRecords,
        auditLogs: auditLogs.length ? auditLogs : initialAuditLogs,
        facilities: facilities.length ? facilities : initialFacilities,
        settings: settingsDoc || initialSettings,
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Asset Endpoints
apiRouter.get('/assets', async (req: Request, res: Response) => {
  try {
    const { department, category, status, search } = req.query;
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
    res.status(500).json({ error: err.message });
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
