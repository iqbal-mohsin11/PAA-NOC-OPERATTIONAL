import React, { useState } from 'react';
import { useInventory } from '../context/InventoryContext';
import {
  RefreshCw,
  Server,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Database,
  ArrowRight,
  Zap,
  Sliders,
  Terminal,
  UserCheck,
  HardDrive,
  Clock,
  Laptop,
  Monitor,
  Search,
  Check,
  Play,
  Settings,
  Wifi,
  ExternalLink,
} from 'lucide-react';
import { AssetItem } from '../types/inventory';

interface ADDiscrepancyItem {
  id: string;
  computerName: string;
  adDn: string;
  status: 'New_In_AD' | 'Specs_Mismatch' | 'Stale_Disabled' | 'In_Sync';
  ipAddressAD: string;
  ipAddressSentinel?: string;
  osAD: string;
  osSentinel?: string;
  userAD: string;
  userSentinel?: string;
  matchedAssetId?: string;
  category: 'Desktop PC' | 'Laptop' | 'Server';
  department: string;
  lastLogonAD: string;
  actionTaken?: boolean;
}

export const ADSyncView: React.FC = () => {
  const { assets, updateAsset, addAsset, addAuditLog } = useInventory();

  // Active Directory Domain Controller Configuration
  const [domainName, setDomainName] = useState('paa.gov.pk');
  const [primaryDc, setPrimaryDc] = useState('10.100.0.5 (DC01.paa.gov.pk)');
  const [secondaryDc, setSecondaryDc] = useState('10.100.0.6 (DC02.paa.gov.pk)');
  const [ldapPort, setLdapPort] = useState('636 (LDAPS Encrypted)');
  const [baseDn, setBaseDn] = useState('DC=paa,DC=gov,DC=pk');
  const [bindUser, setBindUser] = useState('CN=SentinelSyncService,OU=ServiceAccounts,DC=paa,DC=gov,DC=pk');
  const [syncInterval, setSyncInterval] = useState('Every 15 Minutes');
  
  // Selected Target OUs
  const [selectedOus, setSelectedOus] = useState<string[]>([
    'OU=Workstations,DC=paa,DC=gov,DC=pk',
    'OU=Servers,DC=paa,DC=gov,DC=pk',
    'OU=Laptops,DC=paa,DC=gov,DC=pk',
    'OU=Domain Users,DC=paa,DC=gov,DC=pk',
  ]);

  // LDAP Connection Testing State
  const [isTestingConn, setIsTestingConn] = useState(false);
  const [connResult, setConnResult] = useState<{ success: boolean; message: string; pingMs: number } | null>({
    success: true,
    message: 'Handshake Successful. SSL Certificate Valid (Expires Dec 2027). 2,840 LDAP directory objects reachable.',
    pingMs: 3,
  });

  // AD Sync Execution State
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  const [syncStep, setSyncStep] = useState('');
  const [lastSyncTime, setLastSyncTime] = useState('Today at 22:45 PKT');

  // Discrepancies & AD Discovered List
  const [adDiscrepancies, setAdDiscrepancies] = useState<ADDiscrepancyItem[]>([
    {
      id: 'AD-DISC-01',
      computerName: 'PAA-CTO-PC01',
      adDn: 'CN=PAA-CTO-PC01,OU=Workstations,OU=CTO,DC=paa,DC=gov,DC=pk',
      status: 'Specs_Mismatch',
      ipAddressAD: '10.100.12.98',
      ipAddressSentinel: '10.100.12.45',
      osAD: 'Windows 11 Enterprise 23H2',
      osSentinel: 'Windows 11 Enterprise 23H2',
      userAD: 'Engr. Tariq Mehmood (tariq.mehmood@paa.gov.pk)',
      userSentinel: 'Engr. Tariq Mehmood',
      matchedAssetId: 'PAA-AST-10001',
      category: 'Desktop PC',
      department: 'CTO',
      lastLogonAD: '2026-07-23 21:15',
    },
    {
      id: 'AD-DISC-02',
      computerName: 'PAA-APM-LAP01',
      adDn: 'CN=PAA-APM-LAP01,OU=Laptops,OU=APM,DC=paa,DC=gov,DC=pk',
      status: 'Specs_Mismatch',
      ipAddressAD: '10.100.1.50',
      ipAddressSentinel: '10.100.1.50',
      osAD: 'Windows 11 Pro 23H2 (Build 22631)',
      osSentinel: 'Windows 10 Pro 22H2',
      userAD: 'Mr. Sarfraz Ahmed (sarfraz.ahmed@paa.gov.pk)',
      userSentinel: 'Mr. Sarfraz Ahmed (Airport Manager)',
      matchedAssetId: 'PAA-AST-10008',
      category: 'Laptop',
      department: 'APM',
      lastLogonAD: '2026-07-23 20:30',
    },
    {
      id: 'AD-DISC-03',
      computerName: 'PAA-FIN-PC14',
      adDn: 'CN=PAA-FIN-PC14,OU=Workstations,OU=Finance,DC=paa,DC=gov,DC=pk',
      status: 'New_In_AD',
      ipAddressAD: '10.100.18.22',
      osAD: 'Windows 11 Enterprise 23H2',
      userAD: 'Farhan Zaidi (farhan.zaidi@paa.gov.pk)',
      category: 'Laptop',
      department: 'Finance',
      lastLogonAD: '2026-07-23 18:05',
    },
    {
      id: 'AD-DISC-04',
      computerName: 'PAA-FIRE-STN02',
      adDn: 'CN=PAA-FIRE-STN02,OU=Workstations,OU=Fire,DC=paa,DC=gov,DC=pk',
      status: 'New_In_AD',
      ipAddressAD: '10.100.3.15',
      osAD: 'Windows 11 Pro 23H2',
      userAD: 'Station Officer Haroon (haroon.fire@paa.gov.pk)',
      category: 'Desktop PC',
      department: 'Fire',
      lastLogonAD: '2026-07-23 19:40',
    },
    {
      id: 'AD-DISC-05',
      computerName: 'PAA-RADAR-DSP04',
      adDn: 'CN=PAA-RADAR-DSP04,OU=Servers,OU=Radar,DC=paa,DC=gov,DC=pk',
      status: 'New_In_AD',
      ipAddressAD: '10.100.4.18',
      osAD: 'Red Hat Enterprise Linux 9.2',
      userAD: 'Radar Avionics Controller',
      category: 'Server',
      department: 'Radar',
      lastLogonAD: '2026-07-23 22:00',
    },
    {
      id: 'AD-DISC-06',
      computerName: 'PAA-OLD-099',
      adDn: 'CN=PAA-OLD-099,OU=DisabledComputers,DC=paa,DC=gov,DC=pk',
      status: 'Stale_Disabled',
      ipAddressAD: '10.100.99.12 (Offline)',
      ipAddressSentinel: '10.100.99.12',
      osAD: 'Windows 7 Enterprise (ACCOUNT DISABLED)',
      osSentinel: 'Windows 7 Enterprise',
      userAD: 'Decommissioned Account',
      userSentinel: 'Accounts Audit Section',
      matchedAssetId: 'PAA-AST-10011',
      category: 'Desktop PC',
      department: 'Accounts',
      lastLogonAD: '2025-11-10 (256 days ago)',
    },
  ]);

  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Test LDAP Connection Handler
  const handleTestConnection = () => {
    setIsTestingConn(true);
    setConnResult(null);

    setTimeout(() => {
      setIsTestingConn(false);
      setConnResult({
        success: true,
        message: 'Active Directory DC01 handshake succeeded! SSL Certificate Valid. LDAP query latency 3ms.',
        pingMs: 3,
      });
    }, 1200);
  };

  // Run Delta Active Directory Sync Simulation Engine
  const handleRunSync = () => {
    setIsSyncing(true);
    setSyncProgress(5);
    setSyncStep('Establishing LDAPS connection with Domain Controller DC01 (10.100.0.5)...');

    const steps = [
      { p: 20, msg: 'Authenticated bind user CN=SentinelSyncService. Fetching Schema Tree...' },
      { p: 40, msg: 'Querying LDAP for OU=Workstations, OU=Servers, OU=Laptops...' },
      { p: 60, msg: 'Comparing 185 Active Directory computer objects against Sentinel Inventory...' },
      { p: 80, msg: 'Reconciling IP Addresses, Operating System Builds, and Last Logon Users...' },
      { p: 100, msg: 'AD Delta Synchronization Complete! Summary generated below.' },
    ];

    let currentStep = 0;
    const interval = setInterval(() => {
      if (currentStep < steps.length) {
        setSyncProgress(steps[currentStep].p);
        setSyncStep(steps[currentStep].msg);
        currentStep++;
      } else {
        clearInterval(interval);
        setIsSyncing(false);
        setLastSyncTime(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) + ' PKT');
        addAuditLog?.('AD Directory Sync Executed', 'Active Directory LDAP delta sync completed successfully. 6 objects evaluated.', undefined, 'success');
      }
    }, 800);
  };

  // Reconcile/Sync single item to Sentinel Asset Inventory
  const handleReconcileItem = (item: ADDiscrepancyItem) => {
    if (item.status === 'New_In_AD') {
      // Create new asset in Sentinel
      const createdAsset = addAsset({
        name: `${item.computerName} (${item.category})`,
        category: item.category,
        department: item.department as any,
        assignedUser: item.userAD,
        location: { building: 'PAA Main Terminal', floor: '1st Floor', room: 'Office Area' },
        brand: item.category === 'Server' ? 'Dell' : 'Dell / HP',
        model: item.category === 'Server' ? 'PowerEdge R650' : 'OptiPlex Enterprise',
        status: 'Active',
        systemSpecs: {
          computerName: item.computerName,
          ipAddress: item.ipAddressAD,
          osVersion: item.osAD,
        },
      });

      setAdDiscrepancies((prev) =>
        prev.map((d) => (d.id === item.id ? { ...d, actionTaken: true, status: 'In_Sync', matchedAssetId: createdAsset.id } : d))
      );
    } else if (item.status === 'Specs_Mismatch' && item.matchedAssetId) {
      // Update existing asset
      updateAsset(item.matchedAssetId, {
        systemSpecs: {
          ipAddress: item.ipAddressAD,
          osVersion: item.osAD,
          computerName: item.computerName,
        },
        assignedUser: item.userAD.split('(')[0].trim(),
      });

      setAdDiscrepancies((prev) =>
        prev.map((d) => (d.id === item.id ? { ...d, actionTaken: true, status: 'In_Sync', ipAddressSentinel: item.ipAddressAD, osSentinel: item.osAD } : d))
      );
    }
  };

  // Sync All High Confidence Changes
  const handleSyncAllDiscrepancies = () => {
    adDiscrepancies.forEach((item) => {
      if (!item.actionTaken && item.status !== 'In_Sync') {
        handleReconcileItem(item);
      }
    });
  };

  // Filter items
  const filteredDiscrepancies = adDiscrepancies.filter((item) => {
    const matchesFilter =
      filterStatus === 'ALL'
        ? true
        : filterStatus === 'NEW'
        ? item.status === 'New_In_AD'
        : filterStatus === 'MISMATCH'
        ? item.status === 'Specs_Mismatch'
        : filterStatus === 'STALE'
        ? item.status === 'Stale_Disabled'
        : item.status === 'In_Sync';

    const matchesSearch =
      item.computerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.userAD.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.ipAddressAD.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  const countNewInAd = adDiscrepancies.filter((d) => d.status === 'New_In_AD' && !d.actionTaken).length;
  const countMismatches = adDiscrepancies.filter((d) => d.status === 'Specs_Mismatch' && !d.actionTaken).length;
  const countStale = adDiscrepancies.filter((d) => d.status === 'Stale_Disabled').length;
  const countInSync = adDiscrepancies.filter((d) => d.status === 'In_Sync' || d.actionTaken).length;

  return (
    <div className="space-y-6">
      {/* Top Banner & Heading */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-2xl bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 p-6 text-white shadow-xl">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-emerald-400">
            <Server className="h-8 w-8" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold tracking-tight">Active Directory (AD) Directory Sync Engine</h2>
              <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-xs font-semibold text-emerald-300 border border-emerald-500/30">
                LDAPS Connected
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-300">
              Bi-directional reconciliation between Windows Active Directory Domain Controller and PAA Sentinel Asset Database.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRunSync}
            disabled={isSyncing}
            className="flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-xs font-bold text-slate-950 shadow-lg shadow-emerald-500/30 hover:bg-emerald-400 disabled:opacity-50 transition"
          >
            <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Syncing Directory...' : 'Trigger AD Delta Sync'}</span>
          </button>
        </div>
      </div>

      {/* Sync Execution Live Progress Bar */}
      {isSyncing && (
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-5 shadow-inner dark:bg-emerald-950/30">
          <div className="flex items-center justify-between text-xs font-bold text-emerald-700 dark:text-emerald-300 mb-2">
            <span className="flex items-center gap-2">
              <Zap className="h-4 w-4 animate-bounce text-emerald-500" />
              <span>Executing LDAP Directory Crawl & Recon...</span>
            </span>
            <span>{syncProgress}%</span>
          </div>

          <div className="h-2.5 w-full rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-300 rounded-full"
              style={{ width: `${syncProgress}%` }}
            ></div>
          </div>
          <p className="mt-2.5 font-mono text-[11px] text-slate-600 dark:text-slate-400">{syncStep}</p>
        </div>
      )}

      {/* Metric Summary Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Unregistered in AD</span>
            <Laptop className="h-4 w-4 text-emerald-500" />
          </div>
          <p className="mt-2 text-2xl font-black text-slate-900 dark:text-white">{countNewInAd}</p>
          <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400">Ready for 1-click import</span>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Attribute Mismatches</span>
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          </div>
          <p className="mt-2 text-2xl font-black text-slate-900 dark:text-white">{countMismatches}</p>
          <span className="text-[10px] font-medium text-amber-600 dark:text-amber-400">IP or OS build changed</span>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Stale / Disabled Objects</span>
            <XCircle className="h-4 w-4 text-rose-500" />
          </div>
          <p className="mt-2 text-2xl font-black text-slate-900 dark:text-white">{countStale}</p>
          <span className="text-[10px] font-medium text-rose-600 dark:text-rose-400">In-active AD computer</span>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">In-Sync Assets</span>
            <CheckCircle2 className="h-4 w-4 text-cyan-500" />
          </div>
          <p className="mt-2 text-2xl font-black text-slate-900 dark:text-white">{countInSync}</p>
          <span className="text-[10px] font-medium text-cyan-600 dark:text-cyan-400">Fully synchronized</span>
        </div>
      </div>

      {/* Main Grid: AD Config Panel + Reconciliation Table */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Active Directory Domain Controller Configuration Panel */}
        <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Sliders className="h-4 w-4 text-emerald-500" />
              <h3 className="font-bold text-slate-900 text-sm dark:text-white">Active Directory Settings</h3>
            </div>
            <span className="text-[11px] text-slate-400 font-medium">Last Sync: {lastSyncTime}</span>
          </div>

          <div className="space-y-3.5 text-xs">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Active Directory Domain</label>
              <input
                type="text"
                value={domainName}
                onChange={(e) => setDomainName(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2 font-mono text-xs font-bold dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Primary DC Endpoint / LDAPS</label>
              <input
                type="text"
                value={primaryDc}
                onChange={(e) => setPrimaryDc(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2 font-mono text-xs font-bold dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Base Search DN</label>
              <input
                type="text"
                value={baseDn}
                onChange={(e) => setBaseDn(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2 font-mono text-[11px] text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Service Account Bind DN</label>
              <input
                type="text"
                value={bindUser}
                onChange={(e) => setBindUser(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2 font-mono text-[10px] text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Target Organizational Units (OUs)</label>
              <div className="space-y-1.5 rounded-xl border border-slate-200 bg-slate-50 p-2.5 dark:border-slate-700 dark:bg-slate-800/50">
                {[
                  'OU=Workstations,DC=paa,DC=gov,DC=pk',
                  'OU=Servers,DC=paa,DC=gov,DC=pk',
                  'OU=Laptops,DC=paa,DC=gov,DC=pk',
                  'OU=Domain Users,DC=paa,DC=gov,DC=pk',
                ].map((ou) => (
                  <label key={ou} className="flex items-center gap-2 cursor-pointer text-[11px]">
                    <input
                      type="checkbox"
                      checked={selectedOus.includes(ou)}
                      onChange={(e) => {
                        if (e.target.checked) setSelectedOus([...selectedOus, ou]);
                        else setSelectedOus(selectedOus.filter((o) => o !== ou));
                      }}
                      className="rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="font-mono text-slate-700 dark:text-slate-300 truncate">{ou.split(',')[0]}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Auto Sync Interval</label>
              <select
                value={syncInterval}
                onChange={(e) => setSyncInterval(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2 font-semibold dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              >
                <option>Every 15 Minutes</option>
                <option>Hourly</option>
                <option>Every 6 Hours</option>
                <option>Daily at Midnight</option>
                <option>Manual Only</option>
              </select>
            </div>

            {/* Test LDAP Connection Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={isTestingConn}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-100 p-2.5 font-bold text-slate-800 hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              >
                <Wifi className={`h-4 w-4 text-emerald-500 ${isTestingConn ? 'animate-ping' : ''}`} />
                <span>{isTestingConn ? 'Testing LDAP Bind...' : 'Test LDAP Connection'}</span>
              </button>

              {connResult && (
                <div
                  className={`mt-2.5 rounded-xl border p-2.5 text-[11px] font-medium ${
                    connResult.success
                      ? 'border-emerald-500/20 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-300'
                      : 'border-rose-500/20 bg-rose-50 text-rose-800 dark:bg-rose-950/20 dark:text-rose-300'
                  }`}
                >
                  <p className="font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                    <span>Connection Healthy ({connResult.pingMs}ms)</span>
                  </p>
                  <p className="mt-1 text-[10px] text-slate-600 dark:text-slate-400">{connResult.message}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Discrepancy & AD Discovery Table */}
        <div className="lg:col-span-2 space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
            <div>
              <h3 className="font-bold text-slate-900 text-sm dark:text-white flex items-center gap-2">
                <Database className="h-4 w-4 text-emerald-500" />
                <span>Active Directory Objects & Reconciliation Delta</span>
              </h3>
              <p className="text-xs text-slate-500">
                Discovered computer objects from LDAPS domain crawl ready to sync or import.
              </p>
            </div>

            <button
              onClick={handleSyncAllDiscrepancies}
              className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-emerald-500 shadow-md shadow-emerald-600/20"
            >
              <Check className="h-3.5 w-3.5" />
              <span>Sync All High Confidence Items</span>
            </button>
          </div>

          {/* Filter Tabs & Search */}
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-1.5">
              {[
                { id: 'ALL', label: 'All Discovered' },
                { id: 'NEW', label: `New in AD (${countNewInAd})` },
                { id: 'MISMATCH', label: `Attribute Diff (${countMismatches})` },
                { id: 'STALE', label: `Disabled (${countStale})` },
                { id: 'SYNCED', label: 'In-Sync' },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFilterStatus(f.id)}
                  className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                    filterStatus === f.id
                      ? 'bg-emerald-600 text-white dark:bg-emerald-500'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-48">
              <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search AD object..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 pl-8 pr-2.5 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              />
            </div>
          </div>

          {/* List of AD Discrepancy Cards */}
          <div className="space-y-3">
            {filteredDiscrepancies.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center dark:border-slate-800">
                <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-500 opacity-60" />
                <p className="mt-2 font-bold text-slate-700 dark:text-slate-300 text-xs">All Directory Objects Reconciled</p>
                <p className="text-[11px] text-slate-400">No discrepancies found for this filter criteria.</p>
              </div>
            ) : (
              filteredDiscrepancies.map((item) => (
                <div
                  key={item.id}
                  className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 transition dark:border-slate-800 dark:bg-slate-800/40"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/60 pb-2 dark:border-slate-700/60">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-black text-slate-900 text-sm dark:text-white">
                        {item.computerName}
                      </span>
                      <span className="rounded-md bg-slate-200 px-2 py-0.5 text-[10px] font-bold text-slate-700 dark:bg-slate-700 dark:text-slate-300">
                        {item.category}
                      </span>
                      <span className="rounded-md bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-400">
                        {item.department}
                      </span>
                    </div>

                    <div>
                      {item.status === 'New_In_AD' && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold text-emerald-600 border border-emerald-500/20">
                          <Zap className="h-3 w-3" /> New in AD (Unregistered)
                        </span>
                      )}
                      {item.status === 'Specs_Mismatch' && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-[10px] font-bold text-amber-600 border border-amber-500/20">
                          <AlertTriangle className="h-3 w-3" /> Attribute Difference
                        </span>
                      )}
                      {item.status === 'Stale_Disabled' && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/10 px-2.5 py-0.5 text-[10px] font-bold text-rose-600 border border-rose-500/20">
                          <XCircle className="h-3 w-3" /> AD Account Disabled
                        </span>
                      )}
                      {item.status === 'In_Sync' && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-cyan-500/10 px-2.5 py-0.5 text-[10px] font-bold text-cyan-600 border border-cyan-500/20">
                          <CheckCircle2 className="h-3 w-3" /> Synchronized
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Attribute Comparison Grid */}
                  <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="rounded-lg bg-white p-2.5 border border-slate-100 dark:bg-slate-900/60 dark:border-slate-800">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                        Active Directory Record (LDAP)
                      </span>
                      <div className="space-y-1 font-mono text-[11px]">
                        <p className="text-slate-800 dark:text-slate-200">
                          <span className="text-slate-400">IP:</span> {item.ipAddressAD}
                        </p>
                        <p className="text-slate-800 dark:text-slate-200">
                          <span className="text-slate-400">OS:</span> {item.osAD}
                        </p>
                        <p className="text-slate-800 dark:text-slate-200 truncate">
                          <span className="text-slate-400">User:</span> {item.userAD}
                        </p>
                      </div>
                    </div>

                    <div className="rounded-lg bg-white p-2.5 border border-slate-100 dark:bg-slate-900/60 dark:border-slate-800">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                        Sentinel Inventory Database
                      </span>
                      <div className="space-y-1 font-mono text-[11px]">
                        <p className="text-slate-800 dark:text-slate-200">
                          <span className="text-slate-400">IP:</span> {item.ipAddressSentinel || 'Not Registered'}
                        </p>
                        <p className="text-slate-800 dark:text-slate-200">
                          <span className="text-slate-400">OS:</span> {item.osSentinel || 'Not Registered'}
                        </p>
                        <p className="text-slate-800 dark:text-slate-200 truncate">
                          <span className="text-slate-400">Asset Tag:</span> {item.matchedAssetId || 'No Match'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Action Row */}
                  <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-200/50 dark:border-slate-800">
                    <span className="text-[10px] text-slate-400 font-mono">
                      Distinguished Name: {item.adDn}
                    </span>

                    {item.status !== 'In_Sync' && !item.actionTaken ? (
                      <button
                        onClick={() => handleReconcileItem(item)}
                        className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-500 shadow transition"
                      >
                        <ArrowRight className="h-3.5 w-3.5" />
                        <span>
                          {item.status === 'New_In_AD' ? 'Import to Sentinel Inventory' : 'Sync AD Values to Asset'}
                        </span>
                      </button>
                    ) : (
                      <span className="text-xs font-bold text-cyan-600 dark:text-cyan-400 flex items-center gap-1">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Reconciled & Saved
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
